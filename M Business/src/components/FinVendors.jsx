import React, { useState } from 'react';

export default function FinVendors() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);

  const openImport = () => setIsImportModalOpen(true);
  const closeImport = () => setIsImportModalOpen(false);

  const saveVendor = () => {
    setIsAddVendorModalOpen(false);
    alert('Vendor added!');
  };

  const openVendor = () => alert('Opening vendor details');

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
.kpi.vendor{border-left-color:var(--purple);}
.kpi.pending{border-left-color:var(--orange);}
.kpi.expense{border-left-color:var(--red);}
.kpi.income{border-left-color:var(--green);}
.kpi-label{font-size:11px;font-weight:800;color:var(--text-light);text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px;}
.kpi-value{font-size:24px;font-weight:900;color:var(--text-dark);margin-bottom:4px;}
.kpi-sub{font-size:12px;font-weight:600;display:flex;align-items:center;gap:4px;}
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
          <div className="breadcrumb"><a href="#">Finance</a><i className="ti ti-chevron-right"></i><span>Vendors</span></div>
          <div className="topbar-actions">
            <button className="btn btn-outline" onClick={openImport} style={{borderColor:'var(--primary)',color:'var(--primary)'}}><i className="ti ti-upload"></i>Import Statement</button>
            <button className="btn btn-outline"><i className="ti ti-arrow-bar-up"></i>Pay a Vendor</button>
            <button className="btn btn-primary" onClick={() => setIsAddVendorModalOpen(true)}><i className="ti ti-plus"></i>Add Vendor</button>
          </div>
        </div>
        <div className="content">
          <div className="kpi-grid kpi-grid-4">
            <div className="kpi vendor"><div className="kpi-label">Total Vendors</div><div className="kpi-value">14</div><div className="kpi-sub neutral"><i className="ti ti-truck"></i>Active suppliers</div></div>
            <div className="kpi pending"><div className="kpi-label">Total Payable</div><div className="kpi-value">₹1,45,000</div><div className="kpi-sub down"><i className="ti ti-alert-circle"></i>2 overdue</div></div>
            <div className="kpi expense"><div className="kpi-label">Paid This Month</div><div className="kpi-value">₹88,000</div><div className="kpi-sub neutral"><i className="ti ti-check"></i>6 payments</div></div>
            <div className="kpi income"><div className="kpi-label">YTD Vendor Spend</div><div className="kpi-value">₹7,82,000</div><div className="kpi-sub neutral"><i className="ti ti-calendar"></i>FY 2025-26</div></div>
          </div>
          <div className="toolbar">
            <div className="search-box"><i className="ti ti-search"></i><input placeholder="Search vendors..." /></div>
            <select className="filter-sel"><option>All Categories</option><option>IT & Software</option><option>Design</option></select>
            <select className="filter-sel"><option>All Status</option><option>Active</option><option>Inactive</option></select>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Vendor Name</th><th>Category</th><th>Contact</th><th>GST No.</th><th>Total Paid (YTD)</th><th>Outstanding</th><th>Last Payment</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr>
                    <td><div style={{display:'flex',alignItems:'center',gap:'10px'}}><div className="av av-sm" style={{background:'var(--primary)',borderRadius:'8px'}}>AW</div><div><div style={{fontWeight:700}}>Amazon Web Services</div><div style={{fontSize:'11px',color:'var(--text-light)'}}>Cloud & Hosting</div></div></div></td>
                    <td><span style={{background:'var(--primary-light)',color:'var(--primary-dark)',padding:'2px 8px',borderRadius:'20px',fontSize:'11px',fontWeight:700}}>Infrastructure</span></td>
                    <td><div style={{fontSize:'12px'}}>aws-billing@amazon.com</div></td>
                    <td style={{fontSize:'12px',color:'var(--text-light)'}}>N/A (Foreign)</td>
                    <td className="amt-out">₹5,04,000</td>
                    <td className="amt-neutral">₹0</td>
                    <td style={{fontSize:'12px'}}>Jun 4, 2026</td>
                    <td><span className="badge badge-paid">Active</span></td>
                    <td><div style={{display:'flex',gap:'5px'}}><button className="btn btn-outline btn-sm" onClick={openVendor}><i className="ti ti-eye"></i></button></div></td>
                  </tr>
                  <tr>
                    <td><div style={{display:'flex',alignItems:'center',gap:'10px'}}><div className="av av-sm" style={{background:'var(--purple)',borderRadius:'8px'}}>DP</div><div><div style={{fontWeight:700}}>DesignPro Studio</div><div style={{fontSize:'11px',color:'var(--text-light)'}}>Freelance Design</div></div></div></td>
                    <td><span style={{background:'var(--purple-light)',color:'var(--purple)',padding:'2px 8px',borderRadius:'20px',fontSize:'11px',fontWeight:700}}>Design</span></td>
                    <td><div style={{fontSize:'12px'}}>hello@designpro.in</div></td>
                    <td style={{fontSize:'12px',color:'var(--text-light)'}}>29ABCDE1234F1Z5</td>
                    <td className="amt-out">₹96,000</td>
                    <td className="amt-out" style={{color:'var(--orange)'}}>₹38,000</td>
                    <td style={{fontSize:'12px'}}>May 15, 2026</td>
                    <td><span className="badge badge-pending">Pending</span></td>
                    <td><div style={{display:'flex',gap:'5px'}}><button className="btn btn-outline btn-sm"><i className="ti ti-eye"></i></button><button className="btn btn-green btn-sm"><i className="ti ti-cash"></i>Pay</button></div></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className={`modal-bg ${isAddVendorModalOpen ? 'open' : ''}`} onClick={(e) => { if(e.target.className.includes('modal-bg')) setIsAddVendorModalOpen(false) }}>
        <div className="modal">
          <div className="modal-title"><i className="ti ti-truck"></i>Add Vendor</div>
          <div className="form-2col">
            <div className="form-group"><label>Vendor Name *</label><input placeholder="Company or individual name" /></div>
            <div className="form-group"><label>Category</label><select><option>IT & Software</option><option>Design</option></select></div>
          </div>
          <div className="form-2col">
            <div className="form-group"><label>Contact Email</label><input type="email" placeholder="billing@vendor.com" /></div>
            <div className="form-group"><label>Phone</label><input placeholder="+91 98765 43210" /></div>
          </div>
          <div className="form-2col">
            <div className="form-group"><label>GST Number</label><input placeholder="29ABCDE1234F1Z5" /></div>
            <div className="form-group"><label>PAN Number</label><input placeholder="ABCDE1234F" /></div>
          </div>
          <div className="form-group"><label>Address</label><textarea placeholder="Vendor address..." style={{minHeight:'70px'}}></textarea></div>
          <div className="form-2col">
            <div className="form-group"><label>Bank Account No.</label><input placeholder="For direct payments" /></div>
            <div className="form-group"><label>IFSC Code</label><input placeholder="e.g. HDFC0001234" /></div>
          </div>
          <div className="form-group"><label>Payment Terms</label><select><option>Net 15</option><option>Net 30</option></select></div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={() => setIsAddVendorModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveVendor}><i className="ti ti-check"></i>Save Vendor</button>
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