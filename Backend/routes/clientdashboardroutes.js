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
// GET tasks by client name (via project name match)
router.get("/:clientName", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.clientName);
    // Task model-ல client field இருந்தா இப்படி:
    const tasks = await Task.find({ 
      assignedTo: { $regex: new RegExp(name, "i") }
    }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});
module.exports = router;