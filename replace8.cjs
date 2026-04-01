const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Enhance the Refine Asset modal textarea
content = content.replace(/className="w-full bg-gray-50 border border-gray-200 rounded-3xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500\/20 text-sm font-medium resize-none h-32"/g, 'className="w-full bg-slate-50/80 border border-violet-100/50 rounded-3xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 text-sm font-medium resize-none h-32 shadow-inner"');

// Enhance the "Refine Asset" button
content = content.replace(/className="flex-1 px-4 py-3 rounded-3xl font-black bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600\/20 flex items-center justify-center gap-2"/g, 'className="flex-1 px-4 py-3 rounded-3xl font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/20 hover:-translate-y-0.5 border-none flex items-center justify-center gap-2"');

fs.writeFileSync('src/App.tsx', content);
console.log('Done replacing more styles 8');
