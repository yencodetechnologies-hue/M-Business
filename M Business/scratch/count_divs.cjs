const fs = require('fs');

const code = fs.readFileSync('c:/M Business/M Business/src/components/InvoiceCreator.jsx', 'utf8');

let openDivs = 0;
let lines = code.split('\n');
let insideReturn = false;

lines.forEach((line, idx) => {
  if (line.includes('return (') && idx > 1500) {
    insideReturn = true;
    console.log(`Return starts at line ${idx + 1}`);
  }
  if (!insideReturn) return;

  const openMatches = line.match(/<div[ >]/g);
  if (openMatches) {
    openDivs += openMatches.length;
    console.log(`Line ${idx + 1}: +${openMatches.length} -> ${openDivs} (${line.trim().substring(0, 40)})`);
  }

  const closeMatches = line.match(/<\/div>/g);
  if (closeMatches) {
    openDivs -= closeMatches.length;
    console.log(`Line ${idx + 1}: -${closeMatches.length} -> ${openDivs} (${line.trim().substring(0, 40)})`);
  }
});

console.log(`Final remaining open divs: ${openDivs}`);
