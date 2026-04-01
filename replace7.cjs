const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Fix duplicate border classes
content = content.replace(/border border-white\/20 border border-violet-100/g, 'border border-white/20');

// Enhance the Add Asset modal inputs
content = content.replace(/className="w-full bg-gray-50 border border-gray-200 rounded-3xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500\/20 text-sm font-medium"/g, 'className="w-full bg-slate-50/80 border border-violet-100/50 rounded-3xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 text-sm font-medium shadow-inner"');

// Enhance the Refine Asset modal inputs
content = content.replace(/className="w-full bg-gray-50 border border-gray-200 rounded-3xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500\/20 text-sm font-medium resize-none"/g, 'className="w-full bg-slate-50/80 border border-violet-100/50 rounded-3xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 text-sm font-medium resize-none shadow-inner"');

// Enhance the Refine Asset modal textarea
content = content.replace(/className="w-full bg-gray-50 border border-gray-200 rounded-3xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500\/20 text-sm font-medium resize-none h-32"/g, 'className="w-full bg-slate-50/80 border border-violet-100/50 rounded-3xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 text-sm font-medium resize-none h-32 shadow-inner"');

// Enhance the "Refine Asset" button
content = content.replace(/bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-all shadow-lg shadow-violet-600\/20/g, 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/20 hover:-translate-y-0.5 border-none');

fs.writeFileSync('src/App.tsx', content);
console.log('Done replacing more styles 7');
