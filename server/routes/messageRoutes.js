import express from "express";
import messageController from "../controller/messageController.js";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Send a message (with optional file upload)
router.post("/send", protect.forUser, messageController.sendMessage);

// Get conversation list for current user
router.get("/conversations/list", protect.forUser, messageController.getConversations);

// Get messages with a specific user
router.get("/:otherUserId", protect.forUser, messageController.getMessages);

// Upload a file for chat
router.post("/upload", protect.forUser, upload.single("chatFile"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    res.json({ fileUrl: req.file.path });
});

export default router;
