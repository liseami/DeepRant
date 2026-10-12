/**
 * [INPUT]: 依赖浏览器 KeyboardEvent.code、StoreProvider 文案和调用方的保存命令
 * [OUTPUT]: 提供可取消的快捷键录制，保留数字小键盘位置与标准修饰键
 * [POS]: 翻译和短语共用的录制边界，冲突与系统注册由 Rust 最终验证
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useStore } from './StoreProvider';
import { showSuccess, showError } from '../utils/toast';

export default function HotkeyRecorder({ hotkey, onSave, disabled = false, label }) {
  const { t } = useStore();
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const candidate = useRef(null);
  const active = useRef(false);

  async function stop() {
    active.current = false;
    candidate.current = null;
    setRecording(false);
    await invoke('set_shortcuts_paused', { paused: false }).catch(showError);
  }

  async function start() {
    active.current = true;
    try {
      await invoke('set_shortcuts_paused', { paused: true });
      if (active.current) setRecording(true);
      else await invoke('set_shortcuts_paused', { paused: false });
    } catch (failure) { active.current = false; showError(failure); }
  }

  useEffect(() => () => {
    const wasActive = active.current;
    active.current = false;
    if (wasActive) invoke('set_shortcuts_paused', { paused: false }).catch(showError);
  }, []);

  function keyDown(event) {
    if (!recording) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key === 'Escape') { stop(); return; }
    if (event.repeat || /^(Control|Alt|Shift|Meta)/.test(event.code)) return;
    const modifiers = [['Control', event.ctrlKey], ['Alt', event.altKey], ['Shift', event.shiftKey], ['Meta', event.metaKey]]
      .filter(([, held]) => held).map(([name]) => name);
    if (!modifiers.length && !/^(Numpad|F([1-9]|1[0-9]|2[0-4])$)/.test(event.code)) {
      showError(t('hotkeyInvalid')); candidate.current = null; return;
    }
    candidate.current = { code: event.code, keys: [...modifiers, event.code] };
  }

  async function keyUp(event) {
    if (!recording || candidate.current?.code !== event.code) return;
    event.preventDefault();
    const { keys } = candidate.current;
    candidate.current = null;
    setRecording(false);
    setBusy(true);
    try { await onSave(keys); showSuccess(t('hotkeySaved')); }
    catch (failure) { showError(failure); }
    finally { await stop(); setBusy(false); }
  }

  return <button type="button" className="hotkey-button" disabled={disabled || busy}
    aria-label={`${label || t('setHotkey')}: ${hotkey?.shortcut || t('unsetHotkey')}`}
    onClick={start}
    onKeyDown={keyDown} onKeyUp={keyUp} onBlur={() => { if (active.current) stop(); }}>
    {busy ? t('saving') : recording ? t('recordHotkey') : hotkey?.shortcut || t('unsetHotkey')}
  </button>;
}
