const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Enhance the "Delete Project" button
content = content.replace(/className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"/g, 'className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all hover:scale-110"');

// Enhance the "Delete Style" button
content = content.replace(/className="p-1\.5 bg-white\/90 backdrop-blur text-gray-700 hover:text-red-600 rounded-lg shadow-sm"/g, 'className="p-1.5 bg-white/90 backdrop-blur text-slate-600 hover:text-red-600 rounded-lg shadow-sm hover:bg-red-50 transition-colors"');

// Enhance the "Edit Style" button
content = content.replace(/className="p-1\.5 bg-white\/90 backdrop-blur text-gray-700 hover:text-violet-600 rounded-lg shadow-sm"/g, 'className="p-1.5 bg-white/90 backdrop-blur text-slate-600 hover:text-violet-600 rounded-lg shadow-sm hover:bg-violet-50 transition-colors"');

fs.writeFileSync('src/App.tsx', content);
console.log('Done replacing more styles 13');
