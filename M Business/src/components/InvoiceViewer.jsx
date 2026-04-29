import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import QRScanner from "./QRScanner.jsx";

function formatINR(val) {
  const num = parseFloat(val) || 0;
  return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function InvoiceViewer() {
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
      if (!encoded) { setError("No invoice data found in URL."); return; }
      const decoded = decodeURIComponent(escape(atob(encoded)));
      const slim = JSON.parse(decoded);
     
      const inv = {
        invoiceNo: slim.no, date: slim.date, dueDate: slim.due,
        companyName: slim.co, companyEmail: slim.email,
        companyPhone: slim.phone, companyAddress: slim.addr,
        client: slim.cl, project: slim.proj,
        gstRate: slim.gst, notes: slim.notes, terms: slim.terms,
        isGstIncluded: slim.incGst, amountPaid: slim.paid || 0,
        upiId: slim.upi || "",
      };
      const items = (slim.items || []).map((i, idx) => ({
        id: idx + 1, description: i.d, quantity: i.q, rate: i.r,
      }));
      const subtotalRaw = items.reduce((s, i) => s + (parseFloat(i.rate)||0) * (parseFloat(i.quantity)||0), 0);
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
      
      const balanceDue = total - inv.amountPaid;
      setData({ inv, items, subtotal, gstAmt, total, balanceDue });
    } catch (e) {
      setError("Could not read invoice data. The QR code may be invalid or expired.");
    }
  }, []);

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f3ff", fontFamily: "sans-serif", padding: 24 }}>
      <div style={{ textAlign: "center", color: "#7c3aed" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1e0a3c" }}>{error}</div>
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f3ff", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center", color: "#7c3aed", fontSize: 14 }}>Loading invoice...</div>
    </div>
  );

  const { inv, items, subtotal, gstAmt, total, balanceDue } = data;
  const upiLink = inv.upiId ? `upi://pay?pa=${inv.upiId}&pn=${encodeURIComponent(inv.companyName)}&am=${balanceDue.toFixed(2)}&cu=INR&tn=${encodeURIComponent("Invoice " + inv.invoiceNo)}` : "";

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#ede9fe", minHeight: "100vh", padding: "0 0 40px" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #ede9fe; }
        .inv-card { background: #fff; border-radius: 16px; margin: 0 12px 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(109,40,217,0.10); }
        .label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: #a78bfa; text-transform: uppercase; margin-bottom: 4px; }
        .value { font-size: 14px; font-weight: 700; color: #1e0a3c; }
        .value-sm { font-size: 12px; color: #4b5563; }
        table { width: 100%; border-collapse: collapse; }
        th { font-size: 9px; color: #7c3aed; font-weight: 700; letter-spacing: 1px; padding: 8px 10px; border-bottom: 2px solid #ede9fe; text-align: left; background: #faf5ff; }
        th.r, td.r { text-align: right; }
        td { font-size: 12px; padding: 10px 10px; border-bottom: 1px solid #f5f3ff; color: #1e0a3c; }
        td.desc { font-weight: 600; }
        td.amt { font-weight: 700; }
        .pill { display: inline-block; background: #f5f3ff; border-radius: 20px; padding: 2px 10px; font-size: 11px; color: #7c3aed; font-weight: 600; }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .inv-card { box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>

      <div style={{ background: "linear-gradient(135deg,#0f0528 0%,#2d0a6e 60%,#4c1d95 100%)", padding: "28px 20px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,0.18),transparent)", top: -60, right: -40 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>INVOICE</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#c4b5fd", marginBottom: 2 }}>{inv.invoiceNo}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{inv.companyName}</div>
          <button onClick={() => setShowScanner(true)} style={{ marginTop: 10, padding: '8px 16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Scan QR Code</button>
          {inv.companyEmail && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>{inv.companyEmail}</div>}
          {inv.companyPhone && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{inv.companyPhone}</div>}

          <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>DATE</div>
              <div style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>{formatDate(inv.date)}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>DUE DATE</div>
              <div style={{ fontSize: 13, color: "#fbbf24", fontWeight: 800 }}>{formatDate(inv.dueDate)}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: "linear-gradient(135deg,#4c1d95,#6d28d9)", margin: "0 12px", borderRadius: "0 0 16px 16px", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#e9d5ff" }}>{balanceDue > 0 ? "BALANCE DUE" : "TOTAL AMOUNT"}</span>
        <span style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>{formatINR(balanceDue > 0 ? balanceDue : total)}</span>
      </div>

      {inv.upiId && balanceDue > 0 && (
        <div className="inv-card" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", background: "#f5f3ff", border: "2px solid #ddd6fe" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#5b21b6", marginBottom: 12, letterSpacing: 1 }}>SCAN TO PAY (UPI)</div>
          <div style={{ background: "#fff", padding: 12, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <QRCodeSVG value={upiLink} size={160} />
          </div>
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e0a3c" }}>{inv.upiId}</div>
            <a href={upiLink} style={{ display: "inline-block", marginTop: 10, padding: "8px 20px", background: "#7c3aed", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>Pay Now →</a>
          </div>
        </div>
      )}

      <div className="inv-card" style={{ padding: "16px 18px" }}>
        <div className="label">Bill To</div>
        <div className="value" style={{ fontSize: 16 }}>{inv.client || "—"}</div>
        {inv.project && (
          <div style={{ marginTop: 8 }}>
            <div className="label">Project</div>
            <div className="pill">{inv.project}</div>
          </div>
        )}
        {inv.orderNo && (
          <div style={{ marginTop: 8 }}>
            <div className="label">Order No</div>
            <div className="value-sm">{inv.orderNo}</div>
          </div>
        )}
      </div>

      <div className="inv-card" style={{ padding: "16px 0" }}>
        <div style={{ padding: "0 18px 10px", fontSize: 11, fontWeight: 700, color: "#1e0a3c" }}>📦 Items / Services</div>
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
                <td style={{ color: "#a78bfa", fontWeight: 700, fontSize: 11 }}>{String(idx + 1).padStart(2, "0")}</td>
                <td className="desc">{item.description || "—"}</td>
                <td className="r">{item.quantity}</td>
                <td className="r">{formatINR(item.rate)}</td>
                <td className="r amt">{formatINR((parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ padding: "14px 18px 2px", borderTop: "2px solid #f3f0ff", marginTop: 4 }}>
          {[
            ["Subtotal", formatINR(subtotal)],
            [`GST (${inv.gstRate}%)`, formatINR(gstAmt)],
            ["Total", formatINR(total)],
            ["Amount Paid", formatINR(inv.amountPaid)]
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f5f3ff" }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>{l}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1e0a3c" }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, background: "linear-gradient(135deg,#4c1d95,#6d28d9)", borderRadius: 12, padding: "12px 14px" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#e9d5ff" }}>BALANCE DUE</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{formatINR(data.balanceDue)}</span>
          </div>
        </div>
      </div>

      {(inv.notes || inv.terms) && (
        <div className="inv-card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          {inv.notes && (
            <div>
              <div className="label">📝 Notes</div>
              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, marginTop: 4 }}>{inv.notes}</div>
            </div>
          )}
          {inv.terms && (
            <div>
              <div className="label">📜 Terms & Conditions</div>
              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, marginTop: 4 }}>{inv.terms}</div>
            </div>
          )}
        </div>
      )}

      <div style={{ textAlign: "center", padding: "10px 20px", fontSize: 11, color: "#9ca3af" }}>
        Invoice Generated by {inv.companyName} · {inv.invoiceNo}
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
