import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Add letterhead to menu items (after templates)
old_menu = '{ key: "templates", icon: "ti-template", label: "Templates" },'
new_menu = '''{ key: "templates", icon: "ti-template", label: "Templates" },
        { key: "letterhead", icon: "ti-letter-a", label: "Letterhead" },'''
text = text.replace(old_menu, new_menu)

# 2. Add to allowedKeys - find where "templates" is allowed and add "letterhead" next to it
old_allowed = '"templates",'
new_allowed = '"templates", "letterhead",'
text = text.replace(old_allowed, new_allowed, 1)  # only replace first occurrence

# 3. Add letterhead iframe render (after templates iframe block)
old_templates_block = '''{validActive === "templates" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
              <iframe
                id="template-designer-frame"
                src="/template-designer.html"
                style={{ width: "100%", height: "100%", border: "none", flex: 1 }}
                title="Template Designer"
              />
            </div>
          )}'''

new_templates_block = '''{validActive === "templates" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
              <iframe
                id="template-designer-frame"
                src="/template-designer.html"
                style={{ width: "100%", height: "100%", border: "none", flex: 1 }}
                title="Template Designer"
              />
            </div>
          )}
          
          {validActive === "letterhead" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
              <iframe
                id="letterhead-frame"
                src="/template-designer.html#lh"
                style={{ width: "100%", height: "100%", border: "none", flex: 1 }}
                title="Letterhead Designer"
              />
            </div>
          )}'''

text = text.replace(old_templates_block, new_templates_block)

with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "w", encoding="utf-8") as f:
    f.write(text)
print("Added Letterhead menu item and iframe render")
