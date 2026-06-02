with open('C:\\M Business\\M Business\\src\\index.css', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# 1. sidebar -> background: var(--app-sidebar); color: #fff;
content = re.sub(
    r'\.sidebar\s*\{[^\}]+\}',
    '.sidebar {\n  width: 250px;\n  background: var(--app-sidebar);\n  display: flex;\n  flex-direction: column;\n  height: 100vh;\n  position: sticky;\n  top: 0;\n  border-right: 1px solid rgba(255, 255, 255, 0.05);\n  overflow-y: auto;\n  flex-shrink: 0;\n  color: #fff;\n}',
    content,
    count=1
)

# 2. nav-item -> color: rgba(255, 255, 255, 0.7);
content = re.sub(
    r'\.nav-item\s*\{[^\}]+\}',
    '.nav-item {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding: 10px 14px;\n  border-radius: 10px;\n  color: rgba(255, 255, 255, 0.7);\n  font-size: 14px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: all 0.2s;\n}',
    content
)

# 3. nav-item:hover
content = re.sub(
    r'\.nav-item:hover\s*\{[^\}]+\}',
    '.nav-item:hover {\n  background: rgba(255, 255, 255, 0.05);\n  color: #fff;\n}',
    content
)

# 4. nav-item.active
content = re.sub(
    r'\.nav-item\.active\s*\{[^\}]+\}',
    '.nav-item.active {\n  background: var(--app-accent-gradient);\n  color: #fff;\n  font-weight: 700;\n}',
    content
)

# 5. nav-item i
content = re.sub(
    r'\.nav-item i\s*\{[^\}]+\}',
    '.nav-item i {\n  font-size: 18px;\n  opacity: 0.8;\n}',
    content
)

# 6. sidebar-bottom
content = re.sub(
    r'\.sidebar-bottom\s*\{[^\}]+\}',
    '.sidebar-bottom {\n  padding: 20px;\n  border-top: 1px solid rgba(255, 255, 255, 0.05);\n}',
    content
)

# 7. upload-btn (this is the New Invoice button in the sidebar)
content = re.sub(
    r'\.upload-btn\s*\{[^\}]+\}',
    '.upload-btn {\n  width: 100%;\n  padding: 12px;\n  background: rgba(255, 255, 255, 0.05);\n  border: 1px dashed rgba(255, 255, 255, 0.2);\n  border-radius: 12px;\n  color: rgba(255, 255, 255, 0.8);\n  font-weight: 600;\n  font-size: 14px;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 8px;\n  transition: all 0.2s;\n}',
    content
)

# 8. upload-btn:hover
content = re.sub(
    r'\.upload-btn:hover\s*\{[^\}]+\}',
    '.upload-btn:hover {\n  background: rgba(255, 255, 255, 0.1);\n  color: #fff;\n  border-color: rgba(255, 255, 255, 0.4);\n}',
    content
)

with open('C:\\M Business\\M Business\\src\\index.css', 'w', encoding='utf-8') as f:
    f.write(content)
print("Restored index.css successfully")
