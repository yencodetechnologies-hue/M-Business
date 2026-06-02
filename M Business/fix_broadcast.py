import os
import re

file_path = r'C:\M Business\M Business\src\components\SubAdminDashboard.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

broadcast_code = """
    // Broadcast theme to any open iframes (Template Designer)
    const frames = document.querySelectorAll('iframe');
    frames.forEach(f => {
      if (f.contentWindow) {
        try {
          f.contentWindow.postMessage({ type: 'SET_THEME', color: t.accent }, '*');
        } catch(e) {}
      }
    });
"""

# Insert right after setting --teal-lighter
search_str = 'document.documentElement.style.setProperty("--teal-lighter", `rgba(${hexToRgb(t.accent)}, 0.04)`);'

if search_str in content:
    content = content.replace(search_str, search_str + "\n" + broadcast_code)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Injected broadcast code successfully.")
else:
    print("Could not find insertion point.")
