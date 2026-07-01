import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';

const API = `${BASE_URL}/api/expenses`;
const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

const CATEGORIES = ['Food', 'Travel', 'Office', 'Utilities', 'Marketing', 'Salary', 'Miscellaneous'];
const MODES = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'NEFT', 'RTGS', 'GPay', 'PhonePe'];
const EXPENSE_TYPES = ['Operational', 'Capital', 'Recurring', 'One-Time'];

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: type === 'error' ? '#EF4444' : '#26C281', color: '#fff', borderRadius: 12, padding: '13px 22px', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,.18)' }}>
      {msg}
    </div>
  );
}

export default function FinExpenses({ expenses: propExpenses, setExpenses: propSetExpenses, fetchExpenses: propFetch }) {
  const [expenses, setExpenses] = useState(propExpenses || []);
  const [loading, setLoading] = useState(!propExpenses);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const emptyForm = { title: '', description: '', category: 'Office', expenseType: 'Operational', amount: '', paymentMode: 'Cash', status: 'Pending', date: new Date().toISOString().slice(0, 10) };
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState({});

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '' }), 3000); };

  useEffect(() => {
    if (propExpenses) { setExpenses(propExpenses); setLoading(false); return; }
    setLoading(true);
    axios.get(API).then(r => { setExpenses(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, [propExpenses]);

  const syncUp = (updated) => {
    setExpenses(updated);
    if (propSetExpenses) propSetExpenses(updated);
  };

  const handleAdd = async () => {
    if (!form.title || !form.amount) return showToast('Fill required fields (Title & Amount)', 'error');
    setSaving(true);
    try {
      const res = await axios.post(API, { ...form, amount: Number(form.amount) });
      const updated = [res.data, ...expenses];
      syncUp(updated);
      setAddOpen(false);
      setForm(emptyForm);
      showToast('✅ Expense added!');
    } catch { showToast('Failed to add', 'error'); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!editForm.title || !editForm.amount) return showToast('Fill required fields', 'error');
    setSaving(true);
    try {
      const res = await axios.put(`${API}/${editItem._id}`, { ...editForm, amount: Number(editForm.amount) });
      const updated = expenses.map(x => x._id === editItem._id ? res.data : x);
      syncUp(updated);
      setEditItem(null);
      showToast('✅ Expense updated!');
    } catch { showToast('Failed to update', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (exp) => {
    if (!window.confirm(`Delete "${exp.title || exp.description}"?`)) return;
    setDeleting(exp._id);
    try {
      await axios.delete(`${API}/${exp._id}`);
      const updated = expenses.filter(x => x._id !== exp._id);
      syncUp(updated);
      showToast('🗑️ Expense deleted');
    } catch { showToast('Failed to delete', 'error'); }
    finally { setDeleting(null); }
  };

  const filtered = expenses.filter(e => {
    const matchSearch = !search || (e.vendor || '').toLowerCase().includes(search.toLowerCase()) || (e.description || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || e.category === catFilter;
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const byCategory = CATEGORIES.map(c => ({ name: c, total: expenses.filter(e => e.category === c).reduce((s, e) => s + Number(e.amount || 0), 0) })).filter(c => c.total > 0).slice(0, 3);

  const S = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' },
    modal: { background: '#fff', borderRadius: 18, padding: '28px 30px', width: 560, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.18)' },
    label: { display: 'block', fontSize: 11, fontWeight: 800, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 6 },
    input: { width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontFamily: 'Nunito,sans-serif', fontSize: 14, color: '#1A2332', background: '#F0F4F8', outline: 'none', boxSizing: 'border-box' },
    btn: (bg, color = '#fff') => ({ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, fontFamily: 'Nunito,sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: bg, color }),
    actionBtn: (danger) => ({ background: 'transparent', border: `1.5px solid ${danger ? '#FCA5A5' : '#E2E8F0'}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: danger ? '#EF4444' : '#4A5568', fontSize: 13, display: 'inline-flex', alignItems: 'center' }),
  };

  return (
    <>
      <style>{`
        .fe-table td, .fe-table th { padding: 12px 14px; border-bottom: 1px solid #F0F4F8; font-size: 13px; }
        .fe-table th { font-size: 11px; font-weight: 800; color: #718096; text-transform: uppercase; letter-spacing: .7px; background: #F0F4F8; }
        .fe-table tr:hover td { background: #FAFCFE; }
        .fe-badge-paid { background: #D1FAE5; color: #065F46; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .fe-badge-pending { background: #FEF3C7; color: #92400E; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .fe-badge-overdue { background: #FEE2E2; color: #EF4444; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
      `}</style>
      <Toast {...toast} />

      <div style={{ padding: 26, background: '#F0F4F8', minHeight: '100%', fontFamily: 'Nunito,sans-serif' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#1A2332' }}>Expenses</div>
            <div style={{ fontSize: 13, color: '#718096', marginTop: 2 }}>Track and manage all business outgoings</div>
          </div>
          <button style={S.btn('#EF4444')} onClick={() => { setForm(emptyForm); setAddOpen(true); }}>
            <i className="ti ti-plus" /> Add Expense
          </button>
        </div>

        {/* KPI CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 22 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,188,212,.08)', borderLeft: '4px solid #EF4444' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#718096', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 6 }}>Total Expenses</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#1A2332' }}>{fmt(total)}</div>
            <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>{expenses.length} records</div>
          </div>
          {byCategory.map(c => (
            <div key={c.name} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,188,212,.08)', borderLeft: '4px solid  var(--app-accent, var(--app-accent, #00BCD4))' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#718096', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 6 }}>{c.name}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#1A2332' }}>{fmt(c.total)}</div>
              <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>{total > 0 ? Math.round(c.total / total * 100) : 0}% of expenses</div>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '9px 14px', minWidth: 220 }}>
            <i className="ti ti-search" style={{ color: '#718096' }} />
            <input placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', outline: 'none', fontFamily: 'Nunito,sans-serif', fontSize: 13, width: '100%', background: 'transparent' }} />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding: '9px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontFamily: 'Nunito,sans-serif', fontSize: 13, fontWeight: 600, color: '#4A5568', background: '#fff', outline: 'none', cursor: 'pointer' }}>
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '9px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontFamily: 'Nunito,sans-serif', fontSize: 13, fontWeight: 600, color: '#4A5568', background: '#fff', outline: 'none', cursor: 'pointer' }}>
            <option value="All">All Status</option>
            <option>Paid</option><option>Pending</option><option>Overdue</option>
          </select>
        </div>

        {/* TABLE */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,188,212,.08)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="fe-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Date</th><th>Vendor / Payee</th><th>Description</th><th>Category</th>
                  <th>Amount</th><th>Payment Mode</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#718096' }}>Loading expenses...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#718096' }}>{expenses.length === 0 ? 'No expenses yet. Click "Add Expense" to get started.' : 'No results match your filters.'}</td></tr>
                ) : filtered.map(exp => (
                  <tr key={exp._id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{exp.date ? new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : new Date(exp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td style={{ fontWeight: 700 }}>{exp.title || '—'}</td>
                    <td>{exp.description || '—'}</td>
                    <td><span style={{ background: '#FEE2E2', color: '#EF4444', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{exp.category}</span></td>
                    <td style={{ color: '#EF4444', fontWeight: 800 }}>−{fmt(exp.amount)}</td>
                    <td>{exp.paymentMode || exp.payment_mode || '—'}</td>
                    <td><span className={`fe-badge-${(exp.status || 'paid').toLowerCase()}`}>{exp.status || 'Paid'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={S.actionBtn(false)} title="View" onClick={() => setViewItem(exp)}><i className="ti ti-eye" /></button>
                        <button style={S.actionBtn(false)} title="Edit" onClick={() => { setEditItem(exp); setEditForm({ title: exp.title || '', description: exp.description || '', category: exp.category || 'Office', expenseType: exp.expenseType || 'Operational', amount: exp.amount, paymentMode: exp.paymentMode || 'Cash', status: exp.status || 'Pending', date: (exp.date || exp.createdAt || '').slice(0, 10) }); }}><i className="ti ti-pencil" /></button>
                        <button style={S.actionBtn(true)} title="Delete" disabled={deleting === exp._id} onClick={() => handleDelete(exp)}><i className={deleting === exp._id ? 'ti ti-loader-2' : 'ti ti-trash'} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid #E2E8F0', fontSize: 13, color: '#718096' }}>
            Showing {filtered.length} of {expenses.length} records
          </div>
        </div>
      </div>

      {/* VIEW MODAL */}
      {viewItem && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setViewItem(null)}>
          <div style={S.modal}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#1A2332', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="ti ti-receipt" style={{ color: '#EF4444' }} /> Expense Details
            </div>
            {[['Title', viewItem.title], ['Description', viewItem.description], ['Category', viewItem.category], ['Expense Type', viewItem.expenseType], ['Amount', fmt(viewItem.amount)], ['Payment Mode', viewItem.paymentMode], ['Status', viewItem.status], ['Date', new Date(viewItem.date || viewItem.createdAt).toLocaleDateString('en-IN')]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F0F4F8', fontSize: 13 }}>
                <span style={{ fontWeight: 700, color: '#718096' }}>{l}</span>
                <span style={{ fontWeight: 700, color: '#1A2332' }}>{v || '—'}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
              <button style={S.btn('#F0F4F8', '#1A2332')} onClick={() => setViewItem(null)}>Close</button>
              <button style={S.btn('#EF4444')} onClick={() => { const item = viewItem; setViewItem(null); setEditItem(item); setEditForm({ title: item.title || '', description: item.description || '', category: item.category || 'Office', expenseType: item.expenseType || 'Operational', amount: item.amount, paymentMode: item.paymentMode || 'Cash', status: item.status || 'Pending', date: (item.date || item.createdAt || '').slice(0, 10) }); }}>Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {addOpen && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setAddOpen(false)}>
          <div style={S.modal}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#1A2332', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="ti ti-plus" style={{ color: '#EF4444' }} /> Add Expense
            </div>
            {[['Title *', 'title', 'text', 'e.g. Office Rent, AWS Bill'], ['Description', 'description', 'text', 'What was this for?'], ['Amount (₹) *', 'amount', 'number', '0.00'], ['Date', 'date', 'date', '']].map(([label, key, type, ph]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={S.label}>{label}</label>
                <input type={type} placeholder={ph} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={S.input} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              {[['Category', 'category', CATEGORIES], ['Expense Type', 'expenseType', EXPENSE_TYPES], ['Payment Mode', 'paymentMode', MODES], ['Status', 'status', ['Pending', 'Approved', 'Rejected']]].map(([label, key, opts]) => (
                <div key={key}>
                  <label style={S.label}>{label}</label>
                  <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={S.input}>{opts.map(o => <option key={o}>{o}</option>)}</select>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
              <button style={S.btn('#F0F4F8', '#1A2332')} onClick={() => setAddOpen(false)}>Cancel</button>
              <button style={S.btn('#EF4444')} disabled={saving} onClick={handleAdd}>{saving ? 'Saving...' : 'Save Expense'}</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editItem && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setEditItem(null)}>
          <div style={S.modal}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#1A2332', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="ti ti-pencil" style={{ color: '#EF4444' }} /> Edit Expense
            </div>
            {[['Title *', 'title', 'text', ''], ['Description', 'description', 'text', ''], ['Amount (₹) *', 'amount', 'number', ''], ['Date', 'date', 'date', '']].map(([label, key, type, ph]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={S.label}>{label}</label>
                <input type={type} placeholder={ph} value={editForm[key]} onChange={e => setEditForm({ ...editForm, [key]: e.target.value })} style={S.input} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              {[['Category', 'category', CATEGORIES], ['Expense Type', 'expenseType', EXPENSE_TYPES], ['Payment Mode', 'paymentMode', MODES], ['Status', 'status', ['Pending', 'Approved', 'Rejected']]].map(([label, key, opts]) => (
                <div key={key}>
                  <label style={S.label}>{label}</label>
                  <select value={editForm[key]} onChange={e => setEditForm({ ...editForm, [key]: e.target.value })} style={S.input}>{opts.map(o => <option key={o}>{o}</option>)}</select>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
              <button style={S.btn('#F0F4F8', '#1A2332')} onClick={() => setEditItem(null)}>Cancel</button>
              <button style={S.btn('#EF4444')} disabled={saving} onClick={handleEdit}>{saving ? 'Updating...' : 'Update Expense'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
