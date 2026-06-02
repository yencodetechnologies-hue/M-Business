import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Fix footer - it uses chk() but we changed contactBlock not chk
# renderLH uses: const showFooter = chk("show-footer")  
# check if chk is still correct
idx = text.find("const showFooter")
if idx != -1:
    print(text[max(0,idx-50):idx+300].encode("ascii","ignore").decode("ascii"))

# 2. Check ec() function
idx2 = text.find("function ec(")
if idx2 != -1:
    print(text[idx2:idx2+200].encode("ascii","ignore").decode("ascii"))
