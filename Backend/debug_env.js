
const fs = require('fs');
const content = fs.readFileSync('c:\\M Business\\Backend\\.env');
console.log('Hex representation:');
console.log(content.toString('hex'));
console.log('String representation (escaped):');
console.log(JSON.stringify(content.toString()));