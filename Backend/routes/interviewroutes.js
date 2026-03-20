// routes/interviews.js
// Full backend for HR Interview Management
// Install: npm install express mongoose multer cloudinary multer-storage-cloudinary

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");

// ─── SCHEMA ──────────────────────────────────────────────────────────────────
const InterviewSchema = new mongoose.Schema({
  companyId:  { type: String, required: true, index: true },
  name:       { type: String, required: true },
  email:      { type: String, required: true },
  mobile:     { type: String, required: true },
  experience: { type: String, enum: ["Fresher", "Experienced"], required: true },
  years:      { type: String, default: "" },
  role:       { type: String, required: true },
  notes:      { type: String, default: "" },
  resumeUrl:  { type: String, default: "" },   // Cloudinary URL
  resumeName: { type: String, default: "" },   // Original filename
  resumeSize: { type: String, default: "" },   // e.g. "245 KB"
  status:     { type: String, enum: ["pending", "hired", "rejected"], default: "pending" },
  viewedAt:   { type: Date, default: null },   // when HR first viewed resume
}, { timestamps: true });

const Interview = mongoose.model("Interview", InterviewSchema);

// ─── FILE UPLOAD SETUP ───────────────────────────────────────────────────────
// OPTION A: Local storage (simple, no cloud needed)
const localStorage_storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/resumes/"),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

// OPTION B: Cloudinary (recommended for production)
// Uncomment if you have Cloudinary set up:
/*
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const cloudinary_storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "resumes", resource_type: "raw", allowed_formats: ["pdf","doc","docx"] }
});
*/

const upload = multer({
  storage: localStorage_storage,   // Switch to cloudinary_storage if using Cloudinary
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only PDF, DOC, DOCX files allowed"));
  }
});

// ─── HELPER ──────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// GET /api/interviews/company/:companyId
// Returns company info for the apply form header
router.get("/company/:companyId", async (req, res) => {
  try {
    // You can extend this to look up from your Company/User collection
    // For now returns a basic response — extend as needed
    const { companyId } = req.params;
    // Try to find from your existing auth model (import as needed)
    // const user = await User.findById(companyId).select("name logoUrl");
    // if (user) return res.json({ name: user.name, logoUrl: user.logoUrl });
    res.json({ name: "Company Portal", logoUrl: null });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/interviews?companyId=xxx
// HR Dashboard - get all candidates for a company
router.get("/", async (req, res) => {
  try {
    const { companyId, status, search } = req.query;
    if (!companyId) return res.status(400).json({ msg: "companyId required" });

    const query = { companyId };
    if (status && status !== "all") query.status = status;
    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { role:  { $regex: search, $options: "i" } },
      ];
    }
    const interviews = await Interview.find(query).sort({ createdAt: -1 });
    res.json(interviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// POST /api/interviews/apply
// Candidate submits application (with resume file)
router.post("/apply", upload.single("resume"), async (req, res) => {
  try {
    const { companyId, name, email, mobile, experience, years, role, notes } = req.body;

    // Validation
    if (!companyId || !name || !email || !mobile || !experience || !role) {
      return res.status(400).json({ msg: "All required fields must be filled" });
    }
    if (!req.file) {
      return res.status(400).json({ msg: "Resume file is required" });
    }

    // Check for duplicate email in same company
    const exists = await Interview.findOne({ companyId, email });
    if (exists) {
      return res.status(400).json({ msg: "You have already applied for this company" });
    }

    // Build resume URL
    // For local storage:
    const resumeUrl = `http://localhost:5000/uploads/resumes/${req.file.filename}`;
    // For Cloudinary: req.file.path (secure_url from cloudinary)

    const interview = new Interview({
      companyId,
      name:       name.trim(),
      email:      email.trim().toLowerCase(),
      mobile:     mobile.trim(),
      experience,
      years:      years || "",
      role:       role.trim(),
      notes:      notes || "",
      resumeUrl,
      resumeName: req.file.originalname,
      resumeSize: formatBytes(req.file.size),
      status:     "pending",
    });

    await interview.save();
    res.status(201).json({ msg: "Application submitted successfully", id: interview._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error. Please try again." });
  }
});

// PUT /api/interviews/:id/status
// HR updates candidate status (pending → hired / rejected)
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "hired", "rejected"].includes(status)) {
      return res.status(400).json({ msg: "Invalid status value" });
    }
    const interview = await Interview.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!interview) return res.status(404).json({ msg: "Candidate not found" });
    res.json(interview);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// PUT /api/interviews/:id
// General update (status + any other fields)
router.put("/:id", async (req, res) => {
  try {
    const allowed = ["status", "notes"];
    const update = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });

    // When HR views resume → auto-set status to pending if still unset
    if (req.body.viewed && !update.status) {
      update.viewedAt = new Date();
    }

    const interview = await Interview.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!interview) return res.status(404).json({ msg: "Not found" });
    res.json(interview);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/interviews/:id/resume
// Serve resume file (marks as viewed, auto-sets pending status)
router.get("/:id/resume", async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ msg: "Not found" });

    // Mark viewed time if first view
    if (!interview.viewedAt) {
      interview.viewedAt = new Date();
      await interview.save();
    }

    // Redirect to file URL (for local storage)
    res.redirect(interview.resumeUrl);
    // For Cloudinary, this redirects to the CDN URL directly
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/interviews/:id
// Single candidate detail
router.get("/:id", async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ msg: "Not found" });
    res.json(interview);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE /api/interviews/:id
// HR deletes a candidate record
router.delete("/:id", async (req, res) => {
  try {
    const interview = await Interview.findByIdAndDelete(req.params.id);
    if (!interview) return res.status(404).json({ msg: "Not found" });
    // Optional: delete file from disk/cloudinary too
    res.json({ msg: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/interviews/stats/:companyId
// Dashboard stats count
router.get("/stats/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    const [total, pending, hired, rejected] = await Promise.all([
      Interview.countDocuments({ companyId }),
      Interview.countDocuments({ companyId, status: "pending" }),
      Interview.countDocuments({ companyId, status: "hired" }),
      Interview.countDocuments({ companyId, status: "rejected" }),
    ]);
    res.json({ total, pending, hired, rejected });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
