// EmployeeDashboard.jsx  — Dashboard page-ல் Employee Documents card சேர்க்கப்பட்டது

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { EmployeeProfilePanel, DOC_TYPES } from "./EmployeeProfilePanel";

const BASE = "/api/employee-dashboard";

const sc = (s) => ({
  active:"#6366f1","in progress":"#6366f1",
  review:"#f59e0b","in review":"#f59e0b",pending:"#f59e0b",
  done:"#10b981",completed:"#10b981",
  high:"#ef4444",medium:"#f59e0b",low:"#10b981",
  present:"#10b981",absent:"#ef4444",leave:"#f59e0b",holiday:"#8b5cf6",
  approved:"#10b981",rejected:"#ef4444",overdue:"#ef4444",
  cancelled:"#94a3b8",
}[(s||"").toLowerCase()]||"#6366f1");

const NAV = [
  { key:"dashboard",  icon:"⌂", label:"Dashboard"   },
  { key:"projects",   icon:"◈", label:"My Projects"  },
  { key:"tasks",      icon:"◉", label:"My Tasks"     },
  { key:"attendance", icon:"◷", label:"Attendance"   },
  { key:"salary",     icon:"◆", label:"Salary Slip"  },
];

const SEED_PROJECTS = [
  { _id:"p1", name:"E-Commerce Revamp",  client:"Nila Retail", budget:"₹1,20,000", deadline:"2026-03-28", status:"active", progress:65 },
  { _id:"p2", name:"HR Portal",          client:"TechCorp",    budget:"₹95,000",   deadline:"2026-04-10", status:"review", progress:85 },
  { _id:"p3", name:"Mobile App Design",  client:"Kavi Labs",   budget:"₹75,000",   deadline:"2026-03-22", status:"active", progress:40 },
];
const SEED_TASKS = [
  { _id:"t1", title:"Homepage wireframe review",     project:"E-Commerce Revamp", priority:"High",   status:"done",        dueDate:"2026-03-10", description:"Review all desktop and mobile layouts" },
  { _id:"t2", title:"UI Component library approval", project:"E-Commerce Revamp", priority:"High",   status:"in progress", dueDate:"2026-03-22", description:"Sign off on color palette and typography" },
  { _id:"t3", title:"App feature requirements doc",  project:"HR Portal",         priority:"Medium", status:"in progress", dueDate:"2026-03-28", description:"List core features and user flow diagrams" },
  { _id:"t4", title:"API endpoint testing",          project:"Mobile App Design", priority:"Medium", status:"pending",     dueDate:"2026-04-05", description:"REST endpoints with Postman" },
];
const SEED_SALARY = [
  {
    _id: "s1",
    month: "March 2026",
    basic: 30000,
    hra: 14000,
    allowances: 5000,
    deductions: 4500,
    net: 49500,
    status: "paid",
    paidOn: "2026-03-31"
  },
  {
    _id: "s2",
    month: "February 2026",
    basic: 30000,
    hra: 14000,
    allowances: 5000,
    deductions: 4500,
    net: 49500,
    status: "paid",
    paidOn: "2026-02-28"
  },
  {
    _id: "s3",
    month: "January 2026",
    basic: 30000,
    hra: 14000,
    allowances: 5000,
    deductions: 4500,
    net: 49500,
    status: "paid",
    paidOn: "2026-01-31"
  }
];

const PERMISSION_TYPES = [
  { value:"late_arrival",   label:"Late Arrival",    icon:"🕐", desc:"Coming in late today" },
  { value:"early_departure",label:"Early Departure", icon:"🚶", desc:"Leaving early today"  },
  { value:"od",             label:"On Duty (OD)",    icon:"🏢", desc:"Working outside office" },
  { value:"wfh",            label:"Work From Home",  icon:"🏠", desc:"Working from home"     },
  { value:"half_day",       label:"Half Day",        icon:"🌗", desc:"Half day off"          },
  { value:"other",          label:"Other",           icon:"📝", desc:"Other reason"          },
];

const todayStr = () => new Date().toISOString().split("T")[0];
const fmt = (n) => Number(n||0).toLocaleString("en-IN");

const statusIcon = (s) => {
  const l=(s||"").toLowerCase();
  if(l==="approved")  return "✅";
  if(l==="rejected")  return "❌";
  if(l==="cancelled") return "🚫";
  return "⏳";
};

// ── UI Atoms ──────────────────────────────────────────────────────────────────

function Badge({ label }) {
  const c = sc(label);
  return (
    <span style={{ background:`${c}18`, color:c, border:`1px solid ${c}30`, padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700, whiteSpace:"nowrap", fontFamily:"monospace" }}>
      {label}
    </span>
  );
}

function ProgressBar({ pct }) {
  const p=pct||0, c=p===100?"#10b981":"#6366f1";
  return (
    <div style={{ background:"#f1f5f9", borderRadius:99, height:5, overflow:"hidden", minWidth:80 }}>
      <div style={{ width:`${p}%`, background:c, height:"100%", borderRadius:99, transition:"width 1s" }}/>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, onClick }) {
  return (
    <div onClick={onClick}
      style={{ background:"#fff", borderRadius:16, padding:"20px 18px", border:"1px solid #e2e8f0", cursor:onClick?"pointer":"default", position:"relative", overflow:"hidden", transition:"transform 0.2s" }}
      onMouseEnter={e=>{ if(onClick) e.currentTarget.style.transform="translateY(-2px)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform=""; }}>
      <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%", background:`${color}15` }}/>
      <div style={{ width:40, height:40, borderRadius:12, background:`${color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600, letterSpacing:0.5, textTransform:"uppercase", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:800, color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function Card({ children, title, action }) {
  return (
    <div style={{ background:"#fff", borderRadius:16, border:"1px solid #e2e8f0", padding:"18px 20px" }}>
      {(title||action) && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          {title && <div style={{ fontSize:14, fontWeight:800, color:"#0f172a" }}>{title}</div>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display:"flex", borderBottom:"1px solid #f1f5f9", marginBottom:16, overflowX:"auto" }}>
      {tabs.map(t=>(
        <button key={t.key} onClick={()=>onChange(t.key)}
          style={{ padding:"8px 16px", fontSize:12.5, cursor:"pointer", background:"none", border:"none", borderBottom:active===t.key?"2px solid #6366f1":"2px solid transparent", color:active===t.key?"#6366f1":"#94a3b8", fontWeight:active===t.key?700:400, fontFamily:"inherit", marginBottom:-1, whiteSpace:"nowrap" }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Toast({ msg, type }) {
  const c=type==="error"?"#ef4444":"#6366f1";
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, background:"#0f172a", border:`1px solid ${c}50`, borderRadius:12, padding:"11px 18px", fontSize:13, color:type==="error"?"#fca5a5":"#a5b4fc", opacity:msg?1:0, transition:"opacity 0.3s", pointerEvents:"none" }}>
      {msg}
    </div>
  );
}

function InputField({ label, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <label style={{ fontSize:11, color:"#64748b", fontWeight:700, textTransform:"uppercase", letterSpacing:0.4 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:10,
  fontSize:13, color:"#0f172a", background:"#f8fafc", outline:"none", fontFamily:"inherit",
};

function Sidebar({ active, setActive, open, onClose, onLogout, user }) {
  const initials=(user?.name||"E").slice(0,2).toUpperCase();
  return (
    <>
      {open && <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:998 }}/>}
      <div className="emp-sidebar" style={{ width:220, background:"#0f172a", color:"#fff", display:"flex", flexDirection:"column", height:"100vh", position:"fixed", top:0, left:0, zIndex:999, transform:open?"translateX(0)":"translateX(-100%)", transition:"transform 0.28s ease" }}>
        <div style={{ padding:"24px 20px 18px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:900, color:"#fff" }}>M</div>
            <div>
              <div style={{ fontWeight:800, fontSize:13, color:"#fff" }}>M Business</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:1.5 }}>EMPLOYEE</div>
            </div>
          </div>
          <button onClick={onClose} className="emp-sb-close" style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:16, cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#6366f1,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:13 }}>{initials}</div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:120 }}>{user?.name||"Employee"}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>{user?.department||"Employee"}</div>
            </div>
          </div>
        </div>
        <nav style={{ flex:1, padding:"10px", overflowY:"auto" }}>
          {NAV.map(n=>{
            const on=active===n.key;
            return (
              <button key={n.key} onClick={()=>{ setActive(n.key); onClose(); }}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:on?"rgba(99,102,241,0.2)":"transparent", border:on?"1px solid rgba(99,102,241,0.35)":"1px solid transparent", borderRadius:10, color:on?"#a5b4fc":"rgba(255,255,255,0.4)", fontWeight:on?700:400, fontSize:12.5, cursor:"pointer", marginBottom:2, textAlign:"left", fontFamily:"inherit" }}
                onMouseEnter={e=>{ if(!on) e.currentTarget.style.background="rgba(255,255,255,0.05)"; }}
                onMouseLeave={e=>{ if(!on) e.currentTarget.style.background="transparent"; }}>
                <span style={{ fontSize:14 }}>{n.icon}</span>
                <span style={{ flex:1 }}>{n.label}</span>
                {on && <div style={{ width:4, height:4, borderRadius:"50%", background:"#818cf8" }}/>}
              </button>
            );
          })}
        </nav>
        <div style={{ padding:"12px 10px 20px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={onLogout} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 12px", background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.35)", borderRadius:10, color:"#fca5a5", fontSize:12.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            🚪 Logout
          </button>
        </div>
      </div>
      <div className="emp-sb-spacer" style={{ width:220, flexShrink:0 }}/>
    </>
  );
}

// ── Documents Mini Card (Dashboard-ல் காட்ட) ────────────────────────────────

function DocumentsCard({ docStatus, onOpenProfile }) {
  const uploadedCount = Object.values(docStatus).filter(Boolean).length;
  const total         = DOC_TYPES.length;
  const allDone       = uploadedCount === total;

  return (
    <Card
      title="📂 My Documents"
      action={
        <button
          onClick={onOpenProfile}
          style={{ background:"none", border:"none", color:"#6366f1", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          Manage →
        </button>
      }>
      {/* Progress bar */}
      <div style={{ marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <span style={{ fontSize:12, color:"#64748b", fontWeight:600 }}>
            {uploadedCount}/{total} documents uploaded
          </span>
          <span style={{ fontSize:12, fontWeight:800, color:allDone?"#10b981":"#f59e0b" }}>
            {Math.round((uploadedCount/total)*100)}%
          </span>
        </div>
        <div style={{ background:"#f1f5f9", borderRadius:99, height:7, overflow:"hidden" }}>
          <div style={{
            width:`${(uploadedCount/total)*100}%`,
            background: allDone
              ? "linear-gradient(90deg,#10b981,#34d399)"
              : "linear-gradient(90deg,#f59e0b,#fbbf24)",
            height:"100%", borderRadius:99, transition:"width 0.6s"
          }}/>
        </div>
      </div>

      {/* Doc rows */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {DOC_TYPES.map(dt => {
          const doc     = docStatus[dt.key];
          const hasDoc  = !!doc;
          return (
            <div key={dt.key}
              style={{
                display:"flex", alignItems:"center", gap:12,
                padding:"10px 12px", borderRadius:12,
                background: hasDoc ? `${dt.color}08` : "#f8fafc",
                border:`1px solid ${hasDoc ? dt.color+"30" : "#f1f5f9"}`,
              }}>
              {/* Icon */}
              <div style={{ width:34, height:34, borderRadius:10, background:`${dt.color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
                {dt.icon}
              </div>
              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{dt.label}</div>
                {hasDoc && doc.uploadedAt
                  ? <div style={{ fontSize:10, color:"#94a3b8", marginTop:1 }}>
                      Uploaded {new Date(doc.uploadedAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
                      {doc.fileName ? ` · ${doc.fileName}` : ""}
                    </div>
                  : <div style={{ fontSize:10, color:"#94a3b8", marginTop:1 }}>{dt.desc}</div>}
              </div>
              {/* Status badge */}
              {hasDoc
                ? <div style={{ display:"flex", alignItems:"center", gap:4, background:`${dt.color}15`, border:`1px solid ${dt.color}30`, borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700, color:dt.color, whiteSpace:"nowrap" }}>
                    ✓ Uploaded
                  </div>
                : <button onClick={onOpenProfile}
                    style={{ background:"#fef3c7", border:"1px solid #fde68a", borderRadius:20, padding:"3px 12px", fontSize:11, fontWeight:700, color:"#d97706", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                    ⚠️ Upload
                  </button>}
            </div>
          );
        })}
      </div>

      {allDone && (
        <div style={{ marginTop:12, background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", border:"1px solid #bbf7d0", borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:18 }}>🎉</span>
          <div style={{ fontSize:12, fontWeight:700, color:"#166534" }}>All documents uploaded! Profile is complete.</div>
        </div>
      )}
    </Card>
  );
}

// ── Page 1: Dashboard ─────────────────────────────────────────────────────────

function DashboardPage({ user, projects, tasks, attendance, salary, setPage, docStatus, onOpenProfile }) {
  const name        = user?.name || "Employee";
  const today       = todayStr();
  const todayAtt    = attendance.find(a=>a.date===today);
  const presentDays = attendance.filter(a=>a.status==="present").length;
  const pendingTasks= tasks.filter(t=>t.status!=="done"&&t.status!=="completed").length;
  const latestSalary= salary[0];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Welcome row */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:"#0f172a", margin:0 }}>Welcome back, {name.split(" ")[0]} 👋</h1>
          <p style={{ fontSize:13, color:"#94a3b8", marginTop:4 }}>Here's your work summary for today</p>
        </div>
        {!todayAtt ? (
          <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:12, padding:"10px 16px", fontSize:13, color:"#ef4444", fontWeight:600, display:"flex", alignItems:"center", gap:8 }}>
            ⚠️ Mark today's attendance →
            <button onClick={()=>setPage("attendance")} style={{ background:"#ef4444", border:"none", borderRadius:8, padding:"5px 12px", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Mark Now</button>
          </div>
        ) : (
          <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, padding:"10px 16px", fontSize:13, color:"#10b981", fontWeight:600 }}>✅ Today: {todayAtt.status}</div>
        )}
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }} className="stat-grid">
        <StatCard icon="◈" label="My Projects"   value={projects.length}  sub="Assigned to you" color="#6366f1" onClick={()=>setPage("projects")}/>
        <StatCard icon="◉" label="Pending Tasks" value={pendingTasks}      sub="Need attention"  color="#f59e0b" onClick={()=>setPage("tasks")}/>
        <StatCard icon="◷" label="Present Days"  value={presentDays}       sub="This month"      color="#10b981" onClick={()=>setPage("attendance")}/>
        <StatCard icon="◆" label="Last Salary"   value={latestSalary?`₹${fmt(latestSalary.net)}`:"—"} sub={latestSalary?.month||"Not yet"} color="#8b5cf6" onClick={()=>setPage("salary")}/>
      </div>

      {/* Projects + Tasks row */}
      <div style={{ display:"grid", gridTemplateColumns:"3fr 2fr", gap:16 }} className="two-col">
        <Card title="My Projects" action={<button onClick={()=>setPage("projects")} style={{ background:"none", border:"none", color:"#6366f1", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>View all →</button>}>
          {projects.slice(0,4).map((p,i)=>(
            <div key={p._id||i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:i<3?"1px solid #f8fafc":"none" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:sc(p.status), flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{p.client||"—"} · Due {p.deadline||"—"}</div>
                <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:8 }}>
                  <ProgressBar pct={p.progress||0}/><span style={{ fontSize:11, color:"#94a3b8" }}>{p.progress||0}%</span>
                </div>
              </div>
              <Badge label={p.status||"active"}/>
            </div>
          ))}
          {projects.length===0 && <div style={{ textAlign:"center", padding:"1.5rem", color:"#94a3b8", fontSize:13 }}>No projects assigned</div>}
        </Card>
        <Card title="My Tasks" action={<button onClick={()=>setPage("tasks")} style={{ background:"none", border:"none", color:"#6366f1", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>View all →</button>}>
          {tasks.slice(0,5).map((t,i)=>(
            <div key={t._id||i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"9px 0", borderBottom:i<4?"1px solid #f8fafc":"none" }}>
              <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${t.status==="done"?"#10b981":"#e2e8f0"}`, background:t.status==="done"?"#10b981":"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                {(t.status==="done"||t.status==="completed")&&<span style={{ color:"#fff", fontSize:10, fontWeight:900 }}>✓</span>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:t.status==="done"?"#94a3b8":"#0f172a", textDecoration:t.status==="done"?"line-through":"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>{t.project} · Due {t.dueDate||"—"}</div>
              </div>
              <Badge label={t.priority||"medium"}/>
            </div>
          ))}
          {tasks.length===0 && <div style={{ textAlign:"center", padding:"1.5rem", color:"#94a3b8", fontSize:13 }}>No tasks assigned</div>}
        </Card>
      </div>

      {/* ── NEW: Documents Card + Attendance Calendar row ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:16 }} className="two-col">
        {/* Documents card */}
        <DocumentsCard docStatus={docStatus} onOpenProfile={onOpenProfile}/>

        {/* Attendance calendar */}
        <Card title="This Month Attendance">
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {Array.from({length:31},(_,i)=>{
              const day   = String(i+1).padStart(2,"0");
              const month = new Date().toISOString().slice(0,7);
              const date  = `${month}-${day}`;
              const rec   = attendance.find(a=>a.date===date);
              const bg    = rec ? sc(rec.status) : "#f1f5f9";
              const tc    = rec ? "#fff" : "#94a3b8";
              return <div key={i} style={{ width:32, height:32, borderRadius:8, background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:tc }}>{i+1}</div>;
            })}
          </div>
          <div style={{ display:"flex", gap:16, marginTop:12, flexWrap:"wrap" }}>
            {[["#10b981","Present"],["#ef4444","Absent"],["#f59e0b","Leave"],["#f1f5f9","Not marked"]].map(([c,l])=>(
              <div key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#64748b" }}>
                <div style={{ width:10, height:10, borderRadius:3, background:c }}/>{l}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Pages 2-5 (unchanged) ─────────────────────────────────────────────────────

function ProjectsPage({ projects }) {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const tabs = [
    { key:"all",    label:`All (${projects.length})` },
    { key:"active", label:`Active (${projects.filter(p=>["active","in progress"].includes((p.status||"").toLowerCase())).length})` },
    { key:"review", label:`Review (${projects.filter(p=>["review","in review"].includes((p.status||"").toLowerCase())).length})` },
    { key:"done",   label:`Done (${projects.filter(p=>["done","completed"].includes((p.status||"").toLowerCase())).length})` },
  ];
  const list = filter==="all" ? projects : projects.filter(p=>{
    const s=(p.status||"").toLowerCase();
    if(filter==="active") return s==="active"||s==="in progress";
    if(filter==="review") return s==="review"||s==="in review";
    if(filter==="done")   return s==="done"||s==="completed";
    return true;
  });
  if(selected) return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <Card>
        <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", color:"#6366f1", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", marginBottom:16 }}>← Back</button>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:10 }}>
          <div><h2 style={{ fontSize:18, fontWeight:800, color:"#0f172a", margin:0 }}>{selected.name}</h2>
            <div style={{ fontSize:13, color:"#94a3b8", marginTop:4 }}>Client: {selected.client||"—"} · Deadline: {selected.deadline||"—"}</div></div>
          <Badge label={selected.status||"active"}/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
          {[["Budget",selected.budget||"—"],["Progress",`${selected.progress||0}%`],["Manager",selected.manager||"—"]].map(([k,v])=>(
            <div key={k} style={{ background:"#f8fafc", borderRadius:12, padding:"12px 14px" }}>
              <div style={{ fontSize:11, color:"#94a3b8", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>{k}</div>
              <div style={{ fontSize:16, fontWeight:800, color:"#0f172a" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ flex:1, background:"#f1f5f9", borderRadius:99, height:10, overflow:"hidden" }}>
            <div style={{ width:`${selected.progress||0}%`, background:"linear-gradient(90deg,#6366f1,#8b5cf6)", height:"100%", borderRadius:99 }}/>
          </div>
          <span style={{ fontSize:14, fontWeight:800, color:"#6366f1" }}>{selected.progress||0}%</span>
        </div>
        {selected.description && <p style={{ marginTop:16, fontSize:13, color:"#374151", lineHeight:1.7 }}>{selected.description}</p>}
      </Card>
    </div>
  );
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div><h1 style={{ fontSize:20, fontWeight:800, color:"#0f172a", margin:0 }}>My Projects</h1>
        <p style={{ fontSize:13, color:"#94a3b8", marginTop:4 }}>All projects assigned to you</p></div>
      <Card>
        <TabBar tabs={tabs} active={filter} onChange={setFilter}/>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {list.map((p,i)=>(
            <div key={p._id||i} onClick={()=>setSelected(p)} style={{ background:"#f8fafc", borderRadius:14, border:"1px solid #f1f5f9", padding:"16px 18px", cursor:"pointer" }}
              onMouseEnter={e=>{ e.currentTarget.style.background="#f0f0fe"; e.currentTarget.style.borderColor="#c7d2fe"; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="#f8fafc"; e.currentTarget.style.borderColor="#f1f5f9"; }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div><div style={{ fontSize:14, fontWeight:800, color:"#0f172a" }}>{p.name}</div>
                  <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>Client: {p.client||"—"} · Budget: {p.budget||"—"} · Due: {p.deadline||"—"}</div></div>
                <Badge label={p.status||"active"}/>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <ProgressBar pct={p.progress||0}/><span style={{ fontSize:12, fontWeight:700, color:"#6366f1", minWidth:36 }}>{p.progress||0}%</span>
              </div>
            </div>
          ))}
          {list.length===0 && <div style={{ textAlign:"center", padding:"2rem", color:"#94a3b8", fontSize:13 }}>No projects in this category</div>}
        </div>
      </Card>
    </div>
  );
}

function TasksPage({ tasks }) {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const tabs = [
    { key:"all",         label:`All (${tasks.length})` },
    { key:"in progress", label:`In Progress (${tasks.filter(t=>(t.status||"").toLowerCase()==="in progress").length})` },
    { key:"pending",     label:`Pending (${tasks.filter(t=>(t.status||"").toLowerCase()==="pending").length})` },
    { key:"done",        label:`Done (${tasks.filter(t=>["done","completed"].includes((t.status||"").toLowerCase())).length})` },
  ];
  const list = filter==="all" ? tasks : tasks.filter(t=>{
    const s=(t.status||"").toLowerCase();
    if(filter==="done") return s==="done"||s==="completed";
    return s===filter;
  });
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div><h1 style={{ fontSize:20, fontWeight:800, color:"#0f172a", margin:0 }}>My Tasks</h1>
        <p style={{ fontSize:13, color:"#94a3b8", marginTop:4 }}>Tasks assigned to you</p></div>
      <Card>
        <TabBar tabs={tabs} active={filter} onChange={setFilter}/>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {list.map((t,i)=>{
            const done  = t.status==="done"||t.status==="completed";
            const isOpen= expanded===t._id;
            return (
              <div key={t._id||i} style={{ background:"#f8fafc", borderRadius:14, border:`1px solid ${isOpen?"#c7d2fe":"#f1f5f9"}`, overflow:"hidden" }}>
                <div onClick={()=>setExpanded(isOpen?null:t._id)} style={{ padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"flex-start", gap:12 }}>
                  <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${done?"#10b981":"#e2e8f0"}`, background:done?"#10b981":"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
                    {done && <span style={{ color:"#fff", fontSize:11, fontWeight:900 }}>✓</span>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:done?"#94a3b8":"#0f172a", textDecoration:done?"line-through":"none" }}>{t.title}</div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:5, alignItems:"center" }}>
                      <Badge label={t.priority||"medium"}/><Badge label={t.status||"pending"}/>
                      <span style={{ fontSize:11, color:"#94a3b8" }}>📁 {t.project}</span>
                      <span style={{ fontSize:11, color:"#94a3b8" }}>⏱ {t.dueDate||"—"}</span>
                    </div>
                  </div>
                  <span style={{ fontSize:12, color:"#94a3b8", transform:isOpen?"rotate(180deg)":"rotate(0)", display:"inline-block" }}>▾</span>
                </div>
                {isOpen && <div style={{ padding:"0 16px 16px", borderTop:"1px solid #f1f5f9" }}>
                  {t.description && <p style={{ fontSize:13, color:"#374151", marginTop:12, lineHeight:1.6 }}>{t.description}</p>}
                </div>}
              </div>
            );
          })}
          {list.length===0 && <div style={{ textAlign:"center", padding:"2.5rem", color:"#94a3b8", fontSize:13 }}>No tasks in this category</div>}
        </div>
      </Card>
    </div>
  );
}

function AttendancePage({ attendance, setAttendance, empName, notify }) {
  const [activeTab, setActiveTab] = useState("attendance");
  const [leaveForm, setLeaveForm] = useState(false);
  const [leaveType, setLeaveType] = useState("Sick Leave");
  const [leaveFrom, setLeaveFrom] = useState(todayStr());
  const [leaveTo,   setLeaveTo]   = useState(todayStr());
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [permForm, setPermForm] = useState(false);
  const [permType, setPermType] = useState("late_arrival");
  const [permDate, setPermDate] = useState(todayStr());
  const [permFromTime, setPermFromTime] = useState("09:00");
  const [permToTime, setPermToTime] = useState("10:00");
  const [permReason, setPermReason] = useState("");
  const [permHistory, setPermHistory] = useState([]);
  const [permSubmitting, setPermSubmitting] = useState(false);
  const [marking, setMarking] = useState(false);
  const [addForm, setAddForm] = useState(false);
  const [addDate, setAddDate] = useState(todayStr());
  const [addStatus, setAddStatus] = useState("present");
  const [addNote, setAddNote] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [attSearch, setAttSearch] = useState("");
  const [attMonthFilter, setAttMonthFilter] = useState("");
  const [attFromDate, setAttFromDate] = useState("");
  const [attToDate, setAttToDate] = useState("");
  const [showAdvFilter, setShowAdvFilter] = useState(false);
  const [attFilter, setAttFilter] = useState("all");
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const today     = todayStr();
  const thisMonth = today.slice(0,7);
  const todayRec  = attendance.find(a=>a.date===today);
  const monthRecs = attendance.filter(a=>a.date.startsWith(thisMonth));
  const present   = monthRecs.filter(a=>a.status==="present").length;
  const absent    = monthRecs.filter(a=>a.status==="absent").length;
  const leave     = monthRecs.filter(a=>a.status==="leave").length;
  const workingDays = new Date().getDate();

  const FULL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS_SHORT  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const calDateStr = d => `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  const getCalDays = () => {
    const firstDay    = new Date(calYear,calMonth,1).getDay();
    const daysInMonth = new Date(calYear,calMonth+1,0).getDate();
    const daysInPrev  = new Date(calYear,calMonth,0).getDate();
    const cells=[];
    for(let i=firstDay-1;i>=0;i--) cells.push({day:daysInPrev-i,curr:false});
    for(let d=1;d<=daysInMonth;d++) cells.push({day:d,curr:true});
    while(cells.length%7!==0) cells.push({day:cells.length-daysInMonth-firstDay+1,curr:false});
    return cells;
  };

  const prevCalMonth = ()=>{ if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1); setSelectedDate(null); };
  const nextCalMonth = ()=>{ if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1); setSelectedDate(null); };

  const filteredHistory = attendance
    .filter(a=>{
      const statusMatch = attFilter==="all"||a.status===attFilter;
      const dateMatch   = selectedDate ? a.date===selectedDate : true;
      const searchMatch = !attSearch.trim()||a.date.includes(attSearch.trim());
      const monthMatch  = !attMonthFilter||a.date.startsWith(attMonthFilter);
      const fromMatch   = !attFromDate||a.date>=attFromDate;
      const toMatch     = !attToDate||a.date<=attToDate;
      return statusMatch&&dateMatch&&searchMatch&&monthMatch&&fromMatch&&toMatch;
    })
    .sort((a,b)=>b.date.localeCompare(a.date));

  const hasActiveFilter = attFilter!=="all"||selectedDate||attSearch||attMonthFilter||attFromDate||attToDate;
  const resetAllFilters = ()=>{ setAttFilter("all");setSelectedDate(null);setAttSearch("");setAttMonthFilter("");setAttFromDate("");setAttToDate(""); };
  const availableMonths = [...new Set(attendance.map(a=>a.date.slice(0,7)))].sort().reverse();

  useEffect(()=>{
    if(!empName) return;
    const enc=encodeURIComponent(empName);
    axios.get(`${BASE}/leave/${enc}`).then(r=>{if(r.data?.length) setLeaveHistory(r.data);}).catch(()=>{});
    axios.get(`${BASE}/permission/${enc}`).then(r=>{if(r.data?.length) setPermHistory(r.data);}).catch(()=>{});
  },[empName]);

  const markAttendance = async (status)=>{
    if(todayRec){notify("Already marked for today","error");return;}
    setMarking(true);
    const rec={date:today,status,employeeName:empName,markedAt:new Date().toISOString()};
    try{await axios.post(`${BASE}/attendance`,rec);}catch(e){}
    setAttendance(prev=>[...prev,rec]);
    notify(`Marked as ${status} ✓`);
    setMarking(false);
  };

  const addAttendance = async ()=>{
    if(!addDate) return;
    const exists=attendance.find(a=>a.date===addDate);
    if(exists){notify("Attendance already marked for this date","error");return;}
    setAddSaving(true);
    const rec={date:addDate,status:addStatus,employeeName:empName,markedAt:new Date().toISOString(),note:addNote};
    try{await axios.post(`${BASE}/attendance`,rec);}catch(e){}
    setAttendance(prev=>[...prev,{...rec,_id:`local_${Date.now()}`}]);
    notify(`Attendance added for ${addDate} ✓`);
    setAddForm(false);setAddDate(todayStr());setAddStatus("present");setAddNote("");
    setAddSaving(false);
  };

  const submitLeave = async ()=>{
    if(!leaveReason.trim()){notify("Please enter a reason","error");return;}
    setLeaveSubmitting(true);
    const newLeave={_id:`leave_${Date.now()}`,type:leaveType,from:leaveFrom,to:leaveTo,reason:leaveReason,employeeName:empName,status:"pending",appliedOn:new Date().toISOString()};
    try{
      const res=await axios.post(`${BASE}/leave`,newLeave);
      setLeaveHistory(prev=>[{...newLeave,...(res.data?.leave||{})}, ...prev]);
    }catch{setLeaveHistory(prev=>[newLeave,...prev]);}
    notify("Leave request submitted ✓");
    setLeaveForm(false);setLeaveReason("");setLeaveType("Sick Leave");setLeaveFrom(todayStr());setLeaveTo(todayStr());
    setLeaveSubmitting(false);setActiveTab("leaves");
  };

  const submitPermission = async ()=>{
    if(!permReason.trim()){notify("Please enter a reason","error");return;}
    setPermSubmitting(true);
    const typeLabel=PERMISSION_TYPES.find(t=>t.value===permType)?.label||permType;
    const newPerm={_id:`perm_${Date.now()}`,type:permType,typeLabel,date:permDate,fromTime:permFromTime,toTime:permToTime,reason:permReason,employeeName:empName,status:"pending",appliedOn:new Date().toISOString()};
    try{
      const res=await axios.post(`${BASE}/permission`,newPerm);
      setPermHistory(prev=>[{...newPerm,...(res.data?.permission||{})}, ...prev]);
    }catch{setPermHistory(prev=>[newPerm,...prev]);}
    notify("Permission request submitted ✓");
    setPermForm(false);setPermReason("");setPermType("late_arrival");setPermDate(todayStr());setPermFromTime("09:00");setPermToTime("10:00");
    setPermSubmitting(false);setActiveTab("permissions");
  };

  const cancelPermission = async (perm)=>{
    if((perm.status||"pending").toLowerCase()!=="pending"){notify("Only pending requests can be cancelled","error");return;}
    try{await axios.patch(`${BASE}/permission/${perm._id}/cancel`,{employeeName:empName});}catch{}
    setPermHistory(prev=>prev.map(p=>p._id===perm._id?{...p,status:"cancelled"}:p));
    notify("Permission request cancelled");
  };

  const pendingLeaves = leaveHistory.filter(l=>(l.status||"pending").toLowerCase()==="pending").length;
  const pendingPerms  = permHistory.filter(p=>(p.status||"pending").toLowerCase()==="pending").length;

  const tabs=[
    {key:"attendance", label:"Attendance"},
    {key:"leaves",     label:pendingLeaves>0?`My Leaves (${pendingLeaves})`:"My Leaves"},
    {key:"permissions",label:pendingPerms>0?`Permissions (${pendingPerms})`:"Permissions"},
  ];

  const calDays=getCalDays();

  const filterChips=[
    {key:"all",     label:"All",     color:"#6366f1", count:attendance.length},
    {key:"present", label:"Present", color:"#10b981", count:attendance.filter(a=>a.status==="present").length},
    {key:"absent",  label:"Absent",  color:"#ef4444", count:attendance.filter(a=>a.status==="absent").length},
    {key:"leave",   label:"Leave",   color:"#f59e0b", count:attendance.filter(a=>a.status==="leave").length},
    {key:"holiday", label:"Holiday", color:"#8b5cf6", count:attendance.filter(a=>a.status==="holiday").length},
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:"#0f172a", margin:0 }}>Attendance</h1>
          <p style={{ fontSize:13, color:"#94a3b8", marginTop:4 }}>Track attendance, apply leave & permission requests</p>
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <button onClick={()=>{setAddForm(v=>!v);setPermForm(false);setLeaveForm(false);setActiveTab("attendance");}}
            style={{ background:"linear-gradient(135deg,#10b981,#059669)", color:"#fff", border:"none", borderRadius:10, padding:"10px 18px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            ➕ Add Attendance
          </button>
          <button onClick={()=>{setPermForm(v=>!v);setLeaveForm(false);setAddForm(false);setActiveTab("attendance");}}
            style={{ background:"linear-gradient(135deg,#0ea5e9,#6366f1)", color:"#fff", border:"none", borderRadius:10, padding:"10px 18px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            🔑 Request Permission
          </button>
          <button onClick={()=>{setLeaveForm(v=>!v);setPermForm(false);setAddForm(false);setActiveTab("attendance");}}
            style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", border:"none", borderRadius:10, padding:"10px 18px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            🌴 Apply Leave
          </button>
        </div>
      </div>

      {addForm && (
        <Card title="➕ Add Attendance">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:14 }} className="perm-form-grid">
            <InputField label="Date *"><input type="date" value={addDate} onChange={e=>setAddDate(e.target.value)} style={inputStyle}/></InputField>
            <InputField label="Status">
              <div style={{ display:"flex", gap:8 }}>
                {[{val:"present",label:"Present",color:"#10b981",icon:"✅"},{val:"absent",label:"Absent",color:"#ef4444",icon:"❌"},{val:"leave",label:"Leave",color:"#f59e0b",icon:"🌴"},{val:"holiday",label:"Holiday",color:"#8b5cf6",icon:"🎉"}].map(opt=>(
                  <button key={opt.val} onClick={()=>setAddStatus(opt.val)}
                    style={{ flex:1, padding:"8px 4px", borderRadius:10, border:`2px solid ${addStatus===opt.val?opt.color:"#e2e8f0"}`, background:addStatus===opt.val?`${opt.color}15`:"#f8fafc", color:addStatus===opt.val?opt.color:"#94a3b8", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                    <span style={{ fontSize:14 }}>{opt.icon}</span>{opt.label}
                  </button>
                ))}
              </div>
            </InputField>
            <InputField label="Note (optional)"><input value={addNote} onChange={e=>setAddNote(e.target.value)} placeholder="e.g. WFH, field visit…" style={inputStyle}/></InputField>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={()=>{setAddForm(false);setAddDate(todayStr());setAddStatus("present");setAddNote("");}} style={{ padding:"9px 20px", border:"1.5px solid #e2e8f0", borderRadius:10, background:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", color:"#374151" }}>Cancel</button>
            <button onClick={addAttendance} disabled={addSaving} style={{ padding:"9px 24px", background:"linear-gradient(135deg,#10b981,#059669)", border:"none", borderRadius:10, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity:addSaving?0.7:1 }}>
              {addSaving?"Saving…":"💾 Save Attendance"}
            </button>
          </div>
        </Card>
      )}

      {permForm && (
        <Card title="🔑 Request Permission">
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:"#64748b", fontWeight:700, textTransform:"uppercase", letterSpacing:0.4, marginBottom:8 }}>Permission Type</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }} className="perm-type-grid">
              {PERMISSION_TYPES.map(pt=>(
                <div key={pt.value} onClick={()=>setPermType(pt.value)}
                  style={{ padding:"10px 12px", borderRadius:12, border:`2px solid ${permType===pt.value?"#6366f1":"#e2e8f0"}`, background:permType===pt.value?"#eef2ff":"#f8fafc", cursor:"pointer", transition:"all 0.15s" }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{pt.icon}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:permType===pt.value?"#6366f1":"#374151" }}>{pt.label}</div>
                  <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>{pt.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:14 }} className="perm-form-grid">
            <InputField label="Date"><input type="date" value={permDate} onChange={e=>setPermDate(e.target.value)} style={inputStyle}/></InputField>
            <InputField label="From Time"><input type="time" value={permFromTime} onChange={e=>setPermFromTime(e.target.value)} style={inputStyle}/></InputField>
            <InputField label="To Time"><input type="time" value={permToTime} onChange={e=>setPermToTime(e.target.value)} style={inputStyle}/></InputField>
          </div>
          <InputField label="Reason *"><textarea value={permReason} onChange={e=>setPermReason(e.target.value)} rows={3} placeholder="Briefly explain your reason…" style={{ ...inputStyle, resize:"vertical" }}/></InputField>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:14 }}>
            <button onClick={()=>setPermForm(false)} style={{ padding:"9px 20px", border:"1.5px solid #e2e8f0", borderRadius:10, background:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", color:"#374151" }}>Cancel</button>
            <button onClick={submitPermission} disabled={permSubmitting} style={{ padding:"9px 20px", background:"linear-gradient(135deg,#0ea5e9,#6366f1)", border:"none", borderRadius:10, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity:permSubmitting?0.7:1 }}>
              {permSubmitting?"Submitting…":"Submit Request"}
            </button>
          </div>
        </Card>
      )}

      {leaveForm && (
        <Card title="🌴 Apply for Leave">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <InputField label="Leave Type">
              <select value={leaveType} onChange={e=>setLeaveType(e.target.value)} style={inputStyle}>
                {["Sick Leave","Casual Leave","Earned Leave","Maternity Leave","Paternity Leave"].map(o=><option key={o}>{o}</option>)}
              </select>
            </InputField>
            <div/>
            <InputField label="From Date"><input type="date" value={leaveFrom} onChange={e=>setLeaveFrom(e.target.value)} style={inputStyle}/></InputField>
            <InputField label="To Date"><input type="date" value={leaveTo} onChange={e=>setLeaveTo(e.target.value)} style={inputStyle}/></InputField>
            <div style={{ gridColumn:"1/-1" }}>
              <InputField label="Reason *"><textarea value={leaveReason} onChange={e=>setLeaveReason(e.target.value)} rows={3} placeholder="Enter reason…" style={{ ...inputStyle, resize:"vertical" }}/></InputField>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:14 }}>
            <button onClick={()=>setLeaveForm(false)} style={{ padding:"9px 20px", border:"1.5px solid #e2e8f0", borderRadius:10, background:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", color:"#374151" }}>Cancel</button>
            <button onClick={submitLeave} disabled={leaveSubmitting} style={{ padding:"9px 20px", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", border:"none", borderRadius:10, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity:leaveSubmitting?0.7:1 }}>
              {leaveSubmitting?"Submitting…":"Submit"}
            </button>
          </div>
        </Card>
      )}

      <Card>
        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab}/>

        {activeTab==="attendance" && (
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <div style={{ background:"#f8fafc", borderRadius:12, padding:"14px 16px", display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ fontSize:13, color:"#374151", fontWeight:600 }}>Today — <span style={{ color:"#6366f1" }}>{today}</span></div>
              {todayRec ? (
                <div style={{ background:`${sc(todayRec.status)}18`, border:`1px solid ${sc(todayRec.status)}30`, borderRadius:10, padding:"8px 16px", fontSize:13, fontWeight:700, color:sc(todayRec.status) }}>
                  ✓ Marked as {todayRec.status}
                </div>
              ) : (
                <div style={{ display:"flex", gap:10 }}>
                  <button disabled={marking} onClick={()=>markAttendance("present")} style={{ background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.3)", borderRadius:10, padding:"9px 20px", fontSize:13, color:"#10b981", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>✅ Present</button>
                  <button disabled={marking} onClick={()=>markAttendance("absent")}  style={{ background:"rgba(239,68,68,0.1)",  border:"1px solid rgba(239,68,68,0.3)",  borderRadius:10, padding:"9px 20px", fontSize:13, color:"#ef4444", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>❌ Absent</button>
                </div>
              )}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", gap:16, alignItems:"start" }} className="att-split">
              <div style={{ background:"#f8fafc", borderRadius:14, padding:16, border:"1px solid #f1f5f9", position:"sticky", top:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <button onClick={prevCalMonth} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, width:30, height:30, cursor:"pointer", fontSize:14, color:"#6366f1", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#0f172a" }}>{FULL_MONTHS[calMonth]} {calYear}</div>
                    {selectedDate && <div style={{ fontSize:10, color:"#6366f1", marginTop:2 }}>{selectedDate}<span onClick={()=>setSelectedDate(null)} style={{ marginLeft:6, cursor:"pointer", textDecoration:"underline", color:"#94a3b8" }}>✕ Clear</span></div>}
                  </div>
                  <div style={{ display:"flex", gap:5 }}>
                    <button onClick={()=>{setCalYear(new Date().getFullYear());setCalMonth(new Date().getMonth());setSelectedDate(null);}} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:7, padding:"3px 8px", cursor:"pointer", fontSize:9, color:"#6366f1", fontWeight:700 }}>Today</button>
                    <button onClick={nextCalMonth} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, width:30, height:30, cursor:"pointer", fontSize:14, color:"#6366f1", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
                  {DAYS_SHORT.map(d=><div key={d} style={{ textAlign:"center", fontSize:9, fontWeight:700, color:"#94a3b8", letterSpacing:0.3, padding:"3px 0" }}>{d}</div>)}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
                  {calDays.map((cell,idx)=>{
                    const ds=cell.curr?calDateStr(cell.day):null;
                    const rec=cell.curr?attendance.find(a=>a.date===ds):null;
                    const isToday=ds===today, isSelected=ds===selectedDate;
                    const bg=isSelected?"#6366f1":isToday?"#eef2ff":rec?`${sc(rec.status)}20`:"#fff";
                    const textColor=isSelected?"#fff":isToday?"#6366f1":rec?sc(rec.status):cell.curr?"#374151":"#cbd5e1";
                    return (
                      <div key={idx} onClick={()=>{if(!cell.curr)return;setSelectedDate(prev=>prev===ds?null:ds);}}
                        style={{ aspectRatio:"1", borderRadius:8, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:bg, border:isSelected?"2px solid #6366f1":isToday?"1.5px solid #c7d2fe":rec?`1px solid ${sc(rec.status)}30`:"1px solid transparent", cursor:cell.curr?"pointer":"default", opacity:cell.curr?1:0.3, transition:"all 0.12s", fontSize:11, fontWeight:isToday||isSelected?800:600, color:textColor, position:"relative" }} title={rec?`${ds}: ${rec.status}`:""}>
                        {cell.day}
                        {rec&&!isSelected&&<div style={{ width:4, height:4, borderRadius:"50%", background:sc(rec.status), position:"absolute", bottom:3 }}/>}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display:"flex", gap:10, marginTop:12, flexWrap:"wrap" }}>
                  {[["#10b981","Present"],["#ef4444","Absent"],["#f59e0b","Leave"],["#8b5cf6","Holiday"],["#6366f1","Today"]].map(([c,l])=>(
                    <div key={l} style={{ display:"flex", alignItems:"center", gap:4, fontSize:9, color:"#64748b" }}><div style={{ width:8, height:8, borderRadius:2, background:c }}/>{l}</div>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ background:"#f8fafc", borderRadius:14, border:"1px solid #f1f5f9", padding:"14px 16px" }}>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:10 }}>
                    <span style={{ fontSize:11, color:"#64748b", fontWeight:700, whiteSpace:"nowrap" }}>Status:</span>
                    {filterChips.map(chip=>{
                      const active=attFilter===chip.key;
                      return (
                        <button key={chip.key} onClick={()=>{setAttFilter(chip.key);setSelectedDate(null);}}
                          style={{ padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:700, cursor:"pointer", border:`1.5px solid ${active?chip.color:"#e2e8f0"}`, background:active?`${chip.color}15`:"#fff", color:active?chip.color:"#94a3b8", display:"flex", alignItems:"center", gap:5, fontFamily:"inherit", transition:"all 0.15s" }}>
                          <span style={{ width:6, height:6, borderRadius:"50%", background:active?chip.color:"#cbd5e1", display:"inline-block" }}/>
                          {chip.label}
                          <span style={{ background:active?`${chip.color}25`:"#f1f5f9", color:active?chip.color:"#94a3b8", borderRadius:99, padding:"0 5px", fontSize:10, fontWeight:800 }}>{chip.count}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                    <div style={{ position:"relative", flex:1, minWidth:140 }}>
                      <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:12, color:"#94a3b8" }}>🔍</span>
                      <input placeholder="Search date (e.g. 2026-03)" value={attSearch} onChange={e=>{setAttSearch(e.target.value);setSelectedDate(null);}} style={{ ...inputStyle, paddingLeft:32, width:"100%", fontSize:12, padding:"7px 10px 7px 30px" }}/>
                    </div>
                    <select value={attMonthFilter} onChange={e=>{setAttMonthFilter(e.target.value);setSelectedDate(null);}} style={{ ...inputStyle, fontSize:12, padding:"7px 10px", minWidth:140 }}>
                      <option value="">All Months</option>
                      {availableMonths.map(m=><option key={m} value={m}>{m}</option>)}
                    </select>
                    <button onClick={()=>setShowAdvFilter(v=>!v)} style={{ padding:"7px 12px", borderRadius:10, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:`1.5px solid ${showAdvFilter?"#6366f1":"#e2e8f0"}`, background:showAdvFilter?"#eef2ff":"#fff", color:showAdvFilter?"#6366f1":"#94a3b8", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:5 }}>
                      ⚙️ {showAdvFilter?"Hide":"Date Range"}
                    </button>
                    {hasActiveFilter && <button onClick={resetAllFilters} style={{ padding:"7px 12px", borderRadius:10, fontSize:11, fontWeight:700, cursor:"pointer", border:"1px solid #fecaca", background:"#fef2f2", color:"#ef4444", fontFamily:"inherit", whiteSpace:"nowrap" }}>✕ Reset All</button>}
                  </div>
                  {showAdvFilter && (
                    <div style={{ display:"flex", gap:10, alignItems:"center", marginTop:10, flexWrap:"wrap" }}>
                      <span style={{ fontSize:11, color:"#64748b", fontWeight:700 }}>From:</span>
                      <input type="date" value={attFromDate} onChange={e=>{setAttFromDate(e.target.value);setSelectedDate(null);}} style={{ ...inputStyle, fontSize:12, padding:"7px 10px" }}/>
                      <span style={{ fontSize:11, color:"#64748b", fontWeight:700 }}>To:</span>
                      <input type="date" value={attToDate} onChange={e=>{setAttToDate(e.target.value);setSelectedDate(null);}} style={{ ...inputStyle, fontSize:12, padding:"7px 10px" }}/>
                      {(attFromDate||attToDate) && <button onClick={()=>{setAttFromDate("");setAttToDate("");}} style={{ padding:"6px 10px", borderRadius:8, fontSize:11, fontWeight:700, cursor:"pointer", border:"1px solid #e2e8f0", background:"#fff", color:"#94a3b8", fontFamily:"inherit" }}>Clear</button>}
                    </div>
                  )}
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>
                    {selectedDate?`📅 ${selectedDate} (${filteredHistory.length} record${filteredHistory.length!==1?"s":""})`:`Attendance History (${filteredHistory.length}${hasActiveFilter?" filtered":""})`}
                  </div>
                  {hasActiveFilter && <span style={{ fontSize:11, color:"#6366f1", fontWeight:600 }}>Filtered from {attendance.length} total</span>}
                </div>
                {filteredHistory.length===0 ? (
                  <div style={{ textAlign:"center", padding:"2rem", color:"#94a3b8", fontSize:13, background:"#f8fafc", borderRadius:12, border:"1px solid #f1f5f9" }}>
                    <div style={{ fontSize:28, marginBottom:8 }}>📋</div>
                    {selectedDate?`No records for ${selectedDate}`:`No ${attFilter==="all"?"":attFilter} records found`}
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:460, overflowY:"auto", paddingRight:2 }}>
                    {filteredHistory.map((a,i)=>{
                      const c=sc(a.status), d=new Date(a.date), dayName=d.toLocaleDateString("en-IN",{weekday:"short"});
                      return (
                        <div key={i} style={{ background:"#fff", borderRadius:12, border:`1px solid ${c}25`, padding:"12px 14px", display:"flex", alignItems:"center", gap:12 }}>
                          <div style={{ background:`${c}12`, border:`2px solid ${c}30`, borderRadius:10, padding:"8px 10px", textAlign:"center", minWidth:48, flexShrink:0 }}>
                            <div style={{ fontSize:17, fontWeight:800, color:c, lineHeight:1 }}>{d.getDate()}</div>
                            <div style={{ fontSize:8, color:"#94a3b8", fontWeight:700, letterSpacing:0.5, marginTop:2 }}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()].toUpperCase()}</div>
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                              <span style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{dayName}, {a.date}</span>
                              <Badge label={a.status}/>
                            </div>
                            <div style={{ fontSize:11, color:"#94a3b8" }}>
                              {a.markedAt?`🕐 Marked at ${new Date(a.markedAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}`:"Not marked"}
                              {a.note?` · 📝 ${a.note}`:""}
                            </div>
                          </div>
                          <div style={{ width:10, height:10, borderRadius:"50%", background:c, flexShrink:0 }}/>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab==="leaves" && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {[{label:"Total",val:leaveHistory.length,color:"#6366f1"},{label:"Pending",val:leaveHistory.filter(l=>(l.status||"pending").toLowerCase()==="pending").length,color:"#f59e0b"},{label:"Approved",val:leaveHistory.filter(l=>(l.status||"").toLowerCase()==="approved").length,color:"#10b981"},{label:"Rejected",val:leaveHistory.filter(l=>(l.status||"").toLowerCase()==="rejected").length,color:"#ef4444"}].map(({label,val,color})=>(
                <div key={label} style={{ background:`${color}10`, border:`1px solid ${color}25`, borderRadius:12, padding:"10px 18px", display:"flex", flexDirection:"column", gap:2, minWidth:90 }}>
                  <div style={{ fontSize:20, fontWeight:800, color }}>{val}</div>
                  <div style={{ fontSize:11, color:"#64748b", fontWeight:600 }}>{label}</div>
                </div>
              ))}
            </div>
            {leaveHistory.length===0 ? (
              <div style={{ textAlign:"center", padding:"3rem", color:"#94a3b8", fontSize:13 }}>
                <div style={{ fontSize:32, marginBottom:10 }}>🌴</div>No leave requests yet. Click <strong>"Apply Leave"</strong> to submit one.
              </div>
            ) : leaveHistory.map((lv,i)=>{
              const s=(lv.status||"pending").toLowerCase(), sc2=sc(s);
              const days=lv.from&&lv.to?Math.max(1,Math.round((new Date(lv.to)-new Date(lv.from))/86400000)+1):1;
              return (
                <div key={lv._id||i} style={{ background:"#f8fafc", borderRadius:14, border:`1.5px solid ${sc2}25`, padding:"16px 18px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                        <span style={{ fontSize:16 }}>{statusIcon(s)}</span>
                        <span style={{ fontSize:14, fontWeight:800, color:"#0f172a" }}>{lv.type||"Leave"}</span>
                        <Badge label={s}/>
                      </div>
                      <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                        <span style={{ fontSize:12, color:"#64748b" }}>📅 <strong>From:</strong> {lv.from||"—"}</span>
                        <span style={{ fontSize:12, color:"#64748b" }}>📅 <strong>To:</strong> {lv.to||"—"}</span>
                        <span style={{ fontSize:12, color:"#64748b" }}>🗓 <strong>{days} day{days>1?"s":""}</strong></span>
                      </div>
                      {lv.reason && <div style={{ marginTop:8, fontSize:12, color:"#374151", background:"#fff", borderRadius:8, padding:"8px 12px", border:"1px solid #e2e8f0" }}>💬 {lv.reason}</div>}
                      {lv.appliedOn && <div style={{ marginTop:6, fontSize:11, color:"#94a3b8" }}>Applied: {new Date(lv.appliedOn).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</div>}
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, minWidth:60 }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background:`${sc2}18`, border:`2px solid ${sc2}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{statusIcon(s)}</div>
                      <div style={{ fontSize:10, fontWeight:700, color:sc2, textTransform:"uppercase", letterSpacing:0.5 }}>{s}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab==="permissions" && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {[{label:"Total",val:permHistory.length,color:"#6366f1"},{label:"Pending",val:permHistory.filter(p=>(p.status||"pending").toLowerCase()==="pending").length,color:"#f59e0b"},{label:"Approved",val:permHistory.filter(p=>(p.status||"").toLowerCase()==="approved").length,color:"#10b981"},{label:"Rejected",val:permHistory.filter(p=>(p.status||"").toLowerCase()==="rejected").length,color:"#ef4444"}].map(({label,val,color})=>(
                <div key={label} style={{ background:`${color}10`, border:`1px solid ${color}25`, borderRadius:12, padding:"10px 18px", display:"flex", flexDirection:"column", gap:2, minWidth:90 }}>
                  <div style={{ fontSize:20, fontWeight:800, color }}>{val}</div>
                  <div style={{ fontSize:11, color:"#64748b", fontWeight:600 }}>{label}</div>
                </div>
              ))}
            </div>
            {permHistory.length===0 ? (
              <div style={{ textAlign:"center", padding:"3rem", color:"#94a3b8", fontSize:13 }}>
                <div style={{ fontSize:32, marginBottom:10 }}>🔑</div>No permission requests yet. Click <strong>"Request Permission"</strong> to submit one.
              </div>
            ) : permHistory.map((perm,i)=>{
              const s=(perm.status||"pending").toLowerCase(), sc2=sc(s);
              const pt=PERMISSION_TYPES.find(t=>t.value===perm.type);
              const isPending=s==="pending";
              return (
                <div key={perm._id||i} style={{ background:"#f8fafc", borderRadius:14, border:`1.5px solid ${sc2}25`, padding:"16px 18px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, flexWrap:"wrap" }}>
                        <span style={{ fontSize:20 }}>{pt?.icon||"📝"}</span>
                        <span style={{ fontSize:14, fontWeight:800, color:"#0f172a" }}>{perm.typeLabel||pt?.label||perm.type}</span>
                        <Badge label={s}/>
                      </div>
                      <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:6 }}>
                        <span style={{ fontSize:12, color:"#64748b" }}>📅 <strong>{perm.date||"—"}</strong></span>
                        {perm.fromTime&&perm.toTime&&<span style={{ fontSize:12, color:"#64748b" }}>🕐 <strong>{perm.fromTime}</strong> → <strong>{perm.toTime}</strong></span>}
                      </div>
                      {perm.reason && <div style={{ fontSize:12, color:"#374151", background:"#fff", borderRadius:8, padding:"8px 12px", border:"1px solid #e2e8f0", marginBottom:6 }}>💬 {perm.reason}</div>}
                      {perm.appliedOn && <div style={{ fontSize:11, color:"#94a3b8" }}>Applied: {new Date(perm.appliedOn).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</div>}
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, minWidth:60 }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background:`${sc2}18`, border:`2px solid ${sc2}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{statusIcon(s)}</div>
                      <div style={{ fontSize:10, fontWeight:700, color:sc2, textTransform:"uppercase", letterSpacing:0.5 }}>{s}</div>
                      {isPending && <button onClick={()=>cancelPermission(perm)} style={{ fontSize:11, fontWeight:700, color:"#ef4444", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function SalaryPage({ salary, user }) {
  const [selected, setSelected] = useState(salary[0]||null);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div><h1 style={{ fontSize:20, fontWeight:800, color:"#0f172a", margin:0 }}>Salary Slip</h1>
        <p style={{ fontSize:13, color:"#94a3b8", marginTop:4 }}>Your monthly salary breakdown</p></div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:16, alignItems:"start" }} className="two-col">
        <Card title="Select Month">
          {salary.map((s,i)=>(
            <div key={s._id||i} onClick={()=>setSelected(s)}
              style={{ padding:"12px 14px", borderRadius:12, cursor:"pointer", background:selected?._id===s._id?"rgba(99,102,241,0.08)":"transparent", border:selected?._id===s._id?"1px solid rgba(99,102,241,0.25)":"1px solid transparent", marginBottom:6 }}
              onMouseEnter={e=>{ if(selected?._id!==s._id) e.currentTarget.style.background="#f8fafc"; }}
              onMouseLeave={e=>{ if(selected?._id!==s._id) e.currentTarget.style.background="transparent"; }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div><div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{s.month}</div>
                  <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>₹{fmt(s.net)} net</div></div>
                <Badge label={s.status||"paid"}/>
              </div>
            </div>
          ))}
          {salary.length===0 && <div style={{ textAlign:"center", padding:"1.5rem", color:"#94a3b8", fontSize:13 }}>No salary records</div>}
        </Card>
        {selected ? (
          <Card>
            <div style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:12, padding:"20px 22px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div><div style={{ fontSize:16, fontWeight:800, color:"#fff" }}>Salary Slip</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginTop:2 }}>{selected.month}</div></div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)" }}>{user?.name||"Employee"}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:2 }}>{user?.department||"—"}</div>
              </div>
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:0.5, marginBottom:10 }}>Earnings</div>
              {[["Basic Salary",selected.basic],["HRA",selected.hra],["Allowances",selected.allowances]].map(([k,v])=>(
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f8fafc" }}>
                  <span style={{ fontSize:13, color:"#374151" }}>{k}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>₹{fmt(v)}</span>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", padding:"10px", background:"#f0fdf4", borderRadius:8, marginTop:6 }}>
                <span style={{ fontSize:13, fontWeight:700, color:"#10b981" }}>Gross Earnings</span>
                <span style={{ fontSize:13, fontWeight:800, color:"#10b981" }}>₹{fmt((selected.basic||0)+(selected.hra||0)+(selected.allowances||0))}</span>
              </div>
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:0.5, marginBottom:10 }}>Deductions</div>
              <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f8fafc" }}>
                <span style={{ fontSize:13, color:"#374151" }}>PF + Tax + Others</span>
                <span style={{ fontSize:13, fontWeight:600, color:"#ef4444" }}>- ₹{fmt(selected.deductions)}</span>
              </div>
            </div>
            <div style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:12, padding:"16px 18px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div><div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", fontWeight:600 }}>NET SALARY</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:2 }}>Paid on {selected.paidOn||"—"}</div></div>
              <div style={{ fontSize:26, fontWeight:800, color:"#fff" }}>₹{fmt(selected.net)}</div>
            </div>
            <button onClick={()=>window.print()} style={{ marginTop:14, width:"100%", padding:"10px", background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:10, fontSize:13, color:"#6366f1", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              🖨️ Print / Download Slip
            </button>
          </Card>
        ) : (
          <Card><div style={{ textAlign:"center", padding:"3rem", color:"#94a3b8", fontSize:13 }}>Select a month to view salary slip</div></Card>
        )}
      </div>
    </div>
  );
}

// ── Root Component ────────────────────────────────────────────────────────────

export default function EmployeeDashboard({ user, setUser }) {
  const [page,        setPage]        = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects,    setProjects]    = useState(SEED_PROJECTS);
  const [tasks,       setTasks]       = useState(SEED_TASKS);
  const [attendance,  setAttendance]  = useState([]);
  const [salary,      setSalary]      = useState(SEED_SALARY);
  const [toast,       setToast]       = useState("");
  const [toastType,   setToastType]   = useState("success");

  // ── NEW: doc status state (shared between panel & dashboard) ──
  const [docStatus,   setDocStatus]   = useState({});
  // To trigger profile panel to open from Dashboard's "Upload" button
  const [profileOpen, setProfileOpen] = useState(false);

  const resolvedUser = user || (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
  const empName = resolvedUser?.name || "";

  const notify = useCallback((msg, type="success") => {
    setToast(msg); setToastType(type);
    setTimeout(()=>setToast(""), 3000);
  }, []);

  const handleLogout = () => {
  localStorage.removeItem("user");
  setDocStatus({});        // ← இதை சேர்க்கணும்
  setProfileOpen(false);   // ← இதை சேர்க்கணும்
  if(setUser) setUser(null);
  else window.location.href="/";
};
useEffect(()=>{
  // empName மாறும்போது docs reset பண்ணு
  setDocStatus({});
  setProfileOpen(false);
  
  if(!empName) return;
  const enc=encodeURIComponent(empName);
  axios.get(`${BASE}/projects/${enc}`).then(r=>{ if(r.data?.length) setProjects(r.data); }).catch(()=>{});
  axios.get(`${BASE}/tasks/${enc}`).then(r=>{ if(r.data?.length) setTasks(r.data); }).catch(()=>{});
  axios.get(`${BASE}/attendance/${enc}`).then(r=>{ if(r.data) setAttendance(r.data); }).catch(()=>{});
  axios.get(`${BASE}/salary/${enc}`).then(r=>{ if(r.data?.length) setSalary(r.data); }).catch(()=>{});
}, [empName]);

  // Called by EmployeeProfilePanel whenever a doc is uploaded/deleted
  const handleDocStatusChange = useCallback((statusMap) => {
    setDocStatus(statusMap);
  }, []);

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f8fafc", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:4px; }
        @media(min-width:769px){
          .emp-sidebar{transform:translateX(0)!important;position:sticky!important;top:0!important;height:100vh!important;}
          .emp-sb-close{display:none!important;} .emp-sb-spacer{display:none!important;} .emp-mob-bar{display:none!important;}
        }
        @media(max-width:900px){.two-col{grid-template-columns:1fr!important;} .att-split{grid-template-columns:1fr!important;}}
        @media(max-width:768px){
          .emp-sb-spacer{display:none!important;} .main-pad{padding:14px!important;}
          .stat-grid{grid-template-columns:repeat(2,1fr)!important;}
          .perm-type-grid{grid-template-columns:repeat(2,1fr)!important;}
          .perm-form-grid{grid-template-columns:1fr 1fr!important;}
        }
        @media print{.emp-sidebar,.emp-mob-bar,.emp-sb-spacer{display:none!important;}}
      `}</style>

      <Sidebar active={page} setActive={setPage} open={sidebarOpen} onClose={()=>setSidebarOpen(false)} onLogout={handleLogout} user={resolvedUser}/>

      <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column" }}>
        <div className="emp-mob-bar" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"#fff", borderBottom:"1px solid #e2e8f0", position:"sticky", top:0, zIndex:100 }}>
          <button onClick={()=>setSidebarOpen(true)} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#6366f1" }}>☰</button>
          
          {/* Notifications */}
          <div style={{ position:"relative", display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ position:"relative" }}>
              <button style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#6366f1", position:"relative" }}>
                🔔
                <span style={{ position:"absolute", top:"-2px", right:"-2px", background:"#ef4444", color:"#fff", borderRadius:"50%", width:"16px", height:"16px", fontSize:"10px", fontWeight:"700", display:"flex", alignItems:"center", justifyContent:"center" }}>3</span>
              </button>
            </div>
          </div>
          
          <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:12 }}>{(empName||"E").slice(0,2).toUpperCase()}</div>
        </div>

        <div className="main-pad" style={{ flex:1, padding:"24px 28px", overflowY:"auto" }}>
          {page==="dashboard"  && (
            <DashboardPage
              user={resolvedUser}
              projects={projects}
              tasks={tasks}
              attendance={attendance}
              salary={salary}
              setPage={setPage}
              docStatus={docStatus}           // ← NEW
              onOpenProfile={()=>setProfileOpen(true)}  // ← NEW
            />
          )}
          {page==="projects"   && <ProjectsPage   projects={projects}/>}
          {page==="tasks"      && <TasksPage      tasks={tasks}/>}
          {page==="attendance" && <AttendancePage attendance={attendance} setAttendance={setAttendance} empName={empName} notify={notify}/>}
          {page==="salary"     && <SalaryPage     salary={salary} user={resolvedUser}/>}
        </div>
      </div>

      {/* Profile Panel */}
      <EmployeeProfilePanel
        empName={empName}
        user={resolvedUser}
        notify={notify}
        onDocStatusChange={handleDocStatusChange}
        forceOpen={profileOpen}
        onClose={()=>setProfileOpen(false)}
      />

      <Toast msg={toast} type={toastType}/>
    </div>
  );
}
