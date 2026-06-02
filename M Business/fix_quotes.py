with open('C:\\M Business\\M Business\\src\\components\\QuotationCreator.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('C:\\M Business\\M Business\\temp_ui_quotes.txt', 'r', encoding='utf-8') as f:
    ui_lines = f.readlines()
    if ui_lines and not ui_lines[-1].endswith('\n'):
        ui_lines[-1] += '\n'

new_lines = lines[:424] + ui_lines + lines[553:]

with open('C:\\M Business\\M Business\\src\\components\\QuotationCreator.jsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Replaced UI successfully")
