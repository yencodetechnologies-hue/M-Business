import { useState, useEffect } from "react";
import React from "react";
import axios from "axios";
import { BASE_URL } from "../config";
import InvoiceCreator from "./InvoiceCreator";
import AccountsPage, { ExpensesPage } from "./AccountsPage";
import TaskPage from "./TaskPage";
import CalendarPage from "./CalendarPage";
import ReportsPage from "./ReportsPage";
import QuotationCreator from "./QuotationCreator";
import ProjectProposalCreator from "./ProjectProposalCreator";
import AdminProposalManagement from "./AdminProposalManagement";

const sc = (s) => ({
  Active: "#22C55E",
  Inactive: "#EF4444",
  Pending: "#F59E0B",
}[s] || "#6366f1");

function Badge({ label }) {
  const c = sc(label);
  return (
    <span style={{ background: `${c}18`, color: c, border: `1px solid ${c}30`, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

const NAV = [
  { key: "dashboard", icon: "", label: "Dashboard" },
  { key: "subadmins", icon: "", label: "Subadmins" },
  { key: "proposals", icon: "", label: "Project Proposals" },
  { key: "reports", icon: "", label: "Reports" },
  { key: "subscriptions", icon: "", label: "Subscriptions" },
  { key: "packages", icon: "", label: "Packages" },
  { key: "payments", icon: "", label: "Payments" }
];

export default function AdminDashboard({ user, setUser }) {
  const [active, setActive] = useState("dashboard");
  const [subadmins, setSubadmins] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [packages, setPackages] = useState([]);
  const [npkg, setNpkg] = useState({ title: "", description: "", icon: "", isFree: false, price: "", noOfDays: "", planDuration: "Monthly", businessLimit: "Single business manage", managerLimit: "1 Manager", clientLimit: "3 Client manage", assignedSubadmins: [] });
  const [pkgSaveLoading, setPkgSaveLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    fetchSubadmins();
    fetchClients();
    fetchProjects();
    fetchSubscriptions();
    fetchEmployees();
    fetchManagers();
    fetchQuotations();
    fetchPackages();
    fetchInvoices();
  }, []);

  const fetchSubadmins = async () => {
    try {
      // In case we don't have a subadmin route, we can fetch all users and filter
      const res = await axios.get(BASE_URL + "/api/subadmins").catch(async () => {
        // Fallback to fetch from users auth logic or something similar if needed
        return { data: [] };
      });
      setSubadmins(res.data);
    } catch (e) { console.error(e); }
  };
  const fetchClients = async () => {
    try {
      const res = await axios.get(BASE_URL + "/api/clients");
      setClients(res.data);
    } catch (e) { console.error(e); }
  };
  const fetchProjects = async () => {
    try {
      const res = await axios.get(BASE_URL + "/api/projects");
      setProjects(res.data);
    } catch (e) { console.error(e); }
  };
  const fetchSubscriptions = async () => {
    try {
      const res = await axios.get(BASE_URL + "/api/subscriptions/all");
      setSubscriptions(res.data);
    } catch (e) { console.error(e); }
  };
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(BASE_URL + "/api/employees");
      setEmployees(res.data);
    } catch (e) { console.error(e); }
  };
  const fetchManagers = async () => {
    try {
      const res = await axios.get(BASE_URL + "/api/managers");
      setManagers(res.data);
    } catch (e) { console.error(e); }
  };
  const fetchQuotations = async () => {
    try {
      const res = await axios.get(BASE_URL + "/api/quotations");
      setQuotations(res.data);
    } catch (e) { console.error(e); }
  };
  const fetchPackages = async () => {
    try {
      const res = await axios.get(BASE_URL + "/api/packages");
      setPackages(res.data);
    } catch (e) { console.error(e); }
  };
  const fetchInvoices = async () => {
    try {
      const res = await axios.get(BASE_URL + "/api/invoices");
      setInvoices(res.data.invoices || []);
    } catch (e) { console.error(e); }
  };

  const createPackage = async () => {
    const errors = {};
    if (!npkg.title.trim()) errors.title = "Title required";
    if (!npkg.description.trim()) errors.description = "Description required";
    if (!npkg.isFree && !npkg.price) errors.price = "Price required for paid packages";
    if (!npkg.noOfDays) errors.noOfDays = "Number of days required";
    if (Object.keys(errors).length > 0) { setPkgError(errors); return; }
    try {
      setPkgSaveLoading(true);
      const packageData = {
        title: npkg.title,
        description: npkg.description,
        icon: npkg.icon || "",
        type: npkg.isFree ? "free" : "paid",
        no_of_days: parseInt(npkg.noOfDays) || 30,
        price: npkg.isFree ? 0 : parseFloat(npkg.price) || 0,
        monthlyPrice: npkg.isFree ? "Free" : npkg.price,
        quarterlyPrice: npkg.isFree ? "Free" : Math.round((parseFloat(npkg.price) || 0) * 3 * 0.9).toString(),
        halfYearlyPrice: npkg.isFree ? "Free" : Math.round((parseFloat(npkg.price) || 0) * 6 * 0.85).toString(),
        annualPrice: npkg.isFree ? "Free" : Math.round((parseFloat(npkg.price) || 0) * 12 * 0.8).toString(),
        buttonName: "Get Started",
        features: `${npkg.planDuration} Plan\n${npkg.businessLimit}\n${npkg.managerLimit}\n${npkg.clientLimit}`,
        planDuration: npkg.planDuration,
        businessLimit: npkg.businessLimit,
        managerLimit: npkg.managerLimit,
        clientLimit: npkg.clientLimit,
        targetRole: "subadmin",
        assignedSubadmins: npkg.assignedSubadmins || []
      };
      const res = await axios.post(BASE_URL + "/api/packages", packageData);
      setPackages(prev => [...prev, res.data]);
      setNpkg({ title: "", description: "", icon: "", isFree: false, price: "", noOfDays: "", planDuration: "Monthly", businessLimit: "Single business manage", managerLimit: "1 Manager", clientLimit: "3 Client manage", assignedSubadmins: [] });
      setPkgError({});
      setModal(null);
    } catch (err) {
      console.error(err);
      alert("Failed to create package");
    } finally {
      setPkgSaveLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const initials = (user?.name || "Admin").substring(0, 2).toUpperCase();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      {/* SIDEBAR */}
      <div style={{ width: 240, background: "#0f172a", color: "#fff", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "24px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#3b82f6,#2dd4bf)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900 }}>M</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>M Business</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5 }}>ADMIN DASHBOARD</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "20px 14px", overflowY: "auto" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1, marginBottom: 12, paddingLeft: 8 }}>MENU</div>
          {NAV.map(n => {
            const on = active === n.key;
            return (
              <button key={n.key} onClick={() => setActive(n.key)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: on ? "rgba(59,130,246,0.15)" : "transparent", border: "none", borderRadius: 10, color: on ? "#60a5fa" : "rgba(255,255,255,0.5)", fontWeight: on ? 700 : 500, fontSize: 13, cursor: "pointer", marginBottom: 4, transition: "all 0.2s", textAlign: "left", fontFamily: "inherit" }}>
                <span style={{ fontSize: 16 }}>{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={handleLogout} style={{ width: "100%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>🚪 Logout</button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "20px 30px", background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
              {NAV.find(n => n.key === active)?.label}
            </h2>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Admin Control Panel</div>
          </div>
          {active === "packages" && (
            <button
              onClick={() => { setPkgError({}); setModal("package_add"); }}
              style={{
                background: "linear-gradient(135deg,#0ea5e9,#0284c7)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 4px 12px rgba(14,165,233,0.25)"
              }}
            >
              + Add Package
            </button>
          )}
        </div>

        <div style={{ flex: 1, padding: 30, overflowY: "auto" }}>
          {active === "dashboard" && <OverviewPage subadmins={subadmins} clients={clients} employees={employees} managers={managers} projects={projects} packages={packages} invoices={invoices} />}
          {active === "clients" && <ClientsPage clients={clients} setClients={setClients} />}
          {active === "subadmins" && <SubadminsList subadmins={subadmins} refresh={fetchSubadmins} packages={packages} />}
          {active === "employees" && <EmployeesPage employees={employees} setEmployees={setEmployees} />}
          {active === "managers" && <ManagersPage managers={managers} setManagers={setManagers} />}
          {active === "projects" && <ProjectsPage projects={projects} setProjects={setProjects} clients={clients} employees={employees} />}
          {active === "quotations" && <QuotationCreator clients={clients} projects={projects} />}
          {active === "proposals" && <ProjectProposalCreator clients={clients} />}
          {active === "invoices" && <InvoiceCreator clients={clients} projects={projects} />}
          {active === "tracking" && <ProjectStatusPage clients={clients} employees={employees} managers={managers} />}
          {active === "tasks" && <TaskPage projects={projects} employees={employees} />}
          {active === "calendar" && <CalendarPage projects={projects} clients={clients} />}
          {active === "accounts" && <AccountsPage ExpensesPage={ExpensesPage} />}
          {active === "interviews" && <InterviewPage />}
          {active === "reports" && <ReportsPage clients={clients} projects={projects} employees={employees} managers={managers} />}
          {active === "subscriptions" && <SubscriptionsPage subscriptions={subscriptions} />}
          {active === "packages" && <PackagesPage packages={packages} />}
          {active === "payments" && <AccountsPage ExpensesPage={ExpensesPage} />}
        </div>
      </div>

      {/* Package Creation Modal */}
      {modal === "package_add" && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 20,
            width: "100%",
            maxWidth: 600,
            maxHeight: "90vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 32px 80px rgba(0,0,0,0.25)"
          }}>
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Add New Package</h2>
              <button
                onClick={() => setModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: "#64748b",
                  padding: 4
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "24px", overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Package Title *</label>
                  <input
                    type="text"
                    value={npkg.title}
                    onChange={e => setNpkg({ ...npkg, title: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: pkgError.title ? "1.5px solid #ef4444" : "1.5px solid #e5e7eb",
                      borderRadius: 8,
                      fontSize: 14,
                      outline: "none"
                    }}
                    placeholder="e.g., Basic Plan"
                  />
                  {pkgError.title && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{pkgError.title}</div>}
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Icon</label>
                  <input
                    type="text"
                    value={npkg.icon}
                    onChange={e => setNpkg({ ...npkg, icon: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "1.5px solid #e5e7eb",
                      borderRadius: 8,
                      fontSize: 14,
                      outline: "none"
                    }}
                    placeholder="??"
                  />
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Description *</label>
                <textarea
                  value={npkg.description}
                  onChange={e => setNpkg({ ...npkg, description: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: pkgError.description ? "1.5px solid #ef4444" : "1.5px solid #e5e7eb",
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                    minHeight: 80,
                    resize: "vertical"
                  }}
                  placeholder="Describe the package features and benefits..."
                />
                {pkgError.description && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{pkgError.description}</div>}
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Package Type *</label>
                <div style={{ display: "flex", gap: 12 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="packageType"
                      checked={npkg.isFree}
                      onChange={() => setNpkg({ ...npkg, isFree: true, price: "Free" })}
                      style={{ cursor: "pointer" }}
                    />
                    <span style={{ fontSize: 14, color: "#374151" }}>Free</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="packageType"
                      checked={!npkg.isFree}
                      onChange={() => setNpkg({ ...npkg, isFree: false })}
                      style={{ cursor: "pointer" }}
                    />
                    <span style={{ fontSize: 14, color: "#374151" }}>Paid</span>
                  </label>
                </div>
              </div>

              {!npkg.isFree && (
                <div style={{ marginTop: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Price *</label>
                  <input
                    type="text"
                    value={npkg.price}
                    onChange={e => setNpkg({ ...npkg, price: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: pkgError.price ? "1.5px solid #ef4444" : "1.5px solid #e5e7eb",
                      borderRadius: 8,
                      fontSize: 14,
                      outline: "none"
                    }}
                    placeholder="999"
                  />
                  {pkgError.price && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{pkgError.price}</div>}
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Number of Days *</label>
                <input
                  type="text"
                  value={npkg.noOfDays}
                  onChange={e => setNpkg({ ...npkg, noOfDays: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: pkgError.noOfDays ? "1.5px solid #ef4444" : "1.5px solid #e5e7eb",
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none"
                  }}
                  placeholder="e.g., 30, 60, 90, 365"
                />
                {pkgError.noOfDays && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{pkgError.noOfDays}</div>}
              </div>

              {/* Assign to Subadmins */}
              <div style={{ marginTop: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  Assign to Subadmins (Optional - leave empty for all)
                </label>
                <select
                  multiple
                  value={npkg.assignedSubadmins || []}
                  onChange={e => {
                    const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                    setNpkg({ ...npkg, assignedSubadmins: selected });
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                    background: "#fff",
                    cursor: "pointer",
                    minHeight: "80px"
                  }}
                >
                  {subadmins.map(sub => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name} ({sub.email})
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                  Hold Ctrl/Cmd to select multiple subadmins
                </p>
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Plan Duration *</label>
                <select
                  value={npkg.planDuration}
                  onChange={e => setNpkg({ ...npkg, planDuration: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                    background: "#fff",
                    cursor: "pointer"
                  }}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="90 Days">90 Days</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>


              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button
                  onClick={() => setModal(null)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#f8fafc",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#374151",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={createPackage}
                  disabled={pkgSaveLoading}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "linear-gradient(135deg,#0ea5e9,#0284c7)",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#fff",
                    cursor: pkgSaveLoading ? "not-allowed" : "pointer",
                    opacity: pkgSaveLoading ? 0.7 : 1
                  }}
                >
                  {pkgSaveLoading ? "Creating..." : "Create Package"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dashboard Overview ──
function OverviewPage({ subadmins, clients, employees, managers, projects, packages, invoices }) {
  const stats = [
    { label: "Total Clients", value: clients.length, color: "#9333ea" },
    { label: "Employees", value: employees.length, color: "#7c3aed" },
    { label: "Managers", value: managers.length, color: "#f59e0b" },
    { label: "Projects", value: projects.length, color: "#a855f7" },
    { label: "Subadmins", value: subadmins.length, color: "#3b82f6" },
    { label: "Active Packages", value: packages.length, color: "#10b981" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 16 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 16, padding: "20px 16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginTop: 8 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Project Progress</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {projects.length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: 13 }}>No projects found</div>
            ) : (
              projects.slice(0, 5).map(p => (
                <div key={p._id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{p.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6" }}>{p.progress || 0}%</span>
                  </div>
                  <div style={{ background: "#f1f5f9", borderRadius: 4, height: 6 }}>
                    <div style={{ width: `${p.progress || 0}%`, background: (p.progress || 0) === 100 ? "#22C55E" : "#3b82f6", borderRadius: 4, height: "100%" }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Recent Invoices</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {invoices.length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: 13 }}>No invoices found</div>
            ) : (
              invoices.slice(0, 5).map(inv => (
                <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{inv.invoiceNo} · {inv.client}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Due: {inv.dueDate || "—"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>₹{inv.total?.toLocaleString() || "0"}</div>
                    <Badge label={inv.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Subadmins List ──
function SubadminsList({ subadmins, refresh, packages }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", companyName: "", companyType: "IT", employeeCount: "0-10" });
  const [loading, setLoading] = useState(false);

  // Assign Package Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedSubadmin, setSelectedSubadmin] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [durationDays, setDurationDays] = useState(30);
  const [assignLoading, setAssignLoading] = useState(false);
  const [subadminPackages, setSubadminPackages] = useState({});

  // Fetch subadmin's packages
  const fetchSubadminPackages = async (subadminId) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/subscriptions/subadmin/${subadminId}`);
      setSubadminPackages(prev => ({ ...prev, [subadminId]: res.data.subscriptions || [] }));
    } catch (e) {
      console.error("Failed to fetch subadmin packages:", e);
    }
  };

  const openAssignModal = (subadmin) => {
    setSelectedSubadmin(subadmin);
    setSelectedPackage("");
    setBillingCycle("monthly");
    setDurationDays(30);
    setAssignModalOpen(true);
  };

  const handleAssignPackage = async () => {
    if (!selectedPackage) return alert("Please select a package");
    const pkg = packages.find(p => p._id === selectedPackage);
    if (!pkg) return alert("Package not found");

    setAssignLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/subscriptions/assign-to-subadmin`, {
        subadminId: selectedSubadmin._id,
        subadminEmail: selectedSubadmin.email,
        subadminName: selectedSubadmin.name,
        packageId: pkg._id,
        packageTitle: pkg.title,
        planPrice: pkg.price,
        billingCycle,
        durationDays
      });
      alert(`Package "${pkg.title}" assigned to ${selectedSubadmin.name} successfully!`);
      setAssignModalOpen(false);
      // Refresh packages for this subadmin
      fetchSubadminPackages(selectedSubadmin._id);
    } catch (e) {
      alert("Failed to assign package: " + (e.response?.data?.error || e.message));
    } finally {
      setAssignLoading(false);
    }
  };

  const handleViewCompany = async (companyName) => {
    if (!companyName || companyName === "—") return;
    setSelectedCompany(companyName);
    setCompanyModalOpen(true);
    setCompanyLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/subadmins/company/${encodeURIComponent(companyName)}`);
      setCompanyData(res.data);
    } catch (e) {
      alert("Failed to fetch company details: " + (e.response?.data?.msg || e.message));
    } finally {
      setCompanyLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) return alert("Name, email and password required.");
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/subadmins`, { ...form, role: "subadmin" });
      setModalOpen(false);
      setForm({ name: "", email: "", password: "", phone: "", companyName: "", companyType: "IT", employeeCount: "0-10" });
      refresh();
    } catch (e) {
      alert("Failed to create subadmin: " + (e.response?.data?.msg || e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Registered Subadmins ({subadmins.length})</h3>
        <button onClick={() => setModalOpen(true)} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Add Subadmin</button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {["Name", "Email", "Phone", "Company", "Type", "Employees", "Status", "Joined", "Actions"].map(h => (
              <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#64748b", borderBottom: "2px solid #e2e8f0" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subadmins.map((s, i) => (
            <tr key={s._id || i} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>{s.name}</td>
              <td style={{ padding: "14px 16px", color: "#475569" }}>{s.email}</td>
              <td style={{ padding: "14px 16px", color: "#475569" }}>{s.phone || "—"}</td>
              <td style={{ padding: "14px 16px" }}>
                <span
                  onClick={() => handleViewCompany(s.companyName || s.company)}
                  style={{
                    color: (s.companyName || s.company) ? "#3b82f6" : "#94a3b8",
                    fontWeight: 600,
                    cursor: (s.companyName || s.company) ? "pointer" : "default",
                    textDecoration: (s.companyName || s.company) ? "underline" : "none"
                  }}
                >
                  {s.companyName || s.company || "—"}
                </span>
              </td>
              <td style={{ padding: "14px 16px", color: "#475569" }}>{s.companyType || "IT"}</td>
              <td style={{ padding: "14px 16px", color: "#475569" }}>{s.employeeCount || "0-10"}</td>
              <td style={{ padding: "14px 16px" }}><Badge label={s.status || "Active"} /></td>
              <td style={{ padding: "14px 16px", color: "#64748b" }}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}</td>
              <td style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", gap: 8 }}>

                  <button
                    onClick={async () => {
                      if (window.confirm("Delete this subadmin?")) {
                        await axios.delete(`${BASE_URL}/api/subadmins/${s._id}`);
                        refresh();
                      }
                    }}
                    style={{
                      background: "#fee2e2",
                      color: "#ef4444",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {subadmins.length === 0 && <tr><td colSpan={9} style={{ padding: 20, textAlign: "center", color: "#94a3b8" }}>No subadmins found</td></tr>}
        </tbody>
      </table>

      {companyModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 16, width: 900, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
                {selectedCompany} - Company Details
              </h3>
              <button onClick={() => setCompanyModalOpen(false)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#64748b" }}>×</button>
            </div>

            {companyLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Loading...</div>
            ) : companyData ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Summary Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                  <div style={{ background: "#eff6ff", padding: 16, borderRadius: 12, border: "1px solid #dbeafe" }}>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Employees</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#3b82f6" }}>{companyData.employees?.length || 0}</div>
                  </div>
                  <div style={{ background: "#f0fdf4", padding: 16, borderRadius: 12, border: "1px solid #bbf7d0" }}>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Managers</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#22c55e" }}>{companyData.managers?.length || 0}</div>
                  </div>
                  <div style={{ background: "#fef3c7", padding: 16, borderRadius: 12, border: "1px solid #fde68a" }}>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Clients</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#f59e0b" }}>{companyData.clients?.length || 0}</div>
                  </div>
                  <div style={{ background: "#f3e8ff", padding: 16, borderRadius: 12, border: "1px solid #d8b4fe" }}>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Quotations</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#a855f7" }}>{companyData.quotations?.length || 0}</div>
                  </div>
                </div>

                {/* Employees Section */}
                {companyData.employees?.length > 0 && (
                  <div>
                    <h4 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 20 }}>👥</span> Employees
                    </h4>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Name</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Email</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Department</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companyData.employees.map((emp, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px 12px" }}>{emp.name}</td>
                            <td style={{ padding: "10px 12px", color: "#64748b" }}>{emp.email}</td>
                            <td style={{ padding: "10px 12px" }}>{emp.department || "—"}</td>
                            <td style={{ padding: "10px 12px" }}><Badge label={emp.status || "Active"} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Managers Section */}
                {companyData.managers?.length > 0 && (
                  <div>
                    <h4 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 20 }}>🎯</span> Managers
                    </h4>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Name</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Email</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Department</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companyData.managers.map((mgr, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px 12px" }}>{mgr.managerName}</td>
                            <td style={{ padding: "10px 12px", color: "#64748b" }}>{mgr.email}</td>
                            <td style={{ padding: "10px 12px" }}>{mgr.department || "—"}</td>
                            <td style={{ padding: "10px 12px" }}><Badge label={mgr.status || "Active"} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Clients Section */}
                {companyData.clients?.length > 0 && (
                  <div>
                    <h4 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 20 }}>🤝</span> Clients
                    </h4>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Client Name</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Email</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Phone</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companyData.clients.map((client, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px 12px" }}>{client.clientName}</td>
                            <td style={{ padding: "10px 12px", color: "#64748b" }}>{client.email}</td>
                            <td style={{ padding: "10px 12px" }}>{client.phone || "—"}</td>
                            <td style={{ padding: "10px 12px" }}><Badge label={client.status || "Active"} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Quotations Section */}
                {companyData.quotations?.length > 0 && (
                  <div>
                    <h4 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 20 }}>📄</span> Quotations
                    </h4>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Quote #</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Status</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Items</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#64748b" }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companyData.quotations.map((quote, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px 12px" }}>{quote.qt?.quoteNumber || `QT-${i + 1}`}</td>
                            <td style={{ padding: "10px 12px" }}><Badge label={quote.status || "draft"} /></td>
                            <td style={{ padding: "10px 12px" }}>{quote.items?.length || 0} items</td>
                            <td style={{ padding: "10px 12px", color: "#64748b" }}>
                              {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* No Data Message */}
                {!companyData.employees?.length && !companyData.managers?.length && !companyData.clients?.length && !companyData.quotations?.length && (
                  <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                    No data found for this company.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 16, width: 450, maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>Create New Subadmin</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1" }} />
              <input placeholder="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1" }} />
              <input placeholder="Password *" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1" }} />
              <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1" }} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <input placeholder="Company Name" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} style={{ padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1" }} />
                <select value={form.companyType} onChange={e => setForm({ ...form, companyType: e.target.value })} style={{ padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1" }}>
                  <option value="IT">IT</option>
                  <option value="Software">Software</option>
                  <option value="Services">Services</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <select value={form.employeeCount} onChange={e => setForm({ ...form, employeeCount: e.target.value })} style={{ padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1" }}>
                {["0-10", "11-50", "51-100", "100+"].map(ec => <option key={ec} value={ec}>{ec} Employees</option>)}
              </select>

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button onClick={() => setModalOpen(false)} style={{ flex: 1, padding: "10px", background: "#f1f5f9", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleCreate} disabled={loading} style={{ flex: 1, padding: "10px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>{loading ? "Creating..." : "Create"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Package Modal */}
      {assignModalOpen && selectedSubadmin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: 28, borderRadius: 20, width: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>📦 Assign Package</h3>
                <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>to {selectedSubadmin.name}</p>
              </div>
              <button onClick={() => setAssignModalOpen(false)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#64748b" }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Package Selection */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Select Package *</label>
                <select
                  value={selectedPackage}
                  onChange={e => setSelectedPackage(e.target.value)}
                  style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, background: "#f9fafb" }}
                >
                  <option value="">-- Choose a package --</option>
                  {packages.map(pkg => (
                    <option key={pkg._id} value={pkg._id}>
                      {pkg.title} - ₹{pkg.price} ({pkg.no_of_days} days)
                    </option>
                  ))}
                </select>
                {packages.length === 0 && (
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: "#ef4444" }}>No packages available. Please create packages first.</p>
                )}
              </div>

              {/* Billing Cycle */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Billing Cycle</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {["monthly", "quarterly", "halfYearly", "annual"].map(cycle => (
                    <label key={cycle} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "8px 12px", background: billingCycle === cycle ? "#ede9fe" : "#f3f4f6", borderRadius: 8, border: billingCycle === cycle ? "2px solid #9333ea" : "2px solid transparent" }}>
                      <input
                        type="radio"
                        name="billingCycle"
                        value={cycle}
                        checked={billingCycle === cycle}
                        onChange={() => setBillingCycle(cycle)}
                        style={{ cursor: "pointer" }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600, color: billingCycle === cycle ? "#9333ea" : "#374151", textTransform: "capitalize" }}>
                        {cycle === "halfYearly" ? "Half-Yearly" : cycle}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Duration Days */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Duration (Days) *</label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={e => setDurationDays(parseInt(e.target.value) || 30)}
                  min={1}
                  max={3650}
                  style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, background: "#f9fafb" }}
                />
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "#6b7280" }}>Subscription will expire after {durationDays} days from today.</p>
              </div>

              {/* Summary */}
              {selectedPackage && (
                <div style={{ background: "linear-gradient(135deg,#f3e8ff,#faf5ff)", padding: 16, borderRadius: 12, border: "1px solid #d8b4fe" }}>
                  <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#7c3aed" }}>Assignment Summary</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                    <div><span style={{ color: "#6b7280" }}>Subadmin:</span> <strong style={{ color: "#0f172a" }}>{selectedSubadmin.name}</strong></div>
                    <div><span style={{ color: "#6b7280" }}>Package:</span> <strong style={{ color: "#0f172a" }}>{packages.find(p => p._id === selectedPackage)?.title || "—"}</strong></div>
                    <div><span style={{ color: "#6b7280" }}>Price:</span> <strong style={{ color: "#0f172a" }}>₹{packages.find(p => p._id === selectedPackage)?.price || "0"}</strong></div>
                    <div><span style={{ color: "#6b7280" }}>Duration:</span> <strong style={{ color: "#0f172a" }}>{durationDays} days</strong></div>
                    <div><span style={{ color: "#6b7280" }}>Start Date:</span> <strong style={{ color: "#0f172a" }}>{new Date().toLocaleDateString()}</strong></div>
                    <div><span style={{ color: "#6b7280" }}>End Date:</span> <strong style={{ color: "#0f172a" }}>{new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong></div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  onClick={() => setAssignModalOpen(false)}
                  style={{ flex: 1, padding: "12px", background: "#f3f4f6", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", color: "#374151" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignPackage}
                  disabled={!selectedPackage || assignLoading}
                  style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#9333ea,#c084fc)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: !selectedPackage || assignLoading ? "not-allowed" : "pointer", opacity: !selectedPackage || assignLoading ? 0.6 : 1 }}
                >
                  {assignLoading ? "Assigning..." : "📦 Assign Package"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subscriptions Page ──
function SubscriptionsPage({ subscriptions }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = subscriptions.filter(sub => {
    const matchesSearch = (sub.userName || "").toLowerCase().includes(search.toLowerCase()) ||
      (sub.userEmail || "").toLowerCase().includes(search.toLowerCase()) ||
      (sub.planName || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    active: "#22C55E",
    pending: "#F59E0B",
    expired: "#EF4444",
    cancelled: "#64748B"
  };

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
          All Subscriptions ({subscriptions.length})
        </h3>
        <div style={{ display: "flex", gap: 12 }}>
          <input
            placeholder="Search user, email or plan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, minWidth: 220 }}
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13 }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {["User Name", "Email", "Plan", "Price", "Billing", "Status", "Start Date", "End Date", "Provider"].map(h => (
              <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#64748b", borderBottom: "2px solid #e2e8f0" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((sub, i) => (
            <tr key={sub._id || i} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>{sub.userName || "—"}</td>
              <td style={{ padding: "14px 16px", color: "#475569" }}>{sub.userEmail || "—"}</td>
              <td style={{ padding: "14px 16px", color: "#3b82f6", fontWeight: 600 }}>{sub.planName || "—"}</td>
              <td style={{ padding: "14px 16px", color: "#0f172a", fontWeight: 700 }}>₹{sub.planPrice || 0}</td>
              <td style={{ padding: "14px 16px", color: "#475569", textTransform: "capitalize" }}>{sub.billingCycle || "—"}</td>
              <td style={{ padding: "14px 16px" }}>
                <span style={{
                  background: `${statusColors[sub.status] || "#64748B"}18`,
                  color: statusColors[sub.status] || "#64748B",
                  border: `1px solid ${statusColors[sub.status] || "#64748B"}30`,
                  padding: "2px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "capitalize"
                }}>
                  {sub.status || "—"}
                </span>
              </td>
              <td style={{ padding: "14px 16px", color: "#64748b" }}>
                {sub.startDate ? new Date(sub.startDate).toLocaleDateString() : "—"}
              </td>
              <td style={{ padding: "14px 16px", color: "#64748b" }}>
                {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : "—"}
              </td>
              <td style={{ padding: "14px 16px", color: "#475569" }}>{sub.providerCompany || "—"}</td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                {subscriptions.length === 0 ? "No subscriptions found" : "No matching subscriptions"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Packages Page
function PackagesPage({ packages }) {
  try {
    const displayedPackages = (packages && packages.length > 0) ? packages : [];

    if (displayedPackages.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📦</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>No Packages Yet</h3>
          <p style={{ color: "#64748b", fontSize: 14, maxWidth: 400, margin: "0 auto" }}>Create your first subscription package to start offering services to subadmins.</p>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
        {/* Cards Grid - 3 columns like the design */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, marginBottom: 40, background: "#f8fafc", borderRadius: 16, overflow: "hidden" }}>
          {displayedPackages.map((p, idx) => {
            const isPro = p.id === "pro" || p.title === "PRO";
            const features = Array.isArray(p.features) ? p.features : (p.features || "").split('\n').filter(f => f.trim());
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
                  {p.description}
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
                    {p.price || p.monthlyPrice}
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
                    {features.map((f, i) => (
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
                        <span>{f && f.trim ? f.trim() : f}</span>
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
  } catch (error) {
    console.error("PackagesPage error:", error);
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
        <div style={{ fontSize: 24, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Unable to load packages</div>
        <div style={{ fontSize: 14 }}>Please try refreshing the page</div>
      </div>
    );
  }
}

// ── Clients Page ──
function ClientsPage({ clients, setClients }) {
  const [search, setSearch] = useState("");
  const filtered = clients.filter(c =>
    (c.clientName || c.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.companyName || c.company || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>All Clients ({filtered.length})</h3>
        <input
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, minWidth: 200 }}
        />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {["Name", "Company", "Email", "Phone", "Status", "Joined"].map(h => (
              <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#64748b", borderBottom: "2px solid #e2e8f0" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((c, i) => (
            <tr key={c._id || i} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>{c.clientName || c.name || "—"}</td>
              <td style={{ padding: "14px 16px", color: "#475569" }}>{c.companyName || c.company || "—"}</td>
              <td style={{ padding: "14px 16px", color: "#475569" }}>{c.email || "—"}</td>
              <td style={{ padding: "14px 16px", color: "#475569" }}>{c.phone || "—"}</td>
              <td style={{ padding: "14px 16px" }}><Badge label={c.status || "Active"} /></td>
              <td style={{ padding: "14px 16px", color: "#64748b" }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#94a3b8" }}>No clients found</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

// ── Employees Page ──
function EmployeesPage({ employees, setEmployees }) {
  const [search, setSearch] = useState("");
  const filtered = employees.filter(e =>
    (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.role || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.department || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>All Employees ({filtered.length})</h3>
        <input
          placeholder="Search employees..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, minWidth: 200 }}
        />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {["Name", "Email", "Role", "Department", "Status", "Joined"].map(h => (
              <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#64748b", borderBottom: "2px solid #e2e8f0" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((e, i) => (
            <tr key={e._id || i} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>{e.name || "—"}</td>
              <td style={{ padding: "14px 16px", color: "#475569" }}>{e.email || "—"}</td>
              <td style={{ padding: "14px 16px", color: "#475569" }}>{e.role || "—"}</td>
              <td style={{ padding: "14px 16px", color: "#475569" }}>{e.department || "—"}</td>
              <td style={{ padding: "14px 16px" }}><Badge label={e.status || "Active"} /></td>
              <td style={{ padding: "14px 16px", color: "#64748b" }}>{e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "—"}</td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#94a3b8" }}>No employees found</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

// ── Managers Page ──
function ManagersPage({ managers, setManagers }) {
  const [search, setSearch] = useState("");
  const filtered = managers.filter(m =>
    (m.managerName || m.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.department || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>All Managers ({filtered.length})</h3>
        <input
          placeholder="Search managers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, minWidth: 200 }}
        />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {["Name", "Email", "Department", "Role", "Status", "Joined"].map(h => (
              <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#64748b", borderBottom: "2px solid #e2e8f0" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((m, i) => (
            <tr key={m._id || i} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>{m.managerName || m.name || "—"}</td>
              <td style={{ padding: "14px 16px", color: "#475569" }}>{m.email || "—"}</td>
              <td style={{ padding: "14px 16px", color: "#475569" }}>{m.department || "—"}</td>
              <td style={{ padding: "14px 16px", color: "#475569" }}>{m.role || "Manager"}</td>
              <td style={{ padding: "14px 16px" }}><Badge label={m.status || "Active"} /></td>
              <td style={{ padding: "14px 16px", color: "#64748b" }}>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "—"}</td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#94a3b8" }}>No managers found</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

// ── Projects Page ──
function ProjectsPage({ projects, setProjects, clients, employees }) {
  const [search, setSearch] = useState("");
  const filtered = projects.filter(p =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.client || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.status || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>All Projects ({filtered.length})</h3>
        <input
          placeholder="Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, minWidth: 200 }}
        />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {["Project Name", "Client", "Status", "Start Date", "End Date", "Budget"].map(h => (
              <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#64748b", borderBottom: "2px solid #e2e8f0" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((p, i) => (
            <tr key={p._id || i} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>{p.name || "—"}</td>
              <td style={{ padding: "14px 16px", color: "#475569" }}>{p.client || "—"}</td>
              <td style={{ padding: "14px 16px" }}><Badge label={p.status || "Pending"} /></td>
              <td style={{ padding: "14px 16px", color: "#64748b" }}>{p.start ? new Date(p.start).toLocaleDateString() : "—"}</td>
              <td style={{ padding: "14px 16px", color: "#64748b" }}>{p.end ? new Date(p.end).toLocaleDateString() : "—"}</td>
              <td style={{ padding: "14px 16px", color: "#475569" }}>{p.budget ? `₹${p.budget}` : "—"}</td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#94a3b8" }}>No projects found</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

// ── Project Status Page ──
function ProjectStatusPage({ projects }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
      <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Project Status Tracking</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {["Project Name", "Client", "Deadline", "Progress", "Status"].map(h => (
              <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#64748b", borderBottom: "2px solid #e2e8f0" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projects.map((p, i) => (
            <tr key={p._id || i} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "14px 16px", fontWeight: 600, color: "#0f172a" }}>{p.name}</td>
              <td style={{ padding: "14px 16px", color: "#475569" }}>{p.client}</td>
              <td style={{ padding: "14px 16px", color: "#64748b" }}>{p.deadline || p.end || "—"}</td>
              <td style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, background: "#e2e8f0", borderRadius: 4, height: 6 }}>
                    <div style={{ width: `${p.progress || 0}%`, background: (p.progress || 0) === 100 ? "#22C55E" : "#3b82f6", borderRadius: 4, height: "100%" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>{p.progress || 0}%</span>
                </div>
              </td>
              <td style={{ padding: "14px 16px" }}><Badge label={p.status || "Pending"} /></td>
            </tr>
          ))}
          {projects.length === 0 && <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: "#94a3b8" }}>No projects found</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

// ── Interview Page ──
function InterviewPage() {
  const [candidates] = useState([
    { id: 1, name: "John Doe", role: "Developer", status: "pending", email: "john@example.com" },
    { id: 2, name: "Jane Smith", role: "Designer", status: "hired", email: "jane@example.com" },
    { id: 3, name: "Bob Wilson", role: "Manager", status: "rejected", email: "bob@example.com" }
  ]);
  const [filter, setFilter] = useState("all");

  const filtered = candidates.filter(c => filter === "all" || c.status === filter);
  const counts = { total: candidates.length, pending: candidates.filter(c => c.status === "pending").length, hired: candidates.filter(c => c.status === "hired").length, rejected: candidates.filter(c => c.status === "rejected").length };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[{ t: "Total", v: counts.total, c: "#3b82f6" }, { t: "Pending", v: counts.pending, c: "#f59e0b" }, { t: "Hired", v: counts.hired, c: "#22C55E" }, { t: "Rejected", v: counts.rejected, c: "#EF4444" }].map(({ t, v, c }) => (
          <div key={t} style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, marginBottom: 4 }}>{t}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {["all", "pending", "hired", "rejected"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid", borderColor: filter === f ? "#3b82f6" : "#e2e8f0", background: filter === f ? "#eff6ff" : "#fff", color: filter === f ? "#3b82f6" : "#64748b" }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Name", "Role", "Email", "Status"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#64748b", borderBottom: "2px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.id || i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>{c.name}</td>
                <td style={{ padding: "14px 16px", color: "#475569" }}>{c.role}</td>
                <td style={{ padding: "14px 16px", color: "#475569" }}>{c.email}</td>
                <td style={{ padding: "14px 16px" }}><Badge label={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
