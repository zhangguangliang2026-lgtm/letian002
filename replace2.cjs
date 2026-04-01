const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Enhance the editor layout
content = content.replace(/className="flex gap-6 h-\[calc\(100vh-140px\)\] relative"/g, 'className="flex gap-6 h-[calc(100vh-140px)] relative"');

// Make the sidebar and editor panels more rounded and add soft shadows
content = content.replace(/bg-white border border-violet-100 rounded-\[32px\] flex flex-col shadow-sm overflow-hidden/g, 'bg-white/90 backdrop-blur-xl border border-violet-100/50 rounded-[32px] flex flex-col shadow-xl shadow-violet-900/5 overflow-hidden');

// Enhance input fields and textareas
content = content.replace(/className="w-full h-full p-6 resize-none bg-transparent border-none focus:ring-0 text-gray-700 leading-relaxed"/g, 'className="w-full h-full p-8 resize-none bg-transparent border-none focus:ring-0 text-slate-700 leading-relaxed font-medium"');
content = content.replace(/className="w-full h-full p-6 resize-none bg-transparent border-none focus:ring-0 text-gray-700 leading-relaxed font-mono text-sm"/g, 'className="w-full h-full p-8 resize-none bg-transparent border-none focus:ring-0 text-slate-700 leading-relaxed font-mono text-sm"');

// Make the "Generate" button more prominent
content = content.replace(/bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-none px-6 py-2.5 rounded-2xl flex items-center gap-2 hover:opacity-90 hover:shadow-lg hover:shadow-violet-500\/30 hover:-translate-y-0.5 transition-all shadow-xl shadow-violet-500\/20 active:scale-95 font-bold disabled:opacity-50 disabled:cursor-not-allowed/g, 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-none px-8 py-3 rounded-2xl flex items-center gap-2 hover:opacity-90 hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all shadow-xl shadow-violet-500/20 active:scale-95 font-bold disabled:opacity-50 disabled:cursor-not-allowed');

// Enhance the modal backgrounds
content = content.replace(/bg-black\/20 backdrop-blur-sm/g, 'bg-slate-900/40 backdrop-blur-md');
content = content.replace(/bg-white rounded-\[40px\] w-full max-w-md p-8 shadow-2xl/g, 'bg-white/95 backdrop-blur-xl rounded-[40px] w-full max-w-md p-8 shadow-2xl border border-white/20');
content = content.replace(/bg-white rounded-\[40px\] w-full max-w-2xl p-8 shadow-2xl/g, 'bg-white/95 backdrop-blur-xl rounded-[40px] w-full max-w-2xl p-8 shadow-2xl border border-white/20');
content = content.replace(/bg-white rounded-\[40px\] w-full max-w-6xl p-8 shadow-2xl/g, 'bg-white/95 backdrop-blur-xl rounded-[40px] w-full max-w-6xl p-8 shadow-2xl border border-white/20');

// Enhance the asset cards
content = content.replace(/bg-white border border-violet-100 rounded-3xl p-5 hover:shadow-xl hover:shadow-violet-500\/10 transition-all group/g, 'bg-white border border-violet-100/50 rounded-3xl p-5 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-1 group');

// Enhance the tags
content = content.replace(/bg-gray-100 text-gray-600/g, 'bg-slate-100 text-slate-600');
content = content.replace(/bg-blue-50 text-blue-600/g, 'bg-indigo-50 text-indigo-600');
content = content.replace(/bg-purple-50 text-purple-600/g, 'bg-fuchsia-50 text-fuchsia-600');
content = content.replace(/bg-orange-50 text-orange-600/g, 'bg-rose-50 text-rose-600');

// Make text colors slightly softer
content = content.replace(/text-gray-900/g, 'text-slate-800');
content = content.replace(/text-gray-500/g, 'text-slate-500');
content = content.replace(/text-gray-400/g, 'text-slate-400');

fs.writeFileSync('src/App.tsx', content);
console.log('Done replacing more styles');
