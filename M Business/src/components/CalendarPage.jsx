import { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

const API = `${BASE_URL}/api/events`;
const T = { text: "var(--app-text)", muted: "var(--app-accent)", border: "var(--app-border)" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TYPES = ["Meeting", "Call", "Review", "Planning", "Handover", "Other"];
const TC = { Meeting: "var(--app-accent)", Call: "var(--app-accent)", Review: "#22C55E", Planning: "#f59e0b", Handover: "var(--app-accent)", Other: "var(--app-muted)" };
const EMPTY = { name: "", project: "", client: "", date: "", start: "", end: "", notes: "", type: "Meeting", category: "Event" };

export default function CalendarPage({ projects = [], tasks = [], clients = [], companyId, onUpdateProject, onUpdateTask, config, user, THEME }) {
  const finalTheme = THEME || { accent: "var(--app-accent)", muted: "var(--app-muted)", card: "var(--app-card)", bg: "var(--app-bg)", border: "var(--app-border)", text: "var(--app-text)" };
  
  // Update TC to use dynamic theme accent if available
  const TYPE_COLORS = { 
    ...TC, 
    Meeting: finalTheme.accent || TC.Meeting, 
    Call: finalTheme.accent || TC.Call, 
    Handover: finalTheme.accent || TC.Handover,
    Other: finalTheme.muted || TC.Other
  };
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => { load(); }, [projects, user, companyId]);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2800); };

  const load = async () => {
    setLoading(true);
    try {
      const isEmp = String(user?.role || user?.userRole || "").toLowerCase() === 'employee';
      let url = `${API}?companyId=${companyId || ""}`;

      if (isEmp && user?.name) {
        url += `&employeeName=${encodeURIComponent(user.name)}`;
        if (projects.length > 0) {
          const pNames = projects.map(p => p.name).join(",");
          url += `&projectNames=${encodeURIComponent(pNames)}`;
        }
      }

      const r = await axios.get(url);
      setEvents(Array.isArray(r.data) ? r.data : []);
    } catch {
      setEvents([]);
    }
    setLoading(false);
  };

  const role = String(user?.role || user?.userRole || "").toLowerCase().trim();
  const isClient = role === 'client';
  const isEmployee = role === 'employee';

  const filteredEvents = isClient
    ? events.filter(e => {
      if (!e.client) return false;
      const c = String(e.client).toLowerCase().trim();
      return (user?.name && c === String(user.name).toLowerCase().trim()) ||
        (user?.clientName && c === String(user.clientName).toLowerCase().trim()) ||
        (user?.company && c === String(user.company).toLowerCase().trim()) ||
        (user?.companyName && c === String(user.companyName).toLowerCase().trim());
    })
    : events;

  // Combine real events with project/task deadlines
  const allDisplayEvents = [
    ...filteredEvents.map(e => ({ ...e, _type: "event" })),
    ...projects.filter(p => p.deadline || p.end).map(p => ({
      _id: `proj-${p._id || p.id}`,
      name: `🏁 Deadline: ${p.name}`,
      date: p.deadline || p.end,
      type: "Planning",
      project: p.name,
      client: p.client,
      _type: "project",
      _original: p
    })),
    ...tasks.filter(t => t.date || t.dueDate).map(t => ({
      _id: `task-${t._id || t.id}`,
      name: `📝 Task: ${t.title || t.name}`,
      date: t.date || t.dueDate,
      type: "Review",
      project: t.project,
      _type: "task",
      _original: t
    }))
  ];

  const openAdd = (dateStr) => {
    setForm({ ...EMPTY, date: dateStr || "" });
    setErr({}); setEditId(null); setModal("add");
  };

  const openEdit = (ev, readOnly = false) => {
    const finalReadOnly = readOnly || isClient;
    if (ev._type === "project" || ev._type === "task") {
      setModal(ev._type);
      setForm({ ...ev, _readOnly: finalReadOnly });
      return;
    }
    setForm({
      name: ev.name || "",
      project: ev.project || "",
      client: ev.client || "",
      date: ev.date || "",
      start: ev.start || "",
      end: ev.end || "",
      notes: ev.notes || "",
      type: ev.type || "Meeting"
    });
    setEditId(ev._id || ev.id);
    setErr({});
    setModal(finalReadOnly ? "view" : "edit");
  };

  const save = async () => {
    const e = {};
    if (!form.name.trim()) e.name = "Event name required";
    if (!form.date) e.date = "Date required";
    if (Object.keys(e).length) { setErr(e); return; }
    setSaving(true);
    try {
      let savedEvent = null;

      if (modal === "add") {
        if (form.category === "Project") {
          const payload = { name: form.name, client: form.client, start: form.date, end: form.date, deadline: form.date, status: "Pending", budget: "0", currency: "₹" };
          const r = await axios.post(`${BASE_URL}/api/projects/add`, payload);
          if (onUpdateProject) onUpdateProject();
          showToast("✅ Project added!");
          savedEvent = { ...r.data, _type: "project" };
        } else if (form.category === "Task") {
          const payload = { title: form.name, project: form.project, date: form.date, status: "Pending", priority: "Medium" };
          const r = await axios.post(`${BASE_URL}/api/tasks`, payload);
          if (onUpdateTask) onUpdateTask();
          showToast("✅ Task added!");
          savedEvent = { ...r.data, _type: "task" };
        } else {
          const r = await axios.post(API, { ...form, companyId: companyId || "", createdBy: user?.name || user?.clientName || "", createdByRole: user?.role || user?.userRole || "" });
          savedEvent = r.data;
          setEvents(p => [savedEvent, ...p]);
          showToast("✅ Event added!");
        }
      } else {
        const r = await axios.put(`${API}/${editId}`, form);
        savedEvent = r.data;
        setEvents(p => p.map(x => (x._id || x.id) === editId ? savedEvent : x));
        showToast("✅ Event updated!");
      }

      // Notification logic
      if (savedEvent && (savedEvent.client || savedEvent.employee)) {
        const targetNames = [savedEvent.client, savedEvent.employee].filter(Boolean);
        for (const name of targetNames) {
          const targetClient = (clients || []).find(c => (c.name || c.clientName || "").toLowerCase() === name.toLowerCase());
          const targetEmp = (projects || []).flatMap(p => p.team || []).find(e => (typeof e === 'string' ? e : e.name || "").toLowerCase() === name.toLowerCase());
          
          const userId = targetClient?._id || targetClient?.id || targetEmp?._id || targetEmp?.id;
          if (userId) {
            axios.post(`${BASE_URL}/api/notifications`, {
              userId,
              type: 'event',
              icon: '📅',
              text: `New event scheduled: "${savedEvent.name || savedEvent.title || 'Meeting'}" on ${savedEvent.date}`,
              link: 'calendar'
            }).catch(() => {});
          }
        }
      }

      setModal(null);
    } catch {
      if (modal === "add") {
        setEvents(p => [{ ...form, _id: Date.now().toString(), createdBy: user?.name || user?.clientName || "", createdByRole: user?.role || user?.userRole || "" }, ...p]);
        showToast("✅ Saved locally!");
      } else {
        setEvents(p => p.map(x => (x._id || x.id) === editId ? { ...x, ...form } : x));
        showToast("✅ Updated locally!");
      }
      setModal(null);
    }
    setSaving(false);
  };

  const updateProjectTask = async (type, id, updates) => {
    setSaving(true);
    try {
      if (type === "project") {
        await axios.put(`${BASE_URL}/api/projects/${id}`, updates);
        if (onUpdateProject) onUpdateProject();
        showToast("✅ Project updated!");
      } else if (type === "task") {
        // Use PUT for full update if available, or stay with PATCH for status only
        if (updates.date || updates.dueDate) {
          await axios.put(`${BASE_URL}/api/tasks/${id}`, updates);
        } else {
          await axios.patch(`${BASE_URL}/api/tasks/${id}/status`, updates);
        }
        if (onUpdateTask) onUpdateTask();
        showToast("✅ Task updated!");
      }
      setModal(null);
    } catch (err) {
      showToast("❌ Update failed!");
    }
    setSaving(false);
  };

  const del = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try { await axios.delete(`${API}/${id}`); } catch { }
    setEvents(p => p.filter(x => (x._id || x.id) !== id));
    showToast("Delete Deleted!");
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
    const daysInPrev = new Date(calYear, calMonth, 0).getDate();
    const cells = [];
    for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, curr: false });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, curr: true });
    while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - firstDay + 1, curr: false });
    return cells;
  };

  const dateStr = (d) =>
    `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const eventsOnDay = (d) => {
    const targetDateStr = dateStr(d);
    return allDisplayEvents.filter(e => {
      if (!e.date) return false;
      // Handle both YYYY-MM-DD and ISO strings
      const eDate = e.date.includes('T') ? e.date.split('T')[0] : e.date;
      return eDate === targetDateStr;
    });
  };

  const f = (x) => {
    const q = search.toLowerCase();
    const ms = !q ||
      (x.name || "").toLowerCase().includes(q) ||
      (x.project || "").toLowerCase().includes(q) ||
      (x.client || "").toLowerCase().includes(q);
    let mf = true;
    if (selectedDate) {
      mf = x.date === selectedDate;
    } else {
      mf =
        filter === "All" ? true :
          filter === "Today" ? x.date === today :
            filter === "Upcoming" ? x.date > today :
              filter === "Past" ? x.date < today :
                (x.type || "Meeting") === filter;
    }
    return ms && mf;
  };

  const shown = [...allDisplayEvents].filter(f).sort((a, b) => (a.date || "") < (b.date || "") ? -1 : 1);

  const stats = [
    { t: "Total", v: allDisplayEvents.length, c: finalTheme.accent || "var(--app-accent)", i: "📅" },
    { t: "Today", v: allDisplayEvents.filter(x => x.date === today).length, c: finalTheme.accent || "var(--app-accent)", i: "📌" },
    { t: "Upcoming", v: allDisplayEvents.filter(x => x.date > today).length, c: "#10b981", i: "⏰" },
    { t: "Past", v: allDisplayEvents.filter(x => x.date < today).length, c: "#ef4444", i: "✅" },
  ];

  const pNames = projects.map(p => p.name || "");
  const cNames = clients.map(c => c.clientName || c.name || "");

  const Btn = {
    background: finalTheme.gradient || "var(--app-accent-gradient, var(--app-accent, #6366f1))",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "10px 22px",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 8px 20px rgba(var(--app-accent-rgb, 99, 102, 241), 0.2)",
    transition: "all 0.2s"
  };

  const inp = (hasErr) => ({
    width: "100%",
    border: `1.5px solid ${hasErr ? "#ef4444" : "var(--app-border)"}`,
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 14,
    color: "var(--app-text)",
    background: "var(--app-surface)",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "all 0.2s"
  });

  const calendarDays = getCalendarDays();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: finalTheme.card, border: `1.5px solid #22c55e`, borderRadius: 12,
          padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#22c55e",
          boxShadow: finalTheme.shadow || "var(--app-shadow)"
        }}>{toast}</div>
      )}

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
        {stats.map(({ t, v, c, i }) => (
          <div key={t} style={{
            background: finalTheme.card,
            borderRadius: 24,
            padding: "24px",
            boxShadow: finalTheme.shadow || "var(--app-shadow)",
            border: `1.5px solid ${finalTheme.border}`,
            transition: "transform 0.3s ease"
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-5px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: c.startsWith('var') ? `rgba(var(--app-accent-rgb), 0.1)` : `${c}15`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, marginBottom: 12, color: c
            }}>{i}</div>
            <div style={{ fontSize: 11, color: finalTheme.muted, fontWeight: 800, letterSpacing: 0.8, marginBottom: 4 }}>{t.toUpperCase()}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: finalTheme.text || "var(--app-text)", letterSpacing: "-0.5px" }}>{v}</div>
          </div>
        ))}
      </div>

      {/* ── MAIN SPLIT LAYOUT ─────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start", maxWidth: 1200, margin: "0 auto", width: "100%" }}>

        {/* ── LEFT: CALENDAR ──────────────────────────────────────── */}
        <div style={{
          background: finalTheme.card, borderRadius: 16, padding: 20,
          boxShadow: finalTheme.shadow || "var(--app-shadow)", border: `1px solid ${finalTheme.border}`,
          position: "sticky", top: 16
        }}>

          {/* Month navigation */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 14
          }}>
            <button onClick={prevMonth} style={{
              background: finalTheme.bg,
              border: `1px solid ${finalTheme.border}`, borderRadius: 8, width: 32, height: 32,
              cursor: "pointer", fontSize: 15, color: finalTheme.accent, fontWeight: 700
            }}>‹</button>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: finalTheme.text || "var(--app-text)" }}>
                {FULL_MONTHS[calMonth]} {calYear}
              </div>
              {selectedDate && (
                <div style={{ fontSize: 10, color: finalTheme.muted, marginTop: 2 }}>
                  {selectedDate}
                  <span onClick={() => setSelectedDate(null)}
                    style={{
                      marginLeft: 6, cursor: "pointer", color: finalTheme.accent,
                      textDecoration: "underline"
                    }}>✕ Clear</span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button onClick={() => { setCalYear(now.getFullYear()); setCalMonth(now.getMonth()); setSelectedDate(null); }}
                style={{
                  background: finalTheme.bg, border: `1px solid ${finalTheme.border}`,
                  borderRadius: 8, padding: "4px 10px", cursor: "pointer",
                  fontSize: 10, color: finalTheme.accent, fontWeight: 700
                }}>Today</button>
              <button onClick={nextMonth} style={{
                background: finalTheme.bg,
                border: `1px solid ${finalTheme.border}`, borderRadius: 8, width: 32, height: 32,
                cursor: "pointer", fontSize: 15, color: finalTheme.accent, fontWeight: 700
              }}>›</button>
            </div>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{
                textAlign: "center", fontSize: 9, fontWeight: 700,
                color: finalTheme.muted, letterSpacing: 0.5, padding: "3px 0"
              }}>
                {d.toUpperCase()}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
            {calendarDays.map((cell, idx) => {
              const ds = cell.curr ? dateStr(cell.day) : null;
              const dayEvents = cell.curr ? eventsOnDay(cell.day) : [];
              const isToday = ds === today;
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
                    minHeight: 52,
                    borderRadius: 9,
                    padding: "5px 4px 4px",
                    cursor: cell.curr ? "pointer" : "default",
                    background: isSelected ? `${finalTheme.accent}33` : isToday ? `${finalTheme.accent}1a` : cell.curr ? finalTheme.card : finalTheme.bg,
                    border: isSelected ? `2px solid ${finalTheme.accent}` : isToday ? `1.5px solid ${finalTheme.accent}4d` : `1px solid ${finalTheme.border}`,
                    opacity: cell.curr ? 1 : 0.4,
                    transition: "all 0.15s",
                    position: "relative",
                    boxSizing: "border-box",
                  }}>

                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: isToday || isSelected ? 800 : 600,
                    color: isSelected ? finalTheme.accent : isToday ? finalTheme.accent : cell.curr ? (finalTheme.text || "var(--app-text)") : finalTheme.border,
                    background: isToday && !isSelected ? finalTheme.border : "transparent",
                    marginBottom: 3,
                  }}>{cell.day}</div>

                  {dayEvents.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {dayEvents.slice(0, 2).map((ev, ei) => {
                        const tc = TYPE_COLORS[ev.type || "Meeting"] || finalTheme.accent;
                        return (
                          <div key={ei} style={{
                            background: `${tc}22`,
                            borderRadius: 3, padding: "1px 3px",
                            fontSize: 8, color: tc,
                            fontWeight: 700, overflow: "hidden",
                            whiteSpace: "nowrap", textOverflow: "ellipsis",
                          }}>{ev.name}</div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div style={{
                          fontSize: 8, color: finalTheme.muted, fontWeight: 600,
                          paddingLeft: 2
                        }}>+{dayEvents.length - 2}</div>
                      )}
                    </div>
                  )}

                  {/* Quick add on hover */}
                  {cell.curr && !isClient && !isEmployee && (
                    <div
                      onClick={e => { e.stopPropagation(); openAdd(ds); }}
                      title="Add event"
                      style={{
                        position: "absolute", top: 3, right: 3,
                        width: 14, height: 14, borderRadius: "50%",
                        background: finalTheme.border, color: finalTheme.accent,
                        fontSize: 11, fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", opacity: 0, transition: "opacity 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "0"}
                    >+</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <div key={type} style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 9, color: finalTheme.muted, fontWeight: 600
              }}>
                <div style={{ width: 7, height: 7, borderRadius: 2, background: color }} />
                {type}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: EVENT LIST ───────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ── EVENT LIST ───────────────────────────────────────── */}
          <div style={{
            background: finalTheme.card, borderRadius: 16, padding: 20,
            boxShadow: finalTheme.shadow || "var(--app-shadow)", border: `1px solid ${finalTheme.border}`
          }}>

            {/* Toolbar */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 14
            }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: finalTheme.text || "var(--app-text)" }}>
                {selectedDate
                  ? `📅 Events on ${selectedDate} (${shown.length})`
                  : `📅 All Events (${shown.length})`}
              </h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12 }}>🔍</span>
                  <input placeholder="Search…" value={search}
                    onChange={e => { setSearch(e.target.value); setSelectedDate(null); }}
                    style={{ ...inp(false), paddingLeft: 30, width: 150, padding: "7px 10px 7px 30px" }} />
                </div>
                {!isClient && !isEmployee && (
                  <button onClick={() => openAdd(selectedDate || "")} style={Btn}>
                    + Add Event
                  </button>
                )}
              </div>
            </div>

            {/* Filter chips */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {["All", "Today", "Upcoming", "Past", ...TYPES].map((fil, fi) => (
                <button key={`filter-${fi}`}
                  onClick={() => { setFilter(fil); setSelectedDate(null); }}
                  style={{
                    padding: "5px 10px", borderRadius: 7, fontSize: 10, fontWeight: 700,
                    cursor: "pointer", border: "1.5px solid",
                    borderColor: !selectedDate && filter === fil ? finalTheme.accent : finalTheme.border,
                    background: !selectedDate && filter === fil ? finalTheme.accent : finalTheme.card,
                    color: !selectedDate && filter === fil ? "#fff" : finalTheme.muted
                  }}>{fil}</button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--app-muted)" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Loading events...</div>
              </div>
            ) : shown.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📅</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: finalTheme.text || "var(--app-text)" }}>
                  {search || selectedDate ? "No events found" : "No events yet!"}
                </div>
                <div style={{ fontSize: 12, color: finalTheme.muted, marginTop: 4 }}>
                  {search || selectedDate
                    ? "Try a different filter or click a date on the calendar"
                    : "Add your first event using the form above"}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {shown.map((ev, idx) => {
                  const isValidDate = ev.date && !isNaN(new Date(ev.date + "T00:00:00").getTime());
                  const d = isValidDate ? new Date(ev.date + "T00:00:00") : null;
                  const day = d ? d.getDate() : "--";
                  const mon = d ? (MONTHS[d.getMonth()] || "---") : "---";
                  const c = TC[ev.type || "Meeting"] || "var(--app-accent)";
                  const past = ev.date && ev.date < today;

                  return (
                    <div key={ev._id || idx} style={{
                      background: past ? finalTheme.bg : finalTheme.card,
                      borderRadius: 12, padding: "12px 14px",
                      border: `1px solid ${finalTheme.border}`,
                      display: "flex", gap: 12, alignItems: "center",
                      flexWrap: "wrap", opacity: past ? 0.7 : 1,
                      boxShadow: finalTheme.shadow || "var(--app-shadow)"
                    }}>
                      {/* Date badge */}
                      <div style={{
                        background: `${c}15`, border: `2px solid ${c}30`,
                        borderRadius: 10, padding: "8px 12px", textAlign: "center",
                        minWidth: 50, flexShrink: 0
                      }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: c, lineHeight: 1 }}>{day}</div>
                        <div style={{
                          fontSize: 8, color: finalTheme.muted, fontWeight: 700,
                          letterSpacing: 1, marginTop: 2
                        }}>{mon.toUpperCase()}</div>
                      </div>

                      {/* Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: "flex", alignItems: "center",
                          gap: 6, flexWrap: "wrap", marginBottom: 4
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: finalTheme.text || "var(--app-text)" }}>
                            {ev.name}
                          </span>
                          <span style={{
                            background: `${c}18`, color: c,
                            border: `1px solid ${c}33`, padding: "2px 8px",
                            borderRadius: 20, fontSize: 10, fontWeight: 700
                          }}>
                            {ev.type || "Meeting"}
                          </span>
                          {past && (
                            <span style={{
                              background: finalTheme.border, color: finalTheme.muted,
                              padding: "2px 7px", borderRadius: 20, fontSize: 9, fontWeight: 600
                            }}>
                              Past
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          {ev.project && <span style={{ color: finalTheme.muted, fontSize: 11 }}>📁 {ev.project}</span>}
                          {ev.client && <span style={{ color: finalTheme.muted, fontSize: 11 }}>👤 {ev.client}</span>}
                          {(ev.start || ev.end) && (
                            <span style={{ color: finalTheme.muted, fontSize: 11 }}>
                              🕐 {ev.start || "--"} – {ev.end || "--"}
                            </span>
                          )}
                        </div>
                        {ev.notes && (
                          <div style={{
                            color: finalTheme.muted, fontSize: 10,
                            marginTop: 3, fontStyle: "italic"
                          }}>📝 {ev.notes}</div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                        {(() => {
                          let canEdit = true;
                          if (!ev._type) {
                            if (isClient) canEdit = false;
                          }
                          return canEdit ? (
                            <>
                              <button onClick={() => openEdit(ev)} style={{
                                background: finalTheme.bg, border: `1px solid ${finalTheme.border}`,
                                borderRadius: 7, padding: "5px 12px", fontSize: 11,
                                color: finalTheme.accent, cursor: "pointer", fontWeight: 700
                              }}>
                                {ev._type ? "View️ View" : "Edit"}
                              </button>
                              {!ev._type && (
                                <button onClick={() => del(ev._id || ev.id)} style={{
                                  background: "#fee2e2", border: "1px solid #fecaca",
                                  borderRadius: 7, padding: "5px 12px", fontSize: 11,
                                  color: "#ef4444", cursor: "pointer", fontWeight: 700
                                }}>
                                  Delete
                                </button>
                              )}
                            </>
                          ) : (
                            <button onClick={() => openEdit(ev, true)} style={{
                              background: finalTheme.bg, border: `1px solid ${finalTheme.border}`,
                              borderRadius: 7, padding: "5px 12px", fontSize: 11,
                              color: finalTheme.accent, cursor: "pointer", fontWeight: 700
                            }}>
                              View
                            </button>
                          );
                        })()}
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

      {/* ── MODALS ───────────────────────────────────────────────── */}
      {modal === "project" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: finalTheme.card, borderRadius: 24, width: "100%", maxWidth: 450, padding: 28, boxShadow: "0 20px 50px rgba(0,0,0,0.15)", border: `1.5px solid ${finalTheme.border}` }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 900, color: finalTheme.text || "var(--app-text)", display: "flex", alignItems: "center", gap: 10 }}>🏗️ Project Deadline</h2>
            <div style={{ background: finalTheme.bg, padding: 20, borderRadius: 16, marginBottom: 24, border: `1px solid ${finalTheme.border}` }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: finalTheme.text || "var(--app-text)" }}>{form._original.name}</div>
              <div style={{ fontSize: 13, color: finalTheme.muted, marginTop: 6, fontWeight: 600 }}>Deadline: {form.date}</div>
              <div style={{ fontSize: 13, color: finalTheme.muted, fontWeight: 600 }}>Client: {form.client || "—"}</div>
            </div>
            <label style={{ display: "block", fontSize: 11, color: finalTheme.accent, fontWeight: 700, marginBottom: 8 }}>DEADLINE</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              style={{ ...inp(false), marginBottom: 16 }}
              disabled={form._readOnly}
            />
            <label style={{ display: "block", fontSize: 11, color: finalTheme.accent, fontWeight: 700, marginBottom: 8 }}>UPDATE STATUS</label>
            <select
              value={form._original.status}
              onChange={e => setForm({ ...form, _original: { ...form._original, status: e.target.value } })}
              style={inp(false)}
              disabled={form._readOnly}
            >
              {(config?.projectStatuses || ["Pending", "In Progress", "Completed", "On Hold"]).map(s => <option key={s}>{s}</option>)}
            </select>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button onClick={() => setModal(null)} style={{ background: finalTheme.bg, border: "none", color: finalTheme.text || "var(--app-text)", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 600 }}>{form._readOnly ? "Close" : "Cancel"}</button>
              {!form._readOnly && (
                <button
                  onClick={() => updateProjectTask("project", form._original._id, { status: form._original.status, deadline: form.date })}
                  style={{ background: finalTheme.gradient || finalTheme.accent, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 700 }}
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {modal === "task" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: finalTheme.card, borderRadius: 24, width: "100%", maxWidth: 450, padding: 28, boxShadow: "0 20px 50px rgba(0,0,0,0.15)", border: `1.5px solid ${finalTheme.border}` }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 900, color: finalTheme.text || "var(--app-text)", display: "flex", alignItems: "center", gap: 10 }}>📝 Task Details</h2>
            <div style={{ background: finalTheme.bg, padding: 20, borderRadius: 16, marginBottom: 24, border: `1px solid ${finalTheme.border}` }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: finalTheme.text || "var(--app-text)" }}>{form._original.title || form._original.name}</div>
              <div style={{ fontSize: 13, color: finalTheme.muted, marginTop: 6, fontWeight: 600 }}>Due Date: {form.date}</div>
              <div style={{ fontSize: 13, color: finalTheme.muted, fontWeight: 600 }}>Project: {form.project || "—"}</div>
            </div>
            <label style={{ display: "block", fontSize: 11, color: finalTheme.accent, fontWeight: 700, marginBottom: 8 }}>DUE DATE</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              style={{ ...inp(false), marginBottom: 16 }}
              disabled={form._readOnly}
            />
            <label style={{ display: "block", fontSize: 11, color: finalTheme.accent, fontWeight: 700, marginBottom: 8 }}>UPDATE STATUS</label>
            <select
              value={form._original.status}
              onChange={e => setForm({ ...form, _original: { ...form._original, status: e.target.value } })}
              style={inp(false)}
              disabled={form._readOnly}
            >
              {(config?.taskStatuses || ["Pending", "In Progress", "Completed", "On Hold"]).map(s => <option key={s}>{s}</option>)}
            </select>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button onClick={() => setModal(null)} style={{ background: finalTheme.bg, border: "none", color: finalTheme.text || "var(--app-text)", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 600 }}>{form._readOnly ? "Close" : "Cancel"}</button>
              {!form._readOnly && (
                <button
                  onClick={() => updateProjectTask("task", form._original._id, { status: form._original.status, date: form.date })}
                  style={{ background: finalTheme.gradient || finalTheme.accent, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 700 }}
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {modal && !["project", "task"].includes(modal) && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(8px)", zIndex: 1000, display: "flex",
          alignItems: "center", justifyContent: "center", padding: 16
        }}
          onClick={(e) => { if (e.target === e.currentTarget) { setModal(null); setForm(EMPTY); setErr({}); } }}>
          <div style={{
            background: finalTheme.card, borderRadius: 28, width: "100%", maxWidth: 740,
            maxHeight: "90vh", overflow: "hidden", display: "flex",
            flexDirection: "column", boxShadow: "0 30px 60px rgba(0,0,0,0.2)", border: `1.5px solid ${finalTheme.border}`
          }}>

            {/* Modal header */}
            <div style={{
              padding: "16px 22px", borderBottom: `1px solid ${finalTheme.border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: finalTheme.bg, flexShrink: 0
            }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: finalTheme.text || "var(--app-text)" }}>
                {modal === "add" ? "📅 Add New" : modal === "view" ? "View️ View Event" : "Edit"}
              </h2>
              <button onClick={() => { setModal(null); setForm(EMPTY); setErr({}); }} style={{
                background: "none", border: "none", fontSize: 20,
                cursor: "pointer", color: finalTheme.accent
              }}>✕</button>
            </div>

            {/* Modal body */}
            <div style={{ overflowY: "auto", padding: "20px 22px", flex: 1 }}>
              {modal === "add" && (
                <div style={{ display: "flex", gap: 10, marginBottom: 20, background: finalTheme.bg, padding: 12, borderRadius: 12 }}>
                  {["Event", "Project", "Task"].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setForm({ ...form, category: cat })}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: 8,
                        border: "1.5px solid",
                        borderColor: form.category === cat ? finalTheme.accent : finalTheme.border,
                        background: form.category === cat ? finalTheme.accent : finalTheme.card,
                        color: form.category === cat ? "#fff" : finalTheme.accent,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {cat === "Event" ? "📅 Event" : cat === "Project" ? "🏗️ Project" : "📝 Task"}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
                {/* Name */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{
                    display: "block", fontSize: 11, color: finalTheme.accent,
                    fontWeight: 700, letterSpacing: 0.5, marginBottom: 5
                  }}>
                    {(form.category || "Event").toUpperCase()} NAME *
                  </label>
                  <input value={form.name} disabled={modal === "view"}
                    onChange={e => { setForm({ ...form, name: e.target.value }); setErr(p => ({ ...p, name: "" })); }}
                    placeholder={`e.g. ${form.category === "Project" ? "New Website Development" : form.category === "Task" ? "Design Homepage" : "Client Review Meeting"}`}
                    style={{ ...inp(err.name), background: finalTheme.bg }} />
                  {err.name && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>⚠️ {err.name}</div>}
                </div>

                {/* Type */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{
                    display: "block", fontSize: 11, color: finalTheme.accent,
                    fontWeight: 700, letterSpacing: 0.5, marginBottom: 5
                  }}>TYPE</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    style={{ ...inp(false), background: finalTheme.bg }} disabled={modal === "view"}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                {/* Date */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{
                    display: "block", fontSize: 11, color: finalTheme.accent,
                    fontWeight: 700, letterSpacing: 0.5, marginBottom: 5
                  }}>DATE *</label>
                  <input type="date" value={form.date} disabled={modal === "view"}
                    onChange={e => { setForm({ ...form, date: e.target.value }); setErr(p => ({ ...p, date: "" })); }}
                    style={{ ...inp(err.date), background: finalTheme.bg }} />
                  {err.date && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>⚠️ {err.date}</div>}
                </div>

                {/* Time */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{
                    display: "block", fontSize: 11, color: finalTheme.accent,
                    fontWeight: 700, letterSpacing: 0.5, marginBottom: 5
                  }}>TIME (Start – End)</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <input type="time" value={form.start} disabled={modal === "view"}
                      onChange={e => setForm({ ...form, start: e.target.value })}
                      style={{ ...inp(false), background: finalTheme.bg }} />
                    <input type="time" value={form.end} disabled={modal === "view"}
                      onChange={e => setForm({ ...form, end: e.target.value })}
                      style={{ ...inp(false), background: finalTheme.bg }} />
                  </div>
                </div>

                {/* Project */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{
                    display: "block", fontSize: 11, color: finalTheme.accent,
                    fontWeight: 700, letterSpacing: 0.5, marginBottom: 5
                  }}>PROJECT</label>
                  <select value={form.project} onChange={e => setForm({ ...form, project: e.target.value })}
                    style={{ ...inp(false), background: finalTheme.bg }} disabled={modal === "view"}>
                    <option value="">-- Select Project --</option>
                    {pNames.map((n, i) => <option key={`p-${i}`}>{n}</option>)}
                  </select>
                </div>

                {/* Client */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{
                    display: "block", fontSize: 11, color: finalTheme.accent,
                    fontWeight: 700, letterSpacing: 0.5, marginBottom: 5
                  }}>CLIENT</label>
                  <select value={form.client} onChange={e => setForm({ ...form, client: e.target.value })}
                    style={{ ...inp(false), background: finalTheme.bg }} disabled={modal === "view"}>
                    <option value="">-- Select Client --</option>
                    {cNames.map((n, i) => <option key={`c-${i}`}>{n}</option>)}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 14 }}>
                <label style={{
                  display: "block", fontSize: 11, color: finalTheme.accent,
                  fontWeight: 700, letterSpacing: 0.5, marginBottom: 5
                }}>NOTES</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any additional details..." disabled={modal === "view"}
                  rows={3} style={{ ...inp(false), background: finalTheme.bg, resize: "vertical" }} />
              </div>

              {/* Preview */}
              {form.name && form.date && (
                <div style={{
                  background: finalTheme.bg, borderRadius: 12,
                  padding: "14px 16px", border: `1px solid ${finalTheme.border}`,
                  marginBottom: 14, display: "flex", alignItems: "center", gap: 12
                }}>
                  <div style={{
                    width: 46, height: 46,
                    background: `${TYPE_COLORS[form.type] || finalTheme.accent}20`,
                    border: `2px solid ${TYPE_COLORS[form.type] || finalTheme.accent}40`,
                    borderRadius: 10, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    <div style={{
                      fontSize: 16, fontWeight: 800,
                      color: TYPE_COLORS[form.type] || finalTheme.accent, lineHeight: 1
                    }}>
                      {new Date(form.date + "T00:00:00").getDate()}
                    </div>
                    <div style={{ fontSize: 8, color: finalTheme.muted, fontWeight: 700 }}>
                      {MONTHS[new Date(form.date + "T00:00:00").getMonth()]?.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: finalTheme.text || "var(--app-text)", fontSize: 13 }}>{form.name}</div>
                    <div style={{ fontSize: 12, color: finalTheme.muted, marginTop: 2 }}>
                      {form.type}
                      {form.start ? ` · ${form.start}${form.end ? ` – ${form.end}` : ""}` : ""}
                      {form.client ? ` · 👤 ${form.client}` : ""}
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => { setModal(null); setForm(EMPTY); setErr({}); }} style={{
                  background: finalTheme.bg, border: `1px solid ${finalTheme.border}`, color: finalTheme.text || "var(--app-text)",
                  borderRadius: 10, padding: "10px 18px", cursor: "pointer",
                  fontWeight: 600, fontSize: 13
                }}>{modal === "view" ? "Close" : "Cancel"}</button>
                {modal !== "view" && (
                  <button onClick={save} disabled={saving} style={{ ...Btn, opacity: saving ? 0.7 : 1 }}>
                    {saving ? "Saving…" : modal === "add" ? "💾 Save Event" : "✅ Update Event"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


