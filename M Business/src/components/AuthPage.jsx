import { useState } from "react";
import axios from "axios";

export default function AuthPage({ setUser }) {
  const [tab, setTab] = useState("login");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginErr, setLoginErr] = useState({});
  const [regData, setRegData] = useState({ name: "", email: "", phone: "", password: "", confirm: "", role: "Admin" });
  const [regErr, setRegErr] = useState({});

  const handleLogin = async () => {
    const errs = {};
    if (!loginData.email.trim()) errs.email = "Email is required";
    if (!loginData.password.trim()) errs.password = "Password is required";
    if (Object.keys(errs).length) { setLoginErr(errs); return; }
    try {
      setLoading(true); setError("");
      const res = await axios.post("http://localhost:5000/api/auth/login", loginData, { timeout: 5000 });
      const raw = res.data.user || res.data;
      console.log("✅ Login success:", raw);
      console.log("👤 Role:", raw?.role);
      localStorage.setItem("user", JSON.stringify(raw));
      setUser(raw);
    } catch (e) {
      setError(e.response?.data?.msg || e.response?.data?.message || "Invalid email or password.");
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
      await axios.post("http://localhost:5000/api/auth/signup", {
        name: regData.name, email: regData.email,
        password: regData.password, role: regData.role, phone: regData.phone,
      });
      setSuccess("Account created! Please log in.");
      setTab("login");
      setLoginData({ email: regData.email, password: "" });
      setRegData({ name: "", email: "", phone: "", password: "", confirm: "", role: "Admin" });
    } catch (e) {
      setError(e.response?.data?.msg || e.response?.data?.message || "Registration failed.");
    } finally { setLoading(false); }
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

  // Role options — SubAdmin added!
  const ROLES = [
    { key: "Admin",    icon: "🛡️", label: "Admin",    desc: "Full access" },
    { key: "subadmin", icon: "⚡", label: "SubAdmin",  desc: "Limited admin" },
    { key: "Manager",  icon: "👔", label: "Manager",   desc: "Project manage" },
    { key: "Employee", icon: "👤", label: "Employee",  desc: "Tasks only" },
  ];

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
        .auth-right { width: 480px; display: flex; align-items: center; justify-content: center; padding: 40px 36px; position: relative; z-index: 2; flex-shrink: 0; }
        .auth-card { width: 100%; background: rgba(255,255,255,0.07); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.16); border-radius: 22px; padding: 32px 28px; box-shadow: 0 32px 80px rgba(0,0,0,0.4); animation: fadeUp 0.5s ease; }
        .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .role-btn { padding: 10px 8px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.2s; text-align: center; }

        @media (max-width: 900px) {
          .auth-layout { flex-direction: column; }
          .auth-left { padding: 40px 24px 20px; flex: none; }
          .auth-left h1 { font-size: 28px !important; }
          .auth-left p { display: none; }
          .auth-stats { display: none !important; }
          .auth-right { width: 100%; padding: 20px 16px 40px; }
          .auth-card { padding: 24px 18px; }
        }
        @media (max-width: 480px) {
          .auth-left { padding: 28px 16px 12px; }
          .auth-left h1 { font-size: 22px !important; }
          .auth-right { padding: 12px 12px 32px; }
          .auth-card { padding: 20px 14px; border-radius: 16px; }
        }
      `}</style>

      {/* BG blobs */}
      <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(192,132,252,0.4),transparent 70%)", top:-160, left:-120, animation:"float1 7s ease-in-out infinite", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", width:380, height:380, borderRadius:"50%", background:"radial-gradient(circle,rgba(147,51,234,0.45),transparent 70%)", bottom:-100, left:"20%", animation:"float2 9s ease-in-out infinite", pointerEvents:"none" }}/>

      <div className="auth-layout">

        {/* ── LEFT PANEL ── */}
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
            Elevate your workspace with M Business Suite — designed for simplicity, security, and speed.
          </p>

          {/* Role guide */}
          <div style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:14, padding:"16px 18px", maxWidth:340 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"rgba(216,180,254,0.6)", letterSpacing:1.5, marginBottom:12 }}>WHO LOGS IN AS WHAT?</div>
            {[
              { icon:"🛡️", role:"Admin",    color:"#9333ea", desc:"Full dashboard — all menus" },
              { icon:"⚡", role:"SubAdmin",  color:"#6366f1", desc:"Dashboard — no employees/managers" },
              { icon:"👔", role:"Manager",   color:"#f59e0b", desc:"Projects, tasks, calendar only" },
              { icon:"👤", role:"Employee",  color:"#10b981", desc:"Tasks & calendar only" },
              { icon:"🏢", role:"Client",    color:"#c084fc", desc:"Client portal (separate dashboard)" },
            ].map(r => (
              <div key={r.role} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:`${r.color}25`, border:`1px solid ${r.color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>{r.icon}</div>
                <div>
                  <span style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{r.role}</span>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginLeft:8 }}>{r.desc}</span>
                </div>
              </div>
            ))}
            <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid rgba(255,255,255,0.08)", fontSize:10, color:"rgba(255,255,255,0.3)", lineHeight:1.6 }}>
              💡 Clients are added by Admin via <strong style={{color:"rgba(216,180,254,0.5)"}}>Add Client</strong> in Dashboard — they login with the email & password set there.
            </div>
          </div>

          <div className="auth-stats" style={{ display:"flex", gap:28, marginTop:36 }}>
            {[["500+","Clients"],["99%","Uptime"],["50+","Features"]].map(([n,l])=>(
              <div key={l}>
                <div style={{ fontSize:24, fontWeight:900, color:"#fff", letterSpacing:-0.5 }}>{n}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:600, marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="auth-right">
          <div className="auth-card">
            {/* Tab switcher */}
            <div style={{ display:"flex", background:"rgba(255,255,255,0.06)", borderRadius:10, padding:4, marginBottom:24, border:"1px solid rgba(255,255,255,0.1)" }}>
              {[["login","Login"],["register","Register"]].map(([k,l])=>(
                <button key={k} onClick={()=>{setTab(k);setError("");setSuccess("");setLoginErr({});setRegErr({});}}
                  style={{ flex:1, padding:"9px", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s",
                    background: tab===k ? "rgba(255,255,255,0.16)" : "transparent",
                    color: tab===k ? "#fff" : "rgba(255,255,255,0.38)",
                    boxShadow: tab===k ? "0 2px 10px rgba(0,0,0,0.2)" : "none",
                  }}>{l}</button>
              ))}
            </div>

            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.35)", letterSpacing:2, marginBottom:3 }}>
                {tab==="login" ? "WELCOME BACK" : "CREATE YOUR ACCOUNT"}
              </div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>
                {tab==="login" ? "Sign in to continue to your dashboard." : "Choose your role and fill in the details."}
              </div>
            </div>

            {success && <div style={{ background:"rgba(34,197,94,0.16)", border:"1px solid rgba(34,197,94,0.35)", borderRadius:9, padding:"10px 13px", marginBottom:16, fontSize:12.5, color:"#86efac" }}>✅ {success}</div>}
            {error && <div style={{ background:"rgba(239,68,68,0.16)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:9, padding:"10px 13px", marginBottom:16, fontSize:12, color:"#fca5a5", whiteSpace:"pre-line", lineHeight:1.7 }}>⚠️ {error}</div>}

            {/* ── LOGIN FORM ── */}
            {tab==="login" && (
              <div>
                <div style={{ marginBottom:14 }}>
                  <label style={lStyle}>Email Address</label>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, pointerEvents:"none" }}>✉️</span>
                    <input type="email" value={loginData.email}
                      onChange={e=>{setLoginData(p=>({...p,email:e.target.value}));setLoginErr(p=>({...p,email:""}));}}
                      placeholder="you@email.com"
                      style={{ ...iStyle(loginErr.email), paddingLeft:38 }}/>
                  </div>
                  {loginErr.email && <div style={{ fontSize:11, color:"#fca5a5", marginTop:4 }}>⚠️ {loginErr.email}</div>}
                </div>

                <div style={{ marginBottom:22 }}>
                  <label style={lStyle}>Password</label>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, pointerEvents:"none" }}>🔒</span>
                    <input type={showPass?"text":"password"} value={loginData.password}
                      onChange={e=>{setLoginData(p=>({...p,password:e.target.value}));setLoginErr(p=>({...p,password:""}));}}
                      onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                      placeholder="••••••••"
                      style={{ ...iStyle(loginErr.password), paddingLeft:38, paddingRight:56 }}/>
                    <button type="button" onClick={()=>setShowPass(!showPass)}
                      style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,0.45)", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                      {showPass?"HIDE":"SHOW"}
                    </button>
                  </div>
                  {loginErr.password && <div style={{ fontSize:11, color:"#fca5a5", marginTop:4 }}>⚠️ {loginErr.password}</div>}
                </div>

                <button onClick={handleLogin} disabled={loading}
                  style={{ width:"100%", padding:"13px 18px", background: loading?"rgba(255,255,255,0.08)":"linear-gradient(135deg,#7c3aed,#9333ea)", border:"none", borderRadius:11, fontSize:14, fontWeight:800, color:"#fff", cursor: loading?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow: loading?"none":"0 6px 22px rgba(147,51,234,0.4)", transition:"all 0.2s" }}>
                  <span>{loading ? "Signing in..." : "Proceed to my Account"}</span>
                  {loading ? <span style={{ width:17, height:17, border:"2px solid rgba(255,255,255,0.2)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/> : <span>→</span>}
                </button>

                <div style={{ textAlign:"center", marginTop:18, fontSize:12, color:"rgba(255,255,255,0.3)" }}>
                  Don't have an account?{" "}
                  <button onClick={()=>{setTab("register");setError("");}}
                    style={{ background:"none", border:"none", color:"rgba(216,180,254,0.8)", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>
                    Register here →
                  </button>
                </div>
              </div>
            )}

            {/* ── REGISTER FORM ── */}
            {tab==="register" && (
              <div>
                {/* Role selector — 2x2 grid with SubAdmin */}
                <div style={{ marginBottom:18 }}>
                  <label style={lStyle}>Select Your Role</label>
                  <div className="role-grid">
                    {ROLES.map(r => {
                      const sel = regData.role === r.key;
                      return (
                        <button key={r.key} onClick={()=>setRegData(p=>({...p,role:r.key}))}
                          className="role-btn"
                          style={{
                            border: `1.5px solid ${sel ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.12)"}`,
                            background: sel ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.04)",
                            color: sel ? "#fff" : "rgba(255,255,255,0.4)",
                          }}>
                          <div style={{ fontSize:18, marginBottom:3 }}>{r.icon}</div>
                          <div style={{ fontSize:12, fontWeight:700 }}>{r.label}</div>
                          <div style={{ fontSize:10, opacity:0.6, marginTop:1 }}>{r.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fields */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
                  <div style={{ gridColumn:"1/-1", marginBottom:12 }}>
                    <label style={lStyle}>Full Name</label>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, pointerEvents:"none" }}>👤</span>
                      <input value={regData.name} onChange={e=>{setRegData(p=>({...p,name:e.target.value}));setRegErr(p=>({...p,name:""}));}} placeholder="Your full name" style={{ ...iStyle(regErr.name), paddingLeft:38 }}/>
                    </div>
                    {regErr.name && <div style={{ fontSize:11, color:"#fca5a5", marginTop:4 }}>⚠️ {regErr.name}</div>}
                  </div>

                  <div style={{ marginBottom:12 }}>
                    <label style={lStyle}>Email</label>
                    <input type="email" value={regData.email} onChange={e=>{setRegData(p=>({...p,email:e.target.value}));setRegErr(p=>({...p,email:""}));}} placeholder="you@email.com" style={{ ...iStyle(regErr.email) }}/>
                    {regErr.email && <div style={{ fontSize:11, color:"#fca5a5", marginTop:4 }}>⚠️ {regErr.email}</div>}
                  </div>

                  <div style={{ marginBottom:12 }}>
                    <label style={lStyle}>Phone</label>
                    <input value={regData.phone} onChange={e=>setRegData(p=>({...p,phone:e.target.value}))} placeholder="+91 98765 43210" style={iStyle(false)}/>
                  </div>

                  <div style={{ marginBottom:12 }}>
                    <label style={lStyle}>Password</label>
                    <div style={{ position:"relative" }}>
                      <input type={showPass?"text":"password"} value={regData.password} onChange={e=>{setRegData(p=>({...p,password:e.target.value}));setRegErr(p=>({...p,password:""}));}} placeholder="Min 6 chars" style={{ ...iStyle(regErr.password), paddingRight:52 }}/>
                      <button type="button" onClick={()=>setShowPass(!showPass)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,0.45)", fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{showPass?"HIDE":"SHOW"}</button>
                    </div>
                    {regErr.password && <div style={{ fontSize:11, color:"#fca5a5", marginTop:4 }}>⚠️ {regErr.password}</div>}
                  </div>

                  <div style={{ gridColumn:"1/-1", marginBottom:16 }}>
                    <label style={lStyle}>Confirm Password</label>
                    <div style={{ position:"relative" }}>
                      <input type={showConfirm?"text":"password"} value={regData.confirm} onChange={e=>{setRegData(p=>({...p,confirm:e.target.value}));setRegErr(p=>({...p,confirm:""}));}} onKeyDown={e=>e.key==="Enter"&&handleRegister()} placeholder="Repeat password" style={{ ...iStyle(regErr.confirm), paddingRight:52 }}/>
                      <button type="button" onClick={()=>setShowConfirm(!showConfirm)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,0.45)", fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{showConfirm?"HIDE":"SHOW"}</button>
                    </div>
                    {regErr.confirm && <div style={{ fontSize:11, color:"#fca5a5", marginTop:4 }}>⚠️ {regErr.confirm}</div>}
                  </div>
                </div>

                {/* Role preview */}
                <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, padding:"9px 12px", marginBottom:16, fontSize:11, color:"rgba(255,255,255,0.5)", display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:16 }}>{ROLES.find(r=>r.key===regData.role)?.icon}</span>
                  <span>Registering as <strong style={{color:"rgba(216,180,254,0.8)"}}>{regData.role}</strong> — {ROLES.find(r=>r.key===regData.role)?.desc}</span>
                </div>

                <button onClick={handleRegister} disabled={loading}
                  style={{ width:"100%", padding:"13px 18px", background: loading?"rgba(255,255,255,0.08)":"linear-gradient(135deg,#7c3aed,#9333ea)", border:"none", borderRadius:11, fontSize:14, fontWeight:800, color:"#fff", cursor: loading?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow: loading?"none":"0 6px 22px rgba(147,51,234,0.4)" }}>
                  <span>{loading ? "Creating account..." : "Create My Account →"}</span>
                  {loading && <span style={{ width:17, height:17, border:"2px solid rgba(255,255,255,0.2)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>}
                </button>

                <div style={{ textAlign:"center", marginTop:16, fontSize:12, color:"rgba(255,255,255,0.3)" }}>
                  Already have an account?{" "}
                  <button onClick={()=>{setTab("login");setError("");}}
                    style={{ background:"none", border:"none", color:"rgba(216,180,254,0.8)", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>
                    Sign in →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
