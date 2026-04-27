import { useState, useEffect, useRef } from "react";
import React from "react";
import axios from "axios";
import { BASE_URL } from "../config";
import InvoiceCreator from "./InvoiceCreator";
import TaskPage from "./TaskPage";
import CalendarPage from "./CalendarPage";
import AccountsPage, { ExpensesPage } from "./AccountsPage";
import ReportsPage from "./ReportsPage";
import QuotationCreator from "./QuotationCreator";
import ProjectProposalCreator from "./ProjectProposalCreator";
import AdminProposalManagement from "./AdminProposalManagement";
import RolePermissionDashboard from "./RolePermissionDashboard";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { QRCodeSVG } from "qrcode.react";
import { SubAdminDocumentsPage } from "./EmployeeProfilePanel";
import { DOC_TYPES } from "./EmployeeProfilePanel";
import AuthPage from "./AuthPage";
import MySubscriptions from "./MySubscriptions";


const T = { primary: "#3b0764", sidebar: "#1e0a3c", accent: "#9333ea", bg: "#f5f3ff", card: "#FFFFFF", text: "#1e0a3c", muted: "#7c3aed", border: "#ede9fe" };
const TRACKING_SEED = [{ id: "PRJ001", name: "Website Redesign", client: "TechNova Pvt Ltd", deadline: "2024-05-30", pct: 65, status: "In Progress", note: "Design done, dev ongoing" }, { id: "PRJ002", name: "Mobile App Dev", client: "Bloom Creatives", deadline: "2024-08-15", pct: 15, status: "Pending", note: "Requirements gathering" }, { id: "PRJ003", name: "ERP Integration", client: "Infra Solutions", deadline: "2024-04-30", pct: 100, status: "Completed", note: "Signed off by client" }];
const INVOICES = [{ id: "INV001", client: "TechNova Pvt Ltd", project: "Website Redesign", date: "2024-04-01", due: "2024-04-30", total: "₹1,47,500", status: "Paid" }, { id: "INV002", client: "Infra Solutions", project: "ERP Integration", date: "2024-05-01", due: "2024-05-15", total: "₹4,24,800", status: "Overdue" }, { id: "INV003", client: "Bloom Creatives", project: "Mobile App Dev", date: "2024-05-10", due: "2024-06-10", total: "₹1,18,000", status: "Pending" }];

const NAV = [
  { key: "dashboard", icon: "🏠", label: "Dashboard" },
  { key: "clients", icon: "👥", label: "Clients" },
  { key: "subadmins", icon: "🛡️", label: "Subadmins" },
  { key: "employees", icon: "👨‍💼", label: "Employees" },
  { key: "managers", icon: "🧑‍💼", label: "Managers" },
  { key: "projects", icon: "📁", label: "Projects" },
  { key: "quotations", icon: "📋", label: "Quotations" },
  { key: "proposals", icon: "🎨", label: "Project Proposals" },
  { key: "invoices", icon: "🧾", label: "Invoices" },
  { key: "tracking", icon: "📊", label: "Project Status" },
  { key: "tasks", icon: "✅", label: "Tasks" },
  { key: "calendar", icon: "📅", label: "Calendar" },
  { key: "accounts", icon: "👤", label: "Accounts" },
  { key: "interviews", icon: "🎯", label: "Interviews" },
  { key: "reports", icon: "📈", label: "Reports" },
  { key: "mysubscriptions", icon: "💳", label: "My Subscriptions" },
  { key: "packages", icon: "📦", label: "Packages" },
  { key: "payments", icon: "💰", label: "Payments" },
  { key: "vendors", icon: "🏬", label: "Vendors" },
  { key: "rolePermissions", icon: "🛡️", label: "Role Permissions" }

];

function getNavForRole(role) {
  const r = (role || "").toLowerCase().trim();
  if (r === "subadmin" || r === "sub_admin" || r === "sub-admin")
    return NAV.filter(n => ["dashboard", "clients", "employees", "managers", "projects", "quotations", "proposals", "invoices", "tracking", "tasks", "calendar", "accounts", "interviews", "reports", "mysubscriptions", "packages", "payments", "vendors", "rolePermissions"].includes(n.key));
  if (r === "manager")
    return NAV.filter(n => ["dashboard", "employees", "projects", "tracking", "tasks", "calendar", "interviews", "reports", "vendors"].includes(n.key));
  if (r === "employee")
    return NAV.filter(n => ["dashboard", "tasks", "calendar"].includes(n.key));
  return NAV;
}

const sc = s => ({ Active: "#22C55E", Inactive: "#EF4444", "In Progress": "#9333ea", Pending: "#F59E0B", Completed: "#22C55E", "On Hold": "#a855f7", Sent: "#9333ea", Approved: "#22C55E", Rejected: "#EF4444", Paid: "#22C55E", Overdue: "#EF4444", Client: "#9333ea", Employee: "#c084fc", Manager: "#f59e0b", pending: "#F59E0B", hired: "#22C55E", rejected: "#EF4444" }[s] || "#a855f7");

function Badge({ label }) { const c = sc(label); return <span style={{ background: `${c}18`, color: c, border: `1px solid ${c}33`, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{label}</span>; }

function SC({ title, children, action }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 4px 24px rgba(147,51,234,0.08)", border: "1px solid #ede9fe" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Search({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", marginBottom: 16 }}>
      <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>🔍</span>
      <input type="text" placeholder={placeholder || "Search..."} value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "10px 14px 10px 40px", border: "1.5px solid #ede9fe", borderRadius: 10, fontSize: 13, color: T.text, background: "#faf5ff", outline: "none", fontFamily: "inherit" }} />
    </div>
  );
}

function Mdl({ title, onClose, children, maxWidth = 820 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(59,7,100,0.55)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(147,51,234,0.25)" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid #ede9fe", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(90deg,#f5f3ff,#faf5ff)", flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.text }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#7c3aed", padding: "4px 8px" }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", padding: "20px 22px", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

function Fld({ label, value, onChange, options, type = "text", error, placeholder, disabled }) {
  const s = { width: "100%", border: `1.5px solid ${error ? "#EF4444" : "#ede9fe"}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: T.text, background: disabled ? "#f3f0ff" : "#faf5ff", boxSizing: "border-box", outline: "none", fontFamily: "inherit", opacity: disabled ? 0.7 : 1 };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>{label.toUpperCase()}</label>
      {options ? <select value={value} onChange={e => onChange(e.target.value)} style={s} disabled={disabled}>{options.map(o => <option key={o}>{o}</option>)}</select>
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} style={s} placeholder={placeholder || ""} disabled={disabled} />}
      {error && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠️ {error}</div>}
    </div>
  );
}

function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = "Delete", danger = true }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(59,7,100,0.6)", backdropFilter: "blur(8px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 18, width: "100%", maxWidth: 400, padding: "28px 28px 22px", boxShadow: "0 32px 80px rgba(147,51,234,0.25)" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: danger ? "#fee2e2" : "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 14px" }}>
          {danger ? "🗑️" : "✅"}
        </div>
        <h3 style={{ textAlign: "center", margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: T.text }}>{title}</h3>
        <p style={{ textAlign: "center", color: "#6b7280", fontSize: 13, margin: "0 0 22px" }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px", background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: 10, fontSize: 13, fontWeight: 600, color: T.text, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "10px", background: danger ? "linear-gradient(135deg,#EF4444,#dc2626)" : "linear-gradient(135deg,#22C55E,#16a34a)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Action Buttons (View / Edit / Delete) ────────────────────
function ActionBtns({ onView, onEdit, onDelete }) {
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "nowrap" }}>
      {onView && <button onClick={onView} title="View" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 7, padding: "5px 10px", fontSize: 12, color: "#6366f1", cursor: "pointer", fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap" }}>👁 View</button>}
      <button onClick={onEdit} title="Edit" style={{ background: "rgba(147,51,234,0.1)", border: "1px solid rgba(147,51,234,0.3)", borderRadius: 7, padding: "5px 10px", fontSize: 12, color: "#9333ea", cursor: "pointer", fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap" }}>✏️ Edit</button>
      <button onClick={onDelete} title="Delete" style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 7, padding: "5px 10px", fontSize: 12, color: "#ef4444", cursor: "pointer", fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap" }}>🗑 Delete</button>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#faf5ff", borderRadius: 9, border: "1px solid #ede9fe", marginBottom: 7 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(147,51,234,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{icon}</div>
      <div><div style={{ fontSize: 10, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div><div style={{ fontSize: 13, fontWeight: 600, color: "#1e0a3c", marginTop: 1 }}>{value}</div></div>
    </div>
  );
}

function ClientDropdown({ clients, value, onChange, error, onAddClient }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = clients.filter(c => (c.clientName || c.name || "").toLowerCase().includes(search.toLowerCase()) || (c.companyName || c.company || "").toLowerCase().includes(search.toLowerCase()));
  const selected = clients.find(c => (c.clientName || c.name) === value);
  return (
    <div style={{ position: "relative" }}>
      <div onClick={() => setOpen(!open)} style={{ width: "100%", border: `1.5px solid ${error ? "#EF4444" : open ? "#9333ea" : "#ede9fe"}`, borderRadius: 10, padding: "10px 36px 10px 14px", fontSize: 13, color: value ? T.text : "#a78bfa", background: "#faf5ff", cursor: "pointer", userSelect: "none", boxSizing: "border-box", position: "relative", minHeight: 42 }}>
        {value ? (<div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#9333ea,#c084fc)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{value[0].toUpperCase()}</div><span>{value}</span>{selected?.companyName && <span style={{ fontSize: 11, color: "#a78bfa" }}>({selected.companyName})</span>}</div>) : "-- Select Client --"}
        <span style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, fontSize: 10, color: "#a78bfa", transition: "0.2s" }}>▼</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #ede9fe", borderRadius: 12, boxShadow: "0 8px 32px rgba(147,51,234,0.15)", zIndex: 999, overflow: "hidden" }}>
          <div style={{ padding: "10px 10px 6px" }}><div style={{ position: "relative" }}><span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12 }}>🔍</span><input autoFocus placeholder="Search client..." value={search} onChange={e => setSearch(e.target.value)} onClick={e => e.stopPropagation()} style={{ width: "100%", padding: "7px 10px 7px 30px", border: "1.5px solid #ede9fe", borderRadius: 8, fontSize: 12, background: "#faf5ff", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} /></div></div>
          {onAddClient && <div onClick={() => { setOpen(false); setSearch(""); onAddClient(); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: "linear-gradient(90deg,#f3e8ff,#faf5ff)", borderBottom: "2px solid #ede9fe" }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#9333ea,#c084fc)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 17, fontWeight: 700, flexShrink: 0 }}>+</div><div><div style={{ fontSize: 13, fontWeight: 700, color: "#9333ea" }}>Add New Client</div></div></div>}
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filtered.length === 0 ? <div style={{ padding: 14, textAlign: "center", color: "#a78bfa", fontSize: 13 }}>No clients found</div>
              : filtered.map((c, i) => { const name = c.clientName || c.name || ""; const company = c.companyName || c.company || ""; const isSel = value === name; return (<div key={i} onClick={() => { onChange(name); setOpen(false); setSearch(""); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: isSel ? "#f3e8ff" : "transparent", borderBottom: "1px solid #f5f3ff" }} onMouseEnter={e => e.currentTarget.style.background = "#faf5ff"} onMouseLeave={e => e.currentTarget.style.background = isSel ? "#f3e8ff" : "transparent"}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#9333ea,#c084fc)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{name[0]?.toUpperCase() || "?"}</div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{name}</div>{company && <div style={{ fontSize: 11, color: "#a78bfa" }}>{company}</div>}</div>{isSel && <span style={{ fontSize: 14, color: "#9333ea" }}>✓</span>}</div>); })}
          </div>
        </div>
      )}
      {open && <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={() => { setOpen(false); setSearch(""); }} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CLIENTS PAGE
// ═══════════════════════════════════════════════════════════
function ClientsPage({ clients, setClients, onAddClient }) {
  const [search, setSearch] = useState("");
  const [viewClient, setViewClient] = useState(null);
  const [editClient, setEditClient] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErr, setEditErr] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const filtered = clients.filter(c =>
    (c.clientName || c.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.companyName || c.company || "").toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (c) => {
    setEditForm({
      clientName: c.clientName || c.name || "",
      companyName: c.companyName || c.company || "",
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
      status: c.status || "Active",
    });
    setEditErr({});
    setEditClient(c);
  };

  const saveEdit = async () => {
    const errs = {};
    if (!editForm.clientName.trim()) errs.clientName = "Name required";
    if (!editForm.email.trim()) errs.email = "Email required";
    if (Object.keys(errs).length) { setEditErr(errs); return; }
    try {
      setSaving(true);
      const res = await axios.put(`${BASE_URL}/api/clients/${editClient._id}`, editForm);
      setClients(prev => prev.map(c => c._id === editClient._id ? { ...c, ...(res.data.client || editForm) } : c));
      setEditClient(null);
      showToast("✅ Client updated!");
    } catch (err) {
      // fallback local update
      setClients(prev => prev.map(c => c._id === editClient._id ? { ...c, ...editForm } : c));
      setEditClient(null);
      showToast("✅ Updated locally!");
    } finally { setSaving(false); }
  };

  const doDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/api/clients/${deleteTarget._id}`);
    } catch { }
    setClients(prev => prev.filter(c => c._id !== deleteTarget._id));
    setDeleteTarget(null);
    showToast("🗑️ Client deleted!");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#fff", border: "1.5px solid #22c55e", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#22c55e", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>{toast}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[{ t: "Total Clients", v: clients.length, i: "👥", c: "#9333ea" }, { t: "Active", v: clients.filter(c => c.status === "Active").length, i: "✅", c: "#22C55E" }, { t: "Inactive", v: clients.filter(c => c.status === "Inactive").length, i: "⛔", c: "#EF4444" }].map(({ t, v, i, c }) => (
          <div key={t} style={{ background: "#fff", borderRadius: 14, padding: "16px 14px", boxShadow: "0 4px 18px rgba(147,51,234,0.07)", border: "1px solid #ede9fe", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: `${c}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{i}</div>
            <div><div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, letterSpacing: 0.5 }}>{t.toUpperCase()}</div><div style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}</div></div>
          </div>
        ))}
      </div>

      <SC title={`All Clients (${filtered.length})`}>
        <Search value={search} onChange={setSearch} placeholder="Search by name, email, company..." />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 700 }}>
            <thead><tr style={{ background: "linear-gradient(90deg,#f5f3ff,#faf5ff)" }}>
              {["#", "Name", "Company", "Email", "Phone", "Status", "Joined", "Actions"].map(c => (
                <th key={c} style={{ padding: "10px 14px", textAlign: "left", color: "#7c3aed", fontWeight: 700, fontSize: 11, borderBottom: "2px solid #ede9fe", whiteSpace: "nowrap" }}>{c.toUpperCase()}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={8} style={{ padding: 30, textAlign: "center", color: "#a78bfa" }}>No clients found</td></tr>
                : filtered.map((c, i) => (
                  <tr key={c._id || i} style={{ borderBottom: "1px solid #f3f0ff" }} onMouseEnter={e => e.currentTarget.style.background = "#faf5ff"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 14px", color: "#a78bfa", fontSize: 11, fontFamily: "monospace" }}>{`CLT${String(i + 1).padStart(3, "0")}`}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#9333ea,#c084fc)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{(c.clientName || c.name || "?")[0].toUpperCase()}</div>
                        <span style={{ fontWeight: 700, color: T.text }}>{c.clientName || c.name || "—"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#7c3aed" }}>{c.companyName || c.company || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 12 }}>{c.email || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 12 }}>{c.phone || "—"}</td>
                    <td style={{ padding: "12px 14px" }}><Badge label={c.status || "Active"} /></td>
                    <td style={{ padding: "12px 14px", color: "#a78bfa", fontSize: 12 }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <ActionBtns
                        onView={() => setViewClient(c)}
                        onEdit={() => openEdit(c)}
                        onDelete={() => setDeleteTarget(c)}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </SC>

      {/* View Modal */}
      {viewClient && (
        <Mdl title="Client Profile" onClose={() => setViewClient(null)} maxWidth={500}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, background: "linear-gradient(135deg,#f5f3ff,#faf5ff)", borderRadius: 14, border: "1px solid #ede9fe", marginBottom: 18 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#9333ea,#c084fc)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 800, flexShrink: 0 }}>{(viewClient.clientName || viewClient.name || "?")[0].toUpperCase()}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: T.text }}>{viewClient.clientName || viewClient.name}</div>
              <div style={{ fontSize: 13, color: "#9333ea", marginTop: 2 }}>{viewClient.companyName || viewClient.company || "—"}</div>
            </div>
            <div style={{ marginLeft: "auto" }}><Badge label={viewClient.status || "Active"} /></div>
          </div>
          <InfoRow icon="📧" label="Email" value={viewClient.email} />
          <InfoRow icon="📱" label="Phone" value={viewClient.phone} />
          <InfoRow icon="📍" label="Address" value={viewClient.address} />
          <InfoRow icon="📅" label="Joined" value={viewClient.createdAt ? new Date(viewClient.createdAt).toLocaleDateString() : "—"} />
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={() => { setViewClient(null); openEdit(viewClient); }} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#9333ea,#a855f7)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>✏️ Edit</button>
            <button onClick={() => { setViewClient(null); setDeleteTarget(viewClient); }} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#EF4444,#dc2626)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>🗑 Delete</button>
          </div>
        </Mdl>
      )}

      {/* Edit Modal */}
      {editClient && (
        <Mdl title="Edit Client" onClose={() => setEditClient(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }} className="modal-2col">
            <Fld label="Client Name *" value={editForm.clientName} onChange={v => { setEditForm(p => ({ ...p, clientName: v })); setEditErr(p => ({ ...p, clientName: "" })); }} error={editErr.clientName} />
            <Fld label="Company Name" value={editForm.companyName} onChange={v => setEditForm(p => ({ ...p, companyName: v }))} />
            <Fld label="Email *" value={editForm.email} onChange={v => { setEditForm(p => ({ ...p, email: v })); setEditErr(p => ({ ...p, email: "" })); }} type="email" error={editErr.email} />
            <Fld label="Phone" value={editForm.phone} onChange={v => setEditForm(p => ({ ...p, phone: v }))} />
            <Fld label="Status" value={editForm.status} onChange={v => setEditForm(p => ({ ...p, status: v }))} options={["Active", "Inactive"]} />
          </div>
          <Fld label="Address" value={editForm.address} onChange={v => setEditForm(p => ({ ...p, address: v }))} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
            <button onClick={() => setEditClient(null)} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
            <button onClick={saveEdit} disabled={saving} style={{ background: "linear-gradient(135deg,#9333ea,#a855f7)", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : "Save Changes →"}</button>
          </div>
        </Mdl>
      )}

      {deleteTarget && <ConfirmModal title="Delete Client" message={`Are you sure you want to delete "${deleteTarget.clientName || deleteTarget.name}"? This cannot be undone.`} onConfirm={doDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// EMPLOYEES PAGE
// ═══════════════════════════════════════════════════════════
function EmployeesPage({ employees, setEmployees }) {
  const [search, setSearch] = useState("");
  const [viewEmp, setViewEmp] = useState(null);
  const [editEmp, setEditEmp] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErr, setEditErr] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [empDocs, setEmpDocs] = useState({});
  const [empDocsLoading, setEmpDocsLoading] = useState(false);

  const loadEmpDocs = async (emp) => {
    setEmpDocs({});
    setEmpDocsLoading(true);
    try {
      const r = await axios.get(
        `${BASE_URL}/api/employee-dashboard/documents/${encodeURIComponent(emp.name)}/all`
      );
      const map = {};
      (r.data || []).forEach(d => { map[d.docType] = d; });
      setEmpDocs(map);
    } catch { setEmpDocs({}); }
    finally { setEmpDocsLoading(false); }
  };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const filtered = employees.filter(e =>
    (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.role || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.department || "").toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (e) => {
    setEditForm({ name: e.name || "", email: e.email || "", phone: e.phone || "", role: e.role || "", department: e.department || "", salary: e.salary || "", status: e.status || "Active" });
    setEditErr({});
    setEditEmp(e);
  };

  const saveEdit = async () => {
    const errs = {};
    if (!editForm.name.trim()) errs.name = "Name required";
    if (!editForm.email.trim()) errs.email = "Email required";
    if (Object.keys(errs).length) { setEditErr(errs); return; }
    try {
      setSaving(true);
      const res = await axios.put(`${BASE_URL}/api/employees/${editEmp._id}`, editForm);
      setEmployees(prev => prev.map(e => e._id === editEmp._id ? { ...e, ...(res.data || editForm) } : e));
      setEditEmp(null);
      showToast("✅ Employee updated!");
    } catch {
      setEmployees(prev => prev.map(e => e._id === editEmp._id ? { ...e, ...editForm } : e));
      setEditEmp(null);
      showToast("✅ Updated locally!");
    } finally { setSaving(false); }
  };

  const doDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/api/employees/${deleteTarget._id}`);
    } catch { }
    setEmployees(prev => prev.filter(e => e._id !== deleteTarget._id));
    setDeleteTarget(null);
    showToast("🗑️ Employee deleted!");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#fff", border: "1.5px solid #22c55e", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#22c55e", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>{toast}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[{ t: "Total", v: employees.length, i: "👨‍💼", c: "#7c3aed" }, { t: "Active", v: employees.filter(e => e.status === "Active").length, i: "✅", c: "#22C55E" }, { t: "Inactive", v: employees.filter(e => e.status === "Inactive").length, i: "⛔", c: "#EF4444" }].map(({ t, v, i, c }) => (
          <div key={t} style={{ background: "#fff", borderRadius: 14, padding: "16px 14px", boxShadow: "0 4px 18px rgba(147,51,234,0.07)", border: "1px solid #ede9fe", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: `${c}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{i}</div>
            <div><div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, letterSpacing: 0.5 }}>{t.toUpperCase()}</div><div style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}</div></div>
          </div>
        ))}
      </div>

      <SC title={`All Employees (${filtered.length})`}>
        <Search value={search} onChange={setSearch} placeholder="Search by name, email, role..." />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 750 }}>
            <thead><tr style={{ background: "linear-gradient(90deg,#f5f3ff,#faf5ff)" }}>
              {["#", "Name", "Email", "Phone", "Role", "Department", "Salary", "Status", "Actions"].map(c => (
                <th key={c} style={{ padding: "10px 14px", textAlign: "left", color: "#7c3aed", fontWeight: 700, fontSize: 11, borderBottom: "2px solid #ede9fe", whiteSpace: "nowrap" }}>{c.toUpperCase()}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={9} style={{ padding: 30, textAlign: "center", color: "#a78bfa" }}>No employees found</td></tr>
                : filtered.map((e, i) => (
                  <tr key={e._id || i} style={{ borderBottom: "1px solid #f3f0ff" }} onMouseEnter={ev => ev.currentTarget.style.background = "#faf5ff"} onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 14px", color: "#a78bfa", fontSize: 11, fontFamily: "monospace" }}>{`EMP${String(i + 1).padStart(3, "0")}`}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{(e.name || "?")[0].toUpperCase()}</div>
                        <span style={{ fontWeight: 700, color: T.text }}>{e.name || "—"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 12 }}>{e.email || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 12 }}>{e.phone || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#7c3aed", fontSize: 12, fontWeight: 600 }}>{e.role || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 12 }}>{e.department || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#22C55E", fontSize: 12, fontWeight: 600 }}>{e.salary || "—"}</td>
                    <td style={{ padding: "12px 14px" }}><Badge label={e.status || "Active"} /></td>
                    <td style={{ padding: "12px 14px" }}>
                      <ActionBtns
                        onView={() => { setViewEmp(e); loadEmpDocs(e); }}
                        onEdit={() => openEdit(e)}
                        onDelete={() => setDeleteTarget(e)}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </SC>

      {viewEmp && (
        <Mdl title="Employee Profile" onClose={() => setViewEmp(null)} maxWidth={500}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, background: "linear-gradient(135deg,#f5f3ff,#faf5ff)", borderRadius: 14, border: "1px solid #ede9fe", marginBottom: 18 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 800, flexShrink: 0 }}>{(viewEmp.name || "?")[0].toUpperCase()}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: T.text }}>{viewEmp.name}</div>
              <div style={{ fontSize: 13, color: "#9333ea", marginTop: 2 }}>{viewEmp.role || "Employee"}</div>
            </div>
            <div style={{ marginLeft: "auto" }}><Badge label={viewEmp.status || "Active"} /></div>
          </div>
          <InfoRow icon="📧" label="Email" value={viewEmp.email} />
          <InfoRow icon="📱" label="Phone" value={viewEmp.phone} />
          <InfoRow icon="🏢" label="Department" value={viewEmp.department} />
          <InfoRow icon="💰" label="Salary" value={viewEmp.salary} />
          <InfoRow icon="📅" label="Joined" value={viewEmp.createdAt ? new Date(viewEmp.createdAt).toLocaleDateString() : "—"} />

          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#1e0a3c", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              📂 Documents
              {empDocsLoading && <span style={{ fontSize: 10, color: "#a78bfa" }}>Loading...</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DOC_TYPES.map(dt => {
                const doc = empDocs[dt.key];
                const hasDoc = !!doc?.url;
                const isImg = (url = "") => /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.startsWith("data:image");
                return (
                  <div key={dt.key} style={{ border: `1.5px solid ${hasDoc ? dt.color + "35" : "#f1f5f9"}`, borderRadius: 12, overflow: "hidden", background: hasDoc ? `${dt.color}04` : "#f8fafc" }}>
                    <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{dt.icon}</span>
                      <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#1e0a3c" }}>{dt.label}</div>
                      {hasDoc
                        ? <span style={{ background: `${dt.color}15`, border: `1px solid ${dt.color}30`, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700, color: dt.color }}>✓ Uploaded</span>
                        : <span style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700, color: "#ef4444" }}>✗ Missing</span>}
                    </div>
                    {hasDoc && (
                      <div style={{ padding: "0 12px 10px" }}>
                        {isImg(doc.url)
                          ? <img src={doc.url} alt={dt.label} style={{ width: "100%", maxHeight: 120, objectFit: "contain", borderRadius: 8, border: "1px solid #f1f5f9", background: "#fff" }} />
                          : <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#fff", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                            <span style={{ fontSize: 20 }}>📄</span>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "#1e0a3c" }}>{doc.fileName || `${dt.label}.pdf`}</div>
                          </div>}
                        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                          <button onClick={() => window.open(doc.url, "_blank")}
                            style={{ flex: 1, padding: "6px 10px", background: `${dt.color}10`, border: `1px solid ${dt.color}30`, borderRadius: 7, fontSize: 11, fontWeight: 700, color: dt.color, cursor: "pointer", fontFamily: "inherit" }}>
                            👁 View
                          </button>
                          <a href={doc.url} downloadstyle={{ flex: 1, padding: "6px 10px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 11, fontWeight: 700, color: "#475569", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            ⬇ Download
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={() => { setViewEmp(null); openEdit(viewEmp); }} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>✏️ Edit</button>
            <button onClick={() => { setViewEmp(null); setDeleteTarget(viewEmp); }} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#EF4444,#dc2626)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>🗑 Delete</button>
          </div>
        </Mdl>
      )}

      {editEmp && (
        <Mdl title="Edit Employee" onClose={() => setEditEmp(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }} className="modal-2col">
            <Fld label="Full Name *" value={editForm.name} onChange={v => { setEditForm(p => ({ ...p, name: v })); setEditErr(p => ({ ...p, name: "" })); }} error={editErr.name} />
            <Fld label="Email *" value={editForm.email} onChange={v => { setEditForm(p => ({ ...p, email: v })); setEditErr(p => ({ ...p, email: "" })); }} type="email" error={editErr.email} />
            <Fld label="Phone" value={editForm.phone} onChange={v => setEditForm(p => ({ ...p, phone: v }))} />
            <Fld label="Role" value={editForm.role} onChange={v => setEditForm(p => ({ ...p, role: v }))} options={["Employee", "Manager", "Admin"]} />
            <Fld label="Department" value={editForm.department} onChange={v => setEditForm(p => ({ ...p, department: v }))} />
            <Fld label="Salary" value={editForm.salary} onChange={v => setEditForm(p => ({ ...p, salary: v }))} />
            <Fld label="Status" value={editForm.status} onChange={v => setEditForm(p => ({ ...p, status: v }))} options={["Active", "Inactive"]} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
            <button onClick={() => setEditEmp(null)} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
            <button onClick={saveEdit} disabled={saving} style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : "Save Changes →"}</button>
          </div>
        </Mdl>
      )}

      {deleteTarget && <ConfirmModal title="Delete Employee" message={`Delete "${deleteTarget.name}"? This cannot be undone.`} onConfirm={doDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MANAGERS PAGE
// ═══════════════════════════════════════════════════════════
function ManagersPage({ managers, setManagers }) {
  const [search, setSearch] = useState("");
  const [viewMgr, setViewMgr] = useState(null);
  const [editMgr, setEditMgr] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErr, setEditErr] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };
  const filtered = managers.filter(m => (m.managerName || "").toLowerCase().includes(search.toLowerCase()) || (m.email || "").toLowerCase().includes(search.toLowerCase()) || (m.department || "").toLowerCase().includes(search.toLowerCase()));

  const openEdit = (m) => {
    setEditForm({ managerName: m.managerName || "", email: m.email || "", phone: m.phone || "", department: m.department || "", role: m.role || "Manager", address: m.address || "", status: m.status || "Active" });
    setEditErr({});
    setEditMgr(m);
  };
  const loadEmpDocs = async (emp) => {
    setEmpDocs({});
    setEmpDocsLoading(true);
    try {
      const r = await axios.get(
        `${BASE_URL}/api/employee-dashboard/documents/${encodeURIComponent(emp.name)}/all`
      );
      const map = {};
      (r.data || []).forEach(d => { map[d.docType] = d; });
      setEmpDocs(map);
    } catch { setEmpDocs({}); }
    finally { setEmpDocsLoading(false); }
  };
  const saveEdit = async () => {
    const errs = {};
    if (!editForm.managerName.trim()) errs.managerName = "Name required";
    if (!editForm.email.trim()) errs.email = "Email required";
    if (Object.keys(errs).length) { setEditErr(errs); return; }
    try {
      setSaving(true);
      const res = await axios.put(`${BASE_URL}/api/managers/${editMgr._id}`, editForm);
      setManagers(prev => prev.map(m => m._id === editMgr._id ? { ...m, ...(res.data || editForm) } : m));
      setEditMgr(null);
      showToast("✅ Manager updated!");
    } catch {
      setManagers(prev => prev.map(m => m._id === editMgr._id ? { ...m, ...editForm } : m));
      setEditMgr(null);
      showToast("✅ Updated locally!");
    } finally { setSaving(false); }
  };

  const doDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/api/managers/${deleteTarget._id}`);
    } catch { }
    setManagers(prev => prev.filter(m => m._id !== deleteTarget._id));
    setDeleteTarget(null);
    showToast("🗑️ Manager deleted!");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#fff", border: "1.5px solid #22c55e", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#22c55e", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>{toast}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[{ t: "Total Managers", v: managers.length, i: "🧑‍💼", c: "#f59e0b" }, { t: "Active", v: managers.filter(m => m.status === "Active").length, i: "✅", c: "#22C55E" }, { t: "Inactive", v: managers.filter(m => m.status === "Inactive").length, i: "⛔", c: "#EF4444" }].map(({ t, v, i, c }) => (
          <div key={t} style={{ background: "#fff", borderRadius: 14, padding: "16px 14px", boxShadow: "0 4px 18px rgba(147,51,234,0.07)", border: "1px solid #ede9fe", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: `${c}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{i}</div>
            <div><div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, letterSpacing: 0.5 }}>{t.toUpperCase()}</div><div style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}</div></div>
          </div>
        ))}
      </div>

      <SC title={`All Managers (${filtered.length})`}>
        <Search value={search} onChange={setSearch} placeholder="Search by name, email, department..." />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 750 }}>
            <thead><tr style={{ background: "linear-gradient(90deg,#f5f3ff,#faf5ff)" }}>
              {["#", "Name", "Email", "Phone", "Role", "Department", "Status", "Joined", "Actions"].map(c => (
                <th key={c} style={{ padding: "10px 14px", textAlign: "left", color: "#7c3aed", fontWeight: 700, fontSize: 11, borderBottom: "2px solid #ede9fe", whiteSpace: "nowrap" }}>{c.toUpperCase()}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={9} style={{ padding: 30, textAlign: "center", color: "#a78bfa" }}>No managers found</td></tr>
                : filtered.map((m, i) => (
                  <tr key={m._id || i} style={{ borderBottom: "1px solid #f3f0ff" }} onMouseEnter={ev => ev.currentTarget.style.background = "#faf5ff"} onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 14px", color: "#a78bfa", fontSize: 11, fontFamily: "monospace" }}>{`MGR${String(i + 1).padStart(3, "0")}`}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#f59e0b,#fbbf24)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{(m.managerName || "?")[0].toUpperCase()}</div>
                        <span style={{ fontWeight: 700, color: T.text }}>{m.managerName || "—"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 12 }}>{m.email || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 12 }}>{m.phone || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#f59e0b", fontSize: 12, fontWeight: 600 }}>{m.role || "Manager"}</td>
                    <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 12 }}>{m.department || "—"}</td>
                    <td style={{ padding: "12px 14px" }}><Badge label={m.status || "Active"} /></td>
                    <td style={{ padding: "12px 14px", color: "#a78bfa", fontSize: 12 }}>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <ActionBtns onView={() => setViewMgr(m)} onEdit={() => openEdit(m)} onDelete={() => setDeleteTarget(m)} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </SC>

      {viewMgr && (
        <Mdl title="Manager Profile" onClose={() => setViewMgr(null)} maxWidth={500}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, background: "linear-gradient(135deg,#fffbeb,#fef3c7)", borderRadius: 14, border: "1px solid #fde68a", marginBottom: 18 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#f59e0b,#fbbf24)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 800, flexShrink: 0 }}>{(m => m[0].toUpperCase())(viewMgr.managerName || "M")}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: T.text }}>{viewMgr.managerName}</div>
              <div style={{ fontSize: 13, color: "#f59e0b", marginTop: 2 }}>{viewMgr.role || "Manager"}</div>
            </div>
            <div style={{ marginLeft: "auto" }}><Badge label={viewMgr.status || "Active"} /></div>
          </div>
          <InfoRow icon="📧" label="Email" value={viewMgr.email} />
          <InfoRow icon="📱" label="Phone" value={viewMgr.phone} />
          <InfoRow icon="🏢" label="Department" value={viewMgr.department} />
          <InfoRow icon="📍" label="Address" value={viewMgr.address} />
          <InfoRow icon="📅" label="Joined" value={viewMgr.createdAt ? new Date(viewMgr.createdAt).toLocaleDateString() : "—"} />

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={() => { setViewMgr(null); openEdit(viewMgr); }} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#f59e0b,#fbbf24)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>✏️ Edit</button>
            <button onClick={() => { setViewMgr(null); setDeleteTarget(viewMgr); }} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#EF4444,#dc2626)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>🗑 Delete</button>
          </div>
        </Mdl>
      )}

      {editMgr && (
        <Mdl title="Edit Manager" onClose={() => setEditMgr(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }} className="modal-2col">
            <Fld label="Manager Name *" value={editForm.managerName} onChange={v => { setEditForm(p => ({ ...p, managerName: v })); setEditErr(p => ({ ...p, managerName: "" })); }} error={editErr.managerName} />
            <Fld label="Email *" value={editForm.email} onChange={v => { setEditForm(p => ({ ...p, email: v })); setEditErr(p => ({ ...p, email: "" })); }} type="email" error={editErr.email} />
            <Fld label="Phone" value={editForm.phone} onChange={v => setEditForm(p => ({ ...p, phone: v }))} />
            <Fld label="Role" value={editForm.role} onChange={v => setEditForm(p => ({ ...p, role: v }))} />
            <Fld label="Department" value={editForm.department} onChange={v => setEditForm(p => ({ ...p, department: v }))} />
            <Fld label="Status" value={editForm.status} onChange={v => setEditForm(p => ({ ...p, status: v }))} options={["Active", "Inactive"]} />
          </div>
          <Fld label="Address" value={editForm.address} onChange={v => setEditForm(p => ({ ...p, address: v }))} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
            <button onClick={() => setEditMgr(null)} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
            <button onClick={saveEdit} disabled={saving} style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : "Save Changes →"}</button>
          </div>
        </Mdl>
      )}

      {deleteTarget && <ConfirmModal title="Delete Manager" message={`Delete "${deleteTarget.managerName}"? This cannot be undone.`} onConfirm={doDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SUBADMINS PAGE
// ═══════════════════════════════════════════════════════════
function SubadminsPage({ subadmins, setSubadmins, employees = [], managers = [], quotations = [] }) {
  const [search, setSearch] = useState("");
  const [viewSub, setViewSub] = useState(null);
  const [editSub, setEditSub] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErr, setEditErr] = useState({});
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [subQuotationDetails, setSubQuotationDetails] = useState([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 2800); };
  const filtered = subadmins.filter(s => (s.name || "").toLowerCase().includes(search.toLowerCase()) || (s.email || "").toLowerCase().includes(search.toLowerCase()));

  const openEdit = (s) => {
    setEditForm({ name: s.name || "", email: s.email || "", phone: s.phone || "", status: s.status || "Active" });
    setEditErr({});
    setEditSub(s);
  };

  const saveEdit = async () => {
    const errs = {};
    if (!editForm.name.trim()) errs.name = "Name required";
    if (!editForm.email.trim()) errs.email = "Email required";
    if (Object.keys(errs).length) { setEditErr(errs); return; }
    try {
      setSaving(true);
      const res = await axios.put(`${BASE_URL}/api/subadmins/${editSub._id}`, editForm);
      setSubadmins(prev => prev.map(s => s._id === editSub._id ? { ...s, ...(res.data.subadmin || editForm) } : s));
      setEditSub(null);
      showToast("✅ Subadmin updated!");
    } catch {
      setSubadmins(prev => prev.map(s => s._id === editSub._id ? { ...s, ...editForm } : s));
      setEditSub(null);
      showToast("✅ Subadmin updated locally!");
    } finally { setSaving(false); }
  };

  const doDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/api/subadmins/${deleteTarget._id}`);
    } catch { }
    setSubadmins(prev => prev.filter(s => s._id !== deleteTarget._id));
    setDeleteTarget(null);
    showToast("🗑️ Subadmin deleted!");
  };

  // Filter related data for the viewed subadmin
  const getSubadminRelatedData = (subadmin) => {
    const subadminId = subadmin._id || subadmin.id;
    const subadminEmail = subadmin.email;

    // Ensure arrays before filtering
    const empArray = Array.isArray(employees) ? employees : [];
    const mgrArray = Array.isArray(managers) ? managers : [];
    const quoArray = Array.isArray(quotations) ? quotations : [];

    // Filter employees created by or assigned to this subadmin
    const relatedEmployees = empArray.filter(e =>
      e.subadminId === subadminId ||
      e.createdBy === subadminId ||
      e.subadminEmail === subadminEmail
    );

    // Filter managers under this subadmin
    const relatedManagers = mgrArray.filter(m =>
      m.subadminId === subadminId ||
      m.createdBy === subadminId ||
      m.subadminEmail === subadminEmail
    );

    // Filter quotations created by this subadmin
    const relatedQuotations = quoArray.filter(q =>
      q.subadminId === subadminId ||
      q.createdBy === subadminId ||
      q.subadminEmail === subadminEmail
    );

    return { relatedEmployees, relatedManagers, relatedQuotations };
  };

  const handleViewSubadmin = (subadmin) => {
    setViewSub(subadmin);
    // Load quotation details if available
    const { relatedQuotations } = getSubadminRelatedData(subadmin);
    setSubQuotationDetails(relatedQuotations);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {toastMsg && <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#fff", border: "1.5px solid #22c55e", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#22c55e", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>{toastMsg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[{ t: "Total Subadmins", v: subadmins.length, i: "🛡️", c: "#3b82f6" }, { t: "Active", v: subadmins.filter(s => (s.status || "Active") === "Active").length, i: "✅", c: "#22C55E" }, { t: "Inactive", v: subadmins.filter(s => s.status === "Inactive").length, i: "⛔", c: "#EF4444" }].map(({ t, v, i, c }) => (
          <div key={t} style={{ background: "#fff", borderRadius: 14, padding: "16px 14px", boxShadow: "0 4px 18px rgba(147,51,234,0.07)", border: "1px solid #ede9fe", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: `${c}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{i}</div>
            <div><div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, letterSpacing: 0.5 }}>{t.toUpperCase()}</div><div style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}</div></div>
          </div>
        ))}
      </div>

      <SC title={`All Subadmins (${filtered.length})`}>
        <Search value={search} onChange={setSearch} placeholder="Search by name, email, company..." />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 900 }}>
            <thead><tr style={{ background: "linear-gradient(90deg,#f5f3ff,#faf5ff)" }}>
              {["#", "Name", "Company", "Email", "Phone", "Role", "Status", "Joined", "Actions"].map(c => (
                <th key={c} style={{ padding: "10px 14px", textAlign: "left", color: "#7c3aed", fontWeight: 700, fontSize: 11, borderBottom: "2px solid #ede9fe", whiteSpace: "nowrap" }}>{c.toUpperCase()}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={9} style={{ padding: 30, textAlign: "center", color: "#a78bfa" }}>No subadmins found</td></tr>
                : filtered.map((s, i) => (
                  <tr key={s._id || i} style={{ borderBottom: "1px solid #f3f0ff" }} onMouseEnter={ev => ev.currentTarget.style.background = "#faf5ff"} onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 14px", color: "#a78bfa", fontSize: 11, fontFamily: "monospace" }}>{`SUB${String(i + 1).padStart(3, "0")}`}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#60a5fa)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{(s.name || "?")[0].toUpperCase()}</div>
                        <span style={{ fontWeight: 700, color: T.text }}>{s.name || "—"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#7c3aed", fontSize: 12, fontWeight: 600 }}>{s.companyName || s.company || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 12 }}>{s.email || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 12 }}>{s.phone || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#3b82f6", fontSize: 12, fontWeight: 600 }}>Subadmin</td>
                    <td style={{ padding: "12px 14px" }}><Badge label={s.status || "Active"} /></td>
                    <td style={{ padding: "12px 14px", color: "#a78bfa", fontSize: 12 }}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <ActionBtns onView={() => handleViewSubadmin(s)} onEdit={() => openEdit(s)} onDelete={() => setDeleteTarget(s)} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </SC>

      {viewSub && (() => {
        const { relatedEmployees, relatedManagers, relatedQuotations } = getSubadminRelatedData(viewSub);
        return (
        <Mdl title="Subadmin Profile" onClose={() => setViewSub(null)} maxWidth={720}>
          {/* Header Section */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, background: "linear-gradient(135deg,#eff6ff,#dbeafe)", borderRadius: 14, border: "1px solid #bfdbfe", marginBottom: 18 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#60a5fa)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 800, flexShrink: 0 }}>{(s => s[0].toUpperCase())(viewSub.name || "S")}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: T.text }}>{viewSub.name}</div>
              <div style={{ fontSize: 13, color: "#3b82f6", marginTop: 2 }}>{viewSub.companyName || viewSub.company || "Subadmin"}</div>
            </div>
            <div style={{ marginLeft: "auto" }}><Badge label={viewSub.status || "Active"} /></div>
          </div>

          {/* Basic Info */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 20 }}>
            <InfoRow icon="🏢" label="Company" value={viewSub.companyName || viewSub.company || "—"} />
            <InfoRow icon="💼" label="Company Type" value={viewSub.companyType || "IT"} />
            <InfoRow icon="👥" label="Employees" value={viewSub.employeeCount || "0-10"} />
            <InfoRow icon="📧" label="Email" value={viewSub.email} />
            <InfoRow icon="📱" label="Phone" value={viewSub.phone} />
            <InfoRow icon="📅" label="Joined" value={viewSub.createdAt ? new Date(viewSub.createdAt).toLocaleDateString() : "—"} />
          </div>

          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
            <div style={{ background: "#f0f9ff", borderRadius: 12, padding: 14, border: "1px solid #bae6fd", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#0284c7", fontWeight: 700, marginBottom: 4 }}>QUOTATIONS</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#0ea5e9" }}>{relatedQuotations.length}</div>
            </div>
            <div style={{ background: "#f5f3ff", borderRadius: 12, padding: 14, border: "1px solid #ddd6fe", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, marginBottom: 4 }}>EMPLOYEES</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#9333ea" }}>{relatedEmployees.length}</div>
            </div>
            <div style={{ background: "#fff7ed", borderRadius: 12, padding: 14, border: "1px solid #fed7aa", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#c2410c", fontWeight: 700, marginBottom: 4 }}>MANAGERS</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b" }}>{relatedManagers.length}</div>
            </div>
          </div>

          {/* Quotations Section */}
          {relatedQuotations.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: 8 }}>
                <span>📋</span> Quotations ({relatedQuotations.length})
              </h4>
              <div style={{ maxHeight: 150, overflowY: "auto", border: "1px solid #e0f2fe", borderRadius: 10, background: "#f0f9ff" }}>
                {relatedQuotations.map((q, idx) => (
                  <div key={idx} style={{ padding: "10px 14px", borderBottom: "1px solid #e0f2fe", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{q.quotationNumber || q.quoteNumber || `Quote #${idx + 1}`}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{q.client || q.clientName || "—"}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0ea5e9" }}>{q.amount || q.total || "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employees Section */}
          {relatedEmployees.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: 8 }}>
                <span>👨‍💼</span> Employees ({relatedEmployees.length})
              </h4>
              <div style={{ maxHeight: 150, overflowY: "auto", border: "1px solid #ede9fe", borderRadius: 10, background: "#faf5ff" }}>
                {relatedEmployees.map((e, idx) => (
                  <div key={idx} style={{ padding: "10px 14px", borderBottom: "1px solid #f3e8ff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>{(e.name || "?")[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{e.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{e.role || e.department || "—"}</div>
                      </div>
                    </div>
                    <Badge label={e.status || "Active"} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Managers Section */}
          {relatedManagers.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: 8 }}>
                <span>🧑‍💼</span> Managers ({relatedManagers.length})
              </h4>
              <div style={{ maxHeight: 150, overflowY: "auto", border: "1px solid #fed7aa", borderRadius: 10, background: "#fff7ed" }}>
                {relatedManagers.map((m, idx) => (
                  <div key={idx} style={{ padding: "10px 14px", borderBottom: "1px solid #fed7aa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#f59e0b,#fbbf24)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>{(m.managerName || m.name || "?")[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{m.managerName || m.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{m.department || "—"}</div>
                      </div>
                    </div>
                    <Badge label={m.status || "Active"} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={() => { setViewSub(null); openEdit(viewSub); }} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#3b82f6,#60a5fa)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>✏️ Edit</button>
            <button onClick={() => { setViewSub(null); setDeleteTarget(viewSub); }} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#EF4444,#dc2626)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>🗑 Delete</button>
          </div>
        </Mdl>
        );
      })()}

      {editSub && (
        <Mdl title="Edit Subadmin" onClose={() => setEditSub(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }} className="modal-2col">
            <Fld label="Name *" value={editForm.name} onChange={v => { setEditForm(p => ({ ...p, name: v })); setEditErr(p => ({ ...p, name: "" })); }} error={editErr.name} />
            <Fld label="Email *" value={editForm.email} onChange={v => { setEditForm(p => ({ ...p, email: v })); setEditErr(p => ({ ...p, email: "" })); }} type="email" error={editErr.email} />
            <Fld label="Phone" value={editForm.phone} onChange={v => setEditForm(p => ({ ...p, phone: v }))} />
            <Fld label="Status" value={editForm.status} onChange={v => setEditForm(p => ({ ...p, status: v }))} options={["Active", "Inactive"]} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
            <button onClick={() => setEditSub(null)} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
            <button onClick={saveEdit} disabled={saving} style={{ background: "linear-gradient(135deg,#3b82f6,#60a5fa)", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : "Save Changes →"}</button>
          </div>
        </Mdl>
      )}

      {deleteTarget && <ConfirmModal title="Delete Subadmin" message={`Delete "${deleteTarget.name}"? This cannot be undone.`} onConfirm={doDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PROJECTS PAGE
// ═══════════════════════════════════════════════════════════
function ProjectsPage({ projects, setProjects, clients, employees }) {
  const [search, setSearch] = useState("");
  const [viewProj, setViewProj] = useState(null);
  const [editProj, setEditProj] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErr, setEditErr] = useState({});
  const [assignTo, setAssignTo] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };
  const filtered = projects.filter(p => (p.name || "").toLowerCase().includes(search.toLowerCase()) || (p.client || "").toLowerCase().includes(search.toLowerCase()));

  const openEdit = (p) => {
    setEditForm({ name: p.name || "", client: p.client || "", purpose: p.purpose || "", description: p.description || "", start: p.start || "", end: p.end || "", budget: p.budget || "", team: p.team || "", status: p.status || "Pending", assignedTo: Array.isArray(p.assignedTo) ? p.assignedTo : (p.assignedTo ? [p.assignedTo] : []) });
    setEditErr({});
    setEditProj(p);
  };

  const saveEdit = async () => {
    const errs = {};
    if (!editForm.name.trim()) errs.name = "Name required";
    if (!editForm.client.trim()) errs.client = "Client required";
    if (Object.keys(errs).length) { setEditErr(errs); return; }
    try {
      setSaving(true);
      const res = await axios.put(`${BASE_URL}/api/projects/${editProj._id}`, editForm);
      setProjects(prev => prev.map(p => p._id === editProj._id ? { ...p, ...(res.data.project || editForm) } : p));
      setEditProj(null);
      showToast("✅ Project updated!");
    } catch {
      setProjects(prev => prev.map(p => p._id === editProj._id ? { ...p, ...editForm } : p));
      setEditProj(null);
      showToast("✅ Updated locally!");
    } finally { setSaving(false); }
  };

  const doDelete = async () => {
    try { await axios.delete(`${BASE_URL}/api/projects/${deleteTarget._id}`); } catch { }
    setProjects(prev => prev.filter(p => p._id !== deleteTarget._id));
    setDeleteTarget(null);
    showToast("🗑️ Project deleted!");
  };

  const doAssign = async () => {
    if (!assignTo || assignTo.length === 0) { alert("Please select at least one employee"); return; }
    try {
      await axios.put(`${BASE_URL}/api/projects/${assignModal._id}`, { assignedTo: assignTo });
      setProjects(prev => prev.map(p => p._id === assignModal._id ? { ...p, assignedTo: assignTo } : p));
      setAssignModal(null); setAssignTo([]);
      showToast("✅ Employees assigned!");
    } catch (err) { alert(err.response?.data?.msg || "Failed to assign"); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#fff", border: "1.5px solid #22c55e", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#22c55e", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>{toast}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[{ t: "Total", v: projects.length, i: "📁", c: "#a855f7" }, { t: "Active", v: projects.filter(p => p.status === "In Progress").length, i: "⚡", c: "#9333ea" }, { t: "Completed", v: projects.filter(p => p.status === "Completed").length, i: "✅", c: "#22C55E" }, { t: "Pending", v: projects.filter(p => p.status === "Pending").length, i: "⏳", c: "#F59E0B" }].map(({ t, v, i, c }) => (
          <div key={t} style={{ background: "#fff", borderRadius: 14, padding: "16px 14px", boxShadow: "0 4px 18px rgba(147,51,234,0.07)", border: "1px solid #ede9fe", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: `${c}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{i}</div>
            <div><div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, letterSpacing: 0.5 }}>{t.toUpperCase()}</div><div style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}</div></div>
          </div>
        ))}
      </div>

      <SC title={`All Projects (${filtered.length})`}>
        <Search value={search} onChange={setSearch} placeholder="Search by project name, client..." />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 800 }}>
            <thead><tr style={{ background: "linear-gradient(90deg,#f5f3ff,#faf5ff)" }}>
              {["#", "Name", "Client", "Budget", "Status", "Assigned To", "Actions"].map(c => (
                <th key={c} style={{ padding: "10px 14px", textAlign: "left", color: "#7c3aed", fontWeight: 700, fontSize: 11, borderBottom: "2px solid #ede9fe", whiteSpace: "nowrap" }}>{c.toUpperCase()}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: "#a78bfa" }}>No projects found</td></tr>
                : filtered.map((p, i) => (
                  <tr key={p._id || i} style={{ borderBottom: "1px solid #f3f0ff" }} onMouseEnter={ev => ev.currentTarget.style.background = "#faf5ff"} onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 14px", color: "#a78bfa", fontSize: 11, fontFamily: "monospace" }}>{`PRJ${String(i + 1).padStart(3, "0")}`}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: T.text }}>{p.name}</td>
                    <td style={{ padding: "12px 14px", color: "#7c3aed" }}>{p.client || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#22C55E", fontWeight: 600 }}>{p.budget || "—"}</td>
                    <td style={{ padding: "12px 14px" }}><Badge label={p.status || "Pending"} /></td>
                    <td style={{ padding: "12px 14px" }}>
                      {(() => {
                        const assignedEmployees = Array.isArray(p.assignedTo) ? p.assignedTo : (p.assignedTo ? [p.assignedTo] : []);
                        return assignedEmployees.length > 0
                          ? <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {assignedEmployees.slice(0, 2).map((emp, idx) => (
                              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 8, fontWeight: 700, flexShrink: 0 }}>{emp[0].toUpperCase()}</div>
                                <span style={{ color: "#6366f1", fontWeight: 600, fontSize: 11 }}>{emp}</span>
                              </div>
                            ))}
                            {assignedEmployees.length > 2 && <div style={{ fontSize: 10, color: "#a78bfa", fontStyle: "italic" }}>+{assignedEmployees.length - 2} more</div>}
                          </div>
                          : <button onClick={() => { setAssignModal(p); setAssignTo(Array.isArray(p.assignedTo) ? p.assignedTo : (p.assignedTo ? [p.assignedTo] : [])); }} style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 7, padding: "4px 10px", fontSize: 11, color: "#6366f1", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Assign</button>
                      })()}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <ActionBtns onView={() => setViewProj(p)} onEdit={() => openEdit(p)} onDelete={() => setDeleteTarget(p)} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </SC>

      {viewProj && (
        <Mdl title="Project Details" onClose={() => setViewProj(null)} maxWidth={550}>
          <div style={{ padding: 16, background: "linear-gradient(135deg,#f5f3ff,#faf5ff)", borderRadius: 14, border: "1px solid #ede9fe", marginBottom: 18 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 6 }}>{viewProj.name}</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Badge label={viewProj.status || "Pending"} />
              {viewProj.client && <span style={{ fontSize: 12, color: "#9333ea", fontWeight: 600 }}>👥 {viewProj.client}</span>}
            </div>
          </div>
          <InfoRow icon="💰" label="Budget" value={viewProj.budget} />
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>ASSIGNED EMPLOYEES</label>
            {(() => {
              const assignedEmployees = Array.isArray(viewProj.assignedTo) ? viewProj.assignedTo : (viewProj.assignedTo ? [viewProj.assignedTo] : []);
              return assignedEmployees.length > 0
                ? <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {assignedEmployees.map((emp, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{emp[0].toUpperCase()}</div>
                      <span style={{ color: "#1e0a3c", fontWeight: 600, fontSize: 12 }}>{emp}</span>
                    </div>
                  ))}
                </div>
                : <div style={{ color: "#a78bfa", fontSize: 13, fontStyle: "italic" }}>No employees assigned</div>
            })()}
          </div>
          <InfoRow icon="📅" label="Start Date" value={viewProj.start} />
          <InfoRow icon="🏁" label="End Date" value={viewProj.end} />
          <InfoRow icon="🎯" label="Purpose" value={viewProj.purpose} />
          <InfoRow icon="👥" label="Team" value={viewProj.team} />
          <InfoRow icon="📝" label="Description" value={viewProj.description} />
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={() => { setViewProj(null); openEdit(viewProj); }} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#9333ea,#a855f7)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>✏️ Edit</button>
            <button onClick={() => { setViewProj(null); setAssignModal(viewProj); setAssignTo(Array.isArray(viewProj.assignedTo) ? viewProj.assignedTo : (viewProj.assignedTo ? [viewProj.assignedTo] : [])); }} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>👤 Assign</button>
            <button onClick={() => { setViewProj(null); setDeleteTarget(viewProj); }} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#EF4444,#dc2626)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>🗑 Delete</button>
          </div>
        </Mdl>
      )}

      {editProj && (
        <Mdl title="Edit Project" onClose={() => setEditProj(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }} className="modal-2col">
            <Fld label="Project Name *" value={editForm.name} onChange={v => { setEditForm(p => ({ ...p, name: v })); setEditErr(p => ({ ...p, name: "" })); }} error={editErr.name} />
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>CLIENT *</label>
              <ClientDropdown clients={clients} value={editForm.client} onChange={v => { setEditForm(p => ({ ...p, client: v })); setEditErr(p => ({ ...p, client: "" })); }} error={editErr.client} />
              {editErr.client && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠️ {editErr.client}</div>}
            </div>
            <Fld label="Purpose" value={editForm.purpose} onChange={v => setEditForm(p => ({ ...p, purpose: v }))} />
            <Fld label="Budget" value={editForm.budget} onChange={v => setEditForm(p => ({ ...p, budget: v }))} />
            <Fld label="Start Date" value={editForm.start} type="date" onChange={v => setEditForm(p => ({ ...p, start: v }))} />
            <Fld label="End Date" value={editForm.end} type="date" onChange={v => setEditForm(p => ({ ...p, end: v }))} />
            <Fld label="Team Members" value={editForm.team} onChange={v => setEditForm(p => ({ ...p, team: v }))} />
            <Fld label="Status" value={editForm.status} onChange={v => setEditForm(p => ({ ...p, status: v }))} options={["Pending", "In Progress", "Completed", "On Hold"]} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>ASSIGN EMPLOYEES</label>
            <div style={{ border: "1.5px solid #ede9fe", borderRadius: 10, padding: "12px", background: "#faf5ff", maxHeight: 200, overflowY: "auto" }}>
              {employees.length === 0 ? <div style={{ color: "#a78bfa", fontSize: 13, textAlign: "center", padding: "20px" }}>No employees available</div>
                : employees.map(e => (
                  <div key={e._id || e.email} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f5f3ff" }}>
                    <input type="checkbox"
                      id={`edit-emp-${e._id || e.email}`}
                      checked={Array.isArray(editForm.assignedTo) ? editForm.assignedTo.includes(e.name) : (editForm.assignedTo === e.name)}
                      onChange={e => {
                        const currentAssigned = Array.isArray(editForm.assignedTo) ? editForm.assignedTo : (editForm.assignedTo ? [editForm.assignedTo] : []);
                        if (e.target.checked) {
                          setEditForm({ ...editForm, assignedTo: [...currentAssigned, e.name] });
                        } else {
                          setEditForm({ ...editForm, assignedTo: currentAssigned.filter(name => name !== e.name) });
                        }
                      }}
                      style={{ width: 16, height: 16, cursor: "pointer" }}
                    />
                    <label htmlFor={`edit-emp-${e._id || e.email}`} style={{ flex: 1, cursor: "pointer", fontSize: 13, color: "#1e0a3c", display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{e.name}</span>
                      {e.department && <span style={{ fontSize: 11, color: "#a78bba", background: "#f3e8ff", padding: "2px 6px", borderRadius: 4 }}>{e.department}</span>}
                    </label>
                  </div>
                ))}
            </div>
            {editForm.assignedTo && editForm.assignedTo.length > 0 && <div style={{ marginTop: 6, fontSize: 11, color: "#9333ea", fontWeight: 600 }}>{editForm.assignedTo.length} employee(s) selected</div>}
          </div>
          <Fld label="Description" value={editForm.description} onChange={v => setEditForm(p => ({ ...p, description: v }))} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
            <button onClick={() => setEditProj(null)} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
            <button onClick={saveEdit} disabled={saving} style={{ background: "linear-gradient(135deg,#a855f7,#9333ea)", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : "Save Changes →"}</button>
          </div>
        </Mdl>
      )}

      {assignModal && (
        <Mdl title="Assign Employees" onClose={() => setAssignModal(null)} maxWidth={450}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>SELECT EMPLOYEES TO ASSIGN</label>
            <div style={{ border: "1.5px solid #ede9fe", borderRadius: 10, padding: "12px", background: "#faf5ff", maxHeight: 200, overflowY: "auto" }}>
              {employees.length === 0 ? <div style={{ color: "#a78bfa", fontSize: 13, textAlign: "center", padding: "20px" }}>No employees available</div>
                : employees.map(e => (
                  <div key={e._id || e.email} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f5f3ff" }}>
                    <input type="checkbox"
                      id={`assign-emp-${e._id || e.email}`}
                      checked={Array.isArray(assignTo) ? assignTo.includes(e.name) : (assignTo === e.name)}
                      onChange={e => {
                        const currentAssigned = Array.isArray(assignTo) ? assignTo : (assignTo ? [assignTo] : []);
                        if (e.target.checked) {
                          setAssignTo([...currentAssigned, e.name]);
                        } else {
                          setAssignTo(currentAssigned.filter(name => name !== e.name));
                        }
                      }}
                      style={{ width: 16, height: 16, cursor: "pointer" }}
                    />
                    <label htmlFor={`assign-emp-${e._id || e.email}`} style={{ flex: 1, cursor: "pointer", fontSize: 13, color: "#1e0a3c", display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{e.name}</span>
                      {e.department && <span style={{ fontSize: 11, color: "#a78bba", background: "#f3e8ff", padding: "2px 6px", borderRadius: 4 }}>{e.department}</span>}
                    </label>
                  </div>
                ))}
            </div>
            {assignTo && assignTo.length > 0 && <div style={{ marginTop: 8, fontSize: 11, color: "#9333ea", fontWeight: 600 }}>{assignTo.length} employee(s) will be assigned</div>}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button onClick={() => setAssignModal(null)} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
            <button onClick={doAssign} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Save Assignment →</button>
          </div>
        </Mdl>
      )}

      {deleteTarget && <ConfirmModal title="Delete Project" message={`Delete "${deleteTarget.name}"? This cannot be undone.`} onConfirm={doDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PROJECT STATUS PAGE (unchanged, just pass managers properly)
// ═══════════════════════════════════════════════════════════
function SearchDropdown({ label, items, displayKey, value, onChange, error, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = items.filter(i => (i[displayKey] || "").toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ marginBottom: 14, position: "relative" }}>
      <label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>{label.toUpperCase()}</label>
      <div onClick={() => setOpen(!open)} style={{ width: "100%", border: `1.5px solid ${error ? "#EF4444" : open ? "#9333ea" : "#ede9fe"}`, borderRadius: 10, padding: "10px 36px 10px 14px", fontSize: 13, color: value ? T.text : "#a78bfa", background: "#faf5ff", cursor: "pointer", position: "relative", userSelect: "none", minHeight: 42, boxSizing: "border-box" }}>
        {value || placeholder || "-- Select --"}
        <span style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, fontSize: 10, color: "#a78bfa", transition: "0.2s" }}>▼</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #ede9fe", borderRadius: 12, boxShadow: "0 8px 32px rgba(147,51,234,0.15)", zIndex: 999, overflow: "hidden" }}>
          <div style={{ padding: "8px 10px" }}><input autoFocus placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} onClick={e => e.stopPropagation()} style={{ width: "100%", padding: "7px 10px", border: "1.5px solid #ede9fe", borderRadius: 8, fontSize: 12, background: "#faf5ff", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} /></div>
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filtered.length === 0 ? <div style={{ padding: 14, textAlign: "center", color: "#a78bfa", fontSize: 13 }}>No results</div>
              : filtered.map((item, i) => { const name = item[displayKey] || ""; const isSel = value === name; return (<div key={i} onClick={() => { onChange(name); setOpen(false); setSearch(""); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: isSel ? "#f3e8ff" : "transparent", borderBottom: "1px solid #f5f3ff" }} onMouseEnter={e => e.currentTarget.style.background = "#faf5ff"} onMouseLeave={e => e.currentTarget.style.background = isSel ? "#f3e8ff" : "transparent"}><div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#9333ea,#c084fc)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{name[0]?.toUpperCase() || "?"}</div><span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{name}</span>{isSel && <span style={{ marginLeft: "auto", color: "#9333ea" }}>✓</span>}</div>); })}
          </div>
        </div>
      )}
      {open && <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={() => { setOpen(false); setSearch(""); }} />}
      {error && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠️ {error}</div>}
    </div>
  );
}

function ProjectStatusPage({ clients, employees, managers }) {
  const EMPTY = { projectId: "", name: "", client: "", manager: "", employee: "", deadline: "", status: "In Progress", progress: 0, notes: "" };
  const [trackList, setTrackList] = useState([]);
  const [tsFilter, setTsFilter] = useState("All");
  const [tsSearch, setTsSearch] = useState("");
  const [tsModal, setTsModal] = useState(null);
  const [tsEditId, setTsEditId] = useState(null);
  const [tsForm, setTsForm] = useState(EMPTY);
  const [tsErr, setTsErr] = useState({});
  const [tsSaving, setTsSaving] = useState(false);
  const [tsToast, setTsToast] = useState("");
  useEffect(() => { axios.get(BASE_URL + "/api/project-status").then(r => { if (r.data?.length) setTrackList(r.data); }).catch(() => { }); }, []);
  const showToast = (msg) => { setTsToast(msg); setTimeout(() => setTsToast(""), 2800); };
  const clientNames = clients.map(c => ({ name: c.clientName || c.name || "" }));
  const managerNames = managers.map(m => ({ name: m.managerName || m.name || "" }));
  const employeeNames = employees.map(e => ({ name: e.name || "" }));
  const displayed = trackList.filter(p => { const okStatus = tsFilter === "All" || p.status === tsFilter; const q = tsSearch.toLowerCase(); const okSearch = !q || (p.name || "").toLowerCase().includes(q) || (p.client || "").toLowerCase().includes(q) || (p.projectId || p.id || "").toLowerCase().includes(q); return okStatus && okSearch; });
  const tsStats = [{ t: "Total", v: trackList.length, i: "📁", c: "#9333ea" }, { t: "In Progress", v: trackList.filter(p => p.status === "In Progress").length, i: "⚡", c: "#7c3aed" }, { t: "Completed", v: trackList.filter(p => p.status === "Completed").length, i: "✅", c: "#22C55E" }, { t: "Pending", v: trackList.filter(p => p.status === "Pending").length, i: "🕐", c: "#F59E0B" }, { t: "On Hold", v: trackList.filter(p => p.status === "On Hold").length, i: "⏸️", c: "#a855f7" }];
  const openAdd = () => { setTsForm(EMPTY); setTsErr({}); setTsEditId(null); setTsModal("add"); };
  const openEdit = (p) => { setTsForm({ projectId: p.projectId || p.id || "", name: p.name || "", client: p.client || "", manager: p.manager || "", employee: p.employee || "", deadline: p.deadline || "", status: p.status || "In Progress", progress: p.progress || p.pct || 0, notes: p.notes || p.note || "" }); setTsErr({}); setTsEditId(p._id || p.id); setTsModal("edit"); };
  const saveTs = async () => { const errs = {}; if (!tsForm.name.trim()) errs.name = "Project name required"; if (!tsForm.client.trim()) errs.client = "Client required"; if (!tsForm.deadline) errs.deadline = "Deadline required"; const pv = Number(tsForm.progress); if (isNaN(pv) || pv < 0 || pv > 100) errs.progress = "0–100 only"; if (Object.keys(errs).length) { setTsErr(errs); return; } try { setTsSaving(true); const payload = { ...tsForm, progress: Number(tsForm.progress) }; if (tsModal === "add") { if (!payload.projectId) { const maxId = Math.max(...trackList.map(p => { const match = (p.projectId || p.id || "").match(/PRJ(\d+)/); return match ? parseInt(match[1]) : 0; }), 0); payload.projectId = `PRJ${String(maxId + 1).padStart(3, "0")}`; } const res = await axios.post(BASE_URL + "/api/project-status", payload); setTrackList(prev => [res.data, ...prev]); } else { const res = await axios.put(`${BASE_URL}/api/project-status/${tsEditId}`, payload); setTrackList(prev => prev.map(p => (p._id || p.id) === tsEditId ? res.data : p)); } showToast(tsModal === "add" ? "✅ Project added!" : "✅ Project updated!"); setTsModal(null); } catch { if (tsModal === "add") { const local = { ...tsForm, _id: Date.now().toString(), projectId: tsForm.projectId || `PRJ${String(trackList.length + 1).padStart(3, "0")}`, progress: Number(tsForm.progress) }; setTrackList(prev => [local, ...prev]); } else { setTrackList(prev => prev.map(p => (p._id || p.id) === tsEditId ? { ...p, ...tsForm, progress: Number(tsForm.progress) } : p)); } showToast("✅ Saved locally!"); setTsModal(null); } finally { setTsSaving(false); } };
  const deleteTs = async (id) => { if (!window.confirm("Delete?")) return; try { await axios.delete(`${BASE_URL}/api/project-status/${id}`); } catch { } setTrackList(prev => prev.filter(p => (p._id || p.id) !== id)); showToast("🗑️ Deleted!"); };
  const B2 = (color) => ({ background: `linear-gradient(135deg,${color},${color}cc)`, color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {tsToast && <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#fff", border: "1.5px solid #22c55e", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#22c55e", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>{tsToast}</div>}
      <div className="dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
        {tsStats.map(({ t, v, i, c }) => (<div key={t} style={{ background: "#fff", borderRadius: 14, padding: "16px 14px", boxShadow: "0 4px 18px rgba(147,51,234,0.07)", border: "1px solid #ede9fe", position: "relative", overflow: "hidden" }}><div style={{ width: 38, height: 38, borderRadius: 10, background: `${c}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, marginBottom: 8 }}>{i}</div><div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 }}>{t.toUpperCase()}</div><div style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}</div></div>))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}><span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>🔍</span><input placeholder="Search…" value={tsSearch} onChange={e => setTsSearch(e.target.value)} style={{ padding: "9px 14px 9px 34px", border: "1.5px solid #ede9fe", borderRadius: 10, fontSize: 13, background: "#faf5ff", outline: "none", fontFamily: "inherit", width: 240, color: T.text }} /></div>
          {["All", "In Progress", "Pending", "Completed", "On Hold"].map(f => (<button key={f} onClick={() => setTsFilter(f)} style={{ padding: "7px 13px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", border: "1.5px solid", borderColor: tsFilter === f ? "#9333ea" : "#ede9fe", background: tsFilter === f ? "rgba(147,51,234,0.1)" : "#fff", color: tsFilter === f ? "#9333ea" : "#a78bfa" }}>{f}</button>))}
        </div>
        <button onClick={openAdd} style={B2("#9333ea")}>+ Add Project Status</button>
      </div>
      <SC title={`Project Status (${displayed.length})`}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 900 }}>
            <thead><tr style={{ background: "linear-gradient(90deg,#f5f3ff,#faf5ff)" }}>{["ID", "Project", "Client", "Manager", "Employee", "Deadline", "Status", "Progress", "Notes", "Actions"].map(c => (<th key={c} style={{ padding: "10px 12px", textAlign: "left", color: "#7c3aed", fontWeight: 700, fontSize: 11, borderBottom: "2px solid #ede9fe", whiteSpace: "nowrap" }}>{c.toUpperCase()}</th>))}</tr></thead>
            <tbody>
              {displayed.length === 0 ? <tr><td colSpan={10} style={{ padding: 40, textAlign: "center", color: "#a78bfa" }}>No projects found</td></tr>
                : displayed.map((p, i) => (<tr key={p._id || p.id || i} style={{ borderBottom: "1px solid #f3f0ff" }} onMouseEnter={e => e.currentTarget.style.background = "#faf5ff"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "11px 12px", fontFamily: "monospace", fontSize: 11, color: "#a78bfa" }}>{p.projectId || p.id || `PRJ${String(i + 1).padStart(3, "0")}`}</td>
                  <td style={{ padding: "11px 12px", fontWeight: 700, color: T.text }}>{p.name}</td>
                  <td style={{ padding: "11px 12px" }}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#9333ea,#c084fc)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{(p.client || "?")[0].toUpperCase()}</div><span style={{ color: T.text, fontSize: 12 }}>{p.client || "—"}</span></div></td>
                  <td style={{ padding: "11px 12px", color: "#7c3aed", fontSize: 12 }}>{p.manager || "—"}</td>
                  <td style={{ padding: "11px 12px", color: "#7c3aed", fontSize: 12 }}>{p.employee || "—"}</td>
                  <td style={{ padding: "11px 12px", fontFamily: "monospace", fontSize: 12, color: "#a78bfa", whiteSpace: "nowrap" }}>{p.deadline || "—"}</td>
                  <td style={{ padding: "11px 12px" }}><Badge label={p.status} /></td>
                  <td style={{ padding: "11px 12px", minWidth: 130 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ flex: 1, background: "#ede9fe", borderRadius: 6, height: 7 }}><div style={{ width: `${p.progress || p.pct || 0}%`, background: p.progress === 100 || p.pct === 100 ? "linear-gradient(90deg,#22C55E,#4ade80)" : "linear-gradient(90deg,#9333ea,#c084fc)", borderRadius: 6, height: "100%" }} /></div><span style={{ fontSize: 12, fontWeight: 700, color: sc(p.status), width: 32, textAlign: "right" }}>{p.progress || p.pct || 0}%</span></div></td>
                  <td style={{ padding: "11px 12px", maxWidth: 180 }}><span style={{ fontSize: 12, color: "#a78bfa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }} title={p.notes || p.note}>{(p.notes || p.note) ? `📝 ${p.notes || p.note}` : "—"}</span></td>
                  <td style={{ padding: "11px 12px" }}><ActionBtns onEdit={() => openEdit(p)} onDelete={() => deleteTs(p._id || p.id)} /></td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </SC>
      {tsModal && (<Mdl title={tsModal === "add" ? "Add Project Status" : "Edit Project Status"} onClose={() => setTsModal(null)}>
        <div className="modal-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
          <Fld label="Project ID" value={tsForm.projectId || "Auto-generated"} onChange={v => setTsForm({ ...tsForm, projectId: v })} placeholder="Auto-generated (PRJ001)" disabled={tsModal === "add"} />
          <Fld label="Project Name *" value={tsForm.name} onChange={v => { setTsForm({ ...tsForm, name: v }); setTsErr(p => ({ ...p, name: "" })); }} error={tsErr.name} />
          <div style={{ marginBottom: 14 }}><label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>CLIENT *</label><ClientDropdown clients={clientNames.length ? clients : []} value={tsForm.client} onChange={v => { setTsForm({ ...tsForm, client: v }); setTsErr(p => ({ ...p, client: "" })); }} error={tsErr.client} />{tsErr.client && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠️ {tsErr.client}</div>}</div>
          <SearchDropdown label="Manager" items={managerNames} displayKey="name" value={tsForm.manager} onChange={v => setTsForm({ ...tsForm, manager: v })} placeholder="-- Select Manager --" />
          <SearchDropdown label="Employee" items={employeeNames} displayKey="name" value={tsForm.employee} onChange={v => setTsForm({ ...tsForm, employee: v })} placeholder="-- Select Employee --" />
          <Fld label="Deadline *" value={tsForm.deadline} type="date" onChange={v => { setTsForm({ ...tsForm, deadline: v }); setTsErr(p => ({ ...p, deadline: "" })); }} error={tsErr.deadline} />
          <Fld label="Status" value={tsForm.status} onChange={v => setTsForm({ ...tsForm, status: v })} options={["In Progress", "Pending", "Completed", "On Hold"]} />
          <Fld label="Progress (0–100)" value={String(tsForm.progress)} type="number" onChange={v => { setTsForm({ ...tsForm, progress: v }); setTsErr(p => ({ ...p, progress: "" })); }} error={tsErr.progress} placeholder="e.g. 65" />
        </div>
        <Fld label="Notes" value={tsForm.notes} onChange={v => setTsForm({ ...tsForm, notes: v })} placeholder="Brief update…" />
        <div style={{ background: "#faf5ff", borderRadius: 12, padding: "12px 16px", border: "1px solid #ede9fe", marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, marginBottom: 8 }}>PROGRESS PREVIEW</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ flex: 1, background: "#ede9fe", borderRadius: 6, height: 8 }}><div style={{ width: `${Math.min(100, Math.max(0, Number(tsForm.progress) || 0))}%`, background: "linear-gradient(90deg,#9333ea,#c084fc)", borderRadius: 6, height: "100%", transition: "width 0.3s" }} /></div><span style={{ fontSize: 13, fontWeight: 800, color: "#9333ea", width: 36, textAlign: "right" }}>{Math.min(100, Math.max(0, Number(tsForm.progress) || 0))}%</span></div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
          <button onClick={() => setTsModal(null)} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>
          <button onClick={saveTs} disabled={tsSaving} style={{ ...B2("#9333ea"), opacity: tsSaving ? 0.7 : 1 }}>{tsSaving ? "Saving…" : tsModal === "add" ? "Save Project →" : "Update Project →"}</button>
        </div>
      </Mdl>)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// INTERVIEW PAGE (unchanged)
// ═══════════════════════════════════════════════════════════
function InterviewPage({ companyId, companyName }) {
  const CID = companyId || "69b8fe0a6e3d6f1e056f3109";
  const CNAME = companyName || "M Business";
  const STORAGE_KEY = `hr_candidates_${CID}`;
  const API_URL = BASE_URL;
  const [candidates, setCandidates] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewModal, setViewModal] = useState(null);
  const [toast, setToast] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const appLink = `${window.location.origin}/interview-apply/${CNAME.replace(/\s+/g, "-")}-${CID}`;
  useEffect(() => { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); if (saved.length) { setCandidates(saved); setLoading(false); } axios.get(`${BASE_URL}/api/interviews?companyId=${CID}`).then(r => { const list = r.data?.data || (Array.isArray(r.data) ? r.data : []); if (list.length) { setCandidates(list); localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } }).catch(() => { }).finally(() => setLoading(false)); }, [CID]);
  const persist = (list) => { setCandidates(list); localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };
  // ✅ Fix — works in HTTP + HTTPS + all browsers
  const copyLink = async () => {
    try {
      const companySlug = `${companyName}-${companyId}`.replace(/\s+/g, "-");
      const link = `${window.location.origin}/interview-apply/${companySlug}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(link);
      } else {
        const el = document.createElement("textarea");
        el.value = link;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      showToast("✅ Link copied!");          // ← toast.success பதிலா
    } catch (err) {
      console.error("Copy failed:", err);
      showToast("❌ Copy failed. Please copy manually.");  // ← toast.error பதிலா
    }
  };
  const updateStatus = (idx, val) => { const updated = [...candidates]; updated[idx] = { ...updated[idx], status: val }; persist(updated); const c = updated[idx]; const id = c._id || c.id; if (id) axios.patch(`${API_URL}/api/interviews/${id}/status`, { status: val }, { headers: { "Content-Type": "application/json" } }).catch(() => { }); showToast(`✅ Status → "${val}"`); if (viewModal && (viewModal._id || viewModal.id) === id) setViewModal(updated[idx]); };
  const deleteCandidate = (idx) => { if (!window.confirm("Delete this candidate?")) return; const c = candidates[idx]; const id = c._id || c.id; if (id) axios.delete(`${API_URL}/api/interviews/${id}`).catch(() => { }); persist(candidates.filter((_, i) => i !== idx)); showToast("🗑️ Deleted"); setViewModal(null); };
  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const displayed = candidates.filter(c => { const okF = filter === "all" || (c.status || "pending").toLowerCase() === filter; const q = search.toLowerCase(); const okS = !q || (c.name || "").toLowerCase().includes(q) || (c.role || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || (c.mobile || "").includes(q); return okF && okS; });
  const counts = { total: candidates.length, pending: candidates.filter(c => (c.status || "pending").toLowerCase() === "pending").length, hired: candidates.filter(c => (c.status || "").toLowerCase() === "hired").length, rejected: candidates.filter(c => (c.status || "").toLowerCase() === "rejected").length };
  const sColor = { pending: "#F59E0B", hired: "#22C55E", rejected: "#EF4444" };
  const sC = (s = "pending") => sColor[s.toLowerCase()] || "#a855f7";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#fff", border: "1.5px solid #22c55e", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#22c55e", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>{toast}</div>}
      <div style={{ background: "linear-gradient(135deg,#1e0a3c,#2d1057)", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", boxShadow: "0 8px 24px rgba(59,7,100,0.25)" }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(147,51,234,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🔗</div>
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Candidate Application Link</div><div style={{ fontSize: 12, color: "#c084fc", fontFamily: "monospace", wordBreak: "break-all" }}>{appLink}</div></div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={copyLink} style={{ background: linkCopied ? "rgba(34,197,94,0.2)" : "rgba(147,51,234,0.25)", border: `1px solid ${linkCopied ? "rgba(34,197,94,0.5)" : "rgba(147,51,234,0.5)"}`, borderRadius: 9, padding: "9px 16px", color: linkCopied ? "#4ade80" : "#c084fc", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{linkCopied ? "✅ Copied!" : "📋 Copy Link"}</button>
          <button onClick={() => window.open(appLink, "_blank")} style={{ background: "linear-gradient(135deg,#9333ea,#a855f7)", border: "none", borderRadius: 9, padding: "9px 16px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>👁 Preview Form</button>
        </div>
      </div>
      <div className="dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[{ t: "Total", v: counts.total, i: "🎯", c: "#9333ea" }, { t: "Pending", v: counts.pending, i: "⏳", c: "#F59E0B" }, { t: "Hired", v: counts.hired, i: "✅", c: "#22C55E" }, { t: "Rejected", v: counts.rejected, i: "❌", c: "#EF4444" }].map(({ t, v, i, c }) => (<div key={t} style={{ background: "#fff", borderRadius: 14, padding: "18px 16px", boxShadow: "0 4px 18px rgba(147,51,234,0.07)", border: "1px solid #ede9fe", position: "relative", overflow: "hidden" }}><div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${c},${c}88)` }} /><div style={{ width: 36, height: 36, borderRadius: 10, background: `${c}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 8 }}>{i}</div><div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 }}>{t.toUpperCase()}</div><div style={{ fontSize: 26, fontWeight: 800, color: c }}>{v}</div></div>))}
      </div>
      <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 4px 24px rgba(147,51,234,0.08)", border: "1px solid #ede9fe" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1e0a3c" }}>All Candidates ({displayed.length})</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}><span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>🔍</span><input placeholder="Search name, role, email, mobile..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", padding: "9px 14px 9px 34px", border: "1.5px solid #ede9fe", borderRadius: 10, fontSize: 13, background: "#faf5ff", outline: "none", fontFamily: "inherit", color: "#1e0a3c", boxSizing: "border-box" }} /></div>
          {["all", "pending", "hired", "rejected"].map(f => (<button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", border: "1.5px solid", borderColor: filter === f ? (f === "all" ? "#9333ea" : sC(f)) : "#ede9fe", background: filter === f ? `${f === "all" ? "#9333ea" : sC(f)}15` : "#fff", color: filter === f ? (f === "all" ? "#9333ea" : sC(f)) : "#a78bfa", transition: "all 0.15s" }}>{f === "all" ? "🎯 All" : f === "pending" ? "⏳ Pending" : f === "hired" ? "✅ Hired" : "❌ Rejected"}</button>))}
        </div>
        {loading ? (<div style={{ textAlign: "center", padding: 50, color: "#a78bfa" }}>Loading candidates...</div>) : displayed.length === 0 ? (<div style={{ textAlign: "center", padding: "50px 20px", color: "#a78bfa" }}><div style={{ fontSize: 48, marginBottom: 12 }}>📭</div><div style={{ fontSize: 15, fontWeight: 700, color: "#1e0a3c", marginBottom: 6 }}>{candidates.length === 0 ? "No applications yet" : "No results found"}</div></div>) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 950 }}>
              <thead><tr style={{ background: "linear-gradient(90deg,#f5f3ff,#faf5ff)" }}>{["#", "Candidate", "Contact", "Experience", "Role", "Interviewer", "Date", "Status", "Resume", "Actions"].map(h => (<th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#7c3aed", fontWeight: 700, fontSize: 10, borderBottom: "2px solid #ede9fe", whiteSpace: "nowrap" }}>{h.toUpperCase()}</th>))}</tr></thead>
              <tbody>
                {displayed.map((c, i) => {
                  const idx = candidates.indexOf(c); const status = (c.status || "pending").toLowerCase(); const resumeUrl = c.resumeUrl || (c.resumePath ? `https://m-business-r2vd.onrender.com/uploads/resumes/${c.resumePath.split(/[\\/]/).pop()}` : null);
                  const finalResumeUrl = resumeUrl; return (
                    <tr key={c._id || c.id || i} style={{ borderBottom: "1px solid #f3f0ff", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "#faf5ff"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "12px 12px", color: "#a78bfa", fontSize: 11, fontFamily: "monospace" }}>{String(i + 1).padStart(3, "0")}</td>
                      <td style={{ padding: "12px 12px" }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#9333ea,#c084fc)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{(c.name || "?")[0].toUpperCase()}</div><span style={{ fontWeight: 700, color: "#1e0a3c" }}>{c.name || "—"}</span></div></td>
                      <td style={{ padding: "12px 12px" }}><div style={{ fontSize: 12, color: "#7c3aed" }}>{c.email || "—"}</div><div style={{ fontSize: 11, color: "#a78bfa", marginTop: 2 }}>{c.mobile || ""}</div></td>
                      <td style={{ padding: "12px 12px" }}>{(c.experience || "").toLowerCase() === "fresher" ? <span style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.25)", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>🎓 Fresher</span> : <span style={{ background: "rgba(147,51,234,0.12)", color: "#9333ea", border: "1px solid rgba(147,51,234,0.25)", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>💼 {c.years || "?"}yrs</span>}</td>
                      <td style={{ padding: "12px 12px", fontWeight: 600, color: "#1e0a3c", fontSize: 12 }}>{c.role || "—"}</td>
                      <td style={{ padding: "12px 12px", fontSize: 12, color: "#7c3aed" }}>{c.interviewerName || <span style={{ color: "#ddd" }}>—</span>}</td>
                      <td style={{ padding: "12px 12px", fontSize: 12, color: "#a78bfa", fontFamily: "monospace", whiteSpace: "nowrap" }}>{fmt(c.date || c.createdAt)}</td>
                      <td style={{ padding: "12px 12px" }}><select value={status} onChange={e => updateStatus(idx, e.target.value)} style={{ background: status === "hired" ? "rgba(34,197,94,0.1)" : status === "rejected" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", border: `1.5px solid ${sC(status)}44`, borderRadius: 8, padding: "5px 10px", color: sC(status), fontSize: 12, fontWeight: 700, cursor: "pointer", outline: "none", fontFamily: "inherit" }}><option value="pending">⏳ Pending</option><option value="hired">✅ Hired</option><option value="rejected">❌ Rejected</option></select></td>
                      <td style={{ padding: "12px 12px" }}>{finalResumeUrl ? <button onClick={() => setViewModal({ ...c, _resolvedResumeUrl: finalResumeUrl })} style={{ background: "rgba(147,51,234,0.1)", border: "1px solid rgba(147,51,234,0.3)", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#9333ea", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap" }}>📄 View</button> : <span style={{ fontSize: 11, color: "#ddd" }}>—</span>}</td>
                      <td style={{ padding: "12px 12px" }}><div style={{ display: "flex", gap: 5 }}><button onClick={() => setViewModal({ ...c, _resolvedResumeUrl: finalResumeUrl })} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: 7, padding: "5px 10px", fontSize: 12, color: "#7c3aed", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>👤</button><button onClick={() => deleteCandidate(idx)} style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 7, padding: "5px 10px", fontSize: 12, color: "#ef4444", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>🗑</button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {viewModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(59,7,100,0.55)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 820, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(147,51,234,0.25)" }}>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid #ede9fe", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(90deg,#f5f3ff,#faf5ff)", flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1e0a3c" }}>👤 Candidate Profile</h2>
              <button onClick={() => setViewModal(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#7c3aed", padding: "4px 8px" }}>✕</button>
            </div>
            <div style={{ overflowY: "auto", padding: "20px 22px", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, background: "linear-gradient(135deg,#f5f3ff,#faf5ff)", borderRadius: 14, border: "1px solid #ede9fe", marginBottom: 18 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#9333ea,#c084fc)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 800, flexShrink: 0 }}>
                  {(viewModal.name || "?")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#1e0a3c" }}>{viewModal.name}</div>
                  <div style={{ fontSize: 13, color: "#9333ea", fontWeight: 600, marginTop: 2 }}>{viewModal.role || "—"}</div>
                </div>
                <span style={{ background: `${sC(viewModal.status || "pending")}18`, color: sC(viewModal.status || "pending"), border: `1px solid ${sC(viewModal.status || "pending")}33`, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  {(viewModal.status || "pending") === "pending" ? "⏳ Pending" : (viewModal.status || "") === "hired" ? "✅ Hired" : "❌ Rejected"}
                </span>
              </div>

              {viewModal._resolvedResumeUrl && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#1e0a3c" }}>📄 Resume</h3>
                  <div style={{ border: "1.5px solid #ede9fe", borderRadius: 12, overflow: "hidden", background: "#faf5ff" }}>
                    <iframe
                      src={viewModal._resolvedResumeUrl}
                      style={{ width: "100%", height: "500px", border: "none" }}
                      title="Resume"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const errorDiv = document.createElement('div');
                        errorDiv.style.cssText = 'padding: 50px; text-align: center; color: #ef4444; font-size: 14px; background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 12px; margin: 20px;';
                        errorDiv.innerHTML = '📄 Resume file not found<br><span style="font-size: 12px; color: #991b1b;">The resume file may have been deleted or moved</span>';
                        e.target.parentNode.appendChild(errorDiv);
                      }}
                    />
                    <div style={{ padding: "12px", background: "#fff", borderTop: "1px solid #ede9fe", display: "flex", justifyContent: "center" }}>
                      <a href={viewModal._resolvedResumeUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#9333ea", color: "#fff", padding: "8px 16px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
                        🔗 Open in New Tab
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
                <div style={{ padding: 12, background: "#f5f3ff", borderRadius: 10, border: "1px solid #ede9fe" }}>
                  <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>📧 Email</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e0a3c" }}>{viewModal.email || "—"}</div>
                </div>
                <div style={{ padding: 12, background: "#f5f3ff", borderRadius: 10, border: "1px solid #ede9fe" }}>
                  <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>📱 Mobile</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e0a3c" }}>{viewModal.mobile || "—"}</div>
                </div>
                <div style={{ padding: 12, background: "#f5f3ff", borderRadius: 10, border: "1px solid #ede9fe" }}>
                  <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>💼 Experience</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e0a3c" }}>
                    {(viewModal.experience || "").toLowerCase() === "fresher" ? "🎓 Fresher" : `💼 ${viewModal.years || "?"} years`}
                  </div>
                </div>
                <div style={{ padding: 12, background: "#f5f3ff", borderRadius: 10, border: "1px solid #ede9fe" }}>
                  <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>📅 Applied Date</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e0a3c" }}>{fmt(viewModal.date || viewModal.createdAt)}</div>
                </div>
                <div style={{ padding: 12, background: "#f5f3ff", borderRadius: 10, border: "1px solid #ede9fe" }}>
                  <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>👨‍💼 Interviewer</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e0a3c" }}>{viewModal.interviewerName || "—"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PROFILE MODAL  
// ═══════════════════════════════════════════════════════════
function ProfileModal({ user, setUser, onClose, onLogout, companyLogo, onLogoChange }) {
  const logoRef = useRef();
  const [editingComp, setEditingComp] = useState(false);
  const [compName, setCompName] = useState(user?.companyName || "");
  const displayName = user?.name || user?.email?.split("@")[0] || "Admin";
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const saveCompName = async () => {
    try {
      await axios.put(`${BASE_URL}/api/subadmins/${user.id || user._id}`, { companyName: compName });
      const updated = { ...user, companyName: compName };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setEditingComp(false);
    } catch (err) { alert("Failed to save company name"); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(59,7,100,0.6)", backdropFilter: "blur(10px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 22, width: "100%", maxWidth: 420, maxHeight: "90vh", boxShadow: "0 32px 80px rgba(147,51,234,0.3)", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
        <div style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7,#c084fc)", padding: "28px 28px 22px", textAlign: "center", flexShrink: 0 }}>
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.2)", border: "none", width: 30, height: 30, borderRadius: 8, color: "#fff", fontSize: 16, cursor: "pointer" }}>✕</button>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 8, margin: "0 auto 12px", position: "relative", width: "fit-content" }}>
            <div style={{ width: 72, height: 72, borderRadius: 16, background: "rgba(255,255,255,0.22)", border: "3px solid rgba(255,255,255,0.45)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {companyLogo ? <img src={companyLogo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 5, background: "#fff" }} /> : <span style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{initials}</span>}
            </div>
            <button 
              onClick={() => logoRef.current.click()} 
              style={{ padding: "6px", background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Upload Logo"
            >
              📷
            </button>
          </div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff" }}>{displayName}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{user?.email || "—"}</p>
          <span style={{ display: "inline-block", marginTop: 8, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 100, padding: "3px 12px", fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: 1, textTransform: "uppercase" }}>{user?.role || "user"}</span>
        </div>
        <div style={{ padding: "18px 24px", overflowY: "auto", flex: 1 }}>
          {[{ icon: "👤", label: "Full Name", value: displayName }, { icon: "📧", label: "Email", value: user?.email || "—" }, { icon: "📱", label: "Phone", value: user?.phone || "—" }, { icon: "🎭", label: "Role", value: user?.role || "user" }, { icon: "🔑", label: "User ID", value: (user?.id || user?._id) ? `#${String(user?.id || user?._id).slice(-8).toUpperCase()}` : "—" }].map(({ icon, label, value }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#faf5ff", borderRadius: 9, border: "1px solid #ede9fe", marginBottom: 7 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(147,51,234,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e0a3c", marginTop: 1 }}>{value}</div>
              </div>
            </div>
          ))}

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#fdf4ff", borderRadius: 9, border: "1px solid #fae8ff", marginBottom: 7 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(168,85,247,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🏢</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: "#9333ea", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>Company Name</div>
              {editingComp ? (
                <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
                  <input value={compName} onChange={e => setCompName(e.target.value)} style={{ flex: 1, padding: "5px 8px", fontSize: 12, border: "1.5px solid #ede9fe", borderRadius: 6, outline: "none" }} />
                  <button onClick={saveCompName} style={{ background: "#22c55e", border: "none", color: "#fff", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Save</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e0a3c" }}>{user?.companyName || "Not Set"}</div>
                  <button onClick={() => setEditingComp(true)} style={{ background: "none", border: "none", color: "#9333ea", fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "2px 4px" }}>Edit</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ padding: "12px 24px 18px", borderTop: "1px solid #ede9fe", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "10px", background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: 9, fontSize: 13, fontWeight: 600, color: "#1e0a3c", cursor: "pointer", fontFamily: "inherit" }}>Close</button>
            <button onClick={onLogout} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#EF4444,#dc2626)", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>🚪 Logout</button>
          </div>
        </div>
        <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={async (e) => { const file = e.target.files[0]; if (!file) return; const formData = new FormData(); formData.append("file", file); try { const cloudRes = await axios.post(BASE_URL + "/api/upload/logo", formData); const uploadedUrl = cloudRes.data.logoUrl; await axios.post(BASE_URL + "/api/auth/save-logo", { userId: user.id || user._id, logoUrl: uploadedUrl }); const updatedUser = { ...user, logoUrl: uploadedUrl }; localStorage.setItem("user", JSON.stringify(updatedUser)); setUser(updatedUser); onLogoChange(uploadedUrl); } catch (err) { console.error(err); alert("Upload failed!"); } }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════
function Sidebar({ user, active, setActive, onLogout, open, onClose, navItems, companyLogo, onLogoChange }) {
  const items = navItems || NAV;
  const displayName = user?.name || user?.email?.split("@")[0] || "Admin";
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const roleDisplay = (user?.role || "ADMIN").toUpperCase();
  const companyName = user?.companyName || "";
  const logoRef = useRef();
  
  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 998, display: "block" }} className="mob-overlay" />}
      <div style={{ width: 225, background: "linear-gradient(180deg,#1e0a3c 0%,#2d1057 60%,#1e0a3c 100%)", color: "#fff", display: "flex", flexDirection: "column", height: "100vh", position: "fixed", top: 0, left: 0, zIndex: 999, flexShrink: 0, overflow: "hidden", boxShadow: "4px 0 24px rgba(0,0,0,0.25)", transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)" }} className="sidebar">
        <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", position: "relative", zIndex: 1, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {companyLogo && (
                <div style={{ width: 32, height: 32, borderRadius: 6, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                  <img src={companyLogo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 2 }} />
                </div>
              )}
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700 }}>{roleDisplay}</div>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, textAlign: "center" }}>{companyName}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 18, cursor: "pointer", padding: "2px 6px", lineHeight: 1 }} className="sidebar-close">✕</button>
        </div>
        <nav style={{ flex: 1, minHeight: 0, padding: "10px 8px", overflowY: "auto", position: "relative", zIndex: 1 }}>
          {items.map(n => { const on = active === n.key; return (<button key={n.key} onClick={() => { setActive(n.key); onClose(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", background: on ? "linear-gradient(90deg,rgba(147,51,234,0.35),rgba(168,85,247,0.15))" : "transparent", border: on ? "1px solid rgba(168,85,247,0.35)" : "1px solid transparent", borderRadius: 11, color: on ? "#e9d5ff" : "rgba(255,255,255,0.45)", fontWeight: on ? 700 : 400, fontSize: 12.5, cursor: "pointer", marginBottom: 2, textAlign: "left", fontFamily: "inherit" }}><span style={{ fontSize: 15 }}>{n.icon}</span><span style={{ flex: 1 }}>{n.label}</span>{on && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#c084fc", flexShrink: 0 }} />}</button>); })}
        </nav>
        <div style={{ padding: "10px 14px 14px", borderTop: "1px solid rgba(255,255,255,0.07)", position: "relative", zIndex: 1, flexShrink: 0 }}>
          <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "10px 12px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 11, color: "#fca5a5", fontSize: 12.5, cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>🚪 Logout</button>
        </div>
      </div>
      <div className="sidebar-spacer" style={{ width: 225, flexShrink: 0 }} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// PACKAGES PAGE
// ═══════════════════════════════════════════════════════════
function PackagesPage({ packages, onViewPackage, onEditPackage }) {
  const displayedPackages = packages || [];

  if (displayedPackages.length === 0) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ textAlign: "center", padding: "80px 20px", background: "#fff", borderRadius: 24, border: "2px dashed #ede9fe", boxShadow: "0 4px 20px rgba(147,51,234,0.05)" }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>📦</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1e0a3c", marginBottom: 12 }}>No Packages Assigned</h2>
          <p style={{ fontSize: 15, color: "#7c3aed", maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
            You don't have any packages assigned yet. Please contact your administrator to assign packages to your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
      {/* Cards Grid - 3 columns like the design */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, marginBottom: 40, background: "#f8fafc", borderRadius: 16, overflow: "hidden" }}>
        {displayedPackages.map((p, idx) => {
          const isPro = p.id === "pro" || p.title === "PRO";
          return (
            <div key={p.id || idx} style={{ 
              background: "#fff", 
              padding: "40px 32px", 
              display: "flex", 
              flexDirection: "column",
              borderRight: idx < 2 ? "1px solid #e2e8f0" : "none"
            }}>
              {/* Icon */}
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: "50%", 
                border: "2px solid #e0f2fe", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontSize: 22, 
                marginBottom: 20,
                color: "#0ea5e9"
              }}>
                {p.icon || "📦"}
              </div>
              
              {/* Title */}
              <h3 style={{ 
                margin: "0 0 16px", 
                fontSize: 20, 
                fontWeight: 700, 
                color: "#1e293b", 
                textTransform: "uppercase", 
                letterSpacing: 0.5 
              }}>
                {p.title}
              </h3>
              
              {/* Description */}
              <p style={{ 
                margin: "0 0 32px", 
                fontSize: 14, 
                color: "#64748b", 
                lineHeight: 1.6, 
                minHeight: 70 
              }}>
                {p.description || p.desc}
              </p>
              
              {/* Per seat label */}
              <div style={{ 
                fontSize: 13, 
                fontWeight: 500, 
                color: "#94a3b8", 
                marginBottom: 8,
                textTransform: "lowercase"
              }}>
                {p.perSeat || "Per seat"}
              </div>
              
              {/* Price */}
              <div style={{ 
                display: "flex", 
                alignItems: "baseline", 
                gap: 6, 
                marginBottom: 24 
              }}>
                <span style={{ 
                  fontSize: 36, 
                  fontWeight: 700, 
                  color: "#0f172a" 
                }}>
                  {p.price}
                </span>
                {p.currency && (
                  <span style={{ 
                    fontSize: 16, 
                    fontWeight: 600, 
                    color: "#64748b" 
                  }}>
                    {p.currency}
                  </span>
                )}
                {p.period && (
                  <span style={{ 
                    fontSize: 14, 
                    fontWeight: 500, 
                    color: "#94a3b8" 
                  }}>
                    {p.period}
                  </span>
                )}
              </div>

              {/* Button */}
              <button style={{ 
                width: "100%", 
                padding: "14px 24px", 
                borderRadius: 10, 
                background: isPro ? "#0284c7" : "#fff", 
                color: isPro ? "#fff" : "#0f172a", 
                border: isPro ? "none" : "2px solid #e2e8f0", 
                fontWeight: 600, 
                fontSize: 14, 
                cursor: "pointer", 
                transition: "all 0.2s",
                marginBottom: 32,
                boxShadow: isPro ? "0 4px 14px rgba(2, 132, 199, 0.3)" : "none"
              }}>
                {p.buttonName || "Get Started"}
              </button>

              {/* View/Edit Buttons for Admin */}
              {(onViewPackage || onEditPackage) && (
                <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                  {onViewPackage && (
                    <button
                      onClick={() => onViewPackage(p)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: "#f1f5f9",
                        border: "1.5px solid #e2e8f0",
                        color: "#475569",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer"
                      }}
                    >
                      View
                    </button>
                  )}
                  {onEditPackage && (
                    <button
                      onClick={() => onEditPackage(p)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: "#0284c7",
                        border: "none",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer"
                      }}
                    >
                      Edit
                    </button>
                  )}
                </div>
              )}

              {/* Features */}
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: "#0f172a", 
                  marginBottom: 16 
                }}>
                  {p.featuresTitle || "Features:"}
                </div>
                <ul style={{ 
                  margin: 0, 
                  padding: 0, 
                  listStyle: "none", 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: 12 
                }}>
                  {(p.features || []).map((f, i) => (
                    <li key={i} style={{ 
                      fontSize: 13, 
                      color: "#475569", 
                      display: "flex", 
                      alignItems: "flex-start", 
                      gap: 10,
                      lineHeight: 1.4
                    }}>
                      <span style={{ 
                        color: "#0ea5e9", 
                        fontWeight: 700, 
                        fontSize: 12,
                        marginTop: 1
                      }}>•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// VENDORS PAGE
// ═══════════════════════════════════════════════════════════
function VendorsPage({ vendors, setVendors }) {
  const [search, setSearch] = useState("");
  const [viewVendor, setViewVendor] = useState(null);
  const [editVendor, setEditVendor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErr, setEditErr] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const filtered = vendors.filter(v =>
    (v.vendorName || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.vendorProduct || "").toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (v) => {
    setEditForm({
      vendorName: v.vendorName || "",
      vendorProduct: v.vendorProduct || "",
      amountTaxGst: v.amountTaxGst || "",
      date: v.date ? new Date(v.date).toISOString().split('T')[0] : "",
      paidAmount: v.paidAmount || "",
      productDescription: v.productDescription || "",
      dateOfPurchase: v.dateOfPurchase ? new Date(v.dateOfPurchase).toISOString().split('T')[0] : "",
      modeOfPayment: v.modeOfPayment || "Cash",
    });
    setEditErr({});
    setEditVendor(v);
  };

  const saveEdit = async () => {
    const errs = {};
    if (!editForm.vendorName?.trim?.()) errs.vendorName = "Name required";
    if (!editForm.vendorProduct?.trim?.()) errs.vendorProduct = "Product required";
    if (!editForm.amountTaxGst || editForm.amountTaxGst <= 0) errs.amountTaxGst = "Required";
    if (!editForm.paidAmount || editForm.paidAmount <= 0) errs.paidAmount = "Required";
    if (Object.keys(errs).length) { setEditErr(errs); return; }
    try {
      setSaving(true);
      const payload = { ...editForm };
      if (!payload.date) delete payload.date;
      if (!payload.dateOfPurchase) delete payload.dateOfPurchase;
      const res = await axios.put(`${BASE_URL}/api/vendors/${editVendor._id}`, payload);
      setVendors(prev => prev.map(v => v._id === editVendor._id ? { ...v, ...res.data } : v));
      setEditVendor(null);
      showToast("✅ Vendor updated!");
    } catch (err) {
      showToast("❌ Update failed!");
    } finally { setSaving(false); }
  };

  const doDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/api/vendors/${deleteTarget._id}`);
      setVendors(prev => prev.filter(v => v._id !== deleteTarget._id));
      setDeleteTarget(null);
      showToast("🗑️ Vendor deleted!");
    } catch {
       showToast("❌ Delete failed!");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#fff", border: "1.5px solid #22c55e", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#22c55e", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>{toast}</div>}

      <SC title={`All Vendors (${filtered.length})`}>
        <Search value={search} onChange={setSearch} placeholder="Search by name, product..." />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 800 }}>
            <thead><tr style={{ background: "linear-gradient(90deg,#f5f3ff,#faf5ff)" }}>
              {["Vendor Name", "Product", "Required Amount", "Paid Amount", "Mode", "Purchase Date", "Actions"].map(c => (
                <th key={c} style={{ padding: "10px 14px", textAlign: "left", color: "#7c3aed", fontWeight: 700, fontSize: 11, borderBottom: "2px solid #ede9fe", whiteSpace: "nowrap" }}>{c.toUpperCase()}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: "#a78bfa" }}>No vendors found</td></tr>
                : filtered.map((v, i) => (
                  <tr key={v._id || i} style={{ borderBottom: "1px solid #f3f0ff" }} onMouseEnter={e => e.currentTarget.style.background = "#faf5ff"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: T.text }}>{v.vendorName}</td>
                    <td style={{ padding: "12px 14px", color: "#7c3aed" }}>{v.vendorProduct}</td>
                    <td style={{ padding: "12px 14px", color: "#6b7280" }}>₹{v.amountTaxGst}</td>
                    <td style={{ padding: "12px 14px", color: "#22C55E", fontWeight:600 }}>₹{v.paidAmount}</td>
                    <td style={{ padding: "12px 14px" }}><Badge label={v.modeOfPayment} /></td>
                    <td style={{ padding: "12px 14px", color: "#a78bfa" }}>{v.dateOfPurchase ? new Date(v.dateOfPurchase).toLocaleDateString() : "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                       <ActionBtns onView={() => setViewVendor(v)} onEdit={() => openEdit(v)} onDelete={() => setDeleteTarget(v)} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </SC>

      {/* View Modal */}
      {viewVendor && (
        <Mdl title="Vendor Details" onClose={() => setViewVendor(null)} maxWidth={500}>
           <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, background: "linear-gradient(135deg,#f5f3ff,#faf5ff)", borderRadius: 14, border: "1px solid #ede9fe", marginBottom: 18 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#9333ea,#c084fc)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 800, flexShrink: 0 }}>{(viewVendor.vendorName || "?")[0].toUpperCase()}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: T.text }}>{viewVendor.vendorName}</div>
              <div style={{ fontSize: 13, color: "#9333ea", marginTop: 2 }}>{viewVendor.vendorProduct}</div>
            </div>
          </div>
          <InfoRow icon="💰" label="Required Amount" value={`₹${viewVendor.amountTaxGst}`} />
          <InfoRow icon="💸" label="Paid Amount" value={`₹${viewVendor.paidAmount}`} />
          <InfoRow icon="💳" label="Mode of Payment" value={viewVendor.modeOfPayment} />
          <InfoRow icon="📅" label="Date of Purchase" value={viewVendor.dateOfPurchase ? new Date(viewVendor.dateOfPurchase).toLocaleDateString() : "—"} />
          <InfoRow icon="📝" label="Description" value={viewVendor.productDescription} />
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={() => { setViewVendor(null); openEdit(viewVendor); }} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#9333ea,#a855f7)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>✏️ Edit</button>
            <button onClick={() => { setViewVendor(null); setDeleteTarget(viewVendor); }} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#EF4444,#dc2626)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>🗑 Delete</button>
          </div>
        </Mdl>
      )}

      {/* Edit Modal */}
      {editVendor && (
        <Mdl title="Edit Vendor" onClose={() => setEditVendor(null)}>
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
            <Fld label="Vendor Name *" value={editForm.vendorName} onChange={v => setEditForm(p => ({ ...p, vendorName: v }))} error={editErr.vendorName} />
            <Fld label="Product Name *" value={editForm.vendorProduct} onChange={v => setEditForm(p => ({ ...p, vendorProduct: v }))} error={editErr.vendorProduct} />
            <Fld label="Required Amount *" value={editForm.amountTaxGst} type="number" onChange={v => setEditForm(p => ({ ...p, amountTaxGst: v }))} />
            <Fld label="Paid Amount *" value={editForm.paidAmount} type="number" onChange={v => setEditForm(p => ({ ...p, paidAmount: v }))} />
            <Fld label="Date of Purchase" value={editForm.dateOfPurchase} type="date" onChange={v => setEditForm(p => ({ ...p, dateOfPurchase: v }))} />
            <Fld label="Mode of Payment" value={editForm.modeOfPayment} onChange={v => setEditForm(p => ({ ...p, modeOfPayment: v }))} options={["Cash", "Bank Transfer", "UPI", "Cheque"]} />
          </div>
          <Fld label="Product Description" value={editForm.productDescription} onChange={v => setEditForm(p => ({ ...p, productDescription: v }))} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
            <button onClick={() => setEditVendor(null)} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>
            <button onClick={saveEdit} disabled={saving} style={{ background: "linear-gradient(135deg,#9333ea,#a855f7)", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </Mdl>
      )}

      {deleteTarget && <ConfirmModal title="Delete Vendor" message={`Are you sure you want to delete "${deleteTarget.vendorName}"?`} onConfirm={doDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════
export default function Dashboard({ setUser, user, fixedLogo }) {
  const [active, setActive] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [accountAuthOpen, setAccountAuthOpen] = useState(false);
  const [accountAuthTab, setAccountAuthTab] = useState("register");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companyLogo, setCompanyLogo] = useState(user?.logoUrl ? user.logoUrl : (fixedLogo || null));
  const [accounts, setAccounts] = useState([]);
  const headerLogoRef = useRef();
  
  useEffect(() => { setCompanyLogo(user?.logoUrl ? user.logoUrl : (fixedLogo || null)); }, [user, fixedLogo]);
  
  const handleHeaderLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onLogoChange?.(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Load saved accounts from localStorage
  useEffect(() => {
    try {
      const savedAccounts = JSON.parse(localStorage.getItem("accounts") || "[]");
      setAccounts(savedAccounts);
    } catch (e) { setAccounts([]); }
  }, [user]);

  // Switch to a different account
  const switchAccount = (account) => {
    localStorage.setItem("user", JSON.stringify(account));
    setUser(account);
    setProfileDropdownOpen(false);
    window.location.reload();
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!profileDropdownOpen) return;
    const onDown = (e) => {
      const t = e.target;
      if (t?.closest?.('[data-profile-anchor="true"]')) return;
      if (t?.closest?.('[data-profile-menu="true"]')) return;
      setProfileDropdownOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [profileDropdownOpen]);

  const [clients, setClients] = useState([]);
  const [nc, setNc] = useState({ name: "", company: "", email: "", phone: "", address: "", project: "", password: "", status: "Active", role: "client" });
  const [ncError, setNcError] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [showClientPass, setShowClientPass] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [ne, setNe] = useState({ name: "", email: "", phone: "", role: "employee", department: "", salary: "", status: "Active", password: "" });
  const [showEmpPass, setShowEmpPass] = useState(false);
  const [neError, setNeError] = useState({});
  const [empSaveLoading, setEmpSaveLoading] = useState(false);

  const [projects, setProjects] = useState([]);
  const [projLoading, setProjLoading] = useState(false);
  const [np, setNp] = useState({ name: "", client: "", purpose: "", description: "", start: "", end: "", budget: "", team: "", status: "Pending", assignedTo: [] });
  const [npError, setNpError] = useState({});
  const [projSaveLoading, setProjSaveLoading] = useState(false);

  const [managers, setManagers] = useState([]);
  const [nm, setNm] = useState({ managerName: "", email: "", phone: "", department: "", role: "Manager", address: "", password: "", status: "Active" });
  const [nmError, setNmError] = useState({});
  const [mgrSaveLoading, setMgrSaveLoading] = useState(false);
  const [showMgrPass, setShowMgrPass] = useState(false);

  const [subadmins, setSubadmins] = useState([]);
  const [ns, setNs] = useState({ name: "", email: "", phone: "", password: "", status: "Active", companyName: "", companyType: "IT", employeeCount: "0-10" });
  const [nsError, setNsError] = useState({});
  const [subSaveLoading, setSubSaveLoading] = useState(false);
  const [showSubPass, setShowSubPass] = useState(false);

  const [packages, setPackages] = useState([]);
  const [npkg, setNpkg] = useState({ title: "", description: "", icon: "📦", monthlyPrice: "", quarterlyPrice: "", halfYearlyPrice: "", annualPrice: "", buttonName: "Get Started", features: "", planDuration: "Monthly", businessLimit: "Single business manage", managerLimit: "1 Manager", clientLimit: "3 Client manage", type: "paid", price: "", noOfDays: "" });
  const [pkgError, setPkgError] = useState({});
  const [pkgSaveLoading, setPkgSaveLoading] = useState(false);

  // Package view/edit state
  const [viewPackage, setViewPackage] = useState(null);
  const [editPackage, setEditPackage] = useState(null);
  const [editPkgForm, setEditPkgForm] = useState({});

  const [quotations, setQuotations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [subLoading, setSubLoading] = useState(true);

  const [nv, setNv] = useState({ vendorName: "", vendorProduct: "", amountTaxGst: "", date: "", paidAmount: "", productDescription: "", dateOfPurchase: "", modeOfPayment: "Cash" });
  const [nvError, setNvError] = useState({});
  const [vendorSaveLoading, setVendorSaveLoading] = useState(false);

  const hasFetched = useRef(false);
  useEffect(() => { 
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchClients(); fetchEmployees(); fetchProjects(); fetchManagers(); fetchSubadmins(); fetchPackages(); fetchSubscription(); fetchQuotations(); fetchPaymentHistory(); fetchVendors(); 
  }, []);

  const fetchSubscription = async () => {
    try {
      setSubLoading(true);
      const id = user?._id || user?.id;
      if (!id) return;
      const res = await axios.get(`${BASE_URL}/api/subscriptions/current/${id}`);
      if (res.data.hasSubscription) {
        setSubscription(res.data.subscription);
      }
    } catch (err) {
      console.error("Subscription fetch failed", err);
    } finally {
      setSubLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const id = user?._id || user?.id;
      if (!id) return;
      const res = await axios.get(`${BASE_URL}/api/subscriptions/payments/${id}`);
      setPaymentHistory(res.data || []);
    } catch (err) {
      console.error("Payment history fetch failed", err);
    }
  };

  const getSubStatus = () => {
    if (!subscription) return { blocked: true, alert: false, status: "none" };
    
    const end = new Date(subscription.endDate);
    const now = new Date();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    const isExpired = subscription.status === "expired" || diffDays <= 0;
    
    // If status is hidden or explicitly expired, or it's past the end date
    if (subscription.status === "hidden" || isExpired) {
      return { blocked: true, alert: false, status: subscription.status, days: diffDays };
    }
    
    // 10 days before renewal -> plz renew your...
    if (diffDays <= 10 && diffDays > 0) {
      return { blocked: false, alert: true, days: diffDays, status: "active" };
    }
    
    return { blocked: false, alert: false, status: "active" };
  };

  const subStatus = getSubStatus();

  const handleLogout = () => { localStorage.removeItem("user"); setUser(null); };
  const handleAuthSetUser = (userData) => {
    setAccountAuthOpen(false);
    setProfileDropdownOpen(false);
    setShowProfile(false);
    setUser(userData);
  };
  const onLogoChange = async (logo) => { setCompanyLogo(logo || fixedLogo); const updatedUser = { ...user, logoUrl: logo || "" }; localStorage.setItem("user", JSON.stringify(updatedUser)); setUser(updatedUser); try { await axios.post(BASE_URL + "/api/auth/save-logo", { userId: user._id || user.id, logoUrl: logo || "" }); } catch (e) { console.log(e); } };

  const fetchClients = async () => { try { const res = await axios.get(BASE_URL + "/api/clients"); setClients(res.data); } catch (e) { console.log(e); } };
  const fetchEmployees = async () => { try { const res = await axios.get(BASE_URL + "/api/employees"); setEmployees(res.data); } catch (e) { console.log(e); } };
  const fetchProjects = async () => { try { const res = await axios.get(BASE_URL + "/api/projects"); setProjects(res.data); } catch (e) { console.log(e); } };
  const fetchManagers = async () => { try { const res = await axios.get(BASE_URL + "/api/managers"); setManagers(res.data); } catch (e) { console.log(e); } };
  const fetchSubadmins = async () => { try { const res = await axios.get(BASE_URL + "/api/subadmins"); setSubadmins(res.data); } catch (e) { console.log(e); } };
  const fetchPackages = async () => { 
    try { 
      // Get packages assigned to this subadmin
      const subadminId = user?._id || user?.id;
      if (subadminId) {
        const res = await axios.get(`${BASE_URL}/api/packages/subadmin/${subadminId}`);
        setPackages(res.data);
      } else {
        // Fallback to all packages if no subadmin ID
        const res = await axios.get(BASE_URL + "/api/packages");
        setPackages(res.data);
      }
    } catch (e) { 
      console.log(e); 
    } 
  };

  // Re-fetch packages when navigating to Packages tab to show admin-added packages
  useEffect(() => {
    if (active === "packages") {
      fetchPackages();
    }
  }, [active]);

  // Package view/edit handlers
const handleViewPackage = (pkg) => {
setViewPackage(pkg);
};

const handleEditPackage = (pkg) => {
    setEditPackage(pkg);
    setEditPkgForm({
      title: pkg.title || "",
      description: pkg.description || "",
      icon: pkg.icon || "📦",
      type: pkg.type || "paid",
      price: pkg.price || "",
      noOfDays: pkg.no_of_days || pkg.noOfDays || "",
      planDuration: pkg.planDuration || "Monthly",
      businessLimit: pkg.businessLimit || "Single business manage",
      managerLimit: pkg.managerLimit || "1 Manager",
      clientLimit: pkg.clientLimit || "3 Client manage",
      status: pkg.status || "Active"
    });
  };
  const savePackageEdit = async () => {
    if (!editPackage) return;
    try {
      setPkgSaveLoading(true);
      const packageData = {
        title: editPkgForm.title,
        description: editPkgForm.description,
        icon: editPkgForm.icon,
        type: editPkgForm.type,
        price: parseFloat(editPkgForm.price) || 0,
        no_of_days: parseInt(editPkgForm.noOfDays) || 30,
        planDuration: editPkgForm.planDuration,
        businessLimit: editPkgForm.businessLimit,
        managerLimit: editPkgForm.managerLimit,
        clientLimit: editPkgForm.clientLimit,
        status: editPkgForm.status,
        monthlyPrice: editPkgForm.type === "free" ? "Free" : editPkgForm.price,
        quarterlyPrice: editPkgForm.type === "free" ? "Free" : Math.round((parseFloat(editPkgForm.price) || 0) * 3 * 0.9).toString(),
        halfYearlyPrice: editPkgForm.type === "free" ? "Free" : Math.round((parseFloat(editPkgForm.price) || 0) * 6 * 0.85).toString(),
        annualPrice: editPkgForm.type === "free" ? "Free" : Math.round((parseFloat(editPkgForm.price) || 0) * 12 * 0.8).toString(),
        features: `${editPkgForm.planDuration} Plan\n${editPkgForm.businessLimit}\n${editPkgForm.managerLimit}\n${editPkgForm.clientLimit}`
      };
      const res = await axios.put(`${BASE_URL}/api/packages/${editPackage._id}`, packageData);
      setPackages(prev => prev.map(p => p._id === editPackage._id ? res.data : p));
      setEditPackage(null);
      toast.success("Package updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update package");
    } finally {
      setPkgSaveLoading(false);
    }
  };

  const fetchQuotations = async () => { try { const res = await axios.get(BASE_URL + "/api/quotations"); setQuotations(res.data); } catch (e) { console.log(e); } };
  const fetchVendors = async () => { 
    try { 
      console.log('Fetching vendors from:', BASE_URL + "/api/vendors");
      const res = await axios.get(BASE_URL + "/api/vendors"); 
      console.log('Vendors response:', res.data);
      setVendors(res.data || []); 
    } catch (e) { 
      console.error('Fetch vendors error:', e); 
      console.error('Error status:', e.response?.status);
      console.error('Error data:', e.response?.data);
      setVendors([]); // Set empty array on error to prevent crashes
    } 
  };

  const createNew = () => {
    window.location.href = "/project-proposal?new=true";
  };

  const addClient = async () => { const errors = {}; if (!nc.name.trim()) errors.name = "Name is required"; if (!nc.email.trim()) errors.email = "Email is required"; else if (!nc.email.endsWith("@gmail.com")) errors.email = "Only @gmail.com allowed"; if (!nc.password.trim()) errors.password = "Password is required"; if (Object.keys(errors).length > 0) { setNcError(errors); return; } try { setSaveLoading(true); const payload = { clientName: nc.name, companyName: nc.company, email: nc.email, phone: nc.phone, address: nc.address, password: nc.password, status: nc.status, role: nc.role || "client" }; const res = await axios.post(BASE_URL + "/api/clients/add", payload); setClients(prev => [res.data.client, ...prev]); setNc({ name: "", company: "", email: "", phone: "", address: "", project: "", password: "", status: "Active", role: "client" }); setNcError({}); setModal(null); } catch (err) { setNcError({ email: err.response?.data?.message || err.response?.data?.msg || "Failed to save" }); } finally { setSaveLoading(false); } };

  const addEmployee = async () => {
    const errors = {}; if (!ne.name.trim()) errors.name = "Name is required"; if (!ne.email.trim()) errors.email = "Email is required"; if (!ne.password.trim()) errors.password = "Password is required"; if (Object.keys(errors).length > 0) { setNeError(errors); return; } try { setEmpSaveLoading(true); const payload = { ...ne, role: ne.role || "employee" }; const res = await axios.post(BASE_URL + "/api/employees/add", payload); setEmployees(prev => [res.data.employee, ...prev]); setNe({ name: "", email: "", phone: "", role: "employee", department: "", salary: "", status: "Active", password: "" }); setShowEmpPass(false); setNeError({}); setModal(null); } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.msg || "Failed to save";
      const isPasswordError = errMsg.toLowerCase().includes("password");
      setNeError(isPasswordError ? { password: errMsg } : { email: errMsg });
    } finally { setEmpSaveLoading(false); }
  };

  const addProject = async () => {
    const errors = {};
    if (!np.name.trim()) errors.name = "Project name is required";
    if (!np.client.trim()) errors.client = "Client is required";
    if (Object.keys(errors).length > 0) {
      setNpError(errors);
      return;
    }
    try {
      setProjSaveLoading(true);
      console.log("Sending project data:", np);
      const res = await axios.post(BASE_URL + "/api/projects/add", np);
      console.log("Project created:", res.data);
      await fetchProjects();
      setNp({ name: "", client: "", purpose: "", description: "", start: "", end: "", budget: "", team: "", status: "Pending", assignedTo: [] });
      setNpError({});
      setModal(null);
      toast.success("✅ Project created successfully!");
    } catch (err) {
      console.error("Add project error:", err.response?.data);
      const errorMsg = err.response?.data?.msg || err.response?.data?.error || "Failed to save project";
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        setNpError({ name: err.response.data.errors.join(", ") });
      } else {
        setNpError({ name: errorMsg });
      }
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setProjSaveLoading(false);
    }
  };

  const addManager = async () => { const errors = {}; if (!nm.managerName.trim()) errors.managerName = "Name is required"; if (!nm.email.trim()) errors.email = "Email is required"; if (!nm.password.trim()) errors.password = "Password is required"; if (Object.keys(errors).length > 0) { setNmError(errors); return; } try { setMgrSaveLoading(true); const res = await axios.post(BASE_URL + "/api/managers/add", nm); setManagers(prev => [res.data.manager, ...prev]); setNm({ managerName: "", email: "", phone: "", department: "", role: "Manager", address: "", password: "", status: "Active" }); setNmError({}); setModal(null); } catch (err) { setNmError({ email: err.response?.data?.message || err.response?.data?.msg || "Failed to save" }); } finally { setMgrSaveLoading(false); } };

  const addSubadmin = async () => {
    const errors = {};
    if (!ns.name.trim()) errors.name = "Name is required";
    if (!ns.email.trim()) errors.email = "Email is required";
    if (!ns.password.trim()) errors.password = "Password is required";
    if (Object.keys(errors).length > 0) { setNsError(errors); return; }
    try {
      setSubSaveLoading(true);
      const res = await axios.post(BASE_URL + "/api/subadmins", ns);
      setSubadmins(prev => [res.data.subadmin, ...prev]);
      setNs({ name: "", email: "", phone: "", password: "", status: "Active", companyName: "", companyType: "IT", employeeCount: "0-10" });
      setNsError({});
      setModal(null);
    } catch (err) {
      setNsError({ email: err.response?.data?.message || err.response?.data?.msg || "Failed to save" });
    } finally {
      setSubSaveLoading(false);
    }
  };

  const addPackage = async () => {
    const errors = {};
    if (!npkg.title.trim()) errors.title = "Title is required";
    if (!npkg.description.trim()) errors.description = "Description is required";
    if (Object.keys(errors).length > 0) { setPkgError(errors); return; }
    try {
      setPkgSaveLoading(true);
      
      // Format data for backend API
      const packageData = {
        title: npkg.title,
        description: npkg.description,
        icon: npkg.icon || "📦",
        type: npkg.type || "paid",
        no_of_days: parseInt(npkg.noOfDays) || 30,
        price: parseFloat(npkg.price) || 0,
        monthlyPrice: npkg.monthlyPrice || "0",
        quarterlyPrice: npkg.quarterlyPrice || "0",
        halfYearlyPrice: npkg.halfYearlyPrice || "0",
        annualPrice: npkg.annualPrice || "0",
        buttonName: npkg.buttonName || "Get Started",
        features: npkg.features ? npkg.features.split(',').map(f => f.trim()).filter(f => f) : [],
        planDuration: npkg.planDuration || "Monthly",
        businessLimit: npkg.businessLimit || "Single business manage",
        managerLimit: npkg.managerLimit || "1 Manager",
        clientLimit: npkg.clientLimit || "3 Client manage",
        status: "Active",
        targetRole: "subadmin",
        assignedSubadmins: [] // Subadmin creates package for themselves
      };
      
      const res = await axios.post(BASE_URL + "/api/packages", packageData);
      setPackages(prev => [...prev, res.data]);
      setNpkg({ title: "", description: "", icon: "📦", monthlyPrice: "", quarterlyPrice: "", halfYearlyPrice: "", annualPrice: "", buttonName: "Get Started", features: "", planDuration: "Monthly", businessLimit: "Single business manage", managerLimit: "1 Manager", clientLimit: "3 Client manage", type: "paid", price: "", noOfDays: "" });
      setPkgError({});
      setModal(null);
      toast.success("✅ Package added!");
    } catch (err) {
      console.error("Add package error:", err);
      toast.error("❌ Failed to add package: " + (err.response?.data?.msg || err.message));
    } finally { setPkgSaveLoading(false); }
  };

  const addVendor = async () => {
    const errors = {};
    if (!nv.vendorName?.trim?.()) errors.vendorName = "Vendor Name is required";
    if (!nv.vendorProduct?.trim?.()) errors.vendorProduct = "Product Name is required";
    if (!nv.amountTaxGst || nv.amountTaxGst <= 0) errors.amountTaxGst = "Required";
    if (!nv.paidAmount || nv.paidAmount <= 0) errors.paidAmount = "Required";
    if (Object.keys(errors).length > 0) { setNvError(errors); return; }
    try {
      setVendorSaveLoading(true);
      const resolvedCompanyId = user?.companyId || user?.company || user?._id || user?.id || "default";
      const amt = parseFloat(nv.amountTaxGst) || 0;
      const payload = {
        vendorName: nv.vendorName,
        vendorProduct: nv.vendorProduct,
        amount: amt,
        tax: amt,
        gst: amt,
        paidAmount: parseFloat(nv.paidAmount) || 0,
        productDescription: nv.productDescription,
        modeOfPayment: nv.modeOfPayment,
        companyId: resolvedCompanyId
      };
      if (nv.date) payload.date = nv.date;
      if (nv.dateOfPurchase) payload.dateOfPurchase = nv.dateOfPurchase;
      const res = await axios.post(BASE_URL + "/api/vendors", payload);
      setVendors(prev => [res.data, ...prev]);
      setNv({ vendorName: "", vendorProduct: "", amountTaxGst: "", date: "", paidAmount: "", productDescription: "", dateOfPurchase: "", modeOfPayment: "Cash" });
      setNvError({});
      setModal(null);
      toast.success("✅ Vendor Added Successfully!");
    } catch (err) {
      console.error('Add vendor error:', err);
      toast.error("❌ Failed to add vendor: " + (err.response?.data?.message || err.message));
    } finally { setVendorSaveLoading(false); }
  };


  // ── Subscription gate: subadmins must subscribe before accessing dashboard ──
  const roleLower = (user?.role || "").toLowerCase().trim();
  const isSubAdmin = roleLower === "subadmin" || roleLower === "sub_admin" || roleLower === "sub-admin";
  const isAdmin = user?.email === "admin@gmail.com";

  // Enforce subscription page when:
  // (a) subadmin and still loading subscription data (prevent flash)
  // (b) subadmin and no active subscription (blocked)
  let enforceMySubscriptions = false;
  if (!isAdmin && isSubAdmin) {
    if (subLoading || (!subLoading && subStatus.blocked)) {
      enforceMySubscriptions = true;
    }
  }

  const rawNavItems = getNavForRole(user?.role);
  // When restricted, ONLY show My Subscriptions (no dashboard — must subscribe first)
  const navItems = enforceMySubscriptions
    ? rawNavItems.filter(n => ["mysubscriptions"].includes(n.key))
    : rawNavItems;

  // Always land on mysubscriptions when enforced — never show dashboard
  const validActive = enforceMySubscriptions
    ? "mysubscriptions"
    : (navItems.find(n => n.key === active) ? active : navItems[0]?.key || "dashboard");

  const page = navItems.find(n => n.key === validActive) || navItems[0];

  useEffect(() => { if (!enforceMySubscriptions && validActive !== active) setActive(validActive); }, [user?.role, enforceMySubscriptions, validActive]);

  const displayName = user?.name || user?.email?.split("@")[0] || "Admin";
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const B = (color) => ({ background: `linear-gradient(135deg,${color},${color}cc)`, color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" });

  const companyId = user?.companyId || user?.company || user?._id || user?.id || "default";
  const companyNameStr = user?.companyName || user?.name || "";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg,#f5f3ff 0%,#faf5ff 50%,#f3e8ff 100%)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:#d8b4fe;border-radius:3px}
        button,input,select,textarea{font-family:inherit}
        @media(min-width:769px){.sidebar{transform:translateX(0)!important;position:sticky!important;top:0!important;}.sidebar-close{display:none!important;}.mob-overlay{display:none!important;}.mob-topbar{display:none!important;}.sidebar-spacer{display:none!important;}}
        @media(max-width:768px){.sidebar-spacer{display:none!important;}.mob-topbar-hide{display:none!important;}.main-content{padding:12px!important;}.dash-stats{grid-template-columns:repeat(2,1fr)!important;gap:10px!important;}.dash-2col{grid-template-columns:1fr!important;}.modal-2col{grid-template-columns:1fr!important;}.page-header{flex-wrap:wrap;gap:8px;}.header-actions{flex-wrap:wrap;gap:8px;}}
      `}</style>

      <Sidebar user={user} active={validActive} setActive={setActive} onLogout={handleLogout} open={sidebarOpen} onClose={() => setSidebarOpen(false)} navItems={navItems} companyLogo={companyLogo} onLogoChange={onLogoChange} />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Mobile Topbar */}
        <div className="mob-topbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#fff", borderBottom: "1px solid #ede9fe", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 8px rgba(147,51,234,0.07)" }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#7c3aed", padding: "2px 6px", lineHeight: 1 }}>☰</button>
          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontWeight: 800, fontSize: 15, color: T.text }}>
            {page?.label}
          </div>
          {user?.email !== "admin@gmail.com" && (
            <>
              <input type="file" ref={headerLogoRef} onChange={handleHeaderLogoUpload} accept="image/*" style={{ display: "none" }} />
              <div data-profile-anchor="true" onClick={(e) => { e.stopPropagation(); setProfileDropdownOpen(v => !v); setShowProfile(false); }} style={{ width: 34, height: 34, background: "linear-gradient(135deg,#9333ea,#c084fc)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", overflow: "hidden", position: "relative" }}>
                <div onClick={(e) => { e.stopPropagation(); headerLogoRef.current?.click(); }} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }} title="Click to upload logo">
                  {companyLogo ? <img src={companyLogo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 3, background: "#fff" }} /> : <span>{initials}</span>}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="main-content" style={{ flex: 1, padding: "22px 24px", overflowY: "auto" }}>
          {/* Page Header */}
          <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text }}>{page?.icon} {page?.label}</h1>
              <p style={{ margin: "3px 0 0", color: "#a78bfa", fontSize: 12 }}>Management Suite · {user?.role || "Admin"}</p>
            </div>
            <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              {validActive === "clients" && <button onClick={() => { setNcError({}); setShowClientPass(false); setModal("client"); }} style={B("#9333ea")}>+ Add Client</button>}
              {validActive === "employees" && <button onClick={() => { setNeError({}); setModal("employee"); }} style={B("#7c3aed")}>+ Add Employee</button>}
              {validActive === "projects" && (
                <>
                  <button onClick={() => { setNpError({}); setModal("project"); }} style={B("#a855f7")}>+ New Project</button>
                </>
              )}

              {validActive === "managers" && <button onClick={() => { setNmError({}); setShowMgrPass(false); setModal("manager"); }} style={B("#f59e0b")}>+ Add Manager</button>}
              {validActive === "subadmins" && <button onClick={() => { setNsError({}); setShowSubPass(false); setModal("subadmin"); }} style={B("#3b82f6")}>+ Add Subadmin</button>}

              {validActive === "vendors" && <button onClick={() => { setNvError({}); setModal("vendor_add"); }} style={B("#9333ea")}>+ Add Vendor</button>}

              {user?.email !== "admin@gmail.com" && (
                <div data-profile-anchor="true" onClick={(e) => { e.stopPropagation(); setProfileDropdownOpen(v => !v); setShowProfile(false); }} className="mob-topbar-hide" style={{ background: "#fff", border: "1.5px solid #ede9fe", borderRadius: 12, padding: "6px 12px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", boxShadow: "0 2px 10px rgba(147,51,234,0.08)", flexShrink: 0 }}>
                  <div onClick={(e) => { e.stopPropagation(); headerLogoRef.current?.click(); }} style={{ width: 30, height: 30, background: companyLogo ? "#fff" : "linear-gradient(135deg,#9333ea,#c084fc)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12, overflow: "hidden", flexShrink: 0, cursor: "pointer" }} title="Click to upload logo">
                    {companyLogo ? <img src={companyLogo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 3, background: "#fff" }} onError={() => setCompanyLogo(null)} /> : <span>{initials}</span>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</span>
                  <span style={{ fontSize: 10, color: "#a78bfa" }}>▾</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Dashboard ── */}
          {validActive === "dashboard" && <>
            {/* Subscription Status Alert (Blocking) */}
            {subStatus.blocked && (
              <div style={{ 
                background: "linear-gradient(135deg,#fee2e2,#fecaca)", 
                border: "2px solid #ef4444", 
                borderRadius: 16, 
                padding: "24px", 
                marginBottom: 24, 
                display: "flex", 
                flexDirection: "column",
                alignItems: "center", 
                textAlign: "center",
                gap: 16,
                boxShadow: "0 10px 30px rgba(239,68,68,0.15)"
              }}>
                <div style={{ fontSize: 48 }}>🚫</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#991b1b", marginBottom: 8 }}>
                    Subscription Expired
                  </div>
                  <div style={{ fontSize: 14, color: "#7f1d1d", maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
                    Your access to premium features has been restricted because your subscription is no longer active. 
                    Please renew your plan to unlock all management tools and continue your business operations.
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button 
                    onClick={() => setActive("mysubscriptions")}
                    style={{
                      background: "linear-gradient(135deg,#ef4444,#dc2626)",
                      border: "none",
                      borderRadius: 10,
                      padding: "12px 24px",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#fff",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      boxShadow: "0 4px 12px rgba(239,68,68,0.3)"
                    }}
                  >
                    🚀 Renew Subscription
                  </button>
                  <button 
                    onClick={() => window.open("mailto:support@mbusiness.com")}
                    style={{
                      background: "#fff",
                      border: "1.5px solid #ef4444",
                      borderRadius: 10,
                      padding: "12px 24px",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#ef4444",
                      cursor: "pointer",
                      fontFamily: "inherit"
                    }}
                  >
                    📞 Contact Support
                  </button>
                </div>
              </div>
            )}

            {/* Subscription Status Alert (Warning only) */}
            {subStatus.alert && !subStatus.blocked && (
              <div style={{ 
                background: "linear-gradient(135deg,#fef3c7,#fde68a)", 
                border: "2px solid #f59e0b", 
                borderRadius: 12, 
                padding: "16px 20px", 
                marginBottom: 18, 
                display: "flex", 
                alignItems: "center", 
                gap: 12 
              }}>
                <div style={{ fontSize: 24 }}>⚠️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>
                    Subscription Renewal Required
                  </div>
                  <div style={{ fontSize: 13, color: "#78350f" }}>
                    Your {subscription?.planName} subscription expires in {subStatus.days} days. Please renew soon.
                  </div>
                </div>
                <button 
                  onClick={() => setActive("mysubscriptions")}
                  style={{
                    background: "linear-gradient(135deg,#f59e0b,#d97706)",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#fff",
                    cursor: "pointer",
                    fontFamily: "inherit"
                  }}
                >
                  Renew Now
                </button>
              </div>
            )}

            {/* Company Info & Subscription Card */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              <SC title="Company Information">
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, background: "linear-gradient(135deg,#f5f3ff,#faf5ff)", borderRadius: 14, border: "1px solid #ede9fe" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: companyLogo ? "#fff" : "linear-gradient(135deg,#9333ea,#c084fc)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 800, flexShrink: 0, overflow: "hidden", border: companyLogo ? "2px solid #ede9fe" : "none" }}>
                    {companyLogo ? <img src={companyLogo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 3 }} /> : initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: T.text, marginBottom: 2 }}>
                      {user?.name || "Admin"}
                    </div>
                    <div style={{ fontSize: 12, color: "#7c3aed" }}>
                      {user?.role || "Sub Admin"} Account
                    </div>
                  </div>
                </div>
                <InfoRow icon="📧" label="Email" value={user?.email} />
                <InfoRow icon="📱" label="Phone" value={user?.phone} />
              </SC>

              <SC title="Current Subscription">
                {subLoading ? (
                  <div style={{ textAlign: "center", padding: 40, color: "#a78bfa" }}>Loading subscription...</div>
                ) : subscription ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", borderRadius: 14, border: "1px solid #bbf7d0", marginBottom: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#22c55e,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 800, flexShrink: 0 }}>
                        💳
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#166534", marginBottom: 2 }}>
                          {subscription.planName} Plan
                        </div>
                        <div style={{ fontSize: 13, color: "#15803d", fontWeight: 600 }}>
                          ₹{subscription.planPrice?.toLocaleString() || "0"}/{subscription.billingCycle}
                        </div>
                      </div>
                      <Badge label={subscription.status === "active" ? "Fully Paid" : "Pending"} />
                    </div>
                    <InfoRow icon="📅" label="Start Date" value={new Date(subscription.startDate).toLocaleDateString()} />
                    <InfoRow icon="⏰" label="End Date" value={new Date(subscription.endDate).toLocaleDateString()} />
                    <InfoRow icon="🔄" label="Next Billing" value={new Date(subscription.nextBillingDate).toLocaleDateString()} />
                    <InfoRow icon="✅" label="Payment Status" value={subscription.isFullyPaid ? "Fully Paid" : "Pending"} />
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: 40, color: "#a78bfa" }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>💳</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No Active Subscription</div>
                    <div style={{ fontSize: 12, color: "#7c3aed", marginBottom: 12 }}>Choose a plan to get started</div>
                    <button 
                      onClick={() => setActive("packages")}
                      style={{
                        background: "linear-gradient(135deg,#9333ea,#a855f7)",
                        border: "none",
                        borderRadius: 8,
                        padding: "8px 16px",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#fff",
                        cursor: "pointer",
                        fontFamily: "inherit"
                      }}
                    >
                      View Plans
                    </button>
                  </div>
                )}
              </SC>
            </div>

            <div className="dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 18 }}>
              {[{ t: "Total Clients", v: clients.length, i: "👥", c: "#9333ea" }, { t: "Employees", v: employees.length, i: "👨‍💼", c: "#7c3aed" }, { t: "Managers", v: managers.length, i: "🧑‍💼", c: "#f59e0b" }, { t: "Projects", v: projects.length, i: "📁", c: "#a855f7" }, { t: "Invoices", v: INVOICES.length, i: "🧾", c: "#22C55E" }].map(({ t, v, i, c }) => (
                <div key={t} style={{ background: "#fff", borderRadius: 14, padding: "16px 14px", boxShadow: "0 4px 18px rgba(147,51,234,0.07)", border: "1px solid #ede9fe", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: -12, right: -12, width: 60, height: 60, borderRadius: "50%", background: `radial-gradient(circle,${c}22,transparent)` }} />
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${c}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, marginBottom: 8 }}>{i}</div>
                  <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 }}>{t.toUpperCase()}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="dash-2col" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
              <SC title="Recent Projects"><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 300 }}><thead><tr style={{ background: "#faf5ff" }}>{["Project", "Client", "Status"].map(c => <th key={c} style={{ padding: "8px 10px", textAlign: "left", color: "#a78bfa", fontWeight: 700, fontSize: 11, borderBottom: "2px solid #ede9fe" }}>{c.toUpperCase()}</th>)}</tr></thead><tbody>{projects.slice(0, 5).map((p, i) => <tr key={i} style={{ borderBottom: "1px solid #f5f3ff" }}><td style={{ padding: "9px 10px", fontWeight: 600, color: T.text }}>{p.name}</td><td style={{ padding: "9px 10px", color: "#a78bfa" }}>{p.client}</td><td style={{ padding: "9px 10px" }}><Badge label={p.status} /></td></tr>)}</tbody></table></div></SC>
              <SC title="Payment History">
                {paymentHistory.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 30, color: "#a78bfa" }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>💳</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>No payment history</div>
                  </div>
                ) : (
                  <div style={{ maxHeight: 200, overflowY: "auto" }}>
                    {paymentHistory.slice(0, 5).map((payment, i) => (
                      <div key={i} style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        padding: "8px 0", 
                        borderBottom: i < 4 ? "1px solid #f5f3ff" : "none" 
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 2 }}>
                            {payment.description || payment.type}
                          </div>
                          <div style={{ fontSize: 11, color: "#a78bfa" }}>
                            {payment.invoiceNo && `INV: ${payment.invoiceNo}`}
                            {payment.quotationNo && ` • QUO: ${payment.quotationNo}`}
                          </div>
                          <div style={{ fontSize: 10, color: "#a78bfa" }}>
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#22c55e" }}>
                            ₹{payment.amount?.toLocaleString() || "0"}
                          </div>
                          <Badge label={payment.status || "completed"} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SC>
            </div>
            <div className="dash-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <SC title="Project Progress">{TRACKING_SEED.map(t => (<div key={t.id} style={{ marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{t.name}</span><span style={{ fontSize: 12, fontWeight: 700, color: sc(t.status) }}>{t.pct}%</span></div><div style={{ background: "#ede9fe", borderRadius: 6, height: 6 }}><div style={{ width: `${t.pct}%`, background: t.pct === 100 ? "linear-gradient(90deg,#22C55E,#4ade80)" : "linear-gradient(90deg,#9333ea,#c084fc)", borderRadius: 6, height: "100%" }} /></div><div style={{ fontSize: 11, color: "#a78bfa", marginTop: 2 }}>{t.client}</div></div>))}</SC>
              <SC title="Invoice Status">{INVOICES.map(inv => (<div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f5f3ff" }}><div><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{inv.id} · {inv.client}</div><div style={{ fontSize: 11, color: "#a78bfa" }}>Due: {inv.due}</div></div><div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 3 }}>{inv.total}</div><Badge label={inv.status} /></div></div>))}</SC>
            </div>
          </>}

          {/* ── Pages using new components ── */}
          {validActive === "clients" && <ClientsPage clients={clients} setClients={setClients} onAddClient={() => { setNcError({}); setShowClientPass(false); setModal("client"); }} />}
          {validActive === "employees" && <EmployeesPage employees={employees} setEmployees={setEmployees} />}
          {validActive === "managers" && <ManagersPage managers={managers} setManagers={setManagers} />}
          {validActive === "projects" && <ProjectsPage projects={projects} setProjects={setProjects} clients={clients} employees={employees} />}
          {validActive === "subadmins" && <SubadminsPage subadmins={subadmins} setSubadmins={setSubadmins} employees={employees} managers={managers} quotations={quotations} />}

          {validActive === "invoices" && <InvoiceCreator clients={clients} projects={projects} companyLogo={companyLogo} onLogoChange={onLogoChange} />}
          {validActive === "quotations" && <QuotationCreator clients={clients} projects={projects} companyLogo={companyLogo} onLogoChange={onLogoChange} />}
          {validActive === "proposals" && <ProjectProposalCreator clients={clients} />}
          {validActive === "tracking" && <ProjectStatusPage clients={clients} employees={employees} managers={managers} />}
          {validActive === "tasks" && <TaskPage projects={projects} employees={employees} />}
          {validActive === "calendar" && <CalendarPage projects={projects} clients={clients} companyId={companyId} />}
          {validActive === "accounts" && <AccountsPage ExpensesPage={ExpensesPage} />}
          {validActive === "interviews" && <InterviewPage companyId={companyId} companyName={companyNameStr} />}
          {validActive === "documents" && <SubAdminDocumentsPage employees={employees} />}
          {validActive === "mysubscriptions" && <MySubscriptions user={user} onSubscriptionSuccess={fetchSubscription} />}
          {validActive === "reports" && <ReportsPage clients={clients} projects={projects} employees={employees} managers={managers} />}
          {validActive === "packages" && <PackagesPage packages={packages} onViewPackage={handleViewPackage} onEditPackage={(user?.role !== "subadmin" && user?.role !== "sub_admin" && user?.role !== "sub-admin") ? handleEditPackage : undefined} />}
          {validActive === "payments" && <AccountsPage ExpensesPage={ExpensesPage} />}
          {validActive === "vendors" && <VendorsPage vendors={vendors} setVendors={setVendors} />}
          {validActive === "rolePermissions" && <RolePermissionDashboard />}
        </div>
      </div>

      {profileDropdownOpen && (
        <div
          data-profile-menu="true"
          style={{
            position: "fixed",
            top: 72,
            right: 16,
            zIndex: 10050,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
            overflow: "hidden",
            minWidth: 220,
            maxWidth: 280,
          }}
        >
          {/* Current Account Header */}
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg,#f5f3ff,#faf5ff)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#9333ea,#c084fc)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14, overflow: "hidden" }}>
                {companyLogo ? <img src={companyLogo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 3, background: "#fff" }} /> : <span>{initials}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
                <div style={{ fontSize: 11, color: "#7c3aed", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
              </div>
              <span style={{ fontSize: 12 }}>✓</span>
            </div>
          </div>

          {/* Other Saved Accounts */}
          {accounts.length > 1 && (
            <div style={{ maxHeight: 180, overflowY: "auto" }}>
              {accounts.filter(a => a.email !== user?.email).map((account, idx) => {
                const accName = account?.name || account?.email?.split("@")[0] || "User";
                const accInitials = accName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <button
                    key={account.email || idx}
                    onClick={() => switchAccount(account)}
                    style={{
                      width: "100%",
                      background: "none",
                      border: "none",
                      padding: "10px 14px",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "inherit",
                      color: T.text,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      borderBottom: "1px solid #f8fafc",
                      textAlign: "left",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#faf5ff"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                      {account?.logoUrl ? <img src={account.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 2, background: "#fff" }} /> : <span>{accInitials}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{accName}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{account?.email}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Menu Options */}
          <div style={{ borderTop: "1px solid #f1f5f9" }}>
            <button
              onClick={() => {
                setProfileDropdownOpen(false);
                setShowProfile(true);
              }}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                padding: "10px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
                color: T.text,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#faf5ff"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: 14 }}>👤</span> Profile
            </button>
            <button
              onClick={() => {
                setProfileDropdownOpen(false);
                setAccountAuthTab("login");
                setAccountAuthOpen(true);
              }}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                padding: "10px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
                color: T.text,
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderTop: "1px solid #f8fafc",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#faf5ff"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: 14 }}>➕</span> Add account
            </button>
            <button
              onClick={() => {
                setProfileDropdownOpen(false);
                handleLogout();
              }}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                padding: "10px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderTop: "1px solid #f8fafc",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: 14 }}>🚪</span> Logout
            </button>
          </div>
        </div>
      )}

      {accountAuthOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10060 }}>
          <button
            onClick={() => setAccountAuthOpen(false)}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 10061,
              background: "rgba(255,255,255,0.22)",
              border: "1.5px solid rgba(255,255,255,0.35)",
              color: "#fff",
              borderRadius: 10,
              width: 36,
              height: 36,
              cursor: "pointer",
              fontWeight: 900,
              fontSize: 14,
            }}
          >
            ✕
          </button>
          <AuthPage setUser={handleAuthSetUser} initialTab={accountAuthTab} />
        </div>
      )}

      {showProfile && <ProfileModal user={user} setUser={setUser} onClose={() => setShowProfile(false)} onLogout={handleLogout} companyLogo={companyLogo} onLogoChange={onLogoChange} />}

      {/* ── Add Client Modal ── */}
      {modal === "client" && <Mdl title="Add New Client" onClose={() => setModal(null)}>
        <div className="modal-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
          <Fld label="Client Name *" value={nc.name} onChange={v => { setNc({ ...nc, name: v }); setNcError(p => ({ ...p, name: "" })); }} error={ncError.name} />
          <Fld label="Company Name" value={nc.company} onChange={v => setNc({ ...nc, company: v })} />
          <Fld label="Email" value={nc.email} onChange={v => { setNc({ ...nc, email: v }); setNcError(p => ({ ...p, email: "" })); }} type="email" error={ncError.email} />
          <Fld label="Phone Number" value={nc.phone} onChange={v => setNc({ ...nc, phone: v })} />
          <Fld label="Status" value={nc.status} onChange={v => setNc({ ...nc, status: v })} options={["Active", "Inactive"]} />
        </div>
        <Fld label="Address" value={nc.address} onChange={v => setNc({ ...nc, address: v })} />
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>PASSWORD *</label>
          <div style={{ position: "relative" }}>
            <input type={showClientPass ? "text" : "password"} value={nc.password} onChange={e => setNc({ ...nc, password: e.target.value })} style={{ width: "100%", border: `1.5px solid ${ncError.password ? "#EF4444" : "#ede9fe"}`, borderRadius: 10, padding: "10px 46px 10px 14px", fontSize: 13, color: T.text, background: "#faf5ff", boxSizing: "border-box", outline: "none" }} placeholder="Set client password" />
            <button type="button" onClick={() => setShowClientPass(!showClientPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#a78bfa", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>{showClientPass ? "HIDE" : "SHOW"}</button>
          </div>
          {ncError.password && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠️ {ncError.password}</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
          <button onClick={() => setModal(null)} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>
          <button onClick={addClient} disabled={saveLoading} style={{ ...B("#9333ea"), opacity: saveLoading ? 0.7 : 1 }}>{saveLoading ? "Saving..." : "Save Client →"}</button>
        </div>
      </Mdl>}

      {/* ── Add Employee Modal ── */}
      {modal === "employee" && <Mdl title="Add New Employee" onClose={() => setModal(null)}>
        <div className="modal-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
          <Fld label="Full Name *" value={ne.name} onChange={v => setNe({ ...ne, name: v })} error={neError.name} />
          <Fld label="Email *" value={ne.email} onChange={v => { setNe({ ...ne, email: v }); setNeError(p => ({ ...p, email: "" })); }} type="email" error={neError.email} />
          <Fld label="Phone Number" value={ne.phone} onChange={v => setNe({ ...ne, phone: v })} />
          <Fld label="Role / Position" value={ne.role} onChange={v => setNe({ ...ne, role: v })} />
          <Fld label="Department" value={ne.department} onChange={v => setNe({ ...ne, department: v })} />
          <Fld label="Salary" value={ne.salary} onChange={v => setNe({ ...ne, salary: v })} />
          <Fld label="Status" value={ne.status} onChange={v => setNe({ ...ne, status: v })} options={["Active", "Inactive"]} />
        </div>
        <div style={{ marginBottom: 14, marginTop: 4 }}>
          <label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>PASSWORD *</label>
          <div style={{ position: "relative" }}>
            <input type={showEmpPass ? "text" : "password"} value={ne.password} onChange={e => { setNe({ ...ne, password: e.target.value }); setNeError(p => ({ ...p, password: "" })); }} style={{ width: "100%", border: `1.5px solid ${neError.password ? "#EF4444" : "#ede9fe"}`, borderRadius: 10, padding: "10px 46px 10px 14px", fontSize: 13, color: T.text, background: "#faf5ff", boxSizing: "border-box", outline: "none" }} placeholder="Set employee login password" />
            <button type="button" onClick={() => setShowEmpPass(!showEmpPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#a78bfa", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>{showEmpPass ? "HIDE" : "SHOW"}</button>
          </div>
          {neError.password && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠️ {neError.password}</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
          <button onClick={() => setModal(null)} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>
          <button onClick={addEmployee} disabled={empSaveLoading} style={{ ...B("#7c3aed"), opacity: empSaveLoading ? 0.7 : 1 }}>{empSaveLoading ? "Saving..." : "Save Employee →"}</button>
        </div>
      </Mdl>}

      {/* ── Add Project Modal ── */}
      {modal === "project" && <Mdl title="Create New Project" onClose={() => setModal(null)}>
        <div className="modal-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
          <Fld label="Project Name *" value={np.name} onChange={v => setNp({ ...np, name: v })} error={npError.name} />
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>CLIENT NAME *</label>
            <ClientDropdown clients={clients} value={np.client} onChange={v => setNp({ ...np, client: v })} error={npError.client} onAddClient={() => { setModal("client"); setNcError({}); setShowClientPass(false); }} />
            {npError.client && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠️ {npError.client}</div>}
          </div>
          <Fld label="Purpose" value={np.purpose} onChange={v => setNp({ ...np, purpose: v })} />
          <Fld label="Budget" value={np.budget} onChange={v => setNp({ ...np, budget: v })} />
          <Fld label="Start Date" value={np.start} onChange={v => setNp({ ...np, start: v })} type="date" />
          <Fld label="End Date" value={np.end} onChange={v => setNp({ ...np, end: v })} type="date" />
          <Fld label="Team Members" value={np.team} onChange={v => setNp({ ...np, team: v })} />
          <Fld label="Status" value={np.status} onChange={v => setNp({ ...np, status: v })} options={["Pending", "In Progress", "Completed", "On Hold"]} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>ASSIGN EMPLOYEES <span style={{ fontSize: 10, color: "#a78bfa", fontWeight: 400 }}>(select multiple)</span></label>
          <div style={{ border: "1.5px solid #ede9fe", borderRadius: 10, padding: "12px", background: "#faf5ff", maxHeight: 200, overflowY: "auto" }}>
            {employees.length === 0 ? <div style={{ color: "#a78bfa", fontSize: 13, textAlign: "center", padding: "20px" }}>No employees available</div>
              : employees.map(e => (
                <div key={e._id || e.email} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f5f3ff" }}>
                  <input type="checkbox"
                    id={`emp-${e._id || e.email}`}
                    checked={np.assignedTo.includes(e.name)}
                    onChange={evt => {
                      if (evt.target.checked) {
                        setNp(prev => ({ ...prev, assignedTo: [...prev.assignedTo, e.name] }));
                      } else {
                        setNp(prev => ({ ...prev, assignedTo: prev.assignedTo.filter(n => n !== e.name) }));
                      }
                    }}
                    style={{ width: 16, height: 16, cursor: "pointer" }}
                  />
                  <label htmlFor={`emp-${e._id || e.email}`} style={{ flex: 1, cursor: "pointer", fontSize: 13, color: "#1e0a3c", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{e.name}</span>
                    {e.department && <span style={{ fontSize: 11, color: "#a78bba", background: "#f3e8ff", padding: "2px 6px", borderRadius: 4 }}>{e.department}</span>}
                  </label>
                </div>
              ))}
          </div>
          {np.assignedTo.length > 0 && <div style={{ marginTop: 6, fontSize: 11, color: "#9333ea", fontWeight: 600 }}>{np.assignedTo.length} employee(s) selected</div>}
        </div>
        <Fld label="Description" value={np.description} onChange={v => setNp({ ...np, description: v })} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
          <button onClick={() => setModal(null)} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>
          <button onClick={addProject} disabled={projSaveLoading} style={{ ...B("#a855f7"), opacity: projSaveLoading ? 0.7 : 1 }}>{projSaveLoading ? "Saving..." : "Save Project →"}</button>
        </div>
      </Mdl>}

      {/* ── Add Manager Modal ── */}
      {modal === "manager" && <Mdl title="Add New Manager" onClose={() => setModal(null)}>
        <div className="modal-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
          <Fld label="Manager Name *" value={nm.managerName} onChange={v => { setNm({ ...nm, managerName: v }); setNmError(p => ({ ...p, managerName: "" })); }} error={nmError.managerName} />
          <Fld label="Email *" value={nm.email} onChange={v => { setNm({ ...nm, email: v }); setNmError(p => ({ ...p, email: "" })); }} type="email" error={nmError.email} />
          <Fld label="Phone Number" value={nm.phone} onChange={v => setNm({ ...nm, phone: v })} />
          <Fld label="Role" value={nm.role} onChange={v => setNm({ ...nm, role: v })} />
          <Fld label="Department" value={nm.department} onChange={v => setNm({ ...nm, department: v })} />
          <Fld label="Status" value={nm.status} onChange={v => setNm({ ...nm, status: v })} options={["Active", "Inactive"]} />
        </div>
        <Fld label="Address" value={nm.address} onChange={v => setNm({ ...nm, address: v })} />
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>PASSWORD *</label>
          <div style={{ position: "relative" }}>
            <input type={showMgrPass ? "text" : "password"} value={nm.password} onChange={e => { setNm({ ...nm, password: e.target.value }); setNmError(p => ({ ...p, password: "" })); }} style={{ width: "100%", border: `1.5px solid ${nmError.password ? "#EF4444" : "#ede9fe"}`, borderRadius: 10, padding: "10px 46px 10px 14px", fontSize: 13, color: T.text, background: "#faf5ff", boxSizing: "border-box", outline: "none" }} placeholder="Set manager password" />
            <button type="button" onClick={() => setShowMgrPass(!showMgrPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#a78bfa", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>{showMgrPass ? "HIDE" : "SHOW"}</button>
          </div>
          {nmError.password && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠️ {nmError.password}</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
          <button onClick={() => setModal(null)} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>
          <button onClick={addManager} disabled={mgrSaveLoading} style={{ ...B("#f59e0b"), opacity: mgrSaveLoading ? 0.7 : 1 }}>{mgrSaveLoading ? "Saving..." : "Save Manager →"}</button>
        </div>
      </Mdl>}

      {/* ── Add Subadmin Modal ── */}
      {modal === "subadmin" && <Mdl title="Add New Subadmin" onClose={() => setModal(null)}>
        <div className="modal-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
          <Fld label="Full Name *" value={ns.name} onChange={v => { setNs({ ...ns, name: v }); setNsError(p => ({ ...p, name: "" })); }} error={nsError.name} />
          <Fld label="Email *" value={ns.email} onChange={v => { setNs({ ...ns, email: v }); setNsError(p => ({ ...p, email: "" })); }} type="email" error={nsError.email} />
          <Fld label="Phone" value={ns.phone} onChange={v => setNs({ ...ns, phone: v })} />
          <Fld label="Status" value={ns.status} onChange={v => setNs({ ...ns, status: v })} options={["Active", "Inactive"]} />
          <Fld label="Company Name" value={ns.companyName} onChange={v => setNs({ ...ns, companyName: v })} placeholder="Company name" />
          <Fld label="Company Type" value={ns.companyType} onChange={v => setNs({ ...ns, companyType: v })} options={["IT", "Software", "Services", "Consulting", "Other"]} />
          <Fld label="No. of Employees" value={ns.employeeCount} onChange={v => setNs({ ...ns, employeeCount: v })} options={["0-10", "11-50", "51-100", "100+"]} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>PASSWORD *</label>
          <div style={{ position: "relative" }}>
            <input type={showSubPass ? "text" : "password"} value={ns.password} onChange={e => { setNs({ ...ns, password: e.target.value }); setNsError(p => ({ ...p, password: "" })); }} style={{ width: "100%", border: `1.5px solid ${nsError.password ? "#EF4444" : "#ede9fe"}`, borderRadius: 10, padding: "10px 46px 10px 14px", fontSize: 13, color: T.text, background: "#faf5ff", boxSizing: "border-box", outline: "none" }} placeholder="Set subadmin password" />
            <button type="button" onClick={() => setShowSubPass(!showSubPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#a78bfa", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>{showSubPass ? "HIDE" : "SHOW"}</button>
          </div>
          {nsError.password && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠️ {nsError.password}</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
          <button onClick={() => setModal(null)} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>
          <button onClick={addSubadmin} disabled={subSaveLoading} style={{ ...B("#3b82f6"), opacity: subSaveLoading ? 0.7 : 1 }}>{subSaveLoading ? "Saving..." : "Save Subadmin →"}</button>
        </div>
      </Mdl>}

      {/* ── Add Package Modal ── */}
      {modal === "package_add" && <Mdl title="Add New Package" onClose={() => setModal(null)} maxWidth={700}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }} className="modal-2col">
          <Fld label="Package Title *" value={npkg.title} onChange={v => { setNpkg({ ...npkg, title: v }); setPkgError(p => ({ ...p, title: "" })); }} error={pkgError.title} />
          <Fld label="Icon (Emoji)" value={npkg.icon} onChange={v => setNpkg({ ...npkg, icon: v })} placeholder="e.g. 📦" />
          <Fld label="Button Name" value={npkg.buttonName} onChange={v => setNpkg({ ...npkg, buttonName: v })} placeholder="e.g. Get Started" />
          <Fld label="Description" value={npkg.description} onChange={v => setNpkg({ ...npkg, description: v })} />
        </div>

        <div style={{ background: "#f8fafc", padding: 18, borderRadius: 16, border: "1px solid #f1f5f9", margin: "14px 0" }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 800, letterSpacing: 1, marginBottom: 12 }}>PRICING OPTIONS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }} className="modal-2col">
            <Fld label="Monthly Price" value={npkg.monthlyPrice} onChange={v => setNpkg({ ...npkg, monthlyPrice: v })} placeholder="e.g. ₹999" />
            <Fld label="Quarterly Price" value={npkg.quarterlyPrice} onChange={v => setNpkg({ ...npkg, quarterlyPrice: v })} placeholder="e.g. ₹2,499" />
            <Fld label="Half-Yearly Price" value={npkg.halfYearlyPrice} onChange={v => setNpkg({ ...npkg, halfYearlyPrice: v })} placeholder="e.g. ₹4,499" />
            <Fld label="Annual Price" value={npkg.annualPrice} onChange={v => setNpkg({ ...npkg, annualPrice: v })} placeholder="e.g. ₹7,999" />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>FEATURES (Comma separated)</label>
          <textarea 
            value={npkg.features} 
            onChange={e => setNpkg({ ...npkg, features: e.target.value })}
            style={{ width: "100%", height: 80, border: "1.5px solid #ede9fe", borderRadius: 10, padding: "10px 14px", fontSize: 13, background: "#faf5ff", outline: "none", fontFamily: "inherit", resize: "none" }}
            placeholder="e.g. Unlimited Clients, Premium Support, Custom Branding"
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={() => setModal(null)} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>
          <button onClick={addPackage} disabled={pkgSaveLoading} style={{ ...B("#0ea5e9"), opacity: pkgSaveLoading ? 0.7 : 1 }}>{pkgSaveLoading ? "Creating..." : "Create Package →"}</button>
        </div>
      </Mdl>}

      {modal === "vendor_add" && <Mdl title="Add New Vendor" onClose={() => setModal(null)}>
        <div className="modal-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
          <Fld label="Vendor Name *" value={nv.vendorName} onChange={v => { setNv({ ...nv, vendorName: v }); setNvError(p => ({ ...p, vendorName: "" })); }} error={nvError.vendorName} />
          <Fld label="Product Name *" value={nv.vendorProduct} onChange={v => { setNv({ ...nv, vendorProduct: v }); setNvError(p => ({ ...p, vendorProduct: "" })); }} error={nvError.vendorProduct} />
          <Fld label="Required Amount *" value={nv.amountTaxGst} type="number" onChange={v => setNv({ ...nv, amountTaxGst: v })} />
          <Fld label="Paid Amount *" value={nv.paidAmount} type="number" onChange={v => setNv({ ...nv, paidAmount: v })} />
          <Fld label="Date of Purchase" value={nv.dateOfPurchase} type="date" onChange={v => setNv({ ...nv, dateOfPurchase: v })} />
          <Fld label="Mode of Payment" value={nv.modeOfPayment} onChange={v => setNv({ ...nv, modeOfPayment: v })} options={["Cash", "Bank Transfer", "UPI", "Cheque"]} />
        </div>
        <Fld label="Product Description" value={nv.productDescription} onChange={v => setNv({ ...nv, productDescription: v })} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
          <button onClick={() => setModal(null)} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>
          <button onClick={addVendor} disabled={vendorSaveLoading} style={{ ...B("#9333ea"), opacity: vendorSaveLoading ? 0.7 : 1 }}>{vendorSaveLoading ? "Saving..." : "Save Vendor →"}</button>
        </div>
      </Mdl>}

      {/* ── View Package Modal ── */}
      {viewPackage && (
        <Mdl title={`Package Details: ${viewPackage.title}`} onClose={() => setViewPackage(null)} maxWidth={500}>
          <div style={{ padding: "10px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#9333ea,#c084fc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
                {viewPackage.icon || "📦"}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{viewPackage.title}</div>
                <div style={{ fontSize: 13, color: "#7c3aed" }}>{viewPackage.type === "free" ? "Free Package" : "Paid Package"}</div>
              </div>
            </div>

            <InfoRow icon="📄" label="Description" value={viewPackage.description} />
            <InfoRow icon="📅" label="Duration" value={`${viewPackage.no_of_days || viewPackage.noOfDays || 30} days`} />
            <InfoRow icon="💰" label="Price" value={viewPackage.type === "free" ? "Free" : `₹${viewPackage.price || 0}`} />
            <InfoRow icon="🗓️" label="Plan Duration" value={viewPackage.planDuration || "Monthly"} />
            <InfoRow icon="🏢" label="Business" value={viewPackage.businessLimit || "Single business manage"} />
            <InfoRow icon="👨‍💼" label="Manager" value={viewPackage.managerLimit || "1 Manager"} />
            <InfoRow icon="👥" label="Client" value={viewPackage.clientLimit || "3 Client manage"} />
            <InfoRow icon="📊" label="Status" value={viewPackage.status || "Active"} />

            {viewPackage.features && viewPackage.features.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", marginBottom: 10 }}>FEATURES</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(Array.isArray(viewPackage.features) ? viewPackage.features : viewPackage.features.split('\\n')).map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.text }}>
                      <span style={{ color: "#22c55e" }}>✓</span> {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <button onClick={() => setViewPackage(null)} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", color: T.text, borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Close</button>
          </div>
        </Mdl>
      )}

      {/* ── Edit Package Modal ── */}
      {editPackage && (
        <Mdl title={`Edit Package: ${editPackage.title}`} onClose={() => setEditPackage(null)} maxWidth={700}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }} className="modal-2col">
            <Fld label="Package Title *" value={editPkgForm.title} onChange={v => setEditPkgForm({ ...editPkgForm, title: v })} />
            <Fld label="Icon (Emoji)" value={editPkgForm.icon} onChange={v => setEditPkgForm({ ...editPkgForm, icon: v })} />
            <Fld label="Type" value={editPkgForm.type} onChange={v => setEditPkgForm({ ...editPkgForm, type: v })} options={["free", "paid"]} />
            <Fld label="Price" value={editPkgForm.price} onChange={v => setEditPkgForm({ ...editPkgForm, price: v })} disabled={editPkgForm.type === "free"} />
            <Fld label="Number of Days *" value={editPkgForm.noOfDays} onChange={v => setEditPkgForm({ ...editPkgForm, noOfDays: v })} />
            <Fld label="Status" value={editPkgForm.status} onChange={v => setEditPkgForm({ ...editPkgForm, status: v })} options={["Active", "Inactive"]} />
          </div>

          <div style={{ background: "#f8fafc", padding: 18, borderRadius: 16, border: "1px solid #f1f5f9", margin: "14px 0" }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 800, letterSpacing: 1, marginBottom: 12 }}>PACKAGE LIMITS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }} className="modal-2col">
              <Fld label="Plan Duration" value={editPkgForm.planDuration} onChange={v => setEditPkgForm({ ...editPkgForm, planDuration: v })} options={["Monthly", "90 Days", "Yearly"]} />
              <Fld label="Business Limit" value={editPkgForm.businessLimit} onChange={v => setEditPkgForm({ ...editPkgForm, businessLimit: v })} options={["Single business manage", "Multiple business manage", "Unlimited business manage"]} />
              <Fld label="Manager Limit" value={editPkgForm.managerLimit} onChange={v => setEditPkgForm({ ...editPkgForm, managerLimit: v })} options={["1 Manager", "2 Managers", "3 Managers", "5 Managers", "Unlimited Managers"]} />
              <Fld label="Client Limit" value={editPkgForm.clientLimit} onChange={v => setEditPkgForm({ ...editPkgForm, clientLimit: v })} options={["3 Client manage", "5 Client manage", "10 Client manage", "Unlimited Client manage"]} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>DESCRIPTION</label>
            <textarea
              value={editPkgForm.description}
              onChange={e => setEditPkgForm({ ...editPkgForm, description: e.target.value })}
              style={{ width: "100%", height: 80, border: "1.5px solid #ede9fe", borderRadius: 10, padding: "10px 14px", fontSize: 13, background: "#faf5ff", outline: "none", fontFamily: "inherit", resize: "none" }}
              placeholder="Package description..."
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button onClick={() => setEditPackage(null)} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>
            <button onClick={savePackageEdit} disabled={pkgSaveLoading} style={{ ...B("#0ea5e9"), opacity: pkgSaveLoading ? 0.7 : 1 }}>{pkgSaveLoading ? "Saving..." : "Save Changes →"}</button>
          </div>
        </Mdl>
      )}
    </div>
  );
}
