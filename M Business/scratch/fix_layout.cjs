const fs = require('fs');
let html = fs.readFileSync('public/template-designer.html', 'utf8');
let lines = html.split('\n');

// Remove lines 1294 to 1639 (0-indexed: 1293 to 1638)
// These are: old Payment Terms card UI (1295-1362), old Notes & Signature card (1365-1390),
// line 1392 extra </div> closing ctrl-inv early, preview-side (1394-1516), old script (1518-1639)
// After removal, lines 1640 onwards (Discount grid, Payment acc-item, etc.) follow directly from 1293
const removed = lines.splice(1293, 1639 - 1293);
console.log(`Removed ${removed.length} lines`);
console.log('First 5 removed:', removed.slice(0, 5).map(l => l.trim().slice(0, 60)));
console.log('Last 5 removed:', removed.slice(-5).map(l => l.trim().slice(0, 60)));

// Verify balance after removal
let open = 0;
let errors = [];
lines.forEach((line, i) => {
  const opens = (line.match(/<div[ >]/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  open += opens - closes;
  if (open < 0) {
    errors.push(`Line ${i+1}: depth=${open} | ${line.trim().slice(0,60)}`);
    open = 0;
  }
});
console.log('\nErrors after removal:', errors.length > 0 ? errors : 'NONE');
console.log('Final open count:', open);

// Write the file
fs.writeFileSync('public/template-designer.html', lines.join('\n'), 'utf8');
console.log('File written successfully!');
