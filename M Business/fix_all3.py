import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Fix all remaining render() calls in onchange that we missed
text = text.replace('onchange="render()"', 'onchange="safeRender()"')

# 2. Fix footer - it is checked by default, uncheck it so footer doesnt show by default
text = text.replace(
    '<input type="checkbox" id="show-footer" checked onchange="safeRender()">Footer Bar',
    '<input type="checkbox" id="show-footer" onchange="safeRender()">Footer Bar'
)

# 3. Fix ec() - use setTimeout to avoid focus issues after re-render
old_ec = 'function ec(cmd, val) { const ed = document.getElementById(\'lbEditor\'); if(ed) { ed.focus(); document.execCommand(cmd, false, val||null); } }'
new_ec = '''function ec(cmd, val) {
  const ed = document.getElementById('lbEditor');
  if (!ed) return;
  ed.focus();
  try { document.execCommand(cmd, false, val||null); } catch(e) {}
  // Save content after formatting
  _lbEditorContent = ed.innerHTML;
}'''
text = text.replace(old_ec, new_ec)

# 4. Replace send button with a proper send modal trigger
old_send_btn = '<button class="btn-sm" onclick="sendDoc()"><i class="ti ti-send" style="font-size:12px"></i> Send</button>'
new_send_btn = '<button class="btn-sm" onclick="openSendModal()"><i class="ti ti-send" style="font-size:12px"></i> Send</button>'
text = text.replace(old_send_btn, new_send_btn)

# 5. Add send modal HTML before </body>
send_modal_html = """
<!-- SEND MODAL -->
<div id="sendModal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);align-items:center;justify-content:center;">
  <div style="background:#fff;border-radius:18px;padding:32px;width:360px;box-shadow:0 20px 60px rgba(0,0,0,0.25);position:relative;">
    <div style="font-size:17px;font-weight:800;color:#1A2E35;margin-bottom:6px;">Send Document</div>
    <div style="font-size:12px;color:#607D86;margin-bottom:20px;">Choose who to send this document to</div>
    
    <div style="margin-bottom:14px;">
      <label style="font-size:10px;font-weight:700;color:#1A2E35;text-transform:uppercase;letter-spacing:.7px;display:block;margin-bottom:6px;">Send To</label>
      <select id="sendTo" style="width:100%;padding:9px 12px;border:1.5px solid #E0EEF0;border-radius:8px;font-size:13px;font-family:inherit;color:#1A2E35;background:#fff;outline:none;">
        <option value="client">Client</option>
        <option value="employee">Employee</option>
      </select>
    </div>
    
    <div style="margin-bottom:20px;">
      <label style="font-size:10px;font-weight:700;color:#1A2E35;text-transform:uppercase;letter-spacing:.7px;display:block;margin-bottom:6px;">Recipient Name</label>
      <input type="text" id="f-clientName" placeholder="Enter client or employee name..." style="width:100%;padding:9px 12px;border:1.5px solid #E0EEF0;border-radius:8px;font-size:13px;font-family:inherit;color:#1A2E35;outline:none;" 
        onfocus="this.style.borderColor=' var(--app-accent, var(--app-accent, #00BCD4))'" onblur="this.style.borderColor='#E0EEF0'"/>
    </div>
    
    <div style="display:flex;gap:10px;">
      <button onclick="closeSendModal()" style="flex:1;padding:10px;border:1.5px solid #E0EEF0;border-radius:8px;background:#fff;font-size:13px;font-weight:600;color:#607D86;cursor:pointer;font-family:inherit;">Cancel</button>
      <button onclick="sendDoc()" style="flex:2;padding:10px;border:none;border-radius:8px;background:linear-gradient(135deg, var(--app-accent, var(--app-accent, #00BCD4)),var(--app-accent2, #00ACC1));font-size:13px;font-weight:700;color:#fff;cursor:pointer;font-family:inherit;">
        <i class="ti ti-send" style="margin-right:6px;"></i>Send Now
      </button>
    </div>
  </div>
</div>
"""

old_body_end = '</body>\n</html>'
text = text.replace(old_body_end, send_modal_html + '\n</body>\n</html>')

# 6. Add modal open/CloseJS functions before </script>
old_end_script = "applyHash();\nwindow.addEventListener('DOMContentLoaded', applyHash);\nwindow.addEventListener('hashchange', applyHash);"

new_end_script = """// ── SEND MODAL ──
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
document.getElementById('sendModal').addEventListener('click', function(e) {
  if (e.target === this) closeSendModal();
});

applyHash();
window.addEventListener('DOMContentLoaded', applyHash);
window.addEventListener('hashchange', applyHash);"""

text = text.replace(old_end_script, new_end_script)

# 7. Fix sendDoc to also Closemodal and show better toast
old_send_func = """function sendDoc() {
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
}"""

new_send_func = """function sendDoc() {
  const hash = window.location.hash.substring(1) || docType;
  const clientName = (document.getElementById('f-clientName') ? document.getElementById('f-clientName').value : '') || 'Client';
  const sendTo = document.getElementById('sendTo') ? document.getElementById('sendTo').value : 'client';
  const data = {
    docType: hash,
    sendTo: sendTo,
    htmlContent: document.getElementById('mainPaper').innerHTML,
    client: clientName,
  };
  
  if (hash === 'inv') {
    const grandEl = document.getElementById('invGrand');
    data.invoiceNo = document.getElementById('f-inv-num') ? document.getElementById('f-inv-num').value : '';
    data.amount = grandEl ? parseFloat(grandEl.textContent.replace(/[^0-9.-]+/g,"")) : 0;
  }
  
  // Closemodal
  closeSendModal();
  
  // Show toast
  const t = document.createElement('div');
  t.style.cssText = "position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#26C281, var(--app-accent, var(--app-accent, #00BCD4)));color:#fff;padding:14px 22px;border-radius:12px;font-weight:700;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.15);font-size:13px;display:flex;align-items:center;gap:8px;";
  t.innerHTML = '<i class="ti ti-circle-check" style="font-size:18px;"></i> Document sent to ' + clientName + '!';
  document.body.appendChild(t);
  setTimeout(()=>{ t.style.transition='opacity 0.4s'; t.style.opacity='0'; setTimeout(()=>t.remove(),400); }, 3000);
  
  // Send to React parent
  window.parent.postMessage({ type: 'SEND_DOCUMENT', payload: data }, '*');
}"""

text = text.replace(old_send_func, new_send_func)

with open(r"C:\M Business\M Business\public\template-designer.html", "w", encoding="utf-8") as f:
    f.write(text)
print("All fixes applied!")
