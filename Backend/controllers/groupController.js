const Group = require("../models/GroupModels");
const Task  = require("../models/TaskModels");

// GET all groups
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find({ isDeleted: false }).sort({ order: 1, createdAt: 1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE group
exports.createGroup = async (req, res) => {
  try {
    const { label, color, open } = req.body;
    if (!label || !label.trim())
      return res.status(400).json({ message: "Label is required" });

    const last  = await Group.findOne({ isDeleted: false }).sort({ order: -1 });
    const order = last ? last.order + 1 : 0;

    const group = await Group.create({
      label: label.trim(),
      color: color || "#7c3aed",
      open:  open !== undefined ? open : true,
      order,
    });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE group (label, color, open/collapse)
exports.updateGroup = async (req, res) => {
  try {
    const updates = {};
    if (req.body.label !== undefined) updates.label = req.body.label.trim();
    if (req.body.color !== undefined) updates.color = req.body.color;
    if (req.body.open  !== undefined) updates.open  = req.body.open;

    const group = await Group.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE group (soft) — also soft-deletes all tasks in group
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!group) return res.status(404).json({ message: "Group not found" });

    await Task.updateMany({ groupId: req.params.id }, { isDeleted: true });

    res.json({ message: "Group and its tasks deleted", _id: group._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// SEED default groups (called once on app init)
exports.seedDefaultGroups = async () => {
  const count = await Group.countDocuments({ isDeleted: false });
  if (count > 0) return;

  const defaults = [
    { label: "To-Do",       color: "#7c3aed", order: 0 },
    { label: "In Progress", color: "#9333ea", order: 1 },
    { label: "In Review",   color: "#a855f7", order: 2 },
    { label: "Completed",   color: "#22c55e", order: 3 },
  ];
  await Group.insertMany(defaults);
  console.log("✅ Default groups seeded");
};
