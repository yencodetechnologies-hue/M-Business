import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('dashSearch')
if idx != -1:
    print(text[max(0, idx-500):idx+500].encode("ascii", "ignore").decode("ascii"))
