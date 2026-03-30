const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
require("dotenv").config();

const app = express();
app.use(cors({
  origin: [
    "http://localhost:3000",              // local frontend
    "https://m-business-tau.vercel.app"  // deployed frontend
  ],
  credentials: true
}));
app.use(express.json());

const authRoutes          = require("./routes/authroutes");
const clientRoutes        = require("./routes/clientroutes");
const employeeRoutes      = require("./routes/employeeRoutes");
const managerRoutes       = require("./routes/managerRoutes");
const projectRoutes       = require("./routes/projectRoutes");
const projectStatusRoutes = require("./routes/projectstatusroutes");
const TaskPage            = require("./routes/taskroutes");
const Group               = require("./routes/grouproutes");
const clientDashRoutes    = require("./routes/clientdashboardroutes");
const Invoices            = require("./routes/invoiceroutes");
const eventRoutes         = require("./routes/eventroutes");
const accountRoutes       = require("./routes/accountroutes");
const reportRoutes        = require("./routes/reportroutes");
const uploadRoutes        = require("./routes/uploadroutes");
const employeeDashRoutes  = require("./routes/employeedashboardroutes");
const QuotationRoutes     = require("./routes/quotationroutes");
const interviewRoutes     = require("./routes/interviewroutes");
const userRoutes = require('./routes/userroutes');
// Static files (local resume storage)
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/users",            userRoutes);
app.use("/api/interviews",        interviewRoutes);
app.use("/api/auth",              authRoutes);
app.use("/api/clients",           clientRoutes);
app.use("/api/employees",         employeeRoutes);
app.use("/api/managers",          managerRoutes);
app.use("/api/projects",          projectRoutes);
app.use("/api/project-status",    projectStatusRoutes);
app.use("/api/tasks",             TaskPage);
app.use("/api/groups",            Group);
app.use("/api/client-dashboard",  clientDashRoutes);
app.use("/api/invoices",          Invoices);
app.use("/api/events",            eventRoutes);
app.use("/api/accounts",          accountRoutes);
app.use("/api/reports",           reportRoutes);
app.use("/api/upload",            uploadRoutes);
app.use("/api/employee-dashboard",employeeDashRoutes);
app.use("/api/quotations",        QuotationRoutes);
app.use("/uploads", express.static("uploads"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => console.error("❌ MongoDB Error:", err));