const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    docType: { type: String, default: "lh" },
    sendTo: { type: String, enum: ['client', 'employee'], default: "client" },
    client: { type: String, required: true },
    recipientEmail: { type: String },
    htmlContent: { type: String, required: true },
    senderCompany: { type: String },
    companyId: { type: String, required: true },
    clientId: { type: String, default: "" },
    employeeId: { type: String, default: "" },
    dateSent: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', DocumentSchema);