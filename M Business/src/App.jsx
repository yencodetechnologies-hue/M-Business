import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import AuthPage           from "./components/AuthPage";
import Dashboard          from "./components/SubAdminDashboard";
import AdminDashboard     from "./components/AdminDashboard";
import ClientDashboard    from "./components/ClientDashboard";
import EmployeeDashboard  from "./components/EmployeeDashboard";

import InvoiceViewer      from "./components/InvoiceViewer";
import TasksPage          from "./components/TaskPage";
import CalendarPage       from "./components/CalendarPage";
import { ExpensesPage }   from "./components/AccountsPage";
import ReportsPage        from "./components/ReportsPage";
import QuotationCreator   from "./components/QuotationCreator";
import InterviewApplyForm from "./components/InterviewApplyForm";
import CanvasPage         from "./components/CanvasPage";
import ProjectProposalCreator from "./components/ProjectProposalCreator";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  const [user, setUser] = useState(undefined);

  // ── Read from localStorage on refresh ──────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser({
          ...parsed,
          role: (parsed.role || "").toLowerCase().trim(),
        });
      } catch {
        localStorage.removeItem("user");
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  // ── Normalize role on every login / logout ──────────────────────────────────
  const handleSetUser = (userData) => {
    if (userData) {
      const normalized = {
        ...userData,
        role: (userData.role || "").toLowerCase().trim(),
      };
      localStorage.setItem("user", JSON.stringify(normalized));
      
      // Save to accounts list for multi-account support
      try {
        let accs = JSON.parse(localStorage.getItem("accounts") || "[]");
        const idx = accs.findIndex(a => a.email === normalized.email);
        if (idx !== -1) accs[idx] = normalized;
        else accs.push(normalized);
        localStorage.setItem("accounts", JSON.stringify(accs));
      } catch (e) {}

      setUser(normalized);
    } else {
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (user === undefined) return null;

  // ── Role-based root page ────────────────────────────────────────────────────
  const role = (user?.role || "").toLowerCase().trim();
const getRootPage = () => {
  console.log("🎯 getRootPage called, role:", JSON.stringify(role));
  
  if (!user) return <AuthPage setUser={handleSetUser} />;

  console.log("👤 User exists, role:", role);

  if (role === "employee") {
    console.log("✅ Routing to EmployeeDashboard");
    return <EmployeeDashboard user={user} setUser={handleSetUser} />;
  }

  if (role === "admin") {
    console.log("👑 Routing to AdminDashboard");
    return <AdminDashboard user={user} setUser={handleSetUser} />;
  }

  if (role === "subadmin") {
    console.log("🛡️ Routing to Main Dashboard (Subadmin logic)");
    return <Dashboard user={user} setUser={handleSetUser} />;
  }

  if (role === "client")
    return <ClientDashboard user={user} setUser={handleSetUser} />;

  return <Dashboard user={user} setUser={handleSetUser} />;
};
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={getRootPage()} />
        <Route path="/add-account" element={<AuthPage setUser={(u) => { handleSetUser(u); window.location.href="/"; }} initialTab="register" />} />

        <Route
          path="/employeedashboard"
          element={
            user && role === "employee"
              ? <EmployeeDashboard user={user} setUser={handleSetUser} />
              : <Navigate to="/" replace />
          }
        />

        <Route path="/tasks"             element={<TasksPage />} />
        <Route path="/canvas"            element={<CanvasPage />} />
        <Route path="/invoice-view"      element={<InvoiceViewer />} />
        <Route path="/calendar"          element={<CalendarPage />} />
        <Route path="/expenses"          element={<ExpensesPage />} />
        <Route path="/reports"           element={<ReportsPage />} />
        <Route path="/quotation-creator" element={<QuotationCreator />} />
        <Route path="/project-proposal" element={<ProjectProposalCreator />} />
        <Route path="/interview-apply/:companySlug" element={<InterviewApplyForm />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}