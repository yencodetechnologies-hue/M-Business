// Backend/routes/financeroutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/financeController");

router.get("/kpis", controller.getKPIs);
router.get("/transactions", controller.getTransactions);
router.get("/bank-accounts", controller.getBankAccounts);
router.get("/expense-breakdown", controller.getExpenseBreakdown);
router.get("/cashflow", controller.getCashflow);

module.exports = router;