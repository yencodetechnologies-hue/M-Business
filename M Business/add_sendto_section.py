import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# Add a "Send To" section at the END of ctrl-lh, just before the QUOTATION section
send_to_section = """
      <!-- SEND TO SECTION (shown when in letterhead mode via hash) -->
      <div id="sendToSection" style="display:none;margin-top:6px;">
        <div class="acc-item">
          <div class="acc-hdr onclick="toggleAcc(this)">
            <div class="acc-icon" style="background:#E8FAF3;color:#26C281"><i class="ti ti-send"></i></div>
            <div class="acc-title">Send Document To</div>
            <i class="ti ti-chevron-up acc-arrow open"></i>
          </div>
          <div class="acc-body open">
            <div class="fg">
              <label class="fl">Recipient Type</label>
              <select class="fi" id="lh-recipient-type" onchange="safeRender()">
                <option value="client">Client</option>
                <option value="employee">Employee</option>
              </select>
            </div>
            <div class="fg">
              <label class="fl">Recipient Name</label>
              <input class="fi" id="lh-recipient-name" placeholder="Enter client or employee name..." oninput="safeRender()">
            </div>
            <div class="fg">
              <label class="fl">Recipient Email (optional)</label>
              <input class="fi" id="lh-recipient-email" placeholder="email@example.com" type="email">
            </div>
            <button onclick="openSendModal()" style="width:100%;padding:10px;background:linear-gradient(135deg, var(--app-accent, #00BCD4),#00ACC1);border:none;border-radius:8px;color:#fff;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:6px;">
              <i class="ti ti-send" style="font-size:15px;"></i> Send Letterhead
            </button>
          </div>
        </div>
      </div>
"""

# Insert before QUOTATION CONTROLS
old_marker = "<!--  QUOTATION CONTROLS  -->"
if old_marker in text:
    text = text.replace(old_marker, send_to_section + "\n      " + old_marker)
    print("Inserted sendToSection")
else:
    print("Marker not found!")

# Fix the broken onclick in the new section
text = text.replace(
    'class="acc-hdr onclick="toggleAcc(this)">',
    'class="acc-hdr" onclick="toggleAcc(this)">'
)

# Show sendToSection when hash is lh
old_applyhash_end = "window._renderReady = true;\napplyHash();"
new_applyhash_end = """window._renderReady = true;
// Show send-to section only in letterhead hash mode
if(location.hash.substring(1) === 'lh') {
  var sts = document.getElementById('sendToSection');
  if(sts) sts.style.display = '';
}
applyHash();"""
text = text.replace(old_applyhash_end, new_applyhash_end)

# Update sendDoc to use lh recipient fields if available
old_send_client = "const clientName = (document.getElementById('f-clientName') ? document.getElementById('f-clientName').value : '') || 'Client';"
new_send_client = """const lhName = document.getElementById('lh-recipient-name') ? document.getElementById('lh-recipient-name').value : '';
  const modalName = document.getElementById('f-clientName') ? document.getElementById('f-clientName').value : '';
  const clientName = lhName || modalName || 'Client';
  const lhType = document.getElementById('lh-recipient-type') ? document.getElementById('lh-recipient-type').value : 'client';"""
text = text.replace(old_send_client, new_send_client)

# Fix sendTo to use lh-recipient-type when available
old_sendto = "const sendTo = document.getElementById('sendTo') ? document.getElementById('sendTo').value : 'client';"
new_sendto = "const sendTo = lhType || (document.getElementById('sendTo') ? document.getElementById('sendTo').value : 'client');"
text = text.replace(old_sendto, new_sendto)

with open(r"C:\M Business\M Business\public\template-designer.html", "w", encoding="utf-8") as f:
    f.write(text)
print("Done")
