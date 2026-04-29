// InterviewPage.jsx
// Drop into Dashboard.jsx as a tab/page
// Props: companyId, companyName (from logged-in user context)
// Default: {companyName} — {companyId}

import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://mbusiness.octosofttechnologies.in";

const statusColor = { pending: "#F59E0B", hired: "#22C55E", rejected: "#EF4444" };
const sc = (s = "pending") => statusColor[s.toLowerCase()] || "#a855f7";

function Badge({ label = "pending" }) {
  const c = sc(label);
  return (
    <span style={{
      background: `${c}18`, color: c, border: `1px solid ${c}33`,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      textTransform: "capitalize", whiteSpace: "nowrap",
    }}>
      {label === "pending" ? "⏳ Pending" : label === "hired" ? "✅ Hired" : "❌ Rejected"}
    </span>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(59,7,100,0.55)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%",
        maxWidth: wide ? 860 : 520, maxHeight: "90vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 32px 80px rgba(147,51,234,0.25)",
      }}>
        <div style={{
          padding: "16px 22px", borderBottom: "1px solid #ede9fe", flexShrink: 0,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "linear-gradient(90deg,#f5f3ff,#faf5ff)",
        }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1e0a3c" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#7c3aed", padding: "4px 8px" }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", padding: "20px 22px", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

function InfoCell({ icon, label, value }) {
  return (
    <div style={{ background: "#faf5ff", borderRadius: 10, padding: "10px 14px", border: "1px solid #ede9fe" }}>
      <div style={{ fontSize: 10, color: "#7c3aed", fontWeight: 700, marginBottom: 3 }}>{icon} {label.toUpperCase()}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e0a3c" }}>{value || "—"}</div>
    </div>
  );
}

function StatusPicker({ current = "pending", onChange }) {
  return (
    <div style={{ background: "#faf5ff", borderRadius: 12, padding: "14px 16px", border: "1px solid #ede9fe" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", marginBottom: 10 }}>UPDATE STATUS</div>
      <div style={{ display: "flex", gap: 10 }}>
        {["pending", "hired", "rejected"].map(s => (
          <button key={s} onClick={() => onChange(s)} style={{
            flex: 1, padding: "10px", borderRadius: 10,
            border: `2px solid ${current === s ? sc(s) : "#ede9fe"}`,
            background: current === s ? `${sc(s)}15` : "#fff",
            color: current === s ? sc(s) : "#a78bfa",
            fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
          }}>
            {s === "pending" ? "⏳ Pending" : s === "hired" ? "✅ Hired" : "❌ Rejected"}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResumeModal({ candidate, onClose, onStatusChange }) {
  const [status, setStatus] = useState(candidate.status || "pending");
  const isPDF = (candidate.resumeName || "").toLowerCase().endsWith(".pdf");
  const resumeUrl = candidate.resumeData || candidate.resumeUrl;

  const handleStatus = (s) => { setStatus(s); onStatusChange(s); };

  const downloadResume = () => {
    if (!resumeUrl) { alert("Resume not available"); return; }
    const a = document.createElement("a");
    a.href = resumeUrl; a.download = candidate.resumeName || "resume.pdf"; a.click();
  };

  return (
    <Modal title={`📄 Resume — ${candidate.name}`} onClose={onClose} wide>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        <InfoCell icon="👤" label="Name"       value={candidate.name} />
        <InfoCell icon="📧" label="Email"      value={candidate.email} />
        <InfoCell icon="📱" label="Mobile"     value={candidate.mobile} />
        <InfoCell icon="🎯" label="Role"       value={candidate.role} />
        <InfoCell icon="💼" label="Experience" value={candidate.experience === "Fresher" ? "🎓 Fresher" : `${candidate.years || "?"} yrs`} />
        <InfoCell icon="📅" label="Applied"    value={candidate.date ? new Date(candidate.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"} />
        {candidate.interviewerName && <InfoCell icon="🧑‍💼" label="Interviewer" value={candidate.interviewerName} />}
      </div>

      <div style={{ marginBottom: 16 }}>
        <StatusPicker current={status} onChange={handleStatus} />
      </div>

      {resumeUrl ? (
        <>
          {isPDF ? (
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #ede9fe", height: 400, marginBottom: 12 }}>
              <iframe src={resumeUrl} style={{ width: "100%", height: "100%", border: "none" }} title="Resume Preview" />
            </div>
          ) : (
            <div style={{ background: "#faf5ff", borderRadius: 12, padding: 24, textAlign: "center", border: "1px solid #ede9fe", marginBottom: 12 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 13, color: "#9333ea", fontWeight: 600 }}>{candidate.resumeName}</div>
              <div style={{ fontSize: 12, color: "#a78bfa", marginTop: 4 }}>Preview not available — download below</div>
            </div>
          )}
          <button onClick={downloadResume} style={btnStyle("#9333ea")}>
            ⬇️ Download Resume — {candidate.resumeName || "file"}
          </button>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: 30, color: "#a78bfa", background: "#faf5ff", borderRadius: 12, border: "1px solid #ede9fe" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>No resume uploaded
        </div>
      )}
    </Modal>
  );
}

function ProfileModal({ candidate, onClose, onStatusChange, onViewResume }) {
  const [status, setStatus] = useState(candidate.status || "pending");
  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <Modal title="👤 Candidate Profile" onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, background: "linear-gradient(135deg,#f5f3ff,#faf5ff)", borderRadius: 14, border: "1px solid #ede9fe", marginBottom: 18 }}>
        <div style={avatarStyle(56, 22)}>{(candidate.name || "?")[0].toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1e0a3c" }}>{candidate.name}</div>
          <div style={{ fontSize: 13, color: "#9333ea", fontWeight: 600 }}>{candidate.role}</div>
        </div>
        <Badge label={status} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <InfoCell icon="📧" label="Email"      value={candidate.email} />
        <InfoCell icon="📱" label="Mobile"     value={candidate.mobile} />
        <InfoCell icon="💼" label="Experience" value={candidate.experience === "Fresher" ? "🎓 Fresher" : `💼 ${candidate.years || "?"} years`} />
        <InfoCell icon="🎯" label="Role"       value={candidate.role} />
        <InfoCell icon="📅" label="Applied"    value={fmt(candidate.date || candidate.createdAt)} />
        <InfoCell icon="📎" label="Resume"     value={candidate.resumeName || "Not uploaded"} />
        {candidate.interviewerName && <InfoCell icon="🧑‍💼" label="Interviewer" value={candidate.interviewerName} />}
        {candidate.notes && <div style={{ gridColumn: "1/-1" }}><InfoCell icon="📝" label="Notes" value={candidate.notes} /></div>}
      </div>

      <div style={{ marginBottom: 14 }}>
        <StatusPicker current={status} onChange={(s) => { setStatus(s); onStatusChange(s); }} />
      </div>

      {(candidate.resumeData || candidate.resumeUrl) && (
        <button onClick={onViewResume} style={btnStyle("#9333ea")}>📄 View Resume</button>
      )}
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function InterviewPage({ companyId = "69b8fe0a6e3d6f1e056f3109", companyName = "Your Business" }) {
  const STORAGE_KEY = `hr_candidates_${companyId}`;
  const [candidates, setCandidates] = useState([]);
  const [filter, setFilter]         = useState("all");
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [viewResume,  setViewResume]  = useState(null);
  const [viewProfile, setViewProfile] = useState(null);

  const applyLink = `${window.location.origin}/interview-apply/${companyName.replace(/\s+/g, "-")}-${companyId}`;

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (saved.length) { setCandidates(saved); setLoading(false); }
    axios.get(`${API_URL}/api/interviews?companyId=${companyId}`)
      .then(r => { const d = r.data?.data || r.data || []; if (d.length) persist(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [companyId]);

  const persist    = (list) => { setCandidates(list); localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); };
  const showToast  = (msg)  => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const updateStatus = (idx, val) => {
    const updated = [...candidates];
    updated[idx]  = { ...updated[idx], status: val };
    persist(updated);
    const c = updated[idx]; const id = c._id || c.id;
    if (id) axios.patch(`${API_URL}/api/interviews/${id}/status`, { status: val }).catch(() => {});
    showToast(`✅ Status → "${val}"`);
    if (viewResume  && (viewResume._id  || viewResume.id)  === id) setViewResume(updated[idx]);
    if (viewProfile && (viewProfile._id || viewProfile.id) === id) setViewProfile(updated[idx]);
  };

  const deleteCandidate = (idx) => {
    if (!window.confirm("Delete this candidate?")) return;
    const c = candidates[idx]; const id = c._id || c.id;
    if (id) axios.delete(`${API_URL}/api/interviews/${id}`).catch(() => {});
    persist(candidates.filter((_, i) => i !== idx));
    showToast("🗑️ Deleted");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(applyLink).then(() => {
      setLinkCopied(true); showToast("📋 Link copied!");
      setTimeout(() => setLinkCopied(false), 2200);
    });
  };

  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const displayed = candidates.filter(c => {
    const okF = filter === "all" || (c.status || "pending").toLowerCase() === filter;
    const q   = search.toLowerCase();
    const okS = !q || (c.name||"").toLowerCase().includes(q) || (c.role||"").toLowerCase().includes(q) || (c.email||"").toLowerCase().includes(q) || (c.mobile||"").includes(q);
    return okF && okS;
  });

  const counts = {
    total:    candidates.length,
    pending:  candidates.filter(c => (c.status||"pending").toLowerCase() === "pending").length,
    hired:    candidates.filter(c => (c.status||"").toLowerCase() === "hired").length,
    rejected: candidates.filter(c => (c.status||"").toLowerCase() === "rejected").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');`}</style>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#fff", border: "1.5px solid #22c55e", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#22c55e", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
          {toast}
        </div>
      )}

      {/* Link Banner */}
      <div style={{ background: "linear-gradient(135deg,#1e0a3c,#2d1057)", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", boxShadow: "0 8px 24px rgba(59,7,100,0.22)" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(147,51,234,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🔗</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Candidate Application Link — share with applicants</div>
          <div style={{ fontSize: 12, color: "#c084fc", fontFamily: "monospace", wordBreak: "break-all" }}>{applyLink}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={copyLink} style={{ background: linkCopied ? "rgba(34,197,94,0.2)" : "rgba(147,51,234,0.25)", border: `1px solid ${linkCopied ? "rgba(34,197,94,0.5)" : "rgba(147,51,234,0.5)"}`, borderRadius: 9, padding: "9px 16px", color: linkCopied ? "#4ade80" : "#c084fc", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
            {linkCopied ? "✅ Copied!" : "📋 Copy Link"}
          </button>
          <button onClick={() => window.open(applyLink, "_blank")} style={{ background: "linear-gradient(135deg,#9333ea,#a855f7)", border: "none", borderRadius: 9, padding: "9px 16px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            👁 Preview Form
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Total",    val: counts.total,    icon: "🎯", c: "#9333ea" },
          { label: "Pending",  val: counts.pending,  icon: "⏳", c: "#F59E0B" },
          { label: "Hired",    val: counts.hired,    icon: "✅", c: "#22C55E" },
          { label: "Rejected", val: counts.rejected, icon: "❌", c: "#EF4444" },
        ].map(({ label, val, icon, c }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 14, padding: "18px 16px", boxShadow: "0 4px 18px rgba(147,51,234,0.07)", border: "1px solid #ede9fe", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${c},${c}88)` }} />
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${c}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 }}>{label.toUpperCase()}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: c }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 4px 24px rgba(147,51,234,0.08)", border: "1px solid #ede9fe" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1e0a3c" }}>All Candidates ({displayed.length})</h3>

        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>🔍</span>
            <input placeholder="Search name, role, email, mobile..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", padding: "9px 14px 9px 34px", border: "1.5px solid #ede9fe", borderRadius: 10, fontSize: 13, background: "#faf5ff", outline: "none", fontFamily: "inherit", color: "#1e0a3c", boxSizing: "border-box" }} />
          </div>
          {["all","pending","hired","rejected"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "7px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              border: "1.5px solid",
              borderColor: filter === f ? (f === "all" ? "#9333ea" : sc(f)) : "#ede9fe",
              background: filter === f ? `${f === "all" ? "#9333ea" : sc(f)}15` : "#fff",
              color: filter === f ? (f === "all" ? "#9333ea" : sc(f)) : "#a78bfa",
              transition: "all 0.15s",
            }}>
              {f === "all" ? "🎯 All" : f === "pending" ? "⏳ Pending" : f === "hired" ? "✅ Hired" : "❌ Rejected"}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 50, color: "#a78bfa" }}>Loading candidates...</div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#a78bfa" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e0a3c", marginBottom: 6 }}>
              {candidates.length === 0 ? "No applications yet" : "No results found"}
            </div>
            <div style={{ fontSize: 13 }}>
              {candidates.length === 0 ? "Share the application link above to receive applications" : "Try a different search or filter"}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 980 }}>
              <thead>
                <tr style={{ background: "linear-gradient(90deg,#f5f3ff,#faf5ff)" }}>
                  {["#","Candidate","Contact","Experience","Role","Interviewer","Applied Date","Status","Resume","Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#7c3aed", fontWeight: 700, fontSize: 10, borderBottom: "2px solid #ede9fe", whiteSpace: "nowrap" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((c, i) => {
                  const idx    = candidates.indexOf(c);
                  const status = (c.status || "pending").toLowerCase();
                  return (
                    <tr key={c._id || c.id || i}
                      style={{ borderBottom: "1px solid #f3f0ff", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#faf5ff"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                      <td style={{ padding: "12px 12px", color: "#a78bfa", fontSize: 11, fontFamily: "monospace" }}>{String(i+1).padStart(3,"0")}</td>

                      <td style={{ padding: "12px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={avatarStyle(32,12)}>{(c.name||"?")[0].toUpperCase()}</div>
                          <div style={{ fontWeight: 700, color: "#1e0a3c" }}>{c.name||"—"}</div>
                        </div>
                      </td>

                      <td style={{ padding: "12px 12px" }}>
                        <div style={{ fontSize: 12, color: "#7c3aed" }}>{c.email||"—"}</div>
                        <div style={{ fontSize: 11, color: "#a78bfa", marginTop: 2 }}>{c.mobile||""}</div>
                      </td>

                      <td style={{ padding: "12px 12px" }}>
                        {c.experience === "Fresher"
                          ? <span style={expBadge("#22C55E")}>🎓 Fresher</span>
                          : <span style={expBadge("#9333ea")}>💼 {c.years||"?"}yrs</span>}
                      </td>

                      <td style={{ padding: "12px 12px", fontWeight: 600, color: "#1e0a3c", fontSize: 12, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.role||"—"}
                      </td>

                      <td style={{ padding: "12px 12px", fontSize: 12, color: "#7c3aed" }}>
                        {c.interviewerName || <span style={{ color: "#ddd" }}>—</span>}
                      </td>

                      <td style={{ padding: "12px 12px", fontSize: 12, color: "#a78bfa", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                        {fmt(c.date || c.createdAt)}
                      </td>

                      <td style={{ padding: "12px 12px" }}>
                        <select value={status} onChange={e => updateStatus(idx, e.target.value)}
                          style={{
                            background: status === "hired" ? "rgba(34,197,94,0.1)" : status === "rejected" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                            border: `1.5px solid ${sc(status)}44`, borderRadius: 8, padding: "5px 10px",
                            color: sc(status), fontSize: 12, fontWeight: 700, cursor: "pointer", outline: "none", fontFamily: "inherit",
                          }}>
                          <option value="pending">⏳ Pending</option>
                          <option value="hired">✅ Hired</option>
                          <option value="rejected">❌ Rejected</option>
                        </select>
                      </td>

                      <td style={{ padding: "12px 12px" }}>
                        {(c.resumeData || c.resumeUrl) ? (
                          <button onClick={() => setViewResume(c)} style={{ background: "rgba(147,51,234,0.1)", border: "1px solid rgba(147,51,234,0.3)", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#9333ea", cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>
                            📄 View
                          </button>
                        ) : <span style={{ fontSize: 11, color: "#ddd" }}>—</span>}
                      </td>

                      <td style={{ padding: "12px 12px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setViewProfile(c)} style={{ background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: 7, padding: "5px 10px", fontSize: 12, color: "#7c3aed", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>
                            👤 Profile
                          </button>
                          <button onClick={() => deleteCandidate(idx)} style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 7, padding: "5px 10px", fontSize: 12, color: "#ef4444", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewResume && (
        <ResumeModal
          candidate={viewResume}
          onClose={() => setViewResume(null)}
          onStatusChange={(s) => {
            const idx = candidates.findIndex(c => (c._id||c.id) === (viewResume._id||viewResume.id));
            if (idx !== -1) updateStatus(idx, s);
          }}
        />
      )}

      {viewProfile && (
        <ProfileModal
          candidate={viewProfile}
          onClose={() => setViewProfile(null)}
          onStatusChange={(s) => {
            const idx = candidates.findIndex(c => (c._id||c.id) === (viewProfile._id||viewProfile.id));
            if (idx !== -1) { updateStatus(idx, s); setViewProfile({ ...viewProfile, status: s }); }
          }}
          onViewResume={() => { setViewProfile(null); setViewResume(viewProfile); }}
        />
      )}
    </div>
  );
}

const avatarStyle = (size, fontSize) => ({
  width: size, height: size, borderRadius: "50%",
  background: "linear-gradient(135deg,#9333ea,#c084fc)",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "#fff", fontSize, fontWeight: 700, flexShrink: 0,
});

const expBadge = (color) => ({
  background: `${color}12`, color, border: `1px solid ${color}25`,
  padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
});

const btnStyle = (color) => ({
  width: "100%", background: `linear-gradient(135deg,${color},${color}cc)`,
  border: "none", borderRadius: 12, padding: 13,
  color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
});
