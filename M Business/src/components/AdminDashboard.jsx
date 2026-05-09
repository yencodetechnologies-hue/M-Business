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

const THEME_MAP = {
  light: {
    bg: "#f8fafc",
    sidebar: "#ffffff",
    card: "#ffffff",
    surface: "#f1f5f9",
    text: "#0f172a",
    muted: "#64748b",
    border: "#e2e8f0",
    accent: "#3b82f6",
    accentSecondary: "#10b981",
    shadow: "0 10px 25px rgba(0,0,0,0.03)",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)",
  },
  dark: {
    bg: "#0f172a",
    sidebar: "#1e293b",
    card: "#1e293b",
    surface: "rgba(255,255,255,0.05)",
    text: "#f8fafc",
    muted: "#94a3b8",
    border: "#334155",
    accent: "#6366f1",
    accentSecondary: "#10b981",
    shadow: "0 10px 30px rgba(0,0,0,0.4)",
    gradient: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
  }
};

const sc = (s) => ({
  Active: "#22C55E",
  Inactive: "#EF4444",
  Pending: "#F59E0B",
}[s] || "var(--app-accent)");

function Badge({ label }) {
  const c = sc(label);
  return (
    <span style={{
      background: `${c}12`,
      color: c,
      border: `1px solid ${c}25`,
      padding: "4px 12px",
      borderRadius: "100px",
      fontSize: 10,
      fontWeight: 800,
      whiteSpace: "nowrap",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    }}>
      {label}
    </span>
  );
}

const NAV = [
  { key: "dashboard", icon: "", label: "Dashboard" },
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
  const [npkg, setNpkg] = useState({
    title: "",
    description: "",
    icon: "📦",
    isFree: false,
    price: "",
    noOfDays: "30",
    planDuration: "Monthly Plan",
    businessLimit: "Single business manage",
    managerLimit: "1",
    clientLimit: "3",
    employeeLimit: "10",
    assignedSubadmins: []
  });
  const [editPkg, setEditPkg] = useState(null);
  const [updateActiveSubs, setUpdateActiveSubs] = useState(true);
  const [pkgSaveLoading, setPkgSaveLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [pkgError, setPkgError] = useState({});

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("adminDarkMode") === "true");
  const THEME = darkMode ? THEME_MAP.dark : THEME_MAP.light;

  useEffect(() => {
    localStorage.setItem("adminDarkMode", darkMode);
    if (darkMode) document.documentElement.classList.add("dark-mode");
    else document.documentElement.classList.remove("dark-mode");
  }, [darkMode]);

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
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(BASE_URL + "/api/tasks");
      setTasks(res.data);
    } catch (e) { console.error(e); }
  };

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

  const savePackage = async () => {
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
        buttonName: "",
        features: [
          npkg.planDuration.toLowerCase().includes("plan") ? npkg.planDuration : `${npkg.planDuration} Plan`,
          npkg.businessLimit,
          npkg.managerLimit ? `Managers: ${npkg.managerLimit}` : "",
          npkg.clientLimit ? `Clients: ${npkg.clientLimit}` : "",
          npkg.employeeLimit ? `Employees: ${npkg.employeeLimit}` : ""
        ].filter(Boolean),
        planDuration: npkg.planDuration,
        businessLimit: npkg.businessLimit,
        managerLimit: npkg.managerLimit || "",
        clientLimit: npkg.clientLimit || "",
        employeeLimit: npkg.employeeLimit || "",
        targetRole: "subadmin",
        assignedSubadmins: npkg.assignedSubadmins || []
      };
      let res;
      if (editPkg) {
        res = await axios.put(`${BASE_URL}/api/packages/${editPkg._id}`, {
          ...packageData,
          updateActiveSubscriptions: updateActiveSubs
        });
        setPackages(prev => prev.map(p => p._id === editPkg._id ? res.data : p));
      } else {
        res = await axios.post(BASE_URL + "/api/packages", packageData);
        setPackages(prev => [...prev, res.data]);
      }
      await fetchSubscriptions();
      setNpkg({
        title: "",
        description: "",
        icon: "📦",
        isFree: false,
        price: "",
        noOfDays: "30",
        planDuration: "Monthly Plan",
        businessLimit: "Single business manage",
        managerLimit: "1",
        clientLimit: "3",
        employeeLimit: "10",
        assignedSubadmins: []
      });
      setPkgError({});
      setEditPkg(null);
      setModal(null);
    } catch (err) {
      console.error(err);
      alert(editPkg ? "Failed to update package" : "Failed to create package");
    } finally {
      setPkgSaveLoading(false);
    }
  };

  const deletePackage = async (id) => {
    if (!window.confirm("Are you sure you want to delete this package?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/packages/${id}`);
      setPackages(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete package");
    }
  };

  const handleEditPackageClick = (pkg) => {
    setEditPkg(pkg);
    setNpkg({
      title: pkg.title || "",
      description: pkg.description || "",
      icon: pkg.icon || "📦",
      isFree: pkg.type === "free",
      price: pkg.price?.toString() || "",
      noOfDays: pkg.no_of_days?.toString() || pkg.noOfDays?.toString() || "30",
      planDuration: pkg.planDuration || "Monthly Plan",
      businessLimit: pkg.businessLimit || "Single business manage",
      managerLimit: pkg.managerLimit || "",
      clientLimit: pkg.clientLimit || "",
      employeeLimit: pkg.employeeLimit || "",
      assignedSubadmins: pkg.assignedSubadmins || []
    });
    setModal("package_add");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const displayName = user?.companyName || "M Business";
  const initials = (displayName || "WS").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const B = (color) => {
    const isVar = color && color.startsWith("var");
    return {
      background: isVar ? `var(--app-accent-gradient, linear-gradient(135deg, ${color}, ${color}))` : `linear-gradient(135deg, ${color}, ${color}cc)`,
      color: "#fff",
      border: "none",
      borderRadius: 12,
      padding: "10px 20px",
      fontWeight: 700,
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "inherit",
      boxShadow: "0 8px 20px -6px rgba(59, 130, 246, 0.3)",
      transition: "all 0.3s ease",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    };
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: THEME.bg, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", color: THEME.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        :root {
          --app-bg: ${THEME.bg};
          --app-sidebar: ${THEME.sidebar};
          --app-card: ${THEME.card};
          --app-surface: ${THEME.surface};
          --app-text: ${THEME.text};
          --app-muted: ${THEME.muted};
          --app-border: ${THEME.border};
          --app-accent: ${THEME.accent};
          --app-shadow: ${THEME.shadow};
          --app-gradient: ${THEME.gradient};
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${THEME.border}; borderRadius: 10px; }
        .premium-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .premium-card:hover { transform: translateY(-4px); box-shadow: ${THEME.shadow}; }
        table th { background: ${THEME.surface} !important; color: ${THEME.muted} !important; border-bottom: 1.5px solid ${THEME.border} !important; }
        table td { border-bottom: 1px solid ${THEME.border} !important; color: ${THEME.text} !important; }
        input, select, textarea { background: ${THEME.card} !important; color: ${THEME.text} !important; border: 1.5px solid ${THEME.border} !important; }
      `}</style>

      {/* SIDEBAR */}
      <div style={{ width: 260, background: THEME.sidebar, color: darkMode ? "#fff" : THEME.text, display: "flex", flexDirection: "column", position: "relative", zIndex: 100, borderRight: `1.5px solid ${THEME.border}` }}>
        <div style={{ padding: "32px 24px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, background: darkMode ? "rgba(255,255,255,0.05)" : "#fff", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "4px", border: darkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0" }}>
            {user?.logoUrl ? <img src={user.logoUrl} alt="logo" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} /> : <span style={{ color: darkMode ? "#fff" : "#1a3d4d", fontWeight: 900 }}>A</span>}
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: "-0.5px", color: darkMode ? "#fff" : "#0f172a" }}>M Business</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 16px", overflowY: "auto" }}>
          <div style={{ fontSize: 10, color: darkMode ? "rgba(255,255,255,0.3)" : THEME.muted, fontWeight: 800, letterSpacing: 1.5, marginBottom: 20, paddingLeft: 12, textTransform: "uppercase" }}>Main Menu</div>
          {NAV.map(n => {
            const on = active === n.key;
            return (
              <button key={n.key} onClick={() => setActive(n.key)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "12px 18px",
                  background: on ? (darkMode ? "rgba(255,255,255,0.1)" : "rgba(59,130,246,0.1)") : "transparent",
                  border: "none", borderRadius: 14, color: on ? (darkMode ? "#fff" : "#3b82f6") : (darkMode ? "rgba(255,255,255,0.5)" : "#64748b"),
                  fontWeight: on ? 800 : 600, fontSize: 14, cursor: "pointer", marginBottom: 6, transition: "0.2s"
                }}>
                <span style={{ fontSize: 18 }}>{n.key === 'dashboard' ? '📊' : n.key === 'proposals' ? '📄' : n.key === 'reports' ? '📈' : n.key === 'subscriptions' ? '💳' : n.key === 'packages' ? '📦' : '💸'}</span>
                <span style={{ flex: 1, textAlign: "left" }}>{n.label}</span>
                {on && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "20px 16px", borderTop: `1px solid ${THEME.border}` }}>
          <div onClick={() => setDarkMode(!darkMode)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", padding: "12px 16px", borderRadius: 14, cursor: "pointer", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: darkMode ? "rgba(255,255,255,0.6)" : "#64748b" }}>Dark Mode</div>
            <div style={{ width: 36, height: 20, background: darkMode ? "#10b981" : "#e2e8f0", borderRadius: 20, position: "relative", transition: "0.3s" }}>
              <div style={{ width: 14, height: 14, background: "#fff", borderRadius: "50%", position: "absolute", top: 3, left: darkMode ? 19 : 3, transition: "0.3s" }} />
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: "100%", background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 12, padding: "12px", color: "#f87171", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>🚪 Logout</button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "24px 32px", background: THEME.card, borderBottom: `1.5px solid ${THEME.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: THEME.text, letterSpacing: "-0.5px" }}>{NAV.find(n => n.key === active)?.label}</h2>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {active === "packages" && (
              <button onClick={() => { setEditPkg(null); setNpkg({ title: "", description: "", icon: "📦", isFree: false, price: "", noOfDays: "30", planDuration: "Monthly Plan", businessLimit: "Single business manage", managerLimit: "1", clientLimit: "3", employeeLimit: "10", assignedSubadmins: [] }); setPkgError({}); setModal("package_add"); }}
                style={{ background: THEME.accent, color: "#fff", border: "none", borderRadius: 12, padding: "10px 24px", fontWeight: 800, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.2)" }}>
                + Add Package
              </button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, padding: 32, overflowY: "auto" }}>
          {active === "dashboard" && <OverviewPage THEME={THEME} subadmins={subadmins} clients={clients} employees={employees} managers={managers} projects={projects} packages={packages} invoices={invoices} />}
          {active === "clients" && <ClientsPage THEME={THEME} clients={clients} setClients={setClients} />}
          {active === "subadmins" && <SubadminsList THEME={THEME} subadmins={subadmins} refresh={fetchSubadmins} packages={packages} subscriptions={subscriptions} fetchSubscriptions={fetchSubscriptions} />}
          {active === "employees" && <EmployeesPage THEME={THEME} employees={employees} setEmployees={setEmployees} />}
          {active === "managers" && <ManagersPage THEME={THEME} managers={managers} setManagers={setManagers} />}
          {active === "projects" && <ProjectsPage THEME={THEME} projects={projects} setProjects={setProjects} clients={clients} employees={employees} />}
          {active === "quotations" && <QuotationCreator THEME={THEME} clients={clients} projects={projects} />}
          {active === "proposals" && <ProjectProposalCreator clients={clients} companyLogo={user?.logoUrl} companyName={user?.companyName || "M Business"} />}
          {active === "invoices" && <InvoiceCreator THEME={THEME} clients={clients} projects={projects} />}
          {active === "tasks" && <TaskPage projects={projects} employees={employees} />}
          {active === "calendar" && <CalendarPage projects={projects} tasks={tasks} clients={clients} user={user} onUpdateProject={() => fetchProjects()} onUpdateTask={() => fetchTasks()} />}
          {active === "reports" && <ReportsPage THEME={THEME} clients={clients} projects={projects} employees={employees} managers={managers} />}
          {active === "subscriptions" && <SubscriptionsPage THEME={THEME} subscriptions={subscriptions} />}
          {active === "packages" && <PackagesPage THEME={THEME} packages={packages} onEdit={handleEditPackageClick} onDelete={deletePackage} darkMode={darkMode} />}
          {active === "payments" && <AccountsPage THEME={THEME} initialTab="income" />}
        </div>
      </div>

      {/* Package Creation Modal */}
      {modal === "package_add" && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16
        }}>
          <div style={{
            background: THEME.card,
            borderRadius: 24,
            width: "100%", maxWidth: 640,
            maxHeight: "90vh",
            overflow: "hidden",
            display: "flex", flexDirection: "column",
            boxShadow: THEME.shadow,
            border: `1.5px solid ${THEME.border}`
          }}>
            {/* Header */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "linear-gradient(135deg, #0a0a0f, #1a1a2e)"
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff" }}>
                  {editPkg ? "Edit Edit Package" : "📦 Add New Package"}
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                  {editPkg ? "Update subscription plan details" : "Create a subscription plan for subadmins"}
                </p>
              </div>
              <button onClick={() => setModal(null)} style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8, width: 32, height: 32,
                color: "#fff", fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>

              {/* Row 1: Title + Icon */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" }}>Package Title *</label>
                  <input
                    type="text"
                    value={npkg.title}
                    onChange={e => setNpkg({ ...npkg, title: e.target.value })}
                    placeholder="e.g., Basic Plan"
                    style={{
                      width: "100%", padding: "11px 14px",
                      border: pkgError.title ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0",
                      borderRadius: 10, fontSize: 13, outline: "none",
                      background: "#f8fafc", boxSizing: "border-box",
                      transition: "border-color 0.2s"
                    }}
                    onFocus={e => e.target.style.borderColor = "#7c3aed"}
                    onBlur={e => e.target.style.borderColor = pkgError.title ? "#ef4444" : "#e2e8f0"}
                  />
                  {pkgError.title && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>⚠️ {pkgError.title}</div>}
                </div>
                <div style={{ width: 90 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" }}>Icon</label>
                  <input
                    type="text"
                    value={npkg.icon}
                    onChange={e => setNpkg({ ...npkg, icon: e.target.value })}
                    placeholder="📦"
                    style={{
                      width: "100%", padding: "11px 10px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: 10, fontSize: 20, outline: "none",
                      background: "#f8fafc", textAlign: "center",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" }}>Description *</label>
                <textarea
                  value={npkg.description}
                  onChange={e => setNpkg({ ...npkg, description: e.target.value })}
                  placeholder="Describe what's included in this plan..."
                  rows={3}
                  style={{
                    width: "100%", padding: "11px 14px",
                    border: pkgError.description ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0",
                    borderRadius: 10, fontSize: 13, outline: "none",
                    background: "#f8fafc", resize: "none",
                    fontFamily: "inherit", boxSizing: "border-box"
                  }}
                />
                {pkgError.description && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>⚠️ {pkgError.description}</div>}
              </div>

              {/* Package Type + Price in one row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>Package Type *</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["Free", "Paid"].map(type => (
                      <button
                        key={type}
                        onClick={() => setNpkg({ ...npkg, isFree: type === "Free", price: type === "Free" ? "0" : npkg.price })}
                        style={{
                          flex: 1, padding: "10px",
                          borderRadius: 10, fontSize: 13, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit",
                          border: "1.5px solid",
                          borderColor: (type === "Free" ? npkg.isFree : !npkg.isFree)
                            ? "#7c3aed" : "#e2e8f0",
                          background: (type === "Free" ? npkg.isFree : !npkg.isFree)
                            ? "#f5f3ff" : "#f8fafc",
                          color: (type === "Free" ? npkg.isFree : !npkg.isFree)
                            ? "#7c3aed" : "#64748b",
                          transition: "all 0.15s"
                        }}
                      >
                        {type === "Free" ? "🎁 Free" : "💳 Paid"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>
                    Price {!npkg.isFree && "*"}
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                      fontSize: 14, color: "#94a3b8", fontWeight: 600, pointerEvents: "none"
                    }}>₹</span>
                    <input
                      type="text"
                      value={npkg.isFree ? "0" : npkg.price}
                      onChange={e => setNpkg({ ...npkg, price: e.target.value })}
                      disabled={npkg.isFree}
                      placeholder="999"
                      style={{
                        width: "100%", padding: "11px 14px 11px 28px",
                        border: pkgError.price ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0",
                        borderRadius: 10, fontSize: 13, outline: "none",
                        background: npkg.isFree ? "#f1f5f9" : "#f8fafc",
                        color: npkg.isFree ? "#94a3b8" : "#0f172a",
                        boxSizing: "border-box", fontFamily: "inherit"
                      }}
                    />
                  </div>
                  {pkgError.price && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>⚠️ {pkgError.price}</div>}
                </div>
              </div>

              {/* Row: Days + Plan Duration */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>Number of Days *</label>
                  <input
                    type="text"
                    value={npkg.noOfDays}
                    onChange={e => setNpkg({ ...npkg, noOfDays: e.target.value })}
                    placeholder="e.g., 30, 90, 365"
                    style={{
                      width: "100%", padding: "11px 14px",
                      border: pkgError.noOfDays ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0",
                      borderRadius: 10, fontSize: 13, outline: "none",
                      background: "#f8fafc", boxSizing: "border-box"
                    }}
                  />
                  {pkgError.noOfDays && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>⚠️ {pkgError.noOfDays}</div>}
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>Plan Duration</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {["Monthly Plan", "90 days", "Yearly Plan"].map(d => (
                      <button key={d} onClick={() => setNpkg({ ...npkg, planDuration: d, noOfDays: d === "Monthly Plan" ? "30" : d === "90 days" ? "90" : "365" })} style={{
                        padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1.5px solid",
                        borderColor: npkg.planDuration === d ? "var(--app-accent)" : "#e2e8f0",
                        background: npkg.planDuration === d ? "#f5f3ff" : "transparent",
                        color: npkg.planDuration === d ? "var(--app-accent)" : "#64748b",
                        transition: "0.2s", display: "flex", alignItems: "center", gap: 4
                      }}>
                        {npkg.planDuration === d && "✓"} {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row: Business Management */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>Business Management</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["Single business manage", "Multiple business manage"].map(b => (
                    <button key={b} onClick={() => setNpkg({ ...npkg, businessLimit: b })} style={{
                      flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1.5px solid",
                      borderColor: npkg.businessLimit === b ? "var(--app-accent)" : "#e2e8f0",
                      background: npkg.businessLimit === b ? "#f5f3ff" : "transparent",
                      color: npkg.businessLimit === b ? "var(--app-accent)" : "#64748b",
                      transition: "0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                    }}>
                      {npkg.businessLimit === b && "✓"} {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row: Manager Limit */}
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>Manager Limit</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    list="manager-limits"
                    value={npkg.managerLimit}
                    onChange={e => setNpkg({ ...npkg, managerLimit: e.target.value })}
                    placeholder="e.g. 5 Managers or Unlimited Managers"
                    style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 13, background: "#f8fafc", outline: "none" }}
                  />
                  <datalist id="manager-limits">
                    <option value="2 Managers" />
                    <option value="3 Managers" />
                    <option value="5 Managers" />
                    <option value="10 Managers" />
                    <option value="Unlimited Managers" />
                  </datalist>
                </div>
              </div>

              <div style={{ marginBottom: 15 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>Client Limit (Company Name)</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    list="client-limits"
                    value={npkg.clientLimit}
                    onChange={e => setNpkg({ ...npkg, clientLimit: e.target.value })}
                    placeholder="e.g. 10 Company manage or Unlimited"
                    style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 13, background: "#f8fafc", outline: "none" }}
                  />
                  <datalist id="client-limits">
                    <option value="1 Company manage" />
                    <option value="3 Company manage" />
                    <option value="5 Company manage" />
                    <option value="10 Company manage" />
                    <option value="Unlimited Company manage" />
                  </datalist>
                </div>
              </div>

              {/* Row: Employee Limit */}
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>Employee Limit</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    list="employee-limits"
                    value={npkg.employeeLimit}
                    onChange={e => setNpkg({ ...npkg, employeeLimit: e.target.value })}
                    placeholder="e.g. 50 Employees or Unlimited"
                    style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 13, background: "#f8fafc", outline: "none" }}
                  />
                  <datalist id="employee-limits">
                    <option value="5 Employees" />
                    <option value="10 Employees" />
                    <option value="20 Employees" />
                    <option value="50 Employees" />
                    <option value="Unlimited Employees" />
                  </datalist>
                </div>
              </div>

              {/* Assign to Subadmins */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" }}>
                  Assign to Subadmins
                  <span style={{ fontSize: 10, fontWeight: 400, color: "#94a3b8", marginLeft: 6, textTransform: "none" }}></span>
                </label>
                <SubadminDropdown
                  value={npkg.assignedSubadmins?.[0] || ""}
                  options={subadmins}
                  darkMode={darkMode}
                  onChange={val => {
                    const selected = val ? [val] : [];
                    setNpkg({ ...npkg, assignedSubadmins: selected });
                  }}
                />
                {/* {(npkg.assignedSubadmins?.length || 0) > 0 && (
            <div style={{ fontSize: 11, color: "#7c3aed", marginTop: 4, fontWeight: 600 }}>
              ✓ {npkg.assignedSubadmins.length} subadmin(s) selected
            </div>
          )} */}
              </div>



              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setModal(null)}
                  style={{
                    flex: 1, padding: "12px",
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 10, fontSize: 13, fontWeight: 600,
                    color: "#64748b", cursor: "pointer", fontFamily: "inherit"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={savePackage}
                  disabled={pkgSaveLoading}
                  style={{
                    flex: 2, padding: "12px",
                    background: pkgSaveLoading
                      ? "#a78bfa"
                      : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    border: "none", borderRadius: 10,
                    fontSize: 13, fontWeight: 700,
                    color: "#fff", cursor: pkgSaveLoading ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
                    transition: "all 0.2s"
                  }}
                >
                  {pkgSaveLoading ? (editPkg ? "Updating..." : "Creating...") : (editPkg ? "✨ Update Package" : "✨ Create Package")}
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
function OverviewPage({ THEME, subadmins, clients, employees, managers, projects, packages, invoices }) {
  const stats = [
    { label: "Total Company Names", value: clients.length, color: "var(--app-accent)" },
    { label: "Employees", value: employees.length, color: "var(--app-accent)" },
    { label: "Managers", value: managers.length, color: "#f59e0b" },
    { label: "Projects", value: projects.length, color: "var(--app-accent)" },
    { label: "Subadmins", value: subadmins.length, color: "#3b82f6" },
    { label: "Active Packages", value: packages.length, color: "#10b981" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Premium Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
        {[
          { label: "Total Company Names", value: clients.length, icon: "🏢", iconBg: "#eff6ff", iconColor: "#3b82f6" },
          { label: "Total Employees", value: employees.length, icon: "👥", iconBg: "#f0fdf4", iconColor: "#10b981" },
          { label: "Recent Projects", value: projects.length, icon: "📋", iconBg: "#fdf4ff", iconColor: "#d946ef" },
          { label: "Active Subadmins", value: subadmins.length, icon: "🛡️", iconBg: "#fff7ed", iconColor: "#f59e0b" },
        ].map((s, idx) => (
          <div key={idx} className="premium-card" style={{
            background: THEME.card,
            borderRadius: 24,
            padding: "24px",
            display: "flex",
            alignItems: "center",
            gap: 20,
            boxShadow: THEME.shadow,
            border: `1.5px solid ${THEME.border}`,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: "pointer"
          }}>
            <div style={{
              width: 54, height: 54, borderRadius: 16, background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: s.iconColor, flexShrink: 0,
              boxShadow: `0 8px 16px ${s.iconBg}`
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: THEME.text, lineHeight: 1, letterSpacing: "-1px" }}>{s.value}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: THEME.muted, marginTop: 4 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ background: THEME.card, borderRadius: 28, padding: 32, boxShadow: THEME.shadow, border: `1.5px solid ${THEME.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: THEME.text }}>Project Progress</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {projects.length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, color: THEME.muted, fontSize: 13 }}>No projects found</div>
            ) : (
              projects.slice(0, 5).map(p => (
                <div key={p._id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: THEME.text }}>{p.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 900, color: THEME.accent }}>{p.progress || 0}%</span>
                  </div>
                  <div style={{ background: THEME.surface, borderRadius: 10, height: 8, overflow: "hidden" }}>
                    <div style={{
                      width: `${p.progress || 0}%`,
                      background: (p.progress || 0) === 100 ? THEME.accentSecondary : THEME.accent,
                      borderRadius: 10, height: "100%", transition: "width 1s ease-out"
                    }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ background: THEME.card, borderRadius: 28, padding: 32, boxShadow: THEME.shadow, border: `1.5px solid ${THEME.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: THEME.text }}>Recent Invoices</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {invoices.length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, color: THEME.muted, fontSize: 13 }}>No invoices found</div>
            ) : (
              invoices.slice(0, 5).map(inv => (
                <div key={inv.id} className="premium-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderRadius: 20, background: THEME.surface, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: THEME.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, border: `1.5px solid ${THEME.border}` }}>📄</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: THEME.text }}>{inv.invoiceNo}</div>
                      <div style={{ fontSize: 12, color: THEME.muted, fontWeight: 600 }}>{inv.client}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: THEME.text }}>₹{inv.total?.toLocaleString() || "0"}</div>
                    <div style={{ marginTop: 4 }}><Badge label={inv.status} /></div>
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

function SubadminsList({ THEME, subadmins, refresh, packages, subscriptions, fetchSubscriptions }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", companyName: "", companyType: "IT", employeeCount: "0-10" });
  const [loading, setLoading] = useState(false);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedSubadmin, setSelectedSubadmin] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [durationDays, setDurationDays] = useState(30);
  const [assignLoading, setAssignLoading] = useState(false);

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
      const feats = Array.isArray(pkg.features) ? pkg.features : (pkg.features || "").split("\n").filter(Boolean);
      await axios.post(`${BASE_URL}/api/subscriptions/assign-to-subadmin`, {
        subadminId: selectedSubadmin._id,
        subadminEmail: selectedSubadmin.email,
        subadminName: selectedSubadmin.name,
        packageId: pkg._id,
        packageTitle: pkg.title,
        planPrice: pkg.price,
        billingCycle,
        durationDays,
        clientLimit: pkg.clientLimit || "",
        employeeLimit: pkg.employeeLimit || "",
        managerLimit: pkg.managerLimit || "",
        businessLimit: pkg.businessLimit || "",
        features: feats
      });
      alert(`Package assigned successfully!`);
      setAssignModalOpen(false);
      await fetchSubscriptions();
    } catch (e) {
      alert("Failed: " + (e.response?.data?.error || e.message));
    } finally { setAssignLoading(false); }
  };

  const handleViewCompany = async (companyName) => {
    if (!companyName || companyName === "—") return;
    setSelectedCompany(companyName);
    setCompanyModalOpen(true);
    setCompanyLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/subadmins/company/${encodeURIComponent(companyName)}`);
      setCompanyData(res.data);
    } catch (e) { console.error(e); }
    finally { setCompanyLoading(false); }
  };

  return (
    <div style={{ background: THEME.card, borderRadius: 24, padding: 32, border: `1.5px solid ${THEME.border}`, boxShadow: THEME.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: THEME.text }}>Registered Subadmins ({subadmins.length})</h3>
        <button onClick={() => setModalOpen(true)} style={{ background: THEME.accent, color: "#fff", border: "none", borderRadius: 12, padding: "10px 24px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>+ Add Subadmin</button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Name", "Email", "Company", "Current Plan", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "16px", textAlign: "left", fontWeight: 800, color: THEME.muted, borderBottom: `2px solid ${THEME.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subadmins.map((s, i) => {
              const sub = subscriptions.find(sub => (sub.userId === s._id || sub.companyId === s._id) && sub.status === "active");
              return (
                <tr key={s._id || i} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                  <td style={{ padding: "16px", fontWeight: 700, color: THEME.text }}>{s.name}</td>
                  <td style={{ padding: "16px", color: THEME.muted }}>{s.email}</td>
                  <td style={{ padding: "16px" }}>
                    <span onClick={() => handleViewCompany(s.companyName || s.company)} style={{ color: THEME.accent, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
                      {s.companyName || s.company || "—"}
                    </span>
                  </td>
                  <td style={{ padding: "16px", fontWeight: 800, color: sub ? THEME.accentSecondary : THEME.muted }}>{sub?.planName || "No Plan"}</td>
                  <td style={{ padding: "16px" }}><Badge label={s.status || "Active"} /></td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openAssignModal(s)} style={{ background: `${THEME.accentSecondary}15`, color: THEME.accentSecondary, border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>📦 Assign</button>
                      <button onClick={async () => { if (window.confirm("Delete?")) { await axios.delete(`${BASE_URL}/api/subadmins/${s._id}`); refresh(); } }} style={{ background: "#ef444415", color: "#ef4444", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>Delete Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {companyModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: THEME.card, padding: 32, borderRadius: 24, width: 800, maxHeight: "85vh", overflowY: "auto", border: `1.5px solid ${THEME.border}`, color: THEME.text }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontWeight: 900 }}>{selectedCompany} Details</h3>
              <button onClick={() => setCompanyModalOpen(false)} style={{ background: THEME.surface, border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", color: THEME.text }}>✕</button>
            </div>
            {companyLoading ? <div>Loading...</div> : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                <div style={{ background: THEME.surface, padding: 20, borderRadius: 16 }}>
                  <div style={{ fontSize: 12, color: THEME.muted, fontWeight: 700 }}>Employees</div>
                  <div style={{ fontSize: 24, fontWeight: 900 }}>{companyData?.employees?.length || 0}</div>
                </div>
                <div style={{ background: THEME.surface, padding: 20, borderRadius: 16 }}>
                  <div style={{ fontSize: 12, color: THEME.muted, fontWeight: 700 }}>Managers</div>
                  <div style={{ fontSize: 24, fontWeight: 900 }}>{companyData?.managers?.length || 0}</div>
                </div>
                <div style={{ background: THEME.surface, padding: 20, borderRadius: 16 }}>
                  <div style={{ fontSize: 12, color: THEME.muted, fontWeight: 700 }}>Clients</div>
                  <div style={{ fontSize: 24, fontWeight: 900 }}>{companyData?.clients?.length || 0}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: THEME.card, padding: 32, borderRadius: 24, width: 440, border: `1.5px solid ${THEME.border}`, boxShadow: THEME.shadow }}>
            <h3 style={{ margin: "0 0 24px", fontWeight: 900, color: THEME.text }}>New Subadmin</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <input placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: 12, borderRadius: 12, border: `1px solid ${THEME.border}`, background: THEME.surface, color: THEME.text }} />
              <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ padding: 12, borderRadius: 12, border: `1px solid ${THEME.border}`, background: THEME.surface, color: THEME.text }} />
              <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ padding: 12, borderRadius: 12, border: `1px solid ${THEME.border}`, background: THEME.surface, color: THEME.text }} />
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button onClick={() => setModalOpen(false)} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", fontWeight: 700, background: THEME.surface, color: THEME.text }}>Cancel</button>
                <button onClick={() => { axios.post(`${BASE_URL}/api/subadmins`, { ...form, role: "subadmin" }).then(() => { refresh(); setModalOpen(false); }) }} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: THEME.accent, color: "#fff", fontWeight: 700 }}>Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {assignModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: THEME.card, padding: 32, borderRadius: 24, width: 440, border: `1.5px solid ${THEME.border}`, boxShadow: THEME.shadow }}>
            <h3 style={{ margin: "0 0 8px", fontWeight: 900, color: THEME.text }}>Assign Package</h3>
            <p style={{ margin: "0 0 24px", color: THEME.muted, fontSize: 13 }}>to {selectedSubadmin.name}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <select value={selectedPackage} onChange={e => setSelectedPackage(e.target.value)} style={{ padding: 12, borderRadius: 12, border: `1px solid ${THEME.border}`, background: THEME.surface, color: THEME.text }}>
                <option value="">-- Choose Plan --</option>
                {packages.map(p => <option key={p._id} value={p._id}>{p.title} (₹{p.price})</option>)}
              </select>
              <input type="number" value={durationDays} onChange={e => setDurationDays(e.target.value)} style={{ padding: 12, borderRadius: 12, border: `1px solid ${THEME.border}`, background: THEME.surface, color: THEME.text }} />
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button onClick={() => setAssignModalOpen(false)} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", fontWeight: 700, background: THEME.surface, color: THEME.text }}>Cancel</button>
                <button onClick={handleAssignPackage} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: THEME.accent, color: "#fff", fontWeight: 700 }}>Assign</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString();
}

function SubscriptionsPage({ THEME, subscriptions }) {
  const [filter, setFilter] = useState("all");
  const filtered = subscriptions.filter(s => filter === "all" || s.status?.toLowerCase() === filter.toLowerCase());
  const statusColors = { active: "#10b981", pending: "#f59e0b", expired: "#ef4444", cancelled: "#64748b" };

  return (
    <div style={{ background: THEME.card, borderRadius: 24, padding: 32, border: `1.5px solid ${THEME.border}`, boxShadow: THEME.shadow, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: THEME.text }}>Subscription Management</h3>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: THEME.surface, color: THEME.text, border: `1px solid ${THEME.border}` }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["User Name", "Email", "Plan", "Price", "Billing", "Status", "End Date"].map(h => (
                <th key={h} style={{ padding: "16px", textAlign: "left", fontWeight: 800, color: THEME.muted, borderBottom: `2px solid ${THEME.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((sub, i) => (
              <tr key={sub._id || i} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                <td style={{ padding: "16px", fontWeight: 700, color: THEME.text }}>{sub.userName || "—"}</td>
                <td style={{ padding: "16px", color: THEME.muted }}>{sub.userEmail || "—"}</td>
                <td style={{ padding: "16px", color: THEME.accent, fontWeight: 800 }}>{sub.planName || "—"}</td>
                <td style={{ padding: "16px", fontWeight: 900, color: THEME.text }}>₹{sub.planPrice || 0}</td>
                <td style={{ padding: "16px", color: THEME.muted }}>{sub.billingCycle || "—"}</td>
                <td style={{ padding: "16px" }}>
                  <span style={{
                    background: `${statusColors[sub.status?.toLowerCase()] || "#64748B"}15`,
                    color: statusColors[sub.status?.toLowerCase()] || "#64748B",
                    padding: "4px 12px", borderRadius: 10, fontSize: 11, fontWeight: 800, textTransform: "uppercase"
                  }}>{sub.status || "—"}</span>
                </td>
                <td style={{ padding: "16px", color: THEME.muted }}>{formatDate(sub.endDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubadminDropdown({ value, options, onChange, darkMode }) {
  const [open, setOpen] = useState(false);
  // Support both single ID and array of IDs, but treat as single for display
  const effectiveValue = Array.isArray(value) ? value[0] : value;
  const selected = options.find(o => o._id === effectiveValue);

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "11px 14px",
          border: `1.5px solid ${open ? "var(--app-accent, #7c3aed)" : "#e2e8f0"}`,
          borderRadius: 12, fontSize: 13, outline: "none",
          background: darkMode ? "#1e293b" : "#f8fafc",
          color: darkMode ? "#f8fafc" : "#0f172a",
          cursor: "pointer", boxSizing: "border-box",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          transition: "all 0.2s"
        }}
      >
        <span style={{ fontWeight: selected ? 700 : 500 }}>
          {selected ? `${selected.name} (${selected.email})` : "-- Select Subadmin --"}
        </span>
        <span style={{ fontSize: 10, transform: open ? "rotate(180deg)" : "none", transition: "0.2s", opacity: 0.5 }}>▼</span>
      </div>

      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 998 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
              background: darkMode ? "#1e293b" : "#fff",
              border: "1.5px solid #e2e8f0",
              borderRadius: 14, boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
              zIndex: 999, maxHeight: 220, overflowY: "auto",
              padding: "6px", animation: "notif-slide-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
            }}
          >
            <div
              onClick={() => { onChange([]); setOpen(false); }}
              style={{ padding: "10px 14px", cursor: "pointer", borderRadius: 8, fontSize: 13, color: "#94a3b8", transition: "0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              -- Clear Selection --
            </div>
            {options.map(sub => {
              const isSelected = effectiveValue === sub._id;
              return (
                <div
                  key={sub._id}
                  onClick={() => { 
                    // Pass as array since state expects array, but only containing ONE ID
                    onChange([sub._id]); 
                    setOpen(false); 
                  }}
                  style={{
                    padding: "10px 14px", cursor: "pointer", fontSize: 13, borderRadius: 8,
                    background: isSelected ? "var(--app-accent, #7c3aed)" : "transparent",
                    color: isSelected ? "#fff" : (darkMode ? "#f8fafc" : "#0f172a"),
                    marginBottom: "2px", transition: "0.2s",
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "#f8fafc"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                >
                  <div>
                    <div style={{ fontWeight: isSelected ? 800 : 700 }}>{sub.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>{sub.email}</div>
                  </div>
                  {isSelected && <span>✓</span>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function PackagesPage({ THEME, packages, onEdit, onDelete, darkMode }) {
  const displayedPackages = (packages && packages.length > 0) ? [...packages].sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)) : [];
  return (
    <div style={{ background: THEME.card, borderRadius: 32, padding: 48, border: `1.5px solid ${THEME.border}`, boxShadow: THEME.shadow, position: "relative", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: THEME.text, margin: 0 }}>Choose your Plan</h1>
        <p style={{ color: THEME.muted, fontSize: 14, marginTop: 8 }}>Flexible plans for businesses of all sizes</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 380px))", justifyContent: "center", gap: 30, maxWidth: 1200, margin: "0 auto" }}>
        {displayedPackages.map((p, idx) => {
          const isPro = (p.title || "").toUpperCase() === "PRO" ||
            (p.title || "").toLowerCase().includes("pro");
          const features = Array.isArray(p.features)
            ? p.features
            : (p.features || "").split(/[\n,]/).map(f => f.trim()).filter(Boolean);

          return (
            <div
              key={p._id || idx}
              style={{
                background: THEME.surface,
                border: `1.5px solid ${isPro ? THEME.accent : THEME.border}`,
                borderRadius: 24,
                padding: "32px 26px",
                position: "relative",
                transition: "transform 0.22s, box-shadow 0.22s",
                display: "flex",
                flexDirection: "column"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = THEME.shadow;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Pro glow orb */}
              {isPro && (
                <div style={{
                  position: "absolute", top: -50, left: "50%", transform: "translateX(-50%)",
                  width: 220, height: 220,
                  background: "radial-gradient(ellipse, rgba(0,220,150,0.13) 0%, transparent 70%)",
                  pointerEvents: "none"
                }} />
              )}

              {/* MOST POPULAR badge */}
              {isPro && (
                <div style={{
                  position: "absolute", top: 18, right: 18,
                  background: "rgba(0,220,150,0.12)",
                  border: "1px solid rgba(0,220,150,0.35)",
                  borderRadius: 100, padding: "3px 11px",
                  fontSize: 9, fontWeight: 800,
                  color: "#00dc96", letterSpacing: 1.2,
                  textTransform: "uppercase"
                }}>
                  MOST POPULAR
                </div>
              )}

              {/* Management Buttons */}
              <div style={{
                position: "absolute", top: 12, right: 12,
                display: "flex", gap: 6, zIndex: 10
              }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(p); }}
                  title="Edit Package"
                  style={{
                    background: "rgba(99, 102, 241, 0.1)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                    color: "#6366f1",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                    fontFamily: "inherit"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.2)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(p._id); }}
                  title="Delete Package"
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    color: "#ef4444",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                    fontFamily: "inherit"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  Delete
                </button>
              </div>

              {/* Plan title */}
              <div style={{
                fontSize: 20, fontWeight: 800, color: THEME.text,
                marginBottom: 4
              }}>
                {p.title}
              </div>
              <div style={{
                fontSize: 11, color: THEME.muted,
                marginBottom: 22, fontWeight: 500, letterSpacing: 0.3
              }}>
                {p.planDuration ? `Billed ${p.planDuration.toLowerCase()}` : "Billed monthly"}
              </div>

              {/* Price */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 8 }}>
                <span style={{
                  fontSize: 44, fontWeight: 800, color: THEME.text,
                  lineHeight: 1, letterSpacing: "-2px"
                }}>
                  {p.type === "free" ? "₹0"
                    : p.price ? `₹${p.price}` : "₹0"}
                </span>
                <span style={{
                  fontSize: 13, color: THEME.muted,
                  marginBottom: 5, fontWeight: 400
                }}>/ month</span>
              </div>

              <div style={{
                fontSize: 12, color: THEME.muted,
                marginBottom: 22, minHeight: 16, lineHeight: 1.5
              }}>
                {p.description}
              </div>

              {/* Divider */}
              <div style={{
                height: 1,
                background: isPro ? "rgba(0,220,150,0.13)" : "rgba(255,255,255,0.06)",
                marginBottom: 22
              }} />

              {/* Features */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, marginBottom: 28 }}>
                {features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{
                      width: 17, height: 17, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                      background: isPro ? "rgba(0,220,150,0.12)" : (darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"),
                      border: isPro ? "1px solid rgba(0,220,150,0.35)" : (darkMode ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.1)"),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 8, color: isPro ? "#00dc96" : (darkMode ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)")
                    }}>✓</div>
                    <span style={{
                      fontSize: 12.5, color: THEME.text, opacity: 0.8,
                      fontWeight: 500
                    }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                style={{
                  width: "100%", padding: "13px",
                  borderRadius: 11, fontSize: 14, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit",
                  ...(isPro ? {
                    background: "linear-gradient(135deg, #00dc96, #00b87a)",
                    border: "none", color: "#000",
                    boxShadow: "0 6px 22px rgba(0,220,150,0.32)"
                  } : {
                    background: "transparent",
                    border: `1.5px solid ${darkMode ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.1)"}`,
                    color: darkMode ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.75)"
                  })
                }}
                onMouseEnter={e => {
                  if (isPro) {
                    e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,220,150,0.48)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  } else {
                    e.currentTarget.style.borderColor = darkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
                    e.currentTarget.style.color = THEME.text;
                  }
                }}
                onMouseLeave={e => {
                  if (isPro) {
                    e.currentTarget.style.boxShadow = "0 6px 22px rgba(0,220,150,0.32)";
                    e.currentTarget.style.transform = "translateY(0)";
                  } else {
                    e.currentTarget.style.borderColor = darkMode ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.1)";
                    e.currentTarget.style.color = darkMode ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.75)";
                  }
                }}
              >
                {p.buttonName || "Get Started"}
              </button>



              {/* Duration badge */}
              <div style={{
                marginTop: 14, textAlign: "center",
                fontSize: 11, color: "rgba(255,255,255,0.22)"
              }}>
                {p.no_of_days || p.noOfDays || 30} days validity
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Clients Page ──
function ClientsPage({ THEME, clients, setClients }) {
  const [search, setSearch] = useState("");
  const filtered = clients.filter(c =>
    (c.clientName || c.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.companyName || c.company || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: THEME.card, borderRadius: 24, padding: 32, border: `1.5px solid ${THEME.border}`, boxShadow: THEME.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: THEME.text }}>All Company Names ({filtered.length})</h3>
        <input
          placeholder="Search company names..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, minWidth: 200 }}
        />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {["Company Name", "Contact Person", "Email", "Phone", "Status", "Joined"].map(h => (
              <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#64748b", borderBottom: "2px solid #e2e8f0" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((c, i) => (
            <tr key={c._id || i} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>{c.clientName || c.name || "—"}</td>
              <td style={{ padding: "14px 16px", color: "#475569" }}>{c.contactPersonName || "—"}</td>
              <td style={{ padding: "14px 16px", color: "#475569" }}>{c.email || "—"}</td>
              <td style={{ padding: "14px 16px", color: "#475569" }}>{c.phone || "—"}</td>
              <td style={{ padding: "14px 16px" }}><Badge label={c.status || "Active"} /></td>
              <td style={{ padding: "14px 16px", color: "#64748b" }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#94a3b8" }}>No company names found</td></tr>}
        </tbody>
      </table>
    </div>
  );
}



// ── Managers Page ──
function ManagersPage({ THEME, managers, setManagers }) {
  const [search, setSearch] = useState("");
  const filtered = (managers || []).filter(m =>
    (m.managerName || m.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: THEME.card, borderRadius: 24, padding: 32, border: `1.5px solid ${THEME.border}`, boxShadow: THEME.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: THEME.text }}>Managers List ({filtered.length})</h3>
        <input
          placeholder="Search managers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, minWidth: 240, background: THEME.surface, color: THEME.text, border: `1px solid ${THEME.border}` }}
        />
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Name", "Email", "Department", "Role", "Status"].map(h => (
                <th key={h} style={{ padding: "16px", textAlign: "left", fontWeight: 800, color: THEME.muted, borderBottom: `2px solid ${THEME.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr key={m._id || i} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                <td style={{ padding: "16px", fontWeight: 700, color: THEME.text }}>{m.managerName || m.name || "—"}</td>
                <td style={{ padding: "16px", color: THEME.muted }}>{m.email || "—"}</td>
                <td style={{ padding: "16px", color: THEME.muted }}>{m.department || "—"}</td>
                <td style={{ padding: "16px", color: THEME.accent, fontWeight: 700 }}>{m.role || "Manager"}</td>
                <td style={{ padding: "16px" }}><Badge label={m.status || "Active"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Projects Page ──
function ProjectsPage({ THEME, projects, setProjects, clients, employees }) {
  const [search, setSearch] = useState("");
  const filtered = (projects || []).filter(p =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.client || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: THEME.card, borderRadius: 24, padding: 32, border: `1.5px solid ${THEME.border}`, boxShadow: THEME.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: THEME.text }}>Projects List ({filtered.length})</h3>
        <input
          placeholder="Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, minWidth: 240, background: THEME.surface, color: THEME.text, border: `1px solid ${THEME.border}` }}
        />
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Project Name", "Client", "Progress", "Status", "Budget"].map(h => (
                <th key={h} style={{ padding: "16px", textAlign: "left", fontWeight: 800, color: THEME.muted, borderBottom: `2px solid ${THEME.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p._id || i} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                <td style={{ padding: "16px", fontWeight: 700, color: THEME.text }}>{p.name || "—"}</td>
                <td style={{ padding: "16px", color: THEME.muted }}>{p.client || "—"}</td>
                <td style={{ padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, background: THEME.surface, height: 6, borderRadius: 10 }}>
                      <div style={{ width: `${p.progress || 0}%`, background: THEME.accent, height: "100%", borderRadius: 10 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: THEME.accent }}>{p.progress || 0}%</span>
                  </div>
                </td>
                <td style={{ padding: "16px" }}><Badge label={p.status || "Pending"} /></td>
                <td style={{ padding: "16px", fontWeight: 700, color: THEME.text }}>₹{p.budget || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Employees Page ──
function EmployeesPage({ THEME, employees, setEmployees }) {
  const [search, setSearch] = useState("");
  const filtered = (employees || []).filter(e =>
    (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: THEME.card, borderRadius: 24, padding: 32, border: `1.5px solid ${THEME.border}`, boxShadow: THEME.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: THEME.text }}>Employees Directory ({filtered.length})</h3>
        <input
          placeholder="Search employees..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, minWidth: 240, background: THEME.surface, color: THEME.text, border: `1px solid ${THEME.border}` }}
        />
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Name", "Email", "Department", "Role", "Status"].map(h => (
                <th key={h} style={{ padding: "16px", textAlign: "left", fontWeight: 800, color: THEME.muted, borderBottom: `2px solid ${THEME.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => (
              <tr key={e._id || i} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                <td style={{ padding: "16px", fontWeight: 700, color: THEME.text }}>{e.name || "—"}</td>
                <td style={{ padding: "16px", color: THEME.muted }}>{e.email || "—"}</td>
                <td style={{ padding: "16px", color: THEME.muted }}>{e.department || "—"}</td>
                <td style={{ padding: "16px", color: THEME.accentSecondary, fontWeight: 700 }}>{e.role || "Staff"}</td>
                <td style={{ padding: "16px" }}><Badge label={e.status || "Active"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Interview Page ──
function InterviewPage({ THEME }) {
  const candidates = [
    { name: "Suresh Kumar", role: "UI/UX Designer", status: "Pending", email: "suresh@example.com" },
    { name: "Priya Raj", role: "Backend Developer", status: "Hired", email: "priya@example.com" },
    { name: "Arun V", role: "Project Manager", status: "Rejected", email: "arun@example.com" }
  ];

  return (
    <div style={{ background: THEME.card, borderRadius: 24, padding: 32, border: `1.5px solid ${THEME.border}`, boxShadow: THEME.shadow }}>
      <h3 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 900, color: THEME.text }}>Interview Pipeline</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Candidate", "Role", "Email", "Status"].map(h => (
                <th key={h} style={{ padding: "16px", textAlign: "left", fontWeight: 800, color: THEME.muted, borderBottom: `2px solid ${THEME.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {candidates.map((c, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                <td style={{ padding: "16px", fontWeight: 700, color: THEME.text }}>{c.name}</td>
                <td style={{ padding: "16px", color: THEME.muted }}>{c.role}</td>
                <td style={{ padding: "16px", color: THEME.muted }}>{c.email}</td>
                <td style={{ padding: "16px" }}><Badge label={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


