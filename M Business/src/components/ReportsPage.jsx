// ════════════════════════════════════════════════════════════
//  ReportsPage.jsx  —  Drop-in component for Dashboard.jsx
//  Usage:  import ReportsPage from "./ReportsPage";
//  JSX:    {validActive === "reports" && <ReportsPage clients={clients} projects={projects} employees={employees} managers={managers} />}
// ════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../config";
const API = `${BASE_URL}/api/reports`;
const T   = { text:"#1e0a3c" };

const RPT_ICONS   = { "Monthly Revenue":"💰", "Project Summary":"📁", "Client Activity":"👥", "Team Overview":"👨‍💼" };
const RPT_COLORS  = ["#9333ea","#7c3aed","#a855f7","#f59e0b"];

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div style={{ background:"#fff", borderRadius:14, padding:"18px 16px",
      boxShadow:"0 4px 18px rgba(147,51,234,0.07)", border:"1px solid #ede9fe",
      position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-15, right:-15, width:70, height:70,
        borderRadius:"50%", background:`radial-gradient(circle,${color}20,transparent)` }}/>
      <div style={{ width:40, height:40, borderRadius:11, background:`${color}15`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:19, marginBottom:10 }}>{icon}</div>
      <div style={{ fontSize:10, color:"#a78bfa", fontWeight:700,
        letterSpacing:0.5, marginBottom:3 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize:26, fontWeight:800, color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#a78bfa", marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function ReportCard({ r, idx }) {
  const color  = RPT_COLORS[idx % RPT_COLORS.length];
  const icon   = RPT_ICONS[r.type] || "📊";
  const donePct = r.total > 0 ? Math.round((r.done / r.total) * 100) : 0;

  return (
    <div style={{ background:"#fff", borderRadius:16, padding:22,
      boxShadow:"0 4px 18px rgba(147,51,234,0.07)", border:"1px solid #ede9fe",
      position:"relative", overflow:"hidden" }}>

      {/* BG decoration */}
      <div style={{ position:"absolute", top:-25, right:-25, width:100, height:100,
        borderRadius:"50%", background:`radial-gradient(circle,${color}12,transparent)` }}/>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:16 }}>
        <div style={{ width:44, height:44, borderRadius:12, background:`${color}15`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:20, flexShrink:0 }}>{icon}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:10, color:"#a78bfa", fontWeight:700, letterSpacing:0.5 }}>
            {r.id}
          </div>
          <div style={{ fontSize:16, fontWeight:800, color:T.text, marginTop:1 }}>{r.type}</div>
          <div style={{ fontSize:12, color:"#a78bfa", marginTop:2 }}>📅 {r.range}</div>
        </div>
        {/* Revenue badge */}
        <div style={{ background:`${color}15`, border:`1px solid ${color}30`,
          borderRadius:10, padding:"6px 12px", flexShrink:0 }}>
          <div style={{ fontSize:11, fontWeight:800, color }}>
            {typeof r.revenue === "string" ? r.revenue : (r.currency || "₹") + r.revenue}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between",
          fontSize:11, color:"#a78bfa", fontWeight:600, marginBottom:5 }}>
          <span>Completion</span>
          <span style={{ color, fontWeight:800 }}>{donePct}%</span>
        </div>
        <div style={{ background:"#ede9fe", borderRadius:6, height:8 }}>
          <div style={{ width:`${donePct}%`,
            background:`linear-gradient(90deg,${color},${color}99)`,
            borderRadius:6, height:"100%", transition:"width 0.6s ease" }}/>
        </div>
      </div>

      {/* 4-metric grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
        {[
          { k:"Total",    v:r.total,   c:"#9333ea" },
          { k:"Revenue",  v:r.revenue, c:color      },
          { k:"Done ✅",  v:r.done,    c:"#22C55E"  },
          { k:"Pending ⏳",v:r.pending, c:"#f59e0b" },
        ].map(({ k, v, c }) => (
          <div key={k} style={{ background:"#faf5ff", borderRadius:10,
            padding:"10px 12px", border:"1px solid #ede9fe" }}>
            <div style={{ fontSize:10, color:"#a78bfa", fontWeight:700,
              letterSpacing:0.5, marginBottom:4 }}>{k.toUpperCase()}</div>
            <div style={{ fontSize: typeof v === "number" ? 20 : 14,
              fontWeight:800, color:c, wordBreak:"break-word" }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ───────────────────────────────────────────
export default function ReportsPage({ clients=[], projects=[], employees=[], managers=[] }) {
  const [reports,  setReports]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API);
      setReports(res.data);
      setLastSync(new Date());
    } catch {
      // Fallback — frontend data-இலிருந்து calculate பண்ணு
      buildLocalReports();
    } finally { setLoading(false); }
  };

  // ── offline fallback: frontend props-இலிருந்து compute ─────
  const buildLocalReports = () => {
    const now       = new Date();
    const MONTHS    = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
    const quarter   = Math.ceil((now.getMonth()+1)/3);

    const sumBudget = (arr) => arr.reduce((acc,p)=>{
      const n = parseFloat((p.budget||"0").toString().replace(/[^0-9.]/g,""));
      return acc + (isNaN(n)?0:n);
    },0);
    const fmtCur = (n, sym = "₹") => n>=100000 ? `${sym}${(n/100000).toFixed(2)}L` : `${sym}${n.toLocaleString("en-IN")}`;

    const projThisMonth = projects.filter(p=>{
      const d = p.createdAt ? new Date(p.createdAt) : null;
      if (!d) return false;
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}` === thisMonth;
    });
    const allStaff = [...employees,...managers];

    setReports([
      { id:"RPT001", type:"Monthly Revenue",
        range:`${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
        total:projThisMonth.length, revenue:fmtCur(sumBudget(projThisMonth)),
        done:projThisMonth.filter(p=>p.status==="Completed").length,
        pending:projThisMonth.filter(p=>p.status!=="Completed").length },
      { id:"RPT002", type:"Project Summary",
        range:`Q${quarter} ${now.getFullYear()}`,
        total:projects.length, revenue:fmtCur(sumBudget(projects)),
        done:projects.filter(p=>p.status==="Completed").length,
        pending:projects.filter(p=>p.status!=="Completed").length },
      { id:"RPT003", type:"Client Activity",
        range:`${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
        total:clients.length, revenue:fmtCur(sumBudget(projThisMonth)),
        done:clients.filter(c=>c.status==="Active").length,
        pending:clients.filter(c=>c.status!=="Active").length },
      { id:"RPT004", type:"Team Overview",
        range:`${now.getFullYear()}`,
        total:allStaff.length,
        revenue:`${employees.length} Emp · ${managers.length} Mgr`,
        done:allStaff.filter(m=>m.status==="Active").length,
        pending:allStaff.filter(m=>m.status!=="Active").length },
    ]);
  };

  // ── summary stats (top row) ─────────────────────────────
  const totalRevStr = reports.find(r=>r.type==="Project Summary")?.revenue || "₹0";
  const totalProj   = reports.find(r=>r.type==="Project Summary")?.total   || 0;
  const totalDone   = reports.find(r=>r.type==="Project Summary")?.done    || 0;
  const totalPending= reports.find(r=>r.type==="Project Summary")?.pending || 0;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* ── Top toolbar ── */}
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div>
          <p style={{ margin:0, fontSize:13, color:"#a78bfa" }}>
            📊 Auto-generated from live database · {" "}
            {lastSync && (
              <span style={{ fontSize:11 }}>
                Last synced: {lastSync.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button onClick={fetchReports} disabled={loading}
          style={{ background:"linear-gradient(135deg,#9333ea,#7c3aed)", color:"#fff",
            border:"none", borderRadius:10, padding:"8px 18px", fontWeight:700,
            fontSize:13, cursor:"pointer", fontFamily:"inherit",
            opacity:loading?0.7:1, display:"flex", alignItems:"center", gap:6 }}>
          {loading ? "⏳ Loading…" : "🔄 Refresh Reports"}
        </button>
      </div>

      {/* ── Summary stat row ── */}
      <div className="dash-stats"
        style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        <StatCard icon="💰" label="Total Revenue"  value={totalRevStr}      color="#9333ea" />
        <StatCard icon="📁" label="Total Projects" value={totalProj}        color="#7c3aed" sub={`${totalDone} completed`} />
        <StatCard icon="✅" label="Completed"      value={totalDone}        color="#22C55E" />
        <StatCard icon="⏳" label="In Progress"    value={totalPending}     color="#f59e0b" />
      </div>

      {/* ── Report cards ── */}
      {loading
        ? (
          <div style={{ textAlign:"center", padding:70, background:"#fff",
            borderRadius:16, border:"1px solid #ede9fe" }}>
            <div style={{ fontSize:40, marginBottom:14 }}>⏳</div>
            <div style={{ fontSize:14, fontWeight:600, color:"#a78bfa" }}>
              Generating reports from database...
            </div>
          </div>
        )
        : reports.length === 0
          ? (
            <div style={{ textAlign:"center", padding:70, background:"#fff",
              borderRadius:16, border:"1px solid #ede9fe" }}>
              <div style={{ fontSize:48, marginBottom:14 }}>📈</div>
              <div style={{ fontSize:15, fontWeight:700, color:"#1e0a3c" }}>
                No report data yet
              </div>
              <div style={{ fontSize:13, color:"#a78bfa", marginTop:6 }}>
                Add projects, clients & employees to see live reports
              </div>
              <button onClick={fetchReports}
                style={{ marginTop:16, background:"linear-gradient(135deg,#9333ea,#7c3aed)",
                  color:"#fff", border:"none", borderRadius:10, padding:"10px 20px",
                  fontWeight:700, fontSize:13, cursor:"pointer" }}>
                Try Again
              </button>
            </div>
          )
          : (
            <div style={{ display:"grid",
              gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:14 }}>
              {reports.map((r, idx) => (
                <ReportCard key={r.id} r={r} idx={idx} />
              ))}
            </div>
          )
      }

      {/* ── Quick summary table ── */}
      {reports.length > 0 && (
        <div style={{ background:"#fff", borderRadius:16, padding:22,
          boxShadow:"0 4px 24px rgba(147,51,234,0.08)", border:"1px solid #ede9fe" }}>
          <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:700, color:"#1e0a3c" }}>
            📋 Summary Table
          </h3>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"linear-gradient(90deg,#f5f3ff,#faf5ff)" }}>
                  {["Report","Period","Total","Revenue","Done","Pending"].map(col => (
                    <th key={col} style={{ padding:"10px 14px", textAlign:"left",
                      color:"#7c3aed", fontWeight:700, fontSize:11,
                      borderBottom:"2px solid #ede9fe", whiteSpace:"nowrap" }}>
                      {col.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => {
                  const color = RPT_COLORS[i % RPT_COLORS.length];
                  return (
                    <tr key={r.id}
                      style={{ borderBottom:"1px solid #f3f0ff" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#faf5ff"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{ padding:"12px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:16 }}>{RPT_ICONS[r.type]||"📊"}</span>
                          <span style={{ fontWeight:700, color:"#1e0a3c" }}>{r.type}</span>
                        </div>
                      </td>
                      <td style={{ padding:"12px 14px", color:"#a78bfa" }}>{r.range}</td>
                      <td style={{ padding:"12px 14px", fontWeight:700, color }}>
                        {r.total}
                      </td>
                      <td style={{ padding:"12px 14px", fontWeight:700, color }}>
                        {r.revenue}
                      </td>
                      <td style={{ padding:"12px 14px" }}>
                        <span style={{ color:"#22C55E", fontWeight:700 }}>{r.done}</span>
                      </td>
                      <td style={{ padding:"12px 14px" }}>
                        <span style={{ color:"#f59e0b", fontWeight:700 }}>{r.pending}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
