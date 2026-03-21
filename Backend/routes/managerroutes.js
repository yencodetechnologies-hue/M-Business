const express = require("express");
const router  = express.Router();
const Manager = require("../models/ManagerModel");

// GET all managers
router.get("/", async (req, res) => {
  try {
    const managers = await Manager.find().sort({ createdAt: -1 });
    res.json(managers);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// POST add manager
router.post("/add", async (req, res) => {
  try {
    const {
      managerName, email, phone,
      department, role, address, password, status
    } = req.body;

    if (!managerName || !email) {
      return res.status(400).json({ msg: "Name and Email required" });
    }

    const manager = new Manager({
      managerName,
      email,
      phone:      phone      || "",
      department: department || "",
      role:       role       || "Manager",
      address:    address    || "",
      password:   password   || "",
      status:     status     || "Active",
    });

    await manager.save();
    res.status(201).json({ message: "Manager added successfully", manager });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ msg: "Email already exists" });
    }
    res.status(500).json({ msg: "Server error" });
  }
});

// PUT update manager
router.put("/:id", async (req, res) => {
  try {
    const updateData = { ...req.body };
    // password field-ஐ route-ல் update பண்ண வேண்டாம்னா remove பண்ணு
    if (!updateData.password || updateData.password.trim() === "") {
      delete updateData.password;
    }

    const manager = await Manager.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { returnDocument: "after" }
    );
    if (!manager) return res.status(404).json({ msg: "Manager not found" });
    res.json(manager);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE manager
router.delete("/:id", async (req, res) => {
  try {
    await Manager.findByIdAndDelete(req.params.id);
    res.json({ msg: "Manager deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
