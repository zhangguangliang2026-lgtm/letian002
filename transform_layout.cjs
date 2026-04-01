const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Replace the root div
content = content.replace(
  '<div className="min-h-screen bg-transparent text-[#1a1a1a] font-sans selection:bg-fuchsia-200 selection:text-fuchsia-900">',
  '<div className="h-screen w-screen overflow-hidden bg-[#F8F9FA] text-[#2D3748] font-sans selection:bg-violet-200 selection:text-violet-900 flex flex-col">'
);

// 2. Replace the header
content = content.replace(
  '<header className="bg-white/80 backdrop-blur-md border-b border-violet-100 sticky top-0 z-40">',
  '<header className="h-14 bg-white border-b border-violet-100 flex-shrink-0 z-40 shadow-sm">'
);
content = content.replace(
  '<div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">',
  '<div className="w-full h-full px-4 flex items-center justify-between">'
);

// 3. Replace main
content = content.replace(
  '<main className="max-w-[1600px] mx-auto p-6">',
  '<main className="flex-1 overflow-hidden relative">'
);

// 4. Replace dashboard container
content = content.replace(
  '<motion.div \n              key="dashboard"\n              initial={{ opacity: 0, y: 20 }}\n              animate={{ opacity: 1, y: 0 }}\n              exit={{ opacity: 0, y: -20 }}\n              className="space-y-8"\n            >',
  '<motion.div \n              key="dashboard"\n              initial={{ opacity: 0, y: 20 }}\n              animate={{ opacity: 1, y: 0 }}\n              exit={{ opacity: 0, y: -20 }}\n              className="h-full overflow-y-auto p-8 space-y-8 custom-scrollbar"\n            >'
);

// 5. Replace editor container
content = content.replace(
  '<motion.div \n              key="editor"\n              initial={{ opacity: 0 }}\n              animate={{ opacity: 1 }}\n              exit={{ opacity: 0 }}\n              className="flex gap-6 h-[calc(100vh-140px)] relative"\n            >',
  '<motion.div \n              key="editor"\n              initial={{ opacity: 0 }}\n              animate={{ opacity: 1 }}\n              exit={{ opacity: 0 }}\n              className="flex h-full w-full relative bg-[#F8F9FA]"\n            >'
);

// 6. Replace Sidebar
content = content.replace(
  '<motion.div \n                animate={{ width: isSidebarOpen ? 320 : 0, opacity: isSidebarOpen ? 1 : 0 }}\n                className="bg-white/90 backdrop-blur-xl border border-violet-100/50 rounded-[40px] flex flex-col shadow-xl shadow-violet-900/5 overflow-hidden"\n              >',
  '<motion.div \n                animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}\n                className="bg-white border-r border-violet-100 flex flex-col h-full overflow-hidden shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10"\n              >'
);

// 7. Replace Toggle Sidebar Button
content = content.replace(
  '<button \n                onClick={() => setIsSidebarOpen(!isSidebarOpen)}\n                className="absolute left-[-12px] top-1/2 -translate-y-1/2 z-10 w-6 h-12 bg-white border border-violet-100 rounded-full flex items-center justify-center shadow-md hover:bg-slate-50/80 transition-colors"\n              >',
  '<button \n                onClick={() => setIsSidebarOpen(!isSidebarOpen)}\n                className="absolute top-1/2 -translate-y-1/2 z-20 w-5 h-10 bg-white border border-violet-100 border-l-0 rounded-r-lg flex items-center justify-center shadow-sm hover:bg-violet-50 transition-colors"\n                style={{ left: isSidebarOpen ? 280 : 0 }}\n              >'
);

// 8. Replace Main Content: Editor container
content = content.replace(
  '<div className="flex-1 flex flex-col gap-6 overflow-hidden">',
  '<div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">'
);

// 9. Replace Empty Editor State
content = content.replace(
  '<div className="flex-1 bg-white border border-violet-100 rounded-[40px] flex flex-col items-center justify-center text-center p-12 shadow-sm">',
  '<div className="flex-1 bg-white border border-violet-100 rounded-2xl flex flex-col items-center justify-center text-center p-12 shadow-sm">'
);

// 10. Replace Editor Grid
content = content.replace(
  '<div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">',
  '<div className="flex-1 flex gap-4 overflow-hidden">'
);

// 11. Replace Input Area
content = content.replace(
  '<div className="flex flex-col bg-white border border-violet-100 rounded-[40px] p-8 shadow-sm overflow-hidden">',
  '<div className="flex-1 flex flex-col bg-white border border-violet-100 rounded-2xl shadow-sm overflow-hidden">'
);

// 12. Replace Output Area
content = content.replace(
  '<div className="flex flex-col bg-white border border-violet-100 rounded-[40px] p-8 shadow-sm overflow-hidden">',
  '<div className="w-[45%] flex flex-col bg-white border border-violet-100 rounded-2xl shadow-sm overflow-hidden">'
);

// 13. Fix inner paddings of Input and Output areas
content = content.replace(
  '<div className="flex items-center justify-between mb-6">',
  '<div className="flex items-center justify-between p-4 border-b border-violet-50 bg-white">'
);
content = content.replace(
  '<div className="flex items-center justify-between mb-6">',
  '<div className="flex items-center justify-between p-4 border-b border-violet-50 bg-white">'
);

// 14. Fix Textarea padding and border
content = content.replace(
  '<textarea\n                        value={activeChapter.content}\n                        onChange={(e) => updateChapter(e.target.value, \'content\')}\n                        placeholder="在此粘贴章节内容或剧本草稿..."\n                        className="flex-1 w-full resize-none bg-slate-50/50 rounded-[40px] p-8 focus:outline-none focus:ring-4 focus:ring-violet-500/10 border border-violet-100/50 focus:border-violet-300 transition-all text-sm leading-relaxed font-medium shadow-inner"\n                      />',
  '<textarea\n                        value={activeChapter.content}\n                        onChange={(e) => updateChapter(e.target.value, \'content\')}\n                        placeholder="在此粘贴章节内容或剧本草稿..."\n                        className="flex-1 w-full resize-none bg-slate-50/30 p-6 focus:outline-none focus:ring-0 border-none transition-all text-sm leading-relaxed font-medium custom-scrollbar"\n                      />'
);

// 15. Fix Generate Button container
content = content.replace(
  '<div className="mt-6 flex justify-end">',
  '<div className="p-4 border-t border-violet-50 bg-white flex justify-end">'
);

// 16. Fix Output Area inner padding
content = content.replace(
  '<div className="flex items-center gap-2 mb-4 overflow-x-auto custom-scrollbar pb-2">',
  '<div className="flex items-center gap-2 px-4 py-3 border-b border-violet-50 bg-slate-50/50 overflow-x-auto custom-scrollbar">'
);

content = content.replace(
  '<div className="flex-1 bg-slate-900 rounded-[40px] p-8 overflow-y-auto font-mono text-sm text-slate-300 leading-relaxed custom-scrollbar border border-slate-800 shadow-inner">',
  '<div className="flex-1 bg-slate-900 p-6 overflow-y-auto font-mono text-sm text-slate-300 leading-relaxed custom-scrollbar shadow-inner">'
);

// 17. Fix Sidebar inner padding
content = content.replace(
  '<div className="p-6 border-b border-violet-100 flex items-center justify-between">',
  '<div className="p-4 border-b border-violet-100 flex items-center justify-between bg-white">'
);

fs.writeFileSync('src/App.tsx', content);
console.log('Layout transformed successfully.');
