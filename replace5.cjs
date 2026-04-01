const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Enhance the Asset Library Modal backdrop and container
content = content.replace(/bg-black\/40 backdrop-blur-sm/g, 'bg-slate-900/40 backdrop-blur-md');
content = content.replace(/bg-white w-full max-w-2xl h-full relative z-10 shadow-2xl flex flex-col/g, 'bg-white/95 backdrop-blur-xl w-full max-w-2xl h-full relative z-10 shadow-2xl flex flex-col border-l border-white/20');

// Enhance the modal header
content = content.replace(/p-8 border-b border-violet-100 flex items-center justify-between/g, 'p-8 border-b border-violet-100/50 bg-white/50 flex items-center justify-between');

// Enhance the tabs in Asset Library
content = content.replace(/bg-gray-100 p-1 rounded-3xl w-fit/g, 'bg-slate-100/80 p-1.5 rounded-2xl w-fit shadow-inner');
content = content.replace(/bg-white text-slate-800 shadow-sm/g, 'bg-white text-violet-700 shadow-sm ring-1 ring-black/5');

// Enhance the asset cards in the list
content = content.replace(/bg-white border border-violet-100\/50 rounded-3xl p-5 hover:shadow-xl hover:shadow-violet-500\/10 transition-all duration-300 hover:-translate-y-1 group/g, 'bg-white/80 backdrop-blur-sm border border-violet-100/50 rounded-3xl p-6 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-1 group');

// Enhance the textarea in asset cards
content = content.replace(/w-full bg-gray-50 rounded-2xl p-4 text-xs font-mono text-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500\/20 border border-transparent focus:border-violet-500\/30 transition-all/g, 'w-full bg-slate-50/80 rounded-2xl p-4 text-xs font-mono text-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 border border-violet-100/50 focus:border-violet-300 transition-all shadow-inner');

// Enhance the "AI Modify" button
content = content.replace(/text-violet-600 hover:bg-violet-50/g, 'text-violet-600 hover:bg-violet-100/50');

// Enhance the "Add Asset" button
content = content.replace(/bg-gray-100 px-4 py-2 rounded-full/g, 'bg-slate-100 px-4 py-2 rounded-full hover:bg-slate-200');

// Enhance the "Extract Assets" button
content = content.replace(/bg-violet-50 px-4 py-2 rounded-full/g, 'bg-violet-100 px-4 py-2 rounded-full hover:bg-violet-200');

fs.writeFileSync('src/App.tsx', content);
console.log('Done replacing more styles 5');
