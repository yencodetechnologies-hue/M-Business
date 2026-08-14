const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Project = require("../models/ProjectModel");
const Client = require("../models/ClientModel");

function parseAmt(val) {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  const num = Number(String(val).replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(num) ? num : 0;
}

function applyProjectFinance(project) {
  const receivedFromPayments = (project.paymentsReceived || []).reduce((sum, p) => sum + parseAmt(p.amount), 0);
  const received = receivedFromPayments > 0 ? receivedFromPayments : parseAmt(project.received);
  const advanceTotal = (project.advances || []).reduce((sum, a) => sum + parseAmt(a.amount), 0);
  const budget = parseAmt(project.budget);
  const spent = (project.expenses || []).reduce((sum, exp) => sum + parseAmt(exp.amount), 0);
  project.received = received;
  project.spent = spent;
  project.pending = Math.max(0, budget - received - advanceTotal);
  return project.pending;
}

function nextExpenseNo(expenses) {
  const n = (expenses || []).length + 1;
  return `EXP-${String(n).padStart(3, "0")}`;
}

// GET all projects
router.get("/", async (req, res) => {
  try {
    const companyId = req.companyId || "NONE";
    const projects = await Project.find({ companyId }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error("GET projects error:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// GET single project by ID
// IMPORTANT: this must come before "/:employeeName" — otherwise Express
// matches a project's Mongo _id against that route instead, and the
// real single-project handler is never reached.
router.get("/:id", async (req, res, next) => {
  if (!/^[a-fA-F0-9]{24}$/.test(req.params.id)) return next();
  try {
    const companyId = req.companyId || req.headers['x-company-id'] || "";
    const query = { _id: req.params.id };
    if (companyId) query.companyId = companyId;
    const project = await Project.findOne(query);
    if (!project) return res.status(404).json({ msg: "Project not found" });
    res.json(project);
  } catch (err) {
    console.error("GET project by ID error:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// GET projects assigned to an employee
router.get("/:employeeName", async (req, res) => {
  try {
    const companyId = req.companyId || "";
    if (!companyId) return res.json([]);
    const name = decodeURIComponent(req.params.employeeName).trim();
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safeName = escapeRegExp(name);
    const projects = await Project.find({
      companyId,
      assignedTo: { $regex: new RegExp(`^\\s*${safeName}\\s*$`, "i") }
    }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error("GET projects by employee error:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// GET projects by client name
router.get("/client/:clientName", async (req, res) => {
  try {
    const companyId = req.companyId || "";
    if (!companyId) return res.json([]);

    const clientId = req.query.clientId ? String(req.query.clientId).trim() : "";
    const name = decodeURIComponent(req.params.clientName).trim();
    const companyName = req.query.company ? decodeURIComponent(req.query.company).trim() : "";

    // If clientId is provided, try strict clientId match first
    if (clientId) {
      const byId = await Project.find({ companyId, clientId }).sort({ createdAt: -1 });
      if (byId.length > 0) return res.json(byId);
      // Fall through to name-based match for projects created before clientId was saved
    }

    // Legacy fallback: name-based match for projects created before clientId existed
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safeName = escapeRegExp(name);
    const safeCompany = escapeRegExp(companyName);

    const conditions = [];
    // Exact name match
    if (safeName) conditions.push({ client: { $regex: new RegExp(`^\\s*${safeName}\\s*$`, "i") } });
    // Company name match
    if (safeCompany) conditions.push({ client: { $regex: new RegExp(`^\\s*${safeCompany}\\s*$`, "i") } });
    // Partial name match (catches variations)
    if (safeName) conditions.push({ client: { $regex: new RegExp(safeName, "i") } });
    if (safeCompany) conditions.push({ client: { $regex: new RegExp(safeCompany, "i") } });

    const filter = conditions.length > 0
      ? { companyId, $or: conditions }
      : { companyId };

    const projects = await Project.find(filter).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error("GET by-client error:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// GET projects assigned to an employee
router.get("/employee/:employeeName", async (req, res) => {
  try {
    const companyId = req.companyId || "";
    if (!companyId) return res.json([]);
    const name = decodeURIComponent(req.params.employeeName).trim().toLowerCase();
    const projects = await Project.find({ companyId }).sort({ createdAt: -1 });
    const filtered = projects.filter(p => {
      const assigned = Array.isArray(p.assignedTo) ? p.assignedTo : (p.assignedTo ? [p.assignedTo] : []);
      return assigned.some(a => String(a).trim().toLowerCase() === name);
    });
    res.json(filtered);
  } catch (err) {
    console.error("GET projects by employee error:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});



// POST add project
router.post("/add", async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error("Database not connected! ReadyState:", mongoose.connection.readyState);
      return res.status(500).json({
        msg: "Database not connected",
        error: "Server is not connected to the database"
      });
    }

    console.log("=== ADD PROJECT ===");
    console.log("Body received:", JSON.stringify(req.body));

    const {
      name, client, contactPersonName, contactPersonNo,
      category, priority, purpose, description,
      start, end, deadline, budget, currency,
      billed, received, pending, spent,
      team, status, progress, tasks, completedTasks,
      assignedTo, manager,
      updates, milestones, files, portalSettings, portalOpts
    } = req.body;

    if (!name) return res.status(400).json({ msg: "Project name required" });
    if (!client) return res.status(400).json({ msg: "Client required" });

    console.log("Creating new Project instance...");
    const portal = portalSettings || portalOpts || {
      enablePortal: true,
      showProgress: true,
      showMilestones: true,
      showTeam: false,
      allowMessages: true,
    };
    const project = new Project({
      name,
      client,
      contactPersonName: contactPersonName || "",
      contactPersonNo: contactPersonNo || "",
      category: category || "Web Development",
      priority: priority || "medium",
      purpose: purpose || "",
      description: description || "",
      start: start || "",
      end: end || "",
      deadline: deadline || end || "",
      budget: budget ? Number(budget) : 0,
      currency: currency || "₹",
      billed: Number(billed) || 0,
      received: Number(received) || 0,
      pending: Number(pending) || 0,
      spent: Number(spent) || 0,
      team: team || "",
      status: status || "Ongoing",
      progress: Number(progress) || 0,
      tasks: Number(tasks) || 0,
      completedTasks: Number(completedTasks) || 0,
      assignedTo: Array.isArray(assignedTo) ? assignedTo : [],
      manager: manager || "",
      milestones: Array.isArray(milestones) ? milestones : [],
      portalSettings: portal,
      updates: Array.isArray(updates) ? updates : [],
      files: Array.isArray(files) ? files : [],
      loggedHours: Number(req.body.loggedHours) || 0,
      companyId: req.companyId || "",
      clientId: req.body.clientId || "",
      commissions: Array.isArray(req.body.commissions) ? req.body.commissions : [],
      proposalPdf: req.body.proposalPdf || null,
      quotationPdf: req.body.quotationPdf || null,
      invoicePdf: req.body.invoicePdf || null,
    });

    applyProjectFinance(project);
    console.log("Attempting to save project...");
    const saved = await project.save();

    // Proactively mint the Client Portal token for this project right away,
    // so the Project Details page never has to show "Generating link..." —
    // even on the very first visit.
    try {
      if (saved.clientId) {
        const client = await Client.findById(saved.clientId);
        if (client) {
          const token = jwt.sign(
            {
              clientId: client._id.toString(),
              email: client.email,
              name: client.clientName || client.name,
              companyName: client.companyName || client.company || "",
              companyId: saved.companyId || client.companyId || "",
              agencyName: "",
              projectId: saved._id.toString(),
              role: "client",
            },
            process.env.JWT_SECRET || "secret",
            { expiresIn: "24h" }
          );
          await Client.findByIdAndUpdate(client._id, { portalToken: token, portalTokenProjectId: saved._id.toString() });
          console.log("✅ Pre-generated portal token for project:", saved._id);
        }
      }
    } catch (err) {
      console.error("Pre-generate portal token error:", err.message);
    }

    // Auto-create Project Status tracking entry
    try {
      const ProjectStatus = mongoose.models.ProjectStatus;
      if (ProjectStatus) {
        const ps = new ProjectStatus({
          name: saved.name,
          client: saved.client,
          manager: saved.manager || "",
          employee: (saved.assignedTo && saved.assignedTo.length) ? saved.assignedTo.join(", ") : "",
          deadline: saved.deadline || saved.end || new Date().toISOString().split("T")[0],
          status: saved.status || "Pending",
          progress: saved.progress || 0,
          notes: saved.description || "",
          companyId: saved.companyId || "",
        });
        await ps.save();
        console.log("✅ Auto-created ProjectStatus for:", saved.name);
      }
    } catch (err) {
      console.error("Auto-create ProjectStatus error:", err.message);
    }

    console.log("✅ Project saved:", saved._id);

    // Proactively mint a client-portal token for this project so the
    // "Client Portal" panel never has to show "Generating link..." the
    // first time someone opens this project's details page.
    try {
      const clientId = req.body.clientId || "";
      if (clientId) {
        const client = await Client.findById(clientId);
        if (client) {
          const token = jwt.sign(
            {
              clientId: client._id.toString(),
              email: client.email,
              name: client.clientName || client.name,
              companyName: client.companyName || client.company || "",
              companyId: req.companyId || client.companyId || "",
              agencyName: "",
              projectId: saved._id.toString(),
              role: "client",
            },
            process.env.JWT_SECRET || "secret",
            { expiresIn: "24h" }
          );
          await Client.findByIdAndUpdate(clientId, {
            portalToken: token,
            portalTokenProjectId: saved._id.toString(),
          });
          console.log("✅ Pre-generated portal token for project:", saved._id);
        }
      }
    } catch (portalErr) {
      console.error("Pre-generate portal token error:", portalErr.message);
      // Non-fatal — the frontend will fall back to generating the token lazily.
    }

    res.status(201).json({ msg: "Project created", project: saved });

  } catch (err) {
    console.error("❌ ADD PROJECT ERROR:", err.name, "|", err.message);
    console.error("Full error object:", err);
    console.error("Stack trace:", err.stack);

    // Handle validation errors specifically
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        msg: "Validation failed",
        errors: validationErrors,
        error: err.message
      });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({
        msg: "Duplicate entry",
        error: "A project with this information already exists"
      });
    }

    res.status(500).json({
      msg: "Server error",
      error: err.message,
      type: err.name
    });
  }
});

// PUT update project
router.put("/:id", async (req, res) => {
  try {
    // Validate the ID is a proper MongoDB ObjectId
    const rawId = req.params.id;
    if (!rawId || rawId === "undefined" || rawId === "null" || !mongoose.Types.ObjectId.isValid(rawId)) {
      console.error("PUT project: invalid or missing ID:", rawId);
      return res.status(400).json({ msg: "Invalid project ID: " + rawId });
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error("Database not connected! ReadyState:", mongoose.connection.readyState);
      return res.status(500).json({
        msg: "Database not connected",
        error: "Server is not connected to the database"
      });
    }

    // Save properly if assignedTo is passed as an array
    const updateData = { ...req.body };
    if (updateData.assignedTo && !Array.isArray(updateData.assignedTo)) {
      updateData.assignedTo = [updateData.assignedTo];
    }
    if (updateData.budget !== undefined) {
      updateData.budget = Number(updateData.budget) || 0;
    }
    if (updateData.portalOpts && !updateData.portalSettings) {
      updateData.portalSettings = updateData.portalOpts;
      delete updateData.portalOpts;
    }

    const companyId = req.companyId || req.headers['x-company-id'] || "";
    if (!companyId) {
      console.error("PUT project: missing companyId on request");
      return res.status(400).json({ msg: "Missing company context (x-company-id header)" });
    }
    const existingProject = await Project.findOne({ _id: rawId, companyId });
    if (!existingProject) {
      console.error("PUT project: not found for id", rawId, "companyId", companyId);
      return res.status(404).json({ msg: "Project not found or unauthorized" });
    }

    let project;
    try {
      Object.keys(updateData).forEach(key => {
        if (key === 'portalSettings' && updateData.portalSettings && typeof updateData.portalSettings === 'object') {
          existingProject.portalSettings = {
            ...(existingProject.portalSettings ? existingProject.portalSettings.toObject?.() || existingProject.portalSettings : {}),
            ...updateData.portalSettings
          };
        } else {
          existingProject[key] = updateData[key];
        }
      });
      existingProject.markModified('portalSettings');
      const pendingAmt = applyProjectFinance(existingProject);
      if (String(existingProject.status || "").toLowerCase() === "completed" && pendingAmt > 0) {
        return res.status(400).json({
          msg: "Payment must be finished before marking this project Completed. Pending amount must be ₹0.",
          pending: pendingAmt,
          suggestedStatus: "Pending"
        });
      }
      project = await existingProject.save();
      console.log('Saved project portalSettings:', project.portalSettings);
    } catch (saveErr) {
      console.error("PUT project validation error:", saveErr.errors ? JSON.stringify(saveErr.errors, null, 2) : saveErr.message);
      if (saveErr.name === "ValidationError") {
        return res.status(400).json({ msg: "Validation failed", error: saveErr.message, fields: Object.keys(saveErr.errors || {}) });
      }
      throw saveErr;
    }

    // Auto-update Project Status tracking entry
    try {
      const ProjectStatus = mongoose.models.ProjectStatus;
      if (ProjectStatus) {
        await ProjectStatus.findOneAndUpdate(
          { name: project.name, companyId: project.companyId },
          {
            $set: {
              client: project.client,
              manager: project.manager || "",
              employee: (project.assignedTo && project.assignedTo.length) ? project.assignedTo.join(", ") : "",
              deadline: project.deadline || project.end || new Date().toISOString().split("T")[0],
              status: project.status || "Pending",
              progress: project.progress || 0,
            }
          }
        );
      }
    } catch (err) {
      console.error("Auto-update ProjectStatus error:", err.message);
    }

    res.json({ project });
  } catch (err) {
    console.error("PUT project error:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// DELETE project
router.delete("/:id", async (req, res) => {
  try {
    const companyId = req.companyId || "";
    const project = await Project.findOneAndDelete({ _id: req.params.id, companyId });
    if (!project) return res.status(404).json({ msg: "Project not found or unauthorized" });

    // Auto-delete Project Status tracking entry
    try {
      const ProjectStatus = mongoose.models.ProjectStatus;
      if (ProjectStatus) {
        await ProjectStatus.findOneAndDelete({ name: project.name, companyId: project.companyId });
      }
    } catch (err) {
      console.error("Auto-delete ProjectStatus error:", err.message);
    }

    // Cascade-delete all data linked to this project
    try {
      const Task = mongoose.models.Task;
      if (Task) await Task.deleteMany({ projectId: project._id });
    } catch (err) {
      console.error("Cascade-delete Tasks error:", err.message);
    }

    try {
      const Approval = mongoose.models.Approval;
      if (Approval) await Approval.deleteMany({ projectId: String(project._id) });
    } catch (err) {
      console.error("Cascade-delete Approvals error:", err.message);
    }

    try {
      const Invoice = mongoose.models.Invoice;
      if (Invoice) await Invoice.deleteMany({ project: project.name, companyId });
    } catch (err) {
      console.error("Cascade-delete Invoices error:", err.message);
    }

    try {
      const Event = mongoose.models.Event;
      if (Event) await Event.deleteMany({ project: project.name, companyId });
    } catch (err) {
      console.error("Cascade-delete Events error:", err.message);
    }

    res.json({ msg: "Project deleted" });
  } catch (err) {
    console.error("DELETE project error:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// Approve/Reject an update
router.patch("/:id/updates/:updateId", async (req, res) => {
  const { status } = req.body; // "approved" or "rejected"
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, "updates._id": req.params.updateId },
    { $set: { "updates.$.type": status } },
    { new: true }
  );
  res.json(project);
});
// PATCH — recalculate spent from expenses array (called after any expense add/edit/delete)
router.patch("/:id/recalc-budget", async (req, res) => {
  try {
    const companyId = req.companyId || "";
    const project = await Project.findOne({ _id: req.params.id, companyId });
    if (!project) return res.status(404).json({ msg: "Project not found" });

    const spent = (project.expenses || []).reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    applyProjectFinance(project);
    await project.save();

    const budgetAmt = Number(project.budget) || 0;
    const remaining = budgetAmt > 0 ? budgetAmt - spent : 0;
    const usedPct = budgetAmt > 0 ? Math.round((spent / budgetAmt) * 100) : 0;
    const exceeded = budgetAmt > 0 && spent > budgetAmt;

    res.json({ msg: "Budget recalculated", spent: project.spent, pending: project.pending, remaining, usedPct, exceeded });
  } catch (err) {
    console.error("recalc-budget error:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// POST — add a single expense without sending the whole project
router.post("/:id/expenses", async (req, res) => {
  try {
    const rawId = req.params.id;
    if (!rawId || !mongoose.Types.ObjectId.isValid(rawId)) {
      return res.status(400).json({ msg: "Invalid project ID" });
    }
    const companyId = req.companyId || req.headers["x-company-id"] || "";
    if (!companyId) return res.status(400).json({ msg: "Missing company context (x-company-id header)" });

    const project = await Project.findOne({ _id: rawId, companyId });
    if (!project) return res.status(404).json({ msg: "Project not found or unauthorized" });

    const amount = parseAmt(req.body.amount);
    if (!amount) return res.status(400).json({ msg: "Expense amount is required" });

    const expenses = Array.isArray(project.expenses) ? project.expenses : [];
    const expense = {
      expenseNo: req.body.expenseNo || nextExpenseNo(expenses),
      category: req.body.category || "Miscellaneous",
      description: req.body.description || "",
      amount,
      date: req.body.date || new Date().toISOString().split("T")[0],
      paymentMode: req.body.paymentMode || "",
      status: req.body.status || "Paid",
      notes: req.body.notes || "",
      notifyClient: !!req.body.notifyClient,
      createdAt: new Date()
    };
    expenses.push(expense);
    project.expenses = expenses;
    project.markModified("expenses");
    applyProjectFinance(project);
    await project.save();
    res.status(201).json({ msg: "Expense added", expense, project });
  } catch (err) {
    console.error("POST project expense error:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;