import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# Find SEND_DOCUMENT listener
idx = text.find("SEND_DOCUMENT")
if idx != -1:
    print(text[max(0,idx-300):idx+600].encode("ascii","ignore").decode("ascii"))
else:
    print("SEND_DOCUMENT not found!")
