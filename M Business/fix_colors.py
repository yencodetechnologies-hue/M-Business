with open('C:\\M Business\\M Business\\src\\components\\SubAdminDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_str = '{["var(--app-accent)", "#2563eb", "#0891b2", "#059669", "#d97706", "#dc2626", "#db2777", "#7c2d12", "#4f46e5", "#0f766e", "#b91c1c", "var(--app-accent)"].map(c => ('
new_str = '{["#2563eb", "#0891b2", "#059669", "#d97706", "#dc2626", "#db2777", "#7c2d12", "#4f46e5", "#0f766e", "#b91c1c"].map(c => ('

if old_str in content:
    with open('C:\\M Business\\M Business\\src\\components\\SubAdminDashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(content.replace(old_str, new_str))
    print("Replaced successfully")
else:
    print("String not found")
