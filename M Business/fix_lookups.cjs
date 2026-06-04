const fs = require('fs');
let code = fs.readFileSync('src/components/ProposalFormLogic.js', 'utf8');

// Replace all `document.getElementById(id).value` with a safe check
code = code.replace(/document\.getElementById\(([^)]+)\)\.value/g, "((document.getElementById($1) || {}).value || '')");

fs.writeFileSync('src/components/ProposalFormLogic.js', code);
console.log('Successfully made value lookups safe!');
