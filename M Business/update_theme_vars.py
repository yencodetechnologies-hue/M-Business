with open('C:\\M Business\\M Business\\src\\components\\SubAdminDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re

new_effect = """
    const t = appTheme === "custom" ? generateThemeFromColor(customColor) : (THEMES[appTheme] || THEMES.purple);
    if (!t) return;
    document.documentElement.style.setProperty("--app-sidebar", t.sidebar);
    document.documentElement.style.setProperty("--app-accent", t.accent);
    document.documentElement.style.setProperty("--app-accent-rgb", hexToRgb(t.accent));
    document.documentElement.style.setProperty("--app-accent-gradient", linear-gradient(135deg, , ));
    document.documentElement.style.setProperty("--app-bg", t.bg);
    document.documentElement.style.setProperty("--app-muted", t.muted);
    document.documentElement.style.setProperty("--app-border", t.border);
    
    // Override template hardcoded colors to match theme
    document.documentElement.style.setProperty("--teal", t.accent);
    document.documentElement.style.setProperty("--teal2", t.dot);
    document.documentElement.style.setProperty("--teal-light", gba(, 0.1));
    document.documentElement.style.setProperty("--teal-lighter", gba(, 0.04));

    localStorage.setItem("appTheme", appTheme);
"""

content = re.sub(
    r'const t = appTheme === "custom"\s*\?\s*generateThemeFromColor\(customColor\)\s*:\s*THEMES\[appTheme\];\s*if \(\!t\) return;\s*document\.documentElement\.style\.setProperty\("--app-sidebar", t\.sidebar\);[\s\S]*?localStorage\.setItem\("appTheme", appTheme\);',
    new_effect,
    content
)

with open('C:\\M Business\\M Business\\src\\components\\SubAdminDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated SubAdminDashboard.jsx successfully")
