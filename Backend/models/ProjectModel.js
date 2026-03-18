// models/ProjectModel.js
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  client:         { type: String, default: "" },
  purpose:        { type: String, default: "" },
  description:    { type: String, default: "" },
  start:          { type: String, default: "" },
  end:            { type: String, default: "" },
  deadline:       { type: String, default: "" },   // same as end
  budget:         { type: String, default: "" },
  team:           { type: String, default: "" },
  status:         { type: String, default: "Pending" },
  progress:       { type: Number, default: 0 },
  tasks:          { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  assignedTo:     { type: String, default: "" },   // ← employee name
  manager:        { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);
