import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';

// ── palette -------------------------------------------------------
const P = {
  primary: '#00BCD4', primaryDark: '#0097A7', primaryLight: '#E0F7FA', primaryMid: '#B2EBF2',
  textDark: '#1A2332', textMid: '#4A5568', textLight: '#718096',
  bg: '#F0F4F8', white: '#FFFFFF', border: '#E2E8F0',
  green: '#26C281', greenLight: '#D1FAE5',
  orange: '#F59E0B', orangeLight: '#FEF3C7',
  red: '#FF6B6B', redLight: '#FEE2E2',
  purple: '#8B5CF6', purpleLight: '#EDE9FE',
  radius: '14px', shadow: '0 2px 12px rgba(0,188,212,.08)', shadowLg: '0 8px 32px rgba(0,188,212,.14)',
};

// ── CSS ------------------------------------------------------------
const CSS = `
.epd2 * { box-sizing:border-box; }
.epd2 { font-family:'Nunito',sans-serif; }

/* BREADCRUMB */
.epd2-bc { display:flex; align-items:center; gap:6px; font-size:13px; color:${P.textLight}; margin-bottom:20px; font-weight:700; }
.epd2-bc a { color:${P.primary}; cursor:pointer; }
.epd2-bc a:hover { text-decoration:underline; }

/* HERO */
.epd2-hero { background:linear-gradient(135deg,${P.primary},${P.primaryDark}); border-radius:${P.radius}; padding:22px 26px; margin-bottom:20px; }
.epd2-hero h1 { font-size:22px; font-weight:900; color:#fff; margin:0 0 4px; }
.epd2-hero-sub { font-size:13px; color:rgba(255,255,255,.8); margin-bottom:14px; }
.epd2-hero-meta { display:flex; gap:18px; margin-bottom:14px; flex-wrap:wrap; }
.epd2-meta-item { display:flex; align-items:center; gap:6px; font-size:12px; color:rgba(255,255,255,.85); font-weight:600; }
.epd2-meta-item i { font-size:14px; }
.epd2-prog-hero { display:flex; align-items:center; gap:16px; }
.epd2-prog-num { font-size:32px; font-weight:900; color:#fff; }
.epd2-prog-bar-wrap { flex:1; }
.epd2-prog-lbl { font-size:11px; color:rgba(255,255,255,.75); font-weight:700; text-transform:uppercase; letter-spacing:.7px; margin-bottom:6px; }
.epd2-prog-bg { background:rgba(255,255,255,.25); border-radius:20px; height:10px; overflow:hidden; }
.epd2-prog-fill { height:100%; border-radius:20px; background:#fff; transition:width .4s ease; }

/* BADGE (hero) */
.epd2-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; }
.epd2-badge::before { content:""; width:6px; height:6px; border-radius:50%; background:currentColor; }
.epd2-badge-active { background:rgba(255,255,255,.25); color:#fff; }
.epd2-badge-hold { background:${P.orangeLight}; color:#92400E; }
.epd2-badge-completed { background:#DBEAFE; color:#1E40AF; }

/* GRID */
.epd2-grid { display:grid; grid-template-columns:1fr 320px; gap:22px; align-items:start; }
@media(max-width:900px){ .epd2-grid { grid-template-columns:1fr; } }

/* CARD */
.epd2-card { background:${P.white}; border-radius:${P.radius}; box-shadow:${P.shadow}; padding:22px 24px; margin-bottom:18px; }
.epd2-card-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.epd2-card-title { font-size:15px; font-weight:800; color:${P.textDark}; display:flex; align-items:center; gap:8px; }
.epd2-card-title i { color:${P.primary}; font-size:18px; }

/* BUTTONS */
.epd2-btn { display:inline-flex; align-items:center; gap:7px; padding:9px 18px; border-radius:10px; font-family:'Nunito',sans-serif; font-size:13px; font-weight:700; cursor:pointer; border:none; transition:all .15s; }
.epd2-btn-outline { background:transparent; border:1.5px solid ${P.border}; color:${P.textMid}; }
.epd2-btn-outline:hover { border-color:${P.primary}; color:${P.primary}; background:${P.primaryLight}; }
.epd2-btn-primary { background:${P.primary}; color:#fff; box-shadow:0 4px 12px rgba(0,188,212,.2); }
.epd2-btn-primary:hover { background:${P.primaryDark}; }
.epd2-btn-sm { padding:6px 12px; font-size:12px; }

/* UNREAD BANNER */
.epd2-banner { background:${P.primaryLight}; border:1.5px solid ${P.primaryMid}; border-radius:${P.radius}; padding:14px 18px; margin-bottom:18px; display:flex; align-items:center; gap:12px; }

/* UPDATE CARDS */
.epd2-uf { background:${P.white}; border-radius:${P.radius}; box-shadow:${P.shadow}; overflow:hidden; margin-bottom:14px; border-left:4px solid ${P.primary}; cursor:pointer; transition:box-shadow .2s; }
.epd2-uf.ms { border-left-color:${P.green}; }
.epd2-uf.bl { border-left-color:${P.red}; }
.epd2-uf.gn { border-left-color:${P.orange}; }
.epd2-uf.dl { border-left-color:${P.purple}; }
.epd2-uf.unread { box-shadow:0 4px 20px rgba(0,188,212,.18); }
.epd2-uf:hover { box-shadow:${P.shadowLg}; }
.epd2-uf-inner { padding:16px 18px; }
.epd2-uf-top { display:flex; align-items:center; gap:8px; margin-bottom:10px; flex-wrap:wrap; }
.epd2-uf-badge { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; display:inline-flex; align-items:center; gap:5px; }
.epd2-uf-badge.prog { background:${P.primaryLight}; color:${P.primaryDark}; }
.epd2-uf-badge.ms   { background:${P.greenLight}; color:#065F46; }
.epd2-uf-badge.bl   { background:${P.redLight}; color:#991B1B; }
.epd2-uf-badge.gn   { background:${P.orangeLight}; color:#92400E; }
.epd2-uf-badge.dl   { background:${P.purpleLight}; color:#5B21B6; }
.epd2-uf-new { background:${P.red}; color:#fff; font-size:10px; font-weight:800; padding:2px 8px; border-radius:20px; margin-left:auto; }
.epd2-uf-internal { background:${P.redLight}; color:#991B1B; font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px; }
.epd2-uf-title { font-size:14px; font-weight:800; color:${P.textDark}; margin-bottom:7px; line-height:1.3; }
.epd2-uf-body { font-size:13px; color:${P.textMid}; line-height:1.6; }
.epd2-uf-prog-box { background:${P.bg}; border-radius:10px; padding:11px 14px; margin:10px 0; }
.epd2-uf-ms-box { display:flex; align-items:center; gap:10px; background:${P.greenLight}; border-radius:10px; padding:10px 14px; margin:10px 0; }
.epd2-uf-blocker-box { background:${P.redLight}; border:1.5px solid #FCA5A5; border-radius:10px; padding:10px 14px; margin:10px 0; font-size:12px; font-weight:700; color:#991B1B; display:flex; align-items:center; gap:8px; }
.epd2-uf-atts { display:flex; flex-wrap:wrap; gap:6px; margin:8px 0; }
.epd2-uf-att { display:inline-flex; align-items:center; gap:6px; background:${P.bg}; border:1.5px solid ${P.border}; border-radius:8px; padding:5px 10px; font-size:11px; font-weight:700; color:${P.textDark}; cursor:pointer; }
.epd2-uf-att:hover { background:${P.primaryLight}; border-color:${P.primary}; color:${P.primary}; }
.epd2-uf-att i { font-size:13px; color:${P.primary}; }
.epd2-uf-footer { display:flex; align-items:center; justify-content:space-between; padding-top:10px; border-top:1px solid ${P.bg}; margin-top:8px; }
.epd2-uf-from { display:flex; align-items:center; gap:7px; font-size:12px; color:${P.textMid}; font-weight:600; }
.epd2-uf-date { font-size:11px; color:${P.textLight}; }

/* PROGRESS BAR */
.epd2-pb-bg { background:${P.bg}; border-radius:20px; height:8px; overflow:hidden; }
.epd2-pb-fill { height:100%; border-radius:20px; background:linear-gradient(90deg,${P.primary},${P.primaryDark}); }

/* TASKS */
.epd2-task-row { display:flex; align-items:center; gap:10px; padding:11px 0; border-bottom:1px solid ${P.bg}; }
.epd2-task-row:last-child { border-bottom:none; }
.epd2-task-chk { width:20px; height:20px; border-radius:6px; border:2px solid ${P.border}; flex-shrink:0; display:flex; align-items:center; justify-content:center; cursor:pointer; }
.epd2-task-chk.done { background:${P.green}; border-color:${P.green}; }
.epd2-task-prio { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.epd2-task-prio.h { background:${P.red}; }
.epd2-task-prio.m { background:${P.orange}; }
.epd2-task-prio.l { background:${P.green}; }
.epd2-task-name { flex:1; font-size:13px; font-weight:700; color:${P.textDark}; }
.epd2-task-name.done { text-decoration:line-through; color:${P.textLight}; }
.epd2-task-due { font-size:11px; font-weight:700; color:${P.textLight}; }
.epd2-task-due.late { color:${P.red}; }

/* AVATAR */
.epd2-av { border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; color:#fff; flex-shrink:0; }
.epd2-av-sm { width:28px; height:28px; font-size:10px; }
.epd2-av-md { width:36px; height:36px; font-size:13px; }

/* SIDEBAR INFO ROW */
.epd2-info-row { display:flex; justify-content:space-between; align-items:center; padding:9px 0; border-bottom:1px solid ${P.bg}; font-size:13px; }
.epd2-info-row:last-child { border-bottom:none; }
.epd2-info-lbl { color:${P.textLight}; font-weight:600; }
.epd2-info-val { font-weight:700; color:${P.textDark}; }

/* MILESTONE ROW */
.epd2-ms-row { display:flex; align-items:center; gap:7px; margin-bottom:10px; }
.epd2-ms-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
.epd2-ms-name { flex:1; font-size:12px; color:${P.textDark}; font-weight:600; }
.epd2-ms-val { font-size:11px; font-weight:700; }

/* MODAL */
.epd2-modal-bg { display:none; position:fixed; inset:0; background:rgba(0,0,0,.42); z-index:9999; align-items:center; justify-content:center; backdrop-filter:blur(3px); }
.epd2-modal-bg.open { display:flex; }
.epd2-modal { background:${P.white}; border-radius:18px; padding:28px 30px; width:440px; max-width:95vw; max-height:90vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,.18); animation:epdIn .2s ease; }
@keyframes epdIn { from{opacity:0;transform:translateY(-14px) scale(.97)} to{opacity:1;transform:none} }
.epd2-modal-title { font-size:18px; font-weight:900; color:${P.textDark}; display:flex; align-items:center; gap:10px; margin-bottom:22px; }
.epd2-modal-title i { color:${P.primary}; }
.epd2-modal-footer { display:flex; justify-content:flex-end; gap:10px; margin-top:22px; padding-top:16px; border-top:1px solid ${P.border}; }
.epd2-fg { margin-bottom:16px; }
.epd2-fg label { display:block; font-size:11px; font-weight:800; color:${P.textMid}; text-transform:uppercase; letter-spacing:.7px; margin-bottom:6px; }
.epd2-fg input, .epd2-fg select { width:100%; padding:11px 14px; border:1.5px solid ${P.border}; border-radius:10px; font-family:'Nunito',sans-serif; font-size:14px; color:${P.textDark}; background:${P.bg}; outline:none; transition:border .15s; }
.epd2-fg input:focus, .epd2-fg select:focus { border-color:${P.primary}; background:#fff; }

/* TOAST */
.epd2-toasts { position:fixed; bottom:24px; right:24px; z-index:99999; display:flex; flex-direction:column; gap:10px; pointer-events:none; }
.epd2-toast { background:${P.textDark}; color:#fff; padding:13px 20px; border-radius:12px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:10px; box-shadow:0 8px 24px rgba(0,0,0,.2); animation:epdToast .22s ease; min-width:220px; pointer-events:all; }
@keyframes epdToast { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:none} }
.epd2-toast i { font-size:17px; }
.epd2-toast.success i { color:${P.green}; }
.epd2-toast.error i { color:${P.red}; }

@keyframes spin2 { to { transform:rotate(360deg) } }
`;

// ── helpers -------------------------------------------------------
function getInitials(name) {
  if (!name) return '?';
  const p = name.trim().split(' ').filter(Boolean);
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
}

const AV_COLORS = ['#00BCD4', '#8B5CF6', '#F59E0B', '#26C281', '#EC4899', '#3B82F6', '#EF4444', '#10B981'];
function avColor(name, i = 0) {
  if (!name) return AV_COLORS[i % AV_COLORS.length];
  return AV_COLORS[(name.charCodeAt(0) + i) % AV_COLORS.length];
}

function fmtDate(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysLeft(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - Date.now()) / (1000 * 60 * 60 * 24));
}

function calcPct(project, pTasks) {
  const s = (project.status || '').toLowerCase();
  if (['done', 'completed', 'delivered'].includes(s)) return 100;
  return Number(project.progress) || 0;
}

function isLate(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

// ── UPDATE TYPE CONFIG ---------------------------------------------
const UPDATE_TYPES = {
  progress: { cls: 'prog', border: 'pr', icon: 'ti-chart-line', label: 'Progress' },
  milestone: { cls: 'ms', border: 'ms', icon: 'ti-flag', label: 'Milestone' },
  blocker: { cls: 'bl', border: 'bl', icon: 'ti-alert-triangle', label: 'Blocker' },
  general: { cls: 'gn', border: 'gn', icon: 'ti-speakerphone', label: 'General' },
  delivery: { cls: 'dl', border: 'dl', icon: 'ti-package', label: 'Delivery' },
};

// ── TOAST hook -----------------------------------------------------
function useToast() {
  const [toasts, setToasts] = React.useState([]);
  const addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };
  return { toasts, addToast };
}

// -------------------------------------------------------------------
export default function ModernEmployeeProjectDetails({ project, tasks, user, onBack, onMessageTeam, employeeMode = false, currentEmployeeName = "" }) {
  const { toasts, addToast } = useToast();

  // ── Log Time modal state ------------------------------------------
  const [logModal, setLogModal] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [logHours, setLogHours] = useState('');
  const [logTask, setLogTask] = useState('General / Other');
  const [logNotes, setLogNotes] = useState('');
  const [logSaving, setLogSaving] = useState(false);

  // ── Updates state -------------------------------------------------
  const [updates, setUpdates] = useState([]);
  const readStorageKey = `read_updates_${user?._id || user?.id || 'guest'}_${project._id}`;
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem(readStorageKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Save read state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(readStorageKey, JSON.stringify(Array.from(readIds)));
    } catch (e) {
      console.error("Failed to save read updates to localStorage:", e);
    }
  }, [readIds, readStorageKey]);

  const [updLoading, setUpdLoading] = useState(false);

  // ── Task done state — initialized from real task statuses ----------
  const [doneTasks, setDoneTasks] = useState(() => {
    const done = new Set();
    (tasks || []).forEach(t => {
      if (t.checked || t.completed || ['done', 'completed'].includes((t.status || '').toLowerCase())) {
        done.add(t._id);
      }
    });
    return done;
  });

  if (!project) return null;

  // Derived data
  const projName = project.name || 'Unnamed Project';
  const clientName = project.client || project.clientName || 'Internal';
  const category = project.purpose || project.category || 'Project';
  const myRole = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Employee';
  const startD = fmtDate(project.start);
  const endD = project.end || project.deadline ? fmtDate(project.end || project.deadline) : '—';
  const days = daysLeft(project.end || project.deadline);

  const s = (project.status || '').toLowerCase().replace(/[\s_-]/g, '');
  const isDone = ['done', 'completed', 'delivered', 'closed'].includes(s);
  const isHold = ['onhold', 'hold', 'paused'].includes(s);
  const badgeCls = isDone ? 'epd2-badge-completed' : isHold ? 'epd2-badge-hold' : 'epd2-badge-active';

  // Tasks for this project
  const pTasks = tasks.filter(t => {
    const tProjId = t.projectId && typeof t.projectId === 'object' ? t.projectId._id : t.projectId;
    const tProjName = t.projectId && typeof t.projectId === 'object' ? t.projectId.name : t.project;
    const belongsToProj = (tProjId && (tProjId === project._id || tProjId === project.id)) || (tProjName && tProjName === project.name);
    if (!belongsToProj) return false;

    // Clients can see all project tasks to track progress. Employees only see their own tasks.
    if (user?.role === 'client') return true;

    const myName = (user?.name || '').toLowerCase().trim();
    const myId = user?._id || user?.id || '';
    // assignTo may still hold legacy comma-separated values like "kk, emp"
    // from before tasks became single-assignee — split and match by name.
    const assignToNames = (t.assignTo || '').toLowerCase().split(',').map(n => n.trim());
    return assignToNames.includes(myName) ||
      (t.assignTo === myId) ||
      (Array.isArray(t.assignedTo) && (t.assignedTo.includes(myId) || t.assignedTo.includes(user?.name))) ||
      (t.assignedTo === myId || t.assignedTo === user?.name);
  });
  // Employee mode: split tasks into "mine" vs "others"
  const empName = (currentEmployeeName || user?.name || '').toLowerCase().trim();
  const myTasks = (employeeMode && empName)
    ? pTasks.filter(t => (t.assignTo || '').toLowerCase().includes(empName))
    : pTasks;
  const otherTasks = (employeeMode && empName)
    ? pTasks.filter(t => !(t.assignTo || '').toLowerCase().includes(empName))
    : [];

  const pct = calcPct(project, pTasks);
  const doneCount = pTasks.filter(t => ['done', 'completed'].includes((t.status || '').toLowerCase())).length;
  const openCount = pTasks.length - doneCount;
  // Progress = completed tasks ÷ total tasks assigned to this employee
  const myCompletedCount = myTasks.filter(t =>
    doneTasks.has(t._id) ||
    t.checked ||
    t.completed ||
    ['done', 'completed'].includes((t.status || '').toLowerCase())
  ).length;
  const myTotalCount = myTasks.length;
  const myProgress = myTotalCount > 0 ? Math.round((myCompletedCount / myTotalCount) * 100) : 0;
  const assigned = Array.isArray(project.assignedTo) ? project.assignedTo : (project.assignedTo ? [project.assignedTo] : []);
  const milestones = Array.isArray(project.milestones) && project.milestones.length > 0 ? project.milestones : [
    { name: 'Project Kickoff', done: true, date: project.start || new Date().toISOString() },
    { name: 'Initial Design Phase', done: false, date: '' },
    { name: 'Final Delivery', done: false, date: project.end || project.deadline || '' }
  ];

  // ── Sample updates (fallback when no backend updates exist) --------
  const sampleUpdates = project._id ? [] : [
    { _id: 'u1', type: 'progress', title: 'Project progress updated', body: 'Progress has been updated. Keep up the good work!', postedBy: 'Admin', createdAt: new Date().toISOString(), unread: true },
  ];

  // ── Fetch project details from backend -----------
  useEffect(() => {
    if (!project._id) return;
    setUpdLoading(true);
    axios.get(`${BASE_URL}/api/projects/${project._id}`, {
      headers: { "x-company-id": user?.companyId || "" }
    })
      .then(res => {
        const upds = res.data?.updates || res.data?.notes || [];
        setUpdates(Array.isArray(upds) ? upds : []);
      })
      .catch(err => {
        console.error("Failed to fetch project details:", err.message);
        setUpdates([]);
      })
      .finally(() => setUpdLoading(false));
  }, [project._id, user?.companyId]);

  const getUpdKey = (u) => u._id || u.id || u.date || u.text;
  const displayUpdates = updates.length > 0 ? updates : sampleUpdates;
  const unreadCount = displayUpdates.filter(u => !readIds.has(getUpdKey(u)) && u.unread !== false).length;

  const markRead = (u) => setReadIds(prev => {
    const key = getUpdKey(u);
    if (!key) return prev;
    const n = new Set(prev);
    n.add(key);
    return n;
  });
  const markAllRead = () => setReadIds(new Set(displayUpdates.map(u => getUpdKey(u)).filter(Boolean)));
  const isUnread = (u) => !readIds.has(getUpdKey(u)) && u.unread !== false;

  // ── Log Time save --------------------------------------------------
  const handleSaveLog = async (e) => {
    e.preventDefault();
    if (!logHours) return;
    setLogSaving(true);
    try {
      const hrs = Number(logHours);
      const currentHours = Number(project.loggedHours) || 0;
      await axios.put(`${BASE_URL}/api/projects/${project._id}`, {
        loggedHours: currentHours + hrs,
      });
      setLogModal(false);
      setLogHours('');
      setLogNotes('');
      addToast(`${hrs}h logged successfully!`, 'success');
    } catch (err) {
      addToast('Failed to save log. Try again.', 'error');
    } finally {
      setLogSaving(false);
    }
  };

  // ── Local task toggle ----------------------------------------------
  // ── Task toggle — saves to DB and updates progress -----------------
  const toggleTask = async (taskId) => {
    // Find the task
    const task = myTasks.find(t => t._id === taskId);
    if (!task) return;
    const isCurrentlyDone = task.checked || task.completed ||
      ['done', 'completed'].includes((task.status || '').toLowerCase());
    const newStatus = isCurrentlyDone ? 'in_progress' : 'completed';

    // Optimistic local update
    setDoneTasks(prev => {
      const n = new Set(prev);
      if (isCurrentlyDone) n.delete(taskId);
      else n.add(taskId);
      return n;
    });

    try {
      await axios.put(`${BASE_URL}/api/tasks/${taskId}`, {
        status: newStatus,
        checked: !isCurrentlyDone
      });
      if (!isCurrentlyDone) addToast('Task marked complete! ✓', 'success');
      else addToast('Task marked incomplete', 'success');
    } catch (err) {
      // Revert on failure
      setDoneTasks(prev => {
        const n = new Set(prev);
        if (isCurrentlyDone) n.add(taskId);
        else n.delete(taskId);
        return n;
      });
      addToast('Failed to update task. Try again.', 'error');
    }
  };

  // ── UPDATE type helper ---------------------------------------------
  function getTypeConfig(type) {
    return UPDATE_TYPES[(type || 'general').toLowerCase()] || UPDATE_TYPES.general;
  }

  // ── RENDER ---------------------------------------------------------
  return (
    <div className="epd2">
      <style>{CSS}</style>

      {/* BREADCRUMB */}
      <div className="epd2-bc">
        <a onClick={onBack}>My Projects</a>
        <i className="ti ti-chevron-right" style={{ fontSize: 14 }}></i>
        <span style={{ color: P.textDark }}>{projName}</span>
        <button
          onClick={onBack}
          className="epd2-btn epd2-btn-outline epd2-btn-sm"
          style={{ marginLeft: 'auto' }}
        >
          <i className="ti ti-arrow-left"></i> Back
        </button>
      </div>

      {/* HERO */}
      <div className="epd2-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h1>{projName}</h1>
          <span className={`epd2-badge ${badgeCls}`}>{project.status || 'Active'}</span>
        </div>
        <div className="epd2-hero-sub">
          {clientName} &nbsp;·&nbsp; {category} &nbsp;·&nbsp; Your role:{' '}
          <strong style={{ color: '#fff' }}>{myRole}</strong>
        </div>
        <div className="epd2-hero-meta">
          {(project.start || project.end || project.deadline) && (
            <div className="epd2-meta-item">
              <i className="ti ti-calendar"></i>
              {startD} – {endD}
            </div>
          )}
          <div className="epd2-meta-item">
            <i className="ti ti-checklist"></i>
            {myTasks.length} tasks assigned to you
          </div>
          <div className="epd2-meta-item">
            <i className="ti ti-clock"></i>
            {project.loggedHours || 0}h logged
          </div>
          {unreadCount > 0 && (
            <div className="epd2-meta-item">
              <i className="ti ti-speakerphone"></i>
              {unreadCount} unread update{unreadCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div className="epd2-prog-hero">
          <div className="epd2-prog-num">{employeeMode ? myProgress : pct}%</div>
          <div className="epd2-prog-bar-wrap">
            <div className="epd2-prog-lbl">{employeeMode ? 'Your Task Completion' : 'Overall Project Progress'}</div>
            <div className="epd2-prog-bg">
              <div className="epd2-prog-fill" style={{ width: (employeeMode ? myProgress : pct) + '%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="epd2-grid">

        {/* ── LEFT COLUMN ── */}
        <div>

          {/* UNREAD BANNER */}
          {unreadCount > 0 && (
            <div className="epd2-banner">
              <i className="ti ti-speakerphone" style={{ color: P.primary, fontSize: 20 }}></i>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: P.primaryDark }}>
                  {unreadCount} new update{unreadCount > 1 ? 's' : ''} from admin
                </div>
                <div style={{ fontSize: 12, color: P.textMid }}>Tap each update to mark as read</div>
              </div>
              <button className="epd2-btn epd2-btn-outline epd2-btn-sm" onClick={markAllRead}>
                Mark all read
              </button>
            </div>
          )}

          {/* UPDATES FEED */}
          {updLoading && (
            <div style={{ textAlign: 'center', padding: 20, color: P.textLight, fontSize: 13 }}>
              <div style={{ width: 24, height: 24, border: `3px solid ${P.primaryLight}`, borderTopColor: P.primary, borderRadius: '50%', animation: 'spin2 .8s linear infinite', display: 'inline-block', marginRight: 8 }}></div>
              Loading updates…
            </div>
          )}

          {!updLoading && displayUpdates.map((upd, idx) => {
            const tc = getTypeConfig(upd.type);
            const unrd = isUnread(upd);
            const authorName = upd.author || upd.postedBy || upd.from || 'Admin';
            const postedByInitials = getInitials(authorName);
            const postedByColor = avColor(authorName);

            return (
              <div
                key={upd._id || upd.date || idx}
                className={`epd2-uf ${tc.border} ${unrd ? 'unread' : ''}`}
                onClick={() => markRead(upd)}
              >
                <div className="epd2-uf-inner">
                  {/* Top row: type badge + internal + NEW */}
                  <div className="epd2-uf-top">
                    <span className={`epd2-uf-badge ${tc.cls}`}>
                      <i className={`ti ${tc.icon}`} style={{ fontSize: 11 }}></i> {tc.label}
                    </span>
                    {upd.isInternal && (
                      <span className="epd2-uf-internal">Internal Only</span>
                    )}
                    {unrd && <span className="epd2-uf-new">New</span>}
                  </div>

                  {/* Title */}
                  <div className="epd2-uf-title">{upd.title || upd.subject || 'Project Update'}</div>

                  {/* Body */}
                  <div className="epd2-uf-body">{upd.text || upd.body || upd.message || upd.content || ''}</div>

                  {/* Progress box (if progress update) */}
                  {upd.type === 'progress' && (upd.oldProgress != null || upd.newProgress != null) && (
                    <div className="epd2-uf-prog-box">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: P.textMid }}>Project completion</span>
                        <span style={{ fontSize: 13, fontWeight: 900, color: P.primary }}>
                          {upd.oldProgress}%  {upd.newProgress}%
                        </span>
                      </div>
                      <div className="epd2-pb-bg">
                        <div className="epd2-pb-fill" style={{ width: (upd.newProgress || 0) + '%' }}></div>
                      </div>
                    </div>
                  )}

                  {/* Milestone achieved box */}
                  {upd.type === 'milestone' && upd.milestone && (
                    <div className="epd2-uf-ms-box">
                      <div className="epd2-av epd2-av-sm" style={{ background: P.green }}>
                        <i className="ti ti-check" style={{ fontSize: 12 }}></i>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#065F46' }}>{upd.milestone}</div>
                        {upd.milestoneDate && (
                          <div style={{ fontSize: 11, color: '#059669' }}>{fmtDate(upd.milestoneDate)}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Blocker warning */}
                  {upd.type === 'blocker' && upd.actionNeeded && (
                    <div className="epd2-uf-blocker-box">
                      <i className="ti ti-alert-circle"></i>
                      Action needed from: {upd.actionNeeded}
                    </div>
                  )}

                  {/* Attachments */}
                  {Array.isArray(upd.attachments) && upd.attachments.length > 0 && (
                    <div className="epd2-uf-atts">
                      {upd.attachments.map((att, i) => (
                        <div key={i} className="epd2-uf-att">
                          <i className={`ti ${att.endsWith('.pdf') ? 'ti-file-type-pdf' : att.endsWith('.fig') ? 'ti-photo' : 'ti-paperclip'}`}></i>
                          {att}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="epd2-uf-footer">
                    <div className="epd2-uf-from">
                      <div className="epd2-av epd2-av-sm" style={{ background: postedByColor }}>
                        {postedByInitials}
                      </div>
                      {authorName} · Admin
                    </div>
                    <div className="epd2-uf-date">
                      {upd.date || upd.createdAt ? fmtDate(upd.date || upd.createdAt) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {!updLoading && displayUpdates.length === 0 && (
            <div style={{ background: P.white, borderRadius: P.radius, padding: '20px 24px', marginBottom: 18, textAlign: 'center', color: P.textLight, fontSize: 13, boxShadow: P.shadow }}>
              <i className="ti ti-speakerphone" style={{ fontSize: 28, color: P.primaryMid, display: 'block', marginBottom: 8 }}></i>
              No updates posted for this project yet.
            </div>
          )}

          {/* MY TASKS CARD */}
          {user?.role !== 'client' && (
            <div className="epd2-card">
              <div className="epd2-card-hdr">
                <div className="epd2-card-title">
                  <i className="ti ti-checklist"></i>My Tasks on this Project
                </div>
                <button
                  className="epd2-btn epd2-btn-outline epd2-btn-sm"
                  onClick={() => setLogModal(true)}
                >
                  <i className="ti ti-clock"></i> Log Time
                </button>
              </div>

              {myTasks.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: P.textLight, fontSize: 13 }}>
                  No tasks assigned to you on this project.
                </div>
              ) : (
                myTasks.map((t, i) => {
                  const tid = t._id || t.id || i;
                  const isDoneT = doneTasks.has(tid) || ['done', 'completed'].includes((t.status || '').toLowerCase());
                  const pri = (t.priority || 'low').toLowerCase();
                  const priCls = pri === 'high' ? 'h' : pri === 'medium' ? 'm' : 'l';
                  const dueStr = t.due || t.dueDate || t.deadline || '';
                  const late = !isDoneT && isLate(dueStr);
                  return (
                    <div key={tid} className="epd2-task-row">
                      <div
                        className={`epd2-task-chk ${isDoneT ? 'done' : ''}`}
                        onClick={() => toggleTask(tid)}
                      >
                        {isDoneT && <span style={{ color: '#fff', fontSize: 9, fontWeight: 900 }}>Yes</span>}
                      </div>
                      <div className={`epd2-task-prio ${priCls}`}></div>
                      <div className={`epd2-task-name ${isDoneT ? 'done' : ''}`}>{t.name || t.title}</div>
                      <div
                        className={`epd2-task-due ${late ? 'late' : ''}`}
                        style={isDoneT ? { color: P.green } : {}}
                      >
                        {isDoneT ? 'Done' : dueStr ? new Date(dueStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>


        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* PROJECT INFO */}
          <div className="epd2-card">
            <div className="epd2-card-title" style={{ marginBottom: 14 }}>
              <i className="ti ti-layout-kanban"></i>Project Info
            </div>
            <div className="epd2-info-row">
              <span className="epd2-info-lbl">Status</span>
              <span className={`epd2-badge ${isDone ? 'epd2-badge-completed' : isHold ? 'epd2-badge-hold' : 'epd2-badge-active'}`} style={{ fontSize: 11 }}>
                {project.status || 'Active'}
              </span>
            </div>
            <div className="epd2-info-row">
              <span className="epd2-info-lbl">Deadline</span>
              <span className="epd2-info-val" style={{ color: P.orange }}>{endD}</span>
            </div>
            <div className="epd2-info-row">
              <span className="epd2-info-lbl">Days left</span>
              <span className="epd2-info-val" style={{ color: days !== null && days < 14 ? P.red : P.green }}>
                {days !== null ? (days > 0 ? days + ' days' : 'Overdue') : '—'}
              </span>
            </div>
            <div className="epd2-info-row">
              <span className="epd2-info-lbl">My tasks</span>
              <span className="epd2-info-val">{openCount} open · {doneCount} done</span>
            </div>
            {/* Client/manager contact details are hidden from plain employees — only managers/admins should see this */}
            {user?.role !== 'employee' && (project.contactPersonName || project.manager) && (
              <div className="epd2-info-row">
                <span className="epd2-info-lbl">Contact</span>
                <span className="epd2-info-val" style={{ fontWeight: 700 }}>{project.contactPersonName || project.manager}</span>
              </div>
            )}
            {user?.role !== 'employee' && project.contactPersonNo && (
              <div className="epd2-info-row">
                <span className="epd2-info-lbl">Phone</span>
                <span className="epd2-info-val">
                  <a href={`tel:${project.contactPersonNo}`} style={{ color: 'inherit', textDecoration: 'none' }}>{project.contactPersonNo}</a>
                </span>
              </div>
            )}
            {user?.role !== 'employee' && (project.contactEmail || project.clientEmail || user?.email) && (
              <div className="epd2-info-row">
                <span className="epd2-info-lbl">Email</span>
                <span className="epd2-info-val" style={{ fontSize: 11, wordBreak: 'break-all' }}>
                  <a href={`mailto:${project.contactEmail || project.clientEmail || user?.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {project.contactEmail || project.clientEmail || user?.email}
                  </a>
                </span>
              </div>
            )}
          </div>

          {/* TEAM */}
          <div className="epd2-card">
            <div className="epd2-card-title" style={{ marginBottom: 14 }}>
              <i className="ti ti-users"></i>Team
            </div>
            {assigned.length === 0 ? (
              <div style={{ fontSize: 12, color: P.textLight, marginBottom: 12 }}>No team members listed.</div>
            ) : (
              assigned.map((a, i) => {
                const isMe = a === (user?.name || '') || a === (user?.email || '');
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div className="epd2-av epd2-av-sm" style={{ background: avColor(a, i) }}>
                      {getInitials(a)}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: P.textDark }}>{a}</div>
                      <div style={{ fontSize: 11, color: P.textLight }}>Member</div>
                    </div>
                    {isMe && (
                      <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, background: P.primaryLight, color: P.primaryDark, padding: '2px 8px', borderRadius: 20 }}>
                        You
                      </span>
                    )}
                  </div>
                );
              })
            )}
            <button className="epd2-btn epd2-btn-outline" onClick={() => { if (onMessageTeam) { onMessageTeam(); } else { addToast('Opening team chat...', 'success'); } }} style={{ width: '100%', justifyContent: 'center', fontSize: 12, marginTop: 4 }}>
              <i className="ti ti-message-circle"></i> Message Team
            </button>
          </div>

          {/* MILESTONES */}
          <div className="epd2-card">
            <div className="epd2-card-title" style={{ marginBottom: 14 }}>
              <i className="ti ti-flag"></i>Milestones
            </div>
            {milestones.length === 0 ? (
              <div style={{ fontSize: 12, color: P.textLight }}>No milestones defined.</div>
            ) : (
              milestones.map((m, i) => {
                const name = m.name || m;
                const isDoneM = m.done === true || m.status === 'done' || m.status === 'completed';
                // The first non-done milestone is "active"
                const firstNotDone = milestones.findIndex(x => !x.done && x.status !== 'done' && x.status !== 'completed');
                const isActive = !isDoneM && i === firstNotDone;
                const dotColor = isDoneM ? P.green : isActive ? P.primary : P.border;
                const dotShadow = isActive ? `0 0 0 3px ${P.primaryMid}` : 'none';
                const valColor = isDoneM ? P.green : isActive ? P.primary : P.textLight;
                const valText = isDoneM ? 'Done' : isActive ? 'Active' : (m.date ? fmtDate(m.date) : '—');
                return (
                  <div key={i} className="epd2-ms-row">
                    <div className="epd2-ms-dot" style={{ background: dotColor, boxShadow: dotShadow }}></div>
                    <div className="epd2-ms-name">{name}</div>
                    <div className="epd2-ms-val" style={{ color: valColor }}>{valText}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── LOG TIME MODAL ── */}
      <div
        className={`epd2-modal-bg ${logModal ? 'open' : ''}`}
        onClick={e => e.target === e.currentTarget && setLogModal(false)}
      >
        <div className="epd2-modal">
          <div className="epd2-modal-title">
            <i className="ti ti-clock"></i> Log Work Time
          </div>
          <form onSubmit={handleSaveLog}>
            <div className="epd2-fg">
              <label>Date</label>
              <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} required />
            </div>
            <div className="epd2-fg">
              <label>Hours</label>
              <input
                type="number" placeholder="e.g. 3.5" step="0.5" min="0.5" max="24"
                value={logHours} onChange={e => setLogHours(e.target.value)} required
              />
            </div>
            <div className="epd2-fg">
              <label>Task</label>
              <select value={logTask} onChange={e => setLogTask(e.target.value)}>
                {pTasks.map((t, i) => <option key={i}>{t.name || t.title}</option>)}
                <option value="General / Other">General / Other</option>
              </select>
            </div>
            <div className="epd2-fg">
              <label>Notes</label>
              <input
                type="text" placeholder="Brief note on work done…"
                value={logNotes} onChange={e => setLogNotes(e.target.value)}
              />
            </div>
            <div className="epd2-modal-footer">
              <button type="button" className="epd2-btn epd2-btn-outline" onClick={() => setLogModal(false)}>
                Cancel
              </button>
              <button type="submit" className="epd2-btn epd2-btn-primary" disabled={logSaving}>
                {logSaving
                  ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin2 .8s linear infinite' }}></div> Saving…</>
                  : <><i className="ti ti-check"></i> Save Log</>
                }
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* TOASTS */}
      <div className="epd2-toasts">
        {toasts.map(t => (
          <div key={t.id} className={`epd2-toast ${t.type}`}>
            <i className={t.type === 'success' ? 'ti ti-circle-check' : 'ti ti-alert-circle'}></i>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
