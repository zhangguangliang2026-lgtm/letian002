const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Enhance the "New Project" button
content = content.replace(/className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-none px-6 py-3 rounded-3xl flex items-center gap-2 hover:opacity-90 hover:shadow-lg hover:shadow-violet-500\/30 hover:-translate-y-0\.5 transition-all shadow-xl shadow-violet-500\/20 active:scale-95 font-bold"/g, 'className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-none px-6 py-3 rounded-3xl flex items-center gap-2 hover:opacity-90 hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all shadow-xl shadow-violet-500/20 active:scale-95 font-black"');

// Enhance the "Empty State" in dashboard
content = content.replace(/className="bg-white border border-dashed border-gray-200 rounded-\[40px\] p-24 flex flex-col items-center justify-center text-center shadow-sm"/g, 'className="bg-white/80 backdrop-blur-sm border-2 border-dashed border-violet-100/50 rounded-[40px] p-24 flex flex-col items-center justify-center text-center shadow-sm"');

// Enhance the "Empty State" icon
content = content.replace(/className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center text-violet-300 mb-6"/g, 'className="w-20 h-20 bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-full flex items-center justify-center text-violet-400 mb-6 shadow-inner"');

fs.writeFileSync('src/App.tsx', content);
console.log('Done replacing more styles 14');
