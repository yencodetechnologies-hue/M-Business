import React, { useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { BASE_URL } from "../config";
import ProjectPdfButtons from "./ProjectPdfButtons";
import {
  formatMoney,
  parseAmt,
  projectValue,
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

  const totalValue = useMemo(
    () => (projects || []).reduce((sum, p) => sum + projectValue(p), 0),
    [projects]
  );
  const groups = useMemo(() => groupProjects(projects), [projects]);

  const listed = useMemo(() => {
    if (sectionFilter === "ongoing") return groups.ongoing;
    if (sectionFilter === "hold") return groups.hold;
    if (sectionFilter === "completed") return groups.completed;
    return projects || [];
  }, [projects, groups, sectionFilter]);

  const clientLabel = (p) => {
    const match = (clients || []).find(
      (c) => String(c._id) === String(p.clientId) || (c.clientName || c.name) === p.client
    );
    return match?.clientName || match?.name || p.client || "—";
  };

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

  const card = (p) => {
    const g = statusGroup(p.status);
    const badgeBg = g === "completed" ? "#DCFCE7" : g === "hold" ? "#FEF3C7" : g === "pending" ? "#FEE2E2" : "#E0F7FA";
    const badgeFg = g === "completed" ? "#166534" : g === "hold" ? "#B45309" : g === "pending" ? "#B91C1C" : "#0E7490";
    return (
      <div
        key={p._id || p.id}
        onClick={() => onOpenProject && onOpenProject(p)}
        style={{
          background: "#fff",
          border: "1px solid #E2E8F0",
          borderRadius: 16,
          padding: 16,
          cursor: "pointer",
          boxShadow: "0 2px 10px rgba(15,28,46,0.04)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f1c2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p.name || "Untitled project"}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{clientLabel(p)}</div>
          </div>
          <span style={{ background: badgeBg, color: badgeFg, fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999, flexShrink: 0 }}>
            {statusLabel(p.status)}
          </span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#059669" }}>
          {formatMoney(projectValue(p), p.currency || "₹")}
        </div>
        <ProjectPdfButtons
          project={p}
          quotations={quotations}
          proposals={proposals}
          invoices={invoices}
        />
      </div>
    );
  };

  const section = (title, list, empty) => (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f1c2e" }}>{title}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>{list.length}</div>
      </div>
      {list.length === 0 ? (
        <div style={{ fontSize: 13, color: "#94a3b8", padding: "12px 0" }}>{empty}</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(auto-fill, minmax(280px, 1fr))" : "1fr", gap: 12 }}>
          {list.map(card)}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: isDesktop ? "24px 28px 40px" : "16px 16px 28px", fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        .bdh-expense-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr auto; gap: 10px; align-items: end; }
        @media (max-width: 1100px) { .bdh-expense-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>
      <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr 1fr", gap: 12, marginBottom: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Projects</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f1c2e" }}>{(projects || []).length}</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Total project value</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#059669" }}>{formatMoney(totalValue)}</div>
        </div>
      </div>

      {isDesktop && (
        <form
          onSubmit={submitExpense}
          style={{
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0f1c2e", marginBottom: 12 }}>
            Enter project expense
          </div>
          <div className="bdh-expense-grid">
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b" }}>
              Project
              <select
                value={expenseProjectId}
                onChange={(e) => setExpenseProjectId(e.target.value)}
                style={{ width: "100%", marginTop: 4, padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontFamily: "inherit" }}
              >
                <option value="">Select project</option>
                {(projects || []).map((p) => (
                  <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b" }}>
              Category
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value }))}
                style={{ width: "100%", marginTop: 4, padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontFamily: "inherit" }}
              >
                {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b" }}>
              Amount
              <input
                type="number"
                min="0"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0"
                style={{ width: "100%", marginTop: 4, padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </label>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b" }}>
              Date
              <input
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm((f) => ({ ...f, date: e.target.value }))}
                style={{ width: "100%", marginTop: 4, padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </label>
            <button
              type="submit"
              disabled={savingExpense}
              style={{
                padding: "11px 16px",
                borderRadius: 10,
                border: "none",
                background: "var(--app-accent, #00BCD4)",
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {savingExpense ? "Saving…" : "Add"}
            </button>
          </div>
          <input
            value={expenseForm.description}
            onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)"
            style={{ width: "100%", marginTop: 10, padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontFamily: "inherit", boxSizing: "border-box" }}
          />
        </form>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {[
          ["all", `All (${(projects || []).length})`],
          ["ongoing", `Ongoing (${groups.ongoing.length})`],
          ["hold", `On Hold (${groups.hold.length})`],
          ["completed", `Completed (${groups.completed.length})`],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSectionFilter(key)}
            style={{
              border: sectionFilter === key ? "1.5px solid var(--app-accent, #00BCD4)" : "1.5px solid #E2E8F0",
              background: sectionFilter === key ? "var(--teal-light, #E0F7FA)" : "#fff",
              color: sectionFilter === key ? "var(--app-accent, #00BCD4)" : "#475569",
              borderRadius: 999,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 15, fontWeight: 800, color: "#0f1c2e", marginBottom: 10 }}>All projects</div>
      {listed.length === 0 ? (
        <div style={{ fontSize: 13, color: "#94a3b8", padding: "16px 0" }}>No projects yet.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(auto-fill, minmax(280px, 1fr))" : "1fr", gap: 12 }}>
          {listed.map(card)}
        </div>
      )}

      {sectionFilter === "all" && (
        <>
          {section("Ongoing projects", groups.ongoing, "No ongoing projects.")}
          {section("Projects on hold", groups.hold, "No projects on hold.")}
          {section("Completed projects", groups.completed, "No completed projects.")}
        </>
      )}
    </div>
  );
}
