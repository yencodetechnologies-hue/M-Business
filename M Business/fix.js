const fs = require('fs');

try {
  let content = fs.readFileSync('src/components/InvoiceCreator.jsx', 'utf-8');

  // 1. Pagination logic
  const paginationStart = `        {/* Pagination Logic */}
        {(() => {
          const ITEMS_PER_PAGE_FIRST = 10;
          const ITEMS_PER_PAGE_REST = 16;
          const pages = [];
          if (items.length <= ITEMS_PER_PAGE_FIRST) {
            pages.push(items);
          } else {
            pages.push(items.slice(0, ITEMS_PER_PAGE_FIRST));
            let remaining = items.slice(ITEMS_PER_PAGE_FIRST);
            while (remaining.length > 0) {
              pages.push(remaining.slice(0, ITEMS_PER_PAGE_REST));
              remaining = remaining.slice(ITEMS_PER_PAGE_REST);
            }
          }

          return (
            <div className="print-wrapper" style={{ display: "flex", flexDirection: "column", gap: "40px", alignItems: "center", width: "100%" }}>
              {pages.map((pageItems, pageIndex) => {
                const isFirstPage = pageIndex === 0;
                const isLastPage = pageIndex === pages.length - 1;
                const globalItemOffset = isFirstPage ? 0 : ITEMS_PER_PAGE_FIRST + ((pageIndex - 1) * ITEMS_PER_PAGE_REST);

                return (
                  <div key={pageIndex} className="invoice-paper print-container" style={{ position: "relative", maxWidth: 794, margin: "0 auto", background: "#fff", borderRadius: 18, boxShadow: "0 24px 80px rgba(var(--app-accent-rgb, 124, 58, 237), 0.25)", display: "flex", flexDirection: "column", minHeight: 1122, width: "100%" }}>`;

  content = content.replace('<div className="invoice-paper print-container">', paginationStart);

  content = content.replace(
    '<div className="avoid-break" style={{ background: "#f8fafc", padding: "28px 32px"',
    '{isFirstPage && (<div className="avoid-break" style={{ background: "#f8fafc", padding: "28px 32px"'
  );

  content = content.replace(
    '</div>\n            </div>\n          </div>\n\n          {/* Bill To */}',
    '</div>\n            </div>\n          </div>)}\n\n          {/* Bill To */}'
  );
  content = content.replace(
    '</div>\r\n            </div>\r\n          </div>\r\n\r\n          {/* Bill To */}',
    '</div>\r\n            </div>\r\n          </div>)}\r\n\r\n          {/* Bill To */}'
  );

  content = content.replace(
    '<div className="inv-btgrid avoid-break" style={{ display: "grid",',
    '{isFirstPage && (<div className="inv-btgrid avoid-break" style={{ display: "grid",'
  );

  content = content.replace(
    '</div>\n          </div>\n\n          {/* Items */}',
    '</div>\n          </div>)}\n\n          {/* Items */}'
  );
  content = content.replace(
    '</div>\r\n          </div>\r\n\r\n          {/* Items */}',
    '</div>\r\n          </div>)}\r\n\r\n          {/* Items */}'
  );

  content = content.replace('items.map((item, idx) => {', 'pageItems.map((item, idx) => {');
  content = content.replace('String(idx + 1).padStart(2', 'String(globalItemOffset + idx + 1).padStart(2');

  content = content.replace(
    '{/* Totals with QR Scanner */}',
    '{isLastPage && (<>\n          {/* Totals with QR Scanner */}'
  );
  content = content.replace(
    '{/* Footer message */}',
    '</>)}\n          {/* Footer message */}'
  );

  const closingTags = `</div>
                );
              })}
            </div>
          );
        })()}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // FORM (Create / Edit)`;

  content = content.replace(
    '</div>\n        </div>\n      </div>\n    );\n  }\n\n  // ════════════════════════════════════════════════════════════\n  // FORM (Create / Edit)',
    closingTags
  );
  content = content.replace(
    '</div>\r\n        </div>\r\n      </div>\r\n    );\r\n  }\r\n\r\n  // ════════════════════════════════════════════════════════════\r\n  // FORM (Create / Edit)',
    closingTags.replace(/\\n/g, '\\r\\n')
  );

  // Now fix JS slicing for WA
  const oldHtml2Canvas = `      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
        width: elemW,
        height: elemH,
        windowWidth: elemW,
        windowHeight: elemH,
        scrollX: 0,
        scrollY: -window.scrollY,
        onclone: (doc) => {
          const el = doc.querySelector('.invoice-paper');
          if (el) {
            resolveCssVars(el);
            el.style.width = elemW + 'px';
            el.style.maxWidth = 'none';
            el.style.overflow = 'visible';
            el.style.borderRadius = '0';
            el.style.boxShadow = 'none';
          }
        }
      });

      const A4_W = 210;
      const A4_H = 297;
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });

      const imgAspect = canvas.width / canvas.height;
      const finalW = A4_W;
      const finalH = A4_W / imgAspect;

      const imgData = canvas.toDataURL('image/jpeg', 0.98);

      let heightLeft = finalH;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, finalW, finalH);
      heightLeft -= A4_H;

      while (heightLeft > 0) {
        position = heightLeft - finalH;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, finalW, finalH);
        heightLeft -= A4_H;
      }`;

  const newHtml2Canvas = `      const pagesElements = document.querySelectorAll(".invoice-paper");
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
      const A4_W = 210;
      const A4_H = 297;

      for (let i = 0; i < pagesElements.length; i++) {
        const el = pagesElements[i];
        if (i > 0) pdf.addPage();
        
        const elemH = el.scrollHeight;
        const elemW = el.scrollWidth;

        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          width: elemW,
          height: elemH,
          windowWidth: elemW,
          windowHeight: elemH,
          scrollX: 0,
          scrollY: -window.scrollY,
          onclone: (doc) => {
            const clonedEl = doc.querySelectorAll('.invoice-paper')[i];
            if (clonedEl) {
              resolveCssVars(clonedEl);
              clonedEl.style.width = elemW + 'px';
              clonedEl.style.maxWidth = 'none';
              clonedEl.style.overflow = 'visible';
              clonedEl.style.borderRadius = '0';
              clonedEl.style.boxShadow = 'none';
            }
          }
        });

        const imgAspect = canvas.width / canvas.height;
        let finalW = A4_W;
        let finalH = A4_W / imgAspect;

        if (finalH > A4_H) {
          finalH = A4_H;
          finalW = A4_H * imgAspect;
        }

        const xOff = (A4_W - finalW) / 2;
        const yOff = (A4_H - finalH) / 2;

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgData, 'JPEG', xOff, yOff, finalW, finalH);
      }`;

  content = content.replace(oldHtml2Canvas, newHtml2Canvas);

  fs.writeFileSync('src/components/InvoiceCreator.jsx', content);
  console.log("Success");
} catch(e) {
  console.error(e);
}
