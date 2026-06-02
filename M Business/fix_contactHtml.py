import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# Replace hardcoded contactHtml in renderInv
old_inv_contact = """const contactHtml = `<div style="font-size:10px;color:#607D86;line-height:1.9">
    ${v('f-addr') ? v('f-addr') + '<br>' : ''}
    ${v('f-phone') ? '<b>T:</b> ' + v('f-phone') + '<br>' : ''}
    ${v('f-email') ? '<b>E:</b> ' + v('f-email') + '<br>' : ''}
    ${v('f-gst') ? 'GST: ' + v('f-gst') : ''}
  </div>`;"""

new_inv_contact = """const contactHtml = contactBlock('#607D86');"""

if old_inv_contact in text:
    text = text.replace(old_inv_contact, new_inv_contact)
    print("Replaced in renderInv")
else:
    print("Not found in renderInv")

with open(r"C:\M Business\M Business\public\template-designer.html", "w", encoding="utf-8") as f:
    f.write(text)
