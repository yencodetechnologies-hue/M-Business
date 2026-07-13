const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
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
const verifyClientPortal = require("../middleware/verifyClientPortal");
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

// Issue a signed, non-forgeable portal token for a specific client.
router.post("/:clientId/portal-token", async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId);
    if (!client) return res.status(404).json({ msg: "Client not found" });

    const token = jwt.sign(
      {
        clientId: client._id.toString(),
        email: client.email,
        name: client.clientName || client.name,
        companyName: client.companyName || client.company || "",
        companyId: req.body.companyId || client.companyId || "",
        agencyName: req.body.agencyName || "",
        projectId: req.body.projectId || "",
        role: "client",
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "24h" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/my-projects", verifyClientPortal, async (req, res) => {
  try {
    const companyId = req.portalClient.companyId || "NONE";
    const name = req.portalClient.name.trim();
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
    const clients = await Client.find(filter).sort({ createdAt: -1 }).lean();
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

    // Fetch the existing client BEFORE updating so we know the old name/company
    // text that legacy Project.client (text-based) links may still be using.
    const existingClient = await Client.findById(req.params.id).lean();
    if (!existingClient) return res.status(404).json({ msg: "Client not found" });

    const result = await Client.updateOne(
      { _id: req.params.id },
      { $set: updateData }
    );
    if (result.matchedCount === 0) return res.status(404).json({ msg: "Client not found" });

    // ── Keep this client's projects linked even though their display name/company changed ──
    // Find any project still tied to this client by the OLD name text (and not yet
    // carrying a clientId), then attach clientId and refresh the display name so the
    // link survives future edits, instead of relying on fragile text matching.
    try {
      const oldName = (existingClient.clientName || existingClient.name || "").trim();
      const oldCompany = (existingClient.companyName || existingClient.company || "").trim();
      const newName = (updateData.clientName || oldName || "").trim();

      const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const orMatchers = [];
      if (oldName) orMatchers.push({ client: { $regex: new RegExp(`^\\s*${escapeRegExp(oldName)}\\s*$`, "i") } });
      if (oldCompany) orMatchers.push({ client: { $regex: new RegExp(`^\\s*${escapeRegExp(oldCompany)}\\s*$`, "i") } });
      orMatchers.push({ clientId: existingClient._id });

      if (orMatchers.length > 0) {
        await Project.updateMany(
          { companyId: existingClient.companyId || "", $or: orMatchers },
          { $set: { clientId: existingClient._id, client: newName } }
        );
      }
    } catch (cascadeErr) {
      // Non-fatal — the client update itself already succeeded.
      console.error("Project cascade-link after client edit failed:", cascadeErr.message);
    }

    const updatedClient = await Client.findById(req.params.id);
    res.json({ success: true, client: updatedClient });
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

router.get("/feedback", async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ companyId: req.companyId || "" }).sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const client = await client.findbyid(req.params.id);
    if (!client) return res.status(404).json({ msg: "client not found" });
    res.json(client);
  } catch (err) {
    console.error("get client by id error:", err);
    res.status(500).json({ msg: "server error" });
  }
});

module.exports = router;
