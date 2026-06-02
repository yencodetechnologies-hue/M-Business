with open('C:\\M Business\\M Business\\src\\index.css', 'r', encoding='utf-8') as f:
    content = f.read()

import re
sidebar_match = re.search(r'\.sidebar\s*\{[^}]+\}', content)
nav_item_match = re.search(r'\.nav-item\s*\{[^}]+\}', content)
nav_item_hover_match = re.search(r'\.nav-item:hover\s*\{[^}]+\}', content)
nav_item_active_match = re.search(r'\.nav-item\.active\s*\{[^}]+\}', content)

print("sidebar:", sidebar_match.group(0) if sidebar_match else "not found")
print("nav-item:", nav_item_match.group(0) if nav_item_match else "not found")
print("nav-item:hover:", nav_item_hover_match.group(0) if nav_item_hover_match else "not found")
print("nav-item.active:", nav_item_active_match.group(0) if nav_item_active_match else "not found")
