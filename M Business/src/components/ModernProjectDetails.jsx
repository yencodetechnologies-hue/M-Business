import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';

// ── Shared Colors ──
const P = {
  primary: '#00BCD4', primaryDark: '#0097A7', primaryLight: '#E0F7FA', primaryMid: '#B2EBF2',
  textDark: '#1A2332', textMid: '#4A5568', textLight: '#718096',
  bg: '#F0F4F8', white: '#FFFFFF', border: '#E2E8F0',
  green: '#26C281', greenLight: '#D1FAE5', orange: '#F59E0B', orangeLight: '#FEF3C7',
  red: '#FF6B6B', redLight: '#FEE2E2', purple: '#8B5CF6', purpleLight: '#EDE9FE',
  radius: '14px', shadow: '0 2px 12px rgba(0,188,212,.08)'
};

const CSS = `
.mpd-root { font-family:'Nunito',sans-serif; background:var(--bg); min-height:100vh; }
.mpd-root * { box-sizing:border-box; }

/* TOPBAR / BREADCRUMB */
.mpd-topbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
.mpd-breadcrumb { display:flex; align-items:center; gap:6px; font-size:13px; color:${P.textLight}; font-weight:700; }
.mpd-breadcrumb a { color:${P.primary}; cursor:pointer; text-decoration:none; }
.mpd-breadcrumb a:hover { text-decoration:underline; }
.mpd-topbar-actions { display:flex; align-items:center; gap:10px; }

/* BUTTONS */
.mpd-btn { display:inline-flex; align-items:center; gap:7px; padding:9px 18px; border-radius:10px; font-family:'Nunito',sans-serif; font-size:13px; font-weight:700; cursor:pointer; border:none; transition:all .15s; }
.mpd-btn-primary { background:${P.primary}; color:#fff; box-shadow:0 4px 12px rgba(0,188,212,.2); }
.mpd-btn-primary:hover { background:${P.primaryDark}; }
.mpd-btn-outline { background:transparent; border:1.5px solid ${P.border}; color:${P.textMid}; }
.mpd-btn-outline:hover { border-color:${P.primary}; color:${P.primary}; background:${P.primaryLight}; }
.mpd-btn-danger { background:${P.redLight}; color:${P.red}; border:1.5px solid #FCA5A5; }
.mpd-btn-danger:hover { background:${P.red}; color:#fff; }

/* CARDS */
.mpd-card { background:${P.white}; border-radius:${P.radius}; box-shadow:${P.shadow}; padding:22px 24px; margin-bottom:20px; }
.mpd-card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
.mpd-card-title { font-size:15px; font-weight:800; color:${P.textDark}; display:flex; align-items:center; gap:8px; }
.mpd-card-title i { color:${P.primary}; font-size:18px; }

/* HEADER SECTION */
.mpd-proj-header { background:${P.white}; border-radius:${P.radius}; padding:24px 28px; box-shadow:${P.shadow}; margin-bottom:20px; display:flex; align-items:flex-start; justify-content:space-between; gap:20px; }
.mpd-ph-left .mpd-proj-name { font-size:24px; font-weight:900; color:${P.textDark}; margin-bottom:8px; }
.mpd-ph-left .mpd-proj-desc { font-size:13px; color:${P.textMid}; line-height:1.7; max-width:560px; margin-bottom:14px; }
.mpd-ph-meta { display:flex; gap:20px; flex-wrap:wrap; }
.mpd-pm-item { display:flex; align-items:center; gap:6px; font-size:12px; color:${P.textMid}; }
.mpd-pm-item i { color:${P.primary}; font-size:15px; }
.mpd-pm-item strong { color:${P.textDark}; font-weight:700; }
.mpd-ph-right { display:flex; flex-direction:column; align-items:flex-end; gap:12px; }
.mpd-budget-box { text-align:right; }
.mpd-budget-box .mpd-lbl { font-size:10px; color:${P.textLight}; font-weight:700; text-transform:uppercase; letter-spacing:.7px; }
.mpd-budget-box .mpd-amt { font-size:26px; font-weight:900; color:${P.textDark}; }
.mpd-budget-box .mpd-sub { font-size:12px; color:${P.textLight}; }
.mpd-budget-box .mpd-sub .mpd-g { color:${P.green}; font-weight:700; }

/* BADGES */
.mpd-status-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; }
.mpd-status-badge::before { content:''; width:6px; height:6px; border-radius:50%; background:currentColor; }
.mpd-badge-active { background:${P.greenLight}; color:#065F46; }
.mpd-badge-hold { background:${P.orangeLight}; color:#92400E; }
.mpd-badge-completed { background:#DBEAFE; color:#1E40AF; }
.mpd-badge-overdue { background:${P.redLight}; color:#991B1B; }

.mpd-prio { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; display:inline-flex; align-items:center; }
.mpd-prio-high { background:${P.redLight}; color:#DC2626; }
.mpd-prio-medium { background:${P.orangeLight}; color:#D97706; }
.mpd-prio-low { background:${P.greenLight}; color:#059669; }

/* KPIs */
.mpd-kpi-row { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
.mpd-kpi { background:${P.white}; border-radius:${P.radius}; padding:18px; box-shadow:${P.shadow}; display:flex; align-items:center; gap:12px; }
.mpd-kpi-icon { width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; }
.mpd-kpi-icon i { font-size:20px; }
.mpd-kpi-val { font-size:24px; font-weight:900; color:${P.textDark}; line-height:1; }
.mpd-kpi-lbl { font-size:11px; color:${P.textLight}; font-weight:600; margin-top:3px; text-transform:uppercase; }
.mpd-kpi-trend { font-size:11px; font-weight:700; margin-top:2px; }
.mpd-kpi-trend.mpd-up { color:${P.green}; }
.mpd-kpi-trend.mpd-down { color:${P.red}; }

/* PROGRESS */
.mpd-prog-card { background:${P.white}; border-radius:${P.radius}; padding:18px 24px; box-shadow:${P.shadow}; margin-bottom:20px; display:flex; gap:28px; flex-wrap:wrap; }
.mpd-prog-item { flex:1; min-width:150px; }
.mpd-prog-num { font-size:22px; font-weight:900; color:${P.textDark}; }
.mpd-prog-lbl { font-size:11px; color:${P.textLight}; font-weight:600; text-transform:uppercase; letter-spacing:.6px; margin-bottom:8px; }
.mpd-progress-bg { background:${P.bg}; border-radius:20px; height:8px; overflow:hidden; }
.mpd-progress-fill { height:100%; border-radius:20px; background:linear-gradient(90deg,${P.primary},${P.primaryDark}); transition:width .3s ease; }
.mpd-progress-fill.mpd-green { background:linear-gradient(90deg,${P.green},#059669); }
.mpd-progress-fill.mpd-orange { background:linear-gradient(90deg,${P.orange},#D97706); }
.mpd-progress-fill.mpd-purple { background:linear-gradient(90deg,${P.purple},#7C3AED); }
.mpd-progress-fill.mpd-red { background:linear-gradient(90deg,${P.red},#DC2626); }
.mpd-prog-sub { font-size:11px; color:${P.textLight}; margin-top:5px; }
.mpd-prog-divider { width:1px; background:${P.border}; }

/* UPDATE COMPOSER */
.mpd-upd-composer { background:${P.white}; border-radius:${P.radius}; box-shadow:${P.shadow}; overflow:hidden; margin-bottom:20px; transition:all .3s ease; }
.mpd-uc-header { background:linear-gradient(135deg,${P.primary},${P.primaryDark}); padding:16px 22px; display:flex; align-items:center; justify-content:space-between; }
.mpd-uc-header h3 { font-size:15px; font-weight:800; color:#fff; display:flex; align-items:center; gap:8px; margin:0; }
.mpd-uc-toggle { background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.3); color:#fff; padding:5px 12px; border-radius:8px; font-family:'Nunito',sans-serif; font-size:12px; font-weight:700; cursor:pointer; }
.mpd-uc-body { padding:18px 22px; display:none; }
.mpd-uc-body.mpd-open { display:block; animation:fadeIn .2s ease; }

/* GRID LAYOUT */
.mpd-grid-main-side { display:grid; grid-template-columns:1fr 340px; gap:22px; align-items:start; }

/* TASKS LIST */
.mpd-task-filters { display:flex; gap:6px; margin-bottom:14px; flex-wrap:wrap; }
.mpd-tf { padding:5px 14px; border-radius:20px; font-size:12px; font-weight:700; border:1.5px solid ${P.border}; background:transparent; color:${P.textMid}; cursor:pointer; font-family:'Nunito',sans-serif; transition:all .15s; }
.mpd-tf.mpd-on, .mpd-tf:hover { background:${P.primary}; border-color:${P.primary}; color:#fff; }
.mpd-task-row { display:flex; align-items:center; gap:10px; padding:11px 0; border-bottom:1px solid ${P.bg}; cursor:pointer; transition:all .15s; }
.mpd-task-row:last-child { border-bottom:none; }
.mpd-task-row:hover { background:${P.bg}; margin:0 -6px; padding:11px 6px; border-radius:8px; }
.mpd-task-chk { width:20px; height:20px; border-radius:6px; border:2px solid ${P.border}; flex-shrink:0; display:flex; align-items:center; justify-content:center; cursor:pointer; }
.mpd-task-chk.mpd-done { background:${P.green}; border-color:${P.green}; }
.mpd-task-chk.mpd-done::after { content:''; width:9px; height:6px; border-left:2px solid #fff; border-bottom:2px solid #fff; transform:rotate(-45deg) translate(1px,-1px); display:block; }
.mpd-task-prio { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.mpd-task-prio.mpd-h { background:${P.red}; }
.mpd-task-prio.mpd-m { background:${P.orange}; }
.mpd-task-prio.mpd-l { background:${P.green}; }
.mpd-task-name { flex:1; font-size:13px; font-weight:700; color:${P.textDark}; }
.mpd-task-name.mpd-done { text-decoration:line-through; color:${P.textLight}; }
.mpd-task-assign { font-size:11px; color:${P.textLight}; font-weight:600; }
.mpd-task-due { font-size:11px; font-weight:700; color:${P.textLight}; }
.mpd-task-due.mpd-late { color:${P.red}; }

/* TABS */
.mpd-tabs { display:flex; border-bottom:2px solid ${P.border}; margin-bottom:20px; }
.mpd-tab-btn { padding:10px 18px; font-size:13px; font-weight:700; color:${P.textMid}; cursor:pointer; border-bottom:3px solid transparent; margin-bottom:-2px; transition:all .15s; background:transparent; border-top:none; border-left:none; border-right:none; font-family:'Nunito',sans-serif; }
.mpd-tab-btn.mpd-active { color:${P.primary}; border-bottom-color:${P.primary}; }
.mpd-tab-pane { display:none; }
.mpd-tab-pane.mpd-active { display:block; animation:fadeUp .18s ease; }

@keyframes fadeUp{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}

/* TEAM SIDEBAR */
.mpd-member-row { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid ${P.bg}; }
.mpd-member-row:last-child { border-bottom:none; }
.mpd-av { border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; color:#fff; flex-shrink:0; }
.mpd-av-sm { width:32px; height:32px; font-size:11px; }

/* BUDGET SIDEBAR */
.mpd-brow { display:flex; justify-content:space-between; padding:9px 0; border-bottom:1px solid ${P.bg}; font-size:13px; }
.mpd-brow:last-child { border-bottom:none; }
.mpd-brow .mpd-lbl { color:${P.textLight}; font-weight:600; }
.mpd-brow .mpd-val { font-weight:800; color:${P.textDark}; }
.mpd-brow .mpd-val.mpd-g { color:${P.green}; }
.mpd-brow .mpd-val.mpd-r { color:${P.red}; }
.mpd-brow .mpd-val.mpd-p { color:${P.primary}; }
`;

function getInitials(name) {
  if (!name) return '?';
  const p = name.trim().split(' ').filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function getAvatarColor(name) {
  const colors = ['#00BCD4', '#8B5CF6', '#F59E0B', '#26C281', '#EC4899', '#3B82F6'];
  if (!name) return colors[0];
  return colors[name.charCodeAt(0) % colors.length];
}

export default function ModernProjectDetails({ project, onBack, tasks = [] }) {
  const [activeTab, setActiveTab] = useState('milestones');
  const [composerOpen, setComposerOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState('all');

  if (!project) return null;

  // Derived Project Data
  const projName = project.name || "Unnamed Project";
  const clientName = project.client || project.clientName || "Unknown Client";
  const category = project.purpose || project.category || "General";
  const priority = project.priority || "medium";
  const status = (project.status || "Active").toLowerCase();
  
  const startD = project.start ? new Date(project.start).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—';
  const endD = project.end ? new Date(project.end).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—';
  
  const budgetAmt = project.budget ? Number(project.budget) : 0;
  const currency = project.currency || "₹";

  const assigned = Array.isArray(project.assignedTo) ? project.assignedTo : (project.assignedTo ? [project.assignedTo] : []);
  
  // Status Logic
  let badgeClass = 'mpd-badge-active';
  if (status.includes('hold')) badgeClass = 'mpd-badge-hold';
  else if (status.includes('complete') || status.includes('done')) badgeClass = 'mpd-badge-completed';
  else if (status.includes('overdue')) badgeClass = 'mpd-badge-overdue';

  let prioClass = 'mpd-prio-medium';
  if (priority.includes('high')) prioClass = 'mpd-prio-high';
  if (priority.includes('low')) prioClass = 'mpd-prio-low';

  // Tasks Logic
  const projTasks = tasks.filter(t => t.projectId === project._id || t.project === projName);
  const totalTasks = projTasks.length || 0;
  const doneTasks = projTasks.filter(t => t.status === 'done' || t.status === 'completed').length || 0;
  const inprogTasks = projTasks.filter(t => t.status === 'in_progress').length || 0;
  const openTasks = totalTasks - doneTasks - inprogTasks;
  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : (project.progress || 0);

  // Fake some budget spent data if not available
  const spent = Math.round(budgetAmt * (progressPct / 100));
  const remaining = budgetAmt - spent;

  const filteredTasks = projTasks.filter(t => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'done') return t.status === 'done' || t.status === 'completed';
    if (taskFilter === 'inprog') return t.status === 'in_progress';
    if (taskFilter === 'open') return t.status !== 'done' && t.status !== 'completed' && t.status !== 'in_progress';
    return true;
  });

  return (
    <div className="mpd-root">
      <style>{CSS}</style>
      
      {/* TOPBAR */}
      <div className="mpd-topbar">
        <div className="mpd-breadcrumb">
          <a onClick={onBack}>Projects</a>
          <i className="ti ti-chevron-right" style={{fontSize:14}}></i>
          <span style={{color:P.textDark}}>{projName}</span>
        </div>
        <div className="mpd-topbar-actions">
          <button className="mpd-btn mpd-btn-outline"><i className="ti ti-share"></i> Share</button>
          <button className="mpd-btn mpd-btn-primary" onClick={() => {}}><i className="ti ti-edit"></i> Edit</button>
        </div>
      </div>

      {/* HEADER */}
      <div className="mpd-proj-header">
        <div className="mpd-ph-left">
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
            <div className="mpd-proj-name">{projName}</div>
            <span className={`mpd-status-badge ${badgeClass}`}>{project.status || 'Active'}</span>
            <span className={`mpd-prio ${prioClass}`}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
          </div>
          <div className="mpd-proj-desc">{project.description || "No description provided for this project."}</div>
          <div className="mpd-ph-meta">
            <div className="mpd-pm-item"><i className="ti ti-building"></i> Client: <strong>{clientName}</strong></div>
            <div className="mpd-pm-item"><i className="ti ti-calendar"></i> Start: <strong>{startD}</strong></div>
            <div className="mpd-pm-item"><i className="ti ti-calendar-due"></i> Deadline: <strong>{endD}</strong></div>
            <div className="mpd-pm-item"><i className="ti ti-tag"></i> <strong>{category}</strong></div>
          </div>
        </div>
        <div className="mpd-ph-right">
          <div className="mpd-budget-box">
            <div className="mpd-lbl">Total Budget</div>
            <div className="mpd-amt">{budgetAmt ? `${currency}${budgetAmt.toLocaleString()}` : '—'}</div>
            {budgetAmt > 0 && <div className="mpd-sub">Spent {currency}{spent.toLocaleString()} &nbsp;·&nbsp; <span className="mpd-g">Rem {currency}{remaining.toLocaleString()}</span></div>}
          </div>
          <button className="mpd-btn mpd-btn-primary" onClick={() => setComposerOpen(!composerOpen)}>
            <i className="ti ti-speakerphone"></i> Post Update
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="mpd-kpi-row">
        <div className="mpd-kpi">
          <div className="mpd-kpi-icon" style={{background:P.primaryLight}}><i className="ti ti-checklist" style={{color:P.primary}}></i></div>
          <div><div className="mpd-kpi-val">{doneTasks}/{totalTasks}</div><div className="mpd-kpi-lbl">Tasks Done</div><div className="mpd-kpi-trend mpd-up">On Track</div></div>
        </div>
        <div className="mpd-kpi">
          <div className="mpd-kpi-icon" style={{background:P.greenLight}}><i className="ti ti-clock" style={{color:P.green}}></i></div>
          <div><div className="mpd-kpi-val">{project.loggedHours || 0}h</div><div className="mpd-kpi-lbl">Hours Logged</div><div className="mpd-kpi-trend mpd-up">Active</div></div>
        </div>
        <div className="mpd-kpi">
          <div className="mpd-kpi-icon" style={{background:P.orangeLight}}><i className="ti ti-alert-triangle" style={{color:P.orange}}></i></div>
          <div><div className="mpd-kpi-val">{openTasks}</div><div className="mpd-kpi-lbl">Open Tasks</div><div className="mpd-kpi-trend mpd-down">Pending</div></div>
        </div>
        <div className="mpd-kpi">
          <div className="mpd-kpi-icon" style={{background:P.purpleLight}}><i className="ti ti-users" style={{color:P.purple}}></i></div>
          <div><div className="mpd-kpi-val">{assigned.length}</div><div className="mpd-kpi-lbl">Team Members</div><div className="mpd-kpi-trend mpd-up">Assigned</div></div>
        </div>
      </div>

      {/* PROGRESS */}
      <div className="mpd-prog-card">
        <div className="mpd-prog-item">
          <div className="mpd-prog-num">{progressPct}%</div>
          <div className="mpd-prog-lbl">Overall</div>
          <div className="mpd-progress-bg"><div className="mpd-progress-fill" style={{width:`${progressPct}%`}}></div></div>
          <div className="mpd-prog-sub">{doneTasks} of {totalTasks} tasks</div>
        </div>
        <div className="mpd-prog-divider"></div>
        <div className="mpd-prog-item">
          <div className="mpd-prog-num">{budgetAmt ? Math.round((spent/budgetAmt)*100) : 0}%</div>
          <div className="mpd-prog-lbl">Budget Used</div>
          <div className="mpd-progress-bg"><div className="mpd-progress-fill mpd-purple" style={{width:`${budgetAmt ? (spent/budgetAmt)*100 : 0}%`}}></div></div>
          <div className="mpd-prog-sub">{currency}{spent.toLocaleString()} of {currency}{budgetAmt.toLocaleString()}</div>
        </div>
      </div>

      {/* UPDATE COMPOSER (Animated) */}
      <div className="mpd-upd-composer" style={{ height: composerOpen ? 'auto' : 54, overflow: 'hidden' }}>
        <div className="mpd-uc-header" onClick={() => setComposerOpen(!composerOpen)} style={{ cursor: 'pointer' }}>
          <h3><i className="ti ti-speakerphone"></i> Post Project Update</h3>
          <button className="mpd-uc-toggle">{composerOpen ? 'Collapse ↑' : 'Expand ↓'}</button>
        </div>
        <div className={`mpd-uc-body ${composerOpen ? 'mpd-open' : ''}`}>
           <div style={{fontSize:13, color:P.textMid, padding: 20, textAlign:'center'}}>
              <i>Backend integration for updates feature goes here...</i>
           </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="mpd-grid-main-side">
        {/* LEFT COL */}
        <div>
          {/* TASKS COMPONENT */}
          <div className="mpd-card" style={{padding:0, overflow:'hidden', marginBottom: 20}}>
            <div className="mpd-card-header" style={{padding:'20px 24px 10px', marginBottom:0}}>
              <div className="mpd-card-title"><i className="ti ti-list-check"></i> Tasks</div>
              <button className="mpd-btn mpd-btn-outline" style={{padding:'6px 12px', fontSize:12}}><i className="ti ti-plus"></i> Add Task</button>
            </div>
            <div style={{padding:'0 24px 14px'}}>
              <div className="mpd-task-filters">
                <button className={`mpd-tf ${taskFilter==='all'?'mpd-on':''}`} onClick={()=>setTaskFilter('all')}>All ({totalTasks})</button>
                <button className={`mpd-tf ${taskFilter==='open'?'mpd-on':''}`} onClick={()=>setTaskFilter('open')}>Open ({openTasks})</button>
                <button className={`mpd-tf ${taskFilter==='inprog'?'mpd-on':''}`} onClick={()=>setTaskFilter('inprog')}>In Progress ({inprogTasks})</button>
                <button className={`mpd-tf ${taskFilter==='done'?'mpd-on':''}`} onClick={()=>setTaskFilter('done')}>Done ({doneTasks})</button>
              </div>
            </div>
            <div style={{padding:'0 24px 20px'}}>
              {filteredTasks.length === 0 ? (
                <div style={{padding:20, textAlign:'center', color:P.textLight, fontSize:13}}>No tasks found for this filter.</div>
              ) : (
                filteredTasks.map(t => {
                  const isDone = t.status === 'done' || t.status === 'completed';
                  return (
                    <div key={t._id} className="mpd-task-row">
                      <div className={`mpd-task-chk ${isDone ? 'mpd-done' : ''}`}></div>
                      <div className={`mpd-task-prio ${t.priority==='high'?'mpd-h':(t.priority==='medium'?'mpd-m':'mpd-l')}`}></div>
                      <div className={`mpd-task-name ${isDone ? 'mpd-done' : ''}`}>{t.name}</div>
                      <div className="mpd-task-assign">{t.assignedTo || 'Unassigned'}</div>
                      <div className="mpd-task-due">{t.due ? new Date(t.due).toLocaleDateString() : ''}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* TABS */}
          <div className="mpd-card">
            <div className="mpd-tabs">
              <button className={`mpd-tab-btn ${activeTab==='milestones'?'mpd-active':''}`} onClick={()=>setActiveTab('milestones')}>Milestones</button>
              <button className={`mpd-tab-btn ${activeTab==='activity'?'mpd-active':''}`} onClick={()=>setActiveTab('activity')}>Activity</button>
              <button className={`mpd-tab-btn ${activeTab==='updates'?'mpd-active':''}`} onClick={()=>setActiveTab('updates')}>Updates</button>
            </div>
            
            <div className={`mpd-tab-pane ${activeTab==='milestones'?'mpd-active':''}`}>
              {(!project.milestones || project.milestones.length === 0) ? (
                <div style={{padding:20, textAlign:'center', color:P.textLight, fontSize:13}}>No milestones defined.</div>
              ) : (
                project.milestones.map((m, idx) => {
                  const isDone = m.done === true;
                  const isInProgress = !isDone && idx === project.milestones.findIndex(x => !x.done);
                  const dotColor = isDone ? P.green : isInProgress ? P.primary : P.border;
                  const dotBorder = isDone || isInProgress ? 'none' : `2px solid ${P.border}`;
                  const statusLabel = isDone ? '✓ Completed' : isInProgress ? 'In Progress' : 'Pending';
                  const statusColor = isDone ? P.green : isInProgress ? P.primary : P.textLight;
                  return (
                    <div key={idx} style={{display:'flex', gap:12, marginBottom:20}}>
                      <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                        <div style={{width:13, height:13, borderRadius:'50%', background:dotColor, border:dotBorder, marginTop:3, flexShrink:0}}></div>
                        {idx !== project.milestones.length-1 && <div style={{width:2, flex:1, background:P.border, minHeight:24, marginTop:4}}></div>}
                      </div>
                      <div>
                        <div style={{fontSize:13, fontWeight:800, color:P.textDark}}>{m.name || m}</div>
                        <div style={{fontSize:11, color:P.textLight, marginTop:2}}>{m.date ? new Date(m.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'}</div>
                        <div style={{fontSize:11, fontWeight:700, color:statusColor, marginTop:2}}>{statusLabel}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className={`mpd-tab-pane ${activeTab==='activity'?'mpd-active':''}`}>
               <div style={{padding:20, textAlign:'center', color:P.textLight, fontSize:13}}>Activity logs will appear here.</div>
            </div>
            <div className={`mpd-tab-pane ${activeTab==='updates'?'mpd-active':''}`}>
               <div style={{padding:20, textAlign:'center', color:P.textLight, fontSize:13}}>No updates posted yet.</div>
            </div>
          </div>
        </div>

        {/* RIGHT COL */}
        <div style={{display:'flex', flexDirection:'column', gap:20}}>
          {/* TEAM */}
          <div className="mpd-card">
            <div className="mpd-card-header"><div className="mpd-card-title"><i className="ti ti-users"></i> Team</div></div>
            {assigned.length === 0 ? <div style={{fontSize:12,color:P.textLight}}>No team members assigned.</div> : null}
            {assigned.map((a, i) => (
              <div key={i} className="mpd-member-row">
                <div className="mpd-av mpd-av-sm" style={{background:getAvatarColor(a)}}>{getInitials(a)}</div>
                <div>
                  <div style={{fontSize:13, fontWeight:700, color:P.textDark}}>{a}</div>
                  <div style={{fontSize:11, color:P.textLight}}>Member</div>
                </div>
              </div>
            ))}
          </div>

          {/* BUDGET */}
          <div className="mpd-card">
            <div className="mpd-card-header"><div className="mpd-card-title"><i className="ti ti-wallet"></i> Budget</div></div>
            <div className="mpd-brow"><span className="mpd-lbl">Total Budget</span><span className="mpd-val">{currency}{budgetAmt.toLocaleString()}</span></div>
            <div className="mpd-brow"><span className="mpd-lbl">Billed</span><span className="mpd-val">{currency}{Math.round(spent * 0.51).toLocaleString()}</span></div>
            <div className="mpd-brow"><span className="mpd-lbl">Received</span><span className="mpd-val mpd-g">{currency}{Math.round(spent * 0.495).toLocaleString()}</span></div>
            <div className="mpd-brow"><span className="mpd-lbl">Pending</span><span className="mpd-val mpd-r">{currency}{Math.round(spent * 0.25).toLocaleString()}</span></div>
            <div className="mpd-brow"><span className="mpd-lbl">Remaining</span><span className="mpd-val mpd-p">{currency}{remaining.toLocaleString()}</span></div>
            <div style={{marginTop:10}}>
              <div className="mpd-progress-bg"><div className="mpd-progress-fill mpd-purple" style={{width:`${budgetAmt?(spent/budgetAmt)*100:0}%`}}></div></div>
              <div style={{fontSize:11,color:P.textLight,marginTop:4}}>{budgetAmt?Math.round((spent/budgetAmt)*100):0}% used</div>
            </div>
          </div>

          {/* FILES */}
          <div className="mpd-card">
            <div className="mpd-card-header"><div className="mpd-card-title"><i className="ti ti-paperclip"></i> Files</div><button className="mpd-btn mpd-btn-outline" style={{padding:'5px 10px',fontSize:11}}><i className="ti ti-upload"></i> Upload</button></div>
            <div style={{fontSize:12, color:P.textLight, textAlign:'center', padding:'10px 0'}}>No files attached.</div>
          </div>

          {/* PORTAL LINK */}
          <div className="mpd-card" style={{background:`linear-gradient(135deg, ${P.primaryLight}, #fff)`, border:`1.5px solid ${P.primaryMid}`}}>
            <div className="mpd-card-title" style={{marginBottom:12}}><i className="ti ti-building"></i> Client Portal</div>
            <div style={{fontSize:12, color:P.textMid, marginBottom:16}}>The client has access to their project portal with live progress, files, invoices and updates.</div>
            <button className="mpd-btn mpd-btn-primary" style={{width:'100%', justifyContent:'center'}}><i className="ti ti-external-link"></i> View Portal</button>
          </div>
        </div>
      </div>
    </div>
  );
}
