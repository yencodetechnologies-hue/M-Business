import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# Check show-footer checkbox
idx = text.find("show-footer")
if idx != -1:
    print(text[max(0,idx-200):idx+300].encode("ascii","ignore").decode("ascii"))
else:
    print("show-footer NOT FOUND")
