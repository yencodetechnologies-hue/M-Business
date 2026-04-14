const mongoose = require("mongoose");

const rolePermissionSchema = new mongoose.Schema({
  role: { type: String, required: true, unique: true },
  permissions: {
    dashboard: { type: Boolean, default: true },
    clients: { type: Boolean, default: false },
    subadmins: { type: Boolean, default: false },
    employees: { type: Boolean, default: false },
    managers: { type: Boolean, default: false },
    projects: { type: Boolean, default: false },
    quotations: { type: Boolean, default: false },
    proposals: { type: Boolean, default: false },
    invoices: { type: Boolean, default: false },
    tracking: { type: Boolean, default: false },
    tasks: { type: Boolean, default: false },
    calendar: { type: Boolean, default: false },
    accounts: { type: Boolean, default: false },
    interviews: { type: Boolean, default: false },
    reports: { type: Boolean, default: false },
    mysubscriptions: { type: Boolean, default: false },
    packages: { type: Boolean, default: false },
    payments: { type: Boolean, default: false },
    vendors: { type: Boolean, default: false },
    rolePermissions: { type: Boolean, default: false },
  },
  companyId: { type: String, default: "" }, // If we want per-company roles
}, { timestamps: true });

module.exports = mongoose.model("RolePermission", rolePermissionSchema);
