const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/SubAdminDashboard.jsx');
let content = fs.readFileSync(file, 'utf8');
const replacements = {
  'ðŸ‘¨â€ ðŸ’¼': '👨‍💼',
  'ðŸ§‘â€ ðŸ’¼': '🧑‍💼',
  'ðŸ“ ': '📋',
  'ðŸ“‚': '📂',
  'ðŸ“„': '📄',
  'ðŸ“‹': '📋',
  'ðŸ‘¤': '👤',
  'ðŸ’¼': '💼',
  'ðŸ ¦': '🏦',
  'ðŸ’¬': '💬',
  'ðŸ›¡ï¸ ': '🛡️',
  'â›”': '⛔',
  'ðŸ“§': '📧',
  'ðŸ“±': '📱',
  'ðŸ ¢': '🏢',
  'ðŸ“…': '📅',
  'ðŸŽ¯': '🎯',
  'â ³': '⏳',
  'â Œ': '❌',
  'ðŸ“­': '📬',
  'ðŸŽ“': '🎓',
  'âš¡': '⚡',
  'ðŸ• ': '🕒',
  'â ¸ï¸ ': '⏸️',
  'ðŸ“Š': '📊',
  'ðŸ“·': '📷'
};

for (const [bad, good] of Object.entries(replacements)) {
  content = content.split(bad).join(good);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed emojis in SubAdminDashboard.jsx');
