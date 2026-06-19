const tests = [
  "toggleSection(this,'sec-team')",
  "toggleSection(this, 'sec-casestudies')",
  "signProposal(this)",
  "uploadCover()",
  "selSt(this,'DRAFT')"
];

for (const code of tests) {
  const argsMatch = code.match(/\((.*?)\)/);
  if (argsMatch) {
    const rawArgs = argsMatch[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    console.log(`[${code}] -> rawArgs:`, rawArgs);
    if (rawArgs.length === 2 && rawArgs[0] === 'this') {
      console.log('  -> calls fn(btn, ', rawArgs[1], ')');
    } else if (rawArgs[0] === 'this') {
      console.log('  -> calls fn(btn)');
    } else {
      console.log('  -> calls fn()');
    }
  } else {
    console.log(`[${code}] -> No args matched!`);
  }
}
