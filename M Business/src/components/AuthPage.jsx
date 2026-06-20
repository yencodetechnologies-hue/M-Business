import { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

export default function AuthPage({ setUser, initialTab = "login" }) {
  const [tab, setTab] = useState(initialTab === "login" ? "login" : "register");
  const [animating, setAnimating] = useState(false);
  const [panelAnim, setPanelAnim] = useState("idle"); // "idle" | "flip-out" | "flip-in"
  const [formVisible, setFormVisible] = useState(true);

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginErr, setLoginErr] = useState({});
  const [regData, setRegData] = useState({
    name: "", email: "", phone: "", password: "", confirm: "",
    role: "Subadmin", companyName: "", companyType: "IT", employeeCount: "0-10"
  });
  const [regErr, setRegErr] = useState({});

  const [verifyEmail, setVerifyEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetData, setResetData] = useState({ email: "", otp: "", newPassword: "", confirm: "" });

  // ── Animated tab switch with 3D flip ──
  const switchTab = (t) => {
    if (animating || tab === t) return;
    setAnimating(true);
    setError(""); setSuccess(""); setLoginErr({}); setRegErr({});

    // Phase 1: fade out form + flip panel out
    setFormVisible(false);
    setPanelAnim("flip-out");

    setTimeout(() => {
      // Phase 2: switch tab content, panel flips back in
      setTab(t);
      setPanelAnim("flip-in");

      // Small delay then fade form back in
      setTimeout(() => {
        setFormVisible(true);
        setPanelAnim("idle");
        setAnimating(false);
      }, 280);
    }, 300);
  };

  // ── API handlers ──
  const handleLogin = async () => {
    const errs = {};
    if (!loginData.email.trim()) errs.email = "Email is required";
    if (!loginData.password.trim()) errs.password = "Password is required";
    if (Object.keys(errs).length) { setLoginErr(errs); return; }
    try {
      setLoading(true); setError("");
console.log("Sending:", loginData); // check what's actually being sent
const res = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
      const userData = res.data.user || res.data;
      const userWithLogo = { ...userData, logoUrl: userData.logoUrl || "" };
      localStorage.setItem("user", JSON.stringify(userWithLogo));
      setUser(userWithLogo);
    } catch (e) {
      if (e.response?.data?.requiresOTP) {
        setVerifyEmail(e.response.data.email);
        setTab("otp"); setError("");
        setSuccess("OTP sent to your email.");
      } else {
        setError(e.response?.data?.msg || e.response?.data?.message || "Invalid email or password.");
      }
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    const errs = {};
    if (!regData.name.trim()) errs.name = "Name is required";
    if (!regData.email.trim()) errs.email = "Email is required";
    if (!regData.password.trim()) errs.password = "Password is required";
    else if (regData.password.length < 6) errs.password = "Minimum 6 characters";
    if (regData.password !== regData.confirm) errs.confirm = "Passwords do not match";
    if (Object.keys(errs).length) { setRegErr(errs); return; }
    try {
      setLoading(true); setError("");
      const payload = {
        name: regData.name, email: regData.email,
        password: regData.password, role: regData.role, phone: regData.phone
      };
      if (regData.role === "Subadmin") {
        payload.companyName = regData.companyName;
        payload.companyType = regData.companyType;
        payload.employeeCount = regData.employeeCount;
      }
      const res = await axios.post(`${BASE_URL}/api/auth/signup`, payload, { timeout: 15000 });
      if (res.data.requiresOTP) {
        setSuccess("OTP sent to your email!");
        setVerifyEmail(res.data.email);
        setTab("otp");
      } else {
        setSuccess("Account created!");
        const userData = res.data.user;
        if (userData) {
          const userWithLogo = { ...userData, logoUrl: userData.logoUrl || "" };
          localStorage.setItem("user", JSON.stringify(userWithLogo));
          setUser(userWithLogo);
        } else { setTab("login"); }
      }
    } catch (e) {
      if (e.code === "ECONNABORTED") setError("Server slow. Please try again.");
      else setError(e.response?.data?.msg || e.response?.data?.message || "Registration failed.");
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) { setError("Please enter the OTP"); return; }
    try {
      setLoading(true); setError("");
      const res = await axios.post(`${BASE_URL}/api/auth/verify-otp`, { email: verifyEmail, otp: otp.trim() });
      const userData = res.data.user;
      if (userData) {
        const userWithLogo = { ...userData, logoUrl: userData.logoUrl || "" };
        localStorage.setItem("user", JSON.stringify(userWithLogo));
        setUser(userWithLogo);
      } else { setTab("login"); }
    } catch (e) { setError(e.response?.data?.msg || "Invalid OTP"); }
    finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) { setError("Please enter your email"); return; }
    try {
      setLoading(true); setError("");
      await axios.post(`${BASE_URL}/api/auth/forgot-password`, { email: forgotEmail });
      setSuccess("OTP sent!");
      setResetData(p => ({ ...p, email: forgotEmail, otp: "", newPassword: "", confirm: "" }));
      setTab("reset");
    } catch (e) { setError(e.response?.data?.msg || "Failed to send reset OTP"); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!resetData.otp.trim()) { setError("Please enter the OTP"); return; }
    if (resetData.newPassword.length < 6) { setError("Min 6 characters"); return; }
    if (resetData.newPassword !== resetData.confirm) { setError("Passwords do not match"); return; }
    try {
      setLoading(true); setError("");
      await axios.post(`${BASE_URL}/api/auth/reset-password`, {
        email: resetData.email, otp: resetData.otp, newPassword: resetData.newPassword
      });
      setSuccess("Password reset! Please login.");
      setTab("login");
      setLoginData(p => ({ ...p, email: resetData.email, password: "" }));
    } catch (e) { setError(e.response?.data?.msg || "Failed to reset password"); }
    finally { setLoading(false); }
  };

  const isRegister = tab === "register";
  const isLogin = tab === "login";
  const showMainTabs = isLogin || isRegister;

  // Purple panel position & clip based on tab
  // register  left side; login  right side
  const panelLeft = isRegister ? "0" : "58%";
  const panelClip = isRegister
    ? "polygon(0 0, 87% 0, 100% 100%, 0 100%)"
    : "polygon(13% 0, 100% 0, 100% 100%, 0 100%)";

  // 3D flip transform based on animation phase
  // flip-out: rotate to 90deg (disappear edge-on)
  // flip-in: start from -90deg and go to 0 (appear from other side)
  let panelTransform = "rotateY(0deg)";
  if (panelAnim === "flip-out") panelTransform = "rotateY(90deg)";
  if (panelAnim === "flip-in") panelTransform = "rotateY(0deg)";

  const inp = (err) => ({
    width: "100%", background: "transparent",
    border: "none",
    borderBottom: `1.5px solid ${err ? "rgba(248,113,113,0.7)" : "rgba(255,255,255,0.2)"}`,
    padding: "9px 36px 9px 0", color: "#fff", fontSize: 14,
    outline: "none", fontFamily: "inherit", transition: "border-color .2s",
  });

  const selectSty = {
    width: "100%", background: "transparent",
    border: "none", borderBottom: "1.5px solid rgba(255,255,255,0.2)",
    padding: "9px 0", color: "#fff", fontSize: 14,
    outline: "none", fontFamily: "inherit", cursor: "pointer",
    appearance: "auto",
  };

  const errMsg = (msg) => msg
    ? <div style={{ fontSize: 11, color: "#fca5a5", marginTop: 4 }}>Warning {msg}</div>
    : null;

  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      background: "#08081a",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: 20,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(255,255,255,0.25); }
        input:focus { border-bottom-color: #00BCD4 !important; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 40px #100820 inset !important;
          -webkit-text-fill-color: #fff !important;
        }
        select option { background: #130a2e; color: #fff; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .auth-card {
          width: 100%;
          max-width: 900px;
          min-height: 500px;
          border-radius: 22px;
          border: 2px solid #00BCD4;
          box-shadow:
            0 0 0 1px rgba(116,41,204,0.12),
            0 0 60px rgba(116,41,204,0.28),
            0 24px 80px rgba(0,0,0,0.5);
          display: flex;
          overflow: visible;
          position: relative;
          perspective: 1200px;
        }

        .form-side {
          flex: 1;
          background: #0d0d20;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 40px 52px;
          position: relative;
          z-index: 1;
          min-width: 0;
          border-radius: 20px;
          overflow: hidden;
          transition: opacity 0.25s ease;
        }
        .form-side.reg-form {
          padding: 28px 44px;
        }

        /* Purple panel — position controlled by inline style, 3D flip via transform */
        .purple-panel {
          position: absolute;
          top: 0; bottom: 0;
          width: 42%;
          background: linear-gradient(155deg, #00BCD4, #00BCD4 60%, #00BCD4 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 40px;
          color: #fff;
          z-index: 10;
          border-radius: 18px;
          transform-style: preserve-3d;
          transform-origin: center center;
          /* position & clip transition for slide; transform for flip */
          transition:
            left 0.0s,
            clip-path 0.0s,
            transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.3s ease;
          backface-visibility: hidden;
        }

        /* When flipping out — brief opacity dip at the 90deg peak */
        .purple-panel.flip-out {
          opacity: 0.3;
        }
        .purple-panel.flip-in {
          opacity: 1;
        }

        .outline-btn {
          display: inline-block;
          padding: 10px 28px;
          background: transparent;
          border: 2px solid rgba(255,255,255,0.7);
          border-radius: 50px;
          color: #fff; font-size: 14px; font-weight: 700;
          cursor: pointer; font-family: inherit;
          transition: background .2s;
        }
        .outline-btn:hover { background: rgba(255,255,255,0.12); }

        .purple-btn {
          width: 100%; padding: 13px 0;
          background: linear-gradient(90deg, #00BCD4, #00BCD4);
          border: none; border-radius: 50px;
          color: #fff; font-size: 15px; font-weight: 700;
          cursor: pointer; font-family: inherit;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 22px #00BCD4;
          margin-top: 8px; transition: opacity .2s;
        }
        .purple-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .purple-btn:hover:not(:disabled) { opacity: 0.9; }

        .spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin .8s linear infinite;
          display: inline-block;
        }

        .link-btn {
          background: none; border: none;
          color: #00BCD4; font-weight: 700;
          cursor: pointer; font-family: inherit; font-size: 13px;
        }

        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; }

        @media (max-width: 640px) {
          .auth-card { flex-direction: column; min-height: unset; }
          .purple-panel {
            position: relative !important;
            left: auto !important;
            width: 100% !important;
            clip-path: none !important;
            border-radius: 18px 18px 0 0 !important;
            min-height: 160px;
            padding: 28px 24px !important;
            transform: none !important;
          }
          .form-side, .form-side.reg-form { padding: 24px 20px !important; }
          .grid2 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="auth-card">

        {/* ── FORM PANEL ── */}
        <div
          className={`form-side${tab === "register" ? " reg-form" : ""}`}
          style={{
 paddingLeft: isRegister ? "44%" : isLogin ? "52px" : undefined,
    paddingRight: isRegister ? "44px" : isLogin ? "44%" : undefined,
    opacity: formVisible ? 1 : 0,
          }}
        >
          {/* REGISTER */}
          {isRegister && (
            <div>
              <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 22px", textAlign: "left" }}>Sign Up</h2>

              {success && <Alert type="success" msg={success} />}
              {error && <Alert type="error" msg={error} />}

              <Field label="Full Name" err={regErr.name}>
                <div style={{ position: "relative" }}>
                  <input value={regData.name}
                    onChange={e => { setRegData(p => ({ ...p, name: e.target.value })); setRegErr(p => ({ ...p, name: "" })); }}
                    placeholder="Your full name" style={inp(regErr.name)} />
                  <Icon>Profile</Icon>
                  {errMsg(regErr.name)}
                </div>
              </Field>

              <Field label="Role">
                <select value={regData.role} onChange={e => setRegData(p => ({ ...p, role: e.target.value }))} style={selectSty}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="Subadmin">Admin</option>
                </select>
              </Field>

              <div className="grid2">
                <Field label="Email" err={regErr.email}>
                  <div style={{ position: "relative" }}>
                    <input type="email" value={regData.email}
                      onChange={e => { setRegData(p => ({ ...p, email: e.target.value })); setRegErr(p => ({ ...p, email: "" })); }}
                      placeholder="you@email.com" style={inp(regErr.email)} />
                    <Icon>Mail</Icon>
                    {errMsg(regErr.email)}
                  </div>
                </Field>
                <Field label="Phone">
                  <div style={{ position: "relative" }}>
                    <input value={regData.phone}
                      onChange={e => setRegData(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+91 98765 43210" style={inp(false)} />
                    <Icon></Icon>
                  </div>
                </Field>
              </div>

              <div className="grid2">
                <Field label="Password" err={regErr.password}>
                  <div style={{ position: "relative" }}>
                    <input type={showPass ? "text" : "password"} value={regData.password}
                      onChange={e => { setRegData(p => ({ ...p, password: e.target.value })); setRegErr(p => ({ ...p, password: "" })); }}
                      placeholder="Min 6 chars" style={{ ...inp(regErr.password), paddingRight: 52 }} />
                    <ShowHide show={showPass} toggle={() => setShowPass(!showPass)} />
                    {errMsg(regErr.password)}
                  </div>
                </Field>
                <Field label="Confirm Password" err={regErr.confirm}>
                  <div style={{ position: "relative" }}>
                    <input type={showConfirm ? "text" : "password"} value={regData.confirm}
                      onChange={e => { setRegData(p => ({ ...p, confirm: e.target.value })); setRegErr(p => ({ ...p, confirm: "" })); }}
                      placeholder="Repeat password" style={{ ...inp(regErr.confirm), paddingRight: 52 }} />
                    <ShowHide show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
                    {errMsg(regErr.confirm)}
                  </div>
                </Field>
              </div>

              {regData.role === "Subadmin" && <>
                <Field label="Company Name">
                  <div style={{ position: "relative" }}>
                    <input value={regData.companyName}
                      onChange={e => setRegData(p => ({ ...p, companyName: e.target.value }))}
                      placeholder="Your company name" style={inp(false)} />
                    <Icon>Company</Icon>
                  </div>
                </Field>
                <div className="grid2">
                  <Field label="Company Type">
                    <select value={regData.companyType} onChange={e => setRegData(p => ({ ...p, companyType: e.target.value }))} style={selectSty}>
                      {["IT", "Software", "Services", "Consulting", "Other"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="No. of Employees">
                    <select value={regData.employeeCount} onChange={e => setRegData(p => ({ ...p, employeeCount: e.target.value }))} style={selectSty}>
                      {["0-10", "11-50", "51-100", "100+"].map(ec => <option key={ec} value={ec}>{ec}</option>)}
                    </select>
                  </Field>
                </div>
              </>}

              <button className="purple-btn" onClick={handleRegister} disabled={loading}>
                {loading ? <><span className="spinner" />Creating account...</> : "Sign Up"}
              </button>
                       <p style={{ textAlign: "left", marginTop: 14, fontSize: 13, color: "rgba(255,255,255,0.32)" }}>
                Already have an account? <button className="link-btn" onClick={() => switchTab("login")}>Login</button>
              </p>
            </div>
          )}

          {/* LOGIN */}
          {isLogin && (
            <div>
              <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 28px", textAlign: "center" }}>Login</h2>

              {success && <Alert type="success" msg={success} />}
              {error && <Alert type="error" msg={error} />}

              <Field label="Username" err={loginErr.email}>
                <div style={{ position: "relative" }}>
                  <input type="email" value={loginData.email}
                    onChange={e => { setLoginData(p => ({ ...p, email: e.target.value })); setLoginErr(p => ({ ...p, email: "" })); }}
                    placeholder="you@email.com" style={inp(loginErr.email)} />
                  <Icon>Profile</Icon>
                  {errMsg(loginErr.email)}
                </div>
              </Field>

              <Field label="Password" err={loginErr.password}>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} value={loginData.password}
                    onChange={e => { setLoginData(p => ({ ...p, password: e.target.value })); setLoginErr(p => ({ ...p, password: "" })); }}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    placeholder="••••••••" style={{ ...inp(loginErr.password), paddingRight: 56 }} />
                  <ShowHide show={showPass} toggle={() => setShowPass(!showPass)} />
                  {errMsg(loginErr.password)}
                </div>
              </Field>

              <div style={{ textAlign: "right", marginBottom: 22, marginTop: -4 }}>
                <button onClick={() => { setTab("forgot"); setError(""); setSuccess(""); }}
                  style={{ background: "none", border: "none", color: "#00BCD4", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  Forgot Password?
                </button>
              </div>

              <button className="purple-btn" onClick={handleLogin} disabled={loading}>
                {loading ? <><span className="spinner" />Signing in...</> : "Login"}
              </button>
              <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.32)" }}>
                Don't have an account? <button className="link-btn" onClick={() => switchTab("register")}>Sign Up</button>
              </p>
            </div>
          )}

          {/* OTP */}
          {tab === "otp" && (
            <div style={{ maxWidth: 380, margin: "0 auto", width: "100%" }}>
              <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 12px", textAlign: "center" }}>Verify OTP</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24, textAlign: "center" }}>
                6-digit OTP sent to <strong style={{ color: "#c084fc" }}>{verifyEmail}</strong>
              </p>
              {success && <Alert type="success" msg={success} />}
              {error && <Alert type="error" msg={error} />}
              <Field label="One-Time Password">
                <input type="text" value={otp} onChange={e => setOtp(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleVerifyOTP()}
                  placeholder="1  2  3  4  5  6"
                  style={{ ...inp(false), letterSpacing: 8, fontWeight: 700, fontSize: 18, textAlign: "center", paddingRight: 0 }}
                  maxLength={6} />
              </Field>
              <button className="purple-btn" onClick={handleVerifyOTP} disabled={loading}>
                {loading ? <><span className="spinner" />Verifying...</> : "Verify & Continue"}
              </button>
              <div style={{ textAlign: "center", marginTop: 14 }}>
                <button className="link-btn" onClick={() => switchTab("login")}> Back to Login</button>
              </div>
            </div>
          )}

          {/* FORGOT */}
          {tab === "forgot" && (
            <div style={{ maxWidth: 380, margin: "0 auto", width: "100%" }}>
              <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 12px", textAlign: "center" }}>Forgot Password</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>Enter your email to receive a password reset OTP.</p>
              {success && <Alert type="success" msg={success} />}
              {error && <Alert type="error" msg={error} />}
              <Field label="Email Address">
                <div style={{ position: "relative" }}>
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleForgotPassword()}
                    placeholder="you@email.com" style={inp(false)} />
                  <Icon>Mail</Icon>
                </div>
              </Field>
              <button className="purple-btn" onClick={handleForgotPassword} disabled={loading}>
                {loading ? <><span className="spinner" />Sending...</> : "Send Reset OTP"}
              </button>
              <div style={{ textAlign: "center", marginTop: 14 }}>
                <button className="link-btn" onClick={() => switchTab("login")}> Back to Login</button>
              </div>
            </div>
          )}

          {/* RESET */}
          {tab === "reset" && (
            <div style={{ maxWidth: 380, margin: "0 auto", width: "100%" }}>
              <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 20px", textAlign: "center" }}>Reset Password</h2>
              {success && <Alert type="success" msg={success} />}
              {error && <Alert type="error" msg={error} />}
              <Field label="OTP Code">
                <input value={resetData.otp} onChange={e => setResetData(p => ({ ...p, otp: e.target.value }))}
                  placeholder="6-digit code" style={{ ...inp(false), letterSpacing: 4 }} maxLength={6} />
              </Field>
              <Field label="New Password">
                <input type="password" value={resetData.newPassword}
                  onChange={e => setResetData(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Min 6 chars" style={inp(false)} />
              </Field>
              <Field label="Confirm Password">
                <input type="password" value={resetData.confirm}
                  onChange={e => setResetData(p => ({ ...p, confirm: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleResetPassword()}
                  placeholder="Repeat password" style={inp(false)} />
              </Field>
              <button className="purple-btn" onClick={handleResetPassword} disabled={loading}>
                {loading ? <><span className="spinner" />Updating...</> : "Reset Password"}
              </button>
            </div>
          )}
        </div>

        {/* ── PURPLE SLIDING + FLIPPING PANEL ── */}
        {showMainTabs && (
          <div
            className={`purple-panel${panelAnim === "flip-out" ? " flip-out" : ""}${panelAnim === "flip-in" ? " flip-in" : ""}`}
            style={{
              left: panelLeft,
              clipPath: panelClip,
              transform: panelTransform,
              alignItems: "center",
              textAlign: "center"
            }}
          >
        
            <h2 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.1, margin: "0 0 16px", color: "#fff" }}>
              WELCOME<br />BACK!
            </h2>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.62)", lineHeight: 1.8, marginBottom: 30, maxWidth: 250 }}>
            Manage your workspace efficiently
            </p>
            {/* <button className="outline-btn" onClick={() => switchTab(isRegister ? "login" : "register")}>
              {isRegister ? "Sign In" : "Sign Up"}
            </button> */}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Small helper components ── */
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 15 }}>
      <label style={{ display: "block", fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 7, fontWeight: 500 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Icon({ children }) {
  return (
    <span style={{ position: "absolute", right: 4, bottom: 10, fontSize: 14, color: "rgba(255,255,255,0.27)", pointerEvents: "none" }}>
      {children}
    </span>
  );
}

function ShowHide({ show, toggle }) {
  return (
    <button type="button" onClick={toggle}
      style={{ position: "absolute", right: 0, bottom: 9, background: "none", border: "none", color: "rgba(255,255,255,0.38)", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: .5 }}>
      {show ? "HIDE" : "SHOW"}
    </button>
  );
}

function Alert({ type, msg }) {
  const isSuccess = type === "success";
  return (
    <div style={{
      background: isSuccess ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
      border: `1px solid ${isSuccess ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
      borderRadius: 8, padding: "9px 13px", marginBottom: 14,
      fontSize: 12.5, color: isSuccess ? "#86efac" : "#fca5a5",
    }}>
      {isSuccess ? "Success" : "Warning"} {msg}
    </div>
  );
}
