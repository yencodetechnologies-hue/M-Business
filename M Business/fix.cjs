const fs = require('fs');
const path = 'c:\\M Business\\M Business\\src\\components\\Dashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// The file currently has instances of: `BASE_URL + "
// We want to replace it with: BASE_URL + "
content = content.split('`BASE_URL + "').join('BASE_URL + "');

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed syntax");
