const express = require("express");
const router = express.Router();
const AuditNote = require("../models/AuditNoteModel");

// GET all audit notes
router.get("/", async (req, res) => {
  try {
    const filter = req.companyId ? { companyId: req.companyId } : {};
    const notes = await AuditNote.find(filter).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// POST create audit note
router.post("/", async (req, res) => {
  try {
    const note = new AuditNote({ ...req.body, companyId: req.companyId || "" });
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    res.status(400).json({ msg: "Failed to create audit note", error: err.message });
  }
});

// PUT update audit note
router.put("/:id", async (req, res) => {
  try {
    const note = await AuditNote.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after", runValidators: true }
    );
    if (!note) return res.status(404).json({ msg: "Audit note not found" });
    res.json(note);
  } catch (err) {
    res.status(400).json({ msg: "Failed to update audit note", error: err.message });
  }
});

// DELETE audit note
router.delete("/:id", async (req, res) => {
  try {
    await AuditNote.findByIdAndDelete(req.params.id);
    res.json({ msg: "Audit note deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to delete audit note", error: err.message });
  }
});

module.exports = router;
