import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, "Please Enter Your Name!"]
    },
    email: {
        type: String,
        unique: true,
        required: [true, "Please Enter Your Email!"]
    },
    phone: {
        type: String,
        unique: true,
        required: [true, "Please Enter Your phone!"]
    },
    image: {
        type: String,
        default: ""
    },
    password: {
        type: String,
        required: [true, "Please Enter Your Password!"]
    },
    isActive: {
        type: Boolean,
        default: true,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    isDoctor: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ["patient", "doctor", "admin"],
        default: "patient"
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    credits: {
        type: Number,
        default: 0,
        required: true
    },
    // --- Doctor Professional Fields (filled AFTER admin approval) ---
    profileCompleted: {
        type: Boolean,
        default: false
    },
    category: {
        type: String, // Specialization
    },
    experience: {
        type: String,
    },
    fees: {
        type: Number,
    },
    onlineFee: {
        type: Number,
    },
    offlineFee: {
        type: Number,
    },
    address: {
        type: String,
    },
    autopayEnabled: {
        type: Boolean,
        default: false
    },
    subscriptionStatus: {
        type: String,
        enum: ["paid", "unpaid"],
        default: "unpaid"
    },
    subscriptionPaidDate: {
        type: Date,
        default: null
    },
    availability: [{
        day: {
            type: String,
            enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        },
        slots: [String] // Array of strings like ["09:00 AM", "10:00 AM"]
    }],
    // Doctor's QR code for payment
    qrCode: {
        type: String,
        default: ""
    },
    // Earnings tracking
    earnings: {
        type: Number,
        default: 0
    },
    // Admin's QR code for credit purchases
    adminQrCode: {
        type: String,
        default: ""
    },
    // Ratings
    averageRating: {
        type: Number,
        default: 0
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    // OTP for Password Reset
    resetPasswordOtp: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    }

}, {
    timestamps: true
})

const User = mongoose.model('User', userSchema)

export default User