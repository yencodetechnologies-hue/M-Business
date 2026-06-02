import re

with open('C:\\M Business\\M Business\\src\\components\\SubAdminDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

nav_str = '''const NAV = [
    { key: "dashboard", icon: "ti-layout-dashboard", label: "Dashboard" },
    {
      label: "Internal Management",
      type: "group",
      items: [
        { key: "clients", icon: "ti-building", label: "Clients" },
        { key: "employees", icon: "ti-users", label: "Employees" },
        { key: "vendors", icon: "ti-truck-delivery", label: "Vendors" },
      ]
    },
    {
      label: "Projects",
      type: "group",
      items: [
        { key: "projects", icon: "ti-briefcase", label: "Projects" },
        { key: "tasks", icon: "ti-checkbox", label: "Tasks" },
        { key: "tracking", icon: "ti-chart-pie", label: "Project Status" },
        { key: "calendar", icon: "ti-calendar-event", label: "Calendar" },
      ]
    },
    {
      label: "Finance",
      type: "group",
      items: [
        { key: "quotations", icon: "ti-file-invoice", label: "Quotations" },
        { key: "proposals", icon: "ti-presentation-analytics", label: "Project Proposals" },
        { key: "invoices", icon: "ti-receipt", label: "Invoices" },
        { key: "accounts", icon: "ti-wallet", label: "Accounts" },
        { key: "payments", icon: "ti-arrows-right-left", label: "Payments" },
        { key: "expenses", icon: "ti-cash", label: "Expenses" },
      ]
    },
    {
      label: "Resources",
      type: "group",
      items: [
        { key: "interviews", icon: "ti-microphone", label: "Interviews" },
        { key: "reports", icon: "ti-chart-bar", label: "Reports" },
        { key: "messaging", icon: "ti-messages", label: "Messages" },
        { key: "settings", icon: "ti-settings", label: "Settings" },
        { key: "packages", icon: "ti-package", label: "Packages" },
        { key: "rolePermissions", icon: "ti-shield-lock", label: "Role Permissions" },
      ]
    },
    { key: "mysubscriptions", icon: "ti-rocket", label: "My Subscriptions" }
  ];'''

content = re.sub(r'const NAV = \[.*?\];', nav_str, content, flags=re.DOTALL)

# Fix icon rendering
content = re.sub(r'<i className=\{	i ti-\$\{sub\.icon\?\.includes\(\'ti-\'\) \? sub\.icon\.split\(\'ti-\'\)\[1\] : \'point\'\}\}></i>', r'<i className={	i }></i>', content)
content = re.sub(r'<i className=\{	i ti-\$\{n\.icon\?\.includes\(\'ti-\'\) \? n\.icon\.split\(\'ti-\'\)\[1\] : \'point\'\}\}></i>', r'<i className={	i }></i>', content)

with open('C:\\M Business\\M Business\\src\\components\\SubAdminDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated NAV array and icon rendering")
