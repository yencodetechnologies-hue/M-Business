with open('C:\\M Business\\M Business\\src\\components\\MySubscriptions.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# We will replace the "Has Subscription" block from const daysLeft = ... until {activeTab === "upgrade" &&
# Actually, I'll just replace the eturn ( block for the Has Subscription part.

new_subscription_ui = """
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
              <button onClick={() => setActiveTab("upgrade")} style={{ background: "#fff", color: "var(--teal)", border: "none", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                <i className="ti ti-arrow-up"></i> Upgrade Now
              </button>
              {daysLeft !== null && (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 600, marginTop: 12 }}>
                  Renews {formatDate(subscription.endDate)}
                </div>
              )}
            </div>
            
            {/* Background design elements */}
            <div style={{ position: "absolute", right: "-5%", top: "-20%", width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.1)", zIndex: 0 }} />
            <div style={{ position: "absolute", right: "15%", bottom: "-40%", width: 250, height: 250, borderRadius: "50%", background: "rgba(255,255,255,0.05)", zIndex: 0 }} />
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", margin: "10px 0 0" }}>Plan Usage</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {/* Usage Cards */}
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
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: ${stat.color}15, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                      <i className={	i }></i>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: stat.color }}>{pct}%</div>
                  </div>
                  
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", letterSpacing: 0.5, marginBottom: 4 }}>{stat.label}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text)" }}>{stat.count} {stat.unit || ""}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)" }}>/ {stat.limit} {stat.unit ? "limit" : "limit"}</div>
                  </div>
                  
                  <div style={{ height: 6, background: "var(--bg)", borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
                    <div style={{ height: "100%", background: isOver ? "var(--red)" : stat.color, width: ${pct}%, borderRadius: 3 }} />
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
"""

# Replace in content using regex
content = re.sub(r'<div className="plan-hero">.*?</div>\s*</div>\s*</div>', new_subscription_ui, content, flags=re.DOTALL)

with open('C:\\M Business\\M Business\\src\\components\\MySubscriptions.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated MySubscriptions.jsx")
