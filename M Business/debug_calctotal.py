import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8') as f:
    td = f.read()

# The propDoc uses pv-* IDs, not propSub/propGrand/td-teamList etc.
# The proposal JS calcTotal() was renamed to propCalcTotal() — 
# but it still references old IDs: 'subtotal', 'taxAmt', 'grandTotal' etc.
# which we mapped to propSub, propTax, propGrand.
# But in propDoc HTML the actual IDs are pv-grand, pv-pricing, pv-team etc.

# Fix: update the proposal JS to reference pv-* IDs instead of propSub etc.
prop_fixes = [
    ("document.getElementById('propSub')", "document.getElementById('pv-pricing')"),
    ("document.getElementById('propTax')", "document.getElementById('pv-grand')"),     # temp
    ("document.getElementById('propDisc')", "document.getElementById('pv-grand')"),    # temp
    ("document.getElementById('propDiscRow')", "document.getElementById('pv-pricing')"),
    ("document.getElementById('propGrand')", "document.getElementById('pv-grand')"),
    # team/value/risk list - these are sidebar lists, not preview
    # they update the pv-team/pv-value/pv-risks in propDoc
    ("document.getElementById('td-teamList')", "document.getElementById('td-teamList')"),
    ("document.getElementById('td-valueList')", "document.getElementById('td-valueList')"),
    ("document.getElementById('td-riskList')", "document.getElementById('td-riskList')"),
]

# Actually, better approach: the calcTotal() in proposal JS updates multiple elements.
# Let's just look at what calcTotal() does in the file and fix it properly.
prop_js_start = td.find('// PROPOSAL JS (from new_proposals_ui.html)')
prop_js_end   = td.find('\n</script>', prop_js_start)
prop_js = td[prop_js_start:prop_js_end]

# Find calcTotal function
calc_start = prop_js.find('function calcTotal()')
calc_end   = prop_js.find('\n}', calc_start) + 2
calc_fn = prop_js[calc_start:calc_end]
print('calcTotal fn:')
print(calc_fn[:1500])
