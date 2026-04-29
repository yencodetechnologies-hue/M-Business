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

// ── Role Dropdown Component (Portal-based — never clipped) ──
function RoleDropdown({ role, setRole, error, setErrors }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const searchRef = useRef(null);

  const filtered = search.trim() === ""
    ? ROLES
    : ROLES.filter(r => r.toLowerCase().includes(search.toLowerCase()));

  // Recalculate position whenever open
  const calcPos = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width });
    }
  };

  const handleOpen = () => {
    calcPos();
    setSearch("");
    setOpen(true);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        // check if click is inside portal dropdown
        const portal = document.getElementById("role-dropdown-portal");
        if (portal && portal.contains(e.target)) return;
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (r) => {
    setRole(r);
    setSearch("");
    setOpen(false);
    setErrors(er => ({ ...er, role: "" }));
  };

  const dropdownEl = open ? createPortal(
    <div
      id="role-dropdown-portal"
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        width: pos.width,
        background: "#fff",
        border: "1.5px solid #9333ea",
        borderRadius: 12,
        zIndex: 999999,
        boxShadow: "0 16px 48px rgba(147,51,234,0.28)",
        overflow: "hidden",
      }}
    >
      {/* Search */}
      <div style={{ padding: "8px 10px", borderBottom: "1px solid #ede9fe", background: "#faf5ff" }}>
        <input
          ref={searchRef}
          type="text"
          placeholder="Search role..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "8px 12px",
            border: "1.5px solid #ede9fe", borderRadius: 8,
            fontSize: 13, background: "#fff",
            fontFamily: "'DM Sans',sans-serif", color: "#1e0a3c",
            outline: "none", boxSizing: "border-box",
          }}
        />
      </div>
      {/* Options */}
      <div style={{ maxHeight: 200, overflowY: "auto" }}>
        {filtered.length ? filtered.map(r => (
          <div
            key={r}
            onMouseDown={(e) => { e.preventDefault(); handleSelect(r); }}
            style={{
              padding: "10px 16px", fontSize: 13, cursor: "pointer",
              borderBottom: "1px solid #f3f0ff",
              background: role === r ? "#f5f3ff" : "#fff",
              color: role === r ? "#9333ea" : "#1e0a3c",
              fontWeight: role === r ? 700 : 400,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f5f3ff"}
            onMouseLeave={e => e.currentTarget.style.background = role === r ? "#f5f3ff" : "#fff"}
          >
            {r}
          </div>
        )) : (
          <div style={{ padding: "14px 16px", color: "#a78bfa", fontSize: 13, textAlign: "center" }}>
            No roles found
          </div>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="fade-up d5">
      <label style={sty.label}>
        Current / Desired Role <span style={{ color: "#ef4444" }}>*</span>
      </label>

      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={open ? () => { setOpen(false); setSearch(""); } : handleOpen}
        style={{
          ...sty.input(error),
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", userSelect: "none",
          borderColor: open ? "#9333ea" : error ? "#ef4444" : "#ede9fe",
          boxShadow: open ? "0 0 0 3px rgba(147,51,234,0.12)" : "none",
        }}
      >
        <span style={{ color: role ? "#1e0a3c" : "#a78bfa", fontWeight: role ? 500 : 400 }}>
          {role || "Select a role..."}
        </span>
        <span style={{ fontSize: 10, color: "#a78bfa", transform: `rotate(${open ? 180 : 0}deg)`, transition: "0.2s", flexShrink: 0 }}>▼</span>
      </div>

      {error && <p style={sty.err}>{error}</p>}

      {/* Portal dropdown renders here — outside all stacking contexts */}
      {dropdownEl}
    </div>
  );
}

// ── Main Form ─────────────────────────────────────────────
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
    if (![".pdf", ".doc", ".docx"].includes(ext)) {
      setErrors(e => ({ ...e, resume: "⚠️ Only PDF, DOC, DOCX allowed" })); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(e => ({ ...e, resume: "⚠️ File too large (max 5MB)" })); return;
    }
    setResumeFile(file);
    setResumePreview({ name: file.name, size: (file.size / 1024).toFixed(0) + " KB" });
    setErrors(e => ({ ...e, resume: "" }));
  }, []);

  const openFilePicker = (e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); };
  const onDragEnter = (e) => { e.preventDefault(); dragCounter.current++; setDrag(true); };
  const onDragLeave = (e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setDrag(false); };
  const onDragOver = (e) => { e.preventDefault(); };
  const onDrop = (e) => { e.preventDefault(); dragCounter.current = 0; setDrag(false); handleFile(e.dataTransfer.files?.[0]); };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "⚠️ Name is required";
    if (!form.email.trim()) errs.email = "⚠️ Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "⚠️ Invalid email";
    if (!form.mobile.trim()) errs.mobile = "⚠️ Mobile is required";
    if (!role) errs.role = "⚠️ Please select a role";
    if (exp === "Experienced" && !form.years) errs.years = "⚠️ Years required";
    if (!resumeFile) errs.resume = "⚠️ Resume is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setApiError("");
    const data = new FormData();
    data.append("companyId", companyId);
    data.append("companyName", companyName);
    data.append("name", form.name.trim());
    data.append("email", form.email.trim());
    data.append("mobile", form.mobile.trim());
    data.append("experience", exp);
    data.append("years", form.years || "");
    data.append("role", role);
    data.append("notes", form.notes || "");
    data.append("interviewerName", interviewerName || "");
    data.append("resume", resumeFile);
    try {
      const res = await fetch(`${API_URL}/api/interviews/apply`, { method: "POST", body: data });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.msg || "Submission failed"); }
      setSubmitted(true);
    } catch (err) {
      setApiError("❗ " + err.message + ". Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inp = (id, type = "text", placeholder = "") => ({
    type, placeholder, value: form[id],
    onChange: (e) => { setForm(f => ({ ...f, [id]: e.target.value })); setErrors(er => ({ ...er, [id]: "" })); },
    style: sty.input(errors[id]),
  });

  // ── Success ───────────────────────────────────────────
  if (submitted) {
    return (
      <div style={sty.page}>
        <style>{css}</style>
        <div style={{ ...sty.card, maxWidth: 460, textAlign: "center", padding: "52px 40px" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: "#1e0a3c", marginBottom: 10 }}>
            Application Submitted!
          </h2>
          <p style={{ color: "#7c3aed", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            Thank You🙏
          </p>
          <div style={{ background: "#f5f3ff", borderRadius: 12, padding: "12px 16px", border: "1px solid #ede9fe", fontSize: 13, color: "#7c3aed" }}>
            <strong>{form.name}</strong> · {role} · {companyName}
          </div>
          <p style={{ color: "#a78bfa", fontSize: 12, marginTop: 20 }}>You may safely close this tab.</p>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────
  return (
    <div style={sty.page}>
      <style>{css}</style>

      <div style={sty.card}>
        {/* Header */}
        <div style={{ textAlign: "center", padding: "32px 32px 20px" }}>
          <div style={sty.logoBox}>🏢</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: "#1e0a3c", fontFamily: "'Syne',sans-serif", textTransform: "capitalize" }}>
            {companyName}
          </div>
          <div style={{ fontSize: 12, color: "#a78bfa", marginTop: 4, marginBottom: 10 }}>Job Application Form</div>
          <span style={sty.idBadge}>ID: {companyId}</span>
          <div style={{ height: 1, background: "#ede9fe", marginTop: 18 }} />
        </div>

        {/* Fields */}
        <div style={{ padding: "0 32px 32px", display: "flex", flexDirection: "column", gap: 16, position: "relative" }}>

          {/* Name */}
          <div className="fade-up d1">
            <label style={sty.label}>Full Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input {...inp("name", "text", "Your full name")} />
            {errors.name && <p style={sty.err}>{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="fade-up d2">
            <label style={sty.label}>Email Address <span style={{ color: "#ef4444" }}>*</span></label>
            <input {...inp("email", "email", "email.com")} />
            {errors.email && <p style={sty.err}>{errors.email}</p>}
          </div>

          {/* Mobile */}
          <div className="fade-up d3">
            <label style={sty.label}>Mobile Number <span style={{ color: "#ef4444" }}>*</span></label>
            <input {...inp("mobile", "tel", "")} />
            {errors.mobile && <p style={sty.err}>{errors.mobile}</p>}
          </div>

          {/* Experience */}
          <div className="fade-up d4">
            <label style={sty.label}>Experience Level <span style={{ color: "#ef4444" }}>*</span></label>
            <div style={{ display: "flex", gap: 12 }}>
              {["Fresher", "Experienced"].map(val => (
                <button key={val} type="button" onClick={() => setExp(val)} style={{
                  flex: 1, padding: "11px 0", borderRadius: 12, fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", border: "1.5px solid",
                  borderColor: exp === val ? "#9333ea" : "#ede9fe",
                  background: exp === val ? "#f5f3ff" : "#faf5ff",
                  color: exp === val ? "#9333ea" : "#a78bfa",
                }}>
                  {val === "Fresher" ? "🎓 Fresher" : "💼 Experienced"}
                </button>
              ))}
            </div>
          </div>

          {/* Years */}
          {exp === "Experienced" && (
            <div className="fade-up d1">
              <label style={sty.label}>Years of Experience <span style={{ color: "#ef4444" }}>*</span></label>
              <input {...inp("years", "number", "e.g. 3")} min="0" max="50" />
              {errors.years && <p style={sty.err}>{errors.years}</p>}
            </div>
          )}

          {/* Role Dropdown — separate component, never clipped */}
          <RoleDropdown
            role={role}
            setRole={setRole}
            error={errors.role}
            setErrors={setErrors}
          />

          {/* Interviewer Name */}
          <div className="fade-up d6">
            <label style={sty.label}>
              Interviewer Name{" "}
              <span style={{ fontSize: 10, color: "#a78bfa", fontWeight: 400, textTransform: "none" }}>(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Name of the person who referred / scheduled"
              value={interviewerName}
              onChange={e => setInterviewerName(e.target.value)}
              style={sty.input(null)}
            />
          </div>

          {/* Resume Upload */}
          <div className="fade-up d7">
            <label style={sty.label}>
              Resume (PDF / DOC / DOCX) <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              ref={fileInputRef} type="file" accept=".pdf,.doc,.docx"
              style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
              onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ""; }}
            />
            <div
              role="button" tabIndex={0}
              onClick={openFilePicker}
              onKeyDown={e => e.key === "Enter" && openFilePicker(e)}
              onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}
              style={{
                border: `2px ${resumeFile ? "solid" : "dashed"} ${drag ? "#9333ea" : resumeFile ? "#9333ea" : errors.resume ? "#ef4444" : "#c4b5fd"}`,
                borderRadius: 14, padding: "22px 16px", textAlign: "center", cursor: "pointer",
                background: drag || resumeFile ? "#f5f3ff" : "#faf5ff",
                transition: "all 0.2s", userSelect: "none",
              }}>
              <div style={{ fontSize: 30, marginBottom: 6, pointerEvents: "none" }}>📄</div>
              {resumePreview ? (
                <>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#9333ea", pointerEvents: "none" }}>✅ {resumePreview.name}</p>
                  <p style={{ fontSize: 11, color: "#a78bfa", marginTop: 4, pointerEvents: "none" }}>{resumePreview.size} · Click to change</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: "#a78bfa", pointerEvents: "none" }}>
                    <span style={{ color: "#9333ea", fontWeight: 700 }}>Click to upload</span> or drag & drop
                  </p>
                  <p style={{ fontSize: 11, color: "#c4b5fd", marginTop: 4, pointerEvents: "none" }}>PDF, DOC, DOCX — max 5MB</p>
                </>
              )}
            </div>
            {errors.resume && <p style={sty.err}>{errors.resume}</p>}
          </div>

          {/* Notes */}
          <div className="fade-up d8">
            <label style={sty.label}>
              Additional Notes{" "}
              <span style={{ fontSize: 10, color: "#a78bfa", fontWeight: 400, textTransform: "none" }}>(optional)</span>
            </label>
            <textarea
              rows={3} placeholder="Any additional info..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              style={{ ...sty.input(null), resize: "vertical", lineHeight: 1.6 }}
            />
          </div>

          {/* API Error */}
          {apiError && (
            <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#ef4444" }}>
              {apiError}
            </div>
          )}

          {/* Submit */}
          <button
            type="button" onClick={handleSubmit} disabled={loading}
            style={{
              width: "100%", padding: "14px", borderRadius: 14, border: "none",
              background: "linear-gradient(135deg,#9333ea,#a855f7)",
              color: "#fff", fontSize: 15, fontWeight: 800,
              fontFamily: "'Syne',sans-serif", letterSpacing: 0.3,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              boxShadow: loading ? "none" : "0 6px 20px rgba(147,51,234,0.35)",
              transition: "all 0.2s",
            }}>
            {loading ? "⏳ Submitting..." : "Submit Application →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CSS ───────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
  * { box-sizing: border-box; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
  .fade-up { animation: fadeUp 0.4s ease both; }
  .d1{animation-delay:0.05s}.d2{animation-delay:0.10s}.d3{animation-delay:0.15s}
  .d4{animation-delay:0.20s}.d5{animation-delay:0.25s}.d6{animation-delay:0.30s}
  .d7{animation-delay:0.35s}.d8{animation-delay:0.40s}
  input:focus, textarea:focus { outline: none !important; border-color: #9333ea !important; box-shadow: 0 0 0 3px rgba(147,51,234,0.12) !important; }
  button { transition: all 0.18s ease; }
`;

// ── Styles ────────────────────────────────────────────────
const sty = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(ellipse at 20% 20%,rgba(147,51,234,0.08) 0%,transparent 50%),radial-gradient(ellipse at 80% 80%,rgba(59,7,100,0.06) 0%,transparent 50%),#f5f3ff",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "32px 16px", fontFamily: "'DM Sans',sans-serif",
  },
  card: {
    width: "100%", maxWidth: 540,
    background: "#fff", borderRadius: 24,
    border: "1px solid #ede9fe",
    boxShadow: "0 24px 60px rgba(147,51,234,0.10),0 4px 16px rgba(147,51,234,0.06)",
  },
  logoBox: {
    width: 56, height: 56, borderRadius: 14,
    background: "linear-gradient(135deg,#3b0764,#9333ea)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 26, margin: "0 auto 12px",
    boxShadow: "0 8px 24px rgba(147,51,234,0.3)",
  },
  idBadge: {
    display: "inline-block", fontSize: 11, fontWeight: 700,
    color: "#7c3aed", background: "#f5f3ff", border: "1px solid #ddd6fe",
    borderRadius: 20, padding: "3px 12px",
  },
  label: {
    display: "block", fontSize: 11, fontWeight: 700, color: "#7c3aed",
    textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6,
  },
  input: (hasError) => ({
    width: "100%", padding: "11px 14px",
    background: "#faf5ff",
    border: `1.5px solid ${hasError ? "#ef4444" : "#ede9fe"}`,
    borderRadius: 10, fontSize: 13, color: "#1e0a3c",
    fontFamily: "'DM Sans',sans-serif",
    boxSizing: "border-box", transition: "border 0.2s,box-shadow 0.2s",
    display: "block",
  }),
  err: { color: "#ef4444", fontSize: 11, marginTop: 5, fontWeight: 500, margin: "5px 0 0" },
};
