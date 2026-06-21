const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

let changedFiles = 0;

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  const regex = /<div\s+style=\{\{\s*position:\s*["']relative["']\s*\}\}\s*>\s*<div\s+onClick=\{.*setOpen/g;
  
  if (regex.test(content)) {
    let newContent = content.replace(
      /(<div\s+style=\{\{\s*position:\s*["']relative["'])\s*(\}\}\s*>)\s*(<div\s+onClick=\{.*setOpen)/g,
      '$1, zIndex: open ? 1000 : 1 $2\n      $3'
    );
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated ${file}`);
      changedFiles++;
    }
  }
});

console.log(`Fixed dropdown z-index in ${changedFiles} files.`);
