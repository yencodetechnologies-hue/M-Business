const Client = require("../models/ClientModel");
const DeletedClient = require("../models/DeletedClientModel");
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
      gstNumber,
      logoUrl,
      clientType,
      category,
      clientSource,
      onboardedOn,
      designation,
      altEmail,
      officePhone,
      city,
      state,
      pincode,
      country,
      websiteUrl,
      linkedinUrl,
      billingCurrency,
      paymentTerms,
      creditLimit,
      preferredPaymentMode,
      internalNotes
    } = req.body;

    console.log("Adding client:", { clientName, email, companyId: req.companyId });

    if (!clientName || !email) {
      console.log("Validation failed: Missing clientName or email");
      return res.status(400).json({ message: "Name and Email are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    // Deleted clients are allowed to re-register as a completely fresh account
    // Default password is "123456" if the subadmin leaves the password field blank
    const hashedPassword = await bcrypt.hash(password && password.trim() ? password : "123456", 10);

    const newClient = new Client({
      clientName,
      companyName,
      email: normalizedEmail,
      phone,
      contactPersonName,
      contactPersonNo,
      status: status || "Active",
      address,
      password: hashedPassword,
      role: "client",
      gstNumber: gstNumber || "",
      logoUrl: logoUrl || "",
      companyId: req.companyId || "",
      clientType: clientType || "b2b",
      category: category || "",
      clientSource: clientSource || "",
      onboardedOn: onboardedOn || "",
      designation: designation || "",
      altEmail: altEmail || "",
      officePhone: officePhone || "",
      city: city || "",
      state: state || "",
      pincode: pincode || "",
      country: country || "India",
      websiteUrl: websiteUrl || "",
      linkedinUrl: linkedinUrl || "",
      billingCurrency: billingCurrency || "INR — Indian Rupee",
      paymentTerms: paymentTerms || "",
      creditLimit: creditLimit || "",
      preferredPaymentMode: preferredPaymentMode || "",
      internalNotes: internalNotes || ""
    });

    await newClient.save();

    // Send welcome email in background
    const welcomeMessage = `
      <h3>Welcome to the Platform, ${clientName}!</h3>
      <p>Your account has been successfully created.</p>
      <p><strong>Company:</strong> ${companyName || 'N/A'}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Status:</strong> ${status || 'Active'}</p>
      <p>You can now access your dashboard and start using our services.</p>
    `;

    sendQuickEmail(email, "Welcome - Account Created Successfully", welcomeMessage)
      .catch(err => console.error("Failed to send welcome email:", err));

    res.status(201).json({
      message: "Client Added Successfully",
      client: newClient,
    });

  } catch (error) {
    console.error("Add client error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "A client with this email already exists in your account" });
    }
    res.status(500).json({ message: error.message });
  }
};