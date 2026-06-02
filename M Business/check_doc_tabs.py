import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# Check the doc-tabs area HTML
idx = text.find('class="doc-tabs"')
if idx == -1:
    idx = text.find('class="dt"')
if idx != -1:
    print(text[max(0,idx-200):idx+600].encode("ascii","ignore").decode("ascii"))
