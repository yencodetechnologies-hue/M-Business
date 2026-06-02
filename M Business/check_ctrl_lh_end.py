import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# Find where ctrl-lh ends (end tag)
idx_start = text.find('id="ctrl-lh"')
idx_end = text.find('id="ctrl-quo"', idx_start)
if idx_start != -1 and idx_end != -1:
    # Find the closing </div> just before ctrl-quo
    # Lets get last 300 chars before ctrl-quo
    print(text[max(0, idx_end-300):idx_end].encode("ascii","ignore").decode("ascii"))
