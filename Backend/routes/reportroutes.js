// routes/reports.js
const express = require("express");
const router = express.Router();

// Import all relevant models to build reports dynamically
let Client, Employee, Project, Invoice, Manager;
try { Client   = require("../models/Client");   } catch(e) {}
try { Employee = require("../models/Employee"); } catch(e) {}
try { Project  = require("../models/Project");  } catch(e) {}
try { Invoice  = require("../models/Invoice");  } catch(e) {}
try { Manager  = require("../models/Manager");  } catch(e) {}

// GET /api/reports — auto-generated summary report from DB
router.get("/", async (req, res) => {
  try {
    const [clients, employees, projects, managers] = await Promise.all([
      Client   ? Client.find()   : [],
      Employee ? Employee.find() : [],
      Project  ? Project.find()  : [],
      Manager  ? Manager.find()  : [],
    ]);

    // --- Monthly Revenue (from projects with budget, current month) ---
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7); // "YYYY-MM"
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toISOString().slice(0, 7);
    const thisQ = `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`;

    const projThisMonth  = projects.filter(p => (p.createdAt||"").toString().slice(0,7) === thisMonth);
    const projLastMonth  = projects.filter(p => (p.createdAt||"").toString().slice(0,7) === lastMonth);
    const projCompleted  = projects.filter(p => p.status === "Completed");
    const projInProgress = projects.filter(p => p.status === "In Progress");
    const projPending    = projects.filter(p => p.status === "Pending");

    // Sum budgets (strip ₹ commas etc.)
    const sumBudget = (arr) =>
      arr.reduce((acc, p) => {
        const n = parseFloat((p.budget || "0").toString().replace(/[^0-9.]/g, ""));
        return acc + (isNaN(n) ? 0 : n);
      }, 0);

    const fmtINR = (n) =>
      n >= 100000
        ? `₹${(n / 100000).toFixed(2)}L`
        : `₹${n.toLocaleString("en-IN")}`;

    const reports = [
      {
        id: "RPT001",
        type: "Monthly Revenue",
        range: thisMonth,
        total: projThisMonth.length,
        revenue: fmtINR(sumBudget(projThisMonth)),
        done: projThisMonth.filter(p => p.status === "Completed").length,
        pending: projThisMonth.filter(p => p.status !== "Completed").length,
      },
      {
        id: "RPT002",
        type: "Project Summary",
        range: thisQ,
        total: projects.length,
        revenue: fmtINR(sumBudget(projects)),
        done: projCompleted.length,
        pending: projInProgress.length + projPending.length,
      },
      {
        id: "RPT003",
        type: "Client Activity",
        range: thisMonth,
        total: clients.length,
        revenue: fmtINR(sumBudget(projThisMonth)),
        done: clients.filter(c => c.status === "Active").length,
        pending: clients.filter(c => c.status !== "Active").length,
      },
      {
        id: "RPT004",
        type: "Team Overview",
        range: `${now.getFullYear()}`,
        total: employees.length + managers.length,
        revenue: `${employees.length} Emp · ${managers.length} Mgr`,
        done: [...employees, ...managers].filter(m => m.status === "Active").length,
        pending: [...employees, ...managers].filter(m => m.status !== "Active").length,
      },
    ];

    res.json(reports);
  } catch (err) {
    res.status(500).json({ msg: "Failed to generate reports", error: err.message });
  }
});

module.exports = router;
