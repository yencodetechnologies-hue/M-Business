import React from 'react';
import { DOC_TYPES } from './EmployeeProfilePanel';

export default function EmployeeDetail({ emp, onBack, onEdit, onDelete, empDocs, empDocsLoading }) {
  if (!emp) return null;

  const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  const statusClass = (emp.status || "Active").toLowerCase();

  const isImg = (url = "") => /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.startsWith("data:image");

  return (
    <div style={{
      "--teal": "#00BCD4",
      "--teal-dim": "rgba(0,188,212,0.08)",
      "--teal-mid": "rgba(0,188,212,0.15)",
      "--teal-glow": "rgba(0,188,212,0.25)",
      "--bg": "#f0f4f8",
      "--border": "#e5eaf0",
      "--border2": "#d0dae4",
      "--text": "#0f1c2e",
      "--text-mid": "#4a5568",
      "--text-soft": "#94a3b8",
      "--green": "#16a34a",
      "--green-bg": "#dcfce7",
      "--amber": "#d97706",
      "--amber-bg": "#fef3c7",
      "--red": "#dc2626",
      "--red-bg": "#fee2e2",
      "--blue": "#2563eb",
      "--blue-bg": "#dbeafe",
      "--purple": "#7c3aed",
      "--purple-bg": "#ede9fe",
      background: "var(--bg)",
      color: "var(--text)",
      fontFamily: "'Nunito', sans-serif",
      minHeight: "100%",
      display: "flex",
      flexDirection: "column",
      padding: "20px"
    }}>
      {/* INLINE CSS FOR CLASSES */}
      <style>{`
        .ed-btn { display:inline-flex; align-items:center; gap:7px; padding:8px 16px; border-radius:8px; font-family:'Nunito',sans-serif; font-size:12px; font-weight:800; cursor:pointer; border:none; transition:all 0.15s; }
        .ed-btn-teal { background:var(--teal); color:#fff; box-shadow:0 3px 10px var(--teal-glow); }
        .ed-btn-teal:hover { background:#00afc5; transform:translateY(-1px); }
        .ed-btn-outline { background:#fff; color:var(--text-mid); border:1.5px solid var(--border2); }
        .ed-btn-outline:hover { border-color:var(--teal); color:var(--teal); }
        .ed-btn-red { background:var(--red-bg); color:var(--red); border:1.5px solid rgba(220,38,38,0.15); }
        .ed-btn-red:hover { background:#fecaca; }

        .profile-hero { background:#fff; border:1px solid var(--border); border-radius:16px; padding:26px 30px; display:flex; align-items:flex-start; gap:22px; margin-bottom:20px; position:relative; overflow:hidden; box-shadow:0 1px 6px rgba(0,0,0,0.04); animation:fadeUp 0.35s ease both; }
        .profile-hero::before { content:''; position:absolute; top:0; left:0; right:0; height:4px; background:linear-gradient(90deg,var(--teal),#00e5ff,transparent); }
        .emp-big-av { width:78px; height:78px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:900; color:#fff; border:3px solid rgba(0,188,212,0.2); box-shadow:0 4px 16px rgba(0,0,0,0.1); background:linear-gradient(135deg,var(--teal),#0097a7); }
        .profile-info { flex:1; }
        .profile-name { font-size:22px; font-weight:900; color:var(--text); margin-bottom:5px; }
        .profile-sub { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:10px; }
        .profile-role { font-size:13px; color:var(--text-mid); font-weight:700; }
        .dot { color:var(--text-soft); }
        .profile-dept { font-size:13px; color:var(--teal); font-weight:800; }
        .profile-eid { font-size:11px; color:var(--text-soft); background:#f1f5f9; padding:2px 10px; border-radius:6px; font-weight:700; border:1px solid var(--border); }
        .profile-contacts { display:flex; gap:20px; flex-wrap:wrap; }
        .contact-item { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-mid); }
        .contact-item i { color:var(--teal); font-size:14px; }
        .profile-right { display:flex; flex-direction:column; align-items:flex-end; gap:10px; flex-shrink:0; }
        .status-badge { display:inline-flex; align-items:center; gap:6px; padding:5px 14px; border-radius:20px; font-size:12px; font-weight:800; }
        .status-badge.active { background:var(--green-bg); color:var(--green); }
        .status-badge.leave { background:var(--amber-bg); color:var(--amber); }
        .status-badge.inactive, .status-badge.pending { background:var(--amber-bg); color:var(--amber); }
        .status-badge.rejected { background:var(--red-bg); color:var(--red); }
        .status-dot { width:6px; height:6px; border-radius:50%; background:currentColor; }
        .joined-info { font-size:11px; color:var(--text-soft); text-align:right; line-height:1.5; }
        .joined-info strong { color:var(--text-mid); display:block; font-size:13px; }

        .detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:18px; }
        .detail-grid.three { grid-template-columns:1fr 1fr 1fr; }
        .section-card { background:#fff; border:1px solid var(--border); border-radius:14px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.04); animation:fadeUp 0.35s ease both; }
        .section-head { display:flex; align-items:center; justify-content:space-between; padding:13px 18px; border-bottom:1px solid var(--border); background:#fafbfc; }
        .section-title { font-size:13px; font-weight:900; color:var(--text); display:flex; align-items:center; gap:7px; }
        .section-title i { font-size:15px; color:var(--teal); }
        .section-body { padding:18px; }

        .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .info-item { display:flex; flex-direction:column; gap:3px; }
        .info-label { font-size:10px; font-weight:900; color:var(--text-soft); letter-spacing:1.5px; text-transform:uppercase; }
        .info-value { font-size:13px; font-weight:700; color:var(--text); word-break: break-all; }

        .doc-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .doc-item { display:flex; align-items:center; gap:10px; padding:10px 12px; background:var(--bg); border:1.5px solid var(--border); border-radius:9px; cursor:pointer; transition:border-color 0.15s; }
        .doc-item:hover { border-color:var(--teal); background:#f0fbfd; }
        .doc-ico { font-size:20px; flex-shrink:0; }
        .doc-name { font-size:12px; font-weight:800; color:var(--text); }
        .doc-meta { font-size:10px; color:var(--text-soft); }
        .doc-dl { margin-left:auto; color:var(--text-soft); font-size:15px; }
        .doc-item:hover .doc-dl { color:var(--teal); }

        @keyframes fadeUp { from {opacity:0; transform:translateY(14px)} to {opacity:1; transform:translateY(0)} }
      `}</style>

      {/* TOPBAR equivalent action area */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--teal)", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 18 }}></i> Back to Employees
        </button>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="ed-btn ed-btn-outline" onClick={onEdit}><i className="ti ti-edit"></i> Edit</button>
          <button className="ed-btn ed-btn-red" onClick={onDelete}><i className="ti ti-trash"></i> Delete</button>
        </div>
      </div>

      <div className="profile-hero">
        <div className="emp-big-av">{getInitials(emp.name)}</div>
        <div className="profile-info">
          <div className="profile-name">{emp.name}</div>
          <div className="profile-sub">
            <span className="profile-role">{emp.role || "Employee"}</span>
            <span className="dot">•</span>
            <span className="profile-dept">{emp.department || "N/A"}</span>
            <span className="dot">•</span>
            <span className="profile-eid">{emp.employeeId || emp._id?.substring(0,6).toUpperCase() || "EMP"}</span>
          </div>
          <div className="profile-contacts">
            <div className="contact-item"><i className="ti ti-mail"></i> {emp.email || "No Email"}</div>
            <div className="contact-item"><i className="ti ti-phone"></i> {emp.phone || "No Phone"}</div>
            <div className="contact-item"><i className="ti ti-map-pin"></i> {emp.address || "No Address"}</div>
          </div>
        </div>
        <div className="profile-right">
          <div className={`status-badge ${statusClass}`}>
            <div className="status-dot"></div> {emp.status || "Active"}
          </div>
          <div className="joined-info">
            Joined On
            <strong>{emp.joiningDate || (emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : "—")}</strong>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="section-card">
          <div className="section-head">
            <div className="section-title"><i className="ti ti-user"></i> Personal Information</div>
          </div>
          <div className="section-body">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Date of Birth</span>
                <span className="info-value">{emp.dateOfBirth || "—"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Marital Status</span>
                <span className="info-value">{emp.maritalStatus || "—"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Salary</span>
                <span className="info-value">{emp.salary ? `₹${emp.salary}` : "—"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="section-card">
          <div className="section-head">
            <div className="section-title"><i className="ti ti-building-bank"></i> Bank Details</div>
          </div>
          <div className="section-body">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Bank Name</span>
                <span className="info-value">{emp.bankDetails?.bankName || "—"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">IFSC Code</span>
                <span className="info-value">{emp.bankDetails?.ifscCode || "—"}</span>
              </div>
              <div className="info-item" style={{ gridColumn: "1 / -1" }}>
                <span className="info-label">Account Number</span>
                <span className="info-value">{emp.bankDetails?.accountNumber || "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-head">
          <div className="section-title">
            <i className="ti ti-files"></i> Documents
            {empDocsLoading && <span style={{ fontSize: 10, color: "var(--text-soft)", marginLeft: 10 }}>Loading...</span>}
          </div>
        </div>
        <div className="section-body">
          <div className="doc-grid">
            {DOC_TYPES.map(dt => {
              const doc = empDocs?.[dt.key];
              const hasDoc = !!doc?.url;
              return (
                <div key={dt.key} className="doc-item" onClick={() => hasDoc && window.open(doc.url, "_blank")} style={{ opacity: hasDoc ? 1 : 0.6, cursor: hasDoc ? "pointer" : "default" }}>
                  <div className="doc-ico" style={{ color: hasDoc ? dt.color : "var(--text-soft)" }}>{dt.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div className="doc-name">{dt.label}</div>
                    <div className="doc-meta">{hasDoc ? "Uploaded" : "Missing"}</div>
                  </div>
                  {hasDoc && <i className="ti ti-external-link doc-dl"></i>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
