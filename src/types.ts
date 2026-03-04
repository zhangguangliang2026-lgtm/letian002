export type ModelProvider = 'gemini' | 'deepseek' | 'kimi' | 'claude';

export interface ModelSettings {
  provider: ModelProvider;
  modelName: string;
  apiKey: string;
  baseUrl?: string;
}

export interface AppConfig {
  storyboardInstruction: string;
  assetExtractionInstruction: string;
  imageGenInstruction: string;
  videoGenInstruction: string;
  selectedModel: ModelProvider;
  models: Record<ModelProvider, ModelSettings>;
}

export interface Asset {
  id: string;
  name: string;
  type: 'character' | 'prop' | 'scene';
  prompt: string;
  createdAt: number;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  output: string;
  assets: Asset[];
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  style: string;
  chapters: Chapter[];
  createdAt: number;
}

export interface StyleOption {
  id: string;
  name: string;
  image: string;
}

export const STYLES: StyleOption[] = [
  { id: '3d-xianxia', name: '3D国漫仙侠', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80' },
  { id: '3d-urban', name: '3D国漫都市', image: 'https://images.unsplash.com/photo-1449156003053-c30670b9883c?auto=format&fit=crop&w=800&q=80' },
  { id: '3d-fantasy', name: '3D玄幻大片', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80' },
  { id: 'cyberpunk', name: '赛博朋克未来', image: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=800&q=80' },
  { id: 'ink-wash', name: '新中式水墨', image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=800&q=80' },
  { id: 'retro-hongkong', name: '复古港风滤镜', image: 'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?auto=format&fit=crop&w=800&q=80' },
  { id: 'cinematic-realism', name: '电影级写实', image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80' },
  { id: 'ghibli-style', name: '吉卜力治愈风', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' },
  { id: 'dark-gothic', name: '暗黑哥特风', image: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=800&q=80' },
  { id: 'pixel-art', name: '复古像素艺术', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80' },
  { id: 'clay-animation', name: '定格黏土动画', image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&q=80' },
  { id: 'ukiyoe', name: '浮世绘艺术', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=80' },
  { id: 'steampunk', name: '蒸汽朋克', image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80' },
  { id: 'minimalism', name: '极简主义', image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=800&q=80' },
  { id: 'neonwave', name: '霓虹波', image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80' },
  { id: 'rococo', name: '洛可可艺术', image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=800&q=80' },
  { id: 'wasteland', name: '废土末世', image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80' },
  { id: 'dunhuang', name: '敦煌壁画风', image: 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=800&q=80' },
  { id: 'cyber-wuxia', name: '赛博武侠', image: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=800&q=80' },
  { id: 'dreamy', name: '梦幻唯美', image: 'https://images.unsplash.com/photo-1519750783826-51dbdb4a7a67?auto=format&fit=crop&w=800&q=80' },
];
