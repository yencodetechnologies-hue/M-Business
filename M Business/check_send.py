import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# Check the sendDoc function - look for f-clientName
idx = text.find("f-clientName")
if idx != -1:
    print("f-clientName found:", text[max(0,idx-100):idx+100].encode("ascii","ignore").decode("ascii"))
else:
    print("f-clientName NOT FOUND in HTML inputs")

# Check the send button area
idx2 = text.find("sendDoc()")
if idx2 != -1:
    print(text[max(0,idx2-200):idx2+100].encode("ascii","ignore").decode("ascii"))
