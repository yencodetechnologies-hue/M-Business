
// ── SAFE RENDER WRAPPER ──
window._renderReady = false;
function safeRender() { if (window._renderReady) render(); }

// ── STATE ──
let docType = 'letterhead';
let color = ' var(--app-accent, var(--app-accent, #00BCD4))';
let font = 'Nunito, sans-serif';
let logoUrl = null;
let lhLayout = 'logo-left';
let _lbEditorContent = '';
let quoLayout = 'classic';
let propLayout = 'gradient-cover';
let invLayout = 'classic';

// ── HELPERS ──
const v = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
const chk = id => { const e = document.getElementById(id); return e ? e.checked : false; };
const fmt = n => '₹' + Number(n).toLocaleString('en-IN');
const fmtDate = s => { try { return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }); } catch { return s; } };
const h2r = (hex, a) => { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return `rgba(${r},${g},${b},${a})`; };

function setV(id, val, suffix = '') { const e = document.getElementById(id); if (e) e.textContent = val + suffix; }

// ── TABS ──
function switchDoc(btn, type) {
  document.querySelectorAll('.dt').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  docType = type;
  document.getElementById('ctrl-lh').style.display = type === 'lh' ? '' : 'none';
  document.getElementById('ctrl-quo').style.display = type === 'quo' ? '' : 'none';
  document.getElementById('ctrl-prop').style.display = type === 'prop' ? '' : 'none';
  document.getElementById('ctrl-inv').style.display = type === 'inv' ? '' : 'none';
  document.getElementById('editorToolbar').style.display = type === 'lh' ? 'flex' : 'none';
  const titles = { lh: 'Letterhead Preview', quo: 'Quotation Preview', prop: 'Proposal Preview', inv: 'Invoice Preview' };
  document.getElementById('prevTitle').textContent = titles[type];
  render();
}

// ── ACCORDION ──
function toggleAcc(hdr) {
  const body = hdr.nextElementSibling;
  const icon = hdr.querySelector('.acc-arrow');
  if (!body) return;
  const open = body.classList.contains('open');
  body.classList.toggle('open', !open);
  if (icon) icon.classList.toggle('open', !open);
}

// ── LAYOUT SELECT ──
function selLayout(el, type, name) {
  const grid = el.closest('.layout-grid');
  grid.querySelectorAll('.lo').forEach(o => o.classList.remove('sel'));
  el.classList.add('sel');
  if (type === 'lh') lhLayout = name;
  else if (type === 'quo') quoLayout = name;
  else if (type === 'prop') propLayout = name;
  else if (type === 'inv') invLayout = name;
  render();
}

// ── COLOR & FONT ──
function pickColor(el) {
  document.querySelectorAll('.csw').forEach(s => s.classList.remove('sel'));
  el.classList.add('sel');
  color = el.dataset.c;
  document.getElementById('cpicker').value = color;
  document.getElementById('colorHex').value = color;
  document.documentElement.style.setProperty('--lh-color', color);
  render();
}
function setCustomColor(v) {
  if (/^#[0-9a-fA-F]{6}$/.test(v)) {
    color = v;
    document.getElementById('cpicker').value = v;
    document.getElementById('colorHex').value = v;
    document.documentElement.style.setProperty('--lh-color', color);
    render();
  }
}
function pickFont(el, f) {
  document.querySelectorAll('.fo').forEach(fo => fo.classList.remove('sel'));
  el.classList.add('sel');
  font = f;
  document.getElementById('mainPaper').style.fontFamily = f;
}

// ── LOGO ──
function handleLogo(input) {
  if (!input.files[0]) return;
  const r = new FileReader();
  r.onload = e => {
    logoUrl = e.target.result;
    const img = document.getElementById('logoImg');
    img.src = logoUrl;
    document.getElementById('logoZone').classList.add('has-logo');
    render();
  };
  r.readAsDataURL(input.files[0]);
}
function removeLogo(e) {
  e.stopPropagation();
  logoUrl = null;
  document.getElementById('logoImg').src = '';
  document.getElementById('logoZone').classList.remove('has-logo');
  document.getElementById('logoFile').value = '';
  render();
}

// ── LOGO ELEMENT ──
function makeLogoEl(size) {
  const s = size || parseInt(v('logoSz')) || 52;
  if (logoUrl) return `<img src="${logoUrl}" style="height:${s}px;max-width:${s * 3}px;object-fit:contain;display:block" alt="Logo">`;
  const init = v('f-init') || 'YT';
  const bSize = Math.round(s * 0.7);
  return `<div style="width:${bSize}px;height:${bSize}px;border-radius:${Math.round(bSize * .15)}px;background:${color};display:flex;align-items:center;justify-content:center;font-size:${Math.round(bSize * .28)}px;font-weight:900;color:#fff;flex-shrink:0">${init}</div>`;
}

// ── CONTACT BLOCK ──
function contactBlock(textColor) {
  const lines = [];
  if (v('f-addr')) lines.push(v('f-addr'));
  if (v('f-phone')) lines.push(`<b>T:</b> ${v('f-phone')}`);
  if (v('f-email')) lines.push(`<b>E:</b> ${v('f-email')}`);
  if (v('f-web')) lines.push(v('f-web'));
  if (v('f-gst')) lines.push(`GST: ${v('f-gst')}`);
  return `<div style="font-size:10px;color:${textColor};line-height:1.9">${lines.join('<br>')}</div>`;
}

// ── BG CONFIG ──
function bgCfg(bgKey) {
  const map = {
    white: { bg: '#ffffff', text: '#1A2E35', sub: '#607D86' },
    color: { bg: color, text: '#ffffff', sub: 'rgba(255,255,255,.7)' },
    light: { bg: h2r(color, .08), text: '#1A2E35', sub: '#607D86' },
    dark: { bg: '#1A2E35', text: '#ffffff', sub: 'rgba(255,255,255,.65)' }
  };
  return map[bgKey] || map.white;
}

// ── DIVIDER ──
function dividerEl(style) {
  if (style === 'solid') return `<div style="height:2px;background:${color}"></div>`;
  if (style === 'thick') return `<div style="height:5px;background:${color}"></div>`;
  if (style === 'gradient') return `<div style="height:3px;background:linear-gradient(90deg,${color},transparent)"></div>`;
  if (style === 'double') return `<div style="height:2px;background:${color}"></div><div style="height:1px;background:${h2r(color, .3)};margin-top:2px"></div>`;
  return '';
}

// ══════════════ RENDER ══════════════
function render() {
  if (docType === 'lh') renderLH();
  else if (docType === 'quo') renderQuo();
  else if (docType === 'inv') renderInv();
  else renderProp();
}

// ── LETTERHEAD ──
function renderLH() {
  const co = v('f-company') || 'Your Company';
  const tl = v('f-tagline');
  const pad = parseInt(document.getElementById('hdrPad').value) || 24;
  const nameSz = parseInt(document.getElementById('nameSz').value) || 16;
  const hdrBg = v('f-hdr-bg') || 'white';
  const divStyle = v('f-divider') || 'solid';
  const bg = bgCfg(hdrBg);
  const logo = makeLogoEl();
  const contact = contactBlock(bg.sub);
  const compHtml = `<div style="font-size:${nameSz}px;font-weight:900;color:${bg.text};line-height:1.2">${co}</div>${tl ? `<div style="font-size:10px;color:${bg.sub};margin-top:2px;font-weight:600">${tl}</div>` : ''}`;
  const div = dividerEl(divStyle);
  let hdr = '';

  if (lhLayout === 'logo-left') {
    hdr = `<div style="background:${bg.bg};padding:${pad}px ${pad + 14}px"><div style="display:flex;align-items:center;justify-content:space-between;gap:14px"><div style="display:flex;align-items:center;gap:12px">${logo}<div>${compHtml}</div></div>${contact}</div></div>${div}`;
  } else if (lhLayout === 'logo-right') {
    hdr = `<div style="background:${bg.bg};padding:${pad}px ${pad + 14}px"><div style="display:flex;align-items:center;justify-content:space-between;gap:14px">${contact}<div style="display:flex;align-items:center;gap:12px;flex-direction:row-reverse">${logo}<div style="text-align:right">${compHtml}</div></div></div></div>${div}`;
  } else if (lhLayout === 'centered') {
    hdr = `<div style="background:${bg.bg};padding:${pad}px ${pad + 14}px;text-align:center"><div style="margin-bottom:10px;display:flex;justify-content:center">${logo}</div>${compHtml}<div style="margin-top:6px">${contactBlock(bg.sub)}</div></div>${div}`;
  } else if (lhLayout === 'banner') {
    const bBg = bgCfg('color');
    hdr = `<div style="background:${color};padding:${pad}px ${pad + 14}px;display:flex;align-items:center;justify-content:space-between;gap:14px"><div style="display:flex;align-items:center;gap:12px">${logo}<div style="font-size:${nameSz}px;font-weight:900;color:#fff">${co}${tl ? `<div style="font-size:10px;color:rgba(255,255,255,.65);margin-top:1px;font-weight:600">${tl}</div>` : ''}</div></div>${contactBlock('rgba(255,255,255,.8)')}</div>`;
  } else if (lhLayout === 'split') {
    hdr = `<div style="display:flex;min-height:86px"><div style="background:${color};width:42%;padding:${Math.round(pad * .8)}px;display:flex;flex-direction:column;justify-content:center">${logo}<div style="margin-top:8px;font-size:${nameSz}px;font-weight:900;color:#fff">${co}</div>${tl ? `<div style="font-size:10px;color:rgba(255,255,255,.65);margin-top:2px">${tl}</div>` : ''}</div><div style="flex:1;padding:${Math.round(pad * .8)}px;background:#F8FAFB;display:flex;flex-direction:column;justify-content:center">${contactBlock('#607D86')}</div></div>${div}`;
  } else if (lhLayout === 'top-bar') {
    hdr = `<div style="height:5px;background:${color}"></div><div style="background:${bg.bg};padding:${Math.round(pad * .7)}px ${pad + 14}px"><div style="display:flex;align-items:center;justify-content:space-between;gap:14px"><div style="display:flex;align-items:center;gap:10px">${logo}<div>${compHtml}</div></div>${contact}</div></div><div style="height:1px;background:#E0EEF0"></div>`;
  }

  document.getElementById('docHeaderZone').innerHTML = hdr;
  renderLetter();

  const showFooter = chk('show-footer');
  document.getElementById('docFooterZone').innerHTML = showFooter
    ? `<div style="height:3px;background:${color}"></div><div style="padding:8px 40px;background:#F8FAFB;display:flex;justify-content:space-between;font-size:9px;color:#A0B8BE;border-top:1px solid #E0EEF0"><span style="font-weight:700">${co}</span><span>${v('f-web') || v('f-email')}</span><span>${v('f-phone')}</span></div>`
    : '';
}

function renderLetter() {
  const date = fmtDate(v('f-date'));
  const ref = v('f-ref');
  const sub = v('f-subject');
  const toName = v('f-to-name');
  const toCo = v('f-to-co');
  const salute = v('f-salute') || 'Dear Sir/Madam,';
  const closing = v('f-closing') || 'Yours sincerely,';
  const sig = v('f-sig') || 'Sign';
  const sigRole = v('f-sig-role') || '';

  const _prevEditor = document.getElementById('lbEditor');
  if (_prevEditor) _lbEditorContent = _prevEditor.innerHTML;
  document.getElementById('docBodyZone').innerHTML = `
    ${date ? `<div class="lb-date">${date}</div>` : ''}
    ${toName || toCo ? `<div class="lb-recip" style="display:block;margin-bottom:14px">${toName ? `<div class="lb-recip-name">${toName}</div>` : ''}${toCo ? `<div class="lb-recip-sub">${toCo}</div>` : ''}</div>` : ''}
    ${ref ? `<div class="lb-ref" style="display:block">Ref: ${ref}</div>` : ''}
    ${sub ? `<div class="lb-subj" style="display:block"><div class="lb-subj-lbl">Subject:</div><div class="lb-subj-val">${sub}</div></div>` : ''}
    <div class="lb-salute">${salute}</div>
    <div class="lb-editor" id="lbEditor" contenteditable="true" data-ph="Start typing your letter here… Use the toolbar above to format." oninput="wcUpdate()" style="font-family:${font}"></div>
    <div class="lb-closing">
      <div class="lb-close-text">${closing}</div>
      <div class="lb-sig-line" style="background:${color}"></div>
      <div class="lb-sig-name">${sig}</div>
      ${sigRole ? `<div class="lb-sig-role">${sigRole}</div>` : ''}
      <div class="lb-sig-dept">${v('f-company') || 'Your Company'}</div>
    </div>`;
  const _newEditor = document.getElementById('lbEditor');
  if (_newEditor && _lbEditorContent) _newEditor.innerHTML = _lbEditorContent;
  wcUpdate();
}

// ── QUOTATION ──
function calcQuo() {
  const rows = document.querySelectorAll('#quoItems .dyn-item');
  let sub = 0;
  let rowHtml = '';
  rows.forEach((r, i) => {
    const inps = r.querySelectorAll('input');
    if (inps.length >= 2) {
      const n = inps[0].value || 'Item', val = parseFloat(inps[1].value) || 0;
      sub += val;
      rowHtml += `<tr><td>${i + 1}</td><td>${n}</td><td style="text-align:right">${fmt(val)}</td></tr>`;
    }
  });
  const gst = parseFloat(v('f-quo-gst')) || 0;
  const disc = parseFloat(v('f-quo-disc')) || 0;
  const discount = sub * disc / 100;
  const tax = sub * gst / 100;
  const grand = sub - discount + tax;
  document.getElementById('quoItemRows').innerHTML = rowHtml;
  document.getElementById('quoSub').textContent = fmt(sub);
  document.getElementById('quoTax').textContent = fmt(tax);
  document.getElementById('quoGrand').textContent = fmt(grand);
  if (discount > 0) { document.getElementById('quoDiscRow').style.display = 'flex'; document.getElementById('quoDisc').textContent = '-' + fmt(discount); }
  else document.getElementById('quoDiscRow').style.display = 'none';
}

function renderQuo() {
  const co = v('f-company') || 'Your Company';
  const nameSz = parseInt(document.getElementById('nameSz').value) || 16;
  const hdrBg = v('f-quo-hdr-bg') || 'white';
  const bg = bgCfg(hdrBg);
  const logo = makeLogoEl();
  const pad = 22;

  // Tags from the scope tag section
  const tagEls = document.querySelectorAll('#quoScopeTags span');
  let tagsHtml = '';
  tagEls.forEach(t => { tagsHtml += `<span style="padding:2px 9px;background:${h2r(color, .15)};border-radius:20px;font-size:10px;font-weight:700;color:${color};margin-right:4px">${t.textContent.replace(' ✕', '')}</span>`; });

  let hdrHtml = '';
  if (quoLayout === 'classic') {
    hdrHtml = `<div style="background:${bg.bg};padding:${pad}px ${pad + 16}px"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px"><div style="display:flex;align-items:center;gap:12px">${logo}<div><div style="font-size:${nameSz}px;font-weight:900;color:${bg.text}">${co}</div>${v('f-tagline') ? `<div style="font-size:10px;color:${bg.sub}">${v('f-tagline')}</div>` : ''}</div></div><div style="text-align:right"><div style="font-size:26px;font-weight:900;color:${color};letter-spacing:-.5px">QUOTATION</div><div style="font-size:11px;font-weight:700;color:${bg.text}">#${v('f-quo-num')}</div><div style="font-size:10px;color:${bg.sub}">${fmtDate(v('f-quo-date'))}</div></div></div></div><div style="height:3px;background:${color}"></div>`;
  } else if (quoLayout === 'modern') {
    hdrHtml = `<div style="background:${color};padding:${pad}px ${pad + 16}px;display:flex;justify-content:space-between;align-items:center;gap:14px"><div style="display:flex;align-items:center;gap:12px">${logo}<div><div style="font-size:${nameSz}px;font-weight:900;color:#fff">${co}</div>${v('f-tagline') ? `<div style="font-size:10px;color:rgba(255,255,255,.65)">${v('f-tagline')}</div>` : ''}</div></div><div style="text-align:right"><div style="font-size:22px;font-weight:900;color:#fff;opacity:.9">QUOTATION</div><div style="font-size:11px;color:rgba(255,255,255,.75)">#${v('f-quo-num')} · ${fmtDate(v('f-quo-date'))}</div></div></div>`;
  } else if (quoLayout === 'minimal') {
    hdrHtml = `<div style="height:4px;background:${color}"></div><div style="background:${bg.bg};padding:${pad}px ${pad + 16}px;display:flex;align-items:center;justify-content:space-between;gap:14px"><div style="display:flex;align-items:center;gap:10px">${logo}<div style="font-size:${nameSz}px;font-weight:900;color:${bg.text}">${co}</div></div><div style="text-align:right"><div style="font-size:20px;font-weight:900;color:${color}">QUOTATION</div><div style="font-size:10px;color:${bg.sub}">#${v('f-quo-num')}</div></div></div><div style="height:1px;background:#E0EEF0"></div>`;
  }

  document.getElementById('docHeaderZone').innerHTML = hdrHtml;

  const quoTitle = v('f-quo-title');
  const client = v('f-quo-client');
  const cemail = v('f-quo-cemail');
  const validDate = fmtDate(v('f-quo-valid'));

  document.getElementById('docBodyZone').innerHTML = `
    ${quoTitle ? `<div style="padding:10px 12px;background:${h2r(color, .06)};border-radius:8px;border-left:3px solid ${color};margin-bottom:14px"><div style="font-size:9px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.7px;margin-bottom:2px">Project</div><div style="font-size:14px;font-weight:800;color:#1A2E35">${quoTitle}</div></div>` : ''}
    <div class="quo-parties">
      <div class="qp-block"><div class="qp-lbl" style="color:${color}">Prepared By</div><div class="qp-name">${co}</div>${contactBlock('#607D86')}</div>
      <div class="qp-block"><div class="qp-lbl" style="color:${color}">Prepared For</div><div class="qp-name" ${!client ? 'style=\"color:#A0B8BE\"' : ''}>${client || '— Client Name —'}</div><div class="qp-detail">${cemail || ''}</div></div>
    </div>
    ${tagsHtml ? `<div style="margin-bottom:14px;padding:8px 12px;background:${h2r(color, .06)};border-radius:8px"><div style="font-size:9px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px">Scope of Work</div><div>${tagsHtml}</div></div>` : ''}
    <table class="quo-items-tbl">
      <thead><tr style="background:${color}"><th>#</th><th>Description</th><th>Amount</th></tr></thead>
      <tbody id="quoItemRows"></tbody>
    </table>
    <div class="quo-totals">
      <div class="quo-tot-row"><span style="color:#607D86">Subtotal</span><span id="quoSub" style="font-weight:700">₹0</span></div>
      <div class="quo-tot-row"><span style="color:${color}">GST</span><span id="quoTax" style="font-weight:700;color:${color}">₹0</span></div>
      <div class="quo-tot-row" id="quoDiscRow" style="display:none"><span style="color:#26C281">Discount</span><span id="quoDisc" style="color:#26C281;font-weight:700">-₹0</span></div>
      <div class="quo-grand" style="background:${color};margin-top:6px"><span style="font-size:11px;font-weight:800;color:#fff">Total Quoted</span><span id="quoGrand" style="font-size:13px;font-weight:900;color:#fff">₹0</span></div>
    </div>
    ${validDate ? `<div class="validity-banner" style="background:${h2r('#F5A623', .08)};border-color:#F5A623;color:#D97706;font-size:10px;font-weight:700">⏰ This quotation is valid until ${validDate}</div>` : ''}
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #E0EEF0;display:flex;justify-content:space-between;align-items:flex-end">
      <div style="font-size:10px;color:#A0B8BE;max-width:280px;line-height:1.6">Thank you for considering ${co}. For queries contact ${v('f-email') || 'us'}.</div>
      <div style="text-align:right"><div style="width:80px;height:1px;background:#A0B8BE;margin:0 0 4px auto"></div><div style="font-size:11px;font-weight:800">Sign</div><div style="font-size:9px;color:#A0B8BE">${co}</div></div>
    </div>`;
  document.getElementById('docFooterZone').innerHTML = '';
  setTimeout(() => calcQuo(), 10);
}

// ── PROPOSAL ──
function calcProp() {
  const rows = document.querySelectorAll('#propPricing .dyn-item');
  let sub = 0; let rowHtml = '';
  rows.forEach(r => {
    const inps = r.querySelectorAll('input');
    if (inps.length >= 2) { const n = inps[0].value || 'Item', val = parseFloat(inps[1].value) || 0; sub += val; rowHtml += `<tr><td>${n}</td><td>${fmt(val)}</td></tr>`; }
  });
  const gst = parseFloat(v('f-prop-gst')) || 0;
  const disc = parseFloat(v('f-prop-disc')) || 0;
  const discount = sub * disc / 100, tax = sub * gst / 100, grand = sub - discount + tax;
  const pr = document.getElementById('propPricingRows');
  const g = document.getElementById('propGrand');
  if (pr) pr.innerHTML = rowHtml;
  if (g) g.textContent = fmt(grand);
}

function renderProp() {
  const co = v('f-company') || 'Your Company';
  const title = v('f-prop-title') || '— Proposal Title —';
  const client = v('f-prop-client');
  const nameSz = parseInt(document.getElementById('nameSz').value) || 16;
  const logo = makeLogoEl(44);

  // COVER
  let coverHtml = '';
  if (propLayout === 'gradient-cover') {
    coverHtml = `<div style="background:linear-gradient(135deg,#003E4E 0%,#005F73 35%,${color} 100%);padding:28px 36px;position:relative;overflow:hidden">
      <div style="position:absolute;right:-40px;top:-40px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.06)"></div>
      ${logo}
      <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:1px;margin:14px 0 5px">Project Proposal</div>
      <div style="font-size:18px;font-weight:900;color:#fff;letter-spacing:-.3px;line-height:1.2">${title}</div>
      ${client ? `<div style="font-size:11px;color:rgba(255,255,255,.65);margin-top:5px">Prepared for ${client}</div>` : ''}
      <div style="display:flex;gap:14px;margin-top:14px">
        <div style="font-size:10px;color:rgba(255,255,255,.65);display:flex;align-items:center;gap:4px"><span style="font-weight:700">Date:</span> ${fmtDate(v('f-prop-date'))}</div>
        <div style="font-size:10px;color:rgba(255,255,255,.65);display:flex;align-items:center;gap:4px"><span style="font-weight:700">Type:</span> ${v('f-prop-type')}</div>
        ${v('f-prop-expiry') ? `<div style="font-size:10px;color:rgba(255,255,255,.65)"><span style="font-weight:700">Expiry:</span> ${fmtDate(v('f-prop-expiry'))}</div>` : ''}
      </div>
    </div>`;
  } else if (propLayout === 'clean-cover') {
    coverHtml = `<div style="height:5px;background:${color}"></div>
      <div style="padding:26px 36px;background:#fff">
        ${logo}
        <div style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:1px;margin:12px 0 4px">Project Proposal</div>
        <div style="font-size:18px;font-weight:900;color:#1A2E35;letter-spacing:-.3px">${title}</div>
        ${client ? `<div style="font-size:11px;color:#607D86;margin-top:4px">Prepared for ${client}</div>` : ''}
        <div style="font-size:10px;color:#A0B8BE;margin-top:10px">${fmtDate(v('f-prop-date'))} · ${v('f-prop-type')}</div>
      </div>`;
  } else if (propLayout === 'split-cover') {
    coverHtml = `<div style="display:flex;min-height:130px">
      <div style="background:${color};width:45%;padding:24px;display:flex;flex-direction:column;justify-content:space-between">
        ${logo}
        <div><div style="font-size:${nameSz}px;font-weight:900;color:#fff;line-height:1.2">${co}</div>${v('f-tagline') ? `<div style="font-size:10px;color:rgba(255,255,255,.65);margin-top:3px">${v('f-tagline')}</div>` : ''}</div>
      </div>
      <div style="flex:1;padding:24px;background:#F8FAFB;display:flex;flex-direction:column;justify-content:center">
        <div style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">Project Proposal</div>
        <div style="font-size:15px;font-weight:900;color:#1A2E35;line-height:1.3">${title}</div>
        ${client ? `<div style="font-size:11px;color:#607D86;margin-top:5px">For: ${client}</div>` : ''}
        <div style="margin-top:12px;padding:7px 11px;background:${color};border-radius:20px;display:inline-flex;align-items:center;gap:5px;width:fit-content"><span style="font-size:10px;font-weight:700;color:#fff">${v('f-prop-type')} · ${fmtDate(v('f-prop-date'))}</span></div>
      </div>
    </div>`;
  }

  document.getElementById('docHeaderZone').innerHTML = coverHtml;

  // DELIVERABLES
  const delEls = document.querySelectorAll('#propDels .dyn-item input[type=text]');
  let delHtml = '';
  delEls.forEach(d => { if (d.value) delHtml += `<div class="prop-del-item" style="color:${color};">${d.value}</div>`; });

  // MILESTONES
  const msEls = document.querySelectorAll('#propMs .fg');
  let msHtml = '';
  msEls.forEach((m, i) => {
    const inps = m.querySelectorAll('input');
    if (!inps[0] || !inps[0].value) return;
    const isLast = i === msEls.length - 1;
    msHtml += `<div class="tlp"><div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0"><div class="tlp-dot" style="background:${color}">${i + 1}</div>${!isLast ? `<div class="tlp-line" style="background:${h2r(color, .2)}"></div>` : ''}</div><div style="padding-top:1px"><div class="tlp-title">${inps[0].value}</div>${inps[1] && inps[1].value ? `<div class="tlp-date" style="color:${color}">${fmtDate(inps[1].value)}</div>` : ''}</div></div>`;
  });

  const prob = v('f-prop-prob'), sol = v('f-prop-sol');

  document.getElementById('docBodyZone').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div style="padding:10px 12px;background:#F8FAFB;border-radius:8px;border:1px solid #E0EEF0"><div style="font-size:8px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.7px;margin-bottom:3px">Prepared By</div><div style="font-size:12px;font-weight:800">${co}</div><div style="margin-top:2px">${contactBlock('#607D86')}</div></div>
      <div style="padding:10px 12px;background:#F8FAFB;border-radius:8px;border:1px solid #E0EEF0"><div style="font-size:8px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.7px;margin-bottom:3px">Prepared For</div><div style="font-size:12px;font-weight:800;${!client ? 'color:#A0B8BE' : ''}">${client || '— Client —'}</div></div>
    </div>
    ${prob || sol ? `<div style="margin-bottom:14px"><div style="font-size:9px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.7px;margin-bottom:7px">Executive Summary</div>${prob ? `<div style="padding:9px 11px;border-radius:8px;border-left:3px solid ${color};background:${h2r(color, .06)};margin-bottom:7px"><div style="font-size:8px;font-weight:700;color:${color};margin-bottom:2px">CHALLENGE</div><div style="font-size:10.5px;color:#607D86">${prob}</div></div>` : ''}${sol ? `<div style="padding:9px 11px;border-radius:8px;border-left:3px solid #26C281;background:#E8FAF3;margin-bottom:7px"><div style="font-size:8px;font-weight:700;color:#26C281;margin-bottom:2px">SOLUTION</div><div style="font-size:10.5px;color:#607D86">${sol}</div></div>` : ''}</div>` : ''}
    ${delHtml ? `<div style="margin-bottom:14px"><div style="font-size:9px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.7px;margin-bottom:7px">Scope & Deliverables</div><div class="prop-del-list">${delHtml}</div></div>` : ''}
    ${msHtml ? `<div style="margin-bottom:14px"><div style="font-size:9px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.7px;margin-bottom:7px">Project Timeline</div><div class="tl-preview">${msHtml}</div></div>` : ''}
    <div style="margin-bottom:14px"><div style="font-size:9px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.7px;margin-bottom:7px">Investment</div>
      <table class="pricing-tbl"><thead><tr style="background:${color}"><th>Service</th><th>Amount</th></tr></thead><tbody id="propPricingRows"></tbody></table>
      <div style="display:flex;justify-content:space-between;padding:7px 10px;background:${color};border-radius:7px;margin-top:6px"><span style="font-size:10.5px;font-weight:800;color:#fff">Total Investment</span><span id="propGrand" style="font-size:13px;font-weight:900;color:#fff">₹0</span></div>
    </div>
    <div style="padding-top:14px;border-top:1px solid #E0EEF0">
      <div class="signoff-grid">
        <div class="sob"><div class="sob-line" style="background:${color}"></div><div class="sob-name">Sign</div><div class="sob-role">${co}</div></div>
        <div class="sob"><div class="sob-line"></div><div class="sob-name" ${!client ? 'style=\"color:#A0B8BE\"' : ''}>${client || '— Client —'}</div><div class="sob-role">Authorised Signatory</div></div>
      </div>
    </div>`;
  document.getElementById('docFooterZone').innerHTML = '';
  setTimeout(() => calcProp(), 10);
}

// ── QUOTATION ITEMS ──
function addQI() {
  const c = document.getElementById('quoItems');
  const d = document.createElement('div');
  d.className = 'dyn-item';
  d.innerHTML = `<div class="di-icon"><i class="ti ti-check"></i></div><input type="text" class="di-input" placeholder="Item description" oninput="calcQuo()"><input type="number" class="di-input" value="0" style="width:70px;text-align:right" oninput="calcQuo()"><i class="ti ti-x di-del" onclick="removeQI(this)"></i>`;
  c.appendChild(d);
  d.querySelector('input').focus();
  calcQuo();
}
function removeQI(el) { el.closest('.dyn-item').remove(); calcQuo(); }

// ── SCOPE TAGS ──
function addTag() {
  const inp = document.getElementById('newTag');
  const val = inp.value.trim();
  if (!val) return;
  const c = document.getElementById('quoScopeTags');
  const s = document.createElement('span');
  s.style.cssText = `padding:3px 10px;background:var(--teal-light);border-radius:20px;font-size:11px;font-weight:700;color:var(--teal);cursor:pointer`;
  s.textContent = val + ' ✕';
  s.onclick = function () { this.remove(); render(); };
  c.appendChild(s);
  inp.value = '';
  render();
}

// ── PROPOSAL HELPERS ──
function addPropDel() {
  const c = document.getElementById('propDels');
  const d = document.createElement('div');
  d.className = 'dyn-item';
  d.innerHTML = `<div class="di-icon"><i class="ti ti-check"></i></div><input type="text" class="di-input" placeholder="Deliverable…" oninput="safeRender()"><i class="ti ti-x di-del" onclick="this.parentElement.remove();render()"></i>`;
  c.appendChild(d);
  d.querySelector('input').focus();
  render();
}
function addPropMs() {
  const c = document.getElementById('propMs');
  const d = document.createElement('div');
  d.className = 'fg';
  d.style.cssText = 'display:flex;gap:7px;align-items:center;margin-bottom:8px';
  d.innerHTML = `<input class="fi" style="flex:1" placeholder="Milestone title" oninput="safeRender()"><input class="fi" type="date" style="width:120px" oninput="safeRender()"><i class="ti ti-x" style="color:var(--text3);cursor:pointer;font-size:15px" onclick="this.closest('.fg').remove();render()"></i>`;
  c.appendChild(d);
  d.querySelector('input').focus();
  render();
}
function addPropPrice() {
  const c = document.getElementById('propPricing');
  const d = document.createElement('div');
  d.className = 'dyn-item';
  d.innerHTML = `<div class="di-icon"><i class="ti ti-tag"></i></div><input type="text" class="di-input" placeholder="Service…" oninput="calcProp()"><input type="number" class="di-input" value="0" style="width:70px;text-align:right" oninput="calcProp()"><i class="ti ti-x di-del" onclick="this.parentElement.remove();calcProp()"></i>`;
  c.appendChild(d);
  d.querySelector('input').focus();
  calcProp();
}

// ── EDITOR ──
function ec(cmd, val) {
  const ed = document.getElementById('lbEditor');
  if (!ed) return;
  ed.focus();
  try { document.execCommand(cmd, false, val || null); } catch (e) { }
  // Save content after formatting
  _lbEditorContent = ed.innerHTML;
}
function insertTable() {
  const t = `<table style="width:100%;border-collapse:collapse;font-size:12px;margin:12px 0"><thead><tr style="background:${color};color:#fff"><th style="padding:6px 9px;text-align:left">Item</th><th style="padding:6px 9px;text-align:left">Description</th><th style="padding:6px 9px;text-align:right">Amount</th></tr></thead><tbody><tr><td style="padding:6px 9px;border:1px solid #E0EEF0">1</td><td style="padding:6px 9px;border:1px solid #E0EEF0">—</td><td style="padding:6px 9px;border:1px solid #E0EEF0;text-align:right">—</td></tr></tbody></table>`;
  ec('insertHTML', t);
}
function wcUpdate() {
  const ed = document.getElementById('lbEditor');
  if (!ed) return;
  const w = (ed.innerText || '').trim().split(/\s+/).filter(x => x.length > 0).length;
  const lbl = document.getElementById('wcLabel');
  if (lbl) lbl.textContent = w + ' word' + (w !== 1 ? 's' : '');
}
function clearContent() {
  if (docType === 'lh') {
    const ed = document.getElementById('lbEditor');
    if (ed && confirm('Clear letter body?')) { ed.innerHTML = ''; wcUpdate(); }
  }
}

// ── SEND ──
function sendDoc() {
  const hash = window.location.hash.substring(1) || docType;
  const lhName = document.getElementById('lh-recipient-name') ? document.getElementById('lh-recipient-name').value : '';
  const modalName = document.getElementById('f-clientName') ? document.getElementById('f-clientName').value : '';
  const clientName = lhName || modalName || 'Client';
  const lhType = document.getElementById('lh-recipient-type') ? document.getElementById('lh-recipient-type').value : 'client';
  const sendTo = lhType || (document.getElementById('sendTo') ? document.getElementById('sendTo').value : 'client');
  const data = {
    docType: hash,
    sendTo: sendTo,
    htmlContent: document.getElementById('mainPaper').innerHTML,
    client: clientName,
  };

  if (hash === 'inv') {
    const grandEl = document.getElementById('invGrand');
    data.invoiceNo = document.getElementById('f-inv-num') ? document.getElementById('f-inv-num').value : '';
    data.amount = grandEl ? parseFloat(grandEl.textContent.replace(/[^0-9.-]+/g, "")) : 0;
  }

  // Closemodal
  closeSendModal();

  // Show toast
  const t = document.createElement('div');
  t.style.cssText = "position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#26C281, var(--app-accent, var(--app-accent, #00BCD4)));color:#fff;padding:14px 22px;border-radius:12px;font-weight:700;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.15);font-size:13px;display:flex;align-items:center;gap:8px;";
  t.innerHTML = '<i class="ti ti-circle-check" style="font-size:18px;"></i> Document sent to ' + clientName + '!';
  document.body.appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity 0.4s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 3000);

  // Send to React parent
  window.parent.postMessage({ type: 'SEND_DOCUMENT', payload: data }, '*');
}

// ── PRINT ──
function printDoc() {
  const paper = document.getElementById('mainPaper').innerHTML;
  const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Merriweather:wght@300;400;700&family=Playfair+Display:wght@400;700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">`;
  // Get the full document CSS for printing
  const allStyles = Array.from(document.styleSheets).map(ss => {
    try { return Array.from(ss.cssRules).map(r => r.cssText).join('\n'); }
    catch (e) { return ''; }
  }).join('\n');
  const printOverrides = `
    *{box-sizing:border-box}
    body{margin:0;padding:0;font-family:${font};background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .paper{width:100%;box-shadow:none;border-radius:0;margin:0;min-height:100vh}
    .doc-body{font-family:${font}}
    .lb-editor:empty::before{content:none}
    .lb-editor{min-height:0}
    @media print{@page{margin:0;size:A4}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  `;
  const css = allStyles + '\n' + printOverrides;
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">${fonts}<style>${css}</style></head><body><div class="paper">${paper}</div><script>window.onload=()=>{window.print()}<\/script></body></html>`);
  w.document.close();
}

// ── INVOICE CALC ──
function calcInv() {
  const rows = document.querySelectorAll('#invItems .dyn-item');
  let sub = 0, rowHtml = '';
  rows.forEach((r, i) => {
    const inps = r.querySelectorAll('input');
    if (inps.length >= 3) {
      const n = inps[0].value || 'Item';
      const qty = parseFloat(inps[1].value) || 1;
      const price = parseFloat(inps[2].value) || 0;
      const total = qty * price;
      sub += total;
      rowHtml += `<tr><td>${i + 1}</td><td>${n}</td><td style="text-align:center">${qty}</td><td style="text-align:right">${fmt(price)}</td><td style="text-align:right;font-weight:700">${fmt(total)}</td></tr>`;
    }
  });
  const gst = parseFloat(v('f-inv-gst')) || 0;
  const disc = parseFloat(v('f-inv-disc')) || 0;
  const discount = sub * disc / 100;
  const tax = sub * gst / 100;
  const grand = sub - discount + tax;
  const rowsEl = document.getElementById('invItemRows');
  const subEl = document.getElementById('invSub');
  const taxEl = document.getElementById('invTax');
  const grandEl = document.getElementById('invGrand');
  const discRow = document.getElementById('invDiscRow');
  const discEl = document.getElementById('invDisc');
  if (rowsEl) rowsEl.innerHTML = rowHtml;
  if (subEl) subEl.textContent = fmt(sub);
  if (taxEl) taxEl.textContent = fmt(tax);
  if (grandEl) grandEl.textContent = fmt(grand);
  if (discRow) discRow.style.display = discount > 0 ? 'flex' : 'none';
  if (discEl) discEl.textContent = '-' + fmt(discount);
}

// ── INVOICE RENDER ──
function renderInv() {
  const co = v('f-company') || 'Your Company';
  const nameSz = parseInt(document.getElementById('nameSz').value) || 16;
  const logo = makeLogoEl();
  const invNum = v('f-inv-num') || 'INV-2026-0001';
  const invDate = fmtDate(v('f-inv-date'));
  const dueDate = fmtDate(v('f-inv-due'));
  const status = v('f-inv-status') || 'draft';
  const client = v('f-inv-client');
  const cemail = v('f-inv-cemail');
  const cphone = v('f-inv-cphone');
  const cgst = v('f-inv-cgst');
  const caddr = v('f-inv-caddr');
  const cat = v('f-inv-cat');
  const bank = v('f-inv-bank');
  const acct = v('f-inv-acct');
  const ifsc = v('f-inv-ifsc');
  const upi = v('f-inv-upi');
  const notes = v('f-inv-notes');
  const terms = v('f-inv-terms');
  const pad = 22;

  // STATUS badge
  const statusMap = {
    draft: { bg: '#F8FAFB', color: '#A0B8BE', border: '#C5DDE0', text: 'DRAFT' },
    sent: { bg: '#EFF4FF', color: '#2563EB', border: '#BFDBFE', text: 'SENT' },
    paid: { bg: '#E8FAF3', color: '#26C281', border: '#A7F3D0', text: 'PAID' },
    overdue: { bg: '#FEF2F2', color: '#F05C5C', border: '#FECACA', text: 'OVERDUE' }
  };
  const st = statusMap[status] || statusMap.draft;
  const statusBadge = `<span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;background:${st.bg};color:${st.color};border:1.5px solid ${st.border}">${st.text}</span>`;

  // Company contact block
  const contactHtml = contactBlock('#607D86');

  // INVOICE title block
  const invTitleBlock = (titleColor, subColor) => `
    <div style="text-align:right">
      <div style="font-size:26px;font-weight:900;color:${titleColor};letter-spacing:-.5px;line-height:1">INVOICE</div>
      <div style="font-size:11px;font-weight:700;color:${subColor};margin-top:4px">#${invNum}</div>
      <div style="font-size:10px;color:${subColor};margin-top:2px;line-height:1.8">
        ${invDate ? 'Issue: ' + invDate : ''}${dueDate ? '<br>Due: ' + dueDate : ''}
      </div>
      <div style="margin-top:6px">${statusBadge}</div>
    </div>`;

  let hdr = '';

  if (invLayout === 'classic') {
    hdr = `<div style="padding:${pad}px ${pad + 16}px;background:#fff">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
        <div style="display:flex;align-items:center;gap:12px">${logo}<div>
          <div style="font-size:${nameSz}px;font-weight:900;color:#1A2E35">${co}</div>
          ${v('f-tagline') ? `<div style="font-size:10px;color:#A0B8BE">${v('f-tagline')}</div>` : ''}
        </div></div>
        ${invTitleBlock(color, '#607D86')}
      </div>
    </div><div style="height:3px;background:${color}"></div>`;

  } else if (invLayout === 'modern-banner') {
    hdr = `<div style="background:${color};padding:${pad}px ${pad + 16}px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
      <div style="display:flex;align-items:center;gap:12px">${logo}<div>
        <div style="font-size:${nameSz}px;font-weight:900;color:#fff">${co}</div>
        ${v('f-tagline') ? `<div style="font-size:10px;color:rgba(255,255,255,.65)">${v('f-tagline')}</div>` : ''}
      </div></div>
      <div style="text-align:right">
        <div style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-.5px">INVOICE</div>
        <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.8);margin-top:3px">#${invNum}</div>
        <div style="font-size:10px;color:rgba(255,255,255,.65);margin-top:2px;line-height:1.8">
          ${invDate ? 'Issue: ' + invDate : ''}${dueDate ? '<br>Due: ' + dueDate : ''}
        </div>
        <div style="margin-top:6px">${statusBadge}</div>
      </div>
    </div>`;

  } else if (invLayout === 'minimal') {
    hdr = `<div style="height:4px;background:${color}"></div>
    <div style="padding:${pad}px ${pad + 16}px;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:16px">
      <div style="display:flex;align-items:center;gap:10px">${logo}
        <div style="font-size:${nameSz}px;font-weight:900;color:#1A2E35">${co}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:20px;font-weight:900;color:${color};letter-spacing:-.4px">INVOICE</div>
        <div style="font-size:10px;color:#607D86;margin-top:2px">#${invNum} · ${invDate}</div>
        <div style="margin-top:4px">${statusBadge}</div>
      </div>
    </div><div style="height:1px;background:#E0EEF0"></div>`;

  } else if (invLayout === 'right-align') {
    hdr = `<div style="padding:${pad}px ${pad + 16}px;background:#fff;display:flex;align-items:stretch;gap:16px">
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">${logo}
          <div style="font-size:${nameSz}px;font-weight:900;color:#1A2E35">${co}</div>
        </div>
        ${contactHtml}
      </div>
      <div style="width:180px;flex-shrink:0;background:${h2r(color, .06)};border:1.5px solid ${h2r(color, .2)};border-radius:10px;padding:14px;display:flex;flex-direction:column;justify-content:center">
        <div style="font-size:18px;font-weight:900;color:${color};letter-spacing:-.3px">INVOICE</div>
        <div style="font-size:11px;font-weight:700;color:#1A2E35;margin-top:5px">#${invNum}</div>
        <div style="font-size:10px;color:#607D86;margin-top:3px;line-height:1.9">${invDate ? 'Issue: ' + invDate + '\n' : ''}${dueDate ? 'Due: ' + dueDate : ''}</div>
        <div style="margin-top:8px">${statusBadge}</div>
      </div>
    </div><div style="height:3px;background:${color}"></div>`;

  } else if (invLayout === 'centered') {
    hdr = `<div style="padding:${pad}px ${pad + 16}px;background:#fff;text-align:center">
      <div style="display:flex;justify-content:center;margin-bottom:10px">${logo}</div>
      <div style="font-size:${nameSz}px;font-weight:900;color:#1A2E35">${co}</div>
      ${v('f-tagline') ? `<div style="font-size:10px;color:#A0B8BE;margin-top:2px">${v('f-tagline')}</div>` : ''}
      <div style="font-size:24px;font-weight:900;color:${color};letter-spacing:-.4px;margin-top:10px">INVOICE</div>
      <div style="font-size:11px;color:#607D86;margin-top:3px">#${invNum} &nbsp;·&nbsp; ${invDate}${dueDate ? ' &nbsp;·&nbsp; Due: ' + dueDate : ''}</div>
      <div style="margin-top:8px;display:flex;justify-content:center">${statusBadge}</div>
    </div><div style="height:3px;background:${color}"></div>`;

  } else if (invLayout === 'dark-header') {
    hdr = `<div style="background:#1A2E35;padding:${pad}px ${pad + 16}px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
      <div style="display:flex;align-items:center;gap:12px">${logo}<div>
        <div style="font-size:${nameSz}px;font-weight:900;color:#fff">${co}</div>
        ${v('f-tagline') ? `<div style="font-size:10px;color:rgba(255,255,255,.5)">${v('f-tagline')}</div>` : ''}
      </div></div>
      <div style="text-align:right">
        <div style="font-size:24px;font-weight:900;color:${color};letter-spacing:-.4px">INVOICE</div>
        <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.7);margin-top:3px">#${invNum}</div>
        <div style="font-size:10px;color:rgba(255,255,255,.5);margin-top:2px;line-height:1.8">${invDate ? 'Issue: ' + invDate : ''}${dueDate ? '<br>Due: ' + dueDate : ''}</div>
        <div style="margin-top:6px">${statusBadge}</div>
      </div>
    </div>`;
  }

  document.getElementById('docHeaderZone').innerHTML = hdr;

  // BODY
  document.getElementById('docBodyZone').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">
      <div style="padding:10px 12px;background:#F8FAFB;border-radius:8px;border:1px solid #E0EEF0">
        <div style="font-size:8px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.7px;margin-bottom:4px">From</div>
        <div style="font-size:12px;font-weight:800;color:#1A2E35">${co}</div>
        <div style="margin-top:2px">${contactBlock('#607D86')}</div>
      </div>
      <div style="padding:10px 12px;background:#F8FAFB;border-radius:8px;border:1px solid #E0EEF0">
        <div style="font-size:8px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.7px;margin-bottom:4px">Bill To</div>
        <div style="font-size:12px;font-weight:800;color:${client ? '#1A2E35' : '#A0B8BE'}">${client || '— Client Name —'}</div>
        <div style="font-size:10px;color:#607D86;line-height:1.8;margin-top:2px">
          ${cgst ? 'GST: ' + cgst + '<br>' : ''}${cemail ? cemail + '<br>' : ''}${cphone ? cphone + '<br>' : ''}${caddr || ''}
        </div>
      </div>
    </div>

    ${cat ? `<div style="display:inline-flex;align-items:center;padding:4px 12px;background:${h2r(color, .1)};border-radius:20px;font-size:10px;font-weight:700;color:${color};margin-bottom:14px">${cat}</div>` : ''}

    <table style="width:100%;border-collapse:collapse;margin-bottom:14px">
      <thead><tr style="background:${color}">
        <th style="padding:7px 9px;font-size:10px;font-weight:700;color:#fff;text-align:left">#</th>
        <th style="padding:7px 9px;font-size:10px;font-weight:700;color:#fff;text-align:left">Description</th>
        <th style="padding:7px 9px;font-size:10px;font-weight:700;color:#fff;text-align:center">Qty</th>
        <th style="padding:7px 9px;font-size:10px;font-weight:700;color:#fff;text-align:right">Unit Price</th>
        <th style="padding:7px 9px;font-size:10px;font-weight:700;color:#fff;text-align:right">Total</th>
      </tr></thead>
      <tbody id="invItemRows"></tbody>
    </table>

    <div style="margin-left:auto;width:210px">
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:11px;border-bottom:1px solid #E0EEF0"><span style="color:#607D86">Subtotal</span><span id="invSub" style="font-weight:700">₹0</span></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:11px;border-bottom:1px solid #E0EEF0"><span style="color:${color}">GST (${v('f-inv-gst') || 0}%)</span><span id="invTax" style="font-weight:700;color:${color}">₹0</span></div>
      <div id="invDiscRow" style="display:none;justify-content:space-between;padding:4px 0;font-size:11px;border-bottom:1px solid #E0EEF0"><span style="color:#26C281">Discount</span><span id="invDisc" style="font-weight:700;color:#26C281">-₹0</span></div>
      <div style="display:flex;justify-content:space-between;padding:8px 10px;background:${color};border-radius:7px;margin-top:6px"><span style="font-size:11px;font-weight:800;color:#fff">Total Due</span><span id="invGrand" style="font-size:14px;font-weight:900;color:#fff">₹0</span></div>
    </div>

    ${(bank || acct || upi) ? `<div style="margin-top:16px;padding:10px 12px;background:${h2r(color, .06)};border-radius:8px;border-left:3px solid ${color}">
      <div style="font-size:9px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px">Payment Details</div>
      <div style="font-size:10px;color:#607D86;line-height:2">
        ${bank ? '<b>Bank:</b> ' + bank + '&nbsp;&nbsp;' : ''} ${acct ? '<b>A/C:</b> ' + acct : ''}${ifsc ? '&nbsp;&nbsp;<b>IFSC:</b> ' + ifsc : ''}<br>
        ${upi ? '<b>UPI:</b> ' + upi + '&nbsp;&nbsp;' : ''} ${terms ? '<b>Terms:</b> ' + terms : ''}
      </div>
    </div>` : ''}

    <div style="margin-top:16px;padding-top:14px;border-top:1px solid #E0EEF0;display:flex;justify-content:space-between;align-items:flex-end">
      <div style="font-size:10px;color:#A0B8BE;line-height:1.7;max-width:280px">
        ${notes || 'Thank you for your business!'}
      </div>
      <div style="text-align:right">
        <div style="width:80px;height:1.5px;background:${color};margin:0 0 4px auto"></div>
        <div style="font-size:11px;font-weight:800;color:#1A2E35">${v('f-sig') || 'Sign'}</div>
        <div style="font-size:9px;color:#A0B8BE">${co}</div>
      </div>
    </div>`;

  // FOOTER
  document.getElementById('docFooterZone').innerHTML = `
    <div style="height:3px;background:${color}"></div>
    <div style="padding:8px 40px;background:#F8FAFB;display:flex;justify-content:space-between;font-size:9px;color:#A0B8BE;border-top:1px solid #E0EEF0">
      <span style="font-weight:700">${co}</span>
      <span>${v('f-web') || v('f-email')}</span>
      <span>${v('f-phone')}</span>
    </div>`;

  setTimeout(() => calcInv(), 10);
}

function addInvItem() {
  const c = document.getElementById('invItems');
  const d = document.createElement('div');
  d.className = 'dyn-item';
  d.innerHTML = `<div class="di-icon"><i class="ti ti-tag"></i></div>
    <input type="text" class="di-input" placeholder="Item description" oninput="calcInv()">
    <input type="number" class="di-input" value="1" style="width:40px;text-align:center" min="1" title="Qty" oninput="calcInv()">
    <input type="number" class="di-input" value="0" style="width:68px;text-align:right" title="Price" oninput="calcInv()">
    <i class="ti ti-x di-del" onclick="this.parentElement.remove();calcInv()"></i>`;
  c.appendChild(d);
  d.querySelector('input').focus();
  calcInv();
}



// --- INTEGRATION: SAVE & THEME ---
window.addEventListener('message', (e) => {
  if (e.data?.type === 'SET_THEME' && e.data?.color) {
    const color = e.data.color;
    document.documentElement.style.setProperty('--teal', color);
    document.documentElement.style.setProperty('--lh-color', color);
    document.documentElement.style.setProperty('--teal2', color);
    document.documentElement.style.setProperty('--teal3', color);
    document.documentElement.style.setProperty('--teal4', color);
    // Force re-render to apply color to inline styles
    window.color = color;
    render();
  }
});

function saveDocumentToApp() {
  const hash = window.location.hash.substring(1) || 'inv';

  // Extract common data
  const data = {
    docType: hash,
    htmlContent: document.getElementById('lbPreview').innerHTML,
    client: document.getElementById('f-clientName') ? document.getElementById('f-clientName').value : 'Client',
  };

  if (hash === 'inv') {
    data.invoiceNo = document.getElementById('f-invoiceNo') ? document.getElementById('f-invoiceNo').value : '';
    data.date = document.getElementById('f-invDate') ? document.getElementById('f-invDate').value : '';
    data.dueDate = document.getElementById('f-invDue') ? document.getElementById('f-invDue').value : '';
    const grandEl = document.getElementById('invGrand');
    data.amount = grandEl ? parseFloat(grandEl.textContent.replace(/[^0-9.-]+/g, "")) : 0;
  }

  // Send to React
  window.parent.postMessage({ type: 'SAVE_DOCUMENT', payload: data }, '*');
}
// ----------------------------------

// INIT
document.documentElement.style.setProperty('--lh-color', color);
render();

// Auto-select tab based on hash (Run immediately and on load)
function applyHash() {
  const hash = window.location.hash.substring(1);
  if (hash && ['lh', 'quo', 'inv', 'prop'].includes(hash)) {
    // Click the correct tab button
    const tabBtn = document.querySelector(`.dt[onclick*="'${hash}'"]`);
    if (tabBtn) tabBtn.click();
    else {
      // Manually switch
      docType = hash;
      ['lh', 'quo', 'inv', 'prop'].forEach(t => {
        const el = document.getElementById('ctrl-' + t);
        if (el) el.style.display = t === hash ? '' : 'none';
      });
      render();
    }

    // Hide the top doc-tabs bar entirely  
    const tabsContainer = document.querySelector('.doc-tabs');
    if (tabsContainer) {
      tabsContainer.style.display = 'none';
    }

    // Update the preview title
    const titles = { letterhead: 'Letterhead', quo: 'Quotation', prop: 'Proposal', inv: 'Invoice' };
    const prevTitle = document.getElementById('prevTitle');
    if (prevTitle && titles[hash]) prevTitle.textContent = titles[hash] + ' Preview';
  }
}

window._renderReady = true;
// ── SEND FROM LETTERHEAD ──
function sendFromLetterhead() {
  const name = (document.getElementById('lh-recipient-name') ? document.getElementById('lh-recipient-name').value.trim() : '');
  const type = (document.getElementById('lh-recipient-type') ? document.getElementById('lh-recipient-type').value : 'client');
  const email = (document.getElementById('lh-recipient-email') ? document.getElementById('lh-recipient-email').value.trim() : '');

  if (!name) {
    const nameEl = document.getElementById('lh-recipient-name');
    if (nameEl) { nameEl.style.borderColor = '#F05C5C'; nameEl.focus(); setTimeout(() => nameEl.style.borderColor = '', 2000); }
    return;
  }

  const data = {
    docType: 'lh',
    sendTo: type,
    client: name,
    recipientEmail: email,
    htmlContent: document.getElementById('mainPaper').innerHTML,
    dateSent: new Date().toISOString()
  };

  // Save to localStorage
  const existing = JSON.parse(localStorage.getItem('client_documents') || '[]');
  data.id = 'DOC' + Date.now();
  existing.unshift(data);
  localStorage.setItem('client_documents', JSON.stringify(existing));

  // Also send to React parent
  window.parent.postMessage({ type: 'SEND_DOCUMENT', payload: data }, '*');

  // Toast
  const t = document.createElement('div');
  t.style.cssText = "position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#26C281, var(--app-accent, var(--app-accent, #00BCD4)));color:#fff;padding:14px 22px;border-radius:12px;font-weight:700;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.15);font-size:13px;display:flex;align-items:center;gap:8px;";
  t.innerHTML = '<i class="ti ti-circle-check" style="font-size:18px;"></i> Letterhead sent to ' + name + '!';
  document.body.appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity 0.4s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 3000);
}

// ── SEND MODAL ──
function openSendModal() {
  const modal = document.getElementById('sendModal');
  modal.style.display = 'flex';
  // Pre-fill with invoice client if available
  const invClient = document.getElementById('f-inv-client');
  const quoClient = document.getElementById('f-quo-client');
  const propClient = document.getElementById('f-prop-client');
  const nameField = document.getElementById('f-clientName');
  if (docType === 'inv' && invClient && invClient.value) nameField.value = invClient.value;
  else if (docType === 'quo' && quoClient && quoClient.value) nameField.value = quoClient.value;
  else if (docType === 'prop' && propClient && propClient.value) nameField.value = propClient.value;
}
function closeSendModal() {
  document.getElementById('sendModal').style.display = 'none';
}
// Closemodal on backdrop click
document.getElementById('sendModal').addEventListener('click', function (e) {
  if (e.target === this) closeSendModal();
});

applyHash();
window.addEventListener('DOMContentLoaded', applyHash);
window.addEventListener('hashchange', applyHash);

