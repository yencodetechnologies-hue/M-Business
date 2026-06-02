import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

scripts = re.findall(r"<script>(.*?)</script>", text, re.DOTALL)
with open(r"C:\M Business\M Business\script_validate.js", "w", encoding="utf-8") as out:
    out.write(scripts[-1])  # main script (last one)
print("Extracted, scripts found:", len(scripts))
