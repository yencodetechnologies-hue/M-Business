const Manager = require("../models/ManagerModel");

// Add Manager
exports.addManager = async (req, res) => {
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

    if (!managerName || !email) {
      return res.status(400).json({ msg: "Name and Email required" });
    }

    const manager = new Manager({
      managerName,
      email,
      phone,
      department,
      role,
      address,
      password,
      status: status || "Active"
    });

    await manager.save();

    res.status(201).json({
      message: "Manager Added Successfully",
      manager
    });

  } catch (err) {

    if (err.code === 11000) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    res.status(500).json({ msg: "Server error" });
  }
};