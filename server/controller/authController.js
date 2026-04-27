import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { sendEmail } from "../config/emailService.js";

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, phone, password, isDoctor } = req.body;

    if (!name || (!email && !phone) || !password) {
        res.status(400);
        throw new Error("Please fill all required details!");
    }

    const userExist = await User.findOne({ $or: [{ email: email || 'NONE' }, { phone: phone || 'NONE' }] });
    if (userExist) {
        res.status(400);
        throw new Error("User already exists!");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Doctor registration: only basic info. Profile filled AFTER admin approval.
    // Admin role cannot be registered from public endpoint (security).
    const user = await User.create({
        name,
        email,
        phone,
        password: hashedPassword,
        isDoctor: isDoctor || false,
        isAdmin: false, // Force false for security — admin is predefined
        role: isDoctor ? 'doctor' : 'patient',
        isActive: !isDoctor, // Doctors are inactive until admin approves
        profileCompleted: false,
        credits: 0,
    });

    if (user) {
        // Emit notification if a doctor registers
        if (isDoctor) {
            const io = req.app.get("io");
            if (io) {
                io.emit("receive_notification", {
                    type: "NEW_DOCTOR_REQUEST",
                    message: `Dr. ${user.name} has requested to join.`,
                    userId: user._id,
                    time: new Date()
                });
            }
        }

        const token = generateToken(user._id);

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            isAdmin: user.isAdmin,
            isActive: user.isActive,
            credits: user.credits,
            isDoctor: user.isDoctor,
            role: user.role,
            profileCompleted: user.profileCompleted,
            category: user.category,
            experience: user.experience,
            fees: user.fees,
            image: user.image,
            availability: user.availability || [],
            earnings: user.earnings || 0,
            qrCode: user.qrCode || "",
            token
        });
    } else {
        res.status(400);
        throw new Error("Invalid user data!");
    }
});

// @desc    Login User
// @route   POST /api/auth/login
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error("Please provide email and password!");
    }

    const user = await User.findOne({ email });

    if (!user) {
        res.status(401);
        throw new Error("Invalid Credentials!");
    }

    if (user.isBlocked) {
        res.status(403);
        throw new Error("Your account has been blocked by the administrator.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        res.status(401);
        throw new Error("Invalid Credentials!");
    }

    const token = generateToken(user._id);

    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
        credits: user.credits,
        isDoctor: user.isDoctor,
        role: user.role,
        profileCompleted: user.profileCompleted,
        category: user.category,
        experience: user.experience,
        fees: user.fees,
        image: user.image,
        availability: user.availability || [],
        earnings: user.earnings || 0,
        qrCode: user.qrCode || "",
        adminQrCode: user.adminQrCode || "",
        token
    });
});

// @desc    Get current user
// @route   GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
    const user = req.user;
    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
        credits: user.credits,
        isDoctor: user.isDoctor,
        role: user.role,
        profileCompleted: user.profileCompleted,
        category: user.category,
        experience: user.experience,
        fees: user.fees,
        image: user.image,
        availability: user.availability || [],
        earnings: user.earnings || 0,
        qrCode: user.qrCode || "",
        adminQrCode: user.adminQrCode || "",
    });
});

// Private Controller
const privateController = async (req, res) => {
    res.send("Private Controller " + req.user.name)
}

// Generate Token
export const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '10d' })
}

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error("Please provide an email address.");
    }

    const user = await User.findOne({ email });
    if (!user) {
        res.status(404);
        throw new Error("User not found with this email.");
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP before saving
    const salt = await bcrypt.genSalt(10);
    user.resetPasswordOtp = await bcrypt.hash(otp, salt);
    // OTP expires in 15 minutes
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Send email
    await sendEmail(
        user.email,
        "MediCore Password Reset OTP",
        `<div style="font-family:Arial;padding:20px;">
            <h2>Password Reset</h2>
            <p>Your OTP for password reset is: <strong>${otp}</strong></p>
            <p>This OTP will expire in 15 minutes.</p>
        </div>`
    );

    res.status(200).json({ success: true, message: "OTP sent to email." });
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
export const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        res.status(400);
        throw new Error("Please provide email and OTP.");
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordOtp || !user.resetPasswordExpires) {
        res.status(400);
        throw new Error("Invalid or expired OTP.");
    }

    if (user.resetPasswordExpires < Date.now()) {
        res.status(400);
        throw new Error("OTP has expired.");
    }

    const isMatch = await bcrypt.compare(otp, user.resetPasswordOtp);
    if (!isMatch) {
        res.status(400);
        throw new Error("Invalid OTP.");
    }

    // OTP verified successfully
    res.status(200).json({ success: true, message: "OTP verified successfully." });
});

// @desc    Reset Password
// @route   POST /api/auth/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        res.status(400);
        throw new Error("Please provide all required fields.");
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordOtp || !user.resetPasswordExpires) {
        res.status(400);
        throw new Error("Invalid request.");
    }

    if (user.resetPasswordExpires < Date.now()) {
        res.status(400);
        throw new Error("OTP has expired.");
    }

    const isMatch = await bcrypt.compare(otp, user.resetPasswordOtp);
    if (!isMatch) {
        res.status(400);
        throw new Error("Invalid OTP.");
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear OTP fields
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successful." });
});

const authController = { registerUser, loginUser, getMe, privateController, forgotPassword, verifyOtp, resetPassword };
export default authController;
