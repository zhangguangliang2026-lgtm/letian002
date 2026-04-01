const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/bg-white border border-violet-100 rounded-\[40px\] flex flex-col shadow-sm overflow-hidden/g, 'bg-white/90 backdrop-blur-xl border border-violet-100/50 rounded-[40px] flex flex-col shadow-xl shadow-violet-900/5 overflow-hidden');

// Also update the main editor panel
content = content.replace(/flex-1 bg-white border border-violet-100 rounded-\[40px\] flex flex-col shadow-sm overflow-hidden/g, 'flex-1 bg-white/90 backdrop-blur-xl border border-violet-100/50 rounded-[40px] flex flex-col shadow-xl shadow-violet-900/5 overflow-hidden');

// Enhance the prompt input area
content = content.replace(/bg-gray-50 rounded-3xl p-4 border border-violet-100/g, 'bg-slate-50/50 rounded-3xl p-4 border border-violet-100/50 shadow-inner');

// Enhance the style tags
content = content.replace(/bg-gray-100 rounded-lg text-gray-600/g, 'bg-slate-100 rounded-xl text-slate-600');

// Make the active chapter item cuter
content = content.replace(/bg-violet-50 border-violet-200 shadow-sm/g, 'bg-gradient-to-br from-violet-50 to-fuchsia-50 border-violet-200 shadow-md shadow-violet-500/10');

// Make the empty state in chapter list cuter
content = content.replace(/hover:bg-gray-50/g, 'hover:bg-slate-50/80');

fs.writeFileSync('src/App.tsx', content);
console.log('Done replacing more styles 3');
