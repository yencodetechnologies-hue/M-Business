const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone:    { type: String, default: "" },
  role:     { type: String, default: "user" },
  logoUrl:  { type: String, default: "" },
  companyId: { type: String, default: "" },
  companyName: { type: String, default: "" },
  mySubscriptions: { type: Boolean, default: false },
  numberOfSubscriptions: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  otp: { type: String, default: "" },
  otpExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
