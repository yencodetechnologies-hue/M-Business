import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# Update applyHash to also hide ctrl panels for other doc types when hash forces a specific type
old_applyHash = """function applyHash() {
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
}"""

new_applyHash = """function applyHash() {
  const hash = window.location.hash.substring(1);
  if (hash && ['lh','quo','inv','prop'].includes(hash)) {
    // Click the correct tab button
    const tabBtn = document.querySelector(`.dt[onclick*="'${hash}'"]`);
    if (tabBtn) tabBtn.click();
    else {
      // Manually switch
      docType = hash;
      ['lh','quo','inv','prop'].forEach(t => {
        const el = document.getElementById('ctrl-' + t);
        if (el) el.style.display = t === hash ? '' : 'none';
      });
      render();
    }
    
    // Hide the top doc-tabs bar entirely  
    const tabsContainer = document.querySelector('.doc-tabs');
    if (tabsContainer) {
      tabsContainer.style.display = 'none';
    }
    
    // Update the preview title
    const titles = {lh:'Letterhead', quo:'Quotation', prop:'Proposal', inv:'Invoice'};
    const prevTitle = document.getElementById('prevTitle');
    if (prevTitle && titles[hash]) prevTitle.textContent = titles[hash] + ' Preview';
  }
}"""

text = text.replace(old_applyHash, new_applyHash)
if old_applyHash not in text:
    print("Could not find old applyHash - checking...")
else:
    print("applyHash updated OK")

with open(r"C:\M Business\M Business\public\template-designer.html", "w", encoding="utf-8") as f:
    f.write(text)
