import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# Let's search the whole file for "income" or "revenue" or "expenses"
import sys
for line in text.split('\n'):
    if "income" in line.lower() or "expense" in line.lower() or "revenue" in line.lower():
        print(line.strip())
