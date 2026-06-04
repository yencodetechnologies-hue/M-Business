import React from 'react';
import { DOC_TYPES } from './EmployeeProfilePanel';

export default function EmployeeDetail({ emp, onBack, onEdit, onDelete, empDocs, empDocsLoading, projects = [], tasks = [], onViewProject }) {
  if (!emp) return null;

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isImg = (url = "") => /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.startsWith("data:image");

  const empId = emp.employeeId || emp._id?.substring(0, 6).toUpperCase() || "EMP-001";
  
  // Tenure calculation
  const joinedDate = emp.joiningDate ? new Date(emp.joiningDate) : (emp.createdAt ? new Date(emp.createdAt) : new Date());
  const now = new Date();
  const diffTime = Math.abs(now - joinedDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  const tenure = years > 0 ? `${years} yr ${months} mo` : `${months} mo`;

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

        .ed-att-blocks { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .ed-att-block { background: #F1F5F9; border-radius: 12px; padding: 16px 10px; text-align: center; border: none; }
        .ed-att-val { font-size: 24px; font-weight: 900; margin-bottom: 4px; }
        .ed-att-lbl { font-size: 11px; font-weight: 700; color: #64748B; }

        .ed-progress-group { margin-bottom: 16px; }
        .ed-progress-header { display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; margin-bottom: 8px; color: #475569; }
        .ed-progress-bar { height: 6px; background: #E2E8F0; border-radius: 10px; overflow: hidden; }
        .ed-progress-fill { height: 100%; border-radius: 10px; }

        .ed-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .ed-table th { text-align: left; padding: 8px 0; font-size: 10px; font-weight: 800; color: #94A3B8; text-transform: uppercase; border-bottom: 1px solid var(--border); }
        .ed-table td { padding: 12px 0; font-size: 12px; font-weight: 700; color: #334155; border-bottom: 1px solid #F1F5F9; }
        .ed-table tr:last-child td { border-bottom: none; }

        .ed-proj-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #F1F5F9; }
        .ed-proj-info { display: flex; align-items: center; gap: 12px; }
        .ed-proj-icon { width: 36px; height: 36px; border-radius: 8px; background: #F0FDFE; color: var(--teal); display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .ed-proj-name { font-size: 13px; font-weight: 800; color: #0F172A; }
        .ed-proj-role { font-size: 11px; font-weight: 600; color: #64748B; }
        .ed-proj-stat { text-align: right; }
        .ed-proj-perc { font-size: 13px; font-weight: 900; color: var(--teal); }
        .ed-proj-lbl { font-size: 11px; font-weight: 600; color: #64748B; }

        .ed-task-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #F1F5F9; }
        .ed-task-cb { width: 16px; height: 16px; border-radius: 4px; border: 2px solid var(--teal); display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; }
        .ed-task-cb.done { background: var(--teal); }
        .ed-task-content { flex: 1; }
        .ed-task-title { font-size: 12px; font-weight: 800; margin-bottom: 2px; color: #0F172A; }
        .ed-task-title.done { text-decoration: line-through; color: #94A3B8; }
        .ed-task-due { font-size: 10px; font-weight: 700; color: #64748B; }
        .ed-task-tag { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; }

        .ed-docs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ed-doc-card { background: #F8FAFC; border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s; border: none; }
        .ed-doc-card:hover { background: #F1F5F9; }
        .ed-doc-icon { width: 32px; height: 32px; border-radius: 6px; background: #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; }
        .ed-doc-info { flex: 1; }
        .ed-doc-name { font-size: 12px; font-weight: 800; color: #0F172A; }
        .ed-doc-meta { font-size: 10px; font-weight: 600; color: #64748B; }
        .ed-doc-add { border: 1px dashed var(--teal); background: #F0FDFE; color: var(--teal); justify-content: center; flex-direction: column; gap: 4px; padding: 16px; }
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
              <span><i className="ti ti-mail"></i> {emp.email || "No email"}</span>
              <span><i className="ti ti-phone"></i> {emp.phone || "No phone"}</span>
              <span><i className="ti ti-map-pin"></i> {emp.address || "No Address"}</span>
            </div>
          </div>
        </div>
        <div className="ed-hero-right">
          <div className="ed-status">
            <div className="ed-status-dot"></div> {(emp.status || "Active").toUpperCase()}
          </div>
          <div style={{ display: "flex", gap: "32px", marginTop: "8px" }}>
            <div className="ed-tenure">
              {joinedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              <span>Date Joined</span>
            </div>
            <div className="ed-tenure">
              {tenure}
              <span>Tenure</span>
            </div>
          </div>
        </div>
      </div>

      {/* TOP GRID */}
      <div className="ed-grid">
        {/* PERSONAL INFO */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div className="ed-card-title"><i className="ti ti-user-square"></i> Personal Information</div>
            <button className="ed-btn" style={{padding: "6px 12px", fontSize: "11px", borderRadius: "8px"}} onClick={onEdit}><i className="ti ti-pencil"></i> Edit</button>
          </div>
          <div className="ed-info-grid">
            <div className="ed-info-item"><div className="lbl">Full Name</div><div className="val">{emp.name}</div></div>
            <div className="ed-info-item"><div className="lbl">Employee ID</div><div className="val" style={{color: "var(--teal)"}}>{empId}</div></div>
            <div className="ed-info-item"><div className="lbl">Role</div><div className="val">{emp.role || "—"}</div></div>
            <div className="ed-info-item"><div className="lbl">Department</div><div className="val">{emp.department || "—"}</div></div>
            <div className="ed-info-item"><div className="lbl">Email</div><div className="val">{emp.email || "—"}</div></div>
            <div className="ed-info-item"><div className="lbl">Phone</div><div className="val">{emp.phone || "—"}</div></div>
            <div className="ed-info-item"><div className="lbl">Date Joined</div><div className="val">{joinedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div></div>
            <div className="ed-info-item"><div className="lbl">Employment Type</div><div className="val">Full-Time</div></div>
          </div>
        </div>

        {/* ATTENDANCE & LEAVE (Mock Data to match template) */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div className="ed-card-title"><i className="ti ti-calendar-event"></i> Attendance & Leave</div>
            <span style={{fontSize: "11px", fontWeight: "700", color: "var(--text-muted)"}}>This Month</span>
          </div>
          <div className="ed-att-blocks">
            <div className="ed-att-block"><div className="ed-att-val" style={{color: "var(--success)"}}>22</div><div className="ed-att-lbl">Present</div></div>
            <div className="ed-att-block"><div className="ed-att-val" style={{color: "var(--danger)"}}>2</div><div className="ed-att-lbl">Absent</div></div>
            <div className="ed-att-block"><div className="ed-att-val" style={{color: "var(--warning)"}}>1</div><div className="ed-att-lbl">On Leave</div></div>
            <div className="ed-att-block"><div className="ed-att-val" style={{color: "var(--teal)"}}>3</div><div className="ed-att-lbl">WFH</div></div>
          </div>
          
          <div className="ed-progress-group">
            <div className="ed-progress-header"><span>Attendance Rate</span><span>88%</span></div>
            <div className="ed-progress-bar"><div className="ed-progress-fill" style={{width: "88%", background: "var(--success)"}}></div></div>
          </div>
          <div className="ed-progress-group">
            <div className="ed-progress-header"><span>Leave Used</span><span>5 / 18 days</span></div>
            <div className="ed-progress-bar"><div className="ed-progress-fill" style={{width: "30%", background: "var(--warning)"}}></div></div>
          </div>

          <div style={{fontSize: "12px", fontWeight: "800", marginTop: "20px", display: "flex", alignItems: "center", gap: "6px"}}><i className="ti ti-plane-departure" style={{color: "var(--teal)"}}></i> Leave Requests</div>
          <table className="ed-table">
            <thead><tr><th>Type</th><th>Dates</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              <tr>
                <td>Sick Leave</td>
                <td style={{color: "var(--text-muted)", fontSize: "11px"}}>10–11 Jun</td>
                <td><span style={{background: "#FFFBEB", color: "var(--warning)", padding: "4px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: "800"}}>Pending</span></td>
                <td><button className="ed-btn" style={{padding: "4px 8px", fontSize: "10px", background: "#ECFDF5", color: "var(--success)", borderColor: "#D1FAE5"}}>Approve</button> <button className="ed-btn" style={{padding: "4px 8px", fontSize: "10px", background: "#FEF2F2", color: "var(--danger)", borderColor: "#FEE2E2", marginLeft: "4px"}}>Reject</button></td>
              </tr>
              <tr>
                <td>Annual Leave</td>
                <td style={{color: "var(--text-muted)", fontSize: "11px"}}>20–22 May</td>
                <td><span style={{background: "#ECFDF5", color: "var(--success)", padding: "4px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: "800"}}>Approved</span></td>
                <td style={{color: "var(--text-muted)"}}>—</td>
              </tr>
              <tr>
                <td>Casual Leave</td>
                <td style={{color: "var(--text-muted)", fontSize: "11px"}}>02 Apr</td>
                <td><span style={{background: "#FEF2F2", color: "var(--danger)", padding: "4px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: "800"}}>Rejected</span></td>
                <td style={{color: "var(--text-muted)"}}>—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* BOTTOM GRID */}
      <div className="ed-grid" style={{ gridTemplateColumns: "1fr 1fr 1.2fr" }}>
        {/* ASSIGNED PROJECTS */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div className="ed-card-title"><i className="ti ti-briefcase"></i> Assigned Projects</div>
            <span style={{fontSize: "12px", fontWeight: "800", color: "var(--teal)"}}>3 active</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div className="ed-proj-item">
              <div className="ed-proj-info"><div className="ed-proj-icon" style={{background: "#F0FDFE", color: "var(--teal)"}}><i className="ti ti-world"></i></div><div><div className="ed-proj-name">Mankatha Website</div><div className="ed-proj-role">Lead Developer</div></div></div>
              <div className="ed-proj-stat"><div className="ed-proj-perc">72%</div><div className="ed-proj-lbl">In Progress</div></div>
            </div>
            <div className="ed-proj-item">
              <div className="ed-proj-info"><div className="ed-proj-icon" style={{background: "#EEF2FF", color: "#6366F1"}}><i className="ti ti-device-mobile"></i></div><div><div className="ed-proj-name">Mobile App v2</div><div className="ed-proj-role">Backend Dev</div></div></div>
              <div className="ed-proj-stat"><div className="ed-proj-perc" style={{color: "#6366F1"}}>45%</div><div className="ed-proj-lbl">In Progress</div></div>
            </div>
            <div className="ed-proj-item" style={{borderBottom: "none"}}>
              <div className="ed-proj-info"><div className="ed-proj-icon" style={{background: "#ECFDF5", color: "var(--success)"}}><i className="ti ti-chart-bar"></i></div><div><div className="ed-proj-name">Analytics Dashboard</div><div className="ed-proj-role">Contributor</div></div></div>
              <div className="ed-proj-stat"><div className="ed-proj-perc" style={{color: "var(--success)"}}>100%</div><div className="ed-proj-lbl">Completed</div></div>
            </div>
          </div>
          <div className="ed-progress-group" style={{marginTop: "16px", marginBottom: 0}}>
            <div className="ed-progress-header"><span>Overall Workload</span><span>68%</span></div>
            <div className="ed-progress-bar"><div className="ed-progress-fill" style={{width: "68%", background: "var(--teal)"}}></div></div>
          </div>
        </div>

        {/* TASKS */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div className="ed-card-title"><i className="ti ti-checkbox"></i> Tasks</div>
            <span style={{fontSize: "11px", fontWeight: "700", color: "var(--text-muted)"}}>4 pending &nbsp; <button className="ed-btn" style={{padding: "6px 12px", background: "var(--teal)", color: "#fff", border: "none", fontSize: "11px", borderRadius: "8px"}}><i className="ti ti-plus"></i> Assign Task</button></span>
          </div>
          <div style={{display: "flex", gap: "16px", marginBottom: "16px", borderBottom: "1.5px solid var(--border)"}}>
            <div style={{fontSize: "12px", fontWeight: "800", color: "var(--teal)", borderBottom: "2px solid var(--teal)", paddingBottom: "8px"}}>All</div>
            <div style={{fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", paddingBottom: "8px"}}>Pending</div>
            <div style={{fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", paddingBottom: "8px"}}>Completed</div>
          </div>
          <div>
            <div className="ed-task-item">
              <div className="ed-task-cb done"><i className="ti ti-check" style={{fontSize: 12}}></i></div>
              <div className="ed-task-content">
                <div className="ed-task-title done">API integration for billing</div>
                <div className="ed-task-due" style={{color: "var(--danger)"}}>Overdue - 01 Jun</div>
              </div>
              <div className="ed-task-tag" style={{background: "#ECFDF5", color: "var(--success)"}}>Low</div>
              <i className="ti ti-x" style={{color: "var(--text-muted)", cursor: "pointer"}}></i>
            </div>
            <div className="ed-task-item">
              <div className="ed-task-cb"></div>
              <div className="ed-task-content">
                <div className="ed-task-title">Fix checkout page bug</div>
                <div className="ed-task-due">Due: 06 Jun</div>
              </div>
              <div className="ed-task-tag" style={{background: "#FEF2F2", color: "var(--danger)"}}>High</div>
              <i className="ti ti-x" style={{color: "var(--text-muted)", cursor: "pointer"}}></i>
            </div>
            <div className="ed-task-item">
              <div className="ed-task-cb"></div>
              <div className="ed-task-content">
                <div className="ed-task-title">Write unit tests for auth</div>
                <div className="ed-task-due">Due: 08 Jun</div>
              </div>
              <div className="ed-task-tag" style={{background: "#FFFBEB", color: "var(--warning)"}}>Mid</div>
              <i className="ti ti-x" style={{color: "var(--text-muted)", cursor: "pointer"}}></i>
            </div>
            <div className="ed-task-item">
              <div className="ed-task-cb"></div>
              <div className="ed-task-content">
                <div className="ed-task-title">Update product catalogue DB</div>
                <div className="ed-task-due">Due: 10 Jun</div>
              </div>
              <div className="ed-task-tag" style={{background: "#FFFBEB", color: "var(--warning)"}}>Mid</div>
              <i className="ti ti-x" style={{color: "var(--text-muted)", cursor: "pointer"}}></i>
            </div>
            <div className="ed-task-item" style={{borderBottom: "none"}}>
              <div className="ed-task-cb"></div>
              <div className="ed-task-content">
                <div className="ed-task-title">Code review for PR #47</div>
                <div className="ed-task-due">Due: 12 Jun</div>
              </div>
              <div className="ed-task-tag" style={{background: "#ECFDF5", color: "var(--success)"}}>Low</div>
              <i className="ti ti-x" style={{color: "var(--text-muted)", cursor: "pointer"}}></i>
            </div>
          </div>
        </div>

        {/* DOCUMENTS */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div className="ed-card-title"><i className="ti ti-folder"></i> Documents</div>
            <button className="ed-btn" style={{padding: "6px 12px", fontSize: "11px", borderRadius: "8px"}}><i className="ti ti-upload"></i> Upload</button>
          <div className="ed-docs-grid">
            <div className="ed-doc-card">
              <div className="ed-doc-icon" style={{color: "#6366F1"}}><i className="ti ti-file-text"></i></div>
              <div className="ed-doc-info">
                <div className="ed-doc-name">Offer Letter</div>
                <div className="ed-doc-meta">Jan 2024 · PDF</div>
              </div>
              <i className="ti ti-download" style={{color: "var(--text-muted)", fontSize: 16}}></i>
            </div>
            <div className="ed-doc-card">
              <div className="ed-doc-icon" style={{color: "#0ea5e9"}}><i className="ti ti-id"></i></div>
              <div className="ed-doc-info">
                <div className="ed-doc-name">Aadhaar Card</div>
                <div className="ed-doc-meta">ID Proof · PDF</div>
              </div>
              <i className="ti ti-download" style={{color: "var(--text-muted)", fontSize: 16}}></i>
            </div>
            <div className="ed-doc-card">
              <div className="ed-doc-icon" style={{color: "#f59e0b"}}><i className="ti ti-file-certificate"></i></div>
              <div className="ed-doc-info">
                <div className="ed-doc-name">Contract</div>
                <div className="ed-doc-meta">Signed · PDF</div>
              </div>
              <i className="ti ti-download" style={{color: "var(--text-muted)", fontSize: 16}}></i>
            </div>
            <div className="ed-doc-card">
              <div className="ed-doc-icon" style={{color: "#8b5cf6"}}><i className="ti ti-certificate"></i></div>
              <div className="ed-doc-info">
                <div className="ed-doc-name">Degree Cert</div>
                <div className="ed-doc-meta">Education · PDF</div>
              </div>
              <i className="ti ti-download" style={{color: "var(--text-muted)", fontSize: 16}}></i>
            </div>
            <div className="ed-doc-card">
              <div className="ed-doc-icon" style={{color: "#ef4444"}}><i className="ti ti-file-description"></i></div>
              <div className="ed-doc-info">
                <div className="ed-doc-name">Resume</div>
                <div className="ed-doc-meta">Latest · PDF</div>
              </div>
              <i className="ti ti-download" style={{color: "var(--text-muted)", fontSize: 16}}></i>
            </div>
            <div className="ed-doc-card ed-doc-add">
              <i className="ti ti-plus" style={{fontSize: 24}}></i>
              <div style={{fontSize: 12, fontWeight: 800}}>Add Document</div>
              <div style={{fontSize: 10, fontWeight: 700, color: "var(--teal)", opacity: 0.8}}>Upload new</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
