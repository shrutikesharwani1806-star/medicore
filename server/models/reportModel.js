import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportName: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    //AI Generated data
    aiSummary: {
        type: String
    },
    flaggedValues: [{
        parameter: String, // e.g., "Glucose"
        value: String,
        range: String,
        severity: {
            type: String,
            enum: ['normal', 'abnormal', 'critical']
        }

    }],
    recommendation: {
        type: String
    },
    uploadDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
})

const Report = mongoose.model('Report', reportSchema)

export default Report