// routes/auth.js
const express  = require("express");
const router   = express.Router();
const bcrypt   = require("bcryptjs");
const User     = require("../models/UserModels");   // உங்கள் existing ✅
const Client   = require("../models/ClientModel");  // உங்கள் existing ✅
const Manager  = require("../models/ManagerModel"); // உங்கள் existing ✅
const Employee = require("../models/EmployeeModel");// ← இது மட்டும் புதுசு add

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("📧 Email received:", email);
    console.log("🔑 Password received:", password);

    // Hardcoded bypass for the specific admin user requested
    if (email === "admin@gmail.com" && password === "admin123") {
      console.log("✅ Admin Login Succesful!");
      return res.json({
        user: {
          id: "admin-hardcoded-id",
          name: "Super Admin",
          email: "admin@gmail.com",
          role: "admin",
          companyId: "admin-company-id",
          logoUrl: ""
        }
      });
    }

    // Hardcoded bypass for the specific subadmin user requested
    if (email === "subadmin@gmail.com" && password === "subadmin123") {
      console.log("✅ Subadmin Login Succesful!");
      return res.json({
        user: {
          id: "subadmin-hardcoded-id",
          name: "Demo Subadmin",
          email: "subadmin@gmail.com",
          role: "subadmin",
          companyId: "admin-company-id",
          logoUrl: ""
        }
      });
    }

    let user = null;

    // Check User collection
    user = await User.findOne({ email });
    console.log("User collection result:", user ? `Found: ${user.role}` : "Not found");

    if (!user) {
      user = await Client.findOne({ email });
      console.log("Client collection result:", user ? "Found" : "Not found");
    }

    if (!user) {
      user = await Manager.findOne({ email });
      console.log("Manager collection result:", user ? "Found" : "Not found");
    }

    if (!user) {
      const employee = await Employee.findOne({ email: email.toLowerCase().trim() });
      console.log("Employee collection result:", employee ? `Found: ${employee.name}` : "Not found");
      console.log("Employee password hash:", employee?.password);

      if (employee) {
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
            id:         employee._id,
            name:       employee.name,
            email:      employee.email,
            phone:      employee.phone      || "",
            role:       "employee",   // ← lowercase directly
            department: employee.department || "",
            salary:     employee.salary     || "",
            companyId:  employee.companyId  || "",
            status:     employee.status,
            logoUrl:    "",
          },
        });
      }
    }

    if (!user) return res.status(400).json({ msg: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match for user/client/manager:", isMatch);

    if (!isMatch) return res.status(400).json({ msg: "Invalid email or password" });

    const role = (user.role || "user").toLowerCase().trim();

    res.json({
      user: {
        id:      user._id,
        name:    user.clientName || user.managerName || user.name || "",
        email:   user.email,
        phone:   user.phone   || "",
        role:    role,
        companyId: user.companyId || user._id.toString(),
        logoUrl: user.logoUrl || "",
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
    const { name, email, password, role, phone } = req.body;

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
      const newUser = new User({ name, email, password: hashed, role: "subadmin", phone });
      await newUser.save();
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

// ── POST /api/auth/save-logo (உங்கள் existing — touch பண்ணல) ───────────────
router.post("/save-logo", async (req, res) => {
  try {
    const { userId, logoUrl } = req.body;
await User.findByIdAndUpdate(userId, { logoUrl }, { returnDocument: 'after' });
    res.json({ msg: "Logo saved" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// ── GET /api/auth/debug-clients (உங்கள் existing — touch பண்ணல) ─────────────
router.get("/debug-clients", async (req, res) => {
  try {
    const clients = await Client.find({});
    console.log("📋 All clients:", clients);
    res.json(clients);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
