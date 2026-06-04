import fs from 'fs';
const html = fs.readFileSync('new_proposals_ui.html', 'utf8');

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
const styleStr = styleMatch ? styleMatch[1] : '';

const startIdx = html.indexOf('<div class="main">');
const endIdx = html.indexOf('<script>');
let bodyHtml = html.substring(startIdx, endIdx);

const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
let jsCode = scriptMatch ? scriptMatch[1] : '';

// Make let/const into var so it can be re-declared safely
jsCode = jsCode.replace(/\bconst\b/g, 'var');
jsCode = jsCode.replace(/\blet\b/g, 'var');

// Export functions to window
jsCode = jsCode.replace(/function (\w+)\(/g, 'window.$1 = function(');

const componentStr = `
import React, { useEffect, useRef } from 'react';

export default function ProposalForm({ onBack, onSave }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // 1. Inject global functions safely
    const script = document.createElement('script');
    script.innerHTML = \`
      ${jsCode.replace(/`/g, '\\`').replace(/\$/g, '\\$')}
    \`;
    script.id = 'proposal-form-logic';
    
    if (!document.getElementById('proposal-form-logic')) {
      document.body.appendChild(script);
    }

    // 2. Event Delegation for ALL inputs and clicks
    const c = containerRef.current;
    if (c) {
      // Handle all clicks safely
      const handleClick = (e) => {
        const btn = e.target.closest('[onclick]');
        if (btn) {
          const code = btn.getAttribute('onclick');
          try {
            // Using new Function to evaluate the string in global scope
            new Function('event', code).call(btn, e);
          } catch(err) {
            console.error('Click error:', err);
          }
        }
      };

      // Handle all inputs safely
      const handleInput = (e) => {
        const el = e.target.closest('[oninput]');
        if (el) {
          const code = el.getAttribute('oninput');
          try {
            new Function('event', code).call(el, e);
          } catch(err) {
            console.error('Input error:', err);
          }
        }
        // Fallback: Always try to update preview on any input just in case!
        if (window.up) window.up();
        if (window.calcTotal) window.calcTotal();
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

      // 3. Initial Render Update
      setTimeout(() => {
        try {
          if (window.calcTotal) window.calcTotal();
          if (window.up) window.up();
          if (window.updateMilestonesPreview) window.updateMilestonesPreview();
          if (window.updateTeamPreview) window.updateTeamPreview();
          if (window.updateValuePreview) window.updateValuePreview();
          if (window.updateRisksPreview) window.updateRisksPreview();
        } catch(e) {}
      }, 300);

      return () => {
        c.removeEventListener('click', handleClick);
        c.removeEventListener('input', handleInput);
      };
    }
  }, [onBack, onSave]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "var(--bg)", overflowY: "auto" }}>
      <style>{\`${styleStr.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`}</style>
      <div 
        ref={containerRef} 
        onInput={() => {
          if (window.up) window.up();
          if (window.calcTotal) window.calcTotal();
        }}
        dangerouslySetInnerHTML={{ __html: \`${bodyHtml.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\` }} 
      />
    </div>
  );
}
`;

fs.writeFileSync('src/components/ProposalForm.jsx', componentStr);
console.log('Regenerated ProposalForm.jsx with robust event delegation');
