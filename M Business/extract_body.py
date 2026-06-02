with open('C:\\M Business\\M Business\\temp_ui_subscriptions.txt', 'r', encoding='utf-8') as f:
    content = f.read()

import re
body_match = re.search(r'<body>(.*?)</body>', content, re.DOTALL)

if body_match:
    with open('C:\\M Business\\M Business\\temp_sub_body.html', 'w', encoding='utf-8') as f:
        f.write(body_match.group(1).strip())
    print("Extracted body")
else:
    print("Body not found")
