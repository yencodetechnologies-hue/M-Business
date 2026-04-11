import { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

const T = {
  primary: "#3b0764",
  sidebar: "#1e0a3c",
  accent: "#9333ea",
  bg: "#f5f3ff",
  card: "#FFFFFF",
  text: "#1e0a3c",
  muted: "#7c3aed",
  border: "#ede9fe",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444"
};

function Badge({ label, color }) {
  const c = color || T.muted;
  return (
    <span style={{
      background: `${c}18`,
      color: c,
      border: `1px solid ${c}33`,
      padding: "4px 12px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      textTransform: "uppercase"
    }}>
      {label}
    </span>
  );
}

function Card({ title, children, action, icon }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      padding: 22,
      boxShadow: "0 4px 24px rgba(147,51,234,0.08)",
      border: "1px solid #ede9fe"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        flexWrap: "wrap",
        gap: 8
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, icon }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 12px",
      background: "#faf5ff",
      borderRadius: 9,
      border: "1px solid #ede9fe",
      marginBottom: 7
    }}>
      {icon && (
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "rgba(147,51,234,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          flexShrink: 0
        }}>
          {icon}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 10,
          color: "#7c3aed",
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: "uppercase"
        }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e0a3c", marginTop: 1 }}>{value}</div>
      </div>
    </div>
  );
}

export default function MySubscriptions({ user }) {
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [viewPayment, setViewPayment] = useState(null);

  const userId = user?._id || user?.id;
  const userEmail = user?.email;

  useEffect(() => {
    if (userId) {
      fetchSubscriptionData();
    }
  }, [userId]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);

      // Fetch subscription from user endpoint
      const subRes = await axios.get(`${BASE_URL}/api/users/${userId}/subscription`);
      if (subRes.data.hasSubscription) {
        setSubscription(subRes.data.subscription);
      }

      // Fetch payment history from user endpoint
      const payRes = await axios.get(`${BASE_URL}/api/users/${userId}/payments`);
      const allPayments = payRes.data || [];
      setPayments(allPayments);

      // Filter invoices and quotations from payments
      setInvoices(allPayments.filter(p => p.invoiceNo));
      setQuotations(allPayments.filter(p => p.quotationNo));

    } catch (err) {
      setError("Failed to load subscription data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    try {
      setLoading(true);
      await axios.post(`${BASE_URL}/api/subscriptions/seed/${userId}`, {
        email: userEmail,
        name: user?.name || user?.clientName || "User"
      });
      await fetchSubscriptionData();
    } catch (err) {
      console.error("Failed to seed data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const formatCurrency = (amount, currency = "INR") => {
    if (amount === undefined || amount === null) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: T.success,
      completed: T.success,
      paid: T.success,
      inactive: T.muted,
      cancelled: T.danger,
      expired: T.danger,
      pending: T.warning,
      failed: T.danger,
      refunded: T.warning
    };
    return colors[status?.toLowerCase()] || T.muted;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 60 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div style={{ color: T.muted, fontSize: 14 }}>Loading subscription data...</div>
        </div>
      </div>
    );
  }

  // No subscription state
  if (!subscription) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card title="My Subscriptions" icon="💳">
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <h3 style={{ margin: "0 0 8px", color: T.text, fontSize: 18 }}>No Active Subscription</h3>
            <p style={{ margin: "0 0 20px", color: T.muted, fontSize: 13 }}>
              You don't have any active subscription yet. Contact M Business to get started.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={handleSeedData}
                style={{
                  background: `linear-gradient(135deg, ${T.accent}, #a855f7)`,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 20px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                🔄 Load Demo Data
              </button>
            </div>
          </div>
        </Card>

        <Card title="Contact M Business" icon="📞">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <InfoRow label="Company" value="M Business Pvt Ltd" icon="🏢" />
            <InfoRow label="Email" value="billing@mbusiness.com" icon="📧" />
            <InfoRow label="Phone" value="+91-9876543210" icon="📱" />
            <InfoRow label="Address" value="Chennai, Tamil Nadu, India" icon="📍" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <div style={{
          background: "linear-gradient(135deg, #9333ea, #a855f7)",
          borderRadius: 14,
          padding: "18px 16px",
          color: "#fff"
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, opacity: 0.9, marginBottom: 4 }}>
            CURRENT PLAN
          </div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{subscription.planName}</div>
          <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
            {formatCurrency(subscription.planPrice)}/{subscription.billingCycle}
          </div>
        </div>

        <div style={{
          background: subscription.isFullyPaid
            ? "linear-gradient(135deg, #22C55E, #16a34a)"
            : "linear-gradient(135deg, #F59E0B, #d97706)",
          borderRadius: 14,
          padding: "18px 16px",
          color: "#fff"
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, opacity: 0.9, marginBottom: 4 }}>
            PAYMENT STATUS
          </div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            {subscription.isFullyPaid ? "✅ Fully Paid" : "⏳ Pending"}
          </div>
          <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
            {subscription.isFullyPaid ? "All payments up to date" : "Payment required"}
          </div>
        </div>

        <div style={{
          background: subscription.status === "active"
            ? "linear-gradient(135deg, #3b82f6, #2563eb)"
            : "linear-gradient(135deg, #6b7280, #4b5563)",
          borderRadius: 14,
          padding: "18px 16px",
          color: "#fff"
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, opacity: 0.9, marginBottom: 4 }}>
            SUBSCRIPTION STATUS
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, textTransform: "uppercase" }}>
            {subscription.status}
          </div>
          <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
            Valid till {formatDate(subscription.endDate)}
          </div>
        </div>

        <div style={{
          background: "linear-gradient(135deg, #1e0a3c, #3b0764)",
          borderRadius: 14,
          padding: "18px 16px",
          color: "#fff"
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, opacity: 0.9, marginBottom: 4 }}>
            NEXT BILLING
          </div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            {formatDate(subscription.nextBillingDate)}
          </div>
          <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
            {subscription.paymentMethod === "card" ? "💳 Auto-renewal enabled" : "⚠️ Manual payment required"}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "2px solid #ede9fe", paddingBottom: 2 }}>
        {[
          { key: "overview", label: "Overview", icon: "📋" },
          { key: "payments", label: "Payment History", icon: "💰" },
          { key: "invoices", label: "Invoices", icon: "🧾" },
          { key: "quotations", label: "Quotations", icon: "📄" }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "10px 16px",
              background: activeTab === tab.key ? "#f5f3ff" : "transparent",
              border: "none",
              borderBottom: activeTab === tab.key ? "2px solid #9333ea" : "2px solid transparent",
              borderRadius: "8px 8px 0 0",
              color: activeTab === tab.key ? T.accent : T.muted,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: -2
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card title="Current Plan Details" icon="⭐">
            <InfoRow label="Plan Name" value={subscription.planName} icon="📦" />
            <InfoRow label="Price" value={formatCurrency(subscription.planPrice) + "/" + subscription.billingCycle} icon="💵" />
            <InfoRow label="Status" value={subscription.status} icon="🔵" />
            <InfoRow label="Start Date" value={formatDate(subscription.startDate)} icon="📅" />
            <InfoRow label="End Date" value={formatDate(subscription.endDate)} icon="⏰" />
            <InfoRow label="Next Billing" value={formatDate(subscription.nextBillingDate)} icon="📆" />
            <InfoRow label="Payment Method" value={subscription.paymentMethod} icon="💳" />
          </Card>

          <Card title="Plan Features" icon="✨">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {subscription.features?.map((feature, idx) => (
                <div key={idx} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: "#f0fdf4",
                  borderRadius: 9,
                  border: "1px solid #bbf7d0"
                }}>
                  <span style={{ color: T.success, fontSize: 14 }}>✓</span>
                  <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{feature}</span>
                </div>
              )) || (
                  <div style={{ color: T.muted, fontSize: 13, padding: 20, textAlign: "center" }}>
                    No features listed for this plan
                  </div>
                )}
            </div>
          </Card>

          <Card title="Provider Details" icon="🏢" style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <InfoRow label="Company" value={subscription.providerCompany} icon="🏢" />
              <InfoRow label="Email" value={subscription.providerEmail} icon="📧" />
              <InfoRow label="Phone" value={subscription.providerPhone} icon="📱" />
              <InfoRow label="GST Number" value={subscription.providerGst || "GSTIN-33AABCM1234Z1Z1"} icon="📋" />
            </div>
          </Card>
        </div>
      )}

      {activeTab === "payments" && (
        <Card title={`Payment History (${payments.length})`} icon="💰">
          {payments.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: T.muted }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>💳</div>
              <p>No payment history found</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "linear-gradient(90deg, #f5f3ff, #faf5ff)" }}>
                    {["Payment ID", "Date", "Description", "Amount", "Method", "Status", "Actions"].map(h => (
                      <th key={h} style={{
                        padding: "12px 14px",
                        textAlign: "left",
                        color: "#7c3aed",
                        fontWeight: 700,
                        fontSize: 11,
                        borderBottom: "2px solid #ede9fe",
                        whiteSpace: "nowrap"
                      }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, idx) => (
                    <tr key={payment._id || idx} style={{ borderBottom: "1px solid #f3f0ff" }}>
                      <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 11, color: T.muted }}>
                        {payment.paymentId}
                      </td>
                      <td style={{ padding: "12px 14px", color: T.text, fontSize: 12 }}>
                        {formatDate(payment.paymentDate)}
                      </td>
                      <td style={{ padding: "12px 14px", color: T.text }}>
                        {payment.description}
                      </td>
                      <td style={{ padding: "12px 14px", color: T.accent, fontWeight: 700 }}>
                        {formatCurrency(payment.amount, payment.currency)}
                      </td>
                      <td style={{ padding: "12px 14px", color: T.muted, fontSize: 12, textTransform: "uppercase" }}>
                        {payment.paymentMethod}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <Badge label={payment.status} color={getStatusColor(payment.status)} />
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <button
                          onClick={() => setViewPayment(payment)}
                          style={{
                            background: "rgba(147,51,234,0.1)",
                            border: "1px solid rgba(147,51,234,0.3)",
                            borderRadius: 7,
                            padding: "5px 12px",
                            fontSize: 12,
                            color: T.accent,
                            cursor: "pointer",
                            fontWeight: 600
                          }}
                        >
                          👁 View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === "invoices" && (
        <Card title={`Invoices (${invoices.length})`} icon="🧾">
          {invoices.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: T.muted }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
              <p>No invoices found</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {invoices.map((inv, idx) => (
                <div key={inv._id || idx} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: "#faf5ff",
                  borderRadius: 12,
                  border: "1px solid #ede9fe"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #9333ea, #a855f7)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20
                    }}>🧾</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                        Invoice #{inv.invoiceNo}
                      </div>
                      <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                        {inv.description} • {formatDate(inv.paymentDate)}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: T.accent }}>
                      {formatCurrency(inv.amount, inv.currency)}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <Badge label={inv.status} color={getStatusColor(inv.status)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "quotations" && (
        <Card title={`Quotations (${quotations.length})`} icon="📄">
          {quotations.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: T.muted }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <p>No quotations found</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {quotations.map((quo, idx) => (
                <div key={quo._id || idx} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: "#faf5ff",
                  borderRadius: 12,
                  border: "1px solid #ede9fe"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #f59e0b, #d97706)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20
                    }}>📄</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                        Quotation #{quo.quotationNo}
                      </div>
                      <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                        {quo.description} • {formatDate(quo.paymentDate)}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#f59e0b" }}>
                      {formatCurrency(quo.amount, quo.currency)}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <Badge label={quo.status} color={getStatusColor(quo.status)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* View Payment Modal */}
      {viewPayment && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(59,7,100,0.55)",
          backdropFilter: "blur(8px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 20,
            width: "100%",
            maxWidth: 500,
            maxHeight: "90vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 32px 80px rgba(147,51,234,0.25)"
          }}>
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid #ede9fe",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "linear-gradient(90deg, #f5f3ff, #faf5ff)"
            }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.text }}>
                Payment Details
              </h2>
              <button
                onClick={() => setViewPayment(null)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#7c3aed" }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: 24, overflowY: "auto" }}>
              <div style={{
                textAlign: "center",
                padding: 24,
                background: getStatusColor(viewPayment.status) + "15",
                borderRadius: 16,
                marginBottom: 20,
                border: `1px solid ${getStatusColor(viewPayment.status)}30`
              }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>
                  {viewPayment.status === "completed" ? "✅" : viewPayment.status === "pending" ? "⏳" : "❌"}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: getStatusColor(viewPayment.status) }}>
                  {formatCurrency(viewPayment.amount, viewPayment.currency)}
                </div>
                <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
                  Payment {viewPayment.status}
                </div>
              </div>

              <InfoRow label="Payment ID" value={viewPayment.paymentId} icon="🆔" />
              <InfoRow label="Description" value={viewPayment.description} icon="📝" />
              <InfoRow label="Date" value={formatDate(viewPayment.paymentDate)} icon="📅" />
              <InfoRow label="Payment Method" value={viewPayment.paymentMethod} icon="💳" />
              {viewPayment.invoiceNo && <InfoRow label="Invoice Number" value={viewPayment.invoiceNo} icon="🧾" />}
              {viewPayment.quotationNo && <InfoRow label="Quotation Number" value={viewPayment.quotationNo} icon="📄" />}

              <div style={{ marginTop: 20, padding: 16, background: "#faf5ff", borderRadius: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 8, textTransform: "uppercase" }}>
                  Provider Information
                </div>
                <InfoRow label="Company" value={viewPayment.providerCompany} icon="🏢" />
                <InfoRow label="GST Number" value={viewPayment.providerGst} icon="📋" />
                <InfoRow label="Address" value={viewPayment.providerAddress} icon="📍" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
