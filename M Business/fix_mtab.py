with open('C:\\M Business\\M Business\\src\\components\\ModernProjectsPage.css', 'r', encoding='utf-8') as f:
    css = f.read()

import re
css = re.sub(
    r'\.modern-app \.m-tab\.active\s*\{[^}]*\}',
    '.modern-app .m-tab.active {\n    background: var(--app-accent, var(--teal)) !important;\n    color: #ffffff !important;\n    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);\n    border: 1px solid transparent !important;\n  }',
    css
)

css = re.sub(
    r'\.modern-app \.m-tab:not\(\.active\):hover\s*\{[^}]*\}',
    '.modern-app .m-tab:not(.active):hover {\n    background: rgba(128, 128, 128, 0.1) !important;\n    color: var(--app-accent, var(--teal)) !important;\n  }',
    css
)

with open('C:\\M Business\\M Business\\src\\components\\ModernProjectsPage.css', 'w', encoding='utf-8') as f:
    f.write(css)
print("Updated CSS rules for m-tab")
