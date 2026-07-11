import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';
import AddClientView from './AddClientView';
// ── Shared Colors ──
const P = {
  primary: ' var(--app-accent, var(--app-accent, #00BCD4))', primaryDark: '#0097A7', primaryLight: 'var(--teal-light, var(--teal-light, #E0F7FA))', primaryMid: '#B2EBF2',
  textDark: '#1A2332', textMid: '#4A5568', textLight: '#718096',
  bg: '#F0F4F8', white: '#FFFFFF', border: '#E2E8F0',
  green: '#26C281', greenLight: '#D1FAE5', orange: '#F59E0B', orangeLight: '#FEF3C7',
  red: '#FF6B6B', redLight: '#FEE2E2', purple: '#8B5CF6', purpleLight: '#EDE9FE',
};

const CSS = `
.mpc-root { font-family:'Nunito',sans-serif; background:var(--bg); min-height:0; padding:0; box-sizing:border-box; }
.mpc-root * { box-sizing:border-box; }
.mpc-create-layout { display:grid; grid-template-columns:1fr 340px; gap:24px; align-items:start; }

/* STEP BAR */
.mpc-step-bar { display:flex; align-items:center; gap:0; margin-bottom:26px; }
.mpc-step { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:700; color:${P.textLight}; transition:all .2s; }
.mpc-step-num { width:28px; height:28px; border-radius:50%; border:2px solid ${P.border}; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; flex-shrink:0; transition:all .2s; }
.mpc-step.done .mpc-step-num { background:${P.green}; border-color:${P.green}; color:#fff; }
.mpc-step.active .mpc-step-num { background:${P.primary}; border-color:${P.primary}; color:#fff; }
.mpc-step.active { color:${P.textDark}; }
.mpc-step-line { flex:1; height:2px; background:${P.border}; margin:0 8px; transition:all .2s; }
.mpc-step-line.done { background:${P.green}; }

/* CARDS */
.mpc-section-card { background:#fff; border-radius:16px; box-shadow:0 2px 12px rgba(0,188,212,.08); padding:24px; margin-bottom:20px; border:1px solid #f1f5f9; }
.mpc-section-heading { font-size:16px; font-weight:800; color:${P.textDark}; display:flex; align-items:center; gap:8px; margin-bottom:20px; padding-bottom:14px; border-bottom:1px solid ${P.border}; }
.mpc-section-heading i { color:${P.primary}; font-size:20px; }

/* FORMS */
.mpc-form-group { margin-bottom:18px; }
.mpc-form-group label { display:block; font-size:11px; font-weight:800; color:${P.textMid}; text-transform:uppercase; letter-spacing:.7px; margin-bottom:6px; }
.mpc-form-group input, .mpc-form-group select, .mpc-form-group textarea { width:100%; padding:11px 14px; border:1.5px solid ${P.border}; border-radius:10px; font-family:'Nunito',sans-serif; font-size:14px; color:${P.textDark}; background:${P.bg}; outline:none; transition:border .15s; }
.mpc-form-group input:focus, .mpc-form-group select:focus, .mpc-form-group textarea:focus { border-color:${P.primary}; background:#fff; }
.mpc-form-group textarea { resize:vertical; min-height:90px; line-height:1.6; }
.mpc-form-2col { display:grid; grid-template-columns:1fr 1fr; gap:16px; }

/* TEAM */
.mpc-team-selector { display:flex; flex-direction:column; gap:10px; max-height: 300px; overflow-y: auto; padding-right: 4px; }
.mpc-team-row { display:flex; align-items:center; gap:12px; padding:10px 14px; border-radius:12px; border:1.5px solid ${P.border}; background:${P.bg}; cursor:pointer; transition:all .15s; user-select:none; }
.mpc-team-row:hover { border-color:${P.primaryMid}; }
.mpc-team-row.selected { border-color:${P.primary}; background:${P.primaryLight}; }
.mpc-role-badge { font-size:10px; font-weight:800; background:#fff; border:1px solid ${P.border}; border-radius:20px; padding:3px 10px; color:${P.textMid}; margin-left:auto; }
.mpc-team-row.selected .mpc-role-badge { background:${P.primary}; border-color:${P.primary}; color:#fff; }
.mpc-av { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; color:#fff; flex-shrink:0; }

/* MILESTONES */
.mpc-milestone-list { display:flex; flex-direction:column; gap:10px; }
.mpc-milestone-row { display:grid; grid-template-columns:1fr auto auto; gap:12px; align-items:center; background:${P.bg}; border-radius:12px; padding:12px 14px; border:1.5px solid ${P.border}; }
.mpc-milestone-row input { border:none; background:transparent; font-family:'Nunito',sans-serif; font-size:14px; font-weight:700; color:${P.textDark}; outline:none; box-shadow:none; width:100%; padding:0; }
.mpc-milestone-row input:focus { outline:none !important; box-shadow:none !important; }
.mpc-milestone-row select { border-radius:10px; border:1.5px solid ${P.border}; background:#fff; }
.mpc-milestone-row input[type="text"] { border-radius:10px; border:1.5px solid ${P.border}; background:#fff; }
.mpc-milestone-row input[type="date"] { font-size:13px; color:${P.textMid}; font-weight:600; background:#fff; border:1.5px solid ${P.border}; border-radius:10px; padding:6px 10px; width:160px; cursor:pointer; }
.mpc-milestone-row input[type="date"]:focus { border-color:${P.primary}; outline:none; }
.mpc-remove-ms { color:${P.textLight}; cursor:pointer; font-size:18px; padding:4px; display:flex; align-items:center; transition:color .15s; }
.mpc-remove-ms:hover { color:${P.red}; }

/* BUDGET SPLIT */
.mpc-budget-split { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:16px; }
.mpc-bs-item { background:${P.bg}; border-radius:12px; padding:14px 12px; border:1.5px solid ${P.border}; text-align:center; }
.mpc-bs-item label { font-size:10px; font-weight:800; color:${P.textLight}; text-transform:uppercase; letter-spacing:.6px; display:block; margin-bottom:8px; }
.mpc-bs-item input { width:100%; border:none; background:transparent; font-family:'Nunito',sans-serif; font-size:18px; font-weight:800; color:${P.primary}; text-align:center; outline:none; padding:0; }

/* PREVIEW */
.mpc-preview-card { background:#fff; border-radius:16px; box-shadow:0 8px 32px rgba(0,188,212,.08); padding:24px; position:sticky; top:80px; border:1px solid #f1f5f9; }
.mpc-preview-card h3 { font-size:16px; font-weight:800; color:${P.textDark}; margin-bottom:20px; display:flex; align-items:center; gap:8px; }
.mpc-preview-card h3 i { color:${P.primary}; font-size:20px; }
.mpc-pv-row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed ${P.border}; font-size:13px; }
.mpc-pv-row:last-of-type { border-bottom:none; margin-bottom:16px; }
.mpc-pv-label { color:${P.textLight}; font-weight:600; }
.mpc-pv-val { font-weight:800; color:${P.textDark}; text-align:right; }
.mpc-checklist { display:flex; flex-direction:column; gap:8px; }
.mpc-cl-item { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:700; color:${P.textMid}; }
.mpc-cl-item i { font-size:18px; }
.mpc-cl-item.ok { color:${P.green}; }
.mpc-cl-item.ok i { color:${P.green}; }
.mpc-cl-item.pending i { color:${P.textLight}; }

/* ACTION BAR */
.mpc-action-bar { background:#fff; border-top:1px solid ${P.border}; padding:16px 26px; display:flex; align-items:center; justify-content:space-between; position:sticky; bottom:0; z-index:40; box-shadow:0 -4px 20px rgba(0,0,0,.03); margin: 0 -26px -26px -26px; border-radius:0 0 16px 16px; }
.mpc-btn { display:inline-flex; align-items:center; gap:8px; padding:10px 20px; border-radius:10px; font-family:'Nunito',sans-serif; font-size:14px; font-weight:800; cursor:pointer; border:none; transition:all .15s; }
.mpc-btn-primary { background:${P.primary}; color:#fff; box-shadow:0 4px 12px rgba(0,188,212,.2); }
.mpc-btn-primary:hover { background:${P.primaryDark}; transform:translateY(-1px); }
.mpc-btn-outline { background:transparent; border:1.5px solid ${P.border}; color:${P.textMid}; }
.mpc-btn-outline:hover { border-color:${P.primary}; color:${P.primary}; background:${P.primaryLight}; }

/* Custom Checkbox */
.mpc-checkbox-label { display:flex; align-items:center; gap:10px; cursor:pointer; font-size:13px; font-weight:700; color:${P.textMid}; user-select:none; }
.mpc-checkbox-label input { accent-color:${P.primary}; width:16px; height:16px; cursor:pointer; }
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
export default function ModernProjectCreator({ onBack, clients = [], employees = [], onSuccess, editProject, prefillClient, onAddEmployeeClick }) {
  const [loading, setLoading] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({}); // { name: true, client: true }
  const nameRef = useRef(null);
  const clientRef = useRef(null);

  // Form State
  const [name, setName] = useState(editProject?.name || '');
  const [description, setDescription] = useState(editProject?.description || editProject?.purpose || '');
  const [client, setClient] = useState(editProject?.client || prefillClient?.clientName || prefillClient?.name || '');
  // The project's client is otherwise only ever saved as a NAME string, which
  // is how "Open Portal" ends up resolving to the wrong client whenever two
  // clients share a name (or the match is ambiguous) — it has no reliable ID
  // to go on. This tracks the actual client _id selected in the dropdown so
  // it can be saved on the project and used for an exact, unambiguous match.
  const [clientId, setClientId] = useState(editProject?.clientId || prefillClient?._id || '');
  const [category, setCategory] = useState(editProject?.category || 'Web Development');
  const [priority, setPriority] = useState(editProject?.priority || 'medium');
  const [status, setStatus] = useState(editProject?.status || 'Active');
  const [progress, setProgress] = useState(editProject?.progress || 0);

  const safeDate = (d) => { try { return d ? new Date(d).toISOString().split('T')[0] : ''; } catch { return ''; } };
  const [start, setStart] = useState(safeDate(editProject?.start) || new Date().toISOString().split('T')[0]);
  const [end, setEnd] = useState(safeDate(editProject?.end) || safeDate(editProject?.deadline) || '');
  const [assigned, setAssigned] = useState(() => {
    const a = editProject?.assignedTo;
    if (!a) return [];
    if (Array.isArray(a)) return a.map(x => typeof x === 'object' ? (x.name || x.employeeName || '') : String(x)).filter(Boolean);
    return [String(a)];
  });
  const [budget, setBudget] = useState(editProject?.budget || '');
  const [currency, setCurrency] = useState(editProject?.currency || '₹');

  useEffect(() => {
    if (editProject) {
      setBudget(editProject.budget ?? '');
      setCurrency(editProject.currency || '₹');
      setBilled(editProject.billed ?? '');
      setReceived(editProject.received ?? '');
    }
  }, [editProject?._id, editProject?.id]);
  const [contactPersonName, setContactPersonName] = useState(editProject?.contactPersonName || prefillClient?.contactPersonName || '');
  const [contactPersonNo, setContactPersonNo] = useState(editProject?.contactPersonNo || prefillClient?.contactPersonNo || prefillClient?.phone || '');
  const [contactEmail, setContactEmail] = useState(editProject?.contactEmail || editProject?.clientEmail || prefillClient?.email || '');
  const [companyName, setCompanyName] = useState(editProject?.companyName || prefillClient?.companyName || prefillClient?.company || '');
  const [clientPhone, setClientPhone] = useState(editProject?.phone || prefillClient?.phone || '');
  const [clientAddress, setClientAddress] = useState(editProject?.address || prefillClient?.address || '');
  const [billed, setBilled] = useState(editProject?.billed || '');
  const [received, setReceived] = useState(editProject?.received || '');
  const [pending, setPending] = useState(editProject?.pending || '');
  const [spent, setSpent] = useState(editProject?.spent || '');

  const defaultPortalOpts = {
    enablePortal: true,
    showProgress: true,
    showMilestones: true,
    showTeam: false,
    allowMessages: true,
  };

  const normalizeMilestones = (list) => {
    if (!Array.isArray(list) || list.length === 0) {
      return [];
    }
    return list.map(m => ({
      name: m?.name || '',
      date: safeDate(m?.date),
      isCustom: m?.name ? !MILESTONE_OPTIONS.includes(m.name) : false,
    }));
  };

  const [milestones, setMilestones] = useState(() => normalizeMilestones(editProject?.milestones));
  const [customMilestoneOptions, setCustomMilestoneOptions] = useState(() => MILESTONE_OPTIONS);

  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [selectedEmpToAdd, setSelectedEmpToAdd] = useState('');
  const [showQuickAddEmployee, setShowQuickAddEmployee] = useState(false);
  const [quickEmpName, setQuickEmpName] = useState('');
  const [quickEmpEmail, setQuickEmpEmail] = useState('');
  const [quickEmpPassword, setQuickEmpPassword] = useState('');
  const [quickEmpRole, setQuickEmpRole] = useState('');
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const [localEmployees, setLocalEmployees] = useState(employees);

  useEffect(() => { setLocalEmployees(employees); }, [employees]);

  const handleQuickAddEmployee = async () => {
    if (!quickEmpName.trim() || !quickEmpEmail.trim() || !quickEmpPassword.trim()) {
      return alert('Name, Email and Password are required.');
    }
    if (quickEmpPassword.trim().length < 4) {
      return alert('Password must be at least 4 characters.');
    }
    setQuickAddSaving(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await axios.post(`${BASE_URL}/api/employees/add`, {
        name: quickEmpName.trim(),
        email: quickEmpEmail.trim(),
        password: quickEmpPassword.trim(),
        role: quickEmpRole.trim() || 'Employee',
        companyId: currentUser.companyId || ''
      });
      const newEmp = res.data.employee;
      setLocalEmployees(prev => [newEmp, ...prev]);
      setSelectedEmpToAdd(newEmp.name || newEmp.employeeName || '');
      setShowQuickAddEmployee(false);
      setQuickEmpName(''); setQuickEmpEmail(''); setQuickEmpPassword(''); setQuickEmpRole('');
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to add employee');
    } finally {
      setQuickAddSaving(false);
    }
  };
  const [portalOpts, setPortalOpts] = useState(() => {
    const ps = editProject?.portalSettings || editProject?.portalOpts;
    if (!ps || typeof ps !== 'object') return { ...defaultPortalOpts };
    return { ...defaultPortalOpts, ...ps };
  });

  // Auto-calculate pending = billed - received
  useEffect(() => {
    const b = Number(billed) || 0;
    const r = Number(received) || 0;
    const calc = b - r;
    setPending(calc >= 0 ? String(calc) : '0');
  }, [billed, received]);

  // Calculate Progress Steps dynamically
  let currentStep = 1;
  if (name && client) currentStep = 2;
  if (name && client && (assigned.length > 0 || end)) currentStep = 3;
  if (name && client && budget) currentStep = 4;

  const toggleMember = (empName) => {
    if (assigned.includes(empName)) {
      setAssigned(assigned.filter(n => n !== empName));
    } else {
      setAssigned([...assigned, empName]);
    }
  };

  const addMilestone = () => {
    setMilestones([...milestones, { name: '', date: '', isCustom: false }]);
  };

  const updateMilestone = (idx, field, val) => {
    const arr = [...milestones];
    arr[idx][field] = val;
    setMilestones(arr);
  };

  const removeMilestone = (idx) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  const handleCreate = async () => {
    const errors = {};
    if (!name.trim()) errors.name = true;
    if (!client) errors.client = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const refMap = { name: nameRef, client: clientRef };
      const firstKey = Object.keys(errors)[0];
      const firstRef = refMap[firstKey];
      if (firstRef?.current) {
        firstRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstRef.current.focus();
      }
      toast.error(firstKey === 'name' ? "Project Name is required." : "Client is required.");
      return;
    }
    setFieldErrors({});
    const isEdit = !!editProject;

    setLoading(true);
    try {
      const payload = {
        name,
        description,
        client,
        clientId: clientId || null,
        contactPersonName,
        contactPersonNo,
        contactEmail,
        category,
        purpose: description,
        priority,
        status,
        progress,
        start,
        end,
        deadline: end || start || '',
        budget: Number(budget) || 0,
        currency,
        billed: Number(billed) || 0,
        received: Number(received) || 0,
        pending: Number(pending) || 0,
        spent: Number(spent) || 0,
        assignedTo: assigned,
        milestones: milestones.filter(m => m.name.trim()),
        portalSettings: portalOpts
      };

      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const headers = { 'x-company-id': currentUser.companyId || "" };

      let res;
      if (editProject) {
        const projectId = editProject._id || editProject.id;
        if (!projectId || projectId === 'undefined') {
          alert('Error: Project ID is missing. Please go back and try again.');
          setLoading(false);
          return;
        }
        res = await axios.put(`${BASE_URL}/api/projects/${projectId}`, payload, { headers });
      } else {
        res = await axios.post(`${BASE_URL}/api/projects/add`, payload, { headers });
      }

      setLoading(false); // ← reset loading BEFORE onSuccess so button is not stuck

      const savedProject = { ...(res.data?.project || res.data), budget: Number(budget) || 0, billed: Number(billed) || 0, received: Number(received) || 0, pending: Number(pending) || 0 };
      if (onSuccess) await onSuccess(savedProject);

      // Fire-and-forget notifications (don't block on these)
      if (!editProject && assigned.length > 0) {
        assigned.forEach(empName => {
          const emp = localEmployees.find(e => (e.name || e.employeeName || "").toLowerCase() === empName.toLowerCase());
          if (emp && (emp._id || emp.id)) {
            axios.post(`${BASE_URL}/api/notifications`, {
              userId: emp._id || emp.id,
              type: 'project',
              icon: '◈',
              text: `You have been assigned to project: "${name}"`,
              link: 'projects'
            }).catch(() => { });
          }
        });
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || `Failed to ${editProject ? 'update' : 'create'} project`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mpc-root">
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        {onBack && (
          <button onClick={onBack} className="mpc-btn mpc-btn-outline" style={{ padding: "8px 14px", flexShrink: 0 }}>
            <i className="ti ti-arrow-left" />
          </button>
        )}
        <div style={{ fontSize: 22, fontWeight: 900, color: P.textDark }}>{editProject ? 'Edit Project' : 'New Project'}</div>
      </div>

      <div className="mpc-create-layout">
        <div>
          {/* STEP BAR */}
          <div className="mpc-step-bar">
            <div className={`mpc-step ${currentStep > 1 ? 'done' : 'active'}`} onClick={() => document.getElementById('sec1')?.scrollIntoView({ behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
              <div className="mpc-step-num">{currentStep > 1 ? <i className="ti ti-check" /> : 1}</div> Basic Info
            </div>
            <div className={`mpc-step-line ${currentStep > 1 ? 'done' : ''}`} />

            <div className={`mpc-step ${currentStep > 2 ? 'done' : currentStep === 2 ? 'active' : ''}`} onClick={() => document.getElementById('sec2')?.scrollIntoView({ behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
              <div className="mpc-step-num">{currentStep > 2 ? <i className="ti ti-check" /> : 2}</div> Team & Dates
            </div>
            <div className={`mpc-step-line ${currentStep > 2 ? 'done' : ''}`} />

            <div className={`mpc-step ${currentStep > 3 ? 'done' : currentStep === 3 ? 'active' : ''}`} onClick={() => document.getElementById('sec3')?.scrollIntoView({ behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
              <div className="mpc-step-num">{currentStep > 3 ? <i className="ti ti-check" /> : 3}</div> Budget & Milestones
            </div>
            <div className={`mpc-step-line ${currentStep > 3 ? 'done' : ''}`} />

            <div className={`mpc-step ${currentStep === 4 ? 'active' : ''}`} onClick={() => document.getElementById('sec4')?.scrollIntoView({ behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
              <div className="mpc-step-num">4</div> Launch
            </div>
          </div>

          {/* SECTION 1: BASIC INFO */}
          <div className="mpc-section-card" id="sec1">
            <div className="mpc-section-heading"><i className="ti ti-file-description" /> Basic Information</div>

            <div className="mpc-form-group">
              <label>Project Name *</label>
              <input
                ref={nameRef}
                value={name}
                onChange={e => { setName(e.target.value); if (fieldErrors.name) setFieldErrors(f => ({ ...f, name: false })); }}
                placeholder="e.g. E-Commerce Platform Redesign"
                autoFocus
                style={fieldErrors.name ? { border: '1.5px solid #EF4444' } : undefined}
              />
              {fieldErrors.name && (
                <div style={{ color: '#EF4444', fontSize: 12, fontWeight: 700, marginTop: 4 }}>Required</div>
              )}
            </div>

            <div className="mpc-form-group">
              <label>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the project scope, goals and deliverables..." />
            </div>

            <div className="mpc-form-2col">
              <div className="mpc-form-group">
                <label>Client *</label>
                <div ref={clientRef} tabIndex={-1} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {(prefillClient || editProject?._fromClientPage) ? (
                    <div style={{
                      flex: 1,
                      padding: '11px 14px',
                      border: '1.5px solid  var(--app-accent, var(--app-accent, #00BCD4))',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#0D2027',
                      background: 'var(--teal-light, var(--teal-light, #E0F7FA))',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      minHeight: 44,
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--app-accent, var(--app-accent, #00BCD4)),#0097A7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 12, fontWeight: 800, flexShrink: 0
                      }}>
                        {client[0]?.toUpperCase() || '?'}
                      </div>
                      <span>{client}</span>

                    </div>
                  ) : (
                    <select
                      value={
                        clients.find(c => (c.clientName || c.name) === client)
                          ? client
                          : (clients.find(c => (c._id || c.id) === clientId)?.clientName ||
                            clients.find(c => (c._id || c.id) === clientId)?.name ||
                            client ||
                            '')
                      }
                      onChange={e => {
                        const selectedName = e.target.value;
                        if (selectedName === '__add_client__') {
                          setShowAddClient(true);
                          return;
                        }
                        setClient(selectedName);
                        if (fieldErrors.client) setFieldErrors(f => ({ ...f, client: false }));
                        const sel = clients.find(c => (c.clientName || c.name) === selectedName);
                        if (sel) {
                          setClientId(sel._id || sel.id || '');
                          setContactPersonName(sel.contactPersonName || '');
                          setContactPersonNo(sel.contactPersonNo || sel.phone || '');
                          setContactEmail(sel.email || '');
                          setCompanyName(sel.companyName || sel.company || '');
                          setClientPhone(sel.phone || '');
                          setClientAddress(sel.address || '');
                        } else {
                          setClientId('');
                        }
                      }}
                      style={{ flex: 1, border: fieldErrors.client ? '1.5px solid #EF4444' : undefined }}
                    >
                      <option value="">Select client...</option>
                      <option value="__add_client__" style={{ color: "var(--app-accent)", fontWeight: 400 }}>➕ Add New Client</option>
                      {clients.map(c => <option key={c._id || c.id} value={c.clientName || c.name}>{c.clientName || c.name}</option>)}
                    </select>
                  )}
                </div>
                {fieldErrors.client && (
                  <div style={{ color: '#EF4444', fontSize: 12, fontWeight: 700, marginTop: 4 }}>Required</div>
                )}

                {/* Inline Add Client Modal */}
                {showAddClient && (
                  <AddClientView
                    onBack={() => setShowAddClient(false)}
                    onClientAdded={(newClient) => {
                      // Auto-select the newly created client
                      const newName = newClient?.clientName || newClient?.name || '';
                      if (newName) {
                        setClient(newName);
                        setClientId(newClient._id || newClient.id || '');
                        setContactPersonName(newClient.contactPersonName || '');
                        setContactPersonNo(newClient.contactPersonNo || newClient.phone || '');
                        setContactEmail(newClient.email || '');
                        setCompanyName(newClient.companyName || newClient.company || '');
                        setClientPhone(newClient.phone || '');
                        setClientAddress(newClient.address || '');
                        // Add to local clients list so it appears in dropdown
                        clients.push(newClient);
                      }
                      setShowAddClient(false);
                    }}
                    user={JSON.parse(localStorage.getItem("user") || "{}")}
                  />
                )}
              </div>
              <div className="mpc-form-group">
                <label>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  <option>Web Development</option><option>Mobile App</option><option>UI/UX Design</option><option>Branding</option><option>Digital Marketing</option>
                </select>
              </div>
            </div>

            <div className="mpc-form-2col">
              <div className="mpc-form-group">
                <label>Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                </select>
              </div>
              <div className="mpc-form-group">
                <label>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}>
                  <option>Active</option><option>Planning</option><option>On Hold</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: TIMELINE */}
          <div className="mpc-section-card" id="sec2">
            <div className="mpc-section-heading"><i className="ti ti-calendar" /> Project Timeline</div>
            <div className="mpc-form-2col">
              <div className="mpc-form-group"><label>Start Date</label><input type="date" value={start} onChange={e => setStart(e.target.value)} /></div>
              <div className="mpc-form-group"><label>Deadline</label><input type="date" value={end} onChange={e => setEnd(e.target.value)} /></div>

            </div>
          </div>

          {/* SECTION 3: TEAM */}
          <div className="mpc-section-card">
            <div className="mpc-section-heading" style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ti ti-users" /> Assign Team Members
              </span>
              <button
                className="mpc-btn mpc-btn-primary"
                style={{ fontSize: 12, padding: '6px 14px' }}
                onClick={() => { setShowAddEmployee(true); setSelectedEmpToAdd(''); }}
              >
                Add Team Member
              </button>
            </div>

            {/* Already assigned members list */}
            <div className="mpc-team-selector">

              {localEmployees
                .filter(emp => assigned.includes(emp.name || emp.employeeName || ''))
                .map(emp => {
                  const empName = emp.name || emp.employeeName || 'Unknown';
                  const role = emp.department || emp.role || 'Staff';
                  return (
                    <div key={emp._id || emp.id} className="mpc-team-row selected">
                      <div className="mpc-av" style={{ background: getAvatarColor(empName) }}>{getInitials(empName)}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: P.textDark }}>{empName}</div>
                        <div style={{ fontSize: 12, color: P.textLight, fontWeight: 600 }}>{emp.email}</div>
                      </div>
                      <span className="mpc-role-badge">{role}</span>
                      <button
                        onClick={() => setAssigned(prev => prev.filter(n => n !== empName))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.red, fontSize: 16, marginLeft: 6, padding: '2px 4px', lineHeight: 1 }}
                        title="Remove"
                      >
                        <i className="ti ti-x" />
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* POPUP MODAL */}
            {showAddEmployee && (
              <div
                style={{
                  position: 'fixed', inset: 0,
                  background: 'rgba(0,0,0,0.45)',
                  zIndex: 9999,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                onClick={() => setShowAddEmployee(false)}
              >
                <div
                  style={{
                    background: '#fff', borderRadius: 16,
                    padding: '28px 28px 22px', width: '100%', maxWidth: 420,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ fontSize: 18, fontWeight: 800, color: P.textDark, marginBottom: 20 }}>
                    Add Team Member
                  </div>
                  <select
                    value={selectedEmpToAdd}
                    onChange={e => {
                      if (e.target.value === '__add_new_employee__') {
                        setShowAddEmployee(false);
                        setSelectedEmpToAdd('');
                        onAddEmployeeClick && onAddEmployeeClick();
                        return;
                      }
                      setSelectedEmpToAdd(e.target.value);
                    }}
                    style={{
                      width: '100%', padding: '11px 14px',
                      border: '1.5px solid #E2E8F0', borderRadius: 10,
                      fontSize: 14, fontFamily: 'Nunito,sans-serif',
                      color: selectedEmpToAdd ? P.textDark : P.textLight,
                      background: '#F0F4F8', outline: 'none', marginBottom: 24,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">-- Select Employee --</option>
                    {employees
                      .filter(emp => !assigned.includes(emp.name || emp.employeeName || ''))
                      .map(emp => (
                        <option key={emp._id || emp.id} value={emp.name || emp.employeeName}>
                          {emp.name || emp.employeeName}{emp.department ? ` (${emp.department})` : ''}
                        </option>
                      ))
                    }
                    {typeof onAddEmployeeClick === 'function' && (
                      <option value="__add_new_employee__">+ Add New Employee...</option>
                    )}
                  </select>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      className="mpc-btn mpc-btn-outline"
                      onClick={() => { setShowAddEmployee(false); setSelectedEmpToAdd(''); }}
                    >
                      Cancel
                    </button>
                    <button
                      className="mpc-btn mpc-btn-primary"
                      onClick={() => {
                        if (!selectedEmpToAdd) return;
                        setAssigned(prev => [...prev, selectedEmpToAdd]);
                        setSelectedEmpToAdd('');
                        setShowAddEmployee(false);
                      }}
                    >
                      Add
                    </button>
                  </div>


                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: BUDGET */}
          <div className="mpc-section-card" id="sec3">
            <div className="mpc-section-heading"><i className="ti ti-wallet" /> Budget</div>
            <div className="mpc-form-group">
              <label>Total Project Budget ({currency})</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ width: 80 }}>
                  {["₹", "$", "€", "£", "AED", "SAR", "AUD"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 850000" />
              </div>
            </div>
            {budget && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <div className="mpc-form-group">
                  <label>Billed Amount</label>
                  <input type="number" value={billed} onChange={e => setBilled(e.target.value)} placeholder="0" />
                </div>
                <div className="mpc-form-group">
                  <label>Received Amount</label>
                  <input type="number" value={received} onChange={e => setReceived(e.target.value)} placeholder="0" />
                </div>
                <div className="mpc-form-group">
                  <label>Pending Amount</label>
                  <input type="number" value={pending} readOnly style={{ background: '#f0f4f8', cursor: 'not-allowed' }} />
                </div>
                <div className="mpc-form-group">
                  <label>Spent Amount</label>
                  <input type="number" value={0} readOnly
                    style={{ background: '#f0f4f8', cursor: 'not-allowed', color: '#94A3B8' }}
                    title="Spent amount is calculated automatically from expense records" />
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                    Auto-calculated from expense records
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: MILESTONES */}
          <div className="mpc-section-card">
            <div className="mpc-section-heading"><i className="ti ti-flag" /> Milestones</div>
            <div className="mpc-milestone-list">
              {milestones.map((m, idx) => {
                const isPredefinedValue = customMilestoneOptions.includes(m.name) && m.name !== "Custom";
                const isCustomMode = m.isCustom === true;
                const isFinalizedCustom = !isCustomMode && m.name !== "" && !isPredefinedValue;
                const selectValue = isCustomMode ? "Custom" : (isPredefinedValue || isFinalizedCustom ? m.name : "");
                return (
                  <div key={idx} className="mpc-milestone-row">
                    <select
                      value={selectValue}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === "Custom") {
                          updateMilestone(idx, 'name', '');
                          updateMilestone(idx, 'isCustom', true);
                        } else {
                          updateMilestone(idx, 'name', val);
                          updateMilestone(idx, 'isCustom', false);
                        }
                      }}
                      style={isCustomMode ? { minWidth: 320, height: 46, fontSize: 15, padding: '10px 14px', display: 'none' } : { minWidth: 320, height: 46, fontSize: 15, padding: '10px 14px' }}
                    >
                      <option value="">Select milestone...</option>
                      {customMilestoneOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {isCustomMode && (
                      <input
                        type="text"
                        placeholder="Enter custom milestone name"
                        value={m.name}
                        autoFocus
                        onChange={e => updateMilestone(idx, 'name', e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const finalName = m.name.trim();
                            if (!finalName) return;
                            if (!customMilestoneOptions.includes(finalName)) {
                              setCustomMilestoneOptions(prev => [...prev, finalName]);
                            }
                            updateMilestone(idx, 'name', finalName);
                            updateMilestone(idx, 'isCustom', false);
                          }
                        }}
                        onBlur={() => {
                          const finalName = m.name.trim();
                          if (!finalName) return;
                          if (!customMilestoneOptions.includes(finalName)) {
                            setCustomMilestoneOptions(prev => [...prev, finalName]);
                          }
                          updateMilestone(idx, 'name', finalName);
                          updateMilestone(idx, 'isCustom', false);
                        }}
                        style={{ minWidth: 320, height: 46, fontSize: 15, padding: '10px 14px', boxSizing: 'border-box' }}
                      />
                    )}
                    <input type="date" value={m.date} onChange={e => updateMilestone(idx, 'date', e.target.value)} />

                  </div>
                );
              })}
            </div>
            <button className="mpc-btn mpc-btn-outline" style={{ marginTop: 16, fontSize: 12, padding: '8px 16px' }} onClick={addMilestone}>
              <i className="ti ti-plus" /> Add Milestone
            </button>
          </div>

          {/* SECTION 6: CLIENT PORTAL */}
          <div className="mpc-section-card" id="sec4">
            <div className="mpc-section-heading"><i className="ti ti-building" /> Client Portal Settings</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label className="mpc-checkbox-label">
                <input type="checkbox" checked={portalOpts.enablePortal} onChange={e => setPortalOpts({ ...portalOpts, enablePortal: e.target.checked })} />
                Enable client portal for this project
              </label>
              <label className="mpc-checkbox-label">
                <input type="checkbox" checked={portalOpts.showProgress} onChange={e => setPortalOpts({ ...portalOpts, showProgress: e.target.checked })} disabled={!portalOpts.enablePortal} />
                Show project progress to client
              </label>
              <label className="mpc-checkbox-label">
                <input type="checkbox" checked={portalOpts.showMilestones} onChange={e => setPortalOpts({ ...portalOpts, showMilestones: e.target.checked })} disabled={!portalOpts.enablePortal} />
                Show milestones to client
              </label>
              <label className="mpc-checkbox-label">
                <input type="checkbox" checked={portalOpts.showTeam} onChange={e => setPortalOpts({ ...portalOpts, showTeam: e.target.checked })} disabled={!portalOpts.enablePortal} />
                Show team members to client
              </label>
              <label className="mpc-checkbox-label">
                <input type="checkbox" checked={portalOpts.allowMessages} onChange={e => setPortalOpts({ ...portalOpts, allowMessages: e.target.checked })} disabled={!portalOpts.enablePortal} />
                Allow client to send messages
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT: PREVIEW */}
        <div>
          <div className="mpc-preview-card">
            <h3><i className="ti ti-eye" /> Project Preview</h3>

            <div className="mpc-pv-row"><span className="mpc-pv-label">Name</span><span className="mpc-pv-val">{name || '—'}</span></div>
            <div className="mpc-pv-row"><span className="mpc-pv-label">Client</span><span className="mpc-pv-val">{client || '—'}</span></div>
            <div className="mpc-pv-row"><span className="mpc-pv-label">Category</span><span className="mpc-pv-val">{category}</span></div>
            <div className="mpc-pv-row"><span className="mpc-pv-label">Status</span><span className="mpc-pv-val">{status}</span></div>
            <div className="mpc-pv-row"><span className="mpc-pv-label">Priority</span><span className="mpc-pv-val">{priority.charAt(0).toUpperCase() + priority.slice(1)}</span></div>
            <div className="mpc-pv-row"><span className="mpc-pv-label">Start</span><span className="mpc-pv-val">{start ? new Date(start).toLocaleDateString() : '—'}</span></div>
            <div className="mpc-pv-row"><span className="mpc-pv-label">Deadline</span><span className="mpc-pv-val">{end ? new Date(end).toLocaleDateString() : '—'}</span></div>
            <div className="mpc-pv-row"><span className="mpc-pv-label">Budget</span><span className="mpc-pv-val">{budget ? `${currency}${Number(budget).toLocaleString()}` : '—'}</span></div>
            {budget && (
              <>
                <div className="mpc-pv-row"><span className="mpc-pv-label">Billed</span><span className="mpc-pv-val">{currency}{Number(billed || 0).toLocaleString()}</span></div>
                <div className="mpc-pv-row"><span className="mpc-pv-label">Received</span><span className="mpc-pv-val">{currency}{Number(received || 0).toLocaleString()}</span></div>
                <div className="mpc-pv-row"><span className="mpc-pv-label">Pending</span><span className="mpc-pv-val">{currency}{Number(pending || 0).toLocaleString()}</span></div>
                <div className="mpc-pv-row"><span className="mpc-pv-label">Spent</span><span className="mpc-pv-val">{currency}{Number(spent || 0).toLocaleString()}</span></div>
              </>
            )}
            <div className="mpc-pv-row"><span className="mpc-pv-label">Team</span><span className="mpc-pv-val">{assigned.length ? assigned.join(', ') : '—'}</span></div>
            <div className="mpc-pv-row"><span className="mpc-pv-label">Milestones</span><span className="mpc-pv-val">{milestones.filter(m => m.name.trim()).length || 0}</span></div>
            {description && (
              <div className="mpc-pv-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                <span className="mpc-pv-label">Description</span>
                <span className="mpc-pv-val" style={{ textAlign: 'left', fontWeight: 600, lineHeight: 1.5 }}>{description}</span>
              </div>
            )}
            <div className="mpc-pv-row"><span className="mpc-pv-label">Client Portal</span><span className="mpc-pv-val">{portalOpts.enablePortal ? 'Enabled' : 'Disabled'}</span></div>

            <div style={{ fontSize: 11, fontWeight: 800, color: P.textLight, textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 12, marginTop: 8 }}>
              Checklist
            </div>
            <div className="mpc-checklist">
              <div className={`mpc-cl-item ${name ? 'ok' : 'pending'}`}><i className={`ti ${name ? 'ti-circle-check' : 'ti-circle'}`} /> Project name</div>
              <div className={`mpc-cl-item ${client ? 'ok' : 'pending'}`}><i className={`ti ${client ? 'ti-circle-check' : 'ti-circle'}`} /> Client selected</div>
              <div className={`mpc-cl-item ${(start || end) ? 'ok' : 'pending'}`}><i className={`ti ${(start || end) ? 'ti-circle-check' : 'ti-circle'}`} /> Dates set</div>
              <div className={`mpc-cl-item ${assigned.length > 0 ? 'ok' : 'pending'}`}><i className={`ti ${assigned.length > 0 ? 'ti-circle-check' : 'ti-circle'}`} /> Team assigned ({assigned.length})</div>
              <div className={`mpc-cl-item ${budget ? 'ok' : 'pending'}`}><i className={`ti ${budget ? 'ti-circle-check' : 'ti-circle'}`} /> Budget entered</div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="mpc-action-bar">
        <div style={{ fontSize: 13, color: P.textLight, fontWeight: 600 }}>
          Ensure all required fields are filled before launching.
        </div>
        <div style={{ display: "flex", gap: 12 }}>

          <button className="mpc-btn mpc-btn-primary" onClick={handleCreate} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? <i className="ti ti-loader" style={{ animation: 'spin 1s linear infinite' }} /> : <i className="ti ti-rocket" />}
            {loading ? (editProject ? 'Updating...' : 'Launching...') : (editProject ? 'Update Project' : 'Save Project')}
          </button>
        </div>
      </div>
    </div>
  );
}
