import re

file_path = r"src\components\SubAdminDashboard.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Find the <ModernProjectDetails block and its onAutoOpenInvoiceDone line, then add onAddClient after it
# Pattern: onAutoOpenInvoiceDone={...} followed by optional whitespace/newlines, then onDelete
pattern = r'(onAutoOpenInvoiceDone=\{[^\}]+\})\s*(\n\s*onDelete=)'
replacement = r'''\1
    onAddClient={() => {
      setNcError({});
      setShowClientPass(false);
      setSidebarOverride(null);
      setActive("addClient");
    }}
\2'''

new_content, count = re.subn(pattern, replacement, content, count=1)
if count > 0:
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"SUCCESS: Patched {count} occurrence(s)")
else:
    # Try a simpler search to debug
    idx = content.find("onAutoOpenInvoiceDone")
    print(f"onAutoOpenInvoiceDone found at index: {idx}")
    if idx >= 0:
        print(repr(content[idx:idx+200]))
    else:
        print("String not found at all in file")
