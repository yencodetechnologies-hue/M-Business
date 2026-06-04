import fs from 'fs';

let content = fs.readFileSync('src/components/ProposalForm.jsx', 'utf8');

// Replace topbar left back button
content = content.replace(
  /<button className="back-btn"><i className="ti ti-arrow-left" style=\{\{"fontSize":"13px"\}\}><\/i> Proposals<\/button>/,
  '<button className="back-btn" onClick={onBack}><i className="ti ti-arrow-left" style={{"fontSize":"13px"}}></i> Proposals</button>'
);

// Replace save draft button
content = content.replace(
  /<button className="btn-o" onClick=\{\(\) => \{\}\}\><i className="ti ti-device-floppy" style=\{\{"fontSize":"13px"\}\}><\/i> Save Draft<\/button>/,
  '<button className="btn-o" onClick={() => onSave({ title: "New Proposal", client: "", value: "0" })}><i className="ti ti-device-floppy" style={{"fontSize":"13px"}}></i> Save Draft</button>'
);

// Replace send button
content = content.replace(
  /<button className="btn-t" onClick=\{\(\) => \{\}\}\><i className="ti ti-send" style=\{\{"fontSize":"13px"\}\}><\/i> Send<\/button>/,
  '<button className="btn-t" onClick={() => onSave({ title: "New Proposal", client: "", value: "0" })}><i className="ti ti-send" style={{"fontSize":"13px"}}></i> Send</button>'
);

// Replace mark won button
content = content.replace(
  /<button className="btn-t btn-g" onClick=\{\(\) => \{\}\}\><i className="ti ti-trophy" style=\{\{"fontSize":"13px"\}\}><\/i> Mark Won<\/button>/,
  '<button className="btn-t btn-g" onClick={() => onSave({ title: "New Proposal", client: "", value: "0" })}><i className="ti ti-trophy" style={{"fontSize":"13px"}}></i> Mark Won</button>'
);


fs.writeFileSync('src/components/ProposalForm.jsx', content);
console.log('Fixed buttons in ProposalForm.jsx');
