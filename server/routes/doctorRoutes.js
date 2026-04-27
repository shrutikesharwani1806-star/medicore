import express from "express"
import doctorController from "../controller/doctorController.js"
import protect from "../middleware/authMiddleware.js"

const router = express.Router()

// Public routes (no auth)
router.get("/public", doctorController.getAllActiveDoctors);
router.get("/public/:id", doctorController.getDoctorPublicProfile);

// Protected doctor routes
router.put("/profile", protect.forDoctor, doctorController.updateDoctorProfile);
router.get("/apointments", protect.forDoctor, doctorController.getAllApointments)
router.get("/patients", protect.forDoctor, doctorController.getAllPatients)
router.get("/patient/:id", protect.forDoctor, doctorController.getSinglePatient)

// Authenticated user route (any logged-in user can check slots)
router.get("/available-slots/:doctorId", protect.forUser, doctorController.getAvailableSlots);

export default router