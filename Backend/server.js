const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
// Allow localhost with any port for local development
const isLocalhost = (origin) => origin && origin.startsWith('http://localhost') || origin?.startsWith('http://127.0.0.1');

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow any localhost/127.0.0.1 origin for development
    if (isLocalhost(origin)) return callback(null, true);
    
    // Allow specific deployed origins
    const allowedOrigins = [
      "https://m-business-tau.vercel.app",
      "https://m-business-r2vd.onrender.com"
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

app.use((req, res, next) => {
  req.companyId = req.headers['x-company-id'] || "";
  next();
});

const authRoutes = require("./routes/authroutes");
const clientRoutes = require("./routes/clientroutes");
const employeeRoutes = require("./routes/employeeroutes");
const managerRoutes = require("./routes/managerroutes");
const projectRoutes = require("./routes/projectroutes");
const projectStatusRoutes = require("./routes/projectstatusroutes");
const TaskPage = require("./routes/taskroutes");
const Group = require("./routes/grouproutes");
const clientDashRoutes = require("./routes/clientdashboardroutes");
const Invoices = require("./routes/invoiceroutes");
const eventRoutes = require("./routes/eventroutes");
const accountRoutes = require("./routes/accountroutes");
const reportRoutes = require("./routes/reportroutes");
const uploadRoutes = require("./routes/uploadroutes");
const employeeDashRoutes = require("./routes/employeedashboardroutes");
const QuotationRoutes = require("./routes/quotationroutes");
const interviewRoutes = require("./routes/interviewroutes");
const userRoutes = require("./routes/userroutes");
const ProposalRoutes = require("./routes/proposalroutes");
const subscriptionRoutes = require("./routes/subscriptionroutes");

// Static files (local resume storage)
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", userRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/managers", managerRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/project-status", projectStatusRoutes);
app.use("/api/tasks", TaskPage);
app.use("/api/groups", Group);
app.use("/api/client-dashboard", clientDashRoutes);
app.use("/api/invoices", Invoices);
app.use("/api/events", eventRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/employee-dashboard", employeeDashRoutes);
app.use("/api/quotations", QuotationRoutes);
app.use("/api/proposals", ProposalRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/upload", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("Server is running!");
});

// -------------------- DATABASE CONNECTION & SERVER START --------------------
// Workaround for local network DNS blocking SRV records (ECONNREFUSED)
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
  });