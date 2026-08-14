// proposalPrintUtils.js

const PROPOSAL_PREVIEW_CSS = `
:root{
  --teal: var(--app-accent, var(--app-accent, #2563EB));--teal2:var(--app-accent2, #2563EB);--teal3:#2563EB;--teal4:#16A34A;
  --teal-light:var(--teal-light, var(--teal-light, #EFF6FF));--teal-lighter:var(--teal-lighter, #EFF6FF);
  --bg:#F8FAFC;--surface:#FFFFFF;--surface2:#F8FAFC;--border:#E2E8F0;--border2:#E2E8F0;
  --text:#1E293B;--text2:#64748B;--text3:#64748B;
  --green:#16A34A;--green-bg:#EFF6FF;
  --amber:#64748B;--amber-bg:#F8FAFC;
  --red:#64748B;--red-bg:#F8FAFC;
  --purple:#2563EB;--purple-bg:#EFF6FF;
  --blue:#2563EB;--blue-bg:#EFF6FF;
  --font:'Nunito',sans-serif;
}
.prop-doc{font-family:'Nunito',sans-serif;font-size:12px;color:#1E293B;}
.p-cover{background:linear-gradient(135deg,#1E293B 0%,#16A34A 35%,#2563EB 70%,#2563EB 100%);padding:26px 22px;position:relative;overflow:hidden;}
.p-logo{width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.18);border:1.5px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#FFFFFF;margin-bottom:14px;position:relative;z-index:1}
.p-label{font-size:9px;font-weight:700;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;position:relative;z-index:1}
.p-title{font-size:17px;font-weight:900;color:#FFFFFF;letter-spacing:-.3px;line-height:1.25;margin-bottom:5px;position:relative;z-index:1}
.p-subtitle{font-size:11px;color:rgba(255,255,255,.7);margin-bottom:14px;position:relative;z-index:1}
.p-meta{display:flex;gap:12px;flex-wrap:wrap;position:relative;z-index:1}
.p-meta-i{display:flex;align-items:center;gap:4px;font-size:10px;color:rgba(255,255,255,.7);font-weight:600}
.p-badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;background:rgba(255,255,255,.15);color:#FFFFFF;border:1px solid rgba(255,255,255,.2);margin-top:9px;position:relative;z-index:1}
.ps{padding:14px 18px;border-bottom:1px solid #E2E8F0}
.ps:last-child{border-bottom:none}
.ps-lbl{font-size:9px;font-weight:700;color: var(--app-accent, var(--app-accent, #2563EB));text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;display:flex;align-items:center;gap:5px}
.party-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.party-b{padding:9px 11px;background:#F8FAFC;border-radius:8px;border:1px solid #E2E8F0}
.pb-lbl{font-size:8px;font-weight:700;color: var(--app-accent, var(--app-accent, #2563EB));text-transform:uppercase;letter-spacing:.7px;margin-bottom:3px}
.pb-name{font-size:11px;font-weight:800;color:#1E293B}
.pb-detail{font-size:9px;color:#64748B;line-height:1.7;margin-top:1px}
.exec-block{margin-bottom:8px;padding:9px 11px;border-radius:8px;border-left:3px solid #E2E8F0}
.exec-block.problem{border-left-color:#64748B;background:#F8FAFC}
.exec-block.solution{border-left-color: var(--app-accent, var(--app-accent, #2563EB));background:var(--teal-lighter, #EFF6FF)}
.exec-block.whyus{border-left-color:#16A34A;background:#EFF6FF}
.eb-lbl{font-size:9px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px}
.exec-block.problem .eb-lbl{color:#64748B}
.exec-block.solution .eb-lbl{color: var(--app-accent, var(--app-accent, #2563EB))}
.exec-block.whyus .eb-lbl{color:#16A34A}
.eb-text{font-size:10px;color:#64748B;line-height:1.6}
.del-list{display:flex;flex-direction:column;gap:4px}
.del-item-p{display:flex;align-items:center;gap:6px;font-size:10px;color:#64748B}
.del-item-p::before{content:'✓';color: var(--app-accent, var(--app-accent, #2563EB));font-weight:800;font-size:11px;flex-shrink:0}
.tl-p{display:flex;flex-direction:column;gap:0}
.tl-pi{display:flex;gap:8px;padding-bottom:8px}
.tl-pi:last-child{padding-bottom:0}
.tl-dot{width:20px;height:20px;border-radius:50%;background: var(--app-accent, var(--app-accent, #2563EB));display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:#FFFFFF;flex-shrink:0}
.tl-line-p{width:2px;background:var(--teal-light, var(--teal-light, #EFF6FF));flex:1;margin:2px 0;min-height:10px}
.tl-pi:last-child .tl-line-p{display:none}
.tl-pi-title{font-size:10px;font-weight:700;color:#1E293B}
.tl-pi-date{font-size:9px;color: var(--app-accent, var(--app-accent, #2563EB));font-weight:600}
.tl-pi-desc{font-size:9px;color:#64748B;margin-top:1px;line-height:1.5}
.team-p{display:flex;flex-wrap:wrap;gap:7px}
.tp-card{padding:7px 9px;background:#F8FAFC;border-radius:8px;border:1px solid #E2E8F0}
.tp-av-p{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:#FFFFFF;flex-shrink:0}
.tp-name-p{font-size:10px;font-weight:700;color:#1E293B}
.tp-role-p{font-size:9px;color:#64748B}
.pricing-tbl{width:100%;border-collapse:collapse}
.pricing-tbl thead tr{background:linear-gradient(135deg, var(--app-accent, var(--app-accent, #2563EB)),#16A34A)}
.pricing-tbl thead th{padding:6px 8px;font-size:9px;font-weight:700;color:#FFFFFF;text-align:left}
.pricing-tbl thead th:last-child{text-align:right}
.pricing-tbl tbody tr{border-bottom:1px solid #E2E8F0}
.pricing-tbl tbody tr:nth-child(even){background:#F8FAFC}
.pricing-tbl tbody td{padding:5px 8px;font-size:10px;color:#1E293B}
.pricing-tbl tbody td:last-child{text-align:right;font-weight:700}
.pricing-grand{display:flex;justify-content:space-between;padding:6px 8px;background:linear-gradient(135deg, var(--app-accent, var(--app-accent, #2563EB)),#16A34A);border-radius:6px;margin-top:5px}
.pricing-grand span:first-child{font-size:10px;font-weight:800;color:#FFFFFF}
.pricing-grand span:last-child{font-size:12px;font-weight:900;color:#FFFFFF}
.val-p{display:flex;flex-direction:column;gap:4px}
.val-pi{display:flex;align-items:flex-start;gap:6px;font-size:10px;color:#64748B}
.val-pi::before{content:'★';color:#64748B;font-weight:800;font-size:11px;flex-shrink:0}
.cs-p{padding:8px 10px;background:#F8FAFC;border-radius:8px;border-left:3px solid  var(--app-accent, var(--app-accent, #2563EB));margin-bottom:7px}
.cs-p:last-child{margin-bottom:0}
.cs-p-title{font-size:10px;font-weight:800;color:#1E293B;margin-bottom:3px}
.cs-p-detail{font-size:9px;color:#64748B;line-height:1.6}
.tm-p{padding:8px 10px;background:var(--teal-lighter, #EFF6FF);border-radius:8px;border:1px solid var(--teal-light, var(--teal-light, #EFF6FF));margin-bottom:7px;font-style:italic}
.tm-p:last-child{margin-bottom:0}
.tm-p-text{font-size:10px;color:#64748B;margin-bottom:5px}
.tm-p-author{font-size:9px;font-weight:700;color: var(--app-accent, var(--app-accent, #2563EB))}
.risk-p{display:flex;flex-direction:column;gap:4px}
.risk-pi{display:flex;align-items:flex-start;gap:7px;padding:5px 8px;border-radius:7px;background:#F8FAFC;border:1px solid #E2E8F0}
.risk-badge-p{font-size:8px;font-weight:800;padding:1px 6px;border-radius:20px;flex-shrink:0}
.risk-badge-p.h{background:#F8FAFC;color:#64748B}
.risk-badge-p.m{background:#F8FAFC;color:#64748B}
.risk-badge-p.l{background:#EFF6FF;color:#16A34A}
.risk-pi-text{font-size:9px;color:#64748B;flex:1}
.risk-pi-mit{font-size:9px;color:#64748B;font-style:italic}
.sop{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sob{padding:10px;background:#F8FAFC;border-radius:8px;border:1px solid #E2E8F0;text-align:center}
.sob-line{width:70px;height:1px;background:#64748B;margin:0 auto 4px}
.sob-name{font-size:10px;font-weight:700;color:#1E293B}
.sob-role{font-size:9px;color:#64748B}
`;

const HARDCODED_VARS = `
  --teal: var(--app-accent, var(--app-accent, #2563EB)); --teal2:var(--app-accent2, #2563EB); --teal3:#2563EB; --teal4:#16A34A;
  --teal-light:var(--teal-light, var(--teal-light, #EFF6FF)); --teal-lighter:var(--teal-lighter, #EFF6FF);
  --bg:#F8FAFC; --surface:#FFFFFF; --surface2:#F8FAFC;
  --border:#E2E8F0; --border2:#E2E8F0;
  --text:#1E293B; --text2:#64748B; --text3:#64748B;
  --green:#16A34A; --green-bg:#EFF6FF;
  --amber:#64748B; --amber-bg:#F8FAFC;
  --red:#64748B; --red-bg:#F8FAFC;
  --purple:#2563EB; --purple-bg:#EFF6FF;
  --blue:#2563EB; --blue-bg:#EFF6FF;
  --app-accent: var(--app-accent, var(--app-accent, #2563EB));
  --font:'Nunito',sans-serif;
`;

const PRINT_BASE_CSS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family:'Nunito','Segoe UI',Arial,sans-serif;
    background:#FFFFFF;
    color:#1E293B;
    -webkit-print-color-adjust:exact !important;
    print-color-adjust:exact !important;
  }
  @page { size:A4; margin:8mm; }
  @media print {
    * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
    .no-print { display:none !important; }
    body { background:#FFFFFF !important; }
  }
  .p-cover { background:linear-gradient(135deg,#1E293B 0%,#16A34A 35%,#2563EB 70%,#2563EB 100%) !important; }
  .ps-lbl { color: var(--app-accent, var(--app-accent, #2563EB)) !important; }
  .pb-lbl { color: var(--app-accent, var(--app-accent, #2563EB)) !important; }
  .exec-block.problem { border-left-color:#64748B !important; background:#F8FAFC !important; }
  .exec-block.solution { border-left-color: var(--app-accent, var(--app-accent, #2563EB)) !important; background:var(--teal-lighter, #EFF6FF) !important; }
  .exec-block.whyus { border-left-color:#16A34A !important; background:#EFF6FF !important; }
  .exec-block.problem .eb-lbl { color:#64748B !important; }
  .exec-block.solution .eb-lbl { color: var(--app-accent, var(--app-accent, #2563EB)) !important; }
  .exec-block.whyus .eb-lbl { color:#16A34A !important; }
  .tl-dot { background: var(--app-accent, var(--app-accent, #2563EB)) !important; }
  .tl-line-p { background:var(--teal-light, var(--teal-light, #EFF6FF)) !important; }
  .tl-pi-date { color: var(--app-accent, var(--app-accent, #2563EB)) !important; }
  .del-item-p::before { color: var(--app-accent, var(--app-accent, #2563EB)) !important; content:'✓' !important; }
  .pricing-tbl thead tr { background:linear-gradient(135deg, var(--app-accent, var(--app-accent, #2563EB)),#16A34A) !important; }
  .pricing-grand { background:linear-gradient(135deg, var(--app-accent, var(--app-accent, #2563EB)),#16A34A) !important; }
  .risk-badge-p.h { background:#F8FAFC !important; color:#64748B !important; }
  .risk-badge-p.m { background:#F8FAFC !important; color:#64748B !important; }
  .risk-badge-p.l { background:#EFF6FF !important; color:#16A34A !important; }
  .party-b { background:#F8FAFC !important; border:1px solid #E2E8F0 !important; }
  .tp-card { background:#F8FAFC !important; border:1px solid #E2E8F0 !important; }
  .tm-p { background:var(--teal-lighter, #EFF6FF) !important; border:1px solid var(--teal-light, var(--teal-light, #EFF6FF)) !important; }
  .cs-p { border-left-color: var(--app-accent, var(--app-accent, #2563EB)) !important; background:#F8FAFC !important; }
  .val-pi::before { content:'★' !important; color:#64748B !important; }
`;

const THEMES = [
  { name: "Professional", p: "#2563EB", g: "linear-gradient(135deg,#0F172A,#2563EB)" },
  { name: "Navy", p: "#0F172A", g: "linear-gradient(135deg,#0F172A,#1E293B)" },
  { name: "Success", p: "#16A34A", g: "linear-gradient(135deg,#0F172A,#16A34A)" },
];

function getTheme(name) {
  return THEMES.find(x => x.name === name) || { p: " var(--app-accent, var(--app-accent, #2563EB))", g: "linear-gradient(135deg, var(--app-accent, var(--app-accent, #2563EB)),#16A34A)" };
}

function getElementsHTML(elements) {
  if (!elements || elements.length === 0) return "";
  return `<div style="position:absolute;inset:0;pointer-events:none;z-index:20;">
    ${elements.map(el => {
    const w = typeof el.w === "number" ? el.w : 200;
    const h = typeof el.h === "number" ? el.h : 60;
    let inner = "";
    if (el.type === "text") {
      inner = `<div style="font-size:${el.fontSize || 16}px;font-weight:${el.fontWeight || 400};color:${el.color || "#0F172A"};white-space:pre-wrap;word-break:break-word;width:100%;padding:8px;text-align:center;">${el.val || ""}</div>`;
    } else if (el.type === "shape") {
      const br = el.borderRadius !== undefined ? el.borderRadius + "px" : (el.shape === "circle" ? "50%" : "8px");
      inner = `<div style="width:100%;height:100%;background:${el.color || " var(--app-accent, var(--app-accent, #2563EB))"};border-radius:${br};"></div>`;
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
          <h1 style="font-size:42px;font-weight:900;color:#FFFFFF;margin-bottom:14px;line-height:1.1;">${slide.title || "Project Proposal"}</h1>
          <p style="font-size:15px;color:rgba(255,255,255,0.75);">${slide.subtitle || ""}</p>
        </div>
        ${elHTML}
      </div>`;
    }

    if (slide.type === "overview" || slide.type === "closing") {
      return `<div style="page-break-after:always;min-height:270mm;padding:56px;background:#FFFFFF;position:relative;">
        <div style="width:56px;height:6px;background:${t.g};border-radius:3px;margin-bottom:20px;"></div>
        <h1 style="font-size:32px;font-weight:800;color:#0F172A;margin-bottom:20px;">${slide.heading || ""}</h1>
        <p style="font-size:15px;color:#64748B;line-height:1.9;white-space:pre-wrap;">${slide.body || ""}</p>
        ${slide.cta ? `<div style="margin-top:32px;display:inline-block;background:${t.g};color:#FFFFFF;border-radius:14px;padding:14px 32px;font-size:15px;font-weight:700;">${slide.cta}</div>` : ""}
        ${elHTML}
      </div>`;
    }

    if (slide.type === "objectives") {
      return `<div style="page-break-after:always;min-height:270mm;padding:56px;background:#FFFFFF;position:relative;">
        <div style="width:56px;height:6px;background:${t.g};border-radius:3px;margin-bottom:20px;"></div>
        <h1 style="font-size:32px;font-weight:800;color:#0F172A;margin-bottom:24px;">${slide.heading || ""}</h1>
        <div>${(slide.items || []).map((item, i) => `
          <div style="display:flex;gap:16px;align-items:flex-start;padding:14px 18px;background:#F8FAFC;border-radius:12px;border:1px solid #E2E8F0;margin-bottom:10px;">
            <div style="width:32px;height:32px;min-width:32px;border-radius:50%;background:${t.g};color:#FFFFFF;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;">${i + 1}</div>
            <div style="font-size:14px;color:#1E293B;font-weight:600;padding-top:4px;">${item}</div>
          </div>`).join("")}</div>
        ${elHTML}
      </div>`;
    }

    if (slide.type === "timeline") {
      return `<div style="page-break-after:always;min-height:270mm;padding:56px;background:#FFFFFF;position:relative;">
        <div style="width:56px;height:6px;background:${t.g};border-radius:3px;margin-bottom:20px;"></div>
        <h1 style="font-size:32px;font-weight:800;color:#0F172A;margin-bottom:32px;">${slide.heading || ""}</h1>
        <div style="display:flex;gap:12px;">
          ${(slide.phases || []).map((ph, i) => `
            <div style="flex:1;text-align:center;">
              <div style="width:36px;height:36px;border-radius:50%;background:${i < 2 ? t.g : "#FFFFFF"};border:3px solid ${t.p};margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;color:${i < 2 ? "#FFFFFF" : t.p};">${i + 1}</div>
              <div style="background:#F8FAFC;border-radius:10px;padding:10px 8px;border:1px solid #E2E8F0;">
                <div style="font-size:11px;font-weight:800;color:#0F172A;margin-bottom:5px;">${ph.label}</div>
                <div style="display:inline-block;background:${t.g};color:#FFFFFF;border-radius:20px;padding:2px 10px;font-size:10px;font-weight:700;">${ph.dur}</div>
              </div>
            </div>`).join("")}
        </div>
        ${elHTML}
      </div>`;
    }

    if (slide.type === "budget") {
      return `<div style="page-break-after:always;min-height:270mm;padding:56px;background:#FFFFFF;position:relative;">
        <div style="width:56px;height:6px;background:${t.g};border-radius:3px;margin-bottom:20px;"></div>
        <h1 style="font-size:32px;font-weight:800;color:#0F172A;margin-bottom:24px;">${slide.heading || ""}</h1>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:${t.g};">
            <th style="padding:12px 20px;text-align:left;color:#FFFFFF;font-size:13px;">Item</th>
            <th style="padding:12px 20px;text-align:right;color:#FFFFFF;font-size:13px;">Cost</th>
          </tr></thead>
          <tbody>${(slide.rows || []).map((r, i) => `
            <tr style="border-bottom:1px solid #E2E8F0;background:${i % 2 ? "#F8FAFC" : "#FFFFFF"};">
              <td style="padding:12px 20px;font-size:13px;color:#1E293B;">${r.item}</td>
              <td style="padding:12px 20px;text-align:right;font-size:13px;font-weight:700;">${r.cost}</td>
            </tr>`).join("")}</tbody>
        </table>
        <div style="display:flex;justify-content:flex-end;margin-top:12px;padding:12px 20px;background:${t.g};border-radius:10px;">
          <span style="color:#FFFFFF;font-weight:900;font-size:17px;">Total: ${slide.total || ""}</span>
        </div>
        ${elHTML}
      </div>`;
    }

    if (slide.type === "team") {
      return `<div style="page-break-after:always;min-height:270mm;padding:56px;background:#FFFFFF;position:relative;">
        <div style="width:56px;height:6px;background:${t.g};border-radius:3px;margin-bottom:20px;"></div>
        <h1 style="font-size:32px;font-weight:800;color:#0F172A;margin-bottom:24px;">${slide.heading || ""}</h1>
        <div style="display:flex;gap:16px;flex-wrap:wrap;">
          ${(slide.members || []).map(m => `
            <div style="flex:1 1 150px;padding:20px 14px;background:#F8FAFC;border-radius:14px;border:1px solid #E2E8F0;text-align:center;">
              <div style="width:48px;height:48px;border-radius:50%;background:${t.g};margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:16px;color:#FFFFFF;font-weight:900;">${m.avatar || (m.name || "?")[0]}</div>
              <div style="font-size:13px;font-weight:800;color:#0F172A;">${m.name || ""}</div>
              <div style="font-size:11px;color:${t.p};font-weight:600;margin-top:3px;">${m.role || ""}</div>
            </div>`).join("")}
        </div>
        ${elHTML}
      </div>`;
    }

    if (slide.type === "process") {
      return `<div style="page-break-after:always;min-height:270mm;padding:56px;background:#FFFFFF;position:relative;">
        <div style="width:56px;height:6px;background:${t.g};border-radius:3px;margin-bottom:20px;"></div>
        <h1 style="font-size:32px;font-weight:800;color:#0F172A;margin-bottom:24px;">${slide.heading || ""}</h1>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">
          ${(slide.steps || []).map(s => `
            <div style="padding:22px 14px;background:#F8FAFC;border-radius:14px;border:1px solid #E2E8F0;text-align:center;">
              <div style="font-size:26px;margin-bottom:10px;">${s.icon || ""}</div>
              <div style="font-size:12px;font-weight:800;color:#0F172A;margin-bottom:4px;">${s.label || ""}</div>
              <div style="font-size:10px;color:#64748B;">${s.desc || ""}</div>
            </div>`).join("")}
        </div>
        ${elHTML}
      </div>`;
    }

    return `<div style="page-break-after:always;min-height:270mm;padding:40px 56px;background:#FFFFFF;position:relative;">
      ${slide.heading ? `<h1 style="font-size:26px;font-weight:800;color:#0F172A;margin-bottom:14px;">${slide.heading}</h1>` : ""}
      ${slide.body ? `<p style="font-size:14px;color:#64748B;line-height:1.8;white-space:pre-wrap;">${slide.body}</p>` : ""}
      ${elHTML}
    </div>`;
  }).join("");

  return html;
}
export async function printProposal(proposal, mode = 'view', preOpenedWin = null) {
  if (!proposal) return;
  // Only use the live-editor DOM snapshot when we're actually inside the
  // proposal editor AND viewing the same proposal that's currently open there.
  // Otherwise (e.g. View from Project Details → Accounts, or Project Proposals list)
  // always render from the persisted proposal data so the PDF is identical everywhere.
  const currentEditorId = window._currentProposalDoc?._id || window._currentProposalDoc?.id;
  const thisProposalId = proposal._id || proposal.id;
  const liveDocSnapshot =
    currentEditorId && thisProposalId && currentEditorId === thisProposalId
      ? document.getElementById('propDoc')
      : null;
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
    console.warn('printProposal: no html/slides found on proposal', {
      id: proposal._id || proposal.id,
      hasHtml: !!proposal.html,
      slidesLen: (proposal.slides || []).length,
      hasFormData: !!(proposal.formData && Object.keys(proposal.formData).length),
      format: proposal.format,
    });
    bodyHTML = `<div style="padding:80px;text-align:center;color:#64748B;font-size:14px;">No proposal content to display.</div>`;
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
    .__proposal_tab_bar { position:sticky; top:0; z-index:9999; display:flex; align-items:center; justify-content:flex-end; gap:10px; padding:12px 20px; background:#FFFFFF; border-bottom:1px solid #E2E8F0; }
    .__proposal_tab_bar button { padding:8px 16px; border-radius:8px; border:1px solid #E2E8F0; background:#FFFFFF; font-weight:700; font-size:13px; cursor:pointer; font-family:inherit; }
  </style>
</head>
<body>
  <div class="__proposal_tab_bar no-print"><button onclick="window.close()">Close Tab</button></div>
  ${bodyHTML}
</body>
</html>`;

  const existingFrame = document.getElementById("__proposal_print_frame__");
  if (existingFrame) existingFrame.remove();

  const existingContainer = document.getElementById("__proposal_pdf_container__");
  if (existingContainer) existingContainer.remove();

  const container = document.createElement("div");
  container.id = "__proposal_pdf_container__";
  container.style.cssText = "position:fixed;top:0;left:-9999px;width:210mm;background:#FFFFFF;z-index:999999;pointer-events:none;";
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
        html2canvas: { scale: 1.5, useCORS: true, allowTaint: true, backgroundColor: '#FFFFFF' },
        jsPDF: { format: 'a4', unit: 'mm' }
      });
      const blob = await worker.output('blob');
      const fileName = `${(proposal.title || 'proposal').replace(/[^a-z0-9]/gi, '_')}.pdf`;

      if (mode === 'view') {
        const url = URL.createObjectURL(blob);
        if (preOpenedWin && !preOpenedWin.closed) {
          preOpenedWin.location.href = url;
        } else {
          window.open(url, '_blank');
        }
      } else {
        // mode === 'share'
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
  printProposal(proposal, 'share');
}

export function buildProposalHTML(proposal) {
  if (!proposal) return "";
  let body = "";
  if (proposal.html && proposal.html.trim()) {
    body = proposal.html;
  } else if (proposal.slides && proposal.slides.length > 0) {
    body = buildSlidesHTML(proposal);
  } else {
    body = `<div style="padding:80px;text-align:center;color:#64748B;">No content.</div>`;
  }
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>:root{${HARDCODED_VARS}}${PRINT_BASE_CSS}${PROPOSAL_PREVIEW_CSS}</style></head><body>${body}</body></html>`;
}