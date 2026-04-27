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
    "http://localhost:5000",            // Same-origin in production
].filter(Boolean)

// CORS configuration
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
}))

//Body-Parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    },
    transports: ["websocket", "polling"],
})

// Socket.io logic
io.on("connection", (socket) => {

    // Join a conversation room for chat
    socket.on("join_room", (room) => {
        socket.join(room)
    })

    // Leave a room
    socket.on("leave_room", (room) => {
        socket.leave(room)
    })

    socket.on("send_message", (data) => {
        io.to(data.room || data.conversationId).emit("receive_message", data)
    })

    socket.on("send_notification", (data) => {
        io.emit("receive_notification", data)
    })

    // Typing indicator
    socket.on("typing", (data) => {
        socket.to(data.room || data.conversationId).emit("user_typing", data)
    })

    socket.on("disconnect", () => {
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
if (process.env.NODE_ENV === "production") {
    // serve static files from the build directory
    app.use(express.static(buildPath));

    // Express v5 requires a named parameter for wildcards (/*splat)
    app.get('/*splat', (req, res) => {
        res.sendFile(path.join(buildPath, 'index.html'), (err) => {
            if (err) {
                //if index.html is missing, this provides a clearer error
                res.status(500).send("Build file index.html not found. Ensure you ran 'npm run build' in thr client")
            }
        });
    });
}else {
    app.get("/", (req, res) => {
        res.send("API is running... (development Mode)")
    })
}

//error handler 
app.use(errorHandler)

httpServer.listen(PORT, () => console.log(`SERVER IS RUNNING AT PORT : ${PORT}`.bgBlue.white))
