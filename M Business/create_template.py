import re

with open('C:\\M Business\\M Business\\template.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the nav-sidebar HTML block
content = re.sub(r'<!-- NAV SIDEBAR -->.*?</nav>', '', content, flags=re.DOTALL)

# Write to public folder
with open('C:\\M Business\\M Business\\public\\template-designer.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Created public/template-designer.html without sidebar")
