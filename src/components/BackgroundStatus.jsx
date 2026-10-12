/**
 * [INPUT]: 依赖 Rust 实际输入 / 权限状态、固定辅助功能设置命令和 Cromma Button
 * [OUTPUT]: 提供输入进度与可操作错误提示，权限失败可直接打开系统对应设置
 * [POS]: 所有主页面共用事件桥；反馈不写入聊天，系统授权由用户显式完成
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import toast from 'react-hot-toast';
import { Button } from 'cromma-ui';
import { useStore } from './StoreProvider';
import { uiText } from '../data/i18n';
import { showError } from '../utils/toast';

export default function BackgroundStatus() {
  const { locale } = useStore();
  useEffect(() => {
    let closed = false;
    let unlisten;
    listen('deeprant://input-status', ({ payload }) => {
      if (closed) return;
      const id = 'input-status';
      if (payload.state === 'error') toast.error(payload.accessibility_required ? <div className="space-y-3">
        <p>{payload.message}</p>
        <Button variant="ink" size="small" onClick={() => invoke('open_input_permissions').catch(showError)}>
          {locale === 'en' ? 'Open Accessibility settings' : '打开辅助功能设置'}
        </Button>
      </div> : payload.message, { id, duration: payload.accessibility_required ? 15000 : 7000 });
      else if (payload.state === 'done') toast.success(uiText(locale, 'statusDone'), { id, duration: 2000 });
      else {
        const key = { copying: 'statusCopying', translating: 'statusTranslating', pasting: 'statusPasting' }[payload.state];
        if (key) toast.loading(uiText(locale, key), { id });
      }
    }).then(dispose => { if (closed) dispose(); else unlisten = dispose; }).catch(showError);
    return () => { closed = true; unlisten?.(); };
  }, [locale]);

  useEffect(() => {
    let closed = false;
    invoke('get_shortcut_status').then(message => { if (!closed && message) showError(message); }).catch(error => { if (!closed) showError(error); });
    return () => { closed = true; };
  }, []);
  return null;
}
