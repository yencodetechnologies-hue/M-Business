import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/M Business/M Business/new_invoice_ui.html', 'r', encoding='utf-8') as f:
    inv_html = f.read()

start_css = inv_html.find('/* INVOICE PREVIEW DOC */')
end_css = inv_html.find('/* MOBILE */')
inv_css = inv_html[start_css:end_css]

start_html = inv_html.find('<div class="invoice-preview" id="invoicePreview">')
div_count = 0
end_html = -1
for i in range(start_html, len(inv_html)):
    if inv_html[i:i+4] == '<div':
        div_count += 1
    elif inv_html[i:i+6] == '</div>':
        div_count -= 1
        if div_count == 0:
            end_html = i + 6
            break
            
inv_preview_inner = inv_html[start_html + len('<div class="invoice-preview" id="invoicePreview">\n'):end_html - 6]

with open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8') as f:
    td_html = f.read()

end_td_css = td_html.find('/* PROPOSAL PREVIEW */')
if end_td_css != -1 and '/* INVOICE PREVIEW DOC */' not in td_html:
    td_html = td_html[:end_td_css] + inv_css + '\n' + td_html[end_td_css:]

new_inner = inv_preview_inner
# Header / From
new_inner = new_inner.replace('<div class="inv-logo-box">YT</div>', '${logo}')
new_inner = new_inner.replace('YENCODE Technologies', '${co}')
new_inner = new_inner.replace('GST: 33ABCDE1234F1Z5', 'GST: ${v("f-gst")||""}')
new_inner = new_inner.replace('', '${v("f-email")||""}')
new_inner = new_inner.replace('+91 89254 33533', '${v("f-phone")||""}')
new_inner = new_inner.replace('Chennai, Tamil Nadu, India – 600001', '${v("f-addr")||""}')

# Invoice details
new_inner = new_inner.replace('#INV-2026-0042', '#${invNum}')
new_inner = new_inner.replace('01 Jun 2026', '${invDate}')
new_inner = new_inner.replace('15 Jun 2026', '${dueDate}')
new_inner = new_inner.replace('Web Development', '${cat}')
new_inner = new_inner.replace('<div class="inv-badge draft" id="pInvStatus">UNPAID</div>', '<div class="inv-badge draft" id="pInvStatus" style="background:${statusMap[status].bg};color:${statusMap[status].color};border-color:${statusMap[status].border}">${statusMap[status].text}</div>')

# To
new_inner = new_inner.replace('— Client Name —', '${client}')
new_inner = new_inner.replace('<span style="color:var(--text3)">Fill in client details</span>', '${caddr}')
new_inner = new_inner.replace('Client GST number', '${cgst}')

# Items table
items_tbody_start = new_inner.find('<tbody id="previewItems">')
items_tbody_end = new_inner.find('</tbody>', items_tbody_start) + 8
new_inner = new_inner[:items_tbody_start] + '<tbody id="invItemRows"></tbody>' + new_inner[items_tbody_end:]

# Totals
new_inner = new_inner.replace('id="pSubtotal"', 'id="invSub"')
new_inner = new_inner.replace('id="pTax"', 'id="invTax"')
new_inner = new_inner.replace('id="pDiscRow"', 'id="invDiscRow"')
new_inner = new_inner.replace('id="pDisc"', 'id="invDisc"')
new_inner = new_inner.replace('id="pGrand"', 'id="invGrand"')

# Footer
new_inner = new_inner.replace('Thank you for your business! Please make payment within the due date.', '${notes}')
new_inner = new_inner.replace('<div class="inv-sig-name" id="pSigName">Prabhu R</div>', '<div class="inv-sig-name" id="pSigName">${v("f-sig")||co}</div>')
new_inner = new_inner.replace('<div class="inv-sig-role" id="pSigRole">Founder</div>', '<div class="inv-sig-role" id="pSigRole">${v("f-sig-role")||""}</div>')

# Payment terms & details
new_inner = new_inner.replace('Account Name: YENCODE Tech', 'Account Name: ${co}')
new_inner = new_inner.replace('Account No: 1234567890', 'Account No: ${acct}')
new_inner = new_inner.replace('IFSC: HDFC0001234', 'IFSC: ${ifsc}')
new_inner = new_inner.replace('Bank: HDFC Bank', 'Bank: ${bank}')
new_inner = new_inner.replace('UPI: yencode@okaxis', 'UPI: ${upi}')
new_inner = new_inner.replace('Please pay within 15 days of invoice date.', '${terms}')

js_replacement = """
  document.getElementById('docHeaderZone').innerHTML = '';
  document.getElementById('docFooterZone').innerHTML = '';

  document.getElementById('docBodyZone').innerHTML = `""" + new_inner + """`;
"""

start_fn = td_html.find('function renderInv()')
start_replace = td_html.find("document.getElementById('docHeaderZone').innerHTML", start_fn)
end_replace = td_html.find("setTimeout(() => calcInv(), 10);", start_replace)

if start_replace != -1 and end_replace != -1:
    td_html = td_html[:start_replace] + js_replacement + '\n  ' + td_html[end_replace:]
    with open('c:/M Business/M Business/public/template-designer.html', 'w', encoding='utf-8') as f:
        f.write(td_html)
    print('Patched renderInv')
else:
    print('Could not find bounds to patch')
