import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('const [active, setActive] = useState(() => localStorage.getItem("activeTab_subadmin") || "dashboard");')
if idx != -1:
    text = text[:idx] + 'const [dashSearch, setDashSearch] = useState("");\n  ' + text[idx:]
    with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("Injected dashSearch successfully")
else:
    print("Could not find the line")
