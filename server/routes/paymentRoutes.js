import express from "express";
import paymentController from "../controller/paymentController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Public - get admin QR code for credit purchase
router.get("/qr-code", paymentController.getAdminQrCode);

// Patient - buy credits
router.post("/buy-credits", protect.forUser, paymentController.buyCredits);

// Patient/Doctor - payment history
router.get("/history", protect.forUser, paymentController.getPaymentHistory);

// Patient - pending payment requests
router.get("/requests", protect.forUser, paymentController.getPaymentRequests);

// Doctor - earnings summary
router.get("/doctor-earnings", protect.forDoctor, paymentController.getDoctorEarnings);

// Admin - get pending credit requests
router.get("/pending", protect.forAdmin, paymentController.getPendingPayments);

// Admin - approve credit purchase
router.put("/approve/:paymentId", protect.forAdmin, paymentController.approveCreditPurchase);

// Admin - earnings summary
router.get("/admin-earnings", protect.forAdmin, paymentController.getAdminEarnings);

// Admin - upload QR code
router.put("/upload-qr", protect.forAdmin, paymentController.uploadAdminQrCode);

// Patient - create Razorpay order
router.post("/razorpay/order", protect.forUser, paymentController.createRazorpayOrder);

// Patient - verify Razorpay payment
router.post("/razorpay/verify", protect.forUser, paymentController.verifyRazorpayPayment);

// Doctor - Request Withdrawal
router.post("/withdrawal", protect.forDoctor, paymentController.requestWithdrawal);

// Admin - get pending withdrawals
router.get("/withdrawals/pending", protect.forAdmin, paymentController.getPendingWithdrawals);

// Admin - approve/reject withdrawal
router.put("/withdrawal/:id", protect.forAdmin, paymentController.updateWithdrawalStatus);

// Doctor - Pay monthly platform subscription (₹500)
router.post("/subscription", protect.forDoctor, paymentController.paySubscription);

// Doctor - Check subscription status
router.get("/subscription-status", protect.forDoctor, paymentController.getSubscriptionStatus);

export default router;
