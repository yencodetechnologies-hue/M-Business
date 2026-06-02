import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Update contactBlock
old_contact = """function contactBlock(textColor) {
  const lines = [];
  if (chk('show-addr') && v('f-addr')) lines.push(v('f-addr'));
  if (chk('show-phone') && v('f-phone')) lines.push(`<b>T:</b> ${v('f-phone')}`);
  if (chk('show-email') && v('f-email')) lines.push(`<b>E:</b> ${v('f-email')}`);
  if (chk('show-web') && v('f-web')) lines.push(v('f-web'));
  if (chk('show-gst') && v('f-gst')) lines.push(`GST: ${v('f-gst')}`);
  return `<div style="font-size:10px;color:${textColor};line-height:1.9">${lines.join('<br>')}</div>`;
}"""
new_contact = """function contactBlock(textColor) {
  const lines = [];
  if (v('f-addr')) lines.push(v('f-addr'));
  if (v('f-phone')) lines.push(`<b>T:</b> ${v('f-phone')}`);
  if (v('f-email')) lines.push(`<b>E:</b> ${v('f-email')}`);
  if (v('f-web')) lines.push(v('f-web'));
  if (v('f-gst')) lines.push(`GST: ${v('f-gst')}`);
  return `<div style="font-size:10px;color:${textColor};line-height:1.9">${lines.join('<br>')}</div>`;
}"""
if old_contact in text:
    text = text.replace(old_contact, new_contact)
else:
    print("Could not find contactBlock")

# 2. Update renderLH
old_tl = "const tl = chk('show-tagline') ? v('f-tagline') : '';"
new_tl = "const tl = v('f-tagline');"
if old_tl in text:
    text = text.replace(old_tl, new_tl)

# 3. Update renderQuo
if old_tl in text:
    text = text.replace(old_tl, new_tl)

# 4. Update renderInv
if old_tl in text:
    text = text.replace(old_tl, new_tl)

# 5. Update renderProp
if old_tl in text:
    text = text.replace(old_tl, new_tl)

with open(r"C:\M Business\M Business\public\template-designer.html", "w", encoding="utf-8") as f:
    f.write(text)
print("Updated template-designer.html logic")
