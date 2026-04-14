const express = require("express");
const router = express.Router();
const Proposal = require("../models/ProposalModel");

// GET all proposals (for admin list)
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
router.get("/client/:name", async (req, res) => {
  try {
    const companyId = req.companyId || "NONE";
    const name = decodeURIComponent(req.params.name).trim();
    const list = await Proposal.find({ 
      client: { $regex: new RegExp(`^\\s*${name}\\s*$`, "i") },
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

// PUT update proposal
router.put("/:dbId", async (req, res) => {
  try {
    const companyId = req.companyId || "NONE";
    const saved = await Proposal.findOneAndUpdate(
      { _id: req.params.dbId, companyId },
      { $set: req.body },
      { new: true }
    );
    if (!saved) return res.status(404).json({ msg: "Proposal not found or unauthorized" });
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

// PUT approve proposal
router.put("/:dbId/approve", async (req, res) => {
  try {
    const companyId = req.companyId || "NONE";
    const saved = await Proposal.findOneAndUpdate(
      { _id: req.params.dbId, companyId },
      { 
        $set: { 
          status: "approved",
          updatedAt: new Date()
        }
      },
      { new: true }
    );
    if (!saved) return res.status(404).json({ msg: "Proposal not found or unauthorized" });
    res.json(saved);
  } catch (err) {
    res.status(500).json({ msg: "Error approving proposal", error: err.message });
  }
});

// PUT reject proposal
router.put("/:dbId/reject", async (req, res) => {
  try {
    const { rejectNote } = req.body;
    const companyId = req.companyId || "NONE";
    const saved = await Proposal.findOneAndUpdate(
      { _id: req.params.dbId, companyId },
      { 
        $set: { 
          status: "rejected",
          rejectNote: rejectNote || "",
          updatedAt: new Date()
        }
      },
      { new: true }
    );
    if (!saved) return res.status(404).json({ msg: "Proposal not found or unauthorized" });
    res.json(saved);
  } catch (err) {
    res.status(500).json({ msg: "Error rejecting proposal", error: err.message });
  }
});

// PUT submit for approval
router.put("/:dbId/submit", async (req, res) => {
  try {
    const companyId = req.companyId || "NONE";
    const saved = await Proposal.findOneAndUpdate(
      { _id: req.params.dbId, companyId },
      { 
        $set: { 
          status: "pending",
          submittedAt: new Date(),
          updatedAt: new Date()
        }
      },
      { new: true }
    );
    if (!saved) return res.status(404).json({ msg: "Proposal not found or unauthorized" });
    res.json(saved);
  } catch (err) {
    res.status(500).json({ msg: "Error submitting proposal", error: err.message });
  }
});

module.exports = router;
