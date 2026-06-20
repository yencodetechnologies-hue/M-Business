// ------------------------------------------------------------
//  AccountsPage.jsx  — exports BOTH AccountsPage & ExpensesPage
//  Dashboard.jsx usage:
//    import AccountsPage, { ExpensesPage } from "./AccountsPage";
//    {validActive === "accounts" && <AccountsPage THEME={THEME} />}
//    {validActive === "expenses" && <ExpensesPage THEME={THEME} />}
// ------------------------------------------------------------

import { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../config";
import { T as GLOBAL_T } from "../index";
import ModernAccountsView from "./ModernAccountsView";
import FinDashboard from "./FinDashboard";
import FinIncome from "./FinIncome";
import FinExpenses from "./FinExpenses";
import FinVendors from "./FinVendors";
import FinBank from "./FinBank";
import FinReports from "./FinReports";
import AuditorLogin from "./AuditorLogin";
import AuditorPortal from "./AuditorPortal";

// ── Constants ---------------------------------------------
const ACCOUNTS_API = `${BASE_URL}/api/accounts`;
const EXPENSES_API = `${BASE_URL}/api/expenses`;
const INCOME_API = `${BASE_URL}/api/income`;

const formatCurrency = (amount, symbol = "INR", compact = false, disableCompact = false) => {
  const num = Number(amount) || 0;
  const absNum = Math.abs(num);

  if (!disableCompact && ((compact && absNum >= 100000) || absNum >= 10000000)) {
    try {
      const isINR = symbol === "INR";
      const formatter = new Intl.NumberFormat(isINR ? 'en-IN' : 'en-US', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 2
      });
      return `${symbol}${formatter.format(num)}`;
    } catch (e) {
      // Fallback
    }
  }

  const isINR = symbol === "INR";
  return `${symbol}${num.toLocaleString(isINR ? "en-IN" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// ── Shared UI components --------------------------------------
function Modal({ title, onClose, children, THEME }) {
  const isExpense = title.toLowerCase().includes("expense");
  const isIncome = title.toLowerCase().includes("income");
  const accent = THEME.accent;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.35)",
      backdropFilter: "blur(5px)", zIndex: 1000, display: "flex",
      alignItems: "center", justifyContent: "center", padding: 16
    }}>
      <div style={{
        background: "var(--app-card)", borderRadius: 24, width: "100%", maxWidth: 500,
        maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 25px 60px rgba(var(--app-accent-rgb, 124, 58, 237), 0.15)", border: `1.5px solid var(--app-border)`
      }}>
        <div style={{
          padding: "28px 32px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: `linear-gradient(135deg, ${accent}, ${accent}dd)`, flexShrink: 0, position: "relative", overflow: "hidden"
        }}>
          <div style={{ position: "absolute", right: -15, top: -15, fontSize: 70, opacity: 0.12, transform: "rotate(-15deg)", pointerEvents: "none" }}>{isIncome ? "Cost" : isExpense ? "Payment" : "Edit"}</div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>{title}</h2>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>Financial Entry</div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.15)", border: "none",
            fontSize: 14, cursor: "pointer", color: "#fff", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, fontWeight: 900, transition: "0.2s"
          }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}>Close</button>
        </div>
        <div style={{ overflowY: "auto", padding: "28px 32px", flex: 1, background: "var(--app-card)" }}>{children}</div>
      </div>
    </div>
  );
}

function Toast({ msg, THEME }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: THEME.card,
      border: "1.5px solid #22c55e", borderRadius: 12, padding: "12px 20px",
      fontSize: 13, fontWeight: 700, color: "#22c55e",
      boxShadow: THEME.shadow
    }}>{msg}</div>
  );
}

function Fld({ label, value, onChange, options, type = "text", error, placeholder, prefix, THEME }) {
  const s = {
    width: "100%", border: `1.5px solid ${error ? "#EF4444" : THEME.border}`,
    borderRadius: 14, padding: prefix ? "14px 14px 14px 38px" : "14px 16px",
    fontSize: 15, color: THEME.text, background: THEME.surface,
    boxSizing: "border-box", outline: "none", fontFamily: "inherit", fontWeight: 700,
    transition: "all 0.2s"
  };
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: "block", fontSize: 11, color: THEME.accent, fontWeight: 800,
        letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase", opacity: 0.9
      }}>{label}</label>
      <div style={{ position: "relative" }}>
        {prefix && (
          <span style={{
            position: "absolute", left: 10, top: "50%",
            transform: "translateY(-50%)", color: THEME.muted, fontWeight: 700, fontSize: 13
          }}>
            {prefix}
          </span>
        )}
        {options
          ? <select value={value} onChange={e => onChange(e.target.value)} style={s}>
            {options.map(o => <option key={o}>{o}</option>)}
          </select>
          : <input type={type} value={value} onChange={e => onChange(e.target.value)} style={s} placeholder={placeholder || ""} />}
      </div>
      {error && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>Warning {error}</div>}
    </div>
  );
}

function ExpBadge({ label, colorMap }) {
  const c = (colorMap || {})[label] || "var(--app-accent)";
  return (
    <span style={{
      background: `${c}18`, color: c, border: `1px solid ${c}33`,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700
    }}>
      {label}
    </span>
  );
}

function ClientDropdown({ clients, value, onChange, error, onAddClient, THEME }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = clients.filter(c => (c.clientName || c.name || "").toLowerCase().includes(search.toLowerCase()) || (c.companyName || c.company || "").toLowerCase().includes(search.toLowerCase()));
  const selected = clients.find(c => (c.clientName || c.name) === value);
  return (
    <div style={{ position: "relative" }}>
      <div onClick={() => setOpen(!open)} style={{ width: "100%", border: `1.5px solid ${error ? "#EF4444" : open ? THEME.accent : "var(--app-border)"}`, borderRadius: 12, padding: "12px 36px 12px 14px", fontSize: 14, color: value ? "var(--app-text)" : "var(--app-muted)", background: "var(--app-bg)", cursor: "pointer", userSelect: "none", boxSizing: "border-box", position: "relative", minHeight: 46, fontWeight: 600 }}>
        {value ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: THEME.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{value[0].toUpperCase()}</div>
            <span>{value}</span>
            {selected?.companyName && <span style={{ fontSize: 12, color: THEME.muted }}>({selected.companyName})</span>}
          </div>
        ) : "-- Select Client --"}
        <span style={{ position: "absolute", right: 14, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, fontSize: 12, color: THEME.text, transition: "0.2s" }}>▼</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: THEME.card, border: `1.5px solid ${THEME.border}`, borderRadius: 12, boxShadow: THEME.shadow, zIndex: 999, overflow: "hidden" }}>
          <div style={{ padding: "10px 10px 6px" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12 }}>Search</span>
              <input autoFocus placeholder="Search company..." value={search} onChange={e => setSearch(e.target.value)} onClick={e => e.stopPropagation()} style={{ width: "100%", padding: "7px 10px 7px 30px", border: `1.5px solid ${THEME.border}`, borderRadius: 8, fontSize: 12, background: THEME.surface, color: THEME.text, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filtered.length === 0 ? <div style={{ padding: 14, textAlign: "center", color: THEME.muted, fontSize: 13 }}>No clients found</div>
              : filtered.map((c, i) => {
                const name = c.clientName || c.name || "";
                const isSel = value === name;
                return (
                  <div key={i} onClick={() => { onChange(name); setOpen(false); setSearch(""); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: isSel ? THEME.surface : "transparent" }} onMouseEnter={e => e.currentTarget.style.background = THEME.surface} onMouseLeave={e => e.currentTarget.style.background = isSel ? THEME.surface : "transparent"}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: THEME.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{name[0]?.toUpperCase() || "?"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: THEME.text }}>{name}</div>
                      {c.companyName && <div style={{ fontSize: 11, color: THEME.muted }}>{c.companyName}</div>}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Financial Overview ------------------------------------------
function FinancialOverview({ THEME, income = [], expenses = [] }) {
  const totalIncome = income.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const netBalance = totalIncome - totalExpenses;

  const stats = [
    { t: "Total Income", v: formatCurrency(totalIncome), f: formatCurrency(totalIncome, "₹", false, true), c: "#22c55e", i: "Cost", desc: "Revenue generated" },
    { t: "Total Expenses", v: formatCurrency(totalExpenses), f: formatCurrency(totalExpenses, "₹", false, true), c: "#ef4444", i: "Payment", desc: "Operational costs" },
    { t: "Net Balance", v: formatCurrency(netBalance), f: formatCurrency(netBalance, "₹", false, true), c: netBalance >= 0 ? THEME.accent : "#f43f5e", i: "Bank", desc: "Current liquidity" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
        {stats.map(({ t, v, f, i, c, desc }) => (
          <div key={t} style={{
            background: `linear-gradient(135deg, ${THEME.card}, ${THEME.surface})`,
            borderRadius: 32, padding: 32,
            boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
            border: `1.5px solid ${THEME.border}`,
            position: "relative", overflow: "hidden",
            transition: "transform 0.2s ease"
          }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
            <div style={{ position: "absolute", top: -20, right: -20, fontSize: 100, opacity: 0.05, transform: "rotate(-15deg)" }}>{i}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: `${c}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, boxShadow: `0 8px 20px ${c}20` }}>{i}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: THEME.text, letterSpacing: 1.2, textTransform: "uppercase", opacity: 0.7 }}>{t}</div>
                <div style={{ fontSize: 13, color: THEME.muted, fontWeight: 600 }}>{desc}</div>
              </div>
            </div>
            <div style={{
              fontSize: 36,
              fontWeight: 900,
              color: c,
              letterSpacing: "-1px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }} title={f}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 24 }}>
        <div style={{ background: THEME.card, borderRadius: 32, padding: 32, border: `1.5px solid ${THEME.border}`, boxShadow: "0 10px 40px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>

            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: THEME.text }}>Cash Flow Analysis</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, fontSize: 14, fontWeight: 800 }}>
                <span style={{ color: THEME.text }}>Total Income</span>
                <span style={{ color: "#22c55e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginLeft: 10 }} title={formatCurrency(totalIncome, "₹", false, true)}>{formatCurrency(totalIncome)}</span>
              </div>
              <div style={{ height: 14, background: "#f1f5f9", borderRadius: 7, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg, #22c55e, #4ade80)", width: `${Math.min(100, (totalIncome / (totalIncome + totalExpenses || 1)) * 100)}%`, borderRadius: 7 }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, fontSize: 14, fontWeight: 800 }}>
                <span style={{ color: THEME.text }}>Total Expenses</span>
                <span style={{ color: "#ef4444", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginLeft: 10 }} title={formatCurrency(totalExpenses, "₹", false, true)}>{formatCurrency(totalExpenses)}</span>
              </div>
              <div style={{ height: 14, background: "#f1f5f9", borderRadius: 7, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg, #ef4444, #f87171)", width: `${Math.min(100, (totalExpenses / (totalIncome + totalExpenses || 1)) * 100)}%`, borderRadius: 7 }}></div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: THEME.card, borderRadius: 32, padding: 32, border: `1.5px solid ${THEME.border}`, boxShadow: "0 10px 40px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>

            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: THEME.text }}>Recent Activity</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[...income.map(i => ({ ...i, type: "income" })), ...expenses.map(e => ({ ...e, type: "expense" }))]
              .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
              .slice(0, 5)
              .map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px", borderRadius: 16, background: idx === 0 ? `${THEME.accent}08` : "transparent", transition: "background 0.2s" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: item.type === "income" ? "#dcfce7" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: item.type === "income" ? "0 4px 12px #dcfce7" : "0 4px 12px #fee2e2" }}>
                    {item.type === "income" ? "Cost" : "Payment"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: THEME.text }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: THEME.muted, fontWeight: 600 }}>{new Date(item.createdAt || item.date).toLocaleDateString()} • {item.category}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: item.type === "income" ? "#16a34a" : "#dc2626", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginLeft: 10 }} title={formatCurrency(item.amount, "₹", false, true)}>
                    {item.type === "income" ? "+" : "-"}{formatCurrency(item.amount)}
                  </div>
                </div>
              ))}
            {(income.length === 0 && expenses.length === 0) && <div style={{ textAlign: "center", color: THEME.muted, fontSize: 13, padding: 20 }}>No activity yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page Component ------------------------------------------
export default function AccountsPage({
  THEME: propTheme,
  initialTab = "overview",
  income: propIncome,
  setIncome: propSetIncome,
  fetchIncome: propFetchIncome,
  expenses: propExpenses,
  setExpenses: propSetExpenses,
  fetchExpenses: propFetchExpenses,
  onBack
}) {
  const THEME = propTheme || GLOBAL_T;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [localIncome, setLocalIncome] = useState([]);
  const [localExpenses, setLocalExpenses] = useState([]);
  const [loading, setLoading] = useState(!propIncome || !propExpenses);

  const income = propIncome || localIncome;
  const expenses = propExpenses || localExpenses;

  const setIncome = propSetIncome || setLocalIncome;
  const setExpenses = propSetExpenses || setLocalExpenses;

  const fetchIncome = propFetchIncome || (async () => {
    const r = await axios.get(INCOME_API);
    setLocalIncome(r.data);
    return r.data;
  });

  const fetchExpenses = propFetchExpenses || (async () => {
    const r = await axios.get(EXPENSES_API);
    setLocalExpenses(r.data);
    return r.data;
  });

  useEffect(() => {
    if (propIncome && propExpenses) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [incRes, expRes] = await Promise.all([
          axios.get(INCOME_API),
          axios.get(EXPENSES_API)
        ]);
        setLocalIncome(incRes.data);
        setLocalExpenses(expRes.data);
      } catch (e) {
        console.error("Failed to fetch financial data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [propIncome, propExpenses]);

  const tabStyle = (on) => ({
    padding: "12px 28px", borderRadius: 12, fontSize: 16, fontWeight: 900,
    cursor: "pointer", border: "none",
    background: on ? THEME.accent : "transparent",
    color: on ? "#fff" : THEME.muted,
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: on ? "0 4px 12px rgba(99,102,241,0.25)" : "none"
  });

  if (loading) return <div style={{ textAlign: "center", padding: 100, color: THEME.muted, fontWeight: 800 }}>Action Generating Financial Dashboard...</div>;

  return (
    <div style={{ paddingBottom: 60 }}>
      {onBack && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} style={{ padding: "8px", background: "#E0F2FE", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 20, color: "var(--teal)", display: "flex", alignItems: "center", transition: "all 0.2s" }} title="Back to Dashboard" onMouseEnter={e => e.currentTarget.style.background = "#BAE6FD"} onMouseLeave={e => e.currentTarget.style.background = "#E0F2FE"}>
            <i className="ti ti-arrow-left"></i>
          </button>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>Revenue & Accounts</div>
        </div>
      )}
      <div className="tabs" style={{ marginBottom: 32, display: "flex", gap: 8, overflowX: "auto", flexWrap: "wrap" }}>
        <button onClick={() => setActiveTab("overview")} style={tabStyle(activeTab === "overview")}>
          <i className="ti ti-chart-pie" style={{ marginRight: 6 }} />Overview
        </button>
        <button onClick={() => setActiveTab("income")} style={tabStyle(activeTab === "income")}>
          <i className="ti ti-arrow-bar-down" style={{ marginRight: 6 }} />Income
        </button>
        <button onClick={() => setActiveTab("expenses")} style={tabStyle(activeTab === "expenses")}>
          <i className="ti ti-arrow-bar-up" style={{ marginRight: 6 }} />Expenses
        </button>
        <button onClick={() => setActiveTab("vendors")} style={tabStyle(activeTab === "vendors")}>
          <i className="ti ti-truck" style={{ marginRight: 6 }} />Vendors
        </button>
        <button onClick={() => setActiveTab("banks")} style={tabStyle(activeTab === "banks")}>
          <i className="ti ti-building-bank" style={{ marginRight: 6 }} />Bank Accounts
        </button>
        <button onClick={() => setActiveTab("reports")} style={tabStyle(activeTab === "reports")}>
          <i className="ti ti-file-analytics" style={{ marginRight: 6 }} />Reports
        </button>
        <button onClick={() => setActiveTab("auditor")} style={{ ...tabStyle(activeTab === "auditor"), background: activeTab === "auditor" ? "#8B5CF6" : "transparent", color: activeTab === "auditor" ? "#fff" : "#718096" }}>
          <i className="ti ti-shield-check" style={{ marginRight: 6 }} />Auditor Portal
        </button>
      </div>

      <div>
        {activeTab === "overview" && <FinDashboard THEME={THEME} income={income} expenses={expenses} />}
        {activeTab === "income" && <FinIncome THEME={THEME} income={income} setIncome={setIncome} fetchIncome={fetchIncome} />}
        {activeTab === "expenses" && <FinExpenses THEME={THEME} expenses={expenses} setExpenses={setExpenses} fetchExpenses={fetchExpenses} />}
        {activeTab === "vendors" && <FinVendors THEME={THEME} />}
        {activeTab === "banks" && <FinBank THEME={THEME} />}
        {activeTab === "reports" && <FinReports THEME={THEME} />}
        {activeTab === "auditor" && <AuditorLogin onLogin={() => setActiveTab("auditor-portal")} />}
        {activeTab === "auditor-portal" && <AuditorPortal onBack={() => setActiveTab("auditor")} />}
      </div>
    </div>
  );
}

// ── Expenses Page Component -------------------------------------
const CATEGORIES = ["Food", "Travel", "Office", "Utilities", "Marketing", "Salary", "Miscellaneous"];
const CATEGORY_COLOR = { Food: "#f59e0b", Travel: "#3b82f6", Office: "#7c3aed", Utilities: "#06b6d4", Marketing: "#ec4899", Salary: "#22c55e", Miscellaneous: "#64748b" };
const CATEGORY_ICON = { Food: "Food", Travel: "Travel", Office: "Company", Utilities: "Tip", Marketing: "Marketing", Salary: "Cost", Miscellaneous: "Package" };
const STATUS_COLOR = { Pending: "#f59e0b", Approved: "#22c55e", Rejected: "#ef4444" };

export function ExpensesPage({ THEME, expenses = [], setExpenses, fetchExpenses }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ title: "", category: "Office", expenseType: "Operational", paymentMode: "Cash", amount: "", status: "Pending" });
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.title || !form.amount) return alert("Please fill required fields");
    setSaving(true);
    try {
      const res = await axios.post(EXPENSES_API, { ...form, amount: Number(form.amount) });
      setExpenses(prev => [res.data, ...prev]);
      setToast("Success Expense Added!");
      setModal(null);
      setTimeout(() => setToast(""), 3000);
    } catch (e) {
      alert("Save failed");
    } finally { setSaving(false); }
  };

  return (
    <>
      <Toast msg={toast} THEME={THEME} />

      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <div className="page-title">Expenses</div>
          <div className="page-sub">Track and manage all business outgoings</div>
        </div>
        <div className="header-actions">
          <button className="filter-btn"><i className="ti ti-filter" style={{ fontSize: 14 }}></i> Filter</button>
          <button className="filter-btn"><i className="ti ti-calendar" style={{ fontSize: 14 }}></i> May 2026</button>
          <button className="filter-btn"><i className="ti ti-download" style={{ fontSize: 14 }}></i> Export</button>
          <button onClick={() => setModal("add")} className="create-btn"><i className="ti ti-plus" style={{ fontSize: 15 }}></i> Record Expense</button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card-inner">
            <div className="stat-icon" style={{ background: "var(--red-bg)", color: "var(--red)" }}><i className="ti ti-credit-card-pay"></i></div>
            <div>
              <div className="stat-num">{formatCurrency(expenses.reduce((s, e) => s + Number(e.amount || 0), 0), "₹", true)}</div>
              <div className="stat-label">Total Expenses</div>
              <div className="stat-trend down"><i className="ti ti-trending-down" style={{ fontSize: 11 }}></i>{formatCurrency(0)} vs last month</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-inner">
            <div className="stat-icon" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}><i className="ti ti-clock"></i></div>
            <div>
              <div className="stat-num">{formatCurrency(expenses.filter(e => e.status === "Pending").reduce((s, e) => s + Number(e.amount || 0), 0), "₹", true)}</div>
              <div className="stat-label">Pending Approval</div>
              <div className="stat-trend neutral"><i className="ti ti-minus" style={{ fontSize: 11 }}></i>{expenses.filter(e => e.status === "Pending").length} claims</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-inner">
            <div className="stat-icon" style={{ background: "var(--green-bg)", color: "var(--green)" }}><i className="ti ti-building-store"></i></div>
            <div>
              <div className="stat-num">{formatCurrency(expenses.filter(e => e.expenseType === "Vendor").reduce((s, e) => s + Number(e.amount || 0), 0), "₹", true)}</div>
              <div className="stat-label">Vendor Payments</div>
              <div className="stat-trend neutral"><i className="ti ti-minus" style={{ fontSize: 11 }}></i>Active</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-inner">
            <div className="stat-icon" style={{ background: "var(--blue-bg)", color: "var(--blue)" }}><i className="ti ti-users"></i></div>
            <div>
              <div className="stat-num">{formatCurrency(expenses.filter(e => e.expenseType === "Salary" || e.category === "Salary").reduce((s, e) => s + Number(e.amount || 0), 0), "₹", true)}</div>
              <div className="stat-label">Payroll & Teams</div>
              <div className="stat-trend down"><i className="ti ti-trending-down" style={{ fontSize: 11 }}></i>Cleared</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="main-grid">

        <div>
          {/* CATEGORY CARDS */}
          <div className="category-grid" style={{ marginBottom: 20 }}>
            <div className="cat-card">
              <div className="cat-icon" style={{ background: "var(--teal-lighter)", color: "var(--teal)" }}><i className="ti ti-building"></i></div>
              <div className="cat-name">Office & Rent</div>
              <div className="cat-amount">{formatCurrency(expenses.filter(e => e.category === "Office").reduce((s, e) => s + Number(e.amount || 0), 0), "₹", true)}</div>
              <div className="cat-count">{expenses.filter(e => e.category === "Office").length} entries</div>
              <div className="cat-bar"><div className="cat-fill" style={{ width: expenses.length > 0 ? (expenses.filter(e => e.category === "Office").length / expenses.length * 100) + "%" : "0%", background: "var(--teal)" }}></div></div>
            </div>
            <div className="cat-card">
              <div className="cat-icon" style={{ background: "var(--purple-bg)", color: "var(--purple)" }}><i className="ti ti-server"></i></div>
              <div className="cat-name">Tech & Software</div>
              <div className="cat-amount">{formatCurrency(expenses.filter(e => e.category === "Utilities").reduce((s, e) => s + Number(e.amount || 0), 0), "₹", true)}</div>
              <div className="cat-count">{expenses.filter(e => e.category === "Utilities").length} entries</div>
              <div className="cat-bar"><div className="cat-fill" style={{ width: expenses.length > 0 ? (expenses.filter(e => e.category === "Utilities").length / expenses.length * 100) + "%" : "0%", background: "var(--purple)" }}></div></div>
            </div>
            <div className="cat-card">
              <div className="cat-icon" style={{ background: "var(--pink-bg)", color: "var(--pink)" }}><i className="ti ti-speakerphone"></i></div>
              <div className="cat-name">Marketing</div>
              <div className="cat-amount">{formatCurrency(expenses.filter(e => e.category === "Marketing").reduce((s, e) => s + Number(e.amount || 0), 0), "₹", true)}</div>
              <div className="cat-count">{expenses.filter(e => e.category === "Marketing").length} entries</div>
              <div className="cat-bar"><div className="cat-fill" style={{ width: expenses.length > 0 ? (expenses.filter(e => e.category === "Marketing").length / expenses.length * 100) + "%" : "0%", background: "var(--pink)" }}></div></div>
            </div>
            <div className="cat-card">
              <div className="cat-icon" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}><i className="ti ti-plane-departure"></i></div>
              <div className="cat-name">Travel & Food</div>
              <div className="cat-amount">{formatCurrency(expenses.filter(e => e.category === "Travel" || e.category === "Food").reduce((s, e) => s + Number(e.amount || 0), 0), "₹", true)}</div>
              <div className="cat-count">{expenses.filter(e => e.category === "Travel" || e.category === "Food").length} entries</div>
              <div className="cat-bar"><div className="cat-fill" style={{ width: expenses.length > 0 ? (expenses.filter(e => e.category === "Travel" || e.category === "Food").length / expenses.length * 100) + "%" : "0%", background: "var(--amber)" }}></div></div>
            </div>
          </div>

          {expenses.length === 0 && (
            <div className="zero-banner" style={{ marginBottom: 20 }}>
              <div className="zb-icon"><i className="ti ti-receipt"></i></div>
              <div>
                <div className="zb-title">No expenses recorded yet</div>
                <div className="zb-sub">Start tracking your business outgoings. You can upload receipts, categorize spending, and track vendor payments right here.</div>
                <div className="zb-actions">
                  <button className="zb-btn-primary" onClick={() => setModal("add")}><i className="ti ti-plus" style={{ fontSize: 14 }}></i> Add First Expense</button>
                </div>
              </div>
            </div>
          )}

          {/* TABLE */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Recent Expenses</span>
              <div className="panel-right">
                <button className="add-exp-btn" onClick={() => setModal("add")}><i className="ti ti-plus"></i> Add</button>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Expense</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="exp-cell">
                          <div className="exp-icon" style={{ background: e.status === "Pending" ? "var(--amber-bg)" : e.status === "Rejected" ? "var(--red-bg)" : "var(--surface2)", color: e.status === "Pending" ? "var(--amber)" : e.status === "Rejected" ? "var(--red)" : "var(--text)" }}>
                            <i className={CATEGORY_ICON[e.category] ? "ti ti-receipt" : "ti ti-file-invoice"}></i>
                          </div>
                          <div>
                            <div className="exp-name">{e.title}</div>
                            <div className="receipt-chip"><i className="ti ti-paperclip"></i> No receipt</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 16 }}>{CATEGORY_ICON[e.category] || "Package"}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{e.category}</span>
                        </div>
                      </td>
                      <td>{new Date(e.createdAt || e.date).toLocaleDateString()}</td>
                      <td><span className={`badge ${e.status === "Approved" ? "approved" : e.status === "Pending" ? "pending" : e.status === "Rejected" ? "rejected" : "draft"}`}>{e.status || "Pending"}</span></td>
                      <td className="amount-neg">-{formatCurrency(e.amount)}</td>
                      <td><div className="row-actions"><button className="row-btn"><i className="ti ti-pencil"></i></button><button className="row-btn danger"><i className="ti ti-trash"></i></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COL */}
        <div className="right-col">

          {/* BUDGET PANEL */}
          <div className="budget-panel">
            <div className="bp-title">Monthly Budget Overview</div>
            <div className="bp-hero">
              <div className="bp-label">TOTAL SPENT THIS MONTH</div>
              <div className="bp-val" style={{ color: "var(--red)" }}>{formatCurrency(expenses.reduce((s, e) => s + Number(e.amount || 0), 0))}</div>
              <div className="bp-sub">of {formatCurrency(150000)} budget limit</div>
              <div className="cat-bar" style={{ marginTop: 14, height: 6 }}><div className="cat-fill" style={{ width: (expenses.reduce((s, e) => s + Number(e.amount || 0), 0) / 150000) * 100 + "%", background: "var(--red)" }}></div></div>
            </div>

            <div className="budget-item">
              <div className="bi-left">
                <div className="bi-icon" style={{ background: "var(--teal-light)", color: "var(--teal)" }}><i className="ti ti-building"></i></div>
                <div>
                  <div className="bi-name">Office & Rent</div>
                  <div className="bi-used">Monthly Fixed</div>
                </div>
              </div>
              <div className="bi-amount">
                <div className="bi-val">{formatCurrency(expenses.filter(e => e.category === "Office").reduce((s, e) => s + Number(e.amount || 0), 0), "₹", true)}</div>
              </div>
            </div>
            <div className="budget-item">
              <div className="bi-left">
                <div className="bi-icon" style={{ background: "var(--purple-bg)", color: "var(--purple)" }}><i className="ti ti-server"></i></div>
                <div>
                  <div className="bi-name">Tech Stack</div>
                  <div className="bi-used">Cloud & Subscriptions</div>
                </div>
              </div>
              <div className="bi-amount">
                <div className="bi-val">{formatCurrency(expenses.filter(e => e.category === "Utilities").reduce((s, e) => s + Number(e.amount || 0), 0), "₹", true)}</div>
              </div>
            </div>
          </div>

          {/* QUICK ADD EXPENSE */}
          <div className="add-panel">
            <div className="ap-title">Quick Add Expense</div>
            <div className="form-group">
              <label className="form-label">Expense Title</label>
              <input type="text" className="form-input" placeholder="e.g. AWS Hosting" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount ₹</label>
                <input type="number" className="form-input" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <button className="upload-receipt"><i className="ti ti-upload"></i> Attach Receipt (Optional)</button>
            </div>
            <button className="submit-btn" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Expense"}</button>
          </div>

        </div>
      </div>

      {modal === "add" && (
        <Modal THEME={THEME} title="Add Expense" onClose={() => setModal(null)}>
          <Fld THEME={THEME} label="Title" value={form.title} onChange={v => setForm({ ...form, title: v })} placeholder="e.g. Server Hosting" />
          <Fld THEME={THEME} label="Category" value={form.category} onChange={v => setForm({ ...form, category: v })} options={CATEGORIES} />
          <Fld THEME={THEME} label="Amount" type="number" value={form.amount} onChange={v => setForm({ ...form, amount: v })} prefix="₹" />
          <button onClick={save} disabled={saving} style={{ width: "100%", padding: 18, borderRadius: 16, background: THEME.accent, color: "#fff", border: "none", fontWeight: 900, marginTop: 12, cursor: "pointer", fontSize: 16, boxShadow: `0 10px 20px ${THEME.accent}40` }}>
            {saving ? "Processing..." : "Save Expense Entry"}
          </button>
        </Modal>
      )}
    </>
  );
}

// ── Income Page Component --------------------------------------
export function IncomePage({ THEME, income = [], setIncome, fetchIncome }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ title: "", client: "", amount: "", category: "Project Payment", status: "Received" });
  const [clients, setClients] = useState([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    axios.get(`${BASE_URL}/api/clients`).then(r => setClients(r.data));
  }, []);

  const save = async () => {
    if (!form.client || !form.amount) return alert("Fill required fields");
    try {
      const res = await axios.post(INCOME_API, { ...form, amount: Number(form.amount) });
      setIncome(prev => [res.data, ...prev]);
      setToast("Success Income Recorded!");
      setModal(null);
      setTimeout(() => setToast(""), 3000);
    } catch (e) { alert("Failed to save"); }
  };

  return (
    <>
      <Toast msg={toast} THEME={THEME} />

      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <div className="page-title">Payments</div>
          <div className="page-sub">Track all incoming and outgoing payments</div>
        </div>
        <div className="header-actions">
          <button className="filter-btn"><i className="ti ti-filter" style={{ fontSize: 14 }}></i> Filter</button>
          <button className="filter-btn"><i className="ti ti-calendar" style={{ fontSize: 14 }}></i> May 2026</button>
          <button className="filter-btn"><i className="ti ti-download" style={{ fontSize: 14 }}></i> Export</button>
          <button onClick={() => setModal("add")} className="create-btn"><i className="ti ti-plus" style={{ fontSize: 15 }}></i> Record Payment</button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card-inner">
            <div className="stat-icon" style={{ background: "var(--teal-light)", color: "var(--teal)" }}><i className="ti ti-cash"></i></div>
            <div>
              <div className="stat-num">{formatCurrency(income.filter(i => i.status !== "Pending").reduce((s, i) => s + Number(i.amount || 0), 0), "₹", true)}</div>
              <div className="stat-label">Total Received</div>
              <div className="stat-trend up"><i className="ti ti-trending-up" style={{ fontSize: 11 }}></i>+{formatCurrency(0, "₹", true)} this month</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-inner">
            <div className="stat-icon" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}><i className="ti ti-clock"></i></div>
            <div>
              <div className="stat-num">{formatCurrency(income.filter(i => i.status === "Pending").reduce((s, i) => s + Number(i.amount || 0), 0), "₹", true)}</div>
              <div className="stat-label">Awaiting</div>
              <div className="stat-trend neutral"><i className="ti ti-minus" style={{ fontSize: 11 }}></i>{income.filter(i => i.status === "Pending").length} payments due</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-inner">
            <div className="stat-icon" style={{ background: "var(--red-bg)", color: "var(--red)" }}><i className="ti ti-circle-x"></i></div>
            <div>
              <div className="stat-num">₹0</div>
              <div className="stat-label">Failed / Refunded</div>
              <div className="stat-trend neutral"><i className="ti ti-minus" style={{ fontSize: 11 }}></i>No issues</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-inner">
            <div className="stat-icon" style={{ background: "var(--green-bg)", color: "var(--green)" }}><i className="ti ti-check"></i></div>
            <div>
              <div className="stat-num">{income.filter(i => i.status !== "Pending").length}</div>
              <div className="stat-label">Successful</div>
              <div className="stat-trend up"><i className="ti ti-trending-up" style={{ fontSize: 11 }}></i>All cleared</div>
            </div>
          </div>
        </div>
      </div>

      {/* CHART BANNER */}
      <div className="chart-banner">
        <div className="chart-left">
          <div className="chart-title">Payment Flow – Overview</div>
          <div className="chart-sub">Received vs Pending over time</div>
          <div className="chart-area">
            <svg viewBox="0 0 560 120" preserveAspectRatio="none" width="100%" height="100%">
              <defs>
                <linearGradient id="gReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--teal)" stopOpacity=".2" />
                  <stop offset="100%" stopColor="var(--teal)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="gPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F5A623" stopOpacity=".15" />
                  <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="30" x2="560" y2="30" stroke="#E0EEF0" strokeWidth="1" />
              <line x1="0" y1="60" x2="560" y2="60" stroke="#E0EEF0" strokeWidth="1" />
              <line x1="0" y1="90" x2="560" y2="90" stroke="#E0EEF0" strokeWidth="1" />
              {/* Received */}
              <path d="M0,90 C60,75 100,45 160,40 C220,35 260,55 320,30 C380,10 420,50 480,25 C510,15 535,30 560,20 L560,120 L0,120Z" fill="url(#gReceived)" />
              <path d="M0,90 C60,75 100,45 160,40 C220,35 260,55 320,30 C380,10 420,50 480,25 C510,15 535,30 560,20" stroke="var(--teal)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              {/* Pending */}
              <path d="M0,100 C60,95 100,85 160,80 C220,75 260,85 320,70 C380,60 420,75 480,65 C510,60 535,70 560,60 L560,120 L0,120Z" fill="url(#gPending)" />
              <path d="M0,100 C60,95 100,85 160,80 C220,75 260,85 320,70 C380,60 420,75 480,65 C510,60 535,70 560,60" stroke="#F5A623" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="6,3" />
              {/* Dots */}
              <circle cx="160" cy="40" r="4" fill="#fff" stroke="var(--teal)" strokeWidth="2" />
              <circle cx="320" cy="30" r="4" fill="var(--teal)" stroke="#fff" strokeWidth="2" />
              <circle cx="480" cy="25" r="4" fill="#fff" stroke="var(--teal)" strokeWidth="2" />
              {/* Labels */}
              <text x="56" y="118" fill="#A0B8BE" fontSize="9" fontFamily="Nunito" textAnchor="middle">Week 1</text>
              <text x="168" y="118" fill="#A0B8BE" fontSize="9" fontFamily="Nunito" textAnchor="middle">Week 2</text>
              <text x="280" y="118" fill="#A0B8BE" fontSize="9" fontFamily="Nunito" textAnchor="middle">Week 3</text>
              <text x="392" y="118" fill="#A0B8BE" fontSize="9" fontFamily="Nunito" textAnchor="middle">Week 4</text>
              <text x="504" y="118" fill="#A0B8BE" fontSize="9" fontFamily="Nunito" textAnchor="middle">Week 5</text>
            </svg>
          </div>
        </div>
        <div className="chart-right">
          <div className="chart-legend-item">
            <div className="cl-dot" style={{ background: "var(--teal)" }}></div>
            <div className="cl-label">Total Received</div>
            <div className="cl-val" style={{ color: "var(--teal)" }}>{formatCurrency(income.filter(i => i.status !== "Pending").reduce((s, i) => s + Number(i.amount || 0), 0), "₹", true)}</div>
          </div>
          <div className="chart-legend-item">
            <div className="cl-dot" style={{ background: "var(--amber)" }}></div>
            <div className="cl-label">Awaiting</div>
            <div className="cl-val" style={{ color: "var(--amber)" }}>{formatCurrency(income.filter(i => i.status === "Pending").reduce((s, i) => s + Number(i.amount || 0), 0), "₹", true)}</div>
          </div>
          <div className="chart-legend-item">
            <div className="cl-dot" style={{ background: "var(--green)" }}></div>
            <div className="cl-label">Total Net</div>
            <div className="cl-val" style={{ color: "var(--green)" }}>{formatCurrency(income.reduce((s, i) => s + Number(i.amount || 0), 0), "₹", true)}</div>
          </div>
          <div style={{ marginTop: 4, padding: "10px 14px", background: "var(--teal-lighter)", borderRadius: 10, border: "1.5px solid var(--teal-light)" }}>
            <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, marginBottom: 3 }}>COLLECTION RATE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--teal)" }}>
              {income.length > 0 ? Math.round((income.filter(i => i.status !== "Pending").length / income.length) * 100) : 0}%
            </div>
            <div style={{ height: 5, background: "var(--teal-light)", borderRadius: 3, marginTop: 6, overflow: "hidden" }}>
              <div style={{ width: (income.length > 0 ? (income.filter(i => i.status !== "Pending").length / income.length) * 100 : 0) + "%", height: "100%", background: "var(--teal)", borderRadius: 3 }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="main-grid">

        {/* PAYMENT TABLE */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Payment History</span>
            <div className="tabs-inline">
              <button className="tab-inline active">All</button>
              <button className="tab-inline">Received</button>
              <button className="tab-inline">Sent</button>
              <button className="tab-inline">Pending</button>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Payment</th>
                  <th>Client / Vendor</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Ref ID</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {income.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>No payments found</td></tr>
                ) : income.map((inc, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="pay-cell">
                        <div className="pay-icon" style={{ background: inc.status === "Pending" ? "var(--amber-bg)" : "var(--green-bg)", color: inc.status === "Pending" ? "var(--amber)" : "var(--green)" }}>
                          <i className={inc.status === "Pending" ? "ti ti-clock" : "ti ti-arrow-down-left"}></i>
                        </div>
                        <div>
                          <div className="pay-name">{inc.title || "Project Payment"}</div>
                          <div style={{ fontSize: 10, color: "var(--text3)" }}>{inc.category || "M Business"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: `linear-gradient(135deg,var(--teal),#006E7F)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff" }}>
                          {(inc.client || "?")[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{inc.client}</span>
                      </div>
                    </td>
                    <td><div className="method-chip"><i className="ti ti-building-bank"></i> {inc.paymentMode || "Bank Transfer"}</div></td>
                    <td>{new Date(inc.createdAt || inc.date).toLocaleDateString()}</td>
                    <td style={{ fontSize: 11, color: "var(--text3)", fontFamily: "monospace" }}>{inc._id ? inc._id.substring(0, 8).toUpperCase() : "TXN—"}</td>
                    <td><span className={`badge ${inc.status === "Pending" ? "pending" : "received"}`}>{inc.status || "Received"}</span></td>
                    <td className="amount-pos">+{formatCurrency(inc.amount)}</td>
                    <td><div className="row-actions"><button className="row-btn"><i className="ti ti-eye"></i></button><button className="row-btn"><i className="ti ti-download"></i></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COL */}
        <div className="right-col">

          {/* SEND PAYMENT */}
          <div className="send-panel">
            <div className="sp-title">Send Payment</div>
            <div className="sp-sub">Transfer to vendor or team</div>
            <input className="sp-input" type="text" placeholder="Recipient name or account" />
            <div className="sp-row">
              <input className="sp-input" type="text" placeholder="Amount ₹" style={{ marginBottom: 0 }} />
              <input className="sp-input" type="text" placeholder="UPI / NEFT" style={{ marginBottom: 0 }} />
            </div>
            <button className="sp-btn"><i className="ti ti-send" style={{ fontSize: 14, marginRight: 4 }}></i> Send Now</button>
          </div>

          {/* UPCOMING PAYMENTS */}
          <div className="upcoming-panel">
            <div className="up-title">Upcoming Payments</div>
            <div className="up-list">
              {income.filter(i => i.status === "Pending").slice(0, 3).map((inc, i) => (
                <div className="up-item" key={i}>
                  <div className="up-icon" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}><i className="ti ti-clock"></i></div>
                  <div>
                    <div className="up-name">{inc.client} – {inc.title}</div>
                    <div className="up-date">Expected soon</div>
                  </div>
                  <div className="up-amount" style={{ color: "var(--amber)" }}>{formatCurrency(inc.amount)}</div>
                </div>
              ))}
              {income.filter(i => i.status === "Pending").length === 0 && (
                <div style={{ fontSize: 12, color: "var(--text3)", textAlign: "center", padding: 10 }}>No upcoming payments</div>
              )}
            </div>
          </div>

          {/* PAYMENT METHODS */}
          <div className="methods-panel">
            <div className="mp-title">Payment Methods</div>
            <div className="method-row">
              <div className="method-icon" style={{ background: "var(--teal-light)", color: "var(--teal)" }}><i className="ti ti-building-bank"></i></div>
              <div>
                <div className="method-name">Bank Transfer / NEFT</div>
                <div className="method-detail">Primary · ••4821</div>
              </div>
              <div className="method-check"><i className="ti ti-check"></i></div>
            </div>
            <div className="method-row">
              <div className="method-icon" style={{ background: "var(--purple-bg)", color: "var(--purple)" }}><i className="ti ti-device-mobile"></i></div>
              <div>
                <div className="method-name">UPI</div>
                <div className="method-detail">business@upi</div>
              </div>
              <div className="method-check"><i className="ti ti-check"></i></div>
            </div>
            <div className="method-row">
              <div className="method-icon" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}><i className="ti ti-credit-card"></i></div>
              <div>
                <div className="method-name">Debit Card</div>
                <div className="method-detail">HDFC ••9034</div>
              </div>
              <div className="method-check" style={{ background: "var(--bg)", color: "var(--text3)" }}><i className="ti ti-plus"></i></div>
            </div>
          </div>

        </div>
      </div>

      {modal && (
        <Modal THEME={THEME} title="Record Income" onClose={() => setModal(null)}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 11, color: THEME.accent, fontWeight: 800, letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase", opacity: 0.9 }}>SELECT CLIENT</label>
            <ClientDropdown THEME={THEME} clients={clients} value={form.client} onChange={v => setForm({ ...form, client: v })} />
          </div>
          <Fld THEME={THEME} label="Payment Title" value={form.title} onChange={v => setForm({ ...form, title: v })} placeholder="e.g. Milestone 1 Payment" />
          <Fld THEME={THEME} label="Amount" type="number" value={form.amount} onChange={v => setForm({ ...form, amount: v })} prefix="₹" />
          <button onClick={save} style={{ width: "100%", padding: 18, borderRadius: 16, background: THEME.accent, color: "#fff", border: "none", fontWeight: 900, marginTop: 12, cursor: "pointer", fontSize: 16, boxShadow: `0 10px 20px ${THEME.accent}40` }}>Record Payment</button>
        </Modal>
      )}
    </>
  );
}

