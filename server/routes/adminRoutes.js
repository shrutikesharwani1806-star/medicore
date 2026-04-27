import express from "express"
import adminController from "../controller/adminController.js"
import protect from "../middleware/authMiddleware.js"

const router = express.Router()

router.get("/users", protect.forAdmin, adminController.getAllUsers)
router.get("/doctors", protect.forAdmin, adminController.getAllDoctors)
router.get("/apointments", protect.forAdmin, adminController.getAllApointments)
router.get("/ratings", protect.forAdmin, adminController.getAllRatings)
router.get("/analytics", protect.forAdmin, adminController.getAnalytics)
router.get("/users/:uid/details", protect.forAdmin, adminController.getSingleUser)
router.put("/users/:uid", protect.forAdmin, adminController.updateUser)
router.delete("/users/:uid", protect.forAdmin, adminController.deleteUser)
router.get("/doctor-stats/:id", protect.forAdmin, adminController.getDoctorStats)
router.put("/approve-doctor/:id", protect.forAdmin, (req, res) => {
    req.body.isActive = true;
    req.params.uid = req.params.id;
    adminController.updateUser(req, res);
});

export default router