/**
 * [INPUT]: 依赖 React 根挂载、App 与全局样式
 * [OUTPUT]: 提供 WebView 的 React 启动入口
 * [POS]: 页面生命周期起点，StrictMode 用于暴露副作用清理错误
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
