import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';
export default function FinDashboard() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [impCurrentStep, setImpCurrentStep] = useState(1);
  const [selectedBank, setSelectedBank] = useState('');
  const [importedFile, setImportedFile] = useState(null);
  const mainScrollRef = useRef(null);
  const [dashboardData, setDashboardData] = useState({ totalIncome: 0, totalExpenses: 0, netProfit: 0, profitMargin: 0, pendingReceivables: 0, pendingInvoices: 0, vendorPayables: 0, overdueVendors: 0, incomeChange: 0, expenseChange: 0 });
  const [transactions, setTransactions] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [cashflow, setCashflow] = useState(() => {
    const months = [];
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: d.toLocaleString('en-US', { month: 'short' }), income: 0, expense: 0 });
    }
    return months;
  });

  const [error, setError] = useState(null);
  const now = new Date();
  const currentMonthLabel = `This Month — ${now.toLocaleString('en-IN', { month: 'long' })} ${now.getFullYear()}`;
  const [selectedPeriod, setSelectedPeriod] = useState(currentMonthLabel);
  const stepLabels = ['', 'Select Bank', 'Upload File', 'Map Columns', 'Review & Import'];

  const fetchDashboardData = async () => {
    setError(null);
    axios.get(`${BASE_URL}/api/finance/kpis?period=${encodeURIComponent(selectedPeriod)}`)
      .then(res => { if (res?.data) setDashboardData(res.data); })
      .catch(() => setError('Failed to load dashboard data. Please try again.'));

    axios.get(`${BASE_URL}/api/finance/transactions?period=${encodeURIComponent(selectedPeriod)}`)
      .then(res => { if (res?.data) setTransactions(res.data); })
      .catch(() => { });

    axios.get(`${BASE_URL}/api/finance/bank-accounts`)
      .then(res => {
        if (res?.data) {
          setBankAccounts(res.data);
          if (res.data.length > 0) setSelectedBank(res.data[0].bank);
        }
      })
      .catch(() => { });

    axios.get(`${BASE_URL}/api/finance/expense-breakdown?period=${encodeURIComponent(selectedPeriod)}`)
      .then(res => { if (res?.data) setExpenseBreakdown(res.data); })
      .catch(() => { });

    axios.get(`${BASE_URL}/api/finance/cashflow?period=${encodeURIComponent(selectedPeriod)}`)
      .then(res => { if (res?.data) setCashflow(res.data); })
      .catch(() => { });
  };

  useEffect(() => { fetchDashboardData(); }, [selectedPeriod]);

  const handleDeleteTransaction = (index) => {
    if (!window.confirm("Delete this transaction?")) return;
    setTransactions(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditTransaction = (index) => {
    const tx = transactions[index];
    const newDesc = window.prompt("Edit description:", tx.description);
    if (newDesc === null) return;
    setTransactions(prev => prev.map((t, i) => i === index ? { ...t, description: newDesc } : t));
  };




  const fmt = (num) => {
    const n = Number(num) || 0;
    if (n >= 100000) return `₹${(n / 100000).toFixed(2).replace(/\.00$/, '')} L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };
  const maxCashflow = cashflow.length ? Math.max(...cashflow.map(m => Math.max(m.income, m.expense))) : 1;
  const pfColors = ['pf-red', 'pf-orange', 'pf-primary', ''];
  const pfStyles = [null, null, null, { background: 'var(--purple)' }];

  const openImport = () => {
    setIsImportModalOpen(true);
    setImpCurrentStep(1);
  };

  const closeImport = () => {
    setIsImportModalOpen(false);
  };

  const handleBankSelect = (b) => {
    setSelectedBank(b);
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImportedFile(f);
  };

  const impNext = () => {
    if (impCurrentStep === 4) {
      setIsImportModalOpen(false);
      alert('Yes 144 transactions imported successfully! 4 duplicates skipped.');
      return;
    }
    if (impCurrentStep === 2 && !importedFile) {
      alert('Please select a file first');
      return;
    }
    setImpCurrentStep(impCurrentStep + 1);
  };

  const impPrev = () => {
    setImpCurrentStep(impCurrentStep - 1);
  };

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
.page-title{font-size:19px;font-weight:900;color:var(--text-dark);}
.topbar-actions{display:flex;align-items:center;gap:10px;}
.content{padding:26px;flex:1;}
.btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:all .15s;}
.btn-primary{background:var(--primary);color:#fff;}.btn-primary:hover{background:var(--primary-dark);}
.btn-outline{background:transparent;border:1.5px solid var(--border);color:var(--text-mid);}.btn-outline:hover{border-color:var(--primary);color:var(--primary);background:var(--primary-light);}
.btn-green{background:var(--green);color:#fff;}.btn-green:hover{background:#1aab6d;}
.btn-red{background:var(--red-light);color:var(--red-dark);border:1.5px solid #FCA5A5;}.btn-red:hover{background:var(--red-dark);color:#fff;}
.btn-sm{padding:6px 12px;font-size:12px;}
.card{background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);padding:22px 24px;}
.kpi-grid{display:grid;gap:16px;margin-bottom:22px;}
.kpi-grid-4{grid-template-columns:repeat(4,1fr);}
.kpi-grid-5{grid-template-columns:repeat(5,1fr);}
.kpi{background:var(--white);border:1.5px solid #E0EEF0;border-radius:14px;padding:14px 16px;box-shadow:0 2px 10px rgba(0,0,0,0.02);height:96px;box-sizing:border-box;display:flex;flex-direction:row;align-items:center;gap:12px;overflow:hidden;}
.kpi-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;}
.kpi-body{display:flex;flex-direction:column;justify-content:center;gap:2px;overflow:hidden;min-width:0;}
.kpi-label{font-size:10px;font-weight:800;color:var(--text-light);text-transform:uppercase;letter-spacing:.6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.kpi-value{font-size:19px;font-weight:900;color:var(--text-dark);line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.kpi-sub{font-size:10px;font-weight:600;display:flex;align-items:center;gap:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.kpi-sub.up{color:var(--green);}
.kpi-sub.down{color:var(--red);}
.kpi-sub.neutral{color:var(--text-light);}
.kpi.income .kpi-icon{background:rgba(16,185,129,0.15);color:var(--green);}
.kpi.expense .kpi-icon{background:rgba(220,38,38,0.15);color:var(--red-dark);}
.kpi.profit .kpi-icon{background:rgba(37,99,235,0.15);color:var(--primary);}
.kpi.pending .kpi-icon{background:rgba(245,158,11,0.15);color:#F59E0B;}
.kpi.vendor .kpi-icon{background:rgba(139,92,246,0.15);color:var(--purple);}
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
.badge-overdue{background:var(--red-light);color:var(--red-dark);}
.badge-partial{background:var(--blue-light);color:#1E40AF;}
.progress-bg{background:var(--bg);border-radius:20px;height:8px;overflow:hidden;}
.progress-fill{height:100%;border-radius:20px;}
.pf-green{background:linear-gradient(90deg,var(--green),#059669);}
.pf-red{background:linear-gradient(90deg,var(--red),#DC2626);}
.pf-primary{background:linear-gradient(90deg,var(--primary),var(--primary-dark));}
.pf-orange{background:linear-gradient(90deg,var(--orange),#D97706);}
.filter-sel{padding:9px 14px;border:1.5px solid var(--border);border-radius:10px;font-family:'Nunito',sans-serif;font-size:13px;font-weight:600;color:var(--text-mid);background:var(--white);outline:none;cursor:pointer;}
.filter-sel:focus{border-color:var(--primary);}
.grid-main-side{display:grid;grid-template-columns:1fr 320px;gap:22px;}
.amt-in{color:var(--green);font-weight:800;}
.amt-out{color:var(--red-dark);font-weight:800;}
.amt-neutral{color:var(--text-dark);font-weight:800;}
.imp-modal-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:300;align-items:center;justify-content:center;backdrop-filter:blur(4px);}
.imp-modal-bg.open{display:flex;}
.imp-modal{background:#fff;border-radius:20px;width:780px;max-width:96vw;max-height:92vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.22);animation:modalIn .2s ease;}
@keyframes modalIn{from{opacity:0;transform:translateY(-16px) scale(.97)}to{opacity:1;transform:none}}
.imp-header{background:linear-gradient(135deg,var(--primary),var(--primary-dark));padding:22px 28px;border-radius:20px 20px 0 0;}
.imp-header h2{font-size:18px;font-weight:900;color:#fff;display:flex;align-items:center;gap:10px;margin-bottom:4px;}
.imp-header p{font-size:13px;color:rgba(255,255,255,.8);}
.imp-body{padding:24px 28px;}
.imp-steps{display:flex;align-items:center;margin-bottom:26px;}
.imp-step{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--text-light);}
.imp-step-num{width:26px;height:26px;border-radius:50%;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;}
.imp-step.done .imp-step-num{background:var(--green);border-color:var(--green);color:#fff;}
.imp-step.active .imp-step-num{background:var(--primary);border-color:var(--primary);color:#fff;}
.imp-step.active{color:var(--text-dark);}
.imp-step-line{flex:1;height:2px;background:var(--border);margin:0 8px;}
.imp-step-line.done{background:var(--green);}
.drop-zone{border:2px dashed var(--border);border-radius:14px;padding:36px 24px;text-align:center;cursor:pointer;transition:all .2s;position:relative;background:var(--bg);}
.drop-zone:hover,.drop-zone.drag{border-color:var(--primary);background:var(--primary-light);}
.drop-zone input{position:absolute;inset:0;opacity:0;cursor:pointer;}
.drop-zone i{font-size:40px;color:var(--primary-mid);margin-bottom:12px;display:block;}
.drop-zone h3{font-size:15px;font-weight:800;color:var(--text-dark);margin-bottom:6px;}
.drop-zone p{font-size:13px;color:var(--text-light);}
.format-chips{display:flex;gap:8px;justify-content:center;margin-top:14px;flex-wrap:wrap;}
.fmt-chip{padding:5px 14px;border-radius:20px;font-size:11px;font-weight:700;border:1.5px solid var(--border);color:var(--text-mid);}
.fmt-chip.csv{background:#DBEAFE;border-color:#93C5FD;color:#1E40AF;}
.fmt-chip.excel{background:var(--green-light);border-color:#6EE7B7;color:var(--green-dark);}
.fmt-chip.pdf{background:var(--red-light);border-color:#FCA5A5;color:var(--red-dark);}
.bank-selector{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;}
.bs-opt{padding:14px 16px;border:2px solid var(--border);border-radius:12px;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:10px;}
.bs-opt:hover{border-color:var(--primary);background:var(--primary-light);}
.bs-opt.sel{border-color:var(--primary);background:var(--primary-light);}
.bs-opt-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.bs-opt-icon i{font-size:18px;}
.bs-opt-name{font-size:13px;font-weight:700;color:var(--text-dark);}
.bs-opt-acc{font-size:11px;color:var(--text-light);}
.col-mapper{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px;}
.cm-row{display:flex;flex-direction:column;gap:5px;}
.cm-label{font-size:11px;font-weight:800;color:var(--text-mid);text-transform:uppercase;letter-spacing:.6px;}
.cm-sel{padding:9px 12px;border:1.5px solid var(--border);border-radius:9px;font-family:'Nunito',sans-serif;font-size:13px;color:var(--text-dark);background:var(--bg);outline:none;}
.cm-sel:focus{border-color:var(--primary);}
.preview-table-wrap{max-height:260px;overflow-y:auto;border:1.5px solid var(--border);border-radius:10px;margin-bottom:16px;}
.preview-table-wrap table{width:100%;border-collapse:collapse;font-size:12px;}
.preview-table-wrap th{padding:8px 12px;background:var(--bg);font-size:10px;font-weight:800;color:var(--text-light);text-transform:uppercase;letter-spacing:.6px;position:sticky;top:0;}
.preview-table-wrap td{padding:9px 12px;border-bottom:1px solid var(--bg);font-weight:600;}
.preview-table-wrap tr:hover td{background:#FAFCFE;}
.row-in td:first-child{border-left:3px solid var(--green);}
.row-out td:first-child{border-left:3px solid var(--red-dark);}
.imp-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px;}
.is-box{background:var(--bg);border-radius:10px;padding:12px;text-align:center;border:1.5px solid var(--border);}
.is-num{font-size:18px;font-weight:900;color:var(--text-dark);}
.is-lbl{font-size:10px;color:var(--text-light);font-weight:700;text-transform:uppercase;letter-spacing:.6px;margin-top:3px;}
.imp-footer{display:flex;justify-content:space-between;align-items:center;padding:16px 28px;border-top:1px solid var(--border);background:var(--bg);border-radius:0 0 20px 20px;}
      `}</style>
      <div className="main">
        <div className="topbar">
          <div className="page-title">Finance Overview</div>
          <div className="topbar-actions">
            <button className="btn btn-outline" onClick={openImport} style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
              <i className="ti ti-upload"></i>Import Statement
            </button>
            <input
              type="month"
              className="filter-sel"
              defaultValue={`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`}
              onChange={e => {
                const [year, month] = e.target.value.split('-');
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                const label = `${monthNames[parseInt(month) - 1]} ${year}`;
                setSelectedPeriod(label);
              }}
              style={{ cursor: 'pointer' }}
            />

            <button className="btn btn-primary" style={{ background: 'var(--purple)' }}>
              <i className="ti ti-shield-check"></i>Auditor Portal
            </button>
          </div>
        </div>

        <div className="content" ref={mainScrollRef}>

          {error && (
            <div style={{ background: 'var(--red-light)', border: '1.5px solid #FCA5A5', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <i className="ti ti-alert-circle" style={{ color: 'var(--red-dark)', fontSize: '20px' }}></i>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--red-dark)' }}>{error}</span>
              <button className="btn btn-sm" style={{ marginLeft: 'auto', background: 'var(--red-dark)', color: '#fff', border: 'none' }} onClick={fetchDashboardData}>Retry</button>
            </div>
          )}
          {(
            <>
              <div className="kpi-grid kpi-grid-5">
                <div className="kpi income">
                  <div className="kpi-icon"><i className="ti ti-cash"></i></div>
                  <div className="kpi-body">
                    <div className="kpi-label">Total Income</div>
                    <div className="kpi-value">{fmt(dashboardData.totalIncome)}</div>
                    <div className={`kpi-sub ${dashboardData.incomeChange >= 0 ? 'up' : 'down'}`}>
                      <i className={`ti ti-trending-${dashboardData.incomeChange >= 0 ? 'up' : 'down'}`}></i>
                      {dashboardData.incomeChange >= 0 ? '+' : ''}{dashboardData.incomeChange}% vs last month
                    </div>
                  </div>
                </div>
                <div className="kpi expense">
                  <div className="kpi-icon"><i className="ti ti-receipt-2"></i></div>
                  <div className="kpi-body">
                    <div className="kpi-label">Total Expenses</div>
                    <div className="kpi-value">{fmt(dashboardData.totalExpenses)}</div>
                    <div className={`kpi-sub ${dashboardData.expenseChange <= 0 ? 'up' : 'down'}`}>
                      <i className="ti ti-trending-up"></i>+{dashboardData.expenseChange}% vs last month
                    </div>
                  </div>
                </div>
                <div className="kpi profit">
                  <div className="kpi-icon"><i className="ti ti-chart-line"></i></div>
                  <div className="kpi-body">
                    <div className="kpi-label">Net Profit</div>
                    <div className="kpi-value">{fmt(dashboardData.netProfit)}</div>
                    <div className="kpi-sub up"><i className="ti ti-trending-up"></i>+{dashboardData.profitMargin}% margin</div>
                  </div>
                </div>
                <div className="kpi pending">
                  <div className="kpi-icon"><i className="ti ti-file-invoice"></i></div>
                  <div className="kpi-body">
                    <div className="kpi-label">Pending Receivables</div>
                    <div className="kpi-value">{fmt(dashboardData.pendingReceivables)}</div>
                    <div className="kpi-sub neutral"><i className="ti ti-clock"></i>{dashboardData.pendingInvoices} invoices due</div>
                  </div>
                </div>
                <div className="kpi vendor">
                  <div className="kpi-icon"><i className="ti ti-truck"></i></div>
                  <div className="kpi-body">
                    <div className="kpi-label">Vendor Payables</div>
                    <div className="kpi-value">{fmt(dashboardData.vendorPayables)}</div>
                    <div className="kpi-sub down"><i className="ti ti-alert-circle"></i>{dashboardData.overdueVendors} overdue</div>
                  </div>
                </div>
              </div>

              <div className="grid-main-side" style={{ marginBottom: '20px' }}>
                <div>
                  <div className="card" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="ti ti-chart-bar" style={{ color: 'var(--primary)', fontSize: '18px' }}></i>Monthly Cashflow
                      </div>
                      <div style={{ display: 'flex', gap: '14px', fontSize: '12px', fontWeight: 700 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--green)' }}>
                          <span style={{ width: '10px', height: '10px', background: 'var(--green)', borderRadius: '50%', display: 'inline-block' }}></span>Income
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--red-dark)' }}>
                          <span style={{ width: '10px', height: '10px', background: 'var(--red-dark)', borderRadius: '50%', display: 'inline-block' }}></span>Expenses
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '160px', paddingBottom: '24px', position: 'relative' }}>
                      <div style={{ position: 'absolute', bottom: '24px', left: 0, right: 0 }}>
                        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '40px' }}></div>
                        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '40px' }}></div>
                        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '40px' }}></div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
                        {cashflow.map((m, idx) => {
                          const isLast = idx === cashflow.length - 1;
                          const incH = Math.round((m.income / maxCashflow) * 100);
                          const expH = Math.round((m.expense / maxCashflow) * 100);
                          return (
                            <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                              <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '130px' }}>
                                <div style={{ width: '14px', background: 'var(--green)', borderRadius: '4px 4px 0 0', height: `${incH}%`, opacity: isLast ? 1 : 0.85, boxShadow: isLast ? '0 0 0 2px var(--green-light)' : 'none' }}></div>
                                <div style={{ width: '14px', background: 'var(--red-dark)', borderRadius: '4px 4px 0 0', height: `${expH}%`, opacity: isLast ? 1 : 0.85, boxShadow: isLast ? '0 0 0 2px var(--red-light)' : 'none' }}></div>
                              </div>
                              <div style={{ fontSize: '10px', color: isLast ? 'var(--primary)' : 'var(--text-light)', fontWeight: isLast ? 800 : 700 }}>{m.month}{isLast ? ' ●' : ''}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="ti ti-list" style={{ color: 'var(--primary)' }}></i>Recent Transactions
                      </div>
                      <button className="btn btn-outline btn-sm" onClick={fetchDashboardData}><i className="ti ti-refresh"></i>Refresh</button>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                          {transactions.map((tx, i) => (
                            <tr key={i}>
                              <td>{tx.date}</td>
                              <td>{tx.description}</td>
                              <td>{tx.category}</td>
                              <td><span className={`badge badge-${tx.type === 'Income' ? 'income' : 'expense'}`}>{tx.type}</span></td>
                              <td className={tx.type === 'Income' ? 'amt-in' : 'amt-out'}>{tx.type === 'Income' ? '+' : '−'}{fmt(tx.amount)}</td>
                              <td><span className={`badge badge-${tx.status === 'Paid' ? 'paid' : tx.status === 'Pending' ? 'pending' : 'overdue'}`}>{tx.status}</span></td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button className="btn btn-sm btn-outline" onClick={() => handleEditTransaction(i)} style={{ padding: '4px 8px' }}><i className="ti ti-pencil"></i></button>
                                  <button className="btn btn-sm btn-red" onClick={() => handleDeleteTransaction(i)} style={{ padding: '4px 8px' }}><i className="ti ti-trash"></i></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div className="card">
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
                      <i className="ti ti-building-bank" style={{ color: 'var(--primary)' }}></i>Bank Accounts
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {bankAccounts.map((acc, i) => (
                        <div key={i} style={acc.primary ? { background: 'linear-gradient(135deg,var(--primary),var(--primary-dark))', borderRadius: '12px', padding: '14px 16px', color: '#fff' } : { background: 'var(--bg)', borderRadius: '12px', padding: '14px 16px', border: '1.5px solid var(--border)' }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, opacity: acc.primary ? 0.8 : 1, color: acc.primary ? undefined : 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '.7px' }}>{acc.bank} — {acc.type}</div>
                          <div style={{ fontSize: '20px', fontWeight: 900, margin: '6px 0', color: acc.primary ? '#fff' : 'var(--text-dark)' }}>{fmt(acc.balance)}</div>
                          <div style={{ fontSize: '11px', opacity: acc.primary ? 0.8 : 1, color: acc.primary ? undefined : 'var(--text-light)' }}>•••• •••• {acc.last4} · Synced {acc.synced}</div>
                        </div>
                      ))}
                    </div>
                    <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', fontSize: '12px', marginTop: '12px' }}>
                      <i className="ti ti-building-bank"></i>Manage Banks
                    </button>
                  </div>

                  <div className="card">
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
                      <i className="ti ti-chart-donut" style={{ color: 'var(--primary)' }}></i>Expense Breakdown
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {expenseBreakdown.map((item, i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                            <span style={{ fontWeight: 700 }}>{item.category}</span>
                            <span style={{ fontWeight: 800 }}>{fmt(item.amount)} <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>({item.percent}%)</span></span>
                          </div>
                          <div className="progress-bg">
                            <div className={`progress-fill ${pfColors[i] || ''}`} style={{ width: `${item.percent}%`, ...(pfStyles[i] || {}) }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card">
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '12px' }}>Quick Actions</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button className="btn btn-outline" style={{ justifyContent: 'flex-start', fontSize: '13px' }}><i className="ti ti-arrow-bar-down" style={{ color: 'var(--green)' }}></i>Record Income</button>
                      <button className="btn btn-outline" style={{ justifyContent: 'flex-start', fontSize: '13px' }}><i className="ti ti-arrow-bar-up" style={{ color: 'var(--red-dark)' }}></i>Add Expense</button>
                      <button className="btn btn-outline" style={{ justifyContent: 'flex-start', fontSize: '13px' }}><i className="ti ti-truck" style={{ color: 'var(--purple)' }}></i>Manage Vendors</button>
                      <button className="btn btn-outline" style={{ justifyContent: 'flex-start', fontSize: '13px' }} onClick={fetchDashboardData}><i className="ti ti-refresh" style={{ color: 'var(--primary)' }}></i>Refresh Data</button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className={`imp-modal-bg ${isImportModalOpen ? 'open' : ''}`} onClick={(e) => { if (e.target.className.includes('imp-modal-bg')) closeImport() }}>
          <div className="imp-modal">
            <div className="imp-header" style={{ position: 'relative' }}>
              <h2><i className="ti ti-upload"></i>Import Bank Statement</h2>
              <p>Upload CSV, Excel (.xlsx) or PDF statement from your bank — we'll read and map it automatically.</p>
              <button
                onClick={closeImport}
                style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: 'rgba(255,255,255,0.2)', border: 'none',
                  borderRadius: '50%', width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#fff', fontSize: '18px', fontWeight: 700,
                  lineHeight: 1, transition: 'background .15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                title="Close"
              >×</button>
            </div>
            <div className="imp-body">
              <div className="imp-steps">
                <div className={`imp-step ${impCurrentStep > 1 ? 'done' : impCurrentStep === 1 ? 'active' : ''}`}><div className="imp-step-num">1</div>Select Bank</div>
                <div className={`imp-step-line ${impCurrentStep > 1 ? 'done' : ''}`}></div>
                <div className={`imp-step ${impCurrentStep > 2 ? 'done' : impCurrentStep === 2 ? 'active' : ''}`}><div className="imp-step-num">2</div>Upload File</div>
                <div className={`imp-step-line ${impCurrentStep > 2 ? 'done' : ''}`}></div>
                <div className={`imp-step ${impCurrentStep > 3 ? 'done' : impCurrentStep === 3 ? 'active' : ''}`}><div className="imp-step-num">3</div>Map Columns</div>
                <div className={`imp-step-line ${impCurrentStep > 3 ? 'done' : ''}`}></div>
                <div className={`imp-step ${impCurrentStep === 4 ? 'active' : ''}`}><div className="imp-step-num">4</div>Review & Import</div>
              </div>

              {impCurrentStep === 1 && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-mid)', marginBottom: '12px' }}>Which account is this statement for?</div>
                  <div className="bank-selector">
                    {bankAccounts.map((acc) => (
                      <div key={acc.bank} className={`bs-opt ${selectedBank === acc.bank ? 'sel' : ''}`} onClick={() => handleBankSelect(acc.bank)}>
                        <div className="bs-opt-icon" style={{ background: acc.primary ? 'var(--primary-light)' : 'var(--purple-light)' }}>
                          <i className="ti ti-building-bank" style={{ color: acc.primary ? 'var(--primary)' : 'var(--purple)' }}></i>
                        </div>
                        <div>
                          <div className="bs-opt-name">{acc.bank}</div>
                          <div className="bs-opt-acc">{acc.type} ••••{acc.last4}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {impCurrentStep === 2 && (
                <div>
                  <div className="drop-zone">
                    <input type="file" accept=".csv,.xlsx,.xls,.pdf" onChange={handleFile} />
                    <i className="ti ti-cloud-upload"></i>
                    <h3>Drag & drop your bank statement here</h3>
                    <p>or click to browse files</p>
                  </div>
                  {importedFile && (
                    <div style={{ background: 'var(--green-light)', borderRadius: '10px', padding: '12px 16px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="ti ti-circle-check" style={{ color: 'var(--green)', fontSize: '20px' }}></i>
                      <div><div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green-dark)' }}>{importedFile.name}</div></div>
                    </div>
                  )}
                </div>
              )}
              {impCurrentStep === 3 && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-mid)', marginBottom: '14px' }}>Map your file's columns</div>
                  <div className="col-mapper">
                    <div className="cm-row"><div className="cm-label">Date Column *</div><select className="cm-sel"><option>Column A — Date</option></select></div>
                    <div className="cm-row"><div className="cm-label">Description *</div><select className="cm-sel"><option>Column B — Narration</option></select></div>
                  </div>
                </div>
              )}
              {impCurrentStep === 4 && (
                <div>
                  <div className="imp-summary">
                    <div className="is-box"><div className="is-num">148</div><div className="is-lbl">Total Rows</div></div>
                    <div className="is-box" style={{ borderColor: 'var(--green)' }}><div className="is-num" style={{ color: 'var(--green)' }}>62</div><div className="is-lbl">Credits</div></div>
                  </div>
                </div>
              )}
            </div>
            <div className="imp-footer">
              <button className="btn btn-outline" onClick={impPrev} style={{ display: impCurrentStep > 1 ? 'flex' : 'none' }}><i className="ti ti-arrow-left"></i>Back</button>
              <div style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 600 }}>Step {impCurrentStep} of 4 — {stepLabels[impCurrentStep]}</div>
              <button className="btn btn-primary" onClick={impNext} style={{ background: impCurrentStep === 4 ? 'var(--green)' : 'var(--primary)' }}>
                {impCurrentStep === 4 ? <><i className="ti ti-upload"></i> Import Now</> : <>Next <i className="ti ti-arrow-right"></i></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
