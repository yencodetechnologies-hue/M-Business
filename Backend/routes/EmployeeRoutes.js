// routes/employee.js  ← உங்கள் existing file-ஐ இதுவாக replace பண்ணுங்க
const express  = require("express");
const router   = express.Router();
const bcrypt   = require("bcryptjs");
const Employee = require("../models/EmployeeModel");

// GET all employees
router.get("/", async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// POST add employee  ← password hash add பண்ணினோம்
router.post("/add", async (req, res) => {
  try {
    const { name, email, phone, role, department, salary, status, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ msg: "Name and Email required" });
    }
    if (!password || password.trim().length < 4) {
      return res.status(400).json({ msg: "Password required (min 4 chars)" });
    }

    const existing = await Employee.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "Employee already exists" });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = new Employee({
      name,
      email,
      phone:      phone      || "",
      role:       role       || "Employee",
      department: department || "",
      salary:     salary     || "",
      status:     status     || "Active",
      password:   hashedPassword,
    });

    await employee.save();
    res.status(201).json({ msg: "Employee added", employee });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
