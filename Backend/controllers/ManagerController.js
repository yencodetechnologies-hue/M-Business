const Manager = require("../models/ManagerModel");
const { sendQuickEmail } = require("../config/email");

exports.addManager = async (req, res) => {
  try {

    const {
      managerName,
      email,
      phone,
      department,
      role,
      address,
      password,
      status
    } = req.body;

    if (!managerName || !email) {
      return res.status(400).json({ msg: "Name and Email required" });
    }

    const manager = new Manager({
      managerName,
      email,
      phone,
      department,
      role,
      address,
      password,
      status: status || "Active",
      companyId: req.companyId || "",
    });

    await manager.save();

    // Send welcome email
    const welcomeMessage = `
      <h3>Welcome to the Platform, ${managerName}!</h3>
      <p>Your manager account has been successfully created.</p>
      <p><strong>Department:</strong> ${department || 'N/A'}</p>
      <p><strong>Role:</strong> ${role || 'Manager'}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Status:</strong> ${status || 'Active'}</p>
      <p>You can now access your dashboard and start managing your team.</p>
    `;
    
    await sendQuickEmail(email, "Welcome - Manager Account Created", welcomeMessage);

    res.status(201).json({
      message: "Manager Added Successfully",
      manager
    });

  } catch (err) {

    if (err.code === 11000) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    res.status(500).json({ msg: "Server error" });
  }
};