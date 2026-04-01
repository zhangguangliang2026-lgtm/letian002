const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Enhance the "Save Config" button
content = content.replace(/className="bg-gray-900 text-white px-10 py-4 rounded-\[24px\] font-black hover:bg-black transition-all shadow-xl shadow-violet-500\/30 active:scale-95 flex items-center gap-2"/g, 'className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-10 py-4 rounded-[24px] font-black hover:opacity-90 transition-all shadow-xl shadow-slate-900/20 active:scale-95 flex items-center gap-2 hover:-translate-y-0.5 border-none"');

fs.writeFileSync('src/App.tsx', content);
console.log('Done replacing more styles 12');
