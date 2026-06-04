import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
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

export default function InvoiceViewer() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get("d");
      if (!encoded) { setError("No invoice data found in URL."); return; }
      const safeEncoded = encoded.replace(/ /g, "+");
      const decoded = decodeURIComponent(escape(atob(safeEncoded)));
      const slim = JSON.parse(decoded);
      const inv = {
        invoiceNo: slim.no, date: slim.date, dueDate: slim.due,
        companyName: slim.co, companyEmail: slim.email,
        companyPhone: slim.phone, companyAddress: slim.addr,
        client: slim.cl, project: slim.proj,
        gstRate: slim.gst, notes: slim.notes, terms: slim.terms,
        isGstIncluded: slim.incGst, amountPaid: slim.paid || 0,
        upiId: slim.upi || "", currency: slim.cur || "₹",
        paymentHistory: slim.history || [],
        logoUrl: slim.logo || "",
        cid: slim.cid || "",
        signature: slim.sig || "",
        signatureType: slim.sigType || "text",
        template: slim.temp || "Classic",
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
      const historyTotal = inv.paymentHistory?.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) || 0;
      const finalPaid = Math.max(inv.amountPaid, historyTotal);
      const balanceDue = total - finalPaid;
      setData({ inv, items, subtotal, gstAmt, total, balanceDue, finalPaid });

      // Fetch latest invoice details from backend to get full signature/branding/payments
      axios.get(`${BASE_URL}/api/invoices/no/${slim.no}`)
        .then(res => {
          if (res.data && res.data.inv) {
            const fetched = res.data.inv;
            setData(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                inv: {
                  ...prev.inv,
                  signature: fetched.signature || prev.inv.signature,
                  signatureType: fetched.signatureType || prev.inv.signatureType,
                  template: fetched.template || prev.inv.template,
                }
              };
            });
          }
        })
        .catch(() => {});

      // Fetch branding if CID exists and no logo in payload
      if (inv.cid && !inv.logoUrl) {
        axios.get(`${BASE_URL}/api/subadmins/branding/${inv.cid}`)
          .then(res => {
            if (res.data.logoUrl) {
              setData(prev => prev ? ({ ...prev, inv: { ...prev.inv, logoUrl: res.data.logoUrl } }) : prev);
            }
          })
          .catch(() => {});
      }
    } catch (e) {
      setError("Could not read invoice data.");
    }
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: `Invoice ${data?.inv?.invoiceNo}`, url: window.location.href });
    } else {
      handleCopyLink();
    }
  };

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 24 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{error}</div>
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ textAlign: "center", fontSize: 14, color: "#6366f1" }}>Loading invoice...</div>
    </div>
  );

  const { inv, items, subtotal, gstAmt, total, balanceDue, finalPaid } = data;
  const isPaid = balanceDue <= 0;
  const qrData = window.location.href;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("print") === "true") {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, []);

  const getTemplateStyles = (templateName) => {
    switch (templateName) {
      case "Minimal":
        return {
          primaryColor: "#111827",
          primaryBg: "#F3F4F6",
          logoColor: "linear-gradient(135deg, #374151, #111827)",
          borderStyle: "1px solid #E5E7EB",
          headerUnderline: "1px solid #E5E7EB",
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        };
      case "Classic":
        return {
          primaryColor: "#00BCD4",
          primaryBg: "#E0F7FA",
          logoColor: "linear-gradient(135deg, #00BCD4, #006E7F)",
          borderStyle: "1px solid #E0EEF0",
          headerUnderline: "3px solid #00BCD4",
          fontFamily: "'Nunito', sans-serif"
        };
      case "Modern":
      default:
        return {
          primaryColor: "#7C5CFC",
          primaryBg: "#EEE9FF",
          logoColor: "linear-gradient(135deg, #7C5CFC, #4C1D95)",
          borderStyle: "1px solid #E5E7EB",
          headerUnderline: "3px solid #7C5CFC",
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        };
    }
  };
  const currentT = getTemplateStyles(inv?.template || "Classic");

  // --- Pagination Logic ---
  const ITEMS_PER_PAGE_FIRST = 10;
  const ITEMS_PER_PAGE_REST = 16;
  
  const pages = [];
  if (items.length <= ITEMS_PER_PAGE_FIRST) {
    pages.push(items);
  } else {
    pages.push(items.slice(0, ITEMS_PER_PAGE_FIRST));
    let remaining = items.slice(ITEMS_PER_PAGE_FIRST);
    while (remaining.length > 0) {
      pages.push(remaining.slice(0, ITEMS_PER_PAGE_REST));
      remaining = remaining.slice(ITEMS_PER_PAGE_REST);
    }
  }

  return (
    <div className="print-wrapper" style={{ fontFamily: currentT.fontFamily || "'Plus Jakarta Sans', sans-serif", background: "#f1f5f9", minHeight: "100vh", padding: "20px 12px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Dancing+Script:wght@700&display=swap');
        * { box-sizing: border-box; }
        .inv-paper { max-width: 794px; margin: 0 auto; background: #fff; border-radius: 18px; box-shadow: 0 24px 80px rgba(99,102,241,0.15); overflow: hidden; display: flex; flex-direction: column; min-height: 1122px; }
        @media print {
          @page { size: A4 portrait; margin: 12mm 14mm; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .no-print, .no-print * { display: none !important; }
          .print-wrapper { background: white !important; padding: 0 !important; min-height: 0 !important; }
          .inv-paper { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; width: 100% !important; min-height: 270mm !important; margin: 0 auto !important; position: relative !important; page-break-after: always; }
          .inv-paper:last-child { page-break-after: auto; }
          body > div { height: auto !important; min-height: 0 !important; padding: 0 !important; margin: 0 !important; }
        }
        @media (max-width:600px) { .inv-hgrid { flex-direction:column!important; } .inv-btgrid { grid-template-columns:1fr!important; } }
      `}</style>

      <div className="no-print" style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <button className="action-btn" onClick={() => window.print()}
          style={{ padding: "10px 22px", background: currentT.logoColor || currentT.primaryColor, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>
          🖨️ Print / Save PDF
        </button>
        {inv.upiId && balanceDue > 0 && (
          <button className="action-btn" onClick={() => {
            const upiLink = `upi://pay?pa=${inv.upiId}&pn=${encodeURIComponent(inv.companyName)}&am=${balanceDue.toFixed(2)}&cu=INR&tn=${encodeURIComponent("Invoice " + inv.invoiceNo)}`;
            window.location.href = upiLink;
          }} style={{ padding: "10px 22px", background: "linear-gradient(135deg,#065f46,#059669)", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>
            💳 Pay via UPI
          </button>
        )}
        <button className="action-btn" onClick={handleShare}
          style={{ padding: "10px 22px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}>
          🔗 Share Link
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "40px", alignItems: "center" }}>
        {pages.map((pageItems, pageIndex) => {
          const isFirstPage = pageIndex === 0;
          const isLastPage = pageIndex === pages.length - 1;
          const globalItemOffset = isFirstPage ? 0 : ITEMS_PER_PAGE_FIRST + ((pageIndex - 1) * ITEMS_PER_PAGE_REST);

          return (
            <div key={pageIndex} className="inv-paper" style={{ width: "100%" }}>
              {/* Header */}
              {isFirstPage && (
                <div style={{ background: "#f8fafc", padding: "28px 32px", position: "relative", overflow: "hidden", flexShrink: 0, borderBottom: currentT.borderStyle || "1px solid #e2e8f0" }}>
                  <div style={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", background: `radial-gradient(circle, ${currentT.primaryColor}0d, transparent)`, top: -80, right: -40, pointerEvents: "none" }} />
                  <div className="inv-hgrid" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1, gap: 20 }}>
                    <div>
                      {inv.logoUrl && (
                        <img src={inv.logoUrl} alt="logo" style={{ height: 85, borderRadius: 10, marginBottom: 12, objectFit: "contain" }} />
                      )}
                      <div style={{ fontSize: 24, fontWeight: 900, color: "#1e1b4b", textTransform: "uppercase", letterSpacing: 1 }}>{inv.companyName}</div>
                      {inv.companyEmail && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>{inv.companyEmail}</div>}
                      {inv.companyPhone && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{inv.companyPhone}</div>}
                      {inv.companyAddress && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{inv.companyAddress}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 32, fontWeight: 900, color: `${currentT.primaryColor}1a`, letterSpacing: -2, lineHeight: 1, marginBottom: 4 }}>INVOICE</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: currentT.primaryColor }}>{inv.invoiceNo}</div>
                      <div style={{ marginTop: 14, display: "flex", gap: 20, justifyContent: "flex-end" }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>DATE</div>
                          <div style={{ fontSize: 12, color: "#1e1b4b", fontWeight: 700 }}>{formatDate(inv.date)}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, letterSpacing: 1.5, marginBottom: 3 }}>DUE DATE</div>
                          <div style={{ fontSize: 12, color: "#1e1b4b", fontWeight: 700 }}>{formatDate(inv.dueDate)}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 12, textAlign: "right" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 14px",
                          border: `1.5px solid ${isPaid ? "#10b981" : "#f59e0b"}`,
                          borderRadius: 20,
                          color: isPaid ? "#059669" : "#b45309",
                          fontSize: 11,
                          fontWeight: 800,
                          background: isPaid ? "#d1fae5" : "#fef3c7",
                          letterSpacing: 1
                        }}>
                          {isPaid ? "PAID" : "UNPAID"}
                        </span>
                      </div>
                      {inv.project && (
                        <div style={{ marginTop: 24, textAlign: "right" }}>
                          <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>PROJECT</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", lineHeight: 1.4 }}>{inv.project}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bill To */}
              {isFirstPage && (
                <div className="inv-btgrid" style={{ display: "grid", gridTemplateColumns: "1fr", borderBottom: currentT.borderStyle || "2px solid #f1f5f9", flexShrink: 0 }}>
                  <div style={{ padding: "20px 32px" }}>
                    <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>BILL TO</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>{inv.client || "—"}</div>
                  </div>
                </div>
              )}

              {/* Items */}
              <div style={{ padding: "22px 32px", overflowX: "auto", flexShrink: 0 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 360 }}>
                  <thead>
                    <tr>
                      {["#", "Description", "Qty", "Unit Rate", "Amount"].map((h, i) => (
                        <th key={i} style={{ background: currentT.primaryColor, padding: "9px 11px", fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: 1.5, borderBottom: "2px solid var(--app-border)", textAlign: ["Amount", "Unit Rate", "Qty"].includes(h) ? "right" : "left" }}>{h.toUpperCase()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--app-border)" }}>
                      <td style={{ padding: "12px 11px", color: "var(--app-muted)", fontWeight: 700, fontSize: 12, opacity: 0.5 }}>{String(globalItemOffset + idx + 1).padStart(2, "0")}</td>
                  <td style={{ padding: "12px 11px", fontSize: 13, fontWeight: 600, color: "#111827" }}>{item.description || "—"}</td>
                  <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 13, color: "#374151" }}>{item.quantity}</td>
                  <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 13, color: "#374151" }}>{formatCurrency(item.rate, inv.currency)}</td>
                  <td style={{ padding: "12px 11px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "#111827" }}>{formatCurrency((parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0), inv.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {isLastPage && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                  <div style={{ width: "min(280px,100%)" }}>
                    {[
                      ["Subtotal", formatCurrency(subtotal, inv.currency)],
                      [`GST (${inv.gstRate}%)${inv.isGstIncluded ? " (Incl.)" : ""}`, formatCurrency(gstAmt, inv.currency)],
                      ["Total Amount", formatCurrency(total, inv.currency)],
                      ["Amount Paid", formatCurrency(finalPaid, inv.currency)]
                    ].map(([l, v]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f8fafc" }}>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>{l}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", background: currentT.primaryBg, borderRadius: 12, marginTop: 8, border: currentT.borderStyle || "1.5px solid #e2e8f0" }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#64748b" }}>BALANCE DUE</span>
                      <span style={{ fontSize: 19, fontWeight: 900, color: isPaid ? "#059669" : currentT.primaryColor }}>{formatCurrency(balanceDue, inv.currency)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes + QR + Signature */}
            {isLastPage && (
              <div className="invoice-bottom-grid" style={{ padding: "0 32px 24px", alignItems: "flex-start", flexShrink: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {inv.notes && (
                    <div style={{ background: "#f8fafc", borderRadius: 11, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: 9, color: currentT.primaryColor, fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>📝 NOTES</div>
                      <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7 }}>{inv.notes}</div>
                    </div>
                  )}
                  {inv.terms && (
                    <div style={{ background: "#f8fafc", borderRadius: 11, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: 9, color: currentT.primaryColor, fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>📜 TERMS</div>
                      <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7 }}>{inv.terms}</div>
                    </div>
                  )}
                  {inv.upiId && (
                    <div style={{ background: "#f8fafc", borderRadius: 11, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: 9, color: currentT.primaryColor, fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>💳 UPI PAYMENT</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{inv.upiId}</div>
                    </div>
                  )}
                  {inv.paymentHistory?.length > 0 && (
                    <div style={{ background: "#f8fafc", borderRadius: 11, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: 9, color: currentT.primaryColor, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 }}>💳 PAYMENT HISTORY</div>
                      {inv.paymentHistory.map((p, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "4px 0", borderBottom: i < inv.paymentHistory.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                          <span style={{ color: "#64748b" }}>{formatDate(p.date)}{p.category === "Advance" ? " (Advance)" : ""}</span>
                          <span style={{ fontWeight: 700, color: "#0f172a" }}>{formatCurrency(p.amount, inv.currency)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="no-print" style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#f8fafc", borderRadius: 12, padding: "14px 16px", border: currentT.borderStyle || "1px solid #e2e8f0", minWidth: 140 }}>
                  <div style={{ fontSize: 9, color: currentT.primaryColor, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8, textAlign: "center" }}>SCAN INVOICE</div>
                  <div style={{ background: "#fff", padding: 12, borderRadius: 8, border: currentT.borderStyle || "1px solid #e2e8f0" }}>
                    <QRCodeSVG value={qrData} size={160} bgColor="#ffffff" fgColor={currentT.primaryColor} />
                  </div>
                  <div style={{ fontSize: 8, color: "#9ca3af", marginTop: 7, textAlign: "center", fontWeight: 600 }}>{inv.invoiceNo}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", background: "#f8fafc", borderRadius: 12, padding: "14px 16px", border: currentT.borderStyle || "1px solid #e2e8f0", minWidth: 140, minHeight: 145 }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                    {inv.signature ? (
                      inv.signatureType === "image" ? (
                        <img src={inv.signature} alt="Signature" style={{ maxHeight: 45, maxWidth: 120, objectFit: "contain" }} />
                      ) : (
                        <div style={{ fontFamily: "'Dancing Script', cursive", fontSize: 24, fontWeight: "bold", color: currentT.primaryColor, textAlign: "center" }}>{inv.signature}</div>
                      )
                    ) : (
                      <div style={{ height: 45 }} />
                    )}
                  </div>
                  <div style={{ width: "100%", height: 1, background: currentT.borderStyle || "#e2e8f0", marginBottom: 4 }}></div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#1e1b4b", textAlign: "center" }}>{inv.companyName}</div>
                  <div style={{ fontSize: 8, color: "#64748b", textAlign: "center", marginTop: 2 }}>Authorized Signatory</div>
                </div>
              </div>
            )}

            <div style={{ flex: 1 }} />

            {/* Footer */}
            <div style={{ background: "#f8fafc", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, borderTop: currentT.borderStyle || "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{inv.companyName}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: currentT.primaryColor }}>Thank you for your business!</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Page {pageIndex + 1} of {pages.length}</div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

   