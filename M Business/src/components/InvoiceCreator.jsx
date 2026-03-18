import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

const GST_RATES = [0, 5, 12, 18, 28];
const DEFAULT_LOGO_URL = "https://res.cloudinary.com/dvbzhmysy/image/upload/v1773851516/mbusiness/logos/okhahqag5ttqwfvhfphw.png";

function generateInvoiceNo() {
  return `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}
function formatINR(val) {
  const num = parseFloat(val) || 0;
  return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    paid:    { bg: "#dcfce7", color: "#16a34a", label: "✅ Paid" },
    unpaid:  { bg: "#fff7ed", color: "#ea580c", label: "⏳ Unpaid" },
    overdue: { bg: "#fee2e2", color: "#dc2626", label: "🔴 Overdue" },
    draft:   { bg: "#f3f4f6", color: "#6b7280", label: "📝 Draft" },
    sent:    { bg: "#eff6ff", color: "#2563eb", label: "📤 Sent" },
  };
  const s = map[(status || "draft").toLowerCase()] || map.draft;
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
      {s.label}
    </span>
  );
}

const DRAFTS_KEY = "invoice_drafts";
function loadAllDrafts() {
  try { const d = localStorage.getItem(DRAFTS_KEY); return d ? JSON.parse(d) : []; } catch { return []; }
}
function saveDraftLocal(inv, items) {
  const drafts = loadAllDrafts();
  const id = inv.invoiceNo;
  const existing = drafts.findIndex((d) => d.id === id);
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseFloat(i.quantity) || 0), 0);
  const total = subtotal * (1 + inv.gstRate / 100);
  const entry = { id, invoiceNo: inv.invoiceNo, client: inv.client || "—", total, savedAt: Date.now(), inv, items, status: "draft" };
  if (existing >= 0) drafts[existing] = entry; else drafts.unshift(entry);
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.slice(0, 30)));
}

// ═══════════════════════════════════════════════════════════
export default function InvoiceCreator({ clients = [], projects = [], companyLogo, onLogoChange }) {
  const effectiveLogo = companyLogo || DEFAULT_LOGO_URL;

  const [step, setStep] = useState("list"); // "list" | "form" | "preview"
  const [invoiceList, setInvoiceList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [saving, setSaving]         = useState(false); // false | "draft" | "preview"
  const [draftSaved, setDraftSaved] = useState(false);
  const [errors, setErrors]         = useState({});

  const today      = new Date().toISOString().split("T")[0];
  const dueDefault = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const blank = {
    invoiceNo: generateInvoiceNo(), orderNo: "", date: today, dueDate: dueDefault,
    client: "", project: "", gstRate: 18, notes: "", terms: "Payment due within 30 days. Thank you for your business!",
    companyName: "M Business Suite", companyEmail: "management@mbusiness.com", companyPhone: "", companyAddress: "",
  };

  const [inv, setInv]     = useState(blank);
  const [items, setItems] = useState([{ id: 1, description: "", quantity: 1, rate: "" }]);

  const upd = (f, v) => setInv((p) => ({ ...p, [f]: v }));
  const selectedClient   = clients.find((c) => (c.clientName || c.name) === inv.client);
  const filteredProjects = projects.filter((p) => !inv.client || p.client === inv.client || p.clientName === inv.client || p.clientId === selectedClient?._id);

  // totals
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseFloat(i.quantity) || 0), 0);
  const gstAmt   = subtotal * (inv.gstRate / 100);
  const total    = subtotal + gstAmt;

  // ── Fetch list ──────────────────────────────────────────
  const fetchList = async () => {
    setListLoading(true);
    try {
      const res  = await fetch("http://localhost:5000/api/invoices");
      const data = await res.json();
      if (data.success && Array.isArray(data.invoices)) setInvoiceList(data.invoices);
      else setInvoiceList(loadAllDrafts());
    } catch { setInvoiceList(loadAllDrafts()); }
    finally { setListLoading(false); }
  };

  useEffect(() => { fetchList(); }, []);
  useEffect(() => { if (step === "list") fetchList(); }, [step]);

  // ── Items ───────────────────────────────────────────────
  const addItem = () => setItems((p) => [...p, { id: Date.now(), description: "", quantity: 1, rate: "" }]);
  const removeItem = (id) => { if (items.length > 1) setItems((p) => p.filter((i) => i.id !== id)); };
  const updItem = (id, f, v) => {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, [f]: v } : i)));
    setErrors((prev) => { const n = { ...prev }; delete n[`item_${id}_${f}`]; return n; });
  };

  // ── Validate ─────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!inv.client) errs.client = "Client is required";
    items.forEach((item, idx) => {
      if (!item.description.trim()) errs[`item_${item.id}_description`] = `Item ${idx + 1}: description required`;
      if (!item.rate || parseFloat(item.rate) <= 0) errs[`item_${item.id}_rate`] = `Item ${idx + 1}: rate required`;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save Draft (stays on form, shows ✅) ─────────────────
  const handleSaveDraft = async () => {
    if (!validate()) return;
    setSaving("draft");
    try {
      const res  = await fetch("http://localhost:5000/api/invoices", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inv, items, status: "draft" }),
      });
      const data = await res.json();
      if (data.success) {
        saveDraftLocal(inv, items);
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2500);
      } else {
        // backend failed — still save locally
        saveDraftLocal(inv, items);
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2500);
      }
    } catch {
      saveDraftLocal(inv, items);
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2500);
    }
    setSaving(false);
  };

  // ── Save & go to Preview ─────────────────────────────────
  const handleSavePreview = async () => {
    if (!validate()) return;
    setSaving("preview");
    try {
      const res  = await fetch("http://localhost:5000/api/invoices", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inv, items, status: "draft" }),
      });
      const data = await res.json();
      if (data.success) { saveDraftLocal(inv, items); }
      else { saveDraftLocal(inv, items); }
    } catch {
      saveDraftLocal(inv, items);
    }
    setSaving(false);
    setStep("preview");
  };

  // ── Load entry into form ────────────────────────────────
  const loadEntry = (entry) => {
    setInv(entry.inv || blank);
    setItems(entry.items || [{ id: 1, description: "", quantity: 1, rate: "" }]);
    setErrors({});
    setStep("form");
  };

  // ── Clear ───────────────────────────────────────────────
  const clearForm = () => {
    setInv({ ...blank, invoiceNo: generateInvoiceNo() });
    setItems([{ id: 1, description: "", quantity: 1, rate: "" }]);
    setErrors({});
  };

  // ── QR ──────────────────────────────────────────────────
  const slimPayload = {
    no: inv.invoiceNo, date: inv.date, due: inv.dueDate,
    co: inv.companyName, email: inv.companyEmail, phone: inv.companyPhone, addr: inv.companyAddress,
    cl: inv.client, proj: inv.project, gst: inv.gstRate, notes: inv.notes, terms: inv.terms,
    items: items.map((i) => ({ d: i.description, q: i.quantity, r: i.rate })),
  };
  const qrData = `${window.location.origin}/invoice-view?d=${btoa(unescape(encodeURIComponent(JSON.stringify(slimPayload))))}`;

  // ── Shared input style ──────────────────────────────────
  const inp = (err) => ({
    width: "100%", border: `1.5px solid ${err ? "#ef4444" : "#e5e7eb"}`, borderRadius: 8,
    padding: "10px 12px", fontSize: 14, color: "#111827", background: err ? "#fff5f5" : "#fff",
    boxSizing: "border-box", outline: "none", fontFamily: "inherit",
    transition: "border-color 0.15s",
  });
  const lbl = { display: "block", fontSize: 12, color: "#6b7280", fontWeight: 600, marginBottom: 4 };

  // ════════════════════════════════════════════════════════
  // LIST VIEW
  // ════════════════════════════════════════════════════════
  if (step === "list") {
    const enriched = invoiceList.map((e) => {
      const dueDate = e.inv?.dueDate || e.dueDate;
      const status  = e.status || (dueDate && new Date(dueDate) < new Date() ? "overdue" : "unpaid");
      return { ...e, status };
    });
    const totalAmt  = enriched.reduce((s, e) => s + (parseFloat(e.total) || 0), 0);
    const paidAmt   = enriched.filter((e) => e.status === "paid").reduce((s, e) => s + (parseFloat(e.total) || 0), 0);
    const unpaidCnt = enriched.filter((e) => ["unpaid", "overdue"].includes(e.status)).length;
    const draftCnt  = enriched.filter((e) => e.status === "draft").length;

    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", maxWidth: 1100 }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
          * { box-sizing: border-box; }
          .inv-row:hover { background: #f5f3ff !important; cursor: pointer; }
          .inv-row { transition: background 0.15s; }
          @media (max-width: 700px) { .inv-th { display: none !important; } .inv-col-hide { display: none !important; } }
        `}</style>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>Invoices</h2>
            <p style={{ margin: "3px 0 0", color: "#9ca3af", fontSize: 13 }}>{enriched.length} total</p>
          </div>
          <button onClick={() => { clearForm(); setStep("form"); }}
            style={{ padding: "10px 22px", background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>
            + Create Invoice
          </button>
        </div>

        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Invoiced", value: formatINR(totalAmt), color: "#4c1d95" },
            { label: "Paid",           value: formatINR(paidAmt),  color: "#16a34a" },
            { label: "Awaiting",       value: `${unpaidCnt}`,      color: "#ea580c" },
            { label: "Drafts",         value: `${draftCnt}`,       color: "#6b7280" },
          ].map((c) => (
            <div key={c.label} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", border: "1px solid #f3f4f6", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3, fontWeight: 600 }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f3f4f6", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <div className="inv-th" style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 0.8fr 1fr 0.9fr 1fr 0.9fr", padding: "11px 20px", background: "#fafafa", borderBottom: "1px solid #f3f4f6" }}>
            {["Invoice No","Client","Project","Date","Due Date","Amount","Status"].map((h) => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: 0.5 }}>{h.toUpperCase()}</div>
            ))}
          </div>

          {listLoading ? (
            <div style={{ padding: "50px 20px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Loading invoices…</div>
          ) : enriched.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>No invoices yet</div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Click "+ Create Invoice" to get started</div>
            </div>
          ) : enriched.map((entry, idx) => {
            const invD = entry.inv || {};
            return (
              <div key={entry.id || idx} className="inv-row"
                onClick={() => loadEntry(entry)}
                style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 0.8fr 1fr 0.9fr 1fr 0.9fr", padding: "14px 20px", borderBottom: idx < enriched.length - 1 ? "1px solid #f9fafb" : "none", alignItems: "center", background: "#fff" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{entry.invoiceNo || "—"}</div>
                  <div style={{ fontSize: 11, color: "#d1d5db", marginTop: 1 }}>{formatDateTime(entry.savedAt)}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#7c3aed" }}>{entry.client || "—"}</div>
                <div className="inv-col-hide" style={{ fontSize: 12, color: "#6b7280" }}>{invD.project || entry.project || "—"}</div>
                <div className="inv-col-hide" style={{ fontSize: 12, color: "#374151" }}>{formatDate(invD.date || entry.date)}</div>
                <div className="inv-col-hide" style={{ fontSize: 12, color: "#ea580c", fontWeight: 600 }}>{formatDate(invD.dueDate || entry.dueDate)}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{formatINR(entry.total)}</div>
                <div onClick={(e) => e.stopPropagation()}>
                  <StatusBadge status={entry.status} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // PREVIEW / PRINT
  // ════════════════════════════════════════════════════════
  if (step === "preview") {
    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#e8e0f5", minHeight: "100vh", padding: "20px 12px" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
          * { box-sizing: border-box; }
          .invoice-paper { max-width: 794px; margin: 0 auto; background: #fff; border-radius: 18px; box-shadow: 0 24px 80px rgba(100,60,200,0.18); overflow: hidden; }
          @media print {
            @page { size: A4 portrait; margin: 0; }
            html,body { width:210mm!important;height:297mm!important;margin:0!important;padding:0!important;background:white!important;overflow:hidden!important; }
            body * { visibility:hidden!important; }
            .invoice-paper,.invoice-paper * { visibility:visible!important; }
            .no-print { display:none!important; }
            .invoice-paper { position:fixed!important;top:0!important;left:0!important;width:210mm!important;height:297mm!important;max-width:210mm!important;margin:0!important;padding:0!important;border-radius:0!important;box-shadow:none!important;overflow:hidden!important;display:flex!important;flex-direction:column!important; }
            .invoice-paper * { -webkit-print-color-adjust:exact!important;print-color-adjust:exact!important; }
          }
          @media (max-width:600px) {
            .inv-hgrid { flex-direction:column!important;gap:16px!important; }
            .inv-hright { text-align:left!important; }
            .inv-btgrid { grid-template-columns:1fr!important; }
          }
        `}</style>

        {/* Toolbar */}
        <div className="no-print" style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
          <button onClick={() => setStep("form")} style={{ padding: "10px 20px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}>← Edit</button>
          <button onClick={() => setStep("list")} style={{ padding: "10px 20px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}>📋 All Invoices</button>
          <button onClick={() => window.print()} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>🖨️ Print / PDF</button>
        </div>

        <div className="invoice-paper">
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg,#0f0528 0%,#2d0a6e 50%,#4c1d95 100%)", padding: "28px 32px", position: "relative", overflow: "hidden", flexShrink: 0 }}>
            <div style={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,0.15),transparent)", top: -80, right: -40, pointerEvents: "none" }} />
            <div className="inv-hgrid" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1, gap: 20 }}>
              <div>
                <img src={effectiveLogo} alt="logo" style={{ height: 52, borderRadius: 9, marginBottom: 12, objectFit: "contain", background: "rgba(255,255,255,0.1)", padding: 6 }} />
                <div style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>{inv.companyName}</div>
                {inv.companyEmail    && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>{inv.companyEmail}</div>}
                {inv.companyPhone    && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{inv.companyPhone}</div>}
                {inv.companyAddress  && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{inv.companyAddress}</div>}
              </div>
              <div className="inv-hright" style={{ textAlign: "right" }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: "rgba(255,255,255,0.08)", letterSpacing: -2, lineHeight: 1, marginBottom: 4 }}>INVOICE</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#c4b5fd" }}>{inv.invoiceNo}</div>
                {inv.orderNo && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>Order # {inv.orderNo}</div>}
                <div style={{ marginTop: 14, display: "flex", gap: 20, justifyContent: "flex-end" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>DATE</div>
                    <div style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>{formatDate(inv.date)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>DUE DATE</div>
                    <div style={{ fontSize: 12, color: "#fbbf24", fontWeight: 700 }}>{formatDate(inv.dueDate)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="inv-btgrid" style={{ display: "grid", gridTemplateColumns: inv.project ? "1fr 1fr" : "1fr", borderBottom: "2px solid #f3f0ff", flexShrink: 0 }}>
            <div style={{ padding: "20px 32px", borderRight: inv.project ? "1px solid #f3f0ff" : "none" }}>
              <div style={{ fontSize: 9, color: "#a78bfa", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>BILL TO</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#1e0a3c" }}>{inv.client || "—"}</div>
              {selectedClient?.companyName && <div style={{ fontSize: 13, color: "#7c3aed", fontWeight: 600, marginTop: 2 }}>{selectedClient.companyName}</div>}
              {selectedClient?.email       && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 5 }}>📧 {selectedClient.email}</div>}
              {selectedClient?.phone       && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>📱 {selectedClient.phone}</div>}
            </div>
            {inv.project && (
              <div style={{ padding: "20px 32px" }}>
                <div style={{ fontSize: 9, color: "#a78bfa", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>PROJECT</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1e0a3c" }}>{inv.project}</div>
              </div>
            )}
          </div>

          {/* Items */}
          <div style={{ padding: "22px 32px", overflowX: "auto", flexShrink: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 360 }}>
              <thead>
                <tr style={{ background: "linear-gradient(90deg,#f5f3ff,#faf5ff)" }}>
                  {["#","Description","Qty","Unit Rate","Amount"].map((h, i) => (
                    <th key={i} style={{ padding: "9px 11px", fontSize: 9, fontWeight: 700, color: "#7c3aed", letterSpacing: 1.5, borderBottom: "2px solid #ede9fe", textAlign: ["Amount","Unit Rate","Qty"].includes(h) ? "right" : "left" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f5f3ff" }}>
                    <td style={{ padding: "12px 11px", color: "#a78bfa", fontWeight: 700, fontSize: 12 }}>{String(idx+1).padStart(2,"0")}</td>
                    <td style={{ padding: "12px 11px", fontSize: 13, fontWeight: 600, color: "#1e0a3c" }}>{item.description || "—"}</td>
                    <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 13, color: "#374151" }}>{item.quantity}</td>
                    <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 13, color: "#374151" }}>{formatINR(item.rate)}</td>
                    <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "#1e0a3c" }}>{formatINR((parseFloat(item.rate)||0)*(parseFloat(item.quantity)||0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <div style={{ width: "min(280px,100%)" }}>
                {[["Subtotal", formatINR(subtotal)], [`GST (${inv.gstRate}%)`, formatINR(gstAmt)]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f0ff" }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{l}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1e0a3c" }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", background: "linear-gradient(135deg,#4c1d95,#6d28d9)", borderRadius: 12, marginTop: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#e9d5ff" }}>TOTAL DUE</span>
                  <span style={{ fontSize: 19, fontWeight: 900, color: "#fff" }}>{formatINR(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes + QR */}
          <div style={{ padding: "0 32px 24px", display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "flex-start", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {inv.notes && (
                <div style={{ background: "#faf5ff", borderRadius: 11, padding: "14px 16px", border: "1px solid #ede9fe" }}>
                  <div style={{ fontSize: 9, color: "#a78bfa", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>📝 NOTES</div>
                  <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7 }}>{inv.notes}</div>
                </div>
              )}
              {inv.terms && (
                <div style={{ background: "#faf5ff", borderRadius: 11, padding: "14px 16px", border: "1px solid #ede9fe" }}>
                  <div style={{ fontSize: 9, color: "#a78bfa", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>📜 TERMS</div>
                  <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7 }}>{inv.terms}</div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#faf5ff", borderRadius: 12, padding: "14px 16px", border: "1px solid #ede9fe", minWidth: 110 }}>
              <div style={{ fontSize: 8, color: "#a78bfa", fontWeight: 700, letterSpacing: 1.5, marginBottom: 8, textAlign: "center" }}>SCAN INVOICE</div>
              <div style={{ background: "#fff", padding: 6, borderRadius: 8, border: "1px solid #ede9fe" }}>
                <QRCodeSVG value={qrData} size={88} bgColor="#ffffff" fgColor="#1e0a3c" />
              </div>
              <div style={{ fontSize: 8, color: "#9ca3af", marginTop: 7, textAlign: "center", fontWeight: 600 }}>{inv.invoiceNo}</div>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Footer */}
          <div style={{ background: "linear-gradient(135deg,#0f0528,#2d0a6e)", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Generated by M Business Suite</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#c4b5fd" }}>🙏 Thank you for your business!</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{inv.invoiceNo}</div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // FORM — Bookipi-style clean, simple
  // ════════════════════════════════════════════════════════
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", maxWidth: 720, margin: "0 auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { border-color: #7c3aed !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
        @keyframes shake { 0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)} }
        .shake { animation: shake 0.35s ease; }
        @media (max-width:600px) { .f2col { grid-template-columns: 1fr !important; } .f3col { grid-template-columns: 1fr 1fr !important; } }
      `}</style>

      {/* Top nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <button onClick={() => setStep("list")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#7c3aed", fontWeight: 700, padding: 0, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
          ← Back
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={clearForm} style={{ padding: "8px 14px", background: "#fff", border: "1.5px solid #f3f4f6", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#6b7280", fontFamily: "inherit" }}>Clear</button>
          <button onClick={handleSaveDraft} disabled={!!saving}
            style={{ padding: "8px 18px", background: draftSaved ? "#22c55e" : "#fff", border: `1.5px solid ${draftSaved ? "#22c55e" : "#e5e7eb"}`, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", color: draftSaved ? "#fff" : "#374151", fontFamily: "inherit", transition: "all 0.3s" }}>
            {saving === "draft" ? "Saving…" : draftSaved ? "✅ Draft Saved!" : "💾 Save Draft"}
          </button>
          <button onClick={handleSavePreview} disabled={!!saving}
            style={{ padding: "8px 22px", background: saving === "preview" ? "#9ca3af" : "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", color: "#fff", fontFamily: "inherit" }}>
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

      {/* ── Section: Invoice Details ── */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #f3f4f6", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 16 }}>Invoice Details</div>
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
            <label style={lbl}>Order Number <span style={{ color: "#d1d5db" }}>(optional)</span></label>
            <input value={inv.orderNo} onChange={(e) => upd("orderNo", e.target.value)} placeholder="ORD-001" style={inp()} />
          </div>
          <div>
            <label style={lbl}>GST Rate</label>
            <select value={inv.gstRate} onChange={(e) => upd("gstRate", Number(e.target.value))} style={inp()}>
              {GST_RATES.map((r) => <option key={r} value={r}>{r === 0 ? "No GST (0%)" : `GST ${r}%`}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Section: Client ── */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: errors.client ? "1.5px solid #fca5a5" : "1px solid #f3f4f6", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 16 }}>Client & Project</div>
        <div className="f2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ ...lbl, color: errors.client ? "#ef4444" : "#6b7280" }}>Client *</label>
            <select value={inv.client}
              onChange={(e) => { upd("client", e.target.value); upd("project", ""); setErrors((p) => { const n={...p}; delete n.client; return n; }); }}
              style={inp(errors.client)}>
              <option value="">— Select Client —</option>
              {clients.map((c, i) => <option key={i} value={c.clientName || c.name}>{c.clientName || c.name}</option>)}
            </select>
            {errors.client && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontWeight: 600 }}>⚠ {errors.client}</div>}
          </div>
          <div>
            <label style={lbl}>Project <span style={{ color: "#d1d5db" }}>(optional)</span></label>
            <select value={inv.project} onChange={(e) => upd("project", e.target.value)} style={{ ...inp(), opacity: !inv.client ? 0.5 : 1 }} disabled={!inv.client}>
              <option value="">— Select Project —</option>
              {filteredProjects.map((p, i) => <option key={i} value={p.name}>{p.name}</option>)}
            </select>
          </div>
        </div>
        {selectedClient && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#f9fafb", borderRadius: 8, display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[["📧", selectedClient.email], ["📱", selectedClient.phone], ["📍", selectedClient.address]].filter(([,v]) => v).map(([icon, val], i) => (
              <span key={i} style={{ fontSize: 12, color: "#6b7280" }}>{icon} {val}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Section: Items ── */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #f3f4f6", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Items / Services</div>
          <button onClick={addItem} style={{ padding: "6px 14px", background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>+ Add Item</button>
        </div>

        {/* Item header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 36px", gap: 8, paddingBottom: 8, borderBottom: "1px solid #f3f4f6", marginBottom: 8 }}>
          {["Description", "Qty", "Rate (₹)", ""].map((h, i) => (
            <div key={i} style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>{h}</div>
          ))}
        </div>

        {items.map((item, idx) => {
          const dErr = errors[`item_${item.id}_description`];
          const rErr = errors[`item_${item.id}_rate`];
          return (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 36px", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <div>
                <input value={item.description} onChange={(e) => updItem(item.id, "description", e.target.value)}
                  placeholder={`Item ${idx + 1} description`} style={{ ...inp(dErr), fontSize: 13 }} />
                {dErr && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>⚠ Required</div>}
              </div>
              <input type="number" min="1" value={item.quantity} onChange={(e) => updItem(item.id, "quantity", e.target.value)}
                style={{ ...inp(), textAlign: "center", fontSize: 13 }} />
              <div>
                <input type="number" min="0" value={item.rate} onChange={(e) => updItem(item.id, "rate", e.target.value)}
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
              <span style={{ fontSize: 13, fontWeight: 600 }}>{formatINR(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>GST ({inv.gstRate}%)</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{formatINR(gstAmt)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "linear-gradient(135deg,#4c1d95,#6d28d9)", borderRadius: 10, marginTop: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#e9d5ff" }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>{formatINR(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section: Notes & Terms ── */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #f3f4f6", marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 16 }}>Notes & Terms <span style={{ color: "#d1d5db", fontWeight: 500 }}>(optional)</span></div>
        <div className="f2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={lbl}>Notes</label>
            <textarea value={inv.notes} onChange={(e) => upd("notes", e.target.value)} placeholder="Additional notes for the client…" rows={3}
              style={{ ...inp(), resize: "vertical", lineHeight: 1.6 }} />
          </div>
          <div>
            <label style={lbl}>Terms & Conditions</label>
            <textarea value={inv.terms} onChange={(e) => upd("terms", e.target.value)} rows={3}
              style={{ ...inp(), resize: "vertical", lineHeight: 1.6 }} />
          </div>
        </div>
      </div>

      {/* Bottom save button */}
      <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
        <button onClick={handleSaveDraft} disabled={!!saving}
          style={{ flex: 1, padding: "13px", background: draftSaved ? "#22c55e" : "#fff", border: `1.5px solid ${draftSaved ? "#22c55e" : "#e5e7eb"}`, borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", color: draftSaved ? "#fff" : "#374151", fontFamily: "inherit", transition: "all 0.3s" }}>
          {saving === "draft" ? "Saving…" : draftSaved ? "✅ Saved as Draft!" : "💾 Save Draft"}
        </button>
        <button onClick={handleSavePreview} disabled={!!saving}
          style={{ flex: 2, padding: "13px", background: saving === "preview" ? "#9ca3af" : "linear-gradient(135deg,#4c1d95,#7c3aed)", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: saving ? "not-allowed" : "pointer", color: "#fff", fontFamily: "inherit" }}>
          {saving === "preview" ? "Saving…" : "Preview & Print →"}
        </button>
      </div>
    </div>
  );
}
