import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# Add templates to allowedKeys
if '"templates"' not in text:
    text = text.replace('allowedKeys.push("dashboard", ', 'allowedKeys.push("dashboard", "templates", ')

# Find the sidebar group "FINANCE" or "PERFORMANCE"
# In the screenshot, we see:
# PROJECTS
#   Projects
#   Tasks
#   Project Status
#   Calendar
# FINANCE
#   Quotations
#   Project Proposals
#   Invoices
#   Accounts
#   Payments
#   Expenses

# I should add Templates maybe under FINANCE or a new category?
# Actually I'll just find the exact text for the menu groups.
idx = text.find('const renderSidebar = () =>')
if idx != -1:
    print(text[idx:idx+2500].encode("ascii", "ignore").decode("ascii"))
