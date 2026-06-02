import re

file_path = r'C:\M Business\M Business\src\components\InvoiceCreator.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacement = r'''{/* TABS */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between", marginBottom: 20}}>
          <div className="tabs">
            {["all", "paid", "pending", "overdue", "draft"].map(t => (
              <button key={t} className={`tab ${filterTab === t ? "active" : ""}`} onClick={() => setFilterTab(t)} style={{ textTransform: "capitalize" }}>{t}</button>
            ))}
          </div>
          <button onClick={() => { clearForm(); setStep("template"); }} style={{ padding: "8px 16px", background: "var(--teal)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-plus"></i> New Invoice
          </button>
        </div>'''

content = re.sub(r'\{\/\*\s*TABS\s*\*\/\}.*?<\/div>\s*<\/div>', replacement, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Replaced tabs')
