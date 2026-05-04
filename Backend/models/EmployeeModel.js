const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  phone:      { type: String, default: "" },
  role:       { type: String, default: "" },
  department: { type: String, default: "" },
  salary:     { type: String, default: "" },
  password: { type: String, default: "" } , 
  status:     { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  companyId: { type: String, default: "" },
  profilePhoto: { type: String, default: "" },
  bankDetails: {
    bankName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    ifscCode: { type: String, default: "" }
  },
  otp: { type: String, default: "" },
  otpExpires: { type: Date },
  dateOfBirth:    { type: String, default: "" },
  maritalStatus:  { type: String, enum: ["Unmarried", "Married"], default: "Unmarried" }
}, { timestamps: true });
module.exports = mongoose.model("Employee", employeeSchema);