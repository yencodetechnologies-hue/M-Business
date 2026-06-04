import React, { useState } from 'react';

export default function EmployeeDetail({ emp, onBack, onEdit, onDelete, empDocs, empDocsLoading, projects = [], tasks = [], onViewProject }) {
  if (!emp) return null;

  const [taskTab, setTaskTab] = useState('all');

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const empId = emp.employeeId || emp._id?.substring(0, 6).toUpperCase() || "—";

  // Tenure calculation
  const joinedDate = emp.joiningDate ? new Date(emp.joiningDate) : (emp.createdAt ? new Date(emp.createdAt) : null);
  const now = new Date();
  let tenure = "—";
  if (joinedDate) {
    const diffDays = Math.ceil(Math.abs(now - joinedDate) / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    tenure = years > 0 ? `${years} yr ${months} mo` : `${months} mo`;
  }

  // Projects helpers
  const activeProjects = projects.filter(p => (p.status || '').toLowerCase() !== 'completed');
  const totalWorkload = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + (p.progress || p.percentage || 0), 0) / projects.length)
    : 0;

  const projIcons = ['ti-world', 'ti-device-mobile', 'ti-chart-bar', 'ti-code', 'ti-building', 'ti-rocket'];
  const projColors = [
    { bg: '#F0FDFE', color: '#00BCD4' },
    { bg: '#EEF2FF', color: '#6366F1' },
    { bg: '#ECFDF5', color: '#10B981' },
    { bg: '#FFF7ED', color: '#F59E0B' },
    { bg: '#FDF4FF', color: '#A855F7' },
    { bg: '#FFF1F2', color: '#EF4444' },
  ];

  // Tasks helpers
  const pendingTasks = tasks.filter(t => !t.completed && !t.done && t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.completed || t.done || t.status === 'completed');
  const filteredTasks = taskTab === 'all' ? tasks : taskTab === 'pending' ? pendingTasks : completedTasks;

  const getPriorityStyle = (priority = '') => {
    const p = priority.toLowerCase();
    if (p === 'high') return { background: '#FEF2F2', color: '#EF4444' };
    if (p === 'low') return { background: '#ECFDF5', color: '#10B981' };
    return { background: '#FFFBEB', color: '#F59E0B' }; // mid/medium
  };

  const formatDue = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const isOverdue = (date) => date && new Date(date) < now;

  // Documents helpers
  const docIcons = {
    offer: { icon: 'ti-file-text', bg: '#EEF2FF', color: '#6366F1' },
    id: { icon: 'ti-id', bg: '#E0F2FE', color: '#0ea5e9' },
    contract: { icon: 'ti-file-certificate', bg: '#FFFBEB', color: '#f59e0b' },
    degree: { icon: 'ti-certificate', bg: '#F5F3FF', color: '#8b5cf6' },
    resume: { icon: 'ti-file-description', bg: '#FEF2F2', color: '#ef4444' },
    default: { icon: 'ti-file', bg: '#F1F5F9', color: '#64748B' },
  };

  const getDocStyle = (doc) => {
    const name = (doc.name || doc.documentName || doc.type || '').toLowerCase();
    if (name.includes('offer')) return docIcons.offer;
    if (name.includes('aadhar') || name.includes('id') || name.includes('pan')) return docIcons.id;
    if (name.includes('contract')) return docIcons.contract;
    if (name.includes('degree') || name.includes('education') || name.includes('cert')) return docIcons.degree;
    if (name.includes('resume') || name.includes('cv')) return docIcons.resume;
    return docIcons.default;
  };

  const docsToShow = empDocs || [];

  return (
    <div style={{
      "--teal": "#00BCD4",
      "--bg": "#F5F7FA",
      "--card": "#FFFFFF",
      "--text": "#1A2E35",
      "--text-muted": "#64748B",
      "--border": "#E2E8F0",
      "--danger": "#EF4444",
      "--warning": "#F59E0B",
      "--success": "#10B981",
      background: "var(--bg)",
      color: "var(--text)",
      fontFamily: "'Nunito', sans-serif",
      height: "100%",
      overflowY: "auto",
      padding: "24px 32px"
    }}>
      <style>{`
        .ed-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .ed-title-area { display: flex; align-items: center; gap: 16px; }
        .ed-back-btn { width: 40px; height: 40px; border-radius: 12px; background: #E0F2FE; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--teal); font-size: 18px; border: none; transition: all 0.2s; }
        .ed-back-btn:hover { background: #BAE6FD; }
        .ed-title { font-size: 20px; font-weight: 900; line-height: 1.2; color: #0F172A; }
        .ed-subtitle { font-size: 12px; color: var(--text-muted); font-weight: 600; }
        .ed-actions { display: flex; gap: 12px; }
        .ed-btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 800; cursor: pointer; border: 1px solid var(--border); background: var(--card); color: var(--text); display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .ed-btn:hover { border-color: var(--text-muted); }
        .ed-btn.danger { color: var(--danger); border-color: transparent; background: #FEE2E2; }
        .ed-btn.danger:hover { background: #FECACA; }
        .ed-btn.warning { color: #D97706; border-color: #FDE68A; background: #FEF3C7; }

        .ed-hero { background: var(--card); border-radius: 16px; padding: 24px 32px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; position: relative; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border-top: 4px solid #00E5FF; border-bottom: none; border-left: none; border-right: none; }
        .ed-hero-left { display: flex; align-items: center; gap: 24px; }
        .ed-avatar { width: 72px; height: 72px; border-radius: 50%; background: var(--teal); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 28px; font-weight: 800; flex-shrink: 0; }
        .ed-name { font-size: 22px; font-weight: 900; color: #0F172A; margin-bottom: 6px; }
        .ed-roles { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; margin-bottom: 12px; }
        .ed-badge { background: #F1F5F9; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; color: #475569; }
        .ed-contacts { display: flex; gap: 20px; font-size: 12px; color: var(--text-muted); font-weight: 600; }
        .ed-contacts span { display: flex; align-items: center; gap: 6px; }
        .ed-contacts i { color: var(--teal); font-size: 14px; }
        .ed-hero-right { text-align: right; display: flex; flexDirection: column; gap: 16px; align-items: flex-end; }
        .ed-status { display: inline-flex; align-items: center; gap: 6px; background: #DCFCE7; color: #16A34A; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; }
        .ed-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .ed-tenure { font-size: 14px; font-weight: 900; color: #0F172A; }
        .ed-tenure span { display: block; font-size: 11px; font-weight: 600; color: var(--text-muted); margin-top: 2px; }

        .ed-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        .ed-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .ed-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .ed-card-title { font-size: 14px; font-weight: 900; color: #0F172A; display: flex; align-items: center; gap: 8px; }
        .ed-card-title i { color: var(--teal); font-size: 18px; }
        
        .ed-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .ed-info-item .lbl { font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .ed-info-item .val { font-size: 13px; font-weight: 800; color: #0F172A; word-break: break-all; }

        .ed-progress-group { margin-bottom: 16px; }
        .ed-progress-header { display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; margin-bottom: 8px; color: #475569; }
        .ed-progress-bar { height: 6px; background: #E2E8F0; border-radius: 10px; overflow: hidden; }
        .ed-progress-fill { height: 100%; border-radius: 10px; }

        .ed-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .ed-table th { text-align: left; padding: 8px 0; font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; border-bottom: 1px solid var(--border); }
        .ed-table td { padding: 12px 0; font-size: 12px; font-weight: 700; color: #334155; border-bottom: 1px solid #F1F5F9; }
        .ed-table tr:last-child td { border-bottom: none; }

        .ed-proj-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #F1F5F9; cursor: pointer; }
        .ed-proj-item:last-child { border-bottom: none; }
        .ed-proj-item:hover { background: #FAFAFA; }
        .ed-proj-info { display: flex; align-items: center; gap: 12px; }
        .ed-proj-icon { width: 36px; height: 36px; border-radius: 8px; background: #F0FDFE; color: var(--teal); display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .ed-proj-name { font-size: 13px; font-weight: 800; color: #0F172A; }
        .ed-proj-role { font-size: 11px; font-weight: 600; color: #64748B; }
        .ed-proj-stat { text-align: right; }
        .ed-proj-perc { font-size: 13px; font-weight: 900; color: var(--teal); }
        .ed-proj-lbl { font-size: 11px; font-weight: 600; color: #64748B; }

        .ed-task-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #F1F5F9; }
        .ed-task-item:last-child { border-bottom: none; }
        .ed-task-cb { width: 16px; height: 16px; border-radius: 4px; border: 2px solid var(--teal); display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; flex-shrink: 0; }
        .ed-task-cb.done { background: var(--teal); }
        .ed-task-content { flex: 1; }
        .ed-task-title { font-size: 12px; font-weight: 800; margin-bottom: 2px; color: #0F172A; }
        .ed-task-title.done { text-decoration: line-through; color: #94A3B8; }
        .ed-task-due { font-size: 10px; font-weight: 700; color: #64748B; }
        .ed-task-tag { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; flex-shrink: 0; }

        .ed-docs-list { display: flex; flex-direction: column; gap: 0; }
        .ed-doc-row { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px solid #F1F5F9; }
        .ed-doc-row:last-child { border-bottom: none; }
        .ed-doc-icon { width: 36px; height: 36px; border-radius: 8px; background: #F1F5F9; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .ed-doc-info { flex: 1; }
        .ed-doc-name { font-size: 13px; font-weight: 800; color: #0F172A; }
        .ed-doc-meta { font-size: 10px; font-weight: 600; color: #64748B; }
        .ed-doc-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .ed-doc-btn { padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 800; cursor: pointer; border: none; display: flex; align-items: center; gap: 5px; transition: all 0.2s; }
        .ed-doc-btn.view { background: #E0F2FE; color: #0284C7; }
        .ed-doc-btn.view:hover { background: #BAE6FD; }
        .ed-doc-btn.download { background: var(--teal); color: #fff; }
        .ed-doc-btn.download:hover { background: #0097A7; }
        .ed-docs-sub { font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .ed-docs-sub span { background: var(--teal); color: #fff; border-radius: 10px; padding: 1px 7px; font-size: 10px; }
        .ed-empty { text-align: center; padding: 24px 0; color: #94A3B8; font-size: 12px; font-weight: 600; }
        .ed-tab { font-size: 12px; font-weight: 700; padding-bottom: 8px; cursor: pointer; color: var(--text-muted); }
        .ed-tab.active { color: var(--teal); border-bottom: 2px solid var(--teal); }
      `}</style>

      {/* HEADER */}
      <div className="ed-header">
        <div className="ed-title-area">
          <button className="ed-back-btn" onClick={onBack}><i className="ti ti-arrow-left"></i></button>
          <div>
            <div className="ed-title">{emp.name}</div>
            <div className="ed-subtitle">Employees / {empId}</div>
          </div>
        </div>
        <div className="ed-actions">
          <button className="ed-btn" onClick={onEdit}><i className="ti ti-edit"></i> Edit Details</button>
          <button className="ed-btn warning"><i className="ti ti-shield"></i> Change Role</button>
          <button className="ed-btn danger" onClick={onDelete}><i className="ti ti-user-x"></i> Deactivate</button>
        </div>
      </div>

      {/* HERO */}
      <div className="ed-hero">
        <div className="ed-hero-left">
          <div className="ed-avatar">{getInitials(emp.name)}</div>
          <div>
            <div className="ed-name">{emp.name}</div>
            <div className="ed-roles">
              <span>{emp.role || "Employee"}</span> · <span style={{color: "var(--teal)"}}>{emp.department || "General"}</span>
              <span className="ed-badge">{empId}</span>
            </div>
            <div className="ed-contacts">
              {emp.email && <span><i className="ti ti-mail"></i> {emp.email}</span>}
              {emp.phone && <span><i className="ti ti-phone"></i> {emp.phone}</span>}
              {emp.address && <span><i className="ti ti-map-pin"></i> {emp.address}</span>}
            </div>
          </div>
        </div>
        <div className="ed-hero-right">
          <div className="ed-status" style={
            (emp.status || 'active').toLowerCase() === 'inactive'
              ? { background: '#FEE2E2', color: '#DC2626' }
              : { background: '#DCFCE7', color: '#16A34A' }
          }>
            <div className="ed-status-dot"></div> {(emp.status || "Active").toUpperCase()}
          </div>
          <div style={{ display: "flex", gap: "32px", marginTop: "8px" }}>
            {joinedDate && (
              <div className="ed-tenure">
                {joinedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                <span>Date Joined</span>
              </div>
            )}
            <div className="ed-tenure">
              {tenure}
              <span>Tenure</span>
            </div>
          </div>
        </div>
      </div>

      {/* TOP GRID: Personal Info + Leave/Info */}
      <div className="ed-grid">
        {/* PERSONAL INFO */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div className="ed-card-title"><i className="ti ti-user-square"></i> Personal Information</div>
            <button className="ed-btn" style={{padding: "6px 12px", fontSize: "11px", borderRadius: "8px"}} onClick={onEdit}><i className="ti ti-pencil"></i> Edit</button>
          </div>
          <div className="ed-info-grid">
            <div className="ed-info-item"><div className="lbl">Full Name</div><div className="val">{emp.name || "—"}</div></div>
            <div className="ed-info-item"><div className="lbl">Employee ID</div><div className="val" style={{color: "var(--teal)"}}>{empId}</div></div>
            <div className="ed-info-item"><div className="lbl">Role</div><div className="val">{emp.role || "—"}</div></div>
            <div className="ed-info-item"><div className="lbl">Department</div><div className="val">{emp.department || "—"}</div></div>
            <div className="ed-info-item"><div className="lbl">Email</div><div className="val">{emp.email || "—"}</div></div>
            <div className="ed-info-item"><div className="lbl">Phone</div><div className="val">{emp.phone || "—"}</div></div>
            <div className="ed-info-item"><div className="lbl">Date Joined</div><div className="val">{joinedDate ? joinedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "—"}</div></div>
            <div className="ed-info-item"><div className="lbl">Employment Type</div><div className="val">{emp.employmentType || emp.type || "Full-Time"}</div></div>
            {emp.salary && <div className="ed-info-item"><div className="lbl">Salary</div><div className="val">₹{Number(emp.salary).toLocaleString()}</div></div>}
            {emp.address && <div className="ed-info-item"><div className="lbl">Address</div><div className="val">{emp.address}</div></div>}
          </div>
        </div>

        {/* LEAVE REQUESTS */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div className="ed-card-title"><i className="ti ti-calendar-event"></i> Leave Requests</div>
            <span style={{fontSize: "11px", fontWeight: "700", color: "var(--text-muted)"}}>
              {(emp.leaveRequests || []).filter(l => l.status === 'pending').length} pending
            </span>
          </div>
          {(emp.leaveRequests || []).length === 0 ? (
            <div className="ed-empty"><i className="ti ti-calendar-off" style={{fontSize: 24, display: 'block', marginBottom: 8}}></i>No leave requests</div>
          ) : (
            <table className="ed-table">
              <thead><tr><th>Type</th><th>Dates</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {(emp.leaveRequests || []).map((leave, i) => (
                  <tr key={i}>
                    <td>{leave.type || leave.leaveType || "Leave"}</td>
                    <td style={{color: "var(--text-muted)", fontSize: "11px"}}>
                      {leave.startDate ? new Date(leave.startDate).toLocaleDateString('en-GB', {day:'2-digit', month:'short'}) : ""}
                      {leave.endDate && leave.endDate !== leave.startDate ? ` – ${new Date(leave.endDate).toLocaleDateString('en-GB', {day:'2-digit', month:'short'})}` : ""}
                    </td>
                    <td>
                      <span style={{
                        background: leave.status === 'approved' ? '#ECFDF5' : leave.status === 'rejected' ? '#FEF2F2' : '#FFFBEB',
                        color: leave.status === 'approved' ? 'var(--success)' : leave.status === 'rejected' ? 'var(--danger)' : 'var(--warning)',
                        padding: "4px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: "800", textTransform: "capitalize"
                      }}>{leave.status || "Pending"}</span>
                    </td>
                    <td>
                      {(!leave.status || leave.status === 'pending') ? (
                        <>
                          <button className="ed-btn" style={{padding: "4px 8px", fontSize: "10px", background: "#ECFDF5", color: "var(--success)", borderColor: "#D1FAE5"}}>Approve</button>
                          <button className="ed-btn" style={{padding: "4px 8px", fontSize: "10px", background: "#FEF2F2", color: "var(--danger)", borderColor: "#FEE2E2", marginLeft: "4px"}}>Reject</button>
                        </>
                      ) : <span style={{color: "var(--text-muted)"}}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* BOTTOM GRID: Projects | Tasks | Documents */}
      <div className="ed-grid" style={{ gridTemplateColumns: "1fr 1fr 1.2fr" }}>

        {/* ASSIGNED PROJECTS */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div className="ed-card-title"><i className="ti ti-briefcase"></i> Assigned Projects</div>
            <span style={{fontSize: "12px", fontWeight: "800", color: "var(--teal)"}}>{activeProjects.length} active</span>
          </div>
          {projects.length === 0 ? (
            <div className="ed-empty"><i className="ti ti-briefcase-off" style={{fontSize: 24, display: 'block', marginBottom: 8}}></i>No projects assigned</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {projects.map((proj, i) => {
                const pc = projColors[i % projColors.length];
                const ic = projIcons[i % projIcons.length];
                const perc = proj.progress || proj.percentage || proj.completion || 0;
                const status = proj.status || (perc === 100 ? 'Completed' : 'In Progress');
                return (
                  <div key={proj._id || i} className="ed-proj-item" onClick={() => onViewProject && onViewProject(proj)}>
                    <div className="ed-proj-info">
                      <div className="ed-proj-icon" style={{background: pc.bg, color: pc.color}}><i className={`ti ${ic}`}></i></div>
                      <div>
                        <div className="ed-proj-name">{proj.name || proj.projectName || "Project"}</div>
                        <div className="ed-proj-role">{proj.role || proj.memberRole || "Member"}</div>
                      </div>
                    </div>
                    <div className="ed-proj-stat">
                      <div className="ed-proj-perc" style={{color: pc.color}}>{perc}%</div>
                      <div className="ed-proj-lbl">{status}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {projects.length > 0 && (
            <div className="ed-progress-group" style={{marginTop: "16px", marginBottom: 0}}>
              <div className="ed-progress-header"><span>Overall Workload</span><span>{totalWorkload}%</span></div>
              <div className="ed-progress-bar"><div className="ed-progress-fill" style={{width: `${totalWorkload}%`, background: "var(--teal)"}}></div></div>
            </div>
          )}
        </div>

        {/* TASKS */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div className="ed-card-title"><i className="ti ti-checkbox"></i> Tasks</div>
            <span style={{fontSize: "11px", fontWeight: "700", color: "var(--text-muted)"}}>
              {pendingTasks.length} pending &nbsp;
              <button className="ed-btn" style={{padding: "6px 12px", background: "var(--teal)", color: "#fff", border: "none", fontSize: "11px", borderRadius: "8px"}}>
                <i className="ti ti-plus"></i> Assign Task
              </button>
            </span>
          </div>
          <div style={{display: "flex", gap: "16px", marginBottom: "16px", borderBottom: "1.5px solid var(--border)"}}>
            <div className={`ed-tab ${taskTab === 'all' ? 'active' : ''}`} onClick={() => setTaskTab('all')}>All</div>
            <div className={`ed-tab ${taskTab === 'pending' ? 'active' : ''}`} onClick={() => setTaskTab('pending')}>Pending</div>
            <div className={`ed-tab ${taskTab === 'completed' ? 'active' : ''}`} onClick={() => setTaskTab('completed')}>Completed</div>
          </div>
          {filteredTasks.length === 0 ? (
            <div className="ed-empty"><i className="ti ti-checkbox" style={{fontSize: 24, display: 'block', marginBottom: 8}}></i>No tasks</div>
          ) : (
            <div>
              {filteredTasks.map((task, i) => {
                const done = task.completed || task.done || task.status === 'completed';
                const overdue = !done && isOverdue(task.dueDate || task.due);
                const priority = task.priority || task.tag || 'mid';
                const tagStyle = getPriorityStyle(priority);
                return (
                  <div key={task._id || i} className="ed-task-item">
                    <div className={`ed-task-cb ${done ? 'done' : ''}`}>
                      {done && <i className="ti ti-check" style={{fontSize: 12}}></i>}
                    </div>
                    <div className="ed-task-content">
                      <div className={`ed-task-title ${done ? 'done' : ''}`}>{task.title || task.taskName || "Task"}</div>
                      <div className="ed-task-due" style={{color: overdue ? 'var(--danger)' : '#64748B'}}>
                        {overdue ? 'Overdue - ' : 'Due: '}
                        {formatDue(task.dueDate || task.due)}
                      </div>
                    </div>
                    <div className="ed-task-tag" style={tagStyle}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</div>
                    <i className="ti ti-x" style={{color: "var(--text-muted)", cursor: "pointer"}}></i>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DOCUMENTS */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div className="ed-card-title"><i className="ti ti-folder"></i> Documents</div>
            <button className="ed-btn" style={{padding: "6px 14px", fontSize: "11px", borderRadius: "8px", background: "var(--teal)", color: "#fff", border: "none"}}>
              <i className="ti ti-download"></i> Request Document
            </button>
          </div>
          <div className="ed-docs-sub">
            Uploaded Documents <span>{docsToShow.length}</span>
          </div>
          {empDocsLoading ? (
            <div className="ed-empty"><i className="ti ti-loader-2" style={{fontSize: 24, display: 'block', marginBottom: 8}}></i>Loading documents...</div>
          ) : docsToShow.length === 0 ? (
            <div className="ed-empty"><i className="ti ti-folder-off" style={{fontSize: 24, display: 'block', marginBottom: 8}}></i>No documents uploaded</div>
          ) : (
            <div className="ed-docs-list">
              {docsToShow.map((doc, i) => {
                const ds = getDocStyle(doc);
                const docName = doc.name || doc.documentName || doc.fileName || "Document";
                const docMeta = doc.type || doc.documentType || doc.category || "";
                const uploadDate = doc.uploadedAt || doc.createdAt;
                const metaStr = [uploadDate ? new Date(uploadDate).toLocaleDateString('en-GB', {month:'short', year:'numeric'}) : "", docMeta, "PDF"].filter(Boolean).join(' · ');
                return (
                  <div key={doc._id || i} className="ed-doc-row">
                    <div className="ed-doc-icon" style={{background: ds.bg, color: ds.color}}><i className={`ti ${ds.icon}`}></i></div>
                    <div className="ed-doc-info">
                      <div className="ed-doc-name">{docName}</div>
                      <div className="ed-doc-meta">{metaStr}</div>
                    </div>
                    <div className="ed-doc-actions">
                      {doc.url && <button className="ed-doc-btn view" onClick={() => window.open(doc.url, '_blank')}><i className="ti ti-eye" style={{fontSize:12}}></i> View</button>}
                      {doc.url && <button className="ed-doc-btn download" onClick={() => { const a = document.createElement('a'); a.href = doc.url; a.download = docName; a.click(); }}><i className="ti ti-download" style={{fontSize:12}}></i> Download</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>{/* END BOTTOM GRID */}

      {/* DANGER ZONE */}
      <div style={{ background: "#FFF5F5", border: "1px solid #FFE4E4", borderRadius: "10px", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
        <div>
          <div style={{ color: "#DC2626", fontWeight: "800", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <i className="ti ti-alert-triangle" style={{fontSize: "14px"}}></i> Danger Zone
          </div>
          <div style={{ color: "#9CA3AF", fontSize: "12px", fontWeight: "500" }}>
            Deactivating revokes all access. Deletion is permanent and cannot be undone.
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="ed-btn" style={{ background: "#FEF9EC", color: "#D97706", border: "1px solid #FDE68A", fontSize: "12px", padding: "6px 14px" }}><i className="ti ti-user-x"></i> Deactivate</button>
          <button className="ed-btn" style={{ background: "#FFF1F1", color: "#DC2626", border: "1px solid #FECACA", fontSize: "12px", padding: "6px 14px" }} onClick={onDelete}><i className="ti ti-trash"></i> Delete Employee</button>
        </div>
      </div>

    </div>
  );
}
