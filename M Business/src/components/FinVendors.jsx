import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';

export default function FinVendors() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewVendor, setViewVendor] = useState(null);
  const [payingVendor, setPayingVendor] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [savingPay, setSavingPay] = useState(false);
  const [newVendor, setNewVendor] = useState({
    vendorName: '', vendorProduct: '', amount: 0, tax: 0, gst: 0, paidAmount: 0, productDescription: '', modeOfPayment: 'Bank Transfer'
  });

  const fetchVendors = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/vendors`, {
        headers: { "x-company-id": localStorage.getItem("companyId") || "" }
      });
      setVendors(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const openImport = () => setIsImportModalOpen(true);
  const closeImport = () => setIsImportModalOpen(false);

  const saveVendor = async () => {
    try {
      await axios.post(`${BASE_URL}/api/vendors`, newVendor, {
        headers: { "x-company-id": localStorage.getItem("companyId") || "" }
      });
      setIsAddVendorModalOpen(false);
      alert('Vendor added!');
      fetchVendors();
      setNewVendor({ vendorName: '', vendorProduct: '', amount: 0, tax: 0, gst: 0, paidAmount: 0, productDescription: '', modeOfPayment: 'Bank Transfer' });
    } catch (e) {
      alert('Failed to add vendor');
    }
  };
  const handlePay = async (vendor) => {
    const amt = Number(payAmount);
    if (!amt || amt <= 0) return alert('Enter a valid amount');
    setSavingPay(true);
    try {
      await axios.put(`${BASE_URL}/api/vendors/${vendor._id}`, {
        ...vendor,
        paidAmount: Number(vendor.paidAmount) + amt
      }, { headers: { "x-company-id": localStorage.getItem("companyId") || "" } });
      setPayingVendor(null);
      setPayAmount('');
      fetchVendors();
    } catch { alert('Payment failed'); }
    finally { setSavingPay(false); }
  };

  const handleDeleteVendor = async (vendor) => {
    if (!window.confirm(`Delete vendor "${vendor.vendorName}"?`)) return;
    try {
      await axios.delete(`${BASE_URL}/api/vendors/${vendor._id}`, {
        headers: { "x-company-id": localStorage.getItem("companyId") || "" }
      });
      fetchVendors();
    } catch { alert('Failed to delete vendor'); }
  };

  const filteredVendors = vendors.filter(v =>
    !search ||
    (v.vendorName || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.vendorProduct || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalVendors = vendors.length;
  const totalPayable = vendors.reduce((s, v) => s + (v.amount - v.paidAmount), 0);
  const totalPaid = vendors.reduce((s, v) => s + v.paidAmount, 0);
  const totalSpend = vendors.reduce((s, v) => s + v.amount, 0);

  return (
    <>
      <style>{`
/* ── M Business Finance Design System ── */
:root {
  --primary: var(--app-accent, var(--app-accent, #00BCD4)); --primary-dark:#0097A7; --primary-light:var(--teal-light, var(--teal-light, #E0F7FA)); --primary-mid:#B2EBF2;
  --text-dark:#1A2332; --text-mid:#4A5568; --text-light:#718096;
  --bg:#F0F4F8; --white:#FFFFFF; --border:#E2E8F0;
  --green:#26C281; --green-light:#D1FAE5; --green-dark:#065F46;
  --orange:#F59E0B; --orange-light:#FEF3C7; --orange-dark:#92400E;
  --red:#FF6B6B; --red-dark:#EF4444; --red-light:#FEE2E2;
  --purple:#8B5CF6; --purple-light:#EDE9FE;
  --blue:#3B82F6; --blue-light:#DBEAFE;
  --radius:14px; --shadow:0 2px 12px rgba(0,188,212,.08); --shadow-lg:0 8px 32px rgba(0,188,212,.14);
}
* { box-sizing: border-box; }
a { text-decoration: none; color: inherit; }
.main{ flex:1; width:100%; display:flex; flex-direction:column; min-height:100vh; background: var(--bg); font-family: 'Nunito', sans-serif; color: var(--text-dark); }
.topbar{background:var(--white);border-bottom:1px solid var(--border);padding:0 26px;height:62px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-light);}
.breadcrumb a{color:var(--primary);font-weight:700;}
.topbar-actions{display:flex;align-items:center;gap:10px;}
.content{padding:26px;flex:1;}
.btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:all .15s;}
.btn-primary{background:var(--primary);color:#fff;}.btn-primary:hover{background:var(--primary-dark);}
.btn-outline{background:transparent;border:1.5px solid var(--border);color:var(--text-mid);}.btn-outline:hover{border-color:var(--primary);color:var(--primary);background:var(--primary-light);}
.btn-green{background:var(--green);color:#fff;}.btn-green:hover{background:#1aab6d;}
.btn-sm{padding:6px 12px;font-size:12px;}
.card{background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);padding:22px 24px;}
.kpi-grid{display:grid;gap:16px;margin-bottom:22px;}
.kpi-grid-4{grid-template-columns:repeat(4,1fr);}
.kpi{background:var(--white);border-radius:var(--radius);padding:14px 16px;box-shadow:var(--shadow);border-left:4px solid transparent;height:96px;box-sizing:border-box;overflow:hidden;}
.kpi.vendor{border-left-color:var(--purple);}
.kpi.pending{border-left-color:var(--orange);}
.kpi.expense{border-left-color:var(--red);}
.kpi.income{border-left-color:var(--green);}
.kpi-label{font-size:10px;font-weight:800;color:var(--text-light);text-transform:uppercase;letter-spacing:.6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.kpi-value{font-size:19px;font-weight:900;color:var(--text-dark);line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.kpi-sub{font-size:10px;font-weight:600;display:flex;align-items:center;gap:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.kpi-sub.neutral{color:var(--text-light);}
.kpi-sub.down{color:var(--red);}
.toolbar{display:flex;align-items:center;gap:10px;margin-bottom:18px;flex-wrap:wrap;}
.search-box{display:flex;align-items:center;gap:8px;background:var(--white);border:1.5px solid var(--border);border-radius:10px;padding:9px 14px;min-width:220px;}
.search-box:focus-within{border-color:var(--primary);}
.search-box i{color:var(--text-light);font-size:16px;}
.search-box input{border:none;outline:none;background:transparent;font-family:'Nunito',sans-serif;font-size:13px;width:100%;}
.filter-sel{padding:9px 14px;border:1.5px solid var(--border);border-radius:10px;font-family:'Nunito',sans-serif;font-size:13px;font-weight:600;color:var(--text-mid);background:var(--white);outline:none;cursor:pointer;}
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;font-size:13px;}
thead tr{background:var(--bg);}
th{padding:10px 14px;text-align:left;font-size:11px;font-weight:800;color:var(--text-light);text-transform:uppercase;letter-spacing:.7px;white-space:nowrap;}
td{padding:12px 14px;border-bottom:1px solid var(--bg);color:var(--text-dark);font-weight:600;}
tr:last-child td{border-bottom:none;}
tr:hover td{background:#FAFCFE;}
.av{border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;flex-shrink:0;}
.av-sm{width:28px;height:28px;font-size:10px;}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;}
.badge-paid{background:var(--green-light);color:var(--green-dark);}
.badge-pending{background:var(--orange-light);color:var(--orange-dark);}
.badge-overdue{background:var(--red-light);color:var(--red-dark);}
.amt-out{color:var(--red-dark);font-weight:800;}
.amt-neutral{color:var(--text-dark);font-weight:800;}
.modal-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:200;align-items:center;justify-content:center;backdrop-filter:blur(3px);}
.modal-bg.open{display:flex;}
.modal{background:var(--white);border-radius:18px;padding:28px 30px;width:560px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.18);}
.modal-title{font-size:18px;font-weight:900;color:var(--text-dark);display:flex;align-items:center;gap:10px;margin-bottom:22px;}
.form-group{margin-bottom:16px;}
.form-group label{display:block;font-size:11px;font-weight:800;color:var(--text-mid);text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px;}
.form-group input,.form-group select,.form-group textarea{width:100%;padding:11px 14px;border:1.5px solid var(--border);border-radius:10px;font-family:'Nunito',sans-serif;font-size:14px;color:var(--text-dark);background:var(--bg);outline:none;}
.form-2col{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.modal-footer{display:flex;justify-content:flex-end;gap:10px;margin-top:22px;padding-top:16px;border-top:1px solid var(--border);}
      `}</style>
      <div className="main">
        <div className="topbar">
          <div className="breadcrumb"><i className="ti ti-users" style={{ fontSize: 22, color: '#1A2332' }}></i><span style={{ fontSize: 22, fontWeight: 900, color: '#1A2332' }}>Vendors</span></div>
          <div className="topbar-actions">
            <button className="btn btn-outline" onClick={openImport} style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}><i className="ti ti-upload"></i>Import Statement</button>
            <button className="btn btn-outline"><i className="ti ti-arrow-bar-up"></i>Pay a Vendor</button>
            <button className="btn btn-primary" onClick={() => setIsAddVendorModalOpen(true)}><i className="ti ti-plus"></i>Add Vendor</button>
          </div>
        </div>
        <div className="content">
          <div className="kpi-grid kpi-grid-4">
            <div className="kpi vendor" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><i className="ti ti-users" style={{ color: 'var(--purple)', fontSize: 18 }}></i></div>
              <div><div className="kpi-label">Total Vendors</div><div className="kpi-value">{totalVendors}</div><div className="kpi-sub neutral">Active suppliers</div></div>
            </div>
            <div className="kpi pending" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--orange-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><i className="ti ti-alert-circle" style={{ color: 'var(--orange)', fontSize: 18 }}></i></div>
              <div><div className="kpi-label">Total Payable</div><div className="kpi-value">₹{totalPayable.toLocaleString('en-IN')}</div><div className="kpi-sub down">{vendors.filter(v => v.amount > v.paidAmount).length} overdue</div></div>
            </div>
            <div className="kpi expense" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--red-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><i className="ti ti-check" style={{ color: 'var(--red)', fontSize: 18 }}></i></div>
              <div><div className="kpi-label">Total Paid</div><div className="kpi-value">₹{totalPaid.toLocaleString('en-IN')}</div><div className="kpi-sub neutral">Payments</div></div>
            </div>
            <div className="kpi income" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><i className="ti ti-calendar" style={{ color: 'var(--green)', fontSize: 18 }}></i></div>
              <div><div className="kpi-label">Total Vendor Spend</div><div className="kpi-value">₹{totalSpend.toLocaleString('en-IN')}</div><div className="kpi-sub neutral">Overall</div></div>
            </div>
          </div>      <div className="toolbar">
            <div className="search-box"><i className="ti ti-search"></i><input placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Vendor Name</th><th>Product / Category</th><th>Total Amount</th><th>Paid Amount</th><th>Tax (%)</th><th>GST (%)</th><th>Description</th><th>Payment Mode</th></tr></thead>
                <tbody>
                  {filteredVendors.length === 0 ? <tr><td colSpan="10" style={{ padding: 20, textAlign: 'center', color: 'var(--text-light)' }}>No vendors found.</td></tr>
                    : filteredVendors.map((v, i) => {
                      const outstanding = Number(v.amount || 0) - Number(v.paidAmount || 0);
                      const isPaid = outstanding <= 0;
                      const dateStr = v.dateOfPurchase || v.date || v.createdAt;
                      return (
                        <tr key={v._id || i}>
                          <td><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div className="av av-sm" style={{ background: 'var(--primary)', borderRadius: '8px' }}>{(v.vendorName || 'V').substring(0, 2).toUpperCase()}</div><div><div style={{ fontWeight: 700 }}>{v.vendorName}</div></div></div></td>
                          <td><span style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>{v.vendorProduct || 'Service'}</span></td>
                          <td className="amt-out">₹{Number(v.amount || 0).toLocaleString('en-IN')}</td>
                          <td>₹{Number(v.paidAmount || 0).toLocaleString('en-IN')}</td>
                          <td>{v.tax || 0}%</td>
                          <td>{v.gst || 0}%</td>
                          <td style={{ fontSize: '12px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.productDescription || '—'}</td>
                          <td style={{ fontSize: '12px' }}>{v.modeOfPayment || '—'}</td>
                          <td><span className={`badge ${isPaid ? 'badge-paid' : 'badge-pending'}`}>{isPaid ? 'Paid' : 'Pending'}</span></td>
                          <td><div style={{ display: 'flex', gap: '5px' }}>
                            <button className="btn btn-outline btn-sm" onClick={() => setViewVendor(v)}><i className="ti ti-eye"></i></button>
                            {!isPaid && <button className="btn btn-green btn-sm" onClick={() => { setPayingVendor(v); setPayAmount(''); }}><i className="ti ti-cash"></i>Pay</button>}
                            <button className="btn btn-outline btn-sm" style={{ color: 'var(--red-dark)', borderColor: '#FCA5A5' }} onClick={() => handleDeleteVendor(v)}><i className="ti ti-trash"></i></button>
                          </div></td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className={`modal-bg ${isAddVendorModalOpen ? 'open' : ''}`} onClick={(e) => { if (e.target.className.includes('modal-bg')) setIsAddVendorModalOpen(false) }}>
        <div className="modal">
          <div className="modal-title"><i className="ti ti-truck"></i>Add Vendor</div>
          <div className="form-2col">
            <div className="form-group"><label>Vendor Name *</label><input placeholder="Company or individual name" value={newVendor.vendorName} onChange={e => setNewVendor({ ...newVendor, vendorName: e.target.value })} /></div>
            <div className="form-group"><label>Product / Category *</label><input placeholder="e.g. Server Hosting" value={newVendor.vendorProduct} onChange={e => setNewVendor({ ...newVendor, vendorProduct: e.target.value })} /></div>
          </div>
          <div className="form-2col">
            <div className="form-group"><label>Total Amount *</label><input type="number" placeholder="0" value={newVendor.amount} onChange={e => setNewVendor({ ...newVendor, amount: Number(e.target.value) })} /></div>
            <div className="form-group"><label>Paid Amount</label><input type="number" placeholder="0" value={newVendor.paidAmount} onChange={e => setNewVendor({ ...newVendor, paidAmount: Number(e.target.value) })} /></div>
          </div>
          <div className="form-2col">
            <div className="form-group"><label>Tax (%)</label><input type="number" placeholder="0" value={newVendor.tax} onChange={e => setNewVendor({ ...newVendor, tax: Number(e.target.value) })} /></div>
            <div className="form-group"><label>GST (%)</label><input type="number" placeholder="0" value={newVendor.gst} onChange={e => setNewVendor({ ...newVendor, gst: Number(e.target.value) })} /></div>
          </div>
          <div className="form-group"><label>Description</label><textarea placeholder="Vendor description..." style={{ minHeight: '70px' }} value={newVendor.productDescription} onChange={e => setNewVendor({ ...newVendor, productDescription: e.target.value })}></textarea></div>
          <div className="form-group"><label>Payment Mode</label><select value={newVendor.modeOfPayment} onChange={e => setNewVendor({ ...newVendor, modeOfPayment: e.target.value })}><option>Bank Transfer</option><option>Cash</option><option>Credit Card</option></select></div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={() => setIsAddVendorModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveVendor}><i className="ti ti-check"></i>Save Vendor</button>
          </div>
        </div>
      </div>

      {/* VIEW VENDOR MODAL */}
      {viewVendor && (
        <div className="modal-bg open" onClick={e => { if (e.target.className.includes('modal-bg')) setViewVendor(null) }}>
          <div className="modal">
            <div className="modal-title"><i className="ti ti-truck"></i>Vendor Details</div>
            {[['Vendor Name', viewVendor.vendorName], ['Product / Service', viewVendor.vendorProduct], ['Description', viewVendor.productDescription], ['Total Amount', '₹' + Number(viewVendor.amount || 0).toLocaleString('en-IN')], ['Paid Amount', '₹' + Number(viewVendor.paidAmount || 0).toLocaleString('en-IN')], ['Outstanding', '₹' + Number(Math.max(0, (viewVendor.amount || 0) - (viewVendor.paidAmount || 0))).toLocaleString('en-IN')], ['Tax', viewVendor.tax + '%'], ['GST', viewVendor.gst + '%'], ['Payment Mode', viewVendor.modeOfPayment]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--bg)', fontSize: 13 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-light)' }}>{l}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{v || '—'}</span>
              </div>
            ))}
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setViewVendor(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* PAY VENDOR MODAL */}
      {payingVendor && (
        <div className="modal-bg open" onClick={e => { if (e.target.className.includes('modal-bg')) setPayingVendor(null) }}>
          <div className="modal" style={{ width: '420px' }}>
            <div className="modal-title"><i className="ti ti-cash"></i>Pay Vendor</div>
            <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 16 }}>
              Recording payment to <strong>{payingVendor.vendorName}</strong>. Outstanding: <strong>₹{Number(Math.max(0, (payingVendor.amount || 0) - (payingVendor.paidAmount || 0))).toLocaleString('en-IN')}</strong>
            </p>
            <div className="form-group">
              <label>Amount to Pay (₹) *</label>
              <input type="number" placeholder="0" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setPayingVendor(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={savingPay} onClick={() => handlePay(payingVendor)}>
                {savingPay ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className="modal-bg open" onClick={(e) => { if (e.target.className.includes('modal-bg')) closeImport() }}>
          <div className="modal" style={{ textAlign: 'center', padding: '40px' }}>
            <h3>Import Modal</h3>
            <p>Placeholder for import modal UI.</p>
            <button className="btn btn-outline" onClick={closeImport}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
