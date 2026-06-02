import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

old_block = """        <div className="sidebar-bottom">
          <button className="upload-btn" onClick={() => setActive("invoices")}><i className="ti ti-plus" style={{fontSize:15}}></i> New Invoice</button>
        </div>"""

new_block = """        <div className="sidebar-bottom" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: 'var(--app-muted)', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--app-accent)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--app-muted)'}>
            <i className="ti ti-copy" style={{ fontSize: 28, marginBottom: 6 }}></i>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Move File</span>
          </div>
          <button onClick={() => document.getElementById('global-file-upload')?.click()} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: 'var(--app-accent)', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(var(--app-accent-rgb), 0.3)', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <i className="ti ti-upload" style={{ fontSize: 18 }}></i> Upload File
          </button>
          <input type="file" id="global-file-upload" style={{ display: 'none' }} />
        </div>"""

if old_block in text:
    text = text.replace(old_block, new_block)
    with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("Replaced successfully")
else:
    print("Old block not found!")
