import express from "express";
import chatController from "../controller/chatController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/ask", protect.forUser, chatController.askChatbot);

export default router;
