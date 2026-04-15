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
  status: { type: String, enum: ["active", "inactive", "cancelled", "expired", "pending", "grace_period", "hidden"], default: "pending" },
  isFullyPaid: { type: Boolean, default: false },

  // Dates
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  nextBillingDate: { type: Date },
  expiredAt: { type: Date }, // When subscription actually expired
  hiddenAt: { type: Date }, // When subscription was hidden (60 days after expiry)

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
  providerEmail: { type: String, default: "billing@mbusiness.com" },
  providerPhone: { type: String, default: "+91-XXXXXXXXXX" },

  // Invoice/Quotation references
  invoiceRefs: [{ type: String }], // Invoice numbers
  quotationRefs: [{ type: String }], // Quotation numbers

  // Tenant Linkage
  companyId: { type: String, index: true },

  // Subadmin visibility control
  showInDashboard: { type: Boolean, default: true },

  // Metadata
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for faster queries
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ userEmail: 1 });

// Virtual field to calculate days left
subscriptionSchema.virtual("daysLeft").get(function() {
  if (!this.endDate) return 0;
  const end = new Date(this.endDate);
  const today = new Date();
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Include virtuals when converting to JSON/Object
subscriptionSchema.set("toJSON", { virtuals: true });
subscriptionSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);
