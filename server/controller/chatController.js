import asyncHandler from "express-async-handler";
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Ask AI Chatbot
// @route   POST /api/chat/ask
export const askChatbot = asyncHandler(async (req, res) => {
    const { message } = req.body;

    if (!message) {
        res.status(400);
        throw new Error("Message is required.");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are a helpful medical assistant bot named MediBot. A user says: "${message}". Please provide a short, helpful response. Avoid giving specific medical diagnoses; instead, suggest consulting a doctor if the situation seems serious.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ reply: text });
    } catch (error) {
        console.error("AI Chatbot Error:", error);
        res.status(500).json({ reply: "I'm sorry, I am currently experiencing technical difficulties. Please try again later." });
    }
});

const chatController = { askChatbot };
export default chatController;
