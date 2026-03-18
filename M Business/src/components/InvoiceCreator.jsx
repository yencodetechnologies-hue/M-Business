import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

const GST_RATES = [0, 5, 12, 18, 28];

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

function QRCode({ value, size = 80 }) {
  const canvasRef = useRef();
  useEffect(() => {
    if (!value || !canvasRef.current) return;
    function renderQR() {
      if (!canvasRef.current) return;
      canvasRef.current.innerHTML = "";
      try {
        new window.QRCode(canvasRef.current, {
          text: value, width: size, height: size,
          colorDark: "#1e0a3c", colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.M,
        });
      } catch (e) { console.error("QR Error", e); }
    }
    if (!window.QRCode) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      script.onload = renderQR;
      document.head.appendChild(script);
    } else { renderQR(); }
  }, [value, size]);
  return <div ref={canvasRef} style={{ lineHeight: 0 }} />;
}

const DRAFTS_KEY = "invoice_drafts";
function loadAllDrafts() {
  try { const d = localStorage.getItem(DRAFTS_KEY); return d ? JSON.parse(d) : []; }
  catch { return []; }
}
function saveDraftToList(inv, items) {
  const drafts = loadAllDrafts();
  const id = inv.invoiceNo;
  const existing = drafts.findIndex(d => d.id === id);
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.rate)||0)*(parseFloat(i.quantity)||0), 0);
  const total = subtotal * (1 + inv.gstRate / 100);
  const entry = { id, invoiceNo: inv.invoiceNo, client: inv.client || "—", total, savedAt: Date.now(), inv, items };
  if (existing >= 0) drafts[existing] = entry;
  else drafts.unshift(entry);
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.slice(0, 20)));
}
function deleteDraft(id) {
  const drafts = loadAllDrafts().filter(d => d.id !== id);
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

export default function InvoiceCreator({ clients = [], projects = [], companyLogo, onLogoChange }) {
  const [step, setStep] = useState("form");
  const [draftSaved, setDraftSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const [drafts, setDrafts] = useState(loadAllDrafts);
  const logoRef = useRef();

  const today = new Date().toISOString().split("T")[0];
  const dueDefault = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
  const blankInv = {
    invoiceNo: generateInvoiceNo(), orderNo: "", date: today, dueDate: dueDefault,
    client: "", project: "", gstRate: 18, notes: "",
    terms: "Payment due within 30 days. Thank you for your business!",
    companyName: "M Business Suite", companyEmail: "management@mbusiness.com",
    companyPhone: "", companyAddress: "",
  };

  const [inv, setInv] = useState(blankInv);
  const [items, setItems] = useState([{ id: 1, description: "", quantity: 1, rate: "" }]);

  const upd = (f, v) => setInv(p => ({ ...p, [f]: v }));
  const selectedClient = clients.find(c => (c.clientName || c.name) === inv.client);
  const filteredProjects = projects.filter(p => 
  !inv.client || 
  p.client === inv.client || 
  p.clientName === inv.client ||
  p.clientId === selectedClient?._id
);

  const addItem = () => {
    const last = items[items.length - 1];
    const newErrs = {};
    if (!last.description.trim()) newErrs[`item_${last.id}_description`] = true;
    if (!last.rate || parseFloat(last.rate) <= 0) newErrs[`item_${last.id}_rate`] = true;
    if (!last.quantity || parseFloat(last.quantity) <= 0) newErrs[`item_${last.id}_quantity`] = true;
    if (Object.keys(newErrs).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrs }));
      const el = document.getElementById(`item-row-${last.id}`);
      if (el) { el.classList.remove("inv-shake"); void el.offsetWidth; el.classList.add("inv-shake"); }
      return;
    }
    setItems(p => [...p, { id: Date.now(), description: "", quantity: 1, rate: "" }]);
  };
  const removeItem = (id) => setItems(p => p.filter(i => i.id !== id));
  const updItem = (id, f, v) => {
    setItems(p => p.map(i => i.id === id ? { ...i, [f]: v } : i));
    setErrors(prev => { const next = { ...prev }; delete next[`item_${id}_${f}`]; return next; });
  };

const handleSaveDraft = async () => {
  try {
    // MongoDB la save
    const res = await fetch("http://localhost:5000/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inv, items }),
    });
    const data = await res.json();
    
    if (data.success) {
      // localStorage la also save (offline backup)
      saveDraftToList(inv, items);
      setDrafts(loadAllDrafts());
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2500);
    } else {
      alert("Save failed: " + data.msg);
    }
  } catch (err) {
    console.error(err);
    // Backend illa-na localStorage fallback
    saveDraftToList(inv, items);
    setDrafts(loadAllDrafts());
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2500);
  }
};

  const clearForm = () => {
    setInv({ ...blankInv, invoiceNo: generateInvoiceNo() });
    setItems([{ id: 1, description: "", quantity: 1, rate: "" }]);
    setErrors({});
  };

  const loadDraftEntry = (entry) => {
    setInv(entry.inv);
    setItems(entry.items);
    setErrors({});
    setStep("form");
  };

  const validate = () => {
    const errs = {};
    if (!inv.client) errs.client = "Client is required";
    items.forEach((item, idx) => {
      if (!item.description.trim()) errs[`item_${item.id}_description`] = `Item ${idx + 1}: Description required`;
      if (!item.rate || parseFloat(item.rate) <= 0) errs[`item_${item.id}_rate`] = `Item ${idx + 1}: Rate must be > 0`;
      if (!item.quantity || parseFloat(item.quantity) <= 0) errs[`item_${item.id}_quantity`] = `Item ${idx + 1}: Qty must be > 0`;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePreview = () => {
    if (validate()) setStep("preview");
    else setTimeout(() => { const el = document.querySelector(".inv-error"); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); }, 100);
  };

const handleLogo = async (file) => {
  if (!file) return;

  const fd = new FormData();
  fd.append("file", file);
  try {
    const res = await fetch("http://localhost:5000/api/upload/logo", {
      method: "POST",
      body: fd,
    });
    const data = await res.json();

    if (data.logoUrl) {
      onLogoChange(data.logoUrl);
    } else {
      alert("Upload failed: " + (data.msg || "Unknown error"));
    }
  } catch (err) {
    console.error(err);
    alert("Upload failed!");
  }
};

  const iStyle = { width: "100%", border: "1.5px solid #ede9fe", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#1e0a3c", background: "#faf5ff", boxSizing: "border-box", outline: "none", fontFamily: "inherit" };
  const iStyleError = { ...iStyle, border: "1.5px solid #ef4444", background: "#fff5f5" };
  const lStyle = { display: "block", fontSize: 11, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5, marginBottom: 5 };

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseFloat(i.quantity) || 0), 0);
  const gstAmt = subtotal * (inv.gstRate / 100);
  const total = subtotal + gstAmt;

  const slimPayload = {
    no: inv.invoiceNo, date: inv.date, due: inv.dueDate,
    co: inv.companyName, email: inv.companyEmail, phone: inv.companyPhone, addr: inv.companyAddress,
    cl: inv.client, proj: inv.project, gst: inv.gstRate, notes: inv.notes, terms: inv.terms,
    items: items.map(i => ({ d: i.description, q: i.quantity, r: i.rate })),
  };
  const qrEncoded = btoa(unescape(encodeURIComponent(JSON.stringify(slimPayload))));
  const BASE_URL = window.location.origin;
  const qrData = `${BASE_URL}/invoice-view?d=${qrEncoded}`;

  if (step === "drafts") {
    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');* { box-sizing: border-box; }`}</style>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e0a3c" }}>💾 Saved Drafts</h2>
            <p style={{ margin: "3px 0 0", color: "#a78bfa", fontSize: 12 }}>{drafts.length} draft{drafts.length !== 1 ? "s" : ""} saved</p>
          </div>
          <button onClick={() => setStep("form")} style={{ padding: "9px 18px", background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>+ New Invoice</button>
        </div>

        {drafts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#a78bfa" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e0a3c" }}>No drafts saved yet</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Create an invoice and click "Save Draft"</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {drafts.map(d => (
              <div key={d.id} style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #ede9fe", boxShadow: "0 4px 20px rgba(147,51,234,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1e0a3c" }}>{d.invoiceNo}</div>
                  <div style={{ fontSize: 12, color: "#7c3aed", marginTop: 2, fontWeight: 600 }}>{d.client}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>💾 {formatDateTime(d.savedAt)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#4c1d95" }}>{formatINR(d.total)}</div>
                  <button onClick={() => loadDraftEntry(d)} style={{ padding: "7px 14px", background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>✏️ Edit</button>
                  <button onClick={() => { deleteDraft(d.id); setDrafts(loadAllDrafts()); }} style={{ padding: "7px 10px", background: "#fee2e2", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", color: "#ef4444", fontFamily: "inherit" }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (step === "preview") {
    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#e8e0f5", minHeight: "100vh", padding: "20px 12px" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
          * { box-sizing: border-box; }
          .inv-prev-toolbar { display: flex; gap: 8px; justify-content: center; margin-bottom: 20px; flex-wrap: wrap; }
          .invoice-paper { max-width: 794px; margin: 0 auto; background: #fff; border-radius: 18px; box-shadow: 0 24px 80px rgba(100,60,200,0.18); overflow: hidden; }
          @media print {
            @page { size: A4 portrait; margin: 0; }
            html, body { width: 210mm !important; height: 297mm !important; margin: 0 !important; padding: 0 !important; background: white !important; overflow: hidden !important; }
            body * { visibility: hidden !important; }
            .invoice-paper { visibility: visible !important; }
            .invoice-paper * { visibility: visible !important; }
            .no-print { display: none !important; }
            .invoice-paper { position: fixed !important; top: 0 !important; left: 0 !important; width: 210mm !important; height: 297mm !important; max-width: 210mm !important; margin: 0 !important; padding: 0 !important; border-radius: 0 !important; box-shadow: none !important; overflow: hidden !important; display: flex !important; flex-direction: column !important; background: #fff !important; }
            .invoice-paper * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
            .inv-spacer { flex: 1 !important; min-height: 20mm !important; }
          }
          @media (max-width: 600px) {
            .inv-prev-toolbar { flex-direction: column !important; align-items: stretch !important; }
            .inv-header-grid { flex-direction: column !important; gap: 16px !important; }
            .inv-header-right { text-align: left !important; }
            .inv-billto-grid { grid-template-columns: 1fr !important; }
            .inv-footer-row { flex-direction: column !important; gap: 6px !important; text-align: center !important; }
          }
        `}</style>

        <div className="no-print inv-prev-toolbar">
          <button onClick={() => setStep("form")} style={{ padding: "10px 20px", background: "#fff", border: "1.5px solid #ddd6fe", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#1e0a3c", fontFamily: "inherit" }}>← Edit Invoice</button>
          <button onClick={handleSaveDraft} style={{ padding: "10px 20px", background: draftSaved ? "#22c55e" : "#fff", border: `1.5px solid ${draftSaved ? "#22c55e" : "#ddd6fe"}`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: draftSaved ? "#fff" : "#1e0a3c", fontFamily: "inherit", transition: "all 0.3s" }}>
            {draftSaved ? "✅ Draft Saved!" : "💾 Save Draft"}
          </button>
          <button onClick={() => window.print()} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>🖨️ Print / Save PDF</button>
        </div>

        <div className="invoice-paper print-root">
          <div className="inv-header-section" style={{ background: "linear-gradient(135deg,#0f0528 0%,#2d0a6e 50%,#4c1d95 100%)", padding: "28px 32px", position: "relative", overflow: "hidden", flexShrink: 0 }}>
            <div style={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,0.15),transparent)", top: -80, right: -40, pointerEvents: "none" }} />
            <div className="inv-header-grid" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1, gap: 20 }}>
              <div>
                {companyLogo ? <img src={companyLogo} alt="logo" style={{ height: 52, borderRadius: 9, marginBottom: 12, objectFit: "contain", background: "rgba(255,255,255,0.1)", padding: 6 }} />
                  : <div style={{ width: 46, height: 46, background: "linear-gradient(135deg,#a78bfa,#c084fc)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 12 }}>M</div>}
                <div style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>{inv.companyName}</div>
                {inv.companyEmail && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>{inv.companyEmail}</div>}
                {inv.companyPhone && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{inv.companyPhone}</div>}
                {inv.companyAddress && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{inv.companyAddress}</div>}
              </div>
              <div className="inv-header-right" style={{ textAlign: "right" }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: "rgba(255,255,255,0.1)", letterSpacing: -2, lineHeight: 1, marginBottom: 4 }}>INVOICE</div>
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

          <div className="inv-billto-grid" style={{ display: "grid", gridTemplateColumns: inv.project ? "1fr 1fr" : "1fr", borderBottom: "2px solid #f3f0ff", flexShrink: 0 }}>
            <div style={{ padding: "20px 32px", borderRight: inv.project ? "1px solid #f3f0ff" : "none" }}>
              <div style={{ fontSize: 9, color: "#a78bfa", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>BILL TO</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#1e0a3c" }}>{inv.client || "—"}</div>
              {selectedClient?.companyName && <div style={{ fontSize: 13, color: "#7c3aed", fontWeight: 600, marginTop: 2 }}>{selectedClient.companyName}</div>}
              {selectedClient?.email && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 5 }}>📧 {selectedClient.email}</div>}
              {selectedClient?.phone && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>📱 {selectedClient.phone}</div>}
            </div>
            {inv.project && <div style={{ padding: "20px 32px" }}>
              <div style={{ fontSize: 9, color: "#a78bfa", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>PROJECT</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e0a3c" }}>{inv.project}</div>
            </div>}
          </div>

          <div style={{ padding: "22px 32px", overflowX: "auto", flexShrink: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 360 }}>
              <thead>
                <tr style={{ background: "linear-gradient(90deg,#f5f3ff,#faf5ff)" }}>
                  {["#", "Description", "Qty", "Unit Rate", "Amount"].map((h, i) => (
                    <th key={i} style={{ padding: "9px 11px", fontSize: 9, fontWeight: 700, color: "#7c3aed", letterSpacing: 1.5, borderBottom: "2px solid #ede9fe", textAlign: ["Amount", "Unit Rate", "Qty"].includes(h) ? "right" : "left" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f5f3ff" }}>
                    <td style={{ padding: "12px 11px", color: "#a78bfa", fontWeight: 700, fontSize: 12 }}>{String(idx + 1).padStart(2, "0")}</td>
                    <td style={{ padding: "12px 11px", fontSize: 13, fontWeight: 600, color: "#1e0a3c" }}>{item.description || "—"}</td>
                    <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 13, color: "#374151" }}>{item.quantity}</td>
                    <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 13, color: "#374151" }}>{formatINR(item.rate)}</td>
                    <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "#1e0a3c" }}>{formatINR((parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <div style={{ width: "min(280px, 100%)" }}>
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

          <div style={{ padding: "0 32px 24px", display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "flex-start", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {inv.notes && <div style={{ background: "#faf5ff", borderRadius: 11, padding: "14px 16px", border: "1px solid #ede9fe" }}>
                <div style={{ fontSize: 9, color: "#a78bfa", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>📝 NOTES</div>
                <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7 }}>{inv.notes}</div>
              </div>}
              {inv.terms && <div style={{ background: "#faf5ff", borderRadius: 11, padding: "14px 16px", border: "1px solid #ede9fe" }}>
                <div style={{ fontSize: 9, color: "#a78bfa", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>📜 TERMS & CONDITIONS</div>
                <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7 }}>{inv.terms}</div>
              </div>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#faf5ff", borderRadius: 12, padding: "14px 16px", border: "1px solid #ede9fe", minWidth: 110 }}>
              <div style={{ fontSize: 8, color: "#a78bfa", fontWeight: 700, letterSpacing: 1.5, marginBottom: 8, textAlign: "center" }}>SCAN INVOICE</div>
              <div style={{ background: "#fff", padding: 6, borderRadius: 8, border: "1px solid #ede9fe" }}>
               <QRCodeSVG value={qrData} size={88} bgColor="#ffffff" fgColor="#1e0a3c" />
              </div>
              <div style={{ fontSize: 8, color: "#9ca3af", marginTop: 7, textAlign: "center", fontWeight: 600 }}>{inv.invoiceNo}</div>
              <div style={{ fontSize: 7, color: "#c4b5fd", marginTop: 3, textAlign: "center" }}>Scan for details</div>
            </div>
          </div>

          <div className="inv-spacer" style={{ flex: 1 }} />

          <div className="inv-footer-row" style={{ background: "linear-gradient(135deg,#0f0528,#2d0a6e)", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Generated by M Business Suite</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#c4b5fd" }}>🙏 Thank you for your business!</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{inv.invoiceNo}</div>
          </div>
        </div>
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;
  const itemErrors = Object.entries(errors).filter(([k]) => k.startsWith("item_"));

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .inv-error { animation: shake 0.35s ease; }
        .inv-shake { animation: shake 0.4s ease !important; }
        @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        @media (max-width: 768px) { .inv-form-layout { grid-template-columns: 1fr !important; } .inv-summary-panel { position: static !important; } .inv-2col { grid-template-columns: 1fr !important; } .inv-3col { grid-template-columns: 1fr 1fr !important; } .inv-item-row { grid-template-columns: 24px 1fr 60px 90px 32px !important; } .inv-item-header { grid-template-columns: 24px 1fr 60px 90px 32px !important; } }
        @media (max-width: 480px) { .inv-3col { grid-template-columns: 1fr !important; } .inv-top-btns { flex-wrap: wrap !important; } .inv-item-row { grid-template-columns: 24px 1fr 52px 80px 28px !important; gap: 4px !important; } .inv-item-header { grid-template-columns: 24px 1fr 52px 80px 28px !important; gap: 4px !important; } }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e0a3c" }}>🧾 Create Invoice</h2>
          <p style={{ margin: "3px 0 0", color: "#a78bfa", fontSize: 12 }}>Fill details → Save Draft → Preview → Print as PDF</p>
        </div>
        <div className="inv-top-btns" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={clearForm} style={{ padding: "9px 14px", background: "#fff", border: "1.5px solid #fecaca", borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: "pointer", color: "#ef4444", fontFamily: "inherit" }}>🗑️ Clear</button>
          <button onClick={() => { setDrafts(loadAllDrafts()); setStep("drafts"); }} style={{ padding: "9px 14px", background: "#fff", border: "1.5px solid #ede9fe", borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: "pointer", color: "#7c3aed", fontFamily: "inherit" }}>
            💾 Drafts {drafts.length > 0 && <span style={{ background: "#7c3aed", color: "#fff", borderRadius: 10, fontSize: 10, padding: "1px 6px", marginLeft: 4 }}>{drafts.length}</span>}
          </button>
          <button onClick={handleSaveDraft} style={{ padding: "9px 14px", background: draftSaved ? "#22c55e" : "#fff", border: `1.5px solid ${draftSaved ? "#22c55e" : "#ede9fe"}`, borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: "pointer", color: draftSaved ? "#fff" : "#7c3aed", fontFamily: "inherit", transition: "all 0.3s" }}>
            {draftSaved ? "✅ Saved!" : "💾 Save Draft"}
          </button>
          <button onClick={handlePreview} style={{ padding: "9px 18px", background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>👁️ Preview →</button>
        </div>
      </div>

      {hasErrors && (
        <div className="inv-error" style={{ background: "#fff5f5", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "12px 16px", marginBottom: 14, fontSize: 12, color: "#b91c1c" }}>
          <div style={{ fontWeight: 800, marginBottom: 5 }}>⚠️ Please fix the following before previewing:</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {errors.client && <li>{errors.client}</li>}
            {itemErrors.map(([k, v]) => <li key={k}>{v}</li>)}
          </ul>
        </div>
      )}

      <div className="inv-form-layout" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <div style={{ background: "#fff", borderRadius: 14, padding: 18, border: "1px solid #ede9fe", boxShadow: "0 4px 20px rgba(147,51,234,0.06)" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#1e0a3c" }}>🏢 Company Info</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div onClick={() => logoRef.current?.click()} style={{ width: 68, height: 68, borderRadius: 12, border: "2px dashed #c084fc", background: "#faf5ff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", flexShrink: 0 }}>
                {companyLogo ? <img src={companyLogo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <><span style={{ fontSize: 20 }}>🖼️</span><span style={{ fontSize: 9, color: "#a78bfa", marginTop: 2, fontWeight: 700 }}>LOGO</span></>}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1e0a3c" }}>{companyLogo ? "✅ Logo uploaded" : "Upload company logo"}</div>
                <div style={{ fontSize: 11, color: "#a78bfa", marginTop: 2 }}>Click to upload PNG/JPG</div>
                {companyLogo && <button onClick={() => onLogoChange(null)} style={{ marginTop: 4, fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, padding: 0 }}>✕ Remove</button>}
              </div>
              <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleLogo(e.target.files[0])} />
            </div>
            <div className="inv-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
              {[["COMPANY NAME", "companyName"], ["EMAIL", "companyEmail"], ["PHONE", "companyPhone"], ["ADDRESS", "companyAddress"]].map(([label, field]) => (
                <div key={field} style={{ marginBottom: 10 }}>
                  <label style={lStyle}>{label}</label>
                  <input value={inv[field]} onChange={e => upd(field, e.target.value)} style={iStyle} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 14, padding: 18, border: "1px solid #ede9fe", boxShadow: "0 4px 20px rgba(147,51,234,0.06)" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#1e0a3c" }}>📋 Invoice Details</h3>
            <div className="inv-3col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 14px" }}>
              <div style={{ marginBottom: 10 }}>
                <label style={lStyle}>INVOICE NUMBER</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={inv.invoiceNo} onChange={e => upd("invoiceNo", e.target.value)} style={{ ...iStyle, flex: 1 }} />
                  <button onClick={() => upd("invoiceNo", generateInvoiceNo())} style={{ padding: "0 8px", background: "#f5f3ff", border: "1.5px solid #ede9fe", borderRadius: 9, cursor: "pointer", fontSize: 13 }}>🔄</button>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={lStyle}>ORDER NUMBER</label>
                <input value={inv.orderNo} onChange={e => upd("orderNo", e.target.value)} placeholder="ORD-001" style={iStyle} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={lStyle}>GST RATE</label>
                <select value={inv.gstRate} onChange={e => upd("gstRate", Number(e.target.value))} style={iStyle}>
                  {GST_RATES.map(r => <option key={r} value={r}>{r === 0 ? "No GST (0%)" : `GST ${r}%`}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={lStyle}>INVOICE DATE</label>
                <input type="date" value={inv.date} onChange={e => upd("date", e.target.value)} style={iStyle} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={lStyle}>DUE DATE</label>
                <input type="date" value={inv.dueDate} onChange={e => upd("dueDate", e.target.value)} style={iStyle} />
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 14, padding: 18, border: errors.client ? "1.5px solid #fca5a5" : "1px solid #ede9fe", boxShadow: "0 4px 20px rgba(147,51,234,0.06)" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#1e0a3c" }}>👥 Client & Project</h3>
            <div className="inv-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
              <div style={{ marginBottom: 10 }}>
                <label style={{ ...lStyle, color: errors.client ? "#ef4444" : "#7c3aed" }}>SELECT CLIENT *</label>
                <select value={inv.client} onChange={e => { upd("client", e.target.value); upd("project", ""); setErrors(p => { const n = { ...p }; delete n.client; return n; }); }} style={errors.client ? iStyleError : iStyle}>
                  <option value="">-- Select Client --</option>
                  {clients.map((c, i) => <option key={i} value={c.clientName || c.name}>{c.clientName || c.name}</option>)}
                </select>
                {errors.client && <div style={{ fontSize: 10, color: "#ef4444", marginTop: 3, fontWeight: 600 }}>⚠ {errors.client}</div>}
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={lStyle}>SELECT PROJECT</label>
                <select value={inv.project} onChange={e => upd("project", e.target.value)} style={{ ...iStyle, opacity: !inv.client ? 0.5 : 1 }} disabled={!inv.client}>
                  <option value="">-- Select Project --</option>
                  {filteredProjects.map((p, i) => <option key={i} value={p.name}>{p.name}</option>)}
                </select>
              </div>
            </div>
            {selectedClient && (
              <div style={{ background: "#f5f3ff", borderRadius: 9, padding: "9px 12px", border: "1px solid #ede9fe", display: "flex", gap: 14, flexWrap: "wrap" }}>
                {[["📧", selectedClient.email], ["📱", selectedClient.phone], ["📍", selectedClient.address]].filter(([, v]) => v).map(([icon, val], i) => (
                  <span key={i} style={{ fontSize: 12, color: "#6b7280" }}>{icon} {val}</span>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: "#fff", borderRadius: 14, padding: 18, border: "1px solid #ede9fe", boxShadow: "0 4px 20px rgba(147,51,234,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e0a3c" }}>📦 Items / Services</h3>
              <button onClick={addItem} style={{ padding: "7px 14px", background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>+ Add Item</button>
            </div>
            <div className="inv-item-header" style={{ display: "grid", gridTemplateColumns: "32px 1fr 80px 110px 32px", gap: 6, padding: "5px 3px", borderBottom: "2px solid #ede9fe", marginBottom: 6 }}>
              {["#", "Description", "Qty", "Rate (₹)", ""].map((h, i) => <div key={i} style={{ fontSize: 10, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5 }}>{h}</div>)}
            </div>
            {items.map((item, idx) => {
              const descErr = errors[`item_${item.id}_description`];
              const rateErr = errors[`item_${item.id}_rate`];
              const qtyErr = errors[`item_${item.id}_quantity`];
              const rowHasError = descErr || rateErr || qtyErr;
              return (
                <div key={item.id}>
                  <div id={`item-row-${item.id}`} className="inv-item-row" style={{ display: "grid", gridTemplateColumns: "32px 1fr 80px 110px 32px", gap: 6, alignItems: "center", marginBottom: rowHasError ? 2 : 7, padding: "7px 3px", background: rowHasError ? "#fff5f5" : (idx % 2 === 0 ? "#faf5ff" : "#fff"), borderRadius: 9, border: rowHasError ? "1px solid #fca5a5" : "1px solid #f3f0ff" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: rowHasError ? "#ef4444" : "#a78bfa", textAlign: "center" }}>{idx + 1}</div>
                    <input value={item.description} onChange={e => updItem(item.id, "description", e.target.value)} placeholder="Item description..." style={{ ...(descErr ? iStyleError : iStyle), padding: "6px 8px", fontSize: 12 }} />
                    <input type="number" min="1" value={item.quantity} onChange={e => updItem(item.id, "quantity", e.target.value)} style={{ ...(qtyErr ? iStyleError : iStyle), padding: "6px 6px", fontSize: 12, textAlign: "center" }} />
                    <input type="number" min="0" value={item.rate} onChange={e => updItem(item.id, "rate", e.target.value)} placeholder="0.00" style={{ ...(rateErr ? iStyleError : iStyle), padding: "6px 6px", fontSize: 12, textAlign: "right" }} />
                    <button onClick={() => removeItem(item.id)} disabled={items.length === 1} style={{ width: 26, height: 26, borderRadius: 7, background: items.length === 1 ? "#f5f3ff" : "#fee2e2", border: "none", cursor: items.length === 1 ? "not-allowed" : "pointer", fontSize: 11, color: items.length === 1 ? "#c4b5fd" : "#ef4444" }}>✕</button>
                  </div>
                  {rowHasError && (
                    <div className="inv-error" style={{ fontSize: 10, color: "#ef4444", fontWeight: 600, padding: "0 6px 6px", display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {descErr && <span>⚠ Description required</span>}
                      {qtyErr && <span>⚠ Qty must be more than 0</span>}
                      {rateErr && <span>⚠ Rate must be more than 0</span>}
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <div style={{ minWidth: 220, background: "linear-gradient(135deg,#4c1d95,#6d28d9)", borderRadius: 12, padding: "14px 16px" }}>
                {[["Subtotal", formatINR(subtotal)], [`GST (${inv.gstRate}%)`, formatINR(gstAmt)]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{l}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#e9d5ff" }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#e9d5ff" }}>TOTAL</span>
                  <span style={{ fontSize: 17, fontWeight: 900, color: "#fff" }}>{formatINR(total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 14, padding: 18, border: "1px solid #ede9fe", boxShadow: "0 4px 20px rgba(147,51,234,0.06)" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#1e0a3c" }}>📝 Notes & Terms</h3>
            <div className="inv-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={lStyle}>NOTES</label>
                <textarea value={inv.notes} onChange={e => upd("notes", e.target.value)} placeholder="Additional notes..." rows={3} style={{ ...iStyle, resize: "vertical", lineHeight: 1.6 }} />
              </div>
              <div>
                <label style={lStyle}>TERMS & CONDITIONS</label>
                <textarea value={inv.terms} onChange={e => upd("terms", e.target.value)} rows={3} style={{ ...iStyle, resize: "vertical", lineHeight: 1.6 }} />
              </div>
            </div>
          </div>
        </div>

        <div className="inv-summary-panel" style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 18, border: "1px solid #ede9fe", boxShadow: "0 4px 20px rgba(147,51,234,0.06)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#1e0a3c" }}>📋 Live Summary</h3>
            {[["Invoice No", inv.invoiceNo], ["Date", formatDate(inv.date)], ["Due Date", formatDate(inv.dueDate)], ["Client", inv.client || "—"], ["Project", inv.project || "—"], ["Items", `${items.length} item${items.length > 1 ? "s" : ""}`], ["GST", `${inv.gstRate}%`]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f5f3ff" }}>
                <span style={{ fontSize: 11, color: "#a78bfa", fontWeight: 600 }}>{l}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#1e0a3c", maxWidth: 130, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, background: "linear-gradient(135deg,#4c1d95,#6d28d9)", borderRadius: 10, padding: "12px 14px" }}>
              {[["Subtotal", formatINR(subtotal)], [`GST (${inv.gstRate}%)`, formatINR(gstAmt)]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{l}</span>
                  <span style={{ fontSize: 11, color: "#e9d5ff", fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 8, marginTop: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#e9d5ff" }}>Total</span>
                <span style={{ fontSize: 17, fontWeight: 900, color: "#fff" }}>{formatINR(total)}</span>
              </div>
            </div>
          </div>
          <button onClick={handleSaveDraft} style={{ width: "100%", padding: "10px", background: draftSaved ? "#22c55e" : "#fff", border: `1.5px solid ${draftSaved ? "#22c55e" : "#ede9fe"}`, borderRadius: 11, fontWeight: 700, fontSize: 13, cursor: "pointer", color: draftSaved ? "#fff" : "#7c3aed", fontFamily: "inherit", transition: "all 0.3s" }}>
            {draftSaved ? "✅ Draft Saved!" : "💾 Save as Draft"}
          </button>
          <button onClick={handlePreview} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#4c1d95,#7c3aed)", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>
            👁️ Preview & Print →
          </button>
          {companyLogo && (
            <div style={{ background: "#fff", borderRadius: 11, padding: 12, border: "1px solid #ede9fe", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, marginBottom: 7 }}>LOGO PREVIEW</div>
              <img src={companyLogo} alt="logo" style={{ maxHeight: 44, maxWidth: "100%", objectFit: "contain", borderRadius: 7 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
