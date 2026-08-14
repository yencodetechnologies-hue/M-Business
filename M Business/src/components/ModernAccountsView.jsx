import React from "react";

const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };
  
  const formatCompact = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 2 }).format(val);
  };

export default function ModernAccountsView({ THEME, income = [], expenses = [] }) {
  const totalIncome = income.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const netBalance = totalIncome - totalExpenses;
  const denom = totalIncome + totalExpenses;
  const incomePct = denom > 0 ? Math.round((totalIncome / denom) * 100) : 0;
  const expensePct = denom > 0 ? Math.round((totalExpenses / denom) * 100) : 0;

  return (
    <div style={{ paddingBottom: 60, fontFamily: "'Inter', sans-serif" }}>
      {/* PAGE HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "var(--app-text)", letterSpacing: "-0.5px" }}>Accounts</h2>
          <div style={{ fontSize: 14, color: "var(--app-muted)", marginTop: 4 }}>Manage your business bank accounts and balances</div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button style={{ padding: "10px 16px", background: "var(--app-card)", border: "1px solid var(--app-border)", borderRadius: 12, fontWeight: 700, fontSize: 13, color: "var(--app-text)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 5px rgba(0,0,0,0.02)" }}>
            Date {new Date().toLocaleDateString('default', { month: 'short', year: 'numeric' })}
          </button>
          <button style={{ padding: "10px 16px", background: "linear-gradient(135deg, var(--app-accent), var(--app-accent2, var(--app-accent)))", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 13, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 12px rgba(var(--app-accent-rgb, 99, 102, 241), 0.3)" }}>
             Statement
          </button>
        </div>
      </div>

      {/* ACCOUNT CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginBottom: 32 }}>
        {/* PRIMARY */}
        <div style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", borderRadius: 24, padding: 24, color: "#fff", position: "relative", overflow: "hidden", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, position: "relative", zIndex: 1 }}>
            <div style={{ background: "rgba(255,255,255,0.1)", padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>Income</div>
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 600, marginBottom: 4 }}>Total Income</div>
            <div title={formatCurrency(totalIncome)} style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-1px" }}>{formatCompact(totalIncome)}</div>
          </div>
        </div>

        <div style={{ background: "linear-gradient(135deg, var(--app-accent), var(--app-accent2, var(--app-accent)))", borderRadius: 24, padding: 24, color: "#fff", position: "relative", overflow: "hidden", boxShadow: "0 10px 30px rgba(var(--app-accent-rgb, 99, 102, 241), 0.25)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, position: "relative", zIndex: 1 }}>
            <div style={{ background: "rgba(255,255,255,0.2)", padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>Expenses</div>
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 600, marginBottom: 4 }}>Total Expenses</div>
            <div title={formatCurrency(totalExpenses)} style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-1px" }}>{formatCompact(totalExpenses)}</div>
          </div>
        </div>

        <div style={{ background: "var(--app-card)", border: "1px solid var(--app-border)", borderRadius: 24, padding: 24, position: "relative", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
            <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800, letterSpacing: 0.5 }}>Net Balance</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: "var(--app-muted)", fontWeight: 600, marginBottom: 4 }}>Income minus expenses</div>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-1px", color: "var(--app-text)" }}>{formatCompact(netBalance)}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        
        {/* RECENT TRANSACTIONS */}
        <div style={{ background: "var(--app-card)", border: "1px solid var(--app-border)", borderRadius: 24, padding: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--app-text)" }}>Recent Transactions</h3>
            <button style={{ background: "none", border: "none", color: "var(--app-accent)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>View All</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[...income.map(i => ({ ...i, type: "income" })), ...expenses.map(e => ({ ...e, type: "expense" }))]
              .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
              .slice(0, 6)
              .map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px", borderRadius: 16, background: "var(--app-bg)", border: "1px solid var(--app-border)", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform="translateX(4px)"} onMouseLeave={e => e.currentTarget.style.transform="translateX(0)"}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: item.type === "income" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: item.type === "income" ? "#10b981" : "#ef4444" }}>
                    {item.type === "income" ? "" : ""}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--app-text)" }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "var(--app-muted)", fontWeight: 600, marginTop: 2 }}>{new Date(item.createdAt || item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {item.category}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: item.type === "income" ? "#10b981" : "var(--app-text)" }}>
                    {item.type === "income" ? "+" : "-"}{formatCurrency(item.amount)}
                  </div>
                </div>
              ))}
            {(income.length === 0 && expenses.length === 0) && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--app-muted)" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}></div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>No recent transactions</div>
              </div>
            )}
          </div>
        </div>

        {/* BALANCE OVERVIEW */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ background: "var(--app-card)", border: "1px solid var(--app-border)", borderRadius: 24, padding: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.02)" }}>
            <h3 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 800, color: "var(--app-text)" }}>Balance Overview</h3>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24, position: "relative" }}>
              <div style={{ width: 160, height: 160, borderRadius: "50%", background: denom > 0 ? `conic-gradient(var(--app-accent) 0% ${incomePct}%, #f59e0b ${incomePct}% 100%)` : "var(--app-border)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <div style={{ width: 120, height: 120, borderRadius: "50%", background: "var(--app-card)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--app-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Net</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "var(--app-text)" }}>{formatCurrency(netBalance)}</div>
                </div>
              </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, fontWeight: 600 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--app-accent)" }}></div><span style={{ color: "var(--app-muted)" }}>Income</span></div>
                <div style={{ color: "var(--app-text)", fontWeight: 800 }}>{incomePct}%</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, fontWeight: 600 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }}></div><span style={{ color: "var(--app-muted)" }}>Expenses</span></div>
                <div style={{ color: "var(--app-text)", fontWeight: 800 }}>{expensePct}%</div>
              </div>
            </div>
          </div>

          <div style={{ background: "linear-gradient(135deg, var(--app-accent), var(--app-accent2, var(--app-accent)))", borderRadius: 24, padding: 24, color: "#fff", boxShadow: "0 10px 30px rgba(var(--app-accent-rgb, 99, 102, 241), 0.25)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 800 }}>Need a Loan?</h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>Get pre-approved for business loans up to ₹10,00,000 instantly based on your account activity.</p>
            <button style={{ background: "#fff", color: "var(--app-accent)", border: "none", padding: "10px 20px", borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: "pointer", width: "100%" }}>Check Eligibility</button>
          </div>
        </div>

      </div>
    </div>
  );
}
