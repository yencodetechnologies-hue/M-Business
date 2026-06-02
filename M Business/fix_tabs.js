const fs = require('fs');
let code = fs.readFileSync('C:\\\\M Business\\\\M Business\\\\src\\\\components\\\\InvoiceCreator.jsx', 'utf8');

const replacement = {/* TABS */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between", marginBottom: 20}}>
          <div className="tabs">
            {["all", "paid", "pending", "overdue", "draft"].map(t => (
              <button key={t} className={\	ab \\} onClick={() => setFilterTab(t)} style={{ textTransform: "capitalize" }}>{t}</button>
            ))}
          </div>
          <button onClick={() => { clearForm(); setStep("template"); }} style={{ padding: "8px 16px", background: "var(--teal)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-plus"></i> New Invoice
          </button>
        </div>;

code = code.replace(/\{\/\*\s*TABS\s*\*\/\}.*?<\/div>\s*<\/div>/s, replacement);

fs.writeFileSync('C:\\\\M Business\\\\M Business\\\\src\\\\components\\\\InvoiceCreator.jsx', code);
console.log('Replaced tabs');
