import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8') as f:
    td = f.read()

# Check what proposal inputs are missing from ctrl-prop sidebar
needed_ids = [
    'f-prop-problem', 'f-prop-solution', 'f-prop-outcome',
    'f-prop-start', 'f-prop-end', 'f-prop-duration',
    'f-prop-engagement', 'f-prop-paysched', 'f-prop-closing',
    'f-prop-terms', 'f-prop-cperson', 'f-prop-cemail',
    'f-prop-cphone', 'f-prop-caddr',
    'propSub', 'propTax', 'propDisc', 'propDiscRow', 'propGrand',
    'td-delList', 'td-msList', 'td-teamList', 'td-valueList',
    'td-riskList', 'td-csList', 'td-tmList',
]

print('--- Missing from template-designer ---')
for id_ in needed_ids:
    if id_ not in td:
        print(f'  MISSING: {id_}')
    else:
        print(f'  OK: {id_}')
