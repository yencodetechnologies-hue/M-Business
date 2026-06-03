import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8') as f:
    td = f.read()

# Correct IDs (after all renaming)
checks = [
    # Invoice
    ('Invoice CSS',         '/* INVOICE PREVIEW DOC */'),
    ('invCalcTotals fn',    'function invCalcTotals()'),
    ('invUpdatePreview fn', 'function invUpdatePreview()'),
    ('invAddRow fn',        'function invAddRow()'),
    ('invItemRows',         'id="invItemRows"'),
    ('invoice-preview',     'class="invoice-preview"'),
    ('td-inv-itemsBody',    'id="td-inv-itemsBody"'),
    ('f-inv-num',           'id="f-inv-num"'),
    ('f-inv-client',        'id="f-inv-client"'),
    ('f-inv-disc',          'id="f-inv-disc"'),
    # Proposal
    ('Proposal CSS',        '/* PROPOSAL DOC */'),
    ('propUp fn',           'function propUp()'),
    ('updateMilestonesPreview fn', 'function updateMilestonesPreview()'),
    ('prop-doc class',      'class="prop-doc"'),
    ('f-prop-title',        'id="f-prop-title"'),
    ('f-prop-prob',         'id="f-prop-prob"'),
    ('f-prop-sol',          'id="f-prop-sol"'),
    ('f-prop-start',        'id="f-prop-start"'),
    ('f-prop-end',          'id="f-prop-end"'),
    ('f-prop-duration',     'id="f-prop-duration"'),
    ('f-prop-engagement',   'id="f-prop-engagement"'),
    ('f-prop-closing',      'id="f-prop-closing"'),
    ('f-prop-terms',        'id="f-prop-terms"'),
    ('f-prop-cperson',      'id="f-prop-cperson"'),
    ('f-prop-cemail',       'id="f-prop-cemail"'),
    ('propDels',            'id="propDels"'),
    ('propMs',              'id="propMs"'),
    ('propPricing',         'id="propPricing"'),
    ('propSub',             'id="propSub"'),
    ('propGrand',           'id="propGrand"'),
    ('td-teamList',         'id="td-teamList"'),
    ('td-valueList',        'id="td-valueList"'),
    ('td-riskList',         'id="td-riskList"'),
    # Helpers
    ('_tdv helper',         'window._tdv'),
    ('fmtINR fn',           'function fmtINR'),
    ('invFmt fn',           'function invFmt'),
]

all_ok = True
for name, needle in checks:
    ok = needle in td
    if not ok:
        all_ok = False
    print(f'  {"OK" if ok else "MISSING"}: {name}')

print()
print(f'Total lines: {len(td.splitlines())}')
print(f'Total size KB: {len(td)//1024}')
print()
print('ALL OK!' if all_ok else 'Some items MISSING — needs fixing')
