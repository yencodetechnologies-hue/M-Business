const Client = require("../models/ClientModel");
const bcrypt = require("bcryptjs");
const { sendQuickEmail } = require("../config/email");

exports.addClient = async (req, res) => {
  try {
    const {
      clientName,
      companyName,
      email,
      phone,
      contactPersonName,
      contactPersonNo,
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
      contactPersonName,
      contactPersonNo,
      status: status || "Active",
      address,
      password: hashedPassword,  
      role: "client",           
      companyId: req.companyId || "",
    });

    await newClient.save();

    // Send welcome email
    const welcomeMessage = `
      <h3>Welcome to M Business, ${clientName}!</h3>
      <p>Your account has been successfully created.</p>
      <p><strong>Company:</strong> ${companyName || 'N/A'}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Status:</strong> ${status || 'Active'}</p>
      <p>You can now access your dashboard and start using our services.</p>
    `;
    
    await sendQuickEmail(email, "Welcome to M Business - Account Created Successfully", welcomeMessage);

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