import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8') as f:
    html = f.read()

checks = [
    ('Invoice CSS', '/* INVOICE PREVIEW DOC */'),
    ('Proposal CSS', '/* PROPOSAL DOC */'),
    ('invCalcTotals fn', 'function invCalcTotals()'),
    ('invUpdatePreview fn', 'function invUpdatePreview()'),
    ('propUp fn', 'function propUp()'),
    ('invAddRow fn', 'function invAddRow()'),
    ('invItemRows in preview', 'invItemRows'),
    ('prop-doc in preview', 'prop-doc'),
    ('td-inv-itemsBody', 'td-inv-itemsBody'),
    ('_tdv helper', 'window._tdv'),
    ('invoice-preview class', 'invoice-preview'),
    ('updateMilestonesPreview fn', 'updateMilestonesPreview'),
]
for name, val in checks:
    print(f'{name}: {"OK" if val in html else "MISSING"}')

print(f'Total lines: {len(html.splitlines())}')
print(f'Total size KB: {len(html)//1024}')
