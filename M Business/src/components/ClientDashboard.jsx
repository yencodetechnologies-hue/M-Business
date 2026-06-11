import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../config";
import SettingsPage from "./SettingsPage";
import ModernEmployeeProjectDetails from "./ModernEmployeeProjectDetails";

// ── Teal Theme Colors ──────────────────────────────────────────
const C = {
  bg:       "#F3F8F9",
  surface:  "#FFFFFF",
  surface2: "#F8FAFB",
  border:   "#DFF0F2",
  border2:  "#C5DDE0",
  text:     "#0D2027",
  text2:    "#4E6B75",
  text3:    "#96B0B8",
  teal:     "#00BCD4",
  teal2:    "#00ACC1",
  teal3:    "#006E7F",
  tealLight:"#E0F7FA",
  tealLighter:"#F0FDFE",
  tealMid:  "rgba(0,188,212,.12)",
  green:    "#1DB87A",
  greenBg:  "#E3FAF0",
  amber:    "#F59E0B",
  amberBg:  "#FEF3C7",
  red:      "#EF4444",
  redBg:    "#FEF2F2",
  purple:   "#7C3AED",
  purpleBg: "#EDE9FE",
  blue:     "#2563EB",
  blueBg:   "#EFF4FF",
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

export default function ClientDashboard({ user, setUser }) {
  useAssets();
  const [active, setActive] = useState(() => localStorage.getItem("activeTab_client") || "dashboard");
  const [selectedClientProject, setSelectedClientProject] = useState(null);
  useEffect(() => { localStorage.setItem("activeTab_client", active); if (active !== "projects") setSelectedClientProject(null); }, [active]);

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Dropdown
  const [profileOpen, setProfileOpen] = useState(false);

  // File filter
  const [fileFilter, setFileFilter] = useState("All");

  // Local Chat Mockups
  const [chatMessages, setChatMessages] = useState([
    { sender: "Prabhu · YENCODE", msg: "Hi! The final review designs have been uploaded. Please check and let us know your feedback.", time: "9:05 AM", mine: false },
    { sender: "You", msg: "Looks great! I'll review and get back by EOD. Can we schedule a call too?", time: "9:22 AM", mine: true },
    { sender: "Prabhu · YENCODE", msg: "Absolutely! I've added a meeting slot for tomorrow 11 AM. Check the schedule section below.", time: "9:30 AM", mine: false },
    { sender: "You", msg: "Perfect. Also please send the updated invoice when ready.", time: "9:45 AM", mine: true }
  ]);
  const [chatText, setChatText] = useState("");

  // Feedback Mock
  const [feedbackRating, setFeedbackRating] = useState(4);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Approvals Mock
  const [approvals, setApprovals] = useState([
    { id: 1, title: "Homepage Design v3", desc: "Phase 1 design revisions approved, awaiting visual layout approval.", icon: "ti-photo" },
    { id: 2, title: "SEO Keywords Plan", desc: "Approval request for targeting primary and secondary service keywords.", icon: "ti-seo" }
  ]);

  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 19)); // Default mid June 2026
  const [selectedDay, setSelectedDay] = useState(19);

  // Document preview states
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Payment Checkout Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const clientName = user?.clientName || user?.name || "Client";

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchAll = async () => {
      try {
        const [projRes, taskRes, invRes, notifRes, docRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/projects/client/${encodeURIComponent(clientName)}`, {
            headers: { 'x-company-id': user.companyId || "" }
          }),
          axios.get(`${BASE_URL}/api/tasks/client/${encodeURIComponent(clientName)}`, {
            headers: { 'x-company-id': user.companyId || "" }
          }),
          axios.get(`${BASE_URL}/api/invoices/client/${encodeURIComponent(clientName)}`, {
            headers: { 'x-company-id': user.companyId || "" }
          }),
          axios.get(`${BASE_URL}/api/notifications/${user._id || user.id}`),
          axios.get(`${BASE_URL}/api/documents?companyId=${user.companyId || ""}&client=${encodeURIComponent(clientName)}&sendTo=client`).catch(() => ({ data: [] }))
        ]);

        setProjects(projRes.data || []);
        setTasks(taskRes.data || []);
        setInvoices(invRes.data || []);
        setNotifs(notifRes.data || []);
        setDocs(docRes.data || []);
      } catch (err) {
        console.error("Failed to fetch client dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user, clientName]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const handleSendMessage = () => {
    if (!chatText.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    setChatMessages([...chatMessages, { sender: "You", msg: chatText, time: timeStr, mine: true }]);
    setChatText("");
    // Simulate auto-reply
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        sender: "Prabhu · YENCODE",
        msg: "Received! Let me check this with the development team and get back to you shortly.",
        time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        mine: false
      }]);
    }, 1500);
  };

  const submitFeedback = (e) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedbackText("");
      setFeedbackSubmitted(false);
      alert("Thank you for your feedback! We appreciate your support.");
    }, 1000);
  };

  const handleApproval = (id, type) => {
    setApprovals(approvals.filter(a => a.id !== id));
    alert(type === "approve" ? "Approved successfully!" : "Rejected/Request Changes sent.");
  };

  // Payment execution
  const startPayment = (invoice) => {
    setPaymentInvoice(invoice);
    setPayModalOpen(true);
  };

  const executePayment = async () => {
    if (!paymentInvoice) return;
    setPaymentProcessing(true);
    try {
      const remainingAmount = paymentInvoice.total - (paymentInvoice.amountPaid || 0);
      const res = await axios.patch(`${BASE_URL}/api/invoices/${paymentInvoice.id || paymentInvoice._id}/status`, {
        status: "paid",
        amountPaid: remainingAmount,
        paymentMode: "GPay",
        paymentDate: new Date().toISOString().split("T")[0],
        transactionId: "TXN" + Math.floor(Math.random() * 1000000000)
      });
      if (res.data?.success || res.status === 200) {
        // Update local invoices state
        setInvoices(invoices.map(inv => {
          if (inv.id === paymentInvoice.id || inv._id === paymentInvoice._id) {
            return { ...inv, status: "paid", amountPaid: inv.total };
          }
          return inv;
        }));
        alert("Payment of ₹" + remainingAmount.toLocaleString("en-IN") + " completed successfully!");
      }
    } catch (err) {
      console.error("Payment failed:", err);
      alert("Payment failed: " + (err.response?.data?.msg || err.message));
    } finally {
      setPaymentProcessing(false);
      setPayModalOpen(false);
      setPaymentInvoice(null);
    }
  };

  // Mock Calendar Calculations for June 2026
  const getCalendarDays = () => {
    const days = [];
    // Previous month padding (May 2026 ends on Sunday 31) -> none or fill 5 days from previous week if start is weekday
    // June 2026 starts on Monday (1)
    // May days: 25, 26, 27, 28, 29, 30, 31 (7 days)
    for (let i = 25; i <= 31; i++) {
      days.push({ day: i, isOtherMonth: true });
    }
    // June days: 1 to 30
    for (let i = 1; i <= 30; i++) {
      days.push({ day: i, isOtherMonth: false });
    }
    // Next month padding (July 2026 starts on Wednesday)
    // July days: 1 to 5
    for (let i = 1; i <= 5; i++) {
      days.push({ day: i, isOtherMonth: true });
    }
    return days;
  };

  const getEventClass = (day, other) => {
    if (other) return "";
    const eventDays = [2, 6, 10, 25];
    return eventDays.includes(day) ? "has-event" : "";
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

  const allFiles = [...docCards, ...defaultMockFiles];
  const filteredFiles = fileFilter === "All" ? allFiles : allFiles.filter(f => f.type === fileFilter);

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

  // Mock fallback if DB has no invoices
  const defaultMockInvoices = [
    { id: "mock1", invoiceNo: "#INV-2026-1230", desc: "STA Website · Advance Payment", date: "01 May 2026", dueDate: "01 May 2026", total: 40000, amountPaid: 40000, status: "paid" },
    { id: "mock2", invoiceNo: "#INV-2026-1218", desc: "STA Website · Design Milestone", date: "25 Apr 2026", dueDate: "25 Apr 2026", total: 40000, amountPaid: 40000, status: "paid" },
    { id: "mock3", invoiceNo: "#INV-2026-1240", desc: "STA Website · Final Delivery", date: "29 May 2026", dueDate: "30 Jun 2026", total: 40000, amountPaid: 0, status: "pending" }
  ];

  const finalInvoicesList = dbInvoices.length > 0 ? dbInvoices : defaultMockInvoices;

  const totalPaid = finalInvoicesList.filter(i => i.status === "paid").reduce((sum, i) => sum + i.total, 0);
  const totalPending = finalInvoicesList.filter(i => i.status === "pending" || i.status === "unpaid" || i.status === "sent").reduce((sum, i) => sum + (i.total - i.amountPaid), 0);
  const totalOverdue = finalInvoicesList.filter(i => i.status === "overdue").reduce((sum, i) => sum + (i.total - i.amountPaid), 0);
  const totalInvoiced = totalPaid + totalPending + totalOverdue;

  // Active project calculation
  const activeProjName = projects[0]?.name || "STA Corporate Website";
  const activeProjProgress = projects[0]?.progress || 90;
  const activeProjDesc = projects[0]?.description || "{project.description}";
  const activeProjDeadline = projects[0]?.deadline || "30 Jun 2026";
  const parseDeadline = (str) => {
  if (!str) return null;
  // "30 Jun 2026" format handle பண்ண:
  const d = new Date(str);
  if (!isNaN(d)) return d;
  // DD MMM YYYY format:
  const parts = str.split(" ");
  if (parts.length === 3) return new Date(`${parts[1]} ${parts[0]}, ${parts[2]}`);
  return null;
};
const daysLeft = (() => {
  const d = parseDeadline(activeProjDeadline);
  if (!d) return 0;
  return Math.max(0, Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24)));
})();

  // Styles Injection
  const CSS = `
    .cp-root {
      --teal: #00BCD4;
      --teal2: #00ACC1;
      --teal3: #006E7F;
      --teal-light: #E0F7FA;
      --teal-lighter: #F0FDFE;
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
      overflow-x: hidden;
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
    .cp-root .page-body { max-width: 1200px; margin: 0 auto; padding: 28px 24px 60px; display: flex; flex-direction: column; gap: 28px; }

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
    .cp-root .modal-close { background: none; border: none; font-size: 20px; color: var(--text3); cursor: pointer; }
    .cp-root .modal-close:hover { color: var(--text); }
    .cp-root .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

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

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: C.bg, alignItems: 'center', justifyContent: 'center', color: C.text, fontFamily: 'sans-serif' }}>
        Loading Client Portal...
      </div>
    );
  }

  // Settings Component Render Wrapper
  if (active === "settings") {
    return (
      <div className="cp-root">
        <style>{CSS}</style>
        {renderTopNav()}
        <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 24px" }}>
        
          <SettingsPage
            user={user}
            THEME={{
              bg: C.bg, surface: C.surface, card: C.surface, cardHov: C.surface2, border: C.border, borderHov: C.border2,
              grad: "linear-gradient(135deg, " + C.teal3 + ", " + C.teal + ")", gradSoft: "rgba(0, 188, 212, 0.08)",
              gradText: "linear-gradient(135deg, " + C.teal3 + ", " + C.teal + ")", pink: C.teal, purple: C.teal3,
              violet: C.teal2, text: C.text, muted: C.text2, dim: C.text3, green: C.green, amber: C.amber, red: C.red, blue: C.blue
            }}
            onProfileUpdate={(updates) => {
              const updated = { ...user, ...updates };
              if (setUser) setUser(updated);
              localStorage.setItem("user", JSON.stringify(updated));
            }}
          />
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
            <div className="tn-logo">YT</div>
            <div>
              <div className="tn-company">YENCODE Technologies</div>
              <div className="tn-powered">Client Portal</div>
            </div>
          </div>
          <div className="tn-nav">
            <button className={`tn-item ${active === "dashboard" ? "active" : ""}`} onClick={() => setActive("dashboard")}>Overview</button>
            <button className={`tn-item ${active === "projects" ? "active" : ""}`} onClick={() => setActive("projects")}><i className="ti ti-layout-kanban" style={{marginRight:4}}></i>My Projects</button>
            <button className={`tn-item ${active === "timeline" ? "active" : ""}`} onClick={() => setActive("timeline")}>Timeline</button>
            <button className={`tn-item ${active === "files" ? "active" : ""}`} onClick={() => setActive("files")}>Files</button>
            <button className={`tn-item ${active === "payments" ? "active" : ""}`} onClick={() => setActive("payments")}>Invoices</button>
            <button className={`tn-item ${active === "messages" ? "active" : ""}`} onClick={() => setActive("messages")}>Messages</button>
            <button className={`tn-item ${active === "calendar" ? "active" : ""}`} onClick={() => setActive("calendar")}>Schedule</button>
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
    const pendingAmountFormatted = totalPending >= 1000 ? `₹${(totalPending / 1000).toFixed(0)}K` : `₹${totalPending.toLocaleString("en-IN")}`;
    const dashoffset = 289 - (activeProjProgress / 100) * 289; // Circle stroke dash offsets

    return (
      <div className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-label"><i className="ti ti-briefcase" style={{ fontSize: 11 }}></i> Active Project</div>
            <div className="hero-title">{activeProjName}</div>
            <div className="hero-sub">{activeProjDesc}</div>
            <div className="hero-stats">
              <div className="hs-item">
                <div className="hs-val">{activeProjProgress}%</div>
                <div className="hs-label">Complete</div>
              </div>
              <div className="hs-item">
         <div className="hs-val">{daysLeft}</div>
                <div className="hs-label">Days Left</div>
              </div>
              <div className="hs-item">
                <div className="hs-val">{pendingAmountFormatted}</div>
                <div className="hs-label">Pending</div>
              </div>
              <div className="hs-item">
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
            <div className="hero-status-badge">{activeProjProgress === 100 ? "Completed" : "In Review"}</div>
          </div>
        </div>
      </div>
    );
  }

  // Render Gantt Timeline helper
  function renderTimelineComponent() {
    return (
      <div>
        {/* Milestone Steps */}
        <div style={{ background: C.surface, border: "1.5px solid " + C.border, borderRadius: "16px", padding: 22, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text2, marginBottom: 18 }}>Milestone Progress</div>
          <div className="steps-grid">
            <div className="step-item">
              <div className={`step-circle ${activeProjProgress > 15 ? "done" : "active"}`}>
                {activeProjProgress > 15 ? <i className="ti ti-check" style={{ fontSize: 16 }}></i> : "1"}
              </div>
              <div className="step-name">Discovery</div>
              <div className="step-date" style={{ color: activeProjProgress > 15 ? C.green : C.teal }}>
                {activeProjProgress > 15 ? "Done · 10 Apr" : "Active"}
              </div>
            </div>
            <div className="step-item">
              <div className={`step-circle ${activeProjProgress > 40 ? "done" : activeProjProgress > 15 ? "active" : "pending"}`}>
                {activeProjProgress > 40 ? <i className="ti ti-check" style={{ fontSize: 16 }}></i> : "2"}
              </div>
              <div className="step-name">UI/UX Design</div>
              <div className="step-date" style={{ color: activeProjProgress > 40 ? C.green : activeProjProgress > 15 ? C.teal : C.text3 }}>
                {activeProjProgress > 40 ? "Done · 25 Apr" : activeProjProgress > 15 ? "Active" : "Pending"}
              </div>
            </div>
            <div className="step-item">
              <div className={`step-circle ${activeProjProgress > 70 ? "done" : activeProjProgress > 40 ? "active" : "pending"}`}>
                {activeProjProgress > 70 ? <i className="ti ti-check" style={{ fontSize: 16 }}></i> : "3"}
              </div>
              <div className="step-name">Development</div>
              <div className="step-date" style={{ color: activeProjProgress > 70 ? C.green : activeProjProgress > 40 ? C.teal : C.text3 }}>
                {activeProjProgress > 70 ? "Done · 20 May" : activeProjProgress > 40 ? "Active" : "Pending"}
              </div>
            </div>
            <div className="step-item">
              <div className={`step-circle ${activeProjProgress > 85 ? "done" : activeProjProgress > 70 ? "active" : "pending"}`}>
                {activeProjProgress > 85 ? <i className="ti ti-check" style={{ fontSize: 16 }}></i> : "4"}
              </div>
              <div className="step-name">CMS & SEO</div>
              <div className="step-date" style={{ color: activeProjProgress > 85 ? C.green : activeProjProgress > 70 ? C.teal : C.text3 }}>
                {activeProjProgress > 85 ? "Done · 27 May" : activeProjProgress > 70 ? "Active" : "Pending"}
              </div>
            </div>
            <div className="step-item">
              <div className={`step-circle ${activeProjProgress >= 100 ? "done" : activeProjProgress >= 85 ? "active" : "pending"}`}>
                {activeProjProgress >= 100 ? <i className="ti ti-check" style={{ fontSize: 15 }}></i> : <i className="ti ti-eye" style={{ fontSize: 15 }}></i>}
              </div>
              <div className="step-name">Final Review</div>
              <div className="step-date" style={{ color: activeProjProgress >= 100 ? C.green : activeProjProgress >= 85 ? C.teal : C.text3 }}>
                {activeProjProgress >= 100 ? "Done · 2 Jun" : activeProjProgress >= 85 ? "Active now" : "Pending"}
              </div>
            </div>
            <div className="step-item">
              <div className={`step-circle ${activeProjProgress >= 100 ? "active" : "pending"}`}>
                {activeProjProgress >= 100 ? <i className="ti ti-rocket" style={{ fontSize: 15 }}></i> : "6"}
              </div>
              <div className="step-name">Launch 🚀</div>
              <div className="step-date" style={{ color: activeProjProgress >= 100 ? C.teal : C.text3 }}>
                {activeProjProgress >= 100 ? "Launch Now!" : activeProjDeadline}
              </div>
            </div>
          </div>
        </div>

        {/* Gantt Chart */}
        <div className="timeline-card">
          <div className="tc-header">
            <div className="tc-title">Gantt Chart · Apr – Jun 2026</div>
            <div className="tc-legend">
              <div className="tc-legend-item"><div className="tc-legend-dot" style={{ background: C.teal }}></div>Completed</div>
              <div className="tc-legend-item"><div className="tc-legend-dot" style={{ background: C.amber }}></div>Active</div>
              <div className="tc-legend-item"><div className="tc-legend-dot" style={{ background: C.border2 }}></div>Pending</div>
              <div className="tc-legend-item"><div className="tc-legend-dot" style={{ background: C.red }}></div>Today</div>
            </div>
          </div>
          <div className="timeline-scroll">
            <div className="timeline-wrap">
              <div className="tl-months">
                <div className="tl-month"></div>
                <div className="tl-month">Apr</div>
                <div className="tl-month">May</div>
                <div className="tl-month" style={{ color: C.teal, fontWeight: 800 }}>Jun ←</div>
                <div className="tl-month">Jul</div>
                <div className="tl-month">Aug</div>
                <div className="tl-month">Sep</div>
              </div>

              {/* Rows */}
              <div className="tl-row">
                <div><div class="tl-task-name">Discovery</div><div class="tl-task-sub">Planning</div></div>
                <div className="tl-grid-cell">
                  <div className="tl-bar-wrap">
                    <div className="tl-bar" style={{ width: "90%", left: "0%", background: C.teal }}>✓</div>
                  </div>
                </div>
                <div className="tl-grid-cell"></div>
                <div className="tl-grid-cell"></div>
                <div className="tl-grid-cell"></div>
                <div className="tl-grid-cell"></div>
                <div className="tl-grid-cell"></div>
              </div>

              <div className="tl-row">
                <div><div class="tl-task-name">UI/UX Design</div><div class="tl-task-sub">Design</div></div>
                <div className="tl-grid-cell">
                  <div className="tl-bar-wrap">
                    <div className="tl-bar" style={{ width: "100%", left: "0%", background: C.teal }}>Design ✓</div>
                  </div>
                </div>
                <div className="tl-grid-cell">
                  <div className="tl-bar-wrap">
                    <div className="tl-bar" style={{ width: "40%", left: "0%", background: C.teal }}></div>
                  </div>
                </div>
                <div className="tl-grid-cell"></div>
                <div className="tl-grid-cell"></div>
                <div className="tl-grid-cell"></div>
                <div className="tl-grid-cell"></div>
              </div>

              <div className="tl-row">
                <div><div class="tl-task-name">Development</div><div class="tl-task-sub">Frontend + Backend</div></div>
                <div className="tl-grid-cell"></div>
                <div className="tl-grid-cell">
                  <div className="tl-bar-wrap">
                    <div className="tl-bar" style={{ width: "100%", left: "0%", background: C.teal }}>Dev ✓</div>
                  </div>
                </div>
                <div className="tl-grid-cell">
                  <div className="tl-bar-wrap">
                    <div className="tl-bar" style={{ width: "20%", left: "0%", background: activeProjProgress >= 70 ? C.teal : C.amber }}></div>
                  </div>
                </div>
                <div className="tl-grid-cell"></div>
                <div className="tl-grid-cell"></div>
                <div className="tl-grid-cell"></div>
              </div>

              <div className="tl-row">
                <div><div class="tl-task-name">CMS & SEO Setup</div><div class="tl-task-sub">Content + SEO</div></div>
                <div className="tl-grid-cell"></div>
                <div className="tl-grid-cell">
                  <div className="tl-bar-wrap">
                    <div className="tl-bar" style={{ width: "60%", left: "40%", background: C.teal }}>CMS ✓</div>
                  </div>
                </div>
                <div className="tl-grid-cell">
                  <div className="tl-bar-wrap">
                    <div className="tl-bar" style={{ width: "20%", left: "0%", background: activeProjProgress >= 85 ? C.teal : C.amber }}></div>
                  </div>
                </div>
                <div className="tl-grid-cell"></div>
                <div className="tl-grid-cell"></div>
                <div className="tl-grid-cell"></div>
              </div>

              <div className="tl-row">
                <div><div class="tl-task-name">Final Review</div><div class="tl-task-sub">Client Review</div></div>
                <div className="tl-grid-cell"></div>
                <div className="tl-grid-cell"></div>
                <div className="tl-grid-cell" style={{ position: "relative" }}>
                  <div className="today-label">TODAY</div>
                  <div className="today-line"></div>
                  <div className="tl-bar-wrap">
                    <div className="tl-bar" style={{ width: "50%", left: "0%", background: activeProjProgress >= 100 ? C.teal : C.amber }}>In Review</div>
                  </div>
                </div>
                <div className="tl-grid-cell"></div>
                <div className="tl-grid-cell"></div>
                <div className="tl-grid-cell"></div>
              </div>

              <div className="tl-row">
                <div><div class="tl-task-name">Launch 🚀</div><div class="tl-task-sub">Go Live</div></div>
                <div className="tl-grid-cell"></div>
                <div className="tl-grid-cell"></div>
                <div className="tl-grid-cell">
                  <div className="tl-bar-wrap">
                    <div className="tl-bar" style={{ width: "100%", left: "0%", background: activeProjProgress >= 100 ? C.amber : "#CBD5E1", color: C.text2 }}>
                      {activeProjProgress >= 100 ? "Ready to Launch!" : "Planned"}
                    </div>
                  </div>
                </div>
                <div className="tl-grid-cell"></div>
                <div className="tl-grid-cell"></div>
                <div className="tl-grid-cell"></div>
              </div>
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
            <div key={idx} className="file-card" onClick={() => file.raw && setSelectedDoc(file.raw)}>
              {file.badge && <span className="fc-new-badge">{file.badge}</span>}
              <div className="fc-download"><i className="ti ti-download"></i></div>
              <div className="fc-icon" style={{ background: file.bg, color: file.col }}><i className={`ti ${file.icon}`}></i></div>
              <div className="fc-name">{file.name}</div>
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
              <div className="inv-dl" style={{ marginLeft: "8px" }} onClick={(e) => { e.stopPropagation(); alert("Downloading invoice PDF..."); }}>
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
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`msg-row ${msg.mine ? "mine" : ""}`}>
              <div className="msg-av" style={{ background: msg.mine ? "linear-gradient(135deg, " + C.amber + ", #D97706)" : "linear-gradient(135deg, " + C.teal + ", " + C.teal3 + ")" }}>
                {msg.mine ? initials : "P"}
              </div>
              <div className="msg-body">
                {!msg.mine && <div className="msg-name">{msg.sender}</div>}
                <div className={`msg-bubble ${msg.mine ? "mine" : "them"}`}>{msg.msg}</div>
                <div className="msg-time">{msg.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="msg-input-row">
          <div className="msg-attach" onClick={() => alert("Attachment handler opened.")}><i className="ti ti-paperclip"></i></div>
          <input className="msg-inp" type="text" placeholder="Type a message…" value={chatText} onChange={(e) => setChatText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} />
          <button className="msg-send" onClick={handleSendMessage}><i className="ti ti-send"></i></button>
        </div>
      </div>
    );
  }

  // Render Calendar helper
  function renderCalendarComponent() {
    const calendarDays = getCalendarDays();
    const meetings = [
      { id: 1, title: "Final Review Call", time: "11:00", dur: "1h", meta: "2 Jun · Google Meet · Prabhu + STA Admin" },
      { id: 2, title: "Launch Coordination Sync", time: "3:00", dur: "45m", meta: "6 Jun · Google Meet · Prabhu + Dev team" }
    ];

    return (
      <div className="calendar-panel">
        <div className="cal-header">
          <div className="cal-month">June 2026</div>
          <div className="cal-nav">
            <div className="cal-nav-btn" onClick={() => alert("Previous month (May 2026)")}><i className="ti ti-chevron-left"></i></div>
            <div className="cal-nav-btn" onClick={() => alert("Next month (July 2026)")}><i className="ti ti-chevron-right"></i></div>
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
              const isToday = dayObj.day === 1 && !dayObj.isOtherMonth; // Mock June 1st today

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
          {meetings.map((meet) => (
            <div key={meet.id} className="meeting-item" onClick={() => alert(`Redirecting to Google Meet link for ${meet.title}...`)}>
              <div className="mi-time-col">
                <div className="mi-time">{meet.time}</div>
                <div className="mi-dur">{meet.dur}</div>
              </div>
              <div className="mi-divider"></div>
              <div style={{ flex: 1 }}>
                <div className="mi-title">{meet.title}</div>
                <div className="mi-meta">{meet.meta}</div>
              </div>
              <div className="mi-join"><i className="ti ti-video" style={{ fontSize: 12 }}></i> Join</div>
            </div>
          ))}
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
            <div key={app.id} className="approval-item">
              <div className="ai-icon"><i className={`ti ${app.icon}`}></i></div>
              <div style={{ flex: 1 }}>
                <div className="ai-title">{app.title}</div>
                <div className="ai-desc">{app.desc}</div>
              </div>
              <div className="ai-actions">
                <button className="ai-btn reject" onClick={() => handleApproval(app.id, "reject")}>Reject</button>
                <button className="ai-btn approve" onClick={() => handleApproval(app.id, "approve")}>Approve</button>
              </div>
            </div>
          ))}
          {approvals.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: C.text3, fontSize: 12 }}>No pending approvals. All caught up!</div>
          )}
        </div>
      </div>
    );
  }

  // Render Activity Feed helper
  function renderActivityFeed() {
    const feedItems = [
      { id: 1, title: "Prabhu uploaded Homepage_Final_v3.fig", time: "2 hours ago", icon: "ti-file-upload" },
      { id: 2, title: "Payment #INV-2026-1218 approved by gateway", time: "1 day ago", icon: "ti-receipt" },
      { id: 3, title: "Meeting Final Review Call scheduled by Prabhu", time: "2 days ago", icon: "ti-video" }
    ];

    return (
      <div className="activity-feed">
        <div style={{ fontSize: 12, fontWeight: 800, color: C.text2, marginBottom: 14 }}>Recent Activity</div>
        {feedItems.map((item) => (
          <div key={item.id} className="af-item">
            <div className="af-dot-col">
              <div className="af-dot"><i className={`ti ${item.icon}`}></i></div>
              <div className="af-line"></div>
            </div>
            <div>
              <div className="af-title">{item.title}</div>
              <div className="af-time"><i className="ti ti-clock" style={{ fontSize: 12 }}></i> {item.time}</div>
            </div>
          </div>
        ))}
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
                ★
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
    return (
      <div className="contact-card">
        <div className="cc-label">Your Account Manager</div>
        <div className="cc-name">Prabhu</div>
        <div className="cc-role">Senior Project Lead, YENCODE</div>
        <div className="cc-contacts">
          <div className="cc-contact-row"><i className="ti ti-mail"></i> prabhu@yencode.com</div>
          <div className="cc-contact-row"><i className="ti ti-phone"></i> +91 98765 43210</div>
        </div>
        <div className="cc-actions">
          <button className="cc-btn" onClick={() => setActive("messages")}><i className="ti ti-message-2"></i> Chat</button>
          <button className="cc-btn" onClick={() => alert("Initiating call to account manager...")}><i className="ti ti-phone-call"></i> Call</button>
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
            {/* Timeline */}
            <div>
              <div className="sec-header">
                <div className="sec-title">
                  <div className="sec-title-icon" style={{ background: C.tealLight, color: C.teal }}><i className="ti ti-calendar-stats"></i></div>
                  Project Timeline
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
                <div className="sec-title">
                  <div className="sec-title-icon" style={{ background: C.blueBg, color: C.blue }}><i className="ti ti-files"></i></div>
                  Files & Documents
                </div>
                <div className="sec-action" onClick={() => alert("Downloading all files shared...")}>
                  <i className="ti ti-download" style={{ fontSize: 13 }}></i> Download All
                </div>
              </div>
              {renderFilesComponent()}
            </div>

            {/* Invoices and Messages */}
            <div className="two-col">
              {/* Invoices */}
              <div>
                <div className="sec-header">
                  <div className="sec-title">
                    <div className="sec-title-icon" style={{ background: C.greenBg, color: C.green }}><i className="ti ti-receipt-2"></i></div>
                    Invoices & Payments
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
            {renderTimelineComponent()}
          </div>
        )}

        {active === "files" && (
          <div>
            <div className="sec-header">
              <div className="sec-title">
                <div className="sec-title-icon" style={{ background: C.blueBg, color: C.blue }}><i className="ti ti-files"></i></div>
                Files & Documents Checklist
              </div>
              <div className="sec-action" onClick={() => alert("Downloading all files shared...")}>
                <i className="ti ti-download" style={{ fontSize: 13 }}></i> Download All
              </div>
            </div>
            {renderFilesComponent()}
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
          <ModernEmployeeProjectDetails 
            project={selectedClientProject} 
            tasks={tasks} 
            user={user} 
            onBack={() => setSelectedClientProject(null)} 
            onMessageTeam={() => setActive("messages")}
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
