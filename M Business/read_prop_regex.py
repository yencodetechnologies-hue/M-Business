import sys
import re
sys.stdout.reconfigure(encoding='utf-8')
with open('c:/M Business/M Business/new_proposals_ui.html', 'r', encoding='utf-8') as f:
    html = f.read()

m = re.search(r'<div[^>]*id="propPreview"[^>]*>', html)
if m:
    start = m.start()
    print(html[start:start+1000])
else:
    print('Not found')
