with open('C:\\M Business\\M Business\\src\\components\\MySubscriptions.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('C:\\M Business\\M Business\\temp_ui.txt', 'r', encoding='utf-8') as f:
    ui_lines = f.readlines()

new_lines = lines[:531] + ui_lines

with open('C:\\M Business\\M Business\\src\\components\\MySubscriptions.jsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Replaced UI successfully")
