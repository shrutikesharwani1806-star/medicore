import express from "express";
import prescriptionController from "../controller/prescriptionController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect.forDoctor, prescriptionController.createPrescription);
router.get("/patient/:patientId", protect.forUser, prescriptionController.getPatientPrescriptions);
router.get("/:id", protect.forUser, prescriptionController.getPrescriptionById);

export default router;
