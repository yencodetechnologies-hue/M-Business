import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('function render(')
if idx != -1:
    print(text[max(0, idx-100):idx+200].encode("ascii", "ignore").decode("ascii"))
else:
    print("function render NOT FOUND!")
