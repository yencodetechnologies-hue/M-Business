import os
import re

directory = 'C:\\M Business\\M Business\\src\\components'

for filename in os.listdir(directory):
    if filename.endswith(".jsx"):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Replace hex codes (case-insensitive)
        content = re.sub(r'(?i)#00BCD4', 'var(--teal)', content)
        content = re.sub(r'(?i)#00ACC1', 'var(--teal2)', content)
        content = re.sub(r'(?i)#E0F7FA', 'var(--teal-light)', content)
        content = re.sub(r'(?i)#F0FDFE', 'var(--teal-lighter)', content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {filename}")

