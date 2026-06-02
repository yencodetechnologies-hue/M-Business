import re
with open(r"C:\M Business\M Business\src\components\ClientDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()
    
idx2 = text.find("active===\"messages\"")
if idx2 != -1:
    print(text[max(0,idx2-50):idx2+100].encode("ascii","ignore").decode("ascii"))
