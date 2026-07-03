import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';

export default function FinBank() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLinkBankModalOpen, setIsLinkBankModalOpen] = useState(false);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBank, setNewBank] = useState({ bankName: 'HDFC Bank', accountType: 'Current', accountNo: '', ifscCode: '', holderName: '' });
  const mainScrollRef = useRef(null);
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const totalRevenue = income.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const [loadingTxns, setLoadingTxns] = useState(true);

  const fetchBanks = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/banks`, {
        headers: { "x-company-id": localStorage.getItem("companyId") || "" }
      });
      const data = res.data || [];
      setBanks(data);
      if (data.length > 0) setSelectedBankId(data[0]._id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setLoadingTxns(true);
    try {
      const hdr = { "x-company-id": localStorage.getItem("companyId") || "" };
      const [incRes, expRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/income`, { headers: hdr }),
        axios.get(`${BASE_URL}/api/expenses`, { headers: hdr }),
      ]);
      setIncome(incRes.data || []);
      setExpenses(expRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTxns(false);
    }
  };

  useEffect(() => {
    fetchBanks();
    fetchTransactions();
  }, []);

  const totalBalance = banks.reduce((s, b) => s + Number(b.balance || 0), 0);
  const totalCredits = income.reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalDebits = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const selectedBank = banks.find(b => b._id === selectedBankId) || banks[0];

  const recentTxns = [
    ...income.map(i => ({ _id: i._id, type: 'in', label: i.title || i.client || 'Income', sub: i.date || i.createdAt, amount: Number(i.amount || 0) })),
    ...expenses.map(e => ({ _id: e._id, type: 'out', label: e.title || e.description || 'Expense', sub: e.date || e.createdAt, amount: Number(e.amount || 0) })),
  ].sort((a, b) => new Date(b.sub) - new Date(a.sub)).slice(0, 8);

  const openImport = () => setIsImportModalOpen(true);
  const closeImport = () => setIsImportModalOpen(false);

  const linkBank = async () => {
    try {
      await axios.post(`${BASE_URL}/api/banks`, {
        ...newBank,
        balance: 0
      }, {
        headers: { "x-company-id": localStorage.getItem("companyId") || "" }
      });
      setIsLinkBankModalOpen(false);
      alert('Bank account linked! Verify the test deposit.');
      fetchBanks();
    } catch (e) {
      alert('Failed to link bank');
    }
  };

  const toast = (msg) => alert(msg);

  const colors = [
    { bg: "linear-gradient(135deg,var(--app-accent),#0097A7)", badge: ' var(--app-accent, var(--app-accent, #00BCD4))' },
    { bg: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', badge: '#8B5CF6' },
    { bg: 'linear-gradient(135deg,#F59E0B,#D97706)', badge: '#F59E0B' },
    { bg: 'linear-gradient(135deg,#10B981,#059669)', badge: '#10B981' }
  ];

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
.main{ flex:1; display:flex; flex-direction:column; min-height:100vh; background: var(--bg); font-family: 'Nunito', sans-serif; color: var(--text-dark); }
.topbar{background:var(--white);border-bottom:1px solid var(--border);padding:0 26px;height:62px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-light);}
.breadcrumb a{color:var(--primary);font-weight:700;}
.topbar-actions{display:flex;align-items:center;gap:10px;}
.content{padding:26px;flex:1;}
.btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:all .15s;}
.btn-primary{background:var(--primary);color:#fff;}.btn-primary:hover{background:var(--primary-dark);}
.btn-outline{background:transparent;border:1.5px solid var(--border);color:var(--text-mid);}.btn-outline:hover{border-color:var(--primary);color:var(--primary);background:var(--primary-light);}
.card{background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);padding:22px 24px;}
.kpi-grid{display:grid;gap:16px;margin-bottom:22px;}
.kpi-grid-4{grid-template-columns:repeat(4,1fr);}
.kpi{background:var(--white);border-radius:var(--radius);padding:18px 20px;box-shadow:var(--shadow);border-left:4px solid transparent;}
.kpi.profit{border-left-color:var(--primary);}
.kpi.pending{border-left-color:var(--orange);}
.kpi.expense{border-left-color:var(--red);}
.kpi.income{border-left-color:var(--green);}
.kpi-label{font-size:11px;font-weight:800;color:var(--text-light);text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px;}
.kpi-value{font-size:24px;font-weight:900;color:var(--text-dark);margin-bottom:4px;}
.kpi-sub{font-size:12px;font-weight:600;display:flex;align-items:center;gap:4px;}
.kpi-sub.up{color:var(--green);}
.kpi-sub.neutral{color:var(--text-light);}
.kpi-sub.down{color:var(--red);}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.grid-main-side{display:grid;grid-template-columns:1fr 320px;gap:22px;}
.bank-card{border-radius:16px;padding:22px 24px;color:#fff;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;}
.bank-card::before{content:"";position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.1);}
.bank-card::after{content:"";position:absolute;bottom:-40px;right:20px;width:90px;height:90px;border-radius:50%;background:rgba(255,255,255,.07);}
.bank-card:hover{transform:translateY(-3px);}
.bank-card .bank-name{font-size:11px;font-weight:800;opacity:.8;text-transform:uppercase;letter-spacing:.8px;}
.bank-card .bank-bal{font-size:28px;font-weight:900;margin:10px 0 4px;}
.bank-card .bank-acc{font-size:12px;opacity:.75;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.bank-card .bank-sync{font-size:11px;opacity:.65;margin-top:8px;display:flex;align-items:center;gap:5px;}
.rec-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--bg);}
.rec-row:last-child{border-bottom:none;}
.rec-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.rec-icon.in{background:var(--green-light); color:var(--green);}
.rec-icon.out{background:var(--red-light); color:var(--red-dark);}
.rec-match{background:var(--green-light);color:var(--green-dark);font-size:10px;font-weight:800;padding:2px 8px;border-radius:20px;margin-left:auto;}
.rec-unmatched{background:var(--orange-light);color:var(--orange-dark);font-size:10px;font-weight:800;padding:2px 8px;border-radius:20px;margin-left:auto;}
.amt-in{color:var(--green);font-weight:800;}
.amt-out{color:var(--red-dark);font-weight:800;}
.exp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:10px;font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid;transition:all .15s;}
.exp-pdf{background:var(--red-light);color:var(--red-dark);border-color:#FCA5A5;}
.exp-excel{background:var(--green-light);color:var(--green-dark);border-color:#6EE7B7;}
.exp-csv{background:var(--blue-light);color:#1E40AF;border-color:#93C5FD;}
.modal-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:200;align-items:center;justify-content:center;backdrop-filter:blur(3px);}
.modal-bg.open{display:flex;}
.modal{background:var(--white);border-radius:18px;padding:28px 30px;width:560px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.18);}
.modal-sm{width:420px;}
.modal-title{font-size:18px;font-weight:900;color:var(--text-dark);display:flex;align-items:center;gap:10px;margin-bottom:22px;}
.form-group{margin-bottom:16px;}
.form-group label{display:block;font-size:11px;font-weight:800;color:var(--text-mid);text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px;}
.form-group input,.form-group select{width:100%;padding:11px 14px;border:1.5px solid var(--border);border-radius:10px;font-family:'Nunito',sans-serif;font-size:14px;color:var(--text-dark);background:var(--bg);outline:none;}
.form-2col{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.modal-footer{display:flex;justify-content:flex-end;gap:10px;margin-top:22px;padding-top:16px;border-top:1px solid var(--border);}
.filter-sel{padding:9px 14px;border:1.5px solid var(--border);border-radius:10px;font-family:'Nunito',sans-serif;font-size:13px;font-weight:600;color:var(--text-mid);background:var(--white);outline:none;cursor:pointer;}
      `}</style>
      <div className="main">
        <div className="topbar">
          <div className="breadcrumb"><a href="#">Finance</a><i className="ti ti-chevron-right"></i><span>Bank Accounts</span></div>
          <div className="topbar-actions">
            <button className="btn btn-outline" onClick={openImport} style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}><i className="ti ti-upload"></i>Import Statement</button>
            <button className="btn btn-outline" onClick={() => toast('Syncing all accounts...')}>Sync All</button>
            <button className="btn btn-primary" onClick={() => setIsLinkBankModalOpen(true)}><i className="ti ti-plus"></i>Link Bank Account</button>
          </div>
        </div>
        <div className="content" ref={mainScrollRef}>
          <div className="grid-2" style={{ marginBottom: '22px' }}>
            {loading ? <div style={{ padding: 20 }}>Loading banks...</div> : banks.length === 0 ? <div style={{ padding: 20 }}>No bank accounts linked yet.</div> : banks.map((bank, idx) => {
              const colorTheme = colors[idx % colors.length];
              return (
                <div key={bank._id || idx} className="bank-card" style={{ background: colorTheme.bg }}>
                  <div className="bank-name">{bank.bankName} — {bank.accountType} Account</div>
                  <div className="bank-bal">₹{Number(bank.balance || 0).toLocaleString('en-IN')}</div>
                  <div className="bank-acc"><i className="ti ti-credit-card"></i> •••• •••• •••• {bank.accountNo?.slice(-4) || 'XXXX'} &nbsp;·&nbsp; IFSC: {bank.ifscCode || 'N/A'}</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                    <span style={{ background: 'rgba(255,255,255,.2)', borderRadius: '8px', padding: '4px 12px', fontSize: '11px', fontWeight: 700 }}>{idx === 0 ? 'Primary' : 'Secondary'}</span>
                    <span style={{ background: 'rgba(255,255,255,.2)', borderRadius: '8px', padding: '4px 12px', fontSize: '11px', fontWeight: 700 }}>{bank.accountType} A/C</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="kpi-grid kpi-grid-4" style={{ marginBottom: '22px' }}>
            <div className="kpi profit"><div className="kpi-label">Total Balance</div><div className="kpi-value">₹{totalBalance.toLocaleString('en-IN')}</div><div className="kpi-sub up"><i className="ti ti-building-bank"></i>Across {banks.length} accounts</div></div>
            <div className="kpi income"><div className="kpi-label">Total Credits</div><div className="kpi-value">₹{totalCredits.toLocaleString('en-IN')}</div><div className="kpi-sub up"><i className="ti ti-arrow-down"></i>{income.length} transactions</div></div>
            <div className="kpi pending"><div className="kpi-label">Total Debits</div><div className="kpi-value">₹{totalDebits.toLocaleString('en-IN')}</div><div className="kpi-sub down"><i className="ti ti-arrow-up"></i>{expenses.length} transactions</div></div>
            <div className="kpi expense"><div className="kpi-label">Net Flow</div><div className="kpi-value" style={{ color: totalCredits - totalDebits >= 0 ? 'var(--green)' : 'var(--red-dark)' }}>₹{Math.abs(totalCredits - totalDebits).toLocaleString('en-IN')}</div><div className={`kpi-sub ${totalCredits >= totalDebits ? 'up' : 'down'}`}><i className={`ti ti-trending-${totalCredits >= totalDebits ? 'up' : 'down'}`}></i>{totalCredits >= totalDebits ? 'Surplus' : 'Deficit'}</div></div>
          </div>

          <div className="grid-main-side">
            <div>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="ti ti-list" style={{ color: 'var(--primary)' }}></i>
                    Recent Transactions — {selectedBank ? `${selectedBank.bankName} ••••${(selectedBank.accountNo || '').slice(-4)}` : 'All Accounts'}
                  </div>
                  {banks.length > 1 && (
                    <select className="filter-sel" style={{ fontSize: '12px', padding: '6px 12px' }} value={selectedBankId || ''} onChange={e => setSelectedBankId(e.target.value)}>
                      {banks.map(b => <option key={b._id} value={b._id}>{b.bankName} — ••••{(b.accountNo || '').slice(-4)}</option>)}
                    </select>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ background: 'var(--green-light)', color: 'var(--green-dark)', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}><i className="ti ti-arrow-down"></i> {income.length} Credits</span>
                  <span style={{ background: 'var(--red-light)', color: 'var(--red-dark)', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}><i className="ti ti-arrow-up"></i> {expenses.length} Debits</span>
                </div>
                {loadingTxns ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-light)' }}>Loading transactions...</div>
                ) : recentTxns.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-light)' }}>No transactions yet.</div>
                ) : recentTxns.map(tx => (
                  <div key={tx._id} className="rec-row">
                    <div className={`rec-icon ${tx.type}`}><i className={`ti ti-arrow-${tx.type === 'in' ? 'down' : 'up'}`}></i></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>{tx.type === 'in' ? 'Credit' : 'Debit'} — {tx.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>{tx.sub ? new Date(tx.sub).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
                    </div>
                    <div className={tx.type === 'in' ? 'amt-in' : 'amt-out'} style={{ fontSize: '14px' }}>{tx.type === 'in' ? '+' : '−'}₹{tx.amount.toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="card">
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}><i className="ti ti-building-bank" style={{ color: 'var(--primary)' }}></i>Account Summary</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--bg)' }}><span style={{ color: 'var(--text-light)', fontWeight: 600 }}>Total Accounts</span><span style={{ fontWeight: 700 }}>{banks.length}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--bg)' }}><span style={{ color: 'var(--text-light)', fontWeight: 600 }}>Total Credits</span><span className="amt-in">+₹{totalCredits.toLocaleString('en-IN')}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--bg)' }}><span style={{ color: 'var(--text-light)', fontWeight: 600 }}>Total Debits</span><span className="amt-out">−₹{totalDebits.toLocaleString('en-IN')}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0' }}><span style={{ fontWeight: 800, color: 'var(--text-dark)' }}>Net Balance</span><span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '16px' }}>₹{totalBalance.toLocaleString('en-IN')}</span></div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="card">
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}><i className="ti ti-building-bank" style={{ color: 'var(--primary)' }}></i>Account Summary</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--bg)' }}><span style={{ color: 'var(--text-light)', fontWeight: 600 }}>Opening Balance</span><span style={{ fontWeight: 700 }}>₹8,62,320</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--bg)' }}><span style={{ color: 'var(--text-light)', fontWeight: 600 }}>Total Credits</span><span className="amt-in">+₹18,42,000</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--bg)' }}><span style={{ color: 'var(--text-light)', fontWeight: 600 }}>Total Debits</span><span className="amt-out">−₹14,20,000</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0' }}><span style={{ fontWeight: 800, color: 'var(--text-dark)' }}>Closing Balance</span><span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '16px' }}>₹12,84,320</span></div>
                </div>
              </div>
              <div className="card">
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '12px' }}>Export Statement</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button className="exp-btn exp-pdf" style={{ justifyContent: 'flex-start' }} onClick={() => toast('Downloading PDF statement...')}><i className="ti ti-file-type-pdf"></i>Download PDF</button>
                  <button className="exp-btn exp-excel" style={{ justifyContent: 'flex-start' }} onClick={() => toast('Downloading Excel...')}><i className="ti ti-file-spreadsheet"></i>Download Excel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`modal-bg ${isLinkBankModalOpen ? 'open' : ''}`} onClick={(e) => { if (e.target.className.includes('modal-bg')) setIsLinkBankModalOpen(false) }}>
        <div className="modal modal-sm">
          <div className="modal-title"><i className="ti ti-building-bank"></i>Link Bank Account</div>
          <div className="form-group"><label>Bank Name *</label><select value={newBank.bankName} onChange={e => setNewBank({ ...newBank, bankName: e.target.value })}><option>HDFC Bank</option><option>ICICI Bank</option><option>State Bank of India</option><option>Axis Bank</option></select></div>
          <div className="form-group"><label>Account Number *</label><input placeholder="Enter account number" value={newBank.accountNo} onChange={e => setNewBank({ ...newBank, accountNo: e.target.value })} /></div>
          <div className="form-group"><label>Confirm Account Number *</label><input placeholder="Re-enter account number" /></div>
          <div className="form-2col">
            <div className="form-group"><label>IFSC Code *</label><input placeholder="e.g. HDFC0001234" value={newBank.ifscCode} onChange={e => setNewBank({ ...newBank, ifscCode: e.target.value })} /></div>
            <div className="form-group"><label>Account Type</label><select value={newBank.accountType} onChange={e => setNewBank({ ...newBank, accountType: e.target.value })}><option>Current</option><option>Savings</option></select></div>
          </div>
          <div className="form-group"><label>Account Holder Name</label><input value={newBank.holderName} onChange={e => setNewBank({ ...newBank, holderName: e.target.value })} placeholder="e.g. YENCODE Technologies" /></div>
          <div style={{ background: 'var(--orange-light)', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: 'var(--orange-dark)', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <i className="ti ti-shield-lock" style={{ fontSize: '16px', marginTop: '1px' }}></i>
            A small test deposit of ₹1 will be made to verify the account.
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={() => setIsLinkBankModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={linkBank}><i className="ti ti-link"></i>Link & Verify</button>
          </div>
        </div>
      </div>

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