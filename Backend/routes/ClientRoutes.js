const express = require("express");
const router = express.Router();
const Client = require("../models/ClientModel");
const { addClient } = require("../controllers/ClientController");

// GET all clients
router.get("/", async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// POST add client
router.post("/add", addClient);

// PUT update client
router.put("/:id", async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { returnDocument: "after" }
    );
    if (!client) return res.status(404).json({ msg: "Client not found" });
    res.json({ client });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE client
router.delete("/:id", async (req, res) => {
  try {
    await Client.findByIdAndDelete(req.params.id);
    res.json({ msg: "Client deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
