import { useState, useEffect, useRef } from "react";
import React from "react";
import axios from "axios";

// ── Theme ──────────────────────────────────────────────────────
const T = {
  primary: "#0f172a",
  accent: "#6366f1",
  accent2: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  bg: "#f8fafc",
  card: "#ffffff",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  sidebar: "#0f172a",
};

const sc = (s) =>
  ({
    Active: "#10b981",
    Inactive: "#ef4444",
    "In Progress": "#6366f1",
    Pending: "#f59e0b",
    Completed: "#10b981",
    "On Hold": "#8b5cf6",
    Paid: "#10b981",
    Overdue: "#ef4444",
    High: "#ef4444",
    Medium: "#f59e0b",
    Low: "#10b981",
    Todo: "#64748b",
    Done: "#10b981",
  }[s] || "#6366f1");

// ── Seed Data ──────────────────────────────────────────────────
const CLIENT_USER = {
  name: "",
  email: "",
  company: "",
  avatar: "",
  plan: "",
};

const MY_PROJECTS = [
  {
    id: "PRJ001",
    name: "Website Redesign",
    status: "In Progress",
    progress: 65,
    deadline: "2024-05-30",
    budget: "₹2,59,600",
    spent: "₹1,68,740",
    manager: "Kiran Dev",
    tasks: 12,
    completedTasks: 8,
  },
  {
    id: "PRJ002",
    name: "Mobile App Dev",
    status: "Pending",
    progress: 15,
    deadline: "2024-08-15",
    budget: "₹5,31,000",
    spent: "₹79,650",
    manager: "Meena Raj",
    tasks: 24,
    completedTasks: 4,
  },
  {
    id: "PRJ003",
    name: "Brand Identity Kit",
    status: "Completed",
    progress: 100,
    deadline: "2024-03-01",
    budget: "₹85,000",
    spent: "₹82,500",
    manager: "Kiran Dev",
    tasks: 8,
    completedTasks: 8,
  },
];

const MY_PAYMENTS = [
  {
    id: "INV001",
    project: "Website Redesign",
    date: "2024-04-01",
    due: "2024-04-30",
    amount: "₹1,47,500",
    status: "Paid",
    method: "UPI",
  },
  {
    id: "INV002",
    project: "Mobile App Dev",
    date: "2024-05-01",
    due: "2024-05-15",
    amount: "₹79,650",
    status: "Overdue",
    method: "—",
  },
  {
    id: "INV003",
    project: "Brand Identity Kit",
    date: "2024-03-10",
    due: "2024-04-10",
    amount: "₹82,500",
    status: "Paid",
    method: "Bank Transfer",
  },
  {
    id: "INV004",
    project: "Website Redesign",
    date: "2024-05-10",
    due: "2024-06-10",
    amount: "₹1,12,100",
    status: "Pending",
    method: "—",
  },
];

const MY_TASKS = [
  {
    id: "TSK001",
    title: "Homepage wireframe review",
    project: "Website Redesign",
    priority: "High",
    status: "Done",
    due: "2024-05-10",
    subtasks: [
      { title: "Desktop layout", done: true },
      { title: "Mobile layout", done: true },
    ],
    comments: 3,
  },
  {
    id: "TSK002",
    title: "UI Component library approval",
    project: "Website Redesign",
    priority: "High",
    status: "In Progress",
    due: "2024-05-22",
    subtasks: [
      { title: "Color palette sign-off", done: true },
      { title: "Typography review", done: false },
      { title: "Icon set approval", done: false },
    ],
    comments: 7,
  },
  {
    id: "TSK003",
    title: "App feature requirements doc",
    project: "Mobile App Dev",
    priority: "Medium",
    status: "In Progress",
    due: "2024-05-28",
    subtasks: [
      { title: "Core features list", done: true },
      { title: "User flow diagrams", done: false },
    ],
    comments: 2,
  },
  {
    id: "TSK004",
    title: "Brand color palette selection",
    project: "Brand Identity Kit",
    priority: "Low",
    status: "Done",
    due: "2024-02-15",
    subtasks: [{ title: "Primary palette", done: true }],
    comments: 5,
  },
  {
    id: "TSK005",
    title: "Content delivery for About page",
    project: "Website Redesign",
    priority: "Medium",
    status: "Pending",
    due: "2024-06-05",
    subtasks: [
      { title: "Write copy", done: false },
      { title: "Provide photos", done: false },
    ],
    comments: 1,
  },
];

const MY_EVENTS = [
  {
    id: "EVT001",
    title: "Design Review Call",
    project: "Website Redesign",
    date: "2024-05-20",
    time: "10:00 – 11:30",
    type: "Meeting",
  },
  {
    id: "EVT002",
    title: "Payment Due",
    project: "Mobile App Dev",
    date: "2024-05-15",
    time: "EOD",
    type: "Payment",
  },
  {
    id: "EVT003",
    title: "App Demo Session",
    project: "Mobile App Dev",
    date: "2024-05-22",
    time: "14:00 – 15:30",
    type: "Demo",
  },
  {
    id: "EVT004",
    title: "Feedback Submission",
    project: "Website Redesign",
    date: "2024-05-25",
    time: "EOD",
    type: "Deadline",
  },
];

const NOTIFICATIONS = [
  {
    id: 1,
    icon: "🔔",
    text: "Invoice INV002 is overdue by 10 days",
    time: "2h ago",
    type: "warning",
    read: false,
  },
  {
    id: 2,
    icon: "✅",
    text: "Task 'Homepage wireframe' marked complete",
    time: "5h ago",
    type: "success",
    read: false,
  },
  {
    id: 3,
    icon: "💬",
    text: "Kiran Dev commented on Website Redesign",
    time: "1d ago",
    type: "info",
    read: true,
  },
  {
    id: 4,
    icon: "📁",
    text: "New project Mobile App Dev assigned to you",
    time: "3d ago",
    type: "info",
    read: true,
  },
];

const MY_REPORTS = [
  {
    id: "RPT001",
    title: "Q1 Project Summary",
    range: "Jan–Mar 2024",
    projects: 3,
    revenue: "₹3,29,750",
    status: "Ready",
  },
  {
    id: "RPT002",
    title: "April Activity",
    range: "Apr 2024",
    projects: 2,
    revenue: "₹2,59,600",
    status: "Ready",
  },
];

// ── NAV ───────────────────────────────────────────────────────
const NAV = [
  { key: "dashboard", icon: "⌂", label: "Dashboard" },
  { key: "projects", icon: "◈", label: "My Projects" },
  { key: "tasks", icon: "◉", label: "Active Tasks" },
  { key: "payments", icon: "◆", label: "Payments" },
  { key: "calendar", icon: "◷", label: "Calendar" },
  { key: "notifications", icon: "◎", label: "Notifications" },
  { key: "reports", icon: "▦", label: "Reports" },
  { key: "settings", icon: "◌", label: "Settings" },
];

// ── Badge ────────────────────────────────────────────────────
function Badge({ label, size = "sm" }) {
  const c = sc(label);
  return (
    <span
      style={{
        background: `${c}15`,
        color: c,
        border: `1px solid ${c}30`,
        padding: size === "sm" ? "2px 8px" : "4px 12px",
        borderRadius: 20,
        fontSize: size === "sm" ? 11 : 12,
        fontWeight: 700,
        letterSpacing: 0.3,
        whiteSpace: "nowrap",
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {label}
    </span>
  );
}

// ── Progress Bar ─────────────────────────────────────────────
function ProgressBar({ pct, animate = true, color }) {
  const c = color || (pct === 100 ? "#10b981" : "#6366f1");
  return (
    <div
      style={{
        background: "#f1f5f9",
        borderRadius: 99,
        height: 6,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${c}, ${c}bb)`,
          borderRadius: 99,
          height: "100%",
          transition: "width 1s ease",
          position: "relative",
        }}
      >
        {animate && pct < 100 && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 24,
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.6))",
              animation: "shimmer 1.6s ease-in-out infinite",
            }}
          />
        )}
      </div>
    </div>
  );
}

// ── Animated Milestone Line (Flipkart-style) ─────────────────
function MilestoneLine({ tasks, completedTasks }) {
  const steps = [
    { label: "Kickoff", pct: 0 },
    { label: "Design", pct: 25 },
    { label: "Dev", pct: 50 },
    { label: "Testing", pct: 75 },
    { label: "Launch", pct: 100 },
  ];
  const progress = Math.round((completedTasks / tasks) * 100);
  const activeIdx = steps.filter((s) => progress >= s.pct).length - 1;

  return (
    <div style={{ padding: "8px 0 4px" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {/* Track */}
        <div
          style={{
            position: "absolute",
            left: "6%",
            right: "6%",
            top: "50%",
            transform: "translateY(-50%)",
            height: 3,
            background: "#e2e8f0",
            borderRadius: 99,
            zIndex: 0,
          }}
        />
        {/* Fill */}
        <div
          style={{
            position: "absolute",
            left: "6%",
            top: "50%",
            transform: "translateY(-50%)",
            width: `${activeIdx >= 0 ? (activeIdx / (steps.length - 1)) * 88 : 0}%`,
            height: 3,
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            borderRadius: 99,
            zIndex: 1,
            transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
        {/* Steps */}
        {steps.map((step, i) => {
          const done = i <= activeIdx;
          const active = i === activeIdx;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div
                style={{
                  width: active ? 20 : 14,
                  height: active ? 20 : 14,
                  borderRadius: "50%",
                  background: done
                    ? active
                      ? "#6366f1"
                      : "#10b981"
                    : "#e2e8f0",
                  border: active
                    ? "3px solid #a5b4fc"
                    : done
                    ? "2px solid #6ee7b7"
                    : "2px solid #cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.4s",
                  boxShadow: active
                    ? "0 0 0 4px rgba(99,102,241,0.2)"
                    : "none",
                  animation: active ? "pulse-dot 1.8s ease infinite" : "none",
                  flexShrink: 0,
                }}
              >
                {done && !active && (
                  <svg width="7" height="7" viewBox="0 0 10 10">
                    <path
                      d="M2 5l2.5 2.5L8 3"
                      stroke="#fff"
                      strokeWidth="1.8"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {active && (
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#fff",
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 9,
                  fontWeight: active ? 700 : 500,
                  color: done ? "#6366f1" : "#94a3b8",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "20px 18px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.2s, box-shadow 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.12)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow =
          "0 1px 3px rgba(0,0,0,0.06)";
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}18, transparent)`,
        }}
      />
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          marginBottom: 12,
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────
function SidebarClient({ active, setActive, open, onClose, onLogout, clientUser, unread }) {
  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 998,
          }}
        />
      )}
      <div
        style={{
          width: 220,
          background: T.sidebar,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 999,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: "4px 0 32px rgba(0,0,0,0.18)",
        }}
        className="client-sidebar"
      >
        {/* Logo */}
        <div
          style={{
            padding: "24px 20px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                fontWeight: 900,
                color: "#fff",
              }}
            >
              C
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: "#fff", letterSpacing: -0.3 }}>
                ClientHub
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5 }}>
                PORTAL
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="sidebar-close-btn"
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.3)",
              fontSize: 16,
              cursor: "pointer",
              padding: "2px 4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Client Info */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg,#6366f1,#a78bfa)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {CLIENT_USER.avatar}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {CLIENT_USER.name}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                {CLIENT_USER.company}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 10px", overflowY: "auto" }}>
          {NAV.map((n) => {
            const on = active === n.key;
            const isNotif = n.key === "notifications";
            return (
              <button
                key={n.key}
                onClick={() => {
                  setActive(n.key);
                  onClose();
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  background: on
                    ? "rgba(99,102,241,0.2)"
                    : "transparent",
                  border: on
                    ? "1px solid rgba(99,102,241,0.35)"
                    : "1px solid transparent",
                  borderRadius: 10,
                  color: on ? "#a5b4fc" : "rgba(255,255,255,0.4)",
                  fontWeight: on ? 700 : 400,
                  fontSize: 12.5,
                  cursor: "pointer",
                  marginBottom: 2,
                  textAlign: "left",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!on) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  if (!on) e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ fontSize: 14, opacity: on ? 1 : 0.6 }}>{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
                {isNotif && unread > 0 && (
                  <span
                    style={{
                      background: "#ef4444",
                      color: "#fff",
                      borderRadius: 99,
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "1px 6px",
                      minWidth: 16,
                      textAlign: "center",
                    }}
                  >
                    {unread}
                  </span>
                )}
                {on && (
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: "#818cf8",
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: "12px 10px 20px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 11,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.6,
            }}
          >
            <div style={{ color: "#a5b4fc", fontWeight: 700, marginBottom: 2 }}>
              {CLIENT_USER.plan} Plan
            </div>
            Active through Dec 2024
          </div>
          <button
            onClick={onLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "10px 12px",
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: 10,
              color: "#fca5a5",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>
      {/* Spacer for desktop */}
      <div className="client-sidebar-spacer" style={{ width: 220, flexShrink: 0 }} />
    </>
  );
}

// ── Task Card ────────────────────────────────────────────────
function TaskCard({ task }) {
  const [expanded, setExpanded] = useState(false);
  const [localCommentOpen, setLocalCommentOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const done = task.subtasks.filter((s) => s.done).length;
  const total = task.subtasks.length;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.2s",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          cursor: "pointer",
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: sc(task.status),
            marginTop: 5,
            flexShrink: 0,
            boxShadow: `0 0 0 3px ${sc(task.status)}20`,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 6,
              textDecoration: task.status === "Done" ? "line-through" : "none",
              opacity: task.status === "Done" ? 0.6 : 1,
            }}
          >
            {task.title}
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Badge label={task.priority} />
            <Badge label={task.status} />
            <span
              style={{
                fontSize: 11,
                color: "#94a3b8",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              📁 {task.project}
            </span>
            <span
              style={{
                fontSize: 11,
                color: "#94a3b8",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              ⏱ Due {task.due}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>
            {done}/{total} subtasks
          </span>
          <span
            style={{
              fontSize: 12,
              color: "#94a3b8",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "0.2s",
              display: "inline-block",
            }}
          >
            ▾
          </span>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div
          style={{
            padding: "0 16px 14px",
            borderTop: "1px solid #f1f5f9",
          }}
        >
          {/* Subtasks */}
          <div style={{ marginTop: 12, marginBottom: 12 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#94a3b8",
                letterSpacing: 0.8,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Subtasks ({done}/{total})
            </div>
            {task.subtasks.map((st, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 0",
                  borderBottom:
                    i < task.subtasks.length - 1 ? "1px solid #f8fafc" : "none",
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    border: `1.5px solid ${st.done ? "#10b981" : "#cbd5e1"}`,
                    background: st.done ? "#10b981" : "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {st.done && (
                    <svg width="8" height="8" viewBox="0 0 10 10">
                      <path
                        d="M2 5l2.5 2.5L8 3"
                        stroke="#fff"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: st.done ? "#94a3b8" : "#374151",
                    textDecoration: st.done ? "line-through" : "none",
                  }}
                >
                  {st.title}
                </span>
              </div>
            ))}
          </div>

          {/* Subtask progress */}
          <ProgressBar pct={Math.round((done / total) * 100)} />

          {/* Comments */}
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => setLocalCommentOpen(!localCommentOpen)}
              style={{
                background: "none",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "5px 12px",
                fontSize: 12,
                color: "#6366f1",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              💬 Commands ({task.comments + comments.length})
            </button>
            {localCommentOpen && (
              <div style={{ marginTop: 8 }}>
                {comments.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#f8fafc",
                      borderRadius: 8,
                      padding: "7px 10px",
                      marginBottom: 6,
                      fontSize: 12,
                      color: "#374151",
                    }}
                  >
                    <span style={{ fontWeight: 700, color: "#6366f1", marginRight: 6 }}>
                      You:
                    </span>
                    {c}
                  </div>
                ))}
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment…"
                    style={{
                      flex: 1,
                      border: "1.5px solid #e2e8f0",
                      borderRadius: 8,
                      padding: "7px 10px",
                      fontSize: 12,
                      color: "#0f172a",
                      background: "#fff",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && comment.trim()) {
                        setComments([...comments, comment.trim()]);
                        setComment("");
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (comment.trim()) {
                        setComments([...comments, comment.trim()]);
                        setComment("");
                      }
                    }}
                    style={{
                      background: "#6366f1",
                      border: "none",
                      borderRadius: 8,
                      padding: "7px 12px",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Calendar Mini ────────────────────────────────────────────
function CalendarPage() {
  const today = new Date("2024-05-17");
  const year = 2024;
  const month = 4; // May
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  const eventDays = MY_EVENTS.reduce((acc, e) => {
    const d = parseInt(e.date.split("-")[2]);
    if (!acc[d]) acc[d] = [];
    acc[d].push(e);
    return acc;
  }, {});

  const [selected, setSelected] = useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Calendar Grid */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          padding: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: 16,
          }}
        >
          May 2024
        </div>
        {/* Weekdays */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,1fr)",
            gap: 4,
            marginBottom: 8,
          }}
        >
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                fontSize: 10,
                fontWeight: 700,
                color: "#94a3b8",
                letterSpacing: 0.5,
                padding: "4px 0",
              }}
            >
              {d}
            </div>
          ))}
        </div>
        {/* Days */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,1fr)",
            gap: 4,
          }}
        >
          {cells.map((day, i) => {
            const hasEvent = day && eventDays[day];
            const isToday = day === 17;
            const isSel = day === selected;
            return (
              <div
                key={i}
                onClick={() => day && setSelected(isSel ? null : day)}
                style={{
                  padding: "8px 4px",
                  textAlign: "center",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: hasEvent ? 700 : 400,
                  color: isToday
                    ? "#fff"
                    : isSel
                    ? "#6366f1"
                    : day
                    ? "#374151"
                    : "transparent",
                  background: isToday
                    ? "#6366f1"
                    : isSel
                    ? "#eef2ff"
                    : hasEvent
                    ? "#f5f3ff"
                    : "transparent",
                  border: isSel && !isToday ? "1.5px solid #6366f1" : "1.5px solid transparent",
                  cursor: day ? "pointer" : "default",
                  position: "relative",
                  transition: "all 0.15s",
                }}
              >
                {day || ""}
                {hasEvent && !isToday && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 3,
                      left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex",
                      gap: 2,
                    }}
                  >
                    {eventDays[day].slice(0, 2).map((e, j) => (
                      <div
                        key={j}
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          background:
                            e.type === "Payment"
                              ? "#ef4444"
                              : e.type === "Demo"
                              ? "#10b981"
                              : "#6366f1",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Events for selected day */}
      {selected && eventDays[selected] ? (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>
            Events on May {selected}
          </div>
          {eventDays[selected].map((e) => (
            <div
              key={e.id}
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "12px 14px",
                border: "1px solid #e2e8f0",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background:
                    e.type === "Payment"
                      ? "#fef2f2"
                      : e.type === "Demo"
                      ? "#f0fdf4"
                      : "#eef2ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {e.type === "Payment" ? "💳" : e.type === "Demo" ? "🖥️" : e.type === "Deadline" ? "⏰" : "📞"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                  {e.title}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  {e.project} · {e.time}
                </div>
              </div>
              <Badge label={e.type} />
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>
            All Upcoming Events
          </div>
          {MY_EVENTS.map((e) => (
            <div
              key={e.id}
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "12px 14px",
                border: "1px solid #e2e8f0",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  background:
                    e.type === "Payment" ? "#fef2f2" : e.type === "Demo" ? "#f0fdf4" : "#eef2ff",
                  borderRadius: 10,
                  padding: "8px 12px",
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 800, color: "#6366f1", lineHeight: 1 }}>
                  {e.date.split("-")[2]}
                </div>
                <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.5 }}>
                  MAY
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                  {e.title}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  {e.project} · {e.time}
                </div>
              </div>
              <Badge label={e.type} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Settings Page ────────────────────────────────────────────
function SettingsPage({ clientUser }) {
  const [form, setForm] = useState({
    name: clientUser?.name || "",
    email: clientUser?.email || "",
    company: clientUser?.company || "",
    notifications: true,
    invoiceAlerts: true,
    weeklyReport: false,
  });
  const [saved, setSaved] = useState(false);
  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        {/* Profile section */}
        <div
          style={{
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            padding: "28px 24px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: "rgba(255,255,255,0.2)",
              border: "2px solid rgba(255,255,255,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            {CLIENT_USER.avatar}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>
              {CLIENT_USER.name}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
              {CLIENT_USER.email}
            </div>
            <div
              style={{
                display: "inline-block",
                marginTop: 6,
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 99,
                padding: "2px 10px",
                fontSize: 10,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: 1,
              }}
            >
              {CLIENT_USER.plan} PLAN
            </div>
          </div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {/* Fields */}
          {[
            { label: "Full Name", key: "name" },
            { label: "Email", key: "email", type: "email" },
            { label: "Phone", key: "phone" },
            { label: "Company", key: "company" },
          ].map(({ label, key, type = "text" }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "#64748b",
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  marginBottom: 5,
                }}
              >
                {label}
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                style={{
                  width: "100%",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "9px 12px",
                  fontSize: 13,
                  color: "#0f172a",
                  background: "#f8fafc",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ))}

          {/* Toggles */}
          <div
            style={{
              marginTop: 20,
              marginBottom: 4,
              fontSize: 11,
              fontWeight: 700,
              color: "#64748b",
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            Notification Preferences
          </div>
          {[
            { label: "Email Notifications", key: "notifications" },
            { label: "Invoice Payment Alerts", key: "invoiceAlerts" },
            { label: "Weekly Progress Report", key: "weeklyReport" },
          ].map(({ label, key }) => (
            <div
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
              <div
                onClick={() => setForm({ ...form, [key]: !form[key] })}
                style={{
                  width: 40,
                  height: 22,
                  borderRadius: 99,
                  background: form[key] ? "#6366f1" : "#e2e8f0",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 3,
                    left: form[key] ? 21 : 3,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    transition: "left 0.2s",
                  }}
                />
              </div>
            </div>
          ))}

          <button
            onClick={save}
            style={{
              marginTop: 18,
              width: "100%",
              background: saved
                ? "linear-gradient(135deg,#10b981,#34d399)"
                : "linear-gradient(135deg,#6366f1,#8b5cf6)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "11px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.3s",
            }}
          >
            {saved ? "✓ Saved!" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN CLIENT DASHBOARD ────────────────────────────────────
export default function ClientDashboard({ user, setUser }) {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [projects, setProjects] = useState(MY_PROJECTS);

  // ── Real user from login ──────────────────────────────────
  const clientUser = {
    name: user?.name || user?.clientName || "Client",
    email: user?.email || "",
    company: user?.companyName || user?.company || "",
    avatar: (user?.name || user?.clientName || "C").slice(0, 2).toUpperCase(),
    plan: "Pro",
  };

  // ── Fetch real projects for this client ───────────────────
 useEffect(() => {
  if (user?.name) {
    console.log("🔍 Fetching projects for:", user.name); // ← இது terminal-ல் வருதா?
    axios.get(`http://localhost:5000/api/client-dashboard/projects/${encodeURIComponent(user.name)}`)
      .then(res => {
        console.log("📁 Projects received:", res.data); // ← data வருதா?
        if (res.data?.length) setProjects(res.data);
      })
      .catch(err => {
        console.error("❌ Error:", err.message);
      });
  }
}, [user]);
  const handleLogout = () => {
    localStorage.removeItem("user");
    if (setUser) setUser(null);
  };

  const unread = notifications.filter((n) => !n.read).length;
  const page = NAV.find((n) => n.key === active);
  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        button, input, select, textarea { font-family: inherit; }
        @keyframes shimmer { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 4px rgba(99,102,241,0.2); }
          50% { box-shadow: 0 0 0 8px rgba(99,102,241,0.08); }
        }
        @keyframes blink-bar { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes slide-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media (min-width: 769px) {
          .client-sidebar { transform: translateX(0) !important; position: sticky !important; top: 0 !important; height: 100vh !important; }
          .sidebar-close-btn { display: none !important; }
          .mob-overlay { display: none !important; }
          .mob-topbar { display: none !important; }
          .client-sidebar-spacer { display: none !important; }
        }
        @media (max-width: 768px) {
          .client-sidebar-spacer { display: none !important; }
          .main-pad { padding: 14px !important; }
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .proj-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Sidebar — clientUser pass பண்றோம் ── */}
      <SidebarClient
        active={active}
        setActive={setActive}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        clientUser={clientUser}
        unread={unread}
      />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Mobile topbar */}
        <div className="mob-topbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 100 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6366f1" }}>☰</button>
          <span style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>ClientHub</span>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12, position: "relative" }}>
            {clientUser.avatar}
            {unread > 0 && <div style={{ position: "absolute", top: -4, right: -4, width: 14, height: 14, borderRadius: "50%", background: "#ef4444", border: "2px solid #fff", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>{unread}</div>}
          </div>
        </div>

        {/* Main content */}
        <div className="main-pad" style={{ flex: 1, padding: "24px 28px", overflowY: "auto", animation: "slide-in 0.3s ease" }}>
          {/* Page Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", letterSpacing: -0.5 }}>{page.icon} {page.label}</h1>
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Welcome back, {clientUser.name.split(" ")[0]} 👋</p>
            </div>
            {unread > 0 && (
              <div onClick={() => setActive("notifications")} style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 14px", fontSize: 12, color: "#ef4444", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                🔔 {unread} unread alerts
              </div>
            )}
          </div>

          {/* ── Pages ── */}
          {active === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                <StatCard icon="◈" label="Total Projects" value={projects.length} sub="All time" color="#6366f1" onClick={() => setActive("projects")} />
                <StatCard icon="⚡" label="Active Projects" value={projects.filter(p => p.status === "In Progress").length} sub="Currently running" color="#f59e0b" onClick={() => setActive("projects")} />
                <StatCard icon="◉" label="Pending Tasks" value={MY_TASKS.filter(t => t.status !== "Done").length} sub="Need attention" color="#8b5cf6" onClick={() => setActive("tasks")} />
                <StatCard icon="💰" label="Outstanding" value="₹1,91,750" sub="Pending payments" color="#ef4444" onClick={() => setActive("payments")} />
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>Project Milestones</div>
                <div className="proj-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  {projects.map((p) => (
                    <div key={p.id || p._id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", cursor: "pointer", transition: "box-shadow 0.2s" }} onClick={() => setActive("projects")}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 20px rgba(99,102,241,0.1)"}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{p.name}</div>
                        <Badge label={p.status} />
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>👤 {p.manager} · ⏱ {p.deadline}</div>
                      <MilestoneLine tasks={p.tasks || 10} completedTasks={p.completedTasks || 0} />
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px solid #f1f5f9", fontSize: 11 }}>
                        <span style={{ color: "#64748b" }}>Budget: <strong style={{ color: "#0f172a" }}>{p.budget}</strong></span>
                        <span style={{ color: "#64748b" }}>{p.completedTasks || 0}/{p.tasks || 0} tasks</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="proj-grid" style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 14 }}>
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>My Tasks</div>
                  {MY_TASKS.slice(0, 4).map(t => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f8fafc", cursor: "pointer" }} onClick={() => setActive("tasks")}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: sc(t.status), flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: t.status === "Done" ? "#94a3b8" : "#0f172a", textDecoration: t.status === "Done" ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'DM Mono', monospace" }}>{t.project}</div>
                      </div>
                      <Badge label={t.priority} />
                    </div>
                  ))}
                  <button onClick={() => setActive("tasks")} style={{ marginTop: 10, background: "none", border: "none", color: "#6366f1", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>View all tasks →</button>
                </div>
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>Upcoming</div>
                  {MY_EVENTS.map(e => (
                    <div key={e.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #f8fafc", alignItems: "center" }}>
                      <div style={{ background: "#f5f3ff", borderRadius: 8, padding: "6px 8px", textAlign: "center", flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#6366f1", lineHeight: 1 }}>{e.date.split("-")[2]}</div>
                        <div style={{ fontSize: 8, color: "#94a3b8", fontWeight: 700 }}>MAY</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'DM Mono', monospace" }}>{e.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {active === "projects" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {projects.map(p => (
                <div key={p.id || p._id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "20px 22px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'DM Mono', monospace" }}>{p.id || p._id} · Manager: {p.manager} · Deadline: {p.deadline}</div>
                    </div>
                    <Badge label={p.status} size="lg" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
                    {[["Budget", p.budget], ["Spent", p.spent || "—"], ["Tasks Done", `${p.completedTasks || 0}/${p.tasks || 0}`], ["Progress", `${p.progress || 0}%`]].map(([label, val]) => (
                      <div key={label} style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px", border: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", fontFamily: "'DM Mono', monospace" }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <MilestoneLine tasks={p.tasks || 10} completedTasks={p.completedTasks || 0} />
                </div>
              ))}
            </div>
          )}

          {active === "tasks" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <TasksFiltered tasks={MY_TASKS} />
            </div>
          )}

          {active === "payments" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                <StatCard icon="✅" label="Total Paid" value="₹2,30,000" sub="2 invoices" color="#10b981" />
                <StatCard icon="⏳" label="Pending" value="₹1,12,100" sub="Due Jun 10" color="#f59e0b" />
                <StatCard icon="🚨" label="Overdue" value="₹79,650" sub="Pay now" color="#ef4444" />
              </div>
              {MY_PAYMENTS.map(inv => (
                <div key={inv.id} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${inv.status === "Overdue" ? "#fecaca" : "#e2e8f0"}`, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: inv.status === "Paid" ? "#f0fdf4" : inv.status === "Overdue" ? "#fef2f2" : "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {inv.status === "Paid" ? "🧾" : inv.status === "Overdue" ? "🚨" : "⏳"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{inv.id} · {inv.project}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'DM Mono', monospace" }}>Issued {inv.date} · Due {inv.due}{inv.method !== "—" && ` · Paid via ${inv.method}`}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{inv.amount}</div>
                    <Badge label={inv.status} />
                  </div>
                  {inv.status !== "Paid" && <button style={{ background: inv.status === "Overdue" ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 9, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>Pay Now</button>}
                </div>
              ))}
            </div>
          )}

          {active === "calendar" && <CalendarPage />}

          {active === "notifications" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>{unread} unread</span>
                {unread > 0 && <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#6366f1", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Mark all read</button>}
              </div>
              {notifications.map(n => (
                <div key={n.id} onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                  style={{ background: n.read ? "#fff" : "#fafafe", borderRadius: 12, border: `1px solid ${n.read ? "#e2e8f0" : "#c7d2fe"}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: n.read ? "#f8fafc" : n.type === "warning" ? "#fef2f2" : n.type === "success" ? "#f0fdf4" : "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{n.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: "#0f172a" }}>{n.text}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{n.time}</div>
                  </div>
                  {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", flexShrink: 0, animation: "blink-bar 2s ease infinite" }} />}
                </div>
              ))}
            </div>
          )}

          {active === "reports" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {MY_REPORTS.map(r => (
                <div key={r.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "20px 22px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>📅 {r.range}</div>
                    </div>
                    <Badge label={r.status} size="lg" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 14 }}>
                    {[["Projects", r.projects], ["Total Spend", r.revenue]].map(([k, v]) => (
                      <div key={k} style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px", border: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 3 }}>{k}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", fontFamily: "'DM Mono', monospace" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <button style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 9, padding: "9px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📥 Download PDF</button>
                </div>
              ))}
            </div>
          )}

          {active === "settings" && <SettingsPage clientUser={clientUser} />}
        </div>
      </div>
    </div>
  );
}
// ── Helper: Tasks with filter state ─────────────────────────
function FilterChip({ label, tasks }) {
  return null; // Used as placeholder; real filter below
}

function TasksFiltered({ tasks }) {
  const [filter, setFilter] = useState("All");
  const displayed =
    filter === "All" ? tasks : tasks.filter((t) => t.status === filter);
  return (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {["All", "In Progress", "Pending", "Done"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px",
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              border: "1.5px solid",
              borderColor: filter === f ? "#6366f1" : "#e2e8f0",
              background: filter === f ? "#eef2ff" : "#fff",
              color: filter === f ? "#6366f1" : "#64748b",
              transition: "all 0.15s",
            }}
          >
            {f}{" "}
            <span style={{ opacity: 0.6 }}>
              (
              {f === "All"
                ? tasks.length
                : tasks.filter((t) => t.status === f).length}
              )
            </span>
          </button>
        ))}
      </div>
      {displayed.map((t) => (
        <TaskCard key={t.id} task={t} />
      ))}
    </>
  );
}
