import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# The real issue: the script is after </div><!--/app--> but the oninput=render() calls
# fire when user types. These SHOULD work fine since the script is loaded before user types.
# The actual issue is the "B I U" toolbar uses ec() which calls document.execCommand on lbEditor.
# lbEditor is recreated each time renderLetter() is called (inside renderLH), so we need
# to persist the content. Let us check renderLetter more carefully.

idx = text.find("function renderLetter()")
if idx != -1:
    print(text[idx:idx+600].encode("ascii", "ignore").decode("ascii"))
