const mongoose = require('mongoose');

const DocumentRequestSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  documentName: { type: String, required: true }, // e.g. "Aadhar Card", or the Sub Admin's custom name if type is "Other"
  documentType: { type: String, required: true }, // "Offer Letter" | "ID Proof" | "Contract" | "Degree Certificate" | "Resume/CV" | "Other"
  companyId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'uploaded', 'approved', 'rejected'], default: 'pending' },
  fileUrl: { type: String, default: "" },
  fileName: { type: String, default: "" },
  uploadedAt: { type: Date },
  requestedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('DocumentRequest', DocumentRequestSchema);
