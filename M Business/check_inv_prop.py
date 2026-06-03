import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/M Business/M Business/new_invoice_ui.html', 'r', encoding='utf-8') as f:
    inv_html = f.read()

start_css = inv_html.find('/* INVOICE PREVIEW */')
end_css = inv_html.find('/* MOBILE */')
if start_css != -1 and end_css != -1:
    print('Invoice CSS lines:', len(inv_html[start_css:end_css].splitlines()))

start_html = inv_html.find('<div class="inv-preview" id="invPreview">')
if start_html != -1:
    print('Invoice HTML found')

# Read new_proposals_ui.html
with open('c:/M Business/M Business/new_proposals_ui.html', 'r', encoding='utf-8') as f:
    prop_html = f.read()

start_css = prop_html.find('/* PROPOSAL PREVIEW */')
end_css = prop_html.find('/* RICH TEXT EDITOR */')
if start_css != -1 and end_css != -1:
    print('Proposal CSS lines:', len(prop_html[start_css:end_css].splitlines()))

start_html = prop_html.find('<div class="prop-preview" id="propPreview">')
if start_html != -1:
    print('Proposal HTML found')
