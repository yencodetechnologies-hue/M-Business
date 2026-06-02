import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('Click to upload logo')
if idx != -1:
    print(text[max(0, idx-1000):idx+1500].encode("ascii", "ignore").decode("ascii"))
