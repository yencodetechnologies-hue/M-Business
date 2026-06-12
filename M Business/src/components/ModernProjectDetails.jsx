import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';
import ModernEmployeeProjectDetails from './ModernEmployeeProjectDetails';

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

function fmtDetailDate(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function DetailField({ label, value, fullWidth }) {
  return (
    <div style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
      <div style={{ fontSize: 10, fontWeight: 800, color: P.textLight, textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: P.textDark, lineHeight: 1.5, whiteSpace: fullWidth ? 'pre-wrap' : 'normal' }}>{value || '—'}</div>
    </div>
  );
}

export default function ModernProjectDetails({ project, onBack, tasks = [], employees = [], onEdit, onDelete, onLogTime, onUpdate, fetchProjects, fetchTasks, onMessageTeam }) {
  const [activeTab, setActiveTab] = useState('milestones');
  const [composerOpen, setComposerOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState('all');

  // Live state synchronized with backend
  const [currProject, setCurrProject] = useState(project);
  const [currTasks, setCurrTasks] = useState(tasks);
  const [loadingProject, setLoadingProject] = useState(false);

  // Modal / Input states
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskAssignTo, setNewTaskAssignTo] = useState('Unassigned');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  const [updateText, setUpdateText] = useState('');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateType, setUpdateType] = useState('progress');
  const [sendToTeam, setSendToTeam] = useState(true);
  const [sendToClient, setSendToClient] = useState(true);
  const [postingUpdate, setPostingUpdate] = useState(false);

  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [showAddMilestone, setShowAddMilestone] = useState(false);

  const fileInputRef = useRef(null);
  const composerRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showPortalPreview, setShowPortalPreview] = useState(false);

  const loadLatest = useCallback(async () => {
    if (!project?._id) return;
    setLoadingProject(true);
    try {
      const [pRes, tRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/projects/${project._id}`),
        axios.get(`${BASE_URL}/api/tasks`)
      ]);
      if (pRes.data) {
        setCurrProject(pRes.data);
      }
      if (Array.isArray(tRes.data)) {
        setCurrTasks(tRes.data);
      }
    } catch (e) {
      console.error("Error loading project details:", e);
    } finally {
      setLoadingProject(false);
    }
  }, [project?._id]);

  useEffect(() => {
    setCurrProject(project);
  }, [project, project?.loggedHours, project?.progress, project?.status]);

  useEffect(() => {
    setCurrTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    loadLatest();
  }, [loadLatest]);

  if (!currProject) return null;

  // Derived Project Data
  const projName = currProject.name || "Unnamed Project";
  const clientName = currProject.client || currProject.clientName || "Unknown Client";
  const category = currProject.category || currProject.purpose || "General";
  const priority = currProject.priority || "medium";
  const status = (currProject.status || "Active").toLowerCase();
  
  const startD = currProject.start ? new Date(currProject.start).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—';
  const endD = currProject.end || currProject.deadline ? new Date(currProject.end || currProject.deadline).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—';
  
  const budgetAmt = currProject.budget ? Number(currProject.budget) : 0;
  const currency = currProject.currency || "₹";
  const portalSettings = currProject.portalSettings || {};
  const milestoneCount = (currProject.milestones || []).length;

  const assigned = Array.isArray(currProject.assignedTo) ? currProject.assignedTo : (currProject.assignedTo ? [currProject.assignedTo] : []);
  
  // Status Logic
  let badgeClass = 'mpd-badge-active';
  if (status.includes('hold')) badgeClass = 'mpd-badge-hold';
  else if (status.includes('complete') || status.includes('done')) badgeClass = 'mpd-badge-completed';
  else if (status.includes('overdue')) badgeClass = 'mpd-badge-overdue';

  let prioClass = 'mpd-prio-medium';
  if (priority.includes('high')) prioClass = 'mpd-prio-high';
  if (priority.includes('low')) prioClass = 'mpd-prio-low';

  // Tasks Logic
  const projTasks = currTasks.filter(t => t.projectId === currProject._id || t.project === projName || (t.projectId && t.projectId._id === currProject._id));
  const totalTasks = projTasks.length || 0;
  const doneTasks = projTasks.filter(t => t.status === 'done' || t.status === 'completed').length || 0;
  const inprogTasks = projTasks.filter(t => t.status === 'in_progress').length || 0;
  const openTasks = totalTasks - doneTasks - inprogTasks;
const progressPct = totalTasks > 0 
  ? Math.round((doneTasks / totalTasks) * 100) 
  : (currProject.progress || 0);
  // Budget spent data (Real values from backend)
  const billed = currProject.billed || 0;
  const received = currProject.received || 0;
  const pending = currProject.pending || 0;
  const spent = currProject.spent || 0;
  const remaining = budgetAmt > 0 ? (budgetAmt - spent) : 0;
  const budgetUsedPct = budgetAmt > 0 ? Math.round((spent / budgetAmt) * 100) : 0;

  const filteredTasks = projTasks.filter(t => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'done') return t.status === 'done' || t.status === 'completed';
    if (taskFilter === 'inprog') return t.status === 'in_progress';
    if (taskFilter === 'open') return t.status !== 'done' && t.status !== 'completed' && t.status !== 'in_progress';
    return true;
  });

  // Task/Milestone/File Actions
  const handleToggleTask = async (task) => {
    try {
      const isCurrentlyDone = task.status === 'done' || task.status === 'completed';
      const newStatus = isCurrentlyDone ? 'in_progress' : 'completed';
      await axios.put(`${BASE_URL}/api/tasks/${task._id}`, { status: newStatus });
      loadLatest();
      if (onUpdate) onUpdate();
      if (fetchTasks) fetchTasks();
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const getOrCreateGroupId = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/groups`);
      if (res.data && res.data.length > 0) {
        return res.data[0]._id;
      }
      const newGroup = await axios.post(`${BASE_URL}/api/groups`, {
        label: "Tasks",
        color: "#00BCD4"
      });
      return newGroup.data._id;
    } catch (e) {
      console.error("Failed to get/create group:", e);
      return null;
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);
    try {
      const gId = await getOrCreateGroupId();
      if (!gId) {
        alert("Could not find or create a task group.");
        return;
      }

      await axios.post(`${BASE_URL}/api/tasks`, {
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim(),
        priority: newTaskPriority,
        assignTo: newTaskAssignTo,
        date: newTaskDue,
        groupId: gId,
        projectId: currProject._id,
        status: 'Not Started'
      });

      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskPriority('medium');
      setNewTaskAssignTo('Unassigned');
      setNewTaskDue('');
      setShowAddTaskModal(false);

      loadLatest();
      if (onUpdate) onUpdate();
      if (fetchTasks) fetchTasks();
    } catch (err) {
      console.error("Failed to add task:", err);
      alert("Failed to add task.");
    } finally {
      setAddingTask(false);
    }
  };

  const handlePostUpdate = async (e) => {
    e.preventDefault();
    if (!updateText.trim()) return;
    setPostingUpdate(true);
    try {
      const newUpdate = {
        text: updateText.trim(),
        date: new Date().toISOString(),
        author: 'Admin',
        type: updateType
      };

      const updatedUpdates = [newUpdate, ...(currProject.updates || [])];

      await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, {
        updates: updatedUpdates
      });

      setUpdateText('');
      setUpdateType('general');
      setComposerOpen(false);
      loadLatest();
      if (onUpdate) onUpdate();
      if (fetchProjects) fetchProjects();
    } catch (err) {
      console.error("Failed to post update:", err);
      alert("Failed to post update.");
    } finally {
      setPostingUpdate(false);
    }
  };

  const handleToggleMilestone = async (index) => {
    try {
      const updatedMilestones = (currProject.milestones || []).map((m, idx) => {
        if (idx === index) {
          return { ...m, done: !m.done };
        }
        return m;
      });

      await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, {
        milestones: updatedMilestones
      });
      loadLatest();
      if (onUpdate) onUpdate();
      if (fetchProjects) fetchProjects();
    } catch (err) {
      console.error("Failed to toggle milestone:", err);
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!newMilestoneName.trim()) return;
    try {
      const newMilestone = {
        name: newMilestoneName.trim(),
        date: newMilestoneDate || '',
        done: false
      };
      const updatedMilestones = [...(currProject.milestones || []), newMilestone];

      await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, {
        milestones: updatedMilestones
      });

      setNewMilestoneName('');
      setNewMilestoneDate('');
      setShowAddMilestone(false);
      loadLatest();
      if (onUpdate) onUpdate();
      if (fetchProjects) fetchProjects();
    } catch (err) {
      console.error("Failed to add milestone:", err);
      alert("Failed to add milestone.");
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingFile(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${BASE_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const uploadedUrl = res.data.url;
      const newFileObj = {
        name: file.name,
        url: uploadedUrl,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      };

      const updatedFiles = [...(currProject.files || []), newFileObj];
      await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, {
        files: updatedFiles
      });

      loadLatest();
      if (onUpdate) onUpdate();
      if (fetchProjects) fetchProjects();
    } catch (err) {
      console.error("Failed to upload file:", err);
      alert("Failed to upload file. Make sure it's an image (JPG/PNG).");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      const updatedFiles = (currProject.files || []).filter(f => f._id !== fileId);
      await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, {
        files: updatedFiles
      });
      loadLatest();
      if (onUpdate) onUpdate();
      if (fetchProjects) fetchProjects();
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  };

  const handleShare = () => {
    const text = `📂 Project Alert: ${projName}\nStatus: ${currProject.status}\nProgress: ${progressPct}%\nBudget: ${currency}${budgetAmt.toLocaleString()}`;
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

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
          <button className="mpd-btn mpd-btn-outline" onClick={handleShare} style={{gap:6}}><i className="ti ti-share"></i> Share</button>
          <button className="mpd-btn mpd-btn-outline" style={{gap:6}} onClick={() => {
            const text = `Project: ${projName}\nClient: ${clientName}\nStatus: ${currProject.status}\nProgress: ${progressPct}%\nBudget: ${currency}${budgetAmt.toLocaleString()}`;
            const blob = new Blob([text], {type:'text/plain'});
            const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${projName}.txt`; a.click();
          }}><i className="ti ti-download"></i> Export</button>
          <button className="mpd-btn mpd-btn-primary" onClick={() => onEdit ? onEdit(currProject) : null} style={{gap:6}}><i className="ti ti-edit"></i> Edit</button>
          <button className="mpd-btn mpd-btn-danger" style={{gap:6}} onClick={onDelete || (() => window.confirm('Delete this project?'))}><i className="ti ti-trash"></i> Delete</button>
        </div>
      </div>

      {/* HEADER */}
      <div className="mpd-proj-header">
        <div className="mpd-ph-left">
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
            <div className="mpd-proj-name">{projName}</div>
            <span className={`mpd-status-badge ${badgeClass}`}>{currProject.status || 'Active'}</span>
            <span className={`mpd-prio ${prioClass}`}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
          </div>
          <div className="mpd-proj-desc">{currProject.description || "No description provided for this project."}</div>
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
          <button className="mpd-btn mpd-btn-primary" onClick={() => {
            setActiveTab('updates');
            setComposerOpen(true);
            setTimeout(() => {
              composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}>
            <i className="ti ti-speakerphone"></i> Post Update
          </button>
        </div>
      </div>

      {/* ALL PROJECT FIELDS */}
      <div className="mpd-card">
        <div className="mpd-card-header">
          <div className="mpd-card-title"><i className="ti ti-info-circle"></i> Project Information</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px 24px' }}>
          <DetailField label="Client" value={clientName} />
          <DetailField label="Category" value={category} />
          <DetailField label="Status" value={currProject.status || 'Active'} />
          <DetailField label="Priority" value={priority.charAt(0).toUpperCase() + priority.slice(1)} />
          <DetailField label="Start Date" value={fmtDetailDate(currProject.start)} />
          <DetailField label="Deadline" value={fmtDetailDate(currProject.end || currProject.deadline)} />

          <DetailField label="Progress" value={`${currProject.progress ?? progressPct}%`} />

          <DetailField label="Milestones" value={milestoneCount ? `${milestoneCount} defined` : 'None'} />

          <DetailField label="Team Members" value={assigned.length ? assigned.join(', ') : 'Unassigned'} fullWidth={assigned.length > 2} />
          <DetailField label="Description" value={currProject.description || currProject.purpose} fullWidth />
          {budgetAmt > 0 && (
            <>
              <DetailField label="Total Budget" value={`${currency}${budgetAmt.toLocaleString()}`} />
              <DetailField label="Billed" value={`${currency}${billed.toLocaleString()}`} />
              <DetailField label="Received" value={`${currency}${received.toLocaleString()}`} />
              <DetailField label="Pending" value={`${currency}${pending.toLocaleString()}`} />
              <DetailField label="Spent" value={`${currency}${spent.toLocaleString()}`} />
              <DetailField label="Remaining" value={`${currency}${remaining.toLocaleString()}`} />
            </>
          )}
          <DetailField
            label="Client Portal"
            value={portalSettings.enablePortal
              ? [
                  portalSettings.showProgress && 'Progress',
                  portalSettings.showMilestones && 'Milestones',
                  portalSettings.showTeam && 'Team',
                  portalSettings.allowMessages && 'Messages',
                ].filter(Boolean).join(', ') || 'Enabled'
              : 'Disabled'}
            fullWidth
          />
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
          <div><div className="mpd-kpi-val">{currProject.loggedHours || 0}h</div><div className="mpd-kpi-lbl">Hours Logged</div><div className="mpd-kpi-trend mpd-up">Active</div></div>
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
          <div className="mpd-prog-num">{budgetUsedPct}%</div>
          <div className="mpd-prog-lbl">Budget Used</div>
          <div className="mpd-progress-bg"><div className="mpd-progress-fill mpd-purple" style={{width:`${budgetUsedPct}%`}}></div></div>
          <div className="mpd-prog-sub">{currency}{spent.toLocaleString()} of {currency}{budgetAmt.toLocaleString()}</div>
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
              <button className="mpd-btn mpd-btn-outline" onClick={() => setShowAddTaskModal(true)} style={{padding:'6px 12px', fontSize:12}}><i className="ti ti-plus"></i> Add Task</button>
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
                    <div key={t._id} className="mpd-task-row" onClick={() => handleToggleTask(t)}>
                      <div className={`mpd-task-chk ${isDone ? 'mpd-done' : ''}`}></div>
                      <div className={`mpd-task-prio ${t.priority==='high'?'mpd-h':(t.priority==='medium'?'mpd-m':'mpd-l')}`}></div>
                      <div className={`mpd-task-name ${isDone ? 'mpd-done' : ''}`}>{t.title || t.name}</div>
                      <div className="mpd-task-assign">{t.assignTo || t.assignedTo || 'Unassigned'}</div>
                      <div className="mpd-task-due">{t.date ? new Date(t.date).toLocaleDateString('en-IN', {day:'numeric',month:'short'}) : ''}</div>
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
              {(!currProject.milestones || currProject.milestones.length === 0) ? (
                <div style={{padding:20, textAlign:'center', color:P.textLight, fontSize:13}}>No milestones defined.</div>
              ) : (
                currProject.milestones.map((m, idx) => {
                  const isDone = m.done === true;
                  const isInProgress = !isDone && idx === currProject.milestones.findIndex(x => !x.done);
                  const dotColor = isDone ? P.green : isInProgress ? P.primary : P.border;
                  const dotBorder = isDone || isInProgress ? 'none' : `2px solid ${P.border}`;
                  const statusLabel = isDone ? '✓ Completed' : isInProgress ? 'In Progress' : 'Pending';
                  const statusColor = isDone ? P.green : isInProgress ? P.primary : P.textLight;
                  return (
                    <div key={idx} onClick={() => handleToggleMilestone(idx)} style={{display:'flex', gap:12, marginBottom:20, cursor: 'pointer'}}>
                      <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                        <div style={{width:13, height:13, borderRadius:'50%', background:dotColor, border:dotBorder, marginTop:3, flexShrink:0}}></div>
                        {idx !== currProject.milestones.length-1 && <div style={{width:2, flex:1, background:P.border, minHeight:24, marginTop:4}}></div>}
                      </div>
                      <div>
                        <div style={{fontSize:13, fontWeight:800, color:P.textDark}}>{m.name}</div>
                        <div style={{fontSize:11, color:P.textLight, marginTop:2}}>{m.date ? new Date(m.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'}</div>
                        <div style={{fontSize:11, fontWeight:700, color:statusColor, marginTop:2}}>{statusLabel}</div>
                      </div>
                    </div>
                  );
                })
              )}

              {showAddMilestone ? (
                <form onSubmit={handleAddMilestone} style={{ background: P.bg, padding: 14, borderRadius: 10, marginTop: 12 }}>
                  <div style={{ marginBottom: 8 }}>
                    <input type="text" value={newMilestoneName} onChange={e => setNewMilestoneName(e.target.value)} placeholder="Milestone name..." required style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1.5px solid ${P.border}`, fontSize: 12, outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="date" value={newMilestoneDate} onChange={e => setNewMilestoneDate(e.target.value)} style={{ padding: '6px 8px', borderRadius: 6, border: `1.5px solid ${P.border}`, fontSize: 12, outline: 'none', flex: 1 }} />
                    <button type="submit" className="mpd-btn mpd-btn-primary" style={{ padding: '6px 12px', fontSize: 11 }}>Add</button>
                    <button type="button" className="mpd-btn mpd-btn-outline" onClick={() => setShowAddMilestone(false)} style={{ padding: '6px 12px', fontSize: 11 }}>✕</button>
                  </div>
                </form>
              ) : (
                <button className="mpd-btn mpd-btn-outline" onClick={() => setShowAddMilestone(true)} style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '8px', fontSize: 12 }}>
                  + Add Milestone
                </button>
              )}
            </div>

            <div className={`mpd-tab-pane ${activeTab==='activity'?'mpd-active':''}`}>
               <div style={{padding:20, textAlign:'center', color:P.textLight, fontSize:13}}>
                 {(currProject.updates && currProject.updates.length > 0) ? (
                   <div style={{ textAlign: 'left' }}>
                     {currProject.updates.map((upd, idx) => (
                       <div key={idx} style={{ padding: '8px 0', borderBottom: `1px solid ${P.bg}`, fontSize: 12.5, color: P.textMid }}>
                         📢 Update posted: <strong>{upd.text}</strong> by {upd.author} on {new Date(upd.date).toLocaleDateString()}
                       </div>
                     ))}
                   </div>
                 ) : "Activity logs will appear here."}
               </div>
            </div>

            <div className={`mpd-tab-pane ${activeTab==='updates'?'mpd-active':''}`}>
        <div ref={composerRef} className="mpd-upd-composer" style={{ overflow: 'hidden', marginBottom: 20 }}>
        <div className="mpd-uc-header" onClick={() => setComposerOpen(!composerOpen)} style={{ cursor: 'pointer' }}>
          <h3><i className="ti ti-speakerphone"></i> Post Project Update</h3>
          <button className="mpd-uc-toggle" onClick={e => { e.stopPropagation(); setComposerOpen(!composerOpen); }}>{composerOpen ? 'Collapse ↑' : 'Expand ↓'}</button>
        </div>
        {composerOpen && (
        <div style={{ padding: '18px 22px' }}>
          {/* SEND TO */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: P.textLight, textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 8 }}>Send To</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div onClick={() => setSendToTeam(!sendToTeam)} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `2px solid ${sendToTeam ? P.primary : P.border}`, background: sendToTeam ? P.primaryLight : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: sendToTeam ? P.primaryDark : P.textMid, transition: 'all .15s' }}>
                <i className="ti ti-users" style={{ fontSize: 16 }} />
                Team ({assigned.length} members)
              </div>
              <div onClick={() => setSendToClient(!sendToClient)} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `2px solid ${sendToClient ? P.primary : P.border}`, background: sendToClient ? P.primaryLight : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: sendToClient ? P.primaryDark : P.textMid, transition: 'all .15s' }}>
                <i className="ti ti-building" style={{ fontSize: 16 }} />
                Client Portal — {clientName}
              </div>
            </div>
          </div>

          {/* UPDATE TYPE CHIPS */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: P.textLight, textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 8 }}>Update Type</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { key: 'progress', label: 'Progress', icon: 'ti-chart-bar' },
                { key: 'milestone', label: 'Milestone', icon: 'ti-flag' },
                { key: 'blocker', label: 'Blocker', icon: 'ti-alert-triangle' },
                { key: 'general', label: 'General', icon: 'ti-speakerphone' },
                { key: 'delivery', label: 'Delivery', icon: 'ti-package' },
              ].map(({ key, label, icon }) => (
                <button key={key} onClick={() => setUpdateType(key)} style={{ padding: '6px 14px', borderRadius: 20, border: `2px solid ${updateType === key ? P.primary : P.border}`, background: updateType === key ? P.primary : '#fff', color: updateType === key ? '#fff' : P.textMid, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s' }}>
                  <i className={`ti ${icon}`} style={{ fontSize: 13 }} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* UPDATE TITLE */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: P.textLight, textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 6 }}>Update Title *</div>
            <input
              value={updateTitle}
              onChange={e => setUpdateTitle(e.target.value)}
              placeholder="e.g. Checkout flow 80% complete"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${P.border}`, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* DETAILS */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: P.textLight, textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 6 }}>Details</div>
            <textarea
              value={updateText}
              onChange={e => setUpdateText(e.target.value)}
              placeholder="What's done, what's next, any blockers or decisions needed..."
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${P.border}`, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', minHeight: 90, outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
            />
          </div>

          {/* ATTACHMENTS ROW + SEND BUTTON */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={triggerFileUpload} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.textMid, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', padding: '6px 10px', borderRadius: 8, transition: 'background .15s' }} onMouseEnter={e => e.currentTarget.style.background='#f0f4f8'} onMouseLeave={e => e.currentTarget.style.background='none'}>
                <i className="ti ti-photo" style={{ fontSize: 15 }} /> Image
              </button>
              <button onClick={triggerFileUpload} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.textMid, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', padding: '6px 10px', borderRadius: 8, transition: 'background .15s' }} onMouseEnter={e => e.currentTarget.style.background='#f0f4f8'} onMouseLeave={e => e.currentTarget.style.background='none'}>
                <i className="ti ti-file" style={{ fontSize: 15 }} /> File/Doc
              </button>
              <button onClick={triggerFileUpload} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.textMid, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', padding: '6px 10px', borderRadius: 8, transition: 'background .15s' }} onMouseEnter={e => e.currentTarget.style.background='#f0f4f8'} onMouseLeave={e => e.currentTarget.style.background='none'}>
                <i className="ti ti-paperclip" style={{ fontSize: 15 }} /> Attach
              </button>
              <span style={{ fontSize: 11, color: P.textLight, alignSelf: 'center' }}>Drag &amp; drop supported</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setComposerOpen(false)} style={{ padding: '9px 18px', borderRadius: 10, border: `1.5px solid ${P.border}`, background: 'transparent', color: P.textMid, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Draft</button>
              <button
                disabled={postingUpdate || (!updateTitle.trim() && !updateText.trim())}
                onClick={async () => {
                  const hasContent = updateTitle.trim() || updateText.trim();
                  if (!hasContent) return;
                  setPostingUpdate(true);
                  try {
                    const title = updateTitle.trim() || updateText.trim().slice(0, 60);
                    const body = updateText.trim() ? `${updateTitle.trim() ? updateTitle + ': ' : ''}${updateText}`.trim() : updateTitle.trim();
                    const newUpdate = { text: body, title: title, date: new Date().toISOString(), author: 'Admin', type: updateType };
                    const updatedUpdates = [newUpdate, ...(currProject.updates || [])];
                    await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, { updates: updatedUpdates });
                    setUpdateText(''); setUpdateTitle(''); setUpdateType('progress'); setComposerOpen(false);
                    loadLatest(); if (onUpdate) onUpdate(); if (fetchProjects) fetchProjects();
                  } catch(err) { console.error(err); alert('Failed to post update'); }
                  finally { setPostingUpdate(false); }
                }}
                style={{ padding: '9px 22px', borderRadius: 10, background: P.primary, color: '#fff', border: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, cursor: (postingUpdate || (!updateTitle.trim() && !updateText.trim())) ? 'not-allowed' : 'pointer', opacity: (postingUpdate || (!updateTitle.trim() && !updateText.trim())) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,188,212,.25)', transition: 'all .15s' }}>
                <i className="ti ti-send" style={{ fontSize: 15 }} />
                {postingUpdate ? 'Sending...' : 'Send to Team & Client'}
              </button>
            </div>
          </div>
        </div>
        )}
      </div>

              {(!currProject.updates || currProject.updates.length === 0) ? (
                <div style={{padding:20, textAlign:'center', color:P.textLight, fontSize:13}}>No updates posted yet.</div>
              ) : (
                currProject.updates.map((upd, idx) => (
                  <div key={idx} style={{ padding: '12px 14px', borderBottom: `1px solid ${P.bg}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ background: P.primaryLight, color: P.primary, borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 13 }}>
                      {getInitials(upd.author)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <strong style={{ fontSize: 13, color: P.textDark }}>{upd.author}</strong>
                        <span style={{ fontSize: 11, color: P.textLight }}>{new Date(upd.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div style={{ fontSize: 13, color: P.textMid, lineHeight: 1.5 }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, background: P.primaryLight, color: P.primary, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginRight: 6 }}>
                          {upd.type || 'general'}
                        </span>
                        {upd.text}
                      </div>
                    </div>
                  </div>
                ))
              )}
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
<div style={{fontSize:11, color:P.textLight}}>
  {employees.find(e => (e.name||e.employeeName) === a)?.role || 'Member'}
</div>
                </div>
              </div>
            ))}
          </div>

          {/* BUDGET */}
          <div className="mpd-card">
            <div className="mpd-card-header"><div className="mpd-card-title"><i className="ti ti-wallet"></i> Budget</div></div>
            <div className="mpd-brow"><span className="mpd-lbl">Total Budget</span><span className="mpd-val">{currency}{budgetAmt.toLocaleString()}</span></div>
            <div className="mpd-brow"><span className="mpd-lbl">Billed</span><span className="mpd-val">{currency}{billed.toLocaleString()}</span></div>
            <div className="mpd-brow"><span className="mpd-lbl">Received</span><span className="mpd-val mpd-g">{currency}{received.toLocaleString()}</span></div>
            <div className="mpd-brow"><span className="mpd-lbl">Pending</span><span className="mpd-val mpd-r">{currency}{pending.toLocaleString()}</span></div>
            <div className="mpd-brow"><span className="mpd-lbl">Spent</span><span className="mpd-val">{currency}{spent.toLocaleString()}</span></div>
            <div className="mpd-brow"><span className="mpd-lbl">Remaining</span><span className="mpd-val mpd-p">{currency}{remaining.toLocaleString()}</span></div>
            <div style={{marginTop:10}}>
              <div className="mpd-progress-bg"><div className="mpd-progress-fill mpd-purple" style={{width:`${budgetUsedPct}%`}}></div></div>
              <div style={{fontSize:11,color:P.textLight,marginTop:4}}>{budgetUsedPct}% used</div>
            </div>
          </div>

          {/* FILES */}
          <div className="mpd-card">
            <div className="mpd-card-header">
              <div className="mpd-card-title"><i className="ti ti-paperclip"></i> Files</div>
              <button className="mpd-btn mpd-btn-outline" onClick={triggerFileUpload} disabled={uploadingFile} style={{padding:'5px 10px',fontSize:11}}>
                <i className="ti ti-upload"></i> {uploadingFile ? 'Uploading...' : 'Upload'}
              </button>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              style={{display: 'none'}} 
              accept="image/*"
            />
            
            {(!currProject.files || currProject.files.length === 0) ? (
              <div style={{fontSize:12, color:P.textLight, textAlign:'center', padding:'10px 0'}}>No files attached.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {currProject.files.map((file) => (
                  <div key={file._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', border: `1.5px solid ${P.border}`, borderRadius: 8 }}>
                    <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: P.primary, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                      <i className="ti ti-file" style={{ marginRight: 6 }}></i>
                      {file.name}
                    </a>
                    <button onClick={() => handleDeleteFile(file._id)} style={{ background: 'transparent', border: 'none', color: P.red, cursor: 'pointer', fontSize: 14 }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PORTAL LINK */}
          <div className="mpd-card" style={{background:`linear-gradient(135deg, ${P.primaryLight}, #fff)`, border:`1.5px solid ${P.primaryMid}`}}>
            <div className="mpd-card-title" style={{marginBottom:12}}><i className="ti ti-building"></i> Client Portal</div>
            <div style={{fontSize:12, color:P.textMid, marginBottom:16}}>The client has access to their project portal with live progress, files, invoices and updates.</div>
            <button className="mpd-btn mpd-btn-primary" onClick={() => setShowPortalPreview(true)} style={{width:'100%', justifyContent:'center'}}><i className="ti ti-external-link"></i> View Portal</button>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99995, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: P.radius, width: 440, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, color: P.textDark }}>Add New Task</h3>
            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: P.textLight, marginBottom: 4 }}>Task Name</label>
                <input type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Enter task title" required style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1.5px solid ${P.border}`, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: P.textLight, marginBottom: 4 }}>Description</label>
                <textarea value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} placeholder="Enter details..." style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1.5px solid ${P.border}`, outline: 'none', resize: 'vertical', minHeight: 60, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: P.textLight, marginBottom: 4 }}>Priority</label>
                  <select value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1.5px solid ${P.border}`, outline: 'none', boxSizing: 'border-box' }}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: P.textLight, marginBottom: 4 }}>Due Date</label>
                  <input type="date" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: 8, border: `1.5px solid ${P.border}`, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: P.textLight, marginBottom: 4 }}>Assign To</label>
                <select value={newTaskAssignTo} onChange={e => setNewTaskAssignTo(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1.5px solid ${P.border}`, outline: 'none', boxSizing: 'border-box' }}>
                  <option value="Unassigned">Unassigned</option>
                  {currProject?.assignedTo?.map(emp => (
                    <option key={emp} value={employees?.find(e => (e.name||e.employeeName) === emp)?._id || emp}>
                      {emp}
                    </option>
                  ))}
                  {/* Also allow assigning to employees not in the project team, just in case */}
                  {employees?.filter(e => !currProject?.assignedTo?.includes(e.name || e.employeeName)).map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name || emp.employeeName}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="mpd-btn mpd-btn-outline" onClick={() => setShowAddTaskModal(false)}>Cancel</button>
                <button type="submit" className="mpd-btn mpd-btn-primary" disabled={addingTask}>{addingTask ? 'Adding...' : 'Add Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Portal Live Preview Overlay */}
      {showPortalPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#fff', overflowY: 'auto', padding: 20 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: `1px solid ${P.border}`, paddingBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: P.textDark }}>Client Portal Live Preview</h2>
              <button className="mpd-btn mpd-btn-danger" onClick={() => setShowPortalPreview(false)}>
                <i className="ti ti-arrow-left"></i> Exit Preview
              </button>
            </div>
            <ModernEmployeeProjectDetails
              project={currProject}
              tasks={currTasks}
              user={{ role: 'client', name: currProject.client }}
              onBack={() => setShowPortalPreview(false)}
              onMessageTeam={() => {
                setShowPortalPreview(false);
                if (onMessageTeam) onMessageTeam();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
