# -*- coding: utf-8 -*-
import json
import re

log_file = r"C:\Users\irina\.gemini\antigravity\brain\aeb49f28-0030-45f0-8663-acfc7b217958\.system_generated\logs\transcript.jsonl"
with open(log_file, 'r', encoding='utf-8') as f:
    idx = 1
    for line in f:
        data = json.loads(line)
        if data.get('type') == 'USER_INPUT':
            content = data.get('content', '')
            if 'Invoices</title>' in content:
                with open(f'C:\\M Business\\M Business\\temp_invoices_html_{idx}.txt', 'w', encoding='utf-8') as out:
                    out.write(content)
                idx += 1
