import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# Find the actual quotation controls marker
idx = text.find("QUOTATION CONTROLS")
if idx != -1:
    print(text[max(0,idx-50):idx+100].encode("ascii","ignore").decode("ascii"))
else:
    idx2 = text.find("ctrl-quo")
    print(text[max(0,idx2-100):idx2+50].encode("ascii","ignore").decode("ascii"))
