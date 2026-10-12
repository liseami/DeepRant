/**
 * [INPUT]: 依赖 StoreProvider、Layout 与本地页面
 * [OUTPUT]: 提供 App 根组件和原版主页 / 模式 / 常用语 / 能量 / 模型 / 关于页面映射
 * [POS]: 游戏翻译的 React 组合入口，设置缓存包裹原版布局，页面保持独立职责
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState } from 'react';
import Layout from './components/Layout';
import { StoreProvider } from './components/StoreProvider';
import Home from './pages/home';
import Translate from './pages/Translate';
import Settings from './pages/Settings';
import About from './pages/About';
import Phrases from './pages/Phrases';
import Mana from './pages/Mana';
import User from './pages/User';

const pages = { mana: Mana, user: User, home: Home, translate: Translate, settings: Settings, about: About, phrases: Phrases };

export default function App() {
  const [activeItem, setActiveItem] = useState('home');
  const CurrentPage = pages[activeItem];
  return <StoreProvider><div className="min-h-screen bg-background text-foreground"><Layout activeItem={activeItem} setActiveItem={setActiveItem}><CurrentPage /></Layout></div></StoreProvider>;
}
