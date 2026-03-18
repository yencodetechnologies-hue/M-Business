import { useState, useEffect } from "react";
import axios from "axios";

// ── Theme — exact match to M Business ────────────────────────
const SIDEBAR_BG = "#0f172a";
const ACCENT     = "#6366f1";
const ACCENT2    = "#8b5cf6";

// ── Status colours ────────────────────────────────────────────
const sc = (s = "") => ({
  "active":       "#6366f1",
  "in progress":  "#6366f1",
  "review":       "#f59e0b",
  "in review":    "#f59e0b",
  "pending":      "#f59e0b",
  "done":         "#10b981",
  "completed":    "#10b981",
  "on hold":      "#8b5cf6",
  "overdue":      "#ef4444",
}[s.toLowerCase()] || "#6366f1");

// ── NAV — only 2 pages ────────────────────────────────────────
const NAV = [
  { key: "dashboard", icon: "⌂", label: "Dashboard"   },
  { key: "projects",  icon: "◈", label: "My Projects"  },
];

// ── Seed projects (shown when backend returns nothing) ────────
const SEED = [
  { _id:"s1", name:"E-Commerce Revamp",   client:"Nila Retail", status:"active",     progress:65,  deadline:"Mar 28", tasks:12, completedTasks:8  },
  { _id:"s2", name:"HR Portal",           client:"TechCorp",    status:"in review",  progress:85,  deadline:"Apr 10", tasks:8,  completedTasks:7  },
  { _id:"s3", name:"Mobile App Design",   client:"Kavi Labs",   status:"active",     progress:40,  deadline:"Mar 22", tasks:10, completedTasks:4  },
  { _id:"s4", name:"API Integration",     client:"DataSync",    status:"pending",    progress:30,  deadline:"Apr 20", tasks:6,  completedTasks:2  },
  { _id:"s5", name:"Analytics Dashboard", client:"FinEdge",     status:"done",       progress:100, deadline:"May 1",  tasks:9,  completedTasks:9  },
];

// ─────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────

function Badge({ label }) {
  const c = sc(label);
  return (
    <span style={{
      background: `${c}18`, color: c, border: `1px solid ${c}35`,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
      fontFamily: "'DM Mono', monospace",
    }}>
      {label}
    </span>
  );
}

function Bar({ pct = 0 }) {
  const c = pct === 100 ? "#10b981" : ACCENT;
  return (
    <div style={{ background: "#f1f5f9", borderRadius: 99, height: 6, overflow: "hidden", flex: 1 }}>
      <div style={{
        width: `${pct}%`, height: "100%", borderRadius: 99,
        background: `linear-gradient(90deg,${c},${c}99)`,
        transition: "width 0.9s ease",
      }}/>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: "#fff", borderRadius: 16, padding: "20px 18px",
      border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      cursor: onClick ? "pointer" : "default",
      transition: "transform 0.18s, box-shadow 0.18s",
      position: "relative", overflow: "hidden",
    }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(99,102,241,0.13)"; }}}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; }}
    >
      <div style={{ position:"absolute", top:-22, right:-22, width:80, height:80, borderRadius:"50%", background:`radial-gradient(circle,${color}20,transparent)` }}/>
      <div style={{ width:42, height:42, borderRadius:12, background:`${color}16`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, marginBottom:14 }}>{icon}</div>
      <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600, letterSpacing:0.6, textTransform:"uppercase", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:800, color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#94a3b8", marginTop:5 }}>{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, open, onClose, onLogout, user }) {
  const initials = (user?.name || "E").slice(0, 2).toUpperCase();
  const role     = user?.role || "Employee";

  return (
    <>
      {open && (
        <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:998 }}/>
      )}

      <div className="emp-sb" style={{
        width: 220, background: SIDEBAR_BG, color: "#fff",
        display: "flex", flexDirection: "column", height: "100vh",
        position: "fixed", top: 0, left: 0, zIndex: 999,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.26s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: "4px 0 32px rgba(0,0,0,0.2)",
      }}>

        {/* Logo */}
        <div style={{ padding:"22px 20px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, background:`linear-gradient(135deg,${ACCENT},${ACCENT2})`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:16, color:"#fff" }}>M</div>
            <div>
              <div style={{ fontWeight:800, fontSize:13, letterSpacing:-0.3 }}>M Business</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:1.5 }}>EMPLOYEE</div>
            </div>
          </div>
          <button onClick={onClose} className="emp-sb-close" style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:16, cursor:"pointer" }}>✕</button>
        </div>

        {/* Avatar */}
        <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:11, background:`linear-gradient(135deg,${ACCENT},${ACCENT2})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, flexShrink:0 }}>{initials}</div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name || "Employee"}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:1 }}>{role}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:10, overflowY:"auto" }}>
          {NAV.map(n => {
            const on = active === n.key;
            return (
              <button key={n.key} onClick={() => { setActive(n.key); onClose(); }} style={{
                width:"100%", display:"flex", alignItems:"center", gap:10,
                padding:"10px 12px", marginBottom:3,
                background: on ? "rgba(99,102,241,0.22)" : "transparent",
                border: on ? "1px solid rgba(99,102,241,0.4)" : "1px solid transparent",
                borderRadius:10, cursor:"pointer", fontFamily:"inherit",
                color: on ? "#a5b4fc" : "rgba(255,255,255,0.42)",
                fontWeight: on ? 700 : 400, fontSize:13, textAlign:"left",
                transition:"all 0.15s",
              }}
                onMouseEnter={e => { if (!on) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize:15, opacity: on ? 1 : 0.55 }}>{n.icon}</span>
                <span style={{ flex:1 }}>{n.label}</span>
                {on && <div style={{ width:5, height:5, borderRadius:"50%", background:"#818cf8" }}/>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding:"12px 10px 22px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={onLogout} style={{
            width:"100%", padding:"10px 12px",
            background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.35)",
            borderRadius:10, color:"#fca5a5", fontSize:12.5, fontWeight:700,
            cursor:"pointer", fontFamily:"inherit",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          }}>🚪 Logout</button>
        </div>
      </div>

      {/* Desktop spacer */}
      <div className="emp-sb-spacer" style={{ width:220, flexShrink:0 }}/>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Project Card (grid view)
// ─────────────────────────────────────────────────────────────
function ProjectCard({ p }) {
  const pct  = p.progress || 0;
  const done = p.completedTasks || 0;
  const tot  = p.tasks || 0;

  return (
    <div style={{
      background:"#fff", borderRadius:16, border:"1px solid #e2e8f0",
      padding:"18px 20px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)",
      display:"flex", flexDirection:"column", gap:12,
      transition:"box-shadow 0.18s, transform 0.18s",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow="0 8px 28px rgba(99,102,241,0.11)"; e.currentTarget.style.transform="translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.05)"; e.currentTarget.style.transform=""; }}
    >
      {/* Top row */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
        <div style={{ fontWeight:800, fontSize:14, color:"#0f172a", lineHeight:1.4 }}>{p.name}</div>
        <Badge label={p.status || "active"}/>
      </div>

      {/* Meta */}
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        <div style={{ fontSize:12, color:"#64748b", display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11 }}>🏢</span>
          {p.client || p.clientName || "—"}
        </div>
        {p.deadline && (
          <div style={{ fontSize:12, color:"#64748b", display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11 }}>📅</span>
            {p.deadline}
          </div>
        )}
      </div>

      {/* Progress */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>Progress</span>
          <span style={{ fontSize:11, fontWeight:700, color: pct===100 ? "#10b981" : ACCENT, fontFamily:"'DM Mono',monospace" }}>{pct}%</span>
        </div>
        <Bar pct={pct}/>
      </div>

      {/* Tasks */}
      <div style={{ display:"flex", justifyContent:"space-between", borderTop:"1px solid #f1f5f9", paddingTop:10 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:18, fontWeight:800, color:"#0f172a" }}>{tot}</div>
          <div style={{ fontSize:10, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>Total Tasks</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:18, fontWeight:800, color:"#10b981" }}>{done}</div>
          <div style={{ fontSize:10, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>Completed</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:18, fontWeight:800, color: tot-done>0 ? "#f59e0b":"#10b981" }}>{tot-done}</div>
          <div style={{ fontSize:10, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>Remaining</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Dashboard Page
// ─────────────────────────────────────────────────────────────
function DashboardPage({ user, projects, loading, setPage }) {
  const name    = user?.name || "Employee";
  const active  = projects.filter(p => ["active","in progress"].includes((p.status||"").toLowerCase())).length;
  const done    = projects.filter(p => ["done","completed"].includes((p.status||"").toLowerCase())).length;
  const pending = projects.filter(p => ["pending","on hold","review","in review"].includes((p.status||"").toLowerCase())).length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22, animation:"slideIn 0.3s ease" }}>

      {/* Greeting */}
      <div>
        <h1 style={{ fontSize:22, fontWeight:800, color:"#0f172a", letterSpacing:-0.4, margin:0 }}>
          Welcome back, {name.split(" ")[0]} 👋
        </h1>
        <p style={{ fontSize:13, color:"#94a3b8", marginTop:5 }}>
          Here's your project overview
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }} className="emp-stat-grid">
        <StatCard icon="◈" label="Total Projects" value={projects.length} sub="Assigned to you"  color={ACCENT}    onClick={() => setPage("projects")}/>
        <StatCard icon="⚡" label="Active"         value={active}          sub="Currently running" color="#f59e0b"   onClick={() => setPage("projects")}/>
        <StatCard icon="✅" label="Completed"      value={done}            sub="Finished"          color="#10b981"   onClick={() => setPage("projects")}/>
        <StatCard icon="⏳" label="Pending"        value={pending}         sub="Needs attention"   color="#ef4444"   onClick={() => setPage("projects")}/>
      </div>

      {/* Assigned Projects list */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontSize:15, fontWeight:800, color:"#0f172a" }}>Assigned Projects</div>
          <button onClick={() => setPage("projects")} style={{ background:"none", border:"none", color:ACCENT, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            View all →
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:"3rem", color:"#94a3b8", fontSize:13 }}>
            <div style={{ width:28, height:28, border:`3px solid #e2e8f0`, borderTop:`3px solid ${ACCENT}`, borderRadius:"50%", margin:"0 auto 12px", animation:"spin 0.9s linear infinite" }}/>
            Loading your projects…
          </div>
        ) : projects.length === 0 ? (
          <div style={{ textAlign:"center", padding:"3rem", color:"#94a3b8", fontSize:13, background:"#fff", borderRadius:16, border:"1px solid #e2e8f0" }}>
            No projects assigned yet. Check back soon!
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }} className="emp-proj-grid">
            {projects.slice(0, 6).map((p, i) => <ProjectCard key={p._id || i} p={p}/>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// My Projects Page
// ─────────────────────────────────────────────────────────────
function ProjectsPage({ projects, loading }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const TABS = [
    { key:"all",      label:`All (${projects.length})` },
    { key:"active",   label:`Active (${projects.filter(p=>["active","in progress"].includes((p.status||"").toLowerCase())).length})` },
    { key:"pending",  label:`Pending (${projects.filter(p=>["pending","review","in review","on hold"].includes((p.status||"").toLowerCase())).length})` },
    { key:"done",     label:`Done (${projects.filter(p=>["done","completed"].includes((p.status||"").toLowerCase())).length})` },
  ];

  const filtered = projects.filter(p => {
    const s = (p.status || "").toLowerCase();
    const matchFilter =
      filter === "all"     ? true :
      filter === "active"  ? (s==="active"||s==="in progress") :
      filter === "pending" ? (s==="pending"||s==="review"||s==="in review"||s==="on hold") :
      filter === "done"    ? (s==="done"||s==="completed") : true;
    const matchSearch = search.trim() === "" ||
      (p.name||"").toLowerCase().includes(search.toLowerCase()) ||
      (p.client||p.clientName||"").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20, animation:"slideIn 0.3s ease" }}>
      <div>
        <h1 style={{ fontSize:20, fontWeight:800, color:"#0f172a", margin:0 }}>My Projects</h1>
        <p style={{ fontSize:13, color:"#94a3b8", marginTop:5 }}>All projects assigned to you</p>
      </div>

      {/* Filter + Search bar */}
      <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e2e8f0", padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        {/* Tabs */}
        <div style={{ display:"flex", gap:4 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)} style={{
              padding:"7px 14px", borderRadius:9, fontSize:12, fontWeight:700,
              cursor:"pointer", fontFamily:"inherit", border:"1.5px solid",
              borderColor: filter===t.key ? ACCENT : "#e2e8f0",
              background:  filter===t.key ? "#eef2ff" : "#fff",
              color:       filter===t.key ? ACCENT : "#64748b",
              transition:"all 0.15s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#94a3b8" }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search project…"
            style={{
              paddingLeft:32, paddingRight:12, paddingTop:8, paddingBottom:8,
              border:"1.5px solid #e2e8f0", borderRadius:9, fontSize:13,
              color:"#0f172a", background:"#f8fafc", outline:"none", fontFamily:"inherit",
              width:200,
            }}
          />
        </div>
      </div>

      {/* Project grid */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"3rem", color:"#94a3b8", fontSize:13 }}>
          <div style={{ width:28, height:28, border:`3px solid #e2e8f0`, borderTop:`3px solid ${ACCENT}`, borderRadius:"50%", margin:"0 auto 12px", animation:"spin 0.9s linear infinite" }}/>
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"3rem", color:"#94a3b8", fontSize:13, background:"#fff", borderRadius:16, border:"1px solid #e2e8f0" }}>
          No projects found
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }} className="emp-proj-grid">
          {filtered.map((p, i) => <ProjectCard key={p._id || i} p={p}/>)}
        </div>
      )}

      {/* Summary footer */}
      {!loading && filtered.length > 0 && (
        <div style={{ fontSize:12, color:"#94a3b8", textAlign:"right" }}>
          Showing {filtered.length} of {projects.length} projects
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────
export default function EmployeeDashboard({ user, setUser }) {
  const [page,        setPage]        = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects,    setProjects]    = useState(SEED);
  const [loading,     setLoading]     = useState(false);

  // Resolve user (prop or localStorage)
  const me = user || (() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  })();

  const empName = me?.name || "";

  // ── Fetch projects from backend ─────────────────────────────
  useEffect(() => {
    if (!empName) return;
    setLoading(true);

    axios
      .get(`http://localhost:5000/api/employee-dashboard/projects/${encodeURIComponent(empName)}`)
      .then(res => {
        console.log("📁 Projects for", empName, ":", res.data);
        if (Array.isArray(res.data) && res.data.length > 0) {
          setProjects(res.data);
        }
        // else keep seed data
      })
      .catch(err => console.warn("Projects fetch:", err.message))
      .finally(() => setLoading(false));
  }, [empName]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    if (setUser) setUser(null);
    else window.location.href = "/";
  };

  const currentNav = NAV.find(n => n.key === page) || NAV[0];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f8fafc", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        @keyframes slideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin    { to { transform: rotate(360deg); } }

        /* Desktop: sidebar always visible */
        @media (min-width: 769px) {
          .emp-sb            { transform: translateX(0) !important; position: sticky !important; top: 0 !important; height: 100vh !important; }
          .emp-sb-close      { display: none !important; }
          .emp-sb-spacer     { display: none !important; }
          .emp-mob-topbar    { display: none !important; }
        }

        /* Mobile tweaks */
        @media (max-width: 900px) {
          .emp-stat-grid { grid-template-columns: repeat(2,1fr) !important; }
          .emp-proj-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 600px) {
          .emp-stat-grid { grid-template-columns: repeat(2,1fr) !important; }
          .emp-proj-grid { grid-template-columns: 1fr !important; }
          .emp-main-pad  { padding: 14px !important; }
        }
        @media (max-width: 768px) {
          .emp-sb-spacer { display: none !important; }
        }
      `}</style>

      {/* Sidebar */}
      <Sidebar
        active={page}
        setActive={setPage}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        user={me}
      />

      <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column" }}>

        {/* Mobile topbar */}
        <div className="emp-mob-topbar" style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"12px 16px", background:"#fff", borderBottom:"1px solid #e2e8f0",
          position:"sticky", top:0, zIndex:100,
        }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:ACCENT }}>☰</button>
          <span style={{ fontWeight:800, fontSize:14, color:"#0f172a" }}>M Business</span>
          <div style={{ width:32, height:32, borderRadius:9, background:`linear-gradient(135deg,${ACCENT},${ACCENT2})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:12 }}>
            {(empName||"E").slice(0,2).toUpperCase()}
          </div>
        </div>

        {/* Top header strip */}
        <div style={{ background:"#fff", borderBottom:"1px solid #f1f5f9", padding:"14px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:"#0f172a" }}>{currentNav.icon} {currentNav.label}</div>
            <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{empName} · Employee Portal</div>
          </div>
          {loading && (
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"#94a3b8" }}>
              <div style={{ width:14, height:14, border:`2px solid #e2e8f0`, borderTop:`2px solid ${ACCENT}`, borderRadius:"50%", animation:"spin 0.9s linear infinite" }}/>
              Loading…
            </div>
          )}
        </div>

        {/* Page content */}
        <div className="emp-main-pad" style={{ flex:1, padding:"26px 30px", overflowY:"auto" }}>
          {page === "dashboard" && (
            <DashboardPage user={me} projects={projects} loading={loading} setPage={setPage}/>
          )}
          {page === "projects" && (
            <ProjectsPage projects={projects} loading={loading}/>
          )}
        </div>
      </div>
    </div>
  );
}
