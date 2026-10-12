/**
 * [INPUT]: 依赖 Cromma UI、快捷键设置、录制器及 Rust 实际权限 / 注册 / 输入阶段诊断
 * [OUTPUT]: 提供输入方式、快捷键与可刷新诊断，未授权时引导用户打开系统设置
 * [POS]: 输入准备入口；状态来自实际运行中的原生进程，不从曾经授权或按键名称推断可用性
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useCallback, useEffect, useState } from 'react';
import { Button, Panel, PanelHeader, Select, motion, MOTION } from 'cromma-ui';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { KeyboardWired } from 'cromma-ui/pika';
import { useStore } from '../../../components/StoreProvider';
import HotkeyRecorder from '../../../components/HotkeyRecorder';
import { showError } from '../../../utils/toast';

export default function HotkeyCard() {
  const { settings, runCommand, updateSettings, locale, t } = useStore();
  const english = locale === 'en';
  const [diagnostics, setDiagnostics] = useState(null);
  const [diagnosticError, setDiagnosticError] = useState('');
  const refreshDiagnostics = useCallback(async () => {
    try { setDiagnostics(await invoke('get_input_diagnostics')); setDiagnosticError(''); }
    catch (failure) { setDiagnosticError(String(failure)); }
  }, []);
  useEffect(() => {
    let disposed = false;
    let unlisten;
    refreshDiagnostics();
    listen('deeprant://input-status', () => { if (!disposed) refreshDiagnostics(); }).then(stop => {
      if (disposed) stop(); else unlisten = stop;
    }).catch(failure => { if (!disposed) setDiagnosticError(String(failure)); });
    return () => { disposed = true; unlisten?.(); };
  }, [refreshDiagnostics]);

  async function openPermissions() {
    try { await invoke('open_input_permissions'); }
    catch (failure) { showError(failure); }
  }
  return <motion.div className="min-w-0 h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={MOTION.base}>
    <Panel className="h-full">
      <PanelHeader title={<span className="inline-flex items-center gap-2"><KeyboardWired size={18} aria-hidden="true" />{t('hotkey')}</span>} />
      <div className="flex-1 min-h-[260px] flex flex-col justify-between gap-6 p-5">
        <div className="text-sm text-muted-foreground leading-relaxed">
          <p>{locale === 'en' ? 'Click to set a shortcut' : '点击设置快捷键'}</p>
          <p className="mt-2">{locale === 'en' ? 'Press a new key combination. Esc cancels.' : '按下新的快捷键组合，Esc 可取消。'}</p>
          {diagnostics && <div className="mt-3 space-y-2 text-xs" aria-live="polite">
            <p>{diagnostics.shortcuts_registered ? (english ? 'Shortcut registered' : '快捷键已注册') : (english ? 'Shortcut not registered' : '快捷键未注册')}</p>
            {diagnostics.accessibility_granted !== null && <p>{diagnostics.accessibility_granted ? (english ? 'Accessibility allowed' : '辅助功能已授权') : (english ? 'Accessibility permission required' : '辅助功能未授权，无法读写其他应用')}</p>}
            {diagnostics.accessibility_granted === false && <Button variant="secondary" size="small" onClick={openPermissions}>{english ? 'Open Accessibility settings' : '打开辅助功能设置'}</Button>}
            {diagnostics.shortcut_error && <p className="text-destructive">{diagnostics.shortcut_error}</p>}
            {diagnostics.last_input ? <p className="leading-relaxed">{diagnostics.last_input.message}</p> : <p className="text-muted-foreground">{english ? 'No shortcut received yet' : '尚未收到快捷键'}</p>}
          </div>}
          {diagnosticError && <p role="alert" className="mt-2 text-xs text-destructive">{diagnosticError}</p>}
          <Button variant="ghost" size="small" className="mt-2" onClick={refreshDiagnostics}>{english ? 'Refresh input status' : '刷新输入状态'}</Button>
        </div>
        <div className="space-y-3">
          <Select aria-label={english ? 'Input workflow' : '输入方式'} value={settings.input_mode || 'auto'} size="medium"
            onValueChange={input_mode => updateSettings({ input_mode }).catch(showError)} items={[
              { value: 'auto', label: english ? 'Automatic · LoL uses message window' : '自动 · LoL 使用输入浮窗' },
              { value: 'replace', label: english ? 'Translate inside the chat field' : '原位翻译' },
              { value: 'compose', label: english ? 'In-game message window' : '游戏输入浮窗' },
            ]} />
          <HotkeyRecorder hotkey={settings.trans_hotkey} label={t('hotkey')}
            onSave={keys => runCommand('update_translator_shortcut', { keys })} />
          <p className="text-xs leading-relaxed text-muted-foreground">{english ? 'For the message window, open an empty chat field before pressing your shortcut. It inserts text without sending.' : '浮窗方式请先打开空聊天框，再按快捷键；回填后不会自动发送。'}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{english ? 'In Pages or other documents, use Everyday mode and select the text to translate.' : 'Pages 等文档软件请切到日常模式，先选中要翻译的文字。'}</p>
        </div>
      </div>
    </Panel>
  </motion.div>;
}
