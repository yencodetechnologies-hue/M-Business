const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  phone:      { type: String, default: "" },
  role:       { type: String, default: "" },
  department: { type: String, default: "" },
  salary:     { type: String, default: "" },
  password: { type: String, default: "" } , 
  status:     { type: String, enum: ["Active","Inactive"], default: "Active" }
}, { timestamps: true });

module.exports = mongoose.model("Employee", employeeSchema);