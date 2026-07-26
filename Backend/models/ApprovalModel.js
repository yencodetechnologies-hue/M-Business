const mongoose = require('mongoose');

const ApprovalSchema = new mongoose.Schema({
    companyId: { type: String, required: true },
    clientId: { type: String, default: '' },
    recipientType: { type: String, default: 'client' }, // 'client' | 'team'
    teamMemberId: { type: String, default: '' },
    senderName: { type: String, default: '' },
    title: { type: String, required: true },
    desc: { type: String, default: '' },
    icon: { type: String, default: 'ti-file-text' },
    approveLabel: { type: String, default: 'Approve' },
    rejectLabel: { type: String, default: 'Reject' },
    sourceType: { type: String, default: 'general' },
    sourceId: { type: String, default: '' },
    projectId: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    status: { type: String, default: 'pending' },
    rejectReason: { type: String, default: '' },
    respondedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Approval', ApprovalSchema);