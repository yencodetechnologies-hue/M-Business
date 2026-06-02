import re
with open(r"C:\M Business\M Business\src\components\ClientDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# Find MessagesPage and check if it takes props
idx = text.find("function MessagesPage(")
if idx != -1:
    print(text[idx:idx+200].encode("ascii","ignore").decode("ascii"))
    
# Find where MessagesPage is rendered
idx2 = text.find("<MessagesPage")
if idx2 != -1:
    print("---render---")
    print(text[max(0,idx2-50):idx2+100].encode("ascii","ignore").decode("ascii"))
