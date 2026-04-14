import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../config";
import { toast } from "react-toastify";

const T = { 
  primary: "#3b0764", 
  sidebar: "#1e0a3c", 
  accent: "#9333ea", 
  bg: "#f5f3ff", 
  card: "#FFFFFF", 
  text: "#1e0a3c", 
  muted: "#7c3aed", 
  border: "#ede9fe" 
};

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

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/role-permissions`);
      // Always seed to ensure client role exists (in case it was added later)
      await axios.post(`${BASE_URL}/api/role-permissions/seed`);
      const reFetch = await axios.get(`${BASE_URL}/api/role-permissions`);
      setRoles(reFetch.data.filter(r => r.role !== 'subadmin' && r.role !== 'manager'));
    } catch (err) {
      toast.error("Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (roleIndex, permKey) => {
    const updatedRoles = [...roles];
    updatedRoles[roleIndex].permissions[permKey] = !updatedRoles[roleIndex].permissions[permKey];
    setRoles(updatedRoles);
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

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: T.muted }}>Loading permissions...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "10px" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: `1px solid ${T.border}` }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 800, color: T.text, display: "flex", alignItems: "center", gap: 10 }}>
          🛡️ Role & Permission Management
        </h2>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
          Define accessibility for different user roles in the system. Changes will apply to all users with the selected role.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 10px" }}>
            <thead>
              <tr style={{ background: "transparent" }}>
                <th style={{ textAlign: "left", padding: "10px 15px", color: T.muted, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Module / Feature</th>
                {roles.map(r => (
                  <th key={r.role} style={{ padding: "10px 15px", textAlign: "center" }}>
                    <div style={{ 
                      background: "linear-gradient(135deg, #9333ea, #7c3aed)", 
                      color: "#fff", 
                      padding: "6px 16px", 
                      borderRadius: 10, 
                      fontSize: 12, 
                      fontWeight: 800,
                      textTransform: "uppercase",
                      boxShadow: "0 4px 12px rgba(147,51,234,0.2)"
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
                    {key.replace(/([A-Z])/g, ' $1').trim()}
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
            <tfoot>
              <tr>
                <td style={{ padding: "20px 15px" }}></td>
                {roles.map(r => (
                  <td key={`save-${r.role}`} style={{ padding: "20px 15px", textAlign: "center" }}>
                    <button 
                      onClick={() => saveRole(r)}
                      disabled={saving}
                      style={{ 
                        padding: "8px 16px", 
                        background: "linear-gradient(135deg, #3b0764, #1e0a3c)", 
                        color: "#fff", 
                        border: "none", 
                        borderRadius: 8, 
                        fontSize: 12, 
                        fontWeight: 700, 
                        cursor: "pointer",
                        transition: "0.2s",
                        opacity: saving ? 0.7 : 1
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                    >
                      Save {r.role}
                    </button>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionDashboard;
