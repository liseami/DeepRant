/**
 * [INPUT]: 依赖 StoreProvider 的短语缓存、专用写入命令和共享快捷键录制器
 * [OUTPUT]: 提供列表内的短语编辑、增删、启用开关与快捷键录制
 * [POS]: 游戏常用指令管理入口；注册与回滚由 Rust 负责，WebView 只展示最终状态
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useStore } from '../components/StoreProvider';
import HotkeyRecorder from '../components/HotkeyRecorder';
import { showError, showSuccess } from '../utils/toast';

function PhraseRow({ phrase }) {
    const { runCommand, t, locale } = useStore();
    const [text, setText] = useState(phrase.phrase);
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState(false);
    useEffect(() => setText(phrase.phrase), [phrase.phrase]);

    async function mutate(command, args, message) {
        setBusy(true);
        try {
            await runCommand(command, args);
            if (message) showSuccess(t(message));
            if (command === 'update_phrase') setEditing(false);
        } catch (failure) { showError(failure); }
        finally { setBusy(false); }
    }

    function save(event) {
        event.preventDefault();
        if (!text.trim()) { showError(t('phraseEmpty')); return; }
        mutate('update_phrase', { id: phrase.id, phrase: text.trim() }, 'phraseSaved');
    }

    return (
        <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
            <td className="py-4 pr-4 text-zinc-900 dark:text-white">
                {editing ? <form onSubmit={save} className="space-y-2">
                    <textarea aria-label={t('phraseText')} value={text} rows={2} maxLength={4000} disabled={busy}
                        onChange={event => setText(event.target.value)}
                        className="w-full min-w-48 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm resize-y" />
                    <div className="flex gap-2">
                        <button type="submit" disabled={busy || !text.trim()} className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs disabled:opacity-50">{t(busy ? 'saving' : 'save')}</button>
                        <button type="button" disabled={busy} onClick={() => { setText(phrase.phrase); setEditing(false); }} className="px-3 py-1.5 rounded-lg text-zinc-500 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800">{t('cancel')}</button>
                    </div>
                </form> : <span className="whitespace-pre-wrap break-words">{phrase.phrase}</span>}
            </td>
            <td className="py-4 pr-4">
                <HotkeyRecorder disabled={busy} label={t('setHotkey')} hotkey={phrase.hotkey}
                    onSave={keys => runCommand('update_phrase_hotkey', { id: phrase.id, keys })} />
            </td>
            <td className="py-4">
                <div className="flex items-center justify-end gap-2 flex-wrap">
                    <label className="flex items-center gap-2 text-xs text-zinc-500 whitespace-nowrap">
                        <input type="checkbox" checked={phrase.enabled} disabled={busy} className="accent-zinc-900"
                            onChange={event => mutate('set_phrase_enabled', { id: phrase.id, enabled: event.target.checked })} />
                        {t('enabled')}
                    </label>
                    {!editing && <button type="button" disabled={busy} onClick={() => setEditing(true)} className="px-2 py-1 text-xs text-zinc-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">{locale === 'zh' ? '编辑' : 'Edit'}</button>}
                    <button type="button" disabled={busy} onClick={() => mutate('delete_phrase', { id: phrase.id }, 'phraseRemoved')} className="px-2 py-1 text-xs text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">{t('remove')}</button>
                </div>
            </td>
        </tr>
    );
}

export default function Phrases() {
    const { settings, runCommand, t, locale } = useStore();
    const [busy, setBusy] = useState(false);
    const chinese = locale === 'zh';

    async function mutate(command, args) {
        setBusy(true);
        try { await runCommand(command, args); }
        catch (failure) { showError(failure); }
        finally { setBusy(false); }
    }

    return (
        <div className="h-full flex flex-col gap-6 p-6">
            <motion.div className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{chinese ? '常用语' : 'Phrases'}</h1>
                    <div className="flex items-center gap-4 flex-wrap">
                        <label className="flex items-center gap-2 text-sm text-zinc-500">
                            <input type="checkbox" checked={settings.phrases_enabled} disabled={busy} className="accent-zinc-900"
                                onChange={event => mutate('set_phrases_enabled', { enabled: event.target.checked })} />
                            {t('phrasesSwitch')}
                        </label>
                        <button type="button" disabled={busy} onClick={() => mutate('add_phrase', { phrase: t('newPhrase') })}
                            className="px-3 py-2 text-xs rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors">{t('addPhrase')}</button>
                    </div>
                </div>
                <div className="overflow-auto">
                    <table className="min-w-full">
                        <thead><tr className="border-b border-zinc-200 dark:border-zinc-800">
                            <th scope="col" className="py-3 pr-4 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">{chinese ? '文字' : 'Text'}</th>
                            <th scope="col" className="py-3 pr-4 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400">{chinese ? '快捷键' : 'Shortcut'}</th>
                            <th scope="col" className="py-3 text-right text-sm font-medium text-zinc-500 dark:text-zinc-400">{chinese ? '操作' : 'Actions'}</th>
                        </tr></thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {settings.phrases.length ? settings.phrases.map(phrase => <PhraseRow key={phrase.id} phrase={phrase} />)
                                : <tr><td colSpan={3} className="py-8 text-center text-sm text-zinc-400">{t('emptyPhrases')}</td></tr>}
                        </tbody>
                    </table>
                </div>
                <p className="mt-4 text-xs text-zinc-400 leading-relaxed">{t('hotkeyHelp')}</p>
            </motion.div>
            <div className="h-12" />
        </div>
    );
}
