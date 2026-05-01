const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    text: { type: String, required: true },
    type: { type: String, default: 'info' }, // info, success, warning, danger
    icon: { type: String, default: '🔔' },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    companyId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);
