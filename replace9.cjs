const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Enhance the "New Project" modal
content = content.replace(/className="bg-white rounded-\[48px\] p-10 w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden"/g, 'className="bg-white/95 backdrop-blur-xl rounded-[48px] p-10 w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden border border-white/20"');

// Enhance the "Model Config" modal
content = content.replace(/className="bg-white rounded-\[40px\] w-full max-w-6xl p-8 shadow-2xl"/g, 'className="bg-white/95 backdrop-blur-xl rounded-[40px] w-full max-w-6xl p-10 shadow-2xl border border-white/20"');

// Enhance the "Model Config" inputs
content = content.replace(/className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500\/20"/g, 'className="w-full bg-slate-50/80 border border-violet-100/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 shadow-inner"');

// Enhance the "Model Config" provider settings container
content = content.replace(/className={`p-6 rounded-3xl border \${config.selectedModel === provider \? 'border-violet-200 bg-violet-50\/30' : 'border-gray-100 bg-gray-50\/50'}`}/g, 'className={`p-6 rounded-3xl border transition-all ${config.selectedModel === provider ? \'border-violet-300 bg-violet-50/50 shadow-sm\' : \'border-violet-100/50 bg-slate-50/50 hover:bg-slate-50/80\'}`}');

// Enhance the "Model Config" finish button
content = content.replace(/className="bg-violet-600 text-white px-10 py-4 rounded-\[24px\] font-black hover:bg-violet-700 transition-all shadow-xl shadow-violet-600\/20 active:scale-95 flex items-center gap-2"/g, 'className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-10 py-4 rounded-[24px] font-black hover:opacity-90 transition-all shadow-xl shadow-violet-500/30 active:scale-95 flex items-center gap-2 hover:-translate-y-0.5 border-none"');

fs.writeFileSync('src/App.tsx', content);
console.log('Done replacing more styles 9');
