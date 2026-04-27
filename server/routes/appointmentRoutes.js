// routes/appointmentRoutes.js
import express from "express";
import protect from "../middleware/authMiddleware.js";
import appointmentController from "../controller/apointmentController.js";

const router = express.Router();

router.post("/book/:doctorId", protect.forUser, appointmentController.bookAppointment);
router.get("/user", protect.forUser, appointmentController.getUserAppointments);
router.get("/user/:uid", protect.forUser, appointmentController.getUserAppointments);
router.get("/:id", protect.forUser, appointmentController.getAppointmentById);
router.put("/cancel/:id", protect.forUser, appointmentController.cancelAppointment);
// Doctor (or admin) - Update status
router.put("/status/:id", protect.forDoctor, appointmentController.updateAppointmentStatus);

// Patient - Pay consultation fee for completed appointment
router.put("/pay-consultation/:id", protect.forUser, appointmentController.payConsultationFee);

export default router;