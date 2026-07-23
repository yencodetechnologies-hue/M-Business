import React, { useState } from 'react';

export default function AuditorLogin({ onLogin }) {
  const [email, setEmail] = useState('rajan@srca.co.in');
  const [password, setPassword] = useState('password');

  const doLogin = () => {
    if (!email) {
      alert('Enter email');
      return;
    }
    if (onLogin) onLogin();
  };

  const otpLogin = () => {
    alert('OTP sent to registered mobile number.');
    if (onLogin) onLogin();
  };

  return (
    <>
      <style>{`
*{margin:0;padding:0;box-sizing:border-box;}
.auditor-login-body {font-family:"Nunito",sans-serif;min-height:100vh;display:flex;background:#0D1B2A;}
.left-panel{flex:1;background:linear-gradient(135deg,#0D1B2A 0%,#1a2a4a 50%,#0D2040 100%);display:flex;flex-direction:column;justify-content:center;padding:60px;position:relative;overflow:hidden;}
.left-panel::before{content:"";position:absolute;top:-100px;right:-100px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,.15) 0%,transparent 70%);}
.left-panel::after{content:"";position:absolute;bottom:-80px;left:-80px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(0,188,212,.1) 0%,transparent 70%);}
.brand{display:flex;align-items:center;gap:12px;margin-bottom:56px;}
.brand-icon{width:44px;height:44px;background:linear-gradient(135deg,var(--app-accent),#0097A7);border-radius:12px;display:flex;align-items:center;justify-content:center;}
.brand-icon i{font-size:22px;color:#fff;}
.brand-name{font-size:22px;font-weight:900;color:#fff;}
.brand-name span{color: var(--app-accent, var(--app-accent, #00BCD4));}
.panel-title{font-size:36px;font-weight:900;color:#fff;line-height:1.2;margin-bottom:16px;}
.panel-title span{color:#8B5CF6;}
.panel-sub{font-size:15px;color:rgba(255,255,255,.55);line-height:1.7;max-width:380px;}
.features{margin-top:40px;display:flex;flex-direction:column;gap:14px;}
.feat{display:flex;align-items:center;gap:12px;font-size:13px;color:rgba(255,255,255,.7);font-weight:600;}
.feat-icon{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.feat-icon i{font-size:16px;}
.right-panel{width:480px;background:#fff;display:flex;flex-direction:column;justify-content:center;padding:56px 48px;}
.login-title{font-size:24px;font-weight:900;color:#1A2332;margin-bottom:6px;}
.login-sub{font-size:13px;color:#718096;margin-bottom:32px;}
.form-group{margin-bottom:18px;}
.form-group label{display:block;font-size:11px;font-weight:800;color:#4A5568;text-transform:uppercase;letter-spacing:.7px;margin-bottom:7px;}
.inp{width:100%;padding:13px 16px;border:1.5px solid #E2E8F0;border-radius:12px;font-family:"Nunito",sans-serif;font-size:14px;color:#1A2332;background:#F7FAFC;outline:none;transition:all .15s;}
.inp:focus{border-color:#E2E8F0;background:#F7FAFC;box-shadow:none;outline:none;}
.inp-icon-wrap{position:relative;}
.inp-icon-wrap .inp{padding-left:44px;}
.inp-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#718096;font-size:18px;}
.login-btn{width:100%;padding:14px;background:linear-gradient(135deg,#8B5CF6,#7C3AED);color:#fff;border:none;border-radius:12px;font-family:"Nunito",sans-serif;font-size:15px;font-weight:800;cursor:pointer;transition:all .18s;margin-top:8px;display:flex;align-items:center;justify-content:center;gap:8px;}
.login-btn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(139,92,246,.35);}
.divider{display:flex;align-items:center;gap:12px;margin:22px 0;color:#718096;font-size:12px;font-weight:600;}
.divider::before,.divider::after{content:"";flex:1;height:1px;background:#E2E8F0;}
.otp-btn{width:100%;padding:12px;background:transparent;border:1.5px solid #E2E8F0;border-radius:12px;font-family:"Nunito",sans-serif;font-size:14px;font-weight:700;color:#4A5568;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .15s;}
.otp-btn:hover{border-color:#8B5CF6;color:#8B5CF6;background:#F5F3FF;}
.login-footer{margin-top:28px;font-size:12px;color:#718096;text-align:center;}
.login-footer a{color:#8B5CF6;font-weight:700;text-decoration:none;}
.secure-badge{display:flex;align-items:center;gap:6px;background:#F0FFF4;border:1px solid #6EE7B7;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;color:#065F46;margin-bottom:24px;}
      `}</style>
      <div className="auditor-login-body">
        <div className="left-panel">
          <div className="brand">
            <div className="brand-icon"><i className="ti ti-building-skyscraper"></i></div>
            <div className="brand-name">M <span>Business</span></div>
          </div>
          <div className="panel-title">Auditor <span>Portal</span><br />Access</div>
          <div className="panel-sub">Securely review your client's financial records, download statements, and add audit remarks — all in one place.</div>
          <div className="features">
            <div className="feat"><div className="feat-icon" style={{ background: 'rgba(139,92,246,.2)' }}><i className="ti ti-file-analytics" style={{ color: '#8B5CF6' }}></i></div>View full income & expense statements</div>
            <div className="feat"><div className="feat-icon" style={{ background: 'rgba(0,188,212,.2)' }}><i className="ti ti-building-bank" style={{ color: ' var(--app-accent, var(--app-accent, #00BCD4))' }}></i></div>Bank reconciliation & transaction review</div>
            <div className="feat"><div className="feat-icon" style={{ background: 'rgba(38,194,129,.2)' }}><i className="ti ti-download" style={{ color: '#26C281' }}></i></div>Download PDF, Excel & CSV reports</div>
            <div className="feat"><div className="feat-icon" style={{ background: 'rgba(245,158,11,.2)' }}><i className="ti ti-message-2" style={{ color: '#F59E0B' }}></i></div>Add audit notes & flag transactions</div>
          </div>
        </div>
        <div className="right-panel">
          <div className="login-title">Auditor Sign In</div>
          <div className="login-sub">Enter your credentials to access the audit portal</div>
          <div className="secure-badge"><i className="ti ti-shield-check" style={{ fontSize: '15px' }}></i>256-bit encrypted secure access</div>
          <div className="form-group">
            <label>Auditor Email *</label>
            <div className="inp-icon-wrap">
              <i className="ti ti-mail inp-icon"></i>
              <input className="inp" type="email" placeholder="auditor@yourfirm.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Password *</label>
            <div className="inp-icon-wrap">
              <i className="ti ti-lock inp-icon"></i>
              <input className="inp" type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Client Company</label>
            <div className="inp-icon-wrap">
              <i className="ti ti-building inp-icon"></i>
              <input className="inp" defaultValue="Your Company Pvt Ltd" readOnly style={{ background: '#F7FAFC', color: '#718096' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', fontSize: '13px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: '#4A5568' }}><input type="checkbox" style={{ accentColor: '#8B5CF6' }} /> Remember this device</label>
            <a href="#" style={{ color: '#8B5CF6', fontWeight: 700, textDecoration: 'none' }}>Forgot password?</a>
          </div>
          <button className="login-btn" onClick={doLogin}><i className="ti ti-shield-lock"></i>Sign In to Audit Portal</button>
          <div className="divider">or verify with</div>
          <button className="otp-btn" onClick={otpLogin}><i className="ti ti-device-mobile"></i>Sign In with OTP</button>
          <div className="login-footer">
            Not an auditor? <a href="#">Back to Admin</a><br /><br />
            <span style={{ fontSize: '11px' }}>Access is restricted to authorised auditors only.<br />All sessions are logged for compliance.</span>
          </div>
        </div>
      </div>
    </>
  );
}