import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8') as f:
    td = f.read()

ctrl_start = td.find('id="ctrl-prop"')
ctrl_end = td.find('id="ctrl-inv"')
ctrl = td[ctrl_start:ctrl_end]

# Find all acc-titles in ctrl-prop to understand what sections exist
acc_titles = re.findall(r'<div class="acc-title">([^<]+)</div>', ctrl)
print('Accordion sections in ctrl-prop:')
for t in acc_titles:
    print(' ', t)

# Also show all IDs with "prop" in ctrl-prop area
ids = [i for i in re.findall(r'id="([^"]+)"', ctrl) if 'prop' in i.lower() or 'Del' in i or 'Ms' in i or 'Team' in i or 'Pricing' in i or 'Value' in i]
print()
print('Proposal-related IDs in ctrl-prop:')
for i in ids:
    print(' ', i)
