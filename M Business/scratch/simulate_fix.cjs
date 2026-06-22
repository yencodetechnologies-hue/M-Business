const fs = require('fs');
let html = fs.readFileSync('public/template-designer.html', 'utf8');
let lines = html.split('\n');

// We want to test removing:
// - line 1392: </div>
// - line 1644: </div>
// - line 1645: </div>

lines[1391] = '<!-- REMOVED EXTRA CloseFOR CTRL-INV -->';
lines[1643] = '<!-- REMOVED EXTRA Close2 -->';
lines[1644] = '<!-- REMOVED EXTRA Close3 -->';

const content = lines.join('\n');
let open = 0;
let errors = [];
lines.forEach((line, i) => {
  const opens = (line.match(/<div[ >]/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  open += opens - closes;
  if (open < 0) {
    errors.push(`Line ${i + 1}: negative depth (${open}) | ${line.trim()}`);
    open = 0;
  }
});

console.log('Errors:', errors);
console.log('Final open count:', open);
