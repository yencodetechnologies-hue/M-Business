const fs = require('fs');
const html = fs.readFileSync('public/template-designer.html', 'utf8');
let open = 0;
html.split('\n').forEach((line, i) => {
  const opens = (line.match(/<div[ >]/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  const prev = open;
  open += opens - closes;
  if (i >= 1100 && i <= 1130) {
    console.log(`${i+1}: prev=${prev} new=${open} | ${line.trim().slice(0, 60)}`);
  }
});
