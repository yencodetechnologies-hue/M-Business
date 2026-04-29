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
  }
}, { timestamps: true });

module.exports = mongoose.model('Config', ConfigSchema);
