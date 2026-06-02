import re

file_path = r'C:\M Business\M Business\src\components\ModernAccountsView.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add a compact formatter
compact_formatter = """const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };
  
  const formatCompact = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 2 }).format(val);
  };"""

content = re.sub(r'const formatCurrency =.*?};', compact_formatter, content, flags=re.DOTALL)

# Replace the specific large number displays to use formatCompact
content = re.sub(
    r'<div title=\{formatCurrency\(primaryBal\)\}.*?>\{formatCurrency\(primaryBal\)\}',
    r'<div title={formatCurrency(primaryBal)} style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-1px" }}>{formatCompact(primaryBal)}',
    content, count=1
)
content = re.sub(
    r'<div title=\{formatCurrency\(secondaryBal\)\}.*?>\{formatCurrency\(secondaryBal\)\}',
    r'<div title={formatCurrency(secondaryBal)} style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-1px" }}>{formatCompact(secondaryBal)}',
    content, count=1
)
content = re.sub(
    r'<div title=\{formatCurrency\(savingsBal\)\}.*?>',
    r'<div title={formatCurrency(savingsBal)} style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-1px", marginTop: 4 }}>',
    content, count=1
)
content = re.sub(
    r'>\{formatCurrency\(savingsBal\)\}',
    r'>{formatCompact(savingsBal)}',
    content, count=1
)
content = re.sub(
    r'<div title=\{formatCurrency\(primaryBal \+ secondaryBal \+ savingsBal\)\}.*?>',
    r'<div title={formatCurrency(primaryBal + secondaryBal + savingsBal)} style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.5px" }}>',
    content, count=1
)
content = re.sub(
    r'>\{formatCurrency\(primaryBal \+ secondaryBal \+ savingsBal\)\}',
    r'>{formatCompact(primaryBal + secondaryBal + savingsBal)}',
    content, count=1
)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated ModernAccountsView with compact formatting")
