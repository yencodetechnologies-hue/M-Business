import { useState, useEffect, useRef, useTransition } from "react";

import React from "react";

import "./DashboardModern.css";

import axios from "axios";

import { BASE_URL } from "../config";

import InvoiceCreator from "./InvoiceCreator";

import TaskPage from "./TaskPage";

import CalendarPage from "./CalendarPage";

import AccountsPage, { ExpensesPage } from "./AccountsPage";

import ReportsPage from "./ReportsPage";

import QuotationCreatorModern from "./QuotationCreatorModern";

import QuotationCreator from "./QuotationCreator";

import ProjectProposalCreator from "./ProjectProposalCreator";

import AdminProposalManagement from "./AdminProposalManagement";

import RolePermissionDashboard from "./RolePermissionDashboard";

import MessagingPage from "./MessagingPage";

import SettingsPage from "./SettingsPage";

import { toast } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import { QRCodeSVG } from "qrcode.react";

import { SubAdminDocumentsPage } from "./EmployeeProfilePanel";

import { DOC_TYPES } from "./EmployeeProfilePanel";

import EmployeeDetail from "./EmployeeDetail";

import AuthPage from "./AuthPage";

import MySubscriptions from "./MySubscriptions";

import AddClientView from "./AddClientView";

import EmployeeSubscriptionWarning from "./EmployeeSubscriptionWarning";

import ModernEmployeeProjectDetails from "./ModernEmployeeProjectDetails";

import ImageCropModal from "./ImageCropModal";

import PaymentDashboard from "./PaymentDashboard";

import ModernProjectsView from "./ModernProjectsView";

import ModernProjectCreator from "./ModernProjectCreator";

import ModernProjectDetails from "./ModernProjectDetails";

import ProjectPaymentModals from "./ProjectPaymentModals";







const T = { primary: "var(--app-primary)", sidebar: "var(--app-sidebar)", accent: "var(--app-accent)", bg: "var(--app-bg)", card: "var(--app-card)", text: "var(--app-text)", muted: "var(--app-muted)", border: "var(--app-border)", surface: "var(--app-bg)" };

const formatCurrency = (amount, currency = "Rs.", compact = false, disableCompact = false) => {

  const sym = currency || "Rs.";

  const num = Number(amount) || 0;

  const absNum = Math.abs(num);



  if (!disableCompact && ((compact && absNum >= 100000) || absNum >= 10000000)) {

    try {

      const formatter = new Intl.NumberFormat('en-IN', {

        notation: 'compact',

        compactDisplay: 'short',

        maximumFractionDigits: 2

      });

      return sym + (/[A-Za-z]/.test(sym) ? " " : "") + formatter.format(num);

    } catch (e) {

      // Fallback

    }

  }



  return sym + (/[A-Za-z]/.test(sym) ? " " : "") + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

};



const formatShortCurrency = (val) => {

  const num = Number(val);

  if (isNaN(num) || num === 0) return "Rs.0";



  const absNum = Math.abs(num);

  if (absNum >= 1e15) {

    return `Rs.${num.toExponential(2)}`;

  }



  let formatted = "";

  if (absNum >= 1e12) {

    formatted = (num / 1e12).toFixed(1).replace(/\.0$/, "") + "T";

  } else if (absNum >= 1e9) {

    formatted = (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";

  } else if (absNum >= 1e7) {

    formatted = (num / 1e7).toFixed(1).replace(/\.0$/, "") + "Cr";

  } else if (absNum >= 1e5) {

    formatted = (num / 1e5).toFixed(1).replace(/\.0$/, "") + "L";

  } else if (absNum >= 1e3) {

    formatted = (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";

  } else {

    formatted = num.toFixed(0);

  }

  return `Rs.${formatted}`;

};



const formatDate = (dateStr) => {

  if (!dateStr) return null;

  const d = new Date(dateStr);

  if (isNaN(d.getTime())) return null;

  const day = String(d.getDate()).padStart(2, '0');

  const month = String(d.getMonth() + 1).padStart(2, '0');

  const year = String(d.getFullYear()).slice(-2);

  return `${day}.${month}.${year}`;

};



const getFormattedLastUpdate = (items, fallback) => {

  if (!items || items.length === 0) return fallback;

  const times = items.map(item => {

    const timeStr = item.updatedAt || item.createdAt || item.start || item.date;

    if (!timeStr) return 0;

    const t = new Date(timeStr).getTime();

    return isNaN(t) ? 0 : t;

  }).filter(t => t > 0);

  if (times.length === 0) return fallback;

  const maxTime = Math.max(...times);

  return formatDate(new Date(maxTime)) || fallback;

};



const formatLastEditDate = (dateStr) => {

  if (!dateStr) return "28 May, 2026";

  const d = new Date(dateStr);

  if (isNaN(d.getTime())) return dateStr;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;

};



const getMockSize = (id) => {

  const hash = id ? id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 12;

  const size = ((hash % 15) / 10 + 0.1).toFixed(1);

  return `${size} MB`;

};



const renderMembersAvatars = (inv) => {

  const clientInitials = inv.clientName ? inv.clientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : "MB";

  const colors = ["#00BCC0", "#26C281", "#7C5CFC", "#F5A623"];

  return (

    <div className="member-stack">

      {clientInitials.split('').map((char, index) => (

        <div

          key={index}

          className="member-av"

          style={{

            background: colors[index % colors.length],

            border: "2px solid #fff",

            marginLeft: index > 0 ? "-5px" : "0"

          }}

        >

          {char}

        </div>

      ))}

    </div>

  );

};



const getFolderDate = (p, index) => {

  const dateVal = p.updatedAt || p.createdAt || p.start || p.date;

  if (dateVal) {

    const formatted = formatDate(dateVal);

    if (formatted) return formatted;

  }

  const fallbacks = ["28.05.26", "20.05.26", "10.05.26"];

  return fallbacks[index % fallbacks.length];

};

const TRACKING_SEED = [{ id: "PRJ001", name: "Website Redesign", client: "TechNova Pvt Ltd", deadline: "2024-05-30", pct: 65, status: "In Progress", note: "Design done, dev ongoing" }, { id: "PRJ002", name: "Mobile App Dev", client: "Bloom Creatives", deadline: "2024-08-15", pct: 15, status: "Pending", note: "Requirements gathering" }, { id: "PRJ003", name: "ERP Integration", client: "Infra Solutions", deadline: "2024-04-30", pct: 100, status: "Completed", note: "Signed off by Company Name" }];

const INVOICES = [{ id: "INV001", client: "TechNova Pvt Ltd", project: "Website Redesign", date: "2024-04-01", due: "2024-04-30", total: "1,47,500", status: "Paid" }, { id: "INV002", client: "Infra Solutions", project: "ERP Integration", date: "2024-05-01", due: "2024-05-15", total: "4,24,800", status: "Overdue" }, { id: "INV003", client: "Bloom Creatives", project: "Mobile App Dev", date: "2024-05-10", due: "2024-06-10", total: "1,18,000", status: "Pending" }];



const NAV = [

  { key: "dashboard", icon: "ti-layout-dashboard", label: "Dashboard" },

  {

    label: "Internal Management",

    type: "group",

    items: [

      { key: "clients", icon: "ti-building", label: "Clients" },

      { key: "employees", icon: "ti-users", label: "Employees" },

      { key: "vendors", icon: "ti-truck-delivery", label: "Vendors" },

    ]

  },

  {

    label: "Projects",

    type: "group",

    items: [

      { key: "projects", icon: "ti-briefcase", label: "Projects" },

      { key: "tasks", icon: "ti-checkbox", label: "Tasks" },

      { key: "calendar", icon: "ti-calendar-event", label: "Calendar" },

    ]

  },

  {

    label: "Finance",

    type: "group",

    items: [

      { key: "quotations", icon: "ti-file-invoice", label: "Quotations" },

      { key: "proposals", icon: "ti-presentation-analytics", label: "Project Proposals" },

      { key: "invoices", icon: "ti-receipt", label: "Invoices" },

      { key: "accounts", icon: "ti-wallet", label: "Accounts" },

      { key: "payments", icon: "ti-arrows-right-left", label: "Payments" },

      { key: "expenses", icon: "ti-cash", label: "Expenses" },

      { key: "templates", icon: "ti-template", label: "Templates" },

      { key: "letterhead", icon: "ti-letter-a", label: "Letterhead" },

    ]

  },

  {

    label: "Resources",

    type: "group",

    items: [

      { key: "interviews", icon: "ti-microphone", label: "Interviews" },

      { key: "reports", icon: "ti-chart-bar", label: "Reports" },

      { key: "messaging", icon: "ti-messages", label: "Messages" },

      { key: "settings", icon: "ti-settings", label: "Settings" },

      { key: "packages", icon: "ti-package", label: "Packages" },

      { key: "rolePermissions", icon: "ti-shield-lock", label: "Role Permissions" },

    ]

  },

  { key: "mysubscriptions", icon: "ti-rocket", label: "My Subscriptions" }

];



function getNavForRole(role) {

  const r = (role || "").toLowerCase().trim();

  const allowedKeys = [];



  if (r === "subadmin" || r === "sub_admin" || r === "sub-admin") {

    allowedKeys.push("dashboard", "templates", "letterhead", "clients", "subadmins", "employees", "managers", "projects", "quotations", "proposals", "invoices", "tracking", "tasks", "calendar", "accounts", "payments", "expenses", "interviews", "reports", "mysubscriptions", "packages", "vendors", "rolePermissions", "messaging", "settings");

  } else if (r === "manager") {

    allowedKeys.push("dashboard", "employees", "projects", "tracking", "tasks", "calendar", "interviews", "reports", "vendors", "messaging");

  } else if (r === "employee") {

    allowedKeys.push("dashboard", "tasks", "calendar", "messaging");

  } else {

    // Default/Admin

    return NAV;

  }



  return NAV.map(item => {

    if (item.type === "group") {

      const filteredItems = item.items.filter(i => allowedKeys.includes(i.key));

      return filteredItems.length > 0 ? { ...item, items: filteredItems } : null;

    }

    return allowedKeys.includes(item.key) ? item : null;

  }).filter(Boolean);

}



const sc = s => ({ Active: "#22C55E", Inactive: "#EF4444", "In Progress": "var(--app-accent)", Pending: "#F59E0B", Completed: "#22C55E", "On Hold": "var(--app-accent)", Sent: "var(--app-accent)", Approved: "#22C55E", Rejected: "#EF4444", Paid: "#22C55E", Overdue: "#EF4444", Company: "var(--app-accent)", Employee: "var(--app-accent)", Manager: "#f59e0b", pending: "#F59E0B", hired: "#22C55E", rejected: "#EF4444" }[s] || "var(--app-accent)");

// Single source of truth for department names, shared by the "All Departments"
// filter dropdown and the Add/Edit Employee "Role / Position" dropdown, so both
// stay in sync — adding a department here updates both automatically.
const DEPARTMENT_OPTIONS = ["Development", "Design", "Marketing", "HR"];



function Badge({ label }) {

  const c = sc(label);

  const isVar = c && c.startsWith("var");

  const bg = isVar ? "rgba(var(--app-accent-rgb, 124, 58, 237), 0.12)" : `${c}18`;

  const border = isVar ? "rgba(var(--app-accent-rgb, 124, 58, 237), 0.35)" : `${c}4D`; // 4D is ~30% opacity in hex

  return <span style={{ background: bg, color: c, border: `1.5px solid ${border}`, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{label}</span>;

}



function SC({ title, children, action }) {

  return (

    <div style={{ background: "var(--app-card)", borderRadius: 16, padding: 22, boxShadow: "0 4px 24px rgba(var(--app-accent-rgb, 124, 58, 237),0.08)", border: "1.5px solid var(--app-border)" }}>

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

      <i className="ti ti-search" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--app-muted)", fontSize: 16 }}></i>

      <input type="text" placeholder={placeholder || "Search..."} value={value} onChange={e => onChange(e.target.value)}

        style={{ width: "100%", padding: "10px 14px 10px 40px", border: "1.5px solid var(--app-border)", borderRadius: 10, fontSize: 13, color: T.text, background: "var(--app-bg)", outline: "none", fontFamily: "inherit" }} />

    </div>

  );

}



function Mdl({ title, onClose, children, maxWidth = 820, zIndex = 1000 }) {

  return (

    <div

      style={{ position: "fixed", inset: 0, background: "rgba(var(--app-accent-rgb),0.55)", backdropFilter: "blur(8px)", zIndex, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}

      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}

    >

      <div style={{ background: "var(--app-card)", borderRadius: 20, width: "100%", maxWidth, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(var(--app-accent-rgb),0.25)", border: "1px solid var(--app-border)" }} onClick={e => e.stopPropagation()}>

        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--app-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(90deg,var(--app-bg),var(--app-bg))", flexShrink: 0 }}>

          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.text }}>{title}</h2>

          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--app-muted)", padding: "4px 8px" }}>✕</button>

        </div>

        <div style={{ overflowY: "auto", padding: "20px 22px", flex: 1 }}>{children}</div>

      </div>

    </div>

  );

}



function Fld({ label, value, onChange, options, type = "text", error, placeholder, disabled, allowCustom }) {
  const [isCustomMode, setIsCustomMode] = useState(() => {
    if (!allowCustom) return false;
    if (!value) return false;
    const lowerOptions = (options || []).map(o => String(o).toLowerCase());
    return !lowerOptions.includes(String(value).toLowerCase());
  });

  useEffect(() => {
    if (allowCustom) {
      if (!value) {
        setIsCustomMode(false);
      } else {
        const lowerOptions = (options || []).map(o => String(o).toLowerCase());
        if (!lowerOptions.includes(String(value).toLowerCase())) {
          setIsCustomMode(true);
        }
      }
    }
  }, [value, options, allowCustom]);

  const s = { width: "100%", border: `1.5px solid ${error ? "#EF4444" : "var(--app-border)"}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: T.text, background: disabled ? "#f3f0ff" : "var(--app-bg)", boxSizing: "border-box", outline: "none", fontFamily: "inherit", opacity: disabled ? 0.7 : 1 };

  const sCustom = { flex: 1.2, border: `1.5px solid ${error ? "#EF4444" : "var(--app-border)"}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: T.text, background: "var(--app-bg)", boxSizing: "border-box", outline: "none", fontFamily: "inherit" };

  return (

    <div style={{ marginBottom: 14 }}>

      <label style={{ display: "block", fontSize: 11, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>{label.toUpperCase()}</label>

      {options ? (

        allowCustom ? (() => {

          const selectValue = isCustomMode ? "Custom" : (value || "");

          return (

            <div style={{ display: "flex", gap: 10 }}>

              <select value={selectValue} onChange={e => { const v = e.target.value; if (v === "Custom") { setIsCustomMode(true); onChange(""); } else { setIsCustomMode(false); onChange(v); } }} style={{ ...s, flex: 1 }} disabled={disabled}><option value="Custom">Custom...</option>{options.map(o => <option key={o} value={o}>{o || "Select option..."}</option>)}</select>

              {isCustomMode && <input type="text" placeholder={`Type custom ${label.toLowerCase()}...`} value={value || ""} onChange={e => onChange(e.target.value)} style={sCustom} disabled={disabled} autoFocus />}

            </div>

          );

        })() : (() => {

          const lowerOptions = (options || []).map(o => String(o).toLowerCase());

          const lowerVal = String(value || "").toLowerCase();

          const matchIdx = lowerOptions.indexOf(lowerVal);

          const hasMatch = matchIdx !== -1;

          const selectValue = hasMatch ? options[matchIdx] : (options[0] || "");

          return (<select value={selectValue} onChange={e => onChange(e.target.value)} style={s} disabled={disabled}>{options.map(o => <option key={o}>{o}</option>)}</select>);

        })()

      ) : <input type={type} value={value || ""} onChange={e => {

        const val = e.target.value;

        const isNumericField = ["phone", "pincode", "zip", "salary", "mobile", "account", "person no", "office no"].some(l => label.toLowerCase().includes(l));

        if (isNumericField && val && !/^\d*$/.test(val)) return;

        onChange(val);

      }} style={s} placeholder={placeholder || ""} disabled={disabled} />}

      {error && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>Warning {error}</div>}

    </div>

  );

}



function Pagination({ totalItems, itemsPerPage, currentPage, onPageChange, onItemsPerPageChange }) {

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  if (totalItems === 0) return null;



  return (

    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, padding: "12px 0 4px", borderTop: "1px solid var(--app-border)", flexWrap: "wrap", gap: 15 }}>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

        <span style={{ fontSize: 13, color: "var(--app-muted)", fontWeight: 600 }}>Page {currentPage} of {totalPages}</span>

        <select

          value={itemsPerPage}

          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}

          style={{ padding: "7px 12px", borderRadius: 10, border: "1.5px solid var(--app-border)", fontSize: 13, background: "var(--app-bg)", color: "var(--app-sidebar)", outline: "none", cursor: "pointer", fontWeight: 500 }}

        >

          {[10, 25, 50, 100].map(n => <option key={n} value={n}>Show {n}</option>)}

        </select>

      </div>

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>

        <button

          disabled={currentPage === 1}

          onClick={() => onPageChange(currentPage - 1)}

          style={{ padding: "7px 14px", borderRadius: 10, border: "1.5px solid var(--app-border)", background: currentPage === 1 ? "var(--app-bg)" : "var(--app-card)", color: currentPage === 1 ? "var(--app-muted)" : "var(--app-text)", fontSize: 13, fontWeight: 700, cursor: currentPage === 1 ? "not-allowed" : "pointer", transition: "all 0.2s" }}

        >

          Previous

        </button>



        {totalPages <= 7 ? (

          [...Array(totalPages)].map((_, i) => (

            <button key={i + 1} onClick={() => onPageChange(i + 1)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "1.5px solid", borderColor: currentPage === (i + 1) ? "var(--app-accent)" : "var(--app-border)", background: currentPage === (i + 1) ? "var(--app-accent)" : "var(--app-card)", color: currentPage === (i + 1) ? "#fff" : "var(--app-text)", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>{i + 1}</button>

          ))

        ) : (

          <>

            <button onClick={() => onPageChange(1)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "1.5px solid", borderColor: currentPage === 1 ? "var(--app-accent)" : "var(--app-border)", background: currentPage === 1 ? "var(--app-accent)" : "var(--app-card)", color: currentPage === 1 ? "#fff" : "var(--app-text)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>1</button>

            {currentPage > 3 && <span style={{ color: "#cbd5e1" }}>...</span>}

            {currentPage > 2 && currentPage < totalPages - 1 && (

              <button onClick={() => onPageChange(currentPage)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "1.5px solid var(--app-accent)", background: "var(--app-accent)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{currentPage}</button>

            )}

            {currentPage < totalPages - 2 && <span style={{ color: "#cbd5e1" }}>...</span>}

            <button onClick={() => onPageChange(totalPages)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "1.5px solid", borderColor: currentPage === totalPages ? "var(--app-accent)" : "var(--app-border)", background: currentPage === totalPages ? "var(--app-accent)" : "#fff", color: currentPage === totalPages ? "#fff" : "var(--app-muted)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{totalPages}</button>

          </>

        )}



        <button

          disabled={currentPage === totalPages}

          onClick={() => onPageChange(currentPage + 1)}

          style={{ padding: "7px 14px", borderRadius: 10, border: "1.5px solid var(--app-border)", background: currentPage === totalPages ? "#f8fafc" : "#fff", color: currentPage === totalPages ? "#cbd5e1" : "var(--app-muted)", fontSize: 13, fontWeight: 700, cursor: currentPage === totalPages ? "not-allowed" : "pointer", transition: "all 0.2s" }}

        >

          Next

        </button>

      </div>

    </div>

  );

}



function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = "Delete", danger = true }) {

  return (

    <div style={{ position: "fixed", inset: 0, background: "rgba(var(--app-accent-rgb),0.6)", backdropFilter: "blur(8px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>

      <div style={{ background: "var(--app-card)", borderRadius: 18, width: "100%", maxWidth: 400, padding: "28px 28px 22px", boxShadow: "0 32px 80px rgba(var(--app-accent-rgb),0.25)", border: "1px solid var(--app-border)" }}>

        <div style={{ width: 52, height: 52, borderRadius: "50%", background: danger ? "rgba(var(--red-rgb),0.1)" : "rgba(var(--app-accent-rgb),0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 14px" }}>

          {danger ? <i className="ti ti-trash" style={{ color: "#EF4444" }} /> : <i className="ti ti-check" style={{ color: "var(--app-accent)" }} />}

        </div>

        <h3 style={{ textAlign: "center", margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: T.text }}>{title}</h3>

        <p style={{ textAlign: "center", color: "#6b7280", fontSize: 13, margin: "0 0 22px" }}>{message}</p>

        <div style={{ display: "flex", gap: 10 }}>

          <button onClick={onCancel} style={{ flex: 1, padding: "10px", background: "var(--app-bg)", border: "1px solid var(--app-border)", borderRadius: 10, fontSize: 13, fontWeight: 600, color: T.text, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>

          <button onClick={onConfirm} style={{ flex: 1, padding: "10px", background: danger ? "linear-gradient(135deg,#EF4444,#dc2626)" : "linear-gradient(135deg,var(--app-accent),var(--app-accent))", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>{confirmLabel}</button>

        </div>

      </div>

    </div>

  );

}



// ── Action Buttons (View / Edit / Delete) ────────────────────

function ActionBtns({ onView, onEdit, onDelete, onShare }) {

  return (

    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>

      {onView && <button onClick={(e) => { e.stopPropagation(); onView(); }} title="View" style={{ background: "var(--app-bg)", border: "1px solid #ddd6fe", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "var(--app-muted)", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>View</button>}

      {onShare && <button onClick={(e) => { e.stopPropagation(); onShare(); }} title="Share Onboarding Link" style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#166534", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}><span></span></button>}

      {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Edit" style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#f59e0b", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>Edit</button>}

      {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete" style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#ef4444", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>Delete</button>}

    </div>

  );

}



function InfoRow({ icon, label, value }) {

  if (!value) return null;

  return (

    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--app-bg)", borderRadius: 9, border: "1px solid var(--app-border)", marginBottom: 7 }}>

      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(var(--app-accent-rgb, 124, 58, 237),0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{icon}</div>

      <div>

        <div style={{ fontSize: 10, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>

        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--app-sidebar)", marginTop: 1 }}>{value}</div>

      </div>

    </div>

  );

}



function LimitReachedModal({ type, limit, onClose, onUpgrade }) {

  const icons = { client: "Team", employee: "👨‍💼", manager: "🧑‍💼" };

  const labels = { client: "Clients", employee: "Employees", manager: "Managers" };



  return (

    <Mdl title="Limit Reached" onClose={onClose} maxWidth={450} zIndex={2000}>

      <div style={{ textAlign: "center", padding: "10px 0" }}>

        <div style={{ fontSize: 48, marginBottom: 16 }}>{icons[type] || "Warning"}</div>

        <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--app-sidebar)", marginBottom: 12 }}>

          {labels[type] || "Resource"} Limit Reached

        </h3>

        <p style={{ fontSize: 14, color: "var(--app-muted)", lineHeight: 1.6, marginBottom: 24 }}>

          Your current plan allows up to <b>{limit === Infinity ? "Unlimited" : limit} {labels[type]}</b>.

          You've reached this limit and need to upgrade your plan to add more.

        </p>

        <div style={{ display: "flex", gap: 12 }}>

          <button

            onClick={onClose}

            style={{ flex: 1, padding: "12px", background: "var(--app-bg)", border: "1.5px solid var(--app-border)", borderRadius: 12, fontWeight: 700, color: "var(--app-sidebar)", cursor: "pointer", fontFamily: "inherit" }}

          >

            Maybe Later

          </button>

          <button

            onClick={onUpgrade}

            style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", border: "none", borderRadius: 12, fontWeight: 800, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(var(--app-accent-rgb, 124, 58, 237), 0.3)", fontFamily: "inherit" }}

          >

            Launch Upgrade Plan

          </button>

        </div>

      </div>

    </Mdl>

  );

}



function ClientDropdown({ clients, value, onChange, error, onAddClient }) {

  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);

  const filtered = clients.filter(c => (c.clientName || c.name || "").toLowerCase().includes(search.toLowerCase()) || (c.companyName || c.company || "").toLowerCase().includes(search.toLowerCase()));

  const selected = clients.find(c => (c.clientName || c.name) === value);

  return (

    <div style={{ position: "relative", zIndex: open ? 1005 : 1 }}>
      <div onClick={() => setOpen(!open)} style={{ width: "100%", border: `1.5px solid ${error ? "#EF4444" : open ? "var(--app-accent)" : "var(--app-border)"}`, borderRadius: 10, padding: "10px 36px 10px 14px", fontSize: 13, color: value ? T.text : "var(--app-muted)", background: "var(--app-bg)", cursor: "pointer", userSelect: "none", boxSizing: "border-box", position: "relative", minHeight: 42 }}>

        {value ? (<div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{value[0].toUpperCase()}</div><span>{value}</span>{selected?.companyName && <span style={{ fontSize: 11, color: "var(--app-muted)" }}>({selected.companyName})</span>}</div>) : "-- Select Client --"}

        <span style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, fontSize: 10, color: "var(--app-muted)", transition: "0.2s" }}>▼</span>

      </div>

      {open && (

        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--app-card)", border: "1.5px solid var(--app-border)", borderRadius: 12, boxShadow: "0 8px 32px rgba(var(--app-accent-rgb, 124, 58, 237),0.15)", zIndex: 999, overflow: "hidden" }}>

          <div style={{ padding: "10px 10px 6px" }}><div style={{ position: "relative" }}><span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12 }}></span><input autoFocus placeholder="Search client..." value={search} onChange={e => setSearch(e.target.value)} onClick={e => e.stopPropagation()} style={{ width: "100%", padding: "7px 10px 7px 30px", border: "1.5px solid var(--app-border)", borderRadius: 8, fontSize: 12, background: "var(--app-bg)", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} /></div></div>

          {onAddClient && <div onClick={() => { setOpen(false); setSearch(""); onAddClient(); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: "linear-gradient(90deg,var(--app-border),var(--app-bg))", borderBottom: "2px solid var(--app-border)" }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 17, fontWeight: 700, flexShrink: 0 }}>+</div><div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--app-accent)" }}>Add New Client</div></div></div>}



        </div>

      )}

      {open && <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={() => { setOpen(false); setSearch(""); }} />}

    </div>

  );

}





function ClientsPage({ clients, setClients, projects = [], setProjects, onAddClient, onViewProject, triggerCrop, onCreateProject, user, activeClientIdForReturn, onActiveClientIdRestored, newClientId, onNewClientShown, isFetching, invoices = [], tasks = [] }) {

  const mainScrollRef = useRef(null);

  const [search, setSearch] = useState("");

  const [filterMode, setFilterMode] = useState("all");
  const [sortMode, setSortMode] = useState("newest");

  const [activeClientId, setActiveClientId] = useState(() => {
    try {
      const saved = localStorage.getItem("activeClientId_subadmin");
      if (saved) return saved;
    } catch { }
    return clients?.[0]?._id || null;
  });

  // Keep the saved selection in sync so a page refresh (or re-login) reopens
  // the same client instead of falling back to the first one in the list.
  useEffect(() => {
    try {
      if (activeClientId) localStorage.setItem("activeClientId_subadmin", activeClientId);
      else localStorage.removeItem("activeClientId_subadmin");
    } catch { }
  }, [activeClientId]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [editClient, setEditClient] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [editForm, setEditForm] = useState({ companyName: "", email: "", phone: "", address: "", status: "Active", gstNumber: "", logoUrl: "", contactPersonName: "", contactPersonNo: "", password: "", category: "" });

  const [editErr, setEditErr] = useState({});

  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState("");

  const [statusDropOpen, setStatusDropOpen] = useState(false);



  const [showClientPass, setShowClientPass] = useState(false);

  const [viewClientModal, setViewClientModal] = useState(false);

  const [docUploading, setDocUploading] = useState(false);

  const statusDropRef = useRef(null);



  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };



  const filtered = clients.filter(c => {

    const q = search.toLowerCase();

    const matchQ = !search || (c.clientName || c.name || "").toLowerCase().includes(q) || (c.companyName || c.company || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q);

    const s = (c.status || "Active").toLowerCase();

    const matchF = filterMode === "all" || s === filterMode;

    return matchQ && matchF;

  }).sort((a, b) => {
    const da = new Date(a.createdAt || 0).getTime();
    const db = new Date(b.createdAt || 0).getTime();
    return sortMode === "newest" ? db - da : da - db;
  });



  const activeClient = clients.find(c => c._id === activeClientId) || filtered[0] || null;



  useEffect(() => {
    setIsLoading(false);
    // Only auto-select a client when none is selected yet (e.g. right after
    // the client list first loads), or when the currently selected client
    // was removed entirely from `clients`. Changing the card/tab filter
    // should narrow the visible list without touching which client's
    // details are currently shown.
    if (!activeClientId) {
      if (filtered.length > 0) setActiveClientId(filtered[0]._id);
      return;
    }
    const stillExists = clients.some(c => c._id === activeClientId);
    if (!stillExists) {
      setActiveClientId(filtered.length > 0 ? filtered[0]._id : null);
    }
  }, [clients]);

  // Restore exact client active before navigating to create/edit project
  useEffect(() => {
    if (activeClientIdForReturn) {
      setActiveClientId(activeClientIdForReturn);
      setActiveTab("overview");
      if (onActiveClientIdRestored) onActiveClientIdRestored();
    }
  }, [activeClientIdForReturn]);

  // Select newly added client immediately after add
  useEffect(() => {
    if (newClientId) {
      setActiveClientId(newClientId);
      setActiveTab("overview");
      setSearch("");
      if (onNewClientShown) onNewClientShown();
    }
  }, [newClientId]);



  useEffect(() => {

    const handler = (e) => {

      if (statusDropRef.current && !statusDropRef.current.contains(e.target)) setStatusDropOpen(false);

    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);

  }, []);



  const openEdit = (c) => {

    setEditForm({

      clientName: c.clientName || c.name || "",

      companyName: c.companyName || c.company || "",

      email: c.email || "",

      phone: c.phone || "",

      address: c.address || "",

      status: c.status || "Active",

      gstNumber: c.gstNumber || "",

      logoUrl: c.logoUrl || "",

      contactPersonName: c.contactPersonName || "",

      contactPersonNo: c.contactPersonNo || "",

      password: "",

      category: c.category || "",

      clientType: c.clientType || "b2b",

      source: c.source || "",

      onboardedOn: c.onboardedOn || "",

      city: c.city || "",

      state: c.state || "",

      pincode: c.pincode || "",

      country: c.country || "India",

      website: c.website || "",

      linkedin: c.linkedin || "",

      billingCurrency: c.billingCurrency || "INR — Indian Rupee",

      paymentTerms: c.paymentTerms || "",

      creditLimit: c.creditLimit || "",

      preferredPaymentMode: c.preferredPaymentMode || "",

      notes: c.notes || "",

      designation: c.designation || "",

      altEmail: c.altEmail || ""

    });

    setEditErr({});

    setEditClient(c);

  };



  const saveEdit = async () => {
    const errs = {};
    if (!editForm.companyName.trim()) errs.companyName = "Company name required";
    if (!editForm.email.trim()) errs.email = "Email required";
    if (Object.keys(errs).length) { setEditErr(errs); return; }

    try {
      setSaving(true);
      const res = await axios.put(`${BASE_URL}/api/clients/${editClient._id}`, editForm);
      const updated = { ...editClient, ...editForm, ...(res.data?.client || {}) };
      setClients(prev => prev.map(c => c._id === editClient._id ? updated : c));
      showToast("✅ Client updated successfully!");
    } catch (err) {
      console.error(err);
      const updated = { ...editClient, ...editForm };
      setClients(prev => prev.map(c => c._id === editClient._id ? updated : c));
      showToast("✅ Client updated locally!");
    } finally {
      setSaving(false);
      setEditClient(null);
    }
  };

  const doDelete = async () => {

    try { await axios.delete(`${BASE_URL}/api/clients/${deleteTarget._id}`); } catch { }

    setClients(prev => prev.filter(c => c._id !== deleteTarget._id));

    if (activeClientId === deleteTarget._id) setActiveClientId(null);

    setDeleteTarget(null);

    showToast("Delete Client deleted!");

  };



  const updateStatus = async (c, newStatus) => {

    try {

      await axios.put(`${BASE_URL}/api/clients/${c._id}`, { ...c, status: newStatus });

    } catch { }

    setClients(prev => prev.map(x => x._id === c._id ? { ...x, status: newStatus } : x));

    setStatusDropOpen(false);

    showToast(`Yes Status changed to ${newStatus}`);

  };



  const getStatusCfg = (status) => {

    const s = (status || "Active").toLowerCase();

    if (s === "active") return { bg: "#E8FAF3", color: "#26C281", dot: "#26C281", label: "Active" };

    if (s === "pending") return { bg: "#FEF5E6", color: "#F5A623", dot: "#F5A623", label: "Pending" };

    return { bg: "#F8FAFB", color: "#A0B8BE", dot: "#A0B8BE", label: "Inactive" };

  };



  const getAvatar = (c) => {

    const name = c.clientName || c.name || "?";

    return name.substring(0, 2).toUpperCase();

  };



  const getAvatarColor = (c, idx = 0) => {

    const colors = ["#F5A623", "#26C281", "#7C5CFC", "#2563EB", "#F05C5C", " var(--app-accent, var(--app-accent, #00BCD4))", "#E91E63"];

    const key = c._id || c.email || "";

    let hash = 0;

    for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);

    return colors[Math.abs(hash) % colors.length];

  };



  const clientProjects = activeClient ? projects.filter(p => {

    const cName = (activeClient.clientName || activeClient.name || "").toLowerCase();

    return (p.client || "").toLowerCase() === cName || (p.clientId === activeClient._id);

  }) : [];



  const activeSection = filtered.filter(c => (c.status || "Active").toLowerCase() === "active");

  const otherSection = filtered.filter(c => (c.status || "Active").toLowerCase() !== "active");



  const renderClientItem = (c) => {

    const st = getStatusCfg(c.status);

    const isActive = c._id === activeClientId;

    const color = getAvatarColor(c);

    const revenue = c.totalRevenue || c.revenue || 0;

    return (

      <div key={c._id} onClick={() => { setActiveClientId(c._id); setActiveTab("overview"); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", cursor: "pointer", transition: "all .15s", borderBottom: "1px solid rgba(224,238,240,.5)", position: "relative", background: isActive ? "var(--teal-lighter, #F0FDFE)" : "transparent", borderRight: isActive ? "3px solid  var(--app-accent, var(--app-accent, #00BCD4))" : "3px solid transparent" }} onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--teal-lighter, #F0FDFE)"; }} onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>

        <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${color},${color}bb)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0, position: "relative" }}>

          {c.logoUrl ? <img src={c.logoUrl} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "contain", background: "#fff" }} /> : getAvatar(c)}

          <div style={{ position: "absolute", bottom: 1, right: 1, width: 10, height: 10, borderRadius: "50%", background: st.dot, border: "1.5px solid #fff" }} />

        </div>

        <div style={{ flex: 1, minWidth: 0 }}>

          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A2E35", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.clientName || c.name || "—"}</div>

          <div style={{ fontSize: 11, color: "#A0B8BE", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.companyName || c.company || "—"}</div>

        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>



          <div style={{ width: 8, height: 8, borderRadius: "50%", background: st.dot }} />

        </div>

      </div>

    );

  };



  const renderOverview = () => {

    if (!activeClient) return null;

    const cProjs = clientProjects.slice(0, 5);

    return (

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Contact Info */}

        <div style={{ background: "#fff", border: "1.5px solid #E0EEF0", borderRadius: 14, overflow: "hidden" }}>

          <div style={{ padding: "13px 16px", borderBottom: "1px solid #E0EEF0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

            <span style={{ fontSize: 12, fontWeight: 800, color: "#1A2E35", display: "flex", alignItems: "center", gap: 8 }}>

              <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--teal-light, var(--teal-light, #E0F7FA))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: " var(--app-accent, var(--app-accent, #00BCD4))" }}><i className="ti ti-user-circle" /></div>

              Contact Information

            </span>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>

              <span onClick={() => setViewClientModal(true)} style={{ fontSize: 11, color: "var(--app-accent)", fontWeight: 700, cursor: "pointer" }}>View</span>



            </div>

          </div>

          <div style={{ padding: "14px 16px" }}>

            {[

              { icon: "ti-mail", label: "Email Address", val: activeClient.email, bg: "var(--teal-light, var(--teal-light, #E0F7FA))", col: " var(--app-accent, var(--app-accent, #00BCD4))" },

              { icon: "ti-user", label: "Contact Person Name", val: activeClient.contactPersonName || "—", bg: "var(--teal-light, var(--teal-light, #E0F7FA))", col: " var(--app-accent, var(--app-accent, #00BCD4))" },

              { icon: "ti-user", label: "Contact Person No", val: activeClient.contactPersonNo || "—", bg: "var(--teal-light, var(--teal-light, #E0F7FA))", col: " var(--app-accent, var(--app-accent, #00BCD4))" },

              { icon: "ti-briefcase", label: "Category", val: activeClient.category || activeClient.industry || "—", bg: "#F3E8FF", col: "#7C5CFC" },

              { icon: "ti-phone", label: "Office Phone", val: activeClient.phone || "—", bg: "var(--teal-light, var(--teal-light, #E0F7FA))", col: " var(--app-accent, var(--app-accent, #00BCD4))" },

              { icon: "ti-building-bank", label: "Company Tax / GST", val: activeClient.gstNumber || "—", bg: "#EFF4FF", col: "#2563EB" },

              { icon: "ti-toggle-right", label: "Status", val: activeClient.status || "Active", bg: "#E8FAF3", col: "#26C281" },

              { icon: "ti-map-pin", label: "Company Address", val: activeClient.address, bg: "#FEF5E6", col: "#F5A623" },



            ].filter(Boolean).map((row, i) => (

              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < 4 ? 10 : 0 }}>

                <div style={{ width: 30, height: 30, borderRadius: 8, background: row.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: row.col, flexShrink: 0 }}><i className={`ti ${row.icon}`} /></div>

                <div><div style={{ fontSize: 10, color: "#A0B8BE", fontWeight: 600 }}>{row.label}</div><div style={{ fontSize: 12, fontWeight: 700, color: "#1A2E35", marginTop: 1 }}>{row.val || "—"}</div></div>

              </div>

            ))}

          </div>

        </div>



        {/* Projects */}

        <div style={{ background: "#fff", border: "1.5px solid #E0EEF0", borderRadius: 14, overflow: "hidden" }}>

          <div style={{ padding: "13px 16px", borderBottom: "1px solid #E0EEF0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

            <span style={{ fontSize: 12, fontWeight: 800, color: "#1A2E35", display: "flex", alignItems: "center", gap: 8 }}>

              <div style={{ width: 26, height: 26, borderRadius: 7, background: "#EFF4FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#2563EB" }}><i className="ti ti-briefcase" /></div>

              Projects

            </span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => onCreateProject && onCreateProject(activeClient)} style={{ background: " var(--app-accent, var(--app-accent, #00BCD4))", border: "none", borderRadius: 7, padding: "4px 10px", fontSize: 11, color: "#fff", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                <i className="ti ti-plus" style={{ fontSize: 11 }} /> Add Project
              </button>
              <span onClick={() => setActiveTab("projects")} style={{ fontSize: 11, color: "var(--app-accent)", fontWeight: 700, cursor: "pointer" }}>View all</span>
            </div>



          </div>

          <div style={{ padding: "14px 16px" }}>

            {cProjs.length === 0 ? (

              <div style={{ textAlign: "center", color: "#A0B8BE", fontSize: 12, padding: "20px 0" }}>

              </div>

            ) : cProjs.map((p, i) => {

              const projTasks = tasks.filter(t => !t.isDeleted && (t.projectId === p._id || (t.projectId && t.projectId._id === p._id) || t.project === p.name));
              const doneProjTasks = projTasks.filter(t => t.status === 'done' || t.status === 'completed').length;
              const milestones = p.milestones || [];
              const doneMilestones = milestones.filter(m => m.done === true).length;
              const pct = milestones.length > 0
                ? Math.round((doneMilestones / milestones.length) * 100)
                : projTasks.length > 0
                  ? Math.round((doneProjTasks / projTasks.length) * 100)
                  : (p.progress || 0);

              return (

                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < cProjs.length - 1 ? "1px solid #E0EEF0" : "none" }}>

                  <div style={{ width: 4, height: 36, borderRadius: 2, background: " var(--app-accent, var(--app-accent, #00BCD4))", flexShrink: 0 }} />

                  <div style={{ flex: 1, minWidth: 0 }}>

                    <div

                      onClick={() => onViewProject && onViewProject(p)}

                      style={{ fontSize: 12, fontWeight: 700, color: "#1A2E35", cursor: "pointer" }}

                    >

                      {p.name}

                    </div>

                    <div style={{ fontSize: 10, color: "#A0B8BE", marginTop: 1 }}>{p.type || p.status}</div>

                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>

                    <div style={{ textAlign: "right", marginRight: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--app-accent)" }}>{pct}%</div>

                      <div style={{ width: 60, height: 4, background: "#E0EEF0", borderRadius: 2, overflow: "hidden", marginTop: 4 }}>

                        <div style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, var(--app-accent, var(--app-accent, #00BCD4)),#26D0CE)", width: `${pct}%` }} />

                      </div>

                    </div>

                    <button onClick={() => onCreateProject && onCreateProject(p, true)} style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 6, padding: "4px 8px", fontSize: 10, color: "#F59E0B", cursor: "pointer", fontWeight: 700 }}>Edit</button>

                    <button onClick={() => onViewProject && onViewProject(p)} style={{ background: "var(--teal-light, var(--teal-light, #E0F7FA))", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 10, color: " var(--app-accent, var(--app-accent, #00BCD4))", cursor: "pointer", fontWeight: 700 }}>View </button>

                    <button onClick={async (e) => {

                      e.stopPropagation();

                      if (!window.confirm(`Are you sure you want to delete "${p.name}"?`)) return;

                      try {

                        await axios.delete(`${BASE_URL}/api/projects/${p._id}`);

                        setProjects && setProjects(prev => prev.filter(proj => proj._id !== p._id));

                        showToast(" Project deleted!");

                      } catch (err) {

                        showToast("❌ Delete failed!");

                      }

                    }} style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#EF4444", cursor: "pointer", fontWeight: 700 }}>Delete</button>

                  </div>

                </div>

              );

            })}

          </div>

        </div>

      </div>

    );

  };



  const renderProjects = () => (

    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* Header with Add Project button */}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>

        <button onClick={() => onCreateProject && onCreateProject(activeClient)} style={{ background: " var(--app-accent, var(--app-accent, #00BCD4))", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, color: "#fff", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>

          <i className="ti ti-plus" style={{ fontSize: 13 }} /> Add Project

        </button>

      </div>

      {clientProjects.length === 0 ? (

        <div style={{ textAlign: "center", padding: 40, color: "#A0B8BE" }}>No projects for this client</div>

      ) : clientProjects.map((p, i) => (

        <div key={i} style={{ background: "#fff", border: "1.5px solid #E0EEF0", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>

          <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--teal-light, var(--teal-light, #E0F7FA))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📁</div>

          <div style={{ flex: 1 }}>

            <div

              onClick={() => onViewProject && onViewProject(p)}

              style={{ fontSize: 13, fontWeight: 700, color: "#1A2E35", cursor: "pointer" }}

            >

              {p.name}

            </div>

            <div style={{ fontSize: 11, color: "#A0B8BE", marginTop: 2 }}> {p.end ? new Date(p.end).toLocaleDateString("en-IN") : "No deadline"}</div>

          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

            <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#E8FAF3", color: "#26C281" }}>{p.status || "Active"}</span>

            {onViewProject && <button onClick={() => onViewProject(p)} style={{ background: "var(--teal-light, var(--teal-light, #E0F7FA))", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: " var(--app-accent, var(--app-accent, #00BCD4))", cursor: "pointer", fontWeight: 700 }}>View </button>}

            <button onClick={() => onCreateProject && onCreateProject(p, true)} style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#F59E0B", cursor: "pointer", fontWeight: 700 }}>Edit</button>

            <button onClick={async (e) => {

              e.stopPropagation();

              if (!window.confirm(`Are you sure you want to delete "${p.name}"?`)) return;

              try {

                await axios.delete(`${BASE_URL}/api/projects/${p._id}`);

                setProjects && setProjects(prev => prev.filter(proj => proj._id !== p._id));

                showToast(" Project deleted!");

              } catch (err) {

                showToast("❌ Delete failed!");

              }

            }} style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#EF4444", cursor: "pointer", fontWeight: 700 }}>Delete</button>

          </div>

        </div>

      ))}

    </div>

  );



  const renderDocuments = () => {

    const docs = activeClient?.documents || activeClient?.docs || [];



    const handleUpload = async (e) => {

      const file = e.target.files[0];

      if (!file) return;

      setDocUploading(true);

      try {

        // Convert file to base64

        const reader = new FileReader();

        reader.onloadend = async () => {

          const base64 = reader.result;

          const newDoc = {

            name: file.name,

            fileName: file.name,

            type: file.type,

            size: (file.size / 1024).toFixed(1) + " KB",

            url: base64,

            uploadedAt: new Date().toISOString()

          };



          const existingDocs = activeClient?.documents || [];

          const updatedDocs = [...existingDocs, newDoc];



          // Use existing PUT endpoint

          try {

            await axios.put(

              `${BASE_URL}/api/clients/${activeClient._id}`,
              { documents: updatedDocs }
            );
            const savedClient = res.data?.client;
            setActiveClient(prev => savedClient ? savedClient : { ...prev, documents: updatedDocs });
            setClients(prev => prev.map(c => c._id === activeClient._id ? (savedClient || { ...c, documents: updatedDocs }) : c));

          } catch (err) {

            console.log("API save failed, saving locally");

          }



          // Update local state

          setClients(prev => prev.map(c =>

            c._id === activeClient._id

              ? { ...c, documents: updatedDocs }

              : c

          ));



          showToast("Yes Document uploaded!");

          setDocUploading(false);

        };

        reader.onerror = () => {

          showToast("❌ Failed to read file!");

          setDocUploading(false);

        };

        reader.readAsDataURL(file);

      } catch (err) {

        showToast("❌ Upload failed!");

        setDocUploading(false);

      }

    };

    return (

      <div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>

          <label style={{

            background: " var(--app-accent, var(--app-accent, #00BCD4))", border: "none", borderRadius: 8,

            padding: "7px 14px", fontSize: 12, color: "#fff", cursor: "pointer",

            fontWeight: 700, display: "flex", alignItems: "center", gap: 5

          }}>

            <i className="ti ti-upload" style={{ fontSize: 13 }} />

            {docUploading ? "Uploading..." : "Upload Document"}

            <input

              type="file"

              style={{ display: "none" }}

              onChange={handleUpload}

              disabled={docUploading}

            />

          </label>

        </div>

        {docs.length === 0 ? (

          <div style={{ textAlign: "center", padding: 40, color: "#A0B8BE", fontSize: 12 }}>

            <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>

            No documents uploaded yet

          </div>

        ) : (

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>

            {docs.map((d, i) => (

              <div key={i} style={{

                padding: 12, background: "#F5FAFA",

                border: "1.5px solid #E0EEF0", borderRadius: 10, cursor: "pointer"

              }}>

                <div style={{ fontSize: 22, marginBottom: 8 }}>📄</div>

                <div style={{ fontSize: 11, fontWeight: 700, color: "#1A2E35" }}>

                  {d.name || d.fileName || "Document"}

                </div>

                <div style={{ fontSize: 10, color: "#A0B8BE", marginTop: 2 }}>

                  {d.size || d.type || "—"}

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    );

  };



  const renderActivity = () => {

    const activity = [

      { icon: "ti-user-plus", bg: "var(--teal-light, var(--teal-light, #E0F7FA))", color: " var(--app-accent, var(--app-accent, #00BCD4))", title: `<b>${activeClient?.clientName || activeClient?.name}</b> added as client`, time: activeClient?.createdAt ? new Date(activeClient.createdAt).toLocaleDateString("en-IN") : "—" },

      ...clientProjects.map(p => ({ icon: "ti-briefcase", bg: "#EFF4FF", color: "#2563EB", title: `Project <b>${p.name}</b> created`, time: p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN") : "—" })),

    ];

    return (

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

        {activity.map((a, i) => (

          <div key={i} style={{ display: "flex", gap: 12, paddingBottom: 14 }}>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>

              <div style={{ width: 30, height: 30, borderRadius: "50%", background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: a.color }}><i className={`ti ${a.icon}`} /></div>

              {i < activity.length - 1 && <div style={{ width: 2, background: "#E0EEF0", flex: 1, margin: "4px 0", minHeight: 12 }} />}

            </div>

            <div>

              <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2E35", lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: a.title }} />
              <div style={{ fontSize: 10, color: "#A0B8BE", marginTop: 2 }}>{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    );

  };

  const renderPortal = () => {
    const c = activeClient;
    if (!c) return null;
    const portalUrl = `/client-portal/${c._id}`;

    // Build a token once and reuse it everywhere — token grants auto-login
    // so the client doesn't need to manually sign in, and it's what makes
    // the data (projects/tasks/invoices/etc.) actually load on their side.
    const buildPortalTokenUrl = async () => {
      const subadminCompanyId = user?.companyId || user?._id || user?.id || "";
      const res = await axios.post(`${BASE_URL}/api/clients/${c._id}/portal-token`, {
        companyId: subadminCompanyId,
        agencyName: user?.companyName || user?.name || "",
      });
      return `${window.location.origin}/client-portal/${c._id}?token=${res.data.token}`;
    };

    const handleOpenPortal = async () => {
      const url = await buildPortalTokenUrl();
      window.open(url, "_blank");
    };

    const handleCopyLink = async () => {
      const url = await buildPortalTokenUrl();
      navigator.clipboard.writeText(url);
      showToast("📋 Portal link copied!");
    };

    const handleShareWhatsApp = async () => {
      const url = await buildPortalTokenUrl();
      const text = `Hi ${c.clientName || c.name},\n\nYou can access your client portal here:\n${url}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
    };

    const handleSendEmail = async () => {
      const url = await buildPortalTokenUrl();
      const subject = `Your Client Portal Access - ${c.clientName || c.name}`;
      const body = `Hi ${c.clientName || c.name},\n\nYou can access your client portal here:\n${url}\n\nBest regards`;
      window.open(`mailto:${c.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    };

    return (
      <div>
        {/* Portal Hero Card */}
        <div style={{ background: "linear-gradient(135deg,#004D5E, var(--app-accent, var(--app-accent, #00BCD4)))", borderRadius: 14, padding: 20, color: "#fff", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              🌐
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, opacity: .6, textTransform: "uppercase", letterSpacing: .6 }}>Client Portal</div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{c.clientName || c.name}</div>
            </div>
          </div>

          {/* Portal URL display */}
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "8px 12px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontSize: 10, opacity: .8, wordBreak: "break-all", flex: 1, fontFamily: "monospace" }}>{portalUrl}</div>
            <button
              onClick={handleCopyLink}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "4px 8px", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}
            >
              Copy
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button
              onClick={handleOpenPortal}
              style={{ padding: "10px 8px", background: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#004D5E", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
            >
              <i className="ti ti-external-link" style={{ fontSize: 13 }} /> Open Portal
            </button>
            <button
              onClick={handleCopyLink}
              style={{ padding: "10px 8px", background: "rgba(255,255,255,.15)", border: "1.5px solid rgba(255,255,255,.25)", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
            >
              <i className="ti ti-copy" style={{ fontSize: 13 }} /> Copy Link
            </button>
            <button
              onClick={handleShareWhatsApp}
              style={{ padding: "10px 8px", background: "#25D366", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
            >
              💬 WhatsApp
            </button>
            <button
              onClick={handleSendEmail}
              style={{ padding: "10px 8px", background: "rgba(255,255,255,.15)", border: "1.5px solid rgba(255,255,255,.25)", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
            >
              <i className="ti ti-mail" style={{ fontSize: 13 }} /> Email Link
            </button>
          </div>
        </div>

        {/* Portal Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { val: clientProjects.length, label: "Projects", icon: "ti-briefcase", color: " var(--app-accent, var(--app-accent, #00BCD4))" },
            { val: clientProjects.filter(p => (p.status || "").toLowerCase() === "completed").length, label: "Completed", icon: "ti-check", color: "#26C281" },
            { val: c.status || "Active", label: "Status", icon: "ti-toggle-right", color: "#F5A623" }
          ].map((s, i) => (
            <div key={i} style={{ padding: "12px", background: "#fff", borderRadius: 9, border: "1.5px solid #E0EEF0", textAlign: "center" }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 18, color: s.color, display: "block", marginBottom: 4 }} />
              <div style={{ fontSize: 17, fontWeight: 800, color: "#1A2E35" }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "#A0B8BE", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Portal Access Info */}
        <div style={{ background: "var(--teal-lighter, #F0FDFE)", border: "1.5px solid #B2EBF2", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#004D5E", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-info-circle" style={{ fontSize: 14 }} /> Portal Access Info
          </div>
          <div style={{ fontSize: 11, color: "#607D86", lineHeight: 1.6 }}>
            <div>📧 Login Email: <strong>{c.email || "Not set"}</strong></div>
            <div>🔐 Password: Set during client registration</div>
            <div>🌐 Portal URL: <span style={{ fontFamily: "monospace", fontSize: 10 }}>{portalUrl}</span></div>
          </div>
        </div>
      </div>
    );
  };


  const renderTabContent = () => {

    if (activeTab === "overview") return renderOverview();

    if (activeTab === "projects") return renderProjects();

    if (activeTab === "documents") return renderDocuments();

    if (activeTab === "activity") return renderActivity();

    if (activeTab === "portal") return renderPortal();

    if (activeTab === "feedback") return renderFeedback();

    return <div style={{ padding: 40, textAlign: "center", color: "#A0B8BE" }}>Coming soon...</div>;

  };

  const [clientFeedback, setClientFeedback] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "feedback" && activeClientId) {
      const activeC = clients.find(c => c._id === activeClientId);
      if (!activeC) return;
      setFeedbackLoading(true);
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      axios.get(`${BASE_URL}/api/clients/feedback`, {
        headers: { 'x-company-id': currentUser.companyId || "" }
      }).then(res => {
        const clientName = activeC.clientName || activeC.name;
        const filtered = (res.data || []).filter(f => f.clientName === clientName);
        setClientFeedback(filtered);
      }).catch(err => console.error(err))
        .finally(() => setFeedbackLoading(false));
    }
  }, [activeTab, activeClientId]);

  const renderFeedback = () => {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#1A2332", marginBottom: 16 }}>Client Feedback</div>
        {feedbackLoading ? (
          <div style={{ color: "#A0B8BE", textAlign: "center", padding: 30 }}>Loading...</div>
        ) : clientFeedback.length === 0 ? (
          <div style={{ color: "#A0B8BE", textAlign: "center", padding: 30 }}>No feedback submitted yet.</div>
        ) : (
          clientFeedback.map((fb, i) => (
            <div key={fb._id || i} style={{ background: "#fff", border: "1.5px solid #E0EEF0", borderRadius: 12, padding: 16, marginBottom: 12 }}>

              <div style={{ fontSize: 13, color: "#4A5568", marginBottom: 8 }}>{fb.message || "—"}</div>
              <div style={{ fontSize: 11, color: "#A0B8BE" }}>{fb.createdAt ? new Date(fb.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</div>
            </div>
          ))
        )}
      </div>
    );
  };

  const st = getStatusCfg(activeClient?.status);

  const acColor = getAvatarColor(activeClient || {});

  const cRevenue = (invoices || [])
    .filter(inv => inv.client === activeClient?.clientName)
    .reduce((sum, inv) => sum + (Number(inv.amountPaid) || 0), 0);





  const totalClients = clients.length;
  const activeClientsCount = clients.filter(c => (c.status || "Active").toLowerCase() === "active").length;
  const inactiveClientsCount = clients.filter(c => (c.status || "").toLowerCase() === "inactive").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "auto", background: "linear-gradient(135deg,var(--app-bg) 0%,var(--app-bg) 100%)", padding: "24px 28px" }}>
      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#fff", border: "1.5px solid #22c55e", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#22c55e", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>{toast}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1A2332", margin: 0 }}>Clients</h1>
        <button className="create-btn" onClick={onAddClient} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-plus"></i> New Client
        </button>
      </div>

      {/* STAT PILLS — matches Projects page style */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div onClick={() => setFilterMode("all")} style={{ cursor: "pointer", flex: "1 1 200px", minWidth: 200, background: "#fff", border: "1.5px solid #E0EEF0", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(0,188,212,0.1)", color: "var(--app-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}><i className="ti ti-users" /></div>
          <div><div style={{ fontSize: 24, fontWeight: 800, color: "#1A2332" }}>{totalClients}</div><div style={{ fontSize: 12, fontWeight: 700, color: "#607D86" }}>All Clients</div></div>
        </div>
        <div onClick={() => setFilterMode("active")} style={{ cursor: "pointer", flex: "1 1 200px", minWidth: 200, background: "#fff", border: "1.5px solid #E0EEF0", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(22,163,74,0.1)", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}><i className="ti ti-user-check" /></div>
          <div><div style={{ fontSize: 24, fontWeight: 800, color: "#1A2332" }}>{activeClientsCount}</div><div style={{ fontSize: 12, fontWeight: 700, color: "#607D86" }}>Active</div></div>
        </div>
        <div onClick={() => setFilterMode("inactive")} style={{ cursor: "pointer", flex: "1 1 200px", minWidth: 200, background: "#fff", border: "1.5px solid #E0EEF0", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(220,38,38,0.1)", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}><i className="ti ti-user-off" /></div>
          <div><div style={{ fontSize: 24, fontWeight: 800, color: "#1A2332" }}>{inactiveClientsCount}</div><div style={{ fontSize: 12, fontWeight: 700, color: "#607D86" }}>Inactive</div></div>
        </div>
      </div>







      {/* LEFT-PANEL + DETAIL VIEW (always visible, embedded below stat cards) */}
      <div style={{ display: "flex", position: "relative", flex: 1, minHeight: 500, background: "#fff", marginTop: 4, border: "1.5px solid #E0EEF0", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ width: 260, minWidth: 260, borderRight: "1.5px solid #E0EEF0", display: "flex", flexDirection: "column", background: "#fff", overflow: "hidden" }}>

          {/* Search + Add */}
          <div style={{ padding: "14px 12px 8px", borderBottom: "1px solid #E0EEF0", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <i className="ti ti-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#A0B8BE" }} />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px 8px 30px", border: "1.5px solid #E0EEF0", borderRadius: 9, fontSize: 12, outline: "none", background: "#F5FAFA", color: "#1A2E35", boxSizing: "border-box" }}
                />
              </div>

            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 4 }}>
              {["all", "active", "inactive"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilterMode(f)}
                  style={{ flex: 1, padding: "5px 4px", borderRadius: 7, border: "none", fontSize: 10, fontWeight: 700, cursor: "pointer", background: "var(--teal-lighter, #F0FDFE)", color: "#607D86", textTransform: "capitalize" }}
                >
                  {f === "all" ? `All (${clients.length})` : f === "active" ? `Active (${clients.filter(c => (c.status || "Active").toLowerCase() === "active").length})` : `Inactive (${clients.filter(c => (c.status || "").toLowerCase() === "inactive").length})`}
                </button>
              ))}
            </div>
          </div>

          {/* Client List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {isLoading ? (
              <div style={{ padding: 20, textAlign: "center", color: "#A0B8BE", fontSize: 12 }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
                <div style={{ fontSize: 12, color: "#A0B8BE", fontWeight: 600 }}>No clients found</div>

              </div>
            ) : (
              <>
                {activeSection.length > 0 && (
                  <>
                    <div style={{ padding: "8px 14px 4px", fontSize: 9, fontWeight: 800, color: "#A0B8BE", letterSpacing: 1, textTransform: "uppercase" }}>Active ({activeSection.length})</div>
                    {activeSection.map(c => renderClientItem(c))}
                  </>
                )}
                {otherSection.length > 0 && (
                  <>
                    <div style={{ padding: "8px 14px 4px", fontSize: 9, fontWeight: 800, color: "#A0B8BE", letterSpacing: 1, textTransform: "uppercase" }}>Others ({otherSection.length})</div>
                    {otherSection.map(c => renderClientItem(c))}
                  </>
                )}
              </>
            )}
          </div>
        </div>






        {/* ── DETAIL PANEL ── */}

        {activeClient ? (

          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>



            {/* HERO */}

            <div style={{ background: "#fff", borderBottom: "1.5px solid #E0EEF0", padding: "20px 28px", flexShrink: 0 }}>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>

                <div style={{ width: 64, height: 64, borderRadius: "50%", background: activeClient.logoUrl ? "#f1f5f9" : `linear-gradient(135deg,${acColor || "#00BCD4"},${acColor || "#0097A7"})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#fff", flexShrink: 0, position: "relative", boxShadow: "0 4px 14px rgba(0,0,0,.15)", overflow: "hidden" }}>

                  {activeClient.logoUrl ? <img src={activeClient.logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : getAvatar(activeClient)}

                  <div style={{ position: "absolute", bottom: 2, right: 2, width: 16, height: 16, borderRadius: "50%", background: st.dot, border: "2px solid #fff" }} />

                </div>

                <div style={{ flex: 1, minWidth: 0 }}>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>

                    <div style={{ fontSize: 20, fontWeight: 900, color: "#1A2E35", letterSpacing: "-.3px" }}>{activeClient.clientName || activeClient.name || "—"}</div>

                    {/* Status badge with dropdown */}

                    <div style={{ position: "relative" }} ref={statusDropRef}>

                      <button onClick={() => setStatusDropOpen(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 11px 5px 9px", background: st.bg, border: `1.5px solid ${st.dot}`, borderRadius: 20, fontSize: 11, fontWeight: 800, color: st.color, cursor: "pointer", fontFamily: "inherit" }}>

                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: st.dot, display: "inline-block" }} />

                        {st.label}

                        <i className="ti ti-chevron-down" style={{ fontSize: 11, opacity: .7 }} />

                      </button>

                      {statusDropOpen && (

                        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#fff", border: "1.5px solid #E0EEF0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 100, minWidth: 160, overflow: "hidden" }}>

                          <div style={{ padding: "6px 12px 4px", fontSize: 9, fontWeight: 700, color: "#A0B8BE", textTransform: "uppercase", letterSpacing: .7, background: "#F8FAFB", borderBottom: "1px solid #E0EEF0" }}>Set Client Status</div>

                          {["Active", "Inactive"].map(s => {

                            const sc = getStatusCfg(s);

                            const isCurrentStatus = (activeClient.status || "Active") === s;

                            return (

                              <div key={s} onClick={() => updateStatus(activeClient, s)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700, color: sc.color, background: isCurrentStatus ? sc.bg : "transparent", transition: "background .12s" }} onMouseEnter={e => e.currentTarget.style.background = sc.bg} onMouseLeave={e => e.currentTarget.style.background = isCurrentStatus ? sc.bg : "transparent"}>

                                <span style={{ width: 9, height: 9, borderRadius: "50%", background: sc.dot, display: "inline-block" }} />

                                <span style={{ flex: 1 }}>{s}</span>

                                {isCurrentStatus && <i className="ti ti-check" style={{ fontSize: 13, opacity: .8 }} />}

                              </div>

                            );

                          })}

                        </div>

                      )}

                    </div>





                  </div>

                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>

                    {activeClient.address && <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "var(--teal-light, var(--teal-light, #E0F7FA))", color: " var(--app-accent, var(--app-accent, #00BCD4))" }}><i className="ti ti-map-pin" style={{ fontSize: 10, marginRight: 2 }} />{activeClient.address}</span>}

                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#F8FAFB", color: "#A0B8BE" }}><i className="ti ti-clock" style={{ fontSize: 10, marginRight: 2 }} />Joined {activeClient.createdAt ? new Date(activeClient.createdAt).toLocaleDateString("en-IN") : "—"}</span>

                  </div>

                </div>

                <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>

                  <button onClick={() => openEdit(activeClient)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .15s", border: "1.5px solid #E0EEF0", background: "#F5FAFA", color: "#607D86" }} onMouseEnter={e => { e.currentTarget.style.borderColor = " var(--app-accent, var(--app-accent, #00BCD4))"; e.currentTarget.style.color = " var(--app-accent, var(--app-accent, #00BCD4))"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#E0EEF0"; e.currentTarget.style.color = "#607D86"; }}><i className="ti ti-edit" style={{ fontSize: 13 }} />Edit</button>

                  <button onClick={() => setDeleteTarget(activeClient)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .15s", border: "1.5px solid #E0EEF0", background: "#F5FAFA", color: "#607D86" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#F05C5C"; e.currentTarget.style.color = "#F05C5C"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#E0EEF0"; e.currentTarget.style.color = "#607D86"; }}><i className="ti ti-trash" style={{ fontSize: 13 }} />Delete</button>

                </div>

              </div>



              {/* Stats bar */}

              <div style={{ display: "flex", gap: 0, background: "#F5FAFA", border: "1.5px solid #E0EEF0", borderRadius: 10, overflow: "hidden" }}>

                {[

                  { val: cRevenue ? "Rs." + Number(cRevenue).toLocaleString("en-IN") : "Rs.0", label: "Total Revenue", color: " var(--app-accent, var(--app-accent, #00BCD4))" },
                  { val: clientProjects.length, label: "Projects" },
                  { val: invoices.filter(inv => (inv.clientId === activeClient?._id) || (inv.clientName === (activeClient?.clientName || activeClient?.name))).length, label: "Invoices" },
                  { val: (activeClient?.documents?.length || 0), label: "Documents" },

                ].map((s, i, arr) => (

                  <div key={i} style={{ flex: 1, padding: "10px 14px", textAlign: "center", borderRight: i < arr.length - 1 ? "1px solid #E0EEF0" : "none" }}>

                    <div style={{ fontSize: 17, fontWeight: 900, color: s.color || "#1A2E35", letterSpacing: "-.3px" }}>{s.val}</div>

                    <div style={{ fontSize: 10, color: "#A0B8BE", fontWeight: 600, marginTop: 2, textTransform: "uppercase", letterSpacing: .4 }}>{s.label}</div>

                  </div>

                ))}

              </div>

            </div>



            {/* TABS */}

            <div style={{ background: "#fff", borderBottom: "1.5px solid #E0EEF0", padding: "0 28px", display: "flex", flexShrink: 0, overflowX: "auto" }}>

              {[

                { key: "overview", icon: "ti-layout-dashboard", label: "Overview" },

                { key: "projects", icon: "ti-briefcase", label: "Projects" },

                { key: "documents", icon: "ti-files", label: "Documents" },

                { key: "portal", icon: "ti-globe", label: "Portal" },

                { key: "activity", icon: "ti-history", label: "Activity" },

                { key: "feedback", icon: "ti-star", label: "Feedback" },

              ].map(tab => (

                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: activeTab === tab.key ? " var(--app-accent, var(--app-accent, #00BCD4))" : "#607D86", cursor: "pointer", border: "none", background: "none", fontFamily: "inherit", borderBottom: `2.5px solid ${activeTab === tab.key ? " var(--app-accent, var(--app-accent, #00BCD4))" : "transparent"}`, transition: "all .15s", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5 }}>

                  <i className={`ti ${tab.icon}`} style={{ fontSize: 14 }} />{tab.label}

                </button>

              ))}

            </div>



            {/* TAB CONTENT */}

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>

              {renderTabContent()}

            </div>

          </div>
        ) : isLoading ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--app-bg)", minWidth: 0 }}>
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ width: 48, height: 48, border: "4px solid #E0EEF0", borderTop: "4px solid  var(--app-accent, var(--app-accent, #00BCD4))", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
              <div style={{ fontSize: 13, color: "#A0B8BE", fontWeight: 600 }}>Loading clients...</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--app-bg)", minWidth: 0 }}>
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(var(--app-accent-rgb), 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                <i className="ti ti-users" style={{ color: "var(--app-accent)", fontSize: 32 }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--app-text)", marginBottom: 8 }}>No clients found</div>


            </div>
          </div>
        )}



      </div>

      {/* Edit Modal */}

      {editClient && (

        <AddClientView

          editData={editClient}

          onBack={() => setEditClient(null)}

          onClientUpdated={(updatedClient) => {

            setClients(prev => prev.map(c => c._id === updatedClient._id ? updatedClient : c));

            setEditClient(null);

          }}

          user={user}

        />

      )}



      {deleteTarget && <ConfirmModal title="Delete Client" message={`Are you sure you want to delete "${deleteTarget.clientName || deleteTarget.name}"?`} onConfirm={doDelete} onCancel={() => setDeleteTarget(null)} />}

      {viewClientModal && activeClient && (

        <Mdl title="Client Details" onClose={() => setViewClientModal(false)} maxWidth={600}>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>

              {activeClient.logoUrl ? (

                <img src={activeClient.logoUrl} alt="logo" style={{ width: 80, height: 80, borderRadius: 16, objectFit: "contain", background: "#fff", border: "2px solid #E0EEF0" }} />

              ) : (

                <div style={{ width: 80, height: 80, borderRadius: 16, background: `linear-gradient(135deg,${getAvatarColor(activeClient)},${getAvatarColor(activeClient)}bb)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "#fff" }}>

                  {getAvatar(activeClient)}

                </div>

              )}

            </div>

            {[

              { icon: "ti-user", label: "Client Name", val: activeClient.clientName || activeClient.name || "—" },

              { icon: "ti-category", label: "Client Type", val: activeClient.clientType ? (activeClient.clientType === "b2b" ? "B2B — Company / Business" : activeClient.clientType === "b2c" ? "B2C — Individual Person" : "Freelancer — Consultant / Solo") : "—" },

              { icon: "ti-building", label: "Company Name", val: activeClient.companyName || activeClient.company || "—" },

              { icon: "ti-tag", label: "Category", val: activeClient.category || "—" },

              { icon: "ti-building-bank", label: "GST Number", val: activeClient.gstNumber || "—" },

              { icon: "ti-source", label: "Client Source", val: activeClient.source || "—" },

              { icon: "ti-calendar-event", label: "Onboarded On", val: activeClient.onboardedOn ? new Date(activeClient.onboardedOn).toLocaleDateString("en-IN") : "—" },

              { icon: "ti-toggle-right", label: "Status", val: activeClient.status || "Active" },

              { icon: "ti-user-circle", label: "Contact Person", val: activeClient.contactPersonName || "—" },

              { icon: "ti-briefcase", label: "Designation", val: activeClient.designation || "—" },

              { icon: "ti-mail", label: "Email", val: activeClient.email || "—" },

              { icon: "ti-mail-forward", label: "Alt. Email", val: activeClient.altEmail || "—" },

              { icon: "ti-phone-call", label: "Contact Person Mobile", val: activeClient.contactPersonNo || "—" },

              { icon: "ti-phone", label: "Office Phone", val: activeClient.phone || "—" },

              { icon: "ti-map-pin", label: "Street / Building Address", val: activeClient.address || "—" },

              { icon: "ti-map", label: "City", val: activeClient.city || "—" },

              { icon: "ti-map-2", label: "State", val: activeClient.state || "—" },

              { icon: "ti-hash", label: "Pincode", val: activeClient.pincode || "—" },

              { icon: "ti-world", label: "Country", val: activeClient.country || "—" },

              { icon: "ti-globe", label: "Website", val: activeClient.website || "—" },

              { icon: "ti-brand-linkedin", label: "LinkedIn", val: activeClient.linkedin || "—" },

              { icon: "ti-coin", label: "Billing Currency", val: activeClient.billingCurrency || "—" },

              { icon: "ti-credit-card", label: "Payment Terms", val: activeClient.paymentTerms || "—" },

              { icon: "ti-wallet", label: "Credit Limit", val: activeClient.creditLimit || "—" },

              { icon: "ti-cash", label: "Preferred Payment Mode", val: activeClient.preferredPaymentMode || "—" },

              { icon: "ti-calendar", label: "Joined", val: activeClient.createdAt ? new Date(activeClient.createdAt).toLocaleDateString("en-IN") : "—" },

              { icon: "ti-notes", label: "Internal Notes", val: activeClient.notes || "—" },

            ].map((row, i) => (

              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "#F5FAFA", borderRadius: 9, border: "1px solid #E0EEF0" }}>

                <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--teal-light, var(--teal-light, #E0F7FA))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: " var(--app-accent, var(--app-accent, #00BCD4))", flexShrink: 0 }}>

                  <i className={`ti ${row.icon}`} />

                </div>

                <div style={{ flex: 1, minWidth: 0 }}>

                  <div style={{ fontSize: 10, color: "#A0B8BE", fontWeight: 600 }}>{row.label}</div>

                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1A2E35", marginTop: 1, wordBreak: "break-word" }}>{row.val}</div>

                </div>

              </div>

            ))}

          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>

          </div>

        </Mdl>

      )}

    </div>

  );

}

function EmployeesPage({ employees, setEmployees, projects = [], tasks = [], setActive, setJumpProject, user, clients = [], onAddEmployeeClick }) {

  const [search, setSearch] = useState("");

  const [deptFilter, setDeptFilter] = useState("All Departments");

  const [statusFilter, setStatusFilter] = useState("All Status");

  const [viewEmp, setViewEmp] = useState(null);
  const [viewEmpProject, setViewEmpProject] = useState(null); // { project, tasks, emp }

  const [editEmp, setEditEmp] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErr, setEditErr] = useState({});
  const [saving, setSaving] = useState(false);
  const [showEditEmpPass, setShowEditEmpPass] = useState(false);
  const [showEditEmpConfirmPass, setShowEditEmpConfirmPass] = useState(false);

  const [toast, setToast] = useState("");

  const [empDocs, setEmpDocs] = useState({});

  const [empDocsLoading, setEmpDocsLoading] = useState(false);



  const loadEmpDocs = async (emp) => {

    setEmpDocs({});

    setEmpDocsLoading(true);

    try {

      const r = await axios.get(`${BASE_URL}/api/employee-dashboard/documents/${encodeURIComponent(emp.name)}/all`);

      const docs = r.data?.documents || r.data || [];

      if (Array.isArray(docs)) {

        const dmap = {};

        docs.forEach(d => {

          const key = d.docType || d.documentType || "default";

          dmap[key] = d;

        });

        setEmpDocs(dmap);

      }

    } catch (e) { console.error(e); }

    setEmpDocsLoading(false);

  };



  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };



  const filtered = employees.filter(e => {

    const mSearch = (e.name || "").toLowerCase().includes(search.toLowerCase()) || (e.email || "").toLowerCase().includes(search.toLowerCase()) || (e.role || "").toLowerCase().includes(search.toLowerCase());

    const mDept = deptFilter === "All Departments" || e.department === deptFilter;

    const mStatus = statusFilter === "All Status" || e.status === statusFilter;

    return mSearch && mDept && mStatus;

  });



  const getInitials = (n) => n ? n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2) : "?";

  const openEdit = (emp) => {
    if (!emp) return;
    const safeDate = (v) => {
      if (!v) return "";
      try { return String(v).substring(0, 10); } catch { return ""; }
    };
    const formData = {
      name: emp.name || "",
      email: emp.email || "",
      phone: emp.phone || "",
      role: emp.role || "Employee",
      department: emp.department || "",
      salary: emp.salary || "",
      dateOfBirth: safeDate(emp.dateOfBirth),
      joiningDate: safeDate(emp.joiningDate),
      maritalStatus: emp.maritalStatus || "Unmarried",
      status: emp.status || "Pending",
      address: emp.address || "",
      bankName: emp.bankName || emp.bankDetails?.bankName || "",
      ifscCode: emp.ifscCode || emp.bankDetails?.ifscCode || "",
      accountNumber: emp.accountNumber || emp.bankDetails?.accountNumber || "",
      branchName: emp.branchName || emp.bankDetails?.branchName || "",
      password: "",
      confirmPassword: ""
    };
    setEditForm(formData);
    setEditErr({});
    setEditEmp(emp);
  };
  const saveEdit = async () => {

    const errs = {};

    if (!editForm.name?.trim()) errs.name = "Name required";

    if (!editForm.email?.trim()) errs.email = "Email required";

    if (editForm.password || editForm.confirmPassword) {

      if (editForm.password.length < 6) errs.password = "Min 6 characters";

      if (editForm.password !== editForm.confirmPassword) errs.confirmPassword = "Passwords do not match";

    }

    if (Object.keys(errs).length) { setEditErr(errs); return; }

    try {

      setSaving(true);

      const payload = { ...editForm };

      if (!payload.password) { delete payload.password; }

      delete payload.confirmPassword;

      const res = await axios.put(`${BASE_URL}/api/employees/${editEmp._id}`, payload);

      const updated = { ...editEmp, ...(res.data || payload) };

      setEmployees(prev => prev.map(e => e._id === editEmp._id ? updated : e));

      if (viewEmp && viewEmp._id === editEmp._id) {

        setViewEmp(updated);

      }

      setEditEmp(null); showToast("Yes Employee updated successfully!");

    } catch {

      const payload = { ...editForm };

      delete payload.password;

      delete payload.confirmPassword;

      const updated = { ...editEmp, ...payload };

      setEmployees(prev => prev.map(e => e._id === editEmp._id ? updated : e));

      if (viewEmp && viewEmp._id === editEmp._id) {

        setViewEmp(updated);

      }

      setEditEmp(null); showToast("Yes Updated locally!");

    } finally { setSaving(false); }

  };

  const doDelete = async () => {

    try {

      const empName = deleteTarget.name || deleteTarget.employeeName;

      // 1) Find all tasks assigned to this employee and unassign them
      const affectedTasks = (tasks || []).filter(t => {
        if (!t.assignTo || t.assignTo === "Unassigned") return false;
        const names = t.assignTo.split(", ").map(n => n.trim()).filter(Boolean);
        return names.includes(empName);
      });

      // 2) Remove employee name from each affected task's assignTo
      await Promise.all(affectedTasks.map(t => {
        const names = t.assignTo.split(", ").map(n => n.trim()).filter(Boolean);
        const updatedNames = names.filter(n => n !== empName);
        return axios.put(`${BASE_URL}/api/tasks/${t._id}`, {
          assignTo: updatedNames.length > 0 ? updatedNames.join(", ") : "Unassigned"
        }, {
          headers: { 'x-company-id': deleteTarget.companyId || companyId || '' }
        });
      }));

      // 3) Delete the employee
      await axios.delete(`${BASE_URL}/api/employees/${deleteTarget._id}`);

      setEmployees(p => p.filter(e => e._id !== deleteTarget._id));

      setDeleteTarget(null);

      if (viewEmp && viewEmp._id === deleteTarget._id) {

        setViewEmp(null);

      }

      showToast("Employee deleted and unassigned from tasks!");

    } catch {

      setEmployees(p => p.filter(e => e._id !== deleteTarget._id));

      setDeleteTarget(null);

      if (viewEmp && viewEmp._id === deleteTarget._id) {

        setViewEmp(null);

      }

      showToast("Deleted locally!");

    }

  };



  const localUser = JSON.parse(localStorage.getItem("user") || "{}");
  const companyId = (user || localUser)?.companyId || (user || localUser)?.company || (user || localUser)?._id || (user || localUser)?.id || "";

  const onboardingLink = `${window.location.origin}/employee-onboarding?company=${encodeURIComponent(user.companyName || "Our Company")}&companyId=${companyId}`;

  const [linkCopied, setLinkCopied] = useState(false);

  const copyLink = () => { navigator.clipboard.writeText(onboardingLink); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); };


  if (viewEmpProject) {
    return (
      <div style={{ padding: "0 0 32px" }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, cursor: "pointer", color: "var(--app-accent)", fontWeight: 700 }}
          onClick={() => { setViewEmpProject(null); }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: 18 }}></i> Back to Employee
        </div>
        <ModernProjectDetails
          project={viewEmpProject.project}
          tasks={tasks}
          employees={employees}
          user={user}
          clients={clients}
          onBack={() => setViewEmpProject(null)}
          onDelete={async () => {
            try {
              await axios.delete(`${BASE_URL}/api/projects/${viewEmpProject.project._id}`);
              setViewEmpProject(null);
            } catch (e) { console.error(e); }
          }}
          onEdit={() => {
            setJumpProject(viewEmpProject.project);
            setViewEmpProject(null);
            setActive("edit-project");
          }}
          onUpdate={() => fetchProjects()}
          fetchProjects={() => { }}
          fetchTasks={() => { }}
          onMessageTeam={() => { setViewEmpProject(null); setActive("messaging"); }}
        />
      </div>
    );
  }

  if (viewEmp) {

    return (

      <>

        <EmployeeDetail
          emp={viewEmp}
          onBack={() => setViewEmp(null)}
          onEdit={() => { openEdit(viewEmp); }}
          onDelete={() => setDeleteTarget(viewEmp)}

          onActivate={async () => {
            if (!window.confirm(`Are you sure you want to activate ${viewEmp.name}?`)) return;
            try {
              await axios.put(`${BASE_URL}/api/employees/status/${viewEmp._id}`, { status: "Approved" });
              setViewEmp(prev => ({ ...prev, status: "Approved" }));
              setEmployees(prev => prev.map(e => e._id === viewEmp._id ? { ...e, status: "Approved" } : e));
              showToast("✅ Employee activated!");
            } catch (err) {
              showToast("Failed to activate employee", "error");
            }
          }}

          onDeactivate={async () => {

            if (!window.confirm(`Are you sure you want to deactivate ${viewEmp.name}?`)) return;

            try {

              await axios.put(`${BASE_URL}/api/employees/status/${viewEmp._id}`, { status: "Inactive" });

              setViewEmp(prev => ({ ...prev, status: "Inactive" }));

              setEmployees(prev => prev.map(e => e._id === viewEmp._id ? { ...e, status: "Inactive" } : e));

              showToast("👤 Employee deactivated!");

            } catch (err) {

              console.error("Failed to deactivate employee:", err);

              showToast("❌ Failed to deactivate employee");

            }

          }}

          onChangeRole={async () => {

            const newRole = prompt(`Enter new role/position for ${viewEmp.name}:`, viewEmp.role || "");

            if (newRole === null) return;

            try {

              await axios.put(`${BASE_URL}/api/employees/${viewEmp._id}`, { role: newRole });

              setViewEmp(prev => ({ ...prev, role: newRole }));

              setEmployees(prev => prev.map(e => e._id === viewEmp._id ? { ...e, role: newRole } : e));

              showToast("💼 Role updated successfully!");

            } catch (err) {

              console.error("Failed to update role:", err);

              showToast("❌ Failed to update role");

            }

          }}

          empDocs={empDocs}

          empDocsLoading={empDocsLoading}

          projects={projects}

          tasks={tasks}

          onViewProject={(p) => {
            const empName = (viewEmp?.name || '').toLowerCase().trim();
            const empTasks = (tasks || []).filter(t => {
              const assignTo = (t.assignTo || '').toLowerCase();
              return assignTo.includes(empName) &&
                (t.projectId === p._id || t.projectId === p.id ||
                  String(t.projectId) === String(p._id));
            });
            setViewEmpProject({ project: p, tasks: empTasks, emp: viewEmp });
            setViewEmp(null);
          }}

        />

        {editEmp && editForm && (

          <Mdl title="Edit Employee" onClose={() => setEditEmp(null)}>

            <div className="modal-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>

              <Fld label="Full Name *" value={editForm.name} onChange={v => setEditForm(p => ({ ...p, name: v }))} error={editErr.name} />

              <Fld label="Email *" value={editForm.email} onChange={v => { setEditForm(p => ({ ...p, email: v })); setEditErr(p => ({ ...p, email: "" })); }} type="email" error={editErr.email} />

              <Fld label="Phone Number" value={editForm.phone} onChange={v => setEditForm(p => ({ ...p, phone: v }))} />

              <Fld label="Role / Position" value={editForm.role} onChange={v => setEditForm(p => ({ ...p, role: v }))} options={DEPARTMENT_OPTIONS} />

              <Fld label="Department" value={editForm.department} onChange={v => setEditForm(p => ({ ...p, department: v }))} />

              <Fld label="Salary" value={editForm.salary} onChange={v => setEditForm(p => ({ ...p, salary: v }))} />

              <Fld label="Date of Birth" value={editForm.dateOfBirth} onChange={v => setEditForm(p => ({ ...p, dateOfBirth: v }))} type="date" />

              <Fld label="Joining Date" value={editForm.joiningDate} onChange={v => setEditForm(p => ({ ...p, joiningDate: v }))} type="date" />

              <Fld label="Marital Status" value={editForm.maritalStatus} onChange={v => setEditForm(p => ({ ...p, maritalStatus: v }))} options={["Unmarried", "Married"]} />

              <Fld label="Status" value={editForm.status} onChange={v => setEditForm(p => ({ ...p, status: v }))} options={["Active", "Inactive", "On Leave"]} />

            </div>

            <Fld label="Address" value={editForm.address} onChange={v => setEditForm(p => ({ ...p, address: v }))} />



            <div style={{ marginTop: 14 }}>

              <div style={{ fontSize: 11, color: "var(--app-sidebar)", fontWeight: 800, marginBottom: 10 }}>🏦 BANK DETAILS</div>

              <div className="modal-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>

                <Fld label="Bank Name" value={editForm.bankName} onChange={v => setEditForm(p => ({ ...p, bankName: v }))} />

                <Fld label="IFSC Code" value={editForm.ifscCode} onChange={v => setEditForm(p => ({ ...p, ifscCode: v }))} />

                <Fld label="Account Number" value={editForm.accountNumber} onChange={v => setEditForm(p => ({ ...p, accountNumber: v }))} />

                <Fld label="Branch Name" value={editForm.branchName} onChange={v => setEditForm(p => ({ ...p, branchName: v }))} />

              </div>

            </div>

            <div style={{ marginTop: 14 }}>

              <div style={{ fontSize: 11, color: "var(--app-sidebar)", fontWeight: 800, marginBottom: 10 }}>🔒 CHANGE PASSWORD</div>

              <div className="modal-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>

                <div style={{ marginBottom: 14 }}>

                  <label style={{ display: "block", fontSize: 11, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}> PASSWORD</label>

                  <div style={{ position: "relative" }}>

                    <input type={showEditEmpPass ? "text" : "password"} value={editForm.password || ""} onChange={e => { setEditForm(p => ({ ...p, password: e.target.value })); setEditErr(p => ({ ...p, password: "" })); }} style={{ width: "100%", border: `1.5px solid ${editErr.password ? "#EF4444" : "var(--app-border)"}`, borderRadius: 10, padding: "10px 46px 10px 14px", fontSize: 13, color: T.text, background: "var(--app-bg)", boxSizing: "border-box", outline: "none" }} placeholder="Leave blank to keep current password" />

                    <button type="button" onClick={() => setShowEditEmpPass(!showEditEmpPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--app-muted)", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>{showEditEmpPass ? "HIDE" : "SHOW"}</button>

                  </div>

                  {editErr.password && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>Warning {editErr.password}</div>}

                </div>

                <div style={{ marginBottom: 14 }}>

                  <label style={{ display: "block", fontSize: 11, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>CONFIRM PASSWORD</label>

                  <div style={{ position: "relative" }}>

                    <input type={showEditEmpConfirmPass ? "text" : "password"} value={editForm.confirmPassword || ""} onChange={e => { setEditForm(p => ({ ...p, confirmPassword: e.target.value })); setEditErr(p => ({ ...p, confirmPassword: "" })); }} style={{ width: "100%", border: `1.5px solid ${editErr.confirmPassword ? "#EF4444" : "var(--app-border)"}`, borderRadius: 10, padding: "10px 46px 10px 14px", fontSize: 13, color: T.text, background: "var(--app-bg)", boxSizing: "border-box", outline: "none" }} placeholder="Re-enter new password" />
                    <button type="button" onClick={() => setShowEditEmpConfirmPass(!showEditEmpConfirmPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--app-muted)", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>{showEditEmpConfirmPass ? "HIDE" : "SHOW"}</button>

                  </div>

                  {editErr.confirmPassword && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>Warning {editErr.confirmPassword}</div>}

                </div>

              </div>

            </div>



            <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>

              <button onClick={() => setEditEmp(null)} style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>

              <button onClick={saveEdit} disabled={saving} style={{ background: "var(--app-accent-gradient)", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Saving…" : "Save Changes "}</button>

            </div>

          </Mdl>

        )}

        {deleteTarget && (

          <div style={{ position: "fixed", inset: 0, background: "rgba(15,28,46,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}>

            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", width: 400, boxShadow: "0 24px 80px rgba(0,0,0,0.18)", border: "1px solid var(--border)" }}>

              <div style={{ fontSize: 17, fontWeight: 900, color: "var(--text)", marginBottom: 12 }}>Delete Employee</div>

              <div style={{ fontSize: 13, color: "var(--text-mid)" }}>Are you sure you want to delete {deleteTarget.name}? </div>

              <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>

                <button onClick={() => setDeleteTarget(null)} style={{ background: "#f1f5f9", color: "var(--text-mid)", border: "none", padding: "9px 18px", borderRadius: 8, fontFamily: "'Nunito',sans-serif", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Cancel</button>

                <button onClick={doDelete} style={{ background: "#dc2626", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 8, fontFamily: "'Nunito',sans-serif", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Delete</button>

              </div>

            </div>

          </div>

        )}

      </>

    );

  }



  const activeCount = employees.filter(e => e.status === "Active" || e.status === "Approved").length;

  const leaveCount = employees.filter(e => e.status === "On Leave").length;

  const inactiveCount = employees.filter(e => e.status === "Inactive" || e.status === "Rejected").length;



  return (

    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {toast && <div className="toast show"><i className="ti ti-check"></i> {toast}</div>}




      {/* Share Onboarding Link Card (Kept as requested) */}

      <div style={{ background: "var(--app-sidebar)", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", boxShadow: "0 8px 24px rgba(59,7,100,0.2)", marginBottom: 6 }}>

        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>

          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Employee Onboarding Link</div>

          <div style={{ fontSize: 12, color: "#ffffff", fontFamily: "monospace", wordBreak: "break-all" }}>{onboardingLink}</div>

        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>

          <button onClick={copyLink} style={{ background: linkCopied ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.15)", border: `1px solid ${linkCopied ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.3)"}`, borderRadius: 9, padding: "9px 16px", color: linkCopied ? "#4ade80" : "#ffffff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{linkCopied ? "Copied!" : "📋 Copy Link"}</button>

          <button onClick={() => {

            const text = `Hi,



Please fill in your onboarding details at the following link to join our team:



${onboardingLink}`;

            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");

          }} style={{ background: "#25D366", border: "none", borderRadius: 9, padding: "9px 16px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>

            <span>💬</span> WhatsApp

          </button>

        </div>

      </div>


      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1A2332", margin: 0 }}>Employees</h1>
        <button className="create-btn" onClick={onAddEmployeeClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-plus"></i> Add Employee
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>

        <div onClick={() => setStatusFilter("All Status")} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", cursor: "pointer", transition: "all .15s" }}>

          <div style={{ width: 46, height: 46, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, background: "rgba(var(--app-accent-rgb,0,188,212),0.08)", color: "var(--app-accent)" }}><i className="ti ti-users"></i></div>

          <div><div style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{employees.length}</div><div style={{ fontSize: 11, color: "var(--text-soft)", marginTop: 3, fontWeight: 600 }}>Total Employees</div></div>

        </div>

        <div onClick={() => setStatusFilter("Active")} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", cursor: "pointer", transition: "all .15s" }}>

          <div style={{ width: 46, height: 46, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, background: "#dcfce7", color: "#16a34a" }}><i className="ti ti-check"></i></div>

          <div><div style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{activeCount}</div><div style={{ fontSize: 11, color: "var(--text-soft)", marginTop: 3, fontWeight: 600 }}>Active</div></div>

        </div>

        <div onClick={() => setStatusFilter("On Leave")} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", cursor: "pointer", transition: "all .15s" }}>

          <div style={{ width: 46, height: 46, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, background: "#fef3c7", color: "#d97706" }}><i className="ti ti-clock"></i></div>

          <div><div style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{leaveCount}</div><div style={{ fontSize: 11, color: "var(--text-soft)", marginTop: 3, fontWeight: 600 }}>On Leave</div></div>

        </div>

        <div onClick={() => setStatusFilter("Inactive")} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", cursor: "pointer", transition: "all .15s" }}>

          <div style={{ width: 46, height: 46, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, background: "#fee2e2", color: "#dc2626" }}><i className="ti ti-user-off"></i></div>

          <div><div style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{inactiveCount}</div><div style={{ fontSize: 11, color: "var(--text-soft)", marginTop: 3, fontWeight: 600 }}>Inactive</div></div>

        </div>

      </div>



      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>

        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>

          <i className="ti ti-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-soft)", fontSize: 16 }}></i>

          <input type="text" placeholder="Search by name, email, role..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", padding: "10px 12px 10px 38px", background: "#fff", border: "1.5px solid var(--border)", borderRadius: 8, fontFamily: "'Nunito',sans-serif", fontSize: 13, color: "var(--text)", outline: "none", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = " var(--app-accent, var(--app-accent, #00BCD4))"} onBlur={e => e.target.style.borderColor = "var(--border)"} />

        </div>

        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ padding: "10px 32px 10px 12px", background: "#fff", border: "1.5px solid var(--border)", borderRadius: 8, fontFamily: "'Nunito',sans-serif", fontSize: 13, color: "var(--text-mid)", outline: "none", cursor: "pointer", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>

          <option>All Departments</option>

          {DEPARTMENT_OPTIONS.map(d => <option key={d}>{d}</option>)}

        </select>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "10px 32px 10px 12px", background: "#fff", border: "1.5px solid var(--border)", borderRadius: 8, fontFamily: "'Nunito',sans-serif", fontSize: 13, color: "var(--text-mid)", outline: "none", cursor: "pointer", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>

          <option>All Status</option>

          <option value="Active">Active</option>

          <option value="Inactive">Inactive</option>

          <option value="On Leave">On Leave</option>





        </select>

      </div>



      <div style={{ background: "#fff", border: "1.5px solid #E0EEF0", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
        <div style={{ padding: "18px 20px 12px" }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#1A2332", marginBottom: 14 }}>All Employees ({filtered.length})</div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 900 }}>
            <thead><tr style={{ background: "linear-gradient(90deg,var(--app-bg),var(--app-bg))" }}>
              {["Employee", "Role", "Department", "Email", "Joined", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "var(--app-muted)", fontWeight: 700, fontSize: 11, borderBottom: "2px solid var(--app-border)", whiteSpace: "nowrap" }}>{h.toUpperCase()}</th>
              ))}
            </tr></thead>          <tbody>

              {filtered.map((e, i) => {

                const eid = e.employeeId || e._id?.substring(0, 6).toUpperCase() || `EMP-${String(i + 1).padStart(3, "0")}`;

                const jDate = e.joiningDate ? new Date(e.joiningDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "—";

                let st = e.status || "Pending";

                if (st === "Approved") st = "Active";

                if (st === "Rejected") st = "Inactive";

                let badgeClass = "badge";

                let badgeStyle = { display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 800 };

                if (st === "Active") { badgeStyle.background = "#dcfce7"; badgeStyle.color = "#16a34a"; }

                else if (st === "On Leave" || st === "Pending") { badgeStyle.background = "#fef3c7"; badgeStyle.color = "#d97706"; }

                else { badgeStyle.background = "#fee2e2"; badgeStyle.color = "#dc2626"; }

                const dotStyle = { width: 5, height: 5, borderRadius: "50%", background: "currentColor" };



                const avColors = ["linear-gradient(135deg, var(--app-accent, var(--app-accent, #00BCD4)),#0097a7)", "linear-gradient(135deg,#7c3aed,#5b21b6)", "linear-gradient(135deg,#d97706,#b45309)", "linear-gradient(135deg,#16a34a,#15803d)", "linear-gradient(135deg,#dc2626,#991b1b)", "linear-gradient(135deg,#ec4899,#be185d)"];

                const avBg = avColors[i % avColors.length];



                return (

                  <tr key={e._id || i} style={{ cursor: "pointer", borderBottom: "1px solid var(--border)", transition: "background 0.12s" }} onMouseEnter={ev => ev.currentTarget.style.background = "#f8fbff"} onMouseLeave={ev => ev.currentTarget.style.background = "transparent"} onClick={(ev) => { ev.stopPropagation(); setViewEmp(e); loadEmpDocs(e); }}>

                    <td style={{ padding: "13px 16px", verticalAlign: "middle" }}>

                      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>

                        <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff", background: avBg }}>{getInitials(e.name)}</div>

                        <div>

                          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{e.name}</div>

                          <div style={{ fontSize: 11, color: "var(--text-soft)" }}>{eid}</div>

                        </div>

                      </div>

                    </td>

                    <td style={{ padding: "13px 16px", verticalAlign: "middle" }}>

                      <span style={{ background: "#f1f5f9", color: "var(--text-mid)", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }}>{e.role || "Employee"}</span>

                    </td>

                    <td style={{ padding: "13px 16px", verticalAlign: "middle", fontSize: 12, color: "var(--text-mid)", fontWeight: 600 }}>{e.department || "—"}</td>

                    <td style={{ padding: "13px 16px", verticalAlign: "middle", fontSize: 13 }}>{e.email || "—"}</td>

                    <td style={{ padding: "13px 16px", verticalAlign: "middle", fontSize: 13 }}>{jDate}</td>

                    <td style={{ padding: "13px 16px", verticalAlign: "middle" }}>

                      <div style={badgeStyle}><div style={dotStyle}></div> {st}</div>

                    </td>

                    <td style={{ padding: "13px 16px", verticalAlign: "middle" }}>

                      <div style={{ display: "flex", gap: 6 }}>

                        <button onClick={(ev) => { ev.stopPropagation(); setViewEmp(e); loadEmpDocs(e); }} style={{ width: 30, height: 30, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", fontSize: 15, transition: "all 0.15s", background: "rgba(var(--app-accent-rgb,0,188,212),0.08)", color: "var(--app-accent)" }}><i className="ti ti-eye"></i></button>
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            const empData = employees.find(emp => (emp._id || emp.id) === (e._id || e.id)) || e;
                            openEdit(empData);
                          }}
                          style={{ width: 30, height: 30, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", fontSize: 15, transition: "all 0.15s", background: "#dbeafe", color: "#2563eb", position: "relative", zIndex: 5 }}
                        >
                          <i className="ti ti-pencil" style={{ pointerEvents: "none" }}></i>
                        </button>

                        <button onClick={(ev) => { ev.stopPropagation(); setDeleteTarget(e); }} style={{ width: 30, height: 30, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", fontSize: 15, transition: "all 0.15s", background: "#fee2e2", color: "#dc2626" }}><i className="ti ti-trash"></i></button>

                      </div>

                    </td>

                  </tr>

                );

              })}

            </tbody>

          </table>

        </div>

      </div>







      {editEmp && editForm && (
        <Mdl title="Edit Employee" onClose={() => setEditEmp(null)}>
          <div className="modal-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
            <Fld label="Full Name *" value={editForm.name} onChange={v => setEditForm(p => ({ ...p, name: v }))} error={editErr.name} />
            <Fld label="Email *" value={editForm.email} onChange={v => { setEditForm(p => ({ ...p, email: v })); setEditErr(p => ({ ...p, email: "" })); }} type="email" error={editErr.email} />
            <Fld label="Phone Number" value={editForm.phone} onChange={v => setEditForm(p => ({ ...p, phone: v }))} />
            <Fld label="Role / Position" value={editForm.role} onChange={v => setEditForm(p => ({ ...p, role: v }))} options={DEPARTMENT_OPTIONS} />
            <Fld label="Department" value={editForm.department} onChange={v => setEditForm(p => ({ ...p, department: v }))} />
            <Fld label="Salary" value={editForm.salary} onChange={v => setEditForm(p => ({ ...p, salary: v }))} />
            <Fld label="Date of Birth" value={editForm.dateOfBirth} onChange={v => setEditForm(p => ({ ...p, dateOfBirth: v }))} type="date" />
            <Fld label="Joining Date" value={editForm.joiningDate} onChange={v => setEditForm(p => ({ ...p, joiningDate: v }))} type="date" />
            <Fld label="Marital Status" value={editForm.maritalStatus} onChange={v => setEditForm(p => ({ ...p, maritalStatus: v }))} options={["Unmarried", "Married"]} />
            <Fld label="Status" value={editForm.status} onChange={v => setEditForm(p => ({ ...p, status: v }))} options={["Active", "Inactive", "On Leave"]} />
          </div>
          <Fld label="Address" value={editForm.address} onChange={v => setEditForm(p => ({ ...p, address: v }))} />

          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: "var(--app-sidebar)", fontWeight: 800, marginBottom: 10 }}>🏦 BANK DETAILS</div>
            <div className="modal-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
              <Fld label="Bank Name" value={editForm.bankName} onChange={v => setEditForm(p => ({ ...p, bankName: v }))} />
              <Fld label="IFSC Code" value={editForm.ifscCode} onChange={v => setEditForm(p => ({ ...p, ifscCode: v }))} />
              <Fld label="Account Number" value={editForm.accountNumber} onChange={v => setEditForm(p => ({ ...p, accountNumber: v }))} />
              <Fld label="Branch Name" value={editForm.branchName} onChange={v => setEditForm(p => ({ ...p, branchName: v }))} />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: "var(--app-sidebar)", fontWeight: 800, marginBottom: 10 }}>🔒 CHANGE PASSWORD</div>
            <div className="modal-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}> PASSWORD</label>
                <div style={{ position: "relative" }}>
                  <input type={showEditEmpPass ? "text" : "password"} value={editForm.password || ""} onChange={e => { setEditForm(p => ({ ...p, password: e.target.value })); setEditErr(p => ({ ...p, password: "" })); }} style={{ width: "100%", border: `1.5px solid ${editErr.password ? "#EF4444" : "var(--app-border)"}`, borderRadius: 10, padding: "10px 46px 10px 14px", fontSize: 13, color: T.text, background: "var(--app-bg)", boxSizing: "border-box", outline: "none" }} placeholder="Leave blank to keep current password" />
                  <button type="button" onClick={() => setShowEditEmpPass(!showEditEmpPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--app-muted)", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>{showEditEmpPass ? "HIDE" : "SHOW"}</button>
                </div>
                {editErr.password && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>Warning {editErr.password}</div>}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>CONFIRM PASSWORD</label>
                <div style={{ position: "relative" }}>
                  <input type={showEditEmpConfirmPass ? "text" : "password"} value={editForm.confirmPassword || ""} onChange={e => { setEditForm(p => ({ ...p, confirmPassword: e.target.value })); setEditErr(p => ({ ...p, confirmPassword: "" })); }} style={{ width: "100%", border: `1.5px solid ${editErr.confirmPassword ? "#EF4444" : "var(--app-border)"}`, borderRadius: 10, padding: "10px 46px 10px 14px", fontSize: 13, color: T.text, background: "var(--app-bg)", boxSizing: "border-box", outline: "none" }} placeholder="Re-enter new password" />
                  <button type="button" onClick={() => setShowEditEmpConfirmPass(!showEditEmpConfirmPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--app-muted)", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>{showEditEmpConfirmPass ? "HIDE" : "SHOW"}</button>
                </div>
                {editErr.confirmPassword && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>Warning {editErr.confirmPassword}</div>}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>

            <button onClick={saveEdit} disabled={saving} style={{ background: "var(--app-accent-gradient)", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Saving…" : "Save Changes "}</button>
          </div>
        </Mdl>
      )}

      {deleteTarget && (

        <div style={{ position: "fixed", inset: 0, background: "rgba(15,28,46,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}>

          <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", width: 400, boxShadow: "0 24px 80px rgba(0,0,0,0.18)", border: "1px solid var(--border)" }}>

            <div style={{ fontSize: 17, fontWeight: 900, color: "var(--text)", marginBottom: 12 }}>Delete Employee</div>

            <div style={{ fontSize: 13, color: "var(--text-mid)" }}>Are you sure you want to delete {deleteTarget.name}?</div>

            <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>

              <button onClick={() => setDeleteTarget(null)} style={{ background: "#f1f5f9", color: "var(--text-mid)", border: "none", padding: "9px 18px", borderRadius: 8, fontFamily: "'Nunito',sans-serif", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Cancel</button>

              <button onClick={doDelete} style={{ background: "#dc2626", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 8, fontFamily: "'Nunito',sans-serif", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Delete</button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}

// MANAGERS PAGE

// •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••

function ManagersPage({ managers, setManagers }) {

  const [search, setSearch] = useState("");

  const [viewMgr, setViewMgr] = useState(null);

  const [editMgr, setEditMgr] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [editForm, setEditForm] = useState({});

  const [editErr, setEditErr] = useState({});

  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState("");



  const [currentPage, setCurrentPage] = useState(1);

  const [itemsPerPage, setItemsPerPage] = useState(10);



  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const filtered = managers.filter(m => (m.managerName || "").toLowerCase().includes(search.toLowerCase()) || (m.email || "").toLowerCase().includes(search.toLowerCase()) || (m.department || "").toLowerCase().includes(search.toLowerCase()));



  useEffect(() => { setCurrentPage(1); }, [search, managers.length]);

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);



  const openEdit = (m) => {

    setEditForm({ managerName: m.managerName || "", email: m.email || "", phone: m.phone || "", department: m.department || "", role: m.role || "Manager", address: m.address || "", status: m.status || "Active" });

    setEditErr({});

    setEditMgr(m);

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

      showToast("Yes Manager updated!");

    } catch {

      setManagers(prev => prev.map(m => m._id === editMgr._id ? { ...m, ...editForm } : m));

      setEditMgr(null);

      showToast("Yes Updated locally!");

    } finally { setSaving(false); }

  };



  const doDelete = async () => {

    try {

      await axios.delete(`${BASE_URL}/api/managers/${deleteTarget._id}`);

    } catch { }

    setManagers(prev => prev.filter(m => m._id !== deleteTarget._id));

    setDeleteTarget(null);

    showToast(" Delete Manager deleted!");

  };



  return (

    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#fff", border: "1.5px solid #22c55e", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#22c55e", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>{toast}</div>}



      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>

        {[{ t: "Total Managers", v: managers.length, i: "🧑‍💼", c: "#f59e0b" }, { t: "Active", v: managers.filter(m => m.status === "Active").length, i: "Yes", c: "#22C55E" }, { t: "Inactive", v: managers.filter(m => m.status === "Inactive").length, i: "⛔", c: "#EF4444" }].map(({ t, v, i, c }) => (
          <div key={t} style={{ background: "#fff", border: "1.5px solid #E0EEF0", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${c}15`, color: c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{i}</div>
            <div><div style={{ fontSize: 24, fontWeight: 800, color: "#1A2332" }}>{v}</div><div style={{ fontSize: 12, fontWeight: 700, color: "#607D86" }}>{t}</div></div>
          </div>
        ))}

      </div>



      <SC title={`All Managers (${filtered.length})`}>

        <Search value={search} onChange={setSearch} placeholder="Search by name, email, department..." />

        <div style={{ overflowX: "auto" }}>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 750 }}>

            <thead><tr style={{ background: "linear-gradient(90deg,var(--app-bg),var(--app-bg))" }}>

              {["#", "Name", "Email", "Phone", "Role", "Department", "Status", "Joined", "Actions"].map(c => (

                <th key={c} style={{ padding: "10px 14px", textAlign: "left", color: "var(--app-muted)", fontWeight: 700, fontSize: 11, borderBottom: "2px solid var(--app-border)", whiteSpace: "nowrap" }}>{c.toUpperCase()}</th>

              ))}

            </tr></thead>

            <tbody>

              {paginated.length === 0 ? <tr><td colSpan={9} style={{ padding: 30, textAlign: "center", color: "var(--app-muted)" }}>No managers found</td></tr>

                : paginated.map((m, i) => (

                  <tr key={m._id || i} style={{ borderBottom: "1px solid #f3f0ff" }} onMouseEnter={ev => ev.currentTarget.style.background = "var(--app-bg)"} onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>

                    <td style={{ padding: "12px 14px", color: "var(--app-muted)", fontSize: 11, fontFamily: "monospace" }}>{`MGR${String((currentPage - 1) * itemsPerPage + i + 1).padStart(3, "0")}`}</td>

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

                    <td style={{ padding: "12px 14px", color: "var(--app-muted)", fontSize: 12 }}>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "—"}</td>

                    <td style={{ padding: "12px 14px" }}>

                      <ActionBtns onView={() => setViewMgr(m)} onEdit={() => openEdit(m)} onDelete={() => setDeleteTarget(m)} />

                    </td>

                  </tr>

                ))}

            </tbody>

          </table>

        </div>

        <Pagination totalItems={filtered.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />

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

            <button onClick={() => { setViewMgr(null); openEdit(viewMgr); }} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#f59e0b,#fbbf24)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>Edit</button>

            <button onClick={() => { setViewMgr(null); setDeleteTarget(viewMgr); }} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#EF4444,#dc2626)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}> Delete</button>

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

            <button onClick={() => setEditMgr(null)} style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancel</button>

            <button onClick={saveEdit} disabled={saving} style={{ background: "linear-gradient(135deg,#f59e0b,#fbbf24)", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : "Save Changes "}</button>

          </div>

        </Mdl>

      )}



      {deleteTarget && <ConfirmModal title="Delete Manager" message={`Delete "${deleteTarget.managerName}"?`} onConfirm={doDelete} onCancel={() => setDeleteTarget(null)} />}

    </div>

  );

}



// •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••

// SUBADMINS PAGE

// •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••

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

    setEditForm({

      name: s.name || "",

      email: s.email || "",

      phone: s.phone || "",

      status: s.status || "Active",

      clientLimit: s.clientLimit || "",

      employeeLimit: s.employeeLimit || ""

    });

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

      showToast("Yes Subadmin updated!");

    } catch {

      setSubadmins(prev => prev.map(s => s._id === editSub._id ? { ...s, ...editForm } : s));

      setEditSub(null);

      showToast("Yes Subadmin updated locally!");

    } finally { setSaving(false); }

  };





  const doDelete = async () => {

    try {

      await axios.delete(`${BASE_URL}/api/subadmins/${deleteTarget._id}`);

    } catch { }

    setSubadmins(prev => prev.filter(s => s._id !== deleteTarget._id));

    setDeleteTarget(null);

    showToast(" Delete Subadmin deleted!");

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

        {[{ t: "Total Subadmins", v: subadmins.length, i: "🛡️", c: "#3b82f6" }, { t: "Active", v: subadmins.filter(s => (s.status || "Active") === "Active").length, i: "Yes", c: "#22C55E" }, { t: "Inactive", v: subadmins.filter(s => s.status === "Inactive").length, i: "⛔", c: "#EF4444" }].map(({ t, v, i, c }) => (

          <div key={t} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 4px 18px rgba(var(--app-accent-rgb, 124, 58, 237),0.07)", border: "1px solid var(--app-border)", display: "flex", alignItems: "center", gap: 12 }}>

            <div style={{ width: 40, height: 40, borderRadius: 11, background: `${c}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{i}</div>

            <div><div style={{ fontSize: 10, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5 }}>{t.toUpperCase()}</div><div style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}</div></div>

          </div>

        ))}

      </div>



      <SC title={`All Subadmins (${filtered.length})`}>

        <Search value={search} onChange={setSearch} placeholder="Search by name, email, company..." />

        <div style={{ overflowX: "auto" }}>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 900 }}>

            <thead><tr style={{ background: "linear-gradient(90deg,var(--app-bg),var(--app-bg))" }}>

              {["#", "Name", "Company", "Email", "Phone", "Role", "Status", "Joined", "Actions"].map(c => (

                <th key={c} style={{ padding: "10px 14px", textAlign: "left", color: "var(--app-muted)", fontWeight: 700, fontSize: 11, borderBottom: "2px solid var(--app-border)", whiteSpace: "nowrap" }}>{c.toUpperCase()}</th>

              ))}

            </tr></thead>

            <tbody>

              {filtered.length === 0 ? <tr><td colSpan={9} style={{ padding: 30, textAlign: "center", color: "var(--app-muted)" }}>No subadmins found</td></tr>

                : filtered.map((s, i) => (

                  <tr key={s._id || i} style={{ borderBottom: "1px solid #f3f0ff" }} onMouseEnter={ev => ev.currentTarget.style.background = "var(--app-bg)"} onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>

                    <td style={{ padding: "12px 14px", color: "var(--app-muted)", fontSize: 11, fontFamily: "monospace" }}>{`SUB${String(i + 1).padStart(3, "0")}`}</td>

                    <td style={{ padding: "12px 14px" }}>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#60a5fa)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{(s.name || "?")[0].toUpperCase()}</div>

                        <span style={{ fontWeight: 700, color: T.text }}>{s.name || "—"}</span>

                      </div>

                    </td>

                    <td style={{ padding: "12px 14px", color: "var(--app-muted)", fontSize: 12, fontWeight: 600 }}>{s.companyName || s.company || "—"}</td>

                    <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 12 }}>{s.email || "—"}</td>

                    <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 12 }}>{s.phone || "—"}</td>

                    <td style={{ padding: "12px 14px", color: "#3b82f6", fontSize: 12, fontWeight: 600 }}>Subadmin</td>

                    <td style={{ padding: "12px 14px" }}><Badge label={s.status || "Active"} /></td>

                    <td style={{ padding: "12px 14px", color: "var(--app-muted)", fontSize: 12 }}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}</td>

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

              <InfoRow icon="Team" label="Employees" value={viewSub.employeeCount || "0-10"} />

              <InfoRow icon="📧" label="Email" value={viewSub.email} />

              <InfoRow icon="📱" label="Phone" value={viewSub.phone} />

              <InfoRow icon="📅" label="Joined" value={viewSub.createdAt ? new Date(viewSub.createdAt).toLocaleDateString() : "—"} />

              <div style={{ gridColumn: "span 2", height: 1, background: "#bfdbfe", margin: "10px 0" }} />

              <InfoRow icon="🏢" label="Client Limit" value={viewSub.clientLimit || "Not set (Default 10)"} />

              <InfoRow icon="👨‍💼" label="Employee Limit" value={viewSub.employeeLimit || "Not set (Default 20)"} />

              <InfoRow icon="🧑‍💼" label="Manager Limit" value={viewSub.managerLimit || "Not set (Default 5)"} />

            </div>



            {/* Stats Cards */}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>

              <div style={{ background: "#f0f9ff", borderRadius: 12, padding: 14, border: "1px solid #bae6fd", textAlign: "center" }}>

                <div style={{ fontSize: 11, color: "var(--app-accent)", fontWeight: 700, marginBottom: 4 }}>QUOTATIONS</div>

                <div style={{ fontSize: 22, fontWeight: 800, color: "#0ea5e9" }}>{relatedQuotations.length}</div>

              </div>

              <div style={{ background: "var(--app-bg)", borderRadius: 12, padding: 14, border: "1px solid #ddd6fe", textAlign: "center" }}>

                <div style={{ fontSize: 11, color: "var(--app-muted)", fontWeight: 700, marginBottom: 4 }}>EMPLOYEES</div>

                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--app-accent)" }}>{relatedEmployees.length}</div>

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

                <div style={{ maxHeight: 150, overflowY: "auto", border: "1px solid var(--app-border)", borderRadius: 10, background: "var(--app-bg)" }}>

                  {relatedEmployees.map((e, idx) => (

                    <div key={idx} style={{ padding: "10px 14px", borderBottom: "1px solid var(--app-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-muted),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>{(e.name || "?")[0].toUpperCase()}</div>

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

              <button onClick={() => { setViewSub(null); openEdit(viewSub); }} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#3b82f6,#60a5fa)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>Edit</button>

              <button onClick={() => { setViewSub(null); setDeleteTarget(viewSub); }} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#EF4444,#dc2626)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}> Delete </button>

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

            <Fld label="Client Limit" type="number" value={editForm.clientLimit} onChange={v => setEditForm(p => ({ ...p, clientLimit: v }))} />

            <Fld label="Employee Limit" type="number" value={editForm.employeeLimit} onChange={v => setEditForm(p => ({ ...p, employeeLimit: v }))} />

          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>

            <button onClick={() => setEditSub(null)} style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancel</button>

            <button onClick={saveEdit} disabled={saving} style={{ background: "linear-gradient(135deg,#3b82f6,#60a5fa)", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : "Save Changes "}</button>

          </div>

        </Mdl>

      )}



      {deleteTarget && <ConfirmModal title="Delete Subadmin" message={`Delete "${deleteTarget.name}"?`} onConfirm={doDelete} onCancel={() => setDeleteTarget(null)} />}

    </div>

  );

}





// PROJECTS PAGE

// •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••

function ProjectsPage({ projects, tasks, setProjects, clients, employees, jumpProject, setJumpProject, config, onViewTasks, onViewProject, user, fetchTasks, onAddEmployee, onBack, onCreateProject, onEditProject, setActive, setInvoicePrefill, setJumpInvoice, fetchProjects, setPrevActiveBeforeInvoice, active }) {
  const [search, setSearch] = useState("");



  const projectsWithProgress = (projects || []).map(p => {
    const s = (p.status || '').toLowerCase();
    if (s === 'completed' || s === 'done') {
      return { ...p, progress: 100 };
    }
    const projTasks = (tasks || []).filter(t => {
      const tid = t.projectId?._id || t.projectId || t.project;
      return tid === (p._id || p.id);
    });

    // Milestone-based progress — same rule as the Project Details page:
    // a milestone counts as done if manually marked done, OR if all its tasks are completed.
    const milestonesArr = p.milestones || [];
    if (milestonesArr.length > 0) {
      const doneMilestones = milestonesArr.filter(m => {
        const mTasks = projTasks.filter(t => t.milestone === m.name && !t.isDeleted);
        const allTasksCompleted = mTasks.length > 0 && mTasks.every(t => (t.status || '').toLowerCase() === 'done' || (t.status || '').toLowerCase() === 'completed');
        return m.done === true || allTasksCompleted;
      }).length;
      return { ...p, progress: Math.round((doneMilestones / milestonesArr.length) * 100) };
    }

    // No milestones defined — fall back to task completion ratio
    if (projTasks.length > 0) {
      const completed = projTasks.filter(t => (t.status || '').toLowerCase() === 'completed' || (t.status || '').toLowerCase() === 'done').length;
      return { ...p, progress: Math.round((completed / projTasks.length) * 100) };
    }
    // Fallback to manually stored progress
    return { ...p, progress: p.progress || 0 };
  });

  const [viewTasksProj, setViewTasksProj] = useState(null);

  const [viewProj, setViewProj] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [assignModal, setAssignModal] = useState(null);

  const [assignTo, setAssignTo] = useState([]);

  const [toast, setToast] = useState("");

  const [payModalsState, setPayModalsState] = useState({

    showNewInvoice: false,

    showPayment: false,

    showAdvance: false,

    showMilestonePayment: false,

    showAdditional: false,

    editData: null,

    editIndex: null

  });

  const [payModalProject, setPayModalProject] = useState(null);



  // UseEffect removed to prevent unnecessary popup



  const [currentPage, setCurrentPage] = useState(1);

  const [itemsPerPage, setItemsPerPage] = useState(10);



  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const filtered = projectsWithProgress.filter(p => (p.name || "").toLowerCase().includes(search.toLowerCase()) || (p.client || "").toLowerCase().includes(search.toLowerCase()));



  useEffect(() => { setCurrentPage(1); }, [search, projects.length]);

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);



  const openEdit = (p) => {

    if (!p || (!p._id && !p.id)) return;

    setJumpProject(p);

    if (onEditProject) {

      onEditProject(p);

    }

  };



  const doDelete = async () => {

    try { await axios.delete(`${BASE_URL}/api/projects/${deleteTarget._id}`); } catch { }

    setProjects(prev => prev.filter(p => p._id !== deleteTarget._id));

    setDeleteTarget(null);

    showToast("  Project deleted!");

  };



  const doAssign = async () => {

    if (!assignTo || assignTo.length === 0) { alert("Please select at least one employee"); return; }

    try {

      await axios.put(`${BASE_URL}/api/projects/${assignModal._id}`, { assignedTo: assignTo });

      setProjects(prev => prev.map(p => p._id === assignModal._id ? { ...p, assignedTo: assignTo } : p));

      setAssignModal(null); setAssignTo([]);

      showToast("Yes Employees assigned!");

    } catch (err) { alert(err.response?.data?.msg || "Failed to assign"); }

  };



  if (viewTasksProj) {

    return (

      <div style={{ flex: 1, height: "100%" }}>

        <ModernEmployeeProjectDetails

          project={viewTasksProj}

          tasks={tasks.filter(t => (t.project || t.projectId) === (viewTasksProj._id || viewTasksProj.id))}

          user={user}

          onBack={() => setViewTasksProj(null)}

          onMessageTeam={() => setActive("messaging")}

        />

      </div>

    );

  }



  return (

    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#fff", border: "1.5px solid #22c55e", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#22c55e", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>{toast}</div>}



      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

          {onBack && (

            <button onClick={onBack} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--teal-light, var(--teal-light, #E0F7FA))", border: "none", borderRadius: 10, cursor: "pointer", color: " var(--app-accent, var(--app-accent, #00BCD4))", flexShrink: 0 }}>

              <i className="ti ti-arrow-left" style={{ fontSize: 18 }} />

            </button>

          )}

          <div style={{ fontSize: 20, fontWeight: 900, color: "#1A2332" }}>Projects</div>

        </div>

        <button
          className="create-btn"
          onClick={() => {
            setJumpProject(null);
            if (setActive) setActive("create-project");
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <i className="ti ti-plus"></i> New Project
        </button>

      </div>

      <ModernProjectsView

        projects={projectsWithProgress}

        searchQuery={search}

        onViewTasks={(p) => {

          if (!p || (!p._id && !p.id)) return;

          onViewTasks && onViewTasks(p);

        }}

        onClickProject={(p) => {

          if (!p || (!p._id && !p.id)) return;

          onViewProject && onViewProject(p);

        }}

        onEdit={(p) => openEdit(p)}

        onDelete={(p) => setDeleteTarget(p)}

        onAddProject={() => {
          setJumpProject(null);
          setJumpProject(null);
          setJumpProject(null);
          if (setActive) setActive("create-project");
        }}
        onNewInvoice={(p, editInv, editIdx) => {
          if (!p) return;
          if (setInvoicePrefill) setInvoicePrefill({ client: p.client || "", project: p.name || "", _t: Date.now(), ...(editInv ? { editData: editInv, editIndex: editIdx, projectId: p._id } : {}) });
          if (setJumpInvoice) setJumpInvoice(true);
          setPrevActiveBeforeInvoice(active);
          if (setActive) setActive("invoices");
        }}
        onViewInvoice={(entry) => {
          setJumpInvoice(entry);
          setPrevActiveBeforeInvoice(active);
          setActive("invoices");
        }}
      />



      {/* New Invoice Popup Modal */}

      <ProjectPaymentModals

        project={payModalProject}

        projects={projects}

        modalsState={payModalsState}

        setModalsState={setPayModalsState}

        onSaveSuccess={() => {

          if (fetchProjects) fetchProjects();

        }}

      />



      {viewProj && (

        <Mdl title="Project Details" onClose={() => setViewProj(null)} maxWidth={620}>

          <div style={{ background: "#fff", borderRadius: 16 }}>

            <div style={{ background: "#f8f7ff", padding: "20px 24px", borderRadius: 16, marginBottom: 18, border: "1px solid #f3efff" }}>

              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--app-sidebar)", marginBottom: 8 }}>{viewProj.name}</h2>

              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>

                <Badge label={viewProj.status || "Pending"} />



                {viewProj.category && <Badge label={viewProj.category} />}

              </div>

            </div>



            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px", marginBottom: 18 }}>

              {[

                ["Client", viewProj.client],

                ["Manager", viewProj.manager],

                ["Contact Person", viewProj.contactPersonName],

                ["Contact No", viewProj.contactPersonNo],

                ["Start Date", viewProj.start ? new Date(viewProj.start).toLocaleDateString("en-IN") : "—"],

                ["Deadline", (viewProj.end || viewProj.deadline) ? new Date(viewProj.end || viewProj.deadline).toLocaleDateString("en-IN") : "—"],

                ["Budget", formatCurrency(viewProj.budget, viewProj.currency)],

                ["Progress", `${viewProj.progress || 0}%`],



                ["Purpose", viewProj.purpose],

              ].map(([label, val]) => (

                <div key={label}>

                  <div style={{ fontSize: 9, color: "var(--app-muted)", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>

                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--app-sidebar)" }}>{val || "—"}</div>

                </div>

              ))}

              <div style={{ gridColumn: "1 / -1" }}>

                <div style={{ fontSize: 9, color: "var(--app-muted)", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Description</div>

                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--app-sidebar)", lineHeight: 1.6 }}>{viewProj.description || viewProj.purpose || "—"}</div>

              </div>

            </div>



            <div style={{ marginBottom: 18 }}>

              <h3 style={{ fontSize: 10, fontWeight: 800, color: "var(--app-muted)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>ASSIGNED EMPLOYEES</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

                {(() => {

                  const assignedEmployees = Array.isArray(viewProj.assignedTo) ? viewProj.assignedTo : (viewProj.assignedTo ? [viewProj.assignedTo] : []);

                  return assignedEmployees.length > 0 ? assignedEmployees.map((emp, idx) => (

                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#f8f7ff", borderRadius: 12, border: "1px solid #f3efff" }}>

                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-muted))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>{emp[0].toUpperCase()}</div>

                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--app-sidebar)" }}>{emp}</span>

                    </div>

                  )) : <div style={{ color: "var(--app-muted)", fontSize: 12, fontStyle: "italic" }}>No employees assigned</div>;

                })()}

              </div>

            </div>



            {(viewProj.milestones || []).length > 0 && (

              <div style={{ marginBottom: 18 }}>

                <h3 style={{ fontSize: 10, fontWeight: 800, color: "var(--app-muted)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>MILESTONES</h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>

                  {viewProj.milestones.map((m, idx) => (

                    <div key={idx} style={{ fontSize: 13, fontWeight: 600, color: "var(--app-sidebar)", padding: "8px 12px", background: "var(--app-bg)", borderRadius: 10 }}>

                      {m.name}{m.date ? ` — ${new Date(m.date).toLocaleDateString("en-IN")}` : ""}

                    </div>

                  ))}

                </div>

              </div>

            )}



            <div style={{ display: "flex", gap: 10 }}>

              <button onClick={(e) => { e.stopPropagation(); setViewProj(null); openEdit(viewProj); }} style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13 }}>Edit</button>

              <button onClick={(e) => { e.stopPropagation(); setViewProj(null); setAssignModal(viewProj); setAssignTo(Array.isArray(viewProj.assignedTo) ? viewProj.assignedTo : (viewProj.assignedTo ? [viewProj.assignedTo] : [])); }} style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13 }}>👤 Assign</button>

              <button onClick={(e) => { e.stopPropagation(); setViewProj(null); setDeleteTarget(viewProj); }} style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13 }}> Delete</button>

            </div>

          </div>

        </Mdl>

      )}



      {assignModal && (

        <Mdl title="Assign Employees" onClose={() => setAssignModal(null)} maxWidth={450}>

          <div style={{ marginBottom: 18 }}>

            <label style={{ display: "block", fontSize: 11, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>SELECT EMPLOYEES TO ASSIGN</label>

            <div style={{ border: "1.5px solid var(--app-border)", borderRadius: 10, padding: "12px", background: "var(--app-bg)", maxHeight: 200, overflowY: "auto" }}>

              {employees.length === 0 ? <div style={{ color: "var(--app-muted)", fontSize: 13, textAlign: "center", padding: "20px" }}>No employees available</div>

                : employees.map(emp => (

                  <div key={emp._id || emp.email} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--app-bg)" }}>

                    <input type="checkbox"

                      id={`assign-emp-${emp._id || emp.email}`}

                      checked={Array.isArray(assignTo) ? assignTo.includes(emp.name) : (assignTo === emp.name)}

                      onChange={e => {

                        const currentAssigned = Array.isArray(assignTo) ? assignTo : (assignTo ? [assignTo] : []);

                        if (e.target.checked) {

                          setAssignTo([...currentAssigned, emp.name]);

                        } else {

                          setAssignTo(currentAssigned.filter(name => name !== emp.name));

                        }

                      }}

                      style={{ width: 16, height: 16, cursor: "pointer" }}

                    />

                    <label htmlFor={`assign-emp-${emp._id || emp.email}`} style={{ flex: 1, cursor: "pointer", fontSize: 13, color: "var(--app-sidebar)", display: "flex", alignItems: "center", gap: 8 }}>

                      <span>{emp.name}</span>

                      {emp.department && <span style={{ fontSize: 11, color: "#a78bba", background: "var(--app-border)", padding: "2px 6px", borderRadius: 4 }}>{emp.department}</span>}

                    </label>

                  </div>

                ))}

            </div>

            {assignTo && assignTo.length > 0 && (

              <div style={{ marginTop: 12 }}>

                <label style={{ display: "block", fontSize: 10, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }}>SELECTED EMPLOYEES ({assignTo.length})</label>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>

                  {assignTo.map(name => (

                    <div key={name} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--app-border)", border: "1px solid #ddd6fe", borderRadius: 8, padding: "4px 10px" }}>

                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 8, fontWeight: 700 }}>{name ? name[0].toUpperCase() : "?"}</div>

                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--app-muted)" }}>{name}</span>

                      <button

                        onClick={(e) => { e.stopPropagation(); setAssignTo(assignTo.filter(n => n !== name)); }}

                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 14, padding: "0 2px", fontWeight: 700 }}

                      >

                        Ã—

                      </button>

                    </div>

                  ))}

                </div>

              </div>

            )}

          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>

            <button onClick={() => setAssignModal(null)} style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancel</button>

            <button onClick={doAssign} style={{ background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Save Assignment </button>

          </div>

        </Mdl>

      )}



      {deleteTarget && <ConfirmModal title="Delete Project" message={`Delete "${deleteTarget.name}"?`} onConfirm={doDelete} onCancel={() => setDeleteTarget(null)} />}

    </div>

  );

}



// •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••

// PROJECT STATUS PAGE (unchanged, just pass managers properly)

// •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••

function SearchDropdown({ label, items, displayKey, value, onChange, error, placeholder }) {

  const [open, setOpen] = useState(false);

  const [search, setSearch] = useState("");

  const filtered = items.filter(i => (i[displayKey] || "").toLowerCase().includes(search.toLowerCase()));

  return (

    <div style={{ marginBottom: 14, position: "relative" }}>

      <label style={{ display: "block", fontSize: 11, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>{label.toUpperCase()}</label>

      <div onClick={() => setOpen(!open)} style={{ width: "100%", border: `1.5px solid ${error ? "#EF4444" : open ? "var(--app-accent)" : "var(--app-border)"}`, borderRadius: 10, padding: "10px 36px 10px 14px", fontSize: 13, color: value ? T.text : "var(--app-muted)", background: "var(--app-bg)", cursor: "pointer", position: "relative", userSelect: "none", minHeight: 42, boxSizing: "border-box" }}>

        {value || placeholder || "-- Select --"}

        <span style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, fontSize: 10, color: "var(--app-muted)", transition: "0.2s" }}>▼</span>

      </div>

      {open && (

        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1.5px solid var(--app-border)", borderRadius: 12, boxShadow: "0 8px 32px rgba(var(--app-accent-rgb, 124, 58, 237),0.15)", zIndex: 999, overflow: "hidden" }}>

          <div style={{ maxHeight: 180, overflowY: "auto" }}>

            {filtered.length === 0 ? <div style={{ padding: 14, textAlign: "center", color: "var(--app-muted)", fontSize: 13 }}>No results</div>

              : filtered.map((item, i) => { const name = item[displayKey] || ""; const isSel = value === name; return (<div key={i} onClick={() => { onChange(name); setOpen(false); setSearch(""); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: isSel ? "var(--app-border)" : "transparent", borderBottom: "1px solid var(--app-bg)" }} onMouseEnter={e => e.currentTarget.style.background = "var(--app-bg)"} onMouseLeave={e => e.currentTarget.style.background = isSel ? "var(--app-border)" : "transparent"}><div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{name[0]?.toUpperCase() || "?"}</div><span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{name}</span>{isSel && <span style={{ marginLeft: "auto", color: "var(--app-accent)" }}>✓</span>}</div>); })}

          </div>

        </div>

      )}

      {open && <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={() => { setOpen(false); setSearch(""); }} />}

      {error && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>Warning {error}</div>}

    </div>

  );

}



function ProjectStatusPage({ clients, employees, managers, config }) {

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



  const [currentPage, setCurrentPage] = useState(1);

  const [itemsPerPage, setItemsPerPage] = useState(10);



  const displayed = trackList.filter(p => { const okStatus = tsFilter === "All" || p.status === tsFilter; const q = tsSearch.toLowerCase(); const okSearch = !q || (p.name || "").toLowerCase().includes(q) || (p.client || "").toLowerCase().includes(q) || (p.projectId || p.id || "").toLowerCase().includes(q); return okStatus && okSearch; });



  useEffect(() => { setCurrentPage(1); }, [tsSearch, tsFilter, trackList.length]);

  const paginated = displayed.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);



  const tsStats = [{ t: "Total", v: trackList.length, i: "📁", c: "var(--app-accent)" }, { t: "In Progress", v: trackList.filter(p => p.status === "In Progress").length, i: "⚡", c: "var(--app-muted)" }, { t: "Completed", v: trackList.filter(p => p.status === "Completed").length, i: "Yes", c: "#22C55E" }, { t: "Pending", v: trackList.filter(p => p.status === "Pending").length, i: "🕚", c: "#F59E0B" }, { t: "On Hold", v: trackList.filter(p => p.status === "On Hold").length, i: "⏸️", c: "var(--app-accent)" }];

  const openAdd = () => { setTsForm(EMPTY); setTsErr({}); setTsEditId(null); setTsModal("add"); };

  const openEdit = (p) => { setTsForm({ projectId: p.projectId || p.id || "", name: p.name || "", client: p.client || "", manager: p.manager || "", employee: p.employee || "", deadline: p.deadline || "", status: p.status || "In Progress", progress: p.progress || p.pct || 0, notes: p.notes || p.note || "" }); setTsErr({}); setTsEditId(p._id || p.id); setTsModal("edit"); };

  const saveTs = async () => { const errs = {}; if (!tsForm.name.trim()) errs.name = "Project name required"; if (!tsForm.client.trim()) errs.client = "Company name required"; if (!tsForm.deadline) errs.deadline = "Deadline required"; const pv = Number(tsForm.progress); if (isNaN(pv) || pv < 0 || pv > 100) errs.progress = "0–100 only"; if (Object.keys(errs).length) { setTsErr(errs); return; } try { setTsSaving(true); const payload = { ...tsForm, progress: Number(tsForm.progress) }; if (tsModal === "add") { if (!payload.projectId) { const maxId = Math.max(...trackList.map(p => { const match = (p.projectId || p.id || "").match(/PRJ(\d+)/); return match ? parseInt(match[1]) : 0; }), 0); payload.projectId = `PRJ${String(maxId + 1).padStart(3, "0")}`; } const res = await axios.post(BASE_URL + "/api/project-status", payload); setTrackList(prev => [res.data, ...prev]); } else { const res = await axios.put(`${BASE_URL}/api/project-status/${tsEditId}`, payload); setTrackList(prev => prev.map(p => (p._id || p.id) === tsEditId ? res.data : p)); } showToast(tsModal === "add" ? "Yes Project added!" : "Yes Project updated!"); setTsModal(null); } catch { if (tsModal === "add") { const local = { ...tsForm, _id: Date.now().toString(), projectId: tsForm.projectId || `PRJ${String(trackList.length + 1).padStart(3, "0")}`, progress: Number(tsForm.progress) }; setTrackList(prev => [local, ...prev]); } else { setTrackList(prev => prev.map(p => (p._id || p.id) === tsEditId ? { ...p, ...tsForm, progress: Number(tsForm.progress) } : p)); } showToast("Yes Saved locally!"); setTsModal(null); } finally { setTsSaving(false); } };

  const deleteTs = async (id) => { if (!window.confirm("Delete?")) return; try { await axios.delete(`${BASE_URL}/api/project-status/${id}`); } catch { } setTrackList(prev => prev.filter(p => (p._id || p.id) !== id)); showToast(" Delete Deleted!"); };

  const B2 = (color) => ({ background: "var(--app-accent-gradient)", color: "#ffffff", border: "none", borderRadius: 12, padding: "12px 22px", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 20px rgba(var(--app-accent-rgb, 124, 58, 237), 0.25)", transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)" });

  return (

    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {tsToast && <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#fff", border: "1.5px solid #22c55e", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#22c55e", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>{tsToast}</div>}

      <div className="dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>

        {tsStats.map(({ t, v, i, c }) => (<div key={t} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 4px 18px rgba(var(--app-accent-rgb, 124, 58, 237),0.07)", border: "1px solid var(--app-border)", position: "relative", overflow: "hidden" }}><div style={{ width: 38, height: 38, borderRadius: 10, background: `${c}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, marginBottom: 8 }}>{i}</div><div style={{ fontSize: 10, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 }}>{t.toUpperCase()}</div><div style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}</div></div>))}

      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>

          <div style={{ position: "relative" }}><span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>Search</span><input placeholder="Search…" value={tsSearch} onChange={e => setTsSearch(e.target.value)} style={{ padding: "9px 14px 9px 34px", border: "1.5px solid var(--app-border)", borderRadius: 10, fontSize: 13, background: "var(--app-bg)", outline: "none", fontFamily: "inherit", width: 240, color: T.text }} /></div>

          {["All", "In Progress", "Pending", "Completed", "On Hold"].map(f => (<button key={f} onClick={() => setTsFilter(f)} style={{ padding: "7px 13px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", border: "1.5px solid", borderColor: tsFilter === f ? "var(--app-accent)" : "var(--app-border)", background: tsFilter === f ? "rgba(var(--app-accent-rgb, 124, 58, 237),0.1)" : "#fff", color: tsFilter === f ? "var(--app-accent)" : "var(--app-muted)" }}>{f}</button>))}

        </div>

        <button onClick={openAdd} style={B2("var(--app-accent)")}>

          <span style={{ fontSize: 16, marginRight: 6 }}>+</span> Add Project Status

        </button>

      </div>

      <SC title={`Project Status (${displayed.length})`}>

        <div style={{ overflowX: "auto" }}>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 900 }}>

            <thead><tr style={{ background: "linear-gradient(90deg,var(--app-bg),var(--app-bg))" }}>{["ID", "Project", "Company Name", "Manager", "Employee", "Deadline", "Status", "Progress", "Notes", "Actions"].map(c => (<th key={c} style={{ padding: "10px 12px", textAlign: "left", color: "var(--app-muted)", fontWeight: 700, fontSize: 11, borderBottom: "2px solid var(--app-border)", whiteSpace: "nowrap" }}>{c.toUpperCase()}</th>))}</tr></thead>

            <tbody>

              {paginated.length === 0 ? <tr><td colSpan={10} style={{ padding: 40, textAlign: "center", color: "var(--app-muted)" }}>No company names found</td></tr>

                : paginated.map((p, i) => (<tr key={p._id || p.id || i} style={{ borderBottom: "1px solid #f3f0ff" }} onMouseEnter={e => e.currentTarget.style.background = "var(--app-bg)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                  <td style={{ padding: "11px 12px", fontFamily: "monospace", fontSize: 11, color: "var(--app-muted)" }}>{p.projectId || p.id || `PRJ${String((currentPage - 1) * itemsPerPage + i + 1).padStart(3, "0")}`}</td>

                  <td style={{ padding: "11px 12px", fontWeight: 700, color: T.text }}>{p.name}</td>

                  <td style={{ padding: "11px 12px" }}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{(p.client || "?")[0].toUpperCase()}</div><span style={{ color: T.text, fontSize: 12 }}>{p.client || "—"}</span></div></td>

                  <td style={{ padding: "11px 12px", color: "var(--app-muted)", fontSize: 12 }}>{p.manager || "—"}</td>

                  <td style={{ padding: "11px 12px", color: "var(--app-muted)", fontSize: 12 }}>{p.employee || "—"}</td>

                  <td style={{ padding: "11px 12px", fontFamily: "monospace", fontSize: 12, color: "var(--app-muted)", whiteSpace: "nowrap" }}>{p.deadline || "—"}</td>

                  <td style={{ padding: "11px 12px" }}>

                    <select

                      value={p.status || "Pending"}

                      onChange={async (e) => {

                        const newStatus = e.target.value;

                        try {

                          await axios.put(`${BASE_URL}/api/project-status/${p._id || p.id}`, { status: newStatus });

                          setTrackList(prev => prev.map(track => (track._id || track.id) === (p._id || p.id) ? { ...track, status: newStatus } : track));

                          showToast("Yes Status updated!");

                        } catch {

                          showToast("❌ Update failed");

                        }

                      }}

                      style={{

                        background: `${sc(p.status)}15`,

                        color: sc(p.status) === "var(--app-muted)" ? "var(--app-sidebar)" : sc(p.status),

                        border: `1.5px solid ${sc(p.status)}40`,

                        padding: "4px 10px",

                        borderRadius: 20,

                        fontSize: 11,

                        fontWeight: 800,

                        outline: "none",

                        cursor: "pointer",

                        appearance: "none",

                        textAlign: "center"

                      }}

                    >

                      {(config?.projectStatuses || ["In Progress", "Pending", "Completed", "On Hold"]).map(s => <option key={s} value={s}>{s}</option>)}

                    </select>

                  </td>

                  <td style={{ padding: "11px 12px", minWidth: 130 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ flex: 1, background: "var(--app-border)", borderRadius: 6, height: 7 }}><div style={{ width: `${p.progress || p.pct || 0}%`, background: p.progress === 100 || p.pct === 100 ? "linear-gradient(90deg,#22C55E,#4ade80)" : "linear-gradient(90deg,var(--app-accent),var(--app-accent))", borderRadius: 6, height: "100%" }} /></div><span style={{ fontSize: 12, fontWeight: 700, color: sc(p.status), width: 32, textAlign: "right" }}>{p.progress || p.pct || 0}%</span></div></td>

                  <td style={{ padding: "11px 12px", maxWidth: 180 }}><span style={{ fontSize: 12, color: "var(--app-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }} title={p.notes || p.note}>{(p.notes || p.note) ? `📝 ${p.notes || p.note}` : "—"}</span></td>

                  <td style={{ padding: "11px 12px" }}>

                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>

                      <ActionBtns onEdit={() => openEdit(p)} onDelete={() => deleteTs(p._id || p.id)} />

                      <button onClick={(e) => {

                        e.stopPropagation();

                        const text = `📊 *Project Status Update*\n\nProject: ${p.name}\nStatus: ${p.status}\nProgress: ${p.progress || p.pct || 0}%\nDeadline: ${p.deadline || "—"}\nNotes: ${p.notes || p.note || "No notes"}`;

                        const wpUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

                        window.open(wpUrl, "_blank");

                      }} style={{ padding: "6px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 7, cursor: "pointer", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>

                        <span></span>

                      </button>

                    </div>

                  </td>

                </tr>))}

            </tbody>

          </table>

        </div>

        <Pagination totalItems={displayed.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />

      </SC>

      {tsModal && (<Mdl title={tsModal === "add" ? "Add Project Status" : "Edit Project Status"} onClose={() => setTsModal(null)}>

        <div className="modal-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>

          <Fld label="Project ID" value={tsForm.projectId || "Auto-generated"} onChange={v => setTsForm({ ...tsForm, projectId: v })} placeholder="Auto-generated (PRJ001)" disabled={tsModal === "add"} />

          <Fld label="Project Name *" value={tsForm.name} onChange={v => { setTsForm({ ...tsForm, name: v }); setTsErr(p => ({ ...p, name: "" })); }} error={tsErr.name} />

          <div style={{ marginBottom: 14 }}><label style={{ display: "block", fontSize: 11, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>COMPANY NAME *</label><ClientDropdown clients={clientNames.length ? clients : []} value={tsForm.client} onChange={v => { setTsForm({ ...tsForm, client: v }); setTsErr(p => ({ ...p, client: "" })); }} error={tsErr.client} />{tsErr.client && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>Warning{tsErr.client}</div>}</div>

          <SearchDropdown label="Manager" items={managerNames} displayKey="name" value={tsForm.manager} onChange={v => setTsForm({ ...tsForm, manager: v })} placeholder="-- Select Manager --" />

          <SearchDropdown label="Employee" items={employeeNames} displayKey="name" value={tsForm.employee} onChange={v => setTsForm({ ...tsForm, employee: v })} placeholder="-- Select Employee --" />

          <Fld label="Deadline *" value={tsForm.deadline} type="date" onChange={v => { setTsForm({ ...tsForm, deadline: v }); setTsErr(p => ({ ...p, deadline: "" })); }} error={tsErr.deadline} />

          <Fld label="Status" value={tsForm.status} onChange={v => setTsForm({ ...tsForm, status: v })} options={["Active", "On Hold", "Completed", "Overdue"]} allowCustom={true} />

          <Fld label="Progress (0–100)" value={String(tsForm.progress)} type="number" onChange={v => { setTsForm({ ...tsForm, progress: v }); setTsErr(p => ({ ...p, progress: "" })); }} error={tsErr.progress} placeholder="e.g. 65" />

        </div>

        <Fld label="Notes" value={tsForm.notes} onChange={v => setTsForm({ ...tsForm, notes: v })} placeholder="Brief update…" />

        <div style={{ background: "var(--app-bg)", borderRadius: 12, padding: "12px 16px", border: "1px solid var(--app-border)", marginBottom: 14 }}>

          <div style={{ fontSize: 11, color: "var(--app-muted)", fontWeight: 700, marginBottom: 8 }}>PROGRESS PREVIEW</div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ flex: 1, background: "var(--app-border)", borderRadius: 6, height: 8 }}><div style={{ width: `${Math.min(100, Math.max(0, Number(tsForm.progress) || 0))}%`, background: "linear-gradient(90deg,var(--app-accent),var(--app-accent))", borderRadius: 6, height: "100%", transition: "width 0.3s" }} /></div><span style={{ fontSize: 13, fontWeight: 800, color: "var(--app-accent)", width: 36, textAlign: "right" }}>{Math.min(100, Math.max(0, Number(tsForm.progress) || 0))}%</span></div>

        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>

          <button onClick={() => setTsModal(null)} style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>

          <button onClick={saveTs} disabled={tsSaving} style={{ ...B2("var(--app-accent)"), opacity: tsSaving ? 0.7 : 1 }}>{tsSaving ? "Saving…" : tsModal === "add" ? "Save Project " : "Next "}</button>

        </div>

      </Mdl>)}

    </div>

  );

}



// •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••

// INTERVIEW PAGE (unchanged)

// •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••

function InterviewPage({ companyId, companyName }) {

  const CID = companyId || "69b8fe0a6e3d6f1e056f3109";

  const CNAME = companyName || "My Business";

  const STORAGE_KEY = `hr_candidates_${CID}`;

  const API_URL = BASE_URL;

  const [candidates, setCandidates] = useState([]);

  const [filter, setFilter] = useState("all");

  const [search, setSearch] = useState("");

  const [viewModal, setViewModal] = useState(null);

  const [toast, setToast] = useState("");

  const [linkCopied, setLinkCopied] = useState(false);

  const [loading, setLoading] = useState(true);

  const appLink = `http://${window.location.host}/interview-apply/${CNAME.replace(/\s+/g, "-")}-${CID}`;

  useEffect(() => {

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    if (saved.length) { setCandidates(saved); setLoading(false); }

    axios.get(`${BASE_URL}/api/interviews?companyId=${CID}`).then(r => {

      const list = r.data?.data || (Array.isArray(r.data) ? r.data : []);

      setCandidates(list);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

    }).catch(() => { }).finally(() => setLoading(false));

  }, [CID]);

  const persist = (list) => { setCandidates(list); localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };



  const updateStatus = (idx, val) => {

    const updated = [...candidates];

    // Convert to capitalized for backend

    const finalVal = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();

    updated[idx] = { ...updated[idx], status: finalVal };

    persist(updated);

    const c = updated[idx];

    const id = c._id || c.id;

    if (id) axios.patch(`${API_URL}/api/interviews/${id}/status`, { status: finalVal }).catch(() => { });

    showToast(`Yes Status  "${finalVal}"`);

    if (viewModal && (viewModal._id || viewModal.id) === id) setViewModal(updated[idx]);

  };



  const copyLink = async () => {

    try {

      const companySlug = `${CNAME}-${CID}`.replace(/\s+/g, "-");

      const link = `http://${window.location.host}/interview-apply/${companySlug}`;

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

      showToast("Yes Link copied!");

    } catch (err) {

      console.error("Copy failed:", err);

      showToast("❌ Copy failed. Please copy manually.");

    }

  };

  const deleteCandidate = (idx) => { if (!window.confirm("Delete this candidate?")) return; const c = candidates[idx]; const id = c._id || c.id; if (id) axios.delete(`${API_URL}/api/interviews/${id}`).catch(() => { }); persist(candidates.filter((_, i) => i !== idx)); showToast(" Delete Deleted"); setViewModal(null); };

  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const [currentPage, setCurrentPage] = useState(1);

  const [itemsPerPage, setItemsPerPage] = useState(10);



  const displayed = candidates.filter(c => { const okF = filter === "all" || (c.status || "pending").toLowerCase() === filter; const q = search.toLowerCase(); const okS = !q || (c.name || "").toLowerCase().includes(q) || (c.role || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || (c.mobile || "").includes(q); return okF && okS; });



  useEffect(() => { setCurrentPage(1); }, [search, filter, candidates.length]);

  const paginated = displayed.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);



  const counts = { total: candidates.length, pending: candidates.filter(c => (c.status || "Pending").toLowerCase() === "pending").length, hired: candidates.filter(c => (c.status || "").toLowerCase() === "hired").length, rejected: candidates.filter(c => (c.status || "").toLowerCase() === "rejected").length };

  const sColor = { pending: "#F59E0B", hired: "#22C55E", rejected: "#EF4444" };

  const sC = (s = "pending") => sColor[s.toLowerCase()] || "var(--app-accent)";

  return (

    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#fff", border: "1.5px solid #22c55e", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#22c55e", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>{toast}</div>}

      <div style={{ background: "var(--app-sidebar)", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", boxShadow: "0 8px 24px rgba(59,7,100,0.25)" }}>

        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(var(--app-accent-rgb, 124, 58, 237),0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}></div>

        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Candidate Application Link</div><div style={{ fontSize: 12, color: "#ffffff", fontFamily: "monospace", wordBreak: "break-all" }}>{appLink}</div></div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>

          <button onClick={copyLink} style={{ background: linkCopied ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.15)", border: `1px solid ${linkCopied ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.3)"}`, borderRadius: 9, padding: "9px 16px", color: linkCopied ? "#4ade80" : "#ffffff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{linkCopied ? "Copied!" : "📋 Copy Link"}</button>

          <button onClick={() => window.open(appLink, "_blank")} style={{ background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", border: "none", borderRadius: 9, padding: "9px 16px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>View Preview Form</button>

        </div>

      </div>

      <div className="dash-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>

        {[{ t: "Total", v: counts.total, i: "🎯", c: "var(--app-accent)" }, { t: "Pending", v: counts.pending, i: "⏳", c: "#F59E0B" }, { t: "Hired", v: counts.hired, i: "✅", c: "#22C55E" }, { t: "Rejected", v: counts.rejected, i: "❌", c: "#EF4444" }].map(({ t, v, i, c }) => (
          <div key={t} style={{ background: "#fff", border: "1.5px solid #E0EEF0", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${c}15`, color: c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{i}</div>
            <div><div style={{ fontSize: 24, fontWeight: 800, color: "#1A2332" }}>{v}</div><div style={{ fontSize: 12, fontWeight: 700, color: "#607D86" }}>{t}</div></div>
          </div>
        ))}

      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 4px 24px rgba(var(--app-accent-rgb, 124, 58, 237),0.08)", border: "1px solid var(--app-border)" }}>

        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "var(--app-sidebar)" }}>All Candidates ({displayed.length})</h3>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>

          <div style={{ position: "relative", flex: 1, minWidth: 200 }}><span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}></span><input placeholder="Search name, role, email, mobile..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", padding: "9px 14px 9px 34px", border: "1.5px solid var(--app-border)", borderRadius: 10, fontSize: 13, background: "var(--app-bg)", outline: "none", fontFamily: "inherit", color: "var(--app-sidebar)", boxSizing: "border-box" }} /></div>

          {["all", "pending", "hired", "rejected"].map(f => (<button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", border: "1.5px solid", borderColor: filter === f ? (f === "all" ? "var(--app-accent)" : sC(f)) : "var(--app-border)", background: filter === f ? `${f === "all" ? "var(--app-accent)" : sC(f)}15` : "#fff", color: filter === f ? (f === "all" ? "var(--app-accent)" : sC(f)) : "var(--app-muted)", transition: "all 0.15s" }}>{f === "all" ? "🎯 All" : f === "pending" ? "⏳ Pending" : f === "hired" ? "Yes Hired" : "❌ Rejected"}</button>))}

        </div>

        {loading ? (<div style={{ textAlign: "center", padding: 50, color: "var(--app-muted)" }}>Loading candidates...</div>) : displayed.length === 0 ? (<div style={{ textAlign: "center", padding: "50px 20px", color: "var(--app-muted)" }}><div style={{ fontSize: 48, marginBottom: 12 }}>📬</div><div style={{ fontSize: 15, fontWeight: 700, color: "var(--app-sidebar)", marginBottom: 6 }}>{candidates.length === 0 ? "No applications yet" : "No results found"}</div></div>) : (

          <div style={{ overflowX: "auto" }}>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 950 }}>

              <thead><tr style={{ background: "linear-gradient(90deg,var(--app-bg),var(--app-bg))" }}>{["#", "Candidate", "Contact", "Experience", "Role", "Interviewer", "Date", "Status", "Resume", "Actions"].map(h => (<th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--app-muted)", fontWeight: 700, fontSize: 10, borderBottom: "2px solid var(--app-border)", whiteSpace: "nowrap" }}>{h.toUpperCase()}</th>))}</tr></thead>

              <tbody>

                {paginated.map((c, i) => {

                  const idx = candidates.indexOf(c); const status = (c.status || "pending").toLowerCase(); const resumeUrl = c.resumeUrl || (c.resumePath ? `${BASE_URL}/uploads/resumes/${c.resumePath.split(/[\\/]/).pop()}` : null);

                  const finalResumeUrl = resumeUrl; return (

                    <tr key={c._id || c.id || i} style={{ borderBottom: "1px solid #f3f0ff", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--app-bg)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                      <td style={{ padding: "12px 12px", color: "var(--app-muted)", fontSize: 11, fontFamily: "monospace" }}>{String((currentPage - 1) * itemsPerPage + i + 1).padStart(3, "0")}</td>

                      <td style={{ padding: "12px 12px" }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{(c.name || "?")[0].toUpperCase()}</div><span style={{ fontWeight: 700, color: "var(--app-sidebar)" }}>{c.name || "—"}</span></div></td>

                      <td style={{ padding: "12px 12px" }}><div style={{ fontSize: 12, color: "var(--app-muted)" }}>{c.email || "—"}</div><div style={{ fontSize: 11, color: "var(--app-muted)", marginTop: 2 }}>{c.mobile || ""}</div></td>

                      <td style={{ padding: "12px 12px" }}>{(c.experience || "").toLowerCase() === "fresher" ? <span style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.25)", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>🎓 Fresher</span> : <span style={{ background: "rgba(var(--app-accent-rgb, 124, 58, 237),0.12)", color: "var(--app-accent)", border: "1px solid rgba(var(--app-accent-rgb, 124, 58, 237),0.25)", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>💼 {c.years || "?"}yrs</span>}</td>

                      <td style={{ padding: "12px 12px", fontWeight: 600, color: "var(--app-sidebar)", fontSize: 12 }}>{c.role || "—"}</td>

                      <td style={{ padding: "12px 12px", fontSize: 12, color: "var(--app-muted)" }}>{c.interviewerName || <span style={{ color: "#ddd" }}>—</span>}</td>

                      <td style={{ padding: "12px 12px", fontSize: 12, color: "var(--app-muted)", fontFamily: "monospace", whiteSpace: "nowrap" }}>{fmt(c.date || c.createdAt)}</td>

                      <td style={{ padding: "12px 12px" }}><select value={status} onChange={e => updateStatus(idx, e.target.value)} style={{ background: status === "hired" ? "rgba(34,197,94,0.1)" : status === "rejected" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", border: `1.5px solid ${sC(status)}44`, borderRadius: 8, padding: "5px 10px", color: sC(status), fontSize: 12, fontWeight: 700, cursor: "pointer", outline: "none", fontFamily: "inherit" }}><option value="pending">⏳ Pending</option><option value="hired">Yes Hired</option><option value="rejected">❌ Rejected</option></select></td>

                      <td style={{ padding: "12px 12px" }}>{finalResumeUrl ? <button onClick={() => setViewModal({ ...c, _resolvedResumeUrl: finalResumeUrl })} style={{ background: "rgba(var(--app-accent-rgb, 124, 58, 237),0.1)", border: "1px solid rgba(var(--app-accent-rgb, 124, 58, 237),0.3)", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "var(--app-accent)", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap" }}>📄</button> : <span style={{ fontSize: 11, color: "#ddd" }}>—</span>}</td>

                      <td style={{ padding: "12px 12px" }}><div style={{ display: "flex", gap: 5 }}><button onClick={() => setViewModal({ ...c, _resolvedResumeUrl: finalResumeUrl })} style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", borderRadius: 7, padding: "5px 10px", fontSize: 12, color: "var(--app-muted)", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>👤</button><button onClick={() => deleteCandidate(idx)} style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 7, padding: "5px 10px", fontSize: 12, color: "#ef4444", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}> Delete</button></div></td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        )}

        <Pagination totalItems={displayed.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />

      </div>

      {viewModal && (

        <div style={{ position: "fixed", inset: 0, background: "rgba(59,7,100,0.55)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>

          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 820, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(var(--app-accent-rgb, 124, 58, 237),0.25)" }}>

            <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--app-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(90deg,var(--app-bg),var(--app-bg))", flexShrink: 0 }}>

              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--app-sidebar)" }}>👤 Candidate Profile</h2>

              <button onClick={() => setViewModal(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--app-muted)", padding: "4px 8px" }}>Close</button>

            </div>

            <div style={{ overflowY: "auto", padding: "20px 22px", flex: 1 }}>

              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, background: "linear-gradient(135deg,var(--app-bg),var(--app-bg))", borderRadius: 14, border: "1px solid var(--app-border)", marginBottom: 18 }}>

                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 800, flexShrink: 0 }}>

                  {(viewModal.name || "?")[0].toUpperCase()}

                </div>

                <div style={{ flex: 1 }}>

                  <div style={{ fontSize: 17, fontWeight: 800, color: "var(--app-sidebar)" }}>{viewModal.name}</div>

                  <div style={{ fontSize: 13, color: "var(--app-accent)", fontWeight: 600, marginTop: 2 }}>{viewModal.role || "—"}</div>

                </div>

                <span style={{ background: `${sC(viewModal.status || "Pending")}18`, color: sC(viewModal.status || "Pending"), border: `1px solid ${sC(viewModal.status || "Pending")}33`, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>

                  {viewModal.status?.toLowerCase() === "hired" ? "Yes Hired" : viewModal.status?.toLowerCase() === "rejected" ? "❌ Rejected" : "⏳ Pending"}

                </span>

              </div>



              {viewModal._resolvedResumeUrl && (

                <div style={{ marginBottom: 20 }}>

                  <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "var(--app-sidebar)" }}>📄 Resume</h3>

                  <div style={{ border: "1.5px solid var(--app-border)", borderRadius: 12, overflow: "hidden", background: "var(--app-bg)" }}>

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

                    <div style={{ padding: "12px", background: "#fff", borderTop: "1px solid var(--app-border)", display: "flex", justifyContent: "center" }}>

                      <a href={viewModal._resolvedResumeUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--app-accent)", color: "#fff", padding: "8px 16px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>

                        Open in New Tab

                      </a>

                    </div>

                  </div>

                </div>

              )}



              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>

                <div style={{ padding: 12, background: "var(--app-bg)", borderRadius: 10, border: "1px solid var(--app-border)" }}>

                  <div style={{ fontSize: 11, color: "var(--app-muted)", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>📧 Email</div>

                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--app-sidebar)" }}>{viewModal.email || "—"}</div>

                </div>

                <div style={{ padding: 12, background: "var(--app-bg)", borderRadius: 10, border: "1px solid var(--app-border)" }}>

                  <div style={{ fontSize: 11, color: "var(--app-muted)", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>📱 Mobile</div>

                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--app-sidebar)" }}>{viewModal.mobile || "—"}</div>

                </div>

                <div style={{ padding: 12, background: "var(--app-bg)", borderRadius: 10, border: "1px solid var(--app-border)" }}>

                  <div style={{ fontSize: 11, color: "var(--app-muted)", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>💼 Experience</div>

                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--app-sidebar)" }}>

                    {(viewModal.experience || "").toLowerCase() === "fresher" ? "🎓 Fresher" : `💼 ${viewModal.years || "?"} years`}

                  </div>

                </div>

                <div style={{ padding: 12, background: "var(--app-bg)", borderRadius: 10, border: "1px solid var(--app-border)" }}>

                  <div style={{ fontSize: 11, color: "var(--app-muted)", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>📅 Applied Date</div>

                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--app-sidebar)" }}>{fmt(viewModal.date || viewModal.createdAt)}</div>

                </div>

                <div style={{ padding: 12, background: "var(--app-bg)", borderRadius: 10, border: "1px solid var(--app-border)" }}>

                  <div style={{ fontSize: 11, color: "var(--app-muted)", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>👨‍💼 Interviewer</div>

                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--app-sidebar)" }}>{viewModal.interviewerName || "—"}</div>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}



function ProfileModal({ user, setUser, onClose, onLogout, companyLogo, onLogoChange, paymentHistory, projects, invoices, onLogoUpload }) {



  const logoRef = useRef();

  const [editingComp, setEditingComp] = useState(false);

  const [compName, setCompName] = useState(user?.companyName || "");

  const [upiId, setUpiId] = useState(user?.upiId || "");

  const displayName = user?.companyName || user?.name || user?.email?.split("@")[0] || "Admin";

  const initials = (user?.companyName || user?.name || "AD").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);



  const saveCompDetails = async () => {

    try {

      await axios.put(`${BASE_URL}/api/subadmins/${user.id || user._id}`, { companyName: compName, upiId: upiId });

      const updated = { ...user, companyName: compName, upiId: upiId };

      localStorage.setItem("user", JSON.stringify(updated));

      setUser(updated);

      setEditingComp(false);

    } catch (err) { alert("Failed to save company details"); }

  };

  return (

    <div style={{ position: "fixed", inset: 0, background: "rgba(59,7,100,0.6)", backdropFilter: "blur(10px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>

      <div style={{ background: "#fff", borderRadius: 22, width: "100%", maxWidth: 650, maxHeight: "90vh", boxShadow: "0 32px 80px rgba(var(--app-accent-rgb, 124, 58, 237),0.3)", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={e => e.stopPropagation()}>

        <div style={{ background: "var(--app-accent)", padding: "28px 28px 22px", textAlign: "center", flexShrink: 0, position: "relative" }}>

          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.2)", border: "none", width: 30, height: 30, borderRadius: 8, color: "#fff", fontSize: 16, cursor: "pointer" }}>✕</button>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 8, margin: "0 auto 12px", position: "relative", width: "fit-content" }}>

            {companyLogo ? (

              <img src={companyLogo} alt="logo" style={{ height: 72, width: "auto", maxWidth: "180px", borderRadius: 16, objectFit: "contain", flexShrink: 0, border: "3px solid rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.22)", display: "block" }} />

            ) : (

              <div style={{ width: 72, height: 72, borderRadius: 16, background: "rgba(255,255,255,0.22)", border: "3px solid rgba(255,255,255,0.45)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, fontWeight: 800 }}>{initials}</div>

            )}

            <button

              onClick={() => logoRef.current.click()}

              style={{ position: "absolute", bottom: -5, right: -5, padding: "6px", background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}

              title="Upload Logo"

            >

              📷

            </button>

          </div>

          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff" }}>{displayName}</h2>

          <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{user?.email || "—"}</p>

          {user?.role && !user.role.toLowerCase().includes("subadmin") && (

            <span style={{ display: "inline-block", marginTop: 8, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 100, padding: "3px 12px", fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: 1, textTransform: "uppercase" }}>{user.role}</span>

          )}

        </div>



        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 }}>

          {/* Personal Info */}

          <div>

            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--app-muted)", marginBottom: 12, letterSpacing: 1 }}>PERSONAL DETAILS</div>

            {[{ icon: "👤", label: "Full Name", value: displayName }, { icon: "📧", label: "Email", value: user?.email || "—" }, { icon: "📱", label: "Phone", value: user?.phone || "—" }, { icon: "🎬", label: "Role", value: user?.role || "user" }].map(({ icon, label, value }) => (

              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--app-bg)", borderRadius: 9, border: "1px solid var(--app-border)", marginBottom: 7 }}>

                <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(var(--app-accent-rgb, 124, 58, 237),0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{icon}</div>

                <div style={{ flex: 1 }}>

                  <div style={{ fontSize: 9, color: "var(--app-muted)", fontWeight: 700, textTransform: "uppercase" }}>{label}</div>

                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--app-sidebar)", marginTop: 1 }}>{value}</div>

                </div>

              </div>

            ))}



            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#fdf4ff", borderRadius: 9, border: "1px solid #fae8ff", marginBottom: 16 }}>

              <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(168,85,247,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>🏢</div>

              <div style={{ flex: 1 }}>

                <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, textTransform: "uppercase" }}>Company Name</div>

                {editingComp ? (

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>

                    <div style={{ display: "flex", gap: 5 }}>

                      <input value={compName} onChange={e => setCompName(e.target.value)} placeholder="Company Name" style={{ flex: 1, padding: "4px 8px", fontSize: 11, border: "1.5px solid var(--app-border)", borderRadius: 6, outline: "none" }} />

                    </div>

                    <div style={{ display: "flex", gap: 5 }}>

                      <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="UPI ID (e.g. name@okaxis)" style={{ flex: 1, padding: "4px 8px", fontSize: 11, border: "1.5px solid var(--app-border)", borderRadius: 6, outline: "none" }} />

                      <button onClick={saveCompDetails} style={{ background: "#22c55e", border: "none", color: "#fff", padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Save</button>

                    </div>

                  </div>

                ) : (

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 1 }}>

                    <div style={{ display: "flex", flexDirection: "column" }}>

                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--app-sidebar)" }}>{user?.companyName || "Not Set"}</div>

                      {user?.upiId && <div style={{ fontSize: 10, color: "var(--app-accent)", fontWeight: 700 }}>UPI: {user.upiId}</div>}

                    </div>

                    <button onClick={() => setEditingComp(true)} style={{ background: "none", border: "none", color: "var(--app-accent)", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Edit</button>

                  </div>

                )}

              </div>

            </div>



            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--app-muted)", marginBottom: 12, letterSpacing: 1, marginTop: 20 }}>BUSINESS STATUS</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

              <div style={{ background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: 12, padding: 12 }}>

                <div style={{ fontSize: 10, color: "#166534", fontWeight: 700 }}>PROJECTS</div>

                <div style={{ fontSize: 20, fontWeight: 800, color: "#15803d" }}>{projects.length}</div>

              </div>

              <div style={{ background: "#eff6ff", border: "#dbeafe", borderRadius: 12, padding: 12 }}>

                <div style={{ fontSize: 10, color: "#1e40af", fontWeight: 700 }}>INVOICES</div>

                <div style={{ fontSize: 20, fontWeight: 800, color: "#1d4ed8" }}>{invoices.length}</div>

              </div>

            </div>

          </div>



          {/* Business/Payment Info */}

          <div>

            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--app-muted)", marginBottom: 12, letterSpacing: 1 }}>PAYMENT HISTORY</div>

            <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #f3f0ff", borderRadius: 12, padding: 4 }}>

              {paymentHistory.length === 0 ? (

                <div style={{ textAlign: "center", padding: 20, color: "var(--app-muted)", fontSize: 12 }}>No payments found</div>

              ) : (

                paymentHistory.slice(0, 5).map((payment, i) => (

                  <div key={i} style={{

                    display: "flex",

                    justifyContent: "space-between",

                    alignItems: "center",

                    padding: "10px 12px",

                    borderBottom: i < paymentHistory.length - 1 ? "1px solid var(--app-bg)" : "none",

                    background: i % 2 === 0 ? "#fdfbff" : "transparent"

                  }}>

                    <div style={{ flex: 1, minWidth: 0 }}>

                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--app-sidebar)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>

                        {payment.description || payment.type}

                      </div>

                      <div style={{ fontSize: 9, color: "var(--app-muted)" }}>

                        {new Date(payment.paymentDate).toLocaleDateString()}

                      </div>

                    </div>

                    <div style={{ textAlign: "right", marginLeft: 10 }}>

                      <div style={{ fontSize: 11, fontWeight: 800, color: "#22c55e" }}>Rs.{payment.amount?.toLocaleString() || "0"}</div>

                      <div style={{ fontSize: 9, color: "#22c55e", fontWeight: 700, textTransform: "uppercase" }}>{payment.status || "paid"}</div>

                    </div>

                  </div>

                ))

              )}

            </div>



            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--app-muted)", marginBottom: 12, letterSpacing: 1, marginTop: 24 }}>PROJECT PROGRESS</div>

            <div style={{ maxHeight: 180, overflowY: "auto" }}>

              {projects.length === 0 ? (

                <div style={{ textAlign: "center", padding: 20, color: "var(--app-muted)", fontSize: 12 }}>No projects in progress</div>

              ) : (

                projects.slice(0, 3).map(p => (

                  <div key={p._id} style={{ marginBottom: 12, padding: "8px 12px", background: "var(--app-bg)", borderRadius: 12, border: "1px solid var(--app-border)" }}>

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>

                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--app-sidebar)" }}>{p.name}</span>

                      <span style={{ fontSize: 10, fontWeight: 800, color: sc(p.status) }}>{p.progress || 0}%</span>

                    </div>

                    <div style={{ background: "var(--app-border)", borderRadius: 4, height: 5 }}>

                      <div style={{ width: `${p.progress || 0}%`, background: (p.progress || 0) === 100 ? "linear-gradient(90deg,#22C55E,#4ade80)" : "linear-gradient(90deg,var(--app-accent),var(--app-accent))", borderRadius: 4, height: "100%" }} />

                    </div>

                  </div>

                ))

              )}

            </div>

          </div>

        </div>



        <div style={{ padding: "12px 24px 18px", borderTop: "1px solid var(--app-border)", flexShrink: 0, background: "#faf8ff" }}>

          <div style={{ display: "flex", gap: 10 }}>

            <button onClick={onClose} style={{ flex: 1, padding: "10px", background: "#fff", border: "1.5px solid var(--app-border)", borderRadius: 9, fontSize: 13, fontWeight: 600, color: "var(--app-sidebar)", cursor: "pointer", fontFamily: "inherit" }}>Close</button>

            <button onClick={onLogout} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#EF4444,#dc2626)", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>🚪 Logout</button>

          </div>

        </div>

        <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }}

          onChange={onLogoUpload}

        />



      </div>

    </div>

  );

}



function Sidebar({ user, active, setActive, onLogout, open, onClose, navItems, companyLogo, onLogoChange, enforceMySubscriptions, onLogoUploadClick, setSelectedProjectForTasks, desktopOpen }) {
  const items = navItems || NAV;

  const [isDesktopWidth, setIsDesktopWidth] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 769);
  useEffect(() => {
    const onResize = () => setIsDesktopWidth(window.innerWidth >= 769);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const companyName = user?.companyName || "";

  const initials = (companyName || "WS").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const roleDisplay = (user?.role || "").toLowerCase().includes("subadmin") ? "" : (user?.role || "ADMIN").toUpperCase();



  // Track expanded groups

  const [expanded, setExpanded] = useState(() => {

    const initial = {};

    items.forEach(item => {

      if (item.type === "group") {

        const hasActive = item.items.some(i => i.key === active);

        if (hasActive) initial[item.label] = true;

      }

    });

    return initial;

  });



  const toggleGroup = (label) => {

    setExpanded(prev => ({ ...prev, [label]: !prev[label] }));

  };



  const NavItem = ({ n, isSub = false }) => {

    const on = active === n.key;

    return (

      <button

        data-nav-key={n.key}

        onClick={() => {

          if (n.key === "tasks") setSelectedProjectForTasks(null);

          setActive(n.key);

          onClose();

        }}

        style={{

          width: "100%",

          display: "flex",

          alignItems: "center",

          gap: 9,

          padding: isSub ? "8px 12px 8px 32px" : "9px 12px",

          background: on ? "linear-gradient(90deg,rgba(255,255,255,0.25),rgba(255,255,255,0.05))" : "transparent",

          border: on ? "1px solid rgba(255,255,255,0.35)" : "1px solid transparent",

          borderRadius: 11,

          color: "#ffffff",

          fontWeight: on ? 800 : 700,

          fontSize: isSub ? 12.5 : 13,

          cursor: "pointer",

          marginBottom: 2,

          textAlign: "left",

          fontFamily: "inherit",

          transition: "all 0.2s"

        }}

      >

        <span style={{ fontSize: isSub ? 13 : 15 }}>{n.icon}</span>

        <span style={{ flex: 1 }}>{n.label}</span>

        {on && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--app-accent)", flexShrink: 0 }} />}

      </button>

    );

  };



  return (

    <>

      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 998, display: "block" }} className="mob-overlay" />}

      <aside className={`sidebar ${open ? 'open' : ''} ${isDesktopWidth && !desktopOpen ? 'sidebar-collapsed' : ''}`} style={{
        transform: `translateX(${(open || (isDesktopWidth && desktopOpen)) ? '0' : '-100%'})`,
        transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1), width 0.28s ease, min-width 0.28s ease"
      }}>




        <div className="profile-area">
          <div className="profile-avatar" style={{ overflow: "hidden" }}>
            {companyLogo ? (
              <img src={companyLogo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            ) : (
              (initials && /^[A-Z]{1,2}$/.test(initials)) ? initials : "MB"
            )}
          </div>
          <div>
            <div className="profile-name">{user?.companyName || user?.name || "Admin"}</div>



          </div>

        </div>



        <nav className="nav">

          {items.map(n => {

            if (n.type === "group") {

              const hasActive = n.items.some(i => i.key === active);

              return (

                <div key={n.label}>

                  <div className="nav-label">{n.label}</div>

                  {n.items.map(sub => {

                    const on = active === sub.key;

                    return (
                      <div
                        key={sub.key}
                        className={`nav-item ${on ? 'active' : ''}`}
                        onClick={() => {
                          if (sub.key === "tasks") setSelectedProjectForTasks(null);
                          setActive(sub.key);
                          onClose();
                        }}
                      >
                        <i className={`ti ti-${sub.icon?.includes('ti-') ? sub.icon.split('ti-')[1] : 'point'}`}></i> {sub.label}
                      </div>

                    );

                  })}

                </div>

              );

            }

            const on = active === n.key;

            return (
              <div
                key={n.key}
                className={`nav-item ${on ? 'active' : ''}`}
                onClick={() => {
                  if (n.key === "tasks") setSelectedProjectForTasks(null);
                  setActive(n.key);
                  onClose();
                }}
              >
                <i className={`ti ti-${n.icon?.includes('ti-') ? n.icon.split('ti-')[1] : 'point'}`}></i> {n.label}
              </div>
            );

          })}

        </nav>



        <div className="sidebar-bottom" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px' }}>



          <button onClick={onLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: '800', color: '#fff', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}>

            <i className="ti ti-logout" style={{ fontSize: 18 }}></i> Logout

          </button>

        </div>

      </aside>

      <div className="sidebar-spacer" style={{ width: desktopOpen ? 210 : 0, minWidth: desktopOpen ? 210 : 0, flexShrink: 0, transition: "width 0.28s ease, min-width 0.28s ease" }} />
    </>

  );

}





const DEFAULT_PLANS = [


  {

    title: "Starter", price: 999, icon: "🌱",

    features: ["5 Projects", "10 Invoices", "Single business manage", "Managers: 50", "Clients: 50", "Employees: 50", "Email Support"]

  },

  {

    title: "Professional", price: 2999, icon: "🌱", type: "pro",

    features: ["Unlimited Projects", "Unlimited Invoices", "Multiple business manage", "Managers: Unlimited", "Clients: Unlimited", "Employees: Unlimited", "Priority Support"]

  }

];



function PackagesPage({ packages, onSubscribe, THEME }) {

  const displayedPackages = (packages && packages.length > 0) ? [...packages].sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)) : DEFAULT_PLANS;



  return (

    <div style={{

      background: `linear-gradient(135deg, #f8fafc 0%, ${THEME.bg} 100%)`,

      borderRadius: 24,

      padding: "50px 20px",

      position: "relative",

      minHeight: "70vh",

      overflow: "hidden",

      boxShadow: "0 10px 40px rgba(0,0,0,0.02)",

      border: `1.5px solid ${THEME.border}`

    }}>

      <div style={{ position: "absolute", top: -100, right: -100, width: 300, height: 300, background: `${THEME.accent}05`, borderRadius: "50%", filter: "blur(60px)" }} />



      <div style={{ textAlign: "center", marginBottom: 44, position: "relative", zIndex: 1 }}>

        <div style={{ display: "inline-block", padding: "6px 16px", background: `${THEME.accent}12`, borderRadius: 100, color: THEME.accent, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 14 }}>💎 Choose Plan</div>

        <h1 style={{ fontSize: 34, fontWeight: 900, color: "#1e1b4b", margin: "0 0 10px", letterSpacing: "-1px", lineHeight: 1 }}>Choose your Plan</h1>

        <p style={{ color: "#64748b", fontWeight: 600, fontSize: 14, maxWidth: 400, margin: "0 auto" }}>Select the best plan for your business growth.</p>

      </div>



      {displayedPackages.length === 0 ? (

        <div style={{ textAlign: "center", padding: "60px 20px", position: "relative", zIndex: 1 }}>

          <div style={{ fontSize: 54, marginBottom: 20, opacity: 0.5 }}>📦</div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#94a3b8", marginBottom: 8 }}>No Packages Available</h2>

        </div>

      ) : (

        <div style={{

          display: "flex",

          flexWrap: "wrap",

          justifyContent: "center",

          gap: 32,

          maxWidth: 1200,

          margin: "0 auto",

          position: "relative",

          zIndex: 1,

          width: "100%"

        }}>

          {displayedPackages.map((p, idx) => {
            const isPro = (p.title || "").toLowerCase().includes("starter") || (p.title || "").toLowerCase() === "popular";

            const features = Array.isArray(p.features) ? p.features : (p.features || "").split(/[\n,]/).map(f => f.trim()).filter(Boolean);

            return (

              <div

                key={p.id || p._id || idx}

                style={{

                  background: "#fff",

                  border: isPro ? `2px solid ${THEME.accent}` : `1.5px solid ${THEME.border}`,

                  borderRadius: 24,

                  padding: "32px 24px",

                  position: "relative",

                  width: "100%",

                  maxWidth: 320,

                  boxShadow: isPro ? `0 15px 40px ${THEME.accent}12` : "0 8px 24px rgba(0,0,0,0.03)",

                  display: "flex",

                  flexDirection: "column",

                  transition: "all 0.2s ease"

                }}

                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}

                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}

              >

                {isPro && (

                  <div style={{

                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",

                    background: THEME.accent, color: "#fff", padding: "4px 16px", borderRadius: 100,

                    fontSize: 9, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase",

                    boxShadow: `0 4px 12px ${THEME.accent}40`, zIndex: 2

                  }}>POPULAR</div>

                )}



                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${THEME.accent}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 20 }}>{p.icon || "Launch"}</div>



                <div style={{ fontSize: 20, fontWeight: 900, color: "#1e1b4b", marginBottom: 4, letterSpacing: "-0.4px" }}>{p.title}</div>

                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 20, fontWeight: 700, textTransform: "uppercase" }}>Monthly Plan</div>



                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 8 }}>

                  <span style={{ fontSize: 42, fontWeight: 900, color: "#1e1b4b", lineHeight: 1, letterSpacing: "-2px" }}>

                    {p.type === "free" ? "Free" : p.price ? `Rs.${parseFloat(p.price).toLocaleString("en-IN")}` : "Custom"}

                  </span>

                  {p.price > 0 && <span style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, fontWeight: 600 }}>/mo</span>}

                </div>



                <div style={{ height: 1, background: "#f1f5f9", margin: "20px 0" }} />



                <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, marginBottom: 24 }}>

                  {features.map((f, i) => (

                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>

                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${THEME.accent}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: THEME.accent, fontWeight: 900, flexShrink: 0 }}>✓</div>

                      <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>{f}</span>

                    </div>

                  ))}

                </div>



                <button

                  onClick={() => onSubscribe(p)}

                  style={{

                    width: "100%", padding: "12px", borderRadius: 12, fontSize: 14,

                    fontWeight: 800, cursor: "pointer", transition: "all 0.15s",

                    fontFamily: "inherit",

                    background: isPro ? THEME.accent : "#f8fafc",

                    border: isPro ? "none" : `1.5px solid ${THEME.border}`,

                    color: isPro ? "#fff" : "#1e1b4b"

                  }}

                  onMouseEnter={e => {

                    if (isPro) e.currentTarget.style.filter = "brightness(1.1)";

                    else e.currentTarget.style.background = "#f1f5f9";

                  }}

                  onMouseLeave={e => {

                    if (isPro) e.currentTarget.style.filter = "brightness(1)";

                    else e.currentTarget.style.background = "#f8fafc";

                  }}

                >

                  {p.type === "free" ? "Start Free" : "Upgrade"}

                </button>

              </div>

            );

          })}

        </div>

      )}

    </div>

  );

}



// •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••

// VENDORS PAGE

// •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••

function VendorsPage({ vendors, setVendors, onAddVendorClick }) {

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

      amountTaxGst: v.amountTaxGst || v.amount || "",

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

      const amt = parseFloat(editForm.amountTaxGst) || 0;

      const payload = {
        ...editForm,
        amount: amt,
        tax: amt,
        gst: amt,
        paidAmount: parseFloat(editForm.paidAmount) || 0,
      };

      if (!payload.date) delete payload.date;

      if (!payload.dateOfPurchase) delete payload.dateOfPurchase;

      const res = await axios.put(`${BASE_URL}/api/vendors/${editVendor._id}`, payload);

      const updatedVendor = { ...editVendor, ...editForm, ...res.data, amountTaxGst: amt };

      setVendors(prev => prev.map(v => v._id === editVendor._id ? updatedVendor : v));

      setEditVendor(null);

      showToast("Yes Vendor updated!");

    } catch (err) {

      showToast("❌ Update failed!");

    } finally { setSaving(false); }

  };



  const doDelete = async () => {

    try {

      await axios.delete(`${BASE_URL}/api/vendors/${deleteTarget._id}`);

      setVendors(prev => prev.filter(v => v._id !== deleteTarget._id));

      setDeleteTarget(null);

      showToast(" Vendor deleted!");

    } catch {

      showToast("❌ Delete failed!");

    }

  };



  return (

    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#fff", border: "1.5px solid #22c55e", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#22c55e", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>{toast}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1A2332", margin: 0 }}>Vendors</h1>
        <button className="create-btn" onClick={onAddVendorClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-plus"></i> Add New Vendor
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {(() => {
          const totalVendors = vendors.length;
          const totalPaid = vendors.reduce((sum, v) => sum + (Number(v.paidAmount) || 0), 0);
          const totalOutstanding = vendors.reduce((sum, v) => {
            const total = Number(v.amountTaxGst || v.amount || 0);
            const paid = Number(v.paidAmount) || 0;
            return sum + Math.max(0, total - paid);
          }, 0);
          return (
            <>
              <div style={{ background: "#fff", border: "1.5px solid #E0EEF0", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(0,188,212,0.1)", color: "var(--app-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}><i className="ti ti-truck-delivery" /></div>
                <div><div style={{ fontSize: 24, fontWeight: 800, color: "#1A2332" }}>{totalVendors}</div><div style={{ fontSize: 12, fontWeight: 700, color: "#607D86" }}>Total Vendors</div></div>
              </div>
              <div style={{ background: "#fff", border: "1.5px solid #E0EEF0", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(22,163,74,0.1)", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}><i className="ti ti-cash" /></div>
                <div><div style={{ fontSize: 24, fontWeight: 800, color: "#1A2332" }}>{formatCurrency(totalPaid)}</div><div style={{ fontSize: 12, fontWeight: 700, color: "#607D86" }}>Total Paid</div></div>
              </div>
              <div style={{ background: "#fff", border: "1.5px solid #E0EEF0", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(220,38,38,0.1)", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}><i className="ti ti-alert-circle" /></div>
                <div><div style={{ fontSize: 24, fontWeight: 800, color: "#1A2332" }}>{formatCurrency(totalOutstanding)}</div><div style={{ fontSize: 12, fontWeight: 700, color: "#607D86" }}>Outstanding Balance</div></div>
              </div>
            </>
          );
        })()}
      </div>

      <SC title={`All Vendors (${filtered.length})`}>

        <Search value={search} onChange={setSearch} placeholder="Search by name, product..." />

        <div style={{ overflowX: "auto" }}>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 900 }}>

            <thead><tr style={{ background: "linear-gradient(90deg,var(--app-bg),var(--app-bg))" }}>

              {["Vendor Name", "Product", "Total Amount", "Paid Amount", "Balance Due", "Mode", "Purchase Date", "Actions"].map(c => (

                <th key={c} style={{ padding: "10px 14px", textAlign: "left", color: "var(--app-muted)", fontWeight: 700, fontSize: 11, borderBottom: "2px solid var(--app-border)", whiteSpace: "nowrap" }}>{c.toUpperCase()}</th>

              ))}

            </tr></thead>

            <tbody>

              {filtered.length === 0 ? <tr><td colSpan={8} style={{ padding: 30, textAlign: "center", color: "var(--app-muted)" }}>No vendors found</td></tr>

                : filtered.map((v, i) => {

                  const total = Number(v.amountTaxGst || v.amount || 0);

                  const paid = Number(v.paidAmount || 0);

                  const balance = total - paid;

                  return (

                    <tr key={v._id || i} onClick={() => setViewVendor(v)} style={{ borderBottom: "1px solid #f3f0ff", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = "var(--app-bg)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                      <td style={{ padding: "12px 14px", fontWeight: 700, color: T.text }}>{v.vendorName}</td>

                      <td style={{ padding: "12px 14px", color: "var(--app-muted)" }}>{v.vendorProduct}</td>

                      <td style={{ padding: "12px 14px", color: "#6b7280" }}>{formatCurrency(total, v.currency)}</td>

                      <td style={{ padding: "12px 14px", color: "#22C55E", fontWeight: 600 }}>{formatCurrency(paid, v.currency)}</td>

                      <td style={{ padding: "12px 14px", color: balance > 0 ? "#EF4444" : "#22C55E", fontWeight: 700 }}>{formatCurrency(balance, v.currency)}</td>

                      <td style={{ padding: "12px 14px" }}><Badge label={v.modeOfPayment} /></td>

                      <td style={{ padding: "12px 14px", color: "var(--app-muted)" }}>{v.dateOfPurchase ? new Date(v.dateOfPurchase).toLocaleDateString() : "—"}</td>

                      <td style={{ padding: "12px 14px" }} onClick={e => e.stopPropagation()}>

                        <ActionBtns onView={() => setViewVendor(v)} onEdit={() => openEdit(v)} onDelete={() => setDeleteTarget(v)} />

                      </td>

                    </tr>

                  );

                })}

            </tbody>

          </table>

        </div>

      </SC>



      {/* View Modal */}

      {viewVendor && (

        <Mdl title="Vendor Details" onClose={() => setViewVendor(null)} maxWidth={500}>

          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, background: "linear-gradient(135deg,var(--app-bg),var(--app-bg))", borderRadius: 14, border: "1px solid var(--app-border)", marginBottom: 18 }}>

            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 800, flexShrink: 0 }}>{(viewVendor.vendorName || "?")[0].toUpperCase()}</div>

            <div>

              <div style={{ fontSize: 17, fontWeight: 800, color: T.text }}>{viewVendor.vendorName}</div>

              <div style={{ fontSize: 13, color: "var(--app-accent)", marginTop: 2 }}>{viewVendor.vendorProduct}</div>

            </div>

          </div>

          <InfoRow icon="💰" label="Total Amount" value={formatCurrency(viewVendor.amountTaxGst || viewVendor.amount, viewVendor.currency)} />

          <InfoRow icon="💸" label="Paid Amount" value={formatCurrency(viewVendor.paidAmount, viewVendor.currency)} />

          <InfoRow icon="⚖️" label="Balance Due" value={formatCurrency(((viewVendor.amountTaxGst || viewVendor.amount || 0)) - (viewVendor.paidAmount || 0), viewVendor.currency)} />

          <InfoRow icon="💳" label="Mode of Payment" value={viewVendor.modeOfPayment} />

          <InfoRow icon="📅" label="Date of Purchase" value={viewVendor.dateOfPurchase ? new Date(viewVendor.dateOfPurchase).toLocaleDateString() : "—"} />

          <InfoRow icon="📝" label="Description" value={viewVendor.productDescription} />

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>

            <button onClick={() => { setViewVendor(null); openEdit(viewVendor); }} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>Edit</button>

            <button onClick={() => { setViewVendor(null); setDeleteTarget(viewVendor); }} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg,#EF4444,#dc2626)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}> Delete</button>

          </div>

        </Mdl>

      )}



      {/* Edit Modal */}

      {editVendor && (

        <Mdl title="Edit Vendor" onClose={() => setEditVendor(null)}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>

            <Fld label="Vendor Name *" value={editForm.vendorName} onChange={v => setEditForm(p => ({ ...p, vendorName: v }))} error={editErr.vendorName} />

            <Fld label="Product Name *" value={editForm.vendorProduct} onChange={v => setEditForm(p => ({ ...p, vendorProduct: v }))} error={editErr.vendorProduct} />

            <Fld label="Total Amount *" value={editForm.amountTaxGst} type="number" onChange={v => setEditForm(p => ({ ...p, amountTaxGst: v }))} error={editErr.amountTaxGst} />

            <Fld label="Paid Amount *" value={editForm.paidAmount} type="number" onChange={v => setEditForm(p => ({ ...p, paidAmount: v }))} error={editErr.paidAmount} />

            <Fld label="Date of Purchase" value={editForm.dateOfPurchase} type="date" onChange={v => setEditForm(p => ({ ...p, dateOfPurchase: v }))} />

            <Fld label="Mode of Payment" value={editForm.modeOfPayment} onChange={v => setEditForm(p => ({ ...p, modeOfPayment: v }))} options={["Cash", "Bank Transfer", "UPI", "Cheque"]} />

          </div>

          <Fld label="Product Description" value={editForm.productDescription} onChange={v => setEditForm(p => ({ ...p, productDescription: v }))} />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>

            <button onClick={() => setEditVendor(null)} style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>

            <button onClick={saveEdit} disabled={saving} style={{ background: "var(--app-accent-gradient)", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Saving…" : "Save Changes "}</button>

          </div>

        </Mdl>

      )}



      {deleteTarget && <ConfirmModal title="Delete Vendor" message={`Are you sure you want to delete "${deleteTarget.vendorName}"?`} onConfirm={doDelete} onCancel={() => setDeleteTarget(null)} />}



    </div>

  );

}




// MAIN DASHBOARD



export default function Dashboard({ setUser, user, fixedLogo }) {

  const companyNameStr = user?.companyName || "M Business";

  const [dashSearch, setDashSearch] = useState("");
  const [dashTasksProj, setDashTasksProj] = useState(null);
  const [expandedMobileProjectIdx, setExpandedMobileProjectIdx] = useState(1);

  const [pendingNewClientId, setPendingNewClientId] = useState(null);

  const [active, setActive] = useState(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (params && params.get("payment")) return "mysubscriptions";

    const saved = localStorage.getItem("activeTab_subadmin") || "dashboard";
    // Never trust a stale "mysubscriptions" tab from a previous session/account
    // as the initial screen — it causes the Upgrade Plan page to flash before
    // the real subscription check (fetchSubscription) redirects appropriately.
    // Start on "dashboard" instead; the subscription-gate effect will still
    // send the user to mysubscriptions if they genuinely need to pick a plan.
    if (saved === "mysubscriptions" || ["create-project", "edit-project"].includes(saved)) return "dashboard";
    return saved;
  });

  useEffect(() => {
    const toSave = ["create-project", "edit-project"].includes(active)
      ? "projects"
      : active;
    localStorage.setItem("activeTab_subadmin", toSave);

  }, [active]);
  const [modal, setModal] = useState(null);
  const [jumpProject, setJumpProject] = useState(() => {
    // jumpProject itself can't be fully restored yet (the real `projects`
    // list hasn't loaded at this point in initial render) — a lightweight
    // placeholder is set here just so the "project-details" view doesn't
    // flash back to the Projects list for a frame; a later effect (placed
    // after `projects` is declared, to avoid a temporal-dead-zone error)
    // swaps in the real, full project object once `projects` finishes loading.
    try {
      const savedId = localStorage.getItem("jumpProjectId_subadmin");
      const savedActive = localStorage.getItem("activeTab_subadmin");
      if (savedId && savedActive === "project-details") return { _id: savedId, _restoring: true };
    } catch (e) { }
    return null;
  });

  // Keep the saved project id in sync whenever the selected project changes.
  useEffect(() => {
    try {
      if (jumpProject?._id) {
        localStorage.setItem("jumpProjectId_subadmin", jumpProject._id);
      } else {
        localStorage.removeItem("jumpProjectId_subadmin");
      }
    } catch (e) { }
  }, [jumpProject?._id]);
  const [jumpInvoicePrefill, setJumpInvoicePrefill] = useState(null);
  const [pendingInvoiceNav, setPendingInvoiceNav] = useState(false);

  useEffect(() => {
    if (pendingInvoiceNav && jumpInvoicePrefill) {
      setActive("invoices");
      setPendingInvoiceNav(false);
    }
  }, [pendingInvoiceNav, jumpInvoicePrefill]);

  useEffect(() => {
    if (active === "edit-project" && !jumpProject) {
      setActive("projects");
    }
  }, [active, jumpProject]);
  const [_navPending, startNavTransition] = useTransition();

  const [fromEditProject, setFromEditProject] = useState(false);
  const [activeClientIdForReturn, setActiveClientIdForReturn] = useState(null);

  const [jumpInvoice, setJumpInvoice] = useState(null);

  const [invoicePrefill, setInvoicePrefill] = useState(null);
  const [prevActiveBeforeInvoice, setPrevActiveBeforeInvoice] = useState("dashboard");

  const [sidebarOverride, setSidebarOverride] = useState(() => {
    try {
      const savedActive = localStorage.getItem("activeTab_subadmin");
      if (savedActive === "project-details") {
        return localStorage.getItem("sidebarOverride_subadmin") || null;
      }
    } catch (e) { }
    return null;
  });

  // Keep the saved sidebar-highlight override in sync with its current value,
  // so a refresh while viewing a project via Clients \u2192 Project (or any other
  // "borrowed" entry point) keeps the sidebar pointing at the same section
  // instead of falling back to highlighting "Projects".
  useEffect(() => {
    try {
      if (sidebarOverride) {
        localStorage.setItem("sidebarOverride_subadmin", sidebarOverride);
      } else {
        localStorage.removeItem("sidebarOverride_subadmin");
      }
    } catch (e) { }
  }, [sidebarOverride]);

  const [autoOpenInvoice, setAutoOpenInvoice] = useState(false);

  const [selectedProjectForTasks, setSelectedProjectForTasks] = useState(null);

  const [autoOpenTaskModal, setAutoOpenTaskModal] = useState(false);

  const [subscription, setSubscription] = useState(null);
  const [trialToast, setTrialToast] = useState(false);
  const trialToastShown = React.useRef(false);

  const [showProfile, setShowProfile] = useState(false);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const [accountAuthOpen, setAccountAuthOpen] = useState(false);

  const [accountAuthTab, setAccountAuthTab] = useState("register");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  const [companyLogo, setCompanyLogo] = useState(user?.logoUrl ? user.logoUrl : (fixedLogo || null));

  const [cropImage, setCropImage] = useState(null);

  const [showCropModal, setShowCropModal] = useState(false);

  const [cropCallback, setCropCallback] = useState(null);

  const [cropAspect, setCropAspect] = useState(1);

  const [accounts, setAccounts] = useState([]);



  // ← à®‡à®¤à¯ à®®à®Ÿà¯à®Ÿà¯à®®à¯ à®‡à®°à¯à®•à¯à®•à®£à¯à®®à¯ (KEEP THIS)

  const [appTheme, setAppTheme] = useState("teal");

  const [showThemePicker, setShowThemePicker] = useState(false);

  const [customColor, setCustomColor] = useState(() => localStorage.getItem("appCustomColor") || "var(--app-accent)");

  const [showColorPicker, setShowColorPicker] = useState(false);

  const [returnToModal, setReturnToModal] = useState(null);

  const [limitModal, setLimitModal] = useState(null); // { type, limit }

  const [forceUpgradeTab, setForceUpgradeTab] = useState(false);



  // Helper: hex to HSL

  const hexToHsl = (hex) => {

    let r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;

    let h = 0, s = 0, l = (max + min) / 2;

    if (d !== 0) { s = l > 0.5 ? d / (2 - max - min) : d / (max + min); h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) * 60 : max === g ? ((b - r) / d + 2) * 60 : ((r - g) / d + 4) * 60; }

    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];

  };

  const hslToHex = (h, s, l) => {

    s /= 100; l /= 100;

    const a = s * Math.min(l, 1 - l);

    const f = n => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1))); };

    return `#${[f(0), f(8), f(4)].map(x => x.toString(16).padStart(2, '0')).join('')}`;

  };



  const hexToRgb = (hex) => {
    if (!hex || hex.startsWith("var")) return "0, 188, 212"; // Default teal if invalid

    const r = parseInt(hex.slice(1, 3), 16);

    const g = parseInt(hex.slice(3, 5), 16);

    const b = parseInt(hex.slice(5, 7), 16);

    return `${r}, ${g}, ${b}`;

  };



  // Generate full theme from a single hex color

  const generateThemeFromColor = (hex) => {

    const [h, s, l] = hexToHsl(hex);

    // Ensure accent is rich and dark enough for white text

    const accentL = Math.min(l, 50); // Lowered lightness for better visibility

    const accentS = Math.max(s, 70); // Higher saturation for "punchy" color

    const accentColor = hslToHex(h, accentS, accentL);



    return {

      sidebar: accentColor, // Use the vibrant color directly for sidebar as requested

      accent: accentColor,

      bg: hslToHex(h, 30, 95), // Clearer tinted background

      muted: hslToHex(h, 60, 30), // Much darker muted text (30% vs 35%)

      border: hslToHex(h, 40, 80), // Stronger borders (80% lightness vs 85%)

      dot: accentColor

    };

  };



  const THEMES = {

    purple: { label: "Purple", sidebar: "#7c3aed", accent: "#7c3aed", bg: "#f5f3ff", muted: "#7c3aed", border: "#ddd6fe", dot: "#7c3aed" },

    ocean: { label: "Ocean", sidebar: "#0284c7", accent: "#0284c7", bg: "#f0f9ff", muted: "#0369a1", border: "#93c5fd", dot: "#0284c7" },

    forest: { label: "Forest", sidebar: "#16a34a", accent: "#16a34a", bg: "#f0fdf4", muted: "#15803d", border: "#86efac", dot: "#16a34a" },

    sunset: { label: "Sunset", sidebar: "#ea580c", accent: "#ea580c", bg: "#fff7ed", muted: "#c2410c", border: "#fdba74", dot: "#ea580c" },

    rose: { label: "Rose", sidebar: "#e11d48", accent: "#e11d48", bg: "#fff1f2", muted: "#be123c", border: "#fda4af", dot: "#e11d48" },

    slate: { label: "Slate", sidebar: "#475569", accent: "#475569", bg: "#f8fafc", muted: "#334155", border: "#94a3b8", dot: "#475569" },

    mint: { label: "Mint", sidebar: "#0d9488", accent: "#0d9488", bg: "#f0fdfa", muted: "#0f766e", border: "#5eead4", dot: "#0d9488" },

    candy: { label: "Candy", sidebar: "#c026d3", accent: "#c026d3", bg: "#fdf4ff", muted: "#a21caf", border: "#f5d0fe", dot: "#c026d3" },

    teal: { label: "Teal", sidebar: "#00BCD4", accent: "#00BCD4", bg: "#F5FAFA", muted: "#607D86", border: "#E0EEF0", dot: "#00ACC1" },

  };



  // Apply theme whenever appTheme or customColor changes

  useEffect(() => {



    const t = appTheme === "custom" ? generateThemeFromColor(customColor) : (THEMES[appTheme] || THEMES.teal);

    if (!t) return;

    document.documentElement.style.setProperty("--app-sidebar", t.sidebar);

    document.documentElement.style.setProperty("--app-accent", t.accent);

    document.documentElement.style.setProperty("--app-accent-rgb", hexToRgb(t.accent));

    document.documentElement.style.setProperty("--app-accent-gradient", `linear-gradient(135deg, ${t.accent}, ${t.dot})`);

    document.documentElement.style.setProperty("--app-bg", t.bg);

    document.documentElement.style.setProperty("--app-muted", t.muted);

    document.documentElement.style.setProperty("--app-border", t.border);



    // Override template hardcoded colors to match theme

    document.documentElement.style.setProperty("--teal", t.accent);

    document.documentElement.style.setProperty("--teal2", t.dot);

    document.documentElement.style.setProperty("--teal-light", `rgba(${hexToRgb(t.accent)}, 0.1)`);

    document.documentElement.style.setProperty("--teal-lighter", `rgba(${hexToRgb(t.accent)}, 0.04)`);



    // Broadcast theme to any open iframes (Template Designer)

    const frames = document.querySelectorAll('iframe');

    frames.forEach(f => {

      if (f.contentWindow) {

        try {

          f.contentWindow.postMessage({ type: 'SET_THEME', color: t.accent }, '*');

        } catch (e) { }

      }

    });





    localStorage.setItem("appTheme", appTheme);



    if (appTheme === "custom") localStorage.setItem("appCustomColor", customColor);

  }, [appTheme, customColor]);



  const currentTheme = appTheme === "custom" ? generateThemeFromColor(customColor) : (THEMES[appTheme] || THEMES.teal);


  const headerLogoRef = useRef();



  useEffect(() => { setCompanyLogo(user?.logoUrl ? user.logoUrl : (fixedLogo || null)); }, [user, fixedLogo]);



  const handleHeaderLogoUpload = (e) => {

    triggerCrop(e, (croppedImage) => onLogoChange?.(croppedImage), 1);

  };



  const triggerCrop = (e, callback, aspect = 1) => {

    const file = e.target.files[0];

    if (file) {

      const reader = new FileReader();

      reader.onloadend = () => {

        setCropImage(reader.result);

        setCropCallback(() => callback);

        setCropAspect(aspect);

        setShowCropModal(true);

      };

      reader.readAsDataURL(file);

    }

  };



  const handleCropComplete = async (croppedImage) => {

    setShowCropModal(false);

    if (cropCallback) cropCallback(croppedImage);

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



  // Closedropdown on outside click

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



  const [clients, setClients] = useState(() => { try { const c = localStorage.getItem("cached_clients"); return c ? JSON.parse(c) : []; } catch { return []; } });


  const todayStr = new Date().toISOString().split("T")[0];

  const [nc, setNc] = useState({ name: "", company: "", email: "", phone: "", address: "", project: "", password: "", status: "Active", role: "client", contactPersonName: "", contactPersonNo: "", gstNumber: "", logoUrl: "", category: "", onboardedOn: todayStr, clientType: "b2b", source: "", city: "", state: "", pincode: "", country: "India", website: "", linkedin: "", billingCurrency: "INR — Indian Rupee", paymentTerms: "", creditLimit: "", preferredPaymentMode: "", notes: "", designation: "", altEmail: "" });

  const [ncError, setNcError] = useState({});

  const [saveLoading, setSaveLoading] = useState(false);

  const [showClientPass, setShowClientPass] = useState(false);

  const [viewClientModal, setViewClientModal] = useState(false);

  const [docUploading, setDocUploading] = useState(false);

  const [clientSuccessData, setClientSuccessData] = useState(null);



  const [uploadFileTarget, setUploadFileTarget] = useState(null);

  const [uploadTargetRole, setUploadTargetRole] = useState("client");

  const [uploadTargetUser, setUploadTargetUser] = useState("");

  const [uploadIsSending, setUploadIsSending] = useState(false);



  const [employees, setEmployees] = useState(() => { try { const c = localStorage.getItem("cached_employees"); return c ? JSON.parse(c) : []; } catch { return []; } });

  const [ne, setNe] = useState({ name: "", email: "", phone: "", role: "employee", department: "", salary: "", status: "Pending", password: "" });

  const [showEmpPass, setShowEmpPass] = useState(false);
  const [showEmpConfirmPass, setShowEmpConfirmPass] = useState(false);

  const [neError, setNeError] = useState({});

  const [empSaveLoading, setEmpSaveLoading] = useState(false);



  const [projects, setProjects] = useState(() => { try { const c = localStorage.getItem("cached_projects"); return c ? JSON.parse(c) : []; } catch { return []; } });

  // Once the real projects list has loaded, swap the lightweight
  // placeholder set above (in jumpProject's initializer) for the actual
  // full project object, restoring the exact project view after a refresh.
  useEffect(() => {
    if (jumpProject?._restoring && projects.length > 0) {
      const restored = projects.find(p => p._id === jumpProject._id);
      setJumpProject(restored || null);
    }
  }, [jumpProject, projects]);

  // projectsWithProgress is computed below after tasks state is declared

  const [projLoading, setProjLoading] = useState(false);

  const [np, setNp] = useState({ name: "", client: "", companyName: "", phone: "", address: "", contactPersonName: "", contactPersonNo: "", contactEmail: "", purpose: "", description: "", start: "", end: "", budget: "", currency: "Rs.", team: "", status: "Pending", progress: 0, assignedTo: [] });

  const [npError, setNpError] = useState({});

  const [projSaveLoading, setProjSaveLoading] = useState(false);



  const [managers, setManagers] = useState(() => { try { const c = localStorage.getItem("cached_managers"); return c ? JSON.parse(c) : []; } catch { return []; } });

  const [nm, setNm] = useState({ managerName: "", email: "", phone: "", department: "", role: "Manager", address: "", password: "", status: "Active" });

  const [nmError, setNmError] = useState({});

  const [mgrSaveLoading, setMgrSaveLoading] = useState(false);

  const [showMgrPass, setShowMgrPass] = useState(false);

  const [tasks, setTasks] = useState([]);

  const projectsWithProgress = (projects || []).map(p => {
    const s = (p.status || '').toLowerCase();
    if (s === 'completed' || s === 'done') {
      return { ...p, progress: 100 };
    }
    const projTasks = (tasks || []).filter(t => {
      const tid = t.projectId?._id || t.projectId || t.project;
      return tid === (p._id || p.id);
    });

    const milestonesArr = p.milestones || [];
    if (milestonesArr.length > 0) {
      const doneMilestones = milestonesArr.filter(m => {
        const mTasks = projTasks.filter(t => t.milestone === m.name && !t.isDeleted);
        const allTasksCompleted = mTasks.length > 0 && mTasks.every(t => (t.status || '').toLowerCase() === 'done' || (t.status || '').toLowerCase() === 'completed');
        return m.done === true || allTasksCompleted;
      }).length;
      return { ...p, progress: Math.round((doneMilestones / milestonesArr.length) * 100) };
    }

    if (projTasks.length > 0) {
      const completed = projTasks.filter(t => (t.status || '').toLowerCase() === 'completed' || (t.status || '').toLowerCase() === 'done').length;
      return { ...p, progress: Math.round((completed / projTasks.length) * 100) };
    }
    return { ...p, progress: p.progress || 0 };
  });

  const fetchPackages = async () => {

    try {

      const id = resolveSubadminId();

      const isSub = user?.role === "subadmin";

      const endpoint = isSub ? `${BASE_URL}/api/packages/subadmin/${id}` : `${BASE_URL}/api/packages`;

      const res = await axios.get(endpoint);

      setPackages(res.data || []);

    } catch (e) { console.log(e); }

  };

  const [config, setConfig] = useState(null);

  const [viewProject, setViewProject] = useState(null);



  const [subadmins, setSubadmins] = useState([]);

  const [ns, setNs] = useState({ name: "", email: "", phone: "", password: "", status: "Active", companyName: "", companyType: "IT", employeeCount: "0-10", clientLimit: "3", employeeLimit: "6" });

  const [nsError, setNsError] = useState({});

  const [subSaveLoading, setSubSaveLoading] = useState(false);

  const [showSubPass, setShowSubPass] = useState(false);



  const [packages, setPackages] = useState([]);

  const [npkg, setNpkg] = useState({ title: "", description: "", icon: "📦", monthlyPrice: "", quarterlyPrice: "", halfYearlyPrice: "", annualPrice: "", features: "", planDuration: "Monthly", businessLimit: "", managerLimit: "", clientLimit: "3 Client manage", type: "paid", price: "", noOfDays: "", assignedSubadmins: [] });

  const [editPkgForm, setEditPkgForm] = useState({ title: "", description: "", icon: "📦", type: "paid", price: "", noOfDays: "", planDuration: "Monthly", businessLimit: "", managerLimit: "", clientLimit: "3 Client manage", status: "Active", assignedSubadmins: [] });

  const [pkgError, setPkgError] = useState({});

  const [pkgSaveLoading, setPkgSaveLoading] = useState(false);



  // Package view/edit state

  const [viewPackage, setViewPackage] = useState(null);

  const [editPackage, setEditPackage] = useState(null);





  const [quotations, setQuotations] = useState([]);

  const [vendors, setVendors] = useState([]);

  const [paymentHistory, setPaymentHistory] = useState([]);

  const [subLoading, setSubLoading] = useState(true);

  const [alertDismissedToday, setAlertDismissedToday] = useState(() => {
    try {
      const stored = localStorage.getItem("subAlertDismissedDate");
      return stored === new Date().toDateString();
    } catch { return false; }
  });



  const [nv, setNv] = useState({ vendorName: "", vendorProduct: "", amountTaxGst: "", date: "", paidAmount: "", productDescription: "", dateOfPurchase: "", modeOfPayment: "Cash" });

  const [nvError, setNvError] = useState({});

  const [vendorSaveLoading, setVendorSaveLoading] = useState(false);



  const [invoices, setInvoices] = useState([]);

  const [income, setIncome] = useState([]);

  const [expenses, setExpenses] = useState([]);

  const totalRevenue = income.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [employeeDocs, setEmployeeDocs] = useState([]);



  const fetchPendingLeaves = async () => {

    try {

      const companyId = resolveSubadminId();

      const res = await axios.get(`${BASE_URL}/api/employee-dashboard/leave/all/pending`, {

        headers: { "x-company-id": companyId }

      });

      setPendingLeaves(res.data || []);

    } catch (e) { console.log(e); }

  };



  const fetchEmployeeDocs = async () => {

    try {

      const companyId = resolveSubadminId();

      const res = await axios.get(`${BASE_URL}/api/employee-dashboard/documents/company/all`, {

        headers: { "x-company-id": companyId }

      });

      setEmployeeDocs(res.data || []);

    } catch (e) { console.log(e); }

  };



  const handleApproveLeave = async (leaveId) => {

    try {

      const name = user?.name || "Admin";

      await axios.patch(`${BASE_URL}/api/employee-dashboard/leave/${leaveId}/approve`, {

        reviewedBy: name,

        managerNote: "Approved by Sub-Admin"

      });

      toast.success("Leave request approved successfully!");

      fetchPendingLeaves();

    } catch (e) {

      toast.error("Failed to approve leave request");

      console.log(e);

    }

  };



  const handleRejectLeave = async (leaveId) => {

    try {

      const name = user?.name || "Admin";

      await axios.patch(`${BASE_URL}/api/employee-dashboard/leave/${leaveId}/reject`, {

        reviewedBy: name,

        managerNote: "Rejected by Sub-Admin"

      });

      toast.success("Leave request rejected successfully!");

      fetchPendingLeaves();

    } catch (e) {

      toast.error("Failed to reject leave request");

      console.log(e);

    }

  };



  const handleApproveDoc = async (docId) => {

    try {

      await axios.patch(`${BASE_URL}/api/employee-dashboard/documents/${docId}/approve`);

      toast.success("Document approved successfully!");

      fetchEmployeeDocs();

    } catch (e) {

      toast.error("Failed to approve document");

      console.log(e);

    }

  };



  const handleRejectDoc = async (docId) => {

    try {

      await axios.patch(`${BASE_URL}/api/employee-dashboard/documents/${docId}/reject`);

      toast.success("Document rejected successfully!");

      fetchEmployeeDocs();

    } catch (e) {

      toast.error("Failed to reject document");

      console.log(e);

    }

  };



  const fetchProfile = async () => {

    try {

      const id = resolveSubadminId();

      if (!id) return;

      const res = await axios.get(`${BASE_URL}/api/auth/profile/${id}`);

      if (res.data.user) {

        const updated = { ...user, ...res.data.user };

        localStorage.setItem("user", JSON.stringify(updated));

        setUser(updated);

      }

    } catch (e) { console.log("Profile sync failed", e); }

  };



  const hasFetched = useRef(false);

  const mainScrollRef = useRef(null);

  useEffect(() => {

    if (hasFetched.current) return;

    hasFetched.current = true;

    // Await the clients fetch FIRST so it actually completes and renders
    // before the rest of the app's fetches are fired — a real sequential
    // priority instead of just an earlier call in the same tick.
    (async () => {
      await fetchClients();
      await fetchProjects();

      fetchProfile();

      fetchEmployees(); fetchManagers(); fetchSubadmins(); fetchPackages(); fetchSubscription(); fetchQuotations(); fetchPaymentHistory(); fetchVendors(); fetchInvoices(); fetchIncome(); fetchExpenses(); fetchTasks(); fetchConfig();

      fetchPendingLeaves(); fetchEmployeeDocs();
    })();
  }, []);
  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showNotifPanel && !e.target.closest('.topbar-icon')) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifPanel]);


  // ── Listen for SEND_DOCUMENT from template designer iframe ──

  useEffect(() => {

    const handleMessage = async (e) => {

      if (e.data && e.data.type === "SEND_DOCUMENT") {
        const payload = e.data.payload;
        if (!payload) return;

        const companyId = resolveSubadminId();
        const sendTo = payload.sendTo || "client";

        let resolvedClientId = payload.clientId || "";
        if (!resolvedClientId && sendTo === "client") {
          const match = clients.find(c => (c.clientName || c.name) === payload.client);
          resolvedClientId = match?._id || match?.id || "";
        }
        let resolvedEmployeeId = payload.employeeId || "";
        if (!resolvedEmployeeId && sendTo === "employee") {
          const match = employees.find(emp => (emp.name || emp.employeeName) === payload.client);
          resolvedEmployeeId = match?._id || match?.id || "";
        }

        try {
          await axios.post(`${BASE_URL}/api/documents`, {
            docType: payload.docType || "lh",
            sendTo,
            client: payload.client || (sendTo === "employee" ? "Employee" : "Client"),
            clientId: sendTo === "client" ? resolvedClientId : "",
            employeeId: sendTo === "employee" ? resolvedEmployeeId : "",
            recipientEmail: payload.recipientEmail || "",
            htmlContent: payload.htmlContent || "",
            senderCompany: companyNameStr,
            companyId
          });

          if (sendTo === "employee" && resolvedEmployeeId) {
            try {
              await axios.post(`${BASE_URL}/api/notifications`, {
                userId: resolvedEmployeeId,
                type: "document",
                icon: "ti-files",
                text: `A new document has been shared with you`,
              });
            } catch (notifErr) {
              console.error("Failed to notify employee:", notifErr);
            }
          }

          toast.success(`Document sent to ${payload.client || "Client"} successfully!`);
        } catch (err) {
          console.error("Failed to send document:", err);
          toast.error("Failed to send document. Check connection.");
        }
      }

      if (e.data && e.data.type === "SAVE_QUOTATION") {

        const { qt, items } = e.data.payload;

        if (!qt || !qt.quoteNo) return;



        // 1. Save to backend API

        try {

          await axios.post(`${BASE_URL}/api/quotations`, { qt, items, status: "draft" });

        } catch (err) {

          console.error("API Save Error", err);

        }



        // 2. Save to local drafts to update the UI

        try {

          const LOCAL_KEY = "quotation_drafts";

          const all = localStorage.getItem(LOCAL_KEY) ? JSON.parse(localStorage.getItem(LOCAL_KEY)) : [];

          const id = qt.quoteNo;

          const idx = all.findIndex((d) => d.id === id || (d.qt && d.qt.quoteNo === id));

          const subtotal = items.reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseFloat(i.quantity) || 0), 0);

          const total = subtotal * (1 + (qt.gstRate || 0) / 100);

          const entry = { id, quoteNo: qt.quoteNo, client: qt.client || "—", total, savedAt: Date.now(), qt, items, status: "draft" };



          if (idx >= 0) all[idx] = entry;

          else all.unshift(entry);



          localStorage.setItem(LOCAL_KEY, JSON.stringify(all.slice(0, 30)));

          toast.success("Quotation saved successfully!");

          fetchQuotations(); // Refresh list to update the Template Designer dropdown

        } catch (err) {

          toast.error("Failed to save quotation locally.");

        }

      }

    };

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);

  }, [companyNameStr, user]);



  // Redirect to mysubscriptions only when the trial has actually expired
  // (i.e. no subscription AND no free trial days left). While the user is
  // still within their free trial, subscription is legitimately null and
  // they should stay on the Dashboard — not be bounced to "Choose your Plan".
  const hasRedirected = useRef(false);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);

  useEffect(() => {
    if (!subscriptionChecked || trialToastShown.current) return;
    const flagKey = user?.email ? `justRegistered:${user.email}` : null;
    const isFirstTimeAfterSignup = flagKey && localStorage.getItem(flagKey) === "1";
    const trialIsActive = isInFreeTrial() || subscription?.isTrial || subscription?.status === "trial";
    if (isFirstTimeAfterSignup && trialIsActive) {
      trialToastShown.current = true;
      localStorage.removeItem(flagKey);
      setTrialToast(true);
      const hideTimer = setTimeout(() => setTrialToast(false), 4000);
      return () => clearTimeout(hideTimer);
    }
  }, [subscriptionChecked, subscription]);

  useEffect(() => {
    if (
      subscriptionChecked &&
      subscription === null &&
      !isInFreeTrial() &&
      !hasRedirected.current
    ) {
      hasRedirected.current = true;
      setForceUpgradeTab(false);
      setActive("mysubscriptions");
    }
  }, [subscription, subscriptionChecked]);

  // Process PayU payment silently on dashboard load — no need to show subscriptions page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") !== "success") return;
    const subId = params.get("subId");
    const txnid = params.get("txnid");
    window.history.replaceState({}, document.title, window.location.pathname);
    const activateAndRefresh = async () => {
      try {
        if (subId) {
          await axios.post(`${BASE_URL}/api/subscriptions/activate-pending`, {
            subscriptionId: subId, txnid
          });
        }
      } catch (e) { console.log("PayU activation:", e.message); }
      await fetchSubscription();
    };
    activateAndRefresh();
  }, []);


  const fetchTasks = async () => {

    try {

      const res = await axios.get(BASE_URL + "/api/tasks");

      setTasks(res.data || []);

    } catch (e) { console.log(e); }

  };



  const fetchConfig = async () => {

    try {

      const cid = resolveSubadminId();

      if (!cid) return;

      const res = await axios.get(`${BASE_URL}/api/config/${cid}`);

      setConfig(res.data);

    } catch (e) { console.log(e); }

  };



  const fetchSubscription = async () => {

    try {

      if (!subscription) setSubLoading(true);

      const id = resolveSubadminId();

      if (!id) return null;



      const res = await axios.get(`${BASE_URL}/api/subscriptions/current/${id}`);

      if (res.data.hasSubscription) {

        setSubscription(res.data.subscription);
        setSubLoading(false);
        setSubscriptionChecked(true);

        return res.data.subscription; // return fresh data for immediate use

      } else {

        setSubscription(null);
        setSubLoading(false);
        setSubscriptionChecked(true);

        return null;

      }

    } catch (err) {

      console.error("Subscription fetch error:", err);

      setSubscription(null);
      setSubLoading(false);
      setSubscriptionChecked(true);

      return null;

    } finally {
      // Fetch updated user limits in the background — don't block callers on this,
      // and delay it slightly so it never competes with the initial dashboard
      // render/data calls right after login.
      setTimeout(() => {
        (async () => {
          try {
            const id = resolveSubadminId();
            if (id) {
              const userRes = await axios.get(`${BASE_URL}/api/users/${id}`);
              if (userRes.data) {
                localStorage.setItem("user", JSON.stringify(userRes.data));
              }
            }
          } catch (e) {
            console.error("Failed to update local user limits:", e);
          }
        })();
      }, 1500);
    }
  };

  const fetchInvoices = async () => {

    try {

      const res = await axios.get(BASE_URL + "/api/invoices");

      setInvoices(res.data.invoices || []);

    } catch (e) {

      console.log("Fetch invoices error:", e);

      setInvoices([]);

    }

  };



  const fetchPaymentHistory = async () => {

    try {

      const id = resolveSubadminId();

      if (!id) return;

      const res = await axios.get(`${BASE_URL}/api/subscriptions/payments/${id}`);

      setPaymentHistory(res.data || []);

    } catch (err) {

      console.error("Payment history fetch failed", err);

    }

  };



  const fetchIncome = async () => {

    try {

      const res = await axios.get(BASE_URL + "/api/income");

      setIncome(res.data || []);

    } catch (e) {

      console.log("Fetch income error:", e);

      setIncome([]);

    }

  };



  const fetchExpenses = async () => {

    try {

      const res = await axios.get(BASE_URL + "/api/expenses");

      setExpenses(res.data || []);

    } catch (e) {

      console.log("Fetch expenses error:", e);

      setExpenses([]);

    }

  };



  // ── FREE TRIAL ──────────────────────────────────────────────────────────────
  const FREE_TRIAL_DAYS = 30;
  const FREE_TRIAL_LIMITS = { client: 5, employee: 10, manager: 2 };

  const getTrialDaysRemaining = () => {
    const created = user?.createdAt;
    if (!created) return 0;
    const diffMs = new Date(created).getTime() + FREE_TRIAL_DAYS * 86400000 - Date.now();
    return Math.max(0, Math.ceil(diffMs / 86400000));
  };

  const isInFreeTrial = () => !subscription && getTrialDaysRemaining() > 0;
  // ────────────────────────────────────────────────────────────────────────────

  const getSubStatus = () => {

    // While subscription data is still loading, never block

    if (!subscription) {
      // Free trial — never block
      if (isInFreeTrial()) return { blocked: false, alert: false, status: "trial", trialDays: getTrialDaysRemaining() };
      // No subscription and trial expired
      return { blocked: true, alert: false, status: "no_subscription" };
    }



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

  const resolveSubadminId = () => {

    // Aggressively find the subadmin ID from any possible property

    const id = user?._id || user?.id || user?.userId || user?.companyId || user?.company || "";

    return String(id).trim();

  };

  // Persist any custom "Category / Industry" values the user types into the
  // Add Client form, scoped per company, so they survive a page refresh and
  // show up in the dropdown for future clients too.
  const CATEGORY_STORAGE_KEY = `customCategories_${resolveSubadminId() || "default"}`;
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CATEGORY_STORAGE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  });
  const CURRENCY_STORAGE_KEY = `customCurrencies_${resolveSubadminId() || "default"}`;
  const [customCurrencies, setCustomCurrencies] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CURRENCY_STORAGE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  });
  const saveCustomCurrency = (value) => {
    const v = (value || "").trim();
    if (!v) return;
    setCustomCurrencies(prev => {
      if (prev.some(c => c.toLowerCase() === v.toLowerCase())) return prev;
      const next = [...prev, v];
      try { localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(next)); } catch (e) { }
      return next;
    });
  };
  const saveCustomCategory = (value) => {
    const v = (value || "").trim();
    if (!v) return;
    setCustomCategories(prev => {
      if (prev.some(c => c.toLowerCase() === v.toLowerCase())) return prev;
      const next = [...prev, v];
      try { localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(next)); } catch (e) { }
      return next;
    });
  };



  // Dashboard.jsx-à®²à¯ à®‡à®°à¯à®•à¯à®•à¯à®®à¯ parseLimit function-à® à®‡à®¤à®¾à®• à®®à®¾à®¤à¯à®¤à¯à®™à¯à®•:



  const parseLimit = (limitStr) => {

    if (limitStr === undefined || limitStr === null || limitStr === "") return 10;

    const s = String(limitStr).toLowerCase().trim();

    if (s.includes("unlimited") || s.includes("infinity")) return Infinity;

    const m = s.match(/\d+/);

    if (m) return parseInt(m[0]);

    return 10;

  };

  const getSubscriptionLimit = (type, sub = subscription) => {

    // 1. Try to get limit from the active subscription directly

    let val = null;

    if (sub) {

      val = type === "client" ? sub.clientLimit : type === "employee" ? sub.employeeLimit : sub.managerLimit;



      // If direct field is empty, search in features array

      if ((!val || val === "") && sub.features && Array.isArray(sub.features)) {

        const label = type === "client" ? "client" : type === "employee" ? "employee" : "manager";

        const feat = sub.features.find(f => f.toLowerCase().includes(label));

        if (feat) {

          const match = feat.match(/\d+/);

          if (match) val = match[0];

          if (feat.toLowerCase().includes("unlimited")) val = "Infinity";

        }

      }

    }



    // 2. If subscription has a limit, parse and return it

    if (val && String(val).trim() !== "" && String(val) !== "0") {

      return parseLimit(val);

    }



    // 3. Fallback: Direct limit set by Admin on the user profile

    const uLimit = type === "client" ? user?.clientLimit : type === "employee" ? user?.employeeLimit : user?.managerLimit;

    if (uLimit && String(uLimit).trim() !== "" && String(uLimit) !== "0") {

      return parseLimit(uLimit);

    }



    // 4. Free trial limits
    if (isInFreeTrial()) {
      return FREE_TRIAL_LIMITS[type] ?? 5;
    }

    // 5. Default fallback
    return 10;

  };



  const isUsageAtLimit = (type, currentCount, sub = subscription) => {

    const limit = getSubscriptionLimit(type, sub);

    if (limit === Infinity) return false;

    return currentCount >= limit;

  };





  const handleLogout = () => { localStorage.removeItem("user"); localStorage.setItem("loggedOut", "1"); setUser(null); setAccounts([]); };

  const handleAuthSetUser = (userData) => {

    setAccountAuthOpen(false);

    setProfileDropdownOpen(false);

    setShowProfile(false);

    setUser(userData);

  };

  const onLogoChange = (logo) => {
    setCompanyLogo(logo || fixedLogo);
    const updatedUser = { ...user, logoUrl: logo || "" };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    axios.post(BASE_URL + "/api/auth/save-logo", { userId: user._id || user.id, logoUrl: logo || "" }).catch(e => console.log(e));
  };

  const fetchClients = async () => {
    try {
      const cached = localStorage.getItem("cached_clients");
      if (cached) { try { setClients(JSON.parse(cached)); } catch { } }
    } catch { }
    try {
      const res = await axios.get(BASE_URL + "/api/clients?companyId=" + encodeURIComponent(user?.companyId || ""));
      setClients(res.data);
      try { localStorage.setItem("cached_clients", JSON.stringify(res.data)); } catch { }
    } catch (e) { console.log(e); }
  };

  const fetchEmployees = async () => { try { const res = await axios.get(BASE_URL + "/api/employees"); setEmployees(res.data); } catch (e) { console.log(e); } };

  const fetchProjects = async () => {
    try {
      const cached = localStorage.getItem("cached_projects");
      if (cached) { try { setProjects(JSON.parse(cached)); } catch { } }
    } catch { }
    try {
      const res = await axios.get(BASE_URL + "/api/projects");
      setProjects(res.data);
      try { localStorage.setItem("cached_projects", JSON.stringify(res.data)); } catch { }
    } catch (e) { console.log(e); }
  };

  const fetchManagers = async () => { try { const res = await axios.get(BASE_URL + "/api/managers"); setManagers(res.data); } catch (e) { console.log(e); } };

  const fetchSubadmins = async () => { try { const res = await axios.get(BASE_URL + "/api/subadmins"); setSubadmins(res.data); } catch (e) { console.log(e); } };





  // Re-fetch packages when navigating to Packages tab to show admin-added packages

  // Also refresh subscription when visiting resource tabs to ensure latest limits

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

      businessLimit: pkg.businessLimit || "",

      managerLimit: pkg.managerLimit || "",

      clientLimit: pkg.clientLimit || "3 Client manage",

      status: pkg.status || "Active",

      assignedSubadmins: pkg.assignedSubadmins || []

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

        employeeLimit: editPkgForm.employeeLimit,

        status: editPkgForm.status,

        assignedSubadmins: editPkgForm.assignedSubadmins,

        monthlyPrice: editPkgForm.type === "free" ? "Free" : editPkgForm.price,

        quarterlyPrice: editPkgForm.type === "free" ? "Free" : Math.round((parseFloat(editPkgForm.price) || 0) * 3 * 0.9).toString(),

        halfYearlyPrice: editPkgForm.type === "free" ? "Free" : Math.round((parseFloat(editPkgForm.price) || 0) * 6 * 0.85).toString(),

        annualPrice: editPkgForm.type === "free" ? "Free" : Math.round((parseFloat(editPkgForm.price) || 0) * 12 * 0.8).toString(),

        features: `${editPkgForm.planDuration} Plan\n${editPkgForm.businessLimit}\n${editPkgForm.managerLimit}\n${editPkgForm.clientLimit}\n${editPkgForm.employeeLimit}`

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



  const fetchQuotations = async () => {

    try {

      const res = await axios.get(BASE_URL + "/api/quotations");

      let apiDocs = res.data?.quotations || res.data || [];

      if (!Array.isArray(apiDocs)) apiDocs = [];

      let localDocs = [];

      try { const d = localStorage.getItem("quotation_drafts"); localDocs = d ? JSON.parse(d) : []; } catch (e) { }

      // Combine avoiding duplicates by quoteNo

      const combined = [...apiDocs];

      localDocs.forEach(ld => {

        if (!combined.some(c => (c.quoteNo || c.qt?.quoteNo) === (ld.quoteNo || ld.qt?.quoteNo))) combined.push(ld);

      });

      setQuotations(combined);

    } catch (e) {

      console.log(e);

      try { const d = localStorage.getItem("quotation_drafts"); setQuotations(d ? JSON.parse(d) : []); } catch (e) { }

    }

  };

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



  const addClient = async () => {

    const errors = {};

    if (!nc.name.trim()) errors.name = "Name is required";

    if (!nc.email.trim()) errors.email = "Email is required";



    // Subscription Limit Check - Fetch latest before check to catch admin updates

    try {

      const id = resolveSubadminId();

      if (id) {

        const subRes = await axios.get(`${BASE_URL}/api/subscriptions/current/${id}`);

        if (subRes.data.hasSubscription) {

          const latestSub = subRes.data.subscription;

          setSubscription(latestSub);



          if (isUsageAtLimit("client", clients.length)) {

            setLimitModal({ type: "client", limit: getSubscriptionLimit("client") });

            return;

          }

        } else {

          // No subscription — allow if still in free trial
          if (!isInFreeTrial()) {
            setForceUpgradeTab(true);
            setActive("mysubscriptions");
            return;
          }

        }

      }

    } catch (err) {

      console.error("Failed to fetch latest subscription for limit check", err);

      if (isUsageAtLimit("client", clients.length)) {

        setLimitModal({ type: "client", limit: getSubscriptionLimit("client") });

        return;

      }

    }



    if (Object.keys(errors).length > 0) { setNcError(errors); return; }

    try {

      setSaveLoading(true);

      const payload = {

        clientName: nc.name,

        companyName: nc.company,

        email: nc.email,

        phone: nc.phone,

        address: nc.address,

        password: nc.password,

        status: nc.status,

        role: nc.role || "client",

        contactPersonName: nc.contactPersonName,

        contactPersonNo: nc.contactPersonNo,

        gstNumber: nc.gstNumber,

        logoUrl: nc.logoUrl,

        clientType: nc.clientType,

        category: nc.category || "",

        source: nc.source,

        onboardedOn: nc.onboardedOn,

        city: nc.city,

        state: nc.state,

        pincode: nc.pincode,

        country: nc.country,

        website: nc.website,

        linkedin: nc.linkedin,

        billingCurrency: nc.billingCurrency,

        paymentTerms: nc.paymentTerms,

        creditLimit: nc.creditLimit,

        preferredPaymentMode: nc.preferredPaymentMode,

        notes: nc.notes,

        designation: nc.designation,

        altEmail: nc.altEmail,

        companyId: resolveSubadminId()

      };

      const res = await axios.post(BASE_URL + "/api/clients/add", payload);

      setClients(prev => [res.data.client, ...prev]);

      // Store credentials for the success screen

      setClientSuccessData({ email: nc.email, password: nc.password, name: nc.name });

      const todayStr = new Date().toISOString().split("T")[0];

      setNc({ name: "", company: "", email: "", phone: "", address: "", project: "", password: "", status: "Active", role: "client", logoUrl: "", gstNumber: "", contactPersonName: "", contactPersonNo: "", category: "", clientType: "b2b", source: "", onboardedOn: todayStr, city: "", state: "", pincode: "", country: "India", website: "", linkedin: "", billingCurrency: "INR — Indian Rupee", paymentTerms: "", creditLimit: "", preferredPaymentMode: "", notes: "", designation: "", altEmail: "" });

      setNcError({});

      if (returnToModal) { setModal(returnToModal); setReturnToModal(null); }

      // Don't Closemodal yet if no return - show success screen (this depends on existing logic)

    } catch (err) {

      if (err.response?.status === 403 && err.response?.data?.limitReached) {

        setLimitModal({ type: "client", limit: err.response.data.limit });

      } else {

        setNcError({ email: err.response?.data?.message || err.response?.data?.msg || "Failed to save" });

      }

    } finally {

      setSaveLoading(false);

    }

  };



  const addEmployee = async () => {

    const errors = {};

    if (!ne.name.trim()) errors.name = "Name is required";

    if (!ne.email.trim()) errors.email = "Email required";

    if (!ne.password.trim()) errors.password = "Password is required";

    if (ne.password && ne.password.length < 4) errors.password = "Min 4 characters";

    if (ne.password !== ne.confirmPassword) errors.confirmPassword = "Passwords do not match";

    if (ne.password && ne.password.length < 4) errors.password = "Min 4 characters";

    if (ne.password !== ne.confirmPassword) errors.confirmPassword = "Passwords do not match";



    // Subscription Limit Check - Fetch latest before check to catch admin updates

    try {

      const id = resolveSubadminId();

      if (id) {

        const subRes = await axios.get(`${BASE_URL}/api/subscriptions/current/${id}`);

        if (subRes.data.hasSubscription) {

          const latestSub = subRes.data.subscription;

          setSubscription(latestSub);



          if (isUsageAtLimit("employee", employees.length)) {

            setLimitModal({ type: "employee", limit: getSubscriptionLimit("employee") });

            return;

          }

        } else {

          // No subscription — allow if still in free trial
          if (!isInFreeTrial()) {
            setForceUpgradeTab(true);
            setActive("mysubscriptions");
            return;
          }

        }

      }

    } catch (err) {

      console.error("Failed to fetch latest subscription for employee limit check", err);

      if (isUsageAtLimit("employee", employees.length)) {

        setLimitModal({ type: "employee", limit: getSubscriptionLimit("employee") });

        return;

      }

    }



    if (Object.keys(errors).length > 0) { setNeError(errors); return; }

    try {

      setEmpSaveLoading(true);

      const { confirmPassword, ...neWithoutConfirm } = ne;

      const payload = {

        ...neWithoutConfirm,

        role: ne.role || "employee",

        companyId: resolveSubadminId(),

        bankDetails: {

          bankName: ne.bankName,

          ifscCode: ne.ifscCode,

          accountNumber: ne.accountNumber,

          branchName: ne.branchName

        }

      };

      const res = await axios.post(BASE_URL + "/api/employees/add", payload);

      setEmployees(prev => [res.data.employee, ...prev]);

      setNe({ name: "", email: "", phone: "", role: "employee", department: "", salary: "", status: "Pending", password: "", confirmPassword: "", dateOfBirth: "", maritalStatus: "", address: "", bankName: "", ifscCode: "", accountNumber: "" });

      setShowEmpPass(false);

      setNeError({});

      if (returnToModal) { setModal(returnToModal); setReturnToModal(null); } else { setModal(null); }

    } catch (err) {

      if (err.response?.status === 403 && err.response?.data?.limitReached) {

        setLimitModal({ type: "employee", limit: err.response.data.limit });

      } else {

        const errMsg = err.response?.data?.message || err.response?.data?.msg || "Failed to save";

        const isPasswordError = errMsg.toLowerCase().includes("password");

        setNeError(isPasswordError ? { password: errMsg } : { email: errMsg });

      }

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



    const notifyAssigned = async (projectId, projectName, assignees) => {

      try {

        for (const name of assignees) {

          const emp = employees.find(e => (e.name || e.employeeName || "").toLowerCase() === name.toLowerCase());

          if (emp && (emp._id || emp.id)) {

            await axios.post(`${BASE_URL}/api/notifications`, {

              userId: emp._id || emp.id,

              type: 'project',

              icon: '—ˆ',

              text: `You have been assigned to a new project: "${projectName}"`,

              link: 'projects'

            });

          }

        }

      } catch (err) { console.error("Notification failed", err); }

    };



    try {

      setProjSaveLoading(true);

      const res = await axios.post(BASE_URL + "/api/projects/add", np);

      await fetchProjects();



      // Notify assigned employees

      if (np.assignedTo && np.assignedTo.length > 0) {

        notifyAssigned(res.data._id, np.name, np.assignedTo);

      }



      setNp({ name: "", client: "", contactPersonName: "", contactPersonNo: "", purpose: "", description: "", start: "", end: "", budget: "", currency: "Rs.", team: "", status: "Active", progress: 0, assignedTo: [] });

      setNpError({});

      setModal(null);

      toast.success("Yes Project created successfully!");

    } catch (err) {

      setNpError({ name: err.response?.data?.msg || "Failed to save project" });

    } finally {

      setProjSaveLoading(false);

    }

  };



  const addManager = async () => {

    const errors = {};

    if (!nm.managerName.trim()) errors.managerName = "Name is required";

    if (!nm.email.trim()) errors.email = "Email is required";

    if (!nm.password.trim()) errors.password = "Password is required";



    // Subscription Limit Check - Fetch latest before check to catch admin updates

    try {

      const id = resolveSubadminId();

      if (id) {

        const subRes = await axios.get(`${BASE_URL}/api/subscriptions/current/${id}`);

        if (subRes.data.hasSubscription) {

          const latestSub = subRes.data.subscription;

          setSubscription(latestSub);



          if (isUsageAtLimit("manager", managers.length)) {

            setLimitModal({ type: "manager", limit: getSubscriptionLimit("manager") });

            return;

          }

        } else {

          // No subscription — allow if still in free trial
          if (!isInFreeTrial()) {
            setForceUpgradeTab(true);
            setActive("mysubscriptions");
            return;
          }

        }

      }

    } catch (err) {

      console.error("Failed to fetch latest subscription for manager limit check", err);

      if (isUsageAtLimit("manager", managers.length)) {

        setLimitModal({ type: "manager", limit: getSubscriptionLimit("manager") });

        return;

      }

    }



    if (Object.keys(errors).length > 0) { setNmError(errors); return; }

    try {

      setMgrSaveLoading(true);

      const managerPayload = { ...nm, companyId: resolveSubadminId() };

      const res = await axios.post(BASE_URL + "/api/managers/add", managerPayload);

      setManagers(prev => [res.data.manager, ...prev]);

      setNm({ managerName: "", email: "", phone: "", department: "", role: "Manager", address: "", password: "", status: "Active" });

      setNmError({});

      setModal(null);

    } catch (err) {

      if (err.response?.status === 403 && err.response?.data?.limitReached) {

        setLimitModal({ type: "manager", limit: err.response.data.limit });

      } else {

        setNmError({ email: err.response?.data?.message || err.response?.data?.msg || "Failed to save" });

      }

    } finally {

      setMgrSaveLoading(false);

    }

  };



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

      setNs({ name: "", email: "", phone: "", password: "", status: "Active", companyName: "", companyType: "IT", employeeCount: "0-10", clientLimit: "3", employeeLimit: "6" });

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



        features: npkg.features ? npkg.features.split(',').map(f => f.trim()).filter(f => f) : [],

        planDuration: npkg.planDuration || "Monthly",

        businessLimit: npkg.businessLimit || "",

        managerLimit: npkg.managerLimit || "",

        clientLimit: npkg.clientLimit || "3 Client manage",

        employeeLimit: npkg.employeeLimit || "",

        status: "Active",

        targetRole: "subadmin",

        assignedSubadmins: npkg.assignedSubadmins || []

      };



      const res = await axios.post(BASE_URL + "/api/packages", packageData);

      setPackages(prev => [...prev, res.data]);

      setNpkg({ title: "", description: "", icon: "📦", monthlyPrice: "", quarterlyPrice: "", halfYearlyPrice: "", annualPrice: "", features: "", planDuration: "Monthly", businessLimit: "", managerLimit: "", clientLimit: "3 Client manage", employeeLimit: "", type: "paid", price: "", noOfDays: "", assignedSubadmins: [] });

      setPkgError({});

      setModal(null);

      toast.success("Yes Package added!");

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

      toast.success("Yes Vendor Added Successfully!");

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

  // Block sidebar until user selects a plan (free trial OR paid)
  // New users: no subscription AND not in free trial = must pick a plan first
  // hasSelectedPlan = they have either activated free trial OR have a paid subscription
  const hasSelectedPlan = subscription !== null || isInFreeTrial();
  // Never force the upgrade/packages screen while subscription data is still
  // loading — that's exactly what caused the "Choose your Plan" page to flash
  // briefly right after login, before fetchSubscription() had resolved.
  let enforceMySubscriptions = !subLoading && !hasSelectedPlan;

  const rawNavItems = getNavForRole(user?.role);

  // When restricted, ONLY show My Subscriptions (no dashboard — must subscribe first)

  const navItems = enforceMySubscriptions

    ? rawNavItems.filter(n => ["mysubscriptions"].includes(n.key))

    : rawNavItems;



  // Helper to find item in flat or nested structure

  const findNavItem = (key) => {

    for (const item of navItems) {

      if (item.key === key) return item;

      if (item.type === "group" && item.items) {

        const sub = item.items.find(i => i.key === key);

        if (sub) return sub;

      }

    }

    return null;

  };



  // Always land on mysubscriptions when enforced — never show dashboard

  const validActive = enforceMySubscriptions

    ? "mysubscriptions"

    : ((findNavItem(active) || active === "addClient" || active === "tasks" || active === "create-project" || active === "edit-project" || active === "project-details" || active === "projects" || active === "invoices") ? active : navItems[0]?.key || "dashboard");



  const page = findNavItem(validActive) || navItems[0];



  // Note: removed setActive(validActive) here to prevent re-render loop



  useEffect(() => {

    if (validActive === "templates") {

      const frame = document.getElementById('template-designer-frame');

      if (frame && frame.contentWindow) {

        // Send data if the frame is already loaded, otherwise onLoad will catch it later

        frame.contentWindow.postMessage({

          type: 'SET_DATA',

          clients: clients.map(c => c.clientName || c.name),

          employees: employees.map(emp => ({ name: emp.name, id: emp._id || emp.id })),

          quotations: quotations,

          company: {

            name: user?.companyName || "",

            logoUrl: user?.logoUrl || "",

            email: user?.email || "",

            phone: user?.phone || "",

          }

        }, '*');

      }

    }

  }, [quotations, clients, employees, user, validActive]);



  const displayName = companyNameStr;

  const initials = (displayName || "WS").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const B = (color) => {

    const isVar = color && color.startsWith("var");

    return {

      background: isVar ? `var(--app-accent-gradient, linear-gradient(135deg, ${color}, ${color}))` : `linear-gradient(135deg, ${color}, ${color}ee)`,

      color: "#fff",

      border: "none",

      borderRadius: 12,

      padding: "9px 18px",

      fontWeight: 800,

      fontSize: 13,

      cursor: "pointer",

      fontFamily: "inherit",

      boxShadow: isVar ? `0 4px 12px rgba(var(--app-accent-rgb, 124, 58, 237), 0.25)` : `0 4px 12px ${color}40`,

      textShadow: "0 1px 2px rgba(0,0,0,0.2)"

    };

  };



  const companyId = user?.companyId || user?.company || user?._id || user?.id || "default";



  const roleDisplay = user?.role || "Admin";



  return (

    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "linear-gradient(135deg,var(--app-bg) 0%,var(--app-bg) 50%,var(--app-border) 100%)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>

      <style>{`

        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        *{box-sizing:border-box}

        ::-webkit-scrollbar{width:5px}

        ::-webkit-scrollbar-thumb{background:rgba(var(--app-accent-rgb, 124, 58, 237), 0.3);border-radius:3px}

        button,input,select,textarea{font-family:inherit}

@media(min-width:769px){.sidebar{position:sticky!important;top:0!important;}.sidebar-close{display:none!important;}.mob-overlay{display:none!important;}.mob-topbar{display:none!important;}.sidebar-spacer{display:none!important;}.desktop-topbar{display:flex!important;}}
@media(max-width:768px){.desktop-topbar{display:none!important;}}

        @media(max-width:768px){.sidebar-spacer{display:none!important;}.mob-topbar-hide{display:none!important;}.main-content{padding:12px!important;}.dash-stats{grid-template-columns:repeat(2,1fr)!important;gap:10px!important;}.dash-2col{grid-template-columns:1fr!important;}.modal-2col{grid-template-columns:1fr!important;}.page-header{flex-wrap:wrap;gap:8px;}.header-actions{flex-wrap:wrap;gap:8px;}}

        @media print {

          .no-print { display: none !important; }

          .sidebar, .mob-topbar, .page-header, .header-actions { display: none !important; }

          .main-content { padding: 0 !important; margin: 0 !important; overflow: visible !important; }

          body { background: white !important; }

        }

      `}</style>



      {!enforceMySubscriptions && (

        <div className="no-print" style={{ display: "contents" }}>
          <Sidebar
            user={user}
            active={
              sidebarOverride ? sidebarOverride :
                ["projects", "edit-project", "project-details"].includes(validActive) ? "projects" :
                  validActive
            }
            setActive={(val) => { setSidebarOverride(null); setActive(val); }}
            onLogout={handleLogout}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            navItems={navItems}
            companyLogo={companyLogo}
            onLogoChange={onLogoChange}
            enforceMySubscriptions={enforceMySubscriptions}
            onLogoUploadClick={() => headerLogoRef.current?.click()}
            setSelectedProjectForTasks={setSelectedProjectForTasks}
            desktopOpen={desktopSidebarOpen}
          />

        </div>

      )}



      {showCropModal && (

        <ImageCropModal

          image={cropImage}

          onCropComplete={handleCropComplete}

          onCancel={() => setShowCropModal(false)}

          aspect={cropAspect}

        />

      )}





      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        {/* Desktop Topbar (hamburger toggle) */}
        {!enforceMySubscriptions && (
          <div className="desktop-topbar no-print" style={{ display: "none", alignItems: "center", height: 36, padding: "0 24px", background: "var(--app-bg)", position: "sticky", top: 0, zIndex: 90, marginTop: 0 }}>
            <button onClick={() => setDesktopSidebarOpen(v => !v)} style={{ background: "none", border: "none", width: 38, height: 38, fontSize: 22, cursor: "pointer", color: "var(--app-muted)", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, marginTop: "70px", alignSelf: "center" }}>☰</button>
          </div>
        )}

        {/* Mobile Topbar */}

        <div className="mob-topbar no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#fff", borderBottom: "1px solid var(--app-border)", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 8px rgba(var(--app-accent-rgb, 124, 58, 237),0.07)" }}>

          {!enforceMySubscriptions ? (

            <button onClick={() => { isDesktopWidth ? setDesktopSidebarOpen(v => !v) : setSidebarOpen(true); }} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--app-muted)", padding: "2px 6px", lineHeight: 1 }}>☰</button>

          ) : (

            <div style={{ width: 40 }} />

          )}

          <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>

            {page?.label}

          </div>

          {user?.email !== "admin@gmail.com" && (

            <>

              <input type="file" ref={headerLogoRef} onChange={handleHeaderLogoUpload} accept="image/*" style={{ display: "none" }} />

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

                {enforceMySubscriptions && (

                  <button onClick={handleLogout} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "6px 12px", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Logout</button>

                )}

                <div data-profile-anchor="true" onClick={(e) => { e.stopPropagation(); setProfileDropdownOpen(v => !v); setShowProfile(false); }} style={{ cursor: "pointer", position: "relative" }}>

                  <div onClick={(e) => { e.stopPropagation(); headerLogoRef.current?.click(); }} title="Click to upload logo">

                    {companyLogo ? (

                      <img src={companyLogo} alt="logo" style={{ height: 38, width: "auto", maxWidth: "100px", objectFit: "contain", flexShrink: 0, display: "block", borderRadius: 10, background: "#fff", border: "1.5px solid var(--app-border)" }} />

                    ) : (

                      <div style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", color: "#fff", fontWeight: 800, fontSize: 13 }}>{initials}</div>

                    )}

                  </div>

                </div>

              </div>

            </>

          )}

        </div>



        <div className="main">

          {/* Topbar */}

          <div className="topbar no-print">

            <div className="search-wrap">





            </div>
            <div className="topbar-right">

              <div className="topbar-icon" onClick={() => { setShowNotifPanel(v => !v); fetchPendingLeaves(); }} style={{ position: 'relative', cursor: 'pointer' }}>
                <i className="ti ti-bell"></i>
                {pendingLeaves.length > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -4, background: '#EF4444', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingLeaves.length}</span>
                )}
                {showNotifPanel && (
                  <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 44, right: 0, width: 380, background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid #E2E8F0', zIndex: 99999, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, var(--app-accent, var(--app-accent, #00BCD4)),#0097A7)' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className="ti ti-bell"></i> Notifications
                        {pendingLeaves.length > 0 && <span style={{ background: '#EF4444', color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 800 }}>{pendingLeaves.length}</span>}
                      </div>
                      <button onClick={() => setShowNotifPanel(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, width: 26, height: 26, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                    <div style={{ maxHeight: 420, overflowY: 'auto', padding: '12px 16px' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#718096', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 10 }}>
                        <i className="ti ti-user-x" style={{ marginRight: 5, color: 'var(--app-accent)' }}></i> Leave Requests
                      </div>
                      {pendingLeaves.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px 0', color: '#A0AEC0', fontSize: 13 }}>
                          <i className="ti ti-bell-off" style={{ fontSize: 28, display: 'block', marginBottom: 8, opacity: 0.4 }}></i>
                          No pending notifications
                        </div>
                      ) : (
                        pendingLeaves.map((l, i) => {
                          const initials = l.employeeName ? l.employeeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'EE';
                          const colors = ['#f59e0b', '#a855f7', '#0ea5e9', '#ec4899', '#22c55e'];
                          const bg = colors[i % colors.length];
                          const detail = `${l.type || 'Leave'} · ${l.from || ''} ${l.to ? '- ' + l.to : ''}`;
                          return (
                            <div key={l._id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i === pendingLeaves.length - 1 ? 'none' : '1px solid #F0F4F8' }}>
                              <div style={{ width: 38, height: 38, borderRadius: '50%', background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{initials}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{l.employeeName}</div>
                                <div style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>{detail}</div>
                                <span style={{ display: 'inline-block', marginTop: 4, background: '#FEF3C7', color: '#D97706', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 800 }}>Pending</span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                                <button onClick={() => handleApproveLeave(l._id)} style={{ background: '#DCFCE7', color: '#166534', border: 'none', padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <i className="ti ti-check"></i> Approve
                                </button>
                                <button onClick={() => handleRejectLeave(l._id)} style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <i className="ti ti-x"></i> Reject
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div style={{ padding: '12px 16px', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
                      <button onClick={() => setShowNotifPanel(false)} style={{ background: 'none', border: 'none', color: ' var(--app-accent, var(--app-accent, #00BCD4))', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="topbar-icon" onClick={() => setActive("settings")}><i className="ti ti-settings"></i></div>

              {/* Dynamic Action Buttons based on validActive */}
              {validActive === "clients" && (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>


                </div>

              )}

              {validActive === "employees" && (

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

                  {subscription && (

                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--app-muted)" }}>

                      {employees.length} / {getSubscriptionLimit("employee") === Infinity ? "Unlimited" : getSubscriptionLimit("employee")} Used

                    </span>

                  )}



                </div>

              )}

              {/* New Project button moved above Overall Value card */}

              {validActive === "managers" && (

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

                  {subscription && (

                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--app-muted)" }}>

                      {managers.length} / {getSubscriptionLimit("manager") === Infinity ? "Unlimited" : getSubscriptionLimit("manager")} Used

                    </span>

                  )}

                  <button

                    className="create-btn"

                    onClick={() => {
                      const limit = getSubscriptionLimit("manager", subscription);
                      if (limit !== Infinity && managers.length >= limit) {
                        setLimitModal({ type: "manager", limit });
                        return;
                      }
                      setNmError({}); setShowMgrPass(false); setModal("manager");
                      fetchSubscription(); // refresh in background, don't block opening the form
                    }}

                    style={{ opacity: isUsageAtLimit("manager", managers.length) ? 0.5 : 1 }}

                  >

                    <i className="ti ti-plus"></i> Add Manager

                  </button>

                </div>

              )}

              {validActive === "subadmins" && <button className="create-btn" onClick={() => { setNsError({}); setShowSubPass(false); setModal("subadmin"); }}><i className="ti ti-plus"></i> Add Partner</button>}





              {/* Profile Toggle (re-using topbar logic) */}

              <div data-profile-anchor="true" onClick={(e) => { e.stopPropagation(); setProfileDropdownOpen(v => !v); setShowProfile(false); }} className="mob-topbar-hide" style={{ background: "#fff", border: "1.5px solid var(--app-border)", borderRadius: 12, padding: "6px 12px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0, marginLeft: 8 }}>

                <div onClick={(e) => { e.stopPropagation(); headerLogoRef.current?.click(); }} style={{ cursor: "pointer" }} title="Click to upload logo">

                  {companyLogo ? (

                    <img src={companyLogo} alt="logo" style={{ height: 28, width: "auto", objectFit: "contain", flexShrink: 0, borderRadius: 6 }} onError={() => setCompanyLogo(null)} />

                  ) : (

                    <div style={{ width: 28, height: 28, background: "var(--teal)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 10 }}>{initials}</div>

                  )}

                </div>

                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{displayName}</span>

              </div>

            </div>

          </div>



          <div className="content">

            {trialToast && (
              <div style={{ position: "fixed", top: 24, left: "50%", width: "max-content", marginLeft: "auto", marginRight: "auto", right: 0, zIndex: 9999, background: "#fff", border: "1.5px solid #00BCD4", borderRadius: 14, padding: "14px 26px", fontSize: 14, fontWeight: 800, color: "#0097A7", boxShadow: "0 10px 32px rgba(0,188,212,0.25), 0 4px 12px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: 10 }}>
                <i className="ti ti-circle-check" style={{ fontSize: 18, color: "#00BCD4" }}></i> Free Trial Activated
              </div>
            )}
            {/* Trial toast trigger runs once via useEffect below, not inline during render */}

            {subscriptionChecked && !isInFreeTrial() && !subscription && (
              <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 20px', borderRadius: 10, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                <span><i className="ti ti-alert-circle" style={{ marginRight: 8 }}></i>Choose a subscription plan to continue.</span>
                <button onClick={() => { setForceUpgradeTab(true); setActive('mysubscriptions'); }} style={{ background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Upgrade Now</button>
              </div>
            )}
            <EmployeeSubscriptionWarning user={user} trigger={subscription?.updatedAt || subscription?._id} onRenew={() => { setForceUpgradeTab(true); setActive("mysubscriptions"); setTimeout(() => { const el = document.querySelector('.plan-card, .plans-grid, [class*="upgrade"]'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 400); }} />



            {/* ── Dashboard ── */}{validActive === "dashboard" && (
              <>
                {/* MOBILE DASHBOARD (visible only under 768px) */}
                <div className="mobile-dashboard-view" style={{ display: "none" }}>
                  <style>{`
    @media (max-width: 768px) {
      .mobile-dashboard-view { display: block !important; }
      .desktop-dashboard-view { display: none !important; }
    }
    @keyframes floatIn { from { opacity:0; transform:translateY(14px);} to {opacity:1; transform:translateY(0);} }
    @keyframes shimmerMove { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
    .mob-card { animation: floatIn .4s ease both; }
    .mob-shimmer {
      background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.12) 37%, rgba(255,255,255,0.03) 63%);
      background-size: 400% 100%;
      animation: shimmerMove 2.5s ease infinite;
    }
  `}</style>

                  {/* HERO HEADER — glass + gradient mesh */}
                  <div style={{
                    position: "relative",
                    background: "radial-gradient(120% 120% at 15% 0%, #1e1b4b 0%, #0f0a29 45%, #05030f 100%)",
                    borderRadius: "0 0 32px 32px",
                    padding: "18px 18px 100px",
                    color: "#fff",
                    overflow: "hidden"
                  }}>
                    {/* decorative mesh blobs */}
                    <div style={{ position: "absolute", top: -60, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, var(--app-accent) 0%, transparent 70%)", opacity: 0.35, filter: "blur(10px)" }} />
                    <div style={{ position: "absolute", bottom: -80, left: -30, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)", opacity: 0.25, filter: "blur(14px)" }} />

                    <div style={{ position: "relative", zIndex: 2 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div onClick={() => setSidebarOpen(true)} style={{ width: 42, height: 42, borderRadius: 14, background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <i className="ti ti-menu-2" style={{ fontSize: 18 }}></i>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 700, letterSpacing: 1 }}>WELCOME BACK</div>
                          <div style={{ fontSize: 14, fontWeight: 800 }}>{(user?.companyName || user?.name || "Business")}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <div onClick={() => { setShowNotifPanel(v => !v); fetchPendingLeaves(); }} style={{ width: 42, height: 42, borderRadius: 14, background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                            <i className="ti ti-bell" style={{ fontSize: 17 }}></i>
                            {pendingLeaves.length > 0 && (
                              <span style={{ position: "absolute", top: 5, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#ff4d6d", boxShadow: "0 0 0 2px #0f0a29" }}></span>
                            )}
                          </div>
                          <div onClick={() => setShowProfile(true)} style={{ width: 42, height: 42, borderRadius: 14, background: "var(--app-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, boxShadow: "0 6px 18px rgba(0,188,212,0.4)", overflow: "hidden" }}>
                            {companyLogo ? (
                              <img src={companyLogo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            ) : (
                              (user?.name || "PR").substring(0, 2).toUpperCase()
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <i className="ti ti-sparkles" style={{ color: "var(--app-accent)" }}></i> Revenue this month
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1, background: "linear-gradient(90deg,#fff,#c7d2fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                          Rs.{(totalRevenue || 0).toLocaleString()}
                        </span>
                        <span style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", fontSize: 12, fontWeight: 800, padding: "5px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
                          <i className="ti ti-trending-up"></i> 12%
                        </span>
                      </div>

                      <div style={{ height: 60, marginTop: 10 }}>
                        <svg viewBox="0 0 300 60" width="100%" height="100%" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="mobAreaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--app-accent)" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="var(--app-accent)" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M0,45 L50,40 L100,48 L150,18 L200,26 L250,12 L300,20 L300,60 L0,60 Z" fill="url(#mobAreaGrad)" />
                          <polyline fill="none" stroke="var(--app-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points="0,45 50,40 100,48 150,18 200,26 250,12 300,20" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* FLOATING STAT STRIP */}
                  <div style={{ margin: "-72px 16px 0", position: "relative", zIndex: 5, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                    {[
                      { icon: "ti-users", label: "Clients", val: clients.length, grad: "linear-gradient(135deg,#7c3aed,#a78bfa)" },
                      { icon: "ti-folder", label: "Projects", val: projects.length, grad: "linear-gradient(135deg,var(--app-accent),#26d0ce)" },
                      { icon: "ti-user-circle", label: "Team", val: employees.length, grad: "linear-gradient(135deg,#f59e0b,#fbbf24)" },
                    ].map((s, i) => (
                      <div key={i} className="mob-card" style={{ animationDelay: `${i * 60}ms`, background: "#fff", borderRadius: 18, padding: "14px 10px", boxShadow: "0 10px 30px rgba(15,10,41,0.12)", textAlign: "center", border: "1px solid rgba(0,0,0,0.03)" }}>
                        <div style={{ width: 34, height: 34, borderRadius: 11, background: s.grad, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", color: "#fff", fontSize: 15, boxShadow: "0 6px 14px rgba(0,0,0,0.15)" }}>
                          <i className={`ti ${s.icon}`}></i>
                        </div>
                        <div style={{ fontSize: 19, fontWeight: 900, color: "#0f0a29" }}>{s.val}</div>
                        <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 700, marginTop: 1 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* QUICK ACTIONS — pill scroller */}
                  <div style={{ padding: "22px 16px 6px" }}>
                    <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                      {[
                        { icon: "ti-file-invoice", label: "Invoice", color: "#0d9488", bg: "linear-gradient(135deg,#ccfbf1,#99f6e4)", action: () => { setSidebarOverride("dashboard"); setActive("invoices"); } },
                        { icon: "ti-user-plus", label: "Client", color: "#7c3aed", bg: "linear-gradient(135deg,#ede9fe,#ddd6fe)", action: () => { setSidebarOverride("dashboard"); setActive("addClient"); } },
                        { icon: "ti-folder-plus", label: "Project", color: "#d97706", bg: "linear-gradient(135deg,#fef3c7,#fde68a)", action: () => { setJumpProject(null); setActive("create-project"); } },
                        { icon: "ti-clipboard-list", label: "Proposal", color: "#16a34a", bg: "linear-gradient(135deg,#dcfce7,#bbf7d0)", action: () => { setSidebarOverride("dashboard"); setActive("proposals"); } },
                        { icon: "ti-receipt", label: "Quote", color: "#2563eb", bg: "linear-gradient(135deg,#dbeafe,#bfdbfe)", action: () => { setSidebarOverride("dashboard"); setActive("quotations"); } },
                      ].map((a, i) => (
                        <div key={i} onClick={a.action} style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", minWidth: 68 }}>
                          <div style={{ width: 52, height: 52, borderRadius: 16, background: a.bg, color: a.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 6px 16px rgba(0,0,0,0.06)" }}>
                            <i className={`ti ${a.icon}`}></i>
                          </div>
                          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#334155" }}>{a.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PROJECTS — redesigned cards */}
                  <div style={{ padding: "16px 16px 100px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: "#0f0a29", display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 6, height: 18, borderRadius: 4, background: "var(--app-accent)", display: "inline-block" }}></span>
                        Active Projects
                      </div>
                      <div onClick={() => { setSidebarOverride("dashboard"); setActive("projects"); }} style={{ fontSize: 12.5, fontWeight: 800, color: "var(--app-accent)", display: "flex", alignItems: "center", gap: 3 }}>
                        View All <i className="ti ti-chevron-right" style={{ fontSize: 13 }}></i>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {projectsWithProgress.slice(0, 6).map((p, idx) => {
                        const progress = p.progress || 0;
                        const ringColor = progress >= 80 ? "#16a34a" : progress >= 40 ? "var(--app-accent)" : "#dc2626";
                        const clientName = clients.find(c => c._id === p.clientId)?.clientName || p.client || "Internal";
                        const isExpanded = expandedMobileProjectIdx === idx;
                        return (
                          <div
                            key={p._id || idx}
                            className="mob-card"
                            style={{ animationDelay: `${idx * 40}ms`, background: "#fff", borderRadius: 20, padding: "16px 16px", boxShadow: isExpanded ? "0 14px 34px rgba(15,10,41,0.12)" : "0 4px 16px rgba(15,10,41,0.06)", border: `1px solid ${isExpanded ? "rgba(0,188,212,0.25)" : "rgba(0,0,0,0.04)"}`, cursor: "pointer", transition: "all .25s" }}
                            onClick={() => setExpandedMobileProjectIdx(prev => prev === idx ? null : idx)}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                              <div style={{ position: "relative", width: 50, height: 50, flexShrink: 0 }}>
                                <svg width="50" height="50" viewBox="0 0 50 50">
                                  <circle cx="25" cy="25" r="21" fill="none" stroke="#f1f5f9" strokeWidth="5" />
                                  <circle cx="25" cy="25" r="21" fill="none" stroke={ringColor} strokeWidth="5" strokeDasharray={`${(progress / 100) * 132} 132`} strokeLinecap="round" transform="rotate(-90 25 25)" style={{ transition: "stroke-dasharray .5s ease" }} />
                                </svg>
                                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: ringColor }}>
                                  {progress}%
                                </div>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0f0a29", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                                <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                                  <i className="ti ti-building" style={{ fontSize: 12 }}></i>{clientName}
                                </div>
                                <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, marginTop: 9, overflow: "hidden" }}>
                                  <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg, ${ringColor}, ${ringColor}cc)`, borderRadius: 3, transition: "width .5s ease" }}></div>
                                </div>
                              </div>
                              <i className={`ti ti-chevron-${isExpanded ? "up" : "down"}`} style={{ color: "#cbd5e1", fontSize: 18, flexShrink: 0 }}></i>
                            </div>

                            {isExpanded && (
                              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px dashed #e2e8f0", display: "flex", flexDirection: "column", gap: 10 }}>
                                {p.end && (
                                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#ccfbf1,#a7f3d0)", color: "#0d9488", padding: "6px 12px", borderRadius: 20, fontSize: 11.5, fontWeight: 800, width: "fit-content" }}>
                                    <i className="ti ti-clock"></i> Due in {Math.max(0, Math.ceil((new Date(p.end) - new Date()) / 86400000))} days
                                  </div>
                                )}
                                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#64748b" }}>
                                  <i className="ti ti-user" style={{ fontSize: 14 }}></i>
                                  {Array.isArray(p.assignedTo) ? (p.assignedTo[0] || "Unassigned") : (p.assignedTo || "Unassigned")}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#64748b" }}>
                                  <i className="ti ti-currency-rupee" style={{ fontSize: 14 }}></i>
                                  {formatCurrency(p.budget, p.currency)} budget
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setJumpProject(p); setActive("project-details"); }}
                                  style={{ marginTop: 4, background: "var(--app-accent)", color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}
                                >
                                  Open Project
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {projectsWithProgress.length === 0 && (
                        <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8", fontSize: 13 }}>No projects yet</div>
                      )}
                    </div>
                  </div>

                  {/* FLOATING BOTTOM NAV — glass pill */}
                  <div style={{ position: "fixed", bottom: 14, left: 14, right: 14, background: "rgba(15,10,41,0.92)", backdropFilter: "blur(16px)", borderRadius: 24, display: "flex", justifyContent: "space-around", alignItems: "center", padding: "10px 6px", zIndex: 4000, boxShadow: "0 12px 32px rgba(15,10,41,0.35)" }}>
                    {[
                      { icon: "ti-home", label: "Home", key: "dashboard" },
                      { icon: "ti-folder", label: "Projects", key: "projects" },
                      { icon: null, label: "", key: "add" },
                      { icon: "ti-users", label: "Clients", key: "clients" },
                      { icon: "ti-dots", label: "More", key: "settings" },
                    ].map((n, i) => n.key === "add" ? (
                      <div key={i} onClick={() => { setJumpProject(null); setActive("create-project"); }} style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),#26d0ce)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, marginTop: -30, boxShadow: "0 10px 24px rgba(0,188,212,0.5)", border: "3px solid #0f0a29" }}>+</div>
                    ) : (
                      <div key={i} onClick={() => setActive(n.key)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: active === n.key ? "var(--app-accent)" : "rgba(255,255,255,0.5)", padding: "4px 10px" }}>
                        <i className={`ti ${n.icon}`} style={{ fontSize: 19 }}></i>
                        <span style={{ fontSize: 9.5, fontWeight: 700 }}>{n.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="desktop-dashboard-view">

                  {/* Theme Picker - Dashboard Page */}

                  <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 5000 }}>

                    {showThemePicker && (

                      <div style={{

                        position: "absolute", bottom: 56, right: 0,

                        background: "#fff", borderRadius: 18, padding: 20,

                        boxShadow: "0 20px 60px rgba(0,0,0,0.18)", border: "1.5px solid var(--app-border)",

                        width: 300, maxHeight: "70vh", overflowY: "auto"

                      }}>

                        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--app-sidebar)", marginBottom: 14 }}>

                          Choose Theme

                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>

                          {Object.entries(THEMES).map(([key, t]) => (

                            <button key={key} onClick={() => { setAppTheme(key); setShowThemePicker(false); }}

                              style={{

                                border: appTheme === key ? `2.5px solid ${t.dot}` : "2px solid var(--app-border)",

                                borderRadius: 12, padding: "10px 6px", background: appTheme === key ? `${t.dot}15` : "#fafafa",

                                cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,

                                fontFamily: "inherit", transition: "all 0.15s"

                              }}>

                              <div style={{ width: 28, height: 28, borderRadius: "50%", background: t.dot, boxShadow: `0 3px 8px ${t.dot}50` }} />

                              <span style={{ fontSize: 10, fontWeight: 700, color: appTheme === key ? t.dot : "#64748b" }}>

                                {t.label}

                              </span>

                            </button>

                          ))}

                        </div>



                        {/* Custom Color Picker Section */}

                        <div style={{ marginTop: 16, borderTop: "1.5px solid var(--app-border)", paddingTop: 14 }}>

                          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>

                            🎯 Custom Color

                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

                            <div style={{ position: "relative", flexShrink: 0 }}>

                              <div style={{

                                width: 42, height: 42, borderRadius: 12,

                                background: customColor,

                                border: appTheme === "custom" ? `2.5px solid ${customColor}` : "2px solid var(--app-border)",

                                boxShadow: `0 4px 12px ${customColor}40`,

                                cursor: "pointer", transition: "all 0.2s",

                                display: "flex", alignItems: "center", justifyContent: "center"

                              }}

                                onClick={() => document.getElementById("customColorInput")?.click()}

                              >

                                <span style={{ fontSize: 16 }}></span>

                              </div>

                              <input

                                id="customColorInput"

                                type="color"

                                value={customColor}

                                onChange={(e) => {

                                  setCustomColor(e.target.value);

                                  setAppTheme("custom");

                                }}

                                style={{

                                  position: "absolute", top: 0, left: 0, width: 42, height: 42,

                                  opacity: 0, cursor: "pointer", border: "none"

                                }}

                              />

                            </div>

                            <div style={{ flex: 1 }}>

                              <div style={{ fontSize: 12, fontWeight: 700, color: appTheme === "custom" ? customColor : "#64748b" }}>

                                {appTheme === "custom" ? "Custom Active" : "Pick any color"}

                              </div>

                              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>

                                {customColor.toUpperCase()}

                              </div>

                            </div>

                            {appTheme === "custom" && (

                              <div style={{

                                width: 20, height: 20, borderRadius: "50%",
                                background: "#22c55e", boxShadow: "0 0 6px #22c55e80",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#fff", fontSize: 12, fontWeight: 900, flexShrink: 0

                              }}>✓</div>

                            )}

                          </div>



                          {/* Quick custom color presets */}

                          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>

                            {["#2563eb", "#0891b2", "#059669", "#d97706", "#dc2626", "#db2777", "#7c2d12", "#4f46e5", "#0f766e", "#b91c1c"].map(c => (

                              <div key={c} onClick={() => { setCustomColor(c); setAppTheme("custom"); setShowThemePicker(false); }}

                                style={{

                                  width: 22, height: 22, borderRadius: 6, background: c, cursor: "pointer",

                                  border: customColor === c && appTheme === "custom" ? "2px solid #fff" : "2px solid transparent",

                                  boxShadow: customColor === c && appTheme === "custom" ? `0 0 0 2px ${c}, 0 2px 8px ${c}50` : `0 1px 4px ${c}30`,

                                  transition: "all 0.15s"

                                }}

                              />

                            ))}

                          </div>

                        </div>

                      </div>

                    )}

                    <button onClick={() => setShowThemePicker(v => !v)}
                      style={{
                        width: 48, height: 48, borderRadius: "50%",
                        background: appTheme === "custom"
                          ? `linear-gradient(135deg, ${customColor}, ${customColor}dd)`
                          : `linear-gradient(135deg, ${THEMES[appTheme]?.accent}, ${THEMES[appTheme]?.dot})`,
                        border: "none", color: "#fff", fontSize: 20, cursor: "pointer",
                        boxShadow: `0 6px 20px ${appTheme === "custom" ? customColor : (THEMES[appTheme]?.dot || "var(--app-accent)")}60`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s"
                      }}>
                      🎨
                    </button>
                    <button
                      onClick={() => { const ph = (user?.phone || "").replace(/\D/g, ""); window.open(ph ? "https://wa.me/" + ph : "https://web.whatsapp.com/", "_blank"); }}
                      title="Open WhatsApp"
                      style={{
                        width: 48, height: 48, borderRadius: "50%",
                        background: "#25D366",
                        border: "none", cursor: "pointer",
                        boxShadow: "0 6px 20px rgba(37,211,102,0.6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s", padding: 0,
                        marginTop: 12
                      }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32" fill="none">
                        <path d="M16 1C7.7 1 1 7.7 1 16c0 2.7.7 5.2 2 7.4L1 31l7.9-2c2.1 1.1 4.5 1.8 7.1 1.8 8.3 0 15-6.7 15-15S24.3 1 16 1z" fill="#fff" />
                        <path d="M16 3.5C9 3.5 3.5 9 3.5 16c0 2.5.7 4.8 1.9 6.8l.3.5-1.3 4.7 4.9-1.3.5.3C11.6 28.1 13.7 28.5 16 28.5c7 0 12.5-5.5 12.5-12.5S23 3.5 16 3.5z" fill="#25D366" />
                        <path d="M11.5 9.5c-.3-.7-.6-.7-.9-.7h-.7c-.3 0-.7.1-1.1.5-.4.4-1.5 1.5-1.5 3.6s1.6 4.2 1.8 4.5c.2.3 3 4.7 7.4 6.4 3.7 1.4 4.4 1.1 5.2 1 .8 0 2.5-1 2.8-2 .4-1 .4-1.8.3-2-.1-.2-.4-.3-.8-.5-.4-.2-2.5-1.2-2.8-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.3 1.6-.2.3-.5.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.2-2.1-2.6-.2-.4 0-.6.2-.8.2-.2.4-.4.5-.7.2-.2.2-.4.4-.7.1-.2 0-.5-.1-.7-.2-.2-.9-2.2-1.2-3z" fill="#fff" />
                      </svg>
                    </button>
                  </div>












                  {dashTasksProj ? (

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%", marginTop: "10px" }}>

                      <div>



                      </div>

                      <div style={{ flex: 1 }}>

                        <ModernEmployeeProjectDetails

                          project={dashTasksProj}

                          tasks={tasks.filter(t => (t.project || t.projectId) === (dashTasksProj._id || dashTasksProj.id))}

                          user={user}

                          onBack={() => setDashTasksProj(null)}

                          onMessageTeam={() => setActive("messaging")}

                        />

                      </div>

                    </div>

                  ) : (

                    <>

                      {/* EXACT TEMPLATE LAYOUT - DYNAMIC */}

                      {(() => {

                        const activeProjCount = projects.filter(p => p.status === "Active" || p.status === "Pending").length;

                        const pendingInvCount = invoices.filter(i => (i.status || "").toLowerCase() === "pending" || (i.status || "").toLowerCase() === "overdue").length;

                        const totalIncome = income.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

                        const totalInvAmt = invoices.filter(i => (i.status || "").toLowerCase() === "pending" || (i.status || "").toLowerCase() === "overdue").reduce((sum, i) => sum + (Number(i.grandTotal) || 0), 0);



                        return (

                          <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 12, fontFamily: "'Nunito', sans-serif" }}>



                            {/* TOP CARDS ROW */}

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 20 }}>



                              {/* Revenue Card */}

                              <div style={{ background: "#ffffff", borderRadius: 16, padding: 20, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column" }}>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>

                                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,188,212,0.1)", color: "#0097A7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>

                                    <i className="ti ti-currency-rupee"></i>

                                  </div>

                                  {totalIncome > 0 && (
                                    <div style={{ background: "#e6fbf9", color: "#0097A7", padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>

                                      <i className="ti ti-trending-up"></i> Active

                                    </div>
                                  )}

                                </div>

                                <div style={{ fontSize: 26, fontWeight: 800, color: "#0f1c2e", marginBottom: 4 }}>

                                  {formatShortCurrency(totalIncome)}

                                </div>

                                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(15,28,46,0.6)" }}>Revenue This Month</div>

                              </div>



                              {/* Clients Card */}

                              <div style={{ background: "#ffffff", borderRadius: 16, padding: 20, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column" }}>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>

                                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(22,163,74,0.1)", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>

                                    <i className="ti ti-users"></i>

                                  </div>

                                  {clients.length > 0 && (
                                    <div style={{ background: "#dcfce7", color: "#166534", padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>

                                      <i className="ti ti-trending-up"></i> {clients.filter(c => (c.status || "").toLowerCase() === "active").length} active

                                    </div>
                                  )}

                                </div>

                                <div style={{ fontSize: 26, fontWeight: 800, color: "#0f1c2e", marginBottom: 4 }}>

                                  {clients.length}

                                </div>

                                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(15,28,46,0.6)" }}>Total Clients</div>

                                <div style={{ fontSize: 11, color: "rgba(15,28,46,0.4)", marginTop: 8 }}>{clients.filter(c => (c.status || "").toLowerCase() === "active").length} active</div>

                              </div>



                              {/* Projects Card */}

                              <div style={{ background: "#ffffff", borderRadius: 16, padding: 20, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column" }}>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>

                                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(37,99,235,0.1)", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>

                                    <i className="ti ti-folder"></i>

                                  </div>

                                  {activeProjCount > 0 && (
                                    <div style={{ background: "#f1f5f9", color: "#64748b", padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>

                                      Active

                                    </div>
                                  )}

                                </div>

                                <div style={{ fontSize: 26, fontWeight: 800, color: "#0f1c2e", marginBottom: 4 }}>

                                  {activeProjCount}

                                </div>

                                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(15,28,46,0.6)" }}>Active Projects</div>

                                <div style={{ fontSize: 11, color: "rgba(15,28,46,0.4)", marginTop: 8 }}>
                                  {(() => {
                                    const now = new Date();
                                    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                                    const dueThisWeek = projects.filter(p => p.deadline && new Date(p.deadline) >= now && new Date(p.deadline) <= weekAhead).length;
                                    return dueThisWeek > 0 ? `${dueThisWeek} due this week` : "No deadlines this week";
                                  })()}
                                </div>

                              </div>



                              {/* Invoices Card */}

                              <div style={{ background: "#ffffff", borderRadius: 16, padding: 20, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column" }}>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>

                                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(220,38,38,0.1)", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>

                                    <i className="ti ti-file-invoice"></i>

                                  </div>

                                  {pendingInvCount > 0 && (
                                    <div style={{ background: "#fef2f2", color: "#991b1b", padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>

                                      <i className="ti ti-trending-down"></i> {invoices.filter(i => (i.status || "").toLowerCase() === "overdue").length > 0 ? "overdue" : "pending"}

                                    </div>
                                  )}

                                </div>

                                <div style={{ fontSize: 26, fontWeight: 800, color: "#0f1c2e", marginBottom: 4 }}>

                                  {pendingInvCount}

                                </div>

                                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(15,28,46,0.6)" }}>Unpaid Invoices</div>

                                <div style={{ fontSize: 11, color: "rgba(15,28,46,0.4)", marginTop: 8 }}>{formatShortCurrency(totalInvAmt)} outstanding</div>

                              </div>



                              {/* Employees Card */}

                              <div style={{ background: "#ffffff", borderRadius: 16, padding: 20, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column" }}>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>

                                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(124,58,237,0.1)", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>

                                    <i className="ti ti-user-circle"></i>

                                  </div>

                                  {employees.length > 0 && (
                                    <div style={{ background: "#f3e8ff", color: "#6b21a8", padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>

                                      <i className="ti ti-trending-up"></i> {employees.length}

                                    </div>
                                  )}

                                </div>

                                <div style={{ fontSize: 26, fontWeight: 800, color: "#0f1c2e", marginBottom: 4 }}>

                                  {employees.length}

                                </div>

                                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(15,28,46,0.6)" }}>Employees</div>

                                <div style={{ fontSize: 11, color: "rgba(15,28,46,0.4)", marginTop: 8 }}>
                                  {employees.filter(e => (e.status || "").toLowerCase() === "active").length} active staff
                                </div>

                              </div>



                            </div>



                            {/* MAIN CONTENT AREA */}

                            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 24, alignItems: "start" }}>



                              {/* LEFT COLUMN */}

                              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>



                                {/* Total Revenue Bar Chart Placeholder */}

                                <div style={{ background: "#ffffff", borderRadius: 16, padding: 24, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>

                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>

                                    <div>

                                      <div style={{ fontSize: 13, color: "rgba(15,28,46,0.6)", fontWeight: 700, marginBottom: 4 }}>Total Revenue</div>

                                      <div style={{ fontSize: 24, fontWeight: 800, color: "#0f1c2e" }}>{formatShortCurrency(totalIncome)} <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(15,28,46,0.4)" }}>this year</span></div>

                                    </div>

                                    <div style={{ display: "flex", gap: 16, fontSize: 12, fontWeight: 700 }}>

                                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(15,28,46,0.8)" }}>

                                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--app-accent)" }}></div> Revenue

                                      </div>

                                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(15,28,46,0.8)" }}>

                                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(var(--app-accent-rgb,0,188,212),0.2)" }}></div> Expenses

                                      </div>

                                    </div>

                                  </div>

                                  <div style={{ height: 180, display: "flex", alignItems: "flex-end", gap: 12, paddingBottom: 10 }}>

                                    {totalIncome > 0 ? (
                                      [30, 45, 35, 60, 40, 75].map((h, i) => (

                                        <div key={i} style={{ flex: 1, display: "flex", gap: 4, height: "100%", alignItems: "flex-end", padding: "0 4px" }}>

                                          <div style={{ flex: 1, background: "var(--app-accent)", height: `${h}%`, borderRadius: "4px 4px 0 0" }}></div>

                                          <div style={{ flex: 1, background: "rgba(var(--app-accent-rgb,0,188,212),0.2)", height: `${h * 0.4}%`, borderRadius: "4px 4px 0 0" }}></div>

                                        </div>

                                      ))
                                    ) : (
                                      [0, 0, 0, 0, 0, 0].map((h, i) => (

                                        <div key={i} style={{ flex: 1, display: "flex", gap: 4, height: "100%", alignItems: "flex-end", padding: "0 4px" }}>

                                          <div style={{ flex: 1, background: "rgba(15,28,46,0.06)", height: "2px", borderRadius: "4px 4px 0 0" }}></div>

                                          <div style={{ flex: 1, background: "rgba(15,28,46,0.03)", height: "2px", borderRadius: "4px 4px 0 0" }}></div>

                                        </div>

                                      ))
                                    )}

                                  </div>

                                  <div style={{ display: "flex", justifyContent: "space-between", padding: "0 10px", fontSize: 11, color: "rgba(15,28,46,0.4)", fontWeight: 700 }}>

                                    <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>

                                  </div>

                                </div>

                                {/* Active Projects (moved directly under the chart, no gap) */}

                                <div style={{ background: "#ffffff", borderRadius: 16, padding: 24, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>

                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>

                                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0f1c2e", display: "flex", alignItems: "center", gap: 8 }}>

                                      <i className="ti ti-folder" style={{ color: "var(--app-accent)" }}></i> Active Projects

                                    </div>

                                    <div onClick={() => { setSidebarOverride("dashboard"); setActive("projects"); }} style={{ fontSize: 13, fontWeight: 700, color: "var(--app-accent)", cursor: "pointer" }}>

                                      View All

                                    </div>

                                  </div>

                                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                                    {projects.filter(p => p.status === "Active" || p.status === "Pending").slice(0, 5).map((p, idx) => {

                                      const colors = ["var(--app-accent)", "var(--app-accent)", "var(--app-accent)", "var(--app-accent)", "var(--app-accent)"];

                                      const bColor = colors[idx % colors.length];

                                      const progress = p.progress || 25;

                                      const barColor = progress > 70 ? "#16a34a" : progress > 40 ? "#f59e0b" : "#dc2626";

                                      const badgeText = "IN PROGRESS";

                                      const badgeColor = "var(--app-accent)";

                                      return (

                                        <div key={p._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottom: idx === 4 ? "none" : "1px solid rgba(0,0,0,0.04)" }}>

                                          <div style={{ display: "flex", gap: 12 }}>

                                            <div style={{ width: 3, background: bColor, borderRadius: 2 }}></div>

                                            <div>

                                              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f1c2e" }}>{p.name || p.title}</div>

                                              <div style={{ fontSize: 11, color: "rgba(15,28,46,0.5)", marginTop: 2 }}>{clients.find(c => c._id === p.clientId)?.clientName || "Internal"} Due {p.deadline ? new Date(p.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : "TBA"}</div>

                                            </div>

                                          </div>

                                          <div style={{ width: 100, textAlign: "right" }}>

                                            <div style={{ display: "inline-block", color: badgeColor, background: `${badgeColor}15`, padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800, marginBottom: 8, letterSpacing: "0.5px" }}>

                                              {badgeText}

                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

                                              <div style={{ flex: 1, height: 4, background: "rgba(0,0,0,0.06)", borderRadius: 2 }}>

                                                <div style={{ width: `${progress}%`, height: "100%", background: barColor, borderRadius: 2 }}></div>

                                              </div>

                                              <div style={{ fontSize: 11, fontWeight: 800, color: barColor }}>{progress}%</div>

                                            </div>

                                          </div>

                                        </div>

                                      );

                                    })}

                                    {projects.filter(p => p.status === "Active" || p.status === "Pending").length === 0 && (

                                      <div style={{ fontSize: 13, color: "rgba(15,28,46,0.5)", textAlign: "center", padding: "10px 0" }}>No active projects</div>

                                    )}

                                  </div>

                                </div>

                              </div>

                              {/* RIGHT COLUMN */}

                              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>



                                {/* Quick Access */}

                                <div style={{ background: "#ffffff", borderRadius: 16, padding: 24, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>

                                  <div style={{ fontSize: 16, fontWeight: 800, color: "#0f1c2e", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>

                                    <i className="ti ti-bolt" style={{ color: "#0097A7" }}></i> Quick Access

                                  </div>

                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

                                    {[

                                      { icon: "ti-users", color: "#0097A7", bg: "rgba(0,188,212,0.1)", label: "Clients", sub: `${clients.length} total`, act: "clients" },

                                      { icon: "ti-user-circle", color: "#7c3aed", bg: "rgba(124,58,237,0.1)", label: "Employees", sub: `${employees.length} staff`, act: "employees" },

                                      { icon: "ti-file-invoice", color: "#16a34a", bg: "rgba(22,163,74,0.1)", label: "Invoices", sub: `${pendingInvCount} unpaid`, act: "invoices" },

                                      { icon: "ti-receipt", color: "#2563eb", bg: "rgba(37,99,235,0.1)", label: "Quotations", sub: "Builder", act: "quotations" },

                                      { icon: "ti-report-money", color: "#d97706", bg: "rgba(217,119,6,0.1)", label: "Proposals", sub: "Creator", act: "proposals" },

                                      { icon: "ti-template", color: "#db2777", bg: "rgba(219,39,119,0.1)", label: "Templates", sub: "Designer", act: "templates" },

                                      { icon: "ti-messages", color: "#0097A7", bg: "rgba(0,188,212,0.1)", label: "Messages", sub: "Internal", act: "messaging" },

                                      { icon: "ti-world", color: "#16a34a", bg: "rgba(22,163,74,0.1)", label: "Client Portal", sub: "External", act: "clients" },

                                      { icon: "ti-wallet", color: "#2563eb", bg: "rgba(37,99,235,0.1)", label: "Accounts", sub: "Income/Exp", act: "accounts" },



                                    ].map((q, i) => (
                                      <div key={i} onClick={() => setActive(q.act)} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.05)", cursor: "pointer", transition: "all 0.2s" }}>
                                        <div style={{ width: 34, height: 34, borderRadius: 10, background: q.bg, color: q.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                                          <i className={`ti ${q.icon}`}></i>
                                        </div>
                                        <div>
                                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f1c2e" }}>{q.label}</div>
                                          <div style={{ fontSize: 11, color: "rgba(15,28,46,0.5)", marginTop: 2 }}>{q.sub}</div>
                                        </div>
                                      </div>
                                    ))}
                                    <div
                                      onClick={() => { const ph = (user?.phone || "").replace(/\D/g, ""); window.open(ph ? "https://wa.me/" + ph : "https://web.whatsapp.com/", "_blank"); }}
                                      style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.05)", cursor: "pointer", transition: "all 0.2s" }}
                                      onMouseEnter={e => e.currentTarget.style.background = "rgba(37,211,102,0.06)"}
                                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                    >
                                      <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(37,211,102,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                                        💬
                                      </div>
                                      <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f1c2e" }}>WhatsApp</div>
                                        <div style={{ fontSize: 11, color: "rgba(15,28,46,0.5)", marginTop: 2 }}>Open Chat</div>
                                      </div>
                                    </div>                              </div>
                                </div>

                                {/* Team Section */}

                                <div style={{ background: "#ffffff", borderRadius: 16, padding: 24, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>

                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>

                                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0f1c2e", display: "flex", alignItems: "center", gap: 8 }}>

                                      <i className="ti ti-user-circle" style={{ color: "#0097A7" }}></i> Team

                                    </div>

                                    <div onClick={() => setActive("employees")} style={{ fontSize: 13, fontWeight: 700, color: "#0097A7", cursor: "pointer" }}>

                                      View All

                                    </div>

                                  </div>

                                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                                    {employees.slice(0, 3).map(e => (

                                      <div key={e._id} style={{ display: "flex", alignItems: "center", gap: 12 }}>

                                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,  var(--app-accent, var(--app-accent, #00BCD4)), #0097A7)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800 }}>

                                          {(e.name || "E")[0].toUpperCase()}

                                        </div>

                                        <div style={{ flex: 1 }}>

                                          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f1c2e" }}>{e.name}</div>

                                          <div style={{ fontSize: 12, color: "rgba(15,28,46,0.5)" }}>{e.role || "Employee"}</div>

                                        </div>

                                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }}></div>

                                      </div>

                                    ))}

                                    {employees.length === 0 && <div style={{ fontSize: 13, color: "rgba(15,28,46,0.5)", textAlign: "center" }}>No team members</div>}

                                  </div>

                                </div>



                              </div>

                            </div>



                            {/* SECONDARY CONTENT AREA */}

                            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 24, alignItems: "start", marginTop: 0 }}>


                              {/* LEFT COLUMN 2 */}
                              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignSelf: "start" }}>



                                <div style={{ background: "#ffffff", borderRadius: 16, padding: 24, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>

                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>

                                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0f1c2e", display: "flex", alignItems: "center", gap: 8 }}>

                                      <i className="ti ti-user-x" style={{ color: "var(--app-accent)" }}></i> Leave Requests

                                      <span style={{ background: "#fff7ed", color: "#ea580c", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800 }}>{pendingLeaves.length} PENDING</span>

                                    </div>

                                    <div style={{ fontSize: 13, fontWeight: 700, color: " var(--app-accent, var(--app-accent, #00BCD4))", cursor: "pointer" }}>

                                      HR Panel

                                    </div>

                                  </div>

                                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                                    {pendingLeaves.map((l, i) => {

                                      const initials = l.employeeName ? l.employeeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "EE";

                                      const colors = ["#f59e0b", "#a855f7", "#0ea5e9", "#ec4899", "#22c55e"];

                                      const bg = colors[i % colors.length];

                                      const getDuration = () => {

                                        if (!l.from || !l.to) return "";

                                        try {

                                          const d1 = new Date(l.from);

                                          const d2 = new Date(l.to);

                                          if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return "";

                                          const diffTime = Math.abs(d2 - d1);

                                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                                          return ` (${diffDays}d)`;

                                        } catch (err) { return ""; }

                                      };

                                      const detail = `${l.type || "Leave"} ${l.from} - ${l.to}${getDuration()}`;



                                      return (

                                        <div key={l._id || i} style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 16, borderBottom: i === pendingLeaves.length - 1 ? "none" : "1px solid rgba(0,0,0,0.04)" }}>

                                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>

                                            {initials}

                                          </div>

                                          <div style={{ flex: 1 }}>

                                            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f1c2e" }}>{l.employeeName}</div>

                                            <div style={{ fontSize: 11, color: "rgba(15,28,46,0.5)" }}>{detail}</div>

                                          </div>

                                          <div style={{ display: "flex", gap: 8 }}>

                                            <button onClick={() => handleApproveLeave(l._id)} style={{ background: "#dcfce7", color: "#166534", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>

                                              <i className="ti ti-check"></i> Approve

                                            </button>

                                            <button onClick={() => handleRejectLeave(l._id)} style={{ background: "#fef2f2", color: "#dc2626", border: "none", padding: "6px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>

                                              <i className="ti ti-x"></i>

                                            </button>

                                          </div>

                                        </div>

                                      );

                                    })}

                                    {pendingLeaves.length === 0 && (

                                      <div style={{ fontSize: 13, color: "rgba(15,28,46,0.5)", textAlign: "center", padding: "10px 0" }}>No pending leave requests.</div>

                                    )}

                                  </div>

                                </div>

                              </div>



                              {/* RIGHT COLUMN 2 */}

                              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>



                                {/* Overdue Tasks */}

                                <div style={{ background: "#ffffff", borderRadius: 16, padding: 24, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>

                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>

                                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0f1c2e", display: "flex", alignItems: "center", gap: 8 }}>

                                      <i className="ti ti-alert-circle" style={{ color: " var(--app-accent, var(--app-accent, #00BCD4))" }}></i> Overdue Tasks

                                      <span style={{ background: "#fef2f2", color: "#dc2626", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800 }}>

                                        {tasks.filter(t => (t.status || "").toLowerCase() !== "completed" && new Date(t.deadline) < new Date()).length}

                                      </span>

                                    </div>

                                    <div onClick={() => { setSidebarOverride("dashboard"); setActive("tasks"); }} style={{ fontSize: 13, fontWeight: 700, color: " var(--app-accent, var(--app-accent, #00BCD4))", cursor: "pointer" }}>

                                      All Tasks

                                    </div>

                                  </div>

                                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                                    {tasks.filter(t => (t.status || "").toLowerCase() !== "completed" && new Date(t.deadline) < new Date()).slice(0, 5).map((t, idx) => (

                                      <div key={t._id} style={{ display: "flex", alignItems: "flex-start", gap: 12, paddingBottom: 16, borderBottom: idx === 4 ? "none" : "1px solid rgba(0,0,0,0.04)" }}>

                                        <input type="checkbox" style={{ marginTop: 2, accentColor: " var(--app-accent, var(--app-accent, #00BCD4))" }} />

                                        <div style={{ flex: 1 }}>

                                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f1c2e", marginBottom: 2 }}>{t.title}</div>

                                          <div style={{ fontSize: 11, color: "rgba(15,28,46,0.5)" }}>{employees.find(e => e._id === t.assignee)?.name || "Unassigned"} Due {t.deadline ? new Date(t.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : "TBA"}</div>

                                        </div>

                                        <div style={{ background: "#fef2f2", color: "#dc2626", padding: "4px 8px", borderRadius: 6, fontSize: 9, fontWeight: 800, letterSpacing: "0.5px" }}>HIGH</div>

                                      </div>

                                    ))}

                                    {tasks.filter(t => (t.status || "").toLowerCase() !== "completed" && new Date(t.deadline) < new Date()).length === 0 && <div style={{ fontSize: 13, color: "rgba(15,28,46,0.5)", padding: "10px 0" }}>No overdue tasks.</div>}

                                  </div>

                                </div>

                                {/* Doc Requests (Dynamic from backend) */}

                                <div style={{ background: "#ffffff", borderRadius: 16, padding: 24, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>

                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>

                                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0f1c2e", display: "flex", alignItems: "center", gap: 8 }}>

                                      <i className="ti ti-file-description" style={{ color: " var(--app-accent, var(--app-accent, #00BCD4))" }}></i> Doc Requests

                                      <span style={{ background: "#fff7ed", color: "#ea580c", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800 }}>{employeeDocs.filter(d => d.status === "PENDING").length} PENDING</span>

                                    </div>

                                    <div style={{ fontSize: 13, fontWeight: 700, color: " var(--app-accent, var(--app-accent, #00BCD4))", cursor: "pointer" }}>

                                      Manage

                                    </div>

                                  </div>

                                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                                    {employeeDocs.map((d, i) => {

                                      const docName = d.docType === "pan" ? "PAN Card" : d.docType === "aadhaar" ? "Aadhaar Card" : d.docType === "passbook" ? "Bank Passbook" : d.docType === "itr" ? "ITR Document" : d.docType;

                                      const styleConfig =

                                        d.docType === "pan" ? { bg: "#f1f5f9", c: "#0ea5e9" } :

                                          d.docType === "passbook" ? { bg: "#f3e8ff", c: "#a855f7" } :

                                            d.docType === "aadhaar" ? { bg: "#dcfce7", c: "#22c55e" } :

                                              { bg: "#fef3c7", c: "#d97706" };



                                      const isPending = d.status === "PENDING";

                                      const statusColor = d.status === "APPROVED" ? "#16a34a" : d.status === "REJECTED" ? "#dc2626" : "#ea580c";



                                      return (

                                        <div key={d._id || i} style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 16, borderBottom: i === employeeDocs.length - 1 ? "none" : "1px solid rgba(0,0,0,0.04)" }}>

                                          <div style={{ width: 32, height: 32, borderRadius: 8, background: styleConfig.bg, color: styleConfig.c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>

                                            <i className="ti ti-file-info"></i>

                                          </div>

                                          <div style={{ flex: 1 }}>

                                            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f1c2e" }}>{docName}</div>

                                            <div style={{ fontSize: 11, color: "rgba(15,28,46,0.5)" }}>{d.employeeName}</div>

                                          </div>

                                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

                                            <a href={d.url} target="_blank" rel="noreferrer" style={{ background: "#f1f5f9", color: "#64748b", padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>

                                              <i className="ti ti-eye"></i> View

                                            </a>

                                            {isPending ? (

                                              <>

                                                <button onClick={() => handleApproveDoc(d._id)} style={{ background: "#dcfce7", color: "#166534", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>

                                                  Approve

                                                </button>

                                                <button onClick={() => handleRejectDoc(d._id)} style={{ background: "#fef2f2", color: "#dc2626", border: "none", padding: "6px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>

                                                  Reject

                                                </button>

                                              </>

                                            ) : (

                                              <div style={{ color: statusColor, fontSize: 10, fontWeight: 800, letterSpacing: "0.5px" }}>{d.status}</div>

                                            )}

                                          </div>

                                        </div>

                                      );

                                    })}

                                    {employeeDocs.length === 0 && (

                                      <div style={{ fontSize: 13, color: "rgba(15,28,46,0.5)", textAlign: "center", padding: "10px 0" }}>No document requests.</div>

                                    )}

                                  </div>

                                </div>

                              </div>

                            </div>

                          </div>

                        );

                      })()}


                    </>)}
                </div>
              </>
            )}



            {/* ── Pages using new components ── */}

            {validActive === "create-project" && (

              <ModernProjectCreator

                key="create"

                clients={clients}

                employees={employees}

                prefillClient={jumpProject?._prefillClient ? clients.find(c => (c.clientName || c.name) === jumpProject._prefillClient) : null}

                onBack={() => {
                  const returnTo = sidebarOverride || "projects";
                  setSidebarOverride(null);
                  setJumpProject(null);
                  setActive(returnTo);
                }}
                onSuccess={async (newProj) => {

                  const saved = newProj?.project || newProj;

                  await fetchProjects();

                  setJumpProject(saved);
                  setFromEditProject(false);
                  setActive("project-details");

                }}

                onAddEmployeeClick={() => {
                  const limit = getSubscriptionLimit("employee", subscription);
                  if (limit !== Infinity && employees.length >= limit) {
                    setLimitModal({ type: "employee", limit });
                    return;
                  }
                  setNeError({}); setModal("employee");
                  fetchSubscription();
                }}

              />

            )}



            {validActive === "edit-project" && jumpProject && (

              <ModernProjectCreator

                key={jumpProject._id || jumpProject.id}

                editProject={jumpProject}

                clients={clients}

                employees={employees}

                onBack={() => { const returnTo = sidebarOverride || "projects"; setSidebarOverride(null); setActive(returnTo); }}

                onSuccess={(updatedProj) => {

                  const saved = updatedProj || jumpProject;

                  const merged = { ...jumpProject, ...saved };

                  setProjects(prev => prev.map(p => (p._id === merged._id ? { ...p, ...merged } : p)));

                  setFromEditProject(true);

                  setSidebarOverride(null);

                  setJumpProject(merged);

                  setActive("project-details");

                }}

              />

            )}

            {validActive === "project-details" && jumpProject && (

              <ModernProjectDetails

                key={jumpProject._id || jumpProject.id}

                project={jumpProject}

                tasks={tasks}

                employees={employees}

                user={user}

                clients={clients}

                fromClientContext={sidebarOverride === "clients"}

                scrollContainerRef={mainScrollRef}

                onAddEmployeeClick={() => {
                  const limit = getSubscriptionLimit("employee", subscription);
                  if (limit !== Infinity && employees.length >= limit) {
                    setLimitModal({ type: "employee", limit });
                    return;
                  }
                  setNeError({}); setModal("employee");
                }}

                autoOpenInvoice={autoOpenInvoice}

                onAutoOpenInvoiceDone={() => setAutoOpenInvoice(false)}
                onAddClient={() => {
                  setNcError({});
                  setShowClientPass(false);
                  setSidebarOverride(null);
                  setActive("addClient");
                }}
                onDelete={async () => {

                  try {

                    await axios.delete(`${BASE_URL}/api/projects/${jumpProject._id}`);

                    fetchProjects();

                    setActive("projects");

                  } catch (e) { console.error(e); }

                }}

                hideTopActions={fromEditProject}

                onBack={() => {
                  setFromEditProject(false);
                  const returnTo = sidebarOverride || "projects";
                  setSidebarOverride(null);
                  setActive(returnTo);
                }}

                onEdit={(updatedProj) => {

                  setFromEditProject(false);

                  setSidebarOpen(false);

                  if (updatedProj) setJumpProject(updatedProj);

                  startNavTransition(() => setActive("edit-project"));

                }}

                onUpdate={async () => { await fetchProjects(); await fetchTasks(); }}

                fetchTasks={fetchTasks}

                fetchProjects={fetchProjects}

                onMessageTeam={() => setActive("messaging")}

                onNewProposal={(proj) => {
                  setSidebarOverride("proposals");
                  setActive("proposals");
                }}

                onNewInvoice={(proj, editInv, editIdx) => {
                  setInvoicePrefill({ client: proj.client || "", project: proj.name || "", _t: Date.now(), ...(editInv ? { editData: editInv, editIndex: editIdx, projectId: proj._id } : {}) });
                  setJumpInvoice(null);
                  setPrevActiveBeforeInvoice(active);
                  setSidebarOverride(active);
                  setActive("invoices");
                }}
                onViewInvoice={(entry) => {
                  setJumpInvoice(entry);
                  setPrevActiveBeforeInvoice(active);
                  setSidebarOverride(active);
                  setActive("invoices");
                }}
                onLogTime={async (hours) => {

                  try {

                    const current = Number(jumpProject?.loggedHours || 0);

                    const updated = current + Number(hours || 0);

                    await axios.put(`${BASE_URL}/api/projects/${jumpProject._id}`, { loggedHours: updated });

                    setJumpProject(prev => ({ ...prev, loggedHours: updated }));

                    fetchProjects();

                  } catch (e) { console.error(e); }

                }}

              />

            )}

            {validActive === "addClient" && <AddClientView onBack={() => setActive("clients")} onClientAdded={(client, replaceTempId) => {
              setClients(prev => {
                if (replaceTempId) {
                  // Server-confirmed client arrived — swap out the optimistic temp record
                  return prev.map(c => c._id === replaceTempId ? client : c);
                }
                // First call: either the optimistic temp client, or (in older flows)
                // the final client directly — append only if it isn't already present.
                if (prev.some(c => c._id === client._id)) return prev;
                return [...prev, client];
              });
              setActive("clients");
            }} user={user} themeColor={getComputedStyle(document.documentElement).getPropertyValue('--app-accent').trim() || accentColor} />}

            {validActive === "clients" && <ClientsPage key={clients.length > 0 ? "loaded" : "empty"} clients={clients} setClients={setClients} projects={projects} setProjects={setProjects} invoices={invoices} tasks={tasks} activeClientIdForReturn={activeClientIdForReturn} onActiveClientIdRestored={() => setActiveClientIdForReturn(null)} newClientId={pendingNewClientId} onNewClientShown={() => setPendingNewClientId(null)} onViewProject={(p) => { setSidebarOverride("clients"); setJumpProject(p); setActive("project-details"); }} onAddClient={() => {

              const limit = getSubscriptionLimit("client");

              setActive("addClient");

            }} triggerCrop={triggerCrop}
              onCreateProject={(proj, isEdit) => {

                setSidebarOverride("clients");

                const activeC = proj?._id
                  ? clients.find(c => c._id === proj._id)
                  : clients.find(c => (c.clientName || c.name) === proj?.client);
                if (activeC) setActiveClientIdForReturn(activeC._id);

                if (isEdit && proj) {

                  setJumpProject({ ...proj, _fromClientPage: true });

                  setSidebarOpen(false);

                  startNavTransition(() => setActive("edit-project"));

                } else {

                  if (activeC) {

                    setJumpProject({

                      _prefillClient: activeC.clientName || activeC.name,

                      _prefillContactName: activeC.contactPersonName || "",

                      _prefillContactNo: activeC.contactPersonNo || "",

                      _prefillEmail: activeC.email || "",

                    });

                  }

                  setActive("create-project");

                }

              }} user={user} />}



            {validActive === "employees" && <EmployeesPage employees={employees} setEmployees={setEmployees} projects={projectsWithProgress} tasks={tasks} setActive={setActive} setJumpProject={setJumpProject} user={user} clients={clients} onAddEmployeeClick={() => {
              const limit = getSubscriptionLimit("employee", subscription);
              if (limit !== Infinity && employees.length >= limit) {
                setLimitModal({ type: "employee", limit });
                return;
              }
              setNeError({}); setModal("employee");
              fetchSubscription();
            }} />}

            {validActive === "managers" && <ManagersPage managers={managers} setManagers={setManagers} />}

            {validActive === "projects" && <ProjectsPage

              onBack={sidebarOverride === "dashboard" ? () => { setSidebarOverride(null); setActive("dashboard"); } : null}

              projects={projects}

              tasks={tasks}

              setProjects={setProjects}

              clients={clients}

              employees={employees}

              jumpProject={jumpProject}

              setJumpProject={setJumpProject}

              config={config}

              onViewTasks={(proj) => {

                if (!proj) return;

                startNavTransition(() => {

                  setSelectedProjectForTasks(proj);

                  setActive("tasks");

                });

              }}

              onViewProject={(proj) => {

                if (!proj) return;

                startNavTransition(() => {

                  setJumpProject(proj);

                  setActive("project-details");

                });

              }}

              user={user}

              fetchTasks={fetchTasks}

              onCreateProject={() => { setSidebarOverride("clients"); setActive("create-project"); }}

              onEditProject={(p) => {

                setSidebarOpen(false);

                setJumpProject(p);

                startNavTransition(() => setActive("edit-project"));

              }}

              setActive={setActive}

              setInvoicePrefill={setInvoicePrefill}

              setJumpInvoice={setJumpInvoice}

              fetchProjects={fetchProjects}

              setPrevActiveBeforeInvoice={setPrevActiveBeforeInvoice}

              onAddEmployee={() => {

                const limit = getSubscriptionLimit("employee");

                if (subscription && employees.length >= limit) {

                  setLimitModal({ type: "employee", limit });

                  return;

                }

                setReturnToModal(null); setModal("employee");

              }}

            />}



            {validActive === "subadmins" && <SubadminsPage subadmins={subadmins} setSubadmins={setSubadmins} employees={employees} managers={managers} quotations={quotations} />}



            {validActive === "invoices" && <InvoiceCreator user={user} clients={clients} projects={projects} companyLogo={companyLogo} companyName={companyNameStr} onLogoChange={onLogoChange} onBack={sidebarOverride ? () => { setSidebarOverride(null); setActive(prevActiveBeforeInvoice || "dashboard"); } : undefined} jumpInvoice={jumpInvoice} newInvoicePrefill={invoicePrefill} onAddClient={() => {

              const limit = getSubscriptionLimit("client");

              if (subscription && clients.length >= limit) {

                setLimitModal({ type: "client", limit });

                return;

              }

              setReturnToModal(modal); setModal("client");

            }} onAddProject={() => { setReturnToModal(modal); setModal("project"); }} />}

            {validActive === "quotations" && <QuotationCreatorModern user={user} clients={clients} projects={projects} companyLogo={companyLogo} companyName={companyNameStr} onLogoChange={onLogoChange} onAddClient={() => {

              const limit = getSubscriptionLimit("client");

              if (subscription && clients.length >= limit) {

                setLimitModal({ type: "client", limit });

                return;

              }

              setReturnToModal(modal); setModal("client");

            }} onAddProject={() => { setReturnToModal(modal); setModal("project"); }} />}

            {validActive === "proposals" && <ProjectProposalCreator clients={clients} companyLogo={companyLogo} companyName={companyNameStr} />}

            {validActive === "tracking" && <ProjectStatusPage clients={clients} employees={employees} managers={managers} config={config} />}

            {validActive === "tasks" && <TaskPage projects={projects} employees={employees} onUpdate={() => fetchTasks()} config={config} user={user} selectedProjectId={selectedProjectForTasks?._id || null} selectedProjectName={selectedProjectForTasks?.name || null} onClearProjectFilter={() => setSelectedProjectForTasks(null)} onSelectProject={(p) => setSelectedProjectForTasks(p)} autoOpenAddModal={autoOpenTaskModal} onAddModalOpened={(val) => setAutoOpenTaskModal(!!val)} />}

            {validActive === "calendar" && <CalendarPage projects={projects} tasks={tasks} clients={clients} companyId={companyId} user={user} onUpdateProject={() => fetchProjects()} onUpdateTask={() => fetchTasks()} config={config} THEME={currentTheme} />}

            {validActive === "messaging" && <MessagingPage user={user} />}

            {validActive === "settings" && (
              <SettingsPage
                user={user}
                appTheme={appTheme}
                setAppTheme={setAppTheme}
                themes={THEMES}
                customColor={customColor}
                setCustomColor={setCustomColor}
                onLogoChange={onLogoChange}
                triggerCrop={triggerCrop}
                onProfileUpdate={(updatedUser) => setUser(updatedUser)}
                THEME={currentTheme}
              />
            )}


            {validActive === "accounts" && <AccountsPage onBack={() => setActive("dashboard")} THEME={currentTheme} initialTab="overview" income={income} setIncome={setIncome} fetchIncome={fetchIncome} expenses={expenses} setExpenses={setExpenses} fetchExpenses={fetchExpenses} />}

            {validActive === "payments" && <AccountsPage THEME={currentTheme} initialTab="income" income={income} setIncome={setIncome} fetchIncome={fetchIncome} expenses={expenses} setExpenses={setExpenses} fetchExpenses={fetchExpenses} />}

            {validActive === "expenses" && <AccountsPage THEME={currentTheme} initialTab="expenses" income={income} setIncome={setIncome} fetchIncome={fetchIncome} expenses={expenses} setExpenses={setExpenses} fetchExpenses={fetchExpenses} />}

            {validActive === "interviews" && <InterviewPage companyId={companyId} companyName={companyNameStr} />}

            {validActive === "documents" && <SubAdminDocumentsPage employees={employees} />}

            {validActive === "templates" && (

              <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>

                <iframe

                  id="template-designer-frame"

                  src={`/template-designer.html?v=2`}

                  style={{ width: "100%", height: "100%", border: "none", flex: 1 }}

                  title="Template Designer"

                  onLoad={(e) => {

                    const frame = e.target.contentWindow;

                    frame.postMessage({

                      type: 'SET_DATA',

                      clients: clients.map(c => c.clientName || c.name),

                      employees: employees.map(emp => ({ name: emp.name, id: emp._id || emp.id })),

                      quotations: quotations,

                      company: {

                        name: user?.companyName || "",

                        logoUrl: user?.logoUrl || "",

                        email: user?.email || "",

                        phone: user?.phone || "",

                      }

                    }, '*');

                    frame.postMessage({ type: 'SET_THEME', color: currentTheme.accent }, '*');

                  }}

                />

              </div>

            )}



            {validActive === "letterhead" && (

              <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", background: "#F5FAFA" }}>

                <iframe

                  key="letterhead-frame"

                  id="letterhead-frame"

                  src={`/template-designer.html?v=1#lh`}

                  style={{ width: "100%", height: "100%", border: "none", flex: 1, display: "block" }}

                  title="Letterhead Designer"

                  onLoad={(e) => {

                    const frame = e.target.contentWindow;

                    // Small delay to ensure iframe is fully ready

                    setTimeout(() => {

                      frame.postMessage({

                        type: 'SET_DATA',

                        clients: clients.map(c => ({ name: c.clientName || c.name, id: c._id || c.id })),

                        employees: employees.map(emp => ({ name: emp.name, id: emp._id || emp.id })),

                        company: {

                          name: user?.companyName || "",

                          logoUrl: user?.logoUrl || "",

                          email: user?.email || "",

                          phone: user?.phone || "",

                        }

                      }, '*');

                      frame.postMessage({ type: 'SET_THEME', color: currentTheme.accent }, '*');

                    }, 300);

                  }}

                />

              </div>

            )}



            {validActive === "mysubscriptions" && <MySubscriptions user={user} onSubscriptionSuccess={async () => { await fetchSubscription(); setForceUpgradeTab(false); setActive("dashboard"); }} initialTab={forceUpgradeTab || enforceMySubscriptions ? "upgrade" : "overview"} preloadedSubscription={subscription} onTabChange={() => setForceUpgradeTab(false)} packagesList={packages} />}

            {validActive === "reports" && <ReportsPage THEME={currentTheme} clients={clients} projects={projects} employees={employees} managers={managers} income={income} expenses={expenses} />}

            {validActive === "packages" && <PackagesPage packages={packages} onViewPackage={handleViewPackage} onEditPackage={(user?.role !== "subadmin" && user?.role !== "sub_admin" && user?.role !== "sub-admin") ? handleEditPackage : undefined} onSubscribe={() => setActive("mysubscriptions")} THEME={currentTheme} />}

            {validActive === "vendors" && <VendorsPage vendors={vendors} setVendors={setVendors} onAddVendorClick={() => { setNvError({}); setModal("vendor_add"); }} />}

            {validActive === "rolePermissions" && <RolePermissionDashboard />}

            {profileDropdownOpen && (

              <div

                data-profile-menu="true"

                style={{

                  position: "fixed",

                  top: "72px",

                  right: "16px",

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

                <div style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg,var(--app-bg),var(--app-bg))" }}>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

                    {companyLogo ? (

                      <img src={companyLogo} alt="logo" style={{ height: 38, width: "auto", maxWidth: "100px", objectFit: "contain", flexShrink: 0, background: "#fff", display: "block", borderRadius: 10, border: "1px solid #f1f5f9" }} />

                    ) : (

                      <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>{initials}</div>

                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>

                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>

                      <div style={{ fontSize: 11, color: "var(--app-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>

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

                          onMouseEnter={e => e.currentTarget.style.background = "var(--app-bg)"}

                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}

                        >

                          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>

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

                    onMouseEnter={e => e.currentTarget.style.background = "var(--app-bg)"}

                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}

                  >

                    <span style={{ fontSize: 14 }}>👤</span>Profile

                  </button>

                  {(isAdmin ||

                    user?.businessLimit?.toLowerCase().includes("multiple") ||

                    user?.businessLimit?.toLowerCase().includes("unlimited") ||

                    subscription?.businessLimit?.toLowerCase().includes("multiple") ||

                    subscription?.businessLimit?.toLowerCase().includes("unlimited") ||

                    subscription?.features?.some(f => f.toLowerCase().includes("multiple")) ||

                    packages.some(p => p.assignedSubadmins?.includes(user?.id || user?._id) &&

                      (p.businessLimit?.toLowerCase().includes("multiple") ||

                        p.features?.some(f => f.toLowerCase().includes("multiple"))))

                  ) && (

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

                        onMouseEnter={e => (e.currentTarget.style.background = "var(--app-bg)")}

                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}

                      >

                        <span style={{ fontSize: 14 }}>➕</span> Add Account

                      </button>

                    )}

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

                    <span style={{ fontSize: 14 }}>🚪</span> Logout            </button>

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



            {showProfile && <ProfileModal

              user={user}

              setUser={setUser}

              onClose={() => setShowProfile(false)}

              onLogout={handleLogout}

              companyLogo={companyLogo}

              onLogoChange={onLogoChange}

              paymentHistory={paymentHistory}

              projects={projects}

              invoices={invoices}

              onLogoUpload={handleHeaderLogoUpload}

            />}





            {/* ── Add Client Modal ── */}

            {limitModal && <LimitReachedModal type={limitModal.type} limit={limitModal.limit} onClose={() => setLimitModal(null)} onUpgrade={() => { setLimitModal(null); setForceUpgradeTab(true); setActive("mysubscriptions"); }} />}

            {modal === "client" && <Mdl title={clientSuccessData ? "Yes Client Added Successfully" : "Add New Client"} onClose={() => { setModal(null); setClientSuccessData(null); }} maxWidth={clientSuccessData ? 460 : 780}>

              {clientSuccessData ? (

                <div style={{ textAlign: "center", padding: "5px 0" }}>

                  <div style={{ width: 54, height: 54, background: "linear-gradient(135deg,#dcfce7,#bbf7d0)", color: "#16a34a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 14px", boxShadow: "0 6px 15px rgba(22,163,74,0.12)" }}>✓</div>

                  <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 8 }}>Registration Successful!</h3>

                  <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16, lineHeight: 1.4, maxWidth: 340, margin: "0 auto 16px" }}>

                    The client account for <strong style={{ color: T.primary }}>{clientSuccessData.name}</strong> has been created.

                    Share these credentials securely.

                  </p>



                  <div style={{ background: "linear-gradient(135deg,#f8fafc,#f1f5f9)", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "16px", marginBottom: 20, textAlign: "left", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.02)" }}>

                    <div style={{ marginBottom: 12 }}>

                      <div style={{ fontSize: 9, color: "#64748b", fontWeight: 800, textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.8 }}>LOGIN EMAIL</div>

                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text, background: "#fff", padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>{clientSuccessData.email}</div>

                    </div>

                    <div>

                      <div style={{ fontSize: 9, color: "#64748b", fontWeight: 800, textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.8 }}>TEMPORARY PASSWORD</div>

                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--app-muted)", background: "#fff", padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontFamily: "monospace" }}>{clientSuccessData.password || "Not set (optional)"}</div>

                    </div>

                  </div>



                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                    <button

                      onClick={() => {

                        const text = `Hi ${clientSuccessData.name},\n\nYour client account has been created successfully!\n\n*Login Credentials*\nEmail: ${clientSuccessData.email}\nPassword: ${clientSuccessData.password || "Not set"}\n\nLogin URL: ${window.location.origin}\n\nPlease change your password after your first login.`;

                        navigator.clipboard.writeText(text);

                        toast.success("📋 Credentials copied!");

                      }}

                      style={{ width: "100%", background: "var(--app-accent-gradient)", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, boxShadow: "0 6px 15px rgba(var(--app-accent-rgb),0.2)", transition: "all 0.2s" }}

                    >

                      📋 Copy Login Details

                    </button>



                    <button

                      onClick={() => {

                        const text = `Hi ${clientSuccessData.name},\n\nYour client account has been created successfully!\n\n*Login Credentials*\nEmail: ${clientSuccessData.email}\nPassword: ${clientSuccessData.password || "Not set"}\n\nLogin URL: ${window.location.origin}`;

                        const wpUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

                        window.open(wpUrl, "_blank");

                      }}

                      style={{ width: "100%", background: "#25D366", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, boxShadow: "0 6px 15px rgba(37,211,102,0.2)" }}

                    >

                      <span style={{ fontSize: 16 }}>💬</span> Share via WhatsApp

                    </button>



                    <button

                      onClick={() => { setModal(null); setClientSuccessData(null); }}

                      style={{ width: "100%", background: "transparent", border: "1.2px solid var(--app-border)", color: "#64748b", borderRadius: 10, padding: "10px", fontWeight: 700, cursor: "pointer", fontSize: 12, marginTop: 6 }}

                    >

                      Close

                    </button>

                  </div>

                </div>

              ) : (

                <>

                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>

                    <div

                      onClick={() => {

                        const input = document.createElement('input');

                        input.type = 'file';

                        input.accept = 'image/*';

                        input.onchange = (e) => triggerCrop(e, (croppedImage) => setNc(p => ({ ...p, logoUrl: croppedImage })), 1);

                        input.click();

                      }}

                      style={{

                        position: "relative",

                        cursor: "pointer",

                        width: "auto",

                        height: "auto",

                        maxWidth: "100%",

                        display: "flex",

                        flexDirection: "column",

                        alignItems: "center"

                      }}

                    >

                      <div style={{

                        padding: nc.logoUrl ? 4 : 24,

                        borderRadius: 20,

                        background: "#fff",

                        border: "2.5px dashed var(--app-border)",

                        display: "flex",

                        alignItems: "center",

                        justifyContent: "center",

                        minWidth: 100,

                        minHeight: 100,

                        overflow: "hidden",

                        boxShadow: "0 8px 20px rgba(0,0,0,0.05)",

                        transition: "all 0.3s ease"

                      }}>

                        {nc.logoUrl ? (

                          <img

                            src={nc.logoUrl}

                            alt="Logo"

                            style={{

                              width: "auto",

                              height: "auto",

                              maxWidth: "240px",

                              maxHeight: "120px",

                              objectFit: "contain",

                              display: "block",

                              borderRadius: 12

                            }}

                          />

                        ) : (
                          <div style={{
                            padding: nc.logoUrl ? 4 : 24,
                            borderRadius: 20,
                            background: "#fff",
                            border: "2.5px dashed var(--app-border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: 100,
                            minHeight: 100,
                            overflow: "hidden",
                            boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
                            transition: "all 0.3s ease"
                          }}>
                            {nc.logoUrl ? (
                              <img
                                src={nc.logoUrl}
                                alt="Logo"
                                style={{
                                  width: "auto",
                                  height: "auto",
                                  maxWidth: "240px",
                                  maxHeight: "120px",
                                  objectFit: "contain",
                                  display: "block",
                                  borderRadius: 12
                                }}
                              />
                            ) : (
                              <div style={{ textAlign: "center" }}>
                                <div style={{
                                  width: 60,
                                  height: 60,
                                  borderRadius: 14,
                                  background: " var(--app-accent, var(--app-accent, #00BCD4))",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  margin: "0 auto 10px"
                                }}>
                                  📷
                                </div>
                                <div style={{ fontSize: 10, fontWeight: 800, color: "#607D86", textTransform: "uppercase", letterSpacing: 1 }}>Upload Logo</div>
                              </div>)}
                          </div>

                        )}

                      </div>

                      <div style={{

                        position: "absolute", bottom: -10, right: -10,

                        width: 36, height: 36, borderRadius: "50%",

                        background: "var(--app-accent)", color: "#fff",

                        display: "flex", alignItems: "center", justifyContent: "center",

                        fontSize: 16, boxShadow: "0 4px 12px rgba(var(--app-accent-rgb, 124, 58, 237), 0.4)",

                        border: "3px solid #fff"

                      }}>📷</div>

                    </div>

                  </div>

                  {/* ── CLIENT TYPE ── */}

                  <div style={{ marginBottom: 16 }}>

                    <div style={{ fontSize: 11, fontWeight: 700, color: '#5A6A7A', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Client Type <span style={{ color: '#EF5350' }}>*</span></div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>

                      {[{ val: 'b2b', icon: '🏢', label: 'B2B', sub: 'Company / Business' }, { val: 'b2c', icon: '👤', label: 'B2C', sub: 'Individual person' }, { val: 'freelancer', icon: '💼', label: 'Freelancer', sub: 'Consultant / Solo' }].map(t => (

                        <div key={t.val} onClick={() => setNc(p => ({ ...p, clientType: t.val }))}

                          style={{ border: `2px solid ${nc.clientType === t.val ? ' var(--app-accent, var(--app-accent, #00BCD4))' : '#E0E6EA'}`, borderRadius: 10, padding: '12px 8px', textAlign: 'center', cursor: 'pointer', background: nc.clientType === t.val ? 'var(--teal-light, var(--teal-light, #E0F7FA))' : '#F4F6F8', transition: 'all .15s', position: 'relative' }}>

                          {nc.clientType === t.val && <span style={{ position: 'absolute', top: 6, right: 6, width: 14, height: 14, borderRadius: '50%', background: ' var(--app-accent, var(--app-accent, #00BCD4))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}></span>}

                          <div style={{ fontSize: 22, marginBottom: 4 }}>{t.icon}</div>

                          <div style={{ fontSize: 12, fontWeight: 700, color: nc.clientType === t.val ? '#007B8A' : '#1A2332' }}>{t.label}</div>

                          <div style={{ fontSize: 10, color: '#94A3B0', marginTop: 2 }}>{t.sub}</div>

                        </div>
                      ))}

                    </div>

                  </div>



                  {/* ── BASIC INFO ── */}

                  <div style={{ background: '#F4F6F8', borderRadius: 12, border: '1px solid #E0E6EA', padding: '14px 16px', marginBottom: 14 }}>

                    <div style={{ fontSize: 11, fontWeight: 700, color: ' var(--app-accent, var(--app-accent, #00BCD4))', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ background: ' var(--app-accent, var(--app-accent, #00BCD4))', borderRadius: 8, width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><i className="ti ti-building" style={{ color: '#fff', fontSize: 16 }}></i></span> Basic Info</div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 18px' }}>

                      <Fld label="Client / Display Name *" value={nc.name} onChange={v => { setNc({ ...nc, name: v }); setNcError(p => ({ ...p, name: '' })); }} error={ncError.name} />

                      <Fld label="Company Name" value={nc.company} onChange={v => setNc({ ...nc, company: v })} />

                      <Fld label="Category / Industry" value={nc.category} onChange={v => { setNc({ ...nc, category: v }); saveCustomCategory(v); }} options={['', 'Web Development', 'Mobile App Development', 'UI/UX Design', 'Digital Marketing', 'IT Consulting', 'E-commerce', 'Healthcare', 'Education', 'Finance', 'Real Estate', 'Manufacturing', 'Retail', 'Logistics', 'Media & Entertainment', ...customCategories]} allowCustom={true} />

                      <Fld label="Company Tax / GST No." value={nc.gstNumber} onChange={v => setNc({ ...nc, gstNumber: v })} />

                      <Fld label="Client Source" value={nc.source} onChange={v => setNc({ ...nc, source: v })} options={['', 'Referral', 'Website / Organic', 'Social Media', 'Cold Outreach', 'LinkedIn', 'Event / Conference', 'Google Ads', 'Word of Mouth']} allowCustom={true} />

                      <Fld label="Onboarded On" value={nc.onboardedOn} onChange={v => setNc({ ...nc, onboardedOn: v })} type="date" disabled={true} />

                      <Fld label="Status" value={nc.status} onChange={v => setNc({ ...nc, status: v })} options={['Active', 'Inactive']} />

                    </div>

                  </div>



                  {/* ── PRIMARY CONTACT ── */}

                  <div style={{ background: '#F4F6F8', borderRadius: 12, border: '1px solid #E0E6EA', padding: '14px 16px', marginBottom: 14 }}>

                    <div style={{ fontSize: 11, fontWeight: 700, color: ' var(--app-accent, var(--app-accent, #00BCD4))', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ background: ' var(--app-accent, var(--app-accent, #00BCD4))', borderRadius: 8, width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><i className="ti ti-phone-call" style={{ color: '#fff', fontSize: 16 }}></i></span> Primary Contact</div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 18px' }}>

                      <Fld label="Contact Person Name" value={nc.contactPersonName} onChange={v => setNc({ ...nc, contactPersonName: v })} />

                      <Fld label="Designation" value={nc.designation || ''} onChange={v => setNc({ ...nc, designation: v })} />

                      <Fld label="Email *" value={nc.email} onChange={v => { setNc({ ...nc, email: v }); setNcError(p => ({ ...p, email: '' })); }} type="email" error={ncError.email} />

                      <Fld label="Alt. Email" value={nc.altEmail || ''} onChange={v => setNc({ ...nc, altEmail: v })} type="email" />

                      <Fld label="Contact Person Mobile" value={nc.contactPersonNo} onChange={v => setNc({ ...nc, contactPersonNo: v })} />

                      <Fld label="Office Phone" value={nc.phone} onChange={v => setNc({ ...nc, phone: v })} />

                    </div>

                  </div>



                  {/* ── ADDRESS ── */}

                  <div style={{ background: '#F4F6F8', borderRadius: 12, border: '1px solid #E0E6EA', padding: '14px 16px', marginBottom: 14 }}>

                    <div style={{ fontSize: 11, fontWeight: 700, color: ' var(--app-accent, var(--app-accent, #00BCD4))', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ background: ' var(--app-accent, var(--app-accent, #00BCD4))', borderRadius: 8, width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><i className="ti ti-map-pin" style={{ color: '#fff', fontSize: 16 }}></i></span> Address</div>

                    <div style={{ marginBottom: 12 }}><Fld label="Street / Building Address" value={nc.address} onChange={v => setNc({ ...nc, address: v })} /></div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 18px' }}>

                      <Fld label="City" value={nc.city} onChange={v => setNc({ ...nc, city: v })} />

                      <Fld label="State / Province" value={nc.state} onChange={v => setNc({ ...nc, state: v })} />

                      <Fld label="Pincode / ZIP" value={nc.pincode} onChange={v => setNc({ ...nc, pincode: v })} />

                      <Fld label="Country" value={nc.country} onChange={v => setNc({ ...nc, country: v })} options={['India', 'United States', 'United Kingdom', 'United Arab Emirates', 'Singapore', 'Australia', 'Canada', 'Germany', 'France']} allowCustom={true} />

                    </div>

                  </div>


                  {/* ── ONLINE PRESENCE ── */}

                  {/* ── ONLINE PRESENCE ── */}
                  <div style={{ background: '#F4F6F8', borderRadius: 12, border: '1px solid #E0E6EA', padding: '14px 16px', marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: ' var(--app-accent, var(--app-accent, #00BCD4))', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: ' var(--app-accent, var(--app-accent, #00BCD4))', borderRadius: 8, width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ti ti-link" style={{ color: '#fff', fontSize: 16 }}></i>
                      </span>
                      Online Presence
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 18px' }}>
                      <Fld label="Website URL" value={nc.website} onChange={v => setNc({ ...nc, website: v })} />
                      <Fld label="LinkedIn Profile" value={nc.linkedin} onChange={v => setNc({ ...nc, linkedin: v })} />
                    </div>
                  </div>



                  {/* ── BILLING & TERMS ── */}

                  <div style={{ background: '#F4F6F8', borderRadius: 12, border: '1px solid #E0E6EA', padding: '14px 16px', marginBottom: 14 }}>

                    <div style={{ fontSize: 11, fontWeight: 700, color: ' var(--app-accent, var(--app-accent, #00BCD4))', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ background: ' var(--app-accent, var(--app-accent, #00BCD4))', borderRadius: 8, width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><i className="ti ti-credit-card" style={{ color: '#fff', fontSize: 16 }}></i></span> Billing & Terms</div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 18px' }}>

                      <Fld label="Billing Currency" value={nc.billingCurrency} onChange={v => { setNc({ ...nc, billingCurrency: v }); saveCustomCurrency(v); }} options={['INR — Indian Rupee', 'USD — US Dollar', 'GBP — British Pound', 'EUR — Euro', 'AED — UAE Dirham', 'SGD — Singapore Dollar', 'AUD — Australian Dollar', ...customCurrencies]} allowCustom={true} />

                      <Fld label="Payment Terms" value={nc.paymentTerms} onChange={v => setNc({ ...nc, paymentTerms: v })} options={['', 'Due on receipt', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', '50% Advance + 50% on delivery']} allowCustom={true} />

                      <Fld label="Credit Limit" value={nc.creditLimit} onChange={v => setNc({ ...nc, creditLimit: v })} type="number" />

                      <Fld label="Preferred Payment Mode" value={nc.preferredPaymentMode} onChange={v => setNc({ ...nc, preferredPaymentMode: v })} options={['', 'Bank Transfer / NEFT', 'UPI', 'Cheque', 'Credit Card', 'Cash', 'PayPal', 'Stripe']} allowCustom={true} />

                    </div>

                  </div>



                  {/* ── PORTAL ACCESS ── */}

                  <div style={{ background: '#F4F6F8', borderRadius: 12, border: '1px solid #E0E6EA', padding: '14px 16px', marginBottom: 14 }}>

                    <div style={{ fontSize: 11, fontWeight: 700, color: ' var(--app-accent, var(--app-accent, #00BCD4))', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>Search Portal Access</div>

                    <div style={{ position: 'relative', marginBottom: 4 }}>

                      <input type={showClientPass ? 'text' : 'password'} value={nc.password} onChange={e => setNc({ ...nc, password: e.target.value })}

                        style={{ width: '100%', border: `1.5px solid ${ncError.password ? '#EF4444' : 'var(--app-border)'}`, borderRadius: 10, padding: '10px 46px 10px 14px', fontSize: 13, color: T.text, background: 'var(--app-bg)', boxSizing: 'border-box', outline: 'none' }}

                        placeholder="Set client portal password *" />

                      <button type="button" onClick={() => setShowClientPass(!showClientPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--app-muted)', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>{showClientPass ? 'HIDE' : 'SHOW'}</button>

                    </div>

                    {ncError.password && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>Warning {ncError.password}</div>}

                  </div>



                  {/* ── INTERNAL NOTES ── */}

                  <div style={{ background: '#F4F6F8', borderRadius: 12, border: '1px solid #E0E6EA', padding: '14px 16px', marginBottom: 14 }}>

                    <div style={{ fontSize: 11, fontWeight: 700, color: ' var(--app-accent, var(--app-accent, #00BCD4))', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ background: ' var(--app-accent, var(--app-accent, #00BCD4))', borderRadius: 8, width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><i className="ti ti-notes" style={{ color: '#fff', fontSize: 16 }}></i></span> Internal Notes</div>

                    <textarea value={nc.notes} onChange={e => setNc({ ...nc, notes: e.target.value })}

                      style={{ width: '100%', border: '1.5px solid #E0E6EA', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: T.text, background: '#fff', boxSizing: 'border-box', outline: 'none', minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }}

                      placeholder="Any internal context, special instructions, or notes..." />

                  </div>



                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>

                    <button onClick={() => setModal(null)} style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>

                    <button onClick={addClient} disabled={saveLoading} style={{ ...B("var(--app-accent)"), opacity: saveLoading ? 0.7 : 1 }}>{saveLoading ? "Saving..." : "Add Client"}</button>

                  </div>

                </>

              )}

            </Mdl>}



            {/* ── Add Employee Modal ── */}

            {modal === "employee" && <Mdl title="Add New Employee" onClose={() => setModal(null)}>

              <div className="modal-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>

                <Fld label="Full Name *" value={ne.name} onChange={v => setNe({ ...ne, name: v })} error={neError.name} />

                <Fld label="Email *" value={ne.email} onChange={v => { setNe({ ...ne, email: v }); setNeError(p => ({ ...p, email: "" })); }} type="email" error={neError.email} />

                <Fld label="Phone Number" value={ne.phone} onChange={v => setNe({ ...ne, phone: v })} />

                <Fld label="Role / Position" value={ne.role} onChange={v => setNe({ ...ne, role: v })} options={DEPARTMENT_OPTIONS} />

                <Fld label="Department" value={ne.department} onChange={v => setNe({ ...ne, department: v })} />

                <Fld label="Salary" value={ne.salary} onChange={v => setNe({ ...ne, salary: v })} />

                <Fld label="Date of Birth" value={ne.dateOfBirth} onChange={v => setNe({ ...ne, dateOfBirth: v })} type="date" />

                <Fld label="Joining Date" value={ne.joiningDate} onChange={v => setNe({ ...ne, joiningDate: v })} type="date" />

                <Fld label="Marital Status" value={ne.maritalStatus} onChange={v => setNe({ ...ne, maritalStatus: v })} options={["Unmarried", "Married"]} />

                <Fld label="Status" value={ne.status} onChange={v => setNe({ ...ne, status: v })} options={["Active", "Inactive", "On Leave"]} />

              </div>

              <Fld label="Address" value={ne.address} onChange={v => setNe({ ...ne, address: v })} />



              <div style={{ marginTop: 14 }}>

                <div style={{ fontSize: 11, color: "var(--app-sidebar)", fontWeight: 800, marginBottom: 10 }}>🏦 BANK DETAILS</div>

                <div className="modal-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>

                  <Fld label="Bank Name" value={ne.bankName} onChange={v => setNe({ ...ne, bankName: v })} />

                  <Fld label="IFSC Code" value={ne.ifscCode} onChange={v => setNe({ ...ne, ifscCode: v })} />

                  <Fld label="Account Number" value={ne.accountNumber} onChange={v => setNe({ ...ne, accountNumber: v })} />

                  <Fld label="Branch Name" value={ne.branchName} onChange={v => setNe({ ...ne, branchName: v })} />

                </div>

              </div>

              <div className="modal-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 11, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>PASSWORD *</label>
                  <div style={{ position: "relative" }}>
                    <input type={showEmpPass ? "text" : "password"} value={ne.password} onChange={e => { setNe({ ...ne, password: e.target.value }); setNeError(p => ({ ...p, password: "" })); }} style={{ width: "100%", border: `1.5px solid ${neError.password ? "#EF4444" : "var(--app-border)"}`, borderRadius: 10, padding: "10px 46px 10px 14px", fontSize: 13, color: T.text, background: "var(--app-bg)", boxSizing: "border-box", outline: "none" }} placeholder="Set employee login password" />
                    <button type="button" onClick={() => setShowEmpPass(!showEmpPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--app-muted)", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>{showEmpPass ? "HIDE" : "SHOW"}</button>
                  </div>
                  {neError.password && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>Warning {neError.password}</div>}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 11, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>CONFIRM PASSWORD *</label>
                  <div style={{ position: "relative" }}>
                    <input type={showEmpConfirmPass ? "text" : "password"} value={ne.confirmPassword || ""} onChange={e => { setNe({ ...ne, confirmPassword: e.target.value }); setNeError(p => ({ ...p, confirmPassword: "" })); }} style={{ width: "100%", border: `1.5px solid ${neError.confirmPassword ? "#EF4444" : "var(--app-border)"}`, borderRadius: 10, padding: "10px 46px 10px 14px", fontSize: 13, color: T.text, background: "var(--app-bg)", boxSizing: "border-box", outline: "none" }} placeholder="Re-enter password" />
                    <button type="button" onClick={() => setShowEmpConfirmPass(!showEmpConfirmPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--app-muted)", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>{showEmpConfirmPass ? "HIDE" : "SHOW"}</button>
                  </div>
                  {neError.confirmPassword && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>Warning {neError.confirmPassword}</div>}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6, flexWrap: "wrap" }}>


                <button onClick={addEmployee} disabled={empSaveLoading} style={{ ...B("var(--app-accent)"), opacity: empSaveLoading ? 0.7 : 1 }}>{empSaveLoading ? "Saving..." : "Add Employee"}</button>

              </div>

            </Mdl>}



            {/* ── Add Project Modal ── */}
            {modal === "project" && <Mdl title="Create New Project" onClose={() => { setModal(null); setPrefillClient(null); }}>
              <div className="modal-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
                <Fld label="Project Name *" value={np.name} onChange={v => { setNp({ ...np, name: v }); setNpError(p => ({ ...p, name: "" })); }} error={npError.name} />
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 11, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>CLIENT *</label>
                  {(prefillClient || (editProject && editProject._fromClientPage)) ? (
                    <div style={{ border: "1.5px solid var(--app-border)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--app-text, #333)", background: "var(--app-bg)", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>👤</span>
                      <span>{np.client}</span>
                      <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--app-accent)", background: "rgba(124,58,237,0.08)", borderRadius: 6, padding: "2px 8px", fontWeight: 700 }}>Auto-filled</span>
                    </div>
                  ) : (
                    <ClientDropdown
                      clients={clients}
                      value={np.client}
                      onChange={v => {
                        const sel = clients.find(c => (c.clientName || c.name) === v);
                        setNp({
                          ...np,
                          client: v,
                          clientId: sel?._id || sel?.id || "",
                          companyName: sel?.companyName || sel?.company || np.companyName,
                          phone: sel?.phone || np.phone,
                          address: sel?.address || np.address,
                          contactPersonName: sel?.contactPersonName || np.contactPersonName,
                          contactPersonNo: sel?.contactPersonNo || np.contactPersonNo,
                          contactEmail: sel?.email || np.contactEmail,
                        });
                        setNpError(p => ({ ...p, client: "" }));
                      }}
                      error={npError.client}
                      onAddClient={() => { setModal("client"); setNcError({}); setShowClientPass(false); }}
                    />
                  )}
                  {npError.client && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>Warning {npError.client}</div>}
                </div>

                <Fld label="Contact Person Name" value={np.contactPersonName} onChange={v => setNp({ ...np, contactPersonName: v })} />

                <Fld label="Purpose" value={np.purpose} onChange={v => setNp({ ...np, purpose: v })} />
                <Fld label="Company Name" value={np.companyName} onChange={v => setNp({ ...np, companyName: v })} />
                <Fld label="Contact Person Name" value={np.contactPersonName} onChange={v => setNp({ ...np, contactPersonName: v })} />
                <Fld label="Contact Person No" value={np.contactPersonNo} onChange={v => setNp({ ...np, contactPersonNo: v })} />
                <Fld label="Contact Email" value={np.contactEmail} onChange={v => setNp({ ...np, contactEmail: v })} />
                <Fld label="Phone" value={np.phone} onChange={v => setNp({ ...np, phone: v })} />
                <Fld label="Address" value={np.address} onChange={v => setNp({ ...np, address: v })} />
                <div style={{ marginBottom: 14 }}>

                  <label style={{ display: "block", fontSize: 11, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>BUDGET</label>

                  <div style={{ display: "flex", gap: 8 }}>

                    <select

                      value={np.currency}

                      onChange={e => setNp({ ...np, currency: e.target.value })}

                      style={{ width: 80, border: "1.5px solid var(--app-border)", borderRadius: 10, padding: "10px", fontSize: 13, color: T.text, background: "var(--app-bg)", outline: "none" }}

                    >

                      {["Rs.", "$", "‚¬", "£", "¥", "AED", "SAR", "QAR", "CAD", "AUD", "SGD", "KWD", "BHD", "OMR"].map(c => <option key={c} value={c}>{c}</option>)}

                    </select>

                    <input

                      type="text"

                      value={np.budget}

                      onChange={e => { const val = e.target.value; if (val && !/^[\d.]*$/.test(val)) return; setNp({ ...np, budget: val }); }}

                      style={{ flex: 1, border: "1.5px solid var(--app-border)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: T.text, background: "var(--app-bg)", outline: "none" }}

                      placeholder="0.00"

                    />

                  </div>

                </div>

                <Fld label="Start Date" value={np.start} onChange={v => setNp({ ...np, start: v })} type="date" />

                <Fld label="End Date" value={np.end} onChange={v => setNp({ ...np, end: v })} type="date" />

                <Fld label="Team Members" value={np.team} onChange={v => setNp({ ...np, team: v })} />

                <Fld

                  label="Status"

                  value={np.status}

                  onChange={v => {

                    let updatedProgress = np.progress || 0;

                    if (v.toLowerCase() === "completed" || v.toLowerCase() === "done") {

                      updatedProgress = 100;

                    } else if (v.toLowerCase() === "pending") {

                      updatedProgress = 0;

                    } else if (v.toLowerCase() === "in progress" && (np.progress || 0) === 0) {

                      updatedProgress = 50;

                    }

                    setNp({ ...np, status: v, progress: updatedProgress });

                  }}

                  options={["Active", "On Hold", "Completed", "Overdue"]}

                  allowCustom={true}

                />

                <Fld

                  label="Progress (%)"

                  value={np.progress || 0}

                  type="number"

                  placeholder="0"

                  onChange={v => {

                    let val = Number(v);

                    if (val < 0) val = 0;

                    if (val > 100) val = 100;

                    setNp(prev => ({ ...prev, progress: val }));

                  }}

                />

              </div>

              <Fld label="Description" value={np.description} onChange={v => setNp({ ...np, description: v })} />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>

                <button onClick={() => setModal(null)} style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>

                <button onClick={addProject} disabled={projSaveLoading} style={{ ...B("var(--app-accent)"), opacity: projSaveLoading ? 0.7 : 1 }}>{projSaveLoading ? "Saving..." : "Add Project"}</button>

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

                <label style={{ display: "block", fontSize: 11, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>PASSWORD *</label>

                <div style={{ position: "relative" }}>

                  <input type={showMgrPass ? "text" : "password"} value={nm.password} onChange={e => { setNm({ ...nm, password: e.target.value }); setNmError(p => ({ ...p, password: "" })); }} style={{ width: "100%", border: `1.5px solid ${nmError.password ? "#EF4444" : "var(--app-border)"}`, borderRadius: 10, padding: "10px 46px 10px 14px", fontSize: 13, color: T.text, background: "var(--app-bg)", boxSizing: "border-box", outline: "none" }} placeholder="Set manager password" />

                  <button type="button" onClick={() => setShowMgrPass(!showMgrPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--app-muted)", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>{showMgrPass ? "HIDE" : "SHOW"}</button>

                </div>

                {nmError.password && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>Warning {nmError.password}</div>}

              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>

                <button onClick={() => setModal(null)} style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>

                <button onClick={addManager} disabled={mgrSaveLoading} style={{ ...B("var(--app-accent)"), opacity: mgrSaveLoading ? 0.7 : 1 }}>{mgrSaveLoading ? "Saving..." : "Save Manager "}</button>

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

                <Fld label="Client Limit *" type="number" value={ns.clientLimit} onChange={v => setNs({ ...ns, clientLimit: v })} />

                <Fld label="Employee Limit *" type="number" value={ns.employeeLimit} onChange={v => setNs({ ...ns, employeeLimit: v })} />

              </div>

              <div style={{ marginBottom: 14 }}>

                <label style={{ display: "block", fontSize: 11, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>PASSWORD *</label>

                <div style={{ position: "relative" }}>

                  <input type={showSubPass ? "text" : "password"} value={ns.password} onChange={e => { setNs({ ...ns, password: e.target.value }); setNsError(p => ({ ...p, password: "" })); }} style={{ width: "100%", border: `1.5px solid ${nsError.password ? "#EF4444" : "var(--app-border)"}`, borderRadius: 10, padding: "10px 46px 10px 14px", fontSize: 13, color: T.text, background: "var(--app-bg)", boxSizing: "border-box", outline: "none" }} placeholder="Set subadmin password" />

                  <button type="button" onClick={() => setShowSubPass(!showSubPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--app-muted)", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>{showSubPass ? "HIDE" : "SHOW"}</button>

                </div>

                {nsError.password && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>Warning {nsError.password}</div>}

              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>

                <button onClick={() => setModal(null)} style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>

                <button onClick={addSubadmin} disabled={subSaveLoading} style={{ ...B("var(--app-accent)"), opacity: subSaveLoading ? 0.7 : 1 }}>{subSaveLoading ? "Saving..." : "Save Subadmin "}</button>

              </div>

            </Mdl>}



            {/* ── Add Package Modal ── */}

            {modal === "package_add" && <Mdl title="Add New Package" onClose={() => setModal(null)} maxWidth={700}>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }} className="modal-2col">

                <Fld label="Package Title *" value={npkg.title} onChange={v => { setNpkg({ ...npkg, title: v }); setPkgError(p => ({ ...p, title: "" })); }} error={pkgError.title} />

                <Fld label="Icon (Emoji)" value={npkg.icon} onChange={v => setNpkg({ ...npkg, icon: v })} placeholder="e.g. 📦" />



                <Fld label="Description" value={npkg.description} onChange={v => setNpkg({ ...npkg, description: v })} />

              </div>



              <div style={{ background: "#f8fafc", padding: 18, borderRadius: 16, border: "1px solid #f1f5f9", margin: "14px 0" }}>

                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 800, letterSpacing: 1, marginBottom: 12 }}>PRICING OPTIONS</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }} className="modal-2col">

                  <Fld label="Monthly Price" value={npkg.monthlyPrice} onChange={v => setNpkg({ ...npkg, monthlyPrice: v })} placeholder="e.g. Rs.999" />

                  <Fld label="Quarterly Price" value={npkg.quarterlyPrice} onChange={v => setNpkg({ ...npkg, quarterlyPrice: v })} placeholder="e.g. Rs.2,499" />

                  <Fld label="Half-Yearly Price" value={npkg.halfYearlyPrice} onChange={v => setNpkg({ ...npkg, halfYearlyPrice: v })} placeholder="e.g. Rs.4,499" />

                  <Fld label="Annual Price" value={npkg.annualPrice} onChange={v => setNpkg({ ...npkg, annualPrice: v })} placeholder="e.g. Rs.7,999" />

                </div>

              </div>



              <div style={{ background: "#fdf2f8", padding: 18, borderRadius: 16, border: "#fce7f3", margin: "14px 0" }}>

                <div style={{ fontSize: 11, color: "#be185d", fontWeight: 800, letterSpacing: 1, marginBottom: 12 }}>BUSINESS MANAGEMENT</div>

                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>

                  {["Single business manage", "Multiple business manage"].map(mode => (

                    <button

                      key={mode}

                      onClick={() => setNpkg({ ...npkg, businessLimit: mode })}

                      style={{

                        flex: 1,

                        padding: "12px",

                        borderRadius: 12,

                        border: npkg.businessLimit === mode ? "1.5px solid #7c3aed" : "1.5px solid #e2e8f0",

                        background: npkg.businessLimit === mode ? "#f5f3ff" : "#fff",

                        color: npkg.businessLimit === mode ? "#7c3aed" : "#64748b",

                        fontSize: 13,

                        fontWeight: 700,

                        cursor: "pointer",

                        transition: "all 0.2s"

                      }}

                    >

                      {npkg.businessLimit === mode ? "✓ " : ""}{mode}

                    </button>

                  ))}

                </div>



                <div style={{ fontSize: 11, color: "#be185d", fontWeight: 800, letterSpacing: 1, marginBottom: 12, marginTop: 12 }}>RESOURCE LIMITS</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px" }}>

                  <Fld label="MANAGER LIMIT (TYPE NUMBER)" value={npkg.managerLimit} onChange={v => setNpkg({ ...npkg, managerLimit: v })} placeholder="e.g. 5 Manager or Unlimited Manager" />

                  <Fld label="COMPANY NAME LIMIT (CLIENTS)" value={npkg.clientLimit} onChange={v => setNpkg({ ...npkg, clientLimit: v })} placeholder="e.g. 10 Company manage or Unlimited" />

                  <Fld label="EMPLOYEE LIMIT" value={npkg.employeeLimit} onChange={v => setNpkg({ ...npkg, employeeLimit: v })} placeholder="e.g. 50 Employee manage or Unlimited" />

                </div>

              </div>



              <div style={{ marginBottom: 14 }}>

                <label style={{ display: "block", fontSize: 11, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>FEATURES (Comma separated)</label>

                <textarea

                  value={npkg.features}

                  onChange={e => setNpkg({ ...npkg, features: e.target.value })}

                  style={{ width: "100%", height: 80, border: "1.5px solid var(--app-border)", borderRadius: 10, padding: "10px 14px", fontSize: 13, background: "var(--app-bg)", outline: "none", fontFamily: "inherit", resize: "none" }}

                  placeholder="e.g. Unlimited Company Names, Premium Support, Custom Branding"

                />

              </div>



              {user?.role === "admin" && (

                <div style={{ marginBottom: 14 }}>

                  <label style={{ display: "block", fontSize: 11, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>ASSIGN TO SUBADMINS (ONLY ASSIGNED WILL SEE THIS)</label>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 12, border: "1.5px solid var(--app-border)", borderRadius: 10, background: "var(--app-bg)" }}>

                    {subadmins.map(s => (

                      <label key={s._id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.text, cursor: "pointer", background: npkg.assignedSubadmins.includes(s._id) ? "rgba(124, 58, 237, 0.1)" : "transparent", padding: "4px 8px", borderRadius: 6 }}>

                        <input

                          type="checkbox"

                          checked={npkg.assignedSubadmins.includes(s._id)}

                          onChange={() => {

                            const current = npkg.assignedSubadmins || [];

                            const next = current.includes(s._id) ? current.filter(id => id !== s._id) : [...current, s._id];

                            setNpkg({ ...npkg, assignedSubadmins: next });

                          }}

                        />

                        {s.name}

                      </label>

                    ))}

                    {subadmins.length === 0 && <div style={{ fontSize: 12, color: "var(--app-muted)" }}>No subadmins found</div>}

                  </div>

                </div>

              )}



              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>

                <button onClick={() => setModal(null)} style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>

                <button onClick={addPackage} disabled={pkgSaveLoading} style={{ ...B("var(--app-accent)"), opacity: pkgSaveLoading ? 0.7 : 1 }}>{pkgSaveLoading ? "Creating..." : "Create Package "}</button>

              </div>

            </Mdl>}



            {modal === "vendor_add" && <Mdl title="Add New Vendor" onClose={() => setModal(null)}>

              <div className="modal-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>

                <Fld label="Vendor Name *" value={nv.vendorName} onChange={v => { setNv({ ...nv, vendorName: v }); setNvError(p => ({ ...p, vendorName: "" })); }} error={nvError.vendorName} />

                <Fld label="Product Name *" value={nv.vendorProduct} onChange={v => { setNv({ ...nv, vendorProduct: v }); setNvError(p => ({ ...p, vendorProduct: "" })); }} error={nvError.vendorProduct} />

                <Fld label="Required Amount *" value={nv.amountTaxGst} type="number" onChange={v => { setNv({ ...nv, amountTaxGst: v }); setNvError(p => ({ ...p, amountTaxGst: "" })); }} error={nvError.amountTaxGst} />

                <Fld label="Paid Amount *" value={nv.paidAmount} type="number" onChange={v => { setNv({ ...nv, paidAmount: v }); setNvError(p => ({ ...p, paidAmount: "" })); }} error={nvError.paidAmount} />

                <Fld label="Date of Purchase" value={nv.dateOfPurchase} type="date" onChange={v => setNv({ ...nv, dateOfPurchase: v })} />

                <Fld label="Mode of Payment" value={nv.modeOfPayment} onChange={v => setNv({ ...nv, modeOfPayment: v })} options={["Cash", "Bank Transfer", "UPI", "Cheque"]} />

              </div>

              <Fld label="Product Description" value={nv.productDescription} onChange={v => setNv({ ...nv, productDescription: v })} />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>

                <button onClick={() => setModal(null)} style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>

                <button onClick={addVendor} disabled={vendorSaveLoading} style={{ ...B("var(--app-accent)"), opacity: vendorSaveLoading ? 0.7 : 1 }}>{vendorSaveLoading ? "Saving..." : "Save Vendor "}</button>

              </div>

            </Mdl>}



            {/* ── View Package Modal ── */}

            {viewPackage && (

              <Mdl title={`Package Details: ${viewPackage.title}`} onClose={() => setViewPackage(null)} maxWidth={500}>

                <div style={{ padding: "10px 0" }}>

                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>

                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--app-accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>

                      {viewPackage.icon || "📦"}

                    </div>

                    <div>

                      <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{viewPackage.title}</div>

                      <div style={{ fontSize: 13, color: "var(--app-muted)" }}>{viewPackage.type === "free" ? "Free Package" : "Paid Package"}</div>

                    </div>

                  </div>



                  <InfoRow icon="📄" label="Description" value={viewPackage.description} />

                  <InfoRow icon="📅" label="Duration" value={`${viewPackage.no_of_days || viewPackage.noOfDays || 30} days`} />

                  <InfoRow icon="💰" label="Price" value={viewPackage.type === "free" ? "Free" : `Rs.${viewPackage.price || 0}`} />

                  <InfoRow icon="" label="Plan Duration" value={viewPackage.planDuration || "Monthly"} />

                  <InfoRow icon="🏢" label="Business" value={viewPackage.businessLimit || ""} />

                  <InfoRow icon="👨‍💼" label="Manager" value={viewPackage.managerLimit || ""} />

                  <InfoRow icon="Team" label="Clients (Company Name)" value={viewPackage.clientLimit || ""} />

                  <InfoRow icon="👤" label="Employee" value={viewPackage.employeeLimit || ""} />

                  <InfoRow icon="📊" label="Status" value={viewPackage.status || "Active"} />



                  {viewPackage.features && viewPackage.features.length > 0 && (

                    <div style={{ marginTop: 20 }}>

                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--app-muted)", marginBottom: 10 }}>FEATURES</div>

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

                  <button onClick={() => setViewPackage(null)} style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", color: T.text, borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>✕</button>

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

                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 800, letterSpacing: 1, marginBottom: 12 }}>BUSINESS MANAGEMENT</div>

                  <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>

                    {["Single business manage", "Multiple business manage"].map(mode => (

                      <button

                        key={mode}

                        onClick={() => setEditPkgForm({ ...editPkgForm, businessLimit: mode })}

                        style={{

                          flex: 1,

                          padding: "12px",

                          borderRadius: 12,

                          border: editPkgForm.businessLimit === mode ? "1.5px solid #7c3aed" : "1.5px solid #e2e8f0",

                          background: editPkgForm.businessLimit === mode ? "#f5f3ff" : "#fff",

                          color: editPkgForm.businessLimit === mode ? "#7c3aed" : "#64748b",

                          fontSize: 13,

                          fontWeight: 700,

                          cursor: "pointer",

                          transition: "all 0.2s"

                        }}

                      >

                        {editPkgForm.businessLimit === mode ? "✓ " : ""}{mode}

                      </button>

                    ))}

                  </div>



                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 800, letterSpacing: 1, marginBottom: 12, marginTop: 12 }}>PACKAGE LIMITS</div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px" }}>

                    <Fld label="Plan Duration" value={editPkgForm.planDuration} onChange={v => setEditPkgForm({ ...editPkgForm, planDuration: v })} options={["Monthly", "90 Days", "Yearly"]} />

                    <Fld label="MANAGER LIMIT (TYPE NUMBER)" value={editPkgForm.managerLimit} onChange={v => setEditPkgForm({ ...editPkgForm, managerLimit: v })} placeholder="e.g. 5 Manager or Unlimited Manager" />

                    <Fld label="COMPANY NAME LIMIT (CLIENTS)" value={editPkgForm.clientLimit} onChange={v => setEditPkgForm({ ...editPkgForm, clientLimit: v })} placeholder="e.g. 10 Company manage or Unlimited" />

                    <Fld label="EMPLOYEE LIMIT" value={editPkgForm.employeeLimit} onChange={v => setEditPkgForm({ ...editPkgForm, employeeLimit: v })} placeholder="e.g. 50 Employee manage or Unlimited" />

                  </div>

                </div>



                <div style={{ marginBottom: 14 }}>

                  <label style={{ display: "block", fontSize: 11, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>DESCRIPTION</label>

                  <textarea

                    value={editPkgForm.description}

                    onChange={e => setEditPkgForm({ ...editPkgForm, description: e.target.value })}

                    style={{ width: "100%", height: 80, border: "1.5px solid var(--app-border)", borderRadius: 10, padding: "10px 14px", fontSize: 13, background: "var(--app-bg)", outline: "none", fontFamily: "inherit", resize: "none" }}

                    placeholder="Package description..."

                  />

                </div>



                {user?.role === "admin" && (

                  <div style={{ marginBottom: 14 }}>

                    <label style={{ display: "block", fontSize: 11, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>ASSIGN TO SUBADMINS (ONLY ASSIGNED WILL SEE THIS)</label>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 12, border: "1.5px solid var(--app-border)", borderRadius: 10, background: "var(--app-bg)" }}>

                      {subadmins.map(s => (

                        <label key={s._id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.text, cursor: "pointer", background: editPkgForm.assignedSubadmins?.includes(s._id) ? "rgba(124, 58, 237, 0.1)" : "transparent", padding: "4px 8px", borderRadius: 6 }}>

                          <input

                            type="checkbox"

                            checked={editPkgForm.assignedSubadmins?.includes(s._id)}

                            onChange={() => {

                              const current = editPkgForm.assignedSubadmins || [];

                              const next = current.includes(s._id) ? current.filter(id => id !== s._id) : [...current, s._id];

                              setEditPkgForm({ ...editPkgForm, assignedSubadmins: next });

                            }}

                          />

                          {s.name}

                        </label>

                      ))}

                      {subadmins.length === 0 && <div style={{ fontSize: 12, color: "var(--app-muted)" }}>No subadmins found</div>}

                    </div>

                  </div>

                )}



                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>

                  <button onClick={() => setEditPackage(null)} style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", color: T.text, borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>

                  <button onClick={savePackageEdit} disabled={pkgSaveLoading} style={{ ...B("var(--app-accent)"), opacity: pkgSaveLoading ? 0.7 : 1 }}>{pkgSaveLoading ? "Saving..." : "Save Changes "}</button>

                </div>

              </Mdl>

            )}



            {viewProject && (

              <Mdl title="Project Details" onClose={() => setViewProject(null)} maxWidth={550}>

                <div style={{ background: "#fff", borderRadius: 16 }}>

                  {/* Header Info */}

                  <div style={{ background: "var(--app-bg)", padding: "20px 24px", borderRadius: 16, marginBottom: 18, border: "1px solid var(--app-border)" }}>

                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--app-sidebar)", marginBottom: 8 }}>{viewProject.name}</h2>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

                      <Badge label={viewProject.status || "Pending"} />

                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--app-muted)", fontSize: 13, fontWeight: 600 }}>

                        <span>Team</span> {viewProject.client}

                      </div>

                    </div>

                  </div>



                  {/* Budget Row */}

                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, background: "var(--app-bg)", borderRadius: 16, border: "1px solid var(--app-border)", marginBottom: 18 }}>

                    <div style={{ width: 42, height: 42, background: "#fff", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 4px 12px rgba(var(--app-accent-rgb, 124, 58, 237), 0.08)" }}>💰</div>

                    <div>

                      <div style={{ fontSize: 9, color: "var(--app-muted)", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>BUDGET</div>

                      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--app-sidebar)" }}>{formatCurrency(viewProject.budget, viewProject.currency)}</div>

                    </div>

                  </div>



                  {/* Assigned Employees */}

                  <div style={{ marginBottom: 18 }}>

                    <h3 style={{ fontSize: 10, fontWeight: 800, color: "var(--app-muted)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>ASSIGNED EMPLOYEES</h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

                      {(() => {

                        const assignedEmployees = Array.isArray(viewProject.assignedTo) ? viewProject.assignedTo : (viewProject.assignedTo ? [viewProject.assignedTo] : []);

                        return assignedEmployees.length > 0 ? assignedEmployees.map((emp, idx) => (

                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--app-bg)", borderRadius: 12, border: "1px solid var(--app-border)" }}>

                            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--app-accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>{emp[0].toUpperCase()}</div>

                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--app-sidebar)" }}>{emp}</span>

                          </div>

                        )) : <div style={{ color: "var(--app-muted)", fontSize: 12, fontStyle: "italic" }}>No employees assigned</div>;

                      })()}

                    </div>

                  </div>



                  {/* Purpose Row */}

                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, background: "var(--app-bg)", borderRadius: 16, border: "1px solid var(--app-border)", marginBottom: 24 }}>

                    <div style={{ width: 42, height: 42, background: "#fff", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 4px 12px rgba(var(--app-accent-rgb, 124, 58, 237), 0.08)" }}>🎯</div>

                    <div>

                      <div style={{ fontSize: 9, color: "var(--app-muted)", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>PURPOSE</div>

                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--app-sidebar)" }}>{viewProject.purpose || "—"}</div>

                    </div>

                  </div>



                  <div style={{ display: "flex", gap: 10 }}>

                    <button onClick={() => setViewProject(null)} style={{ flex: 1, padding: "11px", background: "var(--app-accent-gradient)", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>✕</button>

                  </div>

                </div>

              </Mdl>

            )}



            {/* Upload File Modal */}

            {uploadFileTarget && (

              <Mdl title="Upload Document" onClose={() => { setUploadFileTarget(null); setUploadTargetUser(""); }}>

                <div style={{ marginBottom: 16 }}>

                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--app-sidebar)", marginBottom: 8 }}>Selected File</div>

                  <div style={{ padding: "12px 16px", background: "var(--app-bg)", border: "1px solid var(--app-border)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>

                    <i className="ti ti-file" style={{ fontSize: 20, color: "var(--app-accent)" }}></i>

                    <div style={{ flex: 1, minWidth: 0 }}>

                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--app-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{uploadFileTarget.name}</div>

                      <div style={{ fontSize: 11, color: "var(--app-muted)", marginTop: 2 }}>{(uploadFileTarget.size / 1024 / 1024).toFixed(2)} MB</div>

                    </div>

                  </div>

                </div>

                <div style={{ marginBottom: 16 }}>

                  <label style={{ display: "block", fontSize: 11, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>SEND TO TYPE *</label>

                  <select value={uploadTargetRole} onChange={(e) => { setUploadTargetRole(e.target.value); setUploadTargetUser(""); }} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--app-border)", background: "var(--app-bg)", color: "var(--app-text)", fontSize: 13, outline: "none", fontFamily: "inherit" }}>

                    <option value="client">Client</option>

                    <option value="employee">Employee</option>

                  </select>

                </div>

                <div style={{ marginBottom: 24 }}>

                  <label style={{ display: "block", fontSize: 11, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>SELECT {uploadTargetRole.toUpperCase()} *</label>

                  <select value={uploadTargetUser} onChange={(e) => setUploadTargetUser(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--app-border)", background: "var(--app-bg)", color: "var(--app-text)", fontSize: 13, outline: "none", fontFamily: "inherit" }}>

                    <option value="">-- Select --</option>

                    {uploadTargetRole === "client"

                      ? clients.map(c => <option key={c._id || c.id} value={c.clientName || c.name}>{c.clientName || c.name}</option>)

                      : employees.map(e => <option key={e._id || e.id} value={e.name}>{e.name}</option>)

                    }

                  </select>

                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>

                  <button onClick={() => { setUploadFileTarget(null); setUploadTargetUser(""); }} style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", color: "var(--app-text)", borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>Cancel</button>
                  <button disabled={!uploadTargetUser || uploadIsSending} onClick={async () => {
                    setUploadIsSending(true);
                    try {
                      const reader = new FileReader();
                      reader.readAsDataURL(uploadFileTarget);
                      reader.onload = async () => {
                        const base64Data = reader.result;
                        const companyId = user?.companyId || user?.company || user?._id || user?.id || "";

                        let resolvedClientId = "";
                        let resolvedEmployeeId = "";
                        if (uploadTargetRole === "client") {
                          const match = clients.find(c => (c.clientName || c.name) === uploadTargetUser);
                          resolvedClientId = match?._id || match?.id || "";
                        } else if (uploadTargetRole === "employee") {
                          const match = employees.find(e => e.name === uploadTargetUser);
                          resolvedEmployeeId = match?._id || match?.id || "";
                        }

                        await axios.post(`${BASE_URL}/api/documents`, {
                          docType: "upload",
                          sendTo: uploadTargetRole,
                          client: uploadTargetUser,
                          clientId: resolvedClientId,
                          employeeId: resolvedEmployeeId,
                          recipientEmail: "",
                          htmlContent: base64Data,
                          senderCompany: companyNameStr,
                          companyId
                        });

                        if (uploadTargetRole === "employee" && resolvedEmployeeId) {
                          try {
                            await axios.post(`${BASE_URL}/api/notifications`, {
                              userId: resolvedEmployeeId,
                              type: "document",
                              icon: "ti-files",
                              text: `A new document has been shared with you`,
                            });
                          } catch (notifErr) {
                            console.error("Failed to notify employee:", notifErr);
                          }
                        }

                        toast.success("File uploaded successfully!");
                        setUploadFileTarget(null);
                        setUploadTargetUser("");
                      };

                    } catch (err) {

                      console.error(err);

                      toast.error("Upload failed.");

                    } finally {

                      setUploadIsSending(false);

                    }

                  }} style={{ flex: 1, padding: "11px", background: (!uploadTargetUser || uploadIsSending) ? "var(--app-border)" : "var(--app-accent)", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, color: (!uploadTargetUser || uploadIsSending) ? "var(--app-muted)" : "#fff", cursor: (!uploadTargetUser || uploadIsSending) ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>

                    {uploadIsSending ? "Uploading..." : "Upload File"}

                  </button>

                </div>

              </Mdl>

            )}

          </div>

        </div>

      </div >

    </div >

  );

}