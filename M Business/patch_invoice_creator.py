import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/M Business/M Business/src/components/InvoiceCreator.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Let's locate the main return statement of the component
# It starts at: return (
#     <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1 }}>
# Let's search for this string.

target_start = '''  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1 }}>'''

start_idx = code.find(target_start)
if start_idx == -1:
    print("ERROR: target start not found")
    sys.exit(1)

# Now let's build the split screen replacement content
# We will define the template styling mapping helper at the top of the return block, or in the component body
# Let's insert the styling helper code just before "return ("
styling_helper = '''  const getTemplateStyles = (templateName) => {
    switch (templateName) {
      case "Minimal":
        return {
          primaryColor: "#111827",
          primaryBg: "#F3F4F6",
          logoColor: "linear-gradient(135deg, #374151, #111827)",
          borderStyle: "1px solid #E5E7EB",
          headerUnderline: "1px solid #E5E7EB",
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        };
      case "Classic":
        return {
          primaryColor: " var(--app-accent, #00BCD4)",
          primaryBg: "var(--teal-light, #E0F7FA)",
          logoColor: "linear-gradient(135deg,  var(--app-accent, #00BCD4), #006E7F)",
          borderStyle: "1px solid #E0EEF0",
          headerUnderline: "3px solid  var(--app-accent, #00BCD4)",
          fontFamily: "'Nunito', sans-serif"
        };
      case "Modern":
      default:
        return {
          primaryColor: "#7C5CFC",
          primaryBg: "#EEE9FF",
          logoColor: "linear-gradient(135deg, #7C5CFC, #4C1D95)",
          borderStyle: "1px solid #E5E7EB",
          headerUnderline: "3px solid #7C5CFC",
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        };
    }
  };
  const currentT = getTemplateStyles(inv.template);
'''

# Let's add the helper right before return
code = code[:start_idx] + styling_helper + code[start_idx:]

# Now find target_start again (since offsets shifted)
start_idx = code.find(target_start)

# We want to replace the body starting from the toast and first card down to "Bottom save buttons" and the closing return divs.
# Let's find: {/* ── Invoice Details ── */}
form_start_marker = '      {/* ── Invoice Details ── */}'
form_start_idx = code.find(form_start_marker, start_idx)

# Let's find the end of the return statement (which is the last return in the file before the export/closing braces)
# Let's locate the save buttons container: {/* Bottom save buttons */}
save_buttons_marker = '        {/* Bottom save buttons */}'
save_buttons_idx = code.find(save_buttons_marker, form_start_idx)

# Let's find the closing tag for the bottom save buttons container
end_div_idx = code.find('      </div>\n    </div>\n  );\n}', save_buttons_idx)

if form_start_idx == -1 or save_buttons_idx == -1 or end_div_idx == -1:
    print(f"ERROR: Markers not found. form_start_idx={form_start_idx}, save_buttons_idx={save_buttons_idx}, end_div_idx={end_div_idx}")
    sys.exit(1)

# Now, let's extract all the form cards content (from form_start_idx to save_buttons_idx)
form_cards_content = code[form_start_idx:save_buttons_idx]

# Let's construct the Live Preview HTML structure to place on the right side of the split screen
live_preview_content = '''
        {/* Right Side: Sticky Live Preview */}
        <div style={{ position: "sticky", top: "78px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="preview-card" style={{ background: "var(--app-card)", border: "1.5px solid var(--app-border)", borderRadius: "14px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <div className="preview-toolbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1.5px solid var(--app-border)", background: "var(--app-surface-variant)" }}>
              <div style={{ fontSize: "12px", fontWeight: "800", color: "var(--app-text)" }}>📄 Live Preview</div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={handleSavePreview} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 10px", background: "#fff", border: "1.5px solid var(--app-border)", borderRadius: "8px", fontSize: "10px", fontWeight: "700", color: "var(--app-text)", cursor: "pointer", fontFamily: "inherit" }}>
                  🖨️ Print / PDF
                </button>
              </div>
            </div>

            {/* LIVE INVOICE PREVIEW */}
            <div className="invoice-preview" style={{ padding: "20px", fontFamily: currentT.fontFamily, fontSize: "11px", color: "#1A2E35", background: "#fff", minHeight: "560px" }}>
              
              {/* HEADER */}
              <div className="inv-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", paddingBottom: "12px", borderBottom: currentT.headerUnderline }}>
                <div className="inv-logo-area">
                  {effectiveLogo ? (
                    <img src={effectiveLogo} alt="logo" style={{ height: 40, width: "auto", borderRadius: 6, marginBottom: 8, objectFit: "contain" }} />
                  ) : (
                    <div className="inv-logo-box" style={{ width: "40px", height: "40px", borderRadius: "8px", background: currentT.logoColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: "900", color: "#fff", marginBottom: "8px" }}>
                      {effectiveCompanyName ? effectiveCompanyName[0].toUpperCase() : "YT"}
                    </div>
                  )}
                  <div className="inv-company-name" style={{ fontSize: "13px", fontWeight: "800", color: "var(--text)" }}>{inv.companyName || effectiveCompanyName}</div>
                  <div className="inv-company-details" style={{ fontSize: "9px", color: "var(--app-muted)", lineHeight: "1.6", marginTop: "3px" }}>
                    {inv.companyEmail && <div>{inv.companyEmail}</div>}
                    {inv.companyPhone && <div>{inv.companyPhone}</div>}
                    {inv.companyAddress && <div>{inv.companyAddress}</div>}
                  </div>
                </div>
                <div className="inv-title-area" style={{ textAlign: "right" }}>
                  <div className="inv-title-word" style={{ fontSize: "24px", fontWeight: "900", color: currentT.primaryColor, letterSpacing: "-.5px" }}>INVOICE</div>
                  <div className="inv-id" style={{ fontSize: "11px", fontWeight: "700", color: "var(--text)", marginTop: "4px" }}>#{inv.invoiceNo}</div>
                  <div className="inv-dates" style={{ fontSize: "9px", color: "var(--app-muted)", marginTop: "2px", lineHeight: "1.6" }}>
                    <span>Issue: {inv.date ? new Date(inv.date).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'}) : "—"}</span><br/>
                    <span>Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'}) : "—"}</span>
                  </div>
                  <div className={`inv-status ${statusUpdating ? "draft" : "paid"}`} style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "20px", fontSize: "9px", fontWeight: "700", marginTop: "6px", background: inv.amountPaid >= total ? "var(--green-bg)" : "var(--amber-bg)", color: inv.amountPaid >= total ? "var(--green)" : "var(--amber)" }}>
                    {inv.amountPaid >= total ? "PAID" : inv.amountPaid > 0 ? "PART PAID" : "UNPAID"}
                  </div>
                </div>
              </div>

              {/* PARTIES */}
              <div className="inv-parties" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <div className="inv-party-label" style={{ fontSize: "8px", fontWeight: "700", color: currentT.primaryColor, textTransform: "uppercase", letterSpacing: ".8px", marginBottom: "4px" }}>From</div>
                  <div className="inv-party-name" style={{ fontSize: "12px", fontWeight: "800", color: "var(--text)" }}>{inv.companyName || effectiveCompanyName}</div>
                  <div className="inv-party-detail" style={{ fontSize: "9px", color: "var(--app-muted)", lineHeight: "1.6", marginTop: "2px" }}>
                    {inv.companyAddress}<br/>
                    {inv.companyPhone}
                  </div>
                </div>
                <div>
                  <div className="inv-party-label" style={{ fontSize: "8px", fontWeight: "700", color: currentT.primaryColor, textTransform: "uppercase", letterSpacing: ".8px", marginBottom: "4px" }}>Bill To</div>
                  <div className="inv-party-name" style={{ fontSize: "12px", fontWeight: "800", color: inv.client ? "var(--text)" : "var(--app-muted)" }}>{inv.client || "— Client Name —"}</div>
                  <div className="inv-party-detail" style={{ fontSize: "9px", color: "var(--app-muted)", lineHeight: "1.6", marginTop: "2px" }}>
                    {selectedClient ? (
                      <>
                        {selectedClient.companyName && <div>{selectedClient.companyName}</div>}
                        {selectedClient.email && <div>{selectedClient.email}</div>}
                        {selectedClient.phone && <div>{selectedClient.phone}</div>}
                        {selectedClient.address && <div>{selectedClient.address}</div>}
                        {selectedClient.gstNumber && <div style={{fontWeight: 700, color: currentT.primaryColor}}>GST: {selectedClient.gstNumber}</div>}
                      </>
                    ) : (
                      <span style={{ color: "var(--app-muted)" }}>Enter client details in the form</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ITEMS TABLE */}
              <table className="inv-items-table" style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
                <thead>
                  <tr style={{ background: currentT.logoColor || "var(--app-accent)" }}>
                    <th style={{ padding: "6px 8px", fontSize: "9px", fontWeight: "700", color: "#fff", textAlign: "left" }}>#</th>
                    <th style={{ padding: "6px 8px", fontSize: "9px", fontWeight: "700", color: "#fff", textAlign: "left" }}>Description</th>
                    <th style={{ padding: "6px 8px", fontSize: "9px", fontWeight: "700", color: "#fff", textAlign: "right" }}>Qty</th>
                    <th style={{ padding: "6px 8px", fontSize: "9px", fontWeight: "700", color: "#fff", textAlign: "right" }}>Unit Price</th>
                    <th style={{ padding: "6px 8px", fontSize: "9px", fontWeight: "700", color: "#fff", textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--app-border)" }}>
                      <td style={{ padding: "6px 8px", fontSize: "10px", color: "var(--text)" }}>{idx + 1}</td>
                      <td style={{ padding: "6px 8px", fontSize: "10px", color: "var(--text)" }}>{item.description || "—"}</td>
                      <td style={{ padding: "6px 8px", fontSize: "10px", color: "var(--text)", textAlign: "right" }}>{item.quantity}</td>
                      <td style={{ padding: "6px 8px", fontSize: "10px", color: "var(--text)", textAlign: "right" }}>{formatCurrency(item.rate, inv.currency)}</td>
                      <td style={{ padding: "6px 8px", fontSize: "10px", color: "var(--text)", textAlign: "right", fontWeight: "700" }}>{formatCurrency((parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0), inv.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* TOTALS */}
              <div className="inv-totals" style={{ marginLeft: "auto", width: "200px" }}>
                <div className="inv-total-row" style={{ display: "flex", justify: "space-between", padding: "4px 0", fontSize: "10px", borderBottom: "1px solid var(--app-border)" }}>
                  <span className="lbl" style={{ color: "var(--app-muted)" }}>Subtotal</span>
                  <span className="val" style={{ fontWeight: "700" }}>{formatCurrency(subtotal, inv.currency)}</span>
                </div>
                <div className="inv-total-row" style={{ display: "flex", justify: "space-between", padding: "4px 0", fontSize: "10px", borderBottom: "1px solid var(--app-border)" }}>
                  <span className="lbl" style={{ color: "var(--app-muted)" }}>GST ({inv.gstRate}%)</span>
                  <span className="val" style={{ fontWeight: "700" }}>{formatCurrency(gstAmt, inv.currency)}</span>
                </div>
                {amountPaid > 0 && (
                  <div className="inv-total-row" style={{ display: "flex", justify: "space-between", padding: "4px 0", fontSize: "10px", borderBottom: "1px solid var(--app-border)" }}>
                    <span className="lbl" style={{ color: "var(--app-muted)" }}>Paid (Advance)</span>
                    <span className="val" style={{ fontWeight: "700", color: "var(--green)" }}>-{formatCurrency(amountPaid, inv.currency)}</span>
                  </div>
                )}
                <div className="inv-grand-row" style={{ display: "flex", justify: "space-between", padding: "6px 8px", background: currentT.logoColor || "var(--app-accent)", borderRadius: "6px", marginTop: "4px", color: "#fff" }}>
                  <span className="lbl" style={{ fontSize: "10px", fontWeight: "800" }}>Balance Due</span>
                  <span className="val" style={{ fontSize: "12px", fontWeight: "900" }}>{formatCurrency(balanceDue, inv.currency)}</span>
                </div>
              </div>

              {/* BANK DETAILS */}
              {(inv.bankName || inv.accountNumber || inv.ifscCode || inv.upiId) && (
                <div className="inv-bank" style={{ marginTop: "12px", padding: "8px 10px", background: currentT.primaryBg, borderRadius: "6px", borderLeft: `3px solid ${currentT.primaryColor}` }}>
                  <div className="inv-bank-title" style={{ fontSize: "9px", fontWeight: "700", color: currentT.primaryColor, marginBottom: "3px" }}>Payment Details</div>
                  <div className="inv-bank-detail" style={{ fontSize: "9px", color: "var(--text)", lineHeight: "1.5" }}>
                    {inv.bankName && <span>Bank: {inv.bankName} &nbsp;|&nbsp; </span>}
                    {inv.accountNumber && <span>A/C: {inv.accountNumber} &nbsp;|&nbsp; </span>}
                    {inv.ifscCode && <span>IFSC: {inv.ifscCode}</span>}
                    {inv.upiId && <div style={{marginTop: "2px"}}>UPI: {inv.upiId}</div>}
                  </div>
                </div>
              )}

              {/* FOOTER */}
              <div className="inv-footer" style={{ marginTop: "16px", paddingTop: "10px", borderTop: "1px solid var(--app-border)", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div className="inv-notes" style={{ flex: 1 }}>
                  {inv.notes && (
                    <>
                      <div className="inv-notes-title" style={{ fontSize: "8px", fontWeight: "700", color: currentT.primaryColor, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: "2px" }}>Notes</div>
                      <div className="inv-notes-text" style={{ fontSize: "8px", color: "var(--app-muted)", lineHeight: "1.5" }}>{inv.notes}</div>
                    </>
                  )}
                </div>
                <div className="inv-sig" style={{ textAlign: "right" }}>
                  <div className="inv-sig-line" style={{ width: "80px", height: "1px", background: "var(--app-border)", marginLeft: "auto", marginBottom: "3px" }}></div>
                  <div className="inv-sig-name" style={{ fontSize: "9px", fontWeight: "700", color: "var(--text)" }}>{inv.companyName || effectiveCompanyName}</div>
                  <div className="inv-sig-role" style={{ fontSize: "8px", color: "var(--app-muted)" }}>Authorized Signatory</div>
                </div>
              </div>

            </div>
          </div>
        </div>
'''

# Construct the full split layout string
new_layout_code = f'''
      {'{/* Split Layout Container */}'}
      <div className="invoice-creator-split-container" style={{{{ display: "grid", gridTemplateColumns: "1fr 450px", gap: "24px", alignItems: "start", marginTop: 16 }}}}>
        
        {'{/* Left Panel: Scrollable form cards */}'}
        <div style={{{{ display: "flex", flexDirection: "column", gap: 16 }}}}>
          {form_cards_content}
        </div>
        
        {live_preview_content}
      </div>
'''

# Let's perform the replacement
replaced_code = code[:form_start_idx] + new_layout_code + code[save_buttons_idx:]

with open('c:/M Business/M Business/src/components/InvoiceCreator.jsx', 'w', encoding='utf-8') as f:
    f.write(replaced_code)

print("SUCCESS: Modified InvoiceCreator.jsx for split-screen live preview!")
