const mongoose = require("mongoose");

const paymentHistorySchema = new mongoose.Schema({
  // Link to user and subscription
  userId: { type: String, required: true, index: true },
  userEmail: { type: String, required: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
  
  // Payment Details
  paymentId: { type: String, unique: true, sparse: true }, // External payment ID
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  
  // Payment Type
  type: { type: String, enum: ["subscription", "invoice", "quotation", "other"], default: "subscription" },
  
  // Reference Documents
  invoiceNo: { type: String }, // M Business Invoice Number
  quotationNo: { type: String }, // M Business Quotation Number
  description: { type: String }, // Description of payment
  
  // Payment Status
  status: { type: String, enum: ["pending", "completed", "failed", "refunded", "cancelled"], default: "pending" },
  
  // Payment Method Details
  paymentMethod: { type: String, enum: ["card", "upi", "netbanking", "wallet", "cash", "other"], default: "other" },
  paymentDetails: {
    cardLast4: { type: String },
    upiId: { type: String },
    bankName: { type: String },
    walletName: { type: String }
  },
  
  // Provider Info (M Business)
  providerCompany: { type: String, default: "M Business" },
  providerGst: { type: String, default: "GSTIN-XXXXXXXXXX" },
  providerAddress: { type: String, default: "M Business, Chennai, Tamil Nadu, India" },
  
  // Transaction Dates
  paymentDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  
  // Receipt/Invoice URL
  receiptUrl: { type: String },
  invoiceUrl: { type: String },
  
  // Plan info at time of payment
  planName: { type: String },
  planDuration: { type: String }, // monthly/yearly
  
  // Metadata
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes
paymentHistorySchema.index({ userId: 1, paymentDate: -1 });
paymentHistorySchema.index({ userEmail: 1, paymentDate: -1 });
paymentHistorySchema.index({ invoiceNo: 1 });
paymentHistorySchema.index({ quotationNo: 1 });

module.exports = mongoose.model("PaymentHistory", paymentHistorySchema);
