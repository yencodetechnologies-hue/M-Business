const fs = require('fs');
let html = fs.readFileSync('public/template-designer.html', 'utf8');
let lines = html.split('\n');
lines[1391] = '<!-- REMOVED EXTRA CLOSE FOR CTRL-INV -->';
lines[1643] = '<!-- REMOVED EXTRA CLOSE 2 -->';
lines[1644] = '<!-- REMOVED EXTRA CLOSE 3 -->';

let open = 0;
let stack = [];
lines.forEach((line, i) => {
  const matches = line.match(/<div[^>]*>|<\/div>/g) || [];
  matches.forEach(m => {
    if (m.startsWith('<div')) {
      open++;
      stack.push({ line: i+1, tag: m.slice(0, 35) });
    } else {
      open--;
      stack.pop();
    }
  });
  if (i >= 1630 && i <= 1680) {
    console.log(`${i+1}: depth=${open} | stack=${JSON.stringify(stack.map(s => `${s.line}:${s.tag}`))} | ${line.trim().slice(0, 50)}`);
  }
});
