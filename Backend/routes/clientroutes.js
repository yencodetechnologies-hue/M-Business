const express = require("express");
const router = express.Router();
const Client = require("../models/ClientModel");
const DeletedClient = require("../models/DeletedClientModel");
const { addClient } = require("../controllers/ClientController");
const Project = require("../models/ProjectModel");
const Feedback = require("../models/FeedbackModel");
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
    const companyId = req.companyId || "NONE";
    const name = decodeURIComponent(req.params.clientName).trim();
    const projects = await Project.find({
      client: { $regex: new RegExp(`^\\s*${name}\\s*$`, "i") },
      companyId
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

const { checkResourceLimit } = require("../middleware/subscriptionMiddleware");
router.post("/add", checkResourceLimit('client'), addClient);

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
    // Fetch client before deleting so we can blacklist their credentials
    const client = await Client.findById(req.params.id);
    if (client) {
      // Add to permanent blacklist (upsert to avoid duplicate-key errors)
      await DeletedClient.findOneAndUpdate(
        { email: client.email.toLowerCase().trim() },
        {
          email: client.email.toLowerCase().trim(),
          clientName: client.clientName || "",
          companyId: client.companyId || "",
          deletedAt: new Date()
        },
        { upsert: true, new: true }
      );
      await client.deleteOne();
    }
    res.json({ msg: "Client deleted" });
  } catch (err) {
    console.error("Delete client error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/feedback", async (req, res) => {
  try {
    const { clientName, rating, message } = req.body;
    const fb = new Feedback({ clientName, rating, message, companyId: req.companyId || "" });
    await fb.save();
    res.json({ message: "Feedback saved" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});
module.exports = router;