const express = require("express");
const router = express.Router();
const Manager = require("../models/ManagerModel");

router.get("/", async (req, res) => {
  try {
    const managers = await Manager.find().sort({ createdAt: -1 });
    res.json(managers);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/add", async (req, res) => {
  try {

    const {
      managerName,
      email,
      phone,
      department,
      role,
      address,
      password,
      status
    } = req.body;

    const manager = new Manager({
      managerName,
      email,
      phone,
      department,
      role,
      address,
      password,
      status
    });

    await manager.save();

    res.status(201).json({
      message: "Manager added successfully",
      manager
    });

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;