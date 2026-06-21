const fs = require('fs');

const file = 'src/components/SubAdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = {
  'ðŸ‘¨â€\\x8D💼': '👨‍💼',
  'ðŸ§‘â€\\x8D💼': '🧑‍💼',
  'ðŸ“\\x81': '📁',
  'ðŸ\\x8F¦': '🏦',
  'ðŸ\\x8F¢': '🏢',
  'ðŸ“\\x8D': '📍',
  'ðŸ›¡ï¸\\x8F': '🛡️',
  'ðŸ•\\x90': '🕚',
  'ðŸ“\\x9D': '📝',
  'ðŸŽ\\xAD': '🎬',
  'ðŸšª': '🚪',
  'ðŸŒ±': '🌱',
  'ðŸ’Ž': '💎',
  'ðŸ“¦': '📦',
  'ðŸ’°': '💰',
  'ðŸ’¸': '💸',
  'ðŸ’³': '💳',
  'ðŸŒ\\x90': '🌐',
  'â\\x9DŒ': '❌',
  'â\\x8F¸ï¸\\x8F': '⏸️',
  'â\\x8F³': '⏳',
  'âœ✨': '✨',
  'âš–ï¸\\x8F': '⚖️',
  'â†\\x90': '←',
  'â”€â”€': '──',
  'âœ“': '✓',
  'â€¦': '…',
  'â€“': '–'
};

for (const [badEncoded, good] of Object.entries(replacements)) {
    // Unescape the string to match actual bytes
    const bad = badEncoded.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    content = content.replaceAll(bad, good);
}

// Fallback: any remaining `ðŸ`... or `â€`... that looks like garbage can just be removed
content = content.replace(/ðŸ[^\s"'<>]*/g, "");

fs.writeFileSync(file, content, 'utf8');
console.log('Done repairing Mojibake');
