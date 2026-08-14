import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

export default function EmployeeSubscriptionWarning({ user, onRenew, trigger }) {
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
  }, [user, trigger]);

  if (loading) return null; // silent loading — don't block the dashboard

  // ── Hidden (60+ days expired)  locked message ------------------------------
  if (status?.isHidden || status?.notification?.type === "hidden") {
    return (
      <div style={{
        background: "linear-gradient(135deg,#1E293B,#1E293B)",
        border: "2px solid #64748B", borderRadius: 14, padding: "18px 22px",
        marginBottom: 18, display: "flex", alignItems: "center", gap: 14,
        flexWrap: "wrap"
      }}>
        <div style={{ fontSize: 28 }}>Secure</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#EFF6FF", marginBottom: 4 }}>Access Restricted</div>
          <div style={{ fontSize: 13, color: "#E2E8F0", wordBreak: "break-word" }}>
            {onRenew
              ? "Your subscription has expired. Please renew your plan to restore access."
              : "Your company's subscription has expired. Please contact your administrator to restore access."}
          </div>
        </div>
        {onRenew ? (
          <button onClick={onRenew} style={{ background: "linear-gradient(135deg,#2563EB,#2563EB)", color: "#FFFFFF", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Renew Now</button>
        ) : (
          <span style={{ background: "#64748B18", color: "#64748B", border: "1px solid #64748B33", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>LOCKED</span>
        )}
      </div>
    );
  }

  // ── No subscription ----------------------------------------------------------
  if (!status?.hasSubscription && status?.notification?.type !== "renewal") {
    // Don't block employee dashboard — just show a subtle notice
    if (status?.notification?.type === "expired") {
      return (
        <div style={{
          background: "linear-gradient(135deg,#F8FAFC,#E2E8F0)",
          border: "2px solid #E2E8F0", borderRadius: 14, padding: "16px 20px",
          marginBottom: 16, display: "flex", alignItems: "center", gap: 12,
          flexWrap: "wrap"
        }}>
          <div style={{ fontSize: 22 }}>🚫</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 3 }}>Subscription Expired</div>
            <div style={{ fontSize: 13, color: "#1E293B", wordBreak: "break-word" }}>
              {onRenew
                ? "Please renew your subscription to continue using all features."
                : "Contact your administrator to renew the company subscription."}
            </div>
          </div>
          {onRenew && (
            <button onClick={onRenew} style={{ background: "linear-gradient(135deg,#64748B,#64748B)", color: "#FFFFFF", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Renew Now</button>
          )}
        </div>
      );
    }
    return null;
  }

  const { notification } = status || {};
  if (!notification || notification.type === "none") return null;

  // ── 10-day renewal warning ---------------------------------------------------
  if (notification.type === "renewal") {
    return (
      <div style={{
        background: "linear-gradient(135deg,#E2E8F0,#E2E8F0)",
        border: "2px solid #64748B", borderRadius: 14, padding: "16px 22px",
        marginBottom: 18, display: "flex", alignItems: "center", gap: 14,
        boxShadow: "0 4px 16px rgba(100, 116, 139, 0.15)", flexWrap: "wrap"
      }}>
        <div style={{ fontSize: 28 }}>⏰</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#1E293B", marginBottom: 4 }}>
            Subscription Renewal Required
          </div>
          <div style={{ fontSize: 13, color: "#1E293B", lineHeight: 1.5, wordBreak: "break-word" }}>
            {notification.message}
          </div>
          {notification.daysLeft !== undefined && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ background: "#E2E8F0", border: "1px solid #64748B", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 800, color: "#1E293B" }}>
                {notification.daysLeft} day{notification.daysLeft === 1 ? "" : "s"} remaining
              </div>
              <span style={{ fontSize: 12, color: "#1E293B" }}>
                {onRenew
                  ? "Please renew your subscription soon."
                  : "Please contact your administrator to renew."}
              </span>
            </div>
          )}
        </div>
        {onRenew ? (
          <button onClick={onRenew} style={{ background: "linear-gradient(135deg,#64748B,#64748B)", color: "#FFFFFF", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Renew Now</button>
        ) : (
          <span style={{ background: "#64748B18", color: "#1E293B", border: "1px solid #64748B33", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>WARNING</span>
        )}
      </div>
    );
  }

  return null;
}


