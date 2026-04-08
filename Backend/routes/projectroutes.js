const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Project = require("../models/ProjectModel");

// GET all projects
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error("GET projects error:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// GET projects by client name
router.get("/by-client/:clientName", async (req, res) => {
  try {
    const projects = await Project.find({
      client: req.params.clientName
    }).sort({ createdAt: -1 });
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
    });

    console.log("Attempting to save project...");
    const saved = await project.save();
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

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    if (!project) return res.status(404).json({ msg: "Project not found" });
    res.json({ project });
  } catch (err) {
    console.error("PUT project error:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// DELETE project
router.delete("/:id", async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ msg: "Project deleted" });
  } catch (err) {
    console.error("DELETE project error:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;