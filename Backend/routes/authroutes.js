const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/UserModels");
const Client = require("../models/ClientModel");
const Manager = require("../models/ManagerModel");

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔍 Login attempt:", email);

    let user = null;
    let role = "user";

    user = await User.findOne({ email });
    if (user) {
      console.log("✅ Found in User collection, role:", user.role);
      role = user.role || "admin";
    }

    if (!user) {
      user = await Client.findOne({ email });
      if (user) {
        console.log("✅ Found in Client collection");
        role = "client";
      }
    }

    if (!user) {
      user = await Manager.findOne({ email });
      if (user) {
        console.log("✅ Found in Manager collection");
        role = user.role || "manager";
      }
    }

    if (!user) {
      console.log("❌ User not found in any collection");
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    console.log("🔐 Stored hash:", user.password);
    console.log("🔑 Entered:", password);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔑 Match:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    res.json({
      user: {
        id: user._id,
        name: user.clientName || user.managerName || user.name || "",
        email: user.email,
        phone: user.phone || "",
        role: role,
        logoUrl: user.logoUrl || "",
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashed,
      role: role || "admin",
      phone,
    });
    await newUser.save();

    res.status(201).json({ msg: "Account created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/save-logo", async (req, res) => {
  try {
    const { userId, logoUrl } = req.body;
    await User.findByIdAndUpdate(userId, { logoUrl });
    res.json({ msg: "Logo saved" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

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
