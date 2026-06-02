with open('C:\\M Business\\M Business\\src\\index.css', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Update upload-btn (New Invoice button) to use theme colors
content = re.sub(
    r'\.upload-btn\s*\{[^\}]+\}',
    '.upload-btn {\n  width: 100%;\n  padding: 12px;\n  background: var(--app-accent-gradient);\n  border: none;\n  border-radius: 12px;\n  color: #fff;\n  font-weight: 700;\n  font-size: 14px;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 8px;\n  transition: all 0.2s;\n  box-shadow: 0 4px 12px rgba(0,0,0,0.15);\n}',
    content
)

content = re.sub(
    r'\.upload-btn:hover\s*\{[^\}]+\}',
    '.upload-btn:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 6px 16px rgba(0,0,0,0.2);\n  opacity: 0.95;\n}',
    content
)

with open('C:\\M Business\\M Business\\src\\index.css', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated upload-btn successfully")
