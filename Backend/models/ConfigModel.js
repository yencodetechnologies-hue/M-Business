const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
  companyId: { type: String, required: true, unique: true },
  projectStatuses: {
    type: [String],
    default: ["Pending", "In Progress", "Completed", "On Hold"]
  },
  taskStatuses: {
    type: [String],
    default: ["Pending", "In Progress", "Completed", "On Hold"]
  },
  taskPriorities: {
    type: [String],
    default: ["Low", "Medium", "High", "Urgent"]
  },
  customClientCategories: {
    type: [String],
    default: []
  },
  customClientSources: {
    type: [String],
    default: []
  }
}, { timestamps: true, strict: false });

module.exports = mongoose.model('Config', ConfigSchema);
