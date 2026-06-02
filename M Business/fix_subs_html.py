with open('C:\\M Business\\M Business\\src\\components\\MySubscriptions.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Remove the broken leftover part
content = re.sub(
    r'</div>\s*</div>\s*<div className="ph-right">.*?<div className="usage-grid">.*?</div>\s*</div>\s*</div>\s*</div>\s*\{activeTab === "upgrade" && \(',
    '{activeTab === "upgrade" && (',
    content,
    flags=re.DOTALL
)

with open('C:\\M Business\\M Business\\src\\components\\MySubscriptions.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Cleaned up remaining HTML")
