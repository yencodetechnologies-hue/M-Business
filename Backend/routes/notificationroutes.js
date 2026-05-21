const express = require('express');
const router = express.Router();
const Notification = require('../models/NotificationModel');

// Get notifications for a user
router.get('/:userId', async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(50);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ msg: "Marked as read" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// Mark all as read
router.patch('/read-all/:userId', async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.params.userId, isRead: false }, { isRead: true });
        res.json({ msg: "All marked as read" });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// Create notification
router.post('/', async (req, res) => {
    try {
        const { userId, type, icon, text, link } = req.body;
        const newNotif = new Notification({ userId, type, icon, text, link });
        await newNotif.save();
        res.json(newNotif);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

module.exports = router;
