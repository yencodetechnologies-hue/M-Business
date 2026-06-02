import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# ── FIX 1: Remove underline from lb-editor, add text-decoration:none ──
old_lbe = ".lb-editor{min-height:280px;outline:none;cursor:text;color:#1A2E35;line-height:1.8;font-size:12.5px}"
new_lbe = ".lb-editor{min-height:280px;outline:none;cursor:text;color:#1A2E35;line-height:1.8;font-size:12.5px;text-decoration:none}"
text = text.replace(old_lbe, new_lbe)

# ── FIX 2: Fix toolbar buttons to use onmousedown + preventDefault (keeps focus/selection) ──
# Bold button
text = text.replace(
    '<button class="tb-btn" onclick="ec(\'bold\')" title="Bold"><i class="ti ti-bold"></i></button>',
    '<button class="tb-btn" onmousedown="event.preventDefault();ec(\'bold\')" title="Bold"><i class="ti ti-bold"></i></button>'
)
# Italic button
text = text.replace(
    '<button class="tb-btn" onclick="ec(\'italic\')" title="Italic"><i class="ti ti-italic"></i></button>',
    '<button class="tb-btn" onmousedown="event.preventDefault();ec(\'italic\')" title="Italic"><i class="ti ti-italic"></i></button>'
)
# Underline button
text = text.replace(
    '<button class="tb-btn" onclick="ec(\'underline\')" title="Underline"><i class="ti ti-underline"></i></button>',
    '<button class="tb-btn" onmousedown="event.preventDefault();ec(\'underline\')" title="Underline"><i class="ti ti-underline"></i></button>'
)
# Align buttons too
text = text.replace('onclick="ec(\'justifyLeft\')"', 'onmousedown="event.preventDefault();ec(\'justifyLeft\')"')
text = text.replace('onclick="ec(\'justifyCenter\')"', 'onmousedown="event.preventDefault();ec(\'justifyCenter\')"')
text = text.replace('onclick="ec(\'justifyRight\')"', 'onmousedown="event.preventDefault();ec(\'justifyRight\')"')
text = text.replace('onclick="ec(\'justifyFull\')"', 'onmousedown="event.preventDefault();ec(\'justifyFull\')"')
text = text.replace('onclick="insertTable()"', 'onmousedown="event.preventDefault();insertTable()"')

# Font size select - keep onclick but add onmousedown prevent for dropdown
# Actually for select we keep it as is

# ── FIX 3: Full CSS in printDoc ──
old_print_css = """  const css = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:${font};background:#fff}.paper,.doc-body{font-family:${font}}.lb-editor:empty::before{content:none}@media print{@page{margin:0}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;"""

# Get all the CSS from the style tag in the head
css_start = text.find("<style>")
css_end = text.find("</style>", css_start)
full_css = text[css_start+7:css_end] if css_start != -1 else ""

new_print_css = """  // Get the full document CSS for printing
  const allStyles = Array.from(document.styleSheets).map(ss => {
    try { return Array.from(ss.cssRules).map(r => r.cssText).join('\\n'); }
    catch(e) { return ''; }
  }).join('\\n');
  const printOverrides = `
    *{box-sizing:border-box}
    body{margin:0;padding:0;font-family:${font};background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .paper{width:100%;box-shadow:none;border-radius:0;margin:0;min-height:100vh}
    .doc-body{font-family:${font}}
    .lb-editor:empty::before{content:none}
    .lb-editor{min-height:0}
    @media print{@page{margin:0;size:A4}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  `;
  const css = allStyles + '\\n' + printOverrides;"""

text = text.replace(old_print_css, new_print_css)

with open(r"C:\M Business\M Business\public\template-designer.html", "w", encoding="utf-8") as f:
    f.write(text)
print("All 3 fixes applied!")
