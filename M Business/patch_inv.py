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

# Instead of blindly replacing a block, I'll insert CSS right before /* PROPOSAL PREVIEW */
# Let's remove the old invoice CSS from template-designer if it exists? Wait, there is no invoice CSS in template-designer yet!
# Actually, the user says they "added code" in new_invoice_ui.html, meaning the CSS is new.
# In template-designer, there's just `/* QUOTATION PREVIEW BODY */` and `/* PROPOSAL PREVIEW */`.
# Let's just insert inv_css before /* PROPOSAL PREVIEW */.
end_td_css = td_html.find('/* PROPOSAL PREVIEW */')
if end_td_css != -1:
    td_html = td_html[:end_td_css] + inv_css + '\n' + td_html[end_td_css:]
else:
    print('Warning: could not find /* PROPOSAL PREVIEW */ in template-designer to inject invoice css')

new_inner = inv_preview_inner
# Header / From
new_inner = new_inner.replace('<div class="inv-logo-box">YT</div>', '${logo}')
new_inner = new_inner.replace('Your Company', '${co}')
new_inner = new_inner.replace('GST: 33ABCDE1234F1Z5', 'GST: ${v("f-gst")||""}')
new_inner = new_inner.replace('<br>', '${v("f-email")||""}<br>')
new_inner = new_inner.replace('', '${v("f-phone")||""}')
new_inner = new_inner.replace('Chennai, Tamil Nadu, India – 600001', '${v("f-addr")||""}')

# Invoice details
new_inner = new_inner.replace('#INV-2026-0042', '#${v("f-inv-num")}')
new_inner = new_inner.replace('01 Jun 2026', '${fmtDate(v("f-inv-date"))}')
new_inner = new_inner.replace('15 Jun 2026', '${fmtDate(v("f-inv-due"))}')
new_inner = new_inner.replace('Web Development', '${v("f-inv-cat")}')
new_inner = new_inner.replace('<div class="inv-badge draft" id="pInvStatus">UNPAID</div>', '<div class="inv-badge draft" id="pInvStatus">${v("f-inv-status")||"UNPAID"}</div>')

# To
new_inner = new_inner.replace('— Client Name —', '${v("f-inv-client")||""}')
new_inner = new_inner.replace('<span style="color:var(--text3)">Fill in client details</span>', '${v("f-inv-caddr")||""}')

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
new_inner = new_inner.replace('Thank you for your business! Please make payment within the due date.', '${v("f-inv-notes")}')
new_inner = new_inner.replace('<div class="inv-sig-name" id="pSigName">Your Name</div>', '<div class="inv-sig-name" id="pSigName">${v("f-sig")||co}</div>')
new_inner = new_inner.replace('<div class="inv-sig-role" id="pSigRole">Founder</div>', '<div class="inv-sig-role" id="pSigRole">${v("f-sig-role")||""}</div>')

# Payment terms & details
new_inner = new_inner.replace('Account Name: YENCODE Tech<br>', 'Account Name: ${v("f-company")}<br>')
new_inner = new_inner.replace('Account No: 1234567890<br>', 'Account No: ${v("f-inv-acct")}<br>')
new_inner = new_inner.replace('IFSC: HDFC0001234<br>', 'IFSC: ${v("f-inv-ifsc")}<br>')
new_inner = new_inner.replace('Bank: HDFC Bank', 'Bank: ${v("f-inv-bank")}')
new_inner = new_inner.replace('UPI: yencode@okaxis', 'UPI: ${v("f-inv-upi")}')

js_replacement = """
  document.getElementById('docHeaderZone').innerHTML = '';
  document.getElementById('docFooterZone').innerHTML = '';

  document.getElementById('docBodyZone').innerHTML = `""" + new_inner + """`;
"""

start_ri = td_html.find("document.getElementById('docHeaderZone').innerHTML = '';", td_html.find('function renderInv()'))
end_ri = td_html.find("setTimeout(() => calcInv(), 10);", start_ri)
if start_ri != -1 and end_ri != -1:
    td_html = td_html[:start_ri] + js_replacement + '\n  ' + td_html[end_ri:]
else:
    print('Warning: could not find renderInv replacement bounds')

with open('c:/M Business/M Business/public/template-designer.html', 'w', encoding='utf-8') as f:
    f.write(td_html)
print('Patched renderInv')
