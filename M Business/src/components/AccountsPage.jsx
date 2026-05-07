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
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: THEME.text }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none",
            fontSize: 20, cursor: "pointer", color: THEME.muted, padding: "4px 8px" }}>✕</button>
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
    borderRadius: 10, padding: prefix ? "10px 14px 10px 30px" : "10px 14px",
    fontSize: 13, color: THEME.text, background: THEME.surface,
    boxSizing: "border-box", outline: "none", fontFamily: "inherit"
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, color: THEME.muted, fontWeight: 700,
        letterSpacing: 0.5, marginBottom: 5 }}>{label.toUpperCase()}</label>
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
      <div onClick={() => setOpen(!open)} style={{ width: "100%", border: `1.5px solid ${error ? "#EF4444" : open ? THEME.accent : THEME.border}`, borderRadius: 10, padding: "10px 36px 10px 14px", fontSize: 13, color: value ? THEME.text : THEME.muted, background: THEME.surface, cursor: "pointer", userSelect: "none", boxSizing: "border-box", position: "relative", minHeight: 42 }}>
        {value ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: THEME.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{value[0].toUpperCase()}</div>
            <span>{value}</span>
            {selected?.companyName && <span style={{ fontSize: 11, color: THEME.muted }}>({selected.companyName})</span>}
          </div>
        ) : "-- Select Client --"}
        <span style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, fontSize: 10, color: THEME.muted, transition: "0.2s" }}>▼</span>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        {stats.map(({ t, v, i, c, desc }) => (
          <div key={t} className="premium-card" style={{ background: THEME.card, borderRadius: 24, padding: 28, boxShadow: THEME.shadow, border: `1.5px solid ${THEME.border}`, position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${c}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{i}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: THEME.muted, letterSpacing: 1, textTransform: "uppercase" }}>{t}</div>
                <div style={{ fontSize: 12, color: THEME.muted, opacity: 0.8 }}>{desc}</div>
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 24 }}>
        <div style={{ background: THEME.card, borderRadius: 28, padding: 32, border: `1.5px solid ${THEME.border}`, boxShadow: THEME.shadow }}>
          <h3 style={{ margin: "0 0 24px 0", fontSize: 18, fontWeight: 900, color: THEME.text }}>Cash Flow Analysis</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, fontWeight: 700 }}>
                <span style={{ color: THEME.muted }}>Income</span>
                <span style={{ color: "#22c55e" }}>{formatCurrency(totalIncome)}</span>
              </div>
              <div style={{ height: 10, background: THEME.surface, borderRadius: 5, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "#22c55e", width: `${Math.min(100, (totalIncome / (totalIncome + totalExpenses || 1)) * 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, fontWeight: 700 }}>
                <span style={{ color: THEME.muted }}>Expenses</span>
                <span style={{ color: "#ef4444" }}>{formatCurrency(totalExpenses)}</span>
              </div>
              <div style={{ height: 10, background: THEME.surface, borderRadius: 5, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "#ef4444", width: `${Math.min(100, (totalExpenses / (totalIncome + totalExpenses || 1)) * 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: THEME.card, borderRadius: 28, padding: 32, border: `1.5px solid ${THEME.border}`, boxShadow: THEME.shadow }}>
          <h3 style={{ margin: "0 0 24px 0", fontSize: 18, fontWeight: 900, color: THEME.text }}>Recent Transactions</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[...income.map(i => ({ ...i, type: "income" })), ...expenses.map(e => ({ ...e, type: "expense" }))]
              .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
              .slice(0, 5)
              .map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 14, borderBottom: idx === 4 ? "none" : `1px solid ${THEME.border}` }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: item.type === "income" ? "#dcfce7" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                    {item.type === "income" ? "📈" : "📉"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: THEME.text }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: THEME.muted, fontWeight: 600 }}>{new Date(item.createdAt || item.date).toLocaleDateString()} • {item.category}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: item.type === "income" ? "#16a34a" : "#dc2626" }}>
                    {item.type === "income" ? "+" : "-"}{formatCurrency(item.amount)}
                  </div>
                </div>
              ))}
            {(income.length === 0 && expenses.length === 0) && <div style={{ textAlign: "center", color: THEME.muted, fontSize: 13, padding: 20 }}>No records found</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────
export default function AccountsPage({ THEME }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incRes, expRes] = await Promise.all([
          axios.get(INCOME_API),
          axios.get(EXPENSES_API)
        ]);
        setIncome(incRes.data);
        setExpenses(expRes.data);
      } catch (e) {
        console.error("Failed to fetch financial data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
        {activeTab === "income" && <IncomePage THEME={THEME} income={income} setIncome={setIncome} fetchIncome={() => axios.get(INCOME_API).then(r => setIncome(r.data))} />}
        {activeTab === "expenses" && <ExpensesPage THEME={THEME} expenses={expenses} setExpenses={setExpenses} fetchExpenses={() => axios.get(EXPENSES_API).then(r => setExpenses(r.data))} />}
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
    <div style={{ background: THEME.card, borderRadius: 28, padding: 32, border: `1.5px solid ${THEME.border}`, boxShadow: THEME.shadow }}>
      <Toast msg={toast} THEME={THEME} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: THEME.text }}>Expense Log</h3>
        <button onClick={() => setModal("add")} style={{ background: THEME.accent, color: "#fff", border: "none", borderRadius: 12, padding: "10px 24px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>+ New Expense</button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Title", "Category", "Amount", "Status", "Date"].map(h => (
                <th key={h} style={{ padding: "16px", textAlign: "left", fontWeight: 800, color: THEME.muted, borderBottom: `2px solid ${THEME.border}`, fontSize: 12 }}>{h.toUpperCase()}</th>
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
    <div style={{ background: THEME.card, borderRadius: 28, padding: 32, border: `1.5px solid ${THEME.border}`, boxShadow: THEME.shadow }}>
      <Toast msg={toast} THEME={THEME} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: THEME.text }}>Income Log</h3>
        <button onClick={() => setModal("add")} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 12, padding: "10px 24px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>+ Record Income</button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Client / Project", "Amount", "Mode", "Status", "Date"].map(h => (
                <th key={h} style={{ padding: "16px", textAlign: "left", fontWeight: 800, color: THEME.muted, borderBottom: `2px solid ${THEME.border}`, fontSize: 12 }}>{h.toUpperCase()}</th>
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
          <div style={{ marginBottom: 16 }}>
             <label style={{ display: "block", fontSize: 11, color: THEME.muted, fontWeight: 800, letterSpacing: 0.5, marginBottom: 8 }}>SELECT CLIENT</label>
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
