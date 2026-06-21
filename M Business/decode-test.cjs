const fs = require('fs');
let c = fs.readFileSync('src/components/SubAdminDashboard.jsx', 'utf8');
let bin = Buffer.from(c, 'binary');
let dec = bin.toString('utf8');

// See what employee: "..." turns into
let m = dec.match(/employee: "(.*?)"/);
console.log('Employee icon:', m ? m[1] : 'not found');
