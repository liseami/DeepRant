/**
 * [INPUT]: 依赖 StoreProvider、Layout、首页与延迟加载的本地业务页面
 * [OUTPUT]: 提供 App 根组件和主页 / 模式 / 常用语 / 模型 / 关于页面映射
 * [POS]: 游戏翻译的 React 组合入口，主页保持挂载以复用录屏播放器，其他页面按需挂载
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { lazy, Suspense, useState } from 'react';
import { Loader } from 'cromma-ui';
import Layout from './components/Layout';
import { StoreProvider } from './components/StoreProvider';
import Home from './pages/home';
const Translate = lazy(() => import('./pages/Translate'));
const Settings = lazy(() => import('./pages/Settings'));
const About = lazy(() => import('./pages/About'));
const Phrases = lazy(() => import('./pages/Phrases'));

const pages = { translate: Translate, settings: Settings, about: About, phrases: Phrases };

export default function App() {
  const [activeItem, setActiveItem] = useState('home');
  const CurrentPage = pages[activeItem];
  return (
    <StoreProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Layout activeItem={activeItem} setActiveItem={setActiveItem}>
          <div className="h-full" hidden={activeItem !== 'home'}><Home active={activeItem === 'home'} /></div>
          {CurrentPage && <Suspense fallback={<Loader />}><CurrentPage /></Suspense>}
        </Layout>
      </div>
    </StoreProvider>
  );
}
