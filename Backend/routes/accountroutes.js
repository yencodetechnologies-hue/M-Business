// routes/expenses.js
const express = require("express");
const router  = express.Router();
const Expense = require("../models/AccountModels");

// GET all expenses
router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// POST create expense
router.post("/", async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ msg: "Failed to create expense", error: err.message });
  }
});

// PUT update expense
router.put("/:id", async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ msg: "Expense not found" });
    res.json(expense);
  } catch (err) {
    res.status(400).json({ msg: "Failed to update expense", error: err.message });
  }
});

// DELETE expense
router.delete("/:id", async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ msg: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to delete expense", error: err.message });
  }
});

module.exports = router;
