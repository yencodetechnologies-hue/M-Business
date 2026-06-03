import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('c:/M Business/M Business/new_proposals_ui.html', 'r', encoding='utf-8') as f:
    html = f.read()

start = html.find('<div class="prop-doc" id="propDoc">')
print(html[start:start+1500])
