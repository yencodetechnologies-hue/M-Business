import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8') as f:
    td = f.read()

# final_fix.py didn't add the fields because 'f-prop-engagement' and 'f-prop-terms'
# checks found positions but the "if 'f-prop-engagement' not in td" was True
# Let's just force-add them properly

# Add f-prop-engagement after f-prop-duration
dur_pos = td.find('id="f-prop-duration"')
if dur_pos != -1 and 'f-prop-engagement' not in td:
    fg_end = td.find('</div>', dur_pos) + 6
    eng_html = '\n            <div class="fg"><label class="fl">Engagement Model</label><select class="fi" id="f-prop-engagement" oninput="safeRender()"><option>Fixed Price</option><option>Time &amp; Material</option><option>Retainer</option><option>Milestone Based</option></select></div>'
    td = td[:fg_end] + eng_html + td[fg_end:]
    print('Added f-prop-engagement')

# Add f-prop-terms after f-prop-closing
closing_pos = td.find('id="f-prop-closing"')
if closing_pos != -1 and 'f-prop-terms' not in td:
    fg_end = td.find('</div>', closing_pos) + 6
    terms_html = '\n            <div class="fg"><label class="fl">Terms &amp; Conditions</label><textarea class="fi" id="f-prop-terms" rows="3" style="resize:vertical;min-height:70px" oninput="safeRender()">1. 50% advance payment required before commencement.\n2. Remaining 50% upon project delivery.\n3. Source code delivered after full payment.</textarea></div>'
    td = td[:fg_end] + terms_html + td[fg_end:]
    print('Added f-prop-terms')

with open('c:/M Business/M Business/public/template-designer.html', 'w', encoding='utf-8') as f:
    f.write(td)

print('Done')
