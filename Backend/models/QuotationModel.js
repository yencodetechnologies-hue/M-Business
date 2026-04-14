// models/QuotationModel.js
const mongoose = require("mongoose");

const QuotationSchema = new mongoose.Schema(
  {
    qt:     { type: Object, required: true },  // full quotation header
    items:  { type: Array,  required: true, default: [] },
    status: {
      type: String,
      enum: ["draft","sent","approved","rejected","expired","converted"],
      default: "draft",
    },
    companyId: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quotation", QuotationSchema);
