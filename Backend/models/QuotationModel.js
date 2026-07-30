// models/QuotationModel.js
const mongoose = require("mongoose");

const QuotationSchema = new mongoose.Schema(
  {
    qt: { type: Object, required: true },
    items: { type: Array, required: true, default: [] },
    status: {
      type: String,
      enum: ["draft", "sent", "pending", "approved", "rejected", "expired", "converted", "negotiation"],
      default: "draft",
    },
    companyId: { type: String, default: "" },
    clientId: { type: String, default: "" },  // client _id for strict portal filtering
    projectId: { type: String, default: "", index: true },  // links this quotation to a specific project
    reviewComment: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quotation", QuotationSchema);
