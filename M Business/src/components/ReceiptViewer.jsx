import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

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

export default function ReceiptViewer() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get("d");
      if (!encoded) { setError("No receipt data found in URL."); return; }

      // Robust decoding: replace spaces back to plus signs (common issue with URLSearchParams)
      const safeEncoded = encoded.replace(/ /g, "+");
      const decoded = decodeURIComponent(escape(atob(safeEncoded)));
      const parsed = JSON.parse(decoded);
      setData(parsed);

      // Fetch branding if CID exists and no logo in payload
      const cid = parsed.invData?.cid;
      const hasLogo = parsed.invData?.logo;
      if (cid && !hasLogo) {
        axios.get(`${BASE_URL}/api/subadmins/branding/${cid}`)
          .then(res => {
            if (res.data.logoUrl) {
              setData(prev => prev ? ({ ...prev, invData: { ...prev.invData, logo: res.data.logoUrl } }) : prev);
            }
          })
          .catch(() => { });
      }
    } catch (e) {
      setError("Could not read receipt data.");
    }
  }, []);

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "sans-serif", padding: 24 }}>
      <div style={{ textAlign: "center", color: "#ef4444" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>Warning</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{error}</div>
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center", color: "#64748b", fontSize: 14 }}>Loading receipt...</div>
    </div>
  );

  const { r, pd, invData } = data;
  const receiptNo = data.receiptNo || `RCP-${Date.now().toString().slice(-6)}`;

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f8fafc", minHeight: "100vh", padding: "40px 20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .receipt-paper { box-shadow: none !important; border: 1px solid #eee !important; margin: 0 !important; width: 100% !important; }
        }
      `}</style>

      <div className="no-print" style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 30 }}>
        <button onClick={() => window.print()} style={{ padding: "12px 28px", background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#fff", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>Print Receipt</button>
      </div>

      <div className="receipt-paper" style={{ maxWidth: 500, margin: "0 auto", background: "#fff", borderRadius: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.05)", overflow: "hidden", border: "1px solid #e2e8f0" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", padding: "40px 32px", textAlign: "center", color: "#fff" }}>
          {invData.logo && (
            <img src={invData.logo} alt="logo" style={{ height: 60, width: "auto", maxWidth: "220px", objectFit: "contain", marginBottom: "20px", margin: "0 auto", display: "block" }} />
          )}
          <div style={{ width: 64, height: 64, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 32 }}>Payment</div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: 1 }}>{r.status === "part_paid" ? "PART PAYMENT RECEIPT" : "PAYMENT RECEIPT"}</h2>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4, fontWeight: 600 }}>{receiptNo}</div>
        </div>

        <div style={{ padding: "32px" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#0f172a" }}>{formatCurrency(pd.amountPaid, invData.currency)}</div>
            <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 700, marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>Amount Received</div>
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px dashed #e2e8f0" }}>
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Received From</span>
              <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 700 }}>{r.client}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px dashed #e2e8f0" }}>
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Payment Date</span>
              <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 700 }}>{formatDate(pd.paymentDate)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px dashed #e2e8f0" }}>
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Payment Mode</span>
              <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 700 }}>{pd.paymentMode}</span>
            </div>
            {pd.transactionId && (
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px dashed #e2e8f0" }}>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Transaction ID</span>
                <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 700, fontFamily: "monospace" }}>{pd.transactionId}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px dashed #e2e8f0" }}>
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Invoice Number</span>
              <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 700 }}>{r.invoiceNo}</span>
            </div>
            {r.status === "part_paid" && (
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px dashed #e2e8f0" }}>
                <span style={{ fontSize: 13, color: "#ea580c", fontWeight: 700 }}>Remaining Balance</span>
                <span style={{ fontSize: 13, color: "#ea580c", fontWeight: 800 }}>{formatCurrency((r.total || 0) - (pd.amountPaid || 0), invData.currency)}</span>
              </div>
            )}
          </div>

          <div style={{ marginTop: 40, textAlign: "center", background: "#f8fafc", borderRadius: 16, padding: "20px" }}>
            <div style={{ fontSize: 14, color: "#6366f1", fontWeight: 800 }}>THANK YOU!</div>
            <div style={{ fontSize: 12, color: "#6366f1", marginTop: 4 }}>We appreciate your business.</div>
          </div>

          <div style={{ marginTop: 32, textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{invData.companyName || "M Business"}</div>
            {invData.companyEmail && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{invData.companyEmail}</div>}
            {invData.companyPhone && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{invData.companyPhone}</div>}
          </div>
        </div>

        <div style={{ background: "#f8fafc", padding: "16px", textAlign: "center", borderTop: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 1 }}>COMPUTER GENERATED RECEIPT</div>
        </div>
      </div>
    </div>
  );
}
