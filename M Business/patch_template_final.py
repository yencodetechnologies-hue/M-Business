import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8') as f:
    td = f.read()

# 1. Replace calcProp() with calcTotal()
td = td.replace('calcProp()', 'calcTotal()')
td = td.replace('calcProp', 'calcTotal')

# 2. Update preview selector IDs in JS functions
td = td.replace("document.querySelectorAll('#teamList .team-card')", "document.querySelectorAll('#td-teamList .team-card')")
td = td.replace("document.querySelectorAll('#valueList .dv-input')", "document.querySelectorAll('#td-valueList .dv-input')")
td = td.replace("document.querySelectorAll('#riskList .risk-row-g')", "document.querySelectorAll('#td-riskList .risk-row-g')")

# 3. Insert the new accordion items right before <!-- PRICING -->
team_acc = '''
        <!-- OUR TEAM (PORTED) -->
        <div class="acc-item">
          <div class="acc-hdr" onclick="toggleAcc(this)">
            <div class="acc-icon" style="background:var(--green-bg);color:var(--green)"><i class="ti ti-users"></i></div>
            <div class="acc-title">Team Members</div>
            <i class="ti ti-chevron-up acc-arrow"></i>
          </div>
          <div class="acc-body" style="display:none">
            <div id="td-teamList" class="dyn-items">
              <div class="team-card">
                <div class="tc-av" style="background:linear-gradient(135deg,var(--teal),var(--teal4))">PR</div>
                <div style="flex:1;min-width:0">
                  <div class="tc-name">Your Name</div>
                  <div class="tc-role">Lead Developer & Project Manager</div>
                  <div class="tc-exp">8+ years · Web & Mobile Applications</div>
                  <div class="tc-skills"><span class="tc-skill">React.js</span><span class="tc-skill">Node.js</span></div>
                </div>
                <i class="ti ti-x tc-del" onclick="this.closest('.team-card').remove();updateTeamPreview()"></i>
              </div>
            </div>
            <button class="add-dyn-btn" onclick="addTeamMember()"><i class="ti ti-plus" style="font-size:12px"></i>Add Member</button>
          </div>
        </div>

        <!-- VALUE PROPOSITION (PORTED) -->
        <div class="acc-item">
          <div class="acc-hdr" onclick="toggleAcc(this)">
            <div class="acc-icon" style="background:var(--amber-bg);color:var(--amber)"><i class="ti ti-trending-up"></i></div>
            <div class="acc-title">Value Propositions</div>
            <i class="ti ti-chevron-up acc-arrow"></i>
          </div>
          <div class="acc-body" style="display:none">
            <div id="td-valueList" class="dyn-items">
              <div class="dv-item"><div class="dv-icon" style="background:var(--amber-bg);color:var(--amber)"><i class="ti ti-trending-up"></i></div><input type="text" class="dv-input" value="300% increase in organic traffic within 6 months" oninput="propUp()"><i class="ti ti-x dv-del" onclick="this.parentElement.remove();propUp()"></i></div>
            </div>
            <button class="add-dyn-btn" onclick="addValue()"><i class="ti ti-plus" style="font-size:12px"></i>Add Point</button>
          </div>
        </div>

        <!-- RISKS & MITIGATION (PORTED) -->
        <div class="acc-item">
          <div class="acc-hdr" onclick="toggleAcc(this)">
            <div class="acc-icon" style="background:var(--red-bg);color:var(--red)"><i class="ti ti-shield-exclamation"></i></div>
            <div class="acc-title">Risks & Mitigation</div>
            <i class="ti ti-chevron-up acc-arrow"></i>
          </div>
          <div class="acc-body" style="display:none">
            <div id="td-riskList" class="dyn-items">
              <div class="risk-row-g">
                <input type="text" class="pr-inp" value="Scope creep beyond deliverables" oninput="propUp()">
                <select class="pr-inp" style="padding:7px 8px;font-size:11px" onchange="propUp()"><option>High</option><option selected>Medium</option><option>Low</option></select>
                <input type="text" class="pr-inp" value="Formal change request process" oninput="propUp()">
                <button class="pr-del" onclick="this.closest('.risk-row-g').remove();propUp()"><i class="ti ti-trash"></i></button>
              </div>
            </div>
            <button class="add-dyn-btn" onclick="addRisk()"><i class="ti ti-plus" style="font-size:12px"></i>Add Risk</button>
          </div>
        </div>
'''

if 'id="td-teamList"' not in td:
    pricing_marker = '        <!-- PRICING -->'
    if pricing_marker in td:
        td = td.replace(pricing_marker, team_acc + '\n' + pricing_marker)
        print("Inserted Team, Value, and Risk accordion items")
    else:
        print("ERROR: <!-- PRICING --> marker not found")
else:
    print("td-teamList already exists in HTML")

# 4. Insert Subtotal & Grand Total into Investment accordion item
total_box_html = '''
            <div class="total-box" style="margin-top:10px">
              <div class="total-row" style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px"><span>Subtotal</span><span id="propSub">₹0</span></div>
              <div class="grand-box" style="display:flex;justify-content:space-between;padding:6px 8px;background:var(--teal);border-radius:6px;color:#fff;font-weight:bold;font-size:12px;margin-top:6px"><span>Total Investment</span><span id="propGrand">₹0</span></div>
            </div>
'''

if 'id="propSub"' not in td:
    investment_end_marker = 'id="f-prop-disc" value="0" oninput="calcTotal()"></div>\n            </div>'
    if investment_end_marker in td:
        td = td.replace(investment_end_marker, investment_end_marker + '\n' + total_box_html)
        print("Inserted propSub and propGrand HTML elements")
    else:
        # Fallback to look around f-prop-disc
        pos = td.find('id="f-prop-disc"')
        if pos != -1:
            body_end = td.find('</div>', td.find('</div>', pos) + 6)
            if body_end != -1:
                insert_pos = body_end + 6
                td = td[:insert_pos] + '\n' + total_box_html + td[insert_pos:]
                print("Inserted propSub and propGrand via position search")
            else:
                print("ERROR: body end for Investment not found")
        else:
            print("ERROR: f-prop-disc not found")
else:
    print("propSub already exists in HTML")

# 5. Update calcTotal() function to set propSub and propGrand
# Let's locate the calcTotal() function
calc_start = td.find('function calcTotal() {')
if calc_start != -1:
    calc_end = td.find('\n}', calc_start) + 2
    old_calc_fn = td[calc_start:calc_end]
    
    new_calc_fn = '''function calcTotal() {
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
  // Update sidebar totals
  const propSub = document.getElementById('propSub');
  const propGrand = document.getElementById('propGrand');
  if (propSub) propSub.textContent = fmtINR(sub);
  if (propGrand) propGrand.textContent = fmtINR(grand);
}'''
    td = td.replace(old_calc_fn, new_calc_fn)
    print("Updated calcTotal function with sidebar total updates")
else:
    print("ERROR: function calcTotal not found")

with open('c:/M Business/M Business/public/template-designer.html', 'w', encoding='utf-8') as f:
    f.write(td)

print("PATCHED template-designer.html successfully!")
