import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# Find the paper CSS
idx = text.find('.paper{')
if idx == -1:
    idx = text.find('#mainPaper{')
if idx == -1:
    idx = text.find('.paper ')
if idx != -1:
    print(text[max(0,idx-50):idx+300].encode("ascii","ignore").decode("ascii"))

# Also find doc-body CSS
idx2 = text.find('.doc-body{')
if idx2 == -1:
    idx2 = text.find('.doc-body ')
if idx2 != -1:
    print(text[max(0,idx2-50):idx2+200].encode("ascii","ignore").decode("ascii"))
