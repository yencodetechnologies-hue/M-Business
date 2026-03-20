import { useState, useRef, useEffect } from "react";
import axios from "axios";

const ROLES = [
  "Software Engineer","Frontend Developer","Backend Developer","Full Stack Developer",
  "Mobile Developer","DevOps Engineer","Data Engineer","Data Scientist","ML Engineer",
  "UI/UX Designer","Product Manager","Business Analyst","QA Engineer","Test Engineer",
  "System Administrator","Network Engineer","Cloud Architect","Cybersecurity Analyst",
  "HR Executive","Recruiter","Sales Executive","Marketing Manager","Content Writer",
  "Graphic Designer","Finance Analyst","Operations Manager","Customer Support",
  "Project Manager","Scrum Master","Technical Lead","Engineering Manager",
  "React Developer","Node.js Developer","Python Developer","Java Developer",
  "Android Developer","iOS Developer","Flutter Developer","Database Administrator"
];

const T = {
  primary: "#3b0764", accent: "#9333ea", bg: "#f5f3ff",
  text: "#1e0a3c", muted: "#7c3aed", border: "#ede9fe"
};

export default function InterviewApplyForm() {
  // Read companyId from URL param
  const params = new URLSearchParams(window.location.search);
  const companyId = params.get("apply") || "default";

  const [companyInfo, setCompanyInfo] = useState({ name: "Company", logoUrl: null });
  const [form, setForm] = useState({
    name: "", email: "", mobile: "", experience: "",
    years: "", role: "", notes: ""
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [resumePreview, setResumePreview] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [showRoles, setShowRoles] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileRef = useRef();
  const roleRef = useRef();

  // Fetch company info
  useEffect(() => {
    axios.get(`http://localhost:5000/api/interviews/company/${companyId}`)
      .then(r => setCompanyInfo(r.data))
      .catch(() => {});
  }, [companyId]);

  // Close role dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (roleRef.current && !roleRef.current.contains(e.target)) setShowRoles(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredRoles = ROLES.filter(r =>
    r.toLowerCase().includes(roleSearch.toLowerCase())
  );

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors(p => ({ ...p, resume: "File too large (max 5MB)" }));
      return;
    }
    setResumeFile(file);
    setResumePreview(file.name);
    setErrors(p => ({ ...p, resume: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.mobile.trim()) e.mobile = "Mobile number is required";
    else if (!/^\+?[0-9]{10,13}$/.test(form.mobile.replace(/\s/g, "")))
      e.mobile = "Enter valid mobile number";
    if (!form.experience) e.experience = "Please select experience level";
    if (form.experience === "Experienced" && !form.years) e.years = "Years of experience required";
    if (!form.role.trim()) e.role = "Please select a role";
    if (!resumeFile) e.resume = "Resume is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      const data = new FormData();
      data.append("companyId", companyId);
      data.append("name", form.name);
      data.append("email", form.email);
      data.append("mobile", form.mobile);
      data.append("experience", form.experience);
      data.append("years", form.years || "");
      data.append("role", form.role);
      data.append("notes", form.notes || "");
      data.append("resume", resumeFile);
      await axios.post("http://localhost:5000/api/interviews/apply", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.msg || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inp = (field) => ({
    value: form[field],
    onChange: (e) => {
      setForm(p => ({ ...p, [field]: e.target.value }));
      setErrors(p => ({ ...p, [field]: "" }));
    },
    style: {
      width: "100%", border: `1.5px solid ${errors[field] ? "#EF4444" : T.border}`,
      borderRadius: 10, padding: "12px 14px", fontSize: 14, color: T.text,
      background: "#faf5ff", outline: "none", fontFamily: "inherit", boxSizing: "border-box"
    }
  });

  if (submitted) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: "52px 40px", maxWidth: 460, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(147,51,234,0.12)", border: `1px solid ${T.border}` }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "2px solid #22C55E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, margin: "0 auto 20px" }}>✅</div>
        <h2 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 800, color: T.text }}>Application Submitted!</h2>
        <p style={{ color: "#7c3aed", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
          உங்கள் application successfully submit ஆகிவிட்டது.<br/>
          HR team review பண்ணி உங்களை contact பண்ணுவாங்க. நன்றி! 🙏
        </p>
        <div style={{ marginTop: 24, fontSize: 13, color: "#a78bfa" }}>You may close this tab.</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}`}</style>
      <div style={{ background: "#fff", borderRadius: 24, padding: "40px 36px", width: "100%", maxWidth: 580, boxShadow: "0 24px 60px rgba(147,51,234,0.10)", border: `1px solid ${T.border}` }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          {companyInfo.logoUrl && (
            <img src={companyInfo.logoUrl} alt="logo" style={{ height: 52, objectFit: "contain", marginBottom: 10 }} />
          )}
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{companyInfo.name}</div>
          <div style={{ fontSize: 14, color: "#a78bfa", marginTop: 4 }}>Job Application Form</div>
          <div style={{ height: 1, background: T.border, margin: "20px 0 0" }} />
        </div>

        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Full Name <span style={{ color: "#EF4444" }}>*</span></label>
          <input placeholder="உங்கள் பேர் / Your full name" {...inp("name")} />
          {errors.name && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠️ {errors.name}</div>}
        </div>

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Email Address <span style={{ color: "#EF4444" }}>*</span></label>
          <input type="email" placeholder="example@gmail.com" {...inp("email")} />
          {errors.email && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠️ {errors.email}</div>}
        </div>

        {/* Mobile */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Mobile Number <span style={{ color: "#EF4444" }}>*</span></label>
          <input type="tel" placeholder="+91 9876543210" {...inp("mobile")} />
          {errors.mobile && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠️ {errors.mobile}</div>}
        </div>

        {/* Experience */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Experience Level <span style={{ color: "#EF4444" }}>*</span></label>
          <div style={{ display: "flex", gap: 10 }}>
            {["Fresher", "Experienced"].map(opt => (
              <label key={opt} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 10, border: `1.5px solid ${form.experience === opt ? T.accent : T.border}`, background: form.experience === opt ? "rgba(147,51,234,0.08)" : "#faf5ff", cursor: "pointer", fontSize: 14, fontWeight: 600, color: form.experience === opt ? T.accent : "#a78bfa", transition: "all 0.15s" }}>
                <input type="radio" name="experience" value={opt} checked={form.experience === opt}
                  onChange={() => { setForm(p => ({ ...p, experience: opt, years: "" })); setErrors(p => ({ ...p, experience: "" })); }}
                  style={{ display: "none" }} />
                {opt === "Fresher" ? "🎓 Fresher" : "💼 Experienced"}
              </label>
            ))}
          </div>
          {errors.experience && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠️ {errors.experience}</div>}
        </div>

        {/* Years (only if Experienced) */}
        {form.experience === "Experienced" && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Years of Experience <span style={{ color: "#EF4444" }}>*</span></label>
            <input type="number" min="0" max="50" placeholder="e.g. 3" {...inp("years")} />
            {errors.years && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠️ {errors.years}</div>}
          </div>
        )}

        {/* Role with search */}
        <div style={{ marginBottom: 16, position: "relative" }} ref={roleRef}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Current / Desired Role <span style={{ color: "#EF4444" }}>*</span></label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none" }}>🔍</span>
            <input
              placeholder="Search role..."
              value={roleSearch || form.role}
              onFocus={() => { setRoleSearch(""); setShowRoles(true); }}
              onChange={(e) => { setRoleSearch(e.target.value); setForm(p => ({ ...p, role: "" })); setShowRoles(true); setErrors(p => ({ ...p, role: "" })); }}
              style={{ width: "100%", border: `1.5px solid ${errors.role ? "#EF4444" : showRoles ? T.accent : T.border}`, borderRadius: 10, padding: "12px 14px 12px 38px", fontSize: 14, color: T.text, background: "#faf5ff", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>
          {showRoles && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: `1.5px solid ${T.border}`, borderRadius: 12, boxShadow: "0 8px 32px rgba(147,51,234,0.12)", zIndex: 50, maxHeight: 200, overflowY: "auto" }}>
              {filteredRoles.length === 0
                ? <div style={{ padding: "14px", textAlign: "center", color: "#a78bfa", fontSize: 13 }}>No roles found</div>
                : filteredRoles.map(r => (
                  <div key={r} onClick={() => { setForm(p => ({ ...p, role: r })); setRoleSearch(r); setShowRoles(false); setErrors(p => ({ ...p, role: "" })); }}
                    style={{ padding: "11px 16px", fontSize: 13, fontWeight: 500, color: T.text, cursor: "pointer", borderBottom: `1px solid ${T.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = "#faf5ff"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                    {r}
                  </div>
                ))
              }
            </div>
          )}
          {errors.role && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠️ {errors.role}</div>}
        </div>

        {/* Resume Upload */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Resume (PDF/DOC) <span style={{ color: "#EF4444" }}>*</span></label>
          <div
            onClick={() => fileRef.current.click()}
            style={{ border: `2px dashed ${errors.resume ? "#EF4444" : resumeFile ? T.accent : T.border}`, borderRadius: 12, padding: "24px 20px", textAlign: "center", cursor: "pointer", background: resumeFile ? "rgba(147,51,234,0.04)" : "#faf5ff", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = "rgba(147,51,234,0.04)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = errors.resume ? "#EF4444" : resumeFile ? T.accent : T.border; e.currentTarget.style.background = resumeFile ? "rgba(147,51,234,0.04)" : "#faf5ff"; }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
            {resumePreview
              ? <div><div style={{ fontSize: 14, fontWeight: 600, color: T.accent }}>✅ {resumePreview}</div><div style={{ fontSize: 12, color: "#a78bfa", marginTop: 4 }}>Click to change</div></div>
              : <div><div style={{ fontSize: 14, color: "#a78bfa" }}><strong style={{ color: T.accent }}>Click to upload</strong> your resume</div><div style={{ fontSize: 12, color: "#a78bfa", marginTop: 4 }}>PDF, DOC, DOCX — max 5MB</div></div>
            }
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={handleFile} />
          {errors.resume && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠️ {errors.resume}</div>}
        </div>

        {/* Notes (optional) */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Additional Notes <span style={{ fontSize: 10, color: "#a78bfa", fontWeight: 400 }}>(optional)</span></label>
          <textarea
            placeholder="Any additional info you'd like to share..."
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            rows={3}
            style={{ width: "100%", border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 14, color: T.text, background: "#faf5ff", outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
          />
        </div>

        {/* Submit error */}
        {submitError && (
          <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#ef4444", marginBottom: 14 }}>
            ❗ {submitError}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{ width: "100%", background: submitting ? "#c084fc" : "linear-gradient(135deg,#9333ea,#a855f7)", border: "none", borderRadius: 12, padding: 16, color: "#fff", fontSize: 16, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.2s", letterSpacing: 0.3 }}
        >
          {submitting ? "⏳ Submitting..." : "Submit Application →"}
        </button>
      </div>
    </div>
  );
}
