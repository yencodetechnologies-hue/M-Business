const mongoose = require("mongoose");

const BankSchema = new mongoose.Schema(
  {
    bankName: { type: String, required: true },
    accountType: { type: String, default: "Current" },
    accountNo: { type: String, required: true },
    balance: { type: Number, default: 0 },
    lastSynced: { type: Date, default: Date.now },
    companyId: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bank", BankSchema);
