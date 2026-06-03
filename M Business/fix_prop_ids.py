import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8') as f:
    td = f.read()

# Fix propUp references - the new_proposals_ui uses direct DOM ids like 'toComp', 'fromComp'
# which don't exist in template-designer. We already replaced most via _tdv() in patch_all.py
# but some remained. Let's fix remaining ones inside propUp and related functions.

replacements = [
    # toPerson, toEmail, toPhone, toAddr - still raw getElementById calls
    ("document.getElementById('toPerson').value", "window._tdv('f-prop-cperson')"),
    ("document.getElementById('toEmail').value", "window._tdv('f-prop-cemail')"),
    ("document.getElementById('toPhone').value", "window._tdv('f-prop-cphone')"),
    ("document.getElementById('toAddr').value", "window._tdv('f-prop-caddr')"),
    # problem, solution, outcome - may not exist in template-designer but let's try
    ("document.getElementById('problem').value", "window._tdv('f-prop-problem')"),
    ("document.getElementById('solution').value", "window._tdv('f-prop-solution')"),
    ("document.getElementById('outcome').value", "window._tdv('f-prop-outcome')"),
    # startDate, endDate, duration
    ("document.getElementById('startDate').value", "window._tdv('f-prop-start')"),
    ("document.getElementById('endDate').value", "window._tdv('f-prop-end')"),
    ("document.getElementById('duration').value", "window._tdv('f-prop-duration')"),
    ("document.getElementById('engModel').value", "window._tdv('f-prop-engagement')"),
    # paySchedule, closing, terms
    ("document.getElementById('paySchedule').value", "window._tdv('f-prop-paysched')"),
    ("document.getElementById('closing').value", "window._tdv('f-prop-closing')"),
    ("document.getElementById('terms').value", "window._tdv('f-prop-terms')"),
    # delList, msList, teamList etc. - these are list containers, map to safe fallbacks
    ("document.getElementById('delList')", "document.getElementById('td-delList')"),
    ("document.getElementById('msList')", "document.getElementById('td-msList')"),
    ("document.getElementById('teamList')", "document.getElementById('td-teamList')"),
    ("document.getElementById('valueList')", "document.getElementById('td-valueList')"),
    ("document.getElementById('riskList')", "document.getElementById('td-riskList')"),
    ("document.getElementById('csList')", "document.getElementById('td-csList')"),
    ("document.getElementById('tmList')", "document.getElementById('td-tmList')"),
    ("document.getElementById('whyList')", "document.getElementById('td-whyList')"),
    ("document.getElementById('faqList')", "document.getElementById('td-faqList')"),
    ("document.getElementById('pricingList')", "document.getElementById('td-pricingList')"),
    # subtotal, grandTotal for proposal
    ("document.getElementById('subtotal')", "document.getElementById('propSub')"),
    ("document.getElementById('taxAmt')", "document.getElementById('propTax')"),
    ("document.getElementById('discAmt')", "document.getElementById('propDisc')"),
    ("document.getElementById('discRow')", "document.getElementById('propDiscRow')"),
    ("document.getElementById('grandTotal')", "document.getElementById('propGrand')"),
    # Note: 'fmt' in proposal JS was already named different - should use invFmt or fmtAmt
    # Let's check and rename proposal fmt references to use a global fmtINR
]

for old, new in replacements:
    if old in td:
        td = td.replace(old, new)
        print(f'Fixed: {old[:50]}')

# Add a global fmt function alias so proposal JS can call fmt()
global_fmt = """
// Global format helper used by proposal JS
function fmtINR(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
"""

# Inside proposal JS block, rename fmt() calls to fmtINR() 
# Find the proposal JS block boundaries
prop_js_start = td.find('// PROPOSAL JS (from new_proposals_ui.html)')
prop_js_end   = td.find('\n</script>', prop_js_start)
if prop_js_start != -1 and prop_js_end != -1:
    prop_block = td[prop_js_start:prop_js_end]
    # Replace fmt( with fmtINR( in proposal block only
    prop_block = re.sub(r'\bfmt\(', 'fmtINR(', prop_block)
    td = td[:prop_js_start] + prop_block + td[prop_js_end:]
    print('Renamed fmt() to fmtINR() in proposal JS block')

# Insert global fmtINR helper before INVOICE JS block
inv_js_block_start = td.find('// INVOICE JS (from new_invoice_ui.html)')
if inv_js_block_start != -1:
    td = td[:inv_js_block_start] + global_fmt + '\n' + td[inv_js_block_start:]
    print('Added fmtINR global helper')

# Also fix - invFmt was renamed from fmt, but invCalcTotals internally still calls invFmt correctly
# Make sure invFmt is defined - already done in patch_all.py

with open('c:/M Business/M Business/public/template-designer.html', 'w', encoding='utf-8') as f:
    f.write(td)

print('Done: fixed propUp() ID references')
