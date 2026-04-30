import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';

const T = {
  primary: "#3b0764", sidebar: "#1e0a3c", accent: "#9333ea",
  bg: "#f5f3ff", card: "#FFFFFF", text: "#1e0a3c",
  muted: "#7c3aed", border: "#ede9fe"
};

const SC = ({ title, children }) => (
  <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 4px 24px rgba(147,51,234,0.08)", border: "1px solid #ede9fe", marginBottom: 20 }}>
    <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: T.text }}>{title}</h3>
    {children}
  </div>
);

const Inp = ({ label, value, onChange, type = "text", placeholder }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 5 }}>{label}</label>
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
      style={{ width: "100%", border: "1.5px solid #ede9fe", borderRadius: 10, padding: "9px 12px", fontSize: 13, color: T.text, background: "#faf5ff", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
    />
  </div>
);

const Toggle = ({ label, desc, checked, onChange }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid #f5f3ff" }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{label}</div>
      {desc && <div style={{ fontSize: 11, color: "#a78bfa", marginTop: 1 }}>{desc}</div>}
    </div>
    <div
      onClick={() => onChange(!checked)}
      style={{ width: 42, height: 24, borderRadius: 99, background: checked ? "#9333ea" : "#e2e8f0", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
    >
      <div style={{ position: "absolute", top: 3, left: checked ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.18)", transition: "left 0.2s" }} />
    </div>
  </div>
);

export default function SettingsPage({ user }) {
  // Derived constants first — needed by useState initialisers below
  const companyId = user?._id || user?.id;
  const displayName = user?.companyName || user?.name || user?.email?.split("@")[0] || "Admin";
  const initials = (user?.companyName || user?.name || "AD").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const roleLabel = (user?.role || "SubAdmin").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const notifKey = `notif_prefs_${companyId}`;

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  // Profile state
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", companyName: "" });
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Notification prefs — load from localStorage on first render using correct key
  const [notifs, setNotifs] = useState(() => {
    try {
      const saved = localStorage.getItem(`notif_prefs_${user?._id || user?.id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { emailNotifications: true, invoiceAlerts: true, weeklyReport: false, taskReminders: true };
  });

  useEffect(() => {
    setProfile({
      name: user?.companyName || user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
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
    } catch { } finally { setLoading(false); }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // Persist notifs to localStorage on every toggle change
  const updateNotif = (key, val) => {
    const updated = { ...notifs, [key]: val };
    setNotifs(updated);
    try { localStorage.setItem(notifKey, JSON.stringify(updated)); } catch {}
  };

  const saveProfile = async () => {
    // Always persist notifs to localStorage first
    try { localStorage.setItem(notifKey, JSON.stringify(notifs)); } catch {}
    try {
      setProfileSaving(true);
      await axios.put(`${BASE_URL}/api/subadmins/${companyId}`, {
        companyName: profile.name,
        phone: profile.phone,
        notificationPreferences: notifs,
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

  const addItem = (key, value) => {
    if (!value.trim()) return;
    const updated = { ...config, [key]: [...new Set([...config[key], value.trim()])] };
    saveConfig(updated);
  };

  const removeItem = (key, index) => {
    const updatedItems = [...config[key]];
    updatedItems.splice(index, 1);
    saveConfig({ ...config, [key]: updatedItems });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 680 }}>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#fff", border: "1.5px solid #9333ea", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#9333ea", boxShadow: "0 8px 24px rgba(147,51,234,0.15)" }}>
          {toast}
        </div>
      )}

      {/* ── Profile Card ── */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede9fe", overflow: "hidden", boxShadow: "0 4px 24px rgba(147,51,234,0.08)" }}>
        {/* Gradient Header */}
        <div style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea,#a855f7)", padding: "28px 24px 22px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 62, height: 62, borderRadius: 16, background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#fff", lineHeight: 1.2 }}>{displayName}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 3 }}>{user?.email || "—"}</div>
            <div style={{ display: "inline-block", marginTop: 7, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 99, padding: "2px 10px", fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>
              {roleLabel.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div style={{ padding: "20px 24px 4px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
            <Inp label="Full Name / Company" value={profile.name} onChange={v => setProfile(p => ({ ...p, name: v }))} placeholder="Your name or company" />
            <Inp label="Email" value={profile.email} type="email" onChange={v => setProfile(p => ({ ...p, email: v }))} placeholder="Email address" />
            <Inp label="Phone" value={profile.phone} onChange={v => setProfile(p => ({ ...p, phone: v }))} placeholder="Contact number" />
            <Inp label="Company Name" value={profile.companyName} onChange={v => setProfile(p => ({ ...p, companyName: v }))} placeholder="Business name" />
          </div>

          {/* Notification Preferences */}
          <div style={{ marginTop: 8, marginBottom: 8, fontSize: 11, fontWeight: 700, color: "#7c3aed", letterSpacing: 0.5, textTransform: "uppercase" }}>Notification Preferences</div>
          <Toggle label="Email Notifications" desc="Receive email alerts for important events" checked={notifs.emailNotifications} onChange={v => updateNotif('emailNotifications', v)} />
          <Toggle label="Invoice Payment Alerts" desc="Get notified when invoices are paid or overdue" checked={notifs.invoiceAlerts} onChange={v => updateNotif('invoiceAlerts', v)} />
          <Toggle label="Task Reminders" desc="Receive reminders for upcoming task deadlines" checked={notifs.taskReminders} onChange={v => updateNotif('taskReminders', v)} />
          <Toggle label="Weekly Progress Report" desc="Summary email every Monday morning" checked={notifs.weeklyReport} onChange={v => updateNotif('weeklyReport', v)} />

          <div style={{ padding: "18px 0 20px" }}>
            <button
              onClick={saveProfile}
              disabled={profileSaving}
              style={{ width: "100%", background: profileSaved ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: profileSaving ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "background 0.3s", opacity: profileSaving ? 0.7 : 1 }}
            >
              {profileSaving ? "Saving…" : profileSaved ? "✓ Saved!" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Platform Config Sections ── */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13 }}>Loading configuration…</div>
      ) : !config ? (
        <div style={{ padding: 40, textAlign: "center", color: "#ef4444", fontSize: 13 }}>Failed to load configuration.</div>
      ) : (
        <>
          <SC title="🗂 Project Status Options">
            <p style={{ fontSize: 12, color: "#a78bfa", marginBottom: 12 }}>Define the statuses available for projects across the platform.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {config.projectStatuses.map((s, i) => (
                <div key={i} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: 8, padding: "5px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{s}</span>
                  <button onClick={() => removeItem('projectStatuses', i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13, padding: 0, lineHeight: 1 }}>✕</button>
                </div>
              ))}
            </div>
            <AddInput onAdd={(val) => addItem('projectStatuses', val)} placeholder="New project status…" />
          </SC>

          <SC title="✅ Task Status Options">
            <p style={{ fontSize: 12, color: "#a78bfa", marginBottom: 12 }}>Define the statuses available for tasks.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {config.taskStatuses.map((s, i) => (
                <div key={i} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: 8, padding: "5px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{s}</span>
                  <button onClick={() => removeItem('taskStatuses', i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13, padding: 0, lineHeight: 1 }}>✕</button>
                </div>
              ))}
            </div>
            <AddInput onAdd={(val) => addItem('taskStatuses', val)} placeholder="New task status…" />
          </SC>

          <SC title="🎯 Task Priority Options">
            <p style={{ fontSize: 12, color: "#a78bfa", marginBottom: 12 }}>Define the priority levels available for tasks.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {config.taskPriorities.map((s, i) => (
                <div key={i} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: 8, padding: "5px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{s}</span>
                  <button onClick={() => removeItem('taskPriorities', i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13, padding: 0, lineHeight: 1 }}>✕</button>
                </div>
              ))}
            </div>
            <AddInput onAdd={(val) => addItem('taskPriorities', val)} placeholder="New priority level…" />
          </SC>
        </>
      )}
    </div>
  );
}

function AddInput({ onAdd, placeholder }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: 8, maxWidth: 420 }}>
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder={placeholder}
        style={{ flex: 1, padding: "9px 14px", borderRadius: 10, border: "1.5px solid #ede9fe", background: "#faf5ff", fontSize: 13, outline: "none", fontFamily: "inherit" }}
        onKeyPress={(e) => { if (e.key === 'Enter') { onAdd(val); setVal(""); } }}
      />
      <button
        onClick={() => { onAdd(val); setVal(""); }}
        style={{ padding: "9px 20px", background: "linear-gradient(135deg,#9333ea,#a855f7)", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
      >
        Add
      </button>
    </div>
  );
}
