// ═══════════════════════════════════════════════════════════════════════════
// InterviewPage.jsx  — Drop this inside Dashboard.jsx as a component
// OR import from separate file: import InterviewPage from "./InterviewPage";
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import axios from "axios";

const T = { primary:"#3b0764", accent:"#9333ea", bg:"#f5f3ff", text:"#1e0a3c", muted:"#7c3aed", border:"#ede9fe" };
const sc = s => ({ pending:"#F59E0B", hired:"#22C55E", rejected:"#EF4444" }[s] || "#9333ea");

function StatusBadge({ status }) {
  const c = sc(status);
  const label = { pending:"⏳ Pending", hired:"✅ Hired", rejected:"❌ Rejected" }[status] || status;
  return (
    <span style={{ background:`${c}18`, color:c, border:`1px solid ${c}33`, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>
      {label}
    </span>
  );
}

export default function InterviewPage({ companyId, companyName }) {
  const API = "http://localhost:5000/api/interviews";
  const CID = companyId || "default";

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState("all");
  const [search, setSearch]         = useState("");
  const [viewModal, setViewModal]   = useState(null);
  const [toast, setToast]           = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [stats, setStats]           = useState({ total:0, pending:0, hired:0, rejected:0 });

  const appLink = `${window.location.origin}?apply=${CID}`;

  // ── Fetch all candidates ──────────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        axios.get(`${API}?companyId=${CID}`),
        axios.get(`${API}/stats/${CID}`),
      ]);
      setCandidates(listRes.data);
      setStats(statsRes.data);
    } catch {
      // Fallback: localStorage
      const local = JSON.parse(localStorage.getItem(`hr_candidates_${CID}`) || "[]");
      setCandidates(local);
      setStats({
        total: local.length,
        pending: local.filter(c => c.status === "pending").length,
        hired: local.filter(c => c.status === "hired").length,
        rejected: local.filter(c => c.status === "rejected").length,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [CID]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  // ── Update status ─────────────────────────────────────────────────────────
  const updateStatus = async (id, val) => {
    try {
      await axios.put(`${API}/${id}/status`, { status: val });
    } catch {
      // update locally anyway
    }
    setCandidates(prev => prev.map(c => (c._id || c.id) === id ? { ...c, status: val } : c));
    setStats(prev => {
      const old = candidates.find(c => (c._id || c.id) === id);
      const n = { ...prev };
      if (old?.status) n[old.status] = Math.max(0, n[old.status] - 1);
      n[val] = (n[val] || 0) + 1;
      return n;
    });
    showToast(`✅ Status updated → "${val}"`);
  };

  // ── Delete candidate ──────────────────────────────────────────────────────
  const deleteCandidate = async (id) => {
    if (!window.confirm("Delete this candidate record?")) return;
    try { await axios.delete(`${API}/${id}`); } catch {}
    setCandidates(prev => prev.filter(c => (c._id || c.id) !== id));
    setStats(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    showToast("🗑️ Deleted!");
  };

  // ── View resume (marks as viewed, auto-pending) ───────────────────────────
  const viewResume = async (c) => {
    const id = c._id || c.id;
    // Mark as viewed in backend
    try { await axios.put(`${API}/${id}`, { viewed: true }); } catch {}
    // Open resume URL
    if (c.resumeUrl) {
      window.open(`${API}/${id}/resume`, "_blank");
    } else if (c.resumeData) {
      const a = document.createElement("a");
      a.href = c.resumeData;
      a.download = c.resumeName || "resume";
      a.click();
    } else {
      showToast("❗ Resume not available");
      return;
    }
    showToast("📄 Opening resume...");
  };

  // ── Copy link ─────────────────────────────────────────────────────────────
  const copyLink = () => {
    navigator.clipboard.writeText(appLink).then(() => {
      setLinkCopied(true);
      showToast("📋 Link copied!");
      setTimeout(() => setLinkCopied(false), 2200);
    });
  };

  // ── Filter + Search ───────────────────────────────────────────────────────
  const displayed = candidates.filter(c => {
    const okFilter = filter === "all" || c.status === filter;
    const q = search.toLowerCase();
    const okSearch = !q ||
      (c.name  || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.role  || "").toLowerCase().includes(q);
    return okFilter && okSearch;
  });

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
  };

  const B = (color) => ({
    background: `linear-gradient(135deg,${color},${color}cc)`,
    color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px",
    fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit"
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, background:"#fff", border:"1.5px solid #22c55e", borderRadius:12, padding:"12px 20px", fontSize:13, fontWeight:700, color:"#22c55e", boxShadow:"0 8px 24px rgba(0,0,0,0.12)" }}>
          {toast}
        </div>
      )}

      {/* ── Application Link Banner ───────────────────────────────────────── */}
      <div style={{ background:"linear-gradient(135deg,#1e0a3c,#2d1057)", borderRadius:16, padding:"20px 24px", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap", boxShadow:"0 8px 24px rgba(59,7,100,0.25)" }}>
        <div style={{ width:42, height:42, borderRadius:12, background:"rgba(147,51,234,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>🔗</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>
            Candidate Application Link
          </div>
          <div style={{ fontSize:13, color:"#c084fc", fontFamily:"monospace", wordBreak:"break-all" }}>{appLink}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:4 }}>
            இந்த link-ஐ candidates-கு share பண்ணுங்க — apply link contains company ID
          </div>
        </div>
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          <button onClick={copyLink} style={{ background: linkCopied ? "rgba(34,197,94,0.2)" : "rgba(147,51,234,0.25)", border:`1px solid ${linkCopied ? "rgba(34,197,94,0.5)" : "rgba(147,51,234,0.5)"}`, borderRadius:9, padding:"9px 16px", color: linkCopied ? "#4ade80" : "#c084fc", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            {linkCopied ? "✅ Copied!" : "📋 Copy Link"}
          </button>
          <button onClick={() => window.open(appLink, "_blank")} style={{ background:"linear-gradient(135deg,#9333ea,#a855f7)", border:"none", borderRadius:9, padding:"9px 16px", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            👁 Preview Form
          </button>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="dash-stats" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[
          { t:"Total Applications", v:stats.total,    i:"🎯", c:"#9333ea" },
          { t:"Pending Review",     v:stats.pending,  i:"⏳", c:"#F59E0B" },
          { t:"Hired",              v:stats.hired,    i:"✅", c:"#22C55E" },
          { t:"Rejected",           v:stats.rejected, i:"❌", c:"#EF4444" },
        ].map(({ t, v, i, c }) => (
          <div key={t} style={{ background:"#fff", borderRadius:14, padding:"18px 16px", boxShadow:"0 4px 18px rgba(147,51,234,0.07)", border:"1px solid #ede9fe", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${c},${c}88)` }} />
            <div style={{ width:38, height:38, borderRadius:10, background:`${c}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, marginBottom:8 }}>{i}</div>
            <div style={{ fontSize:10, color:"#a78bfa", fontWeight:700, letterSpacing:0.5, marginBottom:2 }}>{t.toUpperCase()}</div>
            <div style={{ fontSize:26, fontWeight:800, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* ── Candidate Table ────────────────────────────────────────────────── */}
      <div style={{ background:"#fff", borderRadius:16, boxShadow:"0 4px 24px rgba(147,51,234,0.08)", border:"1px solid #ede9fe" }}>

        {/* Table toolbar */}
        <div style={{ padding:"18px 22px", borderBottom:"1px solid #ede9fe", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:T.text, flex:1 }}>All Candidates ({displayed.length})</h3>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>🔍</span>
            <input placeholder="Search name, role, email..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding:"9px 14px 9px 34px", border:"1.5px solid #ede9fe", borderRadius:10, fontSize:13, background:"#faf5ff", outline:"none", fontFamily:"inherit", color:T.text, width:240 }} />
          </div>
          {["all","pending","hired","rejected"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:"7px 14px", borderRadius:20, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:"1.5px solid", borderColor: filter === f ? sc(f === "all" ? "#9333ea" : f) : "#ede9fe", background: filter === f ? `${sc(f === "all" ? "#9333ea" : f)}15` : "#fff", color: filter === f ? sc(f === "all" ? "#9333ea" : f) : "#a78bfa" }}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <button onClick={fetchAll} style={{ background:"#f5f3ff", border:"1px solid #ede9fe", borderRadius:9, padding:"7px 12px", fontSize:12, color:T.muted, cursor:"pointer", fontFamily:"inherit" }}>🔄 Refresh</button>
        </div>

        {/* Table content */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"50px 20px", color:"#a78bfa" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>Loading candidates...
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"#a78bfa" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
            <div style={{ fontSize:16, fontWeight:700, color:T.text, marginBottom:6 }}>
              {candidates.length === 0 ? "No applications yet" : "No results found"}
            </div>
            <div style={{ fontSize:13 }}>{candidates.length === 0 ? "Share the link above to start receiving applications" : ""}</div>
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, minWidth:960 }}>
              <thead>
                <tr style={{ background:"linear-gradient(90deg,#f5f3ff,#faf5ff)" }}>
                  {["#","Candidate","Mobile","Experience","Role","Status","Applied Date","Resume","Actions"].map(col => (
                    <th key={col} style={{ padding:"11px 12px", textAlign:"left", color:"#7c3aed", fontWeight:700, fontSize:11, borderBottom:"2px solid #ede9fe", whiteSpace:"nowrap" }}>{col.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((c, i) => {
                  const id = c._id || c.id;
                  return (
                    <tr key={id || i} style={{ borderBottom:"1px solid #f3f0ff" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#faf5ff"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                      {/* # */}
                      <td style={{ padding:"12px 12px", fontSize:11, color:"#a78bfa", fontFamily:"monospace" }}>
                        {String(i + 1).padStart(3, "0")}
                      </td>

                      {/* Candidate name + email */}
                      <td style={{ padding:"12px 12px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#9333ea,#c084fc)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:11, fontWeight:700, flexShrink:0 }}>
                            {(c.name || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight:700, color:T.text, fontSize:13 }}>{c.name}</div>
                            <div style={{ fontSize:11, color:"#a78bfa" }}>{c.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Mobile */}
                      <td style={{ padding:"12px 12px", fontSize:12, color:T.text }}>{c.mobile || "—"}</td>

                      {/* Experience */}
                      <td style={{ padding:"12px 12px" }}>
                        {c.experience === "Fresher"
                          ? <span style={{ background:"rgba(34,197,94,0.12)", color:"#22C55E", border:"1px solid rgba(34,197,94,0.25)", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>🎓 Fresher</span>
                          : <span style={{ background:"rgba(147,51,234,0.12)", color:"#9333ea", border:"1px solid rgba(147,51,234,0.25)", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>💼 {c.years || "?"}y Exp</span>
                        }
                      </td>

                      {/* Role */}
                      <td style={{ padding:"12px 12px", fontWeight:600, color:T.text, fontSize:12, maxWidth:150, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.role || "—"}</td>

                      {/* Status dropdown */}
                      <td style={{ padding:"12px 12px" }}>
                        <select
                          value={c.status || "pending"}
                          onChange={e => updateStatus(id, e.target.value)}
                          style={{
                            background: c.status === "hired" ? "rgba(34,197,94,0.1)" : c.status === "rejected" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                            border: `1.5px solid ${sc(c.status || "pending")}44`,
                            borderRadius:8, padding:"5px 10px",
                            color: sc(c.status || "pending"),
                            fontSize:12, fontWeight:700, cursor:"pointer", outline:"none", fontFamily:"inherit"
                          }}>
                          <option value="pending">⏳ Pending</option>
                          <option value="hired">✅ Hired</option>
                          <option value="rejected">❌ Rejected</option>
                        </select>
                      </td>

                      {/* Applied Date */}
                      <td style={{ padding:"12px 12px", fontSize:12, color:"#a78bfa", fontFamily:"monospace", whiteSpace:"nowrap" }}>
                        {formatDate(c.createdAt || c.date)}
                      </td>

                      {/* Resume */}
                      <td style={{ padding:"12px 12px" }}>
                        {(c.resumeUrl || c.resumeData)
                          ? <button onClick={() => viewResume(c)} style={{ background:"rgba(147,51,234,0.1)", border:"1px solid rgba(147,51,234,0.25)", borderRadius:7, padding:"5px 12px", fontSize:11, color:"#9333ea", cursor:"pointer", fontWeight:700, fontFamily:"inherit", whiteSpace:"nowrap" }}>
                              📄 View
                            </button>
                          : <span style={{ fontSize:11, color:"#a78bfa" }}>—</span>
                        }
                      </td>

                      {/* Actions */}
                      <td style={{ padding:"12px 12px" }}>
                        <div style={{ display:"flex", gap:5 }}>
                          <button onClick={() => setViewModal(c)} style={{ background:"#f5f3ff", border:"1px solid #ede9fe", borderRadius:7, padding:"5px 10px", fontSize:12, color:"#7c3aed", cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>👤 View</button>
                          <button onClick={() => deleteCandidate(id)} style={{ background:"#fee2e2", border:"1px solid #fecaca", borderRadius:7, padding:"5px 10px", fontSize:12, color:"#ef4444", cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>🗑</button>
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

      {/* ── Candidate Detail Modal ─────────────────────────────────────────── */}
      {viewModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(59,7,100,0.55)", backdropFilter:"blur(8px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:680, maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 32px 80px rgba(147,51,234,0.25)" }}>

            {/* Modal header */}
            <div style={{ padding:"16px 22px", borderBottom:"1px solid #ede9fe", display:"flex", justifyContent:"space-between", alignItems:"center", background:"linear-gradient(90deg,#f5f3ff,#faf5ff)", flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,#9333ea,#c084fc)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:16, fontWeight:700 }}>
                  {(viewModal.name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize:16, fontWeight:800, color:T.text }}>{viewModal.name}</div>
                  <div style={{ fontSize:12, color:"#a78bfa" }}>{viewModal.email}</div>
                </div>
              </div>
              <button onClick={() => setViewModal(null)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#7c3aed", padding:"4px 8px" }}>✕</button>
            </div>

            {/* Modal body */}
            <div style={{ overflowY:"auto", padding:"22px", flex:1 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }} className="modal-2col">
                {[
                  { icon:"📱", label:"Mobile",      value: viewModal.mobile },
                  { icon:"💼", label:"Experience",  value: `${viewModal.experience}${viewModal.years ? ` — ${viewModal.years} years` : ""}` },
                  { icon:"🎯", label:"Applied Role", value: viewModal.role },
                  { icon:"📅", label:"Applied Date", value: formatDate(viewModal.createdAt || viewModal.date) },
                  { icon:"🔖", label:"Status",       value: <StatusBadge status={viewModal.status} /> },
                  { icon:"📝", label:"Notes",        value: viewModal.notes || "—" },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ background:"#faf5ff", borderRadius:10, padding:"12px 14px", border:"1px solid #ede9fe" }}>
                    <div style={{ fontSize:10, color:"#7c3aed", fontWeight:700, letterSpacing:0.5, marginBottom:5, textTransform:"uppercase" }}>{icon} {label}</div>
                    <div style={{ fontSize:14, fontWeight:600, color:T.text }}>{value || "—"}</div>
                  </div>
                ))}
              </div>

              {/* Resume section */}
              {(viewModal.resumeUrl || viewModal.resumeData) ? (
                <div style={{ background:"linear-gradient(135deg,#f5f3ff,#faf5ff)", borderRadius:12, padding:"20px", border:"1px solid #ede9fe", textAlign:"center" }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📄</div>
                  <div style={{ fontSize:14, color:"#9333ea", fontWeight:600, marginBottom:4 }}>{viewModal.resumeName || "Resume"}</div>
                  {viewModal.resumeSize && <div style={{ fontSize:12, color:"#a78bfa", marginBottom:14 }}>{viewModal.resumeSize}</div>}
                  <button onClick={() => viewResume(viewModal)} style={B("#9333ea")}>⬇️ Download / View Resume</button>
                </div>
              ) : (
                <div style={{ background:"#faf5ff", borderRadius:12, padding:"20px", border:"1px dashed #ede9fe", textAlign:"center", color:"#a78bfa", fontSize:13 }}>
                  No resume uploaded
                </div>
              )}

              {/* Inline status change */}
              <div style={{ marginTop:18, background:"#f5f3ff", borderRadius:12, padding:"16px", border:"1px solid #ede9fe" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#7c3aed", marginBottom:10, textTransform:"uppercase", letterSpacing:0.5 }}>Update Status</div>
                <div style={{ display:"flex", gap:8 }}>
                  {["pending","hired","rejected"].map(s => (
                    <button key={s} onClick={() => { updateStatus(viewModal._id || viewModal.id, s); setViewModal(p => ({ ...p, status: s })); }}
                      style={{ flex:1, padding:"10px", borderRadius:9, border:`1.5px solid ${sc(s)}44`, background: viewModal.status === s ? `${sc(s)}15` : "#fff", color: sc(s), fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                      {{ pending:"⏳ Pending", hired:"✅ Hired", rejected:"❌ Rejected" }[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
