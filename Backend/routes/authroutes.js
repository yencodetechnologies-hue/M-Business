// routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/UserModels");   // Your existing
const Client = require("../models/ClientModel");  // Your existing
const Manager = require("../models/ManagerModel"); // Your existing
const Employee = require("../models/EmployeeModel");// Added new Employee model
const Subscription = require("../models/SubscriptionModel");
const DeletedClient = require("../models/DeletedClientModel"); // Blacklist
const { sendOTPEmail, sendTrialWelcome } = require("../config/email");
const jwt = require("jsonwebtoken");

// ── GET /api/auth/login (Health Check) ───────────────────────────────────────
router.get("/login", (req, res) => {
  res.json({ msg: "Login API is running. Please use POST to submit credentials." });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("📧 Email received:", email);
    console.log("🔑 Password received:", password);



    // Hardcoded bypass for the specific admin user requested
    if (email === "input:focus { border-bottom-color: rgba(255,255,255,0.2) !important; outline: none; box-shadow: none; }gmail.com" && password === "admin1234") {
      const u = await User.findOne({ email });
      if (!u) return res.status(400).json({ msg: "Invalid email or password" });
      console.log("✅ Admin Login Succesful!");
      return res.json({
        user: {
          id: u._id,
          name: u.name || "Super Admin",
          email: "input:focus { border-bottom-color: rgba(255,255,255,0.2) !important; outline: none; box-shadow: none; }gmail.com",
          role: "admin",
          companyId: u.companyId || "admin-company-id",
          logoUrl: u.logoUrl || "",
          companyName: u.companyName || "Your Business"
        }
      });
    }

    // Hardcoded bypass for the specific subadmin user requested
    if (email === "subadmin@gmail.com" && password === "subadmin123") {
      const u = await User.findOne({ email });
      if (!u) return res.status(400).json({ msg: "Invalid email or password" });
      console.log("✅ Subadmin Login Succesful!");
      return res.json({
        user: {
          id: u._id,
          name: u.name || "Demo Subadmin",
          email: "subadmin@gmail.com",
          role: "subadmin",
          companyId: u.companyId || "admin-company-id",
          logoUrl: u.logoUrl || "",
          companyName: u.companyName || "Your Business"
        }
      });
    }

    // Hardcoded bypass for the specific client user requested
    if (email === "client@gmail.com" && password === "client123") {
      const u = await Client.findOne({ email });
      if (!u) return res.status(400).json({ msg: "Invalid email or password" });
      console.log("✅ Client Login Successful!");
      return res.json({
        user: {
          id: u._id,
          name: u.clientName || u.name || "Demo Client",
          email: "client@gmail.com",
          role: "client",
          companyId: u.companyId || "client-company-id",
          logoUrl: u.logoUrl || "",
          companyName: u.companyName || "Your Business"
        }
      });
    }

    let user = null;
    const normalizedLoginEmail = (email || "").toLowerCase().trim();

    // Run all collection lookups in parallel instead of sequentially — this
    // alone removes up to 3 round-trips worth of wait time from every login.
    const [userDoc, clientDoc, managerDoc, employeeDoc] = await Promise.all([
      User.findOne({ email: normalizedLoginEmail }),
      Client.findOne({ email: normalizedLoginEmail }).sort({ createdAt: -1 }),
      Manager.findOne({ email: normalizedLoginEmail }),
      Employee.findOne({ email: normalizedLoginEmail }),
    ]);

    user = userDoc || clientDoc || managerDoc || null;

    if (!user) {
      const employee = employeeDoc;

      if (employee) {
        if (employee.status === "Inactive") {
          return res.status(403).json({ msg: "Your account is deactivated. Please contact support." });
        }
        // Check if password exists and is hashed
        if (!employee.password || employee.password.length < 10) {
          console.log("Employee password not set or not hashed");
          return res.status(400).json({ msg: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, employee.password);
        console.log("Password match:", isMatch);

        if (!isMatch) return res.status(400).json({ msg: "Invalid email or password" });

        return res.json({
          user: {
            id: employee._id,
            name: employee.name,
            email: employee.email,
            phone: employee.phone || "",
            role: "employee",   // ← lowercase directly
            department: employee.department || "",
            salary: employee.salary || "",
            companyId: employee.companyId || "",
            status: employee.status,
            logoUrl: "",
          },
        });
      }
    }

    if (!user) return res.status(400).json({ msg: "Invalid email or password" });

    let isMatch = await bcrypt.compare(password, user.password);

    // Allow "123456" to work as a fallback/master password for clients
    const tempRole = (user.role || "user").toLowerCase().trim();
    if (!isMatch && password === "123456" && tempRole === "client") {
      isMatch = true;
    }

    console.log("Password match for user/client/manager:", isMatch);

    if (!isMatch) return res.status(400).json({ msg: "Invalid email or password" });

    const role = tempRole;

    if (role === "subadmin" && user.isVerified === false) {
      user.isVerified = true;
      await user.save();
    }
    res.json({
      user: {
        id: user._id,
        name: user.clientName || user.managerName || user.name || "",
        email: user.email,
        phone: user.phone || "",
        role: role,
        companyId: user.companyId || user._id.toString(),
        logoUrl: user.logoUrl || "",
        companyName: user.companyName || "",
        upiId: user.upiId || "",
        clientLimit: user.clientLimit || "",
        employeeLimit: user.employeeLimit || "",
        managerLimit: user.managerLimit || "",
        businessLimit: user.businessLimit || "",
        createdAt: user.createdAt,
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});
// ── POST /api/auth/signup ───────────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role, phone, companyName } = req.body;

    // Ensure email is unique across all collections
    const existUser = await User.findOne({ email });
    const existClient = await Client.findOne({ email });
    const existManager = await Manager.findOne({ email });
    const existEmployee = await Employee.findOne({ email });

    if (existUser || existClient || existManager || existEmployee) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const selectedRole = (role || "admin").toLowerCase().trim();

    if (selectedRole === "client") {
      const newClient = new Client({ clientName: name, email, password: hashed, role: "client", phone });
      await newClient.save();
    } else if (selectedRole === "manager") {
      const newManager = new Manager({ managerName: name, email, password: hashed, role: "Manager", phone });
      await newManager.save();
    } else if (selectedRole === "employee") {
      const newEmployee = new Employee({ name, email, password: hashed, role: "employee", phone });
      await newEmployee.save();
    } else if (selectedRole === "subadmin") {
      const newUser = new User({ name, email, password: hashed, role: "subadmin", phone, companyName: companyName || "", isVerified: true });
      await newUser.save();

      const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
      const userObj = { _id: newUser._id, id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, phone: newUser.phone, companyName: newUser.companyName, logoUrl: newUser.logoUrl || "" };

      return res.status(201).json({ msg: "Account created successfully!", requiresOTP: false });

    } else {
      const newUser = new User({ name, email, password: hashed, role: "admin", phone });
      await newUser.save();
    }

    res.status(201).json({ msg: "Account created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ── POST /api/auth/verify-otp ───────────────────────────────────────────────
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log(`Verifying OTP for: ${email}, OTP: ${otp}`);

    // Case-insensitive email search
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') },
      role: { $regex: /^subadmin$/i }
    });

    if (!user) {
      console.log("Verification failed: User not found");
      return res.status(400).json({ msg: "User not found" });
    }

    console.log(`User found: ${user.email}, DB OTP: ${user.otp}, Expiry: ${user.otpExpires}`);

    if (user.isVerified) {
      console.log("Verification failed: Already verified");
      return res.status(400).json({ msg: "User is already verified" });
    }
    if (user.otp !== otp) {
      console.log(`Verification failed: OTP mismatch. Received: ${otp}, Expected: ${user.otp}`);
      return res.status(400).json({ msg: "Invalid OTP" });
    }
    if (user.otpExpires < new Date()) {
      console.log("Verification failed: OTP expired");
      return res.status(400).json({ msg: "OTP has expired" });
    }

    user.isVerified = true;
    user.otp = "";
    user.otpExpires = null;
    await user.save();

    res.json({
      msg: "Email verified successfully",
      user: {
        id: user._id,
        name: user.name || "",
        email: user.email,
        phone: user.phone || "",
        role: "subadmin",
        companyId: user.companyId || user._id.toString(),
        logoUrl: user.logoUrl || "",
        companyName: user.companyName || "",
        upiId: user.upiId || "",
        clientLimit: user.clientLimit || "",
        employeeLimit: user.employeeLimit || "",
        createdAt: user.createdAt,
      }
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ── POST /api/auth/save-logo (Your existing — untouched) ───────────────
router.post("/save-logo", async (req, res) => {
  try {
    const { userId, logoUrl } = req.body;
    await User.findByIdAndUpdate(userId, { logoUrl }, { returnDocument: 'after' });
    res.json({ msg: "Logo saved" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/save-company-name", async (req, res) => {
  try {
    const { userId, companyName } = req.body;
    await User.findByIdAndUpdate(userId, { companyName }, { returnDocument: 'after' });
    res.json({ msg: "Company name saved" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        companyId: user.companyId || user._id.toString(),
        logoUrl: user.logoUrl || "",
        companyName: user.companyName || "",
        upiId: user.upiId || "",
        clientLimit: user.clientLimit || "",
        employeeLimit: user.employeeLimit || "",
        managerLimit: user.managerLimit || "",
        businessLimit: user.businessLimit || "",
      }
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// ── GET /api/auth/debug-clients (Your existing — untouched) ─────────────
router.get("/debug-clients", async (req, res) => {
  try {
    const clients = await Client.find({});
    console.log("📋 All clients:", clients);
    res.json(clients);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    let user = await User.findOne({ email });
    if (!user) user = await Client.findOne({ email });
    if (!user) user = await Manager.findOne({ email });
    if (!user) user = await Employee.findOne({ email });

    if (!user) return res.status(404).json({ msg: "User with this email not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60000); // 10 minutes
    await user.save();

    const emailRes = await sendOTPEmail(email, otp, 'password_reset');
    if (!emailRes.success) {
      return res.status(500).json({ msg: "Failed to send OTP email" });
    }

    res.json({ msg: "OTP sent to your email" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ── POST /api/auth/reset-password ───────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    let user = await User.findOne({ email });
    if (!user) user = await Client.findOne({ email });
    if (!user) user = await Manager.findOne({ email });
    if (!user) user = await Employee.findOne({ email });

    if (!user) return res.status(404).json({ msg: "User not found" });

    if (user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.otp = "";
    user.otpExpires = null;
    await user.save();

    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ── POST /api/auth/change-password ──────────────────────────────────────────
router.post("/change-password", async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    const user = await User.findById(userId); // or whatever model lookup you have

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Only verify old password if it was actually provided
    if (oldPassword) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Old password is incorrect" });
      }
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;

