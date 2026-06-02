import re
with open(r"C:\M Business\M Business\src\components\ClientDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

matches = re.finditer(r'active === "[a-z]+"', text)
for m in matches:
    print(m.group())
