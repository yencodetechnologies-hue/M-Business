# -*- coding: utf-8 -*-
import json

with open(r'C:\Users\irina\.gemini\antigravity\brain\aeb49f28-0030-45f0-8663-acfc7b217958\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'USER_INPUT' and '<title>M Business' in data.get('content', '') and 'Invoices</title>' in data.get('content', ''):
                print("FOUND INVOICES")
                with open('invoices_template.txt', 'w', encoding='utf-8') as out:
                    out.write(data['content'])
            if data.get('type') == 'USER_INPUT' and '<title>M Business' in data.get('content', '') and 'Quotations</title>' in data.get('content', ''):
                print("FOUND QUOTATIONS")
                with open('quotations_template.txt', 'w', encoding='utf-8') as out:
                    out.write(data['content'])
        except:
            pass
