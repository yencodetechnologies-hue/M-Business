const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  description: String,
  quantity: Number,
  rate: Number,
});

const invoiceSchema = new mongoose.Schema({
  invoiceNo:      { type: String, required: true, unique: true },
  quotationId:    { type: String },
  orderNo:        String,
  date:           String,
  dueDate:        String,
  client:         { type: String, required: true },
  project:        String,
  gstRate:        { type: Number, default: 18 },
  notes:          String,
  terms:          String,
  companyName:    String,
  companyEmail:   String,
  companyPhone:   String,
  companyAddress: String,
  items:          [itemSchema],
  subtotal:       Number,
  gstAmt:         Number,
  total:          Number,
  amountPaid:     { type: Number, default: 0 },
  paymentMode:    { type: String, default: "GPay" },
  transactionId:  { type: String, default: "" },
  status:         { type: String, enum: ["draft", "sent", "paid"], default: "draft" },
  companyId:      { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Invoice", invoiceSchema);