import fs from 'fs';

let content = fs.readFileSync('src/components/ProposalForm.jsx', 'utf8');

content = content.replace(/onChange=\{\(\) => \{\}\} style=\{(.+?)\}>/g, 'onChange={() => {}} style={$1} />');
content = content.replace(/onChange=\{\(\) => \{\}\}>/g, 'onChange={() => {}} />');
content = content.replace(/onClick=\{\(\) => \{\}\}>/g, 'onClick={() => {}} />');

fs.writeFileSync('src/components/ProposalForm.jsx', content);
console.log('Fixed ProposalForm.jsx');
