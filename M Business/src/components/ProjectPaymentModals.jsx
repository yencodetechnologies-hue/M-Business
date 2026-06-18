import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';

const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 99995, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
};
const modalStyle = {
  background: '#fff', borderRadius: 14, width: 500, padding: 24,
  boxShadow: '0 8px 32px rgba(0,0,0,0.15)', boxSizing: 'border-box',
  maxHeight: '90vh', overflowY: 'auto'
};
const headerStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20
};
const titleStyle = { margin: 0, fontSize: 18, color: '#1A2332', display: 'flex', alignItems: 'center', gap: 8 };
const closeBtnStyle = { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#7B8FA1' };

const labelStyle = { display: 'block', fontSize: 10, fontWeight: 800, color: '#7B8FA1', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E8EDF2', outline: 'none', fontSize: 13, boxSizing: 'border-box' };
const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 };
const btnRowStyle = { display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 };

const submitBtnStyle = { padding: '10px 24px', background: '#00BCD4', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer' };
const cancelBtnStyle = { padding: '10px 24px', background: '#fff', color: '#4A5568', border: '1.5px solid #E8EDF2', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer' };

export default function ProjectPaymentModals({
  project,
  modalsState,
  setModalsState,
  onSaveSuccess
}) {
  const { showNewInvoice, showPayment, showAdvance, showAdditional, showMilestonePayment, showExpense, editData, editIndex } = modalsState;

  // Generic form state
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm(editData);
      return;
    }

    if (showNewInvoice && !form.invoiceNo) {
      const len = (project?.invoices || []).length + 1;
      setForm(prev => ({ ...prev, invoiceNo: `INV-${String(len).padStart(3, '0')}` }));
    }
    if (showPayment && !form.paymentNo) {
      const len = (project?.paymentsReceived || []).length + 1;
      setForm(prev => ({ ...prev, paymentNo: `PAY-${String(len).padStart(3, '0')}` }));
    }
    if (showAdvance && !form.advanceNo) {
      const len = (project?.advances || []).length + 1;
      setForm(prev => ({ ...prev, advanceNo: `ADV-${String(len).padStart(3, '0')}` }));
    }
    if (showAdditional && !form.chargeNo) {
      const len = (project?.additionalCharges || []).length + 1;
      setForm(prev => ({ ...prev, chargeNo: `ADC-${String(len).padStart(3, '0')}` }));
    }
    if (showMilestonePayment && !form.milestoneNo) {
      const len = (project?.milestonePayments || []).length + 1;
      setForm(prev => ({ ...prev, milestoneNo: `MS-${String(len).padStart(3, '0')}` }));
    }
    if (showExpense && !form.expenseNo) {
      const len = (project?.expenses || []).length + 1;
      setForm(prev => ({ ...prev, expenseNo: `EXP-${String(len).padStart(3, '0')}` }));
    }
  }, [showNewInvoice, showPayment, showAdvance, showAdditional, showMilestonePayment, showExpense, project, editData]);

  const closeModals = () => {
    setModalsState({ showNewInvoice: false, showPayment: false, showAdvance: false, showAdditional: false, showMilestonePayment: false, showExpense: false, editData: null, editIndex: null });
    setForm({});
  };

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e, type) => {
    e.preventDefault();
    setSaving(true);
    try {
      let arrayName = '';
      if (type === 'invoice') arrayName = 'invoices';
      else if (type === 'payment') arrayName = 'paymentsReceived';
      else if (type === 'advance') arrayName = 'advances';
      else if (type === 'additional') arrayName = 'additionalCharges';
      else if (type === 'milestone') arrayName = 'milestonePayments';
      else if (type === 'expense') arrayName = 'expenses';

      const currentList = project[arrayName] || [];
      let updatedList = [...currentList];

      const payloadToSave = { ...form };
      if (payloadToSave.category === 'Other' && payloadToSave.customCategory) {
        payloadToSave.category = payloadToSave.customCategory;
      }
      if (payloadToSave.paymentMode === 'Custom' && payloadToSave.customPaymentMode) {
        payloadToSave.paymentMode = payloadToSave.customPaymentMode;
      }
      if (payloadToSave.taxPercent === '' && payloadToSave.customTaxPercent) {
        payloadToSave.taxPercent = payloadToSave.customTaxPercent;
      }

      if (editIndex !== undefined && editIndex !== null) {
        updatedList[editIndex] = { ...updatedList[editIndex], ...payloadToSave };
      } else {
        const newRecord = { ...payloadToSave, createdAt: new Date() };
        updatedList = [newRecord, ...currentList];
      }

      let updatesPayload = project.updates || [];
      if (form.notifyClient) {
        const title = `New ${type.charAt(0).toUpperCase() + type.slice(1)} Added`;
        const no = form.invoiceNo || form.paymentNo || form.advanceNo || form.chargeNo || form.milestoneNo || form.expenseNo || '';
        const amt = form.amount ? ` for INR${form.amount}` : '';
        const newUpdate = {
          text: `A new ${type} (${no})${amt} has been recorded and is visible in the client portal.`,
          title: title,
          date: new Date().toISOString(),
          author: 'System',
          type: 'billing'
        };
        updatesPayload = [newUpdate, ...updatesPayload];
      }

      const updatePayload = {
        [arrayName]: updatedList
      };

      if (form.notifyClient) {
        updatePayload.updates = updatesPayload;
      }

      // If it's an expense, also update the 'spent' counter for backward compatibility
      if (type === 'expense') {
        const parseAmt = (val) => {
          if (val === undefined || val === null) return 0;
          const num = Number(String(val).replace(/[^0-9.-]+/g, ''));
          return isNaN(num) ? 0 : num;
        };
        const diff = editIndex !== undefined ? (parseAmt(form.amount) - parseAmt(currentList[editIndex]?.amount)) : parseAmt(form.amount);
        updatePayload.spent = parseAmt(project.spent) + diff;
      }

      await axios.put(`${BASE_URL}/api/projects/${project._id}`, updatePayload);

      onSaveSuccess();
      closeModals();
    } catch (err) {
      console.error(`Failed to save ${type}:`, err);
      alert(`Failed to save ${type}.`);
    } finally {
      setSaving(false);
    }
  };

  if (showNewInvoice) {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <div style={headerStyle}>
            <h3 style={titleStyle}>
              <div style={{ background: '#E0F7FA', color: '#00BCD4', padding: 8, borderRadius: 8 }}><i className="ti ti-file-invoice"></i></div>
              New Invoice
            </h3>
            <button style={closeBtnStyle} onClick={closeModals}>✖</button>
          </div>
          <form onSubmit={e => handleSave(e, 'invoice')}>

            {/* -- 1. INVOICE DETAILS -- */}
            <div className="inv-creator-card">
              <div className="inv-creator-card-header">
                <div className="inv-creator-card-icon" style={{ background: "var(--teal-light)", color: "var(--teal)" }}><i className="ti ti-receipt-2"></i></div>
                <div className="inv-creator-card-title">Invoice Details</div>
              </div>
              <div className="inv-creator-card-body">
                <div className="inv-creator-form-row">
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">Invoice Number</label>
                    <input className="inv-creator-form-input" type="text" value={form.invoiceNo || ''} readOnly />
                  </div>
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">Invoice Date</label>
                    <input className="inv-creator-form-input" type="date" value={form.issueDate || ''} onChange={e => handleInputChange('issueDate', e.target.value)} />
                  </div>
                </div>
                <div className="inv-creator-form-row">
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">Due Date</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <select className="inv-creator-form-select"
                        value={form.dueDateType || '30'}
                        onChange={e => {
                          const val = e.target.value;
                          handleInputChange('dueDateType', val);
                          if (val !== 'custom') {
                            const days = parseInt(val) || 0;
                            const newDue = new Date(new Date(form.issueDate || Date.now()).getTime() + days * 86400000)
                              .toISOString().split('T')[0];
                            handleInputChange('dueDate', newDue);
                          }
                        }} style={{ flex: 1 }}>
                        <option value="0">Due on receipt</option>
                        <option value="15">Next 15 days</option>
                        <option value="30">Next 30 days</option>
                        <option value="45">Next 45 days</option>
                        <option value="custom">Custom date</option>
                      </select>
                      {form.dueDateType === 'custom' && (
                        <input type="date" className="inv-creator-form-input"
                          value={form.dueDate || ''}
                          onChange={e => handleInputChange('dueDate', e.target.value)}
                          style={{ flex: 1 }} />
                      )}
                    </div>
                  </div>
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">Category</label>
                    <select className="inv-creator-form-select" value={form.category || 'Consulting'} onChange={e => handleInputChange('category', e.target.value)}>
                      <option value="Advance Payment">Advance Payment</option>
                      <option value="Additional Payment">Additional Payment</option>
                      <option value="Milestone">Milestone</option>
                      <option value="Final Invoice">Final Invoice</option>
                      <option value="Monthly Retainer">Monthly Retainer</option>
                      <option value="Consulting">Consulting</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* -- 2. BILL TO (CLIENT) -- */}
            <div className="inv-creator-card">
              <div className="inv-creator-card-header">
                <div className="inv-creator-card-icon" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}><i className="ti ti-user-circle"></i></div>
                <div className="inv-creator-card-title">Bill To (Client)</div>
              </div>
              <div className="inv-creator-card-body">
                <div className="inv-creator-form-row">
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">Company / Client Name</label>
                    <input className="inv-creator-form-input" type="text" value={project.client || ''} readOnly />
                  </div>
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">Project</label>
                    <input className="inv-creator-form-input" type="text" value={project.name || ''} readOnly />
                  </div>
                </div>
                <div className="inv-creator-form-row">
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">Description</label>
                    <input required className="inv-creator-form-input" type="text" value={form.description || ''} onChange={e => handleInputChange('description', e.target.value)} placeholder="e.g. Development Sprint 3" />
                  </div>
                </div>
              </div>
            </div>

            {/* -- 3. LINE ITEMS -- */}
            <div className="inv-creator-card">
              <div className="inv-creator-card-header">
                <div className="inv-creator-card-icon" style={{ background: "var(--blue-bg)", color: "var(--blue)" }}><i className="ti ti-list-details"></i></div>
                <div className="inv-creator-card-title">Line Items</div>
              </div>
              <div className="inv-creator-card-body">
                {/* Amount + Tax inline table */}
                <div className="inv-creator-form-row">
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">Amount (Base)</label>
                    <input required className="inv-creator-form-input" type="number" value={form.amount || ''} onChange={e => handleInputChange('amount', Number(e.target.value))} placeholder="INR 0" onWheel={e => e.target.blur()} />
                  </div>
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">Discount (%)</label>
                    <input className="inv-creator-form-input" type="number" value={form.discountPct || 0} onChange={e => handleInputChange('discountPct', Number(e.target.value))} placeholder="0" onWheel={e => e.target.blur()} />
                  </div>
                </div>
                <div className="inv-creator-form-row">
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">GST / Tax Rate (%)</label>
                    <select className="inv-creator-form-select" value={form.taxPercent ?? 18} onChange={e => handleInputChange('taxPercent', e.target.value === 'custom' ? '' : Number(e.target.value))}>
                      <option value={0}>0% (No Tax)</option>
                      <option value={5}>5% (GST)</option>
                      <option value={12}>12% (GST)</option>
                      <option value={18}>18% (GST)</option>
                      <option value={28}>28% (GST)</option>
                      <option value="custom">Custom %</option>
                    </select>
                    {form.taxPercent === '' && (
                      <input className="inv-creator-form-input" type="number" style={{ marginTop: 6 }} value={form.customTaxPercent || ''} onChange={e => handleInputChange('customTaxPercent', Number(e.target.value))} placeholder="Enter custom %" />
                    )}
                  </div>
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">Tax Type</label>
                    <select className="inv-creator-form-select" value={form.taxType || 'exclusive'} onChange={e => handleInputChange('taxType', e.target.value)}>
                      <option value="exclusive">Excluding Tax</option>
                      <option value="inclusive">Including Tax</option>
                    </select>
                  </div>
                </div>
                <div className="inv-creator-form-row">
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">Shipping / Extra Charges</label>
                    <input className="inv-creator-form-input" type="number" value={form.extraCharges || 0} onChange={e => handleInputChange('extraCharges', Number(e.target.value))} placeholder="0" onWheel={e => e.target.blur()} />
                  </div>
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">Status</label>
                    <select className="inv-creator-form-select" value={form.status || 'Pending'} onChange={e => handleInputChange('status', e.target.value)}>
                      <option>Pending</option>
                      <option>Sent</option>
                      <option>Paid</option>
                      <option>Overdue</option>
                    </select>
                  </div>
                </div>
                {/* Totals summary */}
                {(form.amount > 0) && (() => {
                  const base = Number(form.amount) || 0;
                  const disc = base * ((Number(form.discountPct) || 0) / 100);
                  const afterDisc = base - disc;
                  const taxRate = Number(form.taxPercent === '' ? (form.customTaxPercent || 0) : (form.taxPercent ?? 18));
                  const gst = form.taxType === 'inclusive'
                    ? afterDisc - afterDisc / (1 + taxRate / 100)
                    : afterDisc * (taxRate / 100);
                  const extra = Number(form.extraCharges) || 0;
                  const grandTotal = form.taxType === 'inclusive' ? afterDisc + extra : afterDisc + gst + extra;
                  return (
                    <div className="inv-creator-totals-section" style={{ marginTop: 10 }}>
                      <div className="inv-creator-total-row"><span className="inv-creator-total-label">Subtotal</span><span className="inv-creator-total-val">INR{base.toLocaleString()}</span></div>
                      {disc > 0 && <div className="inv-creator-total-row discount"><span className="inv-creator-total-label">Discount</span><span className="inv-creator-total-val">- INR{Math.round(disc).toLocaleString()}</span></div>}
                      <div className="inv-creator-total-row tax"><span className="inv-creator-total-label">GST / Tax ({taxRate}%)</span><span className="inv-creator-total-val">+ INR{Math.round(gst).toLocaleString()}</span></div>
                      {extra > 0 && <div className="inv-creator-total-row"><span className="inv-creator-total-label">Extra Charges</span><span className="inv-creator-total-val">+ INR{extra.toLocaleString()}</span></div>}
                      <div className="inv-creator-total-row grand"><span className="inv-creator-total-label">Total Amount</span><span className="inv-creator-total-val">INR{Math.round(grandTotal).toLocaleString()}</span></div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* -- 4. PAYMENT TERMS & BANK DETAILS -- */}
            <div className="inv-creator-card">
              <div className="inv-creator-card-header">
                <div className="inv-creator-card-icon" style={{ background: "var(--green-bg)", color: "var(--green)" }}><i className="ti ti-clock"></i></div>
                <div className="inv-creator-card-title">Payment Terms & Bank Details</div>
              </div>
              <div className="inv-creator-card-body">
                <div className="inv-creator-form-row">
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">Status</label>
                    <select className="inv-creator-form-select" value={form.status || "Pending"} onChange={(e) => handleInputChange("status", e.target.value)}>
                      <option value="Pending">⏳ Pending</option>
                      <option value="Paid">✔ Paid</option>
                      <option value="Overdue">⚠ Overdue</option>
                      <option value="Sent">📨 Sent</option>
                      <option value="Draft">📝 Draft</option>
                    </select>
                  </div>
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">Payment Method</label>
                    <select className="inv-creator-form-select" value={form.paymentMode || 'Bank Transfer / NEFT'} onChange={e => handleInputChange('paymentMode', e.target.value)}>
                      <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                      <option value="UPI">UPI</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                      <option value="Online Payment Link">Online Payment Link</option>
                    </select>
                  </div>
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">Currency</label>
                    <select className="inv-creator-form-select" value={form.currency || 'INR'} onChange={e => handleInputChange('currency', e.target.value)}>
                      <option value="INR">INR - Indian Rupee</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="AED">AED - UAE Dirham</option>
                      <option value="SAR">SAR - Saudi Riyal</option>
                      <option value="SGD">SGD - Singapore Dollar</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                      <option value="QAR">QAR - Qatari Riyal</option>
                      <option value="KWD">KWD - Kuwaiti Dinar</option>
                      <option value="OMR">OMR - Omani Rial</option>
                      <option value="BHD">BHD - Bahraini Dinar</option>
                    </select>
                  </div>
                </div>
                <div className="inv-creator-form-row">
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">Bank Name</label>
                    <input className="inv-creator-form-input" type="text" value={form.bankName || ''} onChange={e => handleInputChange('bankName', e.target.value)} placeholder="e.g. HDFC Bank" />
                  </div>
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">Account Number</label>
                    <input className="inv-creator-form-input" type="text" value={form.accountNumber || ''} onChange={e => handleInputChange('accountNumber', e.target.value)} placeholder="Account number" />
                  </div>
                </div>
                <div className="inv-creator-form-row">
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">IFSC Code</label>
                    <input className="inv-creator-form-input" type="text" value={form.ifscCode || ''} onChange={e => handleInputChange('ifscCode', e.target.value)} placeholder="IFSC code" />
                  </div>
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">UPI ID</label>
                    <input className="inv-creator-form-input" type="text" value={form.upiId || ''} onChange={e => handleInputChange('upiId', e.target.value)} placeholder="your@upi" />
                  </div>
                </div>
                <div className="inv-creator-form-row">
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">Notes</label>
                    <textarea className="inv-creator-form-input" style={{ height: 70, resize: 'vertical' }} value={form.notes || ''} onChange={e => handleInputChange('notes', e.target.value)} placeholder="Additional notes for this invoice..." />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="notify-inv" checked={form.notifyClient || false} onChange={e => handleInputChange('notifyClient', e.target.checked)} />
              <label htmlFor="notify-inv" style={{ fontSize: 12, color: '#4A5568', fontWeight: 600, cursor: 'pointer' }}>Send to Client Portal (Notify Client)</label>
            </div>

            <div style={btnRowStyle}>
              <button type="button" style={cancelBtnStyle} onClick={closeModals}>Cancel</button>
              <button type="submit" style={submitBtnStyle} disabled={saving}>{saving ? 'Saving...' : '✔ Save Invoice'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (showPayment) {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <div style={headerStyle}>
            <h3 style={titleStyle}>
              <div style={{ background: '#DCFCE7', color: '#22C55E', padding: 8, borderRadius: 8 }}><i className="ti ti-credit-card"></i></div>
              Record Payment
            </h3>
            <button style={closeBtnStyle} onClick={closeModals}>✖</button>
          </div>
          <form onSubmit={e => handleSave(e, 'payment')}>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Payment #</label><input required style={inputStyle} value={form.paymentNo || ''} onChange={e => handleInputChange('paymentNo', e.target.value)} placeholder="PAY-004" /></div>
              <div><label style={labelStyle}>Linked Invoice</label><select style={inputStyle} value={form.linkedInvoice || ''} onChange={e => handleInputChange('linkedInvoice', e.target.value)}>
                <option value="">-- Select Invoice --</option>
                {(project.invoices || []).map(inv => <option key={inv.invoiceNo} value={inv.invoiceNo}>{inv.invoiceNo} - {inv.description}</option>)}
              </select></div>
            </div>
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>Description</label><input required style={inputStyle} value={form.description || ''} onChange={e => handleInputChange('description', e.target.value)} placeholder="e.g. Sprint 2 Balance Payment" /></div>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Amount Received</label><input required type="number" style={inputStyle} value={form.amount || ''} onChange={e => handleInputChange('amount', Number(e.target.value))} placeholder="INR 0" /></div>
              <div><label style={labelStyle}>Payment Date</label><input type="date" required style={inputStyle} value={form.paymentDate || ''} onChange={e => handleInputChange('paymentDate', e.target.value)} /></div>
            </div>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Payment Mode</label><select style={inputStyle} value={form.paymentMode || 'Bank Transfer'} onChange={e => handleInputChange('paymentMode', e.target.value)}>
                <option>Bank Transfer</option><option>UPI</option><option>Credit Card</option><option>Cash</option><option>Cheque</option>
              </select></div>
              <div><label style={labelStyle}>Transaction Ref</label><input style={inputStyle} value={form.transactionRef || ''} onChange={e => handleInputChange('transactionRef', e.target.value)} placeholder="TXN / UTR / Cheque No." /></div>
            </div>
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>Notes</label><textarea style={{ ...inputStyle, height: 80 }} value={form.notes || ''} onChange={e => handleInputChange('notes', e.target.value)} placeholder="Any additional notes..." /></div>

            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="notify-pay" checked={form.notifyClient || false} onChange={e => handleInputChange('notifyClient', e.target.checked)} />
              <label htmlFor="notify-pay" style={{ fontSize: 12, color: '#4A5568', fontWeight: 600, cursor: 'pointer' }}>Send to Client Portal (Notify Client)</label>
            </div>

            <div style={btnRowStyle}>
              <button type="button" style={cancelBtnStyle} onClick={closeModals}>Cancel</button>
              <button type="submit" style={submitBtnStyle} disabled={saving}>{saving ? 'Saving...' : '✔ Record Payment'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (showAdvance) {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <div style={headerStyle}>
            <h3 style={titleStyle}>
              <div style={{ background: '#EDE9FE', color: '#8B5CF6', padding: 8, borderRadius: 8 }}><i className="ti ti-pig-money"></i></div>
              Add Advance Payment
            </h3>
            <button style={closeBtnStyle} onClick={closeModals}>✖</button>
          </div>
          <form onSubmit={e => handleSave(e, 'advance')}>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Advance #</label><input required style={inputStyle} value={form.advanceNo || ''} onChange={e => handleInputChange('advanceNo', e.target.value)} placeholder="ADV-003" /></div>
              <div><label style={labelStyle}>Project</label><select style={inputStyle} disabled><option>{project.name}</option></select></div>
            </div>
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>Description</label><input required style={inputStyle} value={form.description || ''} onChange={e => handleInputChange('description', e.target.value)} placeholder="e.g. Phase 2 advance" /></div>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Amount</label><input required type="number" style={inputStyle} value={form.amount || ''} onChange={e => handleInputChange('amount', Number(e.target.value))} placeholder="INR 0" /></div>
              <div><label style={labelStyle}>Date Received</label><input type="date" required style={inputStyle} value={form.dateReceived || ''} onChange={e => handleInputChange('dateReceived', e.target.value)} /></div>
            </div>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Payment Mode</label><select style={inputStyle} value={form.paymentMode || 'Bank Transfer'} onChange={e => handleInputChange('paymentMode', e.target.value)}>
                <option>Bank Transfer</option><option>UPI</option><option>Credit Card</option><option>Cash</option><option>Cheque</option>
              </select></div>
              <div><label style={labelStyle}>Adjustment Status</label><select style={inputStyle} value={form.adjustmentStatus || 'Pending'} onChange={e => handleInputChange('adjustmentStatus', e.target.value)}>
                <option>Pending</option><option>Partially Adjusted</option><option>Fully Adjusted</option>
              </select></div>
            </div>
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>Amount Adjusted So Far</label><input type="number" style={inputStyle} value={form.amountAdjusted || ''} onChange={e => handleInputChange('amountAdjusted', Number(e.target.value))} placeholder="INR 0" /></div>
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>Notes</label><textarea style={{ ...inputStyle, height: 80 }} value={form.notes || ''} onChange={e => handleInputChange('notes', e.target.value)} placeholder="Terms or remarks..." /></div>

            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="notify-adv" checked={form.notifyClient || false} onChange={e => handleInputChange('notifyClient', e.target.checked)} />
              <label htmlFor="notify-adv" style={{ fontSize: 12, color: '#4A5568', fontWeight: 600, cursor: 'pointer' }}>Send to Client Portal (Notify Client)</label>
            </div>

            <div style={btnRowStyle}>
              <button type="button" style={cancelBtnStyle} onClick={closeModals}>Cancel</button>
              <button type="submit" style={submitBtnStyle} disabled={saving}>{saving ? 'Saving...' : '✔ Save Advance'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (showMilestonePayment) {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <div style={headerStyle}>
            <h3 style={titleStyle}>
              <div style={{ background: '#FEF3C7', color: '#F59E0B', padding: 8, borderRadius: 8 }}>
                <i className="ti ti-flag"></i>
              </div>
              Add Milestone Payment
            </h3>
            <button style={closeBtnStyle} onClick={closeModals}>✖</button>
          </div>
          <form onSubmit={e => handleSave(e, 'milestone')}>
            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Milestone #</label>
                <input required style={inputStyle} value={form.milestoneNo || ''} onChange={e => handleInputChange('milestoneNo', e.target.value)} placeholder="MS-005" />
              </div>
              <div>
                <label style={labelStyle}>Project</label>
                <select style={inputStyle} disabled><option>{project.name}</option></select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Milestone Name</label>
              <select
                required
                style={inputStyle}
                value={form.name || ''}
                onChange={e => handleInputChange('name', e.target.value)}
              >
                <option value="">-- Select Milestone --</option>
                {(project?.milestones || []).map((m, i) => (
                  <option key={i} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Description / Deliverables</label>
              <textarea required style={{ ...inputStyle, height: 60 }} value={form.description || ''} onChange={e => handleInputChange('description', e.target.value)} placeholder="What will be delivered at this milestone?" />
            </div>

            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Amount</label>
                <input required type="number" style={inputStyle} value={form.amount || ''} onChange={e => handleInputChange('amount', Number(e.target.value))} placeholder="INR 0" />
              </div>
              <div>
                <label style={labelStyle}>% of Total</label>
                <input type="number" style={inputStyle} value={form.percentage || ''} onChange={e => handleInputChange('percentage', Number(e.target.value))} placeholder="e.g. 25" />
              </div>
            </div>

            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Due Date</label>
                <input type="date" required style={inputStyle} value={form.dueDate || ''} onChange={e => handleInputChange('dueDate', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select style={inputStyle} value={form.status || 'Upcoming'} onChange={e => handleInputChange('status', e.target.value)}>
                  <option>Upcoming</option>
                  <option>Invoiced</option>
                  <option>Paid</option>
                </select>
              </div>
            </div>

            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Paid On</label>
                <input type="date" style={inputStyle} value={form.paidOn || ''} onChange={e => handleInputChange('paidOn', e.target.value)} />
              </div>
              <div></div>
            </div>

            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="notify-mil" checked={form.notifyClient || false} onChange={e => handleInputChange('notifyClient', e.target.checked)} />
              <label htmlFor="notify-mil" style={{ fontSize: 12, color: '#4A5568', fontWeight: 600, cursor: 'pointer' }}>
                Send to Client Portal (Notify Client)
              </label>
            </div>

            <div style={btnRowStyle}>
              <button type="button" style={cancelBtnStyle} onClick={closeModals}>Cancel</button>
              <button type="submit" style={submitBtnStyle} disabled={saving}>
                {saving ? 'Saving...' : '✔ Save Milestone'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (showAdditional) {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <div style={headerStyle}>
            <h3 style={titleStyle}>
              <div style={{ background: '#FFEDD5', color: '#F97316', padding: 8, borderRadius: 8 }}><i className="ti ti-circle-plus"></i></div>
              Add Additional Charge
            </h3>
            <button style={closeBtnStyle} onClick={closeModals}>✖</button>
          </div>
          <form onSubmit={e => handleSave(e, 'additional')}>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Charge #</label><input required style={inputStyle} value={form.chargeNo || ''} onChange={e => handleInputChange('chargeNo', e.target.value)} placeholder="ADC-001" /></div>
              <div><label style={labelStyle}>Category</label><select style={inputStyle} value={form.category || 'Scope Change'} onChange={e => handleInputChange('category', e.target.value)}>
                <option>Scope Change</option><option>Infrastructure</option><option>Consulting</option><option>Travel</option><option>Other</option>
              </select></div>
            </div>
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>Description</label><input required style={inputStyle} value={form.description || ''} onChange={e => handleInputChange('description', e.target.value)} placeholder="Describe the additional charge" /></div>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Amount</label><input required type="number" style={inputStyle} value={form.amount || ''} onChange={e => handleInputChange('amount', Number(e.target.value))} placeholder="INR 0" /></div>
              <div><label style={labelStyle}>Date</label><input type="date" required style={inputStyle} value={form.date || ''} onChange={e => handleInputChange('date', e.target.value)} /></div>
            </div>
            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Approved By</label>
                <select style={inputStyle} value={form.approvedBy || ''} onChange={e => handleInputChange('approvedBy', e.target.value)}>
                  <option value="">-- Select Approved By --</option>
                  <option value={project?.client || project?.clientName || 'Client'}>{project?.client || project?.clientName || 'Client'}</option>
                  {project?.contactPersonName && <option value={project.contactPersonName}>{project.contactPersonName} (Contact Person)</option>}
                  <option value="Project Manager">Project Manager</option>
                  <option value="System Admin">System Admin</option>
                </select>
              </div>
              <div><label style={labelStyle}>Status</label><select style={inputStyle} value={form.status || 'Pending'} onChange={e => handleInputChange('status', e.target.value)}>
                <option>Pending</option><option>Invoiced</option><option>Paid</option>
              </select></div>
            </div>
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>Justification / Notes</label><textarea style={{ ...inputStyle, height: 80 }} value={form.notes || ''} onChange={e => handleInputChange('notes', e.target.value)} placeholder="Why is this charge being raised?" /></div>

            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="notify-add" checked={form.notifyClient || false} onChange={e => handleInputChange('notifyClient', e.target.checked)} />
              <label htmlFor="notify-add" style={{ fontSize: 12, color: '#4A5568', fontWeight: 600, cursor: 'pointer' }}>Send to Client Portal (Notify Client)</label>
            </div>

            <div style={btnRowStyle}>
              <button type="button" style={cancelBtnStyle} onClick={closeModals}>Cancel</button>
              <button type="submit" style={submitBtnStyle} disabled={saving}>{saving ? 'Saving...' : '✔ Save Charge'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (showExpense) {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <div style={headerStyle}>
            <h3 style={titleStyle}>
              <div style={{ background: '#F3F4F6', color: '#6B7280', padding: 8, borderRadius: 8 }}><i className="ti ti-receipt"></i></div>
              Add Project Expense
            </h3>
            <button style={closeBtnStyle} onClick={closeModals}>✖</button>
          </div>
          <form onSubmit={e => handleSave(e, 'expense')}>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Expense #</label><input required style={inputStyle} value={form.expenseNo || ''} onChange={e => handleInputChange('expenseNo', e.target.value)} placeholder="EXP-001" /></div>
              <div><label style={labelStyle}>Category</label><select style={inputStyle} value={form.category || 'Software'} onChange={e => handleInputChange('category', e.target.value)}>
                <option>Software</option><option>Hardware</option><option>Contractor</option><option>Travel</option><option>Marketing</option><option>Other</option>
              </select></div>
            </div>
            {form.category === 'Other' && (
              <div style={{ marginBottom: 16 }}><label style={labelStyle}>Custom Category</label><input required style={inputStyle} value={form.customCategory || ''} onChange={e => handleInputChange('customCategory', e.target.value)} placeholder="Enter custom category" /></div>
            )}
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>Description</label><input required style={inputStyle} value={form.description || ''} onChange={e => handleInputChange('description', e.target.value)} placeholder="Describe the expense" /></div>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Amount</label><input required type="number" style={inputStyle} value={form.amount || ''} onChange={e => handleInputChange('amount', Number(e.target.value))} placeholder="INR 0" /></div>
              <div><label style={labelStyle}>Date Incurred</label><input type="date" required style={inputStyle} value={form.date || ''} onChange={e => handleInputChange('date', e.target.value)} /></div>
            </div>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Payment Mode</label><select style={inputStyle} value={form.paymentMode || 'Bank Transfer'} onChange={e => handleInputChange('paymentMode', e.target.value)}>
                <option>Bank Transfer</option><option>UPI</option><option>Credit Card</option><option>Cash</option><option>Cheque</option><option>Custom</option>
              </select></div>
              {form.paymentMode === 'Custom' ? (
                <div><label style={labelStyle}>Custom Payment Mode</label><input required style={inputStyle} value={form.customPaymentMode || ''} onChange={e => handleInputChange('customPaymentMode', e.target.value)} placeholder="Enter payment mode" /></div>
              ) : (
                <div><label style={labelStyle}>Status</label><select style={inputStyle} value={form.status || 'Paid'} onChange={e => handleInputChange('status', e.target.value)}>
                  <option>Paid</option><option>Pending</option>
                </select></div>
              )}
            </div>
            {form.paymentMode === 'Custom' && (
              <div style={rowStyle}>
                <div><label style={labelStyle}>Status</label><select style={inputStyle} value={form.status || 'Paid'} onChange={e => handleInputChange('status', e.target.value)}>
                  <option>Paid</option><option>Pending</option>
                </select></div>
                <div></div>
              </div>
            )}
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>Notes</label><textarea style={{ ...inputStyle, height: 60 }} value={form.notes || ''} onChange={e => handleInputChange('notes', e.target.value)} placeholder="Additional details..." /></div>

            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="notify-exp" checked={form.notifyClient || false} onChange={e => handleInputChange('notifyClient', e.target.checked)} />
              <label htmlFor="notify-exp" style={{ fontSize: 12, color: '#4A5568', fontWeight: 600, cursor: 'pointer' }}>Log to Project Updates</label>
            </div>

            <div style={btnRowStyle}>
              <button type="button" style={cancelBtnStyle} onClick={closeModals}>Cancel</button>
              <button type="submit" style={submitBtnStyle} disabled={saving}>{saving ? 'Saving...' : '✔ Save Expense'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
