import re
with open(r"C:\M Business\M Business\src\components\ClientDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# Find the MessagesPage component
idx = text.find("function MessagesPage")
if idx == -1:
    idx = text.find("const MessagesPage")
if idx != -1:
    print(text[idx:idx+2000].encode("ascii","ignore").decode("ascii"))
else:
    print("MessagesPage component not found in ClientDashboard")
    # Maybe it is imported
    idx2 = text.find("MessagesPage")
    if idx2 != -1:
        print(text[max(0,idx2-200):idx2+200].encode("ascii","ignore").decode("ascii"))
