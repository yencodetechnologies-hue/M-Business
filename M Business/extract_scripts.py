import re

with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# Extract script blocks
scripts = re.findall(r'<script>(.*?)</script>', text, re.DOTALL)
for i, s in enumerate(scripts):
    with open(f"C:\M Business\M Business\script_{i}.js", "w", encoding="utf-8") as out:
        out.write(s)
    print(f"Extracted script {i}")
