/**
 * [INPUT]: 依赖设置读取状态、Sidebar、Toast 与常驻桌面事件桥
 * [OUTPUT]: 提供原版 200px 侧栏和白色内容容器，以及设置恢复入口
 * [POS]: 游戏翻译应用外壳；业务页面在 Rust 设置读取完成后挂载
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import BackgroundStatus from './BackgroundStatus';
import UpdateManager from './UpdateManager';
import { useStore } from './StoreProvider';

export default function Layout({ children, activeItem, setActiveItem }) {
  const { loading, error, refresh, t } = useStore();
  return (
    <div className="flex h-screen bg-[#F9F9F9] overflow-hidden">
      <Toaster toastOptions={{
        className: 'dark:bg-zinc-800 dark:text-white',
        style: { borderRadius: '12px', background: '#fff', color: '#363636' },
      }} />
      <BackgroundStatus />
      <UpdateManager />
      <div className="w-[200px] h-screen shrink-0">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      </div>
      <main className="flex-1 min-w-0 p-4">
        <div className="max-w-[1200px] mx-auto h-[calc(100vh-32px)] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 overflow-auto">
          {loading ? <p className="text-sm text-zinc-500" role="status">{t('loading')}</p> : error
            ? <div className="rounded-2xl border border-zinc-200 p-6" role="alert">
              <p className="text-sm text-zinc-600">{error}</p>
              <button type="button" className="mt-4 px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200" onClick={refresh}>{t('retry')}</button>
            </div> : children}
        </div>
      </main>
    </div>
  );
}
