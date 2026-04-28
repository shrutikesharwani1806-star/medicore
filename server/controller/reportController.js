import asyncHandler from "express-async-handler";
import Report from "../models/reportModel.js";

//  Upload and Analyze Lab Report
//  POST /api/report/analyze
export const analyzeReport = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error("Please upload a lab report file.");
    }

    const patientId = req.user._id;

    // Save report in DB
    const report = await Report.create({
        patientId,
        reportName: req.file.originalname,
        fileUrl: req.file.path, // Using Cloudinary URL directly
        aiSummary: "Report analysis pending...", // Mock AI for now
        recommendation: "Consult with your doctor."
    });

    res.status(201).json({
        message: "File uploaded successfully!",
        report
    });
});

// GET /api/report/user/:uid?
export const getUserReports = asyncHandler(async (req, res) => {
    const uid = req.user._id;

    const reports = await Report.find({ patientId: uid }).sort({ createdAt: -1 });

    res.status(200).json(reports);
});

const reportController = { analyzeReport, getUserReports };
export default reportController;