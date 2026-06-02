with open('C:\\M Business\\M Business\\src\\index.css', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Use re.DOTALL so [^}] matches across newlines
content = re.sub(
    r'\.sidebar\s*\{[^}]+\}',
    '.sidebar {\n  width: 250px;\n  background: var(--app-card);\n  display: flex;\n  flex-direction: column;\n  height: 100vh;\n  position: sticky;\n  top: 0;\n  border-right: 1px solid var(--app-border);\n  overflow-y: auto;\n  flex-shrink: 0;\n}',
    content,
    count=1,
    flags=re.DOTALL
)

content = re.sub(
    r'\.nav-item\s*\{[^}]+\}',
    '.nav-item {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding: 10px 14px;\n  border-radius: 10px;\n  color: var(--app-muted);\n  font-size: 14px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: all 0.2s;\n}',
    content,
    flags=re.DOTALL
)

content = re.sub(
    r'\.nav-item:hover\s*\{[^}]+\}',
    '.nav-item:hover {\n  background: var(--app-bg);\n  color: var(--app-accent);\n}',
    content,
    flags=re.DOTALL
)

content = re.sub(
    r'\.nav-item\.active\s*\{[^}]+\}',
    '.nav-item.active {\n  background: rgba(var(--app-accent-rgb), 0.1);\n  color: var(--app-accent);\n  font-weight: 700;\n}',
    content,
    flags=re.DOTALL
)

content = re.sub(
    r'\.nav-item i\s*\{[^}]+\}',
    '.nav-item i {\n  font-size: 18px;\n  opacity: 0.8;\n}',
    content,
    flags=re.DOTALL
)

content = re.sub(
    r'\.sidebar-bottom\s*\{[^}]+\}',
    '.sidebar-bottom {\n  padding: 20px;\n  border-top: 1px solid var(--app-border);\n}',
    content,
    flags=re.DOTALL
)

content = re.sub(
    r'\.upload-btn\s*\{[^}]+\}',
    '.upload-btn {\n  width: 100%;\n  padding: 12px;\n  background: var(--app-bg);\n  border: 1px dashed var(--app-border);\n  border-radius: 12px;\n  color: var(--app-muted);\n  font-weight: 600;\n  font-size: 14px;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 8px;\n  transition: all 0.2s;\n}',
    content,
    flags=re.DOTALL
)

content = re.sub(
    r'\.upload-btn:hover\s*\{[^}]+\}',
    '.upload-btn:hover {\n  background: rgba(var(--app-accent-rgb), 0.05);\n  color: var(--app-accent);\n  border-color: var(--app-accent);\n}',
    content,
    flags=re.DOTALL
)

with open('C:\\M Business\\M Business\\src\\index.css', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated index.css correctly")
