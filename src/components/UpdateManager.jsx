/**
 * [INPUT]: 依赖 Tauri updater / process、Cromma UI 控件、托盘更新事件和关于页请求
 * [OUTPUT]: 提供更新发现、累计下载进度、明确安装按钮与重启操作
 * [POS]: 常驻更新控制边界，未安装的 Update 资源在关闭时释放
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { Panel, Button } from 'cromma-ui';
import { useStore } from './StoreProvider';
import { showError, showSuccess } from '../utils/toast';
import { UPDATE_EVENT } from '../utils/updater';

export default function UpdateManager() {
  const { t } = useStore();
  const [update, setUpdate] = useState(null);
  const [status, setStatus] = useState('');
  const [percent, setPercent] = useState(null);
  const running = useRef(false);
  const resource = useRef(null);
  const checkRef = useRef(null);

  async function dismiss() {
    const previous = resource.current;
    resource.current = null;
    setUpdate(null);
    setStatus('');
    if (previous) await previous.close().catch(showError);
  }

  async function checkUpdates() {
    if (running.current) return;
    running.current = true;
    setStatus('checking');
    try {
      if (resource.current) await resource.current.close().catch(showError);
      resource.current = null;
      setUpdate(null);
      const next = await check();
      resource.current = next;
      setUpdate(next);
      setStatus(next ? 'available' : '');
      if (!next) showSuccess(t('latestVersion'));
    } catch (failure) { setStatus(''); showError(failure); }
    finally { running.current = false; }
  }
  checkRef.current = checkUpdates;

  useEffect(() => {
    let closed = false;
    let unlisten;
    const request = () => checkRef.current();
    window.addEventListener(UPDATE_EVENT, request);
    listen('deeprant://check-update', request).then(dispose => { if (closed) dispose(); else unlisten = dispose; }).catch(showError);
    return () => {
      closed = true;
      window.removeEventListener(UPDATE_EVENT, request);
      unlisten?.();
      resource.current?.close().catch(showError);
    };
  }, []);

  async function install() {
    if (!update || running.current) return;
    running.current = true;
    setStatus('downloading');
    setPercent(null);
    let downloaded = 0;
    let total = 0;
    try {
      await update.downloadAndInstall(event => {
        if (event.event === 'Started') total = event.data.contentLength || 0;
        else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          if (total > 0) setPercent(Math.min(100, Math.round(downloaded * 100 / total)));
        }
      });
      setStatus('installed');
      showSuccess(t('updateInstalled'));
      await relaunch();
    } catch (failure) { setStatus(current => current === 'installed' ? current : 'available'); showError(failure); }
    finally { running.current = false; }
  }

  if (!status) return null;
  return <Panel className="fixed bottom-6 right-6 z-50 max-w-md p-6 shadow-lg" role="status" aria-live="polite">
    <h2>{t(status === 'checking' ? 'checkingUpdates' : status === 'downloading' ? 'downloadingUpdate' : status === 'installed' ? 'updateInstalled' : 'updateAvailable')}</h2>
    {update && <p>{t('version')} {update.version}</p>}
    {status === 'available' && update?.body && <p className="note" style={{ whiteSpace: 'pre-wrap', maxHeight: 140, overflow: 'auto', marginTop: 10 }}>{update.body}</p>}
    {status === 'downloading' && percent !== null && <p>{percent}%</p>}
    <div className="mt-4 flex items-center gap-2">
      {status === 'available' && <Button type="button" variant="ink" onClick={install}>{t('installUpdate')}</Button>}
      {status === 'installed' && <Button type="button" variant="ink" onClick={() => relaunch().catch(showError)}>{t('restartApp')}</Button>}
      {status === 'available' && <Button type="button" variant="secondary" onClick={dismiss}>{t('cancel')}</Button>}
    </div>
  </Panel>;
}
