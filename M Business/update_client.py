import re
with open(r"C:\M Business\M Business\src\components\ClientDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

messages_comp = """// ── Messages / Documents Page ──────────────────────────────────
function MessagesPage() {
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  // A file can only be shown inline (image/PDF) — anything else the browser
  // will always try to download, so we don't offer a fake "view" for those.
  const isPreviewableFile = (file) => {
    const mime = (file?.type || "").toLowerCase();
    const name = (file?.name || "").toLowerCase();
    if (mime.includes("pdf") || name.endsWith(".pdf")) return "pdf";
    if (mime.includes("image") || /\.(jpg|jpeg|png|gif|webp|svg)$/.test(name)) return "image";
    return null;
  };

  useEffect(() => {
    // Read from localStorage
    const saved = JSON.parse(localStorage.getItem('client_documents') || '[]');
    setDocs(saved);
  }, []);

  if (selectedDoc) {
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <button onClick={() => setSelectedDoc(null)} style={{ background:C.surface, border:`1px solid ${C.border}`, color:C.text, padding:"8px 16px", borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
            <i className="ti ti-arrow-left"></i> Back to Messages
          </button>
          <div style={{ fontSize:16, fontWeight:700, color:C.text }}>{selectedDoc.docType.toUpperCase()} Document</div>
        </div>
        <div style={{ flex:1, background:"#fff", borderRadius:12, padding:20, overflowY:"auto", color:"#000" }} dangerouslySetInnerHTML={{ __html: selectedDoc.htmlContent }} />
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ fontSize:18, fontWeight:700, color:C.text, fontFamily:"'Space Grotesk'" }}>Received Documents</div>
      <div style={{ display:"grid", gap:12 }}>
        {docs.map(doc => (
          <div key={doc.id} onClick={() => setSelectedDoc(doc)} style={{ background:C.card, border:`1px solid ${C.border}`, padding:20, borderRadius:12, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", transition:"all 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = C.pink} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:C.gradSoft, display:"flex", alignItems:"center", justifyContent:"center", color:C.pink }}>
                <i className="ti ti-file-text" style={{ fontSize:20 }}></i>
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:600, color:C.text, textTransform:"capitalize" }}>{doc.docType} received</div>
                <div style={{ fontSize:12, color:C.muted }}>Sent on {new Date(doc.dateSent).toLocaleString()}</div>
              </div>
            </div>
            <i className="ti ti-chevron-right" style={{ color:C.muted }}></i>
          </div>
        ))}
        {docs.length === 0 && <div style={{ color:C.muted, textAlign:"center", padding:40 }}>No documents received yet.</div>}
      </div>
    </div>
  );
}
"""

idx_placeholder = text.find('// ── Placeholder')
if idx_placeholder != -1:
    text = text[:idx_placeholder] + messages_comp + "\n" + text[idx_placeholder:]

text = text.replace('{active==="messages"  && <PlaceholderPage icon="ti-message-circle" title="Messages"          sub="Communicate directly with your project team."/>}', '{active==="messages"  && <MessagesPage />}')

with open(r"C:\M Business\M Business\src\components\ClientDashboard.jsx", "w", encoding="utf-8") as f:
    f.write(text)
print("Updated ClientDashboard.jsx")
