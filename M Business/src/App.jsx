
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import AuthPage          from "./components/AuthPage";
import Dashboard         from "./components/Dashboard";
import ClientDashboard   from "./components/ClientDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";
import InvoiceViewer     from "./components/InvoiceViewer";
import TasksPage         from "./components/TaskPage";
import CalendarPage         from "./components/CalendarPage";
import AccountsPage         from "./components/AccountsPage";
import ReportsPage         from "./components/ReportsPage";

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try { setUser(JSON.parse(saved)); }
      catch { localStorage.removeItem("user"); setUser(null); }
    } else {
      setUser(null);
    }
  }, []);

  // Loading from localStorage
  if (user === undefined) return null;

  const handleSetUser = (userData) => {
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    } else {
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  const role = (user?.role || "").toLowerCase().trim();

  // ── Role → Dashboard mapping ───────────────────────────────────────────────
  const getRootPage = () => {
    if (!user) return <AuthPage setUser={handleSetUser} />;

    // Employee → EmployeeDashboard
    if (role === "employee") {
      return <EmployeeDashboard user={user} setUser={handleSetUser} />;
    }

    // Client → ClientDashboard
    if (role === "client" || role === "user") {
      return <ClientDashboard user={user} setUser={handleSetUser} />;
    }

    // Admin / SubAdmin / Manager → Main Dashboard
    return <Dashboard user={user} setUser={handleSetUser} />;
  };

  return (
    <Router>
      <Routes>
        {/* Root — auto-routes by role */}
        <Route path="/" element={getRootPage()} />

        {/* Direct URL access with role guard */}
        <Route
          path="/employeedashboard"
          element={
            user && role === "employee"
              ? <EmployeeDashboard user={user} setUser={handleSetUser} />
              : <Navigate to="/" replace />
          }
        />

        {/* Other pages */}
        <Route path="/tasks"        element={<TasksPage />} />
        <Route path="/invoice-view" element={<InvoiceViewer />} />
                <Route path="/calendar" element={<CalendarPage />} />
                        <Route path="/accounts" element={<AccountsPage />} />
                                <Route path="/reports" element={<ReportsPage />} />


        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
