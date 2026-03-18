import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/events";
const T = { text:"#1e0a3c", muted:"#7c3aed", border:"#ede9fe" };
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
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

  const openAdd = () => {
    setForm(EMPTY); setErr({}); setEditId(null); setModal("add");
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
      // offline fallback
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

  const f = (x) => {
    const q = search.toLowerCase();
    const ms = !q ||
      (x.name||"").toLowerCase().includes(q) ||
      (x.project||"").toLowerCase().includes(q) ||
      (x.client||"").toLowerCase().includes(q);
    const mf =
      filter==="All"      ? true :
      filter==="Today"    ? x.date===today :
      filter==="Upcoming" ? x.date>today :
      filter==="Past"     ? x.date<today :
      (x.type||"Meeting")===filter;
    return ms && mf;
  };

  const shown = events.filter(f);

  const stats = [
    { t:"Total",    v:events.length,                                    c:"#9333ea", i:"📅" },
    { t:"Today",    v:events.filter(x=>x.date===today).length,          c:"#7c3aed", i:"📌" },
    { t:"Upcoming", v:events.filter(x=>x.date>today).length,            c:"#f59e0b", i:"⏰" },
    { t:"Past",     v:events.filter(x=>x.date<today).length,            c:"#22C55E", i:"✅" },
  ];

  const pNames = projects.map(p=>p.name||"");
  const cNames = clients.map(c=>c.clientName||c.name||"");

  const Btn = {
    background:"linear-gradient(135deg,#9333ea,#7c3aed)", color:"#fff",
    border:"none", borderRadius:10, padding:"9px 18px",
    fontWeight:700, fontSize:13, cursor:"pointer"
  };

  const inp = (err) => ({
    width:"100%", border:`1.5px solid ${err?"#ef4444":"#ede9fe"}`,
    borderRadius:10, padding:"10px 14px", fontSize:13,
    color:T.text, background:"#faf5ff", outline:"none",
    fontFamily:"inherit", boxSizing:"border-box"
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999,
          background:"#fff", border:"1.5px solid #22c55e", borderRadius:12,
          padding:"12px 20px", fontSize:13, fontWeight:700, color:"#22c55e",
          boxShadow:"0 8px 24px rgba(0,0,0,0.12)" }}>{toast}</div>
      )}

      {/* Stats */}
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

      {/* Toolbar */}
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:12, top:"50%",
              transform:"translateY(-50%)" }}>🔍</span>
            <input placeholder="Search events..." value={search}
              onChange={e=>setSearch(e.target.value)}
              style={{ ...inp(false), paddingLeft:36, width:200 }} />
          </div>
          {["All","Today","Upcoming","Past",...TYPES].map((fil,fi) => (
            <button key={`filter-${fi}-${fil}`} onClick={()=>setFilter(fil)} style={{
              padding:"6px 12px", borderRadius:8, fontSize:11, fontWeight:700,
              cursor:"pointer", border:"1.5px solid",
              borderColor: filter===fil ? "#9333ea" : "#ede9fe",
              background:  filter===fil ? "#f3e8ff"  : "#fff",
              color:        filter===fil ? "#9333ea"  : "#a78bfa"
            }}>{fil}</button>
          ))}
        </div>
        <button onClick={openAdd} style={Btn}>+ Add Event</button>
      </div>

      {/* Event List */}
      <div style={{ background:"#fff", borderRadius:16, padding:22,
        boxShadow:"0 4px 24px rgba(147,51,234,0.08)", border:"1px solid #ede9fe" }}>

        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:16 }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:T.text }}>
            📅 All Events ({shown.length})
          </h3>
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:60, color:"#a78bfa" }}>
            <div style={{ fontSize:32, marginBottom:10 }}>⏳</div>
            <div style={{ fontWeight:600 }}>Loading events...</div>
          </div>
        ) : shown.length === 0 ? (
          <div style={{ textAlign:"center", padding:60 }}>
            <div style={{ fontSize:48, marginBottom:14 }}>📅</div>
            <div style={{ fontSize:15, fontWeight:700, color:T.text }}>
              {search ? "No events found" : "No events yet!"}
            </div>
            <div style={{ fontSize:13, color:"#a78bfa", marginTop:6, marginBottom:20 }}>
              {search ? "Try a different search term" : "Create your first event by clicking the button below"}
            </div>
            {!search && (
              <button onClick={openAdd} style={Btn}>+ Add Your First Event</button>
            )}
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {shown.map((ev, idx) => {
              const d   = ev.date ? new Date(ev.date+"T00:00:00") : null;
              const day = d ? d.getDate() : "--";
              const mon = d ? MONTHS[d.getMonth()] : "---";
              const c   = TC[ev.type||"Meeting"] || "#9333ea";
              const past = ev.date && ev.date < today;

              return (
                <div key={ev._id||idx} style={{
                  background: past ? "#fafafa" : "#fff",
                  borderRadius:14, padding:16,
                  border:`1px solid ${past?"#f0edff":"#ede9fe"}`,
                  display:"flex", gap:14, alignItems:"center",
                  flexWrap:"wrap", opacity: past ? 0.8 : 1,
                  boxShadow:"0 2px 12px rgba(147,51,234,0.06)"
                }}>
                  {/* Date badge */}
                  <div style={{ background:`${c}15`, border:`2px solid ${c}30`,
                    borderRadius:12, padding:"10px 14px", textAlign:"center",
                    minWidth:58, flexShrink:0 }}>
                    <div style={{ fontSize:22, fontWeight:800, color:c, lineHeight:1 }}>{day}</div>
                    <div style={{ fontSize:9, color:"#a78bfa", fontWeight:700,
                      letterSpacing:1, marginTop:3 }}>{mon.toUpperCase()}</div>
                  </div>

                  {/* Details */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center",
                      gap:8, flexWrap:"wrap", marginBottom:5 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:T.text }}>
                        {ev.name}
                      </span>
                      <span style={{ background:`${c}18`, color:c,
                        border:`1px solid ${c}33`, padding:"2px 9px",
                        borderRadius:20, fontSize:11, fontWeight:700 }}>
                        {ev.type||"Meeting"}
                      </span>
                      {past && (
                        <span style={{ background:"#f3f0ff", color:"#a78bfa",
                          padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:600 }}>
                          Past
                        </span>
                      )}
                    </div>
                    <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                      {ev.project && (
                        <span style={{ color:"#a78bfa", fontSize:12 }}>📁 {ev.project}</span>
                      )}
                      {ev.client && (
                        <span style={{ color:"#a78bfa", fontSize:12 }}>👤 {ev.client}</span>
                      )}
                      {(ev.start||ev.end) && (
                        <span style={{ color:"#a78bfa", fontSize:12 }}>
                          🕐 {ev.start||"--"} – {ev.end||"--"}
                        </span>
                      )}
                    </div>
                    {ev.notes && (
                      <div style={{ color:"#a78bfa", fontSize:11,
                        marginTop:5, fontStyle:"italic" }}>📝 {ev.notes}</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    <button onClick={()=>openEdit(ev)} style={{
                      background:"#f5f3ff", border:"1px solid #ede9fe",
                      borderRadius:8, padding:"5px 14px", fontSize:12,
                      color:"#7c3aed", cursor:"pointer", fontWeight:700 }}>
                      ✏️ Edit
                    </button>
                    <button onClick={()=>del(ev._id||ev.id)} style={{
                      background:"#fee2e2", border:"1px solid #fecaca",
                      borderRadius:8, padding:"5px 14px", fontSize:12,
                      color:"#ef4444", cursor:"pointer", fontWeight:700 }}>
                      🗑️ Del
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(59,7,100,0.6)",
          backdropFilter:"blur(8px)", zIndex:1000, display:"flex",
          alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:760,
            maxHeight:"90vh", overflow:"hidden", display:"flex",
            flexDirection:"column", boxShadow:"0 32px 80px rgba(147,51,234,0.3)" }}>

            {/* Modal header */}
            <div style={{ padding:"16px 22px", borderBottom:"1px solid #ede9fe",
              display:"flex", justifyContent:"space-between", alignItems:"center",
              background:"linear-gradient(90deg,#f5f3ff,#faf5ff)", flexShrink:0 }}>
              <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:T.text }}>
                {modal==="add" ? "📅 Add New Event" : "✏️ Edit Event"}
              </h2>
              <button onClick={()=>setModal(null)} style={{ background:"none",
                border:"none", fontSize:20, cursor:"pointer", color:"#7c3aed" }}>✕</button>
            </div>

            {/* Modal body */}
            <div style={{ overflowY:"auto", padding:"20px 22px", flex:1 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 18px" }}>

                {/* Event Name */}
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, color:"#7c3aed",
                    fontWeight:700, letterSpacing:0.5, marginBottom:5 }}>
                    EVENT NAME *
                  </label>
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
                    fontWeight:700, letterSpacing:0.5, marginBottom:5 }}>TIME</label>
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
                    {pNames.map((n,i)=><option key={`p-${i}-${n}`}>{n}</option>)}
                  </select>
                </div>

                {/* Client */}
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:11, color:"#7c3aed",
                    fontWeight:700, letterSpacing:0.5, marginBottom:5 }}>CLIENT</label>
                  <select value={form.client} onChange={e=>setForm({...form,client:e.target.value})}
                    style={inp(false)}>
                    <option value="">-- Select Client --</option>
                    {cNames.map((n,i)=><option key={`c-${i}-${n}`}>{n}</option>)}
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
                <button onClick={()=>setModal(null)} style={{
                  background:"#f5f3ff", border:"1px solid #ede9fe", color:T.text,
                  borderRadius:10, padding:"10px 18px", cursor:"pointer",
                  fontWeight:600, fontSize:13 }}>Cancel</button>
                <button onClick={save} disabled={saving} style={{
                  ...Btn, opacity:saving?0.7:1 }}>
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
