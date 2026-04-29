// models/ExpenseModel.js
const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Food", "Travel", "Office", "Utilities", "Marketing", "Salary", "Miscellaneous"],
      default: "Miscellaneous",
    },
    expenseType: {
      type: String,
      required: true,
      enum: ["Operational", "Capital", "Recurring", "One-Time"],
      default: "Operational",
    },
    paymentMode: {
      type: String,
      required: true,
      enum: ["GPay", "PhonePe", "NEFT", "RTGS", "Cash", "Card", "UPI", "Bank Transfer", "Cheque"],
      default: "Cash",
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "₹",
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    companyId: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", ExpenseSchema);
