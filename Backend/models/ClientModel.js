const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema({
  clientName:      { type: String, required: true },
  companyName:     { type: String, default: "" },
  email:           { type: String, required: true, unique: true },
  phone:           { type: String, default: "" },
  contactPersonName: { type: String, default: "" },
  contactPersonNo:   { type: String, default: "" },
  address:         { type: String, default: "" },
  password:        { type: String, default: "" },
  status:          { type: String, default: "Active" },
  role:            { type: String, default: "client" }, 
  gstNumber:       { type: String, default: "" },
  logoUrl:         { type: String, default: "" },
  companyId: { type: String, default: "" },
  otp: { type: String, default: "" },
  otpExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("Client", ClientSchema);