import axios from "axios";

// ✅ Base URL (auto switch between local & production)
const BACKEND_URL = import.meta.env.DEV ? "http://localhost:5000" : "";

// ✅ Create instance
const axiosInstance = axios.create({
    baseURL: import.meta.env.DEV ? `${BACKEND_URL}/api` : "/api",
    withCredentials: true,
    timeout: 15000, // prevent hanging requests
    headers: {
        "Content-Type": "application/json",
    },
});

// ✅ REQUEST INTERCEPTOR (attach token)
axiosInstance.interceptors.request.use(
    (config) => {
        try {
            const token = localStorage.getItem("token");

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (err) {
            console.error("Token read error:", err);
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ RESPONSE INTERCEPTOR (handle errors globally)
axiosInstance.interceptors.response.use(
    (response) => response,

    (error) => {
        const status = error.response?.status;

        // 🔴 Unauthorized → logout
        if (status === 401) {
            localStorage.removeItem("token");

            // prevent redirect loop
            if (!window.location.pathname.includes("/login")) {
                window.location.href = "/login";
            }
        }

        // 🟠 Server down / network issue
        if (!error.response) {
            console.error("Network error / Backend not reachable");
        }

        // 🟡 Other errors logging (optional)
        if (status >= 500) {
            console.error("Server error:", error.response);
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
