// routes/auth.js
const express  = require("express");
const router   = express.Router();
const bcrypt   = require("bcryptjs");
const User     = require("../models/UserModels");   // உங்கள் existing ✅
const Client   = require("../models/ClientModel");  // உங்கள் existing ✅
const Manager  = require("../models/ManagerModel"); // உங்கள் existing ✅
const Employee = require("../models/EmployeeModel");// ← இது மட்டும் புதுசு add

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔍 Login attempt:", email);

    let user = null;
    let role = "user";

    // 1️⃣ User collection (Admin / SubAdmin)
    user = await User.findOne({ email });
    if (user) {
      console.log("✅ Found in User collection, role:", user.role);
      role = user.role || "admin";
    }

    // 2️⃣ Client collection
    if (!user) {
      user = await Client.findOne({ email });
      if (user) {
        console.log("✅ Found in Client collection");
        role = "client";
      }
    }

    // 3️⃣ Manager collection
    if (!user) {
      user = await Manager.findOne({ email });
      if (user) {
        console.log("✅ Found in Manager collection");
        role = user.role || "manager";
      }
    }

    // 4️⃣ Employee collection ← இது மட்டும் புதுசா add பண்ணினோம்
    if (!user) {
      const employee = await Employee.findOne({ email });
      if (employee) {
        console.log("✅ Found in Employee collection");

        if (employee.status === "Inactive") {
          return res.status(400).json({ msg: "Account inactive. Contact admin." });
        }
        if (!employee.password) {
          return res.status(400).json({ msg: "No password set. Contact admin." });
        }

        const isMatch = await bcrypt.compare(password, employee.password);
        console.log("🔑 Employee match:", isMatch);
        if (!isMatch) {
          return res.status(400).json({ msg: "Invalid email or password" });
        }

        // Employee login success → role = "Employee"
        return res.json({
          user: {
            id:         employee._id,
            name:       employee.name,
            email:      employee.email,
            phone:      employee.phone       || "",
            role:       "Employee",           // ← App.jsx இதை பார்த்து EmployeeDashboard திறக்கும்
            department: employee.department  || "",
            salary:     employee.salary      || "",
            status:     employee.status,
            logoUrl:    "",
          },
        });
      }
    }

    // ── Not found in any collection ──────────────────────────────────────────
    if (!user) {
      console.log("❌ User not found in any collection");
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    // ── Password check for User / Client / Manager ───────────────────────────
    console.log("🔐 Stored hash:", user.password);
    console.log("🔑 Entered:", password);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔑 Match:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    // ── Success response (existing format — touch பண்ணல) ────────────────────
    res.json({
      user: {
        id:      user._id,
        name:    user.clientName || user.managerName || user.name || "",
        email:   user.email,
        phone:   user.phone   || "",
        role:    role,
        logoUrl: user.logoUrl || "",
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ── POST /api/auth/signup (உங்கள் existing — touch பண்ணல) ───────────────────
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const hashed  = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashed, role: role || "admin", phone });
    await newUser.save();

    res.status(201).json({ msg: "Account created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ── POST /api/auth/save-logo (உங்கள் existing — touch பண்ணல) ───────────────
router.post("/save-logo", async (req, res) => {
  try {
    const { userId, logoUrl } = req.body;
await User.findByIdAndUpdate(userId, { logoUrl }, { returnDocument: 'after' });
    res.json({ msg: "Logo saved" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// ── GET /api/auth/debug-clients (உங்கள் existing — touch பண்ணல) ─────────────
router.get("/debug-clients", async (req, res) => {
  try {
    const clients = await Client.find({});
    console.log("📋 All clients:", clients);
    res.json(clients);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
