import Prescription from "../models/prescriptionModel.js";
import Appointment from "../models/apointmentModel.js";

/**
 *  Create a new prescription
 *  POST /api/prescriptions
 *  Private (Doctor Only)
 */
const createPrescription = async (req, res) => {
    try {
        const { appointmentId, patientId, medicines, instructions, digitalSignature } = req.body;
        const doctorId = req.user._id; // Extracted from auth middleware

        // 1. Validation: Ensure the appointment exists and belongs to this doctor
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.doctorId.toString() !== doctorId.toString()) {
            return res.status(403).json({ message: "Unauthorized to prescribe for this appointment" });
        }

        // 2. Create the prescription
        const newPrescription = new Prescription({
            appointmentId, // Note: Matches your schema's 'apointmentId' typo
            doctorId,
            patientId,
            medicines,
            instructions,
            digitalSignature
        });

        const savedPrescription = await newPrescription.save();

        // 3. Optional: Mark appointment as 'Completed' or 'Prescribed'
        appointment.status = "Completed";
        await appointment.save();

        res.status(201).json({
            success: true,
            data: savedPrescription
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get prescriptions for a specific patient
 * GET /api/prescriptions/patient/:patientId
 */
const getPatientPrescriptions = async (req, res) => {
    try {
        const patientId = req.params.patientId;
        const currentUserId = req.user._id;

        // Security check: Only the patient themselves, their doctor (if they have an appointment), or admin can see this
        if (patientId.toString() !== currentUserId.toString() && !req.user.isAdmin) {
            // Check if doctor has a relationship
            if (req.user.isDoctor) {
                const hasRelationship = await Appointment.exists({ patientId, doctorId: currentUserId });
                if (!hasRelationship) {
                    return res.status(403).json({ message: "Unauthorized access to patient records." });
                }
            } else {
                return res.status(403).json({ message: "Unauthorized access." });
            }
        }

        const prescriptions = await Prescription.find({ patientId })
            .populate('doctorId', 'name category')
            .sort({ createdAt: -1 });

        res.status(200).json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 *   Get a single prescription by ID
 *   GET /api/prescriptions/:id
 */
const getPrescriptionById = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id)
            .populate('doctorId', 'name category')
            .populate('patientId', 'name email');

        if (!prescription) {
            return res.status(404).json({ message: "Prescription not found" });
        }

        const currentUserId = req.user._id;
        const isPatient = prescription.patientId?._id.toString() === currentUserId.toString();
        const isDoctor = prescription.doctorId?._id.toString() === currentUserId.toString();

        if (!isPatient && !isDoctor && !req.user.isAdmin) {
            return res.status(403).json({ message: "Unauthorized access to this prescription." });
        }

        res.status(200).json(prescription);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const prescriptionController = { createPrescription, getPatientPrescriptions, getPrescriptionById }

export default prescriptionController;