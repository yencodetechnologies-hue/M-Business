import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { BASE_URL } from "../config";
import ProposalForm from "./ProposalForm";
import CanvasProposalEditor from "./CanvasProposalEditor";
import { PROPOSAL_PREVIEW_CSS } from "./ProposalPreviewStyles";
import { printProposal, shareProposalAsPDF } from "./proposalPrintUtils";
// ─── UTILS --------------------------------------------------------------------
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`;
const pid = () => `PROP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
const LS = "canva_proposals_v1";
const load = () => { try { const d = localStorage.getItem(LS); return d ? JSON.parse(d) : []; } catch { return []; } };
const save = d => { try { localStorage.setItem(LS, JSON.stringify(d)); } catch { } };

// ─── THEMES -------------------------------------------------------------------
const THEMES = [
  { name: "Violet", p: "var(--app-accent)", g: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", l: "var(--app-border)", t: "var(--app-accent)1d95" },
  { name: "Cobalt", p: "#1d4ed8", g: "linear-gradient(135deg,#1e40af,#3b82f6)", l: "var(--app-border)", t: "#1e3a8a" },
  { name: "Emerald", p: "#059669", g: "linear-gradient(135deg,#065f46,#10b981)", l: "var(--app-border)", t: "#064e3b" },
  { name: "Rose", p: "#e11d48", g: "linear-gradient(135deg,#9f1239,#f43f5e)", l: "var(--app-border)", t: "#881337" },
  { name: "Amber", p: "#d97706", g: "linear-gradient(135deg,#92400e,#fbbf24)", l: "var(--app-border)", t: "#78350f" },
  { name: "Slate", p: "#334155", g: "linear-gradient(135deg,#0f172a,#475569)", l: "var(--app-border)", t: "#0f172a" },
  { name: "Teal", p: "#0d9488", g: "linear-gradient(135deg,#134e4a,#2dd4bf)", l: "var(--app-border)", t: "#134e4a" },
  { name: "Fuchsia", p: "var(--app-accent)", g: "linear-gradient(135deg,#701a75,#e879f9)", l: "var(--app-border)", t: "#4a044e" },
];
// ─── COVERS -------------------------------------------------------------------
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

// ─── SLIDE FACTORY ------------------------------------------------------------
const SLIDE_TYPES = [
  { id: "cover", label: "Cover Page", icon: "Target", desc: "Title & hero image" },
  { id: "overview", label: "Overview", icon: "Document", desc: "Project background" },
  { id: "objectives", label: "Objectives", icon: "Award", desc: "Goals & outcomes" },
  { id: "timeline", label: "Timeline", icon: "Date", desc: "Project phases" },
  { id: "budget", label: "Budget", icon: "Cost", desc: "Cost breakdown" },
  { id: "team", label: "Team", icon: "Team", desc: "Members & roles" },
  { id: "process", label: "Our Process", icon: "Settings", desc: "How we work" },
  { id: "closing", label: "Next Steps", icon: "Launch", desc: "Call to action" },
  { id: "blank_first_page", label: "Blank First Page", icon: "Document", desc: "Empty first page for proposal" },
  { id: "proposal", label: "Proposal Page 1", icon: "Document", desc: "A4 format proposal document page 1" },
  { id: "proposal_page2", label: "Proposal Page 2", icon: "Document", desc: "A4 format proposal document page 2" },
  { id: "portrait", label: "Portrait Page", icon: "", desc: "Custom portrait page" },
  { id: "landscape", label: "Landscape Page", icon: "Image", desc: "Custom landscape page" },
  { id: "blank", label: "Blank Page", icon: "Document", desc: "Add custom content" },
];

function makeSlide(type, themeName = "Violet", companyName = "") {
  console.log("makeSlide called with type:", type);
  const b = { id: uid(), type, theme: themeName, elements: [] };
  switch (type) {
    case "cover": return { ...b, title: "Project Proposal", subtitle: "Prepared exclusively for your review · " + new Date().getFullYear(), coverImage: COVERS[0] };
    case "overview": return { ...b, heading: "Project Overview", body: "We propose a comprehensive solution designed to address your business challenges. Our approach combines deep industry expertise with cutting-edge technology to deliver measurable, lasting results." };
    case "objectives": return { ...b, heading: "Key Objectives", items: ["Deliver scalable, future-proof architecture that grows with your business", "Reduce operational overhead by 40% through smart automation", "Ensure seamless user experience across all devices and platforms"] };
    case "timeline": return { ...b, heading: "Project Timeline", phases: [{ label: "Discovery & Strategy", dur: "2 Weeks" }, { label: "Design & Prototyping", dur: "3 Weeks" }, { label: "Development & Testing", dur: "6 Weeks" }, { label: "Launch & Handover", dur: "1 Week" }] };
    case "budget": return { ...b, heading: "Budget Estimate", rows: [{ item: "UI/UX Design", cost: "₹80,000" }, { item: "Frontend Development", cost: "₹1,50,000" }, { item: "Backend & APIs", cost: "₹1,20,000" }, { item: "QA & Testing", cost: "₹40,000" }, { item: "Deployment", cost: "₹30,000" }], total: "₹4,20,000" };
    case "team": return { ...b, heading: "Meet Our Team", members: [{ name: "Arjun Sharma", role: "Project Lead", avatar: "AS" }, { name: "Priya Nair", role: "UI/UX Designer", avatar: "PN" }, { name: "Karthik Raj", role: "Full Stack Dev", avatar: "KR" }, { name: "Meena Iyer", role: "QA Engineer", avatar: "MI" }] };
    case "process": return { ...b, heading: "Our Process", steps: [{ icon: "Search", label: "Research", desc: "Deep dive into your needs" }, { icon: "Edit", label: "Design", desc: "Wireframes & prototypes" }, { icon: "Action", label: "Build", desc: "Agile development" }, { icon: "Launch", label: "Launch", desc: "Deploy & support" }] };
    case "blank_first_page": return { ...b, pageTitle: "Blank First Page" };
    case "proposal": return {
      ...b,
      companyName: companyName || "",
      clientName: "",
      companyPhone: "", companyAddress: "",
      currency: "INR",
      template: "Modern",
      footerMessage: " Thank you for considering us!",
      projectType: "",
      scopeOfWork: [],
      conceptStage: []
    };
    case "proposal_page2": return {
      ...b,
      companyName: companyName || "",
      siteVisits: [],
      feeStructure: [],
      stagesOfPayment: [],
      companyAddress: ""
    };
    case "portrait": return { ...b, orientation: "portrait", heading: "Portrait Page", body: "This is a custom portrait page. Add your content here." };
    case "landscape": return { ...b, orientation: "landscape", heading: "Landscape Page", body: "This is a custom landscape page. Add your content here." };
    case "closing": return { ...b, heading: "Ready to Begin?", body: "We're excited to bring your vision to life. Our team is prepared to start immediately and deliver results that exceed your expectations.", cta: "Schedule a Call " };
    case "blank": return { ...b, heading: "", body: "" };
    default: return { ...b, heading: "Slide", body: "" };
  }
}
function makeInitialProposal(theme = "Violet", companyName = "") {
  return {
    id: pid(),
    title: "New Proposal",
    status: "draft",
    theme,
    currency: "INR",
    slides: [makeSlide("blank_first_page", theme, companyName)],
  };
}

// ─── STATUS -------------------------------------------------------------------
const STATUS = {
  draft: { label: "Draft", icon: "Edit", bg: "#f8fafc", fg: "#475569", br: "#cbd5e1" },
  pending: { label: "Pending Approval", icon: "Pending", bg: "#fffbeb", fg: "#92400e", br: "#fcd34d" },
  approved: { label: "Approved", icon: "Success", bg: "#f0fdf4", fg: "#14532d", br: "#86efac" },
  rejected: { label: "Rejected", icon: "Error", bg: "#fff1f2", fg: "#9f1239", br: "#fda4af" },
};

function formatCurrency(val, symbol = "INR", compact = false, disableCompact = false) {
  const num = typeof val === "string" ? parseFloat(val.replace(/[^0-9.-]+/g, "")) || 0 : parseFloat(val) || 0;
  const absNum = Math.abs(num);

  if (!disableCompact && ((compact && absNum >= 100000) || absNum >= 10000000)) {
    try {
      const isINR = symbol === "INR";
      const formatter = new Intl.NumberFormat(isINR ? 'en-IN' : 'en-US', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 2
      });
      return symbol + (" ") + formatter.format(num);
    } catch (e) {
      // Fallback
    }
  }

  const isINR = symbol === "INR";
  return symbol + (" ") + num.toLocaleString(isINR ? "en-IN" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Badge({ status }) {
  const s = STATUS[status] || STATUS.draft;
  return <span style={{ background: s.bg, color: s.fg, border: `1.5px solid ${s.br}`, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>{s.icon} {s.label}</span>;
}

// ─── CONFETTI -----------------------------------------------------------------
function Confetti({ active }) {
  const ref = useRef();
  useEffect(() => {
    if (!active) return;
    const c = ref.current; if (!c) return;
    c.width = window.innerWidth; c.height = window.innerHeight;
    const ctx = c.getContext("2d");
    const colors = ["var(--app-accent)", "var(--app-accent)", "#22c55e", "#f59e0b", "#3b82f6", "#ec4899", "#14b8a6", "#f97316"];
    const parts = Array.from({ length: 150 }, () => ({ x: Math.random() * c.width, y: -20, vx: (Math.random() - .5) * 5, vy: Math.random() * 4 + 2, col: colors[Math.floor(Math.random() * colors.length)], w: Math.random() * 10 + 4, h: Math.random() * 6 + 3, rot: Math.random() * 360, rv: (Math.random() - .5) * 8 }));
    let fr; const draw = () => { ctx.clearRect(0, 0, c.width, c.height); parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.rot += p.rv; if (p.y > c.height) { p.y = -10; p.x = Math.random() * c.width; } ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180); ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }); fr = requestAnimationFrame(draw); };
    draw(); const t = setTimeout(() => cancelAnimationFrame(fr), 4000);
    return () => { cancelAnimationFrame(fr); clearTimeout(t); };
  }, [active]);
  if (!active) return null;
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 99999 }} />;
}

// ─── DRAGGABLE ELEMENT --------------------------------------------------------
function DraggableElement({ element, selected, onSelect, onUpdate, onDelete, children, canvasRef, slideH }) {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(null); // 'tl', 'tr', 'bl', 'br'
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onPointerDown = (e) => {
    if (!onSelect) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      onSelect(element.id);
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    onSelect(element.id);
    if (onUpdate) setDragging(true);

    const canvas = canvasRef?.current;
    if (!canvas) {
      setOffset({ x: e.clientX - element.x, y: e.clientY - element.y });
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const scale = 900 / rect.width;
    setOffset({
      x: (e.clientX - rect.left) * scale - element.x,
      y: (e.clientY - rect.top) * scale - element.y,
    });
  };

  useEffect(() => {
    if (!dragging && !resizing) return;
    const move = (e) => {
      const canvas = canvasRef?.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scale = 900 / rect.width;

      if (dragging) {
        let nx = (e.clientX - rect.left) * scale - offset.x;
        let ny = (e.clientY - rect.top) * scale - offset.y;
        nx = Math.max(0, Math.min(900 - (element.w ?? 100), nx));
        ny = Math.max(0, Math.min(slideH - (element.h ?? 40), ny)); // Use dynamic slide height
        onUpdate({ x: nx, y: ny });
      } else if (resizing) {
        const cx = (e.clientX - rect.left) * scale;
        const cy = (e.clientY - rect.top) * scale;
        let patch = {};
        const ew = element.w || 100;
        const eh = element.h || 40;

        if (resizing === 'br') {
          patch = { w: Math.max(20, cx - element.x), h: Math.max(20, cy - element.y) };
        } else if (resizing === 'bl') {
          const nw = Math.max(20, (element.x + ew) - cx);
          patch = { x: (element.x + ew) - nw, w: nw, h: Math.max(20, cy - element.y) };
        } else if (resizing === 'tr') {
          const nh = Math.max(20, (element.y + eh) - cy);
          patch = { y: (element.y + eh) - nh, h: nh, w: Math.max(20, cx - element.x) };
        } else if (resizing === 'tl') {
          const nw = Math.max(20, (element.x + ew) - cx);
          const nh = Math.max(20, (element.y + eh) - cy);
          patch = { x: (element.x + ew) - nw, w: nw, y: (element.y + eh) - nh, h: nh };
        } else if (resizing === 't') {
          const nh = Math.max(20, (element.y + eh) - cy);
          patch = { y: (element.y + eh) - nh, h: nh };
        } else if (resizing === 'b') {
          patch = { h: Math.max(20, cy - element.y) };
        } else if (resizing === 'l') {
          const nw = Math.max(20, (element.x + ew) - cx);
          patch = { x: (element.x + ew) - nw, w: nw };
        } else if (resizing === 'r') {
          patch = { w: Math.max(20, cx - element.x) };
        }
        onUpdate(patch);
      }
    };
    const up = () => { setDragging(false); setResizing(null); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, resizing, offset, canvasRef, element, onUpdate, slideH]); // added slideH dependency

  const handleStyle = { position: "absolute", width: 14, height: 14, borderRadius: "50%", background: "#fff", border: "2px solid var(--app-accent)", zIndex: 2, boxShadow: "0 2px 4px rgba(0,0,0,0.2)" };

  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        position: "absolute",
        left: element.x,
        top: element.y,
        width: element.w || "auto",
        height: element.h || "auto",
        minWidth: 20,
        minHeight: 20,
        cursor: dragging ? "grabbing" : onUpdate ? "grab" : "default",
        userSelect: "none",
        border: selected ? "2px solid var(--app-accent)" : "2px solid transparent",
        borderRadius: 2,
        padding: 0, // Removed padding to keep size accurate
        zIndex: selected ? 100 : 1,
        transition: dragging || resizing ? "none" : "border .1s",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {/* Corner Handles (Visual) */}
      {selected && (
        <div onPointerDown={e => e.stopPropagation()} style={{ position: "absolute", inset: -10, pointerEvents: "none" }}>
          {/* Corners */}
          <div onPointerDown={(e) => { e.stopPropagation(); setResizing('tl'); }} style={{ ...handleStyle, top: 0, left: 0, transform: "translate(-50%,-50%)", cursor: "nwse-resize", pointerEvents: "auto" }} />
          <div onPointerDown={(e) => { e.stopPropagation(); setResizing('tr'); }} style={{ ...handleStyle, top: 0, right: 0, transform: "translate(50%,-50%)", cursor: "nesw-resize", pointerEvents: "auto" }} />
          <div onPointerDown={(e) => { e.stopPropagation(); setResizing('bl'); }} style={{ ...handleStyle, bottom: 0, left: 0, transform: "translate(-50%,50%)", cursor: "nesw-resize", pointerEvents: "auto" }} />
          <div onPointerDown={(e) => { e.stopPropagation(); setResizing('br'); }} style={{ ...handleStyle, bottom: 0, right: 0, transform: "translate(50%,50%)", cursor: "nwse-resize", pointerEvents: "auto" }} />
          {/* Middle Handles */}
          <div onPointerDown={(e) => { e.stopPropagation(); setResizing('t'); }} style={{ ...handleStyle, top: 0, left: "50%", transform: "translate(-50%,-50%)", cursor: "ns-resize", width: 24, borderRadius: 6, pointerEvents: "auto" }} />
          <div onPointerDown={(e) => { e.stopPropagation(); setResizing('b'); }} style={{ ...handleStyle, bottom: 0, left: "50%", transform: "translate(-50%,50%)", cursor: "ns-resize", width: 24, borderRadius: 6, pointerEvents: "auto" }} />
          <div onPointerDown={(e) => { e.stopPropagation(); setResizing('l'); }} style={{ ...handleStyle, left: 0, top: "50%", transform: "translate(-50%,-50%)", cursor: "ew-resize", height: 24, borderRadius: 6, pointerEvents: "auto" }} />
          <div onPointerDown={(e) => { e.stopPropagation(); setResizing('r'); }} style={{ ...handleStyle, right: 0, top: "50%", transform: "translate(50%,-50%)", cursor: "ew-resize", height: 24, borderRadius: 6, pointerEvents: "auto" }} />

          {/* Toolbar Overlay (Always show when selected to avoid 'hiding' frustration) */}
          {selected && (
            <div
              onPointerDown={e => e.stopPropagation()}
              style={{
                position: "absolute",
                top: -85, // Moved up slightly for larger buttons
                left: "50%",
                transform: "translateX(-50%)",
                background: "#fff",
                boxShadow: "0 12px 48px rgba(0,0,0,0.3)",
                borderRadius: 18,
                display: "flex",
                gap: 8,
                padding: 8,
                zIndex: 1000,
                border: "1px solid #e5e7eb",
                pointerEvents: "auto",
                opacity: 1,
                visibility: "visible"
              }}
            >
              <button
                onPointerDown={(e) => { e.stopPropagation(); setDragging(true); onSelect(element.id); }}
                style={{ border: "none", background: "none", padding: "14px 22px", fontSize: 26, cursor: "move", color: "var(--app-accent)", transition: "all .2s", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Drag to Move" className="hb"></button>
              <div style={{ width: 1, height: 44, background: "#e5e7eb", alignSelf: "center" }} />
              <button onClick={(e) => { e.stopPropagation(); onDelete(element.id); }}
                style={{ border: "none", background: "none", padding: "14px 22px", fontSize: 28, cursor: "pointer", color: "#ef4444", transition: "all .2s", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Delete" className="hb"> Delete</button>
              <div style={{ width: 1, height: 44, background: "#e5e7eb", alignSelf: "center" }} />
              <button onClick={(e) => { e.stopPropagation(); onUpdate({ fontWeight: (element.fontWeight === 800 ? 400 : 800) }); }}
                style={{ border: "none", background: "none", padding: "14px 22px", fontSize: 26, fontWeight: 900, cursor: "pointer", color: element.fontWeight === 800 ? "var(--app-accent)" : "#374151", transition: "all .2s", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Bold" className="hb">B</button>
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
// ─── SLIDE RENDERER -----------------------------------------------------------
function Slide({ slide, theme: tn, docFormat, editing, onChange, selectedId, onSelectElement, onUpdateElement, onDelete, preview = false, canvasRef, companyLogo, companyName, footerMessage }) {
  const t = THEMES.find(x => x.name === tn) || THEMES[0];
  const upd = patch => onChange && onChange({ ...slide, ...patch });
  const fontSize = preview ? 0.22 : 1;
  const elements = slide.elements || [];

  // Local delete function for elements
  const deleteElement = (elId) => {
    const elements = slide.elements.filter(e => e.id !== elId);
    upd({ elements });
    onSelectElement(null);
  };

  const isPortrait = docFormat === "a4-portrait" || (!docFormat && (slide.type === "proposal" || slide.type === "portrait"));
  const isLandscape = docFormat === "a4-landscape" || (!docFormat && slide.type === "landscape");
  const slideH = isPortrait ? 1273 : isLandscape ? 637 : 506;
  const W = { width: 900, minHeight: slideH, background: "var(--app-bg)ff", fontFamily: "'DM Sans',sans-serif", position: "relative", overflow: "hidden", flexShrink: 0 };
  const accent = { width: 56, height: 6, background: t.g, borderRadius: 3, marginBottom: 20 };
  const h1 = { fontSize: 36, fontWeight: 800, color: "#0f172a", marginBottom: 24, letterSpacing: -0.5, lineHeight: 1.1 };

  const Txt = ({ val, onCh, big, center, white, weight, size, numeric }) => {
    const s = { background: "transparent", border: "none", borderRadius: 4, padding: "2px 4px", outline: "none", fontSize: size || "inherit", color: white ? "rgba(255,255,255,0.9)" : "inherit", fontWeight: weight || "inherit", fontFamily: "inherit", lineHeight: "inherit", width: "100%", boxSizing: "border-box", textAlign: center ? "center" : "left", resize: "none", transition: "background .15s" };
    if (!editing) return <span style={{ display: "block", whiteSpace: "pre-wrap" }}>{val}</span>;
    const onInputChange = (e) => {
      const v = e.target.value;
      if (numeric && v && !/^\d*$/.test(v)) return;
      onCh(v);
    };
    return big
      ? <textarea value={val} onChange={onInputChange} rows={4} style={s} onFocus={e => e.target.style.background = "rgba(124,58,237,0.05)"} onBlur={e => e.target.style.background = "transparent"} />
      : <input value={val} onChange={onInputChange} style={s} onFocus={e => e.target.style.background = "rgba(124,58,237,0.05)"} onBlur={e => e.target.style.background = "transparent"} />;
  };

  const elementsOverlay = (
    <div style={{ position: "absolute", inset: 0, pointerEvents: preview ? "none" : "auto", zIndex: 20 }}>
      {elements.map(el => (
        <DraggableElement key={el.id} element={el} selected={selectedId === el.id} onSelect={onSelectElement} onUpdate={patch => onUpdateElement(el.id, patch)} onDelete={deleteElement} canvasRef={canvasRef} slideH={slideH}>
          {el.type === "text" && (
            <div style={{
              fontSize: el.fontSize,
              fontWeight: el.fontWeight || 400,
              color: el.color || "#000",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {editing ? (
                <textarea
                  value={el.val}
                  onChange={e => onUpdateElement(el.id, { val: e.target.value })}
                  autoFocus={selectedId === el.id}
                  onFocus={e => {
                    const defaults = ["Add a heading", "Add a subheading", "Add a little bit of body text", "New Text Box"];
                    if (defaults.includes(e.target.value)) {
                      onUpdateElement(el.id, { val: "" });
                    }
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    outline: "none",
                    color: "inherit",
                    fontSize: "inherit",
                    fontWeight: "inherit",
                    fontFamily: "inherit",
                    padding: 10,
                    width: "100%",
                    height: "100%",
                    textAlign: "center",
                    resize: "none",
                    overflow: "hidden",
                    display: "block",
                    wordBreak: "break-word"
                  }}
                />
              ) : (
                <div style={{ padding: 10, textAlign: "center", wordBreak: "break-word", width: "100%" }}>
                  {el.val}
                </div>
              )}
            </div>
          )}
          {el.type === "shape" && (
            <div style={{ width: el.width || 60, height: el.height || 60, background: el.color || t.p, borderRadius: el.borderRadius !== undefined ? el.borderRadius + 'px' : (el.shape === "circle" ? "50%" : "4px") }} />
          )}
          {el.type === "image" && (
            <img src={el.src} alt="" style={{ width: el.width || 200, height: "auto", borderRadius: 4, display: "block", pointerEvents: "none" }} />
          )}
          {el.type === "icon" && (
            <div style={{ fontSize: el.fontSize || 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {el.icon}
            </div>
          )}
          {el.type === "image" && (
            <img src={el.src} alt="" style={{ width: el.width || 120, height: el.height || "auto", objectFit: "contain", pointerEvents: "none" }} />
          )}
        </DraggableElement>
      ))}
    </div>
  );

  // COVER
  if (slide.type === "cover") return (
    <div style={{ ...W, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <img src={slide.coverImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(150deg,${t.p}dd 0%,rgba(0,0,0,0.85) 60%,rgba(0,0,0,0.5) 100%)` }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, background: "rgba(255,255,255,0.05)", borderRadius: "0 0 0 200px" }} />
      <div style={{ position: "relative", padding: "48px 56px" }}>
        {editing && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {COVERS.map((c, i) => (
              <img key={i} src={c} alt="" onClick={() => upd({ coverImage: c })}
                style={{ width: 56, height: 36, objectFit: "cover", borderRadius: 6, cursor: "pointer", border: slide.coverImage === c ? "3px solid #fff" : "2px solid rgba(255,255,255,0.2)", transition: "all 0.15s", opacity: slide.coverImage === c ? 1 : 0.5 }} />
            ))}
          </div>
        )}
        <div style={{ fontSize: 48, fontWeight: 900, color: "#fff", lineHeight: 1.05, marginBottom: 16 }}>
          <Txt val={slide.title} onCh={v => upd({ title: v })} white weight={900} size={48} />
        </div>
        <div style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", fontWeight: 400 }}>
          <Txt val={slide.subtitle} onCh={v => upd({ subtitle: v })} white size={16} />
        </div>
        <div style={{ marginTop: 28, display: "flex", gap: 4, alignItems: "center" }}>
          <div style={{ width: 40, height: 3, background: "#fff", borderRadius: 2, opacity: 0.6 }} />
          <div style={{ width: 8, height: 3, background: t.p, borderRadius: 2 }} />
        </div>
      </div>
      {elementsOverlay}
    </div>
  );

  // OVERVIEW / CLOSING
  if (slide.type === "overview" || slide.type === "closing") return (
    <div style={{ ...W, padding: 56, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ position: "absolute", right: 0, top: 0, width: 280, height: "100%", background: `linear-gradient(to left,${t.p}0a,transparent)`, borderLeft: `3px solid ${t.p}18` }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 4, background: t.g }} />
      <div style={accent} />
      <div style={h1}><Txt val={slide.heading} onCh={v => upd({ heading: v })} /></div>
      <div style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.9, maxWidth: 620 }}>
        <Txt val={slide.body} onCh={v => upd({ body: v })} big />
      </div>
      {slide.type === "closing" && (
        <div style={{ marginTop: 40 }}>
          <div style={{ display: "inline-block", background: t.g, color: "#fff", borderRadius: 14, padding: "15px 36px", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: `0 8px 24px ${t.p}40` }}>
            <Txt val={slide.cta} onCh={v => upd({ cta: v })} white weight={700} size={16} />
          </div>
        </div>
      )}

      {/* Footer Element */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(135deg,#020617,#1e1b4b)", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{slide.companyName || companyName}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#6ee7b7" }}>{footerMessage || slide.footerMessage || " Thank you for considering us!"}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{slide.id}</div>
      </div>

      {elementsOverlay}
    </div>
  );

  // OBJECTIVES
  if (slide.type === "objectives") return (
    <div style={{ ...W, padding: 56 }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: 140, height: "100%", background: t.l, opacity: 0.5 }} />
      <div style={accent} /><div style={h1}><Txt val={slide.heading} onCh={v => upd({ heading: v })} /></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative" }}>
        {(slide.items || []).map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 18, alignItems: "flex-start", padding: "16px 22px", background: t.l, borderRadius: 14, border: `1px solid ${t.p}20`, position: "relative" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: t.g, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1, fontSize: 14, color: "#1e293b", fontWeight: 600, paddingTop: 6 }}>
              <Txt val={item} onCh={v => { const a = [...slide.items]; a[i] = v; upd({ items: a }); }} />
            </div>
            {editing && slide.items.length > 1 && <button onClick={() => upd({ items: slide.items.filter((_, j) => j !== i) })} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16, position: "absolute", top: 8, right: 10 }}>✕</button>}
          </div>
        ))}
        {editing && <button onClick={() => upd({ items: [...slide.items, "New objective here"] })} style={{ background: "none", border: `1.5px dashed ${t.p}50`, borderRadius: 12, padding: 12, fontSize: 13, color: t.p, cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>+ Add Objective</button>}
      </div>
      {elementsOverlay}
    </div>
  );

  // TIMELINE
  if (slide.type === "timeline") return (
    <div style={{ ...W, padding: 56 }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: t.g }} />
      <div style={accent} /><div style={h1}><Txt val={slide.heading} onCh={v => upd({ heading: v })} /></div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${(slide.phases || []).length},1fr)`, gap: 0, position: "relative" }}>
        <div style={{ position: "absolute", top: 20, left: "12.5%", right: "12.5%", height: 3, background: t.g, borderRadius: 2, zIndex: 0 }} />
        {(slide.phases || []).map((ph, i) => (
          <div key={i} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: i < 2 ? t.g : "#fff", border: `3px solid ${t.p}`, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: i < 2 ? "#fff" : t.p, boxShadow: `0 0 0 4px ${t.l}` }}>{i + 1}</div>
            <div style={{ background: t.l, borderRadius: 12, padding: "12px 10px", border: `1px solid ${t.p}20` }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: t.t, marginBottom: 6 }}>
                <Txt val={ph.label} onCh={v => { const a = [...slide.phases]; a[i] = { ...a[i], label: v }; upd({ phases: a }); }} size={12} />
              </div>
              <div style={{ display: "inline-block", background: t.g, color: "#fff", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700 }}>
                <Txt val={ph.dur} onCh={v => { const a = [...slide.phases]; a[i] = { ...a[i], dur: v }; upd({ phases: a }); }} white size={11} />
              </div>
            </div>
          </div>
        ))}
      </div>
      {elementsOverlay}
    </div>
  );

  // BUDGET
  if (slide.type === "budget") return (
    <div style={{ ...W, padding: 56 }}>
      <div style={accent} /><div style={h1}><Txt val={slide.heading} onCh={v => upd({ heading: v })} /></div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ background: t.g }}>
          <th style={{ padding: "13px 22px", textAlign: "left", color: "#fff", fontSize: 13, fontWeight: 700, borderRadius: "10px 0 0 10px" }}>Item</th>
          <th style={{ padding: "13px 22px", textAlign: "right", color: "#fff", fontSize: 13, fontWeight: 700, borderRadius: "0 10px 10px 0" }}>Cost</th>
        </tr></thead>
        <tbody>
          {(slide.rows || []).map((r, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${t.p}12`, background: i % 2 ? "var(--app-bg)" : "#fff" }}>
              <td style={{ padding: "12px 22px", fontSize: 14, color: "#374151" }}><Txt val={r.item} onCh={v => { const a = [...slide.rows]; a[i] = { ...a[i], item: v }; upd({ rows: a }); }} /></td>
              <td style={{ padding: "12px 22px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "#1e293b" }}><Txt val={r.cost} onCh={v => { const a = [...slide.rows]; a[i] = { ...a[i], cost: v }; upd({ rows: a }); }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, padding: "16px 22px", background: t.g, borderRadius: 12 }}>
        <span style={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>Total: <Txt val={slide.total} onCh={v => upd({ total: v })} white weight={900} size={20} /></span>
      </div>
      {elementsOverlay}
    </div>
  );

  // TEAM
  if (slide.type === "team") return (
    <div style={{ ...W, padding: 56 }}>
      <div style={accent} /><div style={h1}><Txt val={slide.heading} onCh={v => upd({ heading: v })} /></div>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        {(slide.members || []).map((m, i) => (
          <div key={i} style={{ flex: "1 1 170px", padding: "24px 18px", background: t.l, borderRadius: 16, border: `1px solid ${t.p}22`, textAlign: "center", position: "relative" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: t.g, margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff", fontWeight: 900 }}>{m.avatar || m.name[0]}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}><Txt val={m.name} onCh={v => { const a = [...slide.members]; a[i] = { ...a[i], name: v, avatar: (v[0] || "?").toUpperCase() + (v.split(" ")[1]?.[0] || "") }; upd({ members: a }); }} /></div>
            <div style={{ fontSize: 12, color: t.p, fontWeight: 600 }}><Txt val={m.role} onCh={v => { const a = [...slide.members]; a[i] = { ...a[i], role: v }; upd({ members: a }); }} /></div>
            {editing && <button onClick={() => upd({ members: slide.members.filter((_, j) => j !== i) })} style={{ position: "absolute", top: 8, right: 8, background: "rgba(239,68,68,0.1)", border: "none", color: "#ef4444", borderRadius: 6, width: 22, height: 22, cursor: "pointer", fontSize: 11 }}>✕</button>}
          </div>
        ))}
        {editing && <div onClick={() => upd({ members: [...slide.members, { name: "New Member", role: "Role", avatar: "NM" }] })} style={{ flex: "1 1 170px", padding: "24px 18px", borderRadius: 16, border: `2px dashed ${t.p}40`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: t.p, gap: 8 }}>
          <span style={{ fontSize: 30 }}>+</span><span style={{ fontSize: 12, fontWeight: 700 }}>Add Member</span>
        </div>}
      </div>
      {elementsOverlay}
    </div>
  );

  // PROCESS
  if (slide.type === "process") return (
    <div style={{ ...W, padding: 56 }}>
      <div style={accent} /><div style={h1}><Txt val={slide.heading} onCh={v => upd({ heading: v })} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
        {(slide.steps || []).map((s, i) => (
          <div key={i} style={{ padding: "28px 18px", background: t.l, borderRadius: 16, border: `1px solid ${t.p}20`, textAlign: "center", position: "relative" }}>
            {i < slide.steps.length - 1 && <div style={{ position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)", color: t.p, fontSize: 18, zIndex: 2 }}>›</div>}
            <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: t.t, marginBottom: 6 }}><Txt val={s.label} onCh={v => { const a = [...slide.steps]; a[i] = { ...a[i], label: v }; upd({ steps: a }); }} /></div>
            <div style={{ fontSize: 12, color: "#64748b" }}><Txt val={s.desc} onCh={v => { const a = [...slide.steps]; a[i] = { ...a[i], desc: v }; upd({ steps: a }); }} /></div>
          </div>
        ))}
      </div>
      {elementsOverlay}
    </div>
  );

  // BLANK FIRST PAGE - A4 Format Document
  if (slide.type === "blank_first_page") return (
    <>
      <div className="blank-page-content" style={{ ...W, padding: "40px 60px", background: "#fff", fontSize: "14px", lineHeight: "1.5", color: "#000", position: "relative", minHeight: "1273px" }}>
        {/* Print Button - Only show when not editing */}
        {!editing && (
          <button
            onClick={() => window.print()}
            className="no-print"
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              padding: "8px 15px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold"
            }}
          >
            Print
          </button>
        )}

        {/* Empty page content */}
        {/* Truly empty page */}
        <div style={{ height: "100%" }} />

        {elementsOverlay}
      </div>
    </>
  );

  // PROPOSAL - A4 Format Document
  if (slide.type === "proposal") return (
    <>
      <div className="proposal-content" style={{ ...W, padding: "40px 60px", background: "#fff", fontSize: "14px", lineHeight: "1.5", color: "#000", position: "relative" }}>
        {/* Truly empty page container */}
        <div style={{ height: "100%" }}>
          {elementsOverlay}
        </div>
      </div>
    </>
  );

  // PROPOSAL PAGE 2 - A4 Format Document
  if (slide.type === "proposal_page2") return (
    <>
      <div className="proposal-content" style={{ ...W, padding: "40px 60px", background: "#fff", fontSize: "14px", lineHeight: "1.5", color: "#000", position: "relative" }}>
        {/* Redundant Print Button Hidden */}

        {/* Header with Logo minimized */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          {companyLogo && <img src={companyLogo} alt="logo" style={{ height: 40, marginBottom: 8, objectFit: "contain" }} />}
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#ff0000" }}>{slide.companyName || companyName}</div>
        </div>

        {/* Site Visits */}
        <div style={{ marginBottom: "30px" }}>
          <div style={{ fontWeight: "bold", textDecoration: "underline" }}>3.0 SITE VISITS:</div>
          <div style={{ marginLeft: "20px", marginTop: "10px" }}>
            {(slide.siteVisits || []).map((item, i) => (
              <div key={i} style={{ marginLeft: "20px", marginBottom: "6px" }}>
                • <Txt val={item} onCh={v => { const a = [...slide.siteVisits]; a[i] = v; upd({ siteVisits: a }); }} />
              </div>
            ))}
          </div>
        </div>

        {/* Fee Structure */}
        <div style={{ marginBottom: "30px" }}>
          <div style={{ fontWeight: "bold", textDecoration: "underline" }}>5.0 FEE STRUCTURE:</div>
          <div style={{ marginLeft: "20px", marginTop: "10px" }}>
            {(slide.feeStructure || []).map((item, i) => (
              <div key={i} style={{ marginLeft: "20px", marginBottom: "6px" }}>
                • <Txt val={item} onCh={v => { const a = [...slide.feeStructure]; a[i] = v; upd({ feeStructure: a }); }} />
              </div>
            ))}
          </div>
        </div>

        {/* Stages of Payment */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ fontWeight: "bold", textDecoration: "underline" }}>6.0 STAGES OF PAYMENT:</div>
          <div style={{ marginLeft: "20px", marginTop: "10px" }}>
            {(slide.stagesOfPayment || []).map((item, i) => (
              <div key={i} style={{ marginLeft: "20px", marginBottom: "6px" }}>
                • <Txt val={item} onCh={v => { const a = [...slide.stagesOfPayment]; a[i] = v; upd({ stagesOfPayment: a }); }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "60px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontWeight: "bold" }}>
            <div>For <Txt val={slide.companyName} onCh={v => upd({ companyName: v })} /></div>
            <div style={{ marginTop: "40px" }}>(Authorised Signatory)</div>
          </div>
          <div style={{ fontWeight: "bold", textAlign: "center" }}>
            <div style={{ marginTop: "40px" }}>(Company Signature)</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: "absolute", bottom: "40px", left: "60px", right: "60px", textAlign: "center", fontSize: "10px", color: "#666", borderTop: "2px solid #ff0000", paddingTop: "10px" }}>
          <div style={{ fontWeight: "bold", color: "var(--app-accent)", marginBottom: 4 }}>{footerMessage || slide.footerMessage || " Thank you for considering us!"}</div>
          <Txt val={slide.companyAddress} onCh={v => upd({ companyAddress: v })} />
        </div>

        {elementsOverlay}
      </div>
    </>
  );

  // PORTRAIT PAGE
  if (slide.type === "portrait") return (
    <>
      <div className="portrait-content" style={{ ...W, padding: "40px", background: "#fff", fontSize: "14px", lineHeight: "1.5", color: "#000", position: "relative", aspectRatio: "210/297" }}>
        {/* Print Button */}
        {/* Redundant Print Button Hidden */}

        <div style={h1}><Txt val={slide.heading} onCh={v => upd({ heading: v })} /></div>
        <div style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.9, maxWidth: 620, marginTop: 20 }}>
          <Txt val={slide.body} onCh={v => upd({ body: v })} big />
        </div>

        {elementsOverlay}
      </div>
    </>
  );

  // LANDSCAPE PAGE
  if (slide.type === "landscape") return (
    <>
      <div className="landscape-content" style={{ ...W, padding: "40px", background: "#fff", fontSize: "14px", lineHeight: "1.5", color: "#000", position: "relative", aspectRatio: "297/210" }}>
        {/* Print Button */}
        {/* Redundant Print Button Hidden */}

        <div style={h1}><Txt val={slide.heading} onCh={v => upd({ heading: v })} /></div>
        <div style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.9, maxWidth: 800, marginTop: 20 }}>
          <Txt val={slide.body} onCh={v => upd({ body: v })} big />
        </div>

        {elementsOverlay}
      </div>
    </>
  );

  return (
    <div style={W}>
      {/* Default/Blank Slide content */}
      {slide.type === "blank" ? (
        <div style={{ padding: 56, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed #e5e7eb", margin: 20, borderRadius: 12, color: "#94a3b8" }}>
          Click to add elements or text
        </div>
      ) : (
        <div style={{ ...W, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 24, color: "#94a3b8" }}>{slide.type}</span></div>
      )}

      {elementsOverlay}

      {/* Dynamic Page Number */}
      {slide.type !== "cover" && (
        <div style={{ position: "absolute", bottom: 20, right: 30, fontSize: 12, color: t.p, fontWeight: 700, opacity: 0.6 }}>
          Page Number
        </div>
      )}
    </div>
  );
}

// ─── SUBADMIN PROPOSAL VIEWER -------------------------------------------------
function SubadminProposalViewer({ proposal, onClose, onPrint, onShare, BASE_URL, onUpdated }) {
  const prop = proposal;
  const st = (prop.status || "draft").toLowerCase();

  const statusMap = {
    draft: { bg: "#f8fafc", color: "#475569", label: "Draft" },
    sent: { bg: "#EFF4FF", color: "#2563EB", label: "Sent" },
    pending: { bg: "#fffbeb", color: "#92400e", label: "Pending" },
    approved: { bg: "#f0fdf4", color: "#14532d", label: "Approved" },
    rejected: { bg: "#fff1f2", color: "#9f1239", label: "Rejected" },
    negotiation: { bg: "#EEE9FF", color: "#7C5CFC", label: "Negotiation" },
    won: { bg: "#f0fdf4", color: "#14532d", label: "Won" },
    lost: { bg: "#fff1f2", color: "#9f1239", label: "Lost" },
  };
  const badge = statusMap[st] || statusMap.draft;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "rgba(0,0,0,0.65)",
      display: "flex", flexDirection: "column"
    }}>
      {/* ── Top Bar ── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e0eef0",
        padding: "12px 24px", display: "flex", alignItems: "center",
        gap: 14, flexShrink: 0, boxShadow: "0 2px 12px rgba(0,0,0,0.08)"
      }}>
        <button onClick={onClose} style={{
          background: "#f0fdfe", border: "1.5px solid #e0eef0",
          borderRadius: 8, padding: "7px 14px", fontSize: 12,
          fontWeight: 700, cursor: "pointer", color: " var(--app-accent, var(--app-accent, #00BCD4))",
          display: "flex", alignItems: "center", gap: 6
        }}>
          <i className="ti ti-arrow-left"></i> Back
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 800, color: "#0D2027",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
          }}>
            {prop.title || "Untitled Proposal"}
          </div>
          <div style={{ fontSize: 11, color: "#96B0B8", marginTop: 2 }}>
            Client: {prop.client || prop.clientName || "—"} ·{" "}
            {prop.sentAt
              ? new Date(prop.sentAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
              : prop.updatedAt
                ? new Date(prop.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                : ""}
          </div>
        </div>

        <span style={{
          background: badge.bg, color: badge.color,
          borderRadius: 20, padding: "4px 14px",
          fontSize: 11, fontWeight: 800, flexShrink: 0
        }}>
          {badge.label}
        </span>

        {prop.clientSignature && (
          <span style={{
            background: "#f0fdf4", color: "#15803D",
            borderRadius: 20, padding: "4px 14px",
            fontSize: 11, fontWeight: 800,
            display: "flex", alignItems: "center", gap: 5, flexShrink: 0
          }}>
            <i className="ti ti-writing" style={{ fontSize: 12 }}></i> Client Signed
          </span>
        )}

        <button onClick={onShare} style={{
          background: "#f0fdfe", border: "1.5px solid #e0eef0",
          borderRadius: 8, padding: "7px 14px", fontSize: 12,
          fontWeight: 700, cursor: "pointer", color: " var(--app-accent, var(--app-accent, #00BCD4))",
          display: "flex", alignItems: "center", gap: 6
        }}>
          <i className="ti ti-share"></i> Share
        </button>

        <button onClick={onPrint} style={{
          background: " var(--app-accent, var(--app-accent, #00BCD4))", border: "none",
          borderRadius: 8, padding: "7px 16px", fontSize: 12,
          fontWeight: 700, cursor: "pointer", color: "#fff",
          display: "flex", alignItems: "center", gap: 6
        }}>
          <i className="ti ti-printer"></i> Print / PDF
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: "auto", background: "#f5fafa", padding: "28px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Canvas-based proposal — show read-only canvas */}
          {prop.format === "canvas" && prop.canvasElements && prop.canvasElements.length > 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #e0eef0', overflow: 'hidden' }}>
              <CanvasProposalEditor
                isPreviewMode={true}
                proposalData={prop}
                onClose={onClose}
              />
            </div>
          ) :


            prop.html ? (
              <>
                <style>{PROPOSAL_PREVIEW_CSS}</style>
                <div className="prop-doc" style={{
                  background: "#fff", borderRadius: 14,
                  border: "1.5px solid #e0eef0",
                  boxShadow: "0 2px 14px rgba(0,0,0,0.06)",
                  maxHeight: "none", overflow: "visible"
                }}
                  dangerouslySetInnerHTML={{ __html: prop.html }}
                />
              </>
            ) : prop.slides && prop.slides.length > 0 ? (
              <div style={{
                background: "#fff", borderRadius: 14,
                border: "1.5px solid #e0eef0", padding: "36px 44px",
                boxShadow: "0 2px 14px rgba(0,0,0,0.06)"
              }}>
                {/* Cover */}
                <div style={{ textAlign: "center", marginBottom: 32, paddingBottom: 24, borderBottom: "3px solid  var(--app-accent, var(--app-accent, #00BCD4))" }}>
                  <div style={{ fontSize: 30, fontWeight: 900, color: "#0D2027", marginBottom: 8 }}>
                    {prop.title || "Project Proposal"}
                  </div>
                  <div style={{ fontSize: 14, color: "#607D86", marginBottom: 4 }}>
                    Prepared for <strong>{prop.client || prop.clientName || "—"}</strong>
                  </div>
                  {prop.sentAt && (
                    <div style={{ fontSize: 12, color: "#96B0B8" }}>
                      {new Date(prop.sentAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  )}
                  {prop.value > 0 && (
                    <div style={{
                      display: "inline-block", marginTop: 12,
                      background: "#f0fdfe", border: "1.5px solid #e0eef0",
                      borderRadius: 10, padding: "8px 20px",
                      fontSize: 16, fontWeight: 800, color: " var(--app-accent, var(--app-accent, #00BCD4))"
                    }}>
                      ₹{Number(prop.value).toLocaleString("en-IN")}
                    </div>
                  )}
                </div>

                {/* Slides */}
                {prop.slides.map((slide, si) => (
                  <div key={si} style={{
                    marginBottom: 18, padding: "18px 22px",
                    background: "#f8fafb", borderRadius: 12,
                    border: "1.5px solid #e0eef0"
                  }}>
                    <div style={{
                      fontSize: 10, fontWeight: 800, color: " var(--app-accent, var(--app-accent, #00BCD4))",
                      textTransform: "uppercase", letterSpacing: 1, marginBottom: 10
                    }}>
                      {SLIDE_TYPES.find(x => x.id === slide.type)?.label || slide.type}
                    </div>

                    {(slide.heading || slide.title) && (
                      <div style={{ fontSize: 17, fontWeight: 800, color: "#0D2027", marginBottom: 8 }}>
                        {slide.heading || slide.title}
                      </div>
                    )}
                    {slide.subtitle && (
                      <div style={{ fontSize: 13, color: "#607D86", marginBottom: 6 }}>{slide.subtitle}</div>
                    )}
                    {slide.body && (
                      <div style={{ fontSize: 13, color: "#4E6B75", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{slide.body}</div>
                    )}
                    {slide.items && slide.items.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                        {slide.items.map((item, ii) => (
                          <div key={ii} style={{
                            display: "flex", alignItems: "flex-start", gap: 10,
                            padding: "8px 12px", background: "#fff",
                            borderRadius: 8, border: "1px solid #e0eef0", fontSize: 13, color: "#374151"
                          }}>
                            <span style={{ color: " var(--app-accent, var(--app-accent, #00BCD4))", fontWeight: 900, marginTop: 1 }}>Yes</span> {item}
                          </div>
                        ))}
                      </div>
                    )}
                    {slide.phases && slide.phases.length > 0 && (
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                        {slide.phases.map((ph, pi) => (
                          <div key={pi} style={{
                            padding: "8px 14px", background: "#fff",
                            borderRadius: 8, border: "1px solid #e0eef0", fontSize: 12
                          }}>
                            <span style={{ fontWeight: 700, color: "#0D2027" }}>Phase {pi + 1}:</span>{" "}
                            <span style={{ color: "#607D86" }}>{ph.label}</span>{" "}
                            <span style={{ color: " var(--app-accent, var(--app-accent, #00BCD4))", fontWeight: 700 }}>{ph.dur}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {slide.rows && slide.rows.length > 0 && (
                      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
                        <thead>
                          <tr style={{ background: " var(--app-accent, var(--app-accent, #00BCD4))" }}>
                            <th style={{ padding: "8px 14px", color: "#fff", fontSize: 12, textAlign: "left", borderRadius: "6px 0 0 6px" }}>Item</th>
                            <th style={{ padding: "8px 14px", color: "#fff", fontSize: 12, textAlign: "right", borderRadius: "0 6px 6px 0" }}>Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {slide.rows.map((row, ri) => (
                            <tr key={ri} style={{ borderBottom: "1px solid #e0eef0", background: ri % 2 ? "#f8fafb" : "#fff" }}>
                              <td style={{ padding: "8px 14px", fontSize: 13, color: "#374151" }}>{row.item}</td>
                              <td style={{ padding: "8px 14px", fontSize: 13, fontWeight: 700, color: "#0D2027", textAlign: "right" }}>{row.cost}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {slide.total && (
                      <div style={{
                        display: "flex", justifyContent: "flex-end",
                        marginTop: 10, padding: "10px 14px",
                        background: " var(--app-accent, var(--app-accent, #00BCD4))", borderRadius: 8,
                        fontSize: 15, fontWeight: 900, color: "#fff"
                      }}>
                        Total: {slide.total}
                      </div>
                    )}
                    {slide.members && slide.members.length > 0 && (
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
                        {slide.members.map((m, mi) => (
                          <div key={mi} style={{
                            padding: "12px 16px", background: "#fff",
                            borderRadius: 10, border: "1px solid #e0eef0",
                            textAlign: "center", minWidth: 110
                          }}>
                            <div style={{
                              width: 40, height: 40, borderRadius: "50%",
                              background: " var(--app-accent, var(--app-accent, #00BCD4))", color: "#fff",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontWeight: 800, fontSize: 14, margin: "0 auto 8px"
                            }}>{m.avatar || m.name?.[0]}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#0D2027" }}>{m.name}</div>
                            <div style={{ fontSize: 11, color: "#96B0B8" }}>{m.role}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {slide.cta && (
                      <div style={{
                        marginTop: 16, display: "inline-block",
                        background: " var(--app-accent, var(--app-accent, #00BCD4))", color: "#fff",
                        borderRadius: 10, padding: "12px 28px",
                        fontSize: 14, fontWeight: 700
                      }}>{slide.cta}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                background: "#fff", borderRadius: 14,
                border: "1.5px solid #e0eef0", padding: 48,
                textAlign: "center", color: "#96B0B8", fontSize: 14
              }}>
                No proposal content to display.
              </div>
            )}


          {/* ── Client Signature Section ── */}
          <div style={{
            background: "#fff", borderRadius: 14,
            border: "1.5px solid #e0eef0", padding: "24px 28px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#607D86", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Client Sign-off
            </div>
            <div style={{ fontSize: 11, color: "#96B0B8", marginBottom: 18 }}>
              {prop.clientSignature
                ? "The client has digitally signed and accepted this proposal."
                : "Awaiting client's electronic signature to confirm acceptance."}
            </div>

            {prop.clientSignature ? (
              /* ── Signed state ── */
              <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <i className="ti ti-circle-check" style={{ fontSize: 18, color: "#15803D" }}></i>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#15803D" }}>Proposal Accepted by Client</span>
                  {prop.clientSignedAt && (
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#96B0B8", fontWeight: 600 }}>
                      {new Date(prop.clientSignedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #86efac", padding: "16px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#96B0B8", textTransform: "uppercase", letterSpacing: .6, marginBottom: 12 }}>Client Signature</div>
                    <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                      {prop.clientSignature.startsWith("data:image") ? (
                        <img src={prop.clientSignature} style={{ maxHeight: 60, maxWidth: "100%", objectFit: "contain" }} alt="client signature" />
                      ) : (
                        <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: 28, color: "#0D2027" }}>
                          {prop.clientSignature}
                        </span>
                      )}
                    </div>
                    <div style={{ height: 1, background: "#15803D", marginBottom: 8 }} />
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0D2027" }}>{prop.clientName || prop.client || "Client"}</div>
                    <div style={{ fontSize: 10, color: "#15803D", fontWeight: 700, marginTop: 3 }}>Digitally Signed</div>
                  </div>
                  <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e0eef0", padding: "16px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#96B0B8", textTransform: "uppercase", letterSpacing: .6, marginBottom: 12 }}>Authorised Signatory</div>
                    <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#006E7F, var(--app-accent, var(--app-accent, #00BCD4)))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#fff" }}>Yes</div>
                    </div>
                    <div style={{ height: 1, background: " var(--app-accent, var(--app-accent, #00BCD4))", marginBottom: 8 }} />
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0D2027" }}>Company Representative</div>
                    <div style={{ fontSize: 10, color: "#96B0B8", marginTop: 3 }}>Authorised Signatory</div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Awaiting state ── */
              <div style={{ background: "#fffbeb", border: "1.5px dashed #fcd34d", borderRadius: 12, padding: "24px", textAlign: "center" }}>
                <i className="ti ti-writing" style={{ fontSize: 32, color: "#d97706", marginBottom: 10, display: "block" }}></i>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#92400e", marginBottom: 6 }}>
                  {prop.client || prop.clientName || "Client"} hasn't signed yet
                </div>
                <div style={{ fontSize: 11, color: "#B45309" }}>
                  The client will see a signature pad when they view this proposal in their dashboard.
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP -----------------------------------------------------------------
export default function CanvaProposal({ clients = [], openNew = false, onOpenNewDone, companyLogo, companyName }) {
  // Always start at "list" view; fetchProposals() will switch to "editor" once the
  // correct doc has been loaded from the API (fixes the blank-editor flash when
  // navigating via ?edit= or ?view= URL params before data is ready).
  const [view, setView] = useState("list");    // list | editor
  const [proposals, setProposals] = useState(() => load());
  const [doc, setDoc] = useState(null);
  // True when we arrived via ?edit= or ?view= URL param and are waiting for the
  // proposal data to load — prevents the list from flickering before the editor opens.
  const [isUrlNavigation] = useState(
    () => !!(new URLSearchParams(window.location.search).get("edit") ||
      new URLSearchParams(window.location.search).get("view"))
  );

  const iframeRef = useRef(null);

  useEffect(() => {
    const handleMsg = (e) => {
      if (e.data?.type === 'SAVE_DOCUMENT' && e.data?.payload?.docType === 'prop') {
        const payload = e.data.payload;
        const newDoc = {
          _id: Date.now().toString(),
          proposalNo: payload.invoiceNo || `PROP-${Date.now()}`,
          clientName: payload.client || 'Unknown Client',
          title: payload.client + ' - Proposal',
          date: payload.date || new Date().toISOString().split('T')[0],
          status: 'draft',
          amount: payload.amount || 0,
          htmlContent: payload.htmlContent,
          type: 'proposal'
        };
        setProposals(prev => [newDoc, ...prev]);
        setView("list");
        if (typeof flash === 'function') flash(" Proposal saved successfully!");
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  const sendThemeToIframe = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const color = getComputedStyle(document.documentElement).getPropertyValue('--app-accent').trim() || ' var(--app-accent, var(--app-accent, #00BCD4))';
      iframeRef.current.contentWindow.postMessage({ type: 'SET_THEME', color }, '*');
    }
  };
  const [page, setPage] = useState(0);         // active slide index
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [leftPanel, setLeftPanel] = useState("templates"); // templates | elements | text | brand | uploads | draw | projects | apps
  const [zoom, setZoom] = useState(10);        // %
  const [confetti, setConfetti] = useState(false);
  const [toast, setToast] = useState(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);     // loading state for proposals// loading state for proposals
  const [search, setSearch] = useState("");
  const [showResizeMenu, setShowResizeMenu] = useState(false);
  const [isViewMode, setIsViewMode] = useState(new URLSearchParams(window.location.search).get("view") !== null);  // true when ?view= is in URL (client view)
  const [selectedMonth, setSelectedMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const [activeCard, setActiveCard] = useState("all");
  const [propTab, setPropTab] = useState("all");
  const [propSearch, setPropSearch] = useState("");
  const [newForm, setNewForm] = useState({ title: "", client: "", value: "" });
  const [viewingProposal, setViewingProposal] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Role-based security: Force View Mode for clients
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role === "client") {
      setIsViewMode(true);
    }
  }, []);

  // Uploads State
  const [uploads, setUploads] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [clientsData, setClientsData] = useState(clients || []);
  const fileInputRef = useRef();
  const canvasRef = useRef();

  // Auto-open new proposal when triggered from Dashboard
  useEffect(() => {
    if (openNew && !loading) {
      openNewModal();
      if (onOpenNewDone) onOpenNewDone();
    }
  }, [openNew, loading]);

  const changeFormat = async (fmt) => {
    if (!doc) return;
    const nd = { ...doc, format: fmt, updated: new Date().toISOString() };
    const saved = await persist(nd);   // get back the DB-hydrated doc (with _id)
    if (saved) setDoc(saved);          // use the version with _id going forward
    setShowResizeMenu(false);
    flash(" Page resized to " + (fmt === "a4-portrait" ? "A4 Portrait" : fmt === "a4-landscape" ? "A4 Landscape" : "Presentation"));
  };
  useEffect(() => {
    fetchProposals();
    fetchUploads();
    fetchClients();
    if (new URLSearchParams(window.location.search).get("new") === "true") {
      setTimeout(() => openNewModal(), 100);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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
      flash("Upload successful!");
    } catch (err) {
      console.error("Upload failed", err);
      flash("Upload failed", "err");
    } finally {
      setUploading(false);
    }
  };

  const fetchProposals = async () => {
    try {
      console.log(" Fetching proposals from backend...");
      const res = await axios.get(`${BASE_URL}/api/proposals`);
      console.log(`Document Found ${res.data.length} proposals in backend`);

      const list = res.data || [];
      setProposals(list);
      save(list);

      if (list.length > 0) {
        console.log("Proposals loaded successfully");

        // Auto-open based on URL — must set doc BEFORE switching view so the
        // editor never renders with a null doc (that was the root cause of the
        // blank / incorrect page bug on first click).
        const params = new URLSearchParams(window.location.search);
        const editId = params.get("edit");
        const viewId = params.get("view");

        if (editId) {
          const found = list.find(p => p.id === editId || p._id === editId);
          if (found) {
            setDoc(found);
            setPage(0);
            // Clear the ?edit param so a future refresh doesn't re-open the editor
            window.history.replaceState({}, document.title, window.location.pathname);
            setView("editor");
          }
        } else if (viewId) {
          const found = list.find(p => p.id === viewId || p._id === viewId);
          if (found) {
            setDoc(found);
            setPage(0);
            setIsViewMode(true);
            // Clear the ?view param so a future refresh doesn't re-open view mode
            window.history.replaceState({}, document.title, window.location.pathname);
            setView("editor");
          }
        }

      } else {
        console.log("Edit No proposals found in backend, showing empty state");
        setProposals([]);
      }
    } catch (err) {
      console.error("Error Error fetching proposals:", err);
      // Only show demo proposal in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log(" Development mode: Showing demo proposal");
        const d = [makeDemo()];
        setProposals(d);
      } else {
        setProposals([]);
      }
    } finally {
    }
  };

  const flash = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200); };
  // Fix 2: persist returns the saved doc, and uses functional state update to avoid stale closure
  const persist = useCallback(async (d) => {
    try {
      if (d._id) {
        // Update existing DB record
        const res = await axios.put(`${BASE_URL}/api/proposals/${d._id}`, d);
        setProposals(prev => prev.map(p => p._id === d._id ? res.data : p));
        setDoc(res.data);
        return res.data;                     //  return so callers can use it
      } else {
        // First save — create in DB
        const res = await axios.post(`${BASE_URL}/api/proposals`, d);
        setProposals(prev => [res.data, ...prev.filter(p => p.id !== d.id)]);
        setDoc(res.data);
        return res.data;                     //  return the DB doc (now has _id)
      }
    } catch (err) {
      console.error("Error persisting proposal:", err);

      return null;
    }
  }, []);
  //  empty deps — uses functional setters, no stale closure

  const openDoc = (d) => {
    // Always open the viewer when clicking a proposal card
    setViewingProposal(d);
  };
  const createNew = async (initialData = {}) => {
    const nd = {
      ...makeInitialProposal(THEMES[0].name, companyName || ""),
      ...initialData,
      value: initialData.value ? Number(initialData.value) : 0,
      client: initialData.client || initialData.clientName || "",
      clientId: initialData.clientId || "",
    };
    // Show it immediately in the UI...
    setProposals(prev => [nd, ...prev]);
    setDoc(nd);
    setPage(0);
    setView("editor");
    // ...and save it to the database right away. Without this, a proposal
    // marked "sent" only ever lived in local state and never reached the
    // client's dashboard.
    return await persist(nd);
  };
  const openNewModal = () => { setView("form"); };

  const saveDoc = (d = doc) => {
    const nd = { ...d, updated: new Date().toISOString(), client: d.client || d.clientName || "" };
    persist(nd);
    setDoc(nd);
    flash(" Saved!");
  };
  const shareProposal = async (p = doc) => {
    await shareProposalAsPDF(p, companyName, async (proposal) => {
      try {
        if (proposal._id || proposal.id) {
          const proposalId = proposal._id || proposal.id;
          const updated = await axios.put(`${BASE_URL}/api/proposals/${proposalId}`, {
            ...proposal,
            status: "sent",
            sentAt: new Date().toISOString(),
            client: proposal.client || proposal.clientName || "",
          });
          setProposals(prev => prev.map(pr =>
            (pr._id === proposalId || pr.id === proposalId) ? updated.data : pr
          ));
          if (doc && (doc._id === proposalId || doc.id === proposalId)) setDoc(updated.data);
        }
      } catch (err) {
        console.error("Error marking proposal as sent:", err);
      }
    });
  };
  const shareWhatsApp = (p = doc) => {
    const link = `${window.location.origin}/proposal-view?id=${p._id || p.id}`;
    const text = encodeURIComponent(`Project Proposal: ${p.title}\nPrepared by ${companyName}\nView here: ${link}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const setStatus = async (status, extra = {}) => {
    if (status === "pending") {
      let currentDoc = { ...doc };
      if (!currentDoc.title.trim()) {
        const t = window.prompt("Enter a title for this proposal before submitting:");
        if (!t || !t.trim()) {
          flash("Error Title is required to submit");
          return;
        }
        currentDoc.title = t.trim();
      }



      try {
        // Ensure doc is saved and has _id before submitting
        const savedDoc = await persist(currentDoc);
        if (!savedDoc || !savedDoc._id) {
          flash("Error Error saving proposal before submission", "err");
          return;
        }

        const res = await axios.put(`${BASE_URL}/api/proposals/${savedDoc._id}/submit`);
        setDoc(res.data);
        setProposals(prev => prev.map(p => p._id === savedDoc._id ? res.data : p));
        flash("Export Proposal submitted successfully!");
        setTimeout(() => setView("list"), 1500);
      } catch (err) {
        console.error("Error submitting proposal:", err);
        flash("Error Error submitting to server", "err");
      }
      return;
    }

    if (status === "approved") {
      try {
        const res = await axios.put(`${BASE_URL}/api/proposals/${doc._id}/approve`);
        setDoc(res.data);
        setProposals(prev => prev.map(p => p._id === doc._id ? res.data : p));
        setConfetti(true);
        flash("Celebration Proposal Approved!");
        setTimeout(() => setConfetti(false), 4000);
      } catch (err) {
        console.error("Error approving proposal:", err);
        flash("Error Error approving", "err");
      }
      return;
    }

    if (status === "rejected") {
      try {
        const res = await axios.put(`${BASE_URL}/api/proposals/${doc._id}/reject`, extra);
        setDoc(res.data);
        setProposals(prev => prev.map(p => p._id === doc._id ? res.data : p));
        flash("Error Proposal Rejected", "err");
      } catch (err) {
        console.error("Error rejecting proposal:", err);
        flash("Error Error rejecting", "err");
      }
      return;
    }

    // Default update for other statuses (e.g. draft)
    const nd = { ...doc, status, ...extra, updated: new Date().toISOString() };
    persist(nd);
    setDoc(nd);
  };

  const updateSlide = (s) => {
    const slides = doc.slides.map((sl, i) => i === page ? s : sl);
    setDoc({ ...doc, slides });
  };
  const updateElement = (elId, patch) => {
    if (!doc.slides || !doc.slides[page]) return;
    const s = doc.slides[page];
    const elements = (s.elements || []).map(e => e.id === elId ? { ...e, ...patch } : e);
    updateSlide({ ...s, elements });
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
    const elements = [...(s.elements || []), { id: uid(), fontSize: 16, fontWeight: 400, x: xPos, y: yPos, w: 400, ...element }];
    updateSlide({ ...s, elements });
    setSelectedElementId(elements[elements.length - 1].id);
    flash(" Added to page!");
  }
  const deleteElement = (elId) => {
    const s = doc.slides[page];
    const elements = s.elements.filter(e => e.id !== elId);
    updateSlide({ ...s, elements });
    setSelectedElementId(null);
    flash("Delete Removed");
  };
  const addSlide = (type) => {
    const s = makeSlide(type, doc.theme);
    const slides = [...doc.slides, s];
    setDoc({ ...doc, slides }); setPage(slides.length - 1);
  };
  const delSlide = (i) => {
    if (doc.slides.length <= 1) return;
    const slides = doc.slides.filter((_, j) => j !== i);
    setDoc({ ...doc, slides }); setPage(Math.min(page, slides.length - 1));
  };
  const moveSlide = (from, to) => {
    if (to < 0 || to >= doc.slides.length) return;
    const slides = [...doc.slides];
    const [s] = slides.splice(from, 1); slides.splice(to, 0, s);
    setDoc({ ...doc, slides }); setPage(to);
  };
  const changeTheme = (name) => {
    const slides = doc.slides.map(s => ({ ...s, theme: name }));
    setDoc({ ...doc, theme: name, slides });
  };
  const deleteProposal = async (id, dbId, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this proposal?")) return;
    try {
      if (dbId) await axios.delete(`${BASE_URL}/api/proposals/${dbId}`);
      const d = proposals.filter(p => p.id !== id);
      setProposals(d);
      flash("Delete Proposal deleted");
    } catch (err) {
      console.error("Error deleting:", err);
      flash("Error Error deleting from server", "err");
    }
  };

  const printProposal = (p) => { import("./proposalPrintUtils").then(m => m.printProposal(p)); };
  const duplicateSlide = (i) => {
    const s = { ...doc.slides[i], id: uid() };
    const slides = [...doc.slides]; slides.splice(i + 1, 0, s);
    setDoc({ ...doc, slides }); setPage(i + 1);
  }

  const canEdit = doc && (doc.status === "draft" || doc.status === "rejected") && !isViewMode;
  const th = doc ? (THEMES.find(x => x.name === doc.theme) || THEMES[0]) : THEMES[0];
  const zf = zoom / 100;

  if (view === "template") {
    return (
      <div style={{ width: "100%", height: "80vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "10px 0", display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setView("list")} style={{ padding: "8px 14px", background: "var(--app-bg)", border: "1.5px solid var(--app-border)", borderRadius: 8, cursor: "pointer", fontWeight: 700, color: "var(--app-muted)" }}> Back to List</button>
        </div>
        <div style={{ flex: 1, overflow: "hidden", borderRadius: 16 }}>
          <iframe src="/template-designer.html#prop" ref={iframeRef} onLoad={sendThemeToIframe} style={{ width: "100%", height: "100%", border: "none" }} title="Template Designer" />
        </div>
      </div>
    );
  }

  // ══ FORM VIEW --------------------------------------------------------------
  if (view === "form") {
    // Register the back-to-list callback so ProposalFormLogic can call it after Send
    window._onBackToProposals = () => setView("list");
    return <ProposalForm
      onBack={() => setView("list")}
      initialData={doc}
      clients={clients}
      onSave={async (data) => {
        await createNew(data);
        if (data.status === 'sent') {
          flash("Export Proposal sent — it will appear on the client's dashboard now.");
          setTimeout(() => setView("list"), 500);
        }
      }}
    />;
  }

  // ══ LIST VIEW --------------------------------------------------------------


  const total = proposals.length;
  const totalVal = proposals.reduce((s, p) => s + (Number(p.value) || Number(p.total) || 0), 0);
  const wonCount = proposals.filter(p => p.status === "won" || p.status === "approved").length;
  const wonVal = proposals.filter(p => p.status === "won" || p.status === "approved").reduce((s, p) => s + (Number(p.value) || Number(p.total) || 0), 0);
  const activeCount = proposals.filter(p => p.status === "sent" || p.status === "negotiation" || p.status === "pending").length;
  const decided = proposals.filter(p => ["won", "approved", "lost", "rejected"].includes(p.status)).length;
  const successRate = decided > 0 ? Math.round((wonCount / decided) * 100) : 0;
  if (view === "list") {
    const total = proposals.length;
    const totalVal = proposals.reduce((s, p) => s + (Number(p.value) || Number(p.total) || 0), 0);
    const wonCount = proposals.filter(p => p.status === "approved" || p.status === "won").length;
    const wonVal = proposals.filter(p => p.status === "approved" || p.status === "won").reduce((s, p) => s + (Number(p.value) || Number(p.total) || 0), 0);
    const activeCount = proposals.filter(p => p.status === "pending" || p.status === "negotiation" || p.status === "sent").length;
    const decided = proposals.filter(p => p.status === "approved" || p.status === "won" || p.status === "rejected" || p.status === "lost").length;
    const successRate = decided > 0 ? Math.round((wonCount / decided) * 100) : 0;

    const filtered = proposals.filter(p => {
      const matchTab = propTab === "all" ? true :
        propTab === "draft" ? (!p.status || p.status === "draft") :
          propTab === "sent" ? (p.status === "sent") :
            propTab === "negotiation" ? (p.status === "pending" || p.status === "negotiation") :
              propTab === "won" ? (p.status === "approved" || p.status === "won") :
                propTab === "lost" ? (p.status === "rejected" || p.status === "lost") : true;
      const matchSearch = !propSearch || (p.title || "").toLowerCase().includes(propSearch.toLowerCase()) || (p.client || "").toLowerCase().includes(propSearch.toLowerCase());
      const propDate = p.createdAt || p.sentAt || p.updatedAt || p.updated;
      const matchMonth = propDate ? new Date(propDate).toISOString().slice(0, 7) === selectedMonth : true;
      return matchTab && matchSearch && matchMonth;
    });

    const statusBadge = (s) => {
      if (!s || s === "draft") return { cls: "draft", label: "Draft" };
      if (s === "approved" || s === "won") return { cls: "won", label: "Won" };
      if (s === "rejected" || s === "lost") return { cls: "lost", label: "Lost" };
      if (s === "pending" || s === "negotiation") return { cls: "negotiation", label: "Negotiation" };
      if (s === "sent") return { cls: "sent", label: "Sent" };
      if (s === "review") return { cls: "review", label: "In Review" };
      return { cls: "draft", label: s };
    };

    const fmtDate = (d) => { try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return "—"; } };

    const getVal = (p) => Number(p.value) || Number(p.total) || 0;
    const pipelineStages = [
      { label: "Won", color: "var(--green)", count: wonCount, val: wonVal },
      { label: "Active", color: "var(--purple)", count: activeCount, val: proposals.filter(p => p.status === "pending" || p.status === "negotiation" || p.status === "sent").reduce((s, p) => s + getVal(p), 0) },
      { label: "Draft", color: "var(--text3)", count: proposals.filter(p => !p.status || p.status === "draft").length, val: proposals.filter(p => !p.status || p.status === "draft").reduce((s, p) => s + getVal(p), 0) },
    ];

    const themeGrad = (p) => {
      const t2 = THEMES.find(x => x.name === p.theme) || THEMES[0];
      return t2.g;
    };

    return (
      <div style={{ fontFamily: "var(--font,'Nunito',sans-serif)", minHeight: "100%", background: "var(--bg,#F5FAFA)", padding: "24px 28px 40px" }}>
        <style>{`
          .prop-list-wrap .stat-card{background:var(--surface,#fff);border:1.5px solid var(--border,#E0EEF0);border-radius:16px;padding:18px 20px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:all .15s;}
          .prop-list-wrap .stat-card:hover{border-color:var(--border,#E0EEF0);box-shadow:none;}
          .prop-list-wrap .proposal-card{background:var(--surface,#fff);border:1.5px solid var(--border,#E0EEF0);border-radius:16px;overflow:hidden;cursor:pointer;transition:all .2s;margin-bottom:14px;}
          .prop-list-wrap .proposal-card:hover{border-color:var(--teal, var(--app-accent, var(--app-accent, #00BCD4)));box-shadow:0 6px 24px rgba(0,188,212,.1);}
          .prop-list-wrap .prop-tab{padding:7px 18px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2,#607D86);transition:all .15s;border:none;background:none;font-family:inherit;}
          .prop-list-wrap .prop-tab.active{background:var(--teal, var(--app-accent, var(--app-accent, #00BCD4)));color:#fff;box-shadow:0 2px 10px rgba(0,188,212,.3);}
          .prop-list-wrap .prop-tab:not(.active):hover{background:var(--teal-light,var(--teal-light, var(--teal-light, #E0F7FA)));color:var(--teal, var(--app-accent, var(--app-accent, #00BCD4)));}
          .prop-list-wrap .pf-btn{display:flex;align-items:center;gap:5px;padding:7px 14px;border-radius:8px;border:1.5px solid var(--border,#E0EEF0);background:none;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;color:var(--text2,#607D86);transition:all .15s;}
          .prop-list-wrap .pf-btn:hover{border-color:var(--teal, var(--app-accent, var(--app-accent, #00BCD4)));color:var(--teal, var(--app-accent, var(--app-accent, #00BCD4)));background:var(--teal-light,var(--teal-light, var(--teal-light, #E0F7FA)));}
          .prop-list-wrap .pf-btn.primary{background:var(--teal, var(--app-accent, var(--app-accent, #00BCD4)));color:#fff;border-color:var(--teal, var(--app-accent, var(--app-accent, #00BCD4)));}
          .prop-list-wrap .pf-btn.primary:hover{background:var(--teal2,var(--app-accent2, #00ACC1));}
          .prop-list-wrap .pf-btn.danger{color:var(--red,#F05C5C);border-color:var(--red-bg,#FEF2F2);}
          .prop-list-wrap .badge-pill{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700;}
          .prop-list-wrap .badge-pill::before{content:'';width:5px;height:5px;border-radius:50%;}
          .prop-list-wrap .badge-won{background:var(--green-bg,#E8FAF3);color:var(--green,#26C281);} .prop-list-wrap .badge-won::before{background:var(--green,#26C281);}
          .prop-list-wrap .badge-sent{background:var(--blue-bg,#EFF4FF);color:var(--blue,#2563EB);} .prop-list-wrap .badge-sent::before{background:var(--blue,#2563EB);}
          .prop-list-wrap .badge-review{background:var(--amber-bg,#FEF5E6);color:var(--amber,#F5A623);} .prop-list-wrap .badge-review::before{background:var(--amber,#F5A623);}
          .prop-list-wrap .badge-draft{background:var(--surface2,#F8FAFB);color:var(--text3,#A0B8BE);border:1px solid var(--border,#E0EEF0);} .prop-list-wrap .badge-draft::before{background:var(--text3,#A0B8BE);}
          .prop-list-wrap .badge-lost{background:var(--red-bg,#FEF2F2);color:var(--red,#F05C5C);} .prop-list-wrap .badge-lost::before{background:var(--red,#F05C5C);}
          .prop-list-wrap .badge-negotiation{background:var(--purple-bg,#EEE9FF);color:var(--purple,#7C5CFC);} .prop-list-wrap .badge-negotiation::before{background:var(--purple,#7C5CFC);}
          .prop-list-wrap .scope-tag{padding:4px 10px;background:var(--bg,#F5FAFA);border:1.5px solid var(--border,#E0EEF0);border-radius:20px;font-size:10px;font-weight:700;color:var(--text2,#607D86);}
          .prop-list-wrap .add-card{background:var(--teal-lighter,var(--teal-lighter, #F0FDFE));border:2px dashed var(--teal, var(--app-accent, var(--app-accent, #00BCD4)));border-radius:16px;padding:28px;cursor:pointer;display:flex;align-items:center;gap:18px;transition:all .2s;}
          .prop-list-wrap .add-card:hover{background:var(--teal-light,var(--teal-light, var(--teal-light, #E0F7FA)));}
          .prop-list-wrap .tmpl-item{display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg,#F5FAFA);border-radius:9px;border:1.5px solid var(--border,#E0EEF0);margin-bottom:8px;cursor:pointer;transition:all .15s;}
          .prop-list-wrap .tmpl-item:last-child{margin-bottom:0;}
          .prop-list-wrap .tmpl-item:hover{border-color:var(--teal, var(--app-accent, var(--app-accent, #00BCD4)));background:var(--teal-lighter,var(--teal-lighter, #F0FDFE));}
          .prop-list-wrap .stage-item-row{display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg,#F5FAFA);border-radius:10px;border:1.5px solid var(--border,#E0EEF0);margin-bottom:8px;}
          .prop-list-wrap .filter-btn{display:flex;align-items:center;gap:6px;padding:9px 16px;background:var(--surface,#fff);border:1.5px solid var(--border,#E0EEF0);border-radius:10px;font-size:12px;font-weight:700;color:var(--text2,#607D86);cursor:pointer;font-family:inherit;transition:all .15s;}
          .prop-list-wrap .filter-btn:hover{border-color:var(--teal, var(--app-accent, var(--app-accent, #00BCD4)));color:var(--teal, var(--app-accent, var(--app-accent, #00BCD4)));}
          .prop-list-wrap .new-prop-btn{display:flex;align-items:center;gap:7px;padding:11px 20px;background:var(--teal, var(--app-accent, var(--app-accent, #00BCD4)));color:#fff;border:none;border-radius:12px;font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;transition:background .15s;box-shadow:0 4px 14px rgba(0,188,212,.25);}
          .prop-list-wrap .new-prop-btn:hover{background:var(--teal2,var(--app-accent2, #00ACC1));}
          .prop-list-wrap .prog-bar{height:5px;background:var(--border,#E0EEF0);border-radius:3px;overflow:hidden;margin-top:8px;}
          .prop-list-wrap .prog-fill{height:100%;border-radius:3px;}
          .prop-list-wrap .search-wrap{position:relative;flex:1;max-width:320px;}
          .prop-list-wrap .search-wrap i{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text3,#A0B8BE);font-size:15px;}
          .prop-list-wrap .search-wrap input{width:100%;padding:10px 14px 10px 36px;background:var(--surface,#fff);border:1.5px solid var(--border,#E0EEF0);border-radius:12px;font-size:13px;color:var(--text,#1A2E35);font-family:inherit;outline:none;transition:all .15s;}
          .prop-list-wrap .search-wrap input:focus{border-color:var(--teal, var(--app-accent, var(--app-accent, #00BCD4)));box-shadow:0 0 0 3px rgba(0,188,212,.08);}
        `}</style>

        <div className="prop-list-wrap">
          {/* PAGE HEADER */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text,#1A2E35)", margin: 0 }}>Project Proposals</h1>
              <p style={{ fontSize: 12, color: "var(--text3,#A0B8BE)", marginTop: 3 }}>Manage and track your client project proposals</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                style={{
                  padding: "8px 14px",
                  border: "1.5px solid var(--border,#E0EEF0)",
                  borderRadius: 10,
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text,#1A2E35)",
                  background: "#fff",
                  cursor: "pointer",
                  outline: "none"
                }}
              />
              <button className="new-prop-btn" onClick={openNewModal}><i className="ti ti-plus" style={{ fontSize: 15 }}></i> New Proposal</button>
            </div>
          </div>

          {/* STATS ROW */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
            <div className="stat-card" style={{ display: "flex", alignItems: "center", gap: 12, border: "1.5px solid var(--border,#E0EEF0)", cursor: "default" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--teal-light,var(--teal-light, var(--teal-light, #E0F7FA)))", color: "var(--teal, var(--app-accent, var(--app-accent, #00BCD4)))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 8, flexShrink: 0 }}><i className="ti ti-presentation"></i></div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text,#1A2E35)", lineHeight: 1 }}>{total}</div>
                <div style={{ fontSize: 11, color: "var(--text3,#A0B8BE)", fontWeight: 600, marginTop: 3 }}>Total Proposals</div>
                <div style={{ fontSize: 10, fontWeight: 700, marginTop: 4, color: "var(--teal, var(--app-accent, var(--app-accent, #00BCD4)))" }}>₹{totalVal.toLocaleString("en-IN")} pipeline</div>
              </div>
            </div>
            <div className="stat-card" style={{ border: "1.5px solid var(--border,#E0EEF0)", cursor: "default" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--green-bg,#E8FAF3)", color: "var(--green,#26C281)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}><i className="ti ti-trophy"></i></div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text,#1A2E35)", lineHeight: 1 }}>{wonCount}</div>
                <div style={{ fontSize: 11, color: "var(--text3,#A0B8BE)", fontWeight: 600, marginTop: 3 }}>Won</div>
                <div style={{ fontSize: 10, fontWeight: 700, marginTop: 4, color: "var(--green,#26C281)" }}>₹{wonVal.toLocaleString("en-IN")} closed</div>
              </div>
            </div>
            <div className="stat-card" style={{ border: "1.5px solid var(--border,#E0EEF0)", cursor: "default" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--purple-bg,#EEE9FF)", color: "var(--purple,#7C5CFC)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}><i className="ti ti-arrows-exchange"></i></div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text,#1A2E35)", lineHeight: 1 }}>{activeCount}</div>
                <div style={{ fontSize: 11, color: "var(--text3,#A0B8BE)", fontWeight: 600, marginTop: 3 }}>In Progress</div>
                <div style={{ fontSize: 10, fontWeight: 700, marginTop: 4, color: "var(--purple,#7C5CFC)" }}>Active pipeline</div>
              </div>
            </div>
            <div className="stat-card" style={{ border: "1.5px solid var(--border,#E0EEF0)", cursor: "default" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--amber-bg,#FEF5E6)", color: "var(--amber,#F5A623)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}><i className="ti ti-percentage"></i></div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text,#1A2E35)", lineHeight: 1 }}>{successRate}%</div>
                <div style={{ fontSize: 11, color: "var(--text3,#A0B8BE)", fontWeight: 600, marginTop: 3 }}>Success Rate</div>
                <div style={{ fontSize: 10, fontWeight: 700, marginTop: 4, color: "var(--amber,#F5A623)" }}>{wonCount} of {decided} decided</div>
              </div>
            </div>
          </div>

          {/* TABS + SEARCH */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 4, background: "var(--surface,#fff)", border: "1.5px solid var(--border,#E0EEF0)", borderRadius: 12, padding: 4 }}>
              {["all", "draft", "sent", "negotiation", "won", "lost"].map(t => (
                <button key={t} className={`prop-tab${propTab === t ? " active" : ""}`} onClick={() => { setPropTab(t); setActiveCard(t === "all" ? "all" : t === "won" ? "won" : t === "negotiation" ? "inprogress" : ""); }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="search-wrap">
                <i className="ti ti-search"></i>
                <input placeholder="Search proposals…" value={propSearch} onChange={e => setPropSearch(e.target.value)} />
              </div>
              <div style={{ fontSize: 12, color: "var(--text3,#A0B8BE)", fontWeight: 600, whiteSpace: "nowrap" }}>{filtered.length} proposals · ₹{totalVal.toLocaleString("en-IN")}</div>
            </div>
          </div>

          {/* MAIN GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>

            {/* LEFT – PROPOSALS */}
            <div>
              {loading ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text3,#A0B8BE)", fontSize: 14 }}></div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text3,#A0B8BE)", fontSize: 14 }}>No proposals found</div>
              ) : (
                <>
                  {filtered.map(p => {
                    const badge = statusBadge(p.status);
                    const initials = (p.title || p.id || "P").substring(0, 2).toUpperCase();
                    const clientInitial = (p.client || "?").charAt(0).toUpperCase();
                    const grad = themeGrad(p);
                    const created = p.updated || p.createdAt || p.created;
                    const value = Number(p.value) || Number(p.total) || 0;
                    const slides = p.slides?.length || 0;
                    return (
                      <div key={p.id || p._id} className="proposal-card" onClick={() => { setOpenMenuId(null); openDoc(p); }}>
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderBottom: "1px solid var(--border,#E0EEF0)" }}>
                          <div style={{ width: 48, height: 48, borderRadius: 13, background: grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{initials}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: "var(--teal, var(--app-accent, var(--app-accent, #00BCD4)))", letterSpacing: 0.5, marginBottom: 2 }}>{p.id}</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text,#1A2E35)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title || "Untitled Proposal"}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--teal, var(--app-accent, var(--app-accent, #00BCD4)))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{clientInitial}</div>
                              <span style={{ fontSize: 11, color: "var(--text2,#607D86)", fontWeight: 600 }}>{p.client || "No client assigned"}</span>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, position: "relative" }}>
                            <span className={`badge-pill badge-${badge.cls}`}>{badge.label}</span>
                            <button onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === (p.id || p._id) ? null : (p.id || p._id)); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3,#A0B8BE)", fontSize: 17, padding: 4 }}><i className="ti ti-dots-vertical"></i></button>
                            {openMenuId === (p.id || p._id) && (
                              <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: 28, right: 0, background: "#fff", border: "1.5px solid #e0eef0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 999, minWidth: 160, overflow: "hidden" }}>
                                <div onClick={e => { setOpenMenuId(null); setViewingProposal(p); }} style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#1A2E35", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f0f4f8" }} onMouseEnter={e => e.currentTarget.style.background = "#f0fdfe"} onMouseLeave={e => e.currentTarget.style.background = ""}><i className="ti ti-eye" style={{ color: " var(--app-accent, var(--app-accent, #00BCD4))" }}></i> View</div>
                                <div onClick={e => { setOpenMenuId(null); shareProposal(p); }} style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#1A2E35", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f0f4f8" }} onMouseEnter={e => e.currentTarget.style.background = "#f0fdfe"} onMouseLeave={e => e.currentTarget.style.background = ""}><i className="ti ti-share" style={{ color: "#7C5CFC" }}></i> Share</div>
                                <div onClick={e => { setOpenMenuId(null); printProposal(p); }} style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#1A2E35", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f0f4f8" }} onMouseEnter={e => e.currentTarget.style.background = "#f0fdfe"} onMouseLeave={e => e.currentTarget.style.background = ""}><i className="ti ti-download" style={{ color: "#2563EB" }}></i> PDF</div>
                                <div onClick={e => { setOpenMenuId(null); deleteProposal(p.id, p._id, e); }} style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#EF4444", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = "#fff1f2"} onMouseLeave={e => e.currentTarget.style.background = ""}><i className="ti ti-trash" style={{ color: "#EF4444" }}></i> Delete</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Body */}
                        <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, borderBottom: "1px solid var(--border,#E0EEF0)" }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3,#A0B8BE)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Proposal Value</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--teal, var(--app-accent, var(--app-accent, #00BCD4)))" }}>₹{value.toLocaleString("en-IN")}</div>
                            <div style={{ fontSize: 10, color: "var(--text3,#A0B8BE)", marginTop: 2 }}>Estimated</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3,#A0B8BE)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Pages</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text,#1A2E35)" }}>{slides}</div>
                            <div style={{ fontSize: 10, color: "var(--text3,#A0B8BE)", marginTop: 2 }}>Slides included</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3,#A0B8BE)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Last Updated</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text,#1A2E35)" }}>{fmtDate(created)}</div>
                            <div style={{ fontSize: 10, color: "var(--text3,#A0B8BE)", marginTop: 2 }}>Modified</div>
                          </div>
                        </div>

                        {/* Scope tags from slide types */}
                        {p.slides && p.slides.length > 0 && (
                          <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border,#E0EEF0)" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3,#A0B8BE)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Slide Types</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {[...new Set(p.slides.map(s => s.type))].slice(0, 5).map((t, i) => (
                                <span key={i} className="scope-tag">{SLIDE_TYPES.find(x => x.id === t)?.label || t}</span>
                              ))}
                              {p.slides.length > 5 && <span className="scope-tag">+{p.slides.length - 5} more</span>}
                            </div>
                          </div>
                        )}

                        {/* Progress bar */}
                        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border,#E0EEF0)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text2,#607D86)" }}>Proposal Stage</span>
                            <span style={{ fontSize: 10, color: "var(--text3,#A0B8BE)", fontWeight: 600 }}>{badge.label}</span>
                          </div>
                          <div className="prog-bar">
                            <div className="prog-fill" style={{ width: badge.cls === "draft" ? "10%" : badge.cls === "sent" ? "30%" : badge.cls === "review" ? "50%" : badge.cls === "negotiation" ? "75%" : badge.cls === "won" ? "100%" : "5%", background: badge.cls === "won" ? "linear-gradient(90deg,var(--green,#26C281),#6EE7B7)" : badge.cls === "negotiation" ? "linear-gradient(90deg,var(--purple,#7C5CFC),#B39DFF)" : badge.cls === "sent" ? "linear-gradient(90deg,var(--blue,#2563EB),#7EC8FD)" : "linear-gradient(90deg,var(--teal, var(--app-accent, var(--app-accent, #00BCD4))),#26D0CE)" }}></div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ fontSize: 11, color: "var(--text3,#A0B8BE)", display: "flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
                            <i className="ti ti-calendar" style={{ fontSize: 11 }}></i> Valid until {fmtDate(new Date(Date.now() + 30 * 86400000))}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--teal, var(--app-accent, var(--app-accent, #00BCD4)))" }}>₹{value.toLocaleString("en-IN")}</div>
                          <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                            <button className="pf-btn" onClick={e => { e.stopPropagation(); setViewingProposal(p); }}><i className="ti ti-eye" style={{ fontSize: 12 }}></i> View</button>
                            <button className="pf-btn" onClick={e => { e.stopPropagation(); shareProposal(p); }}><i className="ti ti-share" style={{ fontSize: 12 }}></i> Share</button>
                            <button className="pf-btn" onClick={e => { e.stopPropagation(); printProposal(p); }}><i className="ti ti-download" style={{ fontSize: 12 }}></i> PDF</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}


                </>
              )}
            </div>

            {/* RIGHT COL */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* PIPELINE SUMMARY */}
              <div style={{ background: "var(--surface,#fff)", border: "1.5px solid var(--border,#E0EEF0)", borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text,#1A2E35)", marginBottom: 4 }}>Pipeline Summary</div>
                <div style={{ fontSize: 11, color: "var(--text3,#A0B8BE)", marginBottom: 16 }}>Total value across all stages</div>
                <div style={{ textAlign: "center", padding: 14, background: "var(--teal-lighter,var(--teal-lighter, #F0FDFE))", borderRadius: 12, border: "1.5px solid var(--teal-light,var(--teal-light, var(--teal-light, #E0F7FA)))", marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: "var(--text3,#A0B8BE)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Pipeline Value</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "var(--teal, var(--app-accent, var(--app-accent, #00BCD4)))", marginTop: 3, letterSpacing: -0.5 }}>₹{totalVal.toLocaleString("en-IN")}</div>
                  <div style={{ fontSize: 11, color: "var(--text3,#A0B8BE)", marginTop: 2 }}>Across {total} proposals</div>
                </div>
                <div>
                  {pipelineStages.map((st, i) => (
                    <div key={i} className="stage-item-row">
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: st.color, flexShrink: 0 }}></div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text,#1A2E35)", flex: 1 }}>{st.label}</span>
                      <span style={{ fontSize: 11, color: "var(--text3,#A0B8BE)", fontWeight: 600 }}>{st.count} {st.count === 1 ? "proposal" : "proposals"}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: st.color }}>₹{(st.val / 1000).toFixed(0)}K</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* WIN RATE DONUT */}
              <div style={{ background: "var(--surface,#fff)", border: "1.5px solid var(--border,#E0EEF0)", borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text,#1A2E35)", marginBottom: 14 }}>Win Rate</div>
                <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 14px" }}>
                  <svg viewBox="0 0 100 100" width="100" height="100">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#E0EEF0" strokeWidth="12" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="url(#wg2)" strokeWidth="12"
                      strokeDasharray={`${successRate * 2.39} ${239 - successRate * 2.39}`} strokeDashoffset="28" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="wg2" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor=" var(--app-accent, var(--app-accent, #00BCD4))" />
                        <stop offset="100%" stopColor="#26C281" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text,#1A2E35)" }}>{successRate}%</div>
                    <div style={{ fontSize: 9, color: "var(--text3,#A0B8BE)", fontWeight: 600 }}>WIN RATE</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { val: wonCount, label: "Won", color: "var(--green,#26C281)" },
                    { val: proposals.filter(p => p.status === "rejected" || p.status === "lost").length, label: "Lost", color: "var(--red,#F05C5C)" },
                    { val: activeCount, label: "Active", color: "var(--amber,#F5A623)" },
                    { val: proposals.filter(p => !p.status || p.status === "draft").length, label: "Draft", color: "var(--text3,#A0B8BE)" },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: 10, background: "var(--bg,#F5FAFA)", borderRadius: 9, border: "1px solid var(--border,#E0EEF0)", textAlign: "center" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: 9, color: "var(--text3,#A0B8BE)", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PROPOSAL TEMPLATES */}
              <div style={{ background: "var(--surface,#fff)", border: "1.5px solid var(--border,#E0EEF0)", borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text,#1A2E35)", marginBottom: 12 }}>Quick Start Templates</div>
                {[
                  { icon: "ti-world", label: "Web Development", meta: "Full-stack project template", bg: "var(--teal-light,var(--teal-light, var(--teal-light, #E0F7FA)))", color: "var(--teal, var(--app-accent, var(--app-accent, #00BCD4)))" },
                  { icon: "ti-device-mobile", label: "Mobile App", meta: "iOS / Android template", bg: "var(--purple-bg,#EEE9FF)", color: "var(--purple,#7C5CFC)" },
                  { icon: "ti-chart-bar", label: "Digital Marketing", meta: "SEO, ads & content", bg: "var(--amber-bg,#FEF5E6)", color: "var(--amber,#F5A623)" },
                  { icon: "ti-cpu", label: "Custom Software", meta: "Enterprise solution", bg: "var(--blue-bg,#EFF4FF)", color: "var(--blue,#2563EB)" },
                ].map((tmpl, i) => (
                  <div key={i} className="tmpl-item" onClick={openNewModal}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: tmpl.bg, color: tmpl.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}><i className={`ti ${tmpl.icon}`}></i></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text,#1A2E35)" }}>{tmpl.label}</div>
                      <div style={{ fontSize: 10, color: "var(--text3,#A0B8BE)" }}>{tmpl.meta}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--teal, var(--app-accent, var(--app-accent, #00BCD4)))" }}>Use </span>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>

        {/* PROPOSAL VIEWER MODAL FOR SUBADMIN */}
        {viewingProposal && (
          <SubadminProposalViewer
            proposal={viewingProposal}
            onClose={() => setViewingProposal(null)}
            onPrint={() => printProposal(viewingProposal)}
            onShare={() => shareProposal(viewingProposal)}
            BASE_URL={BASE_URL}
            onUpdated={(updated) => {
              setProposals(prev => prev.map(p =>
                (p._id === updated._id || p.id === updated.id) ? updated : p
              ));
              setViewingProposal(updated);
            }}
          />
        )}
      </div>

    );
  }


}



