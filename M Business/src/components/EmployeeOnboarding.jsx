import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

const T = {
  primary: "var(--app-primary, #0f172a)",
  accent: "var(--app-accent, #00BCD4)",
  accentRgb: "var(--app-accent-rgb, 0,188,212)",
  text: "var(--app-text, #1e293b)",
  muted: "var(--app-muted, #64748b)",
  border: "var(--app-border, #e2e8f0)",
  bg: "var(--app-bg, #f8fafc)",
  bgSoft: "var(--teal-lighter, #F0FDFE)",
  bgSoft2: "var(--teal-light, #E0F7FA)",
  card: "#ffffff"
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
    if (!form.accountNumber.trim()) errors.accountNumber = "Account number is required";
    if (!form.ifscCode.trim()) errors.ifscCode = "IFSC code is required";

    if (Object.keys(errors).length > 0) {
      setErr(errors);
      return;
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
      <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${T.bgSoft} 0%, ${T.bgSoft2} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ maxWidth: 450, width: "100%", background: T.card, padding: 40, borderRadius: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.1)", textAlign: "center" }}>
          <div style={{ width: 80, height: 80, background: "#dcfce7", color: "#22c55e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 24px" }}>
            <i className="ti ti-check"></i>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: T.text, marginBottom: 12 }}>Registration Successful!</h2>
          <p style={{ color: T.muted, lineHeight: 1.6, marginBottom: 24 }}>Thank you for joining <strong>{companyName}</strong>. Your details have been submitted for approval. You will receive an email once your account is activated.</p>
          <div style={{ fontSize: 13, color: T.muted }}>Redirecting you to dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${T.bgSoft} 0%, ${T.bgSoft2} 100%)`, padding: "40px 20px", display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: 650, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: T.text, margin: "0 0 8px" }}>Employee Onboarding</h1>
          <p style={{ color: T.muted, fontWeight: 500 }}>Welcome to <span style={{ color: T.accent, fontWeight: 700 }}>{companyName}</span>. Please fill in your details to join the team.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: T.card, padding: 32, borderRadius: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.08)", border: "1px solid rgba(255,255,255,0.8)" }}>
          {err.submit && <div style={{ background: "#fef2f2", color: "#ef4444", padding: "12px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600, marginBottom: 20, border: "1px solid #fee2e2" }}>Warning {err.submit}</div>}

          <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
            <div style={{ position: "relative", width: "100%", maxWidth: 220 }}>
              <div style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 16, background: T.bg, border: `2px dashed ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxSizing: "border-box" }}>
                {form.photo ? (
                  <img src={form.photo} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
                ) : (
                  <i className="ti ti-user" style={{ fontSize: 44, color: T.border }}></i>
                )}
              </div>
              <label style={{ position: "absolute", bottom: 8, right: 8, background: T.accent, width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "3px solid #fff", boxShadow: `0 4px 10px rgba(${T.accentRgb},0.35)` }}>
                <i className="ti ti-camera" style={{ fontSize: 16, color: "#fff" }}></i>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
              </label>
            </div>
          </div>

          <div style={{ fontSize: 12, fontWeight: 800, color: T.muted, letterSpacing: 1, marginBottom: 16, borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>PERSONAL INFORMATION</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: 24 }}>
            <Input label="Full Name" value={form.name} onChange={v => handleChange("name", v)} error={err.name} placeholder="John Doe" />

            <Input label="Email Address" value={form.email} onChange={v => handleChange("email", v)} error={err.email} type="email" placeholder="john@company.com" />
            <Input label="Phone Number" value={form.phone} onChange={v => handleChange("phone", v)} error={err.phone} placeholder="+91 98765 43210" />
            <Input
              label="Date of Birth"
              value={form.dateOfBirth}
              onChange={v => handleChange("dateOfBirth", v)}
              type="date"
              placeholder=""
            />
            <Input
              label="Joining Date"
              value={form.joiningDate}
              onChange={v => handleChange("joiningDate", v)}
              type="date"
              placeholder=""
            />

            <div style={{ marginBottom: 4 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Marital Status *
              </label>
              <select
                value={form.maritalStatus}
                onChange={e => handleChange("maritalStatus", e.target.value)}
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
              >
                <option value="Unmarried">Unmarried</option>
                <option value="Married">Married</option>
              </select>
            </div>

            <div style={{ marginBottom: 4 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.accent, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Role *
              </label>
              <select
                value={form.role}
                onChange={e => handleChange("role", e.target.value)}
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
              >
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div style={{ position: "relative" }}>
              <Input label="Password" value={form.password} onChange={v => handleChange("password", v)} error={err.password} type={showPass ? "text" : "password"} placeholder="Set your password" />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: 36, background: "none", border: "none", cursor: "pointer", fontSize: 16, color: T.muted }}>
                {showPass ? "hide" : "show"}
              </button>
            </div>
          </div>

          <div style={{ fontSize: 12, fontWeight: 800, color: T.muted, letterSpacing: 1, marginBottom: 16, borderBottom: `1px solid ${T.border}`, paddingBottom: 8, marginTop: 32 }}>BANK ACCOUNT DETAILS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: 32 }}>
            <Input label="Bank Name" value={form.bankName} onChange={v => handleChange("bankName", v)} error={err.bankName} placeholder="e.g. HDFC Bank" />
            <Input label="IFSC Code" value={form.ifscCode} onChange={v => handleChange("ifscCode", v)} error={err.ifscCode} placeholder="HDFC0001234" />
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="Account Number" value={form.accountNumber} onChange={v => handleChange("accountNumber", v)} error={err.accountNumber} placeholder="123456789012" />
            </div>
          </div>

          <div style={{ fontSize: 12, fontWeight: 800, color: T.muted, letterSpacing: 1, marginBottom: 16, borderBottom: `1px solid ${T.border}`, paddingBottom: 8, marginTop: 32 }}>DOCUMENTS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
            <DocInput label="Aadhaar Card" icon="ti-id-badge-2" file={docs.aadhaar} onChange={f => handleFileChange("aadhaar", f)} />
            <DocInput label="PAN Card" icon="ti-credit-card" file={docs.pan} onChange={f => handleFileChange("pan", f)} />
            <DocInput label="Bank Passbook" icon="ti-building-bank" file={docs.passbook} onChange={f => handleFileChange("passbook", f)} />
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "50%",
                background: `linear-gradient(135deg, ${T.accent}, var(--app-accent2, #00ACC1))`,
                color: "#fff",
                border: "none",
                borderRadius: 14,
                padding: "16px",
                fontWeight: 800,
                fontSize: 16,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: `0 10px 25px rgba(${T.accentRgb},0.3)`,
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
                <span>Complete Registration </span>
              )}
            </button></div>
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

function Input({ label, value, onChange, error, type = "text", placeholder }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--app-muted, #475569)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label} *</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          height: 46,
          padding: "0px 14px",
          boxSizing: "border-box", display: "block",
          borderRadius: 12,
          border: `1.5px solid ${error ? "#ef4444" : "var(--app-border, #e2e8f0)"}`,
          fontSize: 14,
          color: "var(--app-text, #1e293b)",
          outline: "none",
          transition: "all 0.2s",
          background: "var(--app-bg, #f8fafc)"
        }}
      />
      {error && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontWeight: 500 }}>Warning {error}</div>}
    </div>
  );
}

function DocInput({ label, icon, file, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "var(--app-bg, #f8fafc)", borderRadius: 12, border: "1.5px solid var(--app-border, #e2e8f0)" }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--teal-light, #E0F7FA)", border: "1px solid var(--teal-light, #b2ebf2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "var(--app-accent, #00BCD4)" }}>
        <i className={`ti ${icon}`}></i>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--app-text, #1e293b)" }}>{label}</div>
        <div style={{ fontSize: 11, color: file ? "var(--app-accent, #00BCD4)" : "var(--app-muted, #94a3b8)", fontWeight: 600 }}>{file ? file.name : ""}</div>
      </div>
      <label style={{ background: file ? "#dcfce7" : "var(--app-accent, #00BCD4)", color: file ? "#166534" : "#fff", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none" }}>
        {file ? "Change" : "Upload"}
        <input type="file" style={{ display: "none" }} onChange={e => onChange(e.target.files[0])} />
      </label>
    </div>
  );
}
