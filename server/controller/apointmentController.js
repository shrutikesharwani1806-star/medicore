import asyncHandler from "express-async-handler";
import Appointment from "../models/apointmentModel.js";
import User from "../models/userModel.js";
import Payment from "../models/paymentModel.js";
import { sendEmail } from "../config/emailService.js";
import { notifyBookingConfirmed } from "../services/smsService.js";


// Constants for pricing
const ADMIN_SHARE = 20;       // ₹20 goes to admin
const BOOKING_FEE = 50;       // ₹50 booking fee goes to admin

// @desc    Book a new appointment
// @route   POST /api/appointment/book/:doctorId
const bookAppointment = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { date, slot, symptoms, type, report } = req.body;
    const patientId = req.user._id;

    // 1. Check if the doctor exists and is active
    const doctor = await User.findById(doctorId);
    if (!doctor || !doctor.isDoctor) {
        res.status(404);
        throw new Error("Doctor not found!");
    }

    if (!doctor.isActive) {
        res.status(403);
        throw new Error("This doctor is not yet approved to accept appointments.");
    }

    if (!doctor.profileCompleted) {
        res.status(403);
        throw new Error("This doctor has not completed their profile setup.");
    }

    // Check doctor subscription status
    let subscriptionActive = false;
    if (doctor.subscriptionPaidDate) {
        const paidDate = new Date(doctor.subscriptionPaidDate);
        const now = new Date();
        subscriptionActive = paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
    }
    if (!subscriptionActive) {
        res.status(403);
        throw new Error("This doctor's platform subscription is not active. They cannot accept appointments at this time.");
    }

    // 2. Determine Cost based on Type
    const consultationFee = type === 'Online' ? (doctor.onlineFee || doctor.fees || 150) : (doctor.offlineFee || doctor.fees || 150);

    // Both Online and Offline only pay booking fee upfront now
    const upfrontCost = BOOKING_FEE;
    const doctorShare = consultationFee - ADMIN_SHARE;

    // 3. Check patient has enough credits
    const patient = await User.findById(patientId);

    if (patient.credits < upfrontCost) {
        res.status(400);
        throw new Error(`Insufficient credits! You need ₹${upfrontCost} for booking. Current balance: ₹${patient.credits}. Please buy more credits.`);
    }

    // 3. SLOT VALIDATION: Check for Double-Booking
    const isSlotTaken = await Appointment.findOne({
        doctorId,
        date,
        slot,
        status: { $nin: ["cancelled", "rejected"] }
    });

    if (isSlotTaken) {
        res.status(409);
        throw new Error("This slot has already been booked!");
    }

    // 4. Deduct credits from patient
    patient.credits -= upfrontCost;
    await patient.save();

    // 5. Find admin for earnings
    const admin = await User.findOne({ isAdmin: true });

    // 6. CREATE APPOINTMENT
    const newAppointment = await Appointment.create({
        patientId,
        doctorId,
        date,
        slot,
        symptoms,
        type: type || 'Offline',
        report: report || undefined,
        amount: consultationFee,
        bookingFee: BOOKING_FEE,
        doctorEarnings: doctorShare,
        adminEarnings: ADMIN_SHARE + BOOKING_FEE,
        status: 'pending',
        isOnlineFeePaid: false,
        isPaid: false
    });

    // 7. Create payment records
    // Booking fee to admin
    if (admin) {
        await Payment.create({
            userId: patientId,
            type: 'booking_fee',
            amount: BOOKING_FEE,
            status: 'completed',
            appointmentId: newAppointment._id,
            receiverId: admin._id,
            description: `Booking fee for appointment with Dr. ${doctor.name}`
        });
        admin.earnings = (admin.earnings || 0) + BOOKING_FEE;
        await admin.save();
    }

    // Consultation fee is now paid AFTER the appointment is completed
    // So we don't create a consultation_fee record here anymore.

    // 8. POPULATE for the response
    const populatedAppointment = await Appointment.findById(newAppointment._id)
        .populate("patientId", "name email phone image")
        .populate("doctorId", "name category fees image");

    // 9. Emit real-time notification to doctor
    const io = req.app.get("io");
    if (io) {
        io.emit("receive_notification", {
            type: "NEW_APPOINTMENT",
            message: `New appointment request from ${req.user.name}`,
            appointmentId: newAppointment._id,
            time: new Date()
        });
    }

    res.status(201).json({
        success: true,
        message: "Appointment booked successfully!",
        data: populatedAppointment,
        creditsRemaining: patient.credits
    });
});

// @desc    Get all appointments for the logged-in patient
// @route   GET /api/appointment/user
const getUserAppointments = asyncHandler(async (req, res) => {
    const uid = req.params.uid || req.user._id;

    if (uid.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        res.status(403);
        throw new Error("Not authorized to view these appointments");
    }

    const appointments = await Appointment.find({ patientId: uid })
        .populate("doctorId", "name category fees image")
        .sort({ createdAt: -1 });

    res.status(200).json(appointments);
});

// @desc    Get single appointment
// @route   GET /api/appointment/:id
const getAppointmentById = asyncHandler(async (req, res) => {
    const appointmentId = req.params.id;
    const currentUserId = req.user._id;

    const appointment = await Appointment.findById(appointmentId)
        .populate("patientId", "name email phone image")
        .populate("doctorId", "name category image");

    if (!appointment) {
        res.status(404);
        throw new Error("Appointment not found!");
    }

    const isPatient = appointment.patientId._id.toString() === currentUserId.toString();
    const isDoctor = appointment.doctorId._id.toString() === currentUserId.toString();
    const isAdmin = req.user.isAdmin;

    if (!isPatient && !isDoctor && !isAdmin) {
        res.status(403);
        throw new Error("Unauthorized! You do not have permission to view this appointment.");
    }

    res.status(200).json(appointment);
});

// @desc    Cancel an appointment
// @route   PUT /api/appointment/cancel/:id
const cancelAppointment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
        res.status(404);
        throw new Error("Appointment not found!");
    }

    const isDoctor = appointment.doctorId.toString() === userId.toString();
    const isPatient = appointment.patientId.toString() === userId.toString();

    if (!isPatient && !isDoctor && !req.user.isAdmin) {
        res.status(403);
        throw new Error("You do not have permission to cancel this appointment.");
    }

    if (appointment.status === "cancelled") {
        res.status(400);
        throw new Error("Appointment is already cancelled.");
    }

    // Refund credits to patient
    let refundAmount = 0;
    const patient = await User.findById(appointment.patientId);

    // Now only booking fee is paid upfront for both Online and Offline
    if (isDoctor || req.user.isAdmin) {
        // If doctor or admin cancels, refund the booking fee to patient
        refundAmount = appointment.bookingFee;

        // Adjust admin earnings (remove the booking fee that was credited)
        const admin = await User.findOne({ isAdmin: true });
        if (admin) {
            admin.earnings = Math.max(0, (admin.earnings || 0) - appointment.bookingFee);
            await admin.save();
        }
    } else {
        // If patient cancels, booking fee is non-refundable (as per standard policy)
        refundAmount = 0;
    }

    if (patient && refundAmount > 0) {
        patient.credits += refundAmount;
        await patient.save();
    }

    appointment.status = "cancelled";
    await appointment.save();

    res.status(200).json({
        success: true,
        message: `Appointment cancelled successfully. ₹${refundAmount} credits refunded.`,
    });
});

// @desc    Update appointment status (for doctor: accept/reject/complete)
// @route   PUT /api/appointment/status/:id
const updateAppointmentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, rejectionMessage } = req.body;
    const doctorId = req.user._id;

    const validStatuses = ['confirmed', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
        res.status(400);
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const appointment = await Appointment.findById(id);

    if (!appointment) {
        res.status(404);
        throw new Error("Appointment not found!");
    }

    // Only the assigned doctor or admin can update status
    if (appointment.doctorId.toString() !== doctorId.toString() && !req.user.isAdmin) {
        res.status(403);
        throw new Error("Not authorized to update this appointment.");
    }

    appointment.status = status;

    // Handle rejection
    if (status === 'rejected') {
        appointment.rejectionMessage = rejectionMessage || "No reason provided.";

        // Refund credits to patient (booking fee)
        const patient = await User.findById(appointment.patientId);
        if (patient) {
            patient.credits += appointment.bookingFee;
            await patient.save();
        }

        // Adjust admin earnings (remove the booking fee)
        const admin = await User.findOne({ isAdmin: true });
        if (admin) {
            admin.earnings = Math.max(0, (admin.earnings || 0) - appointment.bookingFee);
            await admin.save();
        }
    }

    // Handle completion: Create a payment request for the consultation fee
    if (status === 'completed') {
        const { paymentMethod } = req.body;

        if (paymentMethod === 'cash') {
            // Mark as paid immediately if paid by cash offline
            appointment.isPaid = true;

            // Update doctor earnings
            const doctor = await User.findById(appointment.doctorId);
            if (doctor) {
                doctor.earnings = (doctor.earnings || 0) + appointment.doctorEarnings;
                await doctor.save();
            }

            // Update admin earnings (consultation share)
            const admin = await User.findOne({ isAdmin: true });
            if (admin) {
                // We add the share of the consultation fee (total amount - doctor's share)
                admin.earnings = (admin.earnings || 0) + (appointment.amount - appointment.doctorEarnings);
                await admin.save();
            }

            const io = req.app.get("io");
            if (io) {
                io.emit("receive_notification", {
                    type: "PAYMENT_COMPLETED",
                    message: `Consultation with Dr. ${req.user.name} marked as paid via Cash.`,
                    appointmentId: id,
                    time: new Date()
                });
            }
        } else {
            // Create a pending payment record for the patient to pay via credits
            await Payment.create({
                userId: appointment.patientId,
                type: 'consultation_fee',
                amount: appointment.amount,
                status: 'pending',
                appointmentId: appointment._id,
                receiverId: appointment.doctorId,
                description: `Payment request for completed ${appointment.type} appointment on ${appointment.date}`
            });

            const io = req.app.get("io");
            if (io) {
                io.emit("receive_notification", {
                    type: "PAYMENT_REQUEST",
                    message: `Your consultation with Dr. ${req.user.name} is complete. Please pay the remaining ₹${appointment.amount}.`,
                    appointmentId: id,
                    time: new Date()
                });
            }
        }
    }

    // Note: Doctor and Admin earnings are now ONLY updated when the patient pays the consultation fee.
    // The booking fee was already credited to admin during bookAppointment.

    await appointment.save();

    const populatedAppointment = await Appointment.findById(id)
        .populate("patientId", "name email phone image")
        .populate("doctorId", "name category fees image");

    res.status(200).json({
        success: true,
        message: `Appointment ${status} successfully.`,
        data: populatedAppointment
    });
});

// @desc    Pay consultation fee for completed appointment
// @route   PUT /api/appointment/pay-consultation/:id
const payConsultationFee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const patientId = req.user._id;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
        res.status(404);
        throw new Error("Appointment not found!");
    }

    if (appointment.patientId.toString() !== patientId.toString()) {
        res.status(403);
        throw new Error("Unauthorized to pay for this appointment.");
    }

    if (appointment.status !== 'completed') {
        res.status(400);
        throw new Error("Appointment must be completed before paying consultation fee.");
    }

    if (appointment.isPaid) {
        res.status(400);
        throw new Error("Consultation fee is already paid.");
    }

    const patient = await User.findById(patientId);

    // amount is the consultation fee
    const amountToPay = appointment.amount;

    if (patient.credits < amountToPay) {
        res.status(400);
        throw new Error(`Insufficient credits! You need ₹${amountToPay} credits. Current balance: ₹${patient.credits}. Please recharge your credits.`);
    }

    // Deduct from patient
    patient.credits -= amountToPay;
    await patient.save();

    // Mark as paid
    appointment.isPaid = true;
    appointment.isOnlineFeePaid = true; // For backward compatibility if used elsewhere
    await appointment.save();

    // Update the pending Payment record
    const paymentRecord = await Payment.findOne({
        appointmentId: appointment._id,
        type: 'consultation_fee',
        status: 'pending'
    });

    if (paymentRecord) {
        paymentRecord.status = 'completed';
        await paymentRecord.save();
    } else {
        // Fallback: Create if not found (shouldn't happen with new logic)
        await Payment.create({
            userId: patientId,
            type: 'consultation_fee',
            amount: amountToPay,
            status: 'completed',
            appointmentId: appointment._id,
            receiverId: appointment.doctorId,
            description: `Consultation fee for appointment on ${appointment.date}`
        });
    }

    // Credit doctor earnings
    const doctor = await User.findById(appointment.doctorId);
    if (doctor) {
        doctor.credits = (doctor.credits || 0) + appointment.doctorEarnings;
        doctor.earnings = (doctor.earnings || 0) + appointment.doctorEarnings;
        await doctor.save();
    }

    // Admin gets their share
    const admin = await User.findOne({ isAdmin: true });
    if (admin) {
        admin.earnings = (admin.earnings || 0) + (appointment.amount - appointment.doctorEarnings);
        await admin.save();
    }

    res.status(200).json({
        success: true,
        message: "Consultation fee paid successfully! Thank you.",
        creditsRemaining: patient.credits
    });
});

const appointmentController = { bookAppointment, getUserAppointments, getAppointmentById, cancelAppointment, updateAppointmentStatus, payConsultationFee };
export default appointmentController;