// ═══════════════════════════════════════════════════════════════════════════════
// EmployeeProfilePanel.jsx
//
// USAGE:
//   1. Employee Dashboard → Right side panel with profile + document upload
//   2. SubAdmin Dashboard → View all employee documents
//
// In EmployeeDashboard.jsx — add inside the root layout (after Sidebar):
//   <EmployeeProfilePanel empName={empName} notify={notify} />
//
// In Dashboard.jsx (SubAdmin) — add a new nav item "Documents" and render:
//   <SubAdminDocumentsPage employees={employees} />
//
// Backend routes needed (see bottom of this file)
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const BASE = "http://localhost:5000/api/employee-dashboard";

// ── Document types config ────────────────────────────────────────────────────
const DOC_TYPES = [
  {
    key: "aadhaar",
    label: "Aadhaar Card",
    icon: "🪪",
    desc: "Government issued identity card",
    color: "#f97316",
    accept: "image/*,application/pdf",
    maxMB: 5,
  },
  {
    key: "pan",
    label: "PAN Card",
    icon: "💳",
    desc: "Permanent Account Number card",
    color: "#6366f1",
    accept: "image/*,application/pdf",
    maxMB: 5,
  },
  {
    key: "passbook",
    label: "Bank Passbook",
    icon: "🏦",
    desc: "First page of bank passbook",
    color: "#10b981",
    accept: "image/*,application/pdf",
    maxMB: 10,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const isImage = (url = "") =>
  /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.startsWith("data:image");

// ── Upload progress ring ─────────────────────────────────────────────────────
function ProgressRing({ pct, color }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;
  return (
    <svg width="44" height="44" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="22" cy="22" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
      <circle
        cx="22" cy="22" r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeDasharray={`${circ}`}
        strokeDashoffset={dash}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.3s" }}
      />
    </svg>
  );
}

// ── Single document card ─────────────────────────────────────────────────────
function DocCard({ doc, empName, onUploaded, notify }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef();

  // fetch existing doc
  useEffect(() => {
    if (!empName) return;
    const enc = encodeURIComponent(empName);
    axios
      .get(`${BASE}/documents/${enc}/${doc.key}`)
      .then((r) => {
        if (r.data?.url) setExisting(r.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [empName, doc.key]);

  const handleFile = async (file) => {
    if (!file) return;
    const limitBytes = doc.maxMB * 1024 * 1024;
    if (file.size > limitBytes) {
      notify(`File too large. Max ${doc.maxMB}MB allowed.`, "error");
      return;
    }

    // local preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("employeeName", empName);
    formData.append("docType", doc.key);

    try {
      const res = await axios.post(`${BASE}/documents/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });
      setExisting(res.data.document || { url: preview, docType: doc.key });
      notify(`${doc.label} uploaded successfully ✓`);
      if (onUploaded) onUploaded(doc.key, res.data.document);
    } catch {
      // fallback: store locally as base64 data URL
      const fallback = { url: preview, docType: doc.key, fileName: file.name, fileSize: file.size, uploadedAt: new Date().toISOString() };
      setExisting(fallback);
      notify(`${doc.label} saved locally ✓`);
      if (onUploaded) onUploaded(doc.key, fallback);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Remove uploaded ${doc.label}?`)) return;
    try {
      const enc = encodeURIComponent(empName);
      await axios.delete(`${BASE}/documents/${enc}/${doc.key}`);
    } catch {}
    setExisting(null);
    setPreview(null);
    notify(`${doc.label} removed`);
  };

  const viewUrl = existing?.url || preview;
  const hasDoc = !!viewUrl;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        border: `1.5px solid ${hasDoc ? doc.color + "40" : "#f1f5f9"}`,
        overflow: "hidden",
        transition: "box-shadow 0.2s",
        boxShadow: hasDoc ? `0 2px 16px ${doc.color}18` : "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 14px",
          background: hasDoc ? `${doc.color}08` : "#f8fafc",
          borderBottom: `1px solid ${hasDoc ? doc.color + "20" : "#f1f5f9"}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `${doc.color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {doc.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
            {doc.label}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
            {doc.desc}
          </div>
        </div>
        {loading ? (
          <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #e2e8f0", borderTopColor: doc.color, animation: "spin 0.8s linear infinite" }} />
        ) : hasDoc ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: `${doc.color}15`, border: `1px solid ${doc.color}30`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: doc.color }}>
            ✓ Uploaded
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 600 }}>
            Not uploaded
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "12px 14px" }}>
        {uploading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "12px 0",
            }}
          >
            <ProgressRing pct={progress} color={doc.color} />
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
              Uploading… {progress}%
            </div>
          </div>
        ) : hasDoc ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Preview */}
            {isImage(viewUrl) ? (
              <div
                style={{
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid #f1f5f9",
                  maxHeight: 120,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f8fafc",
                }}
              >
                <img
                  src={viewUrl}
                  alt={doc.label}
                  style={{ maxWidth: "100%", maxHeight: 120, objectFit: "contain" }}
                />
              </div>
            ) : (
              <div
                style={{
                  borderRadius: 10,
                  border: "1px solid #f1f5f9",
                  padding: "14px",
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 28 }}>📄</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>
                    {existing?.fileName || `${doc.label}.pdf`}
                  </div>
                  {existing?.fileSize && (
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      {fmtSize(existing.fileSize)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {existing?.uploadedAt && (
              <div style={{ fontSize: 10, color: "#94a3b8" }}>
                Uploaded:{" "}
                {new Date(existing.uploadedAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => window.open(viewUrl, "_blank")}
                style={{
                  flex: 1,
                  padding: "7px 10px",
                  background: `${doc.color}10`,
                  border: `1px solid ${doc.color}30`,
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  color: doc.color,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                👁 View
              </button>
              <button
                onClick={() => inputRef.current?.click()}
                style={{
                  flex: 1,
                  padding: "7px 10px",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#475569",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                🔄 Replace
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: "7px 10px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#ef4444",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                🗑
              </button>
            </div>
          </div>
        ) : (
          /* Drop zone */
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${doc.color}40`,
              borderRadius: 10,
              padding: "18px 12px",
              textAlign: "center",
              cursor: "pointer",
              background: `${doc.color}05`,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${doc.color}10`;
              e.currentTarget.style.borderColor = `${doc.color}80`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${doc.color}05`;
              e.currentTarget.style.borderColor = `${doc.color}40`;
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>☁️</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: doc.color, marginBottom: 3 }}>
              Click or drag to upload
            </div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>
              JPG, PNG or PDF · Max {doc.maxMB}MB
            </div>
          </div>
        )}
      </div>

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept={doc.accept}
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYEE PROFILE PANEL (right side in Employee Dashboard)
// ═══════════════════════════════════════════════════════════════════════════════
export function EmployeeProfilePanel({ empName, user, notify }) {
  const [open, setOpen] = useState(false);
  const [docStatus, setDocStatus] = useState({});

  const initials = (empName || "E").slice(0, 2).toUpperCase();
  const uploadedCount = Object.values(docStatus).filter(Boolean).length;

  const handleUploaded = useCallback((key, doc) => {
    setDocStatus((prev) => ({ ...prev, [key]: !!doc }));
  }, []);

  // Fetch existing doc status on mount
  useEffect(() => {
    if (!empName) return;
    const enc = encodeURIComponent(empName);
    DOC_TYPES.forEach((dt) => {
      axios
        .get(`${BASE}/documents/${enc}/${dt.key}`)
        .then((r) => {
          if (r.data?.url)
            setDocStatus((prev) => ({ ...prev, [dt.key]: true }));
        })
        .catch(() => {});
    });
  }, [empName]);

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="My Profile & Documents"
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 200,
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 18px rgba(99,102,241,0.45)",
          transition: "transform 0.2s",
          flexDirection: "column",
          gap: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 14, lineHeight: 1 }}>
          {initials}
        </span>
        {uploadedCount < DOC_TYPES.length && (
          <span
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#ef4444",
              border: "2px solid #fff",
              fontSize: 8,
              fontWeight: 800,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {DOC_TYPES.length - uploadedCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.4)",
            zIndex: 997,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Side drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 340,
          background: "#fff",
          zIndex: 998,
          boxShadow: "-8px 0 40px rgba(99,102,241,0.18)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg,#0f172a,#1e1b4b)",
            padding: "20px 18px 16px",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>
              My Profile
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ✕
            </button>
          </div>

          {/* Avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 800,
                color: "#fff",
                flexShrink: 0,
                border: "2px solid rgba(255,255,255,0.2)",
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
                {empName || "Employee"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                {user?.department || "Employee"} · {user?.role || "Staff"}
              </div>
            </div>
          </div>

          {/* Doc progress bar */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>
                DOCUMENTS UPLOADED
              </span>
              <span style={{ fontSize: 10, color: "#a5b4fc", fontWeight: 800 }}>
                {uploadedCount}/{DOC_TYPES.length}
              </span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 99, height: 5 }}>
              <div
                style={{
                  width: `${(uploadedCount / DOC_TYPES.length) * 100}%`,
                  background: uploadedCount === DOC_TYPES.length
                    ? "linear-gradient(90deg,#10b981,#34d399)"
                    : "linear-gradient(90deg,#6366f1,#a78bfa)",
                  borderRadius: 99,
                  height: "100%",
                  transition: "width 0.5s",
                }}
              />
            </div>
          </div>
        </div>

        {/* Employee info */}
        {user && (
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["📧", "Email", user.email],
                ["📱", "Phone", user.phone],
                ["🏢", "Dept", user.department],
                ["💰", "Salary", user.salary],
              ]
                .filter(([, , v]) => v)
                .map(([icon, label, value]) => (
                  <div
                    key={label}
                    style={{
                      background: "#fff",
                      borderRadius: 8,
                      padding: "8px 10px",
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
                      {icon} {label}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {value}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Documents section */}
        <div style={{ padding: "14px 16px", flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            📂 My Documents
            {uploadedCount < DOC_TYPES.length && (
              <span style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, color: "#d97706" }}>
                {DOC_TYPES.length - uploadedCount} pending
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DOC_TYPES.map((dt) => (
              <DocCard
                key={dt.key}
                doc={dt}
                empName={empName}
                onUploaded={handleUploaded}
                notify={notify}
              />
            ))}
          </div>

          {uploadedCount === DOC_TYPES.length && (
            <div style={{ marginTop: 14, background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 22 }}>🎉</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#166534" }}>All documents uploaded!</div>
                <div style={{ fontSize: 11, color: "#15803d", marginTop: 2 }}>Your profile is complete.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBADMIN DOCUMENTS PAGE — view all employee documents
// ═══════════════════════════════════════════════════════════════════════════════
export function SubAdminDocumentsPage({ employees = [] }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [docData, setDocData] = useState({});
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [docStatusMap, setDocStatusMap] = useState({});

  // Fetch document status summary for all employees
  useEffect(() => {
    employees.forEach((emp) => {
      const name = emp.name || "";
      if (!name) return;
      const enc = encodeURIComponent(name);
      axios
        .get(`${BASE}/documents/${enc}/all`)
        .then((r) => {
          const docs = r.data || [];
          const uploaded = docs.map((d) => d.docType);
          setDocStatusMap((prev) => ({ ...prev, [name]: uploaded }));
        })
        .catch(() => {
          setDocStatusMap((prev) => ({ ...prev, [name]: [] }));
        });
    });
  }, [employees]);

  // Load selected employee docs
  const loadEmployeeDocs = async (emp) => {
    setSelected(emp);
    setLoadingDocs(true);
    const name = emp.name || "";
    const enc = encodeURIComponent(name);
    try {
      const r = await axios.get(`${BASE}/documents/${enc}/all`);
      const docsMap = {};
      (r.data || []).forEach((d) => {
        docsMap[d.docType] = d;
      });
      setDocData(docsMap);
    } catch {
      setDocData({});
    } finally {
      setLoadingDocs(false);
    }
  };

  const getCompleteness = (name) => {
    const uploaded = docStatusMap[name] || [];
    return uploaded.length;
  };

  const filtered = employees.filter((e) => {
    const matchSearch = (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.email || "").toLowerCase().includes(search.toLowerCase());
    const uploaded = docStatusMap[e.name] || [];
    const matchFilter =
      filterStatus === "all" ||
      (filterStatus === "complete" && uploaded.length === DOC_TYPES.length) ||
      (filterStatus === "partial" && uploaded.length > 0 && uploaded.length < DOC_TYPES.length) ||
      (filterStatus === "none" && uploaded.length === 0);
    return matchSearch && matchFilter;
  });

  const completeCount = employees.filter((e) => (docStatusMap[e.name] || []).length === DOC_TYPES.length).length;
  const partialCount = employees.filter((e) => { const u = (docStatusMap[e.name] || []).length; return u > 0 && u < DOC_TYPES.length; }).length;
  const noneCount = employees.filter((e) => (docStatusMap[e.name] || []).length === 0).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Total Employees", value: employees.length, icon: "👨‍💼", color: "#6366f1" },
          { label: "All Docs Complete", value: completeCount, icon: "✅", color: "#10b981" },
          { label: "Partial Docs", value: partialCount, icon: "⚠️", color: "#f59e0b" },
          { label: "No Docs", value: noneCount, icon: "❌", color: "#ef4444" },
        ].map(({ label, value, icon, color }) => (
          <div
            key={label}
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "16px 14px",
              border: "1px solid #f1f5f9",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
                {label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 360px" : "1fr", gap: 14 }}>
        {/* Employee list */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
              Employee Documents ({filtered.length})
            </div>
            {/* Filter chips */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                { key: "all", label: "All" },
                { key: "complete", label: "✅ Complete" },
                { key: "partial", label: "⚠️ Partial" },
                { key: "none", label: "❌ Missing" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    border: `1.5px solid ${filterStatus === key ? "#6366f1" : "#e2e8f0"}`,
                    background: filterStatus === key ? "#eef2ff" : "#fff",
                    color: filterStatus === key ? "#6366f1" : "#94a3b8",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 14 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>🔍</span>
            <input
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 34px",
                border: "1.5px solid #f1f5f9",
                borderRadius: 10,
                fontSize: 13,
                outline: "none",
                fontFamily: "inherit",
                color: "#0f172a",
                background: "#f8fafc",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Employee", "Aadhaar", "PAN Card", "Bank Passbook", "Completion", "Action"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "9px 12px",
                        textAlign: "left",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#94a3b8",
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                        borderBottom: "2px solid #f1f5f9",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                      No employees found
                    </td>
                  </tr>
                ) : (
                  filtered.map((emp, i) => {
                    const uploaded = docStatusMap[emp.name] || [];
                    const pct = Math.round((uploaded.length / DOC_TYPES.length) * 100);
                    const isSelected = selected?.name === emp.name;

                    return (
                      <tr
                        key={emp._id || i}
                        style={{
                          borderBottom: "1px solid #f8fafc",
                          background: isSelected ? "#eef2ff" : "transparent",
                        }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f8fafc"; }}
                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                      >
                        {/* Employee name */}
                        <td style={{ padding: "11px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontSize: 11,
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {(emp.name || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 12 }}>
                                {emp.name || "—"}
                              </div>
                              <div style={{ fontSize: 10, color: "#94a3b8" }}>
                                {emp.department || emp.role || ""}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Doc status cells */}
                        {DOC_TYPES.map((dt) => {
                          const has = uploaded.includes(dt.key);
                          return (
                            <td key={dt.key} style={{ padding: "11px 12px" }}>
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5,
                                  background: has ? `${dt.color}12` : "#f1f5f9",
                                  border: `1px solid ${has ? dt.color + "30" : "#e2e8f0"}`,
                                  borderRadius: 20,
                                  padding: "3px 10px",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: has ? dt.color : "#94a3b8",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {has ? "✓" : "✗"} {has ? "Done" : "Missing"}
                              </div>
                            </td>
                          );
                        })}

                        {/* Progress */}
                        <td style={{ padding: "11px 12px", minWidth: 100 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 99, height: 5 }}>
                              <div
                                style={{
                                  width: `${pct}%`,
                                  background: pct === 100 ? "#10b981" : pct > 0 ? "#f59e0b" : "#e2e8f0",
                                  borderRadius: 99,
                                  height: "100%",
                                  transition: "width 0.5s",
                                }}
                              />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 800, color: pct === 100 ? "#10b981" : pct > 0 ? "#f59e0b" : "#94a3b8", minWidth: 28 }}>
                              {pct}%
                            </span>
                          </div>
                        </td>

                        {/* Action */}
                        <td style={{ padding: "11px 12px" }}>
                          <button
                            onClick={() => loadEmployeeDocs(emp)}
                            style={{
                              padding: "5px 12px",
                              background: isSelected ? "#6366f1" : "rgba(99,102,241,0.08)",
                              border: `1px solid ${isSelected ? "#6366f1" : "rgba(99,102,241,0.25)"}`,
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              color: isSelected ? "#fff" : "#6366f1",
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            {isSelected ? "Viewing" : "👁 View"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Document viewer panel */}
        {selected && (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #f1f5f9",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Panel header */}
            <div style={{ background: "linear-gradient(135deg,#0f172a,#1e1b4b)", padding: "16px 16px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>
                    {(selected.name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>
                      {selected.name}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                      {selected.department || selected.role || "Employee"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 7, width: 26, height: 26, cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Documents */}
            <div style={{ padding: 14, flex: 1, overflowY: "auto" }}>
              {loadingDocs ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: 13 }}>
                  Loading documents...
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {DOC_TYPES.map((dt) => {
                    const doc = docData[dt.key];
                    const hasDoc = !!doc?.url;

                    return (
                      <div
                        key={dt.key}
                        style={{
                          border: `1.5px solid ${hasDoc ? dt.color + "35" : "#f1f5f9"}`,
                          borderRadius: 12,
                          overflow: "hidden",
                          background: hasDoc ? `${dt.color}04` : "#f8fafc",
                        }}
                      >
                        {/* Doc header */}
                        <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${hasDoc ? dt.color + "20" : "#f1f5f9"}` }}>
                          <span style={{ fontSize: 18 }}>{dt.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>
                              {dt.label}
                            </div>
                          </div>
                          {hasDoc ? (
                            <span style={{ background: `${dt.color}15`, border: `1px solid ${dt.color}30`, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, color: dt.color }}>
                              ✓ Uploaded
                            </span>
                          ) : (
                            <span style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, color: "#ef4444" }}>
                              ✗ Missing
                            </span>
                          )}
                        </div>

                        {/* Doc preview (subadmin view — read only) */}
                        {hasDoc && (
                          <div style={{ padding: "10px 12px" }}>
                            {isImage(doc.url) ? (
                              <img
                                src={doc.url}
                                alt={dt.label}
                                style={{ width: "100%", maxHeight: 140, objectFit: "contain", borderRadius: 8, border: "1px solid #f1f5f9", background: "#fff" }}
                              />
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#fff", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                                <span style={{ fontSize: 22 }}>📄</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {doc.fileName || `${dt.label}.pdf`}
                                  </div>
                                  {doc.fileSize && (
                                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{fmtSize(doc.fileSize)}</div>
                                  )}
                                </div>
                              </div>
                            )}
                            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                              <button
                                onClick={() => window.open(doc.url, "_blank")}
                                style={{ flex: 1, padding: "6px 10px", background: `${dt.color}10`, border: `1px solid ${dt.color}30`, borderRadius: 7, fontSize: 11, fontWeight: 700, color: dt.color, cursor: "pointer", fontFamily: "inherit" }}
                              >
                                👁 View Full
                              </button>
                              <a
                                href={doc.url}
                                download
                                style={{ flex: 1, padding: "6px 10px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 11, fontWeight: 700, color: "#475569", cursor: "pointer", fontFamily: "inherit", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                              >
                                ⬇ Download
                              </a>
                            </div>
                            {doc.uploadedAt && (
                              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 6 }}>
                                Uploaded:{" "}
                                {new Date(doc.uploadedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT — combined demo / standalone usage
// ═══════════════════════════════════════════════════════════════════════════════
export default function EmployeeDocumentsDemo() {
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("success");

  const notify = (msg, type = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: 20 }}>
      <h2 style={{ marginBottom: 16 }}>Employee Profile Panel Demo</h2>
      <EmployeeProfilePanel empName="Demo Employee" user={{ email: "demo@example.com", department: "Engineering" }} notify={notify} />
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#0f172a", borderRadius: 10, padding: "10px 16px", color: toastType === "error" ? "#fca5a5" : "#a5b4fc", fontSize: 13, zIndex: 9999 }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BACKEND ROUTES NEEDED (add to employeeDashboard.js or a new file)
// ═══════════════════════════════════════════════════════════════════════════════
/*

const multer  = require("multer");
const path    = require("path");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/documents/"),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload  = multer({ storage, limits:{ fileSize: 10 * 1024 * 1024 } });

// Document Model
let EmployeeDoc;
try { EmployeeDoc = mongoose.model("EmployeeDoc"); } catch {
  EmployeeDoc = mongoose.model("EmployeeDoc", new mongoose.Schema({
    employeeName: { type: String, required: true },
    employeeId:   { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    docType:      { type: String, enum: ["aadhaar","pan","passbook"], required: true },
    url:          { type: String, required: true },
    fileName:     { type: String, default: "" },
    fileSize:     { type: Number, default: 0 },
    uploadedAt:   { type: Date, default: Date.now },
  }, { timestamps: true }));
}

// POST /api/employee-dashboard/documents/upload
router.post("/documents/upload", upload.single("file"), async (req, res) => {
  try {
    const { employeeName, docType } = req.body;
    if (!req.file || !employeeName || !docType)
      return res.status(400).json({ msg: "File, employee name and doc type required" });

    const url = `${req.protocol}://${req.get("host")}/uploads/documents/${req.file.filename}`;

    // upsert: one record per (employee, docType)
    const doc = await EmployeeDoc.findOneAndUpdate(
      { employeeName: { $regex: new RegExp(`^${employeeName}$`, "i") }, docType },
      { employeeName, docType, url, fileName: req.file.originalname, fileSize: req.file.size, uploadedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ msg: "Uploaded", document: doc });
  } catch (err) { res.status(500).json({ msg: "Upload failed", error: err.message }); }
});

// GET /api/employee-dashboard/documents/:name/:docType
router.get("/documents/:name/:docType", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const { docType } = req.params;
    if (docType === "all") {
      const docs = await EmployeeDoc.find({ employeeName: { $regex: new RegExp(name, "i") } });
      return res.json(docs);
    }
    const doc = await EmployeeDoc.findOne({ employeeName: { $regex: new RegExp(name, "i") }, docType });
    res.json(doc || {});
  } catch (err) { res.status(500).json({ msg: "Error", error: err.message }); }
});

// DELETE /api/employee-dashboard/documents/:name/:docType
router.delete("/documents/:name/:docType", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    await EmployeeDoc.deleteOne({ employeeName: { $regex: new RegExp(name, "i") }, docType: req.params.docType });
    res.json({ msg: "Deleted" });
  } catch (err) { res.status(500).json({ msg: "Error", error: err.message }); }
});

*/
