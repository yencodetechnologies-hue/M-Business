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
      enum: ["Cash", "Card", "UPI", "Bank Transfer", "Cheque"],
      default: "Cash",
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", ExpenseSchema);
