import express from "express";
import reportController from "../controller/reportController.js";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/analyze", protect.forUser, upload.single("reportFile"), reportController.analyzeReport);
router.get("/user", protect.forUser, reportController.getUserReports);
router.get("/user/:uid", protect.forUser, reportController.getUserReports);

export default router;