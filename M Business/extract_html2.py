import json

log_path = r"C:\Users\irina\.gemini\antigravity\brain\aeb49f28-0030-45f0-8663-acfc7b217958\.system_generated\logs\transcript.jsonl"
with open(log_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for line in reversed(lines[-50:]):
    data = json.loads(line)
    if data.get('source') == 'USER_EXPLICIT':
        content = data.get('content', '')
        if '<!DOCTYPE html>' in content:
            # We found the message. Save the exact content to a file.
            with open(r"C:\M Business\M Business\template_raw.html", "w", encoding="utf-8") as out_f:
                out_f.write(content)
            print(f"Extracted user message to template_raw.html (Length: {len(content)})")
            break
