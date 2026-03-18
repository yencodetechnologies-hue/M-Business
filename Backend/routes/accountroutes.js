// routes/accounts.js
const express = require("express");
const router = express.Router();
const Account = require("../models/AccountModels");

// GET all accounts
router.get("/", async (req, res) => {
  try {
    const accounts = await Account.find().sort({ createdAt: -1 });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// POST create account
router.post("/", async (req, res) => {
  try {
    const existing = await Account.findOne({ email: req.body.email });
    if (existing) return res.status(400).json({ msg: "Email already exists" });
    const account = new Account(req.body);
    await account.save();
    res.status(201).json(account);
  } catch (err) {
    res.status(400).json({ msg: "Failed to create account", error: err.message });
  }
});

// PUT update account
router.put("/:id", async (req, res) => {
  try {
    const account = await Account.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!account) return res.status(404).json({ msg: "Account not found" });
    res.json(account);
  } catch (err) {
    res.status(400).json({ msg: "Failed to update account", error: err.message });
  }
});

// DELETE account
router.delete("/:id", async (req, res) => {
  try {
    await Account.findByIdAndDelete(req.params.id);
    res.json({ msg: "Account deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to delete account", error: err.message });
  }
});

module.exports = router;
