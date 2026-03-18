const express = require("express");
const router = express.Router();
const Client = require("../models/ClientModel");
const bcrypt = require("bcryptjs");
const { addClient } = require("../controllers/ClientController");

router.get("/", async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/add", addClient);

module.exports = router;