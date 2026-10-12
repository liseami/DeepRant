/**
 * [INPUT]: 依赖 Rust translate_text、系统剪贴板与 StoreProvider 的公开翻译设置
 * [OUTPUT]: 提供手动输入、翻译结果与复制操作
 * [POS]: 无法自动复制的游戏和网页输入框的可靠替代入口，不直接访问模型服务
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { useStore } from '../components/StoreProvider';
import { languageName } from '../data/languages';
import { showError, showSuccess } from '../utils/toast';

export default function Translate() {
  const { settings, t, locale } = useStore();
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  async function translate(event) {
    event.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setResult('');
    try { setResult(await invoke('translate_text', { text })); }
    catch (failure) { showError(failure); }
    finally { setBusy(false); }
  }

  async function copy() {
    try { await writeText(result); showSuccess(t('copied')); }
    catch (failure) { showError(failure); }
  }

  return <div className="page-stack">
    <header><h1>{t('manualTitle')}</h1><p>{t('manualDescription')}</p>
      <small>{languageName(settings.translation_from, locale)} → {languageName(settings.translation_to, locale)}</small></header>
    <form onSubmit={translate} className="card page-stack">
      <label>{t('inputText')}<textarea rows={6} value={text} maxLength={20000} placeholder={t('inputPlaceholder')}
        disabled={busy} onChange={event => setText(event.target.value)} /></label>
      <div><button type="submit" className="primary" disabled={busy || !text.trim()}>{t(busy ? 'translating' : 'translateAction')}</button></div>
    </form>
    <section className="card page-stack" aria-live="polite" aria-busy={busy}>
      <label>{t('resultText')}<textarea rows={6} value={result} readOnly placeholder={t('resultPlaceholder')} /></label>
      <div><button type="button" disabled={!result || busy} onClick={copy}>{t('copy')}</button></div>
    </section>
  </div>;
}
