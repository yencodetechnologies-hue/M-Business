import sys

filepath = r'c:\M Business\M Business\src\components\ModernProjectDetails.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_block = '''      {/* Invoice Preview Modal - Full Template */}
      {previewInvoice && (() => {
        const inv = previewInvoice;
        const clientInfo = clients?.find(c => (c.clientName || c.name) === (inv.clientName || clientName));
        const lineItems = (inv.items && inv.items.length > 0) ? inv.items : [
          { id: 1, description: inv.description || 'Service', quantity: 1, rate: inv.amount || 0, gstRate: inv.taxPercent || 0 }
        ];
        const taxRate = Number(inv.taxPercent === '' ? (inv.customTaxPercent || 0) : (inv.taxPercent ?? 0));
        const isInclusive = inv.taxType === 'inclusive';
        let subtotal = 0;
        let totalTax = 0;
        lineItems.forEach(item => {
          const qty = Number(item.quantity) || 1;
          const rate = Number(item.rate) || 0;
          const lineTotal = qty * rate;
          const itemTax = Number(item.gstRate !== undefined ? item.gstRate : taxRate);
          subtotal += lineTotal;
          if (isInclusive) { totalTax += lineTotal - lineTotal / (1 + itemTax / 100); }
          else { totalTax += lineTotal * (itemTax / 100); }
        });
        const discAmt = subtotal * ((Number(inv.discountPct) || 0) / 100);
        const afterDisc = subtotal - discAmt;
        const extra = Number(inv.extraCharges) || 0;
        const grandTotal = isInclusive ? afterDisc + extra : afterDisc + totalTax + extra;
        const amountPaid = Number(inv.amountPaid) || 0;
        const balanceDue = grandTotal - amountPaid;
        const accentColor = '#00BCD4';
        const s = (inv.status || '').toLowerCase();
        const statusLabel = s === 'paid' ? 'PAID' : s === 'part_paid' ? 'PART PAID' : s === 'overdue' ? 'OVERDUE' : s === 'sent' ? 'SENT' : s === 'draft' ? 'DRAFT' : 'PENDING';
        const statusStyle = s === 'paid' ? { bg: '#d1fae5', color: '#059669', border: '#10b981' }
          : s === 'part_paid' ? { bg: '#fef3c7', color: '#b45309', border: '#f59e0b' }
          : s === 'overdue' ? { bg: '#fee2e2', color: '#dc2626', border: '#ef4444' }
          : s === 'sent' ? { bg: '#dbeafe', color: '#1d4ed8', border: '#3b82f6' }
          : { bg: '#f1f5f9', color: '#64748b', border: '#94a3b8' };
        const fmtDate = (d) => { if (!d) return '—'; return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); };
        const fmtAmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '20px 16px' }}>
            <div style={{ width: '100%', maxWidth: 820 }}>
              {/* Toolbar */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                <button onClick={() => { setPreviewInvoice(null); setPaymentModalsState(prev => ({ ...prev, showNewInvoice: true, editData: inv, editIndex: (currProject.invoices || []).findIndex(i => i.invoiceNo === inv.invoiceNo) })); }}
                  style={{ padding: '9px 18px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ti ti-edit" /> Edit
                </button>
                <button onClick={() => window.print()}
                  style={{ padding: '9px 18px', background: accentColor, border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ti ti-printer" /> Print / PDF
                </button>
                <button onClick={() => { if (confirm('Delete this invoice?')) { handleDeleteRecord('invoices', (currProject.invoices || []).findIndex(i => i.invoiceNo === inv.invoiceNo)); setPreviewInvoice(null); } }}
                  style={{ padding: '9px 18px', background: '#fee2e2', border: '1.5px solid #fecaca', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ti ti-trash" /> Delete
                </button>
                <button onClick={() => setPreviewInvoice(null)}
                  style={{ padding: '9px 18px', background: '#1e293b', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#fff' }}>
                  ✕ Close
                </button>
              </div>
              {/* Invoice Paper */}
              <div id="invoice-print-area" style={{ background: '#fff', borderRadius: 18, boxShadow: '0 24px 80px rgba(0,188,212,0.18)', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ background: '#f8fafc', padding: '28px 36px', borderBottom: '1px solid #e5e7eb', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', width: 240, height: 240, borderRadius: '50%', background: `radial-gradient(circle, ${accentColor}0d, transparent)`, top: -80, right: -40 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
                    <div>
                      {user?.logoUrl ? (
                        <img src={user.logoUrl} alt="logo" style={{ height: 70, borderRadius: 10, marginBottom: 10, objectFit: 'contain' }} />
                      ) : (
                        <div style={{ height: 56, width: 56, background: `linear-gradient(135deg,${accentColor},#0097A7)`, borderRadius: 10, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff' }}>
                          {(user?.companyName || currProject?.client || 'Y')[0].toUpperCase()}
                        </div>
                      )}
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#0f1c2e', textTransform: 'uppercase', letterSpacing: 1 }}>{user?.companyName || inv.companyName || 'Your Company'}</div>
                      {(user?.email || inv.companyEmail) && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{user?.email || inv.companyEmail}</div>}
                      {(user?.phone || inv.companyPhone) && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{user?.phone || inv.companyPhone}</div>}
                      {(user?.address || inv.companyAddress) && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{user?.address || inv.companyAddress}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 36, fontWeight: 900, color: `${accentColor}1a`, letterSpacing: -2, lineHeight: 1, marginBottom: 4 }}>INVOICE</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: accentColor }}>{inv.invoiceNo}</div>
                      <div style={{ marginTop: 14, display: 'flex', gap: 20, justifyContent: 'flex-end' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>DATE</div>
                          <div style={{ fontSize: 12, color: '#0f1c2e', fontWeight: 700 }}>{fmtDate(inv.issueDate || inv.date)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>DUE DATE</div>
                          <div style={{ fontSize: 12, color: '#ea580c', fontWeight: 700 }}>{fmtDate(inv.dueDate)}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 10, textAlign: 'right' }}>
                        <span style={{ display: 'inline-block', padding: '4px 14px', border: `1.5px solid ${statusStyle.border}`, borderRadius: 20, color: statusStyle.color, fontSize: 11, fontWeight: 800, background: statusStyle.bg, letterSpacing: 1 }}>{statusLabel}</span>
                      </div>
                      {(inv.projectName || currProject?.name) && (
                        <div style={{ marginTop: 16, textAlign: 'right' }}>
                          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>PROJECT</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f1c2e' }}>{inv.projectName || currProject.name}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Bill To */}
                <div style={{ padding: '20px 36px', borderBottom: '2px solid #e5e7eb' }}>
                  <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' }}>Bill To</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#0f1c2e' }}>{inv.clientName || clientName || '—'}</div>
                  {clientInfo?.companyName && <div style={{ fontSize: 13, color: accentColor, fontWeight: 600, marginTop: 2 }}>{clientInfo.companyName}</div>}
                  {clientInfo?.email && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 5 }}>📧 {clientInfo.email}</div>}
                  {clientInfo?.phone && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>📱 {clientInfo.phone}</div>}
                  {clientInfo?.gstNumber && <div style={{ fontSize: 12, color: accentColor, marginTop: 4, fontWeight: 600 }}>💎 GST: {clientInfo.gstNumber}</div>}
                </div>
                {/* Line Items */}
                <div style={{ padding: '22px 36px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['#', 'Description', 'Qty', 'Unit Rate', 'Tax Rate', 'Amount'].map((h, i) => (
                          <th key={i} style={{ padding: '9px 11px', fontSize: 9, fontWeight: 800, color: '#64748b', letterSpacing: 1.5, borderBottom: '2px solid #e5e7eb', textAlign: ['Amount', 'Unit Rate', 'Qty', 'Tax Rate'].includes(h) ? 'right' : 'left', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, idx) => {
                        const qty = Number(item.quantity) || 1;
                        const rate = Number(item.rate) || 0;
                        const itemTaxRate = Number(item.gstRate !== undefined ? item.gstRate : taxRate);
                        const lineTotal = qty * rate;
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 11px', fontSize: 12, color: '#64748b', fontWeight: 700 }}>{String(idx + 1).padStart(2, '0')}</td>
                            <td style={{ padding: '12px 11px', fontSize: 13, color: '#0f1c2e', fontWeight: 600 }}>{item.description || 'Service'}</td>
                            <td style={{ padding: '12px 11px', fontSize: 13, color: '#374151', textAlign: 'right' }}>{qty}</td>
                            <td style={{ padding: '12px 11px', fontSize: 13, color: '#374151', textAlign: 'right' }}>{fmtAmt(rate)}</td>
                            <td style={{ padding: '12px 11px', fontSize: 13, color: '#6b7280', textAlign: 'right' }}>{itemTaxRate}%</td>
                            <td style={{ padding: '12px 11px', fontSize: 14, color: '#0f1c2e', textAlign: 'right', fontWeight: 700 }}>{fmtAmt(lineTotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Totals */}
                <div style={{ padding: '0 36px 28px', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ minWidth: 260 }}>
                    {[
                      { label: 'Subtotal', value: fmtAmt(subtotal), color: '#374151' },
                      discAmt > 0 && { label: 'Discount', value: `- ${fmtAmt(discAmt)}`, color: '#22c55e' },
                      { label: 'GST / Tax', value: fmtAmt(totalTax), color: '#f59e0b' },
                      extra > 0 && { label: 'Extra Charges', value: fmtAmt(extra), color: '#374151' },
                      amountPaid > 0 && { label: 'Paid (Advance)', value: `- ${fmtAmt(amountPaid)}`, color: '#22c55e' },
                    ].filter(Boolean).map((row, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b' }}>{row.label}</span>
                        <span style={{ fontWeight: 700, color: row.color }}>{row.value}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#0f1c2e', borderRadius: 8, marginTop: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Balance Due</span>
                      <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{fmtAmt(balanceDue)}</span>
                    </div>
                  </div>
                </div>
                {/* Notes */}
                {inv.notes && (
                  <div style={{ padding: '14px 36px', borderTop: '1px solid #e5e7eb', background: '#f8fafc' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Notes</div>
                    <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>{inv.notes}</div>
                  </div>
                )}
                {/* Footer */}
                <div style={{ borderTop: '1px solid #e5e7eb', padding: '10px 36px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{inv.invoiceNo}</div>
                  <div style={{ position: 'relative' }}>
                    {(() => {
                      const st = (inv.status || '').toLowerCase();
                      const cfg = st === 'paid' ? { label: 'Paid', bg: '#DCFCE7', color: '#15803D', icon: '✓' }
                        : st === 'overdue' ? { label: 'Overdue', bg: '#FEE2E2', color: '#DC2626', icon: '⚠' }
                        : st === 'sent' ? { label: 'Sent', bg: '#DBEAFE', color: '#1D4ED8', icon: '📨' }
                        : { label: 'Pending', bg: '#FEF3C7', color: '#B45309', icon: '⏳' };
                      return (
                        <>
                          <span onClick={() => setShowStatusDropdown(prev => !prev)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 14px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 800, border: `1.5px solid ${cfg.color}`, cursor: 'pointer', userSelect: 'none' }}>
                            {cfg.icon} {cfg.label} <span style={{ fontSize: 10 }}>▼</span>
                          </span>
                          {showStatusDropdown && (
                            <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: '#fff', border: '1px solid #E8EDF2', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: 150, overflow: 'hidden' }}>
                              {[
                                { label: 'Pending', color: '#B45309', bg: '#FEF3C7', icon: '⏳' },
                                { label: 'Paid', color: '#15803D', bg: '#DCFCE7', icon: '✓' },
                                { label: 'Overdue', color: '#DC2626', bg: '#FEE2E2', icon: '⚠' },
                                { label: 'Sent', color: '#1D4ED8', bg: '#DBEAFE', icon: '📨' },
                              ].map(opt => (
                                <div key={opt.label}
                                  onClick={async () => {
                                    const updatedInvoices = (currProject.invoices || []).map(x => x.invoiceNo === inv.invoiceNo ? { ...x, status: opt.label } : x);
                                    await axios.put(`${BASE_URL}/api/projects/${currProject._id}`, { invoices: updatedInvoices });
                                    setShowStatusDropdown(false);
                                    setPreviewInvoice(prev => ({ ...prev, status: opt.label }));
                                    loadLatest();
                                  }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', cursor: 'pointer', background: st === opt.label.toLowerCase() ? opt.bg : '#fff', borderBottom: '1px solid #F3F4F6' }}
                                  onMouseEnter={e => e.currentTarget.style.background = opt.bg}
                                  onMouseLeave={e => e.currentTarget.style.background = st === opt.label.toLowerCase() ? opt.bg : '#fff'}>
                                  <span>{opt.icon}</span>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: opt.color }}>{opt.label}</span>
                                  {st === opt.label.toLowerCase() && <span style={{ marginLeft: 'auto', fontSize: 11 }}>✓</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{currProject?.name}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
'''

new_lines = lines[:1983] + [new_block] + lines[2167:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Done! Updated ModernProjectDetails.jsx with correct template style.")
