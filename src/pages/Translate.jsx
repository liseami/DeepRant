/**
 * [INPUT]: 依赖 StoreProvider 的游戏翻译风格设置、Rust translate_text 与系统剪贴板
 * [OUTPUT]: 提供 toxic / pro / auto 三种游戏翻译模式，以及次级手动翻译卡片
 * [POS]: 游戏内翻译的表达策略入口；主流程通过全局快捷键执行，受限输入框可用辅助翻译
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { motion } from 'framer-motion';
import { useState } from 'react';
import { GamingPad, FaceOldFace, Whistle } from '../icons';
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { useStore } from '../components/StoreProvider';
import { languageName } from '../data/languages';
import { showError, showSuccess } from '../utils/toast';

const cardClassName = 'flex flex-col bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm';
const modes = [
    { id: 'toxic', Icon: Whistle, name: ['嘴臭模式', 'Trash talk'], description: ['将友好的对话转换为富有火药味的表达，适合竞技游戏的氛围。', 'Give your words a competitive edge for heated game chat.'] },
    { id: 'pro', Icon: GamingPad, name: ['职业玩家模式', 'Pro player'], description: ['使用专业的游戏术语和简短指令，提高团队配合效率。', 'Use game terminology and concise calls to coordinate your team.'] },
    { id: 'auto', Icon: FaceOldFace, name: ['自动模式', 'Automatic'], description: ['根据当前游戏语境自然翻译，保留原文的意思和语气。', 'Translate naturally for your game while preserving the original meaning and tone.'] },
];

export default function Translate() {
    const { settings, updateSettings, t, locale } = useStore();
    const [changingMode, setChangingMode] = useState(false);
    const [text, setText] = useState('');
    const [result, setResult] = useState('');
    const [busy, setBusy] = useState(false);
    const chinese = locale === 'zh';

    async function changeMode(mode) {
        setChangingMode(true);
        try { await updateSettings({ translation_mode: settings.translation_mode === mode ? 'auto' : mode }); }
        catch (failure) { showError(failure); }
        finally { setChangingMode(false); }
    }

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

    return (
        <div className="h-full flex flex-col gap-6">
            <motion.div className={`w-full ${cardClassName}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">{chinese ? '翻译模式' : 'Translation modes'}</h1>
                <p className="text-zinc-600 dark:text-zinc-400">{chinese ? '选择一个翻译模式来适应不同的游戏场景。这些模式是互斥的，一次只能启用一个模式。' : 'Choose the translation mode that suits your game. Only one mode is active at a time.'}</p>
            </motion.div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                {modes.map(({ id, Icon, name, description }, index) => {
                    const active = settings.translation_mode === id;
                    return <motion.button key={id} type="button" aria-pressed={active} disabled={changingMode} onClick={() => changeMode(id)}
                        className={`${cardClassName} cursor-pointer transition-all text-left ${active ? 'border-zinc-900 dark:border-zinc-100 shadow-lg' : ''}`}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (index + 1) * 0.1 }}>
                        <span className="flex items-center justify-between w-full gap-3">
                            <span className="flex items-center gap-3 text-sm text-zinc-500"><Icon className="w-6 h-6 stroke-zinc-500" />{name[chinese ? 0 : 1]}</span>
                            <span aria-hidden="true" className={`w-10 h-6 shrink-0 rounded-full transition-colors relative ${active ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                                <span className={`absolute w-4 h-4 rounded-full bg-white dark:bg-zinc-900 top-1 transition-all ${active ? 'left-5' : 'left-1'}`} />
                            </span>
                        </span>
                        <span className="mt-4 text-sm text-zinc-400">{description[chinese ? 0 : 1]}</span>
                    </motion.button>;
                })}
            </div>

            <details className={cardClassName}>
                <summary className="cursor-pointer text-sm text-zinc-500">{chinese ? '辅助翻译' : 'Auxiliary translation'}</summary>
                <p className="mt-4 text-xs text-zinc-400 leading-relaxed">{t('manualDescription')} {languageName(settings.translation_from, locale)} → {languageName(settings.translation_to, locale)}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <form onSubmit={translate} className="space-y-3">
                        <label htmlFor="manual-source" className="block text-sm text-zinc-500">{t('inputText')}</label>
                        <textarea id="manual-source" rows={5} value={text} maxLength={20000} placeholder={t('inputPlaceholder')}
                            disabled={busy} onChange={event => setText(event.target.value)}
                            className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white resize-y" />
                        <button type="submit" disabled={busy || !text.trim()} className="px-3 py-2 text-xs text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-lg disabled:opacity-50">{t(busy ? 'translating' : 'translateAction')}</button>
                    </form>
                    <section className="space-y-3" aria-live="polite" aria-busy={busy}>
                        <label htmlFor="manual-result" className="block text-sm text-zinc-500">{t('resultText')}</label>
                        <textarea id="manual-result" rows={5} value={result} readOnly placeholder={t('resultPlaceholder')}
                            className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white resize-y" />
                        <button type="button" disabled={!result || busy} onClick={copy} className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50">{t('copy')}</button>
                    </section>
                </div>
            </details>
        </div>
    );
}
