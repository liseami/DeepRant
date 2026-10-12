/**
 * [INPUT]: 依赖 StoreProvider 的短语缓存、专用 CRUD / 启用命令和共享快捷键录制器
 * [OUTPUT]: 提供短语文本编辑、增删、整体 / 单条开关与快捷键修改
 * [POS]: 短语管理的唯一用户入口；快捷键注册与回滚留在 Rust 事务中
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect, useState } from 'react';
import { useStore } from '../components/StoreProvider';
import HotkeyRecorder from '../components/HotkeyRecorder';
import { showError, showSuccess } from '../utils/toast';

function PhraseRow({ phrase }) {
  const { runCommand, t } = useStore();
  const [text, setText] = useState(phrase.phrase);
  const [busy, setBusy] = useState(false);
  useEffect(() => setText(phrase.phrase), [phrase.phrase]);

  async function mutate(command, args, message) {
    setBusy(true);
    try { await runCommand(command, args); if (message) showSuccess(t(message)); }
    catch (failure) { showError(failure); }
    finally { setBusy(false); }
  }

  async function save(event) {
    event.preventDefault();
    if (!text.trim()) { showError(t('phraseEmpty')); return; }
    await mutate('update_phrase', { id: phrase.id, phrase: text.trim() }, 'phraseSaved');
  }

  return <form className="card phrase-row" onSubmit={save}>
    <fieldset disabled={busy} className="page-stack" style={{ gap: 14 }}>
      <label>{t('phraseText')}<textarea value={text} rows={2} maxLength={4000} onChange={event => setText(event.target.value)} /></label>
      <div className="actions">
        <button type="submit" disabled={text === phrase.phrase || !text.trim()}>{t(busy ? 'saving' : 'save')}</button>
        <label className="check-label"><input type="checkbox" checked={phrase.enabled}
          onChange={event => mutate('set_phrase_enabled', { id: phrase.id, enabled: event.target.checked })} />{t('enabled')}</label>
        <button type="button" className="danger" onClick={() => mutate('delete_phrase', { id: phrase.id }, 'phraseRemoved')}>{t('remove')}</button>
      </div>
    </fieldset>
    <div><HotkeyRecorder disabled={busy} label={t('setHotkey')} hotkey={phrase.hotkey}
      onSave={keys => runCommand('update_phrase_hotkey', { id: phrase.id, keys })} /></div>
  </form>;
}

export default function Phrases() {
  const { settings, runCommand, t } = useStore();
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    try { await runCommand('add_phrase', { phrase: t('newPhrase') }); }
    catch (failure) { showError(failure); }
    finally { setBusy(false); }
  }

  return <div className="page-stack">
    <header><h1>{t('phrasesTitle')}</h1><p>{t('phrasesDescription')}</p></header>
    <div className="card actions">
      <label className="check-label"><input type="checkbox" checked={settings.phrases_enabled}
        onChange={event => runCommand('set_phrases_enabled', { enabled: event.target.checked }).catch(showError)} />{t('phrasesSwitch')}</label>
      <button type="button" disabled={busy} onClick={add}>{t('addPhrase')}</button>
    </div>
    <small>{t('hotkeyHelp')}</small>
    {settings.phrases.length ? settings.phrases.map(phrase => <PhraseRow key={phrase.id} phrase={phrase} />) : <p>{t('emptyPhrases')}</p>}
  </div>;
}
