const Client = require("../models/ClientModel");

// Add Client
exports.addClient = async (req, res) => {
  try {

    const {
      clientName,
      companyName,
      email,
      phone,
      projectAssigned,
      status,
      address
    } = req.body;

    const newClient = new Client({
      clientName,
      companyName,
      email,
      phone,
      projectAssigned,
      status,
      address
    });

    await newClient.save();

    res.status(201).json({
      message: "Client Added Successfully",
      client: newClient
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};