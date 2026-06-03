import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8') as f:
    td = f.read()

# Find ctrl-prop section
ctrl_start = td.find('id="ctrl-prop"')
ctrl_end = td.find('id="ctrl-inv"')
ctrl_section = td[ctrl_start:ctrl_end]

# Find all ids in this section
ids = re.findall(r'id="([^"]+)"', ctrl_section)
print('All IDs in ctrl-prop section:')
for id_ in ids:
    print(' ', id_)
