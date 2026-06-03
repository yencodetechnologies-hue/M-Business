import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8') as f:
    td = f.read()

# The proposal preview uses pv-* IDs for the rendered preview, and
# propSub/propGrand live in the PRICING section of propDoc.
# The propJs calcTotal() updates elements like 'pv-grand', 'pv-sub' etc.
# Let's see what IDs the proposal pricing section uses.

with open('c:/M Business/M Business/new_proposals_ui.html', 'r', encoding='utf-8') as f:
    prop_html = f.read()

import re
prop_doc_start = prop_html.find('<div class="prop-doc" id="propDoc">')
prop_doc_end = prop_html.rfind('</div>', 0, prop_html.find('</div><!-- /preview-card -->')) + 6
prop_doc = prop_html[prop_doc_start:prop_doc_end]

# Find all IDs in propDoc
ids = re.findall(r'id="([^"]+)"', prop_doc)
print('IDs in propDoc preview:')
for i in ids:
    print(' ', i)
