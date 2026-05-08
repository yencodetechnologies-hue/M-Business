// ════════════════════════════════════════════════════════════
//  AccountsPage.jsx  — exports BOTH AccountsPage & ExpensesPage
//  Dashboard.jsx usage:
//    import AccountsPage, { ExpensesPage } from "./AccountsPage";
//    {validActive === "accounts" && <AccountsPage THEME={THEME} />}
//    {validActive === "expenses" && <ExpensesPage THEME={THEME} />}
// ════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../config";
import { T as GLOBAL_T } from "../index";

// ── Constants ─────────────────────────────────────────────
const ACCOUNTS_API = `${BASE_URL}/api/accounts`;
const EXPENSES_API = `${BASE_URL}/api/expenses`;
const INCOME_API   = `${BASE_URL}/api/income`;

const formatCurrency = (amount, symbol = "₹") => {
  const num = Number(amount) || 0;
  return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// ── Shared UI components ──────────────────────────────────────
function Modal({ title, onClose, children, THEME }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(8px)", zIndex: 1000, display: "flex",
      alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: THEME.card, borderRadius: 24, width: "100%", maxWidth: 720,
        maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: THEME.shadow, border: `1.5px solid ${THEME.border}` }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${THEME.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: THEME.surface, flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: THEME.text, letterSpacing: "-0.5px" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "rgba(0,0,0,0.05)", border: "none",
            fontSize: 20, cursor: "pointer", color: THEME.text, padding: "6px 12px", borderRadius: 10, fontWeight: 800 }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", padding: "24px", flex: 1, background: THEME.card }}>{children}</div>
      </div>
    </div>
  );
}

function Toast({ msg, THEME }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: THEME.card,
      border: "1.5px solid #22c55e", borderRadius: 12, padding: "12px 20px",
      fontSize: 13, fontWeight: 700, color: "#22c55e",
      boxShadow: THEME.shadow }}>{msg}</div>
  );
}

function Fld({ label, value, onChange, options, type = "text", error, placeholder, prefix, THEME }) {
  const s = {
    width: "100%", border: `1.5px solid ${error ? "#EF4444" : THEME.border}`,
    borderRadius: 12, padding: prefix ? "12px 14px 12px 34px" : "12px 14px",
    fontSize: 14, color: THEME.text, background: "#fff",
    boxSizing: "border-box", outline: "none", fontFamily: "inherit", fontWeight: 600
  };
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 12, color: THEME.text, fontWeight: 800,
        letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase", opacity: 0.8 }}>{label}</label>
      <div style={{ position: "relative" }}>
        {prefix && (
          <span style={{ position: "absolute", left: 10, top: "50%",
            transform: "translateY(-50%)", color: THEME.muted, fontWeight: 700, fontSize: 13 }}>
            {prefix}
          </span>
        )}
        {options
          ? <select value={value} onChange={e => onChange(e.target.value)} style={s}>
              {options.map(o => <option key={o}>{o}</option>)}
            </select>
          : <input type={type} value={value} onChange={e => onChange(e.target.value)} style={s} placeholder={placeholder || ""} />}
      </div>
      {error && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠️ {error}</div>}
    </div>
  );
}

function ExpBadge({ label, colorMap }) {
  const c = (colorMap || {})[label] || "var(--app-accent)";
  return (
    <span style={{ background: `${c}18`, color: c, border: `1px solid ${c}33`,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
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
      <div onClick={() => setOpen(!open)} style={{ width: "100%", border: `1.5px solid ${error ? "#EF4444" : open ? THEME.accent : "#ddd6fe"}`, borderRadius: 12, padding: "12px 36px 12px 14px", fontSize: 14, color: value ? "#1e1b4b" : "#64748b", background: "#fff", cursor: "pointer", userSelect: "none", boxSizing: "border-box", position: "relative", minHeight: 46, fontWeight: 600 }}>
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
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12 }}>🔍</span>
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

// ── Financial Overview ──────────────────────────────────────────
function FinancialOverview({ THEME, income = [], expenses = [] }) {
  const totalIncome = income.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const netBalance = totalIncome - totalExpenses;

  const stats = [
    { t: "Total Income", v: formatCurrency(totalIncome), c: "#22c55e", i: "💰", desc: "Revenue generated" },
    { t: "Total Expenses", v: formatCurrency(totalExpenses), c: "#ef4444", i: "💸", desc: "Operational costs" },
    { t: "Net Balance", v: formatCurrency(netBalance), c: netBalance >= 0 ? THEME.accent : "#f43f5e", i: "🏦", desc: "Current liquidity" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
        {stats.map(({ t, v, i, c, desc }) => (
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
            <div style={{ fontSize: 36, fontWeight: 900, color: c, letterSpacing: "-1px" }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 24 }}>
        <div style={{ background: THEME.card, borderRadius: 32, padding: 32, border: `1.5px solid ${THEME.border}`, boxShadow: "0 10px 40px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{ width: 12, height: 24, background: THEME.accent, borderRadius: 4 }}></div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: THEME.text }}>Cash Flow Analysis</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14, fontWeight: 800 }}>
                <span style={{ color: THEME.text }}>Total Income</span>
                <span style={{ color: "#22c55e" }}>{formatCurrency(totalIncome)}</span>
              </div>
              <div style={{ height: 14, background: "#f1f5f9", borderRadius: 7, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg, #22c55e, #4ade80)", width: `${Math.min(100, (totalIncome / (totalIncome + totalExpenses || 1)) * 100)}%`, borderRadius: 7 }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14, fontWeight: 800 }}>
                <span style={{ color: THEME.text }}>Total Expenses</span>
                <span style={{ color: "#ef4444" }}>{formatCurrency(totalExpenses)}</span>
              </div>
              <div style={{ height: 14, background: "#f1f5f9", borderRadius: 7, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg, #ef4444, #f87171)", width: `${Math.min(100, (totalExpenses / (totalIncome + totalExpenses || 1)) * 100)}%`, borderRadius: 7 }}></div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: THEME.card, borderRadius: 32, padding: 32, border: `1.5px solid ${THEME.border}`, boxShadow: "0 10px 40px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{ width: 12, height: 24, background: "#10b981", borderRadius: 4 }}></div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: THEME.text }}>Recent Activity</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[...income.map(i => ({ ...i, type: "income" })), ...expenses.map(e => ({ ...e, type: "expense" }))]
              .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
              .slice(0, 5)
              .map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px", borderRadius: 16, background: idx === 0 ? `${THEME.accent}08` : "transparent", transition: "background 0.2s" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: item.type === "income" ? "#dcfce7" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: item.type === "income" ? "0 4px 12px #dcfce7" : "0 4px 12px #fee2e2" }}>
                    {item.type === "income" ? "💰" : "💸"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: THEME.text }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: THEME.muted, fontWeight: 600 }}>{new Date(item.createdAt || item.date).toLocaleDateString()} • {item.category}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: item.type === "income" ? "#16a34a" : "#dc2626" }}>
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

// ── Main Page Component ──────────────────────────────────────────
export default function AccountsPage({ 
  THEME: propTheme, 
  initialTab = "overview",
  income: propIncome,
  setIncome: propSetIncome,
  fetchIncome: propFetchIncome,
  expenses: propExpenses,
  setExpenses: propSetExpenses,
  fetchExpenses: propFetchExpenses
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
    padding: "12px 28px", borderRadius: 12, fontSize: 14, fontWeight: 800,
    cursor: "pointer", border: "none",
    background: on ? THEME.accent : "transparent",
    color: on ? "#fff" : THEME.muted,
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: on ? "0 4px 12px rgba(99,102,241,0.25)" : "none"
  });

  if (loading) return <div style={{ textAlign: "center", padding: 100, color: THEME.muted, fontWeight: 800 }}>⚡ Generating Financial Dashboard...</div>;

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 32, background: THEME.surface, padding: 8, borderRadius: 16, width: "fit-content" }}>
        <button onClick={() => setActiveTab("overview")} style={tabStyle(activeTab === "overview")}>📊 Overview</button>
        <button onClick={() => setActiveTab("income")} style={tabStyle(activeTab === "income")}>💰 Income</button>
        <button onClick={() => setActiveTab("expenses")} style={tabStyle(activeTab === "expenses")}>💸 Expenses</button>
      </div>

      <div>
        {activeTab === "overview" && <FinancialOverview THEME={THEME} income={income} expenses={expenses} />}
        {activeTab === "income" && <IncomePage THEME={THEME} income={income} setIncome={setIncome} fetchIncome={fetchIncome} />}
        {activeTab === "expenses" && <ExpensesPage THEME={THEME} expenses={expenses} setExpenses={setExpenses} fetchExpenses={fetchExpenses} />}
      </div>
    </div>
  );
}

// ── Expenses Page Component ─────────────────────────────────────
const CATEGORIES = ["Food", "Travel", "Office", "Utilities", "Marketing", "Salary", "Miscellaneous"];
const CATEGORY_COLOR = { Food: "#f59e0b", Travel: "#3b82f6", Office: "#7c3aed", Utilities: "#06b6d4", Marketing: "#ec4899", Salary: "#22c55e", Miscellaneous: "#64748b" };
const CATEGORY_ICON = { Food: "🍽️", Travel: "✈️", Office: "🏢", Utilities: "💡", Marketing: "📣", Salary: "💰", Miscellaneous: "📦" };
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
      setToast("✅ Expense Added!");
      setModal(null);
      setTimeout(() => setToast(""), 3000);
    } catch (e) {
      alert("Save failed");
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background: THEME.card, borderRadius: 32, padding: 32, border: `1.5px solid ${THEME.border}`, boxShadow: "0 10px 40px rgba(0,0,0,0.04)" }}>
      <Toast msg={toast} THEME={THEME} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 14, height: 28, background: THEME.accent, opacity: 0.8, borderRadius: 4 }}></div>
          <h3 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: THEME.text, letterSpacing: "-0.5px" }}>Expense Log</h3>
        </div>
        <button onClick={() => setModal("add")} style={{ background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accent}dd)`, color: "#fff", border: "none", borderRadius: 14, padding: "12px 28px", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: `0 6px 15px ${THEME.accent}40` }}>+ New Expense</button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Title", "Category", "Amount", "Status", "Date"].map(h => (
                <th key={h} style={{ padding: "16px", textAlign: "left", fontWeight: 800, color: THEME.text, opacity: 0.6, borderBottom: `2px solid ${THEME.border}`, fontSize: 13 }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expenses.map((e, idx) => (
              <tr key={idx} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                <td style={{ padding: "16px", fontWeight: 700, color: THEME.text }}>{e.title}</td>
                <td style={{ padding: "16px" }}><ExpBadge label={e.category} colorMap={CATEGORY_COLOR} /></td>
                <td style={{ padding: "16px", fontWeight: 900, color: THEME.text }}>{formatCurrency(e.amount)}</td>
                <td style={{ padding: "16px" }}><ExpBadge label={e.status} colorMap={STATUS_COLOR} /></td>
                <td style={{ padding: "16px", color: THEME.muted, fontSize: 13 }}>{new Date(e.createdAt || e.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal THEME={THEME} title="Add Expense" onClose={() => setModal(null)}>
          <Fld THEME={THEME} label="Title" value={form.title} onChange={v => setForm({ ...form, title: v })} placeholder="e.g. Server Hosting" />
          <Fld THEME={THEME} label="Category" value={form.category} onChange={v => setForm({ ...form, category: v })} options={CATEGORIES} />
          <Fld THEME={THEME} label="Amount" type="number" value={form.amount} onChange={v => setForm({ ...form, amount: v })} prefix="₹" />
          <button onClick={save} disabled={saving} style={{ width: "100%", padding: 14, borderRadius: 12, background: THEME.accent, color: "#fff", border: "none", fontWeight: 800, marginTop: 12, cursor: "pointer" }}>
            {saving ? "Processing..." : "Save Expense"}
          </button>
        </Modal>
      )}
    </div>
  );
}

// ── Income Page Component ──────────────────────────────────────
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
      setToast("✅ Income Recorded!");
      setModal(null);
      setTimeout(() => setToast(""), 3000);
    } catch (e) { alert("Failed to save"); }
  };

  return (
    <div style={{ background: THEME.card, borderRadius: 32, padding: 32, border: `1.5px solid ${THEME.border}`, boxShadow: "0 10px 40px rgba(0,0,0,0.04)" }}>
      <Toast msg={toast} THEME={THEME} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 14, height: 28, background: "#10b981", borderRadius: 4 }}></div>
          <h3 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: THEME.text, letterSpacing: "-0.5px" }}>Income Log</h3>
        </div>
        <button onClick={() => setModal("add")} style={{ background: "linear-gradient(135deg, #10b981, #34d399)", color: "#fff", border: "none", borderRadius: 14, padding: "12px 28px", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 6px 15px rgba(16,185,129,0.3)" }}>+ Record Income</button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Client / Project", "Amount", "Mode", "Status", "Date"].map(h => (
                <th key={h} style={{ padding: "16px", textAlign: "left", fontWeight: 800, color: THEME.text, opacity: 0.6, borderBottom: `2px solid ${THEME.border}`, fontSize: 13 }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {income.map((inc, idx) => (
              <tr key={idx} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                <td style={{ padding: "16px" }}>
                  <div style={{ fontWeight: 800, color: THEME.text }}>{inc.client}</div>
                  <div style={{ fontSize: 11, color: THEME.muted }}>{inc.title}</div>
                </td>
                <td style={{ padding: "16px", fontWeight: 900, color: "#10b981" }}>{formatCurrency(inc.amount)}</td>
                <td style={{ padding: "16px", color: THEME.muted, fontWeight: 600 }}>{inc.paymentMode || "Bank"}</td>
                <td style={{ padding: "16px" }}><ExpBadge label={inc.status} colorMap={{ Received: "#10b981", Pending: "#f59e0b" }} /></td>
                <td style={{ padding: "16px", color: THEME.muted, fontSize: 13 }}>{new Date(inc.createdAt || inc.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal THEME={THEME} title="Record Income" onClose={() => setModal(null)}>
          <div style={{ marginBottom: 18 }}>
             <label style={{ display: "block", fontSize: 12, color: THEME.text, fontWeight: 800, letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase", opacity: 0.8 }}>SELECT CLIENT</label>
             <ClientDropdown THEME={THEME} clients={clients} value={form.client} onChange={v => setForm({ ...form, client: v })} />
          </div>
          <Fld THEME={THEME} label="Payment Title" value={form.title} onChange={v => setForm({ ...form, title: v })} placeholder="e.g. Milestone 1 Payment" />
          <Fld THEME={THEME} label="Amount" type="number" value={form.amount} onChange={v => setForm({ ...form, amount: v })} prefix="₹" />
          <button onClick={save} style={{ width: "100%", padding: 14, borderRadius: 12, background: "#10b981", color: "#fff", border: "none", fontWeight: 800, marginTop: 12, cursor: "pointer" }}>Save Record</button>
        </Modal>
      )}
    </div>
  );
}
