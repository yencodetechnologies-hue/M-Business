import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# The issue: The comment has unicode dashes (unicode ─). Let me check exact content
idx = text.find("QUOTATION")
if idx != -1:
    print(repr(text[max(0,idx-30):idx+60]))
