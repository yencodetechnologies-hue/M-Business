import { useState, useEffect, useRef } from "react";
import React from "react";
import axios from "axios";
import { BASE_URL } from "../config";
import InvoiceCreator from "./InvoiceCreator";
import TaskPage from "./TaskPage";
import CalendarPage from "./CalendarPage";
import QuotationCreator   from "./QuotationCreator";
import ProjectProposalCreator from "./ProjectProposalCreator";
import AccountsPage, { ExpensesPage, IncomePage } from "./AccountsPage";
import AdminProposalManagement from "./AdminProposalManagement";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { QRCodeSVG } from "qrcode.react";
import { SubAdminDocumentsPage } from "./EmployeeProfilePanel";
import { DOC_TYPES } from "./EmployeeProfilePanel";
import ReportsPage from "./ReportsPage";
import MessagingPage from "./MessagingPage";
import SettingsPage from "./SettingsPage";


const T={primary:"#3b0764",sidebar:"#1e0a3c",accent:"#9333ea",bg:"#f5f3ff",card:"#FFFFFF",text:"#1e0a3c",muted:"#7c3aed",border:"#ede9fe"};
const TRACKING_SEED=[{id:"PRJ001",name:"Website Redesign",client:"TechNova Pvt Ltd",deadline:"2024-05-30",pct:65,status:"In Progress",note:"Design done, dev ongoing"},{id:"PRJ002",name:"Mobile App Dev",client:"Bloom Creatives",deadline:"2024-08-15",pct:15,status:"Pending",note:"Requirements gathering"},{id:"PRJ003",name:"ERP Integration",client:"Infra Solutions",deadline:"2024-04-30",pct:100,status:"Completed",note:"Signed off by client"}];
const INVOICES=[{id:"INV001",client:"TechNova Pvt Ltd",project:"Website Redesign",date:"2024-04-01",due:"2024-04-30",total:"₹1,47,500",status:"Paid"},{id:"INV002",client:"Infra Solutions",project:"ERP Integration",date:"2024-05-01",due:"2024-05-15",total:"₹4,24,800",status:"Overdue"},{id:"INV003",client:"Bloom Creatives",project:"Mobile App Dev",date:"2024-05-10",due:"2024-06-10",total:"₹1,18,000",status:"Pending"}];

const NAV=[
  {key:"dashboard",icon:"🏠",label:"Dashboard"},
  {key:"clients",icon:"👥",label:"Clients"},
  {key:"employees",icon:"👨‍💼",label:"Employees"},
  {key:"managers",icon:"🧑‍💼",label:"Managers"},
  {key:"projects",icon:"📁",label:"Projects"},
  {key:"quotations",icon:"📋",label:"Quotations"},
  {key:"proposals",icon:"🎨",label:"Project Proposals"},
  {key:"invoices",icon:"🧾",label:"Invoices"},
  {key:"tracking",icon:"📊",label:"Project Status"},
  {key:"tasks",icon:"✅",label:"Tasks"},
  {key:"calendar",icon:"📅",label:"Calendar"},
  {key:"messaging",icon:"💬",label:"Messages"},
  {key:"settings",icon:"⚙️",label:"Settings"},
  {key:"accounts",icon:"👤",label:"Accounts"},

  {key:"expenses",icon:"💸",label:"Client Expenses"},

  {key:"interviews",icon:"🎯",label:"Interviews"},
  {key:"reports",icon:"📈",label:"Reports"}
];

function getNavForRole(role){
  const r=(role||"").toLowerCase().trim();
  if(r==="subadmin"||r==="sub_admin"||r==="sub-admin")
    return NAV.filter(n=>["dashboard","clients","projects","invoices","tracking","tasks","calendar","income","expenses","interviews","reports","messaging","settings"].includes(n.key));
  if(r==="manager")
    return NAV.filter(n=>["dashboard","employees","projects","tracking","tasks","calendar","interviews","reports","messaging"].includes(n.key));
  if(r==="employee")
    return NAV.filter(n=>["dashboard","tasks","calendar","messaging"].includes(n.key));
  return NAV;
}

const sc=s=>({Active:"#22C55E",Inactive:"#EF4444","In Progress":"#9333ea",Pending:"#F59E0B",Completed:"#22C55E","On Hold":"#a855f7",Sent:"#9333ea",Approved:"#22C55E",Rejected:"#EF4444",Paid:"#22C55E",Overdue:"#EF4444",Client:"#9333ea",Employee:"#c084fc",Manager:"#f59e0b",pending:"#F59E0B",hired:"#22C55E",rejected:"#EF4444"}[s]||"#a855f7");

function Badge({label}){const c=sc(label);return <span style={{background:`${c}18`,color:c,border:`1px solid ${c}33`,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>{label}</span>;}

function SC({title,children,action}){
  return(
    <div style={{background:"#fff",borderRadius:16,padding:22,boxShadow:"0 4px 24px rgba(147,51,234,0.08)",border:"1px solid #ede9fe"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <h3 style={{margin:0,fontSize:15,fontWeight:700,color:T.text}}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Search({value,onChange,placeholder}){
  return(
    <div style={{position:"relative",marginBottom:16}}>
      <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}>🔍</span>
      <input type="text" placeholder={placeholder||"Search..."} value={value} onChange={e=>onChange(e.target.value)}
        style={{width:"100%",padding:"10px 14px 10px 40px",border:"1.5px solid #ede9fe",borderRadius:10,fontSize:13,color:T.text,background:"#faf5ff",outline:"none",fontFamily:"inherit"}}/>
    </div>
  );
}

function Mdl({title,onClose,children,maxWidth=820}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(59,7,100,0.55)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth,maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(147,51,234,0.25)"}}>
        <div style={{padding:"16px 22px",borderBottom:"1px solid #ede9fe",display:"flex",justifyContent:"space-between",alignItems:"center",background:"linear-gradient(90deg,#f5f3ff,#faf5ff)",flexShrink:0}}>
          <h2 style={{margin:0,fontSize:17,fontWeight:800,color:T.text}}>{title}</h2>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#7c3aed",padding:"4px 8px"}}>✕</button>
        </div>
        <div style={{overflowY:"auto",padding:"20px 22px",flex:1}}>{children}</div>
      </div>
    </div>
  );
}

function Fld({label,value,onChange,options,type="text",error,placeholder,disabled,allowCustom}){
  const s={width:"100%",border:`1.5px solid ${error?"#EF4444":"#ede9fe"}`,borderRadius:10,padding:"10px 14px",fontSize:13,color:T.text,background:disabled?"#f3f0ff":"#faf5ff",boxSizing:"border-box",outline:"none",fontFamily:"inherit",opacity:disabled?0.7:1};
  const sCustom={flex:1.2,border:`1.5px solid ${error?"#EF4444":"#ede9fe"}`,borderRadius:10,padding:"10px 14px",fontSize:13,color:T.text,background:"#fff",boxSizing:"border-box",outline:"none",fontFamily:"inherit"};
  return(
    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,marginBottom:5}}>{label.toUpperCase()}</label>
      {options?(
        allowCustom?(
          <div style={{display:"flex",gap:10}}>
            <select value={options.includes(value)?value:"Custom"} onChange={e=>{const v=e.target.value;if(v==="Custom")onChange("");else onChange(v);}} style={{...s,flex:1}} disabled={disabled}>{options.map(o=><option key={o} value={o}>{o}</option>)}<option value="Custom">Custom Status...</option></select>
            {!options.includes(value)&&<input type="text" placeholder={`Type custom ${label.toLowerCase()}...`} value={value||""} onChange={e=>onChange(e.target.value)} style={sCustom} disabled={disabled}/>}
          </div>
        ):(<select value={value} onChange={e=>onChange(e.target.value)} style={s} disabled={disabled}>{options.map(o=><option key={o}>{o}</option>)}</select>)
      ):<input type={type} value={value} onChange={e=>onChange(e.target.value)} style={s} placeholder={placeholder||""} disabled={disabled}/>}
      {error&&<div style={{fontSize:11,color:"#EF4444",marginTop:4}}>⚠️ {error}</div>}
    </div>
  );
}

function Pagination({ totalItems, itemsPerPage, currentPage, onPageChange, onItemsPerPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  if (totalItems === 0) return null;

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, padding: "12px 0 4px", borderTop: "1px solid #ede9fe", flexWrap: "wrap", gap: 15 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, color: "#7c3aed", fontWeight: 600 }}>Page {currentPage} of {totalPages}</span>
        <select 
          value={itemsPerPage} 
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          style={{ padding: "7px 12px", borderRadius: 10, border: "1.5px solid #ede9fe", fontSize: 13, background: "#faf5ff", color: "#1e0a3c", outline: "none", cursor: "pointer", fontWeight: 500 }}
        >
          {[10, 25, 50, 100].map(n => <option key={n} value={n}>Show {n}</option>)}
        </select>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button 
          disabled={currentPage === 1} 
          onClick={() => onPageChange(currentPage - 1)}
          style={{ padding: "7px 14px", borderRadius: 10, border: "1.5px solid #ede9fe", background: currentPage === 1 ? "#f8fafc" : "#fff", color: currentPage === 1 ? "#cbd5e1" : "#7c3aed", fontSize: 13, fontWeight: 700, cursor: currentPage === 1 ? "not-allowed" : "pointer", transition: "all 0.2s" }}
        >
          Previous
        </button>
        
        {/* Simple page numbers */}
        {totalPages <= 7 ? (
          [...Array(totalPages)].map((_, i) => (
            <button key={i+1} onClick={() => onPageChange(i+1)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "1.5px solid", borderColor: currentPage === (i+1) ? "#9333ea" : "#ede9fe", background: currentPage === (i+1) ? "#9333ea" : "#fff", color: currentPage === (i+1) ? "#fff" : "#7c3aed", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>{i+1}</button>
          ))
        ) : (
          <>
            <button onClick={() => onPageChange(1)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "1.5px solid", borderColor: currentPage === 1 ? "#9333ea" : "#ede9fe", background: currentPage === 1 ? "#9333ea" : "#fff", color: currentPage === 1 ? "#fff" : "#7c3aed", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>1</button>
            {currentPage > 3 && <span style={{ color: "#cbd5e1" }}>...</span>}
            {currentPage > 2 && currentPage < totalPages - 1 && (
               <button onClick={() => onPageChange(currentPage)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "1.5px solid #9333ea", background: "#9333ea", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{currentPage}</button>
            )}
            {currentPage < totalPages - 2 && <span style={{ color: "#cbd5e1" }}>...</span>}
            <button onClick={() => onPageChange(totalPages)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "1.5px solid", borderColor: currentPage === totalPages ? "#9333ea" : "#ede9fe", background: currentPage === totalPages ? "#9333ea" : "#fff", color: currentPage === totalPages ? "#fff" : "#7c3aed", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{totalPages}</button>
          </>
        )}

        <button 
          disabled={currentPage === totalPages} 
          onClick={() => onPageChange(currentPage + 1)}
          style={{ padding: "7px 14px", borderRadius: 10, border: "1.5px solid #ede9fe", background: currentPage === totalPages ? "#f8fafc" : "#fff", color: currentPage === totalPages ? "#cbd5e1" : "#7c3aed", fontSize: 13, fontWeight: 700, cursor: currentPage === totalPages ? "not-allowed" : "pointer", transition: "all 0.2s" }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function ConfirmModal({title,message,onConfirm,onCancel,confirmLabel="Delete",danger=true}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(59,7,100,0.6)",backdropFilter:"blur(8px)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:18,width:"100%",maxWidth:400,padding:"28px 28px 22px",boxShadow:"0 32px 80px rgba(147,51,234,0.25)"}}>
        <div style={{width:52,height:52,borderRadius:"50%",background:danger?"#fee2e2":"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,margin:"0 auto 14px"}}>
          {danger?"🗑️":"✅"}
        </div>
        <h3 style={{textAlign:"center",margin:"0 0 8px",fontSize:16,fontWeight:800,color:T.text}}>{title}</h3>
        <p style={{textAlign:"center",color:"#6b7280",fontSize:13,margin:"0 0 22px"}}>{message}</p>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel} style={{flex:1,padding:"10px",background:"#f5f3ff",border:"1px solid #ede9fe",borderRadius:10,fontSize:13,fontWeight:600,color:T.text,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          <button onClick={onConfirm} style={{flex:1,padding:"10px",background:danger?"linear-gradient(135deg,#EF4444,#dc2626)":"linear-gradient(135deg,#22C55E,#16a34a)",border:"none",borderRadius:10,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}


// ── Action Buttons (View / Edit / Delete) ────────────────────
function ActionBtns({onView,onEdit,onDelete}){
  return(
    <div style={{display:"flex",gap:5,flexWrap:"nowrap"}}>
      {onView&&<button onClick={onView} title="View" style={{background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:7,padding:"5px 10px",fontSize:12,color:"#6366f1",cursor:"pointer",fontWeight:600,fontFamily:"inherit",whiteSpace:"nowrap"}}>👁 View</button>}
      <button onClick={onEdit} title="Edit" style={{background:"rgba(147,51,234,0.1)",border:"1px solid rgba(147,51,234,0.3)",borderRadius:7,padding:"5px 10px",fontSize:12,color:"#9333ea",cursor:"pointer",fontWeight:600,fontFamily:"inherit",whiteSpace:"nowrap"}}>✏️ Edit</button>
      <button onClick={onDelete} title="Delete" style={{background:"#fee2e2",border:"1px solid #fecaca",borderRadius:7,padding:"5px 10px",fontSize:12,color:"#ef4444",cursor:"pointer",fontWeight:600,fontFamily:"inherit",whiteSpace:"nowrap"}}>🗑 Delete</button>
    </div>
  );
}

function InfoRow({icon,label,value}){
  if(!value) return null;
  return(
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#faf5ff",borderRadius:9,border:"1px solid #ede9fe",marginBottom:7}}>
      <div style={{width:32,height:32,borderRadius:8,background:"rgba(147,51,234,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{icon}</div>
      <div><div style={{fontSize:10,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"}}>{label}</div><div style={{fontSize:13,fontWeight:600,color:"#1e0a3c",marginTop:1}}>{value}</div></div>
    </div>
  );
}

function ClientDropdown({clients,value,onChange,error,onAddClient}){
  const [search,setSearch]=useState("");
  const [open,setOpen]=useState(false);
  const filtered=clients.filter(c=>(c.clientName||c.name||"").toLowerCase().includes(search.toLowerCase())||(c.companyName||c.company||"").toLowerCase().includes(search.toLowerCase()));
  const selected=clients.find(c=>(c.clientName||c.name)===value);
  return(
    <div style={{position:"relative"}}>
      <div onClick={()=>setOpen(!open)} style={{width:"100%",border:`1.5px solid ${error?"#EF4444":open?"#9333ea":"#ede9fe"}`,borderRadius:10,padding:"10px 36px 10px 14px",fontSize:13,color:value?T.text:"#a78bfa",background:"#faf5ff",cursor:"pointer",userSelect:"none",boxSizing:"border-box",position:"relative",minHeight:42}}>
        {value?(<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:22,height:22,borderRadius:"50%",background:"linear-gradient(135deg,#9333ea,#c084fc)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700,flexShrink:0}}>{value[0].toUpperCase()}</div><span>{value}</span>{selected?.companyName&&<span style={{fontSize:11,color:"#a78bfa"}}>({selected.companyName})</span>}</div>):"-- Select Client --"}
        <span style={{position:"absolute",right:12,top:"50%",transform:`translateY(-50%) rotate(${open?180:0}deg)`,fontSize:10,color:"#a78bfa",transition:"0.2s"}}>▼</span>
      </div>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#fff",border:"1.5px solid #ede9fe",borderRadius:12,boxShadow:"0 8px 32px rgba(147,51,234,0.15)",zIndex:999,overflow:"hidden"}}>
          <div style={{padding:"10px 10px 6px"}}><div style={{position:"relative"}}><span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:12}}>🔍</span><input autoFocus placeholder="Search client..." value={search} onChange={e=>setSearch(e.target.value)} onClick={e=>e.stopPropagation()} style={{width:"100%",padding:"7px 10px 7px 30px",border:"1.5px solid #ede9fe",borderRadius:8,fontSize:12,background:"#faf5ff",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/></div></div>
          {onAddClient&&<div onClick={()=>{setOpen(false);setSearch("");onAddClient();}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",background:"linear-gradient(90deg,#f3e8ff,#faf5ff)",borderBottom:"2px solid #ede9fe"}}><div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#9333ea,#c084fc)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:17,fontWeight:700,flexShrink:0}}>+</div><div><div style={{fontSize:13,fontWeight:700,color:"#9333ea"}}>Add New Client</div></div></div>}
          <div style={{maxHeight:180,overflowY:"auto"}}>
            {filtered.length===0?<div style={{padding:14,textAlign:"center",color:"#a78bfa",fontSize:13}}>No clients found</div>
              :filtered.map((c,i)=>{const name=c.clientName||c.name||"";const company=c.companyName||c.company||"";const isSel=value===name;return(<div key={i} onClick={()=>{onChange(name);setOpen(false);setSearch("");}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",background:isSel?"#f3e8ff":"transparent",borderBottom:"1px solid #f5f3ff"}} onMouseEnter={e=>e.currentTarget.style.background="#faf5ff"} onMouseLeave={e=>e.currentTarget.style.background=isSel?"#f3e8ff":"transparent"}><div style={{width:28,height:28,borderRadius:"50%",background:c.logoUrl?"#fff":"linear-gradient(135deg,#9333ea,#c084fc)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:700,flexShrink:0,overflow:"hidden",border:c.logoUrl?"1px solid #ede9fe":"none"}}>{c.logoUrl?<img src={c.logoUrl} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:(name[0]?.toUpperCase()||"?")}</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:T.text}}>{name}</div>{company&&<div style={{fontSize:11,color:"#a78bfa"}}>{company}</div>}</div>{isSel&&<span style={{fontSize:14,color:"#9333ea"}}>✓</span>}</div>);})}
          </div>
        </div>
      )}
      {open&&<div style={{position:"fixed",inset:0,zIndex:998}} onClick={()=>{setOpen(false);setSearch("");}}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CLIENTS PAGE
// ═══════════════════════════════════════════════════════════
function ClientsPage({clients,setClients,projects=[],onAddClient}){
  const [search,setSearch]=useState("");
  const [viewClient,setViewClient]=useState(null);
  const [editClient,setEditClient]=useState(null);
  const [deleteTarget,setDeleteTarget]=useState(null);
  const [editForm,setEditForm]=useState({ clientName: "", companyName: "", email: "", phone: "", address: "", status: "Active", gstNumber: "", logoUrl: "", contactPersonName: "", contactPersonNo: "", password: "" });
  const [editErr,setEditErr]=useState({});
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState("");

  const showToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(""),2800);};

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filtered=clients.filter(c=>
    (c.clientName||c.name||"").toLowerCase().includes(search.toLowerCase())||
    (c.email||"").toLowerCase().includes(search.toLowerCase())||
    (c.companyName||c.company||"").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => { setCurrentPage(1); }, [search, clients.length]);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openEdit=(c)=>{
    setEditForm({
      clientName:c.clientName||c.name||"",
      companyName:c.companyName||c.company||"",
      email:c.email||"",
      phone:c.phone||"",
      address:c.address||"",
      status:c.status||"Active",
      gstNumber:c.gstNumber||"",
      logoUrl:c.logoUrl||"",
      contactPersonName: c.contactPersonName || "",
      contactPersonNo: c.contactPersonNo || "",
      password: "", 
    });
    setEditErr({});
    setEditClient(c);
  };

  const saveEdit=async()=>{
    const errs={};
    if(!editForm.clientName.trim())errs.clientName="Name required";
    if(!editForm.email.trim())errs.email="Email required";
    if(Object.keys(errs).length){setEditErr(errs);return;}
    try{
      setSaving(true);
      const res=await axios.put(`${BASE_URL}/api/clients/${editClient._id}`,editForm);
      setClients(prev=>prev.map(c=>c._id===editClient._id?{...c,...(res.data.client||editForm)}:c));
      setEditClient(null);
      showToast("✅ Client updated!");
    }catch(err){
      // fallback local update
      setClients(prev=>prev.map(c=>c._id===editClient._id?{...c,...editForm}:c));
      setEditClient(null);
      showToast("✅ Updated locally!");
    }finally{setSaving(false);}
  };

  const doDelete=async()=>{
    try{
      await axios.delete(`${BASE_URL}/api/clients/${deleteTarget._id}`);
    }catch{}
    setClients(prev=>prev.filter(c=>c._id!==deleteTarget._id));
    setDeleteTarget(null);
    showToast("🗑️ Client deleted!");
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {toast&&<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:"#fff",border:"1.5px solid #22c55e",borderRadius:12,padding:"12px 20px",fontSize:13,fontWeight:700,color:"#22c55e",boxShadow:"0 8px 24px rgba(0,0,0,0.12)"}}>{toast}</div>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {[{t:"Total Clients",v:clients.length,i:"👥",c:"#9333ea"},{t:"Active",v:clients.filter(c=>c.status==="Active").length,i:"✅",c:"#22C55E"},{t:"Inactive",v:clients.filter(c=>c.status==="Inactive").length,i:"⛔",c:"#EF4444"}].map(({t,v,i,c})=>(
          <div key={t} style={{background:"#fff",borderRadius:14,padding:"16px 14px",boxShadow:"0 4px 18px rgba(147,51,234,0.07)",border:"1px solid #ede9fe",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:11,background:`${c}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{i}</div>
            <div><div style={{fontSize:10,color:"#a78bfa",fontWeight:700,letterSpacing:0.5}}>{t.toUpperCase()}</div><div style={{fontSize:24,fontWeight:800,color:c}}>{v}</div></div>
          </div>
        ))}
      </div>

      <SC title={`All Clients (${filtered.length})`}>
        <Search value={search} onChange={setSearch} placeholder="Search by name, email, company..."/>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:700}}>
            <thead><tr style={{background:"linear-gradient(90deg,#f5f3ff,#faf5ff)"}}>
              {["#", "Company Name", "Contact Person", "Email", "Phone", "Status", "Joined", "Actions"].map(c => (
                <th key={c} style={{padding:"10px 14px",textAlign:"left",color:"#7c3aed",fontWeight:700,fontSize:11,borderBottom:"2px solid #ede9fe",whiteSpace:"nowrap"}}>{c.toUpperCase()}</th>
              ))}
            </tr></thead>
            <tbody>
              {paginated.length===0?<tr><td colSpan={8} style={{padding:30,textAlign:"center",color:"#a78bfa"}}>No clients found</td></tr>
                :paginated.map((c,i)=>(
                  <tr key={c._id||i} style={{borderBottom:"1px solid #f3f0ff"}} onMouseEnter={e=>e.currentTarget.style.background="#faf5ff"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"12px 14px",color:"#a78bfa",fontSize:11,fontFamily:"monospace"}}>{`CLT${String((currentPage-1)*itemsPerPage + i + 1).padStart(3,"0")}`}</td>
                    <td style={{padding:"12px 14px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:28,height:28,borderRadius:"50%",background:c.logoUrl?"#fff":"linear-gradient(135deg,#9333ea,#c084fc)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:700,flexShrink:0,overflow:"hidden",border:c.logoUrl?"1px solid #ede9fe":"none"}}>{c.logoUrl?<img src={c.logoUrl} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:((c.clientName||c.name||"?")[0].toUpperCase())}</div>
                        <span style={{fontWeight:700,color:T.text}}>{c.clientName||c.name||"—"}</span>
                      </div>
                    </td>
                    <td style={{padding:"12px 14px",color:"#7c3aed"}}>{c.contactPersonName || "—"}</td>
                    <td style={{padding:"12px 14px",color:"#6b7280",fontSize:12}}>{c.email||"—"}</td>
                    <td style={{padding:"12px 14px",color:"#6b7280",fontSize:12}}>{c.phone||"—"}</td>
                    <td style={{padding:"12px 14px"}}><Badge label={c.status||"Active"}/></td>
                    <td style={{padding:"12px 14px",color:"#a78bfa",fontSize:12}}>{c.createdAt?new Date(c.createdAt).toLocaleDateString():"—"}</td>
                    <td style={{padding:"12px 14px"}}>
                      <ActionBtns
                        onView={()=>setViewClient(c)}
                        onEdit={()=>openEdit(c)}
                        onDelete={()=>setDeleteTarget(c)}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <Pagination totalItems={filtered.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
      </SC>

      {/* View Modal */}
      {viewClient&&(
        <Mdl title="Client Profile" onClose={()=>setViewClient(null)} maxWidth={500}>
          <div style={{display:"flex",alignItems:"center",gap:14,padding:16,background:"linear-gradient(135deg,#f5f3ff,#faf5ff)",borderRadius:14,border:"1px solid #ede9fe",marginBottom:18}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:viewClient.logoUrl?"#fff":"linear-gradient(135deg,#9333ea,#c084fc)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:20,fontWeight:800,flexShrink:0,overflow:"hidden",border:viewClient.logoUrl?"1px solid #ede9fe":"none"}}>{viewClient.logoUrl?<img src={viewClient.logoUrl} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain"}}/>:((viewClient.clientName||viewClient.name||"?")[0].toUpperCase())}</div>
            <div>
              <div style={{fontSize:17,fontWeight:800,color:T.text}}>{viewClient.clientName||viewClient.name}</div>
              <div style={{fontSize:13,color:"#9333ea",marginTop:2}}>{viewClient.companyName||viewClient.company||"—"}</div>
            </div>
            <div style={{marginLeft:"auto"}}><Badge label={viewClient.status||"Active"}/></div>
          </div>
          <InfoRow icon="📧" label="Email" value={viewClient.email}/>
          <InfoRow icon="📱" label="Phone" value={viewClient.phone}/>
          <InfoRow icon="📍" label="Address" value={viewClient.address}/>
          <InfoRow icon="📅" label="Joined" value={viewClient.createdAt?new Date(viewClient.createdAt).toLocaleDateString():"—"}/>
          
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 10, textTransform: "uppercase" }}>Recent Projects</div>
            {(() => {
              const clientProjects = projects.filter(p => (p.client || "").toLowerCase() === (viewClient.clientName || viewClient.name || "").toLowerCase());
              return clientProjects.length === 0 ? (
                <div style={{ padding: "12px", background: "#f8fafc", borderRadius: 10, border: "1px solid #f1f5f9", textAlign: "center", color: "#a78bfa", fontSize: 12 }}>No projects found for this client</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {clientProjects.slice(0, 3).map((p, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#fff", borderRadius: 10, border: "1px solid #ede9fe" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "#a78bfa" }}>{p.end ? new Date(p.end).toLocaleDateString() : "No deadline"}</div>
                      </div>
                      <Badge label={p.status || "Pending"} />
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <button onClick={()=>{setViewClient(null);openEdit(viewClient);}} style={{flex:1,padding:"10px",background:"linear-gradient(135deg,#9333ea,#a855f7)",border:"none",borderRadius:10,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>✏️ Edit</button>
            <button onClick={()=>{setViewClient(null);setDeleteTarget(viewClient);}} style={{flex:1,padding:"10px",background:"linear-gradient(135deg,#EF4444,#dc2626)",border:"none",borderRadius:10,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>🗑 Delete</button>
          </div>
        </Mdl>
      )}

      {/* Edit Modal */}
      {editClient&&(
        <Mdl title="Edit Client" onClose={()=>setEditClient(null)}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
            <div style={{position:"relative",width:100,height:100}}>
              <div style={{width:100,height:100,borderRadius:"50%",background:"linear-gradient(135deg,#f5f3ff,#faf5ff)",border:"2px dashed #d8b4fe",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                {editForm.logoUrl?(<img src={editForm.logoUrl} alt="Logo" style={{width:"100%",height:"100%",objectFit:"contain"}}/>):(<span style={{fontSize:40}}>🏢</span>)}
              </div>
              <label style={{position:"absolute",bottom:0,right:0,background:"#7c3aed",width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:"2px solid #fff",boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>
                <span style={{fontSize:16}}>📷</span>
                <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
                  const file=e.target.files[0];
                  if(file){
                    const reader=new FileReader();
                    reader.onloadend=()=>setEditForm(p=>({...p,logoUrl:reader.result}));
                    reader.readAsDataURL(file);
                  }
                }}/>
              </label>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}} className="modal-2col">
            <Fld label="Company Name *" value={editForm.clientName} onChange={v=>{setEditForm(p=>({...p,clientName:v}));setEditErr(p=>({...p,clientName:""}));}} error={editErr.clientName}/>
            <Fld label="Contact Person Name" value={editForm.contactPersonName} onChange={v=>setEditForm(p=>({...p,contactPersonName:v}))}/>
            <Fld label="Email *" value={editForm.email} onChange={v=>{setEditForm(p=>({...p,email:v}));setEditErr(p=>({...p,email:""}));}} type="email" error={editErr.email}/>
            <Fld label="Phone" value={editForm.phone} onChange={v=>setEditForm(p=>({...p,phone:v}))}/>
            <Fld label="Company Tax/GST" value={editForm.gstNumber} onChange={v=>setEditForm(p=>({...p,gstNumber:v}))}/>
            <Fld label="Status" value={editForm.status} onChange={v=>setEditForm(p=>({...p,status:v}))} options={["Active","Inactive"]}/>
            <Fld label="Contact Person Name" value={editForm.contactPersonName} onChange={v=>setEditForm(p=>({...p,contactPersonName:v}))}/>
            <Fld label="Contact Person No." value={editForm.contactPersonNo} onChange={v=>setEditForm(p=>({...p,contactPersonNo:v}))}/>
          </div>
          <Fld label="Company Address" value={editForm.address} onChange={v=>setEditForm(p=>({...p,address:v}))}/>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>PASSWORD</label>
            <input 
              type="password" 
              value={editForm.password} 
              onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))} 
              style={{ width: "100%", border: "1.5px solid #ede9fe", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: T.text, background: "#faf5ff", boxSizing: "border-box", outline: "none" }} 
              placeholder="Leave blank to keep current password"
            />
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:4}}>
            <button onClick={()=>setEditClient(null)} style={{background:"#f5f3ff",border:"1px solid #ede9fe",color:T.text,borderRadius:10,padding:"10px 16px",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit"}}>Cancel</button>
            <button onClick={saveEdit} disabled={saving} style={{background:"linear-gradient(135deg,#9333ea,#a855f7)",border:"none",borderRadius:10,padding:"10px 20px",fontSize:13,fontWeight:700,color:"#fff",cursor:saving?"not-allowed":"pointer",fontFamily:"inherit",opacity:saving?0.7:1}}>{saving?"Saving…":"Save Changes →"}</button>
          </div>
        </Mdl>
      )}

      {deleteTarget&&<ConfirmModal title="Delete Client" message={`Are you sure you want to delete "${deleteTarget.clientName||deleteTarget.name}"? This cannot be undone.`} onConfirm={doDelete} onCancel={()=>setDeleteTarget(null)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// EMPLOYEES PAGE
// ═══════════════════════════════════════════════════════════
function EmployeesPage({employees,setEmployees}){
  const [search,setSearch]=useState("");
  const [viewEmp,setViewEmp]=useState(null);
  const [editEmp,setEditEmp]=useState(null);
  const [deleteTarget,setDeleteTarget]=useState(null);
  const [editForm,setEditForm]=useState({});
  const [editErr,setEditErr]=useState({});
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState("");
const [empDocs, setEmpDocs] = useState({});
const [empDocsLoading, setEmpDocsLoading] = useState(false);

const loadEmpDocs = async (emp) => {
  setEmpDocs({});
  setEmpDocsLoading(true);
  try {
    const r = await axios.get(
      `${BASE_URL}/api/employee-dashboard/documents/${encodeURIComponent(emp.name)}/all`
    );
    const map = {};
    (r.data || []).forEach(d => { map[d.docType] = d; });
    setEmpDocs(map);
  } catch { setEmpDocs({}); }
  finally { setEmpDocsLoading(false); }
};
  const showToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(""),2800);};

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filtered=employees.filter(e=>
    (e.name||"").toLowerCase().includes(search.toLowerCase())||
    (e.email||"").toLowerCase().includes(search.toLowerCase())||
    (e.role||"").toLowerCase().includes(search.toLowerCase())||
    (e.department||"").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => { setCurrentPage(1); }, [search, employees.length]);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openEdit=(e)=>{
    setEditForm({name:e.name||"",email:e.email||"",phone:e.phone||"",role:e.role||"",department:e.department||"",salary:e.salary||"",status:e.status||"Active"});
    setEditErr({});
    setEditEmp(e);
  };

  const saveEdit=async()=>{
    const errs={};
    if(!editForm.name.trim())errs.name="Name required";
    if(!editForm.email.trim())errs.email="Email required";
    if(Object.keys(errs).length){setEditErr(errs);return;}
    try{
      setSaving(true);
      const res=await axios.put(`${BASE_URL}/api/employees/${editEmp._id}`,editForm);
      setEmployees(prev=>prev.map(e=>e._id===editEmp._id?{...e,...(res.data||editForm)}:e));
      setEditEmp(null);
      showToast("✅ Employee updated!");
    }catch{
      setEmployees(prev=>prev.map(e=>e._id===editEmp._id?{...e,...editForm}:e));
      setEditEmp(null);
      showToast("✅ Updated locally!");
    }finally{setSaving(false);}
  };

  const doDelete=async()=>{
    try{
      await axios.delete(`${BASE_URL}/api/employees/${deleteTarget._id}`);
    }catch{}
    setEmployees(prev=>prev.filter(e=>e._id!==deleteTarget._id));
    setDeleteTarget(null);
    showToast("🗑️ Employee deleted!");
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {toast&&<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:"#fff",border:"1.5px solid #22c55e",borderRadius:12,padding:"12px 20px",fontSize:13,fontWeight:700,color:"#22c55e",boxShadow:"0 8px 24px rgba(0,0,0,0.12)"}}>{toast}</div>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {[{t:"Total",v:employees.length,i:"👨‍💼",c:"#7c3aed"},{t:"Active",v:employees.filter(e=>e.status==="Active").length,i:"✅",c:"#22C55E"},{t:"Inactive",v:employees.filter(e=>e.status==="Inactive").length,i:"⛔",c:"#EF4444"}].map(({t,v,i,c})=>(
          <div key={t} style={{background:"#fff",borderRadius:14,padding:"16px 14px",boxShadow:"0 4px 18px rgba(147,51,234,0.07)",border:"1px solid #ede9fe",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:11,background:`${c}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{i}</div>
            <div><div style={{fontSize:10,color:"#a78bfa",fontWeight:700,letterSpacing:0.5}}>{t.toUpperCase()}</div><div style={{fontSize:24,fontWeight:800,color:c}}>{v}</div></div>
          </div>
        ))}
      </div>

      <SC title={`All Employees (${filtered.length})`}>
        <Search value={search} onChange={setSearch} placeholder="Search by name, email, role..."/>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:750}}>
            <thead><tr style={{background:"linear-gradient(90deg,#f5f3ff,#faf5ff)"}}>
              {["#","Name","Email","Phone","Role","Department","Salary","Status","Actions"].map(c=>(
                <th key={c} style={{padding:"10px 14px",textAlign:"left",color:"#7c3aed",fontWeight:700,fontSize:11,borderBottom:"2px solid #ede9fe",whiteSpace:"nowrap"}}>{c.toUpperCase()}</th>
              ))}
            </tr></thead>
            <tbody>
              {paginated.length===0?<tr><td colSpan={9} style={{padding:30,textAlign:"center",color:"#a78bfa"}}>No employees found</td></tr>
                :paginated.map((e,i)=>(
                  <tr key={e._id||i} style={{borderBottom:"1px solid #f3f0ff"}} onMouseEnter={ev=>ev.currentTarget.style.background="#faf5ff"} onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                    <td style={{padding:"12px 14px",color:"#a78bfa",fontSize:11,fontFamily:"monospace"}}>{`EMP${String((currentPage-1)*itemsPerPage + i + 1).padStart(3,"0")}`}</td>
                    <td style={{padding:"12px 14px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:700,flexShrink:0}}>{(e.name||"?")[0].toUpperCase()}</div>
                        <span style={{fontWeight:700,color:T.text}}>{e.name||"—"}</span>
                      </div>
                    </td>
                    <td style={{padding:"12px 14px",color:"#6b7280",fontSize:12}}>{e.email||"—"}</td>
                    <td style={{padding:"12px 14px",color:"#6b7280",fontSize:12}}>{e.phone||"—"}</td>
                    <td style={{padding:"12px 14px",color:"#7c3aed",fontSize:12,fontWeight:600}}>{e.role||"—"}</td>
                    <td style={{padding:"12px 14px",color:"#6b7280",fontSize:12}}>{e.department||"—"}</td>
                    <td style={{padding:"12px 14px",color:"#22C55E",fontSize:12,fontWeight:600}}>{e.salary||"—"}</td>
                    <td style={{padding:"12px 14px"}}><Badge label={e.status||"Active"}/></td>
                    <td style={{padding:"12px 14px"}}>
                      <ActionBtns 
                        onView={()=>{ setViewEmp(e); loadEmpDocs(e); }}
                        onEdit={()=>openEdit(e)} 
                        onDelete={()=>setDeleteTarget(e)}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <Pagination totalItems={filtered.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
      </SC>

      {viewEmp&&(
        <Mdl title="Employee Profile" onClose={()=>setViewEmp(null)} maxWidth={500}>
          <div style={{display:"flex",alignItems:"center",gap:14,padding:16,background:"linear-gradient(135deg,#f5f3ff,#faf5ff)",borderRadius:14,border:"1px solid #ede9fe",marginBottom:18}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:20,fontWeight:800,flexShrink:0}}>{(viewEmp.name||"?")[0].toUpperCase()}</div>
            <div>
              <div style={{fontSize:17,fontWeight:800,color:T.text}}>{viewEmp.name}</div>
              <div style={{fontSize:13,color:"#9333ea",marginTop:2}}>{viewEmp.role||"Employee"}</div>
            </div>
            <div style={{marginLeft:"auto"}}><Badge label={viewEmp.status||"Active"}/></div>
          </div>
          <InfoRow icon="📧" label="Email" value={viewEmp.email}/>
          <InfoRow icon="📱" label="Phone" value={viewEmp.phone}/>
          <InfoRow icon="🏢" label="Department" value={viewEmp.department}/>
          <InfoRow icon="💰" label="Salary" value={viewEmp.salary}/>
          <InfoRow icon="📅" label="Joined" value={viewEmp.createdAt?new Date(viewEmp.createdAt).toLocaleDateString():"—"}/>

<div style={{marginTop:14}}>
  <div style={{fontSize:12,fontWeight:800,color:"#1e0a3c",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
    📂 Documents
    {empDocsLoading&&<span style={{fontSize:10,color:"#a78bfa"}}>Loading...</span>}
  </div>
  <div style={{display:"flex",flexDirection:"column",gap:8}}>
    {DOC_TYPES.map(dt=>{
      const doc=empDocs[dt.key];
      const hasDoc=!!doc?.url;
      const isImg=(url="")=>/\.(jpg|jpeg|png|gif|webp)$/i.test(url)||url.startsWith("data:image");
      return(
        <div key={dt.key} style={{border:`1.5px solid ${hasDoc?dt.color+"35":"#f1f5f9"}`,borderRadius:12,overflow:"hidden",background:hasDoc?`${dt.color}04`:"#f8fafc"}}>
          <div style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16}}>{dt.icon}</span>
            <div style={{flex:1,fontSize:12,fontWeight:700,color:"#1e0a3c"}}>{dt.label}</div>
            {hasDoc
              ?<span style={{background:`${dt.color}15`,border:`1px solid ${dt.color}30`,borderRadius:20,padding:"2px 10px",fontSize:10,fontWeight:700,color:dt.color}}>✓ Uploaded</span>
              :<span style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:20,padding:"2px 10px",fontSize:10,fontWeight:700,color:"#ef4444"}}>✗ Missing</span>}
          </div>
          {hasDoc&&(
            <div style={{padding:"0 12px 10px"}}>
              {isImg(doc.url)
                ?<img src={doc.url} alt={dt.label} style={{width:"100%",maxHeight:120,objectFit:"contain",borderRadius:8,border:"1px solid #f1f5f9",background:"#fff"}}/>
                :<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#fff",borderRadius:8,border:"1px solid #f1f5f9"}}>
                  <span style={{fontSize:20}}>📄</span>
                  <div style={{fontSize:11,fontWeight:600,color:"#1e0a3c"}}>{doc.fileName||`${dt.label}.pdf`}</div>
                </div>}
              <div style={{display:"flex",gap:6,marginTop:8}}>
                <button onClick={()=>window.open(doc.url,"_blank")}
                  style={{flex:1,padding:"6px 10px",background:`${dt.color}10`,border:`1px solid ${dt.color}30`,borderRadius:7,fontSize:11,fontWeight:700,color:dt.color,cursor:"pointer",fontFamily:"inherit"}}>
                  👁 View
                </button>
                <a href={doc.url} download style={{flex:1,padding:"6px 10px",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:7,fontSize:11,fontWeight:700,color:"#475569",textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  ⬇ Download
                </a>
              </div>
            </div>
          )}
        </div>
      );
    })}
  </div>
</div>
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <button onClick={()=>{setViewEmp(null);openEdit(viewEmp);}} style={{flex:1,padding:"10px",background:"linear-gradient(135deg,#7c3aed,#9333ea)",border:"none",borderRadius:10,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>✏️ Edit</button>
            <button onClick={()=>{setViewEmp(null);setDeleteTarget(viewEmp);}} style={{flex:1,padding:"10px",background:"linear-gradient(135deg,#EF4444,#dc2626)",border:"none",borderRadius:10,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>🗑 Delete</button>
          </div>
        </Mdl>
      )}

      {editEmp&&(
        <Mdl title="Edit Employee" onClose={()=>setEditEmp(null)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}} className="modal-2col">
            <Fld label="Full Name *" value={editForm.name} onChange={v=>{setEditForm(p=>({...p,name:v}));setEditErr(p=>({...p,name:""}));}} error={editErr.name}/>
            <Fld label="Email *" value={editForm.email} onChange={v=>{setEditForm(p=>({...p,email:v}));setEditErr(p=>({...p,email:""}));}} type="email" error={editErr.email}/>
            <Fld label="Phone" value={editForm.phone} onChange={v=>setEditForm(p=>({...p,phone:v}))}/>
            <Fld label="Role" value={editForm.role} onChange={v=>setEditForm(p=>({...p,role:v}))}/>
            <Fld label="Department" value={editForm.department} onChange={v=>setEditForm(p=>({...p,department:v}))}/>
            <Fld label="Salary" value={editForm.salary} onChange={v=>setEditForm(p=>({...p,salary:v}))}/>
            <Fld label="Status" value={editForm.status} onChange={v=>setEditForm(p=>({...p,status:v}))} options={["Active","Inactive"]}/>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:4}}>
            <button onClick={()=>setEditEmp(null)} style={{background:"#f5f3ff",border:"1px solid #ede9fe",color:T.text,borderRadius:10,padding:"10px 16px",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit"}}>Cancel</button>
            <button onClick={saveEdit} disabled={saving} style={{background:"linear-gradient(135deg,#7c3aed,#9333ea)",border:"none",borderRadius:10,padding:"10px 20px",fontSize:13,fontWeight:700,color:"#fff",cursor:saving?"not-allowed":"pointer",fontFamily:"inherit",opacity:saving?0.7:1}}>{saving?"Saving…":"Save Changes →"}</button>
          </div>
        </Mdl>
      )}

      {deleteTarget&&<ConfirmModal title="Delete Employee" message={`Delete "${deleteTarget.name}"? This cannot be undone.`} onConfirm={doDelete} onCancel={()=>setDeleteTarget(null)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MANAGERS PAGE
// ═══════════════════════════════════════════════════════════
function ManagersPage({managers,setManagers}){
  const [search,setSearch]=useState("");
  const [viewMgr,setViewMgr]=useState(null);
  const [editMgr,setEditMgr]=useState(null);
  const [deleteTarget,setDeleteTarget]=useState(null);
  const [editForm,setEditForm]=useState({});
  const [editErr,setEditErr]=useState({});
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const showToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(""),2800);};
  const filtered=managers.filter(m=>(m.managerName||"").toLowerCase().includes(search.toLowerCase())||(m.email||"").toLowerCase().includes(search.toLowerCase())||(m.department||"").toLowerCase().includes(search.toLowerCase()));

  useEffect(() => { setCurrentPage(1); }, [search, managers.length]);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openEdit=(m)=>{
    setEditForm({managerName:m.managerName||"",email:m.email||"",phone:m.phone||"",department:m.department||"",role:m.role||"Manager",address:m.address||"",status:m.status||"Active"});
    setEditErr({});
    setEditMgr(m);
  };
  const saveEdit=async()=>{
    const errs={};
    if(!editForm.managerName.trim())errs.managerName="Name required";
    if(!editForm.email.trim())errs.email="Email required";
    if(Object.keys(errs).length){setEditErr(errs);return;}
    try{
      setSaving(true);
      const res=await axios.put(`${BASE_URL}/api/managers/${editMgr._id}`,editForm);
      setManagers(prev=>prev.map(m=>m._id===editMgr._id?{...m,...(res.data||editForm)}:m));
      setEditMgr(null);
      showToast("✅ Manager updated!");
    }catch{
      setManagers(prev=>prev.map(m=>m._id===editMgr._id?{...m,...editForm}:m));
      setEditMgr(null);
      showToast("✅ Updated locally!");
    }finally{setSaving(false);}
  };

  const doDelete=async()=>{
    try{
      await axios.delete(`${BASE_URL}/api/managers/${deleteTarget._id}`);
    }catch{}
    setManagers(prev=>prev.filter(m=>m._id!==deleteTarget._id));
    setDeleteTarget(null);
    showToast("🗑️ Manager deleted!");
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {toast&&<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:"#fff",border:"1.5px solid #22c55e",borderRadius:12,padding:"12px 20px",fontSize:13,fontWeight:700,color:"#22c55e",boxShadow:"0 8px 24px rgba(0,0,0,0.12)"}}>{toast}</div>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {[{t:"Total Managers",v:managers.length,i:"🧑‍💼",c:"#f59e0b"},{t:"Active",v:managers.filter(m=>m.status==="Active").length,i:"✅",c:"#22C55E"},{t:"Inactive",v:managers.filter(m=>m.status==="Inactive").length,i:"⛔",c:"#EF4444"}].map(({t,v,i,c})=>(
          <div key={t} style={{background:"#fff",borderRadius:14,padding:"16px 14px",boxShadow:"0 4px 18px rgba(147,51,234,0.07)",border:"1px solid #ede9fe",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:11,background:`${c}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{i}</div>
            <div><div style={{fontSize:10,color:"#a78bfa",fontWeight:700,letterSpacing:0.5}}>{t.toUpperCase()}</div><div style={{fontSize:24,fontWeight:800,color:c}}>{v}</div></div>
          </div>
        ))}
      </div>

      <SC title={`All Managers (${filtered.length})`}>
        <Search value={search} onChange={setSearch} placeholder="Search by name, email, department..."/>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:750}}>
            <thead><tr style={{background:"linear-gradient(90deg,#f5f3ff,#faf5ff)"}}>
              {["#","Name","Email","Phone","Role","Department","Status","Joined","Actions"].map(c=>(
                <th key={c} style={{padding:"10px 14px",textAlign:"left",color:"#7c3aed",fontWeight:700,fontSize:11,borderBottom:"2px solid #ede9fe",whiteSpace:"nowrap"}}>{c.toUpperCase()}</th>
              ))}
            </tr></thead>
            <tbody>
              {paginated.length===0?<tr><td colSpan={9} style={{padding:30,textAlign:"center",color:"#a78bfa"}}>No managers found</td></tr>
                :paginated.map((m,i)=>(
                  <tr key={m._id||i} style={{borderBottom:"1px solid #f3f0ff"}} onMouseEnter={ev=>ev.currentTarget.style.background="#faf5ff"} onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                    <td style={{padding:"12px 14px",color:"#a78bfa",fontSize:11,fontFamily:"monospace"}}>{`MGR${String((currentPage-1)*itemsPerPage + i + 1).padStart(3,"0")}`}</td>
                    <td style={{padding:"12px 14px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#f59e0b,#fbbf24)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:700,flexShrink:0}}>{(m.managerName||"?")[0].toUpperCase()}</div>
                        <span style={{fontWeight:700,color:T.text}}>{m.managerName||"—"}</span>
                      </div>
                    </td>
                    <td style={{padding:"12px 14px",color:"#6b7280",fontSize:12}}>{m.email||"—"}</td>
                    <td style={{padding:"12px 14px",color:"#6b7280",fontSize:12}}>{m.phone||"—"}</td>
                    <td style={{padding:"12px 14px",color:"#f59e0b",fontSize:12,fontWeight:600}}>{m.role||"Manager"}</td>
                    <td style={{padding:"12px 14px",color:"#6b7280",fontSize:12}}>{m.department||"—"}</td>
                    <td style={{padding:"12px 14px"}}><Badge label={m.status||"Active"}/></td>
                    <td style={{padding:"12px 14px",color:"#a78bfa",fontSize:12}}>{m.createdAt?new Date(m.createdAt).toLocaleDateString():"—"}</td>
                    <td style={{padding:"12px 14px"}}>
                      <ActionBtns onView={()=>setViewMgr(m)} onEdit={()=>openEdit(m)} onDelete={()=>setDeleteTarget(m)}/>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <Pagination totalItems={filtered.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
      </SC>

      {viewMgr&&(
        <Mdl title="Manager Profile" onClose={()=>setViewMgr(null)} maxWidth={500}>
          <div style={{display:"flex",alignItems:"center",gap:14,padding:16,background:"linear-gradient(135deg,#fffbeb,#fef3c7)",borderRadius:14,border:"1px solid #fde68a",marginBottom:18}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,#f59e0b,#fbbf24)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:20,fontWeight:800,flexShrink:0}}>{(m=>m[0].toUpperCase())(viewMgr.managerName||"M")}</div>
            <div>
              <div style={{fontSize:17,fontWeight:800,color:T.text}}>{viewMgr.managerName}</div>
              <div style={{fontSize:13,color:"#f59e0b",marginTop:2}}>{viewMgr.role||"Manager"}</div>
            </div>
            <div style={{marginLeft:"auto"}}><Badge label={viewMgr.status||"Active"}/></div>
          </div>
          <InfoRow icon="📧" label="Email" value={viewMgr.email}/>
          <InfoRow icon="📱" label="Phone" value={viewMgr.phone}/>
          <InfoRow icon="🏢" label="Department" value={viewMgr.department}/>
          <InfoRow icon="📍" label="Address" value={viewMgr.address}/>
          <InfoRow icon="📅" label="Joined" value={viewMgr.createdAt?new Date(viewMgr.createdAt).toLocaleDateString():"—"}/>
         
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <button onClick={()=>{setViewMgr(null);openEdit(viewMgr);}} style={{flex:1,padding:"10px",background:"linear-gradient(135deg,#f59e0b,#fbbf24)",border:"none",borderRadius:10,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>✏️ Edit</button>
            <button onClick={()=>{setViewMgr(null);setDeleteTarget(viewMgr);}} style={{flex:1,padding:"10px",background:"linear-gradient(135deg,#EF4444,#dc2626)",border:"none",borderRadius:10,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>🗑 Delete</button>
          </div>
        </Mdl>
      )}

      {editMgr&&(
        <Mdl title="Edit Manager" onClose={()=>setEditMgr(null)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}} className="modal-2col">
            <Fld label="Manager Name *" value={editForm.managerName} onChange={v=>{setEditForm(p=>({...p,managerName:v}));setEditErr(p=>({...p,managerName:""}));}} error={editErr.managerName}/>
            <Fld label="Email *" value={editForm.email} onChange={v=>{setEditForm(p=>({...p,email:v}));setEditErr(p=>({...p,email:""}));}} type="email" error={editErr.email}/>
            <Fld label="Phone" value={editForm.phone} onChange={v=>setEditForm(p=>({...p,phone:v}))}/>
            <Fld label="Role" value={editForm.role} onChange={v=>setEditForm(p=>({...p,role:v}))}/>
            <Fld label="Department" value={editForm.department} onChange={v=>setEditForm(p=>({...p,department:v}))}/>
            <Fld label="Status" value={editForm.status} onChange={v=>setEditForm(p=>({...p,status:v}))} options={["Active","Inactive"]}/>
          </div>
          <Fld label="Address" value={editForm.address} onChange={v=>setEditForm(p=>({...p,address:v}))}/>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:4}}>
            <button onClick={()=>setEditMgr(null)} style={{background:"#f5f3ff",border:"1px solid #ede9fe",color:T.text,borderRadius:10,padding:"10px 16px",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit"}}>Cancel</button>
            <button onClick={saveEdit} disabled={saving} style={{background:"linear-gradient(135deg,#f59e0b,#fbbf24)",border:"none",borderRadius:10,padding:"10px 20px",fontSize:13,fontWeight:700,color:"#fff",cursor:saving?"not-allowed":"pointer",fontFamily:"inherit",opacity:saving?0.7:1}}>{saving?"Saving…":"Save Changes →"}</button>
          </div>
        </Mdl>
      )}

      {deleteTarget&&<ConfirmModal title="Delete Manager" message={`Delete "${deleteTarget.managerName}"? This cannot be undone.`} onConfirm={doDelete} onCancel={()=>setDeleteTarget(null)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PROJECTS PAGE
// ═══════════════════════════════════════════════════════════
function ProjectsPage({projects,setProjects,clients,employees,config}){
  const [search,setSearch]=useState("");
  const [viewProj,setViewProj]=useState(null);
  const [editProj,setEditProj]=useState(null);
  const [deleteTarget,setDeleteTarget]=useState(null);
  const [assignModal,setAssignModal]=useState(null);
  const [editForm,setEditForm]=useState({ currency: "₹" });
  const [editErr,setEditErr]=useState({});
  const [assignTo,setAssignTo]=useState([]);
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const showToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(""),2800);};
  const filtered=projects.filter(p=>(p.name||"").toLowerCase().includes(search.toLowerCase())||(p.client||"").toLowerCase().includes(search.toLowerCase()));

  useEffect(() => { setCurrentPage(1); }, [search, projects.length]);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openEdit=(p)=>{
    setEditForm({name:p.name||"",client:p.client||"",purpose:p.purpose||"",description:p.description||"",start:p.start||"",end:p.end||"",budget:p.budget||"",currency: p.currency || "₹",team:p.team||"",status:p.status||"Pending",assignedTo:Array.isArray(p.assignedTo) ? p.assignedTo : (p.assignedTo ? [p.assignedTo] : [])});
    setEditErr({});
    setEditProj(p);
  };

  const saveEdit=async()=>{
    const errs={};
    if(!editForm.name.trim())errs.name="Name required";
    if(!editForm.client.trim())errs.client="Client required";
    if(Object.keys(errs).length){setEditErr(errs);return;}
    try{
      setSaving(true);
      const res=await axios.put(`${BASE_URL}/api/projects/${editProj._id}`,editForm);
      setProjects(prev=>prev.map(p=>p._id===editProj._id?{...p,...(res.data.project||editForm)}:p));
      setEditProj(null);
      showToast("✅ Project updated!");
    }catch{
      setProjects(prev=>prev.map(p=>p._id===editProj._id?{...p,...editForm}:p));
      setEditProj(null);
      showToast("✅ Updated locally!");
    }finally{setSaving(false);}
  };

  const doDelete=async()=>{
    try{await axios.delete(`${BASE_URL}/api/projects/${deleteTarget._id}`);}catch{}
    setProjects(prev=>prev.filter(p=>p._id!==deleteTarget._id));
    setDeleteTarget(null);
    showToast("🗑️ Project deleted!");
  };

  const doAssign=async()=>{
    if(!assignTo || assignTo.length===0){alert("Please select at least one employee");return;}
    try{
      await axios.put(`${BASE_URL}/api/projects/${assignModal._id}`,{assignedTo:assignTo});
      setProjects(prev=>prev.map(p=>p._id===assignModal._id?{...p,assignedTo:assignTo}:p));
      setAssignModal(null);setAssignTo([]);
      showToast("✅ Employees assigned!");
    }catch(err){alert(err.response?.data?.msg||"Failed to assign");}
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {toast&&<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:"#fff",border:"1.5px solid #22c55e",borderRadius:12,padding:"12px 20px",fontSize:13,fontWeight:700,color:"#22c55e",boxShadow:"0 8px 24px rgba(0,0,0,0.12)"}}>{toast}</div>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[{t:"Total",v:projects.length,i:"📁",c:"#a855f7"},{t:"Active",v:projects.filter(p=>p.status==="In Progress").length,i:"⚡",c:"#9333ea"},{t:"Completed",v:projects.filter(p=>p.status==="Completed").length,i:"✅",c:"#22C55E"},{t:"Pending",v:projects.filter(p=>p.status==="Pending").length,i:"⏳",c:"#F59E0B"}].map(({t,v,i,c})=>(
          <div key={t} style={{background:"#fff",borderRadius:14,padding:"16px 14px",boxShadow:"0 4px 18px rgba(147,51,234,0.07)",border:"1px solid #ede9fe",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:11,background:`${c}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{i}</div>
            <div><div style={{fontSize:10,color:"#a78bfa",fontWeight:700,letterSpacing:0.5}}>{t.toUpperCase()}</div><div style={{fontSize:24,fontWeight:800,color:c}}>{v}</div></div>
          </div>
        ))}
      </div>

      <SC title={`All Projects (${filtered.length})`}>
        <Search value={search} onChange={setSearch} placeholder="Search by project name, client..."/>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:800}}>
            <thead><tr style={{background:"linear-gradient(90deg,#f5f3ff,#faf5ff)"}}>
              {["#","Name","Client","Budget","Status","Assigned To","Actions"].map(c=>(
                <th key={c} style={{padding:"10px 14px",textAlign:"left",color:"#7c3aed",fontWeight:700,fontSize:11,borderBottom:"2px solid #ede9fe",whiteSpace:"nowrap"}}>{c.toUpperCase()}</th>
              ))}
            </tr></thead>
            <tbody>
              {paginated.length===0?<tr><td colSpan={7} style={{padding:30,textAlign:"center",color:"#a78bfa"}}>No projects found</td></tr>
                :paginated.map((p,i)=>(
                  <tr key={p._id||i} style={{borderBottom:"1px solid #f3f0ff"}} onMouseEnter={ev=>ev.currentTarget.style.background="#faf5ff"} onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                    <td style={{padding:"12px 14px",color:"#a78bfa",fontSize:11,fontFamily:"monospace"}}>{`PRJ${String((currentPage-1)*itemsPerPage + i + 1).padStart(3,"0")}`}</td>
                    <td style={{padding:"12px 14px",fontWeight:700,color:T.text}}>{p.name}</td>
                    <td style={{padding:"12px 14px",color:"#7c3aed"}}>{p.client||"—"}</td>
                    <td style={{ padding: "12px 14px", color: "#22C55E", fontWeight: 600 }}>{p.currency || "₹"} {p.budget || "0"}</td>
                    <td style={{padding:"12px 14px"}}><Badge label={p.status||"Pending"}/></td>
                    <td style={{padding:"12px 14px"}}>
                      {(() => {
                        const assignedEmployees = Array.isArray(p.assignedTo) ? p.assignedTo : (p.assignedTo ? [p.assignedTo] : []);
                        return assignedEmployees.length > 0
                          ?<div style={{display:"flex",flexDirection:"column",gap:4}}>
                             {assignedEmployees.slice(0,2).map((emp, idx)=>(
                               <div key={idx} style={{display:"flex",alignItems:"center",gap:6}}>
                                 <div style={{width:20,height:20,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#a78bfa)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:8,fontWeight:700,flexShrink:0}}>{emp[0].toUpperCase()}</div>
                                 <span style={{color:"#6366f1",fontWeight:600,fontSize:11}}>{emp}</span>
                               </div>
                             ))}
                             {assignedEmployees.length > 2 && <div style={{fontSize:10,color:"#a78bfa",fontStyle:"italic"}}>+{assignedEmployees.length - 2} more</div>}
                           </div>
                          :<button onClick={()=>{setAssignModal(p);setAssignTo(Array.isArray(p.assignedTo) ? p.assignedTo : (p.assignedTo ? [p.assignedTo] : []));}} style={{background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.25)",borderRadius:7,padding:"4px 10px",fontSize:11,color:"#6366f1",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Assign</button>
                      })()}
                    </td>
                    <td style={{padding:"12px 14px"}}>
                      <ActionBtns onView={()=>setViewProj(p)} onEdit={()=>openEdit(p)} onDelete={()=>setDeleteTarget(p)}/>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <Pagination totalItems={filtered.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
      </SC>

      {viewProj&&(
        <Mdl title="Project Details" onClose={()=>setViewProj(null)} maxWidth={550}>
          <div style={{padding:16,background:"linear-gradient(135deg,#f5f3ff,#faf5ff)",borderRadius:14,border:"1px solid #ede9fe",marginBottom:18}}>
            <div style={{fontSize:18,fontWeight:800,color:T.text,marginBottom:6}}>{viewProj.name}</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
              <Badge label={viewProj.status||"Pending"}/>
              {viewProj.client&&<span style={{fontSize:12,color:"#9333ea",fontWeight:600}}>👥 {viewProj.client}</span>}
            </div>
          </div>
          <InfoRow icon="💰" label="Budget" value={`${viewProj.currency || "₹"} ${viewProj.budget || "0"}`} />
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,marginBottom:5}}>ASSIGNED EMPLOYEES</label>
            {(() => {
              const assignedEmployees = Array.isArray(viewProj.assignedTo) ? viewProj.assignedTo : (viewProj.assignedTo ? [viewProj.assignedTo] : []);
              return assignedEmployees.length > 0
                ?<div style={{display:"flex",flexDirection:"column",gap:6}}>
                   {assignedEmployees.map((emp, idx)=>(
                     <div key={idx} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0"}}>
                       <div style={{width:24,height:24,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#a78bfa)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700,flexShrink:0}}>{emp[0].toUpperCase()}</div>
                       <span style={{color:"#1e0a3c",fontWeight:600,fontSize:12}}>{emp}</span>
                     </div>
                   ))}
                 </div>
                :<div style={{color:"#a78bfa",fontSize:13,fontStyle:"italic"}}>No employees assigned</div>
            })()}
          </div>
          <InfoRow icon="📅" label="Start Date" value={viewProj.start}/>
          <InfoRow icon="🏁" label="End Date" value={viewProj.end}/>
          <InfoRow icon="🎯" label="Purpose" value={viewProj.purpose}/>
          <InfoRow icon="👥" label="Team" value={viewProj.team}/>
          <InfoRow icon="📝" label="Description" value={viewProj.description}/>
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <button onClick={()=>{setViewProj(null);openEdit(viewProj);}} style={{flex:1,padding:"10px",background:"linear-gradient(135deg,#9333ea,#a855f7)",border:"none",borderRadius:10,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>✏️ Edit</button>
            <button onClick={()=>{setViewProj(null);setAssignModal(viewProj);setAssignTo(Array.isArray(viewProj.assignedTo) ? viewProj.assignedTo : (viewProj.assignedTo ? [viewProj.assignedTo] : []));}} style={{flex:1,padding:"10px",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",border:"none",borderRadius:10,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>👤 Assign</button>
            <button onClick={()=>{setViewProj(null);setDeleteTarget(viewProj);}} style={{flex:1,padding:"10px",background:"linear-gradient(135deg,#EF4444,#dc2626)",border:"none",borderRadius:10,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>🗑 Delete</button>
          </div>
        </Mdl>
      )}

      {editProj&&(
        <Mdl title="Edit Project" onClose={()=>setEditProj(null)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}} className="modal-2col">
            <Fld label="Project Name *" value={editForm.name} onChange={v=>{setEditForm(p=>({...p,name:v}));setEditErr(p=>({...p,name:""}));}} error={editErr.name}/>
            <div style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,marginBottom:5}}>CLIENT *</label>
              <ClientDropdown clients={clients} value={editForm.client} onChange={v=>{setEditForm(p=>({...p,client:v}));setEditErr(p=>({...p,client:""}));}} error={editErr.client}/>
              {editErr.client&&<div style={{fontSize:11,color:"#EF4444",marginTop:4}}>⚠️ {editErr.client}</div>}
            </div>
            <Fld label="Purpose" value={editForm.purpose} onChange={v=>setEditForm(p=>({...p,purpose:v}))}/>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>BUDGET</label>
              <div style={{ display: "flex", gap: 8 }}>
                <select 
                  value={editForm.currency} 
                  onChange={e => setEditForm({ ...editForm, currency: e.target.value })} 
                  style={{ width: 70, border: "1.5px solid #ede9fe", borderRadius: 10, padding: "10px", fontSize: 13, color: T.text, background: "#faf5ff", outline: "none" }}
                >
                  {["₹", "$", "€", "£", "¥", "AED", "SAR", "QAR"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input 
                  type="text" 
                  value={editForm.budget} 
                  onChange={e => setEditForm({ ...editForm, budget: e.target.value })} 
                  style={{ flex: 1, border: "1.5px solid #ede9fe", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: T.text, background: "#faf5ff", outline: "none" }} 
                  placeholder="0.00" 
                />
              </div>
            </div>
            <Fld label="Start Date" value={editForm.start} type="date" onChange={v=>setEditForm(p=>({...p,start:v}))}/>
            <Fld label="End Date" value={editForm.end} type="date" onChange={v=>setEditForm(p=>({...p,end:v}))}/>
            <Fld label="Team Members" value={editForm.team} onChange={v=>setEditForm(p=>({...p,team:v}))}/>
            <Fld label="Status" value={editForm.status} onChange={v=>setEditForm(p=>({...p,status:v}))} options={config?.projectStatuses || ["Pending","In Progress","Completed","On Hold"]} allowCustom={true}/>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,marginBottom:5}}>ASSIGN EMPLOYEES</label>
            <div style={{border:"1.5px solid #ede9fe",borderRadius:10,padding:"12px",background:"#faf5ff",maxHeight:200,overflowY:"auto"}}>
              {employees.length===0?<div style={{color:"#a78bfa",fontSize:13,textAlign:"center",padding:"20px"}}>No employees available</div>
                :employees.map(emp=>(
                  <div key={emp._id||emp.email} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid #f5f3ff"}}>
                    <input type="checkbox" 
                      id={`edit-emp-${emp._id||emp.email}`}
                      checked={Array.isArray(editForm.assignedTo) ? editForm.assignedTo.includes(emp.name) : (editForm.assignedTo === emp.name)}
                      onChange={e=>{
                        const currentAssigned = Array.isArray(editForm.assignedTo) ? editForm.assignedTo : (editForm.assignedTo ? [editForm.assignedTo] : []);
                        if(e.target.checked){
                          setEditForm({...editForm,assignedTo:[...currentAssigned,emp.name]});
                        }else{
                          setEditForm({...editForm,assignedTo:currentAssigned.filter(name=>name!==emp.name)});
                        }
                      }}
                      style={{width:16,height:16,cursor:"pointer"}}
                    />
                    <label htmlFor={`edit-emp-${emp._id||emp.email}`} style={{flex:1,cursor:"pointer",fontSize:13,color:"#1e0a3c",display:"flex",alignItems:"center",gap:8}}>
                      <span>{emp.name}</span>
                      {emp.department&&<span style={{fontSize:11,color:"#a78bba",background:"#f3e8ff",padding:"2px 6px",borderRadius:4}}>{emp.department}</span>}
                    </label>
                  </div>
                ))}
            </div>
            {editForm.assignedTo && editForm.assignedTo.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <label style={{ display: "block", fontSize: 10, color: "#a78bfa", fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }}>SELECTED EMPLOYEES ({editForm.assignedTo.length})</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {editForm.assignedTo.map(name => (
                    <div key={name} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f3e8ff", border: "1px solid #ddd6fe", borderRadius: 8, padding: "4px 10px" }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "linear-gradient(135deg,#9333ea,#c084fc)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 8, fontWeight: 700 }}>{name ? name[0].toUpperCase() : "?"}</div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed" }}>{name}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditForm({ ...editForm, assignedTo: editForm.assignedTo.filter(n => n !== name) }); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 14, padding: "0 2px", fontWeight: 700 }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Fld label="Description" value={editForm.description} onChange={v=>setEditForm(p=>({...p,description:v}))}/>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:4}}>
            <button onClick={()=>setEditProj(null)} style={{background:"#f5f3ff",border:"1px solid #ede9fe",color:T.text,borderRadius:10,padding:"10px 16px",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit"}}>Cancel</button>
            <button onClick={saveEdit} disabled={saving} style={{background:"linear-gradient(135deg,#a855f7,#9333ea)",border:"none",borderRadius:10,padding:"10px 20px",fontSize:13,fontWeight:700,color:"#fff",cursor:saving?"not-allowed":"pointer",fontFamily:"inherit",opacity:saving?0.7:1}}>{saving?"Saving…":"Save Changes →"}</button>
          </div>
        </Mdl>
      )}

      {assignModal&&(
        <Mdl title="Assign Employees" onClose={()=>setAssignModal(null)} maxWidth={450}>
          <div style={{marginBottom:18}}>
            <label style={{display:"block",fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,marginBottom:8}}>SELECT EMPLOYEES TO ASSIGN</label>
            <div style={{border:"1.5px solid #ede9fe",borderRadius:10,padding:"12px",background:"#faf5ff",maxHeight:200,overflowY:"auto"}}>
              {employees.length===0?<div style={{color:"#a78bfa",fontSize:13,textAlign:"center",padding:"20px"}}>No employees available</div>
                :employees.map(emp=>(
                  <div key={emp._id||emp.email} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid #f5f3ff"}}>
                    <input type="checkbox" 
                      id={`assign-emp-${emp._id||emp.email}`}
                      checked={Array.isArray(assignTo) ? assignTo.includes(emp.name) : (assignTo === emp.name)}
                      onChange={e=>{
                        const currentAssigned = Array.isArray(assignTo) ? assignTo : (assignTo ? [assignTo] : []);
                        if(e.target.checked){
                          setAssignTo([...currentAssigned,emp.name]);
                        }else{
                          setAssignTo(currentAssigned.filter(name=>name!==emp.name));
                        }
                      }}
                      style={{width:16,height:16,cursor:"pointer"}}
                    />
                    <label htmlFor={`assign-emp-${emp._id||emp.email}`} style={{flex:1,cursor:"pointer",fontSize:13,color:"#1e0a3c",display:"flex",alignItems:"center",gap:8}}>
                      <span>{emp.name}</span>
                      {emp.department&&<span style={{fontSize:11,color:"#a78bba",background:"#f3e8ff",padding:"2px 6px",borderRadius:4}}>{emp.department}</span>}
                    </label>
                  </div>
                ))}
            </div>
            {assignTo && assignTo.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <label style={{ display: "block", fontSize: 10, color: "#a78bfa", fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }}>SELECTED EMPLOYEES ({assignTo.length})</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {assignTo.map(name => (
                    <div key={name} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f3e8ff", border: "1px solid #ddd6fe", borderRadius: 8, padding: "4px 10px" }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "linear-gradient(135deg,#9333ea,#c084fc)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 8, fontWeight: 700 }}>{name ? name[0].toUpperCase() : "?"}</div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed" }}>{name}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setAssignTo(assignTo.filter(n => n !== name)); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 14, padding: "0 2px", fontWeight: 700 }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
            <button onClick={()=>setAssignModal(null)} style={{background:"#f5f3ff",border:"1px solid #ede9fe",color:T.text,borderRadius:10,padding:"10px 16px",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit"}}>Cancel</button>
            <button onClick={doAssign} style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",border:"none",borderRadius:10,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Save Assignment →</button>
          </div>
        </Mdl>
      )}

      {deleteTarget&&<ConfirmModal title="Delete Project" message={`Delete "${deleteTarget.name}"? This cannot be undone.`} onConfirm={doDelete} onCancel={()=>setDeleteTarget(null)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PROJECT STATUS PAGE
// ═══════════════════════════════════════════════════════════
function SearchDropdown({label,items,displayKey,value,onChange,error,placeholder}){
  const [open,setOpen]=useState(false);
  const [search,setSearch]=useState("");
  const filtered=items.filter(i=>(i[displayKey]||"").toLowerCase().includes(search.toLowerCase()));
  return(
    <div style={{marginBottom:14,position:"relative"}}>
      <label style={{display:"block",fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,marginBottom:5}}>{label.toUpperCase()}</label>
      <div onClick={()=>setOpen(!open)} style={{width:"100%",border:`1.5px solid ${error?"#EF4444":open?"#9333ea":"#ede9fe"}`,borderRadius:10,padding:"10px 36px 10px 14px",fontSize:13,color:value?T.text:"#a78bfa",background:"#faf5ff",cursor:"pointer",position:"relative",userSelect:"none",minHeight:42,boxSizing:"border-box"}}>
        {value||placeholder||"-- Select --"}
        <span style={{position:"absolute",right:12,top:"50%",transform:`translateY(-50%) rotate(${open?180:0}deg)`,fontSize:10,color:"#a78bfa",transition:"0.2s"}}>▼</span>
      </div>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#fff",border:"1.5px solid #ede9fe",borderRadius:12,boxShadow:"0 8px 32px rgba(147,51,234,0.15)",zIndex:999,overflow:"hidden"}}>
          <div style={{padding:"8px 10px"}}><input autoFocus placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} onClick={e=>e.stopPropagation()} style={{width:"100%",padding:"7px 10px",border:"1.5px solid #ede9fe",borderRadius:8,fontSize:12,background:"#faf5ff",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/></div>
          <div style={{maxHeight:180,overflowY:"auto"}}>
            {filtered.length===0?<div style={{padding:14,textAlign:"center",color:"#a78bfa",fontSize:13}}>No results</div>
              :filtered.map((item,i)=>{const name=item[displayKey]||"";const isSel=value===name;return(<div key={i} onClick={()=>{onChange(name);setOpen(false);setSearch("");}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",background:isSel?"#f3e8ff":"transparent",borderBottom:"1px solid #f5f3ff"}} onMouseEnter={e=>e.currentTarget.style.background="#faf5ff"} onMouseLeave={e=>e.currentTarget.style.background=isSel?"#f3e8ff":"transparent"}><div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#9333ea,#c084fc)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700,flexShrink:0}}>{name[0]?.toUpperCase()||"?"}</div><span style={{fontSize:13,fontWeight:600,color:T.text}}>{name}</span>{isSel&&<span style={{marginLeft:"auto",color:"#9333ea"}}>✓</span>}</div>);})}
          </div>
        </div>
      )}
      {open&&<div style={{position:"fixed",inset:0,zIndex:998}} onClick={()=>{setOpen(false);setSearch("");}}/>}
      {error&&<div style={{fontSize:11,color:"#EF4444",marginTop:4}}>⚠️ {error}</div>}
    </div>
  );
}

function ProjectStatusPage({clients,employees,managers,config}){
  const EMPTY={projectId:"",name:"",client:"",manager:"",employee:"",deadline:"",status:"In Progress",progress:0,notes:""};
  const [trackList,setTrackList]=useState(TRACKING_SEED);
  const [tsFilter,setTsFilter]=useState("All");
  const [tsSearch,setTsSearch]=useState("");
  const [tsModal,setTsModal]=useState(null);
  const [tsEditId,setTsEditId]=useState(null);
  const [tsForm,setTsForm]=useState(EMPTY);
  const [tsErr,setTsErr]=useState({});
  const [tsSaving,setTsSaving]=useState(false);
  const [tsToast,setTsToast]=useState("");
  const [customStatuses, setCustomStatuses] = useState(config?.projectStatuses || ["In Progress", "Pending", "Completed", "On Hold"]);
  const [newStatus, setNewStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(()=>{axios.get(BASE_URL + "/api/project-status").then(r=>{if(r.data?.length)setTrackList(r.data);}).catch(()=>{});},[]);
  const showToast=(msg)=>{setTsToast(msg);setTimeout(()=>setTsToast(""),2800);};
  const clientNames=clients.map(c=>({name:c.clientName||c.name||""}));
  const managerNames=managers.map(m=>({name:m.managerName||m.name||""}));
  const employeeNames=employees.map(e=>({name:e.name||""}));
  const displayed=trackList.filter(p=>{const okStatus=tsFilter==="All"||p.status===tsFilter;const q=tsSearch.toLowerCase();const okSearch=!q||(p.name||"").toLowerCase().includes(q)||(p.client||"").toLowerCase().includes(q)||(p.projectId||p.id||"").toLowerCase().includes(q);return okStatus&&okSearch;});
  
  useEffect(() => { setCurrentPage(1); }, [tsSearch, tsFilter, trackList.length]);
  const paginated = displayed.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    const unique = Array.from(new Set([...customStatuses, ...trackList.map(p => p.status)]));
    setCustomStatuses(unique.filter(Boolean));
  }, [trackList]);

  const tsStats = customStatuses.slice(0, 5).map(s => ({
    t: s,
    v: trackList.filter(p => p.status === s).length,
    i: s === "Completed" ? "✅" : s === "In Progress" ? "⚡" : s === "Pending" ? "🕐" : "📁",
    c: s === "Completed" ? "#22C55E" : s === "In Progress" ? "#7c3aed" : s === "Pending" ? "#F59E0B" : "#9333ea"
  }));
  const openAdd=()=>{setTsForm(EMPTY);setTsErr({});setTsEditId(null);setTsModal("add");};
  const openEdit=(p)=>{setTsForm({projectId:p.projectId||p.id||"",name:p.name||"",client:p.client||"",manager:p.manager||"",employee:p.employee||"",deadline:p.deadline||"",status:p.status||"In Progress",progress:p.progress||p.pct||0,notes:p.notes||p.note||""});setTsErr({});setTsEditId(p._id||p.id);setTsModal("edit");};
  const saveTs=async()=>{const errs={};if(!tsForm.name.trim())errs.name="Project name required";if(!tsForm.client.trim())errs.client="Client required";if(!tsForm.deadline)errs.deadline="Deadline required";const pv=Number(tsForm.progress);if(isNaN(pv)||pv<0||pv>100)errs.progress="0–100 only";if(Object.keys(errs).length){setTsErr(errs);return;}try{setTsSaving(true);const payload={...tsForm,progress:Number(tsForm.progress)};if(tsModal==="add"){if(!payload.projectId){const maxId=Math.max(...trackList.map(p=>{const match=(p.projectId||p.id||"").match(/PRJ(\d+)/);return match?parseInt(match[1]):0;}),0);payload.projectId=`PRJ${String(maxId+1).padStart(3,"0")}`;}const res=await axios.post(BASE_URL + "/api/project-status",payload);setTrackList(prev=>[res.data,...prev]);}else{const res=await axios.put(`https://mbusiness.octosofttechnologies.in/api/project-status/${tsEditId}`,payload);setTrackList(prev=>prev.map(p=>(p._id||p.id)===tsEditId?res.data:p));}showToast(tsModal==="add"?"✅ Project added!":"✅ Project updated!");setTsModal(null);}catch{if(tsModal==="add"){const local={...tsForm,_id:Date.now().toString(),projectId:tsForm.projectId||`PRJ${String(trackList.length+1).padStart(3,"0")}`,progress:Number(tsForm.progress)};setTrackList(prev=>[local,...prev]);}else{setTrackList(prev=>prev.map(p=>(p._id||p.id)===tsEditId?{...p,...tsForm,progress:Number(tsForm.progress)}:p));}showToast("✅ Saved locally!");setTsModal(null);}finally{setTsSaving(false);}};
  const deleteTs=async(id)=>{if(!window.confirm("Delete?"))return;try{await axios.delete(`https://mbusiness.octosofttechnologies.in/api/project-status/${id}`);}catch{}setTrackList(prev=>prev.filter(p=>(p._id||p.id)!==id));showToast("🗑️ Deleted!");};
  const B2=(color)=>({background:`linear-gradient(135deg,${color},${color}cc)`,color:"#fff",border:"none",borderRadius:10,padding:"8px 16px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"});
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {tsToast&&<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:"#fff",border:"1.5px solid #22c55e",borderRadius:12,padding:"12px 20px",fontSize:13,fontWeight:700,color:"#22c55e",boxShadow:"0 8px 24px rgba(0,0,0,0.12)"}}>{tsToast}</div>}
      <div className="dash-stats" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
        {tsStats.map(({t,v,i,c})=>(<div key={t} style={{background:"#fff",borderRadius:14,padding:"16px 14px",boxShadow:"0 4px 18px rgba(147,51,234,0.07)",border:"1px solid #ede9fe",position:"relative",overflow:"hidden"}}><div style={{width:38,height:38,borderRadius:10,background:`${c}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,marginBottom:8}}>{i}</div><div style={{fontSize:10,color:"#a78bfa",fontWeight:700,letterSpacing:0.5,marginBottom:2}}>{t.toUpperCase()}</div><div style={{fontSize:24,fontWeight:800,color:c}}>{v}</div></div>))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <div style={{position:"relative"}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}>🔍</span><input placeholder="Search…" value={tsSearch} onChange={e=>setTsSearch(e.target.value)} style={{padding:"9px 14px 9px 34px",border:"1.5px solid #ede9fe",borderRadius:10,fontSize:13,background:"#faf5ff",outline:"none",fontFamily:"inherit",width:240,color:T.text}}/></div>
          <button onClick={()=>setTsFilter("All")} style={{padding:"7px 13px",borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:"1.5px solid",borderColor:tsFilter==="All"?"#9333ea":"#ede9fe",background:tsFilter==="All"?"rgba(147,51,234,0.1)":"#fff",color:tsFilter==="All"?"#9333ea":"#a78bfa"}}>All</button>
          {customStatuses.map(f=>(<button key={f} onClick={()=>setTsFilter(f)} style={{padding:"7px 13px",borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:"1.5px solid",borderColor:tsFilter===f?"#9333ea":"#ede9fe",background:tsFilter===f?"rgba(147,51,234,0.1)":"#fff",color:tsFilter===f?"#9333ea":"#a78bfa"}}>{f}</button>))}
        </div>
        <button onClick={openAdd} style={B2("#9333ea")}>+ Add Project Status</button>
      </div>
      <SC title={`Project Status (${displayed.length})`}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:900}}>
            <thead><tr style={{background:"linear-gradient(90deg,#f5f3ff,#faf5ff)"}}>{["ID","Project","Client","Manager","Employee","Deadline","Status","Progress","Notes","Actions"].map(c=>(<th key={c} style={{padding:"10px 12px",textAlign:"left",color:"#7c3aed",fontWeight:700,fontSize:11,borderBottom:"2px solid #ede9fe",whiteSpace:"nowrap"}}>{c.toUpperCase()}</th>))}</tr></thead>
            <tbody>
              {paginated.length===0?<tr><td colSpan={10} style={{padding:40,textAlign:"center",color:"#a78bfa"}}>No projects found</td></tr>
                :paginated.map((p,i)=>(<tr key={p._id||p.id||i} style={{borderBottom:"1px solid #f3f0ff"}} onMouseEnter={e=>e.currentTarget.style.background="#faf5ff"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"11px 12px",fontFamily:"monospace",fontSize:11,color:"#a78bfa"}}>{p.projectId||p.id||`PRJ${String((currentPage-1)*itemsPerPage + i + 1).padStart(3,"0")}`}</td>
                  <td style={{padding:"11px 12px",fontWeight:700,color:T.text}}>{p.name}</td>
                  <td style={{padding:"11px 12px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:22,height:22,borderRadius:"50%",background:"linear-gradient(135deg,#9333ea,#c084fc)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9,fontWeight:700,flexShrink:0}}>{(p.client||"?")[0].toUpperCase()}</div><span style={{color:T.text,fontSize:12}}>{p.client||"—"}</span></div></td>
                  <td style={{padding:"11px 12px",color:"#7c3aed",fontSize:12}}>{p.manager||"—"}</td>
                  <td style={{padding:"11px 12px",color:"#7c3aed",fontSize:12}}>{p.employee||"—"}</td>
                  <td style={{padding:"11px 12px",fontFamily:"monospace",fontSize:12,color:"#a78bfa",whiteSpace:"nowrap"}}>{p.deadline||"—"}</td>
                  <td style={{padding:"11px 12px"}}><Badge label={p.status}/></td>
                  <td style={{padding:"11px 12px",minWidth:130}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,background:"#ede9fe",borderRadius:6,height:7}}><div style={{width:`${p.progress||p.pct||0}%`,background:p.progress===100||p.pct===100?"linear-gradient(90deg,#22C55E,#4ade80)":"linear-gradient(90deg,#9333ea,#c084fc)",borderRadius:6,height:"100%"}}/></div><span style={{fontSize:12,fontWeight:700,color:sc(p.status),width:32,textAlign:"right"}}>{p.progress||p.pct||0}%</span></div></td>
                  <td style={{padding:"11px 12px",maxWidth:180}}><span style={{fontSize:12,color:"#a78bfa",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"block"}} title={p.notes||p.note}>{(p.notes||p.note)?`📝 ${p.notes||p.note}`:"—"}</span></td>
                  <td style={{padding:"11px 12px"}}><ActionBtns onEdit={()=>openEdit(p)} onDelete={()=>deleteTs(p._id||p.id)}/></td>
                </tr>))}
            </tbody>
          </table>
        </div>
        <Pagination totalItems={displayed.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
      </SC>
      {tsModal&&(<Mdl title={tsModal==="add"?"Add Project Status":"Edit Project Status"} onClose={()=>setTsModal(null)}>
        <div className="modal-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}}>
          <Fld label="Project ID" value={tsForm.projectId || "Auto-generated"} onChange={v=>setTsForm({...tsForm,projectId:v})} placeholder="Auto-generated (PRJ001)" disabled={tsModal==="add"}/>
          <Fld label="Project Name *" value={tsForm.name} onChange={v=>{setTsForm({...tsForm,name:v});setTsErr(p=>({...p,name:""}));}} error={tsErr.name}/>
          <div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,marginBottom:5}}>CLIENT *</label><ClientDropdown clients={clientNames.length?clients:[]} value={tsForm.client} onChange={v=>{setTsForm({...tsForm,client:v});setTsErr(p=>({...p,client:""}));}} error={tsErr.client}/>{tsErr.client&&<div style={{fontSize:11,color:"#EF4444",marginTop:4}}>⚠️ {tsErr.client}</div>}</div>
          <SearchDropdown label="Manager" items={managerNames} displayKey="name" value={tsForm.manager} onChange={v=>setTsForm({...tsForm,manager:v})} placeholder="-- Select Manager --"/>
          <SearchDropdown label="Employee" items={employeeNames} displayKey="name" value={tsForm.employee} onChange={v=>setTsForm({...tsForm,employee:v})} placeholder="-- Select Employee --"/>
          <Fld label="Deadline *" value={tsForm.deadline} type="date" onChange={v=>{setTsForm({...tsForm,deadline:v});setTsErr(p=>({...p,deadline:""}));}} error={tsErr.deadline}/>
          <div>
            <label style={{display:"block",fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,marginBottom:5}}>STATUS</label>
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              <select value={tsForm.status} onChange={e=>setTsForm({...tsForm,status:e.target.value})} style={{flex:1,padding:"10px 14px",borderRadius:10,border:"1.5px solid #ede9fe",background:"#faf5ff",fontSize:13,outline:"none"}}>
                {customStatuses.map(s=><option key={s} value={s}>{s}</option>)}
                <option value="custom">+ Add Custom Status</option>
              </select>
            </div>
            {tsForm.status === "custom" && (
              <div style={{display:"flex",gap:8,marginBottom:14}}>
                <input placeholder="Enter new status..." value={newStatus} onChange={e=>setNewStatus(e.target.value)} style={{flex:1,padding:"10px 14px",borderRadius:10,border:"1.5px solid #ede9fe",background:"#faf5ff",fontSize:13,outline:"none"}}/>
                <button onClick={()=>{if(newStatus.trim()){setCustomStatuses(p=>[...new Set([...p,newStatus.trim()])]);setTsForm({...tsForm,status:newStatus.trim()});setNewStatus("");}}} style={{padding:"0 14px",background:"#9333ea",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>Add</button>
              </div>
            )}
          </div>
          <Fld label="Progress (0–100)" value={String(tsForm.progress)} type="number" onChange={v=>{setTsForm({...tsForm,progress:v});setTsErr(p=>({...p,progress:""}));}} error={tsErr.progress} placeholder="e.g. 65"/>
        </div>
        <Fld label="Notes" value={tsForm.notes} onChange={v=>setTsForm({...tsForm,notes:v})} placeholder="Brief update…"/>
        <div style={{background:"#faf5ff",borderRadius:12,padding:"12px 16px",border:"1px solid #ede9fe",marginBottom:14}}>
          <div style={{fontSize:11,color:"#7c3aed",fontWeight:700,marginBottom:8}}>PROGRESS PREVIEW</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,background:"#ede9fe",borderRadius:6,height:8}}><div style={{width:`${Math.min(100,Math.max(0,Number(tsForm.progress)||0))}%`,background:"linear-gradient(90deg,#9333ea,#c084fc)",borderRadius:6,height:"100%",transition:"width 0.3s"}}/></div><span style={{fontSize:13,fontWeight:800,color:"#9333ea",width:36,textAlign:"right"}}>{Math.min(100,Math.max(0,Number(tsForm.progress)||0))}%</span></div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:4}}>
          <button onClick={()=>setTsModal(null)} style={{background:"#f5f3ff",border:"1px solid #ede9fe",color:T.text,borderRadius:10,padding:"10px 16px",cursor:"pointer",fontWeight:600,fontSize:13}}>Cancel</button>
          <button onClick={saveTs} disabled={tsSaving} style={{...B2("#9333ea"),opacity:tsSaving?0.7:1}}>{tsSaving?"Saving…":tsModal==="add"?"Save Project →":"Update Project →"}</button>
        </div>
      </Mdl>)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// INTERVIEW PAGE
// ═══════════════════════════════════════════════════════════
function InterviewPage({companyId,companyName}){
  const CID=companyId||"69b8fe0a6e3d6f1e056f3109";
  const CNAME=companyName||"";
  const STORAGE_KEY=`hr_candidates_${CID}`;
  const API_URL = BASE_URL;
  const [candidates,setCandidates]=useState([]);
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [viewModal,setViewModal]=useState(null);
  const [toast,setToast]=useState("");
  const [linkCopied,setLinkCopied]=useState(false);
  const [loading,setLoading]=useState(true);
  const appLink=`${window.location.origin}/interview-apply/${CNAME.replace(/\s+/g,"-")}-${CID}`;
  useEffect(()=>{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");if(saved.length){setCandidates(saved);setLoading(false);}axios.get(`${BASE_URL}/api/interviews?companyId=${CID}`).then(r=>{const list=r.data?.data||(Array.isArray(r.data)?r.data:[]);if(list.length){setCandidates(list);localStorage.setItem(STORAGE_KEY,JSON.stringify(list));}}).catch(()=>{}).finally(()=>setLoading(false));},[CID]);
  const persist=(list)=>{setCandidates(list);localStorage.setItem(STORAGE_KEY,JSON.stringify(list));};
  const showToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(""),2800);};
  const copyLink = async () => {
  try {
      const companySlug = `${companyName}-${companyId}`.replace(/\s+/g, "-");
    const link = `${window.location.origin}/interview-apply/${companySlug}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(link);
    } else {
      const el = document.createElement("textarea");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    showToast("✅ Link copied!");
  } catch (err) {
    console.error("Copy failed:", err);
    showToast("❌ Copy failed. Please copy manually.");
  }
};
  const updateStatus=(idx,val)=>{const updated=[...candidates];updated[idx]={...updated[idx],status:val};persist(updated);const c=updated[idx];const id=c._id||c.id;if(id)axios.patch(`${API_URL}/api/interviews/${id}/status`,{status:val},{headers:{"Content-Type":"application/json"}}).catch(()=>{});showToast(`✅ Status → "${val}"`);if(viewModal&&(viewModal._id||viewModal.id)===id)setViewModal(updated[idx]);};
  const deleteCandidate=(idx)=>{if(!window.confirm("Delete this candidate?"))return;const c=candidates[idx];const id=c._id||c.id;if(id)axios.delete(`${API_URL}/api/interviews/${id}`).catch(()=>{});persist(candidates.filter((_,i)=>i!==idx));showToast("🗑️ Deleted");setViewModal(null);};
  const fmt=(iso)=>iso?new Date(iso).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—";
  const displayed=candidates.filter(c=>{const okF=filter==="all"||(c.status||"pending").toLowerCase()===filter;const q=search.toLowerCase();const okS=!q||(c.name||"").toLowerCase().includes(q)||(c.role||"").toLowerCase().includes(q)||(c.email||"").toLowerCase().includes(q)||(c.mobile||"").includes(q);return okF&&okS;});
  const counts={total:candidates.length,pending:candidates.filter(c=>(c.status||"pending").toLowerCase()==="pending").length,hired:candidates.filter(c=>(c.status||"").toLowerCase()==="hired").length,rejected:candidates.filter(c=>(c.status||"").toLowerCase()==="rejected").length};
  const sColor={pending:"#F59E0B",hired:"#22C55E",rejected:"#EF4444"};
  const sC=(s="pending")=>sColor[s.toLowerCase()]||"#a855f7";
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {toast&&<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:"#fff",border:"1.5px solid #22c55e",borderRadius:12,padding:"12px 20px",fontSize:13,fontWeight:700,color:"#22c55e",boxShadow:"0 8px 24px rgba(0,0,0,0.12)"}}>{toast}</div>}
      <div style={{background:"linear-gradient(135deg,#1e0a3c,#2d1057)",borderRadius:16,padding:"20px 24px",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap",boxShadow:"0 8px 24px rgba(59,7,100,0.25)"}}>
        <div style={{width:42,height:42,borderRadius:12,background:"rgba(147,51,234,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🔗</div>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:10,color:"rgba(255,255,255,0.5)",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Candidate Application Link</div><div style={{fontSize:12,color:"#c084fc",fontFamily:"monospace",wordBreak:"break-all"}}>{appLink}</div></div>
        <div style={{display:"flex",gap:8,flexShrink:0}}>
          <button onClick={copyLink} style={{background:linkCopied?"rgba(34,197,94,0.2)":"rgba(147,51,234,0.25)",border:`1px solid ${linkCopied?"rgba(34,197,94,0.5)":"rgba(147,51,234,0.5)"}`,borderRadius:9,padding:"9px 16px",color:linkCopied?"#4ade80":"#c084fc",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{linkCopied?"✅ Copied!":"📋 Copy Link"}</button>
          <button onClick={()=>window.open(appLink,"_blank")} style={{background:"linear-gradient(135deg,#9333ea,#a855f7)",border:"none",borderRadius:9,padding:"9px 16px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>👁 Preview Form</button>
        </div>
      </div>
      <div className="dash-stats" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[{t:"Total",v:counts.total,i:"🎯",c:"#9333ea"},{t:"Pending",v:counts.pending,i:"⏳",c:"#F59E0B"},{t:"Hired",v:counts.hired,i:"✅",c:"#22C55E"},{t:"Rejected",v:counts.rejected,i:"❌",c:"#EF4444"}].map(({t,v,i,c})=>(<div key={t} style={{background:"#fff",borderRadius:14,padding:"18px 16px",boxShadow:"0 4px 18px rgba(147,51,234,0.07)",border:"1px solid #ede9fe",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${c},${c}88)`}}/><div style={{width:36,height:36,borderRadius:10,background:`${c}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,marginBottom:8}}>{i}</div><div style={{fontSize:10,color:"#a78bfa",fontWeight:700,letterSpacing:0.5,marginBottom:2}}>{t.toUpperCase()}</div><div style={{fontSize:26,fontWeight:800,color:c}}>{v}</div></div>))}
      </div>
      <div style={{background:"#fff",borderRadius:16,padding:22,boxShadow:"0 4px 24px rgba(147,51,234,0.08)",border:"1px solid #ede9fe"}}>
        <h3 style={{margin:"0 0 16px",fontSize:15,fontWeight:700,color:"#1e0a3c"}}>All Candidates ({displayed.length})</h3>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
          <div style={{position:"relative",flex:1,minWidth:200}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}>🔍</span><input placeholder="Search name, role, email, mobile..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",padding:"9px 14px 9px 34px",border:"1.5px solid #ede9fe",borderRadius:10,fontSize:13,background:"#faf5ff",outline:"none",fontFamily:"inherit",color:"#1e0a3c",boxSizing:"border-box"}}/></div>
          {["all","pending","hired","rejected"].map(f=>(<button key={f} onClick={()=>setFilter(f)} style={{padding:"7px 14px",borderRadius:20,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:"1.5px solid",borderColor:filter===f?(f==="all"?"#9333ea":sC(f)):"#ede9fe",background:filter===f?`${f==="all"?"#9333ea":sC(f)}15`:"#fff",color:filter===f?(f==="all"?"#9333ea":sC(f)):"#a78bfa",transition:"all 0.15s"}}>{f==="all"?"🎯 All":f==="pending"?"⏳ Pending":f==="hired"?"✅ Hired":"❌ Rejected"}</button>))}
        </div>
        {loading?(<div style={{textAlign:"center",padding:50,color:"#a78bfa"}}>Loading candidates...</div>):paginated.length===0?(<div style={{textAlign:"center",padding:"50px 20px",color:"#a78bfa"}}><div style={{fontSize:48,marginBottom:12}}>📭</div><div style={{fontSize:15,fontWeight:700,color:"#1e0a3c",marginBottom:6}}>{candidates.length===0?"No applications yet":"No results found"}</div></div>):(
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:950}}>
              <thead><tr style={{background:"linear-gradient(90deg,#f5f3ff,#faf5ff)"}}>{["#","Candidate","Contact","Experience","Role","Interviewer","Date","Status","Resume","Actions"].map(h=>(<th key={h} style={{padding:"10px 12px",textAlign:"left",color:"#7c3aed",fontWeight:700,fontSize:10,borderBottom:"2px solid #ede9fe",whiteSpace:"nowrap"}}>{h.toUpperCase()}</th>))}</tr></thead>
              <tbody>
                {paginated.map((c,i)=>{const idx=candidates.indexOf(c);const status=(c.status||"pending").toLowerCase();const resumeUrl=c.resumeUrl||(c.resumePath?`https://mbusiness.octosofttechnologies.in/uploads/resumes/${c.resumePath.split(/[\\/]/).pop()}`:null);
const finalResumeUrl=resumeUrl;return(
                  <tr key={c._id||c.id||i} style={{borderBottom:"1px solid #f3f0ff",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="#faf5ff"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"12px 12px",color:"#a78bfa",fontSize:11,fontFamily:"monospace"}}>{String((currentPage-1)*itemsPerPage + i + 1).padStart(3,"0")}</td>
                    <td style={{padding:"12px 12px"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#9333ea,#c084fc)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:700,flexShrink:0}}>{(c.name||"?")[0].toUpperCase()}</div><span style={{fontWeight:700,color:"#1e0a3c"}}>{c.name||"—"}</span></div></td>
                    <td style={{padding:"12px 12px"}}><div style={{fontSize:12,color:"#7c3aed"}}>{c.email||"—"}</div><div style={{fontSize:11,color:"#a78bfa",marginTop:2}}>{c.mobile||""}</div></td>
                    <td style={{padding:"12px 12px"}}>{(c.experience||"").toLowerCase()==="fresher"?<span style={{background:"rgba(34,197,94,0.12)",color:"#22C55E",border:"1px solid rgba(34,197,94,0.25)",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>🎓 Fresher</span>:<span style={{background:"rgba(147,51,234,0.12)",color:"#9333ea",border:"1px solid rgba(147,51,234,0.25)",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>💼 {c.years||"?"}yrs</span>}</td>
                    <td style={{padding:"12px 12px",fontWeight:600,color:"#1e0a3c",fontSize:12}}>{c.role||"—"}</td>
                    <td style={{padding:"12px 12px",fontSize:12,color:"#7c3aed"}}>{c.interviewerName||<span style={{color:"#ddd"}}>—</span>}</td>
                    <td style={{padding:"12px 12px",fontSize:12,color:"#a78bfa",fontFamily:"monospace",whiteSpace:"nowrap"}}>{fmt(c.date||c.createdAt)}</td>
                    <td style={{padding:"12px 12px"}}><select value={status} onChange={e=>updateStatus(idx,e.target.value)} style={{background:status==="hired"?"rgba(34,197,94,0.1)":status==="rejected"?"rgba(239,68,68,0.1)":"rgba(245,158,11,0.1)",border:`1.5px solid ${sC(status)}44`,borderRadius:8,padding:"5px 10px",color:sC(status),fontSize:12,fontWeight:700,cursor:"pointer",outline:"none",fontFamily:"inherit"}}><option value="pending">⏳ Pending</option><option value="hired">✅ Hired</option><option value="rejected">❌ Rejected</option></select></td>
                    <td style={{padding:"12px 12px"}}>{finalResumeUrl?<button onClick={()=>setViewModal({...c,_resolvedResumeUrl:finalResumeUrl})} style={{background:"rgba(147,51,234,0.1)",border:"1px solid rgba(147,51,234,0.3)",borderRadius:8,padding:"6px 12px",fontSize:12,color:"#9333ea",cursor:"pointer",fontWeight:700,fontFamily:"inherit",whiteSpace:"nowrap"}}>📄 View</button>:<span style={{fontSize:11,color:"#ddd"}}>—</span>}</td>
                    <td style={{padding:"12px 12px"}}><div style={{display:"flex",gap:5}}><button onClick={()=>setViewModal({...c,_resolvedResumeUrl:finalResumeUrl})} style={{background:"#f5f3ff",border:"1px solid #ede9fe",borderRadius:7,padding:"5px 10px",fontSize:12,color:"#7c3aed",cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>👤</button><button onClick={()=>deleteCandidate(idx)} style={{background:"#fee2e2",border:"1px solid #fecaca",borderRadius:7,padding:"5px 10px",fontSize:12,color:"#ef4444",cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>🗑</button></div></td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        )}
        <Pagination totalItems={displayed.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
      </div>
      {viewModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(59,7,100,0.55)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:820,maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(147,51,234,0.25)"}}>
            <div style={{padding:"16px 22px",borderBottom:"1px solid #ede9fe",display:"flex",justifyContent:"space-between",alignItems:"center",background:"linear-gradient(90deg,#f5f3ff,#faf5ff)",flexShrink:0}}>
              <h2 style={{margin:0,fontSize:16,fontWeight:800,color:"#1e0a3c"}}>👤 Candidate Profile</h2>
              <button onClick={()=>setViewModal(null)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#7c3aed",padding:"4px 8px"}}>✕</button>
            </div>
            <div style={{overflowY:"auto",padding:"20px 22px",flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:14,padding:16,background:"linear-gradient(135deg,#f5f3ff,#faf5ff)",borderRadius:14,border:"1px solid #ede9fe",marginBottom:18}}>
                <div style={{width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,#9333ea,#c084fc)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:20,fontWeight:800,flexShrink:0}}>
                  {(viewModal.name||"?")[0].toUpperCase()}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:17,fontWeight:800,color:"#1e0a3c"}}>{viewModal.name}</div>
                  <div style={{fontSize:13,color:"#9333ea",fontWeight:600,marginTop:2}}>{viewModal.role||"—"}</div>
                </div>
                <span style={{background:`${sC(viewModal.status||"pending")}18`,color:sC(viewModal.status||"pending"),border:`1px solid ${sC(viewModal.status||"pending")}33`,padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:700}}>
                  {(viewModal.status||"pending")==="pending"?"⏳ Pending":(viewModal.status||"")==="hired"?"✅ Hired":"❌ Rejected"}
                </span>
              </div>
              
              {viewModal._resolvedResumeUrl && (
                <div style={{marginBottom:20}}>
                  <h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:700,color:"#1e0a3c"}}>📄 Resume</h3>
                  <div style={{border:"1.5px solid #ede9fe",borderRadius:12,overflow:"hidden",background:"#faf5ff"}}>
                    <iframe 
                      src={viewModal._resolvedResumeUrl} 
                      style={{width:"100%",height:"500px",border:"none"}} 
                      title="Resume"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const errorDiv = document.createElement('div');
                        errorDiv.style.cssText = 'padding: 50px; text-align: center; color: #ef4444; font-size: 14px; background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 12px; margin: 20px;';
                        errorDiv.innerHTML = '📄 Resume file not found<br><span style="font-size: 12px; color: #991b1b;">The resume file may have been deleted or moved</span>';
                        e.target.parentNode.appendChild(errorDiv);
                      }}
                    />
                    <div style={{padding:"12px",background:"#fff",borderTop:"1px solid #ede9fe",display:"flex",justifyContent:"center"}}>
                      <a href={viewModal._resolvedResumeUrl} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,background:"#9333ea",color:"#fff",padding:"8px 16px",borderRadius:8,textDecoration:"none",fontSize:13,fontWeight:600,fontFamily:"inherit"}}>
                        🔗 Open in New Tab
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>
                <div style={{padding:12,background:"#f5f3ff",borderRadius:10,border:"1px solid #ede9fe"}}>
                  <div style={{fontSize:11,color:"#7c3aed",fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>📧 Email</div>
                  <div style={{fontSize:13,fontWeight:600,color:"#1e0a3c"}}>{viewModal.email||"—"}</div>
                </div>
                <div style={{padding:12,background:"#f5f3ff",borderRadius:10,border:"1px solid #ede9fe"}}>
                  <div style={{fontSize:11,color:"#7c3aed",fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>📱 Mobile</div>
                  <div style={{fontSize:13,fontWeight:600,color:"#1e0a3c"}}>{viewModal.mobile||"—"}</div>
                </div>
                <div style={{padding:12,background:"#f5f3ff",borderRadius:10,border:"1px solid #ede9fe"}}>
                  <div style={{fontSize:11,color:"#7c3aed",fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>💼 Experience</div>
                  <div style={{fontSize:13,fontWeight:600,color:"#1e0a3c"}}>
                    {(viewModal.experience||"").toLowerCase()==="fresher"?"🎓 Fresher":`💼 ${viewModal.years||"?"} years`}
                  </div>
                </div>
                <div style={{padding:12,background:"#f5f3ff",borderRadius:10,border:"1px solid #ede9fe"}}>
                  <div style={{fontSize:11,color:"#7c3aed",fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>📅 Applied Date</div>
                  <div style={{fontSize:13,fontWeight:600,color:"#1e0a3c"}}>{fmt(viewModal.date||viewModal.createdAt)}</div>
                </div>
                <div style={{padding:12,background:"#f5f3ff",borderRadius:10,border:"1px solid #ede9fe"}}>
                  <div style={{fontSize:11,color:"#7c3aed",fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>👨‍💼 Interviewer</div>
                  <div style={{fontSize:13,fontWeight:600,color:"#1e0a3c"}}>{viewModal.interviewerName||"—"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PROFILE MODAL
// ═══════════════════════════════════════════════════════════
function ProfileModal({user,setUser,onClose,onLogout,companyLogo,onLogoChange}){
  const logoRef=useRef();
  const displayName=user?.name||user?.email?.split("@")[0]||"Admin";
  const initials=displayName.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
  
  const [editCN, setEditCN] = useState(false);
  const [newCN, setNewCN] = useState(user?.companyName || "");
  const [savingCN, setSavingCN] = useState(false);

  const saveCN = async () => {
    if(!newCN.trim()) return alert("Company name cannot be empty");
    try {
      setSavingCN(true);
      await axios.post(BASE_URL + "/api/auth/save-company-name", {
        userId: user.id || user._id,
        companyName: newCN.trim()
      });
      const updatedUser = { ...user, companyName: newCN.trim() };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditCN(false);
    } catch (e) {
      alert("Failed to save company name");
    } finally {
      setSavingCN(false);
    }
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(59,7,100,0.6)",backdropFilter:"blur(10px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:22,width:"100%",maxWidth:420,maxHeight:"90vh",boxShadow:"0 32px 80px rgba(147,51,234,0.3)",display:"flex",flexDirection:"column",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:"linear-gradient(135deg,#7c3aed,#a855f7,#c084fc)",padding:"28px 28px 22px",textAlign:"center",flexShrink:0}}>
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,0.2)",border:"none",width:30,height:30,borderRadius:8,color:"#fff",fontSize:16,cursor:"pointer"}}>✕</button>
          <div style={{width:72,height:72,borderRadius:16,background:"rgba(255,255,255,0.22)",border:"3px solid rgba(255,255,255,0.45)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",overflow:"hidden"}}>
            {companyLogo?<img src={companyLogo} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain",padding:5,background:"#fff"}}/>:<span style={{fontSize:24,fontWeight:800,color:"#fff"}}>{initials}</span>}
          </div>
          <h2 style={{margin:0,fontSize:18,fontWeight:800,color:"#fff"}}>{displayName}</h2>
          <p style={{margin:"4px 0 0",fontSize:12,color:"rgba(255,255,255,0.65)"}}>{user?.email||"—"}</p>
          <span style={{display:"inline-block",marginTop:8,background:"rgba(255,255,255,0.18)",border:"1px solid rgba(255,255,255,0.28)",borderRadius:100,padding:"3px 12px",fontSize:10,fontWeight:700,color:"#fff",letterSpacing:1,textTransform:"uppercase"}}>{user?.role||"user"}</span>
        </div>
        <div style={{padding:"18px 24px",overflowY:"auto",flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#fef2f2",borderRadius:9,border:"1px solid #fecaca",marginBottom:12}}>
            <div style={{width:32,height:32,borderRadius:8,background:"rgba(239,68,68,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>🏢</div>
            <div style={{flex:1}}>
              <div style={{fontSize:10,color:"#ef4444",fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"}}>Company Name</div>
              {editCN ? (
                <div style={{display:"flex",gap:8,marginTop:4}}>
                  <input value={newCN} onChange={e=>setNewCN(e.target.value)} style={{flex:1,padding:"6px 10px",fontSize:13,border:"1px solid #ddd",borderRadius:6,outline:"none"}} autoFocus/>
                  <button onClick={saveCN} disabled={savingCN} style={{padding:"4px 10px",background:"#22C55E",color:"#fff",border:"none",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer"}}>{savingCN?"...":"SAVE"}</button>
                </div>
              ) : (
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#1e0a3c",marginTop:1}}>{user?.companyName || ""}</div>
                  {(user?.role === "admin" || user?.role === "subadmin") && <button onClick={()=>setEditCN(true)} style={{background:"none",border:"none",color:"#7c3aed",fontSize:11,fontWeight:700,cursor:"pointer"}}>EDIT</button>}
                </div>
              )}
            </div>
          </div>

          {[{icon:"👤",label:"Full Name",value:displayName},{icon:"📧",label:"Email",value:user?.email||"—"},{icon:"📱",label:"Phone",value:user?.phone||"—"},{icon:"🎭",label:"Role",value:user?.role||"user"},{icon:"🔑",label:"User ID",value:(user?.id||user?._id)?`#${String(user?.id||user?._id).slice(-8).toUpperCase()}`:"—"}].map(({icon,label,value})=>(
            <div key={label} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#faf5ff",borderRadius:9,border:"1px solid #ede9fe",marginBottom:7}}>
              <div style={{width:32,height:32,borderRadius:8,background:"rgba(147,51,234,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{icon}</div>
              <div><div style={{fontSize:10,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"}}>{label}</div><div style={{fontSize:13,fontWeight:600,color:"#1e0a3c",marginTop:1}}>{value}</div></div>
            </div>
          ))}
        </div>
        <div style={{padding:"12px 24px 18px",borderTop:"1px solid #ede9fe",flexShrink:0}}>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} style={{flex:1,padding:"10px",background:"#f5f3ff",border:"1px solid #ede9fe",borderRadius:9,fontSize:13,fontWeight:600,color:"#1e0a3c",cursor:"pointer",fontFamily:"inherit"}}>Close</button>
            <button onClick={()=>logoRef.current.click()} style={{flex:1,padding:"10px",background:"linear-gradient(135deg,#9333ea,#a855f7)",border:"none",borderRadius:9,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>📷 Upload Logo</button>
            <button onClick={onLogout} style={{flex:1,padding:"10px",background:"linear-gradient(135deg,#EF4444,#dc2626)",border:"none",borderRadius:9,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>🚪 Logout</button>
          </div>
        </div>
        <input ref={logoRef} type="file" accept="image/*" style={{display:"none"}}
          onChange={async(e)=>{const file=e.target.files[0];if(!file)return;const formData=new FormData();formData.append("file",file);try{const cloudRes=await axios.post(BASE_URL + "/api/upload/logo",formData);const uploadedUrl=cloudRes.data.logoUrl;await axios.post(BASE_URL + "/api/auth/save-logo",{userId:user.id||user._id,logoUrl:uploadedUrl});const updatedUser={...user,logoUrl:uploadedUrl};localStorage.setItem("user",JSON.stringify(updatedUser));setUser(updatedUser);onLogoChange(uploadedUrl);}catch(err){console.error(err);alert("Upload failed!");}}}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════
function Sidebar({active,setActive,onLogout,open,onClose,navItems,initials,companyName}){
  const items=navItems||NAV;
  return(
    <>
      {open&&<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:998,display:"block"}} className="mob-overlay"/>}
      <div style={{width:225,background:"linear-gradient(180deg,#1e0a3c 0%,#2d1057 60%,#1e0a3c 100%)",color:"#fff",display:"flex",flexDirection:"column",height:"100vh",position:"fixed",top:0,left:0,zIndex:999,flexShrink:0,overflow:"hidden",boxShadow:"4px 0 24px rgba(0,0,0,0.25)",transform:open?"translateX(0)":"translateX(-100%)",transition:"transform 0.28s cubic-bezier(0.4,0,0.2,1)"}} className="sidebar">
        <div style={{padding:"18px 16px 14px",borderBottom:"1px solid rgba(255,255,255,0.08)",position:"relative",zIndex:1,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,background:"linear-gradient(135deg,#9333ea,#c084fc)",borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:17,color:"#fff",boxShadow:"0 4px 14px rgba(147,51,234,0.5)"}}>
              {initials || "M"}
            </div>
            <div><div style={{fontWeight:800,fontSize:14,color:"#fff"}}>{companyName || "Your Business"}</div><div style={{fontSize:8,color:"rgba(255,255,255,0.35)",letterSpacing:1.5,marginTop:1}}>MANAGEMENT SUITE</div></div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:18,cursor:"pointer",padding:"2px 6px",lineHeight:1}} className="sidebar-close">✕</button>
        </div>
        <nav style={{flex:1,minHeight:0,padding:"10px 8px",overflowY:"auto",position:"relative",zIndex:1}}>
          {items.map(n=>{const on=active===n.key;return(<button key={n.key} onClick={()=>{setActive(n.key);onClose();}} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"9px 12px",background:on?"linear-gradient(90deg,rgba(147,51,234,0.35),rgba(168,85,247,0.15))":"transparent",border:on?"1px solid rgba(168,85,247,0.35)":"1px solid transparent",borderRadius:11,color:on?"#e9d5ff":"rgba(255,255,255,0.45)",fontWeight:on?700:400,fontSize:12.5,cursor:"pointer",marginBottom:2,textAlign:"left",fontFamily:"inherit"}}><span style={{fontSize:15}}>{n.icon}</span><span style={{flex:1}}>{n.label}</span>{on&&<div style={{width:5,height:5,borderRadius:"50%",background:"#c084fc",flexShrink:0}}/>}</button>);})}
        </nav>
        <div style={{padding:"10px 8px 14px",borderTop:"1px solid rgba(255,255,255,0.07)",position:"relative",zIndex:1,flexShrink:0}}>
          <button onClick={onLogout} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:9,padding:"10px 12px",background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.35)",borderRadius:11,color:"#fca5a5",fontSize:12.5,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>🚪 Logout</button>
        </div>
      </div>
      <div className="sidebar-spacer" style={{width:225,flexShrink:0}}/>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════
export default function Dashboard({setUser,user,fixedLogo}){
  const [active,setActive]=useState("dashboard");
  const [modal,setModal]=useState(null);
  const [showProfile,setShowProfile]=useState(false);
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [companyLogo,setCompanyLogo]=useState(user?.logoUrl?user.logoUrl:(fixedLogo||null));
  useEffect(()=>{setCompanyLogo(user?.logoUrl?user.logoUrl:(fixedLogo||null));},[user,fixedLogo]);

  const [clients,setClients]=useState([]);
  const [nc,setNc] = useState({name:"",company:"",email:"",phone:"",address:"",project:"",password:"",status:"Active",contactPersonName:"",contactPersonNo:"",gstNumber:"",logoUrl:""});
  const [ncError,setNcError]=useState({});
  const [saveLoading,setSaveLoading]=useState(false);
  const [showClientPass,setShowClientPass]=useState(false);
  const [clientSuccessData, setClientSuccessData] = useState(null);

  const [employees,setEmployees]=useState([]);
  const [ne,setNe]=useState({name:"",email:"",phone:"",role:"",department:"",salary:"",status:"Active",password:""});
  const [showEmpPass,setShowEmpPass]=useState(false);
  const [neError,setNeError]=useState({});
  const [empSaveLoading,setEmpSaveLoading]=useState(false);

  const [projects,setProjects]=useState([]);
  const [np,setNp]=useState({name:"",client:"",purpose:"",description:"",start:"",end:"",budget:"",currency: "₹",team:"",status:"Pending",assignedTo:[]});
  const [npError,setNpError]=useState({});
  const [projSaveLoading,setProjSaveLoading]=useState(false);

  const [managers,setManagers]=useState([]);
  const [nm,setNm]=useState({managerName:"",email:"",phone:"",department:"",role:"Manager",address:"",password:"",status:"Active"});
  const [nmError,setNmError]=useState({});
  const [mgrSaveLoading,setMgrSaveLoading]=useState(false);
  const [showMgrPass,setShowMgrPass]=useState(false);
  const [tasks,setTasks]=useState([]);
  const [config,setConfig]=useState(null);
  const [viewProject,setViewProject]=useState(null);

  useEffect(()=>{fetchClients();fetchEmployees();fetchProjects();fetchManagers();fetchTasks();fetchConfig();},[]);

  const handleLogout=()=>{localStorage.removeItem("user");setUser(null);};
  const onLogoChange=async(logo)=>{setCompanyLogo(logo||fixedLogo);const updatedUser={...user,logoUrl:logo||""};localStorage.setItem("user",JSON.stringify(updatedUser));setUser(updatedUser);try{await axios.post(BASE_URL + "/api/auth/save-logo",{userId:user._id||user.id,logoUrl:logo||""});}catch(e){console.log(e);}};

  const fetchClients=async()=>{try{const res=await axios.get(BASE_URL + "/api/clients");setClients(res.data);}catch(e){console.log(e);}};
  const fetchEmployees=async()=>{try{const res=await axios.get(BASE_URL + "/api/employees");setEmployees(res.data);}catch(e){console.log(e);}};
  const fetchProjects=async()=>{try{const res=await axios.get(BASE_URL + "/api/projects");setProjects(res.data);}catch(e){console.log(e);}};
  const fetchManagers=async()=>{try{const res=await axios.get(BASE_URL + "/api/managers");setManagers(res.data);}catch(e){console.log(e);}};
  const fetchTasks=async()=>{try{const res=await axios.get(BASE_URL + "/api/tasks");setTasks(res.data);}catch(e){console.log(e);}};
  const fetchConfig=async()=>{try{const cid=user?._id||user?.id;if(!cid)return;const res=await axios.get(`${BASE_URL}/api/config/${cid}`);setConfig(res.data);}catch(e){console.log(e);}};

  const addClient=async()=>{
    const errors={};
    if(!nc.name.trim())errors.name="Name is required";
    if(!nc.email.trim())errors.email="Email is required";
    if(!nc.password.trim())errors.password="Password is required";
    if(Object.keys(errors).length>0){setNcError(errors);return;}
    try{
      setSaveLoading(true);
      const payload={
        clientName:nc.name,
        companyName:nc.company,
        email:nc.email,
        phone:nc.phone,
        address:nc.address,
        password:nc.password,
        status:nc.status,
        contactPersonName:nc.contactPersonName,
        contactPersonNo:nc.contactPersonNo,
        gstNumber:nc.gstNumber,
        logoUrl:nc.logoUrl
      };
      const res=await axios.post(BASE_URL + "/api/clients/add",payload);
      setClients(prev=>[res.data.client,...prev]);
      setClientSuccessData({ email: nc.email, password: nc.password, name: nc.name });
      setNc({name:"",company:"",email:"",phone:"",address:"",project:"",password:"",status:"Active",gstNumber:"",logoUrl:""});
      setNcError({});
    }catch(err){
      setNcError({email:err.response?.data?.message||err.response?.data?.msg||"Failed to save"});
    }finally{
      setSaveLoading(false);
    }
  };

  const addEmployee=async()=>{const errors={};if(!ne.name.trim())errors.name="Name is required";if(!ne.email.trim())errors.email="Email is required";if(!ne.password.trim())errors.password="Password is required";if(Object.keys(errors).length>0){setNeError(errors);return;}try{setEmpSaveLoading(true);const res=await axios.post(BASE_URL + "/api/employees/add",ne);setEmployees(prev=>[res.data.employee,...prev]);setNe({name:"",email:"",phone:"",role:"",department:"",salary:"",status:"Active",password:""});setShowEmpPass(false);setNeError({});setModal(null);}catch(err){setNeError({email:err.response?.data?.message||err.response?.data?.msg||"Failed to save"});}finally{setEmpSaveLoading(false);}};

  const addProject=async()=>{
    const errors={};
    if(!np.name.trim())errors.name="Project name is required";
    if(!np.client.trim())errors.client="Client is required";
    if(Object.keys(errors).length>0){
      setNpError(errors);
      return;
    }
    try{
      setProjSaveLoading(true);
      const res=await axios.post(BASE_URL + "/api/projects/add", np);
      await fetchProjects();
      setNp({name:"",client:"",purpose:"",description:"",start:"",end:"",budget:"",team:"",status:"Pending",assignedTo:[]});
      setNpError({});
      setModal(null);
      toast.success("✅ Project created successfully!");
    }catch(err){
      const errorMsg = err.response?.data?.msg || err.response?.data?.error || "Failed to save project";
      if(err.response?.data?.errors && Array.isArray(err.response.data.errors)){
        setNpError({name: err.response.data.errors.join(", ")});
      }else{
        setNpError({name: errorMsg});
      }
      toast.error(`❌ ${errorMsg}`);
    }finally{
      setProjSaveLoading(false);
    }
  };

  const addManager=async()=>{const errors={};if(!nm.managerName.trim())errors.managerName="Name is required";if(!nm.email.trim())errors.email="Email is required";if(!nm.password.trim())errors.password="Password is required";if(Object.keys(errors).length>0){setNmError(errors);return;}try{setMgrSaveLoading(true);const res=await axios.post(BASE_URL + "/api/managers/add",nm);setManagers(prev=>[res.data.manager,...prev]);setNm({managerName:"",email:"",phone:"",department:"",role:"Manager",address:"",password:"",status:"Active"});setNmError({});setModal(null);}catch(err){setNmError({email:err.response?.data?.message||err.response?.data?.msg||"Failed to save"});}finally{setMgrSaveLoading(false);}};

  const navItems=getNavForRole(user?.role);
  const validActive=navItems.find(n=>n.key===active)?active:navItems[0]?.key||"dashboard";
  const page=navItems.find(n=>n.key===validActive)||navItems[0];
  useEffect(()=>{if(validActive!==active)setActive(validActive);},[user?.role]);

  const displayName = user?.companyName || "Your Business";
  const initials = (displayName || "YB").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const B=(color)=>({background:`linear-gradient(135deg,${color},${color}cc)`,color:"#fff",border:"none",borderRadius:10,padding:"8px 16px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"});

  const companyId=user?.companyId||user?.company||user?._id||user?.id||"default";
  const companyNameStr = user?.companyName || "Your Business";

  return(
    <div style={{display:"flex",minHeight:"100vh",background:"linear-gradient(135deg,#f5f3ff 0%,#faf5ff 50%,#f3e8ff 100%)",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:#d8b4fe;border-radius:3px}
        button,input,select,textarea{font-family:inherit}
        @media(min-width:769px){.sidebar{transform:translateX(0)!important;position:sticky!important;top:0!important;}.sidebar-close{display:none!important;}.mob-overlay{display:none!important;}.mob-topbar{display:none!important;}.sidebar-spacer{display:none!important;}}
        @media(max-width:768px){.sidebar-spacer{display:none!important;}.mob-topbar-hide{display:none!important;}.main-content{padding:12px!important;}.dash-stats{grid-template-columns:repeat(2,1fr)!important;gap:10px!important;}.dash-2col{grid-template-columns:1fr!important;}.modal-2col{grid-template-columns:1fr!important;}.page-header{flex-wrap:wrap;gap:8px;}.header-actions{flex-wrap:wrap;gap:8px;}}
      `}</style>

      <Sidebar active={validActive} setActive={setActive} onLogout={handleLogout} open={sidebarOpen} onClose={()=>setSidebarOpen(false)} navItems={navItems} initials={initials} companyName={companyNameStr}/>

      <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column"}}>
        <div className="mob-topbar" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:"#fff",borderBottom:"1px solid #ede9fe",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px rgba(147,51,234,0.07)"}}>
          <button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#7c3aed",padding:"2px 6px",lineHeight:1}}>☰</button>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:30,height:30,background:"linear-gradient(135deg,#9333ea,#c084fc)",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#fff"}}>
              {companyNameStr[0] || "W"}
            </div>
            <span style={{fontWeight:800,fontSize:14,color:T.text}}>{companyNameStr}</span>
          </div>
          <div onClick={()=>setShowProfile(true)} style={{width:34,height:34,background:"linear-gradient(135deg,#9333ea,#c084fc)",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",overflow:"hidden"}}>
            {companyLogo?<img src={companyLogo} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain",padding:3,background:"#fff"}}/>:<span>{initials}</span>}
          </div>
        </div>

        <div className="main-content" style={{flex:1,padding:"22px 24px",overflowY:"auto"}}>
          <div className="page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
            <div>
              <h1 style={{margin:0,fontSize:22,fontWeight:800,color:T.text}}>{page?.icon} {page?.label}</h1>
              <p style={{margin:"3px 0 0",color:"#a78bfa",fontSize:12}}>{companyNameStr} Business Suite · {user?.role||"Admin"}</p>
            </div>
            <div className="header-actions" style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
              {validActive==="clients"&&<button onClick={()=>{setNcError({});setShowClientPass(false);setModal("client");}} style={B("#9333ea")}>+ Add Client</button>}
              {validActive==="employees"&&<button onClick={()=>{setNeError({});setModal("employee");}} style={B("#7c3aed")}>+ Add Employee</button>}
              {validActive==="projects"&&<button onClick={()=>{setNpError({});setModal("project");}} style={B("#a855f7")}>+ New Project</button>}
              {validActive==="managers"&&<button onClick={()=>{setNmError({});setShowMgrPass(false);setModal("manager");}} style={B("#f59e0b")}>+ Add Manager</button>}
             
              <div onClick={()=>setShowProfile(true)} className="mob-topbar-hide" style={{background:"#fff",border:"1.5px solid #ede9fe",borderRadius:12,padding:"6px 12px",display:"flex",alignItems:"center",gap:8,cursor:"pointer",boxShadow:"0 2px 10px rgba(147,51,234,0.08)",flexShrink:0}}>
                <div style={{width:30,height:30,background:"linear-gradient(135deg,#9333ea,#c084fc)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:12,overflow:"hidden",flexShrink:0}}>
                  {companyLogo?<img src={companyLogo} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain",padding:3,background:"#fff"}} onError={()=>setCompanyLogo(null)}/>:<span>{initials}</span>}
                </div>
                <span style={{fontSize:13,fontWeight:600,color:T.text,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayName}</span>
                <span style={{fontSize:10,color:"#a78bfa"}}>▾</span>
              </div>
            </div>
          </div>

          {validActive==="dashboard"&&<>
            <div className="dash-stats" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:18}}>
              {[{t:"Total Clients",v:clients.length,i:"👥",c:"#9333ea"},{t:"Employees",v:employees.length,i:"👨‍💼",c:"#7c3aed"},{t:"Managers",v:managers.length,i:"🧑‍💼",c:"#f59e0b"},{t:"Projects",v:projects.length,i:"📁",c:"#a855f7"},{t:"Invoices",v:INVOICES.length,i:"🧾",c:"#22C55E"}].map(({t,v,i,c})=>(
                <div key={t} style={{background:"#fff",borderRadius:14,padding:"16px 14px",boxShadow:"0 4px 18px rgba(147,51,234,0.07)",border:"1px solid #ede9fe",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:-12,right:-12,width:60,height:60,borderRadius:"50%",background:`radial-gradient(circle,${c}22,transparent)`}}/>
                  <div style={{width:38,height:38,borderRadius:10,background:`${c}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,marginBottom:8}}>{i}</div>
                  <div style={{fontSize:10,color:"#a78bfa",fontWeight:700,letterSpacing:0.5,marginBottom:2}}>{t.toUpperCase()}</div>
                  <div style={{fontSize:24,fontWeight:800,color:c}}>{v}</div>
                </div>
              ))}
            </div>
            <div className="dash-2col" style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}>
              <SC title="Recent Projects">
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 300 }}>
                    <thead>
                      <tr style={{ background: "#faf5ff" }}>
                        {["Project", "Client", "Status", "View"].map(c => <th key={c} style={{ padding: "8px 10px", textAlign: "left", color: "#a78bfa", fontWeight: 700, fontSize: 11, borderBottom: "2px solid #ede9fe" }}>{c.toUpperCase()}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {projects.slice(0, 5).map((p, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f5f3ff" }}>
                          <td style={{ padding: "9px 10px", fontWeight: 600, color: T.text }}>
                            <div style={{ fontSize: 13 }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: "#22C55E" }}>{p.currency || "₹"} {p.budget || "0"}</div>
                          </td>
                          <td style={{ padding: "9px 10px", color: "#a78bfa" }}>{p.client}</td>
                          <td style={{ padding: "9px 10px" }}><Badge label={p.status} /></td>
                          <td style={{ padding: "9px 10px" }}>
                            <button onClick={() => setViewProject(p)} style={{ background: "linear-gradient(135deg,#9333ea,#a855f7)", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>View</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SC>
              <SC title="Recent Activity">{[{icon:"👤",text:"New client added",time:"2m ago",c:"#9333ea"},{icon:"👨‍💼",text:"Employee joined",time:"30m ago",c:"#7c3aed"},{icon:"🧾",text:"Invoice created",time:"1h ago",c:"#22C55E"},{icon:"📁",text:"Project updated",time:"3h ago",c:"#a855f7"},{icon:"✅",text:"ERP completed",time:"2d ago",c:"#F59E0B"}].map((a,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<4?"1px solid #f5f3ff":"none"}}><div style={{width:28,height:28,borderRadius:8,background:`${a.c}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{a.icon}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.text}</div><div style={{fontSize:11,color:"#a78bfa"}}>{a.time}</div></div></div>))}</SC>
            </div>
            <div className="dash-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <SC title="Project Progress">{TRACKING_SEED.map(t=>(<div key={t.id} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,fontWeight:600,color:T.text}}>{t.name}</span><span style={{fontSize:12,fontWeight:700,color:sc(t.status)}}>{t.pct}%</span></div><div style={{background:"#ede9fe",borderRadius:6,height:6}}><div style={{width:`${t.pct}%`,background:t.pct===100?"linear-gradient(90deg,#22C55E,#4ade80)":"linear-gradient(90deg,#9333ea,#c084fc)",borderRadius:6,height:"100%"}}/></div><div style={{fontSize:11,color:"#a78bfa",marginTop:2}}>{t.client}</div></div>))}</SC>
              <SC title="Invoice Status">{INVOICES.map(inv=>(<div key={inv.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f5f3ff"}}><div><div style={{fontSize:13,fontWeight:600,color:T.text}}>{inv.id} · {inv.client}</div><div style={{fontSize:11,color:"#a78bfa"}}>Due: {inv.due}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:3}}>{inv.total}</div><Badge label={inv.status}/></div></div>))}</SC>
            </div>
          </>}

          {/* ── Pages using new components ── */}
          {validActive==="clients"&&<ClientsPage clients={clients} setClients={setClients} projects={projects} onAddClient={()=>{setNcError({});setShowClientPass(false);setModal("client");}}/>}
          {validActive==="employees"&&<EmployeesPage employees={employees} setEmployees={setEmployees}/>}
          {validActive==="managers"&&<ManagersPage managers={managers} setManagers={setManagers}/>}
          {validActive==="projects"&&<ProjectsPage projects={projects} setProjects={setProjects} clients={clients} employees={employees} config={config}/>}

          {validActive==="invoices"&&<InvoiceCreator clients={clients} projects={projects} companyLogo={companyLogo} companyName={companyNameStr} onLogoChange={onLogoChange} onAddClient={() => setModal("client")} onAddProject={() => setModal("project")} />}
          {validActive==="quotations"&&<QuotationCreator clients={clients} projects={projects} companyLogo={companyLogo} companyName={companyNameStr} onLogoChange={onLogoChange} onAddClient={() => setModal("client")} onAddProject={() => setModal("project")} />}
          {validActive==="proposals" && <ProjectProposalCreator clients={clients} />}
          {validActive==="tracking"&&<ProjectStatusPage clients={clients} employees={employees} managers={managers} config={config}/>}
          {validActive==="tasks"&&<TaskPage projects={projects} employees={employees} onUpdate={() => fetchTasks()} config={config} user={user} />}
          {validActive==="calendar"&&<CalendarPage projects={projects} tasks={tasks} user={user} onUpdateProject={() => fetchProjects()} onUpdateTask={() => fetchTasks()} config={config} />}
          {validActive==="messaging"&&<MessagingPage user={user} />}
          {validActive==="settings"&&<SettingsPage user={user} />}
          {validActive==="accounts"&&<AccountsPage />}
          {validActive==="expenses"&&<ExpensesPage />}
          {validActive==="income"&&<IncomePage />}
          {validActive==="interviews"&&<InterviewPage companyId={companyId} companyName={companyNameStr}/>}
          {validActive==="documents" && <SubAdminDocumentsPage employees={employees} />}
          {validActive==="reports"&&<ReportsPage clients={clients} projects={projects} employees={employees} managers={managers}/>}
        </div>
      </div>

      {showProfile&&<ProfileModal user={user} setUser={setUser} onClose={()=>setShowProfile(false)} onLogout={handleLogout} companyLogo={companyLogo} onLogoChange={onLogoChange}/>}

      {/* ── Add Client Modal ── */}
      {modal==="client"&&<Mdl title={clientSuccessData ? "✅ Client Added Successfully" : "Add New Client"} onClose={() => { setModal(null); setClientSuccessData(null); }}>
        {clientSuccessData ? (
          <div style={{ textAlign: "center", padding: "20px 10px" }}>
            <div style={{ width: 64, height: 64, background: "#dcfce7", color: "#16a34a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 18px" }}>✓</div>
            <h3 style={{ fontSize: 18, color: T.text, marginBottom: 12 }}>New Client Registered!</h3>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24, lineHeight: 1.5 }}>
              The client account for <strong>{clientSuccessData.name}</strong> has been created. 
              Please share these credentials with the client.
            </p>
            
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 24, textAlign: "left" }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>EMAIL / USERNAME</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{clientSuccessData.email}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>PASSWORD</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#7c3aed", fontFamily: "monospace" }}>{clientSuccessData.password}</div>
              </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button 
                onClick={() => {
                  const text = `*Client Login Credentials*\n\n*Email:* ${clientSuccessData.email}\n*Password:* ${clientSuccessData.password}\n\nLogin here: ${window.location.origin}`;
                  navigator.clipboard.writeText(text);
                  toast.success("📋 Credentials copied to clipboard!");
                }}
                style={{ width: "100%", background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                📋 Copy Credentials
              </button>
              
              <button 
                onClick={() => {
                  const text = `*Client Login Credentials*\n\n*Email:* ${clientSuccessData.email}\n*Password:* ${clientSuccessData.password}\n\nLogin here: ${window.location.origin}`;
                  const wpUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                  window.open(wpUrl, "_blank");
                }}
                style={{ width: "100%", background: "#25D366", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <span style={{ fontSize: 18 }}>💬</span> Share on WhatsApp
              </button>

              <button 
                onClick={() => { setModal(null); setClientSuccessData(null); }}
                style={{ width: "100%", background: "#fff", border: "1.5px solid #ede9fe", color: T.text, borderRadius: 10, padding: "12px", fontWeight: 700, cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
              <div style={{position:"relative",width:100,height:100}}>
                <div style={{width:100,height:100,borderRadius:"50%",background:"linear-gradient(135deg,#f5f3ff,#faf5ff)",border:"2px dashed #d8b4fe",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                  {nc.logoUrl?(<img src={nc.logoUrl} alt="Logo" style={{width:"100%",height:"100%",objectFit:"contain"}}/>):(<span style={{fontSize:40}}>🏢</span>)}
                </div>
                <label style={{position:"absolute",bottom:0,right:0,background:"#7c3aed",width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:"2px solid #fff",boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>
                  <span style={{fontSize:16}}>📷</span>
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
                    const file=e.target.files[0];
                    if(file){
                      const reader=new FileReader();
                      reader.onloadend=()=>setNc(p=>({...p,logoUrl:reader.result}));
                      reader.readAsDataURL(file);
                    }
                  }}/>
                </label>
              </div>
            </div>
            <div className="modal-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}}>
              <Fld label="Company Name *" value={nc.name} onChange={v=>{setNc({...nc,name:v});setNcError(p=>({...p,name:""}));}} error={ncError.name}/>
              <Fld label="Email *" value={nc.email} onChange={v=>{setNc({...nc,email:v});setNcError(p=>({...p,email:""}));}} type="email" error={ncError.email}/>
              <Fld label="Contact Person Name" value={nc.contactPersonName} onChange={v=>setNc({...nc,contactPersonName:v})}/>
              <Fld label="Contact Person No." value={nc.contactPersonNo} onChange={v=>setNc({...nc,contactPersonNo:v})}/>
              <Fld label="Phone / Office No." value={nc.phone} onChange={v=>setNc({...nc,phone:v})}/>
              <Fld label="Company Tax/GST" value={nc.gstNumber} onChange={v=>setNc({...nc,gstNumber:v})}/>
              <Fld label="Status" value={nc.status} onChange={v=>setNc({...nc,status:v})} options={["Active","Inactive"]}/>
            </div>
            <Fld label="Company Address" value={nc.address} onChange={v=>setNc({...nc,address:v})}/>
            <div style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,marginBottom:5}}>PASSWORD *</label>
              <div style={{position:"relative"}}>
                <input type={showClientPass?"text":"password"} value={nc.password} onChange={e=>setNc({...nc,password:e.target.value})} style={{width:"100%",border:`1.5px solid ${ncError.password?"#EF4444":"#ede9fe"}`,borderRadius:10,padding:"10px 46px 10px 14px",fontSize:13,color:T.text,background:"#faf5ff",boxSizing:"border-box",outline:"none"}} placeholder="Set client password"/>
                <button type="button" onClick={()=>setShowClientPass(!showClientPass)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#a78bfa",fontSize:11,fontWeight:700,fontFamily:"inherit"}}>{showClientPass?"HIDE":"SHOW"}</button>
              </div>
              <div style={{ fontSize: 10, color: "#a78bfa", marginTop: 4 }}></div>
              {ncError.password&&<div style={{fontSize:11,color:"#EF4444",marginTop:4}}>⚠️ {ncError.password}</div>}
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:6}}>
              <button onClick={()=>setModal(null)} style={{background:"#f5f3ff",border:"1px solid #ede9fe",color:T.text,borderRadius:10,padding:"10px 16px",cursor:"pointer",fontWeight:600,fontSize:13}}>Cancel</button>
              <button onClick={addClient} disabled={saveLoading} style={{...B("#9333ea"),opacity:saveLoading?0.7:1}}>{saveLoading?"Saving...":"Add Client"}</button>
            </div>
          </>
        )}
      </Mdl>}

      {/* ── Add Employee Modal ── */}
      {modal==="employee"&&<Mdl title="Add New Employee" onClose={()=>setModal(null)}>
        <div className="modal-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}}>
          <Fld label="Full Name *" value={ne.name} onChange={v=>setNe({...ne,name:v})} error={neError.name}/>
          <Fld label="Email *" value={ne.email} onChange={v=>{setNe({...ne,email:v});setNeError(p=>({...p,email:""}));}} type="email" error={neError.email}/>
          <Fld label="Phone Number" value={ne.phone} onChange={v=>setNe({...ne,phone:v})}/>
          <Fld label="Role / Position" value={ne.role} onChange={v=>setNe({...ne,role:v})}/>
          <Fld label="Department" value={ne.department} onChange={v=>setNe({...ne,department:v})}/>
          <Fld label="Salary" value={ne.salary} onChange={v=>setNe({...ne,salary:v})}/>
          <Fld label="Status" value={ne.status} onChange={v=>setNe({...ne,status:v})} options={["Active","Inactive"]}/>
        </div>
        <div style={{marginBottom:14,marginTop:4}}>
          <label style={{display:"block",fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,marginBottom:5}}>PASSWORD *</label>
          <div style={{position:"relative"}}>
            <input type={showEmpPass?"text":"password"} value={ne.password} onChange={e=>{setNe({...ne,password:e.target.value});setNeError(p=>({...p,password:""}));}} style={{width:"100%",border:`1.5px solid ${neError.password?"#EF4444":"#ede9fe"}`,borderRadius:10,padding:"10px 46px 10px 14px",fontSize:13,color:T.text,background:"#faf5ff",boxSizing:"border-box",outline:"none"}} placeholder="Set employee login password"/>
            <button type="button" onClick={()=>setShowEmpPass(!showEmpPass)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#a78bfa",fontSize:11,fontWeight:700,fontFamily:"inherit"}}>{showEmpPass?"HIDE":"SHOW"}</button>
          </div>
          {neError.password&&<div style={{fontSize:11,color:"#EF4444",marginTop:4}}>⚠️ {neError.password}</div>}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:6}}>
          <button onClick={()=>setModal(null)} style={{background:"#f5f3ff",border:"1px solid #ede9fe",color:T.text,borderRadius:10,padding:"10px 16px",cursor:"pointer",fontWeight:600,fontSize:13}}>Cancel</button>
          <button onClick={addEmployee} disabled={empSaveLoading} style={{...B("#7c3aed"),opacity:empSaveLoading?0.7:1}}>{empSaveLoading?"Saving...":"Save Employee →"}</button>
        </div>
      </Mdl>}

      {/* ── Add Project Modal ── */}
      {modal==="project"&&<Mdl title="Create New Project" onClose={()=>setModal(null)}>
        <div className="modal-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}}>
          <Fld label="Project Name *" value={np.name} onChange={v=>setNp({...np,name:v})} error={npError.name}/>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,marginBottom:5}}>CLIENT NAME *</label>
            <ClientDropdown clients={clients} value={np.client} onChange={v=>setNp({...np,client:v})} error={npError.client} onAddClient={()=>{setModal("client");setNcError({});setShowClientPass(false);}}/>
            {npError.client&&<div style={{fontSize:11,color:"#EF4444",marginTop:4}}>⚠️ {npError.client}</div>}
          </div>
          <Fld label="Purpose" value={np.purpose} onChange={v=>setNp({...np,purpose:v})}/>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 }}>BUDGET</label>
            <div style={{ display: "flex", gap: 8 }}>
              <select 
                value={np.currency} 
                onChange={e => setNp({ ...np, currency: e.target.value })} 
                style={{ width: 80, border: "1.5px solid #ede9fe", borderRadius: 10, padding: "10px", fontSize: 13, color: T.text, background: "#faf5ff", outline: "none" }}
              >
                {["₹", "$", "€", "£", "¥", "AED", "SAR", "QAR"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input 
                type="text" 
                value={np.budget} 
                onChange={e => setNp({ ...np, budget: e.target.value })} 
                style={{ flex: 1, border: "1.5px solid #ede9fe", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: T.text, background: "#faf5ff", outline: "none" }} 
                placeholder="0.00" 
              />
            </div>
          </div>
          <Fld label="Start Date" value={np.start} onChange={v=>setNp({...np,start:v})} type="date"/>
          <Fld label="End Date" value={np.end} onChange={v=>setNp({...np,end:v})} type="date"/>
          <Fld label="Team Members" value={np.team} onChange={v=>setNp({...np,team:v})}/>
          <Fld label="Status" value={np.status} onChange={v=>setNp({...np,status:v})} options={["Pending","In Progress","Completed","On Hold"]} allowCustom={true}/>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,marginBottom:5}}>ASSIGN EMPLOYEES <span style={{fontSize:10,color:"#a78bfa",fontWeight:400}}>(select multiple)</span></label>
          <div style={{border:"1.5px solid #ede9fe",borderRadius:10,padding:"12px",background:"#faf5ff",maxHeight:200,overflowY:"auto"}}>
            {employees.length===0?<div style={{color:"#a78bfa",fontSize:13,textAlign:"center",padding:"20px"}}>No employees available</div>
              :employees.map(e=>(
                <div key={e._id||e.email} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid #f5f3ff"}}>
                  <input type="checkbox" 
                    id={`emp-${e._id||e.email}`}
                    checked={np.assignedTo.includes(e.name)}
           onChange={evt=>{
  if(evt.target.checked){
    setNp(prev=>({...prev,assignedTo:[...prev.assignedTo,e.name]}));
  }else{
    setNp(prev=>({...prev,assignedTo:prev.assignedTo.filter(n=>n!==e.name)}));
  }
}}
                    style={{width:16,height:16,cursor:"pointer"}}
                  />
                  <label htmlFor={`emp-${e._id||e.email}`} style={{flex:1,cursor:"pointer",fontSize:13,color:"#1e0a3c",display:"flex",alignItems:"center",gap:8}}>
                    <span>{e.name}</span>
                    {e.department&&<span style={{fontSize:11,color:"#a78bba",background:"#f3e8ff",padding:"2px 6px",borderRadius:4}}>{e.department}</span>}
                  </label>
                </div>
              ))}
          </div>
          {np.assignedTo.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", fontSize: 10, color: "#a78bfa", fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }}>SELECTED EMPLOYEES ({np.assignedTo.length})</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {np.assignedTo.map(name => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f3e8ff", border: "1px solid #ddd6fe", borderRadius: 8, padding: "4px 10px" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "linear-gradient(135deg,#9333ea,#c084fc)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 8, fontWeight: 700 }}>{name ? name[0].toUpperCase() : "?"}</div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed" }}>{name}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setNp(prev => ({ ...prev, assignedTo: prev.assignedTo.filter(n => n !== name) })); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 14, padding: "0 2px", fontWeight: 700 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <Fld label="Description" value={np.description} onChange={v=>setNp({...np,description:v})}/>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:6}}>
          <button onClick={()=>setModal(null)} style={{background:"#f5f3ff",border:"1px solid #ede9fe",color:T.text,borderRadius:10,padding:"10px 16px",cursor:"pointer",fontWeight:600,fontSize:13}}>Cancel</button>
          <button onClick={addProject} disabled={projSaveLoading} style={{...B("#a855f7"),opacity:projSaveLoading?0.7:1}}>{projSaveLoading?"Saving...":"Save Project →"}</button>
        </div>
      </Mdl>}

      {/* ── Add Manager Modal ── */}
      {modal==="manager"&&<Mdl title="Add New Manager" onClose={()=>setModal(null)}>
        <div className="modal-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}}>
          <Fld label="Manager Name *" value={nm.managerName} onChange={v=>{setNm({...nm,managerName:v});setNmError(p=>({...p,managerName:""}));}} error={nmError.managerName}/>
          <Fld label="Email *" value={nm.email} onChange={v=>{setNm({...nm,email:v});setNmError(p=>({...p,email:""}));}} type="email" error={nmError.email}/>
          <Fld label="Phone Number" value={nm.phone} onChange={v=>setNm({...nm,phone:v})}/>
          <Fld label="Role" value={nm.role} onChange={v=>setNm({...nm,role:v})}/>
          <Fld label="Department" value={nm.department} onChange={v=>setNm({...nm,department:v})}/>
          <Fld label="Status" value={nm.status} onChange={v=>setNm({...nm,status:v})} options={["Active","Inactive"]}/>
        </div>
        <Fld label="Address" value={nm.address} onChange={v=>setNm({...nm,address:v})}/>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,marginBottom:5}}>PASSWORD *</label>
          <div style={{position:"relative"}}>
            <input type={showMgrPass?"text":"password"} value={nm.password} onChange={e=>{setNm({...nm,password:e.target.value});setNmError(p=>({...p,password:""}));}} style={{width:"100%",border:`1.5px solid ${nmError.password?"#EF4444":"#ede9fe"}`,borderRadius:10,padding:"10px 46px 10px 14px",fontSize:13,color:T.text,background:"#faf5ff",boxSizing:"border-box",outline:"none"}} placeholder="Set manager password"/>
            <button type="button" onClick={()=>setShowMgrPass(!showMgrPass)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#a78bfa",fontSize:11,fontWeight:700,fontFamily:"inherit"}}>{showMgrPass?"HIDE":"SHOW"}</button>
          </div>
          {nmError.password&&<div style={{fontSize:11,color:"#EF4444",marginTop:4}}>⚠️ {nmError.password}</div>}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:6}}>
          <button onClick={()=>setModal(null)} style={{background:"#f5f3ff",border:"1px solid #ede9fe",color:T.text,borderRadius:10,padding:"10px 16px",cursor:"pointer",fontWeight:600,fontSize:13}}>Cancel</button>
          <button onClick={addManager} disabled={mgrSaveLoading} style={{...B("#f59e0b"),opacity:mgrSaveLoading?0.7:1}}>{mgrSaveLoading?"Saving...":"Save Manager →"}</button>
        </div>
      </Mdl>}

      {viewProject&&(
        <Mdl title="Project Details" onClose={()=>setViewProject(null)} maxWidth={550}>
          <div style={{padding:16,background:"linear-gradient(135deg,#f5f3ff,#faf5ff)",borderRadius:14,border:"1px solid #ede9fe",marginBottom:18}}>
            <div style={{fontSize:18,fontWeight:800,color:T.text,marginBottom:6}}>{viewProject.name}</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
              <Badge label={viewProject.status||"Pending"}/>
              {viewProject.client&&<span style={{fontSize:12,color:"#9333ea",fontWeight:600}}>👥 {viewProject.client}</span>}
            </div>
          </div>
          <InfoRow icon="💰" label="Budget" value={viewProject.budget}/>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,marginBottom:5}}>ASSIGNED EMPLOYEES</label>
            {(() => {
              const assignedEmployees = Array.isArray(viewProject.assignedTo) ? viewProject.assignedTo : (viewProject.assignedTo ? [viewProject.assignedTo] : []);
              return assignedEmployees.length > 0
                ?<div style={{display:"flex",flexDirection:"column",gap:6}}>
                   {assignedEmployees.map((emp, idx)=>(
                     <div key={idx} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0"}}>
                       <div style={{width:24,height:24,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#a78bfa)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700,flexShrink:0}}>{emp[0].toUpperCase()}</div>
                       <span style={{color:"#1e0a3c",fontWeight:600,fontSize:12}}>{emp}</span>
                     </div>
                   ))}
                 </div>
                :<div style={{color:"#a78bfa",fontSize:13,fontStyle:"italic"}}>No employees assigned</div>
            })()}
          </div>
          <InfoRow icon="📅" label="Start Date" value={viewProject.start}/>
          <InfoRow icon="🏁" label="End Date" value={viewProject.end}/>
          <InfoRow icon="🎯" label="Purpose" value={viewProject.purpose}/>
          <InfoRow icon="👥" label="Team" value={viewProject.team}/>
          <InfoRow icon="📝" label="Description" value={viewProject.description}/>
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <button onClick={()=>setViewProject(null)} style={{flex:1,padding:"10px",background:"linear-gradient(135deg,#9333ea,#a855f7)",border:"none",borderRadius:10,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Close</button>
          </div>
        </Mdl>
      )}
    </div>
  );
}

