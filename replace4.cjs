const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Enhance the input textarea
content = content.replace(/className="flex-1 w-full resize-none bg-gray-50 rounded-\[40px\] p-6 focus:outline-none focus:ring-2 focus:ring-violet-500\/20 border border-transparent focus:border-violet-500\/30 transition-all text-sm leading-relaxed font-medium"/g, 'className="flex-1 w-full resize-none bg-slate-50/50 rounded-[40px] p-8 focus:outline-none focus:ring-4 focus:ring-violet-500/10 border border-violet-100/50 focus:border-violet-300 transition-all text-sm leading-relaxed font-medium shadow-inner"');

// Enhance the output area
content = content.replace(/className="flex-1 bg-\[\#0d0d0d\] rounded-\[40px\] p-8 overflow-y-auto font-mono text-sm text-gray-300 leading-relaxed custom-scrollbar border border-white\/5"/g, 'className="flex-1 bg-slate-900 rounded-[40px] p-8 overflow-y-auto font-mono text-sm text-slate-300 leading-relaxed custom-scrollbar border border-slate-800 shadow-inner"');

// Enhance the empty state in output area
content = content.replace(/border-gray-800/g, 'border-slate-700');

// Enhance the segment navigation buttons
content = content.replace(/className="whitespace-nowrap px-4 py-2 bg-gray-50 hover:bg-violet-50 text-gray-600 hover:text-violet-600 text-xs font-bold rounded-xl transition-colors border border-violet-100 hover:border-violet-200 flex items-center gap-1"/g, 'className="whitespace-nowrap px-4 py-2 bg-white hover:bg-violet-50 text-slate-600 hover:text-violet-600 text-xs font-bold rounded-xl transition-all border border-violet-100 hover:border-violet-200 shadow-sm hover:shadow-md flex items-center gap-1"');

// Enhance the "Generate" button
content = content.replace(/bg-violet-600 text-white hover:bg-violet-700 active:scale-95 shadow-violet-600\/20/g, 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 active:scale-95 shadow-violet-600/20 border-none');

// Enhance the "Extract Assets" button
content = content.replace(/bg-fuchsia-600 text-white hover:bg-fuchsia-700 active:scale-95 shadow-fuchsia-600\/20/g, 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white hover:opacity-90 hover:shadow-lg hover:shadow-fuchsia-500/30 hover:-translate-y-0.5 active:scale-95 shadow-fuchsia-600/20 border-none');

fs.writeFileSync('src/App.tsx', content);
console.log('Done replacing more styles 4');
