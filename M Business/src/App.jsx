import React, { useState, useEffect } from "react";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import companyLogoSrc from "./assets/logo.svg";
import InvoiceViewer from "./components/InvoiceViewer";
import TaskPage from "./components/TaskPage";
export default function App() {
if (window.location.pathname === "/invoice-view") {
  return <InvoiceViewer />;
}

  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); }
      catch { localStorage.removeItem("user"); setUser(null); }
    } else { setUser(null); }
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

  return user
    ? <Dashboard setUser={handleSetUser} user={user} fixedLogo={null} />
    : <AuthPage setUser={handleSetUser} />;
}
