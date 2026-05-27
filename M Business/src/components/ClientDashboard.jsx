import { useState, useEffect } from "react";

// ── Color System (from image: dark navy + pink-purple gradient) ──
const C = {
  bg:       "#0a0a14",
  surface:  "#10101e",
  card:     "#13132a",
  cardHov:  "#181830",
  border:   "#ffffff0d",
  borderHov:"#e91e9940",
  // Gradients matching the image
  grad:     "linear-gradient(135deg,#e91e99,#7b2ff7)",
  gradSoft: "linear-gradient(135deg,#e91e9930,#7b2ff730)",
  gradText: "linear-gradient(135deg,#f472b6,#a78bfa)",
  // Accents
  pink:     "#e91e99",
  purple:   "#7b2ff7",
  violet:   "#a855f7",
  // Glow colors
  glowPink: "#e91e9930",
  glowPurp: "#7b2ff730",
  // Text
  text:     "#ffffff",
  muted:    "#c8c8e8",
  dim:      "#8888aa",
  // Status
  green:    "#00e5a0",
  amber:    "#ffb547",
  red:      "#ff4d6d",
  blue:     "#4db8ff",
};

// ── Mock Data ─────────────────────────────────────────────────
const MOCK_PROJECTS = [
  { id:1, name:"Brand Redesign",       status:"In Progress", progress:68, budget:280000, spent:190000, deadline:"2026-06-20", tasks:12, done:8  },
  { id:2, name:"Mobile App MVP",       status:"Active",      progress:41, budget:450000, spent:185000, deadline:"2026-08-10", tasks:18, done:7  },
  { id:3, name:"SEO Overhaul",         status:"Completed",   progress:100,budget:95000,  spent:92000,  deadline:"2026-04-30", tasks:9,  done:9  },
  { id:4, name:"Dashboard Analytics",  status:"On Hold",     progress:23, budget:160000, spent:37000,  deadline:"2026-09-01", tasks:14, done:3  },
];
const MOCK_PAYMENTS = [
  { id:1, invoiceNo:"INV-2041", project:"Brand Redesign",       date:"2026-05-01", amount:95000,  status:"Paid",    due:"2026-05-15" },
  { id:2, invoiceNo:"INV-2038", project:"Mobile App MVP",       date:"2026-04-18", amount:125000, status:"Overdue", due:"2026-05-05" },
  { id:3, invoiceNo:"INV-2035", project:"SEO Overhaul",         date:"2026-04-01", amount:48000,  status:"Paid",    due:"2026-04-20" },
  { id:4, invoiceNo:"INV-2052", project:"Dashboard Analytics",  date:"2026-05-20", amount:37000,  status:"Pending", due:"2026-06-05" },
];
const MOCK_TASKS = [
  { id:1, title:"Wireframes Review",       project:"Brand Redesign",      status:"Done",        priority:"High",   due:"2026-05-20" },
  { id:2, title:"API Integration",         project:"Mobile App MVP",       status:"In Progress", priority:"High",   due:"2026-06-10" },
  { id:3, title:"Content Audit",           project:"SEO Overhaul",         status:"Done",        priority:"Medium", due:"2026-04-25" },
  { id:4, title:"Keyword Mapping",         project:"SEO Overhaul",         status:"Done",        priority:"Low",    due:"2026-04-28" },
  { id:5, title:"UI Component Library",    project:"Brand Redesign",       status:"In Progress", priority:"Medium", due:"2026-06-15" },
  { id:6, title:"Performance Baseline",    project:"Dashboard Analytics",  status:"Pending",     priority:"High",   due:"2026-07-01" },
];
const MOCK_NOTIFS = [
  { id:1, text:"Invoice INV-2038 is overdue by 22 days", type:"danger",  icon:"⚠️", time:"2h ago",   read:false },
  { id:2, text:"Brand Redesign milestone reached — 68%",  type:"success", icon:"🎯", time:"5h ago",   read:false },
  { id:3, text:"New proposal shared for your review",     type:"info",    icon:"📄", time:"Yesterday", read:true  },
  { id:4, text:"Payment of ₹95,000 received",             type:"success", icon:"✅", time:"2d ago",   read:true  },
];

const NAV = [
  { key:"dashboard", icon:"ti-layout-dashboard", label:"Overview"  },
  { key:"projects",  icon:"ti-layout-kanban",    label:"Projects"  },
  { key:"tasks",     icon:"ti-checklist",        label:"Tasks"     },
  { key:"payments",  icon:"ti-receipt",          label:"Payments"  },
  { key:"calendar",  icon:"ti-calendar",         label:"Calendar"  },
  { key:"messages",  icon:"ti-message-circle",   label:"Messages"  },
  { key:"reports",   icon:"ti-chart-bar",        label:"Reports"   },
  { key:"settings",  icon:"ti-settings",         label:"Settings"  },
];

const STATUS = {
  "In Progress":{ bg:"#7b2ff720", text:"#c084fc", dot:"#a855f7" },
  "Active":     { bg:"#e91e9920", text:"#f472b6", dot:"#e91e99" },
  "Completed":  { bg:"#00e5a020", text:"#00e5a0", dot:"#00e5a0" },
  "Done":       { bg:"#00e5a020", text:"#00e5a0", dot:"#00e5a0" },
  "On Hold":    { bg:"#ffb54720", text:"#ffb547", dot:"#ffb547" },
  "Pending":    { bg:"#ffb54720", text:"#ffb547", dot:"#ffb547" },
  "Paid":       { bg:"#00e5a020", text:"#00e5a0", dot:"#00e5a0" },
  "Overdue":    { bg:"#ff4d6d20", text:"#ff4d6d", dot:"#ff4d6d" },
  "High":       { bg:"#ff4d6d20", text:"#ff4d6d", dot:"#ff4d6d" },
  "Medium":     { bg:"#7b2ff720", text:"#c084fc", dot:"#a855f7" },
  "Low":        { bg:"#00e5a020", text:"#00e5a0", dot:"#00e5a0" },
};
const sc = (s) => STATUS[s] || { bg:"#ffffff08", text:"#c8c8e8", dot:"#8888bb" };

const fmt = (n) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : `₹${n.toLocaleString("en-IN")}`;

// ── Font + Icon Loader ────────────────────────────────────────
function useAssets() {
  useEffect(() => {
    ["https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap",
     "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.30.0/tabler-icons.min.css"
    ].forEach(href => {
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = href;
      document.head.appendChild(l);
    });
  }, []);
}

// ── Glow Orb ─────────────────────────────────────────────────
function GlowOrb({ color, size, top, left, right, bottom, opacity=0.18 }) {
  return (
    <div style={{
      position:"absolute", width:size, height:size, borderRadius:"50%",
      background:`radial-gradient(circle, ${color} 0%, transparent 70%)`,
      opacity, top, left, right, bottom, pointerEvents:"none", zIndex:0
    }}/>
  );
}

// ── Status Badge ──────────────────────────────────────────────
function Badge({ label }) {
  const c = sc(label);
  return (
    <span style={{ background:c.bg, color:c.text, fontSize:10, fontWeight:600,
      padding:"3px 10px", borderRadius:20, display:"inline-flex", alignItems:"center",
      gap:5, letterSpacing:0.3, whiteSpace:"nowrap", border:`1px solid ${c.dot}25` }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:c.dot }}/>
      {label}
    </span>
  );
}

// ── Progress Ring ─────────────────────────────────────────────
function Ring({ pct, size=54, color=C.pink }) {
  const r = (size-8)/2;
  const circ = 2*Math.PI*r;
  const dash = (pct/100)*circ;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)", flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#2a2a4a" strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
        style={{ filter:`drop-shadow(0 0 4px ${color})`, transition:"stroke-dasharray 1.2s ease" }}/>
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent, onClick }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ background: h ? C.cardHov : C.card, border:`1px solid ${h ? accent+"50" : C.border}`,
        borderRadius:18, padding:"22px 20px", cursor:onClick?"pointer":"default",
        transition:"all 0.3s", position:"relative", overflow:"hidden" }}>
      {/* Glow bg */}
      <div style={{ position:"absolute", top:-30, right:-30, width:100, height:100, borderRadius:"50%",
        background:`radial-gradient(circle,${accent}25,transparent 70%)`, pointerEvents:"none" }}/>
      <div style={{ width:40, height:40, borderRadius:12, background:`${accent}18`,
        border:`1px solid ${accent}35`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
        <i className={`ti ${icon}`} style={{ fontSize:18, color:accent }}/>
      </div>
      <div style={{ fontSize:10, color:"#dcdcff", fontWeight:600, textTransform:"uppercase",
        letterSpacing:1.2, marginBottom:5 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:700, color:C.text, letterSpacing:"-0.5px",
        fontFamily:"'Space Grotesk',sans-serif" }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#a0a0c8", marginTop:5 }}>{sub}</div>}
    </div>
  );
}

// ── GradButton ────────────────────────────────────────────────
function GradBtn({ children, onClick, style: s }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ background: h ? "linear-gradient(135deg,#f472b6,#a78bfa)" : C.grad,
        border:"none", borderRadius:10, padding:"8px 18px", color:"#fff",
        fontWeight:700, fontSize:12, cursor:"pointer", letterSpacing:0.3,
        boxShadow: h ? `0 0 20px ${C.glowPink}` : `0 0 10px ${C.glowPink}`,
        transition:"all 0.25s", fontFamily:"inherit", ...s }}>
      {children}
    </button>
  );
}

// ── Sidebar ───────────────────────────────────────────────────
function Sidebar({ active, setActive }) {
  return (
    <div style={{ width:230, background:C.surface, borderRight:`1px solid ${C.border}`,
      display:"flex", flexDirection:"column", height:"100vh", position:"sticky", top:0, flexShrink:0,
      overflow:"hidden", position:"relative" }}>
      <GlowOrb color={C.pink} size={200} top={-80} left={-80} opacity={0.12}/>
      <GlowOrb color={C.purple} size={160} bottom={-60} right={-60} opacity={0.1}/>

      {/* Logo */}
      <div style={{ padding:"26px 22px 18px", borderBottom:`1px solid ${C.border}`, position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:C.grad,
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:`0 0 16px ${C.glowPink}` }}>
            <span style={{ fontSize:16, fontWeight:800, color:"#fff",
              fontFamily:"'Space Grotesk'" }}>V</span>
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:C.text,
              fontFamily:"'Space Grotesk',sans-serif" }}>VentureFlow</div>
            <div style={{ fontSize:9, color:C.pink, fontWeight:600, letterSpacing:1.5 }}>CLIENT PORTAL</div>
          </div>
        </div>
      </div>

      {/* User */}
      <div style={{ margin:"14px 14px 6px", background:C.card, borderRadius:14,
        padding:"14px", border:`1px solid ${C.border}`, position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:C.grad,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:13, fontWeight:700, color:"#fff", fontFamily:"'Space Grotesk'",
            boxShadow:`0 0 12px ${C.glowPurp}` }}>AM</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.text,
              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>Arjun Mehta</div>
            <div style={{ fontSize:9, color:C.violet, fontWeight:600, letterSpacing:0.8 }}>ENTERPRISE PLAN</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:"8px 10px", overflowY:"auto", position:"relative", zIndex:1 }}>
        <div style={{ fontSize:8, color:"#9999cc", fontWeight:700, letterSpacing:2,
          padding:"6px 10px 4px" }}>MAIN MENU</div>
        {NAV.map(n => {
          const on = active === n.key;
          return (
            <button key={n.key} onClick={()=>setActive(n.key)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
                padding:"11px 14px", background: on ? C.gradSoft : "transparent",
                border:"none", borderRadius:12, color: on ? C.pink : "#d0d0f0",
                fontWeight: on ? 700 : 400, fontSize:13, cursor:"pointer",
                marginBottom:2, textAlign:"left", fontFamily:"inherit",
                boxShadow: on ? `inset 0 0 0 1px ${C.pink}30` : "none",
                transition:"all 0.2s" }}
              onMouseEnter={e=>{ if(!on){ e.currentTarget.style.background=C.border; e.currentTarget.style.color="#ffffff"; }}}
              onMouseLeave={e=>{ if(!on){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#d0d0f0"; }}}>
              <i className={`ti ${n.icon}`} style={{ fontSize:17, flexShrink:0,
                filter: on ? `drop-shadow(0 0 6px ${C.pink})` : "none" }}/>
              {n.label}
              {on && <div style={{ marginLeft:"auto", width:4, height:4, borderRadius:"50%",
                background:C.pink, boxShadow:`0 0 8px ${C.pink}` }}/>}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding:"14px 10px 20px", borderTop:`1px solid ${C.border}`, position:"relative", zIndex:1 }}>
        <button style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
          padding:"11px 14px", background:"transparent", border:"none", borderRadius:12,
          color:"#ff4d6d80", fontSize:13, cursor:"pointer", fontFamily:"inherit",
          transition:"all 0.2s" }}
          onMouseEnter={e=>{e.currentTarget.style.background="#ff4d6d12";e.currentTarget.style.color=C.red;}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#ff4d6d80";}}>
          <i className="ti ti-logout" style={{ fontSize:17 }}/>
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ── Topbar ─────────────────────────────────────────────────────
function Topbar({ active, notifs }) {
  const unread = notifs.filter(n=>!n.read).length;
  const label = NAV.find(n=>n.key===active)?.label || "Overview";
  const day = new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"});
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"18px 28px", borderBottom:`1px solid ${C.border}`, background:C.bg,
      position:"sticky", top:0, zIndex:50, backdropFilter:"blur(12px)" }}>
      <div>
        <div style={{ fontSize:20, fontWeight:700, color:C.text,
          fontFamily:"'Space Grotesk',sans-serif" }}>{label}</div>
        <div style={{ fontSize:11, color:"#b8b8dd", marginTop:1 }}>{day}</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        {/* Search */}
        <div style={{ display:"flex", alignItems:"center", gap:8, background:C.card,
          border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 14px" }}>
          <i className="ti ti-search" style={{ fontSize:14, color:"#a0a0c8" }}/>
          <input placeholder="Search…" style={{ background:"none", border:"none", outline:"none",
            fontSize:13, color:"#dcdcff", fontFamily:"inherit", width:150 }}/>
        </div>
        {/* Bell */}
        <div style={{ position:"relative" }}>
          <button style={{ width:40, height:40, borderRadius:10, background:C.card,
            border:`1px solid ${C.border}`, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <i className="ti ti-bell" style={{ fontSize:18, color:"#dcdcff" }}/>
          </button>
          {unread>0 && <span style={{ position:"absolute", top:-4, right:-4,
            width:18, height:18, borderRadius:"50%", background:C.grad,
            fontSize:10, fontWeight:700, color:"#fff", display:"flex",
            alignItems:"center", justifyContent:"center", border:`2px solid ${C.bg}`,
            boxShadow:`0 0 8px ${C.glowPink}` }}>{unread}</span>}
        </div>
        {/* Avatar */}
        <div style={{ width:40, height:40, borderRadius:10, background:C.grad,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:13, fontWeight:700, color:"#fff", fontFamily:"'Space Grotesk'",
          boxShadow:`0 0 14px ${C.glowPurp}` }}>AM</div>
      </div>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────
function DashboardPage() {
  const totalInvoiced = MOCK_PAYMENTS.reduce((s,p)=>s+p.amount,0);
  const totalPaid     = MOCK_PAYMENTS.filter(p=>p.status==="Paid").reduce((s,p)=>s+p.amount,0);
  const totalOverdue  = MOCK_PAYMENTS.filter(p=>p.status==="Overdue").reduce((s,p)=>s+p.amount,0);
  const activeProj    = MOCK_PROJECTS.filter(p=>p.status!=="Completed").length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

      {/* Welcome Banner */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:22,
        padding:"28px 30px", position:"relative", overflow:"hidden" }}>
        <GlowOrb color={C.pink}   size={300} top={-100} right={-50}  opacity={0.2}/>
        <GlowOrb color={C.purple} size={200} bottom={-80} left={-40} opacity={0.15}/>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontSize:10, color:C.pink, fontWeight:700, letterSpacing:2, marginBottom:8 }}>WELCOME BACK</div>
          <div style={{ fontSize:26, fontWeight:700, color:C.text,
            fontFamily:"'Space Grotesk',sans-serif", marginBottom:6 }}>Arjun Mehta 👋</div>
          <div style={{ fontSize:13, color:"#dcdcff", maxWidth:480, lineHeight:1.6 }}>
            You have{" "}
            <span style={{ color:C.red, fontWeight:600 }}>1 overdue invoice</span> and{" "}
            <span style={{ background:C.gradText, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontWeight:600 }}>
              {MOCK_TASKS.filter(t=>t.status!=="Done").length} active tasks
            </span>{" "}awaiting attention.
          </div>
          <div style={{ display:"flex", gap:10, marginTop:18, flexWrap:"wrap" }}>
            <span style={{ fontSize:11, background:C.gradSoft, color:C.pink,
              border:`1px solid ${C.pink}30`, padding:"5px 14px", borderRadius:20, fontWeight:600 }}>
              Enterprise Plan</span>
            <span style={{ fontSize:11, background:"#00e5a015", color:C.green,
              border:`1px solid ${C.green}30`, padding:"5px 14px", borderRadius:20, fontWeight:600 }}>
              {activeProj} Active Projects</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        <StatCard icon="ti-cash"            label="Total Invoiced" value={fmt(totalInvoiced)} sub="All time"         accent={C.pink}   />
        <StatCard icon="ti-circle-check"    label="Total Paid"     value={fmt(totalPaid)}     sub={`${MOCK_PAYMENTS.filter(p=>p.status==="Paid").length} invoices`} accent={C.green}  />
        <StatCard icon="ti-alert-triangle"  label="Overdue"        value={fmt(totalOverdue)}  sub="Needs attention"  accent={C.red}    />
        <StatCard icon="ti-layout-kanban"   label="Active Projects" value={String(activeProj)} sub={`of ${MOCK_PROJECTS.length} total`} accent={C.violet} />
      </div>

      {/* Middle */}
      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:18 }}>

        {/* Projects */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:24, position:"relative", overflow:"hidden" }}>
          <GlowOrb color={C.purple} size={200} bottom={-60} right={-60} opacity={0.1}/>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, position:"relative", zIndex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.text, fontFamily:"'Space Grotesk'" }}>Project Progress</div>
            <button style={{ fontSize:11, color:C.pink, background:"none", border:"none",
              cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>View All →</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:16, position:"relative", zIndex:1 }}>
            {MOCK_PROJECTS.map(p => {
              const col = p.status==="Completed"?C.green : p.status==="On Hold"?C.amber : p.progress>60?C.pink:C.violet;
              return (
                <div key={p.id} style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ position:"relative", flexShrink:0 }}>
                    <Ring pct={p.progress} size={50} color={col}/>
                    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
                      justifyContent:"center", fontSize:10, fontWeight:700, color:col,
                      fontFamily:"'Space Grotesk'" }}>{p.progress}%</div>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:C.text,
                        whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:140 }}>{p.name}</span>
                      <Badge label={p.status}/>
                    </div>
                    <div style={{ height:4, background:"#2a2a4a", borderRadius:99, overflow:"hidden" }}>
                      <div style={{ width:`${p.progress}%`, height:"100%", borderRadius:99,
                        background:`linear-gradient(90deg,${col},${col}bb)`,
                        boxShadow:`0 0 8px ${col}60`, transition:"width 1s ease" }}/>
                    </div>
                    <div style={{ fontSize:10, color:"#dcdcff", marginTop:4 }}>Tasks {p.done}/{p.tasks} · Deadline {p.deadline}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notifications */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:24, position:"relative", overflow:"hidden" }}>
          <GlowOrb color={C.pink} size={160} top={-50} right={-50} opacity={0.1}/>
          <div style={{ fontSize:14, fontWeight:700, color:C.text,
            fontFamily:"'Space Grotesk'", marginBottom:18, position:"relative", zIndex:1 }}>Recent Alerts</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, position:"relative", zIndex:1 }}>
            {MOCK_NOTIFS.map(n => {
              const tc = { danger:C.red, success:C.green, info:C.blue, warning:C.amber };
              const col = tc[n.type]||C.muted;
              return (
                <div key={n.id} style={{ display:"flex", gap:10, padding:"12px 14px",
                  background: n.read ? "transparent" : `${col}0d`,
                  borderRadius:12, border:`1px solid ${n.read ? C.border : col+"30"}`,
                  alignItems:"flex-start" }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:`${col}18`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:15, flexShrink:0 }}>{n.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight: n.read?400:600,
                      color: n.read?C.muted:C.text, lineHeight:1.4 }}>{n.text}</div>
                    <div style={{ fontSize:10, color:"#a0a0c8", marginTop:3 }}>{n.time}</div>
                  </div>
                  {!n.read && <div style={{ width:6, height:6, borderRadius:"50%", background:col,
                    boxShadow:`0 0 6px ${col}`, flexShrink:0, marginTop:4 }}/>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:24, position:"relative", overflow:"hidden" }}>
        <GlowOrb color={C.purple} size={250} bottom={-80} right={-80} opacity={0.08}/>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, position:"relative", zIndex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.text, fontFamily:"'Space Grotesk'" }}>Recent Transactions</div>
          <GradBtn>View All</GradBtn>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 1fr 1fr 100px",
          padding:"8px 12px", fontSize:9, fontWeight:700, color:"#ffffff", letterSpacing:1.3,
          textTransform:"uppercase", borderBottom:`1px solid ${C.border}`, marginBottom:4, position:"relative", zIndex:1 }}>
          <span>Project</span><span>Invoice</span><span>Date</span><span>Amount</span><span>Status</span>
        </div>
        {MOCK_PAYMENTS.map((p,i)=>(
          <div key={p.id} style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 1fr 1fr 100px",
            padding:"14px 12px", borderBottom: i<MOCK_PAYMENTS.length-1?`1px solid ${C.border}`:"none",
            alignItems:"center", borderRadius:10, transition:"background 0.15s", cursor:"pointer",
            position:"relative", zIndex:1 }}
            onMouseEnter={e=>e.currentTarget.style.background=C.surface}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:C.gradSoft,
                border:`1px solid ${C.pink}30`, display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:11, fontWeight:700, color:C.pink,
                fontFamily:"'Space Grotesk'" }}>{p.project.slice(0,2).toUpperCase()}</div>
              <span style={{ fontSize:13, fontWeight:500, color:C.text }}>{p.project}</span>
            </div>
            <span style={{ fontSize:11, color:"#dcdcff" }}>{p.invoiceNo}</span>
            <span style={{ fontSize:11, color:"#dcdcff" }}>{p.date}</span>
            <span style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:"'Space Grotesk'" }}>{fmt(p.amount)}</span>
            <Badge label={p.status}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Projects Page ─────────────────────────────────────────────
function ProjectsPage() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:13, color:"#e0e0ff" }}>{MOCK_PROJECTS.length} projects total</div>
        <div style={{ display:"flex", gap:8 }}>
          {["All","Active","Completed","On Hold"].map((f,i)=>(
            <button key={f} style={{ padding:"6px 14px", background:i===0?C.gradSoft:"transparent",
              border:`1px solid ${i===0?C.pink+"50":C.border}`, borderRadius:8,
              color:i===0?C.pink:C.muted, fontSize:11, cursor:"pointer", fontFamily:"inherit",
              fontWeight:i===0?600:400 }}>{f}</button>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {MOCK_PROJECTS.map(p=>{
          const bpct = Math.round((p.spent/p.budget)*100);
          const isOver = p.spent>p.budget;
          const col = p.status==="Completed"?C.green:p.status==="On Hold"?C.amber:p.progress>60?C.pink:C.violet;
          return (
            <div key={p.id} style={{ background:C.card, border:`1px solid ${C.border}`,
              borderRadius:20, padding:24, position:"relative", overflow:"hidden",
              transition:"border-color 0.2s, transform 0.2s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=col+"50";e.currentTarget.style.transform="translateY(-3px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="";}}>
              {/* Top glow strip */}
              <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
                background:`linear-gradient(90deg,transparent,${col},transparent)`,
                boxShadow:`0 0 12px ${col}` }}/>
              <GlowOrb color={col} size={160} top={-60} right={-60} opacity={0.08}/>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
                marginBottom:18, position:"relative", zIndex:1 }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:700, color:C.text,
                    fontFamily:"'Space Grotesk'", marginBottom:4 }}>{p.name}</div>
                  <div style={{ fontSize:11, color:"#dcdcff", display:"flex", alignItems:"center", gap:4 }}>
                    <i className="ti ti-calendar" style={{ fontSize:12 }}/>{p.deadline}
                  </div>
                </div>
                <Badge label={p.status}/>
              </div>

              {/* Progress */}
              <div style={{ marginBottom:18, position:"relative", zIndex:1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:11, color:"#dcdcff" }}>Completion</span>
                  <span style={{ fontSize:13, fontWeight:700, color:col,
                    fontFamily:"'Space Grotesk'", textShadow:`0 0 8px ${col}` }}>{p.progress}%</span>
                </div>
                <div style={{ height:6, background:"#2a2a4a", borderRadius:99, overflow:"hidden" }}>
                  <div style={{ width:`${p.progress}%`, height:"100%", borderRadius:99,
                    background:`linear-gradient(90deg,${C.pink},${C.purple})`,
                    boxShadow:`0 0 10px ${C.glowPink}` }}/>
                </div>
              </div>

              {/* Metrics */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8,
                marginBottom:14, position:"relative", zIndex:1 }}>
                {[
                  { l:"Budget", v:fmt(p.budget), c:C.pink   },
                  { l:"Spent",  v:fmt(p.spent),  c:isOver?C.red:C.text },
                  { l:"Tasks",  v:`${p.done}/${p.tasks}`, c:p.done===p.tasks?C.green:C.text },
                ].map(m=>(
                  <div key={m.l} style={{ background:C.surface, borderRadius:10,
                    padding:"10px 12px", border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:8, color:"#d8d8ff", fontWeight:800, letterSpacing:1.2,
                      marginBottom:4, textTransform:"uppercase" }}>{m.l}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:m.c,
                      fontFamily:"'Space Grotesk'" }}>{m.v}</div>
                  </div>
                ))}
              </div>

              {/* Budget bar */}
              <div style={{ position:"relative", zIndex:1 }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  fontSize:9, color:"#c8c8ee", marginBottom:4, letterSpacing:0.5 }}>
                  <span>Budget Utilization</span>
                  <span style={{ color:isOver?C.red:C.muted }}>{bpct}%</span>
                </div>
                <div style={{ height:3, background:"#2a2a4a", borderRadius:99, overflow:"hidden" }}>
                  <div style={{ width:`${Math.min(bpct,100)}%`, height:"100%",
                    background:isOver?C.red:bpct>80?C.amber:C.green, borderRadius:99 }}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tasks Page ────────────────────────────────────────────────
function TasksPage() {
  const [filter, setFilter] = useState("All");
  const shown = filter==="All" ? MOCK_TASKS : MOCK_TASKS.filter(t=>t.status===filter);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {["All","In Progress","Pending","Done"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            style={{ padding:"7px 16px", background:filter===f?C.gradSoft:"transparent",
              border:`1px solid ${filter===f?C.pink+"50":C.border}`, borderRadius:10,
              color:filter===f?C.pink:C.muted, fontSize:12, fontWeight:filter===f?700:400,
              cursor:"pointer", fontFamily:"inherit" }}>
            {f} <span style={{ opacity:0.5 }}>({f==="All"?MOCK_TASKS.length:MOCK_TASKS.filter(t=>t.status===f).length})</span>
          </button>
        ))}
      </div>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, overflow:"hidden", position:"relative" }}>
        <GlowOrb color={C.purple} size={200} bottom={-60} right={-60} opacity={0.07}/>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 1fr 1fr 110px",
          padding:"12px 20px", fontSize:9, fontWeight:700, color:"#ffffff", letterSpacing:1.3,
          textTransform:"uppercase", borderBottom:`1px solid ${C.border}`, position:"relative", zIndex:1 }}>
          <span>Task</span><span>Project</span><span>Priority</span><span>Due</span><span>Status</span>
        </div>
        {shown.map((t,i)=>(
          <div key={t.id} style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 1fr 1fr 110px",
            padding:"16px 20px", borderBottom:i<shown.length-1?`1px solid ${C.border}`:"none",
            alignItems:"center", transition:"background 0.15s", cursor:"pointer", position:"relative", zIndex:1 }}
            onMouseEnter={e=>e.currentTarget.style.background=C.surface}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:20, height:20, borderRadius:6,
                border:`1.5px solid ${t.status==="Done"?C.green:C.dim}`,
                background:t.status==="Done"?`${C.green}20`:"transparent",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {t.status==="Done" && <i className="ti ti-check" style={{ fontSize:11, color:C.green }}/>}
              </div>
              <span style={{ fontSize:13, fontWeight:500, color:t.status==="Done"?C.muted:C.text,
                textDecoration:t.status==="Done"?"line-through":"none" }}>{t.title}</span>
            </div>
            <span style={{ fontSize:12, color:"#dcdcff" }}>{t.project}</span>
            <Badge label={t.priority}/>
            <span style={{ fontSize:12, color:"#dcdcff" }}>{t.due}</span>
            <Badge label={t.status}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Payments Page ─────────────────────────────────────────────
function PaymentsPage() {
  const totalInvoiced = MOCK_PAYMENTS.reduce((s,p)=>s+p.amount,0);
  const totalPaid     = MOCK_PAYMENTS.filter(p=>p.status==="Paid").reduce((s,p)=>s+p.amount,0);
  const totalOverdue  = MOCK_PAYMENTS.filter(p=>p.status==="Overdue").reduce((s,p)=>s+p.amount,0);
  const totalPending  = MOCK_PAYMENTS.filter(p=>p.status==="Pending").reduce((s,p)=>s+p.amount,0);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        <StatCard icon="ti-report-money"      label="Total Invoiced" value={fmt(totalInvoiced)} accent={C.pink}   />
        <StatCard icon="ti-circle-check"      label="Paid"           value={fmt(totalPaid)}     accent={C.green}  />
        <StatCard icon="ti-clock-exclamation" label="Overdue"        value={fmt(totalOverdue)}  accent={C.red}    />
        <StatCard icon="ti-hourglass"         label="Pending"        value={fmt(totalPending)}  accent={C.violet} />
      </div>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:24, position:"relative", overflow:"hidden" }}>
        <GlowOrb color={C.pink} size={250} top={-80} right={-80} opacity={0.08}/>
        <div style={{ fontSize:14, fontWeight:700, color:C.text,
          fontFamily:"'Space Grotesk'", marginBottom:20, position:"relative", zIndex:1 }}>Payment History</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10, position:"relative", zIndex:1 }}>
          {MOCK_PAYMENTS.map(inv=>{
            const c = sc(inv.status);
            const isOvd = inv.status==="Overdue";
            return (
              <div key={inv.id} style={{ display:"flex", alignItems:"center", gap:16,
                padding:"18px 20px", background:C.surface, borderRadius:14,
                border:`1px solid ${isOvd?C.red+"30":C.border}`, transition:"all 0.2s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.pink+"40";e.currentTarget.style.background=C.card;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=isOvd?C.red+"30":C.border;e.currentTarget.style.background=C.surface;}}>
                <div style={{ width:46, height:46, borderRadius:12, background:c.bg,
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <i className={inv.status==="Paid"?"ti ti-receipt":isOvd?"ti ti-alert-triangle":"ti ti-clock"}
                    style={{ fontSize:18, color:c.text, filter:`drop-shadow(0 0 5px ${c.dot})` }}/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{inv.invoiceNo}</div>
                  <div style={{ fontSize:11, color:"#dcdcff" }}>{inv.project} · Due {inv.due}</div>
                </div>
                <div style={{ textAlign:"right", marginRight:14 }}>
                  <div style={{ fontSize:16, fontWeight:700, color:C.text,
                    fontFamily:"'Space Grotesk'" }}>{fmt(inv.amount)}</div>
                  <div style={{ fontSize:10, color:"#a0a0c8" }}>{inv.date}</div>
                </div>
                <Badge label={inv.status}/>
                <button style={{ width:34, height:34, background:C.surface,
                  border:`1px solid ${C.border}`, borderRadius:8, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center" }}
                  onMouseEnter={e=>{e.currentTarget.style.background=C.gradSoft;e.currentTarget.style.borderColor=C.pink+"50";}}
                  onMouseLeave={e=>{e.currentTarget.style.background=C.surface;e.currentTarget.style.borderColor=C.border;}}>
                  <i className="ti ti-download" style={{ fontSize:15, color:"#dcdcff" }}/>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Placeholder ───────────────────────────────────────────────
function PlaceholderPage({ icon, title, sub }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:"80px 20px", textAlign:"center" }}>
      <div style={{ width:70, height:70, borderRadius:20, background:C.gradSoft,
        border:`1px solid ${C.pink}30`, display:"flex", alignItems:"center",
        justifyContent:"center", marginBottom:20,
        boxShadow:`0 0 30px ${C.glowPink}` }}>
        <i className={`ti ${icon}`} style={{ fontSize:30, color:C.pink,
          filter:`drop-shadow(0 0 8px ${C.pink})` }}/>
      </div>
      <div style={{ fontSize:20, fontWeight:700, color:C.text,
        fontFamily:"'Space Grotesk'", marginBottom:8 }}>{title}</div>
      <div style={{ fontSize:13, color:"#dcdcff", maxWidth:360, lineHeight:1.6 }}>{sub}</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function ClientDashboard() {
  useAssets();
  const [active, setActive] = useState("dashboard");

  const CSS = `
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:${C.bg};}
    ::-webkit-scrollbar{width:4px;}
    ::-webkit-scrollbar-track{background:${C.bg};}
    ::-webkit-scrollbar-thumb{background:${C.dim};border-radius:10px;}
    input::placeholder{color:#6060a0;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
    .pg{animation:fadeUp 0.35s ease forwards;}
  `;

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden",
      background:C.bg, fontFamily:"'Plus Jakarta Sans',sans-serif", color:C.text }}>
      <style>{CSS}</style>
      <Sidebar active={active} setActive={setActive}/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>
        <Topbar active={active} notifs={MOCK_NOTIFS}/>
        <div key={active} className="pg"
          style={{ flex:1, overflowY:"auto", padding:"26px 30px" }}>
          {active==="dashboard" && <DashboardPage/>}
          {active==="projects"  && <ProjectsPage/>}
          {active==="tasks"     && <TasksPage/>}
          {active==="payments"  && <PaymentsPage/>}
          {active==="calendar"  && <PlaceholderPage icon="ti-calendar"       title="Business Calendar" sub="Deadlines, meetings, and milestones — all in one view."/>}
          {active==="messages"  && <PlaceholderPage icon="ti-message-circle" title="Messages"          sub="Communicate directly with your project team."/>}
          {active==="reports"   && <PlaceholderPage icon="ti-chart-bar"      title="Reports"           sub="Detailed financial and project performance analytics."/>}
          {active==="settings"  && <PlaceholderPage icon="ti-settings"       title="Settings"          sub="Manage your account, notifications and preferences."/>}
        </div>
      </div>
    </div>
  );
}