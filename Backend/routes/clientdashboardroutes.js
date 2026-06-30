const express = require("express");
const router = express.Router();
const Client = require("../models/ClientModel");

router.get("/profile/:email", async (req, res) => {
  try {
    const client = await Client.findOne({ email: req.params.email });
    if (!client) return res.status(404).json({ msg: "Client not found" });
    res.json(client);
  } catch (e) {
    res.status(500).json({ msg: e.message });
  }
});

module.exports = router;