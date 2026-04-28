const express = require("express");
const router = express.Router();
const Client = require("../models/ClientModel");
const { addClient } = require("../controllers/ClientController");
const Project = require("../models/ProjectModel");

router.get("/projects/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const projects = await Project.find({
      $or: [
        { assignedTo: { $regex: new RegExp(name, "i") } },
        { manager:    { $regex: new RegExp(name, "i") } }
      ]
    }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

router.get("/my-projects/:clientName", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.clientName);
    const projects = await Project.find({
      client: { $regex: new RegExp(`^${name}$`, "i") }
    }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const filter = req.companyId ? { companyId: req.companyId } : {};
    const clients = await Client.find(filter).sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/add", addClient);

router.put("/:id", async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Hash password if provided
    if (updateData.password && updateData.password.trim() !== "") {
      const bcrypt = require("bcryptjs");
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      // Don't update password if it's empty or blank
      delete updateData.password;
    }

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { returnDocument: "after" }
    );
    if (!client) return res.status(404).json({ msg: "Client not found" });
    res.json({ client });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Client.findByIdAndDelete(req.params.id);
    res.json({ msg: "Client deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;