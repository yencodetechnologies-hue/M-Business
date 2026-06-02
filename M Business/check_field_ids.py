import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# Check what field IDs exist for the shared panel inputs
fields = re.findall(r'id="(f-[a-z\-]+)"', text)
unique = sorted(set(fields))
for f in unique:
    print(f)
