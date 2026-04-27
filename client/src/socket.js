import { io } from "socket.io-client";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "https://medicore-backend.onrender.com";

const socket = io(BACKEND_URL, {
  transports: ["websocket"], // ✅ remove polling (causes issues on Render)
  withCredentials: true,
  autoConnect: true,
});

export default socket;