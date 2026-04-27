import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

export default function EmployeeSubscriptionWarning({ user }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        // Use companyId if available (for employees under a subadmin),
        // otherwise fall back to user's own ID
        const lookupId = user?.companyId || user?.company || user?._id || user?.id;
        if (!lookupId) return;
        const res = await axios.get(`${BASE_URL}/api/subscriptions/employee-status/${lookupId}`);
        setStatus(res.data);
      } catch (e) {
        console.error("Subscription status fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  if (loading) return null; // silent loading — don't block the dashboard

  // ── Hidden (60+ days expired) → locked message ──────────────────────────────
  if (status?.isHidden || status?.notification?.type === "hidden") {
    return (
      <div style={{
        background: "linear-gradient(135deg,#1e293b,#334155)",
        border: "2px solid #475569", borderRadius: 14, padding: "18px 22px",
        marginBottom: 18, display: "flex", alignItems: "center", gap: 14
      }}>
        <div style={{ fontSize: 28 }}>🔒</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>Access Restricted</div>
          <div style={{ fontSize: 13, color: "#cbd5e1" }}>
            Your company's subscription has expired. Please contact your administrator to restore access.
          </div>
        </div>
        <span style={{ background: "#ef444418", color: "#ef4444", border: "1px solid #ef444433", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>LOCKED</span>
      </div>
    );
  }

  // ── No subscription ──────────────────────────────────────────────────────────
  if (!status?.hasSubscription && status?.notification?.type !== "renewal") {
    // Don't block employee dashboard — just show a subtle notice
    if (status?.notification?.type === "expired") {
      return (
        <div style={{
          background: "linear-gradient(135deg,#fef2f2,#fee2e2)",
          border: "2px solid #fecaca", borderRadius: 14, padding: "16px 20px",
          marginBottom: 16, display: "flex", alignItems: "center", gap: 12
        }}>
          <div style={{ fontSize: 22 }}>🚫</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#991b1b", marginBottom: 3 }}>Subscription Expired</div>
            <div style={{ fontSize: 13, color: "#7f1d1d" }}>Contact your administrator to renew the company subscription.</div>
          </div>
        </div>
      );
    }
    return null;
  }

  const { notification } = status || {};
  if (!notification || notification.type === "none") return null;

  // ── 10-day renewal warning ───────────────────────────────────────────────────
  if (notification.type === "renewal") {
    return (
      <div style={{
        background: "linear-gradient(135deg,#fef3c7,#fde68a)",
        border: "2px solid #f59e0b", borderRadius: 14, padding: "16px 22px",
        marginBottom: 18, display: "flex", alignItems: "center", gap: 14,
        boxShadow: "0 4px 16px rgba(245,158,11,0.15)"
      }}>
        <div style={{ fontSize: 28 }}>⏰</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#92400e", marginBottom: 4 }}>
            Subscription Renewal Required
          </div>
          <div style={{ fontSize: 13, color: "#78350f", lineHeight: 1.5 }}>
            {notification.message}
          </div>
          {notification.daysLeft !== undefined && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ background: "#fde68a", border: "1px solid #f59e0b", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 800, color: "#92400e" }}>
                {notification.daysLeft} day{notification.daysLeft === 1 ? "" : "s"} remaining
              </div>
              <span style={{ fontSize: 12, color: "#78350f" }}>Please contact your administrator to renew.</span>
            </div>
          )}
        </div>
        <span style={{ background: "#f59e0b18", color: "#92400e", border: "1px solid #f59e0b33", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>WARNING</span>
      </div>
    );
  }

  return null;
}
