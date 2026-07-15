const fs = require('fs');

let html = fs.readFileSync('new_proposals_ui.html', 'utf8');

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
const styleStr = styleMatch ? styleMatch[1] : '';

const mainMatch = html.match(/<div class="main">([\s\S]*?)<\/div>\s*<script>/);
let jsx = mainMatch ? mainMatch[1] : '';

// Quick JSX conversions
jsx = jsx.replace(/class=/g, 'className=');
jsx = jsx.replace(/onclick="[^"]*"/g, 'onClick={() => { sessionStorage.setItem('selectedProjectId', p._id); setSelectedProject(p); }}');
jsx = jsx.replace(/oninput="[^"]*"/g, 'onChange={() => {}}');
jsx = jsx.replace(/onchange="[^"]*"/g, 'onChange={() => {}}');
jsx = jsx.replace(/<!--(.*?)-->/g, '{/* $1 */}');
jsx = jsx.replace(/<input([^>]*?)>/g, '<input$1 />');
jsx = jsx.replace(/<br>/g, '<br />');
jsx = jsx.replace(/<hr>/g, '<hr />');
jsx = jsx.replace(/<img([^>]*?)>/g, '<img$1 />');

// simple style attribute replacement
jsx = jsx.replace(/style="([^"]*)"/g, (match, p1) => {
  try {
    const css = p1.split(';').filter(s => s.trim()).reduce((acc, rule) => {
      let [key, ...valParts] = rule.split(':');
      let val = valParts.join(':');
      if (!key || !val) return acc;
      key = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
      val = val.trim();
      acc[key] = isNaN(Number(val)) ? val : Number(val);
      return acc;
    }, {});
    return 'style={' + JSON.stringify(css) + '}';
  } catch (e) {
    return 'style={{}}';
  }
});

const componentStr = `
import React, { useState } from 'react';

export default function ProposalForm({ onBack, onSave }) {
  return (
    <div className="main">
      <style>{\`${styleStr}\`}</style>
      ${jsx}
    </div>
  );
}
`;

fs.writeFileSync('src/components/ProposalForm.jsx', componentStr);
console.log('Created ProposalForm.jsx');
