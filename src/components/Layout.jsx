/**
 * [INPUT]: 依赖 Cromma UI、AppDialog、设置读取状态、Rust 备份恢复命令及常驻桌面事件桥
 * [OUTPUT]: 提供 Key 入口、侧栏和工作面；设置格式错误时经明确确认备份并恢复默认值
 * [POS]: 游戏翻译外壳；恢复操作只提交用户意图，原数据备份与默认值写入由 Rust 完成
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Toaster } from 'react-hot-toast';
import { Panel, Button } from 'cromma-ui';
import Sidebar from './Sidebar';
import BackgroundStatus from './BackgroundStatus';
import UpdateManager from './UpdateManager';
import ApiKeyBanner from './ApiKeyBanner';
import AppDialog from './AppDialog';
import { useStore } from './StoreProvider';
import { showError } from '../utils/toast';

export default function Layout({ children, activeItem, setActiveItem }) {
  const { loading, error, refresh, t, locale } = useStore();
  const [confirmRecovery, setConfirmRecovery] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [backupDirectory, setBackupDirectory] = useState('');
  const english = locale === 'en';
  const recoverable = error.includes('设置格式无效') || error.includes('旧 API Key 格式无效');

  async function recoverSettings() {
    setRecovering(true);
    try {
      const backup = await invoke('restore_default_settings');
      setBackupDirectory(backup);
      setConfirmRecovery(false);
      await refresh();
    } catch (failure) { showError(failure); }
    finally { setRecovering(false); }
  }
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
            {backupDirectory && <p className="mb-4 text-sm text-muted-foreground break-all" role="status">
              {english ? 'Settings restored. Your previous settings are backed up at: ' : '已恢复默认设置，旧设置备份位于：'}{backupDirectory}
            </p>}
            {loading ? <p className="text-sm text-muted-foreground" role="status">{t('loading')}</p> : error
              ? <Panel className="p-6 gap-4" role="alert">
                <p className="text-sm text-muted-foreground">{error}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ink" size="medium" onClick={refresh}>{t('retry')}</Button>
                  {recoverable && <Button variant="secondary" size="medium" onClick={() => setConfirmRecovery(true)}>
                    {english ? 'Back up and restore defaults' : '备份并恢复默认设置'}
                  </Button>}
                </div>
              </Panel> : children}
          </main>
        </Panel>
      </div>
      <AppDialog open={confirmRecovery} onOpenChange={open => { if (!recovering) setConfirmRecovery(open); }}
        title={english ? 'Restore default settings?' : '恢复默认设置？'}
        footer={<>
          <Button variant="secondary" disabled={recovering} onClick={() => setConfirmRecovery(false)}>{english ? 'Cancel' : '取消'}</Button>
          <Button variant="ink" disabled={recovering} onClick={recoverSettings}>
            {recovering ? (english ? 'Restoring…' : '正在恢复…') : (english ? 'Back up and restore' : '备份并恢复')}
          </Button>
        </>}>
        <p className="text-sm text-muted-foreground">
          {english
            ? 'Your current settings will be backed up before restoring defaults. You will need to select your model, shortcuts and phrases again. API keys in the system credential store will be kept. If the backup fails, your settings will stay unchanged.'
            : '先完整备份现有设置，再恢复默认值。模型、快捷键和常用语需要重新配置；系统凭据库中的 API Key 保留。备份失败时不会修改原设置。'}
        </p>
      </AppDialog>
    </div>
  );
}
