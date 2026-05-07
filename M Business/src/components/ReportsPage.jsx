// ════════════════════════════════════════════════════════════
//  ReportsPage.jsx  —  Drop-in component for Dashboard.jsx
//  Usage:  import ReportsPage from "./ReportsPage";
//  JSX:    {validActive === "reports" && <ReportsPage THEME={THEME} clients={clients} projects={projects} employees={employees} managers={managers} />}
// ════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../config";
const API = `${BASE_URL}/api/reports`;

function StatCard({ THEME, icon, label, value, color, sub }) {
  return (
    <div style={{ background:THEME.card, borderRadius:16, padding:"18px 16px",
      boxShadow: THEME.shadow, border:`1px solid ${THEME.border}`,
      position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-15, right:-15, width:70, height:70,
        borderRadius:"50%", background:`radial-gradient(circle,${color}20,transparent)` }}/>
      <div style={{ width:40, height:40, borderRadius:11, background:`${color}15`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:19, marginBottom:10 }}>{icon}</div>
      <div style={{ fontSize: 10, color: THEME.muted, fontWeight: 800,
        letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: THEME.muted, marginTop: 6, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

function ReportCard({ THEME, r, idx, RPT_COLORS }) {
  const color = RPT_COLORS[idx % RPT_COLORS.length];
  const icon = RPT_ICONS[r.type] || "📊";
  const donePct = r.total > 0 ? Math.round((r.done / r.total) * 100) : 0;

  return (
    <div style={{ background: THEME.card, borderRadius: 24, padding: 28,
      boxShadow: THEME.shadow, border: `1.5px solid ${THEME.border}`,
      position: "relative", overflow: "hidden" }}>

      {/* BG decoration */}
      <div style={{ position:"absolute", top:-25, right:-25, width:100, height:100,
        borderRadius:"50%", background:`radial-gradient(circle,${color}12,transparent)` }}/>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:16 }}>
        <div style={{ width:44, height:44, borderRadius:12, background:`${color}15`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:20, flexShrink:0 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: THEME.muted, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase" }}>
            {r.id}
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: THEME.text, marginTop: 2 }}>{r.type}</div>
          <div style={{ fontSize: 12, color: THEME.muted, marginTop: 4, fontWeight: 600 }}>📅 {r.range}</div>
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
        <div style={{ display: "flex", justifyContent: "space-between",
          fontSize: 11, color: THEME.muted, fontWeight: 700, marginBottom: 6 }}>
          <span>Completion</span>
          <span style={{ color: color, fontWeight: 900 }}>{donePct}%</span>
        </div>
        <div style={{ background: THEME.surface, borderRadius: 10, height: 10 }}>
          <div style={{ width: `${donePct}%`,
            background: color,
            borderRadius: 10, height: "100%", transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        </div>
      </div>

      {/* 4-metric grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { k: "Total", v: r.total, c: THEME.accent },
          { k: "Revenue", v: r.revenue, c: color },
          { k: "Done ✅", v: r.done, c: "#22C55E" },
          { k: "Pending ⏳", v: r.pending, c: "#f59e0b" },
        ].map(({ k, v, c }) => (
          <div key={k} style={{ background: THEME.surface, borderRadius: 14,
            padding: "12px 14px", border: `1.5px solid ${THEME.border}` }}>
            <div style={{ fontSize: 10, color: THEME.muted, fontWeight: 800,
              letterSpacing: 0.8, marginBottom: 6, textTransform: "uppercase" }}>{k}</div>
            <div style={{ fontSize: typeof v === "number" ? 22 : 14,
              fontWeight: 900, color: c, wordBreak: "break-word" }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const RPT_ICONS = { "Monthly Revenue": "💰", "Project Summary": "📁", "Client Activity": "👥", "Team Overview": "👨‍💼", "Finance Overview": "📉" };

// ── MAIN COMPONENT ───────────────────────────────────────────
export default function ReportsPage({ THEME, clients=[], projects=[], employees=[], managers=[], income=[], expenses=[] }) {
  const [reports,  setReports]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const RPT_COLORS = [THEME.accent, THEME.accent, THEME.muted, "#f59e0b"];

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API);
      setReports(res.data);
      setLastSync(new Date());
    } catch {
      buildLocalReports();
    } finally { setLoading(false); }
  };

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
      { id:"RPT005", type:"Finance Overview",
        range:`${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
        total:income.length + expenses.length,
        revenue: fmtCur(income.reduce((s,x)=>s+(Number(x.amount)||0),0)),
        done: income.length,
        pending: expenses.length },
    ]);
  };

  const [selectedReport, setSelectedReport] = useState(null);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: THEME.text, paddingBottom: 60 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');`}</style>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 20, marginBottom: 32 }}>
        <StatCard THEME={THEME} icon="💰" label="Total Revenue" value="₹12.4L" color="#10b981" sub="+14% from last month" />
        <StatCard THEME={THEME} icon="📁" label="Active Projects" value={projects.length} color={THEME.accent} sub="Across 8 categories" />
        <StatCard THEME={THEME} icon="👥" label="Total Clients" value={clients.length} color="#f59e0b" sub="Active partnerships" />
        <StatCard THEME={THEME} icon="🤝" label="Team Size" value={employees.length + managers.length} color="#6366f1" sub="Talented professionals" />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: "-0.5px" }}>Available Reports</h2>
          <p style={{ margin: "4px 0 0", color: THEME.muted, fontSize: 14, fontWeight: 600 }}>Real-time business insights and analytics</p>
        </div>
        <button onClick={fetchReports} style={{ background: THEME.accent, color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.2)" }}>🔄 Refresh Reports</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 24 }}>
        {loading ? [1, 2, 3, 4].map(i => <div key={i} style={{ height: 300, background: THEME.surface, borderRadius: 24, animation: "pulse 1.5s infinite" }} />)
          : reports.map((r, i) => (
            <div key={r.id} onClick={() => setSelectedReport(r.type)} style={{ cursor: "pointer" }}>
                <ReportCard THEME={THEME} r={r} idx={i} RPT_COLORS={RPT_COLORS} />
            </div>
          ))}
      </div>
      <style>{`@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }`}</style>
      
      {selectedReport === "Finance Overview" && (
        <div style={{ 
          background:THEME.card, borderRadius:24, padding:"30px",
          boxShadow:"0 20px 50px rgba(0,0,0,0.2)", border:`1px solid ${THEME.border}`, 
          marginTop: 40, animation: "fadeInUp 0.4s ease-out" 
        }}>
          <style>{`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
             <div>
               <h3 style={{ margin: 0, fontSize:20, fontWeight:900, color:THEME.text, letterSpacing: "-0.5px" }}>
                 💰 Financial Records
               </h3>
               <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--app-muted)" }}>Detailed breakdown of recent income and expenditures</p>
             </div>
             <button 
               onClick={() => setSelectedReport(null)} 
               style={{ 
                 background: "var(--app-bg)", border: "1px solid var(--app-border)", 
                 borderRadius: 12, padding: "8px 16px", color: "var(--app-text)", 
                 fontWeight: 700, cursor: "pointer", fontSize: 13, transition: "0.2s"
               }}
               onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
               onMouseLeave={e => e.currentTarget.style.background = "var(--app-bg)"}
             >Close Details ✕</button>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 30 }}>
            {/* Income Table */}
            <div style={{ background: "#fcfdfc", borderRadius: 16, padding: 20, border: "1px solid #eef2ee" }}>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: "#16a34a", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 32, height: 32, borderRadius: 10, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>📥</span>
                Recent Income
              </h4>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "var(--app-muted)", borderBottom: "2.5px solid #f1f5f9" }}>
                      <th style={{ padding: "12px 8px", fontWeight: 700, fontSize: 11, letterSpacing: 0.5 }}>DATE</th>
                      <th style={{ padding: "12px 8px", fontWeight: 700, fontSize: 11, letterSpacing: 0.5 }}>SOURCE</th>
                      <th style={{ padding: "12px 8px", fontWeight: 700, fontSize: 11, letterSpacing: 0.5, textAlign: "right" }}>AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {income.length > 0 ? income.slice(0, 15).map((item, i) => (
                      <tr key={i} style={{ borderBottom: "1.5px solid #f8fafc" }}>
                        <td style={{ padding: "14px 8px", color: "var(--app-muted)" }}>{item.date ? new Date(item.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' }) : "N/A"}</td>
                        <td style={{ padding: "14px 8px", fontWeight: 700, color: "var(--app-text)" }}>{item.source || item.title || "Payment Received"}</td>
                        <td style={{ padding: "14px 8px", textAlign: "right", color: "#16a34a", fontWeight: 800 }}>₹{Number(item.amount).toLocaleString()}</td>
                      </tr>
                    )) : <tr><td colSpan="3" style={{ padding: 40, textAlign: "center", color: "var(--app-muted)" }}>No income records found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Expense Table */}
            <div style={{ background: "#fdfcfc", borderRadius: 16, padding: 20, border: "1px solid #f2eeee" }}>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: "#dc2626", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 32, height: 32, borderRadius: 10, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>📤</span>
                Recent Expenses
              </h4>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "var(--app-muted)", borderBottom: "2.5px solid #f1f5f9" }}>
                      <th style={{ padding: "12px 8px", fontWeight: 700, fontSize: 11, letterSpacing: 0.5 }}>DATE</th>
                      <th style={{ padding: "12px 8px", fontWeight: 700, fontSize: 11, letterSpacing: 0.5 }}>CATEGORY</th>
                      <th style={{ padding: "12px 8px", fontWeight: 700, fontSize: 11, letterSpacing: 0.5, textAlign: "right" }}>AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length > 0 ? expenses.slice(0, 15).map((item, i) => (
                      <tr key={i} style={{ borderBottom: "1.5px solid #f8fafc" }}>
                        <td style={{ padding: "14px 8px", color: "var(--app-muted)" }}>{item.date ? new Date(item.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' }) : "N/A"}</td>
                        <td style={{ padding: "14px 8px", fontWeight: 700, color: "var(--app-text)" }}>{item.category || item.title || "General Expense"}</td>
                        <td style={{ padding: "14px 8px", textAlign: "right", color: "#dc2626", fontWeight: 800 }}>₹{Number(item.amount).toLocaleString()}</td>
                      </tr>
                    )) : <tr><td colSpan="3" style={{ padding: 40, textAlign: "center", color: "var(--app-muted)" }}>No expense records found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick summary table ── */}
      {reports.length > 0 && !selectedReport && (
        <div style={{ background:"var(--app-card)", borderRadius:16, padding:22,
          boxShadow:"0 10px 30px rgba(0,0,0,0.05)", border:"1px solid var(--app-border)" }}>
          <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:700, color:"var(--app-text)" }}>
            📋 Summary Table
          </h3>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"linear-gradient(90deg,var(--app-bg),var(--app-bg))" }}>
                  {["Report","Period","Total","Revenue","Done","Pending"].map(col => (
                    <th key={col} style={{ padding:"10px 14px", textAlign:"left",
                      color:"var(--app-accent)", fontWeight:700, fontSize:11,
                      borderBottom:"2px solid var(--app-border)", whiteSpace:"nowrap" }}>
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
                      onClick={() => setSelectedReport(r.type)}
                      style={{ borderBottom:"1px solid var(--app-border)", cursor: "pointer" }}
                      onMouseEnter={e=>e.currentTarget.style.background="var(--app-bg)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{ padding:"12px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:16 }}>{RPT_ICONS[r.type]||"📊"}</span>
                          <span style={{ fontWeight:700, color:"var(--app-text)" }}>{r.type}</span>
                        </div>
                      </td>
                      <td style={{ padding:"12px 14px", color:"var(--app-muted)" }}>{r.range}</td>
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


