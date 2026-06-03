import sys, re
sys.stdout.reconfigure(encoding='utf-8')

# ─── READ FILES ───────────────────────────────────────────────────────────────
with open('c:/M Business/M Business/new_invoice_ui.html', 'r', encoding='utf-8') as f:
    inv_html = f.read()

with open('c:/M Business/M Business/new_proposals_ui.html', 'r', encoding='utf-8') as f:
    prop_html = f.read()

with open('c:/M Business/M Business/public/template-designer.html', 'r', encoding='utf-8') as f:
    td = f.read()

# ─── EXTRACT INVOICE CSS ──────────────────────────────────────────────────────
inv_css_start = inv_html.find('/* INVOICE PREVIEW DOC */')
inv_css_end   = inv_html.find('/* MOBILE */')
inv_css = inv_html[inv_css_start:inv_css_end] if inv_css_start != -1 else ''

# ─── EXTRACT PROPOSAL CSS ────────────────────────────────────────────────────
prop_css_start = prop_html.find('/* PROPOSAL DOC */')
prop_css_end   = prop_html.find('/* DELIVERABLES IN PREVIEW */')
prop_css2_start = prop_html.find('/* DELIVERABLES IN PREVIEW */')
prop_css2_end   = prop_html.find('@media(max-width:1100px)')
prop_css = ''
if prop_css_start != -1 and prop_css2_end != -1:
    prop_css = prop_html[prop_css_start:prop_css2_end]

# ─── EXTRACT INVOICE JS ──────────────────────────────────────────────────────
inv_js_start = inv_html.rfind('<script>') + len('<script>')
inv_js_end   = inv_html.rfind('</script>')
inv_js_raw   = inv_html[inv_js_start:inv_js_end].strip()

# Rename IDs to avoid collision with template-designer's IDs
# Invoice form IDs in new_invoice_ui use: fromCompany, fromEmail etc
# Template designer uses f-company, f-email etc
# We'll rename the inv JS to reference template-designer input IDs
inv_js = inv_js_raw
inv_js = inv_js.replace("document.getElementById('itemsBody')", "document.getElementById('td-inv-itemsBody')")
inv_js = inv_js.replace("document.getElementById('previewItems')", "document.getElementById('invItemRows')")
inv_js = inv_js.replace("document.getElementById('fromCompany').value", "window._tdv('f-company')")
inv_js = inv_js.replace("document.getElementById('fromEmail').value", "window._tdv('f-email')")
inv_js = inv_js.replace("document.getElementById('fromPhone').value", "window._tdv('f-phone')")
inv_js = inv_js.replace("document.getElementById('fromAddress').value", "window._tdv('f-addr')")
inv_js = inv_js.replace("document.getElementById('fromGST').value", "window._tdv('f-gst')")
inv_js = inv_js.replace("document.getElementById('toName').value", "window._tdv('f-inv-client')")
inv_js = inv_js.replace("document.getElementById('toEmail').value", "window._tdv('f-inv-cemail')")
inv_js = inv_js.replace("document.getElementById('toPhone').value", "window._tdv('f-inv-cphone')")
inv_js = inv_js.replace("document.getElementById('toAddress').value", "window._tdv('f-inv-caddr')")
inv_js = inv_js.replace("document.getElementById('toGST').value", "window._tdv('f-inv-cgst')")
inv_js = inv_js.replace("document.getElementById('invNumber').value", "window._tdv('f-inv-num')")
inv_js = inv_js.replace("document.getElementById('invDate').value", "window._tdv('f-inv-date')")
inv_js = inv_js.replace("document.getElementById('dueDate').value", "window._tdv('f-inv-due')")
inv_js = inv_js.replace("document.getElementById('invNotes').value", "window._tdv('f-inv-notes')")
inv_js = inv_js.replace("document.getElementById('discountPct').value", "window._tdv('f-inv-disc')")
inv_js = inv_js.replace("document.getElementById('extraCharges')", "document.getElementById('f-inv-extra')")
# totals
inv_js = inv_js.replace("document.getElementById('subtotalVal')", "document.getElementById('invSub')")
inv_js = inv_js.replace("document.getElementById('taxVal')", "document.getElementById('invTax')")
inv_js = inv_js.replace("document.getElementById('grandTotal')", "document.getElementById('invGrand')")
inv_js = inv_js.replace("document.getElementById('pSubtotal')", "document.getElementById('invSub')")
inv_js = inv_js.replace("document.getElementById('pTax')", "document.getElementById('invTax')")
inv_js = inv_js.replace("document.getElementById('pGrand')", "document.getElementById('invGrand')")
inv_js = inv_js.replace("document.getElementById('pDiscount')", "document.getElementById('invDisc')")
inv_js = inv_js.replace("document.getElementById('pDiscountRow')", "document.getElementById('invDiscRow')")
inv_js = inv_js.replace("document.getElementById('discountVal')", "document.getElementById('invDisc')")
inv_js = inv_js.replace("document.getElementById('pFromCompany')", "document.getElementById('pInvFromComp')")
inv_js = inv_js.replace("document.getElementById('pFromName')", "document.getElementById('pInvFromName')")
inv_js = inv_js.replace("document.getElementById('pFromDetails')", "document.getElementById('pInvFromDet')")
inv_js = inv_js.replace("document.getElementById('pFromDetail2')", "document.getElementById('pInvFromDet2')")
inv_js = inv_js.replace("document.getElementById('pToName')", "document.getElementById('pInvToName')")
inv_js = inv_js.replace("document.getElementById('pToDetail')", "document.getElementById('pInvToDet')")
inv_js = inv_js.replace("document.getElementById('pInvNumber')", "document.getElementById('pInvNum')")
inv_js = inv_js.replace("document.getElementById('pInvDate')", "document.getElementById('pInvDate')")
inv_js = inv_js.replace("document.getElementById('pDueDate')", "document.getElementById('pInvDue')")
inv_js = inv_js.replace("document.getElementById('pNotes')", "document.getElementById('pInvNotes')")
inv_js = inv_js.replace("document.getElementById('pStatus')", "document.getElementById('pInvStatus')")
# Remove init calls (we will call manually)
inv_js = inv_js.replace('// Init\ncalcTotals();\nupdatePreview();', '')
# Rename to avoid conflicts
inv_js = inv_js.replace('function fmt(n)', 'function invFmt(n)')
inv_js = inv_js.replace('function calcTotals()', 'function invCalcTotals()')
inv_js = inv_js.replace('calcTotals()', 'invCalcTotals()')
inv_js = inv_js.replace('function addRow()', 'function invAddRow()')
inv_js = inv_js.replace('function removeRow(btn)', 'function invRemoveRow(btn)')
inv_js = inv_js.replace('function updatePreview()', 'function invUpdatePreview()')
inv_js = inv_js.replace('function selectTemplate(el)', 'function invSelectTemplate(el)')
inv_js = inv_js.replace('function selectTerm(el,val)', 'function invSelectTerm(el,val)')
inv_js = inv_js.replace('function saveDraft()', 'function invSaveDraft()')
inv_js = inv_js.replace('function sendInvoice()', 'function invSendInvoice()')
inv_js = inv_js.replace("fmt(", "invFmt(")
inv_js = inv_js.replace("let rowCount=2;", "let invRowCount=2;")
inv_js = inv_js.replace("rowCount++", "invRowCount++")
inv_js = inv_js.replace("id=\"total_${rowCount}\"", "id=\"total_${invRowCount}\"")

# ─── EXTRACT PROPOSAL JS ─────────────────────────────────────────────────────
prop_js_start = prop_html.rfind('<script>') + len('<script>')
prop_js_end   = prop_html.rfind('</script>')
prop_js_raw   = prop_html[prop_js_start:prop_js_end].strip()

prop_js = prop_js_raw
# Wire proposal JS to template-designer IDs
prop_js = prop_js.replace("document.getElementById('propTitle').value", "window._tdv('f-prop-title')")
prop_js = prop_js.replace("document.getElementById('propDate').value", "window._tdv('f-prop-date')")
prop_js = prop_js.replace("document.getElementById('propType').value", "window._tdv('f-prop-type')")
prop_js = prop_js.replace("document.getElementById('propExpiry').value", "window._tdv('f-prop-expi')")
prop_js = prop_js.replace("document.getElementById('fromComp').value", "window._tdv('f-company')")
prop_js = prop_js.replace("document.getElementById('fromPerson').value", "window._tdv('f-sig')")
prop_js = prop_js.replace("document.getElementById('fromEmail').value", "window._tdv('f-email')")
prop_js = prop_js.replace("document.getElementById('fromPhone').value", "window._tdv('f-phone')")
prop_js = prop_js.replace("document.getElementById('fromAddr').value", "window._tdv('f-addr')")
prop_js = prop_js.replace("document.getElementById('toComp').value", "window._tdv('f-prop-client')")
prop_js = prop_js.replace("document.getElementById('gst').value", "window._tdv('f-prop-gst')")
prop_js = prop_js.replace("document.getElementById('disc').value", "window._tdv('f-prop-disc')")
# Remove init calls
prop_js = re.sub(r'// Init.*?up\(\);.*?\n', '', prop_js, flags=re.DOTALL)
prop_js = prop_js.replace('const fmtDate = v => { try { return new Date(v).toLocaleDateString(\'en-GB\',{day:\'2-digit\',month:\'short\',year:\'numeric\'}); } catch { return v; } };', '')
prop_js = prop_js.replace("const fmt = n => '₹' + Number(n).toLocaleString('en-IN');", "")
# Rename functions to avoid conflicts
prop_js = prop_js.replace('function up()', 'function propUp()')
prop_js = prop_js.replace("up()", "propUp()")

# ─── EXTRACT INVOICE PREVIEW HTML ────────────────────────────────────────────
inv_prev_start = inv_html.find('<div class="invoice-preview" id="invoicePreview">')
div_count = 0
inv_prev_end = -1
for i in range(inv_prev_start, len(inv_html)):
    if inv_html[i:i+4] == '<div': div_count += 1
    elif inv_html[i:i+6] == '</div>':
        div_count -= 1
        if div_count == 0: inv_prev_end = i + 6; break

inv_prev_html = inv_html[inv_prev_start:inv_prev_end]

# Rename element IDs in preview to avoid collision
inv_prev_html = inv_prev_html.replace('class="invoice-preview" id="invoicePreview"', 'class="invoice-preview"')
inv_prev_html = inv_prev_html.replace('id="pFromCompany"', 'id="pInvFromComp"')
inv_prev_html = inv_prev_html.replace('id="pFromName"', 'id="pInvFromName"')
inv_prev_html = inv_prev_html.replace('id="pFromDetails"', 'id="pInvFromDet"')
inv_prev_html = inv_prev_html.replace('id="pFromDetail2"', 'id="pInvFromDet2"')
inv_prev_html = inv_prev_html.replace('id="pToName"', 'id="pInvToName"')
inv_prev_html = inv_prev_html.replace('id="pToDetail"', 'id="pInvToDet"')
inv_prev_html = inv_prev_html.replace('id="pInvNumber"', 'id="pInvNum"')
inv_prev_html = inv_prev_html.replace('id="pInvDate"', 'id="pInvDate"')
inv_prev_html = inv_prev_html.replace('id="pDueDate"', 'id="pInvDue"')
inv_prev_html = inv_prev_html.replace('id="pNotes"', 'id="pInvNotes"')
inv_prev_html = inv_prev_html.replace('id="pStatus"', 'id="pInvStatus"')
inv_prev_html = inv_prev_html.replace('id="previewItems"', 'id="invItemRows"')
inv_prev_html = inv_prev_html.replace('id="pSubtotal"', 'id="invSub"')
inv_prev_html = inv_prev_html.replace('id="pTax"', 'id="invTax"')
inv_prev_html = inv_prev_html.replace('id="pGrand"', 'id="invGrand"')
inv_prev_html = inv_prev_html.replace('id="pDiscount"', 'id="invDisc"')
inv_prev_html = inv_prev_html.replace('id="pDiscountRow"', 'id="invDiscRow"')
inv_prev_html = inv_prev_html.replace('onclick="addRow()"', 'onclick="invAddRow()"')
inv_prev_html = inv_prev_html.replace('onclick="removeRow(this)"', 'onclick="invRemoveRow(this)"')
inv_prev_html = inv_prev_html.replace('oninput="calcTotals()"', 'oninput="invCalcTotals()"')

# ─── EXTRACT PROPOSAL PREVIEW HTML ───────────────────────────────────────────
prop_prev_start = prop_html.find('<div class="prop-doc" id="propDoc">')
div_count = 0
prop_prev_end = -1
for i in range(prop_prev_start, len(prop_html)):
    if prop_html[i:i+4] == '<div': div_count += 1
    elif prop_html[i:i+6] == '</div>':
        div_count -= 1
        if div_count == 0: prop_prev_end = i + 6; break

prop_prev_html = prop_html[prop_prev_start:prop_prev_end]
prop_prev_html = prop_prev_html.replace('class="prop-doc" id="propDoc"', 'class="prop-doc"')
prop_prev_html = prop_prev_html.replace('oninput="up()"', 'oninput="propUp()"')
prop_prev_html = prop_prev_html.replace('onchange="up()"', 'onchange="propUp()"')

# ─── EXTRACT INVOICE ITEMS FORM SECTION ─────────────────────────────────────
# Find the items table from new_invoice_ui sidebar
items_form_start = inv_html.find('<table class="items-table"')
items_form_end_div = inv_html.find('<!-- DEDUCTIONS -->', items_form_start)
# Grab from the table to deductions
items_form = inv_html[items_form_start:items_form_end_div]
items_form = items_form.replace('id="itemsBody"', 'id="td-inv-itemsBody"')
items_form = items_form.replace('onclick="addRow()"', 'onclick="invAddRow()"')
items_form = items_form.replace('onclick="removeRow(this)"', 'onclick="invRemoveRow(this)"')
items_form = items_form.replace('oninput="calcTotals()"', 'oninput="invCalcTotals()"')

# ─── INJECT CSS INTO TEMPLATE-DESIGNER ───────────────────────────────────────
# Inject invoice CSS if not already there
if '/* INVOICE PREVIEW DOC */' not in td and inv_css:
    prop_css_marker = td.find('/* PROPOSAL PREVIEW */')
    if prop_css_marker != -1:
        td = td[:prop_css_marker] + inv_css + '\n' + td[prop_css_marker:]
        print('Injected invoice CSS')
    else:
        print('WARNING: could not find proposal CSS marker')

# Inject proposal doc CSS if not already there
if '/* PROPOSAL DOC */' not in td and prop_css:
    prop_css_marker = td.find('/* PROPOSAL PREVIEW */')
    if prop_css_marker != -1:
        td = td[:prop_css_marker] + prop_css + '\n' + td[prop_css_marker:]
        print('Injected proposal CSS')

# ─── REPLACE RENDERINV BODY ───────────────────────────────────────────────────
rend_inv_fn_start = td.find('function renderInv()')
# Find where the body render part starts
body_render_start = td.find("document.getElementById('docHeaderZone').innerHTML", rend_inv_fn_start)
body_render_end   = td.find("setTimeout(() => calcInv(), 10);", body_render_start)

new_rend_inv_body = f"""
  document.getElementById('docHeaderZone').innerHTML = '';
  document.getElementById('docFooterZone').innerHTML = '';
  document.getElementById('docBodyZone').innerHTML = `{inv_prev_html}`;
  setTimeout(() => {{ invCalcTotals(); invUpdatePreview(); }}, 30);
  """

if body_render_start != -1 and body_render_end != -1:
    td = td[:body_render_start] + new_rend_inv_body + td[body_render_end:]
    print('Replaced renderInv body')
else:
    print('WARNING: could not find renderInv body bounds')

# Remove old calcInv call if exists
td = td.replace("setTimeout(() => calcInv(), 10);", "// calcInv now handled by invCalcTotals")

# ─── REPLACE RENDERPROP BODY ──────────────────────────────────────────────────
rend_prop_fn_start = td.find('function renderProp()')
body_render_start  = td.find("document.getElementById('docHeaderZone').innerHTML", rend_prop_fn_start)
body_render_end    = td.find("setTimeout(() => calcProp(), 10);", body_render_start)

new_rend_prop_body = f"""
  document.getElementById('docHeaderZone').innerHTML = '';
  document.getElementById('docFooterZone').innerHTML = '';
  document.getElementById('docBodyZone').innerHTML = `{prop_prev_html}`;
  setTimeout(() => {{ propUp(); }}, 30);
  """

if body_render_start != -1 and body_render_end != -1:
    td = td[:body_render_start] + new_rend_prop_body + td[body_render_end:]
    print('Replaced renderProp body')
else:
    print('WARNING: could not find renderProp body bounds')

td = td.replace("setTimeout(() => calcProp(), 10);", "// calcProp now handled by propUp")

# ─── INJECT NEW JS (INVOICE + PROPOSAL) ──────────────────────────────────────
# Add helper function and new JS before closing </script>
helper = """
// ── HELPER: get value from template-designer input by id ──
window._tdv = function(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
};
"""

new_js_block = f"""
// ══════════════════════════════════════════
// INVOICE JS (from new_invoice_ui.html)
// ══════════════════════════════════════════
{inv_js}

// ══════════════════════════════════════════
// PROPOSAL JS (from new_proposals_ui.html)
// ══════════════════════════════════════════
{prop_js}
"""

# Inject before the last </script>
last_script_end = td.rfind('</script>')
td = td[:last_script_end] + helper + new_js_block + '\n' + td[last_script_end:]
print('Injected invoice and proposal JS')

# ─── INJECT INVOICE ITEMS TABLE INTO CTRL-INV SIDEBAR ────────────────────────
# Find the items section in ctrl-inv
items_marker = td.find('id="invItemsSection"')
if items_marker == -1:
    # Find the invoice items dynamic row section in the old template
    items_marker = td.find('id="invLines"')
    if items_marker == -1:
        # Just before the "Notes" field in ctrl-inv
        notes_marker = td.find('id="f-inv-notes"')
        if notes_marker != -1:
            # Find the enclosing acc-item div
            acc_start = td.rfind('<div class="acc-item">', 0, notes_marker)
            items_note = f"""
          <!-- ITEMS TABLE (dynamic) -->
          <div class="acc-item">
            <div class="acc-hdr" onclick="toggleAcc(this)">
              <div class="acc-icon" style="background:#FFF3E0;color:#F57C00"><i class="ti ti-list-details"></i></div>
              <div class="acc-title">Invoice Items</div>
              <i class="ti ti-chevron-up acc-arrow open"></i>
            </div>
            <div class="acc-body open">
              {items_form}
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
                <div class="fg"><label class="fl">Discount %</label><input class="fi" type="number" id="f-inv-disc" value="0" oninput="invCalcTotals()"></div>
                <div class="fg"><label class="fl">Extra Charges</label><input class="fi" type="number" id="f-inv-extra" value="0" oninput="invCalcTotals()"></div>
              </div>
            </div>
          </div>
"""
            # Insert before the notes acc-item
            td = td[:acc_start] + items_note + td[acc_start:]
            print('Injected invoice items table into sidebar')

# ─── WRITE OUTPUT ─────────────────────────────────────────────────────────────
with open('c:/M Business/M Business/public/template-designer.html', 'w', encoding='utf-8') as f:
    f.write(td)

print('DONE: template-designer.html updated successfully')
