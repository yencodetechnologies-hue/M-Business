// ============================================================
// routes/employeeDashboard.js
//
// Add this ONE line in server.js:
//   app.use("/api/employee-dashboard", require("./routes/employeeDashboard"));
// ============================================================

const express  = require("express");
const router   = express.Router();
const Employee = require("../models/EmployeeModel"); // your existing model ✅

// ── Create Invoice & Project models inline (or import if you have them) ──────
const mongoose = require("mongoose");

// ── Invoice Model (auto-creates if not exists) ────────────────────────────────
let Invoice;
try {
  Invoice = mongoose.model("Invoice");
} catch {
  const invoiceSchema = new mongoose.Schema({
    id:       { type: String, required: true, unique: true },
    client:   { type: String, default: "" },
    project:  { type: String, default: "" },
    amount:   { type: Number, default: 0 },
    date:     { type: String, default: "" },
    due:      { type: String, default: "" },
    paid:     { type: String, default: null },
    status:   { type: String, enum: ["draft","sent","paid","overdue","pending"], default: "draft" },
    employee: { type: String, default: "" },
    notes:    { type: String, default: "" },
  }, { timestamps: true });
  Invoice = mongoose.model("Invoice", invoiceSchema);
}

// ── Project Model (auto-creates if not exists) ────────────────────────────────
let Project;
try {
  Project = mongoose.model("Project");
} catch {
  const projectSchema = new mongoose.Schema({
    name:           { type: String, required: true },
    client:         { type: String, default: "" },
    clientName:     { type: String, default: "" },
    budget:         { type: String, default: "" },
    deadline:       { type: String, default: "" },
    status:         { type: String, default: "active" },
    progress:       { type: Number, default: 0 },
    tasks:          { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    assignedTo:     { type: String, default: "" },
    manager:        { type: String, default: "" },
  }, { timestamps: true });
  Project = mongoose.model("Project", projectSchema);
}

// ============================================================
// EMPLOYEE PROFILE
// ============================================================

// GET /api/employee-dashboard/profile/:name
// Returns the logged-in employee's profile from EmployeeModel
router.get("/profile/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const employee = await Employee.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") }
    });
    if (!employee) return res.status(404).json({ msg: "Employee not found" });
    res.json(employee);
  } catch (err) {
    console.error("Profile fetch error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ============================================================
// PROJECTS
// ============================================================

// GET /api/employee-dashboard/projects/:name
// Returns all projects assigned to this employee
router.get("/projects/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    console.log("🔍 Fetching projects for employee:", name);

    const projects = await Project.find({
      $or: [
        { assignedTo: { $regex: new RegExp(name, "i") } },
        { manager:    { $regex: new RegExp(name, "i") } },
      ]
    }).sort({ createdAt: -1 });

    console.log(`📁 Found ${projects.length} projects for ${name}`);
    res.json(projects);
  } catch (err) {
    console.error("Projects fetch error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// POST /api/employee-dashboard/projects/add
// Admin adds a project and assigns it to an employee
router.post("/projects/add", async (req, res) => {
  try {
    const { name, client, budget, deadline, status, assignedTo, manager } = req.body;
    if (!name) return res.status(400).json({ msg: "Project name required" });

    const project = new Project({ name, client, budget, deadline, status: status || "active", assignedTo, manager });
    await project.save();
    res.status(201).json({ msg: "Project created", project });
  } catch (err) {
    console.error("Add project error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// PATCH /api/employee-dashboard/projects/:id/progress
// Update project progress
router.patch("/projects/:id/progress", async (req, res) => {
  try {
    const { progress, completedTasks } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { progress, completedTasks },
      { new: true }
    );
    if (!project) return res.status(404).json({ msg: "Project not found" });
    res.json({ msg: "Progress updated", project });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// ============================================================
// INVOICES
// ============================================================

// GET /api/employee-dashboard/invoices/:name
// Returns all invoices created by this employee
router.get("/invoices/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);

    const invoices = await Invoice.find({
      employee: { $regex: new RegExp(name, "i") }
    }).sort({ createdAt: -1 });

    res.json(invoices);
  } catch (err) {
    console.error("Invoices fetch error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// POST /api/employee-dashboard/invoices
// Create or update (upsert by invoice id string)
router.post("/invoices", async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) return res.status(400).json({ msg: "Invoice id required" });

    // Upsert: update if exists, create if not
    const invoice = await Invoice.findOneAndUpdate(
      { id: data.id },
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ msg: "Invoice saved", invoice });
  } catch (err) {
    console.error("Save invoice error:", err.message);
    // Handle duplicate key on upsert race condition
    if (err.code === 11000) {
      return res.status(400).json({ msg: "Invoice already exists" });
    }
    res.status(500).json({ msg: "Server error" });
  }
});

// PATCH /api/employee-dashboard/invoices/:id/paid
// Mark invoice as paid
router.patch("/invoices/:id/paid", async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { id: req.params.id },
      {
        status: "paid",
        paid: new Date().toISOString().split("T")[0]
      },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ msg: "Invoice not found" });
    res.json({ msg: "Invoice marked as paid", invoice });
  } catch (err) {
    console.error("Mark paid error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE /api/employee-dashboard/invoices/:id
// Delete a draft invoice
router.delete("/invoices/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ id: req.params.id });
    if (!invoice) return res.status(404).json({ msg: "Invoice not found" });
    res.json({ msg: "Invoice deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// ============================================================
// DASHBOARD SUMMARY
// ============================================================

// GET /api/employee-dashboard/summary/:name
// Returns combined stats: projects count, invoice totals
router.get("/summary/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);

    const [projects, invoices] = await Promise.all([
      Project.find({
        $or: [
          { assignedTo: { $regex: new RegExp(name, "i") } },
          { manager:    { $regex: new RegExp(name, "i") } },
        ]
      }),
      Invoice.find({ employee: { $regex: new RegExp(name, "i") } })
    ]);

    const totalProjects  = projects.length;
    const activeProjects = projects.filter(p => ["active","in progress"].includes((p.status||"").toLowerCase())).length;
    const paidAmount     = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
    const pendingAmount  = invoices.filter(i => ["sent","pending"].includes(i.status)).reduce((s, i) => s + i.amount, 0);
    const overdueAmount  = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0);

    res.json({
      totalProjects,
      activeProjects,
      paidAmount,
      pendingAmount,
      overdueAmount,
      totalInvoices: invoices.length,
    });
  } catch (err) {
    console.error("Summary error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
