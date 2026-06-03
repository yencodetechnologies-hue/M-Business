import sys
sys.stdout.reconfigure(encoding='utf-8')
html = open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8').read()
start = html.find('id="ctrl-prop"')
print(html[start:start+1500])
