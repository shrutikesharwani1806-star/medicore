import express from "express"
import dotenv from "dotenv"
import path from 'node:path'
import { fileURLToPath } from "url"
import colors from "colors"
import cors from "cors"
import { createServer } from "http"
import { Server } from "socket.io"

//local Routes
import connectDB from "./config/dbConfig.js"
import authRoutes from "./routes/authRoutes.js"
import errorHandler from "./middleware/errorHandler.js"
import adminRoutes from "./routes/adminRoutes.js"
import doctorRoutes from "./routes/doctorRoutes.js"
import reportRoutes from "./routes/reportRoutes.js"
import appointmentRoutes from "./routes/appointmentRoutes.js"
import prescriptionRoutes from "./routes/prescriptionRoutes.js"
import chatRoutes from "./routes/chatRoutes.js"
import messageRoutes from "./routes/messageRoutes.js"
import paymentRoutes from "./routes/paymentRoutes.js"
import reviewRoutes from "./routes/reviewRoutes.js"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

//db connection
connectDB()


const PORT = process.env.PORT || 5000

const app = express()

// Allowed origins for CORS
const allowedOrigins = [
    process.env.CLIENT_URL,            // Production frontend (Render)
    "http://localhost:5173",            // Vite dev server
    "http://127.0.0.1:5173",            // Vite dev server (IP)
    "http://[::1]:5173",               // Vite dev server (IPv6)
    "http://localhost:5000",            // Same-origin in production
    "http://127.0.0.1:5000",            // Same-origin (IP)
    "http://[::1]:5000",               // Same-origin (IPv6)
    "https://medicore-6kuo.onrender.com" // Explicit Render URL
].filter(Boolean)

// CORS configuration
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
}))

// Special middleware for Private Network Access (PNA)
app.use((req, res, next) => {
    if (req.headers['access-control-request-private-network']) {
        res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }
    // Handle preflight for PNA
    if (req.method === 'OPTIONS' && req.headers['access-control-request-private-network']) {
        return res.sendStatus(204);
    }
    next();
})

//Body-Parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization", "Access-Control-Allow-Private-Network"],
    },
    transports: ["websocket", "polling"],
})

// Store online users: userId -> socketId
const onlineUsers = new Map();

// Socket.io logic
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`.cyan);

    // Register user as online
    socket.on("register_user", (userId) => {
        if (userId) {
            onlineUsers.set(userId, socket.id);
            console.log(`User ${userId} is now online`.green);
            io.emit("online_users", Array.from(onlineUsers.keys()));
        }
    });

    // Join a conversation room for chat
    socket.on("join_room", (room) => {
        socket.join(room)
        console.log(`User ${socket.id} joined room: ${room}`.cyan)
    })

    // Leave a room
    socket.on("leave_room", (room) => {
        socket.leave(room)
        console.log(`User ${socket.id} left room: ${room}`.cyan)
    })

    socket.on("send_message", (data) => {
        console.log(`Message sent in room: ${data.room || data.conversationId}`.cyan)
        io.to(data.room || data.conversationId).emit("receive_message", data)
    })

    // Typing indicators
    socket.on("typing", (data) => {
        // data: { room, userId, isTyping }
        socket.to(data.room).emit("user_typing", data);
    });

    socket.on("disconnect", () => {
        // Find and remove user from online list
        for (let [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                console.log(`User ${userId} is now offline`.yellow);
                break;
            }
        }
        io.emit("online_users", Array.from(onlineUsers.keys()));
        console.log(`User disconnected: ${socket.id}`.yellow)
    })
})

// Attach io to app
app.set("io", io);

// Export io to use in controllers if needed
export { io }

// DEFAULT ROUTE


//Auth Routes
app.use("/api/auth", authRoutes)

//Admin Routes
app.use("/api/admin", adminRoutes)

//Doctor Routes
app.use("/api/doctor", doctorRoutes)

//Appointment Routes
app.use("/api/appointment", appointmentRoutes)

//Prescription Routes
app.use("/api/prescriptions", prescriptionRoutes)

//Report Routes
app.use("/api/report", reportRoutes)

//Chat Routes (AI Chatbot)
app.use("/api/chat", chatRoutes);

//Message Routes (Patient-Doctor Chat)
app.use("/api/messages", messageRoutes);

//Payment Routes
app.use("/api/payment", paymentRoutes);

//Review Routes
app.use("/api/reviews", reviewRoutes);

//uploadRoutes
app.use('/uploads', express.static('uploads'));


const buildPath = path.resolve(__dirname, '../client/dist');

//5. Static files serving & SPA Routing
// serve static files from the build directory
app.use(express.static(buildPath));

// Express v5 requires a named parameter for wildcards (/*splat)
app.get('/*splat', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'), (err) => {
        if (err) {
            //if index.html is missing, this provides a clearer error
            res.status(500).send("Build file index.html not found. Ensure you ran 'npm run build' in the client folder.");
        }
    });
});

//error handler 
app.use(errorHandler)

httpServer.listen(PORT, "0.0.0.0", () => console.log(`SERVER IS RUNNING AT PORT : ${PORT}`.bgBlue.white))
