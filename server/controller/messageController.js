import asyncHandler from "express-async-handler";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import Appointment from "../models/apointmentModel.js";

// Helper to generate a consistent conversation ID between two users
const getConversationId = (userId1, userId2) => {
    const ids = [userId1.toString(), userId2.toString()].sort();
    return `${ids[0]}_${ids[1]}`;
};

// @desc    Send a message
// @route   POST /api/messages/send
export const sendMessage = asyncHandler(async (req, res) => {
    const { receiverId, text, fileUrl } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !text) {
        res.status(400);
        throw new Error("Receiver and message text are required.");
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
        res.status(404);
        throw new Error("Receiver not found.");
    }

    // Verify confirmed appointment exists
    const appointment = await Appointment.findOne({
        $or: [
            { patientId: senderId, doctorId: receiverId },
            { patientId: receiverId, doctorId: senderId }
        ],
        status: { $in: ["confirmed", "completed"] }
    });

    if (!appointment && !req.user.isAdmin) {
        res.status(403);
        throw new Error("You can only chat after a booking is confirmed.");
    }

    const conversationId = getConversationId(senderId, receiverId);

    const message = await Message.create({
        conversationId,
        senderId,
        receiverId,
        text,
        fileUrl: fileUrl || undefined
    });

    const populatedMessage = await Message.findById(message._id)
        .populate("senderId", "name image role")
        .populate("receiverId", "name image role");

    // Emit via socket.io for real-time
    const io = req.app.get("io");
    if (io) {
        io.to(conversationId).emit("receive_message", populatedMessage);
    }

    res.status(201).json(populatedMessage);
});

// @desc    Get conversation messages between current user and another user
// @route   GET /api/messages/:otherUserId
export const getMessages = asyncHandler(async (req, res) => {
    const { otherUserId } = req.params;
    const currentUserId = req.user._id;

    const conversationId = getConversationId(currentUserId, otherUserId);

    // Verify confirmed appointment exists
    const appointment = await Appointment.findOne({
        $or: [
            { patientId: currentUserId, doctorId: otherUserId },
            { patientId: otherUserId, doctorId: currentUserId }
        ],
        status: { $in: ["confirmed", "completed"] }
    });

    if (!appointment && !req.user.isAdmin) {
        res.status(403);
        throw new Error("You can only access chat after a booking is confirmed.");
    }

    const messages = await Message.find({ conversationId })
        .populate("senderId", "name image role")
        .populate("receiverId", "name image role")
        .sort({ createdAt: 1 });

    // Mark unread messages as read
    await Message.updateMany(
        { conversationId, receiverId: currentUserId, read: false },
        { read: true }
    );

    res.status(200).json(messages);
});

// @desc    Get all conversations for the current user
// @route   GET /api/messages/conversations/list
export const getConversations = asyncHandler(async (req, res) => {
    const currentUserId = req.user._id;

    // Find all messages involving this user, group by conversation
    const messages = await Message.aggregate([
        {
            $match: {
                $or: [
                    { senderId: currentUserId },
                    { receiverId: currentUserId }
                ]
            }
        },
        { $sort: { createdAt: -1 } },
        {
            $group: {
                _id: "$conversationId",
                lastMessage: { $first: "$text" },
                lastMessageTime: { $first: "$createdAt" },
                senderId: { $first: "$senderId" },
                receiverId: { $first: "$receiverId" },
                unreadCount: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ["$receiverId", currentUserId] },
                                    { $eq: ["$read", false] }
                                ]
                            },
                            1, 0
                        ]
                    }
                }
            }
        },
        { $sort: { lastMessageTime: -1 } }
    ]);

    // Populate user details for each conversation
    const conversations = await Promise.all(messages.map(async (conv) => {
        const otherUserId = conv.senderId.toString() === currentUserId.toString()
            ? conv.receiverId
            : conv.senderId;

        const otherUser = await User.findById(otherUserId).select("name image role category isDoctor");

        return {
            conversationId: conv._id,
            otherUser,
            lastMessage: conv.lastMessage,
            lastMessageTime: conv.lastMessageTime,
            unreadCount: conv.unreadCount
        };
    }));

    res.status(200).json(conversations);
});

const messageController = { sendMessage, getMessages, getConversations };
export default messageController;
