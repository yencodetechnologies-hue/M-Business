// EmployeeDashboard.jsx — UI THEME ONLY CHANGED (Skillset monochrome aesthetic)
// All logic, state, API calls, handlers = UNCHANGED

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { EmployeeProfilePanel, DOC_TYPES } from "./EmployeeProfilePanel";
import AuthPage from "./AuthPage";
import { BASE_URL } from "../config";
import EmployeeSubscriptionWarning from "./EmployeeSubscriptionWarning";
import CalendarPage from "./CalendarPage";
import MessagingPage from "./MessagingPage";
import SettingsPage from "./SettingsPage";
import ImageCropModal from "./ImageCropModal";
import ModernEmployeeProjects from "./ModernEmployeeProjects";
import ModernEmployeeProjectDetails from "./ModernEmployeeProjectDetails";

const BASE = "/api/employee-dashboard";

// ── DESIGN TOKENS --------------------------------------------
const T = {
  // ── BACKGROUNDS ------------------------------------------
  bg: "var(--app-bg, #f8fafc)",
  surface: "#ffffff",
  sidebar: "linear-gradient(180deg, var(--app-accent, #00BCD4) 0%, var(--app-accent2, #00ACC1) 100%)",
  sidebarActive: "rgba(255,255,255,0.22)",
  sidebarText: "rgba(255,255,255,0.65)",
  sidebarTextActive: "#ffffff",

  // ── BORDERS ----------------------------------------------
  border: "var(--app-border, #e2e8f0)",
  borderDark: "var(--app-border, #cbd5e1)",

  // ── TEXT -------------------------------------------------
  text: "var(--app-text, #1e293b)",
  textMuted: "var(--app-muted, #64748b)",
  textFaint: "var(--app-muted, #94a3b8)",

  // ── ACCENT -----------------------------------------------
  accent: "var(--app-accent, #00BCD4)",
  accentLight: "var(--teal-light, #E0F7FA)",
  accentRgb: "var(--app-accent-rgb, 0,188,212)",

  // ── STATUS (semantic — intentionally not tied to theme) ---
  success: "#16a34a",
  successBg: "#f0fdf4",
  successBorder: "#bbf7d0",
  warning: "#b45309",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  danger: "#dc2626",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  info: "#2563eb",
  infoBg: "#eff6ff",
  infoBorder: "#bfdbfe",

  // ── SHAPE ------------------------------------------------
  radius: "14px",
  radiusSm: "9px",
  radiusLg: "20px",
  shadow: "0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 16px rgba(var(--app-accent-rgb, 0,188,212),0.14)",
  shadowLg: "0 12px 32px rgba(var(--app-accent-rgb, 0,188,212),0.18)",
};

const sc = (s) => ({
  active: T.accent, "in progress": T.accent,
  review: "#b45309", "in review": "#b45309", pending: "#b45309",
  done: T.success, completed: T.success,
  high: T.danger, medium: "#b45309", low: T.success,
  present: T.success, absent: T.danger, leave: "#b45309", holiday: T.textMuted,
  approved: T.success, rejected: T.danger, overdue: T.danger,
  cancelled: T.textMuted,
}[(s || "").toLowerCase()] || T.accent);

const scBg = (s) => ({
  active: T.accentLight, "in progress": T.accentLight,
  review: T.warningBg, "in review": T.warningBg, pending: T.warningBg,
  done: T.successBg, completed: T.successBg,
  high: T.dangerBg, medium: T.warningBg, low: T.successBg,
  present: T.successBg, absent: T.dangerBg, leave: T.warningBg, holiday: "#f5f5f5",
  approved: T.successBg, rejected: T.dangerBg, overdue: T.dangerBg,
  cancelled: "#f5f5f5",
}[(s || "").toLowerCase()] || T.accentLight);

const NAV = [
  { key: "dashboard", icon: "ti-layout-dashboard", label: "Dashboard" },
  { key: "projects", icon: "ti-briefcase", label: "My Projects" },
  { key: "tasks", icon: "ti-checklist", label: "Active Tasks" },
  { key: "calendar", icon: "ti-calendar", label: "Calendar" },
  { key: "messaging", icon: "ti-mail", label: "Messages" },
  { key: "documents", icon: "ti-folder", label: "Documents" },
  { key: "reports", icon: "ti-chart-bar", label: "Reports" },
  { key: "settings", icon: "ti-settings", label: "Settings" },
];

const PERMISSION_TYPES = [
  { value: "late_arrival", label: "Late Arrival", icon: "", desc: "Coming in late today" },
  { value: "early_departure", label: "Early Departure", icon: "", desc: "Leaving early today" },
  { value: "od", label: "On Duty (OD)", icon: "Company", desc: "Working outside office" },
  { value: "wfh", label: "Work From Home", icon: "", desc: "Working from home" },
  { value: "half_day", label: "Half Day", icon: "", desc: "Half day off" },
  { value: "other", label: "Other", icon: "Edit", desc: "Other reason" },
];

const todayStr = () => new Date().toISOString().split("T")[0];
const fmt = (n, sym = "₹") => (sym || "₹") + Number(n || 0).toLocaleString("en-IN");
const statusIcon = (s) => {
  const l = (s || "").toLowerCase();
  if (l === "approved") return "Success"; if (l === "rejected") return "Error";
  if (l === "cancelled") return "Block"; return "Pending";
};

// ── ATOMS ----------------------------------------------------

function Badge({ label }) {
  const c = sc(label), bg = scBg(label);
  const display = (label || "").replace(/_/g, " ");
  return (
    <span style={{ background: bg, color: c, border: `1px solid ${c}22`, padding: "2px 10px", borderRadius: 99, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.6px" }}>
      {display}
    </span>
  );
}

function ProgressBar({ pct }) {
  const p = pct || 0, c = p === 100 ? T.success : T.accent;
  return (
    <div style={{ background: "#ebebeb", borderRadius: 99, height: 5, overflow: "hidden", minWidth: 80 }}>
      <div style={{ width: `${p}%`, background: c, height: "100%", borderRadius: 99, transition: "width 1s cubic-bezier(0.4,0,0.2,1)" }} />
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, onClick, dark }) {
  return (
    <div onClick={onClick}
      style={{ background: dark ? T.accent : T.surface, borderRadius: T.radius, padding: "22px 20px", border: dark ? "none" : `1px solid ${T.border}`, cursor: onClick ? "pointer" : "default", position: "relative", overflow: "hidden", transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)", boxShadow: dark ? "0 8px 24px rgba(0,0,0,0.18)" : T.shadow }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = dark ? "0 12px 32px rgba(0,0,0,0.25)" : T.shadowMd; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = dark ? "0 8px 24px rgba(0,0,0,0.18)" : T.shadow; }}>
      <div style={{ width: 40, height: 40, borderRadius: T.radiusSm, background: dark ? "rgba(255,255,255,0.12)" : T.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 14, border: dark ? "1px solid rgba(255,255,255,0.15)" : `1px solid ${T.border}` }}>
        <span style={{ filter: dark ? "brightness(0) invert(1)" : "none" }}>{icon}</span>
      </div>
      <div style={{ fontSize: 10, color: dark ? "rgba(255,255,255,0.5)" : T.textMuted, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: dark ? "#fff" : T.text, lineHeight: 1, letterSpacing: "-0.5px" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: dark ? "rgba(255,255,255,0.4)" : T.textFaint, marginTop: 6, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

function Card({ children, title, action }) {
  return (
    <div style={{ background: T.surface, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: "22px", boxShadow: T.shadow }}>
      {(title || action) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          {title && <div style={{ fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: "-0.3px" }}>{title}</div>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, background: T.bg, padding: "3px", borderRadius: T.radiusSm, marginBottom: 18, border: `1px solid ${T.border}` }}>
      {tabs.map(t => {
        const on = active === t.key;
        return (
          <button key={t.key} onClick={() => onChange(t.key)}
            style={{ padding: "7px 15px", fontSize: 12, cursor: "pointer", background: on ? T.accent : "transparent", border: "none", borderRadius: 7, color: on ? "#fff" : T.textMuted, fontWeight: on ? 800 : 500, fontFamily: "inherit", whiteSpace: "nowrap", transition: "all 0.18s" }}>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function Toast({ msg, type }) {
  const c = type === "error" ? T.danger : T.accent;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: T.text, border: `1px solid ${c}50`, borderRadius: T.radiusSm, padding: "10px 18px", fontSize: 13, color: "#fff", opacity: msg ? 1 : 0, transition: "opacity 0.3s", pointerEvents: "none" }}>
      {msg}
    </div>
  );
}

function InputField({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = { width: "100%", border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm, padding: "9px 12px", fontSize: 13, color: T.text, background: T.surface, outline: "none", fontFamily: "inherit", transition: "border-color 0.15s" };

// ── SIDEBAR --------------------------------------------------

function Sidebar({ active, setActive, open, onClose, onLogout, user, navItems }) {
  const displayName = user?.name || "Employee";
  const initials = (displayName || "E").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(3px)", zIndex: 998 }} />}
      <div className="emp-sidebar" style={{ width: 252, background: T.sidebar, color: "#fff", display: "flex", flexDirection: "column", height: "100vh", position: "fixed", top: 0, left: 0, zIndex: 999, transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Logo area */}
        <div style={{ padding: "28px 22px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {user?.logoUrl ? (
              <div style={{ minWidth: 38, height: 38, background: "rgba(255,255,255,0.08)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "4px", border: "1px solid rgba(255,255,255,0.12)" }}>
                <img src={user.logoUrl} alt="logo" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
              </div>
            ) : (
              <div style={{ width: 38, height: 38, background: "rgba(255,255,255,0.12)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}>
                {initials[0]}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#fff", letterSpacing: "-0.3px" }}>{displayName}</div>
              <div style={{ fontSize: 9, color: "#ffffff", letterSpacing: 1.5, fontWeight: 600, textTransform: "uppercase", marginTop: 2 }}>{user?.role || "EMPLOYEE"}</div>
            </div>
          </div>
          <button onClick={onClose} className="emp-sb-close" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 11 }}>Close</button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 14px", marginTop: 6, overflowY: "auto" }}>
          <div style={{ fontSize: 9, color: "#ffffff", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", padding: "0 8px", marginBottom: 8 }}>Main Menu</div>
          {(navItems || NAV).map(n => {
            const on = active === n.key;
            return (
              <button key={n.key} onClick={() => { setActive(n.key); onClose(); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", background: on ? "rgba(255,255,255,0.1)" : "transparent", border: on ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent", borderRadius: 10, color: "#ffffff", fontWeight: on ? 900 : 700, fontSize: 13, cursor: "pointer", marginBottom: 3, textAlign: "left", fontFamily: "inherit", transition: "all 0.18s" }}
                onMouseEnter={e => { if (!on) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#ffffff"; } }}
                onMouseLeave={e => { if (!on) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#ffffff"; } }}>
                <span style={{ fontSize: 15, opacity: on ? 1 : 0.5, minWidth: 18, textAlign: "center" }}><i className={`ti ${n.icon}`}></i></span>
                <span style={{ flex: 1 }}>{n.label}</span>
                {on && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff", opacity: 0.7 }} />}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "14px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: T.radiusSm, color: "#fca5a5", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.18)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}>
            Logout
          </button>
        </div>
      </div>
      <div className="emp-sb-spacer" style={{ width: 252, flexShrink: 0 }} />
    </>
  );
}

// ── DOCUMENTS CARD -------------------------------------------

function DocumentsCard({ docStatus, onOpenProfile }) {
  const uploadedCount = Object.values(docStatus).filter(Boolean).length;
  const total = DOC_TYPES.length;
  const allDone = uploadedCount === total;
  const pct = Math.round((uploadedCount / total) * 100);

  return (
    <Card title="My Documents">
      {/* Progress */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 600 }}>{uploadedCount}/{total} uploaded</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: allDone ? T.success : T.warning, letterSpacing: "-0.5px" }}>{pct}%</span>
        </div>
        <div style={{ background: T.bg, borderRadius: 99, height: 8, overflow: "hidden", border: `1px solid ${T.border}` }}>
          <div style={{ width: `${pct}%`, background: allDone ? T.success : T.accent, height: "100%", borderRadius: 99, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
        </div>
      </div>

      {/* Doc rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {DOC_TYPES.map(dt => {
          const doc = docStatus[dt.key];
          const hasDoc = !!doc;
          return (
            <div key={dt.key}
              style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "10px 12px", borderRadius: T.radiusSm, background: hasDoc ? "#fafafa" : T.bg, border: `1px solid ${hasDoc ? T.border : T.border}`, transition: "all 0.18s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: T.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, border: `1px solid ${T.border}`, color: T.accent }}><i className={`ti ${dt.icon}`}></i></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{dt.label}</div>
                {hasDoc && doc.uploadedAt
                  ? <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>Uploaded {new Date(doc.uploadedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                  : <div style={{ fontSize: 10, color: T.textFaint, marginTop: 1 }}>{dt.desc}</div>}
              </div>
              {hasDoc
                ? <span style={{ background: T.successBg, border: `1px solid ${T.successBorder}`, borderRadius: 99, padding: "3px 10px", fontSize: 9, fontWeight: 800, color: T.success, textTransform: "uppercase", letterSpacing: "0.5px" }}>Yes Done</span>
                : <button onClick={onOpenProfile}
                  style={{ background: T.warningBg, border: `1px solid ${T.warningBorder}`, borderRadius: 99, padding: "3px 12px", fontSize: 9, fontWeight: 800, color: T.warning, cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.5px", transition: "all 0.15s" }}>
                  Upload
                </button>}
            </div>
          );
        })}
      </div>

      {allDone && (
        <div style={{ marginTop: 12, background: T.successBg, border: `1px solid ${T.successBorder}`, borderRadius: T.radiusSm, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>Celebration</span>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.success }}>All documents uploaded — profile complete.</div>
        </div>
      )}
    </Card>
  );
}

// ── DASHBOARD PAGE -------------------------------------------

// ── Employee Documents Page ----------------------------------
function EmployeeDocumentsPage({ user, notifications = [], onAcknowledge }) {
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  // A file can only be shown inline (image/PDF) — anything else the browser
  // will always try to download, so we don't offer a fake "view" for those.
  const isPreviewableFile = (file) => {
    const mime = (file?.type || "").toLowerCase();
    const name = (file?.name || "").toLowerCase();
    if (mime.includes("pdf") || name.endsWith(".pdf")) return "pdf";
    if (mime.includes("image") || /\.(jpg|jpeg|png|gif|webp|svg)$/.test(name)) return "image";
    return null;
  };
  const [loading, setLoading] = useState(true);
  const [docRequests, setDocRequests] = useState([]);
  const [uploadingId, setUploadingId] = useState(null);

  const fetchDocRequests = async () => {
    try {
      const empId = user?._id || user?.id;
      if (!empId) return;
      const res = await axios.get(`${BASE_URL}/api/document-requests/employee/${empId}`);
      setDocRequests(res.data || []);
    } catch (err) {
      console.error("[EmployeeDocs] Failed to fetch document requests:", err);
    }
  };

  const handleUploadForRequest = async (request, file) => {
    if (!file) return;
    setUploadingId(request._id);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await axios.post(`${BASE_URL}/api/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await axios.patch(`${BASE_URL}/api/document-requests/${request._id}/upload`, {
        fileUrl: uploadRes.data.url,
        fileName: uploadRes.data.name || file.name,
      });
      await fetchDocRequests();
    } catch (err) {
      console.error("[EmployeeDocs] Upload failed:", err);
      alert("Failed to upload document. Please try again.");
    } finally {
      setUploadingId(null);
    }
  };

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const companyId = user?.companyId || user?.company || user?._id || user?.id || "";
        const displayName = (user?.name || "").trim().toLowerCase();
        console.log("[EmployeeDocs] user=", user);
        console.log("[EmployeeDocs] companyId=", companyId, "displayName=", displayName);
        // Fetch all employee docs (bypassing strict companyId requirement) then filter by name client-side
        const [docsRes, projRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/documents?sendTo=employee`),
          axios.get(`${BASE_URL}/api/projects`)
        ]);
        const allDocs = Array.isArray(docsRes.data) ? docsRes.data : (docsRes.data?.value || []);
        const myDocs = allDocs.filter(d => {
          const docClient = (d.client || "").trim().toLowerCase();
          return !displayName || docClient === displayName || docClient.includes(displayName) || displayName.includes(docClient);
        });
        const empName = user?.name || user?.employeeName || '';
        const projFiles = (Array.isArray(projRes.data) ? projRes.data : []).flatMap(p =>
          (p.files || [])
            .filter(f => f.sentToEmployee && f.sentToEmployee === empName)
            .map(f => ({
              _id: f._id || f.url,
              docType: f.name || 'File',
              htmlContent: `<div style="padding:20px"><h3>${f.name}</h3><p>From Project: <strong>${p.name}</strong></p><a href="${f.url}" target="_blank" style="color:#9b6fd4;font-weight:700">Attach Open / Download File</a></div>`,
              client: empName,
              fromProject: p.name,
              dateSent: f.uploadedAt,
              isProjectFile: true,
              url: f.url,
            }))
        );
        setDocs([...myDocs, ...projFiles]);
      } catch (err) {
        console.error("[EmployeeDocs] Failed to fetch documents:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
    fetchDocRequests();
  }, [user]);

  if (selectedDoc) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <button onClick={() => setSelectedDoc(null)} style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text, padding: "8px 16px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-arrow-left"></i> Back to Documents
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{selectedDoc.docType.toUpperCase()} Document</div>
        </div>
        <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 12, padding: "20px", overflowY: "auto" }}>
          <style>{`
            .emp-doc-view .lh-wrap { max-width: 760px; margin: 0 auto; background: #fff; box-shadow: 0 8px 30px rgba(0,0,0,0.12); border-radius: 4px; display: flex; flex-direction: column; border: 1px solid #eaeaea; font-family: 'Nunito', sans-serif; overflow: hidden; }
            .emp-doc-view .lb-editor { min-height: 0 !important; }
            .emp-doc-view .doc-body { padding: 28px 40px; font-size: 12.5px; line-height: 1.8; color: #1A2E35; flex: 1; }
            .emp-doc-view .lb-recip { display: block !important; }
            .emp-doc-view .lb-ref { display: block !important; }
            .emp-doc-view .lb-subj { display: block !important; }
            .emp-doc-view [contenteditable] { outline: none; pointer-events: none; }
          `}</style>
          <div className="emp-doc-view" dangerouslySetInnerHTML={{ __html: selectedDoc.htmlContent }} />
        </div>
      </div>
    );
  }

  const pendingDocRequests = docRequests.filter(r => r.status === "pending");
  const uploadedDocRequests = docRequests.filter(r => r.status !== "pending");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 24 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>My Documents</div>

      {pendingDocRequests.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pendingDocRequests.map(req => (
            <div key={req._id} style={{
              background: T.warningBg,
              border: `1.5px solid ${T.warningBorder}`,
              borderRadius: T.radius,
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 14,
              boxShadow: "0 4px 12px rgba(180, 83, 9, 0.05)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: "#FEF3C7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  color: "#D97706"
                }}>
                  <i className="ti ti-folder"></i>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#92400E" }}>{req.documentName}</div>
                  <div style={{ fontSize: 12.5, color: "#B45309", marginTop: 2, fontWeight: 500 }}>{req.documentType} · Requested {new Date(req.requestedAt).toLocaleDateString("en-IN")}</div>
                </div>
              </div>
              <label style={{
                background: uploadingId === req._id ? "#f5c98a" : "#D97706",
                color: "#fff",
                border: "none",
                borderRadius: T.radiusSm,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 800,
                cursor: uploadingId === req._id ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                boxShadow: "0 2px 6px rgba(217, 119, 6, 0.2)",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
                <i className={uploadingId === req._id ? "ti ti-loader-2" : "ti ti-upload"}></i>
                {uploadingId === req._id ? "Uploading..." : "Upload"}
                <input
                  type="file"
                  style={{ display: "none" }}
                  disabled={uploadingId === req._id}
                  onChange={e => handleUploadForRequest(req, e.target.files?.[0])}
                />
              </label>
            </div>
          ))}
        </div>
      )}

      {uploadedDocRequests.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.textMuted, marginTop: 4 }}>Submitted for Review</div>
          {uploadedDocRequests.map(req => (
            <div key={req._id} style={{
              background: T.successBg,
              border: `1.5px solid ${T.successBorder}`,
              borderRadius: T.radius,
              padding: "14px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", color: T.success, fontSize: 16 }}>
                  <i className="ti ti-check"></i>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{req.documentName}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Uploaded {req.uploadedAt ? new Date(req.uploadedAt).toLocaleDateString("en-IN") : ""}</div>
                </div>
              </div>
              {req.fileUrl && <a href={req.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 700, color: T.success, textDecoration: "underline" }}>View file</a>}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {loading ? (
          <div style={{ color: T.textMuted, padding: 20 }}>Loading documents...</div>
        ) : docs.length === 0 ? (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: 40, borderRadius: 16, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}></div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>No Documents</div>
            <div style={{ color: T.textMuted, fontSize: 14 }}>You haven't received any documents or letters yet.</div>
          </div>
        ) : (
          docs.map(doc => (
            <div key={doc._id || doc.id} onClick={() => setSelectedDoc(doc)} style={{ background: T.surface, border: `1px solid ${T.border}`, padding: 20, borderRadius: 12, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accentLight, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent }}>
                  <i className="ti ti-file-text" style={{ fontSize: 20 }}></i>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text, textTransform: "capitalize" }}>{doc.docType} received</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>Sent on {new Date(doc.dateSent).toLocaleString()}</div>
                </div>
              </div>
              <i className="ti ti-chevron-right" style={{ color: T.textMuted }}></i>
            </div>
          )))}
      </div>
    </div>
  );
}

function DashboardPage({ user, projects, tasks, proposals, attendance, salary, setPage, docStatus, onOpenProfile, onViewProject }) {
  const name = user?.name || "Employee";
  const today = todayStr();
  const todayAtt = attendance.find(a => a.date === today);
  const currentMonthKey = today.slice(0, 7); // "YYYY-MM"
  const thisMonthAttendance = attendance.filter(a => (a.date || "").startsWith(currentMonthKey));
  const presentDays = thisMonthAttendance.filter(a => a.status === "present").length;
  const absentDays = thisMonthAttendance.filter(a => a.status === "absent").length;
  const leaveDays = thisMonthAttendance.filter(a => a.status === "leave").length;
  const totalMarked = presentDays + absentDays + leaveDays;
  const attRate = totalMarked > 0 ? Math.round((presentDays / totalMarked) * 100) : 0;
  const leaveTotal = user?.leaveBalance ?? user?.totalLeaveDays ?? 18;
  const leaveDaysAllTime = attendance.filter(a => a.status === "leave").length;
  const leaveLeft = Math.max(leaveTotal - leaveDaysAllTime, 0);
  const pendingTasks = tasks.filter(t => !["done", "completed"].includes((t.status || "").toLowerCase())).length;
  const activeProjectsCount = projects.filter(p => !["done", "completed"].includes((p.status || "").toLowerCase())).length;
  const latestSalary = salary[0];
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? "Good morning" : greetHour < 17 ? "Good afternoon" : "Good evening";
  const recentLeave = attendance.filter(a => a.status === "leave" || a.status === "absent").slice(0, 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── GREETING HERO ── */}
      <div style={{
        background: T.sidebar, borderRadius: T.radiusLg, padding: "26px 30px",
        display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
        boxShadow: T.shadowLg, position: "relative", overflow: "hidden"
      }}>
        <div style={{ width: 62, height: 62, borderRadius: "50%", background: "#fff", color: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, border: "3px solid rgba(255,255,255,0.4)", flexShrink: 0, zIndex: 1 }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 220, zIndex: 1 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 600, marginBottom: 3 }}>{greeting}</div>
          <div style={{ fontSize: 21, fontWeight: 900, color: "#fff", marginBottom: 3 }}>{name} 👋</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{user?.role || "Employee"} · {user?.department || user?.dept || "—"}</div>
        </div>
        <div style={{ textAlign: "right", zIndex: 1 }}>
          {!todayAtt ? (
            <button onClick={() => setPage("attendance")} style={{ background: "#fff", color: T.accent, border: "none", borderRadius: 99, padding: "8px 16px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
              Mark Today's Attendance
            </button>
          ) : (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 99, padding: "5px 14px", fontSize: 11, fontWeight: 800, color: "#fff" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
              Today: {todayAtt.status.toUpperCase()}
            </div>
          )}
          <div style={{ marginTop: 8 }}>
            <button onClick={() => setPage("attendance")} style={{ background: "none", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 99, padding: "7px 14px", fontSize: 11, fontWeight: 800, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
              Apply Leave
            </button>
          </div>
        </div>
      </div>

      {/* ── QUICK STATS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }} className="stat-grid">
        <StatCard icon="◈" label="Active Projects" value={activeProjectsCount} sub="Assigned to you" color={T.accent} onClick={() => setPage("projects")} />
        <StatCard icon="◉" label="Pending Tasks" value={pendingTasks} sub="Need attention" color={T.accent} onClick={() => setPage("tasks")} />
        <StatCard icon="◷" label="Present Days" value={presentDays} sub="This month" color={T.accent} onClick={() => setPage("attendance")} />
        <StatCard icon="◆" label="Leave Days Left" value={leaveLeft} sub={`of ${leaveTotal} days`} color={T.accent} onClick={() => setPage("attendance")} />
      </div>

      {/* ── PROFILE + ATTENDANCE ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="two-col">
        <Card title="My Profile" action={
          <button onClick={onOpenProfile} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
        }>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><div style={{ fontSize: 10, fontWeight: 900, color: T.textFaint, letterSpacing: 1, textTransform: "uppercase" }}>Full Name</div><div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginTop: 3 }}>{name}</div></div>
            <div><div style={{ fontSize: 10, fontWeight: 900, color: T.textFaint, letterSpacing: 1, textTransform: "uppercase" }}>Employee ID</div><div style={{ fontSize: 13, fontWeight: 700, color: T.accent, marginTop: 3 }}>{user?.employeeId || user?.emp_id || "—"}</div></div>
            <div><div style={{ fontSize: 10, fontWeight: 900, color: T.textFaint, letterSpacing: 1, textTransform: "uppercase" }}>Role</div><div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginTop: 3 }}>{user?.role || "—"}</div></div>
            <div><div style={{ fontSize: 10, fontWeight: 900, color: T.textFaint, letterSpacing: 1, textTransform: "uppercase" }}>Department</div><div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginTop: 3 }}>{user?.department || user?.dept || "—"}</div></div>
            <div><div style={{ fontSize: 10, fontWeight: 900, color: T.textFaint, letterSpacing: 1, textTransform: "uppercase" }}>Email</div><div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginTop: 3, wordBreak: "break-all" }}>{user?.email || "—"}</div></div>
            <div><div style={{ fontSize: 10, fontWeight: 900, color: T.textFaint, letterSpacing: 1, textTransform: "uppercase" }}>Phone</div><div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginTop: 3 }}>{user?.phone || "—"}</div></div>
          </div>
        </Card>

        <Card title="Attendance & Leave" action={<span style={{ fontSize: 11, color: T.textMuted }}>This Month</span>}>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.success }}>{presentDays}</div>
              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, marginTop: 2 }}>Present</div>
            </div>
            <div style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.danger }}>{absentDays}</div>
              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, marginTop: 2 }}>Absent</div>
            </div>
            <div style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: T.warning }}>{leaveDays}</div>
              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, marginTop: 2 }}>Leave</div>
            </div>
          </div>
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 5 }}>
              <span>Attendance Rate</span><span>{attRate}%</span>
            </div>
            <ProgressBar pct={attRate} />
          </div>
          {recentLeave.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Recent Leave / Absence</div>
              {recentLeave.map((a, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
                  <span style={{ fontSize: 12, color: T.text }}>{a.date}</span>
                  <Badge label={a.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── PROJECTS + TASKS + DOCUMENTS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 16 }} className="three-col">
        <Card title="My Projects" action={
          <button onClick={() => setPage("projects")} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>View all</button>
        }>
          {projects.filter(p => !["done", "completed"].includes((p.status || "").toLowerCase())).slice(0, 4).map((p, i, arr) => (
            <div key={p._id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ width: 3, height: 36, borderRadius: 99, background: T.accent, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0, cursor: onViewProject ? "pointer" : "default" }} onClick={() => onViewProject && onViewProject(p)}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{p.client || "—"} · Due {p.deadline || "—"}</div>
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                  {(() => {
                    const pTasks = tasks.filter(t => {
                      const tProjId = t.projectId && typeof t.projectId === 'object' ? t.projectId._id : t.projectId;
                      const tProjName = t.projectId && typeof t.projectId === 'object' ? t.projectId.name : t.project;
                      return (tProjId && (tProjId === p._id || tProjId === p.id)) || (tProjName && tProjName === p.name);
                    });
                    const s = (p.status || "").toLowerCase();
                    let pct = 0;
                    if (s === "done" || s === "completed") pct = 100;
                    else if (pTasks.length > 0) pct = Math.round((pTasks.filter(t => ["done", "completed"].includes((t.status || "").toLowerCase())).length / pTasks.length) * 100);
                    else if (s === "in progress") pct = 50;
                    else if (s === "on hold") pct = 30;
                    else if (s === "pending" || s === "not started") pct = 0;
                    else if (s === "review" || s === "in review") pct = 90;
                    else pct = (p.progress || 0);
                    return (
                      <>
                        <ProgressBar pct={pct} />
                        <span style={{ fontSize: 10, color: T.textFaint, fontWeight: 700, minWidth: 28 }}>{pct}%</span>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}
          {projects.filter(p => !["done", "completed"].includes((p.status || "").toLowerCase())).length === 0 && (
            <div style={{ textAlign: "center", padding: "28px", color: T.textFaint, fontSize: 13 }}>No active projects assigned</div>
          )}
        </Card>

        <Card title="My Tasks" action={
          <button onClick={() => setPage("tasks")} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>View all</button>
        }>
          {tasks.filter(t => !["done", "completed"].includes((t.status || "").toLowerCase())).slice(0, 5).map((t, i, arr) => {
            const projectName = t.projectId?.name || t.project || "—";
            const dueDate = t.date || t.dueDate || "—";
            return (
              <div key={t._id || i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${T.borderDark}`, flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                  <div style={{ fontSize: 10, color: T.textFaint, marginTop: 2 }}>{projectName} · {dueDate}</div>
                </div>
                <Badge label={t.priority || "medium"} />
              </div>
            );
          })}
          {tasks.filter(t => !["done", "completed"].includes((t.status || "").toLowerCase())).length === 0 && (
            <div style={{ textAlign: "center", padding: "28px", color: T.textFaint, fontSize: 13 }}>No active tasks</div>
          )}
        </Card>

        <DocumentsCard docStatus={docStatus} onOpenProfile={onOpenProfile} />
      </div>
    </div>
  );
}

// ── MY PROFILE FULL PAGE (Teal themed) -----------------------
function MyProfilePage({ user, projects, tasks, attendance, onBack }) {
  const name = user?.name || "Employee";
  const role = user?.role || "Employee";
  const dept = user?.department || user?.dept || "";
  const email = user?.email || "";
  const phone = user?.phone || "";
  const empId = user?.employeeId || user?.emp_id || "EMP-001";
  const joinDate = user?.dateJoined || user?.joinDate || "";
  const employment = user?.employmentType || user?.employment || "Full-Time";
  const presentDays = attendance.filter(a => a.status === "present").length;
  const absentDays = attendance.filter(a => a.status === "absent").length;
  const leaveDays = attendance.filter(a => a.status === "leave").length;
  const wfhDays = attendance.filter(a => a.status === "wfh").length;
  const totalMarked = presentDays + absentDays + leaveDays;
  const attRate = totalMarked > 0 ? Math.round((presentDays / totalMarked) * 100) : 0;
  const leaveUsed = leaveDays;
  const leaveTotal = 18;
  const pendingTasks = tasks.filter(t => !["done", "completed"].includes((t.status || "").toLowerCase())).length;
  const activeProj = projects.filter(p => !["done", "completed"].includes((p.status || "").toLowerCase())).length;
  const leaveHistory = attendance.filter(a => a.status === "leave" || a.status === "absent").slice(0, 3);
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const TC = { teal: " var(--app-accent, var(--app-accent, #00BCD4))", bg: "#f0f4f8", card: "#fff", border: "#e5eaf0", text: "#0f1c2e", textMid: "#4a5568", textSoft: "#94a3b8", green: "#16a34a", amber: "#d97706", red: "#dc2626", blue: "#2563eb" };

  const docItems = [
    { name: "Offer Letter", meta: "Jan 2024 · PDF", icon: "📄", color: "#6366F1" },
    { name: "Aadhaar Card", meta: "ID Proof · PDF", icon: "🪪", color: "#0ea5e9" },
    { name: "Contract", meta: "Signed · PDF", icon: "📄", color: "#f59e0b" },
    { name: "Degree Cert", meta: "Education · PDF", icon: "🎓", color: "#8b5cf6" },
    { name: "Resume", meta: "Latest · PDF", icon: "📝", color: "#ef4444" },
  ];

  const cardStyle = { background: TC.card, borderRadius: 16, border: `1px solid ${TC.border}`, overflow: "hidden" };
  const headStyle = { padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${TC.border}` };
  const titleStyle = { fontSize: 13, fontWeight: 900, color: TC.text, display: "flex", alignItems: "center", gap: 8 };
  const bodyStyle = { padding: "18px" };
  const lblStyle = { fontSize: 10, fontWeight: 700, color: TC.teal, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 };
  const valStyle = { fontSize: 13, fontWeight: 700, color: TC.text };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Back */}


      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#0f9baa, var(--app-accent, var(--app-accent, #00BCD4)),#26c6da)", borderRadius: 18, padding: "24px 28px", display: "flex", alignItems: "center", gap: 18, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, border: "2px solid rgba(255,255,255,0.3)", flexShrink: 0 }}>{initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 600 }}>My Profile</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 2 }}>{name} </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{role}{dept ? ` · ${dept} Department` : ""}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>{empId}</div>
          <div style={{ fontSize: 10, opacity: 0.6 }}>Employee ID</div>
          <div style={{ marginTop: 8, background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "4px 14px", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} /> Active Employee
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {[
          { icon: "📅", val: presentDays, lbl: "Days Present", bg: "#e0f7fa", ic: TC.teal },
          { icon: "💼", val: activeProj, lbl: "Active Projects", bg: "#dcfce7", ic: TC.green },
          { icon: "✅", val: pendingTasks, lbl: "Tasks Pending", bg: "#fef3c7", ic: TC.amber },
          { icon: "🌴", val: leaveTotal - leaveUsed, lbl: "Leave Days Left", bg: "#dbeafe", ic: TC.blue },
        ].map((s, i) => (
          <div key={i} style={{ ...cardStyle, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
            <div><div style={{ fontSize: 20, fontWeight: 900, color: TC.text }}>{s.val}</div><div style={{ fontSize: 11, color: TC.textSoft, fontWeight: 600 }}>{s.lbl}</div></div>
          </div>
        ))}
      </div>

      {/* Profile + Attendance */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={cardStyle}>
          <div style={headStyle}><div style={titleStyle}>Profile My Profile</div></div>
          <div style={bodyStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[["Full Name", name], ["Employee ID", empId, true], ["Role", role], ["Department", dept || "—"], ["Email", email || "—"], ["Phone", phone || "—"], ["Date Joined", joinDate || "—"], ["Employment", employment]].map(([l, v, teal], i) => (
                <div key={i}><div style={lblStyle}>{l}</div><div style={{ ...valStyle, ...(teal ? { color: TC.teal } : {}) }}>{v}</div></div>
              ))}
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={headStyle}><div style={titleStyle}>Metrics Attendance & Leave</div><span style={{ fontSize: 11, color: TC.textSoft, fontWeight: 700 }}>This Month</span></div>
          <div style={bodyStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
              {[[presentDays, "Present", TC.green], [absentDays, "Absent", TC.red], [leaveDays, "On Leave", TC.amber], [wfhDays, "WFH", TC.blue]].map(([v, l, c], i) => (
                <div key={i} style={{ textAlign: "center", padding: "10px 0", borderRadius: 10, border: `1px solid ${TC.border}` }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: c }}>{v}</div>
                  <div style={{ fontSize: 10, color: TC.textSoft, fontWeight: 600, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
            {[["Attendance Rate", attRate + "%", attRate, TC.green], ["Leave Used", `${leaveUsed} / ${leaveTotal} days`, Math.round((leaveUsed / leaveTotal) * 100), TC.amber]].map(([l, r, pct, c], i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: TC.textMid, marginBottom: 4 }}><span>{l}</span><span>{r}</span></div>
                <div style={{ height: 5, borderRadius: 99, background: "#e5eaf0" }}><div style={{ height: "100%", borderRadius: 99, background: c, width: `${pct}%`, transition: "width 0.5s" }} /></div>
              </div>
            ))}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: TC.text, marginBottom: 8 }}>Document My Leave History</div>
              <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                <thead><tr style={{ borderBottom: `1px solid ${TC.border}` }}>{["TYPE", "DATES", "STATUS"].map(h => <th key={h} style={{ padding: "6px 0", textAlign: "left", color: TC.textSoft, fontWeight: 700, fontSize: 10 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {leaveHistory.length === 0
                    ? <tr><td colSpan={3} style={{ textAlign: "center", color: TC.textSoft, padding: 12 }}>No leave history</td></tr>
                    : leaveHistory.map((a, i) => <tr key={i} style={{ borderBottom: `1px solid ${TC.border}` }}><td style={{ padding: "6px 0" }}>{a.leaveType || "Leave"}</td><td>{a.date}</td><td><span style={{ background: TC.amber + "20", color: TC.amber, padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700 }}>{a.leaveStatus || "Pending"}</span></td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Projects + Tasks + Documents */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {/* Projects */}
        <div style={cardStyle}>
          <div style={headStyle}><div style={titleStyle}>Job My Projects</div><span style={{ fontSize: 12, fontWeight: 800, color: TC.teal }}>{activeProj} active</span></div>
          <div style={{ padding: "8px 18px" }}>
            {projects.slice(0, 4).map((p, i) => {
              const pTasks = tasks.filter(t => {
                const tProjId = t.projectId && typeof t.projectId === 'object' ? t.projectId._id : t.projectId;
                const tProjName = t.projectId && typeof t.projectId === 'object' ? t.projectId.name : t.project;
                return (tProjId && (tProjId === p._id || tProjId === p.id)) || (tProjName && tProjName === p.name);
              });
              const s = (p.status || "").toLowerCase();
              const pct = s === "done" || s === "completed" ? 100 : pTasks.length > 0 ? Math.round((pTasks.filter(t => ["done", "completed"].includes((t.status || "").toLowerCase())).length / pTasks.length) * 100) : s === "in progress" ? 50 : (p.progress || 0);
              return (
                <div key={p._id || i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < Math.min(projects.length, 4) - 1 ? `1px solid ${TC.border}` : "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: TC.teal + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: TC.teal }}>Web</div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700, color: TC.text }}>{p.name}</div><div style={{ fontSize: 10, color: TC.textSoft }}>{role}</div></div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: TC.teal }}>{pct}%</div>
                    <div style={{ fontSize: 10, color: TC.textSoft }}>{p.status || "Pending"}</div>
                    <div style={{ width: 50, height: 3, borderRadius: 99, background: "#e5eaf0", marginTop: 3 }}><div style={{ height: "100%", borderRadius: 99, background: TC.teal, width: `${pct}%` }} /></div>
                  </div>
                </div>
              );
            })}
            {projects.length === 0 && <div style={{ padding: "20px 0", textAlign: "center", color: TC.textSoft, fontSize: 12 }}>No projects assigned</div>}
          </div>
        </div>

        {/* Tasks */}
        <div style={cardStyle}>
          <div style={headStyle}><div style={titleStyle}>Checked My Tasks</div><span style={{ fontSize: 11, color: TC.textSoft, fontWeight: 700 }}>{pendingTasks} pending</span></div>
          <div style={{ borderBottom: `1px solid ${TC.border}`, display: "flex" }}>
            {["All", "Pending", "Done"].map((tab, i) => <button key={tab} style={{ flex: 1, padding: "8px 0", background: "none", border: "none", borderBottom: i === 0 ? `2px solid ${TC.teal}` : "2px solid transparent", fontSize: 11, fontWeight: i === 0 ? 800 : 600, color: i === 0 ? TC.teal : TC.textSoft, cursor: "pointer", fontFamily: "inherit" }}>{tab}</button>)}
          </div>
          <div style={{ padding: "8px 18px" }}>
            {tasks.slice(0, 5).map((t, i, arr) => {
              const isDone = ["done", "completed"].includes((t.status || "").toLowerCase());
              const pri = (t.priority || "low").toLowerCase();
              const priColor = pri === "high" ? "#dc2626" : pri === "medium" || pri === "mid" ? "#d97706" : "#16a34a";
              return (
                <div key={t._id || i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: i < arr.length - 1 ? `1px solid ${TC.border}` : "none" }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${isDone ? TC.green : TC.border}`, background: isDone ? TC.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{isDone && <span style={{ color: "#fff", fontSize: 9 }}>Yes</span>}</div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600, color: isDone ? TC.textSoft : TC.text, textDecoration: isDone ? "line-through" : "none" }}>{t.title}</div><div style={{ fontSize: 10, color: TC.textSoft }}>{t.date || t.dueDate ? `Due: ${t.date || t.dueDate}` : ""}</div></div>
                  <span style={{ background: priColor + "15", color: priColor, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{pri.charAt(0).toUpperCase() + pri.slice(1)}</span>
                </div>
              );
            })}
            {tasks.length === 0 && <div style={{ padding: "20px 0", textAlign: "center", color: TC.textSoft, fontSize: 12 }}>No tasks assigned</div>}
          </div>
        </div>

        {/* Documents */}
        <div style={cardStyle}>
          <div style={headStyle}><div style={titleStyle}>Folder My Documents</div><span style={{ fontSize: 11, color: TC.textSoft, fontWeight: 700 }}>5 files</span></div>
          <div style={bodyStyle}>
            {docItems.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < docItems.length - 1 ? `1px solid ${TC.border}` : "none" }}>
                <span style={{ fontSize: 16 }}>{d.icon}</span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700, color: TC.text }}>{d.name}</div><div style={{ fontSize: 10, color: TC.textSoft }}>{d.meta}</div></div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button style={{ background: "#f0f4f8", border: `1px solid ${TC.border}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 10, fontWeight: 700, color: TC.textMid, fontFamily: "inherit" }}>View View</button>
                  <button style={{ background: TC.teal, border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "#fff", fontSize: 10, fontFamily: "inherit" }}></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PROJECTS PAGE --------------------------------------------

function ProjectsPage({ projects, tasks }) {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const tabs = [
    { key: "all", label: `All (${projects.length})` },
    { key: "active", label: `Active (${projects.filter(p => ["active", "in progress"].includes((p.status || "").toLowerCase())).length})` },
    { key: "review", label: `Review (${projects.filter(p => ["review", "in review"].includes((p.status || "").toLowerCase())).length})` },
    { key: "done", label: `Done (${projects.filter(p => ["done", "completed"].includes((p.status || "").toLowerCase())).length})` },
  ];
  const list = filter === "all" ? projects : projects.filter(p => {
    const s = (p.status || "").toLowerCase();
    if (filter === "active") return s === "active" || s === "in progress";
    if (filter === "review") return s === "review" || s === "in review";
    if (filter === "done") return s === "done" || s === "completed";
    return true;
  });

  if (selected) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}> Back</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: T.text, margin: 0 }}>{selected.name}</h2>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Client: {selected.client || "—"} · Deadline: {selected.deadline || "—"}</div>
          </div>
          <Badge label={selected.status || "active"} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10, marginBottom: 20 }}>
          {(() => {
            const pTasks = tasks.filter(t => {
              const tProjId = t.projectId && typeof t.projectId === 'object' ? t.projectId._id : t.projectId;
              const tProjName = t.projectId && typeof t.projectId === 'object' ? t.projectId.name : t.project;
              return (tProjId && (tProjId === selected._id || tProjId === selected.id)) || (tProjName && tProjName === selected.name);
            });
            const s = (selected.status || "").toLowerCase();
            let pct = 0;
            if (s === "done" || s === "completed") pct = 100;
            else if (pTasks.length > 0) pct = Math.round((pTasks.filter(t => ["done", "completed"].includes((t.status || "").toLowerCase())).length / pTasks.length) * 100);
            else if (s === "in progress") pct = 50;
            else if (s === "on hold") pct = 30;
            else if (s === "pending" || s === "not started") pct = 0;
            else if (s === "review" || s === "in review") pct = 90;
            else pct = (selected.progress || 0);
            return [
              ["Budget", selected.budget || "0"],
              ["Progress", `${pct}%`],
              ["Manager", selected.manager || "Not Assigned"]
            ].map(([k, v]) => (
              <div key={k} style={{ background: T.bg, borderRadius: T.radiusSm, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 10, color: T.textFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{k}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{k === "Budget" ? fmt(v, selected.currency) : v}</div>
              </div>
            ));
          })()}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {(() => {
            const pTasks = tasks.filter(t => {
              const tProjId = t.projectId && typeof t.projectId === 'object' ? t.projectId._id : t.projectId;
              const tProjName = t.projectId && typeof t.projectId === 'object' ? t.projectId.name : t.project;
              return (tProjId && (tProjId === selected._id || tProjId === selected.id)) || (tProjName && tProjName === selected.name);
            });
            const s = (selected.status || "").toLowerCase();
            let pct = 0;
            if (s === "done" || s === "completed") pct = 100;
            else if (pTasks.length > 0) pct = Math.round((pTasks.filter(t => ["done", "completed"].includes((t.status || "").toLowerCase())).length / pTasks.length) * 100);
            else if (s === "in progress") pct = 50;
            else if (s === "on hold") pct = 30;
            else if (s === "pending" || s === "not started") pct = 0;
            else if (s === "review" || s === "in review") pct = 90;
            else pct = (selected.progress || 0);
            return (
              <>
                <div style={{ flex: 1, background: T.bg, borderRadius: 99, height: 8, overflow: "hidden", border: `1px solid ${T.border}` }}>
                  <div style={{ width: `${pct}%`, background: T.accent, height: "100%", borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: T.text, minWidth: 36 }}>{pct}%</span>
              </>
            );
          })()}
        </div>
        {selected.description && <p style={{ marginTop: 16, fontSize: 13, color: T.textMuted, lineHeight: 1.7 }}>{selected.description}</p>}
      </Card>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0 }}>My Projects</h1>
        <p style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>All projects assigned to you</p>
      </div>
      <Card>
        <TabBar tabs={tabs} active={filter} onChange={setFilter} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map((p, i) => (
            <div key={p._id || i} onClick={() => setSelected(p)}
              style={{ background: T.bg, borderRadius: T.radiusSm, border: `1px solid ${T.border}`, padding: "15px 16px", cursor: "pointer", transition: "all 0.18s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Client: {p.client || "—"} · Budget: {fmt(p.budget, p.currency)} · Due: {p.deadline || "—"}</div>
                </div>
                <Badge label={p.status || "active"} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {(() => {
                  const pTasks = tasks.filter(t => {
                    const tProjId = t.projectId && typeof t.projectId === 'object' ? t.projectId._id : t.projectId;
                    const tProjName = t.projectId && typeof t.projectId === 'object' ? t.projectId.name : t.project;
                    return (tProjId && (tProjId === p._id || tProjId === p.id)) || (tProjName && tProjName === p.name);
                  });
                  const s = (p.status || "").toLowerCase();
                  let pct = 0;
                  if (s === "done" || s === "completed") pct = 100;
                  else if (pTasks.length > 0) pct = Math.round((pTasks.filter(t => ["done", "completed"].includes((t.status || "").toLowerCase())).length / pTasks.length) * 100);
                  else if (s === "in progress") pct = 50;
                  else if (s === "on hold") pct = 30;
                  else if (s === "pending" || s === "not started") pct = 0;
                  else if (s === "review" || s === "in review") pct = 90;
                  else pct = (p.progress || 0);
                  return (
                    <>
                      <ProgressBar pct={pct} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, minWidth: 34 }}>{pct}%</span>
                    </>
                  );
                })()}
              </div>
            </div>
          ))}
          {list.length === 0 && <div style={{ textAlign: "center", padding: "2.5rem", color: T.textFaint, fontSize: 13 }}>No projects in this category</div>}
        </div>
      </Card>
    </div>
  );
}

// ── TASKS PAGE -----------------------------------------------

function TasksPage({ tasks, onToggle }) {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const norm = (t) => ({
    ...t,
    _project: t.projectId?.name || t.project || "—",
    _due: t.date || t.dueDate || "—",
    _statusRaw: (t.status || "").toLowerCase(),
    _isDone: ["done", "completed"].includes((t.status || "").toLowerCase()),
  });

  const normalized = tasks.map(norm);
  const tabs = [
    { key: "all", label: `All (${normalized.length})` },
    { key: "in progress", label: `In Progress (${normalized.filter(t => ["in progress", "working on it"].includes(t._statusRaw)).length})` },
    { key: "pending", label: `Pending (${normalized.filter(t => ["pending", "not started"].includes(t._statusRaw)).length})` },
    { key: "done", label: `Done (${normalized.filter(t => t._isDone).length})` },
  ];

  const list = filter === "all" ? normalized : normalized.filter(t => {
    if (filter === "done") return t._isDone;
    if (filter === "in progress") return ["in progress", "working on it"].includes(t._statusRaw);
    if (filter === "pending") return ["pending", "not started"].includes(t._statusRaw);
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0 }}>My Tasks</h1>
        <p style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Tasks assigned to you</p>
      </div>
      <Card>
        <TabBar tabs={tabs} active={filter} onChange={setFilter} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {list.map((t, i) => {
            const isOpen = expanded === t._id;
            return (
              <div key={t._id || i} style={{ background: T.bg, borderRadius: T.radiusSm, border: `1px solid ${isOpen ? T.accent : T.border}`, overflow: "hidden", transition: "border-color 0.18s" }}>
                <div style={{ padding: "13px 14px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div
                    onClick={(e) => { e.stopPropagation(); if (onToggle) onToggle(t); }}
                    style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${t._isDone ? T.success : T.borderDark}`, background: t._isDone ? T.success : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, cursor: "pointer", transition: "all 0.2s" }}>
                    {t._isDone && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>Yes</span>}
                  </div>
                  <div onClick={() => setExpanded(isOpen ? null : t._id)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t._isDone ? T.textFaint : T.text, textDecoration: t._isDone ? "line-through" : "none" }}>{t.title}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 5, alignItems: "center" }}>
                      <Badge label={t.priority || "medium"} />
                      <Badge label={t.status || "pending"} />
                      <span style={{ fontSize: 10, color: T.textFaint }}>Folder {t._project}</span>
                      <span style={{ fontSize: 10, color: T.textFaint }}>⏱ {t._due}</span>
                    </div>
                  </div>
                  <span onClick={() => setExpanded(isOpen ? null : t._id)} style={{ fontSize: 12, color: T.textFaint, transform: isOpen ? "rotate(180deg)" : "rotate(0)", display: "inline-block", transition: "transform 0.2s", cursor: "pointer" }}>▾</span>
                </div>
                {isOpen && (
                  <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${T.border}` }}>
                    {t.description && <p style={{ fontSize: 13, color: T.textMuted, marginTop: 12, lineHeight: 1.6 }}>{t.description}</p>}
                    {t.notes && <p style={{ fontSize: 12, color: T.textMuted, marginTop: 8, lineHeight: 1.5 }}><strong>Notes:</strong> {t.notes}</p>}
                    {t.assignTo && t.assignTo !== "Unassigned" && <p style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>Profile Assigned to: <strong>{t.assignTo}</strong></p>}
                  </div>
                )}
              </div>
            );
          })}
          {list.length === 0 && <div style={{ textAlign: "center", padding: "2.5rem", color: T.textFaint, fontSize: 13 }}>No tasks in this category</div>}
        </div>
      </Card>
    </div>
  );
}

// ── ATTENDANCE PAGE ------------------------------- (ALL LOGIC UNCHANGED)

function AttendancePage({ attendance, setAttendance, empName, notify }) {
  const [activeTab, setActiveTab] = useState("attendance");
  const [leaveForm, setLeaveForm] = useState(false);
  const [leaveType, setLeaveType] = useState("Sick Leave");
  const [leaveFrom, setLeaveFrom] = useState(todayStr());
  const [leaveTo, setLeaveTo] = useState(todayStr());
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [permForm, setPermForm] = useState(false);
  const [permType, setPermType] = useState("late_arrival");
  const [permDate, setPermDate] = useState(todayStr());
  const [permFromTime, setPermFromTime] = useState("09:00");
  const [permToTime, setPermToTime] = useState("10:00");
  const [permReason, setPermReason] = useState("");
  const [permHistory, setPermHistory] = useState([]);
  const [permSubmitting, setPermSubmitting] = useState(false);
  const [marking, setMarking] = useState(false);
  const [addForm, setAddForm] = useState(false);
  const [addDate, setAddDate] = useState(todayStr());
  const [addStatus, setAddStatus] = useState("present");
  const [addNote, setAddNote] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [attSearch, setAttSearch] = useState("");
  const [attMonthFilter, setAttMonthFilter] = useState("");
  const [attFromDate, setAttFromDate] = useState("");
  const [attToDate, setAttToDate] = useState("");
  const [showAdvFilter, setShowAdvFilter] = useState(false);
  const [attFilter, setAttFilter] = useState("all");
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const today = todayStr();
  const thisMonth = today.slice(0, 7);
  const todayRec = attendance.find(a => a.date === today);
  const monthRecs = attendance.filter(a => a.date.startsWith(thisMonth));
  const present = monthRecs.filter(a => a.status === "present").length;
  const absent = monthRecs.filter(a => a.status === "absent").length;
  const leave = monthRecs.filter(a => a.status === "leave").length;

  const FULL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const calDateStr = d => `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const getCalDays = () => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrev = new Date(calYear, calMonth, 0).getDate();
    const cells = [];
    for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, curr: false });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, curr: true });
    while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - firstDay + 1, curr: false });
    return cells;
  };

  const prevCalMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); setSelectedDate(null); };
  const nextCalMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); setSelectedDate(null); };

  const filteredHistory = attendance
    .filter(a => {
      const statusMatch = attFilter === "all" || a.status === attFilter;
      const dateMatch = selectedDate ? a.date === selectedDate : true;
      const searchMatch = !attSearch.trim() || a.date.includes(attSearch.trim());
      const monthMatch = !attMonthFilter || a.date.startsWith(attMonthFilter);
      const fromMatch = !attFromDate || a.date >= attFromDate;
      const toMatch = !attToDate || a.date <= attToDate;
      return statusMatch && dateMatch && searchMatch && monthMatch && fromMatch && toMatch;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const hasActiveFilter = attFilter !== "all" || selectedDate || attSearch || attMonthFilter || attFromDate || attToDate;
  const resetAllFilters = () => { setAttFilter("all"); setSelectedDate(null); setAttSearch(""); setAttMonthFilter(""); setAttFromDate(""); setAttToDate(""); };
  const availableMonths = [...new Set(attendance.map(a => a.date.slice(0, 7)))].sort().reverse();

  useEffect(() => {
    if (!empName) return;
    const enc = encodeURIComponent(empName);
    axios.get(`${BASE}/leave/${enc}`).then(r => { if (r.data?.length) setLeaveHistory(r.data); }).catch(() => { });
    axios.get(`${BASE}/permission/${enc}`).then(r => { if (r.data?.length) setPermHistory(r.data); }).catch(() => { });
  }, [empName]);

  const markAttendance = async (status) => {
    if (todayRec) { notify("Already marked for today", "error"); return; }
    setMarking(true);
    const rec = { date: today, status, employeeName: empName, markedAt: new Date().toISOString() };
    try { await axios.post(`${BASE}/attendance`, rec); } catch (e) { }
    setAttendance(prev => [...prev, rec]);
    notify(`Marked as ${status} Yes`);
    setMarking(false);
  };

  const addAttendance = async () => {
    if (!addDate) return;
    const exists = attendance.find(a => a.date === addDate);
    if (exists) { notify("Attendance already marked for this date", "error"); return; }
    setAddSaving(true);
    const rec = { date: addDate, status: addStatus, employeeName: empName, markedAt: new Date().toISOString(), note: addNote };
    try { await axios.post(`${BASE}/attendance`, rec); } catch (e) { }
    setAttendance(prev => [...prev, { ...rec, _id: `local_${Date.now()}` }]);
    notify(`Attendance added for ${addDate} Yes`);
    setAddForm(false); setAddDate(todayStr()); setAddStatus("present"); setAddNote("");
    setAddSaving(false);
  };

  const submitLeave = async () => {
    if (!leaveReason.trim()) { notify("Please enter a reason", "error"); return; }
    setLeaveSubmitting(true);
    const newLeave = { _id: `leave_${Date.now()}`, type: leaveType, from: leaveFrom, to: leaveTo, reason: leaveReason, employeeName: empName, status: "pending", appliedOn: new Date().toISOString() };
    try { const res = await axios.post(`${BASE}/leave`, newLeave); setLeaveHistory(prev => [{ ...newLeave, ...(res.data?.leave || {}) }, ...prev]); }
    catch { setLeaveHistory(prev => [newLeave, ...prev]); }
    notify("Leave request submitted Yes");
    setLeaveForm(false); setLeaveReason(""); setLeaveType("Sick Leave"); setLeaveFrom(todayStr()); setLeaveTo(todayStr());
    setLeaveSubmitting(false); setActiveTab("leaves");
  };

  const submitPermission = async () => {
    if (!permReason.trim()) { notify("Please enter a reason", "error"); return; }
    setPermSubmitting(true);
    const typeLabel = PERMISSION_TYPES.find(t => t.value === permType)?.label || permType;
    const newPerm = { _id: `perm_${Date.now()}`, type: permType, typeLabel, date: permDate, fromTime: permFromTime, toTime: permToTime, reason: permReason, employeeName: empName, status: "pending", appliedOn: new Date().toISOString() };
    try { const res = await axios.post(`${BASE}/permission`, newPerm); setPermHistory(prev => [{ ...newPerm, ...(res.data?.permission || {}) }, ...prev]); }
    catch { setPermHistory(prev => [newPerm, ...prev]); }
    notify("Permission request submitted Yes");
    setPermForm(false); setPermReason(""); setPermType("late_arrival"); setPermDate(todayStr()); setPermFromTime("09:00"); setPermToTime("10:00");
    setPermSubmitting(false); setActiveTab("permissions");
  };

  const cancelPermission = async (perm) => {
    if ((perm.status || "pending").toLowerCase() !== "pending") { notify("Only pending requests can be cancelled", "error"); return; }
    try { await axios.patch(`${BASE}/permission/${perm._id}/cancel`, { employeeName: empName }); } catch { }
    setPermHistory(prev => prev.map(p => p._id === perm._id ? { ...p, status: "cancelled" } : p));
    notify("Permission request cancelled");
  };

  const pendingLeaves = leaveHistory.filter(l => (l.status || "pending").toLowerCase() === "pending").length;
  const pendingPerms = permHistory.filter(p => (p.status || "pending").toLowerCase() === "pending").length;

  const tabs = [
    { key: "attendance", label: "Attendance" },
    { key: "leaves", label: pendingLeaves > 0 ? `My Leaves (${pendingLeaves})` : "My Leaves" },
    { key: "permissions", label: pendingPerms > 0 ? `Permissions (${pendingPerms})` : "Permissions" },
  ];

  const calDays = getCalDays();

  const filterChips = [
    { key: "all", label: "All", color: T.accent, count: attendance.length },
    { key: "present", label: "Present", color: T.success, count: attendance.filter(a => a.status === "present").length },
    { key: "absent", label: "Absent", color: T.danger, count: attendance.filter(a => a.status === "absent").length },
    { key: "leave", label: "Leave", color: "#b45309", count: attendance.filter(a => a.status === "leave").length },
    { key: "holiday", label: "Holiday", color: T.textMuted, count: attendance.filter(a => a.status === "holiday").length },
  ];

  const btnStyle = (color, bg) => ({ padding: "9px 16px", border: `1px solid ${color}30`, borderRadius: T.radiusSm, background: bg || `${color}10`, fontSize: 12, color, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0 }}>Attendance</h1>
          <p style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Track attendance, apply leave & permission requests</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => { setAddForm(v => !v); setPermForm(false); setLeaveForm(false); setActiveTab("attendance"); }} style={{ background: T.accent, color: "#fff", border: "none", borderRadius: T.radiusSm, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Add Attendance</button>
          <button onClick={() => { setPermForm(v => !v); setLeaveForm(false); setAddForm(false); setActiveTab("attendance"); }} style={{ background: T.surface, color: T.text, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Key Permission</button>
          <button onClick={() => { setLeaveForm(v => !v); setPermForm(false); setAddForm(false); setActiveTab("attendance"); }} style={{ background: T.surface, color: T.text, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: "9px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Holiday Apply Leave</button>
        </div>
      </div>

      {addForm && (
        <Card title="Add Attendance">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }} className="perm-form-grid">
            <InputField label="Date *"><input type="date" value={addDate} onChange={e => setAddDate(e.target.value)} style={inputStyle} /></InputField>
            <InputField label="Status">
              <div style={{ display: "flex", gap: 6 }}>
                {[{ val: "present", label: "Present", color: T.success }, { val: "absent", label: "Absent", color: T.danger }, { val: "leave", label: "Leave", color: "#b45309" }, { val: "holiday", label: "Holiday", color: T.textMuted }].map(opt => (
                  <button key={opt.val} onClick={() => setAddStatus(opt.val)}
                    style={{ flex: 1, padding: "7px 4px", borderRadius: T.radiusSm, border: `1.5px solid ${addStatus === opt.val ? opt.color : T.border}`, background: addStatus === opt.val ? `${opt.color}12` : T.bg, color: addStatus === opt.val ? opt.color : T.textFaint, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </InputField>
            <InputField label="Note"><input value={addNote} onChange={e => setAddNote(e.target.value)} placeholder="e.g. WFH…" style={inputStyle} /></InputField>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => { setAddForm(false); setAddDate(todayStr()); setAddStatus("present"); setAddNote(""); }} style={{ padding: "8px 18px", border: `1px solid ${T.border}`, borderRadius: T.radiusSm, background: T.surface, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: T.text }}>Cancel</button>
            <button onClick={addAttendance} disabled={addSaving} style={{ padding: "8px 20px", background: T.accent, border: "none", borderRadius: T.radiusSm, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: addSaving ? 0.7 : 1 }}>
              {addSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </Card>
      )}

      {permForm && (
        <Card title="Request Permission">
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Permission Type</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }} className="perm-type-grid">
              {PERMISSION_TYPES.map(pt => (
                <div key={pt.value} onClick={() => setPermType(pt.value)}
                  style={{ padding: "10px 12px", borderRadius: T.radiusSm, border: `1.5px solid ${permType === pt.value ? T.accent : T.border}`, background: permType === pt.value ? T.accentLight : T.bg, cursor: "pointer", transition: "all 0.15s" }}>
                  <div style={{ fontSize: 16, marginBottom: 4 }}>{pt.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: permType === pt.value ? T.text : T.textMuted }}>{pt.label}</div>
                  <div style={{ fontSize: 10, color: T.textFaint, marginTop: 2 }}>{pt.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }} className="perm-form-grid">
            <InputField label="Date"><input type="date" value={permDate} onChange={e => setPermDate(e.target.value)} style={inputStyle} /></InputField>
            <InputField label="From Time"><input type="time" value={permFromTime} onChange={e => setPermFromTime(e.target.value)} style={inputStyle} /></InputField>
            <InputField label="To Time"><input type="time" value={permToTime} onChange={e => setPermToTime(e.target.value)} style={inputStyle} /></InputField>
          </div>
          <InputField label="Reason *"><textarea value={permReason} onChange={e => setPermReason(e.target.value)} rows={3} placeholder="Briefly explain your reason…" style={{ ...inputStyle, resize: "vertical" }} /></InputField>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
            <button onClick={() => setPermForm(false)} style={{ padding: "8px 18px", border: `1px solid ${T.border}`, borderRadius: T.radiusSm, background: T.surface, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: T.text }}>Cancel</button>
            <button onClick={submitPermission} disabled={permSubmitting} style={{ padding: "8px 20px", background: T.accent, border: "none", borderRadius: T.radiusSm, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: permSubmitting ? 0.7 : 1 }}>
              {permSubmitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </Card>
      )}

      {leaveForm && (
        <Card title="Apply for Leave">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <InputField label="Leave Type">
              <select value={leaveType} onChange={e => setLeaveType(e.target.value)} style={inputStyle}>
                {["Sick Leave", "Casual Leave", "Earned Leave", "Maternity Leave", "Paternity Leave"].map(o => <option key={o}>{o}</option>)}
              </select>
            </InputField>
            <div />
            <InputField label="From Date"><input type="date" value={leaveFrom} onChange={e => setLeaveFrom(e.target.value)} style={inputStyle} /></InputField>
            <InputField label="To Date"><input type="date" value={leaveTo} onChange={e => setLeaveTo(e.target.value)} style={inputStyle} /></InputField>
            <div style={{ gridColumn: "1/-1" }}>
              <InputField label="Reason *"><textarea value={leaveReason} onChange={e => setLeaveReason(e.target.value)} rows={3} placeholder="Enter reason…" style={{ ...inputStyle, resize: "vertical" }} /></InputField>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
            <button onClick={() => setLeaveForm(false)} style={{ padding: "8px 18px", border: `1px solid ${T.border}`, borderRadius: T.radiusSm, background: T.surface, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: T.text }}>Cancel</button>
            <button onClick={submitLeave} disabled={leaveSubmitting} style={{ padding: "8px 20px", background: T.accent, border: "none", borderRadius: T.radiusSm, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: leaveSubmitting ? 0.7 : 1 }}>
              {leaveSubmitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </Card>
      )}

      <Card>
        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {activeTab === "attendance" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: T.bg, borderRadius: T.radiusSm, padding: "12px 16px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 600 }}>Today — <span style={{ color: T.text, fontWeight: 800 }}>{today}</span></div>
              {todayRec ? (
                <div style={{ background: scBg(todayRec.status), border: `1px solid ${sc(todayRec.status)}30`, borderRadius: T.radiusSm, padding: "7px 14px", fontSize: 12, fontWeight: 700, color: sc(todayRec.status) }}>Yes Marked as {todayRec.status}</div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button disabled={marking} onClick={() => markAttendance("present")} style={btnStyle(T.success)}>Success Present</button>
                  <button disabled={marking} onClick={() => markAttendance("absent")} style={btnStyle(T.danger)}>Error Absent</button>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, alignItems: "start" }} className="att-split">
              {/* Calendar */}
              <div style={{ background: T.bg, borderRadius: T.radiusSm, padding: 16, border: `1px solid ${T.border}`, position: "sticky", top: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <button onClick={prevCalMonth} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, width: 28, height: 28, cursor: "pointer", fontSize: 13, color: T.text, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{FULL_MONTHS[calMonth]} {calYear}</div>
                    {selectedDate && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{selectedDate}<span onClick={() => setSelectedDate(null)} style={{ marginLeft: 6, cursor: "pointer", color: T.textFaint, textDecoration: "underline" }}>Close</span></div>}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => { setCalYear(new Date().getFullYear()); setCalMonth(new Date().getMonth()); setSelectedDate(null); }} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 7px", cursor: "pointer", fontSize: 9, color: T.text, fontWeight: 700 }}>Today</button>
                    <button onClick={nextCalMonth} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, width: 28, height: 28, cursor: "pointer", fontSize: 13, color: T.text, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
                  {DAYS_SHORT.map(d => <div key={d} style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: T.textFaint, letterSpacing: 0.3, padding: "3px 0" }}>{d}</div>)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                  {calDays.map((cell, idx) => {
                    const ds = cell.curr ? calDateStr(cell.day) : null;
                    const rec = cell.curr ? attendance.find(a => a.date === ds) : null;
                    const isToday = ds === today, isSelected = ds === selectedDate;
                    const bg = isSelected ? T.accent : isToday ? T.accentLight : rec ? scBg(rec.status) : T.surface;
                    const textColor = isSelected ? "#fff" : isToday ? T.text : rec ? sc(rec.status) : cell.curr ? T.text : T.textFaint;
                    return (
                      <div key={idx} onClick={() => { if (!cell.curr) return; setSelectedDate(prev => prev === ds ? null : ds); }}
                        style={{ aspectRatio: "1", borderRadius: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: bg, border: isSelected ? `1.5px solid ${T.accent}` : isToday ? `1.5px solid ${T.borderDark}` : rec ? `1px solid ${sc(rec.status)}20` : `1px solid transparent`, cursor: cell.curr ? "pointer" : "default", opacity: cell.curr ? 1 : 0.25, fontSize: 10, fontWeight: isToday || isSelected ? 800 : 600, color: textColor, position: "relative" }}>
                        {cell.day}
                        {rec && !isSelected && <div style={{ width: 3, height: 3, borderRadius: "50%", background: sc(rec.status), position: "absolute", bottom: 3 }} />}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  {[[T.success, "Present"], [T.danger, "Absent"], ["#b45309", "Leave"], [T.textMuted, "Holiday"]].map(([c, l]) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: T.textFaint }}><div style={{ width: 7, height: 7, borderRadius: 2, background: c }} />{l}</div>
                  ))}
                </div>
              </div>

              {/* History */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ background: T.bg, borderRadius: T.radiusSm, border: `1px solid ${T.border}`, padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                    {filterChips.map(chip => {
                      const active = attFilter === chip.key;
                      return (
                        <button key={chip.key} onClick={() => { setAttFilter(chip.key); setSelectedDate(null); }}
                          style={{ padding: "4px 11px", borderRadius: 99, fontSize: 10, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${active ? chip.color : T.border}`, background: active ? `${chip.color}12` : T.surface, color: active ? chip.color : T.textFaint, fontFamily: "inherit", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: active ? chip.color : T.textFaint, display: "inline-block" }} />
                          {chip.label}
                          <span style={{ background: active ? `${chip.color}20` : T.bg, color: active ? chip.color : T.textFaint, borderRadius: 99, padding: "0 5px", fontSize: 9 }}>{chip.count}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <input placeholder="Search date…" value={attSearch} onChange={e => { setAttSearch(e.target.value); setSelectedDate(null); }} style={{ ...inputStyle, flex: 1, minWidth: 130, fontSize: 12, padding: "7px 10px" }} />
                    <select value={attMonthFilter} onChange={e => { setAttMonthFilter(e.target.value); setSelectedDate(null); }} style={{ ...inputStyle, fontSize: 12, padding: "7px 10px", minWidth: 130 }}>
                      <option value="">All Months</option>
                      {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <button onClick={() => setShowAdvFilter(v => !v)} style={{ padding: "7px 11px", borderRadius: T.radiusSm, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", border: `1px solid ${showAdvFilter ? T.accent : T.border}`, background: showAdvFilter ? T.accentLight : T.surface, color: showAdvFilter ? T.text : T.textMuted, whiteSpace: "nowrap" }}>
                      Settings {showAdvFilter ? "Hide" : "Date Range"}
                    </button>
                    {hasActiveFilter && <button onClick={resetAllFilters} style={{ padding: "7px 11px", borderRadius: T.radiusSm, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${T.dangerBorder}`, background: T.dangerBg, color: T.danger, fontFamily: "inherit", whiteSpace: "nowrap" }}>CloseReset</button>}
                  </div>
                  {showAdvFilter && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 700 }}>From:</span>
                      <input type="date" value={attFromDate} onChange={e => { setAttFromDate(e.target.value); setSelectedDate(null); }} style={{ ...inputStyle, fontSize: 12, padding: "7px 10px" }} />
                      <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 700 }}>To:</span>
                      <input type="date" value={attToDate} onChange={e => { setAttToDate(e.target.value); setSelectedDate(null); }} style={{ ...inputStyle, fontSize: 12, padding: "7px 10px" }} />
                      {(attFromDate || attToDate) && <button onClick={() => { setAttFromDate(""); setAttToDate(""); }} style={{ padding: "6px 10px", borderRadius: T.radiusSm, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted, fontFamily: "inherit" }}>Clear</button>}
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{selectedDate ? `Date ${selectedDate} (${filteredHistory.length})` : `History (${filteredHistory.length}${hasActiveFilter ? " filtered" : ""})`}</span>
                  {hasActiveFilter && <span style={{ fontSize: 11, color: T.textMuted }}>from {attendance.length} total</span>}
                </div>

                {filteredHistory.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: T.textFaint, fontSize: 13, background: T.bg, borderRadius: T.radiusSm, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>Document</div>
                    {selectedDate ? `No records for ${selectedDate}` : `No records found`}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 440, overflowY: "auto" }}>
                    {filteredHistory.map((a, i) => {
                      const c = sc(a.status), d = new Date(a.date), dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
                      return (
                        <div key={i} style={{ background: T.surface, borderRadius: T.radiusSm, border: `1px solid ${T.border}`, padding: "11px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ background: scBg(a.status), border: `1px solid ${c}25`, borderRadius: 9, padding: "7px 9px", textAlign: "center", minWidth: 44, flexShrink: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: c, lineHeight: 1 }}>{d.getDate()}</div>
                            <div style={{ fontSize: 8, color: T.textFaint, fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>{["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()].toUpperCase()}</div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{dayName}, {a.date}</span>
                              <Badge label={a.status} />
                            </div>
                            <div style={{ fontSize: 11, color: T.textFaint }}>
                              {a.markedAt ? ` ${new Date(a.markedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "Not marked"}
                              {a.note ? ` · ${a.note}` : ""}
                            </div>
                          </div>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "leaves" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[{ label: "Total", val: leaveHistory.length, color: T.accent }, { label: "Pending", val: leaveHistory.filter(l => (l.status || "pending").toLowerCase() === "pending").length, color: "#b45309" }, { label: "Approved", val: leaveHistory.filter(l => (l.status || "").toLowerCase() === "approved").length, color: T.success }, { label: "Rejected", val: leaveHistory.filter(l => (l.status || "").toLowerCase() === "rejected").length, color: T.danger }].map(({ label, val, color }) => (
                <div key={label} style={{ background: scBg(label.toLowerCase()) || T.accentLight, border: `1px solid ${color}20`, borderRadius: T.radiusSm, padding: "10px 16px", minWidth: 80 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color }}>{val}</div>
                  <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
            {leaveHistory.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: T.textFaint, fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>Holiday</div>No leave requests yet.
              </div>
            ) : leaveHistory.map((lv, i) => {
              const s = (lv.status || "pending").toLowerCase(), sc2 = sc(s);
              const days = lv.from && lv.to ? Math.max(1, Math.round((new Date(lv.to) - new Date(lv.from)) / 86400000) + 1) : 1;
              return (
                <div key={lv._id || i} style={{ background: T.bg, borderRadius: T.radiusSm, border: `1px solid ${T.border}`, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 15 }}>{statusIcon(s)}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{lv.type || "Leave"}</span>
                        <Badge label={s} />
                      </div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: T.textMuted }}>From: <strong style={{ color: T.text }}>{lv.from || "—"}</strong></span>
                        <span style={{ fontSize: 12, color: T.textMuted }}>To: <strong style={{ color: T.text }}>{lv.to || "—"}</strong></span>
                        <span style={{ fontSize: 12, color: T.textMuted }}><strong style={{ color: T.text }}>{days} day{days > 1 ? "s" : ""}</strong></span>
                      </div>
                      {lv.reason && <div style={{ marginTop: 8, fontSize: 12, color: T.textMuted, background: T.surface, borderRadius: T.radiusSm, padding: "7px 10px", border: `1px solid ${T.border}` }}>{lv.reason}</div>}
                      {lv.appliedOn && <div style={{ marginTop: 5, fontSize: 10, color: T.textFaint }}>Applied: {new Date(lv.appliedOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 54 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: scBg(s), border: `1.5px solid ${sc2}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{statusIcon(s)}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: sc2, textTransform: "uppercase", letterSpacing: 0.5 }}>{s}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "permissions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[{ label: "Total", val: permHistory.length, color: T.accent }, { label: "Pending", val: permHistory.filter(p => (p.status || "pending").toLowerCase() === "pending").length, color: "#b45309" }, { label: "Approved", val: permHistory.filter(p => (p.status || "").toLowerCase() === "approved").length, color: T.success }, { label: "Rejected", val: permHistory.filter(p => (p.status || "").toLowerCase() === "rejected").length, color: T.danger }].map(({ label, val, color }) => (
                <div key={label} style={{ background: T.accentLight, border: `1px solid ${color}20`, borderRadius: T.radiusSm, padding: "10px 16px", minWidth: 80 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color }}>{val}</div>
                  <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
            {permHistory.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: T.textFaint, fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>Key</div>No permission requests yet.
              </div>
            ) : permHistory.map((perm, i) => {
              const s = (perm.status || "pending").toLowerCase(), sc2 = sc(s);
              const pt = PERMISSION_TYPES.find(t => t.value === perm.type);
              const isPending = s === "pending";
              return (
                <div key={perm._id || i} style={{ background: T.bg, borderRadius: T.radiusSm, border: `1px solid ${T.border}`, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 18 }}>{pt?.icon || "Edit"}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{perm.typeLabel || pt?.label || perm.type}</span>
                        <Badge label={s} />
                      </div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: T.textMuted }}>Date: <strong style={{ color: T.text }}>{perm.date || "—"}</strong></span>
                        {perm.fromTime && perm.toTime && <span style={{ fontSize: 12, color: T.textMuted }}>{perm.fromTime}  {perm.toTime}</span>}
                      </div>
                      {perm.reason && <div style={{ fontSize: 12, color: T.textMuted, background: T.surface, borderRadius: T.radiusSm, padding: "7px 10px", border: `1px solid ${T.border}`, marginBottom: 5 }}>{perm.reason}</div>}
                      {perm.appliedOn && <div style={{ fontSize: 10, color: T.textFaint }}>Applied: {new Date(perm.appliedOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, minWidth: 54 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: scBg(s), border: `1.5px solid ${sc2}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{statusIcon(s)}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: sc2, textTransform: "uppercase", letterSpacing: 0.5 }}>{s}</div>
                      {isPending && <button onClick={() => cancelPermission(perm)} style={{ fontSize: 10, fontWeight: 700, color: T.danger, background: T.dangerBg, border: `1px solid ${T.dangerBorder}`, borderRadius: 7, padding: "4px 9px", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── SALARY PAGE ----------------------------------------------

function SalaryPage({ salary, user }) {
  const [selected, setSelected] = useState(salary[0] || null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0 }}>Payment History</h1>
        <p style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Your monthly payment breakdown</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, alignItems: "start" }} className="two-col">
        <Card title="Select Month">
          {salary.map((s, i) => (
            <div key={s._id || i} onClick={() => setSelected(s)}
              style={{ padding: "11px 13px", borderRadius: T.radiusSm, cursor: "pointer", background: selected?._id === s._id ? T.accentLight : "transparent", border: selected?._id === s._id ? `1px solid ${T.borderDark}` : "1px solid transparent", marginBottom: 4, transition: "all 0.15s" }}
              onMouseEnter={e => { if (selected?._id !== s._id) e.currentTarget.style.background = T.bg; }}
              onMouseLeave={e => { if (selected?._id !== s._id) e.currentTarget.style.background = "transparent"; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{s.month}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{fmt(s.net)} net</div>
                </div>
                <Badge label={s.status || "paid"} />
              </div>
            </div>
          ))}
          {salary.length === 0 && <div style={{ textAlign: "center", padding: "2rem", color: T.textFaint, fontSize: 13 }}>No records</div>}
        </Card>

        {selected ? (
          <Card>
            <div style={{ background: T.accent, borderRadius: T.radiusSm, padding: "18px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>Payment Slip</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{selected.month}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{user?.name || "Employee"}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{user?.department || "—"}</div>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Earnings</div>
              {[["Basic Salary", selected.basic], ["HRA", selected.hra], ["Allowances", selected.allowances]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 13, color: T.textMuted }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{fmt(v)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", background: T.successBg, borderRadius: T.radiusSm, marginTop: 6, border: `1px solid ${T.successBorder}` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.success }}>Gross Earnings</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: T.success }}>{fmt((selected.basic || 0) + (selected.hra || 0) + (selected.allowances || 0))}</span>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Deductions</div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 13, color: T.textMuted }}>PF + Tax + Others</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.danger }}>- {fmt(selected.deductions)}</span>
              </div>
            </div>
            <div style={{ background: T.accent, borderRadius: T.radiusSm, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 600, letterSpacing: 1 }}>NET PAYMENT</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Paid on {selected.paidOn || "—"}</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>{fmt(selected.net)}</div>
            </div>
            <button onClick={() => window.print()} style={{ marginTop: 12, width: "100%", padding: "10px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 13, color: T.text, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Print / Download Slip
            </button>
          </Card>
        ) : (
          <Card><div style={{ textAlign: "center", padding: "3rem", color: T.textFaint, fontSize: 13 }}>Select a month to view</div></Card>
        )}
      </div>
    </div>
  );
}

// ── PROPOSALS PAGE -------------------------------------------

function ProposalsPage({ proposals }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0 }}>My Proposals</h1>
        <p style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Proposals assigned to you</p>
      </div>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {proposals.map((p, i) => (
            <div key={p._id || i} style={{ background: T.bg, borderRadius: T.radiusSm, border: `1px solid ${T.border}`, padding: "14px 16px", transition: "border-color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Client: {p.client || "No client"} · Slides: {p.slides?.length || 0}</div>
                </div>
                <Badge label={p.status} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => window.location.href = `/project-proposal?edit=${p.id || p._id}`} style={{ background: T.accentLight, color: T.text, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Edit Edit</button>
                <button onClick={() => window.open(`/project-proposal?view=${p._id || p.id}`, "_blank")} style={{ background: T.accentLight, color: T.text, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Print</button>
              </div>
            </div>
          ))}
          {proposals.length === 0 && <div style={{ textAlign: "center", padding: "2.5rem", color: T.textFaint, fontSize: 13 }}>No proposals assigned</div>}
        </div>
      </Card>
    </div>
  );
}

// ── ROOT ------------------------------------------------------

export default function EmployeeDashboard({ user, setUser }) {
  const [page, setPage] = useState(() => localStorage.getItem("activeTab_employee") || "dashboard");
  const [selectedEmpProject, setSelectedEmpProject] = useState(null);
  useEffect(() => { localStorage.setItem("activeTab_employee", page); if (page !== "projects") setSelectedEmpProject(null); }, [page]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [salary, setSalary] = useState([]);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("success");
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(true);

  const [alertDismissedToday, setAlertDismissedToday] = useState(() => {
    try {
      const stored = localStorage.getItem("subAlertDismissedDate");
      return stored === new Date().toDateString();
    } catch { return false; }
  });
  const [subscriptionNotification, setSubscriptionNotification] = useState(null);
  const [notifications, setNotifications] = useState(() => {
    try { const u = JSON.parse(localStorage.getItem("user")); const n = u?.name || ""; const s = localStorage.getItem(`notifications_${n}`); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [hasNotifiedLogin, setHasNotifiedLogin] = useState(() => {
    try { const u = JSON.parse(localStorage.getItem("user")); const n = u?.name || ""; return sessionStorage.getItem(`login_notified_${n}`) === "true"; } catch { return false; }
  });
  const [docStatus, setDocStatus] = useState({});
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [accountAuthOpen, setAccountAuthOpen] = useState(false);
  const [permissions, setPermissions] = useState({});
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropCallback, setCropCallback] = useState(null);
  const [cropAspect, setCropAspect] = useState(1);

  useEffect(() => {
    axios.get(`${BASE_URL}/api/role-permissions`).then(res => { const ep = res.data.find(r => r.role === 'employee'); if (ep) setPermissions(ep.permissions || {}); }).catch(() => { });
  }, []);

  const resolvedUser = user || (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
  if (resolvedUser && !resolvedUser.role) resolvedUser.role = "employee";
  const empName = resolvedUser?.name || "";

  const filteredNav = NAV.filter(item => {
    if (['dashboard', 'settings', 'documents', 'messaging'].includes(item.key)) return true;
    if (Object.keys(permissions).length === 0) return true;
    return permissions[item.key] === true;
  });

  useEffect(() => {
    try { const a = JSON.parse(localStorage.getItem("accounts") || "[]"); setAccounts(a); } catch { setAccounts([]); }
  }, [resolvedUser]);

  useEffect(() => {
    if (!profileDropdownOpen) return;
    const onDown = (e) => { if (e.target?.closest?.('[data-profile-anchor="true"]')) return; if (e.target?.closest?.('[data-profile-menu="true"]')) return; setProfileDropdownOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [profileDropdownOpen]);

  const switchAccount = (account) => { localStorage.setItem("user", JSON.stringify(account)); if (setUser) setUser(account); else window.location.reload(); setProfileDropdownOpen(false); };

  const triggerCrop = (e, callback, aspect = 1) => {
    const file = e.target.files?.[0];
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

  const handleCropComplete = (croppedImage) => {
    setShowCropModal(false);
    if (cropCallback) cropCallback(croppedImage);
  };

  const handleAuthSetUser = (userData) => {
    setAccountAuthOpen(false); setProfileDropdownOpen(false);
    try { let accs = JSON.parse(localStorage.getItem("accounts") || "[]"); const idx = accs.findIndex(a => a.email === userData.email); if (idx !== -1) accs[idx] = userData; else accs.push(userData); localStorage.setItem("accounts", JSON.stringify(accs)); } catch { }
    if (setUser) setUser(userData); else window.location.reload();
  };

  const notify = useCallback((msg, type = "success") => { setToast(msg); setToastType(type); setTimeout(() => setToast(""), 3000); }, []);

  const [events, setEvents] = useState([]);

  const handleLogout = () => { localStorage.removeItem("user"); setDocStatus({}); setProfileOpen(false); if (setUser) setUser(null); else window.location.href = "/"; };

  const addNotification = useCallback((n) => {
    setNotifications(prev => {
      if (prev.find(x => x.id === n.id)) return prev;
      const updated = [{ ...n, isRead: false }, ...prev].slice(0, 50);
      if (empName) localStorage.setItem(`notifications_${empName}`, JSON.stringify(updated.filter(x => !x.isDb)));
      return updated;
    });
  }, [empName]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    if (empName) localStorage.setItem(`notifications_${empName}`, JSON.stringify([]));
    const userId = resolvedUser?._id || resolvedUser?.id;
    if (userId) {
      axios.patch(`${BASE_URL}/api/notifications/read-all/${userId}`, {}, {
        headers: { "x-company-id": resolvedUser?.companyId || "" }
      }).catch(err => console.error("Failed to clear all notifications in DB:", err));
    }
  }, [empName, resolvedUser]);

  const removeNotification = useCallback((id, isDb) => {
    setNotifications(prev => {
      const u = prev.filter(n => n.id !== id);
      if (empName) localStorage.setItem(`notifications_${empName}`, JSON.stringify(u.filter(x => !x.isDb)));
      return u;
    });
    if (isDb) {
      axios.patch(`${BASE_URL}/api/notifications/${id}/read`).catch(err => console.error("Failed to mark notification as read in DB:", err));
    }
  }, [empName]);

  const loadData = useCallback(async (name) => {
    const n = name || empName; if (!n) { setLoading(false); return; }
    const enc = encodeURIComponent(n); const companyId = resolvedUser?.companyId || "";
    const userId = resolvedUser?._id || resolvedUser?.id;
    setLoading(true);
    try {
      const config = { headers: { "x-company-id": companyId } };
      const notifUrl = userId ? `${BASE_URL}/api/notifications/${userId}` : null;
      const [projRes, taskRes, propRes, attRes, salRes, eventRes, notifRes] = await Promise.allSettled([
        axios.get(`${BASE}/projects/${enc}`, config),
        axios.get(`${BASE}/tasks/${enc}`, config),
        axios.get(`${BASE_URL}/api/proposals/employee/${enc}`, config),
        axios.get(`${BASE}/attendance/${enc}`, config),
        axios.get(`${BASE}/salary/${enc}`, config),
        axios.get(`${BASE_URL}/api/events?companyId=${companyId}&employeeName=${enc}`, config),
        notifUrl ? axios.get(notifUrl, config) : Promise.reject(new Error("No user ID"))
      ]);

      if (projRes.status === "fulfilled") {
        const data = projRes.value.data || [];
        setProjects(data);
        const savedProjects = JSON.parse(sessionStorage.getItem(`projects_${n}`) || "[]");
        if (savedProjects.length > 0 && data.length > savedProjects.length) {
          const newProjs = data.filter(p => !savedProjects.find(sp => sp._id === p._id));
          newProjs.forEach(p => addNotification({ id: `proj_${p._id}_${Date.now()}`, type: "project", title: "New Project Assigned", msg: `You have been assigned to "${p.name}"`, icon: "◈", color: T.accent, time: new Date().toISOString() }));
        }
        sessionStorage.setItem(`projects_${n}`, JSON.stringify(data));
      } else setProjects([]);

      if (taskRes.status === "fulfilled") {
        const data = taskRes.value.data || [];
        setTasks(data);
        const savedTasks = JSON.parse(sessionStorage.getItem(`tasks_${n}`) || "[]");
        if (savedTasks.length > 0 && data.length > savedTasks.length) {
          const newTasks = data.filter(t => !savedTasks.find(st => st._id === t._id));
          newTasks.forEach(t => addNotification({ id: `task_${t._id}_${Date.now()}`, type: "task", title: "New Task Assigned", msg: `You have a new task: "${t.title}"`, icon: "Edit", color: T.success, time: new Date().toISOString() }));
        }
        sessionStorage.setItem(`tasks_${n}`, JSON.stringify(data));
      } else setTasks([]);

      if (eventRes.status === "fulfilled") {
        const data = eventRes.value.data || [];
        setEvents(data);
        const savedEvents = JSON.parse(sessionStorage.getItem(`events_${n}`) || "[]");
        if (savedEvents.length > 0 && data.length > savedEvents.length) {
          const newEvents = data.filter(e => !savedEvents.find(se => se._id === e._id));
          newEvents.forEach(e => addNotification({ id: `event_${e._id}_${Date.now()}`, type: "event", title: "New Event / Meeting", msg: `New event: "${e.name}" on ${e.date}`, icon: "Date", color: T.accent, time: new Date().toISOString() }));
        }
        sessionStorage.setItem(`events_${n}`, JSON.stringify(data));
      } else setEvents([]);

      if (notifRes.status === "fulfilled") {
        const dbNotifs = notifRes.value.data || [];
        const mappedDbNotifs = dbNotifs.map(dn => ({
          id: dn._id,
          type: dn.type || "warning",
          title: dn.type === "warning" ? "Document Request" : "Notification",
          msg: dn.text,
          icon: dn.icon || "Folder",
          color: dn.type === "warning" ? T.warning : T.accent,
          time: dn.createdAt || new Date().toISOString(),
          isRead: dn.isRead,
          isDb: true
        }));
        setNotifications(prev => {
          const localOnly = prev.filter(ln => !ln.isDb);
          const combined = [...mappedDbNotifs, ...localOnly];
          combined.sort((a, b) => new Date(b.time) - new Date(a.time));
          return combined;
        });
      }

      if (propRes.status === "fulfilled") setProposals(propRes.value.data || []); else setProposals([]);
      if (attRes.status === "fulfilled") setAttendance(attRes.value.data || []); else setAttendance([]);
      if (salRes.status === "fulfilled") setSalary(salRes.value.data || []); else setSalary([]);
    } catch (err) { console.error("LoadData Error:", err); } finally { setLoading(false); }
  }, [empName, addNotification, resolvedUser]);

  useEffect(() => { if (!empName) return; setDocStatus({}); setProfileOpen(false); loadData(empName); }, [empName]);

  useEffect(() => {
    if (notifDropdownOpen && notifications.some(n => !n.isRead)) {
      setNotifications(prev => { const u = prev.map(n => ({ ...n, isRead: true })); localStorage.setItem(`notifications_${empName}`, JSON.stringify(u.filter(x => !x.isDb))); return u; });
      const userId = resolvedUser?._id || resolvedUser?.id;
      if (userId) {
        axios.patch(`${BASE_URL}/api/notifications/read-all/${userId}`, {}, {
          headers: { "x-company-id": resolvedUser?.companyId || "" }
        }).catch(err => console.error("Failed to mark all notifications as read in DB:", err));
      }
    }
  }, [notifDropdownOpen, notifications, empName, resolvedUser]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (!resolvedUser || !empName) return;
    if (!hasNotifiedLogin) {
      const isAlready = localStorage.getItem(`login_notified_ever_${empName}`) === "true";
      if (!isAlready) {
        addNotification({ id: `login_${Date.now()}`, type: 'login', title: 'Login Successful', msg: `Welcome back, ${resolvedUser.name}!`, icon: '', color: T.success, time: new Date().toISOString() });
        setHasNotifiedLogin(true);
        localStorage.setItem(`login_notified_ever_${empName}`, "true");
      }
    }
    const dob = resolvedUser.dob || resolvedUser.dateOfBirth;
    if (dob) {
      const td = new Date(), bd = new Date(dob);
      if (td.getDate() === bd.getDate() && td.getMonth() === bd.getMonth()) {
        addNotification({ id: `birthday_${empName}_${td.getFullYear()}`, type: 'birthday', title: 'Happy Birthday! ', msg: `Wishing you a fantastic day, ${resolvedUser.name}!`, icon: 'Celebration', color: '#ec4899', time: new Date().toISOString() });
      }
    }
  }, [resolvedUser, empName, hasNotifiedLogin, addNotification]);

  useEffect(() => {
    if (!notifDropdownOpen) return;
    const onDown = (e) => { if (e.target.closest('[data-notif-anchor="true"]')) return; if (e.target.closest('[data-notif-menu="true"]')) return; setNotifDropdownOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [notifDropdownOpen]);

  const fetchSubscription = async () => {
    try {
      setSubLoading(true);
      // Does resolveSubadminId() return the correct ID?
      const id = user?._id || user?.id;
      if (!id) return;

      const res = await axios.get(`${BASE_URL}/api/subscriptions/current/${id}`);
      if (res.data.hasSubscription) {
        setSubscription(res.data.subscription);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubLoading(false);
    }
  };
  const handleDocStatusChange = useCallback((statusMap) => { setDocStatus(statusMap); }, []);

  const handleToggleTask = async (task) => {
    try {
      const newStatus = ["done", "completed"].includes((task.status || "").toLowerCase()) ? "Pending" : "Done";
      await axios.put(`${BASE_URL}/api/tasks/${task._id}`, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
      notify(`Task marked as ${newStatus}`);
    } catch (err) {
      console.error("Toggle Task Error:", err);
      notify("Failed to update task", "error");
    }
  };

  // ── NOTIFICATION DROPDOWN ------------------------------------
  const NotifDropdown = () => (
    <div data-notif-menu="true" style={{ position: "absolute", top: 46, right: 0, width: 310, background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: T.shadowLg, zIndex: 1000, overflow: "hidden" }}>
      <div style={{ padding: "13px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.bg }}>
        <span style={{ fontWeight: 800, fontSize: 13, color: T.text }}>Notifications</span>
        {notifications.length > 0 && <button onClick={clearAllNotifications} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Clear all</button>}
      </div>
      <div style={{ maxHeight: 380, overflowY: "auto" }}>
        {notifications.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: T.textFaint }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>Alert</div>
            <div style={{ fontSize: 12 }}>No new notifications</div>
          </div>
        ) : notifications.map((n, i) => (
          <div key={n.id || i}
            onClick={() => {
              if (n.type === "warning" || n.title?.toLowerCase().includes("document") || n.msg?.toLowerCase().includes("document")) {
                setPage("documents");
              } else if (n.title?.toLowerCase().includes("task") || n.msg?.toLowerCase().includes("task")) {
                setPage("tasks");
              } else if (n.title?.toLowerCase().includes("project") || n.msg?.toLowerCase().includes("project")) {
                setPage("projects");
              }
              setNotifDropdownOpen(false);
            }}
            style={{
              padding: "13px 16px",
              borderBottom: i < notifications.length - 1 ? `1px solid ${T.border}` : "none",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              background: !n.isRead ? T.accentLight : T.surface,
              transition: "background 0.15s",
              cursor: "pointer"
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.bg}
            onMouseLeave={e => e.currentTarget.style.background = !n.isRead ? T.accentLight : T.surface}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: T.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, border: `1px solid ${T.border}` }}>{n.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{n.title}</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2, lineHeight: 1.5 }}>{n.msg}</div>
              <div style={{ fontSize: 10, color: T.textFaint, marginTop: 5 }}>{new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); removeNotification(n.id, n.isDb); }} style={{ background: "none", border: "none", color: T.textFaint, cursor: "pointer", fontSize: 13, padding: 3 }} onMouseEnter={el => el.currentTarget.style.color = T.danger}>Close</button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, position: "relative", fontFamily: "'Sora','DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px;}
        button,input,select,textarea{font-family:inherit;}
        input:focus,textarea:focus,select:focus{border-color:#111!important;outline:none;}
        @media(min-width:769px){
          .emp-sidebar{transform:translateX(0)!important;position:sticky!important;top:0!important;height:100vh!important;}
          .emp-sb-close{display:none!important;} .emp-sb-spacer{display:none!important;} .emp-mob-bar{display:none!important;}
          .emp-desktop-header{display:flex!important;}
        }
        @media(max-width:900px){.two-col{grid-template-columns:1fr!important;} .att-split{grid-template-columns:1fr!important;}}
        @media(max-width:768px){
          .emp-sb-spacer{display:none!important;} .main-pad{padding:14px!important;}
          .stat-grid{grid-template-columns:repeat(2,1fr)!important;}
          .perm-type-grid{grid-template-columns:repeat(2,1fr)!important;}
          .perm-form-grid{grid-template-columns:1fr 1fr!important;}
        }
        @keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
        @media print{.emp-sidebar,.emp-mob-bar,.emp-sb-spacer{display:none!important;}}
      `}</style>

      {loading && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(255,255,255,0.8)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(3px)" }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${T.border}`, borderTop: `3px solid ${T.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar active={page} setActive={setPage} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} user={resolvedUser} navItems={filteredNav} />

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

          {/* Desktop Header */}
          <div className="emp-desktop-header" style={{ display: "none", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", background: T.surface, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 100 }}>
            {/* Page title */}
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: "-0.3px" }}>
              {NAV.find(n => n.key === page)?.label || "Dashboard"}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Notif bell */}
              <div style={{ position: "relative" }} data-notif-anchor="true">
                <button onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, width: 38, height: 38, fontSize: 16, cursor: "pointer", color: T.text, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
                  onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                  <i className="ti ti-bell"></i>
                  {unreadCount > 0 && <span style={{ position: "absolute", top: -3, right: -3, background: T.danger, color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>{unreadCount}</span>}
                </button>
                {notifDropdownOpen && <NotifDropdown />}
              </div>

              <div style={{ width: 1, height: 24, background: T.border }} />

              {/* Profile */}
              <div data-profile-anchor="true" onClick={e => { e.stopPropagation(); setProfileDropdownOpen(v => !v); }}
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "5px 8px", borderRadius: 10, transition: "background 0.15s", border: `1px solid transparent` }}
                onMouseEnter={e => { e.currentTarget.style.background = T.bg; e.currentTarget.style.borderColor = T.border; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{resolvedUser?.name || "Employee"}</div>
                  <div style={{ fontSize: 9, color: T.textFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>{resolvedUser?.role || "Employee"}</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13, border: `2px solid ${T.border}` }}>
                  {(empName || "E").slice(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile topbar */}
          <div className="emp-mob-bar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: T.surface, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 100 }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, cursor: "pointer", color: T.text }}></button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ position: "relative" }} data-notif-anchor="true">
                <button onClick={() => setNotifDropdownOpen(!notifDropdownOpen)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: T.text, position: "relative" }}>
                  <i className="ti ti-bell"></i>
                  {unreadCount > 0 && <span style={{ position: "absolute", top: -2, right: -2, background: T.danger, color: "#fff", borderRadius: "50%", width: 15, height: 15, fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadCount}</span>}
                </button>
                {notifDropdownOpen && <NotifDropdown />}
              </div>
              <div data-profile-anchor="true" onClick={e => { e.stopPropagation(); setProfileDropdownOpen(v => !v); }} style={{ width: 32, height: 32, borderRadius: 9, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
                {(empName || "E").slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Profile dropdown */}
          {profileDropdownOpen && (
            <div data-profile-menu="true" style={{ position: "fixed", top: 58, right: 16, zIndex: 1000, background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: T.shadowLg, overflow: "hidden", minWidth: 210 }}>
              <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.border}`, background: T.bg }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>{(empName || "E").slice(0, 2).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{resolvedUser?.name || "Employee"}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{resolvedUser?.email}</div>
                  </div>

                </div>
              </div>
              {[
                { icon: "👤", label: "Profile", action: () => { setProfileDropdownOpen(false); setPage("myprofile"); } },
                ...(subscription?.businessLimit === "Multiple business manage" ? [{ icon: "Add", label: "Add account", action: () => { setProfileDropdownOpen(false); setAccountAuthOpen(true); } }] : []),
                { icon: "", label: "Logout", action: () => { setProfileDropdownOpen(false); handleLogout(); }, danger: true },
              ].map((item, idx) => (
                <button key={idx} onClick={item.action}
                  style={{ width: "100%", background: "none", border: "none", padding: "10px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", color: item.danger ? T.danger : T.text, display: "flex", alignItems: "center", gap: 10, borderTop: idx > 0 ? `1px solid ${T.border}` : "none", textAlign: "left", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = item.danger ? T.dangerBg : T.bg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ fontSize: 14 }}>{item.icon}</span> {item.label}
                </button>
              ))}
            </div>
          )}

          {/* Main Content */}
          <div className="main-pad" style={{ flex: 1, padding: "22px 28px", overflowY: "auto" }}>
            <EmployeeSubscriptionWarning user={resolvedUser} />
            {page === "dashboard" && <DashboardPage user={resolvedUser} projects={projects} tasks={tasks} proposals={proposals} attendance={attendance} salary={salary} setPage={setPage} docStatus={docStatus} onOpenProfile={() => setProfileOpen(true)} onViewProject={(p) => { setSelectedEmpProject(p); setPage("projects"); }} />}
            {page === "myprofile" && <MyProfilePage user={resolvedUser} projects={projects} tasks={tasks} attendance={attendance} onBack={() => setPage("dashboard")} />}
            {page === "projects" && !selectedEmpProject && <ModernEmployeeProjects projects={projects} tasks={tasks} user={resolvedUser} onViewProject={(p) => setSelectedEmpProject(p)} />}
            {page === "projects" && selectedEmpProject && <ModernEmployeeProjectDetails project={selectedEmpProject} tasks={tasks} user={resolvedUser} onBack={() => setSelectedEmpProject(null)} onMessageTeam={() => setPage("messaging")} />}
            {page === "proposals" && <ProposalsPage proposals={proposals} />}
            {page === "tasks" && <TasksPage tasks={tasks} onToggle={handleToggleTask} />}
            {page === "attendance" && <AttendancePage attendance={attendance} setAttendance={setAttendance} empName={empName} notify={notify} />}
            {(page === "salary" || page === "payments") && <SalaryPage salary={salary} user={resolvedUser} />}
            {page === "calendar" && (
              <CalendarPage
                projects={projects}
                tasks={tasks}
                user={resolvedUser}
                companyId={resolvedUser?.companyId || ""}
                clients={[]}
                onUpdateProject={() => loadData(empName)}
                onUpdateTask={() => loadData(empName)}
                THEME={T}
              />
            )}
            {page === "messaging" && <MessagingPage user={resolvedUser} />}
            {page === "documents" && (
              <EmployeeDocumentsPage
                user={resolvedUser}
                notifications={notifications}
                onAcknowledge={async (notifId) => {
                  try {
                    await axios.patch(`${BASE_URL}/api/notifications/${notifId}/read`);
                    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
                    notify("Request acknowledged successfully!");
                  } catch (err) {
                    console.error("Acknowledge notification error:", err);
                    notify("Failed to acknowledge request", "error");
                  }
                }}
              />
            )}
            {page === "settings" && (
              <SettingsPage
                user={resolvedUser}
                THEME={T}
                triggerCrop={triggerCrop}
                onProfileUpdate={(updates) => {
                  const updated = { ...resolvedUser, ...updates };
                  if (setUser) setUser(updated);
                  localStorage.setItem("user", JSON.stringify(updated));
                }}
              />
            )}
          </div>
        </div>

        <EmployeeProfilePanel empName={empName} user={resolvedUser} notify={notify} onDocStatusChange={handleDocStatusChange} forceOpen={profileOpen} onClose={() => setProfileOpen(false)} THEME={T} />
        <Toast msg={toast} type={toastType} />

        {accountAuthOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 10060 }}>
            <button onClick={() => setAccountAuthOpen(false)} style={{ position: "absolute", top: 16, right: 16, zIndex: 10061, background: "rgba(255,255,255,0.9)", border: `1px solid ${T.border}`, color: T.text, borderRadius: 9, width: 34, height: 34, cursor: "pointer", fontWeight: 900, fontSize: 13 }}>Close</button>
            <AuthPage setUser={handleAuthSetUser} initialTab="login" />
          </div>
        )}
        {showCropModal && (
          <ImageCropModal
            image={cropImage}
            aspect={cropAspect}
            onComplete={handleCropComplete}
            onClose={() => setShowCropModal(false)}
          />
        )}
      </div>
    </div>
  );
}
