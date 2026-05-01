import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: String,
        required: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String
    },
    read: {
        type: Boolean,
        default: false
    },
    isEdited: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient querying of conversations
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
