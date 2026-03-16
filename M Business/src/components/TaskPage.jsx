import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

const P = {
  accent:  "#9333ea",
  mid:     "#7c3aed",
  dark:    "#1e0a3c",
  light:   "#f5f3ff",
  border:  "#ede9fe",
  text:    "#1e0a3c",
  muted:   "#a78bfa",
  hover:   "#faf5ff",
};

const STATUS_CFG = {
  "Done":          { bg:"#00c875", fg:"#fff" },
  "Working on it": { bg:"#fdab3d", fg:"#fff" },
  "Stuck":         { bg:"#e2445c", fg:"#fff" },
  "In Review":     { bg:"#9333ea", fg:"#fff" },
  "Not Started":   { bg:"#c4c4c4", fg:"#555" },
  "On Hold":       { bg:"#7c3aed", fg:"#fff" },
};
const STATUS_LIST = ["Not Started","Working on it","In Review","Stuck","Done","On Hold"];
const GRP_COLORS  = ["#e2445c","#0073ea","#fdab3d","#9333ea","#00c875","#a25ddc","#7c3aed","#ff642e","#00d4c8"];

const AVATAR_COLORS = [
  "linear-gradient(135deg,#9333ea,#c084fc)",
  "linear-gradient(135deg,#0073ea,#60a5fa)",
  "linear-gradient(135deg,#00c875,#34d399)",
  "linear-gradient(135deg,#fdab3d,#fbbf24)",
  "linear-gradient(135deg,#e2445c,#f87171)",
  "linear-gradient(135deg,#a25ddc,#d8b4fe)",
];

function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function fmt(d){
  if(!d)return"";
  const dt=new Date(d);
  return isNaN(dt)?d:dt.toLocaleDateString("en-US",{month:"short",day:"numeric"});
}

/* ─── TOAST ─── */
function Toast({msg,type}){
  const c=type==="error"?"#e2445c":type==="info"?"#0073ea":"#00c875";
  return(
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:"#fff",
      border:`1.5px solid ${c}`,borderRadius:12,padding:"11px 18px",fontSize:13,
      fontWeight:700,color:c,boxShadow:"0 8px 32px rgba(124,58,237,0.2)",
      display:"flex",alignItems:"center",gap:8,animation:"toastIn .2s ease",fontFamily:"inherit"}}>
      {type==="error"?"❌":type==="info"?"ℹ️":"✅"} {msg}
    </div>
  );
}

/* ─── DROPDOWN ─── */
function DD({anchor,onClose,children,w=180}){
  const ref=useRef();
  const [pos,setPos]=useState({top:0,left:0});
  useEffect(()=>{
    if(anchor?.current){
      const r=anchor.current.getBoundingClientRect();
      let left=r.left;
      if(left+w>window.innerWidth-8) left=window.innerWidth-w-8;
      setPos({top:r.bottom+4,left});
    }
    const h=e=>{
      if(ref.current&&!ref.current.contains(e.target)&&!anchor?.current?.contains(e.target))
        onClose();
    };
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[anchor,onClose,w]);
  return(
    <div ref={ref} style={{position:"fixed",top:pos.top,left:pos.left,zIndex:6000,
      background:"#fff",border:`1.5px solid ${P.border}`,borderRadius:10,padding:5,
      boxShadow:"0 8px 28px rgba(124,58,237,0.18)",minWidth:w,animation:"ddIn .1s ease"}}>
      {children}
    </div>
  );
}

const MI=({onClick,icon,title,sub,active,danger,check})=>(
  <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",
    borderRadius:7,cursor:"pointer",fontSize:13,fontFamily:"inherit",
    color:danger?"#e2445c":active?P.accent:P.text,
    background:active?"rgba(147,51,234,0.08)":"transparent",transition:"background .1s"}}
    onMouseEnter={e=>e.currentTarget.style.background=active?"rgba(147,51,234,0.13)":P.light}
    onMouseLeave={e=>e.currentTarget.style.background=active?"rgba(147,51,234,0.08)":"transparent"}
  >
    {icon&&<span style={{fontSize:15,lineHeight:1,flexShrink:0}}>{icon}</span>}
    <div style={{flex:1}}>
      <div style={{fontWeight:active||sub?600:400}}>{title}</div>
      {sub&&<div style={{fontSize:11,color:P.muted,marginTop:1}}>{sub}</div>}
    </div>
    {check&&active&&<span style={{color:P.accent,fontSize:12,flexShrink:0}}>✓</span>}
  </div>
);

const Sep=()=><div style={{height:1,background:P.border,margin:"4px 0"}}/>;

/* ─── STATUS PICKER ─── fixed-portal, never scrolls away ─── */
function StatusPicker({anchor,onSelect,onClose}){
  const ref = useRef();
  const [pos, setPos] = useState({top:0,left:0,w:190});

  useEffect(()=>{
    const calc = () => {
      if(anchor?.current){
        const r = anchor.current.getBoundingClientRect();
        // prefer below, but flip up if not enough room
        const spaceBelow = window.innerHeight - r.bottom;
        const panelH = Object.keys(STATUS_CFG).length * 38 + 16;
        const top = spaceBelow > panelH ? r.bottom + 2 : r.top - panelH - 2;
        let left = r.left;
        if(left + 190 > window.innerWidth - 8) left = window.innerWidth - 198;
        setPos({top, left});
      }
    };
    calc();
    window.addEventListener('scroll', calc, true);
    window.addEventListener('resize', calc);
    return () => {
      window.removeEventListener('scroll', calc, true);
      window.removeEventListener('resize', calc);
    };
  },[anchor]);

  useEffect(()=>{
    const h = e => {
      if(ref.current && !ref.current.contains(e.target) && !anchor?.current?.contains(e.target))
        onClose();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  },[anchor, onClose]);

  return (
    <div ref={ref} style={{
      position:"fixed", top:pos.top, left:pos.left, zIndex:9999,
      background:"#fff", border:`1.5px solid ${P.border}`, borderRadius:10,
      padding:6, boxShadow:"0 8px 32px rgba(124,58,237,0.22)",
      minWidth:190, animation:"ddIn .1s ease"
    }}>
      {Object.entries(STATUS_CFG).map(([s,sc])=>(
        <div key={s}
          onClick={e=>{e.stopPropagation();onSelect(s);onClose();}}
          style={{borderRadius:7,overflow:"hidden",marginBottom:3,cursor:"pointer",transition:"transform .1s"}}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.02)"}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
        >
          <div style={{background:sc.bg,color:sc.fg,padding:"8px 14px",fontSize:12,
            fontWeight:700,textAlign:"center",letterSpacing:0.2}}>{s}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── PERSON PICKER DROPDOWN ─── */
function PersonPicker({ anchor, onSelect, onClose, employees, currentAssignee }) {
  const [search, setSearch] = useState("");
  const inputRef = useRef();

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const filtered = employees.filter(e =>
    !search || e.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DD anchor={anchor} onClose={onClose} w={280}>
      {/* Search box */}
      <div style={{ padding: "6px 8px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6,
          border: `1.5px solid ${P.border}`, borderRadius: 8, padding: "6px 10px",
          background: P.light }}>
          <span style={{ fontSize: 13, color: P.muted }}>🔍</span>
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search names, roles or teams"
            style={{ border: "none", outline: "none", background: "transparent",
              fontSize: 12, color: P.text, fontFamily: "inherit", flex: 1 }}
          />
          <span style={{ fontSize: 10, color: P.muted, cursor: "pointer",
            border: `1px solid ${P.border}`, borderRadius: 4, padding: "1px 5px" }}>ⓘ</span>
        </div>
      </div>

      <Sep />

      {/* Suggested people label */}
      <div style={{ fontSize: 10, color: P.muted, fontWeight: 700, letterSpacing: 0.8,
        textTransform: "uppercase", padding: "3px 10px 5px" }}>
        {search ? "Results" : "Suggested people"}
      </div>

      {/* Employee list */}
      <div style={{ maxHeight: 200, overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "10px 12px", fontSize: 12, color: P.muted, textAlign: "center" }}>
            No people found
          </div>
        ) : (
          filtered.map((emp, i) => {
            const isActive = currentAssignee === emp;
            return (
              <div key={emp} onClick={() => { onSelect(emp); onClose(); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px",
                  borderRadius: 7, cursor: "pointer",
                  background: isActive ? "rgba(147,51,234,0.08)" : "transparent",
                  transition: "background .1s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(147,51,234,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = isActive ? "rgba(147,51,234,0.08)" : "transparent"}
              >
                <div style={{ width: 30, height: 30, borderRadius: "50%",
                  background: getAvatarColor(emp),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {emp.slice(0, 2).toUpperCase()}
                </div>
                <span style={{ fontSize: 13, color: P.text, flex: 1, fontWeight: isActive ? 600 : 400 }}>{emp}</span>
                {isActive && <span style={{ color: P.accent, fontSize: 12 }}>✓</span>}
              </div>
            );
          })
        )}
      </div>

      <Sep />

      {/* Unassign option if assigned */}
      {currentAssignee && (
        <div onClick={() => { onSelect(""); onClose(); }}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px",
            borderRadius: 7, cursor: "pointer", transition: "background .1s" }}
          onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <div style={{ width: 30, height: 30, borderRadius: "50%",
            border: `1.5px dashed #e2445c`, display: "flex", alignItems: "center",
            justifyContent: "center", color: "#e2445c", fontSize: 14 }}>✕</div>
          <span style={{ fontSize: 13, color: "#e2445c", fontWeight: 500 }}>Unassign</span>
        </div>
      )}

      {/* Invite option */}
      <div onClick={() => { onClose(); }}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px",
          borderRadius: 7, cursor: "pointer", transition: "background .1s" }}
        onMouseEnter={e => e.currentTarget.style.background = P.light}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div style={{ width: 30, height: 30, borderRadius: "50%",
          border: `1.5px dashed ${P.muted}`, display: "flex", alignItems: "center",
          justifyContent: "center", color: P.muted, fontSize: 16 }}>+</div>
        <span style={{ fontSize: 13, color: P.mid }}>Invite a new member by email</span>
      </div>

      <Sep />

      {/* Notification bar */}
      <div style={{ margin: "4px 6px 4px", background: "#eff6ff", border: "1px solid #bfdbfe",
        borderRadius: 8, padding: "8px 10px", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>🔔</span>
          <span style={{ fontSize: 11, color: "#1d4ed8", fontWeight: 500 }}>Assignees will be notified</span>
        </div>
        <button style={{ fontSize: 11, color: "#1d4ed8", background: "#fff",
          border: "1px solid #bfdbfe", borderRadius: 6, padding: "3px 10px",
          cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Mute</button>
      </div>

      {/* Auto-assign */}
      <div onClick={() => { onClose(); }}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
          borderRadius: 7, cursor: "pointer", transition: "background .1s" }}
        onMouseEnter={e => e.currentTarget.style.background = P.light}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <span style={{ fontSize: 16 }}>✨</span>
        <span style={{ fontSize: 13, color: P.mid, fontWeight: 500 }}>Auto-assign people</span>
      </div>
    </DD>
  );
}

/* ─── TOOLBAR BUTTON ─── */
const TB = React.forwardRef(({icon,label,active,onClick,badge},ref)=>(
  <button ref={ref} onClick={onClick} style={{
    display:"flex",alignItems:"center",gap:5,padding:"5px 10px",
    background:active?"rgba(147,51,234,0.1)":"transparent",
    border:`1.5px solid ${active?P.accent:"transparent"}`,
    borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit",
    color:active?P.accent:P.mid,fontWeight:active?700:500,
    whiteSpace:"nowrap",transition:"all .15s",flexShrink:0,
  }}
    onMouseEnter={e=>{if(!active){e.currentTarget.style.background=P.light;e.currentTarget.style.borderColor=P.border;}}}
    onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";}}}
  >
    {icon&&<span style={{fontSize:13,lineHeight:1}}>{icon}</span>}
    {label&&<span>{label}</span>}
    {badge!=null&&<span style={{fontSize:10,background:`${P.accent}20`,color:P.accent,borderRadius:8,padding:"1px 6px",fontWeight:700}}>{badge}</span>}
  </button>
));

/* ─── NEW TASK BTN ─── */
function NewTaskBtn({onAddTask,onTriggerGroup,showToast,onImport,groups,onAddTaskToGroup}){
  const [open,setOpen]=useState(false);
  const [showGroupPicker,setShowGroupPicker]=useState(false);
  const [showTaskPicker,setShowTaskPicker]=useState(false);
  const [taskTitle,setTaskTitle]=useState("");
  const [selGroup,setSelGroup]=useState("");
  const arrowRef=useRef();
  const inputRef=useRef();

  useEffect(()=>{
    if(showTaskPicker) setTimeout(()=>inputRef.current?.focus(),50);
    if(!showTaskPicker&&!showGroupPicker) setTaskTitle(""); 
  },[showTaskPicker,showGroupPicker]);

  const submitTask = () => {
    const gid = selGroup || (groups&&groups[0]&&(groups[0]._id||groups[0].id)) || null;
    if(!gid){ showToast("No group found","error"); return; }
    if(taskTitle.trim()) onAddTaskToGroup(gid, taskTitle.trim());
    else onAddTask();
    setShowTaskPicker(false); setSelGroup(""); setTaskTitle(""); setOpen(false);
  };

  return(
    <div style={{display:"flex",flexShrink:0,position:"relative"}}>
      {/* main button */}
      <button onClick={()=>setShowTaskPicker(v=>!v)} style={{
        background:"#0073ea",color:"#fff",border:"none",
        borderRadius:"9px 0 0 9px",padding:"7px 16px",fontSize:13,fontWeight:700,cursor:"pointer",
        borderRight:"1px solid rgba(255,255,255,0.25)",fontFamily:"inherit",transition:"filter .15s",
      }}
        onMouseEnter={e=>e.currentTarget.style.filter="brightness(1.1)"}
        onMouseLeave={e=>e.currentTarget.style.filter="none"}
      >+ New task</button>
      <button ref={arrowRef} onClick={()=>{setOpen(v=>!v);setShowTaskPicker(false);}} style={{
        background:"#0073ea",color:"#fff",border:"none",
        borderRadius:"0 9px 9px 0",padding:"7px 9px",fontSize:12,cursor:"pointer",
        fontFamily:"inherit",transition:"filter .15s",display:"flex",alignItems:"center",
      }}
        onMouseEnter={e=>e.currentTarget.style.filter="brightness(1.1)"}
        onMouseLeave={e=>e.currentTarget.style.filter="none"}
      >▾</button>

      {/* Quick task creator inline */}
      {showTaskPicker&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:7999}}
          onClick={()=>setShowTaskPicker(false)}>
          <div onClick={e=>e.stopPropagation()} style={{
            position:"fixed",top:60,left:"50%",transform:"translateX(-50%)",
            background:"#fff",borderRadius:14,padding:24,
            boxShadow:"0 20px 60px rgba(0,0,0,0.18)",width:440,zIndex:8000,
            border:`1.5px solid #e6e9ef`,animation:"ddIn .15s ease"
          }}>
            <div style={{fontSize:15,fontWeight:800,color:"#323338",marginBottom:16}}>Create new task</div>
            <input ref={inputRef} value={taskTitle} onChange={e=>setTaskTitle(e.target.value)}
              placeholder="Task name..."
              onKeyDown={e=>{if(e.key==="Enter")submitTask();if(e.key==="Escape")setShowTaskPicker(false);}}
              style={{width:"100%",border:"1.5px solid #d0d4e4",borderRadius:9,padding:"10px 13px",
                fontSize:14,fontFamily:"inherit",outline:"none",color:"#323338",
                boxSizing:"border-box",marginBottom:12,transition:"border-color .15s"}}
              onFocus={e=>e.target.style.borderColor="#0073ea"}
              onBlur={e=>e.target.style.borderColor="#d0d4e4"}
            />
            {/* Group selector */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:"#676879",fontWeight:700,marginBottom:6,letterSpacing:.4}}>ADD TO GROUP</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {(groups||[]).map(g=>{
                  const gid=g._id||g.id;
                  const isSelected=selGroup===gid||(selGroup===""&&groups[0]&&(groups[0]._id||groups[0].id)===gid);
                  return(
                    <div key={gid} onClick={()=>setSelGroup(gid)}
                      style={{display:"flex",alignItems:"center",gap:6,padding:"5px 11px",
                        borderRadius:20,cursor:"pointer",fontSize:12,fontWeight:isSelected?700:500,
                        background:isSelected?"#e8f4fd":"#f5f6f8",
                        border:`1.5px solid ${isSelected?"#0073ea":"transparent"}`,
                        color:isSelected?"#0073ea":"#323338",transition:"all .15s"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:g.color,flexShrink:0}}/>
                      {g.label}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowTaskPicker(false)}
                style={{background:"#f5f6f8",border:"none",borderRadius:8,padding:"8px 18px",
                  fontSize:13,fontWeight:600,color:"#676879",cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
              <button onClick={submitTask}
                style={{background: taskTitle.trim()?"#0073ea":"#c3d9f0",color:"#fff",border:"none",
                  borderRadius:8,padding:"8px 20px",fontSize:13,fontWeight:700,
                  cursor:taskTitle.trim()?"pointer":"default",fontFamily:"inherit",transition:"all .15s"}}>
                Create task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* dropdown menu */}
      {open&&(
        <DD anchor={arrowRef} onClose={()=>setOpen(false)} w={230}>
          <div style={{fontSize:10,color:"#676879",fontWeight:700,letterSpacing:1,textTransform:"uppercase",padding:"8px 12px 5px"}}>Create new</div>
          <MI icon="✅" title="Task" sub="Add task with details" onClick={()=>{setOpen(false);setShowTaskPicker(true);}}/>
          <MI icon="📁" title="Group" sub="Add a new group of tasks" onClick={()=>{onTriggerGroup();setOpen(false);}}/>
          <Sep/>
          <MI icon="📥" title="Import" sub="Excel, CSV or from files" onClick={()=>{onImport&&onImport();setOpen(false);}}/>
        </DD>
      )}
    </div>
  );
}


/* ─── IMPORT MODAL ─── */
function ImportModal({ onClose, onImportTasks }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [colMap, setColMap] = useState({});
  const fileRef = useRef();

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h=>h.replace(/"/g,'').trim());
    const rows = lines.slice(1).map(line=>{
      const vals = line.split(',').map(v=>v.replace(/"/g,'').trim());
      return Object.fromEntries(headers.map((h,i)=>[h,vals[i]||'']));
    });
    return { headers, rows };
  };

  const handleFile = (f) => {
    if(!f) return;
    setFile(f);
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const { headers, rows } = parseCSV(text);
      // auto-map columns
      const autoMap = {};
      headers.forEach(h=>{
        const hl = h.toLowerCase();
        if(hl.includes('name')||hl.includes('task')||hl.includes('title')) autoMap.title=h;
        else if(hl.includes('owner')||hl.includes('assign')||hl.includes('person')) autoMap.assignTo=h;
        else if(hl.includes('status')) autoMap.status=h;
        else if(hl.includes('date')||hl.includes('due')) autoMap.date=h;
        else if(hl.includes('priority')) autoMap.priority=h;
      });
      setColMap(autoMap);
      setPreview({ headers, rows: rows.slice(0,5), totalRows: rows.length, allRows: rows });
      setLoading(false);
    };
    reader.readAsText(f);
  };

  const doImport = () => {
    if(!preview) return;
    const tasks = preview.allRows.map(row=>({
      title: colMap.title ? row[colMap.title] : (Object.values(row)[0]||'Imported task'),
      assignTo: colMap.assignTo ? row[colMap.assignTo] : '',
      status: colMap.status ? row[colMap.status] : 'Not Started',
      date: colMap.date ? row[colMap.date] : '',
      priority: colMap.priority ? row[colMap.priority] : '🟡 Medium',
    })).filter(t=>t.title);
    onImportTasks(tasks);
    onClose();
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:9000,
      display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#fff",borderRadius:16,width:560,maxHeight:"85vh",
        boxShadow:"0 24px 80px rgba(0,0,0,0.18)",display:"flex",flexDirection:"column",
        overflow:"hidden",animation:"ddIn .15s ease"}}>

        {/* Header */}
        <div style={{padding:"18px 22px 14px",borderBottom:"1px solid #eef0f4",
          display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:"#323338"}}>📥 Import tasks</div>
            <div style={{fontSize:12,color:"#676879",marginTop:2}}>Upload CSV or Excel file from your device</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",
            fontSize:20,color:"#676879",width:32,height:32,display:"flex",
            alignItems:"center",justifyContent:"center",borderRadius:7}}
            onMouseEnter={e=>e.currentTarget.style.background="#f5f6f8"}
            onMouseLeave={e=>e.currentTarget.style.background="none"}>×</button>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"18px 22px"}}>
          {!file ? (
            <>
              {/* Drop zone */}
              <div
                onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
                onClick={()=>fileRef.current?.click()}
                style={{border:`2px dashed ${dragOver?"#0073ea":"#d0d4e4"}`,
                  borderRadius:12,padding:"36px 24px",textAlign:"center",cursor:"pointer",
                  background:dragOver?"#e8f4fd":"#fafbfc",transition:"all .2s"}}>
                <div style={{fontSize:36,marginBottom:10}}>📂</div>
                <div style={{fontSize:14,fontWeight:700,color:"#323338",marginBottom:6}}>
                  Drag & drop your file here
                </div>
                <div style={{fontSize:12,color:"#676879",marginBottom:14}}>
                  Supports CSV and Excel (.xlsx) files
                </div>
                <button style={{background:"#0073ea",color:"#fff",border:"none",
                  borderRadius:8,padding:"8px 20px",fontSize:13,fontWeight:700,
                  cursor:"pointer",fontFamily:"inherit"}}>Browse files</button>
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls"
                  style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
              </div>

              {/* Format hints */}
              <div style={{marginTop:16,padding:"12px 16px",background:"#f5f6f8",
                borderRadius:10,fontSize:12,color:"#676879"}}>
                <div style={{fontWeight:700,color:"#323338",marginBottom:6}}>💡 Tip: Best format for import</div>
                <div>Column headers like: <strong>Task name, Owner, Status, Due date, Priority</strong></div>
              </div>
            </>
          ) : loading ? (
            <div style={{textAlign:"center",padding:40}}>
              <div style={{width:36,height:36,border:"3px solid #e6e9ef",borderTop:"3px solid #0073ea",
                borderRadius:"50%",animation:"spin .7s linear infinite",margin:"0 auto 12px"}}/>
              <div style={{fontSize:13,color:"#676879"}}>Reading file...</div>
            </div>
          ) : preview && (
            <>
              {/* File info */}
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
                background:"#e8f4fd",borderRadius:10,marginBottom:16}}>
                <span style={{fontSize:20}}>📄</span>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#323338"}}>{file.name}</div>
                  <div style={{fontSize:11,color:"#676879"}}>{preview.totalRows} rows found</div>
                </div>
                <button onClick={()=>{setFile(null);setPreview(null);}}
                  style={{marginLeft:"auto",background:"none",border:"1px solid #c3d9f0",
                    borderRadius:7,padding:"4px 10px",fontSize:11,color:"#0073ea",cursor:"pointer",fontFamily:"inherit"}}>
                  Change file
                </button>
              </div>

              {/* Column mapping */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,color:"#323338",marginBottom:10}}>Map columns</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[
                    {key:"title",   label:"Task name"},
                    {key:"assignTo",label:"Owner / Assigned to"},
                    {key:"status",  label:"Status"},
                    {key:"date",    label:"Due date"},
                  ].map(({key,label})=>(
                    <div key={key}>
                      <div style={{fontSize:11,color:"#676879",fontWeight:600,marginBottom:4}}>{label}</div>
                      <select value={colMap[key]||""} onChange={e=>setColMap(p=>({...p,[key]:e.target.value}))}
                        style={{width:"100%",border:"1px solid #d0d4e4",borderRadius:7,padding:"6px 9px",
                          fontSize:12,fontFamily:"inherit",color:"#323338",outline:"none",background:"#fff"}}>
                        <option value="">— Skip —</option>
                        {preview.headers.map(h=><option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div style={{fontSize:12,fontWeight:700,color:"#323338",marginBottom:8}}>
                Preview ({Math.min(5,preview.totalRows)} of {preview.totalRows} rows)
              </div>
              <div style={{overflowX:"auto",borderRadius:8,border:"1px solid #e6e9ef"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead>
                    <tr style={{background:"#f5f6f8"}}>
                      {preview.headers.map(h=>(
                        <th key={h} style={{padding:"7px 10px",textAlign:"left",
                          color:"#676879",fontWeight:700,borderBottom:"1px solid #e6e9ef",
                          whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row,i)=>(
                      <tr key={i} style={{borderBottom:"1px solid #f0f1f4"}}>
                        {preview.headers.map(h=>(
                          <td key={h} style={{padding:"6px 10px",color:"#323338",
                            maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {row[h]||""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{padding:"12px 22px",borderTop:"1px solid #eef0f4",
          display:"flex",justifyContent:"flex-end",gap:8}}>
          <button onClick={onClose}
            style={{background:"#f5f6f8",border:"none",borderRadius:8,padding:"8px 20px",
              fontSize:13,fontWeight:600,color:"#676879",cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          <button onClick={doImport} disabled={!preview||loading}
            style={{background:preview&&!loading?"#0073ea":"#c3d9f0",color:"#fff",border:"none",
              borderRadius:8,padding:"8px 22px",fontSize:13,fontWeight:700,
              cursor:preview&&!loading?"pointer":"default",fontFamily:"inherit",transition:"all .15s"}}>
            Import {preview?`${preview.totalRows} tasks`:""}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── SIDEKICK PANEL (Dashboard Stats only) ─── */
function SidekickPanel({ onClose, groups }) {
  const allTasks = groups.flatMap(g => g.tasks || []);
  const done     = allTasks.filter(t => t.status === "Done").length;
  const stuck    = allTasks.filter(t => t.status === "Stuck").length;
  const wip      = allTasks.filter(t => t.status === "Working on it").length;
  const overdue  = allTasks.filter(t => t.date && new Date(t.date) < new Date() && t.status !== "Done").length;
  const dueToday = allTasks.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date); d.setHours(0,0,0,0);
    const tod = new Date(); tod.setHours(0,0,0,0);
    return d.getTime() === tod.getTime() && t.status !== "Done";
  }).length;
  const pct = allTasks.length ? Math.round(done / allTasks.length * 100) : 0;

  const groupStats = groups.map(g => {
    const ts = g.tasks || [];
    const gd = ts.filter(t => t.status === "Done").length;
    return { label: g.label, color: g.color, total: ts.length, done: gd,
      pct: ts.length ? Math.round(gd / ts.length * 100) : 0 };
  }).filter(g => g.total > 0);

  const assigneeCounts = {};
  allTasks.forEach(t => {
    if (t.assignTo && t.assignTo !== "Unassigned" && t.assignTo !== "")
      assigneeCounts[t.assignTo] = (assigneeCounts[t.assignTo] || 0) + 1;
  });
  const topAssignees = Object.entries(assigneeCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const insight = stuck > 0
    ? `${stuck} task${stuck>1?"s are":" is"} stuck — consider reassigning or breaking them down.`
    : overdue > 0 ? `${overdue} overdue task${overdue>1?"s":""}. Prioritise these first!`
    : done === allTasks.length && allTasks.length > 0 ? "🎉 All tasks complete! Great work."
    : wip > 0 ? `${wip} task${wip>1?"s are":" is"} in progress — keep the momentum!`
    : "Add tasks to see insights here.";

  /* mini donut arc helper */
  const arc = (pct) => {
    const r = 26, circ = 2 * Math.PI * r;
    return { r, circ, dash: (pct/100)*circ, gap: circ };
  };
  const { r, circ, dash } = arc(pct);

  return (
    <div style={{ width: 300, flexShrink:0, background:"#fff", borderLeft:`1.5px solid ${P.border}`,
      display:"flex", flexDirection:"column", height:"100%", overflow:"hidden", fontFamily:"inherit" }}>

      {/* ── Header ── */}
      <div style={{ background:`linear-gradient(150deg,${P.dark} 0%,${P.mid} 60%,#a855f7 100%)`,
        padding:"14px 16px 16px", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:"rgba(255,255,255,0.18)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>✨</div>
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:"#fff", letterSpacing:-0.3 }}>Board Sidekick</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", marginTop:1 }}>Live insights</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.15)", border:"none",
            borderRadius:7, width:28, height:28, display:"flex", alignItems:"center",
            justifyContent:"center", cursor:"pointer", color:"#fff", fontSize:16 }}>×</button>
        </div>

        {/* donut + stat row */}
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          {/* donut */}
          <div style={{ position:"relative", flexShrink:0 }}>
            <svg width={70} height={70}>
              <circle cx={35} cy={35} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={7}/>
              <circle cx={35} cy={35} r={r} fill="none" stroke="#a78bfa" strokeWidth={7}
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                transform="rotate(-90 35 35)" style={{ transition:"stroke-dasharray .6s" }}/>
            </svg>
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:14, fontWeight:800, color:"#fff", lineHeight:1 }}>{pct}%</span>
              <span style={{ fontSize:8, color:"rgba(255,255,255,0.55)", marginTop:1 }}>done</span>
            </div>
          </div>
          {/* 4 mini stats */}
          <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {[
              {label:"Total",  val:allTasks.length, color:"#e9d5ff"},
              {label:"Done",   val:done,            color:"#86efac"},
              {label:"Active", val:wip,             color:"#fde68a"},
              {label:"Stuck",  val:stuck,           color:"#fca5a5"},
            ].map(({label,val,color})=>(
              <div key={label} style={{ background:"rgba(255,255,255,0.12)", borderRadius:8,
                padding:"6px 8px", textAlign:"center" }}>
                <div style={{ fontSize:17, fontWeight:800, color, lineHeight:1 }}>{val}</div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)", fontWeight:600, marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex:1, overflowY:"auto", padding:14, display:"flex", flexDirection:"column", gap:12 }}>

        {/* alert pills */}
        {(overdue>0||dueToday>0) && (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {overdue>0 && (
              <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10,
                padding:"9px 12px", display:"flex", gap:9, alignItems:"center" }}>
                <span style={{ fontSize:16 }}>🔴</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#dc2626" }}>{overdue} overdue task{overdue>1?"s":""}</div>
                  <div style={{ fontSize:10, color:"#ef4444", marginTop:1 }}>Past due & not done</div>
                </div>
              </div>
            )}
            {dueToday>0 && (
              <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10,
                padding:"9px 12px", display:"flex", gap:9, alignItems:"center" }}>
                <span style={{ fontSize:16 }}>📅</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#92400e" }}>{dueToday} due today</div>
                  <div style={{ fontSize:10, color:"#b45309", marginTop:1 }}>Complete before EOD</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* insight card */}
        <div style={{ background:`linear-gradient(135deg,${P.light},rgba(168,85,247,0.06))`,
          border:`1.5px solid ${P.border}`, borderRadius:12, padding:"12px 13px" }}>
          <div style={{ fontSize:10, color:P.muted, fontWeight:700, letterSpacing:.8,
            textTransform:"uppercase", marginBottom:6, display:"flex", alignItems:"center", gap:5 }}>
            <span>💡</span> Insight
          </div>
          <div style={{ fontSize:12, color:P.text, lineHeight:1.65 }}>{insight}</div>
        </div>

        {/* progress bar */}
        {allTasks.length>0 && (
          <div style={{ background:P.light, border:`1px solid ${P.border}`, borderRadius:12, padding:13 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
              <span style={{ fontSize:12, fontWeight:700, color:P.text }}>Overall Progress</span>
              <span style={{ fontSize:13, fontWeight:800, color:P.accent }}>{pct}%</span>
            </div>
            <div style={{ background:P.border, borderRadius:6, height:8, overflow:"hidden" }}>
              <div style={{ width:`${pct}%`, height:"100%",
                background:`linear-gradient(90deg,${P.accent},#c084fc)`, borderRadius:6, transition:"width .6s" }}/>
            </div>
            <div style={{ fontSize:10, color:P.muted, marginTop:5, textAlign:"center" }}>
              {done} of {allTasks.length} completed
            </div>
          </div>
        )}

        {/* status breakdown */}
        {allTasks.length>0 && (
          <div style={{ background:P.light, border:`1px solid ${P.border}`, borderRadius:12, padding:13 }}>
            <div style={{ fontSize:10, color:P.muted, fontWeight:700, letterSpacing:.8,
              textTransform:"uppercase", marginBottom:10 }}>Status Breakdown</div>
            {Object.entries(STATUS_CFG).map(([s,c])=>{
              const n=allTasks.filter(t=>t.status===s).length;
              if(!n) return null;
              const sp=Math.round(n/allTasks.length*100);
              return (
                <div key={s} style={{ marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3, alignItems:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ width:9, height:9, borderRadius:3, background:c.bg, flexShrink:0 }}/>
                      <span style={{ fontSize:11.5, color:P.text }}>{s}</span>
                    </div>
                    <span style={{ fontSize:10, color:P.muted, fontWeight:600 }}>{n} ({sp}%)</span>
                  </div>
                  <div style={{ background:P.border, borderRadius:4, height:5, overflow:"hidden" }}>
                    <div style={{ width:`${sp}%`, height:"100%", background:c.bg, borderRadius:4, transition:"width .5s" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* group progress */}
        {groupStats.length>0 && (
          <div style={{ background:P.light, border:`1px solid ${P.border}`, borderRadius:12, padding:13 }}>
            <div style={{ fontSize:10, color:P.muted, fontWeight:700, letterSpacing:.8,
              textTransform:"uppercase", marginBottom:10 }}>Group Progress</div>
            {groupStats.map(g=>(
              <div key={g.label} style={{ marginBottom:9 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3, alignItems:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:g.color, flexShrink:0 }}/>
                    <span style={{ fontSize:11.5, color:P.text, fontWeight:500 }}>{g.label}</span>
                  </div>
                  <span style={{ fontSize:10, color:P.muted }}>{g.done}/{g.total}</span>
                </div>
                <div style={{ background:P.border, borderRadius:4, height:5, overflow:"hidden" }}>
                  <div style={{ width:`${g.pct}%`, height:"100%", background:g.color, borderRadius:4, transition:"width .5s" }}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* top assignees */}
        {topAssignees.length>0 && (
          <div style={{ background:P.light, border:`1px solid ${P.border}`, borderRadius:12, padding:13 }}>
            <div style={{ fontSize:10, color:P.muted, fontWeight:700, letterSpacing:.8,
              textTransform:"uppercase", marginBottom:10 }}>Top Assignees</div>
            {topAssignees.map(([name,count])=>(
              <div key={name} style={{ display:"flex", alignItems:"center", gap:9, marginBottom:8 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:getAvatarColor(name),
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:"#fff", fontSize:10, fontWeight:700, flexShrink:0 }}>
                  {name.slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ fontSize:12, color:P.text, fontWeight:500 }}>{name}</span>
                    <span style={{ fontSize:10, color:P.muted }}>{count} task{count>1?"s":""}</span>
                  </div>
                  <div style={{ background:P.border, borderRadius:3, height:4, overflow:"hidden" }}>
                    <div style={{ width:`${Math.round(count/allTasks.length*100)}%`, height:"100%",
                      background:`linear-gradient(90deg,${P.accent},#c084fc)`, borderRadius:3 }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

/* ─── INTEGRATE MODAL ─── */
function IntegrateModal({ onClose }) {
  const integrations = [
    { icon: "📧", name: "Gmail", desc: "Send email notifications on status change", badge: "Popular" },
    { icon: "💬", name: "Slack", desc: "Post updates to Slack channels automatically", badge: "Popular" },
    { icon: "📅", name: "Google Calendar", desc: "Sync due dates with your calendar", badge: null },
    { icon: "🐙", name: "GitHub", desc: "Link commits and PRs to tasks", badge: null },
    { icon: "🔧", name: "Jira", desc: "Two-way sync with Jira issues", badge: null },
    { icon: "🗂️", name: "Notion", desc: "Mirror tasks to Notion databases", badge: null },
    { icon: "📊", name: "Google Sheets", desc: "Export board data to Sheets automatically", badge: null },
    { icon: "🔗", name: "Zapier", desc: "Connect to 5000+ apps via Zapier", badge: "New" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,10,60,0.45)", zIndex: 8000,
      display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit"
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 16, width: 520, maxHeight: "80vh",
        boxShadow: "0 24px 80px rgba(124,58,237,0.25)", display: "flex", flexDirection: "column",
        overflow: "hidden", animation: "ddIn .15s ease" }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,${P.dark},${P.mid})`, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>🔗 Integrations</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
                Connect your favourite tools to this board
              </div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none",
              borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#fff",
              fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: "14px 20px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: P.light,
            border: `1.5px solid ${P.border}`, borderRadius: 10, padding: "8px 12px" }}>
            <span style={{ fontSize: 14, color: P.muted }}>🔍</span>
            <input placeholder="Search integrations..." style={{ border: "none", outline: "none",
              background: "transparent", fontSize: 13, color: P.text, fontFamily: "inherit", flex: 1 }} />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px 16px" }}>
          {integrations.map(({ icon, name, desc, badge }) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0",
              borderBottom: `1px solid ${P.border}`, cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = P.hover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ width: 42, height: 42, borderRadius: 10, background: P.light,
                border: `1.5px solid ${P.border}`, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: P.text }}>{name}</span>
                  {badge && (
                    <span style={{ fontSize: 9, background: badge === "Popular" ? "#fef3c7" : "#ede9fe",
                      color: badge === "Popular" ? "#92400e" : P.accent, borderRadius: 8,
                      padding: "2px 7px", fontWeight: 700, letterSpacing: 0.3 }}>{badge}</span>
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: P.muted, marginTop: 2 }}>{desc}</div>
              </div>
              <button style={{ background: P.light, border: `1.5px solid ${P.border}`, borderRadius: 8,
                padding: "6px 14px", fontSize: 12, fontWeight: 600, color: P.mid, cursor: "pointer",
                fontFamily: "inherit", transition: "all .15s", flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = P.accent; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = P.accent; }}
                onMouseLeave={e => { e.currentTarget.style.background = P.light; e.currentTarget.style.color = P.mid; e.currentTarget.style.borderColor = P.border; }}
              >Connect</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── AUTOMATE MODAL ─── */
function AutomateModal({ onClose }) {
  const automations = [
    { icon: "⚡", title: "Status Change Alert", desc: "When status changes → notify assignee", active: true, category: "Notifications" },
    { icon: "📅", title: "Due Date Reminder", desc: "1 day before due date → send reminder", active: false, category: "Notifications" },
    { icon: "🔄", title: "Auto-assign on Start", desc: "When status = Working on it → assign to me", active: false, category: "Assignment" },
    { icon: "✅", title: "Mark Done on Check", desc: "When all sub-tasks done → mark parent Done", active: true, category: "Status" },
    { icon: "📧", title: "Email on Stuck", desc: "When status = Stuck → email team lead", active: false, category: "Notifications" },
    { icon: "🗂️", title: "Archive Completed", desc: "After 7 days of Done → move to Archive group", active: false, category: "Cleanup" },
  ];

  const [states, setStates] = useState(
    Object.fromEntries(automations.map(a => [a.title, a.active]))
  );

  const toggle = title => setStates(p => ({ ...p, [title]: !p[title] }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,10,60,0.45)", zIndex: 8000,
      display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit"
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 16, width: 520, maxHeight: "80vh",
        boxShadow: "0 24px 80px rgba(124,58,237,0.25)", display: "flex", flexDirection: "column",
        overflow: "hidden", animation: "ddIn .15s ease" }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,${P.dark},${P.mid})`, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>⚙️ Automations</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
                Set rules to automate repetitive work
              </div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none",
              borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#fff",
              fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {[
              { label: "Active", val: Object.values(states).filter(Boolean).length, color: "#86efac" },
              { label: "Total", val: automations.length, color: "#c4b5fd" },
              { label: "Runs today", val: 12, color: "#fde68a" },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8,
                padding: "8px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color }}>{val}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Add new automation */}
        <div style={{ padding: "12px 20px 4px" }}>
          <button style={{ width: "100%", background: `linear-gradient(135deg,${P.accent},#a855f7)`,
            color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13,
            fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 4px 12px rgba(147,51,234,0.3)", transition: "filter .15s" }}
            onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.1)"}
            onMouseLeave={e => e.currentTarget.style.filter = "none"}
          >
            <span style={{ fontSize: 16 }}>+</span> Create new automation
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px 16px" }}>
          {automations.map(({ icon, title, desc, category }) => (
            <div key={title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
              borderBottom: `1px solid ${P.border}` }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: states[title] ? `rgba(147,51,234,0.12)` : P.light,
                border: `1.5px solid ${states[title] ? P.accent : P.border}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
                transition: "all .15s" }}>{icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: P.text }}>{title}</span>
                  <span style={{ fontSize: 9, background: "#f1f5f9", color: "#64748b",
                    borderRadius: 6, padding: "2px 6px", fontWeight: 600 }}>{category}</span>
                </div>
                <div style={{ fontSize: 11.5, color: P.muted, marginTop: 2 }}>{desc}</div>
              </div>
              {/* Toggle switch */}
              <div onClick={() => toggle(title)} style={{ width: 38, height: 22, borderRadius: 11,
                background: states[title] ? P.accent : "#e2e8f0", cursor: "pointer",
                position: "relative", transition: "background .2s", flexShrink: 0 }}>
                <div style={{ position: "absolute", top: 3, left: states[title] ? 18 : 3,
                  width: 16, height: 16, borderRadius: "50%", background: "#fff",
                  transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── FILTER / SORT / GROUPBY MENUS ─── */

/* ─── MAIN TABLE VIEW DROPDOWN ─── */
function MainTableDropdown({ anchor, onClose }) {
  const [viewSearch, setViewSearch] = useState("");
  const boardViews = [
    { icon: "⊞", label: "Table",            active: true },
    { icon: "≡", label: "Gantt",            active: false },
    { icon: "◕", label: "Chart",            active: false },
    { icon: "📅", label: "Calendar",        active: false },
    { icon: "⊟", label: "Kanban",           active: false },
    { icon: "📄", label: "Doc",             active: false },
    { icon: "🖼️", label: "File gallery",   active: false },
    { icon: "📋", label: "Form",            active: false },
    { icon: "⚙️", label: "Customizable view", active: false },
  ];
  const vibeViews = [
    { icon: "💗", label: "Task Tracker",       vibe: true },
    { icon: "💜", label: "Project Overview",   vibe: true },
    { icon: "🧩", label: "Build app from scratch", vibe: true },
    { icon: "🔌", label: "Apps",               vibe: true, arrow: true },
  ];
  const filteredBoard = boardViews.filter(v =>
    !viewSearch || v.label.toLowerCase().includes(viewSearch.toLowerCase()));
  const filteredVibe = vibeViews.filter(v =>
    !viewSearch || v.label.toLowerCase().includes(viewSearch.toLowerCase()));

  const ref = useRef();
  const [pos, setPos] = useState({top:0, left:0});
  useEffect(() => {
    if (anchor?.current) {
      const r = anchor.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    const h = e => { if (ref.current && !ref.current.contains(e.target) && !anchor?.current?.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [anchor, onClose]);

  return (
    <div ref={ref} style={{ position:"fixed", top:pos.top, left:pos.left, zIndex:7000,
      display:"flex", gap:0, background:"#fff",
      border:`1px solid ${P.border}`, borderRadius:12,
      boxShadow:"0 8px 40px rgba(124,58,237,0.18)", animation:"ddIn .12s ease",
      fontFamily:"inherit", overflow:"hidden" }}>

      {/* LEFT — search + saved views */}
      <div style={{ width:240, borderRight:`1px solid ${P.border}`, display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"10px 12px 8px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, background:P.light,
            border:`1px solid ${P.border}`, borderRadius:8, padding:"6px 10px" }}>
            <span style={{ fontSize:13, color:P.muted }}>🔍</span>
            <input value={viewSearch} onChange={e=>setViewSearch(e.target.value)}
              placeholder="Search view"
              style={{ border:"none", outline:"none", background:"transparent",
                fontSize:12, color:P.text, fontFamily:"inherit", flex:1 }}/>
          </div>
        </div>
        <div style={{ flex:1, padding:"0 6px 6px" }}>
          {/* Main table highlighted */}
          <div style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 10px",
            borderRadius:8, background:"#e8f4fd", cursor:"pointer", marginBottom:2 }}>
            <span style={{ fontSize:14 }}>⊞</span>
            <span style={{ fontSize:13, fontWeight:600, color:"#0073ea" }}>Main table</span>
            <span style={{ marginLeft:"auto", fontSize:10, color:"#0073ea" }}>✓</span>
          </div>
        </div>
        <div style={{ padding:"8px 12px", borderTop:`1px solid ${P.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 8px",
            borderRadius:8, cursor:"pointer", color:P.accent, fontSize:13, fontWeight:600 }}
            onMouseEnter={e=>e.currentTarget.style.background=P.light}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <span style={{ fontSize:15, fontWeight:300 }}>+</span> Add view
          </div>
        </div>
      </div>

      {/* RIGHT — Board views + Vibe */}
      <div style={{ width:240, display:"flex", flexDirection:"column", padding:"10px 0" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 14px 8px" }}>
          <span style={{ fontSize:12, fontWeight:700, color:P.text }}>Board views</span>
          <span style={{ fontSize:16, color:P.muted, cursor:"pointer" }}>ⓘ</span>
        </div>
        {filteredBoard.map(v => (
          <div key={v.label} onClick={onClose}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 14px",
              cursor:"pointer", background: v.active ? "#f0f7ff" : "transparent",
              transition:"background .1s" }}
            onMouseEnter={e=>{ if(!v.active) e.currentTarget.style.background=P.hover; }}
            onMouseLeave={e=>{ if(!v.active) e.currentTarget.style.background="transparent"; }}
          >
            <span style={{ fontSize:15, color: v.active ? "#0073ea" : "#555", width:20, textAlign:"center" }}>{v.icon}</span>
            <span style={{ fontSize:13, color: v.active ? "#0073ea" : P.text, fontWeight: v.active ? 600 : 400 }}>{v.label}</span>
          </div>
        ))}

        {filteredVibe.length > 0 && (
          <>
            <div style={{ height:1, background:P.border, margin:"8px 0" }}/>
            <div style={{ padding:"0 14px 6px", fontSize:12, fontWeight:700, color:P.text }}>Build with Vibe</div>
            {filteredVibe.map(v => (
              <div key={v.label} onClick={!v.arrow ? onClose : undefined}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 14px",
                  cursor:"pointer", transition:"background .1s" }}
                onMouseEnter={e=>e.currentTarget.style.background=P.hover}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >
                <span style={{ fontSize:15, width:20, textAlign:"center" }}>{v.icon}</span>
                <span style={{ fontSize:13, color:P.text }}>{v.label}</span>
                {v.arrow && <span style={{ marginLeft:"auto", fontSize:11, color:P.muted }}>›</span>}
              </div>
            ))}
            <div style={{ padding:"6px 14px 4px" }}>
              <div style={{ fontSize:11, color:P.muted, cursor:"pointer" }}
                onMouseEnter={e=>e.currentTarget.style.color=P.accent}
                onMouseLeave={e=>e.currentTarget.style.color=P.muted}
              >Explore more views</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


/* ─── TASK UPDATE PANEL (monday.com updates drawer) ─── */
function TaskUpdatePanel({ task, onClose, onField }) {
  const [tab, setTab] = useState("updates");
  const [updateText, setUpdateText] = useState("");
  const [updates, setUpdates] = useState([]);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const editorRef = useRef();
  const id = task._id || task.id;
  const sc = STATUS_CFG[task.status] || STATUS_CFG["Not Started"];

  const postUpdate = () => {
    if (!updateText.trim()) return;
    setUpdates(p => [{
      id: Date.now(), text: updateText, time: new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}),
      date: new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}), author:"You"
    }, ...p]);
    setUpdateText("");
  };

  const fmt_tools = [
    { label:"T", title:"Paragraph", style:{fontFamily:"serif"} },
    { label:"B", title:"Bold",      style:{fontWeight:900} },
    { label:"I", title:"Italic",    style:{fontStyle:"italic"} },
    { label:"U", title:"Underline", style:{textDecoration:"underline"} },
    { label:"S", title:"Strikethrough", style:{textDecoration:"line-through"} },
    { label:"A", title:"Text color", style:{color:"#e2445c",fontWeight:700} },
    { label:"A↕", title:"Font size", style:{fontSize:11} },
  ];
  const list_tools = [
    { label:"≡", title:"Ordered list" },
    { label:"•", title:"Bullet list" },
    { label:"⊞", title:"Table" },
    { label:"🔗", title:"Link" },
    { label:"≈", title:"Align" },
    { label:"—", title:"Divider" },
    { label:"↺", title:"Mention" },
    { label:"✓", title:"Checklist" },
  ];

  return (
    <div style={{ width:480, flexShrink:0, background:"#fff", borderLeft:`1.5px solid ${P.border}`,
      display:"flex", flexDirection:"column", height:"100%", overflow:"hidden", fontFamily:"inherit" }}>

      {/* ── Header ── */}
      <div style={{ padding:"14px 18px 0", borderBottom:`1px solid ${P.border}`, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={onClose}
              style={{ background:"none", border:"none", cursor:"pointer", color:P.muted,
                fontSize:18, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center",
                borderRadius:6 }}
              onMouseEnter={e=>e.currentTarget.style.background=P.light}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>×</button>
            <div style={{ fontSize:17, fontWeight:700, color:P.text }}>{task.title}</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {/* avatar */}
            <div style={{ width:30, height:30, borderRadius:"50%", background:getAvatarColor(task.assignTo||"You"),
              display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:11, fontWeight:700 }}>
              {(task.assignTo||"Y").slice(0,2).toUpperCase()}
            </div>
            <button style={{ background:"none", border:"none", cursor:"pointer", color:P.muted, fontSize:18 }}>💬</button>
            <button style={{ background:"none", border:"none", cursor:"pointer", color:P.muted, fontSize:18 }}>···</button>
          </div>
        </div>
        {/* tabs */}
        <div style={{ display:"flex", gap:0 }}>
          {[
            { k:"updates",     l:"Updates",      icon:"🏠" },
            { k:"files",       l:"Files",        icon:"📁" },
            { k:"activity",    l:"Activity Log", icon:"📋" },
            { k:"more",        l:"+",            icon:""   },
          ].map(t => (
            <div key={t.k} onClick={()=>setTab(t.k)}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"8px 14px",
                fontSize:13, fontWeight: tab===t.k ? 700 : 500,
                color: tab===t.k ? P.text : P.muted,
                borderBottom: tab===t.k ? `2px solid ${P.accent}` : "2px solid transparent",
                cursor:"pointer", transition:"color .15s" }}
            >
              {t.icon && <span style={{fontSize:13}}>{t.icon}</span>}
              {t.l}
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>

        {tab === "updates" && (
          <>
            {/* action bar */}
            <div style={{ padding:"10px 18px 0", display:"flex", gap:10, borderBottom:`1px solid ${P.border}`,
              flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 0",
                color:P.muted, fontSize:12, cursor:"pointer" }}
                onMouseEnter={e=>e.currentTarget.style.color=P.accent}
                onMouseLeave={e=>e.currentTarget.style.color=P.muted}>
                <span>✉️</span> Update via email
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 0",
                color:P.muted, fontSize:12, cursor:"pointer" }}
                onMouseEnter={e=>e.currentTarget.style.color=P.accent}
                onMouseLeave={e=>e.currentTarget.style.color=P.muted}>
                <span>💬</span> Give feedback
              </div>
            </div>

            {/* rich text editor */}
            <div style={{ margin:"12px 18px", border:`1.5px solid ${P.border}`, borderRadius:10,
              overflow:"hidden", flexShrink:0 }}>
              {/* format toolbar */}
              <div style={{ display:"flex", alignItems:"center", gap:0, padding:"6px 8px",
                borderBottom:`1px solid ${P.border}`, background:P.light, flexWrap:"wrap" }}>
                {fmt_tools.map(t => (
                  <button key={t.title} title={t.title}
                    style={{ background:"none", border:"none", cursor:"pointer", padding:"4px 6px",
                      borderRadius:4, fontSize:12, fontFamily:"inherit",
                      color:P.text, transition:"background .1s", ...t.style }}
                    onMouseEnter={e=>e.currentTarget.style.background=P.border}
                    onMouseLeave={e=>e.currentTarget.style.background="none"}
                  >{t.label}</button>
                ))}
                <div style={{ width:1, height:16, background:P.border, margin:"0 4px" }}/>
                {list_tools.map(t => (
                  <button key={t.title} title={t.title}
                    style={{ background:"none", border:"none", cursor:"pointer", padding:"4px 6px",
                      borderRadius:4, fontSize:13, fontFamily:"inherit",
                      color:P.text, transition:"background .1s" }}
                    onMouseEnter={e=>e.currentTarget.style.background=P.border}
                    onMouseLeave={e=>e.currentTarget.style.background="none"}
                  >{t.label}</button>
                ))}
              </div>
              {/* textarea */}
              <textarea
                ref={editorRef}
                value={updateText}
                onChange={e=>setUpdateText(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&e.ctrlKey) postUpdate(); }}
                placeholder=""
                style={{ width:"100%", minHeight:120, border:"none", outline:"none", resize:"none",
                  padding:"12px 14px", fontSize:13, fontFamily:"inherit", color:P.text,
                  background:"#fff", boxSizing:"border-box", lineHeight:1.6 }}
              />
              {/* bottom bar */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"8px 10px", borderTop:`1px solid ${P.border}`, background:"#fafafa" }}>
                <div style={{ display:"flex", gap:4 }}>
                  {["@","📎","GIF","😊","✨"].map(ic => (
                    <button key={ic} style={{ background:"none", border:"none", cursor:"pointer",
                      fontSize:14, padding:"3px 5px", borderRadius:5, color:P.muted,
                      transition:"background .1s" }}
                      onMouseEnter={e=>e.currentTarget.style.background=P.border}
                      onMouseLeave={e=>e.currentTarget.style.background="none"}
                    >{ic}</button>
                  ))}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:0 }}>
                  <button onClick={postUpdate}
                    style={{ background: updateText.trim() ? "#0073ea" : "#e2e8f0",
                      color: updateText.trim() ? "#fff" : "#94a3b8",
                      border:"none", borderRadius:"8px 0 0 8px", padding:"7px 18px",
                      fontSize:13, fontWeight:700, cursor: updateText.trim() ? "pointer" : "default",
                      fontFamily:"inherit", transition:"all .15s" }}
                  >Update</button>
                  <button style={{ background: updateText.trim() ? "#0062c8" : "#d1d5db",
                    color: updateText.trim() ? "#fff" : "#9ca3af",
                    border:"none", borderRadius:"0 8px 8px 0", padding:"7px 7px",
                    fontSize:11, cursor:"pointer", borderLeft:"1px solid rgba(255,255,255,0.3)" }}>▾</button>
                </div>
              </div>
            </div>

            {/* updates list */}
            <div style={{ flex:1, padding:"0 18px 18px" }}>
              {updates.length === 0 ? (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  justifyContent:"center", padding:"40px 0", gap:14 }}>
                  {/* illustration */}
                  <div style={{ position:"relative", width:100, height:90 }}>
                    <div style={{ position:"absolute", top:0, right:0, width:60, height:55,
                      background:"#c7dcf5", borderRadius:10, display:"flex", alignItems:"center",
                      justifyContent:"center", flexDirection:"column", gap:4, padding:8 }}>
                      <div style={{ height:6, background:"#94b8e0", borderRadius:3, width:"70%" }}/>
                      <div style={{ height:6, background:"#94b8e0", borderRadius:3, width:"50%" }}/>
                      <div style={{ width:22, height:22, background:"#94b8e0", borderRadius:4,
                        alignSelf:"flex-end" }}/>
                    </div>
                    <div style={{ position:"absolute", bottom:0, left:0, width:62, height:58,
                      background:"#5c6bc0", borderRadius:10, display:"flex", alignItems:"flex-end",
                      padding:8 }}>
                      <div style={{ display:"flex", flexDirection:"column", gap:3, flex:1 }}>
                        <div style={{ height:5, background:"rgba(255,255,255,0.5)", borderRadius:3, width:"80%" }}/>
                        <div style={{ height:5, background:"rgba(255,255,255,0.5)", borderRadius:3, width:"60%" }}/>
                      </div>
                      <div style={{ width:20, height:20, borderRadius:"50%", background:"#f9c74f",
                        display:"flex", alignItems:"center", justifyContent:"center", fontSize:11 }}>😊</div>
                    </div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:15, fontWeight:700, color:P.text, marginBottom:6 }}>No updates yet</div>
                    <div style={{ fontSize:12, color:P.muted, lineHeight:1.6 }}>
                      Share progress, mention a teammate,<br/>or upload a file to get things moving
                    </div>
                  </div>
                </div>
              ) : (
                updates.map(u => (
                  <div key={u.id} style={{ display:"flex", gap:10, marginBottom:16 }}>
                    <div style={{ width:30, height:30, borderRadius:"50%",
                      background:getAvatarColor("You"), display:"flex", alignItems:"center",
                      justifyContent:"center", color:"#fff", fontSize:10, fontWeight:700, flexShrink:0 }}>YO</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                        <span style={{ fontSize:13, fontWeight:700, color:P.text }}>You</span>
                        <span style={{ fontSize:11, color:P.muted }}>{u.date} at {u.time}</span>
                      </div>
                      <div style={{ background:P.light, border:`1px solid ${P.border}`, borderRadius:9,
                        padding:"10px 13px", fontSize:13, color:P.text, lineHeight:1.6,
                        whiteSpace:"pre-wrap" }}>{u.text}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {tab === "files" && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
            justifyContent:"center", gap:12, padding:40 }}>
            <div style={{ fontSize:48 }}>📁</div>
            <div style={{ fontSize:15, fontWeight:700, color:P.text }}>No files yet</div>
            <div style={{ fontSize:12, color:P.muted, textAlign:"center" }}>
              Drag & drop files here or click to upload
            </div>
            <button style={{ background:`linear-gradient(135deg,${P.accent},#a855f7)`, color:"#fff",
              border:"none", borderRadius:9, padding:"9px 22px", fontSize:13, fontWeight:700,
              cursor:"pointer", fontFamily:"inherit" }}>Upload file</button>
          </div>
        )}

        {tab === "activity" && (
          <div style={{ flex:1, padding:"16px 18px" }}>
            <div style={{ fontSize:12, color:P.muted, fontWeight:700, letterSpacing:.8,
              textTransform:"uppercase", marginBottom:12 }}>Activity Log</div>
            {[
              { icon:"➕", text:`Task "${task.title}" was created`, time:"Just now", color:"#00c875" },
              { icon:"🔄", text:"Status set to Not Started", time:"Just now", color:"#c4c4c4" },
            ].map((a,i) => (
              <div key={i} style={{ display:"flex", gap:10, marginBottom:14, alignItems:"flex-start" }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:a.color,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0 }}>{a.icon}</div>
                <div>
                  <div style={{ fontSize:12.5, color:P.text, lineHeight:1.5 }}>{a.text}</div>
                  <div style={{ fontSize:10, color:P.muted, marginTop:2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const PRIORITY_CFG = {
  "Critical": { bg: "#e2445c", fg: "#fff" },
  "High":     { bg: "#fdab3d", fg: "#fff" },
  "Medium":   { bg: "#9333ea", fg: "#fff" },
  "Low":      { bg: "#00c875", fg: "#fff" },
  "—":        { bg: "#e2e8f0", fg: "#94a3b8" },
};

function FilterMenu({ anchor, groups, filters, onToggle, onClear, onClose, initialTab }) {
  const allTasks  = groups.flatMap(g => g.tasks||[]);
  const owners    = [...new Set(allTasks.map(t=>t.assignTo).filter(v=>v&&v!=="Unassigned"&&v!==""))];
  const totalShowing = allTasks.length;
  const hasFilters = filters.owner.size + filters.status.size > 0;
  const [mode, setMode]   = useState("quick");   // "quick" | "advanced"
  const [activeTab, setActiveTab] = useState(initialTab || "group"); // for person tab highlight
  const [advFilters, setAdvFilters] = useState([{ id:1, col:"Status", cond:"is", val:"" }]);

  const ref  = useRef();
  const [pos, setPos] = useState({top:0,left:0});

  useEffect(()=>{
    const calc = () => {
      if(anchor?.current){
        const r = anchor.current.getBoundingClientRect();
        setPos({ top: r.bottom+4, left: Math.max(8, r.left-20) });
      }
    };
    calc();
    window.addEventListener('scroll', calc, true);
    window.addEventListener('resize', calc);
    return()=>{ window.removeEventListener('scroll',calc,true); window.removeEventListener('resize',calc); };
  },[anchor]);

  useEffect(()=>{
    const h = e => {
      if(ref.current && !ref.current.contains(e.target) && !anchor?.current?.contains(e.target))
        onClose();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  },[anchor, onClose]);

  const Cb = ({on, onClick}) => (
    <div onClick={onClick}
      style={{ width:16,height:16,borderRadius:4,flexShrink:0,cursor:"pointer",
        border: on ? "none" : `1.5px solid #c5c9d6`,
        background: on ? "#0073ea" : "#fff",
        display:"flex",alignItems:"center",justifyContent:"center",
        color:"#fff",fontSize:9,fontWeight:700,transition:"all .15s" }}>{on && "✓"}</div>
  );

  // group list for quick filters
  const groupList = groups.map(g=>({
    label: g.label, color: g.color, count:(g.tasks||[]).length
  }));

  // date quick options
  const dateOpts = ["Overdue","Done on time","Done overdue","Today","Tomorrow","This week","Next week","This month"];

  const selInput = {
    border:`1px solid #d0d4e4`, borderRadius:6, padding:"7px 10px",
    fontSize:12, fontFamily:"inherit", color:"#333", outline:"none",
    background:"#fff", cursor:"pointer", flex:1
  };

  return (
    <div ref={ref} style={{
      position:"fixed", top:pos.top, left:pos.left, zIndex:9000,
      background:"#fff", border:`1px solid #dde1ea`, borderRadius:12,
      boxShadow:"0 8px 40px rgba(0,0,0,0.14)", fontFamily:"inherit",
      width: mode==="advanced" ? 740 : 960, maxWidth:"95vw",
      animation:"ddIn .12s ease", overflow:"hidden"
    }}>

      {/* ── HEADER ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 20px 10px", borderBottom:`1px solid #eef0f4` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:14, fontWeight:800, color:"#323338" }}>
            {mode==="quick" ? "Quick filters" : "Advanced filters"}
          </span>
          <span style={{ fontSize:12, color:"#676879" }}>
            Showing all of {totalShowing} tasks
          </span>
          <span style={{ fontSize:12, color:"#676879", cursor:"pointer" }}>ⓘ</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {hasFilters && (
            <button onClick={onClear}
              style={{ background:"none", border:"none", fontSize:12, color:"#676879",
                cursor:"pointer", fontFamily:"inherit", fontWeight:500 }}>Clear all</button>
          )}
          <button onClick={onClose}
            style={{ background:"#fff", border:`1px solid #d0d4e4`, borderRadius:8,
              padding:"5px 14px", fontSize:12, fontWeight:600, color:"#323338",
              cursor:"pointer", fontFamily:"inherit" }}>Save as new view</button>
        </div>
      </div>

      {mode === "quick" && (
        <>
          {/* ── QUICK FILTER BODY — scrollable columns ── */}
          <div style={{ display:"flex", gap:0, overflowX:"auto", padding:"14px 20px",
            minHeight:200, borderBottom:`1px solid #eef0f4` }}>

            {/* ── Recent filters section ── */}
            <div style={{ minWidth:660, display:"flex", gap:0 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#323338",
                position:"absolute", marginTop:-10 }}>Recent filters</div>

              {/* GROUP column */}
              <div style={{ minWidth:180, paddingRight:16, borderRight:`1px solid #eef0f4` }}>
                <div style={{ fontSize:11, color:"#676879", fontWeight:700, marginBottom:10,
                  marginTop:2, letterSpacing:.3 }}>Group</div>
                {groupList.map(g=>(
                  <div key={g.label}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 8px",
                      borderRadius:7, cursor:"pointer", marginBottom:2, transition:"background .1s" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#f5f6f8"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                  >
                    <div style={{ width:10,height:10,borderRadius:"50%",background:g.color,flexShrink:0 }}/>
                    <span style={{ fontSize:13, color:"#323338", flex:1,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{g.label}</span>
                    <span style={{ fontSize:12, color:"#676879", fontWeight:600 }}>{g.count}</span>
                  </div>
                ))}
              </div>

              {/* OWNER column */}
              <div style={{ minWidth:180, paddingLeft:16, paddingRight:16, borderRight:`1px solid #eef0f4` }}>
                <div style={{ fontSize:11, color:"#676879", fontWeight:700, marginBottom:10,
                  marginTop:2, letterSpacing:.3 }}>Owner</div>
                {/* Me (dynamic) */}
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 8px",
                  borderRadius:7, cursor:"pointer", marginBottom:2, transition:"background .1s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#f5f6f8"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{ width:22,height:22,borderRadius:"50%",background:"#0073ea",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    color:"#fff",fontSize:9,fontWeight:700,flexShrink:0 }}>ME</div>
                  <span style={{ fontSize:13, color:"#323338" }}>Me (dynamic)</span>
                </div>
                {/* Unassigned */}
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 8px",
                  borderRadius:7, cursor:"pointer", marginBottom:2, transition:"background .1s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#f5f6f8"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{ width:22,height:22,borderRadius:"50%",border:"1.5px solid #c5c9d6",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    color:"#c5c9d6",fontSize:12,flexShrink:0 }}>👤</div>
                  <span style={{ fontSize:13, color:"#323338", flex:1 }}>Unassigned</span>
                  <span style={{ fontSize:12, color:"#676879" }}>{allTasks.filter(t=>!t.assignTo||t.assignTo==="Unassigned").length}</span>
                </div>
                {owners.map(o=>{
                  const on = filters.owner.has(o);
                  return (
                    <div key={o} onClick={()=>onToggle("owner",o)}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 8px",
                        borderRadius:7, cursor:"pointer", marginBottom:2,
                        background: on ? "rgba(0,115,234,0.07)" : "transparent", transition:"background .1s" }}
                      onMouseEnter={e=>{ if(!on) e.currentTarget.style.background="#f5f6f8"; }}
                      onMouseLeave={e=>{ e.currentTarget.style.background= on?"rgba(0,115,234,0.07)":"transparent"; }}
                    >
                      {on && <span style={{color:"#0073ea",fontSize:11,flexShrink:0}}>✓</span>}
                      <div style={{ width:22,height:22,borderRadius:"50%",background:getAvatarColor(o),
                        display:"flex",alignItems:"center",justifyContent:"center",
                        color:"#fff",fontSize:9,fontWeight:700,flexShrink:0 }}>
                        {o.slice(0,2).toUpperCase()}
                      </div>
                      <span style={{ fontSize:13,color: on?"#0073ea":"#323338",fontWeight:on?600:400,flex:1 }}>{o}</span>
                    </div>
                  );
                })}
              </div>

              {/* DUE DATE column */}
              <div style={{ minWidth:180, paddingLeft:16, paddingRight:16, borderRight:`1px solid #eef0f4` }}>
                <div style={{ fontSize:11, color:"#676879", fontWeight:700, marginBottom:10,
                  marginTop:2, letterSpacing:.3 }}>Due date</div>
                {dateOpts.map(d=>(
                  <div key={d}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"5px 8px", borderRadius:7, cursor:"pointer", marginBottom:2, transition:"background .1s" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#f5f6f8"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span style={{ fontSize:13, color:"#323338" }}>{d}</span>
                    <span style={{ fontSize:12, color:"#c5c9d6" }}>–</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── All columns ── */}
            <div style={{ minWidth:220, paddingLeft:16, display:"flex", gap:0, position:"relative" }}>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:"#323338", marginBottom:10, marginTop:2 }}>All columns</div>
                <div style={{ display:"flex", gap:16 }}>
                  {/* Group col */}
                  <div style={{ minWidth:160 }}>
                    <div style={{ fontSize:11, color:"#676879", fontWeight:700, marginBottom:8, letterSpacing:.3 }}>Group</div>
                    {groupList.map(g=>(
                      <div key={g.label} style={{ display:"flex",alignItems:"center",gap:7,
                        padding:"5px 8px",borderRadius:7,cursor:"pointer",marginBottom:2,transition:"background .1s" }}
                        onMouseEnter={e=>e.currentTarget.style.background="#f5f6f8"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <div style={{width:10,height:10,borderRadius:"50%",background:g.color,flexShrink:0}}/>
                        <span style={{fontSize:13,color:"#323338",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.label}</span>
                        <span style={{fontSize:12,color:"#676879"}}>{g.count}</span>
                      </div>
                    ))}
                  </div>

                  {/* Status col */}
                  <div style={{ minWidth:140 }}>
                    <div style={{ fontSize:11, color:"#676879", fontWeight:700, marginBottom:8, letterSpacing:.3 }}>Status</div>
                    {Object.entries(STATUS_CFG).map(([s,sc])=>{
                      const on = filters.status.has(s);
                      const n  = allTasks.filter(t=>t.status===s).length;
                      return (
                        <div key={s} onClick={()=>onToggle("status",s)}
                          style={{ display:"flex",alignItems:"center",gap:7,padding:"5px 8px",
                            borderRadius:7,cursor:"pointer",marginBottom:2,
                            background:on?"rgba(0,115,234,0.07)":"transparent",transition:"background .1s" }}
                          onMouseEnter={e=>{ if(!on) e.currentTarget.style.background="#f5f6f8"; }}
                          onMouseLeave={e=>{ e.currentTarget.style.background=on?"rgba(0,115,234,0.07)":"transparent"; }}>
                          {on && <span style={{color:"#0073ea",fontSize:11,flexShrink:0}}>✓</span>}
                          <div style={{width:10,height:10,borderRadius:3,background:sc.bg,flexShrink:0}}/>
                          <span style={{fontSize:13,color:on?"#0073ea":"#323338",fontWeight:on?600:400,flex:1,
                            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s}</span>
                          <span style={{fontSize:12,color:"#676879"}}>{n||""}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* chevron right arrow */}
              <div style={{ position:"absolute",right:-8,top:"50%",transform:"translateY(-50%)",
                fontSize:18,color:"#c5c9d6",cursor:"pointer" }}>›</div>
            </div>
          </div>

          {/* horizontal scrollbar hint */}
          <div style={{ height:6, background:"#f5f6f8", margin:"0 20px 0",
            borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:"100%", width:"55%", background:"#c5c9d6", borderRadius:3 }}/>
          </div>

          {/* footer */}
          <div style={{ display:"flex", justifyContent:"flex-end", padding:"10px 20px" }}>
            <span onClick={()=>setMode("advanced")}
              style={{ fontSize:12, color:"#676879", cursor:"pointer", fontWeight:500,
                transition:"color .15s" }}
              onMouseEnter={e=>e.currentTarget.style.color="#323338"}
              onMouseLeave={e=>e.currentTarget.style.color="#676879"}>
              Switch to advanced filters
            </span>
          </div>
        </>
      )}

      {mode === "advanced" && (
        <>
          <div style={{ padding:"16px 20px", borderBottom:`1px solid #eef0f4` }}>
            {/* Filter with AI toggle */}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
              <div style={{ width:38,height:22,borderRadius:11,background:"#e2e8f0",
                cursor:"pointer",position:"relative",transition:"background .2s" }}>
                <div style={{ position:"absolute",top:3,left:3,width:16,height:16,
                  borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
              </div>
              <span style={{ fontSize:13, color:"#323338", fontWeight:500 }}>Filter with AI</span>
            </div>

            {/* WHERE row */}
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <span style={{ fontSize:13, color:"#676879", fontWeight:600, minWidth:50 }}>Where</span>
              {advFilters.map((af,i)=>(
                <div key={af.id} style={{ display:"flex", alignItems:"center", gap:8,
                  marginBottom: i < advFilters.length-1 ? 8 : 0, flexWrap:"wrap" }}>
                  <select value={af.col} onChange={e=>setAdvFilters(p=>p.map(x=>x.id===af.id?{...x,col:e.target.value}:x))}
                    style={selInput}>
                    <option>Status</option>
                    <option>Person</option>
                    <option>Due date</option>
                    <option>Priority</option>
                    <option>Group</option>
                    <option>Task name</option>
                  </select>
                  <select value={af.cond} onChange={e=>setAdvFilters(p=>p.map(x=>x.id===af.id?{...x,cond:e.target.value}:x))}
                    style={selInput}>
                    <option value="is">is</option>
                    <option value="is_not">is not</option>
                    <option value="contains">contains</option>
                    <option value="empty">is empty</option>
                    <option value="not_empty">is not empty</option>
                  </select>
                  <select value={af.val} onChange={e=>setAdvFilters(p=>p.map(x=>x.id===af.id?{...x,val:e.target.value}:x))}
                    style={{...selInput, minWidth:200}}>
                    <option value="">Value</option>
                    {af.col==="Status" && Object.keys(STATUS_CFG).map(s=><option key={s}>{s}</option>)}
                    {af.col==="Person" && owners.map(o=><option key={o}>{o}</option>)}
                    {af.col==="Priority" && ["Critical","High","Medium","Low"].map(p=><option key={p}>{p}</option>)}
                    {af.col==="Group" && groupList.map(g=><option key={g.label}>{g.label}</option>)}
                  </select>
                  {advFilters.length > 1 && (
                    <button onClick={()=>setAdvFilters(p=>p.filter(x=>x.id!==af.id))}
                      style={{background:"none",border:"none",cursor:"pointer",color:"#e2445c",fontSize:16}}>×</button>
                  )}
                </div>
              ))}
            </div>

            {/* + New filter / + New group */}
            <div style={{ display:"flex", gap:16, marginTop:12 }}>
              <span onClick={()=>setAdvFilters(p=>[...p,{id:Date.now(),col:"Status",cond:"is",val:""}])}
                style={{ fontSize:12, color:"#676879", cursor:"pointer", fontWeight:600,
                  transition:"color .15s" }}
                onMouseEnter={e=>e.currentTarget.style.color="#323338"}
                onMouseLeave={e=>e.currentTarget.style.color="#676879"}>
                + New filter
              </span>
              <span style={{ fontSize:12, color:"#676879", cursor:"pointer", fontWeight:600 }}>
                + New group
              </span>
            </div>
          </div>

          {/* footer */}
          <div style={{ display:"flex", justifyContent:"flex-end", padding:"10px 20px" }}>
            <span onClick={()=>setMode("quick")}
              style={{ fontSize:12, color:"#676879", cursor:"pointer", fontWeight:500,
                transition:"color .15s" }}
              onMouseEnter={e=>e.currentTarget.style.color="#323338"}
              onMouseLeave={e=>e.currentTarget.style.color="#676879"}>
              Switch to quick filters
            </span>
          </div>
        </>
      )}
    </div>
  );
}


/* ─── PERSON FILTER PANEL ─── */
function PersonFilterPanel({ anchor, onClose, groups, filters, onToggle, onClear }) {
  const ref = useRef();
  const [pos, setPos] = useState({top:0,left:0});
  const [search, setSearch] = useState("");
  const searchRef = useRef();

  const allTasks = groups.flatMap(g=>g.tasks||[]);
  const owners   = [...new Set(allTasks.map(t=>t.assignTo).filter(v=>v&&v!=="Unassigned"&&v!==""))];
  const unassignedCount = allTasks.filter(t=>!t.assignTo||t.assignTo==="Unassigned"||t.assignTo==="").length;
  const hasFilter = filters.owner.size > 0;

  const filtered = owners.filter(o=>!search||o.toLowerCase().includes(search.toLowerCase()));

  useEffect(()=>{
    const calc=()=>{
      if(anchor?.current){
        const r=anchor.current.getBoundingClientRect();
        let left=r.left;
        if(left+260>window.innerWidth-8) left=window.innerWidth-268;
        setPos({top:r.bottom+4,left});
      }
    };
    calc();
    window.addEventListener('scroll',calc,true);
    window.addEventListener('resize',calc);
    return()=>{ window.removeEventListener('scroll',calc,true); window.removeEventListener('resize',calc); };
  },[anchor]);

  useEffect(()=>{
    const h=e=>{
      if(ref.current&&!ref.current.contains(e.target)&&!anchor?.current?.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[anchor,onClose]);

  useEffect(()=>{ setTimeout(()=>searchRef.current?.focus(),60); },[]);

  return (
    <div ref={ref} style={{
      position:"fixed", top:pos.top, left:pos.left, zIndex:9000,
      background:"#fff", border:`1px solid #dde1ea`, borderRadius:12,
      boxShadow:"0 8px 40px rgba(0,0,0,0.14)", fontFamily:"inherit",
      width:260, animation:"ddIn .12s ease", overflow:"hidden"
    }}>
      {/* header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"12px 14px 8px" }}>
        <span style={{ fontSize:13, fontWeight:800, color:"#323338" }}>Filter by Person</span>
        {hasFilter && (
          <span onClick={onClear} style={{ fontSize:11, color:"#0073ea", cursor:"pointer",
            fontWeight:600, padding:"2px 8px", border:`1px solid #d0d4e4`, borderRadius:6 }}>
            Clear
          </span>
        )}
      </div>

      {/* search */}
      <div style={{ padding:"0 10px 8px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, background:"#f5f6f8",
          border:`1px solid #e6e9ef`, borderRadius:8, padding:"6px 10px" }}>
          <span style={{ fontSize:12, color:"#676879" }}>🔍</span>
          <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search people..."
            style={{ border:"none", outline:"none", background:"transparent",
              fontSize:12, color:"#323338", fontFamily:"inherit", flex:1 }}/>
        </div>
      </div>

      {/* list */}
      <div style={{ maxHeight:280, overflowY:"auto", padding:"2px 0 8px" }}>
        {/* Unassigned */}
        {(!search || "unassigned".includes(search.toLowerCase())) && (
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 14px",
            cursor:"pointer", transition:"background .1s" }}
            onMouseEnter={e=>e.currentTarget.style.background="#f5f6f8"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{ width:16,height:16,borderRadius:3,flexShrink:0,
              border:`1.5px solid #c5c9d6`,background:"#fff",
              display:"flex",alignItems:"center",justifyContent:"center",
              color:"#fff",fontSize:10,fontWeight:700 }}/>
            <div style={{ width:26,height:26,borderRadius:"50%",border:`1.5px solid #c5c9d6`,
              display:"flex",alignItems:"center",justifyContent:"center",
              color:"#c5c9d6",fontSize:14,flexShrink:0 }}>👤</div>
            <span style={{ fontSize:13,color:"#323338",flex:1 }}>Unassigned</span>
            <span style={{ fontSize:11,color:"#676879" }}>{unassignedCount}</span>
          </div>
        )}

        {filtered.map(o=>{
          const on=filters.owner.has(o);
          const cnt=allTasks.filter(t=>t.assignTo===o).length;
          return (
            <div key={o} onClick={()=>onToggle("owner",o)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 14px",
                cursor:"pointer", background:on?"rgba(0,115,234,0.06)":"transparent",
                transition:"background .1s" }}
              onMouseEnter={e=>{ if(!on)e.currentTarget.style.background="#f5f6f8"; }}
              onMouseLeave={e=>{ e.currentTarget.style.background=on?"rgba(0,115,234,0.06)":"transparent"; }}>
              <div style={{ width:16,height:16,borderRadius:3,flexShrink:0,
                border:on?"none":`1.5px solid #c5c9d6`,
                background:on?"#0073ea":"#fff",
                display:"flex",alignItems:"center",justifyContent:"center",
                color:"#fff",fontSize:10,fontWeight:700,transition:"all .15s" }}>
                {on?"✓":""}
              </div>
              <div style={{ width:26,height:26,borderRadius:"50%",background:getAvatarColor(o),
                display:"flex",alignItems:"center",justifyContent:"center",
                color:"#fff",fontSize:9,fontWeight:700,flexShrink:0 }}>
                {o.slice(0,2).toUpperCase()}
              </div>
              <span style={{ fontSize:13,color:on?"#0073ea":"#323338",
                fontWeight:on?600:400,flex:1 }}>{o}</span>
              <span style={{ fontSize:11,color:"#676879" }}>{cnt}</span>
            </div>
          );
        })}

        {filtered.length===0 && owners.length>0 && (
          <div style={{padding:"14px",textAlign:"center",fontSize:12,color:"#676879"}}>No people found</div>
        )}
        {owners.length===0 && (
          <div style={{padding:"14px",textAlign:"center",fontSize:12,color:"#676879"}}>
            No assignees yet. Assign tasks to see people here.
          </div>
        )}
      </div>
    </div>
  );
}

function HideMenu({ anchor, onClose, extraCols, hiddenCols, onToggleHide }) {
  const ref = useRef();
  const [pos, setPos] = useState({top:0,left:0});
  const [search, setSearch] = useState("");
  const searchRef = useRef();

  // column config — colored icon boxes like monday.com screenshot
  const COL_CFG = {
    person:   { label:"Owner",    bg:"#0073ea", fg:"#fff", icon:"👤" },
    status:   { label:"Status",   bg:"#00c875", fg:"#fff", icon:"≡"  },
    date:     { label:"Due date", bg:"#7c3aed", fg:"#fff", icon:"📅" },
    date2:    { label:"Date",     bg:"#7c3aed", fg:"#fff", icon:"📅" },
    checkbox: { label:"Checkbox", bg:"#f59e0b", fg:"#fff", icon:"☑" },
    priority: { label:"Priority", bg:"#00c875", fg:"#fff", icon:"≡"  },
    text:     { label:"Text",     bg:"#f59e0b", fg:"#fff", icon:"T"  },
    number:   { label:"Numbers",  bg:"#0073ea", fg:"#fff", icon:"#"  },
    link:     { label:"Link",     bg:"#9333ea", fg:"#fff", icon:"🔗" },
    tags:     { label:"Tags",     bg:"#e2445c", fg:"#fff", icon:"🏷" },
    timeline: { label:"Timeline", bg:"#00c875", fg:"#fff", icon:"📊" },
    rating:   { label:"Rating",   bg:"#f59e0b", fg:"#fff", icon:"⭐"},
    status2:  { label:"Status",   bg:"#00c875", fg:"#fff", icon:"≡"  },
    people:   { label:"People",   bg:"#0073ea", fg:"#fff", icon:"👤" },
  };

  const builtins = [
    { id:"person",  type:"person"  },
    { id:"status",  type:"status"  },
    { id:"date",    type:"date"    },
  ];

  const allCols = [
    ...builtins,
    ...(extraCols||[]).map(ec => ({ id:ec.id, type:ec.type, customLabel:ec.label }))
  ];

  const visibleCount = allCols.filter(col => !hiddenCols.has(col.id)).length;
  const allVisible   = hiddenCols.size === 0;

  const filtered = allCols.filter(col => {
    const cfg = COL_CFG[col.type] || { label: col.customLabel||col.type };
    const label = col.customLabel || cfg.label;
    return !search || label.toLowerCase().includes(search.toLowerCase());
  });

  useEffect(()=>{
    const calc = () => {
      if(anchor?.current){
        const r = anchor.current.getBoundingClientRect();
        let left = r.left;
        if(left+290 > window.innerWidth-8) left = window.innerWidth-298;
        setPos({ top: r.bottom+4, left });
      }
    };
    calc();
    window.addEventListener('scroll', calc, true);
    window.addEventListener('resize', calc);
    return()=>{ window.removeEventListener('scroll',calc,true); window.removeEventListener('resize',calc); };
  },[anchor]);

  useEffect(()=>{
    const h = e=>{
      if(ref.current&&!ref.current.contains(e.target)&&!anchor?.current?.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[anchor,onClose]);

  useEffect(()=>{ setTimeout(()=>searchRef.current?.focus(),60); },[]);

  return (
    <div ref={ref} style={{
      position:"fixed", top:pos.top, left:pos.left, zIndex:9000,
      background:"#fff", border:`1px solid #dde1ea`, borderRadius:12,
      boxShadow:"0 8px 40px rgba(0,0,0,0.14)", fontFamily:"inherit",
      width:290, animation:"ddIn .12s ease", overflow:"hidden"
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 16px 10px", borderBottom:`1px solid #eef0f4` }}>
        <span style={{ fontSize:14, fontWeight:800, color:"#323338" }}>Display columns</span>
        <button onClick={onClose}
          style={{ background:"#fff", border:`1px solid #d0d4e4`, borderRadius:8,
            padding:"4px 12px", fontSize:11, fontWeight:600, color:"#323338",
            cursor:"pointer", fontFamily:"inherit" }}>Save as new view</button>
      </div>

      {/* Search */}
      <div style={{ padding:"10px 12px 6px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, background:"#f5f6f8",
          border:`1px solid #e6e9ef`, borderRadius:8, padding:"7px 10px" }}>
          <span style={{ fontSize:13, color:"#676879" }}>🔍</span>
          <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Find columns to show/hide"
            style={{ border:"none", outline:"none", background:"transparent",
              fontSize:12.5, color:"#323338", fontFamily:"inherit", flex:1 }}/>
        </div>
      </div>

      {/* "All columns" master checkbox */}
      {!search && (
        <div onClick={()=>{ if(allVisible){ allCols.forEach(col=>onToggleHide(col.id)); } else { allCols.forEach(col=>{ if(hiddenCols.has(col.id)) onToggleHide(col.id); }); }}}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 14px 5px",
            cursor:"pointer", borderBottom:`1px solid #eef0f4` }}
          onMouseEnter={e=>e.currentTarget.style.background="#f5f6f8"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div style={{ width:16, height:16, borderRadius:3, flexShrink:0,
            background: allVisible ? "#0073ea" : "#e2e8f0",
            border: allVisible ? "none" : `1.5px solid #c5c9d6`,
            display:"flex", alignItems:"center", justifyContent:"center",
            color:"#fff", fontSize:10, fontWeight:700 }}>{allVisible ? "✓" : ""}</div>
          <span style={{ fontSize:13, fontWeight:600, color:"#323338" }}>All columns</span>
          <span style={{ fontSize:12, color:"#676879", marginLeft:4 }}>{visibleCount} selected</span>
        </div>
      )}

      {/* Column list */}
      <div style={{ maxHeight:320, overflowY:"auto", padding:"4px 0 8px" }}>
        {filtered.map(col => {
          const cfg = COL_CFG[col.type] || { label:col.customLabel||col.type, bg:P.accent, fg:"#fff", icon:"📝" };
          const label = col.customLabel || cfg.label;
          const shown = !hiddenCols.has(col.id);
          return (
            <div key={col.id} onClick={()=>onToggleHide(col.id)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 14px",
                cursor:"pointer", transition:"background .1s" }}
              onMouseEnter={e=>e.currentTarget.style.background="#f5f6f8"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              {/* blue checkbox */}
              <div style={{ width:16, height:16, borderRadius:3, flexShrink:0,
                background: shown ? "#0073ea" : "#fff",
                border: shown ? "none" : `1.5px solid #c5c9d6`,
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"#fff", fontSize:10, fontWeight:700, transition:"all .15s" }}>
                {shown ? "✓" : ""}
              </div>
              {/* colored icon box */}
              <div style={{ width:24, height:24, borderRadius:6, flexShrink:0,
                background:cfg.bg, display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:12, color:cfg.fg, fontWeight:700 }}>
                {cfg.icon}
              </div>
              <span style={{ fontSize:13, color: shown?"#323338":"#676879",
                fontWeight: shown?400:400 }}>{label}</span>
            </div>
          );
        })}
        {filtered.length===0 && (
          <div style={{padding:"16px",textAlign:"center",fontSize:12,color:"#676879"}}>No columns found</div>
        )}
      </div>
    </div>
  );
}

function SortMenu({ anchor, sort, onSort, onClose, extraCols }) {
  const ref = useRef();
  const [pos, setPos] = useState({ top:0, left:0 });
  const [sortRows, setSortRows] = useState(() => {
    if (sort) {
      const parts = sort.split('-');
      return [{ id:1, col: parts[0]==='name'?'Name':parts[0]==='date'?'Due date':parts[0]==='status'?'Status':'Name',
        dir: parts[1]==='desc'?'Descending':'Ascending' }];
    }
    return [{ id:1, col:'', dir:'Ascending' }];
  });

  useEffect(()=>{
    const calc = () => {
      if(anchor?.current){
        const r = anchor.current.getBoundingClientRect();
        setPos({ top: r.bottom+4, left: Math.max(8, r.left-10) });
      }
    };
    calc();
    window.addEventListener('scroll', calc, true);
    window.addEventListener('resize', calc);
    return()=>{ window.removeEventListener('scroll',calc,true); window.removeEventListener('resize',calc); };
  },[anchor]);

  useEffect(()=>{
    const h = e => {
      if(ref.current && !ref.current.contains(e.target) && !anchor?.current?.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', h);
    return()=>document.removeEventListener('mousedown', h);
  },[anchor, onClose]);

  // all columns list — built-in + extra
  const builtinCols = [
    { key:'Name',     label:'Name',     color:'#a259ff', icon:'T', bg:'#ede9fe' },
    { key:'Owner',    label:'Owner',    color:'#fff',    icon:'👤',bg:'#0073ea' },
    { key:'Status',   label:'Status',   color:'#fff',    icon:'≡', bg:'#00c875' },
    { key:'Due date', label:'Due date', color:'#fff',    icon:'📅',bg:'#7c3aed' },
    { key:'Date',     label:'Date',     color:'#fff',    icon:'📅',bg:'#9333ea' },
    { key:'Checkbox', label:'Checkbox', color:'#fff',    icon:'☑',bg:'#f59e0b' },
    { key:'Priority', label:'Priority', color:'#fff',    icon:'≡', bg:'#00c875' },
    { key:'People',   label:'People',   color:'#fff',    icon:'👤',bg:'#0073ea' },
    { key:'Text',     label:'Text',     color:'#a259ff', icon:'T', bg:'#fde68a' },
    ...(extraCols||[]).map(ec=>({ key:ec.label, label:ec.label, color:'#fff', icon:'📝', bg:P.accent }))
  ];

  const [openColDrop, setOpenColDrop] = useState(null); // row id that has col dropdown open
  const colDropRef = useRef();

  const applySort = (rows) => {
    const r = rows[0];
    if(!r || !r.col) return;
    const map = {
      'Name': r.dir==='Ascending'?'name-asc':'name-desc',
      'Due date': r.dir==='Ascending'?'date-asc':'date-desc',
      'Status': 'status',
    };
    onSort(map[r.col] || `${r.col.toLowerCase()}-${r.dir==='Ascending'?'asc':'desc'}`);
  };

  const selS = {
    border:`1px solid #d0d4e4`, borderRadius:7, padding:"7px 11px",
    fontSize:13, fontFamily:"inherit", color:"#323338", outline:"none",
    background:"#fff", cursor:"pointer", appearance:"none", WebkitAppearance:"none"
  };

  return (
    <div ref={ref} style={{
      position:"fixed", top:pos.top, left:pos.left, zIndex:9000,
      background:"#fff", border:`1px solid #dde1ea`, borderRadius:12,
      boxShadow:"0 8px 40px rgba(0,0,0,0.13)", fontFamily:"inherit",
      width:680, animation:"ddIn .12s ease", overflow:"visible"
    }}>
      {/* header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 20px 10px", borderBottom:`1px solid #eef0f4` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:14, fontWeight:800, color:"#323338" }}>Sort by</span>
          <span style={{ fontSize:13, color:"#676879", cursor:"pointer" }}>ⓘ</span>
        </div>
        <button onClick={onClose}
          style={{ background:"#fff", border:`1px solid #d0d4e4`, borderRadius:8,
            padding:"5px 14px", fontSize:12, fontWeight:600, color:"#323338",
            cursor:"pointer", fontFamily:"inherit" }}>Save as new view</button>
      </div>

      {/* sort rows */}
      <div style={{ padding:"14px 20px" }}>
        {sortRows.map((row, idx) => (
          <div key={row.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            {/* drag handle */}
            <div style={{ color:"#c5c9d6", cursor:"grab", fontSize:16, padding:"0 2px" }}>⠿</div>

            {/* Column chooser */}
            <div style={{ position:"relative", flex:1 }}>
              <div onClick={()=>setOpenColDrop(openColDrop===row.id?null:row.id)}
                style={{ ...selS, display:"flex", alignItems:"center", gap:8,
                  border: openColDrop===row.id ? `1px solid #0073ea` : `1px solid #d0d4e4` }}>
                {row.col ? (
                  <>
                    <div style={{ width:20, height:20, borderRadius:5, flexShrink:0,
                      background: builtinCols.find(b=>b.key===row.col)?.bg || P.accent,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:11, color: builtinCols.find(b=>b.key===row.col)?.color || "#fff" }}>
                      {builtinCols.find(b=>b.key===row.col)?.icon || ''}
                    </div>
                    <span style={{ flex:1 }}>{row.col}</span>
                  </>
                ) : (
                  <span style={{ color:"#676879", flex:1 }}>Choose column</span>
                )}
                <span style={{ color:"#676879", fontSize:11 }}>{openColDrop===row.id?'▲':'▼'}</span>
              </div>

              {/* column dropdown */}
              {openColDrop===row.id && (
                <div ref={colDropRef}
                  style={{ position:"absolute", top:"calc(100% + 4px)", left:0, zIndex:9999,
                    background:"#fff", border:`1px solid #dde1ea`, borderRadius:10,
                    boxShadow:"0 8px 30px rgba(0,0,0,0.12)", minWidth:220,
                    maxHeight:340, overflowY:"auto", padding:"4px 0" }}>
                  {builtinCols.map(col=>(
                    <div key={col.key}
                      onClick={()=>{
                        setSortRows(p=>p.map(r=>r.id===row.id?{...r,col:col.key}:r));
                        setOpenColDrop(null);
                        applySort(sortRows.map(r=>r.id===row.id?{...r,col:col.key}:r));
                      }}
                      style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 14px",
                        cursor:"pointer", background: row.col===col.key?"rgba(0,115,234,0.06)":"transparent",
                        transition:"background .1s" }}
                      onMouseEnter={e=>{ if(row.col!==col.key) e.currentTarget.style.background="#f5f6f8"; }}
                      onMouseLeave={e=>{ e.currentTarget.style.background=row.col===col.key?"rgba(0,115,234,0.06)":"transparent"; }}
                    >
                      <div style={{ width:24, height:24, borderRadius:6, flexShrink:0,
                        background:col.bg, display:"flex", alignItems:"center",
                        justifyContent:"center", fontSize:12, color:col.color, fontWeight:700 }}>
                        {col.icon}
                      </div>
                      <span style={{ fontSize:13, color: row.col===col.key?"#0073ea":"#323338",
                        fontWeight: row.col===col.key?600:400 }}>{col.label}</span>
                      {row.col===col.key && <span style={{ marginLeft:"auto", color:"#0073ea", fontSize:12 }}>✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Direction */}
            <div style={{ position:"relative", width:160, flexShrink:0 }}>
              <select value={row.dir}
                onChange={e=>{
                  const newRows = sortRows.map(r=>r.id===row.id?{...r,dir:e.target.value}:r);
                  setSortRows(newRows); applySort(newRows);
                }}
                style={{ ...selS, width:"100%", paddingLeft:32 }}>
                <option>Ascending</option>
                <option>Descending</option>
              </select>
              <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)",
                fontSize:13, pointerEvents:"none" }}>
                {row.dir==="Ascending" ? "↑" : "↓"}
              </span>
            </div>

            {/* delete row */}
            {sortRows.length > 1 && (
              <button onClick={()=>setSortRows(p=>p.filter(r=>r.id!==row.id))}
                style={{ background:"none", border:"none", cursor:"pointer",
                  color:"#676879", fontSize:16, padding:"0 4px", flexShrink:0 }}>×</button>
            )}
          </div>
        ))}

        {/* + Add sort */}
        <div style={{ display:"flex", gap:16, marginTop:4 }}>
          <span onClick={()=>setSortRows(p=>[...p,{id:Date.now(),col:'',dir:'Ascending'}])}
            style={{ fontSize:12, color:"#676879", cursor:"pointer", fontWeight:600,
              transition:"color .15s" }}
            onMouseEnter={e=>e.currentTarget.style.color="#323338"}
            onMouseLeave={e=>e.currentTarget.style.color="#676879"}>
            + Add sort
          </span>
          {sort && (
            <span onClick={()=>{ onSort(null); setSortRows([{id:1,col:'',dir:'Ascending'}]); onClose(); }}
              style={{ fontSize:12, color:"#e2445c", cursor:"pointer", fontWeight:600 }}>
              Clear sort
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function GrpByMenu({anchor,groupBy,onGroupBy,onClose}){
  return(
    <DD anchor={anchor} onClose={onClose} w={210}>
      <div style={{fontSize:10,color:P.muted,fontWeight:700,letterSpacing:1,padding:"4px 10px 5px",textTransform:"uppercase"}}>Group by</div>
      {[{k:"default",l:"Default (Groups)"},{k:"status",l:"Status"},{k:"date",l:"Due date"}].map(o=>(
        <MI key={o.k} title={o.l} active={groupBy===o.k} check onClick={()=>{onGroupBy(o.k);onClose();}}/>
      ))}
    </DD>
  );
}


/* ─── COLUMN TYPES ─── */
const COLUMN_TYPES = [
  { type: "text",     icon: "📝", label: "Text",      desc: "Add notes or free text" },
  { type: "number",   icon: "🔢", label: "Numbers",   desc: "Track progress, budget, count" },
  { type: "status2",  icon: "🏷️", label: "Status",    desc: "Custom label column" },
  { type: "date2",    icon: "📅", label: "Date",      desc: "Set another date or timeline" },
  { type: "priority", icon: "🔥", label: "Priority",  desc: "Critical, High, Medium, Low" },
  { type: "checkbox", icon: "☑️", label: "Checkbox",  desc: "Simple yes / no toggle" },
  { type: "link",     icon: "🔗", label: "Link",      desc: "Add a URL" },
  { type: "tags",     icon: "🏷",  label: "Tags",      desc: "Add labels / tags" },
  { type: "timeline", icon: "📊", label: "Timeline",  desc: "Start date → end date" },
  { type: "rating",   icon: "⭐", label: "Rating",    desc: "Rate 1 – 5 stars" },
];

/* ─── ADD COLUMN MODAL ─── */
function AddColumnModal({ onAdd, onClose }) {
  const [search, setSearch] = useState("");
  const filtered = COLUMN_TYPES.filter(c =>
    !search || c.label.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,10,60,0.4)", zIndex: 8000,
      display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 16, width: 480,
        boxShadow: "0 24px 80px rgba(124,58,237,0.25)", overflow: "hidden", animation: "ddIn .15s ease" }}>
        <div style={{ background: `linear-gradient(135deg,${P.dark},${P.mid})`, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Add Column</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Choose a column type</div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none",
              borderRadius: 7, width: 28, height: 28, cursor: "pointer", color: "#fff", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "7px 11px" }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search column types…"
              style={{ border: "none", outline: "none", background: "transparent",
                fontSize: 13, color: "#fff", fontFamily: "inherit", flex: 1 }} />
          </div>
        </div>
        <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxHeight: 380, overflowY: "auto" }}>
          {filtered.map(ct => (
            <div key={ct.type} onClick={() => { onAdd(ct); onClose(); }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                border: `1.5px solid ${P.border}`, borderRadius: 10, cursor: "pointer",
                transition: "all .15s", background: "#fff" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = P.accent; e.currentTarget.style.background = P.light; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.background = "#fff"; }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 9, background: P.light,
                border: `1.5px solid ${P.border}`, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{ct.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: P.text }}>{ct.label}</div>
                <div style={{ fontSize: 10, color: P.muted, marginTop: 1 }}>{ct.desc}</div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "24px 0", color: P.muted, fontSize: 13 }}>
              No column types found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── COLUMN HEADER (rename / delete) ─── */
function ColHeader({ col, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(col.label);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();
  const ct = COLUMN_TYPES.find(c => c.type === col.type) || { icon: "📝" };

  if (editing) return (
    <div style={{ display: "flex", alignItems: "center", padding: "0 6px", gap: 4, width: "100%" }}>
      <input autoFocus value={val} onChange={e => setVal(e.target.value)}
        onBlur={() => { onRename(col.id, val || col.label); setEditing(false); }}
        onKeyDown={e => {
          if (e.key === "Enter") { onRename(col.id, val || col.label); setEditing(false); }
          if (e.key === "Escape") setEditing(false);
        }}
        style={{ flex: 1, border: `1.5px solid ${P.accent}`, borderRadius: 5, padding: "3px 7px",
          fontSize: 11, fontFamily: "inherit", outline: "none", color: P.text, background: "#fff" }} />
    </div>
  );

  return (
    <div className="col-hdr" style={{ display: "flex", alignItems: "center", justifyContent: "center",
      gap: 4, padding: "7px 6px", position: "relative", width: "100%" }}>
      <span style={{ fontSize: 11 }}>{ct.icon}</span>
      <span style={{ fontSize: 11, color: P.muted, fontWeight: 700, letterSpacing: 0.3,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 80 }}>{col.label}</span>
      <div ref={menuRef} onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
        className="col-menu-btn"
        style={{ width: 14, height: 14, borderRadius: 3, display: "flex", alignItems: "center",
          justifyContent: "center", cursor: "pointer", fontSize: 9, color: P.muted, opacity: 0,
          transition: "opacity .1s", flexShrink: 0 }}>▾</div>
      {menuOpen && (
        <DD anchor={menuRef} onClose={() => setMenuOpen(false)} w={160}>
          <MI icon="✏️" title="Rename" onClick={() => { setEditing(true); setMenuOpen(false); }} />
          <Sep />
          <MI icon="🗑" title="Delete column" danger onClick={() => { onDelete(col.id); setMenuOpen(false); }} />
        </DD>
      )}
    </div>
  );
}

/* ─── CELL RENDERER ─── */
function Cell({ col, value, onChange }) {
  const [localVal, setLocalVal] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const ref = useRef();

  useEffect(() => { setLocalVal(value ?? ""); }, [value]);

  if (col.type === "checkbox") {
    const checked = value === true || value === "true" || value === 1;
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", cursor: "pointer" }}
        onClick={() => onChange(!checked)}>
        <div style={{ width: 17, height: 17, borderRadius: 4,
          border: checked ? "none" : `1.5px solid ${P.muted}`,
          background: checked ? P.accent : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 10, fontWeight: 700, transition: "all .15s" }}>
          {checked && "✓"}
        </div>
      </div>
    );
  }

  if (col.type === "priority") {
    const opts = ["—","Critical","High","Medium","Low"];
    const v = value || "—";
    const cfg = PRIORITY_CFG[v] || PRIORITY_CFG["—"];
    return (
      <div ref={ref} style={{ height: "100%", display: "flex", alignItems: "stretch" }}>
        <div onClick={() => setOpen(o => !o)}
          style={{ flex: 1, background: cfg.bg, color: cfg.fg, fontSize: 11, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "opacity .1s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".8"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}>{v}</div>
        {open && (
          <DD anchor={ref} onClose={() => setOpen(false)} w={150}>
            {opts.map(o => {
              const c = PRIORITY_CFG[o];
              return (
                <div key={o} onClick={() => { onChange(o); setOpen(false); }}
                  style={{ borderRadius: 6, overflow: "hidden", marginBottom: 2, cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = ".8"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                  <div style={{ background: c.bg, color: c.fg, padding: "6px 14px",
                    fontSize: 12, fontWeight: 700, textAlign: "center" }}>{o}</div>
                </div>
              );
            })}
          </DD>
        )}
      </div>
    );
  }

  if (col.type === "status2") {
    const opts = ["—","Done","In Progress","Blocked","Review","On Hold"];
    const colorMap = { "Done":"#00c875","In Progress":"#fdab3d","Blocked":"#e2445c",
      "Review":"#9333ea","On Hold":"#7c3aed","—":"#e2e8f0" };
    const v = value || "—";
    const bg = colorMap[v] || "#e2e8f0";
    const fg = v === "—" ? "#94a3b8" : "#fff";
    return (
      <div ref={ref} style={{ height: "100%", display: "flex", alignItems: "stretch" }}>
        <div onClick={() => setOpen(o => !o)}
          style={{ flex: 1, background: bg, color: fg, fontSize: 11, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "opacity .1s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".8"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}>{v}</div>
        {open && (
          <DD anchor={ref} onClose={() => setOpen(false)} w={160}>
            {opts.map(o => (
              <div key={o} onClick={() => { onChange(o); setOpen(false); }}
                style={{ borderRadius: 6, overflow: "hidden", marginBottom: 2, cursor: "pointer" }}>
                <div style={{ background: colorMap[o]||"#e2e8f0", color: o==="—"?"#94a3b8":"#fff",
                  padding: "6px 14px", fontSize: 12, fontWeight: 700, textAlign: "center" }}>{o}</div>
              </div>
            ))}
          </DD>
        )}
      </div>
    );
  }

  if (col.type === "rating") {
    const v = Number(value) || 0;
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, height: "100%" }}>
        {[1,2,3,4,5].map(n => (
          <span key={n} onClick={() => onChange(v === n ? 0 : n)}
            style={{ fontSize: 15, cursor: "pointer", color: n <= v ? "#f59e0b" : "#e2e8f0",
              transition: "color .1s, transform .1s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.25)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >★</span>
        ))}
      </div>
    );
  }

  if (col.type === "tags") {
    const tags = Array.isArray(value) ? value
      : (value ? String(value).split(",").map(t => t.trim()).filter(Boolean) : []);
    const tagColors = ["#e0e7ff","#fce7f3","#d1fae5","#fef3c7","#fee2e2","#ede9fe"];
    const tagText   = ["#4338ca","#be185d","#065f46","#92400e","#991b1b","#5b21b6"];
    return (
      <div ref={ref} style={{ display: "flex", alignItems: "center", gap: 3, padding: "0 6px",
        flexWrap: "wrap", height: "100%", cursor: "pointer", minHeight: 36 }}
        onClick={() => setOpen(o => !o)}>
        {tags.length === 0
          ? <span style={{ fontSize: 11, color: P.muted }}>+ Add</span>
          : tags.slice(0,2).map((t,i) => (
              <span key={t} style={{ fontSize: 10, background: tagColors[i%tagColors.length],
                color: tagText[i%tagText.length], borderRadius: 10, padding: "2px 6px", fontWeight: 600 }}>{t}</span>
            ))
        }
        {tags.length > 2 && <span style={{ fontSize: 10, color: P.muted }}>+{tags.length-2}</span>}
        {open && (
          <DD anchor={ref} onClose={() => setOpen(false)} w={200}>
            <div style={{ padding: "6px 8px 4px" }}>
              <input autoFocus placeholder="Type tag + Enter"
                onKeyDown={e => { if (e.key === "Enter" && e.target.value.trim()) {
                  onChange([...tags, e.target.value.trim()].join(","));
                  e.target.value = ""; }}}
                style={{ width: "100%", border: `1.5px solid ${P.border}`, borderRadius: 7,
                  padding: "6px 9px", fontSize: 12, fontFamily: "inherit", outline: "none",
                  color: P.text, background: P.light }} />
            </div>
            {tags.map((t,i) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 8px", borderRadius: 6 }}>
                <span style={{ fontSize: 11, background: tagColors[i%tagColors.length],
                  color: tagText[i%tagText.length], borderRadius: 10, padding: "2px 8px", fontWeight: 600 }}>{t}</span>
                <span onClick={e => { e.stopPropagation(); onChange(tags.filter(x=>x!==t).join(",")); }}
                  style={{ marginLeft: "auto", color: "#e2445c", fontSize: 12, cursor: "pointer" }}>✕</span>
              </div>
            ))}
          </DD>
        )}
      </div>
    );
  }

  if (col.type === "link") {
    if (!editing && value) return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
        padding: "0 6px", height: "100%" }}>
        <a href={value} target="_blank" rel="noreferrer"
          style={{ fontSize: 11, color: "#0073ea", textDecoration: "none", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 90 }}
          onClick={e => e.stopPropagation()}>🔗 {value.replace(/^https?:\/\//,"")}</a>
        <span onClick={() => setEditing(true)} style={{ fontSize: 10, color: P.muted, cursor: "pointer" }}>✏️</span>
      </div>
    );
    return (
      <input value={localVal} onChange={e => setLocalVal(e.target.value)}
        onBlur={() => { onChange(localVal); setEditing(false); }}
        onFocus={() => setEditing(true)}
        placeholder="https://…"
        style={{ width: "100%", height: "100%", border: "none", outline: "none",
          fontSize: 11, color: "#0073ea", fontFamily: "inherit", background: "transparent",
          padding: "0 8px", textAlign: "center" }} />
    );
  }

  if (col.type === "timeline") {
    const parts = (value||"").split("→").map(s=>s.trim());
    const start = parts[0]||""; const end = parts[1]||"";
    if (!editing) return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
        height: "100%", cursor: "pointer", padding: "0 4px" }} onClick={() => setEditing(true)}>
        {start||end
          ? <><span style={{ fontSize: 10, color: P.muted }}>{fmt(start)||"Start"}</span>
              <span style={{ fontSize: 9, color: P.muted }}>→</span>
              <span style={{ fontSize: 10, color: P.muted }}>{fmt(end)||"End"}</span></>
          : <span style={{ fontSize: 11, color: P.muted }}>Set range</span>
        }
      </div>
    );
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "0 4px", height: "100%" }}
        onBlur={() => setEditing(false)}>
        <input type="date" defaultValue={start}
          onChange={e => onChange(`${e.target.value}→${end}`)}
          style={{ flex: 1, border: "none", outline: "none", fontSize: 10, color: P.muted,
            fontFamily: "inherit", background: "transparent", cursor: "pointer" }} />
        <span style={{ fontSize: 9, color: P.muted }}>→</span>
        <input type="date" defaultValue={end}
          onChange={e => onChange(`${start}→${e.target.value}`)}
          style={{ flex: 1, border: "none", outline: "none", fontSize: 10, color: P.muted,
            fontFamily: "inherit", background: "transparent", cursor: "pointer" }} />
      </div>
    );
  }

  if (col.type === "date2") {
    return (
      <input type="date" value={localVal}
        onChange={e => { setLocalVal(e.target.value); onChange(e.target.value); }}
        style={{ width: "100%", height: "100%", border: "none", outline: "none", fontSize: 11,
          color: P.muted, fontFamily: "inherit", background: "transparent",
          cursor: "pointer", textAlign: "center", padding: "0 4px" }} />
    );
  }

  // text / number default
  return (
    <input value={localVal} onChange={e => setLocalVal(e.target.value)} onBlur={() => onChange(localVal)}
      type={col.type === "number" ? "number" : "text"}
      placeholder={col.type === "number" ? "0" : "—"}
      style={{ width: "100%", height: "100%", border: "none", outline: "none", fontSize: 12,
        color: P.text, fontFamily: "inherit", background: "transparent",
        padding: "0 8px", textAlign: col.type === "number" ? "center" : "left" }}
      onFocus={e => { e.target.style.background="#fff"; e.target.style.boxShadow=`inset 0 0 0 1.5px ${P.accent}`; }}
      onBlurCapture={e => { e.target.style.background="transparent"; e.target.style.boxShadow="none"; }}
    />
  );
}

/* ─── TASK ROW ─── */
function TaskRow({ task, onCheck, onField, onStatus, onDup, onDel, onOpen, selected, groupColor, employees, extraCols, onExtraField, hiddenCols }) {
  const statusRef = useRef(); const dotsRef = useRef(); const personRef = useRef();
  const [spOpen, setSpOpen] = useState(false);
  const [dotsOpen, setDotsOpen] = useState(false);
  const [personOpen, setPersonOpen] = useState(false);
  const id = task._id || task.id;
  const sc = STATUS_CFG[task.status] || STATUS_CFG["Not Started"];
  const cols = extraCols || [];
  const hc = hiddenCols || new Set();
  // build grid: checkbox | task | [person] | [status] | [date] | ...extraCols | + | dots
  const extraColW = cols.map(c => {
    if (c.type === "text") return "140px";
    if (c.type === "number") return "90px";
    if (c.type === "checkbox") return "70px";
    if (c.type === "rating") return "110px";
    if (c.type === "timeline") return "160px";
    if (c.type === "tags") return "130px";
    return "120px";
  }).join(" ");
  const personW = hc.has('person') ? '' : '150px ';
  const statusW = hc.has('status') ? '' : '190px ';
  const dateW   = hc.has('date')   ? '' : '130px ';
  const gridCols = `36px minmax(0,1fr) ${personW}${statusW}${dateW}${extraColW ? extraColW + " " : ""}36px 36px`;

  return (
    <div className="trow" style={{
      display: "grid", gridTemplateColumns: gridCols,
      alignItems: "stretch", borderBottom: `1px solid ${P.border}`,
      background: selected ? "rgba(147,51,234,0.06)" : "#fff", transition: "background .1s",
    }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = P.hover; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = selected ? "rgba(147,51,234,0.06)" : "#fff"; }}
    >
      {/* checkbox */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRight: `1px solid ${P.border}` }}>
        <div onClick={() => onCheck(id)} style={{ width: 15, height: 15, borderRadius: 4, cursor: "pointer",
          border: task.checked ? "none" : `1.5px solid ${P.muted}`,
          background: task.checked ? P.accent : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 700, transition: "all .15s" }}>
          {task.checked && "✓"}
        </div>
      </div>

      {/* name */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 6px 0 0", borderRight: `1px solid ${P.border}`, position: "relative", minWidth: 0 }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: groupColor, flexShrink: 0 }} />
        <input key={task.title} defaultValue={task.title}
          onBlur={e => { const v = e.target.value.trim(); if (v && v !== task.title) onField(id, "title", v); }}
          onClick={e => { if(!e.detail || e.detail===1){ /* single click → open panel on blur */ } }}
          style={{ background: "transparent", border: "none", outline: "none", fontSize: 13,
            color: P.text, fontFamily: "inherit", width: "100%", padding: "9px 4px 9px 10px",
            textDecoration: task.checked ? "line-through" : "none", opacity: task.checked ? .5 : 1, fontWeight: 500,
            cursor:"pointer" }}
          onFocus={e => { e.target.style.background = "#fff"; e.target.style.boxShadow = `0 0 0 2px ${P.accent}33`; e.target.style.borderRadius = "4px"; }}
          onBlurCapture={e => { e.target.style.background = "transparent"; e.target.style.boxShadow = "none"; }}
        />
        {/* ↗ open update panel */}
        <button className="openBtn" onClick={e=>{e.stopPropagation();onOpen(task);}}
          style={{ opacity: 0, background:"#e8f4fd", border:`1px solid #c3d9f0`, borderRadius: 6,
            cursor: "pointer", width: 24, height: 24, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 12, color:"#0073ea", flexShrink: 0, transition: "opacity .15s",
            fontWeight:700 }} title="Open task">↗</button>
        {/* ✦ AI icon */}
        <button className="openBtn" onClick={e=>{e.stopPropagation();onOpen(task);}}
          style={{ opacity: 0, background:"transparent", border:"none",
            cursor: "pointer", width: 22, height: 22, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 14, color:P.muted, flexShrink: 0, transition: "opacity .15s" }}
          title="AI assist">✦</button>
      </div>

      {/* person */}
      {!(hiddenCols||new Set()).has('person') && <div ref={personRef}
        onClick={() => setPersonOpen(v => !v)}
        style={{ display: "flex", alignItems: "center", justifyContent: "center",
          borderRight: `1px solid ${P.border}`, padding: "0 8px", cursor: "pointer",
          transition: "background .1s" }}
        onMouseEnter={e => e.currentTarget.style.background = P.light}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        {task.assignTo && task.assignTo !== "Unassigned"
          ? <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%",
                background: getAvatarColor(task.assignTo),
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                {task.assignTo.slice(0, 2).toUpperCase()}
              </div>
              <span style={{ fontSize: 12, color: P.mid, overflow: "hidden", textOverflow: "ellipsis",
                whiteSpace: "nowrap", maxWidth: 95 }}>{task.assignTo}</span>
            </div>
          : <div style={{ width: 26, height: 26, borderRadius: "50%",
              border: `1.5px dashed ${P.muted}`, display: "flex", alignItems: "center",
              justifyContent: "center", color: P.muted, fontSize: 16 }}>+</div>
        }
      </div>
      }
      {personOpen && (
        <PersonPicker
          anchor={personRef}
          onSelect={v => onField(id, "assignTo", v)}
          onClose={() => setPersonOpen(false)}
          employees={employees}
          currentAssignee={task.assignTo && task.assignTo !== "Unassigned" ? task.assignTo : ""}
        />
      )}

      {/* status */}
      {!(hiddenCols||new Set()).has('status') && <div style={{ display: "flex", alignItems: "stretch", borderRight: `1px solid ${P.border}` }}>
        <div ref={statusRef} onClick={() => setSpOpen(v => !v)}
          style={{ flex: 1, background: sc.bg, color: sc.fg, fontSize: 12, fontWeight: 700,
            textAlign: "center", cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", transition: "opacity .1s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".8"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >{task.status}</div>
        {spOpen && <StatusPicker anchor={statusRef} onSelect={v => { onStatus(id, v); setSpOpen(false); }} onClose={() => setSpOpen(false)} />}
      </div>}

      {/* due date */}
      {!(hiddenCols||new Set()).has('date') && <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
        borderRight: `1px solid ${P.border}`, padding: "0 6px" }}>
        <input type="date" key={task.date} defaultValue={task.date || ""}
          onChange={e => onField(id, "date", e.target.value)}
          style={{ border: "none", outline: "none", fontSize: 12, color: P.muted,
            fontFamily: "inherit", background: "transparent", cursor: "pointer", width: "100%", textAlign: "center" }}
        />
      </div>}

      {/* extra dynamic columns */}
      {cols.map(col => (
        <div key={col.id} style={{ borderRight: `1px solid ${P.border}`, display: "flex",
          alignItems: "stretch", overflow: "hidden" }}>
          <Cell col={col}
            value={(task.extraData || {})[col.id]}
            onChange={val => onExtraField(id, col.id, val)} />
        </div>
      ))}

      {/* empty + col cell */}
      <div style={{ borderRight: `1px solid ${P.border}` }} />

      {/* dots */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div ref={dotsRef} onClick={e => { e.stopPropagation(); setDotsOpen(v => !v); }}
          style={{ width: 26, height: 26, borderRadius: 5, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 15, color: P.muted,
            letterSpacing: 1, userSelect: "none", transition: "background .1s" }}
          onMouseEnter={e => e.currentTarget.style.background = P.border}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >···</div>
        {dotsOpen && (
          <DD anchor={dotsRef} onClose={() => setDotsOpen(false)} w={160}>
            <MI icon="⎘" title="Duplicate" onClick={() => { onDup(task); setDotsOpen(false); }} />
            <Sep />
            <MI icon="🗑" title="Delete task" danger onClick={() => { onDel(id); setDotsOpen(false); }} />
          </DD>
        )}
      </div>
    </div>
  );
}

/* ─── ADD GROUP ROW ─── */
function AddGroupRow({onAdd,triggerRef}){
  const [active,setActive]=useState(false);
  const [label,setLabel]=useState("");
  const inputRef=useRef();
  useEffect(()=>{ if(triggerRef) triggerRef.current={trigger:()=>setActive(true)}; },[triggerRef]);
  useEffect(()=>{ if(active) setTimeout(()=>inputRef.current?.focus(),50); },[active]);
  const submit=()=>{ if(label.trim()) onAdd(label.trim()); setLabel(""); setActive(false); };
  return(
    <div style={{marginBottom:16}}>
      {active?(
        <div style={{display:"flex",alignItems:"center",gap:0}}>
          <div style={{width:4,background:P.accent,borderRadius:"3px 0 0 3px",minHeight:40,flexShrink:0}}/>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",flex:1,
            background:P.light,border:`1.5px solid ${P.accent}`,borderLeft:"none",borderRadius:"0 8px 8px 0"}}>
            <input ref={inputRef} value={label} onChange={e=>setLabel(e.target.value)} placeholder="Group name…"
              onKeyDown={e=>{if(e.key==="Enter")submit();if(e.key==="Escape"){setActive(false);setLabel("");}}}
              style={{flex:1,border:"none",outline:"none",background:"transparent",fontSize:14,fontWeight:700,color:P.accent,fontFamily:"inherit"}}/>
            <button onClick={submit} style={{background:`linear-gradient(135deg,${P.accent},#a855f7)`,color:"#fff",border:"none",borderRadius:7,padding:"5px 16px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>Create</button>
            <button onClick={()=>{setActive(false);setLabel("");}} style={{background:"#fff",color:P.mid,border:`1px solid ${P.border}`,borderRadius:7,padding:"5px 10px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          </div>
        </div>
      ):(
        <div onClick={()=>setActive(true)} style={{display:"flex",alignItems:"center",gap:0,cursor:"pointer"}}>
          <div style={{width:4,background:"transparent",borderRadius:"3px 0 0 3px",minHeight:36,flexShrink:0}}/>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",flex:1,
            border:`1.5px dashed ${P.border}`,borderLeft:"none",borderRadius:"0 8px 8px 0",background:"transparent",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=P.light;e.currentTarget.style.borderColor=P.accent;}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=P.border;}}
          >
            <span style={{fontSize:16,color:P.accent,fontWeight:300,lineHeight:1}}>+</span>
            <span style={{fontSize:13,color:P.mid,fontWeight:600}}>Add new group</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── GROUP BLOCK ─── */
function GroupBlock({ group, onToggle, onCheck, onField, onStatus, onAddTask, onDup, onDel, onOpen, selectedId, isVirtual, onDelGroup, employees, showToast, extraCols, onExtraField, onAddCol, onRenameCol, onDeleteCol, hiddenCols }) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const gid = group._id || group.id;
  const tasks = group.tasks || [];
  const done = tasks.filter(t => t.status === "Done").length;

  const submit = () => {
    if (!newTitle.trim()) { setAdding(false); return; }
    onAddTask(gid, newTitle.trim());
    setNewTitle(""); setAdding(false);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        <div style={{ width: 4, background: group.color, borderRadius: "3px 0 0 3px", flexShrink: 0 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", flex: 1,
          background: P.light, border: `1px solid ${P.border}`, borderLeft: "none",
          borderRadius: "0 8px 8px 0", cursor: "pointer" }}
          onClick={() => onToggle(gid)}
        >
          <span style={{ fontSize: 10, color: group.color, fontWeight: 700,
            transform: `rotate(${group.open ? 0 : -90}deg)`, transition: "transform .2s",
            display: "inline-block", lineHeight: 1 }}>▼</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: group.color, flex: 1, letterSpacing: -0.2 }}>{group.label}</span>
          <span style={{ fontSize: 11, color: P.muted, background: "#fff", border: `1px solid ${P.border}`,
            borderRadius: 10, padding: "1px 8px", fontWeight: 600 }}>{tasks.length} items</span>
          <span style={{ fontSize: 11, color: "#00c875", fontWeight: 600 }}>{done} done</span>
          {!isVirtual && (
            <button onClick={e => { e.stopPropagation(); onDelGroup(gid); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#e2445c60",
                fontSize: 13, padding: "2px 4px", borderRadius: 4, lineHeight: 1, transition: "color .15s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#e2445c"}
              onMouseLeave={e => e.currentTarget.style.color = "#e2445c60"}
              title="Delete group">🗑</button>
          )}
        </div>
      </div>

      {group.open && (
        <div style={{ marginLeft: 4, border: `1px solid ${P.border}`, borderTop: "none",
          borderRadius: "0 0 8px 8px", overflow: "hidden", background: "#fff" }}>
          {/* column headers */}
          {(() => {
            const cols = (extraCols || []).filter(c => !(hiddenCols||new Set()).has(c.id));
            const hcSet = hiddenCols || new Set();
            const extraW = cols.map(c => {
              if (c.type === "text") return "140px";
              if (c.type === "number") return "90px";
              if (c.type === "checkbox") return "70px";
              if (c.type === "rating") return "110px";
              if (c.type === "timeline") return "160px";
              if (c.type === "tags") return "130px";
              return "120px";
            }).join(" ");
            const pW = hcSet.has('person') ? '' : '150px ';
            const sW = hcSet.has('status') ? '' : '190px ';
            const dW = hcSet.has('date')   ? '' : '130px ';
            const gridCols = `36px minmax(0,1fr) ${pW}${sW}${dW}${extraW ? extraW + " " : ""}36px 36px`;
            return (
              <div style={{ display: "grid", gridTemplateColumns: gridCols,
                background: P.light, borderBottom: `1.5px solid ${P.border}` }}>
                <div style={{ borderRight: `1px solid ${P.border}` }} />
                {[{ l: "Task", id:"task" }, { l: "Person", id:"person" }, { l: "Status", id:"status" }, { l: "Due date", id:"date" }]
                  .filter((h,i) => i===0 || !(hiddenCols||new Set()).has(h.id))
                  .map((h, i, arr) => (
                  <div key={h.id} style={{ fontSize: 11, color: P.muted, padding: "7px 10px", fontWeight: 700,
                    borderRight: `1px solid ${P.border}`, letterSpacing: 0.3,
                    textAlign: h.id!=="task" ? "center" : "left", display: "flex", alignItems: "center",
                    justifyContent: h.id!=="task" ? "center" : "flex-start", gap: 4 }}>
                    {h.l}
                    {(h.id === "status" || h.id === "date") && <span style={{ fontSize: 9, color: P.muted, opacity: 0.5 }}>ⓘ</span>}
                  </div>
                ))}
                {/* dynamic extra column headers */}
                {cols.map(col => (
                  <div key={col.id} className="col-hdr-wrap"
                    style={{ borderRight: `1px solid ${P.border}`, background: P.light,
                      display: "flex", alignItems: "center", justifyContent: "center" }}
                    onMouseEnter={e => { const btn = e.currentTarget.querySelector(".col-menu-btn"); if(btn) btn.style.opacity="1"; }}
                    onMouseLeave={e => { const btn = e.currentTarget.querySelector(".col-menu-btn"); if(btn) btn.style.opacity="0"; }}>
                    <ColHeader col={col} onRename={onRenameCol} onDelete={onDeleteCol} />
                  </div>
                ))}
                {/* + Add column */}
                <div onClick={onAddCol}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center",
                    borderRight: `1px solid ${P.border}`, cursor: "pointer",
                    color: P.muted, fontSize: 16, fontWeight: 300, transition: "all .15s", userSelect: "none" }}
                  onMouseEnter={e => { e.currentTarget.style.background = P.hover; e.currentTarget.style.color = P.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = P.muted; }}
                  title="Add column">+</div>
                <div />
              </div>
            );
          })()}

          {tasks.length === 0 && !adding && (
            <div style={{ padding: "12px 16px", fontSize: 12, color: "#c4b5fd", fontStyle: "italic" }}>No tasks yet</div>
          )}
          {tasks.map(t => (
            <TaskRow key={t._id || t.id} task={t}
              onCheck={onCheck} onField={onField} onStatus={onStatus}
              onDup={onDup} onDel={onDel} onOpen={onOpen}
              selected={selectedId === (t._id || t.id)}
              groupColor={group.color}
              employees={employees}
              extraCols={(extraCols||[]).filter(c=>!(hiddenCols||new Set()).has(c.id))}
              onExtraField={onExtraField}
              hiddenCols={hiddenCols}
            />
          ))}

          {!isVirtual && (
            adding ? (
              <div style={{ display: "grid", gridTemplateColumns: "36px minmax(0,1fr) 150px 190px 130px 36px 36px",
                borderTop: `1px solid ${P.border}`, background: P.light, alignItems: "center", minHeight: 40 }}>
                <div style={{ borderRight: `1px solid ${P.border}`, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 15, height: 15, borderRadius: 4, border: `1.5px solid ${P.muted}` }} />
                </div>
                <div style={{ padding: "6px 8px", borderRight: `1px solid ${P.border}`, display: "flex", gap: 6, alignItems: "center" }}>
                  <input autoFocus placeholder="Task name…" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") { setAdding(false); setNewTitle(""); } }}
                    style={{ flex: 1, border: `1.5px solid ${P.accent}`, borderRadius: 6, padding: "5px 9px",
                      fontSize: 13, fontFamily: "inherit", outline: "none", color: P.text, background: "#fff" }} />
                  <button onClick={submit} style={{ background: `linear-gradient(135deg,${P.accent},#a855f7)`,
                    color: "#fff", border: "none", borderRadius: 6, padding: "5px 13px", fontSize: 12,
                    cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>Add</button>
                  <button onClick={() => { setAdding(false); setNewTitle(""); }}
                    style={{ background: "#fff", color: P.mid, border: `1px solid ${P.border}`,
                      borderRadius: 6, padding: "5px 9px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
                </div>
                {[0, 1, 2, 3, 4].map(i => <div key={i} style={{ borderRight: i < 4 ? `1px solid ${P.border}` : "none", height: "100%" }} />)}
              </div>
            ) : (
              <div onClick={() => setAdding(true)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 50px",
                  cursor: "pointer", color: P.muted, fontSize: 13, borderTop: `1px solid ${P.border}`, transition: "background .1s" }}
                onMouseEnter={e => e.currentTarget.style.background = P.hover}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ fontSize: 16, color: P.accent, fontWeight: 300, lineHeight: 1 }}>+</span>
                <span style={{ fontWeight: 500 }}>Add task</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ─── DETAIL PANEL ─── */
function DetailPanel({ task, onClose, onField }) {
  const id = task._id || task.id;
  const sc = STATUS_CFG[task.status] || STATUS_CFG["Not Started"];
  const inp = { width: "100%", border: `1.5px solid ${P.border}`, borderRadius: 8,
    padding: "8px 11px", fontSize: 13, fontFamily: "inherit", color: P.text,
    outline: "none", background: P.light, boxSizing: "border-box", transition: "border-color .15s" };
  return (
    <div style={{ width: 340, flexShrink: 0, background: "#fff", borderLeft: `1.5px solid ${P.border}`,
      display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ background: P.light, borderBottom: `1.5px solid ${P.border}`, padding: "14px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ flex: 1, marginRight: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: P.text, lineHeight: 1.4, marginBottom: 8 }}>{task.title}</div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ background: sc.bg, color: sc.fg, borderRadius: 4, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{task.status}</div>
              {task.assignTo && <span style={{ fontSize: 12, color: P.mid }}>👤 {task.assignTo}</span>}
              {task.date && <span style={{ fontSize: 11, color: P.muted }}>📅 {fmt(task.date)}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20,
            color: P.muted, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}
            onMouseEnter={e => e.currentTarget.style.background = P.light}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>×</button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 13 }}>
        {[{ l: "Title", f: "title" }, { l: "Assigned To", f: "assignTo" }].map(({ l, f }) => (
          <div key={f}>
            <div style={{ fontSize: 10, color: P.muted, fontWeight: 700, letterSpacing: 0.8, marginBottom: 5, textTransform: "uppercase" }}>{l}</div>
            <input key={task[f]} defaultValue={task[f] || ""} onBlur={e => { if (e.target.value.trim() !== String(task[f] || "")) onField(id, f, e.target.value.trim()); }} style={inp}
              onFocus={e => e.target.style.borderColor = P.accent} onBlurCapture={e => e.target.style.borderColor = P.border} />
          </div>
        ))}
        <div>
          <div style={{ fontSize: 10, color: P.muted, fontWeight: 700, letterSpacing: 0.8, marginBottom: 5, textTransform: "uppercase" }}>Due Date</div>
          <input type="date" key={task.date} defaultValue={task.date || ""} onBlur={e => onField(id, "date", e.target.value)} style={inp}
            onFocus={e => e.target.style.borderColor = P.accent} onBlurCapture={e => e.target.style.borderColor = P.border} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: P.muted, fontWeight: 700, letterSpacing: 0.8, marginBottom: 5, textTransform: "uppercase" }}>Priority</div>
          <select key={task.priority} defaultValue={task.priority || "🟡 Medium"} onBlur={e => onField(id, "priority", e.target.value)} style={inp}>
            {["🔴 Critical", "🟠 High", "🟡 Medium", "🟢 Low"].map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 10, color: P.muted, fontWeight: 700, letterSpacing: 0.8, marginBottom: 5, textTransform: "uppercase" }}>Description</div>
          <textarea key={task.description} defaultValue={task.description || ""} placeholder="Add description…"
            onBlur={e => onField(id, "description", e.target.value)} style={{ ...inp, resize: "vertical", minHeight: 80 }}
            onFocus={e => e.target.style.borderColor = P.accent} onBlurCapture={e => e.target.style.borderColor = P.border} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: P.muted, fontWeight: 700, letterSpacing: 0.8, marginBottom: 5, textTransform: "uppercase" }}>Notes</div>
          <textarea key={task.notes} defaultValue={task.notes || ""} placeholder="Add notes…"
            onBlur={e => onField(id, "notes", e.target.value)} style={{ ...inp, resize: "vertical", minHeight: 60 }}
            onFocus={e => e.target.style.borderColor = P.accent} onBlurCapture={e => e.target.style.borderColor = P.border} />
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN ─── */
export default function TaskPage({ projects = [], employees = [] }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(null);
  const [groupBy, setGroupBy] = useState("default");
  const [filters, setFilters] = useState({ owner: new Set(), status: new Set() });
  const [selected, setSelected] = useState(null);
  const [sidekick, setSidekick] = useState(false);
  const [showIntegrate, setShowIntegrate] = useState(false);
  const [showAutomate, setShowAutomate] = useState(false);
  const [extraCols, setExtraCols] = useState([]);
  const [showAddCol, setShowAddCol] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [hiddenCols, setHiddenCols] = useState(new Set());
  const [mainTableOpen, setMainTableOpen] = useState(false);
  const mainTableRef = useRef();
  const [updatePanel, setUpdatePanel] = useState(null); // task object
  const [hideOpen, setHideOpen] = useState(false);
  const hideRef = useRef();

  const personRef = useRef(); const filterRef = useRef();
  const sortRef = useRef(); const grpByRef = useRef();
  const moreRef = useRef();
  const [personOpen, setPersonOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [grpByOpen, setGrpByOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const addGroupTrigger = useRef({ trigger: () => {} });

  const closeAll = () => { setPersonOpen(false); setFilterOpen(false); setSortOpen(false); setGrpByOpen(false); setMoreOpen(false); setHideOpen(false); setMainTableOpen(false); };

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2800); };

  const load = useCallback(async () => {
    try { setLoading(true); const r = await axios.get(`${API}/tasks/board`); setGroups(r.data.map(g => ({ ...g, open: g.open !== false }))); }
    catch { showToast("Failed to load board", "error"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggleGroup = async (gid) => {
    const g = groups.find(x => (x._id || x.id) === gid); const nv = !g?.open;
    setGroups(p => p.map(x => (x._id || x.id) === gid ? { ...x, open: nv } : x));
    try { await axios.put(`${API}/groups/${gid}`, { open: nv }); } catch {}
  };

  const addTask = async (groupId, title) => {
    const tmp = { _id: "tmp_" + Date.now(), title, assignTo: "", status: "Not Started", priority: "🟡 Medium", date: "", checked: false, groupId, createdAt: new Date().toISOString() };
    setGroups(p => p.map(g => (g._id || g.id) === groupId ? { ...g, tasks: [...(g.tasks || []), tmp] } : g));
    try {
      const r = await axios.post(`${API}/tasks`, { title, assignTo: "Unassigned", groupId, status: "Not Started" });
      setGroups(p => p.map(g => (g._id || g.id) === groupId ? { ...g, tasks: (g.tasks || []).map(t => (t._id || t.id) === tmp._id ? r.data : t) } : g));
    } catch {
      setGroups(p => p.map(g => (g._id || g.id) === groupId ? { ...g, tasks: (g.tasks || []).filter(t => (t._id || t.id) !== tmp._id) } : g));
      showToast("Failed to add task", "error");
    }
  };

  const addNewTask = async () => { const first = groups[0]; if (!first) return; await addTask(first._id || first.id, "New task"); };

  const toggleCheck = async (id) => {
    const task = groups.flatMap(g => g.tasks || []).find(t => (t._id || t.id) === id); if (!task) return;
    const nv = !task.checked;
    setGroups(p => p.map(g => ({ ...g, tasks: (g.tasks || []).map(t => (t._id || t.id) === id ? { ...t, checked: nv } : t) })));
    if (selected && (selected._id || selected.id) === id) setSelected(p => ({ ...p, checked: nv }));
    try { await axios.patch(`${API}/tasks/${id}/toggle`); } catch {}
  };

  const updateField = async (id, field, value) => {
    if (!id || String(id).startsWith("tmp_")) return;
    setGroups(p => p.map(g => ({ ...g, tasks: (g.tasks || []).map(t => (t._id || t.id) === id ? { ...t, [field]: value } : t) })));
    if (selected && (selected._id || selected.id) === id) setSelected(p => ({ ...p, [field]: value }));
    try { await axios.put(`${API}/tasks/${id}`, { [field]: value }); }
    catch { showToast("Failed to save", "error"); }
  };

  const setStatus = (id, s) => updateField(id, "status", s);
  const dupTask = async (task) => addTask(task.groupId, task.title + " (copy)");

  const delTask = async (id) => {
    const snap = groups;
    setGroups(p => p.map(g => ({ ...g, tasks: (g.tasks || []).filter(t => (t._id || t.id) !== id) })));
    if (selected && (selected._id || selected.id) === id) setSelected(null);
    try { await axios.delete(`${API}/tasks/${id}`); }
    catch { setGroups(snap); showToast("Failed to delete", "error"); }
  };

  const addGroup = async (label) => {
    const color = GRP_COLORS[groups.length % GRP_COLORS.length];
    try { const r = await axios.post(`${API}/groups`, { label, color }); setGroups(p => [...p, { ...r.data, tasks: [], open: true }]); }
    catch { showToast("Failed to create group", "error"); }
  };

  const importTasks = async (tasks) => {
    const first = groups[0];
    if(!first){ showToast("Add a group first","error"); return; }
    const gid = first._id || first.id;
    for(const t of tasks){
      await addTask(gid, t.title||"Imported task");
    }
    showToast(`${tasks.length} tasks imported!`,"success");
  };

  const delGroup = async (id) => {
    const snap = groups;
    setGroups(p => p.filter(g => (g._id || g.id) !== id));
    try { await axios.delete(`${API}/groups/${id}`); showToast("Group deleted"); }
    catch { setGroups(snap); showToast("Failed", "error"); }
  };

  const toggleHideCol = (id) => setHiddenCols(p => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  /* ── extra column handlers ── */
  const addExtraCol = (ct) => {
    const id = "col_" + Date.now();
    setExtraCols(p => [...p, { id, type: ct.type, label: ct.label }]);
  };
  const renameExtraCol = (id, label) => setExtraCols(p => p.map(c => c.id === id ? { ...c, label } : c));
  const deleteExtraCol = (id) => setExtraCols(p => p.filter(c => c.id !== id));
  const updateExtraField = (taskId, colId, val) => {
    setGroups(p => p.map(g => ({ ...g, tasks: (g.tasks||[]).map(t =>
      (t._id||t.id) === taskId ? { ...t, extraData: { ...(t.extraData||{}), [colId]: val } } : t
    )})));
  };

  const toggleFilter = (type, val) => setFilters(p => { const n = { ...p, [type]: new Set(p[type]) }; n[type].has(val) ? n[type].delete(val) : n[type].add(val); return n; });
  const clearFilters = () => setFilters({ owner: new Set(), status: new Set() });

  const sortFn = tasks => {
    if (!sort) return tasks;
    return [...tasks].sort((a, b) => {
      if (sort === "name-asc") return (a.title || "").localeCompare(b.title || "");
      if (sort === "name-desc") return (b.title || "").localeCompare(a.title || "");
      if (sort === "date-asc") return (a.date || "").localeCompare(b.date || "");
      if (sort === "date-desc") return (b.date || "").localeCompare(a.date || "");
      if (sort === "status") return STATUS_LIST.indexOf(a.status) - STATUS_LIST.indexOf(b.status);
      return 0;
    });
  };

  const filteredGroups = groups.map(g => ({
    ...g, tasks: sortFn((g.tasks || []).filter(t => {
      if (filters.owner.size > 0 && !filters.owner.has(t.assignTo || "")) return false;
      if (filters.status.size > 0 && !filters.status.has(t.status)) return false;
      if (search && !t.title?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }))
  }));

  let displayGroups;
  if (groupBy === "default") {
    displayGroups = filteredGroups.map(g => ({ ...g, isVirtual: false }));
  } else {
    const all = filteredGroups.flatMap(g => g.tasks || []);
    if (groupBy === "status") {
      displayGroups = STATUS_LIST.map(s => ({ _id: "v" + s, label: s, color: STATUS_CFG[s].bg, open: true, isVirtual: true, tasks: all.filter(t => t.status === s) })).filter(g => g.tasks.length > 0);
    } else {
      const today = new Date(); today.setHours(0, 0, 0, 0); const nw = new Date(today); nw.setDate(nw.getDate() + 7);
      displayGroups = [
        { _id: "vov", label: "Overdue", color: "#e2445c", open: true, isVirtual: true, tasks: all.filter(t => { const d = new Date(t.date); return !isNaN(d) && d < today && t.status !== "Done"; }) },
        { _id: "vto", label: "Today", color: "#fdab3d", open: true, isVirtual: true, tasks: all.filter(t => { const d = new Date(t.date); d.setHours(0, 0, 0, 0); return !isNaN(d) && d.getTime() === today.getTime(); }) },
        { _id: "vwk", label: "This Week", color: P.accent, open: true, isVirtual: true, tasks: all.filter(t => { const d = new Date(t.date); return !isNaN(d) && d > today && d < nw; }) },
        { _id: "vla", label: "Later", color: P.mid, open: true, isVirtual: true, tasks: all.filter(t => { const d = new Date(t.date); return !isNaN(d) && d >= nw; }) },
        { _id: "vnd", label: "No date", color: "#c4b5fd", open: true, isVirtual: true, tasks: all.filter(t => !t.date || isNaN(new Date(t.date))) },
      ].filter(g => g.tasks.length > 0);
    }
  }

  const allTasks = groups.flatMap(g => g.tasks || []);
  const doneCnt = allTasks.filter(t => t.status === "Done").length;
  const hasFilters = filters.owner.size + filters.status.size > 0;

  return (
    <div style={{ minHeight: "100vh", background: P.light, fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ddIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}

        *{box-sizing:border-box}
        .trow:hover .openBtn{opacity:1!important}
        .col-hdr:hover .col-menu-btn{opacity:1!important}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:#d8b4fe;border-radius:3px}
        button,input,select,textarea{font-family:inherit}
        input[type=date]::-webkit-calendar-picker-indicator{opacity:.4;cursor:pointer;filter:invert(40%) sepia(80%) saturate(500%) hue-rotate(250deg)}
      `}</style>

      {/* TOP HEADER */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${P.border}`,
        padding: "8px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 1px 4px rgba(124,58,237,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: P.text, letterSpacing: -0.5 }}>Task</span>
          <span style={{ fontSize: 13, color: P.muted }}>▾</span>
          <div style={{ display: "flex", alignItems: "center", gap: 0, marginLeft: 8 }}>
            {/* Main table button — exact monday.com style */}
            <div ref={mainTableRef}
              onClick={() => setMainTableOpen(v => !v)}
              style={{ display:"flex", alignItems:"center", gap:0, cursor:"pointer",
                border:`1px solid ${mainTableOpen ? P.accent : P.border}`,
                borderRadius:8, overflow:"hidden", background: mainTableOpen ? P.light : "#fff",
                transition:"all .15s" }}
              onMouseEnter={e=>{ if(!mainTableOpen){ e.currentTarget.style.borderColor=P.accent; e.currentTarget.style.background=P.light; }}}
              onMouseLeave={e=>{ if(!mainTableOpen){ e.currentTarget.style.borderColor=P.border; e.currentTarget.style.background="#fff"; }}}
            >
              <div style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 12px",
                fontSize:13, fontWeight:700, color: mainTableOpen ? P.accent : P.text }}>
                <span style={{ fontSize:14 }}>⊞</span>
                <span>Main table</span>
              </div>
              <div style={{ padding:"6px 8px", borderLeft:`1px solid ${P.border}`,
                fontSize:11, color: mainTableOpen ? P.accent : P.muted, display:"flex",
                alignItems:"center" }}>▾</div>
            </div>
            {mainTableOpen && <MainTableDropdown anchor={mainTableRef} onClose={()=>setMainTableOpen(false)}/>}
            <div style={{ padding: "6px 8px", fontSize: 13, color: P.muted, cursor: "pointer", marginLeft:4 }}>···</div>
            <div style={{ padding: "6px 10px", fontSize: 18, color: P.muted, cursor: "pointer", fontWeight: 300 }}>+</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Sidekick */}
          <button onClick={() => { setSidekick(v => !v); setSelected(null); }}
            style={{ display: "flex", alignItems: "center", gap: 6,
              background: sidekick ? `linear-gradient(135deg,${P.dark},${P.mid})` : "transparent",
              border: `1.5px solid ${sidekick ? P.mid : P.border}`,
              borderRadius: 8, padding: "6px 13px", fontSize: 12, fontWeight: 700,
              color: sidekick ? "#fff" : P.mid, cursor: "pointer", transition: "all .15s" }}
            onMouseEnter={e => { if (!sidekick) { e.currentTarget.style.borderColor = P.accent; e.currentTarget.style.color = P.accent; e.currentTarget.style.background = P.light; } }}
            onMouseLeave={e => { if (!sidekick) { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.color = P.mid; e.currentTarget.style.background = "transparent"; } }}
          ><span style={{ fontSize: 14 }}>✨</span> Sidekick</button>

          {/* Integrate */}
          <button onClick={() => setShowIntegrate(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent",
              border: `1.5px solid ${P.border}`, borderRadius: 8, padding: "6px 13px",
              fontSize: 12, fontWeight: 600, color: P.mid, cursor: "pointer", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = P.accent; e.currentTarget.style.color = P.accent; e.currentTarget.style.background = P.light; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.color = P.mid; e.currentTarget.style.background = "transparent"; }}
          ><span style={{ fontSize: 14 }}>🔗</span> Integrate</button>

          {/* Automate */}
          <button onClick={() => setShowAutomate(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent",
              border: `1.5px solid ${P.border}`, borderRadius: 8, padding: "6px 13px",
              fontSize: 12, fontWeight: 600, color: P.mid, cursor: "pointer", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = P.accent; e.currentTarget.style.color = P.accent; e.currentTarget.style.background = P.light; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.color = P.mid; e.currentTarget.style.background = "transparent"; }}
          ><span style={{ fontSize: 14 }}>⚙️</span> Automate</button>

          {!loading && allTasks.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, paddingLeft: 6, borderLeft: `1px solid ${P.border}` }}>
              <div style={{ width: 60, height: 5, borderRadius: 3, background: P.border, overflow: "hidden" }}>
                <div style={{ width: `${Math.round(doneCnt / allTasks.length * 100)}%`, height: "100%",
                  background: `linear-gradient(90deg,${P.accent},#c084fc)`, borderRadius: 3, transition: "width .4s" }} />
              </div>
              <span style={{ fontSize: 11, color: P.muted, fontWeight: 600 }}>{doneCnt}/{allTasks.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={{ background: "#fff", borderBottom: `1.5px solid ${P.border}`,
        padding: "6px 18px", display: "flex", alignItems: "center", gap: 4,
        position: "sticky", top: 0, zIndex: 200, boxShadow: "0 2px 8px rgba(124,58,237,0.06)" }}>

        <NewTaskBtn onAddTask={addNewTask} onTriggerGroup={() => addGroupTrigger.current?.trigger()} showToast={showToast} onImport={()=>setShowImport(true)} groups={groups} onAddTaskToGroup={addTask} />
        <div style={{ width: 1, height: 22, background: P.border, margin: "0 4px", flexShrink: 0 }} />

        <div style={{ position: "relative", flexShrink: 0 }}>
          <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
            fontSize: 13, pointerEvents: "none", color: P.muted }}>🔍</span>
          <input placeholder="Search" value={search} onChange={e => setSearch(e.target.value)}
            style={{ border: `1.5px solid ${search ? P.accent : P.border}`, borderRadius: 8,
              padding: "5px 10px 5px 28px", fontSize: 13, color: P.text, outline: "none",
              width: search ? 160 : 100, background: search ? "#fff" : P.light,
              transition: "all .2s", fontFamily: "inherit" }}
            onFocus={e => { e.target.style.borderColor = P.accent; e.target.style.background = "#fff"; e.target.style.width = "160px"; }}
            onBlur={e => { if (!search) { e.target.style.borderColor = P.border; e.target.style.background = P.light; e.target.style.width = "100px"; } }}
          />
        </div>

        <TB ref={personRef} icon="👤" label="Person" active={filters.owner.size > 0}
          badge={filters.owner.size > 0 ? filters.owner.size : null}
          onClick={() => { closeAll(); setPersonOpen(v => !v); }} />
        {personOpen && <PersonFilterPanel anchor={personRef} onClose={()=>setPersonOpen(false)}
          groups={groups} filters={filters} onToggle={toggleFilter}
          onClear={()=>{ setFilters(p=>({...p,owner:new Set()})); }} />}

        {/* Filter with arrow — monday.com style */}
        <div style={{ display:"flex", alignItems:"stretch", flexShrink:0 }}>
          <button ref={filterRef}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 8px",
              background: (filters.status.size>0||filters.owner.size>0) ? "rgba(147,51,234,0.1)" : "transparent",
              border:`1.5px solid ${(filters.status.size>0||filters.owner.size>0) ? P.accent : "transparent"}`,
              borderRight:"none", borderRadius:"8px 0 0 8px", cursor:"pointer",
              fontSize:12, fontFamily:"inherit",
              color:(filters.status.size>0||filters.owner.size>0)?P.accent:P.mid,
              fontWeight:(filters.status.size>0||filters.owner.size>0)?700:500,
              transition:"all .15s" }}
            onClick={() => { closeAll(); setFilterOpen(v=>!v); }}
            onMouseEnter={e=>{if(!(filters.status.size>0||filters.owner.size>0)){e.currentTarget.style.background=P.light;e.currentTarget.style.borderColor=P.border;}}}
            onMouseLeave={e=>{if(!(filters.status.size>0||filters.owner.size>0)){e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";}}}
          >
            <span style={{fontSize:13}}>▽</span>
            <span>Filter</span>
            {(filters.status.size+filters.owner.size)>0 && (
              <span style={{fontSize:10,background:`${P.accent}20`,color:P.accent,borderRadius:8,padding:"1px 6px",fontWeight:700}}>
                {filters.status.size+filters.owner.size}
              </span>
            )}
          </button>
          <button
            style={{ padding:"5px 7px",
              background: (filters.status.size>0||filters.owner.size>0) ? "rgba(147,51,234,0.1)" : "transparent",
              border:`1.5px solid ${(filters.status.size>0||filters.owner.size>0) ? P.accent : "transparent"}`,
              borderLeft:`1px solid ${P.border}`, borderRadius:"0 8px 8px 0",
              cursor:"pointer", fontSize:10, color:P.mid, transition:"all .15s",
              display:"flex", alignItems:"center" }}
            onClick={() => { closeAll(); setFilterOpen(v=>!v); }}
            onMouseEnter={e=>{e.currentTarget.style.background=P.light;}}
            onMouseLeave={e=>{e.currentTarget.style.background=(filters.status.size>0||filters.owner.size>0)?"rgba(147,51,234,0.1)":"transparent";}}
          >▾</button>
        </div>
        {filterOpen && <FilterMenu anchor={filterRef} groups={groups} filters={filters} onToggle={toggleFilter} onClear={clearFilters} onClose={() => setFilterOpen(false)} />}

        <TB ref={sortRef} icon="↕" label="Sort" active={!!sort}
          onClick={() => { closeAll(); setSortOpen(v => !v); }} />
        {sortOpen && <SortMenu anchor={sortRef} sort={sort} onSort={setSort} onClose={() => setSortOpen(false)} extraCols={extraCols} />}

        <TB ref={hideRef} icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        } label="Hide" active={hiddenCols.size > 0} badge={hiddenCols.size > 0 ? hiddenCols.size : null}
          onClick={() => { closeAll(); setHideOpen(v => !v); }} />
        {hideOpen && (
          <HideMenu anchor={hideRef} onClose={() => setHideOpen(false)}
            extraCols={extraCols} hiddenCols={hiddenCols} onToggleHide={toggleHideCol} />
        )}

        <TB ref={grpByRef} icon="⊟" label="Group by" active={groupBy !== "default"}
          badge={groupBy !== "default" ? groupBy : null}
          onClick={() => { closeAll(); setGrpByOpen(v => !v); }} />
        {grpByOpen && <GrpByMenu anchor={grpByRef} groupBy={groupBy} onGroupBy={setGroupBy} onClose={() => setGrpByOpen(false)} />}

        <TB ref={moreRef} icon="···" onClick={() => { closeAll(); setMoreOpen(v => !v); }} />
        {moreOpen && (
          <DD anchor={moreRef} onClose={() => setMoreOpen(false)} w={230}>
            {/* monday.com ··· menu — Image 3 */}
            {[
              { icon:"📌", label:"Pin columns",          onClick:()=>{ showToast("Pin columns — coming soon","info"); setMoreOpen(false); } },
              { icon:"↕",  label:"Item height",          onClick:()=>{ showToast("Item height — coming soon","info"); setMoreOpen(false); } },
              { icon:"🎨", label:"Conditional coloring", onClick:()=>{ showToast("Conditional coloring — coming soon","info"); setMoreOpen(false); } },
              { icon:"✏️", label:"Default item values",  onClick:()=>{ showToast("Default item values — coming soon","info"); setMoreOpen(false); } },
            ].map(item=>(
              <div key={item.label} onClick={item.onClick}
                style={{ display:"flex", alignItems:"center", gap:11, padding:"10px 14px",
                  borderRadius:8, cursor:"pointer", transition:"background .1s" }}
                onMouseEnter={e=>e.currentTarget.style.background="#f5f6f8"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span style={{ fontSize:16, width:22, textAlign:"center" }}>{item.icon}</span>
                <span style={{ fontSize:13, color:"#323338" }}>{item.label}</span>
              </div>
            ))}
            <Sep/>
            <MI icon="📥" title="Import" sub="Excel, CSV or from files" onClick={() => { setShowImport(true); setMoreOpen(false); }} />
            <MI icon="📤" title="Export" sub="Download as CSV" onClick={() => { showToast("Export — coming soon!", "info"); setMoreOpen(false); }} />
          </DD>
        )}
      </div>

      {/* BOARD + PANELS */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ flex: 1, overflow: "auto", padding: "16px 18px" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, gap: 16 }}>
              <div style={{ width: 34, height: 34, border: `3px solid ${P.border}`, borderTop: `3px solid ${P.accent}`, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
              <div style={{ fontSize: 13, color: P.muted, fontWeight: 500 }}>Loading board...</div>
            </div>
          ) : (
            <>
              {displayGroups.length === 0 && (
                <div style={{ textAlign: "center", padding: 60 }}>
                  <div style={{ fontSize: 44, marginBottom: 10 }}>📋</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: P.text, marginBottom: 5 }}>No tasks found</div>
                  <div style={{ fontSize: 13, color: P.muted }}>Clear filters or add a new task</div>
                </div>
              )}
              {displayGroups.map(g => (
                <GroupBlock key={g._id || g.id} group={g} isVirtual={!!g.isVirtual}
                  onToggle={toggleGroup} onCheck={toggleCheck}
                  onField={updateField} onStatus={setStatus}
                  onAddTask={addTask} onDup={dupTask} onDel={delTask}
                  onOpen={t => {
                    setUpdatePanel(p => (p?._id||p?.id)===(t._id||t.id) ? null : t);
                    setSelected(null); setSidekick(false);
                  }}
                  selectedId={selected?._id || selected?.id}
                  onDelGroup={delGroup} employees={employees}
                  showToast={showToast}
                  extraCols={extraCols}
                  onExtraField={updateExtraField}
                  onAddCol={() => setShowAddCol(true)}
                  onRenameCol={renameExtraCol}
                  onDeleteCol={deleteExtraCol}
                  hiddenCols={hiddenCols}
                />
              ))}
              {groupBy === "default" && <AddGroupRow onAdd={addGroup} triggerRef={addGroupTrigger} />}
            </>
          )}
        </div>

        {selected && !sidekick && !updatePanel && (
          <DetailPanel task={selected} onClose={() => setSelected(null)} onField={updateField} />
        )}

        {sidekick && !updatePanel && (
          <SidekickPanel onClose={() => setSidekick(false)} groups={groups} />
        )}

        {updatePanel && (
          <TaskUpdatePanel task={updatePanel} onClose={() => setUpdatePanel(null)} onField={updateField} />
        )}
      </div>

      {/* MODALS */}
      {showAddCol && <AddColumnModal onAdd={addExtraCol} onClose={() => setShowAddCol(false)} />}
      {showImport && <ImportModal onClose={()=>setShowImport(false)} onImportTasks={importTasks}/>}
      {showIntegrate && <IntegrateModal onClose={() => setShowIntegrate(false)} />}
      {showAutomate && <AutomateModal onClose={() => setShowAutomate(false)} />}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
