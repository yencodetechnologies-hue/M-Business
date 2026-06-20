// proposalPrintUtils.js
import { PROPOSAL_PREVIEW_CSS } from "./ProposalPreviewStyles";

const THEMES = [
    { name: "Violet", p: "var(--app-accent)", g: "linear-gradient(135deg,var(--app-accent),var(--app-accent))" },
    { name: "Cobalt", p: "#1d4ed8", g: "linear-gradient(135deg,#1e40af,#3b82f6)" },
    { name: "Emerald", p: "#059669", g: "linear-gradient(135deg,#065f46,#10b981)" },
    { name: "Rose", p: "#e11d48", g: "linear-gradient(135deg,#9f1239,#f43f5e)" },
    { name: "Amber", p: "#d97706", g: "linear-gradient(135deg,#92400e,#fbbf24)" },
    { name: "Slate", p: "#334155", g: "linear-gradient(135deg,#0f172a,#475569)" },
    { name: "Teal", p: "#0d9488", g: "linear-gradient(135deg,#134e4a,#2dd4bf)" },
    { name: "Fuchsia", p: "var(--app-accent)", g: "linear-gradient(135deg,#701a75,#e879f9)" },
];

function getElementsHTML(elements) {
    if (!elements || elements.length === 0) return "";
    return `<div style="position:absolute;inset:0;pointer-events:none;z-index:20;">
    ${elements.map(el => {
        const w = el.w || el.width || "auto";
        const h = el.h || el.height || "auto";
        let content = "";
        if (el.type === "text") {
            content = `<div style="font-size:${el.fontSize}px;font-weight:${el.fontWeight};color:${el.color || "#000"};white-space:pre-wrap;width:${w}px;">${el.val || ""}</div>`;
        } else if (el.type === "shape") {
            const br = el.borderRadius !== undefined ? el.borderRadius + "px" : (el.shape === "circle" ? "50%" : "8px");
            content = `<div style="width:${w === "auto" ? 100 : w}px;height:${h === "auto" ? 100 : h}px;background:${el.color || "#00BCD4"};border-radius:${br};"></div>`;
        } else if (el.type === "image") {
            content = `<img src="${el.src}" style="width:${w === "auto" ? 200 : w}px;height:${h};object-fit:contain;" />`;
        } else if (el.type === "icon") {
            content = `<div style="font-size:${el.fontSize || 40}px;">${el.icon}</div>`;
        }
        return `<div style="position:absolute;left:${el.x}px;top:${el.y}px;width:${w}px;height:${h}px;">${content}</div>`;
    }).join("")}
  </div>`;
}

export function buildProposalHTML(proposal) {
    const t = THEMES.find(x => x.name === proposal.theme) || THEMES[0];
    let body = "";

    if (proposal.html) {
        body = `<style>${PROPOSAL_PREVIEW_CSS}</style>
             <div class="prop-doc" style="max-height:none;overflow:visible;">${proposal.html}</div>`;
    } else if (proposal.slides && proposal.slides.length > 0) {
        body = proposal.slides.map(slide => {
            const elHTML = getElementsHTML(slide.elements);

            if (slide.type === "cover") {
                return `<div style="page-break-after:always;width:210mm;min-height:297mm;display:flex;flex-direction:column;justify-content:flex-end;position:relative;overflow:hidden;">
          <img src="${slide.coverImage || ""}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2;" />
          <div style="position:absolute;inset:0;background:linear-gradient(150deg,${t.p}dd 0%,rgba(0,0,0,0.85) 60%,rgba(0,0,0,0.5) 100%);z-index:-1;"></div>
          <div style="position:relative;padding:48px 56px;">
            <h1 style="font-size:48px;font-weight:900;color:#fff;margin-bottom:16px;line-height:1.05;">${slide.title || ""}</h1>
            <p style="font-size:16px;color:rgba(255,255,255,0.7);">${slide.subtitle || ""}</p>
          </div>
          ${elHTML}
        </div>`;
            }

            if (slide.type === "overview" || slide.type === "closing") {
                return `<div style="page-break-after:always;width:210mm;min-height:297mm;padding:56px;display:flex;flex-direction:column;justify-content:center;position:relative;background:#fff;">
          <div style="width:56px;height:6px;background:${t.g};border-radius:3px;margin-bottom:20px;"></div>
          <h1 style="font-size:36px;font-weight:800;color:#0f172a;margin-bottom:24px;">${slide.heading || ""}</h1>
          <p style="font-size:15px;color:#4b5563;line-height:1.9;white-space:pre-wrap;">${slide.body || ""}</p>
          ${slide.cta ? `<div style="margin-top:32px;display:inline-block;background:${t.g};color:#fff;border-radius:14px;padding:15px 36px;font-size:16px;font-weight:700;">${slide.cta}</div>` : ""}
          ${elHTML}
        </div>`;
            }

            if (slide.type === "objectives") {
                return `<div style="page-break-after:always;width:210mm;min-height:297mm;padding:56px;background:#fff;position:relative;">
          <div style="width:56px;height:6px;background:${t.g};border-radius:3px;margin-bottom:20px;"></div>
          <h1 style="font-size:36px;font-weight:800;color:#0f172a;margin-bottom:24px;">${slide.heading || ""}</h1>
          ${(slide.items || []).map((item, i) => `
            <div style="display:flex;gap:18px;align-items:flex-start;padding:16px 22px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;margin-bottom:10px;">
              <div style="width:36px;height:36px;border-radius:50%;background:${t.g};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:15px;flex-shrink:0;">${i + 1}</div>
              <div style="font-size:14px;color:#1e293b;font-weight:600;padding-top:6px;">${item}</div>
            </div>`).join("")}
          ${elHTML}
        </div>`;
            }

            if (slide.type === "timeline") {
                return `<div style="page-break-after:always;width:210mm;min-height:297mm;padding:56px;background:#fff;position:relative;">
          <div style="width:56px;height:6px;background:${t.g};border-radius:3px;margin-bottom:20px;"></div>
          <h1 style="font-size:36px;font-weight:800;color:#0f172a;margin-bottom:24px;">${slide.heading || ""}</h1>
          <div style="display:flex;gap:16px;flex-wrap:wrap;">
            ${(slide.phases || []).map((ph, i) => `
              <div style="flex:1 1 150px;padding:16px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;text-align:center;">
                <div style="width:36px;height:36px;border-radius:50%;background:${t.g};color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;">${i + 1}</div>
                <div style="font-size:13px;font-weight:800;color:#0f172a;">${ph.label}</div>
                <div style="display:inline-block;background:${t.g};color:#fff;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700;margin-top:6px;">${ph.dur}</div>
              </div>`).join("")}
          </div>
          ${elHTML}
        </div>`;
            }

            if (slide.type === "budget") {
                return `<div style="page-break-after:always;width:210mm;min-height:297mm;padding:56px;background:#fff;position:relative;">
          <div style="width:56px;height:6px;background:${t.g};border-radius:3px;margin-bottom:20px;"></div>
          <h1 style="font-size:36px;font-weight:800;color:#0f172a;margin-bottom:24px;">${slide.heading || ""}</h1>
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="background:${t.g};">
              <th style="padding:13px 22px;text-align:left;color:#fff;font-size:13px;border-radius:10px 0 0 10px;">Item</th>
              <th style="padding:13px 22px;text-align:right;color:#fff;font-size:13px;border-radius:0 10px 10px 0;">Cost</th>
            </tr></thead>
            <tbody>
              ${(slide.rows || []).map((r, i) => `
                <tr style="border-bottom:1px solid #e2e8f0;background:${i % 2 ? "#f8fafc" : "#fff"};">
                  <td style="padding:12px 22px;font-size:14px;color:#374151;">${r.item}</td>
                  <td style="padding:12px 22px;text-align:right;font-size:14px;font-weight:700;color:#1e293b;">${r.cost}</td>
                </tr>`).join("")}
            </tbody>
          </table>
          <div style="display:flex;justify-content:flex-end;margin-top:16px;padding:16px 22px;background:${t.g};border-radius:12px;">
            <span style="color:#fff;font-weight:900;font-size:20px;">Total: ${slide.total || ""}</span>
          </div>
          ${elHTML}
        </div>`;
            }

            if (slide.type === "team") {
                return `<div style="page-break-after:always;width:210mm;min-height:297mm;padding:56px;background:#fff;position:relative;">
          <div style="width:56px;height:6px;background:${t.g};border-radius:3px;margin-bottom:20px;"></div>
          <h1 style="font-size:36px;font-weight:800;color:#0f172a;margin-bottom:24px;">${slide.heading || ""}</h1>
          <div style="display:flex;gap:18px;flex-wrap:wrap;">
            ${(slide.members || []).map(m => `
              <div style="flex:1 1 170px;padding:24px 18px;background:#f8fafc;border-radius:16px;border:1px solid #e2e8f0;text-align:center;">
                <div style="width:56px;height:56px;border-radius:50%;background:${t.g};margin:0 auto 14px;display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;font-weight:900;">${m.avatar || (m.name || "?")[0]}</div>
                <div style="font-size:14px;font-weight:800;color:#0f172a;">${m.name}</div>
                <div style="font-size:12px;color:${t.p};font-weight:600;">${m.role}</div>
              </div>`).join("")}
          </div>
          ${elHTML}
        </div>`;
            }

            if (slide.type === "blank_first_page" || slide.type === "proposal" || slide.type === "portrait") {
                return `<div style="page-break-after:always;min-height:297mm;padding:40px 60px;background:#fff;position:relative;">
          ${elHTML}
        </div>`;
            }

            if (slide.type === "proposal_page2") {
                return `<div style="page-break-after:always;min-height:297mm;padding:40px 60px;background:#fff;font-size:14px;line-height:1.5;color:#000;position:relative;">
          <div style="margin-bottom:20px;">
            <div style="font-weight:bold;text-decoration:underline;margin-bottom:8px;">3.0 SITE VISITS:</div>
            ${(slide.siteVisits || []).map(i => `<div style="margin-left:20px;margin-bottom:4px;">• ${i}</div>`).join("")}
          </div>
          <div style="margin-bottom:20px;">
            <div style="font-weight:bold;text-decoration:underline;margin-bottom:8px;">5.0 FEE STRUCTURE:</div>
            ${(slide.feeStructure || []).map(i => `<div style="margin-left:20px;margin-bottom:4px;">• ${i}</div>`).join("")}
          </div>
          <div style="margin-bottom:40px;">
            <div style="font-weight:bold;text-decoration:underline;margin-bottom:8px;">6.0 STAGES OF PAYMENT:</div>
            ${(slide.stagesOfPayment || []).map(i => `<div style="margin-left:20px;margin-bottom:4px;">• ${i}</div>`).join("")}
          </div>
          <div style="margin-top:60px;display:flex;justify-content:space-between;">
            <div style="font-weight:bold;">
              <div>For ${slide.companyName || ""}</div>
              <div style="margin-top:40px;">(Authorised Signatory)</div>
            </div>
            <div style="font-weight:bold;text-align:center;">
              <div style="margin-top:40px;">(Client Signature)</div>
            </div>
          </div>
          ${elHTML}
        </div>`;
            }

            // Default slide
            return `<div style="page-break-after:always;min-height:297mm;padding:56px;background:#fff;position:relative;">
        ${slide.heading ? `<div style="width:56px;height:6px;background:${t.g};border-radius:3px;margin-bottom:20px;"></div>
        <h1 style="font-size:36px;font-weight:800;color:#0f172a;margin-bottom:24px;">${slide.heading}</h1>` : ""}
        <p style="font-size:15px;color:#4b5563;line-height:1.9;white-space:pre-wrap;">${slide.body || ""}</p>
        ${elHTML}
      </div>`;
        }).join("");
    } else {
        body = `<div style="padding:56px;text-align:center;color:#666;">This proposal has no content.</div>`;
    }

    // ── Signature section (always appended) ----------------------
    const sigSection = `
  <div style="page-break-before:auto;padding:40px 56px;background:#fff;font-family:'Segoe UI',sans-serif;">
    <div style="border-top:2px solid #00BCD4;padding-top:28px;">
      <div style="font-size:11px;font-weight:700;color:#96B0B8;text-transform:uppercase;letter-spacing:1px;margin-bottom:20px;">Sign-off & Acceptance</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">

        <!-- Subadmin / Company side -->
        <div style="padding:20px;background:#F8FAFB;border-radius:12px;border:1px solid #E0EEF0;text-align:center;">
          <div style="font-size:10px;font-weight:700;color:#96B0B8;text-transform:uppercase;letter-spacing:.6px;margin-bottom:16px;">Authorised Signatory</div>
          <div style="height:60px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;">
            <div style="width:1px;"></div>
          </div>
          <div style="height:1px;background:#C5DDE0;margin-bottom:8px;"></div>
          <div style="font-size:12px;font-weight:700;color:#0D2027;">Company Representative</div>
          <div style="font-size:10px;color:#96B0B8;margin-top:2px;">Signature &amp; Date</div>
        </div>

        <!-- Client signature side -->
        <div style="padding:20px;background:${proposal.clientSignature ? "#F0FDF4" : "#FFFBEB"};border-radius:12px;border:${proposal.clientSignature ? "1.5px solid #86efac" : "1.5px dashed #FCD34D"};text-align:center;">
          <div style="font-size:10px;font-weight:700;color:#96B0B8;text-transform:uppercase;letter-spacing:.6px;margin-bottom:16px;">Client Acceptance</div>
          ${proposal.clientSignature ? `
            <div style="height:60px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;">
              ${proposal.clientSignature.startsWith("data:image")
                ? `<img src="${proposal.clientSignature}" style="max-height:56px;max-width:100%;object-fit:contain;" />`
                : `<span style="font-family:'Georgia',serif;font-size:28px;color:#0D2027;font-style:italic;">${proposal.clientSignature}</span>`}
            </div>
            <div style="height:1px;background:#15803D;margin-bottom:8px;"></div>
            <div style="font-size:12px;font-weight:700;color:#0D2027;">${proposal.clientName || proposal.client || "Client"}</div>
            <div style="font-size:10px;color:#15803D;font-weight:700;margin-top:2px;">Digitally Signed${proposal.clientSignedAt ? " · " + new Date(proposal.clientSignedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}</div>
          ` : `
            <div style="height:60px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;">
              <span style="font-size:28px;color:#FCD34D;">Sign</span>
            </div>
            <div style="height:1px;background:#FCD34D;margin-bottom:8px;"></div>
            <div style="font-size:12px;font-weight:700;color:#92400E;">${proposal.clientName || proposal.client || "Client"}</div>
            <div style="font-size:10px;color:#D97706;font-weight:700;margin-top:2px;">Awaiting Signature</div>
          `}
        </div>
      </div>
    </div>
  </div>`;

    body += sigSection;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${proposal.title || "Proposal"}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#fff; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; }
    @page { size:A4; margin:0; }
    @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
    ${PROPOSAL_PREVIEW_CSS}
  </style>
</head>
<body>${body}</body>
</html>`;
}

export function printProposal(proposal) {
    const html = buildProposalHTML(proposal);
    const win = window.open("", "_blank");
    if (!win) { alert("Please allow popups to print."); return; }
    win.document.write(html + `<script>window.onload=()=>{setTimeout(()=>{window.print();window.onafterprint=()=>window.close();},500);}<\/script>`);
    win.document.close();
}

export async function shareProposalAsPDF(proposal, companyName, onStatusUpdate) {
    // Mark as sent first
    if (onStatusUpdate) await onStatusUpdate(proposal);

    const html = buildProposalHTML(proposal);
    const blob = new Blob([html], { type: "text/html" });
    const fileName = `${(proposal.title || "Proposal").replace(/\s+/g, "_")}.html`;

    // Try Web Share API with file
    if (navigator.canShare) {
        const file = new File([blob], fileName, { type: "text/html" });
        if (navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({ title: proposal.title, files: [file] });
                return;
            } catch (e) { /* fall through */ }
        }
    }

    // Fallback: open in new tab so user can print-to-PDF / share link
    const url = URL.createObjectURL(blob);
    const link = `${window.location.origin}/proposal-view?id=${proposal._id || proposal.id}`;
    const shareText = `${proposal.title}\nPrepared by ${companyName || "Us"}\nView: ${link}`;

    if (navigator.share) {
        try { await navigator.share({ title: proposal.title, text: shareText, url: link }); return; } catch (e) { /* fall through */ }
    }

    // Last resort: open the rendered HTML in a new tab
    window.open(url, "_blank");
    navigator.clipboard.writeText(shareText).catch(() => { });
    alert("Export Proposal opened in a new tab — you can print it as PDF or share the link:\n\n" + link);
}