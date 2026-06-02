import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('!client?')
if idx != -1:
    print(text[max(0, idx-50):idx+50].encode("ascii", "ignore").decode("ascii"))
