import re
with open(r"C:\M Business\M Business\src\components\ClientDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# Find where messages tab renders content
idx = text.find('"messages"')
# Find all occurrences
for m in re.finditer(r'"messages"', text):
    start = m.start()
    snippet = text[max(0,start-80):start+200]
    print(f"=== Pos {start} ===")
    print(snippet.encode("ascii","ignore").decode("ascii"))
    print()
