const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Enhance the "System Config" modal
content = content.replace(/className="bg-white rounded-\[48px\] p-10 w-full max-w-6xl max-h-\[90vh\] relative z-10 shadow-2xl flex flex-col overflow-hidden"/g, 'className="bg-white/95 backdrop-blur-xl rounded-[48px] p-10 w-full max-w-6xl max-h-[90vh] relative z-10 shadow-2xl flex flex-col overflow-hidden border border-white/20"');

// Enhance the "System Config" textareas
content = content.replace(/className="w-full h-32 bg-gray-50 border border-gray-100 rounded-\[24px\] p-6 focus:outline-none focus:ring-4 focus:ring-amber-500\/10 focus:border-amber-500 transition-all text-xs font-mono leading-relaxed"/g, 'className="w-full h-32 bg-slate-50/80 border border-violet-100/50 rounded-[24px] p-6 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all text-xs font-mono leading-relaxed shadow-inner"');
content = content.replace(/className="w-full h-32 bg-gray-50 border border-gray-100 rounded-\[24px\] p-6 focus:outline-none focus:ring-4 focus:ring-purple-500\/10 focus:border-purple-500 transition-all text-xs font-mono leading-relaxed"/g, 'className="w-full h-32 bg-slate-50/80 border border-violet-100/50 rounded-[24px] p-6 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 transition-all text-xs font-mono leading-relaxed shadow-inner"');

// Enhance the "Model Config" modal
content = content.replace(/className="bg-white rounded-\[48px\] p-10 w-full max-w-6xl max-h-\[90vh\] relative z-10 shadow-2xl flex flex-col overflow-hidden"/g, 'className="bg-white/95 backdrop-blur-xl rounded-[48px] p-10 w-full max-w-6xl max-h-[90vh] relative z-10 shadow-2xl flex flex-col overflow-hidden border border-white/20"');

// Enhance the "Model Config" provider buttons
content = content.replace(/className={`\s*p-4 rounded-3xl border-2 transition-all flex items-center gap-3\s*\$\{config\.selectedModel === provider\s*\? 'border-violet-500 bg-violet-50 text-violet-700'\s*: 'border-gray-100 hover:border-gray-200 text-gray-600'\}\s*`}/g, 'className={`p-4 rounded-3xl border-2 transition-all flex items-center gap-3 ${config.selectedModel === provider ? \'border-violet-400 bg-violet-50/80 text-violet-700 shadow-sm\' : \'border-violet-100/50 hover:border-violet-200 hover:bg-slate-50/50 text-slate-600\'}`}');

fs.writeFileSync('src/App.tsx', content);
console.log('Done replacing more styles 10');
