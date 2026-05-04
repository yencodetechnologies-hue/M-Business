import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';

const T = { text: "var(--app-text)" };

// ── Shared primitives ─────────────────────────────────────
const Inp = ({ label, value, onChange, type = "text", placeholder }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{
      display: "block", fontSize: 11, color: "var(--app-accent)",
      fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6
    }}>{label}</label>
    <input
      type={type}
      value={value || ""}
      onChange={e => {
        const val = e.target.value;
        const isNum = ["phone", "pincode", "zip", "mobile"].some(k => label.toLowerCase().includes(k));
        if (isNum && val && !/^\d*$/.test(val)) return;
        onChange(val);
      }}
      placeholder={placeholder || ""}
      style={{
        width: "100%", border: "1.5px solid var(--app-border)", borderRadius: 12,
        padding: "11px 14px", fontSize: 13.5, color: "var(--app-text)",
        background: "var(--app-bg)", outline: "none", fontFamily: "inherit",
        boxSizing: "border-box", transition: "border-color 0.2s",
      }}
      onFocus={e => e.target.style.borderColor = "var(--app-accent)"}
      onBlur={e => e.target.style.borderColor = "var(--app-border)"}
    />
  </div>
);

const Toggle = ({ label, desc, checked, onChange }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 0", borderBottom: "1px solid var(--app-border)"
  }}>
    <div style={{ flex: 1, paddingRight: 16 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--app-text)" }}>{label}</div>
      {desc && <div style={{ fontSize: 11.5, color: "var(--app-muted)", marginTop: 2 }}>{desc}</div>}
    </div>
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 26, borderRadius: 99,
        background: checked ? "var(--app-accent)" : "#e2e8f0",
        cursor: "pointer", position: "relative", transition: "background 0.25s", flexShrink: 0
      }}
    >
      <div style={{
        position: "absolute", top: 4, left: checked ? 22 : 4,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.25s"
      }} />
    </div>
  </div>
);

function AddInput({ onAdd, placeholder }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: 8, maxWidth: 440 }}>
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder={placeholder}
        onKeyPress={e => { if (e.key === "Enter") { onAdd(val); setVal(""); } }}
        style={{
          flex: 1, padding: "10px 14px", borderRadius: 11,
          border: "1.5px solid var(--app-border)", background: "var(--app-bg)",
          fontSize: 13, outline: "none", fontFamily: "inherit",
          transition: "border-color 0.2s"
        }}
        onFocus={e => e.target.style.borderColor = "var(--app-accent)"}
        onBlur={e => e.target.style.borderColor = "var(--app-border)"}
      />
      <button
        onClick={() => { onAdd(val); setVal(""); }}
        style={{
          padding: "10px 20px", background: "var(--app-accent-gradient)",
          color: "#fff", border: "none", borderRadius: 11,
          fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
        }}
      >+ Add</button>
    </div>
  );
}

// ── Tab definitions ───────────────────────────────────────
const TABS = [
  { id: "profile",       icon: "👤", label: "Profile" },
  { id: "notifications", icon: "🔔", label: "Notifications" },
  { id: "config",        icon: "⚙️",  label: "Platform Config" },
];

// ── Main ─────────────────────────────────────────────────
export default function SettingsPage({ user }) {
  const companyId  = user?._id || user?.id;
  const displayName = user?.companyName || user?.name || user?.email?.split("@")[0] || "Admin";
  const initials   = (user?.companyName || user?.name || "AD").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const roleLabel  = (user?.role || "SubAdmin").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const notifKey   = `notif_prefs_${companyId}`;

  const [activeTab, setActiveTab] = useState("profile");
  const [config,    setConfig]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState("");

  const [profile, setProfile]   = useState({ name: "", email: "", phone: "", companyName: "" });
  const [profileSaved,  setProfileSaved]  = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  const [notifs, setNotifs] = useState(() => {
    try {
      const saved = localStorage.getItem(`notif_prefs_${user?._id || user?.id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { emailNotifications: true, invoiceAlerts: true, weeklyReport: false, taskReminders: true };
  });

  useEffect(() => {
    setProfile({
      name:        user?.companyName || user?.name || "",
      email:       user?.email || "",
      phone:       user?.phone || "",
      companyName: user?.companyName || "",
    });
  }, [user]);

  useEffect(() => { fetchConfig(); }, [companyId]);

  const fetchConfig = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/config/${companyId}`);
      setConfig(res.data);
    } catch {} finally { setLoading(false); }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const updateNotif = (key, val) => {
    const updated = { ...notifs, [key]: val };
    setNotifs(updated);
    try { localStorage.setItem(notifKey, JSON.stringify(updated)); } catch {}
  };

  const saveProfile = async () => {
    try { localStorage.setItem(notifKey, JSON.stringify(notifs)); } catch {}
    try {
      setProfileSaving(true);
      await axios.put(`${BASE_URL}/api/subadmins/${companyId}`, {
        companyName: profile.name, phone: profile.phone, notificationPreferences: notifs,
      });
    } catch {}
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2200);
    setProfileSaving(false);
  };

  const saveConfig = async (updatedConfig) => {
    try {
      setSaving(true);
      const res = await axios.post(`${BASE_URL}/api/config/${companyId}`, updatedConfig);
      setConfig(res.data);
      showToast("✅ Settings saved!");
    } catch { showToast("❌ Failed to save"); } finally { setSaving(false); }
  };

  const addItem    = (key, value) => {
    if (!value.trim()) return;
    saveConfig({ ...config, [key]: [...new Set([...config[key], value.trim()])] });
  };
  const removeItem = (key, index) => {
    const arr = [...config[key]]; arr.splice(index, 1);
    saveConfig({ ...config, [key]: arr });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: "#fff", border: "1.5px solid var(--app-accent)",
          borderRadius: 14, padding: "13px 22px", fontSize: 13, fontWeight: 700,
          color: "var(--app-accent)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)"
        }}>{toast}</div>
      )}

      {/* ── Profile hero header ── */}
      <div style={{
        background: "var(--app-accent-gradient)", borderRadius: 18,
        padding: "28px 28px 24px", display: "flex", alignItems: "center",
        gap: 18, marginBottom: 20,
        boxShadow: "0 8px 32px rgba(var(--app-accent-rgb,124,58,237),0.18)"
      }}>
        <div style={{
          width: 66, height: 66, borderRadius: 18,
          background: "rgba(255,255,255,0.2)", border: "2.5px solid rgba(255,255,255,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, fontWeight: 800, color: "#fff", flexShrink: 0, letterSpacing: -1
        }}>{initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>{displayName}</div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{user?.email || "—"}</div>
          <div style={{
            display: "inline-block", marginTop: 8,
            background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 99, padding: "3px 12px", fontSize: 10, fontWeight: 700,
            color: "#fff", letterSpacing: 1
          }}>{roleLabel.toUpperCase()}</div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{
        display: "flex", gap: 4, background: "var(--app-bg)",
        borderRadius: 14, padding: 5, marginBottom: 20,
        border: "1px solid var(--app-border)"
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: "10px 8px", border: "none", borderRadius: 10,
                background: active ? "#fff" : "transparent",
                color: active ? "var(--app-accent)" : "var(--app-muted)",
                fontWeight: active ? 700 : 500, fontSize: 13, cursor: "pointer",
                fontFamily: "inherit", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 6,
                boxShadow: active ? "0 2px 10px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.2s"
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab: Profile ── */}
      {activeTab === "profile" && (
        <div style={{
          background: "#fff", borderRadius: 18, padding: "28px 28px 8px",
          border: "1px solid var(--app-border)",
          boxShadow: "0 4px 24px rgba(var(--app-accent-rgb,124,58,237),0.07)"
        }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--app-text)" }}>Profile Details</div>
            <div style={{ fontSize: 12, color: "var(--app-muted)", marginTop: 2 }}>Update your account information</div>
          </div>
          <Inp label="Full Name / Company" value={profile.name}        onChange={v => setProfile(p => ({ ...p, name: v }))}        placeholder="Your name or company" />
          <Inp label="Email"               value={profile.email}       onChange={v => setProfile(p => ({ ...p, email: v }))}       type="email" placeholder="Email address" />
          <Inp label="Phone"               value={profile.phone}       onChange={v => setProfile(p => ({ ...p, phone: v }))}       placeholder="Contact number" />
          <Inp label="Company Name"        value={profile.companyName} onChange={v => setProfile(p => ({ ...p, companyName: v }))} placeholder="Business name" />
          <div style={{ padding: "8px 0 24px" }}>
            <button
              onClick={saveProfile} disabled={profileSaving}
              style={{
                width: "100%",
                background: profileSaved
                  ? "linear-gradient(135deg,#22c55e,#16a34a)"
                  : "var(--app-accent-gradient)",
                color: "#fff", border: "none", borderRadius: 12,
                padding: "13px", fontSize: 14, fontWeight: 700,
                cursor: profileSaving ? "not-allowed" : "pointer",
                fontFamily: "inherit", transition: "all 0.3s",
                opacity: profileSaving ? 0.7 : 1,
                boxShadow: "0 4px 14px rgba(var(--app-accent-rgb,124,58,237),0.3)"
              }}
            >
              {profileSaving ? "Saving…" : profileSaved ? "✓ Saved!" : "Save Profile"}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Notifications ── */}
      {activeTab === "notifications" && (
        <div style={{
          background: "#fff", borderRadius: 18, padding: "28px",
          border: "1px solid var(--app-border)",
          boxShadow: "0 4px 24px rgba(var(--app-accent-rgb,124,58,237),0.07)"
        }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--app-text)" }}>Notification Preferences</div>
            <div style={{ fontSize: 12, color: "var(--app-muted)", marginTop: 2 }}>Choose what alerts you want to receive</div>
          </div>
          <Toggle label="Email Notifications"     desc="Receive email alerts for important events"           checked={notifs.emailNotifications} onChange={v => updateNotif("emailNotifications", v)} />
          <Toggle label="Invoice Payment Alerts"  desc="Get notified when invoices are paid or overdue"      checked={notifs.invoiceAlerts}       onChange={v => updateNotif("invoiceAlerts", v)} />
          <Toggle label="Task Reminders"          desc="Receive reminders for upcoming task deadlines"       checked={notifs.taskReminders}       onChange={v => updateNotif("taskReminders", v)} />
          <Toggle label="Weekly Progress Report"  desc="Summary email every Monday morning"                 checked={notifs.weeklyReport}        onChange={v => updateNotif("weeklyReport", v)} />
          <div style={{ paddingTop: 20 }}>
            <button
              onClick={saveProfile} disabled={profileSaving}
              style={{
                width: "100%", background: profileSaved
                  ? "linear-gradient(135deg,#22c55e,#16a34a)"
                  : "var(--app-accent-gradient)",
                color: "#fff", border: "none", borderRadius: 12,
                padding: "13px", fontSize: 14, fontWeight: 700,
                cursor: profileSaving ? "not-allowed" : "pointer",
                fontFamily: "inherit", transition: "all 0.3s",
                boxShadow: "0 4px 14px rgba(var(--app-accent-rgb,124,58,237),0.3)"
              }}
            >
              {profileSaving ? "Saving…" : profileSaved ? "✓ Saved!" : "Save Preferences"}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Platform Config ── */}
      {activeTab === "config" && (
        loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--app-muted)", fontSize: 13 }}>
            Loading configuration…
          </div>
        ) : !config ? (
          <div style={{ padding: 60, textAlign: "center", color: "#ef4444", fontSize: 13 }}>
            Failed to load configuration.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { key: "projectStatuses", icon: "🗂", title: "Project Status Options",  desc: "Statuses available for projects across the platform.", placeholder: "New project status…" },
              { key: "taskStatuses",    icon: "✅", title: "Task Status Options",     desc: "Statuses available for tasks.",                         placeholder: "New task status…" },
              { key: "taskPriorities",  icon: "🎯", title: "Task Priority Options",   desc: "Priority levels available for tasks.",                   placeholder: "New priority level…" },
            ].map(({ key, icon, title, desc, placeholder }) => (
              <div key={key} style={{
                background: "#fff", borderRadius: 18, padding: 24,
                border: "1px solid var(--app-border)",
                boxShadow: "0 4px 24px rgba(var(--app-accent-rgb,124,58,237),0.07)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--app-text)" }}>{title}</div>
                </div>
                <p style={{ fontSize: 12, color: "var(--app-muted)", margin: "0 0 16px" }}>{desc}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {config[key].map((s, i) => (
                    <div key={i} style={{
                      background: "var(--app-bg)", border: "1.5px solid var(--app-border)",
                      borderRadius: 10, padding: "6px 14px",
                      display: "flex", alignItems: "center", gap: 8
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--app-text)" }}>{s}</span>
                      <button
                        onClick={() => removeItem(key, i)}
                        style={{
                          background: "none", border: "none", color: "#ef4444",
                          cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1,
                          opacity: 0.7, transition: "opacity 0.15s"
                        }}
                        onMouseEnter={e => e.target.style.opacity = 1}
                        onMouseLeave={e => e.target.style.opacity = 0.7}
                      >✕</button>
                    </div>
                  ))}
                </div>
                <AddInput onAdd={val => addItem(key, val)} placeholder={placeholder} />
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
