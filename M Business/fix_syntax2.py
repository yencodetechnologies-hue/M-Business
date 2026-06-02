import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

text = re.sub(r"!client\?'style=\"color:#A0B8BE\"'}", r"!client?'style=\"color:#A0B8BE\"':''}", text)

with open(r"C:\M Business\M Business\public\template-designer.html", "w", encoding="utf-8") as f:
    f.write(text)
print("Regex replace done")
