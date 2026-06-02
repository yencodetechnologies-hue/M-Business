import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

send_to_html = """
      <!-- SEND TO SECTION -->
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
              <input class="fi" id="lh-recipient-name" placeholder="Enter name...">
            </div>
            <div class="fg">
              <label class="fl">Email (optional)</label>
              <input class="fi" id="lh-recipient-email" placeholder="email@example.com" type="email">
            </div>
            <button onclick="sendFromLetterhead()" style="width:100%;padding:10px;background:linear-gradient(135deg,#00BCD4,#00ACC1);border:none;border-radius:8px;color:#fff;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:6px;">
              <i class="ti ti-send" style="font-size:15px;"></i>Send Letterhead
            </button>
          </div>
        </div>
      </div>

"""

# Insert before ctrl-quo div
old_target = '      <!--  QUOTATION CONTROLS  -->\r\n      <div '
new_target = send_to_html + '      <!--  QUOTATION CONTROLS  -->\r\n      <div '
if old_target in text:
    text = text.replace(old_target, new_target, 1)
    print("Inserted sendToSection OK")
else:
    # Try without \r
    old_target2 = "      <!--  QUOTATION CONTROLS  -->\n      <div "
    if old_target2 in text:
        text = text.replace(old_target2, send_to_html + old_target2, 1)
        print("Inserted sendToSection OK (no CR)")
    else:
        print("NOT FOUND, trying simple insert before ctrl-quo")
        idx_ctrl_quo = text.find('<div id="ctrl-quo"')
        if idx_ctrl_quo != -1:
            text = text[:idx_ctrl_quo] + send_to_html + text[idx_ctrl_quo:]
            print("Inserted before ctrl-quo directly")

# Show sendToSection when hash is lh  
old_show = """window._renderReady = true;
// Show send-to section only in letterhead hash mode
if(location.hash.substring(1) === 'lh') {
  var sts = document.getElementById('sendToSection');
  if(sts) sts.style.display = '';
}
applyHash();"""

if old_show not in text:
    # Already added or different - ensure it's there
    old_ready = "window._renderReady = true;\napplyHash();"
    new_ready = """window._renderReady = true;
if(location.hash.substring(1) === 'lh') {
  var sts = document.getElementById('sendToSection');
  if(sts) sts.style.display = '';
}
applyHash();"""
    if old_ready in text:
        text = text.replace(old_ready, new_ready, 1)
        print("Added sendToSection show logic")

with open(r"C:\M Business\M Business\public\template-designer.html", "w", encoding="utf-8") as f:
    f.write(text)
print("Done")
