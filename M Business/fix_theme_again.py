import os

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
    
    # Replace '--app-primary' with '--app-accent'
    content = content.replace(".getPropertyValue('--app-primary')", ".getPropertyValue('--app-accent')")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

# Now fix TaskPage.jsx blue colors
task_file = r'C:\M Business\M Business\src\components\TaskPage.jsx'
if os.path.exists(task_file):
    with open(task_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace var(--app-primary) with var(--app-accent)
    content = content.replace('var(--app-primary)', 'var(--app-accent)')
    
    with open(task_file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updates applied")
