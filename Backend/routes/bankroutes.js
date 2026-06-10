const express = require("express");
const router = express.Router();
const Bank = require("../models/BankModel");

// GET all banks
router.get("/", async (req, res) => {
  try {
    const filter = req.companyId ? { companyId: req.companyId } : {};
    const banks = await Bank.find(filter).sort({ createdAt: -1 });
    res.json(banks);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// POST create bank
router.post("/", async (req, res) => {
  try {
    const bank = new Bank({ ...req.body, companyId: req.companyId || "" });
    await bank.save();
    res.status(201).json(bank);
  } catch (err) {
    res.status(400).json({ msg: "Failed to create bank", error: err.message });
  }
});

// PUT update bank
router.put("/:id", async (req, res) => {
  try {
    const bank = await Bank.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after", runValidators: true }
    );
    if (!bank) return res.status(404).json({ msg: "Bank not found" });
    res.json(bank);
  } catch (err) {
    res.status(400).json({ msg: "Failed to update bank", error: err.message });
  }
});

// DELETE bank
router.delete("/:id", async (req, res) => {
  try {
    await Bank.findByIdAndDelete(req.params.id);
    res.json({ msg: "Bank deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to delete bank", error: err.message });
  }
});

module.exports = router;
