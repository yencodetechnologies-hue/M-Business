import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';

export default function AuditorPortal({ onBack }) {
  const [activeTab, setActiveTab] = useState('statements');
  const [notes, setNotes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState({ transactionId: '', note: '' });

  const fetchData = async () => {
    try {
      const headers = { "company-id": localStorage.getItem("companyId") || "" };
      const [nRes, iRes, eRes, bRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/audit-notes`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/api/income`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/api/expenses`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/api/banks`, { headers }).catch(() => ({ data: [] }))
      ]);

      setNotes(nRes.data || []);
      setBanks(bRes.data || []);

      const inc = (iRes.data || []).map(x => ({ ...x, _type: 'Income' }));
      const exp = (eRes.data || []).map(x => ({ ...x, _type: 'Expense' }));
      setTransactions([...inc, ...exp].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const dlToast = (name, fmt) => {
    alert(`Downloading ${name} as ${fmt}...`);
  };

  const saveNote = async (type) => {
    if (!newNote.transactionId) return alert('Enter transaction ID');
    try {
      await axios.post(`${BASE_URL}/api/audit-notes`, {
        transactionId: newNote.transactionId,
        note: newNote.note,
        flagged: type === 'flag'
      }, { headers: { "company-id": localStorage.getItem("companyId") || "" } });
      fetchData();
      setNewNote({ transactionId: '', note: '' });
      alert(type === 'flag' ? 'Transaction flagged!' : 'Audit note saved!');
    } catch (e) {
      alert('Failed to save note');
    }
  };

  const flagRow = async (txn) => {
    try {
      await axios.post(`${BASE_URL}/api/audit-notes`, {
        transactionId: txn.invoiceNumber || txn.expenseId || txn._id,
        note: 'Flagged from quick action',
        flagged: true,
        transactionType: txn._type
      }, { headers: { "company-id": localStorage.getItem("companyId") || "" } });
      fetchData();
      alert('Transaction flagged for review!');
    } catch (e) {
      alert('Failed to flag');
    }
  };

  const addNoteQuick = async (txn) => {
    const n = prompt('Enter audit note for ' + (txn.invoiceNumber || txn.expenseId || txn._id) + ':');
    if (n) {
      try {
        await axios.post(`${BASE_URL}/api/audit-notes`, {
          transactionId: txn.invoiceNumber || txn.expenseId || txn._id,
          note: n,
          flagged: false,
          transactionType: txn._type
        }, { headers: { "company-id": localStorage.getItem("companyId") || "" } });
        fetchData();
        alert('Note saved: ' + n);
      } catch (e) {
        alert('Failed to save note');
      }
    }
  };

  const totalIncome = transactions.filter(t => t._type === 'Income').reduce((s, t) => s + Number(t.amount || t.totalAmount || 0), 0);
  const totalExpense = transactions.filter(t => t._type === 'Expense').reduce((s, t) => s + Number(t.amount || t.totalAmount || 0), 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <>
      <style>{`
/* ── M Business Finance Design System ── */
:root {
  --primary: var(--app-accent, #00BCD4); --primary-dark:#0097A7; --primary-light:var(--teal-light, #E0F7FA); --primary-mid:#B2EBF2;
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
.auditor-portal-body {font-family:'Nunito',sans-serif;background:var(--bg);color:var(--text-dark);min-height:100vh;display:block;}
a { text-decoration: none; color: inherit; }
.aud-topnav{background:#1A2332;border-bottom:1px solid #2D3748;padding:0 32px;height:62px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;}
.aud-brand{display:flex;align-items:center;gap:10px;}
.aud-brand-icon{width:36px;height:36px;background:linear-gradient(135deg,#8B5CF6,#7C3AED);border-radius:10px;display:flex;align-items:center;justify-content:center;}
.aud-brand-icon i{font-size:18px;color:#fff;}
.aud-brand-name{font-size:16px;font-weight:900;color:#fff;}
.aud-brand-sub{font-size:12px;color:rgba(255,255,255,.5);margin-left:4px;}
.aud-chip{display:flex;align-items:center;gap:7px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);border-radius:20px;padding:6px 14px;font-size:12px;font-weight:700;color:rgba(255,255,255,.85);}
.aud-page{max-width:1100px;margin:0 auto;padding:26px 24px;}
.aud-hero{background:linear-gradient(135deg,#1A2332,#2D3748);border-radius:var(--radius);padding:24px 28px;margin-bottom:22px;display:flex;align-items:center;justify-content:space-between;}
.aud-hero-left h1{font-size:19px;font-weight:900;color:#fff;margin-bottom:4px;}
.aud-hero-left p{font-size:13px;color:rgba(255,255,255,.6);}
.aud-hero-stats{display:flex;gap:20px;}
.ahs{text-align:center;background:rgba(255,255,255,.08);border-radius:12px;padding:12px 18px;}
.ahs .n{font-size:20px;font-weight:900;color:#fff;}
.ahs .l{font-size:11px;color:rgba(255,255,255,.6);font-weight:600;margin-top:2px;}
.filter-sel{padding:9px 14px;border:1.5px solid var(--border);border-radius:10px;font-family:'Nunito',sans-serif;font-size:13px;font-weight:600;color:var(--text-mid);background:var(--white);outline:none;cursor:pointer;}
.tabs-bar{background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);margin-bottom:22px;display:flex;overflow:hidden;}
.atab{flex:1;padding:14px;text-align:center;font-size:13px;font-weight:700;color:var(--text-mid);cursor:pointer;border-bottom:3px solid transparent;transition:all .15s;background:transparent;border-top:none;border-left:none;border-right:none;font-family:"Nunito",sans-serif;}
.atab.active{color:var(--purple);border-bottom-color:var(--purple);}
.atab:hover:not(.active){background:var(--bg);}
.tab-notif{background:var(--red);color:#fff;font-size:10px;font-weight:800;border-radius:20px;padding:1px 6px;margin-left:4px;}

.dl-card{background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);padding:20px 22px;margin-bottom:14px;display:flex;align-items:center;gap:16px;}
.dl-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.dl-icon i{font-size:22px;}
.dl-title{font-size:14px;font-weight:800;color:var(--text-dark);}
.dl-meta{font-size:12px;color:var(--text-light);margin-top:2px;}
.dl-btns{display:flex;gap:8px;margin-left:auto;flex-wrap:wrap;}
.exp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:10px;font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid;transition:all .15s;}
.exp-pdf{background:var(--red-light);color:var(--red-dark);border-color:#FCA5A5;}
.exp-excel{background:var(--green-light);color:var(--green-dark);border-color:#6EE7B7;}
.exp-csv{background:var(--blue-light);color:#1E40AF;border-color:#93C5FD;}

.card{background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);padding:22px 24px;}
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;font-size:13px;}
thead tr{background:var(--bg);}
th{padding:10px 14px;text-align:left;font-size:11px;font-weight:800;color:var(--text-light);text-transform:uppercase;letter-spacing:.7px;white-space:nowrap;}
td{padding:12px 14px;border-bottom:1px solid var(--bg);color:var(--text-dark);font-weight:600;}
tr:last-child td{border-bottom:none;}
tr:hover td{background:#FAFCFE;}

.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;}
.badge-income{background:var(--green-light);color:var(--green-dark);}
.badge-expense{background:var(--red-light);color:var(--red-dark);}
.badge-paid{background:var(--green-light);color:var(--green-dark);}
.badge-pending{background:var(--orange-light);color:var(--orange-dark);}
.amt-in{color:var(--green);font-weight:800;}
.amt-out{color:var(--red-dark);font-weight:800;}
.flag-btn{background:var(--orange-light);color:var(--orange-dark);border:1px solid var(--orange);border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;}
.note-btn{background:var(--purple-light);color:var(--purple);border:1px solid var(--purple);border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;}
.flagged-row td{background:#FFFBEB !important;}
.audit-note{font-size:11px;color:var(--orange-dark);font-style:italic;margin-top:3px;display:flex;align-items:center;gap:4px;}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:20px;}

.av{border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;flex-shrink:0;}
.av-sm{width:28px;height:28px;font-size:10px;}
.form-group{margin-bottom:16px;}
.form-group label{display:block;font-size:11px;font-weight:800;color:var(--text-mid);text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px;}
.btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;cursor:pointer;}
      `}</style>
      <div className="auditor-portal-body">
        <div className="aud-topnav">
          <div className="aud-brand">
            <div className="aud-brand-icon"><i className="ti ti-shield-check"></i></div>
            <div className="aud-brand-name">Audit Portal</div>
            <span className="aud-brand-sub">— M Business</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="aud-chip">
              <div className="av av-sm" style={{ background: '#8B5CF6' }}>RA</div>Rajan Auditors & Co.
            </div>
            <div className="aud-chip" style={{ color: 'rgba(255,255,255,.5)', cursor: 'pointer' }} onClick={onBack}>
              <i className="ti ti-logout" style={{ fontSize: '14px' }}></i>Logout
            </div>
          </div>
        </div>

        <div className="aud-page">
          <div className="aud-hero">
            <div className="aud-hero-left">
              <h1>YENCODE Technologies Pvt Ltd — Audit Access</h1>
              <p>FY 2025-26 &nbsp;·&nbsp; Period: June 2026 &nbsp;·&nbsp; Last shared: Jun 5, 2026 at 11:42 AM</p>
            </div>
            <div className="aud-hero-stats">
              <div className="ahs"><div className="n">₹{totalIncome.toLocaleString('en-IN')}</div><div className="l">Total Income</div></div>
              <div className="ahs"><div className="n">₹{totalExpense.toLocaleString('en-IN')}</div><div className="l">Total Expenses</div></div>
              <div className="ahs"><div className="n">₹{netProfit.toLocaleString('en-IN')}</div><div className="l">Net Profit</div></div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-mid)' }}>Period:</span>
            <select className="filter-sel" style={{ fontSize: '12px' }}><option>June 2026</option></select>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-mid)' }}>Account:</span>
            <select className="filter-sel" style={{ fontSize: '12px' }}><option>All Accounts</option></select>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-mid)' }}>Type:</span>
            <select className="filter-sel" style={{ fontSize: '12px' }}><option>All Transactions</option></select>
          </div>

          <div className="tabs-bar">
            <button className={`atab ${activeTab === 'statements' ? 'active' : ''}`} onClick={() => setActiveTab('statements')}><i className="ti ti-file-analytics" style={{ marginRight: '5px' }}></i>Statements</button>
            <button className={`atab ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}><i className="ti ti-list" style={{ marginRight: '5px' }}></i>All Transactions</button>
            <button className={`atab ${activeTab === 'bank' ? 'active' : ''}`} onClick={() => setActiveTab('bank')}><i className="ti ti-building-bank" style={{ marginRight: '5px' }}></i>Bank Reconciliation</button>
            <button className={`atab ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}><i className="ti ti-message-2" style={{ marginRight: '5px' }}></i>Audit Notes{notes.length > 0 && <span className="tab-notif">{notes.length}</span>}</button>
          </div>

          {activeTab === 'statements' && (
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-mid)', marginBottom: '16px', padding: '12px 16px', background: 'var(--primary-light)', borderRadius: '10px', borderLeft: '4px solid var(--primary)', fontWeight: 600 }}>
                <i className="ti ti-info-circle" style={{ marginRight: '6px', color: 'var(--primary)' }}></i>
                Statements fetched directly from ledger.
              </div>
              <div className="dl-card">
                <div className="dl-icon" style={{ background: 'var(--green-light)' }}><i className="ti ti-arrow-bar-down" style={{ color: 'var(--green)' }}></i></div>
                <div><div className="dl-title">Income Statement</div><div className="dl-meta">{transactions.filter(t => t._type === 'Income').length} transactions · ₹{totalIncome.toLocaleString('en-IN')} total</div></div>
                <div className="dl-btns">
                  <button className="exp-btn exp-pdf" onClick={() => dlToast('Income Statement', 'PDF')}><i className="ti ti-file-type-pdf"></i>PDF</button>
                </div>
              </div>
              <div className="dl-card">
                <div className="dl-icon" style={{ background: 'var(--red-light)' }}><i className="ti ti-arrow-bar-up" style={{ color: 'var(--red-dark)' }}></i></div>
                <div><div className="dl-title">Expense Statement</div><div className="dl-meta">{transactions.filter(t => t._type === 'Expense').length} transactions · ₹{totalExpense.toLocaleString('en-IN')} total</div></div>
                <div className="dl-btns">
                  <button className="exp-btn exp-pdf" onClick={() => dlToast('Expense Statement', 'PDF')}><i className="ti ti-file-type-pdf"></i>PDF</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '15px', fontWeight: 800 }}>All Transactions — June 2026</div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Date</th><th>Ref</th><th>Description</th><th>Type</th><th>Amount</th><th>Status</th><th>Audit Actions</th></tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan="7">Loading...</td></tr> : transactions.length === 0 ? <tr><td colSpan="7">No transactions found.</td></tr> : transactions.map((txn, i) => {
                      const id = txn.invoiceNumber || txn.expenseId || txn._id;
                      const hasNote = notes.find(n => n.transactionId === id);
                      const isFlagged = hasNote?.flagged;
                      return (
                        <tr key={i} className={isFlagged ? "flagged-row" : ""}>
                          <td>{new Date(txn.date || txn.createdAt).toLocaleDateString()}</td>
                          <td style={{ color: isFlagged ? 'var(--orange-dark)' : 'var(--primary)', fontWeight: 700 }}>{id}</td>
                          <td>{txn.description || txn.clientName || 'Transaction'}{hasNote && <div className="audit-note"><i className="ti ti-message-2"></i>{isFlagged ? "Flagged: " : "Note: "}{hasNote.note}</div>}</td>
                          <td><span className={`badge ${txn._type === 'Income' ? 'badge-income' : 'badge-expense'}`}>{txn._type}</span></td>
                          <td className={txn._type === 'Income' ? 'amt-in' : 'amt-out'}>{txn._type === 'Income' ? '+' : '−'}₹{Number(txn.amount || txn.totalAmount || 0).toLocaleString('en-IN')}</td>
                          <td><span className={`badge ${txn.status === 'Paid' ? 'badge-paid' : 'badge-pending'}`}>{txn.status || 'Completed'}</span></td>
                          <td><div style={{ display: 'flex', gap: '5px' }}><button className="flag-btn" style={isFlagged ? { background: 'var(--orange)', color: '#fff' } : {}} onClick={() => flagRow(txn)}><i className="ti ti-flag"></i>{isFlagged ? 'Flagged' : 'Flag'}</button><button className="note-btn" onClick={() => addNoteQuick(txn)}><i className="ti ti-message-2"></i>Note</button></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="grid-2">
              {loading ? <div>Loading banks...</div> : banks.map((b, i) => (
                <div key={i} className="card">
                  <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '14px' }}><i className="ti ti-building-bank"></i>{b.bankName} ••••{b.accountNo?.slice(-4)}</div>
                  <div>Closing Balance: ₹{Number(b.balance || 0).toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <div className="card" style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '16px' }}><i className="ti ti-message-2" style={{ color: 'var(--purple)' }}></i>Add Audit Note</div>
                <div className="form-group"><label>Transaction / Reference ID</label><input placeholder="e.g. INV-019 or EXP-063" className="inp" style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: '10px', fontFamily: 'Nunito,sans-serif', fontSize: '13px', outline: 'none' }} value={newNote.transactionId} onChange={e => setNewNote({ ...newNote, transactionId: e.target.value })} /></div>
                <div className="form-group"><label>Note / Remark</label><textarea placeholder="Enter your audit observation, query or remark here..." style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: '10px', fontFamily: 'Nunito,sans-serif', fontSize: '13px', color: 'var(--text-dark)', background: 'var(--bg)', outline: 'none', minHeight: '90px' }} value={newNote.note} onChange={e => setNewNote({ ...newNote, note: e.target.value })}></textarea></div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn" style={{ background: 'var(--orange-light)', color: 'var(--orange-dark)', border: '1px solid var(--orange)' }} onClick={() => saveNote('flag')}><i className="ti ti-flag"></i>Flag Transaction</button>
                  <button className="btn" style={{ background: 'var(--purple-light)', color: 'var(--purple)', border: '1px solid var(--purple)' }} onClick={() => saveNote('note')}><i className="ti ti-message-2"></i>Save Note</button>
                </div>
              </div>
              <div className="card">
                <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '16px' }}>Existing Notes & Flags</div>
                {loading ? <div>Loading notes...</div> : notes.length === 0 ? <div>No audit notes added yet.</div> : notes.map((n, i) => (
                  <div key={i} style={{ padding: '14px', background: n.flagged ? 'var(--orange-light)' : 'var(--purple-light)', borderRadius: '10px', borderLeft: `4px solid ${n.flagged ? 'var(--orange)' : 'var(--purple)'}`, marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: n.flagged ? 'var(--orange-dark)' : 'var(--purple)', marginBottom: '4px' }}><i className={n.flagged ? "ti ti-flag" : "ti ti-message-2"}></i>{n.flagged ? 'FLAGGED' : 'NOTE'} — {n.transactionId} ({new Date(n.createdAt).toLocaleDateString()})</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-dark)' }}>{n.note}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}