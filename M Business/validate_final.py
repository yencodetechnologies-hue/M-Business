import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# Validate script syntax
scripts = re.findall(r"<script>(.*?)</script>", text, re.DOTALL)
with open(r"C:\M Business\M Business\script_final.js", "w", encoding="utf-8") as f:
    f.write(scripts[0])
print("Extracted, length:", len(scripts[0]))
