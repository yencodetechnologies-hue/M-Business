import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# Check the printDoc function after our changes
idx = text.find("function printDoc()")
if idx != -1:
    print(text[idx:idx+1000].encode("ascii","ignore").decode("ascii"))
