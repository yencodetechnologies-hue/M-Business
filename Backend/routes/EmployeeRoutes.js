const express = require("express");
const router = express.Router();
const Employee = require("../models/EmployeeModel");

// GET all
router.get("/", async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// POST add
router.post("/add", async (req, res) => {
  try {
    const { name, email, phone, role, department, salary, status } = req.body;

    if (!name || !email) {
      return res.status(400).json({ msg: "Name and Email required" });
    }

    const existing = await Employee.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "Employee already exists" });
    }

    const employee = new Employee({ name, email, phone, role, department, salary, status: status || "Active" });
    await employee.save();

    res.status(201).json({ msg: "Employee added", employee });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;