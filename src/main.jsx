/**
 * [INPUT]: 依赖 React 根挂载、Cromma UI 上下文、App / Composer、同源主题与 bindDarkClass
 * [OUTPUT]: 提供主窗口或原生游戏输入浮窗的 React 启动入口
 * [POS]: 两个原生窗口共用主题，渲染前绑定深浅色；浮窗按独立 hash 挂载，避免加载主窗口导航与更新流程
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Loader, MotionRoot, TooltipProvider } from 'cromma-ui';
import { bindDarkClass } from './utils/appearance';
import './index.css';

bindDarkClass();

const Composer = lazy(() => import('./pages/Composer'));
const content = window.location.hash === '#composer' ? <Suspense fallback={<Loader />}><Composer /></Suspense> : <App />;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><MotionRoot><TooltipProvider delayDuration={600}>{content}</TooltipProvider></MotionRoot></React.StrictMode>
);
