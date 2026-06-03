import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8') as f:
    td = f.read()

# calcTotal uses propSub, propTax, propGrand, propDiscRow, propDisc
# These are in the OLD template-designer propPricing area - NOT in propDoc preview.
# propDoc preview only has pv-grand and pv-pricing.
# Solution: replace calcTotal to use only pv-* ids that exist in propDoc.

old_calc = '''function calcTotal() {
  const rows = document.querySelectorAll('#pricingList .pricing-row');
  let sub = 0;
  let html = '';
  rows.forEach(r => {
    const inps = r.querySelectorAll('input');
    if (inps.length >= 2) {
      const n = inps[0].value || 'Item', v = parseFloat(inps[1].value) || 0;
      sub += v;
      html += `<tr><td>${n}</td><td>${fmtINR(v)}</td></tr>`;
    }
  });
  const gst = parseFloat(window._tdv('f-prop-gst')) || 0;
  const disc = parseFloat(window._tdv('f-prop-disc')) || 0;
  const discount = sub * disc / 100;
  const tax = sub * gst / 100;
  const grand = sub - discount + tax;
  document.getElementById('propSub').textContent = fmtINR(sub);
  document.getElementById('propTax').textContent = fmtINR(tax);
  document.getElementById('propGrand').textContent = fmtINR(grand);
  document.getElementById('pv-grand').textContent = fmtINR(grand);
  document.getElementById('pv-pricing').innerHTML = html;
  const dr = document.getElementById('propDiscRow');
  if (discount > 0) { dr.style.display = 'flex'; document.getElementById('propDisc').textContent = '-' + fmtINR(discount); } else { dr.style.display = 'none'; }
}'''

new_calc = '''function calcTotal() {
  const pl = document.getElementById('td-pricingList') || document.getElementById('propPricing');
  const rows = pl ? pl.querySelectorAll('.pricing-row') : [];
  let sub = 0;
  let html = '';
  rows.forEach(r => {
    const inps = r.querySelectorAll('input');
    if (inps.length >= 2) {
      const n = inps[0].value || 'Item', v = parseFloat(inps[1].value) || 0;
      sub += v;
      html += `<tr><td>${n}</td><td>${fmtINR(v)}</td></tr>`;
    }
  });
  const gst = parseFloat(window._tdv('f-prop-gst')) || 0;
  const disc = parseFloat(window._tdv('f-prop-disc')) || 0;
  const discount = sub * disc / 100;
  const tax = sub * gst / 100;
  const grand = sub - discount + tax;
  // Update propDoc preview elements (exist when prop tab is active)
  const pvGrand = document.getElementById('pv-grand');
  const pvPricing = document.getElementById('pv-pricing');
  if (pvGrand) pvGrand.textContent = fmtINR(grand);
  if (pvPricing) pvPricing.innerHTML = html;
}'''

if old_calc in td:
    td = td.replace(old_calc, new_calc)
    print('Replaced calcTotal()')
else:
    # Try flexible match
    calc_start = td.find('function calcTotal()')
    calc_end   = td.find('\n}', calc_start) + 2
    if calc_start != -1:
        old_fn = td[calc_start:calc_end]
        td = td[:calc_start] + new_calc + td[calc_end:]
        print('Replaced calcTotal() via position')
    else:
        print('WARNING: calcTotal not found')

# Also fix updateMilestonesPreview - it references td-msList -> propMs
# And teamList -> td-teamList etc. Let's check these in propJs block.
# updateMilestonesPreview reads from td-msList (sidebar) and writes to pv-timeline (preview)
# td-msList was renamed to propMs in fix_prop_ids_final.py

# Fix teamList -> not renamed, it should be td-teamList in sidebar.
# In new_proposals propDoc preview, pv-team is what gets updated.
# The sidebar list is id="teamList" in new_proposals.
# In template-designer sidebar ctrl-prop, the team list wrapper needs an ID.

# Search for the team dynamic list container in ctrl-prop
team_pos = td.find('id="td-teamList"')  
if team_pos == -1:
    # look for where team section is in ctrl-prop
    team_section = td.find('Team Members', td.find('id="ctrl-prop"'))
    if team_section != -1:
        # Find the dyn items container in that area
        dyn_pos = td.find('class="dyn-items"', team_section)
        if dyn_pos != -1:
            td = td[:dyn_pos] + 'class="dyn-items" id="td-teamList"' + td[dyn_pos+len('class="dyn-items"'):]
            print('Added td-teamList to team section')
    else:
        print('Team section not found in ctrl-prop')
else:
    print('td-teamList already exists')

# Fix valueList -> td-valueList
value_pos = td.find('id="td-valueList"')
if value_pos == -1:
    val_section = td.find('Value Propositions', td.find('id="ctrl-prop"'))
    if val_section == -1:
        val_section = td.find('Why Choose', td.find('id="ctrl-prop"'))
    if val_section != -1:
        dyn_pos = td.find('class="dyn-items"', val_section)
        if dyn_pos != -1:
            td = td[:dyn_pos] + 'class="dyn-items" id="td-valueList"' + td[dyn_pos+len('class="dyn-items"'):]
            print('Added td-valueList')
    else:
        print('Value section not found in ctrl-prop')
else:
    print('td-valueList already exists')

# Fix riskList -> td-riskList
risk_pos = td.find('id="td-riskList"')
if risk_pos == -1:
    risk_section = td.find('Risks', td.find('id="ctrl-prop"'))
    if risk_section != -1:
        dyn_pos = td.find('class="dyn-items"', risk_section)
        if dyn_pos != -1:
            td = td[:dyn_pos] + 'class="dyn-items" id="td-riskList"' + td[dyn_pos+len('class="dyn-items"'):]
            print('Added td-riskList')
    else:
        print('Risk section not found in ctrl-prop')
else:
    print('td-riskList already exists')

with open('c:/M Business/M Business/public/template-designer.html', 'w', encoding='utf-8') as f:
    f.write(td)

print('DONE')
