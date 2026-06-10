const mongoose = require("mongoose");

const AuditNoteSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true },
    transactionType: { type: String, enum: ["Income", "Expense", "Bank", "Other"], default: "Other" },
    note: { type: String },
    flagged: { type: Boolean, default: false },
    auditorName: { type: String, default: "Auditor" },
    companyId: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditNote", AuditNoteSchema);
