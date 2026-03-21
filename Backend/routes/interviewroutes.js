// =============================================
//  routes/interviewroutes.js
//  Interview Portal — Routes + Model
// =============================================
//
//  Already added in server.js:
//    const interviewRoutes = require("./routes/interviewroutes");
//    app.use("/api/interviews", interviewRoutes);
//
//  Install (if not already):
//    npm install multer
// =============================================

const express    = require("express");
const multer     = require("multer");
const mongoose   = require("mongoose");
const path       = require("path");
const fs         = require("fs");
const router     = express.Router();

// ── Upload Directory ──────────────────────────
const UPLOAD_DIR = path.join(__dirname, "../uploads/resumes");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Multer Config ─────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();
  allowed.includes(ext)
    ? cb(null, true)
    : cb(new Error("Only PDF, DOC, DOCX files are allowed"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ── Schema & Model ────────────────────────────
const interviewSchema = new mongoose.Schema(
  {
    companyId:     { type: String, default: "DEFAULT" },
    companyName:   { type: String, default: "M Business" },
    name:          { type: String, required: true, trim: true },
    email:         { type: String, required: true, trim: true, lowercase: true },
    mobile:        { type: String, required: true, trim: true },
    experience:    { type: String, enum: ["Fresher", "Experienced"], required: true },
    years:         { type: String, default: "" },
    role:          { type: String, required: true, trim: true },
    notes:         { type: String, default: "" },
    resumeName:    { type: String, default: "" },
    resumePath:    { type: String, default: "" },
    status: {
      type:    String,
      enum:    ["Pending", "Hired", "Rejected"],
      default: "Pending",
    },
    interviewDate: { type: Date, default: null },
  },
  { timestamps: true }
);

const Interview = mongoose.models.Interview || mongoose.model("Interview", interviewSchema);

// ── Helper: attach resumeUrl ──────────────────
const withResumeUrl = (req, doc) => {
  const base = `${req.protocol}://${req.get("host")}`;
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  return {
    ...plain,
    resumeUrl: plain.resumePath
      ? `${base}/uploads/resumes/${path.basename(plain.resumePath)}`
      : null,
  };
};

// ═══════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════

// ── POST /api/interviews/apply ────────────────
//    Candidate submits application form
router.post("/apply", upload.single("resume"), async (req, res) => {
  try {
    const { companyId, companyName, name, email, mobile, experience, years, role, notes } = req.body;

    if (!name || !email || !mobile || !role || !experience) {
      return res.status(400).json({ msg: "Name, email, mobile, role, and experience are required" });
    }
    if (!req.file) {
      return res.status(400).json({ msg: "Resume file is required" });
    }

    const doc = await Interview.create({
      companyId:   companyId   || "DEFAULT",
      companyName: companyName || "M Business",
      name,
      email,
      mobile,
      experience,
      years:       years || "",
      role,
      notes:       notes || "",
      resumeName:  req.file.originalname,
      resumePath:  req.file.filename,
      status:      "Pending",
    });

    res.status(201).json({ msg: "Application submitted successfully", id: doc._id });
  } catch (err) {
    console.error("Interview apply error:", err);
    res.status(500).json({ msg: err.message || "Server error" });
  }
});

// ── GET /api/interviews ───────────────────────
//    Admin: list all candidates (search / filter / paginate)
//    Query: ?search= &status= &experience= &page=1 &limit=20
router.get("/", async (req, res) => {
  try {
    const { search = "", status = "", experience = "", page = 1, limit = 20 } = req.query;

    const query = {};
    if (status)     query.status     = status;
    if (experience) query.experience = experience;
    if (search) {
      const re = new RegExp(search, "i");
      query.$or = [{ name: re }, { email: re }, { mobile: re }, { role: re }];
    }

    const total = await Interview.countDocuments(query);
    const docs  = await Interview.find(query)
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    const base = `${req.protocol}://${req.get("host")}`;
    const data = docs.map((d) => ({
      ...d.toObject(),
      resumeUrl: d.resumePath
        ? `${base}/uploads/resumes/${path.basename(d.resumePath)}`
        : null,
    }));

    res.json({ total, page: +page, limit: +limit, data });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ── GET /api/interviews/stats ─────────────────
//    Admin: dashboard counts
router.get("/stats", async (req, res) => {
  try {
    const [total, pending, hired, rejected] = await Promise.all([
      Interview.countDocuments(),
      Interview.countDocuments({ status: "Pending"  }),
      Interview.countDocuments({ status: "Hired"    }),
      Interview.countDocuments({ status: "Rejected" }),
    ]);
    res.json({ total, pending, hired, rejected });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ── GET /api/interviews/:id ───────────────────
//    Single candidate detail
router.get("/:id", async (req, res) => {
  try {
    const doc = await Interview.findById(req.params.id);
    if (!doc) return res.status(404).json({ msg: "Candidate not found" });
    res.json(withResumeUrl(req, doc));
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ── PATCH /api/interviews/:id/status ─────────
//    Admin: Pending → Hired / Rejected
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Hired", "Rejected"].includes(status)) {
      return res.status(400).json({ msg: "status must be Pending | Hired | Rejected" });
    }
    const doc = await Interview.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!doc) return res.status(404).json({ msg: "Candidate not found" });
    res.json({ msg: "Status updated", status: doc.status });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ── PATCH /api/interviews/:id/interview-date ──
//    Admin: set / update interview date
router.patch("/:id/interview-date", async (req, res) => {
  try {
    const { interviewDate } = req.body;
    const doc = await Interview.findByIdAndUpdate(
      req.params.id,
      { interviewDate: interviewDate ? new Date(interviewDate) : null },
      { new: true }
    );
    if (!doc) return res.status(404).json({ msg: "Candidate not found" });
    res.json({ msg: "Interview date updated", interviewDate: doc.interviewDate });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ── DELETE /api/interviews/:id ────────────────
//    Admin: delete candidate + remove resume file
router.delete("/:id", async (req, res) => {
  try {
    const doc = await Interview.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ msg: "Candidate not found" });

    // Remove resume file from disk
    if (doc.resumePath) {
      const filePath = path.join(UPLOAD_DIR, path.basename(doc.resumePath));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ msg: "Candidate deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ── Multer error handler ──────────────────────
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE")
      return res.status(400).json({ msg: "File too large (max 5MB)" });
    return res.status(400).json({ msg: err.message });
  }
  if (err) return res.status(400).json({ msg: err.message });
  next();
});

module.exports = router;
