const express = require("express");
const router = express.Router();
const User = require("../models/UserModels");
const Employee = require("../models/EmployeeModel");
const Manager = require("../models/ManagerModel");
const Client = require("../models/ClientModel");
const Quotation = require("../models/QuotationModel");
const Subscription = require("../models/SubscriptionModel");
const bcrypt = require("bcryptjs");

const parseLimit = (limitStr = "") => {
  if (!limitStr || typeof limitStr !== "string") return Infinity;
  const lowered = limitStr.toLowerCase();
  if (lowered.includes("unlimited")) return Infinity;
  const match = lowered.match(/\d+/);
  return match ? parseInt(match[0], 10) : Infinity;
};

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
    
    // Create 30 days free trial subscription
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
 const newSubscription = new Subscription({
  userId: newSubadmin._id.toString(),
  userEmail: newSubadmin.email,
  userName: newSubadmin.name,
  planName: "Free",
  planPrice: 0,
  billingCycle: "monthly",
  status: "active",
  endDate: endDate,
  features: ["30 Days Free Trial"],
  companyId: newSubadmin._id.toString(),
  isFullyPaid: true,
  clientLimit: "",    // ← ADD: no default
  employeeLimit: "",  // ← ADD: no default
  managerLimit: "",   // ← ADD: no default
  businessLimit: "",  // ← ADD: no default
});
    await newSubscription.save();
    
    res.status(201).json({ msg: "Subadmin created", subadmin: newSubadmin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// UPDATE a subadmin
router.put("/:id", async (req, res) => {
  try {
    const { name, email, phone, status, companyName, upiId } = req.body;
    
    const updatedSubadmin = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, companyName, upiId }, // status might not be in User schema, but let's pass it
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

// GET branding details for a companyId
router.get("/branding/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    // Find subadmin by ID
    const subadmin = await User.findById(companyId);
    if (!subadmin) {
      return res.status(404).json({ msg: "Sub-admin not found" });
    }
    res.json({
      companyName: subadmin.companyName,
      logoUrl: subadmin.logoUrl,
      upiId: subadmin.upiId,
      phone: subadmin.phone,
      email: subadmin.email
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET all resources (employees, clients, managers) assigned to a subadmin
router.get("/resources/:subadminId", async (req, res) => {
  try {
    const { subadminId } = req.params;
    const [employees, clients, managers] = await Promise.all([
      Employee.find({ companyId: subadminId }).sort({ name: 1 }),
      Client.find({ companyId: subadminId }).sort({ clientName: 1 }),
      Manager.find({ companyId: subadminId }).sort({ managerName: 1 })
    ]);
    res.json({ employees, clients, managers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error fetching resources" });
  }
});

// GET all unassigned resources (no companyId set)
router.get("/unassigned-resources", async (req, res) => {
  try {
    const [employees, clients, managers] = await Promise.all([
      Employee.find({ $or: [{ companyId: "" }, { companyId: null }, { companyId: { $exists: false } }] }).sort({ name: 1 }),
      Client.find({ $or: [{ companyId: "" }, { companyId: null }, { companyId: { $exists: false } }] }).sort({ clientName: 1 }),
      Manager.find({ $or: [{ companyId: "" }, { companyId: null }, { companyId: { $exists: false } }] }).sort({ managerName: 1 })
    ]);
    res.json({ employees, clients, managers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error fetching unassigned resources" });
  }
});

// POST assign employees/clients/managers to a subadmin
router.post("/assign-resources", async (req, res) => {
  try {
    const { subadminId, employeeIds = [], clientIds = [], managerIds = [] } = req.body;
    if (!subadminId) return res.status(400).json({ msg: "subadminId required" });

    const activeSubscription = await Subscription.findOne({
      userId: subadminId,
      status: { $in: ["active", "grace_period", "trial"] }
    }).sort({ createdAt: -1 });

    if (!activeSubscription) {
      return res.status(403).json({
        msg: "No active package found for this subadmin",
        limitReached: true
      });
    }

    const [currentEmployeeCount, currentClientCount, currentManagerCount] = await Promise.all([
      Employee.countDocuments({ companyId: subadminId }),
      Client.countDocuments({ companyId: subadminId }),
      Manager.countDocuments({ companyId: subadminId })
    ]);

    const [newEmployeesToAssign, newClientsToAssign, newManagersToAssign] = await Promise.all([
      employeeIds.length
        ? Employee.countDocuments({ _id: { $in: employeeIds }, companyId: { $ne: subadminId } })
        : Promise.resolve(0),
      clientIds.length
        ? Client.countDocuments({ _id: { $in: clientIds }, companyId: { $ne: subadminId } })
        : Promise.resolve(0),
      managerIds.length
        ? Manager.countDocuments({ _id: { $in: managerIds }, companyId: { $ne: subadminId } })
        : Promise.resolve(0)
    ]);

    const employeeLimit = parseLimit(activeSubscription.employeeLimit);
    const clientLimit = parseLimit(activeSubscription.clientLimit);
    const managerLimit = parseLimit(activeSubscription.managerLimit);

    if (Number.isFinite(employeeLimit) && (currentEmployeeCount + newEmployeesToAssign) > employeeLimit) {
      return res.status(403).json({
        msg: `Employee limit exceeded. Allowed: ${employeeLimit}, Current: ${currentEmployeeCount}`,
        type: "employee",
        limit: employeeLimit,
        currentCount: currentEmployeeCount,
        tryingToAdd: newEmployeesToAssign
      });
    }

    if (Number.isFinite(clientLimit) && (currentClientCount + newClientsToAssign) > clientLimit) {
      return res.status(403).json({
        msg: `Client limit exceeded. Allowed: ${clientLimit}, Current: ${currentClientCount}`,
        type: "client",
        limit: clientLimit,
        currentCount: currentClientCount,
        tryingToAdd: newClientsToAssign
      });
    }

    if (Number.isFinite(managerLimit) && (currentManagerCount + newManagersToAssign) > managerLimit) {
      return res.status(403).json({
        msg: `Manager limit exceeded. Allowed: ${managerLimit}, Current: ${currentManagerCount}`,
        type: "manager",
        limit: managerLimit,
        currentCount: currentManagerCount,
        tryingToAdd: newManagersToAssign
      });
    }

    const results = await Promise.all([
      employeeIds.length > 0
        ? Employee.updateMany({ _id: { $in: employeeIds } }, { $set: { companyId: subadminId } })
        : Promise.resolve({ modifiedCount: 0 }),
      clientIds.length > 0
        ? Client.updateMany({ _id: { $in: clientIds } }, { $set: { companyId: subadminId } })
        : Promise.resolve({ modifiedCount: 0 }),
      managerIds.length > 0
        ? Manager.updateMany({ _id: { $in: managerIds } }, { $set: { companyId: subadminId } })
        : Promise.resolve({ modifiedCount: 0 }),
    ]);

    res.json({
      msg: "Resources assigned successfully",
      employees: results[0].modifiedCount,
      clients: results[1].modifiedCount,
      managers: results[2].modifiedCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error assigning resources" });
  }
});

// POST unassign employees/clients/managers from a subadmin
router.post("/unassign-resources", async (req, res) => {
  try {
    const { employeeIds = [], clientIds = [], managerIds = [] } = req.body;

    await Promise.all([
      employeeIds.length > 0
        ? Employee.updateMany({ _id: { $in: employeeIds } }, { $set: { companyId: "" } })
        : Promise.resolve(),
      clientIds.length > 0
        ? Client.updateMany({ _id: { $in: clientIds } }, { $set: { companyId: "" } })
        : Promise.resolve(),
      managerIds.length > 0
        ? Manager.updateMany({ _id: { $in: managerIds } }, { $set: { companyId: "" } })
        : Promise.resolve(),
    ]);

    res.json({ msg: "Resources unassigned successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error unassigning resources" });
  }
});

module.exports = router;
