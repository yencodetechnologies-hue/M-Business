const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema({
  clientName: { type: String, default: "" },
  companyId:  { type: String, default: "" },
  rating:     { type: Number, required: true },
  message:    { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Feedback", FeedbackSchema);