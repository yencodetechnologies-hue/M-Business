import { useState, useEffect, useRef, useCallback } from "react";

// ─── UTILS ────────────────────────────────────────────────────────────────────
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;
const pid = () => `PROP-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`;
const LS  = "canva_proposals_v1";
const load = () => { try { const d=localStorage.getItem(LS); return d?JSON.parse(d):[]; } catch{return[];} };
const save = d => { try{localStorage.setItem(LS,JSON.stringify(d));}catch{} };

// ─── THEMES ───────────────────────────────────────────────────────────────────
const THEMES = [
  { name:"Violet",  p:"#7c3aed", g:"linear-gradient(135deg,#7c3aed,#a855f7)", l:"#ede9fe", t:"#4c1d95" },
  { name:"Cobalt",  p:"#1d4ed8", g:"linear-gradient(135deg,#1e40af,#3b82f6)", l:"#dbeafe", t:"#1e3a8a" },
  { name:"Emerald", p:"#059669", g:"linear-gradient(135deg,#065f46,#10b981)", l:"#d1fae5", t:"#064e3b" },
  { name:"Rose",    p:"#e11d48", g:"linear-gradient(135deg,#9f1239,#f43f5e)", l:"#ffe4e6", t:"#881337" },
  { name:"Amber",   p:"#d97706", g:"linear-gradient(135deg,#92400e,#fbbf24)", l:"#fef3c7", t:"#78350f" },
  { name:"Slate",   p:"#334155", g:"linear-gradient(135deg,#0f172a,#475569)", l:"#f1f5f9", t:"#0f172a" },
  { name:"Teal",    p:"#0d9488", g:"linear-gradient(135deg,#134e4a,#2dd4bf)", l:"#ccfbf1", t:"#134e4a" },
  { name:"Fuchsia", p:"#a21caf", g:"linear-gradient(135deg,#701a75,#e879f9)", l:"#fae8ff", t:"#4a044e" },
];

// ─── COVERS ───────────────────────────────────────────────────────────────────
const COVERS = [
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=900&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=900&q=80",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=80",
  "https://images.unsplash.com/photo-1551434678-e076c223a692?w=900&q=80",
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=900&q=80",
  "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=900&q=80",
];

// ─── SLIDE FACTORY ────────────────────────────────────────────────────────────
const SLIDE_TYPES = [
  { id:"cover",       label:"Cover Page",    icon:"🎯", desc:"Title & hero image" },
  { id:"overview",    label:"Overview",      icon:"📋", desc:"Project background" },
  { id:"objectives",  label:"Objectives",    icon:"🏆", desc:"Goals & outcomes" },
  { id:"timeline",    label:"Timeline",      icon:"📅", desc:"Project phases" },
  { id:"budget",      label:"Budget",        icon:"💰", desc:"Cost breakdown" },
  { id:"team",        label:"Team",          icon:"👥", desc:"Members & roles" },
  { id:"process",     label:"Our Process",   icon:"⚙️", desc:"How we work" },
  { id:"closing",     label:"Next Steps",    icon:"🚀", desc:"Call to action" },
];

function makeSlide(type, themeName="Violet") {
  const b = { id:uid(), type, theme:themeName };
  switch(type) {
    case "cover":      return {...b, title:"Project Proposal", subtitle:"Prepared exclusively for your review · "+new Date().getFullYear(), coverImage:COVERS[0]};
    case "overview":   return {...b, heading:"Project Overview", body:"We propose a comprehensive solution designed to address your business challenges. Our approach combines deep industry expertise with cutting-edge technology to deliver measurable, lasting results."};
    case "objectives": return {...b, heading:"Key Objectives", items:["Deliver scalable, future-proof architecture that grows with your business","Reduce operational overhead by 40% through smart automation","Ensure seamless user experience across all devices and platforms"]};
    case "timeline":   return {...b, heading:"Project Timeline", phases:[{label:"Discovery & Strategy",dur:"2 Weeks"},{label:"Design & Prototyping",dur:"3 Weeks"},{label:"Development & Testing",dur:"6 Weeks"},{label:"Launch & Handover",dur:"1 Week"}]};
    case "budget":     return {...b, heading:"Budget Estimate", rows:[{item:"UI/UX Design",cost:"₹80,000"},{item:"Frontend Development",cost:"₹1,50,000"},{item:"Backend & APIs",cost:"₹1,20,000"},{item:"QA & Testing",cost:"₹40,000"},{item:"Deployment",cost:"₹30,000"}], total:"₹4,20,000"};
    case "team":       return {...b, heading:"Meet Our Team", members:[{name:"Arjun Sharma",role:"Project Lead",avatar:"AS"},{name:"Priya Nair",role:"UI/UX Designer",avatar:"PN"},{name:"Karthik Raj",role:"Full Stack Dev",avatar:"KR"},{name:"Meena Iyer",role:"QA Engineer",avatar:"MI"}]};
    case "process":    return {...b, heading:"Our Process", steps:[{icon:"🔍",label:"Research",desc:"Deep dive into your needs"},{icon:"✏️",label:"Design",desc:"Wireframes & prototypes"},{icon:"⚡",label:"Build",desc:"Agile development"},{icon:"🚀",label:"Launch",desc:"Deploy & support"}]};
    case "closing":    return {...b, heading:"Ready to Begin?", body:"We're excited to bring your vision to life. Our team is prepared to start immediately and deliver results that exceed your expectations.", cta:"Schedule a Call →"};
    default:           return {...b, heading:"Slide", body:""};
  }
}

function makeDemo() {
  const theme = "Violet";
  return {
    id:pid(), title:"E-Commerce Platform Redesign", client:"RetailMax Pvt Ltd",
    theme, status:"draft",
    created:new Date().toISOString(), updated:new Date().toISOString(),
    rejectNote:"",
    slides: SLIDE_TYPES.map(t => makeSlide(t.id, theme)),
  };
}

// ─── STATUS ───────────────────────────────────────────────────────────────────
const STATUS = {
  draft:    { label:"Draft",            icon:"✏️",  bg:"#f8fafc", fg:"#475569", br:"#cbd5e1" },
  pending:  { label:"Pending Approval", icon:"⏳",  bg:"#fffbeb", fg:"#92400e", br:"#fcd34d" },
  approved: { label:"Approved",         icon:"✅",  bg:"#f0fdf4", fg:"#14532d", br:"#86efac" },
  rejected: { label:"Rejected",         icon:"❌",  bg:"#fff1f2", fg:"#9f1239", br:"#fda4af" },
};

function Badge({status}) {
  const s = STATUS[status]||STATUS.draft;
  return <span style={{background:s.bg,color:s.fg,border:`1.5px solid ${s.br}`,borderRadius:20,padding:"3px 12px",fontSize:11,fontWeight:700,display:"inline-flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>{s.icon} {s.label}</span>;
}

// ─── CONFETTI ─────────────────────────────────────────────────────────────────
function Confetti({active}) {
  const ref = useRef();
  useEffect(()=>{
    if(!active) return;
    const c=ref.current; if(!c) return;
    c.width=window.innerWidth; c.height=window.innerHeight;
    const ctx=c.getContext("2d");
    const colors=["#7c3aed","#a855f7","#22c55e","#f59e0b","#3b82f6","#ec4899","#14b8a6","#f97316"];
    const parts=Array.from({length:150},()=>({x:Math.random()*c.width,y:-20,vx:(Math.random()-.5)*5,vy:Math.random()*4+2,col:colors[Math.floor(Math.random()*colors.length)],w:Math.random()*10+4,h:Math.random()*6+3,rot:Math.random()*360,rv:(Math.random()-.5)*8}));
    let fr; const draw=()=>{ctx.clearRect(0,0,c.width,c.height);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.rot+=p.rv;if(p.y>c.height){p.y=-10;p.x=Math.random()*c.width;}ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.fillStyle=p.col;ctx.beginPath();ctx.ellipse(0,0,p.w/2,p.h/2,0,0,Math.PI*2);ctx.fill();ctx.restore();});fr=requestAnimationFrame(draw);};
    draw(); const t=setTimeout(()=>cancelAnimationFrame(fr),4000);
    return()=>{cancelAnimationFrame(fr);clearTimeout(t);};
  },[active]);
  if(!active) return null;
  return <canvas ref={ref} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:99999}} />;
}

// ─── SLIDE RENDERER ───────────────────────────────────────────────────────────
function Slide({slide, theme:tn, editing, onChange, preview=false}) {
  const t = THEMES.find(x=>x.name===tn)||THEMES[0];
  const upd = patch => onChange&&onChange({...slide,...patch});
  const fontSize = preview ? 0.22 : 1;

  const W = { width:900, minHeight:506, background:"#ffffff", fontFamily:"'Outfit',sans-serif", position:"relative", overflow:"hidden", flexShrink:0 };
  const accent = { width:56,height:6,background:t.g,borderRadius:3,marginBottom:20 };
  const h1 = { fontSize:36,fontWeight:800,color:"#0f172a",marginBottom:24,letterSpacing:-0.5,lineHeight:1.1 };

  const Txt = ({val,onCh,big,center,white,weight,size}) => {
    const s={background:"transparent",border:editing?"1.5px dashed rgba(124,58,237,0.3)":"none",borderRadius:6,padding:editing?"4px 8px":"0",outline:"none",fontSize:size||"inherit",color:white?"rgba(255,255,255,0.9)":"inherit",fontWeight:weight||"inherit",fontFamily:"inherit",lineHeight:"inherit",width:"100%",boxSizing:"border-box",textAlign:center?"center":"left",resize:"vertical"};
    if(!editing) return <span style={{display:"block",whiteSpace:"pre-wrap"}}>{val}</span>;
    return big ? <textarea value={val} onChange={e=>onCh(e.target.value)} rows={4} style={s}/> : <input value={val} onChange={e=>onCh(e.target.value)} style={s}/>;
  };

  // COVER
  if(slide.type==="cover") return (
    <div style={{...W,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <img src={slide.coverImage} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
      <div style={{position:"absolute",inset:0,background:`linear-gradient(150deg,${t.p}dd 0%,rgba(0,0,0,0.85) 60%,rgba(0,0,0,0.5) 100%)`}}/>
      <div style={{position:"absolute",top:0,right:0,width:200,height:200,background:"rgba(255,255,255,0.05)",borderRadius:"0 0 0 200px"}}/>
      <div style={{position:"relative",padding:"48px 56px"}}>
        {editing && (
          <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
            {COVERS.map((c,i)=>(
              <img key={i} src={c} alt="" onClick={()=>upd({coverImage:c})}
                style={{width:56,height:36,objectFit:"cover",borderRadius:6,cursor:"pointer",border:slide.coverImage===c?"3px solid #fff":"2px solid rgba(255,255,255,0.2)",transition:"all 0.15s",opacity:slide.coverImage===c?1:0.5}}/>
            ))}
          </div>
        )}
        <div style={{fontSize:48,fontWeight:900,color:"#fff",lineHeight:1.05,marginBottom:16}}>
          <Txt val={slide.title} onCh={v=>upd({title:v})} white weight={900} size={48}/>
        </div>
        <div style={{fontSize:16,color:"rgba(255,255,255,0.7)",fontWeight:400}}>
          <Txt val={slide.subtitle} onCh={v=>upd({subtitle:v})} white size={16}/>
        </div>
        <div style={{marginTop:28,display:"flex",gap:4,alignItems:"center"}}>
          <div style={{width:40,height:3,background:"#fff",borderRadius:2,opacity:0.6}}/>
          <div style={{width:8,height:3,background:t.p,borderRadius:2}}/>
        </div>
      </div>
    </div>
  );

  // OVERVIEW / CLOSING
  if(slide.type==="overview"||slide.type==="closing") return (
    <div style={{...W,padding:56,display:"flex",flexDirection:"column",justifyContent:"center"}}>
      <div style={{position:"absolute",right:0,top:0,width:280,height:"100%",background:`linear-gradient(to left,${t.p}0a,transparent)`,borderLeft:`3px solid ${t.p}18`}}/>
      <div style={{position:"absolute",bottom:0,left:0,width:"100%",height:4,background:t.g}}/>
      <div style={accent}/>
      <div style={h1}><Txt val={slide.heading} onCh={v=>upd({heading:v})}/></div>
      <div style={{fontSize:15,color:"#4b5563",lineHeight:1.9,maxWidth:620}}>
        <Txt val={slide.body} onCh={v=>upd({body:v})} big/>
      </div>
      {slide.type==="closing" && (
        <div style={{marginTop:40}}>
          <div style={{display:"inline-block",background:t.g,color:"#fff",borderRadius:14,padding:"15px 36px",fontSize:16,fontWeight:700,cursor:"pointer",boxShadow:`0 8px 24px ${t.p}40`}}>
            <Txt val={slide.cta} onCh={v=>upd({cta:v})} white weight={700} size={16}/>
          </div>
        </div>
      )}
    </div>
  );

  // OBJECTIVES
  if(slide.type==="objectives") return (
    <div style={{...W,padding:56}}>
      <div style={{position:"absolute",top:0,right:0,width:140,height:"100%",background:t.l,opacity:0.5}}/>
      <div style={accent}/><div style={h1}><Txt val={slide.heading} onCh={v=>upd({heading:v})}/></div>
      <div style={{display:"flex",flexDirection:"column",gap:14,position:"relative"}}>
        {slide.items.map((item,i)=>(
          <div key={i} style={{display:"flex",gap:18,alignItems:"flex-start",padding:"16px 22px",background:t.l,borderRadius:14,border:`1px solid ${t.p}20`,position:"relative"}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:t.g,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:15,flexShrink:0}}>{i+1}</div>
            <div style={{flex:1,fontSize:14,color:"#1e293b",fontWeight:600,paddingTop:6}}>
              <Txt val={item} onCh={v=>{const a=[...slide.items];a[i]=v;upd({items:a});}}/>
            </div>
            {editing && slide.items.length>1 && <button onClick={()=>upd({items:slide.items.filter((_,j)=>j!==i)})} style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:16,position:"absolute",top:8,right:10}}>✕</button>}
          </div>
        ))}
        {editing && <button onClick={()=>upd({items:[...slide.items,"New objective here"]})} style={{background:"none",border:`1.5px dashed ${t.p}50`,borderRadius:12,padding:12,fontSize:13,color:t.p,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>+ Add Objective</button>}
      </div>
    </div>
  );

  // TIMELINE
  if(slide.type==="timeline") return (
    <div style={{...W,padding:56}}>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:4,background:t.g}}/>
      <div style={accent}/><div style={h1}><Txt val={slide.heading} onCh={v=>upd({heading:v})}/></div>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${slide.phases.length},1fr)`,gap:0,position:"relative"}}>
        <div style={{position:"absolute",top:20,left:"12.5%",right:"12.5%",height:3,background:t.g,borderRadius:2,zIndex:0}}/>
        {slide.phases.map((ph,i)=>(
          <div key={i} style={{textAlign:"center",position:"relative",zIndex:1}}>
            <div style={{width:42,height:42,borderRadius:"50%",background:i<2?t.g:"#fff",border:`3px solid ${t.p}`,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:i<2?"#fff":t.p,boxShadow:`0 0 0 4px ${t.l}`}}>{i+1}</div>
            <div style={{background:t.l,borderRadius:12,padding:"12px 10px",border:`1px solid ${t.p}20`}}>
              <div style={{fontSize:12,fontWeight:800,color:t.t,marginBottom:6}}>
                <Txt val={ph.label} onCh={v=>{const a=[...slide.phases];a[i]={...a[i],label:v};upd({phases:a});}} size={12}/>
              </div>
              <div style={{display:"inline-block",background:t.g,color:"#fff",borderRadius:20,padding:"3px 12px",fontSize:11,fontWeight:700}}>
                <Txt val={ph.dur} onCh={v=>{const a=[...slide.phases];a[i]={...a[i],dur:v};upd({phases:a});}} white size={11}/>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // BUDGET
  if(slide.type==="budget") return (
    <div style={{...W,padding:56}}>
      <div style={accent}/><div style={h1}><Txt val={slide.heading} onCh={v=>upd({heading:v})}/></div>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:t.g}}>
          <th style={{padding:"13px 22px",textAlign:"left",color:"#fff",fontSize:13,fontWeight:700,borderRadius:"10px 0 0 10px"}}>Item</th>
          <th style={{padding:"13px 22px",textAlign:"right",color:"#fff",fontSize:13,fontWeight:700,borderRadius:"0 10px 10px 0"}}>Cost</th>
        </tr></thead>
        <tbody>
          {slide.rows.map((r,i)=>(
            <tr key={i} style={{borderBottom:`1px solid ${t.p}12`,background:i%2?"#fafafa":"#fff"}}>
              <td style={{padding:"12px 22px",fontSize:14,color:"#374151"}}><Txt val={r.item} onCh={v=>{const a=[...slide.rows];a[i]={...a[i],item:v};upd({rows:a});}}/></td>
              <td style={{padding:"12px 22px",textAlign:"right",fontSize:14,fontWeight:700,color:"#1e293b"}}><Txt val={r.cost} onCh={v=>{const a=[...slide.rows];a[i]={...a[i],cost:v};upd({rows:a});}}/></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:16,padding:"16px 22px",background:t.g,borderRadius:12}}>
        <span style={{color:"#fff",fontWeight:900,fontSize:20}}>Total: <Txt val={slide.total} onCh={v=>upd({total:v})} white weight={900} size={20}/></span>
      </div>
    </div>
  );

  // TEAM
  if(slide.type==="team") return (
    <div style={{...W,padding:56}}>
      <div style={accent}/><div style={h1}><Txt val={slide.heading} onCh={v=>upd({heading:v})}/></div>
      <div style={{display:"flex",gap:18,flexWrap:"wrap"}}>
        {slide.members.map((m,i)=>(
          <div key={i} style={{flex:"1 1 170px",padding:"24px 18px",background:t.l,borderRadius:16,border:`1px solid ${t.p}22`,textAlign:"center",position:"relative"}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:t.g,margin:"0 auto 14px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#fff",fontWeight:900}}>{m.avatar||m.name[0]}</div>
            <div style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:4}}><Txt val={m.name} onCh={v=>{const a=[...slide.members];a[i]={...a[i],name:v,avatar:(v[0]||"?").toUpperCase()+(v.split(" ")[1]?.[0]||"")};upd({members:a});}}/></div>
            <div style={{fontSize:12,color:t.p,fontWeight:600}}><Txt val={m.role} onCh={v=>{const a=[...slide.members];a[i]={...a[i],role:v};upd({members:a});}}/></div>
            {editing && <button onClick={()=>upd({members:slide.members.filter((_,j)=>j!==i)})} style={{position:"absolute",top:8,right:8,background:"rgba(239,68,68,0.1)",border:"none",color:"#ef4444",borderRadius:6,width:22,height:22,cursor:"pointer",fontSize:11}}>✕</button>}
          </div>
        ))}
        {editing && <div onClick={()=>upd({members:[...slide.members,{name:"New Member",role:"Role",avatar:"NM"}]})} style={{flex:"1 1 170px",padding:"24px 18px",borderRadius:16,border:`2px dashed ${t.p}40`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",color:t.p,gap:8}}>
          <span style={{fontSize:30}}>+</span><span style={{fontSize:12,fontWeight:700}}>Add Member</span>
        </div>}
      </div>
    </div>
  );

  // PROCESS
  if(slide.type==="process") return (
    <div style={{...W,padding:56}}>
      <div style={accent}/><div style={h1}><Txt val={slide.heading} onCh={v=>upd({heading:v})}/></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:20}}>
        {slide.steps.map((s,i)=>(
          <div key={i} style={{padding:"28px 18px",background:t.l,borderRadius:16,border:`1px solid ${t.p}20`,textAlign:"center",position:"relative"}}>
            {i<slide.steps.length-1 && <div style={{position:"absolute",right:-12,top:"50%",transform:"translateY(-50%)",color:t.p,fontSize:18,zIndex:2}}>›</div>}
            <div style={{fontSize:32,marginBottom:12}}>{s.icon}</div>
            <div style={{fontSize:14,fontWeight:800,color:t.t,marginBottom:6}}><Txt val={s.label} onCh={v=>{const a=[...slide.steps];a[i]={...a[i],label:v};upd({steps:a});}}/></div>
            <div style={{fontSize:12,color:"#64748b"}}><Txt val={s.desc} onCh={v=>{const a=[...slide.steps];a[i]={...a[i],desc:v};upd({steps:a});}}/></div>
          </div>
        ))}
      </div>
    </div>
  );

  return <div style={{...W,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:24,color:"#94a3b8"}}>{slide.type}</span></div>;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function CanvaProposal({clients=[]}) {
  const [view, setView]           = useState("list");    // list | editor
  const [proposals, setProposals] = useState([]);
  const [doc, setDoc]             = useState(null);
  const [page, setPage]           = useState(0);         // active slide index
  const [leftPanel, setLeftPanel] = useState("pages");   // pages | add | elements | themes
  const [zoom, setZoom]           = useState(55);        // %
  const [confetti, setConfetti]   = useState(false);
  const [toast, setToast]         = useState(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [search, setSearch]       = useState("");
  const canvasRef                 = useRef();

  useEffect(()=>{
    const data = load();
    if(data.length>0) setProposals(data);
    else { const d=[makeDemo()]; setProposals(d); save(d); }
  },[]);

  const flash = (msg,type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3200); };

  const persist = useCallback((d)=>{
    const updated = proposals.map(p=>p.id===d.id?d:p);
    const final = proposals.find(p=>p.id===d.id) ? updated : [d,...proposals];
    setProposals(final); save(final); return d;
  },[proposals]);

  const openDoc = (d) => { setDoc({...d}); setPage(0); setView("editor"); };
  const createNew = () => {
    const themes = THEMES.map(t=>t.name);
    const theme  = themes[Math.floor(Math.random()*themes.length)];
    const d = { id:pid(), title:"New Project Proposal", client:"", theme, status:"draft", created:new Date().toISOString(), updated:new Date().toISOString(), rejectNote:"", slides:SLIDE_TYPES.map(t=>makeSlide(t.id,theme)) };
    setDoc(d); setPage(0); setView("editor");
  };

  const saveDoc = (d=doc) => { const nd={...d,updated:new Date().toISOString()}; persist(nd); setDoc(nd); flash("💾 Saved!"); };
  const setStatus = (status,extra={}) => {
    const nd={...doc,status,...extra,updated:new Date().toISOString()};
    persist(nd); setDoc(nd);
    if(status==="approved"){ setConfetti(true); flash("🎉 Proposal Approved! Confetti time!"); setTimeout(()=>setConfetti(false),4000); }
    else if(status==="pending")  flash("📤 Sent for approval!");
    else if(status==="rejected") flash("❌ Proposal Rejected","err");
  };

  const updateSlide = (s) => {
    const slides = doc.slides.map((sl,i)=>i===page?s:sl);
    setDoc({...doc,slides});
  };
  const addSlide = (type) => {
    const s = makeSlide(type, doc.theme);
    const slides = [...doc.slides,s];
    setDoc({...doc,slides}); setPage(slides.length-1); setLeftPanel("pages");
  };
  const delSlide = (i) => {
    if(doc.slides.length<=1) return;
    const slides = doc.slides.filter((_,j)=>j!==i);
    setDoc({...doc,slides}); setPage(Math.min(page,slides.length-1));
  };
  const moveSlide = (from,to) => {
    if(to<0||to>=doc.slides.length) return;
    const slides = [...doc.slides];
    const [s] = slides.splice(from,1); slides.splice(to,0,s);
    setDoc({...doc,slides}); setPage(to);
  };
  const changeTheme = (name) => {
    const slides = doc.slides.map(s=>({...s,theme:name}));
    setDoc({...doc,theme:name,slides});
  };
  const deleteProposal = (id,e) => {
    e.stopPropagation();
    if(!window.confirm("Delete this proposal?")) return;
    const d = proposals.filter(p=>p.id!==id);
    setProposals(d); save(d);
  };
  const duplicateSlide = (i) => {
    const s = {...doc.slides[i], id:uid()};
    const slides = [...doc.slides]; slides.splice(i+1,0,s);
    setDoc({...doc,slides}); setPage(i+1);
  };

  const canEdit = doc && (doc.status==="draft"||doc.status==="rejected");
  const th = doc ? (THEMES.find(x=>x.name===doc.theme)||THEMES[0]) : THEMES[0];
  const zf = zoom/100;

  // ══ LIST VIEW ══════════════════════════════════════════════════════════════
  if(view==="list") return (
    <div style={{fontFamily:"'Outfit',sans-serif",minHeight:"100%"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');.pc{transition:all .25s ease;cursor:pointer;}.pc:hover{transform:translateY(-6px);box-shadow:0 20px 50px rgba(0,0,0,0.13)!important;}.pc:hover .pci{transform:scale(1.06);}.pci{transition:transform .4s ease;}.hb:hover{opacity:.85;transform:translateY(-1px);}`}</style>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28,flexWrap:"wrap",gap:14}}>
<div>
          <p style={{margin:"5px 0 0",fontSize:13,color:"#64748b"}}>{proposals.length} proposal{proposals.length!==1?"s":""} · Canva-style editor</p>
        </div>
        <button className="hb" onClick={createNew} style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff",border:"none",borderRadius:14,padding:"12px 24px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:8,boxShadow:"0 6px 20px rgba(124,58,237,0.35)",transition:"all .2s"}}>
          ✨ New Proposal
        </button>
      </div>

      {proposals.length===0
        ? <div style={{textAlign:"center",padding:"80px 20px",background:"#fff",borderRadius:22,border:"2px dashed #e2e8f0"}}>
            <div style={{fontSize:60,marginBottom:16}}>✨</div>
            <div style={{fontSize:20,fontWeight:800,color:"#0f172a",marginBottom:8}}>No proposals yet</div>
            <button onClick={createNew} style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff",border:"none",borderRadius:12,padding:"12px 28px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:16}}>+ Create First Proposal</button>
          </div>
        : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:22}}>
            {proposals.map(p=>{
              const cover=p.slides?.find(s=>s.type==="cover");
              const t2=THEMES.find(x=>x.name===p.theme)||THEMES[0];
              return (
                <div key={p.id} className="pc" onClick={()=>openDoc(p)} style={{background:"#fff",borderRadius:20,border:"1px solid #e2e8f0",overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
                  <div style={{height:180,overflow:"hidden",position:"relative"}}>
                    {cover?.coverImage ? <img src={cover.coverImage} className="pci" alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <div style={{width:"100%",height:"100%",background:t2.g}}/>}
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.72),rgba(0,0,0,0.08))"}}/>
                    <div style={{position:"absolute",bottom:14,left:18,right:14}}>
                      <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",fontWeight:700,letterSpacing:1,marginBottom:3}}>{p.id}</div>
                      <div style={{fontSize:17,fontWeight:800,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title}</div>
                    </div>
                    <div style={{position:"absolute",top:10,right:10}}><Badge status={p.status}/></div>
                  </div>
                  <div style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:12,color:"#64748b"}}><span style={{fontWeight:700,color:"#0f172a"}}>{p.client||"No client"}</span><span style={{margin:"0 6px",color:"#e2e8f0"}}>·</span><span>{p.slides?.length||0} slides</span></div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <span style={{fontSize:11,color:"#94a3b8"}}>{new Date(p.updated).toLocaleDateString("en-IN")}</span>
                      <button onClick={e=>deleteProposal(p.id,e)} style={{background:"rgba(239,68,68,0.08)",border:"none",color:"#ef4444",borderRadius:6,width:26,height:26,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>🗑</button>
                    </div>
                  </div>
                  {p.status==="rejected"&&p.rejectNote&&<div style={{padding:"8px 18px 12px",background:"#fff1f2",borderTop:"1px solid #fecdd3"}}><span style={{fontSize:11,color:"#9f1239",fontWeight:600}}>❌ {p.rejectNote}</span></div>}
                </div>
              );
            })}
          </div>
      }
    </div>
  );

  // ══ EDITOR - full Canva layout ═════════════════════════════════════════════
  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",flexDirection:"column",fontFamily:"'Outfit',sans-serif",background:"#f0f0f0",overflow:"hidden"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px;}.pgthumb{transition:all .15s;cursor:pointer;}.pgthumb:hover{border-color:#7c3aed!important;}.pgthumb.sel{border-color:#7c3aed!important;box-shadow:0 0 0 2px rgba(124,58,237,0.2);}.sib:hover{background:#f0e9ff!important;color:#7c3aed!important;}.topbtn:hover{background:#f1f5f9!important;}.icobtn:hover{background:#e0d9f7!important;}`}</style>

      <Confetti active={confetti}/>

      {/* TOAST */}
      {toast && <div style={{position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",background:toast.type==="err"?"#fff1f2":"#f0fdf4",color:toast.type==="err"?"#9f1239":"#14532d",border:`1px solid ${toast.type==="err"?"#fda4af":"#86efac"}`,padding:"10px 24px",borderRadius:12,fontSize:14,fontWeight:700,zIndex:100000,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",whiteSpace:"nowrap"}}>{toast.msg}</div>}

      {/* REJECT MODAL */}
      {rejectModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:100001,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"#fff",borderRadius:20,padding:36,width:440,boxShadow:"0 24px 64px rgba(0,0,0,0.25)"}}>
            <div style={{fontSize:22,fontWeight:900,color:"#0f172a",marginBottom:6}}>❌ Reject Proposal</div>
            <div style={{fontSize:13,color:"#64748b",marginBottom:20}}>Give feedback so the author can revise and resubmit.</div>
            <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="e.g. Please revise the budget section and update timeline..."
              style={{width:"100%",height:100,borderRadius:12,border:"1.5px solid #e2e8f0",padding:"12px 16px",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",resize:"none",color:"#0f172a"}}/>
            <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
              <button onClick={()=>{setRejectModal(false);setRejectReason("");}} style={{background:"#f1f5f9",border:"none",borderRadius:10,padding:"10px 22px",fontSize:14,fontWeight:600,cursor:"pointer",color:"#475569",fontFamily:"inherit"}}>Cancel</button>
              <button onClick={()=>{setStatus("rejected",{rejectNote:rejectReason||"Please review and resubmit."});setRejectModal(false);setRejectReason("");}} style={{background:"linear-gradient(135deg,#9f1239,#ef4444)",color:"#fff",border:"none",borderRadius:10,padding:"10px 22px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* ╔══ TOP BAR (Canva style) ══╗ */}
      <div style={{height:58,background:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",borderBottom:"1px solid #e5e7eb",flexShrink:0,gap:12,zIndex:50}}>
        
        {/* LEFT: logo + File/Resize/Editing */}
        <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
          <button onClick={()=>{saveDoc();setView("list");}} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,padding:"6px 10px",borderRadius:8,transition:"background .15s"}} title="Home" className="topbtn">🏠</button>
          <div style={{width:1,height:24,background:"#e5e7eb",margin:"0 4px"}}/>
          {["File","Resize"].map(b=>(
            <button key={b} className="topbtn" style={{background:"none",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,color:"#374151",padding:"6px 12px",borderRadius:8,transition:"background .15s"}}>{b}</button>
          ))}
          <button className="topbtn" style={{background:"none",border:"1px solid #e5e7eb",cursor:"pointer",fontSize:13,fontWeight:700,color:"#374151",padding:"6px 14px",borderRadius:8,display:"flex",alignItems:"center",gap:6,transition:"background .15s"}}>
            ✏️ Editing <span style={{fontSize:11,color:"#94a3b8"}}>▾</span>
          </button>
          <div style={{display:"flex",gap:2,marginLeft:4}}>
            {["↩","↪"].map((a,i)=><button key={i} className="topbtn" style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#6b7280",padding:"6px 8px",borderRadius:8,transition:"background .15s"}}>{a}</button>)}
          </div>
        </div>

        {/* CENTER: editable title */}
        <div style={{flex:1,display:"flex",justifyContent:"center"}}>
          <input value={doc.title} onChange={e=>setDoc({...doc,title:e.target.value})}
            style={{background:"none",border:"none",borderBottom:"2px solid transparent",fontSize:15,fontWeight:700,color:"#0f172a",outline:"none",textAlign:"center",padding:"4px 12px",width:"280px",fontFamily:"inherit",transition:"border-color .2s"}}
            onFocus={e=>e.target.style.borderBottomColor="#7c3aed"} onBlur={e=>e.target.style.borderBottomColor="transparent"}/>
        </div>

        {/* RIGHT: status actions + share */}
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <Badge status={doc.status}/>

          {doc.status==="draft" && (
            <button onClick={()=>setStatus("pending")} style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",border:"none",padding:"8px 16px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>📤 Submit</button>
          )}
          {doc.status==="pending" && (
            <div style={{display:"flex",gap:4}}>
              <button onClick={()=>setStatus("approved")} style={{background:"linear-gradient(135deg,#16a34a,#22c55e)",color:"#fff",border:"none",padding:"8px 16px",borderRadius:"10px 0 0 10px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✅ Approve</button>
              <button onClick={()=>setRejectModal(true)} style={{background:"linear-gradient(135deg,#9f1239,#ef4444)",color:"#fff",border:"none",padding:"8px 16px",borderRadius:"0 10px 10px 0",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>❌ Reject</button>
            </div>
          )}
          {doc.status==="approved" && (
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span style={{background:"#f0fdf4",color:"#14532d",border:"1.5px solid #86efac",padding:"7px 14px",borderRadius:10,fontSize:13,fontWeight:700}}>🎉 Approved!</span>
              <button onClick={()=>setStatus("pending")} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",color:"#475569",padding:"7px 12px",borderRadius:10,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Revoke</button>
            </div>
          )}
          {doc.status==="rejected" && (
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span style={{background:"#fff1f2",color:"#9f1239",border:"1.5px solid #fda4af",padding:"7px 12px",borderRadius:10,fontSize:12,fontWeight:700}}>❌ Edit & Resubmit</span>
              <button onClick={()=>setStatus("pending",{rejectNote:""})} style={{background:"linear-gradient(135deg,#0891b2,#06b6d4)",color:"#fff",border:"none",padding:"8px 16px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🔄 Re-Submit</button>
            </div>
          )}

          <button onClick={()=>saveDoc()} style={{background:"#7c3aed",color:"#fff",border:"none",padding:"8px 20px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 12px rgba(124,58,237,0.3)"}}>Share</button>
        </div>
      </div>

      {/* ╔══ BODY ══╗ */}
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* ── ICON SIDEBAR (Canva left icon rail) ── */}
        <div style={{width:72,background:"#fff",borderRight:"1px solid #e5e7eb",display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 0",gap:4,flexShrink:0}}>
          {[
            {id:"pages",   icon:"⊞", label:"Pages"},
            {id:"add",     icon:"＋", label:"Add Slide"},
            {id:"themes",  icon:"🎨", label:"Themes"},
            {id:"elements",icon:"✦",  label:"Elements"},
          ].map(item=>(
            <button key={item.id} onClick={()=>setLeftPanel(leftPanel===item.id?"":item.id)} className="icobtn"
              style={{width:52,height:52,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,background:leftPanel===item.id?"#ede9fe":"none",border:"none",borderRadius:10,cursor:"pointer",transition:"background .15s",color:leftPanel===item.id?"#7c3aed":"#6b7280"}}>
              <span style={{fontSize:20}}>{item.icon}</span>
              <span style={{fontSize:9,fontWeight:700,letterSpacing:0.3}}>{item.label}</span>
            </button>
          ))}
          <div style={{flex:1}}/>
          {clients.length>0 && <div style={{width:40,height:1,background:"#e5e7eb",margin:"4px 0"}}/>}
          <button className="icobtn" style={{width:52,height:52,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,background:"none",border:"none",borderRadius:10,cursor:"pointer",color:"#6b7280"}}>
            <span style={{fontSize:20}}>⚙️</span><span style={{fontSize:9,fontWeight:700}}>Settings</span>
          </button>
        </div>

        {/* ── LEFT CONTENT PANEL ── */}
        {leftPanel && (
          <div style={{width:230,background:"#fff",borderRight:"1px solid #e5e7eb",display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden"}}>

            {/* PAGES */}
            {leftPanel==="pages" && <>
              <div style={{padding:"14px 16px 10px",borderBottom:"1px solid #f1f5f9"}}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search slides..."
                  style={{width:"100%",boxSizing:"border-box",border:"1px solid #e2e8f0",borderRadius:8,padding:"7px 12px",fontSize:12,outline:"none",fontFamily:"inherit",color:"#374151",background:"#f8fafc"}}/>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:10}}>
                {doc.slides.map((s,i)=>(
                  <div key={s.id} className={`pgthumb ${i===page?"sel":""}`} onClick={()=>setPage(i)}
                    style={{border:`2px solid ${i===page?"#7c3aed":"#e2e8f0"}`,borderRadius:10,overflow:"hidden",position:"relative",background:"#f8fafc",transition:"border-color .15s"}}>
                    {/* mini preview */}
                    <div style={{width:"100%",paddingBottom:"56.25%",position:"relative",overflow:"hidden",background:"#fff"}}>
                      <div style={{position:"absolute",inset:0,transform:"scale(0.215)",transformOrigin:"top left",width:900,height:506,pointerEvents:"none"}}>
                        <Slide slide={s} theme={doc.theme} editing={false} onChange={()=>{}} preview/>
                      </div>
                    </div>
                    {/* label + controls */}
                    <div style={{padding:"5px 8px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fff",borderTop:"1px solid #f1f5f9"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:10,fontWeight:700,color:"#94a3b8"}}>{i+1}</span>
                        <span style={{fontSize:10,fontWeight:600,color:"#374151"}}>{SLIDE_TYPES.find(t=>t.id===s.type)?.label||s.type}</span>
                      </div>
                      <div style={{display:"flex",gap:3}}>
                        <button onClick={e=>{e.stopPropagation();duplicateSlide(i);}} title="Duplicate" style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#94a3b8",padding:"2px 4px",borderRadius:4}} className="topbtn">⧉</button>
                        <button onClick={e=>{e.stopPropagation();moveSlide(i,i-1);}} disabled={i===0} title="Move up" style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:i===0?"#e2e8f0":"#94a3b8",padding:"2px 4px",borderRadius:4}} className="topbtn">↑</button>
                        <button onClick={e=>{e.stopPropagation();moveSlide(i,i+1);}} disabled={i===doc.slides.length-1} title="Move down" style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:i===doc.slides.length-1?"#e2e8f0":"#94a3b8",padding:"2px 4px",borderRadius:4}} className="topbtn">↓</button>
                        {doc.slides.length>1 && <button onClick={e=>{e.stopPropagation();delSlide(i);}} title="Delete" style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#fca5a5",padding:"2px 4px",borderRadius:4}} className="topbtn">✕</button>}
                      </div>
                    </div>
                    {i===page && <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:"#7c3aed",borderRadius:"0 3px 3px 0"}}/>}
                  </div>
                ))}
              </div>
            </>}

            {/* ADD SLIDE */}
            {leftPanel==="add" && <>
              <div style={{padding:"14px 16px 10px",borderBottom:"1px solid #f1f5f9"}}>
                <div style={{fontSize:13,fontWeight:800,color:"#0f172a"}}>Add a slide</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{canEdit?"Click to insert":"Edit locked — draft/rejected only"}</div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:8}}>
                {SLIDE_TYPES.map(tmpl=>(
                  <button key={tmpl.id} onClick={()=>canEdit&&addSlide(tmpl.id)} className="sib"
                    style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 14px",color:canEdit?"#374151":"#94a3b8",fontSize:13,fontWeight:600,cursor:canEdit?"pointer":"not-allowed",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:12,transition:"all .15s"}}>
                    <span style={{fontSize:20}}>{tmpl.icon}</span>
                    <div>
                      <div style={{fontSize:13,fontWeight:700}}>{tmpl.label}</div>
                      <div style={{fontSize:11,color:"#94a3b8",fontWeight:400,marginTop:1}}>{tmpl.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>}

            {/* THEMES */}
            {leftPanel==="themes" && <>
              <div style={{padding:"14px 16px 10px",borderBottom:"1px solid #f1f5f9"}}>
                <div style={{fontSize:13,fontWeight:800,color:"#0f172a"}}>Theme Color</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{canEdit?"Click to apply":"Locked in current status"}</div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"14px 12px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {THEMES.map(t2=>(
                  <div key={t2.name} onClick={()=>canEdit&&changeTheme(t2.name)}
                    style={{borderRadius:12,overflow:"hidden",cursor:canEdit?"pointer":"not-allowed",border:`2.5px solid ${doc.theme===t2.name?"#7c3aed":"#e2e8f0"}`,transition:"border-color .15s",opacity:canEdit?1:0.5}}>
                    <div style={{height:54,background:t2.g}}/>
                    <div style={{padding:"6px 8px",background:"#fff"}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#374151"}}>{t2.name}</div>
                      {doc.theme===t2.name && <div style={{fontSize:10,color:"#7c3aed",fontWeight:600}}>✓ Active</div>}
                    </div>
                  </div>
                ))}
              </div>
            </>}

            {/* ELEMENTS */}
            {leftPanel==="elements" && <>
              <div style={{padding:"14px 16px 10px",borderBottom:"1px solid #f1f5f9"}}>
                <div style={{fontSize:13,fontWeight:800,color:"#0f172a"}}>Slide Details</div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:12}}>
                <div style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Proposal ID</div>
                  <div style={{fontSize:12,fontWeight:700,color:"#0f172a",wordBreak:"break-all"}}>{doc.id}</div>
                </div>
                <div style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Client</div>
                  {clients.length>0
                    ? <select value={doc.client||""} onChange={e=>setDoc({...doc,client:e.target.value})} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"6px 10px",fontSize:12,fontFamily:"inherit",outline:"none",background:"#fff",color:"#0f172a"}}>
                        <option value="">— Select Client —</option>
                        {clients.map((c,i)=><option key={i} value={c.clientName||c.name}>{c.clientName||c.name}</option>)}
                      </select>
                    : <input value={doc.client} onChange={e=>setDoc({...doc,client:e.target.value})} placeholder="Enter client name" style={{width:"100%",boxSizing:"border-box",border:"1px solid #e2e8f0",borderRadius:8,padding:"6px 10px",fontSize:12,fontFamily:"inherit",outline:"none",color:"#0f172a"}}/>
                  }
                </div>
                <div style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Status</div>
                  <Badge status={doc.status}/>
                  {doc.status==="rejected"&&doc.rejectNote&&<div style={{marginTop:8,fontSize:11,color:"#9f1239",background:"#fff1f2",padding:"6px 10px",borderRadius:8,border:"1px solid #fda4af"}}>"{doc.rejectNote}"</div>}
                </div>
                <div style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Last Saved</div>
                  <div style={{fontSize:12,color:"#374151"}}>{new Date(doc.updated).toLocaleString("en-IN")}</div>
                </div>
                <button onClick={()=>saveDoc()} style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>💾 Save Now</button>
              </div>
            </>}
          </div>
        )}

        {/* ── CENTER CANVAS ── */}
        <div ref={canvasRef} style={{flex:1,overflow:"auto",background:"#e8e8e8",display:"flex",flexDirection:"column",alignItems:"center",padding:"40px 32px 0"}}>

          {/* Status notification bar */}
          {doc.status==="approved" && <div style={{background:"#f0fdf4",border:"1.5px solid #86efac",borderRadius:12,padding:"10px 24px",fontSize:13,fontWeight:700,color:"#14532d",marginBottom:20,display:"flex",alignItems:"center",gap:8}}>🎉 This proposal has been approved! Great work.</div>}
          {doc.status==="rejected" && <div style={{background:"#fff1f2",border:"1.5px solid #fda4af",borderRadius:12,padding:"10px 24px",fontSize:13,fontWeight:700,color:"#9f1239",marginBottom:20,textAlign:"center"}}>❌ Rejected{doc.rejectNote?` — "${doc.rejectNote}"`:""} · Edit slides above and click Re-Submit</div>}
          {doc.status==="pending" && <div style={{background:"#fffbeb",border:"1.5px solid #fcd34d",borderRadius:12,padding:"10px 24px",fontSize:13,fontWeight:700,color:"#92400e",marginBottom:20}}>⏳ Awaiting approval · Use Approve / Reject buttons in top bar</div>}

          {/* Slide canvas */}
          <div style={{width:900*zf,height:506*zf,boxShadow:"0 8px 40px rgba(0,0,0,0.2)",borderRadius:4,overflow:"hidden",flexShrink:0,marginBottom:32}}>
            <Slide slide={doc.slides[page]} theme={doc.theme} editing={canEdit} onChange={updateSlide} zoom={zf}/>
          </div>
        </div>

        {/* ── RIGHT PROPERTIES PANEL ── */}
        <div style={{width:200,background:"#fff",borderLeft:"1px solid #e5e7eb",display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden"}}>
          <div style={{padding:"14px 16px",borderBottom:"1px solid #f1f5f9"}}>
            <div style={{fontSize:12,fontWeight:800,color:"#0f172a"}}>Properties</div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:14}}>

            {/* Zoom */}
            <div>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Zoom</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input type="range" min={30} max={100} value={zoom} onChange={e=>setZoom(+e.target.value)} style={{flex:1,accentColor:"#7c3aed"}}/>
                <span style={{fontSize:12,fontWeight:700,color:"#374151",width:36}}>{zoom}%</span>
              </div>
              <div style={{display:"flex",gap:6,marginTop:6}}>
                {[50,75,100].map(z=><button key={z} onClick={()=>setZoom(z)} style={{flex:1,padding:"4px 0",border:`1px solid ${zoom===z?"#7c3aed":"#e2e8f0"}`,borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",background:zoom===z?"#ede9fe":"#fff",color:zoom===z?"#7c3aed":"#374151"}}>{z}%</button>)}
              </div>
            </div>

            {/* Theme swatches */}
            <div>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Theme</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                {THEMES.map(t2=>(
                  <div key={t2.name} onClick={()=>canEdit&&changeTheme(t2.name)} title={t2.name}
                    style={{width:"100%",paddingBottom:"100%",borderRadius:"50%",background:t2.g,cursor:canEdit?"pointer":"not-allowed",border:`2.5px solid ${doc.theme===t2.name?"#7c3aed":"transparent"}`,boxShadow:doc.theme===t2.name?`0 0 0 2px ${t2.p}40`:"none",transition:"all .15s",position:"relative"}}>
                  </div>
                ))}
              </div>
            </div>

            {/* Slide nav */}
            <div>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Navigate</div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <button onClick={()=>setPage(Math.max(0,page-1))} disabled={page===0} style={{flex:1,padding:"6px",border:"1px solid #e2e8f0",borderRadius:8,background:"#f8fafc",cursor:page===0?"not-allowed":"pointer",fontSize:16,color:page===0?"#cbd5e1":"#374151"}}>◀</button>
                <span style={{fontSize:12,fontWeight:700,color:"#374151",textAlign:"center",minWidth:50}}>{page+1}/{doc.slides.length}</span>
                <button onClick={()=>setPage(Math.min(doc.slides.length-1,page+1))} disabled={page===doc.slides.length-1} style={{flex:1,padding:"6px",border:"1px solid #e2e8f0",borderRadius:8,background:"#f8fafc",cursor:page===doc.slides.length-1?"not-allowed":"pointer",fontSize:16,color:page===doc.slides.length-1?"#cbd5e1":"#374151"}}>▶</button>
              </div>
            </div>

            {/* Current slide info */}
            <div style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px"}}>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Current Slide</div>
              <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{SLIDE_TYPES.find(t=>t.id===doc.slides[page]?.type)?.icon} {SLIDE_TYPES.find(t=>t.id===doc.slides[page]?.type)?.label}</div>
            </div>

            {canEdit && (
              <button onClick={()=>duplicateSlide(page)} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:10,padding:"9px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#374151"}}>
                ⧉ Duplicate Slide
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ╔══ BOTTOM PAGE STRIP (Canva style) ══╗ */}
      <div style={{height:110,background:"#fff",borderTop:"1px solid #e5e7eb",display:"flex",alignItems:"center",padding:"0 16px",gap:12,overflowX:"auto",flexShrink:0}}>
        {doc.slides.map((s,i)=>(
          <div key={s.id} onClick={()=>setPage(i)}
            style={{height:80,width:142,flexShrink:0,borderRadius:8,overflow:"hidden",cursor:"pointer",border:`2.5px solid ${i===page?"#7c3aed":"#e2e8f0"}`,position:"relative",background:"#fff",transition:"border-color .15s",boxShadow:i===page?"0 0 0 2px rgba(124,58,237,0.15)":"none"}}>
            <div style={{transform:"scale(0.158)",transformOrigin:"top left",width:900,height:506,pointerEvents:"none"}}>
              <Slide slide={s} theme={doc.theme} editing={false} onChange={()=>{}} preview/>
            </div>
            <div style={{position:"absolute",bottom:3,left:4,fontSize:9,fontWeight:700,color:"#94a3b8"}}>{i+1}</div>
            {i===page && <div style={{position:"absolute",inset:0,border:"2px solid #7c3aed",borderRadius:6,pointerEvents:"none"}}/>}
          </div>
        ))}
        <button onClick={()=>{canEdit&&addSlide("overview");}} disabled={!canEdit}
          style={{height:80,width:52,flexShrink:0,borderRadius:8,border:"2px dashed #cbd5e1",background:"none",cursor:canEdit?"pointer":"not-allowed",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,color:canEdit?"#7c3aed":"#cbd5e1",fontSize:20,fontWeight:300,transition:"all .15s"}}>
          <span>+</span>
        </button>
      </div>
    </div>
  );
}
