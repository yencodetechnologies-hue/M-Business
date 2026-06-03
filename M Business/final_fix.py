import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8') as f:
    td = f.read()

# ── 1. Add f-prop-engagement near f-prop-duration ────────────────────────────
old_duration = '<div class="fg"><label class="fl">Duration</label><input class="fi" id="f-prop-duration"'
new_duration = '''<div class="fg"><label class="fl">Duration</label><input class="fi" id="f-prop-duration"'''

# Find the duration field and add engagement model after it
duration_pos = td.find('id="f-prop-duration"')
if duration_pos != -1:
    # find end of this fg div
    fg_end = td.find('</div>', duration_pos) + 6
    engagement_html = '''
            <div class="fg"><label class="fl">Engagement Model</label>
              <select class="fi" id="f-prop-engagement" oninput="safeRender()">
                <option>Fixed Price</option>
                <option>Time & Material</option>
                <option>Retainer</option>
                <option>Milestone Based</option>
              </select>
            </div>'''
    if 'f-prop-engagement' not in td:
        td = td[:fg_end] + engagement_html + td[fg_end:]
        print('Added f-prop-engagement')
    else:
        print('f-prop-engagement already exists')

# ── 2. Add f-prop-terms near f-prop-closing ─────────────────────────────────
closing_pos = td.find('id="f-prop-closing"')
if closing_pos != -1:
    fg_end = td.find('</div>', closing_pos) + 6
    terms_html = '''
            <div class="fg"><label class="fl">Terms & Conditions</label>
              <textarea class="fi" id="f-prop-terms" rows="3" style="resize:vertical" oninput="safeRender()">1. 50% advance payment required before project commencement.
2. Remaining 50% upon project delivery.
3. Source code delivered after full payment.</textarea>
            </div>'''
    if 'f-prop-terms' not in td:
        td = td[:fg_end] + terms_html + td[fg_end:]
        print('Added f-prop-terms')
    else:
        print('f-prop-terms already exists')

# ── 3. Make sure switchDoc calls renderInv/renderProp via safeRender ─────────
# switchDoc already calls render() which calls renderProp / renderInv - good

# ── 4. Ensure propUp() safe null checks — wrap key querySelector calls ───────
# The proposal JS calls document.getElementById('td-delList') etc. 
# These exist in prop-doc HTML (the preview). But when Proposal tab isn't active,
# propDoc isn't in DOM. So we add null guards around key querySelectorAll calls.
# This is done by wrapping the list-rendering in null checks.

# Guard td-delList
td = td.replace(
    "const dl = document.getElementById('td-delList');",
    "const dl = document.getElementById('td-delList'); if (!dl) return;"
)
td = td.replace(
    "const ms = document.getElementById('td-msList');",
    "const ms = document.getElementById('td-msList'); if (!ms) return;"
)

# ── 5. Wire addMilestone / addDeliverable / addTeamMember buttons ─────────────
# These functions in prop JS reference original IDs. Let's check if they're renamed.
td = td.replace("document.getElementById('pricingList')", "document.getElementById('td-pricingList')")

# ── 6. Remove the old calcProp / calcInv functions so they don't conflict ─────
# calcProp and calcInv in original template-designer are replaced, 
# just comment them out so they dont throw
import re
# remove calcProp definition
td = re.sub(
    r'// ── PROPOSAL ──\s*\nfunction calcProp\(\).*?(?=\nfunction renderProp)',
    '// calcProp() replaced by propUp()\n',
    td, flags=re.DOTALL
)
# remove calcInv definition  
td = re.sub(
    r'// ── INVOICE ──\s*\nfunction calcInv\(\).*?(?=\nfunction renderInv)',
    '// calcInv() replaced by invCalcTotals()\n',
    td, flags=re.DOTALL
)

print('Removed old calcProp/calcInv')

with open('c:/M Business/M Business/public/template-designer.html', 'w', encoding='utf-8') as f:
    f.write(td)

print('DONE: final cleanup complete')
