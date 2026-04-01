const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Enhance the "Back to Project List" button
content = content.replace(/className="text-sm font-bold text-slate-500 hover:text-black flex items-center gap-1 transition-colors bg-gray-100 px-3 py-1\.5 rounded-full"/g, 'className="text-sm font-bold text-slate-500 hover:text-violet-700 flex items-center gap-1 transition-colors bg-slate-100 hover:bg-violet-50 px-3 py-1.5 rounded-full shadow-sm"');

fs.writeFileSync('src/App.tsx', content);
console.log('Done replacing more styles 15');
