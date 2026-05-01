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
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are MediBot — a professional, empathetic AI medical assistant integrated into the MediCore hospital management platform. 

Guidelines:
- Provide accurate, helpful health information in a warm, caring tone.
- Use bullet points and structured formatting for clarity.
- For symptoms: suggest possible causes, immediate self-care tips, and when to see a doctor.
- For appointments: guide users to use MediCore's "Find Doctor" and "Book Appointment" features.
- NEVER provide definitive diagnoses. Always recommend consulting a qualified doctor for serious concerns.
- Keep responses concise (2-4 paragraphs max) but thorough.
- If the query is non-medical, politely redirect to health-related assistance.

User message: "${message}"

Please respond helpfully:`;

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
