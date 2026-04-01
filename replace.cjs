const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace emerald with a more vibrant anime-style color like violet or indigo
content = content.replace(/emerald/g, 'violet');

// Replace bg-[#f8f9fa] with transparent since we have a pattern on body
content = content.replace(/bg-\[\#f8f9fa\]/g, 'bg-transparent');

// Soften borders
content = content.replace(/border-black\/5/g, 'border-violet-100');
content = content.replace(/border-black\/\[0\.03\]/g, 'border-violet-100');

// Make shadows more colorful
content = content.replace(/shadow-black\/5/g, 'shadow-violet-500\/10');
content = content.replace(/shadow-black\/10/g, 'shadow-violet-500\/20');
content = content.replace(/shadow-black\/20/g, 'shadow-violet-500\/30');

// Make headers and floating elements glassmorphic
content = content.replace(/bg-white border-b border-violet-100 sticky top-0 z-40/g, 'bg-white\/80 backdrop-blur-md border-b border-violet-100 sticky top-0 z-40');
content = content.replace(/fixed top-20 right-6 z-50 bg-white/g, 'fixed top-20 right-6 z-50 bg-white\/90 backdrop-blur-md');
content = content.replace(/fixed bottom-32 left-6 z-50 bg-white/g, 'fixed bottom-32 left-6 z-50 bg-white\/90 backdrop-blur-md');
content = content.replace(/fixed bottom-6 left-6 z-50 bg-white/g, 'fixed bottom-6 left-6 z-50 bg-white\/90 backdrop-blur-md');

// Change the main black buttons to a vibrant gradient
content = content.replace(/bg-black text-white/g, 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-none');
content = content.replace(/hover:bg-black\/80/g, 'hover:opacity-90 hover:shadow-lg hover:shadow-violet-500\/30 hover:-translate-y-0.5');

// Make the "Add Chapter" button cuter
content = content.replace(/bg-violet-50 text-violet-600 rounded-xl hover:bg-violet-100/g, 'bg-violet-100 text-violet-700 rounded-2xl hover:bg-violet-200 hover:scale-105');

// Change the empty state icon background
content = content.replace(/bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300/g, 'bg-violet-50 rounded-full flex items-center justify-center text-violet-300');

// Change the main title
content = content.replace(/text-3xl font-black tracking-tight text-gray-900/g, 'text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-fuchsia-600');

// Make cards a bit more rounded and cute
content = content.replace(/rounded-\[32px\]/g, 'rounded-[40px]');
content = content.replace(/rounded-2xl/g, 'rounded-3xl');

// Add some playful transitions to cards
content = content.replace(/hover:shadow-2xl hover:shadow-violet-500\/10 transition-all/g, 'hover:shadow-2xl hover:shadow-violet-500\/20 transition-all duration-300 hover:-translate-y-1');

// Make the text selection color match
content = content.replace(/selection:bg-violet-100/g, 'selection:bg-fuchsia-200 selection:text-fuchsia-900');

fs.writeFileSync('src/App.tsx', content);
console.log('Done replacing styles');
