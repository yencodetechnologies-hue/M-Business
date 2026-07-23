// proposalPrintUtils.js

const PROPOSAL_PREVIEW_CSS = `
:root{
  --teal: var(--app-accent, var(--app-accent, #00BCD4));--teal2:var(--app-accent2, #00ACC1);--teal3:#26D0CE;--teal4:#006E7F;
  --teal-light:var(--teal-light, var(--teal-light, #E0F7FA));--teal-lighter:var(--teal-lighter, #F0FDFE);
  --bg:#F5FAFA;--surface:#FFFFFF;--surface2:#F8FAFB;--border:#E0EEF0;--border2:#C5DDE0;
  --text:#1A2E35;--text2:#607D86;--text3:#A0B8BE;
  --green:#26C281;--green-bg:#E8FAF3;
  --amber:#F5A623;--amber-bg:#FEF5E6;
  --red:#F05C5C;--red-bg:#FEF2F2;
  --purple:#7C5CFC;--purple-bg:#EEE9FF;
  --blue:#2563EB;--blue-bg:#EFF4FF;
  --font:'Nunito',sans-serif;
}
.prop-doc{font-family:'Nunito',sans-serif;font-size:12px;color:#1A2E35;}
.p-cover{background:linear-gradient(135deg,#003E4E 0%,#005F73 35%,#0096B4 70%,#26D0CE 100%);padding:26px 22px;position:relative;overflow:hidden;}
.p-logo{width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.18);border:1.5px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#fff;margin-bottom:14px;position:relative;z-index:1}
.p-label{font-size:9px;font-weight:700;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;position:relative;z-index:1}
.p-title{font-size:17px;font-weight:900;color:#fff;letter-spacing:-.3px;line-height:1.25;margin-bottom:5px;position:relative;z-index:1}
.p-subtitle{font-size:11px;color:rgba(255,255,255,.7);margin-bottom:14px;position:relative;z-index:1}
.p-meta{display:flex;gap:12px;flex-wrap:wrap;position:relative;z-index:1}
.p-meta-i{display:flex;align-items:center;gap:4px;font-size:10px;color:rgba(255,255,255,.7);font-weight:600}
.p-badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.2);margin-top:9px;position:relative;z-index:1}
.ps{padding:14px 18px;border-bottom:1px solid #E0EEF0}
.ps:last-child{border-bottom:none}
.ps-lbl{font-size:9px;font-weight:700;color: var(--app-accent, var(--app-accent, #00BCD4));text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;display:flex;align-items:center;gap:5px}
.party-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.party-b{padding:9px 11px;background:#F8FAFB;border-radius:8px;border:1px solid #E0EEF0}
.pb-lbl{font-size:8px;font-weight:700;color: var(--app-accent, var(--app-accent, #00BCD4));text-transform:uppercase;letter-spacing:.7px;margin-bottom:3px}
.pb-name{font-size:11px;font-weight:800;color:#1A2E35}
.pb-detail{font-size:9px;color:#A0B8BE;line-height:1.7;margin-top:1px}
.exec-block{margin-bottom:8px;padding:9px 11px;border-radius:8px;border-left:3px solid #C5DDE0}
.exec-block.problem{border-left-color:#F05C5C;background:#FEF2F2}
.exec-block.solution{border-left-color: var(--app-accent, var(--app-accent, #00BCD4));background:var(--teal-lighter, #F0FDFE)}
.exec-block.whyus{border-left-color:#26C281;background:#E8FAF3}
.eb-lbl{font-size:9px;font-weight:700;color:#A0B8BE;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px}
.exec-block.problem .eb-lbl{color:#F05C5C}
.exec-block.solution .eb-lbl{color: var(--app-accent, var(--app-accent, #00BCD4))}
.exec-block.whyus .eb-lbl{color:#26C281}
.eb-text{font-size:10px;color:#607D86;line-height:1.6}
.del-list{display:flex;flex-direction:column;gap:4px}
.del-item-p{display:flex;align-items:center;gap:6px;font-size:10px;color:#607D86}
.del-item-p::before{content:'✓';color: var(--app-accent, var(--app-accent, #00BCD4));font-weight:800;font-size:11px;flex-shrink:0}
.tl-p{display:flex;flex-direction:column;gap:0}
.tl-pi{display:flex;gap:8px;padding-bottom:8px}
.tl-pi:last-child{padding-bottom:0}
.tl-dot{width:20px;height:20px;border-radius:50%;background: var(--app-accent, var(--app-accent, #00BCD4));display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:#fff;flex-shrink:0}
.tl-line-p{width:2px;background:var(--teal-light, var(--teal-light, #E0F7FA));flex:1;margin:2px 0;min-height:10px}
.tl-pi:last-child .tl-line-p{display:none}
.tl-pi-title{font-size:10px;font-weight:700;color:#1A2E35}
.tl-pi-date{font-size:9px;color: var(--app-accent, var(--app-accent, #00BCD4));font-weight:600}
.tl-pi-desc{font-size:9px;color:#A0B8BE;margin-top:1px;line-height:1.5}
.team-p{display:flex;flex-wrap:wrap;gap:7px}
.tp-card{padding:7px 9px;background:#F8FAFB;border-radius:8px;border:1px solid #E0EEF0}
.tp-av-p{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:#fff;flex-shrink:0}
.tp-name-p{font-size:10px;font-weight:700;color:#1A2E35}
.tp-role-p{font-size:9px;color:#A0B8BE}
.pricing-tbl{width:100%;border-collapse:collapse}
.pricing-tbl thead tr{background:linear-gradient(135deg, var(--app-accent, var(--app-accent, #00BCD4)),#006E7F)}
.pricing-tbl thead th{padding:6px 8px;font-size:9px;font-weight:700;color:#fff;text-align:left}
.pricing-tbl thead th:last-child{text-align:right}
.pricing-tbl tbody tr{border-bottom:1px solid #E0EEF0}
.pricing-tbl tbody tr:nth-child(even){background:#F8FAFB}
.pricing-tbl tbody td{padding:5px 8px;font-size:10px;color:#1A2E35}
.pricing-tbl tbody td:last-child{text-align:right;font-weight:700}
.pricing-grand{display:flex;justify-content:space-between;padding:6px 8px;background:linear-gradient(135deg, var(--app-accent, var(--app-accent, #00BCD4)),#006E7F);border-radius:6px;margin-top:5px}
.pricing-grand span:first-child{font-size:10px;font-weight:800;color:#fff}
.pricing-grand span:last-child{font-size:12px;font-weight:900;color:#fff}
.val-p{display:flex;flex-direction:column;gap:4px}
.val-pi{display:flex;align-items:flex-start;gap:6px;font-size:10px;color:#607D86}
.val-pi::before{content:'★';color:#F5A623;font-weight:800;font-size:11px;flex-shrink:0}
.cs-p{padding:8px 10px;background:#F8FAFB;border-radius:8px;border-left:3px solid  var(--app-accent, var(--app-accent, #00BCD4));margin-bottom:7px}
.cs-p:last-child{margin-bottom:0}
.cs-p-title{font-size:10px;font-weight:800;color:#1A2E35;margin-bottom:3px}
.cs-p-detail{font-size:9px;color:#A0B8BE;line-height:1.6}
.tm-p{padding:8px 10px;background:var(--teal-lighter, #F0FDFE);border-radius:8px;border:1px solid var(--teal-light, var(--teal-light, #E0F7FA));margin-bottom:7px;font-style:italic}
.tm-p:last-child{margin-bottom:0}
.tm-p-text{font-size:10px;color:#607D86;margin-bottom:5px}
.tm-p-author{font-size:9px;font-weight:700;color: var(--app-accent, var(--app-accent, #00BCD4))}
.risk-p{display:flex;flex-direction:column;gap:4px}
.risk-pi{display:flex;align-items:flex-start;gap:7px;padding:5px 8px;border-radius:7px;background:#F8FAFB;border:1px solid #E0EEF0}
.risk-badge-p{font-size:8px;font-weight:800;padding:1px 6px;border-radius:20px;flex-shrink:0}
.risk-badge-p.h{background:#FEF2F2;color:#F05C5C}
.risk-badge-p.m{background:#FEF5E6;color:#F5A623}
.risk-badge-p.l{background:#E8FAF3;color:#26C281}
.risk-pi-text{font-size:9px;color:#607D86;flex:1}
.risk-pi-mit{font-size:9px;color:#A0B8BE;font-style:italic}
.sop{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sob{padding:10px;background:#F8FAFB;border-radius:8px;border:1px solid #E0EEF0;text-align:center}
.sob-line{width:70px;height:1px;background:#A0B8BE;margin:0 auto 4px}
.sob-name{font-size:10px;font-weight:700;color:#1A2E35}
.sob-role{font-size:9px;color:#A0B8BE}
`;

const HARDCODED_VARS = `
  --teal: var(--app-accent, var(--app-accent, #00BCD4)); --teal2:var(--app-accent2, #00ACC1); --teal3:#26D0CE; --teal4:#006E7F;
  --teal-light:var(--teal-light, var(--teal-light, #E0F7FA)); --teal-lighter:var(--teal-lighter, #F0FDFE);
  --bg:#F5FAFA; --surface:#FFFFFF; --surface2:#F8FAFB;
  --border:#E0EEF0; --border2:#C5DDE0;
  --text:#1A2E35; --text2:#607D86; --text3:#A0B8BE;
  --green:#26C281; --green-bg:#E8FAF3;
  --amber:#F5A623; --amber-bg:#FEF5E6;
  --red:#F05C5C; --red-bg:#FEF2F2;
  --purple:#7C5CFC; --purple-bg:#EEE9FF;
  --blue:#2563EB; --blue-bg:#EFF4FF;
  --app-accent: var(--app-accent, var(--app-accent, #00BCD4));
  --font:'Nunito',sans-serif;
`;

const PRINT_BASE_CSS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family:'Nunito','Segoe UI',Arial,sans-serif;
    background:#fff;
    color:#1A2E35;
    -webkit-print-color-adjust:exact !important;
    print-color-adjust:exact !important;
  }
  @page { size:A4; margin:8mm; }
  @media print {
    * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
    .no-print { display:none !important; }
    body { background:#fff !important; }
  }
  .p-cover { background:linear-gradient(135deg,#003E4E 0%,#005F73 35%,#0096B4 70%,#26D0CE 100%) !important; }
  .ps-lbl { color: var(--app-accent, var(--app-accent, #00BCD4)) !important; }
  .pb-lbl { color: var(--app-accent, var(--app-accent, #00BCD4)) !important; }
  .exec-block.problem { border-left-color:#F05C5C !important; background:#FEF2F2 !important; }
  .exec-block.solution { border-left-color: var(--app-accent, var(--app-accent, #00BCD4)) !important; background:var(--teal-lighter, #F0FDFE) !important; }
  .exec-block.whyus { border-left-color:#26C281 !important; background:#E8FAF3 !important; }
  .exec-block.problem .eb-lbl { color:#F05C5C !important; }
  .exec-block.solution .eb-lbl { color: var(--app-accent, var(--app-accent, #00BCD4)) !important; }
  .exec-block.whyus .eb-lbl { color:#26C281 !important; }
  .tl-dot { background: var(--app-accent, var(--app-accent, #00BCD4)) !important; }
  .tl-line-p { background:var(--teal-light, var(--teal-light, #E0F7FA)) !important; }
  .tl-pi-date { color: var(--app-accent, var(--app-accent, #00BCD4)) !important; }
  .del-item-p::before { color: var(--app-accent, var(--app-accent, #00BCD4)) !important; content:'✓' !important; }
  .pricing-tbl thead tr { background:linear-gradient(135deg, var(--app-accent, var(--app-accent, #00BCD4)),#006E7F) !important; }
  .pricing-grand { background:linear-gradient(135deg, var(--app-accent, var(--app-accent, #00BCD4)),#006E7F) !important; }
  .risk-badge-p.h { background:#FEF2F2 !important; color:#F05C5C !important; }
  .risk-badge-p.m { background:#FEF5E6 !important; color:#F5A623 !important; }
  .risk-badge-p.l { background:#E8FAF3 !important; color:#26C281 !important; }
  .party-b { background:#F8FAFB !important; border:1px solid #E0EEF0 !important; }
  .tp-card { background:#F8FAFB !important; border:1px solid #E0EEF0 !important; }
  .tm-p { background:var(--teal-lighter, #F0FDFE) !important; border:1px solid var(--teal-light, var(--teal-light, #E0F7FA)) !important; }
  .cs-p { border-left-color: var(--app-accent, var(--app-accent, #00BCD4)) !important; background:#F8FAFB !important; }
  .val-pi::before { content:'★' !important; color:#F5A623 !important; }
`;

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

function getTheme(name) {
  return THEMES.find(x => x.name === name) || { p: " var(--app-accent, var(--app-accent, #00BCD4))", g: "linear-gradient(135deg, var(--app-accent, var(--app-accent, #00BCD4)),#006E7F)" };
}

function getElementsHTML(elements) {
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
      inner = `<div style="width:100%;height:100%;background:${el.color || " var(--app-accent, var(--app-accent, #00BCD4))"};border-radius:${br};"></div>`;
    } else if (el.type === "image") {
      inner = `<img src="${el.src}" style="width:100%;height:100%;object-fit:contain;" />`;
    } else if (el.type === "icon") {
      inner = `<div style="font-size:${el.fontSize || 40}px;text-align:center;">${el.icon}</div>`;
    }
    return `<div style="position:absolute;left:${el.x || 0}px;top:${el.y || 0}px;width:${w}px;height:${h}px;">${inner}</div>`;
  }).join("")}
  </div>`;
}

function buildSlidesHTML(proposal) {
  const t = getTheme(proposal.theme);

  let html = proposal.slides.map(slide => {
    const elHTML = getElementsHTML(slide.elements);

    if (slide.type === "cover") {
      return `<div style="page-break-after:always;min-height:270mm;display:flex;flex-direction:column;justify-content:flex-end;position:relative;overflow:hidden;">
        ${slide.coverImage ? `<img src="${slide.coverImage}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;" />` : ""}
        <div style="position:absolute;inset:0;background:linear-gradient(150deg,${t.p}cc 0%,rgba(0,0,0,0.85) 60%);z-index:1;"></div>
        <div style="position:relative;z-index:2;padding:48px 56px;">
          <h1 style="font-size:42px;font-weight:900;color:#fff;margin-bottom:14px;line-height:1.1;">${slide.title || "Project Proposal"}</h1>
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
        <div>${(slide.items || []).map((item, i) => `
          <div style="display:flex;gap:16px;align-items:flex-start;padding:14px 18px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:10px;">
            <div style="width:32px;height:32px;min-width:32px;border-radius:50%;background:${t.g};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;">${i + 1}</div>
            <div style="font-size:14px;color:#1e293b;font-weight:600;padding-top:4px;">${item}</div>
          </div>`).join("")}</div>
        ${elHTML}
      </div>`;
    }

    if (slide.type === "timeline") {
      return `<div style="page-break-after:always;min-height:270mm;padding:56px;background:#fff;position:relative;">
        <div style="width:56px;height:6px;background:${t.g};border-radius:3px;margin-bottom:20px;"></div>
        <h1 style="font-size:32px;font-weight:800;color:#0f172a;margin-bottom:32px;">${slide.heading || ""}</h1>
        <div style="display:flex;gap:12px;">
          ${(slide.phases || []).map((ph, i) => `
            <div style="flex:1;text-align:center;">
              <div style="width:36px;height:36px;border-radius:50%;background:${i < 2 ? t.g : "#fff"};border:3px solid ${t.p};margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;color:${i < 2 ? "#fff" : t.p};">${i + 1}</div>
              <div style="background:#f8fafc;border-radius:10px;padding:10px 8px;border:1px solid #e2e8f0;">
                <div style="font-size:11px;font-weight:800;color:#0f172a;margin-bottom:5px;">${ph.label}</div>
                <div style="display:inline-block;background:${t.g};color:#fff;border-radius:20px;padding:2px 10px;font-size:10px;font-weight:700;">${ph.dur}</div>
              </div>
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
          <thead><tr style="background:${t.g};">
            <th style="padding:12px 20px;text-align:left;color:#fff;font-size:13px;">Item</th>
            <th style="padding:12px 20px;text-align:right;color:#fff;font-size:13px;">Cost</th>
          </tr></thead>
          <tbody>${(slide.rows || []).map((r, i) => `
            <tr style="border-bottom:1px solid #e2e8f0;background:${i % 2 ? "#f8fafc" : "#fff"};">
              <td style="padding:12px 20px;font-size:13px;color:#374151;">${r.item}</td>
              <td style="padding:12px 20px;text-align:right;font-size:13px;font-weight:700;">${r.cost}</td>
            </tr>`).join("")}</tbody>
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
              <div style="font-size:13px;font-weight:800;color:#0f172a;">${m.name || ""}</div>
              <div style="font-size:11px;color:${t.p};font-weight:600;margin-top:3px;">${m.role || ""}</div>
            </div>`).join("")}
        </div>
        ${elHTML}
      </div>`;
    }

    if (slide.type === "process") {
      return `<div style="page-break-after:always;min-height:270mm;padding:56px;background:#fff;position:relative;">
        <div style="width:56px;height:6px;background:${t.g};border-radius:3px;margin-bottom:20px;"></div>
        <h1 style="font-size:32px;font-weight:800;color:#0f172a;margin-bottom:24px;">${slide.heading || ""}</h1>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">
          ${(slide.steps || []).map(s => `
            <div style="padding:22px 14px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;text-align:center;">
              <div style="font-size:26px;margin-bottom:10px;">${s.icon || ""}</div>
              <div style="font-size:12px;font-weight:800;color:#0f172a;margin-bottom:4px;">${s.label || ""}</div>
              <div style="font-size:10px;color:#64748b;">${s.desc || ""}</div>
            </div>`).join("")}
        </div>
        ${elHTML}
      </div>`;
    }

    return `<div style="page-break-after:always;min-height:270mm;padding:40px 56px;background:#fff;position:relative;">
      ${slide.heading ? `<h1 style="font-size:26px;font-weight:800;color:#0f172a;margin-bottom:14px;">${slide.heading}</h1>` : ""}
      ${slide.body ? `<p style="font-size:14px;color:#4b5563;line-height:1.8;white-space:pre-wrap;">${slide.body}</p>` : ""}
      ${elHTML}
    </div>`;
  }).join("");

  html += `
  <div style="padding:40px 56px;background:#fff;">
    <div style="border-top:2px solid  var(--app-accent, var(--app-accent, #00BCD4));padding-top:24px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
        <div style="padding:20px;background:#F8FAFB;border-radius:12px;border:1px solid #E0EEF0;text-align:center;">
          <div style="font-size:9px;font-weight:700;color:#96B0B8;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">Authorised Signatory</div>
          <div style="height:52px;margin-bottom:12px;"></div>
          <div style="height:1px;background:#C5DDE0;margin-bottom:8px;"></div>
          <div style="font-size:11px;font-weight:700;color:#0D2027;">Company Representative</div>
        </div>
        <div style="padding:20px;background:${proposal.clientSignature ? "#F0FDF4" : "#FFFBEB"};border-radius:12px;border:${proposal.clientSignature ? "1.5px solid #86efac" : "1.5px dashed #FCD34D"};text-align:center;">
          <div style="font-size:9px;font-weight:700;color:#96B0B8;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">Client Acceptance</div>
          <div style="height:52px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;">
            ${proposal.clientSignature
      ? proposal.clientSignature.startsWith("data:image")
        ? `<img src="${proposal.clientSignature}" style="max-height:48px;max-width:100%;object-fit:contain;" />`
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
export async function printProposal(proposal) {
  if (!proposal) return;
  const liveDocSnapshot = document.getElementById('propDoc');
  proposal = { ...proposal, __liveHTML: liveDocSnapshot ? liveDocSnapshot.outerHTML : null };
  if (typeof window.html2pdf === 'undefined') {
    await new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }

  let bodyHTML = "";
  if (proposal.__liveHTML) {
    bodyHTML = proposal.__liveHTML;
  } else if (proposal.html && proposal.html.trim()) {
    bodyHTML = proposal.html;
  } else if (proposal.slides && proposal.slides.length > 0) {
    bodyHTML = buildSlidesHTML(proposal);
  } else {
    bodyHTML = `<div style="padding:80px;text-align:center;color:#aaa;font-size:14px;">No proposal content to display.</div>`;
  }
  let resolvedVars = HARDCODED_VARS;
  try {
    const cs = getComputedStyle(document.documentElement);
    const varNames = ["--teal", "--teal2", "--teal3", "--teal4", "--teal-light", "--teal-lighter",
      "--bg", "--surface", "--surface2", "--border", "--border2", "--text", "--text2", "--text3",
      "--green", "--green-bg", "--amber", "--amber-bg", "--red", "--red-bg", "--purple", "--purple-bg",
      "--blue", "--blue-bg", "--app-accent"];
    const live = varNames
      .map(v => { const val = cs.getPropertyValue(v).trim(); return val ? `${v}:${val};` : ""; })
      .filter(Boolean).join("\n");
    if (live) resolvedVars = live;
  } catch (e) { }

  const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${proposal.title || "Proposal"}</title>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    :root { ${resolvedVars} }
    ${PRINT_BASE_CSS}
    ${PROPOSAL_PREVIEW_CSS}
  </style>
</head>
<body>${bodyHTML}</body>
</html>`;

  const existingFrame = document.getElementById("__proposal_print_frame__");
  if (existingFrame) existingFrame.remove();

  const existingContainer = document.getElementById("__proposal_pdf_container__");
  if (existingContainer) existingContainer.remove();

  const container = document.createElement("div");
  container.id = "__proposal_pdf_container__";
  container.style.cssText = "position:fixed;top:0;left:0;width:210mm;background:#fff;z-index:999999;opacity:0;pointer-events:none;";
  container.innerHTML = `<style>:root{${resolvedVars}}${PRINT_BASE_CSS}${PROPOSAL_PREVIEW_CSS}</style>${bodyHTML}`;
  document.body.appendChild(container);

  const waitForImages = () => {
    const imgs = Array.from(container.querySelectorAll('img'));
    return Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res; })));
  };
  await new Promise(resolve => setTimeout(async () => {
    try {
      if (!bodyHTML || bodyHTML.includes('No proposal content to display')) {
        console.warn('printProposal: no content found, propDoc missing at call time');
      }
      await waitForImages();
      await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
      await new Promise(res => setTimeout(res, 300));
      const worker = window.html2pdf().from(container).set({
        filename: `${(proposal.title || 'proposal').replace(/[^a-z0-9]/gi, '_')}.pdf`,
        margin: 0,
        html2canvas: { scale: 1.5, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' },
        jsPDF: { format: 'a4', unit: 'mm' }
      });
      const blob = await worker.output('blob');
      const fileName = `${(proposal.title || 'proposal').replace(/[^a-z0-9]/gi, '_')}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
        } catch (err) {
          if (err.name !== 'AbortError') {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            a.click();
          }
        }
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
      }
    } catch (e) {
      console.error('PDF generation error:', e);
    } finally {
      try { container.remove(); } catch (e) { }
      resolve();
    }
  }, 400));
}

export async function shareProposalAsPDF(proposal, companyName, onStatusUpdate) {
  if (onStatusUpdate) await onStatusUpdate(proposal);
  printProposal(proposal);
}

export function buildProposalHTML(proposal) {
  if (!proposal) return "";
  let body = "";
  if (proposal.html && proposal.html.trim()) {
    body = proposal.html;
  } else if (proposal.slides && proposal.slides.length > 0) {
    body = buildSlidesHTML(proposal);
  } else {
    body = `<div style="padding:80px;text-align:center;color:#aaa;">No content.</div>`;
  }
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>:root{${HARDCODED_VARS}}${PRINT_BASE_CSS}${PROPOSAL_PREVIEW_CSS}</style></head><body>${body}</body></html>`;
}