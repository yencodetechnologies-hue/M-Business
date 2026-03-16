const express = require("express");
const cors    = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

// ── Existing Routes ───────────────────────────────────────────────────────────
const userRoutes          = require("./routes/userroutes");
const clientRoutes        = require("./routes/clientroutes");
const employeeRoutes      = require("./routes/employeeroutes");
const managerRoutes       = require("./routes/managerroutes");
const projectRoutes       = require("./routes/projectroutes");
const authRoutes          = require("./routes/authroutes");
const uploadRoutes        = require("./routes/uploadroutes");
const projectStatusRoutes = require("./routes/projectstatusroutes");

// ── New Task Board Routes ─────────────────────────────────────────────────────
const taskRoutes  = require("./routes/taskroutes");
const groupRoutes = require("./routes/grouproutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Existing API ──────────────────────────────────────────────────────────────
app.use("/api/user",           userRoutes);
app.use("/api/clients",        clientRoutes);
app.use("/api/employees",      employeeRoutes);
app.use("/api/managers",       managerRoutes);
app.use("/api/projects",       projectRoutes);
app.use("/api/auth",           authRoutes);
app.use("/api/upload",         uploadRoutes);
app.use("/api/project-status", projectStatusRoutes);

// ── Task Board API ────────────────────────────────────────────────────────────
app.use("/api/tasks",  taskRoutes);
app.use("/api/groups", groupRoutes);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  // Seed default groups only if none exist
  const { seedDefaultGroups } = require("./controllers/groupController");
  await seedDefaultGroups();

  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

start();
