import Appointment from "../models/apointmentModel.js";
import User from "../models/userModel.js";
import Report from "../models/reportModel.js";
import asyncHandler from "express-async-handler";

// @desc    Update doctor profile (mandatory profile form after approval)
// @route   PUT /api/doctor/profile
const updateDoctorProfile = asyncHandler(async (req, res) => {
    const { category, experience, fees, onlineFee, offlineFee, address, image, availableSlots, availableDays, qrCode, autopayEnabled } = req.body;

    const doctor = await User.findById(req.user._id);

    if (!doctor) {
        res.status(404);
        throw new Error("Doctor not found");
    }

    // Update doctor fields
    if (category) doctor.category = category;
    if (experience) doctor.experience = experience;
    if (fees) doctor.fees = Number(fees);
    if (onlineFee !== undefined) doctor.onlineFee = Number(onlineFee);
    if (offlineFee !== undefined) doctor.offlineFee = Number(offlineFee);
    if (address) doctor.address = address;
    if (image) doctor.image = image;
    if (qrCode !== undefined) doctor.qrCode = qrCode;
    if (autopayEnabled !== undefined) doctor.autopayEnabled = Boolean(autopayEnabled);

    // Build availability from availableSlots and availableDays
    if (availableDays && availableSlots) {
        doctor.availability = availableDays.map(day => ({
            day,
            slots: availableSlots
        }));
    }

    // Check if profile is complete
    if (doctor.category && doctor.experience && doctor.onlineFee && doctor.offlineFee && doctor.address && doctor.qrCode && doctor.availability?.length > 0) {
        doctor.profileCompleted = true;
    }

    await doctor.save();

    res.json({
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        category: doctor.category,
        experience: doctor.experience,
        fees: doctor.fees,
        onlineFee: doctor.onlineFee,
        offlineFee: doctor.offlineFee,
        address: doctor.address,
        image: doctor.image,
        availability: doctor.availability,
        role: doctor.role,
        isActive: doctor.isActive,
        profileCompleted: doctor.profileCompleted,
        qrCode: doctor.qrCode,
        autopayEnabled: doctor.autopayEnabled,
        subscriptionStatus: doctor.subscriptionStatus,
        subscriptionPaidDate: doctor.subscriptionPaidDate,
        earnings: doctor.earnings || 0,
        credits: doctor.credits || 0,
    });
});

// @desc    Get all appointments for the logged-in doctor
// @route   GET /api/doctor/appointments
const getAllApointments = asyncHandler(async (req, res) => {
    const appointments = await Appointment.find({ doctorId: req.user._id })
        .populate("patientId", "name email phone image")
        .sort({ createdAt: -1 });

    // Return empty array instead of 404 when no appointments
    res.status(200).json(appointments || []);
});

// @desc    Get all patients who have booked with this doctor
// @route   GET /api/doctor/patients
const getAllPatients = asyncHandler(async (req, res) => {
    // Find unique patient IDs from this doctor's appointments
    const patientIds = await Appointment.find({ doctorId: req.user._id })
        .distinct("patientId");

    const patients = await User.find({ _id: { $in: patientIds } })
        .select("-password");

    res.status(200).json(patients || []);
});

// @desc    Get detailed info of a single patient
// @route   GET /api/doctor/patient/:id
const getSinglePatient = asyncHandler(async (req, res) => {
    const patientId = req.params.id;
    const doctorId = req.user._id;

    // Check if doctor has ever had an appointment with this patient
    const hasRelationship = await Appointment.exists({
        patientId,
        doctorId
    });

    if (!hasRelationship && !req.user.isAdmin) {
        res.status(403);
        throw new Error("Not authorized! You can only view details of your own patients.");
    }

    const patient = await User.findById(patientId).select("-password -isAdmin -isBlocked -resetPasswordOtp -resetPasswordExpires");

    if (!patient) {
        res.status(404);
        throw new Error("Patient not found.");
    }

    const history = await Appointment.find({
        patientId,
        doctorId
    }).sort({ createdAt: -1 });

    const reports = await Report.find({ patientId }).sort({ createdAt: -1 });

    res.status(200).json({
        profile: patient,
        appointmentHistory: history,
        reports
    });
});

// @desc    Get available slots for a doctor on a specific date
// @route   GET /api/doctor/available-slots/:doctorId
export const getAvailableSlots = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { date } = req.query;

    const doctor = await User.findById(doctorId);
    if (!doctor || !doctor.isDoctor) {
        res.status(404);
        throw new Error("Doctor not found");
    }

    // Get all booked appointments for this doctor on this date
    const bookedAppointments = await Appointment.find({
        doctorId,
        date,
        status: { $nin: ["cancelled", "rejected"] }
    }).select("slot");

    const bookedSlots = bookedAppointments.map(app => app.slot);

    // Find the day of the week for the selected date
    const [year, month, day] = date.split('-');
    const localDate = new Date(year, month - 1, day);
    const dayName = localDate.toLocaleString('en-us', { weekday: 'long' });
    const daySchedule = (doctor.availability || []).find(d => d.day === dayName);

    if (!daySchedule) {
        return res.json({ availableSlots: [], message: "Doctor does not work on this day." });
    }

    // Filter out already booked slots
    const finalAvailableSlots = daySchedule.slots.filter(slot => !bookedSlots.includes(slot));

    res.status(200).json({
        date,
        day: dayName,
        availableSlots: finalAvailableSlots
    });
});

// @desc    Get all active doctors (Public endpoint - no auth required)
// @route   GET /api/doctor/public
const getAllActiveDoctors = asyncHandler(async (req, res) => {
    const { category, name } = req.query;

    // Only show doctors who are active
    let query = { isDoctor: true, isActive: true };
    if (category) {
        query.category = { $regex: category, $options: 'i' };
    }
    if (name) {
        query.name = { $regex: name, $options: 'i' };
    }

    const doctors = await User.find(query).select("-password -role -isAdmin");

    res.status(200).json(doctors);
});

// @desc    Get a single doctor's public profile
// @route   GET /api/doctor/public/:id
const getDoctorPublicProfile = asyncHandler(async (req, res) => {
    const doctor = await User.findById(req.params.id).select("-password -role -isAdmin");

    if (!doctor || !doctor.isDoctor) {
        res.status(404);
        throw new Error("Doctor not found");
    }

    res.status(200).json(doctor);
});

const doctorController = { updateDoctorProfile, getAllApointments, getAllPatients, getSinglePatient, getAvailableSlots, getAllActiveDoctors, getDoctorPublicProfile };

export default doctorController;