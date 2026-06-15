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
        const amt = form.amount ? ` for ₹${form.amount}` : '';
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
              <div style={{background:'#E0F7FA', color:'#00BCD4', padding:8, borderRadius:8}}><i className="ti ti-file-invoice"></i></div>
              New Invoice
            </h3>
            <button style={closeBtnStyle} onClick={closeModals}>✕</button>
          </div>
          <form onSubmit={e => handleSave(e, 'invoice')}>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Invoice #</label><input required style={inputStyle} value={form.invoiceNo || ''} onChange={e => handleInputChange('invoiceNo', e.target.value)} placeholder="INV-005" /></div>
              <div><label style={labelStyle}>Project</label><select style={inputStyle} disabled><option>{project.name}</option></select></div>
            </div>
            <div style={{marginBottom: 16}}><label style={labelStyle}>Description</label><input required style={inputStyle} value={form.description || ''} onChange={e => handleInputChange('description', e.target.value)} placeholder="e.g. Development Sprint 3" /></div>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Client</label><input style={inputStyle} disabled value={project.client} /></div>
              <div><label style={labelStyle}>Amount</label><input required type="number" style={inputStyle} value={form.amount || ''} onChange={e => handleInputChange('amount', Number(e.target.value))} placeholder="₹ 0" /></div>
            </div>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Issue Date</label><input type="date" required style={inputStyle} value={form.issueDate || ''} onChange={e => handleInputChange('issueDate', e.target.value)} /></div>
              <div><label style={labelStyle}>Due Date</label><input type="date" required style={inputStyle} value={form.dueDate || ''} onChange={e => handleInputChange('dueDate', e.target.value)} /></div>
            </div>
            <div style={{marginBottom:12}}>
              <label style={labelStyle}>Tax</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                <div>
                  <input type="number" style={inputStyle} value={form.taxPercent || ''} onChange={e => handleInputChange('taxPercent', Number(e.target.value))} placeholder="e.g. 18" />
                  <div style={{fontSize:9,color:'#7B8FA1',marginTop:3,fontWeight:600}}>TAX RATE (%)</div>
                </div>
                <div>
                  <select style={inputStyle} value={form.taxType || 'exclusive'} onChange={e => handleInputChange('taxType', e.target.value)}>
                    <option value="exclusive">Excluding Tax</option>
                    <option value="inclusive">Including Tax</option>
                  </select>
                  <div style={{fontSize:9,color:'#7B8FA1',marginTop:3,fontWeight:600}}>TAX TYPE</div>
                </div>
                <div>
                  <select style={inputStyle} value={form.status || 'Draft'} onChange={e => handleInputChange('status', e.target.value)}>
                    <option>Draft</option><option>Sent</option><option>Paid</option><option>Overdue</option>
                  </select>
                  <div style={{fontSize:9,color:'#7B8FA1',marginTop:3,fontWeight:600}}>STATUS</div>
                </div>
              </div>
              {form.amount > 0 && form.taxPercent > 0 && (
                <div style={{marginTop:10, padding:'8px 12px', background: form.taxType==='inclusive' ? '#F0FDF4' : '#FFFBEB', borderRadius:8, fontSize:12, color:'#374151', display:'flex', justifyContent:'space-between'}}>
                  {form.taxType === 'inclusive' ? (
                    <><span>Base Amount: <strong>₹{Math.round(form.amount / (1 + form.taxPercent/100)).toLocaleString()}</strong></span>
                    <span>GST included: <strong>₹{Math.round(form.amount - form.amount/(1+form.taxPercent/100)).toLocaleString()}</strong></span>
                    <span>Total: <strong>₹{form.amount.toLocaleString()}</strong></span></>
                  ) : (
                    <><span>Base: <strong>₹{form.amount.toLocaleString()}</strong></span>
                    <span>GST: <strong>₹{Math.round(form.amount * form.taxPercent/100).toLocaleString()}</strong></span>
                    <span>Total: <strong>₹{Math.round(form.amount * (1+form.taxPercent/100)).toLocaleString()}</strong></span></>
                  )}
                </div>
              )}
            </div>
            <div style={{marginBottom: 16}}><label style={labelStyle}>Notes</label><textarea style={{...inputStyle, height:80}} value={form.notes || ''} onChange={e => handleInputChange('notes', e.target.value)} placeholder="Additional notes for this invoice..." /></div>
            
            <div style={{marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8}}>
              <input type="checkbox" id="notify-inv" checked={form.notifyClient || false} onChange={e => handleInputChange('notifyClient', e.target.checked)} />
              <label htmlFor="notify-inv" style={{fontSize: 12, color: '#4A5568', fontWeight: 600, cursor: 'pointer'}}>Send to Client Portal (Notify Client)</label>
            </div>

            <div style={btnRowStyle}>
              <button type="button" style={cancelBtnStyle} onClick={closeModals}>Cancel</button>
              <button type="submit" style={submitBtnStyle} disabled={saving}>{saving ? 'Saving...' : '✓ Save Invoice'}</button>
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
              <div style={{background:'#DCFCE7', color:'#22C55E', padding:8, borderRadius:8}}><i className="ti ti-credit-card"></i></div>
              Record Payment
            </h3>
            <button style={closeBtnStyle} onClick={closeModals}>✕</button>
          </div>
          <form onSubmit={e => handleSave(e, 'payment')}>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Payment #</label><input required style={inputStyle} value={form.paymentNo || ''} onChange={e => handleInputChange('paymentNo', e.target.value)} placeholder="PAY-004" /></div>
              <div><label style={labelStyle}>Linked Invoice</label><select style={inputStyle} value={form.linkedInvoice || ''} onChange={e => handleInputChange('linkedInvoice', e.target.value)}>
                <option value="">-- Select Invoice --</option>
                {(project.invoices || []).map(inv => <option key={inv.invoiceNo} value={inv.invoiceNo}>{inv.invoiceNo} - {inv.description}</option>)}
              </select></div>
            </div>
            <div style={{marginBottom: 16}}><label style={labelStyle}>Description</label><input required style={inputStyle} value={form.description || ''} onChange={e => handleInputChange('description', e.target.value)} placeholder="e.g. Sprint 2 Balance Payment" /></div>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Amount Received</label><input required type="number" style={inputStyle} value={form.amount || ''} onChange={e => handleInputChange('amount', Number(e.target.value))} placeholder="₹ 0" /></div>
              <div><label style={labelStyle}>Payment Date</label><input type="date" required style={inputStyle} value={form.paymentDate || ''} onChange={e => handleInputChange('paymentDate', e.target.value)} /></div>
            </div>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Payment Mode</label><select style={inputStyle} value={form.paymentMode || 'Bank Transfer'} onChange={e => handleInputChange('paymentMode', e.target.value)}>
                <option>Bank Transfer</option><option>UPI</option><option>Credit Card</option><option>Cash</option><option>Cheque</option>
              </select></div>
              <div><label style={labelStyle}>Transaction Ref</label><input style={inputStyle} value={form.transactionRef || ''} onChange={e => handleInputChange('transactionRef', e.target.value)} placeholder="TXN / UTR / Cheque No." /></div>
            </div>
            <div style={{marginBottom: 16}}><label style={labelStyle}>Notes</label><textarea style={{...inputStyle, height:80}} value={form.notes || ''} onChange={e => handleInputChange('notes', e.target.value)} placeholder="Any additional notes..." /></div>
            
            <div style={{marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8}}>
              <input type="checkbox" id="notify-pay" checked={form.notifyClient || false} onChange={e => handleInputChange('notifyClient', e.target.checked)} />
              <label htmlFor="notify-pay" style={{fontSize: 12, color: '#4A5568', fontWeight: 600, cursor: 'pointer'}}>Send to Client Portal (Notify Client)</label>
            </div>

            <div style={btnRowStyle}>
              <button type="button" style={cancelBtnStyle} onClick={closeModals}>Cancel</button>
              <button type="submit" style={submitBtnStyle} disabled={saving}>{saving ? 'Saving...' : '✓ Record Payment'}</button>
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
              <div style={{background:'#EDE9FE', color:'#8B5CF6', padding:8, borderRadius:8}}><i className="ti ti-pig-money"></i></div>
              Add Advance Payment
            </h3>
            <button style={closeBtnStyle} onClick={closeModals}>✕</button>
          </div>
          <form onSubmit={e => handleSave(e, 'advance')}>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Advance #</label><input required style={inputStyle} value={form.advanceNo || ''} onChange={e => handleInputChange('advanceNo', e.target.value)} placeholder="ADV-003" /></div>
              <div><label style={labelStyle}>Project</label><select style={inputStyle} disabled><option>{project.name}</option></select></div>
            </div>
            <div style={{marginBottom: 16}}><label style={labelStyle}>Description</label><input required style={inputStyle} value={form.description || ''} onChange={e => handleInputChange('description', e.target.value)} placeholder="e.g. Phase 2 advance" /></div>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Amount</label><input required type="number" style={inputStyle} value={form.amount || ''} onChange={e => handleInputChange('amount', Number(e.target.value))} placeholder="₹ 0" /></div>
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
            <div style={{marginBottom: 16}}><label style={labelStyle}>Amount Adjusted So Far</label><input type="number" style={inputStyle} value={form.amountAdjusted || ''} onChange={e => handleInputChange('amountAdjusted', Number(e.target.value))} placeholder="₹ 0" /></div>
            <div style={{marginBottom: 16}}><label style={labelStyle}>Notes</label><textarea style={{...inputStyle, height:80}} value={form.notes || ''} onChange={e => handleInputChange('notes', e.target.value)} placeholder="Terms or remarks..." /></div>
            
            <div style={{marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8}}>
              <input type="checkbox" id="notify-adv" checked={form.notifyClient || false} onChange={e => handleInputChange('notifyClient', e.target.checked)} />
              <label htmlFor="notify-adv" style={{fontSize: 12, color: '#4A5568', fontWeight: 600, cursor: 'pointer'}}>Send to Client Portal (Notify Client)</label>
            </div>

            <div style={btnRowStyle}>
              <button type="button" style={cancelBtnStyle} onClick={closeModals}>Cancel</button>
              <button type="submit" style={submitBtnStyle} disabled={saving}>{saving ? 'Saving...' : '✓ Save Advance'}</button>
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
              <div style={{background:'#FEF3C7', color:'#F59E0B', padding:8, borderRadius:8}}><i className="ti ti-flag"></i></div>
              Add Milestone Payment
            </h3>
            <button style={closeBtnStyle} onClick={closeModals}>✕</button>
          </div>
          <form onSubmit={e => handleSave(e, 'milestone')}>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Milestone #</label><input required style={inputStyle} value={form.milestoneNo || ''} onChange={e => handleInputChange('milestoneNo', e.target.value)} placeholder="MS-005" /></div>
              <div><label style={labelStyle}>Project</label><select style={inputStyle} disabled><option>{project.name}</option></select></div>
            </div>
            <div style={{marginBottom: 16}}><label style={labelStyle}>Milestone Name</label><input required style={inputStyle} value={form.name || ''} onChange={e => handleInputChange('name', e.target.value)} placeholder="e.g. UAT Sign-off" /></div>
            <div style={{marginBottom: 16}}><label style={labelStyle}>Description / Deliverables</label><textarea required style={{...inputStyle, height:60}} value={form.description || ''} onChange={e => handleInputChange('description', e.target.value)} placeholder="What will be delivered at this milestone?" /></div>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Amount</label><input required type="number" style={inputStyle} value={form.amount || ''} onChange={e => handleInputChange('amount', Number(e.target.value))} placeholder="₹ 0" /></div>
              <div><label style={labelStyle}>% of Total</label><input type="number" style={inputStyle} value={form.percentage || ''} onChange={e => handleInputChange('percentage', Number(e.target.value))} placeholder="e.g. 25" /></div>
            </div>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Due Date</label><input type="date" required style={inputStyle} value={form.dueDate || ''} onChange={e => handleInputChange('dueDate', e.target.value)} /></div>
              <div><label style={labelStyle}>Status</label><select style={inputStyle} value={form.status || 'Upcoming'} onChange={e => handleInputChange('status', e.target.value)}>
                <option>Upcoming</option><option>Invoiced</option><option>Paid</option>
              </select></div>
            </div>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Paid On</label><input type="date" style={inputStyle} value={form.paidOn || ''} onChange={e => handleInputChange('paidOn', e.target.value)} /></div>
              <div></div>
            </div>
            
            <div style={{marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8}}>
              <input type="checkbox" id="notify-mil" checked={form.notifyClient || false} onChange={e => handleInputChange('notifyClient', e.target.checked)} />
              <label htmlFor="notify-mil" style={{fontSize: 12, color: '#4A5568', fontWeight: 600, cursor: 'pointer'}}>Send to Client Portal (Notify Client)</label>
            </div>

            <div style={btnRowStyle}>
              <button type="button" style={cancelBtnStyle} onClick={closeModals}>Cancel</button>
              <button type="submit" style={submitBtnStyle} disabled={saving}>{saving ? 'Saving...' : '✓ Save Milestone'}</button>
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
              <div style={{background:'#FFEDD5', color:'#F97316', padding:8, borderRadius:8}}><i className="ti ti-circle-plus"></i></div>
              Add Additional Charge
            </h3>
            <button style={closeBtnStyle} onClick={closeModals}>✕</button>
          </div>
          <form onSubmit={e => handleSave(e, 'additional')}>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Charge #</label><input required style={inputStyle} value={form.chargeNo || ''} onChange={e => handleInputChange('chargeNo', e.target.value)} placeholder="ADC-001" /></div>
              <div><label style={labelStyle}>Category</label><select style={inputStyle} value={form.category || 'Scope Change'} onChange={e => handleInputChange('category', e.target.value)}>
                <option>Scope Change</option><option>Infrastructure</option><option>Consulting</option><option>Travel</option><option>Other</option>
              </select></div>
            </div>
            <div style={{marginBottom: 16}}><label style={labelStyle}>Description</label><input required style={inputStyle} value={form.description || ''} onChange={e => handleInputChange('description', e.target.value)} placeholder="Describe the additional charge" /></div>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Amount</label><input required type="number" style={inputStyle} value={form.amount || ''} onChange={e => handleInputChange('amount', Number(e.target.value))} placeholder="₹ 0" /></div>
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
            <div style={{marginBottom: 16}}><label style={labelStyle}>Justification / Notes</label><textarea style={{...inputStyle, height:80}} value={form.notes || ''} onChange={e => handleInputChange('notes', e.target.value)} placeholder="Why is this charge being raised?" /></div>
            
            <div style={{marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8}}>
              <input type="checkbox" id="notify-add" checked={form.notifyClient || false} onChange={e => handleInputChange('notifyClient', e.target.checked)} />
              <label htmlFor="notify-add" style={{fontSize: 12, color: '#4A5568', fontWeight: 600, cursor: 'pointer'}}>Send to Client Portal (Notify Client)</label>
            </div>

            <div style={btnRowStyle}>
              <button type="button" style={cancelBtnStyle} onClick={closeModals}>Cancel</button>
              <button type="submit" style={submitBtnStyle} disabled={saving}>{saving ? 'Saving...' : '✓ Save Charge'}</button>
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
              <div style={{background:'#F3F4F6', color:'#6B7280', padding:8, borderRadius:8}}><i className="ti ti-receipt"></i></div>
              Add Project Expense
            </h3>
            <button style={closeBtnStyle} onClick={closeModals}>✕</button>
          </div>
          <form onSubmit={e => handleSave(e, 'expense')}>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Expense #</label><input required style={inputStyle} value={form.expenseNo || ''} onChange={e => handleInputChange('expenseNo', e.target.value)} placeholder="EXP-001" /></div>
              <div><label style={labelStyle}>Category</label><select style={inputStyle} value={form.category || 'Software'} onChange={e => handleInputChange('category', e.target.value)}>
                <option>Software</option><option>Hardware</option><option>Contractor</option><option>Travel</option><option>Marketing</option><option>Other</option>
              </select></div>
            </div>
            {form.category === 'Other' && (
              <div style={{marginBottom: 16}}><label style={labelStyle}>Custom Category</label><input required style={inputStyle} value={form.customCategory || ''} onChange={e => handleInputChange('customCategory', e.target.value)} placeholder="Enter custom category" /></div>
            )}
            <div style={{marginBottom: 16}}><label style={labelStyle}>Description</label><input required style={inputStyle} value={form.description || ''} onChange={e => handleInputChange('description', e.target.value)} placeholder="Describe the expense" /></div>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Amount</label><input required type="number" style={inputStyle} value={form.amount || ''} onChange={e => handleInputChange('amount', Number(e.target.value))} placeholder="₹ 0" /></div>
              <div><label style={labelStyle}>Date Incurred</label><input type="date" required style={inputStyle} value={form.date || ''} onChange={e => handleInputChange('date', e.target.value)} /></div>
            </div>
            <div style={rowStyle}>
              <div><label style={labelStyle}>Payment Mode</label><select style={inputStyle} value={form.paymentMode || 'Bank Transfer'} onChange={e => handleInputChange('paymentMode', e.target.value)}>
                <option>Bank Transfer</option><option>UPI</option><option>Credit Card</option><option>Cash</option><option>Cheque</option><option>Custom</option>
              </select></div>
              {form.paymentMode === 'Custom' ? (
                <div><label style={labelStyle}>Custom Payment Mode</label><input required style={inputStyle} value={form.customPaymentMode || ''} onChange={e => handleInputChange('customPaymentMode', e.target.value)} placeholder="Enter payment mode" /></div>
              ) : <div></div>}
            </div>
            <div style={{marginBottom: 16}}><label style={labelStyle}>Notes</label><textarea style={{...inputStyle, height:60}} value={form.notes || ''} onChange={e => handleInputChange('notes', e.target.value)} placeholder="Additional details..." /></div>
            
            <div style={{marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8}}>
              <input type="checkbox" id="notify-exp" checked={form.notifyClient || false} onChange={e => handleInputChange('notifyClient', e.target.checked)} />
              <label htmlFor="notify-exp" style={{fontSize: 12, color: '#4A5568', fontWeight: 600, cursor: 'pointer'}}>Log to Project Updates</label>
            </div>

            <div style={btnRowStyle}>
              <button type="button" style={cancelBtnStyle} onClick={closeModals}>Cancel</button>
              <button type="submit" style={submitBtnStyle} disabled={saving}>{saving ? 'Saving...' : '✓ Save Expense'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
