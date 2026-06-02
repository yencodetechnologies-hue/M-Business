import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('className="dash-stats"')
if idx != -1:
    print(text[idx-500:idx+2500].encode("ascii", "ignore").decode("ascii"))
