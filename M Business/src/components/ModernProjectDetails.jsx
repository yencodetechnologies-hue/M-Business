import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';
import ModernEmployeeProjectDetails from './ModernEmployeeProjectDetails';
import ProjectPaymentModals from './ProjectPaymentModals';

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
.mpd-btn:focus, .mpd-btn:active { outline: none; box-shadow: none; }
.mpd-btn-primary:focus, .mpd-btn-primary:active { background:${P.primaryDark}; box-shadow:none; }
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
.mpd-tabs { display:flex; flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; border-bottom:2px solid ${P.border}; margin-bottom:20px; }
.mpd-tab-btn { flex-shrink:0; white-space:nowrap; padding:10px 18px; font-size:13px; font-weight:700; color:${P.textMid}; cursor:pointer; border-bottom:3px solid transparent; margin-bottom:-2px; transition:all .15s; background:transparent; border-top:none; border-left:none; border-right:none; font-family:'Nunito',sans-serif; }
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
@keyframes fadeSlideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
.mpd-tabs.grabbing { cursor: grabbing !important; }
.mpd-tabs::-webkit-scrollbar { display: none; }
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

export default function ModernProjectDetails({ project, onBack, tasks = [], employees = [], user, clients = [], onEdit, onDelete, onLogTime, onUpdate, fetchProjects, fetchTasks, onMessageTeam, hideTopActions, onNext, onNewInvoice, onViewInvoice, onNewProposal, onNewQuotation, autoOpenInvoice, onAutoOpenInvoiceDone }) {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('project_tabs_order');
      if (saved) {
        const order = JSON.parse(saved);
        return order[0] || 'updates';
      }
    } catch (e) { }
    return 'updates';
  });
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [selectedPaymentItems, setSelectedPaymentItems] = useState([]);
  const [activePayTab, setActivePayTab] = useState('inv');

  const [composerOpen, setComposerOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFileObj, setUploadFileObj] = useState(null);
  const [uploadHeading, setUploadHeading] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadSendToClient, setUploadSendToClient] = useState(false);
  const [uploadSendToEmployee, setUploadSendToEmployee] = useState(false);
  const [uploadClientName, setUploadClientName] = useState('');
  const [uploadEmployeeName, setUploadEmployeeName] = useState('');
  const [uploadingModal, setUploadingModal] = useState(false);
  const [taskFilter, setTaskFilter] = useState('all');

  // Live state synchronized with backend
  const [currProject, setCurrProject] = useState(project);
  const [currTasks, setCurrTasks] = useState(tasks);
  const [loadingProject, setLoadingProject] = useState(false);

  const tabsRef = useRef(null);
  const tabContentRef = useRef(null);
  const [tabOrder, setTabOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('project_tabs_order');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return ['updates', 'activity', 'payments'];
  });

  useEffect(() => {
    localStorage.setItem('project_tabs_order', JSON.stringify(tabOrder));
  }, [tabOrder]);

  const [draggingTab, setDraggingTab] = useState(null);

  // Swipe-to-switch-tab on content area
  useEffect(() => {
    const el = tabContentRef.current;
    if (!el) return;
    let startX = null;
    let startY = null;
    let dragging = false;

    const onMouseDown = e => { startX = e.clientX; startY = e.clientY; dragging = true; };
    const onMouseUp = e => {
      if (!dragging || startX === null) return;
      dragging = false;
      const dx = e.clientX - startX;
      const dy = Math.abs(e.clientY - startY);
      if (Math.abs(dx) > 60 && dy < 80) {
        setActiveTab(prev => {
          const idx = tabOrder.indexOf(prev);
          if (dx < 0 && idx < tabOrder.length - 1) return tabOrder[idx + 1];
          if (dx > 0 && idx > 0) return tabOrder[idx - 1];
          return prev;
        });
      }
      startX = null;
    };
    const onMouseLeave = () => { dragging = false; startX = null; };

    const onTouchStart = e => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; };
    const onTouchEnd = e => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = Math.abs(e.changedTouches[0].clientY - startY);
      if (Math.abs(dx) > 60 && dy < 80) {
        setActiveTab(prev => {
          const idx = tabOrder.indexOf(prev);
          if (dx < 0 && idx < tabOrder.length - 1) return tabOrder[idx + 1];
          if (dx > 0 && idx > 0) return tabOrder[idx - 1];
          return prev;
        });
      }
      startX = null;
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [tabOrder]);

  // Modal / Input states
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskAssignTo, setNewTaskAssignTo] = useState([]);
  const [newTaskDue, setNewTaskDue] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskMilestone, setNewTaskMilestone] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  const [updateText, setUpdateText] = useState('');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateType, setUpdateType] = useState('progress');
  const [sendToTeam, setSendToTeam] = useState(true);
  const [sendToClient, setSendToClient] = useState(true);
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedNewMember, setSelectedNewMember] = useState('');
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [milestoneView, setMilestoneView] = useState('timeline'); // 'timeline' | 'list'
  const [dragMilestoneIdx, setDragMilestoneIdx] = useState(null);
  const [dragOverMilestoneIdx, setDragOverMilestoneIdx] = useState(null);
  const [updatesPage, setUpdatesPage] = useState(0);
  const [activityPage, setActivityPage] = useState(0);
  const fileInputRef = useRef(null);
  const composerRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showPortalPreview, setShowPortalPreview] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseAmt, setExpenseAmt] = useState('');
  const [addingExpense, setAddingExpense] = useState(false);
  const [projectInvoices, setProjectInvoices] = useState([]);
  const [showSendPopup, setShowSendPopup] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [targetPortalClient, setTargetPortalClient] = useState('');

  const [paymentModalsState, setPaymentModalsState] = useState({
    showNewInvoice: false,
    showPayment: false,
    showAdvance: false,
    showMilestonePayment: false,
    showAdditional: false,
    editData: null,
    editIndex: null
  });

  const handleDeleteRecord = async (arrayName, index) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const currentList = currProject[arrayName] || [];
      const updatedList = currentList.filter((_, i) => i !== index);
      const updatePayload = { [arrayName]: updatedList };
      // When deleting an expense, recalculate the spent total from remaining expenses
      if (arrayName === 'expenses') {
        updatePayload.spent = updatedList.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
      }
      await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, updatePayload);
      loadLatest();
    } catch (err) {
      alert('Failed to delete record.');
    }
  };

  const handleSendSelectedToPortal = async (targetClient) => {
    if (selectedPaymentItems.length === 0) return;
    const arrayKeyMap = { inv: 'invoices', pay: 'paymentsReceived', adv: 'advances', add: 'additionalCharges', mile: 'milestonePayments', exp: 'expenses' };
    const arrayName = arrayKeyMap[activePayTab];
    if (!arrayName) return;

    try {
      const currentList = currProject[arrayName] || [];
      const updatedList = currentList.map((rec, idx) => {
        if (selectedPaymentItems.includes(idx)) {
          return { ...rec, notifyClient: true, sentToClient: targetClient };
        }
        return rec;
      });

      // Also generate project updates for notification
      let updatesPayload = currProject.updates || [];
      selectedPaymentItems.forEach(idx => {
        const rec = currentList[idx];
        if (!rec.notifyClient) {
          const typeLabel = activePayTab === 'inv' ? 'Invoice' : activePayTab === 'pay' ? 'Payment' : activePayTab === 'adv' ? 'Advance' : activePayTab === 'add' ? 'Additional Charge' : activePayTab === 'mile' ? 'Milestone Payment' : 'Expense';
          const no = rec.invoiceNo || rec.paymentNo || rec.advanceNo || rec.chargeNo || rec.milestoneNo || rec.expenseNo || '';
          const amt = rec.amount ? ` for ₹${rec.amount}` : '';
          updatesPayload = [{
            text: `A ${typeLabel.toLowerCase()} (${no})${amt} has been shared to the client portal.`,
            title: `${typeLabel} Shared`,
            date: new Date().toISOString(),
            author: 'System',
            type: 'billing'
          }, ...updatesPayload];
        }
      });

      await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, {
        [arrayName]: updatedList,
        updates: updatesPayload
      });

      setSelectedPaymentItems([]);
      setShowSendPopup(false);
      alert(`Selected items successfully sent to ${targetClient}'s Portal.`);
      loadLatest();
    } catch (err) {
      console.error(err);
      alert('Failed to send items to portal.');
    }
  };

  const loadLatest = useCallback(async () => {
    if (!project?._id) return;
    setLoadingProject(true);
    try {
      const [pRes, tRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/projects/${project._id}`),
        axios.get(`${BASE_URL}/api/tasks`, {
          headers: { 'x-company-id': project?.companyId || '' }
        })
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

  // Inject component CSS once on mount
  useEffect(() => {
    const id = 'mpd-style';
    if (!document.getElementById(id)) {
      const tag = document.createElement('style');
      tag.id = id;
      tag.textContent = CSS;
      document.head.appendChild(tag);
    }
  }, []);

  // Load fresh data once on mount and when project _id changes
  const mountedId = useRef(null);
  useEffect(() => {
    if (project?._id && project._id !== mountedId.current) {
      mountedId.current = project._id;
      loadLatest();
    }
  }, [project?._id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (autoOpenInvoice) {
      setActiveTab('payments');
      setPaymentModalsState(prev => ({ ...prev, showNewInvoice: true }));
      if (onAutoOpenInvoiceDone) onAutoOpenInvoiceDone();
    }
  }, [autoOpenInvoice]);

  // Auto-fetch invoices for this project to calculate Billed/Received/Pending
  useEffect(() => {
    if (!project) return;
    const pName = project.name || "";
    const cName = project.client || project.clientName || "";
    axios.get(`${BASE_URL}/api/invoices`)
      .then(res => {
        const all = res.data?.invoices || res.data || [];
        const matched = (Array.isArray(all) ? all : []).filter(e => {
          const eProj = e.inv?.project || e.project;
          const eClient = e.inv?.clientName || e.inv?.client || e.client;
          return (eProj && eProj === pName) || (!eProj && eClient === cName);
        });
        setProjectInvoices(matched);
      })
      .catch(() => setProjectInvoices([]));
  }, [project?._id, project?.name, project?.client]);

  // Merge the simple project.invoices array with the rich global Invoices
  // (created via the full InvoiceCreator form) so both show up in this list.
  const mergedInvoices = React.useMemo(() => {
    const local = (currProject?.invoices || []).map(inv => ({ ...inv, _source: 'local' }));
    const globalOnly = (projectInvoices || [])
      .filter(g => !local.some(l => l.invoiceNo === g.invoiceNo))
      .map(g => ({
        invoiceNo: g.invoiceNo,
        description: (g.inv && g.inv.notes) || currProject?.name || 'Invoice',
        amount: g.total || 0,
        taxType: 'inclusive',
        taxPercent: 0,
        issueDate: g.date || g.inv?.date || '',
        dueDate: g.inv?.dueDate || g.dueDate || '',
        status: g.status,
        _source: 'global',
        _globalId: g.id,
        category: g.inv?.category || 'General',
        projectName: g.inv?.project || g.project,
        clientName: g.inv?.clientName || g.inv?.client || g.client
      }));
    return [...local, ...globalOnly];
  }, [currProject?.invoices, projectInvoices]);

  if (!currProject) return null;
  // Derived Project Data
  const projName = currProject.name || "Unnamed Project";
  const clientName = currProject.client || currProject.clientName || "Unknown Client";
  const category = currProject.category || currProject.purpose || "General";
  const priority = currProject.priority || "medium";
  const status = (currProject.status || "Active").toLowerCase();

  const startD = currProject.start ? new Date(currProject.start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const endD = currProject.end || currProject.deadline ? new Date(currProject.end || currProject.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

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
  const _pid = String(currProject._id);
  const projTasks = currTasks.filter(t => {
    if (!t || t.isDeleted) return false;
    const tPid = t.projectId ? (t.projectId._id ? String(t.projectId._id) : String(t.projectId)) : null;
    return tPid === _pid || t.project === projName;
  });
  const totalTasks = projTasks.length || 0;
  const doneTasks = projTasks.filter(t => t.status === 'done' || t.status === 'completed').length || 0;
  const inprogTasks = projTasks.filter(t => t.status === 'in_progress').length || 0;
  const openTasks = totalTasks - doneTasks - inprogTasks;

  // Milestone progress — drives the Overall Progress bar (milestone-only, not task-only)
  const milestonesArr = currProject.milestones || [];
  const doneMilestones = milestonesArr.filter(m => m.done).length;
  const totalMilestones = milestonesArr.length;
  const progressPct = totalMilestones > 0
    ? Math.round((doneMilestones / totalMilestones) * 100)
    : (currProject.progress || 0);

  const parseAmt = (val) => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    const num = Number(String(val).replace(/[^0-9.-]+/g, ''));
    return isNaN(num) ? 0 : num;
  };

  // Budget spent data (Auto-calculated from invoices)
  const billedGlobal = projectInvoices.reduce((sum, inv) => sum + parseAmt(inv.total), 0);
  const billedLocal = (currProject.invoices || []).reduce((sum, inv) => {
    const invAmount = parseAmt(inv.amount) || parseAmt(inv.total);
    const taxPercent = parseAmt(inv.taxPercent);
    const taxAmt = inv.taxType === 'inclusive' ? 0 : Math.round(invAmount * (taxPercent / 100));
    return sum + invAmount + taxAmt;
  }, 0);
  const billed = billedGlobal + billedLocal;
  const received = (currProject.paymentsReceived || []).reduce((sum, p) => sum + parseAmt(p.amount), 0);
  const pending = Math.max(0, billed - received);
  const spent = (currProject.expenses && currProject.expenses.length > 0)
    ? currProject.expenses.reduce((sum, exp) => sum + parseAmt(exp.amount), 0)
    : parseAmt(currProject.spent);
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

      // Recalculate task counts and save to project DB
      const latestTasks = await axios.get(`${BASE_URL}/api/tasks`, {
        headers: { 'x-company-id': currProject?.companyId || '' }
      });
      const allTasks = Array.isArray(latestTasks.data) ? latestTasks.data : [];
      const _pidLatest = String(currProject._id);
      const projTasksLatest = allTasks.filter(t => {
        if (!t || t.isDeleted) return false;
        const tPid = t.projectId ? (t.projectId._id ? String(t.projectId._id) : String(t.projectId)) : null;
        return tPid === _pidLatest || t.project === currProject?.name;
      });
      const totalT = projTasksLatest.length;
      const doneT = projTasksLatest.filter(t => {
        const s = t.status;
        return s === 'done' || s === 'completed' || (t._id === task._id ? !isCurrentlyDone : false);
      }).length;

      // Auto-complete milestones whose tasks are all done — this is what drives Overall Progress.
      // Completing an individual task never changes progressPct by itself; only flipping a
      // milestone's `done` flag (when its LAST task is completed) moves the bar.
      const existingMilestones = currProject.milestones || [];
      const updatedMilestones = existingMilestones.map(m => {
        const tasksForMilestone = projTasksLatest.filter(t => t.milestone === m.name && !t.isDeleted);

        if (tasksForMilestone.length === 0) {
          // No tasks under this milestone — leave its status untouched
          return m;
        }

        const allDone = tasksForMilestone.every(t => {
          const taskId = String(t._id);
          // use the just-updated status for the task being toggled right now
          const effectiveStatus = taskId === String(task._id) ? newStatus : t.status;
          return effectiveStatus === 'done' || effectiveStatus === 'completed';
        });

        return { ...m, done: allDone };
      });

      await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, {
        completedTasks: doneT,
        tasks: totalT,
        milestones: updatedMilestones, // persists auto-updated milestone completion
      });

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
      if (editingTask) {
        await axios.put(`${BASE_URL}/api/tasks/${editingTask._id}`, {
          title: newTaskTitle.trim(),
          description: newTaskDesc.trim(),
          priority: newTaskPriority,
          assignTo: Array.isArray(newTaskAssignTo) ? newTaskAssignTo.join(', ') : newTaskAssignTo,
          date: newTaskDue,
          milestone: newTaskMilestone
        });
      } else {
        await axios.post(`${BASE_URL}/api/tasks`, {
          title: newTaskTitle.trim(),
          description: newTaskDesc.trim(),
          priority: newTaskPriority,
          assignTo: Array.isArray(newTaskAssignTo) ? newTaskAssignTo.join(', ') : newTaskAssignTo,
          date: newTaskDue,
          milestone: newTaskMilestone,
          groupId: gId,
          projectId: currProject._id,
          status: 'Not Started'
        });
      }

      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskPriority('medium');
      setNewTaskAssignTo('Unassigned');
      setNewTaskDue('');
      setNewTaskMilestone('');
      setShowAddTaskModal(null);

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
    } catch (err) {
      console.error("Failed to post update:", err);
      alert("Failed to post update.");
    } finally {
      setPostingUpdate(false);
    }
  };
  const handleAddExpense = async (e) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmt);
    if (!amt || amt <= 0) return;
    setAddingExpense(true);
    try {
      const newSpent = (currProject.spent || 0) + amt;
      await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, { spent: newSpent });
      setExpenseAmt('');
      setShowAddExpense(false);
      loadLatest();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert("Failed to add expense.");
    } finally {
      setAddingExpense(false);
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

      // Recalculate progress from milestones if no tasks exist
      const totalM = updatedMilestones.length;
      const doneM = updatedMilestones.filter(m => m.done).length;
      const totalT = projTasks.length;
      const newProgress = totalM > 0
        ? Math.round((doneM / totalM) * 100)
        : (currProject.progress || 0);

      await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, {
        milestones: updatedMilestones,
        progress: newProgress,
      });
      loadLatest();
      if (onUpdate) onUpdate();
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
    } catch (err) {
      console.error("Failed to add milestone:", err);
      alert("Failed to add milestone.");
    }
  };

  const handleMilestoneDragStart = (idx) => {
    setDragMilestoneIdx(idx);
  };

  const handleMilestoneDragOver = (e, idx) => {
    e.preventDefault();
    setDragOverMilestoneIdx(idx);
  };

  const handleMilestoneDrop = async (e, dropIdx) => {
    e.preventDefault();
    if (dragMilestoneIdx === null || dragMilestoneIdx === dropIdx) {
      setDragMilestoneIdx(null);
      setDragOverMilestoneIdx(null);
      return;
    }
    const milestones = [...(currProject.milestones || [])];
    const dragged = milestones.splice(dragMilestoneIdx, 1)[0];
    milestones.splice(dropIdx, 0, dragged);
    setDragMilestoneIdx(null);
    setDragOverMilestoneIdx(null);
    try {
      await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, { milestones });
      loadLatest();
    } catch (err) {
      console.error("Failed to reorder milestones:", err);
    }
  };

  const handleMilestoneDragEnd = () => {
    setDragMilestoneIdx(null);
    setDragOverMilestoneIdx(null);
  };

  const triggerFileUpload = () => {
    setShowUploadModal(true);
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
    } catch (err) {
      console.error("Failed to upload file:", err);
      alert("Failed to upload file. Make sure it's an image (JPG/PNG).");
    } finally {
      setUploadingFile(false);
    }
  };
  const handleModalFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setUploadFileObj(file);
  };

  const handleModalUpload = async () => {
    if (!uploadFileObj) return;
    setUploadingModal(true);
    const formData = new FormData();
    formData.append("file", uploadFileObj);
    try {
      const res = await axios.post(`${BASE_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const uploadedUrl = res.data.url;
      const newFileObj = {
        name: uploadHeading || uploadFileObj.name,
        description: uploadDescription,
        url: uploadedUrl,
        size: uploadFileObj.size,
        type: uploadFileObj.type,
        uploadedAt: new Date().toISOString(),
        sentToClient: uploadSendToClient ? (uploadClientName || currProject.client || clientName || 'client') : null,
        sentToEmployee: uploadSendToEmployee ? uploadEmployeeName : null,
      };
      const updatedFiles = [...(currProject.files || []), newFileObj];
      await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, {
        files: updatedFiles
      });
      setShowUploadModal(false);
      setUploadFileObj(null);
      setUploadHeading('');
      setUploadDescription('');
      setUploadSendToClient(false);
      setUploadSendToEmployee(false);
      setUploadClientName('');
      setUploadEmployeeName('');
      loadLatest();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Upload error:", err.response?.data || err.message || err);
      alert("Failed to upload file: " + (err.response?.data?.msg || err.message || "Unknown error"));
    } finally {
      setUploadingModal(false);
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
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  };

  const handleShare = () => {
    const text = `Folder Project Alert: ${projName}\nStatus: ${currProject.status}\nProgress: ${progressPct}%\nBudget: ${currency}${budgetAmt.toLocaleString()}`;
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="mpd-root">
      {/* CSS injected once via useEffect above */}

      {/* TOPBAR */}
      <div className="mpd-topbar">
        <div className="mpd-breadcrumb">
          <a onClick={onBack}>Projects</a>
          <i className="ti ti-chevron-right" style={{ fontSize: 14 }}></i>
          <span style={{ color: P.textDark }}>{projName}</span>
        </div>
        <div className="mpd-topbar-actions">
          {!hideTopActions && (<>
            {onNewInvoice && (
              <button className="mpd-btn mpd-btn-primary" onClick={() => onNewInvoice(currProject)} style={{ gap: 6 }}>
                <i className="ti ti-file-invoice"></i> New Invoice
              </button>
            )}
            <button className="mpd-btn mpd-btn-outline" onClick={handleShare} style={{ gap: 6 }}><i className="ti ti-share"></i> Share</button>
            <button className="mpd-btn mpd-btn-outline" style={{ gap: 6 }} onClick={() => {
              const text = `Project: ${projName}\nClient: ${clientName}\nStatus: ${currProject.status}\nProgress: ${progressPct}%\nBudget: ${currency}${budgetAmt.toLocaleString()}`;
              const blob = new Blob([text], { type: 'text/plain' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${projName}.txt`; a.click();
            }}><i className="ti ti-download"></i> Export</button>
            <button className="mpd-btn mpd-btn-primary" onClick={() => onEdit && onEdit(currProject)} style={{ gap: 6 }}><i className="ti ti-edit"></i> Edit</button>
            <button className="mpd-btn mpd-btn-danger" style={{ gap: 6 }} onClick={onDelete || (() => window.confirm('Delete this project?'))}><i className="ti ti-trash"></i> Delete</button>
          </>)}
        </div>
      </div>

      {/* HEADER */}
      <div className="mpd-proj-header">
        <div className="mpd-ph-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div className="mpd-proj-name">{projName}</div>
            <span className={`mpd-status-badge ${badgeClass}`}>{currProject.status || 'Active'}</span>
            <span className={`mpd-prio ${prioClass}`}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
          </div>
          <div className="mpd-proj-desc">{currProject.description || "No description provided for this project."}</div>
          <div className="mpd-ph-meta">
            <div className="mpd-pm-item"><i className="ti ti-building"></i> Client: <strong>{clientName}</strong></div>
            <div className="mpd-pm-item"><i className="ti ti-calendar"></i> Start: <strong>{startD}</strong></div>
            <div className="mpd-pm-item"><i className="ti ti-calendar-due"></i> Deadline: <strong>{endD}</strong></div>
            {(currProject.contactPersonName || clients?.find(c => (c.clientName || c.name) === clientName)?.contactPersonName) && (
              <div className="mpd-pm-item"><i className="ti ti-user"></i> Contact: <strong>{currProject.contactPersonName || clients?.find(c => (c.clientName || c.name) === clientName)?.contactPersonName}</strong></div>
            )}
            {(currProject.contactPersonNo || clients?.find(c => (c.clientName || c.name) === clientName)?.contactPersonNo) && (
              <div className="mpd-pm-item"><i className="ti ti-phone"></i> <strong>{currProject.contactPersonNo || clients?.find(c => (c.clientName || c.name) === clientName)?.contactPersonNo}</strong></div>
            )}
            <div className="mpd-pm-item"><i className="ti ti-tag"></i> <strong>{category}</strong></div>
          </div>
        </div>
        <div className="mpd-ph-right">
          <div className="mpd-budget-box">
            <div className="mpd-lbl">Total Budget</div>
            <div className="mpd-amt">{budgetAmt ? `${currency}${budgetAmt.toLocaleString()}` : '—'}</div>
            {budgetAmt > 0 && <div className="mpd-sub">Spent {currency}{spent.toLocaleString()} &nbsp;·&nbsp; <span className="mpd-g">Rem {currency}{remaining.toLocaleString()}</span></div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

            {onNewQuotation && (
              <button className="mpd-btn mpd-btn-outline" onClick={() => onNewQuotation(currProject)}>
                + New Quotation
              </button>
            )}

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
      </div>

      {/* PROGRESS */}
      <div className="mpd-prog-card">
        <div className="mpd-prog-item">
          <div className="mpd-prog-num">{progressPct}%</div>
          <div className="mpd-prog-lbl">Overall</div>
          <div className="mpd-progress-bg"><div className="mpd-progress-fill" style={{ width: `${progressPct}%` }}></div></div>
          <div className="mpd-prog-sub">{doneMilestones} of {totalMilestones} milestones</div>
        </div>
        <div className="mpd-prog-divider"></div>
        <div className="mpd-prog-item">
          <div className="mpd-prog-num">{budgetUsedPct}%</div>
          <div className="mpd-prog-lbl">Budget Used</div>
          <div className="mpd-progress-bg"><div className="mpd-progress-fill mpd-purple" style={{ width: `${budgetUsedPct}%` }}></div></div>
          <div className="mpd-prog-sub">{currency}{spent.toLocaleString()} of {currency}{budgetAmt.toLocaleString()}</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="mpd-kpi-row">
        <div className="mpd-kpi">
          <div className="mpd-kpi-icon" style={{ background: P.primaryLight }}><i className="ti ti-checklist" style={{ color: P.primary }}></i></div>
          <div><div className="mpd-kpi-val">{doneTasks}/{totalTasks}</div><div className="mpd-kpi-lbl">Tasks Done</div><div className="mpd-kpi-trend mpd-up">On Track</div></div>
        </div>
        <div className="mpd-kpi">
          <div className="mpd-kpi-icon" style={{ background: P.greenLight }}><i className="ti ti-clock" style={{ color: P.green }}></i></div>
          <div><div className="mpd-kpi-val">{currProject.loggedHours || 0}h</div><div className="mpd-kpi-lbl">Hours Logged</div><div className="mpd-kpi-trend mpd-up">Active</div></div>
        </div>

        <div className="mpd-kpi">
          <div className="mpd-kpi-icon" style={{ background: P.purpleLight }}><i className="ti ti-users" style={{ color: P.purple }}></i></div>
          <div><div className="mpd-kpi-val">{assigned.length}</div><div className="mpd-kpi-lbl">Team Members</div><div className="mpd-kpi-trend mpd-up">Assigned</div></div>
        </div>
      </div>


      {/* MILESTONES STANDALONE CARD */}
      <div className="mpd-card">
        <div className="mpd-card-header">
          <div className="mpd-card-title"><i className="ti ti-flag"></i> Milestone Progress</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', background: P.bg, borderRadius: 8, border: `1px solid ${P.border}`, overflow: 'hidden' }}>
              <button
                onClick={() => setMilestoneView('timeline')}
                style={{ padding: '6px 12px', fontSize: 11, border: 'none', cursor: 'pointer', background: milestoneView === 'timeline' ? P.primary : 'transparent', color: milestoneView === 'timeline' ? '#fff' : P.textLight, fontWeight: 700, transition: 'all .2s' }}
              >
                <i className="ti ti-timeline"></i> Timeline
              </button>
              <button
                onClick={() => setMilestoneView('list')}
                style={{ padding: '6px 12px', fontSize: 11, border: 'none', cursor: 'pointer', background: milestoneView === 'list' ? P.primary : 'transparent', color: milestoneView === 'list' ? '#fff' : P.textLight, fontWeight: 700, transition: 'all .2s' }}
              >
                <i className="ti ti-list"></i> List
              </button>
            </div>
            <button className="mpd-btn mpd-btn-outline" onClick={() => setShowAddMilestone(true)} style={{ padding: '6px 12px', fontSize: 12 }}>
              <i className="ti ti-plus"></i> Add Milestone
            </button>
          </div>
        </div>
        {(!currProject.milestones || currProject.milestones.length === 0) ? (
          <div style={{ padding: 20, textAlign: 'center', color: P.textLight, fontSize: 13 }}>No milestones defined.</div>
        ) : milestoneView === 'timeline' ? (
          <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', minWidth: Math.max(300, (currProject.milestones || []).length * 100) }}>
              <div style={{ position: 'absolute', top: 18, left: '5%', right: '5%', height: 2, background: P.border, zIndex: 0 }} />
              {(currProject.milestones || []).map((m, idx) => {
                const tasksForMilestone = currTasks.filter(t => t.milestone === m.name && !t.isDeleted);
                const allTasksCompleted = tasksForMilestone.length > 0 && tasksForMilestone.every(t => t.status === 'done' || t.status === 'completed');
                const isDone = m.done === true || allTasksCompleted;

                const firstNotDone = (currProject.milestones || []).findIndex(x => {
                  const mTasks = currTasks.filter(t => t.milestone === x.name && !t.isDeleted);
                  const mAllCompleted = mTasks.length > 0 && mTasks.every(t => t.status === 'done' || t.status === 'completed');
                  return x.done !== true && !mAllCompleted;
                });

                const isActive = !isDone && idx === firstNotDone;
                const circleColor = isDone ? P.red : isActive ? '#E0F7FA' : '#fff';
                const circleBorder = isDone ? P.red : isActive ? P.primary : P.border;
                const textColor = isDone ? P.red : isActive ? P.primary : P.textLight;
                const statusLabel = isDone ? 'Done' : isActive ? 'Active' : 'Pending';
                return (
                  <div key={idx} draggable="true" onDragStart={(e) => { e.stopPropagation(); setDragMilestoneIdx(idx); }} onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverMilestoneIdx(idx); }} onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (dragMilestoneIdx === null || dragMilestoneIdx === idx) { setDragMilestoneIdx(null); setDragOverMilestoneIdx(null); return; } const ms = [...(currProject.milestones || [])]; const dragged = ms.splice(dragMilestoneIdx, 1)[0]; ms.splice(idx, 0, dragged); setDragMilestoneIdx(null); setDragOverMilestoneIdx(null); axios.put(`${BASE_URL}/api/projects/${currProject._id}`, { milestones: ms }).then(loadLatest); }} onDragEnd={(e) => { e.stopPropagation(); setDragMilestoneIdx(null); setDragOverMilestoneIdx(null); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1, position: 'relative', zIndex: 1, opacity: dragMilestoneIdx === idx ? 0.4 : 1, cursor: 'grab', outline: dragOverMilestoneIdx === idx && dragMilestoneIdx !== idx ? `2.5px dashed ${P.primary}` : 'none', borderRadius: 8, transition: 'opacity .2s' }}>
                    {tasksForMilestone.length > 0 && (
                      <div style={{ position: 'absolute', top: 18, left: idx === 0 ? '0%' : '-50%', right: '50%', transform: 'translateY(-50%)', display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', zIndex: 0 }}>
                        {tasksForMilestone.map((t, i) => {
                          const taskDone = t.status === 'done' || t.status === 'completed';
                          return (
                            <div key={t._id} title={t.title} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{ width: 10, height: 10, borderRadius: '50%', background: taskDone ? P.green : P.primary, border: '2px solid #fff', zIndex: 2 }}></div>
                              <div style={{ position: 'absolute', top: 14, fontSize: 9, color: taskDone ? P.green : P.textDark, whiteSpace: 'nowrap', fontWeight: 700, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
                                {t.title}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div onClick={() => handleToggleMilestone(idx)} title="Click to toggle done"
                      style={{ width: 36, height: 36, borderRadius: '50%', background: circleColor, border: `2.5px solid ${circleBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: isDone ? '#fff' : isActive ? P.primary : P.textLight, cursor: 'pointer', boxShadow: isActive ? `0 0 0 4px ${P.primaryLight}` : 'none', transition: 'all .2s', position: 'relative', zIndex: 1 }}>
                      {isDone ? <span style={{ color: '#fff', fontSize: 14 }}>Yes</span> : idx + 1}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: P.textDark, textAlign: 'center', maxWidth: 80, wordBreak: 'break-word', position: 'relative', zIndex: 1 }}>{m.name}</div>
                    {m.date && <div style={{ fontSize: 10, color: P.textLight, textAlign: 'center', position: 'relative', zIndex: 1 }}>{new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>}
                    <div style={{ fontSize: 10, fontWeight: 700, color: textColor, position: 'relative', zIndex: 1 }}>{statusLabel}</div>
                    <button onClick={e => { e.stopPropagation(); if (confirm('Delete milestone?')) { const ms = (currProject.milestones || []).filter((_, i) => i !== idx); axios.put(`${BASE_URL}/api/projects/${currProject._id}`, { milestones: ms }).then(loadLatest); } }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.red, fontSize: 11, padding: 0, position: 'relative', zIndex: 1 }}>Delete</button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* LIST VIEW */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
            {(currProject.milestones || []).map((m, idx) => {
              const tasksForMilestone = currTasks.filter(t => t.milestone === m.name && !t.isDeleted);
              const allTasksCompleted = tasksForMilestone.length > 0 && tasksForMilestone.every(t => t.status === 'done' || t.status === 'completed');
              const isDone = m.done === true || allTasksCompleted;
              const firstNotDone = (currProject.milestones || []).findIndex(x => {
                const mTasks = currTasks.filter(t => t.milestone === x.name && !t.isDeleted);
                const mAllCompleted = mTasks.length > 0 && mTasks.every(t => t.status === 'done' || t.status === 'completed');
                return x.done !== true && !mAllCompleted;
              });
              const isActive = !isDone && idx === firstNotDone;
              const statusLabel = isDone ? 'Done' : isActive ? 'Active' : 'Pending';
              const statusColor = isDone ? P.green : isActive ? P.primary : P.textLight;
              const statusBg = isDone ? '#E8F5E9' : isActive ? P.primaryLight : '#f5f5f5';
              const doneTasks = tasksForMilestone.filter(t => t.status === 'done' || t.status === 'completed').length;
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: P.bg, border: `1.5px solid ${isDone ? P.green : isActive ? P.primary : P.border}`, transition: 'all .2s' }}>
                  <div onClick={() => handleToggleMilestone(idx)} title="Click to toggle done"
                    style={{ width: 30, height: 30, borderRadius: '50%', background: isDone ? P.green : '#fff', border: `2px solid ${statusColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all .2s' }}>
                    {isDone ? <span style={{ color: '#fff', fontSize: 14 }}>Yes</span> : <span style={{ fontSize: 11, color: P.textLight, fontWeight: 700 }}>{idx + 1}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: P.textDark }}>{m.name}</div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
                      {m.date && <span style={{ fontSize: 11, color: P.textLight }}><i className="ti ti-calendar" style={{ marginRight: 3 }}></i>{new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      {tasksForMilestone.length > 0 && <span style={{ fontSize: 11, color: P.textLight }}><i className="ti ti-list-check" style={{ marginRight: 3 }}></i>{doneTasks}/{tasksForMilestone.length} tasks</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, padding: '3px 10px', borderRadius: 6, background: statusBg, flexShrink: 0 }}>{statusLabel}</span>
                  <button onClick={e => { e.stopPropagation(); if (confirm('Delete milestone?')) { const ms = (currProject.milestones || []).filter((_, i) => i !== idx); axios.put(`${BASE_URL}/api/projects/${currProject._id}`, { milestones: ms }).then(loadLatest); } }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.red, fontSize: 13, padding: 0, flexShrink: 0 }}>Delete</button>
                </div>
              );
            })}
          </div>
        )}
        {showAddMilestone && (
          <form onSubmit={handleAddMilestone} style={{ background: P.bg, padding: 14, borderRadius: 10, marginTop: 12 }}>
            <div style={{ marginBottom: 8 }}>
              <input type="text" value={newMilestoneName} onChange={e => setNewMilestoneName(e.target.value)} placeholder="Milestone name..." required style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1.5px solid ${P.border}`, fontSize: 12, outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="date" value={newMilestoneDate} onChange={e => setNewMilestoneDate(e.target.value)} style={{ padding: '6px 8px', borderRadius: 6, border: `1.5px solid ${P.border}`, fontSize: 12, outline: 'none', flex: 1 }} />
              <button type="submit" className="mpd-btn mpd-btn-primary" style={{ padding: '6px 12px', fontSize: 11 }}>Add</button>
              <button type="button" className="mpd-btn mpd-btn-outline" onClick={() => setShowAddMilestone(false)} style={{ padding: '6px 12px', fontSize: 11 }}>Close</button>
            </div>
          </form>
        )}
      </div>


      {/* MAIN CONTENT GRID */}
      <div className="mpd-grid-main-side">
        {/* LEFT COL */}
        <div>
          {/* TASKS COMPONENT */}
          <div className="mpd-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
            <div className="mpd-card-header" style={{ padding: '20px 24px 10px', marginBottom: 0 }}>
              <div className="mpd-card-title"><i className="ti ti-list-check"></i> Tasks</div>
              <button className="mpd-btn mpd-btn-outline" onClick={() => { setEditingTask(null); setNewTaskTitle(''); setNewTaskDesc(''); setNewTaskPriority('medium'); setNewTaskAssignTo([]); setNewTaskDue(''); setNewTaskMilestone(''); setShowAddTaskModal(true); }} style={{ padding: '6px 12px', fontSize: 12 }}><i className="ti ti-plus"></i> Add Task</button>
            </div>
            <div style={{ padding: '0 24px 14px' }}>
              <div className="mpd-task-filters">
                <button className={`mpd-tf ${taskFilter === 'all' ? 'mpd-on' : ''}`} onClick={() => setTaskFilter('all')}>All ({totalTasks})</button>
                <button className={`mpd-tf ${taskFilter === 'inprog' ? 'mpd-on' : ''}`} onClick={() => setTaskFilter('inprog')}>In Progress ({inprogTasks})</button>
                <button className={`mpd-tf ${taskFilter === 'done' ? 'mpd-on' : ''}`} onClick={() => setTaskFilter('done')}>Completed ({doneTasks})</button>
              </div>
            </div>
            <div style={{ padding: '0 24px 20px' }}>
              {filteredTasks.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: P.textLight, fontSize: 13 }}>No tasks found for this filter.</div>
              ) : (
                filteredTasks.map(t => {
                  const isDone = t.status === 'done' || t.status === 'completed';
                  return (
                    <div key={t._id} className="mpd-task-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: `1px solid ${P.bg}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: 'pointer' }} onClick={() => handleToggleTask(t)}>
                        <div className={`mpd-task-chk ${isDone ? 'mpd-done' : ''}`}></div>
                        <div className={`mpd-task-prio ${t.priority === 'high' ? 'mpd-h' : (t.priority === 'medium' ? 'mpd-m' : 'mpd-l')}`}></div>
                        <div className={`mpd-task-name ${isDone ? 'mpd-done' : ''}`}>{t.title || t.name}</div>
                        <div className="mpd-task-assign">
                          {t.assignTo && t.assignTo.match(/^[a-f0-9]{24}$/i)
                            ? (employees?.find(e => e._id === t.assignTo)?.name || 'Unassigned')
                            : (t.assignTo || 'Unassigned')}
                        </div>
                        <div className="mpd-task-due">{t.date ? new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setEditingTask(t); setNewTaskTitle(t.title || ''); setNewTaskDesc(t.description || ''); setNewTaskPriority(t.priority || 'medium'); setNewTaskAssignTo(t.assignTo ? t.assignTo.split(', ').filter(Boolean) : []); setNewTaskDue(t.date || ''); setNewTaskMilestone(t.milestone || ''); setShowAddTaskModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.primary, fontSize: 13, padding: '2px 6px' }}>Edit</button>
                      <button onClick={e => { e.stopPropagation(); if (confirm('Delete?')) axios.delete(`${BASE_URL}/api/tasks/${t._id}`).catch(() => axios.put(`${BASE_URL}/api/tasks/${t._id}`, { isDeleted: true })).then(loadLatest); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.red, fontSize: 13, padding: '2px 6px' }}>Delete</button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* TABS - draggable scroll */}
          <div className="mpd-card">
            <div className="mpd-tabs"
              ref={tabsRef}
              style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
            >
              {tabOrder.map(tab => {
                let lbl = '', icon = null;
                if (tab === 'updates') lbl = 'Updates';
                if (tab === 'activity') lbl = 'Activity Logs';
                if (tab === 'payments') { lbl = 'Payments'; icon = 'ti-arrows-exchange'; }
                return (
                  <button
                    key={tab}
                    draggable
                    onDragStart={(e) => { setDraggingTab(tab); e.dataTransfer.effectAllowed = "move"; }}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!draggingTab || draggingTab === tab) return;
                      const oldIdx = tabOrder.indexOf(draggingTab);
                      const newIdx = tabOrder.indexOf(tab);
                      const newOrder = [...tabOrder];
                      newOrder.splice(oldIdx, 1);
                      newOrder.splice(newIdx, 0, draggingTab);
                      setTabOrder(newOrder);
                      setDraggingTab(null);
                    }}
                    onDragEnd={() => setDraggingTab(null)}
                    className={`mpd-tab-btn ${activeTab === tab ? 'mpd-active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                    style={{ opacity: draggingTab === tab ? 0.4 : 1, cursor: 'grab', transition: 'all 0.2s' }}
                  >
                    {icon && <i className={`ti ${icon}`} style={{ marginRight: 5 }}></i>}{lbl}
                  </button>
                );
              })}

              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, paddingRight: 12, fontSize: 13, color: '#9CA3AF', userSelect: 'none', whiteSpace: 'nowrap' }}>
                {tabOrder.indexOf(activeTab) > 0 && <span onClick={() => setActiveTab(tabOrder[tabOrder.indexOf(activeTab) - 1])} style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6, background: '#F3F4F6', color: '#4B5563' }}><i className="ti ti-chevron-left"></i></span>}
                {tabOrder.indexOf(activeTab) < tabOrder.length - 1 && <span onClick={() => setActiveTab(tabOrder[tabOrder.indexOf(activeTab) + 1])} style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6, background: '#F3F4F6', color: '#4B5563' }}><i className="ti ti-chevron-right"></i></span>}
              </div>
            </div>

            <div ref={tabContentRef} style={{ userSelect: 'none' }}>
              <div className={`mpd-tab-pane ${activeTab === 'activity' ? 'mpd-active' : ''}`}>
                <div style={{ padding: '12px 16px', color: P.textLight, fontSize: 13 }}>
                  {(currProject.updates && currProject.updates.length > 0) ? (() => {
                    const perPage = 10;
                    const totalPages = Math.ceil(currProject.updates.length / perPage);
                    const pageItems = currProject.updates.slice(activityPage * perPage, activityPage * perPage + perPage);
                    return (
                      <div>
                        <div style={{ textAlign: 'left' }}>
                          {currProject.updates.slice(activityPage * 10, activityPage * 10 + 10).map((upd, idx) => (
                            <div key={idx} style={{ padding: '8px 0', borderBottom: `1px solid ${P.bg}`, fontSize: 12.5, color: P.textMid }}>
                               Update posted: <strong>{upd.text}</strong> by {upd.author} on {new Date(upd.date).toLocaleDateString()}
                            </div>
                          ))}
                        </div>
                        {Math.ceil(currProject.updates.length / 10) > 1 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: `1px solid ${P.border}` }}>
                            <button onClick={() => setActivityPage(p => Math.max(0, p - 1))} disabled={activityPage === 0} style={{ padding: '5px 14px', borderRadius: 6, border: `1px solid ${P.border}`, background: activityPage === 0 ? P.bg : '#fff', color: activityPage === 0 ? P.textLight : P.textDark, cursor: activityPage === 0 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700 }}> Prev</button>
                            <span style={{ fontSize: 12, color: P.textLight }}>{activityPage + 1} / {Math.ceil(currProject.updates.length / 10)}</span>
                            <button onClick={() => setActivityPage(p => Math.min(Math.ceil(currProject.updates.length / 10) - 1, p + 1))} disabled={activityPage === Math.ceil(currProject.updates.length / 10) - 1} style={{ padding: '5px 14px', borderRadius: 6, border: `1px solid ${P.border}`, background: activityPage === Math.ceil(currProject.updates.length / 10) - 1 ? P.bg : '#fff', color: activityPage === Math.ceil(currProject.updates.length / 10) - 1 ? P.textLight : P.textDark, cursor: activityPage === Math.ceil(currProject.updates.length / 10) - 1 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700 }}>Next </button>
                          </div>
                        )}
                      </div>
                    );
                  })() : <div style={{ textAlign: 'center', padding: 20 }}>Activity logs will appear here.</div>}
                </div>
              </div>

              <div className={`mpd-tab-pane ${activeTab === 'updates' ? 'mpd-active' : ''}`}>
                <div ref={composerRef} className="mpd-upd-composer" style={{ overflow: 'hidden', marginBottom: composerOpen ? 20 : 0, display: activeTab === 'updates' ? 'block' : 'none' }}>
                  <div className="mpd-uc-header" onClick={() => setComposerOpen(!composerOpen)} style={{ cursor: 'pointer' }}>
                    <h3><i className="ti ti-speakerphone"></i> Post Project Update</h3>
                    <button className="mpd-uc-toggle" onClick={e => { e.stopPropagation(); setComposerOpen(!composerOpen); }}>{composerOpen ? 'Collapse ' : 'Expand '}</button>
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
                          <button onClick={triggerFileUpload} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.textMid, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', padding: '6px 10px', borderRadius: 8, transition: 'background .15s' }} onMouseEnter={e => e.currentTarget.style.background = '#f0f4f8'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                            <i className="ti ti-photo" style={{ fontSize: 15 }} /> Image
                          </button>
                          <button onClick={triggerFileUpload} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.textMid, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', padding: '6px 10px', borderRadius: 8, transition: 'background .15s' }} onMouseEnter={e => e.currentTarget.style.background = '#f0f4f8'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                            <i className="ti ti-file" style={{ fontSize: 15 }} /> File/Doc
                          </button>
                          <button onClick={triggerFileUpload} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.textMid, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', padding: '6px 10px', borderRadius: 8, transition: 'background .15s' }} onMouseEnter={e => e.currentTarget.style.background = '#f0f4f8'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
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
                                loadLatest(); if (onUpdate) onUpdate();
                              } catch (err) { console.error(err); alert('Failed to post update'); }
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
                  <div style={{ padding: 20, textAlign: 'center', color: P.textLight, fontSize: 13 }}>No updates posted yet.</div>
                ) : (() => {
                  const perPage = 10;
                  const totalPages = Math.ceil(currProject.updates.length / perPage);
                  const pageItems = currProject.updates.slice(updatesPage * perPage, updatesPage * perPage + perPage);
                  return (
                    <div>
                      {pageItems.map((upd, idx) => (
                        <div key={idx} style={{ padding: '12px 14px', borderBottom: `1px solid ${P.bg}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{ background: P.primaryLight, color: P.primary, borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 13 }}>{getInitials(upd.author)}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <strong style={{ fontSize: 13, color: P.textDark }}>{upd.author}</strong>
                              <span style={{ fontSize: 11, color: P.textLight }}>{new Date(upd.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div style={{ fontSize: 13, color: P.textMid, lineHeight: 1.5 }}>
                              <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, background: P.primaryLight, color: P.primary, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginRight: 6 }}>{upd.type || 'general'}</span>
                              {upd.text}
                            </div>
                          </div>
                        </div>
                      ))}
                      {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderTop: `1px solid ${P.border}` }}>
                          <button onClick={() => setUpdatesPage(p => Math.max(0, p - 1))} disabled={updatesPage === 0} style={{ padding: '5px 14px', borderRadius: 6, border: `1px solid ${P.border}`, background: updatesPage === 0 ? P.bg : '#fff', color: updatesPage === 0 ? P.textLight : P.textDark, cursor: updatesPage === 0 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700 }}> Prev</button>
                          <span style={{ fontSize: 12, color: P.textLight }}>{updatesPage + 1} / {totalPages}</span>
                          <button onClick={() => setUpdatesPage(p => Math.min(totalPages - 1, p + 1))} disabled={updatesPage === totalPages - 1} style={{ padding: '5px 14px', borderRadius: 6, border: `1px solid ${P.border}`, background: updatesPage === totalPages - 1 ? P.bg : '#fff', color: updatesPage === totalPages - 1 ? P.textLight : P.textDark, cursor: updatesPage === totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700 }}>Next </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* ── PAYMENTS TAB ── */}
              <div className={`mpd-tab-pane ${activeTab === 'payments' ? 'mpd-active' : ''}`}>
                <div style={{ padding: '18px 20px' }}>

                  {/* STATS ROW */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 20 }}>
                    {[
                      { lbl: 'Total Invoiced', val: `${currency}${(billed || 0).toLocaleString()}`, sub: 'Invoices raised', color: '#3B82F6', icon: 'ti-file-invoice' },
                      { lbl: 'Received', val: `${currency}${(received || 0).toLocaleString()}`, sub: `${billed > 0 ? Math.round((received / billed) * 100) : 0}% collected`, color: '#22C55E', icon: 'ti-circle-check' },
                      { lbl: 'Advance Paid', val: `${currency}${((currProject.advances || []).reduce((s, a) => s + (parseAmt(a.amount) || 0), 0) || 0).toLocaleString()}`, sub: 'Adjusted in invoice', color: '#8B5CF6', icon: 'ti-pig-money' },
                      { lbl: 'Additional', val: `${currency}${((currProject.additionalCharges || []).reduce((s, a) => s + (parseAmt(a.amount) || 0), 0) || parseAmt(currProject.additionalChargesTotal) || 0).toLocaleString()}`, sub: 'Extra charges', color: '#F97316', icon: 'ti-circle-plus' },
                      { lbl: 'Outstanding', val: `${currency}${(pending || 0).toLocaleString()}`, sub: 'Balance due', color: '#EF4444', icon: 'ti-alert-circle' },
                    ].map(s => (
                      <div key={s.lbl} style={{ background: '#fff', border: '1px solid #E8EDF2', borderRadius: 12, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.color, borderRadius: '12px 12px 0 0' }}></div>
                        <i className={`ti ${s.icon}`} style={{ position: 'absolute', top: 14, right: 14, fontSize: 20, opacity: .13, color: s.color }}></i>
                        <div style={{ fontSize: 10, fontWeight: 900, color: '#7B8FA1', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 5 }}>{s.lbl}</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#0D1B2A', letterSpacing: '-.5px', lineHeight: 1 }}>{s.val}</div>
                        <div style={{ fontSize: 11, color: '#7B8FA1', fontWeight: 600, marginTop: 4 }}>{s.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* PAYMENT TYPE TABS — card style matching mockup */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: 18 }}>
                    {[
                      { key: 'inv', label: 'Invoice', desc: 'Standard billing', icon: 'ti-file-invoice', color: '#3B82F6', bg: 'rgba(59,130,246,.1)' },
                      { key: 'adv', label: 'Advance', desc: 'Upfront payments', icon: 'ti-pig-money', color: '#8B5CF6', bg: 'rgba(139,92,246,.1)' },
                      { key: 'add', label: 'Additional', desc: 'Extra charges', icon: 'ti-circle-plus', color: '#F97316', bg: 'rgba(249,115,22,.1)' },
                      { key: 'mile', label: 'Milestone', desc: 'Phase billing', icon: 'ti-flag', color: '#F59E0B', bg: 'rgba(245,158,11,.1)' },
                      { key: 'pay', label: 'Payment', desc: 'Received amounts', icon: 'ti-credit-card', color: '#22C55E', bg: 'rgba(34,197,94,.1)' },
                      { key: 'exp', label: 'Expenses', desc: 'Project costs', icon: 'ti-receipt', color: '#6B7280', bg: 'rgba(107,114,128,.1)' },
                    ].map(t => (
                      <div key={t.key}
                        onClick={() => { setActivePayTab(t.key); setSelectedPaymentItems([]); }}
                        style={{ background: activePayTab === t.key ? '#00BCD4' : '#fff', border: `1px solid ${activePayTab === t.key ? '#00BCD4' : '#E8EDF2'}`, borderRadius: 12, padding: '14px 8px', textAlign: 'center', cursor: 'pointer', transition: 'all .15s' }}
                      >
                        <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 18, background: activePayTab === t.key ? 'rgba(255,255,255,.25)' : t.bg, color: activePayTab === t.key ? '#fff' : t.color }}>
                          <i className={`ti ${t.icon}`}></i>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: activePayTab === t.key ? '#fff' : '#0D1B2A' }}>{t.label}</div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: activePayTab === t.key ? 'rgba(255,255,255,.75)' : '#7B8FA1', marginTop: 2 }}>{t.desc}</div>
                      </div>
                    ))}
                  </div>

                  {/* INVOICE TABLE */}
                  <div data-paytab="inv" style={{ display: activePayTab === 'inv' ? 'block' : 'none', background: '#fff', border: '1px solid #E8EDF2', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #E8EDF2' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 900, color: '#0D1B2A' }}>
                        <i className="ti ti-file-invoice" style={{ color: '#00BCD4', fontSize: 15 }}></i> Invoices
                        <span style={{ background: '#E0F7FA', color: '#0097A7', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 20 }}>{(currProject.invoices || []).length || 0}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {selectedPaymentItems.length > 0 && activePayTab === 'inv' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button onClick={() => { setTargetPortalClient(currProject.client); setShowSendPopup(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                              <i className="ti ti-send" style={{ fontSize: 13 }}></i> Send ({selectedPaymentItems.length})
                            </button>
                          </div>
                        )}
                        {(() => {
                          const btnMap = {
                            inv: { label: 'New Invoice', modal: 'showNewInvoice', icon: 'ti-file-invoice' },
                            adv: { label: 'New Advance', modal: 'showAdvance', icon: 'ti-pig-money' },
                            add: { label: 'Additional Charge', modal: 'showAdditional', icon: 'ti-circle-plus' },
                            mile: { label: 'New Milestone', modal: 'showMilestonePayment', icon: 'ti-flag' },
                            pay: { label: 'Record Payment', modal: 'showPayment', icon: 'ti-credit-card' },
                            exp: { label: 'Add Expense', modal: 'showExpense', icon: 'ti-receipt' },
                          };
                          const b = btnMap[activePayTab] || btnMap['inv'];
                          return (
                            <button
                              onClick={() => {
                                if (b.modal === 'showNewInvoice' && onNewInvoice) {
                                  onNewInvoice(currProject);
                                } else {
                                  setPaymentModalsState(prev => ({ ...prev, [b.modal]: true }));
                                }
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#00BCD4', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                              <i className={`ti ${b.icon}`} style={{ fontSize: 13 }}></i> {b.label}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                    {/* Table Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '40px 1.2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 100px', gap: 8, padding: '8px 18px', background: '#FAFBFD', borderBottom: '1px solid #E8EDF2' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input type="checkbox" checked={mergedInvoices.length > 0 && selectedPaymentItems.length === mergedInvoices.length} onChange={e => {
                          if (e.target.checked) setSelectedPaymentItems(mergedInvoices.map((_, idx) => idx));
                          else setSelectedPaymentItems([]);
                        }} style={{ cursor: 'pointer' }} />
                      </div>
                      {['Invoice ID', 'Client', 'Project', 'Category', 'Amount', 'Issue Date', 'Due Date', 'Status', 'Actions'].map(h => (
                        <div key={h} style={{ fontSize: 10, fontWeight: 900, color: '#7B8FA1', textTransform: 'uppercase', letterSpacing: '.7px' }}>{h}</div>
                      ))}
                    </div>
                    {/* Rows */}
                    {(mergedInvoices && mergedInvoices.length > 0) ? (
                      mergedInvoices.map((invoiceRec, i) => {
                        const inv = invoiceRec;
                        const invTaxAmt = inv.taxType === 'inclusive' ? 0 : Math.round((inv.amount || 0) * (inv.taxPercent || 0) / 100);
                        const totalInvoiceAmt = (inv.amount || 0) + invTaxAmt;
                        return (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1.2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 100px', gap: 8, padding: '0 18px', alignItems: 'center', minHeight: 56, borderBottom: '1px solid #E8EDF2', borderLeft: `3px solid ${(inv.status || '').toLowerCase() === 'paid' ? '#22C55E' : (inv.status || '').toLowerCase() === 'overdue' ? '#EF4444' : '#F59E0B'}` }}>
                            {/* Checkbox */}
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <input type="checkbox" checked={selectedPaymentItems.includes(i)} onChange={e => {
                                if (e.target.checked) setSelectedPaymentItems(prev => [...prev, i]);
                                else setSelectedPaymentItems(prev => prev.filter(idx => idx !== i));
                              }} style={{ cursor: 'pointer' }} />
                            </div>
                            {/* Invoice ID */}
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#00BCD4', cursor: 'pointer' }}>{inv.invoiceNo || `INV-00${i + 1}`}</div>
                            {/* Client */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#00BCD4,#006E7F)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                                {(clientName || '?')[0].toUpperCase()}
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#0D1B2A' }}>{clientName || '—'}</span>
                            </div>
                            {/* Project */}
                            <div style={{ fontSize: 12, color: '#7B8FA1', fontWeight: 600 }}>{currProject?.name || '—'}</div>
                            {/* Category */}
                            <div>
                              {(() => {
                                const st = (inv.status || '').toLowerCase();
                                if (st === 'paid' || st === 'part_paid') return <span style={{ background: '#E0F2FE', color: '#0369A1', borderRadius: 20, padding: '3px 9px', fontSize: 10, fontWeight: 800 }}>Advance</span>;
                                if (st === 'draft') return <span style={{ background: '#F1F5F9', color: '#64748B', borderRadius: 20, padding: '3px 9px', fontSize: 10, fontWeight: 800 }}>Draft</span>;
                                return <span style={{ background: '#EDE9FE', color: '#7C3AED', borderRadius: 20, padding: '3px 9px', fontSize: 10, fontWeight: 800 }}>Milestone</span>;
                              })()}
                            </div>
                            {/* Amount */}
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 900, color: (inv.status || '').toLowerCase() === 'paid' ? '#15803D' : '#0D1B2A' }}>{currency}{totalInvoiceAmt.toLocaleString()}</div>
                              <div style={{ fontSize: 9, color: '#7B8FA1', fontWeight: 600 }}>{inv.taxType === 'inclusive' ? 'Incl. Tax' : 'Excl. Tax'}</div>
                            </div>
                            {/* Issue Date */}
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#2D3E50' }}>{(inv.issueDate || inv.date) ? new Date(inv.issueDate || inv.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
                            {/* Due Date */}
                            <div style={{ fontSize: 12, fontWeight: (inv.status || '').toLowerCase() === 'overdue' ? 800 : 700, color: (inv.status || '').toLowerCase() === 'overdue' ? '#EF4444' : '#2D3E50' }}>{(inv.dueDate || inv.inv?.dueDate) ? new Date(inv.dueDate || inv.inv?.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
                            {/* Status */}
                            <div>
                              {(() => {
                                const st = (inv.status || 'pending').toLowerCase();
                                const map = {
                                  paid: { bg: '#DCFCE7', color: '#15803D' },
                                  part_paid: { bg: '#D1FAE5', color: '#065F46' },
                                  unpaid: { bg: '#FEF3C7', color: '#B45309' },
                                  pending: { bg: '#FEF3C7', color: '#B45309' },
                                  overdue: { bg: '#FEE2E2', color: '#DC2626' },
                                  sent: { bg: '#DBEAFE', color: '#1D4ED8' },
                                  draft: { bg: '#F1F5F9', color: '#64748B' },
                                };
                                const s = map[st] || map.pending;
                                return (
                                  <select value={inv.status || 'pending'} onChange={async e => {
                                    const newStatus = e.target.value;
                                    if (inv._source === 'global') {
                                      await axios.patch(`${BASE_URL}/api/invoices/${inv._globalId}/status`, { status: newStatus });
                                    } else {
                                      const updatedInvoices = (currProject.invoices || []).map((x, xi) => xi === i ? { ...x, status: newStatus } : x);
                                      await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, { invoices: updatedInvoices });
                                    }
                                    loadLatest();
                                  }} style={{ background: s.bg, color: s.color, border: 'none', borderRadius: 20, padding: '3px 9px', fontSize: 10, fontWeight: 800, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                                    <option value="draft">Draft</option>
                                    <option value="sent">Sent</option>
                                    <option value="part_paid">Part Paid</option>
                                    <option value="paid">Paid</option>
                                    <option value="unpaid">Unpaid</option>
                                    <option value="overdue">Overdue</option>
                                  </select>
                                );
                              })()}
                            </div>

                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              <div style={{ position: 'relative' }}>
                                <button onClick={() => {
                                  const fullGlobal = inv._source === 'global' ? projectInvoices.find(g => g.id === inv._globalId) : null;
                                  if (inv._source === 'global' && onViewInvoice) {
                                    onViewInvoice(fullGlobal || inv);
                                  } else if (onViewInvoice) {
                                    onViewInvoice({ ...inv, projectName: currProject.name, clientName, currency });
                                  } else {
                                    setPreviewInvoice(prev => prev?.invoiceNo === inv.invoiceNo ? null : { ...inv, projectName: currProject.name, clientName, currency });
                                  }
                                }} style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: '1px solid #E8EDF2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#00BCD4' }} title="View Invoice"><i className="ti ti-eye"></i></button>
                              </div>
                              {inv._source === 'global' ? (
                                <button onClick={async () => {
                                  try {
                                    const res = await axios.get(`${BASE_URL}/api/invoices`);
                                    const all = res.data?.invoices || res.data || [];
                                    const fullGlobal = all.find(g => g.id === inv._globalId || g._id === inv._globalId);
                                    const rawInv = fullGlobal?.inv || {};
                                    const editData = {
                                      ...rawInv,
                                      invoiceNo: rawInv.invoiceNo || fullGlobal?.invoiceNo || inv.invoiceNo,
                                      client: rawInv.client || fullGlobal?.client || clientName,
                                      project: rawInv.project || currProject.name,
                                      date: rawInv.date || fullGlobal?.date || inv.issueDate,
                                      dueDate: rawInv.dueDate || fullGlobal?.dueDate || inv.dueDate,
                                      status: rawInv.status || fullGlobal?.status || inv.status,
                                      items: rawInv.items?.length ? rawInv.items : [{ id: 1, description: rawInv.notes || inv.description || '', quantity: 1, rate: fullGlobal?.total || inv.amount || '' }],
                                      notes: rawInv.notes || '',
                                      terms: rawInv.terms || '',
                                      companyName: rawInv.companyName || '',
                                      companyEmail: rawInv.companyEmail || '',
                                      companyPhone: rawInv.companyPhone || '',
                                      companyAddress: rawInv.companyAddress || '',
                                      bankName: rawInv.bankName || '',
                                      accountNumber: rawInv.accountNumber || '',
                                      ifscCode: rawInv.ifscCode || '',
                                      upiId: rawInv.upiId || '',
                                      currency: rawInv.currency || 'INR',
                                      gstRate: rawInv.gstRate || 18,
                                      amountPaid: rawInv.amountPaid || 0,
                                      signature: rawInv.signature || '',
                                      signatureType: rawInv.signatureType || 'text',
                                      template: rawInv.template || 'Classic',
                                      footerMessage: rawInv.footerMessage || '',
                                    };
                                    if (onNewInvoice) {
                                      onNewInvoice(currProject, {
                                        editData: editData,
                                        invoiceNo: editData.invoiceNo || inv.invoiceNo,
                                        client: editData.client || editData.clientName || clientName,
                                        project: editData.project || currProject.name,
                                        date: editData.date || editData.issueDate || inv.issueDate,
                                        dueDate: editData.dueDate || inv.dueDate,
                                        status: editData.status || inv.status,
                                        items: editData.items || editData.lineItems || [{ id: 1, description: editData.description || inv.description || '', quantity: 1, rate: editData.amount || inv.amount || '' }],
                                        notes: editData.notes || inv.notes || '',
                                        terms: editData.terms || inv.terms || '',
                                        companyName: editData.companyName || '',
                                        companyEmail: editData.companyEmail || '',
                                        companyPhone: editData.companyPhone || '',
                                        companyAddress: editData.companyAddress || '',
                                        bankName: editData.bankName || '',
                                        accountNumber: editData.accountNumber || '',
                                        ifscCode: editData.ifscCode || '',
                                        upiId: editData.upiId || '',
                                        currency: editData.currency || inv.currency || 'INR',
                                        gstRate: editData.gstRate || 18,
                                        amountPaid: editData.amountPaid || 0,
                                        signature: editData.signature || '',
                                        signatureType: editData.signatureType || 'text',
                                        template: editData.template || 'Classic',
                                        footerMessage: editData.footerMessage || '',
                                        editIndex: i,
                                        isEdit: true,
                                        projectId: currProject._id,
                                        globalInvoiceId: inv._globalId,
                                      });
                                    }
                                  } catch (err) {
                                    console.error('Failed to fetch invoice for edit:', err);
                                  }
                                }} title="Edit" style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: '1px solid #E8EDF2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#7B8FA1' }}><i className="ti ti-edit"></i></button>

                              ) : (
                                <button onClick={() => {
                                  const payload = {
                                    editData: { ...inv, client: inv.clientName || clientName, project: currProject.name },
                                    editIndex: i,
                                    isEdit: true,
                                    projectId: currProject._id,
                                  };
                                  if (onNewInvoice) {
                                    onNewInvoice(currProject, payload);
                                  } else {
                                    setPaymentModalsState(prev => ({
                                      ...prev,
                                      showNewInvoice: true,
                                      showPayment: false,
                                      showAdvance: false,
                                      showMilestonePayment: false,
                                      showAdditional: false,
                                      showExpense: false,
                                      editData: { ...inv },
                                      editIndex: i,
                                    }));
                                  }
                                }} style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: '1px solid #E8EDF2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#7B8FA1' }} title="Edit"><i className="ti ti-edit"></i></button>
                              )}                           {inv._source === 'global' ? (
                                <button onClick={async () => { if (confirm('Delete this invoice?')) { await axios.delete(`${BASE_URL}/api/invoices/${inv._globalId}`); loadLatest(); } }} style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: '1px solid #E8EDF2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#EF4444' }} title="Delete"><i className="ti ti-trash"></i></button>
                              ) : (
                                <button onClick={() => handleDeleteRecord('invoices', i)} style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: '1px solid #E8EDF2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#EF4444' }} title="Delete"><i className="ti ti-trash"></i></button>
                              )}
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div style={{ padding: '32px 20px', textAlign: 'center', color: '#7B8FA1', fontSize: 13 }}>
                        <i className="ti ti-file-invoice" style={{ fontSize: 32, display: 'block', marginBottom: 10, opacity: .3 }}></i>
                        No invoices yet for this project.
                        <div style={{ marginTop: 12 }}>
                          <button onClick={() => { if (onNewInvoice) { onNewInvoice(currProject); } else { setPaymentModalsState(prev => ({ ...prev, showNewInvoice: true })); } }} style={{ padding: '8px 18px', background: '#00BCD4', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                            <i className="ti ti-plus" style={{ marginRight: 6 }}></i>Create First Invoice
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PAYMENT / ADVANCE / ADDITIONAL / MILESTONE / EXPENSES panels (hidden by default) */}
                  {[{ key: 'pay', label: 'Payments Received', btnLabel: 'Record Payment', icon: 'ti-credit-card', color: '#22C55E' }, { key: 'adv', label: 'Advance Payments', btnLabel: 'Add Advance', icon: 'ti-pig-money', color: '#8B5CF6' }, { key: 'add', label: 'Additional Charges', btnLabel: 'Add Charge', icon: 'ti-circle-plus', color: '#F97316' }, { key: 'mile', label: 'Milestone Payments', btnLabel: 'Add Milestone', icon: 'ti-flag', color: '#F59E0B' }, { key: 'exp', label: 'Expenses', btnLabel: 'Add Expense', icon: 'ti-receipt', color: '#6B7280' }].map(p => {
                    const arrayKeyMap = { pay: 'paymentsReceived', adv: 'advances', add: 'additionalCharges', mile: 'milestonePayments', exp: 'expenses' };
                    const arrayName = arrayKeyMap[p.key];
                    const records = currProject[arrayName] || [];
                    return (
                      <div key={p.key} data-paytab={p.key} style={{ display: activePayTab === p.key ? 'block' : 'none', background: '#fff', border: '1px solid #E8EDF2', borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #E8EDF2' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 900, color: '#0D1B2A' }}>
                            <i className={`ti ${p.icon}`} style={{ color: p.color, fontSize: 15 }}></i> {p.label}
                          </div>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            {selectedPaymentItems.length > 0 && activePayTab === p.key && (
                              <button onClick={handleSendSelectedToPortal} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                                <i className="ti ti-send" style={{ fontSize: 13 }}></i> Send Selected ({selectedPaymentItems.length}) to Client Portal
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (p.key === 'pay') setPaymentModalsState(prev => ({ ...prev, showPayment: true }));
                                else if (p.key === 'adv') setPaymentModalsState(prev => ({ ...prev, showAdvance: true }));
                                else if (p.key === 'add') setPaymentModalsState(prev => ({ ...prev, showAdditional: true }));
                                else if (p.key === 'mile') setPaymentModalsState(prev => ({ ...prev, showMilestonePayment: true }));
                                else if (p.key === 'exp') setPaymentModalsState(prev => ({ ...prev, showExpense: true }));
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#00BCD4', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                              <i className="ti ti-plus" style={{ fontSize: 13 }}></i> {p.btnLabel}
                            </button>
                          </div>
                        </div>

                        {records.length > 0 ? (
                          <div>
                            {/* Headers */}
                            <div style={{ display: 'grid', gridTemplateColumns: (p.key === 'add' || p.key === 'exp') ? '40px 2fr 1fr 1fr 1fr 1fr 80px' : '40px 1fr 1fr 1fr 1fr 1fr 80px', gap: 8, padding: '8px 18px', background: '#FAFBFD', borderBottom: '1px solid #E8EDF2' }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <input type="checkbox" checked={records.length > 0 && selectedPaymentItems.length === records.length} onChange={e => {
                                  if (e.target.checked) setSelectedPaymentItems(records.map((_, idx) => idx));
                                  else setSelectedPaymentItems([]);
                                }} style={{ cursor: 'pointer' }} />
                              </div>
                              {p.key === 'pay' && ['Payment #', 'Invoice', 'Amount', 'Date', 'Mode', ''].map(h => <div key={h} style={{ fontSize: 10, fontWeight: 900, color: '#7B8FA1', textTransform: 'uppercase' }}>{h}</div>)}
                              {p.key === 'adv' && ['Advance #', 'Description', 'Amount', 'Date', 'Status', ''].map(h => <div key={h} style={{ fontSize: 10, fontWeight: 900, color: '#7B8FA1', textTransform: 'uppercase' }}>{h}</div>)}
                              {p.key === 'add' && ['Charge', 'Amount', 'Date', 'Category', 'Status', ''].map(h => <div key={h} style={{ fontSize: 10, fontWeight: 900, color: '#7B8FA1', textTransform: 'uppercase' }}>{h}</div>)}
                              {p.key === 'mile' && ['Milestone #', 'Name', 'Amount', 'Due Date', 'Status', ''].map(h => <div key={h} style={{ fontSize: 10, fontWeight: 900, color: '#7B8FA1', textTransform: 'uppercase' }}>{h}</div>)}
                              {p.key === 'exp' && ['Expense', 'Amount', 'Date', 'Category', 'Status', ''].map(h => <div key={h} style={{ fontSize: 10, fontWeight: 900, color: '#7B8FA1', textTransform: 'uppercase' }}>{h}</div>)}
                            </div>
                            {/* Rows */}
                            {records.map((rec, i) => (
                              <div key={i} style={{ display: 'grid', gridTemplateColumns: (p.key === 'add' || p.key === 'exp') ? '40px 2fr 1fr 1fr 1fr 1fr 80px' : '40px 1fr 1fr 1fr 1fr 1fr 80px', gap: 8, padding: '8px 18px', alignItems: 'center', minHeight: 56, borderBottom: '1px solid #E8EDF2', borderLeft: (p.key === 'add' || p.key === 'exp') ? `3px solid ${rec.status === 'Paid' ? '#22C55E' : '#F59E0B'}` : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <input type="checkbox" checked={selectedPaymentItems.includes(i)} onChange={e => {
                                    if (e.target.checked) setSelectedPaymentItems(prev => [...prev, i]);
                                    else setSelectedPaymentItems(prev => prev.filter(idx => idx !== i));
                                  }} style={{ cursor: 'pointer' }} />
                                </div>

                                {(p.key === 'add' || p.key === 'exp') ? (
                                  <div>
                                    <div style={{ fontSize: 10, fontWeight: 800, color: '#7B8FA1' }}>{rec.chargeNo || rec.expenseNo}</div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1B2A', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                                      {rec.description || '—'}
                                      {rec.notifyClient && (
                                        <span style={{ background: '#E8F5E9', color: '#2E7D32', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                          <i className="ti ti-circle-check" style={{ fontSize: 9 }}></i> Portal
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#7B8FA1', fontWeight: 600, marginTop: 2 }}>{rec.notes || '—'}</div>
                                  </div>
                                ) : (
                                  <>
                                    <div>
                                      <div style={{ fontSize: 12, fontWeight: 800, color: '#0D1B2A', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {rec.paymentNo || rec.advanceNo || rec.chargeNo || rec.milestoneNo}
                                        {rec.notifyClient && (
                                          <span style={{ background: '#E8F5E9', color: '#2E7D32', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                            <i className="ti ti-circle-check" style={{ fontSize: 9 }}></i> Portal
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ fontSize: 12, fontWeight: 700, color: '#7B8FA1' }}>{rec.linkedInvoice || rec.description || rec.name || '—'}</div>
                                    </div>
                                  </>
                                )}

                                <div style={{ fontSize: 13, fontWeight: 800, color: '#15803D' }}>{currency}{(rec.amount || 0).toLocaleString()}</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#2D3E50' }}>{rec.paymentDate || rec.dateReceived || rec.date || rec.dueDate ? new Date(rec.paymentDate || rec.dateReceived || rec.date || rec.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>

                                {(p.key === 'add' || p.key === 'exp') ? (
                                  <div>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, background: '#FFEDD5', color: '#C2410C' }}>
                                      <i className="ti ti-tag" style={{ fontSize: 10 }}></i> {rec.category || 'Other'}
                                    </span>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>{rec.paymentMode || rec.adjustmentStatus || rec.status || '—'}</div>
                                )}

                                {(p.key === 'add' || p.key === 'exp') ? (
                                  <div>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 900, background: rec.status === 'Paid' ? '#DCFCE7' : '#FEF3C7', color: rec.status === 'Paid' ? '#15803D' : '#B45309' }}>
                                      <i className={`ti ${rec.status === 'Paid' ? 'ti-circle-check' : 'ti-clock'}`} style={{ fontSize: 10 }}></i>
                                      {rec.status || 'Pending'}
                                    </span>
                                  </div>
                                ) : null}

                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button onClick={() => {
                                    let modalKey = '';
                                    if (p.key === 'pay') modalKey = 'showPayment';
                                    else if (p.key === 'adv') modalKey = 'showAdvance';
                                    else if (p.key === 'add') modalKey = 'showAdditional';
                                    else if (p.key === 'mile') modalKey = 'showMilestonePayment';
                                    else if (p.key === 'exp') modalKey = 'showExpense';
                                    setPaymentModalsState(prev => ({ ...prev, [modalKey]: true, editData: rec, editIndex: i }));
                                  }} style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: '1px solid #E8EDF2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#7B8FA1' }} title="Edit"><i className="ti ti-edit"></i></button>
                                  <button onClick={() => handleDeleteRecord(arrayName, i)} style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: '1px solid #E8EDF2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#EF4444' }} title="Delete"><i className="ti ti-trash"></i></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ padding: '32px 20px', textAlign: 'center', color: '#7B8FA1', fontSize: 13 }}>
                            <i className={`ti ${p.icon}`} style={{ fontSize: 32, display: 'block', marginBottom: 10, opacity: .3, color: p.color }}></i>
                            No {p.label.toLowerCase()} recorded yet.
                          </div>
                        )}
                      </div>
                    )
                  })}

                </div>
              </div>

            </div>{/* end tabContentRef wrapper */}
          </div>
        </div>

        {/* RIGHT COL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* TEAM */}
          <div className="mpd-card">
            <div className="mpd-card-header">
              <div className="mpd-card-title"><i className="ti ti-users"></i> Team</div>
              <button className="mpd-btn mpd-btn-outline" onClick={() => setShowAddMemberModal(true)} style={{ padding: '5px 10px', fontSize: 11 }}>
                <i className="ti ti-plus"></i> Add Team Members
              </button>
            </div>
            {assigned.length === 0 ? <div style={{ fontSize: 12, color: P.textLight }}>No team members assigned.</div> : null}
            {assigned.map((a, i) => (
              <div key={i} className="mpd-member-row" style={{ display: 'flex', alignItems: 'center' }}>
                <div className="mpd-av mpd-av-sm" style={{ background: getAvatarColor(a) }}>{getInitials(a)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: P.textDark }}>{a}</div>
                  <div style={{ fontSize: 11, color: P.textLight }}>
                    {employees.find(e => (e.name || e.employeeName) === a)?.role || 'Member'}
                  </div>
                </div>
                <button onClick={() => { if (window.confirm('Remove ' + a + ' from team?')) { const updated = (currProject.assignedTo || []).filter((_, idx) => idx !== i); axios.put(`${BASE_URL}/api/projects/${currProject._id}`, { assignedTo: updated }).then(loadLatest); } }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.red, fontSize: 14, padding: '4px 6px' }} title="Remove">Delete</button>
              </div>
            ))}
          </div>

          {/* BUDGET */}
          <div className="mpd-card">
            <div className="mpd-card-header">
              <div className="mpd-card-title"><i className="ti ti-wallet"></i> Budget</div>
            </div>
            <div className="mpd-brow"><span className="mpd-lbl">Total Budget</span><span className="mpd-val">{currency}{budgetAmt.toLocaleString()}</span></div>
            {[['Billed', 'billed', billed, ''], ['Received', 'received', received, 'mpd-g']].map(([lbl, key, val, cls]) => (
              <div key={key} className="mpd-brow">
                <span className="mpd-lbl">{lbl}</span>
                <span className={`mpd-val ${cls}`}>
                  {currency}{val.toLocaleString()}
                </span>
              </div>
            ))}
            <div className="mpd-brow">
              <span className="mpd-lbl">Pending</span>
              <span className="mpd-val mpd-r">{currency}{pending.toLocaleString()}</span>
            </div>
            <div className="mpd-brow"><span className="mpd-lbl">Spent</span><span className="mpd-val">{currency}{spent.toLocaleString()}</span></div>
            <div className="mpd-brow"><span className="mpd-lbl">Remaining</span><span className="mpd-val mpd-p">{currency}{remaining.toLocaleString()}</span></div>
            <div style={{ marginTop: 10 }}>
              <div className="mpd-progress-bg"><div className="mpd-progress-fill mpd-purple" style={{ width: `${budgetUsedPct}%` }}></div></div>
              <div style={{ fontSize: 11, color: P.textLight, marginTop: 4 }}>{budgetUsedPct}% used</div>
            </div>
          </div>

          {/* FILES */}
          <div className="mpd-card">
            <div className="mpd-card-header">
              <div className="mpd-card-title"><i className="ti ti-paperclip"></i> Files</div>
              <button className="mpd-btn mpd-btn-outline" onClick={() => setShowUploadModal(true)} style={{ padding: '5px 10px', fontSize: 11 }}>
                <i className="ti ti-upload"></i> Upload
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept="image/*"
            />

            {(!currProject.files || currProject.files.length === 0) ? (
              <div style={{ fontSize: 12, color: P.textLight, textAlign: 'center', padding: '10px 0' }}>No files attached.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {currProject.files.map((file) => (
                  <div key={file._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', border: `1.5px solid ${P.border}`, borderRadius: 8 }}>
                    <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: P.primary, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                      <i className="ti ti-file" style={{ marginRight: 6 }}></i>
                      {file.name}
                    </a>
                    <button onClick={() => handleDeleteFile(file._id)} style={{ background: 'transparent', border: 'none', color: P.red, cursor: 'pointer', fontSize: 14 }}>
                      Close
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PORTAL LINK */}
          <div className="mpd-card" style={{ background: `linear-gradient(135deg, ${P.primaryLight}, #fff)`, border: `1.5px solid ${P.primaryMid}` }}>
            <div className="mpd-card-title" style={{ marginBottom: 12 }}><i className="ti ti-building"></i> Client Portal</div>
            <div style={{ fontSize: 12, color: P.textMid, marginBottom: 16 }}>The client has access to their project portal with live progress, files, invoices and updates.</div>
            <button className="mpd-btn mpd-btn-primary" onClick={() => setShowPortalPreview(true)} style={{ width: '100%', justifyContent: 'center' }}><i className="ti ti-external-link"></i> View Portal</button>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {
        showAddTaskModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99995, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: P.radius, width: 440, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 18, color: P.textDark }}>{editingTask ? 'Edit Task' : 'Add New Task'}</h3>
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
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: P.textLight, marginBottom: 4 }}>Link to Milestone (Optional)</label>
                  <select value={newTaskMilestone} onChange={e => setNewTaskMilestone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1.5px solid ${P.border}`, outline: 'none', boxSizing: 'border-box' }}>
                    <option value="">-- No Milestone --</option>
                    {(currProject.milestones || []).map((m, i) => (
                      <option key={i} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: P.textLight, marginBottom: 4 }}>Assign To</label>
                  <div style={{ border: `1.5px solid ${P.border}`, borderRadius: 8, maxHeight: 150, overflowY: 'auto', padding: '4px 0' }}>
                    {(employees || []).map(emp => {
                      const name = emp.name || emp.employeeName || 'Unassigned';
                      const selected = Array.isArray(newTaskAssignTo) ? newTaskAssignTo.includes(name) : false;
                      return (
                        <div key={emp._id} onClick={() => {
                          if (name === 'Unassigned') { setNewTaskAssignTo([]); return; }
                          const cur = Array.isArray(newTaskAssignTo) ? newTaskAssignTo.filter(n => n !== 'Unassigned') : [];
                          setNewTaskAssignTo(selected ? cur.filter(n => n !== name) : [...cur, name]);
                        }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', background: selected ? P.primaryLight : 'transparent' }}>
                          <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${selected ? P.primary : P.border}`, background: selected ? P.primary : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {selected && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900, lineHeight: 1 }}>Yes</span>}
                          </div>
                          <span style={{ fontSize: 13, color: P.textDark, fontWeight: selected ? 700 : 500 }}>{name}</span>
                        </div>
                      );
                    })}
                  </div>
                  {Array.isArray(newTaskAssignTo) && newTaskAssignTo.length > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {newTaskAssignTo.map(n => (
                        <span key={n} style={{ background: P.primaryLight, color: P.primary, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{n} ×</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" className="mpd-btn mpd-btn-outline" onClick={() => setShowAddTaskModal(false)}>Cancel</button>
                  <button type="submit" className="mpd-btn mpd-btn-primary" disabled={addingTask}>{addingTask ? 'Adding...' : editingTask ? 'Update Task' : 'Add Task'}</button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Add Member Modal */}
      {
        showAddMemberModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99996, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: P.radius, width: 380, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, color: P.textDark }}>Add Team Member</h3>
              <select value={selectedNewMember} onChange={e => setSelectedNewMember(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1.5px solid ${P.border}`, fontSize: 13, outline: 'none', marginBottom: 16 }}>
                <option value="">-- Select Employee --</option>
                {(employees || []).filter(emp => !assigned.includes(emp.name || emp.employeeName)).map(emp => (
                  <option key={emp._id} value={emp.name || emp.employeeName}>{emp.name || emp.employeeName} ({emp.role || 'Employee'})</option>
                ))}
              </select>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="mpd-btn mpd-btn-outline" onClick={() => { setShowAddMemberModal(false); setSelectedNewMember(''); }}>Cancel</button>
                <button className="mpd-btn mpd-btn-primary" disabled={!selectedNewMember} onClick={async () => {
                  if (!selectedNewMember) return;
                  const updated = [...(currProject.assignedTo || []), selectedNewMember];
                  await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, { assignedTo: updated });
                  setShowAddMemberModal(false);
                  setSelectedNewMember('');
                  loadLatest();
                }}>Add</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Portal Live Preview Overlay */}
      {
        showPortalPreview && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#fff', overflowY: 'auto', padding: 20 }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: `1px solid ${P.border}`, paddingBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 20, color: P.textDark }}>Client Portal Live Preview</h2>
                <button className="mpd-btn mpd-btn-danger" onClick={() => { setShowPortalPreview(false); onBack(); }}>
                  <i className="ti ti-arrow-right"></i> {hideTopActions ? 'Next' : 'Exit Preview'}
                </button>
              </div>
              <ModernEmployeeProjectDetails
                project={currProject}
                tasks={currTasks}
                user={{ role: 'client', name: currProject.client }}
                onBack={() => setShowPortalPreview(false)}
                onMessageTeam={() => { setShowPortalPreview(false); if (onMessageTeam) onMessageTeam(); }}
              />
            </div>
          </div>
        )
      }

      {/* Payment Modals */}
      <ProjectPaymentModals
        project={currProject}
        modalsState={paymentModalsState}
        setModalsState={setPaymentModalsState}
        onSaveSuccess={loadLatest}
      />

      {/* Send to Client Popup */}
      {
        showSendPopup && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: 400, borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #E8EDF2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1B2A' }}>Send to Client Portal</div>
                <button onClick={() => setShowSendPopup(false)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#7B8FA1', cursor: 'pointer' }}>Close</button>
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Select Client</div>
                <select value={targetPortalClient} onChange={e => setTargetPortalClient(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E8EDF2', fontSize: 13, color: '#1A2332', outline: 'none', background: '#FAFBFD' }}>
                  <option value="">-- Select Client --</option>
                  <option value={currProject.client}>{currProject.client || 'Project Client'}</option>
                  {clients && clients.filter(c => (c.clientName || c.name) !== currProject.client).map(c => (
                    <option key={c._id || c.clientName || c.name} value={c.clientName || c.name}>{c.clientName || c.name}</option>
                  ))}
                </select>
                <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowSendPopup(false)} style={{ flex: 1, padding: '10px', background: '#F3F4F6', color: '#4B5563', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={() => handleSendSelectedToPortal(targetPortalClient)} disabled={!targetPortalClient} style={{ flex: 1, padding: '10px', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: !targetPortalClient ? 'not-allowed' : 'pointer', opacity: !targetPortalClient ? 0.5 : 1 }}>Send ({selectedPaymentItems.length})</button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Invoice Preview Modal */}
      {
        previewInvoice && (() => {
          const inv = previewInvoice;
          const taxAmt = inv.taxType === 'inclusive'
            ? Math.round((inv.amount || 0) - (inv.amount || 0) / (1 + (inv.taxPercent || 0) / 100))
            : Math.round((inv.amount || 0) * (inv.taxPercent || 0) / 100);
          const subtotal = inv.taxType === 'inclusive'
            ? Math.round((inv.amount || 0) / (1 + (inv.taxPercent || 0) / 100))
            : (inv.amount || 0);
          const total = inv.taxType === 'inclusive' ? (inv.amount || 0) : (inv.amount || 0) + taxAmt;
          const s = (inv.status || '').toLowerCase();
          const statusColor = s === 'paid' ? '#22C55E' : s === 'overdue' ? '#EF4444' : s === 'sent' ? '#3B82F6' : s === 'pending' ? '#F59E0B' : '#94A3B8';
          const statusBg = s === 'paid' ? '#DCFCE7' : s === 'overdue' ? '#FEE2E2' : s === 'sent' ? '#DBEAFE' : s === 'pending' ? '#FEF3C7' : '#F1F5F9';
          return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '30px 16px' }}>
              <div style={{ background: '#fff', width: '100%', maxWidth: 640, borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', fontFamily: 'Arial,sans-serif', overflow: 'hidden' }}>
                <div style={{ background: '#1A2332', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className="ti ti-file-invoice" style={{ color: '#00BCD4', fontSize: 18 }}></i>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>Invoice Preview — {inv.invoiceNo}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setPreviewInvoice(null); setPaymentModalsState(prev => ({ ...prev, showNewInvoice: true, editData: inv, editIndex: (currProject.invoices || []).findIndex(i => i.invoiceNo === inv.invoiceNo) })); }} style={{ padding: '6px 14px', background: '#fff', color: '#374151', border: '1px solid #E8EDF2', borderRadius: 7, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                      <i className="ti ti-edit"></i> Edit
                    </button>
                    <button onClick={() => { if (confirm('Delete this invoice?')) { handleDeleteRecord('invoices', (currProject.invoices || []).findIndex(i => i.invoiceNo === inv.invoiceNo)); setPreviewInvoice(null); } }} style={{ padding: '6px 14px', background: '#FEE2E2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: 7, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                      <i className="ti ti-trash"></i> Delete
                    </button>
                    <button onClick={() => window.print()} style={{ padding: '6px 14px', background: '#00BCD4', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                      <i className="ti ti-printer"></i> Print / PDF
                    </button>
                    <button onClick={() => setPreviewInvoice(null)} style={{ padding: '6px 14px', background: '#374151', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Close Close</button>
                  </div>
                </div>
                <div id="invoice-print-area" style={{ padding: '36px 40px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                    <div>
                      {user?.logoUrl ? (
                        <img src={user.logoUrl} alt="Logo" style={{ height: 70, borderRadius: 12, marginBottom: 12, objectFit: 'contain' }} />
                      ) : (
                        <div style={{ width: 60, height: 60, borderRadius: 12, background: 'linear-gradient(135deg,#00BCD4,#0097A7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                          <span style={{ color: '#fff', fontWeight: 900, fontSize: 24 }}>{(user?.companyName || 'Y')[0].toUpperCase()}</span>
                        </div>
                      )}
                      <div style={{ fontWeight: 900, fontSize: 20, color: '#0f1c2e', letterSpacing: '1px', textTransform: 'uppercase' }}>{user?.companyName || 'YOUR COMPANY'}</div>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4, lineHeight: 1.7 }}>
                        {user?.email}<br />{user?.phone}<br />{user?.address}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 32, fontWeight: 900, color: 'rgba(0,188,212,0.1)', letterSpacing: '-1px', marginBottom: 4 }}>INVOICE</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#00BCD4' }}>{inv.invoiceNo}</div>
                      <div style={{ display: 'flex', gap: 20, marginTop: 14, justifyContent: 'flex-end' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 3 }}>Date</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f1c2e' }}>{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 3 }}>Due Date</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#ea580c' }}>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
                        </div>
                      </div>
                      {inv.status && inv.status.toLowerCase() !== 'draft' && (
                        <div style={{ marginTop: 12, textAlign: 'right' }}>
                          <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: statusBg, color: statusColor, fontSize: 11, fontWeight: 800, border: `1.5px solid ${statusColor}`, letterSpacing: 1 }}>
                            {inv.status.charAt(0).toUpperCase() + inv.status.slice(1).toLowerCase()}
                          </span>
                        </div>
                      )}
                      <div style={{ marginTop: 24 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'right', marginBottom: 6 }}>Project</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f1c2e', textAlign: 'right' }}>{inv.projectName || currProject.name}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ borderBottom: '2px solid #E8EDF2', paddingBottom: 20, marginBottom: 20 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 10 }}>Bill To</div>
                    <div style={{ fontWeight: 800, fontSize: 17, color: '#0f1c2e' }}>{inv.clientName || clientName}</div>
                    <div style={{ fontSize: 13, color: '#00BCD4', fontWeight: 600, marginTop: 2 }}>{inv.clientName || clientName}</div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['#', 'Description', 'Qty', 'Unit Rate', 'Tax Rate', 'Amount'].map(h => (
                          <th key={h} style={{ padding: '9px 11px', textAlign: h === 'Amount' || h === 'Unit Rate' || h === 'Qty' || h === 'Tax Rate' ? 'right' : 'left', fontSize: 9, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5, borderBottom: '2px solid #E8EDF2' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #E8EDF2' }}>
                        <td style={{ padding: '12px 11px', fontSize: 12, color: '#64748b', fontWeight: 700 }}>01</td>
                        <td style={{ padding: '12px 11px', fontSize: 13, color: '#0f1c2e', fontWeight: 600 }}>{inv.description || 'Service'}</td>
                        <td style={{ padding: '12px 11px', fontSize: 13, color: '#374151', textAlign: 'right' }}>1</td>
                        <td style={{ padding: '12px 11px', fontSize: 13, color: '#374151', textAlign: 'right' }}>{currency}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '12px 11px', fontSize: 13, color: '#6b7280', textAlign: 'right' }}>{inv.taxPercent || 0}%</td>
                        <td style={{ padding: '12px 11px', fontSize: 14, color: '#0f1c2e', textAlign: 'right', fontWeight: 700 }}>{currency}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
                    <div style={{ width: 200 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 10, borderBottom: '1px solid #E8EDF2' }}>
                        <span style={{ color: '#64748b' }}>Subtotal</span><span style={{ fontWeight: 700 }}>{currency}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 10, borderBottom: '1px solid #E8EDF2' }}>
                        <span style={{ color: '#64748b' }}>GST / Tax</span><span style={{ fontWeight: 700 }}>{currency}{taxAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#0f1c2e', borderRadius: 6, marginTop: 4, color: '#fff' }}>
                        <span style={{ fontSize: 10, fontWeight: 800 }}>Balance Due</span>
                        <span style={{ fontSize: 12, fontWeight: 900 }}>{currency}{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                  {inv.notes && (
                    <div style={{ borderTop: '1px solid #E8EDF2', paddingTop: 14 }}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: '#00BCD4', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 2 }}>Notes</div>
                      <div style={{ fontSize: 8, color: '#64748b', lineHeight: 1.5 }}>{inv.notes}</div>
                    </div>
                  )}
                </div>

                {/* ── Footer Status Bar ── */}
                {/* ── Footer Status Bar ── */}
                <div style={{ borderTop: '1px solid #E8EDF2', padding: '10px 40px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{inv.invoiceNo}</div>
                  <div style={{ position: 'relative' }}>
                    {(() => {
                      const st = (inv.status || '').toLowerCase();
                      const cfg = st === 'paid'
                        ? { label: 'Paid', bg: '#DCFCE7', color: '#15803D', icon: '' }
                        : st === 'overdue'
                          ? { label: 'Overdue', bg: '#FEE2E2', color: '#DC2626', icon: '' }
                          : st === 'sent'
                            ? { label: 'Sent', bg: '#DBEAFE', color: '#1D4ED8', icon: '' }
                            : { label: 'Pending', bg: '#FEF3C7', color: '#B45309', icon: '' };
                      return (
                        <>
                          <span
                            onClick={() => setShowStatusDropdown(prev => !prev)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 14px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 800, border: `1.5px solid ${cfg.color}`, cursor: 'pointer', userSelect: 'none' }}
                          >
                            {cfg.icon} {cfg.label} <span style={{ fontSize: 10 }}>▼</span>
                          </span>
                          {showStatusDropdown && (
                            <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: '#fff', border: '1px solid #E8EDF2', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: 150, overflow: 'hidden' }}>
                              {[
                                { label: 'Pending', color: '#B45309', bg: '#FEF3C7', icon: '' },
                                { label: 'Paid', color: '#15803D', bg: '#DCFCE7', icon: '' },
                                { label: 'Overdue', color: '#DC2626', bg: '#FEE2E2', icon: '' },
                                { label: 'Sent', color: '#1D4ED8', bg: '#DBEAFE', icon: '' },
                              ].map(opt => (
                                <div key={opt.label}
                                  onClick={async () => {
                                    const updatedInvoices = (currProject.invoices || []).map(x =>
                                      x.invoiceNo === inv.invoiceNo ? { ...x, status: opt.label } : x
                                    );
                                    await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, { invoices: updatedInvoices });
                                    setShowStatusDropdown(false);
                                    setPreviewInvoice(prev => ({ ...prev, status: opt.label }));
                                    loadLatest();
                                  }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', cursor: 'pointer', background: st === opt.label.toLowerCase() ? opt.bg : '#fff', borderBottom: '1px solid #F3F4F6' }}
                                  onMouseEnter={e => e.currentTarget.style.background = opt.bg}
                                  onMouseLeave={e => e.currentTarget.style.background = st === opt.label.toLowerCase() ? opt.bg : '#fff'}
                                >
                                  <span>{opt.icon}</span>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: opt.color }}>{opt.label}</span>
                                  {st === opt.label.toLowerCase() && <span style={{ marginLeft: 'auto', fontSize: 11 }}>Yes</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Urban Cafe Billing Software</div>
                </div>

              </div>
            </div>
          );
        })()
      }


      {/* Upload File Modal */}
      {
        showUploadModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#fff', borderRadius: P.radius, width: '100%', maxWidth: 480, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ background: `linear-gradient(135deg,${P.primary},${P.primaryDark})`, padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="ti ti-upload" style={{ color: '#fff', fontSize: 18 }}></i>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>Upload File</span>
                </div>
                <button onClick={() => { setShowUploadModal(false); setUploadFileObj(null); setUploadHeading(''); setUploadDescription(''); setUploadSendToClient(false); setUploadSendToEmployee(false); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>Close</button>
              </div>

              {/* Body */}
              <div style={{ padding: '22px 24px', maxHeight: '80vh', overflowY: 'auto' }}>

                {/* Drop Zone */}
                <div onClick={() => document.getElementById('modal-file-input').click()}
                  style={{ border: `2px dashed ${uploadFileObj ? P.primary : P.border}`, borderRadius: 10, padding: '22px 16px', textAlign: 'center', cursor: 'pointer', marginBottom: 16, background: uploadFileObj ? P.primaryLight : P.bg, transition: 'all .2s' }}>
                  <i className={`ti ${uploadFileObj ? 'ti-file-check' : 'ti-cloud-upload'}`} style={{ fontSize: 28, color: uploadFileObj ? P.green : P.textLight, display: 'block', marginBottom: 6 }}></i>
                  {uploadFileObj ? (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: P.textDark }}>{uploadFileObj.name}</div>
                      <div style={{ fontSize: 11, color: P.textLight, marginTop: 3 }}>{(uploadFileObj.size / 1024).toFixed(1)} KB · Click to change</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: P.textDark }}>Click to browse or drag & drop</div>
                      <div style={{ fontSize: 11, color: P.textLight, marginTop: 3 }}>Images, PDFs, Docs supported</div>
                    </div>
                  )}
                </div>
                <input id="modal-file-input" type="file" onChange={handleModalFileSelect} style={{ display: 'none' }} />

                {/* Heading */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: P.textLight, textTransform: 'uppercase', letterSpacing: '.7px', display: 'block', marginBottom: 5 }}>File Heading</label>
                  <input type="text" value={uploadHeading} onChange={e => setUploadHeading(e.target.value)} placeholder="e.g. Design Mockup v2"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${P.border}`, fontSize: 13, fontFamily: 'Nunito,sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                {/* Description */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: P.textLight, textTransform: 'uppercase', letterSpacing: '.7px', display: 'block', marginBottom: 5 }}>Description</label>
                  <textarea value={uploadDescription} onChange={e => setUploadDescription(e.target.value)} placeholder="Brief description of this file..." rows={2}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${P.border}`, fontSize: 13, fontFamily: 'Nunito,sans-serif', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>

                {/* Share With label */}
                <div style={{ fontSize: 11, fontWeight: 800, color: P.textLight, textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 10 }}>Share With</div>

                {/* Client Portal Toggle */}
                <div style={{ border: `1.5px solid ${uploadSendToClient ? P.primary : P.border}`, borderRadius: 10, padding: '12px 14px', marginBottom: 10, background: uploadSendToClient ? P.primaryLight : '#fff', transition: 'all .15s' }}>
                  <div onClick={() => { const newVal = !uploadSendToClient; setUploadSendToClient(newVal); setUploadClientName(newVal ? (currProject.client || clientName || '') : ''); }} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${uploadSendToClient ? P.primary : P.border}`, background: uploadSendToClient ? P.primary : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {uploadSendToClient && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>Yes</span>}
                    </div>
                    <i className="ti ti-building" style={{ color: P.primary, fontSize: 16 }}></i>
                    <span style={{ fontSize: 13, fontWeight: 700, color: P.textDark }}>Send to Client Portal</span>
                  </div>
                  {uploadSendToClient && (
                    <select value={uploadClientName} onChange={e => setUploadClientName(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${P.primary}`, fontSize: 13, fontFamily: 'Nunito,sans-serif', outline: 'none', background: '#fff', color: P.textDark, marginTop: 10 }}>
                      <option value="">-- Select Client --</option>
                      {currProject.client && <option value={currProject.client}>{currProject.client}</option>}
                      {(clients || []).filter(c => (c.clientName || c.name) !== currProject.client).map(c => (
                        <option key={c._id || c.clientName} value={c.clientName || c.name}>{c.clientName || c.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Employee Portal Toggle */}
                <div style={{ border: `1.5px solid ${uploadSendToEmployee ? P.purple : P.border}`, borderRadius: 10, padding: '12px 14px', marginBottom: 20, background: uploadSendToEmployee ? P.purpleLight : '#fff', transition: 'all .15s' }}>
                  <div onClick={() => { setUploadSendToEmployee(!uploadSendToEmployee); setUploadEmployeeName(''); }} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${uploadSendToEmployee ? P.purple : P.border}`, background: uploadSendToEmployee ? P.purple : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {uploadSendToEmployee && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>Yes</span>}
                    </div>
                    <i className="ti ti-users" style={{ color: P.purple, fontSize: 16 }}></i>
                    <span style={{ fontSize: 13, fontWeight: 700, color: P.textDark }}>Send to Employee Portal</span>
                  </div>
                  {uploadSendToEmployee && (
                    <select value={uploadEmployeeName} onChange={e => setUploadEmployeeName(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${P.purple}`, fontSize: 13, fontFamily: 'Nunito,sans-serif', outline: 'none', background: '#fff', color: P.textDark, marginTop: 10 }}>
                      <option value="">-- Select Employee --</option>
                      {(employees || []).map(emp => (
                        <option key={emp._id} value={emp.name || emp.employeeName}>{emp.name || emp.employeeName}{emp.role ? ` (${emp.role})` : ''}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { setShowUploadModal(false); setUploadFileObj(null); setUploadHeading(''); setUploadDescription(''); setUploadSendToClient(false); setUploadSendToEmployee(false); }}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1.5px solid ${P.border}`, background: 'transparent', color: P.textMid, fontFamily: 'Nunito,sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handleModalUpload} disabled={!uploadFileObj || uploadingModal}
                    style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: (!uploadFileObj || uploadingModal) ? P.border : P.primary, color: (!uploadFileObj || uploadingModal) ? P.textLight : '#fff', fontFamily: 'Nunito,sans-serif', fontSize: 13, fontWeight: 800, cursor: (!uploadFileObj || uploadingModal) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .15s' }}>
                    <i className="ti ti-upload" style={{ fontSize: 15 }}></i>
                    {uploadingModal ? 'Uploading...' : 'Upload & Share'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}