const fs = require('fs');
const html = fs.readFileSync('src/components/ProposalForm.jsx', 'utf8');
const ids = ['propTitle', 'toComp', 'propDate', 'propType', 'propExpiry', 'fromPerson', 'fromComp', 'fromEmail', 'toPerson', 'toEmail', 'toPhone', 'toAddr', 'problem', 'solution', 'outcome', 'startDate', 'endDate', 'duration', 'paySchedule', 'closing'];
const missing = ids.filter(id => !html.includes(`id="${id}"`));
console.log('Missing IDs:', missing);
