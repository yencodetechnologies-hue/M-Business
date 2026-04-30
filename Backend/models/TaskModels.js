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
      enum: ["Critical", "High", "Medium", "Low", "—"],
      default: "Medium",
    },
    assignTo:      { type: String, default: "Unassigned" },
    assignedTo:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    invitedMembers: [{ 
      email: { type: String, required: true },
      status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
      invitedAt: { type: Date, default: Date.now },
      invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    }],
    autoAssign:    { type: Boolean, default: false },
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
    integrations: {
      gmail: { type: Boolean, default: false },
      slack: { type: Boolean, default: false },
      googleCalendar: { type: Boolean, default: false },
      github: { type: Boolean, default: false },
      zapier: { type: Boolean, default: false }
    },
    subtasks: [{
      title: { type: String, required: true },
      done:  { type: Boolean, default: false }
    }],
    comments: [{
      user: { type: String, required: true },
      text: { type: String, required: true },
      date: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
