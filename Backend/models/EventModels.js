// models/Event.js
const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    project: { type: String, default: "" },
    client:  { type: String, default: "" },
    date:    { type: String, required: true },   // "YYYY-MM-DD"
    start:   { type: String, default: "" },       // "HH:MM"
    end:     { type: String, default: "" },       // "HH:MM"
    notes:   { type: String, default: "" },
    type:    { type: String, default: "Meeting", enum: ["Meeting","Call","Review","Planning","Handover","Other"] },
    companyId: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", EventSchema);
