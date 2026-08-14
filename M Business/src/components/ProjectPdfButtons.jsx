import React from "react";
import { openPdf } from "../utils/openPdf";
import { resolveProjectPdfs } from "../utils/projectBusiness";

export default function ProjectPdfButtons({
  project,
  quotations = [],
  proposals = [],
  invoices = [],
  size = "md",
}) {
  const pdfs = resolveProjectPdfs(project, { quotations, proposals, invoices });
  const compact = size === "sm";

  const openDoc = (e, file, missingMsg) => {
    e.stopPropagation();
    e.preventDefault();
    if (!file?.url) {
      alert(missingMsg);
      return;
    }
    openPdf(file.url);
  };

  const btn = (key, label, file, missing) => {
    const enabled = !!file?.url;
    return (
      <button
        type="button"
        key={key}
        onClick={(e) => openDoc(e, file, missing)}
        title={enabled ? (file.name || label) : missing}
        style={{
          flex: compact ? "0 0 auto" : 1,
          border: enabled ? "1.5px solid var(--app-accent, #00BCD4)" : "1.5px solid #E2E8F0",
          background: enabled ? "var(--teal-light, #E0F7FA)" : "#F8FAFC",
          color: enabled ? "var(--app-accent, #00BCD4)" : "#94A3B8",
          borderRadius: 8,
          padding: compact ? "5px 8px" : "7px 10px",
          fontSize: compact ? 10 : 11,
          fontWeight: 800,
          cursor: enabled ? "pointer" : "not-allowed",
          fontFamily: "inherit",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          whiteSpace: "nowrap",
        }}
      >
        <i className="ti ti-file-type-pdf" style={{ fontSize: compact ? 12 : 13 }} />
        {label}
      </button>
    );
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ display: "flex", gap: 6, flexWrap: "wrap", width: "100%" }}
    >
      {btn("proposal", "Proposal", pdfs.proposal, "No proposal PDF uploaded for this project.")}
      {btn("quotation", "Quotation", pdfs.quotation, "No quotation PDF uploaded for this project.")}
      {btn("invoice", "Invoice", pdfs.invoice, "No invoice PDF uploaded for this project.")}
    </div>
  );
}
