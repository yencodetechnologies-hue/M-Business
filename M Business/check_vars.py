import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

vars_to_check = ["projects", "invoices", "totalIncome", "totalExpenses", "employees", "clients", "totalRevenue"]
for v in vars_to_check:
    print(f"{v}: {'const ' + v in text or 'let ' + v in text or 'var ' + v in text or '{' + v + '}' in text}")
