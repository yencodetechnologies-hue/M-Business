const express = require("express");
const router = express.Router();
const Proposal = require("../models/ProposalModel");

// ── Static / specific GET routes (must be before /:dbId) ─────────────────────

// GET all proposals
router.get("/", async (req, res) => {
  try {
    const companyId = req.companyId || "NONE";
    const list = await Proposal.find({ companyId }).sort({ updatedAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// GET proposals for a specific client
// GET proposals for a specific client
router.get("/client/:name", async (req, res) => {
  try {
    const companyId = req.headers['x-company-id'] || req.companyId || "";
    const name = decodeURIComponent(req.params.name).trim();
    const companyName = req.query.company ? decodeURIComponent(req.query.company).trim() : "";
    const clientId = req.query.clientId ? String(req.query.clientId).trim() : "";

    let filter;

    if (clientId) {
      // Strict, unambiguous match — only proposals explicitly sent to THIS client account.
      filter = { clientId };
    } else {
      // Legacy fallback (older proposals saved before clientId existed) — exact name match only,
      // no partial/substring matching, so similarly-named clients can't see each other's proposals.
      const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const safeName = escapeRegExp(name);
      const safeCompany = escapeRegExp(companyName);

      const conditions = [];
      if (safeName) {
        conditions.push({ client: { $regex: new RegExp(`^${safeName}$`, "i") } });
        conditions.push({ clientName: { $regex: new RegExp(`^${safeName}$`, "i") } });
      }
      if (safeCompany) {
        conditions.push({ client: { $regex: new RegExp(`^${safeCompany}$`, "i") } });
        conditions.push({ clientName: { $regex: new RegExp(`^${safeCompany}$`, "i") } });
      }
      filter = conditions.length > 0 ? { $or: conditions } : { _id: null };
    }

    // Only return proposals that are visible to the client
    filter = {
      $and: [
        filter,
        { status: { $in: ["sent", "pending", "approved", "rejected"] } }
      ]
    };

    if (companyId) {
      filter = {
        $and: [
          filter,
          { $or: [{ companyId: companyId }, { companyId: "" }, { companyId: { $exists: false } }] }
        ]
      };
    }
    const list = await Proposal.find(filter).sort({ updatedAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// GET proposals for a specific employee
router.get("/employee/:name", async (req, res) => {
  try {
    const companyId = req.companyId || "NONE";
    const name = decodeURIComponent(req.params.name).trim();
    const list = await Proposal.find({
      assignedEmployee: { $regex: new RegExp(`^\\s*${name}\\s*$`, "i") },
      companyId
    }).sort({ updatedAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// POST new proposal
router.post("/", async (req, res) => {
  try {
    const companyId = req.companyId || "";
    const newDoc = new Proposal({ ...req.body, companyId });
    const saved = await newDoc.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ msg: "Error saving proposal", error: err.message });
  }
});

// ── Specific PUT sub-routes BEFORE generic /:dbId ────────────────────────────

// PUT /:dbId/approve  (client approves)
router.put("/:dbId/approve", async (req, res) => {
  try {
    const saved = await Proposal.findByIdAndUpdate(
      req.params.dbId,
      { $set: { status: "approved" } },
      { new: true, runValidators: true }
    );
    if (!saved) return res.status(404).json({ msg: "Proposal not found" });
    res.json(saved);
  } catch (err) {
    console.error("Approve error:", err.message);
    res.status(500).json({ msg: "Error approving proposal", error: err.message });
  }
});

// PUT /:dbId/reject  (client rejects)
router.put("/:dbId/reject", async (req, res) => {
  try {
    const rejectNote = (req.body && req.body.rejectNote) ? req.body.rejectNote : "";
    const saved = await Proposal.findByIdAndUpdate(
      req.params.dbId,
      { $set: { status: "rejected", rejectNote } },
      { new: true, runValidators: true }
    );
    if (!saved) return res.status(404).json({ msg: "Proposal not found" });
    res.json(saved);
  } catch (err) {
    console.error("Reject error:", err.message);
    res.status(500).json({ msg: "Error rejecting proposal", error: err.message });
  }
});

// PUT /:dbId/submit  (subadmin resubmits a rejected proposal → sets back to pending)
router.put("/:dbId/submit", async (req, res) => {
  try {
    const companyId = req.companyId || "";
    const query = { _id: req.params.dbId };
    if (companyId && companyId !== "NONE") query.companyId = companyId;
    const saved = await Proposal.findOneAndUpdate(
      query,
      { $set: { status: "pending", submittedAt: new Date() } },
      { new: true }
    );
    if (!saved) return res.status(404).json({ msg: "Proposal not found or unauthorized" });
    res.json(saved);
  } catch (err) {
    console.error("Submit error:", err.message);
    res.status(500).json({ msg: "Error submitting proposal", error: err.message });
  }
});

// PATCH /:dbId/status  (generic status update)
router.patch("/:dbId/status", async (req, res) => {
  try {
    const { status, rejectNote } = req.body;
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }
    const update = { status, updatedAt: new Date() };
    if (rejectNote) update.rejectNote = rejectNote;
    const saved = await Proposal.findByIdAndUpdate(
      req.params.dbId,
      { $set: update },
      { new: true }
    );
    if (!saved) return res.status(404).json({ msg: "Proposal not found" });
    res.json(saved);
  } catch (err) {
    res.status(500).json({ msg: "Error updating proposal status", error: err.message });
  }
});

// ── Generic single-document routes (MUST come after specific sub-routes) ──────

// GET single proposal by ID
router.get("/:dbId", async (req, res) => {
  try {
    const companyId = req.companyId || "NONE";
    const proposal = await Proposal.findOne({ _id: req.params.dbId, companyId });
    if (!proposal) return res.status(404).json({ msg: "Proposal not found" });
    res.json(proposal);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// PUT update proposal (full edit — resets to pending if currently approved/rejected)
router.put("/:dbId", async (req, res) => {
  try {
    const companyId = req.companyId || "NONE";

    const existing = await Proposal.findOne({ _id: req.params.dbId, companyId });
    if (!existing) return res.status(404).json({ msg: "Proposal not found or unauthorized" });

    const updateData = { ...req.body };
    // Only reset to pending if approved/rejected AND the incoming status is not explicitly set to sent/approved/rejected
    const protectedStatuses = ["sent", "approved", "rejected", "won", "lost"];
    if (
      (existing.status === "approved" || existing.status === "rejected") &&
      !protectedStatuses.includes(updateData.status)
    ) {
      updateData.status = "pending";
    }

    const saved = await Proposal.findOneAndUpdate(
      { _id: req.params.dbId, companyId },
      { $set: updateData },
      { new: true }
    );
    res.json(saved);
  } catch (err) {
    res.status(500).json({ msg: "Error updating proposal", error: err.message });
  }
});

// DELETE proposal
router.delete("/:dbId", async (req, res) => {
  try {
    const companyId = req.companyId || "NONE";
    const doc = await Proposal.findOneAndDelete({ _id: req.params.dbId, companyId });
    if (!doc) return res.status(404).json({ msg: "Proposal not found or unauthorized" });
    res.json({ msg: "Proposal deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting proposal", error: err.message });
  }
});

// Client signature save
// CORRECT
router.put('/:id/client-sign', async (req, res) => {
  try {
    const { clientSignature, clientName, sigMode } = req.body;
    const proposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      {
        clientSignature,
        clientName,
        clientSignedAt: new Date(),
        sigMode: sigMode || "draw",
        status: "approved",
      },
      { new: true }
    );
    if (!proposal) return res.status(404).json({ error: "Proposal not found" });
    res.json(proposal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
