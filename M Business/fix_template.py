import re

file_path = r'C:\M Business\M Business\public\template-designer.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """// INIT
document.documentElement.style.setProperty('--lh-color', color);
render();

// Auto-select tab based on hash (Run immediately and on load)
function applyHash() {
  const hash = window.location.hash.substring(1);
  if (hash) {
    const tabBtn = document.querySelector(`.dt[onclick*="'${hash}'"]`);
    if (tabBtn) tabBtn.click();
    
    // Hide the tabs container to show ONLY the requested template
    const tabsContainer = document.querySelector('.doc-tabs');
    if (tabsContainer) {
      tabsContainer.style.display = 'none';
      tabsContainer.style.visibility = 'hidden';
      tabsContainer.style.height = '0px';
    }
  }
}

applyHash();
window.addEventListener('DOMContentLoaded', applyHash);
window.addEventListener('hashchange', applyHash);

</script>"""

content = re.sub(r'// INIT.*?</script>', replacement, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated template designer")
