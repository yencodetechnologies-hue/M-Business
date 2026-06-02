import re

# 1. Fix Accounts Overflow
accounts_file = r'C:\M Business\M Business\src\components\ModernAccountsView.jsx'
with open(accounts_file, 'r', encoding='utf-8') as f:
    acc_content = f.read()

# The divs with the large balances
acc_content = re.sub(
    r'<div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-1px" }}>',
    r'<div title={formatCurrency(primaryBal)} style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>',
    acc_content, count=1
)
acc_content = re.sub(
    r'<div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-1px" }}>\{formatCurrency\(secondaryBal\)\}',
    r'<div title={formatCurrency(secondaryBal)} style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{formatCurrency(secondaryBal)}',
    acc_content, count=1
)
# Fix savings balance
acc_content = re.sub(
    r'<div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-1px", marginTop: 4 }}>',
    r'<div title={formatCurrency(savingsBal)} style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-1px", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>',
    acc_content, count=1
)
# Fix total balance overview
acc_content = re.sub(
    r'<div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.5px" }}>',
    r'<div title={formatCurrency(primaryBal + secondaryBal + savingsBal)} style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", padding: "0 10px" }}>',
    acc_content, count=1
)

with open(accounts_file, 'w', encoding='utf-8') as f:
    f.write(acc_content)


# 2. Fix Template Designer Hash Auto-Select and Hide Tabs
template_file = r'C:\M Business\M Business\public\template-designer.html'
with open(template_file, 'r', encoding='utf-8') as f:
    tpl_content = f.read()

tpl_replacement = """// Auto-select tab based on hash
window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.substring(1);
  if (hash) {
    const tabBtn = document.querySelector(`.dt[onclick*="'${hash}'"]`);
    if (tabBtn) tabBtn.click();
    
    // Hide the tabs container to show ONLY the requested template
    const tabsContainer = document.querySelector('.doc-tabs');
    if (tabsContainer) {
      tabsContainer.style.display = 'none';
    }
  }
});"""

tpl_content = re.sub(r'// Auto-select tab based on hash.*?\}\);', tpl_replacement, tpl_content, flags=re.DOTALL)

with open(template_file, 'w', encoding='utf-8') as f:
    f.write(tpl_content)

print("Applied fixes")
