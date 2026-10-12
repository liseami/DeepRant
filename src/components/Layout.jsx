/**
 * [INPUT]: 依赖 StoreProvider 的读取状态、Sidebar 与统一 Toast 容器
 * [OUTPUT]: 提供桌面布局、加载失败恢复和页面内容区域
 * [POS]: 应用外壳，在设置可读前阻止业务页面提交不完整配置
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import BackgroundStatus from './BackgroundStatus';
import UpdateManager from './UpdateManager';
import { useStore } from './StoreProvider';

export default function Layout({ children, activeItem, setActiveItem }) {
  const { loading, error, refresh, t } = useStore();
  return <div className="app-layout">
    <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', maxWidth: '520px' } }} />
    <BackgroundStatus /><UpdateManager />
    <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
    <main className="main-content">
      {loading ? <p role="status">{t('loading')}</p> : error
        ? <div className="card" role="alert"><p>{error}</p><button className="primary" onClick={refresh}>{t('retry')}</button></div>
        : children}
    </main>
  </div>;
}
