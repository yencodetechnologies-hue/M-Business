import re

def main():
    with open('c:\\M Business\\M Business\\jsx_converted.txt', 'r', encoding='utf-8') as f:
        content = f.read()
        
    style_match = re.search(r'/\* CSS STYLES \*/\n(.*?)\n/\* JSX CONTENT \*/', content, re.DOTALL)
    css = style_match.group(1).strip() if style_match else ""
    
    jsx_match = re.search(r'/\* JSX CONTENT \*/\n(.*)', content, re.DOTALL)
    jsx = jsx_match.group(1).strip() if jsx_match else ""
    
    # The JSX currently has vanilla JS onClick events like onClick="addPhaseBlock()"
    # We must strip these out or replace them with empty functions so React doesn't crash
    events = ['onClick', 'onInput', 'onChange', 'onKeydown', 'onLoad']
    for e in events:
        jsx = re.sub(f'{e}="[^"]*"', f'{e}={{() => {{}}}}', jsx)
        
    # We must ensure all input fields have onChange if they have value
    jsx = re.sub(r'value="([^"]*)"', r'defaultValue="\1"', jsx)
    
    # Handle readonly which needs to be readOnly in React
    jsx = jsx.replace('readonly', 'readOnly')

    # Fix class to className if any escaped
    jsx = jsx.replace('class="', 'className="')
    
    # Fix inline styles with string instead of object
    # The previous script already handled style="...", but just in case
    
    # Let's wrap the JSX in a React component
    react_code = f"""import React from 'react';

export default function QuotationCreatorModern() {{
  return (
    <div style={{{{ flex: 1, height: "100%", overflowY: "auto", fontFamily: "var(--font)", background: "var(--bg)", color: "var(--text)" }}}}>
      <style>{{`
        {css.replace('`', '\\`')}
        .main {{ margin-left: 0 !important; }}
        .sidebar {{ display: none !important; }}
      `}}</style>
      
      {{/* Injecting the raw UI layout provided by user */}}
      {jsx}
      
    </div>
  );
}}
"""
    
    with open('c:\\M Business\\M Business\\src\\components\\QuotationCreatorModern.jsx', 'w', encoding='utf-8') as f:
        f.write(react_code)
        
if __name__ == "__main__":
    main()
