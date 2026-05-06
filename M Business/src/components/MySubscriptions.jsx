import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

// ─── Theme ──────────────────────────────────────────────────────────────────
const T = {
  primary: "var(--app-sidebar)", sidebar: "var(--app-sidebar)", accent: "var(--app-accent)",
  bg: "var(--app-bg)", card: "#FFFFFF", text: "var(--app-sidebar)", muted: "var(--app-accent)",
  border: "var(--app-border)", success: "#22C55E", warning: "#F59E0B", danger: "#EF4444"
};

// ─── Load Razorpay Script ────────────────────────────────────────────────────
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

// ─── Mini Components ─────────────────────────────────────────────────────────
const Badge = ({ label, color }) => {
  const c = color || T.muted;
  return (
    <span style={{ background: `${c}18`, color: c, border: `1px solid ${c}33`, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
      {label}
    </span>
  );
};

const Card = ({ title, children, icon }) => (
  <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 4px 24px rgba(var(--app-accent-rgb, 124, 58, 237),0.08)", border: "1px solid var(--app-border)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>{title}</h3>
    </div>
    {children}
  </div>
);

const InfoRow = ({ label, value, icon }) => {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--app-bg)", borderRadius: 9, border: "1px solid var(--app-border)", marginBottom: 7 }}>
      {icon && <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(var(--app-accent-rgb, 124, 58, 237),0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{icon}</div>}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginTop: 1 }}>{value}</div>
      </div>
    </div>
  );
};

// ─── Plan Data ───────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "Trial", price: 0, icon: "✨", color: "#10b981", duration: "30 days", isTrial: true,
    features: ["30 Days Free Trial", "5 Projects", "5 Invoices", "Basic Reports", "Email Support"],
    btnLabel: "Start Free Trial"
  },
  {
    name: "Starter", price: 999, icon: "🌱", color: "#6366f1",
    features: ["5 Projects", "10 Invoices", "Basic Reports", "Email Support", ""],

  },
  {
    name: "Professional", price: 2999, icon: "🚀", color: "var(--app-accent)", popular: true,
    features: ["Unlimited Projects", "Unlimited Invoices", "Advanced Reports", "Priority Support", "Team Management"],

  },
  {
    name: "Enterprise", price: null, icon: "🏢", color: "var(--app-sidebar)",
    features: ["Custom Branding", "API Access", "Dedicated Manager", "White-label Solution"],
    btnLabel: "Contact Sales"
  }
];

const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const formatCurrency = (a, cur = "INR") => (a === undefined || a === null) ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: cur }).format(a);
const getDaysLeft = (endDate) => {
  if (!endDate) return null;
  const diff = Math.ceil((new Date(endDate) - new Date()) / 86400000);
  return diff > 0 ? diff : 0;
};
const getStatusColor = (s) => ({ active: T.success, completed: T.success, paid: T.success, cancelled: T.danger, expired: T.danger, failed: T.danger, pending: T.warning, refunded: T.warning }[s?.toLowerCase()] || T.muted);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MySubscriptions({ user, onSubscriptionSuccess }) {
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(null); // plan name being processed
  const [activeTab, setActiveTab] = useState("overview");
  const [viewPayment, setViewPayment] = useState(null);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [toast, setToast] = useState("");
  const [mockGatewayOpen, setMockGatewayOpen] = useState(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);

  const userId = user?._id || user?.id;
  const userEmail = user?.email;
  const userName = user?.name || user?.clientName || "User";

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      // Fetch subscription first (this triggers retroactive trial invoice creation if needed)
      const subRes = await axios.get(`${BASE_URL}/api/subscriptions/current/${userId}`);
      if (subRes.data.hasSubscription) setSubscription(subRes.data.subscription);
      else setSubscription(null);

      // Now fetch payments
      let payRes = await axios.get(`${BASE_URL}/api/subscriptions/payments/${userId}`);
      let all = payRes.data || [];

      // AUTOMATIC FIX: If no payments found but subscription exists, try to generate one
      if (all.length === 0 && subRes.data.hasSubscription) {
        try {
          await axios.post(`${BASE_URL}/api/subscriptions/fix-invoices/${userId}`);
          payRes = await axios.get(`${BASE_URL}/api/subscriptions/payments/${userId}`);
          all = payRes.data || [];
        } catch (fixErr) { console.error("Auto-fix failed:", fixErr); }
      }

      setPayments(all);
      setInvoices(all.filter(p => p.invoiceNo));
      setQuotations(all.filter(p => p.quotationNo));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handlePrint = (type = "invoice") => {
    if (!viewInvoice) return;

    const printWindow = window.open('', '_blank');
    const content = `
      <html>
        <head>
          <title>${type === 'invoice' ? 'Invoice' : 'Receipt'} - ${viewInvoice.invoiceNo}</title>
          <style>
            body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .section-title { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
            .value { font-size: 14px; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .totals { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
            .total-row { display: flex; width: 250px; justify-content: space-between; }
            .grand-total { font-size: 20px; font-weight: 800; color: var(--app-accent, #6366f1); margin-top: 10px; padding-top: 10px; border-top: 2px solid #e2e8f0; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">${type === 'invoice' ? 'Invoice' : 'Receipt'}</div>
              <div style="font-size: 14px; color: #64748b; margin-top: 4px;"># ${viewInvoice.invoiceNo}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 800; font-size: 18px;">M Business</div>
              <div style="font-size: 12px; color: #64748b;">Billing Support</div>
            </div>
          </div>

          <div class="info-grid">
            <div>
              <div class="section-title">Billed To</div>
              <div class="value">${user?.companyName || user?.name || "Customer"}</div>
              <div style="font-size: 12px; color: #64748b;">${user?.email || ""}</div>
            </div>
            <div style="text-align: right;">
              <div class="section-title">Payment Details</div>
              <div class="value">Date: ${formatDate(viewInvoice.paymentDate)}</div>
              <div class="value">Method: ${viewInvoice.paymentMethod?.toUpperCase() || "CREDIT CARD"}</div>
              <div class="value">Status: PAID</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style="font-weight: 700;">${viewInvoice.planName || "Subscription Plan"}</div>
                  <div style="font-size: 12px; color: #64748b;">${viewInvoice.planDuration || "Monthly"} subscription</div>
                </td>
                <td style="text-align: right; font-weight: 700;">${formatCurrency(viewInvoice.amount, viewInvoice.currency)}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span style="color: #64748b;">Subtotal</span>
              <span style="font-weight: 700;">${formatCurrency(viewInvoice.amount, viewInvoice.currency)}</span>
            </div>
            <div class="total-row">
              <span style="color: #64748b;">Tax (GST 0%)</span>
              <span style="font-weight: 700;">${formatCurrency(0, viewInvoice.currency)}</span>
            </div>
            <div class="total-row grand-total">
              <span>Total Paid</span>
              <span>${formatCurrency(viewInvoice.amount, viewInvoice.currency)}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for choosing M Business. For support, contact billing@m-business.com</p>
            <p style="font-size: 10px;">Computer generated ${type}. No signature required.</p>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  // ── Success Redirect Timer ──
  useEffect(() => {
    if (paymentSuccessData) {
      const timer = setTimeout(() => {
        if (onSubscriptionSuccess) onSubscriptionSuccess();
        else window.location.href = "/";
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [paymentSuccessData, onSubscriptionSuccess]);

  // ── Start Free Trial ────────────────────────────────────────────────────────
  const startTrial = async () => {
    try {
      setPayLoading("Trial");
      const res = await axios.post(`${BASE_URL}/api/subscriptions/start-trial`, { userId, userEmail, userName });
      if (res.data.success) {
        showToast("🎉 30-day free trial started!");
        await fetchData();
        if (onSubscriptionSuccess) onSubscriptionSuccess();
        else window.location.href = "/";
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to start trial";
      showToast("❌ " + msg);
    } finally {
      setPayLoading(null);
    }
  };

  // ── Razorpay Payment for Paid Plans ─────────────────────────────────────────
  const startRazorpayPayment = async (plan) => {
    if (plan.isTrial) { startTrial(); return; }
    if (!plan.price) { window.open(`mailto:billing@${(user?.companyName || "business").toLowerCase().replace(/\s+/g, "")}.com`); return; }

    try {
      setPayLoading(plan.name);
      const loaded = await loadRazorpayScript();
      if (!loaded) { showToast("❌ Razorpay failed to load. Check connection."); return; }

      // Create order on backend
      const orderRes = await axios.post(`${BASE_URL}/api/payments/create-order`, {
        amount: plan.price,
        currency: "INR",
        userId, userEmail,
        type: "subscription",
        planName: plan.name,
        planDuration: "monthly",
        description: `${plan.name} Plan - Monthly Subscription`
      });

      if (!orderRes.data.success) throw new Error("Order creation failed");
      const order = orderRes.data.order;

      if (orderRes.data.isMock) {
        setMockGatewayOpen({ plan, orderId: order.id });
        setPayLoading(null);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SiQ9gcKvWsbGiX",
        amount: order.amount,
        currency: order.currency,
        name: "M Business",
        description: `${plan.name} Plan Subscription`,
        image: "/logo.png",
        order_id: order.id,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyRes = await axios.post(`${BASE_URL}/api/payments/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId: order.id,
              paymentMethod: "card"
            });

            if (verifyRes.data.success) {
              // Create subscription
              const endDate = new Date();
              endDate.setDate(endDate.getDate() + 30);
              await axios.post(`${BASE_URL}/api/subscriptions/create`, {
                userId, companyId: userId,
                userEmail, userName,
                planName: plan.name,
                planPrice: plan.price,
                billingCycle: "monthly",
                status: "active",
                isFullyPaid: true,
                startDate: new Date(),
                endDate,
                nextBillingDate: endDate,
                usageLimit: 999,
                features: plan.features,
                paymentMethod: "card",
                invoiceRefs: [verifyRes.data.payment?.invoiceNo].filter(Boolean),
                quotationRefs: [verifyRes.data.payment?.quotationNo].filter(Boolean)
              });

              await fetchData();
              setPaymentSuccessData(plan);
            }
          } catch (err) {
            showToast("❌ Payment verification failed. Contact support.");
          }
        },
        prefill: { name: userName, email: userEmail, contact: "" },
        notes: { userId, planName: plan.name },
        theme: { color: "var(--app-accent)" },
        modal: { ondismiss: () => setPayLoading(null) }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => { showToast("❌ Payment failed. Try again."); setPayLoading(null); });
      rzp.open();
    } catch (err) {
      showToast("❌ " + (err.response?.data?.error || err.message));
    } finally {
      setPayLoading(null);
    }
  };

  // ── Success UI ───────────────────────────────────────────────────────────────
  if (paymentSuccessData) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, textAlign: "center", animation: "fadeIn 0.5s ease" }}>
        <style>{`@keyframes scaleIn { 0% { transform: scale(0); } 60% { transform: scale(1.2); } 100% { transform: scale(1); } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        <div style={{ width: 90, height: 90, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 40, marginBottom: 24, boxShadow: "0 10px 30px rgba(16,185,129,0.3)", animation: "scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>
          ✓
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", margin: "0 0 12px" }}>Payment Successful! 🎉</h2>
        <p style={{ fontSize: 16, color: "#64748b", margin: 0, maxWidth: 400, lineHeight: 1.5 }}>
          Your <strong>{paymentSuccessData.name}</strong> plan is now active. Your dashboard is ready!
        </p>
        <div style={{ marginTop: 32, display: "flex", alignItems: "center", gap: 10, color: "#94a3b8", fontSize: 13, fontWeight: 700, background: "#f8fafc", padding: "10px 20px", borderRadius: 20 }}>
          <div style={{ width: 14, height: 14, border: "2px solid #cbd5e1", borderTopColor: "var(--app-accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          Waiting {onSubscriptionSuccess ? "for Dashboard..." : "for Home..."}
        </div>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 80, flexDirection: "column", gap: 16 }}>
        <div style={{ width: 48, height: 48, border: "4px solid var(--app-border)", borderTop: "4px solid var(--app-accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ color: T.muted, fontSize: 14, fontWeight: 600 }}>Loading subscription data...</div>
      </div>
    );
  }

  // ── No Subscription → Show Plans ─────────────────────────────────────────────
  if (!subscription) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 28, padding: "4px 0" }}>
        {toast && <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "var(--app-sidebar)", color: "#fff", borderRadius: 12, padding: "14px 22px", fontSize: 14, fontWeight: 700, boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>{toast}</div>}

        {/* Full dark wrapper */}
        <div style={{
          background: "linear-gradient(135deg, #0a0a0f 0%, #0d1117 50%, #0a0f0a 100%)",
          borderRadius: 24,
          padding: "60px 40px 64px",
          position: "relative",
          overflow: "hidden",
          minHeight: 500
        }}>
          {/* Background glow */}
          <div style={{
            position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
            width: 800, height: 320,
            background: "radial-gradient(ellipse, rgba(0,255,180,0.05) 0%, transparent 70%)",
            pointerEvents: "none"
          }} />

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 56, position: "relative", zIndex: 1 }}>
            <h2 style={{
              fontSize: 42, fontWeight: 800, color: "#ffffff",
              margin: "0 0 14px", letterSpacing: "-1.5px", lineHeight: 1.1
            }}>
              Choose your Plan
            </h2>
            <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 15, margin: 0 }}>
              Discover the perfect plan tailored just for you.
            </p>
          </div>

          {/* Plans Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(PLANS.length, 4)}, 1fr)`,
            gap: 18,
            maxWidth: 1100,
            margin: "0 auto",
            position: "relative",
            zIndex: 1
          }}>
            {PLANS.map((plan) => {
              const isProcessing = payLoading === plan.name;
              const isPro = plan.popular;
              const isTrial = plan.isTrial;

              return (
                <div
                  key={plan.name}
                  style={{
                    background: isPro
                      ? "linear-gradient(160deg, #0d2a22 0%, #0a1f1a 60%, #081a15 100%)"
                      : "linear-gradient(160deg, #141418 0%, #111115 100%)",
                    border: isPro
                      ? "1.5px solid rgba(0,220,150,0.3)"
                      : "1.5px solid rgba(255,255,255,0.07)",
                    borderRadius: 20,
                    padding: "32px 24px",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: isPro
                      ? "0 0 60px rgba(0,200,130,0.1), 0 20px 40px rgba(0,0,0,0.5)"
                      : "0 20px 40px rgba(0,0,0,0.35)",
                    transition: "transform 0.22s, box-shadow 0.22s",
                    display: "flex", flexDirection: "column"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.boxShadow = isPro
                      ? "0 0 80px rgba(0,200,130,0.18), 0 30px 60px rgba(0,0,0,0.6)"
                      : "0 28px 56px rgba(0,0,0,0.5)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = isPro
                      ? "0 0 60px rgba(0,200,130,0.1), 0 20px 40px rgba(0,0,0,0.5)"
                      : "0 20px 40px rgba(0,0,0,0.35)";
                  }}
                >
                  {/* Pro glow orb */}
                  {isPro && (
                    <div style={{
                      position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
                      width: 240, height: 240,
                      background: "radial-gradient(ellipse, rgba(0,220,150,0.13) 0%, transparent 70%)",
                      pointerEvents: "none"
                    }} />
                  )}

                  {/* MOST POPULAR badge */}
                  {isPro && (
                    <div style={{
                      position: "absolute", top: 16, right: 16,
                      background: "rgba(0,220,150,0.12)",
                      border: "1px solid rgba(0,220,150,0.35)",
                      borderRadius: 100, padding: "3px 10px",
                      fontSize: 9, fontWeight: 800,
                      color: "#00dc96", letterSpacing: 1.2,
                      textTransform: "uppercase"
                    }}>MOST POPULAR</div>
                  )}

                  {/* Icon */}
                  <div style={{ fontSize: 34, marginBottom: 18 }}>{plan.icon}</div>

                  {/* Plan name */}
                  <div style={{
                    fontSize: 18, fontWeight: 800, color: "#fff",
                    marginBottom: 4
                  }}>{plan.name}</div>

                  {/* Billed label */}
                  <div style={{
                    fontSize: 11, color: "rgba(255,255,255,0.32)",
                    marginBottom: 20, fontWeight: 500
                  }}>Billed monthly</div>

                  {/* Price */}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 8 }}>
                    <span style={{
                      fontSize: 40, fontWeight: 800, color: "#fff",
                      lineHeight: 1, letterSpacing: "-2px"
                    }}>
                      {plan.price === null ? "Custom"
                        : plan.price === 0 ? "$0"
                          : `₹${plan.price.toLocaleString("en-IN")}`}
                    </span>
                    {plan.price !== null && (
                      <span style={{
                        fontSize: 13, color: "rgba(255,255,255,0.38)",
                        marginBottom: 5, fontWeight: 400
                      }}>/ month</span>
                    )}
                  </div>

                  {/* Description */}
                  <div style={{
                    fontSize: 12, color: "rgba(255,255,255,0.25)",
                    marginBottom: 20, minHeight: 14, lineHeight: 1.5
                  }}>
                    {isTrial ? "Ideal for individual users."
                      : plan.name === "Starter" ? "Ideal for small teams."
                        : plan.name === "Professional" ? "Best for growing businesses."
                          : "Best choice for Enterprises."}
                  </div>

                  {/* Divider */}
                  <div style={{
                    height: 1,
                    background: isPro ? "rgba(0,220,150,0.13)" : "rgba(255,255,255,0.06)",
                    marginBottom: 20
                  }} />

                  {/* Features */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, marginBottom: 24 }}>
                    {plan.features.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                          background: isPro ? "rgba(0,220,150,0.12)" : "rgba(255,255,255,0.07)",
                          border: isPro ? "1px solid rgba(0,220,150,0.35)" : "1px solid rgba(255,255,255,0.12)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 7, color: isPro ? "#00dc96" : "rgba(255,255,255,0.45)"
                        }}>✓</div>
                        <span style={{
                          fontSize: 12, color: "rgba(255,255,255,0.55)",
                          fontWeight: 400, lineHeight: 1.5
                        }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => startRazorpayPayment(plan)}
                    disabled={!!payLoading}
                    style={{
                      width: "100%", padding: "13px",
                      borderRadius: 11, fontSize: 14, fontWeight: 700,
                      cursor: payLoading ? "wait" : "pointer",
                      transition: "all 0.2s", fontFamily: "inherit",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      ...(isProcessing ? {
                        background: "rgba(255,255,255,0.08)",
                        border: "1.5px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.4)"
                      } : isPro ? {
                        background: "linear-gradient(135deg, #00dc96, #00b87a)",
                        border: "none", color: "#000",
                        boxShadow: "0 6px 22px rgba(0,220,150,0.32)"
                      } : isTrial ? {
                        background: "rgba(255,255,255,0.08)",
                        border: "1.5px solid rgba(255,255,255,0.18)",
                        color: "#fff"
                      } : {
                        background: "transparent",
                        border: "1.5px solid rgba(255,255,255,0.14)",
                        color: "rgba(255,255,255,0.7)"
                      })
                    }}
                    onMouseEnter={e => {
                      if (isProcessing) return;
                      if (isPro) {
                        e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,220,150,0.48)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      } else {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                        e.currentTarget.style.color = "#fff";
                      }
                    }}
                    onMouseLeave={e => {
                      if (isProcessing) return;
                      if (isPro) {
                        e.currentTarget.style.boxShadow = "0 6px 22px rgba(0,220,150,0.32)";
                        e.currentTarget.style.transform = "translateY(0)";
                      } else {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                        e.currentTarget.style.color = isTrial ? "#fff" : "rgba(255,255,255,0.7)";
                      }
                    }}
                  >
                    {isProcessing ? (
                      <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid rgba(255,255,255,0.8)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Processing...</>
                    ) : plan.price === null ? "📞 Contact Sales"
                      : isTrial ? "🎁 Get Started"
                        : "Get Started"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Security footer */}
          <div style={{
            display: "flex", justifyContent: "center", alignItems: "center", gap: 28,
            marginTop: 40, flexWrap: "wrap", position: "relative", zIndex: 1
          }}>
            {["🔒 SSL Encrypted", "💳 Razorpay Secured", "🏦 RBI Compliant", "📞 +91 98765 43210"].map(t => (
              <span key={t} style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Mock Gateway - same as before */}
        {mockGatewayOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "#fff", width: "100%", maxWidth: 420, borderRadius: 24, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.3)" }}>
              <div style={{ background: "linear-gradient(135deg, #0a0a0f, #0d2a22)", padding: "32px 24px", color: "#fff", position: "relative" }}>
                <button onClick={() => setMockGatewayOpen(null)} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1, opacity: 0.8 }}>M BUSINESS</div>
                  <div style={{ background: "rgba(0,220,150,0.15)", border: "1px solid rgba(0,220,150,0.3)", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, color: "#00dc96" }}>TEST MODE</div>
                </div>
                <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 4 }}>Amount to Pay</div>
                <div style={{ fontSize: 36, fontWeight: 800 }}>₹{mockGatewayOpen.plan.price?.toLocaleString("en-IN")}</div>
                <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>{mockGatewayOpen.plan.name} Plan</div>
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase" }}>Simulated Card</label>
                  <div style={{ border: "1.5px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                    <input readOnly value="4242 4242 4242 4242" style={{ width: "100%", padding: "13px 14px", border: "none", borderBottom: "1.5px solid #e2e8f0", fontSize: 14, fontWeight: 600, background: "#f8fafc", outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                    <div style={{ display: "flex" }}>
                      <input readOnly value="12/28" style={{ width: "50%", padding: "13px 14px", border: "none", borderRight: "1.5px solid #e2e8f0", fontSize: 14, fontWeight: 600, background: "#f8fafc", outline: "none", fontFamily: "monospace" }} />
                      <input readOnly value="123" style={{ width: "50%", padding: "13px 14px", border: "none", fontSize: 14, fontWeight: 600, background: "#f8fafc", outline: "none", fontFamily: "monospace" }} />
                    </div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const { plan, orderId } = mockGatewayOpen;
                    setMockGatewayOpen({ ...mockGatewayOpen, processing: true });
                    try {
                      const endDate = new Date();
                      endDate.setDate(endDate.getDate() + 30);
                      await axios.post(`${BASE_URL}/api/subscriptions/create`, {
                        userId, companyId: userId, userEmail, userName,
                        planName: plan.name, planPrice: plan.price,
                        billingCycle: "monthly", status: "active",
                        isFullyPaid: true, startDate: new Date(), endDate, nextBillingDate: endDate,
                        usageLimit: 999, features: plan.features, paymentMethod: "other",
                      });
                      await fetchData();
                      setMockGatewayOpen(null);
                      setPaymentSuccessData(plan);
                    } catch (err) {
                      showToast("❌ Payment failed.");
                      setMockGatewayOpen(null);
                    }
                  }}
                  disabled={mockGatewayOpen.processing}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 12,
                    background: mockGatewayOpen.processing ? "#94a3b8" : "linear-gradient(135deg, #00dc96, #00b87a)",
                    color: "#000", border: "none", fontSize: 15, fontWeight: 800,
                    cursor: mockGatewayOpen.processing ? "wait" : "pointer",
                    boxShadow: mockGatewayOpen.processing ? "none" : "0 8px 20px rgba(0,220,150,0.3)"
                  }}
                >
                  {mockGatewayOpen.processing ? "Processing..." : `Pay ₹${mockGatewayOpen.plan.price?.toLocaleString("en-IN")} Securely`}
                </button>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 16 }}>
                  <span style={{ fontSize: 12 }}>🔒</span>
                  <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Secured by M Business</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Has Subscription ─────────────────────────────────────────────────────────
  const daysLeft = getDaysLeft(subscription.endDate);
  const usageRemaining = Math.max(0, (subscription.usageLimit || 999) - (subscription.usageCount || 0));
  const usagePct = Math.min(100, Math.round(((subscription.usageCount || 0) / (subscription.usageLimit || 999)) * 100));

  // Expired > 60 days → Contact administrator
  const daysSinceExpiry = subscription.endDate
    ? Math.max(0, Math.ceil((new Date() - new Date(subscription.endDate)) / 86400000))
    : 0;
  const isExpiredOver60 = subscription.status === "hidden" || (subscription.status === "expired" && daysSinceExpiry > 60);

  if (isExpiredOver60) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 20, textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 60 }}>🔒</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: 0 }}>Subscription Access Restricted</h2>
        <p style={{ color: "#64748b", fontSize: 14, maxWidth: 420, lineHeight: 1.7, margin: 0 }}>
          Your subscription expired {daysSinceExpiry} days ago. Access has been restricted. Please contact your administrator to renew your plan.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <a href={`mailto:billing@${(user?.companyName || "business").toLowerCase().replace(/\s+/g, "")}.com`} style={{ display: "inline-block", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", color: "#fff", textDecoration: "none", padding: "12px 24px", borderRadius: 10, fontWeight: 700, fontSize: 14 }}>
            📧 Contact Administrator
          </a>
          <a href="tel:+919876543210" style={{ display: "inline-block", background: "#f1f5f9", color: "var(--app-sidebar)", textDecoration: "none", padding: "12px 24px", borderRadius: 10, fontWeight: 700, fontSize: 14, border: "1.5px solid #e2e8f0" }}>
            📞 Call Support
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "var(--app-sidebar)", color: "#fff", borderRadius: 12, padding: "14px 22px", fontSize: 14, fontWeight: 700, boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>{toast}</div>}

      {/* ── 10-day warning banner ── */}
      {subscription.status === "active" && daysLeft !== null && daysLeft <= 10 && daysLeft > 0 && (
        <div style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)", border: "2px solid #f59e0b", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 28 }}>⏰</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#92400e", marginBottom: 3 }}>Subscription Expiring Soon!</div>
            <div style={{ fontSize: 13, color: "#78350f" }}>Your <strong>{subscription.planName}</strong> plan expires in <strong style={{ color: "#d97706" }}>{daysLeft} day{daysLeft === 1 ? "" : "s"}</strong>. Please renew before it expires.</div>
          </div>
          <button onClick={() => setActiveTab("upgrade")} style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: 9, padding: "9px 18px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}>Renew Now</button>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {[
          { label: "CURRENT PLAN", value: subscription.planName + (subscription.isTrial ? " (Trial)" : ""), sub: `₹${subscription.planPrice?.toLocaleString() || "0"}/${subscription.billingCycle}`, bg: "linear-gradient(135deg,var(--app-accent),var(--app-muted))" },
          { label: "PAYMENT STATUS", value: subscription.isFullyPaid ? "✅ Fully Paid" : "⏳ Pending", sub: subscription.isFullyPaid ? "All payments cleared" : "Payment required", bg: subscription.isFullyPaid ? "linear-gradient(135deg,#22C55E,#16a34a)" : "linear-gradient(135deg,#F59E0B,#d97706)" },
          { label: "STATUS", value: subscription.status?.toUpperCase(), sub: `Valid till ${formatDate(subscription.endDate)} · ${daysLeft || 0} days left`, bg: subscription.status === "active" ? "linear-gradient(135deg,#3b82f6,#2563eb)" : "linear-gradient(135deg,#6b7280,#4b5563)" },
          { label: "USAGE REMAINING", value: usageRemaining.toLocaleString("en-IN"), sub: `Used: ${subscription.usageCount || 0} / ${subscription.usageLimit || 999}`, bg: "linear-gradient(135deg,var(--app-sidebar),var(--app-sidebar))" }
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: "16px 14px", color: "#fff" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, opacity: 0.85, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Usage Progress Bar ── */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1px solid var(--app-border)", boxShadow: "0 2px 12px rgba(var(--app-accent-rgb, 124, 58, 237),0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>📊 Usage Limit</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: usagePct >= 80 ? T.warning : T.success }}>{usageRemaining} remaining of {subscription.usageLimit || 999}</div>
        </div>
        <div style={{ background: "#f3f4f6", borderRadius: 8, height: 10, overflow: "hidden" }}>
          <div style={{ width: `${usagePct}%`, height: "100%", borderRadius: 8, background: usagePct >= 80 ? "linear-gradient(90deg,#f59e0b,#ef4444)" : "linear-gradient(90deg,var(--app-accent),#22c55e)", transition: "width 0.6s ease" }} />
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>{usagePct}% used {usagePct >= 80 && "⚠️ Approaching limit"}</div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, borderBottom: "2px solid var(--app-border)", paddingBottom: 0, flexWrap: "wrap" }}>
        {[
          { key: "overview", label: "📋 Overview" },
          { key: "payments", label: `💳 Payments (${payments.length})` },
          { key: "invoices", label: `🧾 Invoices (${invoices.length})` },
          { key: "quotations", label: `📄 Quotations (${quotations.length})` },
          { key: "upgrade", label: "⬆️ Upgrade" }
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: "10px 16px", background: activeTab === tab.key ? "var(--app-bg)" : "transparent",
            border: "none", borderBottom: activeTab === tab.key ? "2px solid var(--app-accent)" : "2px solid transparent",
            borderRadius: "8px 8px 0 0", color: activeTab === tab.key ? T.accent : "#94a3b8",
            fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: -2
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card title="Current Plan Details" icon="⭐">
            <InfoRow label="Plan Name" value={`${subscription.planName}${subscription.isTrial ? " (Free Trial)" : ""}`} icon="📦" />
            <InfoRow label="Price" value={`${formatCurrency(subscription.planPrice)}/${subscription.billingCycle}`} icon="💵" />
            <InfoRow label="Status" value={subscription.status} icon="🔵" />
            <InfoRow label="Start Date" value={formatDate(subscription.startDate)} icon="📅" />
            <InfoRow label="End Date" value={formatDate(subscription.endDate)} icon="⏰" />
            <InfoRow label="Days Remaining" value={`${daysLeft || 0} days`} icon="⌛" />
            <InfoRow label="Payment Status" value={subscription.isFullyPaid ? "✅ Fully Paid" : "⏳ Pending"} icon="💳" />
            <InfoRow label="Next Billing" value={formatDate(subscription.nextBillingDate)} icon="📆" />
          </Card>

          <Card title="Plan Features" icon="✨">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(subscription.features || []).map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#f0fdf4", borderRadius: 9, border: "1px solid #bbf7d0" }}>
                  <span style={{ color: T.success, fontSize: 13 }}>✓</span>
                  <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{f}</span>
                </div>
              ))}
              {(!subscription.features || subscription.features.length === 0) && (
                <div style={{ color: T.muted, fontSize: 13, padding: 20, textAlign: "center" }}>No features listed</div>
              )}
            </div>
          </Card>

          <Card title={`Provider — ${user?.companyName || ""}`} icon="🏢">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <InfoRow label="Company" value={subscription.providerCompany || user?.companyName || ""} icon="🏢" />
              <InfoRow label="Email" value={subscription.providerEmail || "billing@business-suite.com"} icon="📧" />
              <InfoRow label="Phone" value={subscription.providerPhone || "+91-9876543210"} icon="📱" />
              <InfoRow label="GST" value={subscription.providerGst || "GSTIN-33AABCM1234Z1Z1"} icon="📋" />
            </div>
          </Card>

          <Card title="Invoice & Quotation Refs" icon="📎">
            {subscription.invoiceRefs?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Invoices</div>
                {subscription.invoiceRefs.map((r, i) => (
                  <div key={i} style={{ padding: "7px 12px", background: "var(--app-bg)", borderRadius: 8, fontSize: 13, fontWeight: 600, color: T.accent, marginBottom: 4, border: "1px solid var(--app-border)" }}>🧾 {r}</div>
                ))}
              </div>
            )}
            {subscription.quotationRefs?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Quotations</div>
                {subscription.quotationRefs.map((r, i) => (
                  <div key={i} style={{ padding: "7px 12px", background: "#fffbeb", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#d97706", marginBottom: 4, border: "1px solid #fde68a" }}>📄 {r}</div>
                ))}
              </div>
            )}
            {(!subscription.invoiceRefs?.length && !subscription.quotationRefs?.length) && (
              <div style={{ textAlign: "center", padding: 20, color: T.muted, fontSize: 13 }}>No references yet</div>
            )}
          </Card>
        </div>
      )}

      {/* ── Payments Tab ── */}
      {activeTab === "payments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Payment Method Section (Same as Invoices for consistency) */}


          <Card title={`Payment History`} icon="💰">
            {payments.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: T.muted }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>💳</div>
                <p style={{ margin: 0 }}>No payment history found</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["ID", "Date", "Description", "Amount", "Status", "Actions"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 13, fontWeight: 700, color: T.muted, borderBottom: "1px solid var(--app-border)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => (
                      <tr key={p._id || i} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "16px", fontSize: 12, fontFamily: "monospace", color: T.muted }}>{(p.paymentId || "").slice(0, 10)}...</td>
                        <td style={{ padding: "16px", fontSize: 14, color: T.text }}>{formatDate(p.paymentDate)}</td>
                        <td style={{ padding: "16px", fontSize: 14, color: T.text }}>{p.description}</td>
                        <td style={{ padding: "16px", fontSize: 14, fontWeight: 600, color: T.text }}>{formatCurrency(p.amount, p.currency)}</td>
                        <td style={{ padding: "16px" }}>
                          <Badge label={p.status} color={getStatusColor(p.status)} />
                        </td>
                        <td style={{ padding: "16px" }}>
                          <button
                            onClick={() => p.invoiceNo ? setViewInvoice(p) : setViewPayment(p)}
                            style={{ background: "none", border: "none", color: "var(--app-accent)", fontWeight: 600, cursor: "pointer", fontSize: 14, padding: 0, textDecoration: "underline" }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Invoices Tab ── */}
      {activeTab === "invoices" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>


          <Card title={`Invoices`} icon="🧾">
            {invoices.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: T.muted }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
                <p style={{ margin: 0 }}>No invoices yet. Invoices are provided by M Business upon payment.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Date", "Total", "Status", "Actions"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 13, fontWeight: 700, color: T.muted, borderBottom: "1px solid var(--app-border)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv, i) => (
                      <tr key={inv._id || i} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "16px", fontSize: 14, color: T.text }}>{formatDate(inv.paymentDate)}</td>
                        <td style={{ padding: "16px", fontSize: 14, fontWeight: 600, color: T.text }}>{formatCurrency(inv.amount, inv.currency)}</td>
                        <td style={{ padding: "16px" }}>
                          <span style={{ padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: "#f0fdf4", color: "#16a34a", textTransform: "capitalize" }}>
                            {inv.status || "Paid"}
                          </span>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <button
                            onClick={() => setViewInvoice(inv)}
                            style={{ background: "none", border: "none", color: "var(--app-accent)", fontWeight: 600, cursor: "pointer", fontSize: 14, padding: 0, textDecoration: "underline" }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Quotations Tab ── */}
      {activeTab === "quotations" && (
        <Card title={`Quotations from ${user?.companyName || ""} (${quotations.length})`} icon="📄">
          {quotations.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: T.muted }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
              <p style={{ margin: 0 }}>No quotations yet. Quotations are provided by M Business before payment.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {quotations.map((q, i) => (
                <div key={q._id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#fffbeb", borderRadius: 12, border: "1px solid #fde68a" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: "linear-gradient(135deg,#f59e0b,#d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📄</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Quotation #{q.quotationNo}</div>
                      <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{q.description} • {formatDate(q.paymentDate)}</div>
                      <div style={{ fontSize: 11, color: "#d97706", marginTop: 2, fontWeight: 600 }}>From: {q.providerCompany || "M Business"}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#f59e0b" }}>{formatCurrency(q.amount, q.currency)}</div>
                    <div style={{ marginTop: 4 }}><Badge label={q.status} color={getStatusColor(q.status)} /></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Upgrade Tab ── */}
      {activeTab === "upgrade" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: "0 0 6px" }}>⬆️ Upgrade or Renew Your Plan</h3>
            <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>Current plan: <strong>{subscription.planName}</strong> • Expires: <strong>{formatDate(subscription.endDate)}</strong></p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {PLANS.filter(p => !p.isTrial && p.price !== null).map(plan => {
              const isProcessing = payLoading === plan.name;
              const isCurrent = subscription.planName === plan.name;
              return (
                <div key={plan.name} style={{ background: "#fff", borderRadius: 20, padding: "24px 22px", border: isCurrent ? `2px solid ${T.accent}` : "1.5px solid var(--app-border)", boxShadow: isCurrent ? "0 12px 32px rgba(var(--app-accent-rgb, 124, 58, 237),0.15)" : "0 4px 16px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{plan.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 4 }}>{plan.name}{isCurrent && <span style={{ marginLeft: 10, fontSize: 11, background: "var(--app-bg)", color: T.accent, padding: "3px 10px", borderRadius: 20, fontWeight: 800 }}>CURRENT</span>}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: plan.color, marginBottom: 16 }}>₹{plan.price?.toLocaleString("en-IN")}<span style={{ fontSize: 14, color: T.muted, fontWeight: 600 }}>/mo</span></div>
                  <div style={{ marginBottom: 16, background: "var(--app-bg)", borderRadius: 10, padding: "8px 12px", display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12 }}>🔒</span>
                    <span style={{ fontSize: 11, color: T.muted, fontWeight: 700 }}>Secure Payment Gateway</span>
                  </div>
                  <button onClick={() => startRazorpayPayment(plan)} disabled={!!payLoading} style={{ width: "100%", padding: "14px", borderRadius: 12, background: isCurrent ? "linear-gradient(135deg,var(--app-accent),var(--app-muted))" : "var(--app-bg)", color: isCurrent ? "#fff" : T.accent, border: isCurrent ? "none" : `2px solid ${T.accent}`, fontSize: 14, fontWeight: 800, cursor: payLoading ? "wait" : "pointer", transition: "0.2s" }}>
                    {isProcessing ? "Processing..." : isCurrent ? "🔄 Renew Plan" : "⬆️ Switch to " + plan.name}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Payment Detail Modal ── */}
      {viewPayment && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(59,7,100,0.55)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(var(--app-accent-rgb, 124, 58, 237),0.25)" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--app-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(90deg,var(--app-bg),var(--app-bg))" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.text }}>Payment Details</h2>
              <button onClick={() => setViewPayment(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: T.muted }}>✕</button>
            </div>
            <div style={{ padding: 24, overflowY: "auto" }}>
              <div style={{ textAlign: "center", padding: 20, background: getStatusColor(viewPayment.status) + "14", borderRadius: 14, marginBottom: 20, border: `1px solid ${getStatusColor(viewPayment.status)}28` }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{viewPayment.status === "completed" ? "✅" : viewPayment.status === "pending" ? "⏳" : "❌"}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: getStatusColor(viewPayment.status) }}>{formatCurrency(viewPayment.amount, viewPayment.currency)}</div>
                <div style={{ fontSize: 13, color: T.muted, marginTop: 4, textTransform: "capitalize" }}>{viewPayment.status}</div>
              </div>
              <InfoRow label="Payment ID" value={viewPayment.paymentId} icon="🆔" />
              <InfoRow label="Description" value={viewPayment.description} icon="📝" />
              <InfoRow label="Date" value={formatDate(viewPayment.paymentDate)} icon="📅" />
              <InfoRow label="Method" value={viewPayment.paymentMethod} icon="💳" />
              {viewPayment.invoiceNo && <InfoRow label="Invoice No" value={viewPayment.invoiceNo} icon="🧾" />}
              {viewPayment.quotationNo && <InfoRow label="Quotation No" value={viewPayment.quotationNo} icon="📄" />}
              <div style={{ marginTop: 16, padding: 14, background: "var(--app-bg)", borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Provider — {user?.companyName || ""}</div>
                <InfoRow label="Company" value={viewPayment.providerCompany} icon="🏢" />
                <InfoRow label="GST" value={viewPayment.providerGst} icon="📋" />
                <InfoRow label="Address" value={viewPayment.providerAddress} icon="📍" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Stripe-style Invoice Modal ── */}
      {viewInvoice && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setViewInvoice(null)}>
          <div
            style={{
              background: "#fff",
              width: "100%",
              maxWidth: 440,
              borderRadius: 24,
              padding: 40,
              position: "relative",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              animation: "modalFadeIn 0.3s ease-out"
            }}
            onClick={e => e.stopPropagation()}
          >
            <style>{`
              @keyframes modalFadeIn {
                from { opacity: 0; transform: scale(0.95) translateY(10px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
            `}</style>

            <button
              onClick={() => setViewInvoice(null)}
              style={{ position: "absolute", top: 20, right: 20, background: "#f1f5f9", border: "none", color: "#64748b", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"}
              onMouseLeave={e => e.currentTarget.style.background = "#f1f5f9"}
            >✕</button>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ position: "relative", marginBottom: 20 }}>
                <div style={{ width: 80, height: 80, background: "#f8fafc", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, border: "1px solid #e2e8f0" }}>
                  📄
                </div>
                <div style={{ position: "absolute", bottom: -5, right: -5, width: 24, height: 24, background: "#22c55e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, border: "3px solid #fff" }}>✓</div>
              </div>

              <div style={{ fontSize: 15, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>Invoice paid</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: "#1e293b", marginBottom: 12 }}>{formatCurrency(viewInvoice.amount, viewInvoice.currency)}</div>

              <button style={{ background: "none", border: "none", color: "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 40 }}>
                View invoice and payment details <span style={{ fontSize: 18 }}>›</span>
              </button>

              <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8", fontSize: 14 }}>Invoice number</span>
                  <span style={{ color: "#1e293b", fontSize: 14, fontWeight: 600 }}>{viewInvoice.invoiceNo || "LDBG06TE-0001"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8", fontSize: 14 }}>Payment date</span>
                  <span style={{ color: "#1e293b", fontSize: 14, fontWeight: 600 }}>{formatDate(viewInvoice.paymentDate)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8", fontSize: 14 }}>Payment method</span>
                  <span style={{ color: "#1e293b", fontSize: 14, fontWeight: 600 }}>{viewInvoice.paymentMethod?.toUpperCase() || "Mastercard"} •••• {user?.last4 || "3867"}</span>
                </div>
              </div>

              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
                <button
                  onClick={() => handlePrint("receipt")}
                  style={{ width: "100%", padding: "14px", borderRadius: 12, background: "#1e293b", color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#0f172a"}
                  onMouseLeave={e => e.currentTarget.style.background = "#1e293b"}
                >
                  Download receipt
                </button>
                <button
                  onClick={() => handlePrint("invoice")}
                  style={{ width: "100%", padding: "14px", borderRadius: 12, background: "#fff", color: "#1e293b", border: "1.5px solid #e2e8f0", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                >
                  Download invoice
                </button>
              </div>

              <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>
                  Powered by <span style={{ color: "#64748b", fontWeight: 800 }}>M Business</span>
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Terms</span>
                  <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Privacy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


