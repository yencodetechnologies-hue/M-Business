import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/M Business/M Business/new_proposals_ui.html', 'r', encoding='utf-8') as f:
    np = f.read()

with open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8') as f:
    td = f.read()

def find_context(text, query):
    idx = 0
    while True:
        idx = text.find(query, idx)
        if idx == -1:
            break
        print(f"--- Found '{query}' at {idx} ---")
        start = max(0, idx - 150)
        end = min(len(text), idx + 150)
        print(text[start:end])
        print("-------------------------------")
        idx += len(query)

print("=== NEW PROPOSALS UI ===")
for q in ['teamList', 'valueList', 'riskList', 'propSub', 'propGrand']:
    if q in np:
        print(f"Found {q} in new_proposals_ui.html")
    else:
        print(f"NOT Found {q} in new_proposals_ui.html")

print("\n=== TEMPLATE DESIGNER ===")
for q in ['teamList', 'valueList', 'riskList', 'propSub', 'propGrand', 'td-teamList', 'td-valueList', 'td-riskList']:
    if q in td:
        print(f"Found {q} in template-designer.html")
    else:
        print(f"NOT Found {q} in template-designer.html")
