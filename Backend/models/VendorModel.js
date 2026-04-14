const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  vendorName: { type: String, required: true },
  vendorProduct: { type: String, required: true },
  amount: { type: Number, required: true },
  tax: { type: Number, required: true },
  gst: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  paidAmount: { type: Number, required: true },
  productDescription: { type: String },
  dateOfPurchase: { type: Date },
  modeOfPayment: { type: String },
  companyId: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
