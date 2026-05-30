const express = require("express");
const router = express.Router();
const Package = require("../models/PackageModel");
const Subscription = require("../models/SubscriptionModel");

const User = require("../models/UserModels");

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
    // Find packages assigned to this specific subadmin OR any package targeted at subadmins
    const packages = await Package.find({
      $or: [
        { assignedSubadmins: { $in: [subadminId] } },
        { targetRole: "subadmin" },
        { targetRole: "all" },
        { targetRole: { $exists: false } }
      ],
      status: "Active"
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
    const { title, description, icon, type, no_of_days, price, monthlyPrice, quarterlyPrice, halfYearlyPrice, annualPrice, buttonName, features, planDuration, businessLimit, managerLimit, clientLimit, employeeLimit, status, targetRole, assignedSubadmins } = req.body;

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
      planDuration: planDuration || "Monthly",
      businessLimit: businessLimit || "",
      managerLimit: managerLimit || "",
      clientLimit: clientLimit || "3 Client manage",
      employeeLimit: employeeLimit || "",
      status: status || "Active",
      targetRole: targetRole || "subadmin",
      assignedSubadmins: assignedSubadmins || [],
      features: Array.isArray(features) ? features : (features ? features.split(/\r?\n/).map(f => f.trim()).filter(f => f) : [])
    });

    await newPackage.save();

    // AUTOMATIC SYNC: Update limits for all assigned subadmins
    if (assignedSubadmins && assignedSubadmins.length > 0) {
      await User.updateMany(
        { _id: { $in: assignedSubadmins } },
        { 
          clientLimit: clientLimit || "3 Clients",
          employeeLimit: employeeLimit || "10 Employees",
          managerLimit: managerLimit || "1 Manager"
        }
      );
    }

    res.status(201).json(newPackage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error creating package" });
  }
});

// UPDATE a package
router.put("/:id", async (req, res) => {
  try {
    const { title, description, icon, type, no_of_days, price, monthlyPrice, quarterlyPrice, halfYearlyPrice, annualPrice, buttonName, features, status, planDuration, businessLimit, managerLimit, clientLimit, employeeLimit, targetRole, assignedSubadmins, updateActiveSubscriptions } = req.body;

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
      employeeLimit,
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

    // If updateActiveSubscriptions is true, update all active/pending subscriptions using this package
    if (updateActiveSubscriptions) {
      const isTrialPackage = title.toLowerCase().includes("free") || title.toLowerCase().includes("trial");
      
      await Subscription.updateMany(
        { 
          $or: [
            { packageId: req.params.id },
            { planName: title },
            ...(isTrialPackage ? [{ isTrial: true }, { planName: "Free" }] : [])
          ],
          status: { $in: ["active", "pending", "trial"] } 
        },
        {
          planName: title,
          planPrice: price,
          clientLimit,
          employeeLimit,
          managerLimit,
          businessLimit,
          features: updatedFeatures,
          updatedAt: Date.now()
        }
      );
    }
    // AUTOMATIC SYNC: Update limits for all assigned subadmins
    if (assignedSubadmins && assignedSubadmins.length > 0) {
      await User.updateMany(
        { _id: { $in: assignedSubadmins } },
        { 
          clientLimit: clientLimit || "3 Clients",
          employeeLimit: employeeLimit || "10 Employees",
          managerLimit: managerLimit || "1 Manager",
          businessLimit: businessLimit || "Single business manage"
        }
      );
    }

    res.json(updatedPackage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error updating package" });
  }
});

// ASSIGN a subadmin to a package (add to assignedSubadmins)
router.post("/:id/assign-subadmin", async (req, res) => {
  try {
    const { subadminId } = req.body;
    if (!subadminId) return res.status(400).json({ msg: "subadminId required" });
    const updated = await Package.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { assignedSubadmins: subadminId } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ msg: "Package not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error assigning subadmin" });
  }
});

// UNASSIGN a subadmin from a package (remove from assignedSubadmins)
router.post("/:id/unassign-subadmin", async (req, res) => {
  try {
    const { subadminId } = req.body;
    if (!subadminId) return res.status(400).json({ msg: "subadminId required" });
    const updated = await Package.findByIdAndUpdate(
      req.params.id,
      { $pull: { assignedSubadmins: subadminId } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ msg: "Package not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error unassigning subadmin" });
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
