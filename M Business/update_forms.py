import re

files = [
    ('C:\\M Business\\M Business\\src\\components\\InvoiceCreator.jsx', '#inv'),
    ('C:\\M Business\\M Business\\src\\components\\QuotationCreator.jsx', '#quo'),
    ('C:\\M Business\\M Business\\src\\components\\ProjectProposalCreator.jsx', '#prop')
]

for file_path, hash_val in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We need to replace the final return statement (the form)
    # The form usually starts after if (step === "preview") { ... } or if (step === "list") { ... }
    # Let's find the last eturn ( or eturn <div and replace everything from there to the end.
    # Actually, it's safer to just replace the whole return block at the end of the function.
    
    # Let's find the last eturn ( that is not inside an if statement, or we can just use regex.
    # Since it's a huge return, maybe we can replace the return part.
    
    match = re.search(r'(\n\s*return\s*\(\s*<div[^>]*className=["\']?(?:fade-in|print-wrapper|create-form)["\']?.*?\);?\s*\}\s*)$', content, flags=re.DOTALL)
    
    # If the above fails, just replace from the last eturn ( to the end of the file except the last }
    match2 = re.search(r'(\n\s*return\s*\(.*?\);?\s*\}\s*)$', content, flags=re.DOTALL)
    
    if match2:
        replacement = f'''
  return (
    <div style={{{{ width: "100%", height: "80vh", display: "flex", flexDirection: "column" }}}}>
      <div style={{{{ padding: "10px 0", display: "flex", gap: 10, alignItems: "center" }}}}>
        <button onClick={{() => setStep("list")}} style={{{{ padding: "8px 14px", background: "var(--app-bg)", border: "1.5px solid var(--app-border)", borderRadius: 8, cursor: "pointer", fontWeight: 700, color: "var(--app-muted)" }}}}>← Back to List</button>
      </div>
      <div style={{{{ flex: 1, overflow: "hidden", borderRadius: 16 }}}}>
        <iframe src="/template-designer.html{hash_val}" style={{{{ width: "100%", height: "100%", border: "none" }}}} />
      </div>
    </div>
  );
}}
'''
        content = content[:match2.start()] + replacement
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path.split('\\\\')[-1]}")
    else:
        print(f"Could not find return block in {file_path}")
