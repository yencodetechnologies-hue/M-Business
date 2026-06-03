window.onload=()=>{window.print()}<\/script></body></html>`);
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
      rowHtml += `<tr><td>${i+1}</td><td>${n}</td><td style="text-align:center">${qty}</td><td style="text-align:right">${fmt(price)}</td><td style="text-align:right;font-weight:700">${fmt(total)}</td></tr>`;
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
  const co = v('f-company') || 'YENCODE Technologies';
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
    draft: { bg:'#F8FAFB', color:'#A0B8BE', border:'#C5DDE0', text:'DRAFT' },
    sent: { bg:'#EFF4FF', color:'#2563EB', border:'#BFDBFE', text:'SENT' },
    paid: { bg:'#E8FAF3', color:'#26C281', border:'#A7F3D0', text:'PAID' },
    overdue: { bg:'#FEF2F2', color:'#F05C5C', border:'#FECACA', text:'OVERDUE' }
  };
  const st = statusMap[status] || statusMap.draft;
  const statusBadge = `<span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;background:${st.bg};color:${st.color};border:1.5px solid ${st.border}">${st.text}</span>`;

  // Company contact block
  const contactHtml = `<div style="font-size:10px;color:#607D86;line-height:1.9">
    ${v('f-addr') ? v('f-addr') + '<br>' : ''}
    ${v('f-phone') ? '<b>T:</b> ' + v('f-phone') + '<br>' : ''}
    ${v('f-email') ? '<b>E:</b> ' + v('f-email') + '<br>' : ''}
    ${v('f-gst') ? 'GST: ' + v('f-gst') : ''}
  </div>`;

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
    hdr = `<div style="padding:${pad}px ${pad+16}px;background:#fff">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
        <div style="display:flex;align-items:center;gap:12px">${logo}<div>
          <div style="font-size:${nameSz}px;font-weight:900;color:#1A2E35">${co}</div>
          ${v('f-tagline')?`<div style="font-size:10px;color:#A0B8BE">${v('f-tagline')}</div>`:''}
        </div></div>
        ${invTitleBlock(color, '#607D86')}
      </div>
    </div><div style="height:3px;background:${color}"></div>`;

  } else if (invLayout === 'modern-banner') {
    hdr = `<div style="background:${color};padding:${pad}px ${pad+16}px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
      <div style="display:flex;align-items:center;gap:12px">${logo}<div>
        <div style="font-size:${nameSz}px;font-weight:900;color:#fff">${co}</div>
        ${v('f-tagline')?`<div style="font-size:10px;color:rgba(255,255,255,.65)">${v('f-tagline')}</div>`:''}
      </div></div>
      <div style="text-align:right">
        <div style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-.5px">INVOICE</div>
        <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.8);margin-top:3px">#${invNum}</div>
        <div style="font-size:10px;color:rgba(255,255,255,.65);margin-top:2px;line-height:1.8">
          ${invDate?'Issue: '+invDate:''}${dueDate?'<br>Due: '+dueDate:''}
        </div>
        <div style="margin-top:6px">${statusBadge}</div>
      </div>
    </div>`;

  } else if (invLayout === 'minimal') {
    hdr = `<div style="height:4px;background:${color}"></div>
    <div style="padding:${pad}px ${pad+16}px;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:16px">
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
    hdr = `<div style="padding:${pad}px ${pad+16}px;background:#fff;display:flex;align-items:stretch;gap:16px">
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">${logo}
          <div style="font-size:${nameSz}px;font-weight:900;color:#1A2E35">${co}</div>
        </div>
        ${contactHtml}
      </div>
      <div style="width:180px;flex-shrink:0;background:${h2r(color,.06)};border:1.5px solid ${h2r(color,.2)};border-radius:10px;padding:14px;display:flex;flex-direction:column;justify-content:center">
        <div style="font-size:18px;font-weight:900;color:${color};letter-spacing:-.3px">INVOICE</div>
        <div style="font-size:11px;font-weight:700;color:#1A2E35;margin-top:5px">#${invNum}</div>
        <div style="font-size:10px;color:#607D86;margin-top:3px;line-height:1.9">${invDate?'Issue: '+invDate+'\n':''}${dueDate?'Due: '+dueDate:''}</div>
        <div style="margin-top:8px">${statusBadge}</div>
      </div>
    </div><div style="height:3px;background:${color}"></div>`;

  } else if (invLayout === 'centered') {
    hdr = `<div style="padding:${pad}px ${pad+16}px;background:#fff;text-align:center">
      <div style="display:flex;justify-content:center;margin-bottom:10px">${logo}</div>
      <div style="font-size:${nameSz}px;font-weight:900;color:#1A2E35">${co}</div>
      ${v('f-tagline')?`<div style="font-size:10px;color:#A0B8BE;margin-top:2px">${v('f-tagline')}</div>`:''}
      <div style="font-size:24px;font-weight:900;color:${color};letter-spacing:-.4px;margin-top:10px">INVOICE</div>
      <div style="font-size:11px;color:#607D86;margin-top:3px">#${invNum} &nbsp;·&nbsp; ${invDate}${dueDate?' &nbsp;·&nbsp; Due: '+dueDate:''}</div>
      <div style="margin-top:8px;display:flex;justify-content:center">${statusBadge}</div>
    </div><div style="height:3px;background:${color}"></div>`;

  } else if (invLayout === 'dark-header') {
    hdr = `<div style="background:#1A2E35;padding:${pad}px ${pad+16}px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
      <div style="display:flex;align-items:center;gap:12px">${logo}<div>
        <div style="font-size:${nameSz}px;font-weight:900;color:#fff">${co}</div>
        ${v('f-tagline')?`<div style="font-size:10px;color:rgba(255,255,255,.5)">${v('f-tagline')}</div>`:''}
      </div></div>
      <div style="text-align:right">
        <div style="font-size:24px;font-weight:900;color:${color};letter-spacing:-.4px">INVOICE</div>
        <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.7);margin-top:3px">#${invNum}</div>
        <div style="font-size:10px;color:rgba(255,255,255,.5);margin-top:2px;line-height:1.8">${invDate?'Issue: '+invDate:''}${dueDate?'<br>Due: '+dueDate:''}</div>
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
        <div style="font-size:10px;color:#607D86;line-height:1.8;margin-top:2px">${v('f-email')}<br>${v('f-phone')}</div>
      </div>
      <div style="padding:10px 12px;background:#F8FAFB;border-radius:8px;border:1px solid #E0EEF0">
        <div style="font-size:8px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.7px;margin-bottom:4px">Bill To</div>
        <div style="font-size:12px;font-weight:800;color:${client?'#1A2E35':'#A0B8BE'}">${client||'— Client Name —'}</div>
        <div style="font-size:10px;color:#607D86;line-height:1.8;margin-top:2px">
          ${cgst?'GST: '+cgst+'<br>':''}${cemail?cemail+'<br>':''}${cphone?cphone+'<br>':''}${caddr||''}
        </div>
      </div>
    </div>

    ${cat?`<div style="display:inline-flex;align-items:center;padding:4px 12px;background:${h2r(color,.1)};border-radius:20px;font-size:10px;font-weight:700;color:${color};margin-bottom:14px">${cat}</div>`:''}

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
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:11px;border-bottom:1px solid #E0EEF0"><span style="color:${color}">GST (${v('f-inv-gst')||0}%)</span><span id="invTax" style="font-weight:700;color:${color}">₹0</span></div>
      <div id="invDiscRow" style="display:none;justify-content:space-between;padding:4px 0;font-size:11px;border-bottom:1px solid #E0EEF0"><span style="color:#26C281">Discount</span><span id="invDisc" style="font-weight:700;color:#26C281">-₹0</span></div>
      <div style="display:flex;justify-content:space-between;padding:8px 10px;background:${color};border-radius:7px;margin-top:6px"><span style="font-size:11px;font-weight:800;color:#fff">Total Due</span><span id="invGrand" style="font-size:14px;font-weight:900;color:#fff">₹0</span></div>
    </div>

    ${(bank||acct||upi) ? `<div style="margin-top:16px;padding:10px 12px;background:${h2r(color,.06)};border-radius:8px;border-left:3px solid ${color}">
      <div style="font-size:9px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px">Payment Details</div>
      <div style="font-size:10px;color:#607D86;line-height:2">
        ${bank?'<b>Bank:</b> '+bank+'&nbsp;&nbsp;':''} ${acct?'<b>A/C:</b> '+acct:''}${ifsc?'&nbsp;&nbsp;<b>IFSC:</b> '+ifsc:''}<br>
        ${upi?'<b>UPI:</b> '+upi+'&nbsp;&nbsp;':''} ${terms?'<b>Terms:</b> '+terms:''}
      </div>
    </div>` : ''}

    <div style="margin-top:16px;padding-top:14px;border-top:1px solid #E0EEF0;display:flex;justify-content:space-between;align-items:flex-end">
      <div style="font-size:10px;color:#A0B8BE;line-height:1.7;max-width:280px">
        ${notes||'Thank you for your business!'}
      </div>
      <div style="text-align:right">
        <div style="width:80px;height:1.5px;background:${color};margin:0 0 4px auto"></div>
        <div style="font-size:11px;font-weight:800;color:#1A2E35">${v('f-sig')||'Sign'}</div>
        <div style="font-size:9px;color:#A0B8BE">${co}</div>
      </div>
    </div>`;

  // FOOTER
  document.getElementById('docFooterZone').innerHTML = `
    <div style="height:3px;background:${color}"></div>
    <div style="padding:8px 40px;background:#F8FAFB;display:flex;justify-content:space-between;font-size:9px;color:#A0B8BE;border-top:1px solid #E0EEF0">
      <span style="font-weight:700">${co}</span>
      <span>${v('f-web')||v('f-email')}</span>
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
    data.amount = grandEl ? parseFloat(grandEl.textContent.replace(/[^0-9.-]+/g,"")) : 0;
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
  if (hash) {
    const tabBtn = document.querySelector(`.dt[onclick*="'${hash}'"]`);
    if (tabBtn) tabBtn.click();
    
    // Hide the tabs container to show ONLY the requested template
    const tabsContainer = document.querySelector('.doc-tabs');
    if (tabsContainer) {
      tabsContainer.style.display = 'none';
      tabsContainer.style.visibility = 'hidden';
      tabsContainer.style.height = '0px';
    }
  }
}

applyHash();
window.addEventListener('DOMContentLoaded', applyHash);
window.addEventListener('hashchange', applyHash);


