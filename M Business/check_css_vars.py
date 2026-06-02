import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# Check the CSS for the --teal color variable
idx = text.find(":root")
if idx != -1:
    print(text[idx:idx+400].encode("ascii","ignore").decode("ascii"))
