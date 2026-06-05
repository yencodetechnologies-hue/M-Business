import React, { useState } from 'react';

const primary = '#00BCD4';
const primaryDark = '#0097A7';
const primaryLight = '#E0F7FA';
const primaryMid = '#B2EBF2';
const textDark = '#1A2332';
const textMid = '#4A5568';
const textLight = '#718096';
const bg = '#F0F4F8';
const white = '#FFFFFF';
const border = '#E2E8F0';
const green = '#26C281';
const greenLight = '#D1FAE5';
const orange = '#F59E0B';
const orangeLight = '#FEF3C7';
const red = '#FF6B6B';
const redLight = '#FEE2E2';
const purple = '#8B5CF6';
const purpleLight = '#EDE9FE';
const radius = '14px';
const shadow = '0 2px 12px rgba(0,188,212,.08)';
const shadowLg = '0 8px 32px rgba(0,188,212,.14)';

const css = [
  '.epd-root * { box-sizing:border-box; font-family:Nunito,sans-serif; }',
  '.epd-breadcrumb { display:flex; align-items:center; gap:6px; font-size:13px; color:' + textLight + '; margin-bottom:20px; font-weight:700; }',
  '.epd-breadcrumb a { color:' + primary + '; cursor:pointer; }',
  '.epd-breadcrumb a:hover { text-decoration:underline; }',

  /* HERO */
  '.epd-hero { background:linear-gradient(135deg,' + primary + ',' + primaryDark + '); border-radius:' + radius + '; padding:22px 26px; margin-bottom:20px; }',
  '.epd-hero h1 { font-size:22px; font-weight:900; color:#fff; margin:0 0 4px; }',
  '.epd-hero-sub { font-size:13px; color:rgba(255,255,255,.8); margin-bottom:14px; }',
  '.epd-hero-meta { display:flex; gap:18px; margin-bottom:14px; flex-wrap:wrap; }',
  '.epd-meta-item { display:flex; align-items:center; gap:6px; font-size:12px; color:rgba(255,255,255,.85); font-weight:600; }',
  '.epd-meta-item i { font-size:14px; }',
  '.epd-prog-hero { display:flex; align-items:center; gap:16px; }',
  '.epd-prog-num { font-size:32px; font-weight:900; color:#fff; }',
  '.epd-prog-bar-wrap { flex:1; }',
  '.epd-prog-lbl { font-size:11px; color:rgba(255,255,255,.75); font-weight:700; text-transform:uppercase; letter-spacing:.7px; margin-bottom:6px; }',
  '.epd-prog-bg { background:rgba(255,255,255,.25); border-radius:20px; height:10px; overflow:hidden; }',
  '.epd-prog-fill { height:100%; border-radius:20px; background:#fff; transition:width .4s ease; }',

  /* STATUS BADGE */
  '.epd-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; }',
  '.epd-badge::before { content:""; width:6px; height:6px; border-radius:50%; background:currentColor; }',
  '.epd-badge-active { background:rgba(255,255,255,.25); color:#fff; }',
  '.epd-badge-hold { background:' + orangeLight + '; color:#92400E; }',
  '.epd-badge-completed { background:#DBEAFE; color:#1E40AF; }',

  /* GRID */
  '.epd-grid { display:grid; grid-template-columns:1fr 340px; gap:22px; align-items:start; }',

  /* UNREAD BANNER */
  '.epd-unread-banner { background:' + primaryLight + '; border:1.5px solid ' + primaryMid + '; border-radius:' + radius + '; padding:14px 18px; margin-bottom:18px; display:flex; align-items:center; gap:12px; }',

  /* CARD */
  '.epd-card { background:' + white + '; border-radius:' + radius + '; box-shadow:' + shadow + '; padding:22px 24px; margin-bottom:18px; }',
  '.epd-card-title { font-size:15px; font-weight:800; color:' + textDark + '; display:flex; align-items:center; gap:8px; margin-bottom:14px; }',
  '.epd-card-title i { color:' + primary + '; font-size:18px; }',

  /* BTN */
  '.epd-btn { display:inline-flex; align-items:center; gap:7px; padding:9px 18px; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; border:none; transition:all .15s; font-family:Nunito,sans-serif; }',
  '.epd-btn-outline { background:transparent; border:1.5px solid ' + border + '; color:' + textMid + '; }',
  '.epd-btn-outline:hover { border-color:' + primary + '; color:' + primary + '; background:' + primaryLight + '; }',
  '.epd-btn-primary { background:' + primary + '; color:#fff; }',
  '.epd-btn-primary:hover { background:' + primaryDark + '; }',

  /* UPDATE FEED */
  '.epd-uf-card { background:' + white + '; border-radius:' + radius + '; box-shadow:' + shadow + '; overflow:hidden; margin-bottom:14px; border-left:4px solid ' + primary + '; cursor:pointer; transition:box-shadow .2s; }',
  '.epd-uf-card.ms { border-left-color:' + green + '; }',
  '.epd-uf-card.bl { border-left-color:' + red + '; }',
  '.epd-uf-card.gn { border-left-color:' + orange + '; }',
  '.epd-uf-card.dl { border-left-color:' + purple + '; }',
  '.epd-uf-card.unread { box-shadow:0 4px 20px rgba(0,188,212,.18); }',
  '.epd-uf-card:hover { box-shadow:' + shadowLg + '; }',
  '.epd-uf-inner { padding:16px 18px; }',
  '.epd-uf-top { display:flex; align-items:center; gap:8px; margin-bottom:10px; flex-wrap:wrap; }',
  '.epd-uf-badge { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }',
  '.epd-uf-new { background:' + red + '; color:#fff; font-size:10px; font-weight:800; padding:2px 8px; border-radius:20px; margin-left:auto; }',
  '.epd-uf-title { font-size:14px; font-weight:800; color:' + textDark + '; margin-bottom:7px; line-height:1.3; }',
  '.epd-uf-body { font-size:13px; color:' + textMid + '; line-height:1.6; }',
  '.epd-uf-prog { background:' + bg + '; border-radius:10px; padding:11px 14px; margin:10px 0; }',
  '.epd-uf-ms { display:flex; align-items:center; gap:10px; background:' + greenLight + '; border-radius:10px; padding:10px 14px; margin:10px 0; }',
  '.epd-uf-blocker { background:' + redLight + '; border:1.5px solid #FCA5A5; border-radius:10px; padding:10px 14px; margin:10px 0; font-size:12px; font-weight:700; color:#991B1B; display:flex; align-items:center; gap:8px; }',
  '.epd-uf-footer { display:flex; align-items:center; justify-content:space-between; padding-top:10px; border-top:1px solid ' + bg + '; margin-top:8px; }',
  '.epd-uf-from { display:flex; align-items:center; gap:7px; font-size:12px; color:' + textMid + '; font-weight:600; }',
  '.epd-uf-date { font-size:11px; color:' + textLight + '; }',
  '.epd-internal { background:' + redLight + '; color:#991B1B; font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px; }',
  '.epd-upd-progress { background:' + primaryLight + '; color:' + primaryDark + '; }',
  '.epd-upd-milestone { background:' + greenLight + '; color:#065F46; }',
  '.epd-upd-blocker { background:' + redLight + '; color:#991B1B; }',
  '.epd-upd-general { background:' + orangeLight + '; color:#92400E; }',
  '.epd-upd-delivery { background:' + purpleLight + '; color:#5B21B6; }',

  /* PROGRESS BAR */
  '.epd-progress-bg { background:' + bg + '; border-radius:20px; height:8px; overflow:hidden; }',
  '.epd-progress-fill { height:100%; border-radius:20px; background:linear-gradient(90deg,' + primary + ',' + primaryDark + '); }',

  /* TASKS */
  '.epd-task-row { display:flex; align-items:center; gap:10px; padding:11px 0; border-bottom:1px solid ' + bg + '; }',
  '.epd-task-row:last-child { border-bottom:none; }',
  '.epd-task-chk { width:20px; height:20px; border-radius:6px; border:2px solid ' + border + '; flex-shrink:0; display:flex; align-items:center; justify-content:center; }',
  '.epd-task-chk.done { background:' + green + '; border-color:' + green + '; }',
  '.epd-task-prio { width:7px; height:7px; border-radius:50%; flex-shrink:0; }',
  '.epd-task-prio.h { background:' + red + '; }',
  '.epd-task-prio.m { background:' + orange + '; }',
  '.epd-task-prio.l { background:' + green + '; }',
  '.epd-task-name { flex:1; font-size:13px; font-weight:700; color:' + textDark + '; }',
  '.epd-task-name.done { text-decoration:line-through; color:' + textLight + '; }',
  '.epd-task-due { font-size:11px; font-weight:700; color:' + textLight + '; }',
  '.epd-task-due.late { color:' + red + '; }',

  /* AVATAR */
  '.epd-av { border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; color:#fff; flex-shrink:0; }',
  '.epd-av-sm { width:28px; height:28px; font-size:10px; }',

  /* SIDEBAR INFO */
  '.epd-info-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid ' + bg + '; font-size:13px; }',
  '.epd-info-row:last-child { border-bottom:none; }',
  '.epd-info-lbl { color:' + textLight + '; font-weight:600; }',
  '.epd-info-val { font-weight:700; color:' + textDark + '; }',

  /* MS dot */
  '.epd-ms-row { display:flex; align-items:center; gap:7px; margin-bottom:8px; }',
  '.epd-ms-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }',
  '.epd-ms-name { flex:1; font-size:12px; color:' + textDark + '; font-weight:600; }',
  '.epd-ms-val { font-size:11px; font-weight:700; }',

  /* MODAL */
  '.epd-modal-bg { display:none; position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:9999; align-items:center; justify-content:center; backdrop-filter:blur(3px); }',
  '.epd-modal-bg.open { display:flex; }',
  '.epd-modal { background:' + white + '; border-radius:18px; padding:28px 30px; width:420px; max-width:95vw; max-height:90vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,.18); }',
  '.epd-modal-title { font-size:18px; font-weight:900; color:' + textDark + '; display:flex; align-items:center; gap:10px; margin-bottom:22px; }',
  '.epd-modal-title i { color:' + primary + '; }',
  '.epd-modal-footer { display:flex; justify-content:flex-end; gap:10px; margin-top:22px; padding-top:16px; border-top:1px solid ' + border + '; }',
  '.epd-form-group { margin-bottom:16px; }',
  '.epd-form-group label { display:block; font-size:11px; font-weight:800; color:' + textMid + '; text-transform:uppercase; letter-spacing:.7px; margin-bottom:6px; }',
  '.epd-form-group input, .epd-form-group select { width:100%; padding:11px 14px; border:1.5px solid ' + border + '; border-radius:10px; font-family:Nunito,sans-serif; font-size:14px; color:' + textDark + '; background:' + bg + '; outline:none; }',
  '.epd-form-group input:focus, .epd-form-group select:focus { border-color:' + primary + '; background:#fff; }',
].join('\n');

function getInitials(name) {
  if (!name) return '?';
  const p = name.trim().split(' ').filter(Boolean);
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
}

function getAvatarColor(name) {
  const colors = ['#00BCD4', '#8B5CF6', '#F59E0B', '#26C281', '#EC4899', '#3B82F6'];
  if (!name) return colors[0];
  return colors[name.charCodeAt(0) % colors.length];
}

function calcPct(p, pTasks) {
  const s = (p.status || '').toLowerCase();
  if (s === 'done' || s === 'completed') return 100;
  if (pTasks.length > 0) {
    const done = pTasks.filter(t => ['done', 'completed'].includes((t.status || '').toLowerCase())).length;
    return Math.round((done / pTasks.length) * 100);
  }
  if (s === 'in progress') return 50;
  if (s === 'on hold') return 30;
  return p.progress || 0;
}

function daysLeft(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function ModernEmployeeProjectDetails({ project, tasks, user, onBack }) {
  const [logModal, setLogModal] = useState(false);
  const [unreadIds, setUnreadIds] = useState(new Set(['upd1', 'upd2', 'upd3']));

  if (!project) return null;

  const projName   = project.name || 'Unnamed Project';
  const clientName = project.client || project.clientName || 'Internal';
  const category   = project.purpose || project.category || 'Project';
  const myRole     = user?.role || 'Employee';
  const startD     = project.start ? new Date(project.start).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—';
  const endD       = project.end   ? new Date(project.end).toLocaleDateString('en-IN',   { day:'numeric', month:'short', year:'numeric' }) : project.deadline || '—';
  const days       = daysLeft(project.end || project.deadline);

  const s = (project.status || '').toLowerCase();
  const isDone = s === 'done' || s === 'completed';
  const isHold = s.includes('hold');
  const badgeCls = isDone ? 'epd-badge-completed' : isHold ? 'epd-badge-hold' : 'epd-badge-active';

  const pTasks     = tasks.filter(t => t.project === project.name || t.projectId === project._id || t.projectId === project.id);
  const pct        = calcPct(project, pTasks);
  const doneTasks  = pTasks.filter(t => ['done', 'completed'].includes((t.status || '').toLowerCase())).length;
  const openTasks  = pTasks.length - doneTasks;

  const assigned = Array.isArray(project.assignedTo) ? project.assignedTo : (project.assignedTo ? [project.assignedTo] : []);
  const milestones = Array.isArray(project.milestones) ? project.milestones : [];

  const markRead = (id) => {
    setUnreadIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  };
  const markAllRead = () => setUnreadIds(new Set());
  const unreadCount = unreadIds.size;

  return (
    <div className="epd-root">
      <style>{css}</style>

      {/* BACK ARROW HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ padding: "8px", background: "#E0F2FE", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 20, color: "var(--teal, #0d9488)", display: "flex", alignItems: "center", transition: "all 0.2s" }} title="Back" onMouseEnter={e => e.currentTarget.style.background = "#BAE6FD"} onMouseLeave={e => e.currentTarget.style.background = "#E0F2FE"}>
          <i className="ti ti-arrow-left"></i>
        </button>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>{projName}</div>
      </div>

      {/* HERO */}
      <div className="epd-hero">
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <h1>{projName}</h1>
          <span className={'epd-badge ' + badgeCls}>{project.status || 'Active'}</span>
        </div>
        <div className="epd-hero-sub">
          {clientName} &nbsp;·&nbsp; {category} &nbsp;·&nbsp; Your role: <strong style={{ color:'#fff' }}>{myRole}</strong>
        </div>
        <div className="epd-hero-meta">
          <div className="epd-meta-item"><i className="ti ti-calendar"></i>{startD} – {endD}</div>
          <div className="epd-meta-item"><i className="ti ti-checklist"></i>{pTasks.length} tasks assigned to you</div>
          <div className="epd-meta-item"><i className="ti ti-clock"></i>{project.loggedHours || 0}h logged</div>
          {unreadCount > 0 && <div className="epd-meta-item"><i className="ti ti-speakerphone"></i>{unreadCount} unread updates</div>}
        </div>
        <div className="epd-prog-hero">
          <div className="epd-prog-num">{pct}%</div>
          <div className="epd-prog-bar-wrap">
            <div className="epd-prog-lbl">Overall Project Progress</div>
            <div className="epd-prog-bg"><div className="epd-prog-fill" style={{ width: pct + '%' }}></div></div>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="epd-grid">
        {/* LEFT */}
        <div>
          {/* MY TASKS */}
          <div className="epd-card">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div className="epd-card-title" style={{ margin:0 }}><i className="ti ti-checklist"></i>My Tasks on this Project</div>
              <button className="epd-btn epd-btn-outline" style={{ fontSize:12 }} onClick={() => setLogModal(true)}>
                <i className="ti ti-clock"></i>Log Time
              </button>
            </div>

            {pTasks.length === 0 ? (
              <div style={{ padding:'20px 0', textAlign:'center', color:textLight, fontSize:13 }}>No tasks assigned to you on this project.</div>
            ) : (
              pTasks.map((t, i) => {
                const done = ['done', 'completed'].includes((t.status || '').toLowerCase());
                const pri  = (t.priority || 'low').toLowerCase();
                const priCls = pri === 'high' ? 'h' : pri === 'medium' ? 'm' : 'l';
                return (
                  <div key={t._id || i} className="epd-task-row">
                    <div className={'epd-task-chk' + (done ? ' done' : '')}>
                      {done && <span style={{ color:'#fff', fontSize:9, fontWeight:900 }}>✓</span>}
                    </div>
                    <div className={'epd-task-prio ' + priCls}></div>
                    <div className={'epd-task-name' + (done ? ' done' : '')}>{t.name || t.title}</div>
                    <div className={'epd-task-due' + (!done && t.due ? '' : '')} style={done ? { color: green } : {}}>
                      {done ? 'Done' : (t.due || t.dueDate || '—')}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          {/* PROJECT INFO */}
          <div className="epd-card">
            <div className="epd-card-title"><i className="ti ti-layout-kanban"></i>Project Info</div>
            <div className="epd-info-row">
              <span className="epd-info-lbl">Status</span>
              <span className={'epd-badge ' + (isDone ? 'epd-badge-completed' : isHold ? 'epd-badge-hold' : 'epd-badge-active')} style={{ fontSize:11 }}>{project.status || 'Active'}</span>
            </div>
            <div className="epd-info-row">
              <span className="epd-info-lbl">Deadline</span>
              <span className="epd-info-val" style={{ color: orange }}>{endD}</span>
            </div>
            <div className="epd-info-row">
              <span className="epd-info-lbl">Days left</span>
              <span className="epd-info-val" style={{ color: days && days < 14 ? red : green }}>
                {days !== null ? (days > 0 ? days + ' days' : 'Overdue') : '—'}
              </span>
            </div>
            <div className="epd-info-row">
              <span className="epd-info-lbl">My tasks</span>
              <span className="epd-info-val">{openTasks} open · {doneTasks} done</span>
            </div>
          </div>

          {/* TEAM */}
          <div className="epd-card">
            <div className="epd-card-title"><i className="ti ti-users"></i>Team</div>
            {assigned.length === 0 ? (
              <div style={{ fontSize:12, color:textLight }}>No team members listed.</div>
            ) : (
              assigned.map((a, i) => {
                const isMe = a === (user?.name || '');
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <div className="epd-av epd-av-sm" style={{ background: getAvatarColor(a) }}>{getInitials(a)}</div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:textDark }}>{a}</div>
                      <div style={{ fontSize:11, color:textLight }}>Member</div>
                    </div>
                    {isMe && (
                      <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, background:primaryLight, color:primaryDark, padding:'2px 8px', borderRadius:20 }}>You</span>
                    )}
                  </div>
                );
              })
            )}
            <button className="epd-btn epd-btn-outline" style={{ width:'100%', justifyContent:'center', fontSize:12, marginTop:4 }}>
              <i className="ti ti-message-circle"></i>Message Team
            </button>
          </div>

          {/* MILESTONES */}
          <div className="epd-card">
            <div className="epd-card-title"><i className="ti ti-flag"></i>Milestones</div>
            {milestones.length === 0 ? (
              <div style={{ fontSize:12, color:textLight }}>No milestones defined.</div>
            ) : (
              milestones.map((m, i) => {
                const name = m.name || m;
                const done = m.status === 'done' || m.status === 'completed';
                const active = m.status === 'active' || m.status === 'in progress';
                const dotColor = done ? green : active ? primary : border;
                const valColor = done ? green : active ? primary : textLight;
                const valText  = done ? 'Done' : active ? 'Active' : (m.date ? new Date(m.date).toLocaleDateString() : '—');
                return (
                  <div key={i} className="epd-ms-row">
                    <div className="epd-ms-dot" style={{ background: dotColor, boxShadow: active ? '0 0 0 3px ' + primaryMid : 'none' }}></div>
                    <div className="epd-ms-name">{name}</div>
                    <div className="epd-ms-val" style={{ color: valColor }}>{valText}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* LOG TIME MODAL */}
      <div className={'epd-modal-bg' + (logModal ? ' open' : '')} onClick={e => e.target === e.currentTarget && setLogModal(false)}>
        <div className="epd-modal">
          <div className="epd-modal-title"><i className="ti ti-clock"></i>Log Work Time</div>
          <div className="epd-form-group"><label>Date</label><input type="date" defaultValue={new Date().toISOString().slice(0,10)} /></div>
          <div className="epd-form-group"><label>Hours</label><input type="number" placeholder="e.g. 3.5" step="0.5" min="0.5" max="24" /></div>
          <div className="epd-form-group"><label>Task</label>
            <select>
              {pTasks.map((t,i) => <option key={i}>{t.name || t.title}</option>)}
              <option value="general">General / Other</option>
            </select>
          </div>
          <div className="epd-form-group"><label>Notes</label><input type="text" placeholder="Brief note on work done..." /></div>
          <div className="epd-modal-footer">
            <button className="epd-btn epd-btn-outline" onClick={() => setLogModal(false)}>Cancel</button>
            <button className="epd-btn epd-btn-primary" onClick={() => setLogModal(false)}><i className="ti ti-check"></i>Save Log</button>
          </div>
        </div>
      </div>
    </div>
  );
}
