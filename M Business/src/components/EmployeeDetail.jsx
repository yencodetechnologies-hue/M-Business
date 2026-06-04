import React from 'react';
import { DOC_TYPES } from './EmployeeProfilePanel';

export default function EmployeeDetail({ emp, onBack, onEdit, onDelete, empDocs, empDocsLoading }) {
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
        .ed-back-btn { width: 40px; height: 40px; border-radius: 12px; border: 1.5px solid var(--border); background: var(--card); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--teal); font-size: 18px; transition: all 0.2s; }
        .ed-back-btn:hover { border-color: var(--teal); background: #F0FDFE; }
        .ed-title { font-size: 20px; font-weight: 900; line-height: 1.2; }
        .ed-subtitle { font-size: 12px; color: var(--text-muted); font-weight: 600; }
        .ed-actions { display: flex; gap: 12px; }
        .ed-btn { padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 800; cursor: pointer; border: 1.5px solid var(--border); background: var(--card); color: var(--text); display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .ed-btn:hover { border-color: var(--text-muted); }
        .ed-btn.danger { color: var(--danger); border-color: #FECACA; background: #FEF2F2; }
        .ed-btn.danger:hover { background: #FEE2E2; }
        .ed-btn.warning { color: var(--warning); border-color: #FDE68A; background: #FFFBEB; }

        .ed-hero { background: var(--card); border-radius: 20px; border: 1.5px solid var(--border); padding: 24px 32px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
        .ed-hero::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 5px; background: linear-gradient(90deg, var(--teal), #00e5ff, transparent); }
        .ed-hero-left { display: flex; align-items: center; gap: 24px; }
        .ed-avatar { width: 84px; height: 84px; border-radius: 50%; background: linear-gradient(135deg, var(--teal), #0097a7); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 32px; font-weight: 900; box-shadow: 0 8px 24px rgba(0,188,212,0.25); border: 4px solid #fff; flex-shrink: 0; }
        .ed-name { font-size: 26px; font-weight: 900; margin-bottom: 6px; }
        .ed-roles { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--text-muted); font-weight: 700; margin-bottom: 12px; }
        .ed-badge { background: #F1F5F9; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; color: var(--text-muted); border: 1px solid var(--border); }
        .ed-contacts { display: flex; gap: 20px; font-size: 13px; color: var(--text-muted); font-weight: 600; }
        .ed-contacts span { display: flex; align-items: center; gap: 6px; }
        .ed-contacts i { color: var(--teal); font-size: 15px; }
        .ed-hero-right { text-align: right; display: flex; flexDirection: column; gap: 16px; align-items: flex-end; }
        .ed-status { display: inline-flex; align-items: center; gap: 6px; background: #ECFDF5; color: var(--success); padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 800; border: 1px solid #A7F3D0; }
        .ed-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .ed-tenure { font-size: 14px; font-weight: 900; color: var(--text); }
        .ed-tenure span { display: block; font-size: 11px; font-weight: 700; color: var(--text-muted); margin-top: 2px; }

        .ed-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        .ed-card { background: var(--card); border: 1.5px solid var(--border); border-radius: 16px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.02); }
        .ed-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .ed-card-title { font-size: 15px; font-weight: 900; display: flex; align-items: center; gap: 8px; }
        .ed-card-title i { color: var(--teal); font-size: 18px; }
        
        .ed-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .ed-info-item .lbl { font-size: 10px; font-weight: 900; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .ed-info-item .val { font-size: 14px; font-weight: 800; color: var(--text); word-break: break-all; }

        .ed-att-blocks { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .ed-att-block { background: #F8FAFC; border: 1px solid var(--border); border-radius: 12px; padding: 16px 10px; text-align: center; }
        .ed-att-val { font-size: 24px; font-weight: 900; margin-bottom: 4px; }
        .ed-att-lbl { font-size: 11px; font-weight: 700; color: var(--text-muted); }

        .ed-progress-group { margin-bottom: 16px; }
        .ed-progress-header { display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; margin-bottom: 8px; color: var(--text); }
        .ed-progress-bar { height: 6px; background: #F1F5F9; border-radius: 10px; overflow: hidden; }
        .ed-progress-fill { height: "100%"; border-radius: 10px; }

        .ed-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .ed-table th { text-align: left; padding: 8px 0; font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; border-bottom: 1.5px solid var(--border); }
        .ed-table td { padding: 12px 0; font-size: 13px; font-weight: 700; border-bottom: 1px solid #F1F5F9; }
        .ed-table tr:last-child td { border-bottom: none; }

        .ed-proj-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #F1F5F9; }
        .ed-proj-info { display: flex; align-items: center; gap: 12px; }
        .ed-proj-icon { width: 36px; height: 36px; border-radius: 10px; background: #F0FDFE; color: var(--teal); display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .ed-proj-name { font-size: 14px; font-weight: 800; }
        .ed-proj-role { font-size: 11px; font-weight: 700; color: var(--text-muted); }
        .ed-proj-stat { text-align: right; }
        .ed-proj-perc { font-size: 14px; font-weight: 900; color: var(--teal); }
        .ed-proj-lbl { font-size: 11px; font-weight: 700; color: var(--text-muted); }

        .ed-task-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #F1F5F9; }
        .ed-task-cb { width: 18px; height: 18px; border-radius: 4px; border: 2px solid var(--teal); display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; }
        .ed-task-cb.done { background: var(--teal); }
        .ed-task-content { flex: 1; }
        .ed-task-title { font-size: 13px; font-weight: 800; margin-bottom: 2px; }
        .ed-task-title.done { text-decoration: line-through; color: var(--text-muted); }
        .ed-task-due { font-size: 11px; font-weight: 700; color: var(--text-muted); }
        .ed-task-tag { padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 800; }

        .ed-docs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ed-doc-card { border: 1.5px solid var(--border); border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s; background: #fff; }
        .ed-doc-card:hover { border-color: var(--teal); box-shadow: 0 4px 12px rgba(0,188,212,0.08); }
        .ed-doc-icon { width: 36px; height: 36px; border-radius: 8px; background: #F8FAFC; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .ed-doc-info { flex: 1; }
        .ed-doc-name { font-size: 13px; font-weight: 800; }
        .ed-doc-meta { font-size: 10px; font-weight: 700; color: var(--text-muted); }
        .ed-doc-add { border: 1.5px dashed var(--teal); background: #F0FDFE; color: var(--teal); justify-content: center; flex-direction: column; gap: 4px; padding: 16px; }
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
            <div className="ed-progress-bar"><div className="ed-progress-fill" style={{width: "28%", background: "var(--warning)"}}></div></div>
          </div>

          <div style={{fontSize: "12px", fontWeight: "800", marginTop: "20px", display: "flex", alignItems: "center", gap: "6px"}}><i className="ti ti-plane-departure" style={{color: "var(--teal)"}}></i> Leave Requests</div>
          <table className="ed-table">
            <thead><tr><th>Type</th><th>Dates</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td>Sick Leave</td><td>10–11 Jun</td><td><span className="ed-badge" style={{color: "var(--warning)", background: "#FFFBEB", borderColor: "#FDE68A"}}>Pending</span></td><td><span style={{color: "var(--success)", fontWeight: 800, cursor: "pointer", marginRight: 8}}>Approve</span><span style={{color: "var(--danger)", fontWeight: 800, cursor: "pointer"}}>Reject</span></td></tr>
              <tr><td>Annual Leave</td><td>20–22 May</td><td><span className="ed-badge" style={{color: "var(--success)", background: "#ECFDF5", borderColor: "#A7F3D0"}}>Approved</span></td><td>—</td></tr>
              <tr><td>Casual Leave</td><td>02 Apr</td><td><span className="ed-badge" style={{color: "var(--danger)", background: "#FEF2F2", borderColor: "#FECACA"}}>Rejected</span></td><td>—</td></tr>
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
              <div className="ed-proj-info"><div className="ed-proj-icon"><i className="ti ti-world"></i></div><div><div className="ed-proj-name">Website Redesign</div><div className="ed-proj-role">Lead Developer</div></div></div>
              <div className="ed-proj-stat"><div className="ed-proj-perc">72%</div><div className="ed-proj-lbl">In Progress</div></div>
            </div>
            <div className="ed-proj-item">
              <div className="ed-proj-info"><div className="ed-proj-icon" style={{background: "#EFF6FF", color: "#3B82F6"}}><i className="ti ti-device-mobile"></i></div><div><div className="ed-proj-name">Mobile App v2</div><div className="ed-proj-role">Backend Dev</div></div></div>
              <div className="ed-proj-stat"><div className="ed-proj-perc" style={{color: "#3B82F6"}}>45%</div><div className="ed-proj-lbl">In Progress</div></div>
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
            <span style={{fontSize: "11px", fontWeight: "700", color: "var(--text-muted)"}}>4 pending</span>
          </div>
          <div>
            <div className="ed-task-item">
              <div className="ed-task-cb done"><i className="ti ti-check" style={{fontSize: 12}}></i></div>
              <div className="ed-task-content"><div className="ed-task-title done">API integration for billing</div><div className="ed-task-due">Due: 01 Jun</div></div>
              <div className="ed-task-tag" style={{background: "#ECFDF5", color: "var(--success)"}}>Low</div>
            </div>
            <div className="ed-task-item">
              <div className="ed-task-cb"></div>
              <div className="ed-task-content"><div className="ed-task-title">Fix checkout page bug</div><div className="ed-task-due">Due: 06 Jun</div></div>
              <div className="ed-task-tag" style={{background: "#FEF2F2", color: "var(--danger)"}}>High</div>
            </div>
            <div className="ed-task-item">
              <div className="ed-task-cb"></div>
              <div className="ed-task-content"><div className="ed-task-title">Write unit tests for auth</div><div className="ed-task-due">Due: 08 Jun</div></div>
              <div className="ed-task-tag" style={{background: "#FFFBEB", color: "var(--warning)"}}>Mid</div>
            </div>
            <div className="ed-task-item">
              <div className="ed-task-cb"></div>
              <div className="ed-task-content"><div className="ed-task-title">Update product catalogue DB</div><div className="ed-task-due">Due: 10 Jun</div></div>
              <div className="ed-task-tag" style={{background: "#FFFBEB", color: "var(--warning)"}}>Mid</div>
            </div>
            <div className="ed-task-item" style={{borderBottom: "none"}}>
              <div className="ed-task-cb"></div>
              <div className="ed-task-content"><div className="ed-task-title">Code review for PR #47</div><div className="ed-task-due">Due: 12 Jun</div></div>
              <div className="ed-task-tag" style={{background: "#ECFDF5", color: "var(--success)"}}>Low</div>
            </div>
          </div>
        </div>

        {/* DOCUMENTS */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div className="ed-card-title"><i className="ti ti-folder"></i> Documents</div>
            <button className="ed-btn" style={{padding: "6px 12px", fontSize: "11px", borderRadius: "8px"}}><i className="ti ti-upload"></i> Upload</button>
          </div>
          <div className="ed-docs-grid">
            {DOC_TYPES.slice(0, 4).map((dt, i) => {
              const doc = empDocs?.[dt.key];
              const hasDoc = !!doc?.url;
              return (
                <div key={dt.key} className="ed-doc-card" onClick={() => hasDoc && window.open(doc.url, "_blank")} style={{opacity: hasDoc ? 1 : 0.7}}>
                  <div className="ed-doc-icon" style={{color: hasDoc ? dt.color : "var(--text-muted)"}}>
                    {hasDoc ? <i className="ti ti-file-check"></i> : <i className="ti ti-file-text"></i>}
                  </div>
                  <div className="ed-doc-info">
                    <div className="ed-doc-name">{dt.label}</div>
                    <div className="ed-doc-meta">{hasDoc ? "Uploaded · PDF" : "Missing"}</div>
                  </div>
                  {hasDoc && <i className="ti ti-download" style={{color: "var(--text-muted)", fontSize: 16}}></i>}
                </div>
              );
            })}
            <div className="ed-doc-card ed-doc-add">
              <i className="ti ti-plus" style={{fontSize: 24}}></i>
              <div style={{fontSize: 12, fontWeight: 800}}>Add Document</div>
              <div style={{fontSize: 10, fontWeight: 700, color: "var(--teal)", opacity: 0.8}}>Upload new</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
