import re
with open(r"C:\M Business\M Business\src\components\ClientDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('validActive === "payments"')
if idx != -1:
    print(text[idx-50:idx+500].encode("ascii", "ignore").decode("ascii"))
