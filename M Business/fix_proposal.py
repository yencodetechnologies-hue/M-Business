import re

file_path = r'C:\M Business\M Business\src\components\ProjectProposalCreator.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add missing imports if needed
if 'useRef' not in content:
    content = content.replace('useState', 'useState, useRef, useEffect', 1)

injection = """
  const iframeRef = useRef(null);

  useEffect(() => {
    const handleMsg = (e) => {
      if (e.data?.type === 'SAVE_DOCUMENT' && e.data?.payload?.docType === 'prop') {
        const payload = e.data.payload;
        const newDoc = {
          _id: Date.now().toString(),
          proposalNo: payload.invoiceNo || `PROP-${Date.now()}`,
          clientName: payload.client || 'Unknown Client',
          title: payload.client + ' - Proposal',
          date: payload.date || new Date().toISOString().split('T')[0],
          status: 'draft',
          amount: payload.amount || 0,
          htmlContent: payload.htmlContent,
          type: 'proposal'
        };
        setProposals(prev => [newDoc, ...prev]);
        setView("list");
        if(typeof flash === 'function') flash(" Proposal saved successfully!");
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  const sendThemeToIframe = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const color = getComputedStyle(document.documentElement).getPropertyValue('--teal').trim() || '#00BCD4';
      iframeRef.current.contentWindow.postMessage({ type: 'SET_THEME', color }, '*');
    }
  };
"""

# Inject after const [doc, setDoc] = useState(null);
content = re.sub(r'(const \[doc, setDoc\] = useState\(null\);\n)', r'\1' + injection, content, count=1)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected logic into ProjectProposalCreator")
