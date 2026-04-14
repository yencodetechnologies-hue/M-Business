const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title:         { type: String, required: true, trim: true },
    description:   { type: String, default: "" },
    notes:         { type: String, default: "" },
    status: {
      type: String,
      default: "Not Started",
    },
    priority: {
      type: String,
      enum: ["🔴 Critical","🟠 High","🟡 Medium","🟢 Low"],
      default: "🟡 Medium",
    },
    assignTo:      { type: String, default: "Unassigned" },
    type:          { type: String, default: "" },
    date:          { type: String, default: "" },
    time:          { type: String, default: "" },
    estimatedTime: { type: String, default: "" },
    checked:       { type: Boolean, default: false },
    groupId:       { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    projectId:     { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    isDeleted:     { type: Boolean, default: false },
    order:         { type: Number, default: 0 },
    companyId:     { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
