const express = require("express");
const router  = express.Router();
const mongoose = require("mongoose");

const ProjectStatusSchema = new mongoose.Schema({
  projectId: { type: String },
  name:      { type: String, required: true },
  client:    { type: String, required: true },
  manager:   { type: String, default: "" },
  employee:  { type: String, default: "" },
  deadline:  { type: String, required: true },
  status:    {
    type: String,
    enum: ["In Progress","Pending","Completed","On Hold"],
    default: "Pending",
  },
  progress:  { type: Number, min: 0, max: 100, default: 0 },
  notes:     { type: String, default: "" },
  companyId: { type: String, default: "" },
}, { timestamps: true });

ProjectStatusSchema.pre("save", async function() {
  if (!this.projectId) {
    const count = await mongoose.model("ProjectStatus").countDocuments();
    this.projectId = "PRJ" + String(count + 1).padStart(3, "0");
  }
});

const ProjectStatus = mongoose.models.ProjectStatus ||
  mongoose.model("ProjectStatus", ProjectStatusSchema);

// GET all
router.get("/", async (req, res) => {
  try {
    const filter = req.companyId ? { companyId: req.companyId } : {};
    const data = await ProjectStatus.find(filter).sort({ createdAt: -1 });
    res.json(data);
  } catch(e) {
    console.error("❌ GET error:", e.message);
    res.status(500).json({ msg: e.message });
  }
});

// POST create
router.post("/", async (req, res) => {
  try {
    console.log("📥 POST body:", req.body); // ← debug

    const { projectId,name,client,manager,employee,deadline,status,progress,notes,companyId } = req.body;

    if (!name?.trim())   return res.status(400).json({ msg: "name is required" });
    if (!client?.trim()) return res.status(400).json({ msg: "client is required" });
    if (!deadline)       return res.status(400).json({ msg: "deadline is required" });

    const doc = new ProjectStatus({
      projectId,
      name: name.trim(),
      client: client.trim(),
      manager: manager || "",
      employee: employee || "",
      deadline,
      status: status || "Pending",
      progress: Math.min(100, Math.max(0, Number(progress) || 0)),
      notes: notes || "",
      companyId: companyId || req.companyId || "",
    });

    await doc.save();
    console.log("✅ Saved:", doc._id);
    res.status(201).json(doc);

  } catch(e) {
    console.error("❌ POST error:", e.message); // ← exact error காணும்
    res.status(500).json({ msg: e.message });
  }
});

// PUT update
router.put("/:id", async (req, res) => {
  try {
    console.log("📥 PUT body:", req.body); // ← debug

    const { name,client,manager,employee,deadline,status,progress,notes } = req.body;
    if (!name?.trim())   return res.status(400).json({ msg: "name is required" });
    if (!client?.trim()) return res.status(400).json({ msg: "client is required" });

    const doc = await ProjectStatus.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(), client: client.trim(),
        manager: manager || "", employee: employee || "",
        deadline, status,
        progress: Math.min(100, Math.max(0, Number(progress) || 0)),
        notes: notes || ""
      },
      { new: true, runValidators: true }
    );

    if (!doc) return res.status(404).json({ msg: "Not found" });
    res.json(doc);

  } catch(e) {
    console.error("❌ PUT error:", e.message);
    res.status(500).json({ msg: e.message });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const doc = await ProjectStatus.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ msg: "Not found" });
    res.json({ msg: "Deleted", id: req.params.id });
  } catch(e) {
    console.error("❌ DELETE error:", e.message);
    res.status(500).json({ msg: e.message });
  }
});

module.exports = router;