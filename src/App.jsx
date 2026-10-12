/**
 * [INPUT]: 依赖 StoreProvider、Layout 与本地页面
 * [OUTPUT]: 提供 App 根组件与主页 / 翻译 / 常用语 / 模型 / 关于导航
 * [POS]: React 组合入口；账号与付费空壳不进入产品流程
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

const pages = { home: Home, translate: Translate, settings: Settings, about: About, phrases: Phrases };

export default function App() {
  const [activeItem, setActiveItem] = useState('home');
  const CurrentPage = pages[activeItem];
  return <StoreProvider><Layout activeItem={activeItem} setActiveItem={setActiveItem}><CurrentPage /></Layout></StoreProvider>;
}
