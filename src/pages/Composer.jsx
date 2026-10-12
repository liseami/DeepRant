/**
 * [INPUT]: 依赖 Cromma UI、公开设置、ComposerSession 编号守卫和原生会话；翻译、复制与回填走 Rust 命令。
 * [OUTPUT]: 提供热键唤起的游戏输入浮窗，编辑原文、预览译文并确认回填原聊天窗口。
 * [POS]: 禁用复制的游戏使用独立输入工作面；目标窗口和会话归 Rust 所有，前端不自行切换焦点或模拟按键。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect, useRef, useState } from 'react';
import { Button, Input, Loader, Panel, PanelHeader, Textarea } from 'cromma-ui';
import { CopyDefault, KeyboardWired, SendPlaneHorizontal, Translate } from 'cromma-ui/pika';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { StoreProvider, useStore } from '../components/StoreProvider';
import { languageName } from '../data/languages';
import { ComposerSession } from '../utils/composer-session';

function ComposerContent() {
  const { settings, loading, error: settingsError, refresh, locale } = useStore();
  const [session, setSession] = useState(null);
  const [source, setSource] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const sessions = useRef(new ComposerSession());
  const sourceRef = useRef(null);
  const english = locale === 'en';

  useEffect(() => {
    let disposed = false;
    let unlisten;
    const reset = (next) => {
      if (disposed) return;
      // -------- 同会话重显保留草稿，旧事件与已结束会话不能覆盖新编号 --------
      if (!sessions.current.accept(next.id)) return;
      setSession(next.id);
      setSource(''); setResult(''); setError(''); setBusy(''); setCopied(false);
      refresh();
      requestAnimationFrame(() => sourceRef.current?.focus());
    };
    const window = getCurrentWebviewWindow();
    window.listen('deeprant://composer-open', event => reset(event.payload)).then(async stop => {
      if (disposed) { stop(); return; }
      unlisten = stop;
      try { reset(await invoke('get_composer_session')); }
      catch (failure) { if (!disposed) setError(String(failure)); }
    }).catch(failure => { if (!disposed) setError(String(failure)); });
    return () => { disposed = true; sessions.current.current = null; unlisten?.(); };
  }, [refresh]);

  useEffect(() => {
    if (!loading && session !== null) sourceRef.current?.focus();
  }, [loading, session]);

  const showFailure = (failure, id) => {
    if (sessions.current.owns(id)) setError(String(failure));
  };

  async function translate(event) {
    event?.preventDefault();
    if (busy || session === null || !source.trim()) return;
    const id = session;
    setBusy('translate'); setError(''); setResult(''); setCopied(false);
    try {
      const translated = await invoke('translate_composer', { sessionId: id, text: source });
      if (sessions.current.owns(id)) setResult(translated);
    } catch (failure) { showFailure(failure, id); }
    finally { if (sessions.current.owns(id)) setBusy(''); }
  }

  async function commit() {
    if (busy || session === null || !result.trim()) return;
    const id = session;
    setBusy('commit'); setError('');
    try {
      await invoke('commit_composer', { sessionId: id, text: result.trim() });
      const current = sessions.current.owns(id);
      sessions.current.finish(id);
      if (current) { setSession(null); setBusy(''); }
    }
    catch (failure) { showFailure(failure, id); }
    finally { if (sessions.current.owns(id)) setBusy(''); }
  }

  async function cancel() {
    if (session === null || busy === 'commit' || busy === 'cancel') return;
    const id = session;
    sessions.current.beginCancel(id);
    setBusy('cancel');
    try {
      await invoke('cancel_composer', { sessionId: id });
      sessions.current.finish(id);
      if (sessions.current.current === null) { setSession(null); setBusy(''); }
    } catch (failure) {
      sessions.current.cancelFailed(id);
      showFailure(failure, id);
      if (sessions.current.owns(id)) setBusy('');
    }
  }

  async function copy() {
    try { await invoke('copy_plain_text', { text: result }); setCopied(true); }
    catch (failure) { setError(String(failure)); }
  }

  function keyboard(event) {
    if (event.repeat || event.isComposing || event.nativeEvent.isComposing) return;
    if (event.key === 'Escape') { event.preventDefault(); cancel(); }
    else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      if (result.trim()) commit(); else translate();
    }
  }

  return <main className="min-h-screen bg-background p-4 text-foreground" onKeyDown={keyboard}>
    <Panel frame className="min-h-full">
      <PanelHeader title={<span className="inline-flex items-center gap-2"><KeyboardWired size={18} aria-hidden="true" />{english ? 'In-game message' : '游戏输入浮窗'}</span>}
        subtitle={settings ? `${languageName(settings.translation_from, locale)} → ${languageName(settings.translation_to, locale)}` : 'DeepRant'} />
      <div className="space-y-4 p-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{english
          ? 'Open an empty game chat field first. Write here, translate, and insert into that field. Press Enter in the game to send.'
          : '先打开游戏里的空聊天框。在这里写消息、翻译并回填，回到游戏后自己按回车发送。'}</p>
        {loading ? <Loader /> : settingsError ? <div role="alert" className="space-y-3">
          <p className="text-sm">{settingsError}</p><Button variant="secondary" size="small" onClick={refresh}>{english ? 'Retry' : '重试'}</Button>
        </div> : <>
          <form onSubmit={translate} className="space-y-3">
            <label htmlFor="composer-source" className="block text-sm font-medium">{english ? 'Your message' : '消息原文'}</label>
            <Textarea ref={sourceRef} id="composer-source" rows={3} maxLength={4000} value={source} disabled={Boolean(busy)}
              placeholder={english ? 'What do you want to say?' : '输入你想说的话…'}
              onChange={event => { setSource(event.target.value); setResult(''); setCopied(false); }} />
            <Button type="submit" variant="ink" size="small" leftIcon={<Translate size={14} aria-hidden="true" />}
              loading={busy === 'translate'} disabled={Boolean(busy) || session === null || !source.trim()}>{english ? 'Translate' : '翻译'}</Button>
          </form>
          <div className="space-y-2">
            <label htmlFor="composer-result" className="block text-sm font-medium">{english ? 'Translation · editable' : '译文 · 可修改'}</label>
            <Input id="composer-result" value={result} maxLength={4000} disabled={Boolean(busy)}
              placeholder={english ? 'Review before inserting' : '确认译文后再回填'} onChange={event => { setResult(event.target.value); setCopied(false); }} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ink" size="small" leftIcon={<SendPlaneHorizontal size={14} aria-hidden="true" />} loading={busy === 'commit'}
              disabled={Boolean(busy) || session === null || !result.trim()} onClick={commit}>{english ? 'Insert into game' : '回填聊天框'}</Button>
            <Button variant="secondary" size="small" leftIcon={<CopyDefault size={14} aria-hidden="true" />} disabled={!result || Boolean(busy)} onClick={copy}>{copied ? (english ? 'Copied' : '已复制') : (english ? 'Copy' : '复制')}</Button>
            <Button variant="ghost" size="small" disabled={busy === 'commit' || busy === 'cancel'} onClick={cancel}>{english ? 'Cancel' : '取消'}</Button>
          </div>
          <p className="text-xs text-muted-foreground">{english ? 'Ctrl / ⌘ + Enter: translate or insert · Esc: cancel' : 'Ctrl / ⌘ + Enter 翻译或回填 · Esc 取消'}</p>
        </>}
        {error && <p role="alert" className="text-sm leading-relaxed text-destructive">{error}</p>}
      </div>
    </Panel>
  </main>;
}

export default function Composer() {
  return <StoreProvider><ComposerContent /></StoreProvider>;
}
