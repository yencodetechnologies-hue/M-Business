import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('const menuGroups = [')
if idx != -1:
    print(text[idx:idx+2500].encode("ascii", "ignore").decode("ascii"))
else:
    print("Not found menuGroups")
