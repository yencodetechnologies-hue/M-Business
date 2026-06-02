import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

// ─── Theme ──────────────────────────────────────────────────────────────────
const T = {
  primary: "var(--app-sidebar)", sidebar: "var(--app-sidebar)", accent: "var(--app-accent)",
  bg: "var(--app-bg)", card: "var(--app-card)", text: "var(--app-sidebar)", muted: "var(--app-accent)",
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
  <div style={{ background: "var(--app-card)", borderRadius: 16, padding: 22, boxShadow: "0 4px 24px rgba(var(--app-accent-rgb, 124, 58, 237),0.08)", border: "1.5px solid var(--app-border)" }}>
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
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--app-bg)", borderRadius: 9, border: "1.5px solid var(--app-border)", marginBottom: 7 }}>
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
    name: "Trial", price: 0, icon: "✨", color: "var(--app-accent)", duration: "30 days", isTrial: true,
    features: ["30 Days Free Trial", "5 Projects", "5 Invoices", "Single business manage", "Managers: 1", "Clients: 5", "Employees: 20"],
    clientLimit: "5 Clients", employeeLimit: "20 Employees", managerLimit: "1 Manager manage",
    btnLabel: "Start Free Trial"
  },
  {
    name: "Starter", price: 999, icon: "🌱", color: "var(--app-accent)",
    features: ["5 Projects", "10 Invoices", "Single business manage", "Managers: 1", "Clients: 3", "Employees: 10", "Email Support"],
    clientLimit: "3 Client manage", employeeLimit: "10 Employee manage", managerLimit: "1 Manager manage",
  },
  {
    name: "Professional", price: 2999, icon: "🚀", color: "var(--app-accent)", popular: true,
    features: ["Unlimited Projects", "Unlimited Invoices", "Multiple business manage", "Managers: 3", "Clients: 10", "Employees: 50", "Priority Support"],
    clientLimit: "10 Client manage", employeeLimit: "50 Employee manage", managerLimit: "3 Manager manage",
  },
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
export default function MySubscriptions({ user, onSubscriptionSuccess, initialTab = "overview", preloadedSubscription = null }) {
  const [subscription, setSubscription] = useState(preloadedSubscription);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(!preloadedSubscription);
  const [payLoading, setPayLoading] = useState(null); // plan name being processed
  const [activeTab, setActiveTab] = useState(initialTab);
  const [viewPayment, setViewPayment] = useState(null);
  const [viewInvoice, setViewInvoice] = useState(null);
  
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  const [toast, setToast] = useState("");
  const [mockGatewayOpen, setMockGatewayOpen] = useState(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  const [assignedPackages, setAssignedPackages] = useState([]);

  // Check URL for PayU success/failure redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    if (paymentStatus === "success") {
      showToast("🎉 Payment Successful! Your plan is active.");
      const planName = params.get("plan");
      setPaymentSuccessData({ name: planName || "Subscription" });
      
      // Clean up URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === "failed") {
      showToast("❌ Payment failed. Please try again.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const userId = user?._id || user?.id;
  const userEmail = user?.email;
  const userName = user?.name || user?.clientName || "User";

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchData = useCallback(async () => {
    if (!userId) return;
    try {
      if (!preloadedSubscription) setLoading(true);
      // Fetch subscription first (this triggers retroactive trial invoice creation if needed)
      const subRes = await axios.get(`${BASE_URL}/api/subscriptions/current/${userId}`);
      if (subRes.data.hasSubscription) {
        const sub = subRes.data.subscription;
        setSubscription(sub);
        const days = getDaysLeft(sub.endDate);
        if (sub.status === "hidden" || sub.status === "expired" || (days !== null && days <= 10)) {
          setActiveTab("upgrade");
        }
      } else {
        setSubscription(null);
      }

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

      // Fetch assigned packages
      try {
        const pkgRes = await axios.get(`${BASE_URL}/api/packages/subadmin/${userId}`);
        setAssignedPackages(pkgRes.data || []);
      } catch (pkgErr) { console.error("Failed to fetch assigned packages:", pkgErr); }

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
  const startTrial = async (targetPkg = null) => {
    try {
      setPayLoading("Trial");
      const payload = { 
        userId, 
        userEmail, 
        userName,
        // Pass limits if a specific free package was selected
        clientLimit: targetPkg?.clientLimit,
        employeeLimit: targetPkg?.employeeLimit,
        managerLimit: targetPkg?.managerLimit,
        businessLimit: targetPkg?.businessLimit,
        planName: targetPkg?.title || "Free",
        features: targetPkg?.features
      };
      const res = await axios.post(`${BASE_URL}/api/subscriptions/start-trial`, payload);
      if (res.data.success) {
        showToast(`🎉 30-day free trial started${targetPkg ? ` with ${targetPkg.title}` : ""}!`);
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

  // ── PayU Payment for Paid Plans ─────────────────────────────────────────────
  const startPayUPayment = async (plan) => {
    if (plan.isTrial) { startTrial(plan); return; }
    if (!plan.price) { window.open(`mailto:billing@${(user?.companyName || "business").toLowerCase().replace(/\s+/g, "")}.com`); return; }

    try {
      setPayLoading(plan.name);

      // Call backend to initialize PayU and get hash
      const initRes = await axios.post(`${BASE_URL}/api/payments/payu/init`, {
        plan,
        userId,
        userEmail,
        userName
      });

      if (!initRes.data.success) throw new Error("Payment initialization failed");

      const { key, txnid, amount, productinfo, firstname, email, phone, hash, surl, furl, env } = initRes.data;

      // Determine PayU URL based on environment
      const payuUrl = env === "secure" ? "https://secure.payu.in/_payment" : "https://test.payu.in/_payment";

      // Create a form dynamically and submit it
      const form = document.createElement("form");
      form.setAttribute("method", "POST");
      form.setAttribute("action", payuUrl);

      const params = {
        key, txnid, amount, productinfo, firstname, email, phone, surl, furl, hash
      };

      for (const [k, v] of Object.entries(params)) {
        const hiddenField = document.createElement("input");
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", k);
        hiddenField.setAttribute("value", v);
        form.appendChild(hiddenField);
      }

      document.body.appendChild(form);
      form.submit();

    } catch (err) {
      showToast("❌ " + (err.response?.data?.error || err.message));
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

  // ── Loading removed to prevent spinner from showing ──────────────────────────

  // ── No Subscription → Show Plans (Screenshot 2 Style) ─────────────────────────
  if (!subscription) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 32, padding: "4px 0", animation: "fadeIn 0.6s ease-out" }}>
        {toast && <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "var(--app-sidebar)", color: "#fff", borderRadius: 12, padding: "14px 22px", fontSize: 14, fontWeight: 700, boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>{toast}</div>}

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: T.text, margin: "0 0 10px", letterSpacing: "-0.5px" }}>Choose Your Plan</h2>
          <p style={{ color: "var(--app-accent)", fontWeight: 600, fontSize: 15, margin: "0 0 4px" }}>Select the best plan for your business growth</p>
          <div style={{ fontSize: 12, color: "rgba(var(--app-accent-rgb), 0.5)", fontWeight: 600, letterSpacing: 0.5 }}>Management Suite - subadmin</div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 24,
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%"
        }}>
          {[...PLANS].map((plan, idx) => {
            const isProcessing = payLoading === plan.name;
            return (
              <div
                key={plan.name}
                style={{
                  background: "#fff",
                  borderRadius: 24,
                  padding: "40px 24px",
                  border: plan.popular ? `2.5px solid var(--app-accent)` : `1px solid var(--app-border)`,
                  boxShadow: plan.popular ? "0 20px 40px rgba(var(--app-accent-rgb, 124, 58, 237),0.15)" : "0 10px 30px rgba(0,0,0,0.03)",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: plan.popular ? "scale(1.03)" : "scale(1)",
                  zIndex: plan.popular ? 2 : 1
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = plan.popular ? "scale(1.05)" : "scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 25px 50px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = plan.popular ? "scale(1.03)" : "scale(1)";
                  e.currentTarget.style.boxShadow = plan.popular ? "0 20px 40px rgba(var(--app-accent-rgb, 124, 58, 237),0.15)" : "0 10px 30px rgba(0,0,0,0.03)";
                }}
              >
                {plan.popular && (
                  <div style={{
                    position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                    background: "var(--app-accent)", color: "#fff", padding: "6px 20px",
                    borderRadius: 20, fontSize: 11, fontWeight: 900, textTransform: "uppercase",
                    letterSpacing: 1, whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(var(--app-accent-rgb),0.3)"
                  }}>Most Popular</div>
                )}

                <div style={{ fontSize: 36, marginBottom: 20, textAlign: "left" }}>{plan.icon}</div>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: "0 0 6px" }}>{plan.name}</h3>
                
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                  <span style={{ fontSize: 42, fontWeight: 900, color: T.text, letterSpacing: "-1px" }}>
                    {plan.price === null ? "Contact us" : `₹${plan.price.toLocaleString("en-IN")}`}
                  </span>
                  {plan.price !== null && <span style={{ fontSize: 14, color: T.muted, fontWeight: 700 }}>/ month</span>}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, marginBottom: 32 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ color: "#22C55E", fontSize: 16, marginTop: -2 }}>✓</div>
                      <span style={{ fontSize: 13, color: "var(--app-sidebar)", fontWeight: 500, lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => startPayUPayment(plan)}
                  disabled={!!payLoading}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 800,
                    cursor: payLoading ? "wait" : "pointer", transition: "all 0.2s", fontFamily: "inherit",
                    background: plan.name === "Enterprise" ? "#fff" : plan.popular ? "var(--app-accent)" : "rgba(var(--app-accent-rgb), 0.08)",
                    border: plan.name === "Enterprise" ? "1.5px solid var(--app-accent)" : "none",
                    color: plan.name === "Enterprise" ? "var(--app-accent)" : plan.popular ? "#fff" : "var(--app-accent)",
                    boxShadow: plan.popular ? "0 8px 20px rgba(var(--app-accent-rgb), 0.3)" : "none"
                  }}
                  onMouseEnter={e => {
                    if (plan.popular) e.currentTarget.style.boxShadow = "0 10px 25px rgba(var(--app-accent-rgb), 0.4)";
                    else e.currentTarget.style.background = plan.name === "Enterprise" ? "rgba(var(--app-accent-rgb), 0.05)" : "rgba(var(--app-accent-rgb), 0.12)";
                  }}
                  onMouseLeave={e => {
                    if (plan.popular) e.currentTarget.style.boxShadow = "0 8px 20px rgba(var(--app-accent-rgb), 0.3)";
                    else e.currentTarget.style.background = plan.name === "Enterprise" ? "#fff" : "rgba(var(--app-accent-rgb), 0.08)";
                  }}
                >
                  {isProcessing ? "Processing..." : plan.btnLabel || "Get Started"}
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: 20, color: T.muted, fontSize: 13, fontWeight: 600 }}>
          Need a custom solution or have questions? <span style={{ color: "var(--app-accent)", cursor: "pointer", textDecoration: "underline" }}>Chat with our billing team</span> or call us at +91 98765 43210
        </div>
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
    if (activeTab === "upgrade") {
      // Allow them to see the upgrade tab to renew
    } else {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 20, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 60 }}>🔒</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: 0 }}>Subscription Access Restricted</h2>
          <p style={{ color: "#64748b", fontSize: 14, maxWidth: 420, lineHeight: 1.7, margin: 0 }}>
            Your subscription expired {daysSinceExpiry} days ago. Access has been restricted. Please renew your plan to restore access.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button onClick={() => setActiveTab("upgrade")} style={{ display: "inline-block", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", color: "#fff", textDecoration: "none", padding: "12px 24px", borderRadius: 10, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              🚀 Renew Subscription
            </button>
            <a href="tel:+919876543210" style={{ display: "inline-block", background: "#f1f5f9", color: "var(--app-sidebar)", textDecoration: "none", padding: "12px 24px", borderRadius: 10, fontWeight: 700, fontSize: 14, border: "1.5px solid #e2e8f0" }}>
              📞 Call Support
            </a>
          </div>
        </div>
      );
    }
  }

  return (
    <div style={{ fontFamily: "var(--font)", display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40, animation: "fadeIn 0.4s ease-out" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      
      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "var(--text)", color: "#fff", borderRadius: 12, padding: "14px 22px", fontSize: 14, fontWeight: 700, boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>{toast}</div>}

      {!subscription ? (
        <div className="plans-grid">
          {PLANS.map(plan => (
            <div key={plan.name} className={"plan-card " + (plan.popular ? "popular" : "")}>
              {plan.popular && <div className="popular-ribbon">POPULAR</div>}
              <div className="plan-icon">{plan.icon}</div>
              <div className="plan-name">{plan.name}</div>
              <div className="plan-desc">{plan.clientLimit}, {plan.employeeLimit}</div>
              <div className="plan-price">
                {plan.price === null ? "Contact us" : `₹${plan.price.toLocaleString("en-IN")}`}
                {plan.price !== null && <span>/mo</span>}
              </div>
              <hr className="plan-divider" />
              <div className="plan-features">
                {plan.features.map((f, i) => (
                  <div key={i} className="plan-feature included">
                    <i>✓</i> {f}
                  </div>
                ))}
              </div>
              <button 
                className={"plan-btn " + (plan.popular ? "popular-btn" : "upgrade-btn")} 
                onClick={() => startPayUPayment(plan)}
                disabled={!!payLoading}
              >
                {payLoading === plan.name ? "Processing..." : plan.btnLabel || "Get Started"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="plan-hero">
            <div>
              <div className="ph-badge">{subscription.status === "active" ? "🟢 ACTIVE PLAN" : "🔴 EXPIRED"}</div>
              <div className="ph-title">{subscription.planName}</div>
              <div className="ph-sub">Manage your plan limits, billing, and upgrade options. Valid until {formatDate(subscription.endDate)}.</div>
              <div className="ph-stats">
                <div className="ph-stat">
                  <div className="ph-stat-val">{subscription.clientLimit || "Unlimited"}</div>
                  <div className="ph-stat-label">Clients</div>
                </div>
                <div className="ph-stat">
                  <div className="ph-stat-val">{subscription.employeeLimit || "Unlimited"}</div>
                  <div className="ph-stat-label">Employees</div>
                </div>
                <div className="ph-stat">
                  <div className="ph-stat-val">{subscription.managerLimit || "Unlimited"}</div>
                  <div className="ph-stat-label">Managers</div>
                </div>
              </div>
            </div>
            <div className="ph-right">
              <div className="ph-price">
                <div className="ph-price-val">₹{subscription.planPrice?.toLocaleString("en-IN") || "0"}</div>
                <div className="ph-price-period">per {subscription.billingCycle}</div>
              </div>
              <button className="ph-btn" onClick={() => setActiveTab("upgrade")}>Upgrade Plan</button>
              {daysLeft !== null && daysLeft <= 10 && daysLeft > 0 && (
                <div className="ph-renew">⚠️ Expires in {daysLeft} days</div>
              )}
            </div>
          </div>

          <div className="usage-grid">
            <div className="usage-card">
              <div className="uc-top">
                <div className="uc-icon" style={{ background:"var(--teal-light)", color:"var(--teal)" }}>📊</div>
                <div className="uc-pct" style={{ color:"var(--teal)" }}>{usagePct}%</div>
              </div>
              <div className="uc-name">Plan Usage</div>
              <div className="uc-vals">
                <div className="uc-used">{subscription.usageCount || 0}</div>
                <div className="uc-total">/ {subscription.usageLimit || 999} actions</div>
              </div>
              <div className="uc-bar"><div className="uc-fill" style={{ width: `${usagePct}%`, background:"var(--teal)" }} /></div>
            </div>
            
            <div className="usage-card">
              <div className="uc-top">
                <div className="uc-icon" style={{ background:"var(--amber-bg)", color:"var(--amber)" }}>🏢</div>
              </div>
              <div className="uc-name">Clients</div>
              <div className="uc-vals">
                <div className="uc-used">{subscription.clientLimit || "Unlimited"}</div>
                <div className="uc-total">Limit</div>
              </div>
            </div>

            <div className="usage-card">
              <div className="uc-top">
                <div className="uc-icon" style={{ background:"var(--purple-bg)", color:"var(--purple)" }}>👥</div>
              </div>
              <div className="uc-name">Employees</div>
              <div className="uc-vals">
                <div className="uc-used">{subscription.employeeLimit || "Unlimited"}</div>
                <div className="uc-total">Limit</div>
              </div>
            </div>
          </div>

          {activeTab === "upgrade" && (
            <div className="plans-grid" style={{ marginTop: 10 }}>
              {PLANS.map(plan => {
                const isCurrent = plan.name === subscription.planName;
                return (
                  <div key={plan.name} className={"plan-card " + (isCurrent ? "current" : plan.popular ? "popular" : "")}>
                    {isCurrent && <div className="current-ribbon">CURRENT PLAN</div>}
                    {!isCurrent && plan.popular && <div className="popular-ribbon">POPULAR</div>}
                    <div className="plan-icon">{plan.icon}</div>
                    <div className="plan-name">{plan.name}</div>
                    <div className="plan-desc">{plan.clientLimit}, {plan.employeeLimit}</div>
                    <div className="plan-price">
                      {plan.price === null ? "Contact us" : `₹${plan.price.toLocaleString("en-IN")}`}
                      {plan.price !== null && <span>/mo</span>}
                    </div>
                    <hr className="plan-divider" />
                    <div className="plan-features">
                      {plan.features.map((f, i) => (
                        <div key={i} className="plan-feature included">
                          <i>✓</i> {f}
                        </div>
                      ))}
                    </div>
                    <button 
                      className={"plan-btn " + (isCurrent ? "current-btn" : plan.popular ? "popular-btn" : "upgrade-btn")} 
                      onClick={() => !isCurrent && startPayUPayment(plan)}
                      disabled={!!payLoading || isCurrent}
                    >
                      {payLoading === plan.name ? "Processing..." : isCurrent ? "Current Plan" : plan.btnLabel || "Upgrade"}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <div className="bottom-row">
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Billing History</div>
                <button className="panel-action" onClick={() => setActiveTab(activeTab === "payments" ? "overview" : "payments")}>
                  {activeTab === "payments" ? "Hide all" : "View all"} <span>→</span>
                </button>
              </div>
              
              {payments.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text3)", fontSize: 13, fontWeight: 600 }}>No payment history found</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeTab === "payments" ? payments : payments.slice(0, 5)).map((p, i) => (
                        <tr key={p._id || i}>
                          <td>{formatDate(p.paymentDate)}</td>
                          <td>{p.description}</td>
                          <td style={{ fontWeight: 800 }}>{formatCurrency(p.amount, p.currency)}</td>
                          <td>
                            <span className={"status-pill " + (p.status === "completed" || p.status === "paid" ? "success" : p.status === "pending" ? "pending" : "failed")}>
                              {p.status}
                            </span>
                          </td>
                          <td>
                            <button 
                              onClick={() => p.invoiceNo ? setViewInvoice(p) : setViewPayment(p)}
                              style={{ background: "none", border: "none", color: "var(--teal)", fontWeight: 700, cursor: "pointer", fontSize: 12, textDecoration: "underline", fontFamily: "var(--font)" }}
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
            </div>

            <div className="panel" style={{ height: "fit-content" }}>
              <div className="panel-header">
                <div className="panel-title">Provider Info</div>
              </div>
              <div style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--teal-lighter)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏢</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{subscription.providerCompany || user?.companyName || "M Business"}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>Service Provider</div>
                  </div>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600 }}>Email</span>
                    <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 700 }}>{subscription.providerEmail || "billing@business-suite.com"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600 }}>Phone</span>
                    <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 700 }}>{subscription.providerPhone || "+91-9876543210"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600 }}>GST</span>
                    <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 700 }}>{subscription.providerGst || "GSTIN-33AABCM1234Z1Z1"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODALS */}
      {viewPayment && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setViewPayment(null)}>
          <div style={{ background: "#fff", width: "100%", maxWidth: 440, borderRadius: 24, padding: 30, position: "relative", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, color: "var(--text)", display: "flex", justifyContent: "space-between" }}>
              Payment Details
              <button onClick={() => setViewPayment(null)} style={{ background: "var(--surface2)", border: "none", color: "var(--text2)", width: 28, height: 28, borderRadius: "50%", cursor: "pointer" }}>✕</button>
            </div>
            
            <div style={{ textAlign: "center", padding: 20, background: "var(--bg)", borderRadius: 14, marginBottom: 20, border: `1px solid var(--border)` }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{viewPayment.status === "completed" || viewPayment.status === "paid" ? "✅" : "⏳"}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{formatCurrency(viewPayment.amount, viewPayment.currency)}</div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4, textTransform: "capitalize" }}>{viewPayment.status}</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12, color: "var(--text3)" }}>ID</span><span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>{viewPayment.paymentId}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12, color: "var(--text3)" }}>Description</span><span style={{ fontSize: 13, fontWeight: 700 }}>{viewPayment.description}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12, color: "var(--text3)" }}>Date</span><span style={{ fontSize: 13, fontWeight: 700 }}>{formatDate(viewPayment.paymentDate)}</span></div>
            </div>
          </div>
        </div>
      )}

      {viewInvoice && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setViewInvoice(null)}>
          <div style={{ background: "#fff", width: "100%", maxWidth: 440, borderRadius: 24, padding: 40, position: "relative", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewInvoice(null)} style={{ position: "absolute", top: 20, right: 20, background: "#f1f5f9", border: "none", color: "#64748b", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ position: "relative", marginBottom: 20 }}>
                <div style={{ width: 80, height: 80, background: "#f8fafc", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, border: "1px solid #e2e8f0" }}>🧾</div>
                <div style={{ position: "absolute", bottom: -5, right: -5, width: 24, height: 24, background: "#22c55e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, border: "3px solid #fff" }}>✓</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>Invoice paid</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: "#1e293b", marginBottom: 12 }}>{formatCurrency(viewInvoice.amount, viewInvoice.currency)}</div>
              
              <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", gap: 16, marginBottom: 40, marginTop: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8", fontSize: 14 }}>Invoice number</span>
                  <span style={{ color: "#1e293b", fontSize: 14, fontWeight: 600 }}>{viewInvoice.invoiceNo || "INV-0001"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8", fontSize: 14 }}>Payment date</span>
                  <span style={{ color: "#1e293b", fontSize: 14, fontWeight: 600 }}>{formatDate(viewInvoice.paymentDate)}</span>
                </div>
              </div>

              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
                <button onClick={() => handlePrint("receipt")} style={{ width: "100%", padding: "14px", borderRadius: 12, background: "#1e293b", color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Download receipt</button>
                <button onClick={() => handlePrint("invoice")} style={{ width: "100%", padding: "14px", borderRadius: 12, background: "#fff", color: "#1e293b", border: "1.5px solid #e2e8f0", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Download invoice</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
