import re

with open('c:/M Business/M Business/src/components/InvoiceCreator.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Define the CSS classes to prefix
classes_to_prefix = [
    "form-side", "card", "card-header", "card-title", "card-icon", "card-body",
    "form-row", "form-row-3", "form-group", "form-label", "form-input", "form-select", "form-textarea",
    "template-row", "template-opt", "template-opt-icon", "template-opt-name",
    "items-table", "item-input", "item-total", "del-row-btn", "add-item-btn",
    "totals-section", "total-row", "total-label", "total-val",
    "payment-terms-grid", "pt-opt", "pt-opt-days", "pt-opt-label", "sig-pad"
]

# 1. First, prefix class names in the <style> block inside return
# We will match styles like .card { or .card:hover or .card.selected or .form-input:focus
for cls in classes_to_prefix:
    # Match class definitions in CSS (preceded by dot, followed by space, bracket, colon, or comma)
    code = re.sub(r'\.' + cls + r'([:\s\.,{])', r'.inv-creator-' + cls + r'\1', code)

# 2. Prefix className="card" or className="form-row" or className="pt-opt selected" inside JSX
# We will do this carefully using regex replacements on JSX tags.
for cls in classes_to_prefix:
    # Match className="card" or className="card " or className="selected card" or className="card selected"
    # To handle multiple classes, we can replace inside className quotes.
    # Let's match className="[^"]*" and replace the class inside.
    def replace_class(match):
        val = match.group(0)
        # Split classes inside className
        parts = val.split('"')
        classes = parts[1].split()
        prefixed_classes = [('inv-creator-' + c if c == cls else c) for c in classes]
        parts[1] = ' '.join(prefixed_classes)
        return '"'.join(parts)
    
    code = re.sub(r'className="[^"]*' + cls + r'[^"]*"', replace_class, code)

with open('c:/M Business/M Business/src/components/InvoiceCreator.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS: Prefixed all form classes with 'inv-creator-' prefix!")
