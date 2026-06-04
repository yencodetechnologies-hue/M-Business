import fs from 'fs';

const html = fs.readFileSync('new_proposals_ui.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
let rawJs = scriptMatch ? scriptMatch[1] : '';

// Convert rawJs to an ES module exporting the functions
let moduleJs = `
// --- Automatically Extracted Logic ---

export let msCount = 5;
export let currentStatus = 'DRAFT';

export const fmtDate = v => { try { return new Date(v).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); } catch { return v; } };
export const fmt = n => '₹' + Number(n).toLocaleString('en-IN');

`;

let lines = rawJs.split('\n');
lines = lines.filter(l => !l.includes('let msCount') && !l.includes('let currentStatus') && !l.includes('const fmtDate') && !l.includes('const fmt'));
rawJs = lines.join('\n');

moduleJs += rawJs.replace(/function (\w+)\(/g, 'export function $1(');

fs.writeFileSync('src/components/ProposalFormLogic.js', moduleJs);
console.log('Fixed ProposalFormLogic.js');
