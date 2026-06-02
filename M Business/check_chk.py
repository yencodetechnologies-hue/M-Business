import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('function chk(')
if idx != -1:
    print(text[idx:idx+200].encode("ascii", "ignore").decode("ascii"))
