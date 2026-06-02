with open('C:\\M Business\\M Business\\src\\components\\MessagingPage.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('C:\\M Business\\M Business\\temp_ui_messaging.txt', 'r', encoding='utf-8') as f:
    ui_lines = f.readlines()

return_idx = -1
for i, line in enumerate(lines):
    if line.startswith("  return (") and i > 50:
        return_idx = i
        break

if return_idx != -1:
    new_lines = lines[:return_idx] + ui_lines
    with open('C:\\M Business\\M Business\\src\\components\\MessagingPage.jsx', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f"Replaced UI successfully starting from {return_idx}")
else:
    print("Could not find return statement")
