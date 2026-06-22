import re

with open('C:\\M Business\\M Business\\src\\components\\SubAdminDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace setShowColorPicker(false) with setShowThemePicker(false) in the main THEMES mapping
content = re.sub(
    r'setAppTheme\(key\); setShowColorPicker\(false\);',
    r'setAppTheme(key); setShowThemePicker(false);',
    content
)

# Replace the custom color preset click handler to also Closethe picker
content = re.sub(
    r'onClick=\{.*?setCustomColor\(c\); setAppTheme\("custom"\); \}\}',
    r'onClick={() => { setCustomColor(c); setAppTheme("custom"); setShowThemePicker(false); }}',
    content
)

with open('C:\\M Business\\M Business\\src\\components\\SubAdminDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated theme picker Closelogic")
