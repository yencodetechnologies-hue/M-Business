with open('C:\\M Business\\M Business\\temp_ui_subscriptions.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# find <style> block and everything inside <body>
import re
style_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
body_match = re.search(r'<body>(.*?)</body>', content, re.DOTALL)

if style_match:
    with open('C:\\M Business\\M Business\\temp_sub_style.css', 'w', encoding='utf-8') as f:
        f.write(style_match.group(1).strip())

if body_match:
    with open('C:\\M Business\\M Business\\temp_sub_body.html', 'w', encoding='utf-8') as f:
        f.write(body_match.group(1).strip())
print("Extracted style and body")
