import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# Find id="ctrl-quo" 
idx = text.find('id="ctrl-quo"')
if idx != -1:
    section_before = text[max(0, idx-400):idx]
    print("Before ctrl-quo:")
    print(section_before.encode("ascii","ignore").decode("ascii"))
