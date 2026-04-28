const mongoose = require("mongoose");

const IncomeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Project Payment", "Advance", "Service Fee", "Maintenance", "Miscellaneous"],
      default: "Project Payment",
    },
    paymentMode: {
      type: String,
      required: true,
      enum: ["GPay", "PhonePe", "NEFT", "RTGS", "Cash", "Check", "Card", "UPI", "Bank Transfer"],
      default: "GPay",
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },
    date: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
    },
    client: {
      type: String,
      default: "",
    },
    invoiceNo: {
      type: String,
      default: "",
    },
    transactionId: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Received", "Pending", "Cancelled"],
      default: "Received",
    },
    companyId: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Income", IncomeSchema);
