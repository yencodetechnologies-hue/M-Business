import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

send_to_section = """
      <!-- SEND TO SECTION (shown only in letterhead hash mode) -->
      <div id="sendToSection" style="display:none;margin-top:6px;">
        <div class="acc-item">
          <div class="acc-hdr" onclick="toggleAcc(this)">
            <div class="acc-icon" style="background:#E8FAF3;color:#26C281"><i class="ti ti-send"></i></div>
            <div class="acc-title">Send Document To</div>
            <i class="ti ti-chevron-up acc-arrow open"></i>
          </div>
          <div class="acc-body open">
            <div class="fg">
              <label class="fl">Recipient Type</label>
              <select class="fi" id="lh-recipient-type">
                <option value="client">Client</option>
                <option value="employee">Employee</option>
              </select>
            </div>
            <div class="fg">
              <label class="fl">Recipient Name</label>
              <input class="fi" id="lh-recipient-name" placeholder="Enter client or employee name...">
            </div>
            <div class="fg">
              <label class="fl">Recipient Email (optional)</label>
              <input class="fi" id="lh-recipient-email" placeholder="email@example.com" type="email">
            </div>
            <button onclick="sendFromLetterhead()" style="width:100%;padding:10px;background:linear-gradient(135deg, var(--app-accent, #00BCD4),#00ACC1);border:none;border-radius:8px;color:#fff;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:6px;">
              <i class="ti ti-send" style="font-size:15px;"></i> Send Letterhead
            </button>
          </div>
        </div>
      </div>
"""

old_quo_marker = "<!--  QUOTATION CONTROLS  -->"
if old_quo_marker in text:
    text = text.replace(old_quo_marker, send_to_section + "\n      " + old_quo_marker)
    print("Inserted sendToSection before QUOTATION CONTROLS")
else:
    print("Marker not found! Trying alternate...")

# Add sendFromLetterhead function
old_send_func_area = "// ── SEND MODAL ──"
new_send_letterhead = """// ── SEND FROM LETTERHEAD ──
function sendFromLetterhead() {
  const name = (document.getElementById('lh-recipient-name') ? document.getElementById('lh-recipient-name').value.trim() : '');
  const type = (document.getElementById('lh-recipient-type') ? document.getElementById('lh-recipient-type').value : 'client');
  const email = (document.getElementById('lh-recipient-email') ? document.getElementById('lh-recipient-email').value.trim() : '');
  
  if (!name) {
    const nameEl = document.getElementById('lh-recipient-name');
    if(nameEl) { nameEl.style.borderColor = '#F05C5C'; nameEl.focus(); setTimeout(() => nameEl.style.borderColor = '', 2000); }
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
  t.style.cssText = "position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#26C281, var(--app-accent, #00BCD4));color:#fff;padding:14px 22px;border-radius:12px;font-weight:700;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.15);font-size:13px;display:flex;align-items:center;gap:8px;";
  t.innerHTML = '<i class="ti ti-circle-check" style="font-size:18px;"></i> Letterhead sent to ' + name + '!';
  document.body.appendChild(t);
  setTimeout(() => { t.style.transition='opacity 0.4s'; t.style.opacity='0'; setTimeout(() => t.remove(), 400); }, 3000);
}

"""
if "// ── SEND MODAL ──" in text:
    text = text.replace("// ── SEND MODAL ──", new_send_letterhead + "// ── SEND MODAL ──")
    print("Added sendFromLetterhead function")

with open(r"C:\M Business\M Business\public\template-designer.html", "w", encoding="utf-8") as f:
    f.write(text)
print("Done")
