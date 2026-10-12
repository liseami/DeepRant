/**
 * [INPUT]: 依赖 Cromma UI Panel/Button、Key 首次配置横幅、设置读取状态及常驻桌面事件桥
 * [OUTPUT]: 提供全宽 Key 入口、CCBaga 同款侧栏、斜纹外框和单一可滚动工作面
 * [POS]: 游戏翻译外壳保留原导航和业务页面；设置与输入反馈继续由 Rust 契约驱动
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Toaster } from 'react-hot-toast';
import { Panel, Button } from 'cromma-ui';
import Sidebar from './Sidebar';
import BackgroundStatus from './BackgroundStatus';
import UpdateManager from './UpdateManager';
import ApiKeyBanner from './ApiKeyBanner';
import { useStore } from './StoreProvider';

export default function Layout({ children, activeItem, setActiveItem }) {
  const { loading, error, refresh, t } = useStore();
  return (
    <div className="app-shell">
      <Toaster toastOptions={{ style: { borderRadius: '12px', background: 'var(--panel)', color: 'var(--foreground)' } }} />
      <BackgroundStatus />
      <UpdateManager />
      <ApiKeyBanner />
      <div className="app-shell-body">
        <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
        <Panel frame className="workspace">
          <main className="workspace-scroll">
            {loading ? <p className="text-sm text-muted-foreground" role="status">{t('loading')}</p> : error
              ? <Panel className="p-6 gap-4" role="alert">
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="ink" size="medium" className="self-start" onClick={refresh}>{t('retry')}</Button>
              </Panel> : children}
          </main>
        </Panel>
      </div>
    </div>
  );
}
