const fs = require('fs');
const path = require('path');
const modelsDir = path.join(__dirname, 'models');
const files = fs.readdirSync(modelsDir);

let changedCount = 0;
files.forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(modelsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if companyId already exists
    if (!content.includes('companyId:')) {
      // Find the last property before timestamps: Schema({ ..., this_prop: X }, {timestamps: true})
      // Often looks like: status: { ... }\n}, { timestamps: true });
      // We will match regex before `}, { timestamps`
      const match = content.match(/([ \t]+)([a-zA-Z0-9_]+):.*\n(?=\}, \{ timestamps: true \}\);)/);
      if (match) {
        content = content.replace(/(?=\}, \{ timestamps: true \}\);)/, '  companyId: { type: String, default: "" }\n');
      } else {
        // Fallback for schemas that might not have timestamps or end differently
        content = content.replace(/(\n)(\}\);?)/, ',\n  companyId: { type: String, default: "" }\n$2');
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      changedCount++;
      console.log('Updated ' + file);
    }
  }
});
console.log('Changed files: ' + changedCount);
