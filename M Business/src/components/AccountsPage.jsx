// ════════════════════════════════════════════════════════════
//  AccountsPage.jsx  —  Drop-in component for Dashboard.jsx
//  Usage:  import AccountsPage from "./AccountsPage";
//  JSX:    {validActive === "accounts" && <AccountsPage />}
// ════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import axios from "axios";

const T   = { text:"#1e0a3c", muted:"#7c3aed", border:"#ede9fe" };
const API = "http://localhost:5000/api/accounts";
const ROLES   = ["Client","Employee","Manager","Admin","SubAdmin"];
const STATUSES = ["Active","Inactive"];

const EMPTY = { name:"", email:"", phone:"", role:"Client", status:"Active", notes:"" };

const ROLE_COLOR = {
  Client:"#9333ea", Employee:"#c084fc", Manager:"#f59e0b",
  Admin:"#7c3aed", SubAdmin:"#a855f7"
};
const STATUS_COLOR = { Active:"#22C55E", Inactive:"#EF4444" };

function Badge({ label }) {
  const c = ROLE_COLOR[label] || STATUS_COLOR[label] || "#9333ea";
  return (
    <span style={{ background:`${c}18`, color:c, border:`1px solid ${c}33`,
      padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>
      {label}
    </span>
  );
}

function Fld({ label, value, onChange, options, type="text", error, placeholder }) {
  const s = { width:"100%", border:`1.5px solid ${error?"#EF4444":"#ede9fe"}`,
    borderRadius:10, padding:"10px 14px", fontSize:13, color:T.text,
    background:"#faf5ff", boxSizing:"border-box", outline:"none", fontFamily:"inherit" };
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:11, color:"#7c3aed", fontWeight:700,
        letterSpacing:0.5, marginBottom:5 }}>{label.toUpperCase()}</label>
      {options
        ? <select value={value} onChange={e=>onChange(e.target.value)} style={s}>
            {options.map(o=><option key={o}>{o}</option>)}
          </select>
        : <input type={type} value={value} onChange={e=>onChange(e.target.value)}
            style={s} placeholder={placeholder||""} />}
      {error && <div style={{ fontSize:11, color:"#EF4444", marginTop:4 }}>⚠️ {error}</div>}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(59,7,100,0.55)",
      backdropFilter:"blur(8px)", zIndex:1000, display:"flex",
      alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:720,
        maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column",
        boxShadow:"0 32px 80px rgba(147,51,234,0.25)" }}>
        <div style={{ padding:"16px 22px", borderBottom:"1px solid #ede9fe",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          background:"linear-gradient(90deg,#f5f3ff,#faf5ff)", flexShrink:0 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:T.text }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none", border:"none",
            fontSize:20, cursor:"pointer", color:"#7c3aed", padding:"4px 8px" }}>✕</button>
        </div>
        <div style={{ overflowY:"auto", padding:"20px 22px", flex:1 }}>{children}</div>
      </div>
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, background:"#fff",
      border:"1.5px solid #22c55e", borderRadius:12, padding:"12px 20px",
      fontSize:13, fontWeight:700, color:"#22c55e",
      boxShadow:"0 8px 24px rgba(0,0,0,0.12)" }}>{msg}</div>
  );
}

// ── MAIN COMPONENT ───────────────────────────────────────────
export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [modal,    setModal]    = useState(null);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [err,      setErr]      = useState({});
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState("");

  useEffect(() => { fetchAccounts(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API);
      setAccounts(res.data);
    } catch { setAccounts([]); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setForm(EMPTY); setErr({}); setEditId(null); setModal("add");
  };

  const openEdit = (a) => {
    setForm({ name:a.name||"", email:a.email||"", phone:a.phone||"",
      role:a.role||"Client", status:a.status||"Active", notes:a.notes||"" });
    setEditId(a._id||a.id); setErr({}); setModal("edit");
  };

  const save = async () => {
    const errs = {};
    if (!form.name.trim())  errs.name  = "Name required";
    if (!form.email.trim()) errs.email = "Email required";
    if (Object.keys(errs).length) { setErr(errs); return; }
    try {
      setSaving(true);
      if (modal === "add") {
        const res = await axios.post(API, form);
        setAccounts(prev => [res.data, ...prev]);
      } else {
        const res = await axios.put(`${API}/${editId}`, form);
        setAccounts(prev => prev.map(a => (a._id||a.id)===editId ? res.data : a));
      }
      showToast(modal==="add" ? "✅ Account added!" : "✅ Account updated!");
      setModal(null);
    } catch (e) {
      setErr({ email: e.response?.data?.msg || "Failed to save" });
    } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this account?")) return;
    try { await axios.delete(`${API}/${id}`); } catch {}
    setAccounts(prev => prev.filter(a => (a._id||a.id) !== id));
    showToast("🗑️ Deleted!");
  };

  // ── filtered ─────────────────────────────────────────────
  const displayed = accounts.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (a.name||"").toLowerCase().includes(q) ||
      (a.email||"").toLowerCase().includes(q) ||
      (a.role||"").toLowerCase().includes(q);
    const matchRole = roleFilter === "All" || a.role === roleFilter;
    return matchSearch && matchRole;
  });

  const stats = [
    { t:"Total Accounts", v:accounts.length,                                c:"#9333ea", i:"👤" },
    { t:"Active",         v:accounts.filter(a=>a.status==="Active").length, c:"#22C55E", i:"✅" },
    { t:"Inactive",       v:accounts.filter(a=>a.status==="Inactive").length,c:"#EF4444",i:"⛔" },
    { t:"Roles",          v:[...new Set(accounts.map(a=>a.role))].length,   c:"#f59e0b", i:"🎭" },
  ];

  const BtnPrimary = {
    background:"linear-gradient(135deg,#7c3aed,#9333ea)", color:"#fff",
    border:"none", borderRadius:10, padding:"8px 16px",
    fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit"
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <Toast msg={toast} />

      {/* ── Stats ── */}
      <div className="dash-stats"
        style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {stats.map(({ t,v,i,c }) => (
          <div key={t} style={{ background:"#fff", borderRadius:14, padding:"16px 14px",
            boxShadow:"0 4px 18px rgba(147,51,234,0.07)", border:"1px solid #ede9fe" }}>
            <div style={{ width:38, height:38, borderRadius:10, background:`${c}15`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:17, marginBottom:8 }}>{i}</div>
            <div style={{ fontSize:10, color:"#a78bfa", fontWeight:700,
              letterSpacing:0.5, marginBottom:2 }}>{t.toUpperCase()}</div>
            <div style={{ fontSize:24, fontWeight:800, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* ── Role breakdown cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10 }}>
        {ROLES.map(role => {
          const count = accounts.filter(a=>a.role===role).length;
          const c = ROLE_COLOR[role] || "#9333ea";
          return (
            <div key={role} onClick={()=>setRoleFilter(roleFilter===role?"All":role)}
              style={{ background: roleFilter===role ? `${c}15` : "#fff",
                border:`1.5px solid ${roleFilter===role ? c : "#ede9fe"}`,
                borderRadius:12, padding:"12px 14px", cursor:"pointer",
                textAlign:"center", transition:"all 0.2s" }}>
              <div style={{ fontSize:20, fontWeight:800, color:c }}>{count}</div>
              <div style={{ fontSize:11, color: roleFilter===role ? c : "#a78bfa",
                fontWeight:700, marginTop:2 }}>{role}s</div>
            </div>
          );
        })}
      </div>

      {/* ── Table ── */}
      <div style={{ background:"#fff", borderRadius:16, padding:22,
        boxShadow:"0 4px 24px rgba(147,51,234,0.08)", border:"1px solid #ede9fe" }}>
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8 }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:T.text }}>
            All Accounts ({displayed.length})
          </h3>
          <button onClick={openAdd} style={BtnPrimary}>+ Add Account</button>
        </div>

        {/* Search */}
        <div style={{ position:"relative", marginBottom:16 }}>
          <span style={{ position:"absolute", left:14, top:"50%",
            transform:"translateY(-50%)", pointerEvents:"none" }}>🔍</span>
          <input placeholder="Search by name, email, role..."
            value={search} onChange={e=>setSearch(e.target.value)}
            style={{ width:"100%", padding:"10px 14px 10px 40px",
              border:"1.5px solid #ede9fe", borderRadius:10, fontSize:13,
              color:T.text, background:"#faf5ff", outline:"none",
              fontFamily:"inherit" }} />
        </div>

        {loading
          ? <div style={{ textAlign:"center", padding:50, color:"#a78bfa" }}>Loading...</div>
          : displayed.length === 0
            ? <div style={{ textAlign:"center", padding:50 }}>
                <div style={{ fontSize:40, marginBottom:12 }}>👤</div>
                <div style={{ color:"#a78bfa", fontSize:14, fontWeight:600 }}>No accounts found</div>
              </div>
            : <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse",
                  fontSize:13, minWidth:700 }}>
                  <thead>
                    <tr style={{ background:"linear-gradient(90deg,#f5f3ff,#faf5ff)" }}>
                      {["ID","Name","Email","Phone","Role","Status","Joined","Actions"].map(col => (
                        <th key={col} style={{ padding:"10px 14px", textAlign:"left",
                          color:"#7c3aed", fontWeight:700, fontSize:11,
                          borderBottom:"2px solid #ede9fe", whiteSpace:"nowrap" }}>
                          {col.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((a, i) => (
                      <tr key={a._id||i}
                        style={{ borderBottom:"1px solid #f3f0ff" }}
                        onMouseEnter={e=>e.currentTarget.style.background="#faf5ff"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <td style={{ padding:"12px 14px", fontFamily:"monospace",
                          fontSize:11, color:"#a78bfa" }}>
                          {`ACC${String(i+1).padStart(3,"0")}`}
                        </td>
                        <td style={{ padding:"12px 14px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:30, height:30, borderRadius:"50%",
                              background:`linear-gradient(135deg,${ROLE_COLOR[a.role]||"#9333ea"},#c084fc)`,
                              display:"flex", alignItems:"center", justifyContent:"center",
                              color:"#fff", fontSize:11, fontWeight:700, flexShrink:0 }}>
                              {(a.name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight:700, color:T.text }}>{a.name}</div>
                              {a.notes && <div style={{ fontSize:11, color:"#a78bfa" }}>{a.notes}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"12px 14px", color:T.text }}>{a.email}</td>
                        <td style={{ padding:"12px 14px", color:"#a78bfa" }}>{a.phone||"—"}</td>
                        <td style={{ padding:"12px 14px" }}><Badge label={a.role||"Client"} /></td>
                        <td style={{ padding:"12px 14px" }}><Badge label={a.status||"Active"} /></td>
                        <td style={{ padding:"12px 14px", color:"#a78bfa", fontSize:12 }}>
                          {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td style={{ padding:"12px 14px" }}>
                          <div style={{ display:"flex", gap:5 }}>
                            <button onClick={()=>openEdit(a)}
                              style={{ background:"#f5f3ff", border:"1px solid #ede9fe",
                                borderRadius:7, padding:"4px 10px", fontSize:12,
                                color:"#7c3aed", cursor:"pointer", fontWeight:600 }}>Edit</button>
                            <button onClick={()=>del(a._id||a.id)}
                              style={{ background:"#fee2e2", border:"1px solid #fecaca",
                                borderRadius:7, padding:"4px 10px", fontSize:12,
                                color:"#ef4444", cursor:"pointer", fontWeight:600 }}>Del</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        }
      </div>

      {/* ── Modal ── */}
      {modal && (
        <Modal title={modal==="add" ? "Add New Account" : "Edit Account"}
          onClose={()=>setModal(null)}>
          <div className="modal-2col"
            style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 18px" }}>
            <Fld label="Full Name *" value={form.name}
              onChange={v=>{setForm({...form,name:v});setErr(p=>({...p,name:""}));}}
              error={err.name} />
            <Fld label="Email *" value={form.email} type="email"
              onChange={v=>{setForm({...form,email:v});setErr(p=>({...p,email:""}));}}
              error={err.email} />
            <Fld label="Phone" value={form.phone}
              onChange={v=>setForm({...form,phone:v})} />
            <Fld label="Role" value={form.role}
              onChange={v=>setForm({...form,role:v})} options={ROLES} />
            <Fld label="Status" value={form.status}
              onChange={v=>setForm({...form,status:v})} options={STATUSES} />
            <Fld label="Notes" value={form.notes}
              onChange={v=>setForm({...form,notes:v})}
              placeholder="Optional notes..." />
          </div>

          {/* Preview card */}
          {form.name && (
            <div style={{ background:"linear-gradient(135deg,#f5f3ff,#faf5ff)",
              borderRadius:12, padding:"14px 16px", border:"1px solid #ede9fe",
              marginBottom:14, display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:"50%",
                background:`linear-gradient(135deg,${ROLE_COLOR[form.role]||"#9333ea"},#c084fc)`,
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"#fff", fontSize:14, fontWeight:800, flexShrink:0 }}>
                {form.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight:700, color:T.text }}>{form.name}</div>
                <div style={{ fontSize:12, color:"#a78bfa", marginTop:2 }}>
                  {form.email} · <Badge label={form.role} /> · <Badge label={form.status} />
                </div>
              </div>
            </div>
          )}

          <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:4 }}>
            <button onClick={()=>setModal(null)}
              style={{ background:"#f5f3ff", border:"1px solid #ede9fe", color:T.text,
                borderRadius:10, padding:"10px 16px", cursor:"pointer",
                fontWeight:600, fontSize:13 }}>Cancel</button>
            <button onClick={save} disabled={saving}
              style={{ background:"linear-gradient(135deg,#7c3aed,#9333ea)", color:"#fff",
                border:"none", borderRadius:10, padding:"10px 20px", fontWeight:700,
                fontSize:13, cursor:"pointer", opacity:saving?0.7:1 }}>
              {saving ? "Saving…" : modal==="add" ? "Save Account →" : "Update Account →"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
