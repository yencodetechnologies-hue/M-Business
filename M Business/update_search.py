import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Add state for dashSearch
if 'const [dashSearch, setDashSearch] = useState("");' not in text:
    idx = text.find('const [active, setActive] = useState("dashboard");')
    if idx != -1:
        text = text[:idx] + 'const [dashSearch, setDashSearch] = useState("");\n  ' + text[idx:]

# 2. Add onChange to the search input
old_input = '<input type="text" placeholder="Search projects, invoices, clients..." />'
new_input = '<input type="text" placeholder="Search projects, invoices, clients..." value={dashSearch} onChange={(e) => setDashSearch(e.target.value)} />'
text = text.replace(old_input, new_input)

# 3. Add filtering to the rendering loops
# We need to filter `projects`, `clients`, `invoices`, `employees` based on `dashSearch`

# Projects rendering logic:
# text = text.replace('projects.slice(0, 3).map(p =>', 'projects.filter(p => !dashSearch || (p.name || p.projectName || p.id || "").toLowerCase().includes(dashSearch.toLowerCase())).slice(0, 3).map(p =>')
old_proj = 'projects.slice(0, 3).map(p =>'
new_proj = 'projects.filter(p => !dashSearch || (p.name || p.projectName || p.id || "").toLowerCase().includes(dashSearch.toLowerCase())).slice(0, 3).map(p =>'
text = text.replace(old_proj, new_proj)

old_emp = 'employees.slice(0, 4).map((e, i) =>'
new_emp = 'employees.filter(e => !dashSearch || (e.name || e.email || "").toLowerCase().includes(dashSearch.toLowerCase())).slice(0, 4).map((e, i) =>'
text = text.replace(old_emp, new_emp)

old_inv = 'invoices.slice(0, 4).map(inv =>'
new_inv = 'invoices.filter(i => !dashSearch || (i.invoiceNo || i.clientName || "").toLowerCase().includes(dashSearch.toLowerCase())).slice(0, 4).map(inv =>'
text = text.replace(old_inv, new_inv)

with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "w", encoding="utf-8") as f:
    f.write(text)
print("Updated Search Functionality")
