const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  icon: { type: String, default: "📦" },
  type: { type: String, enum: ["free", "paid"], required: true },
  no_of_days: { type: Number, required: true },
  price: { type: Number, required: true },
  
  // Keep existing fields for backward compatibility
  monthlyPrice: { type: String, default: "0" },
  quarterlyPrice: { type: String, default: "0" },
  halfYearlyPrice: { type: String, default: "0" },
  annualPrice: { type: String, default: "0" },
  buttonName: { type: String, default: "Get Started" },
  features: [{ type: String }],
  
  // Custom limits for dropdowns
  planDuration: { type: String, default: "Monthly" },
  businessLimit: { type: String, default: "Single business manage" },
  managerLimit: { type: String, default: "1 Manager" },
  clientLimit: { type: String, default: "3 Client manage" },
  
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  targetRole: { type: String, enum: ["subadmin", "client", "employee", "manager", "all"], default: "subadmin" },
  
  // Assigned subadmins (for specific subadmin assignment)
  assignedSubadmins: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subadmin" }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Package", packageSchema);
