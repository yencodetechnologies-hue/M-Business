import re

f1 = open(r'c:\M Business\M Business\src\components\ProposalForm.jsx', encoding='utf-8').read()
m = re.search(r'<style>(\{`.*?`\})</style>', f1, re.DOTALL)
if m:
    style = m.group(1)
    f2 = open(r'c:\M Business\M Business\src\components\ProjectProposalCreator.jsx', encoding='utf-8').read()
    f2_new = f2.replace(
        '<div dangerouslySetInnerHTML={{ __html: doc?.html || "<div>No content</div>" }} />',
        '<style>{`'+style[2:-2]+'`}</style><div style={{width:"800px", margin:"0 auto", paddingBottom:"100px"}} dangerouslySetInnerHTML={{ __html: doc?.html || "<div>No content</div>" }} />'
    )
    open(r'c:\M Business\M Business\src\components\ProjectProposalCreator.jsx', 'w', encoding='utf-8').write(f2_new)
    print("Done")
else:
    print("Style not found")
