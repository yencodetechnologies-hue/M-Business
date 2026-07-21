import React, { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import axios from "axios";
import { BASE_URL, FRONTEND_URL } from "../config";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import AddClientView from "./AddClientView";

const GST_RATES = [0, 5, 12, 18, 28];
const DEFAULT_LOGO_URL = "";

function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const n = Math.round(Number(num) || 0);
  if (n === 0) return 'Zero';
  const toWords = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + toWords(n % 100) : '');
    if (n < 100000) return toWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + toWords(n % 1000) : '');
    if (n < 10000000) return toWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + toWords(n % 100000) : '');
    return toWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + toWords(n % 10000000) : '');
  };
  return toWords(n) + ' Only';
}

function generateInvoiceNo() {
  return `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}
// REPLACE WITH:
const CURRENCY_SYMBOLS = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ", SAR: "﷼", SGD: "S$",
  AUD: "A$", CAD: "C$", JPY: "¥", QAR: "﷼", KWD: "د.ك", OMR: "﷼", BHD: "BD",
  CHF: "CHF", NZD: "NZ$", MYR: "RM", THB: "฿", IDR: "Rp", PKR: "₨", BDT: "৳",
  LKR: "₨", NPR: "₨", MXN: "MX$", BRL: "R$", ZAR: "R", NGN: "₦", EGP: "E£",
  TRY: "₺", RUB: "₽",
};

function getCurrencySymbol(code, customSymbol) {
  return CURRENCY_SYMBOLS[code] || customSymbol || code || "₹";
}

function formatCurrency(val, currencyCode = "INR", compact = false, disableCompact = false, customSymbol = "") {
  const num = parseFloat(val) || 0;
  const absNum = Math.abs(num);
  const symbol = getCurrencySymbol(currencyCode, customSymbol);
  const isINR = currencyCode === "INR";

  if (!disableCompact && ((compact && absNum >= 100000) || absNum >= 10000000)) {
    try {
      const formatter = new Intl.NumberFormat(isINR ? 'en-IN' : 'en-US', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 2
      });
      return symbol + " " + formatter.format(num);
    } catch (e) {
      // Fallback
    }
  }

  return symbol + " " + num.toLocaleString(isINR ? "en-IN" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function formatDateTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Status Badge ---------------------------------------------
function StatusBadge({ status }) {
  const map = {
    paid: { bg: "#dcfce7", color: "#16a34a", label: "Success Paid" },
    unpaid: { bg: "#fff7ed", color: "#ea580c", label: "Pending Unpaid" },
    overdue: { bg: "#fee2e2", color: "#dc2626", label: " Overdue" },
    draft: { bg: "var(--app-surface)", color: "#64748b", label: "Draft" },
    sent: { bg: "#eff6ff", color: "#2563eb", label: "Sent" },
    part_paid: { bg: "var(--app-bg)", color: "var(--app-accent)", label: "Cost Part Payment" },
  };
  const s = map[(status || "draft").toLowerCase()] || map.draft;
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
      {s.label}
    </span>
  );
}

// ── Confirm Delete Modal --------------------------------------
function ConfirmModal({ invoiceNo, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "var(--app-card)", borderRadius: 24, width: "100%", maxWidth: 380, padding: "32px", boxShadow: "var(--app-shadow)", textAlign: "center", border: "1px solid var(--app-border)" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px" }}>Delete</div>
        <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 800, color: "#0f1c2e" }}>Delete Invoice?</h3>
        <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 24px", lineHeight: 1.5 }}>
          Are you sure you want to delete <strong style={{ color: "var(--app-accent)" }}>{invoiceNo}</strong>?
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "12px", background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#0f1c2e", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "12px", background: "#ef4444", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Toast -----------------------------------------------------
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "var(--app-card)", border: "2px solid #22c55e", borderRadius: 16, padding: "14px 24px", fontSize: 14, fontWeight: 800, color: "#22c55e", boxShadow: "var(--app-shadow)", display: "flex", alignItems: "center", gap: 10, animation: "fadeInUp 0.3s ease-out" }}>
      <span></span>
      {msg}
    </div>
  );
}

// ── LocalStorage helpers --------------------------------------
const DRAFTS_KEY = "invoice_drafts";
function loadAllDrafts() {
  try { const d = localStorage.getItem(DRAFTS_KEY); return d ? JSON.parse(d) : []; } catch { return []; }
}
function saveDraftLocal(inv, items, status = "draft") {
  const drafts = loadAllDrafts();
  const id = inv.invoiceNo;
  const existing = drafts.findIndex((d) => d.id === id);

  let subtotal = 0;
  let total = 0;
  items.forEach((item) => {
    const q = parseFloat(item.quantity) || 0;
    const r = parseFloat(item.rate) || 0;
    const rateGst = (item.gstRate !== undefined && item.gstRate !== null && item.gstRate !== "") ? parseFloat(item.gstRate) : (inv.gstRate !== undefined && inv.gstRate !== null && inv.gstRate !== "" ? parseFloat(inv.gstRate) : 0);
    const isIncl = item.isGstIncluded !== undefined ? item.isGstIncluded : (inv.isGstIncluded || false);

    const itemBase = q * r;
    if (isIncl) {
      total += itemBase;
      subtotal += itemBase / (1 + rateGst / 100);
    } else {
      subtotal += itemBase;
      total += itemBase * (1 + rateGst / 100);
    }
  });

  const entry = { id, invoiceNo: inv.invoiceNo, client: inv.client || "—", total, savedAt: Date.now(), inv, items, status };
  if (existing >= 0) drafts[existing] = entry; else drafts.unshift(entry);
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.slice(0, 50)));
}
function deleteDraftLocal(invoiceNo) {
  const drafts = loadAllDrafts().filter(d => d.id !== invoiceNo);
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

const T = { primary: "var(--app-sidebar)", sidebar: "#0f1c2e", accent: "var(--app-accent)", bg: "var(--app-bg)", card: "var(--app-card)", text: "#0f1c2e", muted: "#64748b", border: "var(--app-border)" };

function CompanyDropdown({ clients, value, onChange, error, onAddCompany }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = clients.filter(c => (c.clientName || c.name || "").toLowerCase().includes(search.toLowerCase()) || (c.companyName || c.company || "").toLowerCase().includes(search.toLowerCase()));
  const selected = clients.find(c => (c.clientName || c.name) === value);
  return (
    <div style={{ position: "relative", zIndex: open ? 1000 : 1 }}>
      <div onClick={() => setOpen(!open)} style={{ width: "100%", border: `1.5px solid ${error ? "#EF4444" : open ? "var(--app-accent)" : "var(--app-border)"}`, borderRadius: 10, padding: "10px 36px 10px 14px", fontSize: 13, color: value ? T.text : "#64748b", background: "var(--app-bg)", cursor: "pointer", userSelect: "none", boxSizing: "border-box", position: "relative", minHeight: 42 }}>
        {value ? (<div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{value[0].toUpperCase()}</div><span>{value}</span>{selected?.companyName && <span style={{ fontSize: 11, color: "#64748b" }}>({selected.companyName})</span>}</div>) : "-- Select Company Name --"}
        <span style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, fontSize: 10, color: "#64748b", transition: "0.2s" }}>▼</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--app-card)", border: "1.5px solid var(--app-border)", borderRadius: 12, boxShadow: "var(--app-shadow)", zIndex: 999, overflow: "hidden" }}>
          <div style={{ padding: "10px 10px 6px" }}><div style={{ position: "relative" }}><span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12 }}></span><input autoFocus placeholder="Search company name..." value={search} onChange={e => setSearch(e.target.value)} onClick={e => e.stopPropagation()} style={{ width: "100%", padding: "7px 10px 7px 30px", border: "1.5px solid var(--app-border)", borderRadius: 8, fontSize: 12, background: "var(--app-bg)", color: T.text, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} /></div></div>
          {onAddCompany && <div onClick={() => { setOpen(false); setSearch(""); onAddCompany(); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: "var(--app-surface)", borderBottom: "2px solid var(--app-border)" }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 17, fontWeight: 700, flexShrink: 0 }}>+</div><div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--app-accent)" }}>Add New Company Name</div></div></div>}
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filtered.length === 0 ? <div style={{ padding: 14, textAlign: "center", color: "#64748b", fontSize: 13 }}>No companies found</div>
              : filtered.map((c, i) => { const name = c.clientName || c.name || ""; const company = c.companyName || c.company || ""; const isSel = value === name; return (<div key={i} onClick={() => { onChange(name); setOpen(false); setSearch(""); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: isSel ? "var(--app-surface)" : "transparent", borderBottom: "1px solid var(--app-border)" }} onMouseEnter={e => e.currentTarget.style.background = "var(--app-surface)"} onMouseLeave={e => e.currentTarget.style.background = isSel ? "var(--app-surface)" : "transparent"}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>{name[0]?.toUpperCase() || "?"}</div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{name}</div>{company && <div style={{ fontSize: 11, color: "#64748b" }}>{company}</div>}</div>{isSel && <i className="ti ti-check" style={{ fontSize: 14, color: "var(--app-accent)" }} />}</div>); })}
          </div>
        </div>
      )}
      {open && <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={() => { setOpen(false); setSearch(""); }} />}
    </div>
  );
}

function ProjectDropdown({ projects, value, onChange, onAddProject, disabled }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = projects.filter(p => (p.name || "").toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ position: "relative", zIndex: open ? 1000 : 1 }}>
      <div onClick={() => { if (!disabled) setOpen(!open) }} style={{ width: "100%", border: `1.5px solid ${open ? "var(--app-accent)" : "var(--app-border)"}`, borderRadius: 10, padding: "10px 36px 10px 14px", fontSize: 13, color: value ? T.text : "#64748b", background: "var(--app-bg)", cursor: disabled ? "not-allowed" : "pointer", userSelect: "none", boxSizing: "border-box", position: "relative", minHeight: 42, opacity: disabled ? 0.5 : 1 }}>
        {value ? (<div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{value[0].toUpperCase()}</div><span>{value}</span></div>) : "-- Select Project --"}
        <span style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, fontSize: 10, color: "#64748b", transition: "0.2s" }}>▼</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--app-card)", border: "1.5px solid var(--app-border)", borderRadius: 12, boxShadow: "var(--app-shadow)", zIndex: 999, overflow: "hidden" }}>
          <div style={{ padding: "10px 10px 6px" }}><div style={{ position: "relative" }}><span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12 }}></span><input autoFocus placeholder="Search project..." value={search} onChange={e => setSearch(e.target.value)} onClick={e => e.stopPropagation()} style={{ width: "100%", padding: "7px 10px 7px 30px", border: "1.5px solid var(--app-border)", borderRadius: 8, fontSize: 12, background: "var(--app-bg)", color: T.text, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} /></div></div>
          {onAddProject && <div onClick={() => { setOpen(false); setSearch(""); onAddProject(); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: "var(--app-surface)", borderBottom: "2px solid var(--app-border)" }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 17, fontWeight: 700, flexShrink: 0 }}>+</div><div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--app-accent)" }}>Add New Project</div></div></div>}
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filtered.length === 0 ? <div style={{ padding: 14, textAlign: "center", color: "#64748b", fontSize: 13 }}>No projects found</div>
              : filtered.map((p, i) => { const name = p.name || ""; const isSel = value === name; return (<div key={i} onClick={() => { onChange(name); setOpen(false); setSearch(""); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: isSel ? "var(--app-surface)" : "transparent", borderBottom: "1px solid var(--app-border)" }} onMouseEnter={e => e.currentTarget.style.background = "var(--app-surface)"} onMouseLeave={e => e.currentTarget.style.background = isSel ? "var(--app-surface)" : "transparent"}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>{name[0]?.toUpperCase() || "?"}</div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{name}</div></div>{isSel && <span style={{ fontSize: 14, color: "var(--app-accent)" }}>Yes</span>}</div>); })}
          </div>
        </div>
      )}
      {open && <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={() => { setOpen(false); setSearch(""); }} />}
    </div>
  );
}

function CanvasSignature({ onSave }) {
  const canvasRef = React.useRef(null);
  const pointsRef = React.useRef([]);
  const [isDrawing, setIsDrawing] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get display size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set actual size in memory (scaled for retina/high-DPI displays)
    canvas.width = (rect.width || 340) * dpr;
    canvas.height = (rect.height || 150) * dpr;

    // Normalize coordinate system to use CSS pixels
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = "#1a2e35";
    ctx.fillStyle = "#1a2e35";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Support mouse and touch coords
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Adjust scale based on CSS width vs internal resolution (in CSS pixels)
    const scaleX = (canvas.width / (window.devicePixelRatio || 1)) / rect.width;
    const scaleY = (canvas.height / (window.devicePixelRatio || 1)) / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (e.touches) e.preventDefault();
    const pos = getPos(e);
    pointsRef.current = [pos];
    setIsDrawing(true);

    // Draw a single dot immediately to support taps/clicks without dragging
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.touches) e.preventDefault();
    const pos = getPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const points = pointsRef.current;
    points.push(pos);

    // Use quadratic curves for smooth lines
    if (points.length > 2) {
      const p1 = points[points.length - 3];
      const p2 = points[points.length - 2];
      const p3 = points[points.length - 1];

      const midPointX = (p2.x + p3.x) / 2;
      const midPointY = (p2.y + p3.y) / 2;

      ctx.beginPath();
      // Start from the previous midpoint
      const prevMidPointX = (p1.x + p2.x) / 2;
      const prevMidPointY = (p1.y + p2.y) / 2;
      ctx.moveTo(prevMidPointX, prevMidPointY);
      ctx.quadraticCurveTo(p2.x, p2.y, midPointX, midPointY);
      ctx.stroke();
    } else if (points.length === 2) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    pointsRef.current = [];
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const save = () => {
    const canvas = canvasRef.current;
    onSave(canvas.toDataURL());
  };

  return (
    <div style={{ background: "#F5FAFA", border: "1.5px solid #E0EEF0", borderRadius: 10, padding: 12 }}>
      <canvas
        ref={canvasRef}
        width={340}
        height={150}
        style={{ border: "1.5px dashed #C5DDE0", borderRadius: 8, background: "#fff", cursor: "crosshair", width: "100%", height: 150, display: "block" }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button type="button" onClick={clear} style={{ padding: "5px 12px", fontSize: 11, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 6, cursor: "pointer", fontWeight: "700", color: "#374151" }}>Clear</button>
        <button type="button" onClick={save} style={{ padding: "5px 12px", fontSize: 11, background: "var(--teal)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "800" }}>Apply Signature</button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
export default function InvoiceCreator({ user, clients = [], projects = [], companyLogo, companyName, onLogoChange, onAddClient, onAddProject, onBack, jumpInvoice, newInvoicePrefill, onSaveLocalInvoice, onSaveSuccess, forceListView }) {
  const effectiveLogo = companyLogo || DEFAULT_LOGO_URL;
  const effectiveCompanyName = companyName || "";

  const [step, setStep] = useState(() => {
    if (jumpInvoice && (jumpInvoice._id || jumpInvoice.id)) return "preview";
    if (newInvoicePrefill) return "form";
    try {
      const savedStep = localStorage.getItem("invoiceCreatorStep_subadmin");
      const savedId = localStorage.getItem("invoiceCreatorEditingId_subadmin");
      if (savedStep === "preview" && savedId) return "preview";
      if (savedStep === "form") return "form";
    } catch (e) { }
    return "list";
  });

  useEffect(() => {
    try { localStorage.setItem("invoiceCreatorStep_subadmin", step); } catch (e) { }
  }, [step]);

  useEffect(() => {
    try { localStorage.setItem("invoiceCreatorStep_subadmin", step); } catch (e) { }
  }, [step]);

  useEffect(() => {
    try { localStorage.setItem("invoiceCreatorStep_subadmin", step); } catch (e) { }
  }, [step]);

  useEffect(() => {
    try { localStorage.setItem("invoiceCreatorStep_subadmin", step); } catch (e) { }
  }, [step]); // "list" | "form" | "preview"
  const [showAddClient, setShowAddClient] = useState(false);
  const [internalNav, setInternalNav] = useState(false);
  const [invoiceList, setInvoiceList] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    if (step === "preview") window.scrollTo(0, 0);
  }, [step]);

  useEffect(() => {
    if (jumpInvoice) {
      if (jumpInvoice._restoring) {
        if (invoiceList.length > 0) {
          const restored = invoiceList.find(e => (e.id || e.invoiceNo) === (jumpInvoice.id || jumpInvoice.invoiceNo));
          if (restored) {
            loadEntry(restored, "preview");
            setInternalNav(false);
          }
        }
        return;
      }
      loadEntry(jumpInvoice);
      setStep("preview");
      setInternalNav(false);
    }
  }, [jumpInvoice?._t, jumpInvoice?.invoiceNo, jumpInvoice?.signature, jumpInvoice?._restoring, invoiceList]);

  // Force back to the global invoice list whenever the parent explicitly
  // clears both jumpInvoice and newInvoicePrefill (e.g. Sidebar > Invoices
  // was clicked while this component was already mounted from a
  // project-specific New Invoice flow). Without this, `step`/`editingId`
  // just keep whatever they were left at, since this component never
  // remounts on that click.
  const prevJumpRef = useRef({ jumpInvoice, newInvoicePrefill });
  useEffect(() => {
    const had = prevJumpRef.current;
    if ((had.jumpInvoice || had.newInvoicePrefill) && !jumpInvoice && !newInvoicePrefill && !internalNav) {
      setStep("list");
      setEditingId(null);
      setInv({ ...blank, invoiceNo: generateInvoiceNo() });
      setItems([{ id: 1, description: "", quantity: 1, rate: "" }]);
      setLocalEditTarget(null);
      try {
        localStorage.removeItem("invoiceCreatorStep_subadmin");
        localStorage.removeItem("invoiceCreatorEditingId_subadmin");
      } catch (e) { }
    }
    prevJumpRef.current = { jumpInvoice, newInvoicePrefill };
  }, [jumpInvoice, newInvoicePrefill, internalNav]);

  useEffect(() => {
    if (newInvoicePrefill) {
      if (newInvoicePrefill.editData) {
        loadEntry(newInvoicePrefill.editData, newInvoicePrefill.readOnly ? "preview" : "form");
        return;
      }
      if (false) {
        // Edit mode — pre-fill existing invoice data
        const ed = newInvoicePrefill.editData;
        setInv({
          ...blank,
          ...ed,
          client: ed.client || newInvoicePrefill.client || '',
          project: ed.project || newInvoicePrefill.project || '',
          date: ed.date || blank.date,
          dueDate: ed.dueDate || blank.dueDate,
          dueDateType: ed.dueDate ? 'custom' : (ed.dueDateType || '30'),
          notes: ed.notes ?? blank.notes,
          terms: ed.terms ?? blank.terms,
          companyName: ed.companyName || blank.companyName,
          companyEmail: ed.companyEmail || blank.companyEmail,
          companyPhone: ed.companyPhone || blank.companyPhone,
          companyAddress: ed.companyAddress || blank.companyAddress,
          bankName: ed.bankName || blank.bankName,
          accountNumber: ed.accountNumber || blank.accountNumber,
          ifscCode: ed.ifscCode || blank.ifscCode,
          upiId: ed.upiId || blank.upiId,
          signature: ed.signature || '',
          signatureType: ed.signatureType || 'text',
          invoiceType: ed.invoiceType || 'Milestone',
          customInvoiceType: ed.customInvoiceType || '',
          discountPct: ed.discountPct ?? '',
          discountType: ed.discountType || 'Percentage',
          customDiscountType: ed.customDiscountType || '',
          template: ed.template || 'Classic',
          footerMessage: ed.footerMessage || blank.footerMessage,
          amountPaid: ed.amountPaid ?? 0,
          currency: ed.currency || 'INR',
          gstRate: ed.gstRate ?? 18,
        });
        const lineItems = ed.items || ed.lineItems;
        setItems(lineItems && lineItems.length > 0 ? lineItems.map((it, i) => ({ ...it, id: it.id || i + 1 })) : [{ id: 1, description: ed.description || '', quantity: 1, rate: ed.amount || '' }]);
        setEditingId(ed._id || null);
        setLocalEditTarget(newInvoicePrefill.projectId ? { projectId: newInvoicePrefill.projectId, index: newInvoicePrefill.editIndex } : null);
        setErrors({});
        setStep("form");
        setInternalNav(false);
      } else {
        // New invoice        
        setInv({ ...blank, invoiceNo: generateInvoiceNo(), client: newInvoicePrefill.client || "", project: newInvoicePrefill.project || "" });
        setItems([{ id: 1, description: "", quantity: 1, rate: "" }]);
        setEditingId(null);
        setLocalEditTarget(newInvoicePrefill.projectId ? { projectId: newInvoicePrefill.projectId, index: null } : null);
        setErrors({});
        setStep("form");
        setInternalNav(false);
      }
    }
  }, [newInvoicePrefill]);

  const [saving, setSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null); // entry to delete
  const [viewEntry, setViewEntry] = useState(null);       // entry for view modal
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [paymentModalEntry, setPaymentModalEntry] = useState(null);
  const [shareModalEntry, setShareModalEntry] = useState(null); // entry pending client selection for Share
  const [shareSelectedClientId, setShareSelectedClientId] = useState("");
  const [paymentModalStatus, setPaymentModalStatus] = useState("paid");
  const [paymentData, setPaymentData] = useState({ amountPaid: 0, paymentMode: "GPay", paymentDate: new Date().toISOString().split("T")[0], transactionId: "" });
  const [sendReceipt, setSendReceipt] = useState(false);
  const [receiptEntry, setReceiptEntry] = useState(null);
  const [editingReceipt, setEditingReceipt] = useState(false);
  const [listSearch, setListSearch] = useState("");
  const [filterTab, setFilterTab] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [clientFilter, setClientFilter] = useState("all");
  const [sigTab, setSigTab] = useState("draw");
  const [typedSig, setTypedSig] = useState("");

  const handleExportCSV = (data) => {
    if (!data.length) {
      showToast({ msg: "No data to export", type: "err" });
      return;
    }
    const headers = ["Invoice ID", "Client", "Project", "Issue Date", "Due Date", "Status", "Amount", "Currency"];
    const rows = data.map(e => [
      e.invoiceNo, e.client, e.inv?.project || e.project || "",
      e.inv?.date || e.date, e.inv?.dueDate || e.dueDate,
      e.status, e.total || e.amount || 0, e.currency || "INR"
    ]);
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `invoices_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const iframeRef = useRef(null);

  useEffect(() => {
    const handleMsg = (e) => {
      if (e.data?.type === 'SAVE_DOCUMENT' && e.data?.payload?.docType === 'inv') {
        const payload = e.data.payload;
        const newDoc = {
          id: Date.now(),
          invoiceNo: payload.invoiceNo || `INV-${Date.now()}`,
          quotationNo: payload.invoiceNo || `INV-${Date.now()}`,
          proposalNo: payload.invoiceNo || `INV-${Date.now()}`,
          client: payload.client || 'Unknown Client',
          date: payload.date || new Date().toISOString().split('T')[0],
          dueDate: payload.dueDate || new Date().toISOString().split('T')[0],
          status: 'draft',
          amount: payload.amount || 0,
          total: payload.amount || 0,
          currency: 'INR',
          htmlContent: payload.htmlContent,
          type: 'invoice',
          title: payload.client + ' - Invoice'
        };
        setInvoices(prev => [newDoc, ...prev]);
        setStep("list");
        if (typeof showToast === 'function') showToast("Invoice saved successfully!");
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

  const today = new Date().toISOString().split("T")[0];
  const dueDefault = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const blank = {
    invoiceNo: generateInvoiceNo(), orderNo: "", date: "2026-06-01", dueDate: "2026-06-15", dueDateType: "30",
    client: "", project: "", gstRate: 18, notes: "Thank you for your business! Please make payment within the due date.\nFor queries contact: ",
    terms: "1. Payment is due within the agreed terms.\n2. Late payments are subject to 2% monthly interest.\n3. All disputes subject to Chennai jurisdiction.",
    companyName: "YENCODE Technologies", companyEmail: "",
    companyPhone: "", companyAddress: "Chennai, Tamil Nadu, India – 600001",
    currency: "INR",
    customCurrencySymbol: "",
    status: "pending",
    template: "Classic",
    footerMessage: " Thank you for considering us!",
    amountPaid: 0,
    paymentDate: "2026-06-01",
    paymentMode: "Bank Transfer / NEFT",
    transactionId: "",
    isGstIncluded: false,
    upiId: "yencode@okaxis",
    bankName: "HDFC Bank",
    accountName: "YENCODE Technologies",
    accountNumber: "5020123456789",
    ifscCode: "HDFC0001234",
    signature: "",
    signatureType: "text",
    invoiceType: "Milestone",
    customInvoiceType: "",
    discountPct: "",
    discountType: "Percentage",
    customDiscountType: "",
  };

  const [inv, setInv] = useState(blank);
  const [items, setItems] = useState([
    { id: 1, description: "", quantity: 1, rate: "" }
  ]);
  const [editingId, setEditingId] = useState(() => {
    try {
      const savedStep = localStorage.getItem("invoiceCreatorStep_subadmin");
      const savedId = localStorage.getItem("invoiceCreatorEditingId_subadmin");
      if (savedStep === "preview" && savedId) return savedId;
    } catch (e) { }
    return null;
  }); // backend _id if editing existing

  useEffect(() => {
    try {
      if (step === "preview" && editingId) {
        localStorage.setItem("invoiceCreatorStep_subadmin", "preview");
        localStorage.setItem("invoiceCreatorEditingId_subadmin", editingId);
      } else {
        localStorage.removeItem("invoiceCreatorStep_subadmin");
        localStorage.removeItem("invoiceCreatorEditingId_subadmin");
      }
    } catch (e) { }
  }, [step, editingId]);

  // Restore the invoice's actual data (inv/items) into the preview after a
  // hard refresh, when we only have a persisted editingId (no jumpInvoice
  // was passed in — e.g. New Invoice → Preview & Print → refresh).
  useEffect(() => {
    if (!jumpInvoice && step === "preview" && editingId && !inv.client && invoiceList.length > 0) {
      const restored = invoiceList.find(e => (e._id || e.id) === editingId);
      if (restored) {
        loadEntry(restored, "preview");
      }
    }
  }, [step, editingId, invoiceList, jumpInvoice]);

  const [localEditTarget, setLocalEditTarget] = useState(null); // { projectId, index } for project-local invoices

  const getTemplateStyles = (templateName) => {
    switch (templateName) {
      case "Minimal":
        return {
          primaryColor: "#111827",
          primaryBg: "#F3F4F6",
          logoColor: "linear-gradient(135deg, #374151, #111827)",
          borderStyle: "1px solid #E5E7EB",
          headerUnderline: "1px solid #E5E7EB",
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        };
      case "Classic":
        return {
          primaryColor: " var(--app-accent, var(--app-accent, #00BCD4))",
          primaryBg: "var(--teal-light, var(--teal-light, #E0F7FA))",
          logoColor: "linear-gradient(135deg,  var(--app-accent, var(--app-accent, #00BCD4)), #006E7F)",
          borderStyle: "1px solid #E0EEF0",
          headerUnderline: "3px solid  var(--app-accent, var(--app-accent, #00BCD4))",
          fontFamily: "'Nunito', sans-serif"
        };
      case "Modern":
      default:
        return {
          primaryColor: "#7C5CFC",
          primaryBg: "#EEE9FF",
          logoColor: "linear-gradient(135deg, #7C5CFC, #4C1D95)",
          borderStyle: "1px solid #E5E7EB",
          headerUnderline: "3px solid #7C5CFC",
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        };
    }
  };
  const currentT = getTemplateStyles(inv.template);

  const upd = (f, v) => setInv((p) => ({ ...p, [f]: v }));
  const selectedClient = clients.find((c) => (c.clientName || c.name) === inv.client);
  const filteredProjects = projects.filter((p) =>
    !inv.client || p.client === inv.client || p.clientName === inv.client ||
    p.clientId === selectedClient?._id
  );

  // totals
  let subtotal = 0;
  let gstAmt = 0;
  let total = 0;

  items.forEach((item) => {
    const q = parseFloat(item.quantity) || 0;
    const r = parseFloat(item.rate) || 0;
    const rateGst = (item.gstRate !== undefined && item.gstRate !== null && item.gstRate !== "") ? parseFloat(item.gstRate) : (inv.gstRate !== undefined && inv.gstRate !== null && inv.gstRate !== "" ? parseFloat(inv.gstRate) : 0);
    const isIncl = item.isGstIncluded !== undefined ? item.isGstIncluded : (inv.isGstIncluded || false);

    const itemBase = q * r;
    if (isIncl) {
      const itemTotal = itemBase;
      const itemSubtotal = itemTotal / (1 + rateGst / 100);
      const itemGst = itemTotal - itemSubtotal;

      subtotal += itemSubtotal;
      gstAmt += itemGst;
      total += itemTotal;
    } else {
      const itemSubtotal = itemBase;
      const itemGst = itemSubtotal * (rateGst / 100);
      const itemTotal = itemSubtotal + itemGst;

      subtotal += itemSubtotal;
      gstAmt += itemGst;
      total += itemTotal;
    }
  });

  let discountAmt = 0;
  if (inv.discountPct) {
    const discVal = parseFloat(inv.discountPct) || 0;
    if (inv.discountType === "Custom") {
      discountAmt = discVal;
    } else {
      discountAmt = (subtotal * discVal) / 100;
    }
  }

  const amountPaid = parseFloat(inv.amountPaid) || 0;
  const balanceDue = total - discountAmt + (parseFloat(inv.extraCharges) || 0) - amountPaid;

  // ── Fetch list ----------------------------------------------
  const fetchList = async () => {
    setListLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/invoices?_t=${Date.now()}`);
      if (res.data.success && Array.isArray(res.data.invoices)) {
        setInvoiceList(res.data.invoices);
      } else {
        console.warn("Invoice list fetch returned unexpected shape, falling back to local drafts");
        setInvoiceList(loadAllDrafts());
      }
    } catch (err) {
      console.error("Invoice list fetch failed, falling back to local drafts", err);
      setInvoiceList(loadAllDrafts());
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);
  useEffect(() => { if (step === "list") fetchList(); }, [step]);

  // ── Items ---------------------------------------------------
  const addItem = () => setItems((p) => [...p, { id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, description: "", quantity: 1, rate: "" }]);
  const removeItem = (id) => {
    setItems((p) => {
      if (p.length > 1) return p.filter((i) => i.id !== id);
      return [{ id: 1, description: "", quantity: 1, rate: "" }];
    });
  };
  const updItem = (id, f, v) => {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, [f]: v } : i)));
    setErrors((prev) => { const n = { ...prev }; delete n[`item_${id}_${f}`]; return n; });
  };

  // ── Validate ------------------------------------------------
  const validate = () => {
    const errs = {};
    let firstErrId = null;

    if (!inv.client) {
      errs.client = "Company Name is required";
      firstErrId = "field-client";
    }
    items.forEach((item, idx) => {
      if (!item.description.trim()) {
        errs[`item_${item.id}_description`] = `Item ${idx + 1}: description required`;
        if (!firstErrId) firstErrId = `item_${item.id}_description`;
      }
      if (!item.rate || parseFloat(item.rate) <= 0) {
        errs[`item_${item.id}_rate`] = `Item ${idx + 1}: rate required`;
        if (!firstErrId) firstErrId = `item_${item.id}_rate`;
      }
    });
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      setTimeout(() => {
        if (firstErrId) {
          const el = document.getElementById(firstErrId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus && el.focus();
          }
        }
      }, 100);
      return false;
    }
    return true;
  };

  // ── Load entry into form (EDIT) -----------------------------
  const loadEntry = (entry, targetStep = "form") => {
    // Use entry.inv if it exists, otherwise treat entry itself as the invoice
    const invData = entry.inv || entry;
    // Signature can live on entry, entry.inv, or (rarely) a top-level
    // savedSignature field depending on the fetch path — check them all
    // so a previously saved signature is never dropped in Edit mode.
    const sig = invData.signature || entry.signature || entry.savedSignature || '';
    const sigType = invData.signatureType || entry.signatureType || (sig ? (sig.startsWith('data:image') ? 'image' : 'text') : 'text');
    setInv({
      ...blank,
      ...invData,
      invoiceNo: invData.invoiceNo || entry.invoiceNo || blank.invoiceNo,
      client: invData.client || entry.client || '',
      date: invData.date || entry.date || blank.date,
      dueDate: invData.dueDate || entry.dueDate || blank.dueDate,
      status: invData.status || entry.status || 'draft',
      signature: sig,
      signatureType: sigType,
    });
    const sourceItems = (entry.items?.length ? entry.items : invData.items) || [];
    if (sourceItems.length) {
      setItems(sourceItems.map((it, i) => ({ ...it, id: it.id || i + 1 })));
    } else {
      // Older/legacy invoices sometimes only stored a total with no item
      // breakdown. Rather than showing a blank "—" / ₹0 row, synthesize a
      // single summary line from the saved total so nothing looks missing.
      const savedTotal = parseFloat(entry.total ?? invData.total) || 0;
      setItems([{
        id: 1,
        description: invData.notes || entry.description || 'Invoice Total',
        quantity: 1,
        rate: savedTotal,
        gstRate: invData.gstRate ?? 0,
      }]);
    }
    // The document's real Mongo _id may live on entry, entry.inv, or entry._id
    // depending on which fetch path populated this row — check all of them
    // so Save always issues a PUT (update) instead of falling back to POST
    // (which silently creates a duplicate invoice).
    setEditingId(entry._id || entry.id || invData._id || invData.id || null);
    setErrors({});
    setDraftSaved(false);
    setStep(targetStep);
  };

  // ── Clear ---------------------------------------------------
  const clearForm = () => {
    setInv({ ...blank, invoiceNo: generateInvoiceNo() });
    setItems([
      { id: 1, description: "", quantity: 1, rate: "" }
    ]);
    setErrors({});
    setEditingId(null);
    setLocalEditTarget(null);
  };

  // ── API save ------------------------------------------------
  const apiSave = async (status = "draft") => {
    try {
      const newStatus = inv.status || status;
      const computedTotal = total - discountAmt + (parseFloat(inv.extraCharges) || 0);
      const payloadInv = { ...inv, total: computedTotal, signature: inv.signature || "", signatureType: inv.signatureType || "text" };
      const res = editingId
        ? await axios.put(`${BASE_URL}/api/invoices/${editingId}`, { inv: payloadInv, items, status: newStatus })
        : await axios.post(`${BASE_URL}/api/invoices`, { inv: payloadInv, items, status: newStatus });

      // Keep the project's own invoice list in sync (Projects → Accounts view)
      if (localEditTarget && localEditTarget.projectId && onSaveLocalInvoice) {
        await onSaveLocalInvoice(localEditTarget.projectId, localEditTarget.index, buildLocalInvoiceRecord());
      }
      return res.data;
    } catch {
      return { success: false };
    }
  };

  // ── Build record for project-local invoice array -------------
  const buildLocalInvoiceRecord = () => ({
    invoiceNo: inv.invoiceNo,
    description: items[0]?.description || inv.notes || 'Invoice',
    amount: total - discountAmt + (parseFloat(inv.extraCharges) || 0),
    taxType: inv.isGstIncluded ? 'inclusive' : 'exclusive',
    taxPercent: (items[0]?.gstRate !== undefined && items[0]?.gstRate !== null && items[0]?.gstRate !== "") ? Number(items[0].gstRate) : Number(inv.gstRate) || 0,
    issueDate: inv.date,
    dueDate: inv.dueDate,
    status: inv.status || 'pending',
    notes: inv.notes,
    signature: inv.signature || '',
    signatureType: inv.signatureType || 'text',
    invoiceType: inv.invoiceType || 'Milestone',
    customInvoiceType: inv.customInvoiceType || '',
    discountPct: inv.discountPct || 0,
    discountType: inv.discountType || 'Percentage',
    customDiscountType: inv.customDiscountType || '',
    items,
  });

  // ── Save Draft ----------------------------------------------
  const handleSaveDraft = async () => {
    if (!validate()) return;
    setSaving("draft");
    const data = await apiSave("draft");
    saveDraftLocal(inv, items, "draft");
    if (data.success && data.invoice?._id) setEditingId(data.invoice._id);
    setDraftSaved(true);
    setSaving(false);
    showToast("Save Draft saved!");
    setTimeout(() => {
      setDraftSaved(false);
      if (onSaveSuccess) { onSaveSuccess(); return; }
      setStep("list");
    }, 1000);
  };

  // ── Save & Preview ------------------------------------------
  const handleSavePreview = async () => {
    if (!validate()) return;
    setSaving("preview");
    const data = await apiSave("draft");
    saveDraftLocal(inv, items, "draft");
    if (data.success && data.invoice?._id) setEditingId(data.invoice._id);
    setSaving(false);
    if (onSaveSuccess) { onSaveSuccess(); return; }
    setStep("preview");
    window.scrollTo(0, 0);
  };

  // ── Delete invoice ------------------------------------------
  const handleDelete = async (entry) => {
    const id = entry._id || entry.id;
    try {
      await axios.delete(`${BASE_URL}/api/invoices/${id}`);
    } catch (err) {
      console.error('Delete invoice failed:', err);
      alert('Failed to delete invoice from the server. Please try again.');
      setDeleteTarget(null);
      return;
    }
    deleteDraftLocal(entry.invoiceNo);
    setInvoiceList(prev => prev.filter(e => (e.id || e.invoiceNo) !== (id || entry.invoiceNo)));
    setDeleteTarget(null);
    setStep("list");
    showToast("Invoice deleted!");
  };

  // ── Update status inline ------------------------------------
  const handleStatusChange = async (entry, newStatus) => {
    if (newStatus === "paid" || newStatus === "part_paid") {
      const remaining = Math.max(0, (entry.total || 0) - (entry.amountPaid || 0));
      setPaymentData({
        amountPaid: newStatus === "paid" ? remaining : 0,
        paymentMode: "GPay",
        paymentDate: new Date().toISOString().split("T")[0],
        transactionId: ""
      });
      setPaymentModalStatus(newStatus);
      setPaymentModalEntry(entry);
      return;
    }
    await updateStatusBackend(entry, newStatus);
  };

  const updateStatusBackend = async (entry, newStatus, paymentDetails = {}) => {
    const id = entry._id || entry.id;
    setStatusUpdating(id);
    try {
      const res = await axios.patch(`${BASE_URL}/api/invoices/${id}/status`, { status: newStatus, ...paymentDetails });
      if (res.data.success && res.data.invoice) {
        const updated = res.data.invoice;
        // The backend returns the full doc, but we need to normalize it for the list if needed
        // Actually, the list expects the structure returned by GET /api/invoices
        // For simplicity, let's just update the specific fields we know changed
        setInvoiceList(prev => prev.map(e =>
          (e.id || e.invoiceNo) === (id || entry.invoiceNo)
            ? { ...e, status: updated.status, amountPaid: updated.amountPaid, inv: { ...(e.inv || {}), amountPaid: updated.amountPaid, status: updated.status } }
            : e
        ));
      }
    } catch (err) {
      console.error("Update status failed", err);
    }

    setStatusUpdating(null);
    if (newStatus === "paid" || newStatus === "part_paid") {
      const isPartial = (paymentDetails.amountPaid || 0) < (entry.total || 0);
      showToast(isPartial ? "Success Recorded as Part Payment in Accounts" : "Success Recorded as Full Payment in Accounts");
    } else {
      showToast(`Success Status updated to ${newStatus}`);
    }
  };

  // ── QR ------------------------------------------------------
  const slimPayload = {
    no: inv.invoiceNo, date: inv.date, due: inv.dueDate,
    co: inv.companyName, email: inv.companyEmail, phone: inv.companyPhone, addr: inv.companyAddress,
    cl: inv.client, proj: inv.project, gst: inv.gstRate, notes: inv.notes, terms: inv.terms,
    incGst: inv.isGstIncluded,
    paid: inv.amountPaid,
    upi: inv.upiId,
    cur: inv.currency,
    items: items.map((i) => ({ d: i.description, q: i.quantity, r: i.rate })),
    history: inv.paymentHistory || [],
    cid: user?.companyId || user?.company || user?._id || "",
    sig: inv.signatureType === "text" ? inv.signature : "",
    sigType: inv.signatureType || "text",
    temp: inv.template || "Classic",
  };
  let qrData = `${FRONTEND_URL}/invoice-view?d=${btoa(unescape(encodeURIComponent(JSON.stringify(slimPayload))))}`;
  if (qrData.length > 1000) qrData = `${FRONTEND_URL}/invoice-view?no=${inv.invoiceNo}`;

  const triggerPDFShare = async (entry, type, force = false) => {
    if (step !== "preview" && !force) {
      loadEntry(entry);
      setTimeout(() => {
        setStep("preview");
        showToast("Pending Loading invoice for PDF generation...");
        setTimeout(() => triggerPDFShare(entry, type, true), 1000);
      }, 0);
      return;
    }
    showToast("Pending Generating PDF...");

    // Wait for the DOM to fully paint the latest invoice data before capturing
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise(resolve => setTimeout(resolve, 300));

    // Helper: resolve CSS variables so html2canvas captures correct colours on all OS/browsers
    const resolveCssVars = (el) => {
      const rootComputed = getComputedStyle(document.documentElement);
      const elComputed = getComputedStyle(el);
      const resolveVar = (varExpr) => {
        // varExpr like "--app-accent, var(--app-accent, #00BCD4))" possibly nested; resolve innermost first
        let expr = varExpr;
        // Resolve nested var(...) from the inside out
        let prev;
        do {
          prev = expr;
          expr = expr.replace(/var\(\s*(--[a-zA-Z0-9-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/g, (_, name, fallback) => {
            const fromEl = elComputed.getPropertyValue(name).trim();
            const fromRoot = rootComputed.getPropertyValue(name).trim();
            return fromEl || fromRoot || (fallback ? fallback.trim() : '');
          });
        } while (expr !== prev && expr.includes('var('));
        return expr;
      };
      const walk = (node) => {
        if (node.nodeType === 1) {
          const st = node.getAttribute('style') || '';
          if (st.includes('var(')) {
            node.setAttribute('style', resolveVar(st));
          }
          Array.from(node.children).forEach(walk);
        }
      };
      walk(el);
    };

    try {
      // Capture ALL invoice pages (multi-page support)
      const elements = document.querySelectorAll(".invoice-paper");
      if (!elements || elements.length === 0) return;

      const A4_W = 210;
      const A4_H = 297;
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const elemH = element.scrollHeight;
        const elemW = element.scrollWidth;

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          width: elemW,
          height: elemH,
          windowWidth: elemW,
          windowHeight: elemH,
          scrollX: 0,
          scrollY: -window.scrollY,
          onclone: (doc) => {
            const el = doc.querySelectorAll('.invoice-paper')[i];
            if (el) {
              resolveCssVars(el);
              el.style.width = elemW + 'px';
              el.style.maxWidth = 'none';
              el.style.overflow = 'visible';
              el.style.borderRadius = '0';
              el.style.boxShadow = 'none';
            }
          }
        });

        const imgAspect = canvas.width / canvas.height;
        const finalW = A4_W;
        const finalH = A4_W / imgAspect;
        const imgData = canvas.toDataURL('image/jpeg', 0.98);

        if (i > 0) pdf.addPage();

        let heightLeft = finalH;
        let position = 0;
        pdf.addImage(imgData, 'JPEG', 0, position, finalW, finalH);
        heightLeft -= A4_H;

        while (heightLeft > 0) {
          position = heightLeft - finalH;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, finalW, finalH);
          heightLeft -= A4_H;
        }
      }

      const blob = pdf.output('blob');
      const file = new File([blob], `Invoice_${entry.invoiceNo}.pdf`, { type: 'application/pdf' });
      const invData = entry.inv || inv;
      const text = `*${invData.companyName || "Your Business"}*\n\nInvoice: ${entry.invoiceNo}\nTotal: ${formatCurrency(entry.total, invData.currency)}`;

      if (type === "print") {
        pdf.autoPrint();
        const blobURL = pdf.output('bloburl');
        window.open(blobURL, '_blank');
        return;
      }

      if (type === "wa") {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: `Invoice ${entry.invoiceNo}`, text, files: [file] });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = file.name; a.click(); URL.revokeObjectURL(url);
          showToast("PDF downloaded! Attach it in WhatsApp.");
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
        }
      } else {
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ title: `Invoice ${entry.invoiceNo}`, text, files: [file] });
            return;
          } catch (shareErr) {
            if (shareErr.name === "AbortError") return;
          }
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = file.name; a.click(); URL.revokeObjectURL(url);
        showToast("Sharing not supported on this device — PDF downloaded instead. You can attach it manually.");
      }
    } catch (err) {
      console.log(err);
      showToast("Error Failed to generate PDF");
    }
  };

  const shareInvoice = (entry) => triggerPDFShare(entry, "link");
  const shareWhatsApp = (entry) => triggerPDFShare(entry, "wa");

  const sendInvoiceToClient = async (entry, client) => {
    if (!entry || !client) return;
    const clientId = client._id || client.id || client.clientId;
    try {
      showToast("Pending Sending invoice to client...");
      await axios.post(`${BASE_URL}/api/invoices/${entry.id}/send-to-client`, {
        clientId,
        clientName: client.clientName || client.name || "",
      });
      setShareModalEntry(null);
      showToast(`Invoice sent to ${client.clientName || client.name}'s dashboard`);
    } catch (err) {
      showToast("Error Failed to send invoice to client");
    }
  };

  // ── Shared styles --------------------------------------------
  const inp = (err) => ({
    width: "100%", border: `1.5px solid ${err ? "#ef4444" : "var(--app-border)"}`, borderRadius: 10,
    padding: "10px 12px", fontSize: 14, color: "#0f1c2e", background: err ? "#fff5f5" : "var(--app-surface)",
    boxSizing: "border-box", outline: "none", fontFamily: "inherit", transition: "all 0.2s",
  });
  const lbl = { display: "block", fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" };

  const statusColor = {
    paid: "#16a34a", unpaid: "#ea580c", overdue: "#dc2626", draft: "#6b7280", sent: "#2563eb", part_paid: "var(--app-accent)",
  };

  // ------------------------------------------------------------
  // RECEIPT VIEW
  // ------------------------------------------------------------
  if (step === "receipt" && receiptEntry) {
    const r = receiptEntry;
    const pd = r.paymentData || {};
    const invData = r.inv || inv;
    const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;

    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "var(--app-bg)", minHeight: "100vh", padding: "40px 20px" }}>

        <div className="no-print" style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 30 }}>
          <button onClick={() => jumpInvoice ? onBack() : (setEditingReceipt(false), setStep("list"))} style={{ padding: "12px 24px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}>{jumpInvoice ? " Back to Dashboard" : " Back to List"}</button>
          {!editingReceipt && <button onClick={() => setEditingReceipt(true)} style={{ padding: "12px 24px", background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#ea580c", fontFamily: "inherit" }}>Edit</button>}
          {!editingReceipt && <button onClick={() => window.print()} style={{ padding: "12px 28px", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#fff", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(var(--app-accent-rgb, 124, 58, 237),0.3)" }}>Print Receipt</button>}
        </div>

        <div className="receipt-paper" style={{ maxWidth: 500, margin: "0 auto", background: "var(--app-card)", borderRadius: 24, boxShadow: "var(--app-shadow)", overflow: "hidden", border: "1px solid var(--app-border)" }}>
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", padding: "40px 32px", textAlign: "center", color: "#fff" }}>
            <div style={{ width: 64, height: 64, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 32 }}>Payment</div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: 1 }}>{r.status === "part_paid" ? "PART PAYMENT RECEIPT" : "PAYMENT RECEIPT"}</h2>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4, fontWeight: 600 }}>{receiptNo}</div>
          </div>

          <div style={{ padding: "32px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              {effectiveLogo ? (
                <img src={effectiveLogo} alt="logo" style={{ maxHeight: 60, maxWidth: "100%", objectFit: "contain", borderRadius: 8 }} />
              ) : (
                <div style={{ fontSize: 18, fontWeight: 900, color: "var(--app-accent)" }}>{effectiveCompanyName}</div>
              )}
            </div>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#0f1c2e" }}>{formatCurrency(pd.amountPaid, invData.currency)}</div>
              <div style={{ fontSize: 12, color: "var(--app-accent)", fontWeight: 700, marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>Amount Received</div>
            </div>

            <div style={{ display: "grid", gap: 20 }}>
              {editingReceipt ? (
                <>
                  <div style={{ marginBottom: 10 }}>
                    <label style={lbl}>Amount Paid</label>
                    <input type="number" value={pd.amountPaid === 0 ? "" : pd.amountPaid} onChange={e => setReceiptEntry(prev => ({ ...prev, paymentData: { ...prev.paymentData, amountPaid: e.target.value === "" ? 0 : Number(e.target.value) } }))} style={inp()} />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={lbl}>Payment Date</label>
                    <input type="date" value={pd.paymentDate ? pd.paymentDate.split('T')[0] : ""} onChange={e => setReceiptEntry(prev => ({ ...prev, paymentData: { ...prev.paymentData, paymentDate: e.target.value } }))} style={inp()} />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={lbl}>Payment Mode</label>
                    <select value={pd.paymentMode} onChange={e => setReceiptEntry(prev => ({ ...prev, paymentData: { ...prev.paymentData, paymentMode: e.target.value } }))} style={inp()}>
                      {["GPay", "PhonePe", "NEFT", "RTGS", "UPI", "Net Banking", "Cash", "Other"].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={lbl}>Transaction ID</label>
                    <input type="text" value={pd.transactionId} onChange={e => setReceiptEntry(prev => ({ ...prev, paymentData: { ...prev.paymentData, transactionId: e.target.value } }))} style={inp()} />
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                    <button onClick={() => setEditingReceipt(false)} style={{ flex: 1, padding: "10px", background: "#f3f4f6", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                    <button onClick={async () => {
                      await updateStatusBackend(r, r.status, receiptEntry.paymentData);
                      setEditingReceipt(false);
                      showToast("Success Receipt updated!");
                    }} style={{ flex: 1, padding: "10px", background: "#0f1c2e", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Save Changes</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px dashed var(--app-border)" }}>
                    <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Received From</span>
                    <span style={{ fontSize: 13, color: "#0f1c2e", fontWeight: 700 }}>{r.client}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px dashed var(--app-border)" }}>
                    <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Payment Date</span>
                    <span style={{ fontSize: 13, color: "#0f1c2e", fontWeight: 700 }}>{formatDate(pd.paymentDate)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px dashed var(--app-border)" }}>
                    <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Payment Mode</span>
                    <span style={{ fontSize: 13, color: "#0f1c2e", fontWeight: 700 }}>{pd.paymentMode}</span>
                  </div>
                  {pd.transactionId && (
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px dashed var(--app-border)" }}>
                      <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Transaction ID</span>
                      <span style={{ fontSize: 13, color: "#0f1c2e", fontWeight: 700, fontFamily: "monospace" }}>{pd.transactionId}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px dashed var(--app-border)" }}>
                    <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Invoice Number</span>
                    <span style={{ fontSize: 13, color: "#0f1c2e", fontWeight: 700 }}>{r.invoiceNo}</span>
                  </div>
                  {r.status === "part_paid" && (
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px dashed var(--app-border)" }}>
                      <span style={{ fontSize: 13, color: "#ea580c", fontWeight: 700 }}>Remaining Balance</span>
                      <span style={{ fontSize: 13, color: "#ea580c", fontWeight: 800 }}>{formatCurrency((r.total || 0) - (pd.amountPaid || 0), invData.currency)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ marginTop: 40, textAlign: "center", background: "var(--app-bg)", borderRadius: 16, padding: "20px" }}>
              <div style={{ fontSize: 14, color: "var(--app-accent)", fontWeight: 800 }}>THANK YOU!</div>
              <div style={{ fontSize: 12, color: "var(--app-accent)", marginTop: 4 }}>We appreciate your business.</div>
            </div>

            <div style={{ marginTop: 32, textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0f1c2e" }}>{invData.companyName || "M Business"}</div>
              {invData.companyEmail && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{invData.companyEmail}</div>}
              {invData.companyPhone && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{invData.companyPhone}</div>}
            </div>
          </div>

          <div style={{ background: "var(--app-bg)", padding: "16px", textAlign: "center", borderTop: "1px solid var(--app-border)" }}>
            <div style={{ fontSize: 10, color: "#d1d5db", fontWeight: 700, letterSpacing: 1 }}>COMPUTER GENERATED RECEIPT</div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // LIST VIEW
  // ------------------------------------------------------------
  if (step === "list") {
    const enriched = invoiceList.map((e) => {
      const dueDate = e.inv?.dueDate || e.dueDate;
      const dDate = dueDate ? new Date(dueDate + "T00:00:00") : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isOverdue = dDate && dDate < today;
      const status = e.status || (isOverdue ? "overdue" : "unpaid");
      return { ...e, status };
    });

    const totalAmt = enriched.reduce((s, e) => s + (parseFloat(e.total) || 0), 0);
    const paidAmt = enriched.reduce((s, e) => s + (parseFloat(e.amountPaid) || 0), 0);
    const unpaidCnt = enriched.filter(e => ["unpaid", "overdue"].includes(e.status)).length;
    const draftCnt = enriched.filter(e => e.status === "draft").length;

    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", maxWidth: "100%", padding: "20px" }}>

        <Toast msg={toast} />
        {deleteTarget && <ConfirmModal invoiceNo={deleteTarget.invoiceNo} onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />}

        {shareModalEntry && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShareModalEntry(null)}>
            <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 360, maxHeight: "70vh", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: "16px 18px", borderBottom: "1.5px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#0f1c2e" }}>Share with client</div>
                <button onClick={() => setShareModalEntry(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6b7280" }}>✕</button>
              </div>
              <div style={{ overflowY: "auto", padding: 8 }}>
                {clients && clients.length > 0 ? clients.map((c, idx) => {
                  const name = c.clientName || c.name || "Unnamed Client";
                  const company = c.companyName || c.company || "";
                  return (
                    <button
                      key={c._id || c.id || idx}
                      onClick={() => {
                        const entry = shareModalEntry;
                        setShareModalEntry(null);
                        shareInvoice(entry);
                      }}
                      style={{ width: "100%", textAlign: "left", padding: "10px 12px", border: "none", background: "#fff", borderRadius: 8, cursor: "pointer", display: "flex", flexDirection: "column", gap: 2 }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                    >
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#0f1c2e" }}>{name}</span>
                      {company && <span style={{ fontSize: 11, color: "#6b7280" }}>{company}</span>}
                    </button>
                  );
                }) : (
                  <div style={{ padding: 16, textAlign: "center", fontSize: 13, color: "#6b7280" }}>No clients found</div>
                )}
              </div>
            </div>
          </div>
        )}

        {shareModalEntry && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => { setShareModalEntry(null); setShareSelectedClientId(""); }}>
            <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: "16px 18px", borderBottom: "1.5px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#0f1c2e" }}>Share with client</div>
                <button onClick={() => { setShareModalEntry(null); setShareSelectedClientId(""); }} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6b7280" }}>✕</button>
              </div>
              <div style={{ padding: 18 }}>
                <label style={{ display: "block", fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Select Client</label>
                <select
                  value={shareSelectedClientId}
                  onChange={(e) => setShareSelectedClientId(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid var(--app-border)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "#0f1c2e", background: "var(--app-surface)", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }}
                >
                  <option value="">-- Select a client --</option>
                  {clients && clients.length > 0 ? clients.map((c, idx) => {
                    const id = c._id || c.id || String(idx);
                    const name = c.clientName || c.name || "Unnamed Client";
                    const company = c.companyName || c.company || "";
                    return (
                      <option key={id} value={id}>{name}{company ? ` (${company})` : ""}</option>
                    );
                  }) : null}
                </select>
                {(!clients || clients.length === 0) && (
                  <div style={{ marginTop: 10, fontSize: 13, color: "#6b7280", textAlign: "center" }}>No clients found</div>
                )}
                <button
                  disabled={!shareSelectedClientId}
                  onClick={() => {
                    const chosen = clients.find((c, idx) => (c._id || c.id || String(idx)) === shareSelectedClientId);
                    if (chosen) {
                      sendInvoiceToClient(shareModalEntry, chosen);
                      setShareSelectedClientId("");
                    }
                  }}
                  style={{ width: "100%", marginTop: 16, padding: "12px", background: shareSelectedClientId ? "linear-gradient(135deg,var(--app-accent),var(--app-accent))" : "#e5e7eb", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, color: shareSelectedClientId ? "#fff" : "#9ca3af", cursor: shareSelectedClientId ? "pointer" : "not-allowed", fontFamily: "inherit" }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {paymentModalEntry && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "var(--app-card)", borderRadius: 24, width: "100%", maxWidth: 400, padding: "32px", boxShadow: "var(--app-shadow)", border: "1px solid var(--app-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f1c2e" }}>Payment Information</h3>
                <button onClick={() => setPaymentModalEntry(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--app-accent)", padding: "4px 8px" }}>✕</button>
              </div>

              <div style={{ background: "var(--app-bg)", borderRadius: 12, padding: "14px", marginBottom: 20, border: "1.5px solid var(--app-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Total Amount:</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#0f1c2e" }}>{formatCurrency(paymentModalEntry.total, paymentModalEntry.currency || inv.currency)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Previously Paid:</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#16a34a" }}>{formatCurrency(paymentModalEntry.amountPaid || 0, paymentModalEntry.currency || inv.currency)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px dashed var(--app-border)" }}>
                  <span style={{ fontSize: 12, color: "#ea580c", fontWeight: 700 }}>Balance Due:</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: "#ea580c" }}>{formatCurrency(Math.max(0, (paymentModalEntry.total || 0) - (paymentModalEntry.amountPaid || 0)), paymentModalEntry.currency || inv.currency)}</span>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>
                  {paymentModalStatus === "paid" ? "Final Payment Amount" : "New Payment Amount (Advance)"}
                  <span style={{ color: "#ef4444" }}> *</span>
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontSize: 14, fontWeight: 600 }}>{paymentModalEntry.currency || inv.currency}</span>
                  <input type="number"
                    value={paymentData.amountPaid === 0 ? "" : paymentData.amountPaid}
                    onChange={e => setPaymentData(p => ({ ...p, amountPaid: e.target.value === "" ? 0 : Number(e.target.value) }))}
                    placeholder="Enter amount"
                    style={{ ...inp(), paddingLeft: 30, fontWeight: 700, fontSize: 16 }} />
                </div>
                <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>This amount will be added to the total paid.</p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Payment Mode</label>
                <select value={paymentData.paymentMode} onChange={e => setPaymentData(p => ({ ...p, paymentMode: e.target.value }))} style={inp()}>
                  <option value="GPay">GPay</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="NEFT">NEFT</option>
                  <option value="RTGS">RTGS</option>
                  <option value="UPI">UPI</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cash">Cash</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Payment Date</label>
                <input type="date" value={paymentData.paymentDate} onChange={e => setPaymentData(p => ({ ...p, paymentDate: e.target.value }))} style={inp()} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Transaction ID </label>
                <input type="text" value={paymentData.transactionId} onChange={e => setPaymentData(p => ({ ...p, transactionId: e.target.value }))} style={inp()} placeholder="e.g. UTR123456789" />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, padding: "0 4px" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f1c2e" }}>Send a receipt</span>
                <label style={{ position: "relative", display: "inline-block", width: 42, height: 22 }}>
                  <input type="checkbox" checked={sendReceipt} onChange={e => setSendReceipt(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: sendReceipt ? "#16a34a" : "#ccc", transition: ".4s", borderRadius: 34 }}>
                    <span style={{ position: "absolute", height: 16, width: 16, left: sendReceipt ? 20 : 4, bottom: 3, backgroundColor: "white", transition: ".4s", borderRadius: "50%" }}></span>
                  </span>
                </label>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setPaymentModalEntry(null)} style={{ flex: 1, padding: "12px", background: "var(--app-bg)", border: "1px solid var(--app-border)", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "var(--app-accent)", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                <button onClick={() => {
                  updateStatusBackend(paymentModalEntry, paymentModalStatus, paymentData);
                  if (sendReceipt) {
                    setReceiptEntry({ ...paymentModalEntry, paymentData: { ...paymentData }, status: paymentModalStatus });
                    setStep("receipt");
                  }
                  setPaymentModalEntry(null);
                }} style={{ flex: 1, padding: "12px", background: paymentModalStatus === "paid" ? "linear-gradient(135deg,#16a34a,#15803d)" : "linear-gradient(135deg,var(--app-accent),var(--app-accent))", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                  {paymentModalStatus === "paid" ? "Confirm Full Payment" : "Confirm Part Payment"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAGE HEADER */}
        <div className="page-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {onBack && (
              <button onClick={onBack} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--teal-light, var(--teal-light, #E0F7FA))", border: "none", borderRadius: 10, cursor: "pointer", color: " var(--app-accent, var(--app-accent, #00BCD4))", flexShrink: 0 }}>
                <i className="ti ti-arrow-left" style={{ fontSize: 18 }} />
              </button>
            )}
            <div>
              <div className="page-title">Invoices</div>
              <div className="page-sub">Track, manage and send invoices to your clients</div>
            </div>
          </div>

        </div>

        {/* STATS */}
        <div className="stats-row">
          <div className="stat-card" onClick={() => { clearForm(); setStep("form"); setInternalNav(true); }}>
            <div className="stat-card-inner">
              <div className="stat-icon" style={{ background: "var(--teal-light)", color: "var(--teal)" }}><i className="ti ti-receipt-2"></i></div>
              <div>
                <div className="stat-num">{enriched.length}</div>
                <div className="stat-label">Total Invoices</div>
                <div className="stat-amount" style={{ color: "var(--teal)" }}>{formatCurrency(totalAmt, inv.currency)} total</div>
              </div>
            </div>
            <div className="stat-bar-wrap"><div className="stat-bar-fill" style={{ width: "100%", background: "var(--teal)" }}></div></div>
          </div>
          <div className="stat-card">
            <div className="stat-card-inner">
              <div className="stat-icon" style={{ background: "var(--green-bg)", color: "var(--green)" }}><i className="ti ti-circle-check"></i></div>
              <div>
                <div className="stat-num">{enriched.filter(e => e.status === "paid" || e.status === "part_paid").length}</div>
                <div className="stat-label">Paid</div>
                <div className="stat-amount" style={{ color: "var(--green)" }}>{formatCurrency(paidAmt, inv.currency)} received</div>
              </div>
            </div>
            <div className="stat-bar-wrap"><div className="stat-bar-fill" style={{ width: (totalAmt > 0 ? (paidAmt / totalAmt) * 100 : 0) + "%", background: "var(--green)" }}></div></div>
          </div>
          <div className="stat-card">
            <div className="stat-card-inner">
              <div className="stat-icon" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}><i className="ti ti-clock"></i></div>
              <div>
                <div className="stat-num">{unpaidCnt}</div>
                <div className="stat-label">Pending</div>
                <div className="stat-amount" style={{ color: "var(--amber)" }}>{formatCurrency(Math.max(0, totalAmt - paidAmt), inv.currency)} due</div>
              </div>
            </div>
            <div className="stat-bar-wrap"><div className="stat-bar-fill" style={{ width: (totalAmt > 0 ? (Math.max(0, totalAmt - paidAmt) / totalAmt) * 100 : 0) + "%", background: "var(--amber)" }}></div></div>
          </div>
          <div className="stat-card">
            <div className="stat-card-inner">
              <div className="stat-icon" style={{ background: "var(--red-bg)", color: "var(--red)" }}><i className="ti ti-alert-circle"></i></div>
              <div>
                <div className="stat-num">{enriched.filter(e => e.status === "overdue").length}</div>
                <div className="stat-label">Overdue</div>
                <div className="stat-amount" style={{ color: "var(--red)" }}>Action needed</div>
              </div>
            </div>
            <div className="stat-bar-wrap"><div className="stat-bar-fill" style={{ width: "11%", background: "var(--red)" }}></div></div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div className="tabs" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {onBack && (
              <button onClick={onBack} style={{ padding: "8px", background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#0f1c2e", display: "flex", alignItems: "center" }} title="Back to Dashboard">
                <i className="ti ti-arrow-left"></i>
              </button>
            )}
            {["all", "paid", "pending", "overdue", "draft"].map(t => (
              <button key={t} className={`tab ${filterTab === t ? "active" : ""}`} onClick={() => setFilterTab(t)} style={{ textTransform: "capitalize" }}>{t}</button>
            ))}
          </div>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (typeof e.nativeEvent?.stopImmediatePropagation === 'function') e.nativeEvent.stopImmediatePropagation(); clearForm(); setStep("form"); setInternalNav(true); }} type="button" style={{ padding: "8px 16px", background: "var(--teal)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-plus"></i> New Invoice
          </button>
        </div>

        {/* INVOICE TABLE */}
        <div className="table-panel">
          <div className="table-toolbar">
            <div className="toolbar-left">
              <div className="toolbar-search">
                <i className="ti ti-search" style={{ fontSize: 14, color: "var(--text3)" }}></i>
                <input type="text" placeholder="Search by invoice ID, client…" value={listSearch} onChange={(e) => setListSearch(e.target.value)} />
              </div>
              <button className="sort-btn" onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}><i className={sortOrder === "desc" ? "ti ti-sort-descending" : "ti ti-sort-ascending"} style={{ fontSize: 13 }}></i> Sort by Date</button>
              <div style={{ position: "relative" }}>
                <select className="sort-btn" value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{ appearance: "none", cursor: "pointer", paddingRight: 24, paddingLeft: 10 }}>
                  <option value="all">All Clients</option>
                  {[...new Set(enriched.map(e => e.client).filter(Boolean))].map(c => (
                    <option key={c} value={c}>{c.substring(0, 15)}{c.length > 15 ? '...' : ''}</option>
                  ))}
                </select>
                <i className="ti ti-chevron-down" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 14, color: "var(--text3)" }}></i>
              </div>
            </div>
            <button className="export-btn" onClick={() => {
              const filteredData = enriched.filter(e => {
                if (filterTab === "paid" && e.status !== "paid" && e.status !== "part_paid") return false;
                if (filterTab === "pending" && e.status !== "unpaid" && e.status !== "part_paid") return false;
                if (filterTab === "overdue" && e.status !== "overdue") return false;
                if (filterTab === "draft" && e.status !== "draft") return false;
                if (clientFilter !== "all" && e.client !== clientFilter) return false;
                const term = listSearch.toLowerCase();
                return (e.invoiceNo || "").toLowerCase().includes(term) || (e.client || "").toLowerCase().includes(term) || (e.inv?.project || e.project || "").toLowerCase().includes(term);
              }).sort((a, b) => {
                const dateA = new Date(a.inv?.date || a.date || 0).getTime();
                const dateB = new Date(b.inv?.date || b.date || 0).getTime();
                return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
              });
              handleExportCSV(filteredData);
            }}><i className="ti ti-download" style={{ fontSize: 13 }}></i> Export CSV</button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th><input type="checkbox" className="cb" /></th>
                  <th>Invoice ID</th>
                  <th>Client</th>
                  <th>Project</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listLoading ? (
                  <tr><td colSpan={10} style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}></td></tr>
                ) : enriched.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}></td></tr>
                ) : enriched.filter(e => {
                  if (filterTab === "paid" && e.status !== "paid" && e.status !== "part_paid") return false;
                  if (filterTab === "pending" && e.status !== "unpaid" && e.status !== "part_paid") return false;
                  if (filterTab === "overdue" && e.status !== "overdue") return false;
                  if (filterTab === "draft" && e.status !== "draft") return false;

                  if (clientFilter !== "all" && e.client !== clientFilter) return false;

                  const term = listSearch.toLowerCase();
                  return (e.invoiceNo || "").toLowerCase().includes(term) ||
                    (e.client || "").toLowerCase().includes(term) ||
                    (e.inv?.project || e.project || "").toLowerCase().includes(term);
                }).sort((a, b) => {
                  const dateA = new Date(a.inv?.date || a.date || 0).getTime();
                  const dateB = new Date(b.inv?.date || b.date || 0).getTime();
                  return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
                }).map((entry, idx) => {
                  const invD = entry.inv || {};
                  const isPaid = entry.status === "paid";
                  const isPartPaid = entry.status === "part_paid";
                  const isOverdue = entry.status === "overdue";
                  const isSent = entry.status === "sent";
                  const isDraft = entry.status === "draft";
                  const isPending = !isPaid && !isPartPaid && !isDraft;

                  return (
                    <tr key={entry.id || idx} onClick={() => { loadEntry(entry, "preview"); window.scrollTo(0, 0); }}>
                      <td onClick={e => e.stopPropagation()}><input type="checkbox" className="cb" /></td>
                      <td className="inv-id" style={{ color: "var(--teal)", fontWeight: 800 }}>{entry.invoiceNo || "—"}</td>
                      <td>
                        <div className="client-chip">
                          <div className="client-av" style={{ background: `linear-gradient(135deg,var(--teal),#006E7F)` }}>
                            {(entry.client || "?")[0].toUpperCase()}
                          </div>
                          <span className="client-name">{entry.client || "—"}</span>
                        </div>
                      </td>
                      <td style={{ color: "var(--text2)" }}>{invD.project || entry.project || "—"}</td>
                      <td>
                        {isPaid ? <span className="badge advance">Advance</span> :
                          isDraft ? <span className="badge draft">Draft</span> :
                            <span className="badge" style={{ background: "var(--purple-bg)", color: "var(--purple)" }}>Milestone</span>}
                      </td>
                      <td className={isPaid || isPartPaid ? "amount-pos" : ""}>{formatCurrency(entry.total, entry.inv?.currency || inv.currency)}</td>
                      <td style={{ color: "var(--text2)" }}>{formatDate(invD.date || entry.date)}</td>
                      <td style={{ color: isOverdue ? "var(--red)" : isPending ? "var(--amber)" : "var(--text2)", fontWeight: isOverdue || isPending ? 700 : 400 }}>
                        {formatDate(invD.dueDate || entry.dueDate)}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <select
                          value={entry.status || "draft"}
                          disabled={statusUpdating === entry.id}
                          onChange={e => handleStatusChange(entry, e.target.value)}
                          style={{
                            background: "transparent", border: "none", fontSize: 10, fontWeight: 700,
                            cursor: "pointer", outline: "none", fontFamily: "inherit",
                            color: isPaid ? "var(--green)" : isOverdue ? "var(--red)" : isPending ? "var(--amber)" : "var(--text3)"
                          }}>
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="part_paid">Part Paid</option>
                          <option value="paid">Paid</option>
                          <option value="unpaid">Unpaid</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="row-actions">
                          <button className="row-btn" title="View" onClick={(e) => { e.stopPropagation(); loadEntry(entry, "preview"); window.scrollTo(0, 0); }}><i className="ti ti-eye"></i></button>
                          <button className="row-btn" title="Edit" onClick={(e) => { e.stopPropagation(); loadEntry(entry, "form"); window.scrollTo(0, 0); }}><i className="ti ti-edit"></i></button>
                          {(isPaid || isPartPaid) ? (
                            <button className="row-btn" title="Receipt" onClick={() => {
                              setReceiptEntry({ ...entry, paymentData: { amountPaid: entry.amountPaid || entry.total, paymentMode: entry.paymentMode || "Other", paymentDate: entry.paymentDate || new Date().toISOString(), transactionId: entry.transactionId } });
                              setStep("receipt");
                            }}><i className="ti ti-download"></i></button>
                          ) : (
                            <button className="row-btn" title="Send" onClick={(e) => { e.stopPropagation(); shareInvoice({ id: entry.id, invoiceNo: entry.invoiceNo || entry.inv?.invoiceNo, total: entry.total }); }}><i className="ti ti-send"></i></button>
                          )}
                          <button className="row-btn danger" title="Delete" onClick={() => setDeleteTarget(entry)}><i className="ti ti-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="pagination">
            <div className="page-info">Showing {enriched.length} of {enriched.length} invoices</div>
            <div className="page-btns">
              <button className="page-btn"><i className="ti ti-chevron-left" style={{ fontSize: 14 }}></i></button>
              <button className="page-btn active">1</button>
              <button className="page-btn"><i className="ti ti-chevron-right" style={{ fontSize: 14 }}></i></button>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="bottom-row">

          {/* SUMMARY PANEL */}
          <div className="summary-panel">
            <div className="summary-title">Invoice Summary</div>
            <div className="summary-item">
              <div className="si-left">
                <div className="si-icon" style={{ background: "var(--green-bg)", color: "var(--green)" }}><i className="ti ti-circle-check"></i></div>
                <div>
                  <div className="si-label">Total Collected</div>
                  <div className="si-count">{enriched.filter(e => e.status === "paid" || e.status === "part_paid").length} invoices paid</div>
                </div>
              </div>
              <div className="si-amount" style={{ color: "var(--green)" }}>{formatCurrency(paidAmt, inv.currency)}</div>
            </div>
            <div className="summary-item">
              <div className="si-left">
                <div className="si-icon" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}><i className="ti ti-clock"></i></div>
                <div>
                  <div className="si-label">Awaiting Payment</div>
                  <div className="si-count">{unpaidCnt} invoices pending</div>
                </div>
              </div>
              <div className="si-amount" style={{ color: "var(--amber)" }}>{formatCurrency(Math.max(0, totalAmt - paidAmt), inv.currency)}</div>
            </div>
            <div className="summary-item">
              <div className="si-left">
                <div className="si-icon" style={{ background: "var(--red-bg)", color: "var(--red)" }}><i className="ti ti-alert-circle"></i></div>
                <div>
                  <div className="si-label">Overdue Amount</div>
                  <div className="si-count">{enriched.filter(e => e.status === "overdue").length} invoice overdue</div>
                </div>
              </div>
              <div className="si-amount" style={{ color: "var(--red)" }}>{formatCurrency(enriched.filter(e => e.status === "overdue").reduce((s, e) => s + (parseFloat(e.total) || 0), 0), inv.currency)}</div>
            </div>
            <div className="summary-item">
              <div className="si-left">
                <div className="si-icon" style={{ background: "var(--surface2)", color: "var(--text3)" }}><i className="ti ti-file"></i></div>
                <div>
                  <div className="si-label">Draft Invoices</div>
                  <div className="si-count">{draftCnt} not yet sent</div>
                </div>
              </div>
              <div className="si-amount" style={{ color: "var(--text3)" }}>{formatCurrency(enriched.filter(e => e.status === "draft").reduce((s, e) => s + (parseFloat(e.total) || 0), 0), inv.currency)}</div>
            </div>
            {/* mini bar chart */}
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 10 }}>Revenue Breakdown</div>
              {(() => {
                const months = [];
                const now = new Date();
                for (let i = 4; i >= 0; i--) {
                  const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                  months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString("en-US", { month: "short" }), total: 0 });
                }
                enriched.forEach(e => {
                  const raw = e.date || e.qt?.date || e.createdAt;
                  if (!raw) return;
                  const d = new Date(raw);
                  if (isNaN(d)) return;
                  const key = `${d.getFullYear()}-${d.getMonth()}`;
                  const m = months.find(mo => mo.key === key);
                  if (m) m.total += parseFloat(e.total) || 0;
                });
                const max = Math.max(1, ...months.map(m => m.total));
                const hasData = months.some(m => m.total > 0);
                if (!hasData) {
                  return <div style={{ fontSize: 12, color: "var(--text3)", fontWeight: 600, padding: "16px 0", textAlign: "center" }}>No data available</div>;
                }
                return (
                  <div style={{ display: "flex", gap: 3, height: 60, alignItems: "flex-end" }}>
                    {months.map(m => (
                      <div key={m.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ width: "100%", background: m.total > 0 ? "var(--teal)" : "var(--border)", borderRadius: "4px 4px 0 0", height: Math.max(4, Math.round((m.total / max) * 60)), opacity: .9 }}></div>
                        <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ACTIVITY PANEL */}
          <div className="activity-panel">
            <div className="activity-title">Recent Activity</div>
            <div className="activity-list">
              {enriched.slice(0, 5).map((entry, i) => {
                const isPaid = entry.status === "paid";
                const isPartPaid = entry.status === "part_paid";
                const isOverdue = entry.status === "overdue";
                const isDraft = entry.status === "draft";
                const dotColor = isPaid || isPartPaid ? "var(--green)" : isOverdue ? "var(--red)" : isDraft ? "var(--text3)" : "var(--amber)";
                const statusStr = isPaid ? "Paid" : isPartPaid ? "Part Paid" : isOverdue ? "Overdue" : isDraft ? "Draft" : "Sent";
                return (
                  <div className="activity-item" key={entry.id || i}>
                    <div className="act-dot-wrap">
                      <div className="act-dot" style={{ background: dotColor }}></div>
                      <div className="act-line"></div>
                    </div>
                    <div>
                      <div className="act-text">{entry.invoiceNo || "INV"} marked as <strong>{statusStr}</strong></div>
                      <div className="act-meta">{formatCurrency(entry.total, inv.currency)} · {entry.client} · {formatDate(entry.savedAt || entry.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>


      </div>
    );
  }

  // ------------------------------------------------------------
  // PREVIEW / PRINT
  // ------------------------------------------------------------
  if (step === "preview") {
    return (
      <div className="print-wrapper" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "var(--app-bg)", minHeight: "100vh", padding: "20px 12px" }}>

        {deleteTarget && <ConfirmModal invoiceNo={deleteTarget.invoiceNo} onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />}

        {shareModalEntry && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShareModalEntry(null)}>
            <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 360, maxHeight: "70vh", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: "16px 18px", borderBottom: "1.5px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#0f1c2e" }}>Share with client</div>
                <button onClick={() => setShareModalEntry(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6b7280" }}>✕</button>
              </div>
              <div style={{ overflowY: "auto", padding: 8 }}>
                {clients && clients.length > 0 ? clients.map((c, idx) => {
                  const name = c.clientName || c.name || "Unnamed Client";
                  const company = c.companyName || c.company || "";
                  return (
                    <button
                      key={c._id || c.id || idx}
                      onClick={() => {
                        const entry = shareModalEntry;
                        setShareModalEntry(null);
                        shareInvoice(entry);
                      }}
                      style={{ width: "100%", textAlign: "left", padding: "10px 12px", border: "none", background: "#fff", borderRadius: 8, cursor: "pointer", display: "flex", flexDirection: "column", gap: 2 }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                    >
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#0f1c2e" }}>{name}</span>
                      {company && <span style={{ fontSize: 11, color: "#6b7280" }}>{company}</span>}
                    </button>
                  );
                }) : (
                  <div style={{ padding: 16, textAlign: "center", fontSize: 13, color: "#6b7280" }}>No clients found</div>
                )}
              </div>
            </div>
          </div>
        )}

        {shareModalEntry && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => { setShareModalEntry(null); setShareSelectedClientId(""); }}>
            <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: "16px 18px", borderBottom: "1.5px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#0f1c2e" }}>Share with client</div>
                <button onClick={() => { setShareModalEntry(null); setShareSelectedClientId(""); }} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6b7280" }}>✕</button>
              </div>
              <div style={{ padding: 18 }}>
                <label style={{ display: "block", fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Select Client</label>
                <select
                  value={shareSelectedClientId}
                  onChange={(e) => setShareSelectedClientId(e.target.value)}
                  style={{ width: "100%", border: "1.5px solid var(--app-border)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "#0f1c2e", background: "var(--app-surface)", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }}
                >
                  <option value="">-- Select a client --</option>
                  {clients && clients.length > 0 ? clients.map((c, idx) => {
                    const id = c._id || c.id || String(idx);
                    const name = c.clientName || c.name || "Unnamed Client";
                    const company = c.companyName || c.company || "";
                    return (
                      <option key={id} value={id}>{name}{company ? ` (${company})` : ""}</option>
                    );
                  }) : null}
                </select>
                {(!clients || clients.length === 0) && (
                  <div style={{ marginTop: 10, fontSize: 13, color: "#6b7280", textAlign: "center" }}>No clients found</div>
                )}
                <button
                  disabled={!shareSelectedClientId}
                  onClick={() => {
                    const chosen = clients.find((c, idx) => (c._id || c.id || String(idx)) === shareSelectedClientId);
                    if (chosen) {
                      sendInvoiceToClient(shareModalEntry, chosen);
                      setShareSelectedClientId("");
                    }
                  }}
                  style={{ width: "100%", marginTop: 16, padding: "12px", background: shareSelectedClientId ? "linear-gradient(135deg,var(--app-accent),var(--app-accent))" : "#e5e7eb", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, color: shareSelectedClientId ? "#fff" : "#9ca3af", cursor: shareSelectedClientId ? "pointer" : "not-allowed", fontFamily: "inherit" }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="no-print" style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
          <button onClick={() => { if (onBack && (jumpInvoice || newInvoicePrefill)) { onBack(); return; } setStep("list"); }} style={{ padding: "10px 18px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}>Document Back</button>

          <button onClick={() => setShareModalEntry({ id: editingId, invoiceNo: inv.invoiceNo, total: total })} style={{ padding: "10px 22px", background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#2563eb", fontFamily: "inherit" }}>Share</button>

          <button onClick={() => triggerPDFShare({ id: editingId, invoiceNo: inv.invoiceNo, total: total }, "print")} style={{ padding: "10px 22px", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>Print / PDF</button>
        </div>

        {/* Pagination Logic */}
        {(() => {
          const ITEMS_PER_PAGE_FIRST = 10;
          const ITEMS_PER_PAGE_REST = 16;
          const pages = [];
          if (items.length <= ITEMS_PER_PAGE_FIRST) {
            pages.push(items);
          } else {
            pages.push(items.slice(0, ITEMS_PER_PAGE_FIRST));
            let remaining = items.slice(ITEMS_PER_PAGE_FIRST);
            while (remaining.length > 0) {
              pages.push(remaining.slice(0, ITEMS_PER_PAGE_REST));
              remaining = remaining.slice(ITEMS_PER_PAGE_REST);
            }
          }

          return (
            <div className="print-wrapper" style={{ display: "flex", flexDirection: "column", gap: "40px", alignItems: "center", width: "100%" }}>
              {pages.map((pageItems, pageIndex) => {
                const isFirstPage = pageIndex === 0;
                const isLastPage = pageIndex === pages.length - 1;
                const globalItemOffset = isFirstPage ? 0 : ITEMS_PER_PAGE_FIRST + ((pageIndex - 1) * ITEMS_PER_PAGE_REST);

                return (
                  <div key={pageIndex} className="invoice-paper print-container" style={{ position: "relative", maxWidth: 794, margin: "0 auto", background: "#fff", borderRadius: 18, boxShadow: "0 24px 80px rgba(var(--app-accent-rgb, 124, 58, 237), 0.25)", display: "flex", flexDirection: "column", minHeight: 1122, width: "100%" }}>
                    {/* Header */}
                    {isFirstPage && (<div className="avoid-break" style={{ background: "#f8fafc", padding: "28px 32px", position: "relative", overflow: "visible", flexShrink: 0, borderBottom: "1px solid var(--app-border)" }}>
                      <div style={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", background: `radial-gradient(circle, ${currentT.primaryColor}0d, transparent)`, top: -80, right: -40, pointerEvents: "none" }} />
                      <div className="inv-hgrid" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", gap: 20 }}>
                        <div>
                          {effectiveLogo ? (
                            <img src={effectiveLogo} alt="logo" style={{ height: 85, maxWidth: "100%", borderRadius: 10, marginBottom: 12, objectFit: "contain" }} />
                          ) : (
                            <div style={{ height: 60, width: 60, background: currentT.logoColor || "var(--app-accent)", borderRadius: 10, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: "#fff" }}>
                              {effectiveCompanyName[0] || "?"}
                            </div>
                          )}
                          <div style={{ fontSize: 24, fontWeight: 900, color: "#0f1c2e", textTransform: "uppercase", letterSpacing: 1 }}>{inv.companyName || effectiveCompanyName}</div>
                          {inv.companyEmail && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>{inv.companyEmail}</div>}
                          {inv.companyPhone && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{inv.companyPhone}</div>}
                          {inv.companyAddress && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{inv.companyAddress}</div>}
                        </div>
                        <div className="inv-hright" style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 36, fontWeight: 900, color: `${currentT.primaryColor}1a`, letterSpacing: -2, lineHeight: 1, marginBottom: 4 }}>INVOICE</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: currentT.primaryColor || "var(--app-accent)" }}>{inv.invoiceNo}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: currentT.primaryColor || "var(--app-accent)", marginTop: 3 }}>
                            {inv.invoiceType === "Custom" ? (inv.customInvoiceType || "Custom") : (inv.invoiceType || "Milestone")}
                          </div>   {inv.orderNo && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>Order # {inv.orderNo}</div>}
                          <div style={{ fontSize: 11, fontWeight: 700, color: currentT.primaryColor || "var(--app-accent)", marginTop: 3 }}>
                            {inv.invoiceType === "Custom" ? (inv.customInvoiceType || "Custom") : (inv.invoiceType || "Milestone")}
                          </div>
                          <div style={{ marginTop: 14, display: "flex", gap: 20, justifyContent: "flex-end" }}>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>DATE</div>
                              <div style={{ fontSize: 12, color: "#0f1c2e", fontWeight: 700 }}>{formatDate(inv.date)}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>DUE DATE</div>
                              <div style={{ fontSize: 12, color: "#ea580c", fontWeight: 700 }}>{formatDate(inv.dueDate)}</div>
                            </div>
                          </div>
                          {(balanceDue > 0 && amountPaid > 0) ? (
                            <div style={{ marginTop: 12, textAlign: "right" }}>
                              <span style={{
                                display: "inline-block",
                                padding: "4px 14px",
                                border: "1.5px solid #f59e0b",
                                borderRadius: 20,
                                color: "#b45309",
                                fontSize: 11,
                                fontWeight: 800,
                                background: "#fef3c7",
                                letterSpacing: 1
                              }}>
                                PART PAID
                              </span>
                            </div>
                          ) : balanceDue <= 0 ? (
                            <div style={{ marginTop: 12, textAlign: "right" }}>
                              <span style={{
                                display: "inline-block",
                                padding: "4px 14px",
                                border: "1.5px solid #10b981",
                                borderRadius: 20,
                                color: "#059669",
                                fontSize: 11,
                                fontWeight: 800,
                                background: "#d1fae5",
                                letterSpacing: 1
                              }}>
                                PAID
                              </span>
                            </div>
                          ) : null}
                          {inv.project && (
                            <div style={{ marginTop: 24, textAlign: "right" }}>
                              <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>PROJECT</div>
                              <div style={{ fontSize: 14, fontWeight: 800, color: "#0f1c2e", lineHeight: 1.4 }}>{inv.project}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>)}

                    {/* Bill To */}
                    {isFirstPage && (<div className="inv-btgrid avoid-break" style={{ display: "grid", gridTemplateColumns: "1fr", borderBottom: "2px solid var(--app-border)", flexShrink: 0 }}>
                      <div style={{ padding: "20px 32px" }}>
                        <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>BILL TO</div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: "#0f1c2e" }}>{inv.client || "—"}</div>
                        {selectedClient?.companyName && <div style={{ fontSize: 13, color: currentT.primaryColor || "var(--app-accent)", fontWeight: 600, marginTop: 2 }}>{selectedClient.companyName}</div>}
                        {selectedClient?.email && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 5 }}> {selectedClient.email}</div>}
                        {selectedClient?.phone && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}> {selectedClient.phone}</div>}
                        {selectedClient?.gstNumber && <div style={{ fontSize: 12, color: currentT.primaryColor || "var(--app-accent)", marginTop: 4, fontWeight: 600 }}> GST: {selectedClient.gstNumber}</div>}
                      </div>
                    </div>)}

                    {/* Items */}
                    <div className="inv-table-wrap" style={{ padding: isFirstPage ? "22px 32px" : "80px 32px 22px", overflowX: "auto", flexShrink: 0 }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 360 }}>
                        <thead>
                          <tr className="avoid-break" style={{ background: "#f8fafc" }}>
                            {["#", "Description", "Qty", "Unit Rate", "Tax Rate", "Amount"].map((h, i) => (
                              <th key={i} style={{ padding: "9px 11px", fontSize: 9, fontWeight: 800, color: "#64748b", letterSpacing: 1.5, borderBottom: "2px solid var(--app-border)", textAlign: ["Amount", "Unit Rate", "Qty", "Tax Rate"].includes(h) ? "right" : "left" }}>{h.toUpperCase()}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pageItems.map((item, idx) => {
                            const rateGst = item.gstRate !== undefined ? parseFloat(item.gstRate) : (parseFloat(inv.gstRate) || 18);
                            const isIncl = item.isGstIncluded !== undefined ? item.isGstIncluded : (inv.isGstIncluded || false);
                            return (
                              <tr key={item.id} className="avoid-break" style={{ borderBottom: "1px solid var(--app-border)" }}>
                                <td style={{ padding: "12px 11px", color: "#64748b", fontWeight: 700, fontSize: 12 }}>{String(globalItemOffset + idx + 1).padStart(2, "0")}</td>
                                <td style={{ padding: "12px 11px", fontSize: 13, fontWeight: 600, color: "#0f1c2e" }}>{item.description || "—"}</td>
                                <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 13, color: "#374151" }}>{item.quantity}</td>
                                <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 13, color: "#374151" }}>{formatCurrency(item.rate, inv.currency, false, false, inv.customCurrencySymbol)}</td>
                                <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 13, color: "#6b7280" }}>{rateGst}% {isIncl ? "(Incl)" : ""}</td>
                                <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "#0f1c2e" }}>{formatCurrency((parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0), inv.currency, false, false, inv.customCurrencySymbol)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {isLastPage && (<>
                      {/* Totals with QR Scanner */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 32px 16px" }}>
                        {/* QR Scanner */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "var(--app-bg)", borderRadius: 8, padding: "8px", border: "1px solid var(--app-border)", minWidth: 95 }}>
                          <div style={{ fontSize: "8px", color: "#64748b", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>SCAN INVOICE</div>
                          <div style={{ background: "#fff", padding: 5, borderRadius: 4, border: "1px solid var(--app-border)" }}>
                            <QRCodeSVG value={qrData} size={80} bgColor="#ffffff" fgColor="#0f1c2e" />
                          </div>
                        </div>

                        {/* Totals */}
                        <div className="inv-totals" style={{ width: "200px" }}>
                          <div className="inv-total-row" style={{ display: "flex", justify: "space-between", padding: "4px 0", fontSize: "10px", borderBottom: "1px solid var(--app-border)" }}>
                            <span className="lbl" style={{ color: "#64748b" }}>Subtotal</span>
                            <span className="val" style={{ fontWeight: "700" }}>{formatCurrency(subtotal, inv.currency, false, false, inv.customCurrencySymbol)}</span>
                          </div>
                          <div className="inv-total-row" style={{ display: "flex", justify: "space-between", padding: "4px 0", fontSize: "10px", borderBottom: "1px solid var(--app-border)" }}>
                            <span className="lbl" style={{ color: "#64748b" }}>GST / Tax</span>
                            <span className="val" style={{ fontWeight: "700" }}>{formatCurrency(gstAmt, inv.currency, false, false, inv.customCurrencySymbol)}</span>
                          </div>
                          {amountPaid > 0 && (
                            <div className="inv-total-row" style={{ display: "flex", justify: "space-between", padding: "4px 0", fontSize: "10px", borderBottom: "1px solid var(--app-border)" }}>
                              <span className="lbl" style={{ color: "#64748b" }}>Paid (Advance)</span>
                              <span className="val" style={{ fontWeight: "700", color: "var(--green)" }}>-{formatCurrency(amountPaid, inv.currency, false, false, inv.customCurrencySymbol)}</span>
                            </div>
                          )}
                          <div className="inv-grand-row" style={{ display: "flex", justify: "space-between", padding: "6px 8px", background: "#0f1c2e", borderRadius: "6px", marginTop: "4px", color: "#fff" }}>
                            <span className="lbl" style={{ fontSize: "10px", fontWeight: "800" }}>Balance Due</span>
                            <span className="val" style={{ fontSize: "12px", fontWeight: "900" }}>{formatCurrency(balanceDue, inv.currency, false, false, inv.customCurrencySymbol)}</span>
                          </div>
                        </div>
                      </div>
                      {/* Amount in Words */}
                      <div style={{ margin: "8px 32px 0", padding: "7px 12px", background: "#f8fafc", border: "1px dashed #CBD5E1", borderRadius: "6px" }}>
                        <span style={{ fontSize: "9px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px" }}>Amount in Words: </span>
                        <span style={{ fontSize: "9px", fontWeight: "800", color: "#0f1c2e" }}>{inv.currency === 'INR' ? 'INR ' : (inv.currency || 'INR') + ' '}{numberToWords(Math.round(balanceDue))}</span>
                      </div>

                      {/* Payment details */}
                      {(inv.bankName || inv.accountNumber || inv.ifscCode || inv.upiId) && (
                        <div className="inv-bank" style={{ margin: "12px 32px 0", padding: "8px 10px", background: currentT.primaryBg, borderRadius: "6px", borderLeft: `3px solid ${currentT.primaryColor}` }}>
                          <div className="inv-bank-title" style={{ fontSize: "9px", fontWeight: "700", color: currentT.primaryColor, marginBottom: "3px" }}>Payment Details</div>
                          <div className="inv-bank-detail" style={{ fontSize: "9px", color: "#0f1c2e", lineHeight: "1.5" }}>
                            {inv.bankName && <span>Bank: {inv.bankName} &nbsp;|&nbsp; </span>}
                            {inv.accountNumber && <span>A/C: {inv.accountNumber} &nbsp;|&nbsp; </span>}
                            {inv.ifscCode && <span>IFSC: {inv.ifscCode}</span>}
                            {inv.upiId && <div style={{ marginTop: "2px" }}>UPI: {inv.upiId}</div>}
                          </div>
                        </div>
                      )}

                      {/* Notes & Terms + Signature */}
                      <div className="inv-footer avoid-break" style={{ margin: "16px 32px 24px", paddingTop: "10px", borderTop: "1px solid var(--app-border)", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div className="inv-notes" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                          {inv.notes && (
                            <div>
                              <div className="inv-notes-title" style={{ fontSize: "10px", fontWeight: "700", color: currentT.primaryColor, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: "2px" }}>Notes</div>
                              <div className="inv-notes-text" style={{ fontSize: "10px", color: "#64748b", lineHeight: "1.5" }}>{inv.terms}</div>
                            </div>
                          )}
                          {inv.terms && (
                            <div>
                              <div className="inv-notes-title" style={{ fontSize: "10px", fontWeight: "700", color: currentT.primaryColor, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: "2px" }}>Terms & Conditions</div>
                              <div className="inv-notes-text" style={{ fontSize: "10px", color: "#64748b", lineHeight: "1.5" }}>{inv.terms}</div>
                            </div>
                          )}
                        </div>
                        <div className="inv-sig" style={{ textAlign: "right", minWidth: "120px" }}>
                          <div style={{ height: "35px", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", marginBottom: "3px" }}>
                            {inv.signature ? (
                              inv.signatureType === "image" ? (
                                <img src={inv.signature} alt="Signature" style={{ maxHeight: "30px", maxWidth: "120px", objectFit: "contain" }} />
                              ) : (
                                <div style={{ fontFamily: "'Dancing Script', cursive", fontSize: "16px", fontWeight: "bold", color: "#1a2e35" }}>{inv.signature}</div>
                              )
                            ) : null}
                          </div>
                          <div className="inv-sig-line" style={{ width: "100%", height: "1px", background: "var(--app-border)", marginBottom: "3px" }}></div>
                          <div className="inv-sig-name" style={{ fontSize: "9px", fontWeight: "700", color: "#0f1c2e" }}>{inv.companyName || effectiveCompanyName}</div>
                          <div className="inv-sig-role" style={{ fontSize: "8px", color: "#64748b" }}>Authorized Signatory</div>
                        </div>
                      </div>

                    </>)}

                    <div className="flex-spacer" style={{ flex: 1 }} />

                    {/* Footer message */}
                    <div style={{ background: "#ffffff", borderTop: "2px solid #f1f5f9", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, pageBreakBefore: "auto", breakBefore: "auto" }}>
                      <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{effectiveCompanyName}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: currentT.primaryColor || "#7c3aed" }}>{inv.footerMessage}</div>
                      <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{inv.invoiceNo}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    );
  }

  // ------------------------------------------------------------
  // FORM (Create / Edit)
  // ------------------------------------------------------------
  if (step === "template") {
    return (
      <div style={{ width: "100%", height: "80vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "10px 0", display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => jumpInvoice ? onBack() : setStep("list")} style={{ padding: "8px 14px", background: "var(--app-bg)", border: "1.5px solid var(--app-border)", borderRadius: 8, cursor: "pointer", fontWeight: 700, color: "#64748b" }}>{jumpInvoice ? " Back to Dashboard" : " Back to List"}</button>
        </div>
        <div style={{ flex: 1, overflow: "hidden", borderRadius: 16 }}>
          <iframe src="/template-designer.html#inv" ref={iframeRef} onLoad={sendThemeToIframe} style={{ width: "100%", height: "100%", border: "none" }} title="Template Designer" />
        </div>
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1 }}>

      <Toast msg={toast} />

      {/* Top nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => { if (onBack && (jumpInvoice || newInvoicePrefill) && !internalNav) { onBack(); return; } setStep("list"); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--app-accent)", fontWeight: 700, padding: 0, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
            Back
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f1c2e" }}>

          </span>
          {editingId && (
            <span style={{ background: "var(--app-border)", color: "var(--app-accent)", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
              {inv.invoiceNo}
            </span>
          )}
        </div>

      </div>




      {/* Split Layout Container */}
      <div className="invoice-creator-split-container" style={{ display: "grid", gridTemplateColumns: "1fr 450px", gap: "24px", alignItems: "start", marginTop: 16 }}>

        {/* Left Panel: Scrollable form cards */}
        <div className="inv-creator-form-side">

          {/* TEMPLATE */}
          <div className="inv-creator-card">
            <div className="inv-creator-card-header">
              <div className="inv-creator-card-icon" style={{ background: "var(--purple-bg)", color: "var(--purple)" }}><i className="ti ti-layout-grid"></i></div>
              <div className="inv-creator-card-title">Invoice Template</div>
            </div>
            <div className="inv-creator-card-body">
              <div className="inv-creator-template-row">
                {[
                  { name: "Classic", icon: "" },
                  { name: "Modern", icon: "" },
                  { name: "Minimal", icon: "" },
                  { name: "Bold", icon: "" }
                ].map(t => (
                  <div key={t.name} className={`inv-creator-template-opt ${inv.template === t.name ? "selected" : ""}`} onClick={() => upd("template", t.name)}>
                    <div className="inv-creator-template-opt-icon">{t.icon}</div>
                    <div className="inv-creator-template-opt-name">{t.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* INVOICE DETAILS */}
          <div className="inv-creator-card">
            <div className="inv-creator-card-header">
              <div className="inv-creator-card-icon" style={{ background: "var(--teal-light)", color: "var(--teal)" }}><i className="ti ti-receipt-2"></i></div>
              <div className="inv-creator-card-title">Invoice Details</div>
            </div>
            <div className="inv-creator-card-body">
              <div className="inv-creator-form-row">
                <div className="inv-creator-form-group">
                  <label className="inv-creator-form-label">Invoice Number</label>
                  <input className="inv-creator-form-input" type="text" value={inv.invoiceNo} readOnly />
                </div>
                <div className="inv-creator-form-group">
                  <label className="inv-creator-form-label">Invoice Date</label>
                  <input className="inv-creator-form-input" type="date" value={inv.date} onChange={(e) => upd("date", e.target.value)} />
                </div>
              </div>
              <div className="inv-creator-form-row">
                <div className="inv-creator-form-group">
                  <label className="inv-creator-form-label">Due Date</label>
                  {/* Put this under the existing label, instead of the terms grid */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <select className="inv-creator-form-select"
                      value={inv.dueDateType || 'custom'}
                      onChange={e => {
                        const val = e.target.value;
                        upd('dueDateType', val);
                        if (val !== 'custom') {
                          const days = parseInt(val) || 0;
                          const newDue = new Date(new Date(inv.date).getTime() + days * 86400000)
                            .toISOString().split('T')[0];
                          upd('dueDate', newDue);
                        }
                      }} style={{ flex: 1 }}>
                      <option value="0">Due on receipt</option>
                      <option value="15">Next 15 days</option>
                      <option value="30">Next 30 days</option>
                      <option value="45">Next 45 days</option>
                      <option value="custom">Custom date</option>
                    </select>
                    {/* Always show the date input when a specific date is saved or custom is selected */}
                    {(inv.dueDateType === 'custom' || (inv.dueDate && !['0', '15', '30', '45'].includes(inv.dueDateType))) && (
                      <input type="date" className="inv-creator-form-input"
                        value={inv.dueDate || ''}
                        onChange={e => upd('dueDate', e.target.value)}
                        style={{ flex: 1 }} />
                    )}
                  </div>
                </div>
                <div className="inv-creator-form-group">
                  <label className="inv-creator-form-label">Category</label>
                  <select className="inv-creator-form-select" value={inv.category || "Consulting"} onChange={(e) => upd("category", e.target.value)}>
                    <option value="Advance Payment">Advance Payment</option>
                    <option value="Additional Payment">Additional Payment</option>
                    <option value="Milestone">Milestone</option>
                    <option value="Final Invoice">Final Invoice</option>
                    <option value="Monthly Retainer">Monthly Retainer</option>
                    <option value="Consulting">Consulting</option>
                  </select>
                </div>

              </div>
            </div>
          </div>

          {/* FROM (SENDER) */}
          {/* <div className="inv-creator-card">
            <div className="inv-creator-card-header">
              <div className="inv-creator-card-icon" style={{background:"var(--teal-light)",color:"var(--teal)"}}><i className="ti ti-building"></i></div>
              <div className="inv-creator-card-title">From (Your Details)</div>
            </div>
            <div className="inv-creator-card-body">
              <div className="inv-creator-form-row">
                <div className="inv-creator-form-group">
                  <label className="inv-creator-form-label">Company Name</label>
                  <input className="inv-creator-form-input" type="text" value={inv.companyName} onChange={(e) => upd("companyName", e.target.value)} />
                </div>
                <div className="inv-creator-form-group">
                  <label className="inv-creator-form-label">GST Number</label>
                  <input className="inv-creator-form-input" type="text" value={inv.fromGST || "33ABCDE1234F1Z5"} onChange={(e) => upd("fromGST", e.target.value)} />
                </div>
              </div>
              <div className="inv-creator-form-row">
                <div className="inv-creator-form-group">
                  <label className="inv-creator-form-label">Email</label>
                  <input className="inv-creator-form-input" type="email" value={inv.companyEmail} onChange={(e) => upd("companyEmail", e.target.value)} />
                </div>
                <div className="inv-creator-form-group">
                  <label className="inv-creator-form-label">Phone</label>
                  <input className="inv-creator-form-input" type="tel" value={inv.companyPhone} onChange={(e) => upd("companyPhone", e.target.value)} />
                </div>
              </div>
              <div className="inv-creator-form-group">
                <label className="inv-creator-form-label">Address</label>
                <input className="inv-creator-form-input" type="text" value={inv.companyAddress} onChange={(e) => upd("companyAddress", e.target.value)} />
              </div>
            </div>
          </div> */}

          {/* BILL TO (CLIENT) */}
          <div className="inv-creator-card">
            <div className="inv-creator-card-header">
              <div className="inv-creator-card-icon" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}><i className="ti ti-user-circle"></i></div>
              <div className="inv-creator-card-title">Bill To (Client)</div>

            </div>
            <div className="inv-creator-card-body">
              <div className="inv-creator-form-row">
                <div className="inv-creator-form-group" id="field-client" style={{ marginBottom: 0 }}>
                  <label className="inv-creator-form-label" style={{ color: errors.client ? "#ef4444" : "var(--text2)" }}>Company / Client Name *</label>
                  <CompanyDropdown
                    clients={clients}
                    value={inv.client}
                    onChange={v => { upd("client", v); }}
                    error={errors.client}
                    onAddCompany={() => setShowAddClient(true)}
                  />
                  {errors.client && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontWeight: 600 }}>Warning {errors.client}</div>}
                  {showAddClient && (
                    <AddClientView
                      onBack={() => setShowAddClient(false)}
                      onClientAdded={(newClient) => {
                        const newName = newClient?.clientName || newClient?.name || '';
                        if (newName) {
                          upd("client", newName);
                          if (clients && Array.isArray(clients)) clients.push(newClient);
                        }
                        setShowAddClient(false);
                      }}
                      user={JSON.parse(localStorage.getItem("user") || "{}")}
                    />
                  )}
                </div>
                <div className="inv-creator-form-group" style={{ marginBottom: 0 }}>
                  <label className="inv-creator-form-label">Project</label>
                  <ProjectDropdown
                    projects={filteredProjects}
                    value={inv.project}
                    onChange={v => upd("project", v)}
                    onAddProject={onAddProject}
                    disabled={!inv.client}
                  />
                </div>
              </div>
              {selectedClient && (
                <div style={{ marginTop: 14, padding: "8px 12px", background: "#f9fafb", borderRadius: 8, display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {[["", selectedClient.email], ["", selectedClient.phone], ["Location", selectedClient.address], ["", selectedClient.gstNumber]].filter(([, v]) => v).map(([icon, val], i) => (
                    <span key={i} style={{ fontSize: 12, color: "#6b7280" }}>{icon} {val}</span>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 14 }}>
                <label className="inv-creator-form-label">Invoice Type</label>
                <select
                  value={inv.invoiceType || "Milestone"}
                  onChange={e => upd("invoiceType", e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #E2E8F0", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                >
                  <option value="Milestone">Milestone</option>
                  <option value="Advance">Advance</option>
                  <option value="Additional">Additional</option>
                  <option value="Custom">Custom</option>
                </select>
                {inv.invoiceType === "Custom" && (
                  <input
                    type="text"
                    placeholder="Enter custom invoice type"
                    value={inv.customInvoiceType || ""}
                    onChange={e => upd("customInvoiceType", e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1.5px solid #E2E8F0", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginTop: 8 }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* LINE ITEMS */}
          <div className="inv-creator-card">
            <div className="inv-creator-card-header">
              <div className="inv-creator-card-icon" style={{ background: "var(--blue-bg)", color: "var(--blue)" }}><i className="ti ti-list-details"></i></div>
              <div className="inv-creator-card-title">Line Items</div>
            </div>
            <div className="inv-creator-card-body">
              <table className="inv-creator-items-table">
                <thead>
                  <tr>
                    <th style={{ width: "36%" }}>Description</th>
                    <th style={{ width: "12%" }}>Qty</th>
                    <th style={{ width: "18%" }}>Unit Price</th>
                    <th style={{ width: "14%" }}>Tax %</th>
                    <th style={{ width: "16%", textAlign: "right" }}>Total</th>
                    <th style={{ width: "4%" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const dErr = errors[`item_${item.id}_description`];
                    const rErr = errors[`item_${item.id}_rate`];
                    const qty = parseFloat(item.quantity) || 0;
                    const rate = parseFloat(item.rate) || 0;
                    const lineBase = qty * rate;
                    const rateGst = item.gstRate !== undefined ? parseFloat(item.gstRate) : (parseFloat(inv.gstRate) || 18);
                    const isIncl = item.isGstIncluded !== undefined ? item.isGstIncluded : (inv.isGstIncluded || false);
                    const lineTax = isIncl ? (lineBase - (lineBase / (1 + rateGst / 100))) : (lineBase * (rateGst / 100));
                    const lineTotal = isIncl ? lineBase : (lineBase + lineTax);
                    return (
                      <tr key={item.id}>
                        <td>
                          <input type="text" id={`item_${item.id}_description`} className="inv-creator-item-input desc" placeholder="Item description" value={item.description || ""} onChange={(e) => updItem(item.id, "description", e.target.value)} />
                          {dErr && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>Warning Required</div>}
                        </td>
                        <td>
                          <input type="number" className="inv-creator-item-input num" value={item.quantity === 0 ? "" : item.quantity} onChange={(e) => updItem(item.id, "quantity", e.target.value === "" ? 0 : Number(e.target.value))} onWheel={(e) => e.target.blur()} />
                        </td>
                        <td>
                          <input type="number" id={`item_${item.id}_rate`} className="inv-creator-item-input num" value={item.rate === 0 ? "" : item.rate} onChange={(e) => updItem(item.id, "rate", e.target.value === "" ? 0 : Number(e.target.value))} onWheel={(e) => e.target.blur()} style={{ width: "90px" }} />
                          {rErr && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>Warning Required</div>}
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <select
                              className="inv-creator-form-select"
                              value={rateGst}
                              onChange={(e) => updItem(item.id, "gstRate", Number(e.target.value))}
                              style={{ width: "75px", padding: "6px 8px", fontSize: "11px", height: "32px", backgroundPosition: "right 6px center" }}
                            >
                              {GST_RATES.map((rate) => (
                                <option key={rate} value={rate}>
                                  {rate}%
                                </option>
                              ))}
                            </select>
                            <select
                              className="inv-creator-form-select"
                              value={isIncl ? "incl" : "excl"}
                              onChange={(e) => updItem(item.id, "isGstIncluded", e.target.value === "incl")}
                              style={{ width: "75px", padding: "4px 6px", fontSize: "9px", height: "26px", fontWeight: "700", backgroundPosition: "right 6px center" }}
                            >
                              <option value="excl">Excl</option>
                              <option value="incl">Incl</option>
                            </select>
                          </div>
                        </td>
                        <td className="inv-creator-item-total">
                          {formatCurrency(lineTotal, inv.currency, false, false, inv.customCurrencySymbol)}
                        </td>
                        <td>
                          <button className="inv-creator-del-row-btn" onClick={() => removeItem(item.id)}><i className="ti ti-trash"></i></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <button className="inv-creator-add-item-btn" onClick={addItem}><i className="ti ti-plus" style={{ fontSize: "14px" }}></i> Add Line Item</button>

              {/* TOTALS */}
              <div className="inv-creator-totals-section">
                <div className="inv-creator-form-row" style={{ marginBottom: "10px" }}>
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">Discount Type</label>
                    <select
                      className="inv-creator-form-input"
                      value={inv.discountType || "Percentage"}
                      onChange={(e) => upd("discountType", e.target.value)}
                    >
                      <option value="Percentage">Percentage (%)</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                  <div className="inv-creator-form-group">
                    <label className="inv-creator-form-label">
                      Discount {inv.discountType === "Custom" ? "" : "(%)"}
                    </label>
                    <input
                      className="inv-creator-form-input"
                      type="number"
                      value={inv.discountPct === "" || inv.discountPct === undefined ? "" : inv.discountPct}
                      onChange={(e) => {
                        const raw = e.target.value;
                        upd("discountPct", raw === "" ? "" : Number(raw));
                      }}
                      placeholder="0"
                    />
                  </div>

                </div>
                <div className="inv-creator-form-group">
                  <label className="inv-creator-form-label">Shipping / Extra Charges</label>
                  <input className="inv-creator-form-input" type="number" value={inv.extraCharges === 0 ? "" : inv.extraCharges} onChange={(e) => upd("extraCharges", e.target.value === "" ? 0 : Number(e.target.value))} placeholder="0" />
                </div>
                <div className="inv-creator-total-row"><span className="inv-creator-total-label">Subtotal</span><span className="inv-creator-total-val">{formatCurrency(subtotal, inv.currency, false, false, inv.customCurrencySymbol)}</span></div>
                <div className="inv-creator-total-row discount"><span className="inv-creator-total-label">Discount{inv.discountType === "Custom" ? " (Custom)" : " (%)"}</span><span className="inv-creator-total-val">- {formatCurrency(discountAmt, inv.currency, false, false, inv.customCurrencySymbol)}</span></div>
                <div className="inv-creator-total-row tax"><span className="inv-creator-total-label">GST / Tax</span><span className="inv-creator-total-val">+ {formatCurrency(gstAmt, inv.currency, false, false, inv.customCurrencySymbol)}</span></div>
                <div className="inv-creator-total-row"><span className="inv-creator-total-label">Extra Charges</span><span className="inv-creator-total-val">+ {formatCurrency(inv.extraCharges || 0, inv.currency, false, false, inv.customCurrencySymbol)}</span></div>                <div className="inv-creator-total-row grand"><span className="inv-creator-total-label">Total Amount</span><span className="inv-creator-total-val">{formatCurrency(total - discountAmt + (inv.extraCharges || 0), inv.currency, false, false, inv.customCurrencySymbol)}</span></div>
              </div>
            </div>
          </div>

          {/* PAYMENT TERMS */}
          <div className="inv-creator-card">
            <div className="inv-creator-card-header">
              <div className="inv-creator-card-icon" style={{ background: "var(--green-bg)", color: "var(--green)" }}><i className="ti ti-clock"></i></div>
              <div className="inv-creator-card-title">Payment Terms & Bank Details</div>
            </div>
            <div className="inv-creator-card-body">

              <div className="inv-creator-form-row">

                <div className="inv-creator-form-group">
                  <label className="inv-creator-form-label">Payment Method</label>
                  <select className="inv-creator-form-select" value={inv.paymentMode} onChange={(e) => upd("paymentMode", e.target.value)}>
                    <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                    <option value="Online Payment Link">Online Payment Link</option>
                  </select>
                </div>
                <div className="inv-creator-form-group">
                  <label className="inv-creator-form-label">Currency</label>
                  {(() => {
                    const presetCurrencies = ["INR", "USD", "EUR", "GBP", "AED", "SAR", "SGD", "AUD", "CAD", "JPY", "QAR", "KWD", "OMR", "BHD", "CHF", "NZD", "MYR", "THB", "IDR", "PKR", "BDT", "LKR", "NPR", "MXN", "BRL", "ZAR", "NGN", "EGP", "TRY", "RUB"];
                    const isCustom = !presetCurrencies.includes(inv.currency || 'INR');
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <select
                          className="inv-creator-form-select"
                          value={isCustom ? "__custom__" : (inv.currency || 'INR')}
                          onChange={e => {
                            if (e.target.value !== "__custom__") upd('currency', e.target.value);
                            else upd('currency', '');
                          }}
                        >
                          <option value="INR">INR - Indian Rupee</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="AED">AED - UAE Dirham</option>
                          <option value="SAR">SAR - Saudi Riyal</option>
                          <option value="SGD">SGD - Singapore Dollar</option>
                          <option value="AUD">AUD - Australian Dollar</option>
                          <option value="CAD">CAD - Canadian Dollar</option>
                          <option value="JPY">JPY - Japanese Yen</option>
                          <option value="QAR">QAR - Qatari Riyal</option>
                          <option value="KWD">KWD - Kuwaiti Dinar</option>
                          <option value="OMR">OMR - Omani Rial</option>
                          <option value="BHD">BHD - Bahraini Dinar</option>
                          <option value="CHF">CHF - Swiss Franc</option>
                          <option value="NZD">NZD - New Zealand Dollar</option>
                          <option value="MYR">MYR - Malaysian Ringgit</option>
                          <option value="THB">THB - Thai Baht</option>
                          <option value="IDR">IDR - Indonesian Rupiah</option>
                          <option value="PKR">PKR - Pakistani Rupee</option>
                          <option value="BDT">BDT - Bangladeshi Taka</option>
                          <option value="LKR">LKR - Sri Lankan Rupee</option>
                          <option value="NPR">NPR - Nepalese Rupee</option>
                          <option value="MXN">MXN - Mexican Peso</option>
                          <option value="BRL">BRL - Brazilian Real</option>
                          <option value="ZAR">ZAR - South African Rand</option>
                          <option value="NGN">NGN - Nigerian Naira</option>
                          <option value="EGP">EGP - Egyptian Pound</option>
                          <option value="TRY">TRY - Turkish Lira</option>
                          <option value="RUB">RUB - Russian Ruble</option>
                          <option value="__custom__">Edit Type Custom Currency Code...</option>
                        </select>
                        {isCustom || inv.currency === '' ? (
                          <div style={{ display: "flex", gap: 8 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 10, color: "#607D86", fontWeight: 700, marginBottom: 4 }}>Currency Code</div>
                              <input
                                className="inv-creator-form-input"
                                type="text"
                                maxLength={10}
                                placeholder="e.g. XOF, VND..."
                                value={inv.currency || ''}
                                onChange={e => upd('currency', e.target.value.toUpperCase())}
                                style={{ fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}
                                autoFocus
                              />
                            </div>
                            <div style={{ width: 90 }}>
                              <div style={{ fontSize: 10, color: "#607D86", fontWeight: 700, marginBottom: 4 }}>Symbol</div>
                              <input
                                className="inv-creator-form-input"
                                type="text"
                                maxLength={5}
                                placeholder="e.g. ₫, ₣"
                                value={inv.customCurrencySymbol || ''}
                                onChange={e => upd('customCurrencySymbol', e.target.value)}
                                style={{ fontWeight: 800, fontSize: 16, textAlign: "center" }}
                              />
                            </div>
                          </div>
                        ) : null}
                        {inv.currency && inv.currency !== '' && (
                          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, display: "flex", gap: 12 }}>
                            <span>Code: <span style={{ color: "var(--teal)", fontWeight: 800 }}>{inv.currency}</span></span>
                            <span>Symbol: <span style={{ color: "var(--teal)", fontWeight: 800 }}>{getCurrencySymbol(inv.currency) !== inv.currency ? getCurrencySymbol(inv.currency) : (inv.customCurrencySymbol || inv.currency)}</span></span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="inv-creator-form-row">
                <div className="inv-creator-form-group">
                  <label className="inv-creator-form-label">Bank Name</label>
                  <input className="inv-creator-form-input" type="text" value={inv.bankName} onChange={(e) => upd("bankName", e.target.value)} placeholder="e.g. HDFC Bank" />
                </div>
                <div className="inv-creator-form-group">
                  <label className="inv-creator-form-label">Account Number</label>
                  <input className="inv-creator-form-input" type="text" value={inv.accountNumber} onChange={(e) => upd("accountNumber", e.target.value)} placeholder="Account number" />
                </div>
              </div>
              <div className="inv-creator-form-row">
                <div className="inv-creator-form-group">
                  <label className="inv-creator-form-label">IFSC Code</label>
                  <input className="inv-creator-form-input" type="text" value={inv.ifscCode} onChange={(e) => upd("ifscCode", e.target.value)} placeholder="IFSC code" />
                </div>
                <div className="inv-creator-form-group">
                  <label className="inv-creator-form-label">UPI ID</label>
                  <input className="inv-creator-form-input" type="text" value={inv.upiId} onChange={(e) => upd("upiId", e.target.value)} placeholder="your@upi" />
                </div>
              </div>
            </div>
          </div>

          {/* NOTES & TERMS */}
          <div className="inv-creator-card">
            <div className="inv-creator-card-header">
              <div className="inv-creator-card-icon" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}><i className="ti ti-notes"></i></div>
              <div className="inv-creator-card-title">Notes, Terms & Signature</div>
            </div>
            <div className="inv-creator-card-body">
              <div className="inv-creator-form-group">
                <label className="inv-creator-form-label" style={{ fontSize: 15 }}>Invoice Notes</label>
                <textarea className="inv-creator-form-textarea" value={inv.notes} onChange={(e) => upd("notes", e.target.value)} placeholder="Thank you for your business!" style={{ fontSize: 15 }} />
              </div>
              <div className="inv-creator-form-group">
                <label className="inv-creator-form-label" style={{ fontSize: 15 }}>Terms & Conditions</label>
                <textarea className="inv-creator-form-textarea" value={inv.terms} onChange={(e) => upd("terms", e.target.value)} placeholder="Terms and conditions..." style={{ fontSize: 15 }} />
              </div>
              <div className="inv-creator-form-group">
                <label className="inv-creator-form-label">Authorised Signature</label>
                {inv.signature ? (
                  <div style={{ background: "#fff", border: "1.5px solid #E0EEF0", borderRadius: 12, padding: "14px 18px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                    <button type="button" onClick={() => { upd("signature", ""); upd("signatureType", "text"); setTypedSig(""); }} style={{ position: "absolute", top: 10, right: 10, border: "none", background: "none", color: "#ef4444", fontSize: 12, cursor: "pointer", fontWeight: "800" }}>CloseClear Signature</button>
                    <div style={{ minHeight: 60, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", marginTop: 12 }}>
                      {inv.signatureType === "image" ? (
                        <img src={inv.signature} alt="Signature Preview" style={{ maxHeight: 50, maxWidth: "100%", objectFit: "contain" }} />
                      ) : (
                        <div style={{ fontFamily: "'Dancing Script', cursive", fontSize: 28, fontWeight: "bold", color: "#1a2e35" }}>{inv.signature}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Tabs */}
                    <div style={{ display: "flex", borderBottom: "1.5px solid #E0EEF0", marginBottom: 12, gap: 16 }}>
                      {["draw", "type", "upload"].map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setSigTab(tab)}
                          style={{
                            padding: "6px 12px 8px",
                            border: "none",
                            background: "none",
                            fontSize: 12,
                            fontWeight: "800",
                            color: sigTab === tab ? "var(--teal)" : "#607D86",
                            borderBottom: sigTab === tab ? "2px solid var(--teal)" : "2px solid transparent",
                            cursor: "pointer",
                            textTransform: "capitalize"
                          }}
                        >
                          {tab === "draw" ? "Draw" : tab === "type" ? "Type" : "Upload"}
                        </button>
                      ))}
                    </div>

                    {/* Tab contents */}
                    {sigTab === "draw" && (
                      <CanvasSignature onSave={(dataUrl) => { upd("signature", dataUrl); upd("signatureType", "image"); }} />
                    )}

                    {sigTab === "type" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            type="text"
                            className="inv-creator-form-input"
                            placeholder="Type signatory name..."
                            value={typedSig}
                            onChange={(e) => setTypedSig(e.target.value)}
                            style={{ fontFamily: "'Dancing Script', cursive", fontSize: 18, fontWeight: "bold" }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const val = typedSig.trim() || inv.companyName || effectiveCompanyName;
                              upd("signature", typedSig || val);
                              upd("signatureType", "text");
                            }}
                            style={{
                              padding: "10px 14px",
                              background: "var(--teal)",
                              border: "none",
                              borderRadius: 10,
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: "800",
                              cursor: "pointer",
                              whiteSpace: "nowrap"
                            }}
                          >
                            Apply Signature
                          </button>
                        </div>
                        {typedSig && (
                          <div style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 8 }}>
                            <span>Preview:</span>
                            <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: 22, color: "#1a2e35", fontWeight: "bold" }}>{typedSig}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {sigTab === "upload" && (
                      <div style={{ background: "#F5FAFA", border: "1.5px dashed #C5DDE0", borderRadius: 10, padding: "16px", textAlign: "center", cursor: "pointer", position: "relative" }}>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = (ev) => {
                                upd("signature", ev.target.result);
                                upd("signatureType", "image");
                              };
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                        <i className="ti ti-upload" style={{ fontSize: 24, color: "#607D86" }}></i>
                        <div style={{ fontSize: 12, fontWeight: "700", color: "#607D86", marginTop: 4 }}>Click to upload signature image</div>
                        <div style={{ fontSize: 10, color: "#A0B8BE", marginTop: 2 }}>PNG or JPG with transparent background preferred</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>{/* Right Side: Sticky Live Preview */}
        <div style={{ position: "sticky", top: "0px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="preview-card" style={{ background: "var(--app-card)", border: "1.5px solid var(--app-border)", borderRadius: "14px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <div className="preview-toolbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1.5px solid var(--app-border)", background: "var(--app-surface-variant)" }}>
              <div style={{ fontSize: "12px", fontWeight: "800", color: "#0f1c2e" }}>Document Live Preview</div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={handleSavePreview} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 10px", background: "#fff", border: "1.5px solid var(--app-border)", borderRadius: "8px", fontSize: "10px", fontWeight: "700", color: "#0f1c2e", cursor: "pointer", fontFamily: "inherit" }}>
                  Print / PDF
                </button>
              </div>
            </div>

            {/* LIVE INVOICE PREVIEW */}
            <div className="invoice-preview" style={{ padding: "20px", fontFamily: currentT.fontFamily, fontSize: "11px", color: "#1A2E35", background: "#fff", minHeight: "560px" }}>

              {/* HEADER */}
              <div className="inv-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", paddingBottom: "12px", borderBottom: currentT.headerUnderline }}>
                <div className="inv-logo-area">
                  {effectiveLogo ? (
                    <img src={effectiveLogo} alt="logo" style={{ height: 40, width: "auto", borderRadius: 6, marginBottom: 8, objectFit: "contain" }} />
                  ) : (
                    <div className="inv-logo-box" style={{ width: "40px", height: "40px", borderRadius: "8px", background: currentT.logoColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: "900", color: "#fff", marginBottom: "8px" }}>
                      {effectiveCompanyName ? effectiveCompanyName[0].toUpperCase() : "YT"}
                    </div>
                  )}
                  <div className="inv-company-name" style={{ fontSize: "13px", fontWeight: "800", color: "#0f1c2e" }}>{inv.companyName || effectiveCompanyName}</div>
                  <div className="inv-company-details" style={{ fontSize: "9px", color: "#64748b", lineHeight: "1.6", marginTop: "3px" }}>
                    {inv.companyEmail && <div>{inv.companyEmail}</div>}
                    {inv.companyPhone && <div>{inv.companyPhone}</div>}
                    {inv.companyAddress && <div>{inv.companyAddress}</div>}
                  </div>
                </div>
                <div className="inv-title-area" style={{ textAlign: "right" }}>
                  <div className="inv-title-word" style={{ fontSize: "24px", fontWeight: "900", color: currentT.primaryColor, letterSpacing: "-.5px" }}>INVOICE</div>
                  <div className="inv-id" style={{ fontSize: "11px", fontWeight: "700", color: "#0f1c2e", marginTop: "4px" }}>#{inv.invoiceNo}</div>
                  <div className="inv-type" style={{ display: "inline-flex", alignItems: "center", padding: "2px 9px", borderRadius: "20px", fontSize: "9px", fontWeight: "700", marginTop: "4px", background: currentT.primaryColor, color: "#fff" }}>
                    {inv.invoiceType === "Custom" ? (inv.customInvoiceType || "Custom") : (inv.invoiceType || "Milestone")}
                  </div>
                  <div className="inv-dates" style={{ fontSize: "9px", color: "#64748b", marginTop: "2px", lineHeight: "1.6" }}>
                    <span>Issue: {inv.date ? new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}</span><br />
                    <span>Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}</span>
                  </div>
                  {inv.amountPaid < total ? (
                    inv.amountPaid > 0 ? (
                      <div className={`inv-status ${statusUpdating ? "draft" : "paid"}`} style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "20px", fontSize: "9px", fontWeight: "700", marginTop: "6px", background: "var(--amber-bg)", color: "var(--amber)" }}>
                        PART PAID
                      </div>
                    ) : null
                  ) : (
                    <div className={`inv-status ${statusUpdating ? "draft" : "paid"}`} style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: "20px", fontSize: "9px", fontWeight: "700", marginTop: "6px", background: "var(--green-bg)", color: "var(--green)" }}>
                      PAID
                    </div>
                  )}
                </div>
              </div>

              {/* PARTIES */}
              <div className="inv-parties" style={{ display: "grid", gridTemplateColumns: inv.project ? "1fr 1fr" : "1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <div className="inv-party-label" style={{ fontSize: "8px", fontWeight: "700", color: currentT.primaryColor, textTransform: "uppercase", letterSpacing: ".8px", marginBottom: "4px" }}>Bill To</div>
                  <div className="inv-party-name" style={{ fontSize: "12px", fontWeight: "800", color: inv.client ? "#0f1c2e" : "#64748b" }}>{inv.client || "— Client Name —"}</div>
                  <div className="inv-party-detail" style={{ fontSize: "9px", color: "#64748b", lineHeight: "1.6", marginTop: "2px" }}>
                    {selectedClient ? (
                      <>
                        {selectedClient.companyName && <div>{selectedClient.companyName}</div>}
                        {selectedClient.email && <div>{selectedClient.email}</div>}
                        {selectedClient.phone && <div>{selectedClient.phone}</div>}
                        {selectedClient.address && <div>{selectedClient.address}</div>}
                        {selectedClient.gstNumber && <div style={{ fontWeight: 700, color: currentT.primaryColor }}>GST: {selectedClient.gstNumber}</div>}
                      </>
                    ) : (
                      <span style={{ color: "#64748b" }}>Enter client details in the form</span>
                    )}
                  </div>
                </div>
                {inv.project && (
                  <div>
                    <div className="inv-party-label" style={{ fontSize: "8px", fontWeight: "700", color: currentT.primaryColor, textTransform: "uppercase", letterSpacing: ".8px", marginBottom: "4px" }}>Project</div>
                    <div className="inv-party-name" style={{ fontSize: "12px", fontWeight: "800", color: "#0f1c2e" }}>{inv.project}</div>
                  </div>
                )}
              </div>

              {/* ITEMS TABLE */}
              <table className="inv-items-table" style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ padding: "6px 8px", fontSize: "9px", fontWeight: "800", color: "#64748b", textAlign: "left" }}>#</th>
                    <th style={{ padding: "6px 8px", fontSize: "9px", fontWeight: "800", color: "#64748b", textAlign: "left" }}>Description</th>
                    <th style={{ padding: "6px 8px", fontSize: "9px", fontWeight: "800", color: "#64748b", textAlign: "right" }}>Qty</th>
                    <th style={{ padding: "6px 8px", fontSize: "9px", fontWeight: "800", color: "#64748b", textAlign: "right" }}>Unit Price</th>
                    <th style={{ padding: "6px 8px", fontSize: "9px", fontWeight: "800", color: "#64748b", textAlign: "right" }}>Tax %</th>
                    <th style={{ padding: "6px 8px", fontSize: "9px", fontWeight: "800", color: "#64748b", textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const rateGst = item.gstRate !== undefined ? parseFloat(item.gstRate) : (parseFloat(inv.gstRate) || 18);
                    const isIncl = item.isGstIncluded !== undefined ? item.isGstIncluded : (inv.isGstIncluded || false);
                    return (
                      <tr key={item.id} style={{ borderBottom: "1px solid var(--app-border)" }}>
                        <td style={{ padding: "6px 8px", fontSize: "10px", color: "#0f1c2e" }}>{idx + 1}</td>
                        <td style={{ padding: "6px 8px", fontSize: "10px", color: "#0f1c2e" }}>{item.description || "—"}</td>
                        <td style={{ padding: "6px 8px", fontSize: "10px", color: "#0f1c2e", textAlign: "right" }}>{item.quantity}</td>
                        <td style={{ padding: "6px 8px", fontSize: "10px", color: "#0f1c2e", textAlign: "right" }}>{formatCurrency(item.rate, inv.currency, false, false, inv.customCurrencySymbol)}</td>
                        <td style={{ padding: "6px 8px", fontSize: "10px", textAlign: "right", color: "#64748b" }}>{rateGst}% {isIncl ? "Incl" : ""}</td>
                        <td style={{ padding: "6px 8px", fontSize: "10px", color: "#0f1c2e", textAlign: "right", fontWeight: "700" }}>{formatCurrency((parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0), inv.currency, false, false, inv.customCurrencySymbol)}</td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* TOTALS WITH QR SCANNER */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "12px", marginBottom: "16px" }}>
                {/* QR Scanner */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "var(--app-bg)", borderRadius: 8, padding: "8px", border: "1px solid var(--app-border)", minWidth: 95 }}>
                  <div style={{ fontSize: "8px", color: "#64748b", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>SCAN INVOICE</div>
                  <div style={{ background: "#fff", padding: 5, borderRadius: 4, border: "1px solid var(--app-border)" }}>
                    <QRCodeSVG value={qrData} size={80} bgColor="#ffffff" fgColor="#0f1c2e" />
                  </div>
                </div>

                {/* TOTALS */}
                <div className="inv-totals" style={{ width: "200px" }}>
                  <div className="inv-total-row" style={{ display: "flex", justify: "space-between", padding: "4px 0", fontSize: "10px", borderBottom: "1px solid var(--app-border)" }}>
                    <span className="lbl" style={{ color: "#64748b" }}>Subtotal</span>
                    <span className="val" style={{ fontWeight: "700" }}>{formatCurrency(subtotal, inv.currency, false, false, inv.customCurrencySymbol)}</span>                  </div>
                  <div className="inv-total-row" style={{ display: "flex", justify: "space-between", padding: "4px 0", fontSize: "10px", borderBottom: "1px solid var(--app-border)" }}>
                    <span className="lbl" style={{ color: "#64748b" }}>GST / Tax</span>
                    <span className="val" style={{ fontWeight: "700" }}>{formatCurrency(gstAmt, inv.currency, false, false, inv.customCurrencySymbol)}</span>
                  </div>
                  {amountPaid > 0 && (
                    <div className="inv-total-row" style={{ display: "flex", justify: "space-between", padding: "4px 0", fontSize: "10px", borderBottom: "1px solid var(--app-border)" }}>
                      <span className="lbl" style={{ color: "#64748b" }}>Paid (Advance)</span>
                      <span className="val" style={{ fontWeight: "700", color: "var(--green)" }}>-{formatCurrency(amountPaid, inv.currency, false, false, inv.customCurrencySymbol)}</span>
                      <span className="val" style={{ fontWeight: "700", color: "var(--green)" }}>-{formatCurrency(amountPaid, inv.currency)}</span>

                    </div>
                  )}
                  <div className="inv-grand-row" style={{ display: "flex", justify: "space-between", padding: "6px 8px", background: "#0f1c2e", borderRadius: "6px", marginTop: "4px", color: "#fff" }}>
                    <span className="lbl" style={{ fontSize: "10px", fontWeight: "800" }}>Balance Due</span>
                    <span className="val" style={{ fontSize: "12px", fontWeight: "900" }}>{formatCurrency(balanceDue, inv.currency, false, false, inv.customCurrencySymbol)}</span>
                  </div>
                </div>
              </div>
              {/* Amount in Words */}
              <div style={{ marginTop: "8px", padding: "7px 12px", background: "#f8fafc", border: "1px dashed #CBD5E1", borderRadius: "6px" }}>
                <span style={{ fontSize: "9px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px" }}>Amount in Words: </span>
                <span style={{ fontSize: "9px", fontWeight: "800", color: "#0f1c2e" }}>{inv.currency === 'INR' ? 'INR ' : (inv.currency || 'INR') + ' '}{numberToWords(Math.round(balanceDue))}</span>
              </div>

              {/* BANK DETAILS */}
              {(inv.bankName || inv.accountNumber || inv.ifscCode || inv.upiId) && (
                <div className="inv-bank" style={{ marginTop: "12px", padding: "8px 10px", background: currentT.primaryBg, borderRadius: "6px", borderLeft: `3px solid ${currentT.primaryColor}` }}>
                  <div className="inv-bank-title" style={{ fontSize: "9px", fontWeight: "700", color: currentT.primaryColor, marginBottom: "3px" }}>Payment Details</div>
                  <div className="inv-bank-detail" style={{ fontSize: "9px", color: "#0f1c2e", lineHeight: "1.5" }}>
                    {inv.bankName && <span>Bank: {inv.bankName} &nbsp;|&nbsp; </span>}
                    {inv.accountNumber && <span>A/C: {inv.accountNumber} &nbsp;|&nbsp; </span>}
                    {inv.ifscCode && <span>IFSC: {inv.ifscCode}</span>}
                    {inv.upiId && <div style={{ marginTop: "2px" }}>UPI: {inv.upiId}</div>}
                  </div>
                </div>
              )}

              {/* FOOTER */}
              {/* FOOTER */}
              <div className="inv-footer" style={{ marginTop: "16px", paddingTop: "10px", borderTop: "1px solid var(--app-border)", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div className="inv-notes" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  {inv.notes && (
                    <div>
                      <div className="inv-notes-title" style={{ fontSize: "11px", fontWeight: "700", color: currentT.primaryColor, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: "2px" }}>Notes</div>
                      <div className="inv-notes-text" style={{ fontSize: "11px", color: "#64748b", lineHeight: "1.5" }}>{inv.terms}</div>
                    </div>
                  )}
                  {inv.terms && (
                    <div>
                      <div className="inv-notes-title" style={{ fontSize: "11px", fontWeight: "700", color: currentT.primaryColor, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: "2px" }}>Terms & Conditions</div>
                      <div className="inv-notes-text" style={{ fontSize: "11px", color: "#64748b", lineHeight: "1.5" }}>{inv.terms}</div>
                    </div>
                  )}
                </div>
                <div className="inv-sig" style={{ textAlign: "right", minWidth: "120px" }}>
                  <div style={{ height: "35px", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", marginBottom: "3px" }}>
                    {inv.signature ? (
                      inv.signatureType === "image" ? (
                        <img src={inv.signature} alt="Signature" style={{ maxHeight: "30px", maxWidth: "120px", objectFit: "contain" }} />
                      ) : (
                        <div style={{ fontFamily: "'Dancing Script', cursive", fontSize: "16px", fontWeight: "bold", color: "#1a2e35" }}>{inv.signature}</div>
                      )
                    ) : null}
                  </div>
                  <div className="inv-sig-line" style={{ width: "100%", height: "1px", background: "var(--app-border)", marginBottom: "3px" }}></div>
                  <div className="inv-sig-name" style={{ fontSize: "9px", fontWeight: "700", color: "#0f1c2e" }}>{inv.companyName || effectiveCompanyName}</div>
                  <div className="inv-sig-role" style={{ fontSize: "8px", color: "#64748b" }}>Authorized Signatory</div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
      {/* Bottom save buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
        <button onClick={handleSaveDraft} disabled={!!saving}
          style={{ padding: "13px", background: draftSaved ? "#22c55e" : "#fff", border: `1.5px solid ${draftSaved ? "#22c55e" : "#e5e7eb"}`, borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", color: draftSaved ? "#fff" : "#374151", fontFamily: "inherit", transition: "all 0.3s" }}>
          {saving === "draft" ? "Saving…" : draftSaved ? "Success Saved as Draft!" : " Save Draft"}
        </button>

        {editingId && (
          <>
            <button onClick={() => shareInvoice({ id: editingId, invoiceNo: inv.invoiceNo, total: total })} style={{ padding: "13px 18px", background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#2563eb", fontFamily: "inherit" }} title="Share Link"> Share</button>

          </>
        )}

        <button onClick={handleSavePreview} disabled={!!saving}
          style={{ padding: "13px", background: saving === "preview" ? "#9ca3af" : "linear-gradient(135deg,var(--app-accent),var(--app-accent))", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: saving ? "not-allowed" : "pointer", color: "#fff", fontFamily: "inherit" }}>
          {saving === "preview" ? "Saving…" : "Preview & Print "}
        </button>
      </div>
    </div>
  );
}


