const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  description: String,
  quantity: Number,
  rate: Number,
  gstRate: { type: Number, default: 18 },
  isGstIncluded: { type: Boolean, default: false }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true, unique: true },
  quotationId: { type: String },
  orderNo: String,
  date: String,
  dueDate: { type: String, default: "" },
  dueDateType: { type: String, default: "30" },
  client: { type: String, required: true },
  project: String,
  gstRate: { type: Number, default: 18 },
  notes: String,
  terms: String,
  companyName: String,
  companyEmail: String,
  companyPhone: String,
  companyAddress: String,
  currency: { type: String, default: "₹" },
  upiId: { type: String, default: "" },
  bankName: { type: String, default: "" },
  accountName: { type: String, default: "" },
  accountNumber: { type: String, default: "" },
  ifscCode: { type: String, default: "" },
  footerMessage: { type: String, default: "" },
  items: [itemSchema],
  subtotal: Number,
  gstAmt: Number,
  total: Number,
  amountPaid: { type: Number, default: 0 },
  paymentDate: String,
  paymentMode: { type: String, default: "GPay" },
  transactionId: { type: String, default: "" },
  isGstIncluded: { type: Boolean, default: false },
  status: { type: String, enum: ["draft", "pending", "sent", "paid", "unpaid", "overdue", "part_paid"], default: "draft" },
  companyId: { type: String, default: "" },
  signature: { type: String, default: "" },
  signatureType: { type: String, default: "text" },
  template: { type: String, default: "Classic" },
}, { timestamps: true });

module.exports = mongoose.model("Invoice", invoiceSchema);