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
import { Project, Chapter, STYLES, Asset, AppConfig, StyleOption, InstructionCategory, InstructionTemplate } from './types';
import { generateImageDakka, generateImageYijia } from './lib/imageApi';
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
  
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [newAssetType, setNewAssetType] = useState<'character' | 'prop' | 'scene'>('character');
  const [newAssetName, setNewAssetName] = useState('');
  const [isExtractingSingle, setIsExtractingSingle] = useState(false);

  const [showRefineAssetModal, setShowRefineAssetModal] = useState(false);
  const [refiningAssetId, setRefiningAssetId] = useState<string | null>(null);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);

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
        claude: { provider: 'claude', modelName: 'claude-3-5-sonnet-20241022', apiKey: 'sk-wuCwGvtcQVo5o3wpAf6TMO5JJlrwVxKXkVUnckgJ14zd2FLU', baseUrl: 'https://api.bltcy.ai/v1' },
        yijia: { provider: 'yijia', modelName: 'gpt-5.2', apiKey: '', baseUrl: 'https://api.yijiarj.cn/v1' },
        wowcode: { provider: 'wowcode', modelName: 'claude-opus-4-6', apiKey: '', baseUrl: 'https://wowcode.cc/v1' }
      },
      templates: {
        storyboard: [{ id: 'default', name: '默认分镜指令', content: DEFAULT_STORYBOARD_TEMPLATE }],
        asset: [{ id: 'default', name: '默认资产提取指令', content: DEFAULT_ASSET_EXTRACTION_TEMPLATE }],
        image: [{ id: 'default', name: '默认生图指令', content: '3D render, C4D style, high-quality character portrait, white background...' }],
        video: [{ id: 'default', name: '默认视频指令', content: 'Cinematic video, 4k, high detail, smooth motion...' }]
      },
      activeTemplateIds: {
        storyboard: 'default',
        asset: 'default',
        image: 'default',
        video: 'default'
      },
      autoExtractAssets: false,
      imageProvider: 'dakka',
      imageDakkaApiKey: '',
      imageYijiaApiKey: '',
      imageDakkaModel: 'nano-banana-pro',
      imageYijiaModel: 'nano_banana_pro',
      imageAspectRatio: '16:9',
      imageSize: '2K',
      autoDownloadImages: false
    };

    const saved = localStorage.getItem('script_config_v3');
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

      // Migration for templates
      const templates = parsed.templates || defaultConfig.templates;
      const activeTemplateIds = parsed.activeTemplateIds || defaultConfig.activeTemplateIds;

      // Seed templates if they are missing but legacy instructions exist
      if (!parsed.templates) {
        if (parsed.storyboardInstruction) {
          templates.storyboard = [{ id: 'legacy', name: '已存分镜指令', content: parsed.storyboardInstruction }];
          activeTemplateIds.storyboard = 'legacy';
        }
        if (parsed.assetExtractionInstruction) {
          templates.asset = [{ id: 'legacy', name: '已存资产指令', content: parsed.assetExtractionInstruction }];
          activeTemplateIds.asset = 'legacy';
        }
        if (parsed.imageGenInstruction) {
          templates.image = [{ id: 'legacy', name: '已存生图指令', content: parsed.imageGenInstruction }];
          activeTemplateIds.image = 'legacy';
        }
        if (parsed.videoGenInstruction) {
          templates.video = [{ id: 'legacy', name: '已存视频指令', content: parsed.videoGenInstruction }];
          activeTemplateIds.video = 'legacy';
        }
      }

      return {
        ...defaultConfig,
        ...parsed,
        templates,
        activeTemplateIds,
        models: mergedModels,
        selectedModel: ['gemini', 'deepseek', 'kimi', 'claude', 'yijia', 'wowcode'].includes(parsed.selectedModel) ? parsed.selectedModel : defaultConfig.selectedModel
      };
    } else {
      // Try migrating API keys from older configs if they are present
      const oldSaved = localStorage.getItem('script_config_v2');
      if (oldSaved) {
        const parsedV2 = JSON.parse(oldSaved);
        const mergedModels = { ...defaultConfig.models };
        if (parsedV2.models) {
          Object.keys(parsedV2.models).forEach(key => {
            const provider = key as keyof typeof mergedModels;
            if (mergedModels[provider]) {
              mergedModels[provider] = {
                ...mergedModels[provider],
                ...parsedV2.models[provider],
                apiKey: parsedV2.models[provider].apiKey || mergedModels[provider].apiKey
              };
            }
          });
        }
        return {
          ...defaultConfig,
          models: mergedModels,
          selectedModel: ['gemini', 'deepseek', 'kimi', 'claude', 'yijia', 'wowcode'].includes(parsedV2.selectedModel) ? parsedV2.selectedModel : defaultConfig.selectedModel,
          imageDakkaApiKey: parsedV2.imageDakkaApiKey || '',
          imageYijiaApiKey: parsedV2.imageYijiaApiKey || '',
          imageProvider: ['dakka', 'yijia'].includes(parsedV2.imageProvider) ? parsedV2.imageProvider : defaultConfig.imageProvider
        };
      }
    }
    return defaultConfig;
  });

  const [activeConfigCategory, setActiveConfigCategory] = useState<InstructionCategory>('storyboard');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [tempTemplateName, setTempTemplateName] = useState('');
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  const [generatingChapterIds, setGeneratingChapterIds] = useState<string[]>([]);
  const [extractingChapterIds, setExtractingChapterIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [inputCopied, setInputCopied] = useState(false);
  const [assetLibraryView, setAssetLibraryView] = useState<'chapter' | 'global'>('chapter');
  const [isGeneratingImages, setIsGeneratingImages] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeChapter = activeProject?.chapters.find(c => c.id === activeChapterId);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const globalAssets = React.useMemo(() => {
    if (!activeProject) return [];
    const map = new globalThis.Map<string, Asset & { chapterIds: string[], appearances: string[] }>();
    activeProject.chapters.forEach(ch => {
      ch.assets?.forEach(asset => {
        const key = `${asset.type}-${asset.name}`;
        if (!map.has(key)) {
          map.set(key, { ...asset, chapterIds: [ch.id], appearances: [ch.title] });
        } else {
          const existing = map.get(key)!;
          if (!existing.chapterIds.includes(ch.id)) {
            existing.chapterIds.push(ch.id);
            existing.appearances.push(ch.title);
          }
          if (!existing.imageUrl && asset.imageUrl) {
             existing.imageUrl = asset.imageUrl;
             existing.imageStatus = asset.imageStatus;
          }
        }
      });
    });
    return Array.from(map.values());
  }, [activeProject]);

  const handleImportDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProject) return;

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/);
      
      // 究极正则，支持几乎所有形式：
      // - Markdown标题层级：### EP1, ## 第一章
      // - 特殊修饰符：**EP 02**, 【EP3】, [第4集]
      // - 混合搭配：EP2《莲心渡厄》, Chapter 5: Title
      const chapterRegex = /^\s*(?:#+\s*)?(?:\**\s*)?(?:[-=~_]{2,}\s*)?(?:[【\[（《<\(\-]\s*)?(?:(?:第\s*[零一二三四五六七八九十百千0-9]+\s*[章篇回折集节卷部分])|(?:(?:[Ee][Pp]|[Cc]hapter|[Vv]ol(?:ume)?|[Ee]pisode|章|篇|集|节|卷|Part|PART|Season|S)\s*[\.、：:\-]?\s*[0-9零一二三四五六七八九十百千]+))(?:[\]】）》>\)]?)?(?:[\s：:、\-]*)(.*)$/i;
      
      let currentChapterTitle = '';
      let currentChapterContent: string[] = [];
      const rawChapters: { title: string, content: string }[] = [];

      for (const line of lines) {
        const match = line.match(chapterRegex);
        if (match) {
          if (currentChapterTitle || currentChapterContent.some(l => l.trim())) {
            rawChapters.push({ 
              title: currentChapterTitle || '引言', 
              content: currentChapterContent.join('\n').trim() 
            });
          }
          currentChapterTitle = line.trim();
          currentChapterContent = [];
        } else {
          currentChapterContent.push(line);
        }
      }
      
      if (currentChapterTitle || currentChapterContent.some(l => l.trim())) {
        rawChapters.push({ 
          title: currentChapterTitle || '序章', 
          content: currentChapterContent.join('\n').trim() 
        });
      }

      const extractedChapters: { title: string, content: string }[] = [];
      const MAX_LENGTH = 5000;

      rawChapters.forEach(ch => {
        let content = ch.content;
        if (content.length <= MAX_LENGTH) {
          extractedChapters.push({ title: ch.title, content });
        } else {
          // 如果长度超过限制（5000字），强行将其进行多部分分割以免影响上下文性能和显示
          let remaining = content;
          let partIndex = 1;
          while (remaining.length > MAX_LENGTH) {
            let splitPoint = MAX_LENGTH;
            const windowStr = remaining.substring(MAX_LENGTH - 1000, MAX_LENGTH);
            
            // 优先从段落（换行符）切割
            const lastNewline = windowStr.lastIndexOf('\n');
            if (lastNewline !== -1) {
              splitPoint = MAX_LENGTH - 1000 + lastNewline + 1;
            } else {
              // 找不到换行则尝试标点符号
              const maxPunc = Math.max(
                windowStr.lastIndexOf('。'),
                windowStr.lastIndexOf('！'),
                windowStr.lastIndexOf('？'),
                windowStr.lastIndexOf('”'),
                windowStr.lastIndexOf('.')
              );
              if (maxPunc !== -1) {
                splitPoint = MAX_LENGTH - 1000 + maxPunc + 1;
              }
            }
            
            extractedChapters.push({
              title: `${ch.title} (部分 ${partIndex})`,
              content: remaining.substring(0, splitPoint).trim()
            });
            remaining = remaining.substring(splitPoint).trimStart();
            partIndex++;
          }
          if (remaining.length > 0) {
            extractedChapters.push({
              title: `${ch.title} (部分 ${partIndex})`,
              content: remaining.trim()
            });
          }
        }
      });

      if (extractedChapters.length === 0) {
        alert("未能在文档中识别出明确的章节标记。");
        return;
      }

      const newChapters: Chapter[] = extractedChapters.map((ch, index) => ({
        id: crypto.randomUUID(),
        title: ch.title,
        content: ch.content,
        output: '',
        assets: [],
        createdAt: Date.now() + index
      }));

      setProjects(projects.map(p => {
        if (p.id === activeProjectId) {
          return { ...p, chapters: [...p.chapters, ...newChapters] };
        }
        return p;
      }));
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error(err);
      alert("读取文件失败");
    }
  };

  const handleBatchGenerate = async () => {
    if (selectedChapterIds.length === 0) return;
    
    // Process concurrently
    const promises = selectedChapterIds.map(id => handleGenerate(id));
    
    setIsBatchMode(false);
    setSelectedChapterIds([]);
    
    await Promise.allSettled(promises);
  };

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
    if (!editStyleName.trim()) return;

    if (isAddingStyle) {
      const newStyle: StyleOption = {
        id: `custom-${Date.now()}`,
        name: editStyleName,
        image: editStyleImage || '',
      };
      setCustomStyles([...customStyles, newStyle]);
      setNewProjectStyle(newStyle.name);
    } else if (editingStyle) {
      setCustomStyles(customStyles.map(s => 
        s.id === editingStyle.id ? { ...s, name: editStyleName, image: editStyleImage || '' } : s
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

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

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
    setIsBatchMode(false);
    setSelectedChapterIds([]);
  };

  const handleConfirmDeleteProject = () => {
    if (!projectToDelete || deleteConfirmText !== projectToDelete.name) return;
    
    setProjects(projects.filter(p => p.id !== projectToDelete.id));
    if (activeProjectId === projectToDelete.id) {
      setActiveProjectId(null);
      setActiveChapterId(null);
    }
    setProjectToDelete(null);
    setDeleteConfirmText('');
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

  const handleAddCustomChapter = () => {
    if (!activeProjectId) return;
    const defaultName = `第 ${ (activeProject?.chapters.length || 0) + 1 } 章`;
    const chapterName = prompt('请输入自定义章节名称：', defaultName);
    if (!chapterName || !chapterName.trim()) return;
    
    const newChapter: Chapter = {
      id: crypto.randomUUID(),
      title: chapterName.trim(),
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
    setProjects(projects.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, chapters: p.chapters.filter(c => c.id !== chapterId) };
      }
      return p;
    }));
    if (activeChapterId === chapterId) setActiveChapterId(null);
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
        let baseMessages = [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ];
        let fullTextLength = 0;
        let fullText = '';
        const maxTotalWords = 80000;
        let count = 0;

        while (fullTextLength < maxTotalWords) {
          count++;
          if (count > 20) break; // 最多循环20次作为安全保护

          const currentMessages = fullText ? [
            ...baseMessages,
            { role: 'assistant', content: fullText },
            { role: 'user', content: '请无缝接着上面的最后一个字继续输出，不要任何开头语、过渡语或总结，直接输出后续内容。' }
          ] : baseMessages;

          const response = await fetch(`${settings.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${settings.apiKey}`
            },
            body: JSON.stringify({
              model: settings.modelName,
              messages: currentMessages,
              temperature: 0.3,
              max_tokens: 4096,
              stream: true,
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error?.message || `API 错误 (状态码: ${response.status})`;
            if (count > 1) {
              console.warn('API error on continuation, stopping stream:', errorMsg);
              onChunk(`\n\n[API 续写请求失败: ${errorMsg}]`);
              break;
            }
            throw new Error(errorMsg);
          }

          if (!response.body) throw new Error('No response body');

          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let done = false;
          let currentChunkText = '';
          let buffer = '';

          let finishReason = null;

          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('data: ')) {
                  const dataStr = trimmedLine.replace('data: ', '');
                  if (dataStr === '[DONE]') continue;
                  try {
                    const data = JSON.parse(dataStr);
                    const content = data.choices?.[0]?.delta?.content;
                    if (content) {
                      currentChunkText += content;
                      fullText += content;
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

          // 修复中转接口错误返回 stop 的问题：如果未以句号等结尾，视为未完成
          let isStopped = finishReason === 'stop';
          
          if (isStopped) {
            const trimmedFull = fullText.trim();
            const codeBlockMatches = trimmedFull.match(/```/g);
            if (codeBlockMatches && codeBlockMatches.length % 2 !== 0) {
              isStopped = false; // 代码块未闭合
            } else if ((trimmedFull.startsWith('{') || trimmedFull.startsWith('[')) && !trimmedFull.endsWith('}') && !trimmedFull.endsWith(']')) {
              isStopped = false; // JSON 未闭合
            } else if (systemInstruction.includes('[已完成]') && !trimmedFull.includes('[已完成]')) {
              isStopped = false; // 剧情未输出完毕标志
            } else if (!/[。！？.!?”’"\'}\]>\`]$/.test(currentChunkText.trim())) {
              isStopped = false; // 普通文本未以标点结尾
            }
          }
          
          if ((isStopped && finishReason !== 'length' && finishReason !== 'max_tokens') || (currentChunkText.length < 50 && /[。！？.!?”’"\'}\]>\`]$/.test(currentChunkText.trim()))) {
            break;
          }

          if (!currentChunkText.trim()) {
            break;
          }
        }
      } else {
        // OpenAI compatible providers (DeepSeek, Kimi via proxy)
        let baseMessages: any[] = [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ];
        let fullTextLength = 0;
        let fullText = '';
        const maxTotalWords = 80000;
        let count = 0;

        while (fullTextLength < maxTotalWords) {
          count++;
          if (count > 20) break; // 最多循环20次作为安全保护

          const currentMessages = fullText ? [
            ...baseMessages,
            { role: 'assistant', content: fullText },
            { role: 'user', content: '请无缝接着上面的最后一个字继续输出，不要任何开头语、过渡语或总结，直接输出后续内容。' }
          ] : baseMessages;

          const response = await fetch(`${settings.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${settings.apiKey}`
            },
            body: JSON.stringify({
              model: settings.modelName,
              messages: currentMessages,
              temperature: 0.7,
              max_tokens: 4096,
              stream: true,
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error?.message || `API 错误 (状态码: ${response.status})`;
            if (count > 1) {
              console.warn('API error on continuation, stopping stream:', errorMsg);
              onChunk(`\n\n[API 续写请求失败: ${errorMsg}]`);
              break;
            }
            throw new Error(errorMsg);
          }

          if (!response.body) throw new Error('No response body');

          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let done = false;
          let currentChunkText = '';
          let buffer = '';
          let finishReason = null;

          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('data: ')) {
                  const dataStr = trimmedLine.replace('data: ', '');
                  if (dataStr === '[DONE]') continue;
                  try {
                    const data = JSON.parse(dataStr);
                    const content = data.choices?.[0]?.delta?.content;
                    if (content) {
                      currentChunkText += content;
                      fullText += content;
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

          // 修复中转接口错误返回 stop 的问题：如果未以句号等结尾，视为未完成
          let isStopped = finishReason === 'stop';
          
          if (isStopped) {
            const trimmedFull = fullText.trim();
            const codeBlockMatches = trimmedFull.match(/```/g);
            if (codeBlockMatches && codeBlockMatches.length % 2 !== 0) {
              isStopped = false; // 代码块未闭合
            } else if ((trimmedFull.startsWith('{') || trimmedFull.startsWith('[')) && !trimmedFull.endsWith('}') && !trimmedFull.endsWith(']')) {
              isStopped = false; // JSON 未闭合
            } else if (systemInstruction.includes('[已完成]') && !trimmedFull.includes('[已完成]')) {
              isStopped = false; // 剧情未输出完毕标志
            } else if (!/[。！？.!?”’"\'}\]>\`]$/.test(currentChunkText.trim())) {
              isStopped = false; // 普通文本未以标点结尾
            }
          }
          
          if ((isStopped && finishReason !== 'length' && finishReason !== 'max_tokens') || (currentChunkText.length < 50 && /[。！？.!?”’"\'}\]>\`]$/.test(currentChunkText.trim()))) {
            break;
          }

          if (!currentChunkText.trim()) {
            break;
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
      } else if (error.message?.includes('当前分组上游负载已饱和')) {
        friendlyMessage = '当前使用的 AI 接口服务器负载过高，请求排队人数太多。请稍等几分钟后再试，或者在配置中切换到其他模型。';
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
      const activeTemplate = config.templates.storyboard.find(t => t.id === config.activeTemplateIds.storyboard)?.content || config.storyboardInstruction;
      await callAIStream(
        targetChapter.content,
        getSystemInstruction(activeProject.style, activeTemplate),
        (chunk) => {
          accumulatedText += chunk;
          updateChapter(accumulatedText, 'output', targetChapterId);
        }
      );

      if (config.autoExtractAssets) {
        // Auto extract using the newly generated text to avoid stale state in closure
        await handleExtractAssets(targetChapterId, accumulatedText);
      }
    } catch (error) {
      console.error('Generation error:', error);
      updateChapter((prev: string) => prev + '\n\n发生错误: ' + (error instanceof Error ? error.message : String(error)), 'output', targetChapterId);
    } finally {
      setGeneratingChapterIds(prev => prev.filter(id => id !== targetChapterId));
    }
  };

  const handleExtractAssets = async (chapterId?: string, forceOutputText?: string) => {
    const targetChapterId = typeof chapterId === 'string' ? chapterId : activeChapterId;
    if (!activeProject || !targetChapterId) return;
    
    const targetChapter = activeProject.chapters.find(c => c.id === targetChapterId);
    const finalOutput = forceOutputText ?? targetChapter?.output;
    if (!targetChapter || !finalOutput) return;
    
    setExtractingChapterIds(prev => [...prev, targetChapterId]);
    try {
      let result = '';
      const activeTemplate = config.templates.asset.find(t => t.id === config.activeTemplateIds.asset)?.content || config.assetExtractionInstruction;
      await callAIStream(
        `剧情原文：\n${targetChapter.content}\n\n已生成的分镜提示词：\n${finalOutput}`,
        getAssetExtractionInstruction(activeProject.style, activeTemplate),
        (chunk) => {
          result += chunk;
        }
      );
      
      let jsonStr = result.trim();
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      } else {
        const startIdx = jsonStr.indexOf('[');
        const endIdx = jsonStr.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          jsonStr = jsonStr.substring(startIdx, endIdx + 1);
        }
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

  const handleRefineAsset = async () => {
    if (!activeProject || !activeChapterId || !refiningAssetId || !refineInstruction.trim()) return;
    
    const targetChapter = activeProject.chapters.find(c => c.id === activeChapterId);
    const targetAsset = targetChapter?.assets.find(a => a.id === refiningAssetId);
    if (!targetChapter || !targetAsset) return;
    
    setIsRefining(true);
    try {
      let result = '';
      const prompt = `你是一个生图提示词优化专家。
当前资产名称：【${targetAsset.name}】
原提示词：\n${targetAsset.prompt}

用户的修改要求：\n${refineInstruction.trim()}

请根据用户的要求，在原提示词的基础上进行修改。
注意：
1. 必须保持原有的英文提示词格式和风格。
2. 只输出修改后的英文提示词，不要输出任何中文解释，不要使用 Markdown 代码块包裹，直接输出纯文本。`;
      
      await callAIStream(
        prompt,
        "你是一个专业的生图提示词优化助手，严格按照用户要求修改提示词，只输出最终的英文提示词文本。",
        (chunk) => {
          result += chunk;
        }
      );
      
      let finalPrompt = result.trim();
      if (finalPrompt.startsWith('```')) {
        finalPrompt = finalPrompt.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '').trim();
      }
      
      updateChapter((prevAssets: Asset[] = []) => 
        prevAssets.map(a => a.id === refiningAssetId ? { ...a, prompt: finalPrompt } : a), 
        'assets', activeChapterId
      );
      
      setRefiningAssetId(null);
      setRefineInstruction('');
      setShowRefineAssetModal(false);
    } catch (error) {
      console.error('Refine asset error:', error);
      alert('修改失败，请重试。');
    } finally {
      setIsRefining(false);
    }
  };

  const handleExtractSingleAsset = async () => {
    if (!activeProject || !activeChapterId || !newAssetName.trim()) return;
    
    const targetChapter = activeProject.chapters.find(c => c.id === activeChapterId);
    if (!targetChapter || !targetChapter.output) return;
    
    setIsExtractingSingle(true);
    try {
      let result = '';
      const typeLabel = newAssetType === 'character' ? '角色' : newAssetType === 'prop' ? '道具' : '场景';
      const prompt = `剧情原文：\n${targetChapter.content}\n\n已生成的分镜提示词：\n${targetChapter.output}\n\n特别注意：本次只需要提取指定的资产：类型为【${typeLabel}】，名称为【${newAssetName.trim()}】。请只输出这一个资产的 JSON 对象。`;
      
      const activeTemplate = config.templates.asset.find(t => t.id === config.activeTemplateIds.asset)?.content || config.assetExtractionInstruction;
      await callAIStream(
        prompt,
        getAssetExtractionInstruction(activeProject.style, activeTemplate),
        (chunk) => {
          result += chunk;
        }
      );
      
      let jsonStr = result.trim();
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      } else {
        const startIdxObj = jsonStr.indexOf('{');
        const endIdxObj = jsonStr.lastIndexOf('}');
        const startIdxArr = jsonStr.indexOf('[');
        const endIdxArr = jsonStr.lastIndexOf(']');
        
        if (startIdxArr !== -1 && endIdxArr !== -1 && (startIdxObj === -1 || startIdxArr < startIdxObj)) {
          jsonStr = jsonStr.substring(startIdxArr, endIdxArr + 1);
        } else if (startIdxObj !== -1 && endIdxObj !== -1) {
          jsonStr = jsonStr.substring(startIdxObj, endIdxObj + 1);
        }
      }
      
      const data = JSON.parse(jsonStr);
      const newAssets: Asset[] = (Array.isArray(data) ? data : [data]).map((a: any) => ({
        id: crypto.randomUUID(),
        name: a.name || newAssetName.trim(),
        type: a.type || newAssetType,
        prompt: a.prompt,
        createdAt: Date.now()
      }));

      updateChapter((prevAssets: Asset[] = []) => [...prevAssets, ...newAssets], 'assets', activeChapterId);
      setShowAddAssetModal(false);
      setNewAssetName('');
    } catch (error) {
      console.error('Single asset extraction error:', error);
      alert('资产提取失败，请重试。');
    } finally {
      setIsExtractingSingle(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateImage = async (assetType: 'character' | 'prop' | 'scene', assetName: string, promptInfo: string) => {
    if (!activeProjectId) return;
    const globalKey = `${assetType}-${assetName}`;
    setIsGeneratingImages(prev => ({ ...prev, [globalKey]: true }));

    setProjects(prevProjects => prevProjects.map(p => {
      if (p.id !== activeProjectId) return p;
      return {
        ...p,
        chapters: p.chapters.map(c => {
          if (!c.assets) return c;
          return {
            ...c,
            assets: c.assets.map(a => {
              if (a.type === assetType && a.name === assetName) {
                return { ...a, imageStatus: 'generating' as const };
              }
              return a;
            })
          };
        })
      };
    }));

    try {
       const fullPrompt = promptInfo;
       let url = '';
       if (config.imageProvider === 'dakka') {
         if (!config.imageDakkaApiKey) throw new Error("请先在配置中填写 Dakka API Key");
         url = await generateImageDakka(
           config.imageDakkaApiKey,
           fullPrompt,
           config.imageDakkaModel,
           config.imageAspectRatio,
           config.imageSize
         );
       } else {
         if (!config.imageYijiaApiKey) throw new Error("请先在配置中填写 意佳 API Key");
         url = await generateImageYijia(
           config.imageYijiaApiKey,
           fullPrompt,
           config.imageYijiaModel,
           config.imageAspectRatio
         );
       }

       setProjects(prevProjects => prevProjects.map(p => {
          if (p.id !== activeProjectId) return p;
          return {
            ...p,
            chapters: p.chapters.map(c => {
              if (!c.assets) return c;
              return {
                ...c,
                assets: c.assets.map(a => {
                  if (a.type === assetType && a.name === assetName) {
                    return { ...a, imageStatus: 'success' as const, imageUrl: url };
                  }
                  return a;
                })
              };
            })
          };
        }));
        
        if (config.autoDownloadImages) {
          handleDownloadImage(url, assetType, assetName, 0);
        }

    } catch (err: any) {
        alert("生图失败: " + err.message);
        setProjects(prevProjects => prevProjects.map(p => {
          if (p.id !== activeProjectId) return p;
          return {
            ...p,
            chapters: p.chapters.map(c => {
              if (!c.assets) return c;
              return {
                ...c,
                assets: c.assets.map(a => {
                  if (a.type === assetType && a.name === assetName) {
                    return { ...a, imageStatus: 'error' as const };
                  }
                  return a;
                })
              };
            })
          };
        }));
    } finally {
       setIsGeneratingImages(prev => ({ ...prev, [globalKey]: false }));
    }
  };

  const handleBatchGenerateImages = async (type: 'character' | 'prop' | 'scene') => {
    const assetsSource = assetLibraryView === 'global' ? globalAssets : (activeChapter?.assets || []);
    const pendingAssets = assetsSource.filter(a => a.type === type && (!a.imageUrl || a.imageStatus === 'error') && !isGeneratingImages[`${a.type}-${a.name}`]);
    for (const a of pendingAssets) {
       handleGenerateImage(a.type, a.name, a.prompt);
    }
  };

  const handleDownloadImage = async (url: string, prefix: string, assetName: string, num: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      const typeChar = prefix === 'character' ? 'c' : prefix === 'prop' ? 'p' : 's';
      let chId = 'global';
      // we can try to guess first appearance
      const matchAsset = globalAssets.find(ga => ga.type === prefix && ga.name === assetName);
      if (matchAsset && matchAsset.appearances.length > 0) {
         const t = matchAsset.appearances[0];
         const matchInfo = t.match(/[0-9]+/);
         if (matchInfo) chId = `ep${matchInfo[0]}`;
      }
      a.download = `${activeProject?.name || 'PROJECT'}_${chId}_${typeChar}${num}_${assetName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch(err) {
      alert("下载图像失败，这可能是跨域限制导致的。请右键图像保存。");
    }
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
        let startIndex = 0;
        while (true) {
          const index = segment.indexOf(asset.name, startIndex);
          if (index === -1) break;
          matches.push({ name: asset.name, index, length: asset.name.length });
          startIndex = index + asset.name.length;
        }
      });

      matches.sort((a, b) => {
        if (a.index !== b.index) {
          return a.index - b.index;
        }
        return b.length - a.length;
      });
      
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
    <div className="min-h-screen bg-transparent text-[#1a1a1a] font-sans selection:bg-fuchsia-200 selection:text-fuchsia-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-violet-100 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
              <Sparkles size={20} />
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              Script Optimizer Pro
              {activeProject && <span className="ml-2 font-black text-slate-800 hidden sm:inline">- {activeProject.name}</span>}
            </h1>
            {activeProject && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-violet-50 rounded-lg border border-violet-100 ml-4">
                <span className="text-xs text-slate-500 font-bold">风格</span>
                <span className="text-xs text-violet-700 font-black">{activeProject.style}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {activeProjectId && (
              <button 
                onClick={() => {
                  setActiveProjectId(null);
                  setActiveChapterId(null);
                }}
                className="text-sm font-bold text-slate-500 hover:text-violet-700 flex items-center gap-1 transition-colors bg-slate-100 hover:bg-violet-50 px-3 py-1.5 rounded-full shadow-sm"
              >
                <ArrowLeft size={16} />
                返回剧本列表
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-xs font-bold text-violet-700">
              ZG
            </div>
          </div>
        </div>
      </header>

      {/* Floating Asset Library Button */}
      {activeChapterId && (
        <button
          onClick={() => setShowAssetLibrary(true)}
          className="fixed top-20 right-6 z-50 bg-white/90 backdrop-blur-md border border-violet-100 shadow-2xl rounded-3xl p-4 flex flex-col items-center gap-1 hover:bg-violet-50 hover:border-violet-200 transition-all group active:scale-95"
        >
          <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-600/20 group-hover:scale-110 transition-transform">
            <Library size={20} />
          </div>
          <span className="text-[10px] font-black text-slate-500 group-hover:text-violet-600">资产库</span>
        </button>
      )}

      {/* Floating Model Config Button */}
      <button
        onClick={() => setShowModelConfigModal(true)}
        className="fixed bottom-32 left-6 z-50 bg-white/90 backdrop-blur-md border border-violet-100 shadow-2xl rounded-3xl p-4 flex flex-col items-center gap-1 hover:bg-violet-50 hover:border-violet-200 transition-all group active:scale-95"
      >
        <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-600/20 group-hover:rotate-180 transition-transform">
          <RefreshCw size={20} />
        </div>
        <span className="text-[10px] font-black text-slate-500 group-hover:text-violet-900">模型配置</span>
      </button>

      {/* Floating Config Button */}
      <button
        onClick={() => setShowConfigModal(true)}
        className="fixed bottom-6 left-6 z-50 bg-white/90 backdrop-blur-md border border-violet-100 shadow-2xl rounded-3xl p-4 flex flex-col items-center gap-1 hover:bg-violet-50 hover:border-violet-200 transition-all group active:scale-95"
      >
        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-500/30 group-hover:rotate-90 transition-transform">
          <Settings size={20} />
        </div>
        <span className="text-[10px] font-black text-slate-500 group-hover:text-slate-800">配置面板</span>
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
                  <h2 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-fuchsia-600">我的剧本</h2>
                  <p className="text-slate-500 mt-1 font-medium">管理你的剧本优化项目</p>
                </div>
                <button 
                  onClick={() => setShowNewProjectModal(true)}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-none px-6 py-3 rounded-3xl flex items-center gap-2 hover:opacity-90 hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all shadow-xl shadow-violet-500/20 active:scale-95 font-black"
                >
                  <Plus size={20} />
                  新建剧本
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-sm border-2 border-dashed border-violet-100/50 rounded-[40px] p-24 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="w-20 h-20 bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-full flex items-center justify-center text-violet-400 mb-6 shadow-inner">
                    <BookOpen size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">还没有剧本</h3>
                  <p className="text-slate-500 max-w-sm mt-3 font-medium">
                    点击“新建剧本”按钮开始你的第一个剧本优化之旅。
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {projects.map((project) => (
                    <motion.div
                      key={project.id}
                      layoutId={project.id}
                      onClick={() => {
                        setActiveProjectId(project.id);
                        setIsBatchMode(false);
                        setSelectedChapterIds([]);
                      }}
                      className="bg-white border border-violet-100 rounded-[40px] p-8 cursor-pointer hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden flex flex-col h-full"
                    >
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-violet-50 rounded-3xl text-violet-600">
                          <BookOpen size={24} />
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToDelete(project);
                            setDeleteConfirmText('');
                          }}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all hover:scale-110"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                      <h3 className="text-xl font-black mb-2 truncate text-slate-800">{project.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-bold">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-xl text-slate-600">
                          {project.style}
                        </span>
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg">
                          {project.chapters.length} 个章节
                        </span>
                      </div>
                      <div className="mt-auto pt-8 flex items-center text-violet-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
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
                className="bg-white/90 backdrop-blur-xl border border-violet-100/50 rounded-[40px] flex flex-col shadow-xl shadow-violet-900/5 overflow-hidden relative"
              >
                <div className="p-6 border-b border-violet-100 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-lg">章节列表</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsBatchMode(!isBatchMode);
                          setSelectedChapterIds([]);
                        }}
                        className={`p-2 rounded-3xl transition-colors ${isBatchMode ? 'bg-violet-600 text-white shadow-lg' : 'bg-violet-50 text-violet-600 hover:bg-violet-100'} `}
                        title="批量操作"
                      >
                        <Library size={18} />
                      </button>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-3xl hover:bg-indigo-100 hover:scale-105 transition-colors"
                        title="导入文档自动分章"
                      >
                        <Download size={18} className="rotate-180" />
                      </button>
                      <button 
                        onClick={handleAddChapter}
                        className="p-2 bg-violet-100 text-violet-700 rounded-3xl hover:bg-violet-200 hover:scale-105 transition-colors"
                        title="添加章节"
                      >
                        <PlusCircle size={18} />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImportDocument} 
                        accept=".txt,.md" 
                        className="hidden" 
                      />
                    </div>
                  </div>
                  {isBatchMode && (
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <button
                        onClick={() => setSelectedChapterIds(
                          selectedChapterIds.length === activeProject?.chapters.length 
                            ? [] 
                            : activeProject?.chapters.map(c => c.id) || []
                        )}
                        className="hover:text-violet-600 transition-colors flex items-center gap-1"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedChapterIds.length === activeProject?.chapters.length && activeProject?.chapters.length > 0 ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-300'}`}>
                          {selectedChapterIds.length === activeProject?.chapters.length && activeProject?.chapters.length > 0 && <Check size={10} />}
                        </div>
                        全选
                      </button>
                      <span className="text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                        已选 {selectedChapterIds.length} 章
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between bg-violet-50/50 p-2.5 rounded-xl border border-violet-100">
                    <span className="text-xs font-bold text-violet-800">生成提示词后自动提取资产</span>
                    <button
                      onClick={() => setConfig({...config, autoExtractAssets: !config.autoExtractAssets})}
                      className={`w-8 h-4 rounded-full transition-colors relative ${config.autoExtractAssets ? 'bg-violet-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-3 h-3 bg-white rounded-full absolute top-[2px] transition-all ${config.autoExtractAssets ? 'left-[18px]' : 'left-[2px]'}`} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar pb-24">
                  {activeProject?.chapters.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                      <p className="text-sm font-bold border border-dashed border-slate-300 w-full p-4 rounded-xl">支持导入 .txt 文档自动分章</p>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors"
                      >
                        立即导入
                      </button>
                    </div>
                  ) : (
                    activeProject?.chapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        onClick={() => {
                          if (isBatchMode) {
                            setSelectedChapterIds(prev => 
                              prev.includes(chapter.id) ? prev.filter(id => id !== chapter.id) : [...prev, chapter.id]
                            );
                          } else {
                            setActiveChapterId(chapter.id);
                          }
                        }}
                        className={`
                          group p-4 rounded-3xl cursor-pointer transition-all border
                          ${activeChapterId === chapter.id && !isBatchMode
                            ? 'bg-gradient-to-br from-violet-50 to-fuchsia-50 border-violet-200 shadow-md shadow-violet-500/10' 
                            : isBatchMode && selectedChapterIds.includes(chapter.id)
                            ? 'bg-violet-50/50 border-violet-300 shadow-sm'
                            : 'bg-white border-transparent hover:bg-slate-50/80'}
                        `}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 flex items-start gap-3">
                            {isBatchMode && (
                              <div className={`mt-1 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedChapterIds.includes(chapter.id) ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-300'}`}>
                                {selectedChapterIds.includes(chapter.id) && <Check size={10} />}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {generatingChapterIds.includes(chapter.id) && (
                                  <Loader2 size={12} className="animate-spin text-violet-600" />
                                )}
                                <input
                                  type="text"
                                  value={chapter.title}
                                  onChange={(e) => updateChapter(e.target.value, 'title', chapter.id)}
                                  onClick={(e) => { if (isBatchMode) e.preventDefault(); }}
                                  readOnly={isBatchMode}
                                  className={`text-sm font-bold truncate bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-full ${activeChapterId === chapter.id && !isBatchMode ? 'text-violet-900' : 'text-slate-800'}`}
                                  title={isBatchMode ? '' : "点击修改章节名称"}
                                />
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1 font-bold">
                                {new Date(chapter.createdAt).toLocaleDateString()} · 约 {chapter.content.replace(/\s/g, '').length} 字
                              </p>
                            </div>
                          </div>
                          {!isBatchMode && (
                            <div className="flex items-center gap-1">
                              {!generatingChapterIds.includes(chapter.id) && chapter.content.trim() && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGenerate(chapter.id);
                                  }}
                                  className="p-1.5 text-gray-300 hover:text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity"
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
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {isBatchMode && selectedChapterIds.length > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-violet-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
                    <button
                      onClick={handleBatchGenerate}
                      disabled={selectedChapterIds.some(id => generatingChapterIds.includes(id))}
                      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {selectedChapterIds.some(id => generatingChapterIds.includes(id)) ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          已有选中章节在生成...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          并发生成选中的 {selectedChapterIds.length} 章
                        </>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Toggle Sidebar Button */}
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="absolute left-[-12px] top-1/2 -translate-y-1/2 z-10 w-6 h-12 bg-white border border-violet-100 rounded-full flex items-center justify-center shadow-md hover:bg-slate-50/80 transition-colors"
              >
                {isSidebarOpen ? <ChevronRight size={14} className="rotate-180" /> : <ChevronRight size={14} />}
              </button>

              {/* Main Content: Editor */}
              <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                {!activeChapterId ? (
                  <div className="flex-1 bg-white border border-violet-100 rounded-[40px] flex flex-col items-center justify-center text-center p-12 shadow-sm">
                    <div className="w-24 h-24 bg-violet-50 rounded-[40px] flex items-center justify-center text-violet-600 mb-6">
                      <BookOpen size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">请选择或创建一个章节</h3>
                    <p className="text-slate-500 max-w-sm mt-3 font-medium">
                      从左侧列表选择一个章节开始优化，或者点击加号创建一个新章节。
                    </p>
                    <button 
                      onClick={handleAddChapter}
                      className="mt-8 bg-violet-600 text-white px-8 py-3 rounded-3xl font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20 active:scale-95 flex items-center gap-2"
                    >
                      <PlusCircle size={20} />
                      新建章节
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                    {/* Input Area */}
                    <div className="flex flex-col bg-white border border-violet-100 rounded-[40px] p-8 shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <FileText size={20} />
                          </div>
                          <input 
                            type="text"
                            value={activeChapter.title}
                            onChange={(e) => updateChapter(e.target.value, 'title')}
                            className="font-black text-xl bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-full"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(activeChapter.content);
                              setInputCopied(true);
                              setTimeout(() => setInputCopied(false), 2000);
                            }}
                            className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-100/50 rounded-xl transition-colors flex items-center gap-1 text-sm font-medium"
                            title="复制内容"
                          >
                            {inputCopied ? <Check size={16} /> : <Copy size={16} />}
                            {inputCopied ? '已复制' : '复制'}
                          </button>
                          <button
                            onClick={() => updateChapter('', 'content')}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1 text-sm font-medium"
                            title="清空内容"
                          >
                            <Trash2 size={16} />
                            清空
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={activeChapter.content}
                        onChange={(e) => updateChapter(e.target.value, 'content')}
                        placeholder="在此粘贴章节内容或剧本草稿..."
                        className="flex-1 w-full resize-none bg-slate-50/50 rounded-[40px] p-8 focus:outline-none focus:ring-4 focus:ring-violet-500/10 border border-violet-100/50 focus:border-violet-300 transition-all text-sm leading-relaxed font-medium shadow-inner"
                      />
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={() => handleGenerate()}
                          disabled={generatingChapterIds.includes(activeChapter.id) || !activeChapter.content.trim()}
                          className={`
                            px-8 py-4 rounded-[24px] font-black flex items-center gap-2 transition-all shadow-xl
                            ${generatingChapterIds.includes(activeChapter.id) || !activeChapter.content.trim() 
                              ? 'bg-gray-100 text-slate-400 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 active:scale-95 shadow-violet-600/20 border-none'}
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
                    <div className="flex flex-col bg-white border border-violet-100 rounded-[40px] p-8 shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-fuchsia-50 text-fuchsia-600 rounded-xl">
                            <History size={20} />
                          </div>
                          <h3 className="font-black text-xl">优化后的提示词</h3>
                        </div>
                        {activeChapter.output && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleDownloadChapter}
                              className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-violet-600 transition-colors bg-gray-50 hover:bg-violet-100 px-4 py-2 rounded-full hover:bg-violet-200"
                              title="下载为TXT文档"
                            >
                              <Download size={14} />
                              下载文档
                            </button>
                            <button
                              onClick={() => copyToClipboard(activeChapter.output)}
                              className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-violet-600 transition-colors bg-gray-50 hover:bg-violet-100 px-4 py-2 rounded-full hover:bg-violet-200"
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
                                className="whitespace-nowrap px-4 py-2 bg-white hover:bg-violet-50 text-slate-600 hover:text-violet-600 text-xs font-bold rounded-xl transition-all border border-violet-100 hover:border-violet-200 shadow-sm hover:shadow-md flex items-center gap-1"
                                title="点击跳转并复制该片段"
                              >
                                {title}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex-1 bg-slate-900 rounded-[40px] p-8 overflow-y-auto font-mono text-sm text-slate-300 leading-relaxed custom-scrollbar border border-slate-800 shadow-inner">
                        {activeChapter.output ? (
                          <div className="whitespace-pre-wrap">
                            {renderHighlightedOutput(activeChapter.output, activeChapter.assets)}
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center px-10">
                            <div className="w-16 h-16 border-2 border-dashed border-slate-700 rounded-3xl flex items-center justify-center mb-6">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAssetLibrary(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white/95 backdrop-blur-xl w-full max-w-5xl h-[90vh] relative z-10 shadow-2xl flex flex-col border border-white/20 rounded-[48px] overflow-hidden"
            >
              <div className="p-8 border-b border-violet-100/50 bg-white/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center text-white">
                    <Library size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">资产库</h3>
                    <p className="text-xs text-slate-500 font-bold">管理与生成项目资产图</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-full shadow-inner">
                  <button
                    onClick={() => setAssetLibraryView('chapter')}
                    className={`px-6 py-2 rounded-full text-sm font-black transition-all ${assetLibraryView === 'chapter' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    当前章节资产
                  </button>
                  <button
                    onClick={() => setAssetLibraryView('global')}
                    className={`px-6 py-2 rounded-full text-sm font-black transition-all ${assetLibraryView === 'global' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    剧本总资产库
                  </button>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <span className="text-sm font-bold text-slate-600">自动下载出图</span>
                  <button
                    onClick={() => setConfig({ ...config, autoDownloadImages: !config.autoDownloadImages })}
                    className={`w-12 h-6 rounded-full relative transition-colors ${config.autoDownloadImages ? 'bg-violet-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-1 bottom-1 left-1 bg-white w-4 rounded-full transition-transform ${config.autoDownloadImages ? 'translate-x-6' : 'translate-x-0'}`}></span>
                  </button>
                </div>

                <div className="w-10"></div> {/* Spacer for alignment */}
                <button 
                  onClick={() => setShowAssetLibrary(false)}
                  className="absolute right-8 top-8 p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {(assetLibraryView === 'chapter' && !activeChapter?.output) ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                    <Sparkles size={48} className="mb-4 opacity-20" />
                    <p className="font-bold">该章节请先生成分镜提示词，再提取资产。</p>
                  </div>
                ) : (assetLibraryView === 'global' && globalAssets.length === 0) ? (
                   <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                    <Library size={48} className="mb-4 opacity-20" />
                    <p className="font-bold">项目中暂无提取任何资产。</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl w-fit shadow-inner">
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
                                  ? 'bg-white text-violet-700 shadow-sm ring-1 ring-black/5' 
                                  : 'text-slate-400 hover:text-gray-600'}
                              `}
                            >
                              {tab.icon}
                              {tab.name}
                              <span className={`ml-1 text-[10px] opacity-50`}>
                                ({tab.id === 'all' 
                                  ? (assetLibraryView === 'global' ? globalAssets.length : activeChapter?.assets?.length || 0) 
                                  : (assetLibraryView === 'global' ? globalAssets.filter(a => a.type === tab.id).length : activeChapter?.assets?.filter(a => a.type === tab.id).length || 0)})
                              </span>
                            </button>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {assetLibraryView === 'chapter' && (
                            <>
                              <button
                                onClick={() => setShowAddAssetModal(true)}
                                className="flex items-center gap-2 text-xs font-black text-gray-600 hover:text-slate-800 bg-slate-100 px-4 py-2 rounded-full hover:bg-slate-200 transition-all active:scale-95"
                              >
                                <Plus size={14} />
                                添加资产
                              </button>
                              <button
                                onClick={() => handleExtractAssets()}
                                disabled={extractingChapterIds.includes(activeChapter!.id)}
                                className="flex items-center gap-2 text-xs font-black text-violet-600 hover:text-violet-700 bg-violet-100 px-4 py-2 rounded-full hover:bg-violet-200 transition-all active:scale-95"
                              >
                                {extractingChapterIds.includes(activeChapter!.id) ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                {activeChapter!.assets?.length > 0 ? '重新提取' : '开始提取资产'}
                              </button>
                            </>
                          )}
                          {activeAssetTab !== 'all' && (
                            <button
                              onClick={() => handleBatchGenerateImages(activeAssetTab as any)}
                              className="flex items-center gap-2 text-xs font-black text-amber-600 hover:text-amber-700 bg-amber-100 px-4 py-2 rounded-full hover:bg-amber-200 transition-all active:scale-95"
                            >
                              <ImageIcon size={14} />
                              一键生成所有{activeAssetTab === 'character' ? '角色' : activeAssetTab === 'prop' ? '道具' : '场景'}
                            </button>
                          )}
                        </div>
                      </div>

                    </div>

                    {assetLibraryView === 'chapter' && extractingChapterIds.includes(activeChapter!.id) && (
                      <div className="py-12 flex flex-col items-center justify-center text-violet-600 gap-4">
                        <Loader2 size={40} className="animate-spin" />
                        <p className="font-black text-sm">正在分析剧情并生成生图提示词...</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(assetLibraryView === 'global' ? globalAssets : (activeChapter?.assets || [])).filter(asset => activeAssetTab === 'all' || asset.type === activeAssetTab).map((asset, assetIdx) => (
                        <div key={asset.id || assetIdx} className="bg-gray-50 border border-violet-100 rounded-[32px] p-6 flex flex-col gap-4 hover:shadow-lg transition-all group relative overflow-hidden">
                          
                          <div className="flex items-start justify-between z-10 w-full gap-4">
                             <div className="flex-1 min-w-0 flex flex-col">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`p-2 rounded-xl flex-shrink-0 ${
                                    asset.type === 'character' ? 'bg-blue-100 text-blue-600' :
                                    asset.type === 'prop' ? 'bg-amber-100 text-amber-600' :
                                    'bg-purple-100 text-purple-600'
                                  }`}>
                                    {asset.type === 'character' ? <User size={18} /> :
                                     asset.type === 'prop' ? <Box size={18} /> :
                                     <Map size={18} />}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h5 className="font-black text-slate-800 text-lg truncate">{asset.name}</h5>
                                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                                      {asset.type === 'character' ? '角色' : asset.type === 'prop' ? '道具' : '场景'}
                                    </span>
                                  </div>
                                </div>

                                {assetLibraryView === 'global' && 'appearances' in asset && (
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {(asset as any).appearances.map((ep: string, idx: number) => (
                                      <span key={idx} className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] rounded-full font-bold">{ep}</span>
                                    ))}
                                  </div>
                                )}
                                
                                <div className="bg-white border border-violet-100 rounded-xl p-3 text-xs font-mono text-gray-500 leading-relaxed max-h-32 overflow-y-auto custom-scrollbar flex-1 relative">
                                  {asset.prompt}
                                  <div className="sticky top-0 right-0 flex justify-end">
                                      <button onClick={() => copyToClipboard(asset.prompt)} className="p-1.5 bg-white/80 hover:bg-violet-100 rounded-md text-slate-400 hover:text-violet-600 transition-colors shadow-sm"><Copy size={12} /></button>
                                  </div>
                                </div>
                             </div>

                             {/* Right Side Image Box */}
                             <div className="w-[180px] h-[180px] bg-slate-100 rounded-2xl flex-shrink-0 border-2 border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden group/img">
                               {isGeneratingImages[`${asset.type}-${asset.name}`] || asset.imageStatus === 'generating' ? (
                                  <div className="flex flex-col items-center gap-2 text-violet-500">
                                      <Loader2 size={32} className="animate-spin" />
                                      <span className="text-[10px] font-bold">生图中</span>
                                  </div>
                               ) : asset.imageUrl ? (
                                 <>
                                  <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity">
                                      <button onClick={() => window.open(asset.imageUrl, '_blank')} className="px-4 py-1.5 bg-white/20 hover:bg-white/40 text-white rounded-full text-xs font-bold backdrop-blur-sm">查看大图</button>
                                      <button onClick={() => handleDownloadImage(asset.imageUrl!, asset.type, asset.name, assetIdx)} className="px-4 py-1.5 bg-white text-slate-800 hover:bg-slate-100 rounded-full text-xs font-bold shadow-lg flex items-center gap-1"><Download size={14}/> 下载</button>
                                      <button onClick={() => handleGenerateImage(asset.type as any, asset.name, asset.prompt)} className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-full text-xs font-bold shadow-lg">重新生成</button>
                                  </div>
                                 </>
                               ) : (
                                  <button onClick={() => handleGenerateImage(asset.type as any, asset.name, asset.prompt)} className="flex flex-col items-center gap-2 text-slate-400 hover:text-violet-600 transition-colors hover:scale-110">
                                      <ImageIcon size={32} />
                                      <span className="text-[10px] font-bold">生成图片</span>
                                  </button>
                               )}
                               {asset.imageStatus === 'error' && !isGeneratingImages[`${asset.type}-${asset.name}`] && (
                                  <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-sm">失败</div>
                               )}
                             </div>
                          </div>
                          
                          {assetLibraryView === 'chapter' && (
                             <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-auto">
                                <button
                                  onClick={() => {
                                    setRefiningAssetId(asset.id);
                                    setRefineInstruction('');
                                    setShowRefineAssetModal(true);
                                  }}
                                  className="px-3 py-1.5 text-slate-400 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-all flex items-center gap-1"
                                >
                                  <Sparkles size={12} />
                                  <span className="text-[10px] font-bold">AI 修改提示词</span>
                                </button>
                             </div>
                          )}
                        </div>
                      ))}
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white/95 backdrop-blur-xl rounded-[48px] p-8 w-full max-w-7xl h-[90vh] relative z-10 shadow-2xl flex flex-col overflow-hidden border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-900 rounded-3xl flex items-center justify-center text-white">
                    <Sliders size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">配置面板</h3>
                    <p className="text-sm text-slate-500 font-bold">自定义 AI 指令与生成规则</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-[10px] font-black animate-pulse">
                    <Check size={12} />
                    已自动保存
                  </div>
                  <button 
                    onClick={() => setShowConfigModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex gap-8">
                {/* Sidebar Navigation */}
                <div className="w-64 flex flex-col gap-2 border-r border-violet-100 pr-6">
                  {[
                    { id: 'storyboard', name: '分镜提示词指令', icon: Sparkles, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { id: 'asset', name: '资产提取指令', icon: Library, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { id: 'image', name: '预留：生图指令', icon: Box, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { id: 'video', name: '预留：生视频指令', icon: RefreshCw, color: 'text-purple-600', bg: 'bg-purple-50' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveConfigCategory(cat.id as InstructionCategory)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm
                        ${activeConfigCategory === cat.id 
                          ? `${cat.bg} ${cat.color} shadow-sm ring-1 ring-inset ring-violet-200` 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
                      `}
                    >
                      <cat.icon size={18} />
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Template Management */}
                  <div className="mb-6 flex flex-wrap items-center gap-2">
                    {config.templates[activeConfigCategory].map((template) => (
                      <div key={template.id} className="relative group">
                        {editingTemplateId === template.id ? (
                          <div className="flex items-center gap-1 bg-white border-2 border-violet-500 rounded-xl px-2 py-1 shadow-md">
                            <input
                              autoFocus
                              value={tempTemplateName}
                              onChange={(e) => setTempTemplateName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const updatedTemplates = config.templates[activeConfigCategory].map(t => 
                                    t.id === template.id ? { ...t, name: tempTemplateName.trim() || t.name } : t
                                  );
                                  setConfig({
                                    ...config,
                                    templates: { ...config.templates, [activeConfigCategory]: updatedTemplates }
                                  });
                                  setEditingTemplateId(null);
                                } else if (e.key === 'Escape') {
                                  setEditingTemplateId(null);
                                }
                              }}
                              onBlur={() => {
                                const updatedTemplates = config.templates[activeConfigCategory].map(t => 
                                  t.id === template.id ? { ...t, name: tempTemplateName.trim() || t.name } : t
                                );
                                setConfig({
                                  ...config,
                                  templates: { ...config.templates, [activeConfigCategory]: updatedTemplates }
                                });
                                setEditingTemplateId(null);
                              }}
                              className="text-xs font-black text-slate-800 outline-none w-24"
                            />
                            <Check 
                              size={14} 
                              className="text-green-500 cursor-pointer" 
                              onClick={() => {
                                const updatedTemplates = config.templates[activeConfigCategory].map(t => 
                                  t.id === template.id ? { ...t, name: tempTemplateName.trim() || t.name } : t
                                );
                                setConfig({
                                  ...config,
                                  templates: { ...config.templates, [activeConfigCategory]: updatedTemplates }
                                });
                                setEditingTemplateId(null);
                              }}
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfig({
                              ...config,
                              activeTemplateIds: { ...config.activeTemplateIds, [activeConfigCategory]: template.id }
                            })}
                            className={`
                              px-4 py-2 rounded-xl text-xs font-black transition-all border-2 flex items-center gap-2
                              ${config.activeTemplateIds[activeConfigCategory] === template.id
                                ? 'border-violet-500 bg-violet-500 text-white shadow-md'
                                : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}
                            `}
                          >
                            {template.name}
                            {config.activeTemplateIds[activeConfigCategory] === template.id && (
                              <Edit2 
                                size={12} 
                                className="cursor-pointer hover:scale-110 transition-transform"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTemplateId(template.id);
                                  setTempTemplateName(template.name);
                                }}
                              />
                            )}
                          </button>
                        )}
                        {config.templates[activeConfigCategory].length > 1 && editingTemplateId !== template.id && (
                          <div className="absolute -top-1 -right-1 flex items-center">
                            {deletingTemplateId === template.id ? (
                              <div className="flex items-center gap-1 bg-red-500 rounded-full px-2 py-0.5 shadow-lg animate-in zoom-in-50 duration-200">
                                <span className="text-[8px] font-black text-white whitespace-nowrap">确定删除?</span>
                                <Check 
                                  size={10} 
                                  className="text-white cursor-pointer hover:scale-125" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const updatedTemplates = config.templates[activeConfigCategory].filter(t => t.id !== template.id);
                                    const newActiveId = config.activeTemplateIds[activeConfigCategory] === template.id 
                                      ? updatedTemplates[0].id 
                                      : config.activeTemplateIds[activeConfigCategory];
                                    setConfig({
                                      ...config,
                                      templates: { ...config.templates, [activeConfigCategory]: updatedTemplates },
                                      activeTemplateIds: { ...config.activeTemplateIds, [activeConfigCategory]: newActiveId }
                                    });
                                    setDeletingTemplateId(null);
                                  }}
                                />
                                <X 
                                  size={10} 
                                  className="text-white cursor-pointer hover:scale-125" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingTemplateId(null);
                                  }}
                                />
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingTemplateId(template.id);
                                }}
                                className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110 active:scale-95"
                                title="删除模板"
                              >
                                <X size={10} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newTemplate: InstructionTemplate = {
                          id: crypto.randomUUID(),
                          name: `新模板 ${config.templates[activeConfigCategory].length + 1}`,
                          content: config.templates[activeConfigCategory].find(t => t.id === config.activeTemplateIds[activeConfigCategory])?.content || ''
                        };
                        setConfig({
                          ...config,
                          templates: {
                            ...config.templates,
                            [activeConfigCategory]: [...config.templates[activeConfigCategory], newTemplate]
                          },
                          activeTemplateIds: {
                            ...config.activeTemplateIds,
                            [activeConfigCategory]: newTemplate.id
                          }
                        });
                        // Automatically enter edit mode for the new template
                        setEditingTemplateId(newTemplate.id);
                        setTempTemplateName(newTemplate.name);
                      }}
                      className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
                      title="添加新模板"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Editor */}
                  <div className="flex-1 flex flex-col gap-4 min-h-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-700 flex items-center gap-2">
                        <Edit2 size={14} className="text-violet-500" />
                        编辑指令内容
                      </h4>
                      <button 
                        onClick={() => {
                          const defaultContent = activeConfigCategory === 'storyboard' ? DEFAULT_STORYBOARD_TEMPLATE : 
                                               activeConfigCategory === 'asset' ? DEFAULT_ASSET_EXTRACTION_TEMPLATE : '';
                          const updatedTemplates = config.templates[activeConfigCategory].map(t => 
                            t.id === config.activeTemplateIds[activeConfigCategory] ? { ...t, content: defaultContent } : t
                          );
                          setConfig({
                            ...config,
                            templates: { ...config.templates, [activeConfigCategory]: updatedTemplates }
                          });
                        }}
                        className="text-[10px] font-black text-violet-600 hover:underline"
                      >
                        恢复默认
                      </button>
                    </div>
                    <textarea
                      value={config.templates[activeConfigCategory].find(t => t.id === config.activeTemplateIds[activeConfigCategory])?.content || ''}
                      onChange={(e) => {
                        const updatedTemplates = config.templates[activeConfigCategory].map(t => 
                          t.id === config.activeTemplateIds[activeConfigCategory] ? { ...t, content: e.target.value } : t
                        );
                        setConfig({
                          ...config,
                          templates: { ...config.templates, [activeConfigCategory]: updatedTemplates }
                        });
                      }}
                      className="flex-1 w-full bg-slate-50/80 border border-violet-100/50 rounded-[32px] p-8 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 transition-all text-sm font-mono leading-relaxed shadow-inner resize-none"
                      placeholder="在此输入指令内容..."
                    />
                    {activeConfigCategory === 'storyboard' && (
                      <p className="text-[10px] text-slate-400 font-bold px-2">提示：使用 {"${style}"} 作为风格占位符</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-violet-100 flex justify-end items-center">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-10 py-4 rounded-[24px] font-black hover:opacity-90 transition-all shadow-xl shadow-slate-900/20 active:scale-95 flex items-center gap-2 hover:-translate-y-0.5 border-none"
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white/95 backdrop-blur-xl rounded-[48px] p-10 w-full max-w-6xl max-h-[90vh] relative z-10 shadow-2xl flex flex-col overflow-hidden border border-white/20"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-violet-600 rounded-3xl flex items-center justify-center text-white">
                    <RefreshCw size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">模型配置</h3>
                    <p className="text-sm text-slate-500 font-bold">管理 AI 模型与 API 密钥</p>
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
                    {(['gemini', 'deepseek', 'kimi', 'claude', 'yijia', 'wowcode'] as const).map((provider) => (
                      <button
                        key={provider}
                        onClick={() => setConfig({ ...config, selectedModel: provider })}
                        className={`p-4 rounded-3xl border-2 transition-all flex items-center gap-3 ${config.selectedModel === provider ? 'border-violet-400 bg-violet-50/80 text-violet-700 shadow-sm' : 'border-violet-100/50 hover:border-violet-200 hover:bg-slate-50/50 text-slate-600'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.selectedModel === provider ? 'bg-violet-500 text-white' : 'bg-gray-100 text-slate-400'}`}>
                          {provider === 'gemini' && <Sparkles size={16} />}
                          {provider === 'deepseek' && <LayoutDashboard size={16} />}
                          {provider === 'kimi' && <RefreshCw size={16} />}
                          {provider === 'claude' && <User size={16} />}
                          {provider === 'yijia' && <Box size={16} />}
                          {provider === 'wowcode' && <Sparkles size={16} />}
                        </div>
                        <span className="font-bold capitalize">{provider === 'yijia' ? 'GPT-5.2' : provider === 'wowcode' ? 'Claude Opus 4.6' : provider}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* TEXT MODELS */}
                  <div className="mb-4">
                    <h4 className="font-black text-slate-800 text-lg border-b pb-2">文本大模型配置</h4>
                  </div>
                  {(['gemini', 'deepseek', 'kimi', 'claude', 'yijia', 'wowcode'] as const).map((provider) => (
                    <div key={`settings-${provider}`} className={`p-6 rounded-3xl border transition-all ${config.selectedModel === provider ? 'border-violet-300 bg-violet-50/50 shadow-sm' : 'border-violet-100/50 bg-slate-50/50 hover:bg-slate-50/80'}`}>
                      <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                        <span className="capitalize">{provider === 'yijia' ? 'GPT-5.2 (Yijia)' : provider === 'wowcode' ? 'Claude Opus 4.6 (Wowcode)' : provider}</span> 配置
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 mb-1 ml-1 uppercase">API Key</label>
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
                            className="w-full bg-slate-50/80 border border-violet-100/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 shadow-inner"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 mb-1 ml-1 uppercase">Model Name</label>
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
                            className="w-full bg-slate-50/80 border border-violet-100/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 shadow-inner"
                          />
                        </div>
                        {provider !== 'gemini' && (
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 mb-1 ml-1 uppercase">Base URL</label>
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
                              className="w-full bg-slate-50/80 border border-violet-100/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 shadow-inner"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* IMAGE MODELS */}
                  <div className="mt-12 mb-4">
                    <h4 className="font-black text-slate-800 text-lg border-b pb-2">生图模型配置</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-sm font-black text-gray-700">默认生图提供商</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={config.imageProvider === 'dakka'} onChange={() => setConfig({ ...config, imageProvider: 'dakka' })} className="text-violet-600 focus:ring-violet-500" />
                        <span className="font-bold text-slate-700">Dakka Nano-Banana</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={config.imageProvider === 'yijia'} onChange={() => setConfig({ ...config, imageProvider: 'yijia' })} className="text-violet-600 focus:ring-violet-500" />
                        <span className="font-bold text-slate-700">Yijia (意佳)</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-1 ml-1 uppercase">图片比例 (Aspect Ratio)</label>
                      <select
                        value={config.imageAspectRatio}
                        onChange={(e) => setConfig({ ...config, imageAspectRatio: e.target.value })}
                        className="w-full bg-slate-50/80 border border-violet-100/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 shadow-inner"
                      >
                        <option value="16:9">16:9</option>
                        <option value="9:16">9:16</option>
                        <option value="1:1">1:1</option>
                        <option value="4:3">4:3</option>
                        <option value="3:4">3:4</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-1 ml-1 uppercase">图片分辨率分数 (Size)</label>
                      <select
                        value={config.imageSize}
                        onChange={(e) => setConfig({ ...config, imageSize: e.target.value })}
                        className="w-full bg-slate-50/80 border border-violet-100/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 shadow-inner"
                      >
                        <option value="1K">1K</option>
                        <option value="2K">2K</option>
                        <option value="4K">4K</option>
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">注意：部分子模型限制最高2K</p>
                    </div>
                  </div>

                  <div className={`p-6 rounded-3xl border transition-all ${config.imageProvider === 'dakka' ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-slate-50'}`}>
                    <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">Dakka 生图 API</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1 ml-1 uppercase">API Key (Dakka)</label>
                        <input
                          type="password"
                          value={config.imageDakkaApiKey}
                          onChange={(e) => setConfig({ ...config, imageDakkaApiKey: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1 ml-1 uppercase">模型名称 (Sub-model)</label>
                        <select
                          value={config.imageDakkaModel}
                          onChange={(e) => setConfig({ ...config, imageDakkaModel: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        >
                          <option value="nano-banana-pro">nano-banana-pro</option>
                          <option value="nano-banana-2">nano-banana-2</option>
                          <option value="nano-banana">nano-banana</option>
                          <option value="nano-banana-fast">nano-banana-fast</option>
                          <option value="nano-banana-pro-vt">nano-banana-pro-vt</option>
                          <option value="nano-banana-pro-4k-vip">nano-banana-pro-4k-vip</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-3xl border transition-all ${config.imageProvider === 'yijia' ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-slate-50'}`}>
                    <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">Yijia (意佳) 生图 API</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1 ml-1 uppercase">API Key (Yijia)</label>
                        <input
                          type="password"
                          value={config.imageYijiaApiKey}
                          onChange={(e) => setConfig({ ...config, imageYijiaApiKey: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1 ml-1 uppercase">模型名称 (Sub-model)</label>
                        <select
                          value={config.imageYijiaModel}
                          onChange={(e) => setConfig({ ...config, imageYijiaModel: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        >
                          <option value="nano_banana_pro">nano_banana_pro</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-violet-100 flex justify-end">
                <button
                  onClick={() => setShowModelConfigModal(false)}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-10 py-4 rounded-[24px] font-black hover:opacity-90 transition-all shadow-xl shadow-violet-500/30 active:scale-95 flex items-center gap-2 hover:-translate-y-0.5 border-none"
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white/95 backdrop-blur-xl rounded-[48px] p-10 w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setShowNewProjectModal(false)} className="p-2 text-slate-400 hover:text-black transition-colors">
                  <X size={24} />
                </button>
              </div>

              <h3 className="text-3xl font-black mb-8 text-slate-800">新建剧本</h3>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-3 ml-1">剧本名称</label>
                  <input
                    autoFocus
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="给你的新剧本起个响亮的名字..."
                    className="w-full bg-slate-50/80 border border-violet-100/50 rounded-[24px] px-6 py-4 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 transition-all text-lg font-bold shadow-inner"
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
                      className="text-xs font-black text-violet-600 hover:text-violet-700 flex items-center gap-1 bg-violet-50 px-3 py-1.5 rounded-full"
                    >
                      <Plus size={14} />
                      添加自定义风格
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {customStyles.map((style) => (
                      <div key={style.id} className="relative group">
                        <button
                          onClick={() => setNewProjectStyle(style.name)}
                          className={`
                            w-full relative flex items-center justify-center p-4 rounded-2xl transition-all border-2
                            ${newProjectStyle === style.name 
                              ? 'border-violet-500 bg-violet-500 text-white shadow-md shadow-violet-500/20' 
                              : 'border-slate-100 bg-white text-slate-700 hover:border-violet-200 hover:bg-slate-50'}
                          `}
                        >
                          <span className="text-sm font-black truncate px-2">{style.name}</span>
                          {newProjectStyle === style.name && (
                            <div className="absolute top-1.5 right-1.5 bg-white text-violet-600 rounded-full p-0.5 shadow-sm">
                              <Check size={10} strokeWidth={4} />
                            </div>
                          )}
                        </button>
                        
                        {/* Edit/Delete Actions */}
                        <div className="absolute -top-2 -left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingStyle(style);
                              setEditStyleName(style.name);
                              setEditStyleImage(style.image);
                            }}
                            className="p-1.5 bg-white/90 backdrop-blur text-slate-600 hover:text-violet-600 rounded-lg shadow-sm hover:bg-violet-50 transition-colors"
                            title="修改风格"
                          >
                            <Edit2 size={14} />
                          </button>
                          {style.id.startsWith('custom-') && (
                            <button
                              onClick={(e) => handleDeleteStyle(style.id, e)}
                              className="p-1.5 bg-white/90 backdrop-blur text-slate-600 hover:text-red-600 rounded-lg shadow-sm hover:bg-red-50 transition-colors"
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
                  className="flex-1 px-6 py-4 rounded-[24px] font-black text-slate-500 hover:bg-gray-100 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                  className="flex-1 px-6 py-4 rounded-[24px] font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-violet-500/30 hover:-translate-y-0.5 border-none"
                >
                  创建剧本
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Project Delete Confirmation Modal */}
      <AnimatePresence>
        {projectToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => {
                setProjectToDelete(null);
                setDeleteConfirmText('');
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/95 backdrop-blur-xl rounded-[40px] p-8 w-full max-w-md relative z-10 shadow-2xl border border-white/20"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-[24px] flex items-center justify-center mb-6 mx-auto">
                <Trash2 size={32} />
              </div>
              
              <h2 className="text-2xl font-black mb-2 text-slate-800 text-center">删除剧本</h2>
              <p className="text-slate-500 mb-6 text-center font-medium">
                此操作无法撤销。该剧本下的所有章节和资产将被永久删除。
              </p>
              
              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-700 mb-2 text-center">
                  请输入剧本名称 <span className="text-red-500 font-black">{projectToDelete.name}</span> 以确认
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={projectToDelete.name}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 font-bold text-center"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setProjectToDelete(null);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 px-6 py-4 rounded-[24px] font-black text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmDeleteProject}
                  disabled={deleteConfirmText !== projectToDelete.name}
                  className="flex-1 px-6 py-4 rounded-[24px] font-black bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-red-500/20 active:scale-95"
                >
                  确认删除
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/95 backdrop-blur-xl rounded-[40px] p-8 w-full max-w-md relative z-10 shadow-2xl border border-white/20"
            >
              <h3 className="text-2xl font-black mb-6 text-slate-800">
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
                    className="w-full bg-slate-50/80 border border-violet-100/50 rounded-3xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 font-bold shadow-inner"
                  />
                </div>
                {/* Optional Image */}
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">封面图片 URL (可选)</label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <ImageIcon size={18} />
                      </div>
                      <input
                        type="text"
                        value={editStyleImage}
                        onChange={(e) => setEditStyleImage(e.target.value)}
                        placeholder="输入图片链接 (https://...)"
                        className="w-full bg-slate-50/80 border border-violet-100/50 rounded-3xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 text-sm shadow-inner"
                      />
                    </div>
                  </div>
                  {editStyleImage && (
                    <div className="mt-4 aspect-video rounded-3xl overflow-hidden border border-gray-100 bg-gray-50">
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
                  className="flex-1 px-4 py-3 rounded-3xl font-black text-slate-500 hover:bg-gray-100 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveStyle}
                  disabled={!editStyleName.trim()}
                  className="flex-1 px-4 py-3 rounded-3xl font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/20 hover:-translate-y-0.5 border-none"
                >
                  保存
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {showAddAssetModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddAssetModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white/95 backdrop-blur-xl rounded-[40px] p-8 w-full max-w-md relative z-10 shadow-2xl border border-white/20"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600">
                    <Plus size={20} />
                  </div>
                  <h3 className="text-xl font-black text-slate-800">手动添加资产</h3>
                </div>
                <button 
                  onClick={() => setShowAddAssetModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">资产类型</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'character', name: '角色', icon: <User size={16} /> },
                      { id: 'prop', name: '道具', icon: <Box size={16} /> },
                      { id: 'scene', name: '场景', icon: <Map size={16} /> }
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setNewAssetType(type.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-3xl font-black text-sm transition-all border ${
                          newAssetType === type.id 
                            ? 'bg-violet-50 border-violet-200 text-violet-700' 
                            : 'bg-white border-gray-200 text-slate-500 hover:bg-slate-50/80'
                        }`}
                      >
                        {type.icon}
                        {type.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">资产名称</label>
                  <input
                    type="text"
                    value={newAssetName}
                    onChange={(e) => setNewAssetName(e.target.value)}
                    placeholder="输入要提取的资产名称，如：青云剑"
                    className="w-full bg-slate-50/80 border border-violet-100/50 rounded-3xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 text-sm font-medium shadow-inner"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowAddAssetModal(false)}
                  className="flex-1 px-4 py-3 rounded-3xl font-black text-slate-500 hover:bg-gray-100 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleExtractSingleAsset}
                  disabled={!newAssetName.trim() || isExtractingSingle}
                  className="flex-1 px-4 py-3 rounded-3xl font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/20 hover:-translate-y-0.5 border-none flex items-center justify-center gap-2"
                >
                  {isExtractingSingle ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  {isExtractingSingle ? '提取中...' : '提取并保存'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {showRefineAssetModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRefineAssetModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white/95 backdrop-blur-xl rounded-[40px] p-8 w-full max-w-md relative z-10 shadow-2xl border border-white/20"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="text-xl font-black text-slate-800">AI 修改资产</h3>
                </div>
                <button 
                  onClick={() => setShowRefineAssetModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">修改要求</label>
                  <textarea
                    value={refineInstruction}
                    onChange={(e) => setRefineInstruction(e.target.value)}
                    placeholder="例如：把衣服颜色改成红色..."
                    className="w-full bg-slate-50/80 border border-violet-100/50 rounded-3xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 text-sm font-medium resize-none h-32 shadow-inner"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowRefineAssetModal(false)}
                  className="flex-1 px-4 py-3 rounded-3xl font-black text-slate-500 hover:bg-gray-100 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleRefineAsset}
                  disabled={!refineInstruction.trim() || isRefining}
                  className="flex-1 px-4 py-3 rounded-3xl font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/20 hover:-translate-y-0.5 border-none flex items-center justify-center gap-2"
                >
                  {isRefining ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  {isRefining ? '修改中...' : '开始修改'}
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
