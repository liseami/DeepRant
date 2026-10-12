/**
 * [INPUT]: 依赖 React 根挂载、Cromma UI 动效与提示上下文、App 与同源主题
 * [OUTPUT]: 提供 WebView 的 React 启动入口
 * [POS]: 页面生命周期起点，StrictMode 用于暴露副作用清理错误
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MotionRoot, TooltipProvider } from 'cromma-ui';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><MotionRoot><TooltipProvider delayDuration={600}><App /></TooltipProvider></MotionRoot></React.StrictMode>
);
