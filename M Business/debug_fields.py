import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8') as f:
    td = f.read()

# Check exact context around f-prop-duration to understand the issue
dur_pos = td.find('id="f-prop-duration"')
if dur_pos != -1:
    print('Found f-prop-duration at', dur_pos)
    print('Context:')
    print(td[dur_pos-100:dur_pos+200])
    print('---')
    # Find the end of the fg div
    fg_end = td.find('</div>', dur_pos) + 6
    print('fg_end char:', td[fg_end-10:fg_end+100])
else:
    print('f-prop-duration NOT FOUND')

print()
print('f-prop-engagement in td:', 'f-prop-engagement' in td)
print('f-prop-terms in td:', 'f-prop-terms' in td)
