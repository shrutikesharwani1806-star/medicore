import express from "express"
import authController from "../controller/authController.js"
import protect from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/register", authController.registerUser)
router.post("/login", authController.loginUser)
router.get("/me", protect.forUser, authController.getMe)
router.put("/profile", protect.forUser, authController.updateUserProfile)
router.post("/private", protect.forUser, authController.privateController)

// Forgot Password Routes
router.post("/forgot-password", authController.forgotPassword)
router.post("/verify-otp", authController.verifyOtp)
router.post("/reset-password", authController.resetPassword)
export default router