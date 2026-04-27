import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import Payment from "../models/paymentModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { notifyWithdrawalRequested, notifyPaymentReceived, notifySubscriptionDue } from "../services/smsService.js";


// @desc    Get admin QR code for credit purchase
// @route   GET /api/payment/qr-code
const getAdminQrCode = asyncHandler(async (req, res) => {
    const admin = await User.findOne({ isAdmin: true }).select("adminQrCode name");
    if (!admin || !admin.adminQrCode) {
        return res.status(200).json({ qrCode: "", message: "Admin QR code not yet uploaded." });
    }
    res.status(200).json({ qrCode: admin.adminQrCode });
});

// @desc    Request to buy credits (patient submits payment proof)
// @route   POST /api/payment/buy-credits
const buyCredits = asyncHandler(async (req, res) => {
    const { amount, paymentProof } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
        res.status(400);
        throw new Error("Please specify a valid credit amount.");
    }

    // Create a pending payment record
    const payment = await Payment.create({
        userId,
        type: 'credit_purchase',
        amount: amount,
        credits: amount, // 1:1 credit ratio (₹1 = 1 credit)
        status: 'pending',
        paymentProof: paymentProof || "",
        description: `Credit purchase request of ₹${amount}`
    });

    res.status(201).json({
        success: true,
        message: "Credit purchase request submitted! Admin will verify and add credits.",
        payment
    });
});

// @desc    Admin: Approve credit purchase (adds credits to patient)
// @route   PUT /api/payment/approve/:paymentId
const approveCreditPurchase = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
        res.status(404);
        throw new Error("Payment not found.");
    }

    if (payment.status === 'completed') {
        res.status(400);
        throw new Error("Payment already approved.");
    }

    // Add credits to user (90% of amount, 10% goes to admin)
    const user = await User.findById(payment.userId);
    if (!user) {
        res.status(404);
        throw new Error("User not found.");
    }

    const fee = Math.floor(payment.amount * 0.1);
    const receivedCredits = payment.amount - fee;

    user.credits += receivedCredits;
    await user.save();

    payment.status = 'completed';
    payment.credits = receivedCredits;
    await payment.save();

    // Give admin the fee
    const admin = await User.findOne({ isAdmin: true });
    if (admin) {
        admin.earnings = (admin.earnings || 0) + fee;
        await admin.save();

        // Create fee record
        await Payment.create({
            userId: payment.userId,
            receiverId: admin._id,
            type: 'credit_purchase_fee',
            amount: fee,
            status: 'completed',
            description: `10% fee on credit purchase`
        });
    }

    // Emit notification
    const io = req.app.get("io");
    if (io) {
        io.emit("receive_notification", {
            type: "CREDITS_ADDED",
            message: `₹${payment.credits} credits added to your account!`,
            userId: user._id,
            time: new Date()
        });
    }

    res.status(200).json({
        success: true,
        message: `₹${payment.credits} credits added to ${user.name}'s account.`,
        newBalance: user.credits
    });
});

// @desc    Admin: Get all pending credit requests
// @route   GET /api/payment/pending
const getPendingPayments = asyncHandler(async (req, res) => {
    const payments = await Payment.find({ type: 'credit_purchase', status: 'pending' })
        .populate("userId", "name email phone image")
        .sort({ createdAt: -1 });

    res.status(200).json(payments);
});

// @desc    Get user's payment history
// @route   GET /api/payment/history
const getPaymentHistory = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const payments = await Payment.find({
        $or: [{ userId }, { receiverId: userId }]
    })
        .populate("userId", "name email")
        .populate("receiverId", "name email")
        .populate("appointmentId", "date slot status")
        .sort({ createdAt: -1 });

    res.status(200).json(payments);
});

// @desc    Get user's pending payment requests (consultation fees)
// @route   GET /api/payment/requests
const getPaymentRequests = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const requests = await Payment.find({
        userId,
        type: 'consultation_fee',
        status: 'pending'
    })
        .populate("receiverId", "name category image")
        .populate("appointmentId", "date slot status type")
        .sort({ createdAt: -1 });

    res.status(200).json(requests);
});

// @desc    Get doctor earnings summary
// @route   GET /api/payment/doctor-earnings
const getDoctorEarnings = asyncHandler(async (req, res) => {
    const doctorId = req.user._id;

    const payments = await Payment.find({
        receiverId: doctorId,
        type: 'consultation_fee',
        status: 'completed'
    })
        .populate("userId", "name email image")
        .populate("appointmentId", "date slot status")
        .sort({ createdAt: -1 });

    const totalEarnings = req.user.earnings || 0;

    res.status(200).json({
        totalEarnings,
        transactions: payments
    });
});

// @desc    Get admin earnings summary
// @route   GET /api/payment/admin-earnings
const getAdminEarnings = asyncHandler(async (req, res) => {
    const adminId = req.user._id;

    const payments = await Payment.find({
        receiverId: adminId,
        status: 'completed'
    })
        .populate("userId", "name email image")
        .populate("appointmentId", "date slot status")
        .sort({ createdAt: -1 });

    const totalEarnings = req.user.earnings || 0;

    let creditFees = 0;
    let consultationShares = 0;
    let subscriptions = 0;

    payments.forEach(p => {
        if (p.type === 'credit_purchase_fee') creditFees += p.amount;
        else if (p.type === 'consultation_fee' || p.type === 'booking_fee' || p.type === 'admin_share') consultationShares += p.amount;
        else if (p.type === 'subscription_fee') subscriptions += p.amount;
    });

    res.status(200).json({
        totalEarnings,
        breakdown: {
            creditFees,
            consultationShares,
            subscriptions
        },
        transactions: payments
    });
});

// @desc    Admin: Upload QR Code
// @route   PUT /api/payment/upload-qr
const uploadAdminQrCode = asyncHandler(async (req, res) => {
    const { qrCode } = req.body;

    if (!qrCode) {
        res.status(400);
        throw new Error("QR code image is required.");
    }

    const admin = await User.findById(req.user._id);
    admin.adminQrCode = qrCode;
    await admin.save();

    res.status(200).json({
        success: true,
        message: "QR code uploaded successfully!",
        adminQrCode: admin.adminQrCode
    });
});

// @desc    Create Razorpay Order
// @route   POST /api/payment/razorpay/order
const createRazorpayOrder = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
        res.status(400);
        throw new Error("Invalid amount");
    }

    // Initialize Razorpay with dummy keys if not in env for test purposes
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_dummy_key_secret',
    });

    const options = {
        amount: amount * 100, // amount in smallest currency unit (paise)
        currency: "INR",
        receipt: `receipt_order_${Date.now()}`
    };

    try {
        const order = await razorpay.orders.create(options);
        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500);
        throw new Error("Failed to create Razorpay order");
    }
});

// @desc    Verify Razorpay Payment
// @route   POST /api/payment/razorpay/verify
const verifyRazorpayPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
    const userId = req.user._id;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_dummy_key_secret';

    const generated_signature = crypto
        .createHmac("sha256", secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

    if (generated_signature !== razorpay_signature) {
        res.status(400);
        throw new Error("Payment verification failed. Invalid signature.");
    }

    const fee = Math.floor(amount * 0.1);
    const receivedCredits = amount - fee;

    // Payment is verified. Create payment record and add credits
    const payment = await Payment.create({
        userId,
        type: 'credit_purchase',
        amount: amount,
        credits: receivedCredits, // 90%
        status: 'completed',
        paymentProof: razorpay_payment_id, // Store payment ID as proof
        description: `Credit purchase via Razorpay`
    });

    // Add credits to user
    const user = await User.findById(userId);
    user.credits += receivedCredits;
    await user.save();

    // Give admin the fee
    const admin = await User.findOne({ isAdmin: true });
    if (admin) {
        admin.earnings = (admin.earnings || 0) + fee;
        await admin.save();

        await Payment.create({
            userId,
            receiverId: admin._id,
            type: 'credit_purchase_fee',
            amount: fee,
            status: 'completed',
            description: `10% fee on credit purchase via Razorpay`
        });
    }

    // Emit notification
    const io = req.app.get("io");
    if (io) {
        io.emit("receive_notification", {
            type: "CREDITS_ADDED",
            message: `₹${amount} credits added to your account via Razorpay!`,
            userId: user._id,
            time: new Date()
        });
    }

    res.status(200).json({
        success: true,
        message: `₹${amount} credits added to your account successfully!`,
        newBalance: user.credits,
        payment
    });
});

// @desc    Doctor: Request Withdrawal
// @route   POST /api/payment/withdrawal
const requestWithdrawal = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    const doctorId = req.user._id;

    if (!amount || amount <= 0) {
        res.status(400);
        throw new Error("Invalid amount");
    }

    const doctor = await User.findById(doctorId);
    if (doctor.earnings < amount) {
        res.status(400);
        throw new Error(`Insufficient earnings! Current balance: ₹${doctor.earnings}`);
    }

    // Check if QR code is uploaded
    if (!doctor.qrCode) {
        res.status(400);
        throw new Error("Please upload your Payment QR code in your profile before requesting withdrawal.");
    }

    // Deduct from earnings
    doctor.earnings -= amount;
    await doctor.save();

    // Create withdrawal request
    const withdrawal = await Payment.create({
        userId: doctorId,
        type: 'withdrawal',
        amount: amount,
        status: 'pending',
        description: `Withdrawal request of ₹${amount}`
    });

    // Notify via SMS
    await notifyWithdrawalRequested(doctor, amount);

    res.status(201).json({

        success: true,
        message: "Withdrawal request submitted! Admin will transfer the amount to your QR code soon.",
        newBalance: doctor.earnings,
        withdrawal
    });
});

// @desc    Admin: Get pending withdrawals
// @route   GET /api/payment/withdrawals/pending
const getPendingWithdrawals = asyncHandler(async (req, res) => {
    const withdrawals = await Payment.find({ type: 'withdrawal', status: 'pending' })
        .populate("userId", "name email phone image qrCode")
        .sort({ createdAt: -1 });

    res.status(200).json(withdrawals);
});

// @desc    Admin: Approve/Reject withdrawal
// @route   PUT /api/payment/withdrawal/:id
const updateWithdrawalStatus = asyncHandler(async (req, res) => {
    const { status } = req.body; // 'completed' or 'failed'
    const { id } = req.params;

    const withdrawal = await Payment.findById(id);
    if (!withdrawal) {
        res.status(404);
        throw new Error("Withdrawal request not found");
    }

    if (withdrawal.status !== 'pending') {
        res.status(400);
        throw new Error("Withdrawal is already processed");
    }

    if (status === 'completed') {
        withdrawal.status = 'completed';
        await withdrawal.save();

        // Notify doctor via SMS
        const doctor = await User.findById(withdrawal.userId);
        if (doctor) {
            await notifyPaymentReceived(doctor, withdrawal.amount);
        }
    } else if (status === 'failed') {
        // Refund earnings
        const doctor = await User.findById(withdrawal.userId);
        if (doctor) {
            doctor.earnings += withdrawal.amount;
            await doctor.save();
        }
        withdrawal.status = 'failed';
        await withdrawal.save();
    }

    res.status(200).json({
        success: true,
        message: `Withdrawal marked as ${status}`
    });
});

// @desc    Doctor: Pay ₹500 monthly platform subscription from credits
// @route   POST /api/payment/subscription
const paySubscription = asyncHandler(async (req, res) => {
    const doctorId = req.user._id;
    const PLATFORM_FEE = 500;

    const doctor = await User.findById(doctorId);
    if (!doctor || !doctor.isDoctor) {
        res.status(403);
        throw new Error("Only doctors can pay subscription.");
    }

    // Check if already paid this month
    if (doctor.subscriptionPaidDate) {
        const paidDate = new Date(doctor.subscriptionPaidDate);
        const now = new Date();
        if (paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear()) {
            res.status(400);
            throw new Error("You have already paid this month's subscription.");
        }
    }

    if (doctor.credits < PLATFORM_FEE) {
        res.status(400);
        throw new Error(`Insufficient credits! You need ₹${PLATFORM_FEE} credits. Current balance: ₹${doctor.credits}. Please buy more credits first.`);
    }

    // Deduct credits
    doctor.credits -= PLATFORM_FEE;
    doctor.subscriptionStatus = 'paid';
    doctor.subscriptionPaidDate = new Date();
    await doctor.save();

    // Create payment record
    const admin = await User.findOne({ isAdmin: true });
    await Payment.create({
        userId: doctorId,
        receiverId: admin?._id,
        type: 'subscription',
        amount: PLATFORM_FEE,
        status: 'completed',
        description: `Monthly platform subscription fee - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`
    });

    // Add to admin earnings
    if (admin) {
        admin.earnings = (admin.earnings || 0) + PLATFORM_FEE;
        await admin.save();
    }

    res.status(200).json({
        success: true,
        message: "Subscription paid successfully! You can now accept appointments this month.",
        credits: doctor.credits,
        subscriptionStatus: doctor.subscriptionStatus,
        subscriptionPaidDate: doctor.subscriptionPaidDate
    });
});

// @desc    Doctor: Check subscription status
// @route   GET /api/payment/subscription-status
const getSubscriptionStatus = asyncHandler(async (req, res) => {
    const doctor = await User.findById(req.user._id);
    if (!doctor) {
        res.status(404);
        throw new Error("User not found");
    }

    let isActive = false;
    if (doctor.subscriptionPaidDate) {
        const paidDate = new Date(doctor.subscriptionPaidDate);
        const now = new Date();
        isActive = paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
    }

    // If subscription expired, reset status and notify
    if (!isActive) {
        if (doctor.subscriptionStatus === 'paid') {
            doctor.subscriptionStatus = 'unpaid';
            await doctor.save();
            await notifySubscriptionDue(doctor);
        } else if (doctor.subscriptionPaidDate) {
            // Check if it's been more than 30 days since last payment and notify again if needed
            const lastPaid = new Date(doctor.subscriptionPaidDate);
            const now = new Date();
            const daysSince = Math.floor((now - lastPaid) / (1000 * 60 * 60 * 24));
            if (daysSince >= 30 && daysSince % 30 === 0) { // Notify every 30 days if still unpaid
                await notifySubscriptionDue(doctor);
            }
        }
    }

    res.status(200).json({
        subscriptionStatus: isActive ? 'paid' : 'unpaid',
        subscriptionPaidDate: doctor.subscriptionPaidDate,
        credits: doctor.credits,
        earnings: doctor.earnings
    });
});

const paymentController = {
    getAdminQrCode,
    buyCredits,
    approveCreditPurchase,
    getPendingPayments,
    getPaymentHistory,
    getPaymentRequests,
    getDoctorEarnings,
    getAdminEarnings,
    uploadAdminQrCode,
    createRazorpayOrder,
    verifyRazorpayPayment,
    requestWithdrawal,
    getPendingWithdrawals,
    updateWithdrawalStatus,
    paySubscription,
    getSubscriptionStatus
};

export default paymentController;
