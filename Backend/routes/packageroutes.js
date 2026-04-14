const express = require("express");
const router = express.Router();
const Package = require("../models/PackageModel");

// GET all packages
router.get("/", async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: 1 });
    res.json(packages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error fetching packages" });
  }
});

// GET packages for specific subadmin
router.get("/subadmin/:subadminId", async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: 1 });
    res.json(packages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error fetching packages for subadmin" });
  }
});

// CREATE a package
router.post("/", async (req, res) => {
  try {
    const { title, description, icon, type, no_of_days, price, monthlyPrice, quarterlyPrice, halfYearlyPrice, annualPrice, buttonName, features, planDuration, businessLimit, managerLimit, clientLimit } = req.body;
    
    const newPackage = new Package({
      title,
      description,
      icon,
      type,
      no_of_days,
      price,
      monthlyPrice,
      quarterlyPrice,
      halfYearlyPrice,
      annualPrice,
      buttonName,
      planDuration,
      businessLimit,
      managerLimit,
      clientLimit,
      features: Array.isArray(features) ? features : (features ? features.split(",").map(f => f.trim()) : [])
    });

    await newPackage.save();
    res.status(201).json(newPackage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error creating package" });
  }
});

// UPDATE a package
router.put("/:id", async (req, res) => {
  try {
    const { title, description, icon, type, no_of_days, price, monthlyPrice, quarterlyPrice, halfYearlyPrice, annualPrice, buttonName, features, status, planDuration, businessLimit, managerLimit, clientLimit } = req.body;
    
    const updatedFeatures = Array.isArray(features) ? features : (features ? features.split(",").map(f => f.trim()) : []);

    const updatedPackage = await Package.findByIdAndUpdate(
      req.params.id,
      { title, description, icon, type, no_of_days, price, monthlyPrice, quarterlyPrice, halfYearlyPrice, annualPrice, buttonName, features: updatedFeatures, status, planDuration, businessLimit, managerLimit, clientLimit, updatedAt: Date.now() },
      { new: true }
    );
    
    res.json(updatedPackage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error updating package" });
  }
});

// DELETE a package
router.delete("/:id", async (req, res) => {
  try {
    await Package.findByIdAndDelete(req.params.id);
    res.json({ msg: "Package deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error deleting package" });
  }
});

module.exports = router;
