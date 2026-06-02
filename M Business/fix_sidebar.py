import re

file_path = r'C:\M Business\M Business\src\index.css'
with open(file_path, 'r', encoding='utf-8') as f:
    css = f.read()

# Replace .sidebar background
css = re.sub(r'(\.sidebar\s*\{[^}]*background:\s*)var\(--app-card\)', r'\1var(--app-sidebar)', css)
css = re.sub(r'(\.sidebar\s*\{[^}]*border-right:\s*)1px solid var\(--app-border\)', r'\1none', css)

# Replace .profile-area
profile_area_repl = '''
.profile-area {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
'''
css = re.sub(r'\.profile-area\s*\{[^}]*\}', profile_area_repl.strip(), css)

# Replace .profile-name
css = re.sub(r'(\.profile-name\s*\{[^}]*color:\s*)var\(--app-text\)', r'\1#fff', css)

# Replace .nav-item rules
nav_item_repl = '''
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 16px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  margin: 4px 16px;
}

.nav-item i {
  font-size: 18px;
  opacity: 0.9;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.nav-item.active {
  background: var(--app-accent);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(var(--app-accent-rgb), 0.4);
}
'''
css = re.sub(r'\.nav-item\s*\{[^}]*\}(\s*\.nav-item i\s*\{[^}]*\})?(\s*\.nav-item:hover\s*\{[^}]*\})?(\s*\.nav-item\.active\s*\{[^}]*\})?', nav_item_repl.strip(), css)

# Replace nav-label
css = re.sub(r'(\.nav-label\s*\{[^}]*color:\s*)var\(--app-muted\)', r'\1rgba(255, 255, 255, 0.45)', css)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(css)

print("Updated index.css")
