import re
import os

def html_to_jsx(html_content):
    # Convert class to className
    jsx = html_content.replace('class="', 'className="')
    # Convert for to htmlFor
    jsx = jsx.replace('for="', 'htmlFor="')
    
    # Closeself-closing tags
    self_closing_tags = ['input', 'img', 'br', 'hr']
    for tag in self_closing_tags:
        jsx = re.sub(r'(<' + tag + r'[^>]*?[^/])>', r'\1 />', jsx)
        
    # Convert inline styles (rough approximation, will need manual fix for complex styles)
    def style_replacer(match):
        style_str = match.group(1)
        rules = style_str.split(';')
        jsx_rules = []
        for rule in rules:
            if ':' not in rule: continue
            k, v = rule.split(':', 1)
            k = k.strip()
            v = v.strip()
            # camelCase the key
            k = re.sub(r'-([a-z])', lambda m: m.group(1).upper(), k)
            jsx_rules.append(f'{k}: "{v}"')
        return 'style={{' + ', '.join(jsx_rules) + '}}'
        
    jsx = re.sub(r'style="([^"]*)"', style_replacer, jsx)
    
    # Fix onchange/onclick to onChange/onClick
    events = ['onclick', 'oninput', 'onchange', 'onkeydown', 'onload']
    for e in events:
        jsx = jsx.replace(f'{e}=', f'{e[:2]}C{e[3:]}=' if e == 'onclick' else f'{e[:2]}C{e[3:]}=' if e=='onchange' else f'{e[:2]}I{e[3:]}=' if e=='oninput' else f'{e[:2]}K{e[3:]}=' if e=='onkeydown' else f'{e[:2]}L{e[3:]}=')
        
    # Remove HTML comments
    jsx = re.sub(r'<!--(.*?)-->', '', jsx, flags=re.DOTALL)
    
    return jsx

if __name__ == "__main__":
    with open('c:\\M Business\\M Business\\new_quotation_ui.html', 'r', encoding='utf-8') as f:
        html = f.read()
        
    # Extract style block
    style_match = re.search(r'<style>(.*?)</style>', html, re.DOTALL)
    style_content = style_match.group(1) if style_match else ""
    
    # Extract body content
    body_match = re.search(r'<body>(.*?)</body>', html, re.DOTALL)
    body_content = body_match.group(1) if body_match else html
    
    jsx_content = html_to_jsx(body_content)
    
    with open('c:\\M Business\\M Business\\jsx_converted.txt', 'w', encoding='utf-8') as f:
        f.write("/* CSS STYLES */\n")
        f.write(style_content)
        f.write("\n\n/* JSX CONTENT */\n")
        f.write(jsx_content)
        
    print("Conversion complete!")
