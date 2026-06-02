import re
with open(r"C:\M Business\M Business\src\components\ClientDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# Find ClientDashboard component function and its props
idx = text.find("function ClientDashboard")
if idx == -1:
    idx = text.find("export default function ClientDashboard")
if idx != -1:
    print(text[idx:idx+300].encode("ascii","ignore").decode("ascii"))

# Also check what user/client prop is passed
idx2 = text.find("clientName")
if idx2 != -1:
    print("---clientName---")
    print(text[max(0,idx2-100):idx2+200].encode("ascii","ignore").decode("ascii"))
