import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

const P = {
  accent:  "#9333ea",
  mid:     "#7c3aed",
  dark:    "#1e0a3c",
  light:   "#f5f3ff",
  border:  "#ede9fe",
  text:    "#1e0a3c",
  muted:   "#a78bfa",
  hover:   "#faf5ff",
};

const STATUS_CFG = {
  "Done":          { bg:"#00c875", fg:"#fff" },
  "Working on it": { bg:"#fdab3d", fg:"#fff" },
  "Stuck":         { bg:"#e2445c", fg:"#fff" },
  "In Review":     { bg:"#9333ea", fg:"#fff" },
  "Not Started":   { bg:"#c4c4c4", fg:"#555" },
  "On Hold":       { bg:"#7c3aed", fg:"#fff" },
};
const STATUS_LIST = ["Not Started","Working on it","In Review","Stuck","Done","On Hold"];
const GRP_COLORS  = ["#e2445c","#0073ea","#fdab3d","#9333ea","#00c875","#a25ddc","#7c3aed","#ff642e","#00d4c8"];

const AVATAR_COLORS = [
  "linear-gradient(135deg,#9333ea,#c084fc)",
  "linear-gradient(135deg,#0073ea,#60a5fa)",
  "linear-gradient(135deg,#00c875,#34d399)",
  "linear-gradient(135deg,#fdab3d,#fbbf24)",
  "linear-gradient(135deg,#e2445c,#f87171)",
  "linear-gradient(135deg,#a25ddc,#d8b4fe)",
];

function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function fmt(d){
  if(!d)return"";
  const dt=new Date(d);
  return isNaN(dt)?d:dt.toLocaleDateString("en-US",{month:"short",day:"numeric"});
}

const COL_W = {
  checkbox: 36,
  task: 280,
  person: 150,
  status: 190,
  date: 160,
  priority_col: 190,
  addcol: 44,
  dots: 80
};
function extraColWidth(type) {
  if (type === "text")     return 140;
  if (type === "number")   return 90;
  if (type === "checkbox") return 70;
  if (type === "rating")   return 110;
  if (type === "timeline") return 160;
  if (type === "tags")     return 130;
  return 120;
}

const PRIORITY_CFG = {
  "Critical": { bg: "#e2445c", fg: "#fff" },
  "High":     { bg: "#fdab3d", fg: "#fff" },
  "Medium":   { bg: "#9333ea", fg: "#fff" },
  "Low":      { bg: "#00c875", fg: "#fff" },
  "—":        { bg: "#e2e8f0", fg: "#94a3b8" },
};
const PRIORITY_LIST = ["Critical","High","Medium","Low","—"];

/* ══════════════════════════════════════════════════════════
   VIEW DEFINITIONS
══════════════════════════════════════════════════════════ */
const VIEW_LIST = [
  { id:"table",    icon:"⊞", label:"Main table", color:"#0073ea" },
  { id:"chart",    icon:"◕", label:"Chart",       color:"#9333ea" },
  { id:"gantt",    icon:"≡", label:"Gantt",       color:"#0073ea" },
  { id:"calendar", icon:"📅", label:"Calendar",   color:"#e2445c" },
  { id:"kanban",   icon:"⊟", label:"Kanban",      color:"#00c875" },
];

/* ══════════════════════════════════════════════════════════
   CHART VIEW
══════════════════════════════════════════════════════════ */
function ChartView({ groups }) {
  const allTasks = groups.flatMap(g => g.tasks || []);
  const statusData = Object.entries(STATUS_CFG).map(([s, cfg]) => ({
    label: s, count: allTasks.filter(t => t.status === s).length, color: cfg.bg
  })).filter(x => x.count > 0);

  const groupData = groups.map(g => ({
    label: g.label, color: g.color,
    done:  (g.tasks||[]).filter(t => t.status === "Done").length,
    total: (g.tasks||[]).length
  }));

  const priorityData = PRIORITY_LIST.slice(0,4).map(p => ({
    label: p, count: allTasks.filter(t => (t.priority||"—") === p).length,
    color: PRIORITY_CFG[p].bg
  })).filter(x => x.count > 0);

  const maxStatus = Math.max(...statusData.map(x => x.count), 1);
  const maxGroup  = Math.max(...groupData.map(x => x.total), 1);
  const total = allTasks.length;

  const donutR = 56; const cx = 80; const cy = 80;
  const circ = 2 * Math.PI * donutR;
  let off = 0;
  const segs = statusData.map(item => {
    const dash = total > 0 ? (item.count/total)*circ : 0;
    const s = { ...item, dash, offset: off }; off += dash; return s;
  });

  return (
    <div style={{ padding:24, display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>

        {/* Status Bar Chart */}
        <div style={{ flex:1, minWidth:280, background:"#fff", borderRadius:14, border:`1px solid ${P.border}`, padding:22, boxShadow:"0 2px 12px rgba(124,58,237,0.07)" }}>
          <div style={{ fontSize:14, fontWeight:800, color:P.text, marginBottom:3 }}>📊 Status Distribution</div>
          <div style={{ fontSize:12, color:P.muted, marginBottom:18 }}>Tasks by current status</div>
          {statusData.length === 0
            ? <div style={{ textAlign:"center", color:P.muted, fontSize:12, padding:20 }}>No tasks yet</div>
            : statusData.map(item => (
              <div key={item.label} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{ width:120, fontSize:11, color:P.text, fontWeight:600, flexShrink:0, textAlign:"right" }}>{item.label}</div>
                <div style={{ flex:1, height:26, background:P.light, borderRadius:6, overflow:"hidden" }}>
                  <div style={{ width:`${(item.count/maxStatus)*100}%`, height:"100%", background:item.color, borderRadius:6, display:"flex", alignItems:"center", paddingLeft:8, transition:"width .6s ease", minWidth:item.count>0?26:0 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:"#fff" }}>{item.count}</span>
                  </div>
                </div>
              </div>
            ))
          }
        </div>

        {/* Donut */}
        <div style={{ flex:1, minWidth:220, background:"#fff", borderRadius:14, border:`1px solid ${P.border}`, padding:22, boxShadow:"0 2px 12px rgba(124,58,237,0.07)" }}>
          <div style={{ fontSize:14, fontWeight:800, color:P.text, marginBottom:3 }}>🍩 Overview</div>
          <div style={{ fontSize:12, color:P.muted, marginBottom:16 }}>{total} total tasks</div>
          <div style={{ display:"flex", gap:16, alignItems:"center" }}>
            <svg width={160} height={160} style={{ flexShrink:0 }}>
              <circle cx={cx} cy={cy} r={donutR} fill="none" stroke={P.light} strokeWidth={22}/>
              {segs.map((s,i) => (
                <circle key={i} cx={cx} cy={cy} r={donutR} fill="none"
                  stroke={s.color} strokeWidth={20}
                  strokeDasharray={`${s.dash} ${circ}`}
                  strokeDashoffset={-s.offset}
                  transform={`rotate(-90 ${cx} ${cy})`}/>
              ))}
              <text x={cx} y={cy-5} textAnchor="middle" fontSize={22} fontWeight={800} fill={P.text}>{total}</text>
              <text x={cx} y={cy+14} textAnchor="middle" fontSize={11} fill={P.muted}>tasks</text>
            </svg>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {statusData.map(item => (
                <div key={item.label} style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:3, background:item.color, flexShrink:0 }}/>
                  <span style={{ fontSize:11, color:P.text }}>{item.label}</span>
                  <span style={{ fontSize:11, color:P.muted, marginLeft:"auto", fontWeight:700 }}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Group Progress */}
      <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${P.border}`, padding:22, boxShadow:"0 2px 12px rgba(124,58,237,0.07)" }}>
        <div style={{ fontSize:14, fontWeight:800, color:P.text, marginBottom:3 }}>📈 Group Progress</div>
        <div style={{ fontSize:12, color:P.muted, marginBottom:18 }}>Completion per group</div>
        <div style={{ display:"flex", gap:16, alignItems:"flex-end", height:160, overflowX:"auto" }}>
          {groupData.length === 0
            ? <div style={{ flex:1, textAlign:"center", color:P.muted, fontSize:12, paddingTop:60 }}>No groups yet</div>
            : groupData.map(g => {
                const pct = g.total > 0 ? Math.round(g.done/g.total*100) : 0;
                const h   = g.total > 0 ? (g.total/maxGroup)*130 : 4;
                const dh  = g.total > 0 ? (g.done/maxGroup)*130  : 0;
                return (
                  <div key={g.label} style={{ flex:1, minWidth:80, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:P.accent }}>{pct}%</div>
                    <div style={{ width:"100%", height:130, background:P.light, borderRadius:"8px 8px 0 0", position:"relative" }}>
                      <div style={{ width:"100%", height:h, background:`${g.color}30`, borderRadius:"8px 8px 0 0", position:"absolute", bottom:0 }}/>
                      <div style={{ width:"100%", height:dh, background:g.color, borderRadius:"6px 6px 0 0", position:"absolute", bottom:0, transition:"height .6s" }}/>
                    </div>
                    <div style={{ fontSize:11, color:P.text, fontWeight:600, textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:80 }}>{g.label}</div>
                    <div style={{ fontSize:10, color:P.muted }}>{g.done}/{g.total}</div>
                  </div>
                );
              })
          }
        </div>
      </div>

      {/* Priority breakdown */}
      {priorityData.length > 0 && (
        <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${P.border}`, padding:22, boxShadow:"0 2px 12px rgba(124,58,237,0.07)" }}>
          <div style={{ fontSize:14, fontWeight:800, color:P.text, marginBottom:3 }}>🔥 Priority Breakdown</div>
          <div style={{ fontSize:12, color:P.muted, marginBottom:18 }}>Tasks by priority level</div>
          {priorityData.map(item => {
            const maxP = Math.max(...priorityData.map(x => x.count), 1);
            return (
              <div key={item.label} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{ width:80, fontSize:11, color:P.text, fontWeight:600, flexShrink:0, textAlign:"right" }}>{item.label}</div>
                <div style={{ flex:1, height:26, background:P.light, borderRadius:6, overflow:"hidden" }}>
                  <div style={{ width:`${(item.count/maxP)*100}%`, height:"100%", background:item.color, borderRadius:6, display:"flex", alignItems:"center", paddingLeft:8, transition:"width .6s", minWidth:26 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:"#fff" }}>{item.count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   GANTT VIEW
══════════════════════════════════════════════════════════ */
function GanttView({ groups }) {
  const allTasks = groups.flatMap(g => (g.tasks||[]).map(t => ({ ...t, groupColor:g.color })));
  const withDates = allTasks.filter(t => t.date);

  if (withDates.length === 0) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:80, gap:12 }}>
      <div style={{ fontSize:48 }}>📅</div>
      <div style={{ fontSize:16, fontWeight:700, color:P.text }}>No dates set</div>
      <div style={{ fontSize:13, color:P.muted }}>Add due dates to tasks to see Gantt view</div>
    </div>
  );

  const dates = withDates.map(t => new Date(t.date));
  const minD = new Date(Math.min(...dates)); minD.setDate(minD.getDate()-3);
  const maxD = new Date(Math.max(...dates)); maxD.setDate(maxD.getDate()+6);
  const totalDays = Math.ceil((maxD-minD)/(1000*60*60*24));
  const dayW = 40;
  const days = [];
  for (let i=0; i<totalDays; i++) { const d=new Date(minD); d.setDate(d.getDate()+i); days.push(new Date(d)); }
  const today = new Date(); today.setHours(0,0,0,0);
  const todayOff = Math.floor((today-minD)/(1000*60*60*24));

  return (
    <div style={{ padding:24 }}>
      <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${P.border}`, overflow:"hidden", boxShadow:"0 2px 12px rgba(124,58,237,0.07)" }}>
        <div style={{ overflowX:"auto" }}>
          <div style={{ minWidth: 260 + totalDays*dayW }}>
            {/* Header */}
            <div style={{ display:"flex", borderBottom:`1.5px solid ${P.border}`, background:P.light }}>
              <div style={{ width:260, flexShrink:0, padding:"10px 16px", fontSize:12, fontWeight:700, color:P.muted, borderRight:`1px solid ${P.border}` }}>Task</div>
              <div style={{ display:"flex" }}>
                {days.map((d,i) => {
                  const ts = new Date(d); ts.setHours(0,0,0,0);
                  const isToday = ts.getTime() === today.getTime();
                  const isWknd  = d.getDay()===0 || d.getDay()===6;
                  return (
                    <div key={i} style={{ width:dayW, flexShrink:0, textAlign:"center", padding:"5px 0",
                      background:isToday?"#fff8f0":isWknd?"#fafafa":"transparent",
                      borderRight:`1px solid ${P.border}`,
                      borderBottom:isToday?"2px solid #fdab3d":"none" }}>
                      <div style={{ fontSize:9, color:P.muted, fontWeight:600 }}>{["Su","Mo","Tu","We","Th","Fr","Sa"][d.getDay()]}</div>
                      <div style={{ fontSize:10, color:isToday?"#fdab3d":P.text, fontWeight:isToday?800:500 }}>{d.getDate()}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Groups + tasks */}
            {groups.map(g => (
              <React.Fragment key={g._id||g.id}>
                <div style={{ display:"flex", borderBottom:`1px solid ${P.border}`, background:`${g.color}12` }}>
                  <div style={{ width:260, flexShrink:0, padding:"8px 16px", borderRight:`1px solid ${P.border}`, display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:g.color }}/>
                    <span style={{ fontSize:12, fontWeight:800, color:g.color }}>{g.label}</span>
                  </div>
                  <div style={{ flex:1 }}/>
                </div>
                {(g.tasks||[]).map(task => {
                  const td = task.date ? new Date(task.date) : null;
                  let dayOff = null;
                  if (td) { const t2=new Date(td); t2.setHours(0,0,0,0); dayOff=Math.floor((t2-minD)/(1000*60*60*24)); }
                  const sc = STATUS_CFG[task.status]||STATUS_CFG["Not Started"];
                  return (
                    <div key={task._id||task.id} style={{ display:"flex", alignItems:"center", borderBottom:`1px solid ${P.border}`, minHeight:40 }}
                      onMouseEnter={e=>e.currentTarget.style.background=P.hover}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <div style={{ width:260, flexShrink:0, padding:"8px 16px 8px 28px", borderRight:`1px solid ${P.border}`, display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:8, height:8, borderRadius:2, background:sc.bg, flexShrink:0 }}/>
                        <span style={{ fontSize:12, color:P.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{task.title}</span>
                      </div>
                      <div style={{ position:"relative", flex:1, height:40 }}>
                        {todayOff>=0 && todayOff<totalDays && (
                          <div style={{ position:"absolute", left:todayOff*dayW+dayW/2, top:0, bottom:0, width:2, background:"#fdab3d30", zIndex:1 }}/>
                        )}
                        {dayOff!=null && dayOff>=0 && dayOff<totalDays && (
                          <div style={{ position:"absolute", left:dayOff*dayW+4, top:"50%", transform:"translateY(-50%)", height:22, width:dayW-8, background:sc.bg, borderRadius:5, display:"flex", alignItems:"center", justifyContent:"center", zIndex:2 }}>
                            <span style={{ fontSize:9, color:sc.fg, fontWeight:700 }}>{fmt(task.date)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CALENDAR VIEW
══════════════════════════════════════════════════════════ */
function CalendarView({ groups }) {
  const allTasks = groups.flatMap(g => (g.tasks||[]).map(t => ({ ...t, groupColor:g.color })));
  const [cur, setCur] = useState(new Date());
  const yr = cur.getFullYear(); const mo = cur.getMonth();
  const firstDay = new Date(yr,mo,1).getDay();
  const dim = new Date(yr,mo+1,0).getDate();
  const MN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const cells = [];
  for (let i=0;i<firstDay;i++) cells.push(null);
  for (let d=1;d<=dim;d++) cells.push(d);
  const getT = d => {
    if(!d) return [];
    const ds = `${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    return allTasks.filter(t => t.date===ds);
  };
  const tod = new Date();
  const isToday = d => d && tod.getFullYear()===yr && tod.getMonth()===mo && tod.getDate()===d;

  return (
    <div style={{ padding:24 }}>
      <div style={{ background:"#fff", borderRadius:14, border:`1px solid ${P.border}`, overflow:"hidden", boxShadow:"0 2px 12px rgba(124,58,237,0.07)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:`1px solid ${P.border}` }}>
          <div style={{ fontSize:16, fontWeight:800, color:P.text }}>{MN[mo]} {yr}</div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>setCur(new Date(yr,mo-1,1))} style={{ background:P.light, border:`1px solid ${P.border}`, borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16, color:P.mid, fontFamily:"inherit" }}>‹</button>
            <button onClick={()=>setCur(new Date())} style={{ background:P.light, border:`1px solid ${P.border}`, borderRadius:8, padding:"0 12px", cursor:"pointer", fontSize:12, color:P.mid, fontWeight:600, fontFamily:"inherit" }}>Today</button>
            <button onClick={()=>setCur(new Date(yr,mo+1,1))} style={{ background:P.light, border:`1px solid ${P.border}`, borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16, color:P.mid, fontFamily:"inherit" }}>›</button>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:`1px solid ${P.border}`, background:P.light }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
            <div key={d} style={{ padding:"8px 0", textAlign:"center", fontSize:11, fontWeight:700, color:P.muted }}>{d}</div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
          {cells.map((day,i) => {
            const tasks = getT(day);
            const isWknd = i%7===0||i%7===6;
            return (
              <div key={i} style={{ minHeight:90, padding:6, borderRight:`1px solid ${P.border}`, borderBottom:`1px solid ${P.border}`, background:isToday(day)?"#fffbeb":isWknd?"#fafafa":"#fff" }}>
                {day && (
                  <>
                    <div style={{ width:24, height:24, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background:isToday(day)?"#fdab3d":"transparent", color:isToday(day)?"#fff":P.text, fontSize:12, fontWeight:700, marginBottom:4 }}>{day}</div>
                    {tasks.slice(0,3).map(t=>{
                      const sc = STATUS_CFG[t.status]||STATUS_CFG["Not Started"];
                      return <div key={t._id||t.id} style={{ fontSize:10, fontWeight:600, padding:"2px 5px", borderRadius:4, background:sc.bg, color:sc.fg, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:2 }}>{t.title}</div>;
                    })}
                    {tasks.length>3 && <div style={{ fontSize:9, color:P.muted, fontWeight:600 }}>+{tasks.length-3} more</div>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   KANBAN VIEW
══════════════════════════════════════════════════════════ */
function KanbanView({ groups, onStatusChange }) {
  const allTasks = groups.flatMap(g => (g.tasks||[]).map(t => ({ ...t, groupColor:g.color, groupLabel:g.label })));
  const [dragging, setDragging] = useState(null);
  const [overCol, setOverCol]   = useState(null);
  const cols = STATUS_LIST.map(s => ({ s, cfg:STATUS_CFG[s], tasks:allTasks.filter(t=>t.status===s) }));

  return (
    <div style={{ padding:24, overflowX:"auto" }}>
      <div style={{ display:"flex", gap:14, minWidth:STATUS_LIST.length*220 }}>
        {cols.map(col => (
          <div key={col.s}
            onDragOver={e=>{e.preventDefault();setOverCol(col.s);}}
            onDrop={e=>{e.preventDefault();if(dragging){onStatusChange(dragging,col.s);}setDragging(null);setOverCol(null);}}
            style={{ flex:1, minWidth:200, background:overCol===col.s?`${col.cfg.bg}15`:P.light, borderRadius:12, border:`2px solid ${overCol===col.s?col.cfg.bg:P.border}`, transition:"all .15s", minHeight:400 }}>
            <div style={{ padding:"12px 14px", borderBottom:`1px solid ${P.border}`, display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:col.cfg.bg }}/>
              <span style={{ fontSize:12, fontWeight:800, color:P.text }}>{col.s}</span>
              <span style={{ marginLeft:"auto", fontSize:11, background:col.cfg.bg, color:col.cfg.fg, borderRadius:10, padding:"1px 7px", fontWeight:700 }}>{col.tasks.length}</span>
            </div>
            <div style={{ padding:10, display:"flex", flexDirection:"column", gap:8 }}>
              {col.tasks.map(task => {
                const pc = PRIORITY_CFG[task.priority||"—"]||PRIORITY_CFG["—"];
                return (
                  <div key={task._id||task.id} draggable
                    onDragStart={()=>setDragging(task._id||task.id)}
                    onDragEnd={()=>{setDragging(null);setOverCol(null);}}
                    style={{ background:"#fff", borderRadius:10, padding:"12px 13px", border:`1.5px solid ${P.border}`, cursor:"grab",
                      boxShadow:dragging===(task._id||task.id)?"0 8px 24px rgba(0,0,0,0.15)":"0 1px 4px rgba(0,0,0,0.05)",
                      opacity:dragging===(task._id||task.id)?0.5:1, transition:"all .15s" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:P.text, lineHeight:1.3, flex:1, marginRight:6 }}>{task.title}</div>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:task.groupColor, flexShrink:0, marginTop:3 }}/>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <span style={{ fontSize:10, color:P.muted, fontWeight:600 }}>{task.groupLabel}</span>
                      {task.date && <span style={{ fontSize:10, color:P.muted }}>📅 {fmt(task.date)}</span>}
                    </div>
                    {task.priority && task.priority!=="—" && (
                      <div style={{ marginTop:6 }}>
                        <span style={{ fontSize:10, fontWeight:700, background:pc.bg, color:pc.fg, borderRadius:4, padding:"2px 7px" }}>{task.priority}</span>
                      </div>
                    )}
                    {task.assignTo && task.assignTo!=="Unassigned" && (
                      <div style={{ marginTop:7, display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:20, height:20, borderRadius:"50%", background:getAvatarColor(task.assignTo), display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:8, fontWeight:700 }}>
                          {task.assignTo.slice(0,2).toUpperCase()}
                        </div>
                        <span style={{ fontSize:10, color:P.muted }}>{task.assignTo}</span>
                      </div>
                    )}
                  </div>
                );
              })}
              {col.tasks.length===0 && <div style={{ padding:"20px 10px", textAlign:"center", color:P.muted, fontSize:12, fontStyle:"italic" }}>Drop tasks here</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════ */
function Toast({msg,type}){
  const c=type==="error"?"#e2445c":type==="info"?"#0073ea":"#00c875";
  return(
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:"#fff",
      border:`1.5px solid ${c}`,borderRadius:12,padding:"11px 18px",fontSize:13,
      fontWeight:700,color:c,boxShadow:"0 8px 32px rgba(124,58,237,0.2)",
      display:"flex",alignItems:"center",gap:8,animation:"toastIn .2s ease",fontFamily:"inherit"}}>
      {type==="error"?"❌":type==="info"?"ℹ️":"✅"} {msg}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DROPDOWN
══════════════════════════════════════════════════════════ */
function DD({anchor,onClose,children,w=180}){
  const ref=useRef();
  const [pos,setPos]=useState({top:0,left:0});
  useEffect(()=>{
    if(anchor?.current){
      const r=anchor.current.getBoundingClientRect();
      let left=r.left;
      if(left+w>window.innerWidth-8) left=window.innerWidth-w-8;
      setPos({top:r.bottom+4,left});
    }
    const h=e=>{
      if(ref.current&&!ref.current.contains(e.target)&&!anchor?.current?.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[anchor,onClose,w]);
  return(
    <div ref={ref} style={{position:"fixed",top:pos.top,left:pos.left,zIndex:6000,
      background:"#fff",border:`1.5px solid ${P.border}`,borderRadius:10,padding:5,
      boxShadow:"0 8px 28px rgba(124,58,237,0.18)",minWidth:w,animation:"ddIn .1s ease"}}>
      {children}
    </div>
  );
}

const MI=({onClick,icon,title,sub,active,danger})=>(
  <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",
    borderRadius:7,cursor:"pointer",fontSize:13,fontFamily:"inherit",
    color:danger?"#e2445c":active?P.accent:P.text,
    background:active?"rgba(147,51,234,0.08)":"transparent",transition:"background .1s"}}
    onMouseEnter={e=>e.currentTarget.style.background=active?"rgba(147,51,234,0.13)":P.light}
    onMouseLeave={e=>e.currentTarget.style.background=active?"rgba(147,51,234,0.08)":"transparent"}>
    {icon&&<span style={{fontSize:15,lineHeight:1,flexShrink:0}}>{icon}</span>}
    <div style={{flex:1}}>
      <div style={{fontWeight:active||sub?600:400}}>{title}</div>
      {sub&&<div style={{fontSize:11,color:P.muted,marginTop:1}}>{sub}</div>}
    </div>
    {active&&<span style={{color:P.accent,fontSize:12,flexShrink:0}}>✓</span>}
  </div>
);

const Sep=()=><div style={{height:1,background:P.border,margin:"4px 0"}}/>;

/* ══════════════════════════════════════════════════════════
   VIEW SWITCHER DROPDOWN  ← THE KEY FIX
══════════════════════════════════════════════════════════ */
function ViewSwitcherDropdown({ anchor, currentView, onSelect, onClose }) {
  const ref = useRef();
  const [pos, setPos] = useState({top:0,left:0});

  useEffect(()=>{
    const calc = () => {
      if (anchor?.current) {
        const r = anchor.current.getBoundingClientRect();
        let left = r.left;
        if (left+220 > window.innerWidth-8) left = window.innerWidth-228;
        setPos({ top:r.bottom+4, left });
      }
    };
    calc();
    window.addEventListener("scroll",calc,true); window.addEventListener("resize",calc);
    return()=>{ window.removeEventListener("scroll",calc,true); window.removeEventListener("resize",calc); };
  },[anchor]);

  useEffect(()=>{
    const h = e => {
      if (ref.current && !ref.current.contains(e.target) && !anchor?.current?.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[anchor,onClose]);

  return (
    <div ref={ref} style={{
      position:"fixed", top:pos.top, left:pos.left, zIndex:7000,
      background:"#fff", border:`1px solid ${P.border}`, borderRadius:12,
      boxShadow:"0 8px 40px rgba(124,58,237,0.22)", fontFamily:"inherit",
      overflow:"hidden", animation:"ddIn .12s ease", minWidth:220
    }}>
      <div style={{ padding:"10px 14px 6px", fontSize:11, fontWeight:700, color:P.muted, letterSpacing:.8, textTransform:"uppercase" }}>
        Switch view
      </div>
      {VIEW_LIST.map(v => (
        <div key={v.id}
          onClick={()=>{ onSelect(v.id); onClose(); }}
          style={{
            display:"flex", alignItems:"center", gap:12, padding:"10px 14px",
            cursor:"pointer",
            background: currentView===v.id ? "#e8f4fd" : "transparent"
          }}
          onMouseEnter={e=>{ if(currentView!==v.id) e.currentTarget.style.background=P.light; }}
          onMouseLeave={e=>{ e.currentTarget.style.background=currentView===v.id?"#e8f4fd":"transparent"; }}>
          <div style={{ width:28, height:28, borderRadius:7, background:`${v.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, color:v.color }}>{v.icon}</div>
          <span style={{ fontSize:13, color:P.text, fontWeight:currentView===v.id?700:400, flex:1 }}>{v.label}</span>
          {currentView===v.id && <span style={{ color:"#0073ea", fontSize:13 }}>✓</span>}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STATUS PICKER
══════════════════════════════════════════════════════════ */
function StatusPicker({anchor,onSelect,onClose}){
  const ref = useRef();
  const [pos,setPos]=useState({top:0,left:0});
  useEffect(()=>{
    const calc=()=>{
      if(anchor?.current){
        const r=anchor.current.getBoundingClientRect();
        const panelH=Object.keys(STATUS_CFG).length*38+16;
        const spaceBelow=window.innerHeight-r.bottom;
        const top=spaceBelow>panelH?r.bottom+2:r.top-panelH-2;
        let left=r.left; if(left+190>window.innerWidth-8) left=window.innerWidth-198;
        setPos({top,left});
      }
    };
    calc();
    window.addEventListener('scroll',calc,true); window.addEventListener('resize',calc);
    return()=>{ window.removeEventListener('scroll',calc,true); window.removeEventListener('resize',calc); };
  },[anchor]);
  useEffect(()=>{
    const h=e=>{ if(ref.current&&!ref.current.contains(e.target)&&!anchor?.current?.contains(e.target)) onClose(); };
    document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h);
  },[anchor,onClose]);
  return (
    <div ref={ref} style={{ position:"fixed",top:pos.top,left:pos.left,zIndex:9999,background:"#fff",border:`1.5px solid ${P.border}`,borderRadius:10,padding:6,boxShadow:"0 8px 32px rgba(124,58,237,0.22)",minWidth:190,animation:"ddIn .1s ease" }}>
      {Object.entries(STATUS_CFG).map(([s,sc])=>(
        <div key={s} onClick={e=>{e.stopPropagation();onSelect(s);onClose();}}
          style={{borderRadius:7,overflow:"hidden",marginBottom:3,cursor:"pointer",transition:"transform .1s"}}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.02)"}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
          <div style={{background:sc.bg,color:sc.fg,padding:"8px 14px",fontSize:12,fontWeight:700,textAlign:"center"}}>{s}</div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PRIORITY PICKER
══════════════════════════════════════════════════════════ */
function PriorityPicker({anchor,currentValue,onSelect,onClose}){
  const ref = useRef();
  const [pos,setPos]=useState({top:0,left:0});
  useEffect(()=>{
    const calc=()=>{
      if(anchor?.current){
        const r=anchor.current.getBoundingClientRect();
        const panelH=PRIORITY_LIST.length*42+16;
        const top=window.innerHeight-r.bottom>panelH?r.bottom+2:r.top-panelH-2;
        let left=r.left; if(left+190>window.innerWidth-8) left=window.innerWidth-198;
        setPos({top,left});
      }
    };
    calc();
    window.addEventListener('scroll',calc,true); window.addEventListener('resize',calc);
    return()=>{ window.removeEventListener('scroll',calc,true); window.removeEventListener('resize',calc); };
  },[anchor]);
  useEffect(()=>{
    const h=e=>{ if(ref.current&&!ref.current.contains(e.target)&&!anchor?.current?.contains(e.target)) onClose(); };
    document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h);
  },[anchor,onClose]);
  return (
    <div ref={ref} style={{ position:"fixed",top:pos.top,left:pos.left,zIndex:9999,background:"#fff",border:`1.5px solid ${P.border}`,borderRadius:10,padding:6,boxShadow:"0 8px 32px rgba(124,58,237,0.22)",minWidth:190,animation:"ddIn .1s ease" }}>
      {PRIORITY_LIST.map(p=>{
        const cfg=PRIORITY_CFG[p];
        return (
          <div key={p} onClick={e=>{e.stopPropagation();onSelect(p);onClose();}}
            style={{borderRadius:7,overflow:"hidden",marginBottom:3,cursor:"pointer",transition:"transform .1s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.02)"}
            onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
            <div style={{background:cfg.bg,color:cfg.fg,padding:"8px 14px",fontSize:12,fontWeight:700,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {currentValue===p && <span>✓</span>}
              {p}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PERSON PICKER
══════════════════════════════════════════════════════════ */
function PersonPicker({ anchor, onSelect, onClose, employees, currentAssignee }) {
  const [search, setSearch] = useState("");
  const inputRef = useRef();
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);
  const filtered = employees.filter(e => !search || e.toLowerCase().includes(search.toLowerCase()));
  return (
    <DD anchor={anchor} onClose={onClose} w={320}>
      <div style={{ padding:"12px 12px 4px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, border:`1px solid #0073ea`, borderRadius:6, padding:"8px 12px", background:"#fff" }}>
          <span style={{ fontSize:14, color:P.muted }}>🔍</span>
          <input ref={inputRef} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search names, roles or teams"
            style={{ border:"none", outline:"none", background:"transparent", fontSize:13, color:P.text, fontFamily:"inherit", flex:1 }}/>
          <span style={{ fontSize:14, color:P.muted, cursor: "pointer", border: "1px solid #94a3b8", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>i</span>
        </div>
      </div>
      
      <div style={{ padding:"12px 14px 4px", fontSize:13, color:P.muted }}>Suggested people</div>
      
      <div style={{ maxHeight:200, overflowY:"auto", padding: "0 8px" }}>
        {filtered.length===0
          ? <div style={{ padding:"10px 12px", fontSize:12, color:P.muted, textAlign:"center" }}>No people found</div>
          : filtered.map(emp => {
              const isActive = currentAssignee===emp;
              return (
                <div key={emp} onClick={()=>{onSelect(emp);onClose();}}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 6px", borderRadius:6, cursor:"pointer", background:isActive?"#e8f4fd":"transparent" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#f0f2f5"}
                  onMouseLeave={e=>e.currentTarget.style.background=isActive?"#e8f4fd":"transparent"}>
                  <div style={{ width:30, height:30, borderRadius:"50%", background:getAvatarColor(emp), display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:11, fontWeight:700, flexShrink:0 }}>
                    {emp.slice(0,2).toUpperCase()}
                  </div>
                  <span style={{ fontSize:14, color:P.text, flex:1, fontWeight:isActive?500:400 }}>{emp}</span>
                </div>
              );
            })
        }
      </div>

      <div style={{ padding: "8px 14px 12px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
           onMouseEnter={e=>e.currentTarget.style.background="#f0f2f5"}
           onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 16 }}>👤</span>
          <span style={{ fontSize: 10, position: 'relative', top: '2px', left: '-2px', fontWeight: 800 }}>+</span>
        </div>
        <span style={{ fontSize: 14, color: P.text }}>Invite a new member by email</span>
      </div>
      
      {currentAssignee && (
        <div onClick={()=>{onSelect("");onClose();}}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 14px", cursor:"pointer" }}
          onMouseEnter={e=>e.currentTarget.style.background="#fee2e2"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div style={{ width:24, height:24, borderRadius:"50%", border:`1px dashed #e2445c`, display:"flex", alignItems:"center", justifyContent:"center", color:"#e2445c", fontSize:12 }}>✕</div>
          <span style={{ fontSize:13, color:"#e2445c", fontWeight:500 }}>Unassign</span>
        </div>
      )}
      
      <div style={{ margin:"8px 10px 10px", background:"#dbeafe", borderRadius:8, padding:"12px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:16 }}>🔔</span>
          <span style={{ fontSize:13, color:P.text }}>Assignees will be notified</span>
        </div>
        <button style={{ fontSize:12, color:P.text, background:"transparent", border:"1px solid #94a3b8", borderRadius:4, padding:"4px 12px", cursor:"pointer", fontFamily:"inherit" }}>Mute</button>
      </div>

      <div style={{ borderTop: `1px solid ${P.border}` }}>
        <div style={{ padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }}
             onMouseEnter={e=>e.currentTarget.style.background="#f0f2f5"}
             onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <span style={{ fontSize: 16 }}>✨</span>
          <span style={{ fontSize: 14, color: P.text }}>Auto-assign people</span>
        </div>
      </div>
    </DD>
  );
}

/* ══════════════════════════════════════════════════════════
   TOOLBAR BUTTON
══════════════════════════════════════════════════════════ */
const TB = React.forwardRef(({icon,label,active,onClick,badge},ref)=>(
  <button ref={ref} onClick={onClick} style={{
    display:"flex",alignItems:"center",gap:5,padding:"5px 10px",
    background:active?"rgba(147,51,234,0.1)":"transparent",
    border:`1.5px solid ${active?P.accent:"transparent"}`,
    borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit",
    color:active?P.accent:P.mid,fontWeight:active?700:500,
    whiteSpace:"nowrap",transition:"all .15s",flexShrink:0,
  }}
    onMouseEnter={e=>{if(!active){e.currentTarget.style.background=P.light;e.currentTarget.style.borderColor=P.border;}}}
    onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";}}}
  >
    {icon&&<span style={{fontSize:13,lineHeight:1}}>{icon}</span>}
    {label&&<span>{label}</span>}
    {badge!=null&&<span style={{fontSize:10,background:`${P.accent}20`,color:P.accent,borderRadius:8,padding:"1px 6px",fontWeight:700}}>{badge}</span>}
  </button>
));

/* ══════════════════════════════════════════════════════════
   NEW TASK BTN
══════════════════════════════════════════════════════════ */
function NewTaskBtn({onAddTask,onTriggerGroup,showToast,onImport,groups,onAddTaskToGroup,setGroups}){
  const [open,setOpen]=useState(false);
  const [showPicker,setShowPicker]=useState(false);
  const [taskTitle,setTaskTitle]=useState("");
  const [selGroup,setSelGroup]=useState("");
  const arrowRef=useRef(); const inputRef=useRef();
  useEffect(()=>{ if(showPicker) setTimeout(()=>inputRef.current?.focus(),50); if(!showPicker) setTaskTitle(""); },[showPicker]);
  const submit=async()=>{
    let gid=groups&&groups[0]&&(groups[0]._id||groups[0].id);
    if(!gid){
      // Create a default group if none exists
      try {
        const color=GRP_COLORS[0];
        const r=await axios.post(`${API}/groups`,{label:"Tasks",color});
        gid=r.data._id||r.data.id;
        // Update local groups state
        setGroups(p=>[...p,{...r.data,tasks:[],open:true}]);
      } catch {
        showToast("Failed to create group","error");
        return;
      }
    }
    const title=taskTitle.trim()||"New task";
    onAddTaskToGroup(gid,title);
    setShowPicker(false);setSelGroup("");setTaskTitle("");setOpen(false);
  };
  return(
    <div style={{display:"flex",flexShrink:0,position:"relative"}}>
      <button onClick={()=>setShowPicker(v=>!v)} style={{background:"#0073ea",color:"#fff",border:"none",borderRadius:"9px 0 0 9px",padding:"7px 16px",fontSize:13,fontWeight:700,cursor:"pointer",borderRight:"1px solid rgba(255,255,255,0.25)",fontFamily:"inherit"}}
        onMouseEnter={e=>e.currentTarget.style.filter="brightness(1.1)"}
        onMouseLeave={e=>e.currentTarget.style.filter="none"}>+ New task</button>
      <button ref={arrowRef} onClick={()=>{setOpen(v=>!v);setShowPicker(false);}} style={{background:"#0073ea",color:"#fff",border:"none",borderRadius:"0 9px 9px 0",padding:"7px 9px",fontSize:12,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center"}}
        onMouseEnter={e=>e.currentTarget.style.filter="brightness(1.1)"}
        onMouseLeave={e=>e.currentTarget.style.filter="none"}>▾</button>
      {showPicker&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:7999}} onClick={()=>setShowPicker(false)}>
          <div onClick={e=>e.stopPropagation()} style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"#fff",borderRadius:14,padding:24,boxShadow:"0 20px 60px rgba(0,0,0,0.18)",width:440,zIndex:8000,border:"1.5px solid #e6e9ef",animation:"ddIn .15s ease"}}>
            <div style={{fontSize:15,fontWeight:800,color:"#323338",marginBottom:16}}>Create new task</div>
            <input ref={inputRef} value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} placeholder="Task name..."
              onKeyDown={e=>{if(e.key==="Enter")submit();if(e.key==="Escape")setShowPicker(false);}}
              style={{width:"100%",border:"1.5px solid #d0d4e4",borderRadius:9,padding:"10px 13px",fontSize:14,fontFamily:"inherit",outline:"none",color:"#323338",boxSizing:"border-box",marginBottom:12}}
              onFocus={e=>e.target.style.borderColor="#0073ea"}
              onBlur={e=>e.target.style.borderColor="#d0d4e4"}/>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:"#676879",fontWeight:700,marginBottom:6,letterSpacing:.4}}>Task will be added to the first available group</div>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowPicker(false)} style={{background:"#f5f6f8",border:"none",borderRadius:8,padding:"8px 18px",fontSize:13,fontWeight:600,color:"#676879",cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
              <button onClick={submit} style={{background:taskTitle.trim()?"#0073ea":"#c3d9f0",color:"#fff",border:"none",borderRadius:8,padding:"8px 20px",fontSize:13,fontWeight:700,cursor:taskTitle.trim()?"pointer":"default",fontFamily:"inherit"}}>Create task</button>
            </div>
          </div>
        </div>
      )}
      {open&&(
        <DD anchor={arrowRef} onClose={()=>setOpen(false)} w={230}>
          <div style={{fontSize:10,color:"#676879",fontWeight:700,letterSpacing:1,textTransform:"uppercase",padding:"8px 12px 5px"}}>Create new</div>
          <MI icon="✅" title="Task" sub="Add task with details" onClick={()=>{setOpen(false);setShowPicker(true);}}/>
          <MI icon="📁" title="Group" sub="Add a new group of tasks" onClick={()=>{onTriggerGroup();setOpen(false);}}/>
          <Sep/>
          <MI icon="📥" title="Import" sub="Excel, CSV or from files" onClick={()=>{onImport&&onImport();setOpen(false);}}/>
        </DD>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   IMPORT MODAL
══════════════════════════════════════════════════════════ */
function ImportModal({ onClose, onImportTasks }) {
  const [dragOver,setDragOver]=useState(false); const [file,setFile]=useState(null);
  const [preview,setPreview]=useState(null); const [loading,setLoading]=useState(false);
  const [colMap,setColMap]=useState({}); const fileRef=useRef();
  const parseCSV=text=>{const lines=text.trim().split('\n');const headers=lines[0].split(',').map(h=>h.replace(/"/g,'').trim());const rows=lines.slice(1).map(line=>{const vals=line.split(',').map(v=>v.replace(/"/g,'').trim());return Object.fromEntries(headers.map((h,i)=>[h,vals[i]||'']));});return{headers,rows};};
  const handleFile=f=>{if(!f)return;setFile(f);setLoading(true);const reader=new FileReader();reader.onload=e=>{const text=e.target.result;const{headers,rows}=parseCSV(text);const autoMap={};headers.forEach(h=>{const hl=h.toLowerCase();if(hl.includes('name')||hl.includes('task')||hl.includes('title'))autoMap.title=h;else if(hl.includes('owner')||hl.includes('assign'))autoMap.assignTo=h;else if(hl.includes('status'))autoMap.status=h;else if(hl.includes('date'))autoMap.date=h;else if(hl.includes('priority'))autoMap.priority=h;});setColMap(autoMap);setPreview({headers,rows:rows.slice(0,5),totalRows:rows.length,allRows:rows});setLoading(false);};reader.readAsText(f);};
  const doImport=()=>{if(!preview)return;const tasks=preview.allRows.map(row=>({title:colMap.title?row[colMap.title]:(Object.values(row)[0]||'Imported task'),assignTo:colMap.assignTo?row[colMap.assignTo]:'',status:colMap.status?row[colMap.status]:'Not Started',date:colMap.date?row[colMap.date]:'',priority:colMap.priority?row[colMap.priority]:'—',})).filter(t=>t.title);onImportTasks(tasks);onClose();};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#fff",borderRadius:16,width:560,maxHeight:"85vh",boxShadow:"0 24px 80px rgba(0,0,0,0.18)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"18px 22px 14px",borderBottom:"1px solid #eef0f4",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div><div style={{fontSize:16,fontWeight:800,color:"#323338"}}>📥 Import tasks</div><div style={{fontSize:12,color:"#676879",marginTop:2}}>Upload CSV or Excel file</div></div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#676879"}}>×</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"18px 22px"}}>
          {!file?(
            <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}} onClick={()=>fileRef.current?.click()}
              style={{border:`2px dashed ${dragOver?"#0073ea":"#d0d4e4"}`,borderRadius:12,padding:"36px 24px",textAlign:"center",cursor:"pointer",background:dragOver?"#e8f4fd":"#fafbfc"}}>
              <div style={{fontSize:36,marginBottom:10}}>📂</div>
              <div style={{fontSize:14,fontWeight:700,color:"#323338",marginBottom:6}}>Drag & drop your file here</div>
              <button style={{background:"#0073ea",color:"#fff",border:"none",borderRadius:8,padding:"8px 20px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Browse files</button>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
            </div>
          ):loading?(
            <div style={{textAlign:"center",padding:40}}><div style={{width:36,height:36,border:"3px solid #e6e9ef",borderTop:"3px solid #0073ea",borderRadius:"50%",animation:"spin .7s linear infinite",margin:"0 auto 12px"}}/></div>
          ):preview&&(
            <div style={{overflowX:"auto",borderRadius:8,border:"1px solid #e6e9ef"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}><thead><tr style={{background:"#f5f6f8"}}>{preview.headers.map(h=><th key={h} style={{padding:"7px 10px",textAlign:"left",color:"#676879",fontWeight:700,borderBottom:"1px solid #e6e9ef"}}>{h}</th>)}</tr></thead><tbody>{preview.rows.map((row,i)=><tr key={i}>{preview.headers.map(h=><td key={h} style={{padding:"6px 10px",color:"#323338"}}>{row[h]||""}</td>)}</tr>)}</tbody></table></div>
          )}
        </div>
        <div style={{padding:"12px 22px",borderTop:"1px solid #eef0f4",display:"flex",justifyContent:"flex-end",gap:8}}>
          <button onClick={onClose} style={{background:"#f5f6f8",border:"none",borderRadius:8,padding:"8px 20px",fontSize:13,fontWeight:600,color:"#676879",cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          <button onClick={doImport} disabled={!preview||loading} style={{background:preview&&!loading?"#0073ea":"#c3d9f0",color:"#fff",border:"none",borderRadius:8,padding:"8px 22px",fontSize:13,fontWeight:700,cursor:preview&&!loading?"pointer":"default",fontFamily:"inherit"}}>Import {preview?`${preview.totalRows} tasks`:""}</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SIDEKICK PANEL
══════════════════════════════════════════════════════════ */
function SidekickPanel({ onClose, groups }) {
  const allTasks=groups.flatMap(g=>g.tasks||[]);
  const done=allTasks.filter(t=>t.status==="Done").length;
  const stuck=allTasks.filter(t=>t.status==="Stuck").length;
  const wip=allTasks.filter(t=>t.status==="Working on it").length;
  const overdue=allTasks.filter(t=>t.date&&new Date(t.date)<new Date()&&t.status!=="Done").length;
  const pct=allTasks.length?Math.round(done/allTasks.length*100):0;
  const r=26,circ=2*Math.PI*r,dash=(pct/100)*circ;
  return(
    <div style={{width:300,flexShrink:0,background:"#fff",borderLeft:`1.5px solid ${P.border}`,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <div style={{background:`linear-gradient(150deg,${P.dark} 0%,${P.mid} 60%,#a855f7 100%)`,padding:"14px 16px 16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:32,height:32,borderRadius:9,background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>✨</div>
            <div><div style={{fontSize:13,fontWeight:800,color:"#fff"}}>Board Sidekick</div><div style={{fontSize:10,color:"rgba(255,255,255,0.5)"}}>Live insights</div></div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:7,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",fontSize:16}}>×</button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{position:"relative",flexShrink:0}}>
            <svg width={70} height={70}>
              <circle cx={35} cy={35} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={7}/>
              <circle cx={35} cy={35} r={r} fill="none" stroke="#a78bfa" strokeWidth={7} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 35 35)"/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:14,fontWeight:800,color:"#fff"}}>{pct}%</span>
              <span style={{fontSize:8,color:"rgba(255,255,255,0.55)"}}>done</span>
            </div>
          </div>
          <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {[{label:"Total",val:allTasks.length,color:"#e9d5ff"},{label:"Done",val:done,color:"#86efac"},{label:"Active",val:wip,color:"#fde68a"},{label:"Stuck",val:stuck,color:"#fca5a5"}].map(({label,val,color})=>(
              <div key={label} style={{background:"rgba(255,255,255,0.12)",borderRadius:8,padding:"6px 8px",textAlign:"center"}}>
                <div style={{fontSize:17,fontWeight:800,color}}>{val}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.5)",fontWeight:600,marginTop:2}}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:14}}>
        <div style={{background:P.light,border:`1.5px solid ${P.border}`,borderRadius:12,padding:"12px 13px",marginBottom:12}}>
          <div style={{fontSize:10,color:P.muted,fontWeight:700,letterSpacing:.8,textTransform:"uppercase",marginBottom:6}}>💡 Insight</div>
          <div style={{fontSize:12,color:P.text,lineHeight:1.65}}>
            {stuck>0?`${stuck} task${stuck>1?"s are":" is"} stuck.`
              :overdue>0?`${overdue} overdue task${overdue>1?"s":""}.`
              :done===allTasks.length&&allTasks.length>0?"🎉 All tasks complete!"
              :wip>0?`${wip} task${wip>1?"s are":" is"} in progress!`
              :"Add tasks to see insights."}
          </div>
        </div>
        {groups.map(g=>{
          const t=(g.tasks||[]).length; const d=(g.tasks||[]).filter(x=>x.status==="Done").length;
          const pct=t>0?Math.round(d/t*100):0;
          return(
            <div key={g._id||g.id} style={{background:"#fff",border:`1px solid ${P.border}`,borderRadius:10,padding:"10px 12px",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:g.color}}/>
                <span style={{fontSize:12,fontWeight:700,color:P.text,flex:1}}>{g.label}</span>
                <span style={{fontSize:11,fontWeight:700,color:P.accent}}>{pct}%</span>
              </div>
              <div style={{height:6,background:P.light,borderRadius:3,overflow:"hidden"}}>
                <div style={{width:`${pct}%`,height:"100%",background:g.color,borderRadius:3,transition:"width .5s"}}/>
              </div>
              <div style={{fontSize:10,color:P.muted,marginTop:4}}>{d}/{t} done</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SHARE MODAL
══════════════════════════════════════════════════════════ */
function ShareModal({ onClose }) {
  const shareLink="https://view.monday.com/5027193961-38429d1a11fd6ec34553f19fa74ae00b";
  const [copied,setCopied]=useState(false);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#fff",borderRadius:16,width:520,boxShadow:"0 24px 80px rgba(0,0,0,0.18)",overflow:"hidden"}}>
        <div style={{padding:"20px 24px 16px",borderBottom:"1px solid #eef0f4",display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:17,fontWeight:800,color:"#323338"}}>Share board</span>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#676879"}}>×</button>
        </div>
        <div style={{padding:"16px 24px 24px"}}>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{flex:1,background:"#f5f6f8",border:"1px solid #e6e9ef",borderRadius:9,padding:"10px 14px",fontSize:12,color:"#676879",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"monospace"}}>{shareLink}</div>
            <button onClick={()=>{navigator.clipboard.writeText(shareLink);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{background:copied?"#00c875":"#0073ea",color:"#fff",border:"none",borderRadius:9,padding:"10px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{copied?"✓ Copied!":"Copy link"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   INTEGRATE MODAL
══════════════════════════════════════════════════════════ */
function IntegrateModal({ onClose }) {
  const integrations=[{icon:"📧",name:"Gmail",desc:"Email notifications on status change",badge:"Popular"},{icon:"💬",name:"Slack",desc:"Post updates to Slack channels",badge:"Popular"},{icon:"📅",name:"Google Calendar",desc:"Sync due dates with your calendar",badge:null},{icon:"🐙",name:"GitHub",desc:"Link commits and PRs to tasks",badge:null},{icon:"🔗",name:"Zapier",desc:"Connect to 5000+ apps via Zapier",badge:"New"}];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(30,10,60,0.45)",zIndex:8000,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#fff",borderRadius:16,width:520,maxHeight:"80vh",boxShadow:"0 24px 80px rgba(124,58,237,0.25)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{background:`linear-gradient(135deg,${P.dark},${P.mid})`,padding:"18px 20px"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{fontSize:17,fontWeight:800,color:"#fff"}}>🔗 Integrations</div><button onClick={onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",color:"#fff",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button></div></div>
        <div style={{flex:1,overflowY:"auto",padding:"4px 20px 16px"}}>
          {integrations.map(({icon,name,desc,badge})=>(
            <div key={name} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:`1px solid ${P.border}`}}>
              <div style={{width:42,height:42,borderRadius:10,background:P.light,border:`1.5px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{icon}</div>
              <div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:13,fontWeight:700,color:P.text}}>{name}</span>{badge&&<span style={{fontSize:9,background:"#fef3c7",color:"#92400e",borderRadius:8,padding:"2px 7px",fontWeight:700}}>{badge}</span>}</div><div style={{fontSize:11.5,color:P.muted,marginTop:2}}>{desc}</div></div>
              <button style={{background:P.light,border:`1.5px solid ${P.border}`,borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:600,color:P.mid,cursor:"pointer",fontFamily:"inherit"}}>Connect</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   AUTOMATE MODAL
══════════════════════════════════════════════════════════ */
function AutomateModal({ onClose }) {
  const automations=[{icon:"⚡",title:"Status Change Alert",desc:"When status changes → notify assignee",active:true},{icon:"📅",title:"Due Date Reminder",desc:"1 day before due date → send reminder",active:false},{icon:"✅",title:"Mark Done on Check",desc:"When all sub-tasks done → mark parent Done",active:true}];
  const [states,setStates]=useState(Object.fromEntries(automations.map(a=>[a.title,a.active])));
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(30,10,60,0.45)",zIndex:8000,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#fff",borderRadius:16,width:520,maxHeight:"80vh",boxShadow:"0 24px 80px rgba(124,58,237,0.25)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{background:`linear-gradient(135deg,${P.dark},${P.mid})`,padding:"18px 20px"}}><div style={{display:"flex",justifyContent:"space-between"}}><div style={{fontSize:17,fontWeight:800,color:"#fff"}}>⚙️ Automations</div><button onClick={onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",color:"#fff",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button></div></div>
        <div style={{flex:1,overflowY:"auto",padding:"8px 20px 16px"}}>
          {automations.map(({icon,title,desc})=>(
            <div key={title} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:`1px solid ${P.border}`}}>
              <div style={{width:38,height:38,borderRadius:9,background:P.light,border:`1.5px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{icon}</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:P.text}}>{title}</div><div style={{fontSize:11.5,color:P.muted,marginTop:2}}>{desc}</div></div>
              <div onClick={()=>setStates(p=>({...p,[title]:!p[title]}))} style={{width:38,height:22,borderRadius:11,background:states[title]?P.accent:"#e2e8f0",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                <div style={{position:"absolute",top:3,left:states[title]?18:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB DOTS MENU
══════════════════════════════════════════════════════════ */
function TabDotsMenu({ anchor, onClose, showToast }) {
  const ref=useRef(); const [pos,setPos]=useState({top:0,left:0});
  useEffect(()=>{
    const calc=()=>{if(!anchor?.current)return;const r=anchor.current.getBoundingClientRect();let left=r.left;if(left+260>window.innerWidth-8)left=window.innerWidth-268;setPos({top:r.bottom+6,left});};
    calc();window.addEventListener("scroll",calc,true);window.addEventListener("resize",calc);
    return()=>{window.removeEventListener("scroll",calc,true);window.removeEventListener("resize",calc);};
  },[anchor]);
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target)&&!anchor?.current?.contains(e.target))onClose();};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[anchor,onClose]);
  return(
    <div ref={ref} style={{position:"fixed",top:pos.top,left:pos.left,zIndex:9500,background:"#fff",border:"1px solid #e6e9ef",borderRadius:12,boxShadow:"0 8px 36px rgba(0,0,0,0.14)",fontFamily:"inherit",animation:"ddIn .12s ease",width:250,overflow:"hidden",padding:"4px 0"}}>
      {[{icon:"📌",label:"Pin view"},{icon:"✏️",label:"Rename view"},{icon:"🔗",label:"Share view"}].map(item=>(
        <div key={item.label} onClick={()=>{showToast(`${item.label}!`,"success");onClose();}} style={{display:"flex",alignItems:"center",gap:11,padding:"9px 16px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f6f8"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <span style={{fontSize:15,width:20,textAlign:"center"}}>{item.icon}</span>
          <span style={{fontSize:13,color:"#323338"}}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   FILTER MENU
══════════════════════════════════════════════════════════ */
function FilterMenu({ anchor, onClose, groups, filters, onToggle, onClear }) {
  const allTasks=groups.flatMap(g=>g.tasks||[]);
  const ref=useRef(); const [pos,setPos]=useState({top:60,left:8,w:600});
  useEffect(()=>{const calc=()=>{if(!anchor?.current)return;const r=anchor.current.getBoundingClientRect();const w=Math.min(window.innerWidth-16,600);let left=r.left-10;if(left+w>window.innerWidth-8)left=window.innerWidth-w-8;if(left<8)left=8;setPos({top:r.bottom+6,left,w});};calc();window.addEventListener("scroll",calc,true);window.addEventListener("resize",calc);return()=>{window.removeEventListener("scroll",calc,true);window.removeEventListener("resize",calc);};},[anchor]);
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target)&&!anchor?.current?.contains(e.target))onClose();};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[anchor,onClose]);
  const owners=[...new Set(allTasks.map(t=>t.assignTo).filter(v=>v&&v!=="Unassigned"&&v!==""))];
  return(
    <div ref={ref} style={{position:"fixed",top:pos.top,left:pos.left,width:pos.w,zIndex:9500,background:"#fff",border:"1px solid #dde1ea",borderRadius:14,boxShadow:"0 12px 50px rgba(0,0,0,0.18)",fontFamily:"inherit",animation:"ddIn .12s ease"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px 10px",borderBottom:"1px solid #eef0f4"}}>
        <span style={{fontSize:14,fontWeight:800,color:"#323338"}}>Quick filters</span>
        <div style={{display:"flex",gap:8}}>
          {(filters.owner.size+filters.status.size)>0&&<button onClick={onClear} style={{background:"none",border:"none",fontSize:13,color:"#676879",cursor:"pointer",fontFamily:"inherit"}}>Clear all</button>}
          <button onClick={onClose} style={{background:"#fff",border:"1px solid #d0d4e4",borderRadius:8,padding:"5px 14px",fontSize:12,fontWeight:600,color:"#323338",cursor:"pointer",fontFamily:"inherit"}}>Close</button>
        </div>
      </div>
      <div style={{display:"flex",gap:0,padding:"14px 20px",overflowX:"auto"}}>
        <div style={{minWidth:160,flexShrink:0,paddingRight:14,borderRight:"1px solid #f0f1f4",marginRight:14}}>
          <div style={{fontSize:10,fontWeight:700,color:"#9aadbd",letterSpacing:.7,textTransform:"uppercase",marginBottom:8}}>Owner</div>
          {owners.map(o=>{const on=filters.owner.has(o);return(<div key={o} onClick={()=>onToggle("owner",o)} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:6,cursor:"pointer",background:on?"#e8f4fd":"transparent"}} onMouseEnter={e=>{if(!on)e.currentTarget.style.background="#f5f6f8";}} onMouseLeave={e=>{e.currentTarget.style.background=on?"#e8f4fd":"transparent";}}><div style={{width:16,height:16,borderRadius:3,background:on?"#0073ea":"#fff",border:on?"none":"1.5px solid #c5c9d6",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:800}}>{on?"✓":""}</div><span style={{fontSize:13,color:on?"#0073ea":"#323338",fontWeight:on?600:400}}>{o}</span></div>);})}</div>
        <div style={{minWidth:160,flexShrink:0}}>
          <div style={{fontSize:10,fontWeight:700,color:"#9aadbd",letterSpacing:.7,textTransform:"uppercase",marginBottom:8}}>Status</div>
          {Object.entries(STATUS_CFG).map(([s,sc])=>{const on=filters.status.has(s);const n=allTasks.filter(t=>t.status===s).length;return(<div key={s} onClick={()=>onToggle("status",s)} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:6,cursor:"pointer",background:on?"#e8f4fd":"transparent"}} onMouseEnter={e=>{if(!on)e.currentTarget.style.background="#f5f6f8";}} onMouseLeave={e=>{e.currentTarget.style.background=on?"#e8f4fd":"transparent";}}><div style={{width:16,height:16,borderRadius:3,background:on?"#0073ea":"#fff",border:on?"none":"1.5px solid #c5c9d6",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:800}}>{on?"✓":""}</div><div style={{width:10,height:10,borderRadius:3,background:sc.bg,flexShrink:0}}/><span style={{fontSize:13,color:on?"#0073ea":"#323338",fontWeight:on?600:400,flex:1}}>{s}</span><span style={{fontSize:11,color:"#9aadbd"}}>{n}</span></div>);})}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   HIDE MENU
══════════════════════════════════════════════════════════ */
function HideMenu({ anchor, onClose, extraCols, hiddenCols, onToggleHide }) {
  const ref=useRef(); const [pos,setPos]=useState({top:0,left:0}); const [search,setSearch]=useState("");
  const builtins=[{id:"person",label:"Owner",bg:"#0073ea",icon:"👤"},{id:"status",label:"Status",bg:"#00c875",icon:"≡"},{id:"date",label:"Due date",bg:"#7c3aed",icon:"📅"}];
  const allCols=[...builtins,...(extraCols||[]).map(ec=>({id:ec.id,label:ec.label,bg:P.accent,icon:"📝"}))];
  const filtered=allCols.filter(c=>!search||c.label.toLowerCase().includes(search.toLowerCase()));
  useEffect(()=>{const calc=()=>{if(anchor?.current){const r=anchor.current.getBoundingClientRect();let left=r.left;if(left+290>window.innerWidth-8)left=window.innerWidth-298;setPos({top:r.bottom+4,left});}};calc();window.addEventListener('scroll',calc,true);window.addEventListener('resize',calc);return()=>{window.removeEventListener('scroll',calc,true);window.removeEventListener('resize',calc);};},[anchor]);
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target)&&!anchor?.current?.contains(e.target))onClose();};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h);},[anchor,onClose]);
  return(
    <div ref={ref} style={{position:"fixed",top:pos.top,left:pos.left,zIndex:9000,background:"#fff",border:"1px solid #dde1ea",borderRadius:12,boxShadow:"0 8px 40px rgba(0,0,0,0.14)",fontFamily:"inherit",width:270,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px 10px",borderBottom:"1px solid #eef0f4"}}><span style={{fontSize:14,fontWeight:800,color:"#323338"}}>Display columns</span></div>
      <div style={{padding:"10px 12px 6px"}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find columns..." style={{width:"100%",border:"1px solid #e6e9ef",borderRadius:8,padding:"7px 10px",fontSize:12.5,fontFamily:"inherit",outline:"none",color:"#323338",background:"#f5f6f8"}}/></div>
      <div style={{maxHeight:320,overflowY:"auto",padding:"4px 0 8px"}}>
        {filtered.map(col=>{const shown=!hiddenCols.has(col.id);return(<div key={col.id} onClick={()=>onToggleHide(col.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 14px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f6f8"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><div style={{width:16,height:16,borderRadius:3,background:shown?"#0073ea":"#fff",border:shown?"none":"1.5px solid #c5c9d6",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700}}>{shown?"✓":""}</div><div style={{width:24,height:24,borderRadius:6,background:col.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700}}>{col.icon}</div><span style={{fontSize:13,color:shown?"#323338":"#676879"}}>{col.label}</span></div>);})}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SORT MENU
══════════════════════════════════════════════════════════ */
function SortMenu({ anchor, sort, onSort, onClose }) {
  const ref=useRef(); const [pos,setPos]=useState({top:0,left:0});
  const [col,setCol]=useState(sort?sort.split('-')[0]:'');
  const [dir,setDir]=useState(sort&&sort.includes('desc')?'Descending':'Ascending');
  useEffect(()=>{const calc=()=>{if(anchor?.current){const r=anchor.current.getBoundingClientRect();setPos({top:r.bottom+4,left:Math.max(8,r.left-10)});}};calc();window.addEventListener('scroll',calc,true);window.addEventListener('resize',calc);return()=>{window.removeEventListener('scroll',calc,true);window.removeEventListener('resize',calc);};},[anchor]);
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target)&&!anchor?.current?.contains(e.target))onClose();};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h);},[anchor,onClose]);
  const apply=(c,d)=>{if(!c)return;const map={'Name':d==='Ascending'?'name-asc':'name-desc','Due date':d==='Ascending'?'date-asc':'date-desc','Status':'status'};onSort(map[c]||`${c.toLowerCase()}-${d==='Ascending'?'asc':'desc'}`);};
  return(
    <div ref={ref} style={{position:"fixed",top:pos.top,left:pos.left,zIndex:9000,background:"#fff",border:"1px solid #dde1ea",borderRadius:12,boxShadow:"0 8px 40px rgba(0,0,0,0.13)",fontFamily:"inherit",width:460}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px 10px",borderBottom:"1px solid #eef0f4"}}><span style={{fontSize:14,fontWeight:800,color:"#323338"}}>Sort by</span><button onClick={onClose} style={{background:"#fff",border:"1px solid #d0d4e4",borderRadius:8,padding:"5px 14px",fontSize:12,fontWeight:600,color:"#323338",cursor:"pointer",fontFamily:"inherit"}}>Close</button></div>
      <div style={{padding:"14px 20px"}}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <select value={col} onChange={e=>{setCol(e.target.value);apply(e.target.value,dir);}} style={{flex:1,border:"1px solid #d0d4e4",borderRadius:7,padding:"8px 11px",fontSize:13,fontFamily:"inherit",color:"#323338",outline:"none",background:"#fff"}}><option value="">Choose column</option>{["Name","Owner","Status","Due date","Priority"].map(o=><option key={o}>{o}</option>)}</select>
          <select value={dir} onChange={e=>{setDir(e.target.value);if(col)apply(col,e.target.value);}} style={{width:160,border:"1px solid #d0d4e4",borderRadius:7,padding:"8px 11px",fontSize:13,fontFamily:"inherit",color:"#323338",outline:"none",background:"#fff"}}><option>Ascending</option><option>Descending</option></select>
        </div>
        {sort&&<span onClick={()=>{onSort(null);onClose();}} style={{fontSize:12,color:"#e2445c",cursor:"pointer",fontWeight:600,display:"block",marginTop:10}}>Clear sort</span>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   GROUP BY MENU
══════════════════════════════════════════════════════════ */
function GrpByMenu({ anchor, groupBy, onGroupBy, onClose }) {
  const ref=useRef(); const [pos,setPos]=useState({top:0,left:0});
  useEffect(()=>{const calc=()=>{if(!anchor?.current)return;const r=anchor.current.getBoundingClientRect();let left=r.left-10;if(left+320>window.innerWidth-8)left=window.innerWidth-328;setPos({top:r.bottom+6,left});};calc();window.addEventListener("scroll",calc,true);window.addEventListener("resize",calc);return()=>{window.removeEventListener("scroll",calc,true);window.removeEventListener("resize",calc);};},[anchor]);
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target)&&!anchor?.current?.contains(e.target))onClose();};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[anchor,onClose]);
  const opts=[{key:"default",label:"None (default)"},{key:"status",label:"Status"},{key:"date",label:"Due date"}];
  return(
    <div ref={ref} style={{position:"fixed",top:pos.top,left:pos.left,zIndex:9500,background:"#fff",border:"1px solid #dde1ea",borderRadius:14,boxShadow:"0 12px 50px rgba(0,0,0,0.16)",fontFamily:"inherit",width:280}}>
      <div style={{padding:"12px 16px 8px",borderBottom:"1px solid #eef0f4",display:"flex",justifyContent:"space-between"}}><span style={{fontSize:14,fontWeight:800,color:"#323338"}}>Group items by</span><button onClick={onClose} style={{background:"#fff",border:"1px solid #d0d4e4",borderRadius:8,padding:"4px 12px",fontSize:11,fontWeight:600,color:"#323338",cursor:"pointer",fontFamily:"inherit"}}>Close</button></div>
      <div style={{padding:"8px 0 8px"}}>
        {opts.map(o=>(
          <div key={o.key} onClick={()=>{onGroupBy(o.key);onClose();}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",cursor:"pointer",background:groupBy===o.key?"#f0f7ff":"transparent"}} onMouseEnter={e=>{if(groupBy!==o.key)e.currentTarget.style.background="#f5f6f8";}} onMouseLeave={e=>{e.currentTarget.style.background=groupBy===o.key?"#f0f7ff":"transparent";}}>
            <div style={{width:18,height:18,borderRadius:"50%",border:groupBy===o.key?"none":"2px solid #c5c9d6",background:groupBy===o.key?"#0073ea":"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>{groupBy===o.key&&<div style={{width:7,height:7,borderRadius:"50%",background:"#fff"}}/>}</div>
            <span style={{fontSize:13,color:"#323338",fontWeight:groupBy===o.key?600:400}}>{o.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COLUMN TYPES
══════════════════════════════════════════════════════════ */
const COLUMN_TYPES = [
  { type:"text",icon:"📝",label:"Text",desc:"Add notes or free text" },
  { type:"number",icon:"🔢",label:"Numbers",desc:"Track progress, budget" },
  { type:"status2",icon:"🏷️",label:"Status",desc:"Custom label column" },
  { type:"date2",icon:"📅",label:"Date",desc:"Set another date" },
  { type:"priority",icon:"🔥",label:"Priority",desc:"Critical, High, Medium, Low" },
  { type:"checkbox",icon:"☑️",label:"Checkbox",desc:"Simple yes/no toggle" },
  { type:"link",icon:"🔗",label:"Link",desc:"Add a URL" },
  { type:"tags",icon:"🏷",label:"Tags",desc:"Add labels/tags" },
  { type:"timeline",icon:"📊",label:"Timeline",desc:"Start date → end date" },
  { type:"rating",icon:"⭐",label:"Rating",desc:"Rate 1–5 stars" },
];

function AddColumnModal({ onAdd, onClose }) {
  const [search,setSearch]=useState("");
  const filtered=COLUMN_TYPES.filter(c=>!search||c.label.toLowerCase().includes(search.toLowerCase()));
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(30,10,60,0.4)",zIndex:8000,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#fff",borderRadius:16,width:480,boxShadow:"0 24px 80px rgba(124,58,237,0.25)",overflow:"hidden"}}>
        <div style={{background:`linear-gradient(135deg,${P.dark},${P.mid})`,padding:"16px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><div style={{fontSize:16,fontWeight:800,color:"#fff"}}>Add Column</div><button onClick={onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:7,width:28,height:28,cursor:"pointer",color:"#fff",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button></div>
          <div style={{marginTop:12,display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.15)",borderRadius:8,padding:"7px 11px"}}><span style={{fontSize:13,color:"rgba(255,255,255,0.6)"}}>🔍</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search column types…" style={{border:"none",outline:"none",background:"transparent",fontSize:13,color:"#fff",fontFamily:"inherit",flex:1}}/></div>
        </div>
        <div style={{padding:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,maxHeight:380,overflowY:"auto"}}>
          {filtered.map(ct=>(
            <div key={ct.type} onClick={()=>{onAdd(ct);onClose();}} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",border:`1.5px solid ${P.border}`,borderRadius:10,cursor:"pointer",background:"#fff"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=P.accent;e.currentTarget.style.background=P.light;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=P.border;e.currentTarget.style.background="#fff";}}>
              <div style={{width:36,height:36,borderRadius:9,background:P.light,border:`1.5px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{ct.icon}</div>
              <div><div style={{fontSize:13,fontWeight:700,color:P.text}}>{ct.label}</div><div style={{fontSize:10,color:P.muted,marginTop:1}}>{ct.desc}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COLUMN HEADER
══════════════════════════════════════════════════════════ */
function ColHeader({ col, onRename, onDelete, onMoveLeft, onMoveRight, canMoveLeft, canMoveRight }) {
  const [editing,setEditing]=useState(false); const [val,setVal]=useState(col.label);
  const [menuOpen,setMenuOpen]=useState(false); const menuRef=useRef();
  const ct=COLUMN_TYPES.find(c=>c.type===col.type)||{icon:"📝"};
  if(editing) return(<div style={{display:"flex",alignItems:"center",padding:"0 6px",gap:4,width:"100%"}}><input autoFocus value={val} onChange={e=>setVal(e.target.value)} onBlur={()=>{onRename(col.id,val||col.label);setEditing(false);}} onKeyDown={e=>{if(e.key==="Enter"){onRename(col.id,val||col.label);setEditing(false);}if(e.key==="Escape")setEditing(false);}} style={{flex:1,border:`1.5px solid ${P.accent}`,borderRadius:5,padding:"3px 7px",fontSize:11,fontFamily:"inherit",outline:"none",color:P.text,background:"#fff"}}/></div>);
  return(
    <div className="col-hdr" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:3,padding:"7px 4px",position:"relative",width:"100%",cursor:"grab",userSelect:"none"}}>
      <span style={{fontSize:11}}>{ct.icon}</span>
      <span style={{fontSize:11,color:P.muted,fontWeight:700,letterSpacing:0.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:70}}>{col.label}</span>
      <div ref={menuRef} onClick={e=>{e.stopPropagation();setMenuOpen(v=>!v);}} className="col-menu-btn" style={{width:13,height:13,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:9,color:P.muted,opacity:0,transition:"opacity .1s",flexShrink:0}}>▾</div>
      {menuOpen&&(<DD anchor={menuRef} onClose={()=>setMenuOpen(false)} w={160}><MI icon="✏️" title="Rename" onClick={()=>{setEditing(true);setMenuOpen(false);}}/>{canMoveLeft&&<MI icon="‹" title="Move left" onClick={()=>{onMoveLeft();setMenuOpen(false);}}/>}{canMoveRight&&<MI icon="›" title="Move right" onClick={()=>{onMoveRight();setMenuOpen(false);}}/>}<Sep/><MI icon="🗑" title="Delete column" danger onClick={()=>{onDelete(col.id);setMenuOpen(false);}}/></DD>)}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CELL RENDERER
══════════════════════════════════════════════════════════ */
function Cell({ col, value, onChange }) {
  const [localVal,setLocalVal]=useState(value??""); const [open,setOpen]=useState(false); const ref=useRef();
  useEffect(()=>{setLocalVal(value??"");},[value]);
  if(col.type==="checkbox"){const checked=value===true||value==="true"||value===1;return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",cursor:"pointer"}} onClick={()=>onChange(!checked)}><div style={{width:17,height:17,borderRadius:4,border:checked?"none":`1.5px solid ${P.muted}`,background:checked?P.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700}}>{checked&&"✓"}</div></div>);}
  if(col.type==="priority"){const v=value||"—";const cfg=PRIORITY_CFG[v]||PRIORITY_CFG["—"];return(<div ref={ref} style={{height:"100%",display:"flex",alignItems:"stretch"}}><div onClick={()=>setOpen(o=>!o)} style={{flex:1,background:cfg.bg,color:cfg.fg,fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{v}</div>{open&&<PriorityPicker anchor={ref} currentValue={v} onSelect={v=>{onChange(v);setOpen(false);}} onClose={()=>setOpen(false)}/>}</div>);}
  if(col.type==="rating"){const v=Number(value)||0;return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:2,height:"100%"}}>{[1,2,3,4,5].map(n=>(<span key={n} onClick={()=>onChange(v===n?0:n)} style={{fontSize:15,cursor:"pointer",color:n<=v?"#f59e0b":"#e2e8f0"}}>★</span>))}</div>);}
  if(col.type==="date2"){return(<input type="date" value={localVal} onChange={e=>{setLocalVal(e.target.value);onChange(e.target.value);}} style={{width:"100%",height:"100%",border:"none",outline:"none",fontSize:11,color:P.muted,fontFamily:"inherit",background:"transparent",cursor:"pointer",textAlign:"center",padding:"0 4px"}}/>);}
  if(col.type==="status2"){const opts=["—","Done","In Progress","Blocked","Review","On Hold"];const colorMap={"Done":"#00c875","In Progress":"#fdab3d","Blocked":"#e2445c","Review":"#9333ea","On Hold":"#7c3aed","—":"#e2e8f0"};const v=value||"—";return(<div ref={ref} style={{height:"100%",display:"flex",alignItems:"stretch"}}><div onClick={()=>setOpen(o=>!o)} style={{flex:1,background:colorMap[v]||"#e2e8f0",color:v==="—"?"#94a3b8":"#fff",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{v}</div>{open&&(<DD anchor={ref} onClose={()=>setOpen(false)} w={160}>{opts.map(o=>(<div key={o} onClick={()=>{onChange(o);setOpen(false);}} style={{borderRadius:6,overflow:"hidden",marginBottom:2,cursor:"pointer"}}><div style={{background:colorMap[o]||"#e2e8f0",color:o==="—"?"#94a3b8":"#fff",padding:"6px 14px",fontSize:12,fontWeight:700,textAlign:"center"}}>{o}</div></div>))}</DD>)}</div>);}
  if(col.type==="tags"){const tags=Array.isArray(value)?value:(value?String(value).split(",").map(t=>t.trim()).filter(Boolean):[]);return(<div ref={ref} style={{display:"flex",alignItems:"center",gap:3,padding:"0 6px",flexWrap:"wrap",height:"100%",cursor:"pointer",minHeight:36}} onClick={()=>setOpen(o=>!o)}>{tags.length===0?<span style={{fontSize:11,color:P.muted}}>+ Add</span>:tags.slice(0,2).map((t)=>(<span key={t} style={{fontSize:10,background:"#e0e7ff",color:"#4338ca",borderRadius:10,padding:"2px 6px",fontWeight:600}}>{t}</span>))}{open&&(<DD anchor={ref} onClose={()=>setOpen(false)} w={200}><div style={{padding:"6px 8px 4px"}}><input autoFocus placeholder="Type tag + Enter" onKeyDown={e=>{if(e.key==="Enter"&&e.target.value.trim()){onChange([...tags,e.target.value.trim()].join(","));e.target.value="";}}} style={{width:"100%",border:`1.5px solid ${P.border}`,borderRadius:7,padding:"6px 9px",fontSize:12,fontFamily:"inherit",outline:"none"}}/></div>{tags.map(t=>(<div key={t} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 8px",borderRadius:6}}><span style={{fontSize:11,background:"#e0e7ff",color:"#4338ca",borderRadius:10,padding:"2px 8px",fontWeight:600}}>{t}</span><span onClick={e=>{e.stopPropagation();onChange(tags.filter(x=>x!==t).join(","));}} style={{marginLeft:"auto",color:"#e2445c",fontSize:12,cursor:"pointer"}}>✕</span></div>))}</DD>)}</div>);}
  if(col.type==="link"){return(<input value={localVal} onChange={e=>setLocalVal(e.target.value)} onBlur={()=>onChange(localVal)} placeholder="https://…" style={{width:"100%",height:"100%",border:"none",outline:"none",fontSize:11,color:"#0073ea",fontFamily:"inherit",background:"transparent",padding:"0 8px",textAlign:"center"}}/>);}
  if(col.type==="timeline"){const parts=(value||"").split("→").map(s=>s.trim());return(<div style={{display:"flex",alignItems:"center",gap:2,padding:"0 4px",height:"100%"}}><input type="date" defaultValue={parts[0]||""} onChange={e=>onChange(`${e.target.value}→${parts[1]||""}`)} style={{flex:1,border:"none",outline:"none",fontSize:10,color:P.muted,fontFamily:"inherit",background:"transparent",cursor:"pointer"}}/><span style={{fontSize:9,color:P.muted}}>→</span><input type="date" defaultValue={parts[1]||""} onChange={e=>onChange(`${parts[0]||""}→${e.target.value}`)} style={{flex:1,border:"none",outline:"none",fontSize:10,color:P.muted,fontFamily:"inherit",background:"transparent",cursor:"pointer"}}/></div>);}
  return(<input value={localVal} onChange={e=>setLocalVal(e.target.value)} type={col.type==="number"?"number":"text"} placeholder={col.type==="number"?"0":"—"} style={{width:"100%",height:"100%",border:"none",outline:"none",fontSize:12,color:P.text,fontFamily:"inherit",background:"transparent",padding:"0 8px",textAlign:col.type==="number"?"center":"left"}} onFocus={e=>{e.target.style.background="#fff";e.target.style.boxShadow=`inset 0 0 0 1.5px ${P.accent}`;}} onBlur={e=>{onChange(localVal);e.target.style.background="transparent";e.target.style.boxShadow="none";}}/>);
}

/* ══════════════════════════════════════════════════════════
   STATUS BAR WITH TOOLTIP
══════════════════════════════════════════════════════════ */
function StatusBarWithTooltip({ statusCounts, total }) {
  const [hovered,setHovered]=React.useState(null);
  return(
    <div style={{position:"relative",display:"flex",height:10,borderRadius:4,overflow:"visible",flex:1,maxWidth:90,gap:1,cursor:"pointer"}}>
      <div style={{display:"flex",width:"100%",height:"100%",borderRadius:4,overflow:"hidden",gap:1}}>
        {statusCounts.map(({s,bg,n})=>(<div key={s} style={{flex:n,background:bg,minWidth:4,opacity:hovered&&hovered.s!==s?0.45:1}} onMouseEnter={e=>{const r=e.currentTarget.getBoundingClientRect();setHovered({s,n,bg,x:r.left+r.width/2});}} onMouseLeave={()=>setHovered(null)}/>))}
        {(()=>{const nd=total-statusCounts.reduce((a,x)=>a+x.n,0);return nd>0?<div style={{flex:nd,background:"#e2e8f0",minWidth:4}} onMouseEnter={e=>{const r=e.currentTarget.getBoundingClientRect();setHovered({s:"Not Started",n:nd,bg:"#e2e8f0",x:r.left+r.width/2});}} onMouseLeave={()=>setHovered(null)}/>:null;})()}
      </div>
      {hovered&&(<div style={{position:"fixed",bottom:60,left:hovered.x,transform:"translateX(-50%)",zIndex:99999,pointerEvents:"none",background:"#1e293b",color:"#fff",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,boxShadow:"0 4px 16px rgba(0,0,0,0.25)",whiteSpace:"nowrap"}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}><div style={{width:10,height:10,borderRadius:2,background:hovered.bg}}/><span>{hovered.s}</span></div><div style={{color:"#94a3b8",fontSize:11}}>{hovered.n}/{total} · {Math.round(hovered.n/total*100)}%</div></div>)}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TASK ROW
══════════════════════════════════════════════════════════ */
function TaskRow({ task, onCheck, onField, onStatus, onPriority, onDup, onDel, onOpen, selected, groupColor, employees, extraCols, onExtraField, hiddenCols }) {
  const statusRef=useRef(); const dotsRef=useRef(); const personRef=useRef(); const priorityRef=useRef();
  const [spOpen,setSpOpen]=useState(false); const [ppOpen,setPpOpen]=useState(false);
  const [dotsOpen,setDotsOpen]=useState(false); const [personOpen,setPersonOpen]=useState(false);
  const [hovered,setHovered]=useState(false);
  const id=task._id||task.id;
  const sc=STATUS_CFG[task.status]||STATUS_CFG["Not Started"];
  const hcSet=hiddenCols||new Set();
  const cols=(extraCols||[]).filter(c=>!hcSet.has(c.id));
  const priorityVal=task.priority||"—";
  const pc=PRIORITY_CFG[priorityVal]||PRIORITY_CFG["—"];
  const bg=selected?"rgba(147,51,234,0.06)":hovered?P.hover:"#fff";

  return(
    <div className="trow" style={{display:"flex",alignItems:"stretch",borderBottom:`1px solid ${P.border}`,minWidth:"max-content",background:bg}} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
      {/* checkbox */}
      <div style={{width:COL_W.checkbox,flexShrink:0,position:"sticky",left:0,zIndex:10,background:bg,borderRight:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"background .1s"}}>
        <div onClick={()=>onCheck(id)} style={{width:15,height:15,borderRadius:4,cursor:"pointer",border:task.checked?"none":`1.5px solid ${P.muted}`,background:task.checked?P.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9,fontWeight:700}}>{task.checked&&"✓"}</div>
      </div>
      {/* task name */}
      <div style={{width:COL_W.task,flexShrink:0,position:"sticky",left:COL_W.checkbox,zIndex:10,background:bg,boxShadow:hovered?"2px 0 8px rgba(0,0,0,0.07)":"2px 0 4px rgba(0,0,0,0.04)",display:"flex",alignItems:"center",gap:4,padding:"0 6px 0 0",transition:"background .1s"}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:groupColor,flexShrink:0}}/>
        <input key={task.title} defaultValue={task.title} onBlur={e=>{const v=e.target.value.trim();if(v&&v!==task.title)onField(id,"title",v);}} style={{background:"transparent",border:"none",outline:"none",fontSize:13,color:P.text,fontFamily:"inherit",width:"100%",padding:"9px 4px 9px 10px",textDecoration:task.checked?"line-through":"none",opacity:task.checked?.5:1,fontWeight:500,cursor:"pointer"}} onFocus={e=>{e.target.style.background="#fff";e.target.style.boxShadow=`0 0 0 2px ${P.accent}33`;e.target.style.borderRadius="4px";}} onBlurCapture={e=>{e.target.style.background="transparent";e.target.style.boxShadow="none";}}/>
        <button className="openBtn" onClick={e=>{e.stopPropagation();onOpen(task);}} style={{opacity:0,background:"#e8f4fd",border:"1px solid #c3d9f0",borderRadius:6,cursor:"pointer",width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#0073ea",flexShrink:0,transition:"opacity .15s",fontWeight:700}}>↗</button>
      </div>
      {/* person */}
      {!hcSet.has('person')&&(<div ref={personRef} onClick={()=>setPersonOpen(v=>!v)} style={{width:COL_W.person,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",borderRight:`1px solid ${P.border}`,padding:"0 8px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=P.light} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{task.assignTo&&task.assignTo!=="Unassigned"?<div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:26,height:26,borderRadius:"50%",background:getAvatarColor(task.assignTo),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9,fontWeight:700,flexShrink:0}}>{task.assignTo.slice(0,2).toUpperCase()}</div><span style={{fontSize:12,color:P.mid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:95}}>{task.assignTo}</span></div>:<div style={{width:26,height:26,borderRadius:"50%",border:`1.5px dashed ${P.muted}`,display:"flex",alignItems:"center",justifyContent:"center",color:P.muted,fontSize:16}}>+</div>}</div>)}
      {personOpen&&<PersonPicker anchor={personRef} onSelect={v=>onField(id,"assignTo",v)} onClose={()=>setPersonOpen(false)} employees={employees} currentAssignee={task.assignTo&&task.assignTo!=="Unassigned"?task.assignTo:""}/>}
      {/* status */}
      {!hcSet.has('status')&&(<div style={{width:COL_W.status,flexShrink:0,display:"flex",alignItems:"stretch",borderRight:`1px solid ${P.border}`}}><div ref={statusRef} onClick={()=>setSpOpen(v=>!v)} style={{flex:1,background:sc.bg,color:sc.fg,fontSize:12,fontWeight:700,textAlign:"center",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={e=>e.currentTarget.style.opacity=".8"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>{task.status}</div>{spOpen&&<StatusPicker anchor={statusRef} onSelect={v=>{onStatus(id,v);setSpOpen(false);}} onClose={()=>setSpOpen(false)}/>}</div>)}
      {/* date */}
      {!hcSet.has('date')&&(<div style={{width:COL_W.date,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",borderRight:`1px solid ${P.border}`,padding:"0 6px"}}><input type="date" key={task.date} defaultValue={task.date||""} onChange={e=>onField(id,"date",e.target.value)} style={{border:"none",outline:"none",fontSize:12,color:P.muted,fontFamily:"inherit",background:"transparent",cursor:"pointer",width:"100%",textAlign:"center"}}/></div>)}
      {/* priority — click opens PriorityPicker */}
      {!hcSet.has('priority_col')&&(<div style={{width:COL_W.status,flexShrink:0,display:"flex",alignItems:"stretch",borderRight:`1px solid ${P.border}`}}><div ref={priorityRef} onClick={()=>setPpOpen(v=>!v)} style={{flex:1,background:pc.bg,color:pc.fg,fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={e=>e.currentTarget.style.opacity=".85"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>{priorityVal}</div>{ppOpen&&<PriorityPicker anchor={priorityRef} currentValue={priorityVal} onSelect={v=>{onPriority(id,v);setPpOpen(false);}} onClose={()=>setPpOpen(false)}/>}</div>)}
      {/* extra cols */}
      {cols.map(col=>(<div key={col.id} style={{width:extraColWidth(col.type),flexShrink:0,borderRight:`1px solid ${P.border}`,display:"flex",alignItems:"stretch",overflow:"hidden"}}><Cell col={col} value={(task.extraData||{})[col.id]} onChange={val=>onExtraField(id,col.id,val)}/></div>))}
      {/* + col placeholder */}
      <div style={{width:COL_W.addcol,flexShrink:0,borderRight:`1px solid ${P.border}`}}/>
      {/* dots */}
      <div style={{width:COL_W.dots,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
        <button 
          onClick={e=>{e.stopPropagation();onDel(id);}}
          style={{
            background: "linear-gradient(135deg,#ef4444,#dc2626)",
            border: "none",
            borderRadius: 4,
            padding: "2px 8px",
            height: 22,
            cursor: "pointer",
            fontSize: 10,
            fontWeight: 700,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            boxShadow: "0 2px 6px rgba(239,68,68,0.3)",
            transition: "all 0.2s",
            opacity: hovered ? 1 : 0.6
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.opacity = hovered ? "1" : "0.6";
          }}
        >
          🗑 Delete
        </button>
        <div ref={dotsRef} onClick={e=>{e.stopPropagation();setDotsOpen(v=>!v);}} style={{width:26,height:26,borderRadius:5,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:P.muted,letterSpacing:1,userSelect:"none"}} onMouseEnter={e=>e.currentTarget.style.background=P.border} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>···</div>
        {dotsOpen&&(<DD anchor={dotsRef} onClose={()=>setDotsOpen(false)} w={160}><MI icon="⎘" title="Duplicate" onClick={()=>{onDup(task);setDotsOpen(false);}}/><Sep/><MI icon="🗑" title="Delete task" danger onClick={()=>{onDel(id);setDotsOpen(false);}}/></DD>)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TASK UPDATE PANEL
══════════════════════════════════════════════════════════ */
function TaskUpdatePanel({ task, onClose, onField }) {
  const [tab,setTab]=useState("updates"); const [updateText,setUpdateText]=useState(""); const [updates,setUpdates]=useState([]);
  const postUpdate=()=>{if(!updateText.trim())return;setUpdates(p=>[{id:Date.now(),text:updateText,time:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}),date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}),...p}]);setUpdateText("");};
  return(
    <div style={{width:480,flexShrink:0,background:"#fff",borderLeft:`1.5px solid ${P.border}`,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",fontFamily:"inherit"}}>
      <div style={{padding:"14px 18px 0",borderBottom:`1px solid ${P.border}`,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:P.muted,fontSize:18,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6}}>×</button>
            <div style={{fontSize:17,fontWeight:700,color:P.text}}>{task.title}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:0}}>
          {["updates","files","activity"].map(t=>(<div key={t} onClick={()=>setTab(t)} style={{padding:"8px 14px",fontSize:13,fontWeight:tab===t?700:500,color:tab===t?P.text:P.muted,borderBottom:tab===t?`2px solid ${P.accent}`:"2px solid transparent",cursor:"pointer",textTransform:"capitalize"}}>{t}</div>))}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>
        {tab==="updates"&&(<>
          <div style={{margin:"12px 18px",border:`1.5px solid ${P.border}`,borderRadius:10,overflow:"hidden",flexShrink:0}}>
            <textarea value={updateText} onChange={e=>setUpdateText(e.target.value)} placeholder="Write an update..." style={{width:"100%",minHeight:100,border:"none",outline:"none",resize:"none",padding:"12px 14px",fontSize:13,fontFamily:"inherit",color:P.text,boxSizing:"border-box"}}/>
            <div style={{display:"flex",justifyContent:"flex-end",padding:"8px 10px",borderTop:`1px solid ${P.border}`,background:"#fafafa"}}>
              <button onClick={postUpdate} style={{background:updateText.trim()?"#0073ea":"#e2e8f0",color:updateText.trim()?"#fff":"#94a3b8",border:"none",borderRadius:8,padding:"7px 18px",fontSize:13,fontWeight:700,cursor:updateText.trim()?"pointer":"default",fontFamily:"inherit"}}>Update</button>
            </div>
          </div>
          <div style={{flex:1,padding:"0 18px 18px"}}>
            {updates.length===0?(<div style={{textAlign:"center",padding:"40px 0",color:P.muted,fontSize:12}}>No updates yet</div>):updates.map(u=>(<div key={u.id} style={{display:"flex",gap:10,marginBottom:16}}><div style={{width:30,height:30,borderRadius:"50%",background:getAvatarColor("You"),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700,flexShrink:0}}>YO</div><div style={{flex:1}}><div style={{fontSize:11,color:P.muted,marginBottom:4}}>You · {u.date} {u.time}</div><div style={{background:P.light,border:`1px solid ${P.border}`,borderRadius:9,padding:"10px 13px",fontSize:13,color:P.text,whiteSpace:"pre-wrap"}}>{u.text}</div></div></div>))}
          </div>
        </>)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ADD GROUP ROW
══════════════════════════════════════════════════════════ */
function AddGroupRow({onAdd,triggerRef}){
  const [active,setActive]=useState(false); const [label,setLabel]=useState(""); const inputRef=useRef();
  useEffect(()=>{if(triggerRef)triggerRef.current={trigger:()=>setActive(true)};},[triggerRef]);
  useEffect(()=>{if(active)setTimeout(()=>inputRef.current?.focus(),50);},[active]);
  const submit=()=>{if(label.trim())onAdd(label.trim());setLabel("");setActive(false);};
  return(
    <div style={{marginBottom:16}}>
      {active?(
        <div style={{display:"flex",alignItems:"center",gap:0}}>
          <div style={{width:4,background:P.accent,borderRadius:"3px 0 0 3px",minHeight:40,flexShrink:0}}/>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",flex:1,background:P.light,border:`1.5px solid ${P.accent}`,borderLeft:"none",borderRadius:"0 8px 8px 0"}}>
            <input ref={inputRef} value={label} onChange={e=>setLabel(e.target.value)} placeholder="Group name…" onKeyDown={e=>{if(e.key==="Enter")submit();if(e.key==="Escape"){setActive(false);setLabel("");}}} style={{flex:1,border:"none",outline:"none",background:"transparent",fontSize:14,fontWeight:700,color:P.accent,fontFamily:"inherit"}}/>
            <button onClick={submit} style={{background:`linear-gradient(135deg,${P.accent},#a855f7)`,color:"#fff",border:"none",borderRadius:7,padding:"5px 16px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>Create</button>
            <button onClick={()=>{setActive(false);setLabel("");}} style={{background:"#fff",color:P.mid,border:`1px solid ${P.border}`,borderRadius:7,padding:"5px 10px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          </div>
        </div>
      ):(
        <div onClick={()=>setActive(true)} style={{display:"flex",alignItems:"center",gap:0,cursor:"pointer"}}>
          <div style={{width:4,background:"transparent",borderRadius:"3px 0 0 3px",minHeight:36,flexShrink:0}}/>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",flex:1,border:`1.5px dashed ${P.border}`,borderLeft:"none",borderRadius:"0 8px 8px 0",background:"transparent"}} onMouseEnter={e=>{e.currentTarget.style.background=P.light;e.currentTarget.style.borderColor=P.accent;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=P.border;}}>
            <span style={{fontSize:16,color:P.accent,fontWeight:300,lineHeight:1}}>+</span>
            <span style={{fontSize:13,color:P.mid,fontWeight:600}}>Add new group</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   GROUP BLOCK
══════════════════════════════════════════════════════════ */
function GroupBlock({ group, onToggle, onCheck, onField, onStatus, onPriority, onAddTask, onDup, onDel, onOpen, selectedId, isVirtual, onDelGroup, employees, showToast, extraCols, onExtraField, onAddCol, onRenameCol, onDeleteCol, hiddenCols, onMoveCol }) {
  const [adding,setAdding]=useState(false); const [newTitle,setNewTitle]=useState("");
  const gid=group._id||group.id; const tasks=group.tasks||[];
  const done=tasks.filter(t=>t.status==="Done").length;
  const hcSet=hiddenCols||new Set();
  const visibleExtraCols=(extraCols||[]).filter(c=>!hcSet.has(c.id));
  const submit=()=>{if(!newTitle.trim()){setAdding(false);return;}onAddTask(gid,newTitle.trim());setNewTitle("");setAdding(false);};
  const totalW=COL_W.checkbox+COL_W.task+(!hcSet.has('person')?COL_W.person:0)+(!hcSet.has('status')?COL_W.status:0)+(!hcSet.has('date')?COL_W.date:0)+(!hcSet.has('priority_col')?COL_W.status:0)+visibleExtraCols.reduce((s,c)=>s+extraColWidth(c.type),0)+COL_W.addcol+COL_W.dots;

  return(
    <div style={{marginBottom:16}}>
      <div style={{display:"flex",alignItems:"stretch"}}>
        <div style={{width:4,background:group.color,borderRadius:"3px 0 0 3px",flexShrink:0}}/>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",flex:1,background:P.light,border:`1px solid ${P.border}`,borderLeft:"none",borderRadius:"0 8px 8px 0",cursor:"pointer"}} onClick={()=>onToggle(gid)}>
          <span style={{fontSize:10,color:group.color,fontWeight:700,transform:`rotate(${group.open?0:-90}deg)`,transition:"transform .2s",display:"inline-block"}}>▼</span>
          <span style={{fontSize:14,fontWeight:700,color:group.color,flex:1}}>{group.label}</span>
          <span style={{fontSize:11,color:P.muted,background:"#fff",border:`1px solid ${P.border}`,borderRadius:10,padding:"1px 8px",fontWeight:600}}>{tasks.length} items</span>
          <span style={{fontSize:11,color:"#00c875",fontWeight:600}}>{done} done</span>
          {!isVirtual&&(<button onClick={e=>{e.stopPropagation();onDelGroup(gid);}} style={{background:"#fee2e2",border:"1px solid #fecaca",cursor:"pointer",color:"#ef4444",fontSize:11,padding:"4px 8px",borderRadius:6,fontWeight:700,display:"flex",gap:4,alignItems:"center",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="#fecaca"}} onMouseLeave={e=>{e.currentTarget.style.background="#fee2e2"}}>🗑 Delete</button>)}
        </div>
      </div>

      {group.open&&(
        <div style={{marginLeft:4,border:`1px solid ${P.border}`,borderTop:"none",borderRadius:"0 0 8px 8px",overflow:"hidden",background:"#fff"}}>
          <div style={{overflowX:"auto",overflowY:"visible",scrollbarWidth:"thin",scrollbarColor:`${P.muted} ${P.light}`}}>
            <div style={{minWidth:totalW}}>

              {/* Column headers */}
              <div style={{display:"flex",alignItems:"stretch",background:P.light,borderBottom:`1.5px solid ${P.border}`,minWidth:"max-content"}}>
                <div style={{width:COL_W.checkbox,flexShrink:0,position:"sticky",left:0,zIndex:20,background:P.light,borderRight:`1px solid ${P.border}`}}/>
                <div style={{width:COL_W.task,flexShrink:0,position:"sticky",left:COL_W.checkbox,zIndex:20,background:P.light,borderRight:`1px solid ${P.border}`,boxShadow:"2px 0 4px rgba(0,0,0,0.04)",fontSize:11,color:P.muted,padding:"7px 10px",fontWeight:700,letterSpacing:0.3,display:"flex",alignItems:"center"}}>Task</div>
                {!hcSet.has('person')&&<div style={{width:COL_W.person,flexShrink:0,fontSize:11,color:P.muted,padding:"7px 10px",fontWeight:700,borderRight:`1px solid ${P.border}`,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center"}}>Owner</div>}
                {!hcSet.has('status')&&<div style={{width:COL_W.status,flexShrink:0,fontSize:11,color:P.muted,padding:"7px 10px",fontWeight:700,borderRight:`1px solid ${P.border}`,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>Status <span style={{fontSize:9,opacity:0.5}}>ⓘ</span></div>}
                {!hcSet.has('date')&&<div style={{width:COL_W.date,flexShrink:0,fontSize:11,color:P.muted,padding:"7px 10px",fontWeight:700,borderRight:`1px solid ${P.border}`,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>Due date <span style={{fontSize:9,opacity:0.5}}>ⓘ</span></div>}
                {!hcSet.has('priority_col')&&<div style={{width:COL_W.status,flexShrink:0,fontSize:11,color:P.muted,padding:"7px 10px",fontWeight:700,borderRight:`1px solid ${P.border}`,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>Priority <span style={{fontSize:9,opacity:0.5}}>ⓘ</span></div>}
                {visibleExtraCols.map((col,ci)=>(
                  <div key={col.id} className="col-hdr-wrap" style={{width:extraColWidth(col.type),flexShrink:0,borderRight:`1px solid ${P.border}`,background:P.light,display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={e=>{const btns=e.currentTarget.querySelectorAll(".col-menu-btn,.col-move-btn");btns.forEach(b=>b.style.opacity="1");}} onMouseLeave={e=>{const btns=e.currentTarget.querySelectorAll(".col-menu-btn,.col-move-btn");btns.forEach(b=>b.style.opacity="0");}}>
                    <ColHeader col={col} onRename={onRenameCol} onDelete={onDeleteCol} onMoveLeft={()=>onMoveCol&&onMoveCol(col.id,"left")} onMoveRight={()=>onMoveCol&&onMoveCol(col.id,"right")} canMoveLeft={(extraCols||[]).findIndex(x=>x.id===col.id)>0} canMoveRight={(extraCols||[]).findIndex(x=>x.id===col.id)<(extraCols||[]).length-1}/>
                  </div>
                ))}
                <div onClick={onAddCol} style={{width:COL_W.addcol,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",borderRight:`1px solid ${P.border}`,cursor:"pointer",color:P.muted,fontSize:16,fontWeight:300}} onMouseEnter={e=>{e.currentTarget.style.background=P.hover;e.currentTarget.style.color=P.accent;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=P.muted;}}>+</div>
                <div style={{width:COL_W.dots,flexShrink:0}}/>
              </div>

              {tasks.length===0&&!adding&&<div style={{padding:"12px 16px",fontSize:12,color:"#c4b5fd",fontStyle:"italic"}}>No tasks yet</div>}

              {tasks.map(t=>(
                <TaskRow key={t._id||t.id} task={t}
                  onCheck={onCheck} onField={onField} onStatus={onStatus} onPriority={onPriority}
                  onDup={onDup} onDel={onDel} onOpen={onOpen}
                  selected={selectedId===(t._id||t.id)}
                  groupColor={group.color} employees={employees}
                  extraCols={visibleExtraCols} onExtraField={onExtraField} hiddenCols={hiddenCols}/>
              ))}

              {!isVirtual&&(adding?(
                <div style={{display:"flex",alignItems:"stretch",borderTop:`1px solid ${P.border}`,background:P.light,minHeight:40,minWidth:"max-content"}}>
                  <div style={{width:COL_W.checkbox,flexShrink:0,position:"sticky",left:0,zIndex:10,background:P.light,borderRight:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:15,height:15,borderRadius:4,border:`1.5px solid ${P.muted}`}}/></div>
                  <div style={{width:COL_W.task,flexShrink:0,position:"sticky",left:COL_W.checkbox,zIndex:10,background:P.light,borderRight:`1px solid ${P.border}`,padding:"6px 8px",display:"flex",gap:6,alignItems:"center"}}>
                    <input autoFocus placeholder="Task name…" value={newTitle} onChange={e=>setNewTitle(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")submit();if(e.key==="Escape"){setAdding(false);setNewTitle("");}}} style={{flex:1,border:`1.5px solid ${P.accent}`,borderRadius:6,padding:"5px 9px",fontSize:13,fontFamily:"inherit",outline:"none",color:P.text,background:"#fff"}}/>
                    <button onClick={submit} style={{background:`linear-gradient(135deg,${P.accent},#a855f7)`,color:"#fff",border:"none",borderRadius:6,padding:"5px 13px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>Add</button>
                    <button onClick={()=>{setAdding(false);setNewTitle("");}} style={{background:"#fff",color:P.mid,border:`1px solid ${P.border}`,borderRadius:6,padding:"5px 9px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
                  </div>
                  {!hcSet.has('person')&&<div style={{width:COL_W.person,flexShrink:0,borderRight:`1px solid ${P.border}`}}/>}
                  {!hcSet.has('status')&&<div style={{width:COL_W.status,flexShrink:0,borderRight:`1px solid ${P.border}`}}/>}
                  {!hcSet.has('date')&&<div style={{width:COL_W.date,flexShrink:0,borderRight:`1px solid ${P.border}`}}/>}
                  {!hcSet.has('priority_col')&&<div style={{width:COL_W.status,flexShrink:0,borderRight:`1px solid ${P.border}`}}/>}
                  {visibleExtraCols.map(c=><div key={c.id} style={{width:extraColWidth(c.type),flexShrink:0,borderRight:`1px solid ${P.border}`}}/>)}
                  <div style={{width:COL_W.addcol,flexShrink:0,borderRight:`1px solid ${P.border}`}}/><div style={{width:COL_W.dots,flexShrink:0}}/>
                </div>
              ):(
                <div onClick={()=>setAdding(true)} className="add-task-row" style={{display:"flex",alignItems:"center",gap:7,padding:"7px 10px",cursor:"pointer",color:"#676879",fontSize:13,borderTop:`1px solid ${P.border}`,background:"#fff",minWidth:"max-content"}} onMouseEnter={e=>e.currentTarget.style.background="#f0f7ff"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                  <span style={{fontSize:18,color:"#0073ea",fontWeight:300,lineHeight:1,width:20,textAlign:"center",flexShrink:0}}>+</span>
                  <span style={{fontWeight:500,color:"#323338"}}>Add task</span>
                </div>
              ))}

              {/* Footer summary */}
              {tasks.length>0&&(()=>{
                const total=tasks.length; const doneCnt=tasks.filter(t=>t.status==="Done").length;
                const statusCounts=Object.entries(STATUS_CFG).map(([s,sc])=>({s,bg:sc.bg,fg:sc.fg,n:tasks.filter(t=>t.status===s).length})).filter(x=>x.n>0);
                const validDates=tasks.map(t=>t.date).filter(Boolean).sort();
                const fmtD=d=>d?new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"}):null;
                const earliestFmt=fmtD(validDates[0]); const latestFmt=fmtD(validDates[validDates.length-1]); const sameDate=validDates[0]===validDates[validDates.length-1];
                const priorityCounts=PRIORITY_LIST.slice(0,4).map(p=>({p,bg:PRIORITY_CFG[p].bg,n:tasks.filter(t=>(t.priority||"—")===p).length})).filter(x=>x.n>0);
                const priorityFilled=tasks.filter(t=>t.priority&&t.priority!=="—").length;
                return(
                  <div style={{display:"flex",alignItems:"stretch",borderTop:`1.5px solid ${P.border}`,background:"#fafafa",minWidth:"max-content",minHeight:38}}>
                    <div style={{width:COL_W.checkbox,flexShrink:0,position:"sticky",left:0,zIndex:10,background:"#fafafa",borderRight:`1px solid ${P.border}`}}/>
                    <div style={{width:COL_W.task,flexShrink:0,position:"sticky",left:COL_W.checkbox,zIndex:10,background:"#fafafa",borderRight:`1px solid ${P.border}`,boxShadow:"2px 0 4px rgba(0,0,0,0.04)",padding:"0 10px",display:"flex",alignItems:"center",gap:6}}>
                      <StatusBarWithTooltip statusCounts={statusCounts} total={total}/>
                      <span style={{fontSize:11,color:"#9aadbd",fontWeight:600,flexShrink:0}}>{doneCnt}/{total}</span>
                    </div>
                    {!hcSet.has('person')&&<div style={{width:COL_W.person,flexShrink:0,borderRight:`1px solid ${P.border}`}}/>}
                    {!hcSet.has('status')&&(<div style={{width:COL_W.status,flexShrink:0,borderRight:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 8px",gap:6}}><StatusBarWithTooltip statusCounts={statusCounts} total={total}/><span style={{fontSize:11,color:"#9aadbd",fontWeight:600,flexShrink:0}}>{doneCnt}/{total}</span></div>)}
                    {!hcSet.has('date')&&(<div style={{width:COL_W.date,flexShrink:0,borderRight:`1px solid ${P.border}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2px 8px"}}>{!earliestFmt?<span style={{fontSize:10,color:"#c5c9d6"}}>–</span>:sameDate?<><span style={{fontSize:13,color:"#323338",fontWeight:700,lineHeight:1.3}}>{latestFmt}</span><span style={{fontSize:10,color:"#9aadbd"}}>latest</span></>:<><div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:12,color:"#323338",fontWeight:700}}>{earliestFmt}</span><span style={{fontSize:10,color:"#c5c9d6"}}>–</span><span style={{fontSize:12,color:"#323338",fontWeight:700}}>{latestFmt}</span></div><div style={{display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:9,color:"#9aadbd"}}>earliest</span><span style={{fontSize:9,color:"#c5c9d6"}}>to</span><span style={{fontSize:9,color:"#9aadbd"}}>latest</span></div></>}</div>)}
                    {!hcSet.has('priority_col')&&(<div style={{width:COL_W.status,flexShrink:0,borderRight:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 8px",gap:6}}>
                      <div style={{display:"flex",height:10,borderRadius:4,overflow:"hidden",flex:1,gap:1}}>
                        {priorityCounts.map(({p,bg,n})=><div key={p} style={{flex:n,background:bg,minWidth:4}}/>)}
                        {(()=>{const nd=total-priorityCounts.reduce((a,x)=>a+x.n,0);return nd>0?<div style={{flex:nd,background:"#e2e8f0",minWidth:4}}/>:null;})()}
                      </div>
                      <span style={{fontSize:11,color:"#9aadbd",fontWeight:600,flexShrink:0}}>{priorityFilled}/{total}</span>
                    </div>)}
                    {visibleExtraCols.map(col=>{
                      if(col.type==="number"){const sum=tasks.reduce((a,t)=>a+Number((t.extraData||{})[col.id]||0),0);return(<div key={col.id} style={{width:extraColWidth(col.type),flexShrink:0,borderRight:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 6px"}}>{sum>0&&<span style={{fontSize:11,color:"#323338",fontWeight:600}}>{sum}</span>}</div>);}
                      if(col.type==="checkbox"){const chk=tasks.filter(t=>{const v=(t.extraData||{})[col.id];return v===true||v==="true"||v===1;}).length;return(<div key={col.id} style={{width:extraColWidth(col.type),flexShrink:0,borderRight:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 6px"}}><span style={{fontSize:11,color:"#9aadbd",fontWeight:600}}>{chk}/{total}</span></div>);}
                      if(col.type==="rating"){const rated=tasks.filter(t=>Number((t.extraData||{})[col.id])>0);const avg=rated.length?Math.round(rated.reduce((a,t)=>a+Number((t.extraData||{})[col.id]||0),0)/rated.length):0;return(<div key={col.id} style={{width:extraColWidth(col.type),flexShrink:0,borderRight:`1px solid ${P.border}`,display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>{avg>0&&<><span style={{fontSize:12,color:"#f59e0b"}}>{"★".repeat(avg)}</span><span style={{fontSize:10,color:"#9aadbd"}}>{rated.length}</span></>}</div>);}
                      return<div key={col.id} style={{width:extraColWidth(col.type),flexShrink:0,borderRight:`1px solid ${P.border}`}}/>;
                    })}
                    <div style={{width:COL_W.addcol,flexShrink:0,borderRight:`1px solid ${P.border}`}}/>
                    <div style={{width:COL_W.dots,flexShrink:0}}/>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DETAIL PANEL
══════════════════════════════════════════════════════════ */
function DetailPanel({ task, onClose, onField }) {
  const id=task._id||task.id; const sc=STATUS_CFG[task.status]||STATUS_CFG["Not Started"];
  const inp={width:"100%",border:`1.5px solid ${P.border}`,borderRadius:8,padding:"8px 11px",fontSize:13,fontFamily:"inherit",color:P.text,outline:"none",background:P.light,boxSizing:"border-box"};
  return(
    <div style={{width:340,flexShrink:0,background:"#fff",borderLeft:`1.5px solid ${P.border}`,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <div style={{background:P.light,borderBottom:`1.5px solid ${P.border}`,padding:"14px 16px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
          <div style={{flex:1,marginRight:8}}><div style={{fontSize:15,fontWeight:700,color:P.text,lineHeight:1.4,marginBottom:8}}>{task.title}</div><div style={{display:"flex",gap:7,flexWrap:"wrap"}}><div style={{background:sc.bg,color:sc.fg,borderRadius:4,padding:"3px 10px",fontSize:11,fontWeight:700}}>{task.status}</div>{task.date&&<span style={{fontSize:11,color:P.muted}}>📅 {fmt(task.date)}</span>}</div></div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:P.muted,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6}}>×</button>
        </div>
      </div>
      <div style={{flex:1,overflow:"auto",padding:16,display:"flex",flexDirection:"column",gap:13}}>
        {[{l:"Title",f:"title"},{l:"Assigned To",f:"assignTo"}].map(({l,f})=>(<div key={f}><div style={{fontSize:10,color:P.muted,fontWeight:700,letterSpacing:0.8,marginBottom:5,textTransform:"uppercase"}}>{l}</div><input key={task[f]} defaultValue={task[f]||""} onBlur={e=>{if(e.target.value.trim()!==String(task[f]||""))onField(id,f,e.target.value.trim());}} style={inp}/></div>))}
        <div><div style={{fontSize:10,color:P.muted,fontWeight:700,letterSpacing:0.8,marginBottom:5,textTransform:"uppercase"}}>Due Date</div><input type="date" key={task.date} defaultValue={task.date||""} onBlur={e=>onField(id,"date",e.target.value)} style={inp}/></div>
        <div><div style={{fontSize:10,color:P.muted,fontWeight:700,letterSpacing:0.8,marginBottom:5,textTransform:"uppercase"}}>Description</div><textarea key={task.description} defaultValue={task.description||""} placeholder="Add description…" onBlur={e=>onField(id,"description",e.target.value)} style={{...inp,resize:"vertical",minHeight:80}}/></div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PERSON FILTER PANEL
══════════════════════════════════════════════════════════ */
function PersonFilterPanel({ anchor, onClose, groups, filters, onToggle, onClear }) {
  const allTasks=groups.flatMap(g=>g.tasks||[]);
  const owners=[...new Set(allTasks.map(t=>t.assignTo).filter(v=>v&&v!=="Unassigned"&&v!==""))];
  const ref=useRef(); const [pos,setPos]=useState({top:0,left:0});
  useEffect(()=>{const calc=()=>{if(anchor?.current){const r=anchor.current.getBoundingClientRect();setPos({top:r.bottom+4,left:r.left});}};calc();window.addEventListener("scroll",calc,true);window.addEventListener("resize",calc);return()=>{window.removeEventListener("scroll",calc,true);window.removeEventListener("resize",calc);};},[anchor]);
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target)&&!anchor?.current?.contains(e.target))onClose();};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[anchor,onClose]);
  return(
    <div ref={ref} style={{position:"fixed",top:pos.top,left:pos.left,zIndex:9500,background:"#fff",border:"1px solid #dde1ea",borderRadius:12,boxShadow:"0 8px 40px rgba(0,0,0,0.14)",fontFamily:"inherit",width:240,padding:"8px 0"}}>
      <div style={{fontSize:11,fontWeight:700,color:"#9aadbd",letterSpacing:.7,textTransform:"uppercase",padding:"4px 14px 8px"}}>Filter by person</div>
      {owners.length===0&&<div style={{padding:"8px 14px",fontSize:12,color:P.muted}}>No people assigned yet</div>}
      {owners.map(o=>{const on=filters.owner.has(o);return(<div key={o} onClick={()=>onToggle("owner",o)} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 14px",cursor:"pointer",background:on?"#e8f4fd":"transparent"}} onMouseEnter={e=>{if(!on)e.currentTarget.style.background="#f5f6f8";}} onMouseLeave={e=>{e.currentTarget.style.background=on?"#e8f4fd":"transparent";}}><div style={{width:16,height:16,borderRadius:3,background:on?"#0073ea":"#fff",border:on?"none":"1.5px solid #c5c9d6",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700}}>{on?"✓":""}</div><div style={{width:26,height:26,borderRadius:"50%",background:getAvatarColor(o),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9,fontWeight:700,flexShrink:0}}>{o.slice(0,2).toUpperCase()}</div><span style={{fontSize:13,color:on?"#0073ea":"#323338",fontWeight:on?600:400,flex:1}}>{o}</span><span style={{fontSize:11,color:"#9aadbd"}}>{allTasks.filter(t=>t.assignTo===o).length}</span></div>);})}
      {filters.owner.size>0&&(<div onClick={onClear} style={{borderTop:"1px solid #eef0f4",padding:"8px 14px",cursor:"pointer",fontSize:12,color:"#e2445c",fontWeight:600}} onMouseEnter={e=>e.currentTarget.style.background="#fff5f5"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Clear person filter</div>)}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function TaskPage({ projects = [], employees = [] }) {
  const [groups,setGroups]=useState([]);
  const [loading,setLoading]=useState(true);
  const [toast,setToast]=useState(null);
  const [search,setSearch]=useState("");
  const [sort,setSort]=useState(null);
  const [groupBy,setGroupBy]=useState("default");
  const [filters,setFilters]=useState({owner:new Set(),status:new Set()});
  const [selected,setSelected]=useState(null);
  const [sidekick,setSidekick]=useState(false);
  const [showIntegrate,setShowIntegrate]=useState(false);
  const [showShare,setShowShare]=useState(false);
  const [showAutomate,setShowAutomate]=useState(false);
  const [extraCols,setExtraCols]=useState([]);
  const [showAddCol,setShowAddCol]=useState(false);
  const [showImport,setShowImport]=useState(false);
  const [hiddenCols,setHiddenCols]=useState(new Set());

  /* ── VIEW STATE ── */
  const [currentView,setCurrentView]=useState("table");
  const [viewOpen,setViewOpen]=useState(false);
  const mainTableRef=useRef();

  const addViewRef=useRef(); const [addViewOpen,setAddViewOpen]=useState(false);
  const [tabDotsOpen,setTabDotsOpen]=useState(false); const tabDotsRef=useRef();
  const [updatePanel,setUpdatePanel]=useState(null);
  const [hideOpen,setHideOpen]=useState(false); const hideRef=useRef();

  const personRef=useRef(); const filterRef=useRef();
  const sortRef=useRef(); const grpByRef=useRef(); const moreRef=useRef();
  const [personOpen,setPersonOpen]=useState(false); const [filterOpen,setFilterOpen]=useState(false);
  const [sortOpen,setSortOpen]=useState(false); const [grpByOpen,setGrpByOpen]=useState(false); const [moreOpen,setMoreOpen]=useState(false);

  const addGroupTrigger=useRef({trigger:()=>{}});

  const closeAll=()=>{setPersonOpen(false);setFilterOpen(false);setSortOpen(false);setGrpByOpen(false);setMoreOpen(false);setHideOpen(false);setViewOpen(false);setTabDotsOpen(false);setAddViewOpen(false);};

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),2800);};

  const load=useCallback(async()=>{
    try{setLoading(true);const r=await axios.get(`${API}/tasks/board`);setGroups(r.data.map(g=>({...g,open:g.open!==false})));}
    catch{showToast("Failed to load board","error");}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);

  const toggleGroup=async(gid)=>{const g=groups.find(x=>(x._id||x.id)===gid);const nv=!g?.open;setGroups(p=>p.map(x=>(x._id||x.id)===gid?{...x,open:nv}:x));try{await axios.put(`${API}/groups/${gid}`,{open:nv});}catch{}};

  const addTask=async(groupId,title)=>{
    const tmp={_id:"tmp_"+Date.now(),title,assignTo:"",status:"Not Started",priority:"—",date:"",checked:false,groupId,createdAt:new Date().toISOString()};
    setGroups(p=>p.map(g=>(g._id||g.id)===groupId?{...g,tasks:[...(g.tasks||[]),tmp]}:g));
    try{const r=await axios.post(`${API}/tasks`,{title,assignTo:"Unassigned",groupId,status:"Not Started"});setGroups(p=>p.map(g=>(g._id||g.id)===groupId?{...g,tasks:(g.tasks||[]).map(t=>(t._id||t.id)===tmp._id?r.data:t)}:g));}
    catch{setGroups(p=>p.map(g=>(g._id||g.id)===groupId?{...g,tasks:(g.tasks||[]).filter(t=>(t._id||t.id)!==tmp._id)}:g));showToast("Failed to add task","error");}
  };

  const addNewTask=async()=>{const first=groups[0];if(!first)return;await addTask(first._id||first.id,"New task");};

  const toggleCheck=async(id)=>{const task=groups.flatMap(g=>g.tasks||[]).find(t=>(t._id||t.id)===id);if(!task)return;const nv=!task.checked;setGroups(p=>p.map(g=>({...g,tasks:(g.tasks||[]).map(t=>(t._id||t.id)===id?{...t,checked:nv}:t)})));if(selected&&(selected._id||selected.id)===id)setSelected(p=>({...p,checked:nv}));try{await axios.patch(`${API}/tasks/${id}/toggle`);}catch{}};

  const updateField=async(id,field,value)=>{if(!id||String(id).startsWith("tmp_"))return;setGroups(p=>p.map(g=>({...g,tasks:(g.tasks||[]).map(t=>(t._id||t.id)===id?{...t,[field]:value}:t)})));if(selected&&(selected._id||selected.id)===id)setSelected(p=>({...p,[field]:value}));try{await axios.put(`${API}/tasks/${id}`,{[field]:value});}catch{showToast("Failed to save","error");}};

  const setStatus=(id,s)=>updateField(id,"status",s);
  const setPriority=(id,v)=>updateField(id,"priority",v);
  const dupTask=async(task)=>addTask(task.groupId,task.title+" (copy)");

  const delTask=async(id)=>{const snap=groups;setGroups(p=>p.map(g=>({...g,tasks:(g.tasks||[]).filter(t=>(t._id||t.id)!==id)})));if(selected&&(selected._id||selected.id)===id)setSelected(null);try{await axios.delete(`${API}/tasks/${id}`);}catch{setGroups(snap);showToast("Failed to delete","error");}};

  const addGroup=async(label)=>{const color=GRP_COLORS[groups.length%GRP_COLORS.length];try{const r=await axios.post(`${API}/groups`,{label,color});setGroups(p=>[...p,{...r.data,tasks:[],open:true}]);}catch{showToast("Failed to create group","error");}};

  const importTasks=async(tasks)=>{const first=groups[0];if(!first){showToast("Add a group first","error");return;}const gid=first._id||first.id;for(const t of tasks)await addTask(gid,t.title||"Imported task");showToast(`${tasks.length} tasks imported!`);};

  const delGroup=async(id)=>{const snap=groups;setGroups(p=>p.filter(g=>(g._id||g.id)!==id));try{await axios.delete(`${API}/groups/${id}`);showToast("Group deleted");}catch{setGroups(snap);showToast("Failed","error");}};

  /* Kanban drag drop */
  const kanbanStatusChange=(taskId,newStatus)=>{setGroups(p=>p.map(g=>({...g,tasks:(g.tasks||[]).map(t=>(t._id||t.id)===taskId?{...t,status:newStatus}:t)})));showToast(`Moved to ${newStatus}`);};

  const toggleHideCol=(id)=>setHiddenCols(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const addExtraCol=(ct)=>setExtraCols(p=>[...p,{id:"col_"+Date.now(),type:ct.type,label:ct.label}]);
  const renameExtraCol=(id,label)=>setExtraCols(p=>p.map(c=>c.id===id?{...c,label}:c));
  const moveExtraCol=(id,dir)=>setExtraCols(p=>{const arr=[...p];const idx=arr.findIndex(c=>c.id===id);if(idx<0)return arr;const si=dir==="left"?idx-1:idx+1;if(si<0||si>=arr.length)return arr;[arr[idx],arr[si]]=[arr[si],arr[idx]];return arr;});
  const deleteExtraCol=(id)=>setExtraCols(p=>p.filter(c=>c.id!==id));
  const updateExtraField=(taskId,colId,val)=>setGroups(p=>p.map(g=>({...g,tasks:(g.tasks||[]).map(t=>(t._id||t.id)===taskId?{...t,extraData:{...(t.extraData||{}),[colId]:val}}:t)})));

  const toggleFilter=(type,val)=>setFilters(p=>{const n={...p,[type]:new Set(p[type])};n[type].has(val)?n[type].delete(val):n[type].add(val);return n;});
  const clearFilters=()=>setFilters({owner:new Set(),status:new Set()});

  const sortFn=tasks=>{if(!sort)return tasks;return[...tasks].sort((a,b)=>{if(sort==="name-asc")return(a.title||"").localeCompare(b.title||"");if(sort==="name-desc")return(b.title||"").localeCompare(a.title||"");if(sort==="date-asc")return(a.date||"").localeCompare(b.date||"");if(sort==="date-desc")return(b.date||"").localeCompare(a.date||"");if(sort==="status")return STATUS_LIST.indexOf(a.status)-STATUS_LIST.indexOf(b.status);return 0;});};

  const filteredGroups=groups.map(g=>({...g,tasks:sortFn((g.tasks||[]).filter(t=>{if(filters.owner.size>0&&!filters.owner.has(t.assignTo||""))return false;if(filters.status.size>0&&!filters.status.has(t.status))return false;if(search&&!t.title?.toLowerCase().includes(search.toLowerCase()))return false;return true;}))}));

  let displayGroups;
  if(groupBy==="default"){displayGroups=filteredGroups.map(g=>({...g,isVirtual:false}));}
  else{const all=filteredGroups.flatMap(g=>g.tasks||[]);if(groupBy==="status"){displayGroups=STATUS_LIST.map(s=>({_id:"v"+s,label:s,color:STATUS_CFG[s].bg,open:true,isVirtual:true,tasks:all.filter(t=>t.status===s)})).filter(g=>g.tasks.length>0);}else{const today=new Date();today.setHours(0,0,0,0);const nw=new Date(today);nw.setDate(nw.getDate()+7);displayGroups=[{_id:"vov",label:"Overdue",color:"#e2445c",open:true,isVirtual:true,tasks:all.filter(t=>{const d=new Date(t.date);return!isNaN(d)&&d<today&&t.status!=="Done";})},{_id:"vto",label:"Today",color:"#fdab3d",open:true,isVirtual:true,tasks:all.filter(t=>{const d=new Date(t.date);d.setHours(0,0,0,0);return!isNaN(d)&&d.getTime()===today.getTime();})},{_id:"vwk",label:"This Week",color:P.accent,open:true,isVirtual:true,tasks:all.filter(t=>{const d=new Date(t.date);return!isNaN(d)&&d>today&&d<nw;})},{_id:"vla",label:"Later",color:P.mid,open:true,isVirtual:true,tasks:all.filter(t=>{const d=new Date(t.date);return!isNaN(d)&&d>=nw;})},{_id:"vnd",label:"No date",color:"#c4b5fd",open:true,isVirtual:true,tasks:all.filter(t=>!t.date||isNaN(new Date(t.date)))}].filter(g=>g.tasks.length>0);}}

  const allTasks=groups.flatMap(g=>g.tasks||[]);
  const doneCnt=allTasks.filter(t=>t.status==="Done").length;
  const activeView=VIEW_LIST.find(v=>v.id===currentView)||VIEW_LIST[0];

  return(
    <div style={{minHeight:"100vh",background:P.light,fontFamily:"'Plus Jakarta Sans','Segoe UI',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ddIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box}
        .trow:hover .openBtn{opacity:1!important}
        .add-task-row:hover .add-task-icons{opacity:1!important}
        .col-hdr-wrap:hover .col-move-btn{opacity:1!important}
        .col-hdr-wrap:hover .col-menu-btn{opacity:1!important}
        .col-hdr:hover .col-menu-btn{opacity:1!important}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:#d8b4fe;border-radius:3px}
        ::-webkit-scrollbar-track{background:${P.light}}
        button,input,select,textarea{font-family:inherit}
        input[type=date]::-webkit-calendar-picker-indicator{opacity:.4;cursor:pointer;filter:invert(40%) sepia(80%) saturate(500%) hue-rotate(250deg)}
      `}</style>

      {/* STICKY HEADER */}
      <div style={{position:"sticky",top:0,zIndex:500,background:"#fff"}}>

        {/* TOP HEADER */}
        <div style={{background:"#fff",borderBottom:`1px solid ${P.border}`,padding:"8px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 1px 4px rgba(124,58,237,0.05)",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22,fontWeight:800,color:P.text,letterSpacing:-0.5}}>Task</span>
            <span style={{fontSize:13,color:P.muted}}>▾</span>
            <div style={{display:"flex",alignItems:"center",gap:0,marginLeft:8}}>

              {/* ── VIEW SWITCHER BUTTON ── */}
              <div ref={mainTableRef} onClick={()=>{closeAll();setViewOpen(v=>!v);}}
                style={{display:"flex",alignItems:"center",gap:0,cursor:"pointer",border:`1px solid ${viewOpen?P.accent:P.border}`,borderRadius:8,overflow:"hidden",background:viewOpen?P.light:"#fff"}}>
                <div style={{display:"flex",alignItems:"center",gap:7,padding:"6px 12px",fontSize:13,fontWeight:700,color:viewOpen?P.accent:P.text}}>
                  <span>{activeView.icon}</span><span>{activeView.label}</span>
                </div>
                <div style={{padding:"6px 8px",borderLeft:`1px solid ${P.border}`,fontSize:11,color:viewOpen?P.accent:P.muted}}>▾</div>
              </div>
              {viewOpen&&(
                <ViewSwitcherDropdown
                  anchor={mainTableRef}
                  currentView={currentView}
                  onSelect={v=>{setCurrentView(v);setViewOpen(false);}}
                  onClose={()=>setViewOpen(false)}
                />
              )}

              <div ref={tabDotsRef} onClick={()=>{closeAll();setTabDotsOpen(v=>!v);}}
                style={{padding:"5px 8px",fontSize:14,color:tabDotsOpen?"#0073ea":P.muted,cursor:"pointer",marginLeft:2,borderRadius:7,background:tabDotsOpen?"#e8f4fd":"transparent",border:`1px solid ${tabDotsOpen?"#c3d9f0":"transparent"}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>···</div>
              {tabDotsOpen&&<TabDotsMenu anchor={tabDotsRef} onClose={()=>setTabDotsOpen(false)} showToast={showToast}/>}

              <div ref={addViewRef} onClick={()=>{closeAll();setAddViewOpen(v=>!v);}}
                style={{width:30,height:30,borderRadius:7,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:400,background:addViewOpen?"#e8f4fd":"transparent",border:`1px solid ${addViewOpen?"#c3d9f0":"transparent"}`,color:addViewOpen?"#0073ea":P.muted}}>+</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>{setSidekick(v=>!v);setSelected(null);}} style={{display:"flex",alignItems:"center",gap:6,background:sidekick?`linear-gradient(135deg,${P.dark},${P.mid})`:"transparent",border:`1.5px solid ${sidekick?P.mid:P.border}`,borderRadius:8,padding:"6px 13px",fontSize:12,fontWeight:700,color:sidekick?"#fff":P.mid,cursor:"pointer"}}><span>✨</span> Sidekick</button>
            <button onClick={()=>setShowIntegrate(true)} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:`1.5px solid ${P.border}`,borderRadius:8,padding:"6px 13px",fontSize:12,fontWeight:600,color:P.mid,cursor:"pointer"}}><span>🔗</span> Integrate</button>
            <button onClick={()=>setShowAutomate(true)} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:`1.5px solid ${P.border}`,borderRadius:8,padding:"6px 13px",fontSize:12,fontWeight:600,color:P.mid,cursor:"pointer"}}><span>⚙️</span> Automate</button>
            <button onClick={()=>setShowShare(true)} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:`1.5px solid ${P.border}`,borderRadius:8,padding:"6px 13px",fontSize:12,fontWeight:600,color:P.mid,cursor:"pointer"}}>Share</button>
            {!loading&&allTasks.length>0&&(<div style={{display:"flex",alignItems:"center",gap:7,paddingLeft:6,borderLeft:`1px solid ${P.border}`}}><div style={{width:60,height:5,borderRadius:3,background:P.border,overflow:"hidden"}}><div style={{width:`${Math.round(doneCnt/allTasks.length*100)}%`,height:"100%",background:`linear-gradient(90deg,${P.accent},#c084fc)`,borderRadius:3}}/></div><span style={{fontSize:11,color:P.muted,fontWeight:600}}>{doneCnt}/{allTasks.length}</span></div>)}
          </div>
        </div>

        {/* TOOLBAR — only for table view */}
        {currentView==="table"&&(
          <div style={{background:"#fff",borderBottom:`1.5px solid ${P.border}`,padding:"6px 18px",display:"flex",alignItems:"center",gap:4,flexShrink:0,zIndex:100,boxShadow:"0 2px 8px rgba(124,58,237,0.06)"}}>
            <NewTaskBtn onAddTask={addNewTask} onTriggerGroup={()=>addGroupTrigger.current?.trigger()} showToast={showToast} onImport={()=>setShowImport(true)} groups={groups} onAddTaskToGroup={addTask} setGroups={setGroups}/>
            <div style={{width:1,height:22,background:P.border,margin:"0 4px",flexShrink:0}}/>
            <div style={{position:"relative",flexShrink:0}}>
              <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:13,pointerEvents:"none",color:P.muted}}>🔍</span>
              <input placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)}
                style={{border:`1.5px solid ${search?P.accent:P.border}`,borderRadius:8,padding:"5px 10px 5px 28px",fontSize:13,color:P.text,outline:"none",width:search?160:100,background:search?"#fff":P.light,transition:"all .2s",fontFamily:"inherit"}}
                onFocus={e=>{e.target.style.borderColor=P.accent;e.target.style.background="#fff";e.target.style.width="160px";}}
                onBlur={e=>{if(!search){e.target.style.borderColor=P.border;e.target.style.background=P.light;e.target.style.width="100px";}}}/>
            </div>
            <TB ref={personRef} icon="👤" label="Person" active={filters.owner.size>0} badge={filters.owner.size>0?filters.owner.size:null} onClick={()=>{closeAll();setPersonOpen(v=>!v);}}/>
            {personOpen&&<PersonFilterPanel anchor={personRef} onClose={()=>setPersonOpen(false)} groups={groups} filters={filters} onToggle={toggleFilter} onClear={()=>setFilters(p=>({...p,owner:new Set()}))}/>}
            <TB ref={filterRef} icon="▽" label="Filter" active={filters.status.size>0} badge={filters.status.size>0?filters.status.size:null} onClick={()=>{closeAll();setFilterOpen(v=>!v);}}/>
            {filterOpen&&<FilterMenu anchor={filterRef} groups={groups} filters={filters} onToggle={toggleFilter} onClear={clearFilters} onClose={()=>setFilterOpen(false)}/>}
            <TB ref={sortRef} icon="↕" label="Sort" active={!!sort} onClick={()=>{closeAll();setSortOpen(v=>!v);}}/>
            {sortOpen&&<SortMenu anchor={sortRef} sort={sort} onSort={setSort} onClose={()=>setSortOpen(false)}/>}
            <TB ref={hideRef} icon="👁" label="Hide" active={hiddenCols.size>0} badge={hiddenCols.size>0?hiddenCols.size:null} onClick={()=>{closeAll();setHideOpen(v=>!v);}}/>
            {hideOpen&&<HideMenu anchor={hideRef} onClose={()=>setHideOpen(false)} extraCols={extraCols} hiddenCols={hiddenCols} onToggleHide={toggleHideCol}/>}
            <TB ref={grpByRef} icon="⊟" label="Group by" active={groupBy!=="default"} onClick={()=>{closeAll();setGrpByOpen(v=>!v);}}/>
            {grpByOpen&&<GrpByMenu anchor={grpByRef} groupBy={groupBy} onGroupBy={setGroupBy} onClose={()=>setGrpByOpen(false)}/>}
            <TB ref={moreRef} icon="···" onClick={()=>{closeAll();setMoreOpen(v=>!v);}}/>
            {moreOpen&&(<DD anchor={moreRef} onClose={()=>setMoreOpen(false)} w={200}>
              <MI icon="📥" title="Import" sub="CSV or Excel" onClick={()=>{setShowImport(true);setMoreOpen(false);}}/>
              <MI icon="📤" title="Export" sub="Download as CSV" onClick={()=>{
                const allT=groups.flatMap(g=>(g.tasks||[]).map(t=>({...t,groupName:g.label})));
                const headers=["Task","Group","Owner","Status","Due Date","Priority"];
                const rows=allT.map(t=>[`"${(t.title||'').replace(/"/g,'""')}"`,`"${(t.groupName||'').replace(/"/g,'""')}"`,`"${(t.assignTo||'')}"`,"\""+t.status+"\"",`"${t.date||''}"`,`"${t.priority||''}"`].join(","));
                const csv=[headers.join(","),...rows].join("\n");
                const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
                const url=URL.createObjectURL(blob);
                const a=document.createElement("a");a.href=url;a.download="tasks.csv";a.click();URL.revokeObjectURL(url);
                showToast("CSV exported!");setMoreOpen(false);
              }}/>
            </DD>)}
          </div>
        )}
      </div>

      {/* ══ CONTENT AREA ══ */}
      <div style={{display:"flex"}}>
        <div style={{flex:1,minWidth:0}}>

          {/* TABLE VIEW */}
          {currentView==="table"&&(
            loading?(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:80,gap:16}}>
                <div style={{width:34,height:34,border:`3px solid ${P.border}`,borderTop:`3px solid ${P.accent}`,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
                <div style={{fontSize:13,color:P.muted,fontWeight:500}}>Loading board...</div>
              </div>
            ):(
              <div style={{padding:"16px 18px"}}>
                {displayGroups.length===0&&(<div style={{textAlign:"center",padding:60}}><div style={{fontSize:44,marginBottom:10}}>📋</div><div style={{fontSize:15,fontWeight:700,color:P.text,marginBottom:5}}>No tasks found</div><div style={{fontSize:13,color:P.muted}}>Clear filters or add a new task</div></div>)}
                {displayGroups.map(g=>(
                  <GroupBlock key={g._id||g.id} group={g} isVirtual={!!g.isVirtual}
                    onToggle={toggleGroup} onCheck={toggleCheck}
                    onField={updateField} onStatus={setStatus} onPriority={setPriority}
                    onAddTask={addTask} onDup={dupTask} onDel={delTask}
                    onOpen={t=>{setUpdatePanel(p=>(p?._id||p?.id)===(t._id||t.id)?null:t);setSelected(null);setSidekick(false);}}
                    selectedId={selected?._id||selected?.id}
                    onDelGroup={delGroup} employees={employees}
                    showToast={showToast} extraCols={extraCols}
                    onExtraField={updateExtraField} onAddCol={()=>setShowAddCol(true)}
                    onRenameCol={renameExtraCol} onDeleteCol={deleteExtraCol}
                    hiddenCols={hiddenCols} onMoveCol={moveExtraCol}/>
                ))}
                {groupBy==="default"&&<AddGroupRow onAdd={addGroup} triggerRef={addGroupTrigger}/>}
              </div>
            )
          )}

          {/* CHART VIEW */}
          {currentView==="chart"&&<ChartView groups={filteredGroups}/>}

          {/* GANTT VIEW */}
          {currentView==="gantt"&&<GanttView groups={filteredGroups}/>}

          {/* CALENDAR VIEW */}
          {currentView==="calendar"&&<CalendarView groups={filteredGroups}/>}

          {/* KANBAN VIEW */}
          {currentView==="kanban"&&<KanbanView groups={filteredGroups} onStatusChange={kanbanStatusChange}/>}

        </div>

        {selected&&!sidekick&&!updatePanel&&<DetailPanel task={selected} onClose={()=>setSelected(null)} onField={updateField}/>}
        {sidekick&&!updatePanel&&<SidekickPanel onClose={()=>setSidekick(false)} groups={groups}/>}
        {updatePanel&&<TaskUpdatePanel task={updatePanel} onClose={()=>setUpdatePanel(null)} onField={updateField}/>}
      </div>

      {showAddCol&&<AddColumnModal onAdd={addExtraCol} onClose={()=>setShowAddCol(false)}/>}
      {showImport&&<ImportModal onClose={()=>setShowImport(false)} onImportTasks={importTasks}/>}
      {showShare&&<ShareModal onClose={()=>setShowShare(false)}/>}
      {showIntegrate&&<IntegrateModal onClose={()=>setShowIntegrate(false)}/>}
      {showAutomate&&<AutomateModal onClose={()=>setShowAutomate(false)}/>}
      {toast&&<Toast msg={toast.msg} type={toast.type}/>}
    </div>
  );
}
