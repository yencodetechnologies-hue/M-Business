import re
with open(r"C:\M Business\M Business\src\components\ClientDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# Check Messages tab
idx = text.find("messages")
if idx == -1:
    idx = text.find("Messages")
if idx != -1:
    print(text[max(0,idx-200):idx+600].encode("ascii","ignore").decode("ascii"))
