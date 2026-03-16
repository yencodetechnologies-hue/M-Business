import { useState, useEffect, useRef } from "react";
import React from "react";
import axios from "axios";
import InvoiceCreator from "./InvoiceCreator";
import TaskPage from "./TaskPage";
import { QRCodeSVG } from "qrcode.react";

const T={primary:"#3b0764",sidebar:"#1e0a3c",accent:"#9333ea",bg:"#f5f3ff",card:"#FFFFFF",text:"#1e0a3c",muted:"#7c3aed",border:"#ede9fe"};
const QUOTATIONS=[{id:"QT001",client:"TechNova Pvt Ltd",project:"Website Redesign",final:"₹2,59,600",date:"2024-01-25",expiry:"2024-02-25",status:"Approved"},{id:"QT002",client:"Bloom Creatives",project:"Mobile App Dev",final:"₹5,31,000",date:"2024-03-01",expiry:"2024-03-31",status:"Sent"},{id:"QT003",client:"Infra Solutions",project:"ERP Integration",final:"₹8,49,600",date:"2024-01-05",expiry:"2024-01-20",status:"Rejected"}];
const INVOICES=[{id:"INV001",client:"TechNova Pvt Ltd",project:"Website Redesign",date:"2024-04-01",due:"2024-04-30",total:"₹1,47,500",status:"Paid"},{id:"INV002",client:"Infra Solutions",project:"ERP Integration",date:"2024-05-01",due:"2024-05-15",total:"₹4,24,800",status:"Overdue"},{id:"INV003",client:"Bloom Creatives",project:"Mobile App Dev",date:"2024-05-10",due:"2024-06-10",total:"₹1,18,000",status:"Pending"}];
const TRACKING_SEED=[{id:"PRJ001",name:"Website Redesign",client:"TechNova Pvt Ltd",deadline:"2024-05-30",pct:65,status:"In Progress",note:"Design done, dev ongoing"},{id:"PRJ002",name:"Mobile App Dev",client:"Bloom Creatives",deadline:"2024-08-15",pct:15,status:"Pending",note:"Requirements gathering"},{id:"PRJ003",name:"ERP Integration",client:"Infra Solutions",deadline:"2024-04-30",pct:100,status:"Completed",note:"Signed off by client"}];
const EVENTS=[{id:"EVT001",name:"Client Review",project:"Website Redesign",client:"TechNova Pvt Ltd",date:"2024-05-20",start:"10:00",end:"11:30"},{id:"EVT002",name:"Sprint Planning",project:"Mobile App Dev",client:"Bloom Creatives",date:"2024-05-22",start:"14:00",end:"16:00"},{id:"EVT003",name:"Handover Call",project:"ERP Integration",client:"Infra Solutions",date:"2024-04-30",start:"11:00",end:"12:00"}];
const REPORTS=[{id:"RPT001",type:"Monthly Revenue",range:"Jan–Mar 2024",total:8,revenue:"₹14,50,000",done:3,pending:5},{id:"RPT002",type:"Project Summary",range:"Q1 2024",total:12,revenue:"₹22,80,000",done:7,pending:5},{id:"RPT003",type:"Client Activity",range:"Apr 2024",total:5,revenue:"₹6,30,000",done:2,pending:3}];
const ACCOUNTS=[{id:"ACC001",name:"Arjun Sharma",email:"arjun@gmail.com",role:"Client",joined:"2024-01-15",status:"Active"},{id:"ACC002",name:"Priya Nair",email:"priya@gmail.com",role:"Client",joined:"2024-02-20",status:"Active"},{id:"ACC003",name:"Ravi Mehta",email:"ravi@gmail.com",role:"Client",joined:"2024-03-10",status:"Inactive"},{id:"ACC004",name:"Kiran Dev",email:"kiran@gmail.com",role:"Employee",joined:"2024-01-05",status:"Active"},{id:"ACC005",name:"Meena Raj",email:"meena@gmail.com",role:"Employee",joined:"2024-02-01",status:"Active"}];

const NAV=[
  {key:"dashboard",icon:"🏠",label:"Dashboard"},
  {key:"clients",icon:"👥",label:"Clients"},
  {key:"employees",icon:"👨‍💼",label:"Employees"},
  {key:"managers",icon:"🧑‍💼",label:"Managers"},
  {key:"projects",icon:"📁",label:"Projects"},
  {key:"quotations",icon:"📋",label:"Quotations"},
  {key:"invoices",icon:"🧾",label:"Invoices"},
  {key:"tracking",icon:"📊",label:"Project Status"},
  {key:"tasks",icon:"✅",label:"Tasks"},
  {key:"calendar",icon:"📅",label:"Calendar"},
  {key:"accounts",icon:"👤",label:"Accounts"},
  {key:"reports",icon:"📈",label:"Reports"}
];

const sc=s=>({Active:"#22C55E",Inactive:"#EF4444","In Progress":"#9333ea",Pending:"#F59E0B",Completed:"#22C55E","On Hold":"#a855f7",Sent:"#9333ea",Approved:"#22C55E",Rejected:"#EF4444",Paid:"#22C55E",Overdue:"#EF4444",Client:"#9333ea",Employee:"#c084fc",Manager:"#f59e0b"}[s]||"#a855f7");

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

function Tbl({cols,rows}){
  return(
    <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:500}}>
        <thead><tr style={{background:"linear-gradient(90deg,#f5f3ff,#faf5ff)"}}>
          {cols.map(c=><th key={c} style={{padding:"10px 14px",textAlign:"left",color:"#7c3aed",fontWeight:700,fontSize:11,borderBottom:"2px solid #ede9fe",whiteSpace:"nowrap"}}>{c.toUpperCase()}</th>)}
        </tr></thead>
        <tbody>
          {rows.length===0
            ?<tr><td colSpan={cols.length} style={{padding:30,textAlign:"center",color:"#a78bfa"}}>No results found</td></tr>
            :rows.map((row,i)=>(
              <tr key={i} style={{borderBottom:"1px solid #f3f0ff"}}
                onMouseEnter={e=>e.currentTarget.style.background="#faf5ff"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                {row.map((cell,j)=><td key={j} style={{padding:"12px 14px",color:T.text,whiteSpace:"nowrap"}}>{cell}</td>)}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function Mdl({title,onClose,children}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(59,7,100,0.55)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:820,maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(147,51,234,0.25)"}}>
        <div style={{padding:"16px 22px",borderBottom:"1px solid #ede9fe",display:"flex",justifyContent:"space-between",alignItems:"center",background:"linear-gradient(90deg,#f5f3ff,#faf5ff)",flexShrink:0}}>
          <h2 style={{margin:0,fontSize:17,fontWeight:800,color:T.text}}>{title}</h2>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#7c3aed",padding:"4px 8px"}}>✕</button>
        </div>
        <div style={{overflowY:"auto",padding:"20px 22px",flex:1}}>{children}</div>
      </div>
    </div>
  );
}

function Fld({label,value,onChange,options,type="text",error,placeholder}){
  const s={width:"100%",border:`1.5px solid ${error?"#EF4444":"#ede9fe"}`,borderRadius:10,padding:"10px 14px",fontSize:13,color:T.text,background:"#faf5ff",boxSizing:"border-box",outline:"none",fontFamily:"inherit"};
  return(
    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,marginBottom:5}}>{label.toUpperCase()}</label>
      {options?<select value={value} onChange={e=>onChange(e.target.value)} style={s}>{options.map(o=><option key={o}>{o}</option>)}</select>
        :<input type={type} value={value} onChange={e=>onChange(e.target.value)} style={s} placeholder={placeholder||""}/>}
      {error&&<div style={{fontSize:11,color:"#EF4444",marginTop:4}}>⚠️ {error}</div>}
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

// ── Searchable Dropdown (for Manager / Employee in Project Status) ──
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
          <div style={{padding:"8px 10px"}}>
            <input autoFocus placeholder={`Search...`} value={search} onChange={e=>setSearch(e.target.value)} onClick={e=>e.stopPropagation()}
              style={{width:"100%",padding:"7px 10px",border:"1.5px solid #ede9fe",borderRadius:8,fontSize:12,background:"#faf5ff",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div style={{maxHeight:180,overflowY:"auto"}}>
            {filtered.length===0
              ?<div style={{padding:14,textAlign:"center",color:"#a78bfa",fontSize:13}}>No results</div>
              :filtered.map((item,i)=>{
                const name=item[displayKey]||"";
                const isSel=value===name;
                return(
                  <div key={i} onClick={()=>{onChange(name);setOpen(false);setSearch("");}}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",background:isSel?"#f3e8ff":"transparent",borderBottom:"1px solid #f5f3ff"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#faf5ff"}
                    onMouseLeave={e=>e.currentTarget.style.background=isSel?"#f3e8ff":"transparent"}>
                    <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#9333ea,#c084fc)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700,flexShrink:0}}>{name[0]?.toUpperCase()||"?"}</div>
                    <span style={{fontSize:13,fontWeight:600,color:T.text}}>{name}</span>
                    {isSel&&<span style={{marginLeft:"auto",color:"#9333ea"}}>✓</span>}
                  </div>
                );
              })}
          </div>
        </div>
      )}
      {open&&<div style={{position:"fixed",inset:0,zIndex:998}} onClick={()=>{setOpen(false);setSearch("");}}/>}
      {error&&<div style={{fontSize:11,color:"#EF4444",marginTop:4}}>⚠️ {error}</div>}
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
          <div onClick={()=>{setOpen(false);setSearch("");onAddClient&&onAddClient();}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",background:"linear-gradient(90deg,#f3e8ff,#faf5ff)",borderBottom:"2px solid #ede9fe"}} onMouseEnter={e=>e.currentTarget.style.background="#ede9fe"} onMouseLeave={e=>e.currentTarget.style.background="linear-gradient(90deg,#f3e8ff,#faf5ff)"}>
            <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#9333ea,#c084fc)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:17,fontWeight:700,flexShrink:0}}>+</div>
            <div><div style={{fontSize:13,fontWeight:700,color:"#9333ea"}}>Add New Client</div><div style={{fontSize:11,color:"#a78bfa"}}>Create a new client profile</div></div>
          </div>
          <div style={{maxHeight:180,overflowY:"auto"}}>
            {filtered.length===0?<div style={{padding:14,textAlign:"center",color:"#a78bfa",fontSize:13}}>No clients found</div>
              :filtered.map((c,i)=>{const name=c.clientName||c.name||"";const company=c.companyName||c.company||"";const isSel=value===name;return(<div key={i} onClick={()=>{onChange(name);setOpen(false);setSearch("");}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",background:isSel?"#f3e8ff":"transparent",borderBottom:"1px solid #f5f3ff"}} onMouseEnter={e=>e.currentTarget.style.background="#faf5ff"} onMouseLeave={e=>e.currentTarget.style.background=isSel?"#f3e8ff":"transparent"}><div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#9333ea,#c084fc)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:700,flexShrink:0}}>{name[0]?.toUpperCase()||"?"}</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:T.text}}>{name}</div>{company&&<div style={{fontSize:11,color:"#a78bfa"}}>{company}</div>}</div>{isSel&&<span style={{fontSize:14,color:"#9333ea"}}>✓</span>}</div>);})}
          </div>
        </div>
      )}
      {open&&<div style={{position:"fixed",inset:0,zIndex:998}} onClick={()=>{setOpen(false);setSearch("");}}/>}
    </div>
  );
}

function ProfileModal({user,setUser,onClose,onLogout,companyLogo,onLogoChange}){
  const logoRef=useRef();
  const displayName=user?.name||user?.email?.split("@")[0]||"Admin";
  const initials=displayName.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
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
          <div style={{marginBottom:16,borderRadius:14,border:"1.5px solid #ede9fe",overflow:"hidden"}}>
            <div style={{background:"#f5f3ff",padding:"9px 14px",borderBottom:"1px solid #ede9fe"}}><div style={{fontSize:11,color:"#7c3aed",fontWeight:700}}>🏢 COMPANY LOGO</div><div style={{fontSize:11,color:"#a78bfa",marginTop:1}}>Appears on profile & invoices</div></div>
            <div style={{padding:14,display:"flex",alignItems:"center",gap:14}}>
              <div onClick={()=>logoRef.current?.click()} style={{width:72,height:72,borderRadius:12,border:`2px dashed ${companyLogo?"#9333ea":"#c084fc"}`,background:companyLogo?"#f5f3ff":"#faf5ff",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden",flexShrink:0}}>
                {companyLogo?<img src={companyLogo} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain",padding:4}}/>:<><span style={{fontSize:22}}>🖼️</span><span style={{fontSize:9,color:"#a78bfa",marginTop:3,fontWeight:700}}>UPLOAD</span></>}
              </div>
              <div style={{flex:1}}>
                {companyLogo?(<><div style={{fontSize:12,fontWeight:700,color:"#22c55e",marginBottom:5}}>✅ Logo uploaded!</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button onClick={()=>logoRef.current?.click()} style={{fontSize:11,color:"#7c3aed",background:"#f5f3ff",border:"1px solid #ede9fe",borderRadius:7,padding:"5px 10px",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>🔄 Change</button><button onClick={()=>onLogoChange(null)} style={{fontSize:11,color:"#ef4444",background:"#fee2e2",border:"1px solid #fecaca",borderRadius:7,padding:"5px 10px",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>✕ Remove</button></div></>):(<><div style={{fontSize:12,fontWeight:700,color:"#1e0a3c",marginBottom:4}}>Upload company logo</div><div style={{fontSize:11,color:"#a78bfa",marginBottom:8,lineHeight:1.5}}>PNG or JPG · Appears on invoices</div><button onClick={()=>logoRef.current?.click()} style={{fontSize:11,color:"#fff",background:"linear-gradient(135deg,#9333ea,#a855f7)",border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>📤 Upload</button></>)}
              </div>
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
            <button onClick={onLogout} style={{flex:1,padding:"10px",background:"linear-gradient(135deg,#EF4444,#dc2626)",border:"none",borderRadius:9,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>🚪 Logout</button>
          </div>
        </div>
        <input ref={logoRef} type="file" accept="image/*" style={{display:"none"}}
          onChange={async(e)=>{const file=e.target.files[0];if(!file)return;const formData=new FormData();formData.append("file",file);try{const cloudRes=await axios.post("http://localhost:5000/api/upload/logo",formData);const uploadedUrl=cloudRes.data.logoUrl;await axios.post("http://localhost:5000/api/auth/save-logo",{userId:user.id||user._id,logoUrl:uploadedUrl});const updatedUser={...user,logoUrl:uploadedUrl};localStorage.setItem("user",JSON.stringify(updatedUser));setUser(updatedUser);onLogoChange(uploadedUrl);}catch(err){console.error(err);alert("Upload failed!");}}}
        />
      </div>
    </div>
  );
}

function Sidebar({active,setActive,onLogout,open,onClose}){
  return(
    <>
      {open&&<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:998,display:"block"}} className="mob-overlay"/>}
      <div style={{width:225,background:"linear-gradient(180deg,#1e0a3c 0%,#2d1057 60%,#1e0a3c 100%)",color:"#fff",display:"flex",flexDirection:"column",height:"100vh",position:"fixed",top:0,left:0,zIndex:999,flexShrink:0,overflow:"hidden",boxShadow:"4px 0 24px rgba(0,0,0,0.25)",transform:open?"translateX(0)":"translateX(-100%)",transition:"transform 0.28s cubic-bezier(0.4,0,0.2,1)"}} className="sidebar">
        <div style={{position:"absolute",width:140,height:140,borderRadius:"50%",background:"radial-gradient(circle,rgba(168,85,247,0.18),transparent)",top:-40,right:-40,pointerEvents:"none"}}/>
        <div style={{padding:"18px 16px 14px",borderBottom:"1px solid rgba(255,255,255,0.08)",position:"relative",zIndex:1,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,background:"linear-gradient(135deg,#9333ea,#c084fc)",borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:17,color:"#fff",boxShadow:"0 4px 14px rgba(147,51,234,0.5)"}}>M</div>
            <div><div style={{fontWeight:800,fontSize:14,color:"#fff"}}>M Business</div><div style={{fontSize:8,color:"rgba(255,255,255,0.35)",letterSpacing:1.5,marginTop:1}}>MANAGEMENT SUITE</div></div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:18,cursor:"pointer",padding:"2px 6px",lineHeight:1}} className="sidebar-close">✕</button>
        </div>
        <nav style={{flex:1,minHeight:0,padding:"10px 8px",overflowY:"auto",position:"relative",zIndex:1}}>
          {NAV.map(n=>{const on=active===n.key;return(<button key={n.key} onClick={()=>{setActive(n.key);onClose();}} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"9px 12px",background:on?"linear-gradient(90deg,rgba(147,51,234,0.35),rgba(168,85,247,0.15))":"transparent",border:on?"1px solid rgba(168,85,247,0.35)":"1px solid transparent",borderRadius:11,color:on?"#e9d5ff":"rgba(255,255,255,0.45)",fontWeight:on?700:400,fontSize:12.5,cursor:"pointer",marginBottom:2,textAlign:"left",fontFamily:"inherit"}}><span style={{fontSize:15}}>{n.icon}</span><span style={{flex:1}}>{n.label}</span>{on&&<div style={{width:5,height:5,borderRadius:"50%",background:"#c084fc",flexShrink:0}}/>}</button>);})}
        </nav>
        <div style={{padding:"10px 8px 14px",borderTop:"1px solid rgba(255,255,255,0.07)",position:"relative",zIndex:1,flexShrink:0}}>
          <button onClick={onLogout} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:9,padding:"10px 12px",background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.35)",borderRadius:11,color:"#fca5a5",fontSize:12.5,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>🚪 Logout</button>
        </div>
      </div>
      <div className="sidebar-spacer" style={{width:225,flexShrink:0}}/>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
//  PROJECT STATUS — inline component
// ══════════════════════════════════════════════════════════════
function ProjectStatusPage({clients,employees,managers}){
  const EMPTY={projectId:"",name:"",client:"",manager:"",employee:"",deadline:"",status:"In Progress",progress:0,notes:""};
  const [trackList,setTrackList]=useState(TRACKING_SEED);
  const [tsLoaded,setTsLoaded]=useState(false);
  const [tsFilter,setTsFilter]=useState("All");
  const [tsSearch,setTsSearch]=useState("");
  const [tsModal,setTsModal]=useState(null);
  const [tsEditId,setTsEditId]=useState(null);
  const [tsForm,setTsForm]=useState(EMPTY);
  const [tsErr,setTsErr]=useState({});
  const [tsSaving,setTsSaving]=useState(false);
  const [tsToast,setTsToast]=useState("");

  useEffect(()=>{
    axios.get("http://localhost:5000/api/project-status")
      .then(r=>{if(r.data?.length)setTrackList(r.data);setTsLoaded(true);})
      .catch(()=>setTsLoaded(true));
  },[]);

  const showToast=(msg)=>{setTsToast(msg);setTimeout(()=>setTsToast(""),2800);};

  const clientNames=clients.map(c=>({name:c.clientName||c.name||""}));
  const managerNames=managers.map(m=>({name:m.managerName||m.name||""}));
  const employeeNames=employees.map(e=>({name:e.name||""}));

  const displayed=trackList.filter(p=>{
    const okStatus=tsFilter==="All"||p.status===tsFilter;
    const q=tsSearch.toLowerCase();
    const okSearch=!q||(p.name||"").toLowerCase().includes(q)||(p.client||"").toLowerCase().includes(q)||(p.projectId||p.id||"").toLowerCase().includes(q)||(p.manager||"").toLowerCase().includes(q)||(p.employee||"").toLowerCase().includes(q);
    return okStatus&&okSearch;
  });

  const tsStats=[
    {t:"Total",v:trackList.length,i:"📁",c:"#9333ea"},
    {t:"In Progress",v:trackList.filter(p=>p.status==="In Progress").length,i:"⚡",c:"#7c3aed"},
    {t:"Completed",v:trackList.filter(p=>p.status==="Completed").length,i:"✅",c:"#22C55E"},
    {t:"Pending",v:trackList.filter(p=>p.status==="Pending").length,i:"🕐",c:"#F59E0B"},
    {t:"On Hold",v:trackList.filter(p=>p.status==="On Hold").length,i:"⏸️",c:"#a855f7"},
  ];

  const openAdd=()=>{setTsForm(EMPTY);setTsErr({});setTsEditId(null);setTsModal("add");};
  const openEdit=(p)=>{
    setTsForm({projectId:p.projectId||p.id||"",name:p.name||"",client:p.client||"",manager:p.manager||"",employee:p.employee||"",deadline:p.deadline||"",status:p.status||"In Progress",progress:p.progress||p.pct||0,notes:p.notes||p.note||""});
    setTsErr({});setTsEditId(p._id||p.id);setTsModal("edit");
  };

  const saveTs=async()=>{
    const errs={};
    if(!tsForm.name.trim())errs.name="Project name required";
    if(!tsForm.client.trim())errs.client="Client required";
    if(!tsForm.deadline)errs.deadline="Deadline required";
    const pv=Number(tsForm.progress);
    if(isNaN(pv)||pv<0||pv>100)errs.progress="0–100 only";
    if(Object.keys(errs).length){setTsErr(errs);return;}
    try{
      setTsSaving(true);
      const payload={...tsForm,progress:Number(tsForm.progress)};
      if(tsModal==="add"){
        const res=await axios.post("http://localhost:5000/api/project-status",payload);
        setTrackList(prev=>[res.data,...prev]);
      }else{
        const res=await axios.put(`http://localhost:5000/api/project-status/${tsEditId}`,payload);
        setTrackList(prev=>prev.map(p=>(p._id||p.id)===tsEditId?res.data:p));
      }
      showToast(tsModal==="add"?"✅ Project added!":"✅ Project updated!");
      setTsModal(null);
    }catch{
      // offline fallback
      if(tsModal==="add"){
        const local={...tsForm,_id:Date.now().toString(),projectId:tsForm.projectId||`PRJ${String(trackList.length+1).padStart(3,"0")}`,progress:Number(tsForm.progress)};
        setTrackList(prev=>[local,...prev]);
      }else{
        setTrackList(prev=>prev.map(p=>(p._id||p.id)===tsEditId?{...p,...tsForm,progress:Number(tsForm.progress)}:p));
      }
      showToast(tsModal==="add"?"✅ Added (local)!":"✅ Updated (local)!");
      setTsModal(null);
    }finally{setTsSaving(false);}
  };

  const deleteTs=async(id)=>{
    if(!window.confirm("Delete this entry?"))return;
    try{await axios.delete(`http://localhost:5000/api/project-status/${id}`);}catch{}
    setTrackList(prev=>prev.filter(p=>(p._id||p.id)!==id));
    showToast("🗑️ Deleted!");
  };

  const B2=(color)=>({background:`linear-gradient(135deg,${color},${color}cc)`,color:"#fff",border:"none",borderRadius:10,padding:"8px 16px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"});

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Toast */}
      {tsToast&&<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:"#fff",border:"1.5px solid #22c55e",borderRadius:12,padding:"12px 20px",fontSize:13,fontWeight:700,color:"#22c55e",boxShadow:"0 8px 24px rgba(0,0,0,0.12)"}}>{tsToast}</div>}

      {/* Stats */}
      <div className="dash-stats" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
        {tsStats.map(({t,v,i,c})=>(
          <div key={t} style={{background:"#fff",borderRadius:14,padding:"16px 14px",boxShadow:"0 4px 18px rgba(147,51,234,0.07)",border:"1px solid #ede9fe",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-12,right:-12,width:60,height:60,borderRadius:"50%",background:`radial-gradient(circle,${c}22,transparent)`}}/>
            <div style={{width:38,height:38,borderRadius:10,background:`${c}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,marginBottom:8}}>{i}</div>
            <div style={{fontSize:10,color:"#a78bfa",fontWeight:700,letterSpacing:0.5,marginBottom:2}}>{t.toUpperCase()}</div>
            <div style={{fontSize:24,fontWeight:800,color:c}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <div style={{position:"relative"}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}>🔍</span>
            <input placeholder="Search project, client, manager…" value={tsSearch} onChange={e=>setTsSearch(e.target.value)}
              style={{padding:"9px 14px 9px 34px",border:"1.5px solid #ede9fe",borderRadius:10,fontSize:13,background:"#faf5ff",outline:"none",fontFamily:"inherit",width:240,color:T.text}}/>
          </div>
          {["All","In Progress","Pending","Completed","On Hold"].map(f=>(
            <button key={f} onClick={()=>setTsFilter(f)}
              style={{padding:"7px 13px",borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:"1.5px solid",borderColor:tsFilter===f?"#9333ea":"#ede9fe",background:tsFilter===f?"rgba(147,51,234,0.1)":"#fff",color:tsFilter===f?"#9333ea":"#a78bfa"}}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={openAdd} style={B2("#9333ea")}>+ Add Project Status</button>
      </div>

      {/* Table */}
      <SC title={`Project Status (${displayed.length})`}>
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:900}}>
            <thead>
              <tr style={{background:"linear-gradient(90deg,#f5f3ff,#faf5ff)"}}>
                {["ID","Project","Client","Manager","Employee","Deadline","Status","Progress","Notes","Actions"].map(c=>(
                  <th key={c} style={{padding:"10px 12px",textAlign:"left",color:"#7c3aed",fontWeight:700,fontSize:11,borderBottom:"2px solid #ede9fe",whiteSpace:"nowrap"}}>{c.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.length===0
                ?<tr><td colSpan={10} style={{padding:40,textAlign:"center",color:"#a78bfa"}}>No projects found</td></tr>
                :displayed.map((p,i)=>(
                  <tr key={p._id||p.id||i} style={{borderBottom:"1px solid #f3f0ff"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#faf5ff"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"11px 12px",fontFamily:"monospace",fontSize:11,color:"#a78bfa"}}>{p.projectId||p.id||`PRJ${String(i+1).padStart(3,"0")}`}</td>
                    <td style={{padding:"11px 12px",fontWeight:700,color:T.text}}>{p.name}</td>
                    <td style={{padding:"11px 12px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:22,height:22,borderRadius:"50%",background:"linear-gradient(135deg,#9333ea,#c084fc)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9,fontWeight:700,flexShrink:0}}>{(p.client||"?")[0].toUpperCase()}</div>
                        <span style={{color:T.text,fontSize:12}}>{p.client||"—"}</span>
                      </div>
                    </td>
                    <td style={{padding:"11px 12px",color:"#7c3aed",fontSize:12}}>{p.manager||"—"}</td>
                    <td style={{padding:"11px 12px",color:"#7c3aed",fontSize:12}}>{p.employee||"—"}</td>
                    <td style={{padding:"11px 12px",fontFamily:"monospace",fontSize:12,color:"#a78bfa",whiteSpace:"nowrap"}}>{p.deadline||"—"}</td>
                    <td style={{padding:"11px 12px"}}><Badge label={p.status}/></td>
                    <td style={{padding:"11px 12px",minWidth:130}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{flex:1,background:"#ede9fe",borderRadius:6,height:7}}>
                          <div style={{width:`${p.progress||p.pct||0}%`,background:p.progress===100||p.pct===100?"linear-gradient(90deg,#22C55E,#4ade80)":"linear-gradient(90deg,#9333ea,#c084fc)",borderRadius:6,height:"100%"}}/>
                        </div>
                        <span style={{fontSize:12,fontWeight:700,color:sc(p.status),width:32,textAlign:"right"}}>{p.progress||p.pct||0}%</span>
                      </div>
                    </td>
                    <td style={{padding:"11px 12px",maxWidth:180}}>
                      <span style={{fontSize:12,color:"#a78bfa",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"block"}} title={p.notes||p.note}>
                        {(p.notes||p.note)?`📝 ${p.notes||p.note}`:"—"}
                      </span>
                    </td>
                    <td style={{padding:"11px 12px"}}>
                      <div style={{display:"flex",gap:5}}>
                        <button onClick={()=>openEdit(p)} style={{background:"#f5f3ff",border:"1px solid #ede9fe",borderRadius:7,padding:"4px 10px",fontSize:12,color:"#7c3aed",cursor:"pointer",fontWeight:600}}>Edit</button>
                        <button onClick={()=>deleteTs(p._id||p.id)} style={{background:"#fee2e2",border:"1px solid #fecaca",borderRadius:7,padding:"4px 10px",fontSize:12,color:"#ef4444",cursor:"pointer",fontWeight:600}}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </SC>

      {/* ADD / EDIT MODAL */}
      {tsModal&&(
        <Mdl title={tsModal==="add"?"Add Project Status":"Edit Project Status"} onClose={()=>setTsModal(null)}>
          <div className="modal-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}}>
            <Fld label="Project ID" value={tsForm.projectId} onChange={v=>setTsForm({...tsForm,projectId:v})} placeholder="Auto or PRJ004"/>
            <Fld label="Project Name *" value={tsForm.name} onChange={v=>{setTsForm({...tsForm,name:v});setTsErr(p=>({...p,name:""}));}} error={tsErr.name}/>

            {/* Client dropdown — reuses existing ClientDropdown */}
            <div style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:11,color:"#7c3aed",fontWeight:700,letterSpacing:0.5,marginBottom:5}}>CLIENT *</label>
              <ClientDropdown clients={clientNames.length?clients:[]} value={tsForm.client} onChange={v=>{setTsForm({...tsForm,client:v});setTsErr(p=>({...p,client:""}));}} error={tsErr.client}/>
              {tsErr.client&&<div style={{fontSize:11,color:"#EF4444",marginTop:4}}>⚠️ {tsErr.client}</div>}
            </div>

            {/* Manager searchable dropdown */}
            <SearchDropdown label="Manager" items={managerNames} displayKey="name" value={tsForm.manager} onChange={v=>setTsForm({...tsForm,manager:v})} placeholder="-- Select Manager --"/>

            {/* Employee searchable dropdown */}
            <SearchDropdown label="Employee" items={employeeNames} displayKey="name" value={tsForm.employee} onChange={v=>setTsForm({...tsForm,employee:v})} placeholder="-- Select Employee --"/>

            <Fld label="Deadline *" value={tsForm.deadline} type="date" onChange={v=>{setTsForm({...tsForm,deadline:v});setTsErr(p=>({...p,deadline:""}));}} error={tsErr.deadline}/>
            <Fld label="Status" value={tsForm.status} onChange={v=>setTsForm({...tsForm,status:v})} options={["In Progress","Pending","Completed","On Hold"]}/>
            <Fld label="Progress (0–100)" value={String(tsForm.progress)} type="number" onChange={v=>{setTsForm({...tsForm,progress:v});setTsErr(p=>({...p,progress:""}));}} error={tsErr.progress} placeholder="e.g. 65"/>
          </div>
          <Fld label="Notes" value={tsForm.notes} onChange={v=>setTsForm({...tsForm,notes:v})} placeholder="Brief update…"/>

          {/* Live preview */}
          <div style={{background:"#faf5ff",borderRadius:12,padding:"12px 16px",border:"1px solid #ede9fe",marginBottom:14}}>
            <div style={{fontSize:11,color:"#7c3aed",fontWeight:700,marginBottom:8}}>PROGRESS PREVIEW</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1,background:"#ede9fe",borderRadius:6,height:8}}>
                <div style={{width:`${Math.min(100,Math.max(0,Number(tsForm.progress)||0))}%`,background:"linear-gradient(90deg,#9333ea,#c084fc)",borderRadius:6,height:"100%",transition:"width 0.3s"}}/>
              </div>
              <span style={{fontSize:13,fontWeight:800,color:"#9333ea",width:36,textAlign:"right"}}>{Math.min(100,Math.max(0,Number(tsForm.progress)||0))}%</span>
            </div>
          </div>

          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:4}}>
            <button onClick={()=>setTsModal(null)} style={{background:"#f5f3ff",border:"1px solid #ede9fe",color:T.text,borderRadius:10,padding:"10px 16px",cursor:"pointer",fontWeight:600,fontSize:13}}>Cancel</button>
            <button onClick={saveTs} disabled={tsSaving} style={{...B2("#9333ea"),opacity:tsSaving?0.7:1}}>{tsSaving?"Saving…":tsModal==="add"?"Save Project →":"Update Project →"}</button>
          </div>
        </Mdl>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TRACKING PAGE — Project Status + Task Board tabs
// ══════════════════════════════════════════════════════════════
function TrackingPage({clients,employees,managers,projects}){
  const [tab,setTab]=useState("status");
  const tabs=[
    {key:"status",icon:"📊",label:"Project Status"},
    {key:"tasks",icon:"✅",label:"Task Board"},
  ];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Tab Bar */}
      <div style={{display:"flex",gap:6,background:"#fff",borderRadius:14,padding:6,border:"1px solid #ede9fe",width:"fit-content",boxShadow:"0 2px 10px rgba(147,51,234,0.07)"}}>
        {tabs.map(t=>{
          const on=tab===t.key;
          return(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 20px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:on?700:500,background:on?"linear-gradient(135deg,#9333ea,#a855f7)":"transparent",color:on?"#fff":"#a78bfa",transition:"all .2s",boxShadow:on?"0 4px 14px rgba(147,51,234,0.3)":"none"}}>
              <span>{t.icon}</span>{t.label}
            </button>
          );
        })}
      </div>
      {/* Content */}
      {tab==="status"&&<ProjectStatusPage clients={clients} employees={employees} managers={managers}/>}
      {tab==="tasks"&&<TaskPage projects={projects} employees={employees}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN DASHBOARD EXPORT
// ══════════════════════════════════════════════════════════════
export default function Dashboard({setUser,user,fixedLogo}){
  const [active,setActive]=useState("dashboard");
  const [modal,setModal]=useState(null);
  const [showProfile,setShowProfile]=useState(false);
  const [sidebarOpen,setSidebarOpen]=useState(false);

  const [companyLogo,setCompanyLogo]=useState(user?.logoUrl||fixedLogo||null);
  useEffect(()=>{setCompanyLogo(user?.logoUrl||fixedLogo||null);},[user,fixedLogo]);

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

  const [managers,setManagers]=useState([]);
  const [mgrLoading,setMgrLoading]=useState(false);
  const [mgrSearch,setMgrSearch]=useState("");
  const [nm,setNm]=useState({managerName:"",email:"",phone:"",department:"",role:"Manager",address:"",password:"",status:"Active"});
  const [nmError,setNmError]=useState({});
  const [mgrSaveLoading,setMgrSaveLoading]=useState(false);
  const [showMgrPass,setShowMgrPass]=useState(false);

  useEffect(()=>{fetchClients();fetchEmployees();fetchProjects();fetchManagers();},[]);

  const handleLogout=()=>{localStorage.removeItem("user");setUser(null);};

  const onLogoChange=async(logo)=>{
    setCompanyLogo(logo||fixedLogo);
    const updatedUser={...user,logoUrl:logo||""};
    localStorage.setItem("user",JSON.stringify(updatedUser));
    setUser(updatedUser);
    try{await axios.post("http://localhost:5000/api/auth/save-logo",{userId:user._id||user.id,logoUrl:logo||""});}
    catch(e){console.log(e);}
  };

  const fetchClients=async()=>{try{setClientsLoading(true);const res=await axios.get("http://localhost:5000/api/clients");setClients(res.data);}catch(e){console.log(e);}finally{setClientsLoading(false);}};
  const fetchEmployees=async()=>{try{setEmpLoading(true);const res=await axios.get("http://localhost:5000/api/employees");setEmployees(res.data);}catch(e){console.log(e);}finally{setEmpLoading(false);}};
  const fetchProjects=async()=>{try{setProjLoading(true);const res=await axios.get("http://localhost:5000/api/projects");setProjects(res.data);}catch(e){console.log(e);}finally{setProjLoading(false);}};
  const fetchManagers=async()=>{try{setMgrLoading(true);const res=await axios.get("http://localhost:5000/api/managers");setManagers(res.data);}catch(e){console.log(e);}finally{setMgrLoading(false);}};

  const addClient=async()=>{const errors={};if(!nc.name.trim())errors.name="Name is required";if(!nc.email.trim())errors.email="Email is required";else if(!nc.email.endsWith("@gmail.com"))errors.email="Only @gmail.com allowed";if(!nc.password.trim())errors.password="Password is required";if(Object.keys(errors).length>0){setNcError(errors);return;}try{setSaveLoading(true);const payload={clientName:nc.name,companyName:nc.company,email:nc.email,phone:nc.phone,address:nc.address,projectAssigned:nc.project,password:nc.password,status:nc.status};const res=await axios.post("http://localhost:5000/api/clients/add",payload);setClients(prev=>[res.data.client,...prev]);setNc({name:"",company:"",email:"",phone:"",address:"",project:"",password:"",status:"Active"});setNcError({});setModal(null);}catch(err){setNcError({email:err.response?.data?.msg||"Failed to save"});}finally{setSaveLoading(false);}};
  const addEmployee=async()=>{const errors={};if(!ne.name.trim())errors.name="Name is required";if(!ne.email.trim())errors.email="Email is required";if(Object.keys(errors).length>0){setNeError(errors);return;}try{setEmpSaveLoading(true);const res=await axios.post("http://localhost:5000/api/employees/add",ne);setEmployees(prev=>[res.data.employee,...prev]);setNe({name:"",email:"",phone:"",role:"",department:"",salary:"",status:"Active"});setNeError({});setModal(null);}catch(err){setNeError({email:err.response?.data?.msg||"Failed to save"});}finally{setEmpSaveLoading(false);}};
  const addProject=async()=>{const errors={};if(!np.name.trim())errors.name="Project name is required";if(!np.client.trim())errors.client="Client is required";if(Object.keys(errors).length>0){setNpError(errors);return;}try{setProjSaveLoading(true);await axios.post("http://localhost:5000/api/projects/add",np);await fetchProjects();setNp({name:"",client:"",purpose:"",description:"",start:"",end:"",budget:"",team:"",status:"Pending"});setNpError({});setModal(null);}catch(err){setNpError({name:err.response?.data?.msg||"Failed to save"});}finally{setProjSaveLoading(false);}};
  const addManager=async()=>{const errors={};if(!nm.managerName.trim())errors.managerName="Name is required";if(!nm.email.trim())errors.email="Email is required";if(!nm.password.trim())errors.password="Password is required";if(Object.keys(errors).length>0){setNmError(errors);return;}try{setMgrSaveLoading(true);const res=await axios.post("http://localhost:5000/api/managers/add",nm);setManagers(prev=>[res.data.manager,...prev]);setNm({managerName:"",email:"",phone:"",department:"",role:"Manager",address:"",password:"",status:"Active"});setNmError({});setModal(null);}catch(err){setNmError({email:err.response?.data?.msg||"Failed to save"});}finally{setMgrSaveLoading(false);}};

  const filteredClients=clients.filter(c=>(c.clientName||c.name||"").toLowerCase().includes(clientSearch.toLowerCase())||(c.email||"").toLowerCase().includes(clientSearch.toLowerCase())||(c.companyName||c.company||"").toLowerCase().includes(clientSearch.toLowerCase()));
  const filteredEmployees=employees.filter(e=>(e.name||"").toLowerCase().includes(empSearch.toLowerCase())||(e.email||"").toLowerCase().includes(empSearch.toLowerCase())||(e.role||"").toLowerCase().includes(empSearch.toLowerCase()));
  const filteredProjects=projects.filter(p=>(p.name||"").toLowerCase().includes(projSearch.toLowerCase())||(p.client||"").toLowerCase().includes(projSearch.toLowerCase()));
  const filteredManagers=managers.filter(m=>(m.managerName||"").toLowerCase().includes(mgrSearch.toLowerCase())||(m.email||"").toLowerCase().includes(mgrSearch.toLowerCase())||(m.department||"").toLowerCase().includes(mgrSearch.toLowerCase()));

  const page=NAV.find(n=>n.key===active);
  const displayName=user?.name||user?.email?.split("@")[0]||"Admin";
  const initials=displayName.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
  const B=(color)=>({background:`linear-gradient(135deg,${color},${color}cc)`,color:"#fff",border:"none",borderRadius:10,padding:"8px 16px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"});

  return(
    <div style={{display:"flex",minHeight:"100vh",background:"linear-gradient(135deg,#f5f3ff 0%,#faf5ff 50%,#f3e8ff 100%)",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:#d8b4fe;border-radius:3px}
        button,input,select,textarea{font-family:inherit}
        @media (min-width: 769px) {
          .sidebar { transform: translateX(0) !important; position: sticky !important; top: 0 !important; }
          .sidebar-close { display: none !important; }
          .mob-overlay { display: none !important; }
          .mob-topbar { display: none !important; }
          .sidebar-spacer { display: none !important; }
        }
        @media (max-width: 768px) {
          .sidebar-spacer { display: none !important; }
          .mob-topbar-hide { display: none !important; }
          .main-content { padding: 12px !important; }
          .dash-stats { grid-template-columns: repeat(2,1fr) !important; gap: 10px !important; }
          .dash-2col { grid-template-columns: 1fr !important; }
          .inv-grid { grid-template-columns: 1fr !important; }
          .modal-2col { grid-template-columns: 1fr !important; }
          .page-header { flex-wrap: wrap; gap: 8px; }
          .header-actions { flex-wrap: wrap; gap: 8px; }
          .page-header h1 { font-size: 18px !important; }
          .page-header p { font-size: 11px !important; }
        }
        @media (max-width: 480px) {
          .main-content { padding: 10px !important; }
          .dash-stats { grid-template-columns: repeat(2,1fr) !important; gap: 8px !important; }
          .page-header h1 { font-size: 16px !important; }
        }
      `}</style>

      <Sidebar active={active} setActive={setActive} onLogout={handleLogout} open={sidebarOpen} onClose={()=>setSidebarOpen(false)}/>

      <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column"}}>
        <div className="mob-topbar" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:"#fff",borderBottom:"1px solid #ede9fe",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px rgba(147,51,234,0.07)"}}>
          <button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#7c3aed",padding:"2px 6px",lineHeight:1}}>☰</button>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:30,height:30,background:"linear-gradient(135deg,#9333ea,#c084fc)",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#fff"}}>M</div>
            <span style={{fontWeight:800,fontSize:14,color:T.text}}>M Business</span>
          </div>
          <div onClick={()=>setShowProfile(true)} style={{width:34,height:34,background:"linear-gradient(135deg,#9333ea,#c084fc)",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",overflow:"hidden"}}>
            {companyLogo?<img src={companyLogo} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain",padding:3,background:"#fff"}}/>:<span>{initials}</span>}
          </div>
        </div>

        <div className="main-content" style={{flex:1,padding:"22px 24px",overflowY:"auto"}}>
          <div className="page-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
            <div>
              <h1 style={{margin:0,fontSize:22,fontWeight:800,color:T.text}}>{page.icon} {page.label}</h1>
              <p style={{margin:"3px 0 0",color:"#a78bfa",fontSize:12}}>M Business Management Suite</p>
            </div>
            <div className="header-actions" style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
              {active==="clients"&&<button onClick={()=>{setNcError({});setShowClientPass(false);setModal("client");}} style={B("#9333ea")}>+ Add Client</button>}
              {active==="employees"&&<button onClick={()=>{setNeError({});setModal("employee");}} style={B("#7c3aed")}>+ Add Employee</button>}
              {active==="projects"&&<button onClick={()=>{setNpError({});setModal("project");}} style={B("#a855f7")}>+ New Project</button>}
              {active==="managers"&&<button onClick={()=>{setNmError({});setShowMgrPass(false);setModal("manager");}} style={B("#f59e0b")}>+ Add Manager</button>}
              <div onClick={()=>setShowProfile(true)} className="mob-topbar-hide" style={{background:"#fff",border:"1.5px solid #ede9fe",borderRadius:12,padding:"6px 12px",display:"flex",alignItems:"center",gap:8,cursor:"pointer",boxShadow:"0 2px 10px rgba(147,51,234,0.08)",flexShrink:0}}>
                <div style={{width:30,height:30,background:"linear-gradient(135deg,#9333ea,#c084fc)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:12,overflow:"hidden",flexShrink:0}}>
                  {companyLogo?<img src={companyLogo} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain",padding:3,background:"#fff"}} onError={()=>setCompanyLogo(null)}/>:<span>{initials}</span>}
                </div>
                <span style={{fontSize:13,fontWeight:600,color:T.text,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayName}</span>
                <span style={{fontSize:10,color:"#a78bfa"}}>▾</span>
              </div>
            </div>
          </div>

          {active==="dashboard"&&<>
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
              <SC title="Recent Projects"><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:300}}><thead><tr style={{background:"#faf5ff"}}>{["Project","Client","Status"].map(c=><th key={c} style={{padding:"8px 10px",textAlign:"left",color:"#a78bfa",fontWeight:700,fontSize:11,borderBottom:"2px solid #ede9fe"}}>{c.toUpperCase()}</th>)}</tr></thead><tbody>{projects.slice(0,5).map((p,i)=><tr key={i} style={{borderBottom:"1px solid #f5f3ff"}}><td style={{padding:"9px 10px",fontWeight:600,color:T.text}}>{p.name}</td><td style={{padding:"9px 10px",color:"#a78bfa"}}>{p.client}</td><td style={{padding:"9px 10px"}}><Badge label={p.status}/></td></tr>)}</tbody></table></div></SC>
              <SC title="Recent Activity">{[{icon:"👤",text:"New client added",time:"2m ago",c:"#9333ea"},{icon:"👨‍💼",text:"Employee joined",time:"30m ago",c:"#7c3aed"},{icon:"🧾",text:"Invoice created",time:"1h ago",c:"#22C55E"},{icon:"📁",text:"Project updated",time:"3h ago",c:"#a855f7"},{icon:"✅",text:"ERP completed",time:"2d ago",c:"#F59E0B"}].map((a,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<4?"1px solid #f5f3ff":"none"}}><div style={{width:28,height:28,borderRadius:8,background:`${a.c}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{a.icon}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.text}</div><div style={{fontSize:11,color:"#a78bfa"}}>{a.time}</div></div></div>))}</SC>
            </div>
            <div className="dash-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <SC title="Project Progress">{TRACKING_SEED.map(t=>(<div key={t.id} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,fontWeight:600,color:T.text}}>{t.name}</span><span style={{fontSize:12,fontWeight:700,color:sc(t.status)}}>{t.pct}%</span></div><div style={{background:"#ede9fe",borderRadius:6,height:6}}><div style={{width:`${t.pct}%`,background:t.pct===100?"linear-gradient(90deg,#22C55E,#4ade80)":"linear-gradient(90deg,#9333ea,#c084fc)",borderRadius:6,height:"100%"}}/></div><div style={{fontSize:11,color:"#a78bfa",marginTop:2}}>{t.client}</div></div>))}</SC>
              <SC title="Invoice Status">{INVOICES.map(inv=>(<div key={inv.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f5f3ff"}}><div><div style={{fontSize:13,fontWeight:600,color:T.text}}>{inv.id} · {inv.client}</div><div style={{fontSize:11,color:"#a78bfa"}}>Due: {inv.due}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:3}}>{inv.total}</div><Badge label={inv.status}/></div></div>))}</SC>
            </div>
          </>}

          {active==="clients"&&<SC title={`All Clients (${filteredClients.length})`}><Search value={clientSearch} onChange={setClientSearch} placeholder="Search by name, email, company..."/>{clientsLoading?<div style={{textAlign:"center",padding:40,color:"#a78bfa"}}>Loading...</div>:<Tbl cols={["ID","Name","Company","Email","Phone","Status","Created"]} rows={filteredClients.map((c,i)=>[`CLT${String(i+1).padStart(3,"0")}`,c.clientName||c.name||"—",c.companyName||c.company||"—",c.email,c.phone||"—",<Badge label={c.status}/>,c.createdAt?new Date(c.createdAt).toLocaleDateString():"—"])}/>}</SC>}
          {active==="employees"&&<SC title={`All Employees (${filteredEmployees.length})`}><Search value={empSearch} onChange={setEmpSearch} placeholder="Search by name, email, role..."/>{empLoading?<div style={{textAlign:"center",padding:40,color:"#a78bfa"}}>Loading...</div>:<Tbl cols={["ID","Name","Email","Phone","Role","Department","Status","Joined"]} rows={filteredEmployees.map((e,i)=>[`EMP${String(i+1).padStart(3,"0")}`,e.name,e.email,e.phone||"—",e.role||"—",e.department||"—",<Badge label={e.status}/>,e.createdAt?new Date(e.createdAt).toLocaleDateString():"—"])}/>}</SC>}
          {active==="projects"&&<SC title={`All Projects (${filteredProjects.length})`}><Search value={projSearch} onChange={setProjSearch} placeholder="Search by project name, client..."/>{projLoading?<div style={{textAlign:"center",padding:40,color:"#a78bfa"}}>Loading...</div>:<Tbl cols={["ID","Name","Client","Start","End","Budget","Status","Created"]} rows={filteredProjects.map((p,i)=>[`PRJ${String(i+1).padStart(3,"0")}`,p.name,p.client,p.start||"—",p.end||"—",p.budget||"—",<Badge label={p.status}/>,p.createdAt?new Date(p.createdAt).toLocaleDateString():"—"])}/>}</SC>}

          {active==="managers"&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div className="dash-stats" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                {[{t:"Total Managers",v:managers.length,i:"🧑‍💼",c:"#f59e0b"},{t:"Active",v:managers.filter(m=>m.status==="Active").length,i:"✅",c:"#22C55E"},{t:"Inactive",v:managers.filter(m=>m.status==="Inactive").length,i:"⛔",c:"#EF4444"}].map(({t,v,i,c})=>(
                  <div key={t} style={{background:"#fff",borderRadius:14,padding:"16px 14px",boxShadow:"0 4px 18px rgba(147,51,234,0.07)",border:"1px solid #ede9fe",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:40,height:40,borderRadius:11,background:`${c}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{i}</div>
                    <div><div style={{fontSize:10,color:"#a78bfa",fontWeight:700,letterSpacing:0.5}}>{t.toUpperCase()}</div><div style={{fontSize:24,fontWeight:800,color:c}}>{v}</div></div>
                  </div>
                ))}
              </div>
              <SC title={`All Managers (${filteredManagers.length})`}>
                <Search value={mgrSearch} onChange={setMgrSearch} placeholder="Search by name, email, department..."/>
                {mgrLoading?<div style={{textAlign:"center",padding:40,color:"#a78bfa"}}>Loading...</div>
                  :<Tbl cols={["ID","Name","Email","Phone","Role","Department","Status","Joined"]} rows={filteredManagers.map((m,i)=>[`MGR${String(i+1).padStart(3,"0")}`,<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#f59e0b,#fbbf24)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700,flexShrink:0}}>{(m.managerName||"?")[0].toUpperCase()}</div><span style={{fontWeight:600}}>{m.managerName}</span></div>,m.email,m.phone||"—",m.role||"Manager",m.department||"—",<Badge label={m.status}/>,m.createdAt?new Date(m.createdAt).toLocaleDateString():"—"])}/>}
              </SC>
            </div>
          )}

          {active==="invoices"&&<InvoiceCreator clients={clients} projects={projects} companyLogo={companyLogo} onLogoChange={onLogoChange}/>}
          {active==="quotations"&&<SC title="All Quotations"><Tbl cols={["ID","Client","Project","Amount","Date","Expiry","Status"]} rows={QUOTATIONS.map(q=>[q.id,q.client,q.project,q.final,q.date,q.expiry,<Badge label={q.status}/>])}/></SC>}

          {/* ✅ PROJECT STATUS */}
          {active==="tracking"&&<ProjectStatusPage clients={clients} employees={employees} managers={managers}/>}

          {/* ✅ TASKS — monday.com style board */}
          {active==="tasks"&&<TaskPage projects={projects} employees={employees}/>}

          {active==="calendar"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>{EVENTS.map(e=>(<div key={e.id} style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 4px 18px rgba(147,51,234,0.07)",border:"1px solid #ede9fe",display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}><div style={{background:"linear-gradient(135deg,#9333ea22,#c084fc22)",border:"1.5px solid #c084fc44",borderRadius:10,padding:"10px 14px",textAlign:"center",minWidth:52,flexShrink:0}}><div style={{fontSize:20,fontWeight:800,color:"#9333ea"}}>{e.date.split("-")[2]}</div><div style={{fontSize:9,color:"#a78bfa",fontWeight:700,letterSpacing:1}}>MAY</div></div><div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:700,color:T.text}}>{e.name}</div><div style={{color:"#a78bfa",fontSize:12,marginTop:2}}>{e.project} · {e.client}</div><div style={{color:"#a78bfa",fontSize:12,marginTop:2}}>🕐 {e.start} – {e.end}</div></div></div>))}</div>}
          {active==="accounts"&&(<div style={{display:"flex",flexDirection:"column",gap:14}}><div className="dash-stats" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:4}}>{[{t:"Total Accounts",v:ACCOUNTS.length,i:"👤",c:"#9333ea"},{t:"Active",v:ACCOUNTS.filter(a=>a.status==="Active").length,i:"✅",c:"#22C55E"},{t:"Inactive",v:ACCOUNTS.filter(a=>a.status==="Inactive").length,i:"⛔",c:"#EF4444"}].map(({t,v,i,c})=>(<div key={t} style={{background:"#fff",borderRadius:14,padding:"16px 14px",boxShadow:"0 4px 18px rgba(147,51,234,0.07)",border:"1px solid #ede9fe",display:"flex",alignItems:"center",gap:12}}><div style={{width:40,height:40,borderRadius:11,background:`${c}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{i}</div><div><div style={{fontSize:10,color:"#a78bfa",fontWeight:700,letterSpacing:0.5}}>{t.toUpperCase()}</div><div style={{fontSize:24,fontWeight:800,color:c}}>{v}</div></div></div>))}</div><SC title={`All Accounts (${ACCOUNTS.length})`}><Tbl cols={["ID","Name","Email","Role","Joined","Status"]} rows={ACCOUNTS.map(a=>[a.id,<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#9333ea,#c084fc)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700}}>{a.name.split(" ").map(w=>w[0]).join("").slice(0,2)}</div><span style={{fontWeight:600}}>{a.name}</span></div>,a.email,<Badge label={a.role}/>,a.joined,<Badge label={a.status}/>])}/></SC></div>)}
          {active==="reports"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>{REPORTS.map(r=>(<div key={r.id} style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 4px 18px rgba(147,51,234,0.07)",border:"1px solid #ede9fe"}}><div style={{marginBottom:12}}><div style={{fontSize:10,color:"#a78bfa",fontWeight:700}}>{r.id}</div><h3 style={{margin:"4px 0",fontSize:15,color:T.text}}>{r.type}</h3><div style={{fontSize:12,color:"#a78bfa"}}>📅 {r.range}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>{[["Total",r.total],["Revenue",r.revenue],["Done",r.done],["Pending",r.pending]].map(([k,v])=>(<div key={k} style={{background:"#faf5ff",borderRadius:9,padding:"9px 11px",border:"1px solid #ede9fe"}}><div style={{fontSize:10,color:"#a78bfa",fontWeight:700,marginBottom:3}}>{k.toUpperCase()}</div><div style={{fontSize:15,fontWeight:800,color:T.text}}>{v}</div></div>))}</div></div>))}</div>}
        </div>
      </div>

      {showProfile&&<ProfileModal user={user} setUser={setUser} onClose={()=>setShowProfile(false)} onLogout={handleLogout} companyLogo={companyLogo} onLogoChange={onLogoChange}/>}

      {modal==="client"&&<Mdl title="Add New Client" onClose={()=>setModal(null)}>
        <div className="modal-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}}>
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
            <input type={showClientPass?"text":"password"} value={nc.password} onChange={e=>setNc({...nc,password:e.target.value})} style={{width:"100%",border:`1.5px solid ${ncError.password?"#EF4444":"#ede9fe"}`,borderRadius:10,padding:"10px 46px 10px 14px",fontSize:13,color:T.text,background:"#faf5ff",boxSizing:"border-box",outline:"none"}} placeholder="Set client password"/>
            <button type="button" onClick={()=>setShowClientPass(!showClientPass)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#a78bfa",fontSize:11,fontWeight:700,fontFamily:"inherit"}}>{showClientPass?"HIDE":"SHOW"}</button>
          </div>
          {ncError.password&&<div style={{fontSize:11,color:"#EF4444",marginTop:4}}>⚠️ {ncError.password}</div>}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:6}}>
          <button onClick={()=>setModal(null)} style={{background:"#f5f3ff",border:"1px solid #ede9fe",color:T.text,borderRadius:10,padding:"10px 16px",cursor:"pointer",fontWeight:600,fontSize:13}}>Cancel</button>
          <button onClick={addClient} disabled={saveLoading} style={{...B("#9333ea"),opacity:saveLoading?0.7:1}}>{saveLoading?"Saving...":"Save Client →"}</button>
        </div>
      </Mdl>}

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
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:6}}>
          <button onClick={()=>setModal(null)} style={{background:"#f5f3ff",border:"1px solid #ede9fe",color:T.text,borderRadius:10,padding:"10px 16px",cursor:"pointer",fontWeight:600,fontSize:13}}>Cancel</button>
          <button onClick={addEmployee} disabled={empSaveLoading} style={{...B("#7c3aed"),opacity:empSaveLoading?0.7:1}}>{empSaveLoading?"Saving...":"Save Employee →"}</button>
        </div>
      </Mdl>}

      {modal==="project"&&<Mdl title="Create New Project" onClose={()=>setModal(null)}>
        <div className="modal-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}}>
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
          <button onClick={()=>setModal(null)} style={{background:"#f5f3ff",border:"1px solid #ede9fe",color:T.text,borderRadius:10,padding:"10px 16px",cursor:"pointer",fontWeight:600,fontSize:13}}>Cancel</button>
          <button onClick={addProject} disabled={projSaveLoading} style={{...B("#a855f7"),opacity:projSaveLoading?0.7:1}}>{projSaveLoading?"Saving...":"Save Project →"}</button>
        </div>
      </Mdl>}

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

    </div>
  );
}
