// Shared CSS for rendering a saved Project Proposal's Live Preview HTML
// (the markup saved in proposal.html via extractProposalData() / #propDoc).
// Used by: ProposalForm.jsx (editor preview), ProposalViewer / proposal
// view+print modals in ClientDashboard.jsx and ProjectProposalCreator.jsx,
// so every place that shows a saved proposal renders it identically.
export const PROPOSAL_PREVIEW_CSS = `
:root{
  --teal: var(--app-accent, #00BCD4);--teal2:#00ACC1;--teal3:#26D0CE;--teal4:#006E7F;
  --teal-light:var(--teal-light, #E0F7FA);--teal-lighter:var(--teal-lighter, #F0FDFE);
  --bg:#F5FAFA;--surface:#FFFFFF;--surface2:#F8FAFB;--border:#E0EEF0;--border2:#C5DDE0;
  --text:#1A2E35;--text2:#607D86;--text3:#A0B8BE;
  --green:#26C281;--green-bg:#E8FAF3;
  --amber:#F5A623;--amber-bg:#FEF5E6;
  --red:#F05C5C;--red-bg:#FEF2F2;
  --purple:#7C5CFC;--purple-bg:#EEE9FF;
  --blue:#2563EB;--blue-bg:#EFF4FF;
  --sidebar-grad:linear-gradient(180deg,#26D0CE 0%, var(--app-accent, #00BCD4) 35%,#00ACC1 65%,#006E7F 100%);
  --font:'Nunito',sans-serif;--radius:14px;
}

/* PROPOSAL DOC */
.prop-doc{flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--border2) transparent;font-family:var(--font);font-size:12px;color:#1A2E35;min-height:0}

/* COVER */
.p-cover{background:linear-gradient(135deg,#003E4E 0%,#005F73 35%,#0096B4 70%,#26D0CE 100%);padding:26px 22px;position:relative;overflow:hidden;flex-shrink:0}
.p-cover::after{content:'';position:absolute;right:-50px;top:-50px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.06)}
.p-cover::before{content:'';position:absolute;left:-20px;bottom:-60px;width:140px;height:140px;border-radius:50%;background:rgba(0,0,0,.1)}
.p-logo{width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.18);border:1.5px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#fff;margin-bottom:14px;position:relative;z-index:1}
.p-label{font-size:9px;font-weight:700;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;position:relative;z-index:1}
.p-title{font-size:17px;font-weight:900;color:#fff;letter-spacing:-.3px;line-height:1.25;margin-bottom:5px;position:relative;z-index:1}
.p-subtitle{font-size:11px;color:rgba(255,255,255,.7);margin-bottom:14px;position:relative;z-index:1}
.p-meta{display:flex;gap:12px;flex-wrap:wrap;position:relative;z-index:1}
.p-meta-i{display:flex;align-items:center;gap:4px;font-size:10px;color:rgba(255,255,255,.7);font-weight:600}
.p-badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.2);margin-top:9px;position:relative;z-index:1}

/* DOC SECTIONS */
.ps{padding:14px 18px;border-bottom:1px solid var(--border)}
.ps:last-child{border-bottom:none}
.ps-lbl{font-size:9px;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;display:flex;align-items:center;gap:5px}
.ps-lbl i{font-size:12px}

/* PARTIES GRID */
.party-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.party-b{padding:9px 11px;background:var(--surface2);border-radius:8px;border:1px solid var(--border)}
.pb-lbl{font-size:8px;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:.7px;margin-bottom:3px}
.pb-name{font-size:11px;font-weight:800;color:var(--text)}
.pb-detail{font-size:9px;color:var(--text3);line-height:1.7;margin-top:1px}

/* EXEC SUMMARY */
.exec-block{margin-bottom:8px;padding:9px 11px;border-radius:8px;border-left:3px solid var(--border2)}
.exec-block.problem{border-left-color:var(--red);background:var(--red-bg)}
.exec-block.solution{border-left-color:var(--teal);background:var(--teal-lighter)}
.exec-block.whyus{border-left-color:var(--green);background:var(--green-bg)}
.eb-lbl{font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px}
.exec-block.problem .eb-lbl{color:var(--red)}
.exec-block.solution .eb-lbl{color:var(--teal)}
.exec-block.whyus .eb-lbl{color:var(--green)}
.eb-text{font-size:10px;color:var(--text2);line-height:1.6}

/* DELIVERABLES IN PREVIEW */
.del-list{display:flex;flex-direction:column;gap:4px}
.del-item-p{display:flex;align-items:center;gap:6px;font-size:10px;color:var(--text2)}
.del-item-p::before{content:'\\2713';color:var(--teal);font-weight:800;font-size:11px;flex-shrink:0}

/* TIMELINE PREVIEW */
.tl-p{display:flex;flex-direction:column;gap:0}
.tl-pi{display:flex;gap:8px;padding-bottom:8px}
.tl-pi:last-child{padding-bottom:0}
.tl-dot{width:20px;height:20px;border-radius:50%;background:var(--teal);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:#fff;flex-shrink:0}
.tl-line-p{width:2px;background:var(--teal-light);flex:1;margin:2px 0;min-height:10px}
.tl-pi:last-child .tl-line-p{display:none}
.tl-pi-title{font-size:10px;font-weight:700;color:var(--text)}
.tl-pi-date{font-size:9px;color:var(--teal);font-weight:600}
.tl-pi-desc{font-size:9px;color:var(--text3);margin-top:1px;line-height:1.5}

/* TEAM PREVIEW */
.team-p{display:flex;flex-wrap:wrap;gap:7px}
.tp-card{padding:7px 9px;background:var(--surface2);border-radius:8px;border:1px solid var(--border)}
.tp-av-p{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:#fff;flex-shrink:0}
.tp-name-p{font-size:10px;font-weight:700;color:var(--text)}
.tp-role-p{font-size:9px;color:var(--text3)}

/* PRICING PREVIEW */
.pricing-tbl{width:100%;border-collapse:collapse}
.pricing-tbl thead tr{background:linear-gradient(135deg,var(--teal),var(--teal4))}
.pricing-tbl thead th{padding:6px 8px;font-size:9px;font-weight:700;color:#fff;text-align:left}
.pricing-tbl thead th:last-child{text-align:right}
.pricing-tbl tbody tr{border-bottom:1px solid var(--border)}
.pricing-tbl tbody tr:nth-child(even){background:var(--surface2)}
.pricing-tbl tbody td{padding:5px 8px;font-size:10px;color:var(--text)}
.pricing-tbl tbody td:last-child{text-align:right;font-weight:700}
.pricing-grand{display:flex;justify-content:space-between;padding:6px 8px;background:linear-gradient(135deg,var(--teal),var(--teal4));border-radius:6px;margin-top:5px}
.pricing-grand span:first-child{font-size:10px;font-weight:800;color:#fff}
.pricing-grand span:last-child{font-size:12px;font-weight:900;color:#fff}

/* VALUE PREVIEW */
.val-p{display:flex;flex-direction:column;gap:4px}
.val-pi{display:flex;align-items:flex-start;gap:6px;font-size:10px;color:var(--text2)}
.val-pi::before{content:'';color:var(--amber);font-weight:800;font-size:11px;flex-shrink:0}

/* CASE STUDY PREVIEW */
.cs-p{padding:8px 10px;background:var(--surface2);border-radius:8px;border-left:3px solid var(--teal);margin-bottom:7px}
.cs-p:last-child{margin-bottom:0}
.cs-p-title{font-size:10px;font-weight:800;color:var(--text);margin-bottom:3px}
.cs-p-detail{font-size:9px;color:var(--text3);line-height:1.6}

/* TESTIMONIAL PREVIEW */
.tm-p{padding:8px 10px;background:var(--teal-lighter);border-radius:8px;border:1px solid var(--teal-light);margin-bottom:7px;font-style:italic}
.tm-p:last-child{margin-bottom:0}
.tm-p-text{font-size:10px;color:var(--text2);margin-bottom:5px}
.tm-p-author{font-size:9px;font-weight:700;color:var(--teal)}

/* RISK PREVIEW */
.risk-p{display:flex;flex-direction:column;gap:4px}
.risk-pi{display:flex;align-items:flex-start;gap:7px;padding:5px 8px;border-radius:7px;background:var(--surface2);border:1px solid var(--border)}
.risk-badge-p{font-size:8px;font-weight:800;padding:1px 6px;border-radius:20px;flex-shrink:0}
.risk-badge-p.h{background:var(--red-bg);color:var(--red)}
.risk-badge-p.m{background:var(--amber-bg);color:var(--amber)}
.risk-badge-p.l{background:var(--green-bg);color:var(--green)}
.risk-pi-text{font-size:9px;color:var(--text2);flex:1}
.risk-pi-mit{font-size:9px;color:var(--text3);font-style:italic}

/* SIGN OFF PREVIEW */
.sop{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sob{padding:10px;background:var(--surface2);border-radius:8px;border:1px solid var(--border);text-align:center}
.sob-line{width:70px;height:1px;background:var(--text3);margin:0 auto 4px}
.sob-name{font-size:10px;font-weight:700;color:var(--text)}
.sob-role{font-size:9px;color:var(--text3)}


`;
