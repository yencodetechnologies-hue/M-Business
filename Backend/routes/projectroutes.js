const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Project = require("../models/ProjectModel");

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

// GET projects by client name
router.get("/client/:clientName", async (req, res) => {
  try {
    const companyId = req.companyId || "";
    const name = decodeURIComponent(req.params.clientName).trim();
    const companyName = req.query.company ? decodeURIComponent(req.query.company).trim() : "";
    
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safeName = escapeRegExp(name);
    const safeCompany = escapeRegExp(companyName);

    const conditions = [];
    if (safeName) conditions.push({ client: { $regex: new RegExp(`^\\s*${safeName}\\s*$`, "i") } });
    if (safeCompany) conditions.push({ client: { $regex: new RegExp(`^\\s*${safeCompany}\\s*$`, "i") } });
    
    const filter = conditions.length > 0 ? { $or: conditions } : {};
    
    const projects = await Project.find(filter).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error("GET by-client error:", err.message);
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
      name, client, purpose, description,
      start, end, deadline, budget, team,
      status, progress, tasks, completedTasks,
      assignedTo, manager,
    } = req.body;

    if (!name) return res.status(400).json({ msg: "Project name required" });
    if (!client) return res.status(400).json({ msg: "Client required" });

    console.log("Creating new Project instance...");
    const project = new Project({
      name,
      client,
      purpose: purpose || "",
      description: description || "",
      start: start || "",
      end: end || "",
      deadline: deadline || end || "",
      budget: budget || "",
      team: team || "",
      status: status || "Pending",
      progress: Number(progress) || 0,
      tasks: Number(tasks) || 0,
      completedTasks: Number(completedTasks) || 0,
      assignedTo: Array.isArray(assignedTo) ? assignedTo : [],
      manager: manager || "",
      companyId: req.companyId || "",
    });

    console.log("Attempting to save project...");
    const saved = await project.save();
    
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
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error("Database not connected! ReadyState:", mongoose.connection.readyState);
      return res.status(500).json({
        msg: "Database not connected",
        error: "Server is not connected to the database"
      });
    }

    // assignedTo array-ஆ வந்தா சரியா save ஆகணும்
    const updateData = { ...req.body };
    if (updateData.assignedTo && !Array.isArray(updateData.assignedTo)) {
      updateData.assignedTo = [updateData.assignedTo];
    }

    const companyId = req.companyId || "NONE";
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, companyId },
      { $set: updateData },
      { new: true }
    );
    if (!project) return res.status(404).json({ msg: "Project not found or unauthorized" });

    // Auto-update Project Status tracking entry
    try {
      const ProjectStatus = mongoose.models.ProjectStatus;
      if (ProjectStatus) {
        await ProjectStatus.findOneAndUpdate(
          { name: project.name, companyId: project.companyId },
          { $set: { 
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
    const companyId = req.companyId || "NONE";
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

    res.json({ msg: "Project deleted" });
  } catch (err) {
    console.error("DELETE project error:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;