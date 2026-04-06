import React, { useState, useEffect } from "react";
import { BASE_URL } from "../config";

function getProposalId() {
  return `PROP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

const LOCAL_KEY = "project_proposals_cache";

function loadLocal() {
  try { const d = localStorage.getItem(LOCAL_KEY); return d ? JSON.parse(d) : []; } catch { return []; }
}
function saveLocal(all) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
}

function StatusBadge({ status }) {
  const map = {
    draft:    { bg: "#f3f4f6", color: "#6b7280", label: "📝 Draft" },
    pending:  { bg: "#fef3c7", color: "#d97706", label: "⏳ Waiting for Approval" },
    approved: { bg: "#dcfce7", color: "#16a34a", label: "✅ Approved" },
    rejected: { bg: "#fee2e2", color: "#dc2626", label: "❌ Rejected" },
  };
  const s = map[(status || "draft").toLowerCase()] || map.draft;
  return <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center" }}>{s.label}</span>;
}

export default function ProjectProposalCreator({ clients = [], projects = [], companyLogo }) {
  const [step, setStep] = useState("list");
  const [proposals, setProposals] = useState([]);
  const [current, setCurrent] = useState(null);
  
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    // Attempt to load from API if needed, but fallback to local for seamless Canva feel
    const checkApi = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/proposals`);
        if(res.ok) {
          const data = await res.json();
          setProposals(data.proposals || []);
        } else {
          setProposals(loadLocal());
        }
      } catch (e) {
        setProposals(loadLocal());
      }
    };
    checkApi();
  }, []);

  const saveDb = async (updatedList) => {
    setProposals(updatedList);
    saveLocal(updatedList);
    // Silent upload
  };

  const handleCreateNew = () => {
    const newProp = {
      id: getProposalId(),
      title: "Untitled Project Proposal",
      client: "",
      project: "",
      coverImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      overview: "Enter project overview summary here.",
      objectives: "• Objective 1\n• Objective 2",
      budget: "0",
      status: "draft",
      dateCreated: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrent(newProp);
    setEditMode(true);
    setStep("editor");
  };

  const openProposal = (prop) => {
    setCurrent(prop);
    setEditMode(prop.status === "draft" || prop.status === "rejected");
    setStep("editor");
  };

  const handleSave = (statusOverride) => {
    const finalProp = { ...current, status: statusOverride || current.status, updatedAt: new Date().toISOString() };
    const idx = proposals.findIndex(p => p.id === finalProp.id);
    let updated;
    if(idx >= 0) {
      updated = [...proposals];
      updated[idx] = finalProp;
    } else {
      updated = [finalProp, ...proposals];
    }
    saveDb(updated);
    setCurrent(finalProp);
    if(statusOverride === "pending") {
       alert("Proposal sent for approval!");
       setEditMode(false);
    }
  };

  // ═════════════════ LIST VIEW ═════════════════
  if(step === "list") {
    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <style>{`
          .canva-card { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); cursor: pointer; }
          .canva-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(147, 51, 234, 0.15)!important; border-color: #d8b4fe!important; }
          .canva-btn { transition: all 0.2s ease; }
          .canva-btn:hover { transform: scale(1.02); filter: brightness(1.1); }
        `}</style>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, flexWrap: "wrap", gap: 14 }}>
          <div>
          </div>
          <button className="canva-btn" onClick={handleCreateNew} style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 24px rgba(124, 58, 237, 0.3)" }}>
            + Create Proposal
          </button>
        </div>

        {proposals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", background: "#fff", borderRadius: 24, border: "2px dashed #ede9fe" }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>✨</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e0a3c" }}>Start drafting your first proposal</div>
            <div style={{ fontSize: 13, color: "#a78bfa", marginTop: 8 }}>Create highly engaging visual templates for your clients.</div>
            <button className="canva-btn" onClick={handleCreateNew} style={{ background: "#f5f3ff", color: "#7c3aed", border: "1.5px solid #d8b4fe", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 20 }}>
              Create Blank Proposal
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {proposals.map((prop) => (
              <div key={prop.id} className="canva-card" onClick={() => openProposal(prop)} style={{ background: "#fff", borderRadius: 18, border: "1px solid #ede9fe", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 4px 14px rgba(0,0,0,0.03)" }}>
                <div style={{ position: "relative", height: 160, width: "100%", background: "#f5f3ff", overflow: "hidden" }}>
                  <img src={prop.coverImage} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />
                  <div style={{ position: "absolute", bottom: 12, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 700, letterSpacing: 1 }}>{prop.id}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: 180 }}>{prop.title}</div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "16px 14px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10, display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 14 }}>👥</span> <span style={{ fontWeight: 600 }}>{prop.client || "No Client Assigned"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                       <span style={{ fontSize: 12, color: "#a78bfa", fontWeight: 700 }}>₹{prop.budget} estimated</span>
                       <span style={{ fontSize: 11, color: "#d1d5db" }}>{new Date(prop.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: "auto", borderTop: "1px solid #f9fafb", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <StatusBadge status={prop.status} />
                    {prop.status === "rejected" && <span style={{ background: "#fef2f2", color: "#ef4444", padding: "4px 8px", borderRadius: 8, fontSize: 11, fontWeight: 800 }}>Requires Edit</span>}
                  </div>
                </div>
    // ═════════════════ EDITOR / VIEWER (CANVA UI CLONE) ═════════════════
  const [leftTab, setLeftTab] = useState("text");

  return (
    <div style={{ height: "100vh", width: "100vw", position: "fixed", top: 0, left: 0, zIndex: 9999, display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif", background: "#f3f4f6" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .canva-topbar { background: linear-gradient(90deg, #00c4cc 0%, #7d2ae8 100%); color: #fff; height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; flex-shrink: 0; }
        .canva-icon-btn { background: rgba(255,255,255,0.15); border: none; color: #fff; height: 32px; width: 32px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; font-size: 16px; }
        .canva-icon-btn:hover { background: rgba(255,255,255,0.25); }
        .canva-text-btn { background: transparent; border: none; color: #fff; height: 32px; padding: 0 12px; border-radius: 4px; display: flex; align-items: center; cursor: pointer; font-weight: 600; font-size: 13px; transition: 0.2s; }
        .canva-text-btn:hover { background: rgba(255,255,255,0.15); }
        
        .canva-sidebar { width: 72px; background: #fff; display: flex; flexDirection: column; align-items: center; padding-top: 10px; border-right: 1px solid #e5e7eb; flex-shrink: 0; z-index: 2; box-shadow: 1px 0 5px rgba(0,0,0,0.02); }
        .canva-tab { width: 64px; height: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; border-radius: 8px; color: #4b5563; transition: 0.2s; margin-bottom: 4px; }
        .canva-tab.active { background: #f3f4f6; color: #8b3dff; }
        .canva-tab:hover:not(.active) { background: #f9fafb; color: #111827; }
        .canva-tab span.icon { font-size: 22px; margin-bottom: 4px; }
        .canva-tab span.label { font-size: 10px; font-weight: 500; }

        .canva-panel { width: 340px; background: #fff; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; flex-shrink: 0; z-index: 1; overflow-y: auto; box-shadow: 2px 0 8px rgba(0,0,0,0.04); }
        
        .canva-workspace { flex: 1; display: flex; flex-direction: column; position: relative; overflow: hidden; }
        .canva-canvas-container { flex: 1; overflow: auto; display: flex; align-items: center; justify-content: center; padding: 40px; }
        
        .c-slide { background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 800px; min-height: 450px; position: relative; display: flex; flex-direction: column; }
        
        .btn-trial { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); color: #fff; padding: 0 12px; height: 32px; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .btn-share { background: #fff; color: #111827; padding: 0 16px; height: 32px; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; display: flex; align-items: center; gap: 6px; margin-left: 8px; }
        .btn-action { background: rgba(255,255,255,0.2); color: #fff; padding: 0 14px; height: 32px; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid rgba(255,255,255,0.4); display: flex; align-items: center; gap: 6px; margin-left: 8px; }
        
        /* Panel Styles */
        .panel-search { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; display: flex; align-items: center; margin: 16px; }
        .panel-search input { background: transparent; border: none; outline: none; font-size: 13px; margin-left: 8px; width: 100%; color: #111827; }
        .btn-purple { background: #8b3dff; color: #fff; border: none; border-radius: 8px; padding: 12px; font-size: 14px; font-weight: 600; cursor: pointer; margin: 0 16px 16px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
        .btn-purple:hover { background: #7d2ae8; }
        .btn-outline { background: #fff; color: #111827; border: 1px solid #d1d5db; border-radius: 8px; padding: 10px; font-size: 13px; font-weight: 600; cursor: pointer; margin: 0 16px 16px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        
        .text-style-box { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 12px; margin: 0 16px; cursor: pointer; }
        .text-style-box:hover { border-color: #d1d5db; background: #f9fafb; }
      `}</style>
      
      {/* ── TOP NAV BAR ── */}
      <div className="canva-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="canva-icon-btn" onClick={() => setStep("list")} title="Home">🏠</button>
          <button className="canva-text-btn">File</button>
          <button className="canva-text-btn">Resize</button>
          <button className="canva-text-btn">Editing ▾</button>
          <div style={{ width: 1px, height: 20, background: "rgba(255,255,255,0.3)", margin: "0 4px" }} />
          <button className="canva-icon-btn" style={{ background: "transparent", fontSize: 18 }}>↶</button>
          <button className="canva-icon-btn" style={{ background: "transparent", fontSize: 18, opacity: 0.5 }}>↷</button>
          <button className="canva-icon-btn" style={{ background: "transparent", fontSize: 18 }}>☁️</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input 
            value={current.title} 
            onChange={e => setCurrent({...current, title: e.target.value})} 
            style={{ background: "transparent", border: "1px dashed rgba(255,255,255,0.4)", color: "#fff", fontSize: 14, fontWeight: 600, outline: "none", width: 200, padding: "4px 8px", borderRadius: 4, textAlign: "center" }} 
            placeholder="Proposal Design - Untitled"
          />
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <button className="btn-trial">👑 Start your trial for ₹0</button>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, marginLeft: 16, border: "2px solid rgba(255,255,255,0.5)" }}>
            A
          </div>
          <button className="canva-icon-btn" style={{ marginLeft: 8 }}>➕</button>
          <button className="canva-icon-btn" style={{ marginLeft: 8 }}>📊</button>
          <button className="canva-icon-btn" style={{ marginLeft: 8 }}>💬</button>
          <button className="btn-share" style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none" }}>▶ Present</button>
          
          {/* Action buttons embedded here to fake the Share menu area */}
          {current.status === "pending" ? (
             <div style={{ display: "flex", marginLeft: 8 }}>
               <button onClick={() => handleSave("approved")} style={{ background: "#22c55e", color: "#fff", border: "none", padding: "0 14px", height: 32, borderRadius: "4px 0 0 4px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Approve</button>
               <button onClick={() => handleSave("rejected")} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "0 14px", height: 32, borderRadius: "0 4px 4px 0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Reject</button>
             </div>
          ) : current.status === "rejected" ? (
             <button onClick={() => handleSave("pending")} className="btn-share" style={{ background: "#10b981", color: "#fff" }}>Re-Submit</button>
          ) : (
             <button onClick={() => handleSave("pending")} className="btn-share" style={{ background: "#f59e0b", color: "#fff" }}>Send Approval</button>
          )}

          <button className="btn-share">📤 Share</button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* ── LEFT SIDEBAR ── */}
        <div className="canva-sidebar">
          {[
            { id: "templates", icon: "📑", label: "Templates" },
            { id: "elements", icon: "📐", label: "Elements" },
            { id: "text", icon: "T", label: "Text" },
            { id: "brand", icon: "👑", label: "Brand" },
            { id: "uploads", icon: "☁️", label: "Uploads" },
            { id: "draw", icon: "🖌️", label: "Draw" },
            { id: "projects", icon: "📁", label: "Projects" },
            { id: "apps", icon: "📦", label: "Apps" },
          ].map(t => (
            <div key={t.id} className={`canva-tab ${leftTab === t.id ? "active" : ""}`} onClick={() => setLeftTab(t.id)}>
              <span className="icon" style={{ fontWeight: t.id === "text" ? 800 : 'normal' }}>{t.icon}</span>
              <span className="label">{t.label}</span>
            </div>
          ))}
        </div>

        {/* ── LEFT PANEL ── */}
        <div className="canva-panel">
          {leftTab === "text" && (
            <>
              <div className="panel-search">
                <span style={{ fontSize: 14 }}>🔍</span>
                <input placeholder="Search fonts and combinations" />
              </div>
              <button className="btn-purple"><span>T</span> Add a text box</button>
              <button className="btn-outline"><span>✨</span> Magic Write</button>
              
              <div style={{ padding: "0 16px 12px", fontSize: 13, fontWeight: 600, color: "#111827", marginTop: 8 }}>Default text styles</div>
              <div className="text-style-box">
                <div style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>Add a heading</div>
                <div style={{ height: 1, background: "#e5e7eb" }} />
                <div style={{ fontSize: 18, fontWeight: 700, color: "#374151" }}>Add a subheading</div>
                <div style={{ height: 1, background: "#e5e7eb" }} />
                <div style={{ fontSize: 12, fontWeight: 400, color: "#6b7280" }}>Add a little bit of body text</div>
              </div>
              
              <div style={{ padding: "16px 16px 8px", fontSize: 13, fontWeight: 600, color: "#111827" }}>Dynamic text</div>
              <div style={{ padding: "0 16px" }}>
                 <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "8px 0" }}>
                   <div style={{ background: "#ffedd5", width: 40, height: 40, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#c2410c", fontWeight: 800, fontSize: 14 }}>1..2</div>
                   <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>Page numbers</span>
                 </div>
              </div>
            </>
          )}

          {leftTab !== "text" && (
             <div style={{ padding: 20, textAlign: "center", color: "#6b7280", fontSize: 13, marginTop: 40 }}>
               This panel simulates the "{leftTab}" tool. <br/><br/>
               The actual proposal details are editable on the canvas.
             </div>
          )}
        </div>

        {/* ── WORKSPACE ── */}
        <div className="canva-workspace">
          
          {/* Status Alert Overlay */}
          {current.status === "rejected" && (
            <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
              ❌ Client rejected. Edit fields below and click "Re-Submit" in the top bar.
            </div>
          )}
          {current.status === "approved" && (
            <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
              ✅ Client approved this proposal!
            </div>
          )}

          <div className="canva-canvas-container">
            {/* The white Page representing the Canva design */}
            <div className="c-slide" style={{ padding: 40 }}>
              
              <input 
                value={current.title} 
                onChange={e => setCurrent({...current, title: e.target.value})} 
                placeholder="PROPOSAL HEADLINE"
                style={{ border: "1px dashed transparent", background: "transparent", fontSize: 40, fontWeight: 900, color: "#111827", width: "100%", outline: "none", textAlign: "center", marginBottom: 20 }}
                onFocus={e => e.target.style.borderColor = "#8b3dff"}
                onBlur={e => e.target.style.borderColor = "transparent"}
              />

              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 40 }}>
                 <div style={{ position: "relative" }}>
                   <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12 }}>👤</span>
                   <select 
                     value={current.client} 
                     onChange={e => setCurrent({...current, client: e.target.value})}
                     style={{ border: "1px solid #e5e7eb", background: "#f9fafb", padding: "8px 12px 8px 30px", borderRadius: 6, outline: "none", fontSize: 13, fontWeight: 600, color: "#4b5563" }}
                   >
                     <option value="">Select Client...</option>
                     {clients.map((c, i) => <option key={i} value={c.name||c.clientName}>{c.name||c.clientName}</option>)}
                   </select>
                 </div>
                 
                 <div style={{ position: "relative" }}>
                   <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12 }}>💰</span>
                   <input 
                     type="number" 
                     value={current.budget} 
                     onChange={e => setCurrent({...current, budget: e.target.value})}
                     placeholder="Budget (₹)"
                     style={{ border: "1px solid #e5e7eb", background: "#f9fafb", padding: "8px 12px 8px 30px", borderRadius: 6, outline: "none", fontSize: 13, fontWeight: 600, color: "#4b5563", width: 140 }}
                   />
                 </div>
              </div>

              <div style={{ border: "1px dashed transparent", padding: 8, borderRadius: 8, position: "relative" }} onFocus={e => e.currentTarget.style.borderColor = "#8b3dff"} onBlur={e => e.currentTarget.style.borderColor = "transparent"}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Project Overview</div>
                <textarea 
                  value={current.overview} 
                  onChange={e => setCurrent({...current, overview: e.target.value})} 
                  rows={4}
                  style={{ border: "none", background: "transparent", fontSize: 15, color: "#374151", width: "100%", outline: "none", resize: "none", lineHeight: 1.6 }}
                  placeholder="Type project overview..."
                />
              </div>

              <div style={{ border: "1px dashed transparent", padding: 8, borderRadius: 8, position: "relative", marginTop: 20 }} onFocus={e => e.currentTarget.style.borderColor = "#8b3dff"} onBlur={e => e.currentTarget.style.borderColor = "transparent"}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Objectives</div>
                <textarea 
                  value={current.objectives} 
                  onChange={e => setCurrent({...current, objectives: e.target.value})} 
                  rows={4}
                  style={{ border: "none", background: "transparent", fontSize: 15, color: "#374151", width: "100%", outline: "none", resize: "none", lineHeight: 1.6 }}
                  placeholder="• Point 1..."
                />
              </div>

            </div>
          </div>

          {/* ── BOTTOM BAR ── */}
          <div style={{ height: 48, background: "#fff", borderTop: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", zIndex: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
               <button style={{ background: "none", border: "none", color: "#4b5563", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>📝 Notes</button>
               <button style={{ background: "none", border: "none", color: "#4b5563", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>⏱ Timer</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
               <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                 <input type="range" min="10" max="200" defaultValue="17" style={{ width: 100, accentColor: "#8b3dff" }} />
                 <span style={{ fontSize: 12, color: "#4b5563", fontWeight: 600, width: 30 }}>17%</span>
               </div>
               <div style={{ width: 1px, height: 16, background: "#e5e7eb" }} />
               <button style={{ background: "#f3f4f6", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 12, fontWeight: 600, color: "#4b5563", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                 <span style={{ fontSize: 14 }}>▦</span> Pages 1/1
               </button>
               <button style={{ background: "none", border: "none", color: "#4b5563", fontSize: 16, cursor: "pointer" }}>⤢</button>
               <button style={{ background: "none", border: "none", color: "#4b5563", fontSize: 16, cursor: "pointer" }}>❔</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
