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
};

const CSS = `
.mpc-root { font-family:'Nunito',sans-serif; background:var(--bg); min-height:100vh; padding:0; box-sizing:border-box; }
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
.mpc-milestone-row input { border:none; background:transparent; font-family:'Nunito',sans-serif; font-size:14px; font-weight:700; color:${P.textDark}; outline:none; width:100%; padding:0; }
.mpc-milestone-row input[type="date"] { font-size:13px; color:${P.textMid}; font-weight:600; }
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
  const colors = ['#00BCD4', '#8B5CF6', '#F59E0B', '#26C281', '#EC4899', '#3B82F6'];
  if (!name) return colors[0];
  return colors[name.charCodeAt(0) % colors.length];
}

export default function ModernProjectCreator({ onBack, clients = [], employees = [], onSuccess }) {
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [client, setClient] = useState('');
  const [category, setCategory] = useState('Web Development');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('Active');
  
  const [start, setStart] = useState(new Date().toISOString().split('T')[0]);
  const [end, setEnd] = useState('');
  
  const [assigned, setAssigned] = useState([]); // array of employee names
  
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [advPct, setAdvPct] = useState('30');
  const [msPct, setMsPct] = useState('40');
  const [delPct, setDelPct] = useState('30');

  const [milestones, setMilestones] = useState([
    { name: 'Kickoff & Requirements', date: '' },
    { name: 'Design Approval', date: '' },
    { name: 'Development Complete', date: '' }
  ]);

  const [portalOpts, setPortalOpts] = useState({
    enablePortal: true,
    showProgress: true,
    showMilestones: true,
    showTeam: false,
    allowMessages: true
  });

  // Calculate Progress Steps dynamically
  const stepInfo = 1;
  let currentStep = 1;
  if (name && client) currentStep = 2;
  if (currentStep === 2 && assigned.length > 0) currentStep = 3;
  if (currentStep === 3 && budget) currentStep = 4;

  const toggleMember = (empName) => {
    if (assigned.includes(empName)) {
      setAssigned(assigned.filter(n => n !== empName));
    } else {
      setAssigned([...assigned, empName]);
    }
  };

  const addMilestone = () => {
    setMilestones([...milestones, { name: '', date: '' }]);
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
    if (!name.trim()) return alert("Project Name is required.");
    if (!client) return alert("Client is required.");

    setLoading(true);
    try {
      const payload = {
        name,
        description,
        client,
        purpose: category,
        priority,
        status,
        start,
        end,
        budget,
        currency,
        assignedTo: assigned,
        progress: 0,
        milestones: milestones.filter(m => m.name.trim()),
        portalSettings: portalOpts
      };

      const res = await axios.post(`${BASE_URL}/api/projects/add`, payload);
      
      // Notify assigned employees
      if (assigned.length > 0) {
        for (const empName of assigned) {
          const emp = employees.find(e => (e.name || e.employeeName || "").toLowerCase() === empName.toLowerCase());
          if (emp && (emp._id || emp.id)) {
            await axios.post(`${BASE_URL}/api/notifications`, {
              userId: emp._id || emp.id,
              type: 'project',
              icon: '◈',
              text: `You have been assigned to a new project: "${name}"`,
              link: 'projects'
            }).catch(() => {});
          }
        }
      }

      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mpc-root">
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: P.textDark }}>Create New Project</div>
        {onBack && (
          <button onClick={onBack} className="mpc-btn mpc-btn-outline">
            <i className="ti ti-arrow-left" /> Back
          </button>
        )}
      </div>

      <div className="mpc-create-layout">
        <div>
          {/* STEP BAR */}
          <div className="mpc-step-bar">
            <div className={`mpc-step ${currentStep > 1 ? 'done' : 'active'}`}>
              <div className="mpc-step-num">{currentStep > 1 ? <i className="ti ti-check" /> : 1}</div> Basic Info
            </div>
            <div className={`mpc-step-line ${currentStep > 1 ? 'done' : ''}`} />
            
            <div className={`mpc-step ${currentStep > 2 ? 'done' : currentStep === 2 ? 'active' : ''}`}>
              <div className="mpc-step-num">{currentStep > 2 ? <i className="ti ti-check" /> : 2}</div> Team & Dates
            </div>
            <div className={`mpc-step-line ${currentStep > 2 ? 'done' : ''}`} />
            
            <div className={`mpc-step ${currentStep > 3 ? 'done' : currentStep === 3 ? 'active' : ''}`}>
              <div className="mpc-step-num">{currentStep > 3 ? <i className="ti ti-check" /> : 3}</div> Budget & Milestones
            </div>
            <div className={`mpc-step-line ${currentStep > 3 ? 'done' : ''}`} />
            
            <div className={`mpc-step ${currentStep === 4 ? 'active' : ''}`}>
              <div className="mpc-step-num">4</div> Launch
            </div>
          </div>

          {/* SECTION 1: BASIC INFO */}
          <div className="mpc-section-card">
            <div className="mpc-section-heading"><i className="ti ti-file-description" /> Basic Information</div>
            
            <div className="mpc-form-group">
              <label>Project Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. E-Commerce Platform Redesign" autoFocus />
            </div>
            
            <div className="mpc-form-group">
              <label>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the project scope, goals and deliverables..." />
            </div>
            
            <div className="mpc-form-2col">
              <div className="mpc-form-group">
                <label>Client *</label>
                <select value={client} onChange={e => setClient(e.target.value)}>
                  <option value="">Select client...</option>
                  {clients.map(c => <option key={c._id || c.id} value={c.clientName || c.name}>{c.clientName || c.name}</option>)}
                </select>
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
          <div className="mpc-section-card">
            <div className="mpc-section-heading"><i className="ti ti-calendar" /> Project Timeline</div>
            <div className="mpc-form-2col">
              <div className="mpc-form-group"><label>Start Date</label><input type="date" value={start} onChange={e => setStart(e.target.value)} /></div>
              <div className="mpc-form-group"><label>Deadline</label><input type="date" value={end} onChange={e => setEnd(e.target.value)} /></div>
            </div>
          </div>

          {/* SECTION 3: TEAM */}
          <div className="mpc-section-card">
            <div className="mpc-section-heading"><i className="ti ti-users" /> Assign Team Members</div>
            <div className="mpc-team-selector">
              {employees.length === 0 ? <div style={{ fontSize: 13, color: P.textLight, fontStyle: 'italic' }}>No employees available</div> : null}
              {employees.map(emp => {
                const empName = emp.name || emp.employeeName || "Unknown";
                const isSel = assigned.includes(empName);
                const role = emp.department || emp.role || "Staff";
                return (
                  <div key={emp._id || emp.id} className={`mpc-team-row ${isSel ? 'selected' : ''}`} onClick={() => toggleMember(empName)}>
                    <div className="mpc-av" style={{ background: getAvatarColor(empName) }}>{getInitials(empName)}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: P.textDark }}>{empName}</div>
                      <div style={{ fontSize: 12, color: P.textLight, fontWeight: 600 }}>{emp.email}</div>
                    </div>
                    <span className="mpc-role-badge">{role}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: BUDGET */}
          <div className="mpc-section-card">
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
              <div className="mpc-budget-split">
                <div className="mpc-bs-item"><label>Advance %</label><input type="number" value={advPct} onChange={e => setAdvPct(e.target.value)} /></div>
                <div className="mpc-bs-item"><label>On Milestone %</label><input type="number" value={msPct} onChange={e => setMsPct(e.target.value)} /></div>
                <div className="mpc-bs-item"><label>On Delivery %</label><input type="number" value={delPct} onChange={e => setDelPct(e.target.value)} /></div>
              </div>
            )}
          </div>

          {/* SECTION 5: MILESTONES */}
          <div className="mpc-section-card">
            <div className="mpc-section-heading"><i className="ti ti-flag" /> Milestones</div>
            <div className="mpc-milestone-list">
              {milestones.map((m, idx) => (
                <div key={idx} className="mpc-milestone-row">
                  <input type="text" placeholder="Milestone name, e.g. Design Approval" value={m.name} onChange={e => updateMilestone(idx, 'name', e.target.value)} />
                  <input type="date" value={m.date} onChange={e => updateMilestone(idx, 'date', e.target.value)} />
                  <span className="mpc-remove-ms" onClick={() => removeMilestone(idx)}><i className="ti ti-trash" /></span>
                </div>
              ))}
            </div>
            <button className="mpc-btn mpc-btn-outline" style={{ marginTop: 16, fontSize: 12, padding: '8px 16px' }} onClick={addMilestone}>
              <i className="ti ti-plus" /> Add Milestone
            </button>
          </div>

          {/* SECTION 6: CLIENT PORTAL */}
          <div className="mpc-section-card">
            <div className="mpc-section-heading"><i className="ti ti-building" /> Client Portal Settings</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label className="mpc-checkbox-label">
                <input type="checkbox" checked={portalOpts.enablePortal} onChange={e => setPortalOpts({...portalOpts, enablePortal: e.target.checked})} />
                Enable client portal for this project
              </label>
              <label className="mpc-checkbox-label">
                <input type="checkbox" checked={portalOpts.showProgress} onChange={e => setPortalOpts({...portalOpts, showProgress: e.target.checked})} disabled={!portalOpts.enablePortal} />
                Show project progress to client
              </label>
              <label className="mpc-checkbox-label">
                <input type="checkbox" checked={portalOpts.showMilestones} onChange={e => setPortalOpts({...portalOpts, showMilestones: e.target.checked})} disabled={!portalOpts.enablePortal} />
                Show milestones to client
              </label>
              <label className="mpc-checkbox-label">
                <input type="checkbox" checked={portalOpts.showTeam} onChange={e => setPortalOpts({...portalOpts, showTeam: e.target.checked})} disabled={!portalOpts.enablePortal} />
                Show team members to client
              </label>
              <label className="mpc-checkbox-label">
                <input type="checkbox" checked={portalOpts.allowMessages} onChange={e => setPortalOpts({...portalOpts, allowMessages: e.target.checked})} disabled={!portalOpts.enablePortal} />
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
            <div className="mpc-pv-row"><span className="mpc-pv-label">Priority</span><span className="mpc-pv-val">{priority.charAt(0).toUpperCase() + priority.slice(1)}</span></div>
            <div className="mpc-pv-row"><span className="mpc-pv-label">Start</span><span className="mpc-pv-val">{start ? new Date(start).toLocaleDateString() : '—'}</span></div>
            <div className="mpc-pv-row"><span className="mpc-pv-label">Deadline</span><span className="mpc-pv-val">{end ? new Date(end).toLocaleDateString() : '—'}</span></div>
            <div className="mpc-pv-row"><span className="mpc-pv-label">Budget</span><span className="mpc-pv-val">{budget ? `${currency}${Number(budget).toLocaleString()}` : '—'}</span></div>
            
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
          {onBack && <button className="mpc-btn mpc-btn-outline" onClick={onBack}>Cancel</button>}
          <button className="mpc-btn mpc-btn-primary" onClick={handleCreate} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? <i className="ti ti-loader" style={{ animation: 'spin 1s linear infinite' }} /> : <i className="ti ti-rocket" />}
            {loading ? 'Launching...' : 'Create & Launch Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
