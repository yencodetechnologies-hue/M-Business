import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Lazy load all heavy components
const AuthPage = lazy(() => import("./components/AuthPage"));
const Dashboard = lazy(() => import("./components/SubAdminDashboard"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const ClientDashboard = lazy(() => import("./components/ClientDashboard"));
const EmployeeDashboard = lazy(() => import("./components/EmployeeDashboard"));
const InvoiceViewer = lazy(() => import("./components/InvoiceViewer"));
const QuotationViewer = lazy(() => import("./components/QuotationViewer"));
const ReceiptViewer = lazy(() => import("./components/ReceiptViewer"));
const TasksPage = lazy(() => import("./components/TaskPage"));
const CalendarPage = lazy(() => import("./components/CalendarPage"));
const ExpensesPage = lazy(() => import("./components/AccountsPage").then(module => ({ default: module.ExpensesPage })));
const ReportsPage = lazy(() => import("./components/ReportsPage"));
const QuotationCreatorModern = lazy(() => import("./components/QuotationCreatorModern"));
const QuotationCreator = lazy(() => import("./components/QuotationCreator"));
const ProjectProposalCreator = lazy(() => import("./components/ProjectProposalCreator"));
const InterviewApplyForm = lazy(() => import("./components/InterviewApplyForm"));
const EmployeeOnboarding = lazy(() => import("./components/EmployeeOnboarding"));
const CanvasPage = lazy(() => import("./components/CanvasPage"));
const ModernProjectsPage = lazy(() => import("./components/ModernProjectsPage"));

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...parsed, role: (parsed.role || "").toLowerCase().trim() };
      } catch {
        localStorage.removeItem("user");
      }
    }
    // After PayU redirect, session may be lost — restore from accounts list using uid param
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment') === 'success') {
        const uid = params.get('uid');
        const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
        const match = uid
          ? accounts.find(a => String(a._id || a.id) === String(uid))
          : accounts[0];
        if (match) {
          const normalized = { ...match, role: (match.role || '').toLowerCase().trim() };
          localStorage.setItem('user', JSON.stringify(normalized));
          return normalized;
        }
      }
    } catch (e) { /* ignore */ }
    return null;
  });

  // ── Normalize role on every login / logout ----------------------------------
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
      } catch (e) { }

      setUser(normalized);
    } else {
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  // ── Loading state -----------------------------------------------------------
  // No longer needed, user is loaded synchronously

  // ── Role-based root page ----------------------------------------------------
  const role = (user?.role || "").toLowerCase().trim();
  const getRootPage = () => {
    console.log("Target getRootPage called, role:", JSON.stringify(role));

    if (!user) return <AuthPage setUser={handleSetUser} />;

    console.log("Profile User exists, role:", role);

    if (role === "employee") {
      console.log("Success Routing to EmployeeDashboard");
      return <EmployeeDashboard user={user} setUser={handleSetUser} />;
    }

    if (role === "admin") {
      console.log(" Routing to AdminDashboard");
      return <AdminDashboard user={user} setUser={handleSetUser} />;
    }

    if (role === "subadmin") {
      console.log("Security Routing to Main Dashboard (Subadmin logic)");
      return <Dashboard key={user.email || user.id} user={user} setUser={handleSetUser} />;
    }

    if (role === "client")
      return <ClientDashboard user={user} setUser={handleSetUser} />;

    return <Dashboard user={user} setUser={handleSetUser} />;
  };
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={getRootPage()} />
          <Route path="/add-account" element={<AuthPage setUser={(u) => { handleSetUser(u); window.location.href = "/"; }} initialTab="register" />} />

          <Route
            path="/employeedashboard"
            element={
              user && role === "employee"
                ? <EmployeeDashboard user={user} setUser={handleSetUser} />
                : <Navigate to="/" replace />
            }
          />

          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/canvas" element={<CanvasPage />} />
          <Route path="/invoice-view" element={<InvoiceViewer />} />
          <Route path="/quotation-view" element={<QuotationViewer />} />
          <Route path="/receipt-view" element={<ReceiptViewer />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/quotation-creator" element={<QuotationCreatorModern />} />
          <Route path="/project-proposal" element={<ProjectProposalCreator />} />
          <Route path="/interview-apply/:companySlug" element={<InterviewApplyForm />} />
          <Route path="/employee-onboarding" element={<EmployeeOnboarding />} />
          <Route path="/modern-projects" element={user ? <ModernProjectsPage user={user} /> : <Navigate to="/" replace />} />

          <Route
            path="/client-portal/:clientId"
            element={<ClientDashboard user={null} setUser={null} portalMode={true} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}