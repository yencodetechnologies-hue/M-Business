const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    senderName: { type: String, required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, required: true },
    receiverName: { type: String, required: true },
    content: { type: String, required: true },
    attachmentUrl: { type: String, default: "" },
    attachmentName: { type: String, default: "" },
    companyId: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
