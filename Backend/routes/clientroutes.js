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

    if (updateData.password && updateData.password.trim() !== "") {
      // Only hash if a new password was actually provided
      const bcrypt = require("bcryptjs");
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      // No password change — remove it from update entirely so existing hash is preserved
      delete updateData.password;
    }

    // Use updateOne instead of findByIdAndUpdate to avoid fetching the full doc
    const result = await Client.updateOne(
      { _id: req.params.id },
      { $set: updateData }
    );
    if (result.matchedCount === 0) return res.status(404).json({ msg: "Client not found" });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (client) {
      const clientName = (client.clientName || client.name || "").trim();
      const companyName = (client.companyName || client.company || "").trim();
      const clientEmail = (client.email || "").toLowerCase().trim();
      const companyId = client.companyId || "";

      const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const nameRegex = clientName ? new RegExp(`^\\s*${escapeRegExp(clientName)}\\s*$`, "i") : null;
      const companyRegex = companyName ? new RegExp(`^\\s*${escapeRegExp(companyName)}\\s*$`, "i") : null;

      const nameConditions = [];
      if (nameRegex) nameConditions.push({ client: { $regex: nameRegex } });
      if (companyRegex) nameConditions.push({ client: { $regex: companyRegex } });
      const nameFilter = nameConditions.length > 0
        ? { companyId, $or: nameConditions }
        : { companyId, client: clientName };

      // 1. Find projects then delete their tasks
      const clientProjects = await Project.find(nameFilter).select("_id").lean();
      const projectIds = clientProjects.map(p => p._id);
      if (projectIds.length > 0) {
        await Task.deleteMany({ projectId: { $in: projectIds } });
      }

      // 2. Delete projects
      await Project.deleteMany(nameFilter);

      // 3. Delete invoices
      const invoiceNameConditions = [];
      if (nameRegex) invoiceNameConditions.push({ client: { $regex: nameRegex } });
      if (companyRegex) invoiceNameConditions.push({ client: { $regex: companyRegex } });
      if (clientEmail) invoiceNameConditions.push({ clientEmail });
      if (invoiceNameConditions.length > 0) {
        await Invoice.deleteMany({ companyId, $or: invoiceNameConditions });
      }

      // 4. Delete quotations
      try {
        if (nameConditions.length > 0) {
          await Quotation.deleteMany({ companyId, $or: nameConditions });
        }
      } catch (e) { console.log("Quotation delete skipped:", e.message); }

      // 5. Delete proposals
      try {
        const propConditions = [];
        if (nameRegex) propConditions.push({ client: { $regex: nameRegex } }, { clientName: { $regex: nameRegex } });
        if (companyRegex) propConditions.push({ client: { $regex: companyRegex } }, { clientName: { $regex: companyRegex } });
        if (propConditions.length > 0) {
          await Proposal.deleteMany({ $or: propConditions });
        }
      } catch (e) { console.log("Proposal delete skipped:", e.message); }

      // 6. Delete documents
      try {
        const docConditions = [];
        if (nameRegex) docConditions.push({ client: { $regex: nameRegex } });
        if (companyRegex) docConditions.push({ client: { $regex: companyRegex } });
        if (docConditions.length > 0) {
          await Document.deleteMany({ $or: docConditions });
        }
      } catch (e) { console.log("Document delete skipped:", e.message); }

      // 7. Delete feedback
      try {
        if (nameRegex) await Feedback.deleteMany({ clientName: { $regex: nameRegex } });
      } catch (e) { console.log("Feedback delete skipped:", e.message); }

      // 8. Remove from blacklist so same email can re-register fresh
      await DeletedClient.deleteOne({ email: clientEmail });

      // 9. Delete the client record
      await client.deleteOne();

      console.log(`✅ Client "${clientName}" and all associated data deleted.`);
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
