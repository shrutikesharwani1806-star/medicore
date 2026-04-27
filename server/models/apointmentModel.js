import mongoose from "mongoose";

const apointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String,
        required: true
    },
    slot: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'],
        default: 'pending'
    },
    symptoms: {
        type: String
    },
    type: {
        type: String,
        default: 'Consultation'
    },
    report: {
        type: String // File URL for patient-uploaded reports
    },
    amount: {
        type: Number,
        default: 0
    },
    // Rejection message from doctor
    rejectionMessage: {
        type: String,
        default: ""
    },
    // Earnings breakdown
    doctorEarnings: {
        type: Number,
        default: 0
    },
    adminEarnings: {
        type: Number,
        default: 0
    },
    bookingFee: {
        type: Number,
        default: 50
    },
    isOnlineFeePaid: {
        type: Boolean,
        default: false
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    aiSuggetion: {
        type: String
    }

}, {
    timestamps: true
});

// Compound index to prevent double booking of same slot
apointmentSchema.index({ doctorId: 1, date: 1, slot: 1 });

const Apointment = mongoose.model('Apointment', apointmentSchema);

export default Apointment;