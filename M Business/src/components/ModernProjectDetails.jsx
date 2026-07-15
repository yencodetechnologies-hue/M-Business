import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';
import ModernEmployeeProjectDetails from './ModernEmployeeProjectDetails';
import ProjectPaymentModals from './ProjectPaymentModals';

const MILESTONE_OPTIONS = [
  "Custom",
  "Project Kickoff",
  "Requirement Gathering",
  "Scope Approval",
  "Design Approval",
  "UI/UX Completion",
  "Prototype Approval",
  "Development Started",
  "Development Completed",
  "Internal Testing",
  "QA Testing",
  "UAT (User Acceptance Testing)",
  "Bug Fixes Completed",
  "Client Review",
  "Client Approval",
  "Security Testing",
  "Performance Testing",
  "Documentation Completed",
  "Training Completed",
  "Deployment to Staging",
  "Deployment to Production",
  "Go-Live",
  "Project Handover",
  "Warranty Support Started",
  "Warranty Support Completed",
  "Project Closure"
];

// ── Shared Colors ──
const P = {
  primary: ' var(--app-accent, var(--app-accent, #00BCD4))', primaryDark: '#0097A7', primaryLight: 'var(--teal-light, var(--teal-light, #E0F7FA))', primaryMid: '#B2EBF2',
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
.mpd-breadcrumb a { color:${P.primary}; cursor:pointer; text-decoration:none; transition:color .15s; }
.mpd-breadcrumb a:hover { color:${P.primaryDark}; text-decoration:underline; }
.mpd-topbar-actions { display:flex; align-items:center; gap:10px; flex-wrap: wrap; }

@media (max-width: 768px) {
  .mpd-root { overflow-x: hidden; }
  .mpd-topbar { flex-wrap: wrap; gap: 12px; }
  .mpd-topbar-actions { width: 100%; }
  .mpd-topbar-actions button { flex: 1 1 auto; min-width: 0; font-size: 12px; padding: 8px 10px; }
  .mpd-proj-header { flex-direction: column; }
  .mpd-ph-right { width: 100%; align-items: flex-start; }
  .mpd-prog-divider { display: none; }
  .mpd-card-header { flex-wrap: wrap; gap: 10px; }
}

/* BUTTONS */
.mpd-btn { display:inline-flex; align-items:center; gap:7px; padding:9px 18px; border-radius:10px; font-family:'Nunito',sans-serif; font-size:13px; font-weight:700; cursor:pointer; border:none; transition:all .2s cubic-bezier(.4,0,.2,1); position:relative; overflow:hidden; }
.mpd-btn::after { content:''; position:absolute; inset:0; opacity:0; background:rgba(255,255,255,.15); transition:opacity .2s; }
.mpd-btn:hover::after { opacity:1; }
.mpd-btn-primary { background:linear-gradient(135deg,${P.primary},${P.primaryDark}); color:#fff; box-shadow:0 4px 14px rgba(0,188,212,.35); }
.mpd-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(0,188,212,.45); }
.mpd-btn-outline { background:#fff; border:1.5px solid ${P.border}; color:${P.textMid}; box-shadow:0 1px 4px rgba(0,0,0,.06); }
.mpd-btn-outline:hover { border-color:${P.primary}; color:${P.primary}; background:${P.primaryLight}; transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,188,212,.15); }
.mpd-btn-danger { background:${P.redLight}; color:${P.red}; border:1.5px solid #FCA5A5; }
.mpd-btn-danger:hover { background:${P.red}; color:#fff; transform:translateY(-1px); }
.mpd-btn:focus, .mpd-btn:active { outline: none; box-shadow: none; transform:none; }
.mpd-btn-primary:focus, .mpd-btn-primary:active { background:${P.primaryDark}; box-shadow:none; }

/* CARDS */
.mpd-card { background:#fff; border-radius:16px; box-shadow:0 2px 16px rgba(0,0,0,.07), 0 0 0 1px rgba(0,0,0,.04); padding:22px 24px; margin-bottom:20px; transition:box-shadow .2s; }
.mpd-card:hover { box-shadow:0 6px 24px rgba(0,0,0,.1), 0 0 0 1px rgba(0,188,212,.08); }
.mpd-milestones-card { padding:28px 30px; min-height:340px; }
.mpd-card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
.mpd-card-title { font-size:15px; font-weight:800; color:${P.textDark}; display:flex; align-items:center; gap:8px; }
.mpd-card-title i { color:${P.primary}; font-size:18px; }

/* HEADER SECTION */
.mpd-proj-header { background:#fff; border-radius:18px; padding:24px 28px; box-shadow:0 4px 24px rgba(0,188,212,.1), 0 0 0 1px rgba(0,188,212,.08); margin-bottom:20px; display:flex; align-items:flex-start; justify-content:space-between; gap:20px; position:relative; overflow:hidden; }
.mpd-proj-header::before { content:''; position:absolute; top:-40px; right:-40px; width:180px; height:180px; background:radial-gradient(circle,rgba(0,188,212,.08) 0%,transparent 70%); pointer-events:none; }
.mpd-ph-left .mpd-proj-name { font-size:24px; font-weight:900; color:${P.textDark}; margin-bottom:8px; letter-spacing:-.3px; }
.mpd-ph-left .mpd-proj-desc { font-size:13px; color:${P.textMid}; line-height:1.7; max-width:560px; margin-bottom:14px; }
.mpd-ph-meta { display:flex; gap:20px; flex-wrap:wrap; }
.mpd-pm-item { display:flex; align-items:center; gap:6px; font-size:12px; color:${P.textMid}; background:${P.bg}; padding:5px 10px; border-radius:8px; }
.mpd-pm-item i { color:${P.primary}; font-size:14px; }
.mpd-pm-item strong { color:${P.textDark}; font-weight:700; }
.mpd-ph-right { display:flex; flex-direction:column; align-items:flex-end; gap:12px; }
.mpd-budget-box { text-align:right; background:linear-gradient(135deg,${P.primaryLight},#fff); border:1.5px solid rgba(0,188,212,.15); border-radius:14px; padding:12px 18px; }
.mpd-budget-box .mpd-lbl { font-size:10px; color:${P.primary}; font-weight:800; text-transform:uppercase; letter-spacing:.7px; }
.mpd-budget-box .mpd-amt { font-size:26px; font-weight:900; color:${P.textDark}; letter-spacing:-.5px; }
.mpd-budget-box .mpd-sub { font-size:12px; color:${P.textLight}; }
.mpd-budget-box .mpd-sub .mpd-g { color:${P.green}; font-weight:700; }

/* BADGES */
.mpd-status-badge { display:inline-flex; align-items:center; gap:5px; padding:5px 13px; border-radius:20px; font-size:11px; font-weight:800; letter-spacing:.3px; }
.mpd-status-badge::before { content:''; width:6px; height:6px; border-radius:50%; background:currentColor; animation:pulse-dot 2s ease-in-out infinite; }
@keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
.mpd-badge-active { background:linear-gradient(135deg,${P.greenLight},#f0fdf4); color:#065F46; border:1px solid #86efac; }
.mpd-badge-hold { background:${P.orangeLight}; color:#92400E; border:1px solid #FCD34D; }
.mpd-badge-completed { background:linear-gradient(135deg,#DBEAFE,#eff6ff); color:#1E40AF; border:1px solid #93C5FD; }
.mpd-badge-overdue { background:${P.redLight}; color:#991B1B; border:1px solid #FCA5A5; }

.mpd-prio { padding:4px 11px; border-radius:20px; font-size:11px; font-weight:800; display:inline-flex; align-items:center; border:1px solid transparent; }
.mpd-prio-high { background:${P.redLight}; color:#DC2626; border-color:#FCA5A5; }
.mpd-prio-medium { background:${P.orangeLight}; color:#D97706; border-color:#FCD34D; }
.mpd-prio-low { background:${P.greenLight}; color:#059669; border-color:#6EE7B7; }

/* KPIs */
.mpd-kpi-row { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
.mpd-kpi { background:#fff; border-radius:16px; padding:18px; box-shadow:0 2px 12px rgba(0,0,0,.07); display:flex; align-items:center; gap:12px; border:1px solid rgba(0,0,0,.05); transition:all .2s cubic-bezier(.4,0,.2,1); }
.mpd-kpi:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,.12); border-color:rgba(0,188,212,.15); }
.mpd-kpi-icon { width:44px; height:44px; border-radius:13px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.mpd-kpi-icon i { font-size:21px; }
.mpd-kpi-val { font-size:24px; font-weight:900; color:${P.textDark}; line-height:1; letter-spacing:-.5px; }
.mpd-kpi-lbl { font-size:10px; color:${P.textLight}; font-weight:700; margin-top:3px; text-transform:uppercase; letter-spacing:.5px; }
.mpd-kpi-trend { font-size:11px; font-weight:700; margin-top:3px; }
.mpd-kpi-trend.mpd-up { color:${P.green}; }
.mpd-kpi-trend.mpd-down { color:${P.red}; }

/* PROGRESS — 4 separate equal-width summary cards */
.mpd-prog-card { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-top:20px; margin-bottom:20px; }
.mpd-prog-item { background:#fff; border-radius:16px; padding:18px 20px; box-shadow:0 2px 12px rgba(0,0,0,.07); border:1px solid rgba(0,0,0,.05); min-width:0; }
.mpd-prog-item .mpd-progress-bg { width:100%; }
@media (max-width: 900px) { .mpd-prog-card { grid-template-columns:repeat(2,1fr); } }
@media (max-width: 480px) { .mpd-prog-card { grid-template-columns:1fr; } }
.mpd-prog-num { font-size:22px; font-weight:900; color:${P.textDark}; letter-spacing:-.3px; }
.mpd-prog-lbl { font-size:11px; color:${P.textLight}; font-weight:700; text-transform:uppercase; letter-spacing:.6px; margin-bottom:8px; }
.mpd-progress-bg { background:${P.bg}; border-radius:20px; height:8px; overflow:hidden; }
.mpd-progress-fill { height:100%; border-radius:20px; background:linear-gradient(90deg,${P.primary},${P.primaryDark}); transition:width .6s cubic-bezier(.4,0,.2,1); box-shadow:0 0 8px rgba(0,188,212,.4); }
.mpd-progress-fill.mpd-green { background:linear-gradient(90deg,${P.green},#059669); box-shadow:0 0 8px rgba(38,194,129,.4); }
.mpd-progress-fill.mpd-orange { background:linear-gradient(90deg,${P.orange},#D97706); box-shadow:0 0 8px rgba(245,158,11,.4); }
.mpd-progress-fill.mpd-purple { background:linear-gradient(90deg,${P.purple},#7C3AED); box-shadow:0 0 8px rgba(139,92,246,.4); }
.mpd-progress-fill.mpd-red { background:linear-gradient(90deg,${P.red},#DC2626); box-shadow:0 0 8px rgba(255,107,107,.4); }
.mpd-prog-sub { font-size:11px; color:${P.textLight}; margin-top:5px; }
.mpd-prog-divider { width:1px; background:${P.border}; }

/* UPDATE COMPOSER */
.mpd-upd-composer { background:#fff; border-radius:16px; box-shadow:0 2px 12px rgba(0,0,0,.07); overflow:hidden; margin-bottom:20px; transition:all .3s ease; border:1px solid rgba(0,0,0,.05); }
.mpd-uc-header { background:linear-gradient(135deg,${P.primary},${P.primaryDark}); padding:16px 22px; display:flex; align-items:center; justify-content:space-between; }
.mpd-uc-header h3 { font-size:15px; font-weight:800; color:#fff; display:flex; align-items:center; gap:8px; margin:0; }
.mpd-uc-toggle { background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.3); color:#fff; padding:5px 12px; border-radius:8px; font-family:'Nunito',sans-serif; font-size:12px; font-weight:700; cursor:pointer; transition:background .15s; }
.mpd-uc-toggle:hover { background:rgba(255,255,255,.3); }
.mpd-uc-body { padding:18px 22px; display:none; }
.mpd-uc-body.mpd-open { display:block; animation:fadeIn .2s ease; }

/* GRID LAYOUT */
.mpd-grid-main-side { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:22px; align-items:stretch; }
.mpd-grid-main-side > * { min-width:0; }
@media (max-width: 900px) { .mpd-grid-main-side { grid-template-columns:1fr; } }

/* TASKS LIST */
.mpd-task-filters { display:flex; gap:6px; margin-bottom:14px; flex-wrap:wrap; }
.mpd-tf { padding:5px 14px; border-radius:20px; font-size:12px; font-weight:700; border:1.5px solid ${P.border}; background:transparent; color:${P.textMid}; cursor:pointer; font-family:'Nunito',sans-serif; transition:all .2s; }
.mpd-tf.mpd-on, .mpd-tf:hover { background:linear-gradient(135deg,${P.primary},${P.primaryDark}); border-color:${P.primary}; color:#fff; box-shadow:0 3px 10px rgba(0,188,212,.3); }
.mpd-task-row { display:flex; align-items:center; gap:10px; padding:11px 0; border-bottom:1px solid ${P.bg}; cursor:pointer; transition:all .15s; border-radius:8px; }
.mpd-task-row:last-child { border-bottom:none; }
.mpd-task-row:hover { background:linear-gradient(90deg,${P.primaryLight},transparent); margin:0 -6px; padding:11px 6px; }
.mpd-task-chk { width:20px; height:20px; border-radius:6px; border:2px solid ${P.border}; flex-shrink:0; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .15s; }
.mpd-task-chk:hover { border-color:${P.primary}; }
.mpd-task-chk.mpd-done { background:linear-gradient(135deg,${P.green},#059669); border-color:${P.green}; box-shadow:0 2px 8px rgba(38,194,129,.3); }
.mpd-task-chk.mpd-done::after { content:''; width:9px; height:6px; border-left:2px solid #fff; border-bottom:2px solid #fff; transform:rotate(-45deg) translate(1px,-1px); display:block; }
.mpd-task-prio { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.mpd-task-prio.mpd-h { background:${P.red}; box-shadow:0 0 4px rgba(255,107,107,.5); }
.mpd-task-prio.mpd-m { background:${P.orange}; box-shadow:0 0 4px rgba(245,158,11,.5); }
.mpd-task-prio.mpd-l { background:${P.green}; box-shadow:0 0 4px rgba(38,194,129,.5); }
.mpd-task-name { flex:1; font-size:13px; font-weight:700; color:${P.textDark}; }
.mpd-task-assign { font-size:11px; color:${P.textLight}; font-weight:600; }
.mpd-task-due { font-size:11px; font-weight:700; color:${P.textLight}; }
.mpd-task-due.mpd-late { color:${P.red}; }

/* TABS */
.mpd-tabs { display:flex; flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; border-bottom:2px solid ${P.border}; margin-bottom:20px; }
.mpd-tab-btn { flex-shrink:0; white-space:nowrap; padding:10px 18px; font-size:13px; font-weight:700; color:${P.textMid}; cursor:pointer; border-bottom:3px solid transparent; margin-bottom:-2px; transition:all .2s; background:transparent; border-top:none; border-left:none; border-right:none; font-family:'Nunito',sans-serif; }
.mpd-tab-btn:hover { color:${P.primary}; background:${P.primaryLight}; border-radius:8px 8px 0 0; }
.mpd-tab-btn.mpd-active { color:${P.primary}; border-bottom-color:${P.primary}; }
.mpd-tab-pane { display:none; overflow:visible; }
.mpd-tab-pane.mpd-active { display:block; animation:fadeUp .18s ease; overflow:visible; }

@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}

/* TEAM SIDEBAR */
.mpd-member-row { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid ${P.bg}; transition:background .15s; border-radius:8px; }
.mpd-member-row:last-child { border-bottom:none; }
.mpd-member-row:hover { background:${P.bg}; padding-left:6px; padding-right:6px; }
.mpd-av { border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; color:#fff; flex-shrink:0; box-shadow:0 2px 6px rgba(0,0,0,.15); }
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
  const colors = [' var(--app-accent, var(--app-accent, #00BCD4))', '#8B5CF6', '#F59E0B', '#26C281', '#EC4899', '#3B82F6'];
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

export default function ModernProjectDetails({ project, onBack, tasks = [], employees = [], user, clients = [], onEdit, onDelete, onLogTime, onUpdate, fetchProjects, fetchTasks, onMessageTeam, hideTopActions, onNext, onNewInvoice, onViewInvoice, onNewProposal, onNewQuotation, autoOpenInvoice, onAutoOpenInvoiceDone, fromClientContext = false, onAddEmployeeClick }) {
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
  const [composerOpen, setComposerOpen] = useState(true);
  const [showSendConfirmModal, setShowSendConfirmModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalForm, setApprovalForm] = useState({ recipientType: 'client', teamMemberId: '', clientId: '', title: '', desc: '', icon: 'ti-file-text', approveLabel: 'Approve', rejectLabel: 'Review' });
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const [projectApprovals, setProjectApprovals] = useState([]);
  const [viewProjectApproval, setViewProjectApproval] = useState(null);
  const [previewProjectFile, setPreviewProjectFile] = useState(null);
  const [portalLinkUrl, setPortalLinkUrl] = useState('');
  const [loadingPortalLink, setLoadingPortalLink] = useState(false);
  const lastPortalProjectId = useRef(null);
  const [uploadSendForApproval, setUploadSendForApproval] = useState(false);
  const [sendingFileApproval, setSendingFileApproval] = useState(false);
  const [postUpdateOnUpload, setPostUpdateOnUpload] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]); // array of File objects (multi-select support)
  const [postUpdateAttachments, setPostUpdateAttachments] = useState([]); // [{ name, url, type }] for the Post Project Update panel
  const [postUpdateAttaching, setPostUpdateAttaching] = useState(false);
  const postUpdateFileInputRef = useRef(null);
  const [uploadFileError, setUploadFileError] = useState(''); // required-field validation message
  const [uploadShareError, setUploadShareError] = useState(''); // "share with" required validation message
  const uploadFileObj = uploadFiles[0] || null; // kept for single-file flows (e.g. Send for Approval)
  const [uploadHeading, setUploadHeading] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadSendToClient, setUploadSendToClient] = useState(false);
  const [uploadSendToEmployee, setUploadSendToEmployee] = useState(false);
  const [uploadClientName, setUploadClientName] = useState('');
  const [uploadEmployeeName, setUploadEmployeeName] = useState([]);
  const [showUploadEmpDropdown, setShowUploadEmpDropdown] = useState(true);
  const [uploadingModal, setUploadingModal] = useState(false);
  const [taskFilter, setTaskFilter] = useState('all');

  // Live state synchronized with backend
  const [currProject, setCurrProject] = useState(project);

  useEffect(() => {
    const preloadPortalLink = async () => {
      const clientId = currProject?.clientId;
      if (!clientId) return;
      // Already have a link for this exact project — nothing to fetch.
      if (portalLinkUrl && lastPortalProjectId.current === currProject?._id) return;
      try {
        const res = await axios.get(`${BASE_URL}/api/clients/${clientId}`);
        const c = res.data;
        if (c?.portalToken && String(c?.portalTokenProjectId || "") === String(currProject?._id || "")) {
          setPortalLinkUrl(`${window.location.origin}/client-portal/${clientId}?token=${c.portalToken}`);
          lastPortalProjectId.current = currProject._id;
          return;
        }
      } catch (e) { /* fall through to normal generation */ }
      // Only show "Generating link..." if a link genuinely doesn't exist yet.
      generatePortalLink();
    };
    if (currProject?._id) {
      preloadPortalLink();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currProject?._id, currProject?.clientId]);

  useEffect(() => {
    if (project && (project.name || project.client)) {
      setCurrProject(project);
    }
  }, [project?._id, project?.name, project?.client]);

  // Whenever a different project is opened (or this project is reopened),
  // fetch the current server data so edits made in a previous session —
  // like a saved custom milestone — are reflected immediately instead of
  // showing whatever stale copy the parent list still has in memory.
  useEffect(() => {
    if (project?._id) {
      loadLatest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?._id]);
  const [currTasks, setCurrTasks] = useState(tasks);
  const [loadingProject, setLoadingProject] = useState(false);

  const tabsRef = useRef(null);
  const tabContentRef = useRef(null);
  const [tabOrder, setTabOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('project_tabs_order');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return ['updates', 'activity', 'accounts'];
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
  const [newTaskStatus, setNewTaskStatus] = useState('Not Started');
  const [addingTask, setAddingTask] = useState(false);

  const [updateText, setUpdateText] = useState('');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateType, setUpdateType] = useState('');
  const [isApprovalRequest, setIsApprovalRequest] = useState(false);
  const [customUpdateTypes, setCustomUpdateTypes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mb_customUpdateTypes') || '[]'); } catch (e) { return []; }
  });
  const [isCustomUpdateTypeMode, setIsCustomUpdateTypeMode] = useState(false);
  const [customUpdateTypeInput, setCustomUpdateTypeInput] = useState('');
  const [sendToTeam, setSendToTeam] = useState(true);
  const [sendToClient, setSendToClient] = useState(true);
  const [updateSelectedMembers, setUpdateSelectedMembers] = useState([]);
  const [showUpdateMembersDropdown, setShowUpdateMembersDropdown] = useState(false);
  const updateMembersDropdownRef = useRef(null);

  useEffect(() => {
    if (!showUpdateMembersDropdown) return;
    const handleClickOutside = (e) => {
      if (updateMembersDropdownRef.current && !updateMembersDropdownRef.current.contains(e.target)) {
        setShowUpdateMembersDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUpdateMembersDropdown]);
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedNewMember, setSelectedNewMember] = useState('');
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [isCustomMilestoneMode, setIsCustomMilestoneMode] = useState(false);
  const [editingMilestoneIdx, setEditingMilestoneIdx] = useState(null);
  const [editMilestoneName, setEditMilestoneName] = useState('');
  const [editMilestoneDate, setEditMilestoneDate] = useState('');
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
  const [expandedSections, setExpandedSections] = useState({
    inv: false, adv: false, add: false, mile: false, pay: false, exp: false,
  });
  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };
  const handleDeleteRecord = async (arrayName, index) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const currentList = currProject[arrayName] || [];
      const updatedList = currentList.filter((_, i) => i !== index);
      const updatePayload = { [arrayName]: updatedList };
      if (arrayName === 'expenses') {
        updatePayload.spent = updatedList.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
      }
      // Update local state immediately so the row disappears right away,
      // instead of waiting for loadLatest()'s server round-trip.
      setCurrProject(prev => ({ ...prev, ...updatePayload }));
      await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, updatePayload);
      loadLatest();
    } catch (err) {
      alert('Failed to delete record.');
    }
  };

  // 👇 ADD THE NEW FUNCTION HERE 👇
  const handleDeleteInvoice = async (inv) => {
    if (!confirm('Delete this invoice?')) return;
    if (!inv._globalId) { alert('This invoice cannot be found on the server.'); return; }
    try {
      await axios.delete(`${BASE_URL}/api/invoices/${inv._globalId}`);
      setProjectInvoices(prev => prev.filter(g => g.id !== inv._globalId));
      fetchProjectInvoices();
      loadLatest();
    } catch (err) {
      alert('Failed to delete invoice.');
    }
  };
  // 👆 END OF NEW FUNCTION 👆

  // ── Share a single invoice directly with its client's portal ──────────
  const [sharingInvoiceNo, setSharingInvoiceNo] = useState(null);
  const handleShareToClient = async (inv) => {
    const invNo = inv.invoiceNo;
    if (!invNo) { alert('This invoice has no invoice number and cannot be shared.'); return; }
    setSharingInvoiceNo(invNo);
    try {
      if (inv._source === 'global' && inv._globalId) {
        // Already a full invoice document — just flip its status to "sent"
        // so it becomes visible to the client (and keeps its existing clientId).
        await axios.patch(`${BASE_URL}/api/invoices/${inv._globalId}/status`, { status: 'sent' });
      } else {
        // Project-local invoice — push it into the global Invoice collection
        // (upserted by invoiceNo) with the resolved clientId so it shows up
        // in Client Portal → Invoices.
        const payload = {
          inv: {
            invoiceNo: invNo,
            client: currProject.client || currProject.clientName || inv.clientName || '',
            project: currProject.name || '',
            date: inv.issueDate || inv.date || new Date().toISOString().split('T')[0],
            dueDate: inv.dueDate || '',
            notes: inv.notes || '',
            gstRate: inv.taxPercent ?? (inv.items?.[0]?.gstRate ?? 18),
            isGstIncluded: inv.taxType === 'inclusive',
            signature: inv.signature || '',
            signatureType: inv.signatureType || 'text',
            currency: currProject.currency || 'INR',
            clientId: resolvedClientId,
          },
          items: (inv.items && inv.items.length)
            ? inv.items
            : [{ description: inv.description || 'Invoice', quantity: 1, rate: inv.amount || 0, gstRate: inv.taxPercent || 0, isGstIncluded: inv.taxType === 'inclusive' }],
          status: 'sent',
        };
        await axios.post(`${BASE_URL}/api/invoices`, payload);
      }
      alert(`Invoice ${invNo} has been shared with the client.`);
      fetchProjectInvoices();
      loadLatest();
    } catch (err) {
      console.error('Share to client failed:', err);
      alert('Failed to share invoice with client.');
    } finally {
      setSharingInvoiceNo(null);
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
      const fetched = pRes.data;
      // Guard against a race with the backend: if the fetched project is
      // missing its name/client (write not fully committed yet), or if the
      // backend returned an array instead of a single project object
      // (can happen if a route mismatch on the server returns a list),
      // don't let it clobber the good data we already have.
      const isValidProjectObject =
        fetched &&
        typeof fetched === 'object' &&
        !Array.isArray(fetched) &&
        (fetched.name || fetched.client);

      if (isValidProjectObject) {
        setCurrProject(prev => ({
          ...fetched,
          // Preserve existing updates if the fresh fetch somehow lacks them
          updates: Array.isArray(fetched.updates) && fetched.updates.length > 0
            ? fetched.updates
            : (prev?.updates || fetched.updates || [])
        }));
      } else {
        console.error('loadLatest: received invalid project payload from GET /api/projects/:id', fetched);
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

  // Inject component CSS — always update so hot reload picks up style changes
  useEffect(() => {
    const id = 'mpd-style';
    let tag = document.getElementById(id);
    if (!tag) {
      tag = document.createElement('style');
      tag.id = id;
      document.head.appendChild(tag);
    }
    tag.textContent = CSS;
  }, []);

  // Load fresh data once on mount and when project _id changes.
  //
  // IMPORTANT: currProject is synced to the incoming `project` prop THE
  // INSTANT it changes — before the network refetch below even starts.
  // Without this line, if this component stays mounted while switching from
  // one project to another, currProject kept showing the PREVIOUS project's
  // data (including its client name) for a brief moment while loadLatest()
  // was still loading. That stale window was the actual cause of "Open
  // Portal" opening the wrong client right after switching projects.
  const mountedId = useRef(null);
  useEffect(() => {
    if (project?._id && project._id !== mountedId.current) {
      mountedId.current = project._id;
      setCurrProject(project);   // sync immediately, no waiting
      setPortalLinkUrl('');      // discard any portal link cached for the old project
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
  const fetchProjectInvoices = useCallback(() => {
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

  useEffect(() => {
    fetchProjectInvoices();
  }, [fetchProjectInvoices]);

  // Merge the simple project.invoices array with the rich global Invoices
  // (created via the full InvoiceCreator form) so both show up in this list.
  const mergedInvoices = React.useMemo(() => {
    // Only the real backend invoices (same collection Sidebar → Invoices uses).
    // Legacy project-local records are no longer created; any pre-existing
    // ones are dropped from view so behavior matches Sidebar exactly.
    return (projectInvoices || []).map(g => ({
      invoiceNo: g.invoiceNo,
      description: (g.inv && g.inv.notes) || currProject?.name || 'Invoice',
      amount: g.total || 0,
      taxType: g.inv?.isGstIncluded ? 'inclusive' : 'exclusive',
      taxPercent: g.inv?.gstRate ?? 0,
      issueDate: g.date || g.inv?.date || '',
      dueDate: g.inv?.dueDate || g.dueDate || '',
      status: g.status,
      _source: 'global',
      _globalId: g.id,
      category: g.inv?.category || 'General',
      projectName: g.inv?.project || g.project,
      clientName: g.inv?.clientName || g.inv?.client || g.client,
      inv: g.inv,
      items: g.items,
    }));
  }, [projectInvoices, currProject?.name]);

  if (!currProject) return null;
  // Derived Project Data
  const projName = currProject.name || "Unnamed Project";
  const clientName = currProject.client || currProject.clientName || "Unknown Client";

  const resolvedClientId = currProject.clientId
    || clients?.find(c => {
      const cName = (c.clientName || c.name || "").toLowerCase().trim();
      const cUser = (c.username || c.email || "").toLowerCase().trim();
      const target = clientName.toLowerCase().trim();
      return cName === target || cUser === target;
    })?._id
    || "";

  useEffect(() => {
    if (!approvalForm.clientId && resolvedClientId) {
      setApprovalForm(f => ({ ...f, clientId: resolvedClientId }));
    }
  }, [resolvedClientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProjectApprovals = async () => {
    try {
      const approvalCompanyId = user?.companyId || user?.company || user?._id || user?.id || currProject.companyId || '';
      const res = await axios.get(`${BASE_URL}/api/approvals/project/${currProject._id}`, {
        headers: { 'x-company-id': approvalCompanyId }
      });
      setProjectApprovals(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load project approvals", err);
    }
  };
  useEffect(() => { if (currProject?._id) loadProjectApprovals(); }, [currProject?._id]);

  const handleDeleteApproval = async (approvalId) => {
    if (!confirm("Delete this approval request?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/approvals/${approvalId}`);
      setProjectApprovals(prev => prev.filter(a => a._id !== approvalId));
      if (viewProjectApproval?._id === approvalId) setViewProjectApproval(null);
    } catch (err) {
      console.error("Failed to delete approval", err);
      alert("Failed to delete approval. Please try again.");
    }
  };

  const submitApprovalRequest = async () => {
    const title = updateTitle.trim() || updateText.trim().slice(0, 60);
    if (!title) { alert("Please enter an update title for this approval request."); return; }
    const isTeam = approvalForm.recipientType === 'team';
    if (isTeam && !approvalForm.teamMemberId) { alert("Please select a team member to send this to."); return; }
    if (!isTeam && !approvalForm.clientId) { alert("Please select a client to send this to."); return; }
    const approvalCompanyId = user?.companyId || user?.company || user?._id || user?.id || currProject.companyId || '';
    setPostingUpdate(true);
    try {
      const primaryAttachment = (postUpdateAttachments || [])[0] || null;
      await axios.post(`${BASE_URL}/api/approvals`, {
        companyId: approvalCompanyId,
        clientId: isTeam ? '' : approvalForm.clientId,
        recipientType: approvalForm.recipientType,
        teamMemberId: isTeam ? approvalForm.teamMemberId : '',
        senderName: user?.name || user?.clientName || 'Admin',
        title,
        desc: updateText.trim(),
        icon: 'ti-file-text',
        approveLabel: 'Approve',
        rejectLabel: 'Review',
        sourceType: 'project',
        projectId: currProject._id || '',
        fileUrl: primaryAttachment ? primaryAttachment.url : '',
        fileName: primaryAttachment ? primaryAttachment.name : '',
      });
      alert(`Approval request sent to ${isTeam ? 'the team member' : 'the client'}!`);
      setUpdateText(''); setUpdateTitle(''); setUpdateType('progress');
      setApprovalForm(f => ({ ...f, teamMemberId: '' }));
      setPostUpdateAttachments([]);

      loadProjectApprovals();
    } catch (err) {
      console.error("Failed to create approval request", err);
      alert(err.response?.data?.msg || "Failed to send approval request. Please try again.");
    } finally {
      setPostingUpdate(false);
    }
  };

  const handleSendFileForApproval = async () => {
    if (!uploadFileObj) return;
    const isTeam = approvalForm.recipientType === 'team';
    if (isTeam && !approvalForm.teamMemberId) { alert("Please select a team member to send this to."); return; }
    if (!isTeam && !approvalForm.clientId) { alert("Please select a client to send this to."); return; }
    setSendingFileApproval(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFileObj);
      const uploadRes = await axios.post(`${BASE_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const rawUrl = uploadRes.data.url || '';
      const uploadedUrl = rawUrl.startsWith('http') ? rawUrl : `${BASE_URL}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
      const approvalCompanyId = user?.companyId || user?.company || user?._id || user?.id || currProject.companyId || '';
      await axios.post(`${BASE_URL}/api/approvals`, {
        companyId: approvalCompanyId,
        clientId: isTeam ? '' : approvalForm.clientId,
        recipientType: approvalForm.recipientType,
        teamMemberId: isTeam ? approvalForm.teamMemberId : '',
        senderName: user?.name || user?.clientName || 'Admin',
        title: uploadHeading.trim() || uploadFileObj.name,
        desc: uploadDescription.trim(),
        icon: 'ti-file-text',
        approveLabel: 'Approve',
        rejectLabel: 'Review',
        sourceType: 'project',
        projectId: currProject._id || '',
        fileUrl: uploadedUrl,
        fileName: uploadFileObj.name,
      });
      alert(`File sent for approval to ${isTeam ? 'the team member' : 'the client'}!`);
      setShowUploadModal(false);
      setUploadFiles([]);
      setUploadHeading('');
      setUploadDescription('');
      setUploadSendForApproval(false);
      setApprovalForm(f => ({ ...f, teamMemberId: '' }));
      loadProjectApprovals();
    } catch (err) {
      console.error("Failed to send file for approval", err);
      alert(err.response?.data?.msg || "Failed to send file for approval. Please try again.");
    } finally {
      setSendingFileApproval(false);
    }
  };

  const category = currProject.category || currProject.purpose || "General";
  const priority = currProject.priority || "medium";
  const status = (currProject.status || "Active").toLowerCase();

  const startD = currProject.start ? new Date(currProject.start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const endD = currProject.end || currProject.deadline ? new Date(currProject.end || currProject.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

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
  const doneMilestones = milestonesArr.filter(m => {
    const mTasks = currTasks.filter(t => t.milestone === m.name && !t.isDeleted);
    const allTasksCompleted = mTasks.length > 0 && mTasks.every(t => t.status === 'done' || t.status === 'completed');
    // Count as done if manually marked done (works even with no tasks), OR if all its tasks are completed
    return m.done === true || allTasksCompleted;
  }).length;
  const totalMilestones = milestonesArr.length;
  const progressPct = totalMilestones > 0
    ? Math.round((doneMilestones / totalMilestones) * 100)
    : 0;

  const parseAmt = (val) => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    const num = Number(String(val).replace(/[^0-9.-]+/g, ''));
    return isNaN(num) ? 0 : num;
  };

  // Auto-calculate Total Budget = ALL Invoices (via mergedInvoices, which already
  // reflects instant local deletes/edits) + Additional Charges + Milestone Payments
  const billedFromInvoices = mergedInvoices.filter(Boolean).reduce((sum, inv) => {
    const invAmount = parseAmt(inv.amount) || parseAmt(inv.total);
    const taxPercent = parseAmt(inv.taxPercent);
    const taxAmt = inv.taxType === 'inclusive' ? 0 : Math.round(invAmount * (taxPercent / 100));
    return sum + invAmount + taxAmt;
  }, 0);
  // Only fall back to manually entered billed value if the project has
  // never had any invoices at all (not just zero after deletion)
  const manualBilled = parseAmt(currProject.billed);
  const hasAnyInvoices = mergedInvoices.length > 0;
  const billed = hasAnyInvoices ? billedFromInvoices : manualBilled;
  window.debugBudget = { billedFromInvoices, manualBilled, billed, mergedInvoices, projectInvoices, currProjectInvoices: currProject.invoices };

  const autoAdditionalTotal = (currProject.additionalCharges || []).reduce((sum, a) => sum + parseAmt(a.amount), 0);
  const autoMilestoneTotal = (currProject.milestonePayments || []).reduce((sum, m) => sum + parseAmt(m.amount), 0);
  const autoAdvanceTotal = (currProject.advances || []).reduce((sum, a) => sum + parseAmt(a.amount), 0);
  const autoBudgetAmt = billed + autoAdditionalTotal + autoMilestoneTotal;
  const manualBudget = currProject.budget !== undefined && currProject.budget !== null && currProject.budget !== '' && Number(currProject.budget) > 0
    ? Number(currProject.budget)
    : 0;
  const budgetAmt = manualBudget > 0
    ? manualBudget
    : autoBudgetAmt;
  // Fall back to manually entered received value if no payments recorded
  const receivedFromPayments = (currProject.paymentsReceived || []).reduce((sum, p) => sum + parseAmt(p.amount), 0);
  const manualReceived = parseAmt(currProject.received);
  const received = receivedFromPayments > 0 ? receivedFromPayments : manualReceived;

  const pending = Math.max(0, billed - received);
  // Always calculate spent from expenses array (source of truth)
  const spent = (currProject.expenses || []).reduce((sum, exp) => sum + parseAmt(exp.amount), 0);
  const remaining = budgetAmt > 0 ? (budgetAmt - spent) : 0;
  const budgetUsedPct = budgetAmt > 0 ? Math.min(Math.round((spent / budgetAmt) * 100), 100) : 0;
  const budgetExceeded = budgetAmt > 0 && spent > budgetAmt;
  const overageAmt = budgetExceeded ? (spent - budgetAmt) : 0;

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
      const isCurrentlyDone = task.status === 'done' || task.status === 'completed' || task.checked === true;
      const newStatus = isCurrentlyDone ? 'in_progress' : 'completed';
      await axios.put(`${BASE_URL}/api/tasks/${task._id}`, { status: newStatus, checked: !isCurrentlyDone });

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

      // Recalculate progress from updated milestones so card stays in sync
      const doneMCount = updatedMilestones.filter(m => m.done === true).length;
      const totalMCount = updatedMilestones.length;
      const newProgressPct = totalMCount > 0
        ? Math.round((doneMCount / totalMCount) * 100)
        : 0;

      await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, {
        completedTasks: doneT,
        tasks: totalT,
        milestones: updatedMilestones,
        progress: newProgressPct,
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
        color: " var(--app-accent, var(--app-accent, #00BCD4))"
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
    if (!newTaskMilestone) {
      alert("Please select a milestone to link this task to.");
      return;
    }
    setAddingTask(true);
    try {
      const gId = await getOrCreateGroupId();
      if (!gId) {
        alert("Could not find or create a task group.");
        return;
      }
      // IMPORTANT: the backend (server.js middleware) only ever reads the
      // companyId from the "x-company-id" HTTP header — it ignores any
      // companyId sent in the request body. Sending it in the body (as
      // before) had no effect at all, which is why reassigned/edited tasks
      // never showed up correctly on the employee's Tasks list.
      const resolvedCompanyId = user?.companyId || user?.company || user?._id || user?.id || currProject.companyId || '';
      const companyHeaders = { headers: { 'x-company-id': resolvedCompanyId } };

      if (editingTask) {
        await axios.put(`${BASE_URL}/api/tasks/${editingTask._id}`, {
          title: newTaskTitle.trim(),
          description: newTaskDesc.trim(),
          priority: newTaskPriority,
          assignTo: Array.isArray(newTaskAssignTo) ? newTaskAssignTo.join(', ') : newTaskAssignTo,
          date: newTaskDue,
          milestone: newTaskMilestone,
          status: newTaskStatus
        }, companyHeaders);
      } else {
        const createRes = await axios.post(`${BASE_URL}/api/tasks`, {
          title: newTaskTitle.trim(),
          description: newTaskDesc.trim(),
          priority: newTaskPriority,
          assignTo: Array.isArray(newTaskAssignTo) ? newTaskAssignTo.join(', ') : newTaskAssignTo,
          date: newTaskDue,
          milestone: newTaskMilestone,
          groupId: gId,
          projectId: currProject._id,
          status: newTaskStatus
        }, companyHeaders);

        // Show the new task immediately instead of waiting on loadLatest()/fetchTasks()
        // to round-trip to the server.
        const created = createRes?.data?.task || createRes?.data;
        if (created && created._id) {
          setCurrTasks(prev => [...prev, created]);
        }
      }

      setShowAddTaskModal(false);
      setEditingTask(null);
      loadLatest();
      if (onUpdate) onUpdate();
      if (fetchTasks) fetchTasks();
    } catch (err) {
      console.error("Failed to save task:", err);
      alert("Failed to save task.");
    } finally {
      setAddingTask(false);
    }
  };

  const handlePostUpdate = async (e) => {
    e.preventDefault();
    if (!updateText.trim()) return;
    setPostingUpdate(true);
    try {
      const visibleTo = ['team'];

      const newUpdate = {
        text: updateText.trim(),
        date: new Date().toISOString(),
        author: 'Admin',
        type: updateType,
        visibleTo: visibleTo.length > 0 ? visibleTo : ['team']
      };

      const updatedUpdates = [newUpdate, ...(currProject.updates || [])];

      setCurrProject(prev => ({ ...prev, updates: updatedUpdates }));

      await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, {
        updates: updatedUpdates
      });

      setUpdateText('');
      setUpdateType('general');

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
      const currentExpenses = currProject.expenses || [];
      const newExpense = {
        expenseNo: `EXP-${String(currentExpenses.length + 1).padStart(3, '0')}`,
        category: 'General',
        description: 'Quick expense',
        amount: amt,
        date: new Date().toISOString().split('T')[0],
        paymentMode: 'Cash',
        status: 'Paid',
        createdAt: new Date(),
      };
      const updatedExpenses = [newExpense, ...currentExpenses];
      const newSpent = updatedExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
      await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, {
        expenses: updatedExpenses,
        spent: newSpent,
      });
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

      const totalM = updatedMilestones.length;
      const doneM = updatedMilestones.filter(m => m.done).length;
      const totalT = projTasks.length;
      const newProgress = totalM > 0
        ? Math.round((doneM / totalM) * 100)
        : (currProject.progress || 0);

      // Update local state immediately so the status color changes right away,
      // instead of waiting for the server round-trip.
      setCurrProject(prev => ({ ...prev, milestones: updatedMilestones, progress: newProgress }));

      await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, {
        milestones: updatedMilestones,
        progress: newProgress,
      });
      loadLatest();
      if (fetchTasks) fetchTasks();
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

      // Update local state immediately so the new milestone shows up right away,
      // instead of waiting for loadLatest()'s server round-trip.
      setCurrProject(prev => ({ ...prev, milestones: updatedMilestones }));

      setNewMilestoneName('');
      setNewMilestoneDate('');
      setIsCustomMilestoneMode(false);
      setShowAddMilestone(false);
      loadLatest();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Failed to add milestone:", err);
      alert("Failed to add milestone.");
    }
  };

  const handleEditMilestone = (idx) => {
    const m = (currProject.milestones || [])[idx];
    if (!m) return;
    setEditingMilestoneIdx(idx);
    setEditMilestoneName(m.name || '');
    setEditMilestoneDate(m.date || '');
  };

  const handleUpdateMilestone = async (e) => {
    e.preventDefault();
    if (!editMilestoneName.trim() || editingMilestoneIdx === null) return;
    try {
      const oldName = (currProject.milestones || [])[editingMilestoneIdx]?.name;
      const trimmedNewName = editMilestoneName.trim();

      const updatedMilestones = (currProject.milestones || []).map((m, idx) =>
        idx === editingMilestoneIdx
          ? { ...m, name: trimmedNewName, date: editMilestoneDate || '' }
          : m
      );

      // If the name changed, keep any tasks linked to this milestone pointing at the new name
      if (oldName && oldName !== trimmedNewName) {
        const linkedTasks = currTasks.filter(t =>
          t.milestone === oldName && !t.isDeleted &&
          (String(t.projectId?._id || t.projectId) === String(currProject._id) || t.project === currProject.name)
        );
        await Promise.all(linkedTasks.map(t =>
          axios.put(`${BASE_URL}/api/tasks/${t._id}`, { milestone: trimmedNewName })
        ));
      }

      setCurrProject(prev => ({ ...prev, milestones: updatedMilestones }));

      await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, {
        milestones: updatedMilestones
      });

      setEditingMilestoneIdx(null);
      setEditMilestoneName('');
      setEditMilestoneDate('');
      if (onUpdate) onUpdate();
      if (fetchTasks) fetchTasks();
    } catch (err) {
      console.error("Failed to update milestone:", err);
      alert("Failed to update milestone.");
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

      const uploadedUrl = res.data.url.startsWith('http') ? res.data.url : `${BASE_URL}${res.data.url}`;
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
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    setUploadFiles(prev => [...prev, ...selected]);
    setUploadFileError('');
    e.target.value = ''; // allow re-selecting the same file again later
  };

  const handleRemoveUploadFile = (index) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleModalUpload = async () => {
    if (uploadFiles.length === 0) {
      setUploadFileError('Please select at least one file to upload.');
      return;
    }
    setUploadFileError('');
    setUploadingModal(true);
    try {
      let updatedFiles = currProject.files || [];
      const newlyUploaded = [];
      if (uploadFiles.length > 0) {
        for (let i = 0; i < uploadFiles.length; i++) {
          const fileObj = uploadFiles[i];
          const formData = new FormData();
          formData.append("file", fileObj);
          const res = await axios.post(`${BASE_URL}/api/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          const uploadedUrl = res.data.url.startsWith('http') ? res.data.url : `${BASE_URL}${res.data.url}`;
          // If multiple files share one heading, number them so titles stay unique
          const heading = uploadHeading
            ? (uploadFiles.length > 1 ? `${uploadHeading} (${i + 1})` : uploadHeading)
            : fileObj.name;
          const newFileObj = {
            name: heading,
            description: uploadDescription,
            url: uploadedUrl,
            size: fileObj.size,
            type: fileObj.type,
            uploadedAt: new Date().toISOString(),
            sentToClient: uploadSendToClient ? (uploadClientName || currProject.client || clientName || 'client') : null,
            sentToEmployee: uploadSendToEmployee ? uploadEmployeeName : [],
          };
          newlyUploaded.push(newFileObj);
        }
        updatedFiles = [...updatedFiles, ...newlyUploaded];
      }
      const payload = { files: updatedFiles };
      let newUploadedUrl = '';
      if (newlyUploaded.length > 0) {
        newUploadedUrl = newlyUploaded[newlyUploaded.length - 1].url;
      }
      if (postUpdateOnUpload) {
        const visibleTo = ['team'];
        const title = uploadHeading.trim() || uploadDescription.trim().slice(0, 60) || 'Update';
        const body = uploadDescription.trim() ? `${uploadHeading.trim() ? uploadHeading + ': ' : ''}${uploadDescription}`.trim() : uploadHeading.trim();
        const composerAttachments = postUpdateAttachments || [];
        const allAttachments = [...composerAttachments, ...newlyUploaded.map(f => ({ name: f.name, url: f.url, type: f.type }))];
        const primaryAttachment = allAttachments[0] || null;
        const newUpdate = {
          text: body,
          title,
          date: new Date().toISOString(),
          author: 'Admin',
          type: updateType,
          visibleTo: visibleTo.length > 0 ? visibleTo : ['team'],
          fileName: primaryAttachment ? primaryAttachment.name : (uploadFileObj ? uploadFileObj.name : ''),
          fileUrl: primaryAttachment ? primaryAttachment.url : '',
          fileType: primaryAttachment ? primaryAttachment.type : '',
          attachments: allAttachments,
        };
        payload.updates = [newUpdate, ...(currProject.updates || [])];

        // Also create an actionable approval for the client and/or team so they
        // can View / Approve / Reject this update directly from Pending Approvals.
        try {
          const approvalCompanyId = user?.companyId || user?.company || user?._id || user?.id || currProject.companyId || '';
          const approvalPromises = [];
          if (uploadSendToClient && !resolvedClientId) {
            console.warn('No matching client record found for "' + clientName + '" — approval was NOT created for the client. Link this project to a proper client record.');
          }
          if (uploadSendToClient && resolvedClientId) {
            approvalPromises.push(axios.post(`${BASE_URL}/api/approvals`, {
              companyId: approvalCompanyId,
              clientId: resolvedClientId,
              recipientType: 'client',
              senderName: user?.name || user?.clientName || 'Admin',
              title,
              desc: body,
              icon: 'ti-speakerphone',
              approveLabel: 'Approve',
              rejectLabel: 'Review',
              sourceType: 'project',
              projectId: currProject._id || '',
              fileUrl: newUploadedUrl,
              fileName: uploadFileObj ? uploadFileObj.name : '',
            }));
          }
          if (uploadSendToEmployee && assigned.length > 0) {
            const teamMember = (employees || []).find(emp => (emp.name || emp.employeeName) === assigned[0]);
            if (teamMember?._id) {
              approvalPromises.push(axios.post(`${BASE_URL}/api/approvals`, {
                companyId: approvalCompanyId,
                teamMemberId: teamMember._id,
                recipientType: 'team',
                senderName: user?.name || user?.clientName || 'Admin',
                title,
                desc: body,
                icon: 'ti-speakerphone',
                approveLabel: 'Approve',
                rejectLabel: 'Review',
                sourceType: 'project',
                projectId: currProject._id || '',
                fileUrl: newUploadedUrl,
                fileName: uploadFileObj ? uploadFileObj.name : '',
              }));
            }
          }
          await Promise.all(approvalPromises);
          loadProjectApprovals();
        } catch (approvalErr) {
          console.error('Failed to create approval entry for update:', approvalErr);
        }
      }
      if (payload.updates) {
        setCurrProject(prev => ({ ...prev, ...payload }));
      }
      const putRes = await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, payload);
      console.log('Update saved, server response:', putRes.data);
      await loadLatest();
      if (onUpdate) onUpdate();
      setShowUploadModal(false);
      setUploadFiles([]);
      setPostUpdateAttachments([]);
      setUploadFileError('');
      setUploadShareError('');
      setUploadHeading('');
      setUploadDescription('');
      setUploadSendToClient(false);
      setUploadSendToEmployee(false);
      setUploadClientName('');
      setUploadEmployeeName('');
      setPostUpdateOnUpload(false);
      if (postUpdateOnUpload) { setUpdateText(''); setUpdateTitle(''); setUpdateType('progress'); }
      loadLatest();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Upload error:", err.response?.data || err.message || err);
      alert("Failed to save: " + (err.response?.data?.msg || err.message || "Unknown error"));
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

  const generatePortalLink = async (forProjectId = currProject?._id) => {
    // Don't attempt a lookup while the project is still the lightweight
    // post-refresh placeholder — it has no client/company data yet.
    if (currProject?._restoring) return '';
    // Snapshot the project identifiers at the moment this function is called.
    // This prevents stale closure values from a previously viewed project being used.
    const snapshotClientId = currProject?.clientId || resolvedClientId || '';
    const snapshotClientName = (currProject?.client || '').toLowerCase().trim();
    const snapshotCompanyId = currProject?.companyId || '';
    const snapshotProjectId = currProject?._id;

    // Only reuse the cached link if it was generated for THIS exact project.
    if (portalLinkUrl && forProjectId && forProjectId === lastPortalProjectId.current) {
      return portalLinkUrl;
    }

    setLoadingPortalLink(true);
    try {
      let matched = null;
      if (snapshotClientId) {
        try {
          const singleRes = await axios.get(`${BASE_URL}/api/clients/${snapshotClientId}`);
          matched = singleRes.data;
        } catch { /* fall through to list-based lookup below */ }
      }
      if (!matched) {
        const res = await axios.get(`${BASE_URL}/api/clients`, {
          headers: { 'x-company-id': snapshotCompanyId }
        });
        const clientList = Array.isArray(res.data) ? res.data : [];
        matched = snapshotClientId
          ? clientList.find(c => String(c._id) === String(snapshotClientId))
          : clientList.find(c => (c.clientName || c.name || '').toLowerCase().trim() === snapshotClientName);
      }

      if (!matched || !matched._id) {
        console.error('Could not resolve client for portal link. clientId:', snapshotClientId, 'clientName:', snapshotClientName);
        return '';
      }

      const subadminCompanyId = user?.companyId || user?._id || user?.id || snapshotCompanyId || '';
      const tokenRes = await axios.post(`${BASE_URL}/api/clients/${matched._id}/portal-token`, {
        companyId: subadminCompanyId,
        agencyName: user?.companyName || user?.name || '',
        projectId: snapshotProjectId || '',
      });

      const link = `${window.location.origin}/client-portal/${matched._id}?token=${tokenRes.data.token}`;
      setPortalLinkUrl(link);
      lastPortalProjectId.current = snapshotProjectId;
      return link;
    } catch (err) {
      console.error('Failed to generate portal link:', err);
      return '';
    } finally {
      setLoadingPortalLink(false);
    }
  };



  const copyPortalLink = async () => {
    const link = portalLinkUrl || await generatePortalLink();
    if (!link) return;
    navigator.clipboard.writeText(link);
    alert('Portal link copied to clipboard!');
  };

  const sharePortalLinkViaWhatsApp = async () => {
    const link = portalLinkUrl || await generatePortalLink();
    if (!link) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(`Here's your client portal link: ${link}`)}`, '_blank');
  };

  const sharePortalLinkViaEmail = async () => {
    const link = portalLinkUrl || await generatePortalLink();
    if (!link) return;
    window.open(`mailto:?subject=${encodeURIComponent('Your Client Portal Link')}&body=${encodeURIComponent(`Here's your client portal link: ${link}`)}`, '_blank');
  };

  return (
    <>
      <div className="mpd-root">
        {/* CSS injected once via useEffect above */}

        {/* TOPBAR */}
        <div className="mpd-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="mpd-breadcrumb">
            <a onClick={onBack}>Projects</a>
            <i className="ti ti-chevron-right" style={{ fontSize: 14 }}></i>
            <span style={{ color: P.textDark }}>{projName}</span>
          </div>

          {onEdit && user?.role !== 'client' && (
            <button
              onClick={() => onEdit({ ...project, ...currProject })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: P.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              <i className="ti ti-edit" style={{ fontSize: 15 }}></i> Edit Project
            </button>
          )}

        </div>

        {/* HEADER + CLIENT PORTAL — side by side, 50/50 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'stretch' }}>
          <div className="mpd-proj-header" style={{ flex: '1 1 50%', minWidth: 0 }}>
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


              </div>
            </div>
          </div>

          {user?.role !== 'client' && (
            <div style={{ background: `linear-gradient(135deg, #004D5E, ${P.primary})`, borderRadius: P.radius, padding: '16px 22px', color: '#fff', flex: '1 1 50%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
                <i className="ti ti-world" style={{ fontSize: 16 }}></i> Client Portal
              </div>
              <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>{clientName}</div>
              <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 9, padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: portalLinkUrl ? 1 : 0 }}>
                  {portalLinkUrl ? `/client-portal/${portalLinkUrl.split('/client-portal/')[1]?.split('?')[0]}` : '\u00A0'}
                </span>
                <button onClick={copyPortalLink} style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Copy</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button onClick={async () => { const link = portalLinkUrl || await generatePortalLink(); if (link) window.open(link, '_blank'); }} style={{ padding: '10px', borderRadius: 9, border: 'none', background: '#fff', color: P.primaryDark, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <i className="ti ti-external-link"></i> Open Portal
                </button>
                <button onClick={copyPortalLink} style={{ padding: '10px', borderRadius: 9, border: '1.5px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <i className="ti ti-copy"></i> Copy Link
                </button>
                <button onClick={sharePortalLinkViaWhatsApp} style={{ padding: '10px', borderRadius: 9, border: 'none', background: '#25D366', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <i className="ti ti-brand-whatsapp"></i> WhatsApp
                </button>
                <button onClick={sharePortalLinkViaEmail} style={{ padding: '10px', borderRadius: 9, border: '1.5px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <i className="ti ti-mail"></i> Email Link
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PROGRESS + SUMMARY — single row, 4 equal-width cards */}
        <div className="mpd-prog-card">
          <div className="mpd-prog-item">
            <div className="mpd-prog-num">{progressPct}%</div>
            <div className="mpd-prog-lbl">Overall Milestones</div>
            <div className="mpd-progress-bg"><div className="mpd-progress-fill" style={{ width: `${progressPct}%` }}></div></div>
            <div className="mpd-prog-sub">{doneMilestones} of {totalMilestones} milestones</div>
          </div>
          <div className="mpd-prog-item">
            <div className="mpd-prog-num">{budgetUsedPct}%</div>
            <div className="mpd-prog-lbl">Budget Used</div>
            <div className="mpd-progress-bg"><div className="mpd-progress-fill mpd-purple" style={{ width: `${budgetUsedPct}%` }}></div></div>
            <div className="mpd-prog-sub">{currency}{spent.toLocaleString()} of {currency}{budgetAmt.toLocaleString()}</div>
          </div>
          <div className="mpd-prog-item">
            <div className="mpd-kpi-icon" style={{ background: '#FEE2E2', marginBottom: 8 }}><i className="ti ti-arrow-up-right" style={{ color: '#EF4444' }}></i></div>
            <div className="mpd-prog-num">{currency}{spent.toLocaleString()}</div>
            <div className="mpd-prog-lbl">Spent Amount</div>
          </div>
          <div className="mpd-prog-item">
            <div className="mpd-kpi-icon" style={{ background: P.purpleLight, marginBottom: 8 }}><i className="ti ti-pig-money" style={{ color: P.purple }}></i></div>
            <div className="mpd-prog-num" style={{ color: remaining < 0 ? '#DC2626' : undefined }}>{remaining < 0 ? `-${currency}${Math.abs(remaining).toLocaleString()}` : `${currency}${remaining.toLocaleString()}`}</div>
            <div className="mpd-prog-lbl">Remaining Budget</div>
          </div>
        </div>



        {viewProjectApproval && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setViewProjectApproval(null)}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: P.radius, width: '100%', maxWidth: 520, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
              <div style={{ background: `linear-gradient(135deg,${P.primary},${P.primaryDark})`, padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{viewProjectApproval.title}</span>
                <button onClick={() => setViewProjectApproval(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
              </div>
              <div style={{ padding: '22px 24px' }}>
                <div style={{ fontSize: 13, color: P.textMid, lineHeight: 1.6 }}>{viewProjectApproval.desc || "No additional details provided."}</div>
                <div style={{ fontSize: 12, color: P.textLight, marginTop: 8 }}>
                  Sent to {viewProjectApproval.recipientType === 'team' ? 'Team' : 'Client'}{viewProjectApproval.senderName ? ` by ${viewProjectApproval.senderName}` : ''}
                </div>

                {viewProjectApproval.fileUrl && (() => {
                  const fname = (viewProjectApproval.fileName || viewProjectApproval.fileUrl || '').toLowerCase();
                  const isImage = /\.(jpg|jpeg|png|gif|webp)$/.test(fname);
                  return (
                    <div style={{ marginTop: 14, border: `1.5px solid ${P.border}`, borderRadius: 12, overflow: 'hidden', background: P.bg }}>
                      {isImage ? (
                        <img src={viewProjectApproval.fileUrl} alt={viewProjectApproval.fileName || 'Attached file'} style={{ width: '100%', maxHeight: 360, objectFit: 'contain', display: 'block', background: '#000' }} />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', gap: 8 }}>
                          <i className="ti ti-file-text" style={{ fontSize: 36, color: P.primary }}></i>
                          <div style={{ fontSize: 13, fontWeight: 700, color: P.textDark }}>{viewProjectApproval.fileName || 'Attached file'}</div>
                          <div style={{ fontSize: 11, color: P.textLight }}>Preview not available for this file type</div>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderTop: `1px solid ${P.border}` }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: P.textMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                          <i className="ti ti-paperclip" style={{ marginRight: 5 }}></i>{viewProjectApproval.fileName || 'Attached file'}
                        </span>
                        <a href={viewProjectApproval.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: P.primary, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                          Open <i className="ti ti-external-link" style={{ marginLeft: 3 }}></i>
                        </a>
                      </div>
                    </div>
                  );
                })()}

                {viewProjectApproval.status === 'rejected' && viewProjectApproval.rejectReason && (
                  <div style={{ marginTop: 14, fontSize: 12, color: P.red, background: P.redLight, padding: '8px 12px', borderRadius: 8 }}>
                    <strong>Rejection reason:</strong> {viewProjectApproval.rejectReason}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                  <button onClick={() => setViewProjectApproval(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1.5px solid ${P.border}`, background: 'transparent', color: P.textMid, fontFamily: 'Nunito,sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Close</button>
                  <button onClick={() => handleDeleteApproval(viewProjectApproval._id)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: P.red, color: '#fff', fontFamily: 'Nunito,sans-serif', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        )}





        {/* MILESTONES STANDALONE CARD */}
        <div className="mpd-card mpd-milestones-card">
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
              {!hideTopActions && (
                <button className="mpd-btn mpd-btn-outline" onClick={() => setShowAddMilestone(true)} style={{ padding: '6px 12px', fontSize: 12 }}>
                  <i className="ti ti-plus"></i> Add Milestone
                </button>
              )}
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
                    // A milestone with no tasks is never "done" — it's always pending
                    const xIsDone = mTasks.length > 0 ? (x.done === true || mAllCompleted) : false;
                    return !xIsDone;
                  });

                  const isActive = !isDone && idx === firstNotDone;
                  const circleColor = isDone ? P.red : isActive ? '#E0F7FA' : '#fff';
                  const circleBorder = isDone ? P.red : isActive ? P.primary : P.border;
                  const textColor = isDone ? P.red : isActive ? P.primary : P.textLight;
                  const statusLabel = isDone ? 'Done' : isActive ? 'Active' : 'Pending';
                  return (
                    <div key={idx} draggable="true" onDragStart={(e) => { e.stopPropagation(); setDragMilestoneIdx(idx); }} onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverMilestoneIdx(idx); }} onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (dragMilestoneIdx === null || dragMilestoneIdx === idx) { setDragMilestoneIdx(null); setDragOverMilestoneIdx(null); return; } const ms = [...(currProject.milestones || [])]; const dragged = ms.splice(dragMilestoneIdx, 1)[0]; ms.splice(idx, 0, dragged); setDragMilestoneIdx(null); setDragOverMilestoneIdx(null); setCurrProject(prev => ({ ...prev, milestones: ms })); axios.put(`${BASE_URL}/api/projects/${currProject._id}`, { milestones: ms }).then(loadLatest); }} onDragEnd={(e) => { e.stopPropagation(); setDragMilestoneIdx(null); setDragOverMilestoneIdx(null); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1, position: 'relative', zIndex: 1, opacity: dragMilestoneIdx === idx ? 0.4 : 1, cursor: 'grab', outline: dragOverMilestoneIdx === idx && dragMilestoneIdx !== idx ? `2.5px dashed ${P.primary}` : 'none', borderRadius: 8, transition: 'opacity .2s' }}>
                      {tasksForMilestone.length > 0 && (
                        <div style={{ position: 'absolute', top: 18, left: idx === 0 ? '0%' : '-50%', right: '50%', transform: 'translateY(-50%)', display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', zIndex: 0 }}>
                          {tasksForMilestone.map((t, i) => {
                            const taskDone = t.status === 'done' || t.status === 'completed';
                            return (
                              <div key={t._id} title={t.title} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: taskDone ? P.red : P.primary, border: '2px solid #fff', zIndex: 2 }}></div>
                                <div style={{ position: 'absolute', top: 14, fontSize: 9, color: taskDone ? P.red : P.textDark, whiteSpace: 'nowrap', fontWeight: 700, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
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
                      <div style={{ fontSize: 11, fontWeight: 700, color: P.textDark, textAlign: 'center', maxWidth: 80, minHeight: 28, lineHeight: 1.35, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', wordBreak: 'break-word', position: 'relative', zIndex: 1 }}>{m.name}</div>
                      {m.date && <div style={{ fontSize: 10, color: P.textLight, textAlign: 'center', position: 'relative', zIndex: 1 }}>{new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>}
                      <div style={{ fontSize: 10, fontWeight: 700, color: textColor, position: 'relative', zIndex: 1 }}>{statusLabel}</div>
                      {!hideTopActions && (
                        <div style={{ display: 'flex', gap: 8, position: 'relative', zIndex: 1 }}>
                          <button onClick={e => { e.stopPropagation(); handleEditMilestone(idx); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.primary, fontSize: 11, padding: 0 }}>Edit</button>
                          <button onClick={async e => {
                            e.stopPropagation();
                            if (!confirm('Delete milestone? This will also delete all tasks linked to this milestone.')) return;
                            try {
                              // Delete all tasks linked to this milestone
                              const linkedTasks = currTasks.filter(tk => tk.milestone === m.name && !tk.isDeleted && (String(tk.projectId?._id || tk.projectId) === String(currProject._id) || tk.project === currProject.name));
                              await Promise.all(linkedTasks.map(tk =>
                                axios.delete(`${BASE_URL}/api/tasks/${tk._id}`).catch(() =>
                                  axios.put(`${BASE_URL}/api/tasks/${tk._id}`, { isDeleted: true })
                                )
                              ));
                              // Remove milestone from project
                              const ms = (currProject.milestones || []).filter((_, i) => i !== idx);
                              const doneM = ms.filter(x => x.done).length;
                              const newProgress = ms.length > 0 ? Math.round((doneM / ms.length) * 100) : 0;
                              setCurrProject(prev => ({ ...prev, milestones: ms, progress: newProgress }));
                              await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, { milestones: ms, progress: newProgress });
                              if (onUpdate) onUpdate();
                              if (fetchTasks) fetchTasks();
                            } catch (err) { console.error('Failed to delete milestone:', err); }
                          }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.red, fontSize: 11, padding: 0 }}>Delete</button>
                        </div>
                      )}
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
                // Only mark done if tasks exist AND all are completed, OR manually toggled with tasks present
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
                  <div key={idx} draggable="true" onDragStart={(e) => { e.stopPropagation(); setDragMilestoneIdx(idx); }} onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverMilestoneIdx(idx); }} onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (dragMilestoneIdx === null || dragMilestoneIdx === idx) { setDragMilestoneIdx(null); setDragOverMilestoneIdx(null); return; } const ms = [...(currProject.milestones || [])]; const dragged = ms.splice(dragMilestoneIdx, 1)[0]; ms.splice(idx, 0, dragged); setDragMilestoneIdx(null); setDragOverMilestoneIdx(null); setCurrProject(prev => ({ ...prev, milestones: ms })); axios.put(`${BASE_URL}/api/projects/${currProject._id}`, { milestones: ms }).then(loadLatest); }} onDragEnd={(e) => { e.stopPropagation(); setDragMilestoneIdx(null); setDragOverMilestoneIdx(null); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: P.bg, border: `1.5px solid ${isDone ? P.green : isActive ? P.primary : P.border}`, transition: 'all .2s', cursor: 'grab', opacity: dragMilestoneIdx === idx ? 0.4 : 1, outline: dragOverMilestoneIdx === idx && dragMilestoneIdx !== idx ? `2.5px dashed ${P.primary}` : 'none' }}>
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
                    {!hideTopActions && (
                      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                        <button onClick={e => { e.stopPropagation(); handleEditMilestone(idx); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.primary, fontSize: 13, padding: 0 }}>Edit</button>
                        <button onClick={async e => {
                          e.stopPropagation();
                          if (!confirm('Delete milestone? This will also delete all tasks linked to this milestone.')) return;
                          try {
                            // Delete all tasks linked to this milestone
                            const linkedTasks = currTasks.filter(tk => tk.milestone === m.name && !tk.isDeleted && (String(tk.projectId?._id || tk.projectId) === String(currProject._id) || tk.project === currProject.name));
                            await Promise.all(linkedTasks.map(tk =>
                              axios.delete(`${BASE_URL}/api/tasks/${tk._id}`).catch(() =>
                                axios.put(`${BASE_URL}/api/tasks/${tk._id}`, { isDeleted: true })
                              )
                            ));
                            // Remove milestone from project
                            const ms = (currProject.milestones || []).filter((_, i) => i !== idx);
                            const doneM = ms.filter(x => x.done).length;
                            const newProgress = ms.length > 0 ? Math.round((doneM / ms.length) * 100) : 0;
                            setCurrProject(prev => ({ ...prev, milestones: ms, progress: newProgress }));
                            setCurrTasks(prev => prev.filter(tk => !linkedTasks.some(lt => lt._id === tk._id)));
                            await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, { milestones: ms, progress: newProgress });
                            if (onUpdate) onUpdate();
                            if (fetchTasks) fetchTasks();
                          } catch (err) { console.error('Failed to delete milestone:', err); }
                        }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.red, fontSize: 13, padding: 0 }}>Delete</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {editingMilestoneIdx !== null && (
            <form onSubmit={handleUpdateMilestone} style={{ background: P.primaryLight, padding: 14, borderRadius: 10, marginTop: 12, border: `1.5px solid ${P.primary}` }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: P.primaryDark, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8 }}>Editing Milestone</div>
              <div style={{ marginBottom: 8 }}>
                <input type="text" value={editMilestoneName} onChange={e => setEditMilestoneName(e.target.value)} placeholder="Milestone name..." required style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1.5px solid ${P.border}`, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="date"
                  value={editMilestoneDate}
                  onChange={e => setEditMilestoneDate(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: 6, border: `1.5px solid ${P.border}`, fontSize: 12, outline: 'none', flex: 1, background: '#fff', color: editMilestoneDate ? P.textDark : '#A0AEC0', fontFamily: 'Nunito, sans-serif', cursor: 'pointer', minWidth: 140 }}
                />
                <button type="submit" className="mpd-btn mpd-btn-primary" style={{ padding: '6px 12px', fontSize: 11 }}>Save</button>
                <button type="button" className="mpd-btn mpd-btn-outline" onClick={() => setEditingMilestoneIdx(null)} style={{ padding: '6px 12px', fontSize: 11 }}>✕</button>
              </div>
            </form>
          )}

          {showAddMilestone && (
            <form onSubmit={handleAddMilestone} style={{ background: P.bg, padding: 14, borderRadius: 10, marginTop: 12 }}>
              <div style={{ marginBottom: 8 }}>
                {!isCustomMilestoneMode ? (
                  <select
                    value={MILESTONE_OPTIONS.filter(o => o !== "Custom").includes(newMilestoneName) ? newMilestoneName : ""}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === "Custom") {
                        setNewMilestoneName('');
                        setIsCustomMilestoneMode(true);
                      } else {
                        setNewMilestoneName(val);
                      }
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1.5px solid ${P.border}`, fontSize: 12, outline: 'none' }}
                  >
                    <option value="">Select milestone...</option>
                    {MILESTONE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newMilestoneName}
                    autoFocus
                    onChange={e => setNewMilestoneName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!newMilestoneName.trim()) return;
                        setIsCustomMilestoneMode(false);
                      }
                    }}
                    placeholder="Enter custom milestone name"
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1.5px solid ${P.border}`, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                  />
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="date"
                  value={newMilestoneDate}
                  onChange={e => setNewMilestoneDate(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: `1.5px solid ${P.border}`,
                    fontSize: 12,
                    outline: 'none',
                    flex: 1,
                    background: '#fff',
                    color: newMilestoneDate ? P.textDark : '#A0AEC0',
                    fontFamily: 'Nunito, sans-serif',
                    cursor: 'pointer',
                    minWidth: 140,
                  }}
                />

                <button type="submit" className="mpd-btn mpd-btn-primary" style={{ padding: '6px 12px', fontSize: 11 }}>Add</button>
                <button type="button" className="mpd-btn mpd-btn-outline" onClick={() => { setShowAddMilestone(false); setIsCustomMilestoneMode(false); }} style={{ padding: '6px 12px', fontSize: 11 }}>✕</button>
              </div>
            </form>
          )}
        </div>


        {/* MAIN CONTENT GRID */}
        <div className="mpd-grid-main-side">
          {/* RIGHT COL — TASKS */}

          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', order: 2 }}>
            {/* TASKS COMPONENT */}
            <div className="mpd-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="mpd-card-header" style={{ padding: '20px 24px 10px', marginBottom: 0 }}>
                <div className="mpd-card-title"><i className="ti ti-list-check"></i> Tasks</div>
                {!hideTopActions && (
                  <button className="mpd-btn mpd-btn-outline" onClick={() => { setEditingTask(null); setNewTaskTitle(''); setNewTaskDesc(''); setNewTaskPriority('medium'); setNewTaskAssignTo([]); setNewTaskDue(''); setNewTaskMilestone(''); setShowAddTaskModal(true); }} style={{ padding: '6px 12px', fontSize: 12 }}><i className="ti ti-plus"></i> Add Task</button>
                )}

              </div>
              <div style={{ padding: '0 24px 14px' }}>
                <div className="mpd-task-filters">
                  <button className={`mpd-tf ${taskFilter === 'all' ? 'mpd-on' : ''}`} onClick={() => setTaskFilter('all')}>All ({totalTasks})</button>
                  <button className={`mpd-tf ${taskFilter === 'inprog' ? 'mpd-on' : ''}`} onClick={() => setTaskFilter('inprog')}>In Progress ({inprogTasks})</button>
                  <button className={`mpd-tf ${taskFilter === 'done' ? 'mpd-on' : ''}`} onClick={() => setTaskFilter('done')}>Completed ({doneTasks})</button>
                </div>
              </div>
              <div style={{ padding: '0 24px 20px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
                {filteredTasks.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: P.textLight, fontSize: 13 }}>No tasks found for this filter.</div>
                ) : (
                  filteredTasks.map(t => {
                    const isDone = t.status === 'done' || t.status === 'completed' || t.checked === true;
                    return (
                      <div key={t._id} className="mpd-task-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: `1px solid ${P.bg}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: 'pointer' }} onClick={() => handleToggleTask(t)}>
                          <div className={`mpd-task-chk ${isDone ? 'mpd-done' : ''}`}></div>
                          <div className={`mpd-task-prio ${t.priority === 'high' ? 'mpd-h' : (t.priority === 'medium' ? 'mpd-m' : 'mpd-l')}`}></div>
                          <div className={`mpd-task-name ${isDone ? 'mpd-done' : ''}`}>{t.title || t.name}</div>
                          <div className="mpd-task-assign">
                            {t.assignTo
                              ? t.assignTo.split(', ').filter(Boolean).join(', ')
                              : 'Unassigned'}
                          </div>
                          <div className="mpd-task-due">{t.date ? new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</div>
                        </div>
                        {!hideTopActions && (<>
                          {!hideTopActions && (<>
                            <button onClick={e => { e.stopPropagation(); setEditingTask(t); setNewTaskTitle(t.title || ''); setNewTaskDesc(t.description || ''); setNewTaskPriority(t.priority || 'medium'); setNewTaskAssignTo(t.assignTo ? t.assignTo.split(', ').filter(Boolean) : []); setNewTaskDue(t.date || ''); setNewTaskMilestone(t.milestone || ''); setNewTaskStatus(t.status || 'Not Started'); setShowAddTaskModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.primary, fontSize: 13, padding: '2px 6px' }}>Edit</button>
                            <button onClick={async e => {
                              e.stopPropagation();
                              if (!confirm('Delete?')) return;
                              try {
                                // Delete the task
                                await axios.delete(`${BASE_URL}/api/tasks/${t._id}`).catch(() =>
                                  axios.put(`${BASE_URL}/api/tasks/${t._id}`, { isDeleted: true })
                                );

                                // Recalculate milestone done flags — fetch latest tasks after deletion
                                const latestTasksRes = await axios.get(`${BASE_URL}/api/tasks`, {
                                  headers: { 'x-company-id': currProject?.companyId || '' }
                                });
                                const allTasksAfterDelete = Array.isArray(latestTasksRes.data) ? latestTasksRes.data : [];
                                const projTasksAfterDelete = allTasksAfterDelete.filter(tk => {
                                  if (!tk || tk.isDeleted) return false;
                                  const tPid = tk.projectId ? (tk.projectId._id ? String(tk.projectId._id) : String(tk.projectId)) : null;
                                  return tPid === String(currProject._id) || tk.project === currProject.name;
                                });

                                // Update milestone done flags based on remaining tasks
                                const updatedMilestones = (currProject.milestones || []).map(m => {
                                  const remainingTasks = projTasksAfterDelete.filter(tk => tk.milestone === m.name && !tk.isDeleted);
                                  if (remainingTasks.length === 0) {
                                    // No tasks left — milestone cannot be done
                                    return { ...m, done: false };
                                  }
                                  const allDone = remainingTasks.every(tk => tk.status === 'done' || tk.status === 'completed');
                                  return { ...m, done: allDone };
                                });

                                // Recalculate overall progress
                                const doneM = updatedMilestones.filter((m, idx) => {
                                  const mTasks = projTasksAfterDelete.filter(tk => tk.milestone === m.name && !tk.isDeleted);
                                  return mTasks.length > 0 && m.done === true;
                                }).length;
                                const totalM = updatedMilestones.length;
                                const newProgress = totalM > 0 ? Math.round((doneM / totalM) * 100) : 0;

                                await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, {
                                  milestones: updatedMilestones,
                                  progress: newProgress,
                                });

                                loadLatest();
                                if (onUpdate) onUpdate();
                                if (fetchTasks) fetchTasks();
                              } catch (err) {
                                console.error('Failed to delete task:', err);
                              }
                            }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.red, fontSize: 13, padding: '2px 6px' }}>Delete</button>
                          </>)}
                        </>)}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* LEFT COL — TABS (Updates / Activity Logs / Accounts) */}
          <div style={{ order: 1 }}>
            {/* TABS - draggable scroll */}
            <div className="mpd-card">          <div className="mpd-tabs"
              ref={tabsRef}
              style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
            >
              {tabOrder.map(tab => {
                let lbl = '', icon = null;
                if (tab === 'updates') lbl = 'Updates';
                if (tab === 'activity') lbl = 'Activity Logs';
                if (tab === 'payments') { lbl = 'Accounts'; icon = 'ti-arrows-exchange'; }
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
                <span
                  onClick={() => {
                    const idx = tabOrder.indexOf(activeTab);
                    const nextIdx = (idx + 1) % tabOrder.length;
                    setActiveTab(tabOrder[nextIdx]);
                  }}
                  style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6, background: '#F3F4F6', color: '#4B5563' }}
                >
                  <i className="ti ti-chevron-right"></i>
                </span>
              </div>
            </div>

              <div ref={tabContentRef} style={{ userSelect: 'none', overflow: 'visible', minHeight: 0 }}>
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

                  {!hideTopActions && (
                    <div className="mpd-upd-composer">
                      <div className="mpd-uc-body mpd-open">
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: P.textLight, textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 8 }}>Select Team Members</div>
                          <div style={{ position: 'relative' }} ref={updateMembersDropdownRef}>
                            <div
                              onClick={() => setShowUpdateMembersDropdown(v => !v)}
                              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${P.purple}`, fontSize: 13, fontFamily: 'Nunito,sans-serif', background: '#fff', color: updateSelectedMembers.length ? P.textDark : P.textLight, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {updateSelectedMembers.length === 0 ? '-- Select Team Members --' : updateSelectedMembers.join(', ')}
                              </span>
                              <i className={`ti ${showUpdateMembersDropdown ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 14, flexShrink: 0, marginLeft: 8 }} />
                            </div>
                            {showUpdateMembersDropdown && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', border: `1.5px solid ${P.purple}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 20, maxHeight: 200, overflowY: 'auto' }}>
                                {assigned.length === 0 && (
                                  <div style={{ padding: '10px 12px', fontSize: 12, color: P.textLight }}>No team members assigned to this project.</div>
                                )}
                                {assigned.map((name, i) => {
                                  const checked = updateSelectedMembers.includes(name);
                                  return (
                                    <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 13, color: P.textDark, cursor: 'pointer' }}>
                                      <input type="checkbox" checked={checked} onChange={() => setUpdateSelectedMembers(prev => checked ? prev.filter(n => n !== name) : [...prev, name])} />
                                      {name}
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 180 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: P.textLight, textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 8 }}>Update Type</div>
                            {isCustomUpdateTypeMode ? (
                              <input
                                type="text"
                                autoFocus
                                value={customUpdateTypeInput}
                                onChange={e => setCustomUpdateTypeInput(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = customUpdateTypeInput.trim();
                                    if (!val) return;
                                    if (!customUpdateTypes.includes(val)) {
                                      const next = [...customUpdateTypes, val];
                                      setCustomUpdateTypes(next);
                                      localStorage.setItem('mb_customUpdateTypes', JSON.stringify(next));
                                    }
                                    setUpdateType(val);
                                    setIsCustomUpdateTypeMode(false);
                                  }
                                }}
                                onBlur={() => {
                                  const val = customUpdateTypeInput.trim();
                                  if (val) {
                                    if (!customUpdateTypes.includes(val)) {
                                      const next = [...customUpdateTypes, val];
                                      setCustomUpdateTypes(next);
                                      localStorage.setItem('mb_customUpdateTypes', JSON.stringify(next));
                                    }
                                    setUpdateType(val);
                                  }
                                  setIsCustomUpdateTypeMode(false);
                                }}
                                placeholder="Enter custom update type"
                                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${P.border}`, fontSize: 13, fontFamily: 'Nunito,sans-serif', boxSizing: 'border-box' }}
                              />
                            ) : (
                              <select
                                value={updateType}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === '__custom__') {
                                    setCustomUpdateTypeInput('');
                                    setIsCustomUpdateTypeMode(true);
                                  } else {
                                    setUpdateType(val);
                                  }
                                }}
                                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${P.border}`, fontSize: 13, fontFamily: 'Nunito,sans-serif' }}
                              >
                                <option value="">Select update type...</option>
                                <option value="general">General</option>
                                <option value="progress">Progress</option>
                                <option value="billing">Billing</option>
                                <option value="milestone">Milestone</option>
                                {customUpdateTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                <option value="__custom__">+ Custom</option>
                              </select>
                            )}
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: P.textMid, cursor: 'pointer', paddingTop: 22, whiteSpace: 'nowrap' }}>
                            <input type="checkbox" checked={isApprovalRequest} onChange={e => setIsApprovalRequest(e.target.checked)} style={{ accentColor: P.primary, width: 15, height: 15, cursor: 'pointer' }} />
                            <i className="ti ti-clipboard-check" style={{ fontSize: 14 }} /> Approval Request
                          </label>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: P.textLight, textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 8 }}>Update Title *</div>
                          <input
                            type="text"
                            value={updateTitle}
                            onChange={e => setUpdateTitle(e.target.value)}
                            placeholder="e.g. Checkout flow 80% complete"
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${P.border}`, fontSize: 13, fontFamily: 'Nunito,sans-serif', boxSizing: 'border-box' }}
                          />
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: P.textLight, textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 8 }}>Details</div>
                          <textarea
                            value={updateText}
                            onChange={e => setUpdateText(e.target.value)}
                            placeholder="What's done, what's next, any blockers or decisions needed..."
                            rows={3}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${P.border}`, fontSize: 13, fontFamily: 'Nunito,sans-serif', boxSizing: 'border-box', resize: 'vertical' }}
                          />
                        </div>

                        <input
                          type="file"
                          multiple
                          ref={postUpdateFileInputRef}
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;
                            setPostUpdateAttaching(true);
                            await Promise.all(files.map(async (file) => {
                              const tempId = `${file.name}-${Date.now()}-${Math.random()}`;
                              setPostUpdateAttachments(prev => [...prev, { name: file.name, url: '', type: file.type, uploading: true, progress: 0, tempId }]);
                              try {
                                const formData = new FormData();
                                formData.append('file', file);
                                const res = await axios.post(`${BASE_URL}/api/upload`, formData, {
                                  headers: { 'Content-Type': 'multipart/form-data' },
                                  onUploadProgress: (evt) => {
                                    const pct = evt.total ? Math.round((evt.loaded * 100) / evt.total) : 0;
                                    setPostUpdateAttachments(prev => prev.map(a => a.tempId === tempId ? { ...a, progress: pct } : a));
                                  }
                                });
                                const resolvedUrl = res.data.url && res.data.url.startsWith('http') ? res.data.url : `${BASE_URL}${res.data.url.startsWith('/') ? '' : '/'}${res.data.url}`;
                                setPostUpdateAttachments(prev => prev.map(a => a.tempId === tempId ? { name: file.name, url: resolvedUrl, type: file.type, uploading: false, progress: 100 } : a));
                              } catch (err) {
                                console.error('Attachment upload failed:', file.name, err);
                                setPostUpdateAttachments(prev => prev.filter(a => a.tempId !== tempId));
                                alert(`Failed to upload ${file.name}.`);
                              }
                            }));
                            setPostUpdateAttaching(false);
                            e.target.value = '';
                          }}
                        />
                        {postUpdateAttachments.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                            {postUpdateAttachments.map((att, idx) => (
                              <div key={att.tempId || `${att.name}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${P.border}`, background: '#f8fafc', maxWidth: 320 }}>
                                <i className={`ti ${(att.type && att.type.startsWith('image/')) || /\.(jpe?g|png|gif|webp|svg)$/i.test(att.name || '') ? 'ti-photo' : 'ti-file'}`} style={{ fontSize: 15, color: P.primary, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: P.textDark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                  {att.name}{att.uploading ? ` (${att.progress || 0}%)` : ''}
                                </span>
                                <button onClick={() => setPostUpdateAttachments(prev => prev.filter((_, i) => i !== idx))} title="Remove attachment" style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.textLight, fontSize: 16, lineHeight: 1, padding: 2, flexShrink: 0 }}>×</button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => { setPostUpdateAttaching(false); postUpdateFileInputRef.current.value = ''; postUpdateFileInputRef.current.accept = 'image/*'; postUpdateFileInputRef.current.click(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.textMid, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', padding: '6px 10px', borderRadius: 8, transition: 'background .15s' }} onMouseEnter={e => e.currentTarget.style.background = '#f0f4f8'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                              <i className="ti ti-photo" style={{ fontSize: 15 }} /> Image
                            </button>
                            <button onClick={() => { setPostUpdateAttaching(false); postUpdateFileInputRef.current.value = ''; postUpdateFileInputRef.current.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain'; postUpdateFileInputRef.current.click(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.textMid, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', padding: '6px 10px', borderRadius: 8, transition: 'background .15s' }} onMouseEnter={e => e.currentTarget.style.background = '#f0f4f8'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                              <i className="ti ti-file" style={{ fontSize: 15 }} /> File/Doc
                            </button>
                          </div>
                          <button
                            disabled={postingUpdate || (!updateTitle.trim() && !updateText.trim())}
                            onClick={async () => {
                              const hasContent = updateTitle.trim() || updateText.trim();
                              if (!hasContent) return;
                              if (isApprovalRequest && currProject.approvalRequestEnabled === false) {
                                alert('Approval requests are disabled for this project.');
                                return;
                              }
                              setPostingUpdate(true);
                              try {
                                const visibleTo = ['team'];
                                const title = updateTitle.trim() || updateText.trim().slice(0, 60) || 'Update';
                                const attachments = postUpdateAttachments || [];
                                const primaryAttachment = attachments[0] || null;
                                const newUpdate = {
                                  text: updateText.trim(),
                                  title,
                                  date: new Date().toISOString(),
                                  author: 'Admin',
                                  type: updateType || 'general',
                                  visibleTo,
                                  recipients: updateSelectedMembers,
                                  fileName: primaryAttachment ? primaryAttachment.name : '',
                                  fileUrl: primaryAttachment ? primaryAttachment.url : '',
                                  fileType: primaryAttachment ? primaryAttachment.type : '',
                                  attachments,
                                  status: 'sent',
                                  isApprovalRequest,
                                  approvalStatus: isApprovalRequest ? 'pending' : undefined,
                                };
                                const updatedUpdates = [newUpdate, ...(currProject.updates || [])];
                                setCurrProject(prev => ({ ...prev, updates: updatedUpdates }));
                                const putRes = await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, { updates: updatedUpdates });

                                if (isApprovalRequest && resolvedClientId) {
                                  const approvalCompanyId = user?.companyId || user?.company || user?._id || user?.id || currProject.companyId || '';
                                  await axios.post(`${BASE_URL}/api/approvals`, {
                                    companyId: approvalCompanyId,
                                    clientId: resolvedClientId,
                                    recipientType: 'client',
                                    senderName: user?.name || user?.clientName || 'Admin',
                                    title,
                                    desc: updateText.trim(),
                                    icon: 'ti-file-text',
                                    approveLabel: 'Approve',
                                    rejectLabel: 'Review',
                                    sourceType: 'project',
                                    projectId: currProject._id || '',
                                    fileUrl: primaryAttachment ? primaryAttachment.url : '',
                                    fileName: primaryAttachment ? primaryAttachment.name : '',
                                  });
                                  loadProjectApprovals();
                                }

                                await loadLatest();
                                if (onUpdate) onUpdate();
                                setUpdateText('');
                                setUpdateTitle('');
                                setPostUpdateAttachments([]);
                                setUpdateSelectedMembers([]);
                                setIsApprovalRequest(false);
                              } catch (err) {
                                console.error('Failed to post update:', err.response?.data || err.message);
                                alert('Failed to save update: ' + (err.response?.data?.msg || err.message));
                              } finally {
                                setPostingUpdate(false);
                              }
                            }}
                            style={{ padding: '9px 22px', borderRadius: 10, background: P.primary, color: '#fff', border: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, cursor: (postingUpdate || (!updateTitle.trim() && !updateText.trim())) ? 'not-allowed' : 'pointer', opacity: (postingUpdate || (!updateTitle.trim() && !updateText.trim())) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,188,212,.25)', transition: 'all .15s' }}>
                            <i className="ti ti-send" style={{ fontSize: 15 }} />
                            {isApprovalRequest ? 'Send Update + Approval Request' : 'Send to Team'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {(!currProject.updates || currProject.updates.length === 0) ? (
                    <div style={{ padding: 20, textAlign: 'center', color: P.textLight, fontSize: 13 }}>No updates posted yet.</div>
                  ) : (() => {
                    const perPage = 10;
                    const totalPages = Math.ceil(currProject.updates.length / perPage);
                    const pageItems = currProject.updates.slice(updatesPage * perPage, updatesPage * perPage + perPage);
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 0' }}>
                        {pageItems.map((upd, idx) => {
                          const attachments = (upd.attachments && upd.attachments.length > 0)
                            ? upd.attachments
                            : (upd.fileUrl ? [{ name: upd.fileName, url: upd.fileUrl, type: upd.fileType }] : []);
                          return (
                            <div key={upd._id || idx} style={{ border: `1px solid ${P.border}`, borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                              <div style={{ background: `linear-gradient(135deg,${P.primary},${P.primaryDark})`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <i className="ti ti-speakerphone" style={{ color: '#fff', fontSize: 17 }} />
                                <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>{upd.title || 'Project Update'}</span>
                              </div>
                              <div style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                  <div style={{ background: P.primaryLight, color: P.primary, borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 12, flexShrink: 0 }}>{getInitials(upd.author)}</div>
                                  <strong style={{ fontSize: 13, color: P.textDark }}>{upd.author}</strong>
                                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, background: P.primaryLight, color: P.primary, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>{upd.type || 'general'}</span>
                                  <span style={{ fontSize: 11, color: P.textLight, marginLeft: 'auto' }}>{new Date(upd.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                {(() => {
                                  const linkedApproval = upd.isApprovalRequest
                                    ? projectApprovals.find(a => a.title === upd.title)
                                    : null;
                                  const statusColor = linkedApproval
                                    ? (linkedApproval.status === 'approved' ? '#15803D' : linkedApproval.status === 'rejected' ? '#DC2626' : '#B45309')
                                    : (upd.status === 'Approved' ? '#15803D' : upd.status === 'Reviewed' ? '#B45309' : '#64748B');
                                  const statusBg = linkedApproval
                                    ? (linkedApproval.status === 'approved' ? '#DCFCE7' : linkedApproval.status === 'rejected' ? '#FEE2E2' : '#FEF3C7')
                                    : (upd.status === 'Approved' ? '#DCFCE7' : upd.status === 'Reviewed' ? '#FEF3C7' : '#F1F5F9');
                                  const statusLabel = linkedApproval
                                    ? (linkedApproval.status.charAt(0).toUpperCase() + linkedApproval.status.slice(1))
                                    : (upd.status || 'Pending');
                                  return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                                      <span style={{
                                        display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                                        background: statusBg, color: statusColor,
                                      }}>{statusLabel}</span>
                                      {linkedApproval && (
                                        <>
                                          <button onClick={() => setViewProjectApproval(linkedApproval)} style={{ padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${P.border}`, background: '#fff', color: P.primary, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>View</button>
                                          {!hideTopActions && (
                                            <button onClick={() => handleDeleteApproval(linkedApproval._id)} style={{ padding: '4px 10px', borderRadius: 8, border: '1.5px solid #FCA5A5', background: P.redLight, color: P.red, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                                          )}
                                        </>
                                      )}
                                      {!hideTopActions && (
                                        <button
                                          onClick={async () => {
                                            if (!window.confirm('Delete this update? This cannot be undone.')) return;
                                            const updatedUpdates = (currProject.updates || []).filter((_, i2) => i2 !== (updatesPage * 10 + idx));
                                            setCurrProject(prev => ({ ...prev, updates: updatedUpdates }));
                                            try {
                                              await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, { updates: updatedUpdates });
                                              if (onUpdate) onUpdate();
                                            } catch (err) {
                                              console.error('Failed to delete update:', err.response?.data || err.message);
                                              alert('Failed to delete update.');
                                            }
                                          }}
                                          style={{ padding: '4px 10px', borderRadius: 8, border: '1.5px solid #FCA5A5', background: P.redLight, color: P.red, fontSize: 11, fontWeight: 700, cursor: 'pointer', marginLeft: 'auto' }}
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </div>
                                  );
                                })()}
                                {upd.text && (
                                  <div style={{ fontSize: 13, color: P.textMid, lineHeight: 1.6, marginBottom: attachments.length > 0 ? 12 : 0 }}>{upd.text}</div>
                                )}
                                {upd.status === 'Reviewed' && upd.reviewComment && (
                                  <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A', fontSize: 12.5, color: '#92400E' }}>
                                    <strong>Review note:</strong> {upd.reviewComment}
                                  </div>
                                )}
                                {attachments.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                    {attachments.map((att, aidx) => {
                                      const isImg = (att.type && att.type.startsWith('image/')) || /\.(jpe?g|png|gif|webp|svg)$/i.test(att.url || att.name || '');
                                      const displayUrl = att.url && att.url.startsWith('http') ? att.url : `${BASE_URL}${att.url && att.url.startsWith('/') ? '' : '/'}${att.url || ''}`;
                                      return isImg ? (
                                        <img
                                          key={`${att.url}-${aidx}`}
                                          src={displayUrl}
                                          alt={att.name || 'attachment'}
                                          onClick={() => window.open(displayUrl, '_blank')}
                                          style={{ width: 90, height: 70, objectFit: 'cover', borderRadius: 8, border: `1.5px solid ${P.border}`, cursor: 'pointer', background: '#f8fafc' }}
                                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ''; e.currentTarget.style.display = 'none'; }}
                                        />
                                      ) : (
                                        <a key={`${att.url}-${aidx}`} href={displayUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${P.border}`, background: '#f8fafc', fontSize: 12, fontWeight: 700, color: P.textDark, textDecoration: 'none' }}>
                                          <i className="ti ti-file" style={{ fontSize: 14, color: P.primary }} />
                                          {att.name || 'Attachment'}
                                        </a>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
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
                  <div style={{ padding: '18px 0', overflow: 'visible' }}>

                    {/* STATS ROW */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 20 }}>
                      {(() => {
                        const liveAdvanceTotal = (currProject.advances || []).reduce((s, a) => s + parseAmt(a.amount), 0);
                        const liveAdditionalTotal = (currProject.additionalCharges || []).reduce((s, a) => s + parseAmt(a.amount), 0);
                        const liveBilled = mergedInvoices.reduce((s, inv) => s + parseAmt(inv.amount), 0);
                        const liveReceived = (currProject.paymentsReceived || []).reduce((s, p) => s + parseAmt(p.amount), 0);
                        const livePending = Math.max(0, liveBilled - liveReceived);
                        return [
                          { lbl: 'Total Invoiced', val: `${currency}${liveBilled.toLocaleString()}`, sub: `${mergedInvoices.length} invoice(s)`, color: '#3B82F6', icon: 'ti-file-invoice' },
                          { lbl: 'Received', val: `${currency}${liveReceived.toLocaleString()}`, sub: `${liveBilled > 0 ? Math.round((liveReceived / liveBilled) * 100) : 0}% collected`, color: '#22C55E', icon: 'ti-circle-check' },

                          { lbl: 'Outstanding', val: `${currency}${livePending.toLocaleString()}`, sub: 'Balance due', color: '#EF4444', icon: 'ti-alert-circle' },
                        ];
                      })().map(s => (
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

                        { key: 'pay', label: 'Payment', desc: 'Received amounts', icon: 'ti-credit-card', color: '#22C55E', bg: 'rgba(34,197,94,.1)' },
                        { key: 'exp', label: 'Expenses', desc: 'Project costs', icon: 'ti-receipt', color: '#6B7280', bg: 'rgba(107,114,128,.1)' },
                      ].map(t => (
                        <div key={t.key}
                          onClick={() => { setActivePayTab(t.key); setSelectedPaymentItems([]); }}
                          style={{ background: activePayTab === t.key ? ' var(--app-accent, var(--app-accent, #00BCD4))' : '#fff', border: `1px solid ${activePayTab === t.key ? ' var(--app-accent, var(--app-accent, #00BCD4))' : '#E8EDF2'}`, borderRadius: 12, padding: '14px 8px', textAlign: 'center', cursor: 'pointer', transition: 'all .15s' }}
                        >
                          <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 18, background: activePayTab === t.key ? 'rgba(255,255,255,.25)' : t.bg, color: activePayTab === t.key ? '#fff' : t.color }}>
                            <i className={`ti ${t.icon}`}></i>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: activePayTab === t.key ? '#fff' : '#0D1B2A' }}>{t.label}</div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: activePayTab === t.key ? 'rgba(255,255,255,.75)' : '#7B8FA1', marginTop: 2 }}>{t.desc}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
                      {selectedPaymentItems.length > 0 && activePayTab === 'inv' && (
                        <button onClick={() => { setTargetPortalClient(currProject.client); setShowSendPopup(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                          <i className="ti ti-send" style={{ fontSize: 13 }}></i> Send ({selectedPaymentItems.length})
                        </button>
                      )}
                      {!hideTopActions && (() => {
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
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: ' var(--app-accent, var(--app-accent, #00BCD4))', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            <i className={`ti ${b.icon}`} style={{ fontSize: 13 }}></i> {b.label}
                          </button>
                        );
                      })()}
                    </div>

                    {/* INVOICE TABLE — only show when at least one invoice exists */}
                    {mergedInvoices.length > 0 && (
                      <div data-paytab="inv" style={{ display: 'block', background: '#fff', border: '1px solid #E8EDF2', borderRadius: 14, overflow: 'visible', marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #E8EDF2' }}>
                          <i className="ti ti-file-invoice" style={{ color: '#3B82F6', fontSize: 15, marginRight: 8 }}></i>
                          <span style={{ fontSize: 13, fontWeight: 900, color: '#0D1B2A' }}>Invoices</span>
                          <span style={{ background: 'rgba(59,130,246,.1)', color: '#3B82F6', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 20, marginLeft: 8 }}>{mergedInvoices.length}</span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                            <thead><tr style={{ background: '#F8FAFC' }}>{['', 'Invoice ID', 'Client', 'Project', 'Category', 'Amount', 'Issue Date', 'Due Date', 'Status', 'Actions'].map(h => <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: '#7B8FA1', textTransform: 'uppercase', letterSpacing: '.7px', borderBottom: '1px solid #E8EDF2', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                            <tbody>
                              {mergedInvoices.map((inv, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}>
                                  <td style={{ padding: '12px 14px' }} onClick={(e) => e.stopPropagation()}>
                                    <input type="checkbox" checked={selectedPaymentItems.includes(i)} onChange={() => setSelectedPaymentItems(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])} />
                                  </td>
                                  <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 800, color: ' var(--app-accent, #00BCD4)' }} onClick={() => onViewInvoice ? onViewInvoice(currProject, inv) : setPreviewInvoice(inv)}>{inv.invoiceNo || `INV-00${i + 1}`}</td>
                                  <td style={{ padding: '12px 14px' }} onClick={() => onViewInvoice ? onViewInvoice(currProject, inv) : setPreviewInvoice(inv)}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0097A7', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {(inv.client || currProject.client || '?')[0]?.toUpperCase()}
                                      </div>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{inv.client || currProject.client || '—'}</span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#374151' }} onClick={() => onViewInvoice ? onViewInvoice(currProject, inv) : setPreviewInvoice(inv)}>{currProject.name || '—'}</td>
                                  <td style={{ padding: '12px 14px' }} onClick={() => onViewInvoice ? onViewInvoice(currProject, inv) : setPreviewInvoice(inv)}>
                                    <span style={{ background: '#EDE9FE', color: '#7C3AED', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{inv.category || 'Milestone'}</span>
                                  </td>
                                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: '#15803D' }} onClick={() => onViewInvoice ? onViewInvoice(currProject, inv) : setPreviewInvoice(inv)}>{currency}{(inv.amount || 0).toLocaleString()}</td>
                                  <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#2D3E50' }} onClick={() => onViewInvoice ? onViewInvoice(currProject, inv) : setPreviewInvoice(inv)}>{inv.date || inv.issueDate ? new Date(inv.date || inv.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                                  <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#F59E0B' }} onClick={() => onViewInvoice ? onViewInvoice(currProject, inv) : setPreviewInvoice(inv)}>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                                  <td style={{ padding: '12px 14px' }} onClick={() => onViewInvoice ? onViewInvoice(currProject, inv) : setPreviewInvoice(inv)}><span style={{ background: inv.status === 'Paid' ? '#DCFCE7' : '#FEF3C7', color: inv.status === 'Paid' ? '#15803D' : '#B45309', borderRadius: 20, padding: '3px 9px', fontSize: 10, fontWeight: 800 }}>{inv.status || 'Draft'}</span></td>
                                  <td style={{ padding: '12px 14px' }} onClick={(e) => e.stopPropagation()}>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                      <button onClick={() => onViewInvoice ? onViewInvoice(currProject, inv, i) : setPreviewInvoice(inv)} style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: '1px solid #E8EDF2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#7B8FA1' }}><i className="ti ti-eye"></i></button>
                                      <button onClick={() => { if (onNewInvoice) { onNewInvoice(currProject, inv); } }} style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: '1px solid #E8EDF2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#7B8FA1' }}><i className="ti ti-edit"></i></button>
                                      <button
                                        title="Share to Client"
                                        disabled={sharingInvoiceNo === inv.invoiceNo}
                                        onClick={() => handleShareToClient(inv)}
                                        style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: '1px solid #E8EDF2', cursor: sharingInvoiceNo === inv.invoiceNo ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: sharingInvoiceNo === inv.invoiceNo ? '#CBD5E1' : '#0EA5E9' }}
                                      >
                                        <i className={sharingInvoiceNo === inv.invoiceNo ? "ti ti-loader-2" : "ti ti-send"}></i>
                                      </button>
                                      <button onClick={() => handleDeleteInvoice(inv)} style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: '1px solid #E8EDF2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#EF4444' }}><i className="ti ti-trash"></i></button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {activeTab === 'payments' && <>
                  {/* Table Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '40px 1.2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 100px', gap: 8, padding: '8px 18px', background: '#FAFBFD', borderBottom: '1px solid #E8EDF2' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>

                    </div>

                  </div>


                </>}
                {activeTab === 'payments' && <>
                  {/* ADVANCE PAYMENTS PANEL — only show when data exists */}
                  {(currProject.advances || []).length > 0 && (
                    <div style={{ background: '#fff', border: '1px solid #E8EDF2', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #E8EDF2' }}>
                        <i className="ti ti-pig-money" style={{ color: '#8B5CF6', fontSize: 15, marginRight: 8 }}></i>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#0D1B2A' }}>Advance Payments</span>
                        <span style={{ background: '#EDE9FE', color: '#7C3AED', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 20, marginLeft: 8 }}>{(currProject.advances || []).length}</span>
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                          <thead><tr style={{ background: '#F8FAFC' }}>{['Advance #', 'Description', 'Amount', 'Date', 'Status', 'Actions'].map(h => <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: '#7B8FA1', textTransform: 'uppercase', letterSpacing: '.7px', borderBottom: '1px solid #E8EDF2', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                          <tbody>
                            {(currProject.advances || []).map((rec, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 800, color: '#0D1B2A' }}>{rec.advanceNo || `ADV-00${i + 1}`}</td>
                                <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#374151' }}>{rec.description || '—'}</td>
                                <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: '#15803D' }}>{currency}{(rec.amount || 0).toLocaleString()}</td>
                                <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#2D3E50' }}>{rec.date ? new Date(rec.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                                <td style={{ padding: '12px 14px' }}><span style={{ background: rec.status === 'Paid' ? '#DCFCE7' : '#FEF3C7', color: rec.status === 'Paid' ? '#15803D' : '#B45309', borderRadius: 20, padding: '3px 9px', fontSize: 10, fontWeight: 800 }}>{rec.status || 'Pending'}</span></td>
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <button onClick={() => setPaymentModalsState(prev => ({ ...prev, showAdvance: true, editData: rec, editIndex: i }))} style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: '1px solid #E8EDF2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#7B8FA1' }}><i className="ti ti-edit"></i></button>
                                    <button onClick={() => handleDeleteRecord('advances', i)} style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: '1px solid #E8EDF2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#EF4444' }}><i className="ti ti-trash"></i></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ADDITIONAL CHARGES PANEL — only show when data exists */}
                  {(currProject.additionalCharges || []).length > 0 && (
                    <div style={{ background: '#fff', border: '1px solid #E8EDF2', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #E8EDF2' }}>
                        <i className="ti ti-circle-plus" style={{ color: '#F97316', fontSize: 15, marginRight: 8 }}></i>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#0D1B2A' }}>Additional Charges</span>
                        <span style={{ background: '#FFEDD5', color: '#C2410C', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 20, marginLeft: 8 }}>{(currProject.additionalCharges || []).length}</span>
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                          <thead><tr style={{ background: '#F8FAFC' }}>{['Charge #', 'Description', 'Amount', 'Date', 'Category', 'Status', 'Actions'].map(h => <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: '#7B8FA1', textTransform: 'uppercase', letterSpacing: '.7px', borderBottom: '1px solid #E8EDF2', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                          <tbody>
                            {(currProject.additionalCharges || []).map((rec, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', borderLeft: `3px solid ${rec.status === 'Paid' ? '#22C55E' : '#F59E0B'}` }}>
                                <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 800, color: '#0D1B2A' }}>{rec.chargeNo || `CHG-00${i + 1}`}</td>
                                <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#374151' }}>{rec.description || '—'}</td>
                                <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: '#15803D' }}>{currency}{(rec.amount || 0).toLocaleString()}</td>
                                <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#2D3E50' }}>{rec.date ? new Date(rec.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                                <td style={{ padding: '12px 14px' }}><span style={{ background: '#FFEDD5', color: '#C2410C', borderRadius: 20, padding: '3px 9px', fontSize: 10, fontWeight: 800 }}>{rec.category || 'Other'}</span></td>
                                <td style={{ padding: '12px 14px' }}><span style={{ background: rec.status === 'Paid' ? '#DCFCE7' : '#FEF3C7', color: rec.status === 'Paid' ? '#15803D' : '#B45309', borderRadius: 20, padding: '3px 9px', fontSize: 10, fontWeight: 800 }}>{rec.status || 'Pending'}</span></td>
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <button onClick={() => setPaymentModalsState(prev => ({ ...prev, showAdditional: true, editData: rec, editIndex: i }))} style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: '1px solid #E8EDF2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#7B8FA1' }}><i className="ti ti-edit"></i></button>
                                    <button onClick={() => handleDeleteRecord('additionalCharges', i)} style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: '1px solid #E8EDF2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#EF4444' }}><i className="ti ti-trash"></i></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* MILESTONE PAYMENTS PANEL — only show when data exists */}
                  {(currProject.milestonePayments || []).length > 0 && (
                    <div style={{ background: '#fff', border: '1px solid #E8EDF2', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #E8EDF2' }}>
                        <i className="ti ti-flag" style={{ color: '#F59E0B', fontSize: 15, marginRight: 8 }}></i>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#0D1B2A' }}>Milestone Payments</span>
                        <span style={{ background: '#FEF3C7', color: '#B45309', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 20, marginLeft: 8 }}>{(currProject.milestonePayments || []).length}</span>
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                          <thead><tr style={{ background: '#F8FAFC' }}>{['Milestone #', 'Name', 'Amount', 'Due Date', 'Status', 'Actions'].map(h => <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: '#7B8FA1', textTransform: 'uppercase', letterSpacing: '.7px', borderBottom: '1px solid #E8EDF2', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                          <tbody>
                            {(currProject.milestonePayments || []).map((rec, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 800, color: '#0D1B2A' }}>{rec.milestoneNo || `MIL-00${i + 1}`}</td>
                                <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#374151' }}>{rec.name || rec.description || '—'}</td>
                                <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: '#15803D' }}>{currency}{(rec.amount || 0).toLocaleString()}</td>
                                <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#2D3E50' }}>{(rec.dueDate || rec.date) ? new Date(rec.dueDate || rec.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                                <td style={{ padding: '12px 14px' }}><span style={{ background: rec.status === 'Paid' ? '#DCFCE7' : '#FEF3C7', color: rec.status === 'Paid' ? '#15803D' : '#B45309', borderRadius: 20, padding: '3px 9px', fontSize: 10, fontWeight: 800 }}>{rec.status || 'Pending'}</span></td>
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <button onClick={() => setPaymentModalsState(prev => ({ ...prev, showMilestonePayment: true, editData: rec, editIndex: i }))} style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: '1px solid #E8EDF2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#7B8FA1' }}><i className="ti ti-edit"></i></button>
                                    <button onClick={() => handleDeleteRecord('milestonePayments', i)} style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: '1px solid #E8EDF2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#EF4444' }}><i className="ti ti-trash"></i></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* PAYMENTS RECEIVED PANEL — only show when data exists */}
                  {(currProject.paymentsReceived || []).length > 0 && (
                    <div style={{ background: '#fff', border: '1px solid #E8EDF2', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #E8EDF2' }}>
                        <i className="ti ti-credit-card" style={{ color: '#22C55E', fontSize: 15, marginRight: 8 }}></i>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#0D1B2A' }}>Payments Received</span>
                        <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 20, marginLeft: 8 }}>{(currProject.paymentsReceived || []).length}</span>
                      </div>
                      {(currProject.paymentsReceived || []).length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                            <thead><tr style={{ background: '#F8FAFC' }}>{['Payment #', 'Linked Invoice', 'Amount', 'Due Date', 'Payment Date', 'Mode', 'Actions'].map(h => <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: '#7B8FA1', textTransform: 'uppercase', letterSpacing: '.7px', borderBottom: '1px solid #E8EDF2', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                            <tbody>
                              {(currProject.paymentsReceived || []).map((rec, i) => {
                                const localInvDueDate = (currProject.invoices || []).find(inv => inv.invoiceNo === rec.linkedInvoice)?.dueDate;
                                const globalInvDueDate = mergedInvoices.find(inv => inv.invoiceNo === rec.linkedInvoice)?.dueDate;
                                const effectiveDueDate = rec.dueDate || localInvDueDate || globalInvDueDate || null;
                                const isLate = effectiveDueDate && rec.paymentDate && new Date(rec.paymentDate) > new Date(effectiveDueDate);
                                return (
                                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 800, color: '#0D1B2A' }}>{rec.paymentNo || `PAY-00${i + 1}`}</td>
                                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: ' var(--app-accent, var(--app-accent, #00BCD4))' }}>{rec.linkedInvoice || '—'}</td>
                                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: '#15803D' }}>{currency}{(rec.amount || 0).toLocaleString()}</td>
                                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: isLate ? '#EF4444' : '#2D3E50' }}>
                                      {effectiveDueDate ? new Date(effectiveDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                      {isLate && <div style={{ fontSize: 9, fontWeight: 800, color: '#EF4444' }}>LATE</div>}
                                    </td>
                                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#2D3E50' }}>{rec.paymentDate ? new Date(rec.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                                    <td style={{ padding: '12px 14px', fontSize: 11, fontWeight: 800, color: '#475569' }}>{rec.paymentMode || '—'}</td>
                                    <td style={{ padding: '12px 14px' }}>
                                      <div style={{ display: 'flex', gap: 4 }}>
                                        <button onClick={() => setPaymentModalsState(prev => ({ ...prev, showPayment: true, editData: rec, editIndex: i }))} style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: '1px solid #E8EDF2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#7B8FA1' }}><i className="ti ti-edit"></i></button>
                                        <button onClick={() => handleDeleteRecord('paymentsReceived', i)} style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: '1px solid #E8EDF2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#EF4444' }}><i className="ti ti-trash"></i></button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* EXPENSES PANEL — only show when data exists */}
                  {(currProject.expenses || []).length > 0 && (
                    <div style={{ background: '#fff', border: '1px solid #E8EDF2', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #E8EDF2' }}>
                        <i className="ti ti-receipt" style={{ color: '#6B7280', fontSize: 15, marginRight: 8 }}></i>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#0D1B2A' }}>Expenses</span>
                        <span style={{ background: '#F3F4F6', color: '#374151', fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 20, marginLeft: 8 }}>{(currProject.expenses || []).length}</span>
                      </div>
                      {(currProject.expenses || []).length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                            <thead><tr style={{ background: '#F8FAFC' }}>{['Expense #', 'Description', 'Amount', 'Date', 'Category', 'Status', 'Actions'].map(h => <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 900, color: '#7B8FA1', textTransform: 'uppercase', letterSpacing: '.7px', borderBottom: '1px solid #E8EDF2', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                            <tbody>
                              {(currProject.expenses || []).map((rec, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', borderLeft: `3px solid ${rec.status === 'Paid' ? '#22C55E' : '#F59E0B'}` }}>
                                  <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 800, color: '#0D1B2A' }}>{rec.expenseNo || `EXP-00${i + 1}`}</td>
                                  <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#374151' }}>{rec.description || '—'}</td>
                                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: '#15803D' }}>{currency}{(rec.amount || 0).toLocaleString()}</td>
                                  <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#2D3E50' }}>{rec.date ? new Date(rec.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                                  <td style={{ padding: '12px 14px' }}><span style={{ background: '#FFEDD5', color: '#C2410C', borderRadius: 20, padding: '3px 9px', fontSize: 10, fontWeight: 800 }}>{rec.category || 'Other'}</span></td>
                                  <td style={{ padding: '12px 14px' }}><span style={{ background: rec.status === 'Paid' ? '#DCFCE7' : '#FEF3C7', color: rec.status === 'Paid' ? '#15803D' : '#B45309', borderRadius: 20, padding: '3px 9px', fontSize: 10, fontWeight: 800 }}>{rec.status || 'Pending'}</span></td>
                                  <td style={{ padding: '12px 14px' }}>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                      <button onClick={() => setPaymentModalsState(prev => ({ ...prev, showExpense: true, editData: rec, editIndex: i }))} style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: '1px solid #E8EDF2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#7B8FA1' }}><i className="ti ti-edit"></i></button>
                                      <button onClick={() => handleDeleteRecord('expenses', i)} style={{ width: 26, height: 26, borderRadius: 6, background: 'none', border: '1px solid #E8EDF2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#EF4444' }}><i className="ti ti-trash"></i></button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : null}

                    </div>
                  )}
                </>}
              </div>
            </div>{/* end tabContentRef wrapper */}
          </div>
        </div>{/* end mpd-grid-main-side */}

        {/* TEAM + BUDGET — side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'stretch' }}>
          {/* TEAM SIDEBAR */}
          <div className="mpd-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', maxHeight: 360 }}>
            <div className="mpd-card-header">
              <div className="mpd-card-title"><i className="ti ti-users"></i> Team</div>
              {!hideTopActions && (
                <button className="mpd-btn mpd-btn-outline" onClick={() => setShowAddMemberModal(true)} style={{ padding: '5px 10px', fontSize: 11 }}>
                  <i className="ti ti-plus"></i> Add
                </button>
              )}
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {assigned.length === 0 ? <div style={{ fontSize: 12, color: P.textLight }}>No team members assigned.</div> : null}
              {assigned.map((a, i) => (
                <div key={i} className="mpd-member-row" style={{ display: 'flex', alignItems: 'center' }}>
                  <div className="mpd-av mpd-av-sm" style={{ background: getAvatarColor(a) }}>{getInitials(a)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: P.textDark }}>{a}</div>
                    <div style={{ fontSize: 11, color: P.textLight }}>{employees.find(e => (e.name || e.employeeName) === a)?.role || 'Member'}</div>
                  </div>
                  {user?.role !== 'employee' && !hideTopActions && (
                    <button onClick={async () => {
                      if (!window.confirm('Remove ' + a + ' from team?')) return;
                      const updated = (currProject.assignedTo || []).filter((_, idx) => idx !== i);
                      await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, { assignedTo: updated });
                      try {
                        const tasksRes = await axios.get(`${BASE_URL}/api/tasks`, { headers: { 'x-company-id': currProject.companyId || '' } });
                        const allTasks = Array.isArray(tasksRes.data) ? tasksRes.data : [];
                        const projectTasks = allTasks.filter(t =>
                          (t.projectId === currProject._id || t.projectId?._id === currProject._id) &&
                          t.assignTo && t.assignTo !== 'Unassigned' &&
                          t.assignTo.split(', ').map(n => n.trim()).includes(a)
                        );
                        await Promise.all(projectTasks.map(t => {
                          const names = t.assignTo.split(', ').map(n => n.trim()).filter(Boolean);
                          const updatedNames = names.filter(n => n !== a);
                          return axios.put(`${BASE_URL}/api/tasks/${t._id}`, { assignTo: updatedNames.length > 0 ? updatedNames.join(', ') : 'Unassigned' }, { headers: { 'x-company-id': currProject.companyId || '' } });
                        }));
                      } catch (e) { console.error('Failed to unassign tasks:', e); }
                      loadLatest();
                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.red, fontSize: 14, padding: '4px 6px' }} title="Remove">Delete</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* BUDGET */}
          <div className="mpd-card" style={{ marginBottom: 0 }}>
            <div className="mpd-card-header">
              <div className="mpd-card-title"><i className="ti ti-wallet"></i> Budget</div>
            </div>
            {budgetExceeded && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
                <i className="ti ti-alert-triangle" style={{ color: '#DC2626', fontSize: 16 }}></i>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#DC2626' }}>Budget Exceeded!</div>
                  <div style={{ fontSize: 10, color: '#991B1B', fontWeight: 600 }}>Over by {currency}{overageAmt.toLocaleString()}</div>
                </div>
              </div>
            )}
            <div className="mpd-brow">
              <span className="mpd-lbl">Total Budget <span style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600, marginLeft: 4 }}>(auto)</span></span>
              <span className="mpd-val">{currency}{budgetAmt.toLocaleString()}</span>
            </div>
            {[['Billed', 'billed', billed, ''], ['Advance Paid', 'advance', autoAdvanceTotal, 'mpd-p'], ['Received', 'received', received, 'mpd-g']].map(([lbl, key, val, cls]) => (
              <div key={key} className="mpd-brow">
                <span className="mpd-lbl">{lbl}</span>
                <span className={`mpd-val ${cls}`}>{currency}{val.toLocaleString()}</span>
              </div>
            ))}
            <div className="mpd-brow">
              <span className="mpd-lbl">Pending</span>
              <span className="mpd-val mpd-r">{currency}{pending.toLocaleString()}</span>
            </div>
            <div className="mpd-brow">
              <span className="mpd-lbl">Spent (Expenses)</span>
              <span className="mpd-val" style={{ color: budgetExceeded ? '#DC2626' : undefined, fontWeight: budgetExceeded ? 800 : 700 }}>{currency}{spent.toLocaleString()}</span>
            </div>
            {budgetAmt > 0 && (
              <div className="mpd-brow">
                <span className="mpd-lbl">Remaining Budget</span>
                <span className="mpd-val" style={{ color: remaining < 0 ? '#DC2626' : '#7C3AED', fontWeight: 800 }}>
                  {remaining < 0 ? `-${currency}${Math.abs(remaining).toLocaleString()}` : `${currency}${remaining.toLocaleString()}`}
                </span>
              </div>
            )}
            {budgetAmt > 0 && (
              <div style={{ marginTop: 10 }}>
                <div className="mpd-progress-bg">
                  <div className="mpd-progress-fill" style={{ width: `${Math.min(budgetUsedPct, 100)}%`, background: budgetExceeded ? '#EF4444' : budgetUsedPct > 80 ? '#F97316' : '#8B5CF6' }}></div>
                </div>
                <div style={{ fontSize: 11, color: budgetExceeded ? '#DC2626' : P.textLight, marginTop: 4, fontWeight: budgetExceeded ? 800 : 600 }}>
                  {budgetUsedPct}% used · {currency}{spent.toLocaleString()} of {currency}{budgetAmt.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>

      </div >

      {previewProjectFile && (() => {
        const fname = (previewProjectFile.name || previewProjectFile.url || '').toLowerCase();
        const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/.test(fname) || (previewProjectFile.type || '').startsWith('image/');
        const isPdf = /\.pdf$/.test(fname) || (previewProjectFile.type || '').includes('pdf');
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99997, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setPreviewProjectFile(null)}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: P.radius, width: '100%', maxWidth: isPdf ? 900 : 640, maxHeight: '90vh', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: `linear-gradient(135deg,${P.primary},${P.primaryDark})`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{previewProjectFile.name}</span>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <a href={previewProjectFile.url} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className="ti ti-external-link"></i> Open
                  </a>
                  <button onClick={() => setPreviewProjectFile(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, width: 28, height: 28, cursor: 'pointer' }}>✕</button>
                </div>
              </div>
              <div style={{ flex: 1, overflow: 'auto', background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                {isImage ? (
                  <img src={previewProjectFile.url} alt={previewProjectFile.name} style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }} />
                ) : isPdf ? (
                  <iframe src={previewProjectFile.url} title={previewProjectFile.name} style={{ width: '100%', height: '80vh', border: 'none' }} />
                ) : (
                  <div style={{ padding: 40, textAlign: 'center' }}>
                    <i className="ti ti-file-text" style={{ fontSize: 40, color: P.primary }}></i>
                    <div style={{ fontSize: 13, fontWeight: 700, color: P.textDark, marginTop: 10 }}>Preview not available for this file type</div>
                    <div style={{ fontSize: 12, color: P.textLight, marginTop: 4 }}>Use "Open" above to view it in a new tab.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()
      }

      {/* Add Task Modal */} {
        showAddTaskModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99995, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: P.radius, width: 440, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 18, color: P.textDark }}>{editingTask ? 'Edit Task' : 'Add New Task'}</h3>
              <form onSubmit={handleCreateTask}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: P.textLight, marginBottom: 4 }}>Task Name *</label>
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
                    <input type="date" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: 8, border: `1.5px solid ${P.border}`, outline: 'none', boxSizing: 'border-box', background: '#fff', color: newTaskDue ? P.textDark : '#A0AEC0', fontFamily: 'Nunito, sans-serif', cursor: 'pointer' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: P.textLight, marginBottom: 4 }}>Status</label>
                    <select value={newTaskStatus} onChange={e => setNewTaskStatus(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1.5px solid ${P.border}`, outline: 'none', boxSizing: 'border-box' }}>
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: P.textLight, marginBottom: 4 }}>Link to Milestone *</label>
                    <select required value={newTaskMilestone} onChange={e => setNewTaskMilestone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1.5px solid ${P.border}`, outline: 'none', boxSizing: 'border-box' }}>
                      <option value="">-- Select Milestone --</option>
                      {(currProject.milestones || []).map((m, i) => (<option key={i} value={m.name}>{m.name}</option>))}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: P.textLight, marginBottom: 4 }}>Select Team Members</label>
                  <div style={{ width: '100%', maxHeight: 160, overflowY: 'auto', padding: '8px', borderRadius: 8, border: `1.5px solid ${P.border}`, boxSizing: 'border-box', background: '#fff' }}>
                    {(employees || [])
                      .filter(emp => assigned.includes(emp.name || emp.employeeName))
                      .map(emp => {
                        const name = emp.name || emp.employeeName || '';
                        if (!name) return null;
                        const checked = Array.isArray(newTaskAssignTo) && newTaskAssignTo.includes(name);
                        return (
                          <label key={emp._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', fontSize: 13, color: P.textDark, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setNewTaskAssignTo(prev => {
                                  const arr = Array.isArray(prev) ? prev : [];
                                  return checked ? arr.filter(n => n !== name) : [...arr, name];
                                });
                              }}
                            />
                            {name}{emp.role ? ` (${emp.role})` : ''}
                          </label>
                        );
                      })}
                    {(employees || []).filter(emp => assigned.includes(emp.name || emp.employeeName)).length === 0 && (
                      <div style={{ fontSize: 12, color: P.textLight, padding: '4px' }}>No employees assigned to this project.</div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: P.textLight, marginTop: 4 }}>Select one or more team members.</div>
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
              <div style={{ maxHeight: 220, overflowY: 'auto', border: `1.5px solid ${P.border}`, borderRadius: 8, padding: '8px 10px', marginBottom: 16 }}>
                {onAddEmployeeClick && (
                  <div
                    style={{ fontWeight: 700, color: P.purple, cursor: 'pointer', padding: '6px 4px', fontSize: 13 }}
                    onClick={() => { setShowAddMemberModal(false); onAddEmployeeClick(); }}
                  >
                    + Add Employee
                  </div>
                )}
                {(employees || []).filter(emp => !assigned.includes(emp.name || emp.employeeName)).map(emp => {
                  const name = emp.name || emp.employeeName;
                  const checked = selectedNewMember.includes(name);
                  return (
                    <label key={emp._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', fontSize: 13, color: P.textDark, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedNewMember(prev =>
                            checked ? prev.filter(n => n !== name) : [...prev, name]
                          );
                        }}
                      />
                      {name} ({emp.role || 'Employee'})
                    </label>
                  );
                })}
                {(employees || []).filter(emp => !assigned.includes(emp.name || emp.employeeName)).length === 0 && (
                  <div style={{ fontSize: 12, color: P.textLight, padding: '4px' }}>No employees available to add.</div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="mpd-btn mpd-btn-outline" onClick={() => { setShowAddMemberModal(false); setSelectedNewMember([]); }}>Cancel</button>
                <button className="mpd-btn mpd-btn-primary" disabled={selectedNewMember.length === 0} onClick={async () => {
                  if (selectedNewMember.length === 0) return;
                  const updated = [...(currProject.assignedTo || []), ...selectedNewMember];
                  await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, { assignedTo: updated });
                  setShowAddMemberModal(false);
                  setSelectedNewMember([]);
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
              <ModernEmployeeProjectDetails project={currProject} tasks={currTasks} user={{ role: 'client', name: currProject.client }} onBack={() => setShowPortalPreview(false)} onMessageTeam={() => { setShowPortalPreview(false); if (onMessageTeam) onMessageTeam(); }} />
            </div>
          </div>
        )
      }

      {/* Payment Modals */}
      <ProjectPaymentModals
        project={currProject}
        modalsState={paymentModalsState}
        setModalsState={(newState) => { setPaymentModalsState(newState); }}
        onSaveSuccess={(updatedFields) => { if (updatedFields) setCurrProject(prev => ({ ...prev, ...updatedFields })); loadLatest(); fetchProjectInvoices(); if (onUpdate) onUpdate(); }}
      />

      {/* Send to Client Popup */}
      {
        showSendPopup && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: 400, borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #E8EDF2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1B2A' }}>Send to Client Portal</div>
                <button onClick={() => setShowSendPopup(false)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#7B8FA1', cursor: 'pointer' }}>✕</button>
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
          const taxAmt = inv.taxType === 'inclusive' ? Math.round((inv.amount || 0) - (inv.amount || 0) / (1 + (inv.taxPercent || 0) / 100)) : Math.round((inv.amount || 0) * (inv.taxPercent || 0) / 100);
          const subtotal = inv.taxType === 'inclusive' ? Math.round((inv.amount || 0) / (1 + (inv.taxPercent || 0) / 100)) : (inv.amount || 0);
          const total = inv.taxType === 'inclusive' ? (inv.amount || 0) : (inv.amount || 0) + taxAmt;
          const s = (inv.status || '').toLowerCase();
          const statusColor = s === 'paid' ? '#22C55E' : s === 'overdue' ? '#EF4444' : s === 'sent' ? '#3B82F6' : s === 'pending' ? '#F59E0B' : '#94A3B8';
          const statusBg = s === 'paid' ? '#DCFCE7' : s === 'overdue' ? '#FEE2E2' : s === 'sent' ? '#DBEAFE' : s === 'pending' ? '#FEF3C7' : '#F1F5F9';
          return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '30px 16px' }}>
              <div style={{ background: '#fff', width: '100%', maxWidth: 640, borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', fontFamily: 'Arial,sans-serif', overflow: 'hidden' }}>
                <div style={{ background: '#1A2332', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className="ti ti-file-invoice" style={{ color: ' var(--app-accent, var(--app-accent, #00BCD4))', fontSize: 18 }}></i>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>Invoice Preview — {inv.invoiceNo}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setPreviewInvoice(null); setPaymentModalsState(prev => ({ ...prev, showNewInvoice: true, editData: inv, editIndex: (currProject.invoices || []).findIndex(i => i.invoiceNo === inv.invoiceNo) })); }} style={{ padding: '6px 14px', background: '#fff', color: '#374151', border: '1px solid #E8EDF2', borderRadius: 7, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}><i className="ti ti-edit"></i> Edit</button>
                    <button onClick={() => { handleDeleteInvoice(inv); setPreviewInvoice(null); }} style={{ padding: '6px 14px', background: '#FEE2E2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: 7, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}><i className="ti ti-trash"></i> Delete</button>
                    <button onClick={() => window.print()} style={{ padding: '6px 14px', background: ' var(--app-accent, var(--app-accent, #00BCD4))', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}><i className="ti ti-printer"></i> Print / PDF</button>
                    <button onClick={() => setPreviewInvoice(null)} style={{ padding: '6px 14px', background: '#374151', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
                <div id="invoice-print-area" style={{ padding: '36px 40px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                    <div>
                      {user?.logoUrl ? (<img src={user.logoUrl} alt="Logo" style={{ height: 70, borderRadius: 12, marginBottom: 12, objectFit: 'contain' }} />) : (<div style={{ width: 60, height: 60, borderRadius: 12, background: 'linear-gradient(135deg, var(--app-accent, var(--app-accent, #00BCD4)),#0097A7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><span style={{ color: '#fff', fontWeight: 900, fontSize: 24 }}>{(user?.companyName || 'Y')[0].toUpperCase()}</span></div>)}
                      <div style={{ fontWeight: 900, fontSize: 20, color: '#0f1c2e', letterSpacing: '1px', textTransform: 'uppercase' }}>{user?.companyName || 'YOUR COMPANY'}</div>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4, lineHeight: 1.7 }}>{user?.email}<br />{user?.phone}<br />{user?.address}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 32, fontWeight: 900, color: 'rgba(0,188,212,0.1)', letterSpacing: '-1px', marginBottom: 4 }}>INVOICE</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: ' var(--app-accent, var(--app-accent, #00BCD4))' }}>{inv.invoiceNo}</div>
                      <div style={{ display: 'flex', gap: 20, marginTop: 14, justifyContent: 'flex-end' }}>
                        <div style={{ textAlign: 'right' }}><div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 3 }}>Date</div><div style={{ fontSize: 12, fontWeight: 700, color: '#0f1c2e' }}>{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div></div>
                        <div style={{ textAlign: 'right' }}><div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 3 }}>Due Date</div><div style={{ fontSize: 12, fontWeight: 700, color: '#ea580c' }}>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div></div>
                      </div>
                      {inv.status && inv.status.toLowerCase() !== 'draft' && (<div style={{ marginTop: 12, textAlign: 'right' }}><span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: statusBg, color: statusColor, fontSize: 11, fontWeight: 800, border: `1.5px solid ${statusColor}`, letterSpacing: 1 }}>{inv.status.charAt(0).toUpperCase() + inv.status.slice(1).toLowerCase()}</span></div>)}
                      <div style={{ marginTop: 24 }}><div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'right', marginBottom: 6 }}>Project</div><div style={{ fontSize: 14, fontWeight: 800, color: '#0f1c2e', textAlign: 'right' }}>{inv.projectName || currProject.name}</div></div>
                    </div>
                  </div>
                  <div style={{ borderBottom: '2px solid #E8EDF2', paddingBottom: 20, marginBottom: 20 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 10 }}>Bill To</div>
                    <div style={{ fontWeight: 800, fontSize: 17, color: '#0f1c2e' }}>{inv.clientName || clientName}</div>
                    <div style={{ fontSize: 13, color: ' var(--app-accent, var(--app-accent, #00BCD4))', fontWeight: 600, marginTop: 2 }}>{inv.clientName || clientName}</div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                    <thead><tr style={{ background: '#f8fafc' }}>{['#', 'Description', 'Qty', 'Unit Rate', 'Tax Rate', 'Amount'].map(h => (<th key={h} style={{ padding: '9px 11px', textAlign: h === 'Amount' || h === 'Unit Rate' || h === 'Qty' || h === 'Tax Rate' ? 'right' : 'left', fontSize: 9, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5, borderBottom: '2px solid #E8EDF2' }}>{h}</th>))}</tr></thead>
                    <tbody><tr style={{ borderBottom: '1px solid #E8EDF2' }}><td style={{ padding: '12px 11px', fontSize: 12, color: '#64748b', fontWeight: 700 }}>01</td><td style={{ padding: '12px 11px', fontSize: 13, color: '#0f1c2e', fontWeight: 600 }}>{inv.description || 'Service'}</td><td style={{ padding: '12px 11px', fontSize: 13, color: '#374151', textAlign: 'right' }}>1</td><td style={{ padding: '12px 11px', fontSize: 13, color: '#374151', textAlign: 'right' }}>{currency}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td style={{ padding: '12px 11px', fontSize: 13, color: '#6b7280', textAlign: 'right' }}>{inv.taxPercent || 0}%</td><td style={{ padding: '12px 11px', fontSize: 14, color: '#0f1c2e', textAlign: 'right', fontWeight: 700 }}>{currency}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr></tbody>
                  </table>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
                    <div style={{ width: 200 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 10, borderBottom: '1px solid #E8EDF2' }}><span style={{ color: '#64748b' }}>Subtotal</span><span style={{ fontWeight: 700 }}>{currency}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 10, borderBottom: '1px solid #E8EDF2' }}><span style={{ color: '#64748b' }}>GST / Tax</span><span style={{ fontWeight: 700 }}>{currency}{taxAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#0f1c2e', borderRadius: 6, marginTop: 4, color: '#fff' }}><span style={{ fontSize: 10, fontWeight: 800 }}>Balance Due</span><span style={{ fontSize: 12, fontWeight: 900 }}>{currency}{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                    </div>
                  </div>
                  {inv.notes && (<div style={{ borderTop: '1px solid #E8EDF2', paddingTop: 14 }}><div style={{ fontSize: 8, fontWeight: 700, color: ' var(--app-accent, var(--app-accent, #00BCD4))', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 2 }}>Notes</div><div style={{ fontSize: 8, color: '#64748b', lineHeight: 1.5 }}>{inv.notes}</div></div>)}
                </div>
                <div style={{ borderTop: '1px solid #E8EDF2', padding: '10px 40px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{inv.invoiceNo}</div>
                  <div style={{ position: 'relative' }}>
                    {(() => {
                      const st = (inv.status || '').toLowerCase();
                      const cfg = st === 'paid' ? { label: 'Paid', bg: '#DCFCE7', color: '#15803D', icon: '' } : st === 'overdue' ? { label: 'Overdue', bg: '#FEE2E2', color: '#DC2626', icon: '' } : st === 'sent' ? { label: 'Sent', bg: '#DBEAFE', color: '#1D4ED8', icon: '' } : { label: 'Pending', bg: '#FEF3C7', color: '#B45309', icon: '' };
                      return (
                        <>
                          <span onClick={() => setShowStatusDropdown(prev => !prev)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 14px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 800, border: `1.5px solid ${cfg.color}`, cursor: 'pointer', userSelect: 'none' }}>{cfg.icon} {cfg.label} <span style={{ fontSize: 10 }}>▼</span></span>
                          {showStatusDropdown && (
                            <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: '#fff', border: '1px solid #E8EDF2', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: 150, overflow: 'hidden' }}>
                              {[{ label: 'Pending', color: '#B45309', bg: '#FEF3C7', icon: '' }, { label: 'Paid', color: '#15803D', bg: '#DCFCE7', icon: '' }, { label: 'Overdue', color: '#DC2626', bg: '#FEE2E2', icon: '' }, { label: 'Sent', color: '#1D4ED8', bg: '#DBEAFE', icon: '' }].map(opt => (
                                <div key={opt.label} onClick={async () => { const updatedInvoices = (currProject.invoices || []).map(x => x.invoiceNo === inv.invoiceNo ? { ...x, status: opt.label } : x); await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, { invoices: updatedInvoices }); setShowStatusDropdown(false); setPreviewInvoice(prev => ({ ...prev, status: opt.label })); loadLatest(); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', cursor: 'pointer', background: st === opt.label.toLowerCase() ? opt.bg : '#fff', borderBottom: '1px solid #F3F4F6' }} onMouseEnter={e => e.currentTarget.style.background = opt.bg} onMouseLeave={e => e.currentTarget.style.background = st === opt.label.toLowerCase() ? opt.bg : '#fff'}>
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
              <div style={{ background: `linear-gradient(135deg,${P.primary},${P.primaryDark})`, padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="ti ti-upload" style={{ color: '#fff', fontSize: 18 }}></i>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>Upload File</span>
                </div>
                <button
                  onClick={() => { setShowUploadModal(false); setUploadFiles([]); setUploadFileError(''); setUploadShareError(''); setUploadHeading(''); setUploadDescription(''); setUploadSendToClient(false); setUploadSendToEmployee(false); setUploadSendForApproval(false); setPostUpdateOnUpload(false); }}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: '22px 24px', maxHeight: '80vh', overflowY: 'auto' }}>
                <div onClick={() => document.getElementById('modal-file-input').click()} style={{ border: `2px dashed ${uploadFiles.length > 0 ? P.primary : (uploadFileError ? '#EF4444' : P.border)}`, borderRadius: 10, padding: '22px 16px', textAlign: 'center', cursor: 'pointer', marginBottom: uploadFiles.length > 0 ? 8 : 4, background: uploadFiles.length > 0 ? P.primaryLight : P.bg, transition: 'all .2s' }}>
                  <i className={`ti ${uploadFiles.length > 0 ? 'ti-file-check' : 'ti-cloud-upload'}`} style={{ fontSize: 28, color: uploadFiles.length > 0 ? P.green : P.textLight, display: 'block', marginBottom: 6 }}></i>
                  {uploadFiles.length > 0 ? (
                    <div><div style={{ fontSize: 13, fontWeight: 700, color: P.textDark }}>{uploadFiles.length} file{uploadFiles.length > 1 ? 's' : ''} selected</div><div style={{ fontSize: 11, color: P.textLight, marginTop: 3 }}>Click to add more files</div></div>
                  ) : (
                    <div><div style={{ fontSize: 13, fontWeight: 700, color: P.textDark }}>Click to browse or drag & drop</div><div style={{ fontSize: 11, color: P.textLight, marginTop: 3 }}>Images, PDFs, Docs supported · multiple files allowed</div></div>
                  )}
                </div>
                <input id="modal-file-input" type="file" multiple onChange={handleModalFileSelect} style={{ display: 'none' }} />
                {uploadFiles.length > 0 && (
                  <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {uploadFiles.map((f, idx) => (
                      <div key={`${f.name}-${idx}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '7px 10px', borderRadius: 8, background: P.bg, border: `1px solid ${P.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <i className="ti ti-file" style={{ fontSize: 14, color: P.primary, flexShrink: 0 }}></i>
                          <span style={{ fontSize: 12, fontWeight: 600, color: P.textDark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
                          <span style={{ fontSize: 11, color: P.textLight, flexShrink: 0 }}>({(f.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button type="button" onClick={() => handleRemoveUploadFile(idx)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 14, padding: 2, flexShrink: 0 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                {uploadFileError && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', marginBottom: 14, marginTop: -2, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className="ti ti-alert-circle" style={{ fontSize: 13 }}></i>{uploadFileError}
                  </div>
                )}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: P.textLight, textTransform: 'uppercase', letterSpacing: '.7px', display: 'block', marginBottom: 5 }}>File Heading</label>
                  <input type="text" value={uploadHeading} onChange={e => setUploadHeading(e.target.value)} placeholder="e.g. Design Mockup v2" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${P.border}`, fontSize: 13, fontFamily: 'Nunito,sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: P.textLight, textTransform: 'uppercase', letterSpacing: '.7px', display: 'block', marginBottom: 5 }}>Description</label>
                  <textarea value={uploadDescription} onChange={e => setUploadDescription(e.target.value)} placeholder="Brief description of this file..." rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${P.border}`, fontSize: 13, fontFamily: 'Nunito,sans-serif', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: P.textLight, textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 10 }}>Share With</div>

                <div style={{ border: `1.5px solid ${uploadSendToEmployee ? P.purple : P.border}`, borderRadius: 10, padding: '12px 14px', marginBottom: 10, background: uploadSendToEmployee ? P.purpleLight : '#fff', transition: 'all .15s' }}>
                  <div onClick={() => { const newVal = !uploadSendToEmployee; setUploadSendToEmployee(newVal); setUploadEmployeeName(''); if (newVal || uploadSendToClient) setUploadShareError(''); }} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>

                    <i className="ti ti-users" style={{ color: P.purple, fontSize: 16 }}></i>
                    <span style={{ fontSize: 13, fontWeight: 700, color: P.textDark }}>Send to Employee Portal</span>
                  </div>
                  {uploadSendToEmployee && (
                    <div style={{ position: 'relative', marginTop: 10 }}>
                      <div
                        onClick={() => setShowUploadEmpDropdown(v => !v)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${P.purple}`, fontSize: 13, fontFamily: 'Nunito,sans-serif', background: '#fff', color: uploadEmployeeName.length ? P.textDark : P.textLight, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {uploadEmployeeName.length === 0 ? '-- Select Employees --' : uploadEmployeeName.join(', ')}
                        </span>
                        <i className={`ti ${showUploadEmpDropdown ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 14, flexShrink: 0, marginLeft: 8 }} />
                      </div>
                      {showUploadEmpDropdown && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', border: `1.5px solid ${P.purple}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 20, maxHeight: 200, overflowY: 'auto' }}>
                          {(employees || []).filter(emp => assigned.includes(emp.name || emp.employeeName)).length === 0 && (
                            <div style={{ padding: '10px 12px', fontSize: 12, color: P.textLight }}>No employees assigned to this project.</div>
                          )}
                          {(employees || []).filter(emp => assigned.includes(emp.name || emp.employeeName)).map(emp => {
                            const name = emp.name || emp.employeeName || '';
                            const checked = uploadEmployeeName.includes(name);
                            return (
                              <label key={emp._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 13, color: P.textDark, cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    setUploadEmployeeName(prev => checked ? prev.filter(n => n !== name) : [...prev, name]);
                                  }}
                                />
                                {name}{emp.role ? ` (${emp.role})` : ''}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {uploadShareError && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', marginBottom: 14, marginTop: -4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className="ti ti-alert-circle" style={{ fontSize: 13 }}></i>{uploadShareError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { setShowUploadModal(false); setUploadFiles([]); setUploadFileError(''); setUploadShareError(''); setUploadHeading(''); setUploadDescription(''); setUploadSendToClient(false); setUploadSendToEmployee(false); setUploadSendForApproval(false); setPostUpdateOnUpload(false); }} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1.5px solid ${P.border}`, background: 'transparent', color: P.textMid, fontFamily: 'Nunito,sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Draft</button>
                  <button
                    onClick={() => {
                      let hasError = false;
                      if (uploadFiles.length === 0) { setUploadFileError('Please select at least one file to upload.'); hasError = true; } else { setUploadFileError(''); }
                      if (!uploadSendToClient && !uploadSendToEmployee) { setUploadShareError('Please choose to share with Client Portal or Employee Portal.'); hasError = true; } else { setUploadShareError(''); }
                      if (hasError) return;
                      (uploadSendForApproval ? handleSendFileForApproval : handleModalUpload)();
                    }}
                    disabled={uploadingModal || sendingFileApproval}
                    style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: (uploadingModal || sendingFileApproval) ? P.border : P.primary, color: (uploadingModal || sendingFileApproval) ? P.textLight : '#fff', fontFamily: 'Nunito,sans-serif', fontSize: 13, fontWeight: 800, cursor: (uploadingModal || sendingFileApproval) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <i className={`ti ${uploadSendForApproval ? 'ti-send' : 'ti-upload'}`} style={{ fontSize: 15 }}></i>
                    {uploadSendForApproval
                      ? (sendingFileApproval ? 'Sending...' : 'Send for Approval')
                      : (uploadingModal ? 'Uploading...' : postUpdateOnUpload ? 'Post Update' : 'Upload & Share')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </>
  )
}