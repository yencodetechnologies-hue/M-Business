import os

with open('c:/M Business/M Business/src/index.css', 'r', encoding='utf-8') as f:
    existing_css = f.read()

# Prefix styling rules to append
styles_to_append = """

/* ==========================================================================
   INVOICE CREATOR CUSTOM PREFIXED STYLES
   ========================================================================== */
.inv-creator-form-side { display: flex; flex-direction: column; gap: 16px; }
.inv-creator-card { background: #FFFFFF; border: 1.5px solid #E0EEF0; border-radius: 14px; overflow: hidden; margin-bottom: 12px; }
.inv-creator-card-header { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid #E0EEF0; }
.inv-creator-card-title { font-size: 13px; font-weight: 800; color: #1A2E35; }
.inv-creator-card-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
.inv-creator-card-body { padding: 18px; }

.inv-creator-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
.inv-creator-form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 14px; }
.inv-creator-form-group { margin-bottom: 14px; }
.inv-creator-form-group:last-child { margin-bottom: 0; }
.inv-creator-form-label { font-size: 11px; font-weight: 700; color: #607D86; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 6px; display: block; }
.inv-creator-form-input { width: 100%; padding: 10px 13px; background: #F5FAFA; border: 1.5px solid #E0EEF0; border-radius: 10px; font-size: 13px; color: #1A2E35; font-family: inherit; outline: none; transition: all .15s; }
.inv-creator-form-input:focus { border-color:  var(--app-accent, #00BCD4) !important; background: #FFFFFF; box-shadow: 0 0 0 3px rgba(0,188,212,.08); }
.inv-creator-form-input::placeholder { color: #A0B8BE; }
.inv-creator-form-input:read-only { background: #F8FAFB; color: #A0B8BE; cursor: not-allowed; }
.inv-creator-form-select { width: 100%; padding: 10px 13px; background: #F5FAFA; border: 1.5px solid #E0EEF0; border-radius: 10px; font-size: 13px; color: #1A2E35; font-family: inherit; outline: none; cursor: pointer; appearance: none; -webkit-appearance: none; transition: all .15s; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23A0B8BE' stroke-width='2'%3E%3Cpolyline points='6,9 12,15 18,9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; }
.inv-creator-form-select:focus { border-color:  var(--app-accent, #00BCD4) !important; box-shadow: 0 0 0 3px rgba(0,188,212,.08); }
.inv-creator-form-textarea { width: 100%; padding: 10px 13px; background: #F5FAFA; border: 1.5px solid #E0EEF0; border-radius: 10px; font-size: 13px; color: #1A2E35; font-family: inherit; outline: none; resize: vertical; min-height: 72px; transition: all .15s; }
.inv-creator-form-textarea:focus { border-color:  var(--app-accent, #00BCD4) !important; box-shadow: 0 0 0 3px rgba(0,188,212,.08); }
.inv-creator-form-textarea::placeholder { color: #A0B8BE; }

.inv-creator-template-row { display: flex; gap: 8px; margin-bottom: 14px; }
.inv-creator-template-opt { flex: 1; padding: 10px; border: 1.5px solid #E0EEF0; border-radius: 10px; cursor: pointer; text-align: center; transition: all .15s; }
.inv-creator-template-opt:hover { border-color:  var(--app-accent, #00BCD4); }
.inv-creator-template-opt.selected { border-color:  var(--app-accent, #00BCD4); background: var(--teal-lighter, #F0FDFE); }
.inv-creator-template-opt-icon { font-size: 20px; margin-bottom: 4px; }
.inv-creator-template-opt-name { font-size: 10px; font-weight: 700; color: #607D86; }
.inv-creator-template-opt.selected .inv-creator-template-opt-name { color:  var(--app-accent, #00BCD4); }

.inv-creator-items-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
.inv-creator-items-table thead tr th { font-size: 10px; font-weight: 700; color: #A0B8BE; text-transform: uppercase; letter-spacing: .6px; padding: 8px 10px; text-align: left; background: #F8FAFB; border-bottom: 1px solid #E0EEF0; }
.inv-creator-items-table tbody tr td { padding: 6px 6px; border-bottom: 1px solid #E0EEF0; vertical-align: middle; }
.inv-creator-items-table tbody tr:last-child td { border-bottom: none; }
.inv-creator-item-input { width: 100%; padding: 8px 10px; background: #F5FAFA; border: 1.5px solid transparent; border-radius: 8px; font-size: 12px; color: #1A2E35; font-family: inherit; outline: none; transition: all .15s; }
.inv-creator-item-input:focus { border-color:  var(--app-accent, #00BCD4) !important; background: #FFFFFF; box-shadow: 0 0 0 2px rgba(0,188,212,.08); }
.inv-creator-item-input.desc { min-width: 160px; }
.inv-creator-item-input.num { width: 70px; text-align: right; }
.inv-creator-item-total { font-size: 13px; font-weight: 700; color: #1A2E35; padding: 0 10px; min-width: 80px; text-align: right; }
.inv-creator-del-row-btn { width: 26px; height: 26px; border-radius: 7px; background: none; border: 1.5px solid #E0EEF0; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 13px; color: #A0B8BE; transition: all .15s; flex-shrink: 0; }
.inv-creator-del-row-btn:hover { border-color: #F05C5C; color: #F05C5C; background: #FEF2F2; }
.inv-creator-add-item-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: var(--teal-lighter, #F0FDFE); border: 1.5px dashed  var(--app-accent, #00BCD4); border-radius: 9px; font-size: 12px; font-weight: 700; color:  var(--app-accent, #00BCD4); cursor: pointer; transition: all .15s; font-family: inherit; width: 100%; justify-content: center; }
.inv-creator-add-item-btn:hover { background: var(--teal-light, #E0F7FA); }

.inv-creator-totals-section { border-top: 1px solid #E0EEF0; padding-top: 14px; margin-top: 4px; }
.inv-creator-total-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 13px; }
.inv-creator-total-label { color: #607D86; font-weight: 600; }
.inv-creator-total-val { font-weight: 700; color: #1A2E35; }
.inv-creator-total-row.discount .inv-creator-total-val { color: #26C281; }
.inv-creator-total-row.tax .inv-creator-total-val { color: #F5A623; }
.inv-creator-total-row.grand { padding: 10px 14px; background: linear-gradient(135deg, var(--teal-lighter, #F0FDFE), var(--teal-light, #E0F7FA)); border-radius: 10px; border: 1.5px solid var(--teal-light, #E0F7FA); margin-top: 6px; }
.inv-creator-total-row.grand .inv-creator-total-label { font-size: 14px; font-weight: 800; color: #1A2E35; }
.inv-creator-total-row.grand .inv-creator-total-val { font-size: 18px; font-weight: 900; color:  var(--app-accent, #00BCD4); }

.inv-creator-payment-terms-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
.inv-creator-pt-opt { padding: 8px 6px; border: 1.5px solid #E0EEF0; border-radius: 9px; cursor: pointer; text-align: center; transition: all .15s; font-family: inherit; }
.inv-creator-pt-opt:hover { border-color:  var(--app-accent, #00BCD4); }
.inv-creator-pt-opt.selected { border-color:  var(--app-accent, #00BCD4); background: var(--teal-lighter, #F0FDFE); color:  var(--app-accent, #00BCD4); }
.inv-creator-pt-opt-days { font-size: 14px; font-weight: 800; color: #1A2E35; }
.inv-creator-pt-opt.selected .inv-creator-pt-opt-days { color:  var(--app-accent, #00BCD4); }
.inv-creator-pt-opt-label { font-size: 9px; color: #A0B8BE; font-weight: 600; }
.inv-creator-pt-opt.selected .inv-creator-pt-opt-label { color:  var(--app-accent, #00BCD4); }

.inv-creator-sig-pad { border: 2px dashed #C5DDE0; border-radius: 10px; height: 90px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; cursor: pointer; transition: all .15s; background: #F5FAFA; }
.inv-creator-sig-pad:hover { border-color:  var(--app-accent, #00BCD4); background: var(--teal-lighter, #F0FDFE); }
"""

# Check if already added to avoid double appending
if "inv-creator-form-side" not in existing_css:
    with open('c:/M Business/M Business/src/index.css', 'a', encoding='utf-8') as f:
        f.write(styles_to_append)
    print("SUCCESS: Appended prefixed styling rules to src/index.css!")
else:
    print("Pre-existing styles found in src/index.css, skipping append.")
