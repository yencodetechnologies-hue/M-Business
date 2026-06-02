import re
file_path = r'C:\M Business\M Business\src\index.css'
with open(file_path, 'r', encoding='utf-8') as f:
    css = f.read()

css = re.sub(r'(\.profile-logout\s*\{[^}]*color:\s*)var\(--app-muted\)', r'\1rgba(255, 255, 255, 0.6)', css)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(css)
print("Updated logout color")
