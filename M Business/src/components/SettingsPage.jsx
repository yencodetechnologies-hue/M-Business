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

const CSS = `
.settings-layout{display:grid;grid-template-columns:220px 1fr;gap:22px;align-items:start}
.settings-nav{background:var(--app-card,#fff);border:1.5px solid var(--app-border,#E0EEF0);border-radius:16px;padding:8px;position:sticky;top:22px}
.sn-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;color:var(--app-muted,#607D86);font-size:13px;font-weight:600;transition:all .15s;margin-bottom:2px}
.sn-item:hover{background:var(--app-bg,#F5FAFA);color:var(--app-text,#1A2E35)}
.sn-item.sn-active{background:rgba(var(--app-accent-rgb,0,188,212),.12);color:var(--app-accent, var(--app-accent, var(--app-accent, #00BCD4)))}
.sn-item i{font-size:16px;flex-shrink:0;color:var(--app-muted,#607D86)}
.sn-item.sn-active i,.sn-item:hover i{color:var(--app-accent, var(--app-accent, var(--app-accent, #00BCD4)))}
.sn-divider{border:none;border-top:1px solid var(--app-border,#E0EEF0);margin:6px 0}
.settings-panels{display:flex;flex-direction:column;gap:20px}
.settings-section{background:var(--app-card,#fff);border:1.5px solid var(--app-border,#E0EEF0);border-radius:16px;overflow:hidden}
.ss-header{padding:18px 22px;border-bottom:1px solid var(--app-border,#E0EEF0);display:flex;align-items:center;gap:12px}
.ss-header-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}
.ss-title{font-size:13px;font-weight:800;color:var(--app-text,#1A2E35)}
.ss-sub{font-size:11px;color:var(--app-muted,#607D86);margin-top:2px}
.ss-body{padding:22px}
.form-row-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
.form-group{margin-bottom:16px}
.form-group:last-child{margin-bottom:0}
.form-label{font-size:11px;font-weight:700;color:var(--app-muted,#607D86);text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px;display:block}
.form-input{width:100%;padding:10px 13px;background:var(--app-bg,#F5FAFA);border:1.5px solid var(--app-border,#E0EEF0);border-radius:10px;font-size:13px;color:var(--app-text,#1A2E35);font-family:inherit;outline:none;transition:all .15s;box-sizing:border-box}
.form-input:focus{border-color:var(--app-accent, var(--app-accent, var(--app-accent, #00BCD4)));background:#fff;box-shadow:0 0 0 3px rgba(var(--app-accent-rgb,0,188,212),.08)}
.form-select{width:100%;padding:10px 13px;background:var(--app-bg,#F5FAFA);border:1.5px solid var(--app-border,#E0EEF0);border-radius:10px;font-size:13px;color:var(--app-text,#1A2E35);font-family:inherit;outline:none;cursor:pointer;transition:all .15s;box-sizing:border-box}
.form-select:focus{border-color:var(--app-accent, var(--app-accent, var(--app-accent, #00BCD4)))}
.form-textarea{width:100%;padding:10px 13px;background:var(--app-bg,#F5FAFA);border:1.5px solid var(--app-border,#E0EEF0);border-radius:10px;font-size:13px;color:var(--app-text,#1A2E35);font-family:inherit;outline:none;transition:all .15s;resize:vertical;min-height:80px;box-sizing:border-box}
.form-textarea:focus{border-color:var(--app-accent, var(--app-accent, var(--app-accent, #00BCD4)));background:#fff;box-shadow:0 0 0 3px rgba(var(--app-accent-rgb,0,188,212),.08)}
.form-hint{font-size:10px;color:var(--app-muted,#607D86);margin-top:5px;font-weight:600}
.avatar-upload{display:flex;align-items:center;gap:18px;margin-bottom:22px}
.avatar-big{width:72px;height:72px;border-radius:16px;background:linear-gradient(135deg,var(--app-accent, #00BCD4),#006E7F);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;color:#fff;flex-shrink:0;border:3px solid rgba(var(--app-accent-rgb,0,188,212),.2);position:relative;overflow:hidden}
.avatar-edit{position:absolute;bottom:0;right:0;width:22px;height:22px;border-radius:50%;background:var(--app-accent, var(--app-accent, var(--app-accent, #00BCD4)));border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;cursor:pointer}
.avatar-upload-btn{display:flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(var(--app-accent-rgb,0,188,212),.1);border:1.5px solid var(--app-accent, var(--app-accent, var(--app-accent, #00BCD4)));border-radius:9px;font-size:12px;font-weight:700;color:var(--app-accent, var(--app-accent, var(--app-accent, #00BCD4)));cursor:pointer;font-family:inherit;transition:all .15s}
.avatar-upload-btn:hover{background:var(--app-accent, var(--app-accent, var(--app-accent, #00BCD4)));color:#fff}
.avatar-remove{font-size:11px;color:var(--app-muted,#607D86);cursor:pointer;font-weight:600}
.avatar-remove:hover{color:#EF4444}
.logo-upload-area{border:2px dashed var(--app-border,#E0EEF0);border-radius:12px;padding:20px;text-align:center;cursor:pointer;transition:all .15s;margin-bottom:16px}
.logo-upload-area:hover{border-color:var(--app-accent, var(--app-accent, var(--app-accent, #00BCD4)));background:rgba(var(--app-accent-rgb,0,188,212),.04)}
.toggle-row{display:flex;align-items:center;justify-content:space-between;padding:13px 0;border-bottom:1px solid var(--app-border,#E0EEF0)}
.toggle-row:last-child{border-bottom:none;padding-bottom:0}
.toggle-label{font-size:13px;font-weight:700;color:var(--app-text,#1A2E35)}
.toggle-desc{font-size:11px;color:var(--app-muted,#607D86);margin-top:2px}
.toggle{width:42px;height:24px;border-radius:12px;position:relative;cursor:pointer;flex-shrink:0;transition:background .2s}
.toggle.t-on{background:var(--app-accent, var(--app-accent, var(--app-accent, #00BCD4)))}
.toggle.t-off{background:var(--app-border,#C5DDE0)}
.toggle::after{content:'';position:absolute;width:18px;height:18px;border-radius:50%;background:#fff;top:3px;transition:all .2s;box-shadow:0 1px 4px rgba(0,0,0,.15)}
.toggle.t-on::after{right:3px}
.toggle.t-off::after{left:3px}
.color-picker-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px}
.color-swatch{width:32px;height:32px;border-radius:8px;cursor:pointer;transition:all .15s;border:2px solid transparent;position:relative;flex-shrink:0}
.color-swatch.sw-selected{border-color:#fff;box-shadow:0 0 0 2px #333;transform:scale(1.15)}
.color-swatch.sw-selected::after{content:'✓';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:14px;font-weight:800}
.color-swatch:hover{transform:scale(1.1)}
.section-save{display:flex;justify-content:flex-end;margin-top:18px;padding-top:16px;border-top:1px solid var(--app-border,#E0EEF0)}
.sec-save-btn{display:flex;align-items:center;gap:6px;padding:10px 22px;background:var(--app-accent, var(--app-accent, var(--app-accent, #00BCD4)));color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:background .15s;box-shadow:0 3px 10px rgba(var(--app-accent-rgb,0,188,212),.25)}
.sec-save-btn:hover{opacity:.9}
.sec-save-btn:disabled{opacity:.6;cursor:not-allowed}
.sec-cancel-btn{display:flex;align-items:center;gap:6px;padding:10px 18px;background:none;color:var(--app-muted,#607D86);border:1.5px solid var(--app-border,#E0EEF0);border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-right:8px;transition:all .15s}
.sec-cancel-btn:hover{border-color:var(--app-muted);color:var(--app-text)}
.security-item{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--app-border,#E0EEF0)}
.security-item:last-child{border-bottom:none;padding-bottom:0}
.sec-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.sec-action{margin-left:auto;display:flex;align-items:center;gap:8px}
.sec-status{font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px}
.sec-status-on{background:#dcfce7;color:#16a34a}
.sec-status-off{background:var(--app-bg);color:var(--app-muted);border:1px solid var(--app-border)}
.sec-btn{padding:7px 14px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;border:1.5px solid var(--app-border);background:none;color:var(--app-muted);transition:all .15s}
.sec-btn:hover{border-color:var(--app-accent);color:var(--app-accent)}
.notif-grid{display:grid;grid-template-columns:1fr 80px 80px;align-items:center;padding:13px 0;border-bottom:1px solid var(--app-border)}
.notif-grid:last-child{border-bottom:none}
.danger-zone{background:#fef2f2;border:1.5px solid rgba(240,92,92,.2);border-radius:16px;padding:20px}
.dz-title{font-size:13px;font-weight:800;color:#EF4444;margin-bottom:4px;display:flex;align-items:center;gap:6px}
.dz-sub{font-size:12px;color:var(--app-muted);margin-bottom:16px;line-height:1.5}
.dz-actions{display:flex;gap:10px;flex-wrap:wrap}
.dz-btn{display:flex;align-items:center;gap:6px;padding:9px 16px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;border:1.5px solid rgba(240,92,92,.3);background:none;color:#EF4444;transition:all .15s}
.dz-btn:hover{background:#EF4444;color:#fff;border-color:#EF4444}
.settings-toast{position:fixed;bottom:24px;right:24px;z-index:9999;padding:14px 20px;border-radius:12px;font-size:13px;font-weight:700;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.2);animation:fadeInUp .3s ease}
@keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:768px){.settings-layout{grid-template-columns:1fr}.settings-nav{position:static}.form-row-2{grid-template-columns:1fr}}
`;

const NAV_ITEMS = [
  { key: 'profile', icon: 'ti-user-circle', label: 'Profile' },
  { key: 'company', icon: 'ti-building', label: 'Company' },
  { key: 'notifications', icon: 'ti-bell', label: 'Notifications' },
  { key: 'security', icon: 'ti-shield-lock', label: 'Security' },
  { key: 'appearance', icon: 'ti-palette', label: 'Appearance' },
  { divider: true },
  { key: 'invoicing', icon: 'ti-file-invoice', label: 'Invoicing' },
  { key: 'bank', icon: 'ti-credit-card', label: 'Bank & Payments' },
  { divider: true },
  { key: 'danger', icon: 'ti-trash', label: 'Danger Zone', danger: true },
];

function Toggle({ on, onChange }) {
  return (
    <div className={`toggle ${on ? 't-on' : 't-off'}`} onClick={() => onChange(!on)} />
  );
}

export default function SettingsPage({ user, appTheme, setAppTheme, themes, customColor, setCustomColor, onLogoChange, triggerCrop, onProfileUpdate, THEME }) {
  const [activeSection, setActiveSection] = useState('profile');
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  // Profile state
  const [profile, setProfile] = useState({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
    role: user?.role || '', companyName: user?.companyName || '', bio: ''
  });
  const [avatarUrl, setAvatarUrl] = useState(user?.logoUrl || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // Company state
  const [company, setCompany] = useState({
    companyName: user?.companyName || '', displayName: '', email: user?.email || '',
    phone: user?.phone || '', gst: '', pan: '', address: '', industry: 'Information Technology', type: 'Freelance / Agency'
  });
  const [companySaving, setCompanySaving] = useState(false);

  // Notifications state
  const [notifs, setNotifs] = useState({
    invoicePaidEmail: true, invoicePaidApp: true,
    invoiceOverdueEmail: true, invoiceOverdueApp: true,
    projectEmail: false, projectApp: true,
    proposalEmail: true, proposalApp: true,
    subscriptionEmail: true, subscriptionApp: true,
  });

  // Security state
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [securitySaving, setSecuritySaving] = useState(false);

  // Invoicing state
  const [invoicing, setInvoicing] = useState({
    prefix: 'INV-2026-', dueDays: '15', currency: 'INR', taxRate: '18',
    notes: 'Thank you for your business! Please make payment within the due date.',
    autoSend: false, gstBreakdown: true
  });
  const [invoiceSaving, setInvoiceSaving] = useState(false);

  // Bank state
  const [bank, setBank] = useState({ bankName: '', accountNo: '', ifscCode: '', upiId: '' });
  const [bankSaving, setBankSaving] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const id = 'settings-style';
    if (!document.getElementById(id)) {
      const tag = document.createElement('style');
      tag.id = id;
      tag.textContent = CSS;
      document.head.appendChild(tag);
    }
  }, []);

  // Load config on mount
  useEffect(() => {
    const companyId = user?.companyId || user?._id || user?.id;
    if (!companyId) return;
    axios.get(`${BASE_URL}/api/config/${companyId}`).then(res => {
      if (res.data) {
        const d = res.data;
        setCompany(c => ({ ...c, gst: d.gstNumber || '', pan: d.panNumber || '', address: d.address || '' }));
        setInvoicing(i => ({ ...i, prefix: d.invoicePrefix || i.prefix, dueDays: d.defaultDueDays || i.dueDays, currency: d.currency || i.currency, taxRate: d.taxRate || i.taxRate, notes: d.invoiceNotes || i.notes }));
        setBank({ bankName: d.bankName || '', accountNo: d.accountNumber || '', ifscCode: d.ifscCode || '', upiId: d.upiId || '' });
      }
    }).catch(() => { });
  }, [user]);

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      const companyId = user?.companyId || user?._id || user?.id;
      await axios.put(`${BASE_URL}/api/subadmins/${companyId}`, { name: profile.name, phone: profile.phone, companyName: profile.companyName });
      if (onProfileUpdate) onProfileUpdate({ ...user, name: profile.name, phone: profile.phone, companyName: profile.companyName });
      showToast('Profile saved successfully!');
    } catch { showToast('Failed to save profile', 'error'); }
    finally { setProfileSaving(false); }
  };

  const saveCompany = async () => {
    setCompanySaving(true);
    try {
      const companyId = user?.companyId || user?._id || user?.id;
      await axios.post(`${BASE_URL}/api/config/${companyId}`, { gstNumber: company.gst, panNumber: company.pan, address: company.address });
      showToast('Company info saved!');
    } catch { showToast('Failed to save company info', 'error'); }
    finally { setCompanySaving(false); }
  };

  const savePassword = async () => {
    if (!passwords.new || passwords.new.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    if (passwords.new !== passwords.confirm) { showToast('Passwords do not match', 'error'); return; }
    setSecuritySaving(true);
    try {
      const userId = user?._id || user?.id;
      await axios.post(`${BASE_URL}/api/auth/change-password`, { userId, oldPassword: passwords.current, newPassword: passwords.new });
      setPasswords({ current: '', new: '', confirm: '' });
      showToast('Password updated successfully!');
    } catch (e) { showToast(e.response?.data?.msg || 'Failed to update password', 'error'); }
    finally { setSecuritySaving(false); }
  };

  const saveInvoicing = async () => {
    setInvoiceSaving(true);
    try {
      const companyId = user?.companyId || user?._id || user?.id;
      await axios.post(`${BASE_URL}/api/config/${companyId}`, { invoicePrefix: invoicing.prefix, defaultDueDays: invoicing.dueDays, currency: invoicing.currency, taxRate: invoicing.taxRate, invoiceNotes: invoicing.notes });
      showToast('Invoicing defaults saved!');
    } catch { showToast('Failed to save invoicing defaults', 'error'); }
    finally { setInvoiceSaving(false); }
  };

  const saveBank = async () => {
    setBankSaving(true);
    try {
      const companyId = user?.companyId || user?._id || user?.id;
      await axios.post(`${BASE_URL}/api/config/${companyId}`, { bankName: bank.bankName, accountNumber: bank.accountNo, ifscCode: bank.ifscCode, upiId: bank.upiId });
      showToast('Bank details saved!');
    } catch { showToast('Failed to save bank details', 'error'); }
    finally { setBankSaving(false); }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (triggerCrop) {
      triggerCrop(e, (img) => { setAvatarUrl(img); if (onLogoChange) onLogoChange(img); });
    } else {
      const reader = new FileReader();
      reader.onload = r => { setAvatarUrl(r.target.result); if (onLogoChange) onLogoChange(r.target.result); };
      reader.readAsDataURL(file);
    }
  };

  const accent = `var(--app-accent,  var(--app-accent, var(--app-accent, #00BCD4)))`;
  const accentLight = `rgba(var(--app-accent-rgb,0,188,212),.1)`;

  return (
    <div style={{ fontFamily: 'var(--font, Nunito, sans-serif)', paddingBottom: 40 }}>

      {/* Toast */}
      {toast && (
        <div className="settings-toast" style={{ background: toast.type === 'error' ? '#EF4444' : accent }}>
          {toast.type === 'error' ? '⚠ ' : '✓ '}{toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--app-text, #1A2E35)' }}>Settings</div>
        <div style={{ fontSize: 12, color: 'var(--app-muted, #607D86)', marginTop: 3 }}>Manage your account, company and preferences</div>
      </div>

      <div className="settings-layout">

        {/* LEFT NAV */}
        <div className="settings-nav">
          {NAV_ITEMS.map((item, i) => {
            if (item.divider) return <hr key={i} className="sn-divider" />;
            return (
              <div
                key={item.key}
                className={`sn-item ${activeSection === item.key ? 'sn-active' : ''}`}
                style={item.danger ? { color: '#EF4444' } : {}}
                onClick={() => setActiveSection(item.key)}
              >
                <i className={`ti ${item.icon}`} style={item.danger ? { color: '#EF4444' } : {}} />
                {item.label}
              </div>
            );
          })}
        </div>

        {/* RIGHT PANELS */}
        <div className="settings-panels">

          {/* PROFILE */}
          {activeSection === 'profile' && (
            <div className="settings-section">
              <div className="ss-header">
                <div className="ss-header-icon" style={{ background: accentLight, color: accent }}><i className="ti ti-user-circle" /></div>
                <div><div className="ss-title">Profile Information</div><div className="ss-sub">Update your personal details and profile picture</div></div>
              </div>
              <div className="ss-body">
                <div className="avatar-upload">
                  <div className="avatar-big">
                    {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} /> : (profile.name?.[0] || user?.name?.[0] || 'U').toUpperCase()}
                    <div className="avatar-edit" onClick={() => fileInputRef.current?.click()}><i className="ti ti-camera" /></div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="avatar-upload-btn" onClick={() => fileInputRef.current?.click()}><i className="ti ti-upload" style={{ fontSize: 13 }} /> Upload Photo</button>
                    {avatarUrl && <span className="avatar-remove" onClick={() => { setAvatarUrl(''); if (onLogoChange) onLogoChange(''); }}>Remove photo</span>}
                    <span style={{ fontSize: 10, color: 'var(--app-muted)', fontWeight: 600 }}>JPG or PNG. Max 2MB.</span>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                </div>
                <div className="form-row-2">
                  <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" /></div>
                  <div className="form-group"><label className="form-label">Phone Number</label><input className="form-input" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" /></div>
                </div>
                <div className="form-row-2">
                  <div className="form-group"><label className="form-label">Email Address</label><input className="form-input" value={profile.email} disabled style={{ opacity: 0.6 }} /></div>
                  <div className="form-group"><label className="form-label">Company Name</label><input className="form-input" value={profile.companyName} onChange={e => setProfile(p => ({ ...p, companyName: e.target.value }))} placeholder="Your company name" /></div>
                </div>
                <div className="form-group"><label className="form-label">Bio</label><textarea className="form-textarea" value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} placeholder="Tell us a bit about yourself…" /></div>
                <div className="section-save">
                  <button className="sec-cancel-btn" onClick={() => setProfile({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', role: user?.role || '', companyName: user?.companyName || '', bio: '' })}>Cancel</button>
                  <button className="sec-save-btn" onClick={saveProfile} disabled={profileSaving}><i className="ti ti-device-floppy" style={{ fontSize: 14 }} /> {profileSaving ? 'Saving...' : 'Save Profile'}</button>
                </div>
              </div>
            </div>
          )}

          {/* COMPANY */}
          {activeSection === 'company' && (
            <div className="settings-section">
              <div className="ss-header">
                <div className="ss-header-icon" style={{ background: '#eff4ff', color: '#2563EB' }}><i className="ti ti-building" /></div>
                <div><div className="ss-title">Company Information</div><div className="ss-sub">Your company details used in invoices and documents</div></div>
              </div>
              <div className="ss-body">
                <div className="logo-upload-area" onClick={() => fileInputRef.current?.click()}>
                  <div style={{ fontSize: 28, color: 'var(--app-muted)', marginBottom: 6 }}><i className="ti ti-photo" /></div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--app-text)' }}>Upload Company Logo</div>
                  <div style={{ fontSize: 10, color: 'var(--app-muted)', marginTop: 2 }}>SVG, PNG or JPG · Max 2MB · Recommended 200×80px</div>
                </div>
                <div className="form-row-2">
                  <div className="form-group"><label className="form-label">Company Name</label><input className="form-input" value={company.companyName} onChange={e => setCompany(c => ({ ...c, companyName: e.target.value }))} placeholder="Your company name" /></div>
                  <div className="form-group"><label className="form-label">Official Email</label><input className="form-input" value={company.email} onChange={e => setCompany(c => ({ ...c, email: e.target.value }))} placeholder="company@email.com" /></div>
                </div>
                <div className="form-row-2">
                  <div className="form-group"><label className="form-label">GST Number</label><input className="form-input" value={company.gst} onChange={e => setCompany(c => ({ ...c, gst: e.target.value }))} placeholder="22AAAAA0000A1Z5" /></div>
                  <div className="form-group"><label className="form-label">PAN Number</label><input className="form-input" value={company.pan} onChange={e => setCompany(c => ({ ...c, pan: e.target.value }))} placeholder="AAAAA0000A" /></div>
                </div>
                <div className="form-group"><label className="form-label">Business Address</label><textarea className="form-textarea" value={company.address} onChange={e => setCompany(c => ({ ...c, address: e.target.value }))} placeholder="Enter full business address…" /></div>
                <div className="form-row-2">
                  <div className="form-group"><label className="form-label">Industry</label>
                    <select className="form-select" value={company.industry} onChange={e => setCompany(c => ({ ...c, industry: e.target.value }))}>
                      {['Information Technology', 'Design & Creative', 'Finance', 'Healthcare', 'Other'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Business Type</label>
                    <select className="form-select" value={company.type} onChange={e => setCompany(c => ({ ...c, type: e.target.value }))}>
                      {['Freelance / Agency', 'Private Limited', 'Partnership', 'Sole Proprietorship'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div className="section-save">
                  <button className="sec-cancel-btn">Cancel</button>
                  <button className="sec-save-btn" onClick={saveCompany} disabled={companySaving}><i className="ti ti-device-floppy" style={{ fontSize: 14 }} /> {companySaving ? 'Saving...' : 'Save Company'}</button>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <div className="settings-section">
              <div className="ss-header">
                <div className="ss-header-icon" style={{ background: '#fef5e6', color: '#F5A623' }}><i className="ti ti-bell" /></div>
                <div><div className="ss-title">Notification Preferences</div><div className="ss-sub">Choose how and when you want to be notified</div></div>
              </div>
              <div className="ss-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: 0, marginBottom: 10 }}>
                  <div />
                  <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--app-muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Email</div>
                  <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--app-muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>In-App</div>
                </div>
                {[
                  { label: 'Invoice Paid', desc: 'When a client pays an invoice', icon: 'ti-receipt-2', color: '#dcfce7', iconColor: '#16a34a', emailKey: 'invoicePaidEmail', appKey: 'invoicePaidApp' },
                  { label: 'Invoice Overdue', desc: 'When a payment is past due date', icon: 'ti-alert-circle', color: '#fee2e2', iconColor: '#EF4444', emailKey: 'invoiceOverdueEmail', appKey: 'invoiceOverdueApp' },
                  { label: 'Project Updates', desc: 'Status changes and milestones', icon: 'ti-briefcase', color: '#eff4ff', iconColor: '#2563EB', emailKey: 'projectEmail', appKey: 'projectApp' },
                  { label: 'Proposal Activity', desc: 'Views, accepts and rejections', icon: 'ti-presentation', color: '#eee9ff', iconColor: '#7C5CFC', emailKey: 'proposalEmail', appKey: 'proposalApp' },
                  { label: 'Subscription Alerts', desc: 'Renewals, limits and upgrades', icon: 'ti-rocket', color: '#fef5e6', iconColor: '#F5A623', emailKey: 'subscriptionEmail', appKey: 'subscriptionApp' },
                ].map(n => (
                  <div key={n.label} className="notif-grid">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: n.color, color: n.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}><i className={`ti ${n.icon}`} /></div>
                      <div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--app-text)' }}>{n.label}</div><div style={{ fontSize: 11, color: 'var(--app-muted)' }}>{n.desc}</div></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}><Toggle on={notifs[n.emailKey]} onChange={v => setNotifs(p => ({ ...p, [n.emailKey]: v }))} /></div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}><Toggle on={notifs[n.appKey]} onChange={v => setNotifs(p => ({ ...p, [n.appKey]: v }))} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeSection === 'security' && (
            <div className="settings-section">
              <div className="ss-header">
                <div className="ss-header-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><i className="ti ti-shield-lock" /></div>
                <div><div className="ss-title">Security</div><div className="ss-sub">Manage your password, 2FA and active sessions</div></div>
              </div>
              <div className="ss-body">
                <div className="security-item">
                  <div className="sec-icon" style={{ background: accentLight, color: accent }}><i className="ti ti-lock" /></div>
                  <div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--app-text)' }}>Change Password</div><div style={{ fontSize: 11, color: 'var(--app-muted)' }}>Update your account password</div></div>
                </div>
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
                  <div className="form-group"><label className="form-label">Current Password</label><input className="form-input" type="password" value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} placeholder="••••••••" /></div>
                  <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" value={passwords.new} onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))} placeholder="Min 6 characters" /><div className="form-hint">Must be at least 6 characters.</div></div>
                  <div className="form-group"><label className="form-label">Confirm New Password</label><input className="form-input" type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat password" /></div>
                </div>
                <div className="security-item" style={{ marginTop: 16 }}>
                  <div className="sec-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><i className="ti ti-shield-check" /></div>
                  <div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--app-text)' }}>Two-Factor Authentication</div><div style={{ fontSize: 11, color: 'var(--app-muted)' }}>Add an extra layer of security</div></div>
                  <div className="sec-action"><span className="sec-status sec-status-off">Disabled</span><button className="sec-btn">Enable 2FA</button></div>
                </div>
                <div className="security-item">
                  <div className="sec-icon" style={{ background: '#eff4ff', color: '#2563EB' }}><i className="ti ti-device-laptop" /></div>
                  <div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--app-text)' }}>Active Sessions</div><div style={{ fontSize: 11, color: 'var(--app-muted)' }}>Manage your active login sessions</div></div>
                  <div className="sec-action"><span className="sec-status sec-status-on">1 Active</span><button className="sec-btn">Manage</button></div>
                </div>
                <div className="section-save">
                  <button className="sec-cancel-btn" onClick={() => setPasswords({ current: '', new: '', confirm: '' })}>Cancel</button>
                  <button className="sec-save-btn" onClick={savePassword} disabled={securitySaving}><i className="ti ti-lock" style={{ fontSize: 14 }} /> {securitySaving ? 'Updating...' : 'Update Password'}</button>
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE */}
          {activeSection === 'appearance' && (
            <div className="settings-section">
              <div className="ss-header">
                <div className="ss-header-icon" style={{ background: '#eee9ff', color: '#7C5CFC' }}><i className="ti ti-palette" /></div>
                <div><div className="ss-title">Appearance</div><div className="ss-sub">Customise the look and feel of your dashboard</div></div>
              </div>
              <div className="ss-body">
                <div className="form-group">
                  <label className="form-label">Accent Color</label>
                  <div className="color-picker-row">
                    {themes && Object.entries(themes).map(([key, t]) => (
                      <div
                        key={key}
                        className={`color-swatch ${appTheme === key ? 'sw-selected' : ''}`}
                        style={{ background: t.accent }}
                        title={t.label}
                        onClick={() => setAppTheme(key)}
                      />
                    ))}
                    <div style={{ position: 'relative' }}>
                      <div
                        className={`color-swatch ${appTheme === 'custom' ? 'sw-selected' : ''}`}
                        style={{ background: customColor || '#888', border: '2px dashed #999' }}
                        title="Custom color"
                        onClick={() => document.getElementById('customColorPicker')?.click()}
                      />
                      <input id="customColorPicker" type="color" value={customColor || ' var(--app-accent, var(--app-accent, #00BCD4))'} onChange={e => { setCustomColor(e.target.value); setAppTheme('custom'); }} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                    </div>
                  </div>
                  <div className="form-hint">Current: {themes?.[appTheme]?.label || 'Custom'} ({appTheme === 'custom' ? customColor : themes?.[appTheme]?.accent})</div>
                </div>
                <div className="form-group" style={{ marginTop: 8 }}>
                  <label className="form-label">Theme Mode</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 6 }}>
                    {[{ icon: 'ti-sun', label: 'Light' }, { icon: 'ti-moon', label: 'Dark' }, { icon: 'ti-device-desktop', label: 'System' }].map((m, i) => (
                      <div key={m.label} style={{ padding: 12, background: 'var(--app-bg)', border: i === 0 ? `2px solid ${accent}` : '1.5px solid var(--app-border)', borderRadius: 10, cursor: 'pointer', textAlign: 'center' }}>
                        <i className={`ti ${m.icon}`} style={{ fontSize: 20, color: i === 0 ? accent : 'var(--app-muted)', display: 'block', marginBottom: 5 }} />
                        <div style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? accent : 'var(--app-muted)' }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="toggle-row" style={{ marginTop: 8 }}>
                  <div><div className="toggle-label">Compact Sidebar</div><div className="toggle-desc">Show only icons in the sidebar to save space</div></div>
                  <Toggle on={false} onChange={() => { }} />
                </div>
                <div className="toggle-row">
                  <div><div className="toggle-label">Animations</div><div className="toggle-desc">Enable smooth transitions and hover effects</div></div>
                  <Toggle on={true} onChange={() => { }} />
                </div>
                <div className="section-save">
                  <button className="sec-cancel-btn" onClick={() => setAppTheme('teal')}>Reset to Default</button>
                  <button className="sec-save-btn"><i className="ti ti-device-floppy" style={{ fontSize: 14 }} /> Save Appearance</button>
                </div>
              </div>
            </div>
          )}

          {/* INVOICING */}
          {activeSection === 'invoicing' && (
            <div className="settings-section">
              <div className="ss-header">
                <div className="ss-header-icon" style={{ background: accentLight, color: accent }}><i className="ti ti-file-invoice" /></div>
                <div><div className="ss-title">Invoicing Defaults</div><div className="ss-sub">Set default values used when creating new invoices</div></div>
              </div>
              <div className="ss-body">
                <div className="form-row-2">
                  <div className="form-group"><label className="form-label">Invoice Prefix</label><input className="form-input" value={invoicing.prefix} onChange={e => setInvoicing(i => ({ ...i, prefix: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Default Due Days</label><input className="form-input" type="number" value={invoicing.dueDays} onChange={e => setInvoicing(i => ({ ...i, dueDays: e.target.value }))} /><div className="form-hint">Days after invoice date</div></div>
                </div>
                <div className="form-row-2">
                  <div className="form-group"><label className="form-label">Default Currency</label>
                    <select className="form-select" value={invoicing.currency} onChange={e => setInvoicing(i => ({ ...i, currency: e.target.value }))}>
                      <option value="INR">₹ INR – Indian Rupee</option>
                      <option value="USD">$ USD – US Dollar</option>
                      <option value="EUR">€ EUR – Euro</option>
                      <option value="GBP">£ GBP – British Pound</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Tax Rate (%)</label><input className="form-input" value={invoicing.taxRate} onChange={e => setInvoicing(i => ({ ...i, taxRate: e.target.value }))} placeholder="e.g. 18 for GST" /></div>
                </div>
                <div className="form-group"><label className="form-label">Invoice Notes (default)</label><textarea className="form-textarea" value={invoicing.notes} onChange={e => setInvoicing(i => ({ ...i, notes: e.target.value }))} /></div>
                <div className="toggle-row">
                  <div><div className="toggle-label">Auto-send Invoice on Creation</div><div className="toggle-desc">Automatically email the invoice to the client</div></div>
                  <Toggle on={invoicing.autoSend} onChange={v => setInvoicing(i => ({ ...i, autoSend: v }))} />
                </div>
                <div className="toggle-row">
                  <div><div className="toggle-label">Include GST Breakdown</div><div className="toggle-desc">Show CGST/SGST split in invoice</div></div>
                  <Toggle on={invoicing.gstBreakdown} onChange={v => setInvoicing(i => ({ ...i, gstBreakdown: v }))} />
                </div>
                <div className="section-save">
                  <button className="sec-cancel-btn">Cancel</button>
                  <button className="sec-save-btn" onClick={saveInvoicing} disabled={invoiceSaving}><i className="ti ti-device-floppy" style={{ fontSize: 14 }} /> {invoiceSaving ? 'Saving...' : 'Save Defaults'}</button>
                </div>
              </div>
            </div>
          )}

          {/* BANK */}
          {activeSection === 'bank' && (
            <div className="settings-section">
              <div className="ss-header">
                <div className="ss-header-icon" style={{ background: accentLight, color: accent }}><i className="ti ti-credit-card" /></div>
                <div><div className="ss-title">Bank & Payment Details</div><div className="ss-sub">Bank details shown on invoices and receipts</div></div>
              </div>
              <div className="ss-body">
                <div className="form-row-2">
                  <div className="form-group"><label className="form-label">Bank Name</label><input className="form-input" value={bank.bankName} onChange={e => setBank(b => ({ ...b, bankName: e.target.value }))} placeholder="e.g. HDFC Bank" /></div>
                  <div className="form-group"><label className="form-label">Account Number</label><input className="form-input" value={bank.accountNo} onChange={e => setBank(b => ({ ...b, accountNo: e.target.value }))} placeholder="e.g. 5020123456789" /></div>
                </div>
                <div className="form-row-2">
                  <div className="form-group"><label className="form-label">IFSC Code</label><input className="form-input" value={bank.ifscCode} onChange={e => setBank(b => ({ ...b, ifscCode: e.target.value }))} placeholder="e.g. HDFC0001234" /></div>
                  <div className="form-group"><label className="form-label">UPI ID</label><input className="form-input" value={bank.upiId} onChange={e => setBank(b => ({ ...b, upiId: e.target.value }))} placeholder="e.g. name@okaxis" /></div>
                </div>
                <div className="section-save">
                  <button className="sec-cancel-btn">Cancel</button>
                  <button className="sec-save-btn" onClick={saveBank} disabled={bankSaving}><i className="ti ti-device-floppy" style={{ fontSize: 14 }} /> {bankSaving ? 'Saving...' : 'Save Bank Details'}</button>
                </div>
              </div>
            </div>
          )}

          {/* DANGER ZONE */}
          {activeSection === 'danger' && (
            <div className="danger-zone">
              <div className="dz-title"><i className="ti ti-alert-triangle" /> Danger Zone</div>
              <div className="dz-sub">These actions are irreversible. Please proceed with caution. All data will be permanently deleted and cannot be recovered.</div>
              <div className="dz-actions">
                <button className="dz-btn"><i className="ti ti-download" style={{ fontSize: 13 }} /> Export All Data</button>
                <button className="dz-btn" onClick={() => { if (window.confirm('Delete all projects? This cannot be undone.')) showToast('Projects deleted', 'error'); }}><i className="ti ti-trash" style={{ fontSize: 13 }} /> Delete All Projects</button>
                <button className="dz-btn" onClick={() => { if (window.confirm('Delete your account? This cannot be undone.')) { } }}><i className="ti ti-user-x" style={{ fontSize: 13 }} /> Delete Account</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
