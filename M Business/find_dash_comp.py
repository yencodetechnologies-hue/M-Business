import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('function Dashboard(')
if idx != -1:
    print(text[max(0, idx-100):idx+500].encode("ascii", "ignore").decode("ascii"))
else:
    idx2 = text.find('function SubAdminDashboard(')
    if idx2 != -1:
        print("Found SubAdminDashboard but no Dashboard")
