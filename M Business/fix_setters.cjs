const fs = require('fs');
let code = fs.readFileSync('src/components/ProposalFormLogic.js', 'utf8');

// Replace all `document.getElementById('something').textContent = ...` with safe assignment
code = code.replace(/document\.getElementById\(([^)]+)\)\.textContent\s*=\s*([^;]+);/g, 
  "(() => { const el = document.getElementById($1); if(el) el.textContent = $2; })();");

// Same for innerHTML
code = code.replace(/document\.getElementById\(([^)]+)\)\.innerHTML\s*=\s*([^;]+);/g, 
  "(() => { const el = document.getElementById($1); if(el) el.innerHTML = $2; })();");

// Same for style
code = code.replace(/document\.getElementById\(([^)]+)\)\.style\.([a-zA-Z]+)\s*=\s*([^;]+);/g, 
  "(() => { const el = document.getElementById($1); if(el) el.style.$2 = $3; })();");

fs.writeFileSync('src/components/ProposalFormLogic.js', code);
console.log('Successfully made all setters safe!');
