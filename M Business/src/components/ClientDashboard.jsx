import { useState, useEffect, useRef } from "react";
import React from "react";
import axios from "axios";
import { BASE_URL } from "../config";
import CalendarPage from "./CalendarPage";
import MessagingPage from "./MessagingPage";
import SettingsPage from "./SettingsPage";
import { T } from "../index";



const sc = (s) => {
  const isDark = document.documentElement.classList.contains('dark-mode') || THEME.bg === 'var(--app-bg)';
  // Simplified logic: sc should just return base colors, the component handles transparency
  return {
    Active: "#10b981", Inactive: "#ef4444", "In Progress": "var(--app-accent)",
    Pending: "#f59e0b", Completed: "#10b981", "On Hold": "#8b5cf6",
    Paid: "#10b981", Overdue: "#ef4444", High: "#ef4444",
    Medium: "#f59e0b", Low: "#10b981", Todo: "#64748b", Done: "#10b981",
    draft: "#64748b", pending: "#f59e0b", approved: "#10b981", rejected: "#ef4444",
    "Pending Approval": "#f59e0b", "Approved": "#10b981", "Rejected": "#ef4444", "Draft": "#64748b",
    part_paid: "var(--app-accent)", partial: "var(--app-accent)"
  }[s] || "var(--app-accent)";
};

const THEME = {
  bg: "#f8fafc",
  sidebar: "#ffffff",
  card: "#ffffff",
  accent: "#6366f1",
  accentSecondary: "#8b5cf6",
  text: "#1e1b4b",
  muted: "#64748b",
  border: "#e2e8f0",
  shadow: "0 10px 40px rgba(0,0,0,0.03)",
  gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)"
};

// ── NAV ───────────────────────────────────────────────────────
const NAV = [{ key: "dashboard", icon: "⌂", label: "Dashboard" },
{ key: "workspace", icon: "📝", label: "Workspace" },
{ key: "projects", icon: "◈", label: "My Projects" },
{ key: "proposals", icon: "📄", label: "Proposals" },
{ key: "quotations", icon: "📜", label: "Quotations" },
{ key: "tasks", icon: "◉", label: "Active Tasks" },
{ key: "payments", icon: "◆", label: "Payments" },
{ key: "calendar", icon: "◷", label: "Calendar" },
{ key: "messaging", icon: "💬", label: "Messages" },
{ key: "reports", icon: "▦", label: "Reports" },
];

const notifColor = (type) => ({ danger: "#ef4444", warning: "#f59e0b", success: "#10b981", info: "#7c6cfa" }[type] || "#7c6cfa");
const notifBg = (type) => ({ danger: "#fef2f2", warning: "#fffbeb", success: "#f0fdf4", info: "#eef2ff" }[type] || "#eef2ff");

// ── NEW: ProjectTimeline — startDate → progress → deadline ─────
function ProjectTimeline({ project }) {
  const { status, progress = 0, startDate, deadline } = project;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadDate = new Date(deadline);
  deadDate.setHours(0, 0, 0, 0);

  const isComplete = status === "Completed";
  const isActuallyOverdue = !isComplete && deadDate < today;
  const isOverdue = project.paymentStatus === "Overdue" || isActuallyOverdue;

  const fillColor = isComplete ? "linear-gradient(90deg, #10b981, #34d399)" : isOverdue ? "linear-gradient(90deg, #ef4444, #f87171)" : status === "Pending" ? "linear-gradient(90deg, #f59e0b, #fbbf24)" : "linear-gradient(90deg, #7c6cfa, #818cf8)";
  const dotColor = isComplete ? "#10b981" : isOverdue ? "#ef4444" : status === "Pending" ? "#f59e0b" : "#7c6cfa";

  return (
    <div style={{ margin: "20px 0 8px", position: "relative" }}>
      <div style={{ position: "relative", height: 8, background: "#f1f5f9", borderRadius: 99, border: "1px solid #e2e8f0" }}>
        <div style={{
          width: `${progress}%`,
          height: "100%",
          background: fillColor,
          borderRadius: 99,
          transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          boxShadow: `0 0 10px ${dotColor}30`
        }}>
          {!isComplete && <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 60, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)", animation: "shimmer 2.5s infinite" }} />}
        </div>
        <div style={{ position: "absolute", top: "50%", left: 0, transform: "translate(-50%,-50%)", width: 14, height: 14, borderRadius: "50%", background: dotColor, border: "3px solid #fff", boxShadow: `0 0 0 4px ${dotColor}20`, zIndex: 2 }} />
        <div style={{ position: "absolute", top: "50%", right: 0, transform: "translate(50%,-50%)", width: 14, height: 14, borderRadius: "50%", background: isComplete ? "#10b981" : "#fff", border: `3px solid ${isComplete ? "#fff" : "#e2e8f0"}`, boxShadow: isComplete ? "0 0 0 4px #10b98120" : "none", zIndex: 2 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Started</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>{startDate || "—"}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: dotColor }}>{isComplete ? "COMPLETED" : `${progress}%`}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontSize: 10, color: isOverdue ? "#ef4444" : "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Deadline</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: isOverdue ? "#ef4444" : "#475569" }}>{deadline || "—"}</span>
        </div>
      </div>
    </div>
  );
}

// ── NEW: PaymentTimeline — issued → due → paid ─────────────────
function PaymentTimeline({ inv }) {
  const fmt = (n) => {
    const val = parseFloat(n) || 0;
    return val >= 100000 ? `₹${(val / 100000).toFixed(2)}L` : `₹${val.toLocaleString("en-IN")}`;
  };

  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const isPaid = inv.status?.toLowerCase() === "paid";
  const isPartPaid = inv.status?.toLowerCase() === "part_paid" || inv.status?.toLowerCase() === "partial" || (inv.status?.toLowerCase() === "draft" && (inv.amountPaid || 0) > 0);

  const dueD = parseLocalDate(inv.due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let overdueDaysVal = 0;
  if (dueD) {
    overdueDaysVal = Math.round((today - dueD) / (1000 * 60 * 60 * 24));
  }

  const isActuallyOverdue = !isPaid && overdueDaysVal > 0;
  const isOverdue = inv.status?.toLowerCase() === "overdue" || isActuallyOverdue;
  const isDueToday = !isPaid && !isOverdue && overdueDaysVal === 0;
  const isPending = !isPaid && !isOverdue && !isDueToday;

  let fillPct = 35;
  if (isPaid) fillPct = 100;
  else if (isPartPaid) fillPct = 75;
  else if (isOverdue) fillPct = 55;
  else if (isDueToday) fillPct = 50;

  const fillColor = isPaid ? "#16a34a" : isPartPaid ? "#7c6cfa" : isOverdue ? "#dc2626" : isDueToday ? "#f59e0b" : "#7c6cfa";

  const overdueDays = isOverdue ? overdueDaysVal : null;
  const dueDiff = (isPending || isDueToday) ? -overdueDaysVal : null;

  const steps = [
    {
      label: "Invoice\nCreated",
      date: inv.date,
      done: true,
      color: isPaid ? "#16a34a" : "#7c6cfa",
      glow: isPaid ? "#dcfce7" : "#eef2ff",
    },
    {
      label: "Due\nDate",
      date: inv.due,
      done: isPaid || isOverdue || isDueToday || isPartPaid,
      color: isPaid ? "#16a34a" : isOverdue ? "#dc2626" : isDueToday ? "#f59e0b" : isPartPaid ? "#7c6cfa" : "#f59e0b",
      glow: isPaid ? "#dcfce7" : isOverdue ? "#fee2e2" : "#fef9c3",
      pulse: isOverdue || isDueToday || (isPending && !isPartPaid),
      isOverdue,
      isDueToday,
    },
    {
      label: isPaid ? "Payment\nCompleted" : isPartPaid ? "Partial\nPayment" : "Payment\nPending",
      date: (isPaid || isPartPaid) ? (inv.paymentDate || inv.paid || "—") : "—",
      done: isPaid || isPartPaid,
      color: isPaid ? "#16a34a" : isPartPaid ? "#7c6cfa" : null,
      glow: isPaid ? "#dcfce7" : isPartPaid ? "#eef2ff" : null,
      dashed: !isPaid && !isPartPaid,
    },
  ];

  const statusMsg = isPaid
    ? (() => {
      const paidDate = inv.paymentDate || inv.paid || inv.due;
      const d = parseLocalDate(paidDate);
      if (!d || !dueD) return "Payment completed";
      const early = Math.round((dueD - d) / (1000 * 60 * 60 * 24));
      return early > 0 ? `Payment completed ${early} days early` : early === 0 ? "Payment completed on due date" : `Payment completed ${Math.abs(early)} days late`;
    })()
    : isPartPaid
      ? `Partially paid — ${fmt(inv.amountPaid || 0)} received. Balance: ${fmt((inv.total || 0) - (inv.amountPaid || 0))}`
      : isOverdue
        ? `Overdue by ${overdueDays || 0} days — immediate action required`
        : dueDiff === 0
          ? "Due today"
          : dueDiff > 0
            ? `Due in ${dueDiff} days`
            : "Due soon";

  const msgColor = isPaid ? "#16a34a" : isOverdue ? "#dc2626" : "#b45309";

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
      <div style={{ display: "flex", alignItems: "flex-start", position: "relative", paddingBottom: 8 }}>
        {/* Track */}
        <div style={{ position: "absolute", top: 14, left: 14, right: 14, height: 3, background: "#f1f5f9", borderRadius: 99, zIndex: 0 }} />
        {/* Fill */}
        <div style={{ position: "absolute", top: 14, left: 14, height: 3, borderRadius: 99, zIndex: 1, transition: "width .8s cubic-bezier(.4,0,.2,1)", width: `${fillPct}%`, background: fillColor }} />

        {steps.map((step, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 2, gap: 6 }}>
            {/* Dot */}
            {step.done ? (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: step.color, boxShadow: `0 0 0 3px ${step.glow}`, display: "flex", alignItems: "center", justifyContent: "center", border: "2.5px solid #fff", flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            ) : step.dashed ? (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#0f1729", border: "2px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>—</span>
              </div>
            ) : step.isOverdue ? (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: step.color, boxShadow: `0 0 0 4px ${step.glow}`, display: "flex", alignItems: "center", justifyContent: "center", border: "2.5px solid #fff", flexShrink: 0, animation: "pulse-red-dot 1.2s ease infinite" }}>
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 2v4M5 8v.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>
              </div>
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#fff", border: `2px solid ${step.color}`, boxShadow: `0 0 0 3px ${step.glow}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: step.color, animation: "pulse-amber-dot 1.5s ease infinite" }} />
              </div>
            )}
            {/* Label */}
            <div style={{ fontSize: 10, fontWeight: 700, textAlign: "center", letterSpacing: 0.3, textTransform: "uppercase", color: step.done ? step.color : isOverdue && i === 1 ? step.color : step.isPending && i === 1 ? "#b45309" : "#94a3b8", lineHeight: 1.3, whiteSpace: "pre-line" }}>
              {step.label}
            </div>
            {/* Date */}
            <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace", textAlign: "center" }}>{step.date}</div>
          </div>
        ))}
      </div>

      {/* Status message */}
      <div style={{ textAlign: "center", fontSize: 11, color: msgColor, fontWeight: 700, marginTop: 2 }}>
        {statusMsg}
      </div>
    </div>
  );
}
// ── Milestone Line (Dashboard overview) ──────────────────────
function MilestoneLine({ tasks, completedTasks }) {
  const steps = [{ label: "Kickoff", pct: 0 }, { label: "Design", pct: 25 }, { label: "Dev", pct: 50 }, { label: "Testing", pct: 75 }, { label: "Launch", pct: 100 }];
  const progress = Math.round(((completedTasks || 0) / (tasks || 1)) * 100);
  const activeIdx = steps.filter(s => progress >= s.pct).length - 1;
  return (
    <div style={{ padding: "8px 0 4px" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: "6%", right: "6%", top: "50%", transform: "translateY(-50%)", height: 3, background: "#e2e8f0", borderRadius: 99, zIndex: 0 }} />
        <div style={{ position: "absolute", left: "6%", top: "50%", transform: "translateY(-50%)", width: `${activeIdx >= 0 ? (activeIdx / (steps.length - 1)) * 88 : 0}%`, height: 3, background: "linear-gradient(90deg,#7c6cfa,#8b5cf6)", borderRadius: 99, zIndex: 1, transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
        {steps.map((step, i) => {
          const done = i <= activeIdx, active = i === activeIdx;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 2 }}>
              <div style={{ width: active ? 20 : 14, height: active ? 20 : 14, borderRadius: "50%", background: done ? (active ? "#7c6cfa" : "#10b981") : "#e2e8f0", border: active ? "3px solid #a89cf7" : done ? "2px solid #6ee7b7" : "2px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.4s", boxShadow: active ? "0 0 0 4px rgba(99,102,241,0.2)" : "none", flexShrink: 0 }}>
                {done && !active && <svg width="7" height="7" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>}
                {active && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
              </div>
              <div style={{ marginTop: 6, fontSize: 9, fontWeight: active ? 700 : 500, color: done ? "#7c6cfa" : "#94a3b8", letterSpacing: 0.5, textTransform: "uppercase" }}>{step.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────
function ProgressBar({ pct, color }) {
  const c = color || (pct === 100 ? "#10b981" : "#7c6cfa");
  return (
    <div style={{ background: "#f1f5f9", borderRadius: 99, height: 6, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, background: `linear-gradient(90deg,${c},${c}bb)`, borderRadius: 99, height: "100%", transition: "width 1s ease" }} />
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────
function Badge({ label, size = "sm" }) {
  const c = sc(label);
  const displayLabel = (label === "part_paid" || label === "partial") ? "Part Payment" : label;
  return (
    <span style={{ background: `${c}15`, color: c, border: `1px solid ${c}30`, padding: size === "sm" ? "2px 8px" : "4px 12px", borderRadius: 20, fontSize: size === "sm" ? 11 : 12, fontWeight: 700, letterSpacing: 0.3, whiteSpace: "nowrap", fontFamily: "'DM Mono',monospace", textTransform: (label === "part_paid" || label === "partial") ? "none" : "capitalize" }}>
      {displayLabel}
    </span>
  );
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, onClick, trend }) {
  return (
    <div onClick={onClick} style={{
      background: `linear-gradient(135deg, #ffffff, #fdfdff)`,
      borderRadius: 28,
      padding: "28px",
      border: `1.5px solid ${THEME.border}`,
      boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      position: "relative",
      overflow: "hidden"
    }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-6px)";
          e.currentTarget.style.boxShadow = `0 20px 40px ${color}15`;
          e.currentTarget.style.borderColor = `${color}40`;
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.02)";
        e.currentTarget.style.borderColor = THEME.border;
      }}>
      <div style={{ position: "absolute", top: -20, right: -20, fontSize: 100, opacity: 0.05, transform: "rotate(-15deg)", pointerEvents: "none" }}>{icon}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          color: "#fff",
          boxShadow: `0 8px 20px ${color}30`
        }}>{icon}</div>
        <div>
          <div style={{ fontSize: 12, color: THEME.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          <div style={{ fontSize: 11, color: THEME.muted, fontWeight: 600 }}>{sub || "Updated just now"}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: THEME.text, letterSpacing: "-1.5px" }}>{value}</div>
        {trend && (
          <div style={{
            fontSize: 11,
            fontWeight: 800,
            color: "#10b981",
            background: "#10b98115",
            padding: "4px 8px",
            borderRadius: 8
          }}>↑ {trend}%</div>
        )}
      </div>
    </div>
  );
}

function NotificationBell({ notifications, onMarkRead, onMarkAllRead, onNavigate, darkMode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(v => !v)}
        style={{
          position: "relative",
          width: 44,
          height: 44,
          borderRadius: 14,
          background: open ? THEME.sidebar : darkMode ? "#1e293b" : "#f8fafc",
          border: `1.5px solid ${open ? THEME.accent : THEME.border}`,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          outline: "none",
          boxShadow: open ? "0 4px 12px rgba(99, 102, 241, 0.15)" : "none"
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = darkMode ? "#334155" : "#fff"; e.currentTarget.style.borderColor = THEME.accent; } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = darkMode ? "#1e293b" : "#f8fafc"; e.currentTarget.style.borderColor = THEME.border; } }}>
        <span style={{ display: "inline-block", animation: unread > 0 ? "bell-ring 2.5s ease-in-out infinite" : "none" }}>🔔</span>
        {unread > 0 && (
          <div style={{ position: "absolute", top: -6, right: -6, minWidth: 20, height: 20, borderRadius: 99, background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "2.5px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#fff", padding: "0 4px", boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3)" }}>
            {unread}
          </div>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 12px)", right: 0, width: 380, maxWidth: "calc(100vw - 32px)", background: THEME.card, backdropFilter: "blur(20px)", borderRadius: 24, border: `1px solid ${THEME.border}`, boxShadow: THEME.shadow, zIndex: 9999, overflow: "hidden", animation: "notif-slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
          <div style={{ padding: "20px 24px", background: "linear-gradient(135deg, #1e293b, #0f172a)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(99, 102, 241, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔔</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: "-0.3px" }}>Notifications</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{unread > 0 ? `${unread} new alerts` : "No new alerts"}</div>
              </div>
            </div>
            {unread > 0 && <button onClick={onMarkAllRead} style={{ background: "rgba(99, 102, 241, 0.2)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: 10, padding: "6px 12px", fontSize: 11, fontWeight: 800, color: "#a89cf7", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(99, 102, 241, 0.3)"}>Clear all</button>}
          </div>
          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {notifications.map((n, i) => {
              const color = notifColor(n.type), bg = notifBg(n.type);
              return (
                <div key={n.id} style={{ padding: "16px 24px", display: "flex", alignItems: "flex-start", gap: 16, background: n.read ? "transparent" : "rgba(99, 102, 241, 0.03)", borderBottom: i < notifications.length - 1 ? "1px solid #f1f5f9" : "none", transition: "all 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(248, 250, 252, 0.8)"}
                  onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : "rgba(99, 102, 241, 0.03)"}>
                  <div style={{ width: 42, height: 42, borderRadius: 14, background: bg, border: `1px solid ${color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, position: "relative", boxShadow: `0 4px 10px ${color}15` }}>
                    {n.icon}
                    {!n.read && <div style={{ position: "absolute", top: -2, right: -2, width: 10, height: 10, borderRadius: "50%", background: color, border: "2.5px solid #fff", animation: "pulse-dot-color 1.8s ease infinite" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: n.read ? 600 : 800, color: n.read ? THEME.muted : THEME.text, lineHeight: 1.5, marginBottom: 6 }}>{n.text}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{n.time}</span>
                      {n.action && <button onClick={() => { onMarkRead(n.id); if (n.actionPage) onNavigate(n.actionPage); setOpen(false); }} style={{ background: "transparent", border: "none", padding: 0, fontSize: 11, fontWeight: 800, color: color, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", textUnderlineOffset: "3px" }}>{n.action}</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "14px 24px", background: "#0f1729", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "center" }}>
            <button onClick={() => { onNavigate("notifications"); setOpen(false); }} style={{ background: "none", border: "none", color: "#7c6cfa", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>View History →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Profile Dropdown ──────────────────────────────────────────
function ProfileDropdown({ user, onLogout, showDetails, darkMode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const [accounts, setAccounts] = useState([]);
  useEffect(() => {
    try {
      const accs = JSON.parse(localStorage.getItem("accounts") || "[]");
      // For clients, only show their own account, not other users' accounts
      const isClient = user?.role === 'client' || user?.userRole === 'client';
      if (isClient) {
        const currentEmail = user?.email;
        setAccounts(accs.filter(acc => acc.email === currentEmail));
      } else {
        setAccounts(accs);
      }
    } catch (e) { }
  }, [open, user]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const switchAccount = (acc) => {
    localStorage.setItem("user", JSON.stringify(acc));
    window.location.reload();
  };

  const activeEmail = user?.email || "";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(v => !v)} style={{ display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", padding: "4px", outline: "none" }}>
        <div style={{
          width: user?.logoUrl ? "auto" : 42,
          height: 42,
          minWidth: 42,
          maxWidth: 120,
          borderRadius: 10,
          background: user?.logoUrl ? "transparent" : "linear-gradient(135deg,#7c6cfa,#a855f7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 900,
          fontSize: 14,
          border: user?.logoUrl ? "none" : "1.5px solid var(--app-border)",
          boxShadow: user?.logoUrl ? "none" : "0 4px 12px rgba(0,0,0,0.06)",
          overflow: "hidden",
          padding: 0,
          flexShrink: 0
        }}>
          {user?.logoUrl ? <img src={user.logoUrl} alt="logo" style={{ height: "100%", width: "auto", objectFit: "contain", display: "block" }} /> : (user?.name || user?.clientName || "C").slice(0, 2).toUpperCase()}
        </div>
        {showDetails && (
          <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: THEME.text, lineHeight: 1 }}>{user?.name || user?.clientName || "User"}</div>
          </div>
        )}
        <div style={{ fontSize: 14, color: THEME.muted }}>▾</div>
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, width: 280, background: THEME.card, borderRadius: 16, border: `1px solid ${THEME.border}`, boxShadow: THEME.shadow, zIndex: 9999, overflow: "hidden", animation: "notif-slide-in 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <div style={{ padding: "14px 18px", background: darkMode ? "#1e293b" : "#f8fafc", borderBottom: `1px solid ${THEME.border}` }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Linked Accounts</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {accounts.map(acc => (
                <div key={acc.email} onClick={() => switchAccount(acc)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", borderRadius: 10, background: activeEmail === acc.email ? "#eef2ff" : "transparent", cursor: activeEmail === acc.email ? "default" : "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { if (activeEmail !== acc.email) e.currentTarget.style.background = "#0f1729"; }}
                  onMouseLeave={e => { if (activeEmail !== acc.email) e.currentTarget.style.background = "transparent"; }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#7c6cfa,var(--app-muted))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                    {(acc.name || acc.clientName || "A").slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{acc.companyName || acc.name || "Company"}</div>
                    <div style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{acc.email}</div>
                  </div>
                  {activeEmail === acc.email && <div style={{ fontSize: 14, color: "#10b981" }}>✓</div>}
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "8px" }}>
            <button onClick={() => window.location.href = "/add-account"} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "transparent", border: "none", borderRadius: 10, color: "#0f172a", fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#0f1729"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", width: 24, color: "#7c6cfa" }}>+</span> Add New Account
            </button>
            <div style={{ height: 1, background: "#f1f5f9", margin: "4px 8px" }} />
            <button onClick={() => { localStorage.removeItem("user"); setOpen(false); window.location.reload(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "transparent", border: "none", borderRadius: 10, color: "#ef4444", fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", width: 24 }}>🚪</span> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────
function SidebarClient({ active, setActive, open, onClose, onLogout, clientUser, navItems, branding, darkMode, setDarkMode }) {
  const initials = (clientUser?.company || "W").slice(0, 2).toUpperCase();
  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)", zIndex: 998 }} />}
      <div style={{
        width: 280,
        background: THEME.sidebar,
        color: THEME.text,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 999,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "10px 0 30px rgba(0,0,0,0.02)",
        borderRight: `1.5px solid ${THEME.border}`
      }} className="client-sidebar">
        <div style={{ padding: "32px 24px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: branding?.logoUrl ? "auto" : 60,
            height: 60,
            minWidth: 60,
            maxWidth: 180,
            background: branding?.logoUrl ? "transparent" : THEME.gradient,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            color: "#fff",
            boxShadow: branding?.logoUrl ? "none" : "0 8px 16px rgba(217, 70, 239, 0.25)",
            overflow: "hidden",
            padding: 0,
            border: "none",
            flexShrink: 0
          }}>
            {branding?.logoUrl ? <img src={branding.logoUrl} alt="logo" style={{ height: "100%", width: "auto", objectFit: "contain", display: "block" }} /> : <span style={{ transform: "rotate(-10deg)" }}>💰</span>}
          </div>
          <div style={{ fontWeight: 900, fontSize: 22, color: THEME.text, letterSpacing: "-1px" }}>
            {branding?.companyName || "M Business"}
          </div>
        </div>

        <nav style={{ flex: 1, padding: "0 16px", overflowY: "auto" }}>
          {(navItems || NAV).map(n => {
            const on = active === n.key;
            return (
              <button key={n.key} onClick={() => { setActive(n.key); onClose(); }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 20px",
                  background: on ? `linear-gradient(135deg, ${THEME.accent}, ${THEME.accent}dd)` : "transparent",
                  border: "none",
                  borderRadius: 20,
                  color: on ? "#fff" : THEME.muted,
                  fontWeight: on ? 900 : 600,
                  fontSize: 15,
                  cursor: "pointer",
                  marginBottom: 6,
                  textAlign: "left",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: on ? `0 10px 20px ${THEME.accent}30` : "none"
                }}
                onMouseEnter={e => { if (!on) { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = THEME.accent; } }}
                onMouseLeave={e => { if (!on) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = THEME.muted; } }}>
                <span style={{ fontSize: 20, width: 24, textAlign: "center", opacity: on ? 1 : 0.7 }}>{n.icon}</span>
                <span style={{ letterSpacing: on ? "0.3px" : "0" }}>{n.label}</span>
              </button>
            );
          })}
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => { if (!on) e.currentTarget.style.background = "#f1f5f9"; }}
                onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontSize: 20, opacity: on ? 1 : 0.7 }}>{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "24px", borderTop: `1.5px solid ${THEME.border}` }}>
          <div
            onClick={() => setDarkMode(!darkMode)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: darkMode ? "#334155" : "#f1f5f9", padding: "12px 16px", borderRadius: 16, cursor: "pointer", transition: "0.3s" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: THEME.muted }}>Dark Mode</div>
            <div style={{ width: 34, height: 18, background: darkMode ? THEME.accent : "#e2e8f0", borderRadius: 99, position: "relative", transition: "0.3s" }}>
              <div style={{ position: "absolute", top: 2, left: darkMode ? 18 : 2, width: 14, height: 14, background: "#fff", borderRadius: "50%", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", transition: "0.3s cubic-bezier(0.4, 0, 0.2, 1)" }} />
            </div>
          </div>
        </div>
      </div>
      <div className="client-sidebar-spacer" style={{ width: 280, flexShrink: 0 }} />
    </>
  );
}

// ── Task Card ─────────────────────────────────────────────────
function TaskCard({ task, onCommentAdded }) {
  const [expanded, setExpanded] = useState(false);
  const [localCommentOpen, setLocalCommentOpen] = useState(false);
  const [comment, setComment] = useState("");
  // Use task.comments as the source of truth if it's an array
  const taskComments = Array.isArray(task.comments) ? task.comments : [];

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      const userStr = localStorage.getItem("user");
      const userData = userStr ? JSON.parse(userStr) : null;
      const userName = userData?.clientName || userData?.name || "Client";

      const res = await axios.post(`${BASE_URL}/api/tasks/${task._id}/comment`, {
        user: userName,
        text: comment.trim()
      });

      setComment("");
      if (onCommentAdded) onCommentAdded(res.data); // Notify parent to update task data
    } catch (err) {
      console.error("Failed to add comment:", err);
      alert("Failed to add comment");
    }
  };

  const done = task.subtasks ? task.subtasks.filter(s => s.done).length : 0;
  const total = task.subtasks ? task.subtasks.length : 0;
  return (
    <div style={{ background: THEME.card, borderRadius: 14, border: `1px solid ${THEME.border}`, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 12 }} onClick={() => setExpanded(!expanded)}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: sc(task.status), marginTop: 5, flexShrink: 0, boxShadow: `0 0 0 3px ${sc(task.status)}20` }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6, textDecoration: task.status === "Done" ? "line-through" : "none", opacity: task.status === "Done" ? 0.6 : 1 }}>{task.title}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Badge label={task.priority} /><Badge label={task.status} />
            <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'DM Mono',monospace" }}>📁 {task.project}</span>
            <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'DM Mono',monospace" }}>⏱ Due {task.due}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{done}/{total} subtasks</span>
          <span style={{ fontSize: 12, color: "#94a3b8", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s", display: "inline-block" }}>▾</span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "0 16px 14px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ marginTop: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>Subtasks ({done}/{total})</div>
            {(task.subtasks || []).map((st, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: i < (task.subtasks.length - 1) ? "1px solid #0f1729" : "none" }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, border: `1.5px solid ${st.done ? "#10b981" : "#cbd5e1"}`, background: st.done ? "#10b981" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {st.done && <svg width="8" height="8" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
                </div>
                <span style={{ fontSize: 12, color: st.done ? "#94a3b8" : "#374151", textDecoration: st.done ? "line-through" : "none" }}>{st.title}</span>
              </div>
            ))}
          </div>
          {total > 0 && <ProgressBar pct={Math.round((done / total) * 100)} />}
          <div style={{ marginTop: 12 }}>
            <button onClick={() => setLocalCommentOpen(!localCommentOpen)} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "#7c6cfa", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
              💬 Comments ({taskComments.length})
            </button>
            {localCommentOpen && (
              <div style={{ marginTop: 8 }}>
                {taskComments.map((c, i) => (
                  <div key={i} style={{ background: "#0f1729", borderRadius: 8, padding: "7px 10px", marginBottom: 6, fontSize: 12, color: "#374151" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, color: "#7c6cfa" }}>{c.user}:</span>
                      <span style={{ fontSize: 9, color: "#94a3b8" }}>{new Date(c.date).toLocaleString()}</span>
                    </div>
                    <div>{c.text}</div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment…"
                    style={{ flex: 1, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "#0f172a", background: "#fff", outline: "none", fontFamily: "inherit" }}
                    onKeyDown={e => { if (e.key === "Enter") handleAddComment(); }} />
                  <button onClick={handleAddComment} style={{ background: "#7c6cfa", border: "none", borderRadius: 8, padding: "7px 12px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Send</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tasks with filter ─────────────────────────────────────────
function TasksFiltered({ tasks, onCommentAdded }) {
  const [filter, setFilter] = useState("All");
  const displayed = filter === "All" ? tasks : tasks.filter(t => t.status === filter);
  return (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {["All", "In Progress", "Pending", "Done"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", border: "1.5px solid", borderColor: filter === f ? "#7c6cfa" : "#e2e8f0", background: filter === f ? "#eef2ff" : "#fff", color: filter === f ? "#7c6cfa" : "#64748b", transition: "all 0.15s" }}>
            {f} <span style={{ opacity: 0.6 }}>({f === "All" ? tasks.length : tasks.filter(t => t.status === f).length})</span>
          </button>
        ))}
      </div>
      {displayed.map(t => <TaskCard key={t.id || t._id} task={t} onCommentAdded={onCommentAdded} />)}
    </>
  );
}

// ── Settings Page ─────────────────────────────────────────────


// ── Notifications Full Page ───────────────────────────────────
function NotificationsPage({ notifications, onMarkRead, onMarkAllRead, onNavigate }) {
  const unread = notifications.filter(n => !n.read).length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "#64748b" }}>{unread} unread</span>
        {unread > 0 && <button onClick={onMarkAllRead} style={{ background: "none", border: "none", color: "#7c6cfa", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Mark all read</button>}
      </div>
      {notifications.map(n => {
        const color = notifColor(n.type), bg = notifBg(n.type);
        return (
          <div key={n.id} onClick={() => onMarkRead(n.id)}
            style={{ background: n.read ? THEME.card : "var(--app-surface)", borderRadius: 12, border: `1px solid ${n.read ? THEME.border : "var(--app-accent)"}30`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f8faff"}
            onMouseLeave={e => e.currentTarget.style.background = n.read ? "#fff" : "#fafafe"}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, border: `1px solid ${color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{n.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: "#0f172a" }}>{n.text}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span>{n.time}</span>
                {n.action && <button onClick={e => { e.stopPropagation(); onMarkRead(n.id); onNavigate(n.actionPage); }} style={{ background: `${color}12`, border: `1px solid ${color}30`, borderRadius: 6, padding: "1px 8px", fontSize: 10, fontWeight: 700, color: color, cursor: "pointer", fontFamily: "inherit" }}>{n.action} →</button>}
              </div>
            </div>
            {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c6cfa", flexShrink: 0, animation: "pulse-dot-color 1.8s ease infinite" }} />}
          </div>
        );
      })}
    </div>
  );
}

// ── WORKSPACE PAGE ───────────────────────────────────────────
function WorkspacePage({ user }) {
  const [notes, setNotes] = useState("");
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const isLoaded = useRef(false);

  useEffect(() => {
    const uid = user?._id || user?.id;
    if (uid && !isLoaded.current) {
      const savedNotes = localStorage.getItem(`client_notes_${uid}`);
      if (savedNotes !== null) setNotes(savedNotes);

      const savedTodos = localStorage.getItem(`client_todos_${uid}`);
      if (savedTodos !== null) {
        try {
          setTodos(JSON.parse(savedTodos));
        } catch (e) {
          setTodos([]);
        }
      }
      isLoaded.current = true;
    }
  }, [user?._id, user?.id]);

  useEffect(() => {
    const uid = user?._id || user?.id;
    if (uid && isLoaded.current) {
      localStorage.setItem(`client_notes_${uid}`, notes);
    }
  }, [notes, user?._id, user?.id]);

  useEffect(() => {
    const uid = user?._id || user?.id;
    if (uid && isLoaded.current) {
      localStorage.setItem(`client_todos_${uid}`, JSON.stringify(todos));
    }
  }, [todos, user?._id, user?.id]);

  const addTodo = () => {
    if (!newTodo.trim()) return;
    setTodos([...todos, { id: Date.now(), text: newTodo, done: false }]);
    setNewTodo("");
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)", gap: 24, animation: "slide-in 0.3s ease" }}>
      {/* Notes Section */}
      <div style={{ background: THEME.card, borderRadius: 24, padding: 28, border: `1.5px solid ${THEME.border}`, boxShadow: THEME.shadow, display: "flex", flexDirection: "column", minHeight: "550px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `${THEME.accent}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📝</div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: THEME.text, letterSpacing: "-0.5px" }}>Personal Notes</h2>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ flex: 1, width: "100%", border: `1.5px solid ${THEME.border}`, borderRadius: 16, padding: 20, fontSize: 15, color: THEME.text, background: "var(--app-surface)", resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.6, transition: "all 0.2s" }}
          onFocus={e => e.target.style.borderColor = THEME.accent}
          onBlur={e => e.target.style.borderColor = THEME.border}
        />
      </div>

      {/* To-do List Section */}
      <div style={{ background: THEME.card, borderRadius: 24, padding: 28, border: `1.5px solid ${THEME.border}`, boxShadow: THEME.shadow, display: "flex", flexDirection: "column", minHeight: "550px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "#10b98115", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: THEME.text, letterSpacing: "-0.5px" }}>Task List</h2>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addTodo()}
            placeholder="Add a quick task..."
            style={{ flex: 1, padding: "14px 18px", border: `1.5px solid ${THEME.border}`, borderRadius: 14, fontSize: 14, outline: "none", background: "#f8fafc", transition: "all 0.2s" }}
            onFocus={e => e.target.style.borderColor = THEME.accent}
            onBlur={e => e.target.style.borderColor = THEME.border}
          />
          <button onClick={addTodo} style={{ background: THEME.gradient, color: "#fff", border: "none", borderRadius: 14, padding: "0 24px", fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 16px rgba(217, 70, 239, 0.2)" }}>Add</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 4 }}>
          {todos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: THEME.muted }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Stay organized! Your tasks will appear here.</div>
            </div>
          ) : (
            todos.map(todo => (
              <div key={todo.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: todo.done ? "var(--app-surface)" : THEME.card, border: `1.5px solid ${todo.done ? "transparent" : THEME.border}`, borderRadius: 16, transition: "0.2s", boxShadow: todo.done ? "none" : "0 2px 4px rgba(0,0,0,0.02)" }}>
                <div
                  onClick={() => toggleTodo(todo.id)}
                  style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${todo.done ? "#10b981" : "#cbd5e1"}`, background: todo.done ? "#10b981" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "0.2s" }}
                >
                  {todo.done && <svg width="12" height="12" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>}
                </div>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: todo.done ? THEME.muted : THEME.text, textDecoration: todo.done ? "line-through" : "none" }}>
                  {todo.text}
                </span>
                <button onClick={() => deleteTodo(todo.id)} style={{ background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: 18, padding: 4 }} onMouseEnter={e => e.target.style.color = "#ef4444"} onMouseLeave={e => e.target.style.color = "#cbd5e1"}>✕</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── MAIN CLIENT DASHBOARD ─────────────────────────────────────
export default function ClientDashboard({ user, setUser }) {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [dashboardEvents, setDashboardEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const clientUser = {
    name: user?.name || user?.clientName || "Client",
    email: user?.email || "",
    company: user?.companyName || user?.company || user?.clientName || user?.name || "Your Business",
    avatar: (user?.companyName || user?.company || user?.clientName || user?.name || "Y").slice(0, 2).toUpperCase(),
    logoUrl: user?.logoUrl || "",
    plan: user?.plan || "Standard",
    role: user?.role || user?.userRole || "Client"
  };

  const [proposals, setProposals] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [branding, setBranding] = useState(null);

  // ── API calls ─────────────────────────────────────────────
  useEffect(() => {
    // Fetch client permissions
    axios.get(`${BASE_URL}/api/role-permissions`)
      .then(res => {
        const clientPerms = res.data.find(r => r.role === 'client');
        if (clientPerms) setPermissions(clientPerms.permissions || {});
      })
      .catch(() => { });
  }, []);

  // Filter NAV based on permissions (show all if permissions not loaded yet)
  const filteredNav = NAV.filter(item => {
    if (item.key === 'dashboard' || item.key === 'settings' || item.key === 'workspace') return true; // Always show
    if (Object.keys(permissions).length === 0) return true; // Show all until permissions load
    return permissions[item.key] === true;
  });

  const refreshData = () => {
    const currentClientName = (user?.name || user?.clientName || user?.client || "").trim();
    const currentCompanyName = (user?.companyName || user?.company || "").trim();
    if (!currentClientName && !currentCompanyName) return;

    const encodedName = encodeURIComponent(currentClientName || currentCompanyName);
    const companyQuery = currentCompanyName ? `?company=${encodeURIComponent(currentCompanyName)}` : "";

    // Headers config with companyId
    const config = {
      headers: {
        "x-company-id": user?.companyId || ""
      }
    };

    if (user?.companyId) {
      axios.get(`${BASE_URL}/api/subadmins/branding/${user.companyId}`)
        .then(res => setBranding(res.data))
        .catch(() => { });
    }

    // Fetch Proposals
    axios.get(`${BASE_URL}/api/proposals/client/${encodedName}${companyQuery}`, config)
      .then(res => {
        if (Array.isArray(res.data)) {
          const clientProposals = res.data.filter(p =>
            ["draft", "pending", "approved", "rejected"].includes(p.status)
          );
          setProposals(clientProposals);
        }
      })
      .catch(err => {
        console.error("Error loading proposals:", err);
        setProposals([]);
      });

    // Fetch Quotations
    axios.get(`${BASE_URL}/api/quotations/client/${encodedName}${companyQuery}`, config)
      .then(res => {
        if (Array.isArray(res.data)) {
          setQuotations(res.data);
        }
      })
      .catch(err => {
        console.error("Error loading quotations:", err);
        setQuotations([]);
      });

    // Fetch Projects
    axios.get(`${BASE_URL}/api/projects/client/${encodedName}${companyQuery}`, config)
      .then(res => {
        if (Array.isArray(res.data)) setProjects(res.data);
      })
      .catch((err) => {
        console.error("Error fetching projects:", err);
      });

    // Fetch Tasks
    axios.get(`${BASE_URL}/api/tasks/client/${encodedName}${companyQuery}`, config)
      .then(res => {
        if (Array.isArray(res.data)) setTasks(res.data);
      })
      .catch(err => console.error("Error fetching tasks:", err));

    // Fetch Invoices
    axios.get(`${BASE_URL}/api/invoices/client/${encodedName}${companyQuery}`, config)
      .then(res => {
        if (Array.isArray(res.data)) {
          const mapped = res.data.map(inv => ({
            ...inv,
            amount: `${inv.currency || "₹"}${(inv.total || 0).toLocaleString("en-IN")}`,
            project: inv.project || "—",
            due: inv.dueDate || inv.date,
          }));
          setPayments(mapped);
        }
      })
      .catch(err => console.error("Error fetching invoices:", err));

    // Fetch Events for notifications
    axios.get(`${BASE_URL}/api/events?companyId=${user?.companyId || ""}`)
      .then(res => {
        if (Array.isArray(res.data)) {
          const clientName = String(user?.name || "").toLowerCase().trim();
          const cName = String(user?.clientName || "").toLowerCase().trim();
          const company = String(user?.company || "").toLowerCase().trim();
          const companyName = String(user?.companyName || "").toLowerCase().trim();

          const clientEvents = res.data.filter(e => {
            if (!e.client) return false;
            const c = String(e.client).toLowerCase().trim();
            return (clientName && c === clientName) ||
              (cName && c === cName) ||
              (company && c === company) ||
              (companyName && c === companyName);
          });
          setDashboardEvents(clientEvents);
        }
      })
      .catch(err => console.error("Error fetching events:", err))
      .finally(() => setLoading(false));

    // Fetch real notifications
    axios.get(`${BASE_URL}/api/notifications/${user?._id || user?.id}`)
      .then(res => {
        if (Array.isArray(res.data)) {
          const mapped = res.data.map(n => ({
            id: n._id,
            type: n.type,
            icon: n.icon,
            text: n.text,
            time: new Date(n.createdAt).toLocaleString(),
            read: n.isRead,
            action: n.link ? "View" : null,
            actionPage: n.link || null
          }));
          setNotifications(mapped);
        }
      })
      .catch(err => console.error("Error fetching notifications:", err));
  };

  useEffect(() => {
    setLoading(true);
    refreshData();
  }, [user]);

  useEffect(() => {
    // Generate some meaningful notifications locally from the data if needed
    // But now we primarily use backend notifications
  }, [projects, tasks, payments, proposals, dashboardEvents, user?._id]);

  // Mark messaging notifications as read when on messaging page
  useEffect(() => {
    if (active === "messaging") {
      const unreadMessaging = notifications.filter(n => !n.read && n.actionPage === "messaging");
      unreadMessaging.forEach(n => markRead(n.id));
    }
  }, [active, notifications]);

  const handleLogout = () => { localStorage.removeItem("user"); if (setUser) setUser(null); };

  const markRead = (id) => {
    axios.patch(`${BASE_URL}/api/notifications/${id}/read`)
      .then(() => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      })
      .catch(err => console.error("Error marking read:", err));
  };

  const markAllRead = () => {
    axios.patch(`${BASE_URL}/api/notifications/read-all/${user?._id || user?.id}`)
      .then(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      })
      .catch(err => console.error("Error marking all read:", err));
  };
  const navigateTo = (pg) => setActive(pg);
  const unread = notifications.filter(n => !n.read).length;
  const page = filteredNav.find(n => n.key === active) || { icon: "⌂", label: "Dashboard" };

  // Live payment totals
  const parseAmt = (s) => parseFloat(String(s || "0").replace(/[^0-9.]/g, "")) || 0;
  const totalInvoiced = payments.reduce((s, p) => s + parseAmt(p.amount), 0);
  const totalPaid = payments.filter(p => p.status?.toLowerCase() === "paid" || p.status?.toLowerCase() === "part_paid").reduce((s, p) => {
    const paidAmt = p.paymentHistory?.reduce((sum, h) => sum + parseAmt(h.amountPaid), 0) || (p.status?.toLowerCase() === "paid" ? parseAmt(p.amount) : 0);
    return s + paidAmt;
  }, 0);
  const totalPending = payments.filter(p => p.status?.toLowerCase() === "pending").reduce((s, p) => s + parseAmt(p.amount), 0);
  const totalOverdue = payments.filter(p => p.status?.toLowerCase() === "overdue").reduce((s, p) => s + parseAmt(p.amount), 0);
  const balanceDue = totalInvoiced - totalPaid;
  const fmt = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${n.toLocaleString("en-IN")}`;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: THEME.bg, color: THEME.text, fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        :root {
          --app-accent: ${darkMode ? '#818cf8' : '#d946ef'};
          --app-accent-rgb: ${darkMode ? '129, 140, 248' : '217, 70, 239'};
          --app-accent-secondary: ${darkMode ? '#6366f1' : '#8b5cf6'};
          --app-bg: ${darkMode ? '#0b0f1a' : '#f8f7ff'};
          --app-sidebar: ${darkMode ? '#111827' : '#ffffff'};
          --app-card: ${darkMode ? '#1e293b' : '#ffffff'};
          --app-text: ${darkMode ? '#f8fafc' : '#1e293b'};
          --app-muted: ${darkMode ? '#94a3b8' : '#64748b'};
          --app-border: ${darkMode ? '#334155' : '#f1f5f9'};
          --app-shadow: ${darkMode ? '0 10px 30px rgba(0,0,0,0.4)' : '0 10px 25px rgba(0,0,0,0.03)'};
          --app-gradient: ${darkMode
          ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
          : 'linear-gradient(135deg, #d946ef 0%, #8b5cf6 100%)'};
          --app-accent-gradient: var(--app-gradient);
          --app-logo-bg: #ffffff;
          --app-surface: ${darkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc'};
        }
        * { box-sizing:border-box; margin:0; padding:0; transition: background 0.3s ease, border-color 0.3s ease; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-thumb { background: ${darkMode ? '#334155' : '#e2e8f0'}; border-radius:10px; }
        button,input,select,textarea { font-family:inherit; outline: none; }
        @keyframes slide-in { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);} }
        @keyframes bell-ring { 0%,85%,100%{transform:rotate(0deg);} 90%{transform:rotate(16deg);} 95%{transform:rotate(-14deg);} }
        @keyframes notif-slide-in { 0%{opacity:0;transform:translateY(-10px) scale(0.97);} 100%{opacity:1;transform:translateY(0) scale(1);} }
        
        .premium-input {
          background: ${darkMode ? '#1e293b' : '#f8fafc'};
          color: ${darkMode ? '#f8fafc' : '#1e293b'};
          border: 1.5px solid var(--app-border);
          border-radius: 14px;
          padding: 12px 16px;
          font-size: 14px;
          transition: all 0.2s;
        }
        .premium-input:focus {
          border-color: ${THEME.accent};
          background: #fff;
          box-shadow: 0 0 0 4px ${THEME.accent}10;
        }

        @media(min-width:769px){
          .client-sidebar{transform:translateX(0)!important;position:sticky!important;top:0!important;height:100vh!important;}
          .sidebar-close-btn{display:none!important;}
          .mob-topbar{display:none!important;}
          .client-sidebar-spacer{display:none!important;}
          .desktop-topbar{display:flex!important;}
        }
        @media(max-width:768px){
          .client-sidebar-spacer{display:none!important;}
          .main-pad{padding:16px!important;}
          .stat-grid{grid-template-columns:1fr!important;}
          .proj-grid{grid-template-columns:1fr!important;}
          .desktop-topbar{display:none!important;}
          .dashboard-main-layout { grid-template-columns: 1fr !important; }
          .dashboard-right-panel { display: none !important; }
        }
      `}</style>

      <SidebarClient
        active={active}
        setActive={setActive}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        clientUser={clientUser}
        navItems={filteredNav}
        branding={branding}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        {/* Mobile topbar */}
        <div className="mob-topbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: THEME.sidebar, borderBottom: `1px solid ${THEME.border}`, position: "sticky", top: 0, zIndex: 100 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: THEME.accentSecondary }}>☰</button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <NotificationBell notifications={notifications} onMarkRead={markRead} onMarkAllRead={markAllRead} onNavigate={navigateTo} darkMode={darkMode} />
            <ProfileDropdown user={user} darkMode={darkMode} />
          </div>
        </div>

        {/* Desktop topbar */}
        <div className="desktop-topbar" style={{ background: THEME.bg, padding: "32px 40px 12px", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: THEME.text, letterSpacing: -1, margin: 0 }}>Dashboard</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: THEME.muted, fontSize: 14 }}>🔍</span>
              <input
                placeholder="Search for anything..."
                className="premium-input"
                style={{ paddingLeft: 38, width: 280, height: 44, background: THEME.card, border: `1.5px solid ${THEME.border}`, color: THEME.text }}
              />
            </div>
            <NotificationBell notifications={notifications} onMarkRead={markRead} onMarkAllRead={markAllRead} onNavigate={navigateTo} darkMode={darkMode} />
            <div style={{ width: 1, height: 32, background: THEME.border, margin: "0 4px" }} />
            <ProfileDropdown user={user} showDetails darkMode={darkMode} />
          </div>
        </div>

        {/* Main content */}
        <div className="main-pad" style={{ flex: 1, padding: "24px 28px", overflowY: "auto", animation: "slide-in 0.3s ease" }}>

          {loading && (
            <div style={{ textAlign: "center", padding: "10px", fontSize: 12, color: "#7c6cfa", marginBottom: 10, background: "#eef2ff", borderRadius: 8 }}>
              ⟳ Loading your data...
            </div>
          )}

          {/* ── DASHBOARD ── */}
          {active === "dashboard" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32 }} className="dashboard-main-layout">
              {/* Left Column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
                  <StatCard icon="💰" label="Total Invoiced" value={fmt(totalInvoiced)} color="#7c6cfa" onClick={() => setActive("payments")} />
                  <StatCard icon="📈" label="Total Paid" value={fmt(totalPaid)} color="#d946ef" onClick={() => setActive("payments")} />
                  <StatCard icon="🛡️" label="Balance Due" value={fmt(balanceDue)} color="#10b981" onClick={() => setActive("projects")} />
                  <StatCard icon="💸" label="Total Pending" value={fmt(totalPending)} color="#ef4444" onClick={() => setActive("payments")} />
                </div>

                {/* Analytics Section */}
           

                {/* Recent Transactions */}
                <div style={{ background: THEME.card, borderRadius: 32, padding: 32, border: `1.5px solid ${THEME.border}`, boxShadow: THEME.shadow }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 900, color: THEME.text }}>Transaction</h2>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12 }}>🔍</span>
                      <input placeholder="Search history..." style={{ padding: "8px 12px 8px 32px", borderRadius: 12, border: `1.5px solid ${THEME.border}`, fontSize: 12, width: 180 }} />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr", padding: "12px 0", borderBottom: `1.5px solid ${THEME.border}`, fontSize: 12, fontWeight: 800, color: THEME.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      <span>Name</span>
                      <span>Date</span>
                      <span>Price</span>
                      <span>Status</span>
                    </div>
                    {payments.slice(0, 3).map(p => (
                      <div key={p.id || p._id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr", padding: "20px 0", borderBottom: `1.5px solid ${THEME.border}`, alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: THEME.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>
                            {String(p.project || "P").slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: THEME.text }}>{p.project}</span>
                        </div>
                        <span style={{ fontSize: 13, color: THEME.muted, fontWeight: 600 }}>{p.date}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: THEME.text }}>{p.amount}</span>
                        <div style={{ display: "flex" }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: sc(p.status), background: `${sc(p.status)}15`, padding: "4px 10px", borderRadius: 8 }}>{p.status || "Pending"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="dashboard-right-panel" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Active Projects Summary */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: THEME.text }}>Projects</h2>
                  <span style={{ fontSize: 12, color: THEME.accent, fontWeight: 800, cursor: "pointer" }} onClick={() => setActive("projects")}>View all</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {projects.slice(0, 3).map(p => (
                    <div key={p.id || p._id} style={{ background: "#fff", borderRadius: 24, padding: 20, border: `1.5px solid ${THEME.border}`, boxShadow: THEME.shadow }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: THEME.text, marginBottom: 4 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: THEME.muted, fontWeight: 600, marginBottom: 12 }}>{p.status}</div>
                      <div style={{ height: 6, background: "#f1f5f9", borderRadius: 99, marginBottom: 8, overflow: "hidden" }}>
                        <div style={{ width: `${p.progress || 0}%`, height: "100%", background: THEME.gradient, borderRadius: 99 }}></div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                        <span style={{ color: THEME.muted, fontWeight: 700 }}>Progress</span>
                        <span style={{ color: THEME.text, fontWeight: 800 }}>{p.progress || 0}%</span>
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <div style={{ padding: 20, textAlign: "center", color: THEME.muted, fontSize: 13, background: "#fff", borderRadius: 24, border: `1.5px solid ${THEME.border}` }}>
                      No active projects.
                    </div>
                  )}
                </div>

                {/* Recent Notifications Quick View */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: THEME.text }}>Notifications</h2>
                    <span style={{ fontSize: 12, color: THEME.accent, fontWeight: 800, cursor: "pointer" }} onClick={() => setActive("notifications")}>See all</span>
                  </div>

                  <div style={{ background: "#fff", borderRadius: 24, padding: 16, border: `1.5px solid ${THEME.border}`, boxShadow: THEME.shadow, display: "flex", flexDirection: "column", gap: 12 }}>
                    {notifications.slice(0, 3).map(n => (
                      <div key={n.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: notifBg(n.type), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{n.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: THEME.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.text}</div>
                          <div style={{ fontSize: 10, color: THEME.muted }}>{n.time}</div>
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && <div style={{ textAlign: "center", fontSize: 12, color: THEME.muted }}>No recent alerts.</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PROJECTS ── */}
          {active === "projects" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: THEME.text }}>Project Progress</h2>
                <div style={{ fontSize: 13, fontWeight: 700, color: THEME.accent }}>{projects.length} Total</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }} className="proj-grid">
                {projects.map(p => (
                  <div key={p.id || p._id} style={{ background: THEME.card, borderRadius: 24, border: `1.5px solid ${THEME.border}`, padding: "24px", boxShadow: THEME.shadow, transition: "all 0.3s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = `${THEME.accent}30`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = THEME.border; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: THEME.text, marginBottom: 4 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: THEME.muted, fontWeight: 600 }}>{p.deadline ? `Due: ${p.deadline}` : "No deadline"}</div>
                      </div>
                      <Badge label={p.status} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
                      <div style={{ background: "#f8fafc", borderRadius: 16, padding: "12px 16px", border: `1px solid ${THEME.border}` }}>
                        <div style={{ fontSize: 10, color: THEME.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Budget</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: THEME.text }}>{p.budget}</div>
                      </div>
                      <div style={{ background: "var(--app-surface)", borderRadius: 16, padding: "12px 16px", border: `1px solid ${THEME.border}` }}>
                        <div style={{ fontSize: 10, color: THEME.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Spent</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: THEME.text }}>{p.spent || "₹0"}</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: THEME.muted }}>Progress</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: THEME.text }}>{p.progress || 0}%</span>
                    </div>
                    <div style={{ height: 8, background: "var(--app-surface)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${p.progress || 0}%`, height: "100%", background: THEME.gradient, borderRadius: 99 }}></div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, paddingTop: 16, borderTop: `1.5px solid ${THEME.border}` }}>
                      <div style={{ fontSize: 12, color: THEME.muted, fontWeight: 600 }}>Tasks: <span style={{ color: THEME.text, fontWeight: 800 }}>{p.completedTasks || 0}/{p.tasks || 0}</span></div>
                      <button onClick={() => setActive("tasks")} style={{ background: "transparent", border: "none", color: THEME.accent, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>View Details →</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PROPOSALS ── */}
          {active === "proposals" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: THEME.text }}>Proposals</h2>
                <div style={{ fontSize: 13, fontWeight: 700, color: THEME.accent }}>{proposals.length} Found</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }} className="proj-grid">
                {proposals.map(p => (
                  <div key={p.id || p._id} style={{ background: THEME.card, borderRadius: 24, border: `1.5px solid ${THEME.border}`, padding: "24px", boxShadow: THEME.shadow, transition: "all 0.3s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = `${THEME.accent}30`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = THEME.border; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: THEME.text }}>{p.title}</div>
                        <div style={{ fontSize: 11, color: THEME.muted, marginTop: 4, fontWeight: 600 }}>{p.id} · {new Date(p.updated).toLocaleDateString()}</div>
                      </div>
                      <Badge label={p.status === "pending" ? "Pending Approval" : p.status === "approved" ? "Approved" : p.status === "rejected" ? "Rejected" : "Draft"} />
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                      <button
                        onClick={() => window.open(`/project-proposal?view=${p._id || p.id}`, "_blank")}
                        style={{ background: THEME.gradient, border: "none", borderRadius: 14, padding: "12px", color: "#fff", fontWeight: 800, cursor: "pointer" }}
                      >View</button>
                      <button
                        onClick={() => window.open(`/project-proposal?view=${p._id || p.id}&print=true`, "_blank")}
                        style={{ background: "var(--app-surface)", border: "none", borderRadius: 14, padding: "12px 20px", color: THEME.text, fontWeight: 800, cursor: "pointer" }}
                      >🖨️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── QUOTATIONS ── */}
          {active === "quotations" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: THEME.text }}>Quotations</h2>
                <div style={{ fontSize: 13, fontWeight: 700, color: THEME.accent }}>{quotations.length} Received</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }} className="proj-grid">
                {quotations.map(q => (
                  <div key={q.id || q._id} style={{ background: THEME.card, borderRadius: 24, border: `1.5px solid ${THEME.border}`, padding: "24px", boxShadow: THEME.shadow, transition: "all 0.3s" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = `${THEME.accent}30`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = THEME.border; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: THEME.text }}>{q.qt?.project || q.project || "Quotation"}</div>
                        <div style={{ fontSize: 11, color: THEME.muted, marginTop: 4, fontWeight: 600 }}>{q.quoteNo} · {q.date ? new Date(q.date).toLocaleDateString() : "—"}</div>
                      </div>
                      <Badge label={q.status} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 20 }}>
                      <div style={{ background: "#f8fafc", borderRadius: 16, padding: "12px 16px", border: `1px solid ${THEME.border}` }}>
                        <div style={{ fontSize: 10, color: THEME.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Total Amount</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: THEME.text }}>
                          {q.qt?.currency || q.currency || "₹"}{(q.total || 0).toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div style={{ background: "#f8fafc", borderRadius: 16, padding: "12px 16px", border: `1px solid ${THEME.border}` }}>
                        <div style={{ fontSize: 10, color: THEME.muted, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Valid Until</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: THEME.text }}>{q.expiryDate || "—"}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const qtData = q.qt || {};
                        const slimPayload = {
                          no: q.quoteNo, date: qtData.date, exp: qtData.expiryDate,
                          co: qtData.companyName || branding?.companyName,
                          email: qtData.companyEmail || branding?.email,
                          phone: qtData.companyPhone || branding?.phone,
                          addr: qtData.companyAddress,
                          cid: user?.companyId || "",
                          cl: q.client || qtData.client, proj: q.project || qtData.project, gst: qtData.gstRate, notes: qtData.notes, terms: qtData.terms,
                          incGst: qtData.isGstIncluded, paid: qtData.amountPaid, upi: qtData.upiId || branding?.upiId || "", cur: qtData.currency,
                          items: (q.items || []).map((i) => ({ d: i.description, q: i.quantity, r: i.rate })),
                        };
                        const d = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(slimPayload)))));
                        window.open(`/quotation-view?d=${d}`, "_blank");
                      }}
                      style={{ width: "100%", background: THEME.gradient, border: "none", borderRadius: 14, padding: "12px", fontSize: 13, color: "#fff", fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 16px rgba(217, 70, 239, 0.2)" }}
                    >
                      View Full Quotation
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}          {/* ── TASKS ── */}
          {active === "tasks" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: THEME.text }}>Task Management</h2>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#10b981", background: "#10b98115", padding: "4px 10px", borderRadius: 8 }}>{tasks.filter(t => t.status === "Done").length} Completed</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: THEME.accent, background: `${THEME.accent}15`, padding: "4px 10px", borderRadius: 8 }}>{tasks.filter(t => t.status !== "Done").length} Pending</div>
                </div>
              </div>

              <div style={{ background: THEME.card, borderRadius: 32, padding: 32, border: `1.5px solid ${THEME.border}`, boxShadow: THEME.shadow }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {tasks.map(t => (
                    <div key={t.id || t._id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", background: "var(--app-surface)", borderRadius: 20, border: `1px solid ${THEME.border}`, transition: "all 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fff"}>
                      <div style={{ width: 24, height: 24, borderRadius: 8, border: `2px solid ${t.status === "Done" ? "#10b981" : THEME.border}`, display: "flex", alignItems: "center", justifyContent: "center", background: t.status === "Done" ? "#10b981" : "transparent" }}>
                        {t.status === "Done" && <span style={{ color: "#fff", fontSize: 14 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: t.status === "Done" ? THEME.muted : THEME.text, textDecoration: t.status === "Done" ? "line-through" : "none" }}>{t.title}</div>
                        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                          <span style={{ fontSize: 11, color: THEME.muted, fontWeight: 600 }}>Project: <span style={{ color: THEME.accent }}>{t.project}</span></span>
                          <span style={{ fontSize: 11, color: THEME.muted, fontWeight: 600 }}>Priority: <span style={{ color: sc(t.priority) }}>{t.priority}</span></span>
                        </div>
                      </div>
                      <Badge label={t.status} />
                    </div>
                  ))}
                  {tasks.length === 0 && <div style={{ textAlign: "center", padding: 40, color: THEME.muted }}>No tasks found for your projects.</div>}
                </div>
              </div>
            </div>
          )}

          {/* ── PAYMENTS ── */}
          {active === "payments" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }} className="stat-grid">
                <StatCard icon="📊" label="Total Invoiced" value={fmt(totalInvoiced)} color="#7c6cfa" />
                <StatCard icon="✅" label="Total Paid" value={fmt(totalPaid)} color="#10b981" />
                <StatCard icon="🚨" label="Balance Due" value={fmt(balanceDue)} color="#ef4444" />
                <StatCard icon="⏳" label="Pending" value={fmt(totalPending + totalOverdue)} color="#f59e0b" />
              </div>

              <div style={{ background: THEME.card, borderRadius: 32, padding: 32, border: `1.5px solid ${THEME.border}`, boxShadow: THEME.shadow }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: THEME.text, marginBottom: 24 }}>Payment History</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {payments.map(inv => (
                    <div key={inv.id || inv._id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px", background: "var(--app-surface)", borderRadius: 24, border: `1px solid ${THEME.border}`, transition: "all 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: inv.status === "Paid" ? "#f0fdf4" : "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                        {inv.status === "Paid" ? "🧾" : "⏳"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: THEME.text }}>{inv.invoiceNo ? `Invoice #${inv.invoiceNo}` : "Invoice"}</div>
                        <div style={{ fontSize: 12, color: THEME.muted, fontWeight: 600 }}>{inv.project} · {inv.date}</div>
                      </div>
                      <div style={{ textAlign: "right", marginRight: 12 }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: THEME.text }}>{inv.currency || "₹"}{(parseFloat(inv.amountPaid || inv.total) || 0).toLocaleString("en-IN")}</div>
                        <Badge label={inv.status} />
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => {
                            const slimPayload = {
                              no: inv.invoiceNo || inv.id || inv._id, date: inv.date, due: inv.due || inv.dueDate,
                              co: inv.companyName || branding?.companyName, email: inv.companyEmail || branding?.email, phone: inv.companyPhone || branding?.phone,
                              addr: inv.companyAddress, cid: user?.companyId || "", cl: inv.client, proj: inv.project, gst: inv.gstRate || 0,
                              notes: inv.notes, terms: inv.terms, incGst: inv.isGstIncluded, paid: inv.amountPaid || 0,
                              upi: inv.upiId || branding?.upiId || "", cur: inv.currency || "₹",
                              items: (inv.items || []).map((i) => ({ d: i.description, q: i.quantity, r: i.rate })),
                              history: inv.paymentHistory || [],
                            };
                            const d = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(slimPayload)))));
                            window.open(`/invoice-view?d=${d}`, "_blank");
                          }}
                          style={{ background: "#fff", border: `1.5px solid ${THEME.border}`, borderRadius: 10, padding: "8px 12px", fontSize: 12, color: THEME.accent, fontWeight: 800, cursor: "pointer" }}
                        >🧾</button>
                        {(inv.amountPaid || 0) > 0 && (
                          <button
                            onClick={() => {
                              const payload = {
                                r: { status: inv.status, client: inv.client, invoiceNo: inv.invoiceNo, total: inv.total },
                                pd: { amountPaid: inv.amountPaid, paymentDate: inv.updatedAt, paymentMode: "Online", transactionId: "" },
                                invData: { companyName: branding?.companyName, currency: inv.currency || "₹", cid: user?.companyId }
                              };
                              const d = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(payload)))));
                              window.open(`/receipt-view?d=${d}`, "_blank");
                            }}
                            style={{ background: "#10b981", border: "none", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#fff", fontWeight: 800, cursor: "pointer" }}
                          >💸</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {active === "calendar" && <CalendarPage projects={projects} tasks={tasks} user={{ ...user, role: 'client' }} onUpdateProject={refreshData} onUpdateTask={refreshData} />}

          {active === "messaging" && <MessagingPage user={user} />}

          {active === "notifications" && (
            <NotificationsPage notifications={notifications} onMarkRead={markRead} onMarkAllRead={markAllRead} onNavigate={navigateTo} />
          )}

          {active === "reports" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "20px", textAlign: "center", background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 40 }}>📊</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Project Reports</div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>
                Detailed activity and financial reports will be generated once your projects have significant activity.
              </div>
            </div>
          )}

          {active === "workspace" && <WorkspacePage user={user} />}

          {active === "settings" && <SettingsPage clientUser={clientUser} />}

        </div>
      </div>
    </div>
  );
}


