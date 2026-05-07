import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';

// ─────────────────────────────────────────────────────────────
//  Reusable Components
// ─────────────────────────────────────────────────────────────
const Input = ({ label, value, onChange, type = "text", placeholder, required = false }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--app-text)", marginBottom: 6 }}>
      {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
    </label>
    <input
      type={type}
      value={value || ""}
      onChange={e => {
        let val = e.target.value;
        if (type === "tel" && val && !/^\d*$/.test(val)) return;
        onChange(val);
      }}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "12px 14px", borderRadius: 12,
        border: "1.5px solid var(--app-border)", background: "var(--app-bg)",
        fontSize: 14, color: "var(--app-text)", outline: "none",
        transition: "border-color 0.2s, box-shadow 0.2s"
      }}
      onFocus={e => { e.target.style.borderColor = "var(--app-accent)"; e.target.style.boxShadow = `0 0 0 3px rgba(var(--app-accent-rgb), 0.1)`; }}
      onBlur={e => { e.target.style.borderColor = "var(--app-border)"; e.target.style.boxShadow = "none"; }}
    />
  </div>
);

const Toggle = ({ label, desc, checked, onChange }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 0", borderBottom: "1px solid var(--app-border)"
  }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--app-text)" }}>{label}</div>
      {desc && <div style={{ fontSize: 12, color: "var(--app-muted)", marginTop: 2 }}>{desc}</div>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 46, height: 26, borderRadius: 99, border: "none", cursor: "pointer",
        background: checked ? "var(--app-accent)" : "#cbd5e1",
        position: "relative", transition: "background 0.2s", flexShrink: 0
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: checked ? 24 : 4,
        width: 20, height: 20, borderRadius: "50%", background: "white",
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
      }} />
    </button>
  </div>
);

const Chip = ({ children, onRemove }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "var(--app-bg)", border: "1px solid var(--app-border)",
    borderRadius: 40, padding: "6px 12px 6px 16px", fontSize: 13,
    fontWeight: 500, color: "var(--app-text)"
  }}>
    {children}
    {onRemove && (
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 16, padding: "0 4px" }}>×</button>
    )}
  </div>
);

const AddInput = ({ onAdd, placeholder }) => {
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder={placeholder}
        onKeyPress={e => e.key === "Enter" && onAdd(val) && setVal("")}
        style={{
          flex: 1, minWidth: 180, padding: "10px 14px", borderRadius: 12,
          border: "1.5px solid var(--app-border)", background: "var(--app-bg)",
          fontSize: 13, outline: "none"
        }}
      />
      <button
        onClick={() => { if (val.trim()) { onAdd(val); setVal(""); } }}
        style={{
          padding: "10px 20px", borderRadius: 12, background: "var(--app-accent-gradient)",
          color: "white", border: "none", fontWeight: 600, cursor: "pointer"
        }}
      >+ Add</button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  Main Settings Component
// ─────────────────────────────────────────────────────────────
export default function SettingsPage({ user, appTheme, setAppTheme, themes, customColor, setCustomColor, onLogoChange, triggerCrop }) {
  const companyId = user?._id || user?.id;
  const [activeTab, setActiveTab] = useState("profile");
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  // Profile state
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", companyName: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Notifications state (localStorage)
  const notifKey = `notif_prefs_${companyId}`;
  const [notifs, setNotifs] = useState(() => {
    try {
      const saved = localStorage.getItem(notifKey);
      return saved ? JSON.parse(saved) : { emailNotifications: true, invoiceAlerts: true, weeklyReport: false, taskReminders: true };
    } catch { return { emailNotifications: true, invoiceAlerts: true, weeklyReport: false, taskReminders: true }; }
  });

  // Avatar upload state (optional extension)
  const [avatarUrl, setAvatarUrl] = useState(user?.logoUrl || user?.avatar || "");

  // Security state
  const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
  const [securityLoading, setSecurityLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    if (user) {
      setProfile({
        name: user?.companyName || user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        companyName: user?.companyName || "",
      });
      setAvatarUrl(user?.logoUrl || user?.avatar || "");
    }
    fetchConfig();
  }, [companyId, user]);

  const fetchConfig = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/config/${companyId}`);
      setConfig(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const updateNotif = (key, val) => {
    const updated = { ...notifs, [key]: val };
    setNotifs(updated);
    localStorage.setItem(notifKey, JSON.stringify(updated));
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileSaved(false);
    try {
      await axios.put(`${BASE_URL}/api/subadmins/${companyId}`, {
        companyName: profile.name, phone: profile.phone, notificationPreferences: notifs,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) { showToast("Failed to save profile"); } finally { setProfileSaving(false); }
  };

  const saveConfig = async (updatedConfig) => {
    setSaving(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/config/${companyId}`, updatedConfig);
      setConfig(res.data);
      showToast("Configuration saved");
    } catch { showToast("Save failed"); } finally { setSaving(false); }
  };

  const addItem = (key, val) => {
    if (!val.trim()) return;
    const newArr = [...new Set([...config[key], val.trim()])];
    saveConfig({ ...config, [key]: newArr });
  };
  const removeItem = (key, idx) => {
    const newArr = [...config[key]];
    newArr.splice(idx, 1);
    saveConfig({ ...config, [key]: newArr });
  };

  // Avatar upload handler
  const handleAvatarUpload = (e) => {
    if (triggerCrop) {
      triggerCrop(e, (croppedImage) => {
        setAvatarUrl(croppedImage);
        if (onLogoChange) {
          onLogoChange(croppedImage);
        }
      }, 1); // 1 is for square crop or generic logo crop
    } else {
      // Fallback if triggerCrop is missing
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target.result;
        setAvatarUrl(result);
        if (onLogoChange) onLogoChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwords.old || !passwords.new || !passwords.confirm) {
      showToast("All password fields are required");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      showToast("New passwords do not match");
      return;
    }
    if (passwords.new.length < 6) {
      showToast("Password must be at least 6 characters");
      return;
    }

    setSecurityLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/change-password`, {
        userId: companyId,
        oldPassword: passwords.old,
        newPassword: passwords.new
      });
      showToast(res.data.msg || "Password updated successfully");
      setPasswords({ old: "", new: "", confirm: "" });
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to update password");
    } finally {
      setSecurityLoading(false);
    }
  };

  // Sidebar navigation items
  const navItems = [
    { id: "profile", icon: "👤", label: "Profile" },
    { id: "notifications", icon: "🔔", label: "Notifications" },
    { id: "branding", icon: "🎨", label: "Branding" },
    { id: "config", icon: "⚙️", label: "Platform Config" },
    { id: "security", icon: "🔒", label: "Security" }
  ];

  const displayName = user?.companyName || user?.name || user?.email?.split("@")[0] || "Admin";
  const initials = (user?.companyName || user?.name || "AD").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const roleLabel = (user?.role || "SubAdmin").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px" }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: "var(--app-card)", borderLeft: `4px solid var(--app-accent)`,
          borderRadius: 12, padding: "12px 20px", fontSize: 13,
          fontWeight: 600, color: "var(--app-text)", boxShadow: "var(--app-shadow)"
        }}>{toast}</div>
      )}

      <div style={{ display: "flex", flexDirection: "row", gap: 28, flexWrap: "wrap" }}>
        {/* ========= SIDEBAR ========= */}
        <aside style={{
          width: 260, background: "var(--app-bg)", borderRadius: 24,
          border: "1px solid var(--app-border)", overflow: "hidden",
          alignSelf: "start", position: "sticky", top: 20
        }}>
          {/* User Summary */}
          <div style={{
            padding: "24px 20px", textAlign: "center",
            borderBottom: "1px solid var(--app-border)", background: "rgba(var(--app-accent-rgb), 0.05)"
          }}>
            <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="avatar" 
                  style={{ 
                    width: "auto", 
                    height: "auto", 
                    maxWidth: "180px", 
                    maxHeight: "100px", 
                    borderRadius: 16, 
                    objectFit: "contain", 
                    border: "2px solid var(--app-accent)",
                    background: "var(--app-card)",
                    boxShadow: "0 4px 12px rgba(var(--app-accent-rgb), 0.1)"
                  }} 
                />
              ) : (
                <div style={{
                  width: 80, height: 80, borderRadius: 28, background: "var(--app-accent-gradient)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 32, fontWeight: 700, color: "#fff"
                }}>{initials}</div>
              )}
              <label style={{
                position: "absolute", bottom: -10, right: -10, background: "var(--app-card)",
                borderRadius: 99, width: 32, height: 32, display: "flex", alignItems: "center", 
                justifyContent: "center", cursor: "pointer", border: "1.5px solid var(--app-border)",
                boxShadow: "var(--app-shadow)"
              }}>
                <span style={{ fontSize: 14 }}>📷</span>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: "none" }} />
              </label>
            </div>
            <div style={{ marginTop: 12, fontWeight: 700, fontSize: 16, color: "var(--app-text)" }}>{displayName}</div>
            <div style={{ fontSize: 12, color: "var(--app-muted)" }}>{user?.email}</div>
            <div style={{ marginTop: 8, fontSize: 11, background: "rgba(var(--app-accent-rgb), 0.1)", display: "inline-block", padding: "4px 12px", borderRadius: 99, color: "var(--app-accent)" }}>{roleLabel}</div>
          </div>

          {/* Navigation */}
          <nav style={{ padding: "16px 12px" }}>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, width: "100%",
                  padding: "12px 16px", marginBottom: 4, borderRadius: 14,
                  background: activeTab === item.id ? "rgba(var(--app-accent-rgb), 0.15)" : "transparent",
                  color: activeTab === item.id ? "var(--app-accent)" : "var(--app-text)",
                  border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500,
                  transition: "all 0.2s", fontFamily: "inherit"
                }}
                onMouseEnter={e => { if (activeTab !== item.id) e.currentTarget.style.background = "rgba(var(--app-accent-rgb), 0.05)"; }}
                onMouseLeave={e => { if (activeTab !== item.id) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ========= MAIN CONTENT ========= */}
        <main style={{ flex: 1, minWidth: 280 }}>
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", borderRadius: 24, padding: "28px 32px" }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: "var(--app-text)" }}>Profile Details</h2>
              <p style={{ fontSize: 14, color: "var(--app-muted)", marginBottom: 32 }}>Update your account information</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                <Input label="Full Name / Company" value={profile.name} onChange={v => setProfile(p => ({ ...p, name: v }))} placeholder="Your name or company" required />
                <Input label="Email" type="email" value={profile.email} onChange={v => setProfile(p => ({ ...p, email: v }))} placeholder="Email address" disabled style={{ opacity: 0.7 }} />
                <Input label="Phone" type="tel" value={profile.phone} onChange={v => setProfile(p => ({ ...p, phone: v }))} placeholder="Contact number" />
                <Input label="Company Name" value={profile.companyName} onChange={v => setProfile(p => ({ ...p, companyName: v }))} placeholder="Business name" />
              </div>

              <button
                onClick={saveProfile}
                disabled={profileSaving}
                style={{
                  marginTop: 28, padding: "12px 28px", borderRadius: 40,
                  background: profileSaved ? "#22c55e" : "var(--app-accent-gradient)",
                  color: "white", border: "none", fontWeight: 700, cursor: "pointer",
                  transition: "0.2s", opacity: profileSaving ? 0.7 : 1
                }}
              >
                {profileSaving ? "Saving..." : profileSaved ? "✓ Saved!" : "Save Changes"}
              </button>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", borderRadius: 24, padding: "28px 32px" }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: "var(--app-text)" }}>Notifications</h2>
              <p style={{ fontSize: 14, color: "var(--app-muted)", marginBottom: 24 }}>Choose what alerts you want to receive</p>

              <Toggle label="Email Notifications" desc="Receive email alerts for important events" checked={notifs.emailNotifications} onChange={v => updateNotif("emailNotifications", v)} />
              <Toggle label="Invoice Payment Alerts" desc="Get notified when invoices are paid or overdue" checked={notifs.invoiceAlerts} onChange={v => updateNotif("invoiceAlerts", v)} />
              <Toggle label="Task Reminders" desc="Receive reminders for upcoming task deadlines" checked={notifs.taskReminders} onChange={v => updateNotif("taskReminders", v)} />
              <Toggle label="Weekly Progress Report" desc="Summary email every Monday morning" checked={notifs.weeklyReport} onChange={v => updateNotif("weeklyReport", v)} />

              <button onClick={saveProfile} style={{ marginTop: 28, padding: "12px 28px", borderRadius: 40, background: "var(--app-accent-gradient)", color: "white", border: "none", fontWeight: 700, cursor: "pointer" }}>Save Preferences</button>
            </div>
          )}

          {/* BRANDING TAB */}
          {activeTab === "branding" && (
            <div style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", borderRadius: 24, padding: "28px 32px" }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: "var(--app-text)" }}>Branding & Theme</h2>
              <p style={{ fontSize: 14, color: "var(--app-muted)", marginBottom: 28 }}>Customize your dashboard look</p>

              <div style={{ marginBottom: 32 }}>
                <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: "block" }}>Preset Themes</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {themes && Object.entries(themes).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => setAppTheme(key)}
                      style={{
                        padding: "10px 18px", borderRadius: 40, border: appTheme === key ? `2px solid ${t.dot}` : "1px solid var(--app-border)",
                        background: appTheme === key ? `${t.dot}10` : "transparent", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 500
                      }}
                    >
                      <span style={{ width: 20, height: 20, borderRadius: 20, background: t.dot }}></span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: "block" }}>Custom Brand Color</label>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <input
                    type="color"
                    value={customColor || "#7c3aed"}
                    onChange={(e) => { setCustomColor(e.target.value); setAppTheme("custom"); }}
                    style={{ width: 60, height: 60, borderRadius: 16, border: "2px solid var(--app-border)", cursor: "pointer" }}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>Your primary color</div>
                    <div style={{ fontSize: 13, color: "var(--app-muted)" }}>Used for buttons, links, and accents</div>
                    <div style={{ fontFamily: "monospace", fontSize: 12, marginTop: 6 }}>{(customColor || "#7C3AED").toUpperCase()}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PLATFORM CONFIG TAB */}
          {activeTab === "config" && (
            <div style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", borderRadius: 24, padding: "28px 32px" }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: "var(--app-text)" }}>Platform Configuration</h2>
              <p style={{ fontSize: 14, color: "var(--app-muted)", marginBottom: 28 }}>Manage statuses, priorities, and more</p>

              {loading ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--app-muted)" }}>Loading configuration...</div>
              ) : !config ? (
                <div style={{ textAlign: "center", padding: 40, color: "#ef4444" }}>Failed to load config</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                  {[
                    { key: "projectStatuses", title: "Project Statuses", placeholder: "New status (e.g. Planning)" },
                    { key: "taskStatuses", title: "Task Statuses", placeholder: "New status (e.g. In Review)" },
                    { key: "taskPriorities", title: "Task Priorities", placeholder: "New priority (e.g. Critical)" }
                  ].map(({ key, title, placeholder }) => (
                    <div key={key}>
                      <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 16 }}>{title}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                        {config[key].map((item, idx) => (
                          <Chip key={idx} onRemove={() => removeItem(key, idx)}>{item}</Chip>
                        ))}
                      </div>
                      <AddInput onAdd={val => addItem(key, val)} placeholder={placeholder} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECURITY TAB (new) */}
          {activeTab === "security" && (
            <div style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", borderRadius: 24, padding: "28px 32px" }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: "var(--app-text)" }}>Security</h2>


              <div style={{ maxWidth: 500 }}>
                <Input 
                  label="Current Password" 
                  type="password" 
                  placeholder="Enter current password" 
                  value={passwords.old} 
                  onChange={v => setPasswords(p => ({ ...p, old: v }))} 
                />
                <Input 
                  label="New Password" 
                  type="password" 
                  placeholder="Enter new password" 
                  value={passwords.new} 
                  onChange={v => setPasswords(p => ({ ...p, new: v }))} 
                />
                <Input 
                  label="Confirm New Password" 
                  type="password" 
                  placeholder="Confirm new password" 
                  value={passwords.confirm} 
                  onChange={v => setPasswords(p => ({ ...p, confirm: v }))} 
                />
                <button 
                  onClick={handleUpdatePassword}
                  disabled={securityLoading}
                  style={{ 
                    marginTop: 8, padding: "12px 32px", borderRadius: 40, 
                    background: "var(--app-accent-gradient)", color: "white", 
                    border: "none", fontWeight: 700, cursor: "pointer",
                    opacity: securityLoading ? 0.7 : 1,
                    boxShadow: "0 4px 12px rgba(var(--app-accent-rgb), 0.2)"
                  }}
                >
                  {securityLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}