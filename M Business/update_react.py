import re
import os

files_to_patch = [
    (r'C:\M Business\M Business\src\components\InvoiceCreator.jsx', 'inv', 'setInvoices', 'Invoice'),
    (r'C:\M Business\M Business\src\components\QuotationCreator.jsx', 'quo', 'setQuotations', 'Quotation'),
    (r'C:\M Business\M Business\src\components\ProjectProposalCreator.jsx', 'prop', 'setProposals', 'Proposal')
]

for file_path, doc_type, setter, name in files_to_patch:
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Add useRef if not present
    if 'useRef' not in content:
        content = content.replace('useState,', 'useState, useRef,')
        if 'useRef' not in content:
             content = content.replace('useState }', 'useState, useRef }')
             
    # Add useEffect if not present
    if 'useEffect' not in content:
        content = content.replace('useState,', 'useState, useEffect,')
        if 'useEffect' not in content:
             content = content.replace('useState, useRef', 'useState, useRef, useEffect')
    
    # Inject refs and effects
    hook_injection = f"""
  const iframeRef = useRef(null);

  useEffect(() => {{
    const handleMsg = (e) => {{
      if (e.data?.type === 'SAVE_DOCUMENT' && e.data?.payload?.docType === '{doc_type}') {{
        const payload = e.data.payload;
        const newDoc = {{
          id: Date.now(),
          invoiceNo: payload.invoiceNo || `{doc_type.upper()}-${{Date.now()}}`,
          quotationNo: payload.invoiceNo || `{doc_type.upper()}-${{Date.now()}}`,
          proposalNo: payload.invoiceNo || `{doc_type.upper()}-${{Date.now()}}`,
          client: payload.client || 'Unknown Client',
          date: payload.date || new Date().toISOString().split('T')[0],
          dueDate: payload.dueDate || new Date().toISOString().split('T')[0],
          status: 'draft',
          amount: payload.amount || 0,
          total: payload.amount || 0,
          currency: 'INR',
          htmlContent: payload.htmlContent,
          type: '{name.lower()}',
          title: payload.client + ' - {name}'
        }};
        {setter}(prev => [newDoc, ...prev]);
        setStep("list");
        if(typeof showToast === 'function') showToast("{name} saved successfully!");
      }}
    }};
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }}, []);

  const sendThemeToIframe = () => {{
    if (iframeRef.current && iframeRef.current.contentWindow) {{
      const color = getComputedStyle(document.documentElement).getPropertyValue('--teal').trim() || '#00BCD4';
      iframeRef.current.contentWindow.postMessage({{ type: 'SET_THEME', color }}, '*');
    }}
  }};
"""
    # Insert right after `const blank = { ... };` or `const showToast = ...;`
    if 'const showToast = ' in content:
        content = re.sub(r'(const showToast = [^\n]+\n)', r'\1' + hook_injection, content, count=1)
    else:
        # Fallback for ProjectProposalCreator
        content = re.sub(r'(const \[step, setStep\] = useState\([^)]+\);\n)', r'\1' + hook_injection, content, count=1)
        
    # Replace iframe with ref and onLoad
    content = re.sub(
        r'<iframe src="/template-designer\.html[^"]*"\s*style={{.*?}}\s*title="Template Designer"\s*/>',
        r'<iframe src="/template-designer.html#' + doc_type + r'" ref={iframeRef} onLoad={sendThemeToIframe} style={{ width: "100%", height: "100%", border: "none" }} title="Template Designer" />',
        content
    )
    # Also handle standard format if properties were reordered
    content = re.sub(
        r'<iframe src="/template-designer\.html[^>]*></iframe>',
        r'<iframe src="/template-designer.html#' + doc_type + r'" ref={iframeRef} onLoad={sendThemeToIframe} style={{ width: "100%", height: "100%", border: "none" }} title="Template Designer"></iframe>',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updated React components")
