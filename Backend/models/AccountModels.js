// models/Account.js
const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true, trim: true },
    email:  { type: String, required: true, unique: true, trim: true },
    phone:  { type: String, default: "" },
    role:   { type: String, default: "Client", enum: ["Client","Employee","Manager","Admin","SubAdmin"] },
    status: { type: String, default: "Active", enum: ["Active","Inactive"] },
    notes:  { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Account", AccountSchema);
