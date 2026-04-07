import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

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

// ─── PRESENTATION TEMPLATES ───────────────────────────────────────────────────
const PRESENTATION_TEMPLATES = [
  { id: "proj_pres", name: "Project presentation", img: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&q=80", theme: "Cobalt" },
  { id: "business", name: "Business Presentation", img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80", theme: "Slate" },
  { id: "company", name: "Company Profile", img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80", theme: "Emerald" },
  { id: "group", name: "Group Project", img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80", theme: "Teal" },
  { id: "brand", name: "Brand Guideline", img: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80", theme: "Fuchsia" },
  { id: "startup", name: "Startup Pitch Deck", img: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&q=80", theme: "Violet" },
  { id: "creative", name: "Creative Portfolio", img: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&q=80", theme: "Amber" },
  { id: "finance", name: "Finance Presentation", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80", theme: "Rose" },
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
    case "proposal":   return {...b, 
      companyName:"IDES ARCHITECTS", 
      clientName:"DR.KARTHIK", 
      clientAddress:"ADYAR, CHENNAI",
      refNo:"16/APP INT/DR.KAR",
      date:new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
      projectType:"APARTMENT INTERIORS",
      scopeOfWork:[
        "presentation drawings",
        "3D rendering of design-1 option (for more than 2 option, additionally charged)",
        "Working Drawings, Interior Design and Furnishing",
        "Plumbing and Electrical Co-ordination Drawings",
        "Recommended List of Tiles, Electrical Fixtures and Plumbing Fixtures and various other finishes, selection only",
        "Coordination with Client, Contractor and Team",
        "INTERIOR BOQ & Costing for project",
        "Selection of specified finishing materials in the BOQ",
        "Tiling Layout drawings",
        "Wall cladding drawings",
        "Selection of Materials & Finishes"
      ],
      conceptStage:[
        "Identify client's requirement",
        "Preparation of alternative conceptual layouts",
        "Rough estimate based on floor area basis"
      ],
      companyAddress:"PLOT NO 84,SRINAGAR COLONY, KUMBAKONAM, PIN-612 001,MOBILE:9003075630"
    };
    case "proposal_page2": return {...b,
      companyName:"IDES ARCHITECTS",
      siteVisits:[
        "Two numbers of complimentary visits will be made on specific requests",
        "Additional visits other than the above stages will be charged additionally @ Rs.2,500/- per visit"
      ],
      feeStructure:[
        "Our overall professional consultancy fee for architecture services would be 8% of Estimated cost."
      ],
      stagesOfPayment:[
        "10% As an Advance",
        "15% Towards Finalization of Concept Drawings",
        "30% Towards Preparation of 3D Models",
        "25% Towards release of Good for Construction drawings",
        "15% Towards material finalization & BOQ preparation",
        "5% Towards site completion"
      ],
      companyAddress:"PLOT NO 84,SRINAGAR COLONY, KUMBAKONAM, PIN-612 001,MOBILE:9003075630"
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
    id:pid(), title:"E-Commerce Platform Redesign", client:"RetailMax Pvt Ltd",
    theme, status:"draft", format:"ppt",
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
              <div style={{width:el.width||60, height:el.height||60, background:el.background||el.color||t.p, border:el.border||"none", borderRadius:el.shape==="circle"?"50%":"4px"}} />
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
        
        {/* Header with Logo */}
      <div style={{textAlign:"center",marginBottom:"20px"}}>
        <div style={{fontSize:"24px",fontWeight:"bold",marginBottom:"5px"}}>architects</div>
        <div style={{display:"inline-block",background:"#ff0000",color:"#white",padding:"10px 20px",fontWeight:"bold",fontSize:"18px",marginBottom:"5px"}}>
          i des
        </div>
        <div style={{fontSize:"16px",fontWeight:"600"}}>architecture</div>
        <div style={{fontSize:"16px",fontWeight:"600"}}>interiore</div>
        <div style={{fontSize:"20px",fontWeight:"bold",marginTop:"10px"}}>INTEGERATED</div>
        <div style={{fontSize:"20px",fontWeight:"bold"}}>DESIGN</div>
        <div style={{fontSize:"20px",fontWeight:"bold"}}>SERVICES</div>
      </div>

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
export default function CanvaProposal({clients=[]}) {
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
  const [search, setSearch]       = useState("");
  const [showResizeMenu, setShowResizeMenu] = useState(false);
  
  // Uploads State
  const [uploads, setUploads]     = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef              = useRef();
  const canvasRef                 = useRef();

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
  },[]);

  const fetchUploads = async () => {
    try {
      const res = await axios.get("/api/upload");
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
      const res = await axios.post("/api/upload", formData);
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
    try {
      const res = await axios.get("/api/proposals");
      if (res.data.length > 0) setProposals(res.data);
      else {
        // If no proposals in DB, create the demo one (optional)
        const d = makeDemo();
        const saved = await axios.post("/api/proposals", d);
        setProposals([saved.data]);
      }
    } catch (err) {
      console.error("Error fetching proposals:", err);
      // Fallback for demo
      const d = [makeDemo()]; setProposals(d);
    }
  };

  const flash = (msg,type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3200); };
// Fix 2: persist returns the saved doc, and uses functional state update to avoid stale closure
const persist = useCallback(async (d) => {
  try {
    if (d._id) {
      // Update existing DB record
      const res = await axios.put(`/api/proposals/${d._id}`, d);
      setProposals(prev => prev.map(p => p._id === d._id ? res.data : p));
      setDoc(res.data);
      return res.data;                     // ← return so callers can use it
    } else {
      // First save — create in DB
      const res = await axios.post("/api/proposals", d);
      setProposals(prev => [res.data, ...prev.filter(p => p.id !== d.id)]);
      setDoc(res.data);
      return res.data;                     // ← return the DB doc (now has _id)
    }
  } catch (err) {
    console.error("Error persisting proposal:", err);
    flash("❌ Error saving to server", "err");
    return null;
  }
}, []); // ← empty deps — uses functional setters, no stale closure
  const openDoc = (d) => { setDoc({...d}); setPage(0); setView("editor"); };
  const createNew = () => {
    const themes = THEMES.map(t=>t.name);
    const theme  = themes[Math.floor(Math.random()*themes.length)];
    const d = { id:pid(), title:"New Project Proposal", client:"", theme, status:"draft", created:new Date().toISOString(), updated:new Date().toISOString(), rejectNote:"", format:"ppt", slides:SLIDE_TYPES.map(t=>makeSlide(t.id,theme)) };
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
  const updateElement = (elId, patch) => {
    const s = doc.slides[page];
    const elements = s.elements.map(e=>e.id===elId?{...e,...patch}:e);
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
      if (dbId) await axios.delete(`/api/proposals/${dbId}`);
      const d = proposals.filter(p=>p.id!==id);
      setProposals(d);
      flash("🗑 Proposal deleted");
    } catch (err) {
      console.error("Error deleting:", err);
      flash("❌ Error deleting from server", "err");
    }
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
                      <button onClick={e=>deleteProposal(p.id,p._id,e)} style={{background:"rgba(239,68,68,0.08)",border:"none",color:"#ef4444",borderRadius:6,width:26,height:26,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>🗑</button>
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
      <div style={{height:56,background:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",borderBottom:"1px solid #e5e7eb",flexShrink:0,gap:12,zIndex:50}}>
        
        {/* LEFT: logo + File/Resize/Editing */}
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <button onClick={()=>{saveDoc();setView("list");}} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,padding:"6px",borderRadius:8,transition:"background .15s"}} title="Home" className="topbtn">🏠</button>
          <button className="topbtn" style={{background:"none",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,color:"#374151",padding:"6px 10px",borderRadius:8}}>File</button>
          <div style={{position:"relative"}}>
            <button className="topbtn" onClick={()=>setShowResizeMenu(!showResizeMenu)} style={{background:showResizeMenu?"#f1f5f9":"none",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,color:"#374151",padding:"6px 10px",borderRadius:8}}>Resize</button>
            {showResizeMenu && (
              <div style={{position:"absolute",top:"100%",left:0,marginTop:4,background:"#fff",borderRadius:8,boxShadow:"0 10px 25px rgba(0,0,0,0.1)",overflow:"hidden",zIndex:1000,border:"1px solid #e5e7eb",width:180}}>
                <button onClick={()=>changeFormat("ppt")} style={{width:"100%",padding:"10px 16px",textAlign:"left",background:"none",border:"none",fontSize:13,fontWeight:600,color:doc?.format==="ppt"?"#7d2ae8":"#374151",cursor:"pointer",display:"block"}} className="topbtn">🖥️ Presentation (16:9)</button>
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
              value={doc.client} 
              onChange={e=>{const nd={...doc,client:e.target.value}; setDoc(nd); persist(nd);}}
              disabled={!canEdit}
              style={{background:"none",border:"none",fontSize:12,fontWeight:700,color:"#7c3aed",outline:"none",cursor:"pointer"}}
            >
              <option value="">-- Select Client --</option>
              {clients.map(c=>(
                <option key={c._id} value={c.name||c.clientName}>{c.name||c.clientName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* RIGHT: status actions + share */}
        <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          <button onClick={()=>flash("🪄 Magic Write: Summarizing your slides with AI...")} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"8px 12px",fontSize:13,fontWeight:700,color:"#7d2ae8",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>🪄 Magic Write</button>
          
          <div style={{width:1,height:24,background:"#e5e7eb"}}/>

          {doc.status==="draft" || doc.status==="rejected" ? (
             <button onClick={()=>setStatus("pending")} style={{background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",border:"none",padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
               {doc.status==="rejected" ? "Resubmit Proposal" : "Submit for Approval"}
             </button>
          ) : doc.status==="pending" ? (
             <span style={{fontSize:13,fontWeight:800,color:"#f59e0b",padding:"0 10px"}}>Waiting for approval</span>
          ) : (
             <span style={{fontSize:13,fontWeight:800,color:"#10b981",padding:"0 10px"}}>Approved!</span>
          )}
          
          <button onClick={()=>saveDoc()} style={{background:"#7d2ae8",color:"#fff",border:"none",padding:"8px 20px",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 12px rgba(125,42,232,0.2)"}}>Share/Save</button>
          
          <div style={{width:32,height:32,borderRadius:"50%",background:"#eee",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#666",border:"2px solid #fff",boxShadow:"0 0 0 1px #e2e8f0"}}>U</div>
        </div>
      </div>

      {/* ╔══ BODY ══╗ */}
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* ── ICON SIDEBAR (Canva left icon rail) ── */}
        <div style={{width:72,background:"#252627",borderRight:"1px solid #e5e7eb",display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 0",gap:4,flexShrink:0}}>
          {[
            {id:"templates", icon:"🎨", label:"Design"},
            {id:"elements", icon:"✦",  label:"Elements"},
            {id:"text",     icon:"T",  label:"Text"},
            {id:"uploads",  icon:"☁️", label:"Uploads"}
          ].map(item=>(
            <button key={item.id} onClick={()=>setLeftPanel(leftPanel===item.id?"":item.id)}
              style={{width:64,height:64,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,background:leftPanel===item.id?"rgba(255,255,255,0.1)":"none",border:"none",borderRadius:8,cursor:"pointer",transition:"background .15s",color:"#fff"}}>
              <span style={{fontSize:24}}>{item.icon}</span>
              <span style={{fontSize:9,fontWeight:500,letterSpacing:0.3,opacity:0.8}}>{item.label}</span>
            </button>
          ))}
          <div style={{flex:1}}/>
          <button style={{width:64,height:64,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,background:"none",border:"none",borderRadius:8,cursor:"pointer",color:"rgba(255,255,255,0.7)"}}>
            <span style={{fontSize:24}}>🪄</span><span style={{fontSize:9,fontWeight:500}}>Magic</span>
          </button>
        </div>
        {/* ── LEFT CONTENT PANEL ── */}
        {leftPanel && (
          <div style={{width:320,background:"#fff",borderRight:"1px solid #e5e7eb",display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden"}}>

            {/* DESIGN (Templates + Styles) */}
            {leftPanel==="templates" && <>
              <div style={{padding:"16px",borderBottom:"1px solid #f1f5f9"}}>
                <div style={{position:"relative", marginBottom:12}}>
                   <input placeholder="Describe your ideal design"
                    style={{width:"100%",boxSizing:"border-box",border:"1px solid #7c3aed",borderRadius:12,padding:"10px 14px 10px 40px",fontSize:13,outline:"none",fontFamily:"inherit",color:"#374151",background:"#fff"}}/>
                   <span style={{position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:18, opacity:0.8}}>✨</span>
                   <span style={{position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:16, opacity:0.6}}>🎤</span>
                </div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"12px 16px",display:"flex",flexDirection:"column",gap:24}}>
                
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:12}}>Templates</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {PRESENTATION_TEMPLATES.map(t => (
                      <div key={t.id} onClick={()=>{changeTheme(t.theme); flash(`Applied ${t.name} style✨`);}} style={{cursor:"pointer", borderRadius:8, overflow:"hidden", border:"1px solid #e2e8f0", background:"#fff"}} className="pgthumb">
                        <img src={t.img} style={{width:"100%", height:76, objectFit:"cover", display:"block", background:"#f1f5f9"}} />
                        <div style={{fontSize:11, padding:"6px", fontWeight:700, color:"#1e293b", textAlign:"center", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{t.name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:12}}>Slide Layouts</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {SLIDE_TYPES.map(tmpl=>{
                      const isP = doc.format === "a4-portrait" || (!doc.format && (tmpl.id === "proposal" || tmpl.id === "portrait"));
                      const isL = doc.format === "a4-landscape" || (!doc.format && tmpl.id === "landscape");
                      const h = isP ? 1273 : isL ? 637 : 506;
                      const ar = isP ? "210/297" : isL ? "297/210" : "16/9";
                      return (
                      <div key={tmpl.id} onClick={()=>canEdit&&addSlide(tmpl.id)}
                        style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,overflow:"hidden",cursor:canEdit?"pointer":"not-allowed",transition:"all .2s",position:"relative"}} className="pgthumb">
                        <div style={{aspectRatio:ar, overflow:"hidden", width:"100%"}}>
                          <div style={{transform:`scale(${130/900})`,transformOrigin:"top left",width:900,height:h,pointerEvents:"none"}}>
                            <Slide slide={makeSlide(tmpl.id, doc.theme)} theme={doc.theme} docFormat={doc.format} editing={false} onChange={()=>{}} preview/>
                          </div>
                        </div>
                        <div style={{padding:"6px 8px",fontSize:10,fontWeight:700,color:"#0f172a",background:"#fff",borderTop:"1px solid #f1f5f9",textAlign:"center"}}>
                          {tmpl.label}
                        </div>
                      </div>
                    )})}
                  </div>
                </div>

              </div>
            </>}

            {/* ELEMENTS */}
            {leftPanel==="elements" && <>
              <div style={{padding:"16px", borderBottom:"1px solid #f1f5f9"}}>
                <div style={{position:"relative"}}>
                   <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search elements"
                    style={{width:"100%",boxSizing:"border-box",border:"1px solid #7c3aed",borderRadius:12,padding:"10px 14px 10px 40px",fontSize:13,outline:"none",fontFamily:"inherit",color:"#374151",background:"#fff"}}/>
                   <span style={{position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:16, opacity:0.5}}>➕</span>
                   <span style={{position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:16, opacity:0.5}}>🎤</span>
                </div>
              </div>

              <div style={{flex:1, overflowY:"auto", padding:"20px 16px", display:"flex", flexDirection:"column", gap:24}}>
                {/* Browse categories matching Screenshot */}
                <div>
                  <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"20px 12px"}}>
                    {[
                      {id:"shapes",     label:"Shapes",     icon:"📐", color:"#bae6fd"},
                      {id:"graphics",   label:"Graphics",   icon:"🌻", color:"#fef08a"},
                      {id:"photos",     label:"Photos",     icon:"🖼️", color:"#bae6fd"},
                      {id:"videos",     label:"Videos",     icon:"▶️", color:"#fbcfe8"},
                      {id:"3d",         label:"3D",         icon:"🧊", color:"#e9d5ff"},
                      {id:"forms",      label:"Forms",      icon:"✅", color:"#bbf7d0"},
                      {id:"animations", label:"Animations", icon:"😊", color:"#bbf7d0"},
                      {id:"audio",      label:"Audio",      icon:"🎵", color:"#fecdd3"},
                      {id:"sheets",     label:"Sheets",     icon:"📋", color:"#bfdbfe"},
                      {id:"tables",     label:"Tables",     icon:"🧮", color:"#fed7aa"},
                      {id:"charts",     label:"Charts",     icon:"📈", color:"#c7d2fe"},
                      {id:"frames",     label:"Frames",     icon:"🖼️", color:"#bbf7d0"},
                      {id:"grids",      label:"Grids",      icon:"🪟", color:"#fbcfe8"},
                      {id:"mockups",    label:"Mockups",    icon:"👕", color:"#bae6fd"}
                    ].map((cat)=>(
                      <div key={cat.id} onClick={()=>{
                        if(cat.id==="shapes") addElement({type:"shape", shape:"rectangle", width:100, height:100, color:"#7c3aed"});
                        else if(cat.id==="graphics") addElement({type:"icon", icon:"🌻", fontSize:80});
                        else if(cat.id==="photos") addElement({type:"image", src:"https://images.unsplash.com/photo-1497215842964-222b430dc094?w=400&q=80", width:200});
                        else if(cat.id==="forms") flash("✅ Form added! (Mock)");
                        else if(cat.id==="animations") flash("😊 Animation applied!");
                        else if(cat.id==="tables") flash("🧮 Table added! (Mock)");
                        else if(cat.id==="charts") addElement({type:"icon", icon:"📈", fontSize:120});
                        else if(cat.id==="frames") addElement({type:"shape", border:"2px dashed #cbd5e1", background:"#f1f5f9", width:150, height:150});
                        else if(cat.id==="mockups") flash("👕 Mockup element added! (Mock)");
                        else flash(`${cat.label} clicked`);
                      }} style={{display:"flex", flexDirection:"column", alignItems:"center", gap:8, cursor:"pointer"}} className="sib">
                        <div style={{width:"100%", aspectRatio:"1", background:cat.color, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, boxShadow:"0 4px 10px rgba(0,0,0,0.05)"}}>
                          {cat.icon}
                        </div>
                        <span style={{fontSize:12, fontWeight:600, color:"#334155"}}>{cat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>}

            {/* TEXT */}
            {leftPanel==="text" && <>
              <div style={{padding:"16px",borderBottom:"1px solid #f1f5f9"}}>
                <div style={{fontSize:16,fontWeight:700,color:"#0f172a",marginBottom:16}}>Text</div>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,opacity:0.4}}>🔍</span>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search fonts and combinations"
                    style={{width:"100%",boxSizing:"border-box",border:"1px solid #e2e8f0",borderRadius:8,padding:"10px 14px 10px 36px",fontSize:14,outline:"none",fontFamily:"inherit",color:"#374151",background:"#f8fafc"}}/>
                </div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:24}}>
                
                <button onClick={()=>addElement({type:"text", val:"New Text Box", fontSize:18, fontWeight:500})} style={{background:"#7d2ae8",color:"#fff",border:"none",borderRadius:8,padding:"14px",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(125,42,232,0.2)",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"transform 0.1s"}} className="hb" onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
                  Add a text box
                </button>

                <div onClick={()=>flash("🪄 Magic Write: Generating AI content...")} style={{background:"linear-gradient(135deg,#7d2ae8,#ff6b6b)",borderRadius:12,padding:"16px",color:"#fff",cursor:"pointer",boxShadow:"0 4px 12px rgba(125,42,232,0.15)",position:"relative",overflow:"hidden"}} className="hb">
                  <div style={{fontSize:14,fontWeight:700,display:"flex",alignItems:"center",gap:8,position:"relative",zIndex:1}}>🪄 Magic Write</div>
                  <div style={{fontSize:11,opacity:0.9,marginTop:4,position:"relative",zIndex:1}}>Generate text with AI</div>
                  <div style={{position:"absolute",right:-10,bottom:-10,fontSize:40,opacity:0.2,transform:"rotate(-15deg)"}}>✨</div>
                </div>

                <div>
                  <div style={{fontSize:11,color:"#64748b",fontWeight:800,marginBottom:12,textTransform:"uppercase",letterSpacing:0.8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span>Brand Kit</span>
                    <button style={{background:"none",border:"none",color:"#7c3aed",fontSize:10,fontWeight:700,cursor:"pointer",padding:0}}>Edit 👑</button>
                  </div>
                  <button style={{width:"100%",background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px",textAlign:"center",color:"#1e293b",fontSize:12,fontWeight:600,cursor:"pointer"}} className="topbtn">
                    Add your brand fonts
                  </button>
                </div>
                
                <div>
                  <div style={{fontSize:11,color:"#64748b",fontWeight:800,marginBottom:12,textTransform:"uppercase",letterSpacing:0.8}}>Default text styles</div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <button onClick={()=>addElement({type:"text", val:"Add a heading", fontSize:32, fontWeight:800})} style={{width:"100%",background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:"16px",textAlign:"left",cursor:"pointer",transition:"all .1s",boxShadow:"0 2px 5px rgba(0,0,0,0.02)"}} className="hb">
                      <div style={{fontSize:24,fontWeight:900,color:"#0f172a"}}>Add a heading</div>
                    </button>
                    <button onClick={()=>addElement({type:"text", val:"Add a subheading", fontSize:24, fontWeight:700})} style={{width:"100%",background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:"12px",textAlign:"left",cursor:"pointer",transition:"all .1s",boxShadow:"0 2px 5px rgba(0,0,0,0.02)"}} className="hb">
                      <div style={{fontSize:18,fontWeight:700,color:"#0f172a"}}>Add a subheading</div>
                    </button>
                    <button onClick={()=>addElement({type:"text", val:"Add a little bit of body text", fontSize:16, fontWeight:400})} style={{width:"100%",background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:"10px",textAlign:"left",cursor:"pointer",transition:"all .1s",boxShadow:"0 2px 5px rgba(0,0,0,0.02)"}} className="hb">
                      <div style={{fontSize:14,color:"#0f172a"}}>Add a little bit of body text</div>
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{fontSize:11,color:"#64748b",fontWeight:800,marginBottom:12,textTransform:"uppercase",letterSpacing:0.8}}>Dynamic text</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div onClick={()=>flash("Page number placeholder added")} style={{background:"#f1f5f9",borderRadius:10,padding:"16px",textAlign:"center",cursor:"pointer",border:"1px solid transparent",transition:"all .2s"}} className="sib">
                       <div style={{fontSize:20,marginBottom:4}}>🔟</div>
                       <div style={{fontSize:10,fontWeight:700}}>Page numbers</div>
                    </div>
                  </div>
                </div>
              </div>
            </>}
            
            {/* UPLOADS */}
            {leftPanel==="uploads" && <>
              <div style={{padding:"16px",borderBottom:"1px solid #f1f5f9"}}>
                <div style={{fontSize:16,fontWeight:700,color:"#0f172a",marginBottom:16}}>Uploads</div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{width:"100%",background:"#7d2ae8",color:"#fff",border:"none",borderRadius:8,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(125,42,232,0.2)",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}
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
            
            {/* Fallback for others */}
            {["brand","draw","projects","apps"].includes(leftPanel) && (
              <div style={{padding:40,textAlign:"center",color:"#94a3b8"}}>
                <div style={{fontSize:40,marginBottom:16}}>🚧</div>
                <div style={{fontSize:14,fontWeight:600}}>{leftPanel.toUpperCase()}</div>
                <p style={{fontSize:12}}>This feature is coming soon to the Canva-style editor.</p>
              </div>
            )}
          </div>
        )}

        {/* ── CENTER CANVAS ── */}
        <div ref={canvasRef} onClick={()=>setSelectedElementId(null)}
          style={{flex:1,overflow:"auto",background:"#f1f5f9",display:"flex",flexDirection:"column",alignItems:"center",padding:"48px 32px",position:"relative"}}>

          {/* Slide canvas */}
          <div style={{
            width:900*(zoom/100 + 0.4), minWidth:900*0.4,
            aspectRatio: doc.format === "a4-portrait" ? "210/297" : doc.format === "a4-landscape" ? "297/210" : doc.format === "ppt" ? "16/9" : (doc.slides[page]?.type === "proposal" ? "210/297" : doc.slides[page]?.type === "portrait" ? "210/297" : doc.slides[page]?.type === "landscape" ? "297/210" : "16/9"),
            boxShadow:"0 12px 48px rgba(0,0,0,0.1)",borderRadius:2,overflow:"hidden",flexShrink:0,background:"#fff",transition:"width .2s ease-out"
          }}>
            <div style={{
              transform:`scale(${zoom/100 + 0.4})`, transformOrigin:"top left", width:900,
              height: doc.format === "a4-portrait" ? 1273 : doc.format === "a4-landscape" ? 637 : doc.format === "ppt" ? 506 : (doc.slides[page]?.type === "proposal" ? 1273 : doc.slides[page]?.type === "portrait" ? 1273 : doc.slides[page]?.type === "landscape" ? 637 : 506)
            }}>
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
            </div>
          </div>

          {/* BOTTOM-RIGHT CONTROLS (Canva Style) */}
          <div style={{position:"absolute",bottom:24,right:24,display:"flex",alignItems:"center",gap:12,background:"#fff",padding:"8px 16px",borderRadius:12,boxShadow:"0 4px 20px rgba(0,0,0,0.08)",zIndex:100}}>
            <div style={{display:"flex",alignItems:"center",gap:8,borderRight:"1px solid #e5e7eb",paddingRight:12}}>
              <button onClick={()=>setPage(Math.max(0,page-1))} disabled={page===0} style={{background:"none",border:"none",cursor:page===0?"not-allowed":"pointer",color:page===0?"#cbd5e1":"#475569",fontSize:12}}>◀</button>
              <span style={{fontSize:12,fontWeight:700,color:"#1e293b",minWidth:30,textAlign:"center"}}>{page+1} / {doc.slides.length}</span>
              <button onClick={()=>setPage(Math.min(doc.slides.length-1,page+1))} disabled={page===doc.slides.length-1} style={{background:"none",border:"none",cursor:page===doc.slides.length-1?"not-allowed":"pointer",color:page===doc.slides.length-1?"#cbd5e1":"#475569",fontSize:12}}>▶</button>
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
