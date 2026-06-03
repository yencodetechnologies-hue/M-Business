import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8') as f:
    td = f.read()

# Find ctrl-prop section and list all text around team/value/risk sections
ctrl_start = td.find('id="ctrl-prop"')
ctrl_end = td.find('id="ctrl-inv"')
ctrl = td[ctrl_start:ctrl_end]

# Search for keywords
for kw in ['team', 'Team', 'value', 'Value', 'risk', 'Risk', 'dyn-items', 'dyn-item']:
    positions = [m.start() for m in re.finditer(kw, ctrl)]
    if positions:
        print(f'"{kw}" found at positions: {positions[:5]}')
        # Print context of first occurrence
        p = positions[0]
        print(f'  Context: ...{ctrl[max(0,p-30):p+60]}...')
    else:
        print(f'"{kw}" NOT FOUND')
print()
# Total size of ctrl-prop
print(f'ctrl-prop section size: {len(ctrl)} chars')
