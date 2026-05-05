import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import axios from "axios";
import { BASE_URL } from "../config";

function formatCurrency(val, symbol = "₹") {
  const num = parseFloat(val) || 0;
  const isINR = symbol === "₹";
  return symbol + num.toLocaleString(isINR ? "en-IN" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function QuotationViewer() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get("d");
      if (!encoded) { setError("No quotation data found in URL."); return; }
      const safeEncoded = encoded.replace(/ /g, "+");
      const decoded = decodeURIComponent(escape(atob(safeEncoded)));
      const slim = JSON.parse(decoded);
      const qt = {
        quoteNo: slim.no, date: slim.date, expiryDate: slim.exp,
        companyName: slim.co, companyEmail: slim.email,
        companyPhone: slim.phone, companyAddress: slim.addr,
        client: slim.cl, project: slim.proj,
        gstRate: slim.gst, notes: slim.notes, terms: slim.terms,
        isGstIncluded: slim.incGst, amountPaid: slim.paid || 0,
        upiId: slim.upi || "", currency: slim.cur || "₹",
        logoUrl: slim.logo || "",
        cid: slim.cid || "",
      };
      const items = (slim.items || []).map((i, idx) => ({
        id: idx + 1, description: i.d, quantity: i.q, rate: i.r,
      }));
      const subtotalRaw = items.reduce((s, i) => s + (parseFloat(i.rate)||0) * (parseFloat(i.quantity)||0), 0);
      let subtotal, gstAmt, total;
      if (qt.isGstIncluded) {
        total = subtotalRaw;
        subtotal = total / (1 + (qt.gstRate / 100));
        gstAmt = total - subtotal;
      } else {
        subtotal = subtotalRaw;
        gstAmt = subtotal * (qt.gstRate / 100);
        total = subtotal + gstAmt;
      }
      const balanceDue = total - qt.amountPaid;
      setData({ qt, items, subtotal, gstAmt, total, balanceDue });

      // Fetch branding if CID exists and no logo in payload
      if (qt.cid && !qt.logoUrl) {
        axios.get(`${BASE_URL}/api/subadmins/branding/${qt.cid}`)
          .then(res => {
            if (res.data.logoUrl) {
              setData(prev => prev ? ({ ...prev, qt: { ...prev.qt, logoUrl: res.data.logoUrl } }) : prev);
            }
          })
          .catch(() => {});
      }
    } catch (e) {
      setError("Could not read quotation data.");
    }
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: `Quotation ${data?.qt?.quoteNo}`, url: window.location.href });
    } else {
      handleCopyLink();
    }
  };

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0fdf4", fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 24 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#064e3b" }}>{error}</div>
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0fdf4", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ textAlign: "center", fontSize: 14, color: "#10b981" }}>Loading quotation...</div>
    </div>
  );

  const { qt, items, subtotal, gstAmt, total, balanceDue } = data;
  const isExpired = qt.expiryDate && new Date(qt.expiryDate) < new Date();
  const qrData = window.location.href;

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#ecfdf5", minHeight: "100vh", padding: "20px 12px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .qt-paper { max-width: 794px; margin: 0 auto; background: #fff; border-radius: 18px; box-shadow: 0 24px 80px rgba(5,150,105,0.15); overflow: hidden; display: flex; flex-direction: column; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; height: auto !important; min-height: 0 !important; overflow: visible !important; background: white !important; }
          .no-print, .no-print * { display: none !important; }
          .qt-paper { position: absolute !important; top: 0 !important; left: 0 !important; width: 210mm !important; max-width: 210mm !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; display: block !important; }
          body > div { height: auto !important; min-height: 0 !important; padding: 0 !important; margin: 0 !important; }
        }
        @media (max-width:600px) { .qt-hgrid { flex-direction:column!important; } .qt-btgrid { grid-template-columns:1fr!important; } }
      `}</style>

      <div className="no-print" style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <button className="action-btn" onClick={() => window.print()}
          style={{ padding: "10px 22px", background: "linear-gradient(135deg,#059669,#065f46)", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>
          🖨️ Print / Save PDF
        </button>
        <button className="action-btn" onClick={handleShare}
          style={{ padding: "10px 22px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}>
          🔗 Share Link
        </button>
      </div>

      <div className="qt-paper">
        {/* Header */}
        <div style={{ background: "#f8fafc", padding: "28px 32px", position: "relative", overflow: "hidden", flexShrink: 0, borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,rgba(5,150,105,0.05),transparent)", top: -80, right: -40, pointerEvents: "none" }} />
          <div className="qt-hgrid" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1, gap: 20 }}>
            <div>
              {qt.logoUrl && (
                <img src={qt.logoUrl} alt="logo" style={{ height: 85, borderRadius: 10, marginBottom: 12, objectFit: "contain" }} />
              )}
              <div style={{ fontSize: 24, fontWeight: 900, color: "#064e3b", textTransform: "uppercase", letterSpacing: 1 }}>{qt.companyName}</div>
              {qt.companyEmail && <div style={{ fontSize: 11, color: "#065f46", marginTop: 3 }}>{qt.companyEmail}</div>}
              {qt.companyPhone && <div style={{ fontSize: 11, color: "#065f46", marginTop: 2 }}>{qt.companyPhone}</div>}
              {qt.companyAddress && <div style={{ fontSize: 11, color: "#065f46", marginTop: 2 }}>{qt.companyAddress}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: "rgba(5,150,105,0.1)", letterSpacing: -2, lineHeight: 1, marginBottom: 4 }}>QUOTATION</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#059669" }}>{qt.quoteNo}</div>
              <div style={{ marginTop: 14, display: "flex", gap: 20, justifyContent: "flex-end" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: "#059669", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>DATE</div>
                  <div style={{ fontSize: 12, color: "#064e3b", fontWeight: 700 }}>{formatDate(qt.date)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: "#059669", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>VALID UNTIL</div>
                  <div style={{ fontSize: 12, color: isExpired ? "#dc2626" : "#ea580c", fontWeight: 700 }}>{formatDate(qt.expiryDate)}</div>
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
                {["#", "Description", "Qty", "Unit Rate", "Amount"].map((h, i) => (
                  <th key={i} style={{ padding: "9px 11px", fontSize: 9, fontWeight: 700, color: "#059669", letterSpacing: 1.5, borderBottom: "2px solid #d1fae5", textAlign: ["Amount", "Unit Rate", "Qty"].includes(h) ? "right" : "left" }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #f0fdf4" }}>
                  <td style={{ padding: "12px 11px", color: "#6ee7b7", fontWeight: 700, fontSize: 12 }}>{String(idx + 1).padStart(2, "0")}</td>
                  <td style={{ padding: "12px 11px", fontSize: 13, fontWeight: 600, color: "#111827" }}>{item.description || "—"}</td>
                  <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 13, color: "#374151" }}>{item.quantity}</td>
                  <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 13, color: "#374151" }}>{formatCurrency(item.rate, qt.currency)}</td>
                  <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "#111827" }}>{formatCurrency((parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0), qt.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <div style={{ width: "min(280px,100%)" }}>
              {[
                ["Subtotal", formatCurrency(subtotal, qt.currency)],
                [`GST (${qt.gstRate}%)${qt.isGstIncluded ? " (Incl.)" : ""}`, formatCurrency(gstAmt, qt.currency)],
                ["Total Amount", formatCurrency(total, qt.currency)],
                ["Amount Paid", formatCurrency(qt.amountPaid, qt.currency)]
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
            {qt.upiId && (
              <div style={{ background: "#f8fafc", borderRadius: 11, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 9, color: "#059669", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>💳 UPI PAYMENT</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{qt.upiId}</div>
              </div>
            )}
          </div>
          <div className="no-print" style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#f0fdf4", borderRadius: 12, padding: "14px 16px", border: "1px solid #d1fae5", minWidth: 110 }}>
            <div style={{ fontSize: 8, color: "#059669", fontWeight: 700, letterSpacing: 1.5, marginBottom: 8, textAlign: "center" }}>SCAN QUOTE</div>
            <div style={{ background: "#fff", padding: 6, borderRadius: 8, border: "1px solid #d1fae5" }}>
              <QRCodeSVG value={qrData} size={88} bgColor="#ffffff" fgColor="#064e3b" />
            </div>
            <div style={{ fontSize: 8, color: "#9ca3af", marginTop: 7, textAlign: "center", fontWeight: 600 }}>{qt.quoteNo}</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div style={{ background: "#f8fafc", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, borderTop: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{qt.companyName}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>{qt.footerMessage || "Thank you for your business!"}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{qt.quoteNo}</div>
        </div>
      </div>
    </div>
  );
}
