/**
 * [INPUT]: 依赖游戏目录、原版 SVG/下拉菜单和 Rust 设置缓存
 * [OUTPUT]: 提供原版游戏/日常切换、游戏选择及自定义场景/词库编辑
 * [POS]: 主页游戏语境入口；新游戏共享原菜单，自定义编辑作为辅助对话框，不替换原三卡布局
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GamingPad, Repeat01, IMac } from '../../../icons';
import { useStore } from '../../../components/StoreProvider';
import DropdownMenu from '../../../components/DropdownMenu';
import { GAMES, sceneName } from '../../../data/scenes';
import { showError, showSuccess } from '../../../utils/toast';

export default function GameSceneCard() {
  const [showMenu, setShowMenu] = useState(false);
  const { settings, updateSettings, locale, t } = useStore();
  const [draft, setDraft] = useState({ custom_scene_name: settings.custom_scene_name, custom_scene_prompt: settings.custom_scene_prompt, custom_glossary: settings.custom_glossary });
  const [saving, setSaving] = useState(false);
  const editor = useRef(null);
  const gameId = settings.game_scene;
  const isDaily = settings.daily_mode;
  const english = locale === 'en';

  useEffect(() => {
    setDraft({ custom_scene_name: settings.custom_scene_name, custom_scene_prompt: settings.custom_scene_prompt, custom_glossary: settings.custom_glossary });
  }, [settings.custom_scene_name, settings.custom_scene_prompt, settings.custom_glossary]);

  async function handleGameSelect(id) {
    setShowMenu(false);
    try {
      await updateSettings({ game_scene: id });
      if (id === 'custom') editor.current?.showModal();
    } catch (failure) { showError(failure); }
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try { await updateSettings(draft); editor.current?.close(); showSuccess(t('saved')); }
    catch (failure) { showError(failure); }
    finally { setSaving(false); }
  }

  return (
    <motion.div
      className="relative h-full flex flex-col bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          {isDaily ? <IMac className="w-6 h-6 stroke-zinc-500" /> : <GamingPad className="w-6 h-6 stroke-zinc-500" />}
          {isDaily ? (english ? 'Everyday mode' : '日常模式') : (english ? 'Game mode' : '游戏模式')}
        </div>
        <div className="flex flex-col items-end">
          <button type="button" onClick={() => updateSettings({ daily_mode: !isDaily }).catch(showError)}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${isDaily ? 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>
            <span>{isDaily ? (english ? 'Game mode' : '游戏模式') : (english ? 'Everyday mode' : '日常模式')}</span>
            <Repeat01 className="w-4 h-4 text-zinc-600 hover:text-zinc-600 transition-colors" />
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-between mt-4">
        <div className="text-sm text-zinc-400">
          {isDaily ? (english ? 'Translate selected text' : '划词翻译') : (english
            ? 'Choose a game so translations fit its terminology, such as pushing towers and ganks in MOBAs, or rushes in FPS games.'
            : ' 合适的游戏场景选择，能保证翻译时更加符合游戏语境，如Moba类游戏中的推塔、gank，fps游戏中的rush等。')}
        </div>
        <div className="flex items-end justify-between gap-2">
          {!isDaily && <div className="relative">
            <button type="button" onClick={() => setShowMenu(true)}
              className="px-4 py-1.5 rounded-lg bg-zinc-50 hover:bg-[#EAEAEA] transition-colors text-2xl font-semibold text-zinc-900 dark:text-white">
              {gameId === 'custom' && settings.custom_scene_name ? settings.custom_scene_name : sceneName(gameId, locale)}
            </button>
            <DropdownMenu show={showMenu} onClose={() => setShowMenu(false)}
              options={Object.fromEntries(Object.keys(GAMES).map(id => [id, sceneName(id, locale)]))}
              currentValue={gameId} onSelect={handleGameSelect} />
          </div>}
          <button type="button" className="text-xs text-zinc-400 hover:text-zinc-600 py-2 shrink-0"
            onClick={() => editor.current?.showModal()}>{english ? 'Glossary' : '词库'}</button>
        </div>
      </div>
      <dialog ref={editor} aria-labelledby="game-context-editor-title"
        className="fixed inset-0 m-auto w-[calc(100%_-_32px)] max-w-lg max-h-[calc(100vh-48px)] overflow-auto rounded-2xl bg-white p-6 border border-zinc-200 shadow-xl backdrop:bg-black/20">
        <h2 id="game-context-editor-title" className="text-lg font-semibold text-zinc-900 mb-4">{gameId === 'custom' && !isDaily ? t('customScene') : t('glossary')}</h2>
        <form onSubmit={save}>
          <fieldset disabled={saving} className="flex flex-col gap-4">
            {!isDaily && gameId === 'custom' && <>
              <label className="text-sm text-zinc-600">{t('sceneName')}
                <input className="mt-2 block w-full rounded-lg border border-zinc-200 p-3" value={draft.custom_scene_name || ''} maxLength={120}
                  onChange={event => setDraft({ ...draft, custom_scene_name: event.target.value })} />
              </label>
              <label className="text-sm text-zinc-600">{t('scenePrompt')}
                <textarea className="mt-2 block w-full rounded-lg border border-zinc-200 p-3" rows={3} maxLength={12000}
                  value={draft.custom_scene_prompt || ''} placeholder={t('scenePlaceholder')}
                  onChange={event => setDraft({ ...draft, custom_scene_prompt: event.target.value })} />
              </label>
            </>}
            <label className="text-sm text-zinc-600">{t('glossary')}
              <textarea className="mt-2 block w-full rounded-lg border border-zinc-200 p-3" rows={4} maxLength={12000}
                value={draft.custom_glossary || ''} onChange={event => setDraft({ ...draft, custom_glossary: event.target.value })} />
              <span className="block text-xs text-zinc-400 mt-2">{t('glossaryHelp')}</span>
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className="px-4 py-2 rounded-lg text-sm bg-zinc-100 hover:bg-zinc-200" onClick={() => editor.current?.close()}>{t('cancel')}</button>
              <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-zinc-900 text-white hover:bg-zinc-800">{t(saving ? 'saving' : 'save')}</button>
            </div>
          </fieldset>
        </form>
      </dialog>
    </motion.div>
  );
}
