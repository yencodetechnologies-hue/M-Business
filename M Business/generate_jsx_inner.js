import fs from 'fs';

const html = fs.readFileSync('new_proposals_ui.html', 'utf8');

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
const styleStr = styleMatch ? styleMatch[1] : '';

const startIdx = html.indexOf('<div class="main">');
const endIdx = html.indexOf('<script>');
let bodyHtml = html.substring(startIdx, endIdx);

// Remove pre-filled values so it's not "dynamic" dummy data
bodyHtml = bodyHtml.replace(/value="YENCODE Technologies"/g, '');
bodyHtml = bodyHtml.replace(/value="Prabhu R"/g, '');
bodyHtml = bodyHtml.replace(/value="YDMart Group"/g, '');
bodyHtml = bodyHtml.replace(/value="E-Commerce \/ Retail"/g, '');
bodyHtml = bodyHtml.replace(/value="YDMart E-Commerce App"/g, '');
bodyHtml = bodyHtml.replace(/value="Rajan M, CEO - NexCorp"/g, '');

const componentStr = `
import React, { useEffect, useRef } from 'react';
import * as logic from './ProposalFormLogic';

export default function ProposalForm({ onBack, onSave }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;

    // We no longer inject scripts! We use the imported logic module!

    const handleClick = (e) => {
      const btn = e.target.closest('[onclick]');
      if (btn) {
        const code = btn.getAttribute('onclick');
        const funcMatch = code.match(/^([a-zA-Z0-9_]+)\\(/);
        if (funcMatch) {
          const funcName = funcMatch[1];
          if (typeof logic[funcName] === 'function') {
            try {
              if (code.includes('this')) {
                logic[funcName](btn);
              } else {
                logic[funcName]();
              }
            } catch(err) {
              console.error('Click error:', err);
            }
          }
        }
      }
    };

    const handleInput = (e) => {
      // Always update preview on any input in the form
      try {
        if (logic.up) logic.up();
        if (logic.calcTotal) logic.calcTotal();
      } catch (err) {
        console.error('Input error:', err);
      }
    };

    c.addEventListener('click', handleClick);
    c.addEventListener('input', handleInput);

    // Hook up topbar buttons explicitly
    const backBtn = c.querySelector('.back-btn');
    if (backBtn) backBtn.onclick = onBack;

    const actions = c.querySelectorAll('.topbar-actions button');
    actions.forEach((btn, idx) => {
      if (idx === 0) return; // Skip Duplicate
      btn.onclick = () => {
        const title = document.getElementById('propTitle')?.value || 'New Proposal';
        const client = document.getElementById('toComp')?.value || '';
        
        let val = 0;
        try {
          const grandTotalStr = document.getElementById('grandTotal')?.textContent || '0';
          val = Number(grandTotalStr.replace(/[^0-9.-]+/g,""));
        } catch(err) {}
        
        onSave({ title, client, value: val });
      };
    });

    // Initial Render Update
    setTimeout(() => {
      try {
        if (logic.calcTotal) logic.calcTotal();
        if (logic.up) logic.up();
        if (logic.updateMilestonesPreview) logic.updateMilestonesPreview();
        if (logic.updateTeamPreview) logic.updateTeamPreview();
        if (logic.updateValuePreview) logic.updateValuePreview();
        if (logic.updateRisksPreview) logic.updateRisksPreview();
      } catch(e) { console.error('Init error', e); }
    }, 300);

    return () => {
      c.removeEventListener('click', handleClick);
      c.removeEventListener('input', handleInput);
    };
  }, [onBack, onSave]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "var(--bg)", overflowY: "auto" }}>
      <style>{\`${styleStr.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`}</style>
      <div 
        ref={containerRef} 
        dangerouslySetInnerHTML={{ __html: \`${bodyHtml.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\` }} 
      />
    </div>
  );
}
`;

fs.writeFileSync('src/components/ProposalForm.jsx', componentStr);
console.log('Regenerated ProposalForm.jsx with imported logic module');
