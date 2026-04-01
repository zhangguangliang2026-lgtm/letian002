const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Enhance the "New Project" modal
content = content.replace(/bg-white rounded-\[40px\] w-full max-w-6xl p-8 shadow-2xl/g, 'bg-white/95 backdrop-blur-xl rounded-[40px] w-full max-w-6xl p-10 shadow-2xl border border-white/20');
content = content.replace(/w-full bg-gray-50 border border-gray-100 rounded-\[24px\] px-6 py-4 focus:outline-none focus:ring-4 focus:ring-violet-500\/10 focus:border-violet-500 transition-all text-lg font-bold/g, 'w-full bg-slate-50/80 border border-violet-100/50 rounded-[24px] px-6 py-4 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 transition-all text-lg font-bold shadow-inner');

// Enhance the "Style Edit/Add" modal
content = content.replace(/bg-black\/60 backdrop-blur-md/g, 'bg-slate-900/60 backdrop-blur-md');
content = content.replace(/bg-white rounded-\[40px\] p-8 w-full max-w-md relative z-10 shadow-2xl/g, 'bg-white/95 backdrop-blur-xl rounded-[40px] p-8 w-full max-w-md relative z-10 shadow-2xl border border-white/20');

// Enhance the "Add Asset" modal
content = content.replace(/bg-white rounded-\[40px\] p-8 w-full max-w-md relative z-10 shadow-2xl/g, 'bg-white/95 backdrop-blur-xl rounded-[40px] p-8 w-full max-w-md relative z-10 shadow-2xl border border-white/20');

// Enhance the "Refine Asset" modal
content = content.replace(/bg-white rounded-\[40px\] p-8 w-full max-w-2xl relative z-10 shadow-2xl/g, 'bg-white/95 backdrop-blur-xl rounded-[40px] p-8 w-full max-w-2xl relative z-10 shadow-2xl border border-white/20');

// Enhance generic inputs in modals
content = content.replace(/w-full bg-gray-50 border border-gray-200 rounded-3xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500\/20 font-bold/g, 'w-full bg-slate-50/80 border border-violet-100/50 rounded-3xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 font-bold shadow-inner');
content = content.replace(/w-full bg-gray-50 border border-gray-200 rounded-3xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500\/20 text-sm/g, 'w-full bg-slate-50/80 border border-violet-100/50 rounded-3xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 text-sm shadow-inner');

// Enhance primary buttons in modals
content = content.replace(/bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-violet-600\/30/g, 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-violet-500/30 hover:-translate-y-0.5 border-none');
content = content.replace(/bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-all shadow-lg shadow-violet-600\/20/g, 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/20 hover:-translate-y-0.5 border-none');

fs.writeFileSync('src/App.tsx', content);
console.log('Done replacing more styles 6');
