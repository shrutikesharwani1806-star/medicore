import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
    apointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Apointment'
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    medicines: [{
        name: String,
        dosage: String, // e.g., "500mg"
        frequency: String, // e.g., "1-0-1"
        duration: String, // e.g., "5 days"
    }],
    instructions: {
        type: String
    },
    digitalSignature: {
        type: String
    }
}, {
    timestamps: true
})

const Prescription = mongoose.model('Prescription', prescriptionSchema)

export default Prescription