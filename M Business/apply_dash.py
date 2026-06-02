import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

start_idx = text.find('{/* Top Section: Company Info & Stats Grid */}')
end_idx = text.find('{validActive === ', start_idx)
close_idx = text.rfind('</>)}', start_idx, end_idx)

NEW_JSX = """
              {/* MODERN DASHBOARD CONTENT */}
              <div className="modern-dash-topbar">
                <div className="search-wrap">
                  <i className="ti ti-search"></i>
                  <input type="text" placeholder="Search projects, invoices, clients..." />
                </div>
                <button className="create-btn" onClick={() => setActive("projects")}><i className="ti ti-plus" style={{fontSize:15}}></i> Create New</button>
              </div>

              <div className="modern-dash-content">
                {/* LEFT COL */}
                <div className="col-left">
                  {/* STORAGE / PLATFORM CARDS */}
                  <div className="storage-row">
                    <div className="storage-card active-card">
                      <div className="storage-card-top">
                        <div className="storage-icon teal"><i className="ti ti-briefcase"></i></div>
                        <div>
                          <div className="storage-name white">Active Projects</div>
                          <div className="storage-sub white">Open folder</div>
                        </div>
                      </div>
                      <div className="storage-sizes white"><span>{projects.length} Projects</span><span>{projects.length} Total</span></div>
                      <div className="storage-bar white-bg"><div className="storage-fill white" style={{width: "67%"}}></div></div>
                      <div className="storage-date white"><i className="ti ti-clock" style={{fontSize: 11}}></i> Last update</div>
                    </div>
                    <div className="storage-card" onClick={() => setActive("invoices")}>
                      <div className="storage-card-top">
                        <div className="storage-icon dropbox"><i className="ti ti-receipt-2"></i></div>
                        <div>
                          <div className="storage-name dark">Invoices</div>
                          <div className="storage-sub muted">Open folder</div>
                        </div>
                      </div>
                      <div className="storage-sizes dark"><span>{invoices.length} Pending</span><span>{invoices.length} Total</span></div>
                      <div className="storage-bar gray-bg"><div className="storage-fill teal" style={{width: "40%"}}></div></div>
                      <div className="storage-date muted"><i className="ti ti-clock" style={{fontSize: 11}}></i> Last update</div>
                    </div>
                    <div className="storage-card" onClick={() => setActive("invoices")}>
                      <div className="storage-card-top">
                        <div className="storage-icon revenue"><i className="ti ti-cash"></i></div>
                        <div>
                          <div className="storage-name dark">Revenue</div>
                          <div className="storage-sub muted">Open folder</div>
                        </div>
                      </div>
                      <div className="storage-sizes dark"><span>₹{totalIncome || 0}</span><span>₹{totalIncome || 0}</span></div>
                      <div className="storage-bar gray-bg"><div className="storage-fill teal" style={{width: "42%"}}></div></div>
                      <div className="storage-date muted"><i className="ti ti-clock" style={{fontSize: 11}}></i> Last update</div>
                    </div>
                  </div>

                  {/* TEAM / CO-OWNERS */}
                  <div>
                    <div className="section-header">
                      <span className="section-title">Team Members</span>
                      <div className="section-more" onClick={() => setActive("employees")}><i className="ti ti-dots"></i></div>
                    </div>
                    <div className="coowners-row">
                      {employees.slice(0,4).map(e => (
                        <div key={e.id} className="coowner">
                          <div className="coowner-avatar">{e.name?.[0]?.toUpperCase() || "E"}</div>
                          <div>
                            <div className="coowner-name">{e.name}</div>
                            <div className="coowner-role">{e.role}</div>
                          </div>
                        </div>
                      ))}
                      {employees.length === 0 && <div style={{color:"var(--app-muted)", fontSize: 13}}>No employees added yet.</div>}
                    </div>
                  </div>

                  {/* FOLDERS */}
                  <div>
                    <div className="section-header">
                      <span className="section-title">Projects</span>
                      <div className="section-more" onClick={() => setActive("projects")}><i className="ti ti-dots"></i></div>
                    </div>
                    <div className="folders-grid">
                      {projects.slice(0,3).map(p => (
                        <div key={p.id} className="folder-card" onClick={() => setActive("projects")}>
                          <div className="folder-top">
                            <div className="folder-avatars">
                               <div className="fa">{p.title?.[0]?.toUpperCase() || "P"}</div>
                            </div>
                            <i className="ti ti-dots folder-more"></i>
                          </div>
                          <div className="folder-icon"><i className="ti ti-folder-filled"></i></div>
                          <div className="folder-name">{p.title}</div>
                          <div className="folder-date"><i className="ti ti-clock" style={{fontSize: 11}}></i> {p.status || "Active"}</div>
                        </div>
                      ))}
                      {projects.length === 0 && <div style={{color:"var(--app-muted)", fontSize: 13}}>No projects added yet.</div>}
                    </div>
                  </div>

                  {/* FILE TABLE */}
                  <div>
                    <div className="section-header">
                      <span className="section-title">Recent Files</span>
                      <div className="section-more" onClick={() => setActive("invoices")}><i className="ti ti-dots"></i></div>
                    </div>
                    <div className="table-panel">
                      <table className="dash-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th>Type</th>
                            <th>Document Name</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.slice(0,4).map(inv => (
                            <tr key={inv.id}>
                              <td><input type="checkbox" className="cb" /></td>
                              <td><div className="file-type-icon doc"><i className="ti ti-file-text"></i></div></td>
                              <td className="fname">{inv.invoiceNo || "Invoice"} — {inv.clientName}</td>
                              <td>₹{inv.grandTotal || 0}</td>
                              <td>{inv.date}</td>
                              <td><Badge label={inv.status || "Pending"} /></td>
                              <td><i className="ti ti-dots-vertical row-actions"></i></td>
                            </tr>
                          ))}
                          {invoices.length === 0 && <tr><td colSpan="7" style={{textAlign:"center", padding:20}}>No recent invoices.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* RIGHT COL */}
                <div className="col-right">
                  {/* DRIVE STORAGE PANEL */}
                  <div className="drive-panel">
                    <div className="drive-header">
                      <div className="drive-icon"><i className="ti ti-briefcase" style={{color: "var(--app-accent)", fontSize: 15}}></i></div>
                      <span className="drive-title">Overview</span>
                    </div>
                    <div className="drive-total"><span>{projects.length} Active</span><span>{projects.length} Total</span></div>
                    <div className="drive-main-bar"><div className="drive-main-fill" style={{width: "67%"}}></div></div>

                    <div className="file-type-row">
                      <div className="ft-item" onClick={() => setActive("projects")} style={{cursor:"pointer"}}>
                        <div className="ft-icon" style={{background: "#E8F3FF", color: "#0061FF"}}><i className="ti ti-world"></i></div>
                        <div style={{flex: 1}}>
                          <div style={{display: "flex", justifyContent: "space-between"}}><span className="ft-name">Projects</span><span className="ft-size">{projects.length}</span></div>
                          <div className="ft-bar" style={{background: "#0061FF", width: "70%"}}></div>
                        </div>
                      </div>
                      <div className="ft-item" onClick={() => setActive("employees")} style={{cursor:"pointer"}}>
                        <div className="ft-icon" style={{background: "#E8FAF3", color: "#26C281"}}><i className="ti ti-users"></i></div>
                        <div style={{flex: 1}}>
                          <div style={{display: "flex", justifyContent: "space-between"}}><span className="ft-name">Employees</span><span className="ft-size">{employees.length}</span></div>
                          <div className="ft-bar" style={{background: "#26C281", width: "35%"}}></div>
                        </div>
                      </div>
                      <div className="ft-item" onClick={() => setActive("clients")} style={{cursor:"pointer"}}>
                        <div className="ft-icon" style={{background: "#FEF5E6", color: "#F5A623"}}><i className="ti ti-building"></i></div>
                        <div style={{flex: 1}}>
                          <div style={{display: "flex", justifyContent: "space-between"}}><span className="ft-name">Clients</span><span className="ft-size">{clients.length}</span></div>
                          <div className="ft-bar" style={{background: "#F5A623", width: "50%"}}></div>
                        </div>
                      </div>
                      <div className="ft-item" onClick={() => setActive("invoices")} style={{cursor:"pointer"}}>
                        <div className="ft-icon" style={{background: "#EEE9FF", color: "#7C5CFC"}}><i className="ti ti-receipt-2"></i></div>
                        <div style={{flex: 1}}>
                          <div style={{display: "flex", justifyContent: "space-between"}}><span className="ft-name">Invoices</span><span className="ft-size">{invoices.length}</span></div>
                          <div className="ft-bar" style={{background: "#7C5CFC", width: "20%"}}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QUICK STATS */}
                  <div className="stats-grid">
                    <div className="mini-stat">
                      <div className="mini-stat-icon" style={{background: "rgba(var(--app-accent-rgb,0,188,212),0.1)", color: "var(--app-accent)"}}><i className="ti ti-cash"></i></div>
                      <div className="mini-stat-val">₹{totalIncome || 0}</div>
                      <div className="mini-stat-label">Income</div>
                    </div>
                    <div className="mini-stat">
                      <div className="mini-stat-icon" style={{background: "#FEF2F2", color: "#F05C5C"}}><i className="ti ti-chart-pie"></i></div>
                      <div className="mini-stat-val">₹{totalExpenses || 0}</div>
                      <div className="mini-stat-label">Expenses</div>
                    </div>
                    <div className="mini-stat">
                      <div className="mini-stat-icon" style={{background: "#E8FAF3", color: "#26C281"}}><i className="ti ti-users"></i></div>
                      <div className="mini-stat-val">{employees.length}</div>
                      <div className="mini-stat-label">Employees</div>
                    </div>
                    <div className="mini-stat">
                      <div className="mini-stat-icon" style={{background: "#FEF5E6", color: "#F5A623"}}><i className="ti ti-building"></i></div>
                      <div className="mini-stat-val">{clients.length}</div>
                      <div className="mini-stat-label">Clients</div>
                    </div>
                  </div>

                  {/* CLEAR MEMORY */}
                  <div className="clear-panel">
                    <div className="clear-icon"><i className="ti ti-refresh"></i></div>
                    <div className="clear-text">Clear <strong>₹0.00</strong> in pending expense entries from temporary records</div>
                    <button className="clear-btn"><i className="ti ti-trash" style={{fontSize: 13}}></i> CLEAR RECORDS</button>
                  </div>
                </div>
              </div>
"""

new_text = text[:start_idx] + NEW_JSX + text[close_idx:]
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "w", encoding="utf-8") as f:
    f.write(new_text)

print("Injected modern dashboard HTML")
