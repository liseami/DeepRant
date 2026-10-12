/**
 * [INPUT]: 依赖场景目录与 StoreProvider 的游戏 / 日常 / 自定义提示词设置
 * [OUTPUT]: 提供语境选择、自定义说明及统一术语表编辑
 * [POS]: 主页语境配置入口，游戏 ID 和提示词的解释权留在 Rust
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect } from 'react';
import { useStore } from '../../../components/StoreProvider';
import { GAMES, sceneName } from '../../../data/scenes';
import { showError, showSuccess } from '../../../utils/toast';

export default function GameSceneCard() {
  const { settings, updateSettings, t, locale } = useStore();
  const [draft, setDraft] = useState({ custom_scene_name: settings.custom_scene_name, custom_scene_prompt: settings.custom_scene_prompt, custom_glossary: settings.custom_glossary });
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDraft({ custom_scene_name: settings.custom_scene_name, custom_scene_prompt: settings.custom_scene_prompt, custom_glossary: settings.custom_glossary }); },
    [settings.custom_scene_name, settings.custom_scene_prompt, settings.custom_glossary]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try { await updateSettings(draft); showSuccess(t('saved')); }
    catch (failure) { showError(failure); }
    finally { setSaving(false); }
  }

  return <section className="card">
    <h2>{t('scene')}</h2>
    <label className="check-label"><input type="checkbox" checked={settings.daily_mode}
      onChange={event => updateSettings({ daily_mode: event.target.checked }).catch(showError)} />{t('dailyMode')}</label>
    <p className="note" style={{ marginTop: 12 }}>{t(settings.daily_mode ? 'dailyHelp' : 'gameHelp')}</p>
    {!settings.daily_mode && <label style={{ marginTop: 16 }}>{t('game')}<select value={settings.game_scene}
      onChange={event => updateSettings({ game_scene: event.target.value }).catch(showError)}>
      {Object.keys(GAMES).map(id => <option key={id} value={id}>{sceneName(id, locale)}</option>)}
    </select></label>}
    <form onSubmit={save} style={{ marginTop: 18 }}><fieldset disabled={saving} className="page-stack" style={{ gap: 14 }}>
      {!settings.daily_mode && settings.game_scene === 'custom' && <>
        <label>{t('sceneName')}<input value={draft.custom_scene_name || ''} maxLength={120}
          onChange={event => setDraft({ ...draft, custom_scene_name: event.target.value })} /></label>
        <label>{t('scenePrompt')}<textarea value={draft.custom_scene_prompt || ''} rows={3} maxLength={12000} placeholder={t('scenePlaceholder')}
          onChange={event => setDraft({ ...draft, custom_scene_prompt: event.target.value })} /></label>
      </>}
      <label>{t('glossary')}<textarea value={draft.custom_glossary || ''} rows={3} maxLength={12000}
        onChange={event => setDraft({ ...draft, custom_glossary: event.target.value })} /><small>{t('glossaryHelp')}</small></label>
      <div><button type="submit">{t(saving ? 'saving' : 'save')}</button></div>
    </fieldset></form>
  </section>;
}
