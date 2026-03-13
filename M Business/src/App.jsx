import React, { useState, useEffect } from "react";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";

export default function App() {

  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);

        // ✅ logo இருந்தா மீண்டும் save
        if (parsedUser.logoUrl) {
          localStorage.setItem("companyLogo", parsedUser.logoUrl);
        }

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

      // ✅ user save
      localStorage.setItem("user", JSON.stringify(userData));

      // ✅ logo save
      if (userData.logoUrl) {
        localStorage.setItem("companyLogo", userData.logoUrl);
      }

      setUser(userData);

    } else {

      localStorage.removeItem("user");
      localStorage.removeItem("companyLogo");
      setUser(null);

    }

  };

  return user
    ? <Dashboard setUser={handleSetUser} user={user} />
    : <AuthPage setUser={handleSetUser} />;

}