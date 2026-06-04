const fs = require('fs');
const html = fs.readFileSync('public/template-designer.html', 'utf8');
let open = 0;
let stack = [];
html.split('\n').forEach((line, i) => {
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
  if (i >= 1220 && i <= 1395) {
    console.log(`${i+1}: depth=${open} | stack=${JSON.stringify(stack.map(s => `${s.line}:${s.tag}`))} | ${line.trim().slice(0, 50)}`);
  }
});
