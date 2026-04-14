const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    label:     { type: String, required: true, trim: true },
    color:     { type: String, default: "#7c3aed" },
    open:      { type: Boolean, default: true },
    order:     { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    companyId: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Group", groupSchema);
