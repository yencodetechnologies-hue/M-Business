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

// POST add employee
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

// PUT update employee
router.put("/:id", async (req, res) => {
  try {
    // password மாத்தினா hash பண்ணணும்
    const updateData = { ...req.body };
    if (updateData.password && updateData.password.trim().length >= 4) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password; // password இல்லன்னா update பண்ணாத
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { returnDocument: "after" }
    );
    if (!employee) return res.status(404).json({ msg: "Employee not found" });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE employee
router.delete("/:id", async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ msg: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
