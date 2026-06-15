import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';
function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return "0, 188, 212";
  const bigint = parseInt(hex.replace(/^#/, ''), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}
// ─────────────────────────────────────────────────────────────
//  Reusable Components
// ─────────────────────────────────────────────────────────────
const Input = ({ label, value, onChange, type = "text", placeholder, required = false }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--app-text)", marginBottom: 6 }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={inputType}
          value={value || ""}
          onChange={e => {
            let val = e.target.value;
            if (type === "tel" && val && !/^\d*$/.test(val)) return;
            onChange(val);
          }}
          placeholder={placeholder}
          style={{
            width: "100%", padding: "12px 14px", paddingRight: isPassword ? 40 : 14, borderRadius: 12,
            border: "1.5px solid var(--app-border)", background: "var(--app-bg)",
            fontSize: 14, color: "var(--app-text)", outline: "none",
            transition: "border-color 0.2s, box-shadow 0.2s"
          }}
          onFocus={e => { e.target.style.borderColor = "var(--app-accent)"; e.target.style.boxShadow = `0 0 0 3px rgba(var(--app-accent-rgb), 0.1)`; }}
          onBlur={e => { e.target.style.borderColor = "var(--app-border)"; e.target.style.boxShadow = "none"; }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--app-muted)",
              padding: 4, display: "flex", alignItems: "center", justifyContent: "center"
            }}
            title={show ? "Hide password" : "Show password"}
          >
            {show ? "👁️‍🗨️" : "👁️"}
          </button>
        )}
      </div>
    </div>
  );
};

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
        background: checked ? "var(--app-accent)" : "rgba(var(--app-accent-rgb, 124, 58, 237), 0.2)",
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
export default function SettingsPage({ user, appTheme, setAppTheme, themes, customColor, setCustomColor, onLogoChange, triggerCrop, onProfileUpdate, THEME }) {
  const companyId = user?._id || user?.id;
  const [activeTab, setActiveTab] = useState("profile");
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
 const mainScrollRef = useRef(null);  
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
        companyName: profile.name,
        phone: profile.phone,
        email: profile.email,
        notificationPreferences: notifs,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
      // ── Notify parent: update user state live everywhere ──
      if (onProfileUpdate) {
        onProfileUpdate({
          companyName: profile.name,
          phone: profile.phone,
          email: profile.email,
        });
      }
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
    { id: "branding", icon: "🎨", label: "Branding" },
 
    { id: "security", icon: "🔒", label: "Security" }
  ];

  const displayName = user?.companyName || user?.name || user?.email?.split("@")[0] || "Admin";
  const initials = (user?.companyName || user?.name || "AD").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const roleLabel = (user?.role || "SubAdmin").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  const wrapperStyle = THEME ? {
    "--app-bg": THEME.bg || "var(--app-bg)",
    "--app-card": THEME.surface || THEME.card || "var(--app-card)",
    "--app-border": THEME.border || "var(--app-border)",
    "--app-text": THEME.text || "var(--app-text)",
    "--app-muted": THEME.textMuted || THEME.muted || "var(--app-muted)",
    "--app-accent": THEME.accent || THEME.pink || "var(--teal)",
    "--app-accent-rgb": THEME.accent ? hexToRgb(THEME.accent) : THEME.pink ? hexToRgb(THEME.pink) : "0, 188, 212",
    "--app-accent-gradient": THEME.sidebar || THEME.grad || THEME.accent || THEME.pink || "linear-gradient(135deg, var(--teal), var(--teal2))",
    maxWidth: 1400, margin: "0 auto", padding: "20px"
  } : { maxWidth: 1400, margin: "0 auto", padding: "20px" };

  return (
    <div style={{ ...wrapperStyle, fontFamily: "var(--font, 'Nunito', sans-serif)", minHeight: "100%", background: "var(--app-bg, var(--bg, #F5FAFA))" }}>
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: "var(--surface)", borderLeft: "4px solid var(--teal)",
          borderRadius: 12, padding: "12px 20px", fontSize: 13,
          fontWeight: 700, color: "var(--text)", boxShadow: "0 4px 16px rgba(0,0,0,.1)"
        }}>{toast}</div>
      )}

<div className="content" ref={mainScrollRef} style={{ padding: "22px 28px 32px" }}>
        <div className="page-header" style={{ marginBottom: 22 }}>
          <div>
            <div className="page-title" style={{ fontSize: 20, fontWeight: 800 }}>Settings</div>
            <div className="page-sub" style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>Manage your account, company and preferences</div>
          </div>
        </div>

        <div className="settings-layout">
          {/* SETTINGS NAV */}
          <div className="settings-nav">
            {navItems.map((item, idx) => (
              <React.Fragment key={item.id}>
                <div 
                  className={`sn-item ${activeTab === item.id ? "active" : ""}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span> 
                  {item.label}
                </div>
                {idx === 0 && <hr className="sn-divider" />}
              </React.Fragment>
            ))}
          </div>

          {/* SETTINGS PANELS */}
          <div className="settings-panels">
            {activeTab === "profile" && (
              <div className="settings-section">
                <div className="ss-header">
                  <div className="ss-header-icon" style={{ background: "rgba(var(--app-accent-rgb), 0.15)", color: "var(--app-accent)" }}>👤</div>
                  <div>
                    <div className="ss-title">Profile & Company</div>
                    <div className="ss-sub">Update your personal and business information</div>
                  </div>
                </div>
                <div className="ss-body">
                  <div className="avatar-upload">
                    <div className="avatar-big">
                      {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : initials}
                      <label className="avatar-edit">
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: "none" }} />
                        <i className="ti ti-pencil" style={{ fontSize: 11 }}></i>
                      </label>
                    </div>
                    <div className="avatar-actions">
                      <label className="avatar-upload-btn">
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: "none" }} />
                        <i className="ti ti-upload"></i> Upload new photo
                      </label>
                      {avatarUrl && <div className="avatar-remove" onClick={() => { setAvatarUrl(""); if(onLogoChange) onLogoChange(""); }}>Remove photo</div>}
                      <div className="avatar-note">Recommended size: 256x256px. Max 2MB.</div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Company Name *</label>
                      <input className="form-input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Your company name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input className="form-input" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="Email address" />
                    </div>
                  </div>
                  <div className="form-group" style={{ maxWidth: "50%" }}>
                    <label className="form-label">Phone Number</label>
                    <input className="form-input" type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="Contact number" />
                  </div>
                  
                  <div className="section-save">
                    <button className="sec-save-btn" onClick={saveProfile} disabled={profileSaving}>
                      {profileSaving ? "Saving..." : <><i className="ti ti-device-floppy"></i> Save Changes</>}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "branding" && (
              <div className="settings-section">
                <div className="ss-header">
                  <div className="ss-header-icon" style={{ background: "rgba(var(--app-accent-rgb), 0.15)", color: "var(--app-accent)" }}>🎨</div>
                  <div>
                    <div className="ss-title">Branding & Theme</div>
                    <div className="ss-sub">Customize the look and feel of your app</div>
                  </div>
                </div>
                <div className="ss-body">
                  <div className="form-group">
                    <label className="form-label">App Theme</label>
                    <div className="color-picker-row">
                      {themes && Object.entries(themes).map(([key, t]) => (
                        <div 
                          key={key} 
                          className={`color-swatch ${appTheme === key ? "selected" : ""}`}
                          style={{ background: t.dot }}
                          onClick={() => setAppTheme(key)}
                          title={t.label}
                        />
                      ))}
                    </div>
                    <div className="form-hint">Choose a primary color for buttons and accents.</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="settings-section">
                <div className="ss-header">
                  <div className="ss-header-icon" style={{ background: "rgba(var(--app-accent-rgb), 0.15)", color: "var(--app-accent)" }}>🔒</div>
                  <div>
                    <div className="ss-title">Security & Passwords</div>
                    <div className="ss-sub">Manage your password and security settings</div>
                  </div>
                </div>
                <div className="ss-body">
                  <div className="form-group" style={{ maxWidth: 400 }}>
                    <label className="form-label">Current Password</label>
                    <input className="form-input" type="password" value={passwords.old} onChange={e => setPasswords(p => ({ ...p, old: e.target.value }))} placeholder="••••••••" />
                  </div>
                  <div className="form-group" style={{ maxWidth: 400 }}>
                    <label className="form-label">New Password</label>
                    <input className="form-input" type="password" value={passwords.new} onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))} placeholder="••••••••" />
                    <div className="form-hint">Must be at least 6 characters.</div>
                  </div>
                  <div className="form-group" style={{ maxWidth: 400 }}>
                    <label className="form-label">Confirm New Password</label>
                    <input className="form-input" type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" />
                  </div>
                  
                  <div className="section-save" style={{ justifyContent: "flex-start", marginTop: 24, paddingTop: 0, borderTop: "none" }}>
                    <button className="sec-save-btn" onClick={handleUpdatePassword} disabled={securityLoading}>
                      {securityLoading ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
