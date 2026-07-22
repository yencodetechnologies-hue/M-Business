
import React, { useEffect, useRef } from 'react';
import * as logic from './ProposalFormLogic';

export default function ProposalForm({ onBack, onSave, initialData, clients, onAddClient, newlyAddedClientName, onMountExposeCrop }) {
  const containerRef = useRef(null);
  window._proposalFormContainer = null;

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    window._proposalFormContainer = c;
    if (newlyAddedClientName) {
      const selEl = c.querySelector('#toComp');
      if (selEl && selEl.tagName === 'SELECT') {
        const opt = Array.from(selEl.options).find(o => o.value === newlyAddedClientName);
        if (opt) {
          selEl.value = newlyAddedClientName;
          selEl.style.transition = 'box-shadow .3s, border-color .3s';
          selEl.style.borderColor = '#00BCD4';
          selEl.style.boxShadow = '0 0 0 3px rgba(0,188,212,.25)';
          setTimeout(() => { selEl.style.boxShadow = 'none'; }, 2000);
        }
      }
    }
    if (typeof onMountExposeCrop === 'function') onMountExposeCrop();

    // Expose ALL logic functions to window so dangerouslySetInnerHTML onclick attrs work natively
    Object.assign(window, logic);
    window.openSignatureModal = function () {
      const modal = document.getElementById('sigModal');
      if (!modal) return;
      modal.style.display = 'flex';
      const closeBtn = document.getElementById('sigModalClose');
      if (closeBtn) closeBtn.onclick = () => { modal.style.display = 'none'; };
      ['draw', 'type', 'upload'].forEach(tab => {
        const btn = document.getElementById('sigTab-' + tab);
        if (btn) btn.onclick = () => {
          ['draw', 'type', 'upload'].forEach(t => {
            const b = document.getElementById('sigTab-' + t);
            const c = document.getElementById('sigContent-' + t);
            if (b) { b.style.color = t === tab ? 'var(--teal)' : '#607D86'; b.style.borderBottom = t === tab ? '2px solid var(--teal)' : '2px solid transparent'; }
            if (c) c.style.display = t === tab ? 'block' : 'none';
          });
        };
      });
      const clearBtn = document.getElementById('sigClearBtn');
      if (clearBtn) clearBtn.onclick = () => { const cv = document.getElementById('sigCanvas'); if (cv) cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); };
      const applyDrawBtn = document.getElementById('sigApplyDrawBtn');
      if (applyDrawBtn) applyDrawBtn.onclick = () => { const cv = document.getElementById('sigCanvas'); if (!cv) return; applyBox(cv.toDataURL(), 'image'); modal.style.display = 'none'; };
      const applyTypeBtn = document.getElementById('sigApplyTypeBtn');
      if (applyTypeBtn) applyTypeBtn.onclick = () => { const val = document.getElementById('typedSigInput')?.value?.trim(); if (!val) return; applyBox(val, 'text'); modal.style.display = 'none'; };
      const typedInput = document.getElementById('typedSigInput');
      if (typedInput) typedInput.oninput = (e) => { const p = document.getElementById('typedSigPreview'), pt = document.getElementById('typedSigPreviewText'); if (p && pt) { pt.textContent = e.target.value; p.style.display = e.target.value ? 'block' : 'none'; } };
      const uploadInput = document.getElementById('sigUploadInput');
      if (uploadInput) uploadInput.onchange = (e) => { const file = e.target.files[0]; if (!file) return; const r = new FileReader(); r.onload = (ev) => { applyBox(ev.target.result, 'image'); modal.style.display = 'none'; }; r.readAsDataURL(file); };
      function applyBox(value, type) {
        const box = document.getElementById('ourSigBox');
        const name = document.getElementById('pv-from')?.innerText || 'Signed';
        if (box) {
          box.innerHTML = type === 'image' ? `<img src="${value}" style="max-height:50px;max-width:100%;object-fit:contain;"/><div style="font-size:10px;color:var(--teal);font-weight:700;margin-top:2px;">${name} — Signed</div>` : `<span style="font-family:'Dancing Script',cursive;font-size:22px;color:#1a2e35;font-weight:bold;">${value}</span><div style="font-size:10px;color:var(--teal);font-weight:700;margin-top:2px;">${name} — Signed</div>`;
          box.style.borderColor = 'var(--teal)'; box.style.background = 'var(--teal-lighter)';
        }
        const pvSig = document.getElementById('pv-sig1');
        if (pvSig) pvSig.innerHTML = type === 'image' ? `<img src="${value}" style="max-height:40px;max-width:120px;object-fit:contain;"/>` : `<div style="color:var(--teal);font-family:'Dancing Script',cursive;font-size:24px;">${value}</div>`;
      }
      setTimeout(() => {
        const cv = document.getElementById('sigCanvas');
        if (!cv) return;
        const rect = cv.getBoundingClientRect();
        cv.width = rect.width || 420; cv.height = 160;
        const ctx = cv.getContext('2d');
        ctx.strokeStyle = '#1a2e35'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        let drawing = false, pts = [];
        function pos(e) { const r = cv.getBoundingClientRect(), cx = e.touches ? e.touches[0].clientX : e.clientX, cy = e.touches ? e.touches[0].clientY : e.clientY; return { x: (cx - r.left) * (cv.width / r.width), y: (cy - r.top) * (cv.height / r.height) }; }
        cv.onmousedown = (e) => { pts = [pos(e)]; drawing = true; };
        cv.onmousemove = (e) => { if (!drawing) return; const p = pos(e); pts.push(p); if (pts.length > 2) { const a = pts[pts.length - 3], b = pts[pts.length - 2], c = pts[pts.length - 1], mx = (b.x + c.x) / 2, my = (b.y + c.y) / 2, px = (a.x + b.x) / 2, py = (a.y + b.y) / 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(b.x, b.y, mx, my); ctx.stroke(); } else if (pts.length === 2) { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); ctx.stroke(); } };
        cv.onmouseup = cv.onmouseleave = () => { drawing = false; pts = []; };
        cv.ontouchstart = (e) => { e.preventDefault(); pts = [pos(e)]; drawing = true; };
        cv.ontouchmove = (e) => { if (!drawing) return; e.preventDefault(); const p = pos(e); pts.push(p); if (pts.length > 2) { const a = pts[pts.length - 3], b = pts[pts.length - 2], c = pts[pts.length - 1], mx = (b.x + c.x) / 2, my = (b.y + c.y) / 2, px = (a.x + b.x) / 2, py = (a.y + b.y) / 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(b.x, b.y, mx, my); ctx.stroke(); } };
        cv.ontouchend = () => { drawing = false; pts = []; };
      }, 50);
    };
    window._onSaveProposal = onSave;

    window._onSaveProposal = onSave;

    const clientsList = clients || window._clientsData || [];
    window._clientsData = clientsList;
    window._onAddClient = () => {
      if (typeof onAddClient === 'function') onAddClient();
    };
    const sel = document.getElementById('toComp');
    if (sel && sel.tagName === 'SELECT') {
      sel.innerHTML = '<option value="">-- Select Client --</option>'
        + (onAddClient ? '<option value="__add_new__">+ Add New Client</option>' : '')
        + clientsList.map(c => {
          const name = c.clientName || c.name || '';
          const cid = c._id || c.id || '';
          return `<option value="${name}" data-client-id="${cid}">${name}</option>`;
        }).join('');
      // if there's initial data, select it
      if (initialData && initialData.client) {
        sel.value = initialData.client;
      }
      // If a client was just added and this is a fresh mount, select it,
      // open the dropdown where the browser supports it, and flash the
      // field so the newly selected client is unmistakable either way.
      if (!initialData && newlyAddedClientName) {
        sel.value = newlyAddedClientName;
        sel.style.transition = 'box-shadow .3s, border-color .3s';
        sel.style.borderColor = '#00BCD4';
        sel.style.boxShadow = '0 0 0 3px rgba(0,188,212,.25)';
        setTimeout(() => {
          sel.style.boxShadow = 'none';
        }, 2000);
        setTimeout(() => {
          try {
            sel.focus();
            if (typeof sel.showPicker === 'function') sel.showPicker();
          } catch (e) { }
        }, 100);
      }
      // Keep track of the selected client's unique ID (used to isolate the
      // proposal to that exact client account, not just a matching name).
      window._selectedClientId = (initialData && initialData.clientId) || '';
    }
    // Hook up back button
    // Hook up back button + all topbar buttons
    const hookUp = () => {
      const backBtn = c.querySelector('.back-btn');
      if (backBtn) backBtn.onclick = onBack;

      c.querySelectorAll('[onchange]').forEach(el => {
        const oc = el.getAttribute('onchange');
        if (!oc) return;
        const fnMatch = oc.match(/^([a-zA-Z0-9_]+)\((.*)\)$/);
        if (!fnMatch) return;
        const fn = fnMatch[1];
        if (typeof logic[fn] !== 'function') return;
        const existing = el.onchange;
        el.onchange = (e) => {
          if (typeof existing === 'function') existing(e);
          logic[fn](el);
        };
      });

      c.querySelectorAll('[onclick]').forEach(el => {
        const oc = el.getAttribute('onclick');
        if (!oc) return;
        // Handle: fn() or fn(this) or fn(this,'arg') or fn('arg1','arg2')
        const fnMatch = oc.match(/^([a-zA-Z0-9_]+)\((.*)\)$/);
        if (!fnMatch) return;
        const fn = fnMatch[1];
        const rawArgs = fnMatch[2].trim();
        if (typeof logic[fn] !== 'function') return;
        el.onclick = (e) => {
          e.stopPropagation();
          if (!rawArgs) {
            logic[fn]();
          } else if (rawArgs === 'this') {
            logic[fn](el);
          } else if (rawArgs.startsWith('this,')) {
            const rest = rawArgs.slice(5).replace(/['"]/g, '').trim();
            logic[fn](el, rest);
          } else {
            const args = rawArgs.split(',').map(a => a.trim().replace(/^['"]|['"]$/g, ''));
            logic[fn](...args);
          }
        };
      });

      // Duplicate button (no onclick attr)
      const dupBtn = c.querySelector('.topbar-actions .btn-o:first-child');
      if (dupBtn) dupBtn.onclick = () => {
        if (window._onSaveProposal) {
          const data = logic.extractProposalData();
          data.title = data.title + ' ()';
          data.status = 'draft';
          window._onSaveProposal(data);
        }
      };

      // Cover upload — real file picker, persisted as a data URL so it
      // survives save/reload (a blob: URL from createObjectURL does not).
      const coverZone = c.querySelector('#coverZone');
      console.log('coverZone found:', !!coverZone);
      if (coverZone) {
        const applyCoverImage = (dataUrl) => {
          const liveZone = document.getElementById('coverZone');
          if (!liveZone) { console.log('coverZone not found when applying image'); return; }
          liveZone.style.backgroundImage = `url(${dataUrl})`;
          liveZone.style.backgroundSize = 'contain';
          liveZone.style.backgroundRepeat = 'no-repeat';
          liveZone.style.backgroundPosition = 'center';
          liveZone.style.borderColor = 'var(--teal)';
          liveZone.style.borderStyle = 'solid';
          liveZone.innerHTML = `<div style="background:rgba(0,0,0,0.55);color:#fff;font-weight:700;font-size:12px;padding:6px 12px;border-radius:8px">Cover image uploaded — Click to change</div>`;
          liveZone.dataset.coverImage = dataUrl;
        };
        coverZone.onclick = () => {
          const inp = document.createElement('input');
          inp.type = 'file'; inp.accept = 'image/*';
          inp.onchange = (e) => {
            console.log('onchange fired. files:', e.target.files.length, 'triggerCrop type:', typeof window.triggerCrop);
            if (typeof window.triggerCrop === 'function') {
              window.triggerCrop(e, (croppedImage) => applyCoverImage(croppedImage), 1);
            } else if (window._triggerCrop) {
              window._triggerCrop(e, (croppedImage) => applyCoverImage(croppedImage), 1);
            } else {
              const file = e.target.files[0]; if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => applyCoverImage(ev.target.result);
              reader.readAsDataURL(file);
            }
          };
          console.log('inp.click() called');
          inp.click();
        };
      }
    };
    setTimeout(hookUp, 300);
    setTimeout(() => {
      c.querySelectorAll('.sp-toggle').forEach(btn => {
        btn.style.pointerEvents = 'auto';
        btn.style.position = 'relative';
        btn.style.zIndex = '10';
        const oc = btn.getAttribute('onclick') || '';
        const m = oc.match(/toggleSection\(this,\s*'([^']+)'\)/);
        if (!m) return;
        const secId = m[1];
        btn.onclick = null;
        btn.removeAttribute('onclick');
        btn.addEventListener('click', () => logic.toggleSection(btn, secId));
      });
    }, 350);
    setTimeout(() => {
      c.querySelectorAll('.sp-toggle').forEach(btn => {
        const oc = btn.getAttribute('onclick') || '';
        const m = oc.match(/toggleSection\(this,\s*'([^']+)'\)/);
        if (!m) return;
        const secId = m[1];
        btn.onclick = null;
        btn.removeAttribute('onclick');
        btn.addEventListener('click', () => logic.toggleSection(btn, secId));
      });
    }, 350);
    setTimeout(() => {
      c.querySelectorAll('.sp-toggle:not(.required)').forEach(btn => {
        const oc = btn.getAttribute('onclick') || '';
        const m = oc.match(/toggleSection\(this,\s*'([^']+)'\)/);
        if (!m) return;
        const secId = m[1];
        btn.removeAttribute('onclick');
        btn.onclick = () => logic.toggleSection(btn, secId);
      });
    }, 310);
    setTimeout(() => {
      const sigBox = document.getElementById('ourSigBox');
      if (sigBox) sigBox.onclick = () => logic.openSignatureModal();
    }, 400);
    // Existing data load
    if (initialData) {
      setTimeout(() => {
        const setVal = (id, val) => {
          const el = document.getElementById(id);
          if (el && val) el.value = val;
        };
        setVal('propTitle', initialData.title);
        setVal('toComp', initialData.client);
        if (logic.up) logic.up();
        if (logic.calcTotal) logic.calcTotal();
      }, 400);
    }

    const handleInput = () => {
      try {
        if (logic.up) logic.up();
        if (logic.calcTotal) logic.calcTotal();
      } catch (err) { }
    };

    c.addEventListener('input', handleInput);

    // Initial render update
    setTimeout(() => {
      try {
        if (logic.calcTotal) logic.calcTotal();
        if (logic.up) logic.up();
        if (logic.updateMilestonesPreview) logic.updateMilestonesPreview();
        if (logic.updateTeamPreview) logic.updateTeamPreview();
        if (logic.updateValuePreview) logic.updateValuePreview();
        if (logic.updateRisksPreview) logic.updateRisksPreview();
      } catch (e) { console.error('Init error', e); }
    }, 300);

    return () => {
      c.removeEventListener('input', handleInput);
    };
  }, [onBack, onSave]);


  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "var(--bg)", display: "flex", flexDirection: "column", overflow: "hidden" }}
      onClickCapture={(e) => console.log('CLICK HIT:', e.target)}>
      <style>{`
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
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
  --sidebar-grad:linear-gradient(180deg,#26D0CE 0%, var(--app-accent, var(--app-accent, #00BCD4)) 35%,var(--app-accent2, #00ACC1) 65%,#006E7F 100%);
  --font:'Nunito',sans-serif;--radius:14px;
}
html,body{font-family:var(--font);font-size:14px;background:var(--bg);color:var(--text)}

/* ── TOPBAR ── */
.topbar{background:var(--surface);border-bottom:1px solid var(--border);padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;z-index:50;box-shadow:0 1px 8px rgba(0,188,212,.06);gap:10px}
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

/* ── TWO-PANEL LAYOUT ── */
.two-panel{display:grid;grid-template-columns:1fr 1fr;gap:0;flex:1;overflow:hidden;height:calc(100vh - 56px)}
.form-panel{overflow-y:auto;overflow-x:hidden;padding:20px 20px 60px;scrollbar-width:thin;scrollbar-color:var(--border2) transparent}
.preview-panel{overflow-y:auto;overflow-x:hidden;border-left:2px solid var(--border);background:var(--surface2);scrollbar-width:thin;scrollbar-color:var(--border2) transparent}

/* ── PREVIEW TOOLBAR ── */
.preview-toolbar{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--border);background:var(--surface);position:sticky;top:0;z-index:10}
.pt-title-label{font-size:12px;font-weight:800;color:var(--text)}
.pt-btns{display:flex;gap:5px}
.pt-b{display:flex;align-items:center;gap:4px;padding:5px 9px;background:var(--surface);border:1.5px solid var(--border);border-radius:7px;font-size:10px;font-weight:700;color:var(--text2);cursor:pointer;font-family:var(--font);transition:all .15s}
.pt-b:hover{border-color:var(--teal);color:var(--teal)}

/* ── SECTION PICKER ── */
.section-picker{background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius);padding:14px 16px;margin-bottom:16px}
.sp-title{font-size:12px;font-weight:800;color:var(--text);margin-bottom:10px;display:flex;align-items:center;gap:7px}
.sp-grid{display:flex;flex-wrap:wrap;gap:7px}
.sp-toggle{display:flex;align-items:center;gap:6px;padding:6px 11px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;transition:all .15s;border:1.5px solid var(--border);color:var(--text2);font-family:var(--font);background:var(--surface2)}
.sp-toggle.on{background:var(--teal-lighter);border-color:var(--teal);color:var(--teal)}
.sp-toggle.required{background:var(--surface2);border-color:var(--border2);color:var(--text2);cursor:not-allowed;font-weight:700}
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

/* PROPOSAL DOC */
.prop-doc{font-family:var(--font);font-size:12px;color:#1A2E35}
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
.ps{padding:14px 18px;border-bottom:1px solid var(--border)}
.ps:last-child{border-bottom:none}
.ps-lbl{font-size:9px;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;display:flex;align-items:center;gap:5px}
.ps-lbl i{font-size:12px}
.party-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.party-b{padding:9px 11px;background:var(--surface2);border-radius:8px;border:1px solid var(--border)}
.pb-lbl{font-size:8px;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:.7px;margin-bottom:3px}
.pb-name{font-size:11px;font-weight:800;color:var(--text)}
.pb-detail{font-size:9px;color:var(--text3);line-height:1.7;margin-top:1px}
.exec-block{margin-bottom:8px;padding:9px 11px;border-radius:8px;border-left:3px solid var(--border2)}
.exec-block.problem{border-left-color:var(--red);background:var(--red-bg)}
.exec-block.solution{border-left-color:var(--teal);background:var(--teal-lighter)}
.exec-block.whyus{border-left-color:var(--green);background:var(--green-bg)}
.eb-lbl{font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px}
.exec-block.problem .eb-lbl{color:var(--red)}
.exec-block.solution .eb-lbl{color:var(--teal)}
.exec-block.whyus .eb-lbl{color:var(--green)}
.eb-text{font-size:10px;color:var(--text2);line-height:1.6}
.del-list{display:flex;flex-direction:column;gap:4px}
.del-item-p{display:flex;align-items:center;gap:6px;font-size:10px;color:var(--text2)}
.del-item-p::before{content:'\\2713';color:var(--teal);font-weight:800;font-size:11px;flex-shrink:0}
.tl-p{display:flex;flex-direction:column;gap:0}
.tl-pi{display:flex;gap:8px;padding-bottom:8px}
.tl-pi:last-child{padding-bottom:0}
.tl-dot{width:20px;height:20px;border-radius:50%;background:var(--teal);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:#fff;flex-shrink:0}
.tl-line-p{width:2px;background:var(--teal-light);flex:1;margin:2px 0;min-height:10px}
.tl-pi:last-child .tl-line-p{display:none}
.tl-pi-title{font-size:10px;font-weight:700;color:var(--text)}
.tl-pi-date{font-size:9px;color:var(--teal);font-weight:600}
.tl-pi-desc{font-size:9px;color:var(--text3);margin-top:1px;line-height:1.5}
.team-p{display:flex;flex-wrap:wrap;gap:7px}
.tp-card{padding:7px 9px;background:var(--surface2);border-radius:8px;border:1px solid var(--border)}
.tp-av-p{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:#fff;flex-shrink:0}
.tp-name-p{font-size:10px;font-weight:700;color:var(--text)}
.tp-role-p{font-size:9px;color:var(--text3)}
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
.val-p{display:flex;flex-direction:column;gap:4px}
.val-pi{display:flex;align-items:flex-start;gap:6px;font-size:10px;color:var(--text2)}
.val-pi::before{content:'';color:var(--amber);font-weight:800;font-size:11px;flex-shrink:0}
.cs-p{padding:8px 10px;background:var(--surface2);border-radius:8px;border-left:3px solid var(--teal);margin-bottom:7px}
.cs-p:last-child{margin-bottom:0}
.cs-p-title{font-size:10px;font-weight:800;color:var(--text);margin-bottom:3px}
.cs-p-detail{font-size:9px;color:var(--text3);line-height:1.6}
.tm-p{padding:8px 10px;background:var(--teal-lighter);border-radius:8px;border:1px solid var(--teal-light);margin-bottom:7px;font-style:italic}
.tm-p:last-child{margin-bottom:0}
.tm-p-text{font-size:10px;color:var(--text2);margin-bottom:5px}
.tm-p-author{font-size:9px;font-weight:700;color:var(--teal)}
.risk-p{display:flex;flex-direction:column;gap:4px}
.risk-pi{display:flex;align-items:flex-start;gap:7px;padding:5px 8px;border-radius:7px;background:var(--surface2);border:1px solid var(--border)}
.risk-badge-p{font-size:8px;font-weight:800;padding:1px 6px;border-radius:20px;flex-shrink:0}
.risk-badge-p.h{background:var(--red-bg);color:var(--red)}
.risk-badge-p.m{background:var(--amber-bg);color:var(--amber)}
.risk-badge-p.l{background:var(--green-bg);color:var(--green)}
.risk-pi-text{font-size:9px;color:var(--text2);flex:1}
.risk-pi-mit{font-size:9px;color:var(--text3);font-style:italic}
.sop{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sob{padding:10px;background:var(--surface2);border-radius:8px;border:1px solid var(--border);text-align:center}
.sob-line{width:70px;height:1px;background:var(--text3);margin:0 auto 4px}
.sob-name{font-size:10px;font-weight:700;color:var(--text)}
.sob-role{font-size:9px;color:var(--text3)}

@media(max-width:900px){
  .two-panel{grid-template-columns:1fr;height:auto}
  .form-panel{max-height:none}
  .preview-panel{border-left:none;border-top:2px solid var(--border)}
  .form-row,.form-row-3{grid-template-columns:1fr}
  .topbar-actions .btn-o{display:none}
}
`}</style>

      <div ref={containerRef} dangerouslySetInnerHTML={{
        __html: `

<header class="topbar">
  <div class="topbar-left">
    <button class="back-btn"><i class="ti ti-arrow-left" style="font-size:13px"></i> Proposals</button>
    <div class="topbar-title">Create Proposal</div>
  </div>
  <div class="topbar-actions">
    <button class="btn-o"><i class="ti ti-copy" style="font-size:13px"></i> Duplicate</button>
    <button class="btn-o" onclick="saveDraft()"><i class="ti ti-device-floppy" style="font-size:13px"></i> Save Draft</button>
    <button class="btn-o"><i class="ti ti-download" style="font-size:13px"></i> PDF</button>
    <button class="btn-t" onclick="sendProposal()"><i class="ti ti-send" style="font-size:13px"></i> Send</button>
    <button class="btn-t btn-g" onclick="markWon()"><i class="ti ti-trophy" style="font-size:13px"></i> Mark Won</button>
  </div>
</header>

<div class="two-panel">

  <!-- ══ LEFT: FORM ══ -->
  <div class="form-panel" id="formSide">

    <div class="section-picker" style="position:relative;z-index:50;pointer-events:auto">
      <div class="sp-title"><i class="ti ti-layout-grid" style="color:var(--teal);font-size:15px"></i> Proposal Sections — Toggle Optional Sections</div>
      <div class="sp-grid" style="position:relative;z-index:50;pointer-events:auto">
        <button class="sp-toggle on" onclick="toggleSection(this,'sec-basics')">Basics</button>
        <button class="sp-toggle on" onclick="toggleSection(this,'sec-parties')">Parties</button>
        <button class="sp-toggle on" onclick="toggleSection(this,'sec-summary')">Summary</button>
        <button class="sp-toggle on" onclick="toggleSection(this,'sec-deliverables')">Deliverables</button>
        <button class="sp-toggle on" onclick="toggleSection(this,'sec-timeline')">Timeline</button>
        <button class="sp-toggle on" onclick="toggleSection(this,'sec-pricing')">Pricing</button>
        <button class="sp-toggle on" onclick="toggleSection(this,'sec-signoff')">Sign-off</button>
        <button class="sp-toggle on" onclick="toggleSection(this,'sec-team')"><i class="ti ti-users"></i> Our Team</button>
        <button class="sp-toggle on" onclick="toggleSection(this,'sec-value')"><i class="ti ti-star"></i> Value & ROI</button>
        <button class="sp-toggle" onclick="toggleSection(this,'sec-casestudies')"><i class="ti ti-trophy"></i> Case Studies</button>
        <button class="sp-toggle" onclick="toggleSection(this,'sec-testimonials')"><i class="ti ti-quote"></i> Testimonials</button>
        <button class="sp-toggle on" onclick="toggleSection(this,'sec-risks')"><i class="ti ti-shield-exclamation"></i> Risks</button>

      </div>
    </div>

    <div class="card" id="sec-basics">
      <div class="card-header">
        <div class="card-icon" style="background:var(--teal-light);color:var(--teal)"><i class="ti ti-file-description"></i></div>
        <div class="card-title">Proposal Basics</div>
        <span style="margin-left:auto;font-size:10px;font-weight:700;background:var(--amber-bg);color:var(--amber);padding:3px 9px;border-radius:20px">#PRO-2026-0015</span>
      </div>
      <div class="card-body">
        <div class="cover-zone" id="coverZone">
          <i class="ti ti-photo-plus"></i>
          <div class="cover-zone-txt">Upload Cover Image / Banner</div>
          <div class="cover-zone-sub">PNG, JPG · Recommended 1200✕400px</div>
        </div>
        <div class="form-row">
          <div class="fg"><label class="fl">Proposal Title</label><input class="fi" type="text" id="propTitle" placeholder="e.g. Corporate Website Redesign" oninput="up()"></div>
          <div class="fg"><label class="fl">Proposal Date</label><input class="fi" type="date" id="propDate" value="2026-06-01" oninput="up()"></div>
        </div>
        <div class="form-row">
          <div class="fg"><label class="fl">Project Type</label><div id="propTypeWrap"><select class="fs" id="propType" onchange="toggleProposalTypeCustom(this)"><option value="" disabled selected>Select Project Type</option><option value="__custom__">Custom</option><option>Web Development</option><option>Mobile App</option><option>UI/UX Design</option><option>Digital Marketing</option><option>Custom Software</option><option>E-Commerce</option><option>Consulting</option></select></div></div>
          <div class="fg"><label class="fl">Expiry Date</label><input class="fi" type="date" id="propExpiry" value="2026-07-01" oninput="up()"></div>
        </div>
        <div class="fg">
          <label class="fl" style="margin-bottom:7px">Status</label>
          <div class="status-row">
            <button class="sc active-sc" onclick="selSt(this,'DRAFT')">Draft</button>
            <button class="sc sent" onclick="selSt(this,'SENT')">Sent</button>
            <button class="sc neg" onclick="selSt(this,'NEGOTIATION')">Negotiation</button>
            <button class="sc won" onclick="selSt(this,'WON')">Won</button>
            <button class="sc lost" onclick="selSt(this,'LOST')">Lost</button>
            <button class="sc exp" onclick="selSt(this,'EXPIRED')">Expired</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card" id="sec-parties">
      <div class="card-header"><div class="card-icon" style="background:var(--amber-bg);color:var(--amber)"><i class="ti ti-building"></i></div><div class="card-title">Parties — From & Prepared For</div></div>
      <div class="card-body">
        <div style="font-size:10px;font-weight:800;color:var(--teal);text-transform:uppercase;letter-spacing:.7px;margin-bottom:10px">Our Details</div>
        <div class="form-row">
          <div class="fg"><label class="fl">Company Name</label><input class="fi" type="text" id="fromComp" oninput="up()"></div>
          <div class="fg"><label class="fl">Contact Person</label><input class="fi" type="text" id="fromPerson" oninput="up()"></div>
        </div>
        <div class="form-row">
          <div class="fg"><label class="fl">Email</label><input class="fi" type="email" id="fromEmail" value="" oninput="up()"></div>
          <div class="fg"><label class="fl">Phone</label><input class="fi" type="tel" id="fromPhone" value="" oninput="up()"></div>
        </div>
        <div class="fg"><label class="fl">Address</label><input class="fi" type="text" id="fromAddr" value="Chennai, Tamil Nadu, India" oninput="up()"></div>
        <div style="height:1px;background:var(--border);margin:14px 0"></div>
        <div style="font-size:10px;font-weight:800;color:var(--amber);text-transform:uppercase;letter-spacing:.7px;margin-bottom:10px">Client Details</div>
        <div class="form-row">
          <div class="fg"><label class="fl">Client / Company</label><select class="fi" id="toComp" onchange="clientSelected(this)"><option value="">-- Select Client --</option></select></div>
          <div class="fg"><label class="fl">Contact Person</label><input class="fi" type="text" id="toPerson" placeholder="Contact name" oninput="up()"></div>
        </div>
        <div class="form-row">
          <div class="fg"><label class="fl">Email</label><input class="fi" type="email" id="toEmail" placeholder="client@email.com" oninput="up()"></div>
          <div class="fg"><label class="fl">Phone</label><input class="fi" type="tel" id="toPhone" placeholder="+91 XXXXX XXXXX" oninput="up()"></div>
        </div>
        <div class="fg"><label class="fl">Address / Location</label><input class="fi" type="text" id="toAddr" placeholder="City, Country" oninput="up()"></div>
      </div>
    </div>

    <div class="card" id="sec-summary">
      <div class="card-header"><div class="card-icon" style="background:var(--teal-light);color:var(--teal)"><i class="ti ti-align-left"></i></div><div class="card-title">Executive Summary</div></div>
      <div class="card-body">
        <div class="fg"><label class="fl">Problem / Challenge <span class="fl-hint">What is the client struggling with?</span></label><textarea class="ta" id="problem" placeholder="Describe the client's pain point…" oninput="up()"></textarea></div>
        <div class="fg"><label class="fl">Our Proposed Solution</label><textarea class="ta" id="solution" placeholder="Describe your approach and solution…" oninput="up()"></textarea></div>
        <div class="fg"><label class="fl">Expected Outcome</label><textarea class="ta" id="outcome" placeholder="Describe the measurable results…" style="min-height:64px" oninput="up()"></textarea></div>
      </div>
    </div>

    <div class="card" id="sec-deliverables">
      <div class="card-header"><div class="card-icon" style="background:var(--purple-bg);color:var(--purple)"><i class="ti ti-checklist"></i></div><div class="card-title">Scope & Deliverables</div><div class="card-actions"><button onclick="addDel()" class="add-btn" style="width:auto;margin:0;padding:4px 9px;font-size:10px"><i class="ti ti-plus" style="font-size:11px"></i>Add</button></div></div>
      <div class="card-body">
        <div id="delList">
          <div class="dv-item"><div class="dv-icon" style="background:var(--teal-light);color:var(--teal)"><i class="ti ti-world"></i></div><input type="text" class="dv-input" value="Fully responsive website (8 pages)" oninput="up()"><i class="ti ti-x dv-del" onclick="this.parentElement.remove();up()"></i></div>
          <div class="dv-item"><div class="dv-icon" style="background:var(--purple-bg);color:var(--purple)"><i class="ti ti-palette"></i></div><input type="text" class="dv-input" value="Custom UI/UX design + brand guide" oninput="up()"><i class="ti ti-x dv-del" onclick="this.parentElement.remove();up()"></i></div>
          <div class="dv-item"><div class="dv-icon" style="background:var(--blue-bg);color:var(--blue)"><i class="ti ti-settings"></i></div><input type="text" class="dv-input" value="CMS for easy content management" oninput="up()"><i class="ti ti-x dv-del" onclick="this.parentElement.remove();up()"></i></div>
          <div class="dv-item"><div class="dv-icon" style="background:var(--green-bg);color:var(--green)"><i class="ti ti-chart-bar"></i></div><input type="text" class="dv-input" value="SEO optimisation + Google Analytics" oninput="up()"><i class="ti ti-x dv-del" onclick="this.parentElement.remove();up()"></i></div>
          <div class="dv-item"><div class="dv-icon" style="background:var(--amber-bg);color:var(--amber)"><i class="ti ti-headset"></i></div><input type="text" class="dv-input" value="3-month post-launch support" oninput="up()"><i class="ti ti-x dv-del" onclick="this.parentElement.remove();up()"></i></div>
        </div>
        <button class="add-btn" onclick="addDel()"><i class="ti ti-plus" style="font-size:13px"></i>Add Deliverable</button>
      </div>
    </div>

    <div class="card" id="sec-timeline">
      <div class="card-header"><div class="card-icon" style="background:var(--blue-bg);color:var(--blue)"><i class="ti ti-calendar-stats"></i></div><div class="card-title">Project Timeline & Milestones</div></div>
      <div class="card-body">
        <div class="form-row" style="margin-bottom:14px">
          <div class="fg"><label class="fl">Project Start</label><input class="fi" type="date" id="startDate" value="2026-07-01" oninput="up()"></div>
          <div class="fg"><label class="fl">Project End</label><input class="fi" type="date" id="endDate" value="2026-10-31" oninput="up()"></div>
        </div>
        <div class="form-row" style="margin-bottom:14px">
          <div class="fg"><label class="fl">Total Duration</label><input class="fi" type="text" id="duration" value="4 Months" oninput="up()"></div>
          <div class="fg"><label class="fl">Engagement Model</label><select class="fs" id="engModel" onchange="up()"><option>Fixed Price Project</option><option>Time & Material</option><option>Monthly Retainer</option><option>Agile Sprints</option></select></div>
        </div>
        <label class="fl" style="display:block;margin-bottom:10px">Milestone Plan</label>
        <div id="msList">
          <div class="ms-item"><div class="ms-left"><div class="ms-dot done">1</div><div class="ms-line"></div></div><div class="ms-body"><div class="ms-row"><input type="text" class="ms-inp" value="Kickoff & Discovery" oninput="up()"><input type="date" class="ms-date" value="2026-07-07" oninput="up()"><button class="icon-del" onclick="removeMilestone(this)"><i class="ti ti-trash"></i></button></div><input type="text" class="ms-desc" value="Requirements gathering, stakeholder interviews, tech stack decision" placeholder="Description…" oninput="up()"></div></div>
          <div class="ms-item"><div class="ms-left"><div class="ms-dot">2</div><div class="ms-line"></div></div><div class="ms-body"><div class="ms-row"><input type="text" class="ms-inp" value="UI/UX Design Phase" oninput="up()"><input type="date" class="ms-date" value="2026-07-28" oninput="up()"><button class="icon-del" onclick="removeMilestone(this)"><i class="ti ti-trash"></i></button></div><input type="text" class="ms-desc" value="Wireframes, high-fidelity mockups, design system, client review" placeholder="Description…" oninput="up()"></div></div>
          <div class="ms-item"><div class="ms-left"><div class="ms-dot">3</div><div class="ms-line"></div></div><div class="ms-body"><div class="ms-row"><input type="text" class="ms-inp" value="Development Sprint" oninput="up()"><input type="date" class="ms-date" value="2026-09-15" oninput="up()"><button class="icon-del" onclick="removeMilestone(this)"><i class="ti ti-trash"></i></button></div><input type="text" class="ms-desc" value="Frontend, backend, CMS integration, API connections" placeholder="Description…" oninput="up()"></div></div>
          <div class="ms-item"><div class="ms-left"><div class="ms-dot">4</div><div class="ms-line"></div></div><div class="ms-body"><div class="ms-row"><input type="text" class="ms-inp" value="Testing & QA" oninput="up()"><input type="date" class="ms-date" value="2026-10-15" oninput="up()"><button class="icon-del" onclick="removeMilestone(this)"><i class="ti ti-trash"></i></button></div><input type="text" class="ms-desc" value="Cross-browser testing, UAT, bug fixes, performance optimisation" placeholder="Description…" oninput="up()"></div></div>
          <div class="ms-item"><div class="ms-left"><div class="ms-dot">5</div></div><div class="ms-body"><div class="ms-row"><input type="text" class="ms-inp" value="Launch & Handover" oninput="up()"><input type="date" class="ms-date" value="2026-10-31" oninput="up()"><button class="icon-del" onclick="removeMilestone(this)"><i class="ti ti-trash"></i></button></div><input type="text" class="ms-desc" value="Deployment, training, documentation, 3-month support begins" placeholder="Description…" oninput="up()"></div></div>
        </div>
        <button class="add-btn" onclick="addMilestone()"><i class="ti ti-plus" style="font-size:13px"></i>Add Milestone</button>
      </div>
    </div>

    <div class="card optional-card active-card" id="sec-team">
      <div class="card-header"><div class="card-icon" style="background:var(--green-bg);color:var(--green)"><i class="ti ti-users"></i></div><div class="card-title">Our Team <span class="opt-badge">Optional</span></div><div class="card-actions"><button onclick="addTeamMember()" class="add-btn" style="width:auto;margin:0;padding:4px 9px;font-size:10px"><i class="ti ti-user-plus" style="font-size:11px"></i>Add</button></div></div>
      <div class="card-body">
        <div id="teamList">
          <div class="team-card"><div class="tc-av" style="background:linear-gradient(135deg,var(--teal),var(--teal4))">P</div><div style="flex:1;min-width:0"><div class="tc-name">Prabhu R</div><div class="tc-role">Lead Developer & Project Manager</div><div class="tc-exp">8+ years · Web & Mobile</div><div class="tc-skills"><span class="tc-skill">React.js</span><span class="tc-skill">Node.js</span></div></div><i class="ti ti-x tc-del" onclick="this.closest('.team-card').remove();updateTeamPreview()"></i></div>
          <div class="team-card"><div class="tc-av" style="background:linear-gradient(135deg,var(--purple),#4E35B0)">AN</div><div style="flex:1;min-width:0"><div class="tc-name">Anitha N</div><div class="tc-role">Senior UI/UX Designer</div><div class="tc-exp">5+ years · SaaS & Corporate</div><div class="tc-skills"><span class="tc-skill">Figma</span><span class="tc-skill">Prototyping</span></div></div><i class="ti ti-x tc-del" onclick="this.closest('.team-card').remove();updateTeamPreview()"></i></div>
        </div>
      </div>
    </div>

    <div class="card optional-card active-card" id="sec-value">
      <div class="card-header"><div class="card-icon" style="background:var(--amber-bg);color:var(--amber)"><i class="ti ti-trending-up"></i></div><div class="card-title">Value Proposition & ROI <span class="opt-badge">Optional</span></div><div class="card-actions"><button onclick="addValue()" class="add-btn" style="width:auto;margin:0;padding:4px 9px;font-size:10px"><i class="ti ti-plus" style="font-size:11px"></i>Add</button></div></div>
      <div class="card-body">
        <div id="valueList">
          <div class="dv-item"><div class="dv-icon" style="background:var(--amber-bg);color:var(--amber)"><i class="ti ti-trending-up"></i></div><input type="text" class="dv-input" value="300% increase in organic traffic within 6 months" oninput="up()"><i class="ti ti-x dv-del" onclick="this.parentElement.remove();up()"></i></div>
          <div class="dv-item"><div class="dv-icon" style="background:var(--green-bg);color:var(--green)"><i class="ti ti-users"></i></div><input type="text" class="dv-input" value="2x lead generation with improved UX & CTAs" oninput="up()"><i class="ti ti-x dv-del" onclick="this.parentElement.remove();up()"></i></div>
        </div>
      </div>
    </div>

    <div class="card optional-card" id="sec-casestudies" style="display:none">
      <div class="card-header"><div class="card-icon" style="background:var(--green-bg);color:var(--green)"><i class="ti ti-trophy"></i></div><div class="card-title">Past Work & Case Studies <span class="opt-badge">Optional</span></div><div class="card-actions"><button onclick="addCaseStudy()" class="add-btn" style="width:auto;margin:0;padding:4px 9px;font-size:10px"><i class="ti ti-plus" style="font-size:11px"></i>Add</button></div></div>
      <div class="card-body"><div id="csList"></div></div>
    </div>

    <div class="card optional-card" id="sec-testimonials" style="display:none">
      <div class="card-header"><div class="card-icon" style="background:var(--purple-bg);color:var(--purple)"><i class="ti ti-quote"></i></div><div class="card-title">Client Testimonials <span class="opt-badge">Optional</span></div><div class="card-actions"><button onclick="addTestimonial()" class="add-btn" style="width:auto;margin:0;padding:4px 9px;font-size:10px"><i class="ti ti-plus" style="font-size:11px"></i>Add</button></div></div>
      <div class="card-body"><div id="tmList"></div></div>
    </div>

    <div class="card optional-card active-card" id="sec-risks">
      <div class="card-header"><div class="card-icon" style="background:var(--red-bg);color:var(--red)"><i class="ti ti-shield-exclamation"></i></div><div class="card-title">Risks & Mitigation <span class="opt-badge">Optional</span></div><div class="card-actions"><button onclick="addRisk()" class="add-btn" style="width:auto;margin:0;padding:4px 9px;font-size:10px"><i class="ti ti-plus" style="font-size:11px"></i>Add</button></div></div>
      <div class="card-body">
        <div class="risk-row-g hdr" style="margin-bottom:6px"><div>Risk</div><div>Level</div><div>Mitigation</div><div></div></div>
        <div id="riskList">
          <div class="risk-row-g"><input type="text" class="pr-inp" value="Scope creep beyond deliverables"><select class="pr-inp" style="padding:7px 8px;font-size:11px"><option>High</option><option selected>Medium</option><option>Low</option></select><input type="text" class="pr-inp" value="Formal change request process"><button class="pr-del" onclick="this.closest('.risk-row-g').remove()"><i class="ti ti-trash"></i></button></div>
          <div class="risk-row-g"><input type="text" class="pr-inp" value="Delayed feedback from client"><select class="pr-inp" style="padding:7px 8px;font-size:11px"><option>High</option><option selected>Medium</option><option>Low</option></select><input type="text" class="pr-inp" value="48-hour SLA for feedback"><button class="pr-del" onclick="this.closest('.risk-row-g').remove()"><i class="ti ti-trash"></i></button></div>
        </div>
      </div>
    </div>

    <div class="card optional-card" id="sec-faq" style="display:none">
      <div class="card-header"><div class="card-icon" style="background:var(--blue-bg);color:var(--blue)"><i class="ti ti-help-circle"></i></div><div class="card-title">FAQ <span class="opt-badge">Optional</span></div><div class="card-actions"><button onclick="addFaq()" class="add-btn" style="width:auto;margin:0;padding:4px 9px;font-size:10px"><i class="ti ti-plus" style="font-size:11px"></i>Add</button></div></div>
      <div class="card-body"><div id="faqList"></div></div>
    </div>

    <div class="card optional-card" id="sec-whyus" style="display:none">
      <div class="card-header"><div class="card-icon" style="background:var(--amber-bg);color:var(--amber)"><i class="ti ti-medal"></i></div><div class="card-title">Why Choose Us? <span class="opt-badge">Optional</span></div></div>
      <div class="card-body"><div id="whyList"><div class="dv-item"><div class="dv-icon" style="background:var(--amber-bg);color:var(--amber)"><i class="ti ti-star"></i></div><input type="text" class="dv-input" value="8+ years delivering enterprise-grade products"><i class="ti ti-x dv-del" onclick="this.parentElement.remove()"></i></div></div><button class="add-btn" onclick="addWhyUs()"><i class="ti ti-plus" style="font-size:13px"></i>Add Point</button></div>
    </div>

    <div class="card" id="sec-pricing">
      <div class="card-header"><div class="card-icon" style="background:var(--green-bg);color:var(--green)"><i class="ti ti-currency-rupee"></i></div><div class="card-title">Investment & Pricing</div></div>
      <div class="card-body">
        <div class="risk-row-g hdr" style="margin-bottom:6px;grid-template-columns:1fr 90px 24px"><div>Service / Item</div><div>Amount (₹)</div><div></div></div>
        <div id="pricingList">
          <div class="pricing-row"><input type="text" class="pr-inp" value="UI/UX Design" oninput="calcTotal()"><input type="number" class="pr-inp" value="18000" style="text-align:right" oninput="calcTotal()"><button class="pr-del" onclick="this.closest('.pricing-row').remove();calcTotal()"><i class="ti ti-trash"></i></button></div>
          <div class="pricing-row"><input type="text" class="pr-inp" value="Frontend Development" oninput="calcTotal()"><input type="number" class="pr-inp" value="30000" style="text-align:right" oninput="calcTotal()"><button class="pr-del" onclick="this.closest('.pricing-row').remove();calcTotal()"><i class="ti ti-trash"></i></button></div>
          <div class="pricing-row"><input type="text" class="pr-inp" value="Backend & CMS" oninput="calcTotal()"><input type="number" class="pr-inp" value="20000" style="text-align:right" oninput="calcTotal()"><button class="pr-del" onclick="this.closest('.pricing-row').remove();calcTotal()"><i class="ti ti-trash"></i></button></div>
          <div class="pricing-row"><input type="text" class="pr-inp" value="SEO & Analytics Setup" oninput="calcTotal()"><input type="number" class="pr-inp" value="8000" style="text-align:right" oninput="calcTotal()"><button class="pr-del" onclick="this.closest('.pricing-row').remove();calcTotal()"><i class="ti ti-trash"></i></button></div>
          <div class="pricing-row"><input type="text" class="pr-inp" value="Testing & QA" oninput="calcTotal()"><input type="number" class="pr-inp" value="7000" style="text-align:right" oninput="calcTotal()"><button class="pr-del" onclick="this.closest('.pricing-row').remove();calcTotal()"><i class="ti ti-trash"></i></button></div>
          <div class="pricing-row"><input type="text" class="pr-inp" value="Post-Launch Support (3 mo)" oninput="calcTotal()"><input type="number" class="pr-inp" value="12000" style="text-align:right" oninput="calcTotal()"><button class="pr-del" onclick="this.closest('.pricing-row').remove();calcTotal()"><i class="ti ti-trash"></i></button></div>
        </div>
        <button class="add-btn" onclick="addPricingRow()"><i class="ti ti-plus" style="font-size:13px"></i>Add Item</button>
        <div class="total-box">
          <div class="form-row" style="margin-bottom:8px">
            <div class="fg"><label class="fl" style="font-size:10px">GST %</label><input class="fi" type="number" id="gst" value="18" oninput="calcTotal()" style="padding:7px 10px;font-size:12px"></div>
            <div class="fg"><label class="fl" style="font-size:10px">Discount %</label><input class="fi" type="number" id="disc" value="0" oninput="calcTotal()" style="padding:7px 10px;font-size:12px"></div>
          </div>
          <div class="total-row"><span style="color:var(--text2);font-weight:600">Subtotal</span><span id="subtotal" style="font-weight:700;color:var(--text)">₹95,000</span></div>
          <div class="total-row"><span style="color:var(--amber);font-weight:600">GST (18%)</span><span id="taxAmt" style="font-weight:700;color:var(--amber)">₹17,100</span></div>
          <div class="total-row" id="discRow" style="display:none"><span style="color:var(--green);font-weight:600">Discount</span><span id="discAmt" style="font-weight:700;color:var(--green)">-₹0</span></div>
          <div class="grand-box" style="margin-top:8px"><span style="font-size:13px;font-weight:800;color:#fff">Total Investment</span><span id="grandTotal" style="font-size:16px;font-weight:900;color:#fff">₹1,12,100</span></div>
        </div>
        <div class="form-row" style="margin-top:12px">
          <div class="fg"><label class="fl">Payment Schedule</label><select class="fs" id="paySchedule" onchange="up()"><option>50% advance, 50% on delivery</option><option>33% start / 33% midpoint / 33% end</option><option>25% advance, 75% on delivery</option><option>100% advance</option><option>Monthly retainer</option></select></div>
          <div class="fg"><label class="fl">Pricing Model</label><select class="fs"><option>Fixed Price</option><option>Hourly Rate</option><option>Monthly Retainer</option></select></div>
        </div>
      </div>
    </div>

    <div class="card" id="sec-signoff">
      <div class="card-header"><div class="card-icon" style="background:var(--purple-bg);color:var(--purple)"><i class="ti ti-writing"></i></div><div class="card-title">Closing, Terms & Sign-off</div></div>
      <div class="card-body">
        <div class="fg"><label class="fl">Closing Statement</label><textarea class="ta" id="closing" oninput="up()">We are excited about the opportunity to work with you on this project.</textarea></div>
        <div class="fg"><label class="fl">Terms & Conditions</label><textarea class="ta" id="terms" style="min-height:90px">1. 50% advance payment required before project commencement.
2. All intellectual property transfers to the client upon full payment.
3. Additional work beyond agreed scope will be quoted separately.
4. Confidentiality of all shared information will be maintained.
5. This proposal is valid for 30 days from the date of issue.</textarea></div>
        <div class="form-row">
          <div class="fg"><label class="fl">Our Signature</label><div class="sig-box" id="ourSigBox" style="height:70px;cursor:pointer"><i class="ti ti-signature" style="font-size:22px;color:var(--text3)"></i><div style="font-size:11px;color:var(--text3);font-weight:600">Click to sign</div></div></div>
          <div class="fg"><label class="fl">Client Signature</label><div class="sig-box" style="border-color:var(--amber);background:var(--amber-bg);height:70px"><i class="ti ti-user-check" style="font-size:22px;color:var(--amber)"></i><div style="font-size:11px;color:var(--amber);font-weight:600">Awaiting client</div></div></div>
        </div>
        <div id="sigModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;align-items:center;justify-content:center;">
          <div style="background:#fff;border-radius:16px;padding:24px;width:480px;max-width:95vw;box-shadow:0 8px 40px rgba(0,0,0,0.18);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;"><div style="font-size:13px;font-weight:800;color:#0f1c2e">AUTHORISED SIGNATURE</div><button id="sigModalClose" style="background:none;border:none;font-size:20px;cursor:pointer;color:#607D86;">✕</button></div>
            <div style="display:flex;border-bottom:2px solid #e5e7eb;margin-bottom:14px;"><button id="sigTab-draw" style="padding:6px 14px 8px;border:none;background:none;font-size:12px;font-weight:800;color:var(--teal);border-bottom:2px solid var(--teal);cursor:pointer;margin-bottom:-2px;">Draw</button><button id="sigTab-type" style="padding:6px 14px 8px;border:none;background:none;font-size:12px;font-weight:800;color:#607D86;border-bottom:2px solid transparent;cursor:pointer;margin-bottom:-2px;">Type</button><button id="sigTab-upload" style="padding:6px 14px 8px;border:none;background:none;font-size:12px;font-weight:800;color:#607D86;border-bottom:2px solid transparent;cursor:pointer;margin-bottom:-2px;">Upload</button></div>
            <div id="sigContent-draw"><div style="background:#F5FAFA;border:1.5px solid #E0EEF0;border-radius:10px;padding:10px;"><canvas id="sigCanvas" width="420" height="160" style="border:1.5px dashed #C5DDE0;border-radius:8px;background:#fff;cursor:crosshair;width:100%;height:160px;display:block;touch-action:none;"></canvas></div><div style="display:flex;gap:10px;margin-top:10px;"><button id="sigClearBtn" style="padding:6px 14px;font-size:11px;background:#fff;border:1.5px solid #e5e7eb;border-radius:6px;cursor:pointer;font-weight:700;color:#374151;">Clear</button><button id="sigApplyDrawBtn" style="padding:6px 14px;font-size:11px;background:var(--teal);color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:800;">Apply Signature</button></div></div>
            <div id="sigContent-type" style="display:none;"><div style="display:flex;gap:8px;align-items:center;"><input id="typedSigInput" type="text" placeholder="Type your name..." style="flex:1;padding:10px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:18px;font-family:'Dancing Script',cursive;font-weight:bold;color:#1a2e35;outline:none;" /><button id="sigApplyTypeBtn" style="padding:10px 14px;background:var(--teal);border:none;border-radius:10px;color:#fff;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;">Apply</button></div><div id="typedSigPreview" style="margin-top:10px;font-size:11px;color:#64748b;display:none;">Preview: <span id="typedSigPreviewText" style="font-family:'Dancing Script',cursive;font-size:22px;color:#1a2e35;font-weight:bold;"></span></div></div>
            <div id="sigContent-upload" style="display:none;"><div style="background:#F5FAFA;border:1.5px dashed #C5DDE0;border-radius:10px;padding:24px;text-align:center;cursor:pointer;position:relative;"><input id="sigUploadInput" type="file" accept="image/*" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;" /><i class="ti ti-upload" style="font-size:24px;color:#607D86;"></i><div style="font-size:12px;font-weight:700;color:#607D86;margin-top:4px;">Click to upload signature image</div></div></div>
          </div>
        </div>
      </div>
    </div>

  </div><!-- /form-panel -->

  <!-- ══ RIGHT: LIVE PREVIEW ══ -->
  <div class="preview-panel">
    <div class="preview-toolbar">
      <div class="pt-title-label">Live Preview</div>
      <div class="pt-btns">
        <button class="pt-b"><i class="ti ti-download" style="font-size:11px"></i> PDF</button>
        <button class="pt-b"><i class="ti ti-share" style="font-size:11px"></i> Share</button>
      </div>
    </div>

    <div class="prop-doc" id="propDoc">
      <div class="p-cover">
        <div class="p-logo">YT</div>
        <div class="p-label">Project Proposal</div>
        <div class="p-title" id="pv-title">— Proposal Title —</div>
        <div class="p-subtitle" id="pv-sub">Prepared by YENCODE Technologies</div>
        <div class="p-meta">
          <div class="p-meta-i"><i class="ti ti-calendar" style="font-size:11px"></i><span id="pv-date">01 Jun 2026</span></div>
          <div class="p-meta-i"><i class="ti ti-tag" style="font-size:11px"></i><span id="pv-type">Web Development</span></div>
          <div class="p-meta-i"><i class="ti ti-clock" style="font-size:11px"></i><span id="pv-expiry">Expires 01 Jul 2026</span></div>
        </div>
        <div class="p-badge" id="pv-status">DRAFT</div>
      </div>
      <div class="ps" id="pv-sec-parties"><div class="ps-lbl"><i class="ti ti-building"></i>Parties</div><div class="party-grid"><div class="party-b"><div class="pb-lbl">Prepared By</div><div class="pb-name" id="pv-from">Prabhu R</div><div class="pb-detail" id="pv-from-d">YENCODE Technologies<br></div></div><div class="party-b"><div class="pb-lbl">Prepared For</div><div class="pb-name" id="pv-to" style="color:var(--text3)">— Client —</div><div class="pb-detail" id="pv-to-d"><span style="color:var(--text3)">Fill in client details</span></div></div></div></div>
      <div class="ps" id="pv-sec-summary"><div class="ps-lbl"><i class="ti ti-align-left"></i>Executive Summary</div><div class="exec-block problem"><div class="eb-lbl">Problem</div><div class="eb-text" id="pv-problem"><span style="color:var(--text3);font-style:italic">Describe the client's challenge…</span></div></div><div class="exec-block solution" style="margin-top:6px"><div class="eb-lbl">Solution</div><div class="eb-text" id="pv-solution"><span style="color:var(--text3);font-style:italic">Describe your proposed solution…</span></div></div><div class="exec-block whyus" style="margin-top:6px"><div class="eb-lbl">Expected Outcome</div><div class="eb-text" id="pv-outcome"><span style="color:var(--text3);font-style:italic">Describe expected results…</span></div></div></div>
      <div class="ps" id="pv-sec-deliverables"><div class="ps-lbl"><i class="ti ti-checklist"></i>Scope & Deliverables</div><div class="del-list" id="pv-del"><div class="del-item-p">Fully responsive website (8 pages)</div><div class="del-item-p">Custom UI/UX design + brand guide</div><div class="del-item-p">CMS for easy content management</div><div class="del-item-p">SEO optimisation + Google Analytics</div><div class="del-item-p">3-month post-launch support</div></div></div>
      <div class="ps" id="pv-sec-timeline"><div class="ps-lbl"><i class="ti ti-calendar-stats"></i>Project Timeline</div><div style="display:flex;gap:12px;margin-bottom:8px"><span style="font-size:10px;font-weight:700;color:var(--text2)">Start: <span id="pv-start" style="color:var(--teal)">01 Jul 2026</span></span><span style="font-size:10px;font-weight:700;color:var(--text2)">End: <span id="pv-end" style="color:var(--teal)">31 Oct 2026</span></span><span style="font-size:10px;font-weight:700;color:var(--text2)">Duration: <span id="pv-dur" style="color:var(--teal)">4 Months</span></span></div><div class="tl-p" id="pv-timeline"></div></div>
      <div class="ps" id="pv-sec-team"><div class="ps-lbl"><i class="ti ti-users"></i>Our Team</div><div class="team-p" id="pv-team"></div></div>
      <div class="ps" id="pv-sec-value"><div class="ps-lbl"><i class="ti ti-trending-up"></i>Value Proposition & ROI</div><div class="val-p" id="pv-value"></div></div>
      <div class="ps" id="pv-sec-cs" style="display:none"><div class="ps-lbl"><i class="ti ti-trophy"></i>Case Studies</div><div id="pv-cs"></div></div>
      <div class="ps" id="pv-sec-tm" style="display:none"><div class="ps-lbl"><i class="ti ti-quote"></i>Testimonials</div><div id="pv-tm"></div></div>
      <div class="ps" id="pv-sec-risks"><div class="ps-lbl"><i class="ti ti-shield-exclamation"></i>Risks & Mitigation</div><div class="risk-p" id="pv-risks"></div></div>
      <div class="ps" id="pv-sec-pricing"><div class="ps-lbl"><i class="ti ti-currency-rupee"></i>Investment</div><table class="pricing-tbl"><thead><tr><th>Service</th><th>Amount</th></tr></thead><tbody id="pv-pricing"></tbody></table><div class="pricing-grand" style="margin-top:7px"><span>Total Investment</span><span id="pv-grand">₹1,12,100</span></div><div style="margin-top:6px;font-size:10px;color:var(--text2);font-weight:600" id="pv-pay">Payment: 50% advance, 50% on delivery</div></div>
      <div class="ps"><div class="ps-lbl"><i class="ti ti-writing"></i>Closing</div><div id="pv-closing" style="font-size:10px;color:var(--text2);line-height:1.7">We are excited about the opportunity to work with you…</div></div>
      <div class="ps"><div class="ps-lbl"><i class="ti ti-signature"></i>Sign-off</div><div class="sop"><div class="sob"><div class="sob-line"></div><div class="sob-name" id="pv-sig1">Prabhu R</div><div class="sob-role">YENCODE Technologies</div></div><div class="sob"><div class="sob-line" style="background:var(--amber)"></div><div class="sob-name" id="pv-sig2" style="color:var(--text3)">— Client —</div><div class="sob-role" id="pv-sig2-role">Awaiting</div></div></div></div>
    </div>
  </div><!-- /preview-panel -->

</div><!-- /two-panel -->
` }} />
    </div>
  );
}
