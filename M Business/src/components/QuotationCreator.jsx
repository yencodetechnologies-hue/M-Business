import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { BASE_URL } from "../config";
import axios from "axios";

const GST_RATES = [0, 5, 12, 18, 28];
const DEFAULT_LOGO_URL = "";

function generateQuoteNo() {
  return `QT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
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
    draft:    { bg: "#f3f4f6", color: "#6b7280", label: "📝 Draft" },
    sent:     { bg: "#eff6ff", color: "#2563eb", label: "📤 Sent" },
    approved: { bg: "#dcfce7", color: "#16a34a", label: "✅ Approved" },
    rejected: { bg: "#fee2e2", color: "#dc2626", label: "❌ Rejected" },
    expired:  { bg: "#fef3c7", color: "#d97706", label: "⏰ Expired" },
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
  const id  = qt.quoteNo;
  const idx = all.findIndex((d) => d.id === id);
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.rate)||0)*(parseFloat(i.quantity)||0), 0);
  const total    = subtotal * (1 + (qt.gstRate||0) / 100);
  const entry    = { id, quoteNo: qt.quoteNo, client: qt.client||"—", total, savedAt: Date.now(), qt, items, status: "draft" };
  if (idx >= 0) all[idx] = entry; else all.unshift(entry);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(all.slice(0, 30)));
}

export default function QuotationCreator({ clients = [], projects = [], companyLogo, companyName, onLogoChange, onConvertToInvoice }) {
  const effectiveLogo = companyLogo || DEFAULT_LOGO_URL;
  const [step, setStep]             = useState("list");
  const [qtList, setQtList]         = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [errors, setErrors]         = useState({});
  const [convertingId, setConvertingId] = useState(null);

  const today      = new Date().toISOString().split("T")[0];
  const expDefault = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const blank = {
    quoteNo: generateQuoteNo(), refNo: "", date: today, expiryDate: expDefault,
    client: "", project: "", gstRate: 18, notes: "",
    terms: "This quotation is valid for 30 days from the date of issue.",
    companyName: companyName || "Your Company Name", companyEmail: "",
    companyPhone: "", companyAddress: "",
  };

  const [qt, setQt]     = useState(blank);
  const [items, setItems] = useState([{ id: 1, description: "", quantity: 1, rate: "" }]);

  const upd = (f, v) => setQt((p) => ({ ...p, [f]: v }));
  const selectedClient   = clients.find((c) => (c.clientName || c.name) === qt.client);
  const filteredProjects = projects.filter((p) => !qt.client || p.client === qt.client || p.clientName === qt.client || p.clientId === selectedClient?._id);

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.rate)||0)*(parseFloat(i.quantity)||0), 0);
  const gstAmt   = subtotal * ((qt.gstRate||0) / 100);
  const total    = subtotal + gstAmt;

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

  const addItem    = () => setItems((p) => [...p, { id: Date.now(), description: "", quantity: 1, rate: "" }]);
  const removeItem = (id) => { if (items.length > 1) setItems((p) => p.filter((i) => i.id !== id)); };
  const updItem    = (id, f, v) => {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, [f]: v } : i)));
    setErrors((prev) => { const n = { ...prev }; delete n[`item_${id}_${f}`]; return n; });
  };

  const validate = () => {
    const errs = {};
    if (!qt.client) errs.client = "Client is required";
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
    setTimeout(() => setDraftSaved(false), 2500);
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
    } catch (error) {
      console.error('Status update error:', error);
      alert("Status update failed");
    }
  };

  const inp = (err) => ({
    width: "100%", border: `1.5px solid ${err ? "#ef4444" : "#e5e7eb"}`, borderRadius: 8,
    padding: "10px 12px", fontSize: 14, color: "#111827", background: err ? "#fff5f5" : "#fff",
    boxSizing: "border-box", outline: "none", fontFamily: "inherit", transition: "border-color 0.15s",
  });
  const lbl = { display: "block", fontSize: 12, color: "#6b7280", fontWeight: 600, marginBottom: 4 };

  // ══════════ LIST ══════════
  if (step === "list") {
    const enriched = qtList.map((e) => {
      const expiry = e.qt?.expiryDate || e.expiryDate;
      let status = e.status || "draft";
      if (status === "sent" && expiry && new Date(expiry) < new Date()) status = "expired";
      return { ...e, status };
    });
    const totalAmt    = enriched.reduce((s, e) => s + (parseFloat(e.total)||0), 0);
    const approvedAmt = enriched.filter((e) => e.status === "approved").reduce((s, e) => s + (parseFloat(e.total)||0), 0);
    const pendingCnt  = enriched.filter((e) => ["sent","draft"].includes(e.status)).length;
    const approvedCnt = enriched.filter((e) => e.status === "approved").length;

    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", maxWidth: 1100 }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
          * { box-sizing: border-box; }
          .qt-row:hover { background: #f0fdf4 !important; cursor: pointer; }
          .qt-row { transition: background 0.15s; }
          @media (max-width:700px) { .qt-th { display:none!important; } .qt-hide { display:none!important; } }
        `}</style>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
          <div>
            <p style={{ margin: "3px 0 0", color: "#9ca3af", fontSize: 13 }}>{enriched.length} total</p>
          </div>
          <button onClick={() => { clearForm(); setStep("form"); }}
            style={{ padding: "10px 22px", background: "linear-gradient(135deg,#059669,#10b981)", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>
            + Create Quotation
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Quoted",   value: formatINR(totalAmt),    color: "#059669" },
            { label: "Approved Value", value: formatINR(approvedAmt), color: "#16a34a" },
            { label: "Pending",        value: `${pendingCnt}`,        color: "#d97706" },
            { label: "Approved",       value: `${approvedCnt}`,       color: "#2563eb" },
          ].map((c) => (
            <div key={c.label} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", border: "1px solid #f3f4f6", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3, fontWeight: 600 }}>{c.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f3f4f6", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <div className="qt-th" style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 0.8fr 1fr 0.9fr 0.9fr 1.1fr auto", padding: "11px 20px", background: "#fafafa", borderBottom: "1px solid #f3f4f6", gap: 8 }}>
            {["Quote No","Client","Project","Amount","Date","Expiry","Status","Actions"].map((h) => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: 0.5 }}>{h.toUpperCase()}</div>
            ))}
          </div>

          {listLoading ? (
            <div style={{ padding: "50px 20px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Loading quotations…</div>
          ) : enriched.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>No quotations yet</div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Click "+ Create Quotation" to get started</div>
            </div>
          ) : enriched.map((entry, idx) => {
            const qtD = entry.qt || {};
            return (
              <div key={entry.id || idx} className="qt-row"
                style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 0.8fr 1fr 0.9fr 0.9fr 1.1fr auto", padding: "13px 20px", borderBottom: idx < enriched.length - 1 ? "1px solid #f9fafb" : "none", alignItems: "center", background: "#fff", gap: 8 }}>
                <div onClick={() => loadEntry(entry)} style={{ cursor: "pointer" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{entry.quoteNo || "—"}</div>
                  <div style={{ fontSize: 11, color: "#d1d5db", marginTop: 1 }}>{formatDateTime(entry.savedAt)}</div>
                </div>
                <div onClick={() => loadEntry(entry)} style={{ fontSize: 13, fontWeight: 600, color: "#059669", cursor: "pointer" }}>{entry.client || "—"}</div>
                <div className="qt-hide" style={{ fontSize: 12, color: "#6b7280" }}>{qtD.project || entry.project || "—"}</div>
                <div onClick={() => loadEntry(entry)} style={{ fontSize: 15, fontWeight: 800, color: "#111827", cursor: "pointer" }}>{formatINR(entry.total)}</div>
                <div className="qt-hide" style={{ fontSize: 12, color: "#374151" }}>{formatDate(qtD.date || entry.date)}</div>
                <div className="qt-hide" style={{ fontSize: 12, color: "#d97706", fontWeight: 600 }}>{formatDate(qtD.expiryDate || entry.expiryDate)}</div>
                <div onClick={(e) => e.stopPropagation()}>
                  <select value={entry.status} onChange={(e) => handleStatusChange(entry, e.target.value)}
                    style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "5px 8px", fontSize: 12, fontWeight: 600, color: "#374151", background: "#fff", cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
                    {["draft","sent","approved","rejected","expired","converted"].map((s) => (
                      <option key={s} value={s}>{s === "converted" ? "Invoiced" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                  {entry.status === "approved" && (
                    <button onClick={() => handleConvert(entry)} disabled={convertingId === entry.id}
                      style={{ padding: "5px 10px", background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", borderRadius: 7, fontWeight: 700, fontSize: 11, cursor: "pointer", color: "#fff", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                      {convertingId === entry.id ? "…" : "→ Invoice"}
                    </button>
                  )}
                  {entry.status === "converted" && (
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#6366f1", padding: "5px 10px", background: "#eef2ff", borderRadius: 7 }}>✓ Invoiced</span>
                  )}
                  <button onClick={() => loadEntry(entry)}
                    style={{ padding: "5px 10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 7, fontWeight: 700, fontSize: 11, cursor: "pointer", color: "#059669", fontFamily: "inherit" }}>✏️</button>
                </div>
              </div>
            );
          })}
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
      items: items.map((i) => ({ d: i.description, q: i.quantity, r: i.rate })),
    };
    const qrData = `${window.location.origin}/quotation-view?d=${btoa(unescape(encodeURIComponent(JSON.stringify(slimPayload))))}`;

    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#ecfdf5", minHeight: "100vh", padding: "20px 12px" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
          * { box-sizing: border-box; }
          .qt-paper { max-width: 794px; margin: 0 auto; background: #fff; border-radius: 18px; box-shadow: 0 24px 80px rgba(5,150,105,0.15); overflow: hidden; display: flex; flex-direction: column; }
          @media print {
            @page { size: A4 portrait; margin: 0; }
            html,body { width:210mm!important;height:297mm!important;margin:0!important;padding:0!important;background:white!important;overflow:hidden!important; }
            body * { visibility:hidden!important; }
            .qt-paper,.qt-paper * { visibility:visible!important; }
            .no-print { display:none!important; }
            .qt-paper { position:fixed!important;top:0!important;left:0!important;width:210mm!important;height:297mm!important;max-width:210mm!important;margin:0!important;border-radius:0!important;box-shadow:none!important; }
            .qt-paper * { -webkit-print-color-adjust:exact!important;print-color-adjust:exact!important; }
          }
          @media (max-width:600px) { .qt-hgrid { flex-direction:column!important; } .qt-btgrid { grid-template-columns:1fr!important; } }
        `}</style>

        <div className="no-print" style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
          <button onClick={() => setStep("form")} style={{ padding: "10px 20px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}>← Edit</button>
          <button onClick={() => setStep("list")} style={{ padding: "10px 20px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}>📋 All Quotations</button>
          <button onClick={() => window.print()} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#059669,#10b981)", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>🖨️ Print / PDF</button>
        </div>

        <div className="qt-paper">
          {/* Green header */}
          <div style={{ background: "linear-gradient(135deg,#022c22 0%,#064e3b 50%,#065f46 100%)", padding: "28px 32px", position: "relative", overflow: "hidden", flexShrink: 0 }}>
            <div style={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,rgba(52,211,153,0.15),transparent)", top: -80, right: -40, pointerEvents: "none" }} />
            <div className="qt-hgrid" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1, gap: 20 }}>
              <div>
                {effectiveLogo && <img src={effectiveLogo} alt="logo" style={{ height: 52, borderRadius: 9, marginBottom: 12, objectFit: "contain", background: "rgba(255,255,255,0.1)", padding: 6 }} />}
                <div style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>{qt.companyName}</div>
                {qt.companyEmail   && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>{qt.companyEmail}</div>}
                {qt.companyPhone   && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{qt.companyPhone}</div>}
                {qt.companyAddress && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{qt.companyAddress}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: "rgba(255,255,255,0.07)", letterSpacing: -2, lineHeight: 1, marginBottom: 4 }}>QUOTATION</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#6ee7b7" }}>{qt.quoteNo}</div>
                {qt.refNo && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>Ref # {qt.refNo}</div>}
                <div style={{ marginTop: 14, display: "flex", gap: 20, justifyContent: "flex-end" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>DATE</div>
                    <div style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>{formatDate(qt.date)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>VALID UNTIL</div>
                    <div style={{ fontSize: 12, color: "#fbbf24", fontWeight: 700 }}>{formatDate(qt.expiryDate)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prepared for */}
          <div className="qt-btgrid" style={{ display: "grid", gridTemplateColumns: qt.project ? "1fr 1fr" : "1fr", borderBottom: "2px solid #f0fdf4", flexShrink: 0 }}>
            <div style={{ padding: "20px 32px", borderRight: qt.project ? "1px solid #f0fdf4" : "none" }}>
              <div style={{ fontSize: 9, color: "#059669", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>PREPARED FOR</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>{qt.client || "—"}</div>
              {selectedClient?.companyName && <div style={{ fontSize: 13, color: "#059669", fontWeight: 600, marginTop: 2 }}>{selectedClient.companyName}</div>}
              {selectedClient?.email && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 5 }}>📧 {selectedClient.email}</div>}
              {selectedClient?.phone && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>📱 {selectedClient.phone}</div>}
            </div>
            {qt.project && (
              <div style={{ padding: "20px 32px" }}>
                <div style={{ fontSize: 9, color: "#059669", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>PROJECT</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{qt.project}</div>
              </div>
            )}
          </div>

          {/* Items */}
          <div style={{ padding: "22px 32px", overflowX: "auto", flexShrink: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 360 }}>
              <thead>
                <tr style={{ background: "linear-gradient(90deg,#f0fdf4,#f7fffe)" }}>
                  {["#","Description","Qty","Unit Rate","Amount"].map((h, i) => (
                    <th key={i} style={{ padding: "9px 11px", fontSize: 9, fontWeight: 700, color: "#059669", letterSpacing: 1.5, borderBottom: "2px solid #d1fae5", textAlign: ["Amount","Unit Rate","Qty"].includes(h) ? "right" : "left" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f0fdf4" }}>
                    <td style={{ padding: "12px 11px", color: "#6ee7b7", fontWeight: 700, fontSize: 12 }}>{String(idx+1).padStart(2,"0")}</td>
                    <td style={{ padding: "12px 11px", fontSize: 13, fontWeight: 600, color: "#111827" }}>{item.description || "—"}</td>
                    <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 13, color: "#374151" }}>{item.quantity}</td>
                    <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 13, color: "#374151" }}>{formatINR(item.rate)}</td>
                    <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "#111827" }}>{formatINR((parseFloat(item.rate)||0)*(parseFloat(item.quantity)||0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <div style={{ width: "min(280px,100%)" }}>
                {[["Subtotal", formatINR(subtotal)],[`GST (${qt.gstRate}%)`, formatINR(gstAmt)]].map(([l,v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0fdf4" }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{l}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", background: "linear-gradient(135deg,#064e3b,#059669)", borderRadius: 12, marginTop: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#d1fae5" }}>QUOTED AMOUNT</span>
                  <span style={{ fontSize: 19, fontWeight: 900, color: "#fff" }}>{formatINR(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes + QR */}
          <div style={{ padding: "0 32px 24px", display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "flex-start", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {qt.notes && (
                <div style={{ background: "#f0fdf4", borderRadius: 11, padding: "14px 16px", border: "1px solid #d1fae5" }}>
                  <div style={{ fontSize: 9, color: "#059669", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>📝 NOTES</div>
                  <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7 }}>{qt.notes}</div>
                </div>
              )}
              {qt.terms && (
                <div style={{ background: "#f0fdf4", borderRadius: 11, padding: "14px 16px", border: "1px solid #d1fae5" }}>
                  <div style={{ fontSize: 9, color: "#059669", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>📜 TERMS</div>
                  <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7 }}>{qt.terms}</div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#f0fdf4", borderRadius: 12, padding: "14px 16px", border: "1px solid #d1fae5", minWidth: 110 }}>
              <div style={{ fontSize: 8, color: "#059669", fontWeight: 700, letterSpacing: 1.5, marginBottom: 8, textAlign: "center" }}>SCAN QUOTE</div>
              <div style={{ background: "#fff", padding: 6, borderRadius: 8, border: "1px solid #d1fae5" }}>
                <QRCodeSVG value={qrData} size={88} bgColor="#ffffff" fgColor="#064e3b" />
              </div>
              <div style={{ fontSize: 8, color: "#9ca3af", marginTop: 7, textAlign: "center", fontWeight: 600 }}>{qt.quoteNo}</div>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Footer */}
          <div style={{ background: "linear-gradient(135deg,#022c22,#064e3b)", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{qt.companyName}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6ee7b7" }}>🙏 Thank you for considering us!</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{qt.quoteNo}</div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════ FORM ══════════
  const hasErrors = Object.keys(errors).length > 0;
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", maxWidth: 720, margin: "0 auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input:focus,select:focus,textarea:focus { border-color: #059669 !important; box-shadow: 0 0 0 3px rgba(5,150,105,0.1); }
        @keyframes shake { 0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)} }
        .shake { animation: shake 0.35s ease; }
        @media (max-width:600px) { .f2col { grid-template-columns:1fr!important; } .f3col { grid-template-columns:1fr 1fr!important; } }
      `}</style>

      {/* Top nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <button onClick={() => setStep("list")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#059669", fontWeight: 700, padding: 0, fontFamily: "inherit" }}>← Back</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={clearForm} style={{ padding: "8px 14px", background: "#fff", border: "1.5px solid #f3f4f6", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#6b7280", fontFamily: "inherit" }}>Clear</button>
          <button onClick={handleSaveDraft} disabled={!!saving}
            style={{ padding: "8px 18px", background: draftSaved ? "#22c55e" : "#fff", border: `1.5px solid ${draftSaved ? "#22c55e" : "#e5e7eb"}`, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", color: draftSaved ? "#fff" : "#374151", fontFamily: "inherit", transition: "all 0.3s" }}>
            {saving === "draft" ? "Saving…" : draftSaved ? "✅ Saved!" : "💾 Save Draft"}
          </button>
          <button onClick={handleSavePreview} disabled={!!saving}
            style={{ padding: "8px 22px", background: saving === "preview" ? "#9ca3af" : "linear-gradient(135deg,#059669,#10b981)", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", color: "#fff", fontFamily: "inherit" }}>
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
            <label style={lbl}>Reference No <span style={{ color: "#d1d5db" }}>(optional)</span></label>
            <input value={qt.refNo} onChange={(e) => upd("refNo", e.target.value)} placeholder="REF-001" style={inp()} />
          </div>
          <div>
            <label style={lbl}>GST Rate</label>
            <select value={qt.gstRate} onChange={(e) => upd("gstRate", Number(e.target.value))} style={inp()}>
              {GST_RATES.map((r) => <option key={r} value={r}>{r === 0 ? "No GST (0%)" : `GST ${r}%`}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Client */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: errors.client ? "1.5px solid #fca5a5" : "1px solid #f3f4f6", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 16 }}>Client & Project</div>
        <div className="f2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ ...lbl, color: errors.client ? "#ef4444" : "#6b7280" }}>Client *</label>
            <select value={qt.client} onChange={(e) => { upd("client", e.target.value); upd("project", ""); setErrors((p) => { const n={...p}; delete n.client; return n; }); }} style={inp(errors.client)}>
              <option value="">— Select Client —</option>
              {clients.map((c, i) => <option key={i} value={c.clientName || c.name}>{c.clientName || c.name}</option>)}
            </select>
            {errors.client && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontWeight: 600 }}>⚠ {errors.client}</div>}
          </div>
          <div>
            <label style={lbl}>Project <span style={{ color: "#d1d5db" }}>(optional)</span></label>
            <select value={qt.project} onChange={(e) => upd("project", e.target.value)} style={{ ...inp(), opacity: !qt.client ? 0.5 : 1 }} disabled={!qt.client}>
              <option value="">— Select Project —</option>
              {filteredProjects.map((p, i) => <option key={i} value={p.name}>{p.name}</option>)}
            </select>
          </div>
        </div>
        {selectedClient && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[["📧", selectedClient.email], ["📱", selectedClient.phone], ["📍", selectedClient.address]].filter(([,v]) => v).map(([icon, val], i) => (
              <span key={i} style={{ fontSize: 12, color: "#6b7280" }}>{icon} {val}</span>
            ))}
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #f3f4f6", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Items / Services</div>
          <button onClick={addItem} style={{ padding: "6px 14px", background: "linear-gradient(135deg,#059669,#10b981)", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>+ Add Item</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 36px", gap: 8, paddingBottom: 8, borderBottom: "1px solid #f3f4f6", marginBottom: 8 }}>
          {["Description","Qty","Rate (₹)",""].map((h, i) => <div key={i} style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>{h}</div>)}
        </div>
        {items.map((item, idx) => {
          const dErr = errors[`item_${item.id}_description`];
          const rErr = errors[`item_${item.id}_rate`];
          return (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 36px", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <div>
                <input value={item.description} onChange={(e) => updItem(item.id, "description", e.target.value)} placeholder={`Item ${idx+1} description`} style={{ ...inp(dErr), fontSize: 13 }} />
                {dErr && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>⚠ Required</div>}
              </div>
              <input type="number" min="1" value={item.quantity} onChange={(e) => updItem(item.id, "quantity", e.target.value)} style={{ ...inp(), textAlign: "center", fontSize: 13 }} />
              <div>
                <input type="number" min="0" value={item.rate} onChange={(e) => updItem(item.id, "rate", e.target.value)} placeholder="0.00" style={{ ...inp(rErr), textAlign: "right", fontSize: 13 }} />
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
              <span style={{ fontSize: 13, fontWeight: 600 }}>{formatINR(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>GST ({qt.gstRate}%)</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{formatINR(gstAmt)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "linear-gradient(135deg,#064e3b,#059669)", borderRadius: 10, marginTop: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#d1fae5" }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>{formatINR(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes & Terms */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #f3f4f6", marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 16 }}>Notes & Terms <span style={{ color: "#d1d5db", fontWeight: 500 }}>(optional)</span></div>
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
          style={{ flex: 1, padding: "13px", background: draftSaved ? "#22c55e" : "#fff", border: `1.5px solid ${draftSaved ? "#22c55e" : "#e5e7eb"}`, borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", color: draftSaved ? "#fff" : "#374151", fontFamily: "inherit", transition: "all 0.3s" }}>
          {saving === "draft" ? "Saving…" : draftSaved ? "✅ Saved as Draft!" : "💾 Save Draft"}
        </button>
        <button onClick={handleSavePreview} disabled={!!saving}
          style={{ flex: 2, padding: "13px", background: saving === "preview" ? "#9ca3af" : "linear-gradient(135deg,#064e3b,#059669)", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: saving ? "not-allowed" : "pointer", color: "#fff", fontFamily: "inherit" }}>
          {saving === "preview" ? "Saving…" : "Preview & Print →"}
        </button>
      </div>
    </div>
  );
}
