const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/UserModels"); // உங்கள் User model path

// ✅ SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone, logo } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashed,
      phone: phone || "",
      role: "user",
      logoUrl: logo || "",   // ✅ register-ல logo URL save
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        logoUrl: user.logoUrl,  // ✅ response-ல logoUrl
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        logoUrl: user.logoUrl || "",  // ✅ login-லயும் logoUrl
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});
// ... உன் existing routes ...

// ✅ paste பண்ண snippet இங்க வரும்
router.post("/save-logo", async (req, res) => {
  try {
    const { userId, logoUrl } = req.body;
    if (!userId) return res.status(400).json({ msg: "userId required" });

    const User = require("../models/UserModels");
    await User.findByIdAndUpdate(userId, { logoUrl: logoUrl || "" });

    res.json({ msg: "Logo saved", logoUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;