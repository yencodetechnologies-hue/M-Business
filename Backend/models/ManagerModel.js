const mongoose = require("mongoose");

const managerSchema = new mongoose.Schema({
  managerName:   { type: String, required: true },
  email:         { type: String, required: true, unique: true },
  phone:         { type: String, default: "" },
  department:    { type: String, default: "" },
  role:          { type: String, default: "Manager" },
  address:       { type: String, default: "" },
  password:      { type: String, default: "" },
  status:        { type: String, enum: ["Active","Inactive"], default: "Active" },
  companyId: { type: String, default: "" },
  otp: { type: String, default: "" },
  otpExpires: { type: Date },

}, { timestamps: true });

module.exports = mongoose.model("Manager", managerSchema);