import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# Find the main Dashboard component useEffect for adding the message listener
# Look for the main useEffect in the Dashboard component
idx = text.find("function Dashboard(")
if idx != -1:
    # Find the first useEffect after Dashboard
    ue_idx = text.find("useEffect(", idx)
    if ue_idx != -1:
        print(text[ue_idx:ue_idx+300].encode("ascii","ignore").decode("ascii"))
