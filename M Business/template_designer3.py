import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('SAVE_DOCUMENT')
if idx != -1:
    print(text[idx-1000:idx+500].encode("ascii", "ignore").decode("ascii"))
