import re
with open(r"C:\M Business\M Business\public\template-designer.html", "r", encoding="utf-8") as f:
    text = f.read()

# Find all </script> occurrences  
matches = [(m.start(), m.end()) for m in re.finditer(r"</script>", text, re.IGNORECASE)]
for start, end in matches:
    context = text[max(0, start-80):end+20]
    print(f"Pos {start}: ...{context.encode('ascii','ignore').decode('ascii').strip()}")
    print("---")
