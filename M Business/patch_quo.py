import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/M Business/M Business/new_quotation_ui.html', 'r', encoding='utf-8') as f:
    quo_html = f.read()

start_css = quo_html.find('/* QUOTATION DOC */')
end_css = quo_html.find('/* SCOPE PHASES */')
quo_css = quo_html[start_css:end_css]

start_html = quo_html.find('<div class="quo-preview" id="quoPreview">')
div_count = 0
end_html = -1
for i in range(start_html, len(quo_html)):
    if quo_html[i:i+4] == '<div':
        div_count += 1
    elif quo_html[i:i+6] == '</div>':
        div_count -= 1
        if div_count == 0:
            end_html = i + 6
            break
            
quo_preview_inner = quo_html[start_html + len('<div class="quo-preview" id="quoPreview">\n'):end_html - 6]

with open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8') as f:
    td_html = f.read()

start_td_css = td_html.find('/* QUOTATION PREVIEW BODY */')
end_td_css = td_html.find('/* PROPOSAL PREVIEW */')
if start_td_css != -1 and end_td_css != -1:
    td_html = td_html[:start_td_css] + quo_css + '\n' + td_html[end_td_css:]

new_inner = quo_preview_inner
new_inner = new_inner.replace('YENCODE Technologies', '${co}')
new_inner = new_inner.replace('yencodetechnologies@gmail.com<br>\n                +91 89254 33533', '${v("f-email")||""}<br>\n                ${v("f-phone")||""}')
new_inner = new_inner.replace('<div class="quo-logo-box">YT</div>', '${logo}')
new_inner = new_inner.replace('#QUO-2026-0022', '#${v("f-quo-num")}')
new_inner = new_inner.replace('Date: 01 Jun 2026', 'Date: ${fmtDate(v("f-quo-date"))}')
new_inner = new_inner.replace('Valid until: 16 Jun 2026', 'Valid until: ${validDate}')
new_inner = new_inner.replace('<div class="quo-party-name" id="pFromName">Prabhu R</div>', '<div class="quo-party-name" id="pFromName">${v("f-sig")||co}</div>')
new_inner = new_inner.replace('<div class="quo-party-detail" id="pFromDetail">${co}<br>\nChennai, Tamil Nadu</div>', '<div class="quo-party-detail" id="pFromDetail">${co}<br>\n${v("f-addr")||""}</div>')
new_inner = new_inner.replace('— Client Name —', '${client}')
new_inner = new_inner.replace('<span style="color:var(--text3)">Fill in client details</span>', '${cemail}')
new_inner = new_inner.replace('— Project Title —', '${quoTitle}')
new_inner = new_inner.replace('<div class="quo-scope-tags" id="pScopeTags">\n              <span class="quo-scope-tag">UI/UX Design</span>\n              <span class="quo-scope-tag">Frontend Dev</span>\n              <span class="quo-scope-tag">CMS Setup</span>\n            </div>', '<div class="quo-scope-tags" id="pScopeTags">${tagsHtml}</div>')

items_tbody_start = new_inner.find('<tbody id="pItems">')
items_tbody_end = new_inner.find('</tbody>', items_tbody_start) + 8
new_inner = new_inner[:items_tbody_start] + '<tbody id="quoItemRows"></tbody>' + new_inner[items_tbody_end:]

new_inner = new_inner.replace('id="pSubtotal"', 'id="quoSub"')
new_inner = new_inner.replace('id="pTax"', 'id="quoTax"')
new_inner = new_inner.replace('id="pDiscRow"', 'id="quoDiscRow"')
new_inner = new_inner.replace('id="pDisc"', 'id="quoDisc"')
new_inner = new_inner.replace('id="pGrand"', 'id="quoGrand"')

new_inner = new_inner.replace('<div class="quo-sig-name" id="pSigName">Prabhu R</div>', '<div class="quo-sig-name" id="pSigName">${v("f-sig")||co}</div>')
new_inner = new_inner.replace('<div class="quo-sig-role">${co}</div>', '<div class="quo-sig-role">${v("f-sig-role")||"Authorised Signatory"}</div>')

js_replacement = """
  document.getElementById('docHeaderZone').innerHTML = '';
  document.getElementById('docFooterZone').innerHTML = '';

  document.getElementById('docBodyZone').innerHTML = `""" + new_inner + """`;
"""

start_rq = td_html.find("document.getElementById('docHeaderZone').innerHTML = '';")
end_rq = td_html.find("setTimeout(() => calcQuo(), 10);")
td_html = td_html[:start_rq] + js_replacement + '\n  ' + td_html[end_rq:]

with open('c:/M Business/M Business/public/template-designer.html', 'w', encoding='utf-8') as f:
    f.write(td_html)
print('Patched renderQuo')
