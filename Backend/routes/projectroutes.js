const express = require("express");
const router  = express.Router();
const Project = require("../models/ProjectModel");

// GET all
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});
// GET projects by client name  ← add this
router.get("/by-client/:clientName", async (req, res) => {
  try {
    const projects = await Project.find({
      client: req.params.clientName
    }).sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// POST add
router.post("/add", async (req, res) => {
  try {
    const {
      name, client, purpose, description,
      start, end, deadline, budget, team,
      status, progress, tasks, completedTasks,
      assignedTo, manager,
    } = req.body;

    if (!name)   return res.status(400).json({ msg: "Project name required" });
    if (!client) return res.status(400).json({ msg: "Client required" });

    const project = new Project({
      name,
      client,
      purpose:        purpose        || "",
      description:    description    || "",
      start:          start          || "",
      end:            end            || "",
      deadline:       deadline       || end || "",
      budget:         budget         || "",
      team:           team           || "",
      status:         status         || "Pending",
      progress:       Number(progress)       || 0,
      tasks:          Number(tasks)          || 0,
      completedTasks: Number(completedTasks) || 0,
      assignedTo:     assignedTo     || "",
      manager:        manager        || "",
    });

    await project.save();
    res.status(201).json({ msg: "Project created", project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// PUT update  ← { new: true } → { returnDocument: "after" } fix
router.put("/:id", async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { returnDocument: "after" }
    );
    if (!project) return res.status(404).json({ msg: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE project
router.delete("/:id", async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ msg: "Project deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
