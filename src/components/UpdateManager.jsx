/**
 * [INPUT]: Rust 更新快照与用户意图命令、Cromma UI 控件。
 * [OUTPUT]: 渲染可用版本/下载进度/原生错误，按钮仅提交明确安装、关闭或重启意图。
 * [POS]: 常驻更新展示边界；资源、忙态、签名校验与完整状态机全部属于 desktop_updates。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Panel, Button } from 'cromma-ui';
import { useStore } from './StoreProvider';
import { showError } from '../utils/toast';
import { requestUpdateCheck } from '../utils/updater';

export default function UpdateManager() {
  const { t } = useStore();
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    let closed = false;
    const disposers = [];
    const receive = (next) => {
      if (!closed) setSnapshot(current => current && current.revision > next.revision ? current : next);
    };
    const register = (dispose) => { if (closed) dispose(); else disposers.push(dispose); };
    listen('deeprant://update-state', event => receive(event.payload))
      .then(dispose => {
        register(dispose);
        if (!closed) invoke('get_desktop_update_state').then(receive).catch(showError);
      }).catch(showError);
    return () => { closed = true; disposers.forEach(dispose => dispose()); };
  }, []);

  if (!snapshot || snapshot.phase === 'idle') return null;
  const { phase, version, body, percent, error, updateId } = snapshot;
  const title = {
    checking: 'checkingUpdates', available: 'updateAvailable', downloading: 'downloadingUpdate',
    installing: 'installUpdate', installed: 'updateInstalled', latest: 'latestVersion', error: 'checkUpdates',
  }[phase];
  const send = (command) => invoke(command, { updateId, version }).catch(showError);

  return <Panel className="fixed bottom-6 right-6 z-50 max-w-md p-6 shadow-lg" role="status" aria-live="polite">
    <h2>{t(title)}</h2>
    {version && <p>{t('version')} {version}</p>}
    {phase === 'available' && body && <p className="note" style={{ whiteSpace: 'pre-wrap', maxHeight: 140, overflow: 'auto', marginTop: 10 }}>{body}</p>}
    {phase === 'downloading' && percent !== null && <p>{percent}%</p>}
    {error && <p className="note mt-3">{error}</p>}
    <div className="mt-4 flex items-center gap-2">
      {phase === 'available' && <Button type="button" variant="ink" onClick={() => send('install_desktop_update')}>{t('installUpdate')}</Button>}
      {phase === 'installed' && <Button type="button" variant="ink" onClick={() => send('restart_after_desktop_update')}>{t('restartApp')}</Button>}
      {phase === 'error' && <Button type="button" variant="ink" onClick={requestUpdateCheck}>{t('checkUpdates')}</Button>}
      {['available', 'latest', 'error'].includes(phase) && <Button type="button" variant="secondary" onClick={() => send('dismiss_desktop_update')}>{t('cancel')}</Button>}
    </div>
  </Panel>;
}
