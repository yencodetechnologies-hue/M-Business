const express = require("express");
const router = express.Router();
const Client = require("../models/ClientModel");
const DeletedClient = require("../models/DeletedClientModel");
const { addClient } = require("../controllers/ClientController");
const Project = require("../models/ProjectModel");
const Feedback = require("../models/FeedbackModel");
const Invoice = require("../models/InvoiceModels");
const Task = require("../models/TaskModels");
const Quotation = require("../models/QuotationModel");
const Proposal = require("../models/ProposalModel");
const Document = require("../models/DocumentModel");
router.get("/projects/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const projects = await Project.find({
      $or: [
        { assignedTo: { $regex: new RegExp(name, "i") } },
        { manager: { $regex: new RegExp(name, "i") } }
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
    const client = await Client.findById(req.params.id);
    if (client) {
      const clientName = client.clientName || client.name || "";
      const clientEmail = client.email ? client.email.toLowerCase().trim() : "";
      const companyId = client.companyId || "";

      // 1. Delete all projects linked to this client (by name or companyId)
      const clientProjects = await Project.find({
        $or: [
          { client: { $regex: new RegExp(`^\\s*${clientName}\\s*$`, "i") } },
          { clientId: client._id.toString() }
        ]
      });
      const projectIds = clientProjects.map(p => p._id.toString());

      if (projectIds.length > 0) {
        // Delete tasks linked to those projects
        await Task.deleteMany({ projectId: { $in: projectIds } });
      }

      // 2. Delete projects themselves
      await Project.deleteMany({
        $or: [
          { client: { $regex: new RegExp(`^\\s*${clientName}\\s*$`, "i") } },
          { clientId: client._id.toString() }
        ]
      });

      // 3. Delete invoices linked to this client
      await Invoice.deleteMany({
        $or: [
          { client: { $regex: new RegExp(`^\\s*${clientName}\\s*$`, "i") } },
          { clientId: client._id.toString() },
          { clientEmail: clientEmail }
        ]
      });

      // 4. Delete quotations linked to this client
      try {
        await Quotation.deleteMany({
          $or: [
            { client: { $regex: new RegExp(`^\\s*${clientName}\\s*$`, "i") } },
            { clientId: client._id.toString() }
          ]
        });
      } catch (e) { console.log("Quotation delete skipped:", e.message); }

      // 5. Delete proposals linked to this client
      try {
        await Proposal.deleteMany({
          $or: [
            { client: { $regex: new RegExp(`^\\s*${clientName}\\s*$`, "i") } },
            { clientId: client._id.toString() }
          ]
        });
      } catch (e) { console.log("Proposal delete skipped:", e.message); }

      // 6. Delete documents linked to this client
      try {
        await Document.deleteMany({ clientId: client._id.toString() });
      } catch (e) { console.log("Document delete skipped:", e.message); }

      // 7. Delete feedback linked to this client
      try {
        await Feedback.deleteMany({ clientName: { $regex: new RegExp(`^\\s*${clientName}\\s*$`, "i") } });
      } catch (e) { console.log("Feedback delete skipped:", e.message); }

      // 8. Remove from DeletedClient blacklist so same email CAN be re-registered fresh
      await DeletedClient.deleteOne({ email: clientEmail });

      // 9. Finally delete the client record itself
      await client.deleteOne();
    }
    res.json({ msg: "Client and all associated data deleted successfully" });
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