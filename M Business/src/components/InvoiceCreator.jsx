import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import axios from "axios";
import { BASE_URL, FRONTEND_URL } from "../config";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const GST_RATES = [0, 5, 12, 18, 28];
const DEFAULT_LOGO_URL = "";

function generateInvoiceNo() {
  return `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
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

// ── Status Badge ─────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    paid: { bg: "#dcfce7", color: "#16a34a", label: "✅ Paid" },
    unpaid: { bg: "#fff7ed", color: "#ea580c", label: "⏳ Unpaid" },
    overdue: { bg: "#fee2e2", color: "#dc2626", label: "🔴 Overdue" },
    draft: { bg: "var(--app-surface)", color: "var(--app-muted)", label: "📝 Draft" },
    sent: { bg: "#eff6ff", color: "#2563eb", label: "📤 Sent" },
    part_paid: { bg: "var(--app-bg)", color: "var(--app-accent)", label: "💰 Part Payment" },
  };
  const s = map[(status || "draft").toLowerCase()] || map.draft;
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
      {s.label}
    </span>
  );
}

// ── Confirm Delete Modal ──────────────────────────────────────
function ConfirmModal({ invoiceNo, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "var(--app-card)", borderRadius: 24, width: "100%", maxWidth: 380, padding: "32px", boxShadow: "var(--app-shadow)", textAlign: "center", border: "1px solid var(--app-border)" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px" }}>Delete</div>
        <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 800, color: "var(--app-text)" }}>Delete Invoice?</h3>
        <p style={{ color: "var(--app-muted)", fontSize: 14, margin: "0 0 24px", lineHeight: 1.5 }}>
          Are you sure you want to delete <strong style={{ color: "var(--app-accent)" }}>{invoiceNo}</strong>? This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "12px", background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "var(--app-text)", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "12px", background: "#ef4444", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "var(--app-card)", border: "2px solid #22c55e", borderRadius: 16, padding: "14px 24px", fontSize: 14, fontWeight: 800, color: "#22c55e", boxShadow: "var(--app-shadow)", display: "flex", alignItems: "center", gap: 10, animation: "fadeInUp 0.3s ease-out" }}>
      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <span>✨</span>
      {msg}
    </div>
  );
}

// ── LocalStorage helpers ──────────────────────────────────────
const DRAFTS_KEY = "invoice_drafts";
function loadAllDrafts() {
  try { const d = localStorage.getItem(DRAFTS_KEY); return d ? JSON.parse(d) : []; } catch { return []; }
}
function saveDraftLocal(inv, items, status = "draft") {
  const drafts = loadAllDrafts();
  const id = inv.invoiceNo;
  const existing = drafts.findIndex((d) => d.id === id);
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseFloat(i.quantity) || 0), 0);
  const total = subtotal * (1 + inv.gstRate / 100);
  const entry = { id, invoiceNo: inv.invoiceNo, client: inv.client || "—", total, savedAt: Date.now(), inv, items, status };
  if (existing >= 0) drafts[existing] = entry; else drafts.unshift(entry);
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.slice(0, 50)));
}
function deleteDraftLocal(invoiceNo) {
  const drafts = loadAllDrafts().filter(d => d.id !== invoiceNo);
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
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
          <div style={{ padding: "10px 10px 6px" }}><div style={{ position: "relative" }}><span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12 }}>🔍</span><input autoFocus placeholder="Search company name..." value={search} onChange={e => setSearch(e.target.value)} onClick={e => e.stopPropagation()} style={{ width: "100%", padding: "7px 10px 7px 30px", border: "1.5px solid var(--app-border)", borderRadius: 8, fontSize: 12, background: "var(--app-bg)", color: T.text, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} /></div></div>
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
        {value ? (<div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{value[0].toUpperCase()}</div><span>{value}</span></div>) : "-- Select Project --"}
        <span style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, fontSize: 10, color: "var(--app-muted)", transition: "0.2s" }}>▼</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--app-card)", border: "1.5px solid var(--app-border)", borderRadius: 12, boxShadow: "var(--app-shadow)", zIndex: 999, overflow: "hidden" }}>
          <div style={{ padding: "10px 10px 6px" }}><div style={{ position: "relative" }}><span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12 }}>🔍</span><input autoFocus placeholder="Search project..." value={search} onChange={e => setSearch(e.target.value)} onClick={e => e.stopPropagation()} style={{ width: "100%", padding: "7px 10px 7px 30px", border: "1.5px solid var(--app-border)", borderRadius: 8, fontSize: 12, background: "var(--app-bg)", color: T.text, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} /></div></div>
          {onAddProject && <div onClick={() => { setOpen(false); setSearch(""); onAddProject(); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: "var(--app-surface)", borderBottom: "2px solid var(--app-border)" }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 17, fontWeight: 700, flexShrink: 0 }}>+</div><div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--app-accent)" }}>Add New Project</div></div></div>}
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filtered.length === 0 ? <div style={{ padding: 14, textAlign: "center", color: "var(--app-muted)", fontSize: 13 }}>No projects found</div>
              : filtered.map((p, i) => { const name = p.name || ""; const isSel = value === name; return (<div key={i} onClick={() => { onChange(name); setOpen(false); setSearch(""); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: isSel ? "var(--app-surface)" : "transparent", borderBottom: "1px solid var(--app-border)" }} onMouseEnter={e => e.currentTarget.style.background = "var(--app-surface)"} onMouseLeave={e => e.currentTarget.style.background = isSel ? "var(--app-surface)" : "transparent"}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>{name[0]?.toUpperCase() || "?"}</div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{name}</div></div>{isSel && <span style={{ fontSize: 14, color: "var(--app-accent)" }}>✓</span>}</div>); })}
          </div>
        </div>
      )}
      {open && <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={() => { setOpen(false); setSearch(""); }} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function InvoiceCreator({ user, clients = [], projects = [], companyLogo, companyName, onLogoChange, onAddClient, onAddProject }) {
  const effectiveLogo = companyLogo || DEFAULT_LOGO_URL;
  const effectiveCompanyName = companyName || "";

  const [step, setStep] = useState("list"); // "list" | "form" | "preview"
  const [invoiceList, setInvoiceList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null); // entry to delete
  const [viewEntry, setViewEntry] = useState(null);       // entry for view modal
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [paymentModalEntry, setPaymentModalEntry] = useState(null);
  const [paymentModalStatus, setPaymentModalStatus] = useState("paid");
  const [paymentData, setPaymentData] = useState({ amountPaid: 0, paymentMode: "GPay", paymentDate: new Date().toISOString().split("T")[0], transactionId: "" });
  const [sendReceipt, setSendReceipt] = useState(false);
  const [receiptEntry, setReceiptEntry] = useState(null);
  const [editingReceipt, setEditingReceipt] = useState(false);
  const [listSearch, setListSearch] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const today = new Date().toISOString().split("T")[0];
  const dueDefault = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const blank = {
    invoiceNo: generateInvoiceNo(), orderNo: "", date: today, dueDate: dueDefault,
    client: "", project: "", gstRate: 18, notes: "",
    terms: "Payment due within 30 days. Thank you for your business!",
    companyName: companyName || "", companyEmail: "",
    companyPhone: "", companyAddress: "",
    currency: "₹",
    template: "Modern",
    footerMessage: "🙏 Thank you for considering us!",
    amountPaid: 0,
    paymentDate: today,
    paymentMode: "GPay",
    transactionId: "",
    isGstIncluded: false,
    upiId: user?.upiId || "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    ifscCode: "",
  };

  const [inv, setInv] = useState(blank);
  const [items, setItems] = useState([{ id: 1, description: "", quantity: 1, rate: "" }]);
  const [editingId, setEditingId] = useState(null); // backend _id if editing existing

  const upd = (f, v) => setInv((p) => ({ ...p, [f]: v }));
  const selectedClient = clients.find((c) => (c.clientName || c.name) === inv.client);
  const filteredProjects = projects.filter((p) =>
    !inv.client || p.client === inv.client || p.clientName === inv.client ||
    p.clientId === selectedClient?._id
  );

  // totals
  const subtotalRaw = items.reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseFloat(i.quantity) || 0), 0);
  let subtotal, gstAmt, total;

  if (inv.isGstIncluded) {
    total = subtotalRaw;
    subtotal = total / (1 + (inv.gstRate / 100));
    gstAmt = total - subtotal;
  } else {
    subtotal = subtotalRaw;
    gstAmt = subtotal * (inv.gstRate / 100);
    total = subtotal + gstAmt;
  }

  const amountPaid = parseFloat(inv.amountPaid) || 0;
  const balanceDue = total - amountPaid;

  // ── Fetch list ──────────────────────────────────────────────
  const fetchList = async () => {
    setListLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/invoices`);
      if (res.data.success && Array.isArray(res.data.invoices)) setInvoiceList(res.data.invoices);
      else setInvoiceList(loadAllDrafts());
    } catch { setInvoiceList(loadAllDrafts()); }
    finally { setListLoading(false); }
  };

  useEffect(() => { fetchList(); }, []);
  useEffect(() => { if (step === "list") fetchList(); }, [step]);

  // ── Items ───────────────────────────────────────────────────
  const addItem = () => setItems((p) => [...p, { id: Date.now(), description: "", quantity: 1, rate: "" }]);
  const removeItem = (id) => { if (items.length > 1) setItems((p) => p.filter((i) => i.id !== id)); };
  const updItem = (id, f, v) => {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, [f]: v } : i)));
    setErrors((prev) => { const n = { ...prev }; delete n[`item_${id}_${f}`]; return n; });
  };

  // ── Validate ────────────────────────────────────────────────
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

  // ── Load entry into form (EDIT) ─────────────────────────────
  const loadEntry = (entry) => {
    setInv(entry.inv || blank);
    setItems(entry.items?.length
      ? entry.items.map((it, i) => ({ ...it, id: it.id || i + 1 }))
      : [{ id: 1, description: "", quantity: 1, rate: "" }]
    );
    setEditingId(entry.id || null);
    setErrors({});
    setDraftSaved(false);
    setStep("form");
  };

  // ── Clear ───────────────────────────────────────────────────
  const clearForm = () => {
    setInv({ ...blank, invoiceNo: generateInvoiceNo() });
    setItems([{ id: 1, description: "", quantity: 1, rate: "" }]);
    setErrors({});
    setEditingId(null);
  };

  // ── API save ────────────────────────────────────────────────
  const apiSave = async (status = "draft") => {
    try {
      if (editingId) {
        let newStatus = status;
        if (newStatus === "draft" && parseFloat(inv.amountPaid) > 0) {
          newStatus = parseFloat(inv.amountPaid) < total ? "part_paid" : "paid";
        }
        const res = await axios.put(`${BASE_URL}/api/invoices/${editingId}`, { inv, items, status: newStatus });
        return res.data;
      } else {
        let newStatus = status;
        if (newStatus === "draft" && parseFloat(inv.amountPaid) > 0) {
          newStatus = parseFloat(inv.amountPaid) < total ? "part_paid" : "paid";
        }
        const res = await axios.post(`${BASE_URL}/api/invoices`, { inv, items, status: newStatus });
        return res.data;
      }
    } catch {
      return { success: false };
    }
  };

  // ── Save Draft ──────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!validate()) return;
    setSaving("draft");
    const data = await apiSave("draft");
    saveDraftLocal(inv, items, "draft");
    if (data.success && data.invoice?._id) setEditingId(data.invoice._id);
    setDraftSaved(true);
    setSaving(false);
    showToast("💾 Draft saved!");
    setTimeout(() => {
      setDraftSaved(false);
      setStep("list");
    }, 1000);
  };

  // ── Save & Preview ──────────────────────────────────────────
  const handleSavePreview = async () => {
    if (!validate()) return;
    setSaving("preview");
    const data = await apiSave("draft");
    saveDraftLocal(inv, items, "draft");
    if (data.success && data.invoice?._id) setEditingId(data.invoice._id);
    setSaving(false);
    setStep("preview");
  };

  // ── Delete invoice ──────────────────────────────────────────
  const handleDelete = async (entry) => {
    const id = entry._id || entry.id;
    // Try backend
    try { await axios.delete(`${BASE_URL}/api/invoices/${id}`); } catch { }
    // Remove locally
    deleteDraftLocal(entry.invoiceNo);
    setInvoiceList(prev => prev.filter(e => (e.id || e.invoiceNo) !== (id || entry.invoiceNo)));
    setDeleteTarget(null);
    setStep("list");
    showToast("     Delete️️️️️️️️️️️️️️️️ Invoice deleted!");
  };

  // ── Update status inline ────────────────────────────────────
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
      showToast(isPartial ? "✅ Recorded as Part Payment in Accounts" : "✅ Recorded as Full Payment in Accounts");
    } else {
      showToast(`✅ Status updated to ${newStatus}`);
    }
  };

  // ── QR ──────────────────────────────────────────────────────
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
  };
  const qrData = `${FRONTEND_URL}/invoice-view?d=${btoa(unescape(encodeURIComponent(JSON.stringify(slimPayload))))}`;

  const triggerPDFShare = async (entry, type, force = false) => {
    if (step !== "preview" && !force) {
      loadEntry(entry);
      setTimeout(() => {
        setStep("preview");
        showToast("⏳ Loading invoice for PDF generation...");
        setTimeout(() => triggerPDFShare(entry, type, true), 1000);
      }, 0);
      return;
    }
    const element = document.querySelector(".invoice-paper");
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
        scrollX: 0,
        scrollY: -window.scrollY,
        onclone: (doc) => {
          const el = doc.querySelector('.invoice-paper');
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
      // Verify single page (safety net)
      while (pdf.internal.getNumberOfPages() > 1) {
        pdf.deletePage(pdf.internal.getNumberOfPages());
      }

      const blob = pdf.output('blob');
      const file = new File([blob], `Invoice_${entry.invoiceNo}.pdf`, { type: 'application/pdf' });
      const invData = entry.inv || inv;
      const text = `*${invData.companyName || "Your Business"}*\n\nInvoice: ${entry.invoiceNo}\nTotal: ${formatCurrency(entry.total, invData.currency)}`;
      
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
         if (navigator.canShare && navigator.canShare({ files: [file] })) {
             await navigator.share({ title: `Invoice ${entry.invoiceNo}`, text, files: [file] });
         } else {
             const url = URL.createObjectURL(blob);
             const a = document.createElement("a");
             a.href = url; a.download = file.name; a.click(); URL.revokeObjectURL(url);

             showToast("PDF downloaded!");
         }
      }
    } catch (err) {
      console.log(err);
      showToast("❌ Failed to generate PDF");
    }
  };

  const shareInvoice = (entry) => triggerPDFShare(entry, "link");
  const shareWhatsApp = (entry) => triggerPDFShare(entry, "wa");

  // ── Shared styles ────────────────────────────────────────────
  const inp = (err) => ({
    width: "100%", border: `1.5px solid ${err ? "#ef4444" : "var(--app-border)"}`, borderRadius: 10,
    padding: "10px 12px", fontSize: 14, color: "var(--app-text)", background: err ? "#fff5f5" : "var(--app-surface)",
    boxSizing: "border-box", outline: "none", fontFamily: "inherit", transition: "all 0.2s",
  });
  const lbl = { display: "block", fontSize: 12, color: "var(--app-muted)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" };

  const statusColor = {
    paid: "#16a34a", unpaid: "#ea580c", overdue: "#dc2626", draft: "#6b7280", sent: "#2563eb", part_paid: "var(--app-accent)",
  };

  // ════════════════════════════════════════════════════════════
  // RECEIPT VIEW
  // ════════════════════════════════════════════════════════════
  if (step === "receipt" && receiptEntry) {
    const r = receiptEntry;
    const pd = r.paymentData || {};
    const invData = r.inv || inv;
    const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;

    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "var(--app-bg)", minHeight: "100vh", padding: "40px 20px" }}>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { background: #fff !important; }
            .receipt-paper { box-shadow: none !important; border: 1px solid #eee !important; margin: 0 !important; width: 100% !important; }
          }
        `}</style>

        <div className="no-print" style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 30 }}>
          <button onClick={() => { setEditingReceipt(false); setStep("list"); }} style={{ padding: "12px 24px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}>← Back to List</button>
          {!editingReceipt && <button onClick={() => setEditingReceipt(true)} style={{ padding: "12px 24px", background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#ea580c", fontFamily: "inherit" }}>Edit</button>}
          {!editingReceipt && <button onClick={() => window.print()} style={{ padding: "12px 28px", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#fff", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(var(--app-accent-rgb, 124, 58, 237),0.3)" }}>🖨️ Print Receipt</button>}
        </div>

        <div className="receipt-paper" style={{ maxWidth: 500, margin: "0 auto", background: "var(--app-card)", borderRadius: 24, boxShadow: "var(--app-shadow)", overflow: "hidden", border: "1px solid var(--app-border)" }}>
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", padding: "40px 32px", textAlign: "center", color: "#fff" }}>
            <div style={{ width: 64, height: 64, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 32 }}>💸</div>
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
              <div style={{ fontSize: 36, fontWeight: 900, color: "var(--app-text)" }}>{formatCurrency(pd.amountPaid, invData.currency)}</div>
              <div style={{ fontSize: 12, color: "var(--app-accent)", fontWeight: 700, marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>Amount Received</div>
            </div>

            <div style={{ display: "grid", gap: 20 }}>
              {editingReceipt ? (
                <>
                  <div style={{ marginBottom: 10 }}>
                    <label style={lbl}>Amount Paid</label>
                    <input type="number" value={pd.amountPaid} onChange={e => setReceiptEntry(prev => ({ ...prev, paymentData: { ...prev.paymentData, amountPaid: Number(e.target.value) } }))} style={inp()} />
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
                      showToast("✅ Receipt updated!");
                    }} style={{ flex: 1, padding: "10px", background: "var(--app-accent)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Save Changes</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px dashed var(--app-border)" }}>
                    <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Received From</span>
                    <span style={{ fontSize: 13, color: "var(--app-text)", fontWeight: 700 }}>{r.client}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px dashed var(--app-border)" }}>
                    <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Payment Date</span>
                    <span style={{ fontSize: 13, color: "var(--app-text)", fontWeight: 700 }}>{formatDate(pd.paymentDate)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px dashed var(--app-border)" }}>
                    <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Payment Mode</span>
                    <span style={{ fontSize: 13, color: "var(--app-text)", fontWeight: 700 }}>{pd.paymentMode}</span>
                  </div>
                  {pd.transactionId && (
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px dashed var(--app-border)" }}>
                      <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Transaction ID</span>
                      <span style={{ fontSize: 13, color: "var(--app-text)", fontWeight: 700, fontFamily: "monospace" }}>{pd.transactionId}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px dashed var(--app-border)" }}>
                    <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Invoice Number</span>
                    <span style={{ fontSize: 13, color: "var(--app-text)", fontWeight: 700 }}>{r.invoiceNo}</span>
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
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--app-text)" }}>{invData.companyName || "M Business"}</div>
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

  // ════════════════════════════════════════════════════════════
  // LIST VIEW
  // ════════════════════════════════════════════════════════════
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
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
          * { box-sizing: border-box; }
          .inv-row:hover { background: var(--app-bg) !important; }
          .inv-row { transition: background 0.15s; cursor: pointer; }
          .inv-action-btn { transition: all 0.15s; }
          .inv-action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
          @media (max-width: 700px) {
            .inv-th { display: none !important; }
            .inv-col-hide { display: none !important; }
            .inv-grid { grid-template-columns: 1fr 1fr !important; }
          }
        `}</style>

        <Toast msg={toast} />
        {deleteTarget && <ConfirmModal invoiceNo={deleteTarget.invoiceNo} onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />}

        {/* Payment Modal */}
        {paymentModalEntry && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "var(--app-card)", borderRadius: 24, width: "100%", maxWidth: 400, padding: "32px", boxShadow: "var(--app-shadow)", border: "1px solid var(--app-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--app-text)" }}>Payment Information</h3>
                <button onClick={() => setPaymentModalEntry(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--app-accent)", padding: "4px 8px" }}>✕</button>
              </div>

              <div style={{ background: "var(--app-bg)", borderRadius: 12, padding: "14px", marginBottom: 20, border: "1.5px solid var(--app-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Total Amount:</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--app-text)" }}>{formatCurrency(paymentModalEntry.total, paymentModalEntry.currency || inv.currency)}</span>
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
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--app-text)" }}>Send a receipt</span>
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

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
          <div>
            <p style={{ margin: "3px 0 0", color: "var(--app-muted)", fontSize: 13 }}>{enriched.length} total invoice{enriched.length !== 1 ? "s" : ""}</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>🔍</span>
              <input
                type="text"
                placeholder="Search invoices..."
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                style={{ padding: "9px 12px 9px 34px", border: "1.5px solid var(--app-border)", borderRadius: 10, fontSize: 13, outline: "none", width: 220, background: "var(--app-surface)", color: "var(--app-text)", fontFamily: "inherit" }}
              />
            </div>
            <button onClick={() => { clearForm(); setStep("form"); }}
              style={{ padding: "10px 22px", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#fff", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(var(--app-accent-rgb, 124, 58, 237),0.3)" }}>
              + Create Invoice
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="inv-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Invoiced", value: formatCurrency(totalAmt, inv.currency), color: "var(--app-accent)", icon: "📊" },
            { label: "Collected", value: formatCurrency(paidAmt, inv.currency), color: "#16a34a", icon: "✅" },
            { label: "Awaiting", value: `${unpaidCnt}`, color: "#ea580c", icon: "⏳" },
            { label: "Drafts", value: `${draftCnt}`, color: "#6b7280", icon: "📝" },
          ].map((c) => (
            <div key={c.label} style={{ background: "var(--app-card)", borderRadius: 18, padding: "20px", border: "1px solid var(--app-border)", boxShadow: "var(--app-shadow)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: c.color }} />
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `${c.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 12 }}>{c.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: 12, color: "var(--app-muted)", marginTop: 4, fontWeight: 700, textTransform: "uppercase" }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: "var(--app-card)", borderRadius: 20, border: "1px solid var(--app-border)", boxShadow: "var(--app-shadow)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 1050 }}>
              {/* Table header */}
              <div className="inv-th" style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1fr 1fr 1fr 1.2fr 1.2fr 1.2fr 1fr", padding: "12px 20px", background: "linear-gradient(90deg,var(--app-bg),var(--app-bg))", borderBottom: "2px solid var(--app-border)", alignItems: "center" }}>
            {["Invoice No", "Company Name", "Project", "Date", "Due Date", "Amount", "Paid", "Status", "Actions"].map((h) => (
              <div key={h} style={{ fontSize: 11, fontWeight: 800, color: "var(--app-accent)", letterSpacing: 0.5, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h}</div>
            ))}
          </div>

          {listLoading ? (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
              Loading invoices…
            </div>
          ) : enriched.length === 0 ? (
            <div style={{ padding: "70px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4 }}>No invoices yet</div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>Click "+ Create Invoice" to get started</div>
            </div>
          ) : enriched.filter(e => {
            const term = listSearch.toLowerCase();
            return (e.invoiceNo || "").toLowerCase().includes(term) ||
              (e.client || "").toLowerCase().includes(term) ||
              (e.inv?.project || e.project || "").toLowerCase().includes(term);
          }).map((entry, idx, arr) => {
            const invD = entry.inv || {};
            const sc = statusColor[(entry.status || "draft").toLowerCase()] || "#6b7280";
            const isUpdating = statusUpdating === entry.id;

            return (
              <div key={entry.id || idx} className="inv-row"
                style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr 1fr 1fr 1fr 1.2fr 1.2fr 1.2fr 1.2fr", padding: "16px 20px", borderBottom: idx < arr.length - 1 ? "1px solid var(--app-border)" : "none", alignItems: "center", background: "transparent" }}>

                {/* Invoice No */}
                <div onClick={() => setViewEntry(entry)} style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--app-accent)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.invoiceNo || "—"}</div>
                  <div style={{ fontSize: 10, color: "#d1d5db", marginTop: 1, fontFamily: "monospace" }}>{formatDateTime(entry.savedAt || entry.createdAt)}</div>
                </div>

                {/* Client */}
                <div onClick={() => setViewEntry(entry)} style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, overflow: "hidden" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                      {(entry.client || "?")[0].toUpperCase()}
                    </div>
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.client || "—"}</span>
                  </div>
                </div>

                {/* Project */}
                <div className="inv-col-hide" onClick={() => setViewEntry(entry)} style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {invD.project || entry.project || <span style={{ color: "#e5e7eb" }}>—</span>}
                </div>

                {/* Date */}
                <div className="inv-col-hide" onClick={() => setViewEntry(entry)} style={{ fontSize: 12, color: "#374151" }}>
                  {formatDate(invD.date || entry.date)}
                </div>

                {/* Due Date */}
                <div className="inv-col-hide" onClick={() => setViewEntry(entry)} style={{ fontSize: 12, color: "#ea580c", fontWeight: 600 }}>
                  {formatDate(invD.dueDate || entry.dueDate)}
                </div>

                {/* Amount */}
                <div onClick={() => setViewEntry(entry)} style={{ fontSize: 14, fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {formatCurrency(entry.total, entry.inv?.currency || inv.currency)}
                </div>

                {/* Paid Amount */}
                <div onClick={() => setViewEntry(entry)} style={{ fontSize: 14, fontWeight: 700, color: "#22c55e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {formatCurrency(entry.amountPaid || 0, entry.currency || inv.currency)}
                </div>

                {/* Status dropdown */}
                <div onClick={e => e.stopPropagation()}>
                  <select
                    value={entry.status || "draft"}
                    disabled={isUpdating}
                    onChange={e => handleStatusChange(entry, e.target.value)}
                    style={{
                      background: `${sc}12`, border: `1.5px solid ${sc}30`,
                      borderRadius: 8, padding: "5px 8px", fontSize: 11, fontWeight: 700,
                      color: sc, cursor: "pointer", outline: "none", fontFamily: "inherit",
                      opacity: isUpdating ? 0.6 : 1,
                    }}>
                    <option value="draft">📝 Draft</option>
                    <option value="sent">📤 Sent</option>
                    <option value="part_paid">💰 Part Payment</option>
                    <option value="paid">✅ Paid</option>
                    <option value="unpaid">⏳ Unpaid</option>
                  <option value="overdue">🔴 Overdue</option>
                  </select>
                </div>

                {/* Action buttons */}
                <div onClick={e => e.stopPropagation()} style={{ display: "flex", gap: 4, flexWrap: "nowrap" }}>
                  <button onClick={() => { loadEntry(entry); setStep("preview"); }} style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 7, padding: "5px 7px", fontSize: 11, color: "#374151", cursor: "pointer", fontWeight: 700 }}>View</button>
                  {(entry.status === "paid" || entry.status === "part_paid") && (
                    <button onClick={() => {
                      setReceiptEntry({ ...entry, paymentData: { amountPaid: entry.amountPaid || entry.total, paymentMode: entry.paymentMode || "Other", paymentDate: entry.paymentDate || new Date().toISOString(), transactionId: entry.transactionId } });
                      setStep("receipt");
                    }} style={{ background: "var(--app-bg)", border: "1px solid var(--app-border)", borderRadius: 7, padding: "5px 7px", fontSize: 11, color: "var(--app-accent)", cursor: "pointer", fontWeight: 700 }}>🧾 </button>
                  )}

                  <button onClick={() => setDeleteTarget(entry)} style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, padding: "5px 7px", fontSize: 11, color: "#ef4444", cursor: "pointer", fontWeight: 700 }}>Delete</button>
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

  // ════════════════════════════════════════════════════════════
  // PREVIEW / PRINT
  // ════════════════════════════════════════════════════════════
  if (step === "preview") {
    return (
      <div className="print-wrapper" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "var(--app-bg)", minHeight: "100vh", padding: "20px 12px" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
          * { box-sizing: border-box; }
          .invoice-paper { position: relative; max-width: 794px; margin: 0 auto; background: #fff; border-radius: 18px; box-shadow: 0 24px 80px rgba(var(--app-accent-rgb, 124, 58, 237), 0.25); overflow: hidden; display: flex; flex-direction: column; min-height: 1122px; }
          @media print {
            @page { size: A4 portrait; margin: 0; }
            html, body { margin: 0 !important; padding: 0 !important; height: auto !important; min-height: 0 !important; overflow: visible !important; background: white !important; }
            .no-print, .no-print * { display: none !important; }
            .print-wrapper { background: white !important; padding: 0 !important; min-height: 0 !important; display: block !important; }
            .invoice-paper { 
              position: relative !important; top: auto !important; left: auto !important; 
              width: 100% !important; max-width: 100% !important; margin: 0 !important; 
              border-radius: 0 !important; box-shadow: none !important; 
              overflow: visible !important; min-height: 0 !important; height: auto !important;
            }
            .flex-spacer { display: none !important; }
            body > div { height: auto !important; min-height: 0 !important; padding: 0 !important; margin: 0 !important; }
          }
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }
          @media (max-width:600px) {
            .inv-hgrid { flex-direction:column!important;gap:16px!important; }
            .inv-hright { text-align:left!important; }
            .inv-btgrid { grid-template-columns:1fr!important; }
          }
        `}</style>

        {deleteTarget && <ConfirmModal invoiceNo={deleteTarget.invoiceNo} onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />}

        {/* Toolbar */}
        <div className="no-print" style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
          <button onClick={() => setStep("list")} style={{ padding: "10px 18px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}>📋 Back to List</button>
          <button onClick={() => setStep("form")} style={{ padding: "10px 18px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}>Edit</button>
          <button onClick={() => shareInvoice({ id: editingId, invoiceNo: inv.invoiceNo, total: total })} style={{ padding: "10px 18px", background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#2563eb", fontFamily: "inherit" }}>🔗 Share</button>
          <button onClick={() => shareWhatsApp({ id: editingId, invoiceNo: inv.invoiceNo, total: total })} style={{ padding: "10px 18px", background: "#dcfce7", border: "1.5px solid #bbf7d0", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#16a34a", fontFamily: "inherit" }}>💬 WA</button>
          <button onClick={() => { setDeleteTarget({ id: editingId, invoiceNo: inv.invoiceNo }); }} style={{ padding: "10px 18px", background: "#fee2e2", border: "1.5px solid #fecaca", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#ef4444", fontFamily: "inherit" }}>Delete</button>
          <button onClick={() => window.print()} style={{ padding: "10px 22px", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>🖨️ Print / PDF</button>
        </div>

        <div className="invoice-paper print-container">
          {/* Header */}
          <div className="avoid-break" style={{ background: "#f8fafc", padding: "28px 32px", position: "relative", overflow: "hidden", flexShrink: 0, borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,rgba(var(--app-accent-rgb, 124, 58, 237),0.05),transparent)", top: -80, right: -40, pointerEvents: "none" }} />
            <div className="inv-hgrid" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1, gap: 20 }}>
              <div>
                {effectiveLogo ? (
                  <img src={effectiveLogo} alt="logo" style={{ height: 85, maxWidth: "100%", borderRadius: 10, marginBottom: 12, objectFit: "contain" }} />
                ) : (
                  <div style={{ height: 60, width: 60, background: "var(--app-accent)", borderRadius: 10, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: "#fff" }}>
                    {effectiveCompanyName[0] || "?"}
                  </div>
                )}
                <div style={{ fontSize: 24, fontWeight: 900, color: "var(--app-text)", textTransform: "uppercase", letterSpacing: 1 }}>{inv.companyName || effectiveCompanyName}</div>
                {inv.companyEmail && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>{inv.companyEmail}</div>}
                {inv.companyPhone && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{inv.companyPhone}</div>}
                {inv.companyAddress && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{inv.companyAddress}</div>}
              </div>
              <div className="inv-hright" style={{ textAlign: "right" }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: "rgba(124,58,237,0.1)", letterSpacing: -2, lineHeight: 1, marginBottom: 4 }}>INVOICE</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--app-accent)" }}>{inv.invoiceNo}</div>
                {inv.orderNo && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>Order # {inv.orderNo}</div>}
                <div style={{ marginTop: 14, display: "flex", gap: 20, justifyContent: "flex-end" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>DATE</div>
                    <div style={{ fontSize: 12, color: "var(--app-text)", fontWeight: 700 }}>{formatDate(inv.date)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>DUE DATE</div>
                    <div style={{ fontSize: 12, color: "#ea580c", fontWeight: 700 }}>{formatDate(inv.dueDate)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="inv-btgrid avoid-break" style={{ display: "grid", gridTemplateColumns: inv.project ? "1fr 1fr" : "1fr", borderBottom: "2px solid var(--app-border)", flexShrink: 0 }}>
            <div style={{ padding: "20px 32px", borderRight: inv.project ? "1px solid var(--app-border)" : "none" }}>
              <div style={{ fontSize: 9, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>BILL TO</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--app-text)" }}>{inv.client || "—"}</div>
              {selectedClient?.companyName && <div style={{ fontSize: 13, color: "var(--app-accent)", fontWeight: 600, marginTop: 2 }}>{selectedClient.companyName}</div>}
              {selectedClient?.email && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 5 }}>📧 {selectedClient.email}</div>}
              {selectedClient?.phone && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>📱 {selectedClient.phone}</div>}
              {selectedClient?.gstNumber && <div style={{ fontSize: 12, color: "var(--app-accent)", marginTop: 4, fontWeight: 600 }}>💎 GST: {selectedClient.gstNumber}</div>}
            </div>
            {inv.project && (
              <div style={{ padding: "20px 32px" }}>
                <div style={{ fontSize: 9, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>PROJECT</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--app-text)" }}>{inv.project}</div>
              </div>
            )}
          </div>

          {/* Items */}
          <div style={{ padding: "22px 32px", overflowX: "auto", flexShrink: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 360 }}>
              <thead>
                <tr className="avoid-break" style={{ background: "linear-gradient(90deg,var(--app-bg),var(--app-bg))" }}>
                  {["#", "Description", "Qty", "Unit Rate", "Amount"].map((h, i) => (
                    <th key={i} style={{ padding: "9px 11px", fontSize: 9, fontWeight: 700, color: "var(--app-accent)", letterSpacing: 1.5, borderBottom: "2px solid var(--app-border)", textAlign: ["Amount", "Unit Rate", "Qty"].includes(h) ? "right" : "left" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className="avoid-break" style={{ borderBottom: "1px solid var(--app-bg)" }}>
                    <td style={{ padding: "12px 11px", color: "var(--app-muted)", fontWeight: 700, fontSize: 12 }}>{String(idx + 1).padStart(2, "0")}</td>
                    <td style={{ padding: "12px 11px", fontSize: 13, fontWeight: 600, color: "var(--app-text)" }}>{item.description || "—"}</td>
                    <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 13, color: "#374151" }}>{item.quantity}</td>
                    <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 13, color: "#374151" }}>{formatCurrency(item.rate, inv.currency)}</td>
                    <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "var(--app-text)" }}>{formatCurrency((parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0), inv.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="avoid-break" style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <div style={{ width: "min(280px,100%)" }}>
                {[
                  ["Subtotal", formatCurrency(subtotal, inv.currency)],
                  [`GST (${inv.gstRate}%)${inv.isGstIncluded ? " (Incl.)" : ""}`, formatCurrency(gstAmt, inv.currency)],
                  ["Total Amount", formatCurrency(total, inv.currency)],
                  ["Advance Paid", formatCurrency(amountPaid, inv.currency)]
                ].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--app-border)" }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{l}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--app-text)" }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", background: "#f8fafc", borderRadius: 12, marginTop: 8, border: "1.5px solid #e2e8f0" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#64748b" }}>BALANCE DUE</span>
                  <span style={{ fontSize: 19, fontWeight: 900, color: "var(--app-text)" }}>{formatCurrency(balanceDue, inv.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes + QR */}
          <div className="avoid-break" style={{ padding: "0 32px 24px", display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "flex-start", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {inv.notes && (
                <div style={{ background: "var(--app-bg)", borderRadius: 11, padding: "14px 16px", border: "1px solid var(--app-border)" }}>
                  <div style={{ fontSize: 9, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>📝 NOTES</div>
                  <div style={{ fontSize: 12, color: "var(--app-text)", opacity: 0.8, lineHeight: 1.7 }}>{inv.notes}</div>
                </div>
              )}
              {inv.terms && (
                <div style={{ background: "var(--app-bg)", borderRadius: 11, padding: "14px 16px", border: "1px solid var(--app-border)" }}>
                  <div style={{ fontSize: 9, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>📜 TERMS</div>
                  <div style={{ fontSize: 12, color: "var(--app-text)", opacity: 0.8, lineHeight: 1.7 }}>{inv.terms}</div>
                </div>
              )}
              {(inv.upiId || inv.bankName || inv.accountName || inv.accountNumber || inv.ifscCode) && (
                <div style={{ background: "#f8fafc", borderRadius: 11, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 9, color: "var(--app-accent)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>💳 PAYMENT INSTRUCTIONS</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
                    {inv.upiId && (
                      <div>
                        <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>UPI ID</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--app-text)" }}>{inv.upiId}</div>
                      </div>
                    )}
                    {(inv.bankName || inv.accountName || inv.accountNumber || inv.ifscCode) && (
                      <>
                        {inv.bankName && (
                          <div>
                            <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>BANK NAME</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--app-text)" }}>{inv.bankName}</div>
                          </div>
                        )}
                        {inv.accountName && (
                          <div>
                            <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>ACCOUNT NAME</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--app-text)" }}>{inv.accountName}</div>
                          </div>
                        )}
                        {inv.accountNumber && (
                          <div>
                            <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>ACCOUNT NUMBER</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--app-text)", fontFamily: "monospace" }}>{inv.accountNumber}</div>
                          </div>
                        )}
                        {inv.ifscCode && (
                          <div>
                            <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>IFSC CODE</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--app-text)", fontFamily: "monospace" }}>{inv.ifscCode}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "var(--app-bg)", borderRadius: 12, padding: "14px 16px", border: "1px solid var(--app-border)", minWidth: 110 }}>
              <div style={{ fontSize: 8, color: "var(--app-muted)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 8, textAlign: "center" }}>SCAN INVOICE</div>
              <div style={{ background: "#fff", padding: 6, borderRadius: 8, border: "1px solid var(--app-border)" }}>
                <QRCodeSVG value={qrData} size={88} bgColor="#ffffff" fgColor="var(--app-text)" />
              </div>
              <div style={{ fontSize: 8, color: "#9ca3af", marginTop: 7, textAlign: "center", fontWeight: 600 }}>{inv.invoiceNo}</div>
            </div>
          </div>

          <div style={{ height: 80 }} /> {/* Spacer to prevent overlap */}

          {/* Footer */}
          <div className="avoid-break" style={{ position: "absolute", bottom: 0, left: 0, width: "100%", background: "#ffffff", borderTop: "2px solid #f1f5f9", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{effectiveCompanyName}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--app-accent)" }}>{inv.footerMessage}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{inv.invoiceNo}</div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // FORM (Create / Edit)
  // ════════════════════════════════════════════════════════════
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { border-color: var(--app-accent) !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
        @keyframes shake { 0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)} }
        .shake { animation: shake 0.35s ease; }
        @media (max-width:600px) { .f2col { grid-template-columns: 1fr !important; } .f3col { grid-template-columns: 1fr 1fr !important; } }
        /* Hide Arrows in Number Inputs */
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <Toast msg={toast} />

      {/* Top nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setStep("list")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--app-accent)", fontWeight: 700, padding: 0, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
            ← Back
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--app-text)" }}>

          </span>
          {editingId && (
            <span style={{ background: "var(--app-border)", color: "var(--app-accent)", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
              {inv.invoiceNo}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={clearForm} style={{ padding: "8px 14px", background: "#fff", border: "1.5px solid #f3f4f6", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#6b7280", fontFamily: "inherit" }}>Clear</button>
          <button onClick={handleSaveDraft} disabled={!!saving}
            style={{ padding: "8px 18px", background: draftSaved ? "#22c55e" : "#fff", border: `1.5px solid ${draftSaved ? "#22c55e" : "#e5e7eb"}`, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", color: draftSaved ? "#fff" : "#374151", fontFamily: "inherit", transition: "all 0.3s" }}>
            {saving === "draft" ? "Saving…" : draftSaved ? "✅ Saved!" : "💾 Save Draft"}
          </button>
          <button onClick={handleSavePreview} disabled={!!saving}
            style={{ padding: "8px 22px", background: saving === "preview" ? "#9ca3af" : "linear-gradient(135deg,var(--app-accent),var(--app-accent))", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", color: "#fff", fontFamily: "inherit" }}>
            {saving === "preview" ? "Saving…" : "Preview →"}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {hasErrors && (
        <div className="shake" style={{ background: "#fff5f5", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#b91c1c", fontWeight: 600 }}>
          ⚠️ Please fill all required fields before saving.
        </div>
      )}

      {/* ── Invoice Details ── */}
      <div style={{ background: "var(--app-card)", borderRadius: 12, padding: "20px 24px", border: "1px solid var(--app-border)", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--app-text)", marginBottom: 16 }}>Invoice Details</div>
        <div className="f3col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={lbl}>Invoice Number</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input value={inv.invoiceNo} onChange={(e) => upd("invoiceNo", e.target.value)} style={{ ...inp(), flex: 1 }} />
              <button onClick={() => upd("invoiceNo", generateInvoiceNo())} style={{ padding: "0 10px", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 8, cursor: "pointer", fontSize: 14, color: "#6b7280" }}>↻</button>
            </div>
          </div>
          <div>
            <label style={lbl}>Invoice Date</label>
            <input type="date" value={inv.date} onChange={(e) => upd("date", e.target.value)} style={inp()} />
          </div>
          <div>
            <label style={lbl}>Due Date</label>
            <input type="date" value={inv.dueDate} onChange={(e) => upd("dueDate", e.target.value)} style={inp()} />
          </div>
          <div>
            <label style={lbl}>GST Rate</label>
            <select value={inv.gstRate} onChange={(e) => upd("gstRate", Number(e.target.value))} style={inp()}>
              {GST_RATES.map((r) => <option key={r} value={r}>{r === 0 ? "No GST (0%)" : `GST ${r}%`}</option>)}
            </select>
            <select value={inv.isGstIncluded ? "including" : "excluding"}
              onChange={(e) => upd("isGstIncluded", e.target.value === "including")}
              style={{ ...inp(), marginTop: 6, fontSize: 11, fontWeight: 700, color: "var(--app-accent)" }}>
              <option value="excluding">Excluding GST</option>
              <option value="including">Including GST</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Currency</label>
            <div style={{ display: "flex", gap: 8 }}>
              <select value={["₹", "$", "€", "£", "¥", "AED", "SAR", "QAR", "CAD", "AUD", "SGD", "KWD", "BHD", "OMR"].includes(inv.currency) ? inv.currency : "Custom"} onChange={(e) => upd("currency", e.target.value === "Custom" ? "" : e.target.value)} style={{ ...inp(), flex: 1 }}>
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
              {!["₹", "$", "€", "£", "¥", "AED", "SAR", "QAR", "CAD", "AUD", "SGD", "KWD", "BHD", "OMR"].includes(inv.currency) && (
                <input value={inv.currency} onChange={(e) => upd("currency", e.target.value)} style={{ ...inp(), flex: 1 }} placeholder="e.g. AUD" />
              )}
            </div>
          </div>
          <div>
            <label style={lbl}>Template</label>
            <select value={inv.template} onChange={(e) => upd("template", e.target.value)} style={inp()}>
              <option value="Modern">Modern Purple</option>
              <option value="Classic">Classic Professional</option>
              <option value="Minimal">Minimalist</option>
            </select>
          </div>
        </div>
      </div>
      {/* ── Payment Details ── */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #f3f4f6", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 16 }}>Payment & Advance Details</div>
        <div className="f3col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={lbl}>Amount Paid (Advance)</label>
            <input type="number"
              value={inv.amountPaid === 0 ? "" : inv.amountPaid}
              onChange={(e) => upd("amountPaid", e.target.value === "" ? 0 : Number(e.target.value))}
              onWheel={(e) => e.target.blur()}
              placeholder="0"
              style={inp()} />
          </div>
          <div>
            <label style={lbl}>Payment Date</label>
            <input type="date" value={inv.paymentDate} onChange={(e) => upd("paymentDate", e.target.value)} style={inp()} />
          </div>
          <div>
            <label style={lbl}>Payment Mode</label>
            <select value={inv.paymentMode} onChange={(e) => upd("paymentMode", e.target.value)} style={inp()}>
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
          <input value={inv.transactionId} onChange={(e) => upd("transactionId", e.target.value)} placeholder="TXN123456" style={inp()} />
        </div>

        {/* ── Client & Project ── */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: errors.client ? "1.5px solid #fca5a5" : "1px solid #f3f4f6", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 16 }}>Company & Project</div>
          <div className="f2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div id="field-client">
              <label style={{ ...lbl, color: errors.client ? "#ef4444" : "#6b7280" }}>Company Name *</label>
              <CompanyDropdown clients={clients} value={inv.client}
                onChange={(val) => { upd("client", val); upd("project", ""); setErrors((p) => { const n = { ...p }; delete n.client; return n; }); }}
                error={errors.client} onAddCompany={onAddClient} />
              {errors.client && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontWeight: 600 }}>⚠ {errors.client}</div>}
            </div>
            <div>
              <label style={lbl}>Project <span style={{ color: "#d1d5db" }}></span></label>
              <ProjectDropdown projects={filteredProjects} value={inv.project}
                onChange={(val) => upd("project", val)}
                onAddProject={onAddProject}
                disabled={!inv.client} />
            </div>
          </div>
          {selectedClient && (
            <div style={{ marginTop: 10, padding: "8px 12px", background: "#f9fafb", borderRadius: 8, display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[["📧", selectedClient.email], ["📱", selectedClient.phone], ["📍", selectedClient.address], ["💎", selectedClient.gstNumber]].filter(([, v]) => v).map(([icon, val], i) => (
                <span key={i} style={{ fontSize: 12, color: "#6b7280" }}>{icon} {val}</span>
              ))}
            </div>
          )}
        </div>

        {/* ── Items ── */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #f3f4f6", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Items / Services</div>
            <button onClick={addItem} style={{ padding: "6px 14px", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>+ Add Item</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 36px", gap: 8, paddingBottom: 8, borderBottom: "1px solid #f3f4f6", marginBottom: 8 }}>
            {["Description", "Qty", `Rate (${inv.currency || "₹"})`, ""].map((h, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>{h}</div>
            ))}
          </div>
          {items.map((item, idx) => {
            const dErr = errors[`item_${item.id}_description`];
            const rErr = errors[`item_${item.id}_rate`];
            return (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 36px", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                <div>
                  <input id={`item_${item.id}_description`} value={item.description} onChange={(e) => updItem(item.id, "description", e.target.value)}
                    placeholder={`Item ${idx + 1} description`} style={{ ...inp(dErr), fontSize: 13 }} />
                  {dErr && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>⚠ Required</div>}
                </div>
                <input type="number"
                  value={item.quantity === 0 ? "" : item.quantity}
                  onChange={(e) => updItem(item.id, "quantity", e.target.value === "" ? 0 : Number(e.target.value))}
                  onWheel={(e) => e.target.blur()}
                  placeholder="0" style={{ ...inp(), textAlign: "center", fontSize: 13 }} />
                <div>
                  <input type="number" id={`item_${item.id}_rate`}
                    value={item.rate === 0 ? "" : item.rate}
                    onChange={(e) => updItem(item.id, "rate", e.target.value === "" ? 0 : Number(e.target.value))}
                    onWheel={(e) => e.target.blur()}
                    placeholder="0.00" style={{ ...inp(rErr), textAlign: "right", fontSize: 13 }} />
                  {rErr && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>⚠ Required</div>}
                </div>
                <button onClick={() => removeItem(item.id)} disabled={items.length === 1}
                  style={{ width: 32, height: 42, borderRadius: 8, background: items.length === 1 ? "#f9fafb" : "#fee2e2", border: "none", cursor: items.length === 1 ? "not-allowed" : "pointer", fontSize: 13, color: items.length === 1 ? "#d1d5db" : "#ef4444" }}>✕</button>
              </div>
            );
          })}
          {/* Totals */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <div style={{ minWidth: 220 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>Subtotal</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(subtotal, inv.currency)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>GST ({inv.gstRate}%){inv.isGstIncluded ? " (Incl.)" : ""}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(gstAmt, inv.currency)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "linear-gradient(135deg,var(--app-accent),var(--app-muted))", borderRadius: 10, marginTop: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#e9d5ff" }}>Total</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>{formatCurrency(total, inv.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Notes & Terms ── */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #f3f4f6", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 16 }}>Notes & Terms <span style={{ color: "#d1d5db", fontWeight: 500 }}></span></div>
          <div className="f2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={lbl}>Notes</label>
              <textarea value={inv.notes} onChange={(e) => upd("notes", e.target.value)} placeholder="Additional notes…" rows={3}
                style={{ ...inp(), resize: "vertical", lineHeight: 1.6 }} />
            </div>
            <div>
              <label style={lbl}>Terms & Conditions</label>
              <textarea value={inv.terms} onChange={(e) => upd("terms", e.target.value)} rows={3}
                style={{ ...inp(), resize: "vertical", lineHeight: 1.6 }} />
            </div>
          </div>
        </div>

        {/* ── Company Details ── */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #f3f4f6", marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 16 }}>Company Details <span style={{ color: "#d1d5db", fontWeight: 500 }}></span></div>
          <div className="f2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={lbl}>Company Name</label>
              <input value={inv.companyName} onChange={(e) => upd("companyName", e.target.value)} placeholder="Company Name" style={inp()} />
            </div>
            <div>
              <label style={lbl}>Company Phone / Number</label>
              <input value={inv.companyPhone} onChange={(e) => {
                const val = e.target.value;
                if (val && !/^\d*$/.test(val)) return;
                upd("companyPhone", val);
              }} placeholder="Phone Number" style={inp()} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lbl}>Company Address</label>
              <textarea value={inv.companyAddress} onChange={(e) => upd("companyAddress", e.target.value)} placeholder="Full Address" rows={2} style={{ ...inp(), resize: "vertical", lineHeight: 1.6 }} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lbl}>UPI ID for Payment</label>
              <input value={inv.upiId} onChange={(e) => upd("upiId", e.target.value)} placeholder="e.g. business@okaxis" style={inp()} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--app-accent)", marginTop: 10, gridColumn: "1 / -1", textTransform: "uppercase", letterSpacing: 1 }}>Bank Transfer Details</div>
            <div>
              <label style={lbl}>Bank Name</label>
              <input value={inv.bankName} onChange={(e) => upd("bankName", e.target.value)} placeholder="e.g. HDFC Bank" style={inp()} />
            </div>
            <div>
              <label style={lbl}>Account Name</label>
              <input value={inv.accountName} onChange={(e) => upd("accountName", e.target.value)} placeholder="Account Holder Name" style={inp()} />
            </div>
            <div>
              <label style={lbl}>Account Number</label>
              <input value={inv.accountNumber} onChange={(e) => {
                const val = e.target.value;
                if (val && !/^\d*$/.test(val)) return;
                upd("accountNumber", val);
              }} placeholder="Bank Account Number" style={inp()} />
            </div>
            <div>
              <label style={lbl}>IFSC Code</label>
              <input value={inv.ifscCode} onChange={(e) => upd("ifscCode", e.target.value)} placeholder="Bank IFSC Code" style={inp()} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lbl}>Footer Message</label>
              <input value={inv.footerMessage} onChange={(e) => upd("footerMessage", e.target.value)} placeholder="🙏 Thank you for considering us!" style={inp()} />
            </div>
          </div>
        </div>

        {/* Bottom save buttons */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
          <button onClick={handleSaveDraft} disabled={!!saving}
            style={{ padding: "13px", background: draftSaved ? "#22c55e" : "#fff", border: `1.5px solid ${draftSaved ? "#22c55e" : "#e5e7eb"}`, borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", color: draftSaved ? "#fff" : "#374151", fontFamily: "inherit", transition: "all 0.3s" }}>
            {saving === "draft" ? "Saving…" : draftSaved ? "✅ Saved as Draft!" : "💾 Save Draft"}
          </button>

          {editingId && (
            <>
              <button onClick={() => shareInvoice({ id: editingId, invoiceNo: inv.invoiceNo, total: total })} style={{ padding: "13px 18px", background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#2563eb", fontFamily: "inherit" }} title="Share Link">🔗 Share</button>
              <button onClick={() => shareWhatsApp({ id: editingId, invoiceNo: inv.invoiceNo, total: total })} style={{ padding: "13px 18px", background: "#dcfce7", border: "1.5px solid #bbf7d0", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#16a34a", fontFamily: "inherit" }} title="Share on WhatsApp">💬 WhatsApp</button>
            </>
          )}

          <button onClick={handleSavePreview} disabled={!!saving}
            style={{ padding: "13px", background: saving === "preview" ? "#9ca3af" : "linear-gradient(135deg,var(--app-accent),var(--app-accent))", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: saving ? "not-allowed" : "pointer", color: "#fff", fontFamily: "inherit" }}>
            {saving === "preview" ? "Saving…" : "Preview & Print →"}
          </button>
        </div>
      </div>
    </div>
  );
}


