// InterviewApplyForm.jsx
// Route: /interview-apply/:companySlug

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { createPortal } from "react-dom";
import { BASE_URL as API_URL } from "../config";

const ROLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Mobile Developer", "DevOps Engineer", "Data Engineer", "Data Scientist", "ML Engineer",
  "UI/UX Designer", "Product Manager", "Business Analyst", "QA Engineer", "Test Engineer",
  "System Administrator", "Network Engineer", "Cloud Architect", "Cybersecurity Analyst",
  "HR Executive", "Recruiter", "Sales Executive", "Marketing Manager", "Content Writer",
  "Graphic Designer", "Finance Analyst", "Operations Manager", "Customer Support",
  "Project Manager", "Scrum Master", "Technical Lead", "Engineering Manager",
  "React Developer", "Node.js Developer", "Python Developer", "Java Developer",
  "Android Developer", "iOS Developer", "Flutter Developer", "Database Administrator",
];

function RoleDropdown({ role, setRole, error, setErrors }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const searchRef = useRef(null);

  const filtered = search.trim() === ""
    ? ROLES
    : ROLES.filter(r => r.toLowerCase().includes(search.toLowerCase()));

  const calcPos = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width });
    }
  };

  const handleOpen = () => { calcPos(); setSearch(""); setOpen(true); setTimeout(() => searchRef.current?.focus(), 50); };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        const portal = document.getElementById("role-dropdown-portal");
        if (portal && portal.contains(e.target)) return;
        setOpen(false); setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (r) => { setRole(r); setSearch(""); setOpen(false); setErrors(er => ({ ...er, role: "" })); };

  const dropdownEl = open ? createPortal(
    <div id="role-dropdown-portal" style={{
      position: "absolute", top: pos.top, left: pos.left, width: pos.width,
      background: "#fff", border: "1.5px solid #1a3a5c",
      borderRadius: 4, zIndex: 999999,
      boxShadow: "0 8px 32px rgba(15,39,68,0.18)", overflow: "hidden",
    }}>
      <div style={{ padding: "8px 10px", borderBottom: "1px solid #e8ecf0", background: "#f8fafc" }}>
        <input
          ref={searchRef} type="text" placeholder="Search role..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "8px 12px",
            border: "1.5px solid #d5d9e0", borderRadius: 4,
            fontSize: 13, background: "#fff",
            fontFamily: "'IBM Plex Sans',sans-serif", color: "#0f1c2e",
            outline: "none", boxSizing: "border-box",
          }}
        />
      </div>
      <div style={{ maxHeight: 200, overflowY: "auto" }}>
        {filtered.length ? filtered.map(r => (
          <div key={r} onMouseDown={(e) => { e.preventDefault(); handleSelect(r); }}
            style={{
              padding: "10px 16px", fontSize: 13, cursor: "pointer",
              borderBottom: "1px solid #f0f2f5",
              background: role === r ? "#f0f4fa" : "#fff",
              color: role === r ? "#1a3a5c" : "#0f1c2e",
              fontWeight: role === r ? 600 : 400,
              fontFamily: "'IBM Plex Sans',sans-serif",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
            onMouseLeave={e => e.currentTarget.style.background = role === r ? "#f0f4fa" : "#fff"}
          >{r}</div>
        )) : (
          <div style={{ padding: "14px 16px", color: "#8a9aaa", fontSize: 13, textAlign: "center" }}>No roles found</div>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div>
      <label style={S.fieldLabel}>Current / Desired Role <span style={{ color: "#c0392b" }}>*</span></label>
      <div ref={triggerRef} onClick={open ? () => { setOpen(false); setSearch(""); } : handleOpen}
        style={{
          ...S.input,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", userSelect: "none",
          borderColor: open ? "#1a3a5c" : error ? "#c0392b" : "#d5d9e0",
          boxShadow: open ? "0 0 0 3px rgba(26,58,92,0.1)" : "none",
        }}>
        <span style={{ color: role ? "#0f1c2e" : "#aab0ba", fontSize: 13 }}>{role || "Select a role..."}</span>
        <span style={{ fontSize: 9, color: "#8a9aaa", transform: `rotate(${open ? 180 : 0}deg)`, transition: "0.2s" }}>▼</span>
      </div>
      {error && <p style={S.fieldErr}>{error}</p>}
      {dropdownEl}
    </div>
  );
}

export default function InterviewApplyForm() {
  const { companySlug } = useParams();

  const parseSlug = (slug = "") => {
    const parts = slug.split("-");
    const last = parts[parts.length - 1] || "";
    const isMongo = /^[a-f0-9]{24}$/i.test(last);
    if (isMongo) return { companyId: last, companyName: parts.slice(0, -1).join(" ") || "Your Business" };
    return { companyId: slug || "69b8fe0a6e3d6f1e056f3109", companyName: "Your Business" };
  };
  const { companyId, companyName } = parseSlug(companySlug);

  const [form, setForm] = useState({ name: "", email: "", mobile: "", years: "", notes: "" });
  const [exp, setExp] = useState("Fresher");
  const [role, setRole] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumePreview, setResumePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState("");
  const [drag, setDrag] = useState(false);
  const [interviewerName, setInterviewerName] = useState("");

  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  const handleFile = useCallback((file) => {
    if (!file) return;
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (![".pdf", ".doc", ".docx"].includes(ext)) { setErrors(e => ({ ...e, resume: "Only PDF, DOC, DOCX allowed" })); return; }
    if (file.size > 5 * 1024 * 1024) { setErrors(e => ({ ...e, resume: "File too large (max 5MB)" })); return; }
    setResumeFile(file);
    setResumePreview({ name: file.name, size: (file.size / 1024).toFixed(0) + " KB" });
    setErrors(e => ({ ...e, resume: "" }));
  }, []);

  const openFilePicker = (e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); };
  const onDragEnter = (e) => { e.preventDefault(); dragCounter.current++; setDrag(true); };
  const onDragLeave = (e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setDrag(false); };
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (e) => { e.preventDefault(); dragCounter.current = 0; setDrag(false); handleFile(e.dataTransfer.files?.[0]); };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email address";
    if (!form.mobile.trim()) errs.mobile = "Mobile number is required";
    if (!role) errs.role = "Please select a role";
    if (exp === "Experienced" && !form.years) errs.years = "Years of experience required";
    if (!resumeFile) errs.resume = "Resume is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setApiError("");
    const data = new FormData();
    data.append("companyId", companyId); data.append("companyName", companyName);
    data.append("name", form.name.trim()); data.append("email", form.email.trim());
    data.append("mobile", form.mobile.trim()); data.append("experience", exp);
    data.append("years", form.years || ""); data.append("role", role);
    data.append("notes", form.notes || ""); data.append("interviewerName", interviewerName || "");
    data.append("resume", resumeFile);
    try {
      const res = await fetch(`${API_URL}/api/interviews/apply`, { method: "POST", body: data });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.msg || "Submission failed"); }
      setSubmitted(true);
    } catch (err) {
      setApiError(err.message + ". Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inp = (id, type = "text", placeholder = "") => ({
    type, placeholder, value: form[id],
    onChange: (e) => { setForm(f => ({ ...f, [id]: e.target.value })); setErrors(er => ({ ...er, [id]: "" })); },
    style: { ...S.input, borderColor: errors[id] ? "#c0392b" : "#d5d9e0" },
  });

  if (submitted) {
    return (
      <div style={S.page}>
        <style>{css}</style>
        <div style={S.successCard}>
          <div style={S.successBar} />
          <div style={S.successBody}>
            <div style={S.successCheck}>✓</div>
            <h2 style={S.successTitle}>Application Submitted</h2>
            <p style={S.successText}>Thank you, <strong>{form.name}</strong>. Your application for <strong>{role}</strong> at <strong>{companyName}</strong> has been received. Our team will review it and be in touch shortly.</p>
            <div style={S.successMeta}>
              <div style={S.successMetaItem}><span style={S.metaLabel}>Role</span><span style={S.metaVal}>{role}</span></div>
              <div style={S.successMetaDivider} />
              <div style={S.successMetaItem}><span style={S.metaLabel}>Company</span><span style={S.metaVal}>{companyName}</span></div>
              <div style={S.successMetaDivider} />
              <div style={S.successMetaItem}><span style={S.metaLabel}>Experience</span><span style={S.metaVal}>{exp}{exp === "Experienced" ? ` · ${form.years} yrs` : ""}</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <style>{css}</style>
      <div style={S.wrapper}>

        {/* Header Banner */}
        <div style={S.banner}>
          <div style={S.bannerLeft}>
            <div style={S.bannerIcon}>🏢</div>
            <div>
              <div style={S.bannerCompany}>{companyName}</div>
              <div style={S.bannerSub}>Job Application Form</div>
            </div>
          </div>
          <div style={S.bannerBadge}>REF: {companyId.slice(-8).toUpperCase()}</div>
        </div>

        {/* Form Body */}
        <div style={S.formBody}>

          {/* Progress indicator */}
          <div style={S.progressBar}>
            {["Personal Details", "Experience & Role", "Resume & Notes"].map((step, i) => (
              <div key={i} style={S.progressStep}>
                <div style={S.progressDot} />
                <span style={S.progressLabel}>{step}</span>
              </div>
            ))}
          </div>

          <div style={S.formGrid}>

            {/* Left Column */}
            <div style={S.col}>
              <div style={S.fieldGroup}>
                <div style={S.groupTitle}>Personal Details</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={S.fieldLabel}>Full Name <span style={{ color: "#c0392b" }}>*</span></label>
                    <input {...inp("name", "text", "Your full name")} />
                    {errors.name && <p style={S.fieldErr}>{errors.name}</p>}
                  </div>
                  <div>
                    <label style={S.fieldLabel}>Email Address <span style={{ color: "#c0392b" }}>*</span></label>
                    <input {...inp("email", "email", "you@example.com")} />
                    {errors.email && <p style={S.fieldErr}>{errors.email}</p>}
                  </div>
                  <div>
                    <label style={S.fieldLabel}>Mobile Number <span style={{ color: "#c0392b" }}>*</span></label>
                    <input {...inp("mobile", "tel", "+91 00000 00000")} />
                    {errors.mobile && <p style={S.fieldErr}>{errors.mobile}</p>}
                  </div>
                  <div>
                    <label style={S.fieldLabel}>Interviewer / Referred By</label>
                    <input
                      type="text" placeholder="Name of person who referred / scheduled"
                      value={interviewerName}
                      onChange={e => setInterviewerName(e.target.value)}
                      style={S.input}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div style={S.col}>
              <div style={S.fieldGroup}>
                <div style={S.groupTitle}>Experience & Role</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* Experience toggle */}
                  <div>
                    <label style={S.fieldLabel}>Experience Level <span style={{ color: "#c0392b" }}>*</span></label>
                    <div style={S.toggleGroup}>
                      {["Fresher", "Experienced"].map(val => (
                        <button key={val} type="button" onClick={() => setExp(val)}
                          style={{ ...S.toggleBtn, ...(exp === val ? S.toggleBtnActive : {}) }}>
                          {val === "Fresher" ? "🎓 Fresher" : "💼 Experienced"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {exp === "Experienced" && (
                    <div>
                      <label style={S.fieldLabel}>Years of Experience <span style={{ color: "#c0392b" }}>*</span></label>
                      <input {...inp("years", "number", "e.g. 3")} min="0" max="50" />
                      {errors.years && <p style={S.fieldErr}>{errors.years}</p>}
                    </div>
                  )}

                  <RoleDropdown role={role} setRole={setRole} error={errors.role} setErrors={setErrors} />
                </div>
              </div>

              <div style={{ ...S.fieldGroup, marginTop: 20 }}>
                <div style={S.groupTitle}>Resume Upload</div>
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx"
                  style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
                  onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ""; }}
                />
                <div
                  role="button" tabIndex={0}
                  onClick={openFilePicker}
                  onKeyDown={e => e.key === "Enter" && openFilePicker(e)}
                  onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}
                  style={{
                    border: `2px ${drag || resumeFile ? "solid" : "dashed"} ${drag ? "#1a3a5c" : resumeFile ? "#166534" : errors.resume ? "#c0392b" : "#d5d9e0"}`,
                    borderRadius: 4, padding: "20px", textAlign: "center", cursor: "pointer",
                    background: drag ? "#f0f4fa" : resumeFile ? "#f0fdf4" : "#f8fafc",
                    transition: "all 0.15s",
                  }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                  {resumePreview ? (
                    <>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#166534" }}>✓ {resumePreview.name}</p>
                      <p style={{ fontSize: 11, color: "#8a9aaa", marginTop: 4 }}>{resumePreview.size} · Click to replace</p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: 13, color: "#5a6a7a" }}>
                        <span style={{ color: "#1a3a5c", fontWeight: 600 }}>Click to upload</span> or drag & drop
                      </p>
                      <p style={{ fontSize: 11, color: "#aab0ba", marginTop: 4 }}>PDF, DOC, DOCX — max 5MB</p>
                    </>
                  )}
                </div>
                {errors.resume && <p style={S.fieldErr}>{errors.resume}</p>}

                {/* Notes */}
                <div style={{ marginTop: 16 }}>
                  <label style={S.fieldLabel}>Additional Notes</label>
                  <textarea rows={3} placeholder="Any additional information for the recruiter..."
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    style={{ ...S.input, resize: "vertical", lineHeight: 1.6 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {apiError && (
            <div style={S.alertBox}>⚠ {apiError}</div>
          )}

          {/* Footer */}
          <div style={S.formFooter}>
            <div style={S.footerNote}>All fields marked <span style={{ color: "#c0392b" }}>*</span> are required</div>
            <button type="button" onClick={handleSubmit} disabled={loading}
              style={{ ...S.primaryBtn, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? <><span style={S.spinner} />Processing...</> : "Submit Application →"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  input:focus, textarea:focus { outline: none; border-color: #1a3a5c !important; box-shadow: 0 0 0 3px rgba(26,58,92,0.1) !important; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const S = {
  page: {
    minHeight: "100vh",
    background: "#eef0f4",
    display: "flex", alignItems: "flex-start", justifyContent: "center",
    padding: "40px 16px",
    fontFamily: "'IBM Plex Sans', sans-serif",
  },
  wrapper: {
    width: "100%", maxWidth: 960,
    background: "#fff",
    borderRadius: 4,
    boxShadow: "0 4px 32px rgba(0,0,0,0.10)",
    overflow: "hidden",
  },
  banner: {
    background: "#0f2744",
    padding: "20px 32px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  bannerLeft: { display: "flex", alignItems: "center", gap: 14 },
  bannerIcon: {
    width: 44, height: 44,
    background: "#2563eb",
    borderRadius: 4,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 22,
  },
  bannerCompany: { color: "#fff", fontWeight: 700, fontSize: 16, textTransform: "capitalize" },
  bannerSub: { color: "#6b8aad", fontSize: 12, marginTop: 2 },
  bannerBadge: {
    fontSize: 11, fontWeight: 600,
    color: "#6b8aad",
    fontFamily: "'IBM Plex Mono', monospace",
    background: "rgba(255,255,255,0.06)",
    padding: "4px 12px", borderRadius: 3,
    border: "1px solid rgba(255,255,255,0.08)",
  },
  formBody: { padding: "32px 32px" },
  progressBar: {
    display: "flex", alignItems: "center", gap: 0,
    marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid #e8ecf0",
  },
  progressStep: { display: "flex", alignItems: "center", gap: 8, marginRight: 28 },
  progressDot: { width: 8, height: 8, borderRadius: "50%", background: "#1a3a5c", flexShrink: 0 },
  progressLabel: { fontSize: 11, color: "#5a6a7a", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
  col: {},
  fieldGroup: {
    background: "#f8fafc",
    border: "1px solid #e8ecf0",
    borderRadius: 4,
    padding: "20px 24px",
  },
  groupTitle: {
    fontSize: 12, fontWeight: 700, color: "#0f1c2e",
    textTransform: "uppercase", letterSpacing: 0.8,
    marginBottom: 16, paddingBottom: 10,
    borderBottom: "1px solid #e8ecf0",
  },
  fieldLabel: {
    display: "block", fontSize: 11, fontWeight: 600,
    color: "#3a4a5a", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 7,
  },
  input: {
    width: "100%", padding: "10px 14px",
    background: "#fff", border: "1.5px solid #d5d9e0",
    borderRadius: 4, fontSize: 13, color: "#0f1c2e",
    fontFamily: "'IBM Plex Sans', sans-serif",
    transition: "all 0.15s",
  },
  fieldErr: { color: "#c0392b", fontSize: 11, marginTop: 5, fontWeight: 500 },
  toggleGroup: { display: "flex", gap: 10 },
  toggleBtn: {
    flex: 1, padding: "10px 0",
    background: "#fff", border: "1.5px solid #d5d9e0",
    borderRadius: 4, fontSize: 13, fontWeight: 600,
    color: "#5a6a7a", cursor: "pointer",
    fontFamily: "'IBM Plex Sans', sans-serif",
    transition: "all 0.15s",
  },
  toggleBtnActive: {
    background: "#f0f4fa", borderColor: "#1a3a5c", color: "#0f2744",
  },
  alertBox: {
    background: "#fef3f2", border: "1px solid #fbd5d0",
    borderLeft: "4px solid #c0392b",
    borderRadius: 4, padding: "12px 16px",
    fontSize: 13, color: "#c0392b", fontWeight: 600, marginTop: 16,
  },
  formFooter: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginTop: 24, paddingTop: 20, borderTop: "1px solid #e8ecf0",
  },
  footerNote: { fontSize: 12, color: "#8a9aaa" },
  primaryBtn: {
    padding: "12px 32px",
    background: "#0f2744", color: "#fff",
    border: "none", borderRadius: 4,
    fontSize: 14, fontWeight: 700,
    fontFamily: "'IBM Plex Sans', sans-serif",
    display: "flex", alignItems: "center", gap: 8,
    transition: "background 0.15s",
    letterSpacing: 0.2,
  },
  spinner: {
    width: 15, height: 15,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },
  // Success screen
  successCard: {
    width: "100%", maxWidth: 520,
    background: "#fff", borderRadius: 4,
    boxShadow: "0 4px 32px rgba(0,0,0,0.10)",
    overflow: "hidden",
  },
  successBar: { height: 5, background: "#0f2744" },
  successBody: { padding: "40px 40px" },
  successCheck: {
    width: 56, height: 56,
    background: "#0f2744", color: "#fff",
    borderRadius: "50%", fontSize: 24, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  successTitle: { fontSize: 20, fontWeight: 700, color: "#0f1c2e", marginBottom: 10 },
  successText: { fontSize: 13, color: "#5a6a7a", lineHeight: 1.7, marginBottom: 24 },
  successMeta: {
    display: "flex", alignItems: "center",
    background: "#f8fafc", border: "1px solid #e8ecf0",
    borderRadius: 4, padding: "14px 20px", gap: 0,
  },
  successMetaItem: { display: "flex", flexDirection: "column", gap: 3, flex: 1 },
  successMetaDivider: { width: 1, height: 32, background: "#e8ecf0", margin: "0 20px" },
  metaLabel: { fontSize: 10, fontWeight: 700, color: "#8a9aaa", textTransform: "uppercase", letterSpacing: 0.8 },
  metaVal: { fontSize: 13, fontWeight: 600, color: "#0f1c2e" },
};
