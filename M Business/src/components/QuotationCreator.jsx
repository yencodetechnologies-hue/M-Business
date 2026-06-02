import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { BASE_URL, FRONTEND_URL } from "../config";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import axios from "axios";

const GST_RATES = [0, 5, 12, 18, 28];
const DEFAULT_LOGO_URL = "";

function generateQuoteNo() {
  return `QT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}
function formatCurrency(val, symbol = "₹", compact = false, disableCompact = false) {
  const num = parseFloat(val) || 0;
  const absNum = Math.abs(num);
  
  if (!disableCompact && ((compact && absNum >= 100000) || absNum >= 10000000)) {
    try {
      const isINR = symbol === "₹";
      const formatter = new Intl.NumberFormat(isINR ? 'en-IN' : 'en-US', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 2
      });
      return symbol + (/[A-Za-z]/.test(symbol) ? " " : "") + formatter.format(num);
    } catch (e) {
      // Fallback
    }
  }
  
  const isINR = symbol === "₹";
  return symbol + (/[A-Za-z]/.test(symbol) ? " " : "") + num.toLocaleString(isINR ? "en-IN" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function formatDateTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }) {
  const map = {
    draft: { bg: "var(--app-surface)", color: "var(--app-muted)", label: "📝 Draft" },
    sent: { bg: "#eff6ff", color: "#2563eb", label: "📤 Sent" },
    approved: { bg: "#dcfce7", color: "#16a34a", label: "✅ Approved" },
    rejected: { bg: "#fee2e2", color: "#dc2626", label: "❌ Rejected" },
    expired: { bg: "#fef3c7", color: "#d97706", label: "⏰ Expired" },
    converted: { bg: "#e0e7ff", color: "#4338ca", label: "📄 Invoiced" },
  };
  const s = map[(status || "draft").toLowerCase()] || map.draft;
  return <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{s.label}</span>;
}

const LOCAL_KEY = "quotation_drafts";
function loadLocal() {
  try { const d = localStorage.getItem(LOCAL_KEY); return d ? JSON.parse(d) : []; } catch { return []; }
}
function saveLocal(qt, items) {
  const all = loadLocal();
  const id = qt.quoteNo;
  const idx = all.findIndex((d) => d.id === id);
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseFloat(i.quantity) || 0), 0);
  const total = subtotal * (1 + (qt.gstRate || 0) / 100);
  const entry = { id, quoteNo: qt.quoteNo, client: qt.client || "—", total, savedAt: Date.now(), qt, items, status: "draft" };
  if (idx >= 0) all[idx] = entry; else all.unshift(entry);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(all.slice(0, 30)));
}

const T = { primary: "var(--app-sidebar)", sidebar: "var(--app-text)", accent: "var(--app-accent)", bg: "var(--app-bg)", card: "var(--app-card)", text: "var(--app-text)", muted: "var(--app-muted)", border: "var(--app-border)" };

function CompanyDropdown({ clients, value, onChange, error, onAddCompany }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = clients.filter(c => (c.clientName || c.name || "").toLowerCase().includes(search.toLowerCase()) || (c.companyName || c.company || "").toLowerCase().includes(search.toLowerCase()));
  const selected = clients.find(c => (c.clientName || c.name) === value);
  return (
    <div style={{ position: "relative" }}>
      <div onClick={() => setOpen(!open)} style={{ width: "100%", border: `1.5px solid ${error ? "#EF4444" : open ? "var(--app-accent)" : "var(--app-border)"}`, borderRadius: 10, padding: "10px 36px 10px 14px", fontSize: 13, color: value ? T.text : "var(--app-muted)", background: "var(--app-bg)", cursor: "pointer", userSelect: "none", boxSizing: "border-box", position: "relative", minHeight: 42 }}>
        {value ? (<div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{value[0].toUpperCase()}</div><span>{value}</span>{selected?.companyName && <span style={{ fontSize: 11, color: "var(--app-muted)" }}>({selected.companyName})</span>}</div>) : "-- Select Company Name --"}
        <span style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, fontSize: 10, color: "var(--app-muted)", transition: "0.2s" }}>▼</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--app-card)", border: "1.5px solid var(--app-border)", borderRadius: 12, boxShadow: "var(--app-shadow)", zIndex: 999, overflow: "hidden" }}>
          <div style={{ padding: "10px 10px 6px" }}><div style={{ position: "relative" }}><span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12 }}>🔍</span><input autoFocus placeholder="Search company name..." value={search} onChange={e => setSearch(e.target.value)} onClick={e => e.stopPropagation()} style={{ width: "100%", padding: "7px 10px 7px 30px", border: "1.5px solid var(--app-border)", borderRadius: 8, fontSize: 12, background: "var(--app-bg)", color: "var(--app-text)", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} /></div></div>
          {onAddCompany && <div onClick={() => { setOpen(false); setSearch(""); onAddCompany(); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: "var(--app-surface)", borderBottom: "2px solid var(--app-border)" }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 17, fontWeight: 700, flexShrink: 0 }}>+</div><div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--app-accent)" }}>Add New Company Name</div></div></div>}
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filtered.length === 0 ? <div style={{ padding: 14, textAlign: "center", color: "var(--app-muted)", fontSize: 13 }}>No companies found</div>
              : filtered.map((c, i) => { const name = c.clientName || c.name || ""; const company = c.companyName || c.company || ""; const isSel = value === name; return (<div key={i} onClick={() => { onChange(name); setOpen(false); setSearch(""); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: isSel ? "var(--app-surface)" : "transparent", borderBottom: "1px solid var(--app-border)" }} onMouseEnter={e => e.currentTarget.style.background = "var(--app-surface)"} onMouseLeave={e => e.currentTarget.style.background = isSel ? "var(--app-surface)" : "transparent"}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>{name[0]?.toUpperCase() || "?"}</div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{name}</div>{company && <div style={{ fontSize: 11, color: "var(--app-muted)" }}>{company}</div>}</div>{isSel && <span style={{ fontSize: 14, color: "var(--app-accent)" }}>✓</span>}</div>); })}
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
    <div style={{ position: "relative" }}>
      <div onClick={() => { if (!disabled) setOpen(!open) }} style={{ width: "100%", border: `1.5px solid ${open ? "var(--app-accent)" : "var(--app-border)"}`, borderRadius: 10, padding: "10px 36px 10px 14px", fontSize: 13, color: value ? T.text : "var(--app-muted)", background: "var(--app-bg)", cursor: disabled ? "not-allowed" : "pointer", userSelect: "none", boxSizing: "border-box", position: "relative", minHeight: 42, opacity: disabled ? 0.5 : 1 }}>
        {value ? (<div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-muted))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{value[0].toUpperCase()}</div><span>{value}</span></div>) : "-- Select Project --"}
        <span style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, fontSize: 10, color: "var(--app-muted)", transition: "0.2s" }}>▼</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--app-card)", border: "1.5px solid var(--app-border)", borderRadius: 12, boxShadow: "var(--app-shadow)", zIndex: 999, overflow: "hidden" }}>
          <div style={{ padding: "10px 10px 6px" }}><div style={{ position: "relative" }}><span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12 }}>🔍</span><input autoFocus placeholder="Search project..." value={search} onChange={e => setSearch(e.target.value)} onClick={e => e.stopPropagation()} style={{ width: "100%", padding: "7px 10px 7px 30px", border: "1.5px solid var(--app-border)", borderRadius: 8, fontSize: 12, background: "var(--app-bg)", color: "var(--app-text)", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} /></div></div>
          {onAddProject && <div onClick={() => { setOpen(false); setSearch(""); onAddProject(); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: "var(--app-surface)", borderBottom: "2px solid var(--app-border)" }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-muted))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 17, fontWeight: 700, flexShrink: 0 }}>+</div><div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--app-accent)" }}>Add New Project</div></div></div>}
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filtered.length === 0 ? <div style={{ padding: 14, textAlign: "center", color: "var(--app-muted)", fontSize: 13 }}>No projects found</div>
              : filtered.map((p, i) => { const name = p.name || ""; const isSel = value === name; return (<div key={i} onClick={() => { onChange(name); setOpen(false); setSearch(""); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: isSel ? "var(--app-surface)" : "transparent", borderBottom: "1px solid var(--app-border)" }} onMouseEnter={e => e.currentTarget.style.background = "var(--app-surface)"} onMouseLeave={e => e.currentTarget.style.background = isSel ? "var(--app-surface)" : "transparent"}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-muted))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>{name[0]?.toUpperCase() || "?"}</div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{name}</div></div>{isSel && <span style={{ fontSize: 14, color: "var(--app-accent)" }}>✓</span>}</div>); })}
          </div>
        </div>
      )}
      {open && <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={() => { setOpen(false); setSearch(""); }} />}
    </div>
  );
}

export default function QuotationCreator({ user, clients = [], projects = [], companyLogo, companyName, onLogoChange, onConvertToInvoice, onAddClient, onAddProject }) {
  const effectiveLogo = companyLogo || DEFAULT_LOGO_URL;
  const effectiveCompanyName = companyName || user?.companyName || "M Business";
  const [step, setStep] = useState("list");

  const iframeRef = useRef(null);

  useEffect(() => {
    const handleMsg = (e) => {
      if (e.data?.type === 'SAVE_DOCUMENT' && e.data?.payload?.docType === 'quo') {
        const payload = e.data.payload;
        const newDoc = {
          id: Date.now(),
          invoiceNo: payload.invoiceNo || `QUO-${Date.now()}`,
          quotationNo: payload.invoiceNo || `QUO-${Date.now()}`,
          proposalNo: payload.invoiceNo || `QUO-${Date.now()}`,
          client: payload.client || 'Unknown Client',
          date: payload.date || new Date().toISOString().split('T')[0],
          dueDate: payload.dueDate || new Date().toISOString().split('T')[0],
          status: 'draft',
          amount: payload.amount || 0,
          total: payload.amount || 0,
          currency: 'INR',
          htmlContent: payload.htmlContent,
          type: 'quotation',
          title: payload.client + ' - Quotation'
        };
        setQuotations(prev => [newDoc, ...prev]);
        setStep("list");
        if(typeof showToast === 'function') showToast("Quotation saved successfully!");
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  const sendThemeToIframe = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const color = getComputedStyle(document.documentElement).getPropertyValue('--app-accent').trim() || '#00BCD4';
      iframeRef.current.contentWindow.postMessage({ type: 'SET_THEME', color }, '*');
    }
  };
  const [qtList, setQtList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const [convertingId, setConvertingId] = useState(null);
  const [listSearch, setListSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [viewEntry, setViewEntry] = useState(null);

  const today = new Date().toISOString().split("T")[0];
  const expDefault = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const blank = {
    quoteNo: generateQuoteNo(), refNo: "", date: today, expiryDate: expDefault,
    client: "", project: "", gstRate: 18, notes: "",
    terms: "This quotation is valid for 30 days from the date of issue.",
    companyName: companyName || user?.companyName || "M Business", companyEmail: "",
    companyPhone: "", companyAddress: "",
    currency: "₹",
    template: "Modern",
    footerMessage: "🙏 Thank you for considering us!",
    isGstIncluded: false,
    amountPaid: 0,
    paymentDate: today,
    paymentMode: "GPay",
    transactionId: "",
    upiId: user?.upiId || "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    ifscCode: "",
  };

  const [qt, setQt] = useState(blank);
  const [items, setItems] = useState([{ id: 1, description: "", quantity: 1, rate: "" }]);

  const upd = (f, v) => setQt((p) => ({ ...p, [f]: v }));
  const selectedClient = clients.find((c) => (c.clientName || c.name) === qt.client);
  const filteredProjects = projects.filter((p) => !qt.client || p.client === qt.client || p.clientName === qt.client || p.clientId === selectedClient?._id);

  const subtotalRaw = items.reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseFloat(i.quantity) || 0), 0);
  let subtotal, gstAmt, total;

  if (qt.isGstIncluded) {
    total = subtotalRaw;
    subtotal = total / (1 + (parseFloat(qt.gstRate) || 0) / 100);
    gstAmt = total - subtotal;
  } else {
    subtotal = subtotalRaw;
    gstAmt = subtotal * ((parseFloat(qt.gstRate) || 0) / 100);
    total = subtotal + gstAmt;
  }

  const amountPaid = parseFloat(qt.amountPaid) || 0;
  const balanceDue = total - amountPaid;

  const fetchList = async () => {
    setListLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/quotations`);
      if (response.data.success && Array.isArray(response.data.quotations)) setQtList(response.data.quotations);
      else setQtList(loadLocal());
    } catch (error) {
      console.error('Fetch quotations error:', error);
      setQtList(loadLocal());
    }
    finally { setListLoading(false); }
  };

  useEffect(() => { fetchList(); }, []);
  useEffect(() => { if (step === "list") fetchList(); }, [step]);

  const addItem = () => setItems((p) => [...p, { id: Date.now(), description: "", quantity: 1, rate: "" }]);
  const removeItem = (id) => { if (items.length > 1) setItems((p) => p.filter((i) => i.id !== id)); };
  const updItem = (id, f, v) => {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, [f]: v } : i)));
    setErrors((prev) => { const n = { ...prev }; delete n[`item_${id}_${f}`]; return n; });
  };

  const validate = () => {
    const errs = {};
    if (!qt.client) errs.client = "Company Name is required";
    items.forEach((item) => {
      if (!item.description.trim()) errs[`item_${item.id}_description`] = true;
      if (!item.rate || parseFloat(item.rate) <= 0) errs[`item_${item.id}_rate`] = true;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    setSaving("draft");
    try {
      const response = await axios.post(`${BASE_URL}/api/quotations`, { qt, items, status: "draft" });
      console.log('Quotation saved successfully:', response.data);
    } catch (error) {
      console.error('Save quotation error:', error);
    }
    saveLocal(qt, items);
    setSaving(false);
    setDraftSaved(true);
    setTimeout(() => {
      setDraftSaved(false);
      setStep("list");
    }, 1000);
  };

  const handleSavePreview = async () => {
    if (!validate()) return;
    setSaving("preview");
    try {
      const response = await axios.post(`${BASE_URL}/api/quotations`, { qt, items, status: "draft" });
      console.log('Quotation saved for preview:', response.data);
    } catch (error) {
      console.error('Save quotation preview error:', error);
    }
    saveLocal(qt, items);
    setSaving(false);
    setStep("preview");
  };

  const triggerPDFShare = async (entry, type, force = false) => {
    if (step !== "preview" && !force) {
      loadEntry(entry);
      setTimeout(() => {
        setStep("preview");
        setTimeout(() => triggerPDFShare(entry, type, true), 1000);
      }, 0);
      return;
    }
    const element = document.querySelector(".qt-paper");
    if (!element) return;
    
    showToast("⏳ Generating PDF...");

    // Helper: resolve CSS variables so html2canvas captures correct colours on all OS/browsers
    const resolveCssVars = (el) => {
      const computed = getComputedStyle(document.documentElement);
      const walk = (node) => {
        if (node.nodeType === 1) {
          const st = node.getAttribute('style') || '';
          if (st.includes('var(')) {
            node.setAttribute('style', st.replace(/var\(([^)]+)\)/g, (_, n) =>
              computed.getPropertyValue(n.trim()).trim() || ''));
          }
          Array.from(node.children).forEach(walk);
        }
      };
      walk(el);
    };

    try {
      // Capture full element including footer
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
          const el = doc.querySelector('.qt-paper');
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

      // Always fit image onto exactly one A4 page
      const A4_W = 210;
      const A4_H = 297;
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });

      // Calculate dimensions that fit within A4 maintaining aspect ratio
      const imgAspect = canvas.width / canvas.height;
      let finalW = A4_W;
      let finalH = A4_W / imgAspect;

      // If still taller than A4, scale down by height
      if (finalH > A4_H) {
        finalH = A4_H;
        finalW = A4_H * imgAspect;
      }

      // Center on the page
      const xOff = (A4_W - finalW) / 2;
      const yOff = (A4_H - finalH) / 2;

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', xOff, yOff, finalW, finalH);
      // Safety net: delete any extra pages
      while (pdf.internal.getNumberOfPages() > 1) {
        pdf.deletePage(pdf.internal.getNumberOfPages());
      }

      const blob = pdf.output('blob');
      const file = new File([blob], `Quotation_${entry.quoteNo}.pdf`, { type: 'application/pdf' });
      const qtData = entry.qt || qt;
      const text = `*${qtData.companyName || "Your Business"}*\n\nQuotation: ${entry.quoteNo}\nTotal: ${formatCurrency(entry.total || total, qtData.currency)}`;
      
      if (type === "wa") {
         if (navigator.canShare && navigator.canShare({ files: [file] })) {
             await navigator.share({ title: `Quotation ${entry.quoteNo}`, text, files: [file] });
         } else {
             const url = URL.createObjectURL(blob);
             const a = document.createElement("a");
             a.href = url; a.download = file.name; a.click(); URL.revokeObjectURL(url);
             showToast("PDF downloaded! Attach it in WhatsApp.");
             window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
         }
      } else {
         if (navigator.canShare && navigator.canShare({ files: [file] })) {
             await navigator.share({ title: `Quotation ${entry.quoteNo}`, text, files: [file] });
         } else {
             const url = URL.createObjectURL(blob);
             const a = document.createElement("a");
             a.href = url; a.download = file.name; a.click(); URL.revokeObjectURL(url);
             showToast("PDF downloaded!");
         }
      }
    } catch (err) {
      console.log(err);
      alert("❌ Failed to generate PDF");
    }
  };

  const shareQuotation = (entry) => triggerPDFShare(entry, "link");
  const shareWhatsApp = (entry) => triggerPDFShare(entry, "wa");

  const loadEntry = (entry) => {
    setQt(entry.qt || blank);
    setItems(entry.items || [{ id: 1, description: "", quantity: 1, rate: "" }]);
    setErrors({});
    setStep("form");
  };

  const clearForm = () => {
    setQt({ ...blank, quoteNo: generateQuoteNo() });
    setItems([{ id: 1, description: "", quantity: 1, rate: "" }]);
    setErrors({});
  };

  const handleConvert = async (entry) => {
    if (!window.confirm(`Convert "${entry.quoteNo}" to Invoice?`)) return;
    setConvertingId(entry.id);
    try {
      const response = await axios.post(`${BASE_URL}/api/quotations/${entry.id}/convert`);
      if (response.data.success) {
        alert(`✅ Invoice ${response.data.invoiceNo} created!`);
        fetchList();
        if (onConvertToInvoice) onConvertToInvoice(response.data.invoice);
      } else alert("Convert failed: " + response.data.msg);
    } catch (error) {
      console.error('Convert quotation error:', error);
      alert("Backend offline — conversion failed.");
    }
    setConvertingId(null);
  };

  const handleStatusChange = async (entry, newStatus) => {
    try {
      await axios.patch(`${BASE_URL}/api/quotations/${entry.id}/status`, { status: newStatus });
      fetchList();
      if (newStatus === "approved") {
        const hasPaid = (entry.amountPaid || entry.qt?.amountPaid || 0) > 0;
        if (hasPaid) alert("✅ Quotation Approved & Advance Recorded in Accounts!");
        else alert("✅ Quotation Approved!");
      }
    } catch (error) {
      console.error('Status update error:', error);
      alert("Status update failed");
    }
  };

  const inp = (err) => ({
    width: "100%", border: `1.5px solid ${err ? "#ef4444" : "var(--app-border)"}`, borderRadius: 10,
    padding: "10px 12px", fontSize: 14, color: "var(--app-text)", background: err ? "#fff5f5" : "var(--app-surface)",
    boxSizing: "border-box", outline: "none", fontFamily: "inherit", transition: "all 0.2s",
  });
  const lbl = { display: "block", fontSize: 12, color: "var(--app-muted)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" };

  // ══════════ LIST ══════════
  if (step === "list") {
    const enriched = qtList.map((e) => {
      const expiry = e.qt?.expiryDate || e.expiryDate;
      let status = e.status || "draft";
      if (status === "sent" && expiry && new Date(expiry) < new Date()) status = "expired";
      return { ...e, status };
    });
    
    // Derived values
    const totalQuotes = enriched.length;
    const totalValue = enriched.reduce((s, e) => s + (parseFloat(e.qt?.total || e.total) || 0), 0);
    const wonList = enriched.filter(e => e.status === "approved" || e.status === "converted");
    const wonCount = wonList.length;
    const wonValue = wonList.reduce((s, e) => s + (parseFloat(e.qt?.total || e.total) || 0), 0);
    const pendingList = enriched.filter(e => e.status === "sent" || e.status === "pending");
    const pendingCount = pendingList.length;
    const pendingValue = pendingList.reduce((s, e) => s + (parseFloat(e.qt?.total || e.total) || 0), 0);
    
    const sentCount = pendingCount + wonCount + enriched.filter(e => e.status === "rejected").length;
    const winRate = sentCount > 0 ? Math.round((wonCount / sentCount) * 100) : 0;
    
    // Funnel stats
    const rejectedCount = enriched.filter(e => e.status === "rejected").length;
    const draftedCount = enriched.filter(e => e.status === "draft").length;

    // Filter
    const filtered = enriched.filter(e => {
      if (activeTab !== "All" && e.status.toLowerCase() !== activeTab.toLowerCase() && !(activeTab === "Accepted" && (e.status === "converted" || e.status === "approved"))) return false;
      if (!listSearch) return true;
      const term = listSearch.toLowerCase();
      return (e.quoteNo || "").toLowerCase().includes(term) ||
             (e.client || "").toLowerCase().includes(term) ||
             (e.qt?.project || e.project || "").toLowerCase().includes(term);
    });

    const getStatusTheme = (st) => {
      switch(st) {
        case "approved": case "converted": return "c-green";
        case "sent": return "c-blue";
        case "pending": return "c-amber";
        case "rejected": return "c-red";
        default: return "c-purple"; // draft
      }
    };
    
    const getBadge = (st) => {
      switch(st) {
        case "approved": return <span className="badge accepted">Accepted</span>;
        case "converted": return <span className="badge converted">Converted</span>;
        case "sent": return <span className="badge sent">Sent</span>;
        case "pending": return <span className="badge pending">Pending</span>;
        case "rejected": return <span className="badge rejected">Rejected</span>;
        default: return <span className="badge draft">Draft</span>;
      }
    };

    return (
      <div style={{ fontFamily: "var(--font, 'Nunito', sans-serif)", minHeight: "100%", background: "var(--bg, #F5FAFA)" }}>
        
        <div className="content">
          <div className="page-header">
            <div>
              <div className="page-title">Quotations</div>
              <div className="page-sub">Create, send and track client quotations</div>
            </div>
            <div className="header-actions">
              <div className="search-wrap" style={{ width: 250 }}>
                <i className="ti ti-search" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", fontSize: 16 }}></i>
                <input 
                  type="text" 
                  placeholder="Search quotations…" 
                  value={listSearch} 
                  onChange={e => setListSearch(e.target.value)} 
                  style={{ width: "100%", padding: "11px 14px 11px 40px", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 12, fontSize: 13, color: "var(--text)", fontFamily: "var(--font)", outline: "none", transition: "all .15s" }} 
                />
              </div>
              <button className="create-btn" onClick={() => { clearForm(); setStep("form"); }}>
                <i className="ti ti-plus" style={{ fontSize: 15 }}></i> New Quotation
              </button>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "var(--teal-light)", color: "var(--teal)" }}><i className="ti ti-file-text"></i></div>
              <div>
                <div className="stat-num">{totalQuotes}</div>
                <div className="stat-label">Total Quotes</div>
                <div className="stat-sub" style={{ color: "var(--teal)" }}>₹{totalValue.toLocaleString("en-IN")} value</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "var(--green-bg)", color: "var(--green)" }}><i className="ti ti-circle-check"></i></div>
              <div>
                <div className="stat-num">{wonCount}</div>
                <div className="stat-label">Accepted</div>
                <div className="stat-sub" style={{ color: "var(--green)" }}>₹{wonValue.toLocaleString("en-IN")} won</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}><i className="ti ti-clock"></i></div>
              <div>
                <div className="stat-num">{pendingCount}</div>
                <div className="stat-label">Pending</div>
                <div className="stat-sub" style={{ color: "var(--amber)" }}>₹{pendingValue.toLocaleString("en-IN")} pending</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: "var(--purple-bg)", color: "var(--purple)" }}><i className="ti ti-percentage"></i></div>
              <div>
                <div className="stat-num">{winRate}%</div>
                <div className="stat-label">Win Rate</div>
                <div className="stat-sub" style={{ color: "var(--purple)" }}>{wonCount} of {sentCount} sent</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div className="tabs">
              {["All", "Draft", "Sent", "Accepted", "Rejected"].map(t => (
                <button key={t} className={`tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>{t}</button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "var(--text3)", fontWeight: 600 }}>
              {filtered.length} quotations · ₹{filtered.reduce((s, e) => s + (parseFloat(e.qt?.total || e.total) || 0), 0).toLocaleString("en-IN")} total value
            </div>
          </div>

          <div className="quotes-grid">
            {filtered.map(entry => {
              const qtD = entry.qt || {};
              const t = parseFloat(qtD.total || entry.total || 0).toLocaleString("en-IN");
              const init = (entry.client || "U").substring(0,2).toUpperCase();
              
              return (
                <div key={entry.id || entry.quoteNo} className={`quote-card ${getStatusTheme(entry.status)}`} onClick={() => setViewEntry(entry)}>
                  <div className="qc-top">
                    <span className="qc-id">#{entry.quoteNo || "QT-XXXX"}</span>
                    <select 
                      value={entry.status} 
                      onChange={(e) => { e.stopPropagation(); handleStatusChange(entry, e.target.value); }}
                      style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: "2px 6px", fontSize: 10, fontWeight: 700, color: "#374151", background: "#fff", cursor: "pointer", outline: "none", marginLeft: "auto" }}
                      onClick={e => e.stopPropagation()}
                    >
                      {["draft", "sent", "pending", "approved", "rejected", "expired", "converted"].map(s => (
                        <option key={s} value={s}>{s === "converted" ? "Invoiced" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="qc-title">{qtD.project || entry.project || "Untitled Project"}</div>
                  <div className="qc-client">
                    <div className="qc-av" style={{ background: "linear-gradient(135deg,var(--teal),#006E7F)" }}>{init}</div>
                    <span className="qc-client-name">{entry.client || "Unknown Client"}</span>
                  </div>
                  <div className="qc-items">
                    {Array.isArray(entry.items) && entry.items.slice(0, 3).map((it, i) => (
                      <div className="qc-item-row" key={i}>
                        <span className="qc-item-name">{it.d || it.description}</span>
                        <span className="qc-item-price">₹{parseFloat((it.r || it.rate || 0) * (it.q || it.quantity || 1)).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                    {Array.isArray(entry.items) && entry.items.length > 3 && (
                      <div className="qc-item-row"><span className="qc-item-name" style={{ fontStyle: "italic" }}>+ {entry.items.length - 3} more items</span></div>
                    )}
                    <hr className="qc-divider" />
                    <div className="qc-total">
                      <span>Total</span>
                      <span className="qc-total-amount">₹{t}</span>
                    </div>
                  </div>
                  <div className="qc-footer">
                    <div className="qc-date"><i className="ti ti-calendar" style={{ fontSize: 11 }}></i> {entry.status === "draft" ? "Draft · " : "Sent "}{formatDate(qtD.date || entry.date)}</div>
                    {getBadge(entry.status)}
                  </div>
                  <div className="qc-actions" onClick={e => e.stopPropagation()}>
                    <button className="qa-btn" onClick={() => loadEntry(entry)}><i className="ti ti-edit" style={{ fontSize: 13 }}></i> Edit</button>
                    <button className="qa-btn" onClick={() => triggerPDFShare(entry, "print")}><i className="ti ti-download" style={{ fontSize: 13 }}></i> PDF</button>
                    {(entry.status === "approved" || entry.status === "converted") ? (
                      <button className="qa-btn primary" style={entry.status === "converted" ? { background: "var(--surface)", color: "var(--teal)", borderColor: "var(--teal)" } : {}} onClick={() => entry.status !== "converted" && handleConvert(entry)} disabled={entry.status === "converted" || convertingId === entry.id}>
                        {entry.status === "converted" ? <><i className="ti ti-circle-check" style={{ fontSize: 13 }}></i> Done</> : <><i className="ti ti-receipt" style={{ fontSize: 13 }}></i> Invoice</>}
                      </button>
                    ) : (
                      <button className="qa-btn primary" onClick={() => shareQuotation(entry)}><i className="ti ti-send" style={{ fontSize: 13 }}></i> Send</button>
                    )}
                  </div>
                </div>
              );
            })}
            
            <div className="add-quote-card" onClick={() => { clearForm(); setStep("form"); }}>
              <div className="add-icon"><i className="ti ti-plus"></i></div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--teal)" }}>Create New Quotation</div>
              <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, textAlign: "center", maxWidth: 140 }}>Build and send professional quotes to clients</div>
            </div>
          </div>

          <div className="bottom-row">
            <div className="funnel-panel">
              <div className="fp-title">Quotation Pipeline</div>
              <div className="fp-sub">How quotes move through your sales funnel</div>
              <div className="funnel-steps">
                <div className="funnel-step">
                  <span className="fs-label">Created</span>
                  <div className="fs-bar-wrap">
                    <div className="fs-bar" style={{ width: "100%", background: "var(--teal)" }}>{totalQuotes} quotes</div>
                  </div>
                  <span className="fs-count">{totalQuotes}</span>
                  <span className="fs-pct">100%</span>
                </div>
                <div className="funnel-step">
                  <span className="fs-label">Sent</span>
                  <div className="fs-bar-wrap">
                    <div className="fs-bar" style={{ width: `${totalQuotes > 0 ? (sentCount/totalQuotes)*100 : 0}%`, background: "var(--blue)" }}>{sentCount > 0 ? `${sentCount} sent` : ""}</div>
                  </div>
                  <span className="fs-count">{sentCount}</span>
                  <span className="fs-pct">{totalQuotes > 0 ? Math.round((sentCount/totalQuotes)*100) : 0}%</span>
                </div>
                <div className="funnel-step">
                  <span className="fs-label">Accepted</span>
                  <div className="fs-bar-wrap">
                    <div className="fs-bar" style={{ width: `${totalQuotes > 0 ? (wonCount/totalQuotes)*100 : 0}%`, background: "var(--green)" }}>{wonCount > 0 ? `${wonCount} won` : ""}</div>
                  </div>
                  <span className="fs-count">{wonCount}</span>
                  <span className="fs-pct">{totalQuotes > 0 ? Math.round((wonCount/totalQuotes)*100) : 0}%</span>
                </div>
                <div className="funnel-step">
                  <span className="fs-label">Rejected</span>
                  <div className="fs-bar-wrap">
                    <div className="fs-bar" style={{ width: `${totalQuotes > 0 ? (rejectedCount/totalQuotes)*100 : 0}%`, background: "var(--red)" }}></div>
                  </div>
                  <span className="fs-count">{rejectedCount}</span>
                  <span className="fs-pct">{totalQuotes > 0 ? Math.round((rejectedCount/totalQuotes)*100) : 0}%</span>
                </div>
              </div>
            </div>

            <div className="activity-panel">
              <div className="ap-title">Recent Activity</div>
              <div className="activity-list">
                {enriched.slice(0, 5).map((e, idx, arr) => (
                  <div className="act-item" key={e.id || idx}>
                    <div className="act-dot-col">
                      <div className="act-dot" style={{ background: e.status === "approved" || e.status === "converted" ? "var(--green)" : e.status === "sent" ? "var(--blue)" : e.status === "rejected" ? "var(--red)" : "var(--purple)" }}></div>
                      {idx !== arr.length - 1 && <div className="act-line"></div>}
                    </div>
                    <div>
                      <div className="act-text">{e.quoteNo || "QT-XXXX"} <strong>{e.status}</strong> {e.client ? `for ${e.client}` : ""}</div>
                      <div className="act-meta">₹{parseFloat(e.qt?.total || e.total || 0).toLocaleString("en-IN")} · {formatDate(e.qt?.date || e.date)}</div>
                    </div>
                  </div>
                ))}
                {enriched.length === 0 && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 10 }}>No activity found.</div>}
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }
  // ══════════ PREVIEW ══════════
  if (step === "preview") {
    const slimPayload = {
      no: qt.quoteNo, date: qt.date, exp: qt.expiryDate,
      co: qt.companyName, email: qt.companyEmail, phone: qt.companyPhone, addr: qt.companyAddress,
      cl: qt.client, proj: qt.project, gst: qt.gstRate, notes: qt.notes, terms: qt.terms,
      incGst: qt.isGstIncluded,
      paid: qt.amountPaid,
      upi: qt.upiId,
      cur: qt.currency,
      items: items.map((i) => ({ d: i.description, q: i.quantity, r: i.rate })),
      cid: user?.companyId || user?.company || user?._id || "",
    };
    const qrData = `${FRONTEND_URL}/quotation-view?d=${encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(slimPayload)))))}`;

    return (
      <div className="print-wrapper" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#ecfdf5", minHeight: "100vh", padding: "20px 12px" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
          * { box-sizing: border-box; }
          .qt-paper { position: relative; max-width: 794px; margin: 0 auto; background: #fff; border-radius: 18px; box-shadow: 0 24px 80px rgba(5,150,105,0.15); display: flex; flex-direction: column; min-height: 1122px; }
          @media print {
            @page { size: A4 portrait; margin: 0; }
            html, body { margin: 0 !important; padding: 0 !important; height: auto !important; min-height: 0 !important; overflow: visible !important; background: white !important; }
            .no-print, .no-print * { display: none !important; }
            .print-wrapper { background: white !important; padding: 0 !important; min-height: 0 !important; display: block !important; }
            .qt-paper { 
              position: relative !important; top: auto !important; left: auto !important; 
              width: 100% !important; max-width: 100% !important; margin: 0 !important; 
              border-radius: 0 !important; box-shadow: none !important; 
              overflow: visible !important; min-height: 0 !important; height: auto !important;
            }
            .flex-spacer { display: none !important; }
            body > div { height: auto !important; min-height: 0 !important; padding: 0 !important; margin: 0 !important; }
          }
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }
          @media (max-width:600px) { .qt-hgrid { flex-direction:column!important; } .qt-btgrid { grid-template-columns:1fr!important; } }
        `}</style>

        <div className="no-print" style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
          <button onClick={() => setStep("form")} style={{ padding: "10px 18px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}>← Edit</button>
          <button onClick={() => setStep("list")} style={{ padding: "10px 18px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}>📋 List</button>
          <button onClick={() => shareQuotation({ id: qt.quoteNo, quoteNo: qt.quoteNo, total })} style={{ padding: "10px 18px", background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#2563eb", fontFamily: "inherit" }}>🔗 Share</button>
          <button onClick={() => shareWhatsApp({ id: qt.quoteNo, quoteNo: qt.quoteNo, total })} style={{ padding: "10px 18px", background: "#dcfce7", border: "1.5px solid #bbf7d0", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#16a34a", fontFamily: "inherit" }}>💬 WhatsApp</button>
          <button onClick={() => triggerPDFShare({ id: qt.quoteNo, quoteNo: qt.quoteNo, total }, "print")} style={{ padding: "10px 22px", background: "linear-gradient(135deg,var(--app-accent),var(--app-muted))", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>🖨️ Print / PDF</button>
        </div>

        <div className="qt-paper print-container">
          {/* Header */}
          <div className="avoid-break" style={{ background: "#f8fafc", padding: "28px 32px", position: "relative", overflow: "hidden", flexShrink: 0, borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,rgba(5,150,105,0.05),transparent)", top: -80, right: -40, pointerEvents: "none" }} />
            <div className="qt-hgrid" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1, gap: 20 }}>
              <div>
                {effectiveLogo ? (
                  <img src={effectiveLogo} alt="logo" style={{ height: 85, borderRadius: 10, marginBottom: 12, objectFit: "contain" }} />
                ) : (
                  <div style={{ height: 60, width: 60, background: "var(--app-accent)", borderRadius: 10, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: "#fff" }}>
                    {effectiveCompanyName[0] || "?"}
                  </div>
                )}
                <div style={{ fontSize: 24, fontWeight: 900, color: "#064e3b", textTransform: "uppercase", letterSpacing: 1 }}>{qt.companyName || effectiveCompanyName}</div>
                {qt.companyEmail && <div style={{ fontSize: 11, color: "#065f46", marginTop: 3 }}>{qt.companyEmail}</div>}
                {qt.companyPhone && <div style={{ fontSize: 11, color: "#065f46", marginTop: 2 }}>{qt.companyPhone}</div>}
                {qt.companyAddress && <div style={{ fontSize: 11, color: "#065f46", marginTop: 2 }}>{qt.companyAddress}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: "rgba(5,150,105,0.1)", letterSpacing: -2, lineHeight: 1, marginBottom: 4 }}>QUOTATION</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--app-accent)" }}>{qt.quoteNo}</div>
                {qt.refNo && <div style={{ fontSize: 11, color: "#065f46", marginTop: 3 }}>Ref # {qt.refNo}</div>}
                <div style={{ marginTop: 14, display: "flex", gap: 20, justifyContent: "flex-end" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>DATE</div>
                    <div style={{ fontSize: 12, color: "#064e3b", fontWeight: 700 }}>{formatDate(qt.date)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>VALID UNTIL</div>
                    <div style={{ fontSize: 12, color: "#ea580c", fontWeight: 700 }}>{formatDate(qt.expiryDate)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prepared for */}
          <div className="qt-btgrid avoid-break" style={{ display: "grid", gridTemplateColumns: qt.project ? "1fr 1fr" : "1fr", borderBottom: "2px solid #f0fdf4", flexShrink: 0 }}>
            <div style={{ padding: "20px 32px", borderRight: qt.project ? "1px solid #f0fdf4" : "none" }}>
              <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>PREPARED FOR</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>{qt.client || "—"}</div>
              {selectedClient?.companyName && <div style={{ fontSize: 13, color: "var(--app-accent)", fontWeight: 600, marginTop: 2 }}>{selectedClient.companyName}</div>}
              {selectedClient?.email && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 5 }}>📧 {selectedClient.email}</div>}
              {selectedClient?.phone && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>📱 {selectedClient.phone}</div>}
              {selectedClient?.gstNumber && <div style={{ fontSize: 12, color: "var(--app-accent)", marginTop: 4, fontWeight: 600 }}>💎 GST: {selectedClient.gstNumber}</div>}
            </div>
            {qt.project && (
              <div style={{ padding: "20px 32px" }}>
                <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>PROJECT</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{qt.project}</div>
              </div>
            )}
          </div>

          {/* Items */}
          <div style={{ padding: "22px 32px", overflowX: "auto", flexShrink: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 360 }}>
              <thead>
                <tr className="avoid-break" style={{ background: "linear-gradient(90deg,#f0fdf4,#f7fffe)" }}>
                  {["#", "Description", "Qty", "Unit Rate", "Amount"].map((h, i) => (
                    <th key={i} style={{ padding: "9px 11px", fontSize: 9, fontWeight: 700, color: "var(--app-accent)", letterSpacing: 1.5, borderBottom: "2px solid #d1fae5", textAlign: ["Amount", "Unit Rate", "Qty"].includes(h) ? "right" : "left" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className="avoid-break" style={{ borderBottom: "1px solid #f0fdf4" }}>
                    <td style={{ padding: "12px 11px", color: "#6ee7b7", fontWeight: 700, fontSize: 12 }}>{String(idx + 1).padStart(2, "0")}</td>
                    <td style={{ padding: "12px 11px", fontSize: 13, fontWeight: 600, color: "#111827" }}>{item.description || "—"}</td>
                    <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 13, color: "#374151" }}>{item.quantity}</td>
                    <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 13, color: "#374151" }}>{formatCurrency(item.rate, qt.currency)}</td>
                    <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "#111827" }}>{formatCurrency((parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0), qt.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="avoid-break" style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <div style={{ width: "min(280px,100%)" }}>
                {[
                  ["Subtotal", formatCurrency(subtotal, qt.currency)],
                  [`GST (${qt.gstRate}%)${qt.isGstIncluded ? " (Incl.)" : ""}`, formatCurrency(gstAmt, qt.currency)],
                  ["Total Amount", formatCurrency(total, qt.currency)],
                  ["Amount Paid", formatCurrency(amountPaid, qt.currency)]
                ].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0fdf4" }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{l}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", background: "#f8fafc", borderRadius: 12, marginTop: 8, border: "1.5px solid #e2e8f0" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#64748b" }}>BALANCE DUE</span>
                  <span style={{ fontSize: 19, fontWeight: 900, color: "#064e3b" }}>{formatCurrency(balanceDue, qt.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes + QR */}
          <div className="avoid-break" style={{ padding: "0 32px 24px", display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "flex-start", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {qt.notes && (
                <div style={{ background: "#f0fdf4", borderRadius: 11, padding: "14px 16px", border: "1px solid #d1fae5" }}>
                  <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>📝 NOTES</div>
                  <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7 }}>{qt.notes}</div>
                </div>
              )}
              {qt.terms && (
                <div style={{ background: "#f0fdf4", borderRadius: 11, padding: "14px 16px", border: "1px solid #d1fae5" }}>
                  <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>📜 TERMS</div>
                  <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7 }}>{qt.terms}</div>
                </div>
              )}
              {(qt.upiId || qt.bankName) && (
                <div style={{ background: "#f8fafc", borderRadius: 11, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>💳 PAYMENT INSTRUCTIONS</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
                    {qt.upiId && (
                      <div>
                        <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>UPI ID</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{qt.upiId}</div>
                      </div>
                    )}
                    {qt.bankName && (
                      <>
                        <div>
                          <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>BANK NAME</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{qt.bankName}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>ACCOUNT NAME</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{qt.accountName}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>ACCOUNT NUMBER</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", fontFamily: "monospace" }}>{qt.accountNumber}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>IFSC CODE</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", fontFamily: "monospace" }}>{qt.ifscCode}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#f0fdf4", borderRadius: 12, padding: "14px 16px", border: "1px solid #d1fae5", minWidth: 110 }}>
              <div style={{ fontSize: 8, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 8, textAlign: "center" }}>SCAN QUOTE</div>
              <div style={{ background: "#fff", padding: 6, borderRadius: 8, border: "1px solid #d1fae5" }}>
                <QRCodeSVG value={qrData} size={88} bgColor="#ffffff" fgColor="#064e3b" />
              </div>
              <div style={{ fontSize: 8, color: "#9ca3af", marginTop: 7, textAlign: "center", fontWeight: 600 }}>{qt.quoteNo}</div>
            </div>
          </div>

          <div className="flex-spacer" style={{ flex: 1 }} />

          {/* Footer */}
          <div style={{ background: "#ffffff", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, borderTop: "2px solid #f1f5f9", pageBreakBefore: "auto", breakBefore: "auto" }}>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{effectiveCompanyName}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>{qt.footerMessage}</div>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{qt.quoteNo}</div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════ FORM ══════════
  if (step === "template") {
    return (
      <div style={{ width: "100%", height: "80vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "10px 0", display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setStep("list")} style={{ padding: "8px 14px", background: "var(--app-bg)", border: "1.5px solid var(--app-border)", borderRadius: 8, cursor: "pointer", fontWeight: 700, color: "var(--app-muted)" }}>← Back to List</button>
        </div>
        <div style={{ flex: 1, overflow: "hidden", borderRadius: 16 }}>
          <iframe src="/template-designer.html#quo" ref={iframeRef} onLoad={sendThemeToIframe} style={{ width: "100%", height: "100%", border: "none" }} title="Template Designer" />
        </div>
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input:focus,select:focus,textarea:focus { border-color: var(--app-accent) !important; box-shadow: 0 0 0 3px rgba(5,150,105,0.1); }
        @keyframes shake { 0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)} }
        .shake { animation: shake 0.35s ease; }
        @media (max-width:600px) { .f2col { grid-template-columns:1fr!important; } .f3col { grid-template-columns:1fr 1fr!important; } }
        /* Hide Arrows in Number Inputs */
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* Top nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <button onClick={() => setStep("list")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--app-accent)", fontWeight: 700, padding: 0, fontFamily: "inherit" }}>← Back</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={clearForm} style={{ padding: "8px 14px", background: "#fff", border: "1.5px solid #f3f4f6", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#6b7280", fontFamily: "inherit" }}>Clear</button>
          <button onClick={handleSaveDraft} disabled={!!saving}
            style={{ padding: "8px 18px", background: draftSaved ? "#22c55e" : "#fff", border: `1.5px solid ${draftSaved ? "#22c55e" : "#e5e7eb"}`, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", color: draftSaved ? "#fff" : "#374151", fontFamily: "inherit", transition: "all 0.3s" }}>
            {saving === "draft" ? "Saving…" : draftSaved ? "✅ Saved!" : "💾 Save Draft"}
          </button>
          <button onClick={handleSavePreview} disabled={!!saving}
            style={{ padding: "8px 22px", background: saving === "preview" ? "#9ca3af" : "linear-gradient(135deg,var(--app-accent),var(--app-muted))", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", color: "#fff", fontFamily: "inherit" }}>
            {saving === "preview" ? "Saving…" : "Preview →"}
          </button>
        </div>
      </div>

      {hasErrors && (
        <div className="shake" style={{ background: "#fff5f5", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#b91c1c", fontWeight: 600 }}>
          ⚠️ Please fill all required fields before saving.
        </div>
      )}

      {/* Quote Details */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #f3f4f6", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 16 }}>Quotation Details</div>
        <div className="f3col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={lbl}>Quote Number</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input value={qt.quoteNo} onChange={(e) => upd("quoteNo", e.target.value)} style={{ ...inp(), flex: 1 }} />
              <button onClick={() => upd("quoteNo", generateQuoteNo())} style={{ padding: "0 10px", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 8, cursor: "pointer", fontSize: 14, color: "#6b7280" }}>↻</button>
            </div>
          </div>
          <div>
            <label style={lbl}>Quote Date</label>
            <input type="date" value={qt.date} onChange={(e) => upd("date", e.target.value)} style={inp()} />
          </div>
          <div>
            <label style={lbl}>Valid Until (Expiry)</label>
            <input type="date" value={qt.expiryDate} onChange={(e) => upd("expiryDate", e.target.value)} style={inp()} />
          </div>
          <div>
            <label style={lbl}>Reference No <span style={{ color: "#d1d5db" }}></span></label>
            <input value={qt.refNo} onChange={(e) => upd("refNo", e.target.value)} placeholder="REF-001" style={inp()} />
          </div>
          <div>
            <label style={lbl}>GST Rate</label>
            <select value={qt.gstRate} onChange={(e) => upd("gstRate", Number(e.target.value))} style={inp()}>
              {GST_RATES.map((r) => <option key={r} value={r}>{r === 0 ? "No GST (0%)" : `GST ${r}%`}</option>)}
            </select>
            <select value={qt.isGstIncluded ? "including" : "excluding"}
              onChange={(e) => upd("isGstIncluded", e.target.value === "including")}
              style={{ ...inp(), marginTop: 6, fontSize: 11, fontWeight: 700, color: "var(--app-accent)" }}>
              <option value="excluding">Excluding GST</option>
              <option value="including">Including GST</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Currency</label>
            <div style={{ display: "flex", gap: 8 }}>
              <select value={["₹", "$", "€", "£", "¥", "AED", "SAR", "QAR", "CAD", "AUD", "SGD", "KWD", "BHD", "OMR"].includes(qt.currency) ? qt.currency : "Custom"} onChange={(e) => upd("currency", e.target.value === "Custom" ? "" : e.target.value)} style={{ ...inp(), flex: 1 }}>
                <option value="₹">INR (₹)</option>
                <option value="$">USD ($)</option>
                <option value="€">EUR (€)</option>
                <option value="£">GBP (£)</option>
                <option value="¥">JPY (¥)</option>
                <option value="AED">AED (Dh)</option>
                <option value="SAR">SAR (SR)</option>
                <option value="QAR">QAR (QR)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="AUD">AUD (A$)</option>
                <option value="SGD">SGD (S$)</option>
                <option value="KWD">KWD (KD)</option>
                <option value="BHD">BHD (BD)</option>
                <option value="OMR">OMR (RO)</option>
                <option value="Custom">Custom...</option>
              </select>
              {!["₹", "$", "€", "£", "¥", "AED", "SAR", "QAR", "CAD", "AUD", "SGD", "KWD", "BHD", "OMR"].includes(qt.currency) && (
                <input value={qt.currency} onChange={(e) => upd("currency", e.target.value)} style={{ ...inp(), flex: 1 }} placeholder="e.g. AUD" />
              )}
            </div>
          </div>
          <div>
            <label style={lbl}>Template</label>
            <select value={qt.template} onChange={(e) => upd("template", e.target.value)} style={inp()}>
              <option value="Modern">Modern Purple</option>
              <option value="Classic">Classic Professional</option>
              <option value="Minimal">Minimalist</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #f3f4f6", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 16 }}>Payment & Advance Details</div>
        <div className="f3col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={lbl}>Amount Paid (Advance)</label>
            <input type="number"
              value={qt.amountPaid === 0 ? "" : qt.amountPaid}
              onChange={(e) => upd("amountPaid", e.target.value === "" ? 0 : Number(e.target.value))}
              onWheel={(e) => e.target.blur()}
              placeholder="0"
              style={inp()} />
          </div>
          <div>
            <label style={lbl}>Payment Date</label>
            <input type="date" value={qt.paymentDate} onChange={(e) => upd("paymentDate", e.target.value)} style={inp()} />
          </div>
          <div>
            <label style={lbl}>Payment Mode</label>
            <select value={qt.paymentMode} onChange={(e) => upd("paymentMode", e.target.value)} style={inp()}>
              <option value="GPay">GPay</option>
              <option value="PhonePe">PhonePe</option>
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={lbl}>Transaction ID / Ref</label>
          <input value={qt.transactionId} onChange={(e) => upd("transactionId", e.target.value)} placeholder="TXN123456" style={inp()} />
        </div>
      </div>

      {/* Company Name */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: errors.client ? "1.5px solid #fca5a5" : "1px solid #f3f4f6", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 16 }}>Company & Project</div>
        <div className="f2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ ...lbl, color: errors.client ? "#ef4444" : "#6b7280" }}>Company Name *</label>
            <CompanyDropdown clients={clients} value={qt.client}
              onChange={(val) => { upd("client", val); upd("project", ""); setErrors((p) => { const n = { ...p }; delete n.client; return n; }); }}
              error={errors.client} onAddCompany={onAddClient} />
            {errors.client && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontWeight: 600 }}>⚠ {errors.client}</div>}
          </div>
          <div>
            <label style={lbl}>Project <span style={{ color: "#d1d5db" }}></span></label>
            <ProjectDropdown projects={filteredProjects} value={qt.project}
              onChange={(val) => upd("project", val)}
              onAddProject={onAddProject}
              disabled={!qt.client} />
          </div>
        </div>
        {selectedClient && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[["📧", selectedClient.email], ["📱", selectedClient.phone], ["📍", selectedClient.address], ["💎", selectedClient.gstNumber]].filter(([, v]) => v).map(([icon, val], i) => (
              <span key={i} style={{ fontSize: 12, color: "#6b7280" }}>{icon} {val}</span>
            ))}
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #f3f4f6", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Items / Services</div>
          <button onClick={addItem} style={{ padding: "6px 14px", background: "linear-gradient(135deg,var(--app-accent),#10b981)", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>+ Add Item</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 36px", gap: 8, paddingBottom: 8, borderBottom: "1px solid #f3f4f6", marginBottom: 8 }}>
          {["Description", "Qty", `Rate (${qt.currency || "₹"})`, ""].map((h, i) => <div key={i} style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>{h}</div>)}
        </div>
        {items.map((item, idx) => {
          const dErr = errors[`item_${item.id}_description`];
          const rErr = errors[`item_${item.id}_rate`];
          return (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 36px", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <div>
                <input value={item.description} onChange={(e) => updItem(item.id, "description", e.target.value)} placeholder={`Item ${idx + 1} description`} style={{ ...inp(dErr), fontSize: 13 }} />
                {dErr && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>⚠ Required</div>}
              </div>
              <input type="number" min="1" value={item.quantity} onChange={(e) => updItem(item.id, "quantity", e.target.value)} onWheel={(e) => e.target.blur()} style={{ ...inp(), textAlign: "center", fontSize: 13 }} />
              <div>
                <input type="number" min="0" value={item.rate} onChange={(e) => updItem(item.id, "rate", e.target.value)} onWheel={(e) => e.target.blur()} placeholder="0.00" style={{ ...inp(rErr), textAlign: "right", fontSize: 13 }} />
                {rErr && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>⚠ Required</div>}
              </div>
              <button onClick={() => removeItem(item.id)} disabled={items.length === 1}
                style={{ width: 32, height: 42, borderRadius: 8, background: items.length === 1 ? "#f9fafb" : "#fee2e2", border: "none", cursor: items.length === 1 ? "not-allowed" : "pointer", fontSize: 13, color: items.length === 1 ? "#d1d5db" : "#ef4444" }}>✕</button>
            </div>
          );
        })}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <div style={{ minWidth: 220 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Subtotal</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(subtotal, qt.currency)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>GST ({qt.gstRate}%){qt.isGstIncluded ? " (Incl.)" : ""}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(gstAmt, qt.currency)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "linear-gradient(135deg,#064e3b,var(--app-accent))", borderRadius: 10, marginTop: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#d1fae5" }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>{formatCurrency(total, qt.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes & Terms */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #f3f4f6", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 16 }}>Notes & Terms <span style={{ color: "#d1d5db", fontWeight: 500 }}></span></div>
        <div className="f2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={lbl}>Notes</label>
            <textarea value={qt.notes} onChange={(e) => upd("notes", e.target.value)} placeholder="Additional notes…" rows={3} style={{ ...inp(), resize: "vertical", lineHeight: 1.6 }} />
          </div>
          <div>
            <label style={lbl}>Terms & Conditions</label>
            <textarea value={qt.terms} onChange={(e) => upd("terms", e.target.value)} rows={3} style={{ ...inp(), resize: "vertical", lineHeight: 1.6 }} />
          </div>
        </div>
      </div>



      {/* Bottom buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
        <button onClick={handleSaveDraft} disabled={!!saving}
          style={{ padding: "13px", background: draftSaved ? "#22c55e" : "#fff", border: `1.5px solid ${draftSaved ? "#22c55e" : "#e5e7eb"}`, borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", color: draftSaved ? "#fff" : "#374151", fontFamily: "inherit", transition: "all 0.3s" }}>
          {saving === "draft" ? "Saving…" : draftSaved ? "✅ Saved as Draft!" : "💾 Save Draft"}
        </button>
        <button onClick={handleSavePreview} disabled={!!saving}
          style={{ padding: "13px", background: saving === "preview" ? "#9ca3af" : "linear-gradient(135deg,#064e3b,var(--app-accent))", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: saving ? "not-allowed" : "pointer", color: "#fff", fontFamily: "inherit" }}>
          {saving === "preview" ? "Saving…" : "Preview & Print →"}
        </button>
      </div>
    </div>
  );
}



