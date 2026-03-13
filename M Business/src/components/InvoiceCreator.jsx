import { useState, useRef } from "react";

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
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function InvoiceCreator({ clients = [], projects = [], companyLogo, onLogoChange }) {

  const [step, setStep] = useState("form");

  const logoRef = useRef();
  

  const today = new Date().toISOString().split("T")[0];
  const dueDefault = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const [inv, setInv] = useState({
    invoiceNo: generateInvoiceNo(),
    orderNo: "",
    date: today,
    dueDate: dueDefault,
    client: "",
    project: "",
    gstRate: 18,
    notes: "",
    terms: "Payment due within 30 days. Thank you for your business!",
    companyName: "M Business Suite",
    companyEmail: "management@mbusiness.com",
    companyPhone: "",
    companyAddress: "",
  });

  const [items, setItems] = useState([
    { id: 1, description: "", quantity: 1, rate: "", photoPreview: null },
  ]);

  const photoRefs = useRef({});
  const upd = (f, v) => setInv(p => ({ ...p, [f]: v }));

  const selectedClient = clients.find(c => (c.clientName || c.name) === inv.client);
  const filteredProjects = projects.filter(p => !inv.client || p.client === inv.client);

  const addItem = () => setItems(p => [...p, { id: Date.now(), description: "", quantity: 1, rate: "", photoPreview: null }]);
  const removeItem = (id) => setItems(p => p.filter(i => i.id !== id));
  const updItem = (id, field, val) => setItems(p => p.map(i => i.id === id ? { ...i, [field]: val } : i));

  const handleItemPhoto = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => updItem(id, "photoPreview", e.target.result);
    reader.readAsDataURL(file);
  };

const handleLogo = async (file) => {
  if (!file) return;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "logoimage");
  formData.append("cloud_name", "dvbzhmysy");
  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/dvbzhmysy/image/upload`,
      { method: "POST", body: formData }
    );
    const data = await res.json();
    onLogoChange(data.secure_url);
  } catch(err) {
    alert("Upload failed!");
  }
};

  const lStyle = {
    display: "block", fontSize: 11, color: "#7c3aed",
    fontWeight: 700, letterSpacing: 0.5, marginBottom: 5
  };

  // ═══════════════════════════════════════
  // PRINT / PREVIEW
  // ═══════════════════════════════════════
  if (step === "preview") {
    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#e8e0f5", minHeight: "100vh", padding: "30px 20px" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
          * { box-sizing: border-box; }
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; margin: 0; }
            .invoice-paper { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; margin: 0 !important; }
          }
        `}</style>

        {/* Toolbar */}
        <div className="no-print" style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 28 }}>
          <button onClick={() => setStep("form")} style={{ padding: "11px 24px", background: "#fff", border: "1.5px solid #ddd6fe", borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#1e0a3c", fontFamily: "inherit" }}>
            ← Edit Invoice
          </button>
          <button onClick={() => window.print()} style={{ padding: "11px 28px", background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#fff", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(124,58,237,0.4)" }}>
            🖨️ Print / Save as PDF
          </button>
        </div>

        {/* INVOICE PAPER */}
        <div className="invoice-paper" style={{ maxWidth: 860, margin: "0 auto", background: "#fff", borderRadius: 24, boxShadow: "0 24px 80px rgba(100,60,200,0.18)", overflow: "hidden" }}>

          {/* HEADER */}
          <div style={{ background: "linear-gradient(135deg,#0f0528 0%,#2d0a6e 50%,#4c1d95 100%)", padding: "40px 48px 36px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,0.15),transparent)", top: -100, right: -60, pointerEvents: "none" }} />
            <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(196,132,252,0.1),transparent)", bottom: -80, left: 40, pointerEvents: "none" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
              <div>
                {companyLogo
                  ? <img src={companyLogo} alt="logo" style={{ height: 64, borderRadius: 12, marginBottom: 18, objectFit: "contain", background: "rgba(255,255,255,0.1)", padding: 8 }} />
                  : <div style={{ width: 56, height: 56, background: "linear-gradient(135deg,#a78bfa,#c084fc)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 18, boxShadow: "0 4px 20px rgba(167,139,250,0.4)" }}>M</div>
                }
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>{inv.companyName}</div>
                {inv.companyEmail && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>{inv.companyEmail}</div>}
                {inv.companyPhone && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{inv.companyPhone}</div>}
                {inv.companyAddress && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{inv.companyAddress}</div>}
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 46, fontWeight: 900, color: "rgba(255,255,255,0.12)", letterSpacing: -2, lineHeight: 1, marginBottom: 6 }}>INVOICE</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#c4b5fd", letterSpacing: 0.5 }}>{inv.invoiceNo}</div>
                {inv.orderNo && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4, fontWeight: 600 }}>Order # {inv.orderNo}</div>}
                <div style={{ marginTop: 20, display: "flex", gap: 28, justifyContent: "flex-end" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 4 }}>DATE</div>
                    <div style={{ fontSize: 14, color: "#fff", fontWeight: 700 }}>{formatDate(inv.date)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 4 }}>DUE DATE</div>
                    <div style={{ fontSize: 14, color: "#fbbf24", fontWeight: 700 }}>{formatDate(inv.dueDate)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BILL TO + PROJECT */}
          <div style={{ display: "grid", gridTemplateColumns: inv.project ? "1fr 1fr" : "1fr", borderBottom: "2px solid #f3f0ff" }}>
            <div style={{ padding: "28px 48px", borderRight: inv.project ? "1px solid #f3f0ff" : "none" }}>
              <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>BILL TO</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1e0a3c" }}>{inv.client || "—"}</div>
              {selectedClient?.companyName && <div style={{ fontSize: 14, color: "#7c3aed", fontWeight: 600, marginTop: 3 }}>{selectedClient.companyName}</div>}
              {selectedClient?.email && <div style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>📧 {selectedClient.email}</div>}
              {selectedClient?.phone && <div style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>📱 {selectedClient.phone}</div>}
              {selectedClient?.address && <div style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>📍 {selectedClient.address}</div>}
            </div>
            {inv.project && (
              <div style={{ padding: "28px 48px" }}>
                <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>PROJECT</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#1e0a3c" }}>{inv.project}</div>
              </div>
            )}
          </div>

          {/* ITEMS TABLE */}
          <div style={{ padding: "32px 48px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "linear-gradient(90deg,#f5f3ff,#faf5ff)" }}>
                  {["#", "Description", "Image", "Qty", "Unit Rate", "Amount"].map((h, i) => (
                    <th key={i} style={{ padding: "12px 14px", fontSize: 10, fontWeight: 700, color: "#7c3aed", letterSpacing: 1.5, borderBottom: "2px solid #ede9fe", textAlign: ["Amount", "Unit Rate", "Qty"].includes(h) ? "right" : "left" }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f5f3ff" }}>
                    <td style={{ padding: "16px 14px", color: "#a78bfa", fontWeight: 700, fontSize: 13 }}>{String(idx + 1).padStart(2, "0")}</td>
                    <td style={{ padding: "16px 14px", fontSize: 14, fontWeight: 600, color: "#1e0a3c" }}>{item.description || "—"}</td>
                    <td style={{ padding: "16px 14px" }}>
                      {item.photoPreview
                        ? <img src={item.photoPreview} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", border: "1.5px solid #ede9fe" }} />
                        : <div style={{ width: 52, height: 52, borderRadius: 10, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, border: "1.5px dashed #e9d5ff" }}>📷</div>
                      }
                    </td>
                    <td style={{ padding: "16px 14px", textAlign: "right", fontSize: 14, color: "#374151", fontWeight: 500 }}>{item.quantity}</td>
                    <td style={{ padding: "16px 14px", textAlign: "right", fontSize: 14, color: "#374151", fontWeight: 500 }}>{formatINR(item.rate)}</td>
                    <td style={{ padding: "16px 14px", textAlign: "right", fontSize: 15, fontWeight: 700, color: "#1e0a3c" }}>
                      {formatINR((parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* TOTALS BOX */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 28 }}>
              <div style={{ width: 300 }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f3f0ff" }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>Subtotal</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1e0a3c" }}>{formatINR(subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "2px solid #ede9fe" }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>GST ({inv.gstRate}%)</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1e0a3c" }}>{formatINR(gstAmt)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "linear-gradient(135deg,#4c1d95,#6d28d9)", borderRadius: 14, marginTop: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#e9d5ff" }}>TOTAL DUE</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{formatINR(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* NOTES + TERMS */}
          {(inv.notes || inv.terms) && (
            <div style={{ padding: "0 48px 32px", display: "grid", gridTemplateColumns: inv.notes && inv.terms ? "1fr 1fr" : "1fr", gap: 16 }}>
              {inv.notes && (
                <div style={{ background: "#faf5ff", borderRadius: 14, padding: "18px 20px", border: "1px solid #ede9fe" }}>
                  <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 }}>📝 NOTES</div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{inv.notes}</div>
                </div>
              )}
              {inv.terms && (
                <div style={{ background: "#faf5ff", borderRadius: 14, padding: "18px 20px", border: "1px solid #ede9fe" }}>
                  <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 }}>📜 TERMS & CONDITIONS</div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{inv.terms}</div>
                </div>
              )}
            </div>
          )}

          {/* FOOTER */}
          <div style={{ background: "linear-gradient(135deg,#0f0528,#2d0a6e)", padding: "20px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Generated by M Business Suite</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#c4b5fd" }}>🙏 Thank you for your business!</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{inv.invoiceNo}</div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // FORM VIEW
  // ═══════════════════════════════════════
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap'); *{box-sizing:border-box} ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:#d8b4fe;border-radius:3px}`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e0a3c" }}>🧾 Create Invoice</h2>
          <p style={{ margin: "3px 0 0", color: "#a78bfa", fontSize: 12 }}>Fill details → Preview → Print as PDF</p>
        </div>
        <button onClick={() => setStep("preview")} style={{ padding: "11px 26px", background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#fff", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }}>
          👁️ Preview & Print →
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, alignItems: "flex-start" }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Company Info */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 22, border: "1px solid #ede9fe", boxShadow: "0 4px 20px rgba(147,51,234,0.06)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#1e0a3c" }}>🏢 Company Info</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <div onClick={() => logoRef.current?.click()} style={{ width: 76, height: 76, borderRadius: 14, border: "2px dashed #c084fc", background: "#faf5ff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", flexShrink: 0 }}>
                {companyLogo ? <img src={companyLogo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  : <><span style={{ fontSize: 22 }}>🖼️</span><span style={{ fontSize: 10, color: "#a78bfa", marginTop: 3, fontWeight: 700 }}>LOGO</span></>}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e0a3c" }}>{companyLogo ? "✅ Logo uploaded" : "Upload company logo"}</div>
                <div style={{ fontSize: 11, color: "#a78bfa", marginTop: 2 }}>Click to upload PNG/JPG</div>
                {companyLogo && <button onClick={() => onLogoChange(null)} style={{ marginTop: 5, fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, padding: 0 }}>✕ Remove</button>}
              </div>
              <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleLogo(e.target.files[0])} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {[["COMPANY NAME", "companyName"], ["EMAIL", "companyEmail"], ["PHONE", "companyPhone"], ["ADDRESS", "companyAddress"]].map(([label, field]) => (
                <div key={field} style={{ marginBottom: 12 }}>
                  <label style={lStyle}>{label}</label>
                  <input value={inv[field]} onChange={e => upd(field, e.target.value)} style={iStyle} />
                </div>
              ))}
            </div>
          </div>

          {/* Invoice Meta */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 22, border: "1px solid #ede9fe", boxShadow: "0 4px 20px rgba(147,51,234,0.06)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#1e0a3c" }}>📋 Invoice Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px" }}>
              <div style={{ marginBottom: 12 }}>
                <label style={lStyle}>INVOICE NUMBER</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={inv.invoiceNo} onChange={e => upd("invoiceNo", e.target.value)} style={{ ...iStyle, flex: 1 }} />
                  <button onClick={() => upd("invoiceNo", generateInvoiceNo())} title="Regenerate" style={{ padding: "0 10px", background: "#f5f3ff", border: "1.5px solid #ede9fe", borderRadius: 10, cursor: "pointer", fontSize: 14 }}>🔄</button>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={lStyle}>ORDER NUMBER</label>
                <input value={inv.orderNo} onChange={e => upd("orderNo", e.target.value)} placeholder="ORD-001" style={iStyle} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={lStyle}>GST RATE</label>
                <select value={inv.gstRate} onChange={e => upd("gstRate", Number(e.target.value))} style={iStyle}>
                  {GST_RATES.map((r, i) => <option key={i} value={r}>{r === 0 ? "No GST (0%)" : `GST ${r}%`}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={lStyle}>INVOICE DATE</label>
                <input type="date" value={inv.date} onChange={e => upd("date", e.target.value)} style={iStyle} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={lStyle}>DUE DATE</label>
                <input type="date" value={inv.dueDate} onChange={e => upd("dueDate", e.target.value)} style={iStyle} />
              </div>
            </div>
          </div>

          {/* Client + Project */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 22, border: "1px solid #ede9fe", boxShadow: "0 4px 20px rgba(147,51,234,0.06)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#1e0a3c" }}>👥 Client & Project</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <div style={{ marginBottom: 12 }}>
                <label style={lStyle}>SELECT CLIENT *</label>
                <select value={inv.client} onChange={e => { upd("client", e.target.value); upd("project", ""); }} style={iStyle}>
                  <option value="">-- Select Client --</option>
                  {clients.map((c, i) => <option key={i} value={c.clientName || c.name}>{c.clientName || c.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={lStyle}>SELECT PROJECT</label>
                <select value={inv.project} onChange={e => upd("project", e.target.value)} style={{ ...iStyle, opacity: !inv.client ? 0.5 : 1 }} disabled={!inv.client}>
                  <option value="">-- Select Project --</option>
                  {filteredProjects.map((p, i) => <option key={i} value={p.name}>{p.name}</option>)}
                </select>
              </div>
            </div>
            {selectedClient && (
              <div style={{ background: "#f5f3ff", borderRadius: 10, padding: "10px 14px", border: "1px solid #ede9fe", display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[["📧", selectedClient.email], ["📱", selectedClient.phone], ["📍", selectedClient.address]].filter(([, v]) => v).map(([icon, val], i) => (
                  <span key={i} style={{ fontSize: 12, color: "#6b7280" }}>{icon} {val}</span>
                ))}
              </div>
            )}
          </div>

          {/* Items */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 22, border: "1px solid #ede9fe", boxShadow: "0 4px 20px rgba(147,51,234,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e0a3c" }}>📦 Items / Services</h3>
              <button onClick={addItem} style={{ padding: "8px 16px", background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>+ Add Item</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 66px 66px 96px 96px 32px", gap: 8, padding: "6px 0", borderBottom: "2px solid #ede9fe", marginBottom: 6 }}>
              {["#", "Description", "Photo", "Qty", "Rate (₹)", "Amount", ""].map((h, i) => (
                <div key={i} style={{ fontSize: 10, color: "#7c3aed", fontWeight: 700, letterSpacing: 0.5 }}>{h}</div>
              ))}
            </div>
            {items.map((item, idx) => (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "32px 1fr 66px 66px 96px 96px 32px", gap: 8, alignItems: "center", marginBottom: 8, padding: "8px 6px", background: idx % 2 === 0 ? "#faf5ff" : "#fff", borderRadius: 10, border: "1px solid #f3f0ff" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", textAlign: "center" }}>{idx + 1}</div>
                <input value={item.description} onChange={e => updItem(item.id, "description", e.target.value)} placeholder="Item description..." style={{ ...iStyle, padding: "7px 10px", fontSize: 12 }} />
                <div>
                  <input ref={el => photoRefs.current[item.id] = el} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleItemPhoto(item.id, e.target.files[0])} />
                  <div onClick={() => photoRefs.current[item.id]?.click()} style={{ width: 48, height: 40, borderRadius: 8, border: "2px dashed #c084fc", background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden" }}>
                    {item.photoPreview ? <img src={item.photoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 15 }}>📷</span>}
                  </div>
                </div>
                <input type="number" min="1" value={item.quantity} onChange={e => updItem(item.id, "quantity", e.target.value)} style={{ ...iStyle, padding: "7px 8px", fontSize: 12, textAlign: "center" }} />
                <input type="number" min="0" value={item.rate} onChange={e => updItem(item.id, "rate", e.target.value)} placeholder="0.00" style={{ ...iStyle, padding: "7px 8px", fontSize: 12, textAlign: "right" }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed", textAlign: "right" }}>
                  {formatINR((parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0))}
                </div>
                <button onClick={() => removeItem(item.id)} disabled={items.length === 1} style={{ width: 28, height: 28, borderRadius: 7, background: items.length === 1 ? "#f5f3ff" : "#fee2e2", border: "none", cursor: items.length === 1 ? "not-allowed" : "pointer", fontSize: 12, color: items.length === 1 ? "#c4b5fd" : "#ef4444" }}>✕</button>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <div style={{ minWidth: 240, background: "linear-gradient(135deg,#4c1d95,#6d28d9)", borderRadius: 14, padding: "16px 20px" }}>
                {[["Subtotal", formatINR(subtotal)], [`GST (${inv.gstRate}%)`, formatINR(gstAmt)]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{l}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#e9d5ff" }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#e9d5ff" }}>TOTAL</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>{formatINR(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes + Terms */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 22, border: "1px solid #ede9fe", boxShadow: "0 4px 20px rgba(147,51,234,0.06)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#1e0a3c" }}>📝 Notes & Terms</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={lStyle}>NOTES</label>
                <textarea value={inv.notes} onChange={e => upd("notes", e.target.value)} placeholder="Additional notes for client..." rows={3} style={{ ...iStyle, resize: "vertical", lineHeight: 1.6 }} />
              </div>
              <div>
                <label style={lStyle}>TERMS & CONDITIONS</label>
                <textarea value={inv.terms} onChange={e => upd("terms", e.target.value)} rows={3} style={{ ...iStyle, resize: "vertical", lineHeight: 1.6 }} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SUMMARY */}
        <div style={{ position: "sticky", top: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #ede9fe", boxShadow: "0 4px 20px rgba(147,51,234,0.06)" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#1e0a3c" }}>📋 Live Summary</h3>
            {[["Invoice No", inv.invoiceNo], ["Order No", inv.orderNo || "—"], ["Date", formatDate(inv.date)], ["Due Date", formatDate(inv.dueDate)], ["Client", inv.client || "—"], ["Project", inv.project || "—"], ["Items", `${items.length} item${items.length > 1 ? "s" : ""}`], ["GST", `${inv.gstRate}%`]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f5f3ff" }}>
                <span style={{ fontSize: 11, color: "#a78bfa", fontWeight: 600 }}>{l}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#1e0a3c", maxWidth: 140, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 14, background: "linear-gradient(135deg,#4c1d95,#6d28d9)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Subtotal</span>
                <span style={{ fontSize: 11, color: "#e9d5ff", fontWeight: 600 }}>{formatINR(subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>GST ({inv.gstRate}%)</span>
                <span style={{ fontSize: 11, color: "#e9d5ff", fontWeight: 600 }}>{formatINR(gstAmt)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#e9d5ff" }}>Total</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>{formatINR(total)}</span>
              </div>
            </div>
          </div>

          <button onClick={() => setStep("preview")} style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg,#4c1d95,#7c3aed)", border: "none", borderRadius: 14, fontWeight: 800, fontSize: 15, cursor: "pointer", color: "#fff", fontFamily: "inherit", boxShadow: "0 6px 24px rgba(124,58,237,0.4)" }}>
            👁️ Preview & Print →
          </button>

          {companyLogo && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 14, border: "1px solid #ede9fe", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, marginBottom: 8 }}>LOGO PREVIEW</div>
              <img src={companyLogo} alt="logo" style={{ maxHeight: 50, maxWidth: "100%", objectFit: "contain", borderRadius: 8 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
