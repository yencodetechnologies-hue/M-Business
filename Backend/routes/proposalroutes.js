const express = require("express");
const router = express.Router();
const Proposal = require("../models/ProposalModel");

// GET all proposals (for admin list)
router.get("/", async (req, res) => {
  try {
    const list = await Proposal.find().sort({ updatedAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// GET proposals for a specific client
router.get("/client/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const list = await Proposal.find({ 
      client: { $regex: new RegExp(`^${name}$`, "i") } 
    }).sort({ updatedAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// POST new proposal
router.post("/", async (req, res) => {
  try {
    const newDoc = new Proposal(req.body);
    const saved = await newDoc.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ msg: "Error saving proposal", error: err.message });
  }
});

// PUT update proposal
router.put("/:dbId", async (req, res) => {
  try {
    const saved = await Proposal.findByIdAndUpdate(
      req.params.dbId,
      { $set: req.body },
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
    await Proposal.findByIdAndDelete(req.params.dbId);
    res.json({ msg: "Proposal deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting proposal", error: err.message });
  }
});

module.exports = router;
