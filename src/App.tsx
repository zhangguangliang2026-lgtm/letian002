import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  FileText, 
  Loader2, 
  Copy, 
  Check, 
  LayoutDashboard,
  ArrowLeft,
  Sparkles,
  History,
  BookOpen,
  PlusCircle,
  Menu,
  X,
  Save,
  Library,
  User,
  Box,
  Map,
  RefreshCw,
  Settings,
  Sliders,
  Download,
  Edit2,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Chapter, STYLES, Asset, AppConfig, StyleOption } from './types';
import { 
  getSystemInstruction, 
  getAssetExtractionInstruction,
  DEFAULT_STORYBOARD_TEMPLATE,
  DEFAULT_ASSET_EXTRACTION_TEMPLATE
} from './constants';

const API_KEY = process.env.GEMINI_API_KEY;

export default function App() {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('script_projects_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    return localStorage.getItem('script_active_project_id');
  });
  const [activeChapterId, setActiveChapterId] = useState<string | null>(() => {
    return localStorage.getItem('script_active_chapter_id');
  });
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showAssetLibrary, setShowAssetLibrary] = useState(false);
  const [activeAssetTab, setActiveAssetTab] = useState<'all' | 'character' | 'prop' | 'scene'>('all');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showModelConfigModal, setShowModelConfigModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [customStyles, setCustomStyles] = useState<StyleOption[]>(() => {
    const saved = localStorage.getItem('script_styles_v2');
    return saved ? JSON.parse(saved) : STYLES;
  });
  const [newProjectStyle, setNewProjectStyle] = useState(customStyles[0]?.name || STYLES[0].name);
  
  const [editingStyle, setEditingStyle] = useState<StyleOption | null>(null);
  const [isAddingStyle, setIsAddingStyle] = useState(false);
  const [editStyleName, setEditStyleName] = useState('');
  const [editStyleImage, setEditStyleImage] = useState('');
  
  const [config, setConfig] = useState<AppConfig>(() => {
    const defaultConfig: AppConfig = {
      storyboardInstruction: DEFAULT_STORYBOARD_TEMPLATE,
      assetExtractionInstruction: DEFAULT_ASSET_EXTRACTION_TEMPLATE,
      imageGenInstruction: '3D render, C4D style, high-quality character portrait, white background...',
      videoGenInstruction: 'Cinematic video, 4k, high detail, smooth motion...',
      selectedModel: 'gemini',
      models: {
        gemini: { provider: 'gemini', modelName: 'gemini-3-flash-preview', apiKey: API_KEY || '' },
        deepseek: { provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-356c3d66038a448e81fd74896493d26d', baseUrl: 'https://api.deepseek.com/v1' },
        kimi: { provider: 'kimi', modelName: 'moonshot-v1-8k', apiKey: 'sk-FCbTuS6XDJKi53ZrPfseP3SypA1a8hBnaY4V6YCOhEdfKfTv', baseUrl: 'https://api.moonshot.cn/v1' },
        claude: { provider: 'claude', modelName: 'claude-3-5-sonnet-20241022', apiKey: 'sk-wuCwGvtcQVo5o3wpAf6TMO5JJlrwVxKXkVUnckgJ14zd2FLU', baseUrl: 'https://api.bltcy.ai/v1' }
      }
    };

    const saved = localStorage.getItem('script_config_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge models carefully: if a saved key is empty, use the default one for testing
      const mergedModels = { ...defaultConfig.models };
      if (parsed.models) {
        Object.keys(parsed.models).forEach(key => {
          const provider = key as keyof typeof mergedModels;
          if (mergedModels[provider]) {
            mergedModels[provider] = {
              ...mergedModels[provider],
              ...parsed.models[provider],
              // If saved key is empty and default has a key, use default
              apiKey: parsed.models[provider].apiKey || mergedModels[provider].apiKey
            };
          }
        });
      }

      return {
        ...defaultConfig,
        ...parsed,
        models: mergedModels
      };
    }
    return defaultConfig;
  });

  const [generatingChapterIds, setGeneratingChapterIds] = useState<string[]>([]);
  const [extractingChapterIds, setExtractingChapterIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeChapter = activeProject?.chapters.find(c => c.id === activeChapterId);

  useEffect(() => {
    localStorage.setItem('script_projects_v2', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('script_config_v2', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('script_styles_v2', JSON.stringify(customStyles));
  }, [customStyles]);

  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('script_active_project_id', activeProjectId);
    } else {
      localStorage.removeItem('script_active_project_id');
    }
  }, [activeProjectId]);

  useEffect(() => {
    if (activeChapterId) {
      localStorage.setItem('script_active_chapter_id', activeChapterId);
    } else {
      localStorage.removeItem('script_active_chapter_id');
    }
  }, [activeChapterId]);

  const handleSaveStyle = () => {
    if (!editStyleName.trim() || !editStyleImage.trim()) return;

    if (isAddingStyle) {
      const newStyle: StyleOption = {
        id: `custom-${Date.now()}`,
        name: editStyleName,
        image: editStyleImage,
      };
      setCustomStyles([...customStyles, newStyle]);
      setNewProjectStyle(newStyle.name);
    } else if (editingStyle) {
      setCustomStyles(customStyles.map(s => 
        s.id === editingStyle.id ? { ...s, name: editStyleName, image: editStyleImage } : s
      ));
      if (newProjectStyle === editingStyle.name) {
        setNewProjectStyle(editStyleName);
      }
    }

    setEditingStyle(null);
    setIsAddingStyle(false);
    setEditStyleName('');
    setEditStyleImage('');
  };

  const handleDeleteStyle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个自定义风格吗？')) {
      const updatedStyles = customStyles.filter(s => s.id !== id);
      setCustomStyles(updatedStyles);
      if (newProjectStyle === customStyles.find(s => s.id === id)?.name) {
        setNewProjectStyle(updatedStyles[0]?.name || '');
      }
    }
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    const newChapterId = crypto.randomUUID();
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: newProjectName,
      style: newProjectStyle,
      chapters: [
        {
          id: newChapterId,
          title: '第 1 章',
          content: '',
          output: '',
          assets: [],
          createdAt: Date.now(),
        }
      ],
      createdAt: Date.now(),
    };
    setProjects([newProject, ...projects]);
    setActiveProjectId(newProject.id);
    setActiveChapterId(newChapterId);
    setShowNewProjectModal(false);
    setNewProjectName('');
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个剧本吗？')) {
      setProjects(projects.filter(p => p.id !== id));
      if (activeProjectId === id) {
        setActiveProjectId(null);
        setActiveChapterId(null);
      }
    }
  };

  const handleAddChapter = () => {
    if (!activeProjectId) return;
    const newChapter: Chapter = {
      id: crypto.randomUUID(),
      title: `第 ${ (activeProject?.chapters.length || 0) + 1 } 章`,
      content: '',
      output: '',
      assets: [],
      createdAt: Date.now(),
    };
    
    setProjects(projects.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, chapters: [...p.chapters, newChapter] };
      }
      return p;
    }));
    setActiveChapterId(newChapter.id);
  };

  const updateChapter = (content: any, field: keyof Chapter, chapterId?: string) => {
    const targetChapterId = chapterId || activeChapterId;
    if (!activeProjectId || !targetChapterId) return;
    setProjects(prevProjects => prevProjects.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          chapters: p.chapters.map(c => {
            if (c.id === targetChapterId) {
              const newValue = typeof content === 'function' ? content(c[field]) : content;
              return { ...c, [field]: newValue };
            }
            return c;
          })
        };
      }
      return p;
    }));
  };

  const handleDeleteChapter = (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个章节吗？')) {
      setProjects(projects.map(p => {
        if (p.id === activeProjectId) {
          return { ...p, chapters: p.chapters.filter(c => c.id !== chapterId) };
        }
        return p;
      }));
      if (activeChapterId === chapterId) setActiveChapterId(null);
    }
  };

  const callAIStream = async (prompt: string, systemInstruction: string, onChunk: (text: string) => void) => {
    const { selectedModel, models } = config;
    const settings = models[selectedModel];

    if (!settings.apiKey && selectedModel !== 'gemini') {
      throw new Error(`请先在配置面板中设置 ${selectedModel.toUpperCase()} 的 API Key`);
    }

    try {
      if (selectedModel === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: settings.apiKey || API_KEY || "" });
        const responseStream = await ai.models.generateContentStream({
          model: settings.modelName,
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          },
        });
        
        for await (const chunk of responseStream) {
          if (chunk.text) {
            onChunk(chunk.text);
          }
        }
      } else if (selectedModel === 'claude') {
        let messages = [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ];
        let fullTextLength = 0;
        const maxTotalWords = 80000;
        let count = 0;

        while (fullTextLength < maxTotalWords) {
          count++;
          const response = await fetch(`${settings.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${settings.apiKey}`
            },
            body: JSON.stringify({
              model: settings.modelName,
              messages: messages,
              temperature: 0.3,
              max_tokens: 8192,
              stream: true,
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error?.message || `API 错误 (状态码: ${response.status})`;
            throw new Error(errorMsg);
          }

          if (!response.body) throw new Error('No response body');

          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let done = false;
          let currentChunkText = '';

          let finishReason = null;

          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n').filter(line => line.trim() !== '');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const dataStr = line.replace('data: ', '');
                  if (dataStr === '[DONE]') continue;
                  try {
                    const data = JSON.parse(dataStr);
                    const content = data.choices?.[0]?.delta?.content;
                    if (content) {
                      currentChunkText += content;
                      fullTextLength += content.length;
                      onChunk(content);
                    }
                    if (data.choices?.[0]?.finish_reason) {
                      finishReason = data.choices[0].finish_reason;
                    }
                  } catch (e) {
                    // Ignore parse errors for incomplete chunks
                  }
                }
              }
            }
          }

          // 如果模型自然结束（stop），或者输出太短，说明已经完成，不需要再继续循环
          if (finishReason === 'stop' || currentChunkText.length < 50) {
            break;
          }

          messages.push({ role: 'assistant', content: currentChunkText });
          messages.push({ role: 'user', content: '继续输出，不要重复，不要总结，直接接着写' });
        }
      } else {
        // OpenAI compatible providers (DeepSeek, Kimi via proxy)
        const response = await fetch(`${settings.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`
          },
          body: JSON.stringify({
            model: settings.modelName,
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            stream: true,
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error?.message || `API 错误 (状态码: ${response.status})`;
          throw new Error(errorMsg);
        }

        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.replace('data: ', '');
                if (dataStr === '[DONE]') continue;
                try {
                  const data = JSON.parse(dataStr);
                  const content = data.choices?.[0]?.delta?.content;
                  if (content) {
                    onChunk(content);
                  }
                } catch (e) {
                  // Ignore parse errors for incomplete chunks
                }
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('AI Call Error:', error);
      
      // 针对常见的 RPC/网络错误提供更友好的提示
      let friendlyMessage = error.message;
      if (error.message?.includes('Rpc failed') || error.message?.includes('xhr error')) {
        friendlyMessage = '网络连接异常或 API 服务暂时不可用。请检查您的网络，或稍后重试。如果问题持续，请尝试更换模型。';
      } else if (error.message?.includes('API_KEY_INVALID')) {
        friendlyMessage = 'API Key 无效，请在配置面板中检查您的密钥设置。';
      }
      
      throw new Error(friendlyMessage);
    }
  };

  const handleGenerate = async (chapterId?: string) => {
    const targetChapterId = typeof chapterId === 'string' ? chapterId : activeChapterId;
    if (!activeProject || !targetChapterId) return;
    
    const targetChapter = activeProject.chapters.find(c => c.id === targetChapterId);
    if (!targetChapter || !targetChapter.content.trim()) return;
    
    setGeneratingChapterIds(prev => [...prev, targetChapterId]);
    updateChapter('', 'output', targetChapterId);
    
    try {
      let accumulatedText = '';
      await callAIStream(
        targetChapter.content,
        getSystemInstruction(activeProject.style, config.storyboardInstruction),
        (chunk) => {
          accumulatedText += chunk;
          updateChapter(accumulatedText, 'output', targetChapterId);
        }
      );
    } catch (error) {
      console.error('Generation error:', error);
      updateChapter((prev: string) => prev + '\n\n发生错误: ' + (error instanceof Error ? error.message : String(error)), 'output', targetChapterId);
    } finally {
      setGeneratingChapterIds(prev => prev.filter(id => id !== targetChapterId));
    }
  };

  const handleExtractAssets = async (chapterId?: string) => {
    const targetChapterId = typeof chapterId === 'string' ? chapterId : activeChapterId;
    if (!activeProject || !targetChapterId) return;
    
    const targetChapter = activeProject.chapters.find(c => c.id === targetChapterId);
    if (!targetChapter || !targetChapter.output) return;
    
    setExtractingChapterIds(prev => [...prev, targetChapterId]);
    try {
      let result = '';
      await callAIStream(
        `剧情原文：\n${targetChapter.content}\n\n已生成的分镜提示词：\n${targetChapter.output}`,
        getAssetExtractionInstruction(activeProject.style, config.assetExtractionInstruction),
        (chunk) => {
          result += chunk;
        }
      );
      
      let jsonStr = result.trim();
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }
      
      const data = JSON.parse(jsonStr);
      const newAssets: Asset[] = data.map((a: any) => ({
        id: crypto.randomUUID(),
        name: a.name,
        type: a.type,
        prompt: a.prompt,
        createdAt: Date.now()
      }));

      updateChapter(newAssets, 'assets', targetChapterId);
    } catch (error) {
      console.error('Asset extraction error:', error);
      alert('资产提取失败，请重试。');
    } finally {
      setExtractingChapterIds(prev => prev.filter(id => id !== targetChapterId));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadChapter = () => {
    if (!activeChapter) return;

    let content = `【剧本章节】：${activeChapter.title}\n`;
    content += `=========================================\n\n`;
    content += `【分镜提示词】\n`;
    content += `${activeChapter.output || '暂无内容'}\n\n`;
    content += `=========================================\n\n`;
    content += `【资产库】\n`;

    if (!activeChapter.assets || activeChapter.assets.length === 0) {
      content += `暂无提取的资产\n`;
    } else {
      const characters = activeChapter.assets.filter(a => a.type === 'character');
      const props = activeChapter.assets.filter(a => a.type === 'prop');
      const scenes = activeChapter.assets.filter(a => a.type === 'scene');

      if (characters.length > 0) {
        content += `\n[角色资产]\n`;
        characters.forEach(c => {
          content += `- ${c.name}:\n  ${c.prompt}\n`;
        });
      }
      if (props.length > 0) {
        content += `\n[道具资产]\n`;
        props.forEach(p => {
          content += `- ${p.name}:\n  ${p.prompt}\n`;
        });
      }
      if (scenes.length > 0) {
        content += `\n[场景资产]\n`;
        scenes.forEach(s => {
          content += `- ${s.name}:\n  ${s.prompt}\n`;
        });
      }
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeChapter.title || '未命名章节'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderHighlightedOutput = (text: string, assets: Asset[] | undefined) => {
    if (!text) return null;

    const segments = text.split(/(?=【片段)/).filter(s => s);
    
    return segments.map((segment, segmentIndex) => {
      const segmentId = `segment-${segmentIndex}`;
      
      if (!assets || assets.length === 0) {
        return <div key={segmentId} id={segmentId} className="mb-8 last:mb-0">{segment}</div>;
      }

      let matches: { name: string, index: number, length: number }[] = [];
      
      assets.forEach(asset => {
        if (!asset.name) return;
        const index = segment.indexOf(asset.name);
        if (index !== -1) {
          matches.push({ name: asset.name, index, length: asset.name.length });
        }
      });

      matches.sort((a, b) => a.index - b.index);
      
      let validMatches: typeof matches = [];
      let lastEnd = 0;
      for (const match of matches) {
        if (match.index >= lastEnd) {
          validMatches.push(match);
          lastEnd = match.index + match.length;
        }
      }

      if (validMatches.length === 0) {
        return <div key={segmentId} id={segmentId} className="mb-8 last:mb-0">{segment}</div>;
      }

      const result: React.ReactNode[] = [];
      let currentIndex = 0;

      validMatches.forEach((match, i) => {
        if (match.index > currentIndex) {
          result.push(<span key={`text-${segmentIndex}-${i}`}>{segment.slice(currentIndex, match.index)}</span>);
        }
        result.push(
          <span key={`match-${segmentIndex}-${i}`} className="text-red-500 font-bold">
            {match.name}
          </span>
        );
        currentIndex = match.index + match.length;
      });

      if (currentIndex < segment.length) {
        result.push(<span key={`text-end-${segmentIndex}`}>{segment.slice(currentIndex)}</span>);
      }

      return <div key={segmentId} id={segmentId} className="mb-8 last:mb-0">{result}</div>;
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1a1a] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
              <Sparkles size={20} />
            </div>
            <h1 className="text-lg font-bold tracking-tight">Script Optimizer Pro</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {activeProjectId && (
              <button 
                onClick={() => {
                  setActiveProjectId(null);
                  setActiveChapterId(null);
                }}
                className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1 transition-colors bg-gray-100 px-3 py-1.5 rounded-full"
              >
                <ArrowLeft size={16} />
                返回剧本列表
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-700">
              ZG
            </div>
          </div>
        </div>
      </header>

      {/* Floating Asset Library Button */}
      {activeChapterId && (
        <button
          onClick={() => setShowAssetLibrary(true)}
          className="fixed top-20 right-6 z-50 bg-white border border-black/5 shadow-2xl rounded-2xl p-4 flex flex-col items-center gap-1 hover:bg-emerald-50 hover:border-emerald-200 transition-all group active:scale-95"
        >
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition-transform">
            <Library size={20} />
          </div>
          <span className="text-[10px] font-black text-gray-500 group-hover:text-emerald-600">资产库</span>
        </button>
      )}

      {/* Floating Model Config Button */}
      <button
        onClick={() => setShowModelConfigModal(true)}
        className="fixed bottom-32 left-6 z-50 bg-white border border-black/5 shadow-2xl rounded-2xl p-4 flex flex-col items-center gap-1 hover:bg-emerald-50 hover:border-emerald-200 transition-all group active:scale-95"
      >
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 group-hover:rotate-180 transition-transform">
          <RefreshCw size={20} />
        </div>
        <span className="text-[10px] font-black text-gray-500 group-hover:text-emerald-900">模型配置</span>
      </button>

      {/* Floating Config Button */}
      <button
        onClick={() => setShowConfigModal(true)}
        className="fixed bottom-6 left-6 z-50 bg-white border border-black/5 shadow-2xl rounded-2xl p-4 flex flex-col items-center gap-1 hover:bg-emerald-50 hover:border-emerald-200 transition-all group active:scale-95"
      >
        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-black/20 group-hover:rotate-90 transition-transform">
          <Settings size={20} />
        </div>
        <span className="text-[10px] font-black text-gray-500 group-hover:text-gray-900">配置面板</span>
      </button>

      <main className="max-w-[1600px] mx-auto p-6">
        <AnimatePresence mode="wait">
          {!activeProjectId ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-gray-900">我的剧本</h2>
                  <p className="text-gray-500 mt-1 font-medium">管理你的剧本优化项目</p>
                </div>
                <button 
                  onClick={() => setShowNewProjectModal(true)}
                  className="bg-black text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-black/80 transition-all shadow-xl shadow-black/10 active:scale-95 font-bold"
                >
                  <Plus size={20} />
                  新建剧本
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-[40px] p-24 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mb-6">
                    <BookOpen size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">还没有剧本</h3>
                  <p className="text-gray-500 max-w-sm mt-3 font-medium">
                    点击“新建剧本”按钮开始你的第一个剧本优化之旅。
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {projects.map((project) => (
                    <motion.div
                      key={project.id}
                      layoutId={project.id}
                      onClick={() => setActiveProjectId(project.id)}
                      className="bg-white border border-black/[0.03] rounded-[32px] p-8 cursor-pointer hover:shadow-2xl hover:shadow-black/5 transition-all group relative overflow-hidden flex flex-col h-full"
                    >
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                          <BookOpen size={24} />
                        </div>
                        <button 
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                      <h3 className="text-xl font-black mb-2 truncate text-gray-900">{project.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-bold">
                        <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-gray-600">
                          {project.style}
                        </span>
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg">
                          {project.chapters.length} 个章节
                        </span>
                      </div>
                      <div className="mt-auto pt-8 flex items-center text-emerald-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        打开剧本 <ChevronRight size={16} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-6 h-[calc(100vh-140px)] relative"
            >
              {/* Sidebar: Chapters */}
              <motion.div 
                animate={{ width: isSidebarOpen ? 320 : 0, opacity: isSidebarOpen ? 1 : 0 }}
                className="bg-white border border-black/5 rounded-[32px] flex flex-col shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b border-black/5 flex items-center justify-between">
                  <h3 className="font-black text-lg">章节列表</h3>
                  <button 
                    onClick={handleAddChapter}
                    className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                    title="添加章节"
                  >
                    <PlusCircle size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                  {activeProject?.chapters.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                      <p className="text-sm font-bold">暂无章节</p>
                      <button 
                        onClick={handleAddChapter}
                        className="mt-4 text-xs font-black text-emerald-600 hover:underline"
                      >
                        立即添加
                      </button>
                    </div>
                  ) : (
                    activeProject?.chapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        onClick={() => setActiveChapterId(chapter.id)}
                        className={`
                          group p-4 rounded-2xl cursor-pointer transition-all border
                          ${activeChapterId === chapter.id 
                            ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                            : 'bg-white border-transparent hover:bg-gray-50'}
                        `}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {generatingChapterIds.includes(chapter.id) && (
                                <Loader2 size={12} className="animate-spin text-emerald-600" />
                              )}
                              <h4 className={`text-sm font-bold truncate ${activeChapterId === chapter.id ? 'text-emerald-900' : 'text-gray-900'}`}>
                                {chapter.title}
                              </h4>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 font-bold">
                              {new Date(chapter.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {!generatingChapterIds.includes(chapter.id) && chapter.content.trim() && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerate(chapter.id);
                                }}
                                className="p-1.5 text-gray-300 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="生成提示词"
                              >
                                <Sparkles size={14} />
                              </button>
                            )}
                            <button 
                              onClick={(e) => handleDeleteChapter(chapter.id, e)}
                              className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="删除章节"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>

              {/* Toggle Sidebar Button */}
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="absolute left-[-12px] top-1/2 -translate-y-1/2 z-10 w-6 h-12 bg-white border border-black/5 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
              >
                {isSidebarOpen ? <ChevronRight size={14} className="rotate-180" /> : <ChevronRight size={14} />}
              </button>

              {/* Main Content: Editor */}
              <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                {!activeChapterId ? (
                  <div className="flex-1 bg-white border border-black/5 rounded-[40px] flex flex-col items-center justify-center text-center p-12 shadow-sm">
                    <div className="w-24 h-24 bg-emerald-50 rounded-[32px] flex items-center justify-center text-emerald-600 mb-6">
                      <BookOpen size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900">请选择或创建一个章节</h3>
                    <p className="text-gray-500 max-w-sm mt-3 font-medium">
                      从左侧列表选择一个章节开始优化，或者点击加号创建一个新章节。
                    </p>
                    <button 
                      onClick={handleAddChapter}
                      className="mt-8 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center gap-2"
                    >
                      <PlusCircle size={20} />
                      新建章节
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                    {/* Input Area */}
                    <div className="flex flex-col bg-white border border-black/5 rounded-[40px] p-8 shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <FileText size={20} />
                          </div>
                          <input 
                            type="text"
                            value={activeChapter.title}
                            onChange={(e) => updateChapter(e.target.value, 'title')}
                            className="font-black text-xl bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-full"
                          />
                        </div>
                      </div>
                      <textarea
                        value={activeChapter.content}
                        onChange={(e) => updateChapter(e.target.value, 'content')}
                        placeholder="在此粘贴章节内容或剧本草稿..."
                        className="flex-1 w-full resize-none bg-gray-50 rounded-[32px] p-6 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-500/30 transition-all text-sm leading-relaxed font-medium"
                      />
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={() => handleGenerate()}
                          disabled={generatingChapterIds.includes(activeChapter.id) || !activeChapter.content.trim()}
                          className={`
                            px-8 py-4 rounded-[24px] font-black flex items-center gap-2 transition-all shadow-xl
                            ${generatingChapterIds.includes(activeChapter.id) || !activeChapter.content.trim() 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-emerald-600/20'}
                          `}
                        >
                          {generatingChapterIds.includes(activeChapter.id) ? (
                            <>
                              <Loader2 size={20} className="animate-spin" />
                              正在生成提示词...
                            </>
                          ) : (
                            <>
                              <Sparkles size={20} />
                              生成剧本提示词
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Output Area */}
                    <div className="flex flex-col bg-white border border-black/5 rounded-[40px] p-8 shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                            <History size={20} />
                          </div>
                          <h3 className="font-black text-xl">优化后的提示词</h3>
                        </div>
                        {activeChapter.output && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleDownloadChapter}
                              className="flex items-center gap-2 text-xs font-black text-gray-500 hover:text-emerald-600 transition-colors bg-gray-50 hover:bg-emerald-50 px-4 py-2 rounded-full"
                              title="下载为TXT文档"
                            >
                              <Download size={14} />
                              下载文档
                            </button>
                            <button
                              onClick={() => copyToClipboard(activeChapter.output)}
                              className="flex items-center gap-2 text-xs font-black text-gray-500 hover:text-emerald-600 transition-colors bg-gray-50 hover:bg-emerald-50 px-4 py-2 rounded-full"
                            >
                              {copied ? <Check size={14} /> : <Copy size={14} />}
                              {copied ? '已复制' : '复制全部'}
                            </button>
                          </div>
                        )}
                      </div>

                      {activeChapter.output && (
                        <div className="flex items-center gap-2 mb-4 overflow-x-auto custom-scrollbar pb-2">
                          {activeChapter.output.split(/(?=【片段)/).filter(s => s).map((segment, index) => {
                            const match = segment.match(/【片段\d+】/);
                            const title = match ? match[0] : `片段 ${index + 1}`;
                            return (
                              <button
                                key={`nav-${index}`}
                                onClick={() => {
                                  const el = document.getElementById(`segment-${index}`);
                                  if (el) {
                                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }
                                  copyToClipboard(segment.trim());
                                }}
                                className="whitespace-nowrap px-4 py-2 bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 text-xs font-bold rounded-xl transition-colors border border-black/5 hover:border-emerald-200 flex items-center gap-1"
                                title="点击跳转并复制该片段"
                              >
                                {title}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex-1 bg-[#0d0d0d] rounded-[32px] p-8 overflow-y-auto font-mono text-sm text-gray-300 leading-relaxed custom-scrollbar border border-white/5">
                        {activeChapter.output ? (
                          <div className="whitespace-pre-wrap">
                            {renderHighlightedOutput(activeChapter.output, activeChapter.assets)}
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center px-10">
                            <div className="w-16 h-16 border-2 border-dashed border-gray-800 rounded-3xl flex items-center justify-center mb-6">
                              <Sparkles size={32} className="opacity-20" />
                            </div>
                            <p className="font-bold">点击左侧生成按钮，优化后的分镜提示词将显示在这里。</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Asset Library Modal */}
      <AnimatePresence>
        {showAssetLibrary && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAssetLibrary(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-2xl h-full relative z-10 shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-black/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                    <Library size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">资产库</h3>
                    <p className="text-xs text-gray-500 font-bold">提取角色、道具与场景生图提示词</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAssetLibrary(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {!activeChapter?.output ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                    <Sparkles size={48} className="mb-4 opacity-20" />
                    <p className="font-bold">请先生成分镜提示词，再提取资产。</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-gray-900">资产管理</h4>
                        <button
                          onClick={() => handleExtractAssets()}
                          disabled={extractingChapterIds.includes(activeChapter.id)}
                          className="flex items-center gap-2 text-xs font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full transition-all active:scale-95"
                        >
                          {extractingChapterIds.includes(activeChapter.id) ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                          {activeChapter.assets?.length > 0 ? '重新提取' : '开始提取资产'}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl w-fit">
                        {[
                          { id: 'all', name: '全部', icon: <Library size={14} /> },
                          { id: 'character', name: '角色资产', icon: <User size={14} /> },
                          { id: 'prop', name: '道具资产', icon: <Box size={14} /> },
                          { id: 'scene', name: '场景资产', icon: <Map size={14} /> }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveAssetTab(tab.id as any)}
                            className={`
                              flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all
                              ${activeAssetTab === tab.id 
                                ? 'bg-white text-gray-900 shadow-sm' 
                                : 'text-gray-400 hover:text-gray-600'}
                            `}
                          >
                            {tab.icon}
                            {tab.name}
                            <span className={`ml-1 text-[10px] opacity-50`}>
                              ({tab.id === 'all' 
                                ? activeChapter.assets?.length || 0 
                                : activeChapter.assets?.filter(a => a.type === tab.id).length || 0})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {extractingChapterIds.includes(activeChapter.id) && (
                      <div className="py-12 flex flex-col items-center justify-center text-emerald-600 gap-4">
                        <Loader2 size={40} className="animate-spin" />
                        <p className="font-black text-sm">正在分析剧情并生成生图提示词...</p>
                      </div>
                    )}

                    {!extractingChapterIds.includes(activeChapter.id) && (activeChapter.assets?.length || 0) === 0 && (
                      <div className="py-12 border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center text-gray-400">
                        <p className="font-bold">点击上方按钮开始提取资产</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-6">
                      {activeChapter.assets?.filter(asset => activeAssetTab === 'all' || asset.type === activeAssetTab).map((asset) => (
                        <div key={asset.id} className="bg-gray-50 border border-black/[0.03] rounded-[24px] p-6 hover:shadow-lg transition-all group">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${
                                asset.type === 'character' ? 'bg-blue-100 text-blue-600' :
                                asset.type === 'prop' ? 'bg-amber-100 text-amber-600' :
                                'bg-purple-100 text-purple-600'
                              }`}>
                                {asset.type === 'character' ? <User size={18} /> :
                                 asset.type === 'prop' ? <Box size={18} /> :
                                 <Map size={18} />}
                              </div>
                              <div>
                                <h5 className="font-black text-gray-900">{asset.name}</h5>
                                <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">
                                  {asset.type === 'character' ? '角色' : asset.type === 'prop' ? '道具' : '场景'}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => copyToClipboard(asset.prompt)}
                              className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-all"
                              title="复制提示词"
                            >
                              <Copy size={16} />
                            </button>
                          </div>
                          <div className="bg-white border border-black/5 rounded-xl p-4 text-xs font-mono text-gray-600 leading-relaxed">
                            {asset.prompt}
                          </div>
                        </div>
                      ))}

                      {activeChapter.assets?.length > 0 && activeChapter.assets?.filter(asset => activeAssetTab === 'all' || asset.type === activeAssetTab).length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-50 rounded-[32px]">
                          <Box size={40} className="mb-4 opacity-20" />
                          <p className="font-bold">该分类下暂无资产</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Config Modal */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfigModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white rounded-[48px] p-10 w-full max-w-4xl max-h-[90vh] relative z-10 shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white">
                    <Sliders size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900">配置面板</h3>
                    <p className="text-sm text-gray-500 font-bold">自定义 AI 指令与生成规则</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowConfigModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-8 pr-4 custom-scrollbar">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-600" />
                      1. 分镜提示词生成指令 (Storyboard Instruction)
                    </label>
                    <button 
                      onClick={() => setConfig({...config, storyboardInstruction: DEFAULT_STORYBOARD_TEMPLATE})}
                      className="text-[10px] font-black text-emerald-600 hover:underline"
                    >
                      恢复默认
                    </button>
                  </div>
                  <textarea
                    value={config.storyboardInstruction}
                    onChange={(e) => setConfig({...config, storyboardInstruction: e.target.value})}
                    className="w-full h-48 bg-gray-50 border border-gray-100 rounded-[24px] p-6 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-xs font-mono leading-relaxed"
                  />
                  <p className="text-[10px] text-gray-400 font-bold px-2">提示：使用 {"${style}"} 作为风格占位符</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                      <Library size={16} className="text-blue-600" />
                      2. 资产提取与提示词生成指令 (Asset Extraction Instruction)
                    </label>
                    <button 
                      onClick={() => setConfig({...config, assetExtractionInstruction: DEFAULT_ASSET_EXTRACTION_TEMPLATE})}
                      className="text-[10px] font-black text-blue-600 hover:underline"
                    >
                      恢复默认
                    </button>
                  </div>
                  <textarea
                    value={config.assetExtractionInstruction}
                    onChange={(e) => setConfig({...config, assetExtractionInstruction: e.target.value})}
                    className="w-full h-48 bg-gray-50 border border-gray-100 rounded-[24px] p-6 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-xs font-mono leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                      <Box size={16} className="text-amber-600" />
                      3. 预留：生图指令 (Image Gen)
                    </label>
                    <textarea
                      value={config.imageGenInstruction}
                      onChange={(e) => setConfig({...config, imageGenInstruction: e.target.value})}
                      className="w-full h-32 bg-gray-50 border border-gray-100 rounded-[24px] p-6 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-xs font-mono leading-relaxed"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                      <RefreshCw size={16} className="text-purple-600" />
                      4. 预留：生视频指令 (Video Gen)
                    </label>
                    <textarea
                      value={config.videoGenInstruction}
                      onChange={(e) => setConfig({...config, videoGenInstruction: e.target.value})}
                      className="w-full h-32 bg-gray-50 border border-gray-100 rounded-[24px] p-6 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all text-xs font-mono leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-black/5 flex justify-end items-center">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="bg-gray-900 text-white px-10 py-4 rounded-[24px] font-black hover:bg-black transition-all shadow-xl shadow-black/20 active:scale-95 flex items-center gap-2"
                >
                  <Save size={20} />
                  保存配置
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Model Config Modal */}
      <AnimatePresence>
        {showModelConfigModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModelConfigModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white rounded-[48px] p-10 w-full max-w-6xl max-h-[90vh] relative z-10 shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white">
                    <RefreshCw size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900">模型配置</h3>
                    <p className="text-sm text-gray-500 font-bold">管理 AI 模型与 API 密钥</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModelConfigModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-8 pr-4 custom-scrollbar">
                {/* Model Selection */}
                <div className="space-y-4">
                  <label className="text-sm font-black text-gray-700">当前使用模型 (Selected Model)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['gemini', 'deepseek', 'kimi', 'claude'] as const).map((provider) => (
                      <button
                        key={provider}
                        onClick={() => setConfig({ ...config, selectedModel: provider })}
                        className={`
                          p-4 rounded-2xl border-2 transition-all flex items-center gap-3
                          ${config.selectedModel === provider 
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                            : 'border-gray-100 hover:border-gray-200 text-gray-600'}
                        `}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.selectedModel === provider ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          {provider === 'gemini' && <Sparkles size={16} />}
                          {provider === 'deepseek' && <LayoutDashboard size={16} />}
                          {provider === 'kimi' && <RefreshCw size={16} />}
                          {provider === 'claude' && <User size={16} />}
                        </div>
                        <span className="font-bold capitalize">{provider}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Provider Settings */}
                <div className="space-y-6">
                  {(['gemini', 'deepseek', 'kimi', 'claude'] as const).map((provider) => (
                    <div key={`settings-${provider}`} className={`p-6 rounded-3xl border ${config.selectedModel === provider ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100 bg-gray-50/50'}`}>
                      <h4 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                        <span className="capitalize">{provider}</span> 配置
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 mb-1 ml-1 uppercase">API Key</label>
                          <input
                            type="password"
                            value={config.models[provider].apiKey}
                            onChange={(e) => setConfig({
                              ...config,
                              models: {
                                ...config.models,
                                [provider]: { ...config.models[provider], apiKey: e.target.value }
                              }
                            })}
                            placeholder={`输入 ${provider} API Key...`}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 mb-1 ml-1 uppercase">Model Name</label>
                          <input
                            type="text"
                            value={config.models[provider].modelName}
                            onChange={(e) => setConfig({
                              ...config,
                              models: {
                                ...config.models,
                                [provider]: { ...config.models[provider], modelName: e.target.value }
                              }
                            })}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        {provider !== 'gemini' && (
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 mb-1 ml-1 uppercase">Base URL</label>
                            <input
                              type="text"
                              value={config.models[provider].baseUrl}
                              onChange={(e) => setConfig({
                                ...config,
                                models: {
                                  ...config.models,
                                  [provider]: { ...config.models[provider], baseUrl: e.target.value }
                                }
                              })}
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-black/5 flex justify-end">
                <button
                  onClick={() => setShowModelConfigModal(false)}
                  className="bg-emerald-600 text-white px-10 py-4 rounded-[24px] font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95 flex items-center gap-2"
                >
                  <Check size={20} />
                  完成设置
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Project Modal */}
      <AnimatePresence>
        {showNewProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewProjectModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white rounded-[48px] p-10 w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setShowNewProjectModal(false)} className="p-2 text-gray-400 hover:text-black transition-colors">
                  <X size={24} />
                </button>
              </div>

              <h3 className="text-3xl font-black mb-8 text-gray-900">新建剧本</h3>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-3 ml-1">剧本名称</label>
                  <input
                    autoFocus
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="给你的新剧本起个响亮的名字..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-[24px] px-6 py-4 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-lg font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4 ml-1">
                    <label className="block text-sm font-black text-gray-700">选择视觉风格</label>
                    <button
                      onClick={() => {
                        setIsAddingStyle(true);
                        setEditStyleName('');
                        setEditStyleImage('');
                      }}
                      className="text-xs font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full"
                    >
                      <Plus size={14} />
                      添加自定义风格
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {customStyles.map((style) => (
                      <div key={style.id} className="relative group">
                        <button
                          onClick={() => setNewProjectStyle(style.name)}
                          className={`
                            w-full relative flex flex-col rounded-2xl overflow-hidden transition-all border-2
                            ${newProjectStyle === style.name 
                              ? 'border-emerald-500 ring-4 ring-emerald-500/10' 
                              : 'border-transparent hover:border-gray-200'}
                          `}
                        >
                          <div className="aspect-[4/3] w-full overflow-hidden relative">
                            <img 
                              src={style.image} 
                              alt={style.name}
                              referrerPolicy="no-referrer"
                              className={`w-full h-full object-cover transition-transform duration-500 ${newProjectStyle === style.name ? 'scale-110' : 'group-hover:scale-105'}`}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
                              }}
                            />
                            <div className={`absolute inset-0 bg-black/20 transition-opacity ${newProjectStyle === style.name ? 'opacity-0' : 'group-hover:opacity-10'}`} />
                          </div>
                          <div className={`
                            p-3 text-center text-xs font-black transition-colors
                            ${newProjectStyle === style.name ? 'bg-emerald-500 text-white' : 'bg-white text-gray-700'}
                          `}>
                            {style.name}
                          </div>
                          {newProjectStyle === style.name && (
                            <div className="absolute top-2 right-2 bg-white text-emerald-600 rounded-full p-1 shadow-lg">
                              <Check size={12} strokeWidth={4} />
                            </div>
                          )}
                        </button>
                        
                        {/* Edit/Delete Actions */}
                        <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingStyle(style);
                              setEditStyleName(style.name);
                              setEditStyleImage(style.image);
                            }}
                            className="p-1.5 bg-white/90 backdrop-blur text-gray-700 hover:text-emerald-600 rounded-lg shadow-sm"
                            title="修改风格"
                          >
                            <Edit2 size={14} />
                          </button>
                          {style.id.startsWith('custom-') && (
                            <button
                              onClick={(e) => handleDeleteStyle(style.id, e)}
                              className="p-1.5 bg-white/90 backdrop-blur text-gray-700 hover:text-red-600 rounded-lg shadow-sm"
                              title="删除风格"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="flex-1 px-6 py-4 rounded-[24px] font-black text-gray-500 hover:bg-gray-100 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                  className="flex-1 px-6 py-4 rounded-[24px] font-black bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-emerald-600/30"
                >
                  创建剧本
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Style Edit/Add Modal */}
      <AnimatePresence>
        {(isAddingStyle || editingStyle) && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddingStyle(false);
                setEditingStyle(null);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-md relative z-10 shadow-2xl"
            >
              <h3 className="text-2xl font-black mb-6 text-gray-900">
                {isAddingStyle ? '添加自定义风格' : '修改风格'}
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">风格名称</label>
                  <input
                    type="text"
                    value={editStyleName}
                    onChange={(e) => setEditStyleName(e.target.value)}
                    placeholder="例如：赛博朋克 2077"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">封面图片 URL</label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <ImageIcon size={18} />
                      </div>
                      <input
                        type="text"
                        value={editStyleImage}
                        onChange={(e) => setEditStyleImage(e.target.value)}
                        placeholder="输入图片链接 (https://...)"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm"
                      />
                    </div>
                  </div>
                  {editStyleImage && (
                    <div className="mt-4 aspect-video rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                      <img 
                        src={editStyleImage} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => {
                    setIsAddingStyle(false);
                    setEditingStyle(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-2xl font-black text-gray-500 hover:bg-gray-100 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveStyle}
                  disabled={!editStyleName.trim() || !editStyleImage.trim()}
                  className="flex-1 px-4 py-3 rounded-2xl font-black bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/20"
                >
                  保存
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.1);
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
        }
      `}} />
    </div>
  );
}
