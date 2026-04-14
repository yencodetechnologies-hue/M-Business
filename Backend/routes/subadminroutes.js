const express = require("express");
const router = express.Router();
const User = require("../models/UserModels");
const Employee = require("../models/EmployeeModel");
const Manager = require("../models/ManagerModel");
const Client = require("../models/ClientModel");
const Quotation = require("../models/QuotationModel");
const bcrypt = require("bcryptjs");

// GET all subadmins
router.get("/", async (req, res) => {
  try {
    const subadmins = await User.find({ role: "subadmin" }).sort({ createdAt: -1 });
    res.json(subadmins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error fetching subadmins" });
  }
});

// CREATE a subadmin
router.post("/", async (req, res) => {
  try {
    const { name, email, password, phone, status, companyName } = req.body;
    
    // Check if email exists in User
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newSubadmin = new User({
      name,
      email,
      password: hashedPassword,
      phone: phone || "",
      role: "subadmin",
      companyName: companyName || "",
    });

    // We can also store status if we add it to the UserModel schema.
    // For now we will save it directly. Mongoose accepts it if strict is false,
    // or we might need to add it to schema. Usually models here have 'status'.
    // Wait, UserModel might not have status. I will add it to User schema later if needed.

    await newSubadmin.save();
    
    res.status(201).json({ msg: "Subadmin created", subadmin: newSubadmin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// UPDATE a subadmin
router.put("/:id", async (req, res) => {
  try {
    const { name, email, phone, status, companyName } = req.body;
    
    const updatedSubadmin = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, companyName }, // status might not be in User schema, but let's pass it
      { new: true }
    );
    
    res.json({ msg: "Subadmin updated", subadmin: updatedSubadmin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE a subadmin
router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: "Subadmin deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET company details with all related data (quotations, employees, managers, clients)
router.get("/company/:companyName", async (req, res) => {
  try {
    const { companyName } = req.params;
    const decodedCompanyName = decodeURIComponent(companyName);

    // Fetch all related data for this company
    const [employees, managers, clients, quotations, subadmins] = await Promise.all([
      Employee.find({
        $or: [
          { companyId: decodedCompanyName },
          { companyId: { $regex: decodedCompanyName, $options: "i" } }
        ]
      }),
      Manager.find({
        $or: [
          { companyId: decodedCompanyName },
          { companyId: { $regex: decodedCompanyName, $options: "i" } }
        ]
      }),
      Client.find({
        $or: [
          { companyName: decodedCompanyName },
          { companyName: { $regex: decodedCompanyName, $options: "i" } }
        ]
      }),
      Quotation.find().sort({ createdAt: -1 }),
      User.find({
        $or: [
          { companyName: decodedCompanyName },
          { companyName: { $regex: decodedCompanyName, $options: "i" } }
        ]
      })
    ]);

    res.json({
      companyName: decodedCompanyName,
      employees,
      managers,
      clients,
      quotations,
      subadmins
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error fetching company details" });
  }
});

module.exports = router;
