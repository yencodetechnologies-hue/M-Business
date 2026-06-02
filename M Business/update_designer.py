import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Add "Send" button
idx_btn = text.find('<button class="btn-sm solid" onclick="printDoc()">')
if idx_btn != -1:
    new_btns = '<button class="btn-sm" onclick="sendDoc()"><i class="ti ti-send" style="font-size:12px"></i> Send</button>\n        ' + '<button class="btn-sm solid" onclick="printDoc()">'
    text = text.replace('<button class="btn-sm solid" onclick="printDoc()">', new_btns)

# 2. Add sendDoc() function
idx_func = text.find('// ── PRINT ──')
if idx_func != -1:
    send_func = """// ── SEND ──
function sendDoc() {
  const hash = window.location.hash.substring(1) || 'inv';
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
  
  // Show sending toast
  const t = document.createElement('div');
  t.style.cssText = "position:fixed;bottom:20px;right:20px;background:#26C281;color:#fff;padding:12px 24px;border-radius:8px;font-weight:600;z-index:9999;";
  t.innerHTML = "o. Document sent!";
  document.body.appendChild(t);
  setTimeout(()=>t.remove(), 3000);
  
  // Send to React
  window.parent.postMessage({ type: 'SEND_DOCUMENT', payload: data }, '*');
}

"""
    text = text.replace('// ── PRINT ──', send_func + '// ── PRINT ──')

with open(r"C:\M Business\M Business\public\template-designer.html", "w", encoding="utf-8") as f:
    f.write(text)
print("Updated template-designer.html")
