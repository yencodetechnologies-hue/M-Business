import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# Fix .paper to use flex layout so footer sticks to bottom
old_paper_css = ".paper{width:660px;background:#fff;box-shadow:0 6px 40px rgba(0,0,0,.12);border-radius:4px;overflow:hidden;min-height:900px;position:relative}"
new_paper_css = ".paper{width:660px;background:#fff;box-shadow:0 6px 40px rgba(0,0,0,.12);border-radius:4px;overflow:hidden;min-height:900px;position:relative;display:flex;flex-direction:column}"

text = text.replace(old_paper_css, new_paper_css)

# Fix .doc-body to flex-grow so it pushes footer to bottom
old_body_css = ".doc-body{padding:28px 40px;font-size:12.5px;line-height:1.8;color:#1A2E35}"
new_body_css = ".doc-body{padding:28px 40px;font-size:12.5px;line-height:1.8;color:#1A2E35;flex:1}"

# Replace both occurrences (there seem to be duplicates)
text = text.replace(old_body_css, new_body_css)

# Also fix docFooterZone to ensure it stays at bottom
old_footer_zone = '<div id="docFooterZone"></div>'
new_footer_zone = '<div id="docFooterZone" style="margin-top:auto"></div>'
text = text.replace(old_footer_zone, new_footer_zone)

with open(r"C:\M Business\M Business\public\template-designer.html", "w", encoding="utf-8") as f:
    f.write(text)
print("Fixed footer to bottom of paper")
