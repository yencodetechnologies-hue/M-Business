// ─────────────────────────────────────────────────────────────
//  routes/projectStatus.js  — paste into your Express backend
//  Mount with: app.use("/api/project-status", require("./routes/projectStatus"))
// ─────────────────────────────────────────────────────────────
const express = require("express");
const router  = express.Router();
const mongoose = require("mongoose");

// ── Schema ────────────────────────────────────────────────
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
}, { timestamps: true });

// Auto-generate projectId before save
ProjectStatusSchema.pre("save", async function(next) {
  if (!this.projectId) {
    const count = await mongoose.model("ProjectStatus").countDocuments();
    this.projectId = "PRJ" + String(count + 1).padStart(3, "0");
  }
  next();
});

const ProjectStatus = mongoose.models.ProjectStatus ||
  mongoose.model("ProjectStatus", ProjectStatusSchema);

// ── GET all  (optional ?status= and ?q= filters) ─────────
router.get("/", async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.q) {
      const rx = new RegExp(req.query.q, "i");
      query.$or = [{ name:rx }, { client:rx }, { projectId:rx },
                   { manager:rx }, { employee:rx }];
    }
    const data = await ProjectStatus.find(query).sort({ createdAt: -1 });
    res.json(data);
  } catch(e) { res.status(500).json({ msg: e.message }); }
});

// ── GET single ────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const doc = await ProjectStatus.findById(req.params.id);
    if (!doc) return res.status(404).json({ msg: "Not found" });
    res.json(doc);
  } catch(e) { res.status(500).json({ msg: e.message }); }
});

// ── POST create ───────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { projectId,name,client,manager,employee,deadline,status,progress,notes } = req.body;
    if (!name?.trim())     return res.status(400).json({ msg: "name is required" });
    if (!client?.trim())   return res.status(400).json({ msg: "client is required" });
    if (!deadline)         return res.status(400).json({ msg: "deadline is required" });

    const doc = new ProjectStatus({
      projectId, name:name.trim(), client:client.trim(),
      manager:manager||"", employee:employee||"",
      deadline, status:status||"Pending",
      progress: Math.min(100, Math.max(0, Number(progress)||0)),
      notes: notes||"",
    });
    await doc.save();
    res.status(201).json(doc);
  } catch(e) { res.status(500).json({ msg: e.message }); }
});

// ── PUT full update ───────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const { name,client,manager,employee,deadline,status,progress,notes } = req.body;
    if (!name?.trim())   return res.status(400).json({ msg: "name is required" });
    if (!client?.trim()) return res.status(400).json({ msg: "client is required" });

    const doc = await ProjectStatus.findByIdAndUpdate(
      req.params.id,
      { name:name.trim(), client:client.trim(), manager:manager||"",
        employee:employee||"", deadline, status,
        progress: Math.min(100, Math.max(0, Number(progress)||0)),
        notes:notes||"" },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ msg: "Not found" });
    res.json(doc);
  } catch(e) { res.status(500).json({ msg: e.message }); }
});

// ── PATCH partial update ──────────────────────────────────
router.patch("/:id", async (req, res) => {
  try {
    const allowed = ["name","client","manager","employee",
                     "deadline","status","progress","notes"];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    if (update.progress !== undefined)
      update.progress = Math.min(100, Math.max(0, Number(update.progress)||0));

    const doc = await ProjectStatus.findByIdAndUpdate(
      req.params.id, { $set: update }, { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ msg: "Not found" });
    res.json(doc);
  } catch(e) { res.status(500).json({ msg: e.message }); }
});

// ── DELETE ────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const doc = await ProjectStatus.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ msg: "Not found" });
    res.json({ msg: "Deleted", id: req.params.id });
  } catch(e) { res.status(500).json({ msg: e.message }); }
});

module.exports = router;
