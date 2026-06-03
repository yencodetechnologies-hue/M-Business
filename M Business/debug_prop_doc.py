import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8') as f:
    td = f.read()

# propSub/propGrand are in the propDoc HTML inside the preview area.
# td-teamList, td-valueList, td-riskList are also inside propDoc.
# These are only in DOM when Proposal tab is active (renderProp() injects propDoc).
# Let's check if they're in the injected propDoc template string

prop_block_start = td.find('function renderProp()')
prop_block_end = td.find('function renderInv()')
prop_block = td[prop_block_start:prop_block_end]

print('propSub in propDoc template:', 'propSub' in prop_block)
print('propGrand in propDoc template:', 'propGrand' in prop_block)
print('td-teamList in propDoc template:', 'td-teamList' in prop_block)
print('td-valueList in propDoc template:', 'td-valueList' in prop_block)
print('td-riskList in propDoc template:', 'td-riskList' in prop_block)
print()

# Check the new_proposals_ui propDoc for these IDs
with open('c:/M Business/M Business/new_proposals_ui.html', 'r', encoding='utf-8') as f:
    prop_html = f.read()

prop_doc_start = prop_html.find('<div class="prop-doc" id="propDoc">')
prop_doc_end = prop_html.find('</div><!-- /preview-card -->')
prop_doc = prop_html[prop_doc_start:prop_doc_end]

print('In new_proposals_ui propDoc:')
print('propSub:', 'propSub' in prop_doc)
print('propGrand:', 'propGrand' in prop_doc)
print('td-teamList:', 'td-teamList' in prop_doc)
print('teamList:', 'teamList' in prop_doc)
print('pv-team:', 'pv-team' in prop_doc)
print('pv-sec-team:', 'pv-sec-team' in prop_doc)
