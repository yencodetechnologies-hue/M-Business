import React, { useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { BASE_URL } from "../config";
import "./DashboardModern.css";
import ProjectPdfButtons from "./ProjectPdfButtons";
import {
  formatMoney,
  parseAmt,
  projectValue,
  projectReceived,
  projectPending,
  statusGroup,
  statusLabel,
} from "../utils/projectBusiness";

const EXPENSE_CATEGORIES = ["Travel", "Office", "Utilities", "Marketing", "Salary", "Miscellaneous"];

function groupProjects(projects) {
  const ongoing = [];
  const hold = [];
  const completed = [];
  (projects || []).forEach((p) => {
    const g = statusGroup(p.status);
    if (g === "completed") completed.push(p);
    else if (g === "hold") hold.push(p);
    else ongoing.push(p);
  });
  return { ongoing, hold, completed };
}

function greetingForHour(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDue(p) {
  const raw = p?.end || p?.deadline || p?.endDate;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "P";
  return parts.slice(0, 2).map((n) => n[0].toUpperCase()).join("");
}

function displayName() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.companyName || user.name || user.firstName || "there";
  } catch {
    return "there";
  }
}

export default function BusinessDashboardHome({
  isDesktop = true,
  projects = [],
  clients = [],
  quotations = [],
  proposals = [],
  invoices = [],
  onOpenProject,
  onProjectsUpdated,
}) {
  const [expenseProjectId, setExpenseProjectId] = useState("");
  const [expenseForm, setExpenseForm] = useState({
    category: "Miscellaneous",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [savingExpense, setSavingExpense] = useState(false);
  const [sectionFilter, setSectionFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [expenseOpen, setExpenseOpen] = useState(false);

  const now = useMemo(() => new Date(), []);
  const hello = greetingForHour(now.getHours());
  const dateLabel = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const totalValue = useMemo(
    () => (projects || []).reduce((sum, p) => sum + projectValue(p), 0),
    [projects]
  );
  const totalReceived = useMemo(
    () => (projects || []).reduce((sum, p) => sum + projectReceived(p), 0),
    [projects]
  );
  const totalPending = useMemo(
    () => (projects || []).reduce((sum, p) => sum + projectPending(p), 0),
    [projects]
  );
  const groups = useMemo(() => groupProjects(projects), [projects]);

  const clientLabel = (p) => {
    const match = (clients || []).find(
      (c) => String(c._id) === String(p.clientId) || (c.clientName || c.name) === p.client
    );
    return match?.clientName || match?.name || p.client || "Internal";
  };

  const listed = useMemo(() => {
    let rows = projects || [];
    if (sectionFilter === "ongoing") rows = groups.ongoing;
    else if (sectionFilter === "hold") rows = groups.hold;
    else if (sectionFilter === "completed") rows = groups.completed;
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((p) => {
      const client = clientLabel(p).toLowerCase();
      return (
        String(p.name || "").toLowerCase().includes(q) ||
        client.includes(q) ||
        String(p.status || "").toLowerCase().includes(q)
      );
    });
  }, [projects, groups, sectionFilter, query, clients]);

  const headers = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return { "x-company-id": user.companyId || "" };
  };

  const submitExpense = async (e) => {
    e.preventDefault();
    if (!expenseProjectId) {
      toast.error("Select a project first.");
      return;
    }
    if (!parseAmt(expenseForm.amount)) {
      toast.error("Enter an expense amount.");
      return;
    }
    setSavingExpense(true);
    try {
      await axios.post(
        `${BASE_URL}/api/projects/${expenseProjectId}/expenses`,
        {
          category: expenseForm.category,
          description: expenseForm.description,
          amount: parseAmt(expenseForm.amount),
          date: expenseForm.date,
        },
        { headers: headers() }
      );
      toast.success("Expense added.");
      setExpenseForm({
        category: "Miscellaneous",
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
      });
      if (onProjectsUpdated) await onProjectsUpdated();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to add expense.");
    } finally {
      setSavingExpense(false);
    }
  };

  const kpis = [
    {
      key: "projects",
      label: "Projects",
      value: String((projects || []).length),
      hint: `${groups.ongoing.length} in motion`,
      icon: "ti-folders",
      tone: "teal",
    },
    {
      key: "value",
      label: "Portfolio value",
      value: formatMoney(totalValue),
      hint: "All project budgets",
      icon: "ti-currency-rupee",
      tone: "green",
    },
    {
      key: "received",
      label: "Received",
      value: formatMoney(totalReceived),
      hint: "Collected so far",
      icon: "ti-trending-up",
      tone: "blue",
    },
    {
      key: "pending",
      label: "Pending",
      value: formatMoney(totalPending),
      hint: "Still to collect",
      icon: "ti-clock-hour-4",
      tone: "amber",
    },
  ];

  const filters = [
    { key: "all", label: "All", count: (projects || []).length },
    { key: "ongoing", label: "Ongoing", count: groups.ongoing.length },
    { key: "hold", label: "On hold", count: groups.hold.length },
    { key: "completed", label: "Completed", count: groups.completed.length },
  ];

  const card = (p, idx) => {
    const g = statusGroup(p.status);
    const pct = Math.min(100, Math.max(0, Number(p.progress || p.pct || (g === "completed" ? 100 : 0))));
    const due = formatDue(p);
    const client = clientLabel(p);
    const pending = projectPending(p);
    return (
      <article
        key={p._id || p.id}
        className={`bdh-project bdh-project--${g}`}
        style={{ animationDelay: `${Math.min(idx, 12) * 40}ms` }}
        onClick={() => onOpenProject && onOpenProject(p)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenProject && onOpenProject(p);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="bdh-project-top">
          <div className="bdh-project-who">
            <div className={`bdh-avatar bdh-avatar--${g}`} aria-hidden="true">
              {initials(p.name)}
            </div>
            <div className="bdh-project-copy">
              <h3 className="bdh-project-name">{p.name || "Untitled project"}</h3>
              <p className="bdh-project-client">{client}</p>
            </div>
          </div>
          <span className={`bdh-badge bdh-badge--${g}`}>{statusLabel(p.status)}</span>
        </div>

        <div className="bdh-project-money">
          <div>
            <span className="bdh-money-label">Value</span>
            <strong>{formatMoney(projectValue(p), p.currency || "₹")}</strong>
          </div>
          <div className="bdh-money-right">
            <span className="bdh-money-label">Pending</span>
            <strong className={pending > 0 ? "bdh-pending" : ""}>
              {formatMoney(pending, p.currency || "₹")}
            </strong>
          </div>
        </div>

        <div className="bdh-progress">
          <div className="bdh-progress-meta">
            <span>Progress</span>
            <span>{pct}%</span>
          </div>
          <div className="bdh-progress-track" aria-hidden="true">
            <div className={`bdh-progress-fill bdh-progress-fill--${g}`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="bdh-project-foot">
          <span className="bdh-due">
            <i className="ti ti-calendar-event" aria-hidden="true" />
            {due ? `Due ${due}` : "No deadline"}
          </span>
        </div>

        <ProjectPdfButtons
          project={p}
          quotations={quotations}
          proposals={proposals}
          invoices={invoices}
        />
      </article>
    );
  };

  return (
    <div className={`bdh ${isDesktop ? "bdh--desktop" : "bdh--mobile"}`}>
      <header className="bdh-hero">
        <div className="bdh-hero-copy">
          <p className="bdh-kicker">{dateLabel}</p>
          <h1 className="bdh-title">
            {hello}, <span>{displayName()}</span>
          </h1>
          <p className="bdh-subtitle">A clear view of projects, collections, and work in progress.</p>
        </div>
        <button
          type="button"
          className="bdh-expense-toggle"
          onClick={() => setExpenseOpen((v) => !v)}
        >
          <i className="ti ti-receipt-2" aria-hidden="true" />
          {expenseOpen ? "Hide expense" : "Log expense"}
        </button>
      </header>

      <section className="bdh-kpis" aria-label="Business summary">
        {kpis.map((kpi) => (
          <div key={kpi.key} className={`bdh-kpi bdh-kpi--${kpi.tone}`}>
            <div className="bdh-kpi-icon" aria-hidden="true">
              <i className={`ti ${kpi.icon}`} />
            </div>
            <div className="bdh-kpi-body">
              <div className="bdh-kpi-label">{kpi.label}</div>
              <div className="bdh-kpi-value">{kpi.value}</div>
              <div className="bdh-kpi-hint">{kpi.hint}</div>
            </div>
          </div>
        ))}
      </section>

      {(isDesktop || expenseOpen) && (
        <form className="bdh-expense" onSubmit={submitExpense}>
          <div className="bdh-expense-head">
            <div className="bdh-expense-icon" aria-hidden="true">
              <i className="ti ti-wallet" />
            </div>
            <div>
              <h2>Enter project expense</h2>
              <p>Track spend against a live project without leaving the dashboard.</p>
            </div>
          </div>
          <div className="bdh-expense-grid">
            <label>
              Project
              <select
                value={expenseProjectId}
                onChange={(e) => setExpenseProjectId(e.target.value)}
              >
                <option value="">Select project</option>
                {(projects || []).map((p) => (
                  <option key={p._id || p.id} value={p._id || p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Category
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value }))}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Amount
              <input
                type="number"
                min="0"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0"
              />
            </label>
            <label>
              Date
              <input
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm((f) => ({ ...f, date: e.target.value }))}
              />
            </label>
            <button type="submit" disabled={savingExpense}>
              {savingExpense ? "Saving…" : "Add"}
            </button>
          </div>
          <input
            className="bdh-expense-desc"
            value={expenseForm.description}
            onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)"
          />
        </form>
      )}

      <div className="bdh-toolbar">
        <div className="bdh-filters" role="tablist" aria-label="Filter projects">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={sectionFilter === f.key}
              className={sectionFilter === f.key ? "is-active" : ""}
              onClick={() => setSectionFilter(f.key)}
            >
              {f.label}
              <em>{f.count}</em>
            </button>
          ))}
        </div>
        <label className="bdh-search">
          <i className="ti ti-search" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects or clients"
            aria-label="Search projects or clients"
          />
        </label>
      </div>

      {listed.length === 0 ? (
        <div className="bdh-empty">
          <div className="bdh-empty-icon" aria-hidden="true">
            <i className="ti ti-folder-off" />
          </div>
          <h3>{query ? "No matching projects" : "No projects yet"}</h3>
          <p>
            {query
              ? "Try a different name, client, or status."
              : "Create a project to see value, progress, and documents here."}
          </p>
        </div>
      ) : (
        <div className="bdh-grid">{listed.map(card)}</div>
      )}
    </div>
  );
}
