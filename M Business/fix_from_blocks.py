import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# Fix renderQuo From block
old_quo_from = """<div class="qp-detail">${v('f-email')}<br>${v('f-phone')}</div>"""
new_quo_from = """${contactBlock('#607D86')}"""
text = text.replace(old_quo_from, new_quo_from)

# Fix renderInv From block
old_inv_from = """<div style="font-size:10px;color:#607D86;line-height:1.8;margin-top:2px">${v('f-email')}<br>${v('f-phone')}</div>"""
new_inv_from = """<div style="margin-top:2px">${contactBlock('#607D86')}</div>"""
text = text.replace(old_inv_from, new_inv_from)

# Fix renderProp From block
old_prop_from = """<div style="font-size:10px;color:#607D86">${v('f-email')}</div>"""
new_prop_from = """<div style="margin-top:2px">${contactBlock('#607D86')}</div>"""
text = text.replace(old_prop_from, new_prop_from)

with open(r"C:\M Business\M Business\public\template-designer.html", "w", encoding="utf-8") as f:
    f.write(text)
print("Replaced From blocks")
