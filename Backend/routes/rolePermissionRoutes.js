const express = require("express");
const router = express.Router();
const RolePermission = require("../models/RolePermissionModel");

// Get all role permissions
router.get("/", async (req, res) => {
  try {
    const roles = await RolePermission.find();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update or Create role permission
router.post("/", async (req, res) => {
  const { role, permissions, companyId } = req.body;
  try {
    let rolePerm = await RolePermission.findOne({ role, companyId: companyId || "" });
    if (rolePerm) {
      rolePerm.permissions = permissions;
      await rolePerm.save();
    } else {
      rolePerm = new RolePermission({ role, permissions, companyId: companyId || "" });
      await rolePerm.save();
    }
    res.json(rolePerm);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Seed default roles if they don't exist
router.post("/seed", async (req, res) => {
  const defaultRoles = [
    {
      role: "subadmin",
      permissions: {
        dashboard: true, clients: true, subadmins: true, employees: true, managers: true,
        projects: true, quotations: true, proposals: true, invoices: true, tracking: true,
        tasks: true, calendar: true, accounts: true, interviews: true, reports: true,
        mysubscriptions: true, packages: true, payments: true, vendors: true, rolePermissions: true
      }
    },
    {
      role: "manager",
      permissions: {
        dashboard: true, employees: true, projects: true, tracking: true, tasks: true, calendar: true,
        interviews: true, reports: true, vendors: true
      }
    },
    {
      role: "employee",
      permissions: {
        dashboard: true, projects: true, proposals: true, tasks: true, 
        payments: true, calendar: true, reports: true
      }
    },
    {
      role: "client",
      permissions: {
        dashboard: true, projects: true, proposals: true, tasks: true, 
        payments: true, calendar: true, reports: true
      }
    }
  ];

  try {
    for (const r of defaultRoles) {
      // Use $setOnInsert so existing permissions are NOT overwritten
      await RolePermission.findOneAndUpdate(
        { role: r.role },
        { $setOnInsert: { permissions: r.permissions, companyId: "" } },
        { upsert: true, new: true }
      );
    }
    res.json({ message: "Default roles seeded successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
