const mongoose = require("mongoose");

const taskInvitationSchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  email: { type: String, required: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { 
    type: String, 
    enum: ["pending", "accepted", "rejected"], 
    default: "pending" 
  },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // 7 days
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("TaskInvitation", taskInvitationSchema);
