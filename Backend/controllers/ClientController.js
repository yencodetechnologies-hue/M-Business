const Client = require("../models/ClientModel");
const bcrypt = require("bcryptjs");

exports.addClient = async (req, res) => {
  try {
    const {
      clientName,
      companyName,
      email,
      phone,
      projectAssigned,
      status,
      address,
      password,  
    } = req.body;

    if (!clientName || !email) {
      return res.status(400).json({ message: "Name and Email are required" });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : "";

    const newClient = new Client({
      clientName,
      companyName,
      email,
      phone,
      projectAssigned,
      status: status || "Active",
      address,
      password: hashedPassword,  
      role: "client",           
    });

    await newClient.save();

    res.status(201).json({
      message: "Client Added Successfully",
      client: newClient,
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};