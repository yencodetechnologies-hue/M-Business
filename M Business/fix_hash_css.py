import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Add hash-based CSS to hide tabs BEFORE JS runs (no flash)
# Insert a style that hides .doc-tabs when body has data-mode="lh"
old_body = "<body>"
new_body = """<body>
<style id="hashStyle"></style>
<script>
// Instant hash-based tab hiding BEFORE render
(function(){
  var h = location.hash.substring(1);
  var validHashes = ['lh','quo','inv','prop'];
  if(validHashes.includes(h)){
    document.getElementById('hashStyle').textContent = '.doc-tabs{display:none!important}';
    document.documentElement.setAttribute('data-hash', h);
  }
})();
</script>"""
text = text.replace(old_body, new_body, 1)

with open(r"C:\M Business\M Business\public\template-designer.html", "w", encoding="utf-8") as f:
    f.write(text)
print("Added instant hash CSS")
