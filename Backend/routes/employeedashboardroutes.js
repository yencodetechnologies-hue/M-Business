// routes/employeeDashboard.js
// server.js-ல் add பண்ணுங்க:
//   app.use("/api/employee-dashboard", require("./routes/employeeDashboard"));

const express  = require("express");
const router   = express.Router();
const mongoose = require("mongoose");
const Employee = require("../models/EmployeeModel");

// ─── Models ───────────────────────────────────────────────────────────────────

let Project;
try { Project = mongoose.model("Project"); } catch {
  Project = mongoose.model("Project", new mongoose.Schema({
    name:{ type:String, required:true }, client:{ type:String, default:"" },
    budget:{ type:String, default:"" }, deadline:{ type:String, default:"" },
    status:{ type:String, default:"active" }, progress:{ type:Number, default:0 },
    tasks:{ type:Number, default:0 }, completedTasks:{ type:Number, default:0 },
    assignedTo:{ type:String, default:"" }, manager:{ type:String, default:"" },
    description:{ type:String, default:"" },
  }, { timestamps:true }));
}

let Task;
try { Task = mongoose.model("Task"); } catch {
  Task = mongoose.model("Task", new mongoose.Schema({
    title:{ type:String, required:true }, description:{ type:String, default:"" },
    project:{ type:String, default:"" }, assignedTo:{ type:String, default:"" },
    priority:{ type:String, enum:["High","Medium","Low"], default:"Medium" },
    status:{ type:String, enum:["pending","in progress","done","completed"], default:"pending" },
    dueDate:{ type:String, default:"" },
    subtasks:[{ title:String, done:{ type:Boolean, default:false } }],
  }, { timestamps:true }));
}

let Attendance;
try { Attendance = mongoose.model("Attendance"); } catch {
  Attendance = mongoose.model("Attendance", new mongoose.Schema({
    employeeName:{ type:String, required:true },
    employeeId:{ type:mongoose.Schema.Types.ObjectId, ref:"Employee", default:null },
    date:{ type:String, required:true },
    status:{ type:String, enum:["present","absent","leave","holiday"], default:"present" },
    markedAt:{ type:String, default:"" },
    note:{ type:String, default:"" },
  }, { timestamps:true }));
}

// Leave Model
let Leave;
try { Leave = mongoose.model("Leave"); } catch {
  Leave = mongoose.model("Leave", new mongoose.Schema({
    employeeName:{ type:String, required:true },
    employeeId:{ type:mongoose.Schema.Types.ObjectId, ref:"Employee", default:null },
    type:{ type:String, default:"Casual Leave" },
    from:{ type:String, required:true },
    to:{ type:String, required:true },
    reason:{ type:String, default:"" },
    status:{ type:String, enum:["pending","approved","rejected","cancelled"], default:"pending" },
    managerNote:{ type:String, default:"" },
    reviewedBy:{ type:String, default:"" },
    reviewedAt:{ type:Date, default:null },
    appliedOn:{ type:Date, default:Date.now },
  }, { timestamps:true }));
}

// ── Permission Model (NEW) ────────────────────────────────────────────────────
// Permission = employee requests short-duration approval
// e.g. Late Arrival, Early Departure, OD, WFH, Half Day, Other
let Permission;
try { Permission = mongoose.model("Permission"); } catch {
  Permission = mongoose.model("Permission", new mongoose.Schema({
    employeeName: { type:String, required:true },
    employeeId:   { type:mongoose.Schema.Types.ObjectId, ref:"Employee", default:null },

    // Type of permission
    type:         { type:String, enum:["late_arrival","early_departure","od","wfh","half_day","other"], default:"other" },
    typeLabel:    { type:String, default:"" },          // human-readable label stored for convenience

    date:         { type:String, required:true },        // "YYYY-MM-DD"
    fromTime:     { type:String, default:"" },           // "HH:MM" 24h
    toTime:       { type:String, default:"" },           // "HH:MM" 24h

    reason:       { type:String, default:"" },
    status:       { type:String, enum:["pending","approved","rejected","cancelled"], default:"pending" },

    // Admin/Manager review fields
    managerNote:  { type:String, default:"" },
    reviewedBy:   { type:String, default:"" },
    reviewedAt:   { type:Date,   default:null },

    appliedOn:    { type:Date, default:Date.now },
  }, { timestamps:true }));
}

let Salary;
try { Salary = mongoose.model("Salary"); } catch {
  Salary = mongoose.model("Salary", new mongoose.Schema({
    employeeName:{ type:String, required:true },
    employeeId:{ type:mongoose.Schema.Types.ObjectId, ref:"Employee", default:null },
    month:{ type:String, required:true },
    basic:{ type:Number, default:0 }, hra:{ type:Number, default:0 },
    allowances:{ type:Number, default:0 }, deductions:{ type:Number, default:0 },
    net:{ type:Number, default:0 },
    status:{ type:String, enum:["paid","pending"], default:"pending" },
    paidOn:{ type:String, default:"" },
  }, { timestamps:true }));
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────
router.get("/profile/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const emp  = await Employee.findOne({ name:{ $regex:new RegExp(`^${name}$`,"i") } });
    if(!emp) return res.status(404).json({ msg:"Employee not found" });
    res.json(emp);
  } catch(err) { res.status(500).json({ msg:"Server error", error:err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────────────────────────────────────
router.get("/projects/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const projects = await Project.find({
      $or:[{ assignedTo:{ $regex:new RegExp(name,"i") } },{ manager:{ $regex:new RegExp(name,"i") } }]
    }).sort({ createdAt:-1 });
    res.json(projects);
  } catch(err) { res.status(500).json({ msg:"Server error", error:err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────────────────────────────────────
router.get("/tasks/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const tasks = await Task.find({ assignedTo:{ $regex:new RegExp(name,"i") } }).sort({ createdAt:-1 });
    res.json(tasks);
  } catch(err) { res.status(500).json({ msg:"Server error", error:err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────────────────────
router.get("/attendance/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const records = await Attendance.find({ employeeName:{ $regex:new RegExp(name,"i") } }).sort({ date:-1 });
    res.json(records);
  } catch(err) { res.status(500).json({ msg:"Server error", error:err.message }); }
});

router.post("/attendance", async (req, res) => {
  try {
    const { date, status, employeeName, markedAt, note } = req.body;
    if(!date||!employeeName) return res.status(400).json({ msg:"Date and employee name required" });
    const exists = await Attendance.findOne({ employeeName:{ $regex:new RegExp(employeeName,"i") }, date });
    if(exists) return res.status(400).json({ msg:"Attendance already marked for this date" });
    const emp = await Employee.findOne({ name:{ $regex:new RegExp(employeeName,"i") } });
    const record = new Attendance({ employeeName, employeeId:emp?._id||null, date, status:status||"present", markedAt:markedAt||new Date().toISOString(), note:note||"" });
    await record.save();
    res.status(201).json({ msg:"Attendance marked", record });
  } catch(err) { res.status(500).json({ msg:"Server error", error:err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// LEAVE REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

// Employee: submit leave
router.post("/leave", async (req, res) => {
  try {
    const { type, from, to, reason, employeeName } = req.body;
    if(!from||!to||!employeeName) return res.status(400).json({ msg:"Required fields missing" });
    const emp = await Employee.findOne({ name:{ $regex:new RegExp(employeeName,"i") } });
    const leave = new Leave({ employeeName, employeeId:emp?._id||null, type:type||"Casual Leave", from, to, reason:reason||"", status:"pending", appliedOn:new Date() });
    await leave.save();
    res.status(201).json({ msg:"Leave request submitted", leave });
  } catch(err) { res.status(500).json({ msg:"Server error", error:err.message }); }
});

// Employee: own leave history
router.get("/leave/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const leaves = await Leave.find({ employeeName:{ $regex:new RegExp(name,"i") } }).sort({ createdAt:-1 });
    res.json(leaves);
  } catch(err) { res.status(500).json({ msg:"Server error", error:err.message }); }
});

// Employee: cancel own pending leave
router.patch("/leave/:id/cancel", async (req, res) => {
  try {
    const { employeeName } = req.body;
    const leave = await Leave.findById(req.params.id);
    if(!leave) return res.status(404).json({ msg:"Leave not found" });
    if(leave.employeeName.toLowerCase()!==(employeeName||"").toLowerCase()) return res.status(403).json({ msg:"Not authorized" });
    if(leave.status!=="pending") return res.status(400).json({ msg:`Cannot cancel a leave that is already ${leave.status}` });
    leave.status = "cancelled"; await leave.save();
    res.json({ msg:"Leave cancelled", leave });
  } catch(err) { res.status(500).json({ msg:"Server error", error:err.message }); }
});

// Admin: all pending leaves
router.get("/leave/all/pending", async (req, res) => {
  try {
    res.json(await Leave.find({ status:"pending" }).sort({ createdAt:-1 }));
  } catch(err) { res.status(500).json({ msg:"Server error", error:err.message }); }
});

// Admin: all leaves (filter by ?status= &name=)
router.get("/leave/all/list", async (req, res) => {
  try {
    const filter = {};
    if(req.query.status) filter.status = req.query.status;
    if(req.query.name)   filter.employeeName = { $regex:new RegExp(req.query.name,"i") };
    res.json(await Leave.find(filter).sort({ createdAt:-1 }));
  } catch(err) { res.status(500).json({ msg:"Server error", error:err.message }); }
});

// Admin: approve leave
router.patch("/leave/:id/approve", async (req, res) => {
  try {
    const { reviewedBy, managerNote } = req.body;
    const leave = await Leave.findById(req.params.id);
    if(!leave) return res.status(404).json({ msg:"Leave not found" });
    if(leave.status!=="pending") return res.status(400).json({ msg:`Leave is already ${leave.status}` });
    leave.status="approved"; leave.reviewedBy=reviewedBy||"Admin"; leave.managerNote=managerNote||""; leave.reviewedAt=new Date();
    await leave.save();
    await _markAttendanceDates(leave,"leave");
    res.json({ msg:"Leave approved ✓", leave });
  } catch(err) { res.status(500).json({ msg:"Server error", error:err.message }); }
});

// Admin: reject leave
router.patch("/leave/:id/reject", async (req, res) => {
  try {
    const { reviewedBy, managerNote } = req.body;
    const leave = await Leave.findById(req.params.id);
    if(!leave) return res.status(404).json({ msg:"Leave not found" });
    if(leave.status!=="pending") return res.status(400).json({ msg:`Leave is already ${leave.status}` });
    leave.status="rejected"; leave.reviewedBy=reviewedBy||"Admin"; leave.managerNote=managerNote||""; leave.reviewedAt=new Date();
    await leave.save();
    res.json({ msg:"Leave rejected", leave });
  } catch(err) { res.status(500).json({ msg:"Server error", error:err.message }); }
});

async function _markAttendanceDates(leaveDoc, attendanceStatus) {
  try {
    const start=new Date(leaveDoc.from), end=new Date(leaveDoc.to);
    for(let d=new Date(start); d<=end; d.setDate(d.getDate()+1)) {
      const dateStr=d.toISOString().split("T")[0];
      const exists=await Attendance.findOne({ employeeName:leaveDoc.employeeName, date:dateStr });
      if(!exists) await Attendance.create({ employeeName:leaveDoc.employeeName, employeeId:leaveDoc.employeeId||null, date:dateStr, status:attendanceStatus, markedAt:new Date().toISOString(), note:"Auto-marked from approved leave" });
    }
  } catch(err) { console.error("Auto attendance marking failed:", err.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION REQUESTS (NEW)
//
//  Employee:
//  POST   /api/employee-dashboard/permission            → submit permission
//  GET    /api/employee-dashboard/permission/:name      → own history
//  PATCH  /api/employee-dashboard/permission/:id/cancel → cancel own pending
//
//  Admin / Manager:
//  GET    /api/employee-dashboard/permission/all/pending → all pending
//  GET    /api/employee-dashboard/permission/all/list    → all (filter ?status= ?name=)
//  PATCH  /api/employee-dashboard/permission/:id/approve → approve
//  PATCH  /api/employee-dashboard/permission/:id/reject  → reject
// ─────────────────────────────────────────────────────────────────────────────

// Employee: submit permission request
router.post("/permission", async (req, res) => {
  try {
    const { type, typeLabel, date, fromTime, toTime, reason, employeeName } = req.body;
    if(!date||!employeeName) return res.status(400).json({ msg:"Date and employee name required" });

    const emp = await Employee.findOne({ name:{ $regex:new RegExp(employeeName,"i") } });
    const permission = new Permission({
      employeeName, employeeId:emp?._id||null,
      type:       type      || "other",
      typeLabel:  typeLabel || "",
      date,
      fromTime:   fromTime  || "",
      toTime:     toTime    || "",
      reason:     reason    || "",
      status:     "pending",
      appliedOn:  new Date(),
    });
    await permission.save();
    res.status(201).json({ msg:"Permission request submitted", permission });
  } catch(err) { res.status(500).json({ msg:"Server error", error:err.message }); }
});

// Employee: own permission history
router.get("/permission/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const perms = await Permission.find({ employeeName:{ $regex:new RegExp(name,"i") } }).sort({ createdAt:-1 });
    res.json(perms);
  } catch(err) { res.status(500).json({ msg:"Server error", error:err.message }); }
});

// Employee: cancel own pending permission
router.patch("/permission/:id/cancel", async (req, res) => {
  try {
    const { employeeName } = req.body;
    const perm = await Permission.findById(req.params.id);
    if(!perm) return res.status(404).json({ msg:"Permission request not found" });
    if(perm.employeeName.toLowerCase()!==(employeeName||"").toLowerCase()) return res.status(403).json({ msg:"Not authorized" });
    if(perm.status!=="pending") return res.status(400).json({ msg:`Cannot cancel a request that is already ${perm.status}` });
    perm.status="cancelled"; await perm.save();
    res.json({ msg:"Permission cancelled", permission:perm });
  } catch(err) { res.status(500).json({ msg:"Server error", error:err.message }); }
});

// Admin: all pending permissions
router.get("/permission/all/pending", async (req, res) => {
  try {
    res.json(await Permission.find({ status:"pending" }).sort({ createdAt:-1 }));
  } catch(err) { res.status(500).json({ msg:"Server error", error:err.message }); }
});

// Admin: all permissions (filter ?status= &name= &type= &date=)
router.get("/permission/all/list", async (req, res) => {
  try {
    const filter = {};
    if(req.query.status) filter.status = req.query.status;
    if(req.query.name)   filter.employeeName = { $regex:new RegExp(req.query.name,"i") };
    if(req.query.type)   filter.type = req.query.type;
    if(req.query.date)   filter.date = req.query.date;
    res.json(await Permission.find(filter).sort({ createdAt:-1 }));
  } catch(err) { res.status(500).json({ msg:"Server error", error:err.message }); }
});

// Admin: APPROVE permission
// Body: { reviewedBy, managerNote }
router.patch("/permission/:id/approve", async (req, res) => {
  try {
    const { reviewedBy, managerNote } = req.body;
    const perm = await Permission.findById(req.params.id);
    if(!perm) return res.status(404).json({ msg:"Permission not found" });
    if(perm.status!=="pending") return res.status(400).json({ msg:`Already ${perm.status}` });
    perm.status="approved"; perm.reviewedBy=reviewedBy||"Admin"; perm.managerNote=managerNote||""; perm.reviewedAt=new Date();
    await perm.save();
    res.json({ msg:"Permission approved ✓", permission:perm });
  } catch(err) { res.status(500).json({ msg:"Server error", error:err.message }); }
});

// Admin: REJECT permission
// Body: { reviewedBy, managerNote }
router.patch("/permission/:id/reject", async (req, res) => {
  try {
    const { reviewedBy, managerNote } = req.body;
    const perm = await Permission.findById(req.params.id);
    if(!perm) return res.status(404).json({ msg:"Permission not found" });
    if(perm.status!=="pending") return res.status(400).json({ msg:`Already ${perm.status}` });
    perm.status="rejected"; perm.reviewedBy=reviewedBy||"Admin"; perm.managerNote=managerNote||""; perm.reviewedAt=new Date();
    await perm.save();
    res.json({ msg:"Permission rejected", permission:perm });
  } catch(err) { res.status(500).json({ msg:"Server error", error:err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// SALARY
// ─────────────────────────────────────────────────────────────────────────────
router.get("/salary/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const slips = await Salary.find({ employeeName:{ $regex:new RegExp(name,"i") } }).sort({ createdAt:-1 });
    res.json(slips);
  } catch(err) { res.status(500).json({ msg:"Server error", error:err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
router.get("/summary/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const [projects,tasks,attendance,salary] = await Promise.all([
      Project.find({ $or:[{ assignedTo:{ $regex:new RegExp(name,"i") } },{ manager:{ $regex:new RegExp(name,"i") } }] }),
      Task.find({ assignedTo:{ $regex:new RegExp(name,"i") } }),
      Attendance.find({ employeeName:{ $regex:new RegExp(name,"i") } }),
      Salary.find({ employeeName:{ $regex:new RegExp(name,"i") } }).sort({ createdAt:-1 }).limit(1),
    ]);
    const thisMonth=new Date().toISOString().slice(0,7);
    const monthAttend=attendance.filter(a=>a.date.startsWith(thisMonth));
    res.json({
      totalProjects:projects.length,
      activeProjects:projects.filter(p=>["active","in progress"].includes((p.status||"").toLowerCase())).length,
      totalTasks:tasks.length,
      pendingTasks:tasks.filter(t=>!["done","completed"].includes((t.status||"").toLowerCase())).length,
      presentDays:monthAttend.filter(a=>a.status==="present").length,
      absentDays:monthAttend.filter(a=>a.status==="absent").length,
      leaveDays:monthAttend.filter(a=>a.status==="leave").length,
      lastSalary:salary[0]||null,
    });
  } catch(err) { res.status(500).json({ msg:"Server error", error:err.message }); }
});

module.exports = router;
