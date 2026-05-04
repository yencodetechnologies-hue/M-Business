const express  = require("express");
const router   = express.Router();
const bcrypt   = require("bcryptjs");
const Employee = require("../models/EmployeeModel");
const { sendEmployeeStatusUpdateEmail } = require("../config/email");
const SubAdmin = require("../models/SubAdminModels");

// GET all employees
router.get("/", async (req, res) => {
  try {
    const filter = req.companyId ? { companyId: req.companyId } : {};
    const employees = await Employee.find(filter).sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/add", async (req, res) => {
  try {
    const { name, email, phone, role, department, salary, status, password, profilePhoto, bankDetails ,    dateOfBirth, maritalStatus} = req.body;

    console.log("Adding employee payload:", req.body);
    if (!name || !email) {
      console.log("Missing name or email");
      return res.status(400).json({ msg: "Name and Email required" });
    }
    if (!password || password.trim().length < 4) {
      console.log("Password invalid:", password);
      return res.status(400).json({ msg: "Password required (min 4 chars)" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await Employee.findOne({ email: cleanEmail });
    if (existing) {
      console.log("Duplicate Employee found:", existing);
      return res.status(400).json({ msg: `[DB-EMP] Employee with email ${cleanEmail} already exists` });
    }

    const User = require("../models/UserModels");
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      console.log("Duplicate User found:", existingUser);
      return res.status(400).json({ msg: `[DB-USR] An account with email ${cleanEmail} already exists as an Admin/SubAdmin` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = new Employee({
      name,
      email,
      phone:      phone      || "",
      role:       role       || "Employee",
      department: department || "",
      salary:     salary     || "",
status: "Pending",

      password:   hashedPassword,
      companyId:  req.body.companyId || req.companyId || "",
      profilePhoto: profilePhoto || "",
      bankDetails: bankDetails || { bankName: "", accountNumber: "", ifscCode: "" },
      dateOfBirth:   dateOfBirth   || "",
maritalStatus: maritalStatus || "Unmarried"
    });

    await employee.save();

    // Email skipped for Pending status as per requirement

    res.status(201).json({ msg: "Employee added", employee });
  } catch (err) {
    console.log("Error in /add:", err);
    res.status(500).json({ msg: err.message || "Server error" });
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

// DELETE route-க்கு முன்னாடி போடுங்க

// POST login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ msg: "Email and password required" });

    const employee = await Employee.findOne({ email });
    if (!employee)
      return res.status(404).json({ msg: "Employee not found" });

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch)
      return res.status(401).json({ msg: "Invalid password" });

    const { password: _, ...userData } = employee.toObject();
    res.json({ msg: "Login successful", user: userData });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE employee 

// UPDATE employee status (Approve/Reject)
router.put("/status/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );
    if (!employee) return res.status(404).json({ msg: "Employee not found" });

    // Send Status Update Email
    if (status === "Approved" || status === "Rejected") {
      try {
        let companyName = "Our Company";
        if (employee.companyId) {
          const sa = await SubAdmin.findById(employee.companyId);
          if (sa && sa.companyName) companyName = sa.companyName;
        }
        await sendEmployeeStatusUpdateEmail(employee.email, employee.name, companyName, status);
      } catch (emailErr) {
        console.error("Status update email failed:", emailErr);
      }
    }

    res.json({ msg: `Employee ${status}`, employee });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ msg: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
