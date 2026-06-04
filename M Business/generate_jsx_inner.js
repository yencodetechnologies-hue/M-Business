import fs from 'fs';

const html = fs.readFileSync('new_proposals_ui.html', 'utf8');

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
const styleStr = styleMatch ? styleMatch[1] : '';

const startIdx = html.indexOf('<div class="main">');
const endIdx = html.indexOf('<script>');
let bodyHtml = html.substring(startIdx, endIdx);

// Remove the inline style from html, since we'll put it in a <style> block
// Actually, we can keep inline styles in raw HTML

const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
let jsCode = scriptMatch ? scriptMatch[1] : '';

// Make all functions global so inline onclick="" works
jsCode = jsCode.replace(/function (\w+)\(/g, 'window.$1 = function(');

const componentStr = `
import React, { useEffect, useRef } from 'react';

export default function ProposalForm({ onBack, onSave }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Inject global functions
    const script = document.createElement('script');
    script.innerHTML = \`${jsCode.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
    document.body.appendChild(script);

    // Hook up buttons
    const c = containerRef.current;
    if (c) {
      const backBtn = c.querySelector('.back-btn');
      if (backBtn) backBtn.onclick = onBack;

      const actions = c.querySelectorAll('.topbar-actions button');
      actions.forEach(btn => {
        btn.onclick = () => {
          const title = document.getElementById('propTitle')?.value || 'New Proposal';
          const client = document.getElementById('toComp')?.value || '';
          
          let val = 0;
          try {
            const grandTotalStr = document.getElementById('grandTotal')?.textContent || '0';
            val = Number(grandTotalStr.replace(/[^0-9.-]+/g,""));
          } catch(e) {}
          
          onSave({ title, client, value: val });
        };
      });
    }

    // Run initial update
    setTimeout(() => {
      if (window.calcTotal) window.calcTotal();
      if (window.up) window.up();
      if (window.updateMilestonesPreview) window.updateMilestonesPreview();
      if (window.updateTeamPreview) window.updateTeamPreview();
      if (window.updateValuePreview) window.updateValuePreview();
      if (window.updateRisksPreview) window.updateRisksPreview();
    }, 100);

    return () => {
      document.body.removeChild(script);
    };
  }, [onBack, onSave]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "var(--bg)", overflowY: "auto" }}>
      <style>{\`${styleStr.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`}</style>
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: \`${bodyHtml.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\` }} />
    </div>
  );
}
`;

fs.writeFileSync('src/components/ProposalForm.jsx', componentStr);
console.log('Created ProposalForm.jsx using dangerouslySetInnerHTML');
