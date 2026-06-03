import sys
sys.stdout.reconfigure(encoding='utf-8')
html = open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8').read()
if 'id="ctrl-prop"' in html:
    print('ctrl-prop exists')
else:
    print('ctrl-prop DOES NOT exist')

if 'id="ctrl-inv"' in html:
    print('ctrl-inv exists')
else:
    print('ctrl-inv DOES NOT exist')
