import json

log_path = r'C:\Users\irina\.gemini\antigravity\brain\aeb49f28-0030-45f0-8663-acfc7b217958\.system_generated\logs\transcript.jsonl'
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'USER_INPUT' and 'M Business' in data.get('content', '') and 'Subscriptions' in data.get('content', ''):
                content = data['content']
                if '<!DOCTYPE html>' in content:
                    if '<USER_REQUEST>' in content:
                        content = content.split('<USER_REQUEST>')[1].split('</USER_REQUEST>')[0]
                    with open(r'C:\M Business\M Business\temp_ui_subscriptions.txt', 'w', encoding='utf-8') as out_f:
                        out_f.write(content.strip())
                    print("Extracted Subscriptions HTML")
        except:
            pass
