// ════════════════════════════════════════════════════════════
//  AccountsPage.jsx  — exports BOTH AccountsPage & ExpensesPage
//  Dashboard.jsx usage:
//    import AccountsPage, { ExpensesPage } from "./AccountsPage";
//    {validActive === "accounts" && <AccountsPage />}
//    {validActive === "expenses" && <ExpensesPage />}
// ════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

// ── Shared theme ─────────────────────────────────────────────
const T = { text:"#1e0a3c", muted:"#7c3aed", border:"#ede9fe" };

// ── Shared UI components ──────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(59,7,100,0.55)",
      backdropFilter:"blur(8px)", zIndex:1000, display:"flex",
      alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:720,
        maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column",
        boxShadow:"0 32px 80px rgba(147,51,234,0.25)" }}>
        <div style={{ padding:"16px 22px", borderBottom:"1px solid #ede9fe",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          background:"linear-gradient(90deg,#f5f3ff,#faf5ff)", flexShrink:0 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:T.text }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none", border:"none",
            fontSize:20, cursor:"pointer", color:"#7c3aed", padding:"4px 8px" }}>✕</button>
        </div>
        <div style={{ overflowY:"auto", padding:"20px 22px", flex:1 }}>{children}</div>
      </div>
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, background:"#fff",
      border:"1.5px solid #22c55e", borderRadius:12, padding:"12px 20px",
      fontSize:13, fontWeight:700, color:"#22c55e",
      boxShadow:"0 8px 24px rgba(0,0,0,0.12)" }}>{msg}</div>
  );
}

function Fld({ label, value, onChange, options, type="text", error, placeholder, prefix }) {
  const s = {
    width:"100%", border:`1.5px solid ${error?"#EF4444":"#ede9fe"}`,
    borderRadius:10, padding: prefix ? "10px 14px 10px 30px" : "10px 14px",
    fontSize:13, color:T.text, background:"#faf5ff",
    boxSizing:"border-box", outline:"none", fontFamily:"inherit"
  };
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:11, color:"#7c3aed", fontWeight:700,
        letterSpacing:0.5, marginBottom:5 }}>{label.toUpperCase()}</label>
      <div style={{ position:"relative" }}>
        {prefix && (
          <span style={{ position:"absolute", left:10, top:"50%",
            transform:"translateY(-50%)", color:"#a78bfa", fontWeight:700, fontSize:13 }}>
            {prefix}
          </span>
        )}
        {options
          ? <select value={value} onChange={e=>onChange(e.target.value)} style={s}>
              {options.map(o=><option key={o}>{o}</option>)}
            </select>
          : <input type={type} value={value} onChange={e=>onChange(e.target.value)}
              style={s} placeholder={placeholder||""} />}
      </div>
      {error && <div style={{ fontSize:11, color:"#EF4444", marginTop:4 }}>⚠️ {error}</div>}
    </div>
  );
}

//  ACCOUNTS PAGE  (default export)
// ════════════════════════════════════════════════════════════
const ACCOUNTS_API = `${BASE_URL}/api/accounts`;
const ROLES        = ["Client","Employee","Manager","Admin","SubAdmin"];
const ACC_STATUSES = ["Active","Inactive"];
const ACC_EMPTY = {
  title: "",
  category: "Food",
  expenseType: "Operational",
  paymentMode: "Cash",
  amount: "",
  status: "Pending"
};

const ROLE_COLOR = {
  Client:"#9333ea", Employee:"#c084fc", Manager:"#f59e0b",
  Admin:"#7c3aed",  SubAdmin:"#a855f7"
};
const ACC_STATUS_COLOR = { Active:"#22C55E", Inactive:"#EF4444" };

function RoleBadge({ label }) {
  const c = ROLE_COLOR[label] || ACC_STATUS_COLOR[label] || "#9333ea";
  return (
    <span style={{ background:`${c}18`, color:c, border:`1px solid ${c}33`,
      padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>
      {label}
    </span>
  );
}

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState("income"); // "income" or "expenses"

  const tabStyle = (active) => ({
    padding: "10px 24px",
    borderRadius: "12px 12px 0 0",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    border: "none",
    background: active ? "#fff" : "transparent",
    color: active ? "#7c3aed" : "#a78bfa",
    transition: "all 0.3s",
    borderBottom: active ? "3px solid #7c3aed" : "none",
    fontFamily: "inherit"
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #ede9fe", padding: "0 10px" }}>
       
        <button onClick={() => setActiveTab("expenses")} style={tabStyle(activeTab === "expenses")}>
          💸 Client Expenses
        </button>
      </div>

      <div style={{ padding: "0 4px" }}>
        {activeTab === "income" ? <IncomePage /> : <ExpensesPage />}
      </div>
    </div>
  );
}

// Internal User Accounts Page (Keeping for reference if needed elsewhere)
function UserAccountsPage() {
  const [accounts,   setAccounts]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [modal,      setModal]      = useState(null);
  const [editId,     setEditId]     = useState(null);
  const [form,       setForm]       = useState(ACC_EMPTY);
  const [err,        setErr]        = useState({});
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState("");

  useEffect(() => { fetchAccounts(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(ACCOUNTS_API);
      setAccounts(res.data);
    } catch { setAccounts([]); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setForm(ACC_EMPTY); setErr({}); setEditId(null); setModal("add"); };
const openEdit = (a) => {
  setForm({
    title:       a.title       || "",
    category:    a.category    || "Food",
    expenseType: a.expenseType || "Operational",
    paymentMode: a.paymentMode || "Cash",
    amount:      a.amount != null ? String(a.amount) : "",
    status:      a.status      || "Pending",
  });
  setEditId(a._id || a.id);
  setErr({});
  setModal("edit");
};
  const save = async () => {
    const errs = {};
    if (!form.title?.trim()) errs.title = "Title required";
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
      errs.amount = "Valid amount required";
    if (Object.keys(errs).length) { setErr(errs); return; }
    try {
      setSaving(true);
      if (modal === "add") {
        const res = await axios.post(ACCOUNTS_API, form);
        setAccounts(prev => [res.data, ...prev]);
      } else {
        const res = await axios.put(`${ACCOUNTS_API}/${editId}`, form);
        setAccounts(prev => prev.map(a => (a._id||a.id)===editId ? res.data : a));
      }
      showToast(modal==="add" ? "✅ Account added!" : "✅ Account updated!");
      setModal(null);
    } catch (e) {
      setErr({ email: e.response?.data?.msg || "Failed to save" });
    } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this account?")) return;
    try { await axios.delete(`${ACCOUNTS_API}/${id}`); } catch {}
    setAccounts(prev => prev.filter(a => (a._id||a.id) !== id));
    showToast("🗑️ Deleted!");
  };

  const displayed = accounts.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (a.name||"").toLowerCase().includes(q) ||
      (a.email||"").toLowerCase().includes(q) ||
      (a.role||"").toLowerCase().includes(q);
    const matchRole = roleFilter === "All" || a.role === roleFilter;
    return matchSearch && matchRole;
  });

  const stats = [
    { t:"Total Accounts", v:accounts.length,                                 c:"#9333ea", i:"👤" },
    { t:"Active",         v:accounts.filter(a=>a.status==="Active").length,  c:"#22C55E", i:"✅" },
    { t:"Inactive",       v:accounts.filter(a=>a.status==="Inactive").length,c:"#EF4444", i:"⛔" },
    { t:"Roles",          v:[...new Set(accounts.map(a=>a.role))].length,    c:"#f59e0b", i:"🎭" },
  ];

  const BtnPrimary = {
    background:"linear-gradient(135deg,#7c3aed,#9333ea)", color:"#fff",
    border:"none", borderRadius:10, padding:"8px 16px",
    fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit"
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <Toast msg={toast} />

      {/* Stats */}
      <div className="dash-stats"
        style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {stats.map(({ t,v,i,c }) => (
          <div key={t} style={{ background:"#fff", borderRadius:14, padding:"16px 14px",
            boxShadow:"0 4px 18px rgba(147,51,234,0.07)", border:"1px solid #ede9fe" }}>
            <div style={{ width:38, height:38, borderRadius:10, background:`${c}15`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:17, marginBottom:8 }}>{i}</div>
            <div style={{ fontSize:10, color:"#a78bfa", fontWeight:700,
              letterSpacing:0.5, marginBottom:2 }}>{t.toUpperCase()}</div>
            <div style={{ fontSize:24, fontWeight:800, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Role breakdown */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10 }}>
        {ROLES.map(role => {
          const count = accounts.filter(a=>a.role===role).length;
          const c = ROLE_COLOR[role] || "#9333ea";
          return (
            <div key={role} onClick={()=>setRoleFilter(roleFilter===role?"All":role)}
              style={{ background: roleFilter===role ? `${c}15` : "#fff",
                border:`1.5px solid ${roleFilter===role ? c : "#ede9fe"}`,
                borderRadius:12, padding:"12px 14px", cursor:"pointer",
                textAlign:"center", transition:"all 0.2s" }}>
              <div style={{ fontSize:20, fontWeight:800, color:c }}>{count}</div>
              <div style={{ fontSize:11, color: roleFilter===role ? c : "#a78bfa",
                fontWeight:700, marginTop:2 }}>{role}s</div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background:"#fff", borderRadius:16, padding:22,
        boxShadow:"0 4px 24px rgba(147,51,234,0.08)", border:"1px solid #ede9fe" }}>
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8 }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:T.text }}>
            All Accounts ({displayed.length})
          </h3>
          <button onClick={openAdd} style={BtnPrimary}>+ Add Account</button>
        </div>

        <div style={{ position:"relative", marginBottom:16 }}>
          <span style={{ position:"absolute", left:14, top:"50%",
            transform:"translateY(-50%)", pointerEvents:"none" }}>🔍</span>
          <input placeholder="Search by name, email, role..."
            value={search} onChange={e=>setSearch(e.target.value)}
            style={{ width:"100%", padding:"10px 14px 10px 40px",
              border:"1.5px solid #ede9fe", borderRadius:10, fontSize:13,
              color:T.text, background:"#faf5ff", outline:"none", fontFamily:"inherit" }} />
        </div>

        {loading
          ? <div style={{ textAlign:"center", padding:50, color:"#a78bfa" }}>Loading...</div>
          : displayed.length === 0
            ? <div style={{ textAlign:"center", padding:50 }}>
                <div style={{ fontSize:40, marginBottom:12 }}>👤</div>
                <div style={{ color:"#a78bfa", fontSize:14, fontWeight:600 }}>No accounts found</div>
              </div>
            : <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, minWidth:700 }}>
                  <thead>
                    <tr style={{ background:"linear-gradient(90deg,#f5f3ff,#faf5ff)" }}>
                      {["ID","Name","Email","Phone","Role","Status","Joined","Actions"].map(col => (
                        <th key={col} style={{ padding:"10px 14px", textAlign:"left",
                          color:"#7c3aed", fontWeight:700, fontSize:11,
                          borderBottom:"2px solid #ede9fe", whiteSpace:"nowrap" }}>
                          {col.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((a, i) => (
                      <tr key={a._id||i} style={{ borderBottom:"1px solid #f3f0ff" }}
                        onMouseEnter={e=>e.currentTarget.style.background="#faf5ff"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <td style={{ padding:"12px 14px", fontFamily:"monospace",
                          fontSize:11, color:"#a78bfa" }}>
                          {`ACC${String(i+1).padStart(3,"0")}`}
                        </td>
                        <td style={{ padding:"12px 14px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:30, height:30, borderRadius:"50%",
                              background:`linear-gradient(135deg,${ROLE_COLOR[a.role]||"#9333ea"},#c084fc)`,
                              display:"flex", alignItems:"center", justifyContent:"center",
                              color:"#fff", fontSize:11, fontWeight:700, flexShrink:0 }}>
                              {(a.name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight:700, color:T.text }}>{a.name}</div>
                              {a.notes && <div style={{ fontSize:11, color:"#a78bfa" }}>{a.notes}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"12px 14px", color:T.text }}>{a.email}</td>
                        <td style={{ padding:"12px 14px", color:"#a78bfa" }}>{a.phone||"—"}</td>
                        <td style={{ padding:"12px 14px" }}><RoleBadge label={a.role||"Client"} /></td>
                        <td style={{ padding:"12px 14px" }}><RoleBadge label={a.status||"Active"} /></td>
                        <td style={{ padding:"12px 14px", color:"#a78bfa", fontSize:12 }}>
                          {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td style={{ padding:"12px 14px" }}>
                          <div style={{ display:"flex", gap:5 }}>
                            <button onClick={()=>openEdit(a)}
                              style={{ background:"#f5f3ff", border:"1px solid #ede9fe",
                                borderRadius:7, padding:"4px 10px", fontSize:12,
                                color:"#7c3aed", cursor:"pointer", fontWeight:600 }}>Edit</button>
                            <button onClick={()=>del(a._id||a.id)}
                              style={{ background:"#fee2e2", border:"1px solid #fecaca",
                                borderRadius:7, padding:"4px 10px", fontSize:12,
                                color:"#ef4444", cursor:"pointer", fontWeight:600 }}>Del</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        }
      </div>

      {/* Modal */}
    {modal && (
  <Modal title={modal==="add" ? "Add New Account" : "Edit Account"}
    onClose={()=>setModal(null)}>
    <div className="modal-2col"
      style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 18px" }}>
      
      <div style={{ gridColumn:"1 / -1" }}>
        <Fld label="Expense Title *" value={form.title}
          onChange={v=>{setForm({...form,title:v});setErr(p=>({...p,title:""}));}}
          error={err.title} placeholder="e.g. Office Supplies" />
      </div>

      <Fld label="Category" value={form.category}
        onChange={v=>setForm({...form,category:v})}
        options={["Food","Travel","Office","Utilities","Marketing","Salary","Miscellaneous"]} />

      <Fld label="Expense Type" value={form.expenseType}
        onChange={v=>setForm({...form,expenseType:v})}
        options={["Operational","Capital","Recurring","One-Time"]} />

      <Fld label="Payment Mode" value={form.paymentMode}
        onChange={v=>setForm({...form,paymentMode:v})}
        options={["Cash","Card","UPI","Bank Transfer","Cheque"]} />

      <Fld label="Amount (₹) *" value={form.amount} type="number"
        onChange={v=>{setForm({...form,amount:v});setErr(p=>({...p,amount:""}));}}
        error={err.amount} placeholder="0.00" prefix="₹" />

      <div style={{ gridColumn:"1 / -1" }}>
        <Fld label="Status" value={form.status}
          onChange={v=>setForm({...form,status:v})}
          options={["Pending","Approved","Rejected"]} />
      </div>
    </div>

    {err._general && (
      <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:10,
        padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:8,
        fontSize:13, color:"#ef4444", fontWeight:600 }}>
        <span>⚠️</span>
        <span style={{ flex:1 }}>{err._general}</span>
        <button onClick={()=>setErr({})} style={{ background:"none", border:"none",
          color:"#ef4444", cursor:"pointer", fontSize:16 }}>✕</button>
      </div>
    )}

    <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:4 }}>
      <button onClick={()=>setModal(null)}
        style={{ background:"#f5f3ff", border:"1px solid #ede9fe", color:"#1e0a3c",
          borderRadius:10, padding:"10px 16px", cursor:"pointer",
          fontWeight:600, fontSize:13 }}>Cancel</button>
      <button onClick={save} disabled={saving}
        style={{ background:"linear-gradient(135deg,#7c3aed,#9333ea)", color:"#fff",
          border:"none", borderRadius:10, padding:"10px 20px", fontWeight:700,
          fontSize:13, cursor:"pointer", opacity:saving?0.7:1 }}>
        {saving ? "Saving…" : modal==="add" ? "Save Account →" : "Update Account →"}
      </button>
    </div>
  </Modal>
)}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  EXPENSES PAGE  (named export)
// ════════════════════════════════════════════════════════════
const EXPENSES_API   = `${BASE_URL}/api/expenses`;
const CATEGORIES     = ["Food","Travel","Office","Utilities","Marketing","Salary","Miscellaneous"];
const EXPENSE_TYPES  = ["Operational","Capital","Recurring","One-Time"];
const PAYMENT_MODES  = ["GPay", "PhonePe", "NEFT", "RTGS", "Cash", "Card", "UPI", "Bank Transfer", "Cheque"];
const EXP_STATUSES   = ["Pending","Approved","Rejected"];
const EXP_EMPTY      = { title:"", category:"Food", expenseType:"Operational", paymentMode:"Cash", amount:"", status:"Pending" };

const CATEGORY_COLOR = {
  Food:"#f59e0b", Travel:"#3b82f6", Office:"#8b5cf6",
  Utilities:"#06b6d4", Marketing:"#ec4899", Salary:"#22c55e", Miscellaneous:"#9333ea"
};
const CATEGORY_ICON = {
  Food:"🍽️", Travel:"✈️", Office:"🏢",
  Utilities:"💡", Marketing:"📣", Salary:"💰", Miscellaneous:"📦"
};
const EXP_STATUS_COLOR = { Pending:"#f59e0b", Approved:"#22C55E", Rejected:"#EF4444" };
const TYPE_COLOR       = { Operational:"#9333ea", Capital:"#3b82f6", Recurring:"#06b6d4", "One-Time":"#ec4899" };

function ExpBadge({ label, colorMap }) {
  const c = (colorMap||{})[label] || "#9333ea";
  return (
    <span style={{ background:`${c}18`, color:c, border:`1px solid ${c}33`,
      padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>
      {label}
    </span>
  );
}

export function ExpensesPage() {
  const [expenses,     setExpenses]     = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState("");
  const [catFilter,    setCatFilter]    = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modal,        setModal]        = useState(null);
  const [editId,       setEditId]       = useState(null);
  const [form,         setForm]         = useState(EXP_EMPTY);
  const [err,          setErr]          = useState({});
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState("");

  useEffect(() => { fetchExpenses(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(EXPENSES_API);
      setExpenses(res.data);
    } catch { setExpenses([]); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setForm(EXP_EMPTY); setErr({}); setEditId(null); setModal("add"); };

  const openEdit = (e) => {
    setForm({
      title:       e.title       || "",
      category:    e.category    || "Food",
      expenseType: e.expenseType || "Operational",
      paymentMode: e.paymentMode || "Cash",
      amount:      e.amount != null ? String(e.amount) : "",
      status:      e.status      || "Pending",
    });
    setEditId(e._id || e.id); setErr({}); setModal("edit");
  };
const save = async () => {
  const errs = {};
  if (!form.title?.trim()) errs.title = "Title required";
  if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
    errs.amount = "Valid amount required";
  if (Object.keys(errs).length) { setErr(errs); return; }

  const payload = { ...form, amount: Number(form.amount) };
  try {
    setSaving(true);
    if (modal === "add") {
      const res = await axios.post(EXPENSES_API, payload);
      setExpenses(prev => [res.data, ...prev]);
    } else {
      const res = await axios.put(`${EXPENSES_API}/${editId}`, payload);
      setExpenses(prev => prev.map(a => (a._id||a.id)===editId ? res.data : a));
    }
    showToast(modal==="add" ? "✅ Account added!" : "✅ Account updated!");
    setModal(null);
  } catch (e) {
    setErr({ _general: e?.response?.data?.msg || "Failed to save" });
  } finally { setSaving(false); }
};
  const del = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try { await axios.delete(`${EXPENSES_API}/${id}`); } catch {}
    setExpenses(prev => prev.filter(e => (e._id||e.id) !== id));
    showToast("🗑️ Deleted!");
  };

  const totalAmount    = expenses.reduce((s,e) => s + (Number(e.amount)||0), 0);
  const approvedAmount = expenses.filter(e=>e.status==="Approved").reduce((s,e)=>s+(Number(e.amount)||0),0);

  const displayed = expenses.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (e.title||"").toLowerCase().includes(q) ||
      (e.category||"").toLowerCase().includes(q) ||
      (e.paymentMode||"").toLowerCase().includes(q);
    const matchCat    = catFilter    === "All" || e.category === catFilter;
    const matchStatus = statusFilter === "All" || e.status   === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const stats = [
    { t:"Total Expenses", v:`₹${totalAmount.toLocaleString()}`,    c:"#9333ea", i:"💸" },
    { t:"Approved",       v:`₹${approvedAmount.toLocaleString()}`, c:"#22C55E", i:"✅" },
    { t:"Pending",        v:expenses.filter(e=>e.status==="Pending").length,  c:"#f59e0b", i:"⏳" },
    { t:"Rejected",       v:expenses.filter(e=>e.status==="Rejected").length, c:"#EF4444", i:"❌" },
  ];

  const BtnPrimary = {
    background:"linear-gradient(135deg,#7c3aed,#9333ea)", color:"#fff",
    border:"none", borderRadius:10, padding:"8px 16px",
    fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit"
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <Toast msg={toast} />

      {/* Stats */}
      <div className="dash-stats"
        style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {stats.map(({ t,v,i,c }) => (
          <div key={t} style={{ background:"#fff", borderRadius:14, padding:"16px 14px",
            boxShadow:"0 4px 18px rgba(147,51,234,0.07)", border:"1px solid #ede9fe" }}>
            <div style={{ width:38, height:38, borderRadius:10, background:`${c}15`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:17, marginBottom:8 }}>{i}</div>
            <div style={{ fontSize:10, color:"#a78bfa", fontWeight:700,
              letterSpacing:0.5, marginBottom:2 }}>{t.toUpperCase()}</div>
            <div style={{ fontSize:22, fontWeight:800, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10 }}>
        {CATEGORIES.map(cat => {
          const count = expenses.filter(e=>e.category===cat).length;
          const total = expenses.filter(e=>e.category===cat).reduce((s,e)=>s+(Number(e.amount)||0),0);
          const c = CATEGORY_COLOR[cat] || "#9333ea";
          return (
            <div key={cat} onClick={()=>setCatFilter(catFilter===cat?"All":cat)}
              style={{ background: catFilter===cat ? `${c}15` : "#fff",
                border:`1.5px solid ${catFilter===cat ? c : "#ede9fe"}`,
                borderRadius:12, padding:"12px 14px", cursor:"pointer",
                textAlign:"center", transition:"all 0.2s" }}>
              <div style={{ fontSize:18, marginBottom:4 }}>{CATEGORY_ICON[cat]}</div>
              <div style={{ fontSize:18, fontWeight:800, color:c }}>{count}</div>
              <div style={{ fontSize:10, color: catFilter===cat ? c : "#a78bfa",
                fontWeight:700, marginTop:2 }}>{cat}</div>
              {total > 0 && <div style={{ fontSize:10, color:"#a78bfa", marginTop:2 }}>₹{total.toLocaleString()}</div>}
            </div>
          );
        })}
      </div>

      {/* Status filter pills */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {["All","Pending","Approved","Rejected"].map(s => {
          const c = s==="All" ? "#9333ea" : EXP_STATUS_COLOR[s];
          const active = statusFilter === s;
          return (
            <button key={s} onClick={()=>setStatusFilter(s)}
              style={{ background: active ? c : "#fff",
                border:`1.5px solid ${active ? c : "#ede9fe"}`,
                color: active ? "#fff" : c, borderRadius:20, padding:"6px 16px",
                fontSize:12, fontWeight:700, cursor:"pointer", transition:"all 0.2s",
                fontFamily:"inherit" }}>
              {s === "All" ? "All Statuses" : s}
              {s !== "All" && (
                <span style={{ marginLeft:6, background: active ? "rgba(255,255,255,0.25)" : `${c}20`,
                  borderRadius:10, padding:"1px 7px", fontSize:11 }}>
                  {expenses.filter(e=>e.status===s).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background:"#fff", borderRadius:16, padding:22,
        boxShadow:"0 4px 24px rgba(147,51,234,0.08)", border:"1px solid #ede9fe" }}>
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8 }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:T.text }}>
            All Expenses ({displayed.length})
          </h3>
          <button onClick={openAdd} style={BtnPrimary}>+ Add Expense</button>
        </div>

        <div style={{ position:"relative", marginBottom:16 }}>
          <span style={{ position:"absolute", left:14, top:"50%",
            transform:"translateY(-50%)", pointerEvents:"none" }}>🔍</span>
          <input placeholder="Search by title, category, payment mode..."
            value={search} onChange={e=>setSearch(e.target.value)}
            style={{ width:"100%", padding:"10px 14px 10px 40px",
              border:"1.5px solid #ede9fe", borderRadius:10, fontSize:13,
              color:T.text, background:"#faf5ff", outline:"none", fontFamily:"inherit" }} />
        </div>

        {loading
          ? <div style={{ textAlign:"center", padding:50, color:"#a78bfa" }}>Loading...</div>
          : displayed.length === 0
            ? <div style={{ textAlign:"center", padding:50 }}>
                <div style={{ fontSize:40, marginBottom:12 }}>💸</div>
                <div style={{ color:"#a78bfa", fontSize:14, fontWeight:600 }}>No expenses found</div>
              </div>
            : <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, minWidth:800 }}>
                  <thead>
                    <tr style={{ background:"linear-gradient(90deg,#f5f3ff,#faf5ff)" }}>
                      {["ID","Title","Category","Type","Payment Mode","Amount","Status","Date","Actions"].map(col => (
                        <th key={col} style={{ padding:"10px 14px", textAlign:"left",
                          color:"#7c3aed", fontWeight:700, fontSize:11,
                          borderBottom:"2px solid #ede9fe", whiteSpace:"nowrap" }}>
                          {col.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((e, i) => (
                      <tr key={e._id||i} style={{ borderBottom:"1px solid #f3f0ff" }}
                        onMouseEnter={ev=>ev.currentTarget.style.background="#faf5ff"}
                        onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                        <td style={{ padding:"12px 14px", fontFamily:"monospace", fontSize:11, color:"#a78bfa" }}>
                          {`EXP${String(i+1).padStart(3,"0")}`}
                        </td>
                        <td style={{ padding:"12px 14px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:30, height:30, borderRadius:10,
                              background:`${CATEGORY_COLOR[e.category]||"#9333ea"}15`,
                              display:"flex", alignItems:"center", justifyContent:"center",
                              fontSize:14, flexShrink:0 }}>
                              {CATEGORY_ICON[e.category]||"📦"}
                            </div>
                            <div style={{ fontWeight:700, color:T.text }}>{e.title}</div>
                          </div>
                        </td>
                        <td style={{ padding:"12px 14px" }}>
                          <ExpBadge label={e.category||"Miscellaneous"} colorMap={CATEGORY_COLOR} />
                        </td>
                        <td style={{ padding:"12px 14px" }}>
                          <ExpBadge label={e.expenseType||"Operational"} colorMap={TYPE_COLOR} />
                        </td>
                        <td style={{ padding:"12px 14px", color:"#a78bfa" }}>{e.paymentMode||"—"}</td>
                        <td style={{ padding:"12px 14px" }}>
                          <span style={{ fontWeight:800, color:"#1e0a3c", fontSize:14 }}>
                            ₹{Number(e.amount||0).toLocaleString()}
                          </span>
                        </td>
                        <td style={{ padding:"12px 14px" }}>
                          <ExpBadge label={e.status||"Pending"} colorMap={EXP_STATUS_COLOR} />
                        </td>
                        <td style={{ padding:"12px 14px", color:"#a78bfa", fontSize:12 }}>
                          {e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td style={{ padding:"12px 14px" }}>
                          <div style={{ display:"flex", gap:5 }}>
                            <button onClick={()=>openEdit(e)}
                              style={{ background:"#f5f3ff", border:"1px solid #ede9fe",
                                borderRadius:7, padding:"4px 10px", fontSize:12,
                                color:"#7c3aed", cursor:"pointer", fontWeight:600 }}>Edit</button>
                            <button onClick={()=>del(e._id||e.id)}
                              style={{ background:"#fee2e2", border:"1px solid #fecaca",
                                borderRadius:7, padding:"4px 10px", fontSize:12,
                                color:"#ef4444", cursor:"pointer", fontWeight:600 }}>Del</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background:"linear-gradient(90deg,#f5f3ff,#faf5ff)", borderTop:"2px solid #ede9fe" }}>
                      <td colSpan={5} style={{ padding:"12px 14px", fontWeight:700, color:"#7c3aed", fontSize:12 }}>
                        SHOWING {displayed.length} OF {expenses.length} EXPENSES
                      </td>
                      <td style={{ padding:"12px 14px", fontWeight:800, color:"#9333ea", fontSize:15 }}>
                        ₹{displayed.reduce((s,e)=>s+(Number(e.amount)||0),0).toLocaleString()}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
        }
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={modal==="add" ? "Add New Expense" : "Edit Expense"}
          onClose={()=>setModal(null)}>
          <div className="modal-2col"
            style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 18px" }}>
            <div style={{ gridColumn:"1 / -1" }}>
              <Fld label="Expense Title *" value={form.title}
                onChange={v=>{setForm({...form,title:v});setErr(p=>({...p,title:""}));}}
                error={err.title} placeholder="e.g. Office Supplies" />
            </div>
            <Fld label="Category" value={form.category}
              onChange={v=>setForm({...form,category:v})} options={CATEGORIES} />
            <Fld label="Expense Type" value={form.expenseType}
              onChange={v=>setForm({...form,expenseType:v})} options={EXPENSE_TYPES} />
            <Fld label="Payment Mode" value={form.paymentMode}
              onChange={v=>setForm({...form,paymentMode:v})} options={PAYMENT_MODES} />
            <Fld label="Amount (₹) *" value={form.amount} type="number"
              onChange={v=>{setForm({...form,amount:v});setErr(p=>({...p,amount:""}));}}
              error={err.amount} placeholder="0.00" prefix="₹" />
            <div style={{ gridColumn:"1 / -1" }}>
              <Fld label="Status" value={form.status}
                onChange={v=>setForm({...form,status:v})} options={EXP_STATUSES} />
            </div>
          </div>

          {form.title && (
            <div style={{ background:"linear-gradient(135deg,#f5f3ff,#faf5ff)",
              borderRadius:12, padding:"14px 16px", border:"1px solid #ede9fe",
              marginBottom:14, display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:12,
                background:`${CATEGORY_COLOR[form.category]||"#9333ea"}20`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:20, flexShrink:0 }}>
                {CATEGORY_ICON[form.category]||"📦"}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:T.text }}>{form.title}</div>
                <div style={{ fontSize:12, color:"#a78bfa", marginTop:2, display:"flex", gap:6, flexWrap:"wrap" }}>
                  <ExpBadge label={form.category} colorMap={CATEGORY_COLOR} />
                  <ExpBadge label={form.expenseType} colorMap={TYPE_COLOR} />
                  <ExpBadge label={form.status} colorMap={EXP_STATUS_COLOR} />
                </div>
              </div>
              {form.amount && (
                <div style={{ fontWeight:800, fontSize:18, color:"#9333ea" }}>
                  ₹{Number(form.amount).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {err._general && (
            <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:10,
              padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:8,
              fontSize:13, color:"#ef4444", fontWeight:600 }}>
              <span>⚠️</span>
              <span style={{ flex:1 }}>{err._general}</span>
              <button onClick={()=>setErr({})} style={{ background:"none", border:"none",
                color:"#ef4444", cursor:"pointer", fontSize:16, lineHeight:1 }}>✕</button>
            </div>
          )}

          <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:4 }}>
            <button onClick={()=>setModal(null)}
              style={{ background:"#f5f3ff", border:"1px solid #ede9fe", color:T.text,
                borderRadius:10, padding:"10px 16px", cursor:"pointer",
                fontWeight:600, fontSize:13 }}>Cancel</button>
            <button onClick={save} disabled={saving}
              style={{ background:"linear-gradient(135deg,#7c3aed,#9333ea)", color:"#fff",
                border:"none", borderRadius:10, padding:"10px 20px", fontWeight:700,
                fontSize:13, cursor:"pointer", opacity:saving?0.7:1 }}>
              {saving ? "Saving…" : modal==="add" ? "Save Expense →" : "Update Expense →"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  INCOME PAGE  (named export)
// ════════════════════════════════════════════════════════════
const INCOME_API     = `${BASE_URL}/api/income`;
const INCOME_CATS    = ["Project Payment", "Advance", "Service Fee", "Maintenance", "Miscellaneous"];
const INCOME_MODES   = ["GPay", "PhonePe", "NEFT", "RTGS", "Cash", "Check", "Card", "UPI", "Bank Transfer"];
const INCOME_STATUSES = ["Received", "Pending", "Cancelled"];
const INC_EMPTY      = { title:"", category:"Project Payment", paymentMode:"GPay", amount:"", client:"", invoiceNo:"", transactionId:"", status:"Received" };

const INC_CAT_COLOR = {
  "Project Payment":"#22c55e", Advance:"#3b82f6", "Service Fee":"#8b5cf6",
  Maintenance:"#06b6d4", Miscellaneous:"#9333ea"
};
const INC_STATUS_COLOR = { Received:"#22C55E", Pending:"#f59e0b", Cancelled:"#EF4444" };

export function IncomePage() {
  const [income,       setIncome]       = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState("");
  const [catFilter,    setCatFilter]    = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modal,        setModal]        = useState(null);
  const [editId,       setEditId]       = useState(null);
  const [form,         setForm]         = useState(INC_EMPTY);
  const [err,          setErr]          = useState({});
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState("");

  useEffect(() => { fetchIncome(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const fetchIncome = async () => {
    try {
      setLoading(true);
      const res = await axios.get(INCOME_API);
      setIncome(res.data);
    } catch { setIncome([]); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setForm(INC_EMPTY); setErr({}); setEditId(null); setModal("add"); };
  const openEdit = (i) => {
    setForm({
      title:         i.title         || "",
      category:      i.category      || "Project Payment",
      paymentMode:   i.paymentMode   || "GPay",
      amount:        i.amount != null ? String(i.amount) : "",
      client:        i.client        || "",
      invoiceNo:     i.invoiceNo     || "",
      transactionId: i.transactionId || "",
      status:        i.status        || "Received",
    });
    setEditId(i._id || i.id); setErr({}); setModal("edit");
  };

  const save = async () => {
    const errs = {};
    if (!form.title?.trim()) errs.title = "Title required";
    if (!form.client?.trim()) errs.client = "Client required";
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
      errs.amount = "Valid amount required";
    if (Object.keys(errs).length) { setErr(errs); return; }

    const payload = { ...form, amount: Number(form.amount) };
    try {
      setSaving(true);
      if (modal === "add") {
        const res = await axios.post(INCOME_API, payload);
        setIncome(prev => [res.data, ...prev]);
      } else {
        const res = await axios.put(`${INCOME_API}/${editId}`, payload);
        setIncome(prev => prev.map(i => (i._id||i.id)===editId ? res.data : i));
      }
      showToast(modal==="add" ? "✅ Income added!" : "✅ Income updated!");
      setModal(null);
    } catch (e) {
      setErr({ _general: e?.response?.data?.msg || "Failed to save" });
    } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    try { await axios.delete(`${INCOME_API}/${id}`); } catch {}
    setIncome(prev => prev.filter(i => (i._id||i.id) !== id));
    showToast("🗑️ Deleted!");
  };

  const totalIncome = income.reduce((s,i) => s + (Number(i.amount)||0), 0);
  const received    = income.filter(i=>i.status==="Received").reduce((s,i)=>s+(Number(i.amount)||0),0);

  const displayed = income.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (i.title||"").toLowerCase().includes(q) ||
      (i.client||"").toLowerCase().includes(q) ||
      (i.invoiceNo||"").toLowerCase().includes(q) ||
      (i.transactionId||"").toLowerCase().includes(q);
    const matchCat    = catFilter    === "All" || i.category === catFilter;
    const matchStatus = statusFilter === "All" || i.status   === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const stats = [
    { t:"Total Income", v:`₹${totalIncome.toLocaleString()}`,    c:"#22c55e", i:"💰" },
    { t:"Received",     v:`₹${received.toLocaleString()}`,       c:"#16a34a", i:"✅" },
    { t:"Pending",      v:income.filter(i=>i.status==="Pending").length,   c:"#f59e0b", i:"⏳" },
    { t:"Categories",   v:[...new Set(income.map(i=>i.category))].length, c:"#8b5cf6", i:"🏷️" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <Toast msg={toast} />

      <div className="dash-stats" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {stats.map(({ t,v,i,c }) => (
          <div key={t} style={{ background:"#fff", borderRadius:14, padding:"16px 14px", boxShadow:"0 4px 18px rgba(34,197,94,0.07)", border:"1px solid #ede9fe" }}>
            <div style={{ width:38, height:38, borderRadius:10, background:`${c}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, marginBottom:8 }}>{i}</div>
            <div style={{ fontSize:10, color:c, fontWeight:700, letterSpacing:0.5, marginBottom:2 }}>{t.toUpperCase()}</div>
            <div style={{ fontSize:22, fontWeight:800, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {["All", ...INCOME_CATS].map(cat => (
            <button key={cat} onClick={()=>setCatFilter(cat)} style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:700, cursor:"pointer", border:"1.5px solid", borderColor:catFilter===cat?"#22c55e":"#ede9fe", background:catFilter===cat?"#f0fdf4":"#fff", color:catFilter===cat?"#16a34a":"#a78bfa", fontFamily:"inherit" }}>{cat}</button>
          ))}
        </div>
        <button onClick={openAdd} style={{ background:"linear-gradient(135deg,#16a34a,#22c55e)", color:"#fff", border:"none", borderRadius:10, padding:"8px 16px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>+ Add Income</button>
      </div>

      <div style={{ background:"#fff", borderRadius:16, padding:22, boxShadow:"0 4px 24px rgba(34,197,94,0.08)", border:"1px solid #ede9fe" }}>
        <div style={{ position:"relative", marginBottom:16 }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>🔍</span>
          <input placeholder="Search by title, client, invoice, txn..." value={search} onChange={e=>setSearch(e.target.value)} style={{ width:"100%", padding:"10px 14px 10px 40px", border:"1.5px solid #ede9fe", borderRadius:10, fontSize:13, color:"#1e0a3c", background:"#f0fdf4", outline:"none", fontFamily:"inherit" }} />
        </div>

        {loading ? <div style={{ textAlign:"center", padding:50, color:"#a78bfa" }}>Loading...</div> : displayed.length === 0 ? <div style={{ textAlign:"center", padding:50 }}><div style={{ fontSize:40, marginBottom:12 }}>💰</div><div style={{ color:"#a78bfa", fontSize:14, fontWeight:600 }}>No income found</div></div>
          : <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, minWidth:900 }}>
                <thead><tr style={{ background:"linear-gradient(90deg,#f0fdf4,#faf5ff)" }}>{["ID","Title","Client","Inv #","Amount","Mode","Status","Date","Actions"].map(col => (<th key={col} style={{ padding:"10px 14px", textAlign:"left", color:"#16a34a", fontWeight:700, fontSize:11, borderBottom:"2px solid #ede9fe", whiteSpace:"nowrap" }}>{col.toUpperCase()}</th>))}</tr></thead>
                <tbody>
                  {displayed.map((inc, i) => (
                    <tr key={inc._id||i} style={{ borderBottom:"1px solid #f3f0ff" }} onMouseEnter={ev=>ev.currentTarget.style.background="#f0fdf4"} onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                      <td style={{ padding:"12px 14px", fontFamily:"monospace", fontSize:11, color:"#a78bfa" }}>{`INC${String(i+1).padStart(3,"0")}`}</td>
                      <td style={{ padding:"12px 14px" }}><div style={{ fontWeight:700, color:"#1e0a3c" }}>{inc.title}</div>{inc.transactionId && <div style={{ fontSize:10, color:"#a78bfa" }}>Txn: {inc.transactionId}</div>}</td>
                      <td style={{ padding:"12px 14px", color:"#1e0a3c", fontWeight:600 }}>{inc.client}</td>
                      <td style={{ padding:"12px 14px", color:"#16a34a", fontWeight:700 }}>{inc.invoiceNo||"—"}</td>
                      <td style={{ padding:"12px 14px" }}><span style={{ fontWeight:800, color:"#16a34a", fontSize:14 }}>₹{Number(inc.amount||0).toLocaleString()}</span></td>
                      <td style={{ padding:"12px 14px", color:"#a78bfa" }}>{inc.paymentMode}</td>
                      <td style={{ padding:"12px 14px" }}><ExpBadge label={inc.status||"Received"} colorMap={INC_STATUS_COLOR} /></td>
                      <td style={{ padding:"12px 14px", color:"#a78bfa", fontSize:12 }}>{inc.date || (inc.createdAt ? new Date(inc.createdAt).toLocaleDateString() : "—")}</td>
                      <td style={{ padding:"12px 14px" }}><div style={{ display:"flex", gap:5 }}><button onClick={()=>openEdit(inc)} style={{ background:"#f0fdf4", border:"1px solid #dcfce7", borderRadius:7, padding:"4px 10px", fontSize:12, color:"#16a34a", cursor:"pointer", fontWeight:600 }}>Edit</button><button onClick={()=>del(inc._id||inc.id)} style={{ background:"#fee2e2", border:"1px solid #fecaca", borderRadius:7, padding:"4px 10px", fontSize:12, color:"#ef4444", cursor:"pointer", fontWeight:600 }}>Del</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>

      {modal && (
        <Modal title={modal==="add" ? "Add Income Entry" : "Edit Income Entry"} onClose={()=>setModal(null)}>
          <div className="modal-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 18px" }}>
            <div style={{ gridColumn:"1 / -1" }}><Fld label="Income Title *" value={form.title} onChange={v=>{setForm({...form,title:v});setErr(p=>({...p,title:""}));}} error={err.title} placeholder="e.g. Payment for Invoice #001" /></div>
            <Fld label="Client Name *" value={form.client} onChange={v=>{setForm({...form,client:v});setErr(p=>({...p,client:""}));}} error={err.client} placeholder="e.g. Acme Corp" />
            <Fld label="Amount (₹) *" value={form.amount} type="number" onChange={v=>{setForm({...form,amount:v});setErr(p=>({...p,amount:""}));}} error={err.amount} placeholder="0.00" prefix="₹" />
            <Fld label="Category" value={form.category} onChange={v=>setForm({...form,category:v})} options={INCOME_CATS} />
            <Fld label="Payment Mode" value={form.paymentMode} onChange={v=>setForm({...form,paymentMode:v})} options={INCOME_MODES} />
            <Fld label="Invoice No" value={form.invoiceNo} onChange={v=>setForm({...form,invoiceNo:v})} placeholder="INV-001" />
            <Fld label="Transaction ID" value={form.transactionId} onChange={v=>setForm({...form,transactionId:v})} placeholder="TXN-9988" />
            <Fld label="Payment Date" value={form.date} type="date" onChange={v=>setForm({...form,date:v})} />
            <div style={{ gridColumn:"1 / -1" }}><Fld label="Status" value={form.status} onChange={v=>setForm({...form,status:v})} options={INCOME_STATUSES} /></div>
          </div>
          {err._general && <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:10, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#ef4444", fontWeight:600 }}><span>⚠️</span><span style={{ flex:1 }}>{err._general}</span><button onClick={()=>setErr({})} style={{ background:"none", border:"none", color:"#ef4444", cursor:"pointer", fontSize:16, lineHeight:1 }}>✕</button></div>}
          <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:4 }}>
            <button onClick={()=>setModal(null)} style={{ background:"#f5f3ff", border:"1px solid #ede9fe", color:"#1e0a3c", borderRadius:10, padding:"10px 16px", cursor:"pointer", fontWeight:600, fontSize:13 }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ background:"linear-gradient(135deg,#16a34a,#22c55e)", color:"#fff", border:"none", borderRadius:10, padding:"10px 20px", fontWeight:700, fontSize:13, cursor:"pointer", opacity:saving?0.7:1 }}>{saving ? "Saving…" : modal==="add" ? "Save Income →" : "Update Income →"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
