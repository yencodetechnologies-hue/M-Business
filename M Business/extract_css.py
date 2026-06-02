import re

def append_css(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    style_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
    if style_match:
        css = style_match.group(1).strip()
        with open('C:\\M Business\\M Business\\src\\index.css', 'a', encoding='utf-8') as css_file:
            css_file.write(f"\n/* Appended from {file_path} */\n")
            css_file.write(css)
            css_file.write("\n")
        print(f"Appended CSS from {file_path}")
    else:
        print(f"No style block in {file_path}")

append_css('invoices_template.txt')
append_css('quotations_template.txt')
