import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('function switchTab(')
if idx != -1:
    print(text[idx:idx+800].encode("ascii", "ignore").decode("ascii"))
