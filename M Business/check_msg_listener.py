import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# Find where postMessage listener should go (in useEffect)
idx = text.find("SAVE_DOCUMENT")
if idx != -1:
    print("SAVE_DOCUMENT found at:", idx)
    print(text[max(0,idx-400):idx+400].encode("ascii","ignore").decode("ascii"))
else:
    print("SAVE_DOCUMENT not found")
    # Check for postMessage or message listener
    idx2 = text.find("addEventListener(\"message\"")
    if idx2 == -1:
        idx2 = text.find("addEventListener('message'")
    if idx2 != -1:
        print("message listener found")
        print(text[max(0,idx2-200):idx2+400].encode("ascii","ignore").decode("ascii"))
    else:
        print("No message listener found")
