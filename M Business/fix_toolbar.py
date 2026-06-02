import re

file_path = r'C:\M Business\M Business\src\components\InvoiceCreator.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add states
state_addition = """  const [filterTab, setFilterTab] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [clientFilter, setClientFilter] = useState("all");

  const handleExportCSV = (data) => {
    if (!data.length) {
      showToast({msg: "No data to export", type: "err"});
      return;
    }
    const headers = ["Invoice ID", "Client", "Project", "Issue Date", "Due Date", "Status", "Amount", "Currency"];
    const rows = data.map(e => [
      e.invoiceNo, e.client, e.inv?.project || e.project || "", 
      e.inv?.date || e.date, e.inv?.dueDate || e.dueDate, 
      e.status, e.total || e.amount || 0, e.currency || "INR"
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `invoices_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
"""
content = re.sub(r'  const \[filterTab, setFilterTab\] = useState\("all"\);\s*', state_addition, content)

# 2. Add client filter & sort logic
filter_logic = """                  if (clientFilter !== "all" && e.client !== clientFilter) return false;

                  const term = listSearch.toLowerCase();
                  return (e.invoiceNo || "").toLowerCase().includes(term) ||
                    (e.client || "").toLowerCase().includes(term) ||
                    (e.inv?.project || e.project || "").toLowerCase().includes(term);
                }).sort((a, b) => {
                  const dateA = new Date(a.inv?.date || a.date || 0).getTime();
                  const dateB = new Date(b.inv?.date || b.date || 0).getTime();
                  return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
                }).map((entry, idx) => {"""
content = re.sub(
    r'                  const term = listSearch\.toLowerCase\(\).*?\}\)\.map\(\(entry, idx\) => \{',
    filter_logic,
    content,
    flags=re.DOTALL
)

# 3. Replace the toolbar buttons
buttons_target = r'<button className="sort-btn"><i className="ti ti-arrows-sort".*?Export CSV</button>'
buttons_replacement = """<button className="sort-btn" onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}><i className={sortOrder === "desc" ? "ti ti-sort-descending" : "ti ti-sort-ascending"} style={{fontSize:13}}></i> Sort by Date</button>
                <div style={{ position: "relative" }}>
                  <select className="sort-btn" value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{ appearance: "none", cursor: "pointer", paddingRight: 24, paddingLeft: 10 }}>
                    <option value="all">All Clients</option>
                    {[...new Set(enriched.map(e => e.client).filter(Boolean))].map(c => (
                      <option key={c} value={c}>{c.substring(0, 15)}{c.length > 15 ? '...' : ''}</option>
                    ))}
                  </select>
                  <i className="ti ti-chevron-down" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 14, color: "var(--text3)" }}></i>
                </div>
              </div>
              <button className="export-btn" onClick={() => {
                const filteredData = enriched.filter(e => {
                  if (filterTab === "paid" && e.status !== "paid" && e.status !== "part_paid") return false;
                  if (filterTab === "pending" && e.status !== "unpaid" && e.status !== "part_paid") return false;
                  if (filterTab === "overdue" && e.status !== "overdue") return false;
                  if (filterTab === "draft" && e.status !== "draft") return false;
                  if (clientFilter !== "all" && e.client !== clientFilter) return false;
                  const term = listSearch.toLowerCase();
                  return (e.invoiceNo || "").toLowerCase().includes(term) || (e.client || "").toLowerCase().includes(term) || (e.inv?.project || e.project || "").toLowerCase().includes(term);
                }).sort((a, b) => {
                  const dateA = new Date(a.inv?.date || a.date || 0).getTime();
                  const dateB = new Date(b.inv?.date || b.date || 0).getTime();
                  return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
                });
                handleExportCSV(filteredData);
              }}><i className="ti ti-download" style={{fontSize:13}}></i> Export CSV</button>"""

content = re.sub(buttons_target, buttons_replacement, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Replaced toolbar buttons')
