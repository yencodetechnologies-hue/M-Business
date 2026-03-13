const express = require("express");
const router = express.Router();
const Client = require("../models/ClientModel");

// GET all clients
router.get("/", async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// ClientRoutes.js - POST /add
router.post("/add", async (req, res) => {
  try {
    const { clientName, companyName, email, phone, 
            address, projectAssigned, status, password } = req.body; // ✅ password add

    if (!clientName || !email) {
      return res.status(400).json({ msg: "Name and Email are required" });
    }

    const client = new Client({
      clientName, companyName, email, phone,
      address, projectAssigned, password, // ✅ password save
      status: status || "Active"
    });

    await client.save();
    res.status(201).json({ message: "Client saved", client });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ msg: "Email already exists" }); // ✅ duplicate check
    }
    res.status(500).json({ msg: "Server error" });
  }
});
module.exports = router;