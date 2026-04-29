const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  userEmail: { type: String, required: true },
  userName: { type: String },

  // Current Plan Details
  planName: { type: String, required: true, enum: ["Free", "Trial", "Starter", "Professional", "Enterprise", "Custom"] },
  planPrice: { type: Number, default: 0 },
  billingCycle: { type: String, enum: ["monthly", "yearly", "trial", "custom"], default: "monthly" },

  // Trial
  isTrial: { type: Boolean, default: false },

  // Usage Tracking (e.g., number of employees/actions used)
  usageLimit: { type: Number, default: 999 },
  usageCount: { type: Number, default: 0 },
  usageLimitAlertSent: { type: Boolean, default: false },

  // Subscription Status
  status: { type: String, enum: ["active", "inactive", "cancelled", "expired", "pending", "grace_period", "hidden"], default: "pending" },
  isFullyPaid: { type: Boolean, default: false },

  // Dates
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  nextBillingDate: { type: Date },
  expiredAt: { type: Date },
  hiddenAt: { type: Date },

  // Reminder tracking
  reminderSent: { type: Boolean, default: false },
  reminderSentAt: { type: Date },
  expiryNotificationSent: { type: Boolean, default: false },

  // Features included in plan
  features: [{ type: String }],

  // Payment provider info
  paymentMethod: { type: String, enum: ["card", "upi", "netbanking", "cash", "other"], default: "other" },

  // M Business as provider
  providerCompany: { type: String, default: "M Business" },
  providerEmail: { type: String, default: "billing@m-business.com" },
  providerPhone: { type: String, default: "+91-9876543210" },
  providerGst: { type: String, default: "GSTIN-33AABCM1234Z1Z1" },
  providerAddress: { type: String, default: "M Business Support, India" },

  // Invoice/Quotation references (Business Suite provides these)
  invoiceRefs: [{ type: String }],
  quotationRefs: [{ type: String }],

  // Tenant Linkage
  companyId: { type: String, index: true },

  // Subadmin visibility control (controlled by admin via mySubscriptions permission)
  showInDashboard: { type: Boolean, default: true },

  // Notes
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ userEmail: 1 });
subscriptionSchema.index({ companyId: 1, status: 1 });

// Virtual: days remaining
subscriptionSchema.virtual("daysLeft").get(function () {
  if (!this.endDate) return 0;
  const end = new Date(this.endDate);
  const today = new Date();
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Virtual: usage remaining
subscriptionSchema.virtual("usageRemaining").get(function () {
  return Math.max(0, (this.usageLimit || 999) - (this.usageCount || 0));
});

subscriptionSchema.set("toJSON", { virtuals: true });
subscriptionSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);
