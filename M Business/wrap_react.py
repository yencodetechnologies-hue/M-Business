import re

def main():
    with open('c:\\M Business\\M Business\\jsx_converted.txt', 'r', encoding='utf-8') as f:
        content = f.read()
        
    style_match = re.search(r'/\* CSS STYLES \*/\n(.*?)\n/\* JSX CONTENT \*/', content, re.DOTALL)
    css = style_match.group(1).strip() if style_match else ""
    
    jsx_match = re.search(r'/\* JSX CONTENT \*/\n(.*)', content, re.DOTALL)
    jsx = jsx_match.group(1).strip() if jsx_match else ""
    
    # Strip sidebar completely from the JSX since it's already in the layout
    jsx = re.sub(r'<aside className="sidebar">.*?</aside>', '', jsx, flags=re.DOTALL)
    
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

    react_code = f"""import React, {{ useState }} from 'react';

export default function QuotationCreator() {{
  return (
    <div style={{{{ flex: 1, height: "100%", overflowY: "auto" }}}}>
      <style>{{`
        {css.replace('`', '\\`')}
        .main {{ margin-left: 0 !important; }}
      `}}</style>
      
      {{/* Injecting the raw UI layout provided by user */}}
      {jsx}
      
    </div>
  );
}}
"""
    
    with open('c:\\M Business\\M Business\\src\\components\\QuotationCreator.jsx', 'w', encoding='utf-8') as f:
        f.write(react_code)
        
if __name__ == "__main__":
    main()
