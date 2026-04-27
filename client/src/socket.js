import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';

const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  withCredentials: true,
});

export default socket;
