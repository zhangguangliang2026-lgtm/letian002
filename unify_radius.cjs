const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/rounded-\[48px\]/g, 'rounded-3xl');
content = content.replace(/rounded-\[40px\]/g, 'rounded-3xl');
content = content.replace(/rounded-\[32px\]/g, 'rounded-2xl');
content = content.replace(/rounded-\[24px\]/g, 'rounded-2xl');

fs.writeFileSync('src/App.tsx', content);
console.log('Border radius unified.');
