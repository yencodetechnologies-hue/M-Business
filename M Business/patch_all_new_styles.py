import re

with open('c:/M Business/M Business/src/components/InvoiceCreator.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update the styling block inside style tag to add form classes
css_styles = """
        /* LIVE INVOICE PREVIEW STYLES */
        .invoice-preview { padding: 24px; font-size: 12px; color: #1A2E35; background: #fff; min-height: 560px; }
        .inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; }
        .inv-logo-box { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 900; color: #fff; margin-bottom: 8px; }
        .inv-company-name { font-size: 14px; font-weight: 800; color: #1A2E35; }
        .inv-company-details { font-size: 10px; color: #607D86; line-height: 1.7; margin-top: 3px; }
        .inv-title-area { text-align: right; }
        .inv-title-word { font-size: 28px; font-weight: 900; letter-spacing: -.5px; }
        .inv-id { font-size: 12px; font-weight: 700; color: #1A2E35; margin-top: 4px; }
        .inv-dates { font-size: 10px; color: #607D86; margin-top: 2px; line-height: 1.8; }
        .inv-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .inv-party-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 5px; }
        .inv-party-name { font-size: 13px; font-weight: 800; color: #1A2E35; }
        .inv-party-detail { font-size: 10px; color: #607D86; line-height: 1.7; margin-top: 2px; }
        .inv-items-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .inv-items-table thead th { padding: 8px 10px; font-size: 10px; font-weight: 700; color: #fff; text-align: left; letter-spacing: .4px; }
        .inv-items-table thead th:last-child { text-align: right; }
        .inv-items-table tbody tr { border-bottom: 1px solid #E0EEF0; }
        .inv-items-table tbody tr:nth-child(even) { background: #F8FAFB; }
        .inv-items-table tbody td { padding: 8px 10px; font-size: 11px; color: #1A2E35; }
        .inv-items-table tbody td:last-child { text-align: right; font-weight: 700; }
        .inv-totals { margin-left: auto; width: 200px; }
        .inv-total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; border-bottom: 1px solid #E0EEF0; }
        .inv-total-row:last-child { border-bottom: none; }
        .inv-total-row .lbl { color: #607D86; }
        .inv-total-row .val { font-weight: 700; color: #1A2E35; }
        .inv-grand-row { display: flex; justify-content: space-between; padding: 8px 10px; border-radius: 8px; margin-top: 6px; color: #fff; }
        .inv-grand-row .lbl { font-size: 12px; font-weight: 800; }
        .inv-grand-row .val { font-size: 14px; font-weight: 900; }
        .inv-footer { margin-top: 20px; padding-top: 14px; border-top: 1px solid #E0EEF0; display: flex; justify-content: space-between; align-items: flex-end; }
        .inv-notes { flex: 1; }
        .inv-notes-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 4px; }
        .inv-notes-text { font-size: 10px; color: #607D86; line-height: 1.6; }
        .inv-sig { text-align: right; }
        .inv-sig-line { width: 100px; height: 1px; background: #607D86; margin-left: auto; margin-bottom: 4px; }
        .inv-sig-name { font-size: 10px; font-weight: 700; color: #1A2E35; }
        .inv-sig-role { font-size: 9px; color: #607D86; }
        .inv-bank { margin-top: 14px; padding: 10px 12px; border-radius: 8px; }
        .inv-bank-title { font-size: 10px; font-weight: 700; margin-bottom: 4px; }
        .inv-bank-detail { font-size: 10px; line-height: 1.7; }

        /* Custom Invoice Creator Form Side Styles */
        .form-side { display: flex; flex-direction: column; gap: 16px; }
        .card { background: #FFFFFF; border: 1.5px solid #E0EEF0; border-radius: 14px; overflow: hidden; margin-bottom: 12px; }
        .card-header { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid #E0EEF0; }
        .card-title { font-size: 13px; font-weight: 800; color: #1A2E35; }
        .card-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
        .card-body { padding: 18px; }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
        .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 14px; }
        .form-group { margin-bottom: 14px; }
        .form-group:last-child { margin-bottom: 0; }
        .form-label { font-size: 11px; font-weight: 700; color: #607D86; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 6px; display: block; }
        .form-input { width: 100%; padding: 10px 13px; background: #F5FAFA; border: 1.5px solid #E0EEF0; border-radius: 10px; font-size: 13px; color: #1A2E35; font-family: inherit; outline: none; transition: all .15s; }
        .form-input:focus { border-color:  var(--app-accent, var(--app-accent, #00BCD4)) !important; background: #FFFFFF; box-shadow: 0 0 0 3px rgba(0,188,212,.08); }
        .form-input::placeholder { color: #A0B8BE; }
        .form-input:read-only { background: #F8FAFB; color: #A0B8BE; cursor: not-allowed; }
        .form-select { width: 100%; padding: 10px 13px; background: #F5FAFA; border: 1.5px solid #E0EEF0; border-radius: 10px; font-size: 13px; color: #1A2E35; font-family: inherit; outline: none; cursor: pointer; appearance: none; -webkit-appearance: none; transition: all .15s; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23A0B8BE' stroke-width='2'%3E%3Cpolyline points='6,9 12,15 18,9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; }
        .form-select:focus { border-color:  var(--app-accent, var(--app-accent, #00BCD4)) !important; box-shadow: 0 0 0 3px rgba(0,188,212,.08); }
        .form-textarea { width: 100%; padding: 10px 13px; background: #F5FAFA; border: 1.5px solid #E0EEF0; border-radius: 10px; font-size: 13px; color: #1A2E35; font-family: inherit; outline: none; resize: vertical; min-height: 72px; transition: all .15s; }
        .form-textarea:focus { border-color:  var(--app-accent, var(--app-accent, #00BCD4)) !important; box-shadow: 0 0 0 3px rgba(0,188,212,.08); }
        .form-textarea::placeholder { color: #A0B8BE; }

        .template-row { display: flex; gap: 8px; margin-bottom: 14px; }
        .template-opt { flex: 1; padding: 10px; border: 1.5px solid #E0EEF0; border-radius: 10px; cursor: pointer; text-align: center; transition: all .15s; }
        .template-opt:hover { border-color:  var(--app-accent, var(--app-accent, #00BCD4)); }
        .template-opt.selected { border-color:  var(--app-accent, var(--app-accent, #00BCD4)); background: var(--teal-lighter, #F0FDFE); }
        .template-opt-icon { font-size: 20px; margin-bottom: 4px; }
        .template-opt-name { font-size: 10px; font-weight: 700; color: #607D86; }
        .template-opt.selected .template-opt-name { color:  var(--app-accent, var(--app-accent, #00BCD4)); }

        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .items-table thead tr th { font-size: 10px; font-weight: 700; color: #A0B8BE; text-transform: uppercase; letter-spacing: .6px; padding: 8px 10px; text-align: left; background: #F8FAFB; border-bottom: 1px solid #E0EEF0; }
        .items-table tbody tr td { padding: 6px 6px; border-bottom: 1px solid #E0EEF0; vertical-align: middle; }
        .items-table tbody tr:last-child td { border-bottom: none; }
        .item-input { width: 100%; padding: 8px 10px; background: #F5FAFA; border: 1.5px solid transparent; border-radius: 8px; font-size: 12px; color: #1A2E35; font-family: inherit; outline: none; transition: all .15s; }
        .item-input:focus { border-color:  var(--app-accent, var(--app-accent, #00BCD4)) !important; background: #FFFFFF; box-shadow: 0 0 0 2px rgba(0,188,212,.08); }
        .item-input.desc { min-width: 160px; }
        .item-input.num { width: 70px; text-align: right; }
        .item-total { font-size: 13px; font-weight: 700; color: #1A2E35; padding: 0 10px; min-width: 80px; text-align: right; }
        .del-row-btn { width: 26px; height: 26px; border-radius: 7px; background: none; border: 1.5px solid #E0EEF0; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 13px; color: #A0B8BE; transition: all .15s; flex-shrink: 0; }
        .del-row-btn:hover { border-color: #F05C5C; color: #F05C5C; background: #FEF2F2; }
        .add-item-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: var(--teal-lighter, #F0FDFE); border: 1.5px dashed  var(--app-accent, var(--app-accent, #00BCD4)); border-radius: 9px; font-size: 12px; font-weight: 700; color:  var(--app-accent, var(--app-accent, #00BCD4)); cursor: pointer; transition: all .15s; font-family: inherit; width: 100%; justify-content: center; }
        .add-item-btn:hover { background: var(--teal-light, #E0F7FA); }

        .totals-section { border-top: 1px solid #E0EEF0; padding-top: 14px; margin-top: 4px; }
        .total-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 13px; }
        .total-label { color: #607D86; font-weight: 600; }
        .total-val { font-weight: 700; color: #1A2E35; }
        .total-row.discount .total-val { color: #26C281; }
        .total-row.tax .total-val { color: #F5A623; }
        .total-row.grand { padding: 10px 14px; background: linear-gradient(135deg, var(--teal-lighter, #F0FDFE), var(--teal-light, #E0F7FA)); border-radius: 10px; border: 1.5px solid var(--teal-light, #E0F7FA); margin-top: 6px; }
        .total-row.grand .total-label { font-size: 14px; font-weight: 800; color: #1A2E35; }
        .total-row.grand .total-val { font-size: 18px; font-weight: 900; color:  var(--app-accent, var(--app-accent, #00BCD4)); }

        .payment-terms-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
        .pt-opt { padding: 8px 6px; border: 1.5px solid #E0EEF0; border-radius: 9px; cursor: pointer; text-align: center; transition: all .15s; font-family: inherit; }
        .pt-opt:hover { border-color:  var(--app-accent, var(--app-accent, #00BCD4)); }
        .pt-opt.selected { border-color:  var(--app-accent, var(--app-accent, #00BCD4)); background: var(--teal-lighter, #F0FDFE); color:  var(--app-accent, var(--app-accent, #00BCD4)); }
        .pt-opt-days { font-size: 14px; font-weight: 800; color: #1A2E35; }
        .pt-opt.selected .pt-opt-days { color:  var(--app-accent, var(--app-accent, #00BCD4)); }
        .pt-opt-label { font-size: 9px; color: #A0B8BE; font-weight: 600; }
        .pt-opt.selected .pt-opt-label { color:  var(--app-accent, var(--app-accent, #00BCD4)); }

        .sig-pad { border: 2px dashed #C5DDE0; border-radius: 10px; height: 90px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; cursor: pointer; transition: all .15s; background: #F5FAFA; }
        .sig-pad:hover { border-color:  var(--app-accent, var(--app-accent, #00BCD4)); background: var(--teal-lighter, #F0FDFE); }
"""

# Let's replace the stylesheet content inside the first <style> block of the return statement
code = re.sub(
    r'<style>\{`([\s\S]*?)`\}</style>',
    r'<style>{`\1' + css_styles.replace('\\', '\\\\') + r'`}</style>',
    code,
    count=1
)

# 2. Locate the Left Panel start and end, and replace with clean HTML template version
left_panel_replacement = """        {/* Left Panel: Scrollable form cards */}
        <div className="form-side">
          
          {/* TEMPLATE */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon" style={{background:"var(--purple-bg)",color:"var(--purple)"}}><i className="ti ti-layout-grid"></i></div>
              <div className="card-title">Invoice Template</div>
            </div>
            <div className="card-body">
              <div className="template-row">
                {[
                  { name: "Classic", icon: "🟦" },
                  { name: "Modern", icon: "🖤" },
                  { name: "Minimal", icon: "🟩" },
                  { name: "Bold", icon: "🟧" }
                ].map(t => (
                  <div key={t.name} className={`template-opt ${inv.template === t.name ? "selected" : ""}`} onClick={() => upd("template", t.name)}>
                    <div className="template-opt-icon">{t.icon}</div>
                    <div className="template-opt-name">{t.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* INVOICE DETAILS */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon" style={{background:"var(--teal-light)",color:"var(--teal)"}}><i className="ti ti-receipt-2"></i></div>
              <div className="card-title">Invoice Details</div>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Invoice Number</label>
                  <input className="form-input" type="text" value={inv.invoiceNo} readOnly />
                </div>
                <div className="form-group">
                  <label className="form-label">Invoice Date</label>
                  <input className="form-input" type="date" value={inv.date} onChange={(e) => upd("date", e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="date" value={inv.dueDate} onChange={(e) => upd("dueDate", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={inv.category || "Consulting"} onChange={(e) => upd("category", e.target.value)}>
                    <option value="Advance Payment">Advance Payment</option>
                    <option value="Milestone">Milestone</option>
                    <option value="Final Invoice">Final Invoice</option>
                    <option value="Monthly Retainer">Monthly Retainer</option>
                    <option value="Consulting">Consulting</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* FROM (SENDER) */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon" style={{background:"var(--teal-light)",color:"var(--teal)"}}><i className="ti ti-building"></i></div>
              <div className="card-title">From (Your Details)</div>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input className="form-input" type="text" value={inv.companyName} onChange={(e) => upd("companyName", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Number</label>
                  <input className="form-input" type="text" value={inv.fromGST || "33ABCDE1234F1Z5"} onChange={(e) => upd("fromGST", e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={inv.companyEmail} onChange={(e) => upd("companyEmail", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" type="tel" value={inv.companyPhone} onChange={(e) => upd("companyPhone", e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" type="text" value={inv.companyAddress} onChange={(e) => upd("companyAddress", e.target.value)} />
              </div>
            </div>
          </div>

          {/* BILL TO (CLIENT) */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon" style={{background:"var(--amber-bg)",color:"var(--amber)"}}><i className="ti ti-user-circle"></i></div>
              <div className="card-title">Bill To (Client)</div>
              <button onClick={onAddClient} style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:"5px",padding:"5px 10px",background:"var(--teal-lighter)",border:"1.5px solid var(--teal)",borderRadius:"7px",fontSize:"10px",fontWeight:"700",color:"var(--teal)",cursor:"pointer",fontFamily:"inherit"}}>
                <i className="ti ti-plus" style={{fontSize:"12px"}}></i> Add Client
              </button>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group" id="field-client" style={{marginBottom: 0}}>
                  <label className="form-label" style={{color: errors.client ? "#ef4444" : "var(--text2)"}}>Company / Client Name *</label>
                  <CompanyDropdown clients={clients} value={inv.client}
                    onChange={(val) => { upd("client", val); upd("project", ""); setErrors((p) => { const n = { ...p }; delete n.client; return n; }); }}
                    error={errors.client} onAddCompany={onAddClient} />
                  {errors.client && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontWeight: 600 }}>⚠ {errors.client}</div>}
                </div>
                <div className="form-group" style={{marginBottom: 0}}>
                  <label className="form-label">Project</label>
                  <ProjectDropdown projects={filteredProjects} value={inv.project}
                    onChange={(val) => upd("project", val)}
                    onAddProject={onAddProject}
                    disabled={!inv.client} />
                </div>
              </div>
              {selectedClient && (
                <div style={{ marginTop: 14, padding: "8px 12px", background: "#f9fafb", borderRadius: 8, display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {[["📧", selectedClient.email], ["📱", selectedClient.phone], ["📍", selectedClient.address], ["💎", selectedClient.gstNumber]].filter(([, v]) => v).map(([icon, val], i) => (
                    <span key={i} style={{ fontSize: 12, color: "#6b7280" }}>{icon} {val}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* LINE ITEMS */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon" style={{background:"var(--blue-bg)",color:"var(--blue)"}}><i className="ti ti-list-details"></i></div>
              <div className="card-title">Line Items</div>
            </div>
            <div className="card-body">
              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{width:"36%"}}>Description</th>
                    <th style={{width:"12%"}}>Qty</th>
                    <th style={{width:"18%"}}>Unit Price</th>
                    <th style={{width:"14%"}}>Tax %</th>
                    <th style={{width:"16%",textAlign:"right"}}>Total</th>
                    <th style={{width:"4%"}}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const dErr = errors[`item_${item.id}_description`];
                    const rErr = errors[`item_${item.id}_rate`];
                    const lineBase = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
                    const lineTax = lineBase * (inv.gstRate / 100);
                    const lineTotal = lineBase + (inv.isGstIncluded ? 0 : lineTax);
                    return (
                      <tr key={item.id}>
                        <td>
                          <input type="text" className="item-input desc" placeholder="Item description" value={item.description || ""} onChange={(e) => updItem(item.id, "description", e.target.value)} />
                          {dErr && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>⚠ Required</div>}
                        </td>
                        <td>
                          <input type="number" className="item-input num" value={item.quantity === 0 ? "" : item.quantity} onChange={(e) => updItem(item.id, "quantity", e.target.value === "" ? 0 : Number(e.target.value))} onWheel={(e) => e.target.blur()} />
                        </td>
                        <td>
                          <input type="number" className="item-input num" value={item.rate === 0 ? "" : item.rate} onChange={(e) => updItem(item.id, "rate", e.target.value === "" ? 0 : Number(e.target.value))} onWheel={(e) => e.target.blur()} style={{width:"90px"}} />
                          {rErr && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>⚠ Required</div>}
                        </td>
                        <td>
                          <input type="number" className="item-input num" value={inv.gstRate} onChange={(e) => upd("gstRate", Number(e.target.value))} style={{width:"55px"}} />
                        </td>
                        <td className="item-total">
                          {formatCurrency(lineTotal, inv.currency)}
                        </td>
                        <td>
                          <button className="del-row-btn" onClick={() => removeItem(item.id)} disabled={items.length === 1}><i className="ti ti-trash"></i></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <button className="add-item-btn" onClick={addItem}><i className="ti ti-plus" style={{fontSize:"14px"}}></i> Add Line Item</button>

              {/* TOTALS */}
              <div className="totals-section">
                <div className="form-row" style={{marginBottom:"10px"}}>
                  <div className="form-group">
                    <label className="form-label">Discount (%)</label>
                    <input className="form-input" type="number" value={inv.discountPct || 0} onChange={(e) => upd("discountPct", Number(e.target.value))} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Shipping / Extra Charges</label>
                    <input className="form-input" type="number" value={inv.extraCharges || 0} onChange={(e) => upd("extraCharges", Number(e.target.value))} placeholder="0" />
                  </div>
                </div>
                <div className="total-row"><span className="total-label">Subtotal</span><span className="total-val">{formatCurrency(subtotal, inv.currency)}</span></div>
                <div className="total-row discount"><span className="total-label">Discount</span><span className="total-val">- {formatCurrency((subtotal * (inv.discountPct || 0) / 100), inv.currency)}</span></div>
                <div className="total-row tax"><span className="total-label">GST / Tax</span><span className="total-val">+ {formatCurrency(gstAmt, inv.currency)}</span></div>
                <div className="total-row"><span className="total-label">Extra Charges</span><span className="total-val">+ {formatCurrency(inv.extraCharges || 0, inv.currency)}</span></div>
                <div className="total-row grand"><span className="total-label">Total Amount</span><span className="total-val">{formatCurrency(total - (subtotal * (inv.discountPct || 0) / 100) + (inv.extraCharges || 0), inv.currency)}</span></div>
              </div>
            </div>
          </div>

          {/* PAYMENT TERMS */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon" style={{background:"var(--green-bg)",color:"var(--green)"}}><i className="ti ti-clock"></i></div>
              <div className="card-title">Payment Terms & Bank Details</div>
            </div>
            <div className="card-body">
              <label className="form-label">Payment Due</label>
              <div className="payment-terms-grid">
                {[
                  { label: "Immediate", days: "NOW", val: 0 },
                  { label: "Net 7 days", days: "7", val: 7 },
                  { label: "Net 15 days", days: "15", val: 15 },
                  { label: "Net 30 days", days: "30", val: 30 }
                ].map(term => {
                  const isSel = (term.val === 0 && inv.dueDate === inv.date) || 
                                (term.val !== 0 && new Date(new Date(inv.date).getTime() + term.val * 86400000).toISOString().split("T")[0] === inv.dueDate);
                  return (
                    <div key={term.label} className={`pt-opt ${isSel ? "selected" : ""}`} onClick={() => {
                      const newDue = new Date(new Date(inv.date).getTime() + term.val * 86400000).toISOString().split("T")[0];
                      upd("dueDate", newDue);
                    }}>
                      <div className="pt-opt-days">{term.days}</div>
                      <div className="pt-opt-label">{term.label}</div>
                    </div>
                  );
                })}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-select" value={inv.paymentMode} onChange={(e) => upd("paymentMode", e.target.value)}>
                    <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                    <option value="Online Payment Link">Online Payment Link</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select className="form-select" value={inv.currency} onChange={(e) => upd("currency", e.target.value)}>
                    <option value="₹">₹ INR – Indian Rupee</option>
                    <option value="$">$ USD – US Dollar</option>
                    <option value="€">€ EUR – Euro</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Bank Name</label>
                  <input className="form-input" type="text" value={inv.bankName} onChange={(e) => upd("bankName", e.target.value)} placeholder="e.g. HDFC Bank" />
                </div>
                <div className="form-group">
                  <label className="form-label">Account Number</label>
                  <input className="form-input" type="text" value={inv.accountNumber} onChange={(e) => upd("accountNumber", e.target.value)} placeholder="Account number" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">IFSC Code</label>
                  <input className="form-input" type="text" value={inv.ifscCode} onChange={(e) => upd("ifscCode", e.target.value)} placeholder="IFSC code" />
                </div>
                <div className="form-group">
                  <label className="form-label">UPI ID</label>
                  <input className="form-input" type="text" value={inv.upiId} onChange={(e) => upd("upiId", e.target.value)} placeholder="your@upi" />
                </div>
              </div>
            </div>
          </div>

          {/* NOTES & TERMS */}
          <div className="card">
            <div className="card-header">
              <div className="card-icon" style={{background:"var(--amber-bg)",color:"var(--amber)"}}><i className="ti ti-notes"></i></div>
              <div className="card-title">Notes, Terms & Signature</div>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Invoice Notes</label>
                <textarea className="form-textarea" value={inv.notes} onChange={(e) => upd("notes", e.target.value)} placeholder="Thank you for your business!" />
              </div>
              <div className="form-group">
                <label className="form-label">Terms & Conditions</label>
                <textarea className="form-textarea" value={inv.terms} onChange={(e) => upd("terms", e.target.value)} placeholder="Terms and conditions..." />
              </div>
              <div className="form-group">
                <label className="form-label">Authorised Signature</label>
                <div className="sig-pad" onClick={(e) => {
                  e.currentTarget.innerHTML = '<i class="ti ti-check" style="font-size:22px;color:var(--teal)"></i><div style="font-size:11px;color:var(--teal);font-weight:700;margin-top:4px">Signature Added</div>';
                }}>
                  <i className="ti ti-signature" style={{fontSize:"24px",color:"var(--text3)"}}></i>
                  <div style={{fontSize:"11px",color:"var(--text3)",fontWeight:"600"}}>Click to add signature</div>
                </div>
              </div>
            </div>
          </div>

        </div>"""

# Replace the left panel form cards section (between code block markers)
start_marker = '{/* Left Panel: Scrollable form cards */}'
end_marker = '{/* Right Side: Sticky Live Preview */}'

start_idx = code.find(start_marker)
end_idx = code.find(end_marker)

if start_idx != -1 and end_idx != -1:
    code = code[:start_idx] + left_panel_replacement + code[end_idx:]
    print("Injected form side layout successfully!")
else:
    print("WARNING: start_marker or end_marker not found")

with open('c:/M Business/M Business/src/components/InvoiceCreator.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS: Modified InvoiceCreator.jsx fully to use HTML template structure on the form side!")
