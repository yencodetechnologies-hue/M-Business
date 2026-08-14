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
function formatCurrency(val, symbol = "INR", compact = false, disableCompact = false) {
  const num = parseFloat(val) || 0;
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
    draft: { bg: "var(--app-surface)", color: "var(--app-muted)", label: "Draft" },
    sent: { bg: "#EFF6FF", color: "#2563EB", label: "Sent" },
    approved: { bg: "#E2E8F0", color: "#16A34A", label: "Success Approved" },
    rejected: { bg: "#E2E8F0", color: "#64748B", label: "Error Rejected" },
    expired: { bg: "#E2E8F0", color: "#64748B", label: "Expired" },
    converted: { bg: "#E2E8F0", color: "#2563EB", label: "Document Invoiced" },
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
    <div style={{ position: "relative", zIndex: open ? 1000 : 1 }}>
      <div onClick={() => setOpen(!open)} style={{ width: "100%", border: `1.5px solid ${error ? "#64748B" : open ? "var(--app-accent)" : "var(--app-border)"}`, borderRadius: 10, padding: "10px 36px 10px 14px", fontSize: 13, color: value ? T.text : "var(--app-muted)", background: "var(--app-bg)", cursor: "pointer", userSelect: "none", boxSizing: "border-box", position: "relative", minHeight: 42 }}>
        {value ? (<div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{value[0].toUpperCase()}</div><span>{value}</span>{selected?.companyName && <span style={{ fontSize: 11, color: "var(--app-muted)" }}>({selected.companyName})</span>}</div>) : "-- Select Company Name --"}
        <span style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, fontSize: 10, color: "var(--app-muted)", transition: "0.2s" }}>▼</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--app-card)", border: "1.5px solid var(--app-border)", borderRadius: 12, boxShadow: "var(--app-shadow)", zIndex: 999, overflow: "hidden" }}>
          <div style={{ padding: "10px 10px 6px" }}><div style={{ position: "relative" }}><span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12 }}>Search</span><input autoFocus placeholder="Search company name..." value={search} onChange={e => setSearch(e.target.value)} onClick={e => e.stopPropagation()} style={{ width: "100%", padding: "7px 10px 7px 30px", border: "1.5px solid var(--app-border)", borderRadius: 8, fontSize: 12, background: "var(--app-bg)", color: "var(--app-text)", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} /></div></div>
          {onAddCompany && <div onClick={() => { setOpen(false); setSearch(""); onAddCompany(); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: "var(--app-surface)", borderBottom: "2px solid var(--app-border)" }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontSize: 17, fontWeight: 700, flexShrink: 0 }}>+</div><div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--app-accent)" }}>Add New Company Name</div></div></div>}
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filtered.length === 0 ? <div style={{ padding: 14, textAlign: "center", color: "var(--app-muted)", fontSize: 13 }}>No companies found</div>
              : filtered.map((c, i) => { const name = c.clientName || c.name || ""; const company = c.companyName || c.company || ""; const isSel = value === name; return (<div key={i} onClick={() => { onChange(name); setOpen(false); setSearch(""); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: isSel ? "var(--app-surface)" : "transparent", borderBottom: "1px solid var(--app-border)" }} onMouseEnter={e => e.currentTarget.style.background = "var(--app-surface)"} onMouseLeave={e => e.currentTarget.style.background = isSel ? "var(--app-surface)" : "transparent"}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontSize: 11, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>{name[0]?.toUpperCase() || "?"}</div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{name}</div>{company && <div style={{ fontSize: 11, color: "var(--app-muted)" }}>{company}</div>}</div>{isSel && <span style={{ fontSize: 14, color: "var(--app-accent)" }}>Yes</span>}</div>); })}
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
      <div onClick={() => { if (!disabled) setOpen(!open) }} style={{ width: "100%", border: `1.5px solid ${open ? "var(--app-accent)" : "var(--app-border)"}`, borderRadius: 10, padding: "10px 36px 10px 14px", fontSize: 13, color: value ? T.text : "var(--app-muted)", background: "var(--app-bg)", cursor: disabled ? "not-allowed" : "pointer", userSelect: "none", boxSizing: "border-box", position: "relative", minHeight: 42, opacity: disabled ? 0.5 : 1 }}>
        {value ? (<div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-muted))", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{value[0].toUpperCase()}</div><span>{value}</span></div>) : "-- Select Project --"}
        <span style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, fontSize: 10, color: "var(--app-muted)", transition: "0.2s" }}>▼</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--app-card)", border: "1.5px solid var(--app-border)", borderRadius: 12, boxShadow: "var(--app-shadow)", zIndex: 999, overflow: "hidden" }}>
          <div style={{ padding: "10px 10px 6px" }}><div style={{ position: "relative" }}><span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12 }}>Search</span><input autoFocus placeholder="Search project..." value={search} onChange={e => setSearch(e.target.value)} onClick={e => e.stopPropagation()} style={{ width: "100%", padding: "7px 10px 7px 30px", border: "1.5px solid var(--app-border)", borderRadius: 8, fontSize: 12, background: "var(--app-bg)", color: "var(--app-text)", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} /></div></div>
          {onAddProject && <div onClick={() => { setOpen(false); setSearch(""); onAddProject(); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: "var(--app-surface)", borderBottom: "2px solid var(--app-border)" }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-muted))", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontSize: 17, fontWeight: 700, flexShrink: 0 }}>+</div><div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--app-accent)" }}>Add New Project</div></div></div>}
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filtered.length === 0 ? <div style={{ padding: 14, textAlign: "center", color: "var(--app-muted)", fontSize: 13 }}>No projects found</div>
              : filtered.map((p, i) => { const name = p.name || ""; const isSel = value === name; return (<div key={i} onClick={() => { onChange(name); setOpen(false); setSearch(""); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: isSel ? "var(--app-surface)" : "transparent", borderBottom: "1px solid var(--app-border)" }} onMouseEnter={e => e.currentTarget.style.background = "var(--app-surface)"} onMouseLeave={e => e.currentTarget.style.background = isSel ? "var(--app-surface)" : "transparent"}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-muted))", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontSize: 11, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>{name[0]?.toUpperCase() || "?"}</div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{name}</div></div>{isSel && <span style={{ fontSize: 14, color: "var(--app-accent)" }}>Yes</span>}</div>); })}
          </div>
        </div>
      )}
      {open && <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={() => { setOpen(false); setSearch(""); }} />}
    </div>
  );
}

export default function QuotationCreator({ user, clients = [], projects = [], companyLogo, companyName, onLogoChange, onConvertToInvoice, onAddClient, onAddProject, onNewQuotation, onEditQuotation, initialStep, onStepChange, initialViewEntry, onBackOverride }) {
  const effectiveLogo = companyLogo || DEFAULT_LOGO_URL;
  const effectiveCompanyName = companyName || user?.companyName || "M Business";
  const [step, setStep] = useState(initialViewEntry ? "preview" : (initialStep || "list"));
  useEffect(() => {
    if (onStepChange) onStepChange(step);
  }, [step]);
  useEffect(() => {
    if (onStepChange) onStepChange(step);
  }, [step]);

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
        if (typeof showToast === 'function') showToast("Quotation saved successfully!");
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  const sendThemeToIframe = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const color = getComputedStyle(document.documentElement).getPropertyValue('--app-accent').trim() || ' var(--app-accent, var(--app-accent, #2563EB))';
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
  const [viewEntry, setViewEntry] = useState(initialViewEntry || null);
  const [toastMsg, setToastMsg] = useState(null);
  const [showSendPopup, setShowSendPopup] = useState(false);
  const [sendPopupEntry, setSendPopupEntry] = useState(null);
  const [targetPortalClient, setTargetPortalClient] = useState("");

  const handleSendQuotationToPortal = async (targetClient) => {
    if (!sendPopupEntry) return;
    try {
      await axios.put(`${BASE_URL}/api/quotations/${sendPopupEntry.id || sendPopupEntry._id}`, {
        qt: { ...sendPopupEntry.qt, client: targetClient, toName: targetClient },
        items: sendPopupEntry.items,
        status: 'sent',
      });
      setShowSendPopup(false);
      setSendPopupEntry(null);
      setTargetPortalClient('');
      showToast(`Quotation sent to ${targetClient}'s Portal.`);
      fetchList();
    } catch (err) {
      console.error(err);
      alert('Failed to send quotation to portal.');
    }
  };
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const today = new Date().toISOString().split("T")[0];
  const expDefault = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const blank = {
    quoteNo: generateQuoteNo(), refNo: "", date: today, expiryDate: expDefault,
    client: "", project: "", gstRate: 18, notes: "",
    terms: "This quotation is valid for 30 days from the date of issue.",
    companyName: companyName || user?.companyName || "M Business",
    companyEmail: user?.email || user?.companyEmail || "",
    companyPhone: user?.phone || user?.companyPhone || "",
    companyAddress: user?.address || user?.companyAddress || "",
    companyWebsite: user?.website || "",
    companyGst: user?.gstNumber || user?.gstNo || "",
    currency: "INR",
    template: "Modern",
    footerMessage: " Thank you for considering us!",
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

  const [qt, setQt] = useState(initialViewEntry?.qt || blank);
  const [items, setItems] = useState(initialViewEntry?.items || [{ id: 1, description: "", quantity: 1, rate: "" }]);

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
  useEffect(() => {
    if (step === "preview") window.scrollTo(0, 0);
  }, [step]);

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
  const generatePDFFromEntry = async (entry) => {
    // Build PDF directly from entry data — no DOM rendering, no page navigation needed
    const qtData = entry.qt || {};
    const entryItems = entry.items || [];

    const subtotalRaw = entryItems.reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseFloat(i.quantity || i.qty) || 0), 0);
    const gstRate = parseFloat(qtData.gstRate) || 0;
    const isGstIncluded = qtData.isGstIncluded || false;
    let sub, gstAmt, tot;
    if (isGstIncluded) {
      tot = subtotalRaw;
      sub = tot / (1 + gstRate / 100);
      gstAmt = tot - sub;
    } else {
      sub = subtotalRaw;
      gstAmt = sub * (gstRate / 100);
      tot = sub + gstAmt;
    }

    const currency = qtData.currency || 'INR';
    const fmt = (n) => formatCurrency(n, currency, false, true);

    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const PW = 210; // page width mm
    const PH = 297; // page height mm
    const ML = 14;  // margin left
    const MR = 14;  // margin right
    const CW = PW - ML - MR; // content width
    let y = 0;

    // ── HEADER BACKGROUND ──
    doc.setFillColor(240, 253, 250);
    doc.rect(0, 0, PW, 52, 'F');

    // ── LOGO / COMPANY INITIALS ──
    const companyName = qtData.fromCompany || qtData.companyName || 'Company';
    const initials = companyName.substring(0, 2).toUpperCase();
    doc.setFillColor(0, 188, 212);
    doc.roundedRect(ML, 10, 16, 16, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(initials, ML + 8, 20.5, { align: 'center' });

    // ── COMPANY NAME ──
    doc.setTextColor(6, 78, 59);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName.toUpperCase(), ML + 20, 18);

    const fromEmail = qtData.fromEmail || qtData.companyEmail || '';
    const fromPhone = qtData.fromPhone || qtData.companyPhone || '';
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(6, 95, 70);
    if (fromEmail) { doc.text(fromEmail, ML + 20, 23); }
    if (fromPhone) { doc.text(fromPhone, ML + 20, 27); }

    // ── QUOTATION TITLE (right side) ──
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 188, 212);
    doc.setGState && doc.setGState(new doc.GState({ opacity: 0.15 }));
    doc.text('QUOTATION', PW - MR, 22, { align: 'right' });
    doc.setGState && doc.setGState(new doc.GState({ opacity: 1 }));

    doc.setFontSize(12);
    doc.setTextColor(0, 188, 212);
    doc.text(entry.quoteNo || qtData.quoteNo || '', PW - MR, 30, { align: 'right' });

    // Date & Valid Until
    const quoteDate = qtData.quoteDate || qtData.date || '';
    const expiryDate = qtData.expiryDate || '';
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    if (quoteDate) {
      doc.text('DATE', PW - MR - 28, 36);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(6, 78, 59);
      doc.text(formatDate(quoteDate), PW - MR, 36, { align: 'right' });
    }
    if (expiryDate) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('VALID UNTIL', PW - MR - 28, 41);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(234, 88, 12);
      doc.text(formatDate(expiryDate), PW - MR, 41, { align: 'right' });
    }

    // ── DIVIDER ──
    y = 55;
    doc.setDrawColor(209, 250, 229);
    doc.setLineWidth(0.5);
    doc.line(ML, y, PW - MR, y);
    y += 6;

    // ── PREPARED FOR / PROJECT ──
    const clientName = qtData.toName || qtData.client || entry.client || '';
    const projectName = qtData.title || qtData.project || entry.project || '';

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 188, 212);
    doc.text('PREPARED FOR', ML, y);
    if (projectName) doc.text('PROJECT', ML + CW / 2, y);

    y += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(clientName || '—', ML, y);
    if (projectName) doc.text(projectName, ML + CW / 2, y);

    const toEmail = qtData.toEmail || '';
    const toPhone = qtData.toPhone || '';
    const toAddress = qtData.toAddress || '';
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    let clientY = y + 5;
    if (toEmail) { doc.text(toEmail, ML, clientY); clientY += 4; }
    if (toPhone) { doc.text(toPhone, ML, clientY); clientY += 4; }
    if (toAddress) { doc.text(toAddress, ML, clientY); clientY += 4; }
    y = Math.max(clientY, y + 10) + 4;

    // ── DIVIDER ──
    doc.setDrawColor(240, 253, 250);
    doc.setLineWidth(0.3);
    doc.line(ML, y, PW - MR, y);
    y += 6;

    // ── ITEMS TABLE HEADER ──
    doc.setFillColor(240, 253, 250);
    doc.rect(ML, y, CW, 8, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 188, 212);
    doc.text('#', ML + 2, y + 5.5);
    doc.text('DESCRIPTION', ML + 10, y + 5.5);
    doc.text('QTY', ML + CW - 52, y + 5.5, { align: 'right' });
    doc.text('UNIT RATE', ML + CW - 28, y + 5.5, { align: 'right' });
    doc.text('AMOUNT', ML + CW, y + 5.5, { align: 'right' });
    y += 8;

    // ── ITEMS ROWS ──
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(17, 24, 39);
    entryItems.forEach((item, idx) => {
      const desc = item.description || item.desc || '';
      const qty = parseFloat(item.quantity || item.qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = qty * rate;
      const rowBg = idx % 2 === 1;

      if (rowBg) {
        doc.setFillColor(248, 250, 252);
        doc.rect(ML, y, CW, 8, 'F');
      }

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(110, 231, 183);
      doc.text(String(idx + 1).padStart(2, '0'), ML + 2, y + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(17, 24, 39);
      doc.text(desc, ML + 10, y + 5.5);
      doc.text(String(qty), ML + CW - 52, y + 5.5, { align: 'right' });

      doc.setTextColor(55, 65, 81);
      doc.text(fmt(rate), ML + CW - 28, y + 5.5, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text(fmt(amount), ML + CW, y + 5.5, { align: 'right' });

      doc.setDrawColor(240, 253, 250);
      doc.setLineWidth(0.2);
      doc.line(ML, y + 8, ML + CW, y + 8);
      y += 8;
    });

    y += 6;

    // ── TOTALS ──
    const totalsX = ML + CW / 2;
    const totalsW = CW / 2;

    const drawTotalRow = (label, value, isBold = false) => {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(240, 253, 250);
      doc.setLineWidth(0.2);
      doc.line(totalsX, y + 6, ML + CW, y + 6);
      doc.setFontSize(9);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(label, totalsX, y + 4.5);
      doc.setTextColor(17, 24, 39);
      doc.text(value, ML + CW, y + 4.5, { align: 'right' });
      y += 7;
    };

    drawTotalRow('Subtotal', fmt(sub));
    drawTotalRow(`GST (${gstRate}%)${isGstIncluded ? ' (Incl.)' : ''}`, fmt(gstAmt));
    drawTotalRow('Total Amount', fmt(tot));

    const amountPaid = parseFloat(qtData.amountPaid) || 0;
    drawTotalRow('Amount Paid', fmt(amountPaid));

    // Balance Due box
    y += 2;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(totalsX, y, totalsW, 12, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(totalsX, y, totalsW, 12, 2, 2, 'S');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('BALANCE DUE', totalsX + 4, y + 7.5);
    doc.setFontSize(13);
    doc.setTextColor(6, 78, 59);
    doc.text(fmt(tot - amountPaid), ML + CW - 2, y + 8, { align: 'right' });
    y += 18;

    // ── NOTES ──
    const notes = qtData.notes || qtData.terms || '';
    if (notes) {
      doc.setFillColor(240, 253, 250);
      doc.roundedRect(ML, y, CW * 0.6, 22, 2, 2, 'F');
      doc.setDrawColor(209, 250, 229);
      doc.roundedRect(ML, y, CW * 0.6, 22, 2, 2, 'S');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 188, 212);
      doc.text('NOTES', ML + 4, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      const noteLines = doc.splitTextToSize(notes, CW * 0.6 - 8);
      doc.text(noteLines.slice(0, 4), ML + 4, y + 10);
      y += 26;
    }

    // ── FOOTER ──
    doc.setFillColor(255, 255, 255);
    doc.rect(0, PH - 16, PW, 16, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.5);
    doc.line(0, PH - 16, PW, PH - 16);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(companyName, ML, PH - 8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(124, 58, 237);
    doc.text('Thank you for considering us!', PW / 2, PH - 8, { align: 'center' });
    doc.text(entry.quoteNo || '', PW - MR, PH - 8, { align: 'right' });

    return doc;
  };

  const buildPDFFromData = (entry) => {
    const qtData = entry.qt || {};
    const entryItems = entry.items || [];

    const subtotalRaw = entryItems.reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseFloat(i.quantity || i.qty) || 0), 0);
    const gstRate = parseFloat(qtData.gstRate) || 0;
    const isGstInc = qtData.isGstIncluded || false;
    let sub, gstAmt, tot;
    if (isGstInc) { tot = subtotalRaw; sub = tot / (1 + gstRate / 100); gstAmt = tot - sub; }
    else { sub = subtotalRaw; gstAmt = sub * gstRate / 100; tot = sub + gstAmt; }

    const cur = qtData.currency || "INR";
    const fmtN = (n) => cur + " " + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtD = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const PW = 210; const PH = 297;
    const ML = 14; const MR = 14;
    const CW = PW - ML - MR;
    let y = 0;

    // ── Header band ──
    doc.setFillColor(240, 253, 250);
    doc.rect(0, 0, PW, 50, "F");

    const company = qtData.fromCompany || qtData.companyName || effectiveCompanyName || "Company";
    const init2 = company.substring(0, 2).toUpperCase();
    doc.setFillColor(0, 188, 212);
    doc.roundedRect(ML, 10, 18, 18, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text(init2, ML + 9, 21, { align: "center" });

    doc.setTextColor(6, 78, 59);
    doc.setFontSize(15); doc.setFont("helvetica", "bold");
    doc.text(company.toUpperCase(), ML + 22, 17);
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(6, 95, 70);
    if (qtData.fromEmail || qtData.companyEmail) doc.text(qtData.fromEmail || qtData.companyEmail, ML + 22, 22);
    if (qtData.fromPhone || qtData.companyPhone) doc.text(qtData.fromPhone || qtData.companyPhone, ML + 22, 27);

    doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.setTextColor(200, 240, 245);
    doc.text("QUOTATION", PW - MR, 20, { align: "right" });
    doc.setFontSize(11); doc.setTextColor(0, 188, 212);
    doc.text(entry.quoteNo || qtData.quoteNo || "", PW - MR, 28, { align: "right" });
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139);
    const qDate = qtData.quoteDate || qtData.date || "";
    const qExp = qtData.expiryDate || "";
    if (qDate) { doc.text("DATE", PW - MR - 26, 35); doc.setFont("helvetica", "bold"); doc.setTextColor(6, 78, 59); doc.text(fmtD(qDate), PW - MR, 35, { align: "right" }); }
    if (qExp) { doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139); doc.text("VALID UNTIL", PW - MR - 26, 40); doc.setFont("helvetica", "bold"); doc.setTextColor(234, 88, 12); doc.text(fmtD(qExp), PW - MR, 40, { align: "right" }); }

    // ── Divider ──
    y = 53; doc.setDrawColor(209, 250, 229); doc.setLineWidth(0.4); doc.line(ML, y, PW - MR, y); y += 6;

    // ── Prepared For / Project ──
    const clientName = qtData.toName || qtData.client || entry.client || "";
    const projectName = qtData.title || qtData.project || entry.project || "";
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 188, 212);
    doc.text("PREPARED FOR", ML, y);
    if (projectName) doc.text("PROJECT", ML + CW / 2, y);
    y += 5;
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(17, 24, 39);
    doc.text(clientName || "—", ML, y);
    if (projectName) doc.text(projectName, ML + CW / 2, y);
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(107, 114, 128);
    let cy = y + 5;
    if (qtData.toEmail) { doc.text(qtData.toEmail, ML, cy); cy += 4; }
    if (qtData.toPhone) { doc.text(qtData.toPhone, ML, cy); cy += 4; }
    if (qtData.toAddress) { doc.text(qtData.toAddress, ML, cy); cy += 4; }
    y = Math.max(cy, y + 10) + 5;

    // ── Table header ──
    doc.setFillColor(240, 253, 250); doc.rect(ML, y, CW, 8, "F");
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 188, 212);
    doc.text("#", ML + 2, y + 5.5);
    doc.text("DESCRIPTION", ML + 10, y + 5.5);
    doc.text("QTY", ML + CW - 50, y + 5.5, { align: "right" });
    doc.text("UNIT RATE", ML + CW - 26, y + 5.5, { align: "right" });
    doc.text("AMOUNT", ML + CW, y + 5.5, { align: "right" });
    y += 8;

    // ── Table rows ──
    entryItems.forEach((item, idx) => {
      const desc = item.description || item.desc || "";
      const qty = parseFloat(item.quantity || item.qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = qty * rate;
      if (idx % 2 === 1) { doc.setFillColor(248, 250, 252); doc.rect(ML, y, CW, 8, "F"); }
      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(110, 231, 183);
      doc.text(String(idx + 1).padStart(2, "0"), ML + 2, y + 5.5);
      doc.setFont("helvetica", "normal"); doc.setTextColor(17, 24, 39);
      doc.text(desc, ML + 10, y + 5.5);
      doc.setTextColor(55, 65, 81);
      doc.text(String(qty), ML + CW - 50, y + 5.5, { align: "right" });
      doc.text(fmtN(rate), ML + CW - 26, y + 5.5, { align: "right" });
      doc.setFont("helvetica", "bold"); doc.setTextColor(17, 24, 39);
      doc.text(fmtN(amount), ML + CW, y + 5.5, { align: "right" });
      doc.setDrawColor(240, 253, 250); doc.setLineWidth(0.2); doc.line(ML, y + 8, ML + CW, y + 8);
      y += 8;
    });
    y += 5;

    // ── Totals ──
    const tX = ML + CW / 2;
    const drawRow = (lbl, val) => {
      doc.setLineWidth(0.2); doc.setDrawColor(240, 253, 250); doc.line(tX, y + 6, ML + CW, y + 6);
      doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(107, 114, 128);
      doc.text(lbl, tX, y + 4.5);
      doc.setFont("helvetica", "bold"); doc.setTextColor(17, 24, 39);
      doc.text(val, ML + CW, y + 4.5, { align: "right" });
      y += 7;
    };
    drawRow("Subtotal", fmtN(sub));
    drawRow(`GST (${gstRate}%)${isGstInc ? " (Incl.)" : ""}`, fmtN(gstAmt));
    drawRow("Total Amount", fmtN(tot));
    const paid = parseFloat(qtData.amountPaid) || 0;
    drawRow("Amount Paid", fmtN(paid));
    y += 2;
    doc.setFillColor(248, 250, 252); doc.roundedRect(tX, y, CW / 2, 12, 2, 2, "F");
    doc.setDrawColor(226, 232, 240); doc.roundedRect(tX, y, CW / 2, 12, 2, 2, "S");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(100, 116, 139);
    doc.text("BALANCE DUE", tX + 4, y + 7.5);
    doc.setFontSize(13); doc.setTextColor(6, 78, 59);
    doc.text(fmtN(tot - paid), ML + CW - 2, y + 8, { align: "right" });
    y += 18;

    // ── Notes ──
    const notes = qtData.notes || qtData.terms || "";
    if (notes) {
      doc.setFillColor(240, 253, 250); doc.roundedRect(ML, y, CW * 0.6, 22, 2, 2, "F");
      doc.setDrawColor(209, 250, 229); doc.roundedRect(ML, y, CW * 0.6, 22, 2, 2, "S");
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 188, 212);
      doc.text("NOTES", ML + 4, y + 5);
      doc.setFont("helvetica", "normal"); doc.setTextColor(55, 65, 81);
      const lines = doc.splitTextToSize(notes, CW * 0.6 - 8);
      doc.text(lines.slice(0, 4), ML + 4, y + 10);
      y += 26;
    }

    // ── Footer ──
    doc.setFillColor(255, 255, 255); doc.rect(0, PH - 16, PW, 16, "F");
    doc.setDrawColor(241, 245, 249); doc.setLineWidth(0.5); doc.line(0, PH - 16, PW, PH - 16);
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(107, 114, 128);
    doc.text(company, ML, PH - 8);
    doc.setFont("helvetica", "bold"); doc.setTextColor(124, 58, 237);
    doc.text("Thank you for considering us!", PW / 2, PH - 8, { align: "center" });
    doc.text(entry.quoteNo || "", PW - MR, PH - 8, { align: "right" });

    return doc;
  };
  const triggerPDFShare = async (entry, type) => {
    const qtData = entry.qt || qt;
    const entryItems = entry.items || items || [];
    const slimPayload = {
      no: qtData.quoteNo || entry.quoteNo,
      date: qtData.date || qtData.quoteDate,
      exp: qtData.expiryDate,
      co: qtData.companyName || qtData.fromCompany,
      email: qtData.companyEmail || qtData.fromEmail,
      phone: qtData.companyPhone || qtData.fromPhone,
      addr: qtData.companyAddress,
      cl: qtData.client || qtData.toName,
      proj: qtData.project || qtData.title,
      gst: qtData.gstRate,
      notes: qtData.notes,
      terms: qtData.terms,
      incGst: qtData.isGstIncluded,
      paid: qtData.amountPaid,
      upi: qtData.upiId,
      cur: qtData.currency,
      logo: qtData.logoUrl || "",
      items: entryItems.map(i => ({ d: i.description || i.desc, q: i.quantity || i.qty, r: i.rate })),
      cid: user?.companyId || user?.company || user?._id || "",
    };
    const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(slimPayload)))));
    const viewURL = `${FRONTEND_URL}/quotation-view?d=${encoded}&print=1`;
    window.open(viewURL, "_blank");
    showToast("");
  };

  const shareQuotation = async (entry) => {
    // Build the shareable public URL for this quotation
    const qtData = entry.qt || qt;
    const entryItems = entry.items || items || [];
    const slimPayload = {
      no: qtData.quoteNo || entry.quoteNo,
      date: qtData.date || qtData.quoteDate,
      exp: qtData.expiryDate,
      co: qtData.companyName || qtData.fromCompany,
      email: qtData.companyEmail || qtData.fromEmail,
      phone: qtData.companyPhone || qtData.fromPhone,
      addr: qtData.companyAddress,
      cl: qtData.client || qtData.toName,
      proj: qtData.project || qtData.title,
      gst: qtData.gstRate,
      notes: qtData.notes,
      terms: qtData.terms,
      incGst: qtData.isGstIncluded,
      paid: qtData.amountPaid,
      upi: qtData.upiId,
      cur: qtData.currency,
      items: entryItems.map(i => ({ d: i.description || i.desc, q: i.quantity || i.qty, r: i.rate })),
      cid: user?.companyId || user?.company || user?._id || "",
    };
    let shareURL = `${FRONTEND_URL}/quotation-view?d=${encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(slimPayload)))))}`;
    if (shareURL.length > 2000) shareURL = `${FRONTEND_URL}/quotation-view?no=${entry.quoteNo}`;

    const subtotal = entryItems.reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseFloat(i.quantity || i.qty) || 0), 0);
    const shareTitle = `Quotation ${entry.quoteNo} — ${qtData.companyName || qtData.fromCompany || ""}`;
    const shareText = `Hi, please find your quotation ${entry.quoteNo} for ₹${subtotal.toLocaleString("en-IN")}.\n\nView it here: ${shareURL}`;

    // Use native Web Share API if available (works on mobile — triggers share sheet with all apps)
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareURL });
        return;
      } catch (e) {
        if (e.name === "AbortError") return; // user cancelled
      }
    }

    // Fallback: copy link to clipboard
    try {
      await navigator.clipboard.writeText(shareURL);
      showToast("Link copied to clipboard!");
    } catch {
      showToast("Share link: " + shareURL);
    }
  };

  const shareWhatsApp = (entry) => {
    const qtData = entry.qt || qt;
    const entryItems = entry.items || items || [];
    const subtotal = entryItems.reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseFloat(i.quantity || i.qty) || 0), 0);

    const slimPayload = {
      no: qtData.quoteNo || entry.quoteNo,
      date: qtData.date || qtData.quoteDate,
      exp: qtData.expiryDate,
      co: qtData.companyName || qtData.fromCompany,
      email: qtData.companyEmail || qtData.fromEmail,
      phone: qtData.companyPhone || qtData.fromPhone,
      addr: qtData.companyAddress,
      cl: qtData.client || qtData.toName,
      proj: qtData.project || qtData.title,
      gst: qtData.gstRate,
      notes: qtData.notes,
      cur: qtData.currency,
      items: entryItems.map(i => ({ d: i.description || i.desc, q: i.quantity || i.qty, r: i.rate })),
      cid: user?.companyId || user?.company || user?._id || "",
    };
    let viewURL = `${FRONTEND_URL}/quotation-view?d=${encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(slimPayload)))))}`;
    if (viewURL.length > 2000) viewURL = `${FRONTEND_URL}/quotation-view?no=${entry.quoteNo}`;

    const company = qtData.companyName || qtData.fromCompany || "Your Business";
    const client = qtData.client || qtData.toName || "";
    const project = qtData.project || qtData.title || "";
    const validity = qtData.validity || "30";

    const msg = `*${company}*\n\nDear ${client},\n\nPlease find your quotation below:\n\n📋 *Quotation No:* ${entry.quoteNo}\n💼 *Project:* ${project}\n💰 *Total:* ₹${subtotal.toLocaleString("en-IN")}\n⏰ *Valid for:* ${validity} days\n\n🔗 *View Quotation:* ${viewURL}\n\n_Kindly review and revert at your earliest convenience._\n\n_Thank you for your business!_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };
  const loadEntry = (entry) => {
    setQt(entry.qt || blank);
    setItems(entry.items || [{ id: 1, description: "", quantity: 1, rate: "" }]);
    setErrors({});
    setViewEntry(entry);
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
        alert(`Success Invoice ${response.data.invoiceNo} created!`);
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
      if (newStatus === "accepted") {
        const hasPaid = (entry.amountPaid || entry.qt?.amountPaid || 0) > 0;
        if (hasPaid) alert("Success Quotation Accepted & Advance Recorded in Accounts!");
        else alert("Success Quotation Accepted!");
      }
    } catch (error) {
      console.error('Status update error:', error);
      alert("Status update failed");
    }
  };

  const inp = (err) => ({
    width: "100%", border: `1.5px solid ${err ? "#64748B" : "var(--app-border)"}`, borderRadius: 10,
    padding: "10px 12px", fontSize: 14, color: "var(--app-text)", background: err ? "#F8FAFC" : "var(--app-surface)",
    boxSizing: "border-box", outline: "none", fontFamily: "inherit", transition: "all 0.2s",
  });
  const lbl = { display: "block", fontSize: 12, color: "var(--app-muted)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" };

  // ---------- LIST ----------
  if (step === "list" && !window.__fullQuotationsList && typeof window !== "undefined" && window.innerWidth < 769) {
    const enrichedMinimal = qtList.map((e) => {
      const expiry = e.qt?.expiryDate || e.expiryDate;
      let status = e.status || "draft";
      if (status === "sent" && expiry && new Date(expiry) < new Date()) status = "expired";
      return { ...e, status };
    });
    const initials = (name) => (name || "Q").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
    const badgeCfg = (status) => {
      const ok = status === "approved" || status === "converted";
      return ok ? { bg: "#E2E8F0", fg: "#16A34A" } : { bg: "#F8FAFC", fg: "#64748B" };
    };
    return (
      <div style={{ padding: "16px 14px", background: "#F8FAFC", minHeight: "100%", boxSizing: "border-box", maxWidth: "100%", overflowX: "hidden" }}>
        <div
          onClick={() => onBackOverride && onBackOverride()}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 4px 16px", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "var(--app-accent, #2563EB)" }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: 16 }}></i> Back to Dashboard
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, var(--app-accent, #2563EB), #2563EB)", borderRadius: 16, padding: "16px 18px", marginBottom: 14, boxShadow: "0 6px 18px rgba(37, 99, 235, 0.25)" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: 0.5, textTransform: "uppercase" }}>Total Quotations</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF" }}>{enrichedMinimal.length}</div>
          </div>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-receipt" style={{ fontSize: 22, color: "#FFFFFF" }} />
          </div>
        </div>

        {enrichedMinimal.length === 0 ? (
          <div style={{ padding: "40px 16px", textAlign: "center", color: "#64748B", fontSize: 13, fontWeight: 600, background: "#FFFFFF", borderRadius: 16, boxShadow: "0 2px 10px rgba(15, 23, 42, 0.05)" }}>
            No quotations found.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            {enrichedMinimal.map((entry, i) => {
              const bc = badgeCfg(entry.status);
              const client = entry.qt?.client || entry.client || entry.quoteNo || "—";
              const quoteNo = entry.qt?.quoteNo || entry.quoteNo || "";
              return (
                <div
                  key={entry.id || entry.quoteNo || i}
                  onClick={() => { loadEntry(entry); setStep("preview"); }}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 16,
                    padding: "16px",
                    boxShadow: "0 3px 14px rgba(15, 23, 42, 0.07)",
                    cursor: "pointer",
                    boxSizing: "border-box",
                    borderLeft: `4px solid ${bc.fg}`
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg, var(--app-accent, #2563EB), #2563EB)", color: "#FFFFFF",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 800
                      }}>
                        {initials(client)}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 800, color: "#0F172A", fontSize: 14.5, wordBreak: "break-word" }}>{client}</div>
                        {quoteNo && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, fontSize: 11.5, color: "#64748B", fontWeight: 600 }}>
                            <i className="ti ti-hash" style={{ fontSize: 12, flexShrink: 0 }} />
                            <span>{quoteNo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span style={{
                      fontWeight: 700, fontSize: 10.5, padding: "5px 12px", borderRadius: 20,
                      background: bc.bg, color: bc.fg, flexShrink: 0, whiteSpace: "nowrap"
                    }}>
                      {entry.status || "Draft"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4, color: "var(--app-accent, #2563EB)", fontSize: 12, fontWeight: 700 }}>
                    View details <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  if (step === "list") {
    // toast is rendered below inside the list return, handled globally
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
      if (activeTab !== "All" && e.status.toLowerCase() !== activeTab.toLowerCase() && !(activeTab === "Accepted" && (e.status === "converted" || e.status === "approved")) && !(activeTab === "Pending" && e.status === "pending")) return false;
      if (!listSearch) return true;
      const term = listSearch.toLowerCase();
      return (e.quoteNo || "").toLowerCase().includes(term) ||
        (e.client || "").toLowerCase().includes(term) ||
        (e.qt?.project || e.project || "").toLowerCase().includes(term);
    });

    const getStatusTheme = (st) => {
      switch (st) {
        case "approved": case "converted": return "c-green";
        case "sent": return "c-blue";
        case "pending": return "c-amber";
        case "rejected": return "c-red";
        default: return "c-purple"; // draft
      }
    };

    const getBadge = (st) => {
      switch (st) {
        case "approved": return <span className="badge accepted">Accepted</span>;
        case "converted": return <span className="badge converted">Converted</span>;
        case "sent": return <span className="badge sent">Sent</span>;
        case "pending": return <span className="badge pending">Pending</span>;
        case "rejected": return <span className="badge rejected">Rejected</span>;
        default: return <span className="badge draft">Draft</span>;
      }
    };

    return (
      <div style={{ fontFamily: "var(--font, 'Nunito', sans-serif)", minHeight: "100%", width: "100%", maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box", background: "var(--bg, #F8FAFC)" }}>
        {toastMsg && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 99999, background: '#1E293B', color: '#FFFFFF', borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-check" style={{ fontSize: 15, color: '#16A34A' }}></i> {toastMsg}
          </div>
        )}
        <div className="content">
          <div className="page-header">
            <div>
              <div className="page-title">Quotations</div>
              <div className="page-sub">Create, send and track client quotations</div>
            </div>
            <div className="header-actions" style={{ display: "flex", gap: 10, width: "100%" }}>
              <div className="search-wrap" style={{ flex: "0 1 320px", minWidth: 0, width: "auto" }}>
                <i className="ti ti-search" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", fontSize: 16 }}></i>

                <input
                  type="text"
                  placeholder="Search quotations…"
                  value={listSearch}
                  onChange={e => setListSearch(e.target.value)}
                  style={{ width: "100%", padding: "11px 14px 11px 40px", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 12, fontSize: 13, color: "var(--text)", fontFamily: "var(--font)", outline: "none", transition: "all .15s", boxSizing: "border-box" }}
                />
              </div>
              <button className="create-btn" onClick={() => { clearForm(); if (onNewQuotation) { onNewQuotation(); } else { setStep("form"); } }} style={{ flex: "0 0 auto", minWidth: 0, justifyContent: "center", whiteSpace: "nowrap", padding: "11px 24px", marginLeft: "auto" }}>
                <i className="ti ti-plus" style={{ fontSize: 15 }}></i> New Quotation
              </button>
            </div>
          </div>

          <div className="stats-row" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            <div className="stat-card" style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", border: "1.5px solid var(--border,#E2E8F0)", borderRadius: 16, background: "#FFFFFF", padding: "18px 20px" }}>
              <div className="stat-icon" style={{ width: 44, height: 44, borderRadius: 12, background: "var(--teal-light)", color: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}><i className="ti ti-file-text"></i></div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text,#1E293B)", lineHeight: 1 }}>{totalQuotes}</div>
                <div style={{ fontSize: 11, color: "var(--text3,#64748B)", fontWeight: 600, marginTop: 3 }}>Total Quotes</div>
                <div style={{ fontSize: 10, fontWeight: 700, marginTop: 4, color: "var(--teal)" }}>₹{totalValue.toLocaleString("en-IN")} value</div>
              </div>
            </div>

            <div className="stat-card" style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", border: "1.5px solid var(--border,#E2E8F0)", borderRadius: 16, background: "#FFFFFF", padding: "18px 20px" }}>
              <div className="stat-icon" style={{ width: 44, height: 44, borderRadius: 12, background: "var(--app-accent-light)", color: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}><i className="ti ti-circle-check"></i></div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text,#1E293B)", lineHeight: 1 }}>{wonCount}</div>
                <div style={{ fontSize: 11, color: "var(--text3,#64748B)", fontWeight: 600, marginTop: 3 }}>Accepted</div>
                <div style={{ fontSize: 10, fontWeight: 700, marginTop: 4, color: "var(--green)" }}>₹{wonValue.toLocaleString("en-IN")} won</div>
              </div>
            </div>

            <div className="stat-card" style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", border: "1.5px solid var(--border,#E2E8F0)", borderRadius: 16, background: "#FFFFFF", padding: "18px 20px" }}>
              <div className="stat-icon" style={{ width: 44, height: 44, borderRadius: 12, background: "var(--app-accent-light)", color: "var(--app-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}><i className="ti ti-clock"></i></div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text,#1E293B)", lineHeight: 1 }}>{pendingCount}</div>
                <div style={{ fontSize: 11, color: "var(--text3,#64748B)", fontWeight: 600, marginTop: 3 }}>Pending</div>
                <div style={{ fontSize: 10, fontWeight: 700, marginTop: 4, color: "var(--app-muted)" }}>₹{pendingValue.toLocaleString("en-IN")} pending</div>
              </div>
            </div>

            <div className="stat-card" style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", border: "1.5px solid var(--border,#E2E8F0)", borderRadius: 16, background: "#FFFFFF", padding: "18px 20px" }}>
              <div className="stat-icon" style={{ width: 44, height: 44, borderRadius: 12, background: "var(--app-accent-light)", color: "var(--app-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}><i className="ti ti-percentage"></i></div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text,#1E293B)", lineHeight: 1 }}>{winRate}%</div>
                <div style={{ fontSize: 11, color: "var(--text3,#64748B)", fontWeight: 600, marginTop: 3 }}>Win Rate</div>
                <div style={{ fontSize: 10, fontWeight: 700, marginTop: 4, color: "var(--app-accent)" }}>{wonCount} of {sentCount} sent</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div className="tabs">{["All", "Draft", "Sent", "Pending", "Accepted", "Rejected"].map(t => (<button key={t} className={`tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>{t}</button>
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
              const init = (entry.client || "U").substring(0, 2).toUpperCase();

              return (
                <div key={entry.id || entry.quoteNo} className={`quote-card ${getStatusTheme(entry.status)}`} onClick={() => { loadEntry(entry); setStep("preview"); }}>
                  <div className="qc-top">
                    <span className="qc-id">#{entry.quoteNo || "QT-XXXX"}</span>
                    <select
                      value={entry.status}
                      onChange={(e) => { e.stopPropagation(); handleStatusChange(entry, e.target.value); }}
                      style={{ border: "1px solid #E2E8F0", borderRadius: 6, padding: "2px 6px", fontSize: 10, fontWeight: 700, color: "#1E293B", background: "#FFFFFF", cursor: "pointer", outline: "none", marginLeft: "auto" }}
                      onClick={e => e.stopPropagation()}
                    >
                      {["draft", "sent", "pending", "approved", "rejected", "converted"].map(s => (
                        <option key={s} value={s}>{s === "converted" ? "Invoiced" : s === "pending" ? "Pending" : s === "approved" ? "Accepted" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="qc-title">{qtD.project || entry.project || "Untitled Project"}</div>
                  <div className="qc-client">
                    <div className="qc-av" style={{ background: "var(--teal)" }}>{init}</div>
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
                    <button className="qa-btn" onClick={() => { if (onEditQuotation) { onEditQuotation(entry); } else { loadEntry(entry); } }}><i className="ti ti-edit" style={{ fontSize: 13 }}></i> Edit</button>
                    <button className="qa-btn" onClick={() => { try { const doc = buildPDFFromData(entry); doc.save(`Quotation_${entry.quoteNo || 'draft'}.pdf`); showToast('PDF downloaded!'); } catch (e) { console.error('PDF generation failed:', e); showToast('Failed to generate PDF.'); } }}><i className="ti ti-download" style={{ fontSize: 13 }}></i> PDF</button>
                    {(entry.status === "approved" || entry.status === "converted") ? (
                      <button className="qa-btn primary" style={entry.status === "converted" ? { background: "var(--surface)", color: "var(--teal)", borderColor: "var(--teal)" } : {}} onClick={() => entry.status !== "converted" && handleConvert(entry)} disabled={entry.status === "converted" || convertingId === entry.id}>
                        {entry.status === "converted" ? <><i className="ti ti-circle-check" style={{ fontSize: 13 }}></i> Done</> : <><i className="ti ti-receipt" style={{ fontSize: 13 }}></i> Invoice</>}
                      </button>
                    ) : (
                      <button className="qa-btn primary" onClick={() => { setSendPopupEntry(entry); setTargetPortalClient(entry.qt?.client || entry.client || ''); setShowSendPopup(true); }}><i className="ti ti-send" style={{ fontSize: 13 }}></i> Send</button>
                    )}
                    <button
                      className="qa-btn"
                      style={{ color: "#64748B", borderColor: "#E2E8F0" }}
                      onClick={() => {
                        if (window.confirm(`Delete quotation ${entry.quoteNo}?`)) {
                          axios.delete(`${BASE_URL}/api/quotations/${entry.id}`)
                            .then(() => { showToast("Quotation deleted."); fetchList(); })
                            .catch(() => {
                              const all = loadLocal();
                              localStorage.setItem(LOCAL_KEY, JSON.stringify(all.filter(d => d.id !== entry.id)));
                              showToast("Deleted locally.");
                              fetchList();
                            });
                        }
                      }}
                    >
                      <i className="ti ti-trash" style={{ fontSize: 13 }}></i> Delete
                    </button>
                  </div>
                </div>
              );
            })}


          </div>

          <div className="bottom-row">
            <div className="funnel-panel">
              <div className="fp-title">Quotation Pipeline</div>
              <div className="fp-sub">How quotes move through your sales funnel</div>
              <div className="funnel-steps">
                <div className="funnel-step">
                  <span className="fs-label">Created</span>
                  <div className="fs-bar-wrap">
                    <div className="fs-bar" style={{ width: totalQuotes > 0 ? "100%" : "0%", background: "var(--teal)" }}>{totalQuotes > 0 ? `${totalQuotes} quotes` : ""}</div>
                  </div>
                  <span className="fs-count">{totalQuotes}</span>
                  <span className="fs-pct">{totalQuotes > 0 ? "100%" : "0%"}</span>
                </div>
                <div className="funnel-step">
                  <span className="fs-label">Sent</span>
                  <div className="fs-bar-wrap">
                    <div className="fs-bar" style={{ width: `${totalQuotes > 0 ? (sentCount / totalQuotes) * 100 : 0}%`, background: "var(--blue)" }}>{sentCount > 0 ? `${sentCount} sent` : ""}</div>
                  </div>
                  <span className="fs-count">{sentCount}</span>
                  <span className="fs-pct">{totalQuotes > 0 ? Math.round((sentCount / totalQuotes) * 100) : 0}%</span>
                </div>
                <div className="funnel-step">
                  <span className="fs-label">Accepted</span>
                  <div className="fs-bar-wrap">
                    <div className="fs-bar" style={{ width: `${totalQuotes > 0 ? (wonCount / totalQuotes) * 100 : 0}%`, background: "var(--green)" }}>{wonCount > 0 ? `${wonCount} won` : ""}</div>
                  </div>
                  <span className="fs-count">{wonCount}</span>
                  <span className="fs-pct">{totalQuotes > 0 ? Math.round((wonCount / totalQuotes) * 100) : 0}%</span>
                </div>
                <div className="funnel-step">
                  <span className="fs-label">Rejected</span>
                  <div className="fs-bar-wrap">
                    <div className="fs-bar" style={{ width: `${totalQuotes > 0 ? (rejectedCount / totalQuotes) * 100 : 0}%`, background: "var(--app-text)" }}></div>
                  </div>
                  <span className="fs-count">{rejectedCount}</span>
                  <span className="fs-pct">{totalQuotes > 0 ? Math.round((rejectedCount / totalQuotes) * 100) : 0}%</span>
                </div>
              </div>
            </div>

            <div className="activity-panel">
              <div className="ap-title">Recent Activity</div>
              <div className="activity-list">
                {enriched.slice(0, 5).map((e, idx, arr) => (
                  <div className="act-item" key={e.id || idx}>
                    <div className="act-dot-col">
                      <div className="act-dot" style={{ background: e.status === "approved" || e.status === "converted" ? "var(--green)" : e.status === "sent" ? "var(--blue)" : e.status === "rejected" ? "var(--app-text)" : "var(--app-accent)" }}></div>
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

        {/* Send to Client Portal Popup */}
        {showSendPopup && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowSendPopup(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#FFFFFF', borderRadius: 16, padding: 24, width: 420, maxWidth: '92vw' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>Send to Client Portal</div>
                <i className="ti ti-x" style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setShowSendPopup(false)}></i>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>Select Client</div>
              <select value={targetPortalClient} onChange={e => setTargetPortalClient(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, marginBottom: 20 }}>
                <option value="">-- Select Client --</option>
                {(clients || []).map(c => (
                  <option key={c._id || c.clientName || c.name} value={c.clientName || c.name}>{c.clientName || c.name}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowSendPopup(false)} style={{ flex: 1, padding: '10px', background: '#F8FAFC', color: '#1E293B', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => handleSendQuotationToPortal(targetPortalClient)} disabled={!targetPortalClient} style={{ flex: 1, padding: '10px', background: '#16A34A', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: !targetPortalClient ? 'not-allowed' : 'pointer', opacity: !targetPortalClient ? 0.5 : 1 }}>Send Now</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  // ---------- PREVIEW ----------
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
    let qrData = `${FRONTEND_URL}/quotation-view?d=${encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(slimPayload)))))}`;
    if (qrData.length > 1000) qrData = `${FRONTEND_URL}/quotation-view?no=${qt.quoteNo}`;

    const isMobileView = typeof window !== "undefined" && window.innerWidth < 769;
    return isMobileView ? (
      <div style={{ position: "fixed", inset: 0, zIndex: 999999, background: "rgba(15, 23, 42, 0.55)", padding: "20px 12px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => { if (onBackOverride) onBackOverride(); else setStep("list"); }}>
      <div className="print-wrapper quotation-mobile-popup-scope" onClick={(e) => e.stopPropagation()} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#FFFFFF", borderRadius: 16, overflow: "hidden", maxWidth: 830, width: "100%", maxHeight: "calc(100vh - 32px)", boxShadow: "0 32px 80px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column" }}>
     <style>{`
        @media screen {
          .quotation-mobile-popup-scope, .quotation-mobile-popup-scope * { box-sizing: border-box !important; max-width: 100% !important; }
          .quotation-mobile-popup-scope { overflow-x: hidden !important; }
          .quotation-mobile-popup-scope .qt-paper { max-width: 100% !important; width: 100% !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; min-height: auto !important; }
          .quotation-mobile-popup-scope .qt-hgrid { flex-direction: row !important; flex-wrap: nowrap !important; gap: 8px !important; align-items: flex-start !important; }
          .quotation-mobile-popup-scope .qt-hgrid > div { min-width: 0 !important; flex: 1 1 50% !important; }
          .quotation-mobile-popup-scope .qt-hgrid > div:last-child { text-align: right !important; }
          .quotation-mobile-popup-scope .qt-btgrid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .quotation-mobile-popup-scope .qt-btgrid > div {
            padding: 10px !important;
            min-width: 0 !important;
          }
          .quotation-mobile-popup-scope .qt-btgrid [style*="fontSize: 17"],
          .quotation-mobile-popup-scope .qt-btgrid [style*="fontSize: 15"] {
            font-size: 12px !important;
            word-break: break-word;
          }
          .quotation-mobile-popup-scope .qt-hgrid [style*="fontSize: 24"] { font-size: 13px !important; }
          .quotation-mobile-popup-scope .qt-hgrid [style*="fontSize: 32"] { font-size: 15px !important; }
          .quotation-mobile-popup-scope .qt-hgrid [style*="fontSize: 16"] { font-size: 11px !important; }
          .quotation-mobile-popup-scope .qt-hgrid [style*="fontSize: 12"] { font-size: 9px !important; }
          .quotation-mobile-popup-scope .qt-hgrid [style*="fontSize: 9"] { font-size: 8px !important; }
          .quotation-mobile-popup-scope .qt-hgrid img { height: 40px !important; }
          .quotation-mobile-popup-scope .qt-hgrid > div:first-child [style*="width: 60"] { width: 32px !important; height: 32px !important; font-size: 14px !important; }
          .quotation-mobile-popup-scope .qt-table-wrap { overflow-x: auto !important; padding: 12px !important; }
          .quotation-mobile-popup-scope table { min-width: 0 !important; font-size: 10px !important; }
          .quotation-mobile-popup-scope th, .quotation-mobile-popup-scope td { padding: 6px !important; font-size: 10px !important; }
          .quotation-mobile-popup-scope input, .quotation-mobile-popup-scope select, .quotation-mobile-popup-scope textarea {
            font-size: 11px !important; padding: 6px 8px !important; height: auto !important; width: 100% !important;
          }
          .quotation-mobile-popup-scope [style*="padding: 28px 32px"],
          .quotation-mobile-popup-scope [style*="padding: \\"20px 32px\\""],
          .quotation-mobile-popup-scope [style*="padding: \\"22px 32px\\""] {
            padding: 12px !important;
          }
          .quotation-mobile-popup-scope [style*="fontSize: 24"] { font-size: 16px !important; }
          .quotation-mobile-popup-scope [style*="fontSize: 32"] { font-size: 18px !important; }
          .quotation-mobile-popup-scope [style*="fontSize: 17"] { font-size: 13px !important; }
          .quotation-mobile-popup-scope [style*="fontSize: 15"] { font-size: 12px !important; }
          .quotation-mobile-popup-scope [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          .quotation-mobile-popup-scope .qt-btgrid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .quotation-mobile-popup-scope .qt-btgrid > div {
            padding: 10px !important;
            min-width: 0 !important;
          }
          .quotation-mobile-popup-scope .qt-btgrid [style*="fontSize: 17"],
          .quotation-mobile-popup-scope .qt-btgrid [style*="fontSize: 15"] {
            font-size: 12px !important;
            word-break: break-word;
          }
          .quotation-mobile-popup-scope button { font-size: 11px !important; padding: 7px 10px !important; }
        }
        `}</style>
        {toastMsg && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 99999, background: '#1E293B', color: '#FFFFFF', borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-check" style={{ fontSize: 15, color: '#16A34A' }}></i> {toastMsg}
          </div>
        )}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
          * { box-sizing: border-box; }
          .qt-paper { position: relative; max-width: 794px; margin: 0 auto; background: #FFFFFF; border-radius: 18px; box-shadow: 0 24px 80px rgba(22, 163, 74, 0.15); display: flex; flex-direction: column; min-height: 1122px; }
          @media print {
            @page { size: A4 portrait; margin: 10mm; }
            html, body { margin: 0 !important; padding: 0 !important; height: auto !important; min-height: 0 !important; overflow: visible !important; background: white !important; }
            .no-print, .no-print * { display: none !important; }
            .print-wrapper { background: white !important; padding: 0 !important; min-height: 0 !important; display: block !important; }
            .qt-paper { 
              position: relative !important; top: auto !important; left: auto !important; 
              width: 100% !important; max-width: 100% !important; margin: 0 !important; 
              border-radius: 0 !important; box-shadow: none !important; 
              overflow: visible !important; min-height: 0 !important; height: auto !important;
              page-break-after: always; break-after: page;
              transform: scale(0.96);
              transform-origin: top left;
            }
            .qt-paper:last-child {
              page-break-after: auto; break-after: auto;
            }
            .qt-table-wrap { overflow-x: visible !important; overflow: visible !important; }
            .flex-spacer { display: none !important; }
            body > div { height: auto !important; min-height: 0 !important; padding: 0 !important; margin: 0 !important; }
          }
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }
@media (max-width:600px) { .qt-hgrid { flex-direction:column!important; } .qt-btgrid { grid-template-columns:1fr!important; } }
          @media (max-width:600px) { .stats-row { grid-template-columns:repeat(2,1fr)!important; } }
        `}</style>

        <div className="no-print" style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", padding: "20px 20px 12px", flexShrink: 0 }}>

          <button onClick={() => { if (onBackOverride) { onBackOverride(); } else { setViewEntry(null); setStep("list"); } }} style={{ padding: "10px 18px", background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#1E293B", fontFamily: "inherit" }}>Document List</button>
          <button onClick={() => {
            const isMobile = typeof window !== "undefined" && window.innerWidth < 769;
            if (isMobile) {
              loadEntry(viewEntry);
              setStep("form");
            } else if (onEditQuotation && viewEntry) {
              onEditQuotation(viewEntry);
            } else {
              setStep("form");
            }
          }} style={{ padding: "10px 18px", background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#1E293B", fontFamily: "inherit" }}>Edit</button>
          <button onClick={async () => {
            const node = document.querySelector('.qt-paper');
            if (!node) return;
            const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: '#FFFFFF' });
            const imgData = canvas.toDataURL('image/png');
            const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const pageWidth = 210;
            const pageHeight = 297;
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            while (heightLeft > 0) {
              position = heightLeft - imgHeight;
              doc.addPage();
              doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }
            const blob = doc.output('blob');
            const fileName = `Quotation_${qt.quoteNo || 'draft'}.pdf`;
            const file = new File([blob], fileName, { type: 'application/pdf' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              try {
                await navigator.share({ files: [file] });
                return;
              } catch (e) {
                if (e.name === "AbortError") return;
              }
            }
            doc.save(fileName);
            showToast('Sharing not supported on this device — PDF downloaded instead.');
          }} style={{ padding: "10px 18px", background: "#EFF6FF", border: "1.5px solid #E2E8F0", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#2563EB", fontFamily: "inherit" }}>Share</button>  <button onClick={() => window.print()} style={{ padding: "10px 22px", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#FFFFFF", fontFamily: "inherit" }}>Print / PDF</button>
        </div>

        <div className="qt-paper print-container" style={{ overflowY: "auto", flex: 1, padding: "0 20px 20px", margin: 0, maxWidth: "100%" }}>
          {/* Header */}
          <div className="avoid-break" style={{ background: "#F8FAFC", padding: "28px 32px", position: "relative", overflow: "visible", flexShrink: 0, borderBottom: "1px solid #E2E8F0" }}>
            <div style={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,rgba(22, 163, 74, 0.05),transparent)", top: -80, right: -40, pointerEvents: "none" }} />
            <div className="qt-hgrid" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", gap: 20 }}>
              <div>
                {effectiveLogo ? (
                  <img src={effectiveLogo} alt="logo" style={{ height: 85, borderRadius: 10, marginBottom: 12, objectFit: "contain" }} />
                ) : (
                  <div style={{ height: 60, width: 60, background: "var(--app-accent)", borderRadius: 10, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: "#FFFFFF" }}>
                    {effectiveCompanyName[0] || "?"}
                  </div>
                )}
                <div style={{ fontSize: 24, fontWeight: 900, color: "#1E293B", textTransform: "uppercase", letterSpacing: 1 }}>{qt.companyName || effectiveCompanyName}</div>
                {qt.companyEmail && <div style={{ fontSize: 11, color: "#1E293B", marginTop: 3 }}>{qt.companyEmail}</div>}
                {qt.companyPhone && <div style={{ fontSize: 11, color: "#1E293B", marginTop: 2 }}>{qt.companyPhone}</div>}
                {qt.companyAddress && <div style={{ fontSize: 11, color: "#1E293B", marginTop: 2 }}>{qt.companyAddress}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: "rgba(22, 163, 74, 0.1)", letterSpacing: -2, lineHeight: 1, marginBottom: 4 }}>QUOTATION</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--app-accent)" }}>{qt.quoteNo}</div>
                {qt.refNo && <div style={{ fontSize: 11, color: "#1E293B", marginTop: 3 }}>Ref # {qt.refNo}</div>}
                <div style={{ marginTop: 14, display: "flex", gap: 20, justifyContent: "flex-end" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>DATE</div>
                    <div style={{ fontSize: 12, color: "#1E293B", fontWeight: 700 }}>{formatDate(qt.date)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>VALID UNTIL</div>
                    <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>{formatDate(qt.expiryDate)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prepared for */}
          <div className="qt-btgrid avoid-break" style={{ display: "grid", gridTemplateColumns: qt.project ? "1fr 1fr" : "1fr", borderBottom: "2px solid #F8FAFC", flexShrink: 0 }}>
            <div style={{ padding: "20px 32px", borderRight: qt.project ? "1px solid #F8FAFC" : "none" }}>
              <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>PREPARED FOR</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>{qt.client || "—"}</div>
              {selectedClient?.companyName && <div style={{ fontSize: 13, color: "var(--app-accent)", fontWeight: 600, marginTop: 2 }}>{selectedClient.companyName}</div>}
              {selectedClient?.email && <div style={{ fontSize: 12, color: "#64748B", marginTop: 5 }}> {selectedClient.email}</div>}
              {selectedClient?.phone && <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}> {selectedClient.phone}</div>}
              {selectedClient?.gstNumber && <div style={{ fontSize: 12, color: "var(--app-accent)", marginTop: 4, fontWeight: 600 }}> GST: {selectedClient.gstNumber}</div>}
            </div>
            {qt.project && (
              <div style={{ padding: "20px 32px" }}>
                <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>PROJECT</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{qt.project}</div>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="qt-table-wrap" style={{ padding: "22px 32px", overflowX: "auto", flexShrink: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 360 }}>
              <thead>
                <tr className="avoid-break" style={{ background: "linear-gradient(90deg,#F8FAFC,#F8FAFC)" }}>
                  {["#", "Description", "Qty", "Unit Rate", "Amount"].map((h, i) => (
                    <th key={i} style={{ padding: "9px 11px", fontSize: 9, fontWeight: 700, color: "var(--app-accent)", letterSpacing: 1.5, borderBottom: "2px solid #E2E8F0", textAlign: ["Amount", "Unit Rate", "Qty"].includes(h) ? "right" : "left" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className="avoid-break" style={{ borderBottom: "1px solid #F8FAFC" }}>
                    <td style={{ padding: "12px 11px", color: "#64748B", fontWeight: 700, fontSize: 12 }}>{String(idx + 1).padStart(2, "0")}</td>
                    <td style={{ padding: "12px 11px", fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{item.description || "—"}</td>
                    <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 13, color: "#1E293B" }}>{item.quantity}</td>
                    <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 13, color: "#1E293B" }}>{formatCurrency(item.rate, qt.currency)}</td>
                    <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{formatCurrency((parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0), qt.currency)}</td>
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
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F8FAFC" }}>
                    <span style={{ fontSize: 12, color: "#64748B" }}>{l}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", background: "#F8FAFC", borderRadius: 12, marginTop: 8, border: "1.5px solid #E2E8F0" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#64748B" }}>BALANCE DUE</span>
                  <span style={{ fontSize: 19, fontWeight: 900, color: "#1E293B" }}>{formatCurrency(balanceDue, qt.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes + QR */}
          <div className="avoid-break" style={{ padding: "0 32px 24px", display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "flex-start", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {qt.notes && (
                <div style={{ background: "#F8FAFC", borderRadius: 11, padding: "14px 16px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>NOTES</div>
                  <div style={{ fontSize: 12, color: "#1E293B", lineHeight: 1.7 }}>{qt.notes}</div>
                </div>
              )}
              {qt.terms && (
                <div style={{ background: "#F8FAFC", borderRadius: 11, padding: "14px 16px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>TERMS & CONDITIONS</div>
                  <div style={{ fontSize: 12, color: "#1E293B", lineHeight: 1.7 }}>{qt.terms}</div>
                </div>
              )}
              {(qt.upiId || qt.bankName) && (
                <div style={{ background: "#F8FAFC", borderRadius: 11, padding: "14px 16px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}> PAYMENT INSTRUCTIONS</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
                    {qt.upiId && (
                      <div>
                        <div style={{ fontSize: 9, color: "#64748B", fontWeight: 700 }}>UPI ID</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{qt.upiId}</div>
                      </div>
                    )}
                    {qt.bankName && (
                      <>
                        <div>
                          <div style={{ fontSize: 9, color: "#64748B", fontWeight: 700 }}>BANK NAME</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{qt.bankName}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: "#64748B", fontWeight: 700 }}>ACCOUNT NAME</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{qt.accountName}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: "#64748B", fontWeight: 700 }}>ACCOUNT NUMBER</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", fontFamily: "monospace" }}>{qt.accountNumber}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: "#64748B", fontWeight: 700 }}>IFSC CODE</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", fontFamily: "monospace" }}>{qt.ifscCode}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#F8FAFC", borderRadius: 12, padding: "14px 16px", border: "1px solid #E2E8F0", minWidth: 110 }}>
              <div style={{ fontSize: 8, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 8, textAlign: "center" }}>SCAN QUOTE</div>
              <div style={{ background: "#FFFFFF", padding: 6, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                <QRCodeSVG value={qrData} size={88} bgColor="#FFFFFF" fgColor="#1E293B" />
              </div>
              <div style={{ fontSize: 8, color: "#64748B", marginTop: 7, textAlign: "center", fontWeight: 600 }}>{qt.quoteNo}</div>
            </div>
          </div>

          <div className="flex-spacer" style={{ flex: 1 }} />

          {/* Footer */}
          <div style={{ background: "#FFFFFF", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, borderTop: "2px solid #EFF6FF", pageBreakBefore: "auto", breakBefore: "auto" }}>
            <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>{effectiveCompanyName}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2563EB" }}>{qt.footerMessage}</div>
            <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>{qt.quoteNo}</div>
          </div>
        </div>
     </div>
      </div>
    ) : (
      <div className="print-wrapper" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#EFF6FF", minHeight: "100vh", padding: "20px 12px" }}>
        {toastMsg && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 99999, background: '#1E293B', color: '#FFFFFF', borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-check" style={{ fontSize: 15, color: '#16A34A' }}></i> {toastMsg}
          </div>
        )}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
          * { box-sizing: border-box; }
          .qt-paper { position: relative; max-width: 794px; margin: 0 auto; background: #FFFFFF; border-radius: 18px; box-shadow: 0 24px 80px rgba(22, 163, 74, 0.15); display: flex; flex-direction: column; min-height: 1122px; }
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
              page-break-after: always; break-after: page;
            }
            .qt-paper:last-child {
              page-break-after: auto; break-after: auto;
            }
            .qt-table-wrap { overflow-x: visible !important; overflow: visible !important; }
            .flex-spacer { display: none !important; }
            body > div { height: auto !important; min-height: 0 !important; padding: 0 !important; margin: 0 !important; }
          }
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }
@media (max-width:600px) and (min-resolution: 1dppx) { }
          @media (max-width:600px) { .stats-row { grid-template-columns:repeat(2,1fr)!important; } }
        `}</style>

        <div className="no-print" style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>

        <button onClick={() => { if (onBackOverride) { onBackOverride(); } else { setViewEntry(null); setStep("list"); } }} style={{ padding: "10px 18px", background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#1E293B", fontFamily: "inherit" }}>Document List</button>
       <button onClick={() => {
            const isMobile = typeof window !== "undefined" && window.innerWidth < 769;
            if (isMobile) {
              loadEntry(viewEntry);
              setStep("form");
            } else if (onEditQuotation && viewEntry) {
              onEditQuotation(viewEntry);
            } else {
              setStep("form");
            }
          }} style={{ padding: "10px 18px", background: "#FFFFFF", border: "1.5px solid #E2E8F0", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#1E293B", fontFamily: "inherit" }}>Edit</button>
          <button onClick={async () => {
            const node = document.querySelector('.qt-paper');
            if (!node) return;
            const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: '#FFFFFF' });
            const imgData = canvas.toDataURL('image/png');
            const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const pageWidth = 210;
            const pageHeight = 297;
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            while (heightLeft > 0) {
              position = heightLeft - imgHeight;
              doc.addPage();
              doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }
            const blob = doc.output('blob');
            const fileName = `Quotation_${qt.quoteNo || 'draft'}.pdf`;
            const file = new File([blob], fileName, { type: 'application/pdf' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              try {
                await navigator.share({ files: [file] });
                return;
              } catch (e) {
                if (e.name === "AbortError") return;
              }
            }
            doc.save(fileName);
            showToast('Sharing not supported on this device — PDF downloaded instead.');
          }} style={{ padding: "10px 18px", background: "#EFF6FF", border: "1.5px solid #E2E8F0", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#2563EB", fontFamily: "inherit" }}>Share</button>  <button onClick={() => window.print()} style={{ padding: "10px 22px", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#FFFFFF", fontFamily: "inherit" }}>Print / PDF</button>
        </div>

        <div className="qt-paper print-container">
          <div className="avoid-break" style={{ background: "#F8FAFC", padding: "28px 32px", position: "relative", overflow: "visible", flexShrink: 0, borderBottom: "1px solid #E2E8F0" }}>
            <div style={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,rgba(22, 163, 74, 0.05),transparent)", top: -80, right: -40, pointerEvents: "none" }} />
            <div className="qt-hgrid" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", gap: 20 }}>
              <div>
                {effectiveLogo ? (
                  <img src={effectiveLogo} alt="logo" style={{ height: 85, borderRadius: 10, marginBottom: 12, objectFit: "contain" }} />
                ) : (
                  <div style={{ height: 60, width: 60, background: "var(--app-accent)", borderRadius: 10, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: "#FFFFFF" }}>
                    {effectiveCompanyName[0] || "?"}
                  </div>
                )}
                <div style={{ fontSize: 24, fontWeight: 900, color: "#1E293B", textTransform: "uppercase", letterSpacing: 1 }}>{qt.companyName || effectiveCompanyName}</div>
                {qt.companyEmail && <div style={{ fontSize: 11, color: "#1E293B", marginTop: 3 }}>{qt.companyEmail}</div>}
                {qt.companyPhone && <div style={{ fontSize: 11, color: "#1E293B", marginTop: 2 }}>{qt.companyPhone}</div>}
                {qt.companyAddress && <div style={{ fontSize: 11, color: "#1E293B", marginTop: 2 }}>{qt.companyAddress}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: "rgba(22, 163, 74, 0.1)", letterSpacing: -2, lineHeight: 1, marginBottom: 4 }}>QUOTATION</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--app-accent)" }}>{qt.quoteNo}</div>
                {qt.refNo && <div style={{ fontSize: 11, color: "#1E293B", marginTop: 3 }}>Ref # {qt.refNo}</div>}
                <div style={{ marginTop: 14, display: "flex", gap: 20, justifyContent: "flex-end" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>DATE</div>
                    <div style={{ fontSize: 12, color: "#1E293B", fontWeight: 700 }}>{formatDate(qt.date)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>VALID UNTIL</div>
                    <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>{formatDate(qt.expiryDate)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="qt-btgrid avoid-break" style={{ display: "grid", gridTemplateColumns: qt.project ? "1fr 1fr" : "1fr", borderBottom: "2px solid #F8FAFC", flexShrink: 0 }}>
            <div style={{ padding: "20px 32px", borderRight: qt.project ? "1px solid #F8FAFC" : "none" }}>
              <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>PREPARED FOR</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>{qt.client || "—"}</div>
              {selectedClient?.companyName && <div style={{ fontSize: 13, color: "var(--app-accent)", fontWeight: 600, marginTop: 2 }}>{selectedClient.companyName}</div>}
              {selectedClient?.email && <div style={{ fontSize: 12, color: "#64748B", marginTop: 5 }}> {selectedClient.email}</div>}
              {selectedClient?.phone && <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}> {selectedClient.phone}</div>}
              {selectedClient?.gstNumber && <div style={{ fontSize: 12, color: "var(--app-accent)", marginTop: 4, fontWeight: 600 }}> GST: {selectedClient.gstNumber}</div>}
            </div>
            {qt.project && (
              <div style={{ padding: "20px 32px" }}>
                <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>PROJECT</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{qt.project}</div>
              </div>
            )}
          </div>

          <div className="qt-table-wrap" style={{ padding: "22px 32px", overflowX: "auto", flexShrink: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 360 }}>
              <thead>
                <tr className="avoid-break" style={{ background: "linear-gradient(90deg,#F8FAFC,#F8FAFC)" }}>
                  {["#", "Description", "Qty", "Unit Rate", "Amount"].map((h, i) => (
                    <th key={i} style={{ padding: "9px 11px", fontSize: 9, fontWeight: 700, color: "var(--app-accent)", letterSpacing: 1.5, borderBottom: "2px solid #E2E8F0", textAlign: ["Amount", "Unit Rate", "Qty"].includes(h) ? "right" : "left" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className="avoid-break" style={{ borderBottom: "1px solid #F8FAFC" }}>
                    <td style={{ padding: "12px 11px", color: "#64748B", fontWeight: 700, fontSize: 12 }}>{String(idx + 1).padStart(2, "0")}</td>
                    <td style={{ padding: "12px 11px", fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{item.description || "—"}</td>
                    <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 13, color: "#1E293B" }}>{item.quantity}</td>
                    <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 13, color: "#1E293B" }}>{formatCurrency(item.rate, qt.currency)}</td>
                    <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{formatCurrency((parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0), qt.currency)}</td>
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
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F8FAFC" }}>
                    <span style={{ fontSize: 12, color: "#64748B" }}>{l}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", background: "#F8FAFC", borderRadius: 12, marginTop: 8, border: "1.5px solid #E2E8F0" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#64748B" }}>BALANCE DUE</span>
                  <span style={{ fontSize: 19, fontWeight: 900, color: "#1E293B" }}>{formatCurrency(balanceDue, qt.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="avoid-break" style={{ padding: "0 32px 24px", display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "flex-start", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {qt.notes && (
                <div style={{ background: "#F8FAFC", borderRadius: 11, padding: "14px 16px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>NOTES</div>
                  <div style={{ fontSize: 12, color: "#1E293B", lineHeight: 1.7 }}>{qt.notes}</div>
                </div>
              )}
              {qt.terms && (
                <div style={{ background: "#F8FAFC", borderRadius: 11, padding: "14px 16px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>TERMS & CONDITIONS</div>
                  <div style={{ fontSize: 12, color: "#1E293B", lineHeight: 1.7 }}>{qt.terms}</div>
                </div>
              )}
              {(qt.upiId || qt.bankName) && (
                <div style={{ background: "#F8FAFC", borderRadius: 11, padding: "14px 16px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}> PAYMENT INSTRUCTIONS</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
                    {qt.upiId && (
                      <div>
                        <div style={{ fontSize: 9, color: "#64748B", fontWeight: 700 }}>UPI ID</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{qt.upiId}</div>
                      </div>
                    )}
                    {qt.bankName && (
                      <>
                        <div>
                          <div style={{ fontSize: 9, color: "#64748B", fontWeight: 700 }}>BANK NAME</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{qt.bankName}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: "#64748B", fontWeight: 700 }}>ACCOUNT NAME</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{qt.accountName}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: "#64748B", fontWeight: 700 }}>ACCOUNT NUMBER</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", fontFamily: "monospace" }}>{qt.accountNumber}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: "#64748B", fontWeight: 700 }}>IFSC CODE</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", fontFamily: "monospace" }}>{qt.ifscCode}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#F8FAFC", borderRadius: 12, padding: "14px 16px", border: "1px solid #E2E8F0", minWidth: 110 }}>
              <div style={{ fontSize: 8, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 8, textAlign: "center" }}>SCAN QUOTE</div>
              <div style={{ background: "#FFFFFF", padding: 6, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                <QRCodeSVG value={qrData} size={88} bgColor="#FFFFFF" fgColor="#1E293B" />
              </div>
              <div style={{ fontSize: 8, color: "#64748B", marginTop: 7, textAlign: "center", fontWeight: 600 }}>{qt.quoteNo}</div>
            </div>
          </div>

          <div className="flex-spacer" style={{ flex: 1 }} />

          <div style={{ background: "#FFFFFF", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, borderTop: "2px solid #EFF6FF", pageBreakBefore: "auto", breakBefore: "auto" }}>
            <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>{effectiveCompanyName}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2563EB" }}>{qt.footerMessage}</div>
            <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>{qt.quoteNo}</div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- FORM ----------
  if (step === "template") {
    return (
      <div style={{ width: "100%", height: "80vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "10px 0", display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setStep("list")} style={{ padding: "8px 14px", background: "var(--app-bg)", border: "1.5px solid var(--app-border)", borderRadius: 8, cursor: "pointer", fontWeight: 700, color: "var(--app-muted)" }}> Back to List</button>
        </div>
        <div style={{ flex: 1, overflow: "hidden", borderRadius: 16 }}>
          <iframe src="/template-designer.html#quo" ref={iframeRef} onLoad={sendThemeToIframe} style={{ width: "100%", height: "100%", border: "none" }} title="Template Designer" />
        </div>
      </div>
    );
  }

 const hasErrors = Object.keys(errors).length > 0;
  const isMobileFormView = typeof window !== "undefined" && window.innerWidth < 769;
  const formInner = (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input:focus,select:focus,textarea:focus { border-color: var(--app-accent) !important; box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1); }
        @keyframes shake { 0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)} }
        .shake { animation: shake 0.35s ease; }
        @media (max-width:600px) { .f2col { grid-template-columns:1fr!important; } .f3col { grid-template-columns:1fr 1fr!important; } }
        /* Hide Arrows in Number Inputs */
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* Top nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <button onClick={() => setStep("list")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--app-accent)", fontWeight: 700, padding: 0, fontFamily: "inherit" }}> Back</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={clearForm} style={{ padding: "8px 14px", background: "#FFFFFF", border: "1.5px solid #F8FAFC", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#64748B", fontFamily: "inherit" }}>Clear</button>
          <button onClick={handleSaveDraft} disabled={!!saving}
            style={{ padding: "8px 18px", background: draftSaved ? "#16A34A" : "#FFFFFF", border: `1.5px solid ${draftSaved ? "#16A34A" : "#E2E8F0"}`, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", color: draftSaved ? "#FFFFFF" : "#1E293B", fontFamily: "inherit", transition: "all 0.3s" }}>
            {saving === "draft" ? "Saving…" : draftSaved ? "Success Saved!" : " Save Draft"}
          </button>
          <button onClick={handleSavePreview} disabled={!!saving}
            style={{ padding: "8px 22px", background: saving === "preview" ? "#64748B" : "linear-gradient(135deg,var(--app-accent),var(--app-muted))", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", color: "#FFFFFF", fontFamily: "inherit" }}>
            {saving === "preview" ? "Saving…" : "Preview "}
          </button>
        </div>
      </div>



      {/* Quote Details */}
      <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "20px 24px", border: "1px solid #F8FAFC", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 16 }}>Quotation Details</div>
        <div className="f2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={lbl}>Quote Number</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input value={qt.quoteNo} onChange={(e) => upd("quoteNo", e.target.value)} style={{ ...inp(), flex: 1 }} />
              <button onClick={() => upd("quoteNo", generateQuoteNo())} style={{ padding: "0 10px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 8, cursor: "pointer", fontSize: 14, color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center" }}><i className="ti ti-refresh" style={{ fontSize: 15 }}></i></button>
            </div>
          </div>
          <div>
            <label style={lbl}>Quote Date</label>
            <input type="date" value={qt.date} onChange={(e) => upd("date", e.target.value)} style={inp()} />
          </div>
        </div>
      </div>



      {/* Company Name */}
      <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "20px 24px", border: errors.client ? "1.5px solid #E2E8F0" : "1px solid #F8FAFC", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 16 }}>Company & Project</div>
        <div className="f2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ ...lbl, color: errors.client ? "#64748B" : "#64748B" }}>Company Name *</label>
            <CompanyDropdown clients={clients} value={qt.client}
              onChange={(val) => { upd("client", val); upd("project", ""); setErrors((p) => { const n = { ...p }; delete n.client; return n; }); }}
              error={errors.client} onAddCompany={onAddClient} />
            {errors.client && <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, fontWeight: 600 }}>Warning {errors.client}</div>}
          </div>
          <div>
            <label style={lbl}>Project <span style={{ color: "#E2E8F0" }}></span></label>
            <ProjectDropdown projects={filteredProjects} value={qt.project}
              onChange={(val) => upd("project", val)}
              onAddProject={onAddProject}
              disabled={!qt.client} />
          </div>
        </div>
        {selectedClient && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#F8FAFC", borderRadius: 8, display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[["", selectedClient.email], ["", selectedClient.phone], ["Location", selectedClient.address], ["", selectedClient.gstNumber]].filter(([, v]) => v).map(([icon, val], i) => (
              <span key={i} style={{ fontSize: 12, color: "#64748B" }}>{icon} {val}</span>
            ))}
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "20px 24px", border: "1px solid #F8FAFC", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>Items / Services</div>
          <button onClick={addItem} style={{ padding: "6px 14px", background: "linear-gradient(135deg,var(--app-accent),#16A34A)", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", color: "#FFFFFF", fontFamily: "inherit" }}>+ Add Item</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 36px", gap: 8, paddingBottom: 8, borderBottom: "1px solid #F8FAFC", marginBottom: 8 }}>
          {["Description", "Qty", `Rate (${qt.currency || "₹"})`, ""].map((h, i) => <div key={i} style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>{h}</div>)}
        </div>
        {items.map((item, idx) => {
          const dErr = errors[`item_${item.id}_description`];
          const rErr = errors[`item_${item.id}_rate`];
          return (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 36px", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <div>
                <input value={item.description} onChange={(e) => updItem(item.id, "description", e.target.value)} placeholder={`Item ${idx + 1} description`} style={{ ...inp(dErr), fontSize: 13 }} />
                {dErr && <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Warning Required</div>}
              </div>
              <input type="number" min="1" value={item.quantity} onChange={(e) => updItem(item.id, "quantity", e.target.value)} onWheel={(e) => e.target.blur()} style={{ ...inp(), textAlign: "center", fontSize: 13 }} />
              <div>
                <input type="number" min="0" value={item.rate} onChange={(e) => updItem(item.id, "rate", e.target.value)} onWheel={(e) => e.target.blur()} placeholder="0.00" style={{ ...inp(rErr), textAlign: "right", fontSize: 13 }} />
                {rErr && <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Warning Required</div>}
              </div>
              <button onClick={() => removeItem(item.id)} disabled={items.length === 1}
                style={{ width: 32, height: 42, borderRadius: 8, background: items.length === 1 ? "#F8FAFC" : "#E2E8F0", border: "none", cursor: items.length === 1 ? "not-allowed" : "pointer", fontSize: 13, color: items.length === 1 ? "#E2E8F0" : "#64748B", display: "flex", alignItems: "center", justifyContent: "center" }}><i className="ti ti-trash" style={{ fontSize: 15 }}></i></button>
            </div>
          );
        })}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <div style={{ minWidth: 220 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F8FAFC" }}>
              <span style={{ fontSize: 13, color: "#64748B" }}>Subtotal</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(subtotal, qt.currency)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F8FAFC" }}>
              <span style={{ fontSize: 13, color: "#64748B" }}>GST ({qt.gstRate}%){qt.isGstIncluded ? " (Incl.)" : ""}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(gstAmt, qt.currency)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "linear-gradient(135deg,#1E293B,var(--app-accent))", borderRadius: 10, marginTop: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#E2E8F0" }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#FFFFFF" }}>{formatCurrency(total, qt.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes & Terms */}
      <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "20px 24px", border: "1px solid #F8FAFC", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 16 }}>Notes & Terms <span style={{ color: "#E2E8F0", fontWeight: 500 }}></span></div>
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
          style={{ padding: "13px", background: draftSaved ? "#16A34A" : "#FFFFFF", border: `1.5px solid ${draftSaved ? "#16A34A" : "#E2E8F0"}`, borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", color: draftSaved ? "#FFFFFF" : "#1E293B", fontFamily: "inherit", transition: "all 0.3s" }}>
          {saving === "draft" ? "Saving…" : draftSaved ? "Success Saved as Draft!" : " Save Draft"}
        </button>
        <button onClick={handleSavePreview} disabled={!!saving}
          style={{ padding: "13px", background: saving === "preview" ? "#64748B" : "linear-gradient(135deg,#1E293B,var(--app-accent))", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: saving ? "not-allowed" : "pointer", color: "#FFFFFF", fontFamily: "inherit" }}>
          {saving === "preview" ? "Saving…" : "Preview & Print "}
        </button>
      </div>
    </div>
  );

  if (isMobileFormView) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 999999, background: "rgba(15, 23, 42, 0.55)", padding: "20px 12px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => { if (onBackOverride) onBackOverride(); else setStep("list"); }}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: "#FFFFFF", borderRadius: 16, overflow: "hidden", maxWidth: 830, width: "100%", maxHeight: "calc(100vh - 32px)", boxShadow: "0 32px 80px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column" }}>
          <div style={{ overflowY: "auto", padding: "16px" }}>
            {formInner}
          </div>
        </div>
      </div>
    );
  }

  return formInner;
}



