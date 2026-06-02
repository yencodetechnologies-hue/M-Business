with open('C:\\M Business\\M Business\\src\\index.css', 'r', encoding='utf-8') as f:
    css = f.read()

import re
css = re.sub(
    r'\.profile-name\s*\{\s*color:\s*#fff;',
    '.profile-name {\n    color: var(--app-text);',
    css
)

css = re.sub(
    r'\.profile-area\s*\{([^\}]*)background:\s*rgba\(255, 255, 255, 0\.05\);([^\}]*)\}',
    r'.profile-area {\1background: var(--app-bg);\2}',
    css
)

css = re.sub(
    r'\.profile-area\s*\{([^\}]*)border:\s*1px solid rgba\(255, 255, 255, 0\.05\);([^\}]*)\}',
    r'.profile-area {\1border: 1px solid var(--app-border);\2}',
    css
)

with open('C:\\M Business\\M Business\\src\\index.css', 'w', encoding='utf-8') as f:
    f.write(css)
print("Updated profile-name and profile-area CSS")
