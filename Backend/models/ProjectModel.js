const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  client:      { type: String, required: true },
  purpose:     { type: String, default: "" },
  description: { type: String, default: "" },
  start:       { type: String, default: "" },
  end:         { type: String, default: "" },
  budget:      { type: String, default: "" },
  team:        { type: String, default: "" },
  status:      { type: String, enum: ["Pending","In Progress","Completed","On Hold"], default: "Pending" }
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema); // ✅ இதை add பண்ணுங்க