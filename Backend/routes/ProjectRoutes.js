const express = require("express");
const router = express.Router();
const Project = require("../models/ProjectModel"); // ✅ சரியான path

router.get("/", async (req, res) => {
  try {
    res.json(await Project.find().sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/add", async (req, res) => {
  try {
    const { name, client, purpose, description, start, end, budget, team, status } = req.body;
    if (!name || !client) return res.status(400).json({ msg: "Name and Client required" });
    const project = new Project({
      name, client, purpose, description, start, end, budget, team,
      status: status || "Pending" // ✅ empty fix
    });
    await project.save();
    res.status(201).json({ msg: "Project saved", project });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;