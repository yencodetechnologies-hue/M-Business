import re

files = [
    ('C:\\M Business\\M Business\\src\\components\\InvoiceCreator.jsx', '#inv'),
    ('C:\\M Business\\M Business\\src\\components\\QuotationCreator.jsx', '#quo'),
    ('C:\\M Business\\M Business\\src\\components\\ProjectProposalCreator.jsx', '#prop')
]

for file_path, hash_val in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the stats-row card click
    content = re.sub(
        r'onClick=\{\(\) => \{\s*clearForm\(\);\s*setStep\("form"\);\s*\}\}',
        r'onClick={() => { clearForm(); setStep("template"); }}',
        content
    )
    
    # Also find any other "Create New" buttons
    content = re.sub(
        r'<button[^>]*onClick=\{\(\) => \{\s*clearForm\(\);\s*setStep\("form"\);\s*\}\}.*?Create.*?</button>',
        r'<button className="create-btn" onClick={() => { clearForm(); setStep("template"); }}><i className="ti ti-plus"></i> Create New</button>',
        content
    )

    # Insert the template iframe return before the main form return
    # Find the last eturn ( that represents the form. Usually after const hasErrors or at the end.
    # Instead of regex, we can just look for const hasErrors = Object.keys(errors).length > 0;
    # and insert our if block right before it.
    
    iframe_code = f'''
  if (step === "template") {{
    return (
      <div style={{{{ width: "100%", height: "80vh", display: "flex", flexDirection: "column" }}}}>
        <div style={{{{ padding: "10px 0", display: "flex", gap: 10, alignItems: "center" }}}}>
          <button onClick={{() => setStep("list")}} style={{{{ padding: "8px 14px", background: "var(--app-bg)", border: "1.5px solid var(--app-border)", borderRadius: 8, cursor: "pointer", fontWeight: 700, color: "var(--app-muted)" }}}}>← Back to List</button>
        </div>
        <div style={{{{ flex: 1, overflow: "hidden", borderRadius: 16 }}}}>
          <iframe src="/template-designer.html{hash_val}" style={{{{ width: "100%", height: "100%", border: "none" }}}} title="Template Designer" />
        </div>
      </div>
    );
  }}
'''
    
    if 'if (step === "template")' not in content:
        # Try to insert before const hasErrors
        if 'const hasErrors =' in content:
            content = content.replace('const hasErrors =', iframe_code + '\n  const hasErrors =')
        else:
            # Insert before the last eturn (
            match2 = re.search(r'(\n\s*return\s*\(.*?\);?\s*\}\s*)$', content, flags=re.DOTALL)
            if match2:
                content = content[:match2.start()] + iframe_code + match2.group(1)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Patched {file_path}")
