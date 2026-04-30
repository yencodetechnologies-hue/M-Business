const mongoose = require("mongoose");

const ProposalSchema = new mongoose.Schema(
  {
    id:        { type: String, required: true, unique: true }, // PROP-XXXX
    title:     { type: String, required: true },
    client:    { type: String, default: "" },
    status:    { 
      type: String, 
      enum: ["draft", "pending", "approved", "rejected"],
      default: "draft" 
    },
    theme:     { type: String, default: "Violet" },
    format:    { type: String, default: "ppt" },
    slides:    { type: Array,   default: [] },
    rejectNote: { type: String,  default: "" },
    companyId: { type: String, default: "" },
    assignedEmployee: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Proposal", ProposalSchema);
