export function parseAmt(val) {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  const num = Number(String(val).replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(num) ? num : 0;
}

export function projectValue(p) {
  return parseAmt(p?.budget);
}

export function projectReceived(p) {
  const fromPayments = (p?.paymentsReceived || []).reduce((sum, row) => sum + parseAmt(row.amount), 0);
  return fromPayments > 0 ? fromPayments : parseAmt(p?.received);
}

export function projectAdvances(p) {
  return (p?.advances || []).reduce((sum, row) => sum + parseAmt(row.amount), 0);
}

export function projectPending(p) {
  return Math.max(0, projectValue(p) - projectReceived(p) - projectAdvances(p));
}

export function projectSpent(p) {
  return (p?.expenses || []).reduce((sum, row) => sum + parseAmt(row.amount), 0);
}

/** ongoing | hold | completed | pending */
export function statusGroup(raw) {
  const s = String(raw || "").toLowerCase().replace(/[\s_-]/g, "");
  if (["completed", "done", "delivered", "closed"].includes(s)) return "completed";
  if (["onhold", "hold", "paused", "suspended"].includes(s)) return "hold";
  if (["pending"].includes(s)) return "pending";
  return "ongoing";
}

export function statusLabel(raw) {
  const g = statusGroup(raw);
  if (g === "completed") return "Completed";
  if (g === "hold") return "On Hold";
  if (g === "pending") return "Pending";
  return "Ongoing";
}

export function formatMoney(amount, currency = "₹") {
  const num = parseAmt(amount);
  return `${currency || "₹"}${num.toLocaleString("en-IN")}`;
}

function fileMeta(file) {
  if (!file) return null;
  if (typeof file === "string") return file ? { url: file, name: "Document" } : null;
  const url = file.url || file.fileUrl || "";
  if (!url) return null;
  return { name: file.name || file.fileName || "Document", url, size: file.size || 0, type: file.type || file.fileType || "" };
}

function matchesProject(doc, project) {
  const pid = String(project?._id || project?.id || "");
  const pname = String(project?.name || "").trim().toLowerCase();
  const docPid = String(doc?.projectId || doc?.project_id || "");
  const docName = String(doc?.project || doc?.qt?.project || doc?.title || "").trim().toLowerCase();
  if (pid && docPid && docPid === pid) return true;
  if (pname && docName && docName === pname) return true;
  return false;
}

export function resolveProjectPdfs(project, { quotations = [], proposals = [], invoices = [] } = {}) {
  const proposalFromCol = (proposals || []).find(d => matchesProject(d, project) && (d.attachedFile?.url || d.attachedFile));
  const quotationFromCol = (quotations || []).find(d => matchesProject(d, project) && (d.attachedFile?.url || d.attachedFile));
  const invoiceFromCol = (invoices || []).find(d => matchesProject(d, project) && (d.attachedFile?.url || d.attachedFile));

  return {
    proposal: fileMeta(project?.proposalPdf) || fileMeta(proposalFromCol?.attachedFile),
    quotation: fileMeta(project?.quotationPdf) || fileMeta(quotationFromCol?.attachedFile),
    invoice: fileMeta(project?.invoicePdf) || fileMeta(invoiceFromCol?.attachedFile),
  };
}

export function commissionAmount(commission, projectVal) {
  const value = parseAmt(commission?.value);
  if ((commission?.type || "percent") === "amount") return value;
  return (projectVal * value) / 100;
}
