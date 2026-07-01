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
      internalNotes,
      sendCredentials
    } = req.body;

    console.log("Adding client:", { clientName, email, companyId: req.companyId });

    if (!clientName || !email) {
      console.log("Validation failed: Missing clientName or email");
      return res.status(400).json({ message: "Name and Email are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const plainPassword = password && password.trim() ? password : "123456";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
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
    const welcomeMessage = sendCredentials
      ? `
        <h3>Welcome to the Platform, ${clientName}!</h3>
        <p>Your account has been successfully created. Here are your login details:</p>
        <div style="background:#F4F6F8;border:1.5px solid #E0E6EA;border-radius:10px;padding:16px 20px;margin:16px 0;">
          <p style="margin:4px 0;"><strong>Login Email:</strong> ${normalizedEmail}</p>
          <p style="margin:4px 0;"><strong>Password:</strong> ${plainPassword}</p>
        </div>
        <p><strong>Company:</strong> ${companyName || 'N/A'}</p>
        <p>You can now log in to your client dashboard using the credentials above. For security, we recommend changing your password after your first login.</p>
      `
      : `
        <h3>Welcome to the Platform, ${clientName}!</h3>
        <p>Your account has been successfully created.</p>
        <p><strong>Company:</strong> ${companyName || 'N/A'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Status:</strong> ${status || 'Active'}</p>
        <p>You can now access your dashboard and start using our services.</p>
      `;

    sendQuickEmail(
      email,
      sendCredentials ? "Your Login Credentials - Account Created Successfully" : "Welcome - Account Created Successfully",
      welcomeMessage
    ).catch(err => console.error("Failed to send welcome email:", err));

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