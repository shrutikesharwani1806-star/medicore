import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['credit_purchase', 'appointment_booking', 'consultation_fee', 'booking_fee', 'withdrawal', 'subscription'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    credits: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    // For appointment-related payments
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Apointment'
    },
    // Who receives the payment (doctor or admin)
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    description: {
        type: String
    },
    // For credit purchases - reference to payment proof
    paymentProof: {
        type: String
    }
}, {
    timestamps: true
});

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ receiverId: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
