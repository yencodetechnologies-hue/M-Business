
import React, { useState } from 'react';

export default function ProposalForm({ onBack, onSave }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "var(--bg)", overflowY: "auto" }}>
      <style>{`
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
:root{
  --teal:#00BCD4;--teal2:#00ACC1;--teal3:#26D0CE;--teal4:#006E7F;
  --teal-light:#E0F7FA;--teal-lighter:#F0FDFE;
  --bg:#F5FAFA;--surface:#FFFFFF;--surface2:#F8FAFB;--border:#E0EEF0;--border2:#C5DDE0;
  --text:#1A2E35;--text2:#607D86;--text3:#A0B8BE;
  --green:#26C281;--green-bg:#E8FAF3;
  --amber:#F5A623;--amber-bg:#FEF5E6;
  --red:#F05C5C;--red-bg:#FEF2F2;
  --purple:#7C5CFC;--purple-bg:#EEE9FF;
  --blue:#2563EB;--blue-bg:#EFF4FF;
  --sidebar-grad:linear-gradient(180deg,#26D0CE 0%,#00BCD4 35%,#00ACC1 65%,#006E7F 100%);
  --font:'Nunito',sans-serif;--radius:14px;
}
html,body{min-height:100%;font-family:var(--font);font-size:14px;background:var(--bg);color:var(--text);overflow-x:hidden}
body{display:flex;min-height:100vh}

/* ── SIDEBAR ── */
.sidebar{width:210px;min-width:210px;background:var(--sidebar-grad);display:flex;flex-direction:column;position:fixed;top:0;left:0;height:100vh;overflow:hidden;z-index:100;box-shadow:4px 0 20px rgba(0,188,212,.2)}
.sb-profile{padding:20px 18px 17px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,.18)}
.sb-avatar{width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;flex-shrink:0;border:2px solid rgba(255,255,255,.3)}
.sb-name{font-size:13px;font-weight:800;color:#fff}
.sb-role{font-size:9px;color:rgba(255,255,255,.65);font-weight:700;text-transform:uppercase;letter-spacing:.6px;margin-top:1px}
.nav{display:flex;flex-direction:column;gap:2px;padding:14px 10px;flex:1;overflow-y:auto}
.nav-label{font-size:9px;font-weight:700;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1.1px;padding:8px 10px 4px}
.nav-item{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:9px;cursor:pointer;color:rgba(255,255,255,.7);font-size:12px;font-weight:600;transition:all .15s}
.nav-item:hover{background:rgba(255,255,255,.14);color:#fff}
.nav-item.active{background:rgba(255,255,255,.24);color:#fff}
.nav-item i{font-size:15px;flex-shrink:0}
.nav-badge{margin-left:auto;background:var(--teal);color:#fff;font-size:9px;font-weight:800;padding:1px 6px;border-radius:20px}
.sb-footer{padding:12px 10px 20px;border-top:1px solid rgba(255,255,255,.15);flex-shrink:0}
.logout-btn{width:100%;padding:9px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);border-radius:9px;font-size:12px;font-weight:700;color:#fff;cursor:pointer;font-family:var(--font);display:flex;align-items:center;justify-content:center;gap:6px}
.logout-btn:hover{background:rgba(255,255,255,.2)}

/* ── MAIN ── */
.main{flex:1;margin-left:210px;display:flex;flex-direction:column;min-width:0}
.topbar{background:var(--surface);border-bottom:1px solid var(--border);padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;box-shadow:0 1px 8px rgba(0,188,212,.06);gap:10px}
.topbar-left{display:flex;align-items:center;gap:10px;flex-shrink:0}
.back-btn{display:flex;align-items:center;gap:5px;padding:6px 12px;background:var(--bg);border:1.5px solid var(--border);border-radius:9px;font-size:12px;font-weight:700;color:var(--text2);cursor:pointer;font-family:var(--font);transition:all .15s;white-space:nowrap}
.back-btn:hover{border-color:var(--teal);color:var(--teal)}
.topbar-title{font-size:15px;font-weight:800;color:var(--text);white-space:nowrap}
.topbar-actions{display:flex;align-items:center;gap:7px;flex-shrink:0}
.btn-o{display:flex;align-items:center;gap:5px;padding:7px 12px;background:var(--surface);border:1.5px solid var(--border);border-radius:9px;font-size:12px;font-weight:700;color:var(--text2);cursor:pointer;font-family:var(--font);transition:all .15s;white-space:nowrap}
.btn-o:hover{border-color:var(--teal);color:var(--teal)}
.btn-t{display:flex;align-items:center;gap:6px;padding:7px 14px;background:var(--teal);color:#fff;border:none;border-radius:9px;font-size:12px;font-weight:700;font-family:var(--font);cursor:pointer;transition:all .15s;box-shadow:0 3px 10px rgba(0,188,212,.25);white-space:nowrap}
.btn-t:hover{background:var(--teal2)}
.btn-g{background:var(--green);box-shadow:0 3px 10px rgba(38,194,129,.2)}
.btn-g:hover{background:#1da86e}

/* ── LAYOUT ── */
.content{padding:20px 24px 40px;display:grid;grid-template-columns:1fr 430px;gap:18px;align-items:start}

/* ── SECTION PICKER ── */
.section-picker{background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);padding:14px 16px;margin-bottom:16px}
.sp-title{font-size:12px;font-weight:800;color:var(--text);margin-bottom:10px;display:flex;align-items:center;gap:7px}
.sp-grid{display:flex;flex-wrap:wrap;gap:7px}
.sp-toggle{display:flex;align-items:center;gap:6px;padding:6px 11px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;transition:all .15s;border:1.5px solid var(--border);color:var(--text2);font-family:var(--font);background:var(--surface2)}
.sp-toggle.on{background:var(--teal-lighter);border-color:var(--teal);color:var(--teal)}
.sp-toggle.required{background:var(--surface2);border-color:var(--border2);color:var(--text3);cursor:not-allowed;opacity:.7}
.sp-toggle i{font-size:13px}

/* ── CARDS ── */
.card{background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:14px;transition:all .2s}
.card.optional-card{border-style:dashed}
.card.optional-card.active-card{border-style:solid;border-color:var(--teal)}
.card-header{display:flex;align-items:center;gap:10px;padding:13px 16px;border-bottom:1px solid var(--border)}
.card-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.card-title{font-size:13px;font-weight:800;color:var(--text)}
.opt-badge{font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;background:var(--amber-bg);color:var(--amber);margin-left:4px}
.card-actions{margin-left:auto;display:flex;align-items:center;gap:6px}
.card-body{padding:16px}

/* ── FORMS ── */
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
.form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px}
.fg{margin-bottom:12px}
.fg:last-child{margin-bottom:0}
.fl{font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;display:flex;align-items:center;justify-content:space-between}
.fl-hint{font-size:9px;color:var(--text3);text-transform:none;letter-spacing:0;font-weight:600}
.fi{width:100%;padding:9px 12px;background:var(--bg);border:1.5px solid var(--border);border-radius:9px;font-size:13px;color:var(--text);font-family:var(--font);outline:none;transition:all .15s}
.fi:focus{border-color:var(--teal);background:var(--surface);box-shadow:0 0 0 3px rgba(0,188,212,.08)}
.fi::placeholder{color:var(--text3)}
.fi:read-only{background:var(--surface2);color:var(--text3)}
.fs{width:100%;padding:9px 12px;background:var(--bg);border:1.5px solid var(--border);border-radius:9px;font-size:13px;color:var(--text);font-family:var(--font);outline:none;cursor:pointer;appearance:none;-webkit-appearance:none;transition:all .15s;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23A0B8BE' stroke-width='2'%3E%3Cpolyline points='6,9 12,15 18,9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 11px center}
.fs:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(0,188,212,.08)}
.ta{width:100%;padding:9px 12px;background:var(--bg);border:1.5px solid var(--border);border-radius:9px;font-size:13px;color:var(--text);font-family:var(--font);outline:none;resize:vertical;min-height:80px;line-height:1.6;transition:all .15s}
.ta:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(0,188,212,.08)}
.ta::placeholder{color:var(--text3)}

/* ── STATUS CHIPS ── */
.status-row{display:flex;gap:7px;flex-wrap:wrap}
.sc{padding:6px 12px;border:1.5px solid var(--border);border-radius:20px;cursor:pointer;font-size:11px;font-weight:700;color:var(--text2);font-family:var(--font);transition:all .15s;background:none}
.sc:hover{border-color:var(--teal);color:var(--teal)}
.sc.active-sc{border-color:var(--teal);background:var(--teal-lighter);color:var(--teal)}
.sc.won{border-color:var(--green);background:var(--green-bg);color:var(--green)}
.sc.lost{border-color:var(--red);background:var(--red-bg);color:var(--red)}
.sc.sent{border-color:var(--blue);background:var(--blue-bg);color:var(--blue)}
.sc.neg{border-color:var(--amber);background:var(--amber-bg);color:var(--amber)}
.sc.exp{border-color:var(--purple);background:var(--purple-bg);color:var(--purple)}

/* ── COVER UPLOAD ── */
.cover-zone{border:2px dashed var(--border2);border-radius:10px;padding:20px;text-align:center;cursor:pointer;transition:all .15s;background:var(--bg);margin-bottom:12px}
.cover-zone:hover{border-color:var(--teal);background:var(--teal-lighter)}
.cover-zone i{font-size:26px;color:var(--text3);margin-bottom:5px}
.cover-zone-txt{font-size:12px;font-weight:700;color:var(--text2)}
.cover-zone-sub{font-size:10px;color:var(--text3);margin-top:2px}

/* ── TEAM ── */
.team-card{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;margin-bottom:8px;transition:all .15s}
.team-card:hover{border-color:var(--teal)}
.tc-av{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;flex-shrink:0}
.tc-name{font-size:12px;font-weight:800;color:var(--text)}
.tc-role{font-size:10px;color:var(--text3);margin-top:1px}
.tc-exp{font-size:10px;color:var(--text2);margin-top:2px}
.tc-skills{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.tc-skill{padding:2px 7px;background:var(--teal-light);border-radius:20px;font-size:9px;font-weight:700;color:var(--teal)}
.tc-del{margin-left:auto;font-size:16px;color:var(--text3);cursor:pointer;transition:color .15s;flex-shrink:0}
.tc-del:hover{color:var(--red)}
.add-btn{display:flex;align-items:center;gap:6px;padding:7px 13px;background:var(--teal-lighter);border:1.5px dashed var(--teal);border-radius:9px;font-size:11px;font-weight:700;color:var(--teal);cursor:pointer;font-family:var(--font);width:100%;justify-content:center;transition:all .15s;margin-top:6px}
.add-btn:hover{background:var(--teal-light)}

/* ── MILESTONES ── */
.ms-item{display:flex;gap:10px;margin-bottom:0}
.ms-left{display:flex;flex-direction:column;align-items:center;flex-shrink:0}
.ms-dot{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:var(--teal);background:var(--teal-lighter);border:2px solid var(--teal);flex-shrink:0;cursor:pointer;transition:all .15s}
.ms-dot.done{background:var(--teal);color:#fff}
.ms-line{width:2px;background:var(--border);flex:1;margin:4px 0;min-height:14px}
.ms-item:last-child .ms-line{display:none}
.ms-body{flex:1;padding-bottom:14px}
.ms-row{display:flex;align-items:center;gap:7px;margin-bottom:6px}
.ms-inp{flex:1;padding:7px 10px;background:var(--bg);border:1.5px solid var(--border);border-radius:8px;font-size:12px;font-weight:700;color:var(--text);font-family:var(--font);outline:none;transition:all .15s}
.ms-inp:focus{border-color:var(--teal)}
.ms-date{padding:7px 9px;background:var(--bg);border:1.5px solid var(--border);border-radius:8px;font-size:11px;color:var(--text);font-family:var(--font);outline:none;transition:all .15s;width:120px}
.ms-date:focus{border-color:var(--teal)}
.ms-desc{width:100%;padding:7px 10px;background:var(--bg);border:1.5px solid var(--border);border-radius:8px;font-size:11px;color:var(--text2);font-family:var(--font);outline:none;transition:all .15s}
.ms-desc:focus{border-color:var(--teal)}
.ms-desc::placeholder{color:var(--text3)}
.icon-del{width:24px;height:24px;border-radius:6px;border:1px solid var(--border);background:none;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;color:var(--text3);transition:all .15s;flex-shrink:0}
.icon-del:hover{border-color:var(--red);color:var(--red);background:var(--red-bg)}

/* ── DELIVERABLES / VALUE ITEMS ── */
.dv-item{display:flex;align-items:center;gap:8px;padding:9px 11px;background:var(--surface2);border:1.5px solid var(--border);border-radius:9px;margin-bottom:7px;transition:all .15s}
.dv-item:hover{border-color:var(--teal)}
.dv-icon{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.dv-input{flex:1;padding:6px 9px;background:var(--surface);border:1.5px solid var(--border);border-radius:8px;font-size:12px;color:var(--text);font-family:var(--font);outline:none;transition:all .15s}
.dv-input:focus{border-color:var(--teal)}
.dv-del{font-size:15px;color:var(--text3);cursor:pointer;transition:color .15s;flex-shrink:0}
.dv-del:hover{color:var(--red)}

/* ── PRICING ── */
.pricing-row{display:grid;grid-template-columns:1fr 90px 26px;gap:7px;margin-bottom:6px;align-items:center}
.pr-inp{padding:8px 10px;background:var(--bg);border:1.5px solid var(--border);border-radius:8px;font-size:12px;color:var(--text);font-family:var(--font);outline:none;transition:all .15s;width:100%}
.pr-inp:focus{border-color:var(--teal)}
.pr-del{width:24px;height:24px;border-radius:6px;border:1px solid var(--border);background:none;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;color:var(--text3);transition:all .15s}
.pr-del:hover{border-color:var(--red);color:var(--red);background:var(--red-bg)}
.total-box{padding:12px;background:var(--teal-lighter);border-radius:10px;border:1.5px solid var(--teal-light);margin-top:12px}
.total-row{display:flex;justify-content:space-between;padding:4px 0;font-size:12px;border-bottom:1px solid var(--teal-light)}
.total-row:last-child{border-bottom:none}
.grand-box{display:flex;justify-content:space-between;padding:9px 12px;background:linear-gradient(135deg,var(--teal),var(--teal4));border-radius:9px;margin-top:8px}

/* ── RISK ── */
.risk-row-g{display:grid;grid-template-columns:1fr 80px 80px 24px;gap:6px;margin-bottom:6px;align-items:center}
.risk-row-g.hdr div{font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;padding:0 5px}

/* ── CASE STUDIES ── */
.cs-item{padding:12px;background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;margin-bottom:8px;transition:all .15s}
.cs-item:hover{border-color:var(--teal)}
.cs-header{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.cs-num{width:22px;height:22px;border-radius:50%;background:var(--teal-light);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:var(--teal);flex-shrink:0}

/* ── TESTIMONIALS ── */
.tm-item{padding:12px;background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;margin-bottom:8px;transition:all .15s;position:relative}
.tm-item:hover{border-color:var(--teal)}
.tm-quote-icon{position:absolute;top:10px;right:12px;font-size:22px;color:var(--teal-light)}

/* ── SIGN-OFF ── */
.sig-box{border:2px dashed var(--border2);border-radius:10px;height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;transition:all .15s;background:var(--bg)}
.sig-box:hover{border-color:var(--teal);background:var(--teal-lighter)}

/* ── PREVIEW ── */
.preview-side{position:sticky;top:76px}
.preview-card{background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.07)}
.preview-toolbar{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--border);background:var(--surface2)}
.pt-title-label{font-size:12px;font-weight:800;color:var(--text)}
.pt-btns{display:flex;gap:5px}
.pt-b{display:flex;align-items:center;gap:4px;padding:5px 9px;background:var(--surface);border:1.5px solid var(--border);border-radius:7px;font-size:10px;font-weight:700;color:var(--text2);cursor:pointer;font-family:var(--font);transition:all .15s}
.pt-b:hover{border-color:var(--teal);color:var(--teal)}

/* PROPOSAL DOC */
.prop-doc{max-height:82vh;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--border2) transparent;font-family:var(--font);font-size:12px;color:#1A2E35}

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
.del-item-p::before{content:'✓';color:var(--teal);font-weight:800;font-size:11px;flex-shrink:0}

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
.val-pi::before{content:'→';color:var(--amber);font-weight:800;font-size:11px;flex-shrink:0}

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

/* MOBILE */
@media(max-width:1100px){.content{grid-template-columns:1fr}.preview-side{position:static}}
@media(max-width:768px){
  .sidebar{display:none}.main{margin-left:0}.content{padding:12px 14px 40px}
  .form-row,.form-row-3{grid-template-columns:1fr}
  .topbar-actions .btn-o{display:none}
}
`}</style>
      <div className="main">
  <header className="topbar">
    <div className="topbar-left">
      <button className="back-btn" onClick={onBack}><i className="ti ti-arrow-left" style={{"fontSize":"13px"}}></i> Proposals</button>
      <div className="topbar-title">Create Proposal</div>
    </div>
    <div className="topbar-actions">
      <button className="btn-o"><i className="ti ti-copy" style={{"fontSize":"13px"}}></i> Duplicate</button>
      <button className="btn-o" onClick={() => onSave({ title: "New Proposal", client: "", value: "0" })}><i className="ti ti-device-floppy" style={{"fontSize":"13px"}}></i> Save Draft</button>
      <button className="btn-o"><i className="ti ti-download" style={{"fontSize":"13px"}}></i> PDF</button>
      <button className="btn-t" onClick={() => onSave({ title: "New Proposal", client: "", value: "0" })}><i className="ti ti-send" style={{"fontSize":"13px"}}></i> Send</button>
      <button className="btn-t btn-g" onClick={() => onSave({ title: "New Proposal", client: "", value: "0" })}><i className="ti ti-trophy" style={{"fontSize":"13px"}}></i> Mark Won</button>
    </div>
  </header>

  <div className="content">
  {/*  ══ FORM SIDE ══  */}
  <div id="formSide">

    {/*  SECTION PICKER  */}
    <div className="section-picker">
      <div className="sp-title"><i className="ti ti-layout-grid" style={{"color":"var(--teal)","fontSize":"15px"}}></i> Proposal Sections — Toggle Optional Sections</div>
      <div className="sp-grid">
        <button className="sp-toggle required" disabled>📋 Basics</button>
        <button className="sp-toggle required" disabled>🏢 Parties</button>
        <button className="sp-toggle required" disabled>📝 Summary</button>
        <button className="sp-toggle required" disabled>✅ Deliverables</button>
        <button className="sp-toggle required" disabled>🗓️ Timeline</button>
        <button className="sp-toggle required" disabled>💰 Pricing</button>
        <button className="sp-toggle required" disabled>✍️ Sign-off</button>
        <button className="sp-toggle on" onClick={() => {}}><i className="ti ti-users"></i> Our Team</button>
        <button className="sp-toggle on" onClick={() => {}}><i className="ti ti-star"></i> Value & ROI</button>
        <button className="sp-toggle" onClick={() => {}}><i className="ti ti-trophy"></i> Case Studies</button>
        <button className="sp-toggle" onClick={() => {}}><i className="ti ti-quote"></i> Testimonials</button>
        <button className="sp-toggle on" onClick={() => {}}><i className="ti ti-shield-exclamation"></i> Risks</button>
        <button className="sp-toggle" onClick={() => {}}><i className="ti ti-help-circle"></i> FAQ</button>
        <button className="sp-toggle" onClick={() => {}}><i className="ti ti-medal"></i> Why Us</button>
      </div>
    </div>

    {/*  ① BASICS  */}
    <div className="card">
      <div className="card-header">
        <div className="card-icon" style={{"background":"var(--teal-light)","color":"var(--teal)"}}><i className="ti ti-file-description"></i></div>
        <div className="card-title">Proposal Basics</div>
        <span style={{"marginLeft":"auto","fontSize":"10px","fontWeight":700,"background":"var(--amber-bg)","color":"var(--amber)","padding":"3px 9px","borderRadius":"20px"}}>#PRO-2026-0015</span>
      </div>
      <div className="card-body">
        <div className="cover-zone" id="coverZone" onClick={() => {}}>
          <i className="ti ti-photo-plus"></i>
          <div className="cover-zone-txt">Upload Cover Image / Banner</div>
          <div className="cover-zone-sub">PNG, JPG · Recommended 1200×400px</div>
        </div>
        <div className="form-row">
          <div className="fg">
            <label className="fl">Proposal Title</label>
            <input className="fi" type="text" id="propTitle" placeholder="e.g. Corporate Website Redesign" onChange={() => {}} />
          </div>
          <div className="fg">
            <label className="fl">Proposal Date</label>
            <input className="fi" type="date" id="propDate" value="2026-06-01" onChange={() => {}} />
          </div>
        </div>
        <div className="form-row">
          <div className="fg">
            <label className="fl">Project Type</label>
            <select className="fs" id="propType" onChange={() => {}}>
              <option>Web Development</option>
              <option>Mobile App</option>
              <option>UI/UX Design</option>
              <option>Digital Marketing</option>
              <option>Custom Software</option>
              <option>E-Commerce</option>
              <option>Consulting</option>
            </select>
          </div>
          <div className="fg">
            <label className="fl">Expiry Date</label>
            <input className="fi" type="date" id="propExpiry" value="2026-07-01" onChange={() => {}} />
          </div>
        </div>
        <div className="fg">
          <label className="fl" style={{"marginBottom":"7px"}}>Status</label>
          <div className="status-row">
            <button className="sc active-sc" onClick={() => {}}>📝 Draft</button>
            <button className="sc sent" onClick={() => {}}>📤 Sent</button>
            <button className="sc neg" onClick={() => {}}>🤝 Negotiation</button>
            <button className="sc won" onClick={() => {}}>🏆 Won</button>
            <button className="sc lost" onClick={() => {}}>❌ Lost</button>
            <button className="sc exp" onClick={() => {}}>⏰ Expired</button>
          </div>
        </div>
      </div>
    </div>

    {/*  ② PARTIES  */}
    <div className="card">
      <div className="card-header">
        <div className="card-icon" style={{"background":"var(--amber-bg)","color":"var(--amber)"}}><i className="ti ti-building"></i></div>
        <div className="card-title">Parties — From & Prepared For</div>
      </div>
      <div className="card-body">
        <div style={{"fontSize":"10px","fontWeight":800,"color":"var(--teal)","textTransform":"uppercase","letterSpacing":".7px","marginBottom":"10px"}}>Our Details</div>
        <div className="form-row">
          <div className="fg"><label className="fl">Company Name</label><input className="fi" type="text" id="fromComp" value="YENCODE Technologies" onChange={() => {}} /></div>
          <div className="fg"><label className="fl">Contact Person</label><input className="fi" type="text" id="fromPerson" value="Prabhu R" onChange={() => {}} /></div>
        </div>
        <div className="form-row">
          <div className="fg"><label className="fl">Email</label><input className="fi" type="email" id="fromEmail" value="yencodetechnologies@gmail.com" onChange={() => {}} /></div>
          <div className="fg"><label className="fl">Phone</label><input className="fi" type="tel" id="fromPhone" value="+91 89254 33533" onChange={() => {}} /></div>
        </div>
        <div className="fg"><label className="fl">Address</label><input className="fi" type="text" id="fromAddr" value="Chennai, Tamil Nadu, India" onChange={() => {}} /></div>
        <div style={{"height":"1px","background":"var(--border)","margin":"14px 0"}}></div>
        <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between","marginBottom":"10px"}}>
          <div style={{"fontSize":"10px","fontWeight":800,"color":"var(--amber)","textTransform":"uppercase","letterSpacing":".7px"}}>Client Details</div>
          <button onClick={() => {}} style={{"display":"flex","alignItems":"center","gap":"4px","padding":"4px 9px","background":"var(--teal-lighter)","border":"1.5px solid var(--teal)","borderRadius":"7px","fontSize":"10px","fontWeight":700,"color":"var(--teal)","cursor":"pointer","fontFamily":"var(--font)"}}><i className="ti ti-search" style={{"fontSize":"11px"}}></i>Select Client</button>
        </div>
        <div className="form-row">
          <div className="fg"><label className="fl">Client / Company</label><input className="fi" type="text" id="toComp" placeholder="e.g. STA Corporation" onChange={() => {}} /></div>
          <div className="fg"><label className="fl">Contact Person</label><input className="fi" type="text" id="toPerson" placeholder="Contact name" onChange={() => {}} /></div>
        </div>
        <div className="form-row">
          <div className="fg"><label className="fl">Email</label><input className="fi" type="email" id="toEmail" placeholder="client@email.com" onChange={() => {}} /></div>
          <div className="fg"><label className="fl">Phone</label><input className="fi" type="tel" id="toPhone" placeholder="+91 XXXXX XXXXX" onChange={() => {}} /></div>
        </div>
        <div className="fg"><label className="fl">Address / Location</label><input className="fi" type="text" id="toAddr" placeholder="City, Country" onChange={() => {}} /></div>
      </div>
    </div>

    {/*  ③ EXECUTIVE SUMMARY  */}
    <div className="card">
      <div className="card-header">
        <div className="card-icon" style={{"background":"var(--teal-light)","color":"var(--teal)"}}><i className="ti ti-align-left"></i></div>
        <div className="card-title">Executive Summary</div>
      </div>
      <div className="card-body">
        <div className="fg"><label className="fl">Problem / Challenge <span className="fl-hint">What is the client struggling with?</span></label><textarea className="ta" id="problem" placeholder="Describe the client's pain point or business challenge…" onChange={() => {}}></textarea></div>
        <div className="fg"><label className="fl">Our Proposed Solution <span className="fl-hint">How do we solve it?</span></label><textarea className="ta" id="solution" placeholder="Describe your approach, methodology and solution…" onChange={() => {}}></textarea></div>
        <div className="fg"><label className="fl">Expected Outcome <span className="fl-hint">What will the client gain?</span></label><textarea className="ta" id="outcome" placeholder="Describe the measurable results the client can expect…" style={{"minHeight":"64px"}} onChange={() => {}}></textarea></div>
      </div>
    </div>

    {/*  ④ SCOPE & DELIVERABLES  */}
    <div className="card">
      <div className="card-header">
        <div className="card-icon" style={{"background":"var(--purple-bg)","color":"var(--purple)"}}><i className="ti ti-checklist"></i></div>
        <div className="card-title">Scope & Deliverables</div>
        <div className="card-actions"><button onClick={() => {}} className="add-btn" style={{"width":"auto","margin":0,"padding":"4px 9px","fontSize":"10px"}}><i className="ti ti-plus" style={{"fontSize":"11px"}}></i>Add</button></div>
      </div>
      <div className="card-body">
        <div id="delList">
          <div className="dv-item"><div className="dv-icon" style={{"background":"var(--teal-light)","color":"var(--teal)"}}><i className="ti ti-world"></i></div><input type="text" className="dv-input" value="Fully responsive website (8 pages)" onChange={() => {}} /><i className="ti ti-x dv-del" onClick={() => {}}></i></div>
          <div className="dv-item"><div className="dv-icon" style={{"background":"var(--purple-bg)","color":"var(--purple)"}}><i className="ti ti-palette"></i></div><input type="text" className="dv-input" value="Custom UI/UX design + brand guide" onChange={() => {}} /><i className="ti ti-x dv-del" onClick={() => {}}></i></div>
          <div className="dv-item"><div className="dv-icon" style={{"background":"var(--blue-bg)","color":"var(--blue)"}}><i className="ti ti-settings"></i></div><input type="text" className="dv-input" value="CMS for easy content management" onChange={() => {}} /><i className="ti ti-x dv-del" onClick={() => {}}></i></div>
          <div className="dv-item"><div className="dv-icon" style={{"background":"var(--green-bg)","color":"var(--green)"}}><i className="ti ti-chart-bar"></i></div><input type="text" className="dv-input" value="SEO optimisation + Google Analytics" onChange={() => {}} /><i className="ti ti-x dv-del" onClick={() => {}}></i></div>
          <div className="dv-item"><div className="dv-icon" style={{"background":"var(--amber-bg)","color":"var(--amber)"}}><i className="ti ti-headset"></i></div><input type="text" className="dv-input" value="3-month post-launch support" onChange={() => {}} /><i className="ti ti-x dv-del" onClick={() => {}}></i></div>
        </div>
        <button className="add-btn" onClick={() => {}}><i className="ti ti-plus" style={{"fontSize":"13px"}}></i>Add Deliverable</button>
      </div>
    </div>

    {/*  ⑤ TIMELINE & MILESTONES  */}
    <div className="card">
      <div className="card-header">
        <div className="card-icon" style={{"background":"var(--blue-bg)","color":"var(--blue)"}}><i className="ti ti-calendar-stats"></i></div>
        <div className="card-title">Project Timeline & Milestones</div>
      </div>
      <div className="card-body">
        <div className="form-row" style={{"marginBottom":"14px"}}>
          <div className="fg"><label className="fl">Project Start</label><input className="fi" type="date" id="startDate" value="2026-07-01" onChange={() => {}} /></div>
          <div className="fg"><label className="fl">Project End</label><input className="fi" type="date" id="endDate" value="2026-10-31" onChange={() => {}} /></div>
        </div>
        <div className="form-row" style={{"marginBottom":"14px"}}>
          <div className="fg"><label className="fl">Total Duration</label><input className="fi" type="text" id="duration" value="4 Months" onChange={() => {}} /></div>
          <div className="fg"><label className="fl">Engagement Model</label>
            <select className="fs" id="engModel" onChange={() => {}}>
              <option>Fixed Price Project</option>
              <option>Time & Material</option>
              <option>Monthly Retainer</option>
              <option>Agile Sprints</option>
            </select>
          </div>
        </div>
        <label className="fl" style={{"display":"block","marginBottom":"10px"}}>Milestone Plan</label>
        <div id="msList">
          <div className="ms-item">
            <div className="ms-left"><div className="ms-dot done">1</div><div className="ms-line"></div></div>
            <div className="ms-body">
              <div className="ms-row"><input type="text" className="ms-inp" value="Kickoff & Discovery" onChange={() => {}} /><input type="date" className="ms-date" value="2026-07-07" onChange={() => {}} /><button className="icon-del" onClick={() => {}}><i className="ti ti-trash"></i></button></div>
              <input type="text" className="ms-desc" value="Requirements gathering, stakeholder interviews, tech stack decision" placeholder="Description…" onChange={() => {}} />
            </div>
          </div>
          <div className="ms-item">
            <div className="ms-left"><div className="ms-dot">2</div><div className="ms-line"></div></div>
            <div className="ms-body">
              <div className="ms-row"><input type="text" className="ms-inp" value="UI/UX Design Phase" onChange={() => {}} /><input type="date" className="ms-date" value="2026-07-28" onChange={() => {}} /><button className="icon-del" onClick={() => {}}><i className="ti ti-trash"></i></button></div>
              <input type="text" className="ms-desc" value="Wireframes, high-fidelity mockups, design system, client review" placeholder="Description…" onChange={() => {}} />
            </div>
          </div>
          <div className="ms-item">
            <div className="ms-left"><div className="ms-dot">3</div><div className="ms-line"></div></div>
            <div className="ms-body">
              <div className="ms-row"><input type="text" className="ms-inp" value="Development Sprint" onChange={() => {}} /><input type="date" className="ms-date" value="2026-09-15" onChange={() => {}} /><button className="icon-del" onClick={() => {}}><i className="ti ti-trash"></i></button></div>
              <input type="text" className="ms-desc" value="Frontend, backend, CMS integration, API connections, responsive build" placeholder="Description…" onChange={() => {}} />
            </div>
          </div>
          <div className="ms-item">
            <div className="ms-left"><div className="ms-dot">4</div><div className="ms-line"></div></div>
            <div className="ms-body">
              <div className="ms-row"><input type="text" className="ms-inp" value="Testing & QA" onChange={() => {}} /><input type="date" className="ms-date" value="2026-10-15" onChange={() => {}} /><button className="icon-del" onClick={() => {}}><i className="ti ti-trash"></i></button></div>
              <input type="text" className="ms-desc" value="Cross-browser testing, UAT, bug fixes, performance optimisation" placeholder="Description…" onChange={() => {}} />
            </div>
          </div>
          <div className="ms-item">
            <div className="ms-left"><div className="ms-dot">5</div></div>
            <div className="ms-body">
              <div className="ms-row"><input type="text" className="ms-inp" value="Launch & Handover" onChange={() => {}} /><input type="date" className="ms-date" value="2026-10-31" onChange={() => {}} /><button className="icon-del" onClick={() => {}}><i className="ti ti-trash"></i></button></div>
              <input type="text" className="ms-desc" value="Deployment, training, documentation, 3-month support begins" placeholder="Description…" onChange={() => {}} />
            </div>
          </div>
        </div>
        <button className="add-btn" onClick={() => {}}><i className="ti ti-plus" style={{"fontSize":"13px"}}></i>Add Milestone</button>
      </div>
    </div>

    {/*  ⑥ OUR TEAM (OPTIONAL)  */}
    <div className="card optional-card active-card" id="sec-team">
      <div className="card-header">
        <div className="card-icon" style={{"background":"var(--green-bg)","color":"var(--green)"}}><i className="ti ti-users"></i></div>
        <div className="card-title">Our Team <span className="opt-badge">Optional</span></div>
        <div className="card-actions">
          <button onClick={() => {}} className="add-btn" style={{"width":"auto","margin":0,"padding":"4px 9px","fontSize":"10px"}}><i className="ti ti-user-plus" style={{"fontSize":"11px"}}></i>Add Member</button>
        </div>
      </div>
      <div className="card-body">
        <div id="teamList">
          <div className="team-card">
            <div className="tc-av" style={{"background":"linear-gradient(135deg,var(--teal),var(--teal4))"}}>P</div>
            <div style={{"flex":1,"minWidth":0}}>
              <div className="tc-name">Prabhu R</div>
              <div className="tc-role">Lead Developer & Project Manager</div>
              <div className="tc-exp">8+ years · Web & Mobile Applications</div>
              <div className="tc-skills"><span className="tc-skill">React.js</span><span className="tc-skill">Node.js</span><span className="tc-skill">Project Management</span></div>
            </div>
            <i className="ti ti-x tc-del" onClick={() => {}}></i>
          </div>
          <div className="team-card">
            <div className="tc-av" style={{"background":"linear-gradient(135deg,var(--purple),#4E35B0)"}}>AN</div>
            <div style={{"flex":1,"minWidth":0}}>
              <div className="tc-name">Anitha N</div>
              <div className="tc-role">Senior UI/UX Designer</div>
              <div className="tc-exp">5+ years · SaaS & Corporate Design</div>
              <div className="tc-skills"><span className="tc-skill">Figma</span><span className="tc-skill">Design Systems</span><span className="tc-skill">Prototyping</span></div>
            </div>
            <i className="ti ti-x tc-del" onClick={() => {}}></i>
          </div>
          <div className="team-card">
            <div className="tc-av" style={{"background":"linear-gradient(135deg,var(--green),#00956A)"}}>RK</div>
            <div style={{"flex":1,"minWidth":0}}>
              <div className="tc-name">Ravi Kumar</div>
              <div className="tc-role">Backend Developer</div>
              <div className="tc-exp">6+ years · APIs & Cloud Architecture</div>
              <div className="tc-skills"><span className="tc-skill">Python</span><span className="tc-skill">Django</span><span className="tc-skill">AWS</span></div>
            </div>
            <i className="ti ti-x tc-del" onClick={() => {}}></i>
          </div>
          <div className="team-card">
            <div className="tc-av" style={{"background":"linear-gradient(135deg,var(--amber),#D4880A)"}}>SK</div>
            <div style={{"flex":1,"minWidth":0}}>
              <div className="tc-name">Suresh K</div>
              <div className="tc-role">QA & Testing Engineer</div>
              <div className="tc-exp">4+ years · Automation & Manual Testing</div>
              <div className="tc-skills"><span className="tc-skill">Selenium</span><span className="tc-skill">Jest</span><span className="tc-skill">Cypress</span></div>
            </div>
            <i className="ti ti-x tc-del" onClick={() => {}}></i>
          </div>
        </div>
      </div>
    </div>

    {/*  ⑦ VALUE PROPOSITION & ROI (OPTIONAL)  */}
    <div className="card optional-card active-card" id="sec-value">
      <div className="card-header">
        <div className="card-icon" style={{"background":"var(--amber-bg)","color":"var(--amber)"}}><i className="ti ti-trending-up"></i></div>
        <div className="card-title">Value Proposition & ROI <span className="opt-badge">Optional</span></div>
        <div className="card-actions">
          <button onClick={() => {}} className="add-btn" style={{"width":"auto","margin":0,"padding":"4px 9px","fontSize":"10px"}}><i className="ti ti-plus" style={{"fontSize":"11px"}}></i>Add</button>
        </div>
      </div>
      <div className="card-body">
        <div id="valueList">
          <div className="dv-item"><div className="dv-icon" style={{"background":"var(--amber-bg)","color":"var(--amber)"}}><i className="ti ti-trending-up"></i></div><input type="text" className="dv-input" value="300% increase in organic traffic within 6 months" onChange={() => {}} /><i className="ti ti-x dv-del" onClick={() => {}}></i></div>
          <div className="dv-item"><div className="dv-icon" style={{"background":"var(--green-bg)","color":"var(--green)"}}><i className="ti ti-users"></i></div><input type="text" className="dv-input" value="2x lead generation with improved UX & CTAs" onChange={() => {}} /><i className="ti ti-x dv-del" onClick={() => {}}></i></div>
          <div className="dv-item"><div className="dv-icon" style={{"background":"var(--blue-bg)","color":"var(--blue)"}}><i className="ti ti-device-mobile"></i></div><input type="text" className="dv-input" value="Mobile-first design reaching 70%+ of your audience" onChange={() => {}} /><i className="ti ti-x dv-del" onClick={() => {}}></i></div>
          <div className="dv-item"><div className="dv-icon" style={{"background":"var(--teal-light)","color":"var(--teal)"}}><i className="ti ti-clock"></i></div><input type="text" className="dv-input" value="50% faster content updates with intuitive CMS" onChange={() => {}} /><i className="ti ti-x dv-del" onClick={() => {}}></i></div>
          <div className="dv-item"><div className="dv-icon" style={{"background":"var(--purple-bg)","color":"var(--purple)"}}><i className="ti ti-certificate"></i></div><input type="text" className="dv-input" value="Brand credibility boost with modern, professional design" onChange={() => {}} /><i className="ti ti-x dv-del" onClick={() => {}}></i></div>
        </div>
      </div>
    </div>

    {/*  ⑧ CASE STUDIES (OPTIONAL, HIDDEN)  */}
    <div className="card optional-card" id="sec-casestudies" style={{"display":"none"}}>
      <div className="card-header">
        <div className="card-icon" style={{"background":"var(--green-bg)","color":"var(--green)"}}><i className="ti ti-trophy"></i></div>
        <div className="card-title">Past Work & Case Studies <span className="opt-badge">Optional</span></div>
        <div className="card-actions">
          <button onClick={() => {}} className="add-btn" style={{"width":"auto","margin":0,"padding":"4px 9px","fontSize":"10px"}}><i className="ti ti-plus" style={{"fontSize":"11px"}}></i>Add</button>
        </div>
      </div>
      <div className="card-body">
        <div id="csList">
          <div className="cs-item">
            <div className="cs-header">
              <div className="cs-num">1</div>
              <input type="text" className="fi" style={{"flex":1}} placeholder="Project name" value="YDMart E-Commerce App" />
              <button className="icon-del" style={{"marginLeft":"6px"}} onClick={() => {}}><i className="ti ti-trash"></i></button>
            </div>
            <div className="form-row">
              <div className="fg"><label className="fl">Client</label><input className="fi" type="text" placeholder="Client name" value="YDMart Group" onChange={() => {}} /></div>
              <div className="fg"><label className="fl">Industry</label><input className="fi" type="text" placeholder="e.g. Retail" value="E-Commerce / Retail" onChange={() => {}} /></div>
            </div>
            <div className="fg"><label className="fl">Challenge & Result</label><textarea className="ta" style={{"minHeight":"60px"}} placeholder="Describe the challenge and what you achieved…" onChange={() => {}}>Built a full e-commerce platform with 500+ SKUs, cart, payments and admin panel. Launched in 3 months, resulting in ₹12L revenue in first quarter.</textarea></div>
          </div>
        </div>
      </div>
    </div>

    {/*  ⑨ TESTIMONIALS (OPTIONAL, HIDDEN)  */}
    <div className="card optional-card" id="sec-testimonials" style={{"display":"none"}}>
      <div className="card-header">
        <div className="card-icon" style={{"background":"var(--purple-bg)","color":"var(--purple)"}}><i className="ti ti-quote"></i></div>
        <div className="card-title">Client Testimonials <span className="opt-badge">Optional</span></div>
        <div className="card-actions">
          <button onClick={() => {}} className="add-btn" style={{"width":"auto","margin":0,"padding":"4px 9px","fontSize":"10px"}}><i className="ti ti-plus" style={{"fontSize":"11px"}}></i>Add</button>
        </div>
      </div>
      <div className="card-body">
        <div id="tmList">
          <div className="tm-item">
            <i className="ti ti-quote tm-quote-icon"></i>
            <div className="fg"><label className="fl">Quote</label><textarea className="ta" style={{"minHeight":"56px"}} placeholder="Enter testimonial quote…" onChange={() => {}}>YENCODE delivered an exceptional product — on time, within budget, and beyond expectations. The team was professional and responsive throughout.</textarea></div>
            <div className="form-row">
              <div className="fg"><label className="fl">Name & Role</label><input className="fi" type="text" value="Rajan M, CEO – NexCorp" onChange={() => {}} /></div>
              <div className="fg"><label className="fl">Rating</label>
                <select className="fs" onChange={() => {}}>
                  <option>⭐⭐⭐⭐⭐ 5/5</option>
                  <option>⭐⭐⭐⭐ 4/5</option>
                </select>
              </div>
            </div>
            <button className="icon-del" style={{"marginTop":"4px"}} onClick={() => {}}><i className="ti ti-trash" style={{"fontSize":"13px"}}></i> Remove</button>
          </div>
        </div>
      </div>
    </div>

    {/*  ⑩ RISKS & MITIGATION (OPTIONAL)  */}
    <div className="card optional-card active-card" id="sec-risks">
      <div className="card-header">
        <div className="card-icon" style={{"background":"var(--red-bg)","color":"var(--red)"}}><i className="ti ti-shield-exclamation"></i></div>
        <div className="card-title">Risks & Mitigation <span className="opt-badge">Optional</span></div>
        <div className="card-actions">
          <button onClick={() => {}} className="add-btn" style={{"width":"auto","margin":0,"padding":"4px 9px","fontSize":"10px"}}><i className="ti ti-plus" style={{"fontSize":"11px"}}></i>Add</button>
        </div>
      </div>
      <div className="card-body">
        <div className="risk-row-g hdr" style={{"marginBottom":"6px"}}>
          <div>Risk Description</div><div>Likelihood</div><div>Mitigation</div><div></div>
        </div>
        <div id="riskList">
          <div className="risk-row-g">
            <input type="text" className="pr-inp" value="Scope creep beyond deliverables" />
            <select className="pr-inp" style={{"padding":"7px 8px","fontSize":"11px"}}><option>High</option><option selected>Medium</option><option>Low</option></select>
            <input type="text" className="pr-inp" value="Formal change request process" />
            <button className="pr-del" onClick={() => {}}><i className="ti ti-trash"></i></button>
          </div>
          <div className="risk-row-g">
            <input type="text" className="pr-inp" value="Delayed feedback from client" />
            <select className="pr-inp" style={{"padding":"7px 8px","fontSize":"11px"}}><option>High</option><option selected>Medium</option><option>Low</option></select>
            <input type="text" className="pr-inp" value="48-hour SLA for feedback" />
            <button className="pr-del" onClick={() => {}}><i className="ti ti-trash"></i></button>
          </div>
          <div className="risk-row-g">
            <input type="text" className="pr-inp" value="Third-party API unavailability" />
            <select className="pr-inp" style={{"padding":"7px 8px","fontSize":"11px"}}><option>High</option><option>Medium</option><option selected>Low</option></select>
            <input type="text" className="pr-inp" value="Fallback APIs identified" />
            <button className="pr-del" onClick={() => {}}><i className="ti ti-trash"></i></button>
          </div>
        </div>
      </div>
    </div>

    {/*  ⑪ FAQ (OPTIONAL, HIDDEN)  */}
    <div className="card optional-card" id="sec-faq" style={{"display":"none"}}>
      <div className="card-header">
        <div className="card-icon" style={{"background":"var(--blue-bg)","color":"var(--blue)"}}><i className="ti ti-help-circle"></i></div>
        <div className="card-title">Frequently Asked Questions <span className="opt-badge">Optional</span></div>
        <div className="card-actions">
          <button onClick={() => {}} className="add-btn" style={{"width":"auto","margin":0,"padding":"4px 9px","fontSize":"10px"}}><i className="ti ti-plus" style={{"fontSize":"11px"}}></i>Add FAQ</button>
        </div>
      </div>
      <div className="card-body">
        <div id="faqList">
          <div style={{"padding":"10px 12px","background":"var(--surface2)","border":"1.5px solid var(--border)","borderRadius":"10px","marginBottom":"8px"}}>
            <div className="fg"><label className="fl">Question</label><input className="fi" type="text" value="How long will the project take?" /></div>
            <div className="fg"><label className="fl">Answer</label><textarea className="ta" style={{"minHeight":"52px"}}>Based on the scope outlined, we estimate 4 months. This includes design, development, testing and launch phases.</textarea></div>
            <button className="icon-del" onClick={() => {}}><i className="ti ti-trash" style={{"fontSize":"13px"}}></i> Remove</button>
          </div>
          <div style={{"padding":"10px 12px","background":"var(--surface2)","border":"1.5px solid var(--border)","borderRadius":"10px","marginBottom":"8px"}}>
            <div className="fg"><label className="fl">Question</label><input className="fi" type="text" value="What happens after project delivery?" /></div>
            <div className="fg"><label className="fl">Answer</label><textarea className="ta" style={{"minHeight":"52px"}}>We provide 3 months of complimentary post-launch support. After that, monthly maintenance packages are available.</textarea></div>
            <button className="icon-del" onClick={() => {}}><i className="ti ti-trash" style={{"fontSize":"13px"}}></i> Remove</button>
          </div>
        </div>
      </div>
    </div>

    {/*  ⑫ WHY US (OPTIONAL, HIDDEN)  */}
    <div className="card optional-card" id="sec-whyus" style={{"display":"none"}}>
      <div className="card-header">
        <div className="card-icon" style={{"background":"var(--amber-bg)","color":"var(--amber)"}}><i className="ti ti-medal"></i></div>
        <div className="card-title">Why Choose YENCODE? <span className="opt-badge">Optional</span></div>
      </div>
      <div className="card-body">
        <div id="whyList">
          <div className="dv-item"><div className="dv-icon" style={{"background":"var(--amber-bg)","color":"var(--amber)"}}><i className="ti ti-star"></i></div><input type="text" className="dv-input" value="8+ years delivering enterprise-grade products" /><i className="ti ti-x dv-del" onClick={() => {}}></i></div>
          <div className="dv-item"><div className="dv-icon" style={{"background":"var(--teal-light)","color":"var(--teal)"}}><i className="ti ti-users"></i></div><input type="text" className="dv-input" value="Dedicated team of experts — not freelancers" /><i className="ti ti-x dv-del" onClick={() => {}}></i></div>
          <div className="dv-item"><div className="dv-icon" style={{"background":"var(--green-bg)","color":"var(--green)"}}><i className="ti ti-clock"></i></div><input type="text" className="dv-input" value="100% on-time delivery record" /><i className="ti ti-x dv-del" onClick={() => {}}></i></div>
          <div className="dv-item"><div className="dv-icon" style={{"background":"var(--purple-bg)","color":"var(--purple)"}}><i className="ti ti-shield-check"></i></div><input type="text" className="dv-input" value="Transparent pricing, no hidden costs" /><i className="ti ti-x dv-del" onClick={() => {}}></i></div>
        </div>
        <button className="add-btn" onClick={() => {}}><i className="ti ti-plus" style={{"fontSize":"13px"}}></i>Add Point</button>
      </div>
    </div>

    {/*  ⑬ PRICING  */}
    <div className="card">
      <div className="card-header">
        <div className="card-icon" style={{"background":"var(--green-bg)","color":"var(--green)"}}><i className="ti ti-currency-rupee"></i></div>
        <div className="card-title">Investment & Pricing</div>
      </div>
      <div className="card-body">
        <div className="risk-row-g hdr" style={{"marginBottom":"6px","gridTemplateColumns":"1fr 90px 24px"}}>
          <div>Service / Item</div><div>Amount (₹)</div><div></div>
        </div>
        <div id="pricingList">
          <div className="pricing-row"><input type="text" className="pr-inp" value="UI/UX Design" onChange={() => {}} /><input type="number" className="pr-inp" value="18000" style={{"textAlign":"right"}} onChange={() => {}} /><button className="pr-del" onClick={() => {}}><i className="ti ti-trash"></i></button></div>
          <div className="pricing-row"><input type="text" className="pr-inp" value="Frontend Development" onChange={() => {}} /><input type="number" className="pr-inp" value="30000" style={{"textAlign":"right"}} onChange={() => {}} /><button className="pr-del" onClick={() => {}}><i className="ti ti-trash"></i></button></div>
          <div className="pricing-row"><input type="text" className="pr-inp" value="Backend & CMS" onChange={() => {}} /><input type="number" className="pr-inp" value="20000" style={{"textAlign":"right"}} onChange={() => {}} /><button className="pr-del" onClick={() => {}}><i className="ti ti-trash"></i></button></div>
          <div className="pricing-row"><input type="text" className="pr-inp" value="SEO & Analytics Setup" onChange={() => {}} /><input type="number" className="pr-inp" value="8000" style={{"textAlign":"right"}} onChange={() => {}} /><button className="pr-del" onClick={() => {}}><i className="ti ti-trash"></i></button></div>
          <div className="pricing-row"><input type="text" className="pr-inp" value="Testing & QA" onChange={() => {}} /><input type="number" className="pr-inp" value="7000" style={{"textAlign":"right"}} onChange={() => {}} /><button className="pr-del" onClick={() => {}}><i className="ti ti-trash"></i></button></div>
          <div className="pricing-row"><input type="text" className="pr-inp" value="Post-Launch Support (3 mo)" onChange={() => {}} /><input type="number" className="pr-inp" value="12000" style={{"textAlign":"right"}} onChange={() => {}} /><button className="pr-del" onClick={() => {}}><i className="ti ti-trash"></i></button></div>
        </div>
        <button className="add-btn" onClick={() => {}}><i className="ti ti-plus" style={{"fontSize":"13px"}}></i>Add Item</button>
        <div className="total-box">
          <div className="form-row" style={{"marginBottom":"8px"}}>
            <div className="fg"><label className="fl" style={{"fontSize":"10px"}}>GST %</label><input className="fi" type="number" id="gst" value="18" onChange={() => {}} style={{"padding":"7px 10px","fontSize":"12px"}} /></div>
            <div className="fg"><label className="fl" style={{"fontSize":"10px"}}>Discount %</label><input className="fi" type="number" id="disc" value="0" onChange={() => {}} style={{"padding":"7px 10px","fontSize":"12px"}} /></div>
          </div>
          <div className="total-row"><span style={{"color":"var(--text2)","fontWeight":600}}>Subtotal</span><span id="subtotal" style={{"fontWeight":700,"color":"var(--text)"}}>₹95,000</span></div>
          <div className="total-row"><span style={{"color":"var(--amber)","fontWeight":600}}>GST (18%)</span><span id="taxAmt" style={{"fontWeight":700,"color":"var(--amber)"}}>₹17,100</span></div>
          <div className="total-row" id="discRow" style={{"display":"none"}}><span style={{"color":"var(--green)","fontWeight":600}}>Discount</span><span id="discAmt" style={{"fontWeight":700,"color":"var(--green)"}}>-₹0</span></div>
          <div className="grand-box" style={{"marginTop":"8px"}}><span style={{"fontSize":"13px","fontWeight":800,"color":"#fff"}}>Total Investment</span><span id="grandTotal" style={{"fontSize":"16px","fontWeight":900,"color":"#fff"}}>₹1,12,100</span></div>
        </div>
        <div className="form-row" style={{"marginTop":"12px"}}>
          <div className="fg"><label className="fl">Payment Schedule</label>
            <select className="fs" id="paySchedule" onChange={() => {}}>
              <option>50% advance, 50% on delivery</option>
              <option>33% start / 33% midpoint / 33% end</option>
              <option>25% advance, 75% on delivery</option>
              <option>100% advance</option>
              <option>Monthly retainer</option>
            </select>
          </div>
          <div className="fg"><label className="fl">Pricing Model</label>
            <select className="fs">
              <option>Fixed Price</option>
              <option>Hourly Rate</option>
              <option>Monthly Retainer</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    {/*  ⑭ SIGN-OFF  */}
    <div className="card">
      <div className="card-header">
        <div className="card-icon" style={{"background":"var(--purple-bg)","color":"var(--purple)"}}><i className="ti ti-writing"></i></div>
        <div className="card-title">Closing, Terms & Sign-off</div>
      </div>
      <div className="card-body">
        <div className="fg"><label className="fl">Closing Statement</label>
          <textarea className="ta" id="closing" onChange={() => {}}>We are excited about the opportunity to work with you on this project. Our team is ready to begin immediately upon your acceptance.

YENCODE Technologies | yencodetechnologies@gmail.com | +91 89254 33533</textarea>
        </div>
        <div className="fg"><label className="fl">Terms & Conditions</label>
          <textarea className="ta" id="terms" style={{"minHeight":"90px"}}>1. 50% advance payment required before project commencement.
2. All intellectual property transfers to the client upon full payment.
3. Additional work beyond agreed scope will be quoted separately.
4. Confidentiality of all shared information will be maintained.
5. This proposal is valid for 30 days from the date of issue.</textarea>
        </div>
        <div className="form-row">
          <div className="fg"><label className="fl">Our Signature</label>
            <div className="sig-box" onClick={() => {}}>
              <i className="ti ti-signature" style={{"fontSize":"22px","color":"var(--text3)"}}></i>
              <div style={{"fontSize":"11px","color":"var(--text3)","fontWeight":600}}>Click to sign</div>
            </div>
          </div>
          <div className="fg"><label className="fl">Client Signature</label>
            <div className="sig-box" style={{"borderColor":"var(--amber)","background":"var(--amber-bg)"}}>
              <i className="ti ti-user-check" style={{"fontSize":"22px","color":"var(--amber)"}}></i>
              <div style={{"fontSize":"11px","color":"var(--amber)","fontWeight":600}}>Awaiting client</div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>{/*  /formSide  */}

  {/*  ══ PREVIEW SIDE ══  */}
  <div className="preview-side">
    <div className="preview-card">
      <div className="preview-toolbar">
        <div className="pt-title-label">📋 Live Preview</div>
        <div className="pt-btns">
          <button className="pt-b"><i className="ti ti-download" style={{"fontSize":"11px"}}></i>PDF</button>
          <button className="pt-b"><i className="ti ti-share" style={{"fontSize":"11px"}}></i>Share</button>
        </div>
      </div>

      <div className="prop-doc" id="propDoc">

        {/*  COVER  */}
        <div className="p-cover">
          <div className="p-logo">YT</div>
          <div className="p-label">Project Proposal</div>
          <div className="p-title" id="pv-title">— Proposal Title —</div>
          <div className="p-subtitle" id="pv-sub">Prepared by YENCODE Technologies</div>
          <div className="p-meta">
            <div className="p-meta-i"><i className="ti ti-calendar" style={{"fontSize":"11px"}}></i><span id="pv-date">01 Jun 2026</span></div>
            <div className="p-meta-i"><i className="ti ti-tag" style={{"fontSize":"11px"}}></i><span id="pv-type">Web Development</span></div>
            <div className="p-meta-i"><i className="ti ti-clock" style={{"fontSize":"11px"}}></i><span id="pv-expiry">Expires 01 Jul 2026</span></div>
          </div>
          <div className="p-badge" id="pv-status">DRAFT</div>
        </div>

        {/*  PARTIES  */}
        <div className="ps">
          <div className="ps-lbl"><i className="ti ti-building"></i>Parties</div>
          <div className="party-grid">
            <div className="party-b">
              <div className="pb-lbl">Prepared By</div>
              <div className="pb-name" id="pv-from">Prabhu R</div>
              <div className="pb-detail" id="pv-from-d">YENCODE Technologies<br />yencodetechnologies@gmail.com</div>
            </div>
            <div className="party-b">
              <div className="pb-lbl">Prepared For</div>
              <div className="pb-name" id="pv-to" style={{"color":"var(--text3)"}}>— Client —</div>
              <div className="pb-detail" id="pv-to-d"><span style={{"color":"var(--text3)"}}>Fill in client details</span></div>
            </div>
          </div>
        </div>

        {/*  EXEC SUMMARY  */}
        <div className="ps">
          <div className="ps-lbl"><i className="ti ti-align-left"></i>Executive Summary</div>
          <div className="exec-block problem">
            <div className="eb-lbl">Problem</div>
            <div className="eb-text" id="pv-problem"><span style={{"color":"var(--text3)","fontStyle":"italic"}}>Describe the client's challenge…</span></div>
          </div>
          <div className="exec-block solution" style={{"marginTop":"6px"}}>
            <div className="eb-lbl">Solution</div>
            <div className="eb-text" id="pv-solution"><span style={{"color":"var(--text3)","fontStyle":"italic"}}>Describe your proposed solution…</span></div>
          </div>
          <div className="exec-block whyus" style={{"marginTop":"6px"}} id="pv-outcome-block">
            <div className="eb-lbl">Expected Outcome</div>
            <div className="eb-text" id="pv-outcome"><span style={{"color":"var(--text3)","fontStyle":"italic"}}>Describe expected results…</span></div>
          </div>
        </div>

        {/*  DELIVERABLES  */}
        <div className="ps">
          <div className="ps-lbl"><i className="ti ti-checklist"></i>Scope & Deliverables</div>
          <div className="del-list" id="pv-del">
            <div className="del-item-p">Fully responsive website (8 pages)</div>
            <div className="del-item-p">Custom UI/UX design + brand guide</div>
            <div className="del-item-p">CMS for easy content management</div>
            <div className="del-item-p">SEO optimisation + Google Analytics</div>
            <div className="del-item-p">3-month post-launch support</div>
          </div>
        </div>

        {/*  TIMELINE  */}
        <div className="ps">
          <div className="ps-lbl"><i className="ti ti-calendar-stats"></i>Project Timeline</div>
          <div style={{"display":"flex","gap":"12px","marginBottom":"8px"}}>
            <span style={{"fontSize":"10px","fontWeight":700,"color":"var(--text2)"}}>Start: <span id="pv-start" style={{"color":"var(--teal)"}}>01 Jul 2026</span></span>
            <span style={{"fontSize":"10px","fontWeight":700,"color":"var(--text2)"}}>End: <span id="pv-end" style={{"color":"var(--teal)"}}>31 Oct 2026</span></span>
            <span style={{"fontSize":"10px","fontWeight":700,"color":"var(--text2)"}}>Duration: <span id="pv-dur" style={{"color":"var(--teal)"}}>4 Months</span></span>
          </div>
          <div className="tl-p" id="pv-timeline"></div>
        </div>

        {/*  TEAM (optional)  */}
        <div className="ps" id="pv-sec-team">
          <div className="ps-lbl"><i className="ti ti-users"></i>Our Team</div>
          <div className="team-p" id="pv-team"></div>
        </div>

        {/*  VALUE (optional)  */}
        <div className="ps" id="pv-sec-value">
          <div className="ps-lbl"><i className="ti ti-trending-up"></i>Value Proposition & ROI</div>
          <div className="val-p" id="pv-value"></div>
        </div>

        {/*  CASE STUDIES (optional)  */}
        <div className="ps" id="pv-sec-cs" style={{"display":"none"}}>
          <div className="ps-lbl"><i className="ti ti-trophy"></i>Past Work & Case Studies</div>
          <div id="pv-cs"></div>
        </div>

        {/*  TESTIMONIALS (optional)  */}
        <div className="ps" id="pv-sec-tm" style={{"display":"none"}}>
          <div className="ps-lbl"><i className="ti ti-quote"></i>Client Testimonials</div>
          <div id="pv-tm"></div>
        </div>

        {/*  RISKS (optional)  */}
        <div className="ps" id="pv-sec-risks">
          <div className="ps-lbl"><i className="ti ti-shield-exclamation"></i>Risks & Mitigation</div>
          <div className="risk-p" id="pv-risks"></div>
        </div>

        {/*  PRICING  */}
        <div className="ps">
          <div className="ps-lbl"><i className="ti ti-currency-rupee"></i>Investment</div>
          <table className="pricing-tbl">
            <thead><tr><th>Service</th><th>Amount</th></tr></thead>
            <tbody id="pv-pricing"></tbody>
          </table>
          <div className="pricing-grand" style={{"marginTop":"7px"}}><span>Total Investment</span><span id="pv-grand">₹1,12,100</span></div>
          <div style={{"marginTop":"6px","fontSize":"10px","color":"var(--text2)","fontWeight":600}} id="pv-pay">Payment: 50% advance, 50% on delivery</div>
        </div>

        {/*  CLOSING  */}
        <div className="ps">
          <div className="ps-lbl"><i className="ti ti-writing"></i>Closing</div>
          <div id="pv-closing" style={{"fontSize":"10px","color":"var(--text2)","lineHeight":1.7}}>We are excited about the opportunity to work with you…</div>
        </div>

        {/*  SIGN OFF  */}
        <div className="ps">
          <div className="ps-lbl"><i className="ti ti-signature"></i>Sign-off</div>
          <div className="sop">
            <div className="sob">
              <div className="sob-line"></div>
              <div className="sob-name" id="pv-sig1">Prabhu R</div>
              <div className="sob-role">YENCODE Technologies</div>
            </div>
            <div className="sob">
              <div className="sob-line" style={{"background":"var(--amber)"}}></div>
              <div className="sob-name" id="pv-sig2" style={{"color":"var(--text3)"}}>— Client —</div>
              <div className="sob-role" id="pv-sig2-role">Awaiting</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>{/*  /preview  */}

  </div>{/*  /content  */}
</div>{/*  /main  */}


    </div>
  );
}
