import { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../config";
export default function AuthPage({ setUser, initialTab = "login" }) {
  const normalizedInitialTab = initialTab === "register" ? "register" : "login";
  const [tab, setTab] = useState(normalizedInitialTab);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginErr, setLoginErr] = useState({});
  const [regData, setRegData] = useState({ name: "", email: "", phone: "", password: "", confirm: "", role: "Subadmin", companyName: "", companyType: "IT", employeeCount: "0-10" });
  const [regErr, setRegErr] = useState({});
const handleLogin = async () => {
  const errs = {};
  if (!loginData.email.trim()) errs.email = "Email is required";
  if (!loginData.password.trim()) errs.password = "Password is required";
  if (Object.keys(errs).length) { setLoginErr(errs); return; }

  try {
    setLoading(true);
    setError("");

    const res = await axios.post(
      `${BASE_URL}/api/auth/login`,
      loginData
    );

    const userData = res.data.user || res.data;
    const userWithLogo = { ...userData, logoUrl: userData.logoUrl || "" };

    localStorage.setItem("user", JSON.stringify(userWithLogo));
    setUser(userWithLogo);

  } catch (e) {
    setError(
      e.response?.data?.msg ||
      e.response?.data?.message ||
      "Invalid email or password."
    );
  } finally {
    setLoading(false);
  }
};const handleRegister = async () => {
  const errs = {};
  if (!regData.name.trim()) errs.name = "Name is required";
  if (!regData.email.trim()) errs.email = "Email is required";
  if (!regData.password.trim()) errs.password = "Password is required";
  else if (regData.password.length < 6) errs.password = "Minimum 6 characters";
  if (regData.password !== regData.confirm) errs.confirm = "Passwords do not match";

  if (Object.keys(errs).length) { 
    setRegErr(errs); 
    return; 
  }

  try {
    setLoading(true);
    setError("");

    console.log("Sending data:", regData); // 🔥 debug

    const payload = {
        name: regData.name,
        email: regData.email,
        password: regData.password,
        role: regData.role,
        phone: regData.phone,
      };

      // Add company details for Subadmin registration
      if (regData.role === "Subadmin") {
        payload.companyName = regData.companyName;
        payload.companyType = regData.companyType;
        payload.employeeCount = regData.employeeCount;
      }

    const res = await axios.post(
      `${BASE_URL}/api/auth/signup`,
      payload,
      {
        timeout: 15000  // ⏱️ important (15 sec)
      }
    );

    console.log("Response:", res.data); // 🔥 debug

    setSuccess("Account created successfully!");
    
    // Auto-login after successful registration
    const userData = res.data.user;
    if (userData) {
      const userWithLogo = { ...userData, logoUrl: userData.logoUrl || "" };
      localStorage.setItem("user", JSON.stringify(userWithLogo));
      setUser(userWithLogo);
    } else {
      setTab("login");
    }

  } catch (e) {
    console.log("ERROR:", e); // 🔥 debug

    if (e.code === "ECONNABORTED") {
      setError("Server slow (Render sleep). Please try again.");
    } else {
      setError(
        e.response?.data?.msg ||
        e.response?.data?.message ||
        "Registration failed."
      );
    }
  } finally {
    setLoading(false);
  }
};
  const iStyle = (err) => ({
    width: "100%", padding: "12px 16px",
    background: "rgba(255,255,255,0.1)",
    border: `1.5px solid ${err ? "rgba(248,113,113,0.7)" : "rgba(255,255,255,0.2)"}`,
    borderRadius: 10, fontSize: 14, color: "#fff", outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  });

  const lStyle = {
    display: "block", fontSize: 10, fontWeight: 700,
    color: "rgba(255,255,255,0.45)", letterSpacing: 1.2,
    marginBottom: 6, textTransform: "uppercase",
  };

  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      background: "linear-gradient(135deg,#0f0528 0%,#1e0a3c 40%,#3b0764 75%,#1e0a3c 100%)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: "relative", overflow: "hidden",
      display: "flex", alignItems: "stretch",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(255,255,255,0.28); }
        input:focus { border-color: rgba(167,139,250,0.7) !important; background: rgba(255,255,255,0.14) !important; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 30px #2d0a6e inset !important; -webkit-text-fill-color: #fff !important; }
        @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-28px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(22px)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .auth-layout { display: flex; width: 100%; min-height: 100vh; }
        .auth-left { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 60px 56px; position: relative; z-index: 1; }
        .auth-right { width: 460px; display: flex; align-items: center; justify-content: center; padding: 40px 36px; position: relative; z-index: 2; flex-shrink: 0; }
        .auth-card { width: 100%; background: rgba(255,255,255,0.07); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.16); border-radius: 22px; padding: 36px 32px; box-shadow: 0 32px 80px rgba(0,0,0,0.4); animation: fadeUp 0.5s ease; }
        .reg-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px; }

        @media (max-width: 900px) {
          .auth-layout { flex-direction: column; }
          .auth-left { padding: 40px 24px 20px; flex: none; }
          .auth-left h1 { font-size: 28px !important; }
          .auth-left p { display: none; }
          .auth-stats { display: none !important; }
          .auth-right { width: 100%; padding: 20px 16px 40px; }
          .auth-card { padding: 28px 20px; }
        }
        @media (max-width: 480px) {
          .auth-left { padding: 28px 16px 12px; }
          .auth-left h1 { font-size: 22px !important; }
          .auth-right { padding: 12px 12px 32px; }
          .auth-card { padding: 22px 16px; border-radius: 16px; }
          .reg-grid { grid-template-columns: 1fr; }
          .role-btns { flex-direction: column !important; }
        }
      `}</style>

      {/* Blobs */}
      <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(192,132,252,0.4),transparent 70%)", top:-160, left:-120, animation:"float1 7s ease-in-out infinite", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", width:380, height:380, borderRadius:"50%", background:"radial-gradient(circle,rgba(147,51,234,0.45),transparent 70%)", bottom:-100, left:"20%", animation:"float2 9s ease-in-out infinite", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", width:280, height:280, borderRadius:"50%", background:"radial-gradient(circle,rgba(216,180,254,0.25),transparent 70%)", top:"-5%", left:"50%", animation:"float2 8s ease-in-out infinite 1s", pointerEvents:"none" }}/>

      <div className="auth-layout">
        {/* LEFT */}
        <div className="auth-left">
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:48 }}>
            <div style={{ width:48, height:48, background:"rgba(255,255,255,0.14)", backdropFilter:"blur(10px)", border:"1.5px solid rgba(255,255,255,0.22)", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:22, color:"#fff" }}>M</div>
            <span style={{ fontSize:20, fontWeight:800, color:"#fff", letterSpacing:-0.3 }}>M Business</span>
          </div>
          <h1 style={{ margin:"0 0 18px", fontSize:"clamp(28px,3.5vw,50px)", fontWeight:900, color:"#fff", lineHeight:1.15, letterSpacing:-1 }}>
            We Are The Best<br/>
            <span style={{ color:"rgba(216,180,254,0.88)" }}>In Business</span>
          </h1>
          <p style={{ margin:"0 0 44px", fontSize:14, color:"rgba(255,255,255,0.5)", lineHeight:1.8, maxWidth:360 }}>
            Elevate your workspace efficiency with M Business Suite. Designed with simplicity, security, and speed in mind — perfectly aligned for growing businesses.
          </p>
          <div className="auth-stats" style={{ display:"flex", gap:28 }}>
            {[["500+","Clients"],["99%","Uptime"],["50+","Features"]].map(([n,l])=>(
              <div key={l}>
                <div style={{ fontSize:24, fontWeight:900, color:"#fff", letterSpacing:-0.5 }}>{n}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:600, marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="auth-right">
          <div className="auth-card">
            {/* Tab */}
            <div style={{ display:"flex", background:"rgba(255,255,255,0.06)", borderRadius:10, padding:4, marginBottom:26, border:"1px solid rgba(255,255,255,0.1)" }}>
              {[["login","Login"],["register","Register"]].map(([k,l])=>(
                <button key={k} onClick={()=>{setTab(k);setError("");setSuccess("");setLoginErr({});setRegErr({});}}
                  style={{ flex:1, padding:"9px", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s",
                    background: tab===k ? "rgba(255,255,255,0.16)" : "transparent",
                    color: tab===k ? "#fff" : "rgba(255,255,255,0.38)",
                    boxShadow: tab===k ? "0 2px 10px rgba(0,0,0,0.2)" : "none",
                  }}>{l}</button>
              ))}
            </div>

            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.35)", letterSpacing:2, marginBottom:4 }}>
                {tab==="login" ? "WELCOME BACK" : "CREATE YOUR ACCOUNT"}
              </div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>
                {tab==="login" ? "" : "Fill in the details below to get started."}
              </div>
            </div>

            {success && <div style={{ background:"rgba(34,197,94,0.16)", border:"1px solid rgba(34,197,94,0.35)", borderRadius:9, padding:"10px 13px", marginBottom:16, fontSize:12.5, color:"#86efac" }}>✅ {success}</div>}
            {error && <div style={{ background:"rgba(239,68,68,0.16)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:9, padding:"10px 13px", marginBottom:16, fontSize:12.5, color:"#fca5a5" }}>⚠️ {error}</div>}

            {/* LOGIN */}
            {tab==="login" && (
              <div>
                <div style={{ marginBottom:14 }}>
                  <label style={lStyle}>Email Address</label>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, pointerEvents:"none" }}>✉️</span>
                    <input type="email" value={loginData.email} onChange={e=>{setLoginData(p=>({...p,email:e.target.value}));setLoginErr(p=>({...p,email:""}));}} placeholder="you@email.com" style={{ ...iStyle(loginErr.email), paddingLeft:38 }}/>
                  </div>
                  {loginErr.email && <div style={{ fontSize:11, color:"#fca5a5", marginTop:4 }}>⚠️ {loginErr.email}</div>}
                </div>
                <div style={{ marginBottom:22 }}>
                  <label style={lStyle}>Password</label>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, pointerEvents:"none" }}>🔒</span>
                    <input type={showPass?"text":"password"} value={loginData.password} onChange={e=>{setLoginData(p=>({...p,password:e.target.value}));setLoginErr(p=>({...p,password:""}));}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="••••••••" style={{ ...iStyle(loginErr.password), paddingLeft:38, paddingRight:56 }}/>
                    <button type="button" onClick={()=>setShowPass(!showPass)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,0.45)", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{showPass?"HIDE":"SHOW"}</button>
                  </div>
                  {loginErr.password && <div style={{ fontSize:11, color:"#fca5a5", marginTop:4 }}>⚠️ {loginErr.password}</div>}
                </div>
                <button onClick={handleLogin} disabled={loading} style={{ width:"100%", padding:"13px 18px", background: loading?"rgba(255,255,255,0.08)":"#1e0a3c", border:"1px solid rgba(255,255,255,0.1)", borderRadius:11, fontSize:14, fontWeight:800, color:"#fff", cursor: loading?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow: loading?"none":"0 6px 22px rgba(0,0,0,0.35)", transition:"all 0.2s" }}>
                  <span>{loading ? "Signing in..." : "Proceed to my Account"}</span>
                  {loading ? <span style={{ width:17, height:17, border:"2px solid rgba(255,255,255,0.2)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/> : <span>→</span>}
                </button>
                <div style={{ textAlign:"center", marginTop:18, fontSize:12, color:"rgba(255,255,255,0.3)" }}>
                  Don't have an account?{" "}
                  <button onClick={()=>{setTab("register");setError("");}} style={{ background:"none", border:"none", color:"rgba(216,180,254,0.8)", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>Register here →</button>
                </div>
              </div>
            )}

            {/* REGISTER */}
            {tab==="register" && (
              <div>
                <div className="reg-grid">
                  <div style={{ gridColumn:"1/-1", marginBottom:13 }}>
                    <label style={lStyle}>Full Name</label>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, pointerEvents:"none" }}>👤</span>
                      <input value={regData.name} onChange={e=>{setRegData(p=>({...p,name:e.target.value}));setRegErr(p=>({...p,name:""}));}} placeholder="Your full name" style={{ ...iStyle(regErr.name), paddingLeft:38 }}/>
                    </div>
                    {regErr.name && <div style={{ fontSize:11, color:"#fca5a5", marginTop:4 }}>⚠️ {regErr.name}</div>}
                  </div>
                  <div style={{ marginBottom:13 }}>
                    <label style={lStyle}>Email</label>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, pointerEvents:"none" }}>✉️</span>
                      <input type="email" value={regData.email} onChange={e=>{setRegData(p=>({...p,email:e.target.value}));setRegErr(p=>({...p,email:""}));}} placeholder="you@email.com" style={{ ...iStyle(regErr.email), paddingLeft:38 }}/>
                    </div>
                    {regErr.email && <div style={{ fontSize:11, color:"#fca5a5", marginTop:4 }}>⚠️ {regErr.email}</div>}
                  </div>
                  <div style={{ marginBottom:13 }}>
                    <label style={lStyle}>Phone</label>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, pointerEvents:"none" }}>📱</span>
                      <input value={regData.phone} onChange={e=>setRegData(p=>({...p,phone:e.target.value}))} placeholder="+91 98765 43210" style={{ ...iStyle(false), paddingLeft:38 }}/>
                    </div>
                  </div>
                  <div style={{ marginBottom:13 }}>
                    <label style={lStyle}>Password</label>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, pointerEvents:"none" }}>🔒</span>
                      <input type={showPass?"text":"password"} value={regData.password} onChange={e=>{setRegData(p=>({...p,password:e.target.value}));setRegErr(p=>({...p,password:""}));}} placeholder="Min 6 chars" style={{ ...iStyle(regErr.password), paddingLeft:38, paddingRight:56 }}/>
                      <button type="button" onClick={()=>setShowPass(!showPass)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,0.45)", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{showPass?"HIDE":"SHOW"}</button>
                    </div>
                    {regErr.password && <div style={{ fontSize:11, color:"#fca5a5", marginTop:4 }}>⚠️ {regErr.password}</div>}
                  </div>
                  {/* Role Selection - Client registration disabled, only Subadmin allowed */}
                  <div style={{ gridColumn:"1/-1", marginBottom:13 }}>

                    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                      
                    </div>
                    
                  </div>

                  {/* Company Fields - Only for Subadmin */}
                  {regData.role === "Subadmin" && (
                    <>
                      <div style={{ gridColumn:"1/-1", marginBottom:13 }}>
                        <label style={lStyle}>Company Name</label>
                        <div style={{ position:"relative" }}>
                          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, pointerEvents:"none" }}>🏢</span>
                          <input value={regData.companyName} onChange={e=>setRegData(p=>({...p,companyName:e.target.value}))} placeholder="Your company name" style={{ ...iStyle(regErr.companyName), paddingLeft:38 }}/>
                        </div>
                      </div>
                      <div style={{ marginBottom:13 }}>
                        <label style={lStyle}>Company Type</label>
                        <select
                          value={regData.companyType}
                          onChange={e=>setRegData(p=>({...p,companyType:e.target.value}))}
                          style={{ ...iStyle(false), paddingLeft:12, cursor:"pointer" }}
                        >
                          <option value="IT" style={{background:"#1e0a3c",color:"#fff"}}>IT</option>
                          <option value="Software" style={{background:"#1e0a3c",color:"#fff"}}>Software</option>
                          <option value="Services" style={{background:"#1e0a3c",color:"#fff"}}>Services</option>
                          <option value="Consulting" style={{background:"#1e0a3c",color:"#fff"}}>Consulting</option>
                          <option value="Other" style={{background:"#1e0a3c",color:"#fff"}}>Other</option>
                        </select>
                      </div>
                      <div style={{ marginBottom:13 }}>
                        <label style={lStyle}>No. of Employees</label>
                        <select
                          value={regData.employeeCount}
                          onChange={e=>setRegData(p=>({...p,employeeCount:e.target.value}))}
                          style={{ ...iStyle(false), paddingLeft:12, cursor:"pointer" }}
                        >
                          {["0-10","11-50","51-100","100+"].map(ec => (
                            <option key={ec} value={ec} style={{background:"#1e0a3c",color:"#fff"}}>{ec}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div style={{ gridColumn:"1/-1", marginBottom:13 }}>
                    <label style={lStyle}>Confirm Password</label>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, pointerEvents:"none" }}>✅</span>
                      <input type={showConfirm?"text":"password"} value={regData.confirm} onChange={e=>{setRegData(p=>({...p,confirm:e.target.value}));setRegErr(p=>({...p,confirm:""}));}} onKeyDown={e=>e.key==="Enter"&&handleRegister()} placeholder="Repeat password" style={{ ...iStyle(regErr.confirm), paddingLeft:38, paddingRight:56 }}/>
                      <button type="button" onClick={()=>setShowConfirm(!showConfirm)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,0.45)", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{showConfirm?"HIDE":"SHOW"}</button>
                    </div>
                    {regErr.confirm && <div style={{ fontSize:11, color:"#fca5a5", marginTop:4 }}>⚠️ {regErr.confirm}</div>}
                  </div>
                </div>
                <button onClick={handleRegister} disabled={loading} style={{ width:"100%", padding:"13px 18px", background: loading?"rgba(255,255,255,0.08)":"#1e0a3c", border:"1px solid rgba(255,255,255,0.1)", borderRadius:11, fontSize:14, fontWeight:800, color:"#fff", cursor: loading?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow: loading?"none":"0 6px 22px rgba(0,0,0,0.35)" }}>
                  <span>{loading ? "Creating account..." : "Create My Account"}</span>
                  {loading ? <span style={{ width:17, height:17, border:"2px solid rgba(255,255,255,0.2)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/> : <span>→</span>}
                </button>
                <div style={{ textAlign:"center", marginTop:18, fontSize:12, color:"rgba(255,255,255,0.3)" }}>
                  Already have an account?{" "}
                  <button onClick={()=>{setTab("login");setError("");}} style={{ background:"none", border:"none", color:"rgba(216,180,254,0.8)", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>Sign in →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
