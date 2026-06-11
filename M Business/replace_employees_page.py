import sys

file_path = "src/components/SubAdminDashboard.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

start_marker = "function EmployeesPage({ employees, setEmployees }) {"
end_marker = "// MANAGERS PAGE"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    sys.exit(1)

new_employees_page = """function EmployeesPage({ employees, setEmployees }) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [viewEmp, setViewEmp] = useState(null);
  const [editEmp, setEditEmp] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErr, setEditErr] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [empDocs, setEmpDocs] = useState({});
  const [empDocsLoading, setEmpDocsLoading] = useState(false);

  const loadEmpDocs = async (emp) => {
    setEmpDocs({});
    setEmpDocsLoading(true);
    try {
      const r = await axios.get(`${BASE_URL}/api/employee-dashboard/documents/${encodeURIComponent(emp.name)}/all`);
      if (r.data?.success) {
        const dmap = {};
        r.data.documents.forEach(d => { dmap[d.documentType] = d; });
        setEmpDocs(dmap);
      }
    } catch(e) { console.error(e); }
    setEmpDocsLoading(false);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const filtered = employees.filter(e => {
    const mSearch = (e.name||"").toLowerCase().includes(search.toLowerCase()) || (e.email||"").toLowerCase().includes(search.toLowerCase()) || (e.role||"").toLowerCase().includes(search.toLowerCase());
    const mDept = deptFilter === "All Departments" || e.department === deptFilter;
    const mStatus = statusFilter === "All Status" || e.status === statusFilter;
    return mSearch && mDept && mStatus;
  });

  const getInitials = (n) => n ? n.split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2) : "?";

  const openEdit = (e) => {
    setEditForm({ name: e.name||"", email: e.email||"", phone: e.phone||"", role: e.role||"Employee", department: e.department||"", salary: e.salary||"", dateOfBirth: e.dateOfBirth?e.dateOfBirth.substring(0,10):"", joiningDate: e.joiningDate?e.joiningDate.substring(0,10):"", maritalStatus: e.maritalStatus||"Unmarried", status: e.status||"Pending", address: e.address||"", bankName: e.bankName||"", ifscCode: e.ifscCode||"", accountNumber: e.accountNumber||"" });
    setEditErr({}); setEditEmp(e);
  };
  const saveEdit = async () => {
    const errs = {};
    if (!editForm.name?.trim()) errs.name = "Name required";
    if (!editForm.email?.trim()) errs.email = "Email required";
    if (Object.keys(errs).length) { setEditErr(errs); return; }
    try {
      setSaving(true);
      const res = await axios.put(`${BASE_URL}/api/employees/${editEmp._id}`, editForm);
      setEmployees(prev => prev.map(e => e._id === editEmp._id ? { ...e, ...(res.data||editForm) } : e));
      setEditEmp(null); showToast("✅ Employee updated successfully!");
    } catch {
      setEmployees(prev => prev.map(e => e._id === editEmp._id ? { ...e, ...editForm } : e));
      setEditEmp(null); showToast("✅ Updated locally!");
    } finally { setSaving(false); }
  };
  const doDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/api/employees/${deleteTarget._id}`);
      setEmployees(p => p.filter(e => e._id !== deleteTarget._id));
      setDeleteTarget(null); showToast("🗑️ Employee deleted!");
    } catch {
      setEmployees(p => p.filter(e => e._id !== deleteTarget._id));
      setDeleteTarget(null); showToast("🗑️ Deleted locally!");
    }
  };

const res = await fetch(`/api/tasks?person=${encodeURIComponent(user.name)}`, {
  headers: { "x-company-id": user.companyId }
});
  const companyId = user?.companyId || user?.company || user?._id || user?.id || "";
  const onboardingLink = `${window.location.origin}/employee-onboarding?company=${encodeURIComponent(user.companyName || "Our Company")}&companyId=${companyId}`;
  const [linkCopied, setLinkCopied] = useState(false);
  const copyLink = () => { navigator.clipboard.writeText(onboardingLink); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); };

  if (viewEmp) {
    return <EmployeeDetail emp={viewEmp} onBack={() => setViewEmp(null)} onEdit={() => { setViewEmp(null); openEdit(viewEmp); }} onDelete={() => { setViewEmp(null); setDeleteTarget(viewEmp); }} empDocs={empDocs} empDocsLoading={empDocsLoading} />;
  }

  const activeCount = employees.filter(e => e.status === "Active" || e.status === "Approved").length;
  const leaveCount = employees.filter(e => e.status === "On Leave").length;
  const inactiveCount = employees.filter(e => e.status === "Inactive" || e.status === "Rejected").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {toast && <div className="toast show"><i className="ti ti-check"></i> {toast}</div>}

      {/* Share Onboarding Link Card (Kept as requested) */}
      <div style={{ background: "var(--app-sidebar)", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", boxShadow: "0 8px 24px rgba(59,7,100,0.2)", marginBottom: 6 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(var(--app-accent-rgb, 124, 58, 237),0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🔗</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Employee Onboarding Link</div>
          <div style={{ fontSize: 12, color: "#ffffff", fontFamily: "monospace", wordBreak: "break-all" }}>{onboardingLink}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={copyLink} style={{ background: linkCopied ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.15)", border: `1px solid ${linkCopied ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.3)"}`, borderRadius: 9, padding: "9px 16px", color: linkCopied ? "#4ade80" : "#ffffff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{linkCopied ? "✅ Copied!" : "📋 Copy Link"}</button>
          <button onClick={() => {
            const text = `Hi,\n\nPlease fill in your onboarding details at the following link to join our team:\n\n${onboardingLink}`;
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
          }} style={{ background: "#25D366", border: "none", borderRadius: 9, padding: "9px 16px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
            <span>💬</span> WhatsApp
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ width: 46, height: 46, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, background: "rgba(0,188,212,0.08)", color: "#00BCD4" }}><i className="ti ti-users"></i></div>
          <div><div style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{employees.length}</div><div style={{ fontSize: 11, color: "var(--text-soft)", marginTop: 3, fontWeight: 600 }}>Total Employees</div></div>
        </div>
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ width: 46, height: 46, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, background: "#dcfce7", color: "#16a34a" }}><i className="ti ti-check"></i></div>
          <div><div style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{activeCount}</div><div style={{ fontSize: 11, color: "var(--text-soft)", marginTop: 3, fontWeight: 600 }}>Active</div></div>
        </div>
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ width: 46, height: 46, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, background: "#fef3c7", color: "#d97706" }}><i className="ti ti-clock"></i></div>
          <div><div style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{leaveCount}</div><div style={{ fontSize: 11, color: "var(--text-soft)", marginTop: 3, fontWeight: 600 }}>On Leave</div></div>
        </div>
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ width: 46, height: 46, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, background: "#fee2e2", color: "#dc2626" }}><i className="ti ti-user-off"></i></div>
          <div><div style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{inactiveCount}</div><div style={{ fontSize: 11, color: "var(--text-soft)", marginTop: 3, fontWeight: 600 }}>Inactive</div></div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <i className="ti ti-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-soft)", fontSize: 16 }}></i>
          <input type="text" placeholder="Search by name, email, role..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", padding: "10px 12px 10px 38px", background: "#fff", border: "1.5px solid var(--border)", borderRadius: 8, fontFamily: "'Nunito',sans-serif", fontSize: 13, color: "var(--text)", outline: "none", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "#00BCD4"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ padding: "10px 32px 10px 12px", background: "#fff", border: "1.5px solid var(--border)", borderRadius: 8, fontFamily: "'Nunito',sans-serif", fontSize: 13, color: "var(--text-mid)", outline: "none", cursor: "pointer", WebkitAppearance: "none", backgroundImage: "url(\\\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\\\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
          <option>All Departments</option>
          <option>Development</option>
          <option>Design</option>
          <option>Marketing</option>
          <option>HR</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "10px 32px 10px 12px", background: "#fff", border: "1.5px solid var(--border)", borderRadius: 8, fontFamily: "'Nunito',sans-serif", fontSize: 13, color: "var(--text-mid)", outline: "none", cursor: "pointer", WebkitAppearance: "none", backgroundImage: "url(\\\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\\\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
          <option>All Status</option>
          <option value="Active">Active</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          <option value="On Leave">On Leave</option>
          <option value="Inactive">Inactive</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text)" }}>All Employees</div>
          <div style={{ background: "rgba(0,188,212,0.08)", color: "#00BCD4", fontSize: 11, fontWeight: 800, padding: "3px 12px", borderRadius: 20 }}>{filtered.length} employees</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead style={{ background: "#fafbfc" }}><tr>
              {["Employee", "Role", "Department", "Email", "Joined", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 10, fontWeight: 900, color: "var(--text-soft)", letterSpacing: 1.5, textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((e, i) => {
                const eid = e.employeeId || e._id?.substring(0,6).toUpperCase() || `EMP-${String(i+1).padStart(3,"0")}`;
                const jDate = e.joiningDate ? new Date(e.joiningDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "—";
                let st = e.status || "Pending";
                if(st === "Approved") st = "Active";
                if(st === "Rejected") st = "Inactive";
                let badgeClass = "badge";
                let badgeStyle = { display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 800 };
                if(st === "Active") { badgeStyle.background = "#dcfce7"; badgeStyle.color = "#16a34a"; }
                else if(st === "On Leave" || st === "Pending") { badgeStyle.background = "#fef3c7"; badgeStyle.color = "#d97706"; }
                else { badgeStyle.background = "#fee2e2"; badgeStyle.color = "#dc2626"; }
                const dotStyle = { width: 5, height: 5, borderRadius: "50%", background: "currentColor" };
                
                const avColors = ["linear-gradient(135deg,#00BCD4,#0097a7)", "linear-gradient(135deg,#7c3aed,#5b21b6)", "linear-gradient(135deg,#d97706,#b45309)", "linear-gradient(135deg,#16a34a,#15803d)", "linear-gradient(135deg,#dc2626,#991b1b)", "linear-gradient(135deg,#ec4899,#be185d)"];
                const avBg = avColors[i % avColors.length];
                
                return (
                  <tr key={e._id || i} style={{ cursor: "pointer", borderBottom: "1px solid var(--border)", transition: "background 0.12s" }} onMouseEnter={ev => ev.currentTarget.style.background = "#f8fbff"} onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "13px 16px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff", background: avBg }}>{getInitials(e.name)}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{e.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-soft)" }}>{eid}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px", verticalAlign: "middle" }}>
                      <span style={{ background: "#f1f5f9", color: "var(--text-mid)", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }}>{e.role || "Employee"}</span>
                    </td>
                    <td style={{ padding: "13px 16px", verticalAlign: "middle", fontSize: 12, color: "var(--text-mid)", fontWeight: 600 }}>{e.department || "—"}</td>
                    <td style={{ padding: "13px 16px", verticalAlign: "middle", fontSize: 13 }}>{e.email || "—"}</td>
                    <td style={{ padding: "13px 16px", verticalAlign: "middle", fontSize: 13 }}>{jDate}</td>
                    <td style={{ padding: "13px 16px", verticalAlign: "middle" }}>
                      <div style={badgeStyle}><div style={dotStyle}></div> {st}</div>
                    </td>
                    <td style={{ padding: "13px 16px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={(ev) => { ev.stopPropagation(); setViewEmp(e); loadEmpDocs(e); }} style={{ width: 30, height: 30, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", fontSize: 15, transition: "all 0.15s", background: "rgba(0,188,212,0.08)", color: "#00BCD4" }}><i className="ti ti-eye"></i></button>
                        <button onClick={(ev) => { ev.stopPropagation(); openEdit(e); }} style={{ width: 30, height: 30, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", fontSize: 15, transition: "all 0.15s", background: "#dbeafe", color: "#2563eb" }}><i className="ti ti-pencil"></i></button>
                        <button onClick={(ev) => { ev.stopPropagation(); setDeleteTarget(e); }} style={{ width: 30, height: 30, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", fontSize: 15, transition: "all 0.15s", background: "#fee2e2", color: "#dc2626" }}><i className="ti ti-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editEmp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,28,46,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", width: 490, maxWidth: "95vw", boxShadow: "0 24px 80px rgba(0,0,0,0.18)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: "var(--text)", marginBottom: 20 }}>Edit Employee</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 10, fontWeight: 900, color: "var(--text-soft)", letterSpacing: 1, textTransform: "uppercase" }}>Full Name</label>
                <input type="text" value={editForm.name} onChange={e => { setEditForm(p => ({ ...p, name: e.target.value })); setEditErr(p => ({ ...p, name: "" })); }} style={{ background: "#f8fafc", border: `1.5px solid ${editErr.name ? "#dc2626" : "var(--border)"}`, borderRadius: 8, padding: "9px 12px", fontFamily: "'Nunito',sans-serif", fontSize: 13, color: "var(--text)", outline: "none" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 10, fontWeight: 900, color: "var(--text-soft)", letterSpacing: 1, textTransform: "uppercase" }}>Email</label>
                <input type="text" value={editForm.email} onChange={e => { setEditForm(p => ({ ...p, email: e.target.value })); setEditErr(p => ({ ...p, email: "" })); }} style={{ background: "#f8fafc", border: `1.5px solid ${editErr.email ? "#dc2626" : "var(--border)"}`, borderRadius: 8, padding: "9px 12px", fontFamily: "'Nunito',sans-serif", fontSize: 13, color: "var(--text)", outline: "none" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 10, fontWeight: 900, color: "var(--text-soft)", letterSpacing: 1, textTransform: "uppercase" }}>Role</label>
                <input type="text" value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))} style={{ background: "#f8fafc", border: "1.5px solid var(--border)", borderRadius: 8, padding: "9px 12px", fontFamily: "'Nunito',sans-serif", fontSize: 13, color: "var(--text)", outline: "none" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 10, fontWeight: 900, color: "var(--text-soft)", letterSpacing: 1, textTransform: "uppercase" }}>Department</label>
                <input type="text" value={editForm.department} onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))} style={{ background: "#f8fafc", border: "1.5px solid var(--border)", borderRadius: 8, padding: "9px 12px", fontFamily: "'Nunito',sans-serif", fontSize: 13, color: "var(--text)", outline: "none" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
              <button onClick={() => setEditEmp(null)} style={{ background: "#f1f5f9", color: "var(--text-mid)", border: "none", padding: "9px 18px", borderRadius: 8, fontFamily: "'Nunito',sans-serif", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Cancel</button>
              <button onClick={saveEdit} style={{ background: "#00BCD4", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 8, fontFamily: "'Nunito',sans-serif", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>{saving ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,28,46,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", width: 400, boxShadow: "0 24px 80px rgba(0,0,0,0.18)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: "var(--text)", marginBottom: 12 }}>Delete Employee</div>
            <div style={{ fontSize: 13, color: "var(--text-mid)" }}>Are you sure you want to delete {deleteTarget.name}? This action cannot be undone.</div>
            <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteTarget(null)} style={{ background: "#f1f5f9", color: "var(--text-mid)", border: "none", padding: "9px 18px", borderRadius: 8, fontFamily: "'Nunito',sans-serif", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Cancel</button>
              <button onClick={doDelete} style={{ background: "#dc2626", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 8, fontFamily: "'Nunito',sans-serif", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"""

new_content = content[:start_idx] + new_employees_page + content[end_idx:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Done replacing EmployeesPage")
