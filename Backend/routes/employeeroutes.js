const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
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

const { checkResourceLimit } = require("../middleware/subscriptionMiddleware");
// ADD employee
router.post("/add", checkResourceLimit('employee'), async (req, res) => {
  try {
    const { name, email, phone, role, department, salary, status, password, profilePhoto, bankDetails, branchName, dateOfBirth, maritalStatus, address } = req.body;

    if (!name || !email) return res.status(400).json({ msg: "Name and Email required" });
    if (!status || !status.trim()) return res.status(400).json({ msg: "Status is required" });
    if (!password || password.trim().length < 4) return res.status(400).json({ msg: "Password required (min 4 chars)" });

    const cleanEmail = email.toLowerCase().trim();
    const existing = await Employee.findOne({ email: cleanEmail });
    if (existing) return res.status(400).json({ msg: `Employee with email ${cleanEmail} already exists` });

    const User = require("../models/UserModels");
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) return res.status(400).json({ msg: "An account with this email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = new Employee({
      name, email, phone: phone || "", role: role || "Employee", department: department || "",
      salary: salary || "", status: status, password: hashedPassword,
      companyId: req.body.companyId || req.companyId || "", profilePhoto: profilePhoto || "",
      bankDetails: bankDetails
        ? { ...bankDetails, branchName: bankDetails.branchName || branchName || "" }
        : { bankName: "", accountNumber: "", ifscCode: "", branchName: branchName || "" },
      dateOfBirth: dateOfBirth || "", maritalStatus: maritalStatus || "Unmarried", address: address || ""
    });

    await employee.save();
    res.status(201).json({ msg: "Employee added", employee });
  } catch (err) {
    console.error("ADD ERROR:", err);
    res.status(500).json({ msg: err.message || "Server error" });
  }
});

// UPDATE employee details
router.put("/:id", async (req, res) => {
  try {
    console.log("UPDATE REQ RECEIVED for ID:", req.params.id);
    const updateData = { ...req.body };

    // Handle nested bank details if sent flat
    if (req.body.bankName || req.body.accountNumber || req.body.ifscCode || req.body.branchName) {
      updateData.bankDetails = {
        bankName: req.body.bankName || "",
        accountNumber: req.body.accountNumber || "",
        ifscCode: req.body.ifscCode || "",
        branchName: req.body.branchName || ""
      };
    }

    // Handle password hashing
    if (updateData.password && updateData.password.trim().length >= 4) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: false }
    );

    if (!employee) return res.status(404).json({ msg: "Employee not found" });

    console.log("Update successful:", employee.email);
    res.json(employee);
  } catch (err) {
    console.error("UPDATE ERROR:", err.message);
    if (err.code === 11000) return res.status(400).json({ msg: "Email already in use" });
    res.status(500).json({ msg: "Server error: " + err.message });
  }
});

// UPDATE employee status (Separate route for dropdown)
router.put("/status/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Active", "Inactive"].includes(status)) return res.status(400).json({ msg: "Invalid status" });

    const employee = await Employee.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
    if (!employee) return res.status(404).json({ msg: "Employee not found" });

    if (status === "Approved" || status === "Rejected") {
      try {
        let companyName = "Our Company";
        if (employee.companyId) {
          const sa = await SubAdmin.findById(employee.companyId);
          if (sa && sa.companyName) companyName = sa.companyName;
        }
        await sendEmployeeStatusUpdateEmail(employee.email, employee.name, companyName, status);
      } catch (emailErr) { console.error("Email failed:", emailErr); }
    }

    res.json({ msg: `Employee ${status}`, employee });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE employee
router.delete("/:id", async (req, res) => {
  try {
    const Task = require("../models/TaskModels");

    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ msg: "Employee not found" });

    const empName = employee.name;

    // Find all tasks assigned to this employee
    const affectedTasks = await Task.find({
      companyId: employee.companyId,
      isDeleted: false,
      assignTo: { $regex: new RegExp(`(^|,\\s*)${empName}(\\s*,|$)`, "i") }
    });

    // Remove employee name from each task's assignTo
    await Promise.all(affectedTasks.map(async (task) => {
      const names = task.assignTo.split(",").map(n => n.trim()).filter(Boolean);
      const updatedNames = names.filter(n => n.toLowerCase() !== empName.toLowerCase());
      task.assignTo = updatedNames.length > 0 ? updatedNames.join(", ") : "Unassigned";
      return task.save();
    }));

    // Now delete the employee
    await Employee.findByIdAndDelete(req.params.id);

    res.json({ msg: "Employee deleted and unassigned from all tasks" });
  } catch (err) {
    console.error("DELETE employee error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
