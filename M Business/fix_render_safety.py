import re, time

with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Add cache-busting meta tag  
old_head = '<meta charset="UTF-8">'
new_head = f'<meta charset="UTF-8">\n<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">\n<meta http-equiv="Pragma" content="no-cache">\n<meta http-equiv="Expires" content="0">'
text = text.replace(old_head, new_head, 1)

# 2. The real fix - wrap all oninput="render()" with safety check
# Instead of changing all the HTML, add a safe global render wrapper at the TOP of the script
old_state_start = "// ── STATE ──"
new_state_start = """// ── SAFE RENDER WRAPPER ──
window._renderReady = false;
function safeRender() { if (window._renderReady) render(); }

// ── STATE ──"""
text = text.replace(old_state_start, new_state_start, 1)

# 3. At the bottom, set renderReady = true and call render
old_applyhash_call = "applyHash();\nwindow.addEventListener('DOMContentLoaded', applyHash);"
new_applyhash_call = "window._renderReady = true;\napplyHash();\nwindow.addEventListener('DOMContentLoaded', applyHash);"
text = text.replace(old_applyhash_call, new_applyhash_call, 1)

# 4. Replace all oninput="render()" with oninput="safeRender()"
text = text.replace('oninput="render()"', 'oninput="safeRender()"')
# Also fix onclick and oninput in sliders
text = text.replace("oninput=\"setV('logoSzV',this.value,'px');render()\"", "oninput=\"setV('logoSzV',this.value,'px');safeRender()\"")
text = text.replace("oninput=\"setV('nameSzV',this.value,'px');render()\"", "oninput=\"setV('nameSzV',this.value,'px');safeRender()\"")
text = text.replace("oninput=\"setV('hdrPadV',this.value,'px');render()\"", "oninput=\"setV('hdrPadV',this.value,'px');safeRender()\"")

with open(r"C:\M Business\M Business\public\template-designer.html", "w", encoding="utf-8") as f:
    f.write(text)
print("Done! Added safeRender wrapper and cache-busting headers")
