import { useState, useRef } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

const THEMES = [
  { name:"Violet",  p:"#7c3aed", g:"linear-gradient(135deg,#7c3aed,#a855f7)", l:"#ede9fe", t:"#4c1d95" },
  { name:"Cobalt",  p:"#1d4ed8", g:"linear-gradient(135deg,#1e40af,#3b82f6)", l:"#dbeafe", t:"#1e3a8a" },
  { name:"Emerald", p:"#059669", g:"linear-gradient(135deg,#065f46,#10b981)", l:"#d1fae5", t:"#064e3b" },
];

const T = {
  primary: "#3b0764",
  sidebar: "#1e0a3c", 
  accent: "#9333ea",
  bg: "#f5f3ff",
  card: "#FFFFFF",
  text: "#1e0a3c",
  muted: "#7c3aed",
  border: "#ede9fe"
};

function Fld({ label, value, onChange, type = "text", error, placeholder, disabled }) {
  const s = { 
    width: "100%", 
    border: `1.5px solid ${error ? "#EF4444" : "#ede9fe"}`, 
    borderRadius: 10, 
    padding: "10px 14px", 
    fontSize: 13, 
    color: T.text, 
    background: disabled ? "#f3f0ff" : "#faf5ff", 
    boxSizing: "border-box", 
    outline: "none", 
    fontFamily: "inherit", 
    opacity: disabled ? 0.7 : 1 
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>
        {label.toUpperCase()}
      </label>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        style={s} 
        placeholder={placeholder || ""} 
        disabled={disabled} 
      />
      {error && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠️ {error}</div>}
    </div>
  );
}

function ClientDropdown({ clients, value, onChange, error }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = clients.filter(c => 
    (c.clientName || c.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.companyName || c.company || "").toLowerCase().includes(search.toLowerCase())
  );
  const selected = clients.find(c => (c.clientName || c.name) === value);
  
  return (
    <div style={{ position: "relative", marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>
        CLIENT NAME *
      </label>
      <div onClick={() => setOpen(!open)} style={{
        width: "100%",
        border: `1.5px solid ${error ? "#EF4444" : open ? "#9333ea" : "#ede9fe"}`,
        borderRadius: 10,
        padding: "10px 36px 10px 14px",
        fontSize: 13,
        color: value ? T.text : "#a78bfa",
        background: "#faf5ff",
        cursor: "pointer",
        userSelect: "none",
        boxSizing: "border-box",
        position: "relative",
        minHeight: 42
      }}>
        {value ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#9333ea,#c084fc)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              flexShrink: 0
            }}>
              {value[0].toUpperCase()}
            </div>
            <span>{value}</span>
            {selected?.companyName && (
              <span style={{ fontSize: 11, color: "#a78bfa" }}>({selected.companyName})</span>
            )}
          </div>
        ) : "-- Select Client --"}
        <span style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
          fontSize: 10,
          color: "#a78bfa",
          transition: "0.2s"
        }}>▼</span>
      </div>
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          background: "#fff",
          border: "1.5px solid #ede9fe",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(147,51,234,0.15)",
          zIndex: 999,
          overflow: "hidden"
        }}>
          <div style={{ padding: "10px 10px 6px" }}>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 12
              }}>🔍</span>
              <input
                autoFocus
                placeholder="Search client..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{
                  width: "100%",
                  padding: "7px 10px 7px 30px",
                  border: "1.5px solid #ede9fe",
                  borderRadius: 8,
                  fontSize: 12,
                  background: "#faf5ff",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 14, textAlign: "center", color: "#a78bfa", fontSize: 13 }}>
                No clients found
              </div>
            ) : (
              filtered.map((c, i) => {
                const name = c.clientName || c.name || "";
                const company = c.companyName || c.company || "";
                const isSel = value === name;
                return (
                  <div
                    key={i}
                    onClick={() => {
                      onChange(name);
                      setOpen(false);
                      setSearch("");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      cursor: "pointer",
                      background: isSel ? "#f3e8ff" : "transparent",
                      borderBottom: "1px solid #f5f3ff"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#faf5ff"}
                    onMouseLeave={e => e.currentTarget.style.background = isSel ? "#f3e8ff" : "transparent"}
                  >
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#9333ea,#c084fc)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      {name[0]?.toUpperCase() || "?"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{name}</div>
                      {company && (
                        <div style={{ fontSize: 11, color: "#a78bfa" }}>{company}</div>
                      )}
                    </div>
                    {isSel && <span style={{ fontSize: 14, color: "#9333ea" }}>✓</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      {open && <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 998
      }} onClick={() => {
        setOpen(false);
        setSearch("");
      }} />}
      {error && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠️ {error}</div>}
    </div>
  );
}

export default function A4ProposalForm({ clients, onSave, onCancel, initialData = null }) {
  const [formData, setFormData] = useState({
    companyName: "",
    clientName: "",
    clientAddress: "",
    refNo: `${new Date().getFullYear()}/PROP`,
    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
    projectType: "",
    scopeOfWork: [
      "Presentation drawings",
      "3D rendering of design options",
      "Working Drawings, Interior Design and Furnishing",
      "Plumbing and Electrical Co-ordination Drawings",
      "Material selection and finishes",
      "Coordination with Client and Contractor",
      "BOQ & Costing for project"
    ],
    conceptStage: [
      "Identify client's requirement",
      "Preparation of conceptual layouts",
      "Rough estimate"
    ],
    siteVisits: [
      "Complimentary visits as per agreement",
      "Additional visits charged separately"
    ],
    feeStructure: [
      "Consultancy fee based on project scope."
    ],
    stagesOfPayment: [
      "Advance payment",
      "Concept finalization",
      "3D Models preparation",
      "Construction drawings",
      "Material finalization",
      "Completion"
    ],
    companyAddress: ""
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const updateScopeOfWork = (index, value) => {
    const updated = [...formData.scopeOfWork];
    updated[index] = value;
    setFormData(prev => ({ ...prev, scopeOfWork: updated }));
  };

  const addScopeOfWork = () => {
    setFormData(prev => ({ 
      ...prev, 
      scopeOfWork: [...prev.scopeOfWork, ""] 
    }));
  };

  const removeScopeOfWork = (index) => {
    const updated = formData.scopeOfWork.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, scopeOfWork: updated }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.clientName.trim()) newErrors.clientName = "Client name is required";
    if (!formData.clientAddress.trim()) newErrors.clientAddress = "Client address is required";
    if (!formData.projectType.trim()) newErrors.projectType = "Project type is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      const proposalData = {
        ...formData,
        id: `PROP-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`,
        status: "draft",
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        format: "a4-proposal"
      };

      if (onSave) {
        await onSave(proposalData);
      }
    } catch (error) {
      console.error("Error saving proposal:", error);
      alert("Failed to save proposal. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${formData.projectType} - Proposal</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 14px; 
              line-height: 1.5; 
              color: #000;
              background: white;
            }
            @page { 
              size: A4; 
              margin: 20mm; 
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .company-tag {
              display: inline-block;
              background: #ff0000;
              color: white;
              padding: 10px 20px;
              font-weight: bold;
              font-size: 18px;
              margin-bottom: 5px;
            }
            .section {
              margin-bottom: 20px;
            }
            .section-title {
              font-weight: bold;
              text-decoration: underline;
              margin-bottom: 10px;
            }
            .list-item {
              margin-left: 20px;
              margin-bottom: 4px;
            }
            .ref-section {
              text-align: right;
              margin-bottom: 20px;
            }
            .signature-section {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
            }
            .footer {
              position: fixed;
              bottom: 20mm;
              left: 20mm;
              right: 20mm;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 2px solid #ff0000;
              padding-top: 8px;
            }
            @media print {
              .footer {
                position: fixed;
                bottom: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${formData.companyName}</div>
            <div style="font-size: 14px; color: #666;">Project Proposal</div>
          </div>

          <div class="ref-section">
            <div>Ref: ${formData.refNo}</div>
            <div>Dated: ${formData.date}</div>
          </div>

          <div class="section">
            <div style="font-weight: bold;">To</div>
            <div>${formData.clientName},</div>
            <div>${formData.clientAddress}..</div>
          </div>

          <div class="section">
            <div>Dear Sir,</div>
          </div>

          <div class="section">
            <div style="font-weight: bold;">
              Sub: Offer for Architectural consultancy & PMC(Project Management Consultancy) Service for the proposed ${formData.projectType} @ ${formData.clientAddress},CHENNAI.
            </div>
          </div>

          <div class="section">
            <div>I here by express my sincere thanks for giving us the opportunity to design the proposed <span style="font-weight: bold;">${formData.projectType}</span>. In this connection we would like to inform you about the scope of our work in this regard for your kind perusal.</div>
          </div>

          <div class="section">
            <div class="section-title">1.0 SCOPE OF WORK:</div>
            <div style="margin-left: 20px;">
              <div>${formData.companyName} will provide services in the following stages as follows:</div>
              ${formData.scopeOfWork.map(item => `<div class="list-item">• ${item}</div>`).join('')}
            </div>
          </div>

          <div class="section">
            <div class="section-title">2.0 CONCEPT/SCHEMATIC DESIGN STAGE:</div>
            <div style="margin-left: 20px; margin-top: 5px;">
              ${formData.conceptStage.map(item => `<div class="list-item">• ${item}</div>`).join('')}
            </div>
          </div>

          <div class="section">
            <div class="section-title">3.0 SITE VISITS:</div>
            <div style="margin-left: 16px; margin-top: 8px;">
              ${formData.siteVisits.map(item => `<div class="list-item">• ${item}</div>`).join('')}
            </div>
          </div>

          <div class="section">
            <div class="section-title">4.0 FEE STRUCTURE:</div>
            <div style="margin-left: 16px; margin-top: 8px;">
              ${formData.feeStructure.map(item => `<div class="list-item">• ${item}</div>`).join('')}
            </div>
          </div>

          <div class="section">
            <div class="section-title">5.0 STAGES OF PAYMENT:</div>
            <div style="margin-left: 16px; margin-top: 8px;">
              ${formData.stagesOfPayment.map(item => `<div class="list-item">• ${item}</div>`).join('')}
            </div>
          </div>

          <div class="signature-section">
            <div style="font-weight: bold;">
              <div>For ${formData.companyName}</div>
              <div style="margin-top: 50px;">(Authorised Signatory)</div>
            </div>
            <div style="font-weight: bold; text-align: center;">
              <div style="margin-top: 50px;">(Client Signature)</div>
            </div>
          </div>

          <div class="footer">
            ${formData.companyAddress}
          </div>

          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    } else {
      alert("Please allow popups to print the proposal.");
    }
  };

  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      padding: 24,
      boxShadow: "0 4px 24px rgba(147,51,234,0.08)",
      border: "1px solid #ede9fe",
      maxHeight: "80vh",
      overflowY: "auto"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        paddingBottom: 16,
        borderBottom: "1px solid #ede9fe"
      }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>
          A4 Project Proposal Form
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handlePrint}
            style={{
              background: "linear-gradient(135deg,#22c55e,#16a34a)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit"
            }}
          >
            🖨️ Print
          </button>
          <button
            onClick={onCancel}
            style={{
              background: "#f5f3ff",
              border: "1px solid #ede9fe",
              color: T.text,
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit"
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>
        <Fld 
          label="Company Name" 
          value={formData.companyName} 
          onChange={v => updateFormData("companyName", v)} 
        />
        <Fld 
          label="Reference No" 
          value={formData.refNo} 
          onChange={v => updateFormData("refNo", v)} 
        />
      </div>

      <Fld 
        label="Date" 
        value={formData.date} 
        onChange={v => updateFormData("date", v)} 
      />

      <ClientDropdown 
        clients={clients}
        value={formData.clientName}
        onChange={v => updateFormData("clientName", v)}
        error={errors.clientName}
      />

      <Fld 
        label="Client Address" 
        value={formData.clientAddress} 
        onChange={v => updateFormData("clientAddress", v)} 
        error={errors.clientAddress}
        placeholder="Enter complete client address"
      />

      <Fld 
        label="Project Type" 
        value={formData.projectType} 
        onChange={v => updateFormData("projectType", v)} 
        error={errors.projectType}
        placeholder="e.g., APARTMENT INTERIORS, VILLA DESIGN, etc."
      />

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 10 }}>
          SCOPE OF WORK
        </label>
        {formData.scopeOfWork.map((item, index) => (
          <div key={index} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              value={item}
              onChange={e => updateScopeOfWork(index, e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "1.5px solid #ede9fe",
                borderRadius: 8,
                fontSize: 12,
                background: "#faf5ff",
                outline: "none",
                fontFamily: "inherit"
              }}
            />
            {formData.scopeOfWork.length > 1 && (
              <button
                onClick={() => removeScopeOfWork(index)}
                style={{
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 11,
                  color: "#ef4444",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontFamily: "inherit"
                }}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addScopeOfWork}
          style={{
            background: "linear-gradient(135deg,#7c3aed,#a855f7)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            marginTop: 8
          }}
        >
          + Add Scope Item
        </button>
      </div>

      <Fld 
        label="Company Address" 
        value={formData.companyAddress} 
        onChange={v => updateFormData("companyAddress", v)} 
        multiline
        rows={3}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
        <button
          onClick={onCancel}
          style={{
            background: "#f5f3ff",
            border: "1px solid #ede9fe",
            color: T.text,
            borderRadius: 10,
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit"
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            background: "linear-gradient(135deg,#7c3aed,#a855f7)",
            border: "none",
            borderRadius: 10,
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
            cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            opacity: saving ? 0.7 : 1
          }}
        >
          {saving ? "Saving..." : "Save Proposal"}
        </button>
      </div>
    </div>
  );
}
