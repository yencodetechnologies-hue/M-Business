import { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

const THEMES = [
  { name:"Violet",  p:"#7c3aed", g:"linear-gradient(135deg,#7c3aed,#a855f7)", l:"#ede9fe", t:"#4c1d95" },
  { name:"Cobalt",  p:"#1d4ed8", g:"linear-gradient(135deg,#1e40af,#3b82f6)", l:"#dbeafe", t:"#1e3a8a" },
  { name:"Emerald", p:"#059669", g:"linear-gradient(135deg,#065f46,#10b981)", l:"#d1fae5", t:"#064e3b" },
  { name:"Rose",    p:"#e11d48", g:"linear-gradient(135deg,#9f1239,#f43f5e)", l:"#ffe4e6", t:"#881337" },
  { name:"Amber",   p:"#d97706", g:"linear-gradient(135deg,#92400e,#fbbf24)", l:"#fef3c7", t:"#78350f" },
  { name:"Slate",   p:"#334155", g:"linear-gradient(135deg,#0f172a,#475569)", l:"#f1f5f9", t:"#0f172a" },
  { name:"Teal",    p:"#0d9488", g:"linear-gradient(135deg,#134e4a,#2dd4bf)", l:"#ccfbf1", t:"#134e4a" },
  { name:"Fuchsia", p:"#a21caf", g:"linear-gradient(135deg,#701a75,#e879f9)", l:"#fae8ff", t:"#4a044e" },
];

const printProposal = (proposal) => {
  if (!proposal || !proposal.slides) return;
  
  const getElementsHTML = (elements) => {
    if (!elements || elements.length === 0) return '';
    return `
      <div style="position:absolute; inset:0; pointer-events:none; z-index:20;">
        ${elements.map(el => {
          let content = '';
          if (el.type === "text") {
            content = `<div style="font-size:${el.fontSize}px; font-weight:${el.fontWeight}; color:${el.color||'#000'}; white-space:nowrap;">${el.val || ''}</div>`;
          } else if (el.type === "shape") {
             const br = el.borderRadius !== undefined ? el.borderRadius + 'px' : (el.shape === 'circle' ? '50%' : '4px');
             content = `<div style="width:${el.width||60}px; height:${el.height||60}px; background:${el.color||'#7c3aed'}; border-radius:${br};"></div>`;
          } else if (el.type === "image") {
             content = `<img src="${el.src}" style="width:${el.width||200}px; height:${el.height||'auto'}; object-fit:contain; pointer-events:none;" />`;
          } else if (el.type === "icon") {
             content = `<div style="font-size:${el.fontSize||40}px; display:flex; align-items:center; justify-content:center;">${el.icon}</div>`;
          }
          return `<div style="position:absolute; left:${el.x}px; top:${el.y}px;">${content}</div>`;
        }).join('')}
      </div>
    `;
  };

  const proposalHTML = proposal.slides.map(slide => {
      const t = THEMES.find(x=>x.name===proposal.theme)||THEMES[0];
      const elementsHTML = getElementsHTML(slide.elements);
      
      // Generate HTML for different slide types
      if (slide.type === "cover") {
        return `
          <div style="page-break-after: always; min-height: 100vh; display: flex; flex-direction: column; justify-content: flex-end; position: relative; background: linear-gradient(150deg,${t.p}dd 0%,rgba(0,0,0,0.85) 60%,rgba(0,0,0,0.5) 100%); color: white; padding: 48px 56px;">
            <div style="position: absolute; inset: 0; background: url('${slide.coverImage || ''}') center/cover; z-index: -2;"></div>
            <div style="position: absolute; inset: 0; background: linear-gradient(150deg,${t.p}dd 0%,rgba(0,0,0,0.85) 60%,rgba(0,0,0,0.5) 100%); z-index: -1;"></div>
            <h1 style="font-size: 48px; font-weight: 900; margin-bottom: 16px; line-height: 1.05;">${slide.title}</h1>
            <p style="font-size: 16px; color: rgba(255,255,255,0.7); margin-bottom: 28px;">${slide.subtitle}</p>
            ${elementsHTML}
          </div>
        `;
      }
      
      if (slide.type === "overview" || slide.type === "closing") {
        return `
          <div style="page-break-after: always; min-height: 100vh; padding: 56px; display: flex; flex-direction: column; justify-content: center; position: relative;">
            <div style="width: 56px; height: 6px; background: ${t.g}; border-radius: 3px; margin-bottom: 20px;"></div>
            <h1 style="font-size: 36px; font-weight: 800; color: #0f172a; margin-bottom: 24px; letter-spacing: -0.5px; line-height: 1.1;">${slide.heading}</h1>
            <p style="font-size: 15px; color: #4b5563; line-height: 1.9; max-width: 620px; white-space: pre-wrap;">${slide.body}</p>
            ${elementsHTML}
          </div>
        `;
      }
      
      if (slide.type === "objectives") {
        return `
          <div style="page-break-after: always; min-height: 100vh; padding: 56px; position: relative;">
            <div style="width: 56px; height: 6px; background: ${t.g}; border-radius: 3px; margin-bottom: 20px;"></div>
            <h1 style="font-size: 36px; font-weight: 800; color: #0f172a; margin-bottom: 24px; letter-spacing: -0.5px; line-height: 1.1;">${slide.heading}</h1>
            <div style="display: flex; flex-direction: column; gap: 14px;">
              ${slide.items.map((item, i) => `
                <div style="display: flex; gap: 18px; align-items: flex-start; padding: 16px 22px; background: ${t.l}; border-radius: 14px; border: 1px solid ${t.p}20;">
                  <div style="width: 36px; height: 36px; border-radius: 50%; background: ${t.g}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px; flex-shrink: 0;">${i+1}</div>
                  <div style="flex: 1; font-size: 14px; color: #1e293b; font-weight: 600; padding-top: 6px;">${item}</div>
                </div>
              `).join('')}
            </div>
            ${elementsHTML}
          </div>
        `;
      }
      
      if (slide.type === "proposal") {
        return `
          <div style="page-break-after: always; min-height: 100vh; padding: 40px 60px; background: #fff; font-size: 14px; line-height: 1.5; color: #000; position: relative;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">architects</div>
              <div style="display: inline-block; background: #ff0000; color: white; padding: 10px 20px; font-weight: bold; font-size: 18px; margin-bottom: 5px;">i des</div>
              <div style="font-size: 16px; font-weight: 600;">architecture</div>
              <div style="font-size: 16px; font-weight: 600;">interiore</div>
              <div style="font-size: 20px; font-weight: bold; margin-top: 10px;">INTEGERATED</div>
              <div style="font-size: 20px; font-weight: bold;">DESIGN</div>
              <div style="font-size: 20px; font-weight: bold;">SERVICES</div>
            </div>

            <div style="text-align: right; margin-bottom: 20px;">
              <div>Ref: ${slide.refNo}</div>
              <div>Dated: ${slide.date}</div>
            </div>

            <div style="margin-bottom: 20px;">
              <div style="font-weight: bold;">To</div>
              <div>${slide.clientName},</div>
              <div>${slide.clientAddress}..</div>
            </div>

            <div style="margin-bottom: 20px;">
              <div>Dear Sir,</div>
            </div>

            <div style="margin-bottom: 20px;">
              <div style="font-weight: bold;">
                Sub: Offer for Architectural consultancy & PMC(Project Management Consultancy) Service for the proposed ${slide.projectType} @ ${slide.clientAddress.replace('..', '')},CHENNAI.
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <div>I here by express my sincere thanks for giving us the opportunity to design the proposed <span style="font-weight: bold;">${slide.projectType}</span>. In this connection we would like to inform you about the scope of our work in this regard for your kind perusal.</div>
            </div>

            <div style="margin-bottom: 20px;">
              <div style="font-weight: bold; text-decoration: underline;">1.0 SCOPE OF WORK:</div>
              <div style="margin-left: 20px;">
                <div>${slide.companyName} will provide services in the following stages as follows:</div>
                ${slide.scopeOfWork.map(item => `<div style="margin-left: 16px; margin-bottom: 4px;">• ${item}</div>`).join('')}
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <div style="font-weight: bold; text-decoration: underline;">2.0 CONCEPT STAGE:</div>
              <div style="margin-left: 20px;">
                ${slide.conceptStage.map(item => `<div style="margin-left: 16px; margin-bottom: 4px;">• ${item}</div>`).join('')}
              </div>
            </div>

            <div style="margin-bottom: 24px;">
              <div style="font-weight: bold; text-decoration: underline;">3.0 SITE VISITS:</div>
              <div style="margin-left: 16px; margin-top: 8px;">
                ${(slide.siteVisits || []).map(item => `<div style="margin-left: 16px; margin-bottom: 4px;">• ${item}</div>`).join('')}
              </div>
            </div>

            <div style="margin-bottom: 24px;">
              <div style="font-weight: bold; text-decoration: underline;">5.0 FEE STRUCTURE:</div>
              <div style="margin-left: 16px; margin-top: 8px;">
                ${(slide.feeStructure || []).map(item => `<div style="margin-left: 16px; margin-bottom: 4px;">• ${item}</div>`).join('')}
              </div>
            </div>

            <div style="margin-bottom: 32px;">
              <div style="font-weight: bold; text-decoration: underline;">6.0 STAGES OF PAYMENT:</div>
              <div style="margin-left: 16px; margin-top: 8px;">
                ${(slide.stagesOfPayment || []).map(item => `<div style="margin-left: 16px; margin-bottom: 4px;">• ${item}</div>`).join('')}
              </div>
            </div>

            <div style="margin-top: 60px; display: flex; justify-content: space-between;">
              <div style="font-weight: bold;">
                <div>For ${slide.companyName || ""}</div>
                <div style="margin-top: 50px;">(Authorised Signatory)</div>
              </div>
              <div style="font-weight: bold; text-align: center;">
                <div style="margin-top: 50px;">(Client Signature)</div>
              </div>
            </div>

            <div style="position: fixed; bottom: 20mm; left: 20mm; right: 20mm; text-align: center; font-size: 10px; color: #666; border-top: 2px solid #ff0000; padding-top: 8px;">
              ${slide.companyAddress || ""}
            </div>
            ${elementsHTML}
          </div>
        `;
      }
      
      // Default slide handling
      return `
        <div style="page-break-after: always; min-height: 100vh; padding: 56px; display: flex; flex-direction: column; justify-content: center; position: relative;">
          <h1 style="font-size: 36px; font-weight: 800; color: #0f172a; margin-bottom: 24px;">${slide.heading || 'Slide'}</h1>
          <p style="font-size: 15px; color: #4b5563; line-height: 1.9; white-space: pre-wrap;">${slide.body || ''}</p>
          ${elementsHTML}
        </div>
      `;
    }).join("");

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print.");
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${proposal.title} - Proposal</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: white; font-family: Arial, sans-serif; }
            @page { size: A4; margin: 0; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${proposalHTML}
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
};

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

const STATUS = {
  draft: { label: "Draft", icon: "✏️", bg: "#f8fafc", fg: "#475569", br: "#cbd5e1" },
  pending: { label: "Pending Approval", icon: "⏳", bg: "#fffbeb", fg: "#92400e", br: "#fcd34d" },
  approved: { label: "Approved", icon: "✅", bg: "#f0fdf4", fg: "#14532d", br: "#86efac" },
  rejected: { label: "Rejected", icon: "❌", bg: "#fff1f2", fg: "#9f1239", br: "#fda4af" }
};

function Badge({ status }) {
  const s = STATUS[status] || STATUS.draft;
  return (
    <span style={{
      background: s.bg,
      color: s.fg,
      border: `1.5px solid ${s.br}`,
      borderRadius: 20,
      padding: "3px 12px",
      fontSize: 11,
      fontWeight: 700,
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      whiteSpace: "nowrap"
    }}>
      {s.icon} {s.label}
    </span>
  );
}

function Search({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", marginBottom: 16 }}>
      <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>🔍</span>
      <input
        type="text"
        placeholder={placeholder || "Search..."}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 14px 10px 40px",
          border: "1.5px solid #ede9fe",
          borderRadius: 10,
          fontSize: 13,
          color: T.text,
          background: "#faf5ff",
          outline: "none",
          fontFamily: "inherit"
        }}
      />
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
    <div style={{ position: "relative" }}>
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
    </div>
  );
}

function Mdl({ title, onClose, children, maxWidth = 820 }) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(59,7,100,0.55)",
      backdropFilter: "blur(8px)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 20,
        width: "100%",
        maxWidth,
        maxHeight: "90vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 32px 80px rgba(147,51,234,0.25)"
      }}>
        <div style={{
          padding: "16px 22px",
          borderBottom: "1px solid #ede9fe",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(90deg,#f5f3ff,#faf5ff)",
          flexShrink: 0
        }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.text }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "#7c3aed",
              padding: "4px 8px"
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ overflowY: "auto", padding: "20px 22px", flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminProposalManagement() {
  const [proposals, setProposals] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [proposalTitle, setProposalTitle] = useState("");
  const [creatingProposal, setCreatingProposal] = useState(false);

  useEffect(() => {
    fetchProposals();
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/clients`);
      setClients(response.data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients([]);
    }
  };

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/api/proposals`);
      setProposals(response.data || []);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const createNewProposal = () => {
    setShowCreateModal(true);
    setSelectedClient("");
    setProposalTitle("");
  };

  const handleCreateProposal = async () => {
    if (!selectedClient || !proposalTitle.trim()) {
      alert("Please select a client and enter a proposal title");
      return;
    }

    try {
      setCreatingProposal(true);
      const newProposal = {
        id: `PROP-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`,
        title: proposalTitle.trim(),
        client: selectedClient,
        status: "draft",
        theme: "Violet",
        format: "ppt",
        slides: []
      };

      const response = await axios.post(`${BASE_URL}/api/proposals`, newProposal);
      setProposals(prev => [response.data, ...prev]);
      setShowCreateModal(false);
      setSelectedClient("");
      setProposalTitle("");
      
      // Redirect to proposal editor
      window.location.href = `/project-proposal?edit=${response.data.id}`;
    } catch (error) {
      console.error("Error creating proposal:", error);
      alert("Failed to create proposal. Please try again.");
    } finally {
      setCreatingProposal(false);
    }
  };

  const handleSubmitForApproval = async (proposalId) => {
    try {
      await axios.put(`${BASE_URL}/api/proposals/${proposalId}/submit`);
      setProposals(prev => 
        prev.map(p => p._id === proposalId ? { ...p, status: "pending" } : p)
      );
    } catch (error) {
      console.error("Error submitting proposal for approval:", error);
    }
  };

  const handleDelete = async (proposalId) => {
    try {
      await axios.delete(`${BASE_URL}/api/proposals/${proposalId}`);
      setProposals(prev => prev.filter(p => p._id !== proposalId));
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting proposal:", error);
    }
  };

  const filtered = proposals.filter(p =>
    (p.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.client || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.status || "").toLowerCase().includes(search.toLowerCase())
  );

  

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(4, 1fr)", 
        gap: 12 
      }}>
        {[
          { t: "Total Proposals", v: proposals.length, i: "📋", c: "#9333ea" },
          { t: "Draft", v: proposals.filter(p => p.status === "draft").length, i: "✏️", c: "#6b7280" },
          { t: "Pending", v: proposals.filter(p => p.status === "pending").length, i: "⏳", c: "#f59e0b" },
          { t: "Approved", v: proposals.filter(p => p.status === "approved").length, i: "✅", c: "#22c55e" }
        ].map(({ t, v, i, c }) => (
          <div key={t} style={{
            background: "#fff",
            borderRadius: 14,
            padding: "16px 14px",
            boxShadow: "0 4px 18px rgba(147,51,234,0.07)",
            border: "1px solid #ede9fe",
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 11,
              background: `${c}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18
            }}>
              {i}
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, letterSpacing: 0.5 }}>
                {t.toUpperCase()}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: c }}>
                {v}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: "#fff",
        borderRadius: 16,
        padding: 22,
        boxShadow: "0 4px 24px rgba(147,51,234,0.08)",
        border: "1px solid #ede9fe"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8
        }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>
            All Proposals ({filtered.length})
          </h3>
          <div style={{ display: "flex", gap: "80px", alignItems: "center" }}>
            <Search value={search} onChange={setSearch} placeholder="Search proposals..." />
            <button 
              onClick={createNewProposal}
              style={{
                background:"linear-gradient(135deg,#7c3aed,#a855f7)",
                color:"#fff",
                border:"none",
                borderRadius:10,
                padding:"10px 16px",
                fontSize:13,
                fontWeight:700,
                cursor:"pointer",
                fontFamily:"inherit",
                display:"flex",
                alignItems:"center",
                gap:8,
                boxShadow:"0 4px 12px rgba(124,58,237,0.25)",
                transition:"all .2s"
              }}
            >
              ✨ Add Proposal
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
            minWidth: 700
          }}>
            <thead>
              <tr style={{ background: "linear-gradient(90deg,#f5f3ff,#faf5ff)" }}>
                {["#", "Title", "Client", "Slides", "Status", "Updated", "Actions"].map(c => (
                  <th key={c} style={{
                    padding: "10px 14px",
                    textAlign: "left",
                    color: "#7c3aed",
                    fontWeight: 700,
                    fontSize: 11,
                    borderBottom: "2px solid #ede9fe",
                    whiteSpace: "nowrap"
                  }}>
                    {c.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{
                    padding: 30,
                    textAlign: "center",
                    color: "#a78bfa"
                  }}>
                    No proposals found
                  </td>
                </tr>
              ) : (
                filtered.map((proposal, i) => (
                  <tr key={proposal._id || i} style={{
                    borderBottom: "1px solid #f3f0ff"
                  }}>
                    <td style={{
                      padding: "12px 14px",
                      color: "#a78bfa",
                      fontSize: 11,
                      fontFamily: "monospace"
                    }}>
                      {`PRP${String(i + 1).padStart(3, "0")}`}
                    </td>
                    <td style={{
                      padding: "12px 14px",
                      fontWeight: 600,
                      color: T.text
                    }}>
                      {proposal.title || "Untitled Proposal"}
                    </td>
                    <td style={{
                      padding: "12px 14px",
                      color: "#7c3aed"
                    }}>
                      {proposal.client || "No client"}
                    </td>
                    <td style={{
                      padding: "12px 14px",
                      color: "#6b7280",
                      fontSize: 12
                    }}>
                      {proposal.slides?.length || 0} slides
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <Badge status={proposal.status || "draft"} />
                    </td>
                    <td style={{
                      padding: "12px 14px",
                      color: "#64748b",
                      fontSize: 12
                    }}>
                      {new Date(proposal.updated).toLocaleDateString("en-IN")}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button
                          onClick={() => setSelectedProposal(proposal)}
                          style={{
                            background: "rgba(99,102,241,0.1)",
                            border: "1px solid rgba(99,102,241,0.3)",
                            borderRadius: 7,
                            padding: "5px 10px",
                            fontSize: 12,
                            color: "#6366f1",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontFamily: "inherit",
                            whiteSpace: "nowrap"
                          }}
                        >
                          👁 View
                        </button>
                        
                        <button
                          onClick={() => printProposal(proposal)}
                          style={{
                            background: "rgba(147,51,234,0.1)",
                            border: "1px solid rgba(147,51,234,0.3)",
                            borderRadius: 7,
                            padding: "5px 10px",
                            fontSize: 12,
                            color: "#9333ea",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontFamily: "inherit",
                            whiteSpace: "nowrap"
                          }}
                        >
                          🖨️ Print
                        </button>
                        
                        <button
                          onClick={() => setDeleteTarget(proposal)}
                          style={{
                            background: "#fee2e2",
                            border: "1px solid #fecaca",
                            borderRadius: 7,
                            padding: "5px 10px",
                            fontSize: 12,
                            color: "#ef4444",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontFamily: "inherit",
                            whiteSpace: "nowrap"
                          }}
                        >
                          🗑 Delete
                        </button>

                        {(proposal.status === "rejected" || proposal.status === "draft") && (
                          <button
                            onClick={() => window.location.href = `/project-proposal?edit=${proposal.id || proposal._id}`}
                            style={{
                              background: "rgba(16,185,129,0.1)",
                              border: "1px solid rgba(16,185,129,0.3)",
                              borderRadius: 7,
                              padding: "5px 10px",
                              fontSize: 12,
                              color: "#10b981",
                              cursor: "pointer",
                              fontWeight: 600,
                              fontFamily: "inherit",
                              whiteSpace: "nowrap"
                            }}
                          >
                            Edit
                          </button>
                        )}

                        {proposal.status === "draft" && (
                          <button
                            onClick={() => handleSubmitForApproval(proposal._id)}
                            style={{
                              background: "rgba(245,158,11,0.1)",
                              border: "1px solid rgba(245,158,11,0.3)",
                              borderRadius: 7,
                              padding: "5px 10px",
                              fontSize: 12,
                              color: "#f59e0b",
                              cursor: "pointer",
                              fontWeight: 600,
                              fontFamily: "inherit",
                              whiteSpace: "nowrap"
                            }}
                          >
                            Submit for Approval
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {selectedProposal && (
        <Mdl
          title="Proposal Details"
          onClose={() => setSelectedProposal(null)}
          maxWidth={600}
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 12
            }}>
              <div>
                <h4 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: T.text }}>
                  {selectedProposal.title || "Untitled Proposal"}
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: "#7c3aed" }}>
                  Client: {selectedProposal.client || "No client"}
                </p>
              </div>
              <Badge status={selectedProposal.status || "draft"} />
            </div>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
              fontSize: 12,
              color: "#6b7280"
            }}>
              <div>
                <strong>Slides:</strong> {selectedProposal.slides?.length || 0}
              </div>
              <div>
                <strong>Created:</strong> {new Date(selectedProposal.created).toLocaleDateString()}
              </div>
              <div>
                <strong>Updated:</strong> {new Date(selectedProposal.updated).toLocaleDateString()}
              </div>
              <div>
                <strong>Theme:</strong> {selectedProposal.theme || "Violet"}
              </div>
            </div>
          </div>

          {selectedProposal.status === "rejected" && selectedProposal.rejectNote && (
            <div style={{
              padding: "12px",
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              borderRadius: 8,
              marginBottom: 16
            }}>
              <strong style={{ color: "#9f1239" }}>Rejection Reason:</strong>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9f1239" }}>
                {selectedProposal.rejectNote}
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
            {/* Submit for Approval - only for draft */}
            {selectedProposal.status === "draft" && (
              <button
                onClick={() => handleSubmitForApproval(selectedProposal._id)}
                style={{
                  background: "linear-gradient(135deg,#f59e0b,#d97706)",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 20px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                📤 Submit for Approval
              </button>
            )}

            {/* Edit button - for draft and rejected */}
            {(selectedProposal.status === "draft" || selectedProposal.status === "rejected") && (
              <button
                onClick={() => window.location.href = `/project-proposal?edit=${selectedProposal.id || selectedProposal._id}`}
                style={{
                  background: "linear-gradient(135deg,#10b981,#059669)",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 20px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                ✏️ Edit Proposal
              </button>
            )}

            <button
              onClick={() => setSelectedProposal(null)}
              style={{
                background: "#f5f3ff",
                border: "1px solid #ede9fe",
                color: T.text,
                borderRadius: 10,
                padding: "10px 16px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
                fontFamily: "inherit"
              }}
            >
              Close
            </button>
          </div>
        </Mdl>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Mdl
          title="Delete Proposal"
          onClose={() => setDeleteTarget(null)}
          maxWidth={400}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              margin: "0 auto 14px"
            }}>
              🗑️
            </div>
            <h3 style={{
              textAlign: "center",
              margin: "0 0 8px",
              fontSize: 16,
              fontWeight: 800,
              color: T.text
            }}>
              Delete Proposal
            </h3>
            <p style={{
              textAlign: "center",
              color: "#6b7280",
              fontSize: 13,
              margin: "0 0 22px"
            }}>
              Are you sure you want to delete "{deleteTarget.title || 'this proposal'}"? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#f5f3ff",
                  border: "1px solid #ede9fe",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: T.text,
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget._id)}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "linear-gradient(135deg,#ef4444,#dc2626)",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </Mdl>
      )}

      {/* Create Proposal Modal */}
      {showCreateModal && (
        <Mdl
          title="Create New Proposal"
          onClose={() => setShowCreateModal(false)}
          maxWidth={500}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{
                display: "block",
                fontSize: 11,
                color: "#7c3aed",
                fontWeight: 700,
                letterSpacing: 0.5,
                marginBottom: 5
              }}>
                CLIENT *
              </label>
              <ClientDropdown
                clients={clients}
                value={selectedClient}
                onChange={setSelectedClient}
              />
            </div>
            
            <div>
              <label style={{
                display: "block",
                fontSize: 11,
                color: "#7c3aed",
                fontWeight: 700,
                letterSpacing: 0.5,
                marginBottom: 5
              }}>
                PROPOSAL TITLE *
              </label>
              <input
                type="text"
                value={proposalTitle}
                onChange={e => setProposalTitle(e.target.value)}
                placeholder="Enter proposal title..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1.5px solid #ede9fe",
                  borderRadius: 10,
                  fontSize: 13,
                  color: T.text,
                  background: "#faf5ff",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#f5f3ff",
                  border: "1px solid #ede9fe",
                  color: T.text,
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProposal}
                disabled={creatingProposal}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "linear-gradient(135deg,#7c3aed,#a855f7)",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  cursor: creatingProposal ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  opacity: creatingProposal ? 0.7 : 1
                }}
              >
                {creatingProposal ? "Creating..." : "Create & Edit Proposal"}
              </button>
            </div>
          </div>
        </Mdl>
      )}
    </div>
  );
}