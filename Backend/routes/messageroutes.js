const express = require('express');
const router = express.Router();
const Message = require('../models/MessageModel');
const User = require('../models/UserModels');

// Get all messages for a company
router.get('/', async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId) return res.status(400).json({ msg: "Company ID required" });
        const messages = await Message.find({ companyId }).sort({ createdAt: -1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// Send a message
router.post('/', async (req, res) => {
    try {
        const { senderId, senderName, receiverId, receiverName, content, companyId } = req.body;
        const newMessage = new Message({
            senderId, senderName, receiverId, receiverName, content, companyId
        });
        const savedMessage = await newMessage.save();
        res.json(savedMessage);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// Mark as read
router.patch('/:id/read', async (req, res) => {
    try {
        await Message.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ msg: "Marked as read" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// Get users for messaging (to know who to send to)
router.get('/users', async (req, res) => {
    try {
        const { companyId } = req.query;
        // In a real app, you'd fetch from SubAdmin, Employee, Manager, Client models
        // For simplicity, let's assume they are all in User model or linked.
        // Let's try to get them from User model.
        const users = await User.find({ companyId }).select('name email role');
        res.json(users);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

module.exports = router;
