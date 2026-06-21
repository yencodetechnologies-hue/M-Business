const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/SubAdminDashboard.jsx');
let content = fs.readFileSync(file, 'utf8');

// Replace all corrupted emoji-like sequences with standard ASCII or emoji
content = content.replace(/[^\x00-\x7F]+/g, (match) => {
  if (match.length > 2) return ''; // likely a corrupted block
  return '🌟'; // generic replacement
});

fs.writeFileSync(file, content, 'utf8');
console.log('Done replacing non-ascii characters');
