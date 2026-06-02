import re
with open(r"C:\M Business\M Business\src\components\ClientDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('active === "reports"')
if idx != -1:
    print(text[max(0, idx-100):idx+500].encode("ascii", "ignore").decode("ascii"))
