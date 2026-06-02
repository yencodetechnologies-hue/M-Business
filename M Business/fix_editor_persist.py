import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# Fix: preserve lbEditor content across renderLetter calls
# Add a global variable to store editor content
old_state = "let lhLayout = 'logo-left';"
new_state = """let lhLayout = 'logo-left';
let _lbEditorContent = '';"""

text = text.replace(old_state, new_state)

# In renderLetter, save editor content before overwriting innerHTML, then restore it
old_render_letter_start = "  document.getElementById('docBodyZone').innerHTML = `"
new_render_letter_start = """  const _prevEditor = document.getElementById('lbEditor');
  if (_prevEditor) _lbEditorContent = _prevEditor.innerHTML;
  document.getElementById('docBodyZone').innerHTML = `"""

# Only replace the first occurrence (inside renderLetter)
idx = text.find("function renderLetter()")
if idx != -1:
    end_idx = text.find("function calcQuo()", idx)
    renderLetter_block = text[idx:end_idx]
    fixed_block = renderLetter_block.replace(
        "  document.getElementById('docBodyZone').innerHTML = `",
        """  const _prevEditor = document.getElementById('lbEditor');
  if (_prevEditor) _lbEditorContent = _prevEditor.innerHTML;
  document.getElementById('docBodyZone').innerHTML = `""",
        1
    )
    text = text[:idx] + fixed_block + text[end_idx:]

# After setting innerHTML, restore editor content
old_wc = """  wcUpdate();
}"""

# Find wcUpdate in renderLetter context only
idx2 = text.find("function renderLetter()")
end2 = text.find("function calcQuo()", idx2)
renderLetter2 = text[idx2:end2]
fixed2 = renderLetter2.replace(
    "  wcUpdate();\n}",
    """  const _newEditor = document.getElementById('lbEditor');
  if (_newEditor && _lbEditorContent) _newEditor.innerHTML = _lbEditorContent;
  wcUpdate();
}""",
    1
)
text = text[:idx2] + fixed2 + text[end2:]

with open(r"C:\M Business\M Business\public\template-designer.html", "w", encoding="utf-8") as f:
    f.write(text)
print("Fixed renderLetter to preserve editor content")
