import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('validActive === "clients"')
if idx != -1:
    print(text[idx-200:idx].encode("ascii", "ignore").decode("ascii"))
