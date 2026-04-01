const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Enhance the "System Config" modal
content = content.replace(/className="bg-white rounded-\[48px\] p-10 w-full max-w-4xl max-h-\[90vh\] relative z-10 shadow-2xl flex flex-col overflow-hidden"/g, 'className="bg-white/95 backdrop-blur-xl rounded-[48px] p-10 w-full max-w-4xl max-h-[90vh] relative z-10 shadow-2xl flex flex-col overflow-hidden border border-white/20"');

// Enhance the "System Config" textareas
content = content.replace(/className="w-full h-48 bg-gray-50 border border-gray-100 rounded-\[24px\] p-6 focus:outline-none focus:ring-4 focus:ring-violet-500\/10 focus:border-violet-500 transition-all text-xs font-mono leading-relaxed"/g, 'className="w-full h-48 bg-slate-50/80 border border-violet-100/50 rounded-[24px] p-6 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 transition-all text-xs font-mono leading-relaxed shadow-inner"');
content = content.replace(/className="w-full h-48 bg-gray-50 border border-gray-100 rounded-\[24px\] p-6 focus:outline-none focus:ring-4 focus:ring-blue-500\/10 focus:border-blue-500 transition-all text-xs font-mono leading-relaxed"/g, 'className="w-full h-48 bg-slate-50/80 border border-violet-100/50 rounded-[24px] p-6 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all text-xs font-mono leading-relaxed shadow-inner"');

fs.writeFileSync('src/App.tsx', content);
console.log('Done replacing more styles 11');
