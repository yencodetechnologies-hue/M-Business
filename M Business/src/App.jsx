import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import ClientDashboard from "./components/ClientDashboard";
import InvoiceViewer from "./components/InvoiceViewer";
import TasksPage from "./components/TaskPage";
import EmployeeDashboard from "./components/EmployeeDashboard";

export default function App() {

  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      } catch {
        localStorage.removeItem("user");
        setUser(null);
      }
    } else {
      setUser(null);
    }

  }, []);

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

  return (
    <Router>
      <Routes>

        {!user && (
          <Route path="/" element={<AuthPage setUser={handleSetUser} />} />
        )}

        {/* Client Dashboard */}
        {user && (role === "user" || role === "client") && (
          <Route
            path="/"
            element={<ClientDashboard user={user} setUser={handleSetUser} />}
          />
        )}

        {/* Admin Dashboard */}
        {user && !(role === "user" || role === "client") && (
          <Route
            path="/"
            element={<Dashboard user={user} setUser={handleSetUser} />}
          />
        )}

        {/* Tasks Page */}
        <Route path="/tasks" element={<TasksPage />} />


        <Route path="/invoice-view" element={<InvoiceViewer />} />

     <Route path="/employeedashboard" element={<EmployeeDashboard />} />
      </Routes>
    </Router>
  );
}