/**
 * [INPUT]: 依赖 Cromma UI Panel/Select/Button/表单控件、Pika、游戏目录和 Rust 设置缓存
 * [OUTPUT]: 提供游戏/日常模式、游戏选择以及同款模态中的自定义场景和词库编辑
 * [POS]: 游戏主页的语境入口，游戏术语解释权在 Rust，自定义编辑共用 AppDialog 焦点边界
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect, useId } from 'react';
import { Panel, PanelHeader, Button, Select, Input, Textarea, motion, MOTION } from 'cromma-ui';
import { WindowBrowser, Refresh, Globe, Notebook } from 'cromma-ui/pika';
import { useStore } from '../../../components/StoreProvider';
import AppDialog from '../../../components/AppDialog';
import { GAMES, sceneName } from '../../../data/scenes';
import { showError, showSuccess } from '../../../utils/toast';

export default function GameSceneCard() {
  const { settings, updateSettings, locale, t } = useStore();
  const [draft, setDraft] = useState({ custom_scene_name: settings.custom_scene_name, custom_scene_prompt: settings.custom_scene_prompt, custom_glossary: settings.custom_glossary });
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const formId = useId();
  const gameId = settings.game_scene;
  const isDaily = settings.daily_mode;
  const english = locale === 'en';
  const ModeIcon = isDaily ? Globe : WindowBrowser;

  function closeEditor(next) {
    if (saving) return;
    if (!next) setDraft({ custom_scene_name: settings.custom_scene_name, custom_scene_prompt: settings.custom_scene_prompt, custom_glossary: settings.custom_glossary });
    setOpen(next);
  }

  useEffect(() => {
    setDraft({ custom_scene_name: settings.custom_scene_name, custom_scene_prompt: settings.custom_scene_prompt, custom_glossary: settings.custom_glossary });
  }, [settings.custom_scene_name, settings.custom_scene_prompt, settings.custom_glossary]);

  async function selectGame(value) {
    try { await updateSettings({ game_scene: value }); if (value === 'custom') setOpen(true); }
    catch (failure) { showError(failure); }
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try { await updateSettings(draft); setOpen(false); showSuccess(t('saved')); }
    catch (failure) { showError(failure); }
    finally { setSaving(false); }
  }

  return <>
    <motion.div className="min-w-0 h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={MOTION.base}>
      <Panel className="h-full">
        <PanelHeader title={<span className="inline-flex items-center gap-2"><ModeIcon size={18} aria-hidden="true" />{isDaily ? (english ? 'Everyday mode' : '日常模式') : (english ? 'Game mode' : '游戏模式')}</span>}
          actions={<Button variant="secondary" size="small" leftIcon={<Refresh size={14} aria-hidden="true" />}
            onClick={() => updateSettings({ daily_mode: !isDaily }).catch(showError)}>
            {isDaily ? (english ? 'Game' : '游戏模式') : (english ? 'Everyday' : '日常模式')}
          </Button>} />
        <div className="flex-1 min-h-[260px] flex flex-col justify-between gap-6 p-5">
          <p className="text-sm text-muted-foreground leading-relaxed">{isDaily ? (english ? 'Translate selected text' : '划词翻译') : (english
            ? 'Choose a game so translations fit its terminology, such as pushing towers and ganks in MOBAs, or rushes in FPS games.'
            : '合适的游戏场景选择，能保证翻译时更加符合游戏语境，如Moba类游戏中的推塔、gank，fps游戏中的rush等。')}</p>
          <div className="flex flex-col gap-3">
            {!isDaily && <Select aria-label={t('game')} size="large" value={gameId} onValueChange={selectGame}
              items={Object.keys(GAMES).map(value => ({ value, label: value === 'custom' && settings.custom_scene_name ? settings.custom_scene_name : sceneName(value, locale) }))} />}
            <Button variant="ghost" size="small" className="self-start" leftIcon={<Notebook size={14} aria-hidden="true" />} onClick={() => setOpen(true)}>
              {english ? 'Glossary' : '自定义词库'}
            </Button>
          </div>
        </div>
      </Panel>
    </motion.div>
    <AppDialog open={open} onOpenChange={closeEditor}
      title={gameId === 'custom' && !isDaily ? t('customScene') : t('glossary')}
      footer={<div className="flex justify-end gap-2">
        <Button variant="secondary" size="medium" disabled={saving} onClick={() => closeEditor(false)}>{t('cancel')}</Button>
        <Button variant="ink" size="medium" type="submit" form={formId} loading={saving}>{t('save')}</Button>
      </div>}>
      <form id={formId} onSubmit={save}>
        <fieldset disabled={saving} className="flex flex-col gap-4">
          {!isDaily && gameId === 'custom' && <>
            <label className="flex flex-col gap-2 text-sm text-muted-foreground">{t('sceneName')}
              <Input value={draft.custom_scene_name || ''} maxLength={120} onChange={event => setDraft({ ...draft, custom_scene_name: event.target.value })} />
            </label>
            <label className="flex flex-col gap-2 text-sm text-muted-foreground">{t('scenePrompt')}
              <Textarea rows={3} maxLength={12000} value={draft.custom_scene_prompt || ''} placeholder={t('scenePlaceholder')}
                onChange={event => setDraft({ ...draft, custom_scene_prompt: event.target.value })} />
            </label>
          </>}
          <label className="flex flex-col gap-2 text-sm text-muted-foreground">{t('glossary')}
            <Textarea rows={4} maxLength={12000} value={draft.custom_glossary || ''} onChange={event => setDraft({ ...draft, custom_glossary: event.target.value })} />
            <span className="text-xs">{t('glossaryHelp')}</span>
          </label>
        </fieldset>
      </form>
    </AppDialog>
  </>;
}
