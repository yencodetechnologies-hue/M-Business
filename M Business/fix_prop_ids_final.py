import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8') as f:
    td = f.read()

# The template-designer ctrl-prop uses different IDs than what propUp() expects.
# Fix the _tdv() mapping in propUp() JS to use actual template-designer IDs.

# Mapping: new_proposals_ui ID -> template-designer actual ID
id_map = {
    "window._tdv('f-prop-title')":        "window._tdv('f-prop-title')",   # same
    "window._tdv('f-prop-date')":         "window._tdv('f-prop-date')",    # same
    "window._tdv('f-prop-type')":         "window._tdv('f-prop-type')",    # same
    "window._tdv('f-prop-expi')":         "window._tdv('f-prop-expiry')",  # FIX: expi -> expiry
    "window._tdv('f-prop-client')":       "window._tdv('f-prop-client')",  # same
    "window._tdv('f-prop-problem')":      "window._tdv('f-prop-prob')",    # FIX
    "window._tdv('f-prop-solution')":     "window._tdv('f-prop-sol')",     # FIX
    "window._tdv('f-prop-outcome')":      "window._tdv('f-prop-sol')",     # map to sol (no outcome)
    "window._tdv('f-prop-start')":        "window._tdv('f-prop-start')",
    "window._tdv('f-prop-end')":          "window._tdv('f-prop-end')",
    "window._tdv('f-prop-duration')":     "window._tdv('f-prop-duration')",
    "window._tdv('f-prop-engagement')":   "window._tdv('f-prop-type')",    # map to type
    "window._tdv('f-prop-paysched')":     "window._tdv('f-prop-paysched')",
    "window._tdv('f-prop-closing')":      "window._tdv('f-prop-closing')",
    "window._tdv('f-prop-terms')":        "window._tdv('f-prop-terms')",
    "window._tdv('f-prop-cperson')":      "window._tdv('f-prop-cperson')",
    "window._tdv('f-prop-cemail')":       "window._tdv('f-prop-cemail')",
    "window._tdv('f-prop-cphone')":       "window._tdv('f-prop-cphone')",
    "window._tdv('f-prop-caddr')":        "window._tdv('f-prop-caddr')",
    "window._tdv('f-prop-gst')":          "window._tdv('f-prop-gst')",
    "window._tdv('f-prop-disc')":         "window._tdv('f-prop-disc')",
}

# Apply fixes
for old, new in id_map.items():
    if old != new and old in td:
        td = td.replace(old, new)
        print(f'Fixed: {old} -> {new}')

# Also map list containers: td-delList -> propDels, td-msList -> propMs, td-pricingList -> propPricing
list_map = {
    "document.getElementById('td-delList')":     "document.getElementById('propDels')",
    "document.getElementById('td-msList')":      "document.getElementById('propMs')",
    "document.getElementById('td-pricingList')": "document.getElementById('propPricing')",
    "document.getElementById('td-teamList')":    "document.getElementById('td-teamList')",  # stays (in propDoc)
    "document.getElementById('td-valueList')":   "document.getElementById('td-valueList')",
    "document.getElementById('td-riskList')":    "document.getElementById('td-riskList')",
    "document.getElementById('td-csList')":      "document.getElementById('td-csList')",
    "document.getElementById('td-tmList')":      "document.getElementById('td-tmList')",
}

for old, new in list_map.items():
    if old != new and old in td:
        td = td.replace(old, new)
        print(f'Fixed list: {old[-30:]} -> {new[-30:]}')

# Now add the missing input fields to ctrl-prop sidebar:
# Add after f-prop-sol: start date, end date, duration, closing, terms, cperson, cemail, cphone, caddr

# Find the propMs section and add start/end/duration before it
propMs_pos = td.find('id="propMs"')
if propMs_pos != -1:
    # Find the enclosing acc-item start
    acc_start = td.rfind('<div class="acc-item">', 0, propMs_pos)
    # Find the start of the acc-item that contains propMs
    # Insert a new acc-item for Timeline right before propMs acc-item
    timeline_fields = '''
        <div class="acc-item">
          <div class="acc-hdr" onclick="toggleAcc(this)">
            <div class="acc-icon" style="background:#E8F5E9;color:#2E7D32"><i class="ti ti-calendar-event"></i></div>
            <div class="acc-title">Timeline & Terms</div>
            <i class="ti ti-chevron-up acc-arrow open"></i>
          </div>
          <div class="acc-body open">
            <div class="fg"><label class="fl">Project Start</label><input class="fi" type="date" id="f-prop-start" oninput="safeRender()"></div>
            <div class="fg"><label class="fl">Project End</label><input class="fi" type="date" id="f-prop-end" oninput="safeRender()"></div>
            <div class="fg"><label class="fl">Duration</label><input class="fi" type="text" id="f-prop-duration" placeholder="e.g. 4 Months" oninput="safeRender()"></div>
            <div class="fg"><label class="fl">Engagement Model</label>
              <select class="fi" id="f-prop-engagement" oninput="safeRender()">
                <option>Fixed Price</option><option>Time &amp; Material</option><option>Retainer</option><option>Milestone Based</option>
              </select>
            </div>
            <div class="fg"><label class="fl">Payment Schedule</label>
              <select class="fi" id="f-prop-paysched" oninput="safeRender()">
                <option>50/50 Split</option><option>30/40/30 Split</option><option>Monthly</option><option>On Delivery</option>
              </select>
            </div>
          </div>
        </div>
        <div class="acc-item">
          <div class="acc-hdr" onclick="toggleAcc(this)">
            <div class="acc-icon" style="background:#FFF3E0;color:#E65100"><i class="ti ti-user-check"></i></div>
            <div class="acc-title">Client Details</div>
            <i class="ti ti-chevron-up acc-arrow open"></i>
          </div>
          <div class="acc-body open">
            <div class="fg"><label class="fl">Contact Person</label><input class="fi" type="text" id="f-prop-cperson" placeholder="Client's name" oninput="safeRender()"></div>
            <div class="fg"><label class="fl">Email</label><input class="fi" type="email" id="f-prop-cemail" placeholder="client@email.com" oninput="safeRender()"></div>
            <div class="fg"><label class="fl">Phone</label><input class="fi" type="tel" id="f-prop-cphone" placeholder="+91 XXXXX XXXXX" oninput="safeRender()"></div>
            <div class="fg"><label class="fl">Address</label><input class="fi" type="text" id="f-prop-caddr" placeholder="City, Country" oninput="safeRender()"></div>
          </div>
        </div>
        <div class="acc-item">
          <div class="acc-hdr" onclick="toggleAcc(this)">
            <div class="acc-icon" style="background:#EDE7F6;color:#4527A0"><i class="ti ti-file-description"></i></div>
            <div class="acc-title">Closing & Terms</div>
            <i class="ti ti-chevron-up acc-arrow open"></i>
          </div>
          <div class="acc-body open">
            <div class="fg"><label class="fl">Closing Note</label><textarea class="fi" id="f-prop-closing" rows="2" style="resize:vertical" oninput="safeRender()">We are excited about the opportunity to work with you on this project.</textarea></div>
            <div class="fg"><label class="fl">Terms &amp; Conditions</label><textarea class="fi" id="f-prop-terms" rows="3" style="resize:vertical;min-height:70px" oninput="safeRender()">1. 50% advance payment required before commencement.
2. Remaining 50% upon project delivery.
3. Source code delivered after full payment.</textarea></div>
          </div>
        </div>
'''
    td = td[:acc_start] + timeline_fields + td[acc_start:]
    print('Added Timeline/Client/Closing sections to ctrl-prop')

with open('c:/M Business/M Business/public/template-designer.html', 'w', encoding='utf-8') as f:
    f.write(td)

print('DONE: fixed all ID mappings and added missing proposal fields')
