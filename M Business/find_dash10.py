import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('{/* Top Section: Company Info & Stats Grid */}')
if idx != -1:
    end_idx = text.find('validActive === "mysubscriptions"', idx)
    print(f"Start index: {idx}, End index: {end_idx}")
