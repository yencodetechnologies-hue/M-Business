import re
with open('C:\\M Business\\M Business\\src\\components\\MySubscriptions.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("</div>\n        </>\n      )}", "</>\n      )}")
with open('C:\\M Business\\M Business\\src\\components\\MySubscriptions.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Reverted extra div")
