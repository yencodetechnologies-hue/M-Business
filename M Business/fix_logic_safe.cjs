const fs = require('fs');
let code = fs.readFileSync('src/components/ProposalFormLogic.js', 'utf8');

code = `
export const safeVal = (id) => {
  const el = document.getElementById(id);
  return el ? el.value : '';
};

export const safeText = (id, txt) => {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
};

export const safeHtml = (id, html) => {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
};

export const safeColor = (id, col) => {
  const el = document.getElementById(id);
  if (el) el.style.color = col;
};

` + code;

code = code.replace(/document\.getElementById\((['"][a-zA-Z0-9_-]+['"])\)\.value/g, 'safeVal($1)');
code = code.replace(/document\.getElementById\((['"][a-zA-Z0-9_-]+['"])\)\.textContent\s*=\s*([^;]+);/g, 'safeText($1, $2);');
code = code.replace(/document\.getElementById\((['"][a-zA-Z0-9_-]+['"])\)\.innerHTML\s*=\s*([^;]+);/g, 'safeHtml($1, $2);');
code = code.replace(/document\.getElementById\((['"][a-zA-Z0-9_-]+['"])\)\.style\.color\s*=\s*([^;]+);/g, 'safeColor($1, $2);');

fs.writeFileSync('src/components/ProposalFormLogic.js', code);
console.log('Fixed ProposalFormLogic.js safely!');
