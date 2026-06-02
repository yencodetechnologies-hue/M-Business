import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find where the script tag is
for i, line in enumerate(lines):
    if "<script>" in line and "oninput" not in line and "onclick" not in line:
        print(f"Line {i+1}: {line.strip()[:80]}")
    if "</body>" in line.lower():
        print(f"Line {i+1}: BODY END")
