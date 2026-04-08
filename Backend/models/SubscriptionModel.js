const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  userEmail: { type: String, required: true },
  userName: { type: String },
  
  // Current Plan Details
  planName: { type: String, required: true, enum: ["Free", "Starter", "Professional", "Enterprise"] },
  planPrice: { type: Number, default: 0 },
  billingCycle: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
  
  // Subscription Status
  status: { type: String, enum: ["active", "inactive", "cancelled", "expired", "pending"], default: "pending" },
  isFullyPaid: { type: Boolean, default: false },
  
  // Dates
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  nextBillingDate: { type: Date },
  
  // Features included in plan
  features: [{ type: String }],
  
  // Payment provider info
  paymentMethod: { type: String, enum: ["card", "upi", "netbanking", "cash", "other"], default: "other" },
  
  // M Business as provider
  providerCompany: { type: String, default: "M Business" },
  providerEmail: { type: String, default: "billing@mbusiness.com" },
  providerPhone: { type: String, default: "+91-XXXXXXXXXX" },
  
  // Invoice/Quotation references
  invoiceRefs: [{ type: String }], // Invoice numbers
  quotationRefs: [{ type: String }], // Quotation numbers
  
  // Metadata
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for faster queries
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ userEmail: 1 });

module.exports = mongoose.model("Subscription", subscriptionSchema);
