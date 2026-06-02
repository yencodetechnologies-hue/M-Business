import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Check lb-editor CSS
idx = text.find("lb-editor")
if idx != -1:
    print(text[max(0,idx-50):idx+300].encode("ascii","ignore").decode("ascii"))
    print("---")
    
# 2. Check printDoc function
idx2 = text.find("function printDoc()")
if idx2 != -1:
    print(text[idx2:idx2+800].encode("ascii","ignore").decode("ascii"))
