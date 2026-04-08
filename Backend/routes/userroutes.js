const express = require("express");
const router = express.Router();
const User = require("../models/UserModels");
const Subscription = require("../models/SubscriptionModel");
const PaymentHistory = require("../models/PaymentHistoryModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body; 

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone: phone || "" 
    });

    await user.save();

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone, 
        role: user.role
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "All fields required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      "secretkey",
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,  
        role: user.role
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get user subscription
router.get("/:userId/subscription", async (req, res) => {
  try {
    const { userId } = req.params;
    const subscription = await Subscription.findOne({
      userId: userId,
      status: { $in: ["active", "pending"] }
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.json({ hasSubscription: false });
    }

    res.json({ hasSubscription: true, subscription });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Get user payment history
router.get("/:userId/payments", async (req, res) => {
  try {
    const { userId } = req.params;
    const payments = await PaymentHistory.find({ userId })
      .sort({ paymentDate: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;