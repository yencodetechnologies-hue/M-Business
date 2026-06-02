import os
import re

files_to_patch = [
    r'C:\M Business\M Business\src\components\InvoiceCreator.jsx',
    r'C:\M Business\M Business\src\components\QuotationCreator.jsx',
    r'C:\M Business\M Business\src\components\ProjectProposalCreator.jsx'
]

for file_path in files_to_patch:
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace '--teal' with '--app-primary'
    content = content.replace(".getPropertyValue('--teal')", ".getPropertyValue('--app-primary')")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

# Now fix TaskPage.jsx blue colors
task_file = r'C:\M Business\M Business\src\components\TaskPage.jsx'
if os.path.exists(task_file):
    with open(task_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the hardcoded blue color with var(--app-primary)
    content = content.replace('\"#0073ea\"', '\"var(--app-primary)\"')
    content = content.replace('\'#0073ea\'', '\'var(--app-primary)\'')
    
    with open(task_file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updates applied")
