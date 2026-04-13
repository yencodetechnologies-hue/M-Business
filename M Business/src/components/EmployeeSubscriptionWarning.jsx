import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

const T = { primary: "#3b0764", sidebar: "#1e0a3c", accent: "#9333ea", bg: "#f5f3ff", card: "#FFFFFF", text: "#1e0a3c", muted: "#7c3aed", border: "#ede9fe" };

function Badge({ label }) { 
  const c = label === "expired" ? "#EF4444" : label === "warning" ? "#F59E0B" : "#22C55E";
  return <span style={{ background: `${c}18`, color: c, border: `1px solid ${c}33`, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{label}</span>; 
}

export default function EmployeeSubscriptionWarning({ user }) {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const id = user?._id || user?.id;
        if (!id) return;
        
        const res = await axios.get(`${BASE_URL}/api/subscriptions/employee-status/${id}`);
        setSubscriptionStatus(res.data);
      } catch (err) {
        console.error("Failed to fetch subscription status:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [user]);

  if (loading) {
    return (
      <div style={{ 
        background: "#f8fafc", 
        border: "1px solid #e2e8f0", 
        borderRadius: 12, 
        padding: "16px 20px", 
        marginBottom: 16 
      }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>Loading subscription status...</div>
      </div>
    );
  }

  if (!subscriptionStatus?.hasSubscription) {
    return (
      <div style={{ 
        background: "linear-gradient(135deg,#fef2f2,#fee2e2)", 
        border: "2px solid #fecaca", 
        borderRadius: 12, 
        padding: "16px 20px", 
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 12
      }}>
        <div style={{ fontSize: 24 }}>🚫</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#991b1b", marginBottom: 4 }}>
            No Active Subscription
          </div>
          <div style={{ fontSize: 13, color: "#7f1d1d" }}>
            Please contact your administrator to activate a subscription.
          </div>
        </div>
        <Badge label="expired" />
      </div>
    );
  }

  const { subscription, notification } = subscriptionStatus;

  if (!notification) {
    return null; // No warning needed
  }

  const getWarningStyle = () => {
    switch (notification.type) {
      case "renewal":
        return {
          background: "linear-gradient(135deg,#fef3c7,#fde68a)",
          border: "2px solid #f59e0b",
          icon: "⚠️",
          titleColor: "#92400e",
          textColor: "#78350f"
        };
      case "expired":
        return {
          background: "linear-gradient(135deg,#fef2f2,#fee2e2)",
          border: "2px solid #ef4444",
          icon: "🚫",
          titleColor: "#991b1b",
          textColor: "#7f1d1d"
        };
      case "hidden":
        return {
          background: "linear-gradient(135deg,#1e293b,#334155)",
          border: "2px solid #475569",
          icon: "🔒",
          titleColor: "#f1f5f9",
          textColor: "#cbd5e1"
        };
      default:
        return {
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          icon: "ℹ️",
          titleColor: "#1e293b",
          textColor: "#64748b"
        };
    }
  };

  const style = getWarningStyle();

  return (
    <div style={{ 
      background: style.background, 
      border: style.border, 
      borderRadius: 12, 
      padding: "16px 20px", 
      marginBottom: 16,
      display: "flex",
      alignItems: "center",
      gap: 12
    }}>
      <div style={{ fontSize: 24 }}>{style.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: style.titleColor, marginBottom: 4 }}>
          {notification.type === "renewal" && "Subscription Renewal Required"}
          {notification.type === "expired" && "Subscription Expired"}
          {notification.type === "hidden" && "Access Restricted"}
        </div>
        <div style={{ fontSize: 13, color: style.textColor }}>
          {notification.message}
        </div>
        {notification.type === "renewal" && (
          <div style={{ fontSize: 12, color: style.textColor, marginTop: 4 }}>
            Days remaining: {notification.daysLeft}
          </div>
        )}
        {notification.type === "expired" && (
          <div style={{ fontSize: 12, color: style.textColor, marginTop: 4 }}>
            Days since expiry: {notification.daysSinceExpiry}
          </div>
        )}
      </div>
      <Badge label={notification.type === "renewal" ? "warning" : notification.type} />
    </div>
  );
}
