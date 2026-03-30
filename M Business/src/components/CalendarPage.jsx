import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:m-business-tau.vercel.app/api/events";
const T = { text:"#1e0a3c", muted:"#7c3aed", border:"#ede9fe" };
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FULL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const TYPES  = ["Meeting","Call","Review","Planning","Handover","Other"];
const TC = { Meeting:"#9333ea", Call:"#7c3aed", Review:"#22C55E", Planning:"#f59e0b", Handover:"#a855f7", Other:"#6b7280" };
const EMPTY = { name:"", project:"", client:"", date:"", start:"", end:"", notes:"", type:"Meeting" };

export default function CalendarPage({ projects=[], clients=[] }) {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("All");
  const [modal,   setModal]   = useState(null);
  const [editId,  setEditId]  = useState(null);
  const [form,    setForm]    = useState(EMPTY);
  const [err,     setErr]     = useState({});
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState("");

  const now = new Date();
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const today = new Date().toISOString().slice(0,10);

  useEffect(() => { load(); }, []);

  const showToast = (m) => { setToast(m); setTimeout(()=>setToast(""), 2800); };

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get(API);
      setEvents(Array.isArray(r.data) ? r.data : []);
    } catch {
      setEvents([]);
    }
    setLoading(false);
  };

  const openAdd = (dateStr) => {
    setForm({ ...EMPTY, date: dateStr || "" });
    setErr({}); setEditId(null); setModal("add");
  };

  const openEdit = (ev) => {
    setForm({
      name:    ev.name||"",
      project: ev.project||"",
      client:  ev.client||"",
      date:    ev.date||"",
      start:   ev.start||"",
      end:     ev.end||"",
      notes:   ev.notes||"",
      type:    ev.type||"Meeting"
    });
    setEditId(ev._id||ev.id);
    setErr({});
    setModal("edit");
  };

  const save = async () => {
    const e = {};
    if (!form.name.trim()) e.name = "Event name required";
    if (!form.date)        e.date = "Date required";
    if (Object.keys(e).length) { setErr(e); return; }
    setSaving(true);
    try {
      if (modal === "add") {
        const r = await axios.post(API, form);
        setEvents(p => [r.data, ...p]);
        showToast("✅ Event added!");
      } else {
        const r = await axios.put(`${API}/${editId}`, form);
        setEvents(p => p.map(x => (x._id||x.id)===editId ? r.data : x));
        showToast("✅ Event updated!");
      }
      setModal(null);
    } catch {
      if (modal === "add") {
        setEvents(p => [{ ...form, _id: Date.now().toString() }, ...p]);
        showToast("✅ Saved locally!");
      } else {
        setEvents(p => p.map(x => (x._id||x.id)===editId ? {...x,...form} : x));
        showToast("✅ Updated locally!");
      }
      setModal(null);
    }
    setSaving(false);
  };

  const del = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try { await axios.delete(`${API}/${id}`); } catch {}
    setEvents(p => p.filter(x => (x._id||x.id) !== id));
    showToast("🗑️ Deleted!");
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
    setSelectedDate(null);
  };

  const getCalendarDays = () => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrev  = new Date(calYear, calMonth, 0).getDate();
    const cells = [];
    for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, curr: false });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, curr: true });
    while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - firstDay + 1, curr: false });
    return cells;
  };

  const dateStr = (d) =>
    `${calYear}-${String(calMonth + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  const eventsOnDay = (d) => events.filter(e => e.date === dateStr(d));

  const f = (x) => {
    const q = search.toLowerCase();
    const ms = !q ||
      (x.name||"").toLowerCase().includes(q) ||
      (x.project||"").toLowerCase().includes(q) ||
      (x.client||"").toLowerCase().includes(q);
    let mf = true;
    if (selectedDate) {
      mf = x.date === selectedDate;
    } else {
      mf =
        filter==="All"      ? true :
        filter==="Today"    ? x.date===today :
        filter==="Upcoming" ? x.date>today :
        filter==="Past"     ? x.date<today :
        (x.type||"Meeting")===filter;
    }
    return ms && mf;
  };

  const shown = [...events].filter(f).sort((a,b) => (a.date||"") < (b.date||"") ? -1 : 1);

  const stats = [
    { t:"Total",    v:events.length,                           c:"#9333ea", i:"📅" },
    { t:"Today",    v:events.filter(x=>x.date===today).length, c:"#7c3aed", i:"📌" },
    { t:"Upcoming", v:events.filter(x=>x.date>today).length,   c:"#f59e0b", i:"⏰" },
    { t:"Past",     v:events.filter(x=>x.date<today).length,   c:"#22C55E", i:"✅" },
  ];

  const pNames = projects.map(p=>p.name||"");
  const cNames = clients.map(c=>c.clientName||c.name||"");

  const Btn = {
    background:"linear-gradient(135deg,#9333ea,#7c3aed)", color:"#fff",
    border:"none", borderRadius:10, padding:"9px 18px",
    fontWeight:700, fontSize:13, cursor:"pointer", whiteSpace:"nowrap"
  };

  const inp = (hasErr) => ({
    width:"100%", border:`1.5px solid ${hasErr?"#ef4444":"#ede9fe"}`,
    borderRadius:10, padding:"10px 14px", fontSize:13,
    color:T.text, background:"#faf5ff", outline:"none",
    fontFamily:"inherit", boxSizing:"border-box"
  });

  const calendarDays = getCalendarDays();

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999,
          background:"#fff", border:"1.5px solid #22c55e", borderRadius:12,
          padding:"12px 20px", fontSize:13, fontWeight:700, color:"#22c55e",
          boxShadow:"0 8px 24px rgba(0,0,0,0.12)" }}>{toast}</div>
      )}

      {/* Stats Row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {stats.map(({t,v,c,i}) => (
          <div key={t} style={{ background:"#fff", borderRadius:14, padding:"16px 14px",
            boxShadow:"0 4px 18px rgba(147,51,234,0.07)", border:"1px solid #ede9fe" }}>
            <div style={{ width:38, height:38, borderRadius:10, background:`${c}18`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:18, marginBottom:8 }}>{i}</div>
            <div style={{ fontSize:10, color:"#a78bfa", fontWeight:700,
              letterSpacing:0.5, marginBottom:3 }}>{t.toUpperCase()}</div>
            <div style={{ fontSize:26, fontWeight:800, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* ── MAIN SPLIT LAYOUT ─────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"420px 1fr", gap:16, alignItems:"start" }}>

        {/* ── LEFT: CALENDAR ──────────────────────────────────────── */}
        <div style={{ background:"#fff", borderRadius:16, padding:20,
          boxShadow:"0 4px 24px rgba(147,51,234,0.08)", border:"1px solid #ede9fe",
          position:"sticky", top:16 }}>

          {/* Month navigation */}
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:14 }}>
            <button onClick={prevMonth} style={{ background:"#f5f3ff",
              border:"1px solid #ede9fe", borderRadius:8, width:32, height:32,
              cursor:"pointer", fontSize:15, color:"#7c3aed", fontWeight:700 }}>‹</button>

            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:15, fontWeight:800, color:T.text }}>
                {FULL_MONTHS[calMonth]} {calYear}
              </div>
              {selectedDate && (
                <div style={{ fontSize:10, color:"#a78bfa", marginTop:2 }}>
                  {selectedDate}
                  <span onClick={() => setSelectedDate(null)}
                    style={{ marginLeft:6, cursor:"pointer", color:"#9333ea",
                      textDecoration:"underline" }}>✕ Clear</span>
                </div>
              )}
            </div>

            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <button onClick={() => { setCalYear(now.getFullYear()); setCalMonth(now.getMonth()); setSelectedDate(null); }}
                style={{ background:"#f5f3ff", border:"1px solid #ede9fe",
                  borderRadius:8, padding:"4px 10px", cursor:"pointer",
                  fontSize:10, color:"#7c3aed", fontWeight:700 }}>Today</button>
              <button onClick={nextMonth} style={{ background:"#f5f3ff",
                border:"1px solid #ede9fe", borderRadius:8, width:32, height:32,
                cursor:"pointer", fontSize:15, color:"#7c3aed", fontWeight:700 }}>›</button>
            </div>
          </div>

          {/* Day headers */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign:"center", fontSize:9, fontWeight:700,
                color:"#a78bfa", letterSpacing:0.5, padding:"3px 0" }}>
                {d.toUpperCase()}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
            {calendarDays.map((cell, idx) => {
              const ds = cell.curr ? dateStr(cell.day) : null;
              const dayEvents = cell.curr ? eventsOnDay(cell.day) : [];
              const isToday   = ds === today;
              const isSelected = ds === selectedDate;

              return (
                <div key={idx}
                  onClick={() => {
                    if (!cell.curr) return;
                    setSelectedDate(prev => prev === ds ? null : ds);
                    setFilter("All");
                    setSearch("");
                  }}
                  style={{
                    minHeight:52,
                    borderRadius:9,
                    padding:"5px 4px 4px",
                    cursor: cell.curr ? "pointer" : "default",
                    background: isSelected ? "#f3e8ff" : isToday ? "#faf5ff" : cell.curr ? "#fff" : "#fafafa",
                    border: isSelected ? "2px solid #9333ea" : isToday ? "1.5px solid #c4b5fd" : "1px solid #f0edff",
                    opacity: cell.curr ? 1 : 0.4,
                    transition:"all 0.15s",
                    position:"relative",
                    boxSizing:"border-box",
                  }}>

                  <div style={{
                    width:22, height:22, borderRadius:"50%",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:11, fontWeight: isToday || isSelected ? 800 : 600,
                    color: isSelected ? "#7c3aed" : isToday ? "#9333ea" : cell.curr ? T.text : "#c4b5fd",
                    background: isToday && !isSelected ? "#ede9fe" : "transparent",
                    marginBottom:3,
                  }}>{cell.day}</div>

                  {dayEvents.length > 0 && (
                    <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
                      {dayEvents.slice(0,2).map((ev, ei) => (
                        <div key={ei} style={{
                          background:`${TC[ev.type||"Meeting"]}22`,
                          borderRadius:3, padding:"1px 3px",
                          fontSize:8, color:TC[ev.type||"Meeting"],
                          fontWeight:700, overflow:"hidden",
                          whiteSpace:"nowrap", textOverflow:"ellipsis",
                        }}>{ev.name}</div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div style={{ fontSize:8, color:"#a78bfa", fontWeight:600,
                          paddingLeft:2 }}>+{dayEvents.length - 2}</div>
                      )}
                    </div>
                  )}

                  {/* Quick add on hover */}
                  {cell.curr && (
                    <div
                      onClick={e => { e.stopPropagation(); openAdd(ds); }}
                      title="Add event"
                      style={{
                        position:"absolute", top:3, right:3,
                        width:14, height:14, borderRadius:"50%",
                        background:"#ede9fe", color:"#7c3aed",
                        fontSize:11, fontWeight:800,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        cursor:"pointer", opacity:0, transition:"opacity 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity="1"}
                      onMouseLeave={e => e.currentTarget.style.opacity="0"}
                    >+</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display:"flex", gap:10, marginTop:12, flexWrap:"wrap" }}>
            {Object.entries(TC).map(([type, color]) => (
              <div key={type} style={{ display:"flex", alignItems:"center", gap:4,
                fontSize:9, color:"#a78bfa", fontWeight:600 }}>
                <div style={{ width:7, height:7, borderRadius:2, background:color }} />
                {type}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: EVENT LIST ───────────────────────────────────── */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* ── EVENT LIST ───────────────────────────────────────── */}
          <div style={{ background:"#fff", borderRadius:16, padding:20,
            boxShadow:"0 4px 24px rgba(147,51,234,0.08)", border:"1px solid #ede9fe" }}>

            {/* Toolbar */}
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", flexWrap:"wrap", gap:8, marginBottom:14 }}>
              <h3 style={{ margin:0, fontSize:14, fontWeight:800, color:T.text }}>
                {selectedDate
                  ? `📅 Events on ${selectedDate} (${shown.length})`
                  : `📅 All Events (${shown.length})`}
              </h3>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:12 }}>🔍</span>
                  <input placeholder="Search…" value={search}
                    onChange={e=>{ setSearch(e.target.value); setSelectedDate(null); }}
                    style={{ ...inp(false), paddingLeft:30, width:150, padding:"7px 10px 7px 30px" }} />
                </div>
                <button onClick={() => openAdd(selectedDate||"")} style={Btn}>
                  + Add Event
                </button>
              </div>
            </div>

            {/* Filter chips */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
              {["All","Today","Upcoming","Past",...TYPES].map((fil,fi) => (
                <button key={`filter-${fi}`}
                  onClick={() => { setFilter(fil); setSelectedDate(null); }}
                  style={{
                    padding:"5px 10px", borderRadius:7, fontSize:10, fontWeight:700,
                    cursor:"pointer", border:"1.5px solid",
                    borderColor: !selectedDate && filter===fil ? "#9333ea" : "#ede9fe",
                    background:  !selectedDate && filter===fil ? "#f3e8ff"  : "#fff",
                    color:       !selectedDate && filter===fil ? "#9333ea"  : "#a78bfa"
                  }}>{fil}</button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign:"center", padding:40, color:"#a78bfa" }}>
                <div style={{ fontSize:28, marginBottom:8 }}>⏳</div>
                <div style={{ fontWeight:600, fontSize:13 }}>Loading events...</div>
              </div>
            ) : shown.length === 0 ? (
              <div style={{ textAlign:"center", padding:40 }}>
                <div style={{ fontSize:40, marginBottom:10 }}>📅</div>
                <div style={{ fontSize:14, fontWeight:700, color:T.text }}>
                  {search || selectedDate ? "No events found" : "No events yet!"}
                </div>
                <div style={{ fontSize:12, color:"#a78bfa", marginTop:4 }}>
                  {search || selectedDate
                    ? "Try a different filter or click a date on the calendar"
                    : "Add your first event using the form above"}
                </div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {shown.map((ev, idx) => {
                  const d   = ev.date ? new Date(ev.date+"T00:00:00") : null;
                  const day = d ? d.getDate() : "--";
                  const mon = d ? MONTHS[d.getMonth()] : "---";
                  const c   = TC[ev.type||"Meeting"] || "#9333ea";
                  const past = ev.date && ev.date < today;

                  return (
                    <div key={ev._id||idx} style={{
                      background: past ? "#fafafa" : "#fff",
                      borderRadius:12, padding:"12px 14px",
                      border:`1px solid ${past?"#f0edff":"#ede9fe"}`,
                      display:"flex", gap:12, alignItems:"center",
                      flexWrap:"wrap", opacity: past ? 0.8 : 1,
                      boxShadow:"0 2px 10px rgba(147,51,234,0.05)"
                    }}>
                      {/* Date badge */}
                      <div style={{ background:`${c}15`, border:`2px solid ${c}30`,
                        borderRadius:10, padding:"8px 12px", textAlign:"center",
                        minWidth:50, flexShrink:0 }}>
                        <div style={{ fontSize:20, fontWeight:800, color:c, lineHeight:1 }}>{day}</div>
                        <div style={{ fontSize:8, color:"#a78bfa", fontWeight:700,
                          letterSpacing:1, marginTop:2 }}>{mon.toUpperCase()}</div>
                      </div>

                      {/* Details */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center",
                          gap:6, flexWrap:"wrap", marginBottom:4 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:T.text }}>
                            {ev.name}
                          </span>
                          <span style={{ background:`${c}18`, color:c,
                            border:`1px solid ${c}33`, padding:"2px 8px",
                            borderRadius:20, fontSize:10, fontWeight:700 }}>
                            {ev.type||"Meeting"}
                          </span>
                          {past && (
                            <span style={{ background:"#f3f0ff", color:"#a78bfa",
                              padding:"2px 7px", borderRadius:20, fontSize:9, fontWeight:600 }}>
                              Past
                            </span>
                          )}
                        </div>
                        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                          {ev.project && <span style={{ color:"#a78bfa", fontSize:11 }}>📁 {ev.project}</span>}
                          {ev.client  && <span style={{ color:"#a78bfa", fontSize:11 }}>👤 {ev.client}</span>}
                          {(ev.start||ev.end) && (
                            <span style={{ color:"#a78bfa", fontSize:11 }}>
                              🕐 {ev.start||"--"} – {ev.end||"--"}
                            </span>
                          )}
                        </div>
                        {ev.notes && (
                          <div style={{ color:"#a78bfa", fontSize:10,
                            marginTop:3, fontStyle:"italic" }}>📝 {ev.notes}</div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display:"flex", gap:5, flexShrink:0 }}>
                        <button onClick={()=>openEdit(ev)} style={{
                          background:"#f5f3ff", border:"1px solid #ede9fe",
                          borderRadius:7, padding:"5px 12px", fontSize:11,
                          color:"#7c3aed", cursor:"pointer", fontWeight:700 }}>
                          ✏️ Edit
                        </button>
                        <button onClick={()=>del(ev._id||ev.id)} style={{
                          background:"#fee2e2", border:"1px solid #fecaca",
                          borderRadius:7, padding:"5px 12px", fontSize:11,
                          color:"#ef4444", cursor:"pointer", fontWeight:700 }}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        {/* END RIGHT COLUMN */}

      </div>
      {/* END SPLIT LAYOUT */}

      {/* ── MODAL ───────────────────────────────────────────────── */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(59,7,100,0.55)",
          backdropFilter:"blur(8px)", zIndex:1000, display:"flex",
          alignItems:"center", justifyContent:"center", padding:16 }}
          onClick={(e)=>{ if(e.target===e.currentTarget){ setModal(null); setForm(EMPTY); setErr({}); } }}>
          <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:740,
            maxHeight:"90vh", overflow:"hidden", display:"flex",
            flexDirection:"column", boxShadow:"0 32px 80px rgba(147,51,234,0.28)" }}>

            {/* Modal header */}
            <div style={{ padding:"16px 22px", borderBottom:"1px solid #ede9fe",
              display:"flex", justifyContent:"space-between", alignItems:"center",
              background:"linear-gradient(90deg,#f5f3ff,#faf5ff)", flexShrink:0 }}>
              <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:T.text }}>
                {modal==="add" ? "📅 Add New Event" : "✏️ Edit Event"}
              </h2>
              <button onClick={()=>{ setModal(null); setForm(EMPTY); setErr({}); }} style={{
                background:"none", border:"none", fontSize:20,
                cursor:"pointer", color:"#7c3aed" }}>✕</button>
            </div>

            {/* Modal body */}
            <div style={{ overflowY:"auto", padding:"20px 22px", flex:1 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 18px" }}>

                {/* Event Name */}
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, color:"#7c3aed",
                    fontWeight:700, letterSpacing:0.5, marginBottom:5 }}>EVENT NAME *</label>
                  <input value={form.name}
                    onChange={e=>{setForm({...form,name:e.target.value});setErr(p=>({...p,name:""}));}}
                    placeholder="e.g. Client Review Meeting"
                    style={inp(err.name)} />
                  {err.name && <div style={{ fontSize:11, color:"#ef4444", marginTop:4 }}>⚠️ {err.name}</div>}
                </div>

                {/* Type */}
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, color:"#7c3aed",
                    fontWeight:700, letterSpacing:0.5, marginBottom:5 }}>TYPE</label>
                  <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}
                    style={inp(false)}>
                    {TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>

                {/* Date */}
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, color:"#7c3aed",
                    fontWeight:700, letterSpacing:0.5, marginBottom:5 }}>DATE *</label>
                  <input type="date" value={form.date}
                    onChange={e=>{setForm({...form,date:e.target.value});setErr(p=>({...p,date:""}));}}
                    style={inp(err.date)} />
                  {err.date && <div style={{ fontSize:11, color:"#ef4444", marginTop:4 }}>⚠️ {err.date}</div>}
                </div>

                {/* Time */}
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, color:"#7c3aed",
                    fontWeight:700, letterSpacing:0.5, marginBottom:5 }}>TIME (Start – End)</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    <input type="time" value={form.start}
                      onChange={e=>setForm({...form,start:e.target.value})}
                      style={inp(false)} />
                    <input type="time" value={form.end}
                      onChange={e=>setForm({...form,end:e.target.value})}
                      style={inp(false)} />
                  </div>
                </div>

                {/* Project */}
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, color:"#7c3aed",
                    fontWeight:700, letterSpacing:0.5, marginBottom:5 }}>PROJECT</label>
                  <select value={form.project} onChange={e=>setForm({...form,project:e.target.value})}
                    style={inp(false)}>
                    <option value="">-- Select Project --</option>
                    {pNames.map((n,i)=><option key={`p-${i}`}>{n}</option>)}
                  </select>
                </div>

                {/* Client */}
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, color:"#7c3aed",
                    fontWeight:700, letterSpacing:0.5, marginBottom:5 }}>CLIENT</label>
                  <select value={form.client} onChange={e=>setForm({...form,client:e.target.value})}
                    style={inp(false)}>
                    <option value="">-- Select Client --</option>
                    {cNames.map((n,i)=><option key={`c-${i}`}>{n}</option>)}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:11, color:"#7c3aed",
                  fontWeight:700, letterSpacing:0.5, marginBottom:5 }}>NOTES</label>
                <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}
                  placeholder="Any additional details..."
                  rows={3} style={{ ...inp(false), resize:"vertical" }} />
              </div>

              {/* Preview */}
              {form.name && form.date && (
                <div style={{ background:"#f5f3ff", borderRadius:12,
                  padding:"14px 16px", border:"1px solid #ede9fe",
                  marginBottom:14, display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:46, height:46,
                    background:`${TC[form.type]||"#9333ea"}20`,
                    border:`2px solid ${TC[form.type]||"#9333ea"}40`,
                    borderRadius:10, display:"flex", flexDirection:"column",
                    alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <div style={{ fontSize:16, fontWeight:800,
                      color:TC[form.type]||"#9333ea", lineHeight:1 }}>
                      {new Date(form.date+"T00:00:00").getDate()}
                    </div>
                    <div style={{ fontSize:8, color:"#a78bfa", fontWeight:700 }}>
                      {MONTHS[new Date(form.date+"T00:00:00").getMonth()]?.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight:700, color:T.text, fontSize:13 }}>{form.name}</div>
                    <div style={{ fontSize:12, color:"#a78bfa", marginTop:2 }}>
                      {form.type}
                      {form.start ? ` · ${form.start}${form.end?` – ${form.end}`:""}` : ""}
                      {form.client ? ` · 👤 ${form.client}` : ""}
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
                <button onClick={()=>{ setModal(null); setForm(EMPTY); setErr({}); }} style={{
                  background:"#f5f3ff", border:"1px solid #ede9fe", color:T.text,
                  borderRadius:10, padding:"10px 18px", cursor:"pointer",
                  fontWeight:600, fontSize:13 }}>Cancel</button>
                <button onClick={save} disabled={saving} style={{ ...Btn, opacity:saving?0.7:1 }}>
                  {saving ? "Saving…" : modal==="add" ? "💾 Save Event" : "✅ Update Event"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
