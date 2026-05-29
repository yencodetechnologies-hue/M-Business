import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

// ── Color System (from image: dark navy + pink-purple gradient) ──
const C = {
  bg:       "#0d0d1a",
  surface:  "#12122b",
  card:     "#1a1a35",
  cardHov:  "#1f1f40",
  border:   "#2a2a5020",
  borderHov:"#e91e9940",

  grad:     "linear-gradient(135deg,#e91e99,#7b2ff7)",
  gradSoft: "linear-gradient(135deg,#e91e9918,#7b2ff718)",
  gradText: "linear-gradient(135deg,#f472b6,#a78bfa)",

  pink:     "#e91e99",
  purple:   "#7b2ff7",
  violet:   "#a855f7",

  glowPink: "#e91e9930",
  glowPurp: "#7b2ff730",

  text:     "#ffffff",
  muted:    "#a89cc8",
  dim:      "#6655aa",

  green:    "#00e5a0",
  amber:    "#ffb547",
  red:      "#ff4d6d",
  blue:     "#4db8ff",
};

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
  "part_paid":  { bg:"#00e5a020", text:"#00e5a0", dot:"#00e5a0" },
  "paid":       { bg:"#00e5a020", text:"#00e5a0", dot:"#00e5a0" },
  "unpaid":     { bg:"#ffb54720", text:"#ffb547", dot:"#ffb547" },
  "overdue":    { bg:"#ff4d6d20", text:"#ff4d6d", dot:"#ff4d6d" },
  "draft":      { bg:"#7b2ff720", text:"#c084fc", dot:"#a855f7" },
  "Overdue":    { bg:"#ff4d6d20", text:"#ff4d6d", dot:"#ff4d6d" },
  "High":       { bg:"#ff4d6d20", text:"#ff4d6d", dot:"#ff4d6d" },
  "Medium":     { bg:"#7b2ff720", text:"#c084fc", dot:"#a855f7" },
  "Low":        { bg:"#00e5a020", text:"#00e5a0", dot:"#00e5a0" },
};
const sc = (s) => STATUS[s] || { bg:"#ffffff08", text:"#c8c8e8", dot:"#8888bb" };

const fmt = (n) => {
  if (!n) return "₹0";
  const num = Number(n);
  return num >= 100000 ? `₹${(num/100000).toFixed(1)}L` : `₹${num.toLocaleString("en-IN")}`;
};

// ── Font + Icon Loader ────────────────────────────────────────
function useAssets() {
  useEffect(() => {
    ["https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap",
     "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
    ].forEach(href => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const l = document.createElement("link");
        l.rel = "stylesheet"; l.href = href;
        document.head.appendChild(l);
      }
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
  const displayLabel = typeof label === 'string' ? (label.charAt(0).toUpperCase() + label.slice(1).replace('_', ' ')) : label;
  return (
    <span style={{ background:c.bg, color:c.text, fontSize:10, fontWeight:600,
      padding:"3px 10px", borderRadius:20, display:"inline-flex", alignItems:"center",
      gap:5, letterSpacing:0.3, whiteSpace:"nowrap", border:`1px solid ${c.dot}25` }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:c.dot }}/>
      {displayLabel}
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
function Sidebar({ active, setActive, user, setUser }) {
  const displayName = user?.clientName || user?.name || "Client";
  const initials = displayName.substring(0, 2).toUpperCase();

  const handleLogout = () => {
    if(setUser) setUser(null);
    else {
      localStorage.removeItem("user");
      window.location.href = "/";
    }
  };

  return (
    <div style={{ width:230, background:C.surface, borderRight:`1px solid ${C.border}`,
      display:"flex", flexDirection:"column", height:"100vh", position:"sticky", top:0, flexShrink:0,
      overflow:"hidden", position:"relative" }}>
      <GlowOrb color={C.pink} size={200} top={-80} left={-80} opacity={0.12}/>
      <GlowOrb color={C.purple} size={160} bottom={-60} right={-60} opacity={0.1}/>


      <div style={{ margin:"14px 14px 6px", background:C.card, borderRadius:14,
        padding:"14px", border:`1px solid ${C.border}`, position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:C.grad,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:13, fontWeight:700, color:"#fff", fontFamily:"'Space Grotesk'",
            boxShadow:`0 0 12px ${C.glowPurp}` }}>{initials}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.text,
              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{displayName}</div>
            <div style={{ fontSize:9, color:C.violet, fontWeight:600, letterSpacing:0.8 }}>CLIENT</div>
          </div>
        </div>
      </div>

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

      <div style={{ padding:"14px 10px 20px", borderTop:`1px solid ${C.border}`, position:"relative", zIndex:1 }}>
        <button onClick={handleLogout} style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
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
function Topbar({ active, notifs, user }) {
  const unread = notifs.filter(n=>!n.isRead).length;
  const label = NAV.find(n=>n.key===active)?.label || "Overview";
  const day = new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"});
  const displayName = user?.clientName || user?.name || "Client";
  const initials = displayName.substring(0, 2).toUpperCase();

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
        <div style={{ width:40, height:40, borderRadius:10, background:C.grad,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:13, fontWeight:700, color:"#fff", fontFamily:"'Space Grotesk'",
          boxShadow:`0 0 14px ${C.glowPurp}` }}>{initials}</div>
      </div>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────
function DashboardPage({ user, projects, invoices, tasks, notifs, setActive }) {
  const totalInvoiced = invoices.reduce((s,p)=>s+p.total,0);
  const totalPaid     = invoices.filter(p=>p.status==="paid").reduce((s,p)=>s+p.total,0);
  const totalOverdue  = invoices.filter(p=>p.status==="overdue").reduce((s,p)=>s+p.total,0);
  const activeProj    = projects.filter(p=>p.status!=="Completed").length;

  const getRelativeTime = (dateStr) => {
    if(!dateStr) return "";
    const d = new Date(dateStr);
    const diff = Math.floor((new Date() - d) / 1000);
    if(diff < 60) return `${diff}s ago`;
    if(diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if(diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:22,
        padding:"28px 30px", position:"relative", overflow:"hidden" }}>
        <GlowOrb color={C.pink}   size={300} top={-100} right={-50}  opacity={0.2}/>
        <GlowOrb color={C.purple} size={200} bottom={-80} left={-40} opacity={0.15}/>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontSize:10, color:C.pink, fontWeight:700, letterSpacing:2, marginBottom:8 }}>WELCOME BACK</div>
          <div style={{ fontSize:26, fontWeight:700, color:C.text,
            fontFamily:"'Space Grotesk',sans-serif", marginBottom:6 }}>{user?.clientName || user?.name || "Client"} 👋</div>
          <div style={{ fontSize:13, color:"#dcdcff", maxWidth:480, lineHeight:1.6 }}>
            You have{" "}
            <span style={{ color:C.red, fontWeight:600 }}>{invoices.filter(i => i.status === 'overdue').length} overdue invoices</span> and{" "}
            <span style={{ background:C.gradText, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontWeight:600 }}>
              {tasks.filter(t=>t.status!=="Done").length} active tasks
            </span>{" "}awaiting attention.
          </div>
          <div style={{ display:"flex", gap:10, marginTop:18, flexWrap:"wrap" }}>
            <span style={{ fontSize:11, background:C.gradSoft, color:C.pink,
              border:`1px solid ${C.pink}30`, padding:"5px 14px", borderRadius:20, fontWeight:600 }}>
              Client Portal</span>
            <span style={{ fontSize:11, background:"#00e5a015", color:C.green,
              border:`1px solid ${C.green}30`, padding:"5px 14px", borderRadius:20, fontWeight:600 }}>
              {activeProj} Active Projects</span>
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        <StatCard icon="ti-cash"            label="Total Invoiced" value={fmt(totalInvoiced)} sub="All time"         accent={C.pink} onClick={() => setActive("payments")}  />
        <StatCard icon="ti-circle-check"    label="Total Paid"     value={fmt(totalPaid)}     sub={`${invoices.filter(p=>p.status==="paid").length} invoices`} accent={C.green} onClick={() => setActive("payments")} />
        <StatCard icon="ti-alert-triangle"  label="Overdue"        value={fmt(totalOverdue)}  sub="Needs attention"  accent={C.red} onClick={() => setActive("payments")}   />
        <StatCard icon="ti-layout-kanban"   label="Active Projects" value={String(activeProj)} sub={`of ${projects.length} total`} accent={C.violet} onClick={() => setActive("projects")} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:18 }}>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:24, position:"relative", overflow:"hidden" }}>
          <GlowOrb color={C.purple} size={200} bottom={-60} right={-60} opacity={0.1}/>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, position:"relative", zIndex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.text, fontFamily:"'Space Grotesk'" }}>Project Progress</div>
            <button onClick={() => setActive("projects")} style={{ fontSize:11, color:C.pink, background:"none", border:"none",
              cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>View All →</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:16, position:"relative", zIndex:1 }}>
            {projects.slice(0, 4).map(p => {
              const progress = p.progress || 0;
              const col = p.status==="Completed"?C.green : p.status==="On Hold"?C.amber : progress>60?C.pink:C.violet;
              return (
                <div key={p._id} style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ position:"relative", flexShrink:0 }}>
                    <Ring pct={progress} size={50} color={col}/>
                    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
                      justifyContent:"center", fontSize:10, fontWeight:700, color:col,
                      fontFamily:"'Space Grotesk'" }}>{progress}%</div>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:C.text,
                        whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:140 }}>{p.name}</span>
                      <Badge label={p.status}/>
                    </div>
                    <div style={{ height:4, background:"#2a2a4a", borderRadius:99, overflow:"hidden" }}>
                      <div style={{ width:`${progress}%`, height:"100%", borderRadius:99,
                        background:`linear-gradient(90deg,${col},${col}bb)`,
                        boxShadow:`0 0 8px ${col}60`, transition:"width 1s ease" }}/>
                    </div>
                    <div style={{ fontSize:10, color:"#dcdcff", marginTop:4 }}>Tasks {p.completedTasks || 0}/{p.tasks || 0} · Deadline {p.deadline || "N/A"}</div>
                  </div>
                </div>
              );
            })}
            {projects.length === 0 && <div style={{ fontSize: 13, color: C.muted, textAlign: "center", marginTop: 20 }}>No projects found.</div>}
          </div>
        </div>

        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:24, position:"relative", overflow:"hidden" }}>
          <GlowOrb color={C.pink} size={160} top={-50} right={-50} opacity={0.1}/>
          <div style={{ fontSize:14, fontWeight:700, color:C.text,
            fontFamily:"'Space Grotesk'", marginBottom:18, position:"relative", zIndex:1 }}>Recent Alerts</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, position:"relative", zIndex:1 }}>
            {notifs.slice(0, 5).map(n => {
              const tc = { danger:C.red, success:C.green, info:C.blue, warning:C.amber };
              const col = tc[n.type]||C.muted;
              return (
                <div key={n._id} style={{ display:"flex", gap:10, padding:"12px 14px",
                  background: n.isRead ? "transparent" : `${col}0d`,
                  borderRadius:12, border:`1px solid ${n.isRead ? C.border : col+"30"}`,
                  alignItems:"flex-start" }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:`${col}18`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:15, flexShrink:0 }}>{n.icon || "🔔"}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight: n.isRead?400:600,
                      color: n.isRead?C.muted:C.text, lineHeight:1.4 }}>{n.text}</div>
                    <div style={{ fontSize:10, color:"#a0a0c8", marginTop:3 }}>{getRelativeTime(n.createdAt)}</div>
                  </div>
                  {!n.isRead && <div style={{ width:6, height:6, borderRadius:"50%", background:col,
                    boxShadow:`0 0 6px ${col}`, flexShrink:0, marginTop:4 }}/>}
                </div>
              );
            })}
            {notifs.length === 0 && <div style={{ fontSize: 13, color: C.muted, textAlign: "center", marginTop: 20 }}>No new alerts.</div>}
          </div>
        </div>
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:24, position:"relative", overflow:"hidden" }}>
        <GlowOrb color={C.purple} size={250} bottom={-80} right={-80} opacity={0.08}/>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, position:"relative", zIndex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.text, fontFamily:"'Space Grotesk'" }}>Recent Transactions</div>
          <GradBtn onClick={() => setActive("payments")}>View All</GradBtn>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 1fr 1fr 100px",
          padding:"8px 12px", fontSize:9, fontWeight:700, color:"#ffffff", letterSpacing:1.3,
          textTransform:"uppercase", borderBottom:`1px solid ${C.border}`, marginBottom:4, position:"relative", zIndex:1 }}>
          <span>Project</span><span>Invoice</span><span>Date</span><span>Amount</span><span>Status</span>
        </div>
        {invoices.slice(0, 5).map((p,i)=>(
          <div key={p._id || p.id} style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 1fr 1fr 100px",
            padding:"14px 12px", borderBottom: i<Math.min(invoices.length, 5)-1?`1px solid ${C.border}`:"none",
            alignItems:"center", borderRadius:10, transition:"background 0.15s", cursor:"pointer",
            position:"relative", zIndex:1 }}
            onMouseEnter={e=>e.currentTarget.style.background=C.surface}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:C.gradSoft,
                border:`1px solid ${C.pink}30`, display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:11, fontWeight:700, color:C.pink,
                fontFamily:"'Space Grotesk'" }}>{(p.project || "PR").slice(0,2).toUpperCase()}</div>
              <span style={{ fontSize:13, fontWeight:500, color:C.text }}>{p.project || "N/A"}</span>
            </div>
            <span style={{ fontSize:11, color:"#dcdcff" }}>{p.invoiceNo}</span>
            <span style={{ fontSize:11, color:"#dcdcff" }}>{p.date}</span>
            <span style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:"'Space Grotesk'" }}>{fmt(p.total)}</span>
            <Badge label={p.status}/>
          </div>
        ))}
        {invoices.length === 0 && <div style={{ fontSize: 13, color: C.muted, textAlign: "center", marginTop: 20 }}>No transactions found.</div>}
      </div>
    </div>
  );
}

// ── Projects Page ─────────────────────────────────────────────
function ProjectsPage({ projects }) {
  const [filter, setFilter] = useState("All");
  const shown = filter==="All" ? projects : projects.filter(p=>p.status===filter);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:13, color:"#e0e0ff" }}>{projects.length} projects total</div>
        <div style={{ display:"flex", gap:8 }}>
          {["All","Active","Completed","On Hold"].map((f,i)=>(
            <button key={f} onClick={() => setFilter(f)} style={{ padding:"6px 14px", background:filter===f?C.gradSoft:"transparent",
              border:`1px solid ${filter===f?C.pink+"50":C.border}`, borderRadius:8,
              color:filter===f?C.pink:C.muted, fontSize:11, cursor:"pointer", fontFamily:"inherit",
              fontWeight:filter===f?600:400 }}>{f}</button>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {shown.map(p=>{
          const budget = parseFloat(String(p.budget).replace(/[^0-9.-]+/g,"")) || 0;
          const spent = p.spent || (budget * (p.progress || 0) / 100);
          const bpct = budget > 0 ? Math.round((spent/budget)*100) : 0;
          const isOver = spent>budget;
          const progress = p.progress || 0;
          const col = p.status==="Completed"?C.green:p.status==="On Hold"?C.amber:progress>60?C.pink:C.violet;
          return (
            <div key={p._id} style={{ background:C.card, border:`1px solid ${C.border}`,
              borderRadius:20, padding:24, position:"relative", overflow:"hidden",
              transition:"border-color 0.2s, transform 0.2s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=col+"50";e.currentTarget.style.transform="translateY(-3px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="";}}>
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
                    <i className="ti ti-calendar" style={{ fontSize:12 }}/>{p.deadline || "No deadline"}
                  </div>
                </div>
                <Badge label={p.status}/>
              </div>

              <div style={{ marginBottom:18, position:"relative", zIndex:1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:11, color:"#dcdcff" }}>Completion</span>
                  <span style={{ fontSize:13, fontWeight:700, color:col,
                    fontFamily:"'Space Grotesk'", textShadow:`0 0 8px ${col}` }}>{progress}%</span>
                </div>
                <div style={{ height:6, background:"#2a2a4a", borderRadius:99, overflow:"hidden" }}>
                  <div style={{ width:`${progress}%`, height:"100%", borderRadius:99,
                    background:`linear-gradient(90deg,${C.pink},${C.purple})`,
                    boxShadow:`0 0 10px ${C.glowPink}` }}/>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8,
                marginBottom:14, position:"relative", zIndex:1 }}>
                {[
                  { l:"Budget", v:fmt(budget), c:C.pink   },
                  { l:"Spent (Est)",  v:fmt(spent),  c:isOver?C.red:C.text },
                  { l:"Tasks",  v:`${p.completedTasks || 0}/${p.tasks || 0}`, c:(p.completedTasks === p.tasks && p.tasks > 0)?C.green:C.text },
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
      {shown.length === 0 && <div style={{ fontSize: 14, color: C.muted, textAlign: "center", marginTop: 40 }}>No projects found.</div>}
    </div>
  );
}

// ── Tasks Page ────────────────────────────────────────────────
function TasksPage({ tasks }) {
  const [filter, setFilter] = useState("All");
  const shown = filter==="All" ? tasks : tasks.filter(t=>t.status===filter || (filter === "Done" && t.status === "Completed") || (filter === "Pending" && t.status === "Not Started"));
  
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {["All","In Progress","Pending","Done"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            style={{ padding:"7px 16px", background:filter===f?C.gradSoft:"transparent",
              border:`1px solid ${filter===f?C.pink+"50":C.border}`, borderRadius:10,
              color:filter===f?C.pink:C.muted, fontSize:12, fontWeight:filter===f?700:400,
              cursor:"pointer", fontFamily:"inherit" }}>
            {f} <span style={{ opacity:0.5 }}>({f==="All"?tasks.length:tasks.filter(t=>t.status===f || (f === "Done" && t.status === "Completed") || (f === "Pending" && t.status === "Not Started")).length})</span>
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
          <div key={t._id} style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 1fr 1fr 110px",
            padding:"16px 20px", borderBottom:i<shown.length-1?`1px solid ${C.border}`:"none",
            alignItems:"center", transition:"background 0.15s", cursor:"pointer", position:"relative", zIndex:1 }}
            onMouseEnter={e=>e.currentTarget.style.background=C.surface}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:20, height:20, borderRadius:6,
                border:`1.5px solid ${t.status==="Done" || t.status==="Completed"?C.green:C.dim}`,
                background:t.status==="Done" || t.status==="Completed"?`${C.green}20`:"transparent",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {(t.status==="Done" || t.status==="Completed") && <i className="ti ti-check" style={{ fontSize:11, color:C.green }}/>}
              </div>
              <span style={{ fontSize:13, fontWeight:500, color:(t.status==="Done" || t.status==="Completed")?C.muted:C.text,
                textDecoration:(t.status==="Done" || t.status==="Completed")?"line-through":"none" }}>{t.title}</span>
            </div>
            <span style={{ fontSize:12, color:"#dcdcff" }}>{t.project || "General"}</span>
            <Badge label={t.priority || "Medium"}/>
            <span style={{ fontSize:12, color:"#dcdcff" }}>{t.date || t.dueDate || "N/A"}</span>
            <Badge label={t.status || "Pending"}/>
          </div>
        ))}
        {shown.length === 0 && <div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: 20 }}>No tasks found.</div>}
      </div>
    </div>
  );
}

// ── Payments Page ─────────────────────────────────────────────
function PaymentsPage({ invoices }) {
  const totalInvoiced = invoices.reduce((s,p)=>s+p.total,0);
  const totalPaid     = invoices.filter(p=>p.status==="paid").reduce((s,p)=>s+p.total,0);
  const totalOverdue  = invoices.filter(p=>p.status==="overdue").reduce((s,p)=>s+p.total,0);
  const totalPending  = invoices.filter(p=>p.status==="unpaid" || p.status==="draft" || p.status==="sent").reduce((s,p)=>s+p.total,0);
  
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
          {invoices.map(inv=>{
            const c = sc(inv.status);
            const isOvd = inv.status==="overdue";
            return (
              <div key={inv._id || inv.id} style={{ display:"flex", alignItems:"center", gap:16,
                padding:"18px 20px", background:C.surface, borderRadius:14,
                border:`1px solid ${isOvd?C.red+"30":C.border}`, transition:"all 0.2s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.pink+"40";e.currentTarget.style.background=C.card;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=isOvd?C.red+"30":C.border;e.currentTarget.style.background=C.surface;}}>
                <div style={{ width:46, height:46, borderRadius:12, background:c.bg,
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <i className={inv.status==="paid"?"ti ti-receipt":isOvd?"ti ti-alert-triangle":"ti ti-clock"}
                    style={{ fontSize:18, color:c.text, filter:`drop-shadow(0 0 5px ${c.dot})` }}/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{inv.invoiceNo}</div>
                  <div style={{ fontSize:11, color:"#dcdcff" }}>{inv.project || "N/A"} · Due {inv.dueDate || "N/A"}</div>
                </div>
                <div style={{ textAlign:"right", marginRight:14 }}>
                  <div style={{ fontSize:16, fontWeight:700, color:C.text,
                    fontFamily:"'Space Grotesk'" }}>{fmt(inv.total)}</div>
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
          {invoices.length === 0 && <div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: 20 }}>No invoices found.</div>}
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
export default function ClientDashboard({ user, setUser }) {
  useAssets();
  const [active, setActive] = useState("dashboard");
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const clientName = user.clientName || user.name;
    const fetchAll = async () => {
      try {
        const [projRes, taskRes, invRes, notifRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/projects/client/${encodeURIComponent(clientName)}`, {
            headers: { 'x-company-id': user.companyId || "" }
          }),
          axios.get(`${BASE_URL}/api/tasks/client/${encodeURIComponent(clientName)}`, {
            headers: { 'x-company-id': user.companyId || "" }
          }),
          axios.get(`${BASE_URL}/api/invoices/client/${encodeURIComponent(clientName)}`, {
            headers: { 'x-company-id': user.companyId || "" }
          }),
          axios.get(`${BASE_URL}/api/notifications/${user._id || user.id}`)
        ]);
        setProjects(projRes.data || []);
        setTasks(taskRes.data || []);
        setInvoices(invRes.data || []);
        setNotifs(notifRes.data || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

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

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', background: C.bg, alignItems: 'center', justifyContent: 'center', color: C.text }}>Loading dashboard...</div>;
  }

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden",
      background:C.bg, fontFamily:"'Plus Jakarta Sans',sans-serif", color:C.text }}>
      <style>{CSS}</style>
      <Sidebar active={active} setActive={setActive} user={user} setUser={setUser}/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>
        <Topbar active={active} notifs={notifs} user={user} />
        <div key={active} className="pg"
          style={{ flex:1, overflowY:"auto", padding:"26px 30px" }}>
          {active==="dashboard" && <DashboardPage user={user} projects={projects} invoices={invoices} tasks={tasks} notifs={notifs} setActive={setActive} />}
          {active==="projects"  && <ProjectsPage projects={projects} />}
          {active==="tasks"     && <TasksPage tasks={tasks} />}
          {active==="payments"  && <PaymentsPage invoices={invoices} />}
          {active==="calendar"  && <PlaceholderPage icon="ti-calendar"       title="Business Calendar" sub="Deadlines, meetings, and milestones — all in one view."/>}
          {active==="messages"  && <PlaceholderPage icon="ti-message-circle" title="Messages"          sub="Communicate directly with your project team."/>}
          {active==="reports"   && <PlaceholderPage icon="ti-chart-bar"      title="Reports"           sub="Detailed financial and project performance analytics."/>}
          {active==="settings"  && <PlaceholderPage icon="ti-settings"       title="Settings"          sub="Manage your account, notifications and preferences."/>}
        </div>
      </div>
    </div>
  );
}
