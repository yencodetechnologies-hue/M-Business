const express = require("express");
const router  = express.Router();
const Income = require("../models/IncomeModel");

// GET all income
router.get("/", async (req, res) => {
  try {
    const filter = req.companyId ? { companyId: req.companyId } : {};
    const income = await Income.find(filter).sort({ createdAt: -1 });
    res.json(income);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// POST create income
router.post("/", async (req, res) => {
  try {
    const income = new Income({ ...req.body, companyId: req.companyId || "" });
    await income.save();
    res.status(201).json(income);
  } catch (err) {
    res.status(400).json({ msg: "Failed to create income", error: err.message });
  }
});

// PUT update income
router.put("/:id", async (req, res) => {
  try {
    const income = await Income.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after", runValidators: true }
    );
    if (!income) return res.status(404).json({ msg: "Income not found" });
    res.json(income);
  } catch (err) {
    res.status(400).json({ msg: "Failed to update income", error: err.message });
  }
});

// DELETE income
router.delete("/:id", async (req, res) => {
  try {
    await Income.findByIdAndDelete(req.params.id);
    res.json({ msg: "Income deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to delete income", error: err.message });
  }
});

module.exports = router;
