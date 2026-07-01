import React, { useState, useRef } from 'react';

export default function FinReports() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const mainScrollRef = useRef(null);
  const [activePeriod, setActivePeriod] = useState('This Month');

  const openImport = () => setIsImportModalOpen(true);
  const closeImport = () => setIsImportModalOpen(false);

  const exportReport = (name, fmt) => {
    alert(`Exporting ${name} as ${fmt}...`);
  };

  const shareAuditor = () => {
    alert('Financial package shared with auditor!');
  };

  const periods = ['This Month', 'Last Month', 'Q1 2026', 'Q2 2026', 'FY 2025-26', 'Custom Range'];

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

.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
.report-card{background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);padding:22px;border-top:4px solid var(--primary);cursor:pointer;transition:all .2s;}
.report-card:hover{transform:translateY(-2px);box-shadow:var(--shadow-lg);}
.report-card.income-rep{border-top-color:var(--green);}
.report-card.expense-rep{border-top-color:var(--red-dark);}
.report-card.vendor-rep{border-top-color:var(--purple);}
.report-card.bank-rep{border-top-color:var(--orange);}
.report-card.pl-rep{border-top-color:var(--primary);}
.report-card.full-rep{border-top-color:var(--text-dark);}
.report-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;}
.report-icon i{font-size:24px;}
.report-title{font-size:15px;font-weight:800;color:var(--text-dark);margin-bottom:6px;}
.report-desc{font-size:12px;color:var(--text-mid);line-height:1.6;margin-bottom:14px;}
.rep-export-row{display:flex;gap:6px;}

.exp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:10px;font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid;transition:all .15s;}
.exp-pdf{background:var(--red-light);color:var(--red-dark);border-color:#FCA5A5;}.exp-pdf:hover{background:var(--red-dark);color:#fff;}
.exp-excel{background:var(--green-light);color:var(--green-dark);border-color:#6EE7B7;}.exp-excel:hover{background:var(--green);color:#fff;}
.exp-csv{background:var(--blue-light);color:#1E40AF;border-color:#93C5FD;}.exp-csv:hover{background:var(--blue);color:#fff;}

.period-selector{background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);padding:20px 24px;margin-bottom:22px;}
.period-title{font-size:14px;font-weight:800;color:var(--text-dark);margin-bottom:14px;display:flex;align-items:center;gap:7px;}
.period-title i{color:var(--primary);}
.period-chips{display:flex;gap:8px;flex-wrap:wrap;}
.pc-chip{padding:8px 16px;border-radius:20px;border:1.5px solid var(--border);background:transparent;font-family:"Nunito",sans-serif;font-size:12px;font-weight:700;color:var(--text-mid);cursor:pointer;}
.pc-chip.on,.pc-chip:hover{background:var(--primary);border-color:var(--primary);color:#fff;}
.filter-sel{padding:9px 14px;border:1.5px solid var(--border);border-radius:10px;font-family:'Nunito',sans-serif;font-size:13px;font-weight:600;color:var(--text-mid);background:var(--white);outline:none;}

.share-section{background:linear-gradient(135deg,var(--purple),#7C3AED);border-radius:var(--radius);padding:22px 24px;color:#fff;margin-top:22px;}
.share-section h3{font-size:16px;font-weight:900;margin-bottom:6px;}
.share-section p{font-size:13px;opacity:.85;margin-bottom:16px;}

.modal-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:200;align-items:center;justify-content:center;backdrop-filter:blur(3px);}
.modal-bg.open{display:flex;}
.modal{background:var(--white);border-radius:18px;padding:28px 30px;width:560px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.18);}
      `}</style>

      <div className="main">
        <div className="topbar">
          <div className="breadcrumb"><a href="#">Finance</a><i className="ti ti-chevron-right"></i><span>Reports & Export</span></div>
          <div className="topbar-actions">
            <button className="btn btn-outline" onClick={openImport} style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}><i className="ti ti-upload"></i>Import Statement</button>
            <button className="btn btn-outline" style={{ background: 'var(--purple)', color: '#fff', border: 'none' }}><i className="ti ti-shield-check"></i>Auditor Portal</button>
          </div>
        </div>
        <div className="content" ref={mainScrollRef}>
          <div className="period-selector">
            <div className="period-title"><i className="ti ti-calendar"></i>Select Period for Reports</div>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="period-chips">
                {periods.map(p => (
                  <button key={p} className={`pc-chip ${activePeriod === p ? 'on' : ''}`} onClick={() => setActivePeriod(p)}>{p}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                <input type="date" defaultValue="2026-06-01" className="filter-sel" style={{ fontSize: '12px' }} />
                <input type="date" defaultValue="2026-06-30" className="filter-sel" style={{ fontSize: '12px' }} />
              </div>
            </div>
          </div>

          <div className="grid-3" style={{ marginBottom: '22px' }}>
            <div className="report-card income-rep">
              <div className="report-icon" style={{ background: 'var(--green-light)' }}><i className="ti ti-arrow-bar-down" style={{ color: 'var(--green)' }}></i></div>
              <div className="report-title">Income Statement</div>
              <div className="report-desc">All inward transactions — project revenue, retainers, advances. Filterable by client, category, date.</div>
              <div className="rep-export-row">
                <button className="exp-btn exp-pdf" onClick={() => exportReport('Income Statement', 'PDF')}><i className="ti ti-file-type-pdf"></i>PDF</button>
                <button className="exp-btn exp-excel" onClick={() => exportReport('Income Statement', 'Excel')}><i className="ti ti-file-spreadsheet"></i>Excel</button>
                <button className="exp-btn exp-csv" onClick={() => exportReport('Income Statement', 'CSV')}><i className="ti ti-file-text"></i>CSV</button>
              </div>
            </div>
            <div className="report-card expense-rep">
              <div className="report-icon" style={{ background: 'var(--red-light)' }}><i className="ti ti-arrow-bar-up" style={{ color: 'var(--red-dark)' }}></i></div>
              <div className="report-title">Expense Statement</div>
              <div className="report-desc">All outward transactions — payroll, vendor payments, operations, infrastructure. Category-wise breakdown.</div>
              <div className="rep-export-row">
                <button className="exp-btn exp-pdf" onClick={() => exportReport('Expense Statement', 'PDF')}><i className="ti ti-file-type-pdf"></i>PDF</button>
                <button className="exp-btn exp-excel" onClick={() => exportReport('Expense Statement', 'Excel')}><i className="ti ti-file-spreadsheet"></i>Excel</button>
                <button className="exp-btn exp-csv" onClick={() => exportReport('Expense Statement', 'CSV')}><i className="ti ti-file-text"></i>CSV</button>
              </div>
            </div>
            <div className="report-card pl-rep">
              <div className="report-icon" style={{ background: 'var(--primary-light)' }}><i className="ti ti-chart-bar" style={{ color: 'var(--primary)' }}></i></div>
              <div className="report-title">P&L Statement</div>
              <div className="report-desc">Profit & Loss — income vs expenses, net profit margin, month-on-month comparison.</div>
              <div className="rep-export-row">
                <button className="exp-btn exp-pdf" onClick={() => exportReport('P&L Statement', 'PDF')}><i className="ti ti-file-type-pdf"></i>PDF</button>
                <button className="exp-btn exp-excel" onClick={() => exportReport('P&L Statement', 'Excel')}><i className="ti ti-file-spreadsheet"></i>Excel</button>
                <button className="exp-btn exp-csv" onClick={() => exportReport('P&L Statement', 'CSV')}><i className="ti ti-file-text"></i>CSV</button>
              </div>
            </div>
            <div className="report-card bank-rep">
              <div className="report-icon" style={{ background: 'var(--orange-light)' }}><i className="ti ti-building-bank" style={{ color: 'var(--orange)' }}></i></div>
              <div className="report-title">Bank Statement</div>
              <div className="report-desc">Full reconciled bank transactions — credits, debits, opening & closing balance per account.</div>
              <div className="rep-export-row">
                <button className="exp-btn exp-pdf" onClick={() => exportReport('Bank Statement', 'PDF')}><i className="ti ti-file-type-pdf"></i>PDF</button>
                <button className="exp-btn exp-excel" onClick={() => exportReport('Bank Statement', 'Excel')}><i className="ti ti-file-spreadsheet"></i>Excel</button>
                <button className="exp-btn exp-csv" onClick={() => exportReport('Bank Statement', 'CSV')}><i className="ti ti-file-text"></i>CSV</button>
              </div>
            </div>
            <div className="report-card vendor-rep">
              <div className="report-icon" style={{ background: 'var(--purple-light)' }}><i className="ti ti-truck" style={{ color: 'var(--purple)' }}></i></div>
              <div className="report-title">Vendor Report</div>
              <div className="report-desc">All vendor payments, outstanding dues, GST numbers, YTD spend per vendor.</div>
              <div className="rep-export-row">
                <button className="exp-btn exp-pdf" onClick={() => exportReport('Vendor Report', 'PDF')}><i className="ti ti-file-type-pdf"></i>PDF</button>
                <button className="exp-btn exp-excel" onClick={() => exportReport('Vendor Report', 'Excel')}><i className="ti ti-file-spreadsheet"></i>Excel</button>
                <button className="exp-btn exp-csv" onClick={() => exportReport('Vendor Report', 'CSV')}><i className="ti ti-file-text"></i>CSV</button>
              </div>
            </div>
            <div className="report-card full-rep">
              <div className="report-icon" style={{ background: 'var(--bg)' }}><i className="ti ti-file-analytics" style={{ color: 'var(--text-dark)' }}></i></div>
              <div className="report-title">Full Financial Report</div>
              <div className="report-desc">Complete package — income + expenses + P&L + bank + vendors in one combined document.</div>
              <div className="rep-export-row">
                <button className="exp-btn exp-pdf" onClick={() => exportReport('Full Financial Report', 'PDF')} style={{ flex: 1, justifyContent: 'center' }}><i className="ti ti-file-type-pdf"></i>Full PDF</button>
                <button className="exp-btn exp-excel" onClick={() => exportReport('Full Financial Report', 'Excel')} style={{ flex: 1, justifyContent: 'center' }}><i className="ti ti-file-spreadsheet"></i>Excel</button>
              </div>
            </div>
          </div>

          <div className="share-section">
            <h3><i className="ti ti-shield-check" style={{ marginRight: '8px' }}></i>Share with Auditor</h3>
            <p>Send the complete financial package directly to your auditor portal. They can download statements, verify transactions and add remarks.</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: '1px solid rgba(255,255,255,.3)' }} onClick={shareAuditor}><i className="ti ti-send"></i>Send to Auditor Portal</button>
              <button className="btn" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: '1px solid rgba(255,255,255,.3)' }}><i className="ti ti-external-link"></i>Open Auditor Portal</button>
            </div>
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