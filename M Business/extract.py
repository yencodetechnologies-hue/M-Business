import json

with open('C:\\M Business\\M Business\\subscriptions_transcript.txt', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

content = data.get('content', '')

print("Len:", len(content))
print("Start:", content.find('<style>'))
print("End:", content.find('</style>'))
