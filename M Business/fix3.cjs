const fs = require('fs');
let c = fs.readFileSync('src/components/InvoiceCreator.jsx', 'utf8');

const regex = /          <\/>\)}\r?\n            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>\{inv.invoiceNo\}<\/div>\r?\n          <\/div>\r?\n        <\/div>/;

const replacement = `          </>)}
          {/* Footer message */}
          <div style={{ background: "#ffffff", borderTop: "2px solid #f1f5f9", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, pageBreakBefore: "auto", breakBefore: "auto" }}>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{effectiveCompanyName}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: currentT.primaryColor || "#7c3aed" }}>{inv.footerMessage}</div>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{inv.invoiceNo}</div>
          </div>
        </div>`;

fs.writeFileSync('src/components/InvoiceCreator.jsx', c.replace(regex, replacement));
