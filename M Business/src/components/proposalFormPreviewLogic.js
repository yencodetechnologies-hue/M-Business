
let msCount = 5;
let currentStatus = 'DRAFT';

const fmtDate = v => { try { return new Date(v).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); } catch { return v; } };
const fmt = n => '₹' + Number(n).toLocaleString('en-IN');

/* ── SECTION TOGGLES ── */
function toggleSection(btn, id) {
  const sec = document.getElementById(id);
  const pvSec = document.getElementById('pv-sec-' + id.replace('sec-',''));
  btn.classList.toggle('on');
  const show = btn.classList.contains('on');
  if (sec) sec.style.display = show ? '' : 'none';
  if (pvSec) pvSec.style.display = show ? '' : 'none';
}

/* ── STATUS ── */
function selSt(el, val) {
  document.querySelectorAll('.sc').forEach(c => c.className = 'sc ' + c.className.split(' ').filter(x => ['won','lost','sent','neg','exp'].includes(x)).join(' '));
  const classMap = { DRAFT:'active-sc', SENT:'sent', NEGOTIATION:'neg', WON:'won', LOST:'lost', EXPIRED:'exp' };
  document.querySelectorAll('.sc').forEach(c => { c.className = 'sc'; });
  el.classList.add(classMap[val] || 'active-sc');
  currentStatus = val;
  const b = document.getElementById('pv-status');
  b.textContent = val;
}

/* ── MAIN UPDATE ── */
function up() {
  // Cover
  const t = document.getElementById('propTitle').value;
  document.getElementById('pv-title').textContent = t || '— Proposal Title —';
  document.getElementById('pv-title').style.color = t ? '#fff' : 'rgba(255,255,255,.45)';
  const tc = document.getElementById('toComp').value;
  document.getElementById('pv-sub').textContent = tc ? 'Prepared for ' + tc + ' by YENCODE Technologies' : 'Prepared by YENCODE Technologies';
  document.getElementById('pv-date').textContent = fmtDate(document.getElementById('propDate').value);
  document.getElementById('pv-type').textContent = document.getElementById('propType').value;
  document.getElementById('pv-expiry').textContent = 'Expires ' + fmtDate(document.getElementById('propExpiry').value);
  // Parties
  const fp = document.getElementById('fromPerson').value, fc = document.getElementById('fromComp').value, fe = document.getElementById('fromEmail').value;
  document.getElementById('pv-from').textContent = fp || 'Prabhu R';
  document.getElementById('pv-from-d').innerHTML = `${fc}<br>${fe}`;
  document.getElementById('pv-sig1').textContent = fp || 'Prabhu R';
  document.getElementById('pv-to').textContent = tc || '— Client —';
  document.getElementById('pv-to').style.color = tc ? 'var(--text)' : 'var(--text3)';
  const tp = document.getElementById('toPerson').value, te = document.getElementById('toEmail').value, ta = document.getElementById('toAddr').value;
  document.getElementById('pv-to-d').innerHTML = tc ? `${tp ? tp+'<br>' : ''}${te ? te+'<br>' : ''}${ta}` : '<span style="color:var(--text3)">Fill in client details</span>';
  document.getElementById('pv-sig2').textContent = tc || '— Client —';
  document.getElementById('pv-sig2').style.color = tc ? 'var(--text)' : 'var(--text3)';
  document.getElementById('pv-sig2-role').textContent = tc || 'Awaiting';
  // Exec summary
  const pr = document.getElementById('problem').value, so = document.getElementById('solution').value, oc = document.getElementById('outcome').value;
  document.getElementById('pv-problem').innerHTML = pr || '<span style="color:var(--text3);font-style:italic">Describe the client\'s challenge…</span>';
  document.getElementById('pv-solution').innerHTML = so || '<span style="color:var(--text3);font-style:italic">Describe your proposed solution…</span>';
  document.getElementById('pv-outcome').innerHTML = oc || '<span style="color:var(--text3);font-style:italic">Describe expected results…</span>';
  // Deliverables
  let dHtml = '';
  document.querySelectorAll('#delList .dv-input').forEach(d => { if (d.value.trim()) dHtml += `<div class="del-item-p">${d.value}</div>`; });
  document.getElementById('pv-del').innerHTML = dHtml || '<span style="color:var(--text3);font-size:10px">No deliverables</span>';
  // Timeline dates
  document.getElementById('pv-start').textContent = fmtDate(document.getElementById('startDate').value);
  document.getElementById('pv-end').textContent = fmtDate(document.getElementById('endDate').value);
  document.getElementById('pv-dur').textContent = document.getElementById('duration').value;
  updateMilestonesPreview();
  updateTeamPreview();
  updateValuePreview();
  updateRisksPreview();
  updateCasePreview();
  updateTmPreview();
  // Payment
  document.getElementById('pv-pay').textContent = 'Payment: ' + document.getElementById('paySchedule').value;
  // Closing
  document.getElementById('pv-closing').innerHTML = (document.getElementById('closing').value || '').replace(/\n/g,'<br>');
}

function updateMilestonesPreview() {
  const items = document.querySelectorAll('#msList .ms-item');
  let html = '';
  items.forEach((it, i) => {
    const ti = it.querySelector('.ms-inp'), di = it.querySelector('.ms-date'), de = it.querySelector('.ms-desc');
    const isLast = i === items.length - 1;
    html += `<div class="tl-pi"><div class="tl-left"><div class="tl-dot">${i+1}</div>${!isLast?'<div class="tl-line-p"></div>':''}</div>
      <div><div class="tl-pi-title">${ti?ti.value:'Milestone'}</div>${di&&di.value?`<div class="tl-pi-date">${fmtDate(di.value)}</div>`:''}${de&&de.value?`<div class="tl-pi-desc">${de.value}</div>`:''}</div></div>`;
  });
  document.getElementById('pv-timeline').innerHTML = html;
}

function updateTeamPreview() {
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
  document.getElementById('pv-team').innerHTML = html || '<span style="color:var(--text3);font-size:10px">No team members</span>';
}

function updateValuePreview() {
  let html = '';
  document.querySelectorAll('#valueList .dv-input').forEach(v => { if (v.value.trim()) html += `<div class="val-pi">${v.value}</div>`; });
  document.getElementById('pv-value').innerHTML = html || '<span style="color:var(--text3);font-size:10px">No value points</span>';
}

function updateRisksPreview() {
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
  document.getElementById('pv-risks').innerHTML = html || '<span style="color:var(--text3);font-size:10px">No risks added</span>';
}

function updateCasePreview() {
  const items = document.querySelectorAll('#csList .cs-item');
  let html = '';
  items.forEach(it => {
    const title = it.querySelector('input[type="text"]').value;
    const ta = it.querySelector('textarea');
    html += `<div class="cs-p"><div class="cs-p-title">${title}</div><div class="cs-p-detail">${ta ? ta.value : ''}</div></div>`;
  });
  document.getElementById('pv-cs').innerHTML = html;
}

function updateTmPreview() {
  const items = document.querySelectorAll('#tmList .tm-item');
  let html = '';
  items.forEach(it => {
    const ta = it.querySelector('textarea');
    const nameInp = it.querySelectorAll('input')[0];
    html += `<div class="tm-p"><div class="tm-p-text">"${ta ? ta.value : ''}"</div><div class="tm-p-author">— ${nameInp ? nameInp.value : ''}</div></div>`;
  });
  document.getElementById('pv-tm').innerHTML = html;
}

function calcTotal() {
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
  const gst = parseFloat(document.getElementById('gst').value) || 0;
  const disc = parseFloat(document.getElementById('disc').value) || 0;
  const discount = sub * disc / 100;
  const tax = sub * gst / 100;
  const grand = sub - discount + tax;
  document.getElementById('subtotal').textContent = fmt(sub);
  document.getElementById('taxAmt').textContent = fmt(tax);
  document.getElementById('grandTotal').textContent = fmt(grand);
  document.getElementById('pv-grand').textContent = fmt(grand);
  document.getElementById('pv-pricing').innerHTML = html;
  const dr = document.getElementById('discRow');
  if (discount > 0) { dr.style.display = 'flex'; document.getElementById('discAmt').textContent = '-' + fmt(discount); } else { dr.style.display = 'none'; }
}

/* ── ADD FUNCTIONS ── */
function addMilestone() {
  msCount++;
  const c = document.getElementById('msList');
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

function removeMilestone(btn) {
  if (document.querySelectorAll('#msList .ms-item').length <= 1) return;
  btn.closest('.ms-item').remove();
  updateMsNumbers();
  up();
}

function updateMsNumbers() {
  document.querySelectorAll('#msList .ms-item').forEach((it, i) => {
    const dot = it.querySelector('.ms-dot');
    if (dot) dot.textContent = i + 1;
  });
}

function addDel() {
  const c = document.getElementById('delList');
  const d = document.createElement('div');
  d.className = 'dv-item';
  d.innerHTML = `<div class="dv-icon" style="background:var(--teal-light);color:var(--teal)"><i class="ti ti-check"></i></div>
    <input type="text" class="dv-input" placeholder="Deliverable…" oninput="up()">
    <i class="ti ti-x dv-del" onclick="this.parentElement.remove();up()"></i>`;
  c.appendChild(d);
  d.querySelector('.dv-input').focus();
  up();
}

function addValue() {
  const c = document.getElementById('valueList');
  const d = document.createElement('div');
  d.className = 'dv-item';
  d.innerHTML = `<div class="dv-icon" style="background:var(--amber-bg);color:var(--amber)"><i class="ti ti-trending-up"></i></div>
    <input type="text" class="dv-input" placeholder="Value point or ROI…" oninput="up()">
    <i class="ti ti-x dv-del" onclick="this.parentElement.remove();up()"></i>`;
  c.appendChild(d);
  d.querySelector('.dv-input').focus();
  up();
}

function addPricingRow() {
  const c = document.getElementById('pricingList');
  const d = document.createElement('div');
  d.className = 'pricing-row';
  d.innerHTML = `<input type="text" class="pr-inp" placeholder="Service / item" oninput="calcTotal()">
    <input type="number" class="pr-inp" value="0" style="text-align:right" oninput="calcTotal()">
    <button class="pr-del" onclick="this.closest('.pricing-row').remove();calcTotal()"><i class="ti ti-trash"></i></button>`;
  c.appendChild(d);
  d.querySelector('input').focus();
  calcTotal();
}

function addRisk() {
  const c = document.getElementById('riskList');
  const d = document.createElement('div');
  d.className = 'risk-row-g';
  d.innerHTML = `<input type="text" class="pr-inp" placeholder="Risk description">
    <select class="pr-inp" style="padding:7px 8px;font-size:11px"><option>High</option><option selected>Medium</option><option>Low</option></select>
    <input type="text" class="pr-inp" placeholder="Mitigation">
    <button class="pr-del" onclick="this.closest('.risk-row-g').remove()"><i class="ti ti-trash"></i></button>`;
  c.appendChild(d);
}

function addCaseStudy() {
  const c = document.getElementById('csList'), n = c.children.length + 1;
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

function addTestimonial() {
  const c = document.getElementById('tmList');
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

function addFaq() {
  const c = document.getElementById('faqList');
  const d = document.createElement('div');
  d.style.cssText = 'padding:10px 12px;background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;margin-bottom:8px';
  d.innerHTML = `<div class="fg"><label class="fl">Question</label><input class="fi" type="text" placeholder="Frequently asked question…"></div>
    <div class="fg"><label class="fl">Answer</label><textarea class="ta" style="min-height:52px" placeholder="Clear, concise answer…"></textarea></div>
    <button class="icon-del" onclick="this.closest('div[style]').remove()"><i class="ti ti-trash" style="font-size:13px"></i> Remove</button>`;
  c.appendChild(d);
}

function addWhyUs() {
  const c = document.getElementById('whyList');
  const d = document.createElement('div');
  d.className = 'dv-item';
  d.innerHTML = `<div class="dv-icon" style="background:var(--amber-bg);color:var(--amber)"><i class="ti ti-star"></i></div>
    <input type="text" class="dv-input" placeholder="Why choose YENCODE…">
    <i class="ti ti-x dv-del" onclick="this.parentElement.remove()"></i>`;
  c.appendChild(d);
  d.querySelector('.dv-input').focus();
}

function addTeamMember() {
  const name = prompt('Team member full name:');
  if (!name) return;
  const role = prompt('Their job role:') || 'Team Member';
  const exp = prompt('Years of experience (e.g. 5+ years · Web Dev):') || '';
  const skills = prompt('Skills (comma-separated):') || '';
  const c = document.getElementById('teamList');
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

function fillClient() {
  document.getElementById('toComp').value = 'STA Corporation';
  document.getElementById('toPerson').value = 'STA Admin';
  document.getElementById('toEmail').value = 'sta@example.com';
  document.getElementById('toPhone').value = '+91 98765 43210';
  document.getElementById('toAddr').value = 'Chennai, Tamil Nadu, India';
  up();
}

function uploadCover() {
  const z = document.getElementById('coverZone');
  z.style.background = 'var(--teal-lighter)';
  z.style.borderColor = 'var(--teal)';
  z.innerHTML = `<i class="ti ti-check" style="font-size:22px;color:var(--teal)"></i><div class="cover-zone-txt" style="color:var(--teal)">Cover image uploaded</div><div class="cover-zone-sub">Click to change</div>`;
}

function saveDraft() { selSt(document.querySelectorAll('.sc')[0],'DRAFT'); alert('Proposal saved as draft!'); }
function sendProposal() {
  const c = document.getElementById('toComp').value;
  if (!c) { alert('Please enter client name first.'); document.getElementById('toComp').focus(); return; }
  selSt(document.querySelectorAll('.sc')[1],'SENT');
  alert('Proposal sent to ' + c + '!');
}
function markWon() { selSt(document.querySelectorAll('.sc')[3],'WON'); alert('Proposal marked as Won 🏆'); }

// Init
calcTotal();
up();
updateMilestonesPreview();
updateTeamPreview();
updateValuePreview();
updateRisksPreview();
