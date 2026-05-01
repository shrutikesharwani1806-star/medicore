import express from "express";
import messageController from "../controller/messageController.js";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Send a message (with optional file upload)
router.post("/send", protect.forUser, messageController.sendMessage);

// Get or create conversation
router.post("/get-or-create", protect.forUser, messageController.getOrCreateConversation);

// Get conversation list for current user
router.get("/conversations/list", protect.forUser, messageController.getConversations);

// Delete an entire conversation with a specific user
router.delete("/conversation/:otherUserId", protect.forUser, messageController.deleteConversation);

// Delete a single message
router.delete("/:messageId", protect.forUser, messageController.deleteMessage);

// Edit a single message
router.put("/:messageId", protect.forUser, messageController.editMessage);

// Get messages with a specific user
router.get("/:otherUserId", protect.forUser, messageController.getMessages);

// Upload a file for chat
router.post("/upload", protect.forUser, upload.single("chatFile"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    res.json({ fileUrl: req.file.path });
});

export default router;
