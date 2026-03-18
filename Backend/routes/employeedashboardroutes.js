// routes/employeeDashboard.js
// server.js-ல் add பண்ணுங்க:
//   app.use("/api/employee-dashboard", require("./routes/employeeDashboard"));

const express  = require("express");
const router   = express.Router();
const mongoose = require("mongoose");
const Employee = require("../models/EmployeeModel"); // உங்கள் existing model ✅

// ─── Auto-create models if not imported separately ────────────────────────────

// Project Model
let Project;
try { Project = mongoose.model("Project"); } catch {
  Project = mongoose.model("Project", new mongoose.Schema({
    name:           { type: String, required: true },
    client:         { type: String, default: "" },
    budget:         { type: String, default: "" },
    deadline:       { type: String, default: "" },
    status:         { type: String, default: "active" },
    progress:       { type: Number, default: 0 },
    tasks:          { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    assignedTo:     { type: String, default: "" },
    manager:        { type: String, default: "" },
    description:    { type: String, default: "" },
  }, { timestamps: true }));
}

// Task Model
let Task;
try { Task = mongoose.model("Task"); } catch {
  Task = mongoose.model("Task", new mongoose.Schema({
    title:        { type: String, required: true },
    description:  { type: String, default: "" },
    project:      { type: String, default: "" },
    assignedTo:   { type: String, default: "" },
    priority:     { type: String, enum: ["High","Medium","Low"], default: "Medium" },
    status:       { type: String, enum: ["pending","in progress","done","completed"], default: "pending" },
    dueDate:      { type: String, default: "" },
    subtasks:     [{ title: String, done: { type: Boolean, default: false } }],
  }, { timestamps: true }));
}

// Attendance Model
let Attendance;
try { Attendance = mongoose.model("Attendance"); } catch {
  Attendance = mongoose.model("Attendance", new mongoose.Schema({
    employeeName: { type: String, required: true },
    employeeId:   { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    date:         { type: String, required: true },  // "YYYY-MM-DD"
    status:       { type: String, enum: ["present","absent","leave","holiday"], default: "present" },
    markedAt:     { type: String, default: "" },
    note:         { type: String, default: "" },
  }, { timestamps: true }));
}

// Leave Model
let Leave;
try { Leave = mongoose.model("Leave"); } catch {
  Leave = mongoose.model("Leave", new mongoose.Schema({
    employeeName: { type: String, required: true },
    employeeId:   { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    type:         { type: String, default: "Casual Leave" },
    from:         { type: String, required: true },
    to:           { type: String, required: true },
    reason:       { type: String, default: "" },
    status:       { type: String, enum: ["pending","approved","rejected"], default: "pending" },
  }, { timestamps: true }));
}

// Salary Model
let Salary;
try { Salary = mongoose.model("Salary"); } catch {
  Salary = mongoose.model("Salary", new mongoose.Schema({
    employeeName: { type: String, required: true },
    employeeId:   { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    month:        { type: String, required: true },   // "March 2026"
    basic:        { type: Number, default: 0 },
    hra:          { type: Number, default: 0 },
    allowances:   { type: Number, default: 0 },
    deductions:   { type: Number, default: 0 },
    net:          { type: Number, default: 0 },
    status:       { type: String, enum: ["paid","pending"], default: "pending" },
    paidOn:       { type: String, default: "" },
  }, { timestamps: true }));
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// GET /api/employee-dashboard/profile/:name
// ─────────────────────────────────────────────────────────────────────────────
router.get("/profile/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const emp  = await Employee.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
    if (!emp) return res.status(404).json({ msg: "Employee not found" });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROJECTS
// GET /api/employee-dashboard/projects/:name
// ─────────────────────────────────────────────────────────────────────────────
router.get("/projects/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const projects = await Project.find({
      $or: [
        { assignedTo: { $regex: new RegExp(name, "i") } },
        { manager:    { $regex: new RegExp(name, "i") } },
      ]
    }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TASKS
// GET /api/employee-dashboard/tasks/:name
// ─────────────────────────────────────────────────────────────────────────────
router.get("/tasks/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const tasks = await Task.find({
      assignedTo: { $regex: new RegExp(name, "i") }
    }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE
// GET  /api/employee-dashboard/attendance/:name   → get all records
// POST /api/employee-dashboard/attendance         → mark attendance
// ─────────────────────────────────────────────────────────────────────────────
router.get("/attendance/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const records = await Attendance.find({
      employeeName: { $regex: new RegExp(name, "i") }
    }).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

router.post("/attendance", async (req, res) => {
  try {
    const { date, status, employeeName, markedAt, note } = req.body;

    if (!date || !employeeName) {
      return res.status(400).json({ msg: "Date and employee name required" });
    }

    // Prevent duplicate for same date
    const exists = await Attendance.findOne({
      employeeName: { $regex: new RegExp(employeeName, "i") },
      date,
    });
    if (exists) {
      return res.status(400).json({ msg: "Attendance already marked for this date" });
    }

    const emp = await Employee.findOne({ name: { $regex: new RegExp(employeeName, "i") } });

    const record = new Attendance({
      employeeName,
      employeeId: emp?._id || null,
      date,
      status:    status    || "present",
      markedAt:  markedAt  || new Date().toISOString(),
      note:      note      || "",
    });

    await record.save();
    res.status(201).json({ msg: "Attendance marked", record });
  } catch (err) {
    console.error("Attendance error:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// LEAVE REQUESTS
// POST /api/employee-dashboard/leave
// GET  /api/employee-dashboard/leave/:name
// ─────────────────────────────────────────────────────────────────────────────
router.post("/leave", async (req, res) => {
  try {
    const { type, from, to, reason, employeeName } = req.body;

    if (!from || !to || !employeeName) {
      return res.status(400).json({ msg: "Required fields missing" });
    }

    const emp = await Employee.findOne({ name: { $regex: new RegExp(employeeName, "i") } });

    const leave = new Leave({
      employeeName,
      employeeId: emp?._id || null,
      type:   type   || "Casual Leave",
      from,
      to,
      reason: reason || "",
      status: "pending",
    });

    await leave.save();
    res.status(201).json({ msg: "Leave request submitted", leave });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

router.get("/leave/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const leaves = await Leave.find({
      employeeName: { $regex: new RegExp(name, "i") }
    }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SALARY
// GET /api/employee-dashboard/salary/:name
// ─────────────────────────────────────────────────────────────────────────────
router.get("/salary/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const slips = await Salary.find({
      employeeName: { $regex: new RegExp(name, "i") }
    }).sort({ createdAt: -1 });
    res.json(slips);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD SUMMARY
// GET /api/employee-dashboard/summary/:name
// ─────────────────────────────────────────────────────────────────────────────
router.get("/summary/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);

    const [projects, tasks, attendance, salary] = await Promise.all([
      Project.find({ $or: [{ assignedTo: { $regex: new RegExp(name,"i") } }, { manager: { $regex: new RegExp(name,"i") } }] }),
      Task.find({ assignedTo: { $regex: new RegExp(name, "i") } }),
      Attendance.find({ employeeName: { $regex: new RegExp(name, "i") } }),
      Salary.find({ employeeName: { $regex: new RegExp(name, "i") } }).sort({ createdAt: -1 }).limit(1),
    ]);

    const thisMonth    = new Date().toISOString().slice(0, 7);
    const monthAttend  = attendance.filter(a => a.date.startsWith(thisMonth));

    res.json({
      totalProjects:  projects.length,
      activeProjects: projects.filter(p => ["active","in progress"].includes((p.status||"").toLowerCase())).length,
      totalTasks:     tasks.length,
      pendingTasks:   tasks.filter(t => !["done","completed"].includes((t.status||"").toLowerCase())).length,
      presentDays:    monthAttend.filter(a => a.status === "present").length,
      absentDays:     monthAttend.filter(a => a.status === "absent").length,
      leaveDays:      monthAttend.filter(a => a.status === "leave").length,
      lastSalary:     salary[0] || null,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;
