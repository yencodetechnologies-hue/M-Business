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
            <InfoRow label="Clients Limit" value={subscription.clientLimit || "Unlimited"} icon="🏢" />
            <InfoRow label="Employees Limit" value={subscription.employeeLimit || "Unlimited"} icon="👥" />
            <InfoRow label="Managers Limit" value={subscription.managerLimit || "Unlimited"} icon="👔" />
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
            {(assignedPackages.length > 0 ? assignedPackages : PLANS).filter(p => (p.type !== "free" && !p.isTrial) || ((p.title || p.name) !== subscription.planName)).sort((a,b) => (parseFloat(a.price)||0)-(parseFloat(b.price)||0)).map(pkg => {
              const plan = {
                name: pkg.title || pkg.name,
                price: pkg.type === "free" || pkg.isTrial ? 0 : parseFloat(pkg.price) || 0,
                icon: pkg.icon || "📦",
                features: Array.isArray(pkg.features) ? pkg.features : (pkg.features || "").split("\n").filter(Boolean),
                isTrial: pkg.type === "free" || pkg.isTrial,
                clientLimit: pkg.clientLimit,
                employeeLimit: pkg.employeeLimit,
                managerLimit: pkg.managerLimit,
                businessLimit: pkg.businessLimit,
                noOfDays: parseInt(pkg.no_of_days || pkg.noOfDays) || 30,
                color: (pkg.title || pkg.name || "").toLowerCase().includes("pro") ? "var(--app-accent)" : "#6366f1"
              };
              const isProcessing = payLoading === plan.name;
              const isCurrent = subscription.planName === plan.name;
              return (
                <div key={plan.name} style={{ background: "#fff", borderRadius: 20, padding: "24px 22px", border: isCurrent ? `2px solid ${T.accent}` : "1.5px solid var(--app-border)", boxShadow: isCurrent ? "0 12px 32px rgba(var(--app-accent-rgb, 124, 58, 237),0.15)" : "0 4px 16px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{plan.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 4 }}>{plan.name}{isCurrent && <span style={{ marginLeft: 10, fontSize: 11, background: "var(--app-bg)", color: T.accent, padding: "3px 10px", borderRadius: 20, fontWeight: 800 }}>CURRENT</span>}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: plan.color, marginBottom: 16 }}>{plan.price === 0 ? "Free" : `₹${plan.price?.toLocaleString("en-IN")}`}<span style={{ fontSize: 14, color: T.muted, fontWeight: 600 }}>/mo</span></div>
                  <div style={{ marginBottom: 16, background: "var(--app-bg)", borderRadius: 10, padding: "8px 12px", display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12 }}>🔒</span>
                    <span style={{ fontSize: 11, color: T.muted, fontWeight: 700 }}>Secure Payment Gateway</span>
                  </div>
                  <button onClick={() => plan.isTrial ? startTrial(pkg) : startPayUPayment(plan)} disabled={!!payLoading} style={{ width: "100%", padding: "14px", borderRadius: 12, background: isCurrent ? "linear-gradient(135deg,var(--app-accent),var(--app-muted))" : "var(--app-bg)", color: isCurrent ? "#fff" : T.accent, border: isCurrent ? "none" : `2px solid ${T.accent}`, fontSize: 14, fontWeight: 800, cursor: payLoading ? "wait" : "pointer", transition: "0.2s" }}>
                    {isProcessing ? "Processing..." : isCurrent ? "🔄 Renew Plan" : (plan.isTrial ? "🎁 Get Started" : "⬆️ Switch to " + plan.name)}
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


