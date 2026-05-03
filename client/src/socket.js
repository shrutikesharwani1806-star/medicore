import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.DEV ? "http://localhost:5000" : undefined;

const socket = io(BACKEND_URL, {
  transports: ["websocket"], 
  withCredentials: true,
  autoConnect: true,
});

socket.on("connect", () => console.log("✅ Socket connected:", socket.id));
socket.on("connect_error", (err) => console.error("❌ Socket connection error:", err));
console.log("Socket initialized with URL:", BACKEND_URL || "current origin");

export default socket;