import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# Let's search for "New"
idx = text.find('Dynamic Action Buttons based on validActive')
if idx != -1:
    print(text[idx-200:idx+1500].encode("ascii", "ignore").decode("ascii"))
