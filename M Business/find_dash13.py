import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('{/* Top Section: Company Info & Stats Grid */}')
if idx != -1:
    end_idx = text.find('{validActive === ', idx)
    print(f"End index: {end_idx}")
    print(text[end_idx-200:end_idx].encode("ascii", "ignore").decode("ascii"))
