import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# Find the letterhead-specific controls section (ctrl-lh)
idx = text.find('id="ctrl-lh"')
if idx != -1:
    print(text[idx:idx+600].encode("ascii","ignore").decode("ascii"))
