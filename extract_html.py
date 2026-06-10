import json
import os

log_path = r"C:\Users\irina\.gemini\antigravity\brain\b8b03f5e-6c63-4c93-8dec-888f975ffa47\.system_generated\logs\transcript.jsonl"
out_path = r"c:\M Business\M Business\extracted_template.html"

print("Searching log file...")
if not os.path.exists(log_path):
    print("Log file not found at:", log_path)
    exit(1)

longest_html = ""
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            step = json.loads(line)
            content = step.get("content", "")
            if "<!DOCTYPE html>" in content:
                # Find the HTML block inside content
                start_idx = content.find("<!DOCTYPE html>")
                end_idx = content.rfind("</html>")
                if start_idx != -1 and end_idx != -1:
                    html_content = content[start_idx:end_idx + 7]
                    if len(html_content) > len(longest_html):
                        longest_html = html_content
        except Exception as e:
            pass

if longest_html:
    print(f"Found HTML template of length {len(longest_html)}. Writing to {out_path}...")
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(longest_html)
    print("Successfully extracted HTML template!")
else:
    print("No HTML template found in log file.")
