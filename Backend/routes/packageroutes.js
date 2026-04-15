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

// GET packages for specific subadmin (only assigned packages)
router.get("/subadmin/:subadminId", async (req, res) => {
  try {
    const { subadminId } = req.params;
    // Find packages ONLY assigned to this specific subadmin
    const packages = await Package.find({
      assignedSubadmins: { $in: [subadminId] }
    }).sort({ createdAt: 1 });
    res.json(packages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error fetching packages for subadmin" });
  }
});

// CREATE a package
router.post("/", async (req, res) => {
  try {
    const { title, description, icon, type, no_of_days, price, monthlyPrice, quarterlyPrice, halfYearlyPrice, annualPrice, buttonName, features, planDuration, businessLimit, managerLimit, clientLimit, status, targetRole, assignedSubadmins } = req.body;

    const newPackage = new Package({
      title,
      description,
      icon: icon || "📦",
      type: type || "paid",
      no_of_days: no_of_days || 30,
      price: price || 0,
      monthlyPrice: monthlyPrice || "0",
      quarterlyPrice: quarterlyPrice || "0",
      halfYearlyPrice: halfYearlyPrice || "0",
      annualPrice: annualPrice || "0",
      buttonName: buttonName || "Get Started",
      planDuration: planDuration || "Monthly",
      businessLimit: businessLimit || "Single business manage",
      managerLimit: managerLimit || "1 Manager",
      clientLimit: clientLimit || "3 Client manage",
      status: status || "Active",
      targetRole: targetRole || "subadmin",
      assignedSubadmins: assignedSubadmins || [],
      features: Array.isArray(features) ? features : (features ? features.split(/\r?\n/).map(f => f.trim()).filter(f => f) : [])
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
    const { title, description, icon, type, no_of_days, price, monthlyPrice, quarterlyPrice, halfYearlyPrice, annualPrice, buttonName, features, status, planDuration, businessLimit, managerLimit, clientLimit, targetRole, assignedSubadmins } = req.body;

    const updatedFeatures = Array.isArray(features) ? features : (features ? features.split(/\r?\n/).map(f => f.trim()).filter(f => f) : []);

    const updateData = {
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
      features: updatedFeatures,
      status,
      planDuration,
      businessLimit,
      managerLimit,
      clientLimit,
      targetRole,
      assignedSubadmins,
      updatedAt: Date.now()
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updatedPackage = await Package.findByIdAndUpdate(
      req.params.id,
      updateData,
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
