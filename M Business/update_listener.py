import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# Add listener for SEND_DOCUMENT
idx = text.find('if (data.type === "SAVE_DOCUMENT") {')
if idx != -1:
    send_logic = """if (data.type === "SEND_DOCUMENT") {
          const payload = data.payload;
          
          // Save to localStorage so ClientDashboard can see it
          const existing = JSON.parse(localStorage.getItem('client_documents') || '[]');
          const newDoc = {
            id: 'DOC' + Date.now(),
            ...payload,
            dateSent: new Date().toISOString()
          };
          existing.unshift(newDoc); // add to top
          localStorage.setItem('client_documents', JSON.stringify(existing));
          
          showToast(`Document sent to Client (${payload.client})!`, "success");
        }
        """
    text = text[:idx] + send_logic + text[idx:]

with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "w", encoding="utf-8") as f:
    f.write(text)
print("Updated SubAdminDashboard.jsx")
