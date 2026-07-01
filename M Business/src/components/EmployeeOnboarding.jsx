import React, { useState, useRef } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

/* ------------------------------------------------------------------
  Color system
  - Primary identity: violet (reads var(--app-accent) if your app
    defines it, otherwise falls back to this palette).
  - Each section gets its own accent tint so the form reads as
    organized sections rather than one long block.
------------------------------------------------------------------- */
/* ------------------------------------------------------------------
  Color system — single teal theme, no mixed colors
------------------------------------------------------------------- */
const T = {
  accent: "#0D9488",       // teal
  accent2: "#0D9488",      // same teal → solid button, no gradient mixing
  accentRgb: "13,148,136", // rgb of #0D9488, used for shadows/rings
  text: "#1E1B2E",
  muted: "#6B6478",
  border: "#E2E8F0",
  bg: "#F0FDFA",
  bgSoft: "#CCFBF1",
  bgSoft2: "#99F6E4",
  card: "#ffffff",
  danger: "#DC2626",
  dangerBg: "#FEF2F2",
  success: "#16A34A",
  successBg: "#F0FDF4",
};

/* All sections use the same teal — no more purple/amber/green mix */
const SECTIONS = {
  personal: { fg: "#0D9488", bg: "#CCFBF1", ring: "rgba(13,148,136,0.12)" },
  bank: { fg: "#0D9488", bg: "#CCFBF1", ring: "rgba(13,148,136,0.12)" },
  docs: { fg: "#0D9488", bg: "#CCFBF1", ring: "rgba(13,148,136,0.12)" },
};

export default function EmployeeOnboarding() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    photo: null,
    department: "",
    role: "Employee",
    status: "Pending",
    dateOfBirth: "",
    joiningDate: "",
    maritalStatus: "Unmarried"
  });
  const [docs, setDocs] = useState({
    aadhaar: null,
    pan: null,
    passbook: null
  });
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);
  const fieldRefs = useRef({});
  // Order matches top-to-bottom position in the form
  const FIELD_ORDER = ["name", "email", "phone", "password", "bankName", "ifscCode", "accountNumber"];
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const queryParams = new URLSearchParams(window.location.search);
  const companyName = queryParams.get("company") || "Our Company";

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    if (err[field]) setErr(prev => ({ ...prev, [field]: "" }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange("photo", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (field, file) => {
    setDocs(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.email.trim()) errors.email = "Email is required";
    if (!form.phone.trim()) errors.phone = "Phone is required";
    if (!form.password.trim()) errors.password = "Password is required";
    if (!form.bankName.trim()) errors.bankName = "Bank name is required";
    if (!form.ifscCode.trim()) errors.ifscCode = "IFSC code is required";
    if (!form.accountNumber.trim()) errors.accountNumber = "Account number is required";

    if (Object.keys(errors).length > 0) {
      setErr(errors);

      // Find the first missing field, in the order it appears on the page
      const firstErrorField = FIELD_ORDER.find(f => errors[f]);
      const el = fieldRefs.current[firstErrorField];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Focus after the smooth scroll has had time to land
        setTimeout(() => el.focus(), 350);
      }
      return; // form is not submitted until this block is empty
    }

    try {
      setLoading(true);
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
        department: form.department,
        status: form.status,
        bankDetails: {
          bankName: form.bankName,
          accountNumber: form.accountNumber,
          ifscCode: form.ifscCode
        },
        profilePhoto: form.photo,
        companyId: queryParams.get("companyId") || "",
        dateOfBirth: form.dateOfBirth,
        joiningDate: form.joiningDate,
        maritalStatus: form.maritalStatus,
      };

      await axios.post(`${BASE_URL}/api/employees/add`, payload);

      const uploadDoc = async (type, file) => {
        if (!file) return;
        const fd = new FormData();
        fd.append("file", file);
        fd.append("employeeName", form.name);
        fd.append("docType", type);
        await axios.post(`${BASE_URL}/api/employee-dashboard/documents/upload`, fd);
      };

      await Promise.all([
        uploadDoc("aadhaar", docs.aadhaar),
        uploadDoc("pan", docs.pan),
        uploadDoc("passbook", docs.passbook)
      ]);

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    } catch (err) {
      console.error(err);
      setErr({ submit: err.response?.data?.msg || err.response?.data?.message || "Failed to submit. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: `radial-gradient(circle at 20% 10%, ${T.bgSoft} 0%, ${T.bg} 55%, ${T.bgSoft2} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ maxWidth: 450, width: "100%", background: T.card, padding: 40, borderRadius: 24, boxShadow: `0 24px 60px -20px rgba(${T.accentRgb},0.25)`, textAlign: "center", border: `1px solid ${T.border}` }}>
          <div style={{ width: 80, height: 80, background: T.successBg, color: T.success, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, margin: "0 auto 24px", border: `2px solid #DCFCE7` }}>
            <i className="ti ti-check"></i>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: T.text, marginBottom: 12 }}>Registration Successful!</h2>
          <p style={{ color: T.muted, lineHeight: 1.6, marginBottom: 24 }}>Thank you for joining <strong style={{ color: T.accent }}>{companyName}</strong>. Your details have been submitted for approval. You will receive an email once your account is activated.</p>
          <div style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>Redirecting you to dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(circle at 15% 0%, ${T.bgSoft} 0%, ${T.bg} 45%, ${T.bgSoft2} 100%)`, padding: "40px 20px", display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: 650, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.bgSoft, color: T.accent, fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", padding: "6px 14px", borderRadius: 20, marginBottom: 14, border: `1px solid ${T.border}` }}>
            <i className="ti ti-user-plus"></i> New hire registration
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: T.text, margin: "0 0 8px", letterSpacing: "-0.02em" }}>Employee Onboarding</h1>
          <p style={{ color: T.muted, fontWeight: 500 }}>Welcome to <span style={{ color: T.accent, fontWeight: 700 }}>{companyName}</span>. Please fill in your details to join the team.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: T.card, padding: 32, borderRadius: 24, boxShadow: `0 24px 60px -24px rgba(${T.accentRgb},0.2)`, border: `1px solid ${T.border}` }}>
          {err.submit && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.dangerBg, color: T.danger, padding: "12px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600, marginBottom: 20, border: "1px solid #FECACA" }}>
              <i className="ti ti-alert-circle"></i> {err.submit}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
            <div style={{ position: "relative", width: "100%", maxWidth: 200 }}>
              <div style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 16, background: `linear-gradient(135deg, ${SECTIONS.personal.bg}, ${T.bgSoft2})`, border: `2px dashed ${SECTIONS.personal.fg}55`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxSizing: "border-box" }}>
                {form.photo ? (
                  <img src={form.photo} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
                ) : (
                  <i className="ti ti-user" style={{ fontSize: 44, color: SECTIONS.personal.fg, opacity: 0.5 }}></i>
                )}
              </div>
              <label style={{ position: "absolute", bottom: 8, right: 8, background: `linear-gradient(135deg, ${T.accent}, ${T.accent2})`, width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "3px solid #fff", boxShadow: `0 4px 10px rgba(${T.accentRgb},0.4)` }}>
                <i className="ti ti-camera" style={{ fontSize: 16, color: "#fff" }}></i>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
              </label>
            </div>
          </div>

          <SectionHeader icon="ti-id-badge-2" label="Personal Information" section={SECTIONS.personal} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: 28 }}>
            <Input label="Full Name" value={form.name} onChange={v => handleChange("name", v)} error={err.name} placeholder="John Doe" section={SECTIONS.personal} inputRef={el => (fieldRefs.current.name = el)} />
            <Input label="Email Address" value={form.email} onChange={v => handleChange("email", v)} error={err.email} type="email" placeholder="john@company.com" section={SECTIONS.personal} inputRef={el => (fieldRefs.current.email = el)} />
            <Input label="Phone Number" value={form.phone} onChange={v => handleChange("phone", v)} error={err.phone} placeholder="+91 98765 43210" section={SECTIONS.personal} inputRef={el => (fieldRefs.current.phone = el)} />
            <Input
              label="Date of Birth"
              value={form.dateOfBirth}
              onChange={v => handleChange("dateOfBirth", v)}
              type="date"
              placeholder=""
              section={SECTIONS.personal}
            />
            <Input
              label="Joining Date"
              value={form.joiningDate}
              onChange={v => handleChange("joiningDate", v)}
              type="date"
              placeholder=""
              section={SECTIONS.personal}
            />

            <SelectField
              label="Marital Status"
              value={form.maritalStatus}
              onChange={v => handleChange("maritalStatus", v)}
              options={[["Unmarried", "Unmarried"], ["Married", "Married"]]}
              section={SECTIONS.personal}
            />

            <SelectField
              label="Role"
              value={form.role}
              onChange={v => handleChange("role", v)}
              options={[["Employee", "Employee"], ["Manager", "Manager"], ["Admin", "Admin"]]}
              section={SECTIONS.personal}
            />

            <div style={{ position: "relative" }}>
              <Input label="Password" value={form.password} onChange={v => handleChange("password", v)} error={err.password} type={showPass ? "text" : "password"} placeholder="Set your password" section={SECTIONS.personal} inputRef={el => (fieldRefs.current.password = el)} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: 36, background: "none", border: "none", cursor: "pointer", fontSize: 16, color: T.muted }}>
                <i className={`ti ${showPass ? "ti-eye-off" : "ti-eye"}`}></i>
              </button>
            </div>
          </div>

          <SectionHeader icon="ti-building-bank" label="Bank Account Details" section={SECTIONS.bank} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: 28 }}>
            <Input label="Bank Name" value={form.bankName} onChange={v => handleChange("bankName", v)} error={err.bankName} placeholder="e.g. HDFC Bank" section={SECTIONS.bank} inputRef={el => (fieldRefs.current.bankName = el)} />
            <Input label="IFSC Code" value={form.ifscCode} onChange={v => handleChange("ifscCode", v.toUpperCase())} error={err.ifscCode} placeholder="HDFC0001234" section={SECTIONS.bank} inputRef={el => (fieldRefs.current.ifscCode = el)} />
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="Account Number" value={form.accountNumber} onChange={v => handleChange("accountNumber", v)} error={err.accountNumber} placeholder="123456789012" section={SECTIONS.bank} inputRef={el => (fieldRefs.current.accountNumber = el)} />
            </div>
          </div>

          <SectionHeader icon="ti-files" label="Documents" section={SECTIONS.docs} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
            <DocInput label="Aadhaar Card" icon="ti-id-badge-2" file={docs.aadhaar} onChange={f => handleFileChange("aadhaar", f)} section={SECTIONS.docs} />
            <DocInput label="PAN Card" icon="ti-credit-card" file={docs.pan} onChange={f => handleFileChange("pan", f)} section={SECTIONS.docs} />
            <DocInput label="Bank Passbook" icon="ti-building-bank" file={docs.passbook} onChange={f => handleFileChange("passbook", f)} section={SECTIONS.docs} />
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "60%",
                background: `linear-gradient(135deg, ${T.accent}, ${T.accent2})`,
                color: "#fff",
                border: "none",
                borderRadius: 14,
                padding: "16px",
                fontWeight: 800,
                fontSize: 16,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: `0 12px 28px -8px rgba(${T.accentRgb},0.5)`,
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: 20, height: 20, border: "3px solid rgba(255,255,255,0.3)", borderTop: "3px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <i className="ti ti-send"></i>
                  <span>Complete Registration</span>
                </>
              )}
            </button>
          </div>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: T.muted }}>
          Already have an account? <a href="/" style={{ color: T.accent, fontWeight: 700, textDecoration: "none" }}>Login here</a>
        </p>
      </div>

      <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        `}</style>
    </div>
  );
}

function SectionHeader({ icon, label, section }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: section.bg, color: section.fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
        <i className={`ti ${icon}`}></i>
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, color: section.fg, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function Input({ label, value, onChange, error, type = "text", placeholder, section, inputRef }) {
  const fg = section ? section.fg : T.accent;
  const ring = section ? section.ring : `rgba(${T.accentRgb},0.1)`;
  return (
    <div style={{ marginBottom: 4 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: error ? T.danger : T.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label} *</label>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={e => { e.target.style.borderColor = fg; e.target.style.boxShadow = `0 0 0 3px ${ring}`; e.target.style.background = "#fff"; }}
        onBlur={e => { e.target.style.borderColor = error ? T.danger : T.border; e.target.style.boxShadow = "none"; e.target.style.background = error ? T.dangerBg : T.bg; }}
        style={{
          width: "100%",
          height: 46,
          padding: "0px 14px",
          boxSizing: "border-box", display: "block",
          borderRadius: 12,
          border: `1.5px solid ${error ? T.danger : T.border}`,
          fontSize: 14,
          color: T.text,
          outline: "none",
          transition: "all 0.15s",
          background: error ? T.dangerBg : T.bg
        }}
      />
      {error && <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: T.danger, marginTop: 4, fontWeight: 600 }}><i className="ti ti-alert-circle" style={{ fontSize: 12 }}></i>{error}</div>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, section }) {
  const fg = section ? section.fg : T.accent;
  return (
    <div style={{ marginBottom: 4 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label} *
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%",
          height: 46,
          padding: "0px 14px",
          boxSizing: "border-box",
          borderRadius: 12,
          border: `1.5px solid ${T.border}`,
          fontSize: 14,
          color: T.text,
          outline: "none",
          background: T.bg,
          cursor: "pointer"
        }}
        onFocus={e => { e.target.style.borderColor = fg; }}
        onBlur={e => { e.target.style.borderColor = T.border; }}
      >
        {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
      </select>
    </div>
  );
}

function DocInput({ label, icon, file, onChange, section }) {
  const fg = section ? section.fg : T.accent;
  const bg = section ? section.bg : T.bgSoft;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: T.bg, borderRadius: 12, border: `1.5px solid ${T.border}` }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, border: `1px solid ${fg}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: fg }}>
        <i className={`ti ${icon}`}></i>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{label}</div>
        <div style={{ fontSize: 11, color: file ? fg : T.muted, fontWeight: 600 }}>{file ? file.name : "No file selected"}</div>
      </div>
      <label style={{ background: file ? T.successBg : fg, color: file ? T.success : "#fff", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: file ? `1px solid #BBF7D0` : "none" }}>
        {file ? "Change" : "Upload"}
        <input type="file" style={{ display: "none" }} onChange={e => onChange(e.target.files[0])} />
      </label>
    </div>
  );
}
