import { io } from "socket.io-client";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "https://medicore-6kuo.onrender.com";

const socket = io(BACKEND_URL, {
  transports: ["websocket"], 
  withCredentials: true,
  autoConnect: true,
});

socket.on("connect", () => console.log("✅ Socket connected:", socket.id));
socket.on("connect_error", (err) => console.error("❌ Socket connection error:", err));
console.log("Socket initialized with URL:", BACKEND_URL);

export default socket;