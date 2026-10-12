/**
 * [INPUT]: 依赖 Rust 输入状态事件与启动快捷键注册诊断命令
 * [OUTPUT]: 提供非侵入的翻译进度与错误 Toast，不向聊天框写占位文本
 * [POS]: 常驻桌面事件桥，所有页面共用同一输入状态反馈
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import toast from 'react-hot-toast';
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
      if (payload.state === 'error') toast.error(payload.message, { id, duration: 7000 });
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
