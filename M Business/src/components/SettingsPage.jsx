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

  // Bank Details state
  const [bank, setBank] = useState({ bankName: "", accountNo: "", ifscCode: "", upiId: "", paymentDue: "NOW", paymentMethod: "Bank Transfer / NEFT", currency: "INR" });
  const [bankSaving, setBankSaving] = useState(false);

  // Security state
  const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
  const [securityLoading, setSecurityLoading] = useState(false);

  // Documents tab state
  const docsKey = `doc_settings_${companyId}`;
  const [docs, setDocs] = useState(() => {
    try {
      const saved = localStorage.getItem(docsKey);
      return saved ? JSON.parse(saved) : {
        companyName: '', gstNo: '', email: '', phone: '', address: '', website: '',
        bankName: '', accountNo: '', ifscCode: '', upiId: '', accountType: 'Current Account',
        paymentTerms: '1. Payment is due within the agreed terms.\n2. Late payments subject to 2% monthly interest.\n3. All disputes subject to Chennai jurisdiction.',
        footerNote: 'Thank you for your business! Please make payment within the due date.',
        signatory: ''
      };
    } catch { return { companyName:'',gstNo:'',email:'',phone:'',address:'',website:'',bankName:'',accountNo:'',ifscCode:'',upiId:'',accountType:'Current Account',paymentTerms:'',footerNote:'',signatory:'' }; }
  });
  const [docsSaving, setDocsSaving] = useState(false);
  const [prevType, setPrevType] = useState('inv');
  const saveDocs = () => {
    setDocsSaving(true);
    try {
      localStorage.setItem(docsKey, JSON.stringify(docs));
      setTimeout(() => setDocsSaving(false), 600);
      showToast('Document settings saved!');
    } catch { setDocsSaving(false); showToast('Failed to save'); }
  };

  // Invoice Creation state (embedded in settings)
  const [invState, setInvState] = useState({
    invNum: `INV-${new Date().getFullYear()}-${Math.floor(Math.random()*9000)+1000}`,
    invDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    category: 'Consulting',
    client: '',
    project: '',
    discount: 0,
    shipping: 0
  });
  const [invItems, setInvItems] = useState([{ desc: 'Item description', qty: 1, price: 0, tax: 18 }]);
  
  const calcInvTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;
    invItems.forEach(item => {
      const itemTotal = (parseFloat(item.qty)||0) * (parseFloat(item.price)||0);
      subtotal += itemTotal;
      taxTotal += itemTotal * ((parseFloat(item.tax)||0)/100);
    });
    const discountAmt = subtotal * ((parseFloat(invState.discount)||0)/100);
    const totalAmt = subtotal - discountAmt + taxTotal + (parseFloat(invState.shipping)||0);
    return { subtotal, discountAmt, taxTotal, totalAmt };
  };
  const invTotals = calcInvTotals();

  // Load initial data
  useEffect(() => {
    if (user) {
      // Load bank details
      const savedBank = localStorage.getItem("bankDetails");
      if (savedBank) { try { setBank(JSON.parse(savedBank)); } catch(e) {} }

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

  const saveBank = () => {
    setBankSaving(true);
    try {
      localStorage.setItem("bankDetails", JSON.stringify(bank));
      setTimeout(() => setBankSaving(false), 800);
      showToast("Bank details saved!");
    } catch(e) { setBankSaving(false); showToast("Failed to save"); }
  };

  // Sidebar navigation items
  const navItems = [
    { id: "profile", icon: "👤", label: "Profile" },
    { id: "branding", icon: "🎨", label: "Branding" },
    { id: "documents", icon: "📄", label: "Documents" },
    { id: "security", icon: "🔒", label: "Security" },
    { id: "bank", icon: "🏦", label: "Bank Details" }
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

            {activeTab === "documents" && (
              <div className="settings-section">
                {/* Alert */}
                <div style={{display:'flex',alignItems:'flex-start',gap:10,padding:'11px 14px',borderRadius:8,marginBottom:16,fontSize:12,background:'#DBEAFE',color:'#1e40af'}}>
                  <i className="ti ti-info-circle" style={{fontSize:15,marginTop:1,flexShrink:0}}></i>
                  <span>Everything configured here appears automatically on <strong>all 6 billing document types</strong> shared to the client portal — Invoice, Advance, Additional, Milestone, Payment receipt, and Expense report.</span>
                </div>

                {/* Document Header */}
                <div style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:12,marginBottom:14,overflow:'hidden'}}>
                  <div style={{padding:'14px 18px',borderBottom:'1px solid #F1F5F9',display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:32,height:32,borderRadius:8,background:'#E0F7FA',display:'flex',alignItems:'center',justifyContent:'center'}}><i className="ti ti-layout-navbar" style={{color:'#00BCD4'}}></i></div>
                    <div><div style={{fontSize:14,fontWeight:700}}>Document header</div><div style={{fontSize:11,color:'#6b7a8d'}}>Top section of every document sent to clients</div></div>

                  </div>
                  <div style={{padding:20}}>
                    {/* Logo upload */}
                    <div style={{marginBottom:14}}>
                      <label style={{fontSize:11,fontWeight:700,color:'#6b7a8d',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6,display:'block'}}>Company logo</label>
                      <div style={{border:'2px dashed #E2E8F0',borderRadius:10,padding:14,display:'flex',alignItems:'center',gap:14,background:'#F8FAFC',cursor:'pointer'}} onClick={() => document.getElementById('docs-logo-upload').click()}>
                        <div style={{width:52,height:52,borderRadius:10,background:'linear-gradient(135deg,#00BCD4,#0097A7)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:20,color:'white',flexShrink:0,overflow:'hidden'}}>
                          {avatarUrl ? <img src={avatarUrl} alt="Logo" style={{width:'100%',height:'100%',objectFit:'contain'}} /> : (docs.companyName||user?.companyName||'M')[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p style={{fontWeight:700,color:'#1a2332',marginBottom:3,fontSize:13}}>Upload company logo</p>
                          <p style={{fontSize:11,color:'#6b7a8d'}}>PNG or SVG · Max 2MB · Recommended 200×200px</p>
                          <input id="docs-logo-upload" type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatarUpload} />
                          <button className="btn" style={{marginTop:6,padding:'4px 12px',fontSize:12,background:'#F8FAFC',border:'1px solid #E2E8F0',borderRadius:6,cursor:'pointer',fontWeight:700}} type="button" onClick={e=>{e.stopPropagation();document.getElementById('docs-logo-upload').click();}}>Change logo</button>
                        </div>
                      </div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                      <div className="form-group"><label className="form-label">Company name *</label><input className="form-input" value={docs.companyName} onChange={e=>setDocs(d=>({...d,companyName:e.target.value}))} placeholder="e.g. YENCODE Technologies" /></div>
                      <div className="form-group"><label className="form-label">GST / Tax number</label><input className="form-input" value={docs.gstNo} onChange={e=>setDocs(d=>({...d,gstNo:e.target.value}))} placeholder="e.g. 33AABCU9603R1ZV" /></div>
                      <div className="form-group"><label className="form-label">Email address</label><input className="form-input" type="email" value={docs.email} onChange={e=>setDocs(d=>({...d,email:e.target.value}))} placeholder="company@email.com" /></div>
                      <div className="form-group"><label className="form-label">Phone number</label><input className="form-input" value={docs.phone} onChange={e=>setDocs(d=>({...d,phone:e.target.value}))} placeholder="+91 XXXXX XXXXX" /></div>
                      <div className="form-group" style={{gridColumn:'span 2'}}><label className="form-label">Address</label><input className="form-input" value={docs.address} onChange={e=>setDocs(d=>({...d,address:e.target.value}))} placeholder="City, State, Country — PIN" /></div>
                      <div className="form-group"><label className="form-label">Website (optional)</label><input className="form-input" value={docs.website} onChange={e=>setDocs(d=>({...d,website:e.target.value}))} placeholder="https://yoursite.com" /></div>
                    </div>
                  </div>
                </div>

                {/* --- EMBEDDED INVOICE CREATOR --- */}
                <div style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:12,marginBottom:14,overflow:'hidden'}}>
                  <div style={{padding:'14px 18px',borderBottom:'1px solid #F1F5F9',display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:32,height:32,borderRadius:8,background:'#E0F7FA',display:'flex',alignItems:'center',justifyContent:'center'}}><i className="ti ti-file-invoice" style={{color:'#00BCD4'}}></i></div>
                    <div><div style={{fontSize:14,fontWeight:700}}>Invoice Details</div><div style={{fontSize:11,color:'#6b7a8d'}}>Create invoice directly from settings</div></div>
                  </div>
                  <div style={{padding:20}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
                      <div className="form-group"><label className="form-label">Invoice Number</label><input className="form-input" value={invState.invNum} onChange={e=>setInvState(s=>({...s,invNum:e.target.value}))} /></div>
                      <div className="form-group"><label className="form-label">Invoice Date</label><input type="date" className="form-input" value={invState.invDate} onChange={e=>setInvState(s=>({...s,invDate:e.target.value}))} /></div>
                      <div className="form-group"><label className="form-label">Due Date</label><input type="date" className="form-input" value={invState.dueDate} onChange={e=>setInvState(s=>({...s,dueDate:e.target.value}))} /></div>
                      <div className="form-group"><label className="form-label">Category</label><select className="form-input" value={invState.category} onChange={e=>setInvState(s=>({...s,category:e.target.value}))}><option>Consulting</option><option>Development</option><option>Design</option></select></div>
                    </div>
                  </div>
                </div>

                <div style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:12,marginBottom:14,overflow:'hidden'}}>
                  <div style={{padding:'14px 18px',borderBottom:'1px solid #F1F5F9',display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:32,height:32,borderRadius:8,background:'#FEF3C7',display:'flex',alignItems:'center',justifyContent:'center'}}><i className="ti ti-user" style={{color:'#F59E0B'}}></i></div>
                    <div><div style={{fontSize:14,fontWeight:700}}>Bill To (Client)</div></div>
                  </div>
                  <div style={{padding:20}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                      <div className="form-group"><label className="form-label">Company / Client Name *</label><select className="form-input" value={invState.client} onChange={e=>setInvState(s=>({...s,client:e.target.value}))}><option>-- Select Company Name --</option><option>Urban Cafe</option></select></div>
                      <div className="form-group"><label className="form-label">Project</label><select className="form-input" value={invState.project} onChange={e=>setInvState(s=>({...s,project:e.target.value}))}><option>-- Select Project --</option><option>Billing Software</option></select></div>
                    </div>
                  </div>
                </div>

                <div style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:12,marginBottom:14,overflow:'hidden'}}>
                  <div style={{padding:'14px 18px',borderBottom:'1px solid #F1F5F9',display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:32,height:32,borderRadius:8,background:'#EDE9FE',display:'flex',alignItems:'center',justifyContent:'center'}}><i className="ti ti-list-details" style={{color:'#8B5CF6'}}></i></div>
                    <div><div style={{fontSize:14,fontWeight:700}}>Line Items</div></div>
                  </div>
                  <div style={{padding:20}}>
                    <table style={{width:'100%',borderCollapse:'collapse',marginBottom:14}}>
                      <thead><tr style={{background:'#F8FAFC'}}><th style={{padding:'10px',fontSize:10,fontWeight:700,color:'#6b7a8d',textAlign:'left'}}>Description</th><th style={{padding:'10px',fontSize:10,fontWeight:700,color:'#6b7a8d',textAlign:'center'}}>Qty</th><th style={{padding:'10px',fontSize:10,fontWeight:700,color:'#6b7a8d',textAlign:'center'}}>Unit Price</th><th style={{padding:'10px',fontSize:10,fontWeight:700,color:'#6b7a8d',textAlign:'center'}}>Tax %</th><th style={{padding:'10px',fontSize:10,fontWeight:700,color:'#6b7a8d',textAlign:'right'}}>Total</th><th></th></tr></thead>
                      <tbody>
                        {invItems.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{padding:'8px'}}><input className="form-input" value={item.desc} onChange={e=>{const n=[...invItems];n[idx].desc=e.target.value;setInvItems(n);}} /></td>
                            <td style={{padding:'8px',width:80}}><input type="number" className="form-input" value={item.qty} onChange={e=>{const n=[...invItems];n[idx].qty=e.target.value;setInvItems(n);}} style={{textAlign:'center'}} /></td>
                            <td style={{padding:'8px',width:120}}><input type="number" className="form-input" value={item.price} onChange={e=>{const n=[...invItems];n[idx].price=e.target.value;setInvItems(n);}} style={{textAlign:'center'}} /></td>
                            <td style={{padding:'8px',width:100}}>
                              <select className="form-input" value={item.tax} onChange={e=>{const n=[...invItems];n[idx].tax=e.target.value;setInvItems(n);}}>
                                <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option><option value="28">28%</option>
                              </select>
                            </td>
                            <td style={{padding:'8px',textAlign:'right',fontWeight:700,fontSize:14}}>₹{((item.qty||0)*(item.price||0)).toFixed(2)}</td>
                            <td style={{padding:'8px',width:40}}><button onClick={()=>{if(invItems.length>1)setInvItems(invItems.filter((_,i)=>i!==idx))}} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer'}}><i className="ti ti-trash"></i></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button onClick={()=>setInvItems([...invItems,{desc:'',qty:1,price:0,tax:18}])} style={{width:'100%',padding:'10px',background:'#E0F7FA',border:'1px dashed #00BCD4',color:'#0097A7',fontWeight:700,borderRadius:8,cursor:'pointer',marginBottom:20}}>+ Add Line Item</button>
                    
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
                      <div className="form-group"><label className="form-label">Discount (%)</label><input type="number" className="form-input" value={invState.discount} onChange={e=>setInvState(s=>({...s,discount:e.target.value}))} /></div>
                      <div className="form-group"><label className="form-label">Shipping / Extra Charges</label><input type="number" className="form-input" value={invState.shipping} onChange={e=>setInvState(s=>({...s,shipping:e.target.value}))} /></div>
                    </div>

                    <div style={{background:'#F8FAFC',borderRadius:10,padding:16}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13,color:'#6b7a8d'}}><span>Subtotal</span><span style={{fontWeight:700,color:'#1a2332'}}>₹{invTotals.subtotal.toFixed(2)}</span></div>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13,color:'#6b7a8d'}}><span>Discount</span><span style={{fontWeight:700,color:'#22c55e'}}>- ₹{invTotals.discountAmt.toFixed(2)}</span></div>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13,color:'#6b7a8d'}}><span>GST / Tax</span><span style={{fontWeight:700,color:'#f59e0b'}}>+ ₹{invTotals.taxTotal.toFixed(2)}</span></div>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:14,fontSize:13,color:'#6b7a8d'}}><span>Extra Charges</span><span style={{fontWeight:700,color:'#1a2332'}}>+ ₹{(parseFloat(invState.shipping)||0).toFixed(2)}</span></div>
                      <div style={{display:'flex',justifyContent:'space-between',paddingTop:14,borderTop:'1px solid #E2E8F0',fontSize:16,fontWeight:800}}><span>Total Amount</span><span style={{color:'#00BCD4'}}>₹{invTotals.totalAmt.toFixed(2)}</span></div>
                    </div>
                  </div>
                </div>
                {/* --------------------------------- */}

                {/* Document Footer */}
                <div style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:12,marginBottom:14,overflow:'hidden'}}>
                  <div style={{padding:'14px 18px',borderBottom:'1px solid #F1F5F9',display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:32,height:32,borderRadius:8,background:'#1a2332',display:'flex',alignItems:'center',justifyContent:'center'}}><i className="ti ti-layout-bottombar" style={{color:'white'}}></i></div>
                    <div><div style={{fontSize:14,fontWeight:700}}>Document footer</div><div style={{fontSize:11,color:'#6b7a8d'}}>Bank details, terms & signatory at the bottom of every document</div></div>
                    <span style={{marginLeft:'auto',display:'inline-flex',alignItems:'center',gap:4,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:'#E0F7FA',color:'#0097A7'}}><i className="ti ti-lock" style={{fontSize:9}}></i> Auto-applied to all types</span>
                  </div>
                  <div style={{padding:20}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#6b7a8d',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10,display:'flex',alignItems:'center',gap:8}}>Bank &amp; payment details<span style={{flex:1,height:1,background:'#E2E8F0',marginLeft:8}}></span></div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:16}}>
                      <div className="form-group"><label className="form-label">Bank name</label><input className="form-input" value={docs.bankName} onChange={e=>setDocs(d=>({...d,bankName:e.target.value}))} placeholder="e.g. HDFC Bank" /></div>
                      <div className="form-group"><label className="form-label">Account number</label><input className="form-input" value={docs.accountNo} onChange={e=>setDocs(d=>({...d,accountNo:e.target.value}))} placeholder="e.g. 5020123456789" /></div>
                      <div className="form-group"><label className="form-label">IFSC code</label><input className="form-input" value={docs.ifscCode} onChange={e=>setDocs(d=>({...d,ifscCode:e.target.value}))} placeholder="e.g. HDFC0001234" /></div>
                      <div className="form-group"><label className="form-label">UPI ID</label><input className="form-input" value={docs.upiId} onChange={e=>setDocs(d=>({...d,upiId:e.target.value}))} placeholder="e.g. company@okaxis" /></div>
                      <div className="form-group"><label className="form-label">Account type</label><select className="form-input" value={docs.accountType} onChange={e=>setDocs(d=>({...d,accountType:e.target.value}))}><option>Current Account</option><option>Savings Account</option></select></div>
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color:'#6b7a8d',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10,display:'flex',alignItems:'center',gap:8}}>Default document text<span style={{flex:1,height:1,background:'#E2E8F0',marginLeft:8}}></span></div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                      <div className="form-group"><label className="form-label">Payment terms</label><textarea className="form-input" style={{resize:'vertical',minHeight:80}} value={docs.paymentTerms} onChange={e=>setDocs(d=>({...d,paymentTerms:e.target.value}))} placeholder="Terms & conditions..." /></div>
                      <div className="form-group"><label className="form-label">Thank-you / footer note</label><textarea className="form-input" style={{resize:'vertical',minHeight:80}} value={docs.footerNote} onChange={e=>setDocs(d=>({...d,footerNote:e.target.value}))} placeholder="Thank you note..." /></div>
                      <div className="form-group" style={{gridColumn:'span 2'}}><label className="form-label">Authorised signatory</label><input className="form-input" value={docs.signatory} onChange={e=>setDocs(d=>({...d,signatory:e.target.value}))} placeholder="e.g. Prabhu · Managing Director" /></div>
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                <div style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:12,marginBottom:14,overflow:'hidden'}}>
                  <div style={{padding:'14px 18px',borderBottom:'1px solid #F1F5F9',display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:32,height:32,borderRadius:8,background:'#FEF3C7',display:'flex',alignItems:'center',justifyContent:'center'}}><i className="ti ti-eye" style={{color:'#F59E0B'}}></i></div>
                    <div><div style={{fontSize:14,fontWeight:700}}>Document preview</div><div style={{fontSize:11,color:'#6b7a8d'}}>Switch type to see how each document looks to clients</div></div>
                    <select className="form-input" style={{width:200,marginLeft:'auto',padding:'6px 10px',fontSize:12}} value={prevType} onChange={e=>setPrevType(e.target.value)}>
                      <option value="inv">Invoice</option>
                      <option value="adv">Advance receipt</option>
                      <option value="adc">Additional charge</option>
                      <option value="mst">Milestone bill</option>
                      <option value="pay">Payment receipt</option>
                      <option value="exp">Expense report</option>
                    </select>
                  </div>
                  <div style={{padding:14}}>
                    {/* Shared preview shell */}
                    {(() => {
                      const co = docs.companyName || user?.companyName || 'YENCODE Technologies';
                      const coEmail = docs.email || user?.email || 'company@email.com';
                      const coPhone = docs.phone || user?.phone || '+91 XXXXX XXXXX';
                      const coAddr = docs.address || user?.address || 'Chennai, Tamil Nadu, India';
                      const bankLine = `Bank: ${docs.bankName||'HDFC Bank'} · A/C: ${docs.accountNo||'XXXXXXXXX'} · IFSC: ${docs.ifscCode||'HDFC0001234'} · UPI: ${docs.upiId||'company@okaxis'}`;
                      const terms = docs.paymentTerms || 'Payment due within agreed terms. Late payments subject to 2% monthly interest.';
                      const footer = docs.footerNote || 'Thank you for your business!';
                      const sig = docs.signatory || 'Authorised Signatory';

                      const typeLabels = { inv:'INVOICE', adv:'ADVANCE RECEIPT', adc:'ADDITIONAL CHARGE', mst:'MILESTONE BILL', pay:'PAYMENT RECEIPT', exp:'EXPENSE REPORT' };
                      const typeNos   = { inv:'#INV-2026-1501', adv:'#ADV-001', adc:'#ADC-001', mst:'#MST-001', pay:'#PAY-001', exp:'#EXP-001' };

                      return (
                        <div style={{fontFamily:'Nunito,sans-serif',fontSize:12,color:'#1a2332',background:'white',border:'1px solid #E2E8F0',borderRadius:10,overflow:'hidden'}}>
                          {/* Header */}
                          <div style={{background:'#00BCD4',padding:'16px 20px',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16}}>
                            <div style={{display:'flex',alignItems:'flex-start',gap:14,flex:1}}>
                              <div style={{width:44,height:44,background:'white',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:16,color:'#00BCD4',flexShrink:0,overflow:'hidden'}}>
                                {avatarUrl ? <img src={avatarUrl} alt="" style={{width:'100%',height:'100%',objectFit:'contain'}} /> : co[0]?.toUpperCase()}
                              </div>
                              <div style={{color:'white',flex:1}}>
                                <div style={{fontSize:15,fontWeight:800,marginBottom:2}}>{co}</div>
                                <div style={{fontSize:11,opacity:.85,lineHeight:1.6}}>{coEmail} · {coPhone}<br/>{coAddr}</div>
                              </div>
                            </div>
                            <div style={{textAlign:'right',color:'white'}}>
                              <div style={{fontSize:14,fontWeight:800,letterSpacing:'.04em'}}>{typeLabels[prevType]}</div>
                              <div style={{fontSize:12,opacity:.8}}>{typeNos[prevType]}</div>
                              <div style={{fontSize:11,opacity:.7,marginTop:2}}>Date: {new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</div>
                            </div>
                          </div>
                          {/* Info bar */}
                          <div style={{background:'#F8FAFC',borderBottom:'1px solid #E2E8F0',padding:'11px 20px',display:'flex',gap:20,flexWrap:'wrap'}}>
                            <div><div style={{fontSize:10,fontWeight:700,color:'#6b7a8d',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>Bill to</div><div style={{fontSize:13,fontWeight:700}}>Urban Cafe</div></div>
                            <div><div style={{fontSize:10,fontWeight:700,color:'#6b7a8d',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>Project</div><div style={{fontSize:13,fontWeight:700}}>Urban Cafe Billing Software</div></div>
                            {prevType==='inv' && <div><div style={{fontSize:10,fontWeight:700,color:'#6b7a8d',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>Status</div><div style={{fontSize:12,fontWeight:700,color:'#166534',background:'#DCFCE7',padding:'2px 8px',borderRadius:20,display:'inline-block'}}>Paid</div></div>}
                          </div>
                          {/* Line items */}
                          <div style={{padding:14}}>
                            <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'#6b7a8d',marginBottom:8,paddingBottom:5,borderBottom:'1px solid #F1F5F9'}}>Line items</div>
                            <table style={{width:'100%',borderCollapse:'collapse'}}>
                              <thead><tr style={{background:'#E0F7FA'}}><th style={{padding:'7px 10px',fontSize:10,fontWeight:700,textTransform:'uppercase',color:'#0097A7',textAlign:'left'}}>#</th><th style={{padding:'7px 10px',fontSize:10,fontWeight:700,textTransform:'uppercase',color:'#0097A7',textAlign:'left'}}>Description</th><th style={{padding:'7px 10px',fontSize:10,fontWeight:700,textTransform:'uppercase',color:'#0097A7'}}>Qty</th><th style={{padding:'7px 10px',fontSize:10,fontWeight:700,textTransform:'uppercase',color:'#0097A7'}}>Unit price</th><th style={{padding:'7px 10px',fontSize:10,fontWeight:700,textTransform:'uppercase',color:'#0097A7'}}>Total</th></tr></thead>
                              <tbody>
                                {prevType==='inv' && <><tr><td style={{padding:'10px',borderBottom:'1px solid #F1F5F9',fontSize:12}}>1</td><td style={{padding:'10px',borderBottom:'1px solid #F1F5F9',fontSize:12}}>UI Design & Wireframing</td><td style={{padding:'10px',borderBottom:'1px solid #F1F5F9',fontSize:12,textAlign:'center'}}>1</td><td style={{padding:'10px',borderBottom:'1px solid #F1F5F9',fontSize:12,textAlign:'center'}}>₹25,000</td><td style={{padding:'10px',borderBottom:'1px solid #F1F5F9',fontSize:12,textAlign:'center',fontWeight:800}}>₹29,500</td></tr><tr><td style={{padding:'10px',fontSize:12}}>2</td><td style={{padding:'10px',fontSize:12}}>Backend API Development</td><td style={{padding:'10px',fontSize:12,textAlign:'center'}}>1</td><td style={{padding:'10px',fontSize:12,textAlign:'center'}}>₹45,000</td><td style={{padding:'10px',fontSize:12,textAlign:'center',fontWeight:800}}>₹53,100</td></tr></>}
                                {prevType==='adv' && <tr><td colSpan={2} style={{padding:'10px',fontSize:12}}>Phase 1 advance — upfront payment for kickoff</td><td style={{padding:'10px',fontSize:12,textAlign:'center'}}>Pending adjustment</td><td colSpan={2} style={{padding:'10px',fontSize:12,fontWeight:800,textAlign:'center'}}>₹25,000</td></tr>}
                                {prevType==='adc' && <tr><td colSpan={2} style={{padding:'10px',fontSize:12}}>Additional API integrations beyond scope</td><td style={{padding:'10px',fontSize:12}}>Client requested 3 new gateways</td><td colSpan={2} style={{padding:'10px',fontWeight:800,textAlign:'center'}}>₹8,000</td></tr>}
                                {prevType==='mst' && <tr><td style={{padding:'10px',fontSize:12}}>Phase 3</td><td style={{padding:'10px',fontSize:12}}>Backend Concept Development</td><td style={{padding:'10px',textAlign:'center',fontSize:12}}>100%</td><td colSpan={2} style={{padding:'10px',fontWeight:800,textAlign:'center'}}>₹20,000</td></tr>}
                                {prevType==='pay' && <tr><td style={{padding:'10px',fontSize:12}}>INV-2026-1501</td><td style={{padding:'10px',fontSize:12}}>₹82,600</td><td style={{padding:'10px',fontSize:12,fontWeight:800,color:'#22C55E'}}>₹1,100 received</td><td colSpan={2} style={{padding:'10px',fontSize:12,fontWeight:800,color:'#EF4444'}}>₹81,500 balance</td></tr>}
                                {prevType==='exp' && <><tr><td style={{padding:'10px',borderBottom:'1px solid #F1F5F9',fontSize:12}}>10 Jun</td><td style={{padding:'10px',borderBottom:'1px solid #F1F5F9',fontSize:12}}>Cloud server (AWS)</td><td colSpan={2} style={{padding:'10px',borderBottom:'1px solid #F1F5F9',fontSize:12}}>Amazon AWS</td><td style={{padding:'10px',borderBottom:'1px solid #F1F5F9',fontWeight:800}}>₹3,500</td></tr><tr><td style={{padding:'10px',fontSize:12}}>12 Jun</td><td style={{padding:'10px',fontSize:12}}>Design assets license</td><td colSpan={2} style={{padding:'10px',fontSize:12}}>Figma</td><td style={{padding:'10px',fontWeight:800}}>₹1,200</td></tr></>}
                              </tbody>
                            </table>
                          </div>
                          {/* Footer */}
                          <div style={{background:'#1a2332',color:'rgba(255,255,255,.85)',padding:'14px 20px'}}>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                              <div><div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'rgba(255,255,255,.5)',marginBottom:4}}>Payment details</div><div style={{fontSize:11,lineHeight:1.7}}>{bankLine}</div></div>
                              <div><div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'rgba(255,255,255,.5)',marginBottom:4}}>Terms & conditions</div><div style={{fontSize:11,lineHeight:1.7}}>{terms}</div></div>
                            </div>
                            <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid rgba(255,255,255,.1)',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:10,color:'rgba(255,255,255,.4)'}}>
                              <span>{footer}</span>
                              <span>{co} · {sig}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Save button */}
                <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
                  <button className="sec-save-btn" onClick={saveDocs} disabled={docsSaving}>
                    {docsSaving ? 'Saving...' : <><i className="ti ti-device-floppy"></i> Save all settings</>}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "bank" && (
              <div className="settings-section">
                <div className="ss-header">
                  <div className="ss-header-icon" style={{ background: "rgba(0,188,212,0.12)", color: "#00BCD4" }}>🏦</div>
                  <div>
                    <div className="ss-title">Payment Terms & Bank Details</div>
                    <div className="ss-sub">Used in invoices and proposals</div>
                  </div>
                </div>
                <div className="ss-body">
                  <div className="form-group">
                    <label className="form-label">PAYMENT DUE</label>
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                      {[{val:"NOW",lbl:"NOW",sub:"Immediate"},{val:"7",lbl:"7",sub:"Net 7 days"},{val:"15",lbl:"15",sub:"Net 15 days"},{val:"30",lbl:"30",sub:"Net 30 days"}].map(opt => (
                        <div key={opt.val} onClick={() => setBank(b => ({ ...b, paymentDue: opt.val }))}
                          style={{ padding:"12px 20px", borderRadius:10, border:`2px solid ${bank.paymentDue===opt.val?"#00BCD4":"#E2E8F0"}`, background: bank.paymentDue===opt.val?"#E0F7FA":"#fff", cursor:"pointer", textAlign:"center", minWidth:80 }}>
                          <div style={{ fontSize:18, fontWeight:900, color: bank.paymentDue===opt.val?"#00BCD4":"#1A2332" }}>{opt.lbl}</div>
                          <div style={{ fontSize:11, color:"#718096", fontWeight:600 }}>{opt.sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <div className="form-group">
                      <label className="form-label">PAYMENT METHOD</label>
                      <select className="form-input" value={bank.paymentMethod} onChange={e => setBank(b => ({ ...b, paymentMethod: e.target.value }))}>
                        {["Bank Transfer / NEFT","UPI","Cash","Cheque","Credit Card","PayPal"].map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">CURRENCY</label>
                      <select className="form-input" value={bank.currency} onChange={e => setBank(b => ({ ...b, currency: e.target.value }))}>
                        <option value="INR">INR - Indian Rupee</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <div className="form-group">
                      <label className="form-label">BANK NAME</label>
                      <input className="form-input" value={bank.bankName} onChange={e => setBank(b => ({ ...b, bankName: e.target.value }))} placeholder="e.g. HDFC Bank" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">ACCOUNT NUMBER</label>
                      <input className="form-input" value={bank.accountNo} onChange={e => setBank(b => ({ ...b, accountNo: e.target.value }))} placeholder="e.g. 5020123456789" />
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <div className="form-group">
                      <label className="form-label">IFSC CODE</label>
                      <input className="form-input" value={bank.ifscCode} onChange={e => setBank(b => ({ ...b, ifscCode: e.target.value }))} placeholder="e.g. HDFC0001234" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">UPI ID</label>
                      <input className="form-input" value={bank.upiId} onChange={e => setBank(b => ({ ...b, upiId: e.target.value }))} placeholder="e.g. yencode@okaxis" />
                    </div>
                  </div>
                  <div style={{ marginTop:24 }}>
                    <button className="sec-save-btn" onClick={saveBank} disabled={bankSaving}>
                      {bankSaving ? "Saving..." : "Save Bank Details"}
                    </button>
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
