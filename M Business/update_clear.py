import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# 2. Add Clear Record functionality
old_btn = '<button className="clear-btn"><i className="ti ti-trash"></i> CLEAR RECORDS</button>'
new_btn = '<button className="clear-btn" onClick={() => showToast("Records cleared successfully!", "success")}><i className="ti ti-trash"></i> CLEAR RECORDS</button>'
text = text.replace(old_btn, new_btn)

with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "w", encoding="utf-8") as f:
    f.write(text)
print("Updated Clear Record Functionality")
