import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import QRScanner from "./QRScanner.jsx";

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
  const [showScanner, setShowScanner] = useState(false);

  const handleScanSuccess = (decodedText) => {
    setShowScanner(false);
    if (decodedText.startsWith('http')) {
      window.location.href = decodedText;
    } else {
      alert('Scanned data: ' + decodedText);
    }
  };

  const handleScanError = (error) => {
    console.error('Scan error:', error);
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get("d");
      if (!encoded) { setError("No quotation data found in URL."); return; }
      const decoded = decodeURIComponent(escape(atob(encoded)));
      const slim = JSON.parse(decoded);
     
      const qt = {
        quoteNo: slim.no, date: slim.date, expiryDate: slim.exp,
        companyName: slim.co, companyEmail: slim.email,
        companyPhone: slim.phone, companyAddress: slim.addr,
        client: slim.cl, project: slim.proj,
        gstRate: slim.gst, notes: slim.notes, terms: slim.terms,
        isGstIncluded: slim.incGst, amountPaid: slim.paid || 0,
        upiId: slim.upi || "",
        currency: slim.cur || "₹",
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
    } catch (e) {
      setError("Could not read quotation data. The QR code may be invalid or expired.");
    }
  }, []);

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0fdf4", fontFamily: "sans-serif", padding: 24 }}>
      <div style={{ textAlign: "center", color: "#10b981" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#064e3b" }}>{error}</div>
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0fdf4", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center", color: "#10b981", fontSize: 14 }}>Loading quotation...</div>
    </div>
  );

  const { qt, items, subtotal, gstAmt, total, balanceDue } = data;
  const upiLink = qt.upiId ? `upi://pay?pa=${qt.upiId}&pn=${encodeURIComponent(qt.companyName)}&am=${balanceDue.toFixed(2)}&cu=INR&tn=${encodeURIComponent("Quotation " + qt.quoteNo)}` : "";

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#ecfdf5", minHeight: "100vh", padding: "0 0 40px" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #ecfdf5; }
        .qt-card { background: #fff; border-radius: 16px; margin: 0 12px 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(5,150,105,0.10); }
        .label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: #10b981; text-transform: uppercase; margin-bottom: 4px; }
        .value { font-size: 14px; font-weight: 700; color: #064e3b; }
        .value-sm { font-size: 12px; color: #4b5563; }
        table { width: 100%; border-collapse: collapse; }
        th { font-size: 9px; color: #059669; font-weight: 700; letter-spacing: 1px; padding: 8px 10px; border-bottom: 2px solid #d1fae5; text-align: left; background: #f0fdf4; }
        th.r, td.r { text-align: right; }
        td { font-size: 12px; padding: 10px 10px; border-bottom: 1px solid #f0fdf4; color: #064e3b; }
        td.desc { font-weight: 600; }
        td.amt { font-weight: 700; }
        .pill { display: inline-block; background: #f0fdf4; border-radius: 20px; padding: 2px 10px; font-size: 11px; color: #059669; font-weight: 600; }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .qt-card { box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>

      <div style={{ background: "linear-gradient(135deg,#064e3b 0%,#065f46 60%,#059669 100%)", padding: "28px 20px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(52,211,153,0.18),transparent)", top: -60, right: -40 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>QUOTATION</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#6ee7b7", marginBottom: 2 }}>{qt.quoteNo}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{qt.companyName}</div>
          <button onClick={() => setShowScanner(true)} style={{ marginTop: 10, padding: '8px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Scan QR Code</button>
          {qt.companyEmail && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>{qt.companyEmail}</div>}
          {qt.companyPhone && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{qt.companyPhone}</div>}

          <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>DATE</div>
              <div style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>{formatDate(qt.date)}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>VALID UNTIL</div>
              <div style={{ fontSize: 13, color: "#fbbf24", fontWeight: 800 }}>{formatDate(qt.expiryDate)}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: "linear-gradient(135deg,#059669,#10b981)", margin: "0 12px", borderRadius: "0 0 16px 16px", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#d1fae5" }}>{balanceDue > 0 ? "BALANCE DUE" : "TOTAL AMOUNT"}</span>
        <span style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>{formatCurrency(balanceDue > 0 ? balanceDue : total, qt.currency)}</span>
      </div>

      {qt.upiId && balanceDue > 0 && (
        <div className="qt-card" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", background: "#f0fdf4", border: "2px solid #d1fae5" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#065f46", marginBottom: 12, letterSpacing: 1 }}>SCAN TO PAY (UPI)</div>
          <div style={{ background: "#fff", padding: 12, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <QRCodeSVG value={upiLink} size={160} />
          </div>
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#064e3b" }}>{qt.upiId}</div>
            <a href={upiLink} style={{ display: "inline-block", marginTop: 10, padding: "8px 20px", background: "#059669", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>Pay Now →</a>
          </div>
        </div>
      )}

      <div className="qt-card" style={{ padding: "16px 18px" }}>
        <div className="label">Prepared For</div>
        <div className="value" style={{ fontSize: 16 }}>{qt.client || "—"}</div>
        {qt.project && (
          <div style={{ marginTop: 8 }}>
            <div className="label">Project</div>
            <div className="pill">{qt.project}</div>
          </div>
        )}
      </div>

      <div className="qt-card" style={{ padding: "16px 0" }}>
        <div style={{ padding: "0 18px 10px", fontSize: 11, fontWeight: 700, color: "#064e3b" }}>📦 Items / Services</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th className="r">Qty</th>
              <th className="r">Rate</th>
              <th className="r">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td style={{ color: "#10b981", fontWeight: 700, fontSize: 11 }}>{String(idx + 1).padStart(2, "0")}</td>
                <td className="desc">{item.description || "—"}</td>
                <td className="r">{item.quantity}</td>
                <td className="r">{formatCurrency(item.rate, qt.currency)}</td>
                <td className="r amt">{formatCurrency((parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0), qt.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ padding: "14px 18px 2px", borderTop: "2px solid #f0fdf4", marginTop: 4 }}>
          {[
            ["Subtotal", formatCurrency(subtotal, qt.currency)],
            [`GST (${qt.gstRate}%)`, formatCurrency(gstAmt, qt.currency)],
            ["Total", formatCurrency(total, qt.currency)],
            ["Amount Paid", formatCurrency(qt.amountPaid, qt.currency)]
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f0fdf4" }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>{l}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#064e3b" }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, background: "linear-gradient(135deg,#065f46,#059669)", borderRadius: 12, padding: "12px 14px" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#d1fae5" }}>BALANCE DUE</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{formatCurrency(balanceDue, qt.currency)}</span>
          </div>
        </div>
      </div>

      {(qt.notes || qt.terms) && (
        <div className="qt-card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          {qt.notes && (
            <div>
              <div className="label">📝 Notes</div>
              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, marginTop: 4 }}>{qt.notes}</div>
            </div>
          )}
          {qt.terms && (
            <div>
              <div className="label">📜 Terms & Conditions</div>
              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, marginTop: 4 }}>{qt.terms}</div>
            </div>
          )}
        </div>
      )}

      <div style={{ textAlign: "center", padding: "10px 20px", fontSize: 11, color: "#9ca3af" }}>
        Quotation Generated by {qt.companyName} · {qt.quoteNo}
      </div>

      {showScanner && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 12, maxWidth: 400, width: '90%' }}>
            <h3 style={{ marginBottom: 10 }}>Scan QR Code</h3>
            <QRScanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} />
            <button onClick={() => setShowScanner(false)} style={{ marginTop: 10, padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
