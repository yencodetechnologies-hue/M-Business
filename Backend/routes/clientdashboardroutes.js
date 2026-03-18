const express = require("express");
const router = express.Router();
const Client = require("../models/ClientModel");
const Project = require("../models/ProjectModel");

router.get("/profile/:email", async (req, res) => {
  try {
    const client = await Client.findOne({ email: req.params.email });
    if (!client) return res.status(404).json({ msg: "Client not found" });
    res.json(client);
  } catch(e) {
    res.status(500).json({ msg: e.message });
  }
});

router.get("/projects/:clientName", async (req, res) => {
  try {
    const projects = await Project.find({ 
      client: req.params.clientName 
    }).sort({ createdAt: -1 });
    res.json(projects);
  } catch(e) {
    res.status(500).json({ msg: e.message });
  }
});

module.exports = router;