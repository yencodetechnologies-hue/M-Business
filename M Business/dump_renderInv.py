import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('function renderInv()')
end_idx = text.find('function renderProp()')
if idx != -1 and end_idx != -1:
    content = text[idx:end_idx]
    with open(r"C:\M Business\M Business\renderInv_content.js", "w", encoding="utf-8") as out:
        out.write(content)
