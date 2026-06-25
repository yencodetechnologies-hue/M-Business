// Backend/controllers/financeController.js
const Income = require("../models/IncomeModel");
const Expense = require("../models/AccountModels");
const Bank = require("../models/BankModel");
const Invoice = require("../models/InvoiceModels");
const Vendor = require("../models/VendorModel");

/* ─── helpers ──────────────────────────────────────────────── */
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Parse "Month YYYY" → { start, end } Date range */
function parsePeriod(period) {
    // period examples: "June 2026", "This Month — June 2026", "January 2025"
    const clean = (period || "").replace(/^This Month\s*—\s*/i, "").trim();
    const [monthName, year] = clean.split(" ");
    const monthIdx = new Date(`${monthName} 1, ${year}`).getMonth();
    if (isNaN(monthIdx)) return null;
    const y = parseInt(year, 10);
    const start = new Date(y, monthIdx, 1);
    const end = new Date(y, monthIdx + 1, 1);
    return { start, end };
}

/** Sum array of docs by `amount` field */
const sumAmount = (docs) => docs.reduce((s, d) => s + (Number(d.amount) || 0), 0);

/* ─── KPIs ─────────────────────────────────────────────────── */
exports.getKPIs = async (req, res) => {
    try {
        const cid = req.companyId || "";
        const period = parsePeriod(req.query.period);

        let incFilter = cid ? { companyId: cid } : {};
        let expFilter = cid ? { companyId: cid } : {};
        let prevIncFilter = { ...incFilter };
        let prevExpFilter = { ...expFilter };

        if (period) {
            const { start, end } = period;
            // Previous month window
            const prevStart = new Date(start); prevStart.setMonth(prevStart.getMonth() - 1);
            const prevEnd = new Date(end); prevEnd.setMonth(prevEnd.getMonth() - 1);

            incFilter = { ...incFilter, createdAt: { $gte: start, $lt: end } };
            expFilter = { ...expFilter, createdAt: { $gte: start, $lt: end } };
            prevIncFilter = { ...prevIncFilter, createdAt: { $gte: prevStart, $lt: prevEnd } };
            prevExpFilter = { ...prevExpFilter, createdAt: { $gte: prevStart, $lt: prevEnd } };
        }

        const [incomes, expenses, prevIncomes, prevExpenses] = await Promise.all([
            Income.find(incFilter).lean(),
            Expense.find(expFilter).lean(),
            Income.find(prevIncFilter).lean(),
            Expense.find(prevExpFilter).lean(),
        ]);

        const totalIncome = sumAmount(incomes);
        const totalExpenses = sumAmount(expenses);
        const netProfit = totalIncome - totalExpenses;

        const prevIncome = sumAmount(prevIncomes);
        const prevExpense = sumAmount(prevExpenses);

        const incomeChange = prevIncome ? Math.round(((totalIncome - prevIncome) / prevIncome) * 100) : 0;
        const expenseChange = prevExpense ? Math.round(((totalExpenses - prevExpense) / prevExpense) * 100) : 0;
        const profitMargin = totalIncome ? Math.round((netProfit / totalIncome) * 100) : 0;

        // Pending receivables — invoices not fully paid
        const invFilter = cid ? { companyId: cid } : {};
        const invoices = await Invoice.find({ ...invFilter, status: { $in: ["pending", "sent", "unpaid", "part_paid", "overdue"] } }).lean();
        const pendingReceivables = invoices.reduce((s, inv) => {
            const total = Number(inv.total) || 0;
            const paid = Number(inv.amountPaid) || 0;
            return s + Math.max(0, total - paid);
        }, 0);
        const pendingInvoices = invoices.length;

        // Vendor payables — amount minus paidAmount
        const vendors = await Vendor.find(cid ? { companyId: cid } : {}).lean();
        const vendorPayables = vendors.reduce((s, v) => s + Math.max(0, (Number(v.amount) || 0) - (Number(v.paidAmount) || 0)), 0);
        const overdueVendors = vendors.filter(v => (Number(v.amount) || 0) > (Number(v.paidAmount) || 0)).length;

        res.json({
            totalIncome, totalExpenses, netProfit,
            incomeChange, expenseChange, profitMargin,
            pendingReceivables, pendingInvoices,
            vendorPayables, overdueVendors,
        });
    } catch (err) {
        console.error("getKPIs error:", err);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

/* ─── Transactions ─────────────────────────────────────────── */
exports.getTransactions = async (req, res) => {
    try {
        const cid = req.companyId || "";
        const period = parsePeriod(req.query.period);
        const limit = parseInt(req.query.limit, 10) || 20;

        let incFilter = cid ? { companyId: cid } : {};
        let expFilter = cid ? { companyId: cid } : {};
        if (period) {
            const { start, end } = period;
            incFilter = { ...incFilter, createdAt: { $gte: start, $lt: end } };
            expFilter = { ...expFilter, createdAt: { $gte: start, $lt: end } };
        }

        const [incomes, expenses] = await Promise.all([
            Income.find(incFilter).sort({ createdAt: -1 }).limit(limit).lean(),
            Expense.find(expFilter).sort({ createdAt: -1 }).limit(limit).lean(),
        ]);

        const toRow = (doc, type) => ({
            _id: doc._id,
            date: doc.date
                ? new Date(doc.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                : new Date(doc.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
            description: doc.title || doc.description || "—",
            category: doc.category || "—",
            type,
            amount: Number(doc.amount) || 0,
            status: type === "Income"
                ? (doc.status === "Received" ? "Paid" : doc.status || "Pending")
                : (doc.status === "Approved" ? "Paid" : doc.status || "Pending"),
        });

        const rows = [
            ...incomes.map(d => toRow(d, "Income")),
            ...expenses.map(d => toRow(d, "Expense")),
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);

        res.json(rows);
    } catch (err) {
        console.error("getTransactions error:", err);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

/* ─── Bank Accounts ────────────────────────────────────────── */
exports.getBankAccounts = async (req, res) => {
    try {
        const filter = req.companyId ? { companyId: req.companyId } : {};
        const banks = await Bank.find(filter).sort({ createdAt: 1 }).lean();

        const result = banks.map((b, i) => ({
            _id: b._id,
            bank: b.bankName,
            type: b.accountType || "Current",
            last4: (b.accountNo || "").slice(-4),
            balance: Number(b.balance) || 0,
            synced: b.lastSynced
                ? timeSince(new Date(b.lastSynced))
                : "recently",
            primary: i === 0,
        }));

        res.json(result);
    } catch (err) {
        console.error("getBankAccounts error:", err);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

/* ─── Expense Breakdown ────────────────────────────────────── */
exports.getExpenseBreakdown = async (req, res) => {
    try {
        const cid = req.companyId || "";
        const period = parsePeriod(req.query.period);
        let filter = cid ? { companyId: cid } : {};
        if (period) {
            filter = { ...filter, createdAt: { $gte: period.start, $lt: period.end } };
        }

        const expenses = await Expense.find(filter).lean();
        const map = {};
        expenses.forEach(e => {
            const cat = e.category || "Miscellaneous";
            map[cat] = (map[cat] || 0) + (Number(e.amount) || 0);
        });

        const total = Object.values(map).reduce((s, v) => s + v, 0) || 1;
        const breakdown = Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([category, amount]) => ({
                category,
                amount,
                percent: Math.round((amount / total) * 100),
            }));

        res.json(breakdown);
    } catch (err) {
        console.error("getExpenseBreakdown error:", err);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

/* ─── Monthly Cashflow (last 6 months) ─────────────────────── */
exports.getCashflow = async (req, res) => {
    try {
        const cid = req.companyId || "";
        const now = new Date();

        const months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
            return { year: d.getFullYear(), month: d.getMonth(), label: SHORT_MONTHS[d.getMonth()] };
        });

        const earliest = new Date(months[0].year, months[0].month, 1);
        const latest = new Date(months[5].year, months[5].month + 1, 1);

        const baseFilter = cid ? { companyId: cid, createdAt: { $gte: earliest, $lt: latest } } : { createdAt: { $gte: earliest, $lt: latest } };

        const [incomes, expenses] = await Promise.all([
            Income.find(baseFilter).lean(),
            Expense.find(baseFilter).lean(),
        ]);

        const result = months.map(({ year, month, label }) => {
            const start = new Date(year, month, 1);
            const end = new Date(year, month + 1, 1);
            const inc = incomes.filter(d => { const t = new Date(d.createdAt); return t >= start && t < end; });
            const exp = expenses.filter(d => { const t = new Date(d.createdAt); return t >= start && t < end; });
            return { month: label, income: sumAmount(inc), expense: sumAmount(exp) };
        });

        res.json(result);
    } catch (err) {
        console.error("getCashflow error:", err);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

/* ─── util ──────────────────────────────────────────────────── */
function timeSince(date) {
    const diff = Math.floor((Date.now() - date) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}