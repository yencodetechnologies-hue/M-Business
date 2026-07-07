import React, { useState, useEffect } from "react";
import axios from "axios";
import { T } from "../index";
import { BASE_URL } from "../config";
import { toast } from "react-toastify";

const PERMISSION_KEYS = [
  "dashboard", "clients", "subadmins", "employees", "managers",
  "projects", "quotations", "proposals", "invoices", "tracking",
  "tasks", "calendar", "accounts", "interviews", "reports",
  "mysubscriptions", "packages", "payments", "vendors", "rolePermissions"
];

const RolePermissionDashboard = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/role-permissions`);
      // Only seed if no roles exist yet (first-time setup) - avoids overwriting saved permissions
      if (!res.data || res.data.length === 0) {
        await axios.post(`${BASE_URL}/api/role-permissions/seed`);
        const reFetch = await axios.get(`${BASE_URL}/api/role-permissions`);
        setRoles(reFetch.data.filter(r => r.role !== 'subadmin' && r.role !== 'manager'));
      } else {
        setRoles(res.data.filter(r => r.role !== 'subadmin' && r.role !== 'manager'));
      }
    } catch (err) {
      toast.error("Failed to fetch roles");
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const togglePermission = async (roleIndex, permKey) => {
    const updatedRoles = [...roles];
    const role = updatedRoles[roleIndex];
    role.permissions[permKey] = !role.permissions[permKey];
    setRoles(updatedRoles);

    // Auto-save
    try {
      await axios.post(`${BASE_URL}/api/role-permissions`, role);
    } catch (err) {
      toast.error("Failed to auto-save permissions");
      // Rollback on failure
      role.permissions[permKey] = !role.permissions[permKey];
      setRoles([...updatedRoles]);
    }
  };

  const saveRole = async (role) => {
    try {
      setSaving(true);
      await axios.post(`${BASE_URL}/api/role-permissions`, role);
      toast.success(`${role.role.toUpperCase()} permissions updated!`);
    } catch (err) {
      toast.error("Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: T.muted, minHeight: 200 }}></div>
    );
  }

  if (!loading && roles.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: T.muted }}>
        No roles found. <button onClick={fetchRoles} style={{ marginLeft: 8, background: "var(--app-accent)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: 700 }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "10px" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: `1px solid ${T.border}` }}>


        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 10px" }}>
            <thead>
              <tr style={{ background: "transparent" }}>
                <th style={{ textAlign: "left", padding: "10px 15px", color: T.muted, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Module / Feature</th>
                {roles.map(r => (
                  <th key={r.role} style={{ padding: "10px 15px", textAlign: "center" }}>
                    <div style={{
                      background: "linear-gradient(135deg, var(--app-accent), var(--app-accent))",
                      color: "#fff",
                      padding: "6px 16px",
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      boxShadow: "0 4px 12px rgba(var(--app-accent-rgb, 124, 58, 237),0.2)",
                      width: "fit-content",
                      margin: "0 auto"
                    }}>
                      {r.role}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_KEYS.map(key => (
                <tr key={key} style={{ background: "#fcfaff", borderBottom: `1px solid ${T.border}` }}>
                  <td style={{
                    padding: "16px 15px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: T.text,
                    borderTopLeftRadius: 12,
                    borderBottomLeftRadius: 12,
                    textTransform: "capitalize"
                  }}>
                    {key === "clients" ? "Company Names" : key.replace(/([A-Z])/g, ' $1').trim()}
                  </td>
                  {roles.map((r, idx) => (
                    <td key={`${r.role}-${key}`} style={{ padding: "16px 15px", textAlign: "center" }}>
                      <label style={{
                        position: "relative",
                        display: "inline-block",
                        width: 44,
                        height: 24,
                        cursor: "pointer"
                      }}>
                        <input
                          type="checkbox"
                          checked={r.permissions[key] || false}
                          onChange={() => togglePermission(idx, key)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: "absolute",
                          top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: r.permissions[key] ? "#22C55E" : "#cbd5e1",
                          transition: ".3s",
                          borderRadius: 24,
                          boxShadow: r.permissions[key] ? "0 2px 8px rgba(34,197,94,0.3)" : "none"
                        }}>
                          <span style={{
                            position: "absolute",
                            content: '""',
                            height: 18, width: 18,
                            left: r.permissions[key] ? 22 : 4,
                            bottom: 3,
                            backgroundColor: "white",
                            transition: ".3s",
                            borderRadius: "50%"
                          }} />
                        </span>
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionDashboard;


