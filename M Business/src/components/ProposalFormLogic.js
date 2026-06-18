
// --- Automatically Extracted Logic ---

export let msCount = 5;
export let currentStatus = 'DRAFT';

export const fmtDate = v => { try { return new Date(v).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); } catch { return v; } };
export const fmt = n => '₹' + Number(n).toLocaleString('en-IN');

const getEl = (id) => {
  const el = document.getElementById(id);
  if (!el) return { value: '', textContent: '', innerHTML: '', style: {}, classList: { add: ()=>{}, remove: ()=>{}, toggle: ()=>{} }, focus: ()=>{} };
  return el;
};




/* ── SECTION TOGGLES ── */
export function toggleSection(btn, id) {
  const sec = getEl(id);
  const pvSec = getEl('pv-sec-' + id.replace('sec-',''));
  btn.classList.toggle('on');
  const show = btn.classList.contains('on');
  if (sec) sec.style.display = show ? '' : 'none';
  if (pvSec) pvSec.style.display = show ? '' : 'none';
}

/* ── STATUS ── */
export function selSt(el, val) {
  document.querySelectorAll('.sc').forEach(c => c.className = 'sc ' + c.className.split(' ').filter(x => ['won','lost','sent','neg','exp'].includes(x)).join(' '));
  const classMap = { DRAFT:'active-sc', SENT:'sent', NEGOTIATION:'neg', WON:'won', LOST:'lost', EXPIRED:'exp' };
  document.querySelectorAll('.sc').forEach(c => { c.className = 'sc'; });
  el.classList.add(classMap[val] || 'active-sc');
  currentStatus = val;
  const b = getEl('pv-status');
  b.textContent = val;
}

/* ── MAIN UPDATE ── */
export function up() {
  // Cover
  const t = getEl('propTitle').value;
  getEl('pv-title').textContent = t || '— Proposal Title —';
  getEl('pv-title').style.color = t ? '#fff' : 'rgba(255,255,255,.45)';
  const tc = getEl('toComp').value;
  getEl('pv-sub').textContent = tc ? 'Prepared for ' + tc + ' by YENCODE Technologies' : 'Prepared by YENCODE Technologies';
  getEl('pv-date').textContent = fmtDate(getEl('propDate').value);
  getEl('pv-type').textContent = getEl('propType').value;
  getEl('pv-expiry').textContent = 'Expires ' + fmtDate(getEl('propExpiry').value);
  // Parties
  const fp = getEl('fromPerson').value, fc = getEl('fromComp').value, fe = getEl('fromEmail').value;
  getEl('pv-from').textContent = fp || 'Prabhu R';
  getEl('pv-from-d').innerHTML = `${fc}<br>${fe}`;
  getEl('pv-sig1').textContent = fp || 'Prabhu R';
  getEl('pv-to').textContent = tc || '— Client —';
  getEl('pv-to').style.color = tc ? 'var(--text)' : 'var(--text3)';
  const tp = getEl('toPerson').value, te = getEl('toEmail').value, ta = getEl('toAddr').value;
  getEl('pv-to-d').innerHTML = tc ? `${tp ? tp+'<br>' : ''}${te ? te+'<br>' : ''}${ta}` : '<span style="color:var(--text3)">Fill in client details</span>';
  getEl('pv-sig2').textContent = tc || '— Client —';
  getEl('pv-sig2').style.color = tc ? 'var(--text)' : 'var(--text3)';
  getEl('pv-sig2-role').textContent = tc || 'Awaiting';
  // Exec summary
  const pr = getEl('problem').value, so = getEl('solution').value, oc = getEl('outcome').value;
  getEl('pv-problem').innerHTML = pr || '<span style="color:var(--text3);font-style:italic">Describe the client\'s challenge…</span>';
  getEl('pv-solution').innerHTML = so || '<span style="color:var(--text3);font-style:italic">Describe your proposed solution…</span>';
  getEl('pv-outcome').innerHTML = oc || '<span style="color:var(--text3);font-style:italic">Describe expected results…</span>';
  // Deliverables
  let dHtml = '';
  document.querySelectorAll('#delList .dv-input').forEach(d => { if (d.value.trim()) dHtml += `<div class="del-item-p">${d.value}</div>`; });
  getEl('pv-del').innerHTML = dHtml || '<span style="color:var(--text3);font-size:10px">No deliverables</span>';
  // Timeline dates
  getEl('pv-start').textContent = fmtDate(getEl('startDate').value);
  getEl('pv-end').textContent = fmtDate(getEl('endDate').value);
  getEl('pv-dur').textContent = getEl('duration').value;
  updateMilestonesPreview();
  updateTeamPreview();
  updateValuePreview();
  updateRisksPreview();
  updateCasePreview();
  updateTmPreview();
  // Payment
  getEl('pv-pay').textContent = 'Payment: ' + getEl('paySchedule').value;
  // Closing
  getEl('pv-closing').innerHTML = (getEl('closing').value || '').replace(/\n/g,'<br>');
}

export function updateMilestonesPreview() {
  const items = document.querySelectorAll('#msList .ms-item');
  let html = '';
  items.forEach((it, i) => {
    const ti = it.querySelector('.ms-inp'), di = it.querySelector('.ms-date'), de = it.querySelector('.ms-desc');
    const isLast = i === items.length - 1;
    html += `<div class="tl-pi"><div class="tl-left"><div class="tl-dot">${i+1}</div>${!isLast?'<div class="tl-line-p"></div>':''}</div>
      <div><div class="tl-pi-title">${ti?ti.value:'Milestone'}</div>${di&&di.value?`<div class="tl-pi-date">${fmtDate(di.value)}</div>`:''}${de&&de.value?`<div class="tl-pi-desc">${de.value}</div>`:''}</div></div>`;
  });
  getEl('pv-timeline').innerHTML = html;
}

export function updateTeamPreview() {
  const items = document.querySelectorAll('#teamList .team-card');
  let html = '';
  items.forEach(it => {
    const n = it.querySelector('.tc-name').textContent;
    const r = it.querySelector('.tc-role').textContent;
    const av = it.querySelector('.tc-av');
    const bg = av ? av.style.background : 'var(--teal)';
    const init = n.trim().split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
    html += `<div class="tp-card" style="display:flex;align-items:center;gap:7px"><div class="tp-av-p" style="background:${bg}">${init}</div><div><div class="tp-name-p">${n}</div><div class="tp-role-p">${r}</div></div></div>`;
  });
  getEl('pv-team').innerHTML = html || '<span style="color:var(--text3);font-size:10px">No team members</span>';
}

export function updateValuePreview() {
  let html = '';
  document.querySelectorAll('#valueList .dv-input').forEach(v => { if (v.value.trim()) html += `<div class="val-pi">${v.value}</div>`; });
  getEl('pv-value').innerHTML = html || '<span style="color:var(--text3);font-size:10px">No value points</span>';
}

export function updateRisksPreview() {
  const rows = document.querySelectorAll('#riskList .risk-row-g');
  let html = '';
  rows.forEach(r => {
    const inputs = r.querySelectorAll('input');
    const sel = r.querySelector('select');
    if (!inputs[0] || !inputs[0].value) return;
    const lik = sel ? sel.value : 'Medium';
    const cls = lik === 'High' ? 'h' : lik === 'Low' ? 'l' : 'm';
    html += `<div class="risk-pi"><span class="risk-badge-p ${cls}">${lik}</span><div><div class="risk-pi-text">${inputs[0].value}</div>${inputs[1]?`<div class="risk-pi-mit">↳ ${inputs[1].value}</div>`:''}</div></div>`;
  });
  getEl('pv-risks').innerHTML = html || '<span style="color:var(--text3);font-size:10px">No risks added</span>';
}

export function updateCasePreview() {
  const items = document.querySelectorAll('#csList .cs-item');
  let html = '';
  items.forEach(it => {
    const title = it.querySelector('input[type="text"]').value;
    const ta = it.querySelector('textarea');
    html += `<div class="cs-p"><div class="cs-p-title">${title}</div><div class="cs-p-detail">${ta ? ta.value : ''}</div></div>`;
  });
  getEl('pv-cs').innerHTML = html;
}

export function updateTmPreview() {
  const items = document.querySelectorAll('#tmList .tm-item');
  let html = '';
  items.forEach(it => {
    const ta = it.querySelector('textarea');
    const nameInp = it.querySelectorAll('input')[0];
    html += `<div class="tm-p"><div class="tm-p-text">"${ta ? ta.value : ''}"</div><div class="tm-p-author">— ${nameInp ? nameInp.value : ''}</div></div>`;
  });
  getEl('pv-tm').innerHTML = html;
}

export function calcTotal() {
  const rows = document.querySelectorAll('#pricingList .pricing-row');
  let sub = 0;
  let html = '';
  rows.forEach(r => {
    const inps = r.querySelectorAll('input');
    if (inps.length >= 2) {
      const n = inps[0].value || 'Item', v = parseFloat(inps[1].value) || 0;
      sub += v;
      html += `<tr><td>${n}</td><td>${fmt(v)}</td></tr>`;
    }
  });
  const gst = parseFloat(getEl('gst').value) || 0;
  const disc = parseFloat(getEl('disc').value) || 0;
  const discount = sub * disc / 100;
  const tax = sub * gst / 100;
  const grand = sub - discount + tax;
  getEl('subtotal').textContent = fmt(sub);
  getEl('taxAmt').textContent = fmt(tax);
  getEl('grandTotal').textContent = fmt(grand);
  getEl('pv-grand').textContent = fmt(grand);
  getEl('pv-pricing').innerHTML = html;
  const dr = getEl('discRow');
  if (discount > 0) { dr.style.display = 'flex'; getEl('discAmt').textContent = '-' + fmt(discount); } else { dr.style.display = 'none'; }
}

/* ── ADD FUNCTIONS ── */
export function addMilestone() {
  msCount++;
  const c = getEl('msList');
  const d = document.createElement('div');
  d.className = 'ms-item';
  d.innerHTML = `<div class="ms-left"><div class="ms-dot">${msCount}</div><div class="ms-line"></div></div>
    <div class="ms-body">
      <div class="ms-row"><input type="text" class="ms-inp" placeholder="Milestone title" oninput="up()"><input type="date" class="ms-date" oninput="up()"><button class="icon-del" onclick="removeMilestone(this)"><i class="ti ti-trash"></i></button></div>
      <input type="text" class="ms-desc" placeholder="Brief description…" oninput="up()">
    </div>`;
  c.appendChild(d);
  updateMsNumbers();
  up();
}

export function removeMilestone(btn) {
  if (document.querySelectorAll('#msList .ms-item').length <= 1) return;
  btn.closest('.ms-item').remove();
  updateMsNumbers();
  up();
}

export function updateMsNumbers() {
  document.querySelectorAll('#msList .ms-item').forEach((it, i) => {
    const dot = it.querySelector('.ms-dot');
    if (dot) dot.textContent = i + 1;
  });
}

export function addDel() {
  const c = getEl('delList');
  const d = document.createElement('div');
  d.className = 'dv-item';
  d.innerHTML = `<div class="dv-icon" style="background:var(--teal-light);color:var(--teal)"><i class="ti ti-check"></i></div>
    <input type="text" class="dv-input" placeholder="Deliverable…" oninput="up()">
    <i class="ti ti-x dv-del" onclick="this.parentElement.remove();up()"></i>`;
  c.appendChild(d);
  d.querySelector('.dv-input').focus();
  up();
}

export function addValue() {
  const c = getEl('valueList');
  const d = document.createElement('div');
  d.className = 'dv-item';
  d.innerHTML = `<div class="dv-icon" style="background:var(--amber-bg);color:var(--amber)"><i class="ti ti-trending-up"></i></div>
    <input type="text" class="dv-input" placeholder="Value point or ROI…" oninput="up()">
    <i class="ti ti-x dv-del" onclick="this.parentElement.remove();up()"></i>`;
  c.appendChild(d);
  d.querySelector('.dv-input').focus();
  up();
}

export function addPricingRow() {
  const c = getEl('pricingList');
  const d = document.createElement('div');
  d.className = 'pricing-row';
  d.innerHTML = `<input type="text" class="pr-inp" placeholder="Service / item" oninput="calcTotal()">
    <input type="number" class="pr-inp" value="0" style="text-align:right" oninput="calcTotal()">
    <button class="pr-del" onclick="this.closest('.pricing-row').remove();calcTotal()"><i class="ti ti-trash"></i></button>`;
  c.appendChild(d);
  d.querySelector('input').focus();
  calcTotal();
}

export function addRisk() {
  const c = getEl('riskList');
  const d = document.createElement('div');
  d.className = 'risk-row-g';
  d.innerHTML = `<input type="text" class="pr-inp" placeholder="Risk description">
    <select class="pr-inp" style="padding:7px 8px;font-size:11px"><option>High</option><option selected>Medium</option><option>Low</option></select>
    <input type="text" class="pr-inp" placeholder="Mitigation">
    <button class="pr-del" onclick="this.closest('.risk-row-g').remove()"><i class="ti ti-trash"></i></button>`;
  c.appendChild(d);
}

export function addCaseStudy() {
  const c = getEl('csList'), n = c.children.length + 1;
  const d = document.createElement('div');
  d.className = 'cs-item';
  d.innerHTML = `<div class="cs-header"><div class="cs-num">${n}</div>
    <input type="text" class="fi" style="flex:1" placeholder="Project name" oninput="updateCasePreview()">
    <button class="icon-del" style="margin-left:6px" onclick="this.closest('.cs-item').remove();updateCasePreview()"><i class="ti ti-trash"></i></button></div>
    <div class="form-row">
      <div class="fg"><label class="fl">Client</label><input class="fi" type="text" placeholder="Client name" oninput="updateCasePreview()"></div>
      <div class="fg"><label class="fl">Industry</label><input class="fi" type="text" placeholder="Industry" oninput="updateCasePreview()"></div>
    </div>
    <div class="fg"><label class="fl">Challenge & Result</label><textarea class="ta" style="min-height:60px" placeholder="Describe challenge and result…" oninput="updateCasePreview()"></textarea></div>`;
  c.appendChild(d);
  updateCasePreview();
}

export function addTestimonial() {
  const c = getEl('tmList');
  const d = document.createElement('div');
  d.className = 'tm-item';
  d.innerHTML = `<i class="ti ti-quote tm-quote-icon"></i>
    <div class="fg"><label class="fl">Quote</label><textarea class="ta" style="min-height:56px" placeholder="Testimonial quote…" oninput="updateTmPreview()"></textarea></div>
    <div class="form-row"><div class="fg"><label class="fl">Name & Role</label><input class="fi" type="text" placeholder="Name, Title – Company" oninput="updateTmPreview()"></div>
    <div class="fg"><label class="fl">Rating</label><select class="fs"><option>⭐⭐⭐⭐⭐ 5/5</option><option>⭐⭐⭐⭐ 4/5</option></select></div></div>
    <button class="icon-del" onclick="this.closest('.tm-item').remove();updateTmPreview()"><i class="ti ti-trash" style="font-size:13px"></i> Remove</button>`;
  c.appendChild(d);
  updateTmPreview();
}

export function addFaq() {
  const c = getEl('faqList');
  const d = document.createElement('div');
  d.style.cssText = 'padding:10px 12px;background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;margin-bottom:8px';
  d.innerHTML = `<div class="fg"><label class="fl">Question</label><input class="fi" type="text" placeholder="Frequently asked question…"></div>
    <div class="fg"><label class="fl">Answer</label><textarea class="ta" style="min-height:52px" placeholder="Clear, concise answer…"></textarea></div>
    <button class="icon-del" onclick="this.closest('div[style]').remove()"><i class="ti ti-trash" style="font-size:13px"></i> Remove</button>`;
  c.appendChild(d);
}

export function addWhyUs() {
  const c = getEl('whyList');
  const d = document.createElement('div');
  d.className = 'dv-item';
  d.innerHTML = `<div class="dv-icon" style="background:var(--amber-bg);color:var(--amber)"><i class="ti ti-star"></i></div>
    <input type="text" class="dv-input" placeholder="Why choose YENCODE…">
    <i class="ti ti-x dv-del" onclick="this.parentElement.remove()"></i>`;
  c.appendChild(d);
  d.querySelector('.dv-input').focus();
}

export function addTeamMember() {
  const name = prompt('Team member full name:');
  if (!name) return;
  const role = prompt('Their job role:') || 'Team Member';
  const exp = prompt('Years of experience (e.g. 5+ years · Web Dev):') || '';
  const skills = prompt('Skills (comma-separated):') || '';
  const c = getEl('teamList');
  const colors = ['linear-gradient(135deg,var(--teal),var(--teal4))','linear-gradient(135deg,var(--purple),#4E35B0)','linear-gradient(135deg,var(--amber),#D4880A)','linear-gradient(135deg,var(--blue),#1A4DB5)'];
  const col = colors[Math.floor(Math.random() * colors.length)];
  const init = name.trim().split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
  const skillTags = skills ? skills.split(',').map(s => `<span class="tc-skill">${s.trim()}</span>`).join('') : '';
  const d = document.createElement('div');
  d.className = 'team-card';
  d.innerHTML = `<div class="tc-av" style="background:${col}">${init}</div>
    <div style="flex:1;min-width:0">
      <div class="tc-name">${name}</div>
      <div class="tc-role">${role}</div>
      ${exp ? `<div class="tc-exp">${exp}</div>` : ''}
      ${skillTags ? `<div class="tc-skills">${skillTags}</div>` : ''}
    </div>
    <i class="ti ti-x tc-del" onclick="this.closest('.team-card').remove();updateTeamPreview()"></i>`;
  c.appendChild(d);
  updateTeamPreview();
}

export function fillClient() {
  getEl('toComp').value = 'STA Corporation';
  getEl('toPerson').value = 'STA Admin';
  getEl('toEmail').value = 'sta@example.com';
  getEl('toPhone').value = '+91 98765 43210';
  getEl('toAddr').value = 'Chennai, Tamil Nadu, India';
  up();
}

export function uploadCover() {
  const z = getEl('coverZone');
  z.style.background = 'var(--teal-lighter)';
  z.style.borderColor = 'var(--teal)';
  z.innerHTML = `<i class="ti ti-check" style="font-size:22px;color:var(--teal)"></i><div class="cover-zone-txt" style="color:var(--teal)">Cover image uploaded</div><div class="cover-zone-sub">Click to change</div>`;
}

export function extractProposalData() {
  let val = 0;
  try {
    const grandTotalStr = document.getElementById('grandTotal')?.textContent || '0';
    val = Number(grandTotalStr.replace(/[^0-9.-]+/g,""));
  } catch(err) {}

  return {
    title: document.getElementById('propTitle')?.value || 'New Proposal',
    client: document.getElementById('toComp')?.value || '',
    format: 'a4-proposal',
    value: val,
    html: document.getElementById('propDoc')?.outerHTML || ''
  };
}

export function saveDraft() { 
  selSt(document.querySelectorAll('.sc')[0],'DRAFT'); 
  if (window._onSaveProposal) {
    const data = extractProposalData();
    data.status = 'draft';
    window._onSaveProposal(data);
  } else {
    alert('Proposal saved as draft! (UI Only)'); 
  }
}

export function sendProposal() {
  const c = getEl('toComp').value;
  if (!c) { alert('Please enter client name first.'); getEl('toComp').focus(); return; }
  selSt(document.querySelectorAll('.sc')[1],'SENT');
  if (window._onSaveProposal) {
    const data = extractProposalData();
    data.status = 'pending';
    window._onSaveProposal(data);
  } else {
    alert('Proposal sent to ' + c + '!');
  }
}

export function markWon() { 
  selSt(document.querySelectorAll('.sc')[3],'WON'); 
  if (window._onSaveProposal) {
    const data = extractProposalData();
    data.status = 'approved';
    window._onSaveProposal(data);
  } else {
    alert('Proposal marked as Won 🏆'); 
  }
}

// Init
calcTotal();
up();
updateMilestonesPreview();
updateTeamPreview();
updateValuePreview();
updateRisksPreview();
