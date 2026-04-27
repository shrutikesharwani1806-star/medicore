import User from "../models/userModel.js"
import Apointment from "../models/apointmentModel.js";
import Doctor from "../models/doctormodel.js";
import Payment from "../models/paymentModel.js";
import { sendEmail } from "../config/emailService.js";

// @desc    Get all patients (non-doctor, non-admin users)
// @route   GET /api/admin/users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ isDoctor: false, isAdmin: false }).select("-password");
        res.status(200).json(users || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Get all doctors
// @route   GET /api/admin/doctors
const getAllDoctors = async (req, res) => {
    try {
        const doctors = await User.find({ isDoctor: true }).select("-password");
        res.status(200).json(doctors || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single user/doctor
// @route   GET /api/admin/users/:uid/details
const getSingleUser = async (req, res) => {
    try {
        const userId = req.params.uid;
        const user = await User.findById(userId).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        // Get appointments involving this user (either as patient or doctor)
        let appointments = [];
        if (user.isDoctor) {
            appointments = await Apointment.find({ doctorId: userId })
                .populate("patientId", "name email image")
                .sort({ createdAt: -1 });
        } else {
            appointments = await Apointment.find({ patientId: userId })
                .populate("doctorId", "name category image")
                .sort({ createdAt: -1 });
        }

        res.status(200).json({ user, appointments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all appointments
// @route   GET /api/admin/apointments
const getAllApointments = async (req, res) => {
    try {
        const appointments = await Apointment.find()
            .populate("patientId", "name email phone image")
            .populate("doctorId", "name category image")
            .sort({ createdAt: -1 });

        res.status(200).json(appointments || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all doctor ratings
// @route   GET /api/admin/ratings
const getAllRatings = async (req, res) => {
    try {
        const doctorRatings = await Doctor.find()
            .populate("useId", "name email")
            .select("ratings specialization");

        res.status(200).json(doctorRatings || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a user (approve/reject doctor, add credits, etc.)
// @route   PUT /api/admin/users/:uid
const updateUser = async (req, res) => {
    try {
        let { isActive, credits, isBlocked } = req.body;
        const userId = req.params.uid;

        let user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        let updateData = {};

        if (isActive !== undefined) {
            updateData.isActive = isActive;
        }

        if (isBlocked !== undefined) {
            updateData.isBlocked = isBlocked;
        }

        if (credits !== undefined) {
            updateData.credits = user.credits + parseInt(credits);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No valid fields to update!" });
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { returnDocument: "after" }).select("-password");

        if (!updatedUser) {
            return res.status(409).json({ message: "User Not Updated" });
        }

        // Emit notification and send email if doctor was approved
        if (isActive === true && user.isDoctor) {
            const io = req.app.get("io");
            if (io) {
                io.emit("receive_notification", {
                    type: "DOCTOR_APPROVED",
                    message: `Dr. ${user.name} has been approved!`,
                    userId: user._id,
                    time: new Date()
                });
            }

            // Send approval email
            if (user.email) {
                await sendEmail(
                    user.email,
                    "🎉 Your MediCore Doctor Account is Approved!",
                    `<div style="font-family:Arial;padding:20px;">
                        <h2>Congratulations, Dr. ${user.name}! 🎉</h2>
                        <p>Your doctor account on MediCore has been <strong>approved</strong> by the admin.</p>
                        <p>You can now log in and complete your profile to start accepting appointments:</p>
                        <ul>
                            <li>Set your specialization</li>
                            <li>Add your experience</li>
                            <li>Set consultation fees</li>
                            <li>Configure available days & time slots</li>
                            <li>Upload your QR code for payments</li>
                        </ul>
                        <p style="color:#888;margin-top:20px;">— MediCore Team</p>
                    </div>`
                );
            }
        }

        // Send rejection email
        if (isActive === false && user.isDoctor && user.email) {
            await sendEmail(
                user.email,
                "❌ MediCore Doctor Account Update",
                `<div style="font-family:Arial;padding:20px;">
                    <h2>Account Update</h2>
                    <p>Dear Dr. ${user.name},</p>
                    <p>Your doctor account on MediCore has been <strong>deactivated</strong>.</p>
                    <p>If you believe this is an error, please contact our support team.</p>
                    <p style="color:#888;margin-top:20px;">— MediCore Team</p>
                </div>`
            );
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Reject a doctor (delete from system)
// @route   DELETE /api/admin/users/:uid
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.uid;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        // Send rejection email before deleting
        if (user.email && user.isDoctor) {
            await sendEmail(
                user.email,
                "❌ MediCore Doctor Application Rejected",
                `<div style="font-family:Arial;padding:20px;">
                    <h2>Application Rejected</h2>
                    <p>Dear Dr. ${user.name},</p>
                    <p>We're sorry, but your doctor application on MediCore has been <strong>rejected</strong>.</p>
                    <p>You may re-apply with updated credentials.</p>
                    <p style="color:#888;margin-top:20px;">— MediCore Team</p>
                </div>`
            );
        }

        await User.findByIdAndDelete(userId);

        res.status(200).json({ message: "User removed successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Get admin analytics data
// @route   GET /api/admin/analytics
const getAnalytics = async (req, res) => {
    try {
        // Get monthly appointment data for the last 12 months
        const currentDate = new Date();
        const appointmentsPerMonth = [];

        for (let i = 11; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

            const count = await Apointment.countDocuments({
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            });

            appointmentsPerMonth.push({
                month: date.toLocaleString('default', { month: 'short' }),
                count: count
            });
        }

        // Get monthly revenue data
        const revenuePerMonth = [];

        for (let i = 11; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

            const appointments = await Apointment.find({
                createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                status: { $in: ['completed', 'confirmed'] }
            });

            const revenue = appointments.reduce((total, apt) => {
                return total + (apt.adminEarnings || 0);
            }, 0);

            revenuePerMonth.push({
                month: date.toLocaleString('default', { month: 'short' }),
                revenue: revenue
            });
        }

        // Get users by role
        const totalUsers = await User.countDocuments();
        const totalDoctors = await User.countDocuments({ isDoctor: true });
        const totalAdmins = await User.countDocuments({ isAdmin: true });
        const totalPatients = totalUsers - totalDoctors - totalAdmins;

        const usersByRole = [
            { role: 'Patients', count: totalPatients },
            { role: 'Doctors', count: totalDoctors },
            { role: 'Admins', count: totalAdmins },
        ];

        // Get specialty distribution
        const specialtyStats = await User.aggregate([
            { $match: { isDoctor: true, profileCompleted: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const specialtyDistribution = specialtyStats.map(stat => ({
            name: stat._id || 'General',
            value: stat.count
        }));

        // Get total admin earnings
        const admin = await User.findOne({ isAdmin: true });
        const totalAdminEarnings = admin?.earnings || 0;

        // Get total revenue (all appointments)
        const totalRevenue = await Apointment.aggregate([
            { $match: { status: { $in: ['completed', 'confirmed'] } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            appointmentsPerMonth,
            revenuePerMonth,
            usersByRole,
            specialtyDistribution,
            totalRevenue: totalRevenue[0]?.total || 0,
            totalAdminEarnings,
            totalUsers,
            totalDoctors,
            totalAppointments: await Apointment.countDocuments(),
            pendingAppointments: await Apointment.countDocuments({ status: 'pending' }),
            completedAppointments: await Apointment.countDocuments({ status: 'completed' })
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Get detailed statistics for a specific doctor
// @route   GET /api/admin/doctor-stats/:id
const getDoctorStats = async (req, res) => {
    try {
        const doctorId = req.params.id;

        // Total appointments
        const totalBookings = await Apointment.countDocuments({ doctorId });

        // Total unique patients
        const uniquePatients = await Apointment.distinct("patientId", { doctorId });
        const totalPatients = uniquePatients.length;

        // Total earnings for this doctor
        const appointments = await Apointment.find({
            doctorId,
            status: { $in: ['completed', 'confirmed'] }
        });

        const totalEarnings = appointments.reduce((sum, apt) => sum + (apt.doctorEarnings || 0), 0);

        res.json({
            totalBookings,
            totalPatients,
            totalEarnings
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const adminController = { getAllUsers, getAllDoctors, getSingleUser, getAllApointments, getAllRatings, updateUser, deleteUser, getAnalytics, getDoctorStats }

export default adminController