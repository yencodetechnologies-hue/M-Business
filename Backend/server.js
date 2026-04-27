const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const subscriptionCron = require("./jobs/subscriptionCron");
const app = express();
// Allow localhost with any port for local development
const isLocalhost = (origin) =>
  origin && (
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1') ||
        origin.startsWith('http://192.168.')
    
  );

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (isLocalhost(origin)) return callback(null, true);

    const allowedOrigins = [
      "https://m-business-tau.vercel.app",
      "https://mbusiness.octosofttechnologies.in/"
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
const integrationRoutes = require("./routes/integrationRoutes");
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
const subadminRoutes = require("./routes/subadminroutes");
const packageRoutes = require("./routes/packageroutes");
const emailRoutes = require("./routes/emailroutes");
const paymentRoutes = require("./routes/paymentroutes");
const vendorRoutes = require("./routes/vendorRoutes");
const rolePermissionRoutes = require("./routes/rolePermissionRoutes");

// Static files (local resume storage)
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", userRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/managers", managerRoutes);
app.use("/api/subadmins", subadminRoutes);
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
app.use("/api/packages", packageRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/role-permissions", rolePermissionRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/upload", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Debug vendor route
app.get("/debug-vendors", (req, res) => {
  try {
    const vendorRoutes = require('./routes/vendorRoutes');
    res.json({ 
      message: "Vendor routes loaded successfully",
      routes: [
        "POST /api/vendors - Create vendor",
        "GET /api/vendors - Get all vendors", 
        "PUT /api/vendors/:id - Update vendor",
        "DELETE /api/vendors/:id - Delete vendor"
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test email endpoint
const { sendEmail } = require("./config/email");
app.get("/test-email", async (req, res) => {
  console.log("SMTP Config:", {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER ? "Set" : "Not set",
    pass: process.env.SMTP_PASS ? "Set" : "Not set"
  });
  const result = await sendEmail(process.env.SMTP_USER, "Test Email", "<h1>Test</h1>");
  res.json(result);
});

// -------------------- DATABASE CONNECTION & SERVER START --------------------
// Workaround for local network DNS blocking SRV records (ECONNREFUSED)
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoUri = process.env.MONGO_URI;
if (!mongoUri || typeof mongoUri !== 'string' || !mongoUri.trim()) {
  console.error('❌ Missing or invalid MONGO_URI environment variable. Please check Backend/.env');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => {
    console.log("✅ MongoDB Connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
    subscriptionCron();
  })
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
  });