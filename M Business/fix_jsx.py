import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# Replace variables inside JSX
text = text.replace('₹{totalIncome || 0}', '₹{income.reduce((sum, i) => sum + (Number(i.amount) || 0), 0).toLocaleString()}')
text = text.replace('₹{totalExpenses || 0}', '₹{expenses.reduce((sum, i) => sum + (Number(i.amount) || 0), 0).toLocaleString()}')

with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Fixed JSX variables")
