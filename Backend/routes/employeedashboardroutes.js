const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const Employee = require("../models/EmployeeModel");
const Project = require("../models/ProjectModel");
const Task = require("../models/TaskModels");
const User = require("../models/UserModels");


// Attendance, Leave, Permission, Salary models are not in separate files yet, so we'll keep them here or move them later if needed.
// For now, let's keep the redefinitions for those but use the proper ones for Project/Task/Employee.

let Attendance;
try { Attendance = mongoose.model("Attendance"); } catch {
  Attendance = mongoose.model("Attendance", new mongoose.Schema({
    employeeName: { type: String, required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    date: { type: String, required: true },
    status: { type: String, enum: ["present", "absent", "leave", "holiday"], default: "present" },
    markedAt: { type: String, default: "" },
    note: { type: String, default: "" },
  }, { timestamps: true }));
}

let Leave;
try { Leave = mongoose.model("Leave"); } catch {
  Leave = mongoose.model("Leave", new mongoose.Schema({
    employeeName: { type: String, required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    type: { type: String, default: "Casual Leave" },
    from: { type: String, required: true },
    to: { type: String, required: true },
    reason: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected", "cancelled"], default: "pending" },
    managerNote: { type: String, default: "" },
    reviewedBy: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
    appliedOn: { type: Date, default: Date.now },
  }, { timestamps: true }));
}

let Permission;
try { Permission = mongoose.model("Permission"); } catch {
  Permission = mongoose.model("Permission", new mongoose.Schema({
    employeeName: { type: String, required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    type: { type: String, enum: ["late_arrival", "early_departure", "od", "wfh", "half_day", "other"], default: "other" },
    typeLabel: { type: String, default: "" },
    date: { type: String, required: true },
    fromTime: { type: String, default: "" },
    toTime: { type: String, default: "" },
    reason: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected", "cancelled"], default: "pending" },
    managerNote: { type: String, default: "" },
    reviewedBy: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
    appliedOn: { type: Date, default: Date.now },
  }, { timestamps: true }));
}

let Salary;
try { Salary = mongoose.model("Salary"); } catch {
  Salary = mongoose.model("Salary", new mongoose.Schema({
    employeeName: { type: String, required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    month: { type: String, required: true },
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    status: { type: String, enum: ["paid", "pending"], default: "pending" },
    paidOn: { type: String, default: "" },
  }, { timestamps: true }));
}

// ── Document Model ────────────────────────────────────────────────────────────
let EmployeeDoc;
try { EmployeeDoc = mongoose.model("EmployeeDoc"); } catch {
  EmployeeDoc = mongoose.model("EmployeeDoc", new mongoose.Schema({
    employeeName: { type: String, required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    docType: { type: String, enum: ["aadhaar", "pan", "passbook", "itr"], required: true },
    url: { type: String, required: true },
    fileName: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
  }, { timestamps: true }));
}

// ── Multer setup (Cloudinary) ──────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const docStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "M-Business/Documents",
    resource_type: "auto", // supports pdf, images, etc.
    public_id: (req, file) => `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`,
  },
});

const docUpload = multer({ storage: docStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────
router.get("/profile/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name).trim();
    const companyId = req.headers['x-company-id'] || "";
    const query = { name: new RegExp(`^${name}$`, "i") };
    if (companyId) query.companyId = companyId;
    
    const emp = await Employee.findOne(query);
    if (!emp) return res.status(404).json({ msg: "Employee not found" });
    res.json(emp);
  } catch (err) { res.status(500).json({ msg: "Server error", error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────────────────────────────────────
router.get("/projects/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name).trim();
    if (!name) return res.json([]);
    
    let companyId = req.headers['x-company-id'] || "";
    
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safeName = escapeRegExp(name);
    const nameRegex = new RegExp(`^\\s*${safeName}\\s*$`, "i");

    // Company ID Recovery
    if (!companyId) {
      const [u, e] = await Promise.all([
        User.findOne({ name: nameRegex }),
        Employee.findOne({ name: nameRegex })
      ]);
      companyId = u?.companyId || e?.companyId || "";
    }

    if (!companyId) return res.status(400).json({ msg: "Company ID required" });
    
    const query = {
      companyId,
      $or: [
        { assignedTo: nameRegex },
        { manager: nameRegex }
      ]
    };
    
    const projects = await Project.find(query).sort({ createdAt: -1 });
    res.json(projects);

  } catch (err) {
    console.error("GET Projects Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────────────────────────────────────
router.get("/tasks/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name).trim();
    if (!name) return res.json([]);
    
    let companyId = req.headers['x-company-id'] || "";
    
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safeName = escapeRegExp(name);
    const nameRegex = new RegExp(`^\\s*${safeName}\\s*$`, "i");
    
    // Find identities in both User and Employee collections
    // If companyId is missing, find by name only to "recover" the company context
    const idFilter = companyId ? { name: nameRegex, companyId } : { name: nameRegex };
    const [user, employee] = await Promise.all([
      User.findOne(idFilter),
      Employee.findOne(idFilter)
    ]);
    
    // If companyId was missing, use the one from the found identity
    if (!companyId) {
      companyId = user?.companyId || employee?.companyId || "";
    }
    
    if (!companyId) return res.status(400).json({ msg: "Company ID required or could not be resolved" });
    
    const query = {
      companyId,
      $or: [
        { assignTo: nameRegex }
      ],
      isDeleted: false
    };

    if (user) query.$or.push({ assignedTo: user._id });
    if (employee) query.$or.push({ assignedTo: employee._id });
    
    const tasks = await Task.find(query)
      .populate("projectId", "name color")
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error("GET Tasks Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────────────────────
router.get("/attendance/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name).trim();
    let companyId = req.headers['x-company-id'] || "";
    
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safeName = escapeRegExp(name);
    const nameRegex = new RegExp(`^\\s*${safeName}\\s*$`, "i");

    if (!companyId) {
      const [u, e] = await Promise.all([
        User.findOne({ name: nameRegex }),
        Employee.findOne({ name: nameRegex })
      ]);
      companyId = u?.companyId || e?.companyId || "";
    }

    if (!companyId) return res.status(400).json({ msg: "Company ID required" });
    
    const query = { 
      companyId,
      employeeName: { $regex: nameRegex }
    };
    
    const records = await Attendance.find(query).sort({ date: -1 });
    res.json(records);
  } catch (err) { res.status(500).json({ msg: "Server error", error: err.message }); }
});

router.post("/attendance", async (req, res) => {
  try {
    const { date, status, employeeName, markedAt, note } = req.body;
    if (!date || !employeeName) return res.status(400).json({ msg: "Date and employee name required" });
    const exists = await Attendance.findOne({ employeeName: { $regex: new RegExp(employeeName, "i") }, date });
    if (exists) return res.status(400).json({ msg: "Attendance already marked for this date" });
    const emp = await Employee.findOne({ name: { $regex: new RegExp(employeeName, "i") } });
    const record = new Attendance({
      employeeName, employeeId: emp?._id || null,
      date, status: status || "present",
      markedAt: markedAt || new Date().toISOString(),
      note: note || ""
    });
    await record.save();
    res.status(201).json({ msg: "Attendance marked", record });
  } catch (err) { res.status(500).json({ msg: "Server error", error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// LEAVE
// ─────────────────────────────────────────────────────────────────────────────
router.post("/leave", async (req, res) => {
  try {
    const { type, from, to, reason, employeeName } = req.body;
    if (!from || !to || !employeeName) return res.status(400).json({ msg: "Required fields missing" });
    const emp = await Employee.findOne({ name: { $regex: new RegExp(employeeName, "i") } });
    const leave = new Leave({
      employeeName, employeeId: emp?._id || null,
      type: type || "Casual Leave", from, to, reason: reason || "",
      status: "pending", appliedOn: new Date()
    });
    await leave.save();
    res.status(201).json({ msg: "Leave request submitted", leave });
  } catch (err) { res.status(500).json({ msg: "Server error", error: err.message }); }
});

router.get("/leave/all/pending", async (req, res) => {
  try {
    res.json(await Leave.find({ status: "pending" }).sort({ createdAt: -1 }));
  } catch (err) { res.status(500).json({ msg: "Server error", error: err.message }); }
});

router.get("/leave/all/list", async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.name) filter.employeeName = { $regex: new RegExp(req.query.name, "i") };
    res.json(await Leave.find(filter).sort({ createdAt: -1 }));
  } catch (err) { res.status(500).json({ msg: "Server error", error: err.message }); }
});

router.get("/leave/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name).trim();
    let companyId = req.headers['x-company-id'] || "";
    
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safeName = escapeRegExp(name);
    const nameRegex = new RegExp(`^\\s*${safeName}\\s*$`, "i");

    if (!companyId) {
      const [u, e] = await Promise.all([
        User.findOne({ name: nameRegex }),
        Employee.findOne({ name: nameRegex })
      ]);
      companyId = u?.companyId || e?.companyId || "";
    }

    if (!companyId) return res.status(400).json({ msg: "Company ID required" });
    
    const query = { 
      companyId,
      employeeName: nameRegex 
    };
    
    const leaves = await Leave.find(query).sort({ from: -1 });
    res.json(leaves);
  } catch (err) { res.status(500).json({ msg: "Server error", error: err.message }); }
});

router.patch("/leave/:id/cancel", async (req, res) => {
  try {
    const { employeeName } = req.body;
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ msg: "Leave not found" });
    if (leave.status !== "pending") return res.status(400).json({ msg: `Cannot cancel a leave that is already ${leave.status}` });
    leave.status = "cancelled";
    await leave.save();
    res.json({ msg: "Leave cancelled", leave });
  } catch (err) { res.status(500).json({ msg: "Server error", error: err.message }); }
});

router.patch("/leave/:id/approve", async (req, res) => {
  try {
    const { reviewedBy, managerNote } = req.body;
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ msg: "Leave not found" });
    if (leave.status !== "pending") return res.status(400).json({ msg: `Leave is already ${leave.status}` });
    leave.status = "approved";
    leave.reviewedBy = reviewedBy || "Admin";
    leave.managerNote = managerNote || "";
    leave.reviewedAt = new Date();
    await leave.save();
    res.json({ msg: "Leave approved", leave });
  } catch (err) { res.status(500).json({ msg: "Server error", error: err.message }); }
});

router.patch("/leave/:id/reject", async (req, res) => {
  try {
    const { reviewedBy, managerNote } = req.body;
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ msg: "Leave not found" });
    if (leave.status !== "pending") return res.status(400).json({ msg: `Leave is already ${leave.status}` });
    leave.status = "rejected";
    leave.reviewedBy = reviewedBy || "Admin";
    leave.managerNote = managerNote || "";
    leave.reviewedAt = new Date();
    await leave.save();
    res.json({ msg: "Leave rejected", leave });
  } catch (err) { res.status(500).json({ msg: "Server error", error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION
// ─────────────────────────────────────────────────────────────────────────────
router.post("/permission", async (req, res) => {
  try {
    const { type, typeLabel, date, fromTime, toTime, reason, employeeName } = req.body;
    if (!date || !employeeName) return res.status(400).json({ msg: "Date and employee name required" });
    const emp = await Employee.findOne({ name: { $regex: new RegExp(employeeName, "i") } });
    const permission = new Permission({
      employeeName, employeeId: emp?._id || null,
      type: type || "other", typeLabel: typeLabel || "",
      date, fromTime: fromTime || "", toTime: toTime || "",
      reason: reason || "", status: "pending", appliedOn: new Date()
    });
    await permission.save();
    res.status(201).json({ msg: "Permission request submitted", permission });
  } catch (err) { res.status(500).json({ msg: "Server error", error: err.message }); }
});

router.get("/permission/all/pending", async (req, res) => {
  try {
    res.json(await Permission.find({ status: "pending" }).sort({ createdAt: -1 }));
  } catch (err) { res.status(500).json({ msg: "Server error", error: err.message }); }
});

router.get("/permission/all/list", async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.name) filter.employeeName = { $regex: new RegExp(req.query.name, "i") };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.date) filter.date = req.query.date;
    res.json(await Permission.find(filter).sort({ createdAt: -1 }));
  } catch (err) { res.status(500).json({ msg: "Server error", error: err.message }); }
});

router.get("/permission/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name).trim();
    let companyId = req.headers['x-company-id'] || "";
    
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safeName = escapeRegExp(name);
    const nameRegex = new RegExp(`^\\s*${safeName}\\s*$`, "i");

    if (!companyId) {
      const [u, e] = await Promise.all([
        User.findOne({ name: nameRegex }),
        Employee.findOne({ name: nameRegex })
      ]);
      companyId = u?.companyId || e?.companyId || "";
    }

    if (!companyId) return res.status(400).json({ msg: "Company ID required" });
    
    const query = { 
      companyId,
      employeeName: nameRegex 
    };
    
    const perms = await Permission.find(query).sort({ createdAt: -1 });
    res.json(perms);
  } catch (err) { res.status(500).json({ msg: "Server error", error: err.message }); }
});

router.patch("/permission/:id/cancel", async (req, res) => {
  try {
    const { employeeName } = req.body;
    const perm = await Permission.findById(req.params.id);
    if (!perm) return res.status(404).json({ msg: "Permission not found" });
    if (perm.status !== "pending") return res.status(400).json({ msg: `Cannot cancel a request that is already ${perm.status}` });
    perm.status = "cancelled";
    await perm.save();
    res.json({ msg: "Permission cancelled", permission: perm });
  } catch (err) { res.status(500).json({ msg: "Server error", error: err.message }); }
});

router.patch("/permission/:id/approve", async (req, res) => {
  try {
    const { reviewedBy, managerNote } = req.body;
    const perm = await Permission.findById(req.params.id);
    if (!perm) return res.status(404).json({ msg: "Permission not found" });
    if (perm.status !== "pending") return res.status(400).json({ msg: `Already ${perm.status}` });
    perm.status = "approved";
    perm.reviewedBy = reviewedBy || "Admin";
    perm.managerNote = managerNote || "";
    perm.reviewedAt = new Date();
    await perm.save();
    res.json({ msg: "Permission approved", permission: perm });
  } catch (err) { res.status(500).json({ msg: "Server error", error: err.message }); }
});

router.patch("/permission/:id/reject", async (req, res) => {
  try {
    const { reviewedBy, managerNote } = req.body;
    const perm = await Permission.findById(req.params.id);
    if (!perm) return res.status(404).json({ msg: "Permission not found" });
    if (perm.status !== "pending") return res.status(400).json({ msg: `Already ${perm.status}` });
    perm.status = "rejected";
    perm.reviewedBy = reviewedBy || "Admin";
    perm.managerNote = managerNote || "";
    perm.reviewedAt = new Date();
    await perm.save();
    res.json({ msg: "Permission rejected", permission: perm });
  } catch (err) { res.status(500).json({ msg: "Server error", error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// SALARY
// ─────────────────────────────────────────────────────────────────────────────
router.get("/salary/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name).trim();
    let companyId = req.headers['x-company-id'] || "";
    
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safeName = escapeRegExp(name);
    const nameRegex = new RegExp(`^\\s*${safeName}\\s*$`, "i");

    if (!companyId) {
      const [u, e] = await Promise.all([
        User.findOne({ name: nameRegex }),
        Employee.findOne({ name: nameRegex })
      ]);
      companyId = u?.companyId || e?.companyId || "";
    }

    if (!companyId) return res.status(400).json({ msg: "Company ID required" });
    
    const query = { 
      companyId,
      employeeName: nameRegex 
    };
    
    const slips = await Salary.find(query).sort({ createdAt: -1 });
    res.json(slips);
  } catch (err) { res.status(500).json({ msg: "Server error", error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTS — Upload Aadhaar / PAN / Bank Passbook
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/employee-dashboard/documents/upload
router.post("/documents/upload", docUpload.single("file"), async (req, res) => {
  try {
    const { employeeName, docType } = req.body;
    if (!req.file || !employeeName || !docType)
      return res.status(400).json({ msg: "File, employee name and doc type required" });

    const url = req.file.path; // Cloudinary URL is returned in req.file.path
    const emp = await Employee.findOne({ name: { $regex: new RegExp(employeeName, "i") } });

    const doc = await EmployeeDoc.findOneAndUpdate(
      { employeeName: { $regex: new RegExp(`^${employeeName}$`, "i") }, docType },
      {
        employeeName, employeeId: emp?._id || null,
        docType, url,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        uploadedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ msg: "Uploaded successfully", document: doc });
  } catch (err) { res.status(500).json({ msg: "Upload failed", error: err.message }); }
});

// GET /api/employee-dashboard/documents/:name/all  — all docs for employee
// GET /api/employee-dashboard/documents/:name/:docType — single doc
router.get("/documents/:name/:docType", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name).trim();
    const companyId = req.headers['x-company-id'] || "";
    const { docType } = req.params;
    
    const query = { employeeName: new RegExp(`^${name}$`, "i") };
    if (companyId) query.companyId = companyId;

    if (docType === "all") {
      const docs = await EmployeeDoc.find(query);
      return res.json(docs);
    }
    
    query.docType = docType;
    const doc = await EmployeeDoc.findOne(query);
    res.json(doc || {});
  } catch (err) { res.status(500).json({ msg: "Error", error: err.message }); }
});

// DELETE /api/employee-dashboard/documents/:name/:docType
router.delete("/documents/:name/:docType", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    await EmployeeDoc.deleteOne({
      employeeName: { $regex: new RegExp(name, "i") },
      docType: req.params.docType
    });
    res.json({ msg: "Deleted" });
  } catch (err) { res.status(500).json({ msg: "Error", error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
router.get("/summary/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name).trim();
    let companyId = req.headers['x-company-id'] || "";
    
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safeName = escapeRegExp(name);
    const nameRegex = new RegExp(`^\\s*${safeName}\\s*$`, "i");

    if (!companyId) {
      const [u, e] = await Promise.all([
        User.findOne({ name: nameRegex }),
        Employee.findOne({ name: nameRegex })
      ]);
      companyId = u?.companyId || e?.companyId || "";
    }

    if (!companyId) return res.status(400).json({ msg: "Company ID required" });

    const user = await User.findOne({ name: nameRegex, companyId });
    const employee = await Employee.findOne({ name: nameRegex, companyId });

    const query = { 
      companyId,
      $or: [{ assignedTo: nameRegex }, { manager: nameRegex }] 
    };
    if (user) query.$or.push({ assignedTo: user._id });
    if (employee) query.$or.push({ assignedTo: employee._id });

    const taskQuery = { 
      companyId,
      $or: [{ assignTo: nameRegex }], 
      isDeleted: false 
    };
    if (user) taskQuery.$or.push({ assignedTo: user._id });
    if (employee) taskQuery.$or.push({ assignedTo: employee._id });

    const attQuery = { 
      companyId,
      employeeName: nameRegex 
    };

    const salQuery = { 
      companyId,
      employeeName: nameRegex 
    };

    const [projects, tasks, attendance, salary] = await Promise.all([
      Project.find(query),
      Task.find(taskQuery),
      Attendance.find(attQuery),
      Salary.find(salQuery).sort({ createdAt: -1 }).limit(1),
    ]);

    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthAttend = attendance.filter(a => a.date.startsWith(thisMonth));
    res.json({
      totalProjects: projects.length,
      activeProjects: projects.filter(p => ["active", "in progress"].includes((p.status || "").toLowerCase())).length,
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => !["done", "completed"].includes((t.status || "").toLowerCase())).length,
      presentDays: monthAttend.filter(a => a.status === "present").length,
      absentDays: monthAttend.filter(a => a.status === "absent").length,
      leaveDays: monthAttend.filter(a => a.status === "leave").length,
      lastSalary: salary[0] || null,
    });
  } catch (err) { res.status(500).json({ msg: "Server error", error: err.message }); }
});

module.exports = router;
