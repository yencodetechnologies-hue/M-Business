import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../config";
import SettingsPage from "./SettingsPage";
import ModernProjectDetails from "./ModernProjectDetails";
import { PROPOSAL_PREVIEW_CSS } from "./ProposalPreviewStyles";
import { printProposal, shareProposalAsPDF } from "./proposalPrintUtils";
// ── Teal Theme Colors --------------------      ----------------------
const C = {
  bg: "#F3F8F9",
  surface: "#FFFFFF",
  surface2: "#F8FAFB",
  border: "#DFF0F2",
  border2: "#C5DDE0",
  text: "#0D2027",
  text2: "#4E6B75",
  text3: "#96B0B8",
  teal: " var(--app-accent, var(--app-accent, #00BCD4))",
  teal2: "var(--app-accent2, #00ACC1)",
  teal3: "#006E7F",
  tealLight: "var(--teal-light, var(--teal-light, #E0F7FA))",
  tealLighter: "var(--teal-lighter, #F0FDFE)",
  tealMid: "rgba(0,188,212,.12)",
  green: "#1DB87A",
  greenBg: "#E3FAF0",
  amber: "#F59E0B",
  amberBg: "#FEF3C7",
  red: "#EF4444",
  redBg: "#FEF2F2",
  purple: "#7C3AED",
  purpleBg: "#EDE9FE",
  blue: "#2563EB",
  blueBg: "#EFF4FF",
};

// Load Nunito Font + Tabler Icons
function useAssets() {
  useEffect(() => {
    ["https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Nunito+Sans:wght@400;500;600&display=swap",
      "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
    ].forEach(href => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const l = document.createElement("link");
        l.rel = "stylesheet"; l.href = href;
        document.head.appendChild(l);
      }
    });
  }, []);
}
function ProposalViewerModal({ proposal, clientName, BASE_URL, onClose, onSigned }) {
  const [sigMode, setSigMode] = React.useState("draw");
  const [sigText, setSigText] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(!!proposal.clientSignature);
  const canvasRef = React.useRef(null);
  const drawing = React.useRef(false);
  const points = React.useRef([]);

  React.useEffect(() => {
    if (sigMode !== "draw") return;
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    cv.width = rect.width || 500;
    cv.height = 150;
    const ctx = cv.getContext("2d");
    ctx.strokeStyle = "#1a2e35";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    function getPos(e) {
      const r = cv.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: (cx - r.left) * (cv.width / r.width), y: (cy - r.top) * (cv.height / r.height) };
    }
    cv.onmousedown = (e) => { points.current = [getPos(e)]; drawing.current = true; };
    cv.onmousemove = (e) => {
      if (!drawing.current) return;
      const p = getPos(e); points.current.push(p);
      const pts = points.current;
      if (pts.length > 2) {
        const a = pts[pts.length - 3], b = pts[pts.length - 2], c = pts[pts.length - 1];
        const mx = (b.x + c.x) / 2, my = (b.y + c.y) / 2;
        const px = (a.x + b.x) / 2, py = (a.y + b.y) / 2;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(b.x, b.y, mx, my); ctx.stroke();
      }
    };
    cv.onmouseup = cv.onmouseleave = () => { drawing.current = false; points.current = []; };
    cv.ontouchstart = (e) => { e.preventDefault(); points.current = [getPos(e)]; drawing.current = true; };
    cv.ontouchmove = (e) => {
      e.preventDefault();
      if (!drawing.current) return;
      const p = getPos(e); points.current.push(p);
      const pts = points.current;
      if (pts.length > 2) {
        const a = pts[pts.length - 3], b = pts[pts.length - 2], c = pts[pts.length - 1];
        const mx = (b.x + c.x) / 2, my = (b.y + c.y) / 2;
        const px = (a.x + b.x) / 2, py = (a.y + b.y) / 2;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(b.x, b.y, mx, my); ctx.stroke();
      }
    };
    cv.ontouchend = () => { drawing.current = false; points.current = []; };
  }, [sigMode]);

  const clearCanvas = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    cv.getContext("2d").clearRect(0, 0, cv.width, cv.height);
  };

  const saveSignature = async () => {
    let sigData = "";
    if (sigMode === "draw") {
      const cv = canvasRef.current;
      if (!cv) return;
      sigData = cv.toDataURL();
    } else {
      if (!sigText.trim()) return alert("Please type your name to sign.");
      sigData = sigText.trim();
    }
    setSaving(true);
    try {
      const res = await axios.put(`${BASE_URL}/api/proposals/${proposal._id}/client-sign`, {
        clientSignature: sigData,
        clientName: clientName,
        sigMode: sigMode,
      });
      setSaved(true);
      if (onSigned) onSigned(res.data);
      alert("Success Signature saved! The proposal has been signed successfully.");
    } catch (err) {
      console.error("Signature save error:", err);
      alert("Error Failed to save signature. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const prop = proposal;
  const st = (prop.status || "sent").toLowerCase();

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e0eef0", padding: "12px 24px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "#f0fdfe", border: "1.5px solid #e0eef0", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: " var(--app-accent, var(--app-accent, #00BCD4))", display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-arrow-left"></i> Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0D2027" }}>{prop.title || "Proposal"}</div>
          <div style={{ fontSize: 11, color: "#96B0B8" }}>
            {prop.client || prop.clientName} · {prop.sentAt ? new Date(prop.sentAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
          </div>
        </div>
        <span style={{ background: st === "approved" ? "#DCFCE7" : st === "rejected" ? "#FEE2E2" : "#EFF4FF", color: st === "approved" ? "#15803D" : st === "rejected" ? "#DC2626" : "#2563EB", borderRadius: 20, padding: "4px 14px", fontSize: 11, fontWeight: 800 }}>
          {st.charAt(0).toUpperCase() + st.slice(1)}
        </span>
        <button onClick={() => printProposal(proposal)} style={{ background: "#f0fdfe", border: "1.5px solid #e0eef0", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: " var(--app-accent, var(--app-accent, #00BCD4))", display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-printer"></i> Print / PDF
        </button>
        <button onClick={() => shareProposalAsPDF(proposal, agencyName, null)} style={{ background: " var(--app-accent, var(--app-accent, #00BCD4))", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-share"></i> Share PDF
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", background: "#f5fafa", padding: "24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Proposal HTML content */}
          {prop.html ? (
            <>
              <style>{PROPOSAL_PREVIEW_CSS}</style>
              <div className="prop-doc" style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e0eef0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", maxHeight: "none", overflow: "visible" }}
                dangerouslySetInnerHTML={{ __html: prop.html }} />
            </>
          ) : prop.slides && prop.slides.length > 0 ? (
            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e0eef0", padding: "32px 40px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              {/* Slide-based proposal summary */}
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#0D2027", marginBottom: 6 }}>{prop.title}</div>
                <div style={{ fontSize: 14, color: "#607D86" }}>Prepared for {prop.client || prop.clientName}</div>
                <div style={{ fontSize: 13, color: "#96B0B8", marginTop: 4 }}>
                  {prop.sentAt ? new Date(prop.sentAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : ""}
                </div>
              </div>
              <div style={{ borderTop: "2px solid  var(--app-accent, var(--app-accent, #00BCD4))", marginBottom: 24 }}></div>
              {prop.slides.map((slide, si) => (
                <div key={si} style={{ marginBottom: 20, padding: "16px 20px", background: "#f5fafa", borderRadius: 10, border: "1px solid #e0eef0" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: " var(--app-accent, var(--app-accent, #00BCD4))", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{slide.type}</div>
                  {slide.heading && <div style={{ fontSize: 16, fontWeight: 700, color: "#0D2027", marginBottom: 4 }}>{slide.heading}</div>}
                  {slide.title && <div style={{ fontSize: 16, fontWeight: 700, color: "#0D2027", marginBottom: 4 }}>{slide.title}</div>}
                  {slide.body && <div style={{ fontSize: 13, color: "#4E6B75", lineHeight: 1.7 }}>{slide.body}</div>}
                  {slide.subtitle && <div style={{ fontSize: 13, color: "#4E6B75" }}>{slide.subtitle}</div>}
                  {slide.items && slide.items.map((item, ii) => (
                    <div key={ii} style={{ fontSize: 13, color: "#4E6B75", padding: "4px 0", borderBottom: "1px solid #e0eef0" }}>Yes {item}</div>
                  ))}
                  {slide.rows && slide.rows.map((row, ri) => (
                    <div key={ri} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: "1px solid #e0eef0" }}>
                      <span>{row.item}</span><span style={{ fontWeight: 700 }}>{row.cost}</span>
                    </div>
                  ))}
                  {slide.total && <div style={{ fontSize: 14, fontWeight: 800, color: " var(--app-accent, var(--app-accent, #00BCD4))", marginTop: 8 }}>Total: {slide.total}</div>}
                  {slide.phases && slide.phases.map((ph, pi) => (
                    <div key={pi} style={{ fontSize: 13, color: "#4E6B75", padding: "3px 0" }}>Phase {pi + 1}: {ph.label} — {ph.dur}</div>
                  ))}
                  {slide.members && slide.members.map((m, mi) => (
                    <div key={mi} style={{ fontSize: 13, color: "#4E6B75", padding: "3px 0" }}>{m.name} — {m.role}</div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e0eef0", padding: 40, textAlign: "center", color: "#96B0B8" }}>
              No proposal content available.
            </div>
          )}

          {/* ── Client Signature display (always shown at bottom) ── */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e0eef0", padding: "24px 28px", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#607D86", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Client Sign-off
            </div>
            {prop.clientSignature ? (
              <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <i className="ti ti-circle-check" style={{ fontSize: 18, color: "#15803D" }}></i>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#15803D" }}>You have accepted this proposal</span>
                  {prop.clientSignedAt && (
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#96B0B8", fontWeight: 600 }}>
                      {new Date(prop.clientSignedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
                <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #86efac", padding: "16px 20px", textAlign: "center", maxWidth: 320, margin: "0 auto" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#96B0B8", textTransform: "uppercase", letterSpacing: .6, marginBottom: 12 }}>Your Signature</div>
                  <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    {prop.clientSignature.startsWith("data:image") ? (
                      <img src={prop.clientSignature} style={{ maxHeight: 60, maxWidth: "100%", objectFit: "contain" }} alt="your signature" />
                    ) : (
                      <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: 28, color: "#0D2027" }}>
                        {prop.clientSignature}
                      </span>
                    )}
                  </div>
                  <div style={{ height: 1, background: "#15803D", marginBottom: 8 }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0D2027" }}>{prop.clientName || clientName}</div>
                  <div style={{ fontSize: 10, color: "#15803D", fontWeight: 700, marginTop: 3 }}>Digitally Signed & Accepted</div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#96B0B8", marginBottom: 16 }}>
                Please sign below to formally accept this proposal.
              </div>
            )}
          </div>

          {/* Signature box — show only if not yet signed */}
          {!prop.clientSignature && !saved && (
            <div style={{ background: "#fff", borderRadius: 14, border: "2px solid  var(--app-accent, var(--app-accent, #00BCD4))", padding: "24px 28px", boxShadow: "0 4px 20px rgba(0,188,212,0.1)" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0D2027", marginBottom: 4 }}>
                <i className="ti ti-writing" style={{ color: " var(--app-accent, var(--app-accent, #00BCD4))", marginRight: 8 }}></i>
                Awaiting Client Signature
              </div>
              <div style={{ fontSize: 12, color: "#96B0B8", marginBottom: 18 }}>
                Please sign below to accept this proposal. Your signature confirms agreement to the terms outlined.
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 4, background: "#f5fafa", borderRadius: 10, padding: 4, marginBottom: 16, width: "fit-content" }}>
                {["draw", "type"].map(mode => (
                  <button key={mode} onClick={() => setSigMode(mode)} style={{ padding: "6px 16px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", background: sigMode === mode ? " var(--app-accent, var(--app-accent, #00BCD4))" : "transparent", color: sigMode === mode ? "#fff" : "#607D86" }}>
                    {mode === "draw" ? "Draw" : "Type"}
                  </button>
                ))}
              </div>

              {sigMode === "draw" ? (
                <div>
                  <div style={{ background: "#f5fafa", border: "1.5px dashed #c5dde0", borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
                    <canvas ref={canvasRef} style={{ width: "100%", height: 150, cursor: "crosshair", display: "block", touchAction: "none" }} />
                  </div>
                  <button onClick={clearCanvas} style={{ background: "none", border: "1px solid #e0eef0", borderRadius: 7, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#607D86", marginBottom: 12 }}>
                    Clear
                  </button>
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <input
                    value={sigText}
                    onChange={e => setSigText(e.target.value)}
                    placeholder="Type your full name to sign..."
                    style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #e0eef0", borderRadius: 10, fontSize: 22, fontFamily: "'Dancing Script', cursive", color: "#0D2027", outline: "none", boxSizing: "border-box" }}
                  />
                  {sigText && (
                    <div style={{ marginTop: 8, fontSize: 11, color: "#96B0B8" }}>
                      Preview: <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: 22, color: "#0D2027" }}>{sigText}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Sign button */}
              <button
                onClick={saveSignature}
                disabled={saving}
                style={{ width: "100%", padding: "13px", background: saving ? "#96B0B8" : " var(--app-accent, var(--app-accent, #00BCD4))", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 14px rgba(0,188,212,0.3)" }}>
                <i className="ti ti-writing" style={{ fontSize: 16 }}></i>
                {saving ? "Saving Signature..." : "Sign & Accept Proposal"}
              </button>

              <div style={{ textAlign: "center", fontSize: 11, color: "#96B0B8", marginTop: 10 }}>
                By signing, you agree to the terms and conditions outlined in this proposal.
              </div>
            </div>
          )}

          {/* Success state after signing */}
          {!prop.clientSignature && saved && (
            <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 14, padding: "20px 28px", textAlign: "center" }}>
              <i className="ti ti-circle-check" style={{ fontSize: 36, color: "#15803D" }}></i>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#15803D", marginTop: 8 }}>Proposal Signed Successfully!</div>
              <div style={{ fontSize: 12, color: "#607D86", marginTop: 4 }}>Your signature has been saved and the subadmin has been notified.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default function ClientDashboard({ user: userProp, setUser, portalMode = false }) {
  useAssets();
  const [active, setActive] = useState(() =>
    portalMode ? "dashboard" : (localStorage.getItem("activeTab_client") || "dashboard")
  );

  const portalClientId = portalMode
    ? window.location.pathname.split("/client-portal/")[1]?.split("?")[0] || ""
    : "";

  // Decode token SYNCHRONOUSLY on first render so clientName is correct immediately.
  // This prevents subadmin data from ever loading in portal mode.
  //
  // The token is stripped from the URL right after decoding (for security), so a
  // page refresh has nothing left to read from the address bar. To survive a
  // refresh WITHOUT re-showing a fake "signed out" screen, the decoded session is
  // also saved to sessionStorage — scoped to THIS client's id (taken from the URL
  // path, which does survive refresh) — and restored from there when no token is
  // present. Because the key includes the client id, a session for one client can
  // never be accidentally read while viewing a different client's portal link.
  const [portalUser, setPortalUser] = useState(() => {
    if (!portalMode) return null;
    const pathClientId = window.location.pathname.split("/client-portal/")[1]?.split("?")[0] || "";
    const sessionKey = pathClientId ? `portalSession_${pathClientId}` : null;

    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (token) {
        const decoded = JSON.parse(atob(token));
        if (decoded.exp && Date.now() > decoded.exp) return null;
        if (decoded.agencyName) {
          localStorage.setItem("portalAgencyName", decoded.agencyName);
        }

        const sessionUser = {
          _id: decoded.clientId,
          id: decoded.clientId,
          clientName: decoded.name || decoded.clientName || "",
          name: decoded.name || decoded.clientName || "",
          email: decoded.email || "",
          companyName: decoded.companyName || "",
          companyId: decoded.companyId || "",
          role: "client",
          agencyName: decoded.agencyName || "",
          exp: decoded.exp || (Date.now() + 24 * 60 * 60 * 1000),
        };

        // Persist so refreshing THIS SAME portal link keeps the client signed in.
        if (sessionKey) {
          try { sessionStorage.setItem(sessionKey, JSON.stringify(sessionUser)); } catch (e) { }
        }

        // Clean token from URL immediately (keeps it out of browser history)
        window.history.replaceState({}, document.title, window.location.pathname);
        return sessionUser;
      }

      // No token in the URL — likely a refresh. Try restoring the saved session,
      // but ONLY if it belongs to the client id in the current URL path.
      if (sessionKey) {
        const saved = sessionStorage.getItem(sessionKey);
        if (saved) {
          const parsedSaved = JSON.parse(saved);
          const notExpired = !parsedSaved.exp || Date.now() <= parsedSaved.exp;
          if (parsedSaved._id === pathClientId && notExpired) {
            return parsedSaved;
          }
          // Expired, or somehow mismatched — don't let a stale/wrong session through.
          sessionStorage.removeItem(sessionKey);
        }
      }
      return null;
    } catch (e) {
      console.warn("Portal token decode failed:", e);
      return null;
    }
  });
  // Portal mode is intentionally isolated: it must NEVER call the shared
  // setUser/localStorage("user") — that key is also used by the Subadmin's
  // own session. Writing to it here would silently log the Subadmin out
  // of their own tab (and any other open tab) the moment this portal loads,
  // since localStorage is shared across tabs on the same origin.
  // portalUser is used directly and locally below (`const user = portalMode
  // ? portalUser : userProp`) — no syncing to the parent is needed or safe.

  // In portal mode always use the locally decoded client user, never the subadmin prop
  const user = portalMode ? portalUser : userProp;

  const [selectedClientProject, setSelectedClientProject] = useState(null);
  useEffect(() => {
    // Skip localStorage in portal mode — we must not touch the shared client-session key
    if (!portalMode) {
      localStorage.setItem("activeTab_client", active);
    }
    if (active !== "projects") setSelectedClientProject(null);
  }, [active, portalMode]);

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [docs, setDocs] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Profile Dropdown
  const [profileOpen, setProfileOpen] = useState(false);

  // File filter
  const [fileFilter, setFileFilter] = useState("All");

  // Real chat — populated from backend
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState("");

  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Approvals — start empty, real data comes from backend updates/notifications
  const [approvals, setApprovals] = useState([]);

  // Calendar states — use real current date
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  // Document preview states
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Payment Checkout Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [viewingProposal, setViewingProposal] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [clientSigMode, setClientSigMode] = useState("draw"); // draw | type
  const [clientSigText, setClientSigText] = useState("");
  const [clientSigSaving, setClientSigSaving] = useState(false);
  const clientCanvasRef = React.useRef(null);
  const clientDrawingRef = React.useRef(false);
  const clientPointsRef = React.useRef([]);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const clientName = user?.clientName || user?.name || "Client";
  const agencyName = localStorage.getItem("portalAgencyName") || user?.agencyName || "Our Company";
  // Fallback to clientName if client company is not in user object
  // In the backend, a company name of type "Urban Cafe" will be saved in project.client
  const clientCompany = user?.companyName || user?.company || user?.clientCompany || user?.organization || "";

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchAll = async () => {
      try {
        const myClientId = portalMode
          ? (portalClientId || user._id || user.id || "")
          : (user._id || user.id || "");
        const [projRes, taskRes, invRes, notifRes, docRes, meetRes, propRes, quotRes, approvalRes, msgRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/projects/client/${encodeURIComponent(clientName)}?company=${encodeURIComponent(clientCompany)}&clientId=${encodeURIComponent(myClientId)}`, {
            headers: { 'x-company-id': user.companyId || "" }
          }),
          axios.get(`${BASE_URL}/api/tasks/client/${encodeURIComponent(clientName)}?clientId=${encodeURIComponent(myClientId)}`, {
            headers: { 'x-company-id': user.companyId || "" }
          }),
          axios.get(`${BASE_URL}/api/invoices/client/${encodeURIComponent(clientName)}?clientId=${encodeURIComponent(myClientId)}`, {
            headers: { 'x-company-id': user.companyId || "" }
          }),
          axios.get(`${BASE_URL}/api/notifications/${user._id || user.id}`),
          axios.get(`${BASE_URL}/api/documents?companyId=${user.companyId || ""}&client=${encodeURIComponent(clientName)}&sendTo=client&clientId=${encodeURIComponent(myClientId)}`).catch(() => ({ data: [] })),
          axios.get(`${BASE_URL}/api/meetings?client=${encodeURIComponent(clientName)}`).catch(() => ({ data: [] })),
          axios.get(`${BASE_URL}/api/proposals/client/${encodeURIComponent(clientName)}?company=${encodeURIComponent(clientCompany)}&clientId=${encodeURIComponent(user._id || user.id || "")}`, {
            headers: { 'x-company-id': user.companyId || "" }
          }).catch(() => ({ data: [] })),
          axios.get(`${BASE_URL}/api/quotations/client/${encodeURIComponent(clientName)}?company=${encodeURIComponent(clientCompany)}&clientId=${encodeURIComponent(myClientId)}`, {
            headers: { 'x-company-id': user.companyId || "" }
          }).catch(() => ({ data: [] })),
          axios.get(`${BASE_URL}/api/approvals/client/${encodeURIComponent(myClientId)}`, {
            headers: { 'x-company-id': user.companyId || "" }
          }).catch(() => ({ data: [] })),
          axios.get(`${BASE_URL}/api/messages?companyId=${encodeURIComponent(user.companyId || "")}`).catch(() => ({ data: [] }))
        ]);

        setProjects(projRes.data || []);
        setTasks(taskRes.data || []);
        setInvoices(invRes.data || []);
        setNotifs(notifRes.data || []);
        setDocs(docRes.data || []);
        setMeetings(Array.isArray(meetRes.data) ? meetRes.data : []);

        // Filter quotations — only show "sent" quotations addressed to this client
        const allQuots = Array.isArray(quotRes.data) ? quotRes.data : (quotRes.data?.quotations || []);
        const myClientIdStr = String(user._id || user.id || "");
        const cn = (clientName || "").toLowerCase().trim();
        const filteredQuots = allQuots.filter(q => {
          if (q.status !== "sent") return false;
          const qClient = (q.client || q.qt?.client || q.qt?.toName || "").toLowerCase().trim();
          return qClient === cn;
        });
        setQuotations(filteredQuots);
        setApprovals(Array.isArray(approvalRes.data) ? approvalRes.data.map(a => ({
          id: a._id,
          title: a.title,
          desc: a.desc,
          icon: a.icon,
          approveLabel: a.approveLabel,
          rejectLabel: a.rejectLabel,
          senderName: a.senderName,
          status: a.status,
          rejectReason: a.rejectReason,
          fileUrl: a.fileUrl,
          fileName: a.fileName,
          recipientType: a.recipientType,
        })) : []);

        // Real chat thread between this client and the agency (company owner)
        const allMsgs = Array.isArray(msgRes.data) ? msgRes.data : [];
        const myIdStr = String(myClientId);
        const threadMsgs = allMsgs
          .filter(m => String(m.senderId) === myIdStr || String(m.receiverId) === myIdStr)
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .map(m => ({
            id: m._id,
            sender: String(m.senderId) === myIdStr ? "You" : m.senderName,
            msg: m.content,
            attachmentUrl: m.attachmentUrl || "",
            attachmentName: m.attachmentName || "",
            time: new Date(m.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            mine: String(m.senderId) === myIdStr,
          }));
        setChatMessages(threadMsgs);

        const allProps = propRes.data || [];
        const filtered = allProps.filter(p => {
          const matchStatus = ["sent", "pending", "approved", "rejected"].includes(p.status);
          if (!matchStatus) return false;
          // Strict match: a proposal addressed to a specific client account
          // should only ever be visible to that exact client.
          if (p.clientId) return String(p.clientId) === myClientIdStr;
          // Legacy proposals saved before clientId existed — exact name match only.
          const propClient = (p.client || p.clientName || "").toLowerCase().trim();
          return propClient === cn;
        });
        setProposals(filtered);
      } catch (err) {
        console.error("Failed to fetch client dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    // Auto-refresh every 30s — new files will show immediately
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [user?._id, clientName]);

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const myClientId = portalMode
        ? (portalClientId || user?._id || user?.id || "")
        : (user?._id || user?.id || "");
      const [projRes, docRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/projects/client/${encodeURIComponent(clientName)}?company=${encodeURIComponent(clientCompany)}&clientId=${encodeURIComponent(myClientId)}`, {
          headers: { 'x-company-id': user?.companyId || "" }
        }),
        axios.get(`${BASE_URL}/api/documents?companyId=${user?.companyId || ""}&client=${encodeURIComponent(clientName)}&sendTo=client&clientId=${encodeURIComponent(myClientId)}`).catch(() => ({ data: [] })),
      ]);
      setProjects(projRes.data || []);
      setDocs(docRes.data || []);
    } catch (e) { console.error(e); }
    setRefreshing(false);
  };
  const handleLogout = () => {
    if (portalMode) {
      // Client Portal tab is fully isolated: never touch the shared "user"
      // key (that's the Subadmin's own session) and never navigate away
      // to "/" — that route belongs to the Subadmin app, not the portal.
      setPortalUser(null);
      window.location.reload(); // reloads this same portal URL only
      return;
    }
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const handleSendMessage = async (attachment = null) => {
    if (!chatText.trim() && !attachment) return;
    if (!user) return;
    const content = chatText.trim() || (attachment ? `Sent a file: ${attachment.name}` : "");
    setChatText("");
    const myClientId = portalMode
      ? (portalClientId || user._id || user.id || "")
      : (user._id || user.id || "");
    const optimistic = {
      id: "temp-" + Date.now(),
      sender: "You",
      msg: content,
      attachmentUrl: attachment?.url || "",
      attachmentName: attachment?.name || "",
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      mine: true,
    };
    setChatMessages(prev => [...prev, optimistic]);
    try {
      const res = await axios.post(`${BASE_URL}/api/messages`, {
        senderId: myClientId,
        senderName: clientName,
        receiverId: user.companyId || "",
        receiverName: agencyName,
        content,
        attachmentUrl: attachment?.url || "",
        attachmentName: attachment?.name || "",
        companyId: user.companyId || "",
      });
      setChatMessages(prev => prev.map(m => m.id === optimistic.id ? {
        id: res.data._id,
        sender: "You",
        msg: res.data.content,
        attachmentUrl: res.data.attachmentUrl || "",
        attachmentName: res.data.attachmentName || "",
        time: new Date(res.data.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        mine: true,
      } : m));
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const [attachUploading, setAttachUploading] = useState(false);

  const handleAttachFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setAttachUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post(`${BASE_URL}/api/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await handleSendMessage({ url: res.data.url, name: res.data.name || file.name });
    } catch (err) {
      console.error("Failed to upload attachment", err);
      alert("Failed to upload file. Please try again.");
    }
    setAttachUploading(false);
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/api/clients/feedback`, {
        clientName: user?.name || user?.clientName || "",
        rating: feedbackRating,
        message: feedbackText,
      });
    } catch (err) {
      console.error("Feedback save failed", err);
    }
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedbackText("");
      setFeedbackRating(4);
      setFeedbackSubmitted(false);
      alert("Thank you for your feedback! We appreciate your support.");
    }, 1000);
  };

  const [rejectModalApp, setRejectModalApp] = useState(null);
  const [rejectReasonText, setRejectReasonText] = useState("");
  const [viewApprovalApp, setViewApprovalApp] = useState(null);

  // Portal mode has no real login form — the client's "session" is just the
  // decoded token from the link. Once they sign out (or the token is
  // missing/expired), don't fall through to the normal dashboard render
  // with an empty/undefined user — show a clear, dead-end screen instead.
  if (portalMode && !portalUser) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3F8F9", fontFamily: "inherit", padding: 24, textAlign: "center" }}>
        <div style={{ background: "#fff", border: "1.5px solid #E0EEF0", borderRadius: 16, padding: "40px 32px", maxWidth: 420 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0D2027", marginBottom: 8 }}>You've been signed out</div>
          <div style={{ fontSize: 13, color: "#6B8790", lineHeight: 1.6 }}>
            This portal session has ended. Please ask your agency to share a fresh portal link to access this page again.
          </div>
        </div>
      </div>
    );
  }

  const handleApprove = async (id) => {
    setApprovals(prev => prev.filter(a => a.id !== id));
    try {
      await axios.patch(`${BASE_URL}/api/approvals/${id}/respond`, { status: "approved" });
    } catch (err) {
      console.error("Failed to approve", err);
      alert("Something went wrong saving your response. Please try again.");
    }
  };

  const submitRejection = async () => {
    if (!rejectReasonText.trim()) { alert("Please enter a reason for rejecting."); return; }
    const id = rejectModalApp.id;
    setApprovals(prev => prev.filter(a => a.id !== id));
    setRejectModalApp(null);
    try {
      await axios.patch(`${BASE_URL}/api/approvals/${id}/respond`, { status: "rejected", rejectReason: rejectReasonText.trim() });
    } catch (err) {
      console.error("Failed to reject", err);
      alert("Something went wrong saving your response. Please try again.");
    } finally {
      setRejectReasonText("");
    }
  };

  // Payment execution
  const startPayment = (invoice) => {
    setPaymentInvoice(invoice);
    setPayModalOpen(true);
  };

  const executePayment = async () => {
    if (!paymentInvoice) return;
    const remainingAmount = paymentInvoice.total - (paymentInvoice.amountPaid || 0);
    setPaymentProcessing(true);
    try {
      const txnId = "TXN" + Math.floor(Math.random() * 1000000000);
      const res = await axios.patch(`${BASE_URL}/api/invoices/${paymentInvoice.id || paymentInvoice._id}/status`, {
        status: "paid",
        amountPaid: remainingAmount,
        paymentMode: "GPay",
        paymentDate: new Date().toISOString().split("T")[0],
        transactionId: txnId
      });
      if (res.data?.success || res.status === 200) {
        setInvoices(invoices.map(inv => {
          if (inv.id === paymentInvoice.id || inv._id === paymentInvoice._id) {
            return { ...inv, status: "paid", amountPaid: inv.total };
          }
          return inv;
        }));
        setPayModalOpen(false);
        setPaymentInvoice(null);
        alert("✅ Payment of ₹" + remainingAmount.toLocaleString("en-IN") + " marked as paid!\nTransaction ID: " + txnId);
      }
    } catch (err) {
      console.error("Payment update failed:", err);
      alert("❌ Payment failed: " + (err.response?.data?.msg || err.message));
    } finally {
      setPaymentProcessing(false);
    }
  };
  // Dynamic Calendar — uses real currentDate state
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const days = [];
    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrev - i, isOtherMonth: true });
    }
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isOtherMonth: false });
    }
    // Next month padding to fill grid (multiple of 7)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({ day: i, isOtherMonth: true });
      }
    }
    return days;
  };

  const getEventClass = (day, other) => {
    if (other) return "";
    // Highlight days that have meetings from backend
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const hasMeeting = (meetings || []).some(m => {
      const d = new Date(m.date || m.scheduledAt || m.meetingDate || "");
      return !isNaN(d) && d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
    return hasMeeting ? "has-event" : "";
  };

  // File grid logic
  const defaultMockFiles = [
    { name: "Homepage_Final_v3.fig", meta: "Figma Design · 8.4 MB", date: "28 May 2026", type: "Designs", icon: "ti-photo", bg: C.blueBg, col: C.blue, badge: "New" },
    { name: "Brand_Guidelines_v2.pdf", meta: "PDF · 2.4 MB", date: "22 May 2026", type: "Documents", icon: "ti-file-type-pdf", bg: C.redBg, col: C.red },
    { name: "SEO_Audit_Report.xlsx", meta: "Excel · 890 KB", date: "20 May 2026", type: "Reports", icon: "ti-file-spreadsheet", bg: C.greenBg, col: C.green },
    { name: "STA_Phase2_Proposal.docx", meta: "Word · 340 KB", date: "15 May 2026", type: "Documents", icon: "ti-file-text", bg: C.purpleBg, col: C.purple },
    { name: "AboutPage_Design.png", meta: "PNG · 1.2 MB", date: "12 May 2026", type: "Designs", icon: "ti-photo", bg: C.amberBg, col: C.amber },
    { name: "Project_Contract.pdf", meta: "PDF · 560 KB", date: "01 Apr 2026", type: "Documents", icon: "ti-file-type-pdf", bg: C.redBg, col: C.red },
    { name: "ContactPage_v2.png", meta: "PNG · 980 KB", date: "29 May 2026", type: "Designs", icon: "ti-photo", bg: C.blueBg, col: C.blue, badge: "New" },
    { name: "Content_Brief.docx", meta: "Word · 210 KB", date: "08 Apr 2026", type: "Documents", icon: "ti-file-text", bg: C.greenBg, col: C.green }
  ];

  // Convert uploaded docs to matching file card format
  const docCards = docs.map(d => ({
    name: d.docType ? `${d.docType.charAt(0).toUpperCase() + d.docType.slice(1)}_Document.pdf` : "Document.pdf",
    meta: `PDF · ${(d.htmlContent?.length ? (d.htmlContent.length / 1024).toFixed(1) : "120")} KB`,
    date: new Date(d.dateSent || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    type: "Documents",
    icon: "ti-file-type-pdf",
    bg: C.redBg,
    col: C.red,
    raw: d
  }));

  const allFilesBase = [...docCards, ...(projects.flatMap(p => p.files || []))
    .filter(f => {
      // If sentToClient is not set at all, show the file (it belongs to this client's project)
      if (!f.sentToClient || f.sentToClient === null || f.sentToClient === "") return true;
      const sc = (f.sentToClient || "").toLowerCase().trim();
      const cn = (clientName || "").toLowerCase().trim();
      // Show when saved generically as "client", or if client name matches
      return sc === "client" || sc === cn || sc.includes(cn) || cn.includes(sc);
    })
    .map(f => {
      const mime = (f.type || '').toLowerCase();
      const fname = (f.name || '').toLowerCase();
      let icon = 'ti-file', bg = C.blueBg, col = C.blue, fileType = 'Documents';
      if (mime.includes('pdf') || fname.endsWith('.pdf')) {
        icon = 'ti-file-type-pdf'; bg = C.redBg; col = C.red; fileType = 'Documents';
      } else if (mime.includes('image') || /\.(jpg|jpeg|png|gif|webp|svg)$/.test(fname)) {
        icon = 'ti-photo'; bg = C.purpleBg || '#f3e8ff'; col = C.purple || '#7c3aed'; fileType = 'Designs';
      } else if (mime.includes('spreadsheet') || mime.includes('excel') || /\.(xlsx|xls|csv)$/.test(fname)) {
        icon = 'ti-file-spreadsheet'; bg = C.greenBg; col = C.green; fileType = 'Reports';
      } else if (mime.includes('word') || /\.(doc|docx)$/.test(fname)) {
        icon = 'ti-file-text'; bg = C.blueBg; col = C.blue; fileType = 'Documents';
      } else if (mime.includes('zip') || mime.includes('rar') || /\.(zip|rar|tar|gz)$/.test(fname)) {
        icon = 'ti-file-zip'; bg = C.amberBg || '#fef3c7'; col = C.amber || '#d97706'; fileType = 'Documents';
      } else if (mime.includes('video') || /\.(mp4|mov|avi|mkv)$/.test(fname)) {
        icon = 'ti-video'; bg = C.purpleBg || '#f3e8ff'; col = C.purple || '#7c3aed'; fileType = 'Designs';
      }
      if (/invoice/i.test(fname)) {
        fileType = 'Invoices';
      }
      return {
        name: f.name || f.heading || 'File',
        meta: f.size ? `${Math.round(f.size / 1024)} KB` : (f.type || 'File'),
        date: f.uploadedAt ? new Date(f.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
        type: fileType,
        icon,
        bg,
        col,
        url: f.url,
        description: f.description || ''
      };
    })];


  // Invoices variables
  // Invoices variables
  const dbInvoices = invoices.map(inv => ({
    id: inv.id || inv._id,
    invoiceNo: inv.invoiceNo,
    desc: inv.project || "Project Delivery Milestone",
    dueDate: inv.dueDate || "30 Jun 2026",
    date: inv.date || "01 May 2026",
    total: inv.total || 0,
    amountPaid: inv.amountPaid || 0,
    status: (inv.status || "draft").toLowerCase()
  }));

  const finalInvoicesList = dbInvoices;

  const invoiceFileCards = finalInvoicesList.map(inv => ({
    name: `${inv.invoiceNo || "Invoice"}.pdf`,
    meta: `₹${inv.total.toLocaleString("en-IN")} · ${inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}`,
    date: inv.status === "paid" ? inv.date : inv.dueDate,
    type: "Invoices",
    icon: "ti-file-invoice",
    bg: C.greenBg,
    col: C.green,
    invoiceRef: inv,
  }));

  const allFiles = [...allFilesBase, ...invoiceFileCards];
  const filteredFiles = fileFilter === "All" ? allFiles : allFiles.filter(f => f.type === fileFilter);
  const totalPaid = finalInvoicesList.filter(i => i.status === "paid").reduce((sum, i) => sum + i.total, 0);
  const totalPending = finalInvoicesList.filter(i => i.status === "pending" || i.status === "unpaid" || i.status === "sent").reduce((sum, i) => sum + (i.total - i.amountPaid), 0);
  const totalOverdue = finalInvoicesList.filter(i => i.status === "overdue").reduce((sum, i) => sum + (i.total - i.amountPaid), 0);
  const totalInvoiced = totalPaid + totalPending + totalOverdue;

  // Active project calculation — prefer explicitly Active status
  const activeProj = projects.find(p => (p.status || "").toLowerCase() === "active") || projects[0];
  const activeProjName = activeProj?.name || "";
  const activeProjProgress = activeProj?.progress ?? 0;
  const activeProjDesc = activeProj?.description || "";
  const activeProjDeadline = activeProj?.deadline || activeProj?.end || "";
  const activeProjStatus = activeProj?.status || "";

  // Styles Injection
  const CSS = `
  .cp-root {
      --teal:  var(--app-accent, var(--app-accent, #00BCD4));
      --teal2var(--app-accent2, var(--app-accent2, #00ACC1));
      --teal3: #006E7F;
      --teal-light: var(--teal-light, var(--teal-light, #E0F7FA));
      --teal-lighter: var(--teal-lighter, #F0FDFE);
      --bg: #F3F8F9;
      --surface: #FFFFFF;
      --surface2: #F8FAFB;
      --border: #DFF0F2;
      --border2: #C5DDE0;
      --text: #0D2027;
      --text2: #4E6B75;
      --text3: #96B0B8;
      --green: #1DB87A;
      --green-bg: #E3FAF0;
      --amber: #F59E0B;
      --amber-bg: #FEF3C7;
      --red: #EF4444;
      --red-bg: #FEF2F2;
      --purple: #7C3AED;
      --purple-bg: #EDE9FE;
      --blue: #2563EB;
      --blue-bg: #EFF4FF;
      --radius: 16px;
      --font: 'Nunito', sans-serif;
      --font2: 'Nunito Sans', sans-serif;
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }
    .cp-root * { box-sizing: border-box; margin: 0; padding: 0; }
    .cp-root button, .cp-root input, .cp-root textarea { font-family: var(--font); }

    /* ── TOP NAV ── */
    .cp-root .topnav { background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 12px rgba(0,0,0,.05); }
    .cp-root .topnav-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; height: 62px; display: flex; align-items: center; gap: 16px; }
    .cp-root .tn-brand { display: flex; align-items: center; gap: 10px; }
    .cp-root .tn-logo { width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, var(--teal3), var(--teal)); display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 900; color: #fff; letter-spacing: -.5px; }
    .cp-root .tn-company { font-size: 15px; font-weight: 800; color: var(--text); }
    .cp-root .tn-powered { font-size: 10px; color: var(--text3); font-weight: 600; }
    .cp-root .tn-nav { display: flex; gap: 2px; margin-left: 24px; }
    .cp-root .tn-item { padding: 8px 14px; border-radius: 9px; font-size: 13px; font-weight: 600; color: var(--text2); cursor: pointer; transition: all .15s; border: none; background: none; }
    .cp-root .tn-item:hover { background: var(--bg); color: var(--text); }
    .cp-root .tn-item.active { background: var(--teal-light); color: var(--teal); }
    .cp-root .tn-right { margin-left: auto; display: flex; align-items: center; gap: 10px; position: relative; }
    .cp-root .tn-notif { width: 36px; height: 36px; border-radius: 9px; background: var(--bg); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 17px; color: var(--text2); position: relative; transition: all 0.2s; }
    .cp-root .tn-notif:hover { border-color: var(--teal); color: var(--teal); }
    .cp-root .tn-notif-dot { position: absolute; top: 8px; right: 9px; width: 7px; height: 7px; border-radius: 50%; background: var(--red); border: 1.5px solid #fff; }
    .cp-root .tn-client-chip { display: flex; align-items: center; gap: 8px; padding: 6px 12px 6px 6px; background: var(--bg); border: 1px solid var(--border); border-radius: 9px; cursor: pointer; position: relative; }
    .cp-root .tn-client-chip:hover { border-color: var(--teal); }
    .cp-root .tn-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, var(--amber), #D97706); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: #fff; }
    .cp-root .tn-client-name { font-size: 12px; font-weight: 700; color: var(--text); }
    .cp-root .mobile-menu-btn { display: none; width: 36px; height: 36px; border-radius: 9px; background: var(--bg); border: 1px solid var(--border); align-items: center; justify-content: center; cursor: pointer; font-size: 18px; color: var(--text2); }

    /* Profile Dropdown */
    .cp-root .profile-dropdown { position: absolute; top: 48px; right: 0; background: var(--surface); border: 1.5px solid var(--border); border-radius: 12px; box-shadow: 0 4px 18px rgba(0,0,0,0.08); width: 150px; z-index: 150; padding: 6px 0; }
    .cp-root .profile-drop-item { width: 100%; padding: 8px 14px; text-align: left; background: none; border: none; font-size: 13px; color: var(--text2); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.15s; }
    .cp-root .profile-drop-item:hover { background: var(--teal-lighter); color: var(--teal); }
    .cp-root .profile-drop-item.signout:hover { background: var(--red-bg); color: var(--red); }

    /* ── HERO BANNER ── */
    .cp-root .hero { background: linear-gradient(135deg, #004D5E 0%, var(--teal3) 40%, var(--teal) 100%); position: relative; overflow: hidden; border-radius: 0 0 20px 20px; }
    .cp-root .hero::after { content: ''; position: absolute; right: -80px; top: -80px; width: 320px; height: 320px; border-radius: 50%; background: rgba(255,255,255,.05); pointer-events: none; }
    .cp-root .hero::before { content: ''; position: absolute; right: 120px; bottom: -100px; width: 200px; height: 200px; border-radius: 50%; background: rgba(255,255,255,.04); pointer-events: none; }
    .cp-root .hero-inner { max-width: 1200px; margin: 0 auto; padding: 36px 24px; display: grid; grid-template-columns: 1fr auto; gap: 32px; align-items: center; position: relative; z-index: 1; }
    .cp-root .hero-label { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,.15); color: rgba(255,255,255,.9); font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 20px; margin-bottom: 10px; letter-spacing: .6px; text-transform: uppercase; }
    .cp-root .hero-title { font-size: 24px; font-weight: 900; color: #fff; letter-spacing: -.5px; margin-bottom: 6px; }
    .cp-root .hero-sub { font-size: 13px; color: rgba(255,255,255,.7); line-height: 1.6; max-width: 480px; font-family: var(--font2); }
    .cp-root .hero-stats { display: flex; gap: 28px; margin-top: 22px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,.15); }
    .cp-root .hs-item { text-align: left; }
    .cp-root .hs-val { font-size: 22px; font-weight: 800; color: #fff; }
    .cp-root .hs-label { font-size: 10px; color: rgba(255,255,255,.6); font-weight: 600; text-transform: uppercase; letter-spacing: .5px; margin-top: 2px; }
    .cp-root .hero-right { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
    .cp-root .hero-pct-ring { position: relative; width: 110px; height: 110px; }
    .cp-root .hero-pct-ring svg { width: 100%; height: 100%; }
    .cp-root .hero-pct-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); text-align: center; }
    .cp-root .hero-pct-val { font-size: 22px; font-weight: 900; color: #fff; }
    .cp-root .hero-pct-label { font-size: 9px; color: rgba(255,255,255,.6); font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
    .cp-root .hero-status-badge { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,.15); color: #fff; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 20px; }
    .cp-root .hero-status-badge::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--green); flex-shrink: 0; }

    /* ── PAGE BODY ── */
    .cp-root .page-body { max-width: 1200px; margin: 0 auto; padding: 28px 24px 60px; display: flex; flex-direction: column; gap: 28px; min-width: 0; }
    .cp-root .page-body > * { min-width: 0; overflow-x: auto; }

    /* ── SECTION HEADERS ── */
    .cp-root .sec-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .cp-root .sec-title { font-size: 15px; font-weight: 800; color: var(--text); display: flex; align-items: center; gap: 8px; }
    .cp-root .sec-title-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
    .cp-root .sec-action { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--teal); cursor: pointer; padding: 6px 12px; border-radius: 8px; border: 1.5px solid var(--teal-light); background: var(--teal-lighter); transition: all .15s; }
    .cp-root .sec-action:hover { background: var(--teal-light); }

    /* ── PROJECT TIMELINE & GANTT ── */
    .cp-root .timeline-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); overflow: hidden; }
    .cp-root .tc-header { padding: 18px 22px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
    .cp-root .tc-title { font-size: 13px; font-weight: 800; color: var(--text); }
    .cp-root .tc-legend { display: flex; gap: 14px; }
    .cp-root .tc-legend-item { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 600; color: var(--text3); }
    .cp-root .tc-legend-dot { width: 8px; height: 8px; border-radius: 50%; }
    .cp-root .timeline-scroll { overflow-x: auto; padding: 20px 22px 16px; }
    .cp-root .timeline-wrap { min-width: 700px; }
    .cp-root .tl-months { display: grid; grid-template-columns: 140px repeat(6, 1fr); gap: 0; margin-bottom: 6px; }
    .cp-root .tl-month { font-size: 10px; font-weight: 700; color: var(--text3); text-align: center; text-transform: uppercase; letter-spacing: .5px; }
    .cp-root .tl-month:first-child { text-align: left; }
    .cp-root .tl-row { display: grid; grid-template-columns: 140px repeat(6, 1fr); gap: 0; align-items: center; margin-bottom: 8px; }
    .cp-root .tl-task-name { font-size: 12px; font-weight: 700; color: var(--text); padding-right: 12px; white-space: nowrap; }
    .cp-root .tl-task-sub { font-size: 10px; color: var(--text3); margin-top: 1px; }
    .cp-root .tl-grid-cell { height: 28px; border-left: 1px dashed var(--border); position: relative; }
    .cp-root .tl-grid-cell:last-child { border-right: 1px dashed var(--border); }
    .cp-root .tl-bar-wrap { position: relative; height: 22px; margin: 3px 0; }
.cp-root .tl-bar { height: 100%; border-radius: 6px; display: flex; align-items: center; padding-left: 8px; font-size: 10px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; position: absolute; }
.cp-root .tl-bar-fill { position: absolute; top: 0; left: 0; bottom: 0; background: rgba(255,255,255,0.35); border-radius: 6px 0 0 6px; z-index: 1; }
.cp-root .tl-bar-label { position: relative; z-index: 2; }
    .cp-root .today-line { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--red); z-index: 5; pointer-events: none; }
    .cp-root .today-label { position: absolute; top: -18px; transform: translateX(-50%); font-size: 9px; font-weight: 800; color: var(--red); background: var(--red-bg); padding: 1px 6px; border-radius: 20px; white-space: nowrap; }

    /* ── PROGRESS STEPS ── */
    .cp-root .steps-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0; position: relative; }
    .cp-root .steps-grid::before { content: ''; position: absolute; top: 18px; left: 10%; right: 10%; height: 2px; background: var(--border); z-index: 0; }
    .cp-root .step-item { display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; z-index: 1; }
    .cp-root .step-circle { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 15px; border: 2px solid transparent; transition: all .2s; cursor: pointer; }
    .cp-root .step-circle.done { background: var(--teal); color: #fff; border-color: var(--teal); box-shadow: 0 3px 10px rgba(0,188,212,.3); }
    .cp-root .step-circle.active { background: var(--surface); color: var(--teal); border-color: var(--teal); box-shadow: 0 0 0 4px var(--teal-light); }
    .cp-root .step-circle.pending { background: var(--surface2); color: var(--text3); border-color: var(--border); }
    .cp-root .step-name { font-size: 10px; font-weight: 700; color: var(--text2); text-align: center; max-width: 80px; }
    .cp-root .step-date { font-size: 9px; color: var(--text3); font-weight: 600; text-align: center; }

    /* ── LAYOUTS ── */
    .cp-root .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .cp-root .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

    /* ── FILES PANEL ── */
    .cp-root .files-panel { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); overflow: hidden; }
    .cp-root .files-toolbar { display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-bottom: 1px solid var(--border); background: var(--surface2); }
    .cp-root .ft-filter { padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; cursor: pointer; border: 1.5px solid var(--border); background: var(--surface); color: var(--text2); transition: all .15s; }
    .cp-root .ft-filter.active { background: var(--teal); color: #fff; border-color: var(--teal); }
    .cp-root .ft-filter:hover:not(.active) { border-color: var(--teal); color: var(--teal); }
    .cp-root .files-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; padding: 16px 18px; }
    .cp-root .file-card { background: var(--surface2); border: 1.5px solid var(--border); border-radius: 12px; padding: 14px; cursor: pointer; transition: all .2s; position: relative; overflow: hidden; }
    .cp-root .file-card:hover { border-color: var(--teal); box-shadow: 0 4px 14px rgba(0,188,212,.1); transform: translateY(-1px); }
    .cp-root .fc-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 10px; }
    .cp-root .fc-name { font-size: 12px; font-weight: 700; color: var(--text); margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cp-root .fc-meta { font-size: 10px; color: var(--text3); font-weight: 600; }
    .cp-root .fc-date { font-size: 10px; color: var(--text3); margin-top: 6px; }
    .cp-root .fc-download { position: absolute; top: 10px; right: 10px; width: 26px; height: 26px; border-radius: 7px; background: var(--teal-light); display: flex; align-items: center; justify-content: center; font-size: 13px; color: var(--teal); opacity: 0; transition: opacity .15s; }
    .cp-root .file-card:hover .fc-download { opacity: 1; }
    .cp-root .fc-new-badge { position: absolute; top: 10px; left: 10px; background: var(--red); color: #fff; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 20px; }

    /* ── INVOICES ── */
    .cp-root .invoice-item { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-bottom: 1px solid var(--border); cursor: pointer; transition: all .15s; }
    .cp-root .invoice-item:last-child { border-bottom: none; }
    .cp-root .invoice-item:hover { background: var(--teal-lighter); }
    .cp-root .inv-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; }
    .cp-root .inv-id { font-size: 12px; font-weight: 800; color: var(--text); }
    .cp-root .inv-desc { font-size: 11px; color: var(--text3); margin-top: 1px; }
    .cp-root .inv-date { font-size: 11px; color: var(--text2); font-weight: 600; }
    .cp-root .inv-amount { font-size: 14px; font-weight: 800; text-align: right; }
    .cp-root .inv-dl { width: 30px; height: 30px; border-radius: 8px; background: var(--teal-light); border: 1px solid var(--teal-light); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 15px; color: var(--teal); flex-shrink: 0; transition: all .15s; }
    .cp-root .inv-dl:hover { background: var(--teal); color: #fff; }
    .cp-root .badge { display: inline-flex; align-items: center; gap: 3px; padding: 3px 9px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: capitalize; }
    .cp-root .badge::before { content: ''; width: 5px; height: 5px; border-radius: 50%; }
    .cp-root .badge.paid { background: var(--green-bg); color: var(--green); }
    .cp-root .badge.paid::before { background: var(--green); }
    .cp-root .badge.pending, .cp-root .badge.unpaid, .cp-root .badge.sent, .cp-root .badge.part_paid { background: var(--amber-bg); color: var(--amber); }
    .cp-root .badge.pending::before, .cp-root .badge.unpaid::before, .cp-root .badge.sent::before, .cp-root .badge.part_paid::before { background: var(--amber); }
    .cp-root .badge.overdue { background: var(--red-bg); color: var(--red); }
    .cp-root .badge.overdue::before { background: var(--red); }

    /* ── MESSAGES / CHAT ── */
    .cp-root .messages-panel { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); overflow: hidden; display: flex; flex-direction: column; height: 420px; }
    .cp-root .msg-list { flex: 1; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
    .cp-root .msg-row { display: flex; gap: 8px; align-items: flex-end; }
    .cp-root .msg-row.mine { flex-direction: row-reverse; }
    .cp-root .msg-av { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: #fff; flex-shrink: 0; }
    .cp-root .msg-body { display: flex; flex-direction: column; gap: 2px; max-width: 70%; }
    .cp-root .msg-row.mine .msg-body { align-items: flex-end; }
    .cp-root .msg-name { font-size: 10px; font-weight: 700; color: var(--text3); margin-bottom: 1px; }
    .cp-root .msg-bubble { padding: 9px 13px; border-radius: 12px; font-size: 12px; line-height: 1.5; color: var(--text); }
    .cp-root .msg-bubble.them { background: var(--surface2); border: 1px solid var(--border); border-radius: 4px 12px 12px 12px; }
    .cp-root .msg-bubble.mine { background: var(--teal); color: #fff; border-radius: 12px 4px 12px 12px; }
    .cp-root .msg-time { font-size: 10px; color: var(--text3); font-weight: 600; margin-top: 1px; }
    .cp-root .msg-row.mine .msg-time { color: var(--text3); }
    .cp-root .msg-input-row { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--border); background: var(--surface); }
    .cp-root .msg-inp { flex: 1; padding: 9px 13px; background: var(--bg); border: 1.5px solid var(--border); border-radius: 10px; font-size: 12px; color: var(--text); outline: none; transition: all .15s; }
    .cp-root .msg-inp:focus { border-color: var(--teal); background: #fff; }
    .cp-root .msg-inp::placeholder { color: var(--text3); }
    .cp-root .msg-send { width: 36px; height: 36px; border-radius: 9px; background: var(--teal); border: none; display: flex; align-items: center; justify-content: center; font-size: 17px; color: #fff; cursor: pointer; flex-shrink: 0; transition: all .15s; }
    .cp-root .msg-send:hover { background: var(--teal2); }
    .cp-root .msg-attach { width: 36px; height: 36px; border-radius: 9px; background: var(--bg); border: 1.5px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 16px; color: var(--text2); cursor: pointer; flex-shrink: 0; transition: all .15s; }
    .cp-root .msg-attach:hover { border-color: var(--teal); color: var(--teal); }

    /* ── CALENDAR ── */
    .cp-root .calendar-panel { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); overflow: hidden; }
    .cp-root .cal-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--border); }
    .cp-root .cal-month { font-size: 13px; font-weight: 800; color: var(--text); }
    .cp-root .cal-nav { display: flex; gap: 4px; }
    .cp-root .cal-nav-btn { width: 28px; height: 28px; border-radius: 7px; background: var(--bg); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px; color: var(--text2); transition: all .15s; }
    .cp-root .cal-nav-btn:hover { border-color: var(--teal); color: var(--teal); }
    .cp-root .cal-grid { padding: 12px 14px 16px; }
    .cp-root .cal-days-header { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 4px; }
    .cp-root .cal-day-label { font-size: 10px; font-weight: 700; color: var(--text3); padding: 4px 0; text-transform: uppercase; }
    .cp-root .cal-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
    .cp-root .cal-day { height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: var(--text2); cursor: pointer; transition: all .15s; position: relative; }
    .cp-root .cal-day:hover { background: var(--teal-light); color: var(--teal); }
    .cp-root .cal-day.today { background: var(--teal); color: #fff; font-weight: 800; box-shadow: 0 2px 8px rgba(0,188,212,.3); }
    .cp-root .cal-day.has-event::after { content: ''; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); width: 5px; height: 5px; border-radius: 50%; background: var(--amber); }
    .cp-root .cal-day.has-event.today::after { background: #fff; }
    .cp-root .cal-day.other-month { color: var(--text3); opacity: .4; }
    .cp-root .cal-day.selected { background: var(--teal-light); color: var(--teal); font-weight: 700; border: 1px solid var(--teal); }
    .cp-root .meetings-list { padding: 0 14px 14px; display: flex; flex-direction: column; gap: 8px; }
    .cp-root .meeting-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; background: var(--bg); border-radius: 10px; border: 1.5px solid var(--border); cursor: pointer; transition: all .15s; }
    .cp-root .meeting-item:hover { border-color: var(--teal); }
    .cp-root .mi-time-col { display: flex; flex-direction: column; align-items: center; gap: 1px; flex-shrink: 0; min-width: 38px; }
    .cp-root .mi-time { font-size: 11px; font-weight: 800; color: var(--teal); }
    .cp-root .mi-dur { font-size: 9px; color: var(--text3); font-weight: 600; }
    .cp-root .mi-divider { width: 2px; height: 32px; background: var(--teal-light); border-radius: 1px; align-self: center; }
    .cp-root .mi-title { font-size: 12px; font-weight: 700; color: var(--text); }
    .cp-root .mi-meta { font-size: 10px; color: var(--text3); margin-top: 2px; }
    .cp-root .mi-join { margin-left: auto; display: flex; align-items: center; gap: 4px; padding: 5px 10px; background: var(--teal); color: #fff; border-radius: 7px; font-size: 10px; font-weight: 700; flex-shrink: 0; transition: all 0.15s; }
    .cp-root .mi-join:hover { background: var(--teal2); }

    /* ── APPROVALS ── */
    .cp-root .approval-item { display: flex; align-items: center; gap: 12px; padding: 13px 18px; border-bottom: 1px solid var(--border); transition: all .15s; }
    .cp-root .approval-item:last-child { border-bottom: none; }
    .cp-root .approval-item:hover { background: var(--teal-lighter); }
    .cp-root .ai-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; background: var(--teal-light); color: var(--teal); }
    .cp-root .ai-title { font-size: 12px; font-weight: 700; color: var(--text); }
    .cp-root .ai-desc { font-size: 11px; color: var(--text3); margin-top: 1px; }
    .cp-root .ai-actions { margin-left: auto; display: flex; gap: 6px; }
    .cp-root .ai-btn { padding: 6px 12px; border-radius: 7px; font-size: 11px; font-weight: 700; cursor: pointer; border: 1.5px solid var(--border); background: none; color: var(--text2); transition: all .15s; }
    .cp-root .ai-btn.approve { background: var(--green); color: #fff; border-color: var(--green); }
    .cp-root .ai-btn.reject { background: none; color: var(--red); border-color: rgba(239,68,68,.3); }
    .cp-root .ai-btn.approve:hover { opacity: .85; }
    .cp-root .ai-btn.reject:hover { background: var(--red-bg); }

    /* ── ACTIVITY FEED ── */
    .cp-root .activity-feed { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 18px; display: flex; flex-direction: column; gap: 0; }
    .cp-root .af-item { display: flex; gap: 12px; padding-bottom: 14px; }
    .cp-root .af-item:last-child { padding-bottom: 0; }
    .cp-root .af-dot-col { display: flex; flex-direction: column; align-items: center; }
    .cp-root .af-dot { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; background: var(--teal-light); color: var(--teal); }
    .cp-root .af-line { width: 2px; background: var(--border); flex: 1; margin: 4px 0; min-height: 14px; }
    .cp-root .af-item:last-child .af-line { display: none; }
    .cp-root .af-title { font-size: 12px; font-weight: 700; color: var(--text); line-height: 1.4; }
    .cp-root .af-time { font-size: 10px; color: var(--text3); margin-top: 2px; display: flex; align-items: center; gap: 3px; }

    /* ── FEEDBACK ── */
    .cp-root .feedback-panel { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 20px; }
    .cp-root .rating-row { display: flex; gap: 8px; margin: 10px 0 14px; }
    .cp-root .star { font-size: 24px; cursor: pointer; color: var(--border2); transition: color .15s; }
    .cp-root .star.active { color: var(--amber); }
    .cp-root .star:hover { color: var(--amber); }
    .cp-root .feedback-input { width: 100%; padding: 10px 13px; background: var(--bg); border: 1.5px solid var(--border); border-radius: 10px; font-size: 12px; color: var(--text); outline: none; resize: none; min-height: 72px; transition: all .15s; }
    .cp-root .feedback-input:focus { border-color: var(--teal); background: #fff; }
    .cp-root .feedback-input::placeholder { color: var(--text3); }
    .cp-root .feedback-submit { width: 100%; margin-top: 10px; padding: 11px; background: var(--teal); color: #fff; border: none; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; transition: background .15s; box-shadow: 0 3px 10px rgba(0,188,212,.25); }
    .cp-root .feedback-submit:hover { background: var(--teal2); }

    /* ── CONTACT CARD ── */
    .cp-root .contact-card { background: linear-gradient(135deg, #004D5E, var(--teal)); border-radius: var(--radius); padding: 22px; color: #fff; }
    .cp-root .cc-label { font-size: 10px; font-weight: 700; opacity: .65; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 8px; }
    .cp-root .cc-name { font-size: 16px; font-weight: 800; margin-bottom: 4px; }
    .cp-root .cc-role { font-size: 12px; opacity: .7; margin-bottom: 16px; }
    .cp-root .cc-contacts { display: flex; flex-direction: column; gap: 8px; }
    .cp-root .cc-contact-row { display: flex; align-items: center; gap: 8px; font-size: 12px; opacity: .85; }
    .cp-root .cc-contact-row i { font-size: 15px; opacity: .7; }
    .cp-root .cc-actions { display: flex; gap: 8px; margin-top: 16px; }
    .cp-root .cc-btn { flex: 1; padding: 9px; background: rgba(255,255,255,.15); border: 1.5px solid rgba(255,255,255,.25); border-radius: 9px; font-size: 11px; font-weight: 700; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; transition: all .15s; }
    .cp-root .cc-btn:hover { background: rgba(255,255,255,.25); }

    /* ── MOBILE BOTTOM NAV ── */
    .cp-root .mobile-bottom-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; height: 62px; background: var(--surface); border-top: 1px solid var(--border); z-index: 100; box-shadow: 0 -2px 12px rgba(0,0,0,.06); }
    .cp-root .mbn-inner { display: flex; align-items: center; justify-content: space-around; height: 100%; padding: 0 8px; }
    .cp-root .mbn-item { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 10px; border-radius: 9px; cursor: pointer; flex: 1; text-decoration: none; border: none; background: none; }
    .cp-root .mbn-item.active { background: var(--teal-light); }
    .cp-root .mbn-item i { font-size: 20px; color: var(--text3); }
    .cp-root .mbn-item.active i { color: var(--teal); }
    .cp-root .mbn-label { font-size: 9px; font-weight: 700; color: var(--text3); }
    .cp-root .mbn-item.active .mbn-label { color: var(--teal); }

    /* ── POPUP MODAL OVERLAY ── */
    .cp-root .modal-overlay { position: fixed; inset: 0; background: rgba(13, 32, 39, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
    .cp-root .modal-card { background: var(--surface); border-radius: var(--radius); border: 1.5px solid var(--border); box-shadow: 0 10px 30px rgba(0,0,0,0.15); width: 100%; max-width: 420px; overflow: hidden; animation: popUp 0.3s ease; }
    .cp-root .modal-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .cp-root .modal-title { font-size: 15px; font-weight: 800; color: var(--text); }
    .cp-root .modal-Close{ background: none; border: none; font-size: 20px; color: var(--text3); cursor: pointer; }
    .cp-root .modal-close:hover { color: var(--text); }
    .cp-root .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes popUp {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    /* ── RESPONSIVE ── */
    @media(max-width:900px){
      .cp-root .two-col, .cp-root .three-col { grid-template-columns: 1fr; }
      .cp-root .hero-stats { gap: 16px; }
      .cp-root .hero-right { display: none; }
      .cp-root .steps-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
      .cp-root .steps-grid::before { display: none; }
      .cp-root .tn-nav { display: none; }
      .cp-root .mobile-menu-btn { display: flex; }
      .cp-root .mobile-bottom-nav { display: block; }
      .cp-root .page-body { padding-bottom: 80px; }
      .cp-root .tl-months, .cp-root .tl-row { grid-template-columns: 120px repeat(6, 1fr); }
      .cp-root .files-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media(max-width:480px){
      .cp-root .hero-inner { grid-template-columns: 1fr; padding: 24px 16px; }
      .cp-root .page-body { padding: 16px 16px 80px; }
      .cp-root .hero-stats { flex-wrap: wrap; gap: 14px; }
      .cp-root .hs-val { font-size: 18px; }
      .cp-root .files-grid { grid-template-columns: 1fr; }
    }
  `;


  // Settings Component Render Wrapper
  if (active === "settings") {
    return (
      <div className="cp-root">
        <style>{CSS}</style>
        {renderTopNav()}
        <div style={{ maxWidth: 600, margin: "40px auto", padding: "0 24px" }}>
          <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #E0EEF0", padding: "32px" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0D2027", marginBottom: 20 }}>Account Settings</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#96B0B8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Name</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0D2027", padding: "10px 14px", background: "#F3F8F9", borderRadius: 9, border: "1px solid #DFF0F2" }}>{user?.clientName || user?.name || "—"}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#96B0B8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Email</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0D2027", padding: "10px 14px", background: "#F3F8F9", borderRadius: 9, border: "1px solid #DFF0F2" }}>{user?.email || "—"}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#96B0B8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Company</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0D2027", padding: "10px 14px", background: "#F3F8F9", borderRadius: 9, border: "1px solid #DFF0F2" }}>{user?.companyName || user?.company || "—"}</div>
            </div>
            <button onClick={handleLogout} style={{ marginTop: 8, padding: "10px 20px", background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 9, color: "#EF4444", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <i className="ti ti-logout" style={{ marginRight: 6 }}></i>Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Topnav Helper
  function renderTopNav() {
    const totalUnreadNotifs = notifs.filter(n => !n.isRead).length;
    const initials = clientName.substring(0, 2).toUpperCase();

    return (
      <nav className="topnav">
        <div className="topnav-inner">
          <div className="tn-brand">
            <div className="tn-logo">{agencyName.substring(0, 2).toUpperCase()}</div>
            <div>
              <div className="tn-company">{agencyName}</div>
              <div className="tn-powered">Client Portal</div>
            </div>
          </div>
          <div className="tn-nav">
            <button className={`tn-item ${active === "dashboard" ? "active" : ""}`} onClick={() => setActive("dashboard")}>Overview</button>
            <button className={`tn-item ${active === "projects" ? "active" : ""}`} onClick={() => setActive("projects")}><i className="ti ti-layout-kanban" style={{ marginRight: 4 }}></i>My Projects</button>
            <button className={`tn-item ${active === "timeline" ? "active" : ""}`} onClick={() => setActive("timeline")}>Timeline</button>
            <button className={`tn-item ${active === "files" ? "active" : ""}`} onClick={() => setActive("files")}>Files</button>
            <button className={`tn-item ${active === "proposals" ? "active" : ""}`} onClick={() => setActive("proposals")}>
              Proposals {proposals.filter(p => p.status === "sent" || p.status === "pending").length > 0 && (
                <span style={{ background: " var(--app-accent, var(--app-accent, #00BCD4))", color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 800, padding: "1px 6px", marginLeft: 4 }}>
                  {proposals.filter(p => p.status === "sent" || p.status === "pending").length}
                </span>
              )}
            </button>
            <button className={`tn-item ${active === "payments" ? "active" : ""}`} onClick={() => setActive("payments")}>Invoices</button>
            <button className={`tn-item ${active === "quotations" ? "active" : ""}`} onClick={() => setActive("quotations")}>
              Quotations {quotations.length > 0 && (
                <span style={{ background: " var(--app-accent, var(--app-accent, #00BCD4))", color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 800, padding: "1px 6px", marginLeft: 4 }}>
                  {quotations.length}
                </span>
              )}
            </button>


            <button className={`tn-item ${active === "messages" ? "active" : ""}`} onClick={() => setActive("messages")}>Messages</button>
          </div>
          <div className="tn-right">
            <div className="tn-notif" onClick={() => setActive("dashboard")}>
              <i className="ti ti-bell"></i>
              {totalUnreadNotifs > 0 && <span className="tn-notif-dot"></span>}
            </div>
            <div className="tn-client-chip" onClick={() => setProfileOpen(!profileOpen)}>
              <div className="tn-avatar">{initials}</div>
              <span className="tn-client-name">{clientName}</span>
              <i className="ti ti-chevron-down" style={{ fontSize: 12, color: C.text3 }}></i>

              {profileOpen && (
                <div className="profile-dropdown" onClick={(e) => e.stopPropagation()}>
                  <button className="profile-drop-item" onClick={() => { setActive("settings"); setProfileOpen(false); }}>
                    <i className="ti ti-settings" style={{ fontSize: 14 }}></i> Settings
                  </button>
                  <button className="profile-drop-item signout" onClick={handleLogout}>
                    <i className="ti ti-logout" style={{ fontSize: 14 }}></i> Sign Out
                  </button>
                </div>
              )}
            </div>
            <div className="mobile-menu-btn" onClick={() => setProfileOpen(!profileOpen)}>
              <i className="ti ti-menu-2"></i>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Render Hero Helper
  function renderHero() {
    const pendingAmountFormatted = totalPending >= 1000 ? `INR ${(totalPending / 1000).toFixed(0)}K` : `INR ${totalPending.toLocaleString("en-IN")}`;
    const dashoffset = 289 - (activeProjProgress / 100) * 289; // Circle stroke dash offsets

    return (
      <div className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-label"><i className="ti ti-briefcase" style={{ fontSize: 11 }}></i> Active Project</div>
            <div className="hero-title">{activeProjName}</div>
            <div className="hero-sub">{activeProjDesc}</div>
            <div className="hero-stats">
              <div className="hs-item" onClick={() => setActive('projects')} style={{ cursor: 'pointer', opacity: 1 }}>
                <div className="hs-val">{activeProjProgress}%</div>
                <div className="hs-label">Complete</div>
              </div>
              <div className="hs-item" onClick={() => setActive('timeline')} style={{ cursor: 'pointer' }}>
                <div className="hs-val">{activeProjDeadline ? Math.max(0, Math.ceil((new Date(activeProjDeadline) - Date.now()) / (1000 * 60 * 60 * 24))) : '—'}</div>
                <div className="hs-label">Days Left</div>
              </div>
              <div className="hs-item" onClick={() => setActive('payments')} style={{ cursor: 'pointer' }}>
                <div className="hs-val">{pendingAmountFormatted}</div>
                <div className="hs-label">Pending</div>
              </div>
              <div className="hs-item" onClick={() => setActive('files')} style={{ cursor: 'pointer' }}>
                <div className="hs-val">{allFiles.length}</div>
                <div className="hs-label">Files Shared</div>
              </div>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-pct-ring">
              <svg viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="10" />
                <circle cx="55" cy="55" r="46" fill="none" stroke="#fff" strokeWidth="10"
                  strokeDasharray="289" strokeDashoffset={dashoffset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
              </svg>
              <div className="hero-pct-center">
                <div className="hero-pct-val">{activeProjProgress}%</div>
                <div className="hero-pct-label">Done</div>
              </div>
            </div>
            <div className="hero-status-badge"><span>{activeProjStatus || (activeProjProgress === 100 ? "Completed" : "In Review")}</span></div>
          </div>
        </div>
      </div>
    );
  }

  // Render Gantt Timeline helper
  function renderTimelineComponent() {
    const proj = projects[0];
    const milestones = proj?.milestones || [];
    const today = new Date();

    // ── Milestone Steps ------------------------------------------
    const stepNodes = milestones.length > 0 ? milestones.map((m, idx) => {
      const isDone = m.done === true;
      const isActive = !isDone && idx === milestones.findIndex(x => !x.done);
      const dateLabel = m.date ? new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
      const statusText = isDone ? `Done · ${dateLabel}` : isActive ? 'Active' : 'Pending';
      const statusColor = isDone ? C.green : isActive ? C.teal : C.text3;
      return (
        <div key={idx} className="step-item">
          <div className={`step-circle ${isDone ? 'done' : isActive ? 'active' : 'pending'}`}>
            {isDone ? <i className="ti ti-check" style={{ fontSize: 15 }}></i> : idx + 1}
          </div>
          <div className="step-name">{m.name}</div>
          <div className="step-date" style={{ color: statusColor }}>{statusText}</div>
        </div>
      );
    }) : (
      // Fallback if no milestones yet
      <div style={{ gridColumn: '1/-1', textAlign: 'center', color: C.text3, fontSize: 13, padding: '12px 0' }}>
        No milestones defined for this project yet.
      </div>
    );

    // ── Gantt Chart -----------------------------------------------
    const pStart = proj?.start ? new Date(proj.start) : new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const pEnd = (proj?.end || proj?.deadline) ? new Date(proj.end || proj.deadline) : new Date(today.getFullYear(), today.getMonth() + 2, 0);

    const ganttMonths = [];
    for (let i = -1; i <= 4; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      ganttMonths.push({ label: d.toLocaleString('en-IN', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() });
    }

    function monthIndex(date) {
      if (!date) return -1;
      const d = new Date(date);
      return ganttMonths.findIndex(m => m.month === d.getMonth() && m.year === d.getFullYear());
    }

    const todayColIdx = ganttMonths.findIndex(m => m.month === today.getMonth() && m.year === today.getFullYear());
    const daysInTodayMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const todayPct = (today.getDate() / daysInTodayMonth) * 100;

    // Fallback: if a milestone has no explicit date, spread it evenly across the project span
    // so a duration bar can still be drawn instead of collapsing to a single point.
    const fallbackSpanMs = Math.max(pEnd.getTime() - pStart.getTime(), 1);
    const resolvedDates = milestones.map((m, idx) => {
      if (m.date) return new Date(m.date);
      const frac = (idx + 1) / Math.max(milestones.length, 1);
      return new Date(pStart.getTime() + fallbackSpanMs * frac);
    });

    const ganttRows = milestones.map((m, idx) => {
      const prevMilestone = idx > 0 ? milestones[idx - 1] : null;
      const barStart = prevMilestone ? (prevMilestone.date ? new Date(prevMilestone.date) : resolvedDates[idx - 1]) : pStart;
      const barEnd = resolvedDates[idx];
      const startColIdx = monthIndex(barStart);
      const endColIdx = monthIndex(barEnd);
      const isTodayInRange = startColIdx !== -1 && endColIdx !== -1 && todayColIdx >= startColIdx && todayColIdx <= endColIdx;
      const barColor = m.done ? C.teal : (isTodayInRange ? C.amber : '#CBD5E1');
      const textColor = m.done ? '#fff' : C.text2;
      const labelText = m.done ? `${m.name} ✓` : (isTodayInRange ? 'In Review' : 'Planned');

      // Progress: explicit m.progress wins; else done=100, in-progress=time-elapsed within range, pending=0
      let progressPct = typeof m.progress === 'number' ? m.progress
        : m.done ? 100
          : isTodayInRange ? Math.min(100, Math.max(0, ((today - barStart) / (barEnd - barStart || 1)) * 100))
            : 0;

      return (
        <div key={idx} className="tl-row">
          <div>
            <div className="tl-task-name">{m.name}</div>
            <div className="tl-task-sub">{m.done ? 'Done' : 'Pending'}</div>
          </div>
          {ganttMonths.map((gm, gi) => {
            const isToday = gi === todayColIdx;
            const inRange = startColIdx !== -1 && endColIdx !== -1 && gi >= startColIdx && gi <= endColIdx;
            let segLeft = 0, segWidth = 100;
            if (inRange) {
              const daysInCol = new Date(gm.year, gm.month + 1, 0).getDate();
              if (gi === startColIdx && startColIdx === endColIdx) {
                segLeft = ((barStart.getDate() - 1) / daysInCol) * 100;
                segWidth = ((barEnd.getDate() - barStart.getDate() + 1) / daysInCol) * 100;
              } else if (gi === startColIdx) {
                segLeft = ((barStart.getDate() - 1) / daysInCol) * 100;
                segWidth = 100 - segLeft;
              } else if (gi === endColIdx) {
                segWidth = (barEnd.getDate() / daysInCol) * 100;
              }
              segWidth = Math.max(segWidth, 6); // guarantee a visible sliver even for very short spans
            }
            return (
              <div key={gi} className="tl-grid-cell" style={{ position: 'relative' }}>
                {isToday && (
                  <div className="today-line" style={{ left: `${todayPct}%` }}></div>
                )}
                {inRange && (
                  <div className="tl-bar-wrap">
                    <div className="tl-bar" style={{ width: `${segWidth}%`, left: `${segLeft}%`, background: barColor, color: textColor }}>
                      {gi === startColIdx && (
                        <div className="tl-bar-fill" style={{ width: `${progressPct}%` }}></div>
                      )}
                      <span className="tl-bar-label">{gi === startColIdx ? labelText : ''}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    });

    return (
      <div>
        {/* Milestone Steps */}
        <div style={{ background: C.surface, border: "1.5px solid " + C.border, borderRadius: "16px", padding: 22, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text2, marginBottom: 18 }}>Milestone Progress</div>
          {milestones.length > 0 ? (
            <div className="steps-grid" style={{ gridTemplateColumns: `repeat(${milestones.length}, 1fr)` }}>
              {stepNodes}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: C.text3, fontSize: 13, padding: '12px 0' }}>
              No milestones defined for this project yet.
            </div>
          )}
        </div>

        {/* Gantt Chart */}
        <div className="timeline-card">
          <div className="tc-header">
            <div className="tc-title">
              Gantt Chart · {ganttMonths[0]?.label} {ganttMonths[0]?.year} – {ganttMonths[ganttMonths.length - 1]?.label} {ganttMonths[ganttMonths.length - 1]?.year}
            </div>
            <div className="tc-legend">
              <div className="tc-legend-item"><div className="tc-legend-dot" style={{ background: C.teal }}></div>Completed</div>
              <div className="tc-legend-item"><div className="tc-legend-dot" style={{ background: C.amber }}></div>Active</div>
              <div className="tc-legend-item"><div className="tc-legend-dot" style={{ background: '#CBD5E1' }}></div>Pending</div>
              <div className="tc-legend-item"><div className="tc-legend-dot" style={{ background: C.red }}></div>Today</div>
            </div>
          </div>
          <div className="timeline-scroll">
            <div className="timeline-wrap">
              <div className="tl-months">
                <div className="tl-month"></div>
                {ganttMonths.map((gm, gi) => (
                  <div key={gi} className="tl-month" style={{ position: 'relative', ...(gi === todayColIdx ? { color: C.teal, fontWeight: 800 } : {}) }}>
                    {gm.label}
                    {gi === todayColIdx && (
                      <div className="today-label" style={{ position: 'absolute', top: -18, left: `${todayPct}%`, transform: 'translateX(-50%)' }}>TODAY</div>
                    )}
                  </div>
                ))}
              </div>
              {milestones.length > 0 ? ganttRows : (
                <div style={{ padding: 20, textAlign: 'center', color: C.text3, fontSize: 13 }}>No milestones to display.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Files panel
  function renderFilesComponent() {
    return (
      <div className="files-panel">
        <div className="files-toolbar">
          {["All", "Designs", "Documents", "Reports", "Invoices"].map(filter => (
            <button key={filter} className={`ft-filter ${fileFilter === filter ? "active" : ""}`} onClick={() => setFileFilter(filter)}>
              {filter} ({filter === "All" ? allFiles.length : allFiles.filter(f => f.type === filter).length})
            </button>
          ))}
        </div>
        <div className="files-grid">
          {filteredFiles.map((file, idx) => (
            <div key={idx} className="file-card" onClick={() => {
              if (file.url) {
                window.open(file.url, "_blank");
              } else if (file.raw) {
                setSelectedDoc(file.raw);
              }
            }}>
              {file.badge && <span className="fc-new-badge">{file.badge}</span>}
              <div className="fc-download" onClick={(e) => {
                e.stopPropagation();
                if (file.url) {
                  const a = document.createElement("a");
                  a.href = file.url; a.download = file.name || "file";
                  a.target = "_blank";
                  document.body.appendChild(a); a.click(); document.body.removeChild(a);
                }
              }}><i className="ti ti-download"></i></div>
              <div className="fc-icon" style={{ background: file.bg, color: file.col }}><i className={`ti ${file.icon}`}></i></div>
              <div className="fc-name">{file.name}</div>
              {file.description && <div style={{ fontSize: 10, color: C.text3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{file.description}</div>}
              <div className="fc-meta">{file.meta}</div>
              <div className="fc-date">{file.date}</div>
            </div>
          ))}
          {filteredFiles.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", color: C.text3 }}>No files found.</div>
          )}
        </div>
      </div>
    );
  }

  // Render Invoices helper
  function renderInvoicesComponent() {
    const unpaidInvoices = finalInvoicesList.filter(inv => inv.status !== "paid");
    const firstUnpaid = unpaidInvoices[0];

    return (
      <div style={{ background: C.surface, border: "1.5px solid " + C.border, borderRadius: "16px", overflow: "hidden" }}>
        {/* Summary Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "14px 18px", background: C.surface2, borderBottom: "1px solid " + C.border, gap: 0 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "16px", fontWeight: "800", color: C.green }}>₹{totalPaid.toLocaleString("en-IN")}</div>
            <div style={{ fontSize: "10px", color: C.text3, fontWeight: "600", marginTop: "1px" }}>Paid</div>
          </div>
          <div style={{ textAlign: "center", borderLeft: "1px solid " + C.border, borderRight: "1px solid " + C.border }}>
            <div style={{ fontSize: "16px", fontWeight: "800", color: C.amber }}>₹{totalPending.toLocaleString("en-IN")}</div>
            <div style={{ fontSize: "10px", color: C.text3, fontWeight: "600", marginTop: "1px" }}>Pending</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "16px", fontWeight: "800", color: C.text }}>₹{totalInvoiced.toLocaleString("en-IN")}</div>
            <div style={{ fontSize: "10px", color: C.text3, fontWeight: "600", marginTop: "1px" }}>Total</div>
          </div>
        </div>

        {/* Invoices List */}
        <div>
          {finalInvoicesList.map((inv) => (
            <div key={inv.id} className="invoice-item" onClick={() => {
              if (inv.status !== "paid") {
                startPayment(inv);
              } else {
                alert("This invoice is already paid!");
              }
            }}>
              <div className="inv-icon" style={{ background: inv.status === "paid" ? C.greenBg : C.amberBg, color: inv.status === "paid" ? C.green : C.amber }}>
                <i className={inv.status === "paid" ? "ti ti-circle-check" : "ti ti-clock"}></i>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="inv-id">{inv.invoiceNo}</div>
                <div className="inv-desc">{inv.desc}</div>
              </div>
              <div style={{ textAlign: "right", marginRight: "10px" }}>
                <div className="inv-amount" style={{ color: inv.status === "paid" ? C.green : C.amber }}>
                  ₹{inv.total.toLocaleString("en-IN")}
                </div>
                <div className="inv-date">{inv.status === "paid" ? inv.date : `Due ${inv.dueDate}`}</div>
              </div>
              <span className={`badge ${inv.status}`}>{inv.status}</span>
              <div className="inv-dl" style={{ marginLeft: "8px" }} onClick={(e) => { e.stopPropagation(); }}>
                <i className="ti ti-download"></i>
              </div>
            </div>
          ))}
        </div>

        {/* Pay Now Button */}
        {firstUnpaid && (
          <div style={{ padding: "14px 18px", borderTop: "1px solid " + C.border, background: C.surface2 }}>
            <button onClick={() => startPayment(firstUnpaid)} style={{ width: "100%", padding: "11px", background: C.teal, color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: "0 3px 10px rgba(0,188,212,.25)" }}>
              <i className="ti ti-credit-card" style={{ fontSize: "15px" }}></i> Pay ₹{(firstUnpaid.total - firstUnpaid.amountPaid).toLocaleString("en-IN")} Now
            </button>
          </div>
        )}
      </div>
    );
  }

  // Render Messages / Chat helper
  function renderMessagesComponent() {
    const initials = clientName ? clientName.substring(0, 2).toUpperCase() : "CL";
    // If a document was clicked in Messages view, show document preview
    if (selectedDoc) {
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.surface, border: "1.5px solid " + C.border, borderRadius: "16px", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <button onClick={() => setSelectedDoc(null)} style={{ background: C.bg, border: "1px solid " + C.border, color: C.text2, padding: "8px 16px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700 }}>
              <i className="ti ti-arrow-left"></i> Back to Messages
            </button>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{selectedDoc.docType ? selectedDoc.docType.toUpperCase() : "Document"} Preview</div>
          </div>
          <div style={{ flex: 1, background: "#fff", borderRadius: 12, padding: "20px", overflowY: "auto", border: "1px solid " + C.border, minHeight: 350, color: "#333", fontSize: 13, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: selectedDoc.htmlContent || `<p>No HTML preview available. Standard attachment file: <b>${selectedDoc.fileName || "document.pdf"}</b></p>` }} />
        </div>
      );
    }

    return (
      <div className="messages-panel">
        <div className="msg-list">
          {chatMessages.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.text3, fontSize: 12, textAlign: "center", padding: "20px" }}>
              No messages yet. Say hello to start the conversation.
            </div>
          ) : (
            chatMessages.map((msg, idx) => (
              <div key={msg.id || idx} className={`msg-row ${msg.mine ? "mine" : ""}`}>
                <div className="msg-av" style={{ background: msg.mine ? "linear-gradient(135deg, " + C.amber + ", #D97706)" : "linear-gradient(135deg, " + C.teal + ", " + C.teal3 + ")" }}>
                  {msg.mine ? initials : "P"}
                </div>
                <div className="msg-body">
                  {!msg.mine && <div className="msg-name">{msg.sender}</div>}
                  <div className={`msg-bubble ${msg.mine ? "mine" : "them"}`}>
                    {msg.msg}
                    {msg.attachmentUrl && (
                      <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: msg.msg ? 8 : 0, fontSize: 12, fontWeight: 700, color: "inherit", textDecoration: "underline" }}>
                        <i className="ti ti-paperclip"></i> {msg.attachmentName || "Attachment"}
                      </a>
                    )}
                  </div>
                  <div className="msg-time">{msg.time}</div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="msg-input-row">
          <label className="msg-attach" style={{ opacity: attachUploading ? 0.5 : 1, pointerEvents: attachUploading ? "none" : "auto" }}>
            <i className={attachUploading ? "ti ti-loader-2" : "ti ti-paperclip"}></i>
            <input type="file" style={{ display: "none" }} onChange={handleAttachFile} />
          </label>
          <input className="msg-inp" type="text" placeholder="Type a message…" value={chatText} onChange={(e) => setChatText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} />
          <button className="msg-send" onClick={() => handleSendMessage()}><i className="ti ti-send"></i></button>
        </div>
      </div>
    );
  }

  // Render Calendar helper
  function renderCalendarComponent() {
    const calendarDays = getCalendarDays();
    const today = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthLabel = currentDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

    // Filter meetings for current displayed month
    const monthMeetings = meetings.filter(m => {
      const d = new Date(m.date || m.scheduledAt || m.meetingDate || "");
      return !isNaN(d) && d.getFullYear() === year && d.getMonth() === month;
    });

    return (
      <div className="calendar-panel">
        <div className="cal-header">
          <div className="cal-month">{monthLabel}</div>
          <div className="cal-nav">
            <div className="cal-nav-btn" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}><i className="ti ti-chevron-left"></i></div>
            <div className="cal-nav-btn" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}><i className="ti ti-chevron-right"></i></div>
          </div>
        </div>
        <div className="cal-grid">
          <div className="cal-days-header">
            <div className="cal-day-label">Su</div><div className="cal-day-label">Mo</div><div className="cal-day-label">Tu</div>
            <div className="cal-day-label">We</div><div className="cal-day-label">Th</div><div className="cal-day-label">Fr</div><div className="cal-day-label">Sa</div>
          </div>
          <div className="cal-days">
            {calendarDays.map((dayObj, idx) => {
              const eventClass = getEventClass(dayObj.day, dayObj.isOtherMonth);
              const isSelected = selectedDay === dayObj.day && !dayObj.isOtherMonth;
              const isToday = dayObj.day === today.getDate() && !dayObj.isOtherMonth && month === today.getMonth() && year === today.getFullYear();
              return (
                <div key={idx} className={`cal-day ${dayObj.isOtherMonth ? "other-month" : ""} ${isToday ? "today" : ""} ${eventClass} ${isSelected ? "selected" : ""}`}
                  onClick={() => !dayObj.isOtherMonth && setSelectedDay(dayObj.day)}>
                  {dayObj.day}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ padding: "0 14px 8px", fontSize: 10, fontWeight: 700, color: C.text3, textTransform: "uppercase", letterSpacing: .6 }}>Upcoming Meetings</div>
        <div className="meetings-list">
          {monthMeetings.length === 0 ? (
            <div style={{ padding: '10px 14px', fontSize: 12, color: C.text3, textAlign: 'center' }}>No meetings scheduled this month.</div>
          ) : (
            monthMeetings.map((meet, i) => {
              const meetDate = new Date(meet.date || meet.scheduledAt || meet.meetingDate || "");
              const timeStr = !isNaN(meetDate) ? meetDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : (meet.time || '—');
              const dateStr = !isNaN(meetDate) ? meetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
              return (
                <div key={meet._id || i} className="meeting-item" onClick={() => meet.meetLink ? window.open(meet.meetLink, '_blank') : alert(`Meeting: ${meet.title || meet.subject}`)}>
                  <div className="mi-time-col">
                    <div className="mi-time">{timeStr}</div>
                    <div className="mi-dur">{meet.duration || '1h'}</div>
                  </div>
                  <div className="mi-divider"></div>
                  <div style={{ flex: 1 }}>
                    <div className="mi-title">{meet.title || meet.subject || 'Meeting'}</div>
                    <div className="mi-meta">{dateStr} · {meet.platform || 'Google Meet'} · {meet.attendees || ''}</div>
                  </div>
                  {meet.meetLink && <div className="mi-join"><i className="ti ti-video" style={{ fontSize: 12 }}></i> Join</div>}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Render Approvals helper
  function renderApprovalsComponent() {
    return (
      <div style={{ background: C.surface, border: "1.5px solid " + C.border, borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid " + C.border, fontSize: 12, fontWeight: 800, color: C.text2, background: C.surface2 }}>Pending Approvals</div>
        <div>
          {approvals.map((app) => (
            <div key={app.id} className="approval-item" style={{ flexWrap: 'wrap' }}>
              <div className="ai-icon"><i className={`ti ${app.icon}`}></i></div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div className="ai-title">{app.title}</div>
                <div className="ai-desc">{app.desc}</div>
                {app.senderName && <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>From {app.senderName}</div>}
              </div>
              <div className="ai-actions">
                <button className="ai-btn" onClick={() => setViewApprovalApp(app)}>View</button>
                <button className="ai-btn approve" onClick={() => handleApprove(app.id)}>
                  <i className="ti ti-check" style={{ fontSize: 12 }}></i> {app.approveLabel || "Approve"}
                </button>
                <button className="ai-btn reject" onClick={() => { setRejectModalApp(app); setRejectReasonText(""); }}>{app.rejectLabel || "Reject"}</button>
              </div>
            </div>
          ))}
          {approvals.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: C.text3, fontSize: 12 }}>No pending approvals. All caught up!</div>
          )}
        </div>

        {viewApprovalApp && (
          <div className="modal-overlay" onClick={() => setViewApprovalApp(null)}>
            <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div className="modal-header">
                <span className="modal-title">{viewApprovalApp.title}</span>
                <button className="modal-close" onClick={() => setViewApprovalApp(null)}>&times;</button>
              </div>
              <div className="modal-body">
                <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.6 }}>{viewApprovalApp.desc || "No additional details provided."}</div>
                {viewApprovalApp.senderName && <div style={{ fontSize: 12, color: C.text3 }}>Requested by {viewApprovalApp.senderName}</div>}

                {viewApprovalApp.fileUrl && (() => {
                  const fname = (viewApprovalApp.fileName || viewApprovalApp.fileUrl || "").toLowerCase();
                  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/.test(fname);
                  const isPdf = /\.pdf$/.test(fname);
                  return (
                    <div style={{ marginTop: 10, border: "1.5px solid " + C.border, borderRadius: 12, overflow: "hidden", background: C.surface2 }}>
                      {isImage ? (
                        <img
                          src={viewApprovalApp.fileUrl}
                          alt={viewApprovalApp.fileName || "Attached file"}
                          style={{ width: "100%", maxHeight: 420, objectFit: "contain", display: "block", background: "#000" }}
                        />
                      ) : isPdf ? (
                        <iframe
                          src={viewApprovalApp.fileUrl}
                          title={viewApprovalApp.fileName || "Attached PDF"}
                          style={{ width: "100%", height: 420, border: "none", display: "block" }}
                        />
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 16px", gap: 8 }}>
                          <i className="ti ti-file-text" style={{ fontSize: 36, color: C.teal }}></i>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{viewApprovalApp.fileName || "Attached file"}</div>
                          <div style={{ fontSize: 11, color: C.text3 }}>Preview not available for this file type</div>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderTop: "1px solid " + C.border }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}>
                          <i className="ti ti-paperclip" style={{ marginRight: 5 }}></i>{viewApprovalApp.fileName || "Attached file"}
                        </span>
                        <a href={viewApprovalApp.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: C.teal, textDecoration: "none", whiteSpace: "nowrap" }}>
                          Open <i className="ti ti-external-link" style={{ marginLeft: 3 }}></i>
                        </a>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {rejectModalApp && (
          <div className="modal-overlay" onClick={() => setRejectModalApp(null)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Reject "{rejectModalApp.title}"</span>
                <button className="modal-close" onClick={() => setRejectModalApp(null)}>&times;</button>
              </div>
              <div className="modal-body">
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text2 }}>Reason for rejection *</div>
                <textarea
                  value={rejectReasonText}
                  onChange={e => setRejectReasonText(e.target.value)}
                  rows={4}
                  placeholder="Please explain what needs to change..."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1.5px solid " + C.border, fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box" }}
                />
                <button onClick={submitRejection} style={{ width: "100%", padding: "11px", background: C.red, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Submit Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  // ── OVERVIEW SECTION ─────────────────────────────────────────
  function renderOverviewSection() {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => {
      const s = (p.status || '').toLowerCase();
      return s === 'active' || s === 'in progress' || s === 'pending';
    }).length;
    const completedProjects = projects.filter(p => {
      const s = (p.status || '').toLowerCase();
      return s === 'completed' || s === 'done';
    }).length;

    // Overall progress = average of all project progress values
    const overallProgress = totalProjects > 0
      ? Math.round(projects.reduce((sum, p) => {
        const s = (p.status || '').toLowerCase();
        const pct = p.progress ?? 0;
        return sum + pct;
      }, 0) / totalProjects)
      : 0;

    // Recent updates: project updates + notifications, newest first
    // Only show updates explicitly sent to 'client'
    const recentUpdates = [
      ...projects.flatMap(p =>
        (p.updates || [])
          .filter(u => !u.visibleTo || u.visibleTo.includes('client'))
          .map(u => ({
            text: u.text || u.title || `Update on ${p.name}`,
            date: u.date ? new Date(u.date) : null,
            icon: 'ti-speakerphone',
            color: C.teal,
            bg: C.tealLight,
            project: p.name,
          }))
      ),
      ...notifs.map(n => ({
        text: n.message || n.title || 'New notification',
        date: n.createdAt ? new Date(n.createdAt) : null,
        icon: 'ti-bell',
        color: C.purple,
        bg: C.purpleBg,
        project: null,
      })),
      ...tasks
        .filter(t => t.status === 'Done' || t.status === 'Completed')
        .map(t => ({
          text: `Task completed: ${t.title || t.name}`,
          date: t.updatedAt ? new Date(t.updatedAt) : (t.createdAt ? new Date(t.createdAt) : null),
          icon: 'ti-circle-check',
          color: C.green,
          bg: C.greenBg,
          project: t.project || null,
        })),
    ]
      .filter(u => u.date)
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);

    const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const statCards = [
      {
        label: 'Total Projects',
        value: totalProjects,
        icon: 'ti-folder',
        color: C.teal,
        bg: C.tealLight,
        sub: `${completedProjects} completed`,
      },
      {
        label: 'Active Projects',
        value: activeProjects,
        icon: 'ti-player-play',
        color: C.blue,
        bg: C.blueBg,
        sub: 'Currently running',
      },
      {
        label: 'Completed',
        value: completedProjects,
        icon: 'ti-circle-check',
        color: C.green,
        bg: C.greenBg,
        sub: `${totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0}% success rate`,
      },
      {
        label: 'Overall Progress',
        value: `${overallProgress}%`,
        icon: 'ti-chart-line',
        color: C.amber,
        bg: C.amberBg,
        sub: 'Across all projects',
      },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Stat Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 16,
        }}>
          {statCards.map((card, i) => (
            <div key={i} onClick={() => setActive('projects')} style={{
              background: C.surface,
              border: `1.5px solid ${C.border}`,
              borderRadius: 16,
              padding: '20px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              transition: 'all .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,188,212,.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: card.bg, color: card.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>
                <i className={`ti ${card.icon}`}></i>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: C.text, lineHeight: 1 }}>
                {card.value}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text2 }}>{card.label}</div>
                <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{card.sub}</div>
              </div>
            </div>
          ))}
        </div>



      </div>
    );
  }
  // Render Activity Feed helper
  function renderActivityFeed() {
    // Build from backend: project updates + notifications
    const proj = projects[0];
    const projUpdates = (proj?.updates || [])
      .filter(upd => !upd.visibleTo || upd.visibleTo.includes('client'))
      .slice(0, 3).map((upd, i) => ({
        id: 'upd-' + i,
        title: upd.text || upd.title || 'Project update posted',
        time: upd.date ? new Date(upd.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '',
        icon: 'ti-speakerphone'
      }));
    const notifItems = notifs.slice(0, 3).map((n, i) => ({
      id: 'notif-' + i,
      title: n.message || n.title || 'Notification',
      time: n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '',
      icon: 'ti-bell'
    }));
    const feedItems = [...projUpdates, ...notifItems].slice(0, 4);

    return (
      <div className="activity-feed">
        <div style={{ fontSize: 12, fontWeight: 800, color: C.text2, marginBottom: 14 }}>Recent Activity</div>
        {feedItems.length === 0 ? (
          <div style={{ fontSize: 12, color: C.text3, textAlign: 'center', padding: '12px 0' }}>No recent activity.</div>
        ) : (
          feedItems.map((item) => (
            <div key={item.id} className="af-item" onClick={() => setActive('timeline')} style={{ cursor: 'pointer' }}>
              <div className="af-dot-col">
                <div className="af-dot"><i className={`ti ${item.icon}`}></i></div>
                <div className="af-line"></div>
              </div>
              <div>
                <div className="af-title">{item.title}</div>
                <div className="af-time"><i className="ti ti-clock" style={{ fontSize: 12 }}></i> {item.time}</div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // Render Feedback helper
  function renderFeedbackPanel() {
    return (
      <div className="feedback-panel">
        <div style={{ fontSize: 12, fontWeight: 800, color: C.text2, marginBottom: 4 }}>Rate Our Services</div>
        <form onSubmit={submitFeedback}>
          <div className="rating-row">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={`star ${feedbackRating >= star ? "active" : ""}`} onClick={() => setFeedbackRating(star)}>

              </span>
            ))}
          </div>
          <textarea className="feedback-input" placeholder="Tell us how we can improve…" value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} required></textarea>
          <button className="feedback-submit" type="submit">Submit Feedback</button>
        </form>
      </div>
    );
  }

  // Render Contact Card helper
  function renderContactCard() {
    const proj = projects[0];
    const managerName = proj?.manager || proj?.contactPersonName || 'Project Manager';
    const managerPhone = proj?.contactPersonNo || proj?.managerPhone || '';
    const managerEmail = proj?.managerEmail || proj?.contactEmail || '';
    return (
      <div className="contact-card">
        <div className="cc-label">Your Account Manager</div>
        <div className="cc-name">{managerName}</div>
        <div className="cc-role">{proj?.managerRole || `Project Lead, ${agencyName}`}</div>
        <div className="cc-contacts">
          {managerEmail && <div className="cc-contact-row"><i className="ti ti-mail"></i> {managerEmail}</div>}
          {managerPhone && <div className="cc-contact-row"><i className="ti ti-phone"></i> {managerPhone}</div>}
          {!managerEmail && !managerPhone && <div className="cc-contact-row" style={{ opacity: 0.6 }}><i className="ti ti-info-circle"></i> Contact details not set</div>}
        </div>
        <div className="cc-actions">
          <button className="cc-btn" onClick={() => setActive("messages")}><i className="ti ti-message-2"></i> Chat</button>
          <button className="cc-btn" onClick={() => managerPhone ? window.open('tel:' + managerPhone) : alert("Phone not available")}><i className="ti ti-phone-call"></i> Call</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-root">
      <style>{CSS}</style>
      {renderTopNav()}
      {renderHero()}

      {/* Main Container */}
      <div className="page-body">

        {active === "dashboard" && (
          <>
            {/* Overview */}
            <div>
              <div className="sec-header">
                <div className="sec-title">
                  <div className="sec-title-icon" style={{ background: C.tealLight, color: C.teal }}><i className="ti ti-layout-dashboard"></i></div>
                  Overview
                </div>
              </div>
              {renderOverviewSection()}
            </div>

            {/* Timeline */}
            <div>
              <div className="sec-header"><div className="sec-title" onClick={() => setActive('timeline')} style={{ cursor: 'pointer' }}>
                <div className="sec-title-icon" style={{ background: C.tealLight, color: C.teal }}><i className="ti ti-calendar-stats"></i></div>
                Project Timeline
              </div>
                <div className="sec-action" onClick={() => setActive('timeline')}>
                  <i className="ti ti-arrow-right" style={{ fontSize: 13 }}></i> View Full
                </div>
              </div>
              <div className="two-col">
                {renderTimelineComponent()}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {renderApprovalsComponent()}
                  {renderCalendarComponent()}
                </div>
              </div>
            </div>

            {/* Files & Documents */}
            <div>
              <div className="sec-header">
                <div className="sec-title" onClick={() => setActive('files')} style={{ cursor: 'pointer' }}>
                  <div className="sec-title-icon" style={{ background: C.blueBg, color: C.blue }}><i className="ti ti-files"></i></div>
                  Files & Documents
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div className="sec-action" onClick={handleRefresh} style={{ opacity: refreshing ? 0.6 : 1 }}>
                    <i className={`ti ${refreshing ? "ti-loader-2" : "ti-refresh"}`} style={{ fontSize: 13, animation: refreshing ? "spin 1s linear infinite" : "none" }}></i>
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </div>
                  <div className="sec-action" onClick={async () => {
                    const links = allFiles.map(f => f.url).filter(Boolean);
                    if (links.length === 0) return;
                    if (links.length === 1) {
                      const a = document.createElement("a");
                      a.href = links[0];
                      a.download = allFiles[0]?.name || "file";
                      document.body.appendChild(a); a.click(); document.body.removeChild(a);
                      return;
                    }
                    for (let i = 0; i < links.length; i++) {
                      try {
                        const res = await fetch(links[i]);
                        const blob = await res.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = blobUrl;
                        a.download = allFiles[i]?.name || `file_${i + 1}`;
                        document.body.appendChild(a); a.click();
                        document.body.removeChild(a);
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                        await new Promise(r => setTimeout(r, 800));
                      } catch (e) {
                        window.open(links[i], "_blank");
                        await new Promise(r => setTimeout(r, 800));
                      }
                    }
                  }}>
                    <i className="ti ti-download" style={{ fontSize: 13 }}></i> Download All
                  </div>
                </div>
              </div>
              {renderFilesComponent()}
            </div>

            {/* Invoices and Messages */}
            <div className="two-col">
              {/* Invoices */}
              <div>
                <div className="sec-header">
                  <div className="sec-title" onClick={() => setActive('payments')} style={{ cursor: 'pointer' }}>
                    <div className="sec-title-icon" style={{ background: C.greenBg, color: C.green }}><i className="ti ti-receipt-2"></i></div>
                    Invoices & Payments
                  </div>
                  <div className="sec-action" onClick={() => setActive('payments')}>
                    <i className="ti ti-arrow-right" style={{ fontSize: 13 }}></i> View All
                  </div>
                </div>
                {renderInvoicesComponent()}
              </div>

              {/* Messages */}
              <div>
                <div className="sec-header">
                  <div className="sec-title">
                    <div className="sec-title-icon" style={{ background: C.purpleBg, color: C.purple }}><i className="ti ti-message-2"></i></div>
                    Messages & Chat
                  </div>
                  <div className="sec-action" onClick={() => setActive("messages")}><i className="ti ti-arrow-right" style={{ fontSize: 13 }}></i> Open Chat</div>
                </div>
                {renderMessagesComponent()}
              </div>
            </div>

            {/* Activity, Feedback and Contact */}
            <div className="three-col">
              {renderActivityFeed()}
              {renderFeedbackPanel()}
              {renderContactCard()}
            </div>
          </>
        )}

        {active === "timeline" && (
          <div>
            <div className="sec-header">
              <div className="sec-title">
                <div className="sec-title-icon" style={{ background: C.tealLight, color: C.teal }}><i className="ti ti-calendar-stats"></i></div>
                Project Timeline & Gantt Detail
              </div>
            </div>
            <div className="two-col">
              {renderTimelineComponent()}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {renderApprovalsComponent()}
                {renderCalendarComponent()}
              </div>
            </div>
          </div>
        )}

        {active === "files" && (
          <div>
            <div className="sec-header">
              <div className="sec-title">
                <div className="sec-title-icon" style={{ background: C.blueBg, color: C.blue }}><i className="ti ti-files"></i></div>
                Files & Documents Checklist
              </div>
              <div className="sec-action" onClick={async () => {
                const links = allFiles.map(f => f.url).filter(Boolean);
                if (links.length === 0) return;
                // Single file  direct download
                if (links.length === 1) {
                  const a = document.createElement("a");
                  a.href = links[0];
                  a.download = allFiles[0]?.name || "file";
                  document.body.appendChild(a); a.click(); document.body.removeChild(a);
                  return;
                }
                // Multiple files  fetch as blob and download one by one
                for (let i = 0; i < links.length; i++) {
                  try {
                    const res = await fetch(links[i]);
                    const blob = await res.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = blobUrl;
                    a.download = allFiles[i]?.name || `file_${i + 1}`;
                    document.body.appendChild(a); a.click();
                    document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                    await new Promise(r => setTimeout(r, 800));
                  } catch (e) {
                    // Open in a new tab if there is a CORS issue
                    window.open(links[i], "_blank");
                    await new Promise(r => setTimeout(r, 800));
                  }
                }
              }}>
                <i className="ti ti-download" style={{ fontSize: 13 }}></i> Download All
              </div>
            </div>
            {renderFilesComponent()}
          </div>
        )}

        {active === "proposals" && (
          <div>
            <div className="sec-header">
              <div className="sec-title">
                <div className="sec-title-icon" style={{ background: "#EDE9FE", color: "#7C3AED" }}><i className="ti ti-presentation"></i></div>
                Project Proposals
              </div>
              <div style={{ fontSize: 12, color: C.text3, fontWeight: 600 }}>{proposals.length} proposal{proposals.length !== 1 ? "s" : ""} received</div>
            </div>
            {proposals.length === 0 ? (
              <div style={{ background: C.surface, border: "1.5px solid " + C.border, borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 6 }}>No Proposals Yet</div>
                <div style={{ fontSize: 13, color: C.text3 }}>Project proposals sent to you will appear here.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {proposals.map((prop, idx) => {
                  const st = (prop.status || "sent").toLowerCase();
                  const statusMap = {
                    sent: { bg: "#EFF4FF", color: "#2563EB", label: "Sent" },
                    pending: { bg: "#FEF3C7", color: "#B45309", label: "Under Review" },
                    approved: { bg: "#DCFCE7", color: "#15803D", label: "Approved" },
                    rejected: { bg: "#FEE2E2", color: "#DC2626", label: "Rejected" },
                  };
                  const badge = statusMap[st] || statusMap.sent;
                  const sentDate = prop.sentAt || prop.submittedAt || prop.updatedAt;
                  return (
                    <div key={prop._id || idx} style={{ background: C.surface, border: "1.5px solid " + C.border, borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", gap: 18, boxShadow: "0 2px 10px rgba(0,0,0,.04)" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EDE9FE", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                        <i className="ti ti-presentation"></i>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{prop.title || "Untitled Proposal"}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                          {prop.value && (
                            <span style={{ fontSize: 12, fontWeight: 700, color: C.teal }}>
                              <i className="ti ti-currency-rupee" style={{ fontSize: 11 }}></i> {Number(prop.value).toLocaleString()}
                            </span>
                          )}
                          {sentDate && (
                            <span style={{ fontSize: 11, color: C.text3, fontWeight: 600 }}>
                              <i className="ti ti-clock" style={{ fontSize: 11 }}></i> {new Date(sentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          )}
                          {prop.rejectNote && st === "rejected" && (
                            <span style={{ fontSize: 11, color: "#DC2626", fontWeight: 600 }}>Note: {prop.rejectNote}</span>
                          )}
                          {prop.clientSignature && (
                            <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>
                              <i className="ti ti-writing" style={{ fontSize: 11 }}></i> Signed by client
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <span style={{ background: badge.bg, color: badge.color, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 800 }}>{badge.label}</span>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => setViewingProposal(prop)}
                            style={{ background: C.tealLight, color: C.teal, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                            <i className="ti ti-eye" style={{ fontSize: 13 }}></i> View
                          </button>
                          <button
                            onClick={() => printProposal(prop)}
                            style={{ background: C.surface2, color: C.text2, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, border: "1.5px solid " + C.border, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                            <i className="ti ti-printer" style={{ fontSize: 13 }}></i> PDF
                          </button>
                          <button
                            onClick={() => shareProposalAsPDF(prop, agencyName, null)}
                            style={{ background: C.surface2, color: C.text2, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, border: "1.5px solid " + C.border, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                            <i className="ti ti-share" style={{ fontSize: 13 }}></i> Share
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {active === "payments" && (
          <div>
            <div className="sec-header">
              <div className="sec-title">
                <div className="sec-title-icon" style={{ background: C.greenBg, color: C.green }}><i className="ti ti-receipt-2"></i></div>
                Invoices & Payments History
              </div>
            </div>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              {renderInvoicesComponent()}
            </div>
          </div>
        )}

        {active === "quotations" && (
          <div>
            <div className="sec-header">
              <div className="sec-title">
                <div className="sec-title-icon" style={{ background: C.tealLight, color: C.teal }}><i className="ti ti-file-invoice"></i></div>
                My Quotations
              </div>
            </div>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              {quotations.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px", color: C.text3 }}>
                  <i className="ti ti-file-invoice" style={{ fontSize: 44, display: "block", marginBottom: 14, opacity: 0.35 }}></i>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No quotations yet</div>
                  <div style={{ fontSize: 13 }}>When your service provider sends you a quotation, it will appear here.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {quotations.map((q) => {
                    const qt = q.qt || {};
                    const items = q.items || [];
                    const subtotal = items.reduce((s, i) => s + (parseFloat(i.rate) || 0) * (parseFloat(i.quantity || i.qty) || 1), 0);
                    const total = q.total || subtotal;
                    const quoteDate = qt.quoteDate || qt.date || q.date || "";
                    const validity = qt.validity || "30";
                    const overview = qt.overview || qt.description || "";
                    const notes = qt.notes || qt.terms || "";
                    return (
                      <div key={q.id} style={{ background: C.surface, border: "1.5px solid " + C.border, borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,188,212,0.06)" }}>

                        {/* Header */}
                        <div style={{ background: C.tealLighter, padding: "14px 18px", borderBottom: "1px solid " + C.border, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: C.teal }}>#{q.quoteNo}</div>
                            {(q.project || qt.title) && <div style={{ fontSize: 12, color: C.text2, marginTop: 3, fontWeight: 600 }}>{q.project || qt.title}</div>}
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ background: C.teal, color: "#fff", borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "3px 12px" }}>Sent</span>
                            {quoteDate && <div style={{ fontSize: 11, color: C.text3, marginTop: 5 }}>{new Date(quoteDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>}
                          </div>
                        </div>

                        {/* Overview */}
                        {overview && (
                          <div style={{ padding: "10px 18px", background: C.surface2, borderBottom: "1px solid " + C.border, fontSize: 12, color: C.text2, lineHeight: 1.7 }}>
                            {overview}
                          </div>
                        )}

                        {/* Line Items */}
                        <div style={{ padding: "14px 18px" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>Items / Services</div>
                          {items.map((item, idx) => {
                            const qty = parseFloat(item.quantity || item.qty) || 1;
                            const rate = parseFloat(item.rate) || 0;
                            return (
                              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: idx < items.length - 1 ? "1px solid " + C.border : "none", fontSize: 13 }}>
                                <span style={{ color: C.text, fontWeight: 600 }}>{item.description || item.desc || "—"}</span>
                                <span style={{ color: C.text2, fontSize: 12 }}>
                                  {qty} × ₹{rate.toLocaleString("en-IN")}
                                  <span style={{ fontWeight: 800, color: C.text, marginLeft: 12 }}>₹{(qty * rate).toLocaleString("en-IN")}</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Total + Validity */}
                        <div style={{ padding: "12px 18px", borderTop: "2px solid " + C.tealLight, background: C.surface2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                          <div style={{ fontSize: 11, color: C.amber, fontWeight: 700, background: C.amberBg, padding: "4px 12px", borderRadius: 8, borderLeft: "3px solid " + C.amber }}>
                            ⏰ Valid for {validity === "Custom" ? "custom period" : `${validity} days`} from issue
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 11, color: C.text3 }}>Total Quoted</div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: C.teal }}>₹{total.toLocaleString("en-IN")}</div>
                          </div>
                        </div>

                        {/* Notes */}
                        {notes && (
                          <div style={{ padding: "10px 18px", borderTop: "1px solid " + C.border, fontSize: 11, color: C.text3, lineHeight: 1.7 }}>
                            <span style={{ fontWeight: 700, color: C.teal2 }}>Notes: </span>{notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {active === "messages" && (
          <div>
            <div className="sec-header">
              <div className="sec-title">
                <div className="sec-title-icon" style={{ background: C.purpleBg, color: C.purple }}><i className="ti ti-message-2"></i></div>
                Messages & Received Documents
              </div>
            </div>
            <div className="two-col">
              {renderMessagesComponent()}
              {renderFilesComponent()}
            </div>
          </div>
        )}

        {active === "calendar" && (
          <div>
            <div className="sec-header">
              <div className="sec-title">
                <div className="sec-title-icon" style={{ background: C.amberBg, color: C.amber }}><i className="ti ti-calendar-event"></i></div>
                Meeting Schedule & Business Calendar
              </div>
              <button className="sec-action" onClick={() => alert("Request meeting slot modal opened.")}>
                <i className="ti ti-plus" style={{ fontSize: 13 }}></i> Request Meeting
              </button>
            </div>
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              {renderCalendarComponent()}
            </div>
          </div>
        )}

        {active === "projects" && !selectedClientProject && (
          <div>
            <div className="sec-header">
              <div className="sec-title">
                <div className="sec-title-icon" style={{ background: C.tealLight, color: C.teal }}><i className="ti ti-layout-kanban"></i></div>
                My Projects
              </div>
              <div style={{ fontSize: 12, color: C.text3, fontWeight: 600 }}>{projects.length} project{projects.length !== 1 ? 's' : ''} assigned to you</div>
            </div>
            {projects.length === 0 ? (
              <div style={{ background: C.surface, border: '1.5px solid ' + C.border, borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 6 }}>No Projects Yet</div>
                <div style={{ fontSize: 13, color: C.text3 }}>Projects assigned to your account will appear here.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
                {projects.map((proj, idx) => {
                  const s = (proj.status || '').toLowerCase();
                  const isDone = s === 'done' || s === 'completed';
                  const isHold = s.includes('hold');
                  const pct = proj.progress || (isDone ? 100 : s === 'in progress' ? 55 : 20);
                  const statusColor = isDone ? C.green : isHold ? C.amber : C.teal;
                  const statusBg = isDone ? C.greenBg : isHold ? C.amberBg : C.tealLight;
                  const endD = proj.end ? new Date(proj.end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : proj.deadline || '—';
                  return (
                    <div key={proj._id || idx}
                      onClick={() => setSelectedClientProject(proj)}
                      style={{ background: C.surface, border: '1.5px solid ' + C.border, borderRadius: 16, padding: '20px 22px', cursor: 'pointer', transition: 'all .2s', boxShadow: '0 2px 12px rgba(0,188,212,.06)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,188,212,.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,188,212,.06)'; e.currentTarget.style.transform = 'none'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{proj.name || 'Unnamed Project'}</div>
                          <div style={{ fontSize: 12, color: C.text3, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <i className="ti ti-tag" style={{ fontSize: 11 }}></i>
                            {proj.purpose || proj.category || 'Project'}
                          </div>
                        </div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: statusBg, color: statusColor, flexShrink: 0, marginLeft: 10 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block' }}></span>
                          {proj.status || 'Active'}
                        </span>
                      </div>
                      {proj.description && (
                        <div style={{ fontSize: 12, color: C.text2, marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{proj.description}</div>
                      )}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 11, color: C.text3, fontWeight: 600 }}>Progress</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: C.teal }}>{pct}%</span>
                        </div>
                        <div style={{ background: C.border, borderRadius: 20, height: 7, overflow: 'hidden' }}>
                          <div style={{ width: pct + '%', height: '100%', borderRadius: 20, background: 'linear-gradient(90deg, ' + C.teal + ', ' + C.teal2 + ')', transition: 'width .4s ease' }}></div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.text3, fontWeight: 600 }}>
                          <i className="ti ti-calendar" style={{ fontSize: 12 }}></i>
                          {endD}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: C.teal }}>
                          View Details <i className="ti ti-arrow-right" style={{ fontSize: 13 }}></i>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {active === "projects" && selectedClientProject && (
          <ModernProjectDetails
            project={{
              ...selectedClientProject,
              contactEmail: selectedClientProject.contactEmail || user?.email || "",
              contactPersonName: selectedClientProject.contactPersonName || "",
              contactPersonNo: selectedClientProject.contactPersonNo || user?.phone || "",
            }}
            tasks={tasks.filter(t =>
              String(t.projectId || t.project) === String(selectedClientProject._id || selectedClientProject.id)
            )}
            user={user}
            onBack={() => setSelectedClientProject(null)}
            onMessageTeam={() => setActive("messages")}
            fetchProjects={async () => {
              try {
                const myClientId = portalMode
                  ? (portalClientId || user?._id || user?.id || "")
                  : (user?._id || user?.id || "");
                const res = await axios.get(`${BASE_URL}/api/projects/client/${encodeURIComponent(clientName)}?company=${encodeURIComponent(clientCompany)}&clientId=${encodeURIComponent(myClientId)}`, {
                  headers: { 'x-company-id': user?.companyId || "" }
                });
                setProjects(res.data || []);
              } catch (e) { console.error(e); }
            }}
            fetchTasks={async () => {
              try {
                const myClientId = portalMode
                  ? (portalClientId || user?._id || user?.id || "")
                  : (user?._id || user?.id || "");
                const res = await axios.get(`${BASE_URL}/api/tasks/client/${encodeURIComponent(clientName)}?clientId=${encodeURIComponent(myClientId)}`, {
                  headers: { 'x-company-id': user?.companyId || "" }
                });
                setTasks(res.data || []);
              } catch (e) { console.error(e); }
            }}
          />
        )}
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="mobile-bottom-nav">
        <div className="mbn-inner">
          <button className={`mbn-item ${active === "dashboard" ? "active" : ""}`} onClick={() => setActive("dashboard")}>
            <i className="ti ti-layout-dashboard"></i>
            <div className="mbn-label">Overview</div>
          </button>
          <button className={`mbn-item ${active === "projects" ? "active" : ""}`} onClick={() => setActive("projects")}>
            <i className="ti ti-layout-kanban"></i>
            <div className="mbn-label">Projects</div>
          </button>
          <button className={`mbn-item ${active === "files" ? "active" : ""}`} onClick={() => setActive("files")}>
            <i className="ti ti-files"></i>
            <div className="mbn-label">Files</div>
          </button>
          <button className={`mbn-item ${active === "payments" ? "active" : ""}`} onClick={() => setActive("payments")}>
            <i className="ti ti-receipt-2"></i>
            <div className="mbn-label">Invoices</div>
          </button>
          <button className={`mbn-item ${active === "messages" ? "active" : ""}`} onClick={() => setActive("messages")}>
            <i className="ti ti-message-2"></i>
            <div className="mbn-label">Messages</div>
          </button>
        </div>
      </div>
      {/* PROPOSAL VIEWER MODAL */}
      {viewingProposal && (
        <ProposalViewerModal
          proposal={viewingProposal}
          clientName={clientName}
          BASE_URL={BASE_URL}
          onClose={() => setViewingProposal(null)}
          onSigned={(updated) => {
            setProposals(prev => prev.map(p => (p._id === updated._id ? updated : p)));
            setViewingProposal(updated);
          }}
        />
      )}
      {/* PAYMENT MODAL (CHECKOUT DIALOG OVERLAY) */}
      {payModalOpen && paymentInvoice && (
        <div className="modal-overlay" onClick={() => setPayModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Complete Payment</span>
              <button className="modal-close" onClick={() => setPayModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ background: C.surface2, border: "1px solid " + C.border, borderRadius: 10, padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.text3, textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Amount Due</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: C.text, margin: "6px 0", fontFamily: "Nunito Sans" }}>
                  ₹{(paymentInvoice.total - (paymentInvoice.amountPaid || 0)).toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: 11, color: C.text2 }}>Invoice {paymentInvoice.invoiceNo}</div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 800, color: C.text2, marginTop: 4 }}>Select Payment Method</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: "1.5px solid " + C.teal, borderRadius: 10, cursor: "pointer", background: C.tealLighter }}>
                  <i className="ti ti-brand-google-play" style={{ fontSize: 20, color: C.teal }}></i>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.text }}>Google Pay / UPI</div>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: C.teal, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }}></div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: "1.5px solid " + C.border, borderRadius: 10, cursor: "pointer", opacity: 0.6 }} onClick={() => alert("Credit Card payment option is simulated. Please use Google Pay/UPI.")}>
                  <i className="ti ti-credit-card" style={{ fontSize: 20, color: C.text2 }}></i>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>Credit / Debit Card</div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: "1.5px solid " + C.border, borderRadius: 10, cursor: "pointer", opacity: 0.6 }} onClick={() => alert("Net Banking payment option is simulated. Please use Google Pay/UPI.")}>
                  <i className="ti ti-building-bank" style={{ fontSize: 20, color: C.text2 }}></i>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>Net Banking</div>
                </div>
              </div>

              <button onClick={executePayment} disabled={paymentProcessing} style={{ width: "100%", padding: "12px", background: C.teal, color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {paymentProcessing ? (
                  <>Processing...</>
                ) : (
                  <>Confirm & Pay ₹{(paymentInvoice.total - (paymentInvoice.amountPaid || 0)).toLocaleString("en-IN")}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
