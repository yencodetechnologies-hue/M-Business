import sys
import re

file_path = "src/components/SubAdminDashboard.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

pattern = r"(onAutoOpenInvoiceDone=\{\(\) => setAutoOpenInvoice\(false\)\}\s+onDelete=\{async \(\) => \{)"
replacement = r"""onAutoOpenInvoiceDone={() => setAutoOpenInvoice(false)}
    onAddClient={() => {
      setNcError({});
      setShowClientPass(false);
      setSidebarOverride(null);
      setActive("addClient");
    }}
    onDelete={async () => {"""

new_content, count = re.subn(pattern, replacement, content, count=1)

if count > 0:
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Patched successfully")
else:
    print("Target not found. Please check line endings or exact string match.")
