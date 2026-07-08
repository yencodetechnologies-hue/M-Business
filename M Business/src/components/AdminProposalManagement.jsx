import { useState, useEffect } from "react";
import axios from "axios";
import { T } from "../index";
import { BASE_URL } from "../config";
import CanvasProposalEditor from "./CanvasProposalEditor";

const THEMES = [
  { name: "Modern", p: "var(--app-accent)", g: "linear-gradient(135deg,var(--app-accent),var(--app-muted))", l: "var(--app-border)", t: "var(--app-accent)" },
  { name: "Royal", p: "var(--app-accent)", g: "linear-gradient(135deg,var(--app-accent),var(--app-muted))", l: "var(--app-border)", t: "var(--app-accent)" },
  { name: "Corporate", p: "var(--app-accent)", g: "linear-gradient(135deg,var(--app-accent),var(--app-muted))", l: "var(--app-border)", t: "var(--app-accent)" },
  { name: "Violet", p: "var(--app-accent)", g: "linear-gradient(135deg,var(--app-accent),var(--app-muted))", l: "var(--app-border)", t: "var(--app-accent)" },
  { name: "Cobalt", p: "#1d4ed8", g: "linear-gradient(135deg,#1e40af,#3b82f6)", l: "#dbeafe", t: "#1e3a8a" },
  { name: "Emerald", p: "#059669", g: "linear-gradient(135deg,#065f46,#10b981)", l: "#d1fae5", t: "#064e3b" },
  { name: "Rose", p: "#e11d48", g: "linear-gradient(135deg,#9f1239,#f43f5e)", l: "#ffe4e6", t: "#881337" },
  { name: "Amber", p: "#d97706", g: "linear-gradient(135deg,#92400e,#fbbf24)", l: "#fef3c7", t: "#78350f" },
  { name: "Slate", p: "#334155", g: "linear-gradient(135deg,#0f172a,#475569)", l: "#f1f5f9", t: "#0f172a" },
  { name: "Teal", p: "#0d9488", g: "linear-gradient(135deg,#134e4a,#2dd4bf)", l: "#ccfbf1", t: "#134e4a" },
  { name: "Fuchsia", p: "var(--app-accent)", g: "linear-gradient(135deg,#701a75,#e879f9)", l: "var(--app-border)", t: "#4a044e" },
];

const printProposal = (proposal) => {
  if (!proposal) return;

  const getElementsHTML = (elements) => {
    if (!elements || elements.length === 0) return '';
    return `
      <div style="position:absolute; inset:0; pointer-events:none; z-index:20;">
        ${elements.map(el => {
      let content = '';
      const val = el.val || el.text || '';
      if (el.type === "text" || el.type === "heading") {
        const fs = el.fontSize || (el.type === "heading" ? 24 : 16);
        const fw = el.fontWeight || (el.type === "heading" ? 700 : 400);
        content = `<div style="font-size:${fs}px; font-weight:${fw}; color:${el.color || '#000'}; white-space:pre-wrap; width:${el.width || el.w}px;">${val}</div>`;
      } else if (el.type === "shape") {
        const br = el.borderRadius !== undefined ? (typeof el.borderRadius === 'number' ? el.borderRadius + 'px' : el.borderRadius) : (el.shape === 'circle' ? '50%' : '4px');
        content = `<div style="width:${el.width || el.w || 60}px; height:${el.height || el.h || 60}px; background:${el.color || 'var(--app-accent)'}; border-radius:${br};"></div>`;
      } else if (el.type === "image") {
        content = `<img src="${el.src}" style="width:${el.width || el.w || 200}px; height:${el.height || el.h || 'auto'}; object-fit:contain; pointer-events:none;" />`;
      } else if (el.type === "icon") {
        content = `<div style="font-size:${el.fontSize || 40}px; display:flex; align-items:center; justify-content:center;">${el.icon}</div>`;
      }
      return `<div style="position:absolute; left:${el.x}px; top:${el.y}px; width:${el.width || el.w || 'auto'}px; height:${el.height || el.h || 'auto'}px;">${content}</div>`;
    }).join('')}
      </div>
    `;
  };

  let proposalHTML = "";

  if (proposal.format === "canvas" && proposal.canvasElements) {
    proposalHTML = `
      <div style="page-break-after: always; min-height: 100vh; position: relative; background: #fff; overflow: hidden;">
        ${getElementsHTML(proposal.canvasElements)}
      </div>
    `;
  } else if (proposal.slides && proposal.slides.length > 0) {
    proposalHTML = proposal.slides.map(slide => {
      const t = THEMES.find(x => x.name === proposal.theme) || THEMES[0];
      const elementsHTML = getElementsHTML(slide.elements);

      if (slide.type === "cover") {
        return `
          <div style="page-break-after: always; min-height: 100vh; display: flex; flex-direction: column; justify-content: flex-end; position: relative; background: linear-gradient(150deg,${t.p}dd 0%,rgba(0,0,0,0.85) 60%,rgba(0,0,0,0.5) 100%); color: white; padding: 48px 56px; overflow: hidden;">
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
          <div style="page-break-after: always; min-height: 100vh; padding: 56px; display: flex; flex-direction: column; justify-content: center; position: relative; background: #fff; overflow: hidden;">
            ${slide.heading ? `
              <div style="width: 56px; height: 6px; background: ${t.g}; border-radius: 3px; margin-bottom: 20px;"></div>
              <h1 style="font-size: 36px; font-weight: 800; color: #0f172a; margin-bottom: 24px; letter-spacing: -0.5px; line-height: 1.1;">${slide.heading}</h1>
            ` : ''}
            <p style="font-size: 15px; color: #4b5563; line-height: 1.9; max-width: 620px; white-space: pre-wrap;">${slide.body}</p>
            ${elementsHTML}
          </div>
        `;
      }

      if (slide.type === "objectives") {
        return `
          <div style="page-break-after: always; min-height: 100vh; padding: 56px; position: relative; background: #fff; overflow: hidden;">
            ${slide.heading ? `
              <div style="width: 56px; height: 6px; background: ${t.g}; border-radius: 3px; margin-bottom: 20px;"></div>
              <h1 style="font-size: 36px; font-weight: 800; color: #0f172a; margin-bottom: 24px;">${slide.heading}</h1>
            ` : ''}
            <div style="display: flex; flex-direction: column; gap: 14px;">
              ${(slide.items || []).map((item, i) => `
                <div style="display: flex; gap: 18px; align-items: flex-start; padding: 16px 22px; background: ${t.l}; border-radius: 14px; border: 1px solid ${t.p}20;">
                  <div style="width: 36px; height: 36px; border-radius: 50%; background: ${t.g}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px; flex-shrink: 0;">${i + 1}</div>
                  <div style="flex: 1; font-size: 14px; color: #1e293b; font-weight: 600; padding-top: 6px;">${item}</div>
                </div>
              `).join('')}
            </div>
            ${elementsHTML}
          </div>
        `;
      }

      // Default slide handling
      return `
        <div style="page-break-after: always; min-height: 100vh; padding: 56px; display: flex; flex-direction: column; justify-content: center; position: relative; background: #fff; overflow: hidden;">
          ${slide.heading ? `<h1 style="font-size: 36px; font-weight: 800; color: #0f172a; margin-bottom: 24px;">${slide.heading}</h1>` : ''}
          <p style="font-size: 15px; color: #4b5563; line-height: 1.9; white-space: pre-wrap;">${slide.body || ''}</p>
          ${elementsHTML}
        </div>
      `;
    }).join("");
  } else {
    proposalHTML = `<div style="padding: 56px; text-align: center; color: #666;">This proposal has no content yet.</div>`;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to print.");
    return;
  }
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${proposal.title || 'Proposal'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: white; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          @page { size: A4; margin: 0; }
          @media print {
            body { margin: 0; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${proposalHTML}
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              window.onafterprint = () => window.close();
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

const viewProposal = (proposal) => {
  if (!proposal) return;

  const getElementsHTML = (elements) => {
    if (!elements || elements.length === 0) return '';
    return `
      <div style="position:absolute; inset:0; pointer-events:none; z-index:20;">
        ${elements.map(el => {
      let content = '';
      const val = el.val || el.text || '';
      if (el.type === "text" || el.type === "heading") {
        const fs = el.fontSize || (el.type === "heading" ? 24 : 16);
        const fw = el.fontWeight || (el.type === "heading" ? 700 : 400);
        content = `<div style="font-size:${fs}px; font-weight:${fw}; color:${el.color || '#000'}; white-space:pre-wrap; width:${el.width || el.w}px;">${val}</div>`;
      } else if (el.type === "shape") {
        const br = el.borderRadius !== undefined ? (typeof el.borderRadius === 'number' ? el.borderRadius + 'px' : el.borderRadius) : (el.shape === 'circle' ? '50%' : '4px');
        content = `<div style="width:${el.width || el.w || 60}px; height:${el.height || el.h || 60}px; background:${el.color || ' var(--app-accent, var(--app-accent, #00BCD4))'}; border-radius:${br};"></div>`;
      } else if (el.type === "image") {
        content = `<img src="${el.src}" style="width:${el.width || el.w || 200}px; height:${el.height || el.h || 'auto'}; object-fit:contain; pointer-events:none;" />`;
      } else if (el.type === "icon") {
        content = `<div style="font-size:${el.fontSize || 40}px; display:flex; align-items:center; justify-content:center;">${el.icon}</div>`;
      }
      return `<div style="position:absolute; left:${el.x}px; top:${el.y}px; width:${el.width || el.w || 'auto'}px; height:${el.height || el.h || 'auto'}px;">${content}</div>`;
    }).join('')}
      </div>
    `;
  };

  let proposalHTML = "";

  if (proposal.format === "canvas" && proposal.canvasElements) {
    proposalHTML = `
      <div style="page-break-after: always; min-height: 100vh; position: relative; background: #fff; overflow: hidden;">
        ${getElementsHTML(proposal.canvasElements)}
      </div>
    `;
  } else if (proposal.slides && proposal.slides.length > 0) {
    proposalHTML = proposal.slides.map(slide => {
      const t = THEMES.find(x => x.name === proposal.theme) || THEMES[0];
      const elementsHTML = getElementsHTML(slide.elements);

      if (slide.type === "cover") {
        return `
          <div style="page-break-after: always; min-height: 100vh; display: flex; flex-direction: column; justify-content: flex-end; position: relative; background: linear-gradient(150deg,${t.p}dd 0%,rgba(0,0,0,0.85) 60%,rgba(0,0,0,0.5) 100%); color: white; padding: 48px 56px; overflow: hidden;">
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
          <div style="page-break-after: always; min-height: 100vh; padding: 56px; display: flex; flex-direction: column; justify-content: center; position: relative; background: #fff; overflow: hidden;">
            ${slide.heading ? `
              <div style="width: 56px; height: 6px; background: ${t.g}; border-radius: 3px; margin-bottom: 20px;"></div>
              <h1 style="font-size: 36px; font-weight: 800; color: #0f172a; margin-bottom: 24px; letter-spacing: -0.5px; line-height: 1.1;">${slide.heading}</h1>
            ` : ''}
            <p style="font-size: 15px; color: #4b5563; line-height: 1.9; max-width: 620px; white-space: pre-wrap;">${slide.body}</p>
            ${elementsHTML}
          </div>
        `;
      }

      if (slide.type === "objectives") {
        return `
          <div style="page-break-after: always; min-height: 100vh; padding: 56px; position: relative; background: #fff; overflow: hidden;">
            ${slide.heading ? `
              <div style="width: 56px; height: 6px; background: ${t.g}; border-radius: 3px; margin-bottom: 20px;"></div>
              <h1 style="font-size: 36px; font-weight: 800; color: #0f172a; margin-bottom: 24px;">${slide.heading}</h1>
            ` : ''}
            <div style="display: flex; flex-direction: column; gap: 14px;">
              ${(slide.items || []).map((item, i) => `
                <div style="display: flex; gap: 18px; align-items: flex-start; padding: 16px 22px; background: ${t.l}; border-radius: 14px; border: 1px solid ${t.p}20;">
                  <div style="width: 36px; height: 36px; border-radius: 50%; background: ${t.g}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px; flex-shrink: 0;">${i + 1}</div>
                  <div style="flex: 1; font-size: 14px; color: #1e293b; font-weight: 600; padding-top: 6px;">${item}</div>
                </div>
              `).join('')}
            </div>
            ${elementsHTML}
          </div>
        `;
      }

      return `
        <div style="page-break-after: always; min-height: 100vh; padding: 56px; display: flex; flex-direction: column; justify-content: center; position: relative; background: #fff; overflow: hidden;">
          ${slide.heading ? `<h1 style="font-size: 36px; font-weight: 800; color: #0f172a; margin-bottom: 24px;">${slide.heading}</h1>` : ''}
          <p style="font-size: 15px; color: #4b5563; line-height: 1.9; white-space: pre-wrap;">${slide.body || ''}</p>
          ${elementsHTML}
        </div>
      `;
    }).join("");
  } else {
    proposalHTML = `<div style="padding: 56px; text-align: center; color: #666;">This proposal has no content yet.</div>`;
  }

  const viewWindow = window.open('', '_blank');
  if (!viewWindow) { alert("Please allow popups to view."); return; }
  viewWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${proposal.title || 'Proposal'} — View</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          .page-wrap { max-width: 900px; margin: 0 auto; padding: 40px 20px; display: flex; flex-direction: column; gap: 32px; }
          .slide-page { background: #fff; box-shadow: 0 4px 24px rgba(0,0,0,0.10); border-radius: 12px; overflow: hidden; }
          .top-bar { position: sticky; top: 0; z-index: 100; background: #1e293b; color: #fff; padding: 14px 28px; display: flex; align-items: center; justify-content: space-between; }
          .top-bar h2 { font-size: 16px; font-weight: 700; margin: 0; }
          .print-btn { background:  var(--app-accent, var(--app-accent, #00BCD4)); color: #fff; border: none; border-radius: 8px; padding: 8px 20px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }
          @media print { .top-bar { display: none; } body { background: white; } .slide-page { box-shadow: none; border-radius: 0; } @page { size: A4; margin: 0; } }
        </style>
      </head>
      <body>
        <div class="top-bar">
          <h2>📄 ${proposal.title || 'Proposal'}</h2>
          <button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
        </div>
        <div class="page-wrap">
          ${proposalHTML.replace(/<div style="page-break-after: always;/g, '<div class="slide-page" style="page-break-after: always;')}
        </div>
      </body>
    </html>
  `);
  viewWindow.document.close();
};



const STATUS = {
  draft: { label: "Draft", icon: "Edit", bg: "#f8fafc", fg: "#475569", br: "#cbd5e1" },
  pending: { label: "Pending Approval", icon: "Pending", bg: "#fffbeb", fg: "#92400e", br: "#fcd34d" },
  approved: { label: "Approved", icon: "Success", bg: "#f0fdf4", fg: "#14532d", br: "#86efac" },
  rejected: { label: "Rejected", icon: "Error", bg: "#fff1f2", fg: "#9f1239", br: "#fda4af" }
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


function CompanyDropdown({ clients, value, onChange, error }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = clients.filter(c =>
    (c.clientName || c.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.companyName || c.company || "").toLowerCase().includes(search.toLowerCase())
  );
  const selected = clients.find(c => (c.clientName || c.name) === value);

  return (
    <div style={{ position: "relative", zIndex: open ? 1000 : 1 }}>
      <div onClick={() => setOpen(!open)} style={{
        width: "100%",
        border: `1.5px solid ${error ? "#EF4444" : open ? "var(--app-accent)" : "var(--app-border)"}`,
        borderRadius: 10,
        padding: "10px 36px 10px 14px",
        fontSize: 13,
        color: value ? T.text : "var(--app-muted)",
        background: "var(--app-bg)",
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
              background: "linear-gradient(135deg,var(--app-accent),var(--app-muted))",
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
              <span style={{ fontSize: 11, color: "var(--app-muted)" }}>({selected.companyName})</span>
            )}
          </div>
        ) : "-- Select Company Name --"}
        <span style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
          fontSize: 10,
          color: "var(--app-muted)",
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
          border: "1.5px solid var(--app-border)",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(var(--app-accent-rgb, 124, 58, 237),0.15)",
          zIndex: 999,
          overflow: "hidden"
        }}>
          <div style={{ padding: "10px 10px 6px" }}>
            <div style={{ position: "relative" }}>

              <input
                autoFocus
                placeholder="Search company name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{
                  width: "100%",
                  padding: "7px 10px 7px 30px",
                  border: "1.5px solid var(--app-border)",
                  borderRadius: 8,
                  fontSize: 12,
                  background: "var(--app-bg)",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 14, textAlign: "center", color: "var(--app-muted)", fontSize: 13 }}>
                No companies found
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
                      borderBottom: "1px solid var(--app-bg)"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--app-bg)"}
                    onMouseLeave={e => e.currentTarget.style.background = isSel ? "#f3e8ff" : "transparent"}
                  >
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,var(--app-accent),var(--app-muted))",
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
                        <div style={{ fontSize: 11, color: "var(--app-muted)" }}>{company}</div>
                      )}
                    </div>

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

function EmployeeDropdown({ employees, value, onChange, error }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = employees.filter(e =>
    (e.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: "relative", zIndex: open ? 1000 : 1 }}>
      <div onClick={() => setOpen(!open)} style={{
        width: "100%",
        border: `1.5px solid ${error ? "#EF4444" : open ? "var(--app-accent)" : "var(--app-border)"}`,
        borderRadius: 10,
        padding: "10px 36px 10px 14px",
        fontSize: 13,
        color: value ? T.text : "var(--app-muted)",
        background: "var(--app-bg)",
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
              background: "linear-gradient(135deg,var(--app-accent),var(--app-muted))",
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
          </div>
        ) : "-- Select Employee --"}
        <span style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
          fontSize: 10,
          color: "var(--app-muted)",
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
          border: "1.5px solid var(--app-border)",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(var(--app-accent-rgb, 124, 58, 237),0.15)",
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
              }}></span>
              <input
                autoFocus
                placeholder="Search employee..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{
                  width: "100%",
                  padding: "7px 10px 7px 30px",
                  border: "1.5px solid var(--app-border)",
                  borderRadius: 8,
                  fontSize: 12,
                  background: "var(--app-bg)",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 14, textAlign: "center", color: "var(--app-muted)", fontSize: 13 }}>
                No employees found
              </div>
            ) : (
              filtered.map((e, i) => {
                const name = e.name || "";
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
                      borderBottom: "1px solid var(--app-bg)"
                    }}
                    onMouseEnter={ev => ev.currentTarget.style.background = "var(--app-bg)"}
                    onMouseLeave={ev => ev.currentTarget.style.background = isSel ? "#f3e8ff" : "transparent"}
                  >
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,var(--app-accent),var(--app-muted))",
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
                    </div>
                    {isSel && <span style={{ fontSize: 14, color: "var(--app-accent)" }}>Yes</span>}
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
        boxShadow: "0 32px 80px rgba(var(--app-accent-rgb, 124, 58, 237),0.25)"
      }}>
        <div style={{
          padding: "16px 22px",
          borderBottom: "1px solid var(--app-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(90deg,var(--app-bg),var(--app-bg))",
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
              color: "var(--app-accent)",
              padding: "4px 8px"
            }}
          >
            Close
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
  const [clients, setClients] = useState(() => { try { const c = localStorage.getItem("cached_clients"); return c ? JSON.parse(c) : []; } catch { return []; } });
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [proposalTitle, setProposalTitle] = useState("");
  const [creatingProposal, setCreatingProposal] = useState(false);
  const [showCanvasEditor, setShowCanvasEditor] = useState(false);
  const [editingProposalId, setEditingProposalId] = useState(null);
  const [isUpdatingEmployee, setIsUpdatingEmployee] = useState(false);

  useEffect(() => {
    fetchProposals();
    fetchClients();
    fetchEmployees();

    // Auto-refresh proposals every 5 seconds
    const interval = setInterval(() => {
      fetchProposals();
    }, 5000);

    // Refresh when window gets focus
    const onFocus = () => fetchProposals();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
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

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/employees`);
      setEmployees(response.data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
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
    openCanvasEditor();
  };

  const handleCreateProposal = async () => {
    if (!selectedClient || !proposalTitle.trim()) {
      alert("Please select a company name and enter a proposal title");
      return;
    }

    try {
      setCreatingProposal(true);
      const newProposal = {
        id: `PROP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        title: proposalTitle.trim(),
        client: selectedClient,
        assignedEmployee: selectedEmployee,
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

  const handleSubmitForApproval = async (proposal) => {
    let currentTitle = proposal.title;
    if (!currentTitle || !currentTitle.trim()) {
      const newTitle = window.prompt("Please enter a title for this proposal before submitting:");
      if (!newTitle || !newTitle.trim()) return;
      currentTitle = newTitle.trim();

      // Update title on server first
      try {
        await axios.put(`${BASE_URL}/api/proposals/${proposal._id}`, { title: currentTitle });
        setProposals(prev => prev.map(p => p._id === proposal._id ? { ...p, title: currentTitle } : p));
      } catch (err) {
        console.error("Error updating title before submission:", err);
        alert("Failed to update title. Please try again.");
        return;
      }
    }

    try {
      await axios.put(`${BASE_URL}/api/proposals/${proposal._id}/submit`);
      setProposals(prev =>
        prev.map(p => p._id === proposal._id ? { ...p, status: "pending", title: currentTitle } : p)
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

  const handleApprove = async (proposalId) => {
    try {
      await axios.put(`${BASE_URL}/api/proposals/${proposalId}/approve`);
      setProposals(prev => prev.map(p => p._id === proposalId ? { ...p, status: "approved" } : p));
    } catch (error) {
      console.error("Error approving proposal:", error);
    }
  };

  const handleReject = async (proposalId, reason) => {
    try {
      await axios.put(`${BASE_URL}/api/proposals/${proposalId}/reject`, { rejectNote: reason });
      setProposals(prev => prev.map(p => p._id === proposalId ? { ...p, status: "rejected", rejectNote: reason } : p));
      setRejectTarget(null);
    } catch (error) {
      console.error("Error rejecting proposal:", error);
    }
  };

  const handleUpdateEmployee = async (proposalId, employeeName) => {
    try {
      setIsUpdatingEmployee(true);
      const res = await axios.put(`${BASE_URL}/api/proposals/${proposalId}`, { assignedEmployee: employeeName });
      setProposals(prev => prev.map(p => p._id === proposalId ? res.data : p));
      if (selectedProposal && selectedProposal._id === proposalId) {
        setSelectedProposal(res.data);
      }
    } catch (error) {
      console.error("Error updating assigned employee:", error);
      alert("Failed to update assigned employee");
    } finally {
      setIsUpdatingEmployee(false);
    }
  };

  const openCanvasEditor = (proposalId = null) => {
    setEditingProposalId(proposalId);
    setShowCanvasEditor(true);
  };

  const closeCanvasEditor = () => {
    setShowCanvasEditor(false);
    setEditingProposalId(null);
    fetchProposals(); // Refresh proposals after closing editor
  };

  const filtered = proposals.filter(p => {
    const matchesSearch =
      (p.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.client || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.assignedEmployee || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.status || "").toLowerCase().includes(search.toLowerCase());

    const propDate = p.createdAt || p.sentAt || p.updatedAt || p.updated;
    const matchesMonth = propDate
      ? new Date(propDate).toISOString().slice(0, 7) === selectedMonth
      : true;

    return matchesSearch && matchesMonth;
  });


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12
      }}>
        {[
          { t: "Total Proposals", v: proposals.length, i: "Document", c: "var(--app-accent)" },
          { t: "Draft", v: proposals.filter(p => p.status === "draft").length, i: "Edit", c: "#6b7280" },
          { t: "Pending", v: proposals.filter(p => p.status === "pending").length, i: "Pending", c: "#f59e0b" },
          { t: "Approved", v: proposals.filter(p => p.status === "approved").length, i: "Success", c: "#22c55e" }
        ].map(({ t, v, i, c }) => (
          <div key={t} style={{
            background: "#fff",
            borderRadius: 14,
            padding: "16px 14px",
            boxShadow: "0 4px 18px rgba(var(--app-accent-rgb, 124, 58, 237),0.07)",
            border: "1px solid var(--app-border)",
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
              <div style={{ fontSize: 10, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 0.5 }}>
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
        boxShadow: "0 4px 24px rgba(var(--app-accent-rgb, 124, 58, 237),0.08)",
        border: "1px solid var(--app-border)"
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
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <Search value={search} onChange={setSearch} placeholder="Search proposals..." />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={createNewProposal}
                style={{
                  background: "var(--app-accent-gradient, linear-gradient(135deg,var(--app-accent),var(--app-muted)))",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 4px 12px rgba(var(--app-accent-rgb, 124, 58, 237),0.3)",
                  transition: "all .2s"
                }}
              >
                Special Add Proposal
              </button>

            </div>
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
              <tr style={{ background: "linear-gradient(90deg,var(--app-bg),var(--app-bg))" }}>
                {["#", "Title", "Company Name", "Assigned To", "Slides", "Status", "Updated", "Actions"].map(c => (
                  <th key={c} style={{
                    padding: "10px 14px",
                    textAlign: "left",
                    color: "var(--app-accent)",
                    fontWeight: 700,
                    fontSize: 11,
                    borderBottom: "2px solid var(--app-border)",
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
                    color: "var(--app-muted)"
                  }}>
                    No proposals found
                  </td>
                </tr>
              ) : (
                filtered.map((proposal, i) => (
                  <tr key={proposal._id || i} style={{
                    borderBottom: "1px solid var(--app-border)"
                  }}>
                    <td style={{
                      padding: "12px 14px",
                      color: "var(--app-muted)",
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
                      color: "var(--app-accent)"
                    }}>
                      {proposal.client || "No company name"}
                    </td>
                    <td style={{
                      padding: "12px 14px",
                      color: "#6b7280"
                    }}>
                      {proposal.assignedEmployee ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg,var(--app-accent),var(--app-muted))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 9,
                            fontWeight: 700
                          }}>
                            {proposal.assignedEmployee[0].toUpperCase()}
                          </div>
                          <span>{proposal.assignedEmployee}</span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--app-muted)", fontStyle: "italic" }}>Not assigned</span>
                      )}
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
                      {proposal.updatedAt ? new Date(proposal.updatedAt).toLocaleDateString("en-IN", {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : new Date(proposal.updated).toLocaleDateString("en-IN", {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button
                          onClick={() => setSelectedProposal(proposal)}
                          style={{
                            background: "linear-gradient(135deg,var(--app-accent),var(--app-muted))",
                            border: "none",
                            borderRadius: 8,
                            padding: "6px 12px",
                            fontSize: 12,
                            color: "#fff",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontFamily: "inherit",
                            whiteSpace: "nowrap",
                            boxShadow: "0 2px 8px rgba(99,102,241,0.25)",
                            transition: "all 0.2s"
                          }}
                          onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                          onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
                        >
                          View
                        </button>

                        <button
                          onClick={() => printProposal(proposal)}
                          style={{
                            background: "rgba(var(--app-accent-rgb, 124, 58, 237),0.1)",
                            border: "1px solid rgba(var(--app-accent-rgb, 124, 58, 237),0.3)",
                            borderRadius: 7,
                            padding: "5px 10px",
                            fontSize: 12,
                            color: "var(--app-accent)",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontFamily: "inherit",
                            whiteSpace: "nowrap"
                          }}
                        >
                          Print
                        </button>

                        {proposal.status === "pending" && (
                          <>

                          </>
                        )}

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

                        {(proposal.status === "rejected" || proposal.status === "draft") && (
                          <button
                            onClick={() => openCanvasEditor(proposal._id)}
                            style={{
                              background: "rgba(var(--app-accent-rgb, 124, 58, 237), 0.1)",
                              border: "1px solid rgba(var(--app-accent-rgb, 124, 58, 237), 0.3)",
                              borderRadius: 7,
                              padding: "5px 10px",
                              fontSize: 12,
                              color: "var(--app-accent)",
                              cursor: "pointer",
                              fontWeight: 600,
                              fontFamily: "inherit",
                              whiteSpace: "nowrap"
                            }}
                          >
                            Canvas
                          </button>
                        )}

                        {proposal.status === "draft" && (
                          <button
                            onClick={() => handleSubmitForApproval(proposal)}
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
                            Export Submit
                          </button>
                        )}

                        {proposal.status === "rejected" && (
                          <button
                            onClick={() => handleSubmitForApproval(proposal)}
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
                            Sync Resubmit
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
          maxWidth={860}
        >
          {/* Header info row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: T.text }}>
                {selectedProposal.title || "Untitled Proposal"}
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: "var(--app-accent)" }}>
                Company: {selectedProposal.client || "No company name"}
              </p>
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Assigned To:</span>
                <div style={{ flex: 1, maxWidth: 200 }}>
                  <EmployeeDropdown
                    employees={employees}
                    value={selectedProposal.assignedEmployee || ""}
                    onChange={(val) => handleUpdateEmployee(selectedProposal._id, val)}
                  />
                </div>
              </div>
            </div>
            <Badge status={selectedProposal.status || "draft"} />
          </div>

          {/* Rejection reason */}
          {selectedProposal.status === "rejected" && selectedProposal.rejectNote && (
            <div style={{ padding: "10px 14px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 8, marginBottom: 14 }}>
              <strong style={{ color: "#9f1239" }}>Rejection Reason:</strong>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9f1239" }}>{selectedProposal.rejectNote}</p>
            </div>
          )}

          {/* ── Slides Preview ── */}
          {selectedProposal.slides && selectedProposal.slides.length > 0 ? (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 10 }}>
                SLIDES PREVIEW ({selectedProposal.slides.length} slides)
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 480, overflowY: "auto", paddingRight: 4 }}>
                {selectedProposal.slides.map((slide, idx) => {
                  const t = THEMES.find(x => x.name === selectedProposal.theme) || THEMES[0];
                  return (
                    <div key={idx} style={{
                      border: "1.5px solid var(--app-border)",
                      borderRadius: 12,
                      overflow: "hidden",
                      background: "#fff"
                    }}>
                      {/* Slide header bar */}
                      <div style={{
                        background: t.g,
                        padding: "8px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 8
                      }}>
                        <span style={{
                          background: "rgba(255,255,255,0.25)",
                          color: "#fff",
                          borderRadius: "50%",
                          width: 22,
                          height: 22,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 800
                        }}>{idx + 1}</span>
                        <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, textTransform: "capitalize" }}>
                          {slide.type || "slide"}
                        </span>
                      </div>

                      {/* Slide body */}
                      <div style={{ padding: "14px 18px" }}>
                        {slide.type === "cover" && (
                          <>
                            <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 15, color: "#0f172a" }}>{slide.title}</p>
                            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{slide.subtitle}</p>
                          </>
                        )}
                        {(slide.type === "overview" || slide.type === "closing" || slide.type === "content") && (
                          <>
                            {slide.heading && <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{slide.heading}</p>}
                            {slide.body && <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{slide.body}</p>}
                          </>
                        )}
                        {slide.type === "objectives" && (
                          <>
                            {slide.heading && <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{slide.heading}</p>}
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {(slide.items || []).map((item, i) => (
                                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                  <span style={{
                                    background: t.g,
                                    color: "#fff",
                                    borderRadius: "50%",
                                    width: 20,
                                    height: 20,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 10,
                                    fontWeight: 800,
                                    flexShrink: 0
                                  }}>{i + 1}</span>
                                  <span style={{ fontSize: 12, color: "#1e293b", paddingTop: 2 }}>{item}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                        {/* Fallback for any other slide type */}
                        {!["cover", "overview", "closing", "content", "objectives"].includes(slide.type) && (
                          <>
                            {slide.heading && <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{slide.heading}</p>}
                            {slide.body && <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{slide.body}</p>}
                            {slide.title && <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{slide.title}</p>}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{
              padding: "24px",
              textAlign: "center",
              color: "#94a3b8",
              background: "var(--app-bg)",
              borderRadius: 10,
              marginBottom: 16,
              fontSize: 13
            }}>
              No slides content to preview.
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
            {/* Submit for Approval - only for draft */}
            {selectedProposal.status === "draft" && (
              <button
                onClick={() => handleSubmitForApproval(selectedProposal)}
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
                Export Submit for Approval
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
                Edit
              </button>
            )}

            {/* Resubmit for Approval - for rejected proposals (after client rejection, admin edits and resubmits) */}
            {selectedProposal.status === "rejected" && (
              <button
                onClick={() => handleSubmitForApproval(selectedProposal)}
                style={{
                  background: "linear-gradient(135deg,var(--app-accent),var(--app-muted))",
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
                Sync Resubmit for Approval
              </button>
            )}

            <button
              onClick={() => setSelectedProposal(null)}
              style={{
                background: "var(--app-bg)",
                border: "1px solid var(--app-border)",
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
              Delete
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
              Are you sure you want to delete "{deleteTarget.title || 'this proposal'}"?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "var(--app-bg)",
                  border: "1px solid var(--app-border)",
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

      {/* Reject Modal */}
      {rejectTarget && (
        <Mdl
          title="Reject Proposal"
          onClose={() => setRejectTarget(null)}
          maxWidth={500}
        >
          <div style={{ textAlign: "center", marginBottom: 20 }}>
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
              Error
            </div>
            <h3 style={{
              textAlign: "center",
              margin: "0 0 8px",
              fontSize: 16,
              fontWeight: 800,
              color: T.text
            }}>
              Reject Proposal
            </h3>
            <p style={{
              textAlign: "center",
              color: "#6b7280",
              fontSize: 13,
              margin: "0 0 22px"
            }}>
              Are you sure you want to reject "{rejectTarget.title || 'this proposal'}"?
            </p>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--app-accent)",
              marginBottom: 8
            }}>
              Rejection Reason :
            </label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              style={{
                width: "100%",
                minHeight: 80,
                padding: "10px 14px",
                border: "1.5px solid var(--app-border)",
                borderRadius: 10,
                fontSize: 13,
                fontFamily: "inherit",
                resize: "vertical"
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setRejectTarget(null)}
              style={{
                flex: 1,
                padding: "10px",
                background: "var(--app-bg)",
                border: "1px solid var(--app-border)",
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
              onClick={() => handleReject(rejectTarget._id, rejectReason)}
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
              Reject
            </button>
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
                color: "var(--app-accent)",
                fontWeight: 700,
                letterSpacing: 0.5,
                marginBottom: 5
              }}>
                COMPANY NAME *
              </label>
              <CompanyDropdown
                clients={clients}
                value={selectedClient}
                onChange={setSelectedClient}
              />
            </div>

            <div>
              <label style={{
                display: "block",
                fontSize: 11,
                color: "var(--app-accent)",
                fontWeight: 700,
                letterSpacing: 0.5,
                marginBottom: 5
              }}>
                ASSIGN TO EMPLOYEE
              </label>
              <EmployeeDropdown
                employees={employees}
                value={selectedEmployee}
                onChange={setSelectedEmployee}
              />
            </div>

            <div>
              <label style={{
                display: "block",
                fontSize: 11,
                color: "var(--app-accent)",
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
                  border: "1.5px solid var(--app-border)",
                  borderRadius: 10,
                  fontSize: 13,
                  color: T.text,
                  background: "var(--app-bg)",
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
                  background: "var(--app-bg)",
                  border: "1px solid var(--app-border)",
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
                  background: "linear-gradient(135deg,var(--app-accent),var(--app-muted))",
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

      {/* Canvas Proposal Editor Modal */}
      {showCanvasEditor && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 20,
            width: "100%",
            maxWidth: "1400px",
            height: "90vh",
            overflow: "hidden",
            boxShadow: "0 32px 80px rgba(var(--app-accent-rgb, 124, 58, 237),0.25)",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{
              padding: "12px 20px",
              borderBottom: "1px solid var(--app-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "linear-gradient(90deg,var(--app-bg),var(--app-bg))"
            }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.text }}>
                {editingProposalId ? "Edit Proposal" : "Create New Proposal"}
              </h2>
              <button
                onClick={closeCanvasEditor}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: "var(--app-accent)",
                  padding: "4px 8px"
                }}
              >
                Close
              </button>
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <CanvasProposalEditor
                proposalId={editingProposalId}
                onClose={closeCanvasEditor}
                onSave={(savedProposal) => {
                  // Refresh proposals list after save
                  fetchProposals();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

