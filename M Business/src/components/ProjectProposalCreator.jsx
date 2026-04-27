import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

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
  { id:"blank_first_page", label:"Blank First Page", icon:"📄", desc:"Empty first page for proposal" },
  { id:"proposal",    label:"Proposal Page 1", icon:"📄", desc:"A4 format proposal document page 1" },
  { id:"proposal_page2", label:"Proposal Page 2", icon:"📄", desc:"A4 format proposal document page 2" },
  { id:"portrait",    label:"Portrait Page", icon:"📱", desc:"Custom portrait page" },
  { id:"landscape",   label:"Landscape Page", icon:"🖼️", desc:"Custom landscape page" },
  { id:"blank",       label:"Blank Page",    icon:"📄", desc:"Add custom content" },
];

function makeSlide(type, themeName="Violet") {
  console.log("makeSlide called with type:", type);
  const b = { id:uid(), type, theme:themeName, elements:[] };
  switch(type) {
    case "cover":      return {...b, title:"Project Proposal", subtitle:"Prepared exclusively for your review · "+new Date().getFullYear(), coverImage:COVERS[0]};
    case "overview":   return {...b, heading:"Project Overview", body:"We propose a comprehensive solution designed to address your business challenges. Our approach combines deep industry expertise with cutting-edge technology to deliver measurable, lasting results."};
    case "objectives": return {...b, heading:"Key Objectives", items:["Deliver scalable, future-proof architecture that grows with your business","Reduce operational overhead by 40% through smart automation","Ensure seamless user experience across all devices and platforms"]};
    case "timeline":   return {...b, heading:"Project Timeline", phases:[{label:"Discovery & Strategy",dur:"2 Weeks"},{label:"Design & Prototyping",dur:"3 Weeks"},{label:"Development & Testing",dur:"6 Weeks"},{label:"Launch & Handover",dur:"1 Week"}]};
    case "budget":     return {...b, heading:"Budget Estimate", rows:[{item:"UI/UX Design",cost:"₹80,000"},{item:"Frontend Development",cost:"₹1,50,000"},{item:"Backend & APIs",cost:"₹1,20,000"},{item:"QA & Testing",cost:"₹40,000"},{item:"Deployment",cost:"₹30,000"}], total:"₹4,20,000"};
    case "team":       return {...b, heading:"Meet Our Team", members:[{name:"Arjun Sharma",role:"Project Lead",avatar:"AS"},{name:"Priya Nair",role:"UI/UX Designer",avatar:"PN"},{name:"Karthik Raj",role:"Full Stack Dev",avatar:"KR"},{name:"Meena Iyer",role:"QA Engineer",avatar:"MI"}]};
    case "process":    return {...b, heading:"Our Process", steps:[{icon:"🔍",label:"Research",desc:"Deep dive into your needs"},{icon:"✏️",label:"Design",desc:"Wireframes & prototypes"},{icon:"⚡",label:"Build",desc:"Agile development"},{icon:"🚀",label:"Launch",desc:"Deploy & support"}]};
    case "blank_first_page": return {...b, pageTitle:"Blank First Page"};
    case "proposal":   return {...b, 
      companyName:"", 
      clientName:"", 
      clientAddress:"",
      refNo:"",
      date:new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
      projectType:"",
      scopeOfWork:[],
      conceptStage:[],
      companyAddress:""
    };
    case "proposal_page2": return {...b,
      companyName:"",
      siteVisits:[],
      feeStructure:[],
      stagesOfPayment:[],
      companyAddress:""
    };
    case "portrait":   return {...b, orientation:"portrait", heading:"Portrait Page", body:"This is a custom portrait page. Add your content here."};
    case "landscape":  return {...b, orientation:"landscape", heading:"Landscape Page", body:"This is a custom landscape page. Add your content here."};
    case "closing":    return {...b, heading:"Ready to Begin?", body:"We're excited to bring your vision to life. Our team is prepared to start immediately and deliver results that exceed your expectations.", cta:"Schedule a Call →"};
    case "blank":      return {...b, heading:"", body:""};
    default:           return {...b, heading:"Slide", body:""};
  }
}

function makeDemo() {
  const theme = "Violet";
  return {
    id:pid(), title:"New Project Proposal", client:"",
    theme, status:"draft", format:"a4-portrait",
    created:new Date().toISOString(), updated:new Date().toISOString(),
    rejectNote:"",
    slides: [makeSlide("proposal", theme)],
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

// ─── DRAGGABLE ELEMENT ────────────────────────────────────────────────────────
function DraggableElement({ element, selected, onSelect, onUpdate, onDelete, children, canvasRef }) {
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset]     = useState({ x: 0, y: 0 });

  const onPointerDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      onSelect(element.id);
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    onSelect(element.id);
    setDragging(true);

    const canvas = canvasRef?.current;
    if (!canvas) {
      setOffset({ x: e.clientX - element.x, y: e.clientY - element.y });
      return;
    }
    const rect  = canvas.getBoundingClientRect();
    const scale = 900 / rect.width;
    setOffset({
      x: (e.clientX - rect.left) * scale - element.x,
      y: (e.clientY - rect.top)  * scale - element.y,
    });
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e) => {
      const canvas = canvasRef?.current;
      if (!canvas) return;
      const rect  = canvas.getBoundingClientRect();
      const scale = 900 / rect.width;
      let nx = (e.clientX - rect.left) * scale - offset.x;
      let ny = (e.clientY - rect.top)  * scale - offset.y;
      // Slide boundary clamp (900 × 506)
      nx = Math.max(0, Math.min(900 - (element.w ?? 100), nx));
      ny = Math.max(0, Math.min(506 - (element.h ?? 40), ny));
      onUpdate({ x: nx, y: ny });
    };
    const up = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup",   up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup",   up);
    };
  }, [dragging, offset, canvasRef, element.w, element.h, onUpdate]);

  const handleStyle = { position:"absolute", width:10, height:10, borderRadius:"50%", background:"#fff", border:"2px solid #7d2ae8", zIndex:2 };

  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        position:   "absolute",
        left:       element.x,
        top:        element.y,
        minWidth:   element.w || "max-content",
        cursor:     dragging ? "grabbing" : "grab",
        userSelect: "none",
        border:     selected ? "2px solid #7d2ae8" : "2px solid transparent",
        borderRadius: 2,
        padding:    selected ? 6 : 0,
        zIndex:     selected ? 100 : 1,
        transition: dragging ? "none" : "border .1s",
        boxSizing:  "border-box",
      }}
    >
      {/* Corner Handles (Visual) */}
      {selected && !dragging && (
        <>
          <div style={{ ...handleStyle, top:-6, left:-6 }} />
          <div style={{ ...handleStyle, top:-6, right:-6 }} />
          <div style={{ ...handleStyle, bottom:-6, left:-6 }} />
          <div style={{ ...handleStyle, bottom:-6, right:-6 }} />
          
          {/* Toolbar Overlay */}
          <div style={{ position:"absolute", top:-44, left:"50%", transform:"translateX(-50%)", background:"#fff", boxShadow:"0 4px 12px rgba(0,0,0,0.15)", borderRadius:8, display:"flex", gap:1, padding:2, zIndex:100, border:"1px solid #e5e7eb" }}>
             <button onClick={(e)=>{e.stopPropagation(); onDelete(element.id);}} style={{ border:"none", background:"none", padding:"6px 12px", fontSize:14, cursor:"pointer", color:"#ef4444" }} title="Delete">🗑</button>
             <div style={{ width:1, height:20, background:"#e5e7eb", alignSelf:"center" }} />
             <button onClick={(e)=>{e.stopPropagation(); onUpdate(element.id, {fontWeight: (element.fontWeight === 800 ? 400 : 800)});}} style={{ border:"none", background:"none", padding:"6px 12px", fontSize:13, fontWeight:800, cursor:"pointer", color:element.fontWeight===800?"#7d2ae8":"#374151" }} title="Bold">B</button>
          </div>
        </>
      )}

      {children}
    </div>
  );
}
// ─── SLIDE RENDERER ───────────────────────────────────────────────────────────
function Slide({ slide, theme:tn, docFormat, editing, onChange, selectedId, onSelectElement, onUpdateElement, onDelete, preview=false, canvasRef }){
  const t = THEMES.find(x=>x.name===tn)||THEMES[0];
  const upd = patch => onChange&&onChange({...slide,...patch});
  const fontSize = preview ? 0.22 : 1;
  const elements = slide.elements || [];

  // Local delete function for elements
  const deleteElement = (elId) => {
    const elements = slide.elements.filter(e=>e.id!==elId);
    upd({elements});
    onSelectElement(null);
  };

  const isPortrait = docFormat === "a4-portrait" || (!docFormat && (slide.type === "proposal" || slide.type === "portrait"));
  const isLandscape = docFormat === "a4-landscape" || (!docFormat && slide.type === "landscape");
  const slideH = isPortrait ? 1273 : isLandscape ? 637 : 506;
  const W = { width:900, minHeight:slideH, background:"#ffffff", fontFamily:"'Outfit',sans-serif", position:"relative", overflow:"hidden", flexShrink:0 };
  const accent = { width:56,height:6,background:t.g,borderRadius:3,marginBottom:20 };
  const h1 = { fontSize:36,fontWeight:800,color:"#0f172a",marginBottom:24,letterSpacing:-0.5,lineHeight:1.1 };

  const Txt = ({val,onCh,big,center,white,weight,size}) => {
    const s={background:"transparent",border:"none",borderRadius:4,padding:"2px 4px",outline:"none",fontSize:size||"inherit",color:white?"rgba(255,255,255,0.9)":"inherit",fontWeight:weight||"inherit",fontFamily:"inherit",lineHeight:"inherit",width:"100%",boxSizing:"border-box",textAlign:center?"center":"left",resize:"none",transition:"background .15s"};
    if(!editing) return <span style={{display:"block",whiteSpace:"pre-wrap"}}>{val}</span>;
    return big 
      ? <textarea value={val} onChange={e=>onCh(e.target.value)} rows={4} style={s} onFocus={e=>e.target.style.background="rgba(124,58,237,0.05)"} onBlur={e=>e.target.style.background="transparent"}/> 
      : <input value={val} onChange={e=>onCh(e.target.value)} style={s} onFocus={e=>e.target.style.background="rgba(124,58,237,0.05)"} onBlur={e=>e.target.style.background="transparent"}/>;
  };

  const elementsOverlay = (
      <div style={{position:"absolute", inset:0, pointerEvents:preview?"none":"auto", zIndex:20}}>
        {elements.map(el => (
          <DraggableElement key={el.id} element={el} selected={selectedId===el.id} onSelect={onSelectElement} onUpdate={patch=>onUpdateElement(el.id, patch)} onDelete={deleteElement} canvasRef={canvasRef}>
            {el.type === "text" && (
              <div style={{fontSize:el.fontSize, fontWeight:el.fontWeight, color:el.color||"#000", whiteSpace:"nowrap"}}>
                {editing ? (
                  <input value={el.val} onChange={e=>onUpdateElement(el.id, {val:e.target.value})} 
                    autoFocus={selectedId===el.id}
                    style={{background:"none", border:"none", outline:"none", color:"inherit", fontSize:"inherit", fontWeight:"inherit", fontFamily:"inherit", padding:0}}/>
                ) : el.val}
              </div>
            )}
            {el.type === "shape" && (
              <div style={{width:el.width||60, height:el.height||60, background:el.color||t.p, borderRadius: el.borderRadius !== undefined ? el.borderRadius + 'px' : (el.shape==="circle"?"50%":"4px")}} />
            )}
            {el.type === "image" && (
              <img src={el.src} alt="" style={{width:el.width||200, height:"auto", borderRadius:4, display:"block", pointerEvents:"none"}} />
            )}
            {el.type === "icon" && (
              <div style={{fontSize:el.fontSize||40, display:"flex", alignItems:"center", justifyContent:"center"}}>
                {el.icon}
              </div>
            )}
            {el.type === "image" && (
              <img src={el.src} alt="" style={{width:el.width||120, height:el.height||"auto", objectFit:"contain", pointerEvents:"none"}} />
            )}
          </DraggableElement>
        ))}
      </div>
  );

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
      {elementsOverlay}
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
    {elementsOverlay}
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
    {elementsOverlay}
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
      {elementsOverlay}
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
    {elementsOverlay}
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
      {elementsOverlay}
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
    {elementsOverlay}
    </div>
  );

  // BLANK FIRST PAGE - A4 Format Document
  if(slide.type==="blank_first_page") return (
    <>
      <style>{`
        @media print {
          @page { 
            size: A4; 
            margin: 20mm; 
          }
          body { 
            margin: 0; 
            background: white !important; 
          }
          .blank-page-content {
            width: 100% !important;
            height: auto !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }
          .no-print { 
            display: none !important; 
          }
        }
      `}</style>
      <div className="blank-page-content" style={{...W,padding:"40px 60px",background:"#fff",fontSize:"14px",lineHeight:"1.5",color:"#000",position:"relative",minHeight:"1273px"}}>
        {/* Print Button - Only show when not editing */}
        {!editing && (
          <button 
            onClick={() => window.print()} 
            className="no-print"
            style={{
              position:"absolute", 
              top:"10px", 
              right:"10px", 
              background:"#007bff", 
              color:"white", 
              border:"none", 
              borderRadius:"5px", 
              padding:"8px 15px", 
              cursor:"pointer",
              fontSize:"12px",
              fontWeight:"bold"
            }}
          >
            🖨️ Print
          </button>
        )}
        
        {/* Empty page content */}
        <div style={{height:"100%", display:"flex", alignItems:"center", justifyContent:"center"}}>
          <div style={{color:"#ccc", fontSize:"16px", textAlign:"center"}}>
            {editing ? "Empty First Page - Click to add content" : ""}
          </div>
        </div>
        
        {elementsOverlay}
      </div>
    </>
  );

  // PROPOSAL - A4 Format Document
  if(slide.type==="proposal") return (
    <>
      <style>{`
        @media print {
          @page { 
            size: A4; 
            margin: 20mm; 
          }
          body { 
            margin: 0; 
            background: white !important; 
          }
          .proposal-content {
            width: 100% !important;
            height: auto !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }
          .no-print { 
            display: none !important; 
          }
        }
      `}</style>
      <div className="proposal-content" style={{...W,padding:"40px 60px",background:"#fff",fontSize:"14px",lineHeight:"1.5",color:"#000",position:"relative"}}>
        {/* Print Button - Only show when not editing */}
        {!editing && (
          <button 
            onClick={() => window.print()} 
            className="no-print"
            style={{
              position:"absolute", 
              top:"10px", 
              right:"10px", 
              background:"#007bff", 
              color:"white", 
              border:"none", 
              borderRadius:"5px", 
              padding:"8px 15px", 
              cursor:"pointer",
              fontSize:"12px",
              fontWeight:"bold"
            }}
          >
            🖨️ Print
          </button>
        )}
        
        
      {/* Reference and Date */}
      <div style={{textAlign:"right",marginBottom:"20px"}}>
        <div><Txt val={`Ref: ${slide.refNo}`} onCh={v=>upd({refNo:v.replace('Ref: ', '')})}/></div>
        <div><Txt val={`Dated: ${slide.date}`} onCh={v=>upd({date:v.replace('Dated: ', '')})}/></div>
      </div>

      {/* Recipient Information */}
      <div style={{marginBottom:"20px"}}>
        <div style={{fontWeight:"bold"}}>To</div>
        <div><Txt val={`${slide.clientName},`} onCh={v=>upd({clientName:v.replace(',', '')})}/></div>
        <div><Txt val={`${slide.clientAddress}..`} onCh={v=>upd({clientAddress:v.replace('..', '')})}/></div>
      </div>

      {/* Salutation */}
      <div style={{marginBottom:"20px"}}>
        <div>Dear Sir,</div>
      </div>

      {/* Subject */}
      <div style={{marginBottom:"20px"}}>
        <div style={{fontWeight:"bold"}}>
          <Txt val={`Sub: Offer for Architectural consultancy & PMC(Project Management Consultancy) Service for the proposed ${slide.projectType} @ ${slide.clientAddress.replace('..', '')},CHENNAI.`} 
               onCh={v=>upd({projectType:v.match(/proposed (.+?) @/)?.[1] || slide.projectType})}/>
        </div>
      </div>

      {/* Body */}
      <div style={{marginBottom:"20px"}}>
        <div>I here by express my sincere thanks for giving us the opportunity to design the proposed <span style={{fontWeight:"bold"}}>{slide.projectType}</span>. In this connection we would like to inform you about the scope of our work in this regard for your kind perusal.</div>
      </div>

      {/* Scope of Work */}
      <div style={{marginBottom:"20px"}}>
        <div style={{fontWeight:"bold",textDecoration:"underline"}}>1.0 SCOPE OF WORK:</div>
        <div style={{marginLeft:"20px"}}>
          <div><Txt val={`${slide.companyName} will provide services in the following stages as follows:`} onCh={v=>upd({companyName:v.split(' will provide')[0]})}/></div>
          {slide.scopeOfWork.map((item, i) => (
            <div key={i} style={{marginLeft:"20px"}}>
              • <Txt val={item} onCh={v=>{const a=[...slide.scopeOfWork];a[i]=v;upd({scopeOfWork:a});}}/>
            </div>
          ))}
        </div>
      </div>

      {/* Concept/Schematic Design Stage */}
      <div style={{marginBottom:"20px"}}>
        <div style={{fontWeight:"bold",textDecoration:"underline"}}>2.0 CONCEPT/SCHEMATIC DESIGN STAGE:</div>
        <div style={{marginLeft:"20px",marginTop:"5px"}}>
          {slide.conceptStage.map((item, i) => (
            <div key={i} style={{marginLeft:"20px",marginBottom:"4px"}}>
              • <Txt val={item} onCh={v=>{const a=[...slide.conceptStage];a[i]=v;upd({conceptStage:a});}}/>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{position:"absolute",bottom:"40px",left:"60px",right:"60px",textAlign:"center",fontSize:"10px",color:"#666",borderTop:"2px solid #ff0000",paddingTop:"10px"}}>
        <Txt val={slide.companyAddress} onCh={v=>upd({companyAddress:v})}/>
      </div>
      
      {elementsOverlay}
      </div>
    </>
  );

  // PROPOSAL PAGE 2 - A4 Format Document
  if(slide.type==="proposal_page2") return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 20mm; }
          body { margin: 0; background: white !important; }
          .proposal-content { width: 100% !important; height: auto !important; box-shadow: none !important; border-radius: 0 !important; overflow: visible !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="proposal-content" style={{...W,padding:"40px 60px",background:"#fff",fontSize:"14px",lineHeight:"1.5",color:"#000",position:"relative"}}>
        {!editing && (
          <button onClick={() => window.print()} className="no-print"
            style={{position:"absolute", top:"10px", right:"10px", background:"#007bff", color:"white", border:"none", borderRadius:"5px", padding:"8px 15px", cursor:"pointer",fontSize:"12px",fontWeight:"bold"}}>
            🖨️ Print
          </button>
        )}
        
        {/* Header with Logo minimized */}
      <div style={{textAlign:"center",marginBottom:"30px"}}>
        <div style={{display:"inline-block",background:"#ff0000",color:"#white",padding:"5px 10px",fontWeight:"bold",fontSize:"14px",marginBottom:"5px"}}>
          i des
        </div>
        <div style={{fontSize:"14px",fontWeight:"bold"}}>INTEGERATED DESIGN SERVICES</div>
      </div>

      {/* Site Visits */}
      <div style={{marginBottom:"30px"}}>
        <div style={{fontWeight:"bold",textDecoration:"underline"}}>3.0 SITE VISITS:</div>
        <div style={{marginLeft:"20px",marginTop:"10px"}}>
          {slide.siteVisits.map((item, i) => (
            <div key={i} style={{marginLeft:"20px",marginBottom:"6px"}}>
              • <Txt val={item} onCh={v=>{const a=[...slide.siteVisits];a[i]=v;upd({siteVisits:a});}}/>
            </div>
          ))}
        </div>
      </div>

      {/* Fee Structure */}
      <div style={{marginBottom:"30px"}}>
        <div style={{fontWeight:"bold",textDecoration:"underline"}}>5.0 FEE STRUCTURE:</div>
        <div style={{marginLeft:"20px",marginTop:"10px"}}>
          {slide.feeStructure.map((item, i) => (
            <div key={i} style={{marginLeft:"20px",marginBottom:"6px"}}>
              • <Txt val={item} onCh={v=>{const a=[...slide.feeStructure];a[i]=v;upd({feeStructure:a});}}/>
            </div>
          ))}
        </div>
      </div>

      {/* Stages of Payment */}
      <div style={{marginBottom:"40px"}}>
        <div style={{fontWeight:"bold",textDecoration:"underline"}}>6.0 STAGES OF PAYMENT:</div>
        <div style={{marginLeft:"20px",marginTop:"10px"}}>
          {slide.stagesOfPayment.map((item, i) => (
            <div key={i} style={{marginLeft:"20px",marginBottom:"6px"}}>
              • <Txt val={item} onCh={v=>{const a=[...slide.stagesOfPayment];a[i]=v;upd({stagesOfPayment:a});}}/>
            </div>
          ))}
        </div>
      </div>

      <div style={{marginTop:"60px",display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
        <div style={{fontWeight:"bold"}}>
          <div>For <Txt val={slide.companyName} onCh={v=>upd({companyName:v})}/></div>
          <div style={{marginTop:"40px"}}>(Authorised Signatory)</div>
        </div>
        <div style={{fontWeight:"bold",textAlign:"center"}}>
          <div style={{marginTop:"40px"}}>(Client Signature)</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{position:"absolute",bottom:"40px",left:"60px",right:"60px",textAlign:"center",fontSize:"10px",color:"#666",borderTop:"2px solid #ff0000",paddingTop:"10px"}}>
        <Txt val={slide.companyAddress} onCh={v=>upd({companyAddress:v})}/>
      </div>
      
      {elementsOverlay}
      </div>
    </>
  );

  // PORTRAIT PAGE
  if(slide.type==="portrait") return (
    <>
      <style>{`
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 20mm; 
          }
          body { 
            margin: 0; 
            background: white !important; 
          }
          .portrait-content {
            width: 100% !important;
            height: auto !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }
          .no-print { 
            display: none !important; 
          }
        }
      `}</style>
      <div className="portrait-content" style={{...W,padding:"40px",background:"#fff",fontSize:"14px",lineHeight:"1.5",color:"#000",position:"relative",aspectRatio:"210/297"}}>
        {/* Print Button */}
        {!editing && (
          <button 
            onClick={() => window.print()} 
            className="no-print"
            style={{
              position:"absolute", 
              top:"10px", 
              right:"10px", 
              background:"#007bff", 
              color:"white", 
              border:"none", 
              borderRadius:"5px", 
              padding:"8px 15px", 
              cursor:"pointer",
              fontSize:"12px",
              fontWeight:"bold"
            }}
          >
            🖨️ Print
          </button>
        )}
        
        <div style={h1}><Txt val={slide.heading} onCh={v=>upd({heading:v})}/></div>
        <div style={{fontSize:15,color:"#4b5563",lineHeight:1.9,maxWidth:620,marginTop:20}}>
          <Txt val={slide.body} onCh={v=>upd({body:v})} big/>
        </div>
        
        {elementsOverlay}
      </div>
    </>
  );

  // LANDSCAPE PAGE
  if(slide.type==="landscape") return (
    <>
      <style>{`
        @media print {
          @page { 
            size: A4 landscape; 
            margin: 20mm; 
          }
          body { 
            margin: 0; 
            background: white !important; 
          }
          .landscape-content {
            width: 100% !important;
            height: auto !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }
          .no-print { 
            display: none !important; 
          }
        }
      `}</style>
      <div className="landscape-content" style={{...W,padding:"40px",background:"#fff",fontSize:"14px",lineHeight:"1.5",color:"#000",position:"relative",aspectRatio:"297/210"}}>
        {/* Print Button */}
        {!editing && (
          <button 
            onClick={() => window.print()} 
            className="no-print"
            style={{
              position:"absolute", 
              top:"10px", 
              right:"10px", 
              background:"#007bff", 
              color:"white", 
              border:"none", 
              borderRadius:"5px", 
              padding:"8px 15px", 
              cursor:"pointer",
              fontSize:"12px",
              fontWeight:"bold"
            }}
          >
            🖨️ Print
          </button>
        )}
        
        <div style={h1}><Txt val={slide.heading} onCh={v=>upd({heading:v})}/></div>
        <div style={{fontSize:15,color:"#4b5563",lineHeight:1.9,maxWidth:800,marginTop:20}}>
          <Txt val={slide.body} onCh={v=>upd({body:v})} big/>
        </div>
        
        {elementsOverlay}
      </div>
    </>
  );

  return (
    <div style={W}>
      {/* Default/Blank Slide content */}
      {slide.type === "blank" ? (
        <div style={{padding:56,height:"100%",display:"flex",alignItems:"center",justifyContent:"center",border:"2px dashed #e5e7eb",margin:20,borderRadius:12,color:"#94a3b8"}}>
          Click to add elements or text
        </div>
      ) : (
        <div style={{...W,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:24,color:"#94a3b8"}}>{slide.type}</span></div>
      )}

      {elementsOverlay}

      {/* Dynamic Page Number */}
      {slide.type!=="cover" && (
        <div style={{position:"absolute",bottom:20,right:30,fontSize:12,color:t.p,fontWeight:700,opacity:0.6}}>
          Page Number
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function CanvaProposal({clients=[], openNew=false, onOpenNewDone}) {
  const [view, setView]           = useState("list");    // list | editor
  const [proposals, setProposals] = useState([]);
  const [doc, setDoc]             = useState(null);
  const [page, setPage]           = useState(0);         // active slide index
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [leftPanel, setLeftPanel] = useState("templates"); // templates | elements | text | brand | uploads | draw | projects | apps
  const [zoom, setZoom]           = useState(10);        // %
  const [confetti, setConfetti]   = useState(false);
  const [toast, setToast]         = useState(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading]     = useState(true);     // loading state for proposals
  const [search, setSearch]       = useState("");
  const [showResizeMenu, setShowResizeMenu] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);  // true when ?view= is in URL (client view)
  
  // Uploads State
  const [uploads, setUploads]     = useState([]);
  const [uploading, setUploading] = useState(false);
  const [clientsData, setClientsData] = useState(clients || []);
  const fileInputRef              = useRef();
  const canvasRef                 = useRef();

  // Auto-open new proposal when triggered from Dashboard
  useEffect(() => {
    if (openNew && !loading) {
      createNew();
      if (onOpenNewDone) onOpenNewDone();
    }
  }, [openNew, loading]);

 const changeFormat = async (fmt) => {
  if (!doc) return;
  const nd = { ...doc, format: fmt, updated: new Date().toISOString() };
  const saved = await persist(nd);   // get back the DB-hydrated doc (with _id)
  if (saved) setDoc(saved);          // use the version with _id going forward
  setShowResizeMenu(false);
  flash("📏 Page resized to " + (fmt==="a4-portrait" ? "A4 Portrait" : fmt==="a4-landscape" ? "A4 Landscape" : "Presentation"));
};
  useEffect(()=>{
    fetchProposals();
    fetchUploads();
    fetchClients();
    if (new URLSearchParams(window.location.search).get("new") === "true") {
      setTimeout(() => createNew(), 100);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  },[]);

  const fetchClients = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/clients`);
      setClientsData(res.data);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  const fetchUploads = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/upload`);
      setUploads(res.data);
    } catch (err) {
      console.error("Error fetching media:", err);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/upload`, formData);
      setUploads([res.data, ...uploads]);
      flash("✅ Upload successful!");
    } catch (err) {
      console.error("Upload failed", err);
      flash("❌ Upload failed", "err");
    } finally {
      setUploading(false);
    }
  };

  const fetchProposals = async () => {
    setLoading(true);
    try {
      console.log("📡 Fetching proposals from backend...");
      const res = await axios.get(`${BASE_URL}/api/proposals`);
      console.log(`📋 Found ${res.data.length} proposals in backend`);
      
      const list = res.data || [];
      if (list.length > 0) {
        setProposals(list);
        console.log("✅ Proposals loaded successfully");
        
        // Auto-open based on URL
        const params = new URLSearchParams(window.location.search);
        const editId = params.get("edit");
        const viewId = params.get("view");
        
        if (editId) {
          const found = list.find(p => p.id === editId || p._id === editId);
          if (found) { setDoc(found); setPage(0); setView("editor"); }
        } else if (viewId) {
          const found = list.find(p => p.id === viewId || p._id === viewId);
          if (found) { setDoc(found); setPage(0); setView("editor"); } // Note: if you want a read-only view, we can add a flag, but for now editor mode is fine.
        }
        
      } else {
        console.log("📝 No proposals found in backend, showing empty state");
        setProposals([]);
      }
    } catch (err) {
      console.error("❌ Error fetching proposals:", err);
      // Only show demo proposal in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log("🔧 Development mode: Showing demo proposal");
        const d = [makeDemo()]; 
        setProposals(d);
      } else {
        setProposals([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const flash = (msg,type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3200); };
// Fix 2: persist returns the saved doc, and uses functional state update to avoid stale closure
const persist = useCallback(async (d) => {
  try {
    if (d._id) {
      // Update existing DB record
      const res = await axios.put(`${BASE_URL}/api/proposals/${d._id}`, d);
      setProposals(prev => prev.map(p => p._id === d._id ? res.data : p));
      setDoc(res.data);
      return res.data;                     // ← return so callers can use it
    } else {
      // First save — create in DB
      const res = await axios.post(`${BASE_URL}/api/proposals`, d);
      setProposals(prev => [res.data, ...prev.filter(p => p.id !== d.id)]);
      setDoc(res.data);
      return res.data;                     // ← return the DB doc (now has _id)
    }
  } catch (err) {
    console.error("Error persisting proposal:", err);
    flash("❌ Error saving to server", "err");
    return null;
  }
}, []); 
// ← empty deps — uses functional setters, no stale closure
  
const openDoc = (d) => { setDoc({...d}); setPage(0); setView("editor"); };
  const createNew = () => {
    const d = { id:pid(), title:"New Project Proposal", client:"", theme:null, status:"draft", created:new Date().toISOString(), updated:new Date().toISOString(), rejectNote:"", format:"a4-portrait", slides:[makeSlide("proposal",null)] };
    setDoc(d); setPage(0); setView("editor");
  };

  const saveDoc = (d=doc) => { const nd={...d,updated:new Date().toISOString()}; persist(nd); setDoc(nd); flash("💾 Saved!"); };
  const setStatus = async (status, extra={}) => {
    if (status === "pending") {
      if (!doc.title.trim()) {
        flash("❌ Please add a title before submitting");
        return;
      }
      if (!window.confirm("Are you sure you want to submit this proposal to the client? You won't be able to edit it until the client responds.")) return;
      
      try {
        const res = await axios.put(`${BASE_URL}/api/proposals/${doc._id}/submit`);
        setDoc(res.data);
        setProposals(prev => prev.map(p => p._id === doc._id ? res.data : p));
        flash("📤 Proposal submitted successfully!");
        setTimeout(() => setView("list"), 1500);
      } catch (err) {
        console.error("Error submitting proposal:", err);
        flash("❌ Error submitting to server", "err");
      }
      return;
    }

    if (status === "approved") {
      try {
        const res = await axios.put(`${BASE_URL}/api/proposals/${doc._id}/approve`);
        setDoc(res.data);
        setProposals(prev => prev.map(p => p._id === doc._id ? res.data : p));
        setConfetti(true);
        flash("🎉 Proposal Approved!");
        setTimeout(() => setConfetti(false), 4000);
      } catch (err) {
        console.error("Error approving proposal:", err);
        flash("❌ Error approving", "err");
      }
      return;
    }

    if (status === "rejected") {
      try {
        const res = await axios.put(`${BASE_URL}/api/proposals/${doc._id}/reject`, extra);
        setDoc(res.data);
        setProposals(prev => prev.map(p => p._id === doc._id ? res.data : p));
        flash("❌ Proposal Rejected", "err");
      } catch (err) {
        console.error("Error rejecting proposal:", err);
        flash("❌ Error rejecting", "err");
      }
      return;
    }

    // Default update for other statuses (e.g. draft)
    const nd = { ...doc, status, ...extra, updated: new Date().toISOString() };
    persist(nd);
    setDoc(nd);
  };

  const updateSlide = (s) => {
    const slides = doc.slides.map((sl,i)=>i===page?s:sl);
    setDoc({...doc,slides});
  };
  const updateElement = (elId, patch) => {
    if (!doc.slides || !doc.slides[page]) return;
    const s = doc.slides[page];
    const elements = (s.elements || []).map(e=>e.id===elId?{...e,...patch}:e);
    updateSlide({...s,elements});
  };
  const addElement = (element) => {
    const s = doc.slides[page];
    // Position logic: different positioning for different slide types
    let xPos = 350, yPos = 230;
    if (s.type === "proposal" || s.type === "portrait") {
      xPos = 200;
      yPos = 400;
    } else if (s.type === "landscape") {
      xPos = 450;
      yPos = 200;
    }
    const elements = [...(s.elements||[]), {id:uid(), fontSize:16, fontWeight:400, x:xPos, y:yPos, ...element}];
    updateSlide({...s,elements});
    setSelectedElementId(elements[elements.length-1].id);
    flash("✨ Added to page!");
  };
  const deleteElement = (elId) => {
    const s = doc.slides[page];
    const elements = s.elements.filter(e=>e.id!==elId);
    updateSlide({...s,elements});
    setSelectedElementId(null);
    flash("🗑 Removed");
  };
  const addSlide = (type) => {
    const s = makeSlide(type, doc.theme);
    const slides = [...doc.slides,s];
    setDoc({...doc,slides}); setPage(slides.length-1); setLeftPanel("templates"); flash("✨ Slide added!");
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
  const deleteProposal = async (id,dbId,e) => {
    e.stopPropagation();
    if(!window.confirm("Delete this proposal?")) return;
    try {
      if (dbId) await axios.delete(`${BASE_URL}/api/proposals/${dbId}`);
      const d = proposals.filter(p=>p.id!==id);
      setProposals(d);
      flash("🗑 Proposal deleted");
    } catch (err) {
      console.error("Error deleting:", err);
      flash("❌ Error deleting from server", "err");
    }
  };

  const printProposal = (proposal) => {
    const getElementsHTML = (elements) => {
      if (!elements || elements.length === 0) return '';
      return `
        <div style="position:absolute; inset:0; pointer-events:none; z-index:20;">
          ${elements.map(el => {
            let content = '';
            if (el.type === "text") {
              content = `<div style="font-size:${el.fontSize}px; font-weight:${el.fontWeight}; color:${el.color||'#000'}; white-space:nowrap;">${el.val || ''}</div>`;
            } else if (el.type === "shape") {
               const br = el.borderRadius !== undefined ? el.borderRadius + 'px' : (el.shape === 'circle' ? '50%' : '4px');
               content = `<div style="width:${el.width||60}px; height:${el.height||60}px; background:${el.color||'#7c3aed'}; border-radius:${br};"></div>`;
            } else if (el.type === "image") {
               content = `<img src="${el.src}" style="width:${el.width||200}px; height:${el.height||'auto'}; object-fit:contain; pointer-events:none;" />`;
            } else if (el.type === "icon") {
               content = `<div style="font-size:${el.fontSize||40}px; display:flex; align-items:center; justify-content:center;">${el.icon}</div>`;
            }
            return `<div style="position:absolute; left:${el.x}px; top:${el.y}px;">${content}</div>`;
          }).join('')}
        </div>
      `;
    };

    const proposalHTML = proposal.slides.map(slide => {
      const t = THEMES.find(x=>x.name===proposal.theme)||THEMES[0];
      const elementsHTML = getElementsHTML(slide.elements);
      
      // Generate HTML for different slide types
      if (slide.type === "cover") {
        return `
          <div style="page-break-after: always; min-height: 100vh; display: flex; flex-direction: column; justify-content: flex-end; position: relative; background: linear-gradient(150deg,${t.p}dd 0%,rgba(0,0,0,0.85) 60%,rgba(0,0,0,0.5) 100%); color: white; padding: 48px 56px;">
            <div style="position: absolute; inset: 0; background: url('${slide.coverImage || ''}') center/cover; z-index: -2;"></div>
            <div style="position: absolute; inset: 0; background: linear-gradient(150deg,${t.p}dd 0%,rgba(0,0,0,0.85) 60%,rgba(0,0,0,0.5) 100%); z-index: -1;"></div>
            <h1 style="font-size: 48px; font-weight: 900; margin-bottom: 16px; line-height: 1.05;">${slide.title}</h1>
            <p style="font-size: 16px; color: rgba(255,255,255,0.7); margin-bottom: 28px;">${slide.subtitle}</p>
            ${elementsHTML}
          </div>
        `;
      }
      
      if (slide.type === "overview" || slide.type === "closing") {
        return `
          <div style="page-break-after: always; min-height: 100vh; padding: 56px; display: flex; flex-direction: column; justify-content: center; position: relative;">
            <div style="width: 56px; height: 6px; background: ${t.g}; border-radius: 3px; margin-bottom: 20px;"></div>
            <h1 style="font-size: 36px; font-weight: 800; color: #0f172a; margin-bottom: 24px; letter-spacing: -0.5px; line-height: 1.1;">${slide.heading}</h1>
            <p style="font-size: 15px; color: #4b5563; line-height: 1.9; max-width: 620px; white-space: pre-wrap;">${slide.body}</p>
            ${elementsHTML}
          </div>
        `;
      }
      
      if (slide.type === "objectives") {
        return `
          <div style="page-break-after: always; min-height: 100vh; padding: 56px; position: relative;">
            <div style="width: 56px; height: 6px; background: ${t.g}; border-radius: 3px; margin-bottom: 20px;"></div>
            <h1 style="font-size: 36px; font-weight: 800; color: #0f172a; margin-bottom: 24px; letter-spacing: -0.5px; line-height: 1.1;">${slide.heading}</h1>
            <div style="display: flex; flex-direction: column; gap: 14px;">
              ${slide.items.map((item, i) => `
                <div style="display: flex; gap: 18px; align-items: flex-start; padding: 16px 22px; background: ${t.l}; border-radius: 14px; border: 1px solid ${t.p}20;">
                  <div style="width: 36px; height: 36px; border-radius: 50%; background: ${t.g}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px; flex-shrink: 0;">${i+1}</div>
                  <div style="flex: 1; font-size: 14px; color: #1e293b; font-weight: 600; padding-top: 6px;">${item}</div>
                </div>
              `).join('')}
            </div>
            ${elementsHTML}
          </div>
        `;
      }
      
      if (slide.type === "proposal") {
        return `
          <div style="page-break-after: always; min-height: 100vh; padding: 40px 60px; background: #fff; font-size: 14px; line-height: 1.5; color: #000; position: relative;">
            <!-- Header with Logo -->
            <div style="text-align: center; margin-bottom: 25px;">
              <div style="font-size: 26px; font-weight: 800; color: #ff0000; letter-spacing: 2px; margin-bottom: 5px; text-transform: uppercase;">${slide.companyName || "IDES ARCHITECTS"}</div>
              <div style="display: inline-block; background: #ff0000; color: white; padding: 6px 18px; font-weight: 900; font-size: 20px; border-radius: 4px; margin-bottom: 8px;">i des</div>
              <div style="font-size: 14px; font-weight: 700; color: #444; letter-spacing: 1px;">ARCHITECTURE • INTERIORS • DESIGN SERVICES</div>
            </div>

            <!-- Reference and Date -->
            <div style="text-align: right; margin-bottom: 20px;">
              <div>Ref: ${slide.refNo}</div>
              <div>Dated: ${slide.date}</div>
            </div>

            <!-- Recipient Information -->
            <div style="margin-bottom: 20px;">
              <div style="font-weight: bold;">To</div>
              <div>${slide.clientName},</div>
              <div>${slide.clientAddress}..</div>
            </div>

            <!-- Salutation -->
            <div style="margin-bottom: 20px;">
              <div>Dear Sir,</div>
            </div>

            <!-- Subject -->
            <div style="margin-bottom: 20px;">
              <div style="font-weight: bold;">
                Sub: Offer for Architectural consultancy & PMC(Project Management Consultancy) Service for the proposed ${slide.projectType} @ ${slide.clientAddress.replace('..', '')},CHENNAI.
              </div>
            </div>

            <!-- Body -->
            <div style="margin-bottom: 20px;">
              <div>I here by express my sincere thanks for giving us the opportunity to design the proposed <span style="font-weight: bold;">${slide.projectType}</span>. In this connection we would like to inform you about the scope of our work in this regard for your kind perusal.</div>
            </div>

            <!-- Scope of Work -->
            <div style="margin-bottom: 20px;">
              <div style="font-weight: bold; text-decoration: underline;">1.0 SCOPE OF WORK:</div>
              <div style="margin-left: 20px;">
                <div>${slide.companyName} will provide services in the following stages as follows:</div>
                ${slide.scopeOfWork.map(item => `<div style="margin-left: 16px; margin-bottom: 4px;">• ${item}</div>`).join('')}
              </div>
            </div>

            <!-- Concept Stage -->
            <div style="margin-bottom: 20px;">
              <div style="font-weight: bold; text-decoration: underline;">2.0 CONCEPT STAGE:</div>
              <div style="margin-left: 20px;">
                ${slide.conceptStage.map(item => `<div style="margin-left: 16px; margin-bottom: 4px;">• ${item}</div>`).join('')}
              </div>
            </div>

            <!-- Site Visits -->
            <div style="margin-bottom: 24px;">
              <div style="font-weight: bold; text-decoration: underline;">3.0 SITE VISITS:</div>
              <div style="margin-left: 16px; margin-top: 8px;">
                ${(slide.siteVisits || []).map(item => `<div style="margin-left: 16px; margin-bottom: 4px;">• ${item}</div>`).join('')}
              </div>
            </div>

            <!-- Fee Structure -->
            <div style="margin-bottom: 24px;">
              <div style="font-weight: bold; text-decoration: underline;">5.0 FEE STRUCTURE:</div>
              <div style="margin-left: 16px; margin-top: 8px;">
                ${(slide.feeStructure || []).map(item => `<div style="margin-left: 16px; margin-bottom: 4px;">• ${item}</div>`).join('')}
              </div>
            </div>

            <!-- Stages of Payment -->
            <div style="margin-bottom: 32px;">
              <div style="font-weight: bold; text-decoration: underline;">6.0 STAGES OF PAYMENT:</div>
              <div style="margin-left: 16px; margin-top: 8px;">
                ${(slide.stagesOfPayment || []).map(item => `<div style="margin-left: 16px; margin-bottom: 4px;">• ${item}</div>`).join('')}
              </div>
            </div>

            <!-- Signatures -->
            <div style="margin-top: 60px; display: flex; justify-content: space-between;">
              <div style="font-weight: bold;">
                <div>For ${slide.companyName || ""}</div>
                <div style="margin-top: 50px;">(Authorised Signatory)</div>
              </div>
              <div style="font-weight: bold; text-align: center;">
                <div style="margin-top: 50px;">(Client Signature)</div>
              </div>
            </div>

            <!-- Footer -->
            <div style="position: fixed; bottom: 20mm; left: 20mm; right: 20mm; text-align: center; font-size: 10px; color: #666; border-top: 2px solid #ff0000; padding-top: 8px;">
              ${slide.companyAddress || ""}
            </div>
            ${elementsHTML}
          </div>
        `;
      }
      
      // Default slide handling
      return `
        <div style="page-break-after: always; min-height: 100vh; padding: 56px; display: flex; flex-direction: column; justify-content: center; position: relative;">
          <h1 style="font-size: 36px; font-weight: 800; color: #0f172a; margin-bottom: 24px;">${slide.heading || 'Slide'}</h1>
          <p style="font-size: 15px; color: #4b5563; line-height: 1.9; white-space: pre-wrap;">${slide.body || ''}</p>
          ${elementsHTML}
        </div>
      `;
    }).join("");

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${proposal.title} - Proposal</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: white; font-family: Arial, sans-serif; }
            @page { size: A4; margin: 0; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${proposalHTML}
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  const duplicateSlide = (i) => {
    const s = {...doc.slides[i], id:uid()};
    const slides = [...doc.slides]; slides.splice(i+1,0,s);
    setDoc({...doc,slides}); setPage(i+1);
  }

  const canEdit = doc && (doc.status==="draft"||doc.status==="rejected");
  const th = doc ? (THEMES.find(x=>x.name===doc.theme)||THEMES[0]) : THEMES[0];
  const zf = zoom/100;

  // ══ LIST VIEW ══════════════════════════════════════════════════════════════
  if(view==="list") return (
    <div style={{fontFamily:"'Outfit',sans-serif",minHeight:"100%",background:"#f8fafc",padding:"24px"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');.pc{transition:all .3s cubic-bezier(0.4, 0, 0.2, 1);cursor:pointer;}.pc:hover{transform:translateY(-8px) scale(1.02);box-shadow:0 25px 60px rgba(0,0,0,0.15)!important;}.pc:hover .pci{transform:scale(1.08);}.pci{transition:transform .5s cubic-bezier(0.4, 0, 0.2, 1);}.hb:hover{opacity:.9;transform:translateY(-2px) scale(1.05);}.hb:active{transform:translateY(0) scale(0.98);}@keyframes fadeIn{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}.fade-in{animation:fadeIn 0.6s ease-out;}`}</style>
      
      {/* Header Section */}
      <div style={{background:"linear-gradient(135deg,#667eea 0%,#764ba2 100%)",borderRadius:"24px",padding:"32px",marginBottom:"32px",boxShadow:"0 20px 40px rgba(102,126,234,0.2)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"0",right:"0",width:"200px",height:"200px",background:"rgba(255,255,255,0.1)",borderRadius:"50%",transform:"translate(50px,-50px)"}}/>
        <div style={{position:"absolute",bottom:"0",left:"0",width:"150px",height:"150px",background:"rgba(255,255,255,0.08)",borderRadius:"50%",transform:"translate(-30px,30px)"}}/>
        
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative",zIndex:1,flexWrap:"wrap",gap:20}}>
          <div style={{flex:1,minWidth:"250px"}}>
            <h1 style={{margin:0,fontSize:32,fontWeight:900,color:"#fff",marginBottom:8,textShadow:"0 2px 4px rgba(0,0,0,0.1)"}}>Project Proposals</h1>
            <p style={{margin:0,fontSize:16,color:"rgba(255,255,255,0.9)",fontWeight:500}}>Create, manage and track your professional proposals</p>
            <div style={{display:"flex",gap:16,marginTop:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,color:"rgba(255,255,255,0.8)",fontSize:14}}>
                <div style={{width:"8px",height:"8px",background:"#10b981",borderRadius:"50%"}}/>
                <span>{proposals.length} Total</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,color:"rgba(255,255,255,0.8)",fontSize:14}}>
                <div style={{width:"8px",height:"8px",backgroundColor:"#f59e0b",borderRadius:"50%"}}/>
                <span>{proposals.filter(p=>p.status==="pending").length} Pending</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,color:"rgba(255,255,255,0.8)",fontSize:14}}>
                <div style={{width:"8px",height:"8px",background:"#10b981",borderRadius:"50%"}}/>
                <span>{proposals.filter(p=>p.status==="approved").length} Approved</span>
              </div>
            </div>
          </div>
          <button className="hb" onClick={createNew} style={{background:"rgba(255,255,255,0.2)",backdropFilter:"blur(10px)",color:"#fff",border:"2px solid rgba(255,255,255,0.3)",borderRadius:16,padding:"16px 32px",fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 32px rgba(0,0,0,0.1)",transition:"all .3s",minWidth:"180px",justifyContent:"center"}}>
            <span style={{fontSize:20}}>✨</span>
            <span>Add Proposal</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:"100px 20px",background:"#fff",borderRadius:24,border:"1px solid #e2e8f0",boxShadow:"0 10px 30px rgba(0,0,0,0.05)"}}>
          <div style={{fontSize:50,marginBottom:20,animation:"pulse 2s infinite"}}>📡</div>
          <div style={{fontSize:18,fontWeight:600,color:"#64748b",marginBottom:8}}>Loading your proposals...</div>
          <div style={{fontSize:14,color:"#94a3b8"}}>This will only take a moment</div>
        </div>
      ) : proposals.length===0 ? (
        <div style={{textAlign:"center",padding:"100px 40px",background:"#fff",borderRadius:24,border:"2px dashed #e2e8f0",boxShadow:"0 10px 30px rgba(0,0,0,0.05)"}}>
          <div style={{fontSize:80,marginBottom:24,background:"linear-gradient(135deg,#667eea,#764ba2)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>✨</div>
          <div style={{fontSize:24,fontWeight:800,color:"#0f172a",marginBottom:12}}>No proposals yet</div>
          <div style={{fontSize:16,color:"#64748b",marginBottom:24,maxWidth:"400px",marginLeft:"auto",marginRight:"auto"}}>Start by creating your first professional proposal. It's quick and easy!</div>
          <button onClick={createNew} style={{background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",borderRadius:16,padding:"16px 32px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 8px 24px rgba(102,126,234,0.3)",transition:"all .3s",display:"inline-flex",alignItems:"center",gap:10}}>
            <span>🚀</span>
            <span>Create Your First Proposal</span>
          </button>
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:24}}>
          {proposals.map((p, index) => {
              const cover=p.slides?.find(s=>s.type==="cover");
              const t2=THEMES.find(x=>x.name===p.theme)||THEMES[0];
              return (
                <div key={p.id} className="pc fade-in" onClick={()=>openDoc(p)} style={{background:"#fff",borderRadius:20,border:"1px solid #e2e8f0",overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.08)",position:"relative",animationDelay:`${index * 0.1}s`}}>
                  {/* Status Badge */}
                  <div style={{position:"absolute",top:16,right:16,zIndex:10}}>
                    <Badge status={p.status}/>
                  </div>
                  
                  {/* Cover Image */}
                  <div style={{height:200,overflow:"hidden",position:"relative"}}>
                    {cover?.coverImage ? <img src={cover.coverImage} className="pci" alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <div style={{width:"100%",height:"100%",background:`linear-gradient(135deg,${t2.p},${t2.g})`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:48,opacity:0.3}}>📄</span>
                    </div>}
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.8),rgba(0,0,0,0.2))"}}/>
                    <div style={{position:"absolute",bottom:20,left:20,right:20}}>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",fontWeight:700,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>{p.id}</div>
                      <div style={{fontSize:20,fontWeight:900,color:"#fff",lineHeight:1.2,marginBottom:4}}>{p.title}</div>
                      <div style={{fontSize:13,color:"rgba(255,255,255,0.8)",fontWeight:500}}>{p.client||"No client assigned"}</div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div style={{padding:"20px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{background:"#f1f5f9",padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600,color:"#475569"}}>
                          📊 {p.slides?.length||0} slides
                        </div>
                        <div style={{background:t2.l,padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600,color:t2.t}}>
                          🎨 {t2.name}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:16,borderTop:"1px solid #f1f5f9"}}>
                      <div style={{fontSize:12,color:"#94a3b8",fontWeight:500}}>
                        {new Date(p.updated).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={e=>{e.stopPropagation(); printProposal(p);}} style={{background:"#eff6ff",border:"none",color:"#3b82f6",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}} title="Print Proposal">🖨️</button>
                        <button onClick={e=>deleteProposal(p.id,p._id,e)} style={{background:"#fef2f2",border:"none",color:"#ef4444",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}} title="Delete Proposal">🗑️</button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Rejection Note */}
                  {p.status==="rejected"&&p.rejectNote&&(
                    <div style={{padding:"12px 20px",background:"#fef2f2",borderTop:"1px solid #fecaca"}}>
                      <span style={{fontSize:12,color:"#991b1b",fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                        <span>❌</span>
                        <span>{p.rejectNote}</span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
      )}
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
              style={{width:"100%",height:120,borderRadius:12,border:"2px solid #e2e8f0",padding:"14px 18px",fontSize:15,fontFamily:"inherit",outline:"none",boxSizing:"border-box",resize:"vertical",color:"#0f172a",transition:"border-color 0.2s",minHeight:100}}/>
            <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
              <button onClick={()=>{setRejectModal(false);setRejectReason("");}} style={{background:"#f1f5f9",border:"none",borderRadius:10,padding:"10px 22px",fontSize:14,fontWeight:600,cursor:"pointer",color:"#475569",fontFamily:"inherit"}}>Cancel</button>
              <button onClick={()=>{setStatus("rejected",{rejectNote:rejectReason||"Please review and resubmit."});setRejectModal(false);setRejectReason("");}} style={{background:"linear-gradient(135deg,#9f1239,#ef4444)",color:"#fff",border:"none",borderRadius:10,padding:"10px 22px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* ╔══ TOP BAR (Canva style) ══╗ */}
      <div style={{height:56,background:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",borderBottom:"1px solid #e5e7eb",flexShrink:0,gap:12,zIndex:50}}>
        
        {/* LEFT: logo + File/Resize/Editing */}
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <button onClick={()=>{saveDoc();setView("list");}} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,padding:"6px",borderRadius:8,transition:"background .15s"}} title="Home" className="topbtn">🏠</button>
          
          {/* 🚀 QUICK ADD PROPOSAL BUTTON */}
          <button 
            onClick={()=>{saveDoc(); createNew();}} 
            style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:"0 4px 12px rgba(124,58,237,0.25)",transition:"all 0.2s"}}
          >
            ✨ Add Proposal
          </button>

          <button className="topbtn" style={{background:"none",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,color:"#374151",padding:"6px 10px",borderRadius:8}}>File</button>
          <div style={{position:"relative"}}>
            <button className="topbtn" onClick={()=>setShowResizeMenu(!showResizeMenu)} style={{background:showResizeMenu?"#f1f5f9":"none",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,color:"#374151",padding:"6px 10px",borderRadius:8}}>Resize</button>
            {showResizeMenu && (
              <div style={{position:"absolute",top:"100%",left:0,marginTop:4,background:"#fff",borderRadius:8,boxShadow:"0 10px 25px rgba(0,0,0,0.1)",overflow:"hidden",zIndex:1000,border:"1px solid #e5e7eb",width:180}}>
                <button onClick={()=>changeFormat("a4-portrait")} style={{width:"100%",padding:"10px 16px",textAlign:"left",background:"none",border:"none",fontSize:13,fontWeight:600,color:doc?.format==="a4-portrait"?"#7d2ae8":"#374151",cursor:"pointer",display:"block",borderTop:"1px solid #f1f5f9"}} className="topbtn">📄 A4 Portrait</button>
                <button onClick={()=>changeFormat("a4-landscape")} style={{width:"100%",padding:"10px 16px",textAlign:"left",background:"none",border:"none",fontSize:13,fontWeight:600,color:doc?.format==="a4-landscape"?"#7d2ae8":"#374151",cursor:"pointer",display:"block",borderTop:"1px solid #f1f5f9"}} className="topbtn">🖼️ A4 Landscape</button>
              </div>
            )}
          </div>
          <div style={{width:1,height:24,background:"#e5e7eb",margin:"0 4px"}}/>
          <div style={{display:"flex",gap:4,color:"#6b7280"}}>
            <button className="topbtn" style={{background:"none",border:"none",cursor:"pointer",fontSize:18,padding:"4px 8px",borderRadius:6,display:"flex"}} title="Undo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
            </button>
            <button className="topbtn" style={{background:"none",border:"none",cursor:"pointer",fontSize:18,padding:"4px 8px",borderRadius:6,display:"flex"}} title="Redo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14l5-5-5-5"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
            </button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:8,color:"#10b981",fontSize:12,fontWeight:600}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            <span>All changes saved</span>
          </div>
        </div>

        {/* CENTER: editable title & client selector */}
        <div style={{flex:1,display:"flex",justifyContent:"center",gap:16,alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,background:"#f1f5f9",padding:"4px 12px",borderRadius:8,maxWidth:300}}>
            <input value={doc.title} onChange={e=>setDoc({...doc,title:e.target.value})} disabled={!canEdit}
              style={{background:"none",border:"none",fontSize:13,fontWeight:700,color:"#0f172a",outline:"none",textAlign:"center",width:"100%",fontFamily:"inherit"}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,background:"#f3e8ff",padding:"4px 12px",borderRadius:8,border:"1px solid #c084fc"}}>
            <span style={{fontSize:11,fontWeight:800,color:"#7c3aed"}}>FOR CLIENT:</span>
            <select 
              value={doc.client || ""} 
              onChange={e=>{const nd={...doc,client:e.target.value}; setDoc(nd); persist(nd);}}
              disabled={!canEdit}
              style={{background:"none",border:"none",fontSize:12,fontWeight:700,color:"#7c3aed",outline:"none",cursor:"pointer"}}
            >
              <option value="">-- Select Client --</option>
              {clientsData.map(c=>(
                <option key={c._id} value={c.name||c.clientName}>{c.name||c.clientName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* RIGHT: status actions + share */}
        <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        
          
          <div style={{width:1,height:24,background:"#e5e7eb"}}/>

          {doc.status==="draft" || doc.status==="rejected" ? (
             <button onClick={()=>setStatus("pending")} style={{background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",border:"none",padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
               {doc.status==="rejected" ? "🔄 Resubmit Proposal" : "📤 Submit for Approval"}
             </button>
          ) : doc.status==="pending" ? (
             <span style={{fontSize:13,fontWeight:800,color:"#f59e0b",padding:"0 10px",display:"flex",alignItems:"center",gap:6}}>
               ⏳ Waiting for client approval...
             </span>
          ) : (
             <span style={{fontSize:13,fontWeight:800,color:"#10b981",padding:"0 10px",display:"flex",alignItems:"center",gap:6}}>
               ✅ Approved!
             </span>
          )}
          {/* 🖨️ PRINT BUTTON */}
{/* 🖨️ PRINT BUTTON - Replaced inline print and directly reusing the proper printProposal function */}
<button onClick={() => printProposal(doc)}
  style={{
    background: "#fff",
    color: "#374151",
    border: "1.5px solid #e2e8f0",
    padding: "8px 16px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: 6,
  }}
>
  🖨️ Print
</button>
          <button onClick={()=>saveDoc()} style={{background:"#7d2ae8",color:"#fff",border:"none",padding:"8px 20px",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 12px rgba(125,42,232,0.2)"}}>Share/Save</button>
          
          <div style={{width:32,height:32,borderRadius:"50%",background:"#eee",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#666",border:"2px solid #fff",boxShadow:"0 0 0 1px #e2e8f0"}}>U</div>
        </div>
      </div>

      {/* ╔══ BODY ══╗ */}
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* ── ICON SIDEBAR (Canva left icon rail) ── */}
        <div style={{width:72,background:"#f8f5ff",borderRight:"1px solid #e5e7eb",display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 0",gap:4,flexShrink:0}}>
          {[
            {id:"templates", icon:"🎨", label:"Design"},
            {id:"elements",  icon:"✦",  label:"Elements"},
            {id:"text",      icon:"T",  label:"Text"},
            {id:"uploads",   icon:"☁️", label:"Uploads"}
          ].map(item=> (
            <button key={item.id} onClick={()=>setLeftPanel(leftPanel===item.id?"":item.id)}
              style={{width:64,height:64,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,background:leftPanel===item.id?"rgba(124,58,237,0.15)":"none",border:"none",borderRadius:8,cursor:"pointer",transition:"all .15s",color:leftPanel===item.id?"#7c3aed":"#4b5563"}}>
              <span style={{fontSize:24}}>{item.icon}</span>
              <span style={{fontSize:9,fontWeight:600,letterSpacing:0.3,opacity:leftPanel===item.id?1:0.5,textAlign:"center",color:"#6b7280"}}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
        {/* ── LEFT CONTENT PANEL ── */}
        {leftPanel && (
          <div style={{width:320,background:"#fff",borderRight:"1px solid #e5e7eb",display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden"}}>

            {/* DESIGN (Templates + Styles) */}
            {leftPanel==="templates" && <>
              <div style={{padding:"16px",borderBottom:"1px solid #f1f5f9"}}>
                <div style={{fontSize:18,fontWeight:800,color:"#111827",marginBottom:16}}>Design</div>
                <div style={{position:"relative", marginBottom:16}}>
                   <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search elements"
                    style={{width:"100%",boxSizing:"border-box",border:"1.5px solid #e5e7eb",borderRadius:12,padding:"12px 14px 12px 40px",fontSize:14,outline:"none",fontFamily:"inherit",color:"#374151",background:"#f9fafc"}}/>
                   <span style={{position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:16, color:"#9ca3af"}}>🔍</span>
                </div>
                <div style={{display:"flex",gap:8,background:"#f3f4f6",padding:"4px",borderRadius:10}}>
                  <button style={{flex:1,padding:"8px",background:"#fff",borderRadius:8,fontSize:13,fontWeight:600,border:"none",boxShadow:"0 1px 3px rgba(0,0,0,0.1)",color:"#111827"}}>Templates</button>
                  <button style={{flex:1,padding:"8px",background:"none",borderRadius:8,fontSize:13,fontWeight:600,border:"none",color:"#6b7280"}}>Styles</button>
                </div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"12px",display:"flex",flexDirection:"column",gap:12}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {[
                    { id: "tmpl1", src: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&q=80", label: "Project presentation" },
                    { id: "tmpl2", src: "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=400&q=80", label: "Business Presentation" },
                    { id: "tmpl3", src: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=400&q=80", label: "Project Presentation" },
                    { id: "tmpl4", src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80", label: "Company Profile" },
                    { id: "tmpl5", src: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80", label: "Brand Guideline" },
                    { id: "tmpl6", src: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80", label: "Startup Pitch Deck" },
                    { id: "tmpl7", src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80", label: "Creative Portfolio" },
                    { id: "tmpl8", src: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&q=80", label: "Finance Presentation" }
                  ].map(tmpl=>(
                    <div key={tmpl.id} onClick={()=>{
                      if(canEdit) {
                         const s = makeSlide("cover", doc.theme);
                         s.coverImage = tmpl.src;
                         const slides = [...doc.slides, s];
                         setDoc({...doc, slides}); 
                         setPage(slides.length-1); 
                         flash("✨ Template added!");
                      }
                    }}
                      style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,overflow:"hidden",cursor:canEdit?"pointer":"not-allowed",transition:"all .2s",position:"relative"}} className="pgthumb">
                      <div style={{aspectRatio:"16/9", overflow:"hidden", width:"100%"}}>
                         <img src={tmpl.src} alt={tmpl.label} style={{width:"100%", height:"100%", objectFit:"cover"}} />
                         <div style={{position:"absolute", inset:0, background:"rgba(0,0,0,0.3)", display:"flex", alignItems:"flex-end", padding:"8px"}}>
                            <span style={{color:"#fff", fontSize:11, fontWeight:700, textShadow:"0 1px 2px rgba(0,0,0,0.8)"}}>{tmpl.label}</span>
                         </div>
                      </div>
                      {/* Hover Overlay */}
                      <div style={{position:"absolute",inset:0,background:"rgba(125,42,232,0.15)",opacity:0,transition:"opacity .2s"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0}/>
                    </div>
                  ))}
                </div>

                <div style={{fontSize:13,fontWeight:700,color:"#0f172a",margin:"12px 0 4px"}}>Layouts</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12}}>
                  {SLIDE_TYPES.map(tmpl=>{
                    const isP = doc.format === "a4-portrait" || (!doc.format && (tmpl.id === "proposal" || tmpl.id === "portrait"));
                    const isL = doc.format === "a4-landscape" || (!doc.format && tmpl.id === "landscape");
                    const h = isP ? 1273 : isL ? 637 : 506;
                    const ar = isP ? "210/297" : isL ? "297/210" : "16/9";
                    
                    return (
                    <div key={tmpl.id} onClick={()=>canEdit&&addSlide(tmpl.id)}
                      style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,overflow:"hidden",cursor:canEdit?"pointer":"not-allowed",transition:"all .2s",position:"relative"}} className="pgthumb">
                      <div style={{aspectRatio:ar, overflow:"hidden", width:"100%"}}>
                        <div style={{transform:`scale(${isP ? 294/900 : 294/900})`,transformOrigin:"top left",width:900,height:h,pointerEvents:"none"}}>
                          <Slide slide={makeSlide(tmpl.id, doc.theme)} theme={doc.theme} docFormat={doc.format} editing={false} onChange={()=>{}} preview/>
                        </div>
                      </div>
                      <div style={{padding:"8px 12px",fontSize:12,fontWeight:700,color:"#0f172a",background:"#fff",borderTop:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span>{tmpl.label}</span>
                        <span style={{fontSize:10,color:"#94a3b8"}}>{tmpl.id}</span>
                      </div>
                      <div style={{position:"absolute",inset:0,background:"rgba(125,42,232,0.05)",opacity:0,transition:"opacity .2s"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0}/>
                    </div>
                  )})}
                </div>
              </div>
            </>}

            {/* ELEMENTS */}
            {leftPanel==="elements" && <>
              <div style={{padding:"16px", borderBottom:"1px solid #f1f5f9"}}>
                <div style={{fontSize:18,fontWeight:800,color:"#111827",marginBottom:16}}>Elements</div>
                <div style={{position:"relative"}}>
                   <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search elements"
                    style={{width:"100%",boxSizing:"border-box",border:"1.5px solid #e5e7eb",borderRadius:12,padding:"12px 14px 12px 40px",fontSize:14,outline:"none",fontFamily:"inherit",color:"#374151",background:"#f9fafc"}}/>
                   <span style={{position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:16, color:"#9ca3af"}}>🔍</span>
                </div>
              </div>

              <div style={{flex:1, overflowY:"auto", padding:"16px", display: "flex", flexDirection: "column", gap: 20}}>
                
                {/* Shapes */}
                <div>
                  <div style={{fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12}}>Shapes</div>
                  <div style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10}}>
                    <div onClick={() => addElement({type:"shape", shape:"circle", width:100, height:100, color:"#94a3b8"})} style={{aspectRatio:"1", background:"#e2e8f0", borderRadius:"50%", cursor:"pointer", transition:"all .2s"}} className="sib"/>
                    <div onClick={() => addElement({type:"shape", shape:"rectangle", width:120, height:100, color:"#94a3b8"})} style={{aspectRatio:"1", background:"#e2e8f0", borderRadius:4, cursor:"pointer", transition:"all .2s"}} className="sib"/>
                    <div onClick={() => addElement({type:"shape", shape:"rounded-rectangle", width:120, height:100, borderRadius: 20, color:"#94a3b8"})} style={{aspectRatio:"1", background:"#e2e8f0", borderRadius:20, cursor:"pointer", transition:"all .2s"}} className="sib"/>
                    <div onClick={() => addElement({type:"shape", shape:"square", width:100, height:100, color:"#94a3b8"})} style={{aspectRatio:"1", background:"#e2e8f0", borderRadius:0, cursor:"pointer", transition:"all .2s"}} className="sib"/>
                  </div>
                </div>

                {/* Photos */}
                <div>
                   <div style={{fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12}}>Photos</div>
                   <div style={{display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10}}>
                     {[
                       "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&q=80",
                       "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80",
                       "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&q=80",
                       "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80"
                     ].map((url, i) => (
                       <img key={i} src={url} alt="" onClick={() => addElement({type:"image", src:url, width:250})} style={{width: "100%", borderRadius: 6, cursor: "pointer", transition:"transform .1s"}} className="pgthumb"/>
                     ))}
                   </div>
                </div>

                {/* Graphics */}
                <div>
                   <div style={{fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12}}>Graphics</div>
                   <div style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10}}>
                     {["⭐", "❤️", "👍", "🔥", "🚀", "💡", "🎯", "📈"].map((emoji, i) => (
                       <div key={i} onClick={() => addElement({type:"icon", icon:emoji, fontSize:80})} style={{fontSize: 30, textAlign: "center", cursor: "pointer", background: "#f1f5f9", borderRadius: 8, padding: 8, transition:"all .2s"}} className="sib">
                         {emoji}
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </>}

            {/* TEXT */}
            {leftPanel==="text" && <>
              <div style={{padding:"16px",borderBottom:"1px solid #f1f5f9"}}>
                <div style={{fontSize:18,fontWeight:800,color:"#0f172a",marginBottom:16}}>Text</div>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"#9ca3af"}}>🔍</span>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search fonts and combinations"
                    style={{width:"100%",boxSizing:"border-box",border:"1px solid #e2e8f0",borderRadius:12,padding:"10px 14px 10px 40px",fontSize:14,outline:"none",fontFamily:"inherit",color:"#374151",background:"#f8fafc"}}/>
                </div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:20}}>
                
                <button onClick={()=>addElement({type:"text", val:"New Text Box", fontSize:18, fontWeight:500})} style={{background:"#8b5cf6",color:"#fff",border:"none",borderRadius:8,padding:"14px",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(139,92,246,0.25)",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.2s"}} className="hb" onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
                  <span style={{fontSize:18}}>T</span> Add a text box
                </button>

                <div onClick={()=>flash("🪄 Magic Write: Generating AI content...")} style={{background:"linear-gradient(135deg,#7d2ae8,#ff6b6b)",borderRadius:12,padding:"16px",color:"#fff",cursor:"pointer",boxShadow:"0 4px 12px rgba(125,42,232,0.15)",position:"relative",overflow:"hidden"}} className="hb">
                  <div style={{fontSize:14,fontWeight:700,display:"flex",alignItems:"center",gap:8,position:"relative",zIndex:1}}>🪄 Magic Write</div>
                  <div style={{fontSize:11,opacity:0.9,marginTop:4,position:"relative",zIndex:1}}>Generate text with AI</div>
                  <div style={{position:"absolute",right:-10,bottom:-10,fontSize:40,opacity:0.2,transform:"rotate(-15deg)"}}>✨</div>
                </div>

                <div>
                  <div style={{fontSize:11,color:"#6b7280",fontWeight:700,marginBottom:12,textTransform:"uppercase",letterSpacing:0.8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span>Brand Kit</span>
                    <button style={{background:"none",border:"none",color:"#8b5cf6",fontSize:11,fontWeight:700,cursor:"pointer",padding:0}}>Edit 👑</button>
                  </div>
                  <button style={{width:"100%",background:"#fff",border:"1.5px dashed #d1d5db",borderRadius:8,padding:"12px",textAlign:"center",color:"#4b5563",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}} className="topbtn">
                    Add your brand fonts
                  </button>
                </div>
                
                <div>
                  <div style={{fontSize:11,color:"#6b7280",fontWeight:700,marginBottom:12,textTransform:"uppercase",letterSpacing:0.8}}>Default text styles</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    <button onClick={()=>addElement({type:"text", val:"Add a heading", fontSize:32, fontWeight:800})} style={{width:"100%",background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"16px",textAlign:"left",cursor:"pointer",transition:"all 0.15s"}} className="hb">
                      <div style={{fontSize:24,fontWeight:800,color:"#111827"}}>Add a heading</div>
                    </button>
                    <button onClick={()=>addElement({type:"text", val:"Add a subheading", fontSize:24, fontWeight:700})} style={{width:"100%",background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"14px",textAlign:"left",cursor:"pointer",transition:"all 0.15s"}} className="hb">
                      <div style={{fontSize:18,fontWeight:700,color:"#374151"}}>Add a subheading</div>
                    </button>
                    <button onClick={()=>addElement({type:"text", val:"Add a little bit of body text", fontSize:16, fontWeight:400})} style={{width:"100%",background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"12px",textAlign:"left",cursor:"pointer",transition:"all 0.15s"}} className="hb">
                      <div style={{fontSize:14,color:"#4b5563"}}>Add a little bit of body text</div>
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{fontSize:11,color:"#6b7280",fontWeight:700,marginBottom:12,textTransform:"uppercase",letterSpacing:0.8}}>Dynamic text</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div onClick={()=>flash("Page number placeholder added")} style={{background:"#f9fafb",borderRadius:10,padding:"16px",textAlign:"center",cursor:"pointer",border:"1.5px solid #e5e7eb",transition:"all 0.15s"}} className="sib">
                       <div style={{fontSize:20,marginBottom:4}}>🔟</div>
                       <div style={{fontSize:11,fontWeight:600,color:"#374151"}}>Page numbers</div>
                    </div>
                  </div>
                </div>
              </div>
            </>}
            
            {/* UPLOADS */}
            {leftPanel==="uploads" && <>
              <div style={{padding:"16px",borderBottom:"1px solid #f1f5f9"}}>
                <div style={{fontSize:18,fontWeight:800,color:"#111827",marginBottom:16}}>Uploads</div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{width:"100%",background:"#8b5cf6",color:"#fff",border:"none",borderRadius:8,padding:"14px",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(139,92,246,0.25)",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.2s"}}
                >
                  {uploading ? (
                    <div style={{width:16,height:16,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}} />
                  ) : "☁️"} 
                  {uploading ? "Uploading..." : "Upload files"}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleUpload} style={{display:"none"}} accept="image/*" />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
              
              <div style={{flex:1,overflowY:"auto",padding:"12px"}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                  {uploads.map(up => (
                    <div key={up._id} onClick={() => addElement({type:"image", src:up.url, width:250})}
                      style={{aspectRatio:"1", borderRadius:6, overflow:"hidden", border:"1px solid #e2e8f0", cursor:"pointer", position:"relative"}} className="pgthumb">
                      <img src={up.url} alt="" style={{width:"100%", height:"100%", objectFit:"cover"}} />
                      <div style={{position:"absolute", inset:0, background:"rgba(0,0,0,0.05)", opacity:0, transition:"opacity .2s"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0} />
                    </div>
                  ))}
                </div>
                {uploads.length === 0 && !uploading && (
                  <div style={{textAlign:"center", padding:"40px 20px", color:"#94a3b8"}}>
                    <div style={{fontSize:40, marginBottom:12}}>📥</div>
                    <div style={{fontSize:13, fontWeight:600}}>No uploads yet</div>
                    <p style={{fontSize:11}}>Uploaded images will appear here</p>
                  </div>
                )}
              </div>
            </>}
            
            {/* BRAND */}
            {leftPanel==="brand" && <>
              <div style={{padding:"16px",borderBottom:"1px solid #f1f5f9"}}>
                <div style={{fontSize:16,fontWeight:700,color:"#0f172a",marginBottom:16}}>Brand Kit</div>
                <button style={{width:"100%",background:"#7d2ae8",color:"#fff",border:"none",borderRadius:8,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(125,42,232,0.2)"}}>Set up your Brand Kit 👑</button>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:24}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:12}}>Brand Colors</div>
                  <div style={{display:"flex",gap:8}}>
                    {["#7c3aed","#10b981","#f59e0b","#ef4444","#3b82f6"].map(c=><div key={c} style={{width:40,height:40,borderRadius:"50%",background:c,cursor:"pointer",border:"2px solid transparent"}} onClick={()=>addElement({type:"shape", shape:"circle", width:100, height:100, color:c})}/>)}
                    <div style={{width:40,height:40,borderRadius:"50%",background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:"2px dashed #cbd5e1",color:"#64748b"}}>+</div>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:12}}>Brand Fonts</div>
                  <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",padding:"16px",borderRadius:8,textAlign:"center"}}>
                    <div style={{fontSize:24,fontWeight:800,marginBottom:8,fontFamily:"'Outfit',sans-serif"}}>Heading Font</div>
                    <div style={{fontSize:16,fontWeight:500,color:"#475569"}}>Body Font</div>
                  </div>
                </div>
              </div>
            </>}

            {/* TOOLS */}
            {leftPanel==="tools" && <>
              <div style={{padding:"16px",borderBottom:"1px solid #f1f5f9"}}>
                <div style={{fontSize:16,fontWeight:700,color:"#0f172a",marginBottom:16}}>Magic Studio ✨</div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:16}}>
                {[
                  {icon:"✂️", title:"Background Remover", desc:"Remove image backgrounds in 1 click"},
             
                ].map(tool=>(
                  <div key={tool.title} onClick={()=>flash(`Opening ${tool.title}...`)} style={{display:"flex",gap:12,padding:"16px",background:"linear-gradient(to right, #f8fafc, #fff)",border:"1px solid #e2e8f0",borderRadius:12,cursor:"pointer",alignItems:"center"}} className="hb">
                    <div style={{fontSize:24}}>{tool.icon}</div>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{tool.title}</div>
                      <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{tool.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>}

            {/* PROJECTS */}
            {leftPanel==="projects" && <>
              <div style={{padding:"16px",borderBottom:"1px solid #f1f5f9"}}>
                <div style={{fontSize:16,fontWeight:700,color:"#0f172a",marginBottom:16}}>Projects</div>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14}}>🔍</span>
                  <input placeholder="Search your designs" style={{width:"100%",boxSizing:"border-box",border:"1px solid #e2e8f0",borderRadius:8,padding:"10px 14px 10px 36px",fontSize:14,outline:"none",fontFamily:"inherit",background:"#f8fafc"}}/>
                </div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {proposals.map(p => (
                  <div key={p._id||p.id} onClick={()=>flash("Can't open another project while editing")} style={{cursor:"pointer",borderRadius:8,border:"1px solid #e2e8f0",overflow:"hidden",background:"#fff"}} className="pgthumb">
                    <div style={{height:70,background:THEMES.find(t=>t.name===p.theme)?.g||"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:20}}>📄</span></div>
                    <div style={{padding:"8px",fontSize:11,fontWeight:600,color:"#1e293b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.title}</div>
                  </div>
                ))}
              </div>
            </>}

            {/* APPS */}
            {leftPanel==="apps" && <>
              <div style={{padding:"16px",borderBottom:"1px solid #f1f5f9"}}>
                <div style={{fontSize:16,fontWeight:700,color:"#0f172a",marginBottom:16}}>Apps & Integrations</div>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14}}>🔍</span>
                  <input placeholder="Search apps" style={{width:"100%",boxSizing:"border-box",border:"1px solid #e2e8f0",borderRadius:8,padding:"10px 14px 10px 36px",fontSize:14,outline:"none",fontFamily:"inherit",background:"#f8fafc"}}/>
                </div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[
                  {icon:"📶", name:"QR Code"},
                  {icon:"🤖", name:"DALL·E"},
                  {icon:"📊", name:"Charts"},
                  {icon:"📁", name:"Google Drive"},
                  {icon:"▶️", name:"YouTube"},
                  {icon:"🎤", name:"AI Voice"}
                ].map(app=>(
                  <div key={app.name} onClick={()=>flash(`${app.name} app connected!`)} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:"16px 8px",textAlign:"center",cursor:"pointer"}} className="sib">
                    <div style={{fontSize:28,marginBottom:8}}>{app.icon}</div>
                    <div style={{fontSize:12,fontWeight:600,color:"#0f172a"}}>{app.name}</div>
                  </div>
                ))}
              </div>
            </>}
          </div>
        )}

        {/* ── CENTER CANVAS ── */}
        <div ref={canvasRef} onClick={()=>setSelectedElementId(null)}
          style={{flex:1,overflow:"auto",background:"#f1f5f9",display:"flex",flexDirection:"column",alignItems:"center",padding:"48px 32px",position:"relative"}}>

          {/* Slide canvas */}
          <div style={{
            width:900*(zoom/100 + 0.4), minWidth:900*0.4,
            aspectRatio: doc.format === "a4-portrait" ? "210/297" : doc.format === "a4-landscape" ? "297/210" : doc.format === "ppt" ? "16/9" : (doc.slides?.[page]?.type === "proposal" ? "210/297" : doc.slides?.[page]?.type === "portrait" ? "210/297" : doc.slides?.[page]?.type === "landscape" ? "297/210" : "16/9"),
            boxShadow:"0 12px 48px rgba(0,0,0,0.1)",borderRadius:2,overflow:"hidden",flexShrink:0,background:"#fff",transition:"width .2s ease-out"
          }}>
            <div style={{
              transform:`scale(${zoom/100 + 0.4})`, transformOrigin:"top left", width:900,
              height: doc.format === "a4-portrait" ? 1273 : doc.format === "a4-landscape" ? 637 : doc.format === "ppt" ? 506 : (doc.slides?.[page]?.type === "proposal" ? 1273 : doc.slides?.[page]?.type === "portrait" ? 1273 : doc.slides?.[page]?.type === "landscape" ? 637 : 506)
            }}>
              {doc.slides && doc.slides[page] ? (
                <Slide 
                  slide={doc.slides[page]} 
                  theme={doc.theme} 
                  docFormat={doc.format}
                  editing={canEdit} 
                  onChange={updateSlide}
                  selectedId={selectedElementId}
                  onSelectElement={setSelectedElementId}
                  onUpdateElement={updateElement}
                  onDelete={deleteElement}
                  canvasRef={canvasRef}
                />
              ) : (
                <div style={{ 
                  width: 900, 
                  height: 506, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  background: "#f8fafc",
                  color: "#64748b",
                  fontSize: 14,
                  fontWeight: 500
                }}>
                  Loading slide...
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM-RIGHT CONTROLS (Canva Style) */}
          <div style={{position:"absolute",bottom:24,right:24,display:"flex",alignItems:"center",gap:12,background:"#fff",padding:"8px 16px",borderRadius:12,boxShadow:"0 4px 20px rgba(0,0,0,0.08)",zIndex:100}}>
            <div style={{display:"flex",alignItems:"center",gap:8,borderRight:"1px solid #e5e7eb",paddingRight:12}}>
              <button onClick={()=>setPage(Math.max(0,page-1))} disabled={page===0} style={{background:"none",border:"none",cursor:page===0?"not-allowed":"pointer",color:page===0?"#cbd5e1":"#475569",fontSize:12}}>◀</button>
              <span style={{fontSize:12,fontWeight:700,color:"#1e293b",minWidth:30,textAlign:"center"}}>{page+1} / {doc.slides?.length || 0}</span>
              <button onClick={()=>setPage(Math.min((doc.slides?.length || 1)-1,page+1))} disabled={page===(doc.slides?.length || 1)-1} style={{background:"none",border:"none",cursor:page===(doc.slides?.length || 1)-1?"not-allowed":"pointer",color:page===(doc.slides?.length || 1)-1?"#cbd5e1":"#475569",fontSize:12}}>▶</button>
            </div>
            
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:11,fontWeight:700,width:32}}>{Math.round((zoom + 40))}%</span>
              <input type="range" min={0} max={60} value={zoom} onChange={e=>setZoom(+e.target.value)} style={{width:100,accentColor:"#7d2ae8"}}/>
              <button style={{background:"none",border:"none",cursor:"pointer",fontSize:13}}>⛶</button>
              <button style={{background:"none",border:"none",cursor:"pointer",fontSize:13}}>?</button>
            </div>
          </div>
        </div>
      </div>

      {/* ╔══ BOTTOM PAGE STRIP (Canva style) ══╗ */}
      <div style={{height:100,background:"#fff",borderTop:"1px solid #e5e7eb",display:"flex",alignItems:"center",padding:"0 20px",gap:16,overflowX:"auto",flexShrink:0}}>
        {doc.slides.map((s,i)=>{
          const isP = doc.format === "a4-portrait" || (!doc.format && (s.type === "proposal" || s.type === "portrait"));
          const isL = doc.format === "a4-landscape" || (!doc.format && s.type === "landscape");
          const h = isP ? 1273 : isL ? 637 : 506;
          const stripWidth = isP ? 70*(210/297) : isL ? 70*(297/210) : 124;
          
          return (
          <div key={s.id} onClick={()=>setPage(i)}
            style={{height:70,width:stripWidth,flexShrink:0,borderRadius:6,overflow:"hidden",cursor:"pointer",border:`2px solid ${i===page?"#7d2ae8":"#e2e8f0"}`,position:"relative",background:"#fff",transition:"all .2s",boxShadow:i===page?"0 0 0 2px rgba(125,42,232,0.2)":"none",transform:i===page?"scale(1.05)":"scale(1)"}}>
            <div style={{transform:`scale(${stripWidth/900})`,transformOrigin:"top left",width:900,height:h,pointerEvents:"none"}}>
              <Slide slide={s} theme={doc.theme} docFormat={doc.format} editing={false} onChange={()=>{}} preview/>
            </div>
            <div style={{position:"absolute",bottom:4,left:6,fontSize:10,fontWeight:800,color:i===page?"#7d2ae8":"#94a3b8",background:"rgba(255,255,255,0.8)",padding:"0 4px",borderRadius:4}}>{i+1}</div>
            {canEdit && doc.slides.length > 1 && (
              <button 
                onClick={(e) => {e.stopPropagation(); delSlide(i);}} 
                style={{position:"absolute",top:2,right:2,width:18,height:18,borderRadius:"50%",background:"#ef4444",border:"none",color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10}}
                title="Delete slide"
              >
                ×
              </button>
            )}
          </div>
        )})}
        <button onClick={()=>{canEdit&&addSlide("blank");}} disabled={!canEdit}
          style={{height:70,width:40,flexShrink:0,borderRadius:6,border:"2px dashed #cbd5e1",background:"none",cursor:canEdit?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",color:"#94a3b8",fontSize:24,fontWeight:300,transition:"all .15s"}}>
          <span>+</span>
        </button>
      </div>
    </div>
  );
}