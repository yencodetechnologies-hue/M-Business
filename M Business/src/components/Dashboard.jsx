import { useState, useEffect, useRef } from "react";
import React from "react";
import axios from "axios";
import InvoiceCreator from "./InvoiceCreator";

const T={primary:"#3b0764",sidebar:"#1e0a3c",accent:"#9333ea",accentSoft:"rgba(147,51,234,0.15)",green:"#22C55E",orange:"#F59E0B",red:"#EF4444",purple:"#a855f7",teal:"#c084fc",bg:"#f5f3ff",card:"#FFFFFF",text:"#1e0a3c",muted:"#7c3aed",border:"#ede9fe"};
const QUOTATIONS=[{id:"QT001",client:"TechNova Pvt Ltd",project:"Website Redesign",final:"₹2,59,600",date:"2024-01-25",expiry:"2024-02-25",status:"Approved"},{id:"QT002",client:"Bloom Creatives",project:"Mobile App Dev",final:"₹5,31,000",date:"2024-03-01",expiry:"2024-03-31",status:"Sent"},{id:"QT003",client:"Infra Solutions",project:"ERP Integration",final:"₹8,49,600",date:"2024-01-05",expiry:"2024-01-20",status:"Rejected"}];
const INVOICES=[{id:"INV001",client:"TechNova Pvt Ltd",project:"Website Redesign",date:"2024-04-01",due:"2024-04-30",total:"₹1,47,500",status:"Paid"},{id:"INV002",client:"Infra Solutions",project:"ERP Integration",date:"2024-05-01",due:"2024-05-15",total:"₹4,24,800",status:"Overdue"},{id:"INV003",client:"Bloom Creatives",project:"Mobile App Dev",date:"2024-05-10",due:"2024-06-10",total:"₹1,18,000",status:"Pending"}];
const TRACKING=[{id:"PRJ001",name:"Website Redesign",client:"TechNova Pvt Ltd",deadline:"2024-05-30",pct:65,status:"In Progress",note:"Design done, dev ongoing"},{id:"PRJ002",name:"Mobile App Dev",client:"Bloom Creatives",deadline:"2024-08-15",pct:15,status:"Pending",note:"Requirements gathering"},{id:"PRJ003",name:"ERP Integration",client:"Infra Solutions",deadline:"2024-04-30",pct:100,status:"Completed",note:"Signed off by client"}];
const EVENTS=[{id:"EVT001",name:"Client Review",project:"Website Redesign",client:"TechNova Pvt Ltd",date:"2024-05-20",start:"10:00",end:"11:30"},{id:"EVT002",name:"Sprint Planning",project:"Mobile App Dev",client:"Bloom Creatives",date:"2024-05-22",start:"14:00",end:"16:00"},{id:"EVT003",name:"Handover Call",project:"ERP Integration",client:"Infra Solutions",date:"2024-04-30",start:"11:00",end:"12:00"}];
const REPORTS=[{id:"RPT001",type:"Monthly Revenue",range:"Jan–Mar 2024",total:8,revenue:"₹14,50,000",done:3,pending:5},{id:"RPT002",type:"Project Summary",range:"Q1 2024",total:12,revenue:"₹22,80,000",done:7,pending:5},{id:"RPT003",type:"Client Activity",range:"Apr 2024",total:5,revenue:"₹6,30,000",done:2,pending:3}];
const ACCOUNTS=[{id:"ACC001",name:"Arjun Sharma",email:"arjun@gmail.com",role:"Client",joined:"2024-01-15",status:"Active"},{id:"ACC002",name:"Priya Nair",email:"priya@gmail.com",role:"Client",joined:"2024-02-20",status:"Active"},{id:"ACC003",name:"Ravi Mehta",email:"ravi@gmail.com",role:"Client",joined:"2024-03-10",status:"Inactive"},{id:"ACC004",name:"Kiran Dev",email:"kiran@gmail.com",role:"Employee",joined:"2024-01-05",status:"Active"},{id:"ACC005",name:"Meena Raj",email:"meena@gmail.com",role:"Employee",joined:"2024-02-01",status:"Active"}];
const NAV=[{key:"dashboard",icon:"🏠",label:"Dashboard"},{key:"clients",icon:"👥",label:"Clients"},{key:"employees",icon:"👨‍💼",label:"Employees"},{key:"projects",icon:"📁",label:"Projects"},{key:"quotations",icon:"📋",label:"Quotations"},{key:"invoices",icon:"🧾",label:"Invoices"},{key:"tracking",icon:"📊",label:"Project Status"},{key:"calendar",icon:"📅",label:"Calendar"},{key:"accounts",icon:"👤",label:"Accounts"},{key:"reports",icon:"📈",label:"Reports"}];
const sc=s=>({Active:"#22C55E",Inactive:"#EF4444","In Progress":"#9333ea",Pending:"#F59E0B",Completed:"#22C55E","On Hold":"#a855f7",Sent:"#9333ea",Approved:"#22C55E",Rejected:"#EF4444",Paid:"#22C55E",Overdue:"#EF4444",Client:"#9333ea",Employee:"#c084fc"}[s]||"#a855f7");
function Badge({label}){const c=sc(label);return <span style={{background:`${c}18`,color:c,border:`1px solid ${c}33`,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>{label}</span>;}
function SC({title,children,action}){return(<div style={{background:"#fff",borderRadius:16,padding:22,boxShadow:"0 4px 24px rgba(147,51,234,0.08)",border:"1px solid #ede9fe"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{margin:0,fontSize:15,fontWeight:700,color:T.text}}>{title}</h3>{action}</div>{children}</div>);}
function Tbl({cols,rows}){return(<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr style={{background:"linear-gradient(90deg,#f5f3ff,#faf5ff)"}}>{cols.map(c=><th key={c} style={{padding:"10px 14px",textAlign:"left",color:"#7c3aed",fontWeight:700,fontSize:11,borderBottom:"2px solid #ede9fe",whiteSpace:"nowrap"}}>{c.toUpperCase()}</th>)}</tr></thead><tbody>{rows.length===0?<tr><td colSpan={cols.length} style={{padding:30,textAlign:"center",color:"#a78bfa"}}>No results found</td></tr>:rows.map((row,i)=>(<tr key={i} style={{borderBottom:"1px solid #f3f0ff"}} onMouseEnter={e=>e.currentTarget.style.background="#faf5ff"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{row.map((cell,j)=><td key={j} style={{padding:"12px 14px",color:T.text,whiteSpace:"nowrap"}}>{cell}</td>)}</tr>))}</tbody></table></div>);}
function Mdl({title,onClose,children}){return(<div style={{position:"fixed",inset:0,background:"rgba(59,7,100,0.55)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:820,maxHeight:"88vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(147,51,234,0.25)"}}><div style={{padding:"18px 26px",borderBottom:"1px solid #ede9fe",display:"flex",justifyContent:"space-between",alignItems:"center",background:"linear-gradient(90deg,#f5f3ff,#faf5ff)"}}><h2 style={{margin:0,fontSize:18,fontWeight:800,color:T.text}}>{title}</h2><button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#7c3aed"}}>✕</button></div><div style={{overflowY:"auto",padding:26}}>{children}</div></div></div>);}
function Fld({label,value,onChange,options,type="text",error}){const s={width:"100%",border:`1.5px solid ${error?"#EF4444":"#ede9fe"}`,borderRadius:10,padding:"10px 14px",fontSize:13,color:T.text,background:"#faf5ff",boxSizing:"border-box",outline:"none",fontFamily:"inherit"};return(<div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,marginBottom:5}}>{label.toUpperCase()}</label>{options?<select value={value} onChange={e=>onChange(e.target.value)} style={s}>{options.map(o=><option key={o}>{o}</option>)}</select>:<input type={type} value={value} onChange={e=>onChange(e.target.value)} style={s}/>}{error&&<div style={{fontSize:11,color:"#EF4444",marginTop:4}}>⚠️ {error}</div>}</div>);}

function ClientDropdown({clients,value,onChange,error,onAddClient}){
  const [search,setSearch]=useState("");
  const [open,setOpen]=useState(false);
  const filtered=clients.filter(c=>(c.clientName||c.name||"").toLowerCase().includes(search.toLowerCase())||(c.companyName||c.company||"").toLowerCase().includes(search.toLowerCase()));
  const selected=clients.find(c=>(c.clientName||c.name)===value);
  return(<div style={{position:"relative"}}><div onClick={()=>setOpen(!open)} style={{width:"100%",border:`1.5px solid ${error?"#EF4444":open?"#9333ea":"#ede9fe"}`,borderRadius:10,padding:"10px 36px 10px 14px",fontSize:13,color:value?T.text:"#a78bfa",background:"#faf5ff",cursor:"pointer",userSelect:"none",boxSizing:"border-box",position:"relative"}}>{value?(<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:22,height:22,borderRadius:"50%",background:"linear-gradient(135deg,#9333ea,#c084fc)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700,flexShrink:0}}>{value[0].toUpperCase()}</div><span>{value}</span>{selected?.companyName&&<span style={{fontSize:11,color:"#a78bfa"}}>({selected.companyName})</span>}</div>):"-- Select Client --"}<span style={{position:"absolute",right:12,top:"50%",transform:`translateY(-50%) rotate(${open?180:0}deg)`,fontSize:10,color:"#a78bfa",transition:"0.2s"}}>▼</span></div>{open&&(<div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#fff",border:"1.5px solid #ede9fe",borderRadius:12,boxShadow:"0 8px 32px rgba(147,51,234,0.15)",zIndex:999,overflow:"hidden"}}><div onClick={()=>{setOpen(false);setSearch("");onAddClient&&onAddClient();}} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",cursor:"pointer",background:"linear-gradient(90deg,#f3e8ff,#faf5ff)",borderBottom:"2px solid #ede9fe"}} onMouseEnter={e=>e.currentTarget.style.background="#ede9fe"} onMouseLeave={e=>e.currentTarget.style.background="linear-gradient(90deg,#f3e8ff,#faf5ff)"}><div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#9333ea,#c084fc)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:17,fontWeight:700,flexShrink:0}}>+</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#9333ea"}}>Add New Client</div><div style={{fontSize:11,color:"#a78bfa"}}>Create a new client profile</div></div><span style={{fontSize:12,color:"#c084fc"}}>→</span></div><div style={{padding:"10px 10px 6px"}}><div style={{position:"relative"}}><span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:12}}>🔍</span><input autoFocus placeholder="Search client..." value={search} onChange={e=>setSearch(e.target.value)} onClick={e=>e.stopPropagation()} style={{width:"100%",padding:"7px 10px 7px 30px",border:"1.5px solid #ede9fe",borderRadius:8,fontSize:12,background:"#faf5ff",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/></div></div><div style={{maxHeight:180,overflowY:"auto"}}>{filtered.length===0?<div style={{padding:14,textAlign:"center",color:"#a78bfa",fontSize:13}}>No clients found</div>:filtered.map((c,i)=>{const name=c.clientName||c.name||"";const company=c.companyName||c.company||"";const isSel=value===name;return(<div key={i} onClick={()=>{onChange(name);setOpen(false);setSearch("");}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",background:isSel?"#f3e8ff":"transparent",borderBottom:"1px solid #f5f3ff"}} onMouseEnter={e=>e.currentTarget.style.background="#faf5ff"} onMouseLeave={e=>e.currentTarget.style.background=isSel?"#f3e8ff":"transparent"}><div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#9333ea,#c084fc)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:700,flexShrink:0}}>{name[0]?.toUpperCase()||"?"}</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:T.text}}>{name}</div>{company&&<div style={{fontSize:11,color:"#a78bfa"}}>{company}</div>}</div>{isSel&&<span style={{fontSize:14,color:"#9333ea"}}>✓</span>}</div>);})}</div></div>)}{open&&<div style={{position:"fixed",inset:0,zIndex:998}} onClick={()=>{setOpen(false);setSearch("");}}/>}</div>);
}

function Search({value,onChange,placeholder}){return(<div style={{position:"relative",marginBottom:16}}><span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}>🔍</span><input type="text" placeholder={placeholder||"Search..."} value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"10px 14px 10px 40px",border:"1.5px solid #ede9fe",borderRadius:10,fontSize:13,color:T.text,background:"#faf5ff",outline:"none",fontFamily:"inherit"}}/></div>);}

function ProfileModal({user,onClose,onLogout,companyLogo,onLogoChange}){
  const logoRef=useRef();
  const displayName=user?.name||user?.email?.split("@")[0]||"Admin";
  const initials=displayName.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(59,7,100,0.6)",backdropFilter:"blur(10px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:24,width:"100%",maxWidth:420,boxShadow:"0 32px 80px rgba(147,51,234,0.3)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:"linear-gradient(135deg,#7c3aed,#a855f7,#c084fc)",padding:"40px 32px 28px",textAlign:"center",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,0.2)",border:"none",width:30,height:30,borderRadius:8,color:"#fff",fontSize:16,cursor:"pointer"}}>✕</button>
          <div style={{width:80,height:80,borderRadius:18,background:"rgba(255,255,255,0.25)",border:"3px solid rgba(255,255,255,0.5)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",overflow:"hidden"}}>
            {companyLogo
              ? <img src={companyLogo} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain",padding:6,background:"#fff"}}/>
              : <span style={{fontSize:26,fontWeight:800,color:"#fff"}}>{initials}</span>
            }
          </div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800,color:"#fff"}}>{displayName}</h2>
          <p style={{margin:"5px 0 0",fontSize:13,color:"rgba(255,255,255,0.7)"}}>{user?.email||"—"}</p>
          <span style={{display:"inline-block",marginTop:10,background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:100,padding:"3px 14px",fontSize:11,fontWeight:700,color:"#fff",letterSpacing:1,textTransform:"uppercase"}}>{user?.role||"user"}</span>
        </div>
        <div style={{padding:"22px 28px"}}>
          <div style={{marginBottom:18,borderRadius:16,border:"1.5px solid #ede9fe",overflow:"hidden"}}>
            <div style={{background:"linear-gradient(90deg,#f5f3ff,#faf5ff)",padding:"10px 16px",borderBottom:"1px solid #ede9fe"}}>
              <div style={{fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:1}}>🏢 COMPANY LOGO</div>
              <div style={{fontSize:11,color:"#a78bfa",marginTop:2}}>Profile & Invoice-ல automatically வரும்</div>
            </div>
            <div style={{padding:16,display:"flex",alignItems:"center",gap:16}}>
              <div onClick={()=>logoRef.current?.click()} style={{width:80,height:80,borderRadius:14,border:`2px dashed ${companyLogo?"#9333ea":"#c084fc"}`,background:companyLogo?"#f5f3ff":"#faf5ff",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden",flexShrink:0}}>
                {companyLogo
                  ?<img src={companyLogo} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain",padding:4}}/>
                  :<><span style={{fontSize:26}}>🖼️</span><span style={{fontSize:9,color:"#a78bfa",marginTop:4,fontWeight:700}}>CLICK TO UPLOAD</span></>
                }
              </div>
              <div style={{flex:1}}>
                {companyLogo?(
                  <>
                    <div style={{fontSize:13,fontWeight:700,color:"#22c55e",marginBottom:6}}>✅ Logo uploaded!</div>
                    <div style={{fontSize:11,color:"#a78bfa",marginBottom:10}}>Profile & Invoice-ல உங்கள் logo வரும்</div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>logoRef.current?.click()} style={{fontSize:11,color:"#7c3aed",background:"#f5f3ff",border:"1px solid #ede9fe",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>🔄 Change</button>
                      <button onClick={()=>onLogoChange(null)} style={{fontSize:11,color:"#ef4444",background:"#fee2e2",border:"1px solid #fecaca",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>✕ Remove</button>
                    </div>
                  </>
                ):(
                  <>
                    <div style={{fontSize:13,fontWeight:700,color:"#1e0a3c",marginBottom:4}}>Upload company logo</div>
                    <div style={{fontSize:11,color:"#a78bfa",marginBottom:10,lineHeight:1.5}}>PNG or JPG • Profile & Invoice header-ல வரும்</div>
                    <button onClick={()=>logoRef.current?.click()} style={{fontSize:12,color:"#fff",background:"linear-gradient(135deg,#9333ea,#a855f7)",border:"none",borderRadius:9,padding:"7px 16px",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>📤 Upload Logo</button>
                  </>
                )}
              </div>
            </div>
          </div>
          {[{icon:"👤",label:"Full Name",value:displayName},{icon:"📧",label:"Email",value:user?.email||"—"},{icon:"📱",label:"Phone",value:user?.phone||"—"},{icon:"🎭",label:"Role",value:user?.role||"user"},{icon:"🔑",label:"User ID",value:(user?.id||user?._id)?`#${String(user?.id||user?._id).slice(-8).toUpperCase()}`:"—"}].map(({icon,label,value})=>(
            <div key={label} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:"#faf5ff",borderRadius:10,border:"1px solid #ede9fe",marginBottom:8}}>
              <div style={{width:34,height:34,borderRadius:9,background:"rgba(147,51,234,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{icon}</div>
              <div><div style={{fontSize:10,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"}}>{label}</div><div style={{fontSize:14,fontWeight:600,color:"#1e0a3c",marginTop:1}}>{value}</div></div>
            </div>
          ))}
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <button onClick={onClose} style={{flex:1,padding:"11px",background:"#f5f3ff",border:"1px solid #ede9fe",borderRadius:10,fontSize:14,fontWeight:600,color:"#1e0a3c",cursor:"pointer",fontFamily:"inherit"}}>Close</button>
            <button onClick={onLogout} style={{flex:1,padding:"11px",background:"linear-gradient(135deg,#EF4444,#dc2626)",border:"none",borderRadius:10,fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>🚪 Logout</button>
          </div>
        </div>
        <input ref={logoRef} type="file" accept="image/*" style={{display:"none"}}
          onChange={async e => {
            const file = e.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "logoimage");
            formData.append("cloud_name", "dvbzhmysy");
            try {
              const res = await fetch("https://api.cloudinary.com/v1_1/dvbzhmysy/image/upload", { method:"POST", body:formData });
              const data = await res.json();
              onLogoChange(data.secure_url);
            } catch(err) {
              alert("Upload failed!");
            }
          }}
        />
      </div>
    </div>
  );
}

// ✅ FIX 1: Sidebar — logout button ALWAYS visible, nav scrolls independently
function Sidebar({active,setActive,onLogout}){
  return(
    <div style={{
      width:225,
      background:"linear-gradient(180deg,#1e0a3c 0%,#2d1057 60%,#1e0a3c 100%)",
      color:"#fff",
      display:"flex",
      flexDirection:"column",
      height:"100vh",       /* exact viewport height */
      position:"sticky",
      top:0,
      flexShrink:0,
      overflow:"hidden",    /* no outer scroll */
      boxShadow:"4px 0 24px rgba(0,0,0,0.25)"
    }}>
      {/* decorative blobs */}
      <div style={{position:"absolute",width:140,height:140,borderRadius:"50%",background:"radial-gradient(circle,rgba(168,85,247,0.18),transparent)",top:-40,right:-40,pointerEvents:"none"}}/>
      <div style={{position:"absolute",width:100,height:100,borderRadius:"50%",background:"radial-gradient(circle,rgba(192,132,252,0.14),transparent)",bottom:120,left:-30,pointerEvents:"none"}}/>

      {/* Brand */}
      <div style={{padding:"22px 18px 16px",borderBottom:"1px solid rgba(255,255,255,0.08)",position:"relative",zIndex:1,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:38,height:38,background:"linear-gradient(135deg,#9333ea,#c084fc)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:18,color:"#fff",boxShadow:"0 4px 14px rgba(147,51,234,0.5)"}}>M</div>
          <div><div style={{fontWeight:800,fontSize:15,color:"#fff"}}>M Business</div><div style={{fontSize:8,color:"rgba(255,255,255,0.35)",letterSpacing:1.5,marginTop:1}}>MANAGEMENT SUITE</div></div>
        </div>
      </div>

      {/* ✅ Nav: flex:1 + minHeight:0 allows it to shrink and scroll */}
      <nav style={{flex:1,minHeight:0,padding:"10px 8px",overflowY:"auto",position:"relative",zIndex:1}}>
        {NAV.map(n=>{const on=active===n.key;return(<button key={n.key} onClick={()=>setActive(n.key)} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"9px 12px",background:on?"linear-gradient(90deg,rgba(147,51,234,0.35),rgba(168,85,247,0.15))":"transparent",border:on?"1px solid rgba(168,85,247,0.35)":"1px solid transparent",borderRadius:11,color:on?"#e9d5ff":"rgba(255,255,255,0.45)",fontWeight:on?700:400,fontSize:12.5,cursor:"pointer",marginBottom:2,textAlign:"left",fontFamily:"inherit"}}><span style={{fontSize:15}}>{n.icon}</span><span style={{flex:1}}>{n.label}</span>{on&&<div style={{width:5,height:5,borderRadius:"50%",background:"#c084fc",flexShrink:0}}/>}</button>);})}
      </nav>

      {/* ✅ Logout: flexShrink:0 so it NEVER gets pushed out */}
      <div style={{padding:"12px 8px 16px",borderTop:"1px solid rgba(255,255,255,0.07)",position:"relative",zIndex:1,flexShrink:0}}>
        <button onClick={onLogout} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:9,padding:"10px 12px",background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.35)",borderRadius:11,color:"#fca5a5",fontSize:12.5,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

export default function Dashboard({setUser,user}){
  const [active,setActive]=useState("dashboard");
  const [modal,setModal]=useState(null);
  const [showProfile,setShowProfile]=useState(false);

  // ✅ FIX 2: Logo init — user.logoUrl first, then localStorage
  const [companyLogo, setCompanyLogo] = useState(() => {
    return user?.logoUrl || localStorage.getItem("companyLogo") || null;
  });

  // ✅ FIX 3: Sync when user.logoUrl arrives (after login DB response)
  useEffect(() => {
    if (user?.logoUrl) {
      setCompanyLogo(user.logoUrl);
      localStorage.setItem("companyLogo", user.logoUrl);
    }
  }, [user?.logoUrl]);

  const [clients,setClients]=useState([]);
  const [clientsLoading,setClientsLoading]=useState(false);
  const [clientSearch,setClientSearch]=useState("");
  const [nc,setNc]=useState({name:"",company:"",email:"",phone:"",address:"",project:"",password:"",status:"Active"});
  const [ncError,setNcError]=useState({});
  const [saveLoading,setSaveLoading]=useState(false);
  const [showClientPass,setShowClientPass]=useState(false);

  const [employees,setEmployees]=useState([]);
  const [empLoading,setEmpLoading]=useState(false);
  const [empSearch,setEmpSearch]=useState("");
  const [ne,setNe]=useState({name:"",email:"",phone:"",role:"",department:"",salary:"",status:"Active"});
  const [neError,setNeError]=useState({});
  const [empSaveLoading,setEmpSaveLoading]=useState(false);

  const [projects,setProjects]=useState([]);
  const [projLoading,setProjLoading]=useState(false);
  const [projSearch,setProjSearch]=useState("");
  const [np,setNp]=useState({name:"",client:"",purpose:"",description:"",start:"",end:"",budget:"",team:"",status:"Pending"});
  const [npError,setNpError]=useState({});
  const [projSaveLoading,setProjSaveLoading]=useState(false);

  useEffect(()=>{fetchClients();fetchEmployees();fetchProjects();},[]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("companyLogo");
    setUser(null);
    setShowProfile(false);
  };

  const onLogoChange = async (logo) => {
    if (logo) {
      localStorage.setItem("companyLogo", logo);
      try {
        await axios.post("http://localhost:5000/api/auth/save-logo", {
          userId: user._id || user.id,
          logoUrl: logo
        });
      } catch(e) { console.log("DB save failed", e); }
    } else {
      localStorage.removeItem("companyLogo");
      try {
        await axios.post("http://localhost:5000/api/auth/save-logo", {
          userId: user._id || user.id,
          logoUrl: ""
        });
      } catch(e) { console.log("DB save failed", e); }
    }
    setCompanyLogo(logo);
  };

  const fetchClients=async()=>{try{setClientsLoading(true);const res=await axios.get("http://localhost:5000/api/clients");setClients(res.data);}catch(e){console.log(e);}finally{setClientsLoading(false);}};
  const fetchEmployees=async()=>{try{setEmpLoading(true);const res=await axios.get("http://localhost:5000/api/employees");setEmployees(res.data);}catch(e){console.log(e);}finally{setEmpLoading(false);}};
  const fetchProjects=async()=>{try{setProjLoading(true);const res=await axios.get("http://localhost:5000/api/projects");setProjects(res.data);}catch(e){console.log(e);}finally{setProjLoading(false);}};

  const addClient=async()=>{
    const errors={};
    if(!nc.name.trim()) errors.name="Name is required";
    if(!nc.email.trim()) errors.email="Email is required";
    else if(!nc.email.endsWith("@gmail.com")) errors.email="Only @gmail.com allowed";
    if(!nc.password.trim()) errors.password="Password is required";
    if(Object.keys(errors).length>0){setNcError(errors);return;}
    try{setSaveLoading(true);const payload={clientName:nc.name,companyName:nc.company,email:nc.email,phone:nc.phone,address:nc.address,projectAssigned:nc.project,password:nc.password,status:nc.status};const res=await axios.post("http://localhost:5000/api/clients/add",payload);setClients(prev=>[res.data.client,...prev]);setNc({name:"",company:"",email:"",phone:"",address:"",project:"",password:"",status:"Active"});setNcError({});setModal(null);}catch(err){setNcError({email:err.response?.data?.msg||"Failed to save client"});}finally{setSaveLoading(false);}
  };
  const addEmployee=async()=>{
    const errors={};
    if(!ne.name.trim()) errors.name="Name is required";
    if(!ne.email.trim()) errors.email="Email is required";
    if(Object.keys(errors).length>0){setNeError(errors);return;}
    try{setEmpSaveLoading(true);const res=await axios.post("http://localhost:5000/api/employees/add",ne);setEmployees(prev=>[res.data.employee,...prev]);setNe({name:"",email:"",phone:"",role:"",department:"",salary:"",status:"Active"});setNeError({});setModal(null);}catch(err){setNeError({email:err.response?.data?.msg||"Failed to save employee"});}finally{setEmpSaveLoading(false);}
  };
  const addProject=async()=>{
    const errors={};
    if(!np.name.trim()) errors.name="Project name is required";
    if(!np.client.trim()) errors.client="Client name is required";
    if(Object.keys(errors).length>0){setNpError(errors);return;}
    try{setProjSaveLoading(true);await axios.post("http://localhost:5000/api/projects/add",np);await fetchProjects();setNp({name:"",client:"",purpose:"",description:"",start:"",end:"",budget:"",team:"",status:"Pending"});setNpError({});setModal(null);}catch(err){setNpError({name:err.response?.data?.msg||"Failed to save"});}finally{setProjSaveLoading(false);}
  };

  const filteredClients=clients.filter(c=>(c.clientName||c.name||"").toLowerCase().includes(clientSearch.toLowerCase())||(c.email||"").toLowerCase().includes(clientSearch.toLowerCase())||(c.companyName||c.company||"").toLowerCase().includes(clientSearch.toLowerCase()));
  const filteredEmployees=employees.filter(e=>(e.name||"").toLowerCase().includes(empSearch.toLowerCase())||(e.email||"").toLowerCase().includes(empSearch.toLowerCase())||(e.role||"").toLowerCase().includes(empSearch.toLowerCase()));
  const filteredProjects=projects.filter(p=>(p.name||"").toLowerCase().includes(projSearch.toLowerCase())||(p.client||"").toLowerCase().includes(projSearch.toLowerCase()));

  const page=NAV.find(n=>n.key===active);
  const displayName=user?.name||user?.email?.split("@")[0]||"Admin";
  const initials=displayName.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
  const B=(color)=>({background:`linear-gradient(135deg,${color},${color}cc)`,color:"#fff",border:"none",borderRadius:10,padding:"9px 20px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"});

  return(
    <div style={{display:"flex",minHeight:"100vh",background:"linear-gradient(135deg,#f5f3ff 0%,#faf5ff 50%,#f3e8ff 100%)",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#d8b4fe;border-radius:3px}button,input,select{font-family:inherit}`}</style>
      <Sidebar active={active} setActive={setActive} onLogout={handleLogout}/>

      {/* ✅ FIX 4: main content area - minWidth:0 prevents overflow pushing sidebar */}
      <div style={{flex:1,padding:"26px 28px",overflowY:"auto",minWidth:0}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <h1 style={{margin:0,fontSize:24,fontWeight:800,color:T.text}}>{page.icon} {page.label}</h1>
            <p style={{margin:"3px 0 0",color:"#a78bfa",fontSize:12.5}}>M Business Management Suite</p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            {active==="clients"&&<button onClick={()=>{setNcError({});setShowClientPass(false);setModal("client");}} style={B("#9333ea")}>+ Add Client</button>}
            {active==="employees"&&<button onClick={()=>{setNeError({});setModal("employee");}} style={B("#7c3aed")}>+ Add Employee</button>}
            {active==="projects"&&<button onClick={()=>{setNpError({});setModal("project");}} style={B("#a855f7")}>+ New Project</button>}

            {/* ✅ FIX 5: Profile button — logo renders from companyLogo state (synced from user.logoUrl) */}
            <div onClick={()=>setShowProfile(true)} style={{background:"#fff",border:"1.5px solid #ede9fe",borderRadius:12,padding:"7px 13px",display:"flex",alignItems:"center",gap:8,cursor:"pointer",boxShadow:"0 2px 12px rgba(147,51,234,0.1)",flexShrink:0}}>
              <div style={{width:32,height:32,background:"linear-gradient(135deg,#9333ea,#c084fc)",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:13,overflow:"hidden",flexShrink:0}}>
                {companyLogo
                  ? <img
                      src={companyLogo}
                      alt="logo"
                      style={{width:"100%",height:"100%",objectFit:"contain",padding:3,background:"#fff"}}
                      onError={()=>{ localStorage.removeItem("companyLogo"); setCompanyLogo(null); }}
                    />
                  : <span>{initials}</span>
                }
              </div>
              <span style={{fontSize:13,fontWeight:600,color:T.text,maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayName}</span>
              <span style={{fontSize:10,color:"#a78bfa"}}>▾</span>
            </div>
          </div>
        </div>

        {active==="dashboard"&&<>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:20}}>
            {[{t:"Total Clients",v:clients.length,i:"👥",c:"#9333ea"},{t:"Total Employees",v:employees.length,i:"👨‍💼",c:"#7c3aed"},{t:"Total Projects",v:projects.length,i:"📁",c:"#a855f7"},{t:"Active Projects",v:projects.filter(p=>p.status==="In Progress").length,i:"⚡",c:"#22C55E"},{t:"Invoices",v:INVOICES.length,i:"🧾",c:"#F59E0B"}].map(({t,v,i,c})=>(
              <div key={t} style={{background:"#fff",borderRadius:16,padding:"18px 16px",boxShadow:"0 4px 20px rgba(147,51,234,0.08)",border:"1px solid #ede9fe",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:-15,right:-15,width:70,height:70,borderRadius:"50%",background:`radial-gradient(circle,${c}20,transparent)`}}/>
                <div style={{width:42,height:42,borderRadius:11,background:`${c}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,marginBottom:10}}>{i}</div>
                <div style={{fontSize:10,color:"#a78bfa",fontWeight:700,letterSpacing:0.5,marginBottom:3}}>{t.toUpperCase()}</div>
                <div style={{fontSize:28,fontWeight:800,color:c}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16,marginBottom:16}}>
            <SC title="Recent Projects">
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr style={{background:"#faf5ff"}}>{["Project","Client","Status"].map(c=><th key={c} style={{padding:"9px 12px",textAlign:"left",color:"#a78bfa",fontWeight:700,fontSize:11,borderBottom:"2px solid #ede9fe"}}>{c.toUpperCase()}</th>)}</tr></thead><tbody>{projects.slice(0,5).map((p,i)=><tr key={i} style={{borderBottom:"1px solid #f5f3ff"}}><td style={{padding:"10px 12px",fontWeight:600,color:T.text}}>{p.name}</td><td style={{padding:"10px 12px",color:"#a78bfa"}}>{p.client}</td><td style={{padding:"10px 12px"}}><Badge label={p.status}/></td></tr>)}</tbody></table>
            </SC>
            <SC title="Recent Activity">
              {[{icon:"👤",text:"New client added",time:"2m ago",c:"#9333ea"},{icon:"👨‍💼",text:"Employee joined",time:"30m ago",c:"#7c3aed"},{icon:"🧾",text:"Invoice created",time:"1h ago",c:"#22C55E"},{icon:"📁",text:"Project updated",time:"3h ago",c:"#a855f7"},{icon:"✅",text:"ERP completed",time:"2d ago",c:"#F59E0B"}].map((a,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<4?"1px solid #f5f3ff":"none"}}>
                  <div style={{width:30,height:30,borderRadius:9,background:`${a.c}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{a.icon}</div>
                  <div style={{flex:1}}><div style={{fontSize:12.5,fontWeight:600,color:T.text}}>{a.text}</div><div style={{fontSize:11,color:"#a78bfa"}}>{a.time}</div></div>
                </div>
              ))}
            </SC>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px",alignItems:"flex-start"}}>
            <SC title="Project Progress">
              {TRACKING.map(t=>(<div key={t.id} style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13,fontWeight:600,color:T.text}}>{t.name}</span><span style={{fontSize:12,fontWeight:700,color:sc(t.status)}}>{t.pct}%</span></div><div style={{background:"#ede9fe",borderRadius:6,height:7}}><div style={{width:`${t.pct}%`,background:t.pct===100?"linear-gradient(90deg,#22C55E,#4ade80)":"linear-gradient(90deg,#9333ea,#c084fc)",borderRadius:6,height:"100%"}}/></div><div style={{fontSize:11,color:"#a78bfa",marginTop:3}}>{t.client}</div></div>))}
            </SC>
            <SC title="Invoice Status">
              {INVOICES.map(inv=>(<div key={inv.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #f5f3ff"}}><div><div style={{fontSize:13,fontWeight:600,color:T.text}}>{inv.id} · {inv.client}</div><div style={{fontSize:11,color:"#a78bfa"}}>Due: {inv.due}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:3}}>{inv.total}</div><Badge label={inv.status}/></div></div>))}
            </SC>
          </div>
        </>}

        {active==="clients"&&(<SC title={`All Clients (${filteredClients.length})`}><Search value={clientSearch} onChange={setClientSearch} placeholder="Search by name, email, company..."/>{clientsLoading?<div style={{textAlign:"center",padding:40,color:"#a78bfa"}}>Loading...</div>:<Tbl cols={["ID","Name","Company","Email","Phone","Address","Project","Status","Created"]} rows={filteredClients.map((c,i)=>[`CLT${String(i+1).padStart(3,"0")}`,c.clientName||c.name||"—",c.companyName||c.company||"—",c.email,c.phone||"—",c.address||"—",c.projectAssigned||c.project||"—",<Badge label={c.status}/>,c.createdAt?new Date(c.createdAt).toLocaleDateString():"—"])}/>}</SC>)}
        {active==="employees"&&(<SC title={`All Employees (${filteredEmployees.length})`}><Search value={empSearch} onChange={setEmpSearch} placeholder="Search by name, email, role..."/>{empLoading?<div style={{textAlign:"center",padding:40,color:"#a78bfa"}}>Loading...</div>:<Tbl cols={["ID","Name","Email","Phone","Role","Department","Salary","Status","Joined"]} rows={filteredEmployees.map((e,i)=>[`EMP${String(i+1).padStart(3,"0")}`,e.name,e.email,e.phone||"—",e.role||"—",e.department||"—",e.salary||"—",<Badge label={e.status}/>,e.createdAt?new Date(e.createdAt).toLocaleDateString():"—"])}/>}</SC>)}
        {active==="projects"&&(<SC title={`All Projects (${filteredProjects.length})`}><Search value={projSearch} onChange={setProjSearch} placeholder="Search by project name, client..."/>{projLoading?<div style={{textAlign:"center",padding:40,color:"#a78bfa"}}>Loading...</div>:<Tbl cols={["ID","Name","Client","Start","End","Budget","Team","Status","Created"]} rows={filteredProjects.map((p,i)=>[`PRJ${String(i+1).padStart(3,"0")}`,p.name,p.client,p.start||"—",p.end||"—",p.budget||"—",p.team||"—",<Badge label={p.status}/>,p.createdAt?new Date(p.createdAt).toLocaleDateString():"—"])}/>}</SC>)}

        {active==="invoices"&&<InvoiceCreator clients={clients} projects={projects} companyLogo={companyLogo} onLogoChange={onLogoChange}/>}
        {active==="quotations"&&<SC title="All Quotations"><Tbl cols={["ID","Client","Project","Amount","Date","Expiry","Status"]} rows={QUOTATIONS.map(q=>[q.id,q.client,q.project,q.final,q.date,q.expiry,<Badge label={q.status}/>])}/></SC>}
        {active==="tracking"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>{TRACKING.map(t=>(<div key={t.id} style={{background:"#fff",borderRadius:16,padding:22,boxShadow:"0 4px 20px rgba(147,51,234,0.08)",border:"1px solid #ede9fe"}}><div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:14}}><div><span style={{fontSize:11,color:"#a78bfa",fontWeight:700}}>{t.id}</span><h3 style={{margin:"4px 0",fontSize:17,color:T.text}}>{t.name}</h3><span style={{color:"#a78bfa",fontSize:13}}>{t.client} · Deadline: {t.deadline}</span></div><div style={{textAlign:"right"}}><Badge label={t.status}/><div style={{fontSize:22,fontWeight:800,color:sc(t.status),marginTop:6}}>{t.pct}%</div></div></div><div style={{background:"#ede9fe",borderRadius:8,height:10,marginBottom:10}}><div style={{width:`${t.pct}%`,background:t.pct===100?"linear-gradient(90deg,#22C55E,#4ade80)":"linear-gradient(90deg,#9333ea,#c084fc)",borderRadius:8,height:"100%"}}/></div><div style={{fontSize:13,color:"#a78bfa"}}>📝 {t.note}</div></div>))}</div>}
        {active==="calendar"&&<div style={{display:"flex",flexDirection:"column",gap:14}}>{EVENTS.map(e=>(<div key={e.id} style={{background:"#fff",borderRadius:16,padding:20,boxShadow:"0 4px 20px rgba(147,51,234,0.08)",border:"1px solid #ede9fe",display:"flex",gap:18,alignItems:"center"}}><div style={{background:"linear-gradient(135deg,#9333ea22,#c084fc22)",border:"1.5px solid #c084fc44",borderRadius:12,padding:"12px 16px",textAlign:"center",minWidth:58}}><div style={{fontSize:22,fontWeight:800,color:"#9333ea"}}>{e.date.split("-")[2]}</div><div style={{fontSize:9,color:"#a78bfa",fontWeight:700,letterSpacing:1}}>MAY</div></div><div style={{flex:1}}><div style={{fontSize:15,fontWeight:700,color:T.text}}>{e.name}</div><div style={{color:"#a78bfa",fontSize:13,marginTop:3}}>{e.project} · {e.client}</div><div style={{color:"#a78bfa",fontSize:13,marginTop:2}}>🕐 {e.start} – {e.end}</div></div></div>))}</div>}
        {active==="accounts"&&(<div style={{display:"flex",flexDirection:"column",gap:16}}><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:4}}>{[{t:"Total Accounts",v:ACCOUNTS.length,i:"👤",c:"#9333ea"},{t:"Active",v:ACCOUNTS.filter(a=>a.status==="Active").length,i:"✅",c:"#22C55E"},{t:"Inactive",v:ACCOUNTS.filter(a=>a.status==="Inactive").length,i:"⛔",c:"#EF4444"}].map(({t,v,i,c})=>(<div key={t} style={{background:"#fff",borderRadius:16,padding:"18px 16px",boxShadow:"0 4px 20px rgba(147,51,234,0.08)",border:"1px solid #ede9fe",display:"flex",alignItems:"center",gap:14}}><div style={{width:44,height:44,borderRadius:12,background:`${c}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{i}</div><div><div style={{fontSize:10,color:"#a78bfa",fontWeight:700,letterSpacing:0.5}}>{t.toUpperCase()}</div><div style={{fontSize:26,fontWeight:800,color:c}}>{v}</div></div></div>))}</div><SC title={`All Accounts (${ACCOUNTS.length})`}><Tbl cols={["ID","Name","Email","Role","Joined","Status"]} rows={ACCOUNTS.map(a=>[a.id,<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#9333ea,#c084fc)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:700}}>{a.name.split(" ").map(w=>w[0]).join("").slice(0,2)}</div><span style={{fontWeight:600}}>{a.name}</span></div>,a.email,<Badge label={a.role}/>,a.joined,<Badge label={a.status}/>])}/></SC></div>)}
        {active==="reports"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:16}}>{REPORTS.map(r=>(<div key={r.id} style={{background:"#fff",borderRadius:16,padding:22,boxShadow:"0 4px 20px rgba(147,51,234,0.08)",border:"1px solid #ede9fe"}}><div style={{marginBottom:14}}><div style={{fontSize:10,color:"#a78bfa",fontWeight:700}}>{r.id}</div><h3 style={{margin:"4px 0",fontSize:15,color:T.text}}>{r.type}</h3><div style={{fontSize:12,color:"#a78bfa"}}>📅 {r.range}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{[["Total",r.total],["Revenue",r.revenue],["Done",r.done],["Pending",r.pending]].map(([k,v])=>(<div key={k} style={{background:"#faf5ff",borderRadius:10,padding:"10px 12px",border:"1px solid #ede9fe"}}><div style={{fontSize:10,color:"#a78bfa",fontWeight:700,marginBottom:3}}>{k.toUpperCase()}</div><div style={{fontSize:16,fontWeight:800,color:T.text}}>{v}</div></div>))}</div></div>))}</div>}

      </div>

      {showProfile&&<ProfileModal user={user} onClose={()=>setShowProfile(false)} onLogout={handleLogout} companyLogo={companyLogo} onLogoChange={onLogoChange}/>}

      {modal==="client"&&<Mdl title="Add New Client" onClose={()=>setModal(null)}>
        <div style={{marginBottom:20,padding:16,background:"#faf5ff",borderRadius:12,border:"1px solid #ede9fe"}}>
          <div style={{fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,marginBottom:8}}>🔍 SEARCH EXISTING CLIENTS FIRST</div>
          <Search value={clientSearch} onChange={setClientSearch} placeholder="Search by name, email or company..."/>
          {clientSearch.trim()&&(<div style={{maxHeight:160,overflowY:"auto",borderRadius:10,border:"1px solid #ede9fe",background:"#fff"}}>{filteredClients.length===0?<div style={{padding:"12px 16px",fontSize:13,color:"#a78bfa",textAlign:"center"}}>✅ No match — safe to add new client</div>:filteredClients.slice(0,5).map((c,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:"1px solid #f5f3ff"}}><div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#9333ea,#c084fc)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:700}}>{(c.clientName||c.name||"?")[0].toUpperCase()}</div><div><div style={{fontSize:13,fontWeight:600,color:"#1e0a3c"}}>{c.clientName||c.name}</div><div style={{fontSize:11,color:"#a78bfa"}}>{c.email} · {c.companyName||c.company||"—"}</div></div><span style={{marginLeft:"auto",fontSize:11,background:"#f3e8ff",color:"#9333ea",padding:"2px 10px",borderRadius:20,fontWeight:700}}>Exists</span></div>))}</div>)}
          {clientSearch.trim()&&<button onClick={()=>setClientSearch("")} style={{marginTop:8,fontSize:11,color:"#a78bfa",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>✕ Clear search</button>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px"}}>
          <Fld label="Client Name *" value={nc.name} onChange={v=>{setNc({...nc,name:v});setNcError(p=>({...p,name:""}));}} error={ncError.name}/>
          <Fld label="Company Name" value={nc.company} onChange={v=>setNc({...nc,company:v})}/>
          <Fld label="Email * (@gmail.com)" value={nc.email} onChange={v=>{setNc({...nc,email:v});setNcError(p=>({...p,email:""}));}} type="email" error={ncError.email}/>
          <Fld label="Phone Number" value={nc.phone} onChange={v=>setNc({...nc,phone:v})}/>
          <Fld label="Project Assigned" value={nc.project} onChange={v=>setNc({...nc,project:v})}/>
          <Fld label="Status" value={nc.status} onChange={v=>setNc({...nc,status:v})} options={["Active","Inactive"]}/>
        </div>
        <Fld label="Address" value={nc.address} onChange={v=>setNc({...nc,address:v})}/>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,marginBottom:5}}>PASSWORD *</label>
          <div style={{position:"relative"}}>
            <input type={showClientPass?"text":"password"} value={nc.password} onChange={e=>setNc({...nc,password:e.target.value})} style={{width:"100%",border:`1.5px solid ${ncError.password?"#EF4444":"#ede9fe"}`,borderRadius:10,padding:"10px 46px 10px 14px",fontSize:13,color:T.text,background:"#faf5ff",boxSizing:"border-box",outline:"none",fontFamily:"inherit"}} placeholder="Set client password"/>
            <button type="button" onClick={()=>setShowClientPass(!showClientPass)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#a78bfa",fontSize:11,fontWeight:700,fontFamily:"inherit"}}>{showClientPass?"HIDE":"SHOW"}</button>
          </div>
          {ncError.password&&<div style={{fontSize:11,color:"#EF4444",marginTop:4}}>⚠️ {ncError.password}</div>}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:6}}>
          <button onClick={()=>{setModal(null);setClientSearch("");}} style={{background:"#f5f3ff",border:"1px solid #ede9fe",color:T.text,borderRadius:10,padding:"10px 18px",cursor:"pointer",fontWeight:600,fontSize:13}}>Cancel</button>
          <button onClick={addClient} disabled={saveLoading} style={{...B("#9333ea"),opacity:saveLoading?0.7:1}}>{saveLoading?"Saving...":"Save Client →"}</button>
        </div>
      </Mdl>}

      {modal==="employee"&&<Mdl title="Add New Employee" onClose={()=>setModal(null)}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px"}}>
          <Fld label="Full Name *" value={ne.name} onChange={v=>setNe({...ne,name:v})} error={neError.name}/>
          <Fld label="Email *" value={ne.email} onChange={v=>{setNe({...ne,email:v});setNeError(p=>({...p,email:""}));}} type="email" error={neError.email}/>
          <Fld label="Phone Number" value={ne.phone} onChange={v=>setNe({...ne,phone:v})}/>
          <Fld label="Role / Position" value={ne.role} onChange={v=>setNe({...ne,role:v})}/>
          <Fld label="Department" value={ne.department} onChange={v=>setNe({...ne,department:v})}/>
          <Fld label="Salary" value={ne.salary} onChange={v=>setNe({...ne,salary:v})}/>
          <Fld label="Status" value={ne.status} onChange={v=>setNe({...ne,status:v})} options={["Active","Inactive"]}/>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:6}}>
          <button onClick={()=>setModal(null)} style={{background:"#f5f3ff",border:"1px solid #ede9fe",color:T.text,borderRadius:10,padding:"10px 18px",cursor:"pointer",fontWeight:600,fontSize:13}}>Cancel</button>
          <button onClick={addEmployee} disabled={empSaveLoading} style={{...B("#7c3aed"),opacity:empSaveLoading?0.7:1}}>{empSaveLoading?"Saving...":"Save Employee →"}</button>
        </div>
      </Mdl>}

      {modal==="project"&&<Mdl title="Create New Project" onClose={()=>setModal(null)}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px",alignItems:"flex-start"}}>
          <Fld label="Project Name *" value={np.name} onChange={v=>setNp({...np,name:v})} error={npError.name}/>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,marginBottom:5}}>CLIENT NAME *</label>
            <ClientDropdown clients={clients} value={np.client} onChange={v=>setNp({...np,client:v})} error={npError.client} onAddClient={()=>{setModal("client");setNcError({});setShowClientPass(false);}}/>
            {npError.client&&<div style={{fontSize:11,color:"#EF4444",marginTop:4}}>⚠️ {npError.client}</div>}
          </div>
          <Fld label="Purpose" value={np.purpose} onChange={v=>setNp({...np,purpose:v})}/>
          <Fld label="Budget" value={np.budget} onChange={v=>setNp({...np,budget:v})}/>
          <Fld label="Start Date" value={np.start} onChange={v=>setNp({...np,start:v})} type="date"/>
          <Fld label="End Date" value={np.end} onChange={v=>setNp({...np,end:v})} type="date"/>
          <Fld label="Team Members" value={np.team} onChange={v=>setNp({...np,team:v})}/>
          <Fld label="Status" value={np.status} onChange={v=>setNp({...np,status:v})} options={["Pending","In Progress","Completed","On Hold"]}/>
        </div>
        <Fld label="Description" value={np.description} onChange={v=>setNp({...np,description:v})}/>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:6}}>
          <button onClick={()=>setModal(null)} style={{background:"#f5f3ff",border:"1px solid #ede9fe",color:T.text,borderRadius:10,padding:"10px 18px",cursor:"pointer",fontWeight:600,fontSize:13}}>Cancel</button>
          <button onClick={addProject} disabled={projSaveLoading} style={{...B("#a855f7"),opacity:projSaveLoading?0.7:1}}>{projSaveLoading?"Saving...":"Save Project →"}</button>
        </div>
      </Mdl>}
    </div>
  );
}
