const mongoose = require("mongoose"); // ✅ இதை top-ல add பண்ணுங்க

const clientSchema = new mongoose.Schema({
  clientName:      { type: String, required: true },
  companyName:     { type: String, default: "" },
  email:           { type: String, required: true, unique: true },
  phone:           { type: String, default: "" },
  address:         { type: String, default: "" },
  projectAssigned: { type: String, default: "" },
  status:          { type: String, enum: ["Active","Inactive"], default: "Active" },
  password:        { type: String, default: "" }, // ✅ password field
}, { timestamps: true });

module.exports = mongoose.model("Client", clientSchema);
