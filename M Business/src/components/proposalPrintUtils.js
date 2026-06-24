// proposalPrintUtils.js
import { PROPOSAL_PREVIEW_CSS } from "./ProposalPreviewStyles";

export function printProposal(proposal) {
  if (!proposal) return;

  // Create a hidden iframe in the CURRENT page
  const existingFrame = document.getElementById("__print_frame__");
  if (existingFrame) existingFrame.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "__print_frame__";
  iframe.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 210mm;
    height: 297mm;
    border: none;
    opacity: 0;
    pointer-events: none;
  `;
  document.body.appendChild(iframe);

  // Get ALL styles from the current page
  const allStyles = Array.from(document.styleSheets)
    .map(sheet => {
      try {
        return Array.from(sheet.cssRules || [])
          .map(rule => rule.cssText)
          .join("\n");
      } catch (e) {
        // External stylesheet - get href
        if (sheet.href) {
          return `@import url('${sheet.href}');`;
        }
        return "";
      }
    })
    .join("\n");

  // Get computed CSS variables from current page
  const computedStyle = getComputedStyle(document.documentElement);
  const cssVars = [
    "--teal", "--teal2", "--teal3", "--teal4",
    "--teal-light", "--teal-lighter",
    "--bg", "--surface", "--surface2",
    "--border", "--border2",
    "--text", "--text2", "--text3",
    "--green", "--green-bg",
    "--amber", "--amber-bg",
    "--red", "--red-bg",
    "--purple", "--purple-bg",
    "--blue", "--blue-bg",
    "--app-accent", "--font",
  ].map(v => `${v}: ${computedStyle.getPropertyValue(v).trim() || getDefaultVar(v)};`)
    .join("\n");

  function getDefaultVar(name) {
    const defaults = {
      "--teal": "#00BCD4",
      "--teal2": "#00ACC1",
      "--teal3": "#26D0CE",
      "--teal4": "#006E7F",
      "--teal-light": "#E0F7FA",
      "--teal-lighter": "#F0FDFE",
      "--bg": "#F5FAFA",
      "--surface": "#FFFFFF",
      "--surface2": "#F8FAFB",
      "--border": "#E0EEF0",
      "--border2": "#C5DDE0",
      "--text": "#1A2E35",
      "--text2": "#607D86",
      "--text3": "#A0B8BE",
      "--green": "#26C281",
      "--green-bg": "#E8FAF3",
      "--amber": "#F5A623",
      "--amber-bg": "#FEF5E6",
      "--red": "#F05C5C",
      "--red-bg": "#FEF2F2",
      "--purple": "#7C5CFC",
      "--purple-bg": "#EEE9FF",
      "--blue": "#2563EB",
      "--blue-bg": "#EFF4FF",
      "--app-accent": "#00BCD4",
      "--font": "'Nunito', sans-serif",
    };
    return defaults[name] || "";
  }

  // Build content based on proposal type
  let content = "";

  if (proposal.html) {
    // Form-builder proposal
    content = proposal.html;
  } else if (proposal.slides && proposal.slides.length > 0) {
    content = buildSlidesContent(proposal);
  } else {
    content = `<div style="padding:80px;text-align:center;color:#aaa;">No content to display.</div>`;
  }

  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    :root { ${cssVars} }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Nunito', 'Segoe UI', sans-serif;
      background: #fff;
      color: #1A2E35;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    @page {
      size: A4;
      margin: 10mm;
    }

    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        background: #fff !important;
      }
      .no-print {
        display: none !important;
      }
    }

    /* Hardcoded color replacements for all var() usages */
    .p-cover { background: linear-gradient(135deg,#003E4E 0%,#005F73 35%,#0096B4 70%,#26D0CE 100%) !important; }
    .ps-lbl { color: #00BCD4 !important; }
    .pb-lbl { color: #00BCD4 !important; }
    .exec-block.problem { border-left-color: #F05C5C !important; background: #FEF2F2 !important; }
    .exec-block.solution { border-left-color: #00BCD4 !important; background: #F0FDFE !important; }
    .exec-block.whyus { border-left-color: #26C281 !important; background: #E8FAF3 !important; }
    .exec-block.problem .eb-lbl { color: #F05C5C !important; }
    .exec-block.solution .eb-lbl { color: #00BCD4 !important; }
    .exec-block.whyus .eb-lbl { color: #26C281 !important; }
    .tl-dot { background: #00BCD4 !important; }
    .tl-line-p { background: #E0F7FA !important; }
    .tl-pi-date { color: #00BCD4 !important; }
    .del-item-p::before { color: #00BCD4 !important; }
    .pricing-tbl thead tr { background: linear-gradient(135deg,#00BCD4,#006E7F) !important; }
    .pricing-grand { background: linear-gradient(135deg,#00BCD4,#006E7F) !important; }
    .risk-badge-p.h { background: #FEF2F2 !important; color: #F05C5C !important; }
    .risk-badge-p.m { background: #FEF5E6 !important; color: #F5A623 !important; }
    .risk-badge-p.l { background: #E8FAF3 !important; color: #26C281 !important; }
    .sob-line { background: #A0B8BE !important; }
    .party-b { background: #F8FAFB !important; border: 1px solid #E0EEF0 !important; }
    .tp-card { background: #F8FAFB !important; border: 1px solid #E0EEF0 !important; }
    .tm-p { background: #F0FDFE !important; border: 1px solid #E0F7FA !important; }
    .cs-p { border-left-color: #00BCD4 !important; background: #F8FAFB !important; }
    
    ${PROPOSAL_PREVIEW_CSS}

    /* Override any remaining var() with explicit values */
    [style*="var(--teal)"] { color: #00BCD4; }
    [style*="var(--text)"] { color: #1A2E35; }
    [style*="var(--text2)"] { color: #607D86; }
    [style*="var(--text3)"] { color: #A0B8BE; }
    [style*="var(--border)"] { border-color: #E0EEF0; }
    [style*="var(--surface)"] { background: #FFFFFF; }
    [style*="var(--surface2)"] { background: #F8FAFB; }
    [style*="var(--bg)"] { background: #F5FAFA; }
    [style*="var(--green)"] { color: #26C281; }
    [style*="var(--amber)"] { color: #F5A623; }
    [style*="var(--red)"] { color: #F05C5C; }
    [style*="var(--purple)"] { color: #7C5CFC; }

    ${allStyles}
  </style>
</head>
<body>
${content}
</body>
</html>`);
  iframeDoc.close();

  // Print after content loads
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => iframe.remove(), 2000);
    }, 500);
  };

  // Fallback
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => iframe.remove(), 2000);
    } catch (e) {
      console.error("Print failed:", e);
    }
  }, 1500);
}

function buildSlidesContent(proposal) {
  const THEMES = [
    { name: "Violet", p: "#7c3aed", g: "linear-gradient(135deg,#7c3aed,#a78bfa)" },
    { name: "Cobalt", p: "#1d4ed8", g: "linear-gradient(135deg,#1e40af,#3b82f6)" },
    { name: "Emerald", p: "#059669", g: "linear-gradient(135deg,#065f46,#10b981)" },
    { name: "Rose", p: "#e11d48", g: "linear-gradient(135deg,#9f1239,#f43f5e)" },
    { name: "Amber", p: "#d97706", g: "linear-gradient(135deg,#92400e,#fbbf24)" },
    { name: "Slate", p: "#334155", g: "linear-gradient(135deg,#0f172a,#475569)" },
    { name: "Teal", p: "#0d9488", g: "linear-gradient(135deg,#134e4a,#2dd4bf)" },
    { name: "Fuchsia", p: "#a21caf", g: "linear-gradient(135deg,#701a75,#e879f9)" },
  ];

  const t = THEMES.find(x => x.name === proposal.theme) || THEMES[0];

  const getElHTML = (elements) => {
    if (!elements || elements.length === 0) return "";
    return `<div style="position:absolute;inset:0;pointer-events:none;z-index:20;">
      ${elements.map(el => {
      const w = typeof el.w === "number" ? el.w : 200;
      const h = typeof el.h === "number" ? el.h : 60;
      let inner = "";
      if (el.type === "text") {
        inner = `<div style="font-size:${el.fontSize || 16}px;font-weight:${el.fontWeight || 400};color:${el.color || "#000"};white-space:pre-wrap;word-break:break-word;width:100%;padding:8px;text-align:center;">${el.val || ""}</div>`;
      } else if (el.type === "shape") {
        const br = el.borderRadius !== undefined ? el.borderRadius + "px" : (el.shape === "circle" ? "50%" : "8px");
        inner = `<div style="width:100%;height:100%;background:${el.color || "#00BCD4"};border-radius:${br};"></div>`;
      } else if (el.type === "image") {
        inner = `<img src="${el.src}" style="width:100%;height:100%;object-fit:contain;" />`;
      } else if (el.type === "icon") {
        inner = `<div style="font-size:${el.fontSize || 40}px;text-align:center;">${el.icon}</div>`;
      }
      return `<div style="position:absolute;left:${el.x || 0}px;top:${el.y || 0}px;width:${w}px;height:${h}px;">${inner}</div>`;
    }).join("")}
    </div>`;
  };

  let html = proposal.slides.map(slide => {
    const elHTML = getElHTML(slide.elements);

    if (slide.type === "cover") {
      return `<div style="page-break-after:always;min-height:270mm;display:flex;flex-direction:column;justify-content:flex-end;position:relative;overflow:hidden;background:linear-gradient(150deg,${t.p}cc 0%,rgba(0,0,0,0.85) 60%);">
        ${slide.coverImage ? `<img src="${slide.coverImage}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;" />` : ""}
        <div style="position:absolute;inset:0;background:linear-gradient(150deg,${t.p}cc 0%,rgba(0,0,0,0.85) 60%);z-index:1;"></div>
        <div style="position:relative;z-index:2;padding:48px 56px;">
          <h1 style="font-size:42px;font-weight:900;color:#fff;margin-bottom:14px;line-height:1.1;">${slide.title || ""}</h1>
          <p style="font-size:15px;color:rgba(255,255,255,0.75);">${slide.subtitle || ""}</p>
        </div>
        ${elHTML}
      </div>`;
    }

    if (slide.type === "overview" || slide.type === "closing") {
      return `<div style="page-break-after:always;min-height:270mm;padding:56px;background:#fff;position:relative;">
        <div style="width:56px;height:6px;background:${t.g};border-radius:3px;margin-bottom:20px;"></div>
        <h1 style="font-size:32px;font-weight:800;color:#0f172a;margin-bottom:20px;">${slide.heading || ""}</h1>
        <p style="font-size:15px;color:#4b5563;line-height:1.9;white-space:pre-wrap;">${slide.body || ""}</p>
        ${slide.cta ? `<div style="margin-top:32px;display:inline-block;background:${t.g};color:#fff;border-radius:14px;padding:14px 32px;font-size:15px;font-weight:700;">${slide.cta}</div>` : ""}
        ${elHTML}
      </div>`;
    }

    if (slide.type === "objectives") {
      return `<div style="page-break-after:always;min-height:270mm;padding:56px;background:#fff;position:relative;">
        <div style="width:56px;height:6px;background:${t.g};border-radius:3px;margin-bottom:20px;"></div>
        <h1 style="font-size:32px;font-weight:800;color:#0f172a;margin-bottom:24px;">${slide.heading || ""}</h1>
        <div>
          ${(slide.items || []).map((item, i) => `
            <div style="display:flex;gap:16px;align-items:flex-start;padding:14px 18px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:10px;">
              <div style="width:32px;height:32px;min-width:32px;border-radius:50%;background:${t.g};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;">${i + 1}</div>
              <div style="font-size:14px;color:#1e293b;font-weight:600;padding-top:4px;">${item}</div>
            </div>`).join("")}
        </div>
        ${elHTML}
      </div>`;
    }

    if (slide.type === "budget") {
      return `<div style="page-break-after:always;min-height:270mm;padding:56px;background:#fff;position:relative;">
        <div style="width:56px;height:6px;background:${t.g};border-radius:3px;margin-bottom:20px;"></div>
        <h1 style="font-size:32px;font-weight:800;color:#0f172a;margin-bottom:24px;">${slide.heading || ""}</h1>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:${t.g};">
              <th style="padding:12px 20px;text-align:left;color:#fff;font-size:13px;">Item</th>
              <th style="padding:12px 20px;text-align:right;color:#fff;font-size:13px;">Cost</th>
            </tr>
          </thead>
          <tbody>
            ${(slide.rows || []).map((r, i) => `
              <tr style="border-bottom:1px solid #e2e8f0;background:${i % 2 ? "#f8fafc" : "#fff"};">
                <td style="padding:12px 20px;font-size:13px;color:#374151;">${r.item}</td>
                <td style="padding:12px 20px;text-align:right;font-size:13px;font-weight:700;">${r.cost}</td>
              </tr>`).join("")}
          </tbody>
        </table>
        <div style="display:flex;justify-content:flex-end;margin-top:12px;padding:12px 20px;background:${t.g};border-radius:10px;">
          <span style="color:#fff;font-weight:900;font-size:17px;">Total: ${slide.total || ""}</span>
        </div>
        ${elHTML}
      </div>`;
    }

    if (slide.type === "team") {
      return `<div style="page-break-after:always;min-height:270mm;padding:56px;background:#fff;position:relative;">
        <div style="width:56px;height:6px;background:${t.g};border-radius:3px;margin-bottom:20px;"></div>
        <h1 style="font-size:32px;font-weight:800;color:#0f172a;margin-bottom:24px;">${slide.heading || ""}</h1>
        <div style="display:flex;gap:16px;flex-wrap:wrap;">
          ${(slide.members || []).map(m => `
            <div style="flex:1 1 150px;padding:20px 14px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;text-align:center;">
              <div style="width:48px;height:48px;border-radius:50%;background:${t.g};margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:900;">${m.avatar || (m.name || "?")[0]}</div>
              <div style="font-size:13px;font-weight:800;color:#0f172a;">${m.name}</div>
              <div style="font-size:11px;color:${t.p};font-weight:600;margin-top:3px;">${m.role}</div>
            </div>`).join("")}
        </div>
        ${elHTML}
      </div>`;
    }

    // Default / blank / portrait / landscape
    return `<div style="page-break-after:always;min-height:270mm;padding:40px 56px;background:#fff;position:relative;">
      ${slide.heading ? `<h1 style="font-size:28px;font-weight:800;color:#0f172a;margin-bottom:16px;">${slide.heading}</h1>` : ""}
      ${slide.body ? `<p style="font-size:14px;color:#4b5563;line-height:1.8;white-space:pre-wrap;">${slide.body}</p>` : ""}
      ${elHTML}
    </div>`;
  }).join("");

  // Signature
  html += `
  <div style="padding:40px 56px;background:#fff;">
    <div style="border-top:2px solid #00BCD4;padding-top:24px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
        <div style="padding:18px;background:#F8FAFB;border-radius:12px;border:1px solid #E0EEF0;text-align:center;">
          <div style="font-size:9px;font-weight:700;color:#96B0B8;text-transform:uppercase;margin-bottom:14px;">Authorised Signatory</div>
          <div style="height:50px;margin-bottom:10px;"></div>
          <div style="height:1px;background:#C5DDE0;margin-bottom:8px;"></div>
          <div style="font-size:11px;font-weight:700;color:#0D2027;">Company Representative</div>
        </div>
        <div style="padding:18px;background:${proposal.clientSignature ? "#F0FDF4" : "#FFFBEB"};border-radius:12px;border:${proposal.clientSignature ? "1.5px solid #86efac" : "1.5px dashed #FCD34D"};text-align:center;">
          <div style="font-size:9px;font-weight:700;color:#96B0B8;text-transform:uppercase;margin-bottom:14px;">Client Acceptance</div>
          <div style="height:50px;display:flex;align-items:center;justify-content:center;margin-bottom:10px;">
            ${proposal.clientSignature
      ? proposal.clientSignature.startsWith("data:image")
        ? `<img src="${proposal.clientSignature}" style="max-height:46px;max-width:100%;object-fit:contain;" />`
        : `<span style="font-size:24px;color:#0D2027;font-style:italic;">${proposal.clientSignature}</span>`
      : `<span style="font-size:22px;color:#FCD34D;">✍</span>`}
          </div>
          <div style="height:1px;background:${proposal.clientSignature ? "#15803D" : "#FCD34D"};margin-bottom:8px;"></div>
          <div style="font-size:11px;font-weight:700;color:#0D2027;">${proposal.clientName || proposal.client || "Client"}</div>
          <div style="font-size:9px;color:${proposal.clientSignature ? "#15803D" : "#D97706"};font-weight:700;margin-top:2px;">
            ${proposal.clientSignature ? "Digitally Signed" : "Awaiting Signature"}
          </div>
        </div>
      </div>
    </div>
  </div>`;

  return html;
}

export async function shareProposalAsPDF(proposal, companyName, onStatusUpdate) {
  if (onStatusUpdate) await onStatusUpdate(proposal);
  printProposal(proposal);
}

export function buildProposalHTML(proposal) {
  return "";
}