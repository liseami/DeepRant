/**
 * [INPUT]: 依赖 Cromma UI、快捷键设置、录制器及 Rust 实际权限 / 注册 / 输入阶段诊断
 * [OUTPUT]: 提供输入方式、Dota 2 原位操作说明、快捷键和实时诊断；权限设置与原文恢复入口
 * [POS]: 输入准备入口；游戏自动路由归 Rust，界面只说明流程；权限与阶段来自实际原生进程
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
            {diagnostics.recovery_available && <Button variant="secondary" size="small" onClick={() => invoke('copy_input_recovery').then(refreshDiagnostics).catch(showError)}>{english ? 'Copy original text' : '复制待恢复原文'}</Button>}
            {diagnostics.last_input ? <p className="leading-relaxed">{diagnostics.last_input.message}</p> : <p className="text-muted-foreground">{english ? 'No shortcut received yet' : '尚未收到快捷键'}</p>}
          </div>}
          {diagnosticError && <p role="alert" className="mt-2 text-xs text-destructive">{diagnosticError}</p>}
          <Button variant="ghost" size="small" className="mt-2" onClick={refreshDiagnostics}>{english ? 'Refresh input status' : '刷新输入状态'}</Button>
        </div>
        <div className="space-y-3">
          <Select aria-label={english ? 'Input workflow' : '输入方式'} value={settings.input_mode || 'auto'} size="medium"
            onValueChange={input_mode => updateSettings({ input_mode }).catch(showError)} items={[
              { value: 'auto', label: english ? 'Automatic · game defaults' : '自动 · 按游戏适配' },
              { value: 'replace', label: english ? 'Translate inside the chat field' : '原位翻译' },
              { value: 'compose', label: english ? 'In-game message window' : '游戏输入浮窗' },
            ]} />
          <HotkeyRecorder hotkey={settings.trans_hotkey} label={t('hotkey')}
            onSave={keys => runCommand('update_translator_shortcut', { keys })} />
          <p className="text-xs leading-relaxed text-muted-foreground">{english ? 'Dota 2: choose Automatic or In-place translation, type in the game chat, then press your shortcut. Check the translation and send it yourself.' : 'Dota 2 选择“自动”或“原位翻译”，在游戏聊天框输入原文后按快捷键，检查译文后自己发送。'}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{english ? 'Star Citizen and LoL use the message window automatically. Open an empty chat field, press your shortcut, write and confirm insertion, then send the message yourself.' : '星际公民和 LoL 自动使用输入浮窗。先打开空聊天框，再按快捷键写消息并确认回填，最后自己发送。'}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{english ? 'In Pages or other documents, use Everyday mode and select the text to translate.' : 'Pages 等文档软件请切到日常模式，先选中要翻译的文字。'}</p>
        </div>
      </div>
    </Panel>
  </motion.div>;
}
