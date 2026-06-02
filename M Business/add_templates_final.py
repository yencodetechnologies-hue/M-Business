import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Add to NAV array
text = text.replace('{ key: "expenses", icon: "ti-cash", label: "Expenses" },', '{ key: "expenses", icon: "ti-cash", label: "Expenses" },\n        { key: "templates", icon: "ti-template", label: "Templates" },')

# 2. Add to allowedKeys
text = text.replace('allowedKeys.push("dashboard", "clients", ', 'allowedKeys.push("dashboard", "templates", "clients", ')

# 3. Find the end of validActive blocks to inject the templates iframe
idx = text.find('validActive === "documents" && <SubAdminDocumentsPage employees={employees} />')
if idx != -1:
    iframe_jsx = """{validActive === "templates" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
              <iframe
                id="template-designer-frame"
                src="/template-designer.html"
                style={{ width: "100%", height: "100%", border: "none", flex: 1 }}
                title="Template Designer"
              />
            </div>
          )}
          """
    text = text.replace('validActive === "documents" && <SubAdminDocumentsPage employees={employees} />}', 'validActive === "documents" && <SubAdminDocumentsPage employees={employees} />}\n          ' + iframe_jsx)

with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Updated SubAdminDashboard.jsx")
