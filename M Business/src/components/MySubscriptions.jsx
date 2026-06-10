import { useState, useEffect, useCallback, useRef } from "react";
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


// ─── Plan Picker Modal (Choose Your Plan) ────────────────────────────────────
function PlanPickerModal({ subscription, payLoading, onClose, onSelectPlan, onStartTrial }) {
  const currentPlan = subscription?.planName;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:99990, background:"linear-gradient(135deg,#e0f7fa 0%,#e8f5e9 50%,#e3f2fd 100%)", overflowY:"auto", display:"flex", flexDirection:"column" }}>
      <style>{`
        @keyframes ppFadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .pp-card { transition: transform 0.22s, box-shadow 0.22s; cursor:default; }
        .pp-card:hover { transform: translateY(-6px) !important; box-shadow: 0 24px 48px rgba(0,150,136,0.13) !important; }
        .pp-btn { transition: all 0.18s; }
        .pp-btn:hover:not(:disabled) { filter: brightness(0.93); transform: translateY(-1px); }
      `}</style>

      {/* Close button */}
      <button onClick={onClose} style={{ position:"fixed", top:18, right:22, zIndex:100000, background:"rgba(0,150,136,0.12)", border:"none", color:"#00796b", width:38, height:38, borderRadius:"50%", fontSize:20, cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>✕</button>

      <div style={{ maxWidth:1060, width:"100%", margin:"0 auto", padding:"48px 20px 60px", animation:"ppFadeUp 0.38s ease" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:44 }}>
          <h2 style={{ fontSize:36, fontWeight:900, color:"#00897b", margin:"0 0 10px", letterSpacing:"-0.5px" }}>Choose Your Plan</h2>
          <p style={{ color:"#00796b", fontSize:15, margin:"0 0 6px", fontWeight:500 }}>Select the best plan for your business growth</p>
          <div style={{ fontSize:12, color:"#80cbc4", fontWeight:700, letterSpacing:0.5 }}>
            {subscription ? `Current Plan: ${currentPlan}` : "Management Suite - subadmin"}
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))", gap:28, alignItems:"stretch" }}>
          {PLANS.map((plan) => {
            const isCurrent = plan.name === currentPlan;
            const isProcessing = payLoading === plan.name;
            const isPopular = plan.popular && !isCurrent;

            return (
              <div key={plan.name} className="pp-card" style={{
                background:"#fff",
                borderRadius:20,
                padding:"36px 26px 28px",
                border: isPopular ? "2.5px solid #00897b" : isCurrent ? "2.5px solid #26a69a" : "1.5px solid #e0f2f1",
                boxShadow: isPopular ? "0 16px 48px rgba(0,137,123,0.16)" : "0 6px 24px rgba(0,0,0,0.05)",
                position:"relative",
                display:"flex",
                flexDirection:"column",
                transform: isPopular ? "scale(1.035)" : "scale(1)"
              }}>
                {/* MOST POPULAR badge */}
                {isPopular && (
                  <div style={{ position:"absolute", top:-1, right:-1, background:"#00897b", color:"#fff", padding:"7px 18px", borderRadius:"0 18px 0 14px", fontSize:11, fontWeight:900, textTransform:"uppercase", letterSpacing:1 }}>
                    Most Popular
                  </div>
                )}
                {/* CURRENT PLAN badge */}
                {isCurrent && (
                  <div style={{ position:"absolute", top:-1, right:-1, background:"#26a69a", color:"#fff", padding:"7px 18px", borderRadius:"0 18px 0 14px", fontSize:11, fontWeight:900, textTransform:"uppercase", letterSpacing:1 }}>
                    Current Plan
                  </div>
                )}

                {/* Icon */}
                <div style={{ fontSize:38, marginBottom:16 }}>{plan.icon}</div>

                {/* Name */}
                <h3 style={{ fontSize:24, fontWeight:900, color: isPopular ? "#00897b" : "#1e293b", margin:"0 0 16px" }}>{plan.name}</h3>

                {/* Price */}
                <div style={{ display:"flex", alignItems:"baseline", gap:3, marginBottom:20 }}>
                  <span style={{ fontSize:40, fontWeight:900, color:"#1e293b", letterSpacing:"-1px" }}>
                    {plan.price === 0 ? "₹0" : plan.price === null ? "Custom" : `₹${plan.price.toLocaleString("en-IN")}`}
                  </span>
                  {plan.price !== null && <span style={{ fontSize:14, color:"#94a3b8", fontWeight:600 }}> / month</span>}
                </div>

                {/* Features */}
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:11, marginBottom:28 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:9 }}>
                      <span style={{ color:"#00897b", fontSize:15, flexShrink:0, fontWeight:700 }}>✓</span>
                      <span style={{ fontSize:13.5, color:"#475569", fontWeight:500 }}>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <button
                  className="pp-btn"
                  disabled={isCurrent || !!payLoading}
                  onClick={() => plan.isTrial ? onStartTrial() : onSelectPlan(plan)}
                  style={{
                    width:"100%", padding:"14px", borderRadius:12, fontSize:15, fontWeight:800,
                    fontFamily:"inherit", border:"none",
                    cursor: isCurrent || payLoading ? "not-allowed" : "pointer",
                    background: isCurrent
                      ? "#e0f2f1"
                      : isPopular
                      ? "#00897b"
                      : plan.isTrial
                      ? "#e0f2f1"
                      : "#e0f2f1",
                    color: isCurrent
                      ? "#26a69a"
                      : isPopular
                      ? "#fff"
                      : plan.isTrial
                      ? "#00897b"
                      : "#00897b",
                    boxShadow: isPopular && !isCurrent ? "0 6px 18px rgba(0,137,123,0.3)" : "none"
                  }}
                >
                  {isProcessing ? "Processing..." : isCurrent ? "✓ Current Plan" : plan.btnLabel || "Get Started"}
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign:"center", marginTop:32, color:"#80cbc4", fontSize:13, fontWeight:600 }}>
          🔒 Secure payment · Cancel anytime · 24/7 support
        </div>
      </div>
    </div>
  );
}

// ─── Mock Payment Gateway ──────────────────────────────────────────────────────
function MockPaymentGateway({ plan, userEmail, userName, payLoading, onClose, onPay }) {
  const [method, setMethod] = useState("card");
  const [cardNum, setCardNum] = useState("");
  const [cardName, setCardName] = useState(userName || "");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [upi, setUpi] = useState("");
  const [bank, setBank] = useState("sbi");
  const loading = !!payLoading;

  const fmtCard = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExp  = (v) => v.replace(/\D/g, "").slice(0, 4).replace(/^(\d{2})(\d)/, "$1/$2");

  const canPay = method === "card"
    ? cardNum.replace(/\s/g,"").length === 16 && cardName && expiry.length === 5 && cvv.length >= 3
    : method === "upi"
    ? /^[\w.\-]+@[\w]+$/.test(upi)
    : true;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:999998, background:"rgba(10,10,30,0.75)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pgSpin { to { transform:rotate(360deg); } }
        .pg-input { width:100%; padding:12px 14px; border:1.5px solid #e2e8f0; borderRadius:10px; fontSize:14px; fontFamily:inherit; outline:none; transition:border 0.2s; background:#fafafa; }
        .pg-input:focus { border-color:#6366f1; background:#fff; }
        .pg-method { display:flex; alignItems:center; gap:10px; padding:12px 16px; border:2px solid #e2e8f0; borderRadius:12px; cursor:pointer; transition:all 0.2s; fontWeight:600; fontSize:13px; }
        .pg-method.active { border-color:#6366f1; background:#f5f3ff; color:#6366f1; }
        .pg-method:hover { border-color:#a5b4fc; }
      `}</style>

      <div style={{ background:"#fff", borderRadius:24, width:"100%", maxWidth:480, boxShadow:"0 30px 60px rgba(0,0,0,0.3)", animation:"slideUp 0.35s ease", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#6366f1,#4f46e5)", padding:"24px 28px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ color:"rgba(255,255,255,0.8)", fontSize:12, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>Secure Payment</div>
            <div style={{ color:"#fff", fontSize:22, fontWeight:900 }}>₹{plan.price?.toLocaleString("en-IN")}<span style={{ fontSize:13, fontWeight:600, opacity:0.8 }}>/month</span></div>
            <div style={{ color:"rgba(255,255,255,0.85)", fontSize:13, marginTop:2 }}>{plan.icon} {plan.name} Plan</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", color:"#fff", width:36, height:36, borderRadius:"50%", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit" }}>✕</button>
        </div>

        <div style={{ padding:"24px 28px" }}>
          {/* Payment methods */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:24 }}>
            {[
              { id:"card", icon:"💳", label:"Card" },
              { id:"upi",  icon:"📱", label:"UPI" },
              { id:"netbanking", icon:"🏦", label:"Net Banking" }
            ].map(m => (
              <div key={m.id} className={`pg-method${method===m.id?" active":""}`} onClick={() => setMethod(m.id)}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", border:`2px solid ${method===m.id?"#6366f1":"#e2e8f0"}`, borderRadius:12, cursor:"pointer", background:method===m.id?"#f5f3ff":"#fafafa", color:method===m.id?"#6366f1":"#64748b", fontWeight:700, fontSize:12, transition:"all 0.2s" }}>
                <span style={{ fontSize:18 }}>{m.icon}</span> {m.label}
              </div>
            ))}
          </div>

          {/* Card Fields */}
          {method === "card" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:"#475569", marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>Card Number</div>
                <input className="pg-input" placeholder="1234 5678 9012 3456" value={cardNum}
                  onChange={e => setCardNum(fmtCard(e.target.value))}
                  style={{ width:"100%", padding:"12px 14px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:15, fontFamily:"inherit", outline:"none", background:"#fafafa", letterSpacing:2 }} />
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:"#475569", marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>Cardholder Name</div>
                <input className="pg-input" placeholder="Name on card" value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  style={{ width:"100%", padding:"12px 14px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:14, fontFamily:"inherit", outline:"none", background:"#fafafa" }} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#475569", marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>Expiry</div>
                  <input className="pg-input" placeholder="MM/YY" value={expiry}
                    onChange={e => setExpiry(fmtExp(e.target.value))}
                    style={{ width:"100%", padding:"12px 14px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:14, fontFamily:"inherit", outline:"none", background:"#fafafa" }} />
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#475569", marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>CVV</div>
                  <input className="pg-input" placeholder="•••" type="password" maxLength={4} value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g,"").slice(0,4))}
                    style={{ width:"100%", padding:"12px 14px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:14, fontFamily:"inherit", outline:"none", background:"#fafafa" }} />
                </div>
              </div>
            </div>
          )}

          {/* UPI */}
          {method === "upi" && (
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#475569", marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>UPI ID</div>
              <input placeholder="yourname@upi" value={upi} onChange={e => setUpi(e.target.value)}
                style={{ width:"100%", padding:"12px 14px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:14, fontFamily:"inherit", outline:"none", background:"#fafafa" }} />
              <div style={{ marginTop:8, fontSize:12, color:"#94a3b8" }}>e.g. 9876543210@paytm, name@ybl</div>
            </div>
          )}

          {/* Net Banking */}
          {method === "netbanking" && (
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#475569", marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}>Select Bank</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[{id:"sbi",label:"State Bank of India"},{id:"hdfc",label:"HDFC Bank"},{id:"icici",label:"ICICI Bank"},{id:"axis",label:"Axis Bank"},{id:"kotak",label:"Kotak Bank"},{id:"other",label:"Other Bank"}].map(b => (
                  <div key={b.id} onClick={() => setBank(b.id)}
                    style={{ padding:"10px 14px", border:`2px solid ${bank===b.id?"#6366f1":"#e2e8f0"}`, borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:700, color:bank===b.id?"#6366f1":"#475569", background:bank===b.id?"#f5f3ff":"#fafafa", transition:"all 0.15s" }}>
                    {b.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div style={{ marginTop:20, background:"#f8fafc", borderRadius:12, padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", border:"1px solid #e2e8f0" }}>
            <div style={{ fontSize:13, color:"#64748b", fontWeight:600 }}>Total to pay</div>
            <div style={{ fontSize:20, fontWeight:900, color:"#1e293b" }}>₹{plan.price?.toLocaleString("en-IN")}</div>
          </div>

          {/* Pay Button */}
          <button
            onClick={onPay}
            disabled={!canPay || loading}
            style={{ marginTop:16, width:"100%", padding:"15px", background: canPay && !loading ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "#e2e8f0", color: canPay && !loading ? "#fff" : "#94a3b8", border:"none", borderRadius:12, fontSize:16, fontWeight:800, cursor: canPay && !loading ? "pointer" : "not-allowed", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:10, transition:"all 0.2s", boxShadow: canPay && !loading ? "0 8px 20px rgba(99,102,241,0.35)" : "none" }}
          >
            {loading
              ? <><div style={{ width:18, height:18, border:"2.5px solid #fff", borderTopColor:"transparent", borderRadius:"50%", animation:"pgSpin 0.8s linear infinite" }} /> Processing...</>
              : <>🔒 Pay ₹{plan.price?.toLocaleString("en-IN")} Now</>
            }
          </button>

          {/* Security badges */}
          <div style={{ marginTop:16, display:"flex", justifyContent:"center", gap:20, color:"#94a3b8", fontSize:11, fontWeight:600 }}>
            <span>🔒 256-bit SSL</span>
            <span>🛡️ PCI DSS</span>
            <span>✅ RBI Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MySubscriptions({ user, onSubscriptionSuccess, initialTab = "overview", preloadedSubscription = null, onTabChange }) {
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
    if (initialTab === "upgrade") setShowPlanPicker(true);
  }, [initialTab]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (onTabChange) onTabChange();
  };
  const [toast, setToast] = useState("");
  const [mockGatewayOpen, setMockGatewayOpen] = useState(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  const [mockGatewayPlan, setMockGatewayPlan] = useState(null);
  const [showPlanPicker, setShowPlanPicker] = useState(initialTab === "upgrade");
  const [assignedPackages, setAssignedPackages] = useState([]);
  const payuInFlight = useRef(false); // Guard against duplicate PayU API calls

  // Check URL for PayU success/failure redirect (called after PayU redirects browser back)
  useEffect(() => {
    const checkPaymentStatus = async () => {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get("payment");
      if (!paymentStatus) return;

      // Clean up URL immediately to prevent re-triggering
      window.history.replaceState({}, document.title, window.location.pathname);

      if (paymentStatus === "success") {
        const planName = params.get("plan");
        const subId = params.get("subId");
        const txnid = params.get("txnid");

        // Activate the pending subscription in backend
        try {
          if (subId) {
            await axios.post(`${BASE_URL}/api/subscriptions/activate-pending`, {
              subscriptionId: subId,
              txnid
            });
          }
        } catch (e) {
          console.log("Activation call:", e.message);
        }

        // Refresh data and show success popup
        await fetchData();
        if (onSubscriptionSuccess) onSubscriptionSuccess();
        setPaymentSuccessData({ name: planName || "Subscription" });
        showToast("🎉 Payment Successful! Your plan is active.");

      } else if (paymentStatus === "failed") {
        showToast("❌ Payment failed. Please try again.");
      }
    };

    checkPaymentStatus();
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
          handleTabChange("upgrade");
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

  // ── Initiate PayU Payment ─────────────────────────────────────────────
  const startPayUPayment = async (plan) => {
    if (plan.isTrial) { startTrial(plan); return; }
    if (!plan.price) { window.open(`mailto:billing@${(user?.companyName || "business").toLowerCase().replace(/\s+/g, "")}.com`); return; }
    
    // Prevent duplicate API calls from rapid clicking
    if (payuInFlight.current || payLoading) return;
    payuInFlight.current = true;
    setPayLoading(plan.name);
    try {
      // Get PayU parameters from backend
      const res = await axios.post(`${BASE_URL}/api/payments/payu/init`, {
        userId,
        userEmail,
        userName,
        plan
      });

      if (res.data.success) {
        // Create an invisible form and submit it to PayU
        const payuData = res.data;
        const form = document.createElement("form");
        form.method = "POST";
        form.action = payuData.env === "prod" ? "https://secure.payu.in/_payment" : "https://test.payu.in/_payment";
        form.style.display = "none";

        const fields = {
          key: payuData.key,
          txnid: payuData.txnid,
          amount: payuData.amount,
          productinfo: payuData.productinfo,
          firstname: payuData.firstname,
          email: payuData.email,
          phone: payuData.phone,
          hash: payuData.hash,
          surl: payuData.surl,
          furl: payuData.furl
        };

        for (const [key, value] of Object.entries(fields)) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
      } else {
        throw new Error(res.data.error || "Failed to initialize PayU payment");
      }
    } catch (err) {
      console.error("PayU init error:", err);
      showToast("❌ Could not initialize payment. Please try again.");
      setPayLoading(null);
      payuInFlight.current = false; // Release the guard on error
    }
  };

  // ── Complete mock payment → activate subscription ─────────────────────────
  const completeMockPayment = async (plan) => {
    try {
      setPayLoading(plan.name);
      // Try PayU init first, fallback to direct subscription activation
      let activated = false;
      try {
        const res = await axios.post(`${BASE_URL}/api/subscriptions/create`, {
          userId, userEmail, userName,
          planName: plan.name,
          planPrice: plan.price,
          billingCycle: "monthly",
          paymentMethod: "card",
          duration: plan.duration || 30
        });
        if (res.data.success) activated = true;
      } catch (e) {
        // fallback: start-trial style
        const res2 = await axios.post(`${BASE_URL}/api/subscriptions/start-trial`, {
          userId, userEmail, userName,
          planName: plan.name,
          planPrice: plan.price,
          clientLimit: plan.clientLimit,
          employeeLimit: plan.employeeLimit,
          managerLimit: plan.managerLimit,
          features: plan.features
        });
        if (res2.data.success) activated = true;
      }
      setMockGatewayPlan(null);
      setPaymentSuccessData({ name: plan.name, price: plan.price });
      if (activated) { await fetchData(); if (onSubscriptionSuccess) onSubscriptionSuccess(); }
    } catch (err) {
      showToast("❌ " + (err.response?.data?.error || err.message || "Payment failed"));
    } finally {
      setPayLoading(null);
    }
  };

  // ── Plan Picker (Choose Your Plan overlay) ────────────────────────────────────
  if (showPlanPicker) {
    return (
      <PlanPickerModal
        subscription={subscription}
        payLoading={payLoading}
        onClose={() => { setShowPlanPicker(false); if (onTabChange) onTabChange(); }}
        onSelectPlan={(plan) => { setShowPlanPicker(false); startPayUPayment(plan); }}
        onStartTrial={() => startTrial()}
      />
    );
  }

  // ── Success UI ───────────────────────────────────────────────────────────────
  if (paymentSuccessData) {
    console.log("Showing payment success popup for:", paymentSuccessData);
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <style>{`@keyframes scaleIn { 0% { transform: scale(0); } 60% { transform: scale(1.2); } 100% { transform: scale(1); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ background: "#fff", borderRadius: 24, padding: 48, maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", animation: "fadeIn 0.5s ease", position: "relative" }}>
          <div style={{ width: 100, height: 100, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 48, marginBottom: 28, boxShadow: "0 10px 30px rgba(16,185,129,0.3)", animation: "scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)", margin: "0 auto 28px" }}>
            ✓
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: "#1e293b", margin: "0 0 16px" }}>Payment Successful! 🎉</h2>
          <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.6, maxWidth: 380, margin: "0 auto 32px" }}>
            Your <strong>{paymentSuccessData.name}</strong> plan is now active. Your dashboard is ready!
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#10b981", fontSize: 14, fontWeight: 700, background: "#ecfdf5", padding: "12px 24px", borderRadius: 12 }}>
              <div style={{ width: 16, height: 16, border: "2px solid #10b981", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              Activating your subscription...
            </div>
            <button 
              onClick={() => {
                console.log("Go to Dashboard clicked");
                setPaymentSuccessData(null);
                if (onSubscriptionSuccess) onSubscriptionSuccess();
                else window.location.href = "/";
              }}
              style={{ 
                width: "100%", 
                padding: "14px 28px", 
                borderRadius: 12, 
                fontSize: 15, 
                fontWeight: 800, 
                cursor: "pointer", 
                background: "linear-gradient(135deg, #10b981, #059669)", 
                color: "#fff", 
                border: "none", 
                fontFamily: "inherit",
                boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              Login to dashboard
            </button>
            </div>
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
            <button onClick={() => handleTabChange("upgrade")} style={{ display: "inline-block", background: "linear-gradient(135deg,var(--app-accent),var(--app-accent))", color: "#fff", textDecoration: "none", padding: "12px 24px", borderRadius: 10, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
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
          <div style={{ background: "var(--teal)", borderRadius: 20, padding: "32px 40px", color: "#fff", display: "flex", justifyContent: "space-between", position: "relative", overflow: "hidden", marginBottom: 10 }}>
  <div style={{ zIndex: 1, maxWidth: "60%" }}>
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.2)", padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800, letterSpacing: 0.5, marginBottom: 16 }}>
      <i className="ti ti-link"></i> CURRENT PLAN
    </div>
    <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 12px" }}>{subscription.planName} Plan</h1>
    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", margin: "0 0 24px", lineHeight: 1.6 }}>
      You're on the {subscription.planName} plan with access to core business features. Upgrade to Pro or Business for more companies, employees, and advanced analytics.
    </p>
    
    <div style={{ display: "flex", gap: 32 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{subscription.clientCount || 0} <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>/ {subscription.clientLimit || "∞"}</span></div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, marginTop: 4, color: "rgba(255,255,255,0.8)" }}>COMPANIES</div>
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{subscription.employeeCount || 0} <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>/ {subscription.employeeLimit || "∞"}</span></div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, marginTop: 4, color: "rgba(255,255,255,0.8)" }}>EMPLOYEES</div>
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{subscription.projectCount || 0}</div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, marginTop: 4, color: "rgba(255,255,255,0.8)" }}>PROJECTS</div>
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{subscription.invoiceCount || 0}</div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, marginTop: 4, color: "rgba(255,255,255,0.8)" }}>INVOICES</div>
      </div>
    </div>
  </div>
  
  <div style={{ zIndex: 1, textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center" }}>
    <div style={{ fontSize: 42, fontWeight: 900, marginBottom: 4, letterSpacing: "-1px" }}>₹{subscription.planPrice?.toLocaleString("en-IN") || "0"}</div>
    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600, marginBottom: 24 }}>per {subscription.billingCycle || "month"}</div>
    <button onClick={() => setShowPlanPicker(true)} style={{ background: "#fff", color: "var(--teal)", border: "none", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}>
      <i className="ti ti-arrow-up"></i> Upgrade Now
    </button>
    {daysLeft !== null && (
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 600, marginTop: 12 }}>
        Renews {formatDate(subscription.endDate)}
      </div>
    )}
  </div>

  <div style={{ position: "absolute", right: "-5%", top: "-20%", width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.1)", zIndex: 0 }} />
  <div style={{ position: "absolute", right: "15%", bottom: "-40%", width: 250, height: 250, borderRadius: "50%", background: "rgba(255,255,255,0.05)", zIndex: 0 }} />
</div>

<h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", margin: "10px 0 0" }}>Plan Usage</h3>

<div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
  {[
    { icon: "ti-building", label: "COMPANY NAMES", count: subscription.clientCount || 0, limit: subscription.clientLimit || 5, color: "var(--red)" },
    { icon: "ti-users", label: "EMPLOYEES", count: subscription.employeeCount || 0, limit: subscription.employeeLimit || 20, color: "var(--green)" },
    { icon: "ti-user-star", label: "MANAGERS", count: subscription.managerCount || 0, limit: subscription.managerLimit || 1, color: "var(--amber)" },
    { icon: "ti-briefcase", label: "PROJECTS", count: subscription.projectCount || 0, limit: 10, color: "var(--teal)" },
    { icon: "ti-file-invoice", label: "INVOICES", count: subscription.invoiceCount || 0, limit: 10, color: "var(--blue)" },
    { icon: "ti-database", label: "STORAGE", count: "2.2", limit: 10, unit: "GB", color: "var(--purple)" },
  ].map((stat, i) => {
    const numCount = typeof stat.count === 'string' ? parseFloat(stat.count) : stat.count;
    const pct = stat.limit === "Unlimited" ? 0 : Math.min(100, Math.round((numCount / stat.limit) * 100));
    const isOver = pct >= 100;
    const remaining = stat.limit === "Unlimited" ? "Unlimited" : Math.max(0, stat.limit - numCount);
    
    return (
      <div key={i} style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1.5px solid var(--border)", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${stat.color}15`, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
            <i className={`ti ${stat.icon}`}></i>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: stat.color }}>{pct}%</div>
        </div>
        
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", letterSpacing: 0.5, marginBottom: 4 }}>{stat.label}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text)" }}>{stat.count} {stat.unit || ""}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)" }}>/ {stat.limit} {stat.unit ? "limit" : "limit"}</div>
        </div>
        
        <div style={{ height: 6, background: "var(--bg)", borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
          <div style={{ height: "100%", background: isOver ? "var(--red)" : stat.color, width: `${pct}%`, borderRadius: 3 }} />
        </div>
        
        <div style={{ fontSize: 11, fontWeight: 600, color: isOver ? "var(--red)" : stat.color }}>
          {isOver ? (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><i className="ti ti-alert-circle"></i> Over limit — upgrade plan</span>
          ) : (
            <span>{remaining} {stat.unit ? "GB" : "slots"} remaining</span>
          )}
        </div>
      </div>
    );
  })}
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
                <button className="panel-action" onClick={() => handleTabChange(activeTab === "payments" ? "overview" : "payments")}>
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
