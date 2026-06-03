import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('c:/M Business/M Business/src/components/InvoiceCreator.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Let's add the CSS styles inside the <style> tag of InvoiceCreator.jsx
style_marker = '        input[type=number] { -moz-appearance: textfield; }'
styles_to_add = '''
        /* LIVE INVOICE PREVIEW STYLES */
        .invoice-preview { padding: 24px; font-size: 12px; color: #1A2E35; background: #fff; min-height: 560px; }
        .inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; }
        .inv-logo-box { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 900; color: #fff; margin-bottom: 8px; }
        .inv-company-name { font-size: 14px; font-weight: 800; color: #1A2E35; }
        .inv-company-details { font-size: 10px; color: #607D86; line-height: 1.7; margin-top: 3px; }
        .inv-title-area { text-align: right; }
        .inv-title-word { font-size: 28px; font-weight: 900; letter-spacing: -.5px; }
        .inv-id { font-size: 12px; font-weight: 700; color: #1A2E35; margin-top: 4px; }
        .inv-dates { font-size: 10px; color: #607D86; margin-top: 2px; line-height: 1.8; }
        .inv-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .inv-party-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 5px; }
        .inv-party-name { font-size: 13px; font-weight: 800; color: #1A2E35; }
        .inv-party-detail { font-size: 10px; color: #607D86; line-height: 1.7; margin-top: 2px; }
        .inv-items-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .inv-items-table thead th { padding: 8px 10px; font-size: 10px; font-weight: 700; color: #fff; text-align: left; letter-spacing: .4px; }
        .inv-items-table thead th:last-child { text-align: right; }
        .inv-items-table tbody tr { border-bottom: 1px solid #E0EEF0; }
        .inv-items-table tbody tr:nth-child(even) { background: #F8FAFB; }
        .inv-items-table tbody td { padding: 8px 10px; font-size: 11px; color: #1A2E35; }
        .inv-items-table tbody td:last-child { text-align: right; font-weight: 700; }
        .inv-totals { margin-left: auto; width: 200px; }
        .inv-total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; border-bottom: 1px solid #E0EEF0; }
        .inv-total-row:last-child { border-bottom: none; }
        .inv-total-row .lbl { color: #607D86; }
        .inv-total-row .val { font-weight: 700; color: #1A2E35; }
        .inv-grand-row { display: flex; justify-content: space-between; padding: 8px 10px; border-radius: 8px; margin-top: 6px; color: #fff; }
        .inv-grand-row .lbl { font-size: 12px; font-weight: 800; }
        .inv-grand-row .val { font-size: 14px; font-weight: 900; }
        .inv-footer { margin-top: 20px; padding-top: 14px; border-top: 1px solid #E0EEF0; display: flex; justify-content: space-between; align-items: flex-end; }
        .inv-notes { flex: 1; }
        .inv-notes-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 4px; }
        .inv-notes-text { font-size: 10px; color: #607D86; line-height: 1.6; }
        .inv-sig { text-align: right; }
        .inv-sig-line { width: 100px; height: 1px; background: #607D86; margin-left: auto; margin-bottom: 4px; }
        .inv-sig-name { font-size: 10px; font-weight: 700; color: #1A2E35; }
        .inv-sig-role { font-size: 9px; color: #607D86; }
        .inv-bank { margin-top: 14px; padding: 10px 12px; border-radius: 8px; }
        .inv-bank-title { font-size: 10px; font-weight: 700; margin-bottom: 4px; }
        .inv-bank-detail { font-size: 10px; line-height: 1.7; }
'''

if style_marker in code:
    code = code.replace(style_marker, style_marker + '\n' + styles_to_add)
    print("Injected CSS styles successfully!")
else:
    print("WARNING: style_marker not found")

# 2. Let's fix var(--text) references in the preview markup to actual hex colors or app variables
code = code.replace('color: "var(--text)"', 'color: "#1A2E35"')
code = code.replace('color: inv.client ? "var(--text)" : "var(--app-muted)"', 'color: inv.client ? "#1A2E35" : "var(--app-muted)"')
code = code.replace('Color: "var(--text)"', 'Color: "#1A2E35"')

with open('c:/M Business/M Business/src/components/InvoiceCreator.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS: Fixed preview CSS and text color variables in InvoiceCreator.jsx!")
