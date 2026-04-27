import mongoose, { Mongoose } from "mongoose";

const doctorSchema = new mongoose.Schema({

    useId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    specialization: {
        type: String,
        required: true
    },
    experience: {
        type: String,
        required: true
    },
    fees: {
        type: Number,
        required: true
    },
    bio: {
        type: String,
    },
    availability: [{
        day: {
            type: String, // e.g., 'Monday'
            required: true
        },
        slots: [String] // e.g., ['09:00 AM', '10:00 AM']
    }],
    ratings: [
        {
            patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            rating: { type: Number, min: 1, max: 5 },
            review: { type: String },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    averageRating: { type: Number, default: 0 }

}, {
    timestamps: true
})

const Doctor = mongoose.model('Doctor', doctorSchema)

export default Doctor