import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace("!client?'style=\\\"color:#A0B8BE\\\"'}", "!client?'style=\\\"color:#A0B8BE\\\"':''}")

with open(r"C:\M Business\M Business\public\template-designer.html", "w", encoding="utf-8") as f:
    f.write(text)
print("Fixed syntax error")
