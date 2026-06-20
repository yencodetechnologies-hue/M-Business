const mongoose = require("mongoose");

const ProposalSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    client: { type: String, default: "" },
    clientName: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "pending", "sent", "approved", "rejected", "negotiation", "won", "lost"],
      default: "draft"
    },
    sentAt: { type: Date, default: null },
    theme: { type: String, default: "Violet" },
    format: { type: String, default: "ppt" },
    slides: { type: Array, default: [] },
    html: { type: String, default: "" },
    formData: { type: Object, default: {} },
    rejectNote: { type: String, default: "" },
    submittedAt: { type: Date, default: null },
    companyId: { type: String, default: "" },
    assignedEmployee: { type: String, default: "" },
    value: { type: Number, default: 0 },
    clientSignature: { type: String, default: "" },
    clientSignedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Proposal", ProposalSchema);