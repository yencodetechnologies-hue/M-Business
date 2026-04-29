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
        if (!companyId) return res.status(400).json({ msg: "Company ID required" });

        const Client = require('../models/ClientModel');
        const Manager = require('../models/ManagerModel');
        const Employee = require('../models/EmployeeModel');

        // Fetch from all collections
        const [users, clients, managers, employees] = await Promise.all([
            User.find({ companyId }).select('name email role'),
            Client.find({ companyId }).select('clientName email role'),
            Manager.find({ companyId }).select('managerName email role'),
            Employee.find({ companyId }).select('name email role department')
        ]);

        // Normalize and combine
        const allUsers = [
            ...users.map(u => ({ _id: u._id, name: u.name, email: u.email, role: u.role })),
            ...clients.map(c => ({ _id: c._id, name: c.clientName, email: c.email, role: "client" })),
            ...managers.map(m => ({ _id: m._id, name: m.managerName, email: m.email, role: "manager" })),
            ...employees.map(e => ({ _id: e._id, name: e.name, email: e.email, role: "employee", department: e.department }))
        ];

        res.json(allUsers);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

module.exports = router;
