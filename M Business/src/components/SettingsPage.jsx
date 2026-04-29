import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';

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

const SC = ({ title, children }) => (
  <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 4px 24px rgba(147,51,234,0.08)", border: "1px solid #ede9fe", marginBottom: 20 }}>
    <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: T.text }}>{title}</h3>
    {children}
  </div>
);

export default function SettingsPage({ user }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const companyId = user?._id || user?.id;

  useEffect(() => {
    fetchConfig();
  }, [companyId]);

  const fetchConfig = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/config/${companyId}`);
      setConfig(res.data);
    } catch (error) {
      console.error("Error fetching config:", error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const saveConfig = async (updatedConfig) => {
    try {
      setSaving(true);
      const res = await axios.post(`${BASE_URL}/api/config/${companyId}`, updatedConfig);
      setConfig(res.data);
      showToast("✅ Settings saved successfully!");
    } catch (error) {
      console.error("Error saving config:", error);
      showToast("❌ Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const addItem = (key, value) => {
    if (!value.trim()) return;
    const updated = { ...config, [key]: [...new Set([...config[key], value.trim()])] };
    saveConfig(updated);
  };

  const removeItem = (key, index) => {
    const updatedItems = [...config[key]];
    updatedItems.splice(index, 1);
    const updated = { ...config, [key]: updatedItems };
    saveConfig(updated);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: T.muted }}>Loading configuration...</div>;
  if (!config) return <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>Failed to load configuration.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#fff", border: "1.5px solid #9333ea", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#9333ea", boxShadow: "0 8px 24px rgba(147,51,234,0.15)" }}>
          {toast}
        </div>
      )}

      <SC title="Project Status Options">
        <p style={{ fontSize: 12, color: "#a78bfa", marginBottom: 12 }}>Define the statuses available for projects. These will appear in dropdowns across the platform.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {config.projectStatuses.map((s, i) => (
            <div key={i} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{s}</span>
              <button onClick={() => removeItem('projectStatuses', i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>
            </div>
          ))}
        </div>
        <AddInput onAdd={(val) => addItem('projectStatuses', val)} placeholder="New project status..." />
      </SC>

      <SC title="Task Status Options">
        <p style={{ fontSize: 12, color: "#a78bfa", marginBottom: 12 }}>Define the statuses available for tasks.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {config.taskStatuses.map((s, i) => (
            <div key={i} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{s}</span>
              <button onClick={() => removeItem('taskStatuses', i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>
            </div>
          ))}
        </div>
        <AddInput onAdd={(val) => addItem('taskStatuses', val)} placeholder="New task status..." />
      </SC>

      <SC title="Task Priority Options">
        <p style={{ fontSize: 12, color: "#a78bfa", marginBottom: 12 }}>Define the priority levels for tasks.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {config.taskPriorities.map((s, i) => (
            <div key={i} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{s}</span>
              <button onClick={() => removeItem('taskPriorities', i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>
            </div>
          ))}
        </div>
        <AddInput onAdd={(val) => addItem('taskPriorities', val)} placeholder="New priority level..." />
      </SC>
    </div>
  );
}

function AddInput({ onAdd, placeholder }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: 8, maxWidth: 400 }}>
      <input 
        value={val} 
        onChange={e => setVal(e.target.value)} 
        placeholder={placeholder} 
        style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #ede9fe", background: "#faf5ff", fontSize: 13, outline: "none", fontFamily: "inherit" }}
        onKeyPress={(e) => { if (e.key === 'Enter') { onAdd(val); setVal(""); } }}
      />
      <button 
        onClick={() => { onAdd(val); setVal(""); }} 
        style={{ padding: "10px 20px", background: "linear-gradient(135deg,#9333ea,#a855f7)", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
      >
        Add
      </button>
    </div>
  );
}
