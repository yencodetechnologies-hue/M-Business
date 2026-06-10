const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  client: { type: String, default: "" },
  contactPersonName: { type: String, default: "" },
  contactPersonNo: { type: String, default: "" },
  category: { type: String, default: "Web Development" },
  priority: { type: String, default: "medium" },
  purpose: { type: String, default: "" },
  description: { type: String, default: "" },
  start: { type: String, default: "" },
  end: { type: String, default: "" },
  deadline: { type: String, default: "" },
  budget: { type: String, default: "" },
  currency: { type: String, default: "₹" },
  billed: { type: Number, default: 0 },
  received: { type: Number, default: 0 },
  pending: { type: Number, default: 0 },
  spent: { type: Number, default: 0 },
  team: { type: String, default: "" },
  status: { type: String, default: "Pending" },
  progress: { type: Number, default: 0 },
  tasks: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  assignedTo: { type: [String], default: [] },  // ✅ Fixed
  manager: { type: String, default: "" },
  companyId: { type: String, default: "" },
  loggedHours: { type: Number, default: 0 },
  milestones: {
    type: [{
      name: { type: String, required: true },
      date: { type: String, default: "" },
      done: { type: Boolean, default: false }
    }],
    default: []
  },
  updates: {
    type: [{
      text: { type: String, required: true },
      date: { type: Date, default: Date.now },
      author: { type: String, default: "System" }
    }],
    default: []
  },
  files: {
    type: [{
      name: { type: String, required: true },
      url: { type: String, required: true },
      size: { type: Number, default: 0 },
      type: { type: String, default: "" },
      uploadedAt: { type: Date, default: Date.now }
    }],
    default: []
  },
  portalSettings: {
    type: Object,
    default: {
      enablePortal: true,
      showProgress: true,
      showMilestones: true,
      showTeam: false,
      allowMessages: true
    }
  }
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);