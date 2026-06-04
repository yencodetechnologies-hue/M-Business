const fs = require('fs');
const cp = require('child_process');
const html = cp.execSync('git show "a6a139b:M Business/public/template-designer.html"', {maxBuffer: 10*1024*1024}).toString('utf8');
let open = 0;
html.split('\n').forEach((line, i) => {
  const opens = (line.match(/<div[ >]/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  const prev = open;
  open += opens - closes;
  if (i >= 1490 && i <= 1530) {
    console.log(`${i+1}: prev=${prev} new=${open} | ${line.trim().slice(0, 60)}`);
  }
});
