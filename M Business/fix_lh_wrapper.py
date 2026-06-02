import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# Fix double color issue - when letterhead or templates is active, 
# apply var(--app-bg) background to the wrapper div
old_lh_block = '''{validActive === "letterhead" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
              <iframe
                id="letterhead-frame"
                src="/template-designer.html#lh"
                style={{ width: "100%", height: "100%", border: "none", flex: 1 }}
                title="Letterhead Designer"
              />
            </div>'''

new_lh_block = '''{validActive === "letterhead" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", background: "#F5FAFA" }}>
              <iframe
                key="letterhead-frame"
                id="letterhead-frame"
                src="/template-designer.html#lh"
                style={{ width: "100%", height: "100%", border: "none", flex: 1, display: "block" }}
                title="Letterhead Designer"
              />
            </div>'''

text = text.replace(old_lh_block, new_lh_block)

with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "w", encoding="utf-8") as f:
    f.write(text)
print("Fixed letterhead iframe wrapper")
