import sys
import re
sys.stdout.reconfigure(encoding='utf-8')
html = open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8').read()
start = html.find('id="ctrl-inv"')
end = html.find('id="mainPaper"', start)
inputs = re.findall(r'id="f-inv-([^"]+)"', html[start:end])
print('Invoice input fields:', inputs)
