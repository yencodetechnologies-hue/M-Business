// ═══════════════════════════════════════════════════════════════════════════════
// EmployeeProfilePanel.jsx  (updated — exposes doc status to parent)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";


const BASE = "http://localhost:m-business-tau.vercel.app/api/employee-dashboard";

export const DOC_TYPES = [
  { key:"aadhaar",  label:"Aadhaar Card",   icon:"🪪", desc:"Government issued identity card", color:"#f97316", accept:"image/*,application/pdf", maxMB:5  },
  { key:"pan",      label:"PAN Card",        icon:"💳", desc:"Permanent Account Number card",   color:"#6366f1", accept:"image/*,application/pdf", maxMB:5  },
  { key:"passbook", label:"Bank Passbook",   icon:"🏦", desc:"First page of bank passbook",     color:"#10b981", accept:"image/*,application/pdf", maxMB:10 },
];

const fmtSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1048576).toFixed(1)} MB`;
};

const isImage = (url="") => /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.startsWith("data:image");

function ProgressRing({ pct, color }) {
  const r=18, circ=2*Math.PI*r, dash=circ-(pct/100)*circ;
  return (
    <svg width="44" height="44" style={{ transform:"rotate(-90deg)" }}>
      <circle cx="22" cy="22" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4"/>
      <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${circ}`} strokeDashoffset={dash} strokeLinecap="round"
        style={{ transition:"stroke-dashoffset 0.3s" }}/>
    </svg>
  );
}

function DocCard({ doc, empName, onUploaded, notify }) {
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [preview,   setPreview]   = useState(null);
  const [existing,  setExisting]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const inputRef = useRef();

  useEffect(() => {
    if (!empName) return;
    axios.get(`${BASE}/documents/${encodeURIComponent(empName)}/${doc.key}`)
      .then(r => { if (r.data?.url) setExisting(r.data); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, [empName, doc.key]);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > doc.maxMB*1024*1024) { notify(`Max ${doc.maxMB}MB allowed.`,"error"); return; }
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(file);
    setUploading(true); setProgress(0);
    const fd = new FormData();
    fd.append("file", file); fd.append("employeeName", empName); fd.append("docType", doc.key);
    try {
      const res = await axios.post(`${BASE}/documents/upload`, fd, {
        headers:{ "Content-Type":"multipart/form-data" },
        onUploadProgress: e => setProgress(Math.round((e.loaded*100)/e.total)),
      });
      const saved = res.data.document || { url:preview, docType:doc.key };
      setExisting(saved);
      notify(`${doc.label} uploaded ✓`);
      if (onUploaded) onUploaded(doc.key, saved);
    } catch {
      const fallback = { url:preview, docType:doc.key, fileName:file.name, fileSize:file.size, uploadedAt:new Date().toISOString() };
      setExisting(fallback);
      notify(`${doc.label} saved locally ✓`);
      if (onUploaded) onUploaded(doc.key, fallback);
    } finally { setUploading(false); }
  };

  const handleDrop = e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); };

  const handleDelete = async () => {
    if (!window.confirm(`Remove uploaded ${doc.label}?`)) return;
    try { await axios.delete(`${BASE}/documents/${encodeURIComponent(empName)}/${doc.key}`); } catch {}
    setExisting(null); setPreview(null);
    notify(`${doc.label} removed`);
    if (onUploaded) onUploaded(doc.key, null);
  };

  const viewUrl = existing?.url || preview;
  const hasDoc  = !!viewUrl;

  return (
    <div style={{ background:"#fff", borderRadius:14, border:`1.5px solid ${hasDoc?doc.color+"40":"#f1f5f9"}`, overflow:"hidden", transition:"box-shadow 0.2s", boxShadow:hasDoc?`0 2px 16px ${doc.color}18`:"none" }}>
      {/* Header */}
      <div style={{ padding:"12px 14px", background:hasDoc?`${doc.color}08`:"#f8fafc", borderBottom:`1px solid ${hasDoc?doc.color+"20":"#f1f5f9"}`, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:`${doc.color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{doc.icon}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:800, color:"#0f172a" }}>{doc.label}</div>
          <div style={{ fontSize:11, color:"#94a3b8", marginTop:1 }}>{doc.desc}</div>
        </div>
        {loading
          ? <div style={{ width:20, height:20, borderRadius:"50%", border:"2px solid #e2e8f0", borderTopColor:doc.color, animation:"spin 0.8s linear infinite" }}/>
          : hasDoc
            ? <div style={{ display:"flex", alignItems:"center", gap:4, background:`${doc.color}15`, border:`1px solid ${doc.color}30`, borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700, color:doc.color }}>✓ Uploaded</div>
            : <div style={{ fontSize:11, color:"#cbd5e1", fontWeight:600 }}>Not uploaded</div>}
      </div>
      {/* Body */}
      <div style={{ padding:"12px 14px" }}>
        {uploading ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, padding:"12px 0" }}>
            <ProgressRing pct={progress} color={doc.color}/>
            <div style={{ fontSize:12, color:"#64748b", fontWeight:600 }}>Uploading… {progress}%</div>
          </div>
        ) : hasDoc ? (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {isImage(viewUrl)
              ? <div style={{ borderRadius:10, overflow:"hidden", border:"1px solid #f1f5f9", maxHeight:120, display:"flex", alignItems:"center", justifyContent:"center", background:"#f8fafc" }}>
                  <img src={viewUrl} alt={doc.label} style={{ maxWidth:"100%", maxHeight:120, objectFit:"contain" }}/>
                </div>
              : <div style={{ borderRadius:10, border:"1px solid #f1f5f9", padding:"14px", background:"#f8fafc", display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ fontSize:28 }}>📄</div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{existing?.fileName||`${doc.label}.pdf`}</div>
                    {existing?.fileSize && <div style={{ fontSize:11, color:"#94a3b8" }}>{fmtSize(existing.fileSize)}</div>}
                  </div>
                </div>}
            {existing?.uploadedAt && <div style={{ fontSize:10, color:"#94a3b8" }}>Uploaded: {new Date(existing.uploadedAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</div>}
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={()=>window.open(viewUrl,"_blank")} style={{ flex:1, padding:"7px 10px", background:`${doc.color}10`, border:`1px solid ${doc.color}30`, borderRadius:8, fontSize:11, fontWeight:700, color:doc.color, cursor:"pointer", fontFamily:"inherit" }}>👁 View</button>
              <button onClick={()=>inputRef.current?.click()} style={{ flex:1, padding:"7px 10px", background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:8, fontSize:11, fontWeight:700, color:"#475569", cursor:"pointer", fontFamily:"inherit" }}>🔄 Replace</button>
              <button onClick={handleDelete} style={{ padding:"7px 10px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, fontSize:11, fontWeight:700, color:"#ef4444", cursor:"pointer", fontFamily:"inherit" }}>🗑</button>
            </div>
          </div>
        ) : (
          <div onDragOver={e=>e.preventDefault()} onDrop={handleDrop} onClick={()=>inputRef.current?.click()}
            style={{ border:`2px dashed ${doc.color}40`, borderRadius:10, padding:"18px 12px", textAlign:"center", cursor:"pointer", background:`${doc.color}05`, transition:"all 0.15s" }}
            onMouseEnter={e=>{ e.currentTarget.style.background=`${doc.color}10`; e.currentTarget.style.borderColor=`${doc.color}80`; }}
            onMouseLeave={e=>{ e.currentTarget.style.background=`${doc.color}05`; e.currentTarget.style.borderColor=`${doc.color}40`; }}>
            <div style={{ fontSize:24, marginBottom:6 }}>☁️</div>
            <div style={{ fontSize:12, fontWeight:700, color:doc.color, marginBottom:3 }}>Click or drag to upload</div>
            <div style={{ fontSize:10, color:"#94a3b8" }}>JPG, PNG or PDF · Max {doc.maxMB}MB</div>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept={doc.accept} style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])}/>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYEE PROFILE PANEL
// NEW PROP: onDocStatusChange(statusMap) — called whenever any doc is uploaded/deleted
// ═══════════════════════════════════════════════════════════════════════════════
export function EmployeeProfilePanel({ empName, user, notify, onDocStatusChange, forceOpen, onClose: onCloseExternal }) {
  const [open,      setOpen]      = useState(false);

  // Support forceOpen from parent (e.g. Dashboard "Upload" button)
useEffect(() => { 
  if (forceOpen) setOpen(true); 
}, [forceOpen]);

// Panel close ஆகும்போது parent-க்கு notify பண்ணணும்
const handleClose = () => {
  setOpen(false);
  if (onCloseExternal) onCloseExternal();
};
  const [docStatus, setDocStatus] = useState({});   // { aadhaar: docObj|null, pan: ..., passbook: ... }

  const initials     = (empName||"E").slice(0,2).toUpperCase();
  const uploadedCount = Object.values(docStatus).filter(Boolean).length;

  // Notify parent whenever docStatus changes
  useEffect(() => {
    if (onDocStatusChange) onDocStatusChange(docStatus);
  }, [docStatus, onDocStatusChange]);

  const handleUploaded = useCallback((key, doc) => {
    setDocStatus(prev => ({ ...prev, [key]: doc || null }));
  }, []);

  // Fetch existing on mount
  useEffect(() => {
    if (!empName) return;
    const enc = encodeURIComponent(empName);
    DOC_TYPES.forEach(dt => {
      axios.get(`${BASE}/documents/${enc}/${dt.key}`)
        .then(r => { if (r.data?.url) setDocStatus(prev=>({ ...prev, [dt.key]:r.data })); })
        .catch(()=>{});
    });
  }, [empName]);

  return (
    <>
      {/* Floating trigger */}
      <button onClick={()=>setOpen(true)} title="My Profile & Documents"
        style={{ position:"fixed", top:16, right:16, zIndex:200, width:48, height:48, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 18px rgba(99,102,241,0.45)", transition:"transform 0.2s", flexDirection:"column" }}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.08)"}
        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        <span style={{ color:"#fff", fontWeight:800, fontSize:14, lineHeight:1 }}>{initials}</span>
        {uploadedCount < DOC_TYPES.length && (
          <span style={{ position:"absolute", top:-3, right:-3, width:16, height:16, borderRadius:"50%", background:"#ef4444", border:"2px solid #fff", fontSize:8, fontWeight:800, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {DOC_TYPES.length - uploadedCount}
          </span>
        )}
      </button>

      {open && <div onClick={()=>setOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.4)", zIndex:997, backdropFilter:"blur(2px)" }}/>}

      <div style={{ position:"fixed", top:0, right:0, bottom:0, width:340, background:"#fff", zIndex:998, boxShadow:"-8px 0 40px rgba(99,102,241,0.18)", transform:open?"translateX(0)":"translateX(100%)", transition:"transform 0.3s cubic-bezier(0.4,0,0.2,1)", display:"flex", flexDirection:"column", overflowY:"auto" }}>
        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#0f172a,#1e1b4b)", padding:"20px 18px 16px", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:700, letterSpacing:1.2, textTransform:"uppercase" }}>My Profile</div>
            <button onClick={()=>setOpen(false)} style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, width:28, height:28, cursor:"pointer", color:"rgba(255,255,255,0.6)", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, color:"#fff", flexShrink:0, border:"2px solid rgba(255,255,255,0.2)" }}>{initials}</div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:"#fff" }}>{empName||"Employee"}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginTop:2 }}>{user?.department||"Employee"} · {user?.role||"Staff"}</div>
            </div>
          </div>
          <div style={{ marginTop:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)", fontWeight:700 }}>DOCUMENTS UPLOADED</span>
              <span style={{ fontSize:10, color:"#a5b4fc", fontWeight:800 }}>{uploadedCount}/{DOC_TYPES.length}</span>
            </div>
            <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:99, height:5 }}>
              <div style={{ width:`${(uploadedCount/DOC_TYPES.length)*100}%`, background:uploadedCount===DOC_TYPES.length?"linear-gradient(90deg,#10b981,#34d399)":"linear-gradient(90deg,#6366f1,#a78bfa)", borderRadius:99, height:"100%", transition:"width 0.5s" }}/>
            </div>
          </div>
        </div>

        {/* Employee info */}
        {user && (
          <div style={{ padding:"14px 16px", borderBottom:"1px solid #f1f5f9", background:"#f8fafc" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[["📧","Email",user.email],["📱","Phone",user.phone],["🏢","Dept",user.department],["💰","Salary",user.salary]]
                .filter(([,,v])=>v)
                .map(([icon,label,value])=>(
                  <div key={label} style={{ background:"#fff", borderRadius:8, padding:"8px 10px", border:"1px solid #f1f5f9" }}>
                    <div style={{ fontSize:9, color:"#94a3b8", fontWeight:700, letterSpacing:0.5, textTransform:"uppercase" }}>{icon} {label}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:"#0f172a", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value}</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Documents section */}
        <div style={{ padding:"14px 16px", flex:1 }}>
          <div style={{ fontSize:12, fontWeight:800, color:"#0f172a", marginBottom:12, display:"flex", alignItems:"center", gap:6 }}>
            📂 My Documents
            {uploadedCount < DOC_TYPES.length && (
              <span style={{ background:"#fef3c7", border:"1px solid #fde68a", borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700, color:"#d97706" }}>{DOC_TYPES.length-uploadedCount} pending</span>
            )}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {DOC_TYPES.map(dt=>(
              <DocCard key={dt.key} doc={dt} empName={empName} onUploaded={handleUploaded} notify={notify}/>
            ))}
          </div>
          {uploadedCount===DOC_TYPES.length && (
            <div style={{ marginTop:14, background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", border:"1px solid #bbf7d0", borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ fontSize:22 }}>🎉</div>
              <div>
                <div style={{ fontSize:12, fontWeight:800, color:"#166534" }}>All documents uploaded!</div>
                <div style={{ fontSize:11, color:"#15803d", marginTop:2 }}>Your profile is complete.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export { DOC_TYPES as default };

export function SubAdminDocumentsPage({ employees = [] }) {
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState(null);
  const [docData, setDocData] = React.useState({});
  const [loadingDocs, setLoadingDocs] = React.useState(false);
  const [docStatusMap, setDocStatusMap] = React.useState({});

  React.useEffect(() => {
    employees.forEach((emp) => {
      if (!emp.name) return;
      axios.get(`${BASE}/documents/${encodeURIComponent(emp.name)}/all`)
        .then(r => {
          const uploaded = (r.data || []).map(d => d.docType);
          setDocStatusMap(prev => ({ ...prev, [emp.name]: uploaded }));
        })
        .catch(() => {
          setDocStatusMap(prev => ({ ...prev, [emp.name]: [] }));
        });
    });
  }, [employees]);

  const loadEmployeeDocs = async (emp) => {
    setSelected(emp);
    setLoadingDocs(true);
    try {
      const r = await axios.get(`${BASE}/documents/${encodeURIComponent(emp.name)}/all`);
      const map = {};
      (r.data || []).forEach(d => { map[d.docType] = d; });
      setDocData(map);
    } catch { setDocData({}); }
    finally { setLoadingDocs(false); }
  };

  const filtered = employees.filter(e =>
    (e.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const isImage = (url = "") => /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.startsWith("data:image");
  const fmtSize = (b) => !b ? "" : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #ede9fe", padding:"16px 18px" }}>
        <div style={{ fontSize:14, fontWeight:800, color:"#1e0a3c", marginBottom:14 }}>📂 Employee Documents</div>
        <div style={{ position:"relative", marginBottom:14 }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }}>🔍</span>
          <input placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:"100%", padding:"9px 12px 9px 34px", border:"1.5px solid #ede9fe", borderRadius:10, fontSize:13, outline:"none", fontFamily:"inherit", background:"#faf5ff", boxSizing:"border-box" }}/>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"#f5f3ff" }}>
                {["Employee","Aadhaar","PAN Card","Bank Passbook","Action"].map(h => (
                  <th key={h} style={{ padding:"9px 12px", textAlign:"left", fontSize:10, fontWeight:700, color:"#7c3aed", borderBottom:"2px solid #ede9fe", whiteSpace:"nowrap" }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={5} style={{ padding:30, textAlign:"center", color:"#a78bfa" }}>No employees found</td></tr>
                : filtered.map((emp, i) => {
                    const uploaded = docStatusMap[emp.name] || [];
                    const isSel = selected?.name === emp.name;
                    return (
                      <tr key={i} style={{ borderBottom:"1px solid #f5f3ff", background: isSel ? "#f3e8ff" : "transparent" }}>
                        <td style={{ padding:"11px 12px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#9333ea,#c084fc)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:11, fontWeight:700 }}>
                              {(emp.name||"?")[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight:700, color:"#1e0a3c", fontSize:12 }}>{emp.name}</div>
                              <div style={{ fontSize:10, color:"#a78bfa" }}>{emp.department||emp.role||""}</div>
                            </div>
                          </div>
                        </td>
                        {DOC_TYPES.map(dt => {
                          const has = uploaded.includes(dt.key);
                          return (
                            <td key={dt.key} style={{ padding:"11px 12px" }}>
                              <span style={{ background: has ? `${dt.color}15` : "#f1f5f9", border:`1px solid ${has ? dt.color+"30" : "#e2e8f0"}`, borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700, color: has ? dt.color : "#94a3b8" }}>
                                {has ? "✓ Done" : "✗ Missing"}
                              </span>
                            </td>
                          );
                        })}
                        <td style={{ padding:"11px 12px" }}>
                          <button onClick={() => loadEmployeeDocs(emp)}
                            style={{ padding:"5px 12px", background: isSel ? "#9333ea" : "rgba(147,51,234,0.08)", border:`1px solid ${isSel ? "#9333ea" : "rgba(147,51,234,0.25)"}`, borderRadius:8, fontSize:11, fontWeight:700, color: isSel ? "#fff" : "#9333ea", cursor:"pointer", fontFamily:"inherit" }}>
                            {isSel ? "Viewing" : "👁 View"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #ede9fe", padding:"16px 18px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:800, color:"#1e0a3c" }}>📄 {selected.name} — Documents</div>
            <button onClick={() => setSelected(null)} style={{ background:"none", border:"none", fontSize:16, cursor:"pointer", color:"#a78bfa" }}>✕</button>
          </div>
          {loadingDocs ? (
            <div style={{ textAlign:"center", padding:"2rem", color:"#a78bfa" }}>Loading...</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {DOC_TYPES.map(dt => {
                const doc = docData[dt.key];
                const hasDoc = !!doc?.url;
                return (
                  <div key={dt.key} style={{ border:`1.5px solid ${hasDoc ? dt.color+"35" : "#f1f5f9"}`, borderRadius:12, padding:"12px 14px", background: hasDoc ? `${dt.color}04` : "#f8fafc" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom: hasDoc ? 10 : 0 }}>
                      <span style={{ fontSize:18 }}>{dt.icon}</span>
                      <div style={{ flex:1, fontWeight:700, fontSize:13, color:"#1e0a3c" }}>{dt.label}</div>
                      {hasDoc
                        ? <span style={{ background:`${dt.color}15`, border:`1px solid ${dt.color}30`, borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700, color:dt.color }}>✓ Uploaded</span>
                        : <span style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700, color:"#ef4444" }}>✗ Missing</span>}
                    </div>
                    {hasDoc && (
                      <div>
                        {isImage(doc.url)
                          ? <img src={doc.url} alt={dt.label} style={{ width:"100%", maxHeight:140, objectFit:"contain", borderRadius:8, border:"1px solid #f1f5f9" }}/>
                          : <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:"#fff", borderRadius:8, border:"1px solid #f1f5f9" }}>
                              <span style={{ fontSize:22 }}>📄</span>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:11, fontWeight:700, color:"#1e0a3c" }}>{doc.fileName || `${dt.label}.pdf`}</div>
                                {doc.fileSize && <div style={{ fontSize:10, color:"#94a3b8" }}>{fmtSize(doc.fileSize)}</div>}
                              </div>
                            </div>}
                        <div style={{ display:"flex", gap:6, marginTop:8 }}>
                          <button onClick={() => window.open(doc.url,"_blank")} style={{ flex:1, padding:"6px 10px", background:`${dt.color}10`, border:`1px solid ${dt.color}30`, borderRadius:7, fontSize:11, fontWeight:700, color:dt.color, cursor:"pointer", fontFamily:"inherit" }}>👁 View</button>
                          <a href={doc.url} download style={{ flex:1, padding:"6px 10px", background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:7, fontSize:11, fontWeight:700, color:"#475569", textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center" }}>⬇ Download</a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
