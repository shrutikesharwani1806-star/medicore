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

// @desc    Get or Create a conversation with a specific user
// @route   POST /api/messages/get-or-create
export const getOrCreateConversation = asyncHandler(async (req, res) => {
    const { targetUserId } = req.body;
    const currentUserId = req.user._id;

    console.log(`Get/Create Conversation: ${currentUserId} -> ${targetUserId}`.cyan);

    if (!targetUserId) {
        res.status(400);
        throw new Error("Target user ID is required.");
    }

    // Verify target user exists
    const targetUser = await User.findById(targetUserId).select("name image role category isDoctor");
    if (!targetUser) {
        res.status(404);
        throw new Error("Target user not found.");
    }

    const conversationId = getConversationId(currentUserId, targetUserId);

    res.status(200).json({
        conversationId,
        otherUser: targetUser,
        status: "success"
    });
});

// @desc    Delete a single message
// @route   DELETE /api/messages/:messageId
export const deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
        res.status(404);
        throw new Error("Message not found.");
    }

    // Only the sender can delete a message
    if (message.senderId.toString() !== currentUserId.toString()) {
        res.status(403);
        throw new Error("You can only delete your own messages.");
    }

    await Message.findByIdAndDelete(messageId);

    // Emit socket event so the other user's UI updates in real-time
    const io = req.app.get("io");
    if (io) {
        io.to(message.conversationId).emit("message_deleted", { messageId, conversationId: message.conversationId });
    }

    res.status(200).json({ success: true, message: "Message deleted successfully." });
});

// @desc    Delete an entire conversation (all messages between two users)
// @route   DELETE /api/messages/conversation/:otherUserId
export const deleteConversation = asyncHandler(async (req, res) => {
    const { otherUserId } = req.params;
    const currentUserId = req.user._id;

    const conversationId = getConversationId(currentUserId, otherUserId);

    const result = await Message.deleteMany({ conversationId });

    // Emit socket event so the other user's UI updates in real-time
    const io = req.app.get("io");
    if (io) {
        io.to(conversationId).emit("conversation_deleted", { conversationId });
    }

    res.status(200).json({
        success: true,
        message: `Conversation deleted. ${result.deletedCount} messages removed.`
    });
});

// @desc    Edit a single message
// @route   PUT /api/messages/:messageId
export const editMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { text } = req.body;
    const currentUserId = req.user._id;

    if (!text) {
        res.status(400);
        throw new Error("Message text is required for editing.");
    }

    const message = await Message.findById(messageId);
    if (!message) {
        res.status(404);
        throw new Error("Message not found.");
    }

    // Only the sender can edit a message
    if (message.senderId.toString() !== currentUserId.toString()) {
        res.status(403);
        throw new Error("You can only edit your own messages.");
    }

    message.text = text;
    message.isEdited = true;
    await message.save();

    const populatedMessage = await Message.findById(messageId)
        .populate("senderId", "name image role")
        .populate("receiverId", "name image role");

    // Emit socket event so the other user's UI updates in real-time
    const io = req.app.get("io");
    if (io) {
        io.to(message.conversationId).emit("message_edited", populatedMessage);
    }

    res.status(200).json(populatedMessage);
});

const messageController = { sendMessage, getMessages, getConversations, getOrCreateConversation, deleteMessage, deleteConversation, editMessage };
export default messageController;
