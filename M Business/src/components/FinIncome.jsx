import React, { useState, useRef } from 'react';

export default function FinIncome() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false);
const mainScrollRef = useRef(null);
  const openImport = () => setIsImportModalOpen(true);
  const closeImport = () => setIsImportModalOpen(false);

  const saveIncome = () => {
    setIsAddIncomeModalOpen(false);
    alert('Income entry saved!');
  };

  const toast = (msg) => alert(msg);

  return (
    <>
      <style>{`
/* ── M Business Finance Design System ── */
:root {
  --primary:#00BCD4; --primary-dark:#0097A7; --primary-light:#E0F7FA; --primary-mid:#B2EBF2;
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
.btn-green{background:var(--green);color:#fff;}.btn-green:hover{background:#1aab6d;}
.btn-sm{padding:6px 12px;font-size:12px;}
.card{background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow);padding:22px 24px;}
.kpi-grid{display:grid;gap:16px;margin-bottom:22px;}
.kpi-grid-4{grid-template-columns:repeat(4,1fr);}
.kpi{background:var(--white);border-radius:var(--radius);padding:18px 20px;box-shadow:var(--shadow);border-left:4px solid transparent;}
.kpi.income{border-left-color:var(--green);}
.kpi.pending{border-left-color:var(--orange);}
.kpi-label{font-size:11px;font-weight:800;color:var(--text-light);text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px;}
.kpi-value{font-size:24px;font-weight:900;color:var(--text-dark);margin-bottom:4px;}
.kpi-sub{font-size:12px;font-weight:600;display:flex;align-items:center;gap:4px;}
.kpi-sub.up{color:var(--green);}
.kpi-sub.down{color:var(--red);}
.kpi-sub.neutral{color:var(--text-light);}
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;font-size:13px;}
thead tr{background:var(--bg);}
th{padding:10px 14px;text-align:left;font-size:11px;font-weight:800;color:var(--text-light);text-transform:uppercase;letter-spacing:.7px;white-space:nowrap;}
td{padding:12px 14px;border-bottom:1px solid var(--bg);color:var(--text-dark);font-weight:600;}
tr:last-child td{border-bottom:none;}
tr:hover td{background:#FAFCFE;}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;}
.badge-paid{background:var(--green-light);color:var(--green-dark);}
.badge-pending{background:var(--orange-light);color:var(--orange-dark);}
.badge-overdue{background:var(--red-light);color:var(--red-dark);}
.toolbar{display:flex;align-items:center;gap:10px;margin-bottom:18px;flex-wrap:wrap;}
.search-box{display:flex;align-items:center;gap:8px;background:var(--white);border:1.5px solid var(--border);border-radius:10px;padding:9px 14px;min-width:220px;}
.search-box:focus-within{border-color:var(--primary);}
.search-box i{color:var(--text-light);font-size:16px;}
.search-box input{border:none;outline:none;background:transparent;font-family:'Nunito',sans-serif;font-size:13px;width:100%;}
.filter-sel{padding:9px 14px;border:1.5px solid var(--border);border-radius:10px;font-family:'Nunito',sans-serif;font-size:13px;font-weight:600;color:var(--text-mid);background:var(--white);outline:none;cursor:pointer;}
.filter-sel:focus{border-color:var(--primary);}
.export-row{display:flex;gap:8px;flex-wrap:wrap;}
.exp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:10px;font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid;transition:all .15s;}
.exp-pdf{background:var(--red-light);color:var(--red-dark);border-color:#FCA5A5;}.exp-pdf:hover{background:var(--red-dark);color:#fff;}
.exp-excel{background:var(--green-light);color:var(--green-dark);border-color:#6EE7B7;}.exp-excel:hover{background:var(--green);color:#fff;}
.exp-csv{background:var(--blue-light);color:#1E40AF;border-color:#93C5FD;}.exp-csv:hover{background:var(--blue);color:#fff;}
.amt-in{color:var(--green);font-weight:800;}
.modal-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:200;align-items:center;justify-content:center;backdrop-filter:blur(3px);}
.modal-bg.open{display:flex;}
.modal{background:var(--white);border-radius:18px;padding:28px 30px;width:560px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.18);}
.modal-title{font-size:18px;font-weight:900;color:var(--text-dark);display:flex;align-items:center;gap:10px;margin-bottom:22px;}
.form-group{margin-bottom:16px;}
.form-group label{display:block;font-size:11px;font-weight:800;color:var(--text-mid);text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px;}
.form-group input,.form-group select,.form-group textarea{width:100%;padding:11px 14px;border:1.5px solid var(--border);border-radius:10px;font-family:'Nunito',sans-serif;font-size:14px;color:var(--text-dark);background:var(--bg);outline:none;}
.form-group input:focus,.form-group select:focus{border-color:var(--primary);background:#fff;}
.form-2col{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.modal-footer{display:flex;justify-content:flex-end;gap:10px;margin-top:22px;padding-top:16px;border-top:1px solid var(--border);}
      `}</style>
      <div className="main">
        <div className="topbar">
          <div className="breadcrumb"><a href="#">Finance</a><i className="ti ti-chevron-right"></i><span>Income</span></div>
          <div className="topbar-actions">
            <button className="btn btn-outline" onClick={openImport} style={{borderColor:'var(--primary)',color:'var(--primary)'}}><i className="ti ti-upload"></i>Import Statement</button>
            <div className="export-row">
              <button className="exp-btn exp-pdf" onClick={() => toast('Exporting PDF...')}><i className="ti ti-file-type-pdf"></i>PDF</button>
              <button className="exp-btn exp-excel" onClick={() => toast('Exporting Excel...')}><i className="ti ti-file-spreadsheet"></i>Excel</button>
              <button className="exp-btn exp-csv" onClick={() => toast('Exporting CSV...')}><i className="ti ti-file-text"></i>CSV</button>
            </div>
            <button className="btn btn-green" onClick={() => setIsAddIncomeModalOpen(true)}><i className="ti ti-plus"></i>Add Income</button>
          </div>
        </div>
        <div className="content" ref={mainScrollRef}>
          <div className="kpi-grid kpi-grid-4" style={{marginBottom:'22px'}}>
            <div className="kpi income"><div className="kpi-label">This Month</div><div className="kpi-value">₹18,42,000</div><div className="kpi-sub up"><i className="ti ti-trending-up"></i>+12% vs May</div></div>
            <div className="kpi income"><div className="kpi-label">Project Revenue</div><div className="kpi-value">₹15,87,500</div><div className="kpi-sub neutral"><i className="ti ti-layout-kanban"></i>6 projects</div></div>
            <div className="kpi pending"><div className="kpi-label">Pending / Dues</div><div className="kpi-value">₹3,21,000</div><div className="kpi-sub down"><i className="ti ti-clock"></i>4 invoices</div></div>
            <div className="kpi income"><div className="kpi-label">YTD Income</div><div className="kpi-value">₹92,14,000</div><div className="kpi-sub up"><i className="ti ti-trending-up"></i>FY 2025-26</div></div>
          </div>
          
          <div className="toolbar">
            <div className="search-box"><i className="ti ti-search"></i><input placeholder="Search income records..." /></div>
            <select className="filter-sel"><option>All Types</option><option>Project Revenue</option><option>Retainer</option></select>
            <select className="filter-sel"><option>All Status</option><option>Paid</option><option>Pending</option></select>
            <select className="filter-sel"><option>June 2026</option><option>May 2026</option><option>All Time</option></select>
          </div>
          
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th><input type="checkbox" style={{accentColor:'var(--primary)'}} /></th><th>Date</th><th>Invoice/Ref</th><th>Client</th><th>Description</th><th>Category</th><th>Amount</th><th>Payment Mode</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  <tr><td><input type="checkbox" /></td><td>Jun 5</td><td style={{color:'var(--primary)',fontWeight:700}}>INV-2026-019</td><td>NovaMart Inc.</td><td>E-Commerce Platform — Milestone 3</td><td>Project Revenue</td><td className="amt-in">₹2,12,500</td><td>Bank Transfer</td><td><span className="badge badge-pending">Pending</span></td><td><button className="btn btn-outline btn-sm"><i className="ti ti-eye"></i></button></td></tr>
                  <tr><td><input type="checkbox" /></td><td>Jun 3</td><td style={{color:'var(--primary)',fontWeight:700}}>INV-2026-018</td><td>MediCore Pvt Ltd</td><td>HealthTrack App — Milestone 1</td><td>Project Revenue</td><td className="amt-in">₹1,87,500</td><td>NEFT</td><td><span className="badge badge-paid">Paid</span></td><td><button className="btn btn-outline btn-sm"><i className="ti ti-eye"></i></button></td></tr>
                  <tr><td><input type="checkbox" /></td><td>May 31</td><td style={{color:'var(--primary)',fontWeight:700}}>INV-2026-017</td><td>LogiTrack Systems</td><td>ERP Portal — Advance (30%)</td><td>Project Revenue</td><td className="amt-in">₹3,50,000</td><td>Cheque</td><td><span className="badge badge-paid">Paid</span></td><td><button className="btn btn-outline btn-sm"><i className="ti ti-eye"></i></button></td></tr>
                  <tr><td><input type="checkbox" /></td><td>May 28</td><td style={{color:'var(--primary)',fontWeight:700}}>INV-2026-016</td><td>AquaFin Seafoods</td><td>Brand Identity — Final Delivery</td><td>Project Revenue</td><td className="amt-in">₹1,20,000</td><td>UPI</td><td><span className="badge badge-paid">Paid</span></td><td><button className="btn btn-outline btn-sm"><i className="ti ti-eye"></i></button></td></tr>
                  <tr><td><input type="checkbox" /></td><td>May 25</td><td style={{color:'var(--primary)',fontWeight:700}}>INV-2026-015</td><td>TechNest Startups</td><td>Monthly Retainer — May</td><td>Retainer</td><td className="amt-in">₹85,000</td><td>NEFT</td><td><span className="badge badge-paid">Paid</span></td><td><button className="btn btn-outline btn-sm"><i className="ti ti-eye"></i></button></td></tr>
                  <tr><td><input type="checkbox" /></td><td>May 20</td><td style={{color:'var(--primary)',fontWeight:700}}>INV-2026-014</td><td>SunRise Exports</td><td>Corporate Website — Final</td><td>Project Revenue</td><td className="amt-in">₹95,000</td><td>Bank Transfer</td><td><span className="badge badge-overdue">Overdue</span></td><td><button className="btn btn-outline btn-sm"><i className="ti ti-eye"></i></button></td></tr>
                </tbody>
              </table>
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'16px',paddingTop:'14px',borderTop:'1px solid var(--border)',fontSize:'13px',color:'var(--text-light)'}}>
              <span>Showing 6 of 48 records</span>
              <div style={{display:'flex',gap:'6px'}}>
                <button className="btn btn-outline btn-sm">← Prev</button>
                <button className="btn btn-primary btn-sm">1</button>
                <button className="btn btn-outline btn-sm">2</button>
                <button className="btn btn-outline btn-sm">Next →</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`modal-bg ${isAddIncomeModalOpen ? 'open' : ''}`} onClick={(e) => { if(e.target.className.includes('modal-bg')) setIsAddIncomeModalOpen(false) }}>
        <div className="modal">
          <div className="modal-title"><i className="ti ti-arrow-bar-down" style={{color:'var(--green)'}}></i>Add Income Entry</div>
          <div className="form-2col">
            <div className="form-group"><label>Date *</label><input type="date" defaultValue="2026-06-05" /></div>
            <div className="form-group"><label>Invoice / Ref No.</label><input placeholder="e.g. INV-2026-020" /></div>
          </div>
          <div className="form-2col">
            <div className="form-group"><label>Client *</label><select><option>NovaMart Inc.</option><option>MediCore Pvt Ltd</option></select></div>
            <div className="form-group"><label>Category</label><select><option>Project Revenue</option><option>Retainer</option></select></div>
          </div>
          <div className="form-group"><label>Description *</label><input placeholder="Brief description of income..." /></div>
          <div className="form-2col">
            <div className="form-group"><label>Amount (₹) *</label><input type="number" placeholder="e.g. 150000" /></div>
            <div className="form-group"><label>Payment Mode</label><select><option>Bank Transfer</option><option>NEFT/RTGS</option></select></div>
          </div>
          <div className="form-2col">
            <div className="form-group"><label>Payment Status</label><select><option>Paid</option><option>Pending</option></select></div>
            <div className="form-group"><label>Bank Account</label><select><option>HDFC — ••••4821</option></select></div>
          </div>
          <div className="form-group"><label>Attach Receipt / Invoice</label><input type="file" accept=".pdf,.jpg,.png" style={{fontSize:'13px'}} /></div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={() => setIsAddIncomeModalOpen(false)}>Cancel</button>
            <button className="btn btn-green" onClick={saveIncome}><i className="ti ti-check"></i>Save Income</button>
          </div>
        </div>
      </div>

      {isImportModalOpen && (
        <div className="modal-bg open" onClick={(e) => { if(e.target.className.includes('modal-bg')) closeImport() }}>
          <div className="modal" style={{textAlign:'center', padding: '40px'}}>
            <h3>Import Modal</h3>
            <p>Placeholder for import modal UI.</p>
            <button className="btn btn-outline" onClick={closeImport}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
