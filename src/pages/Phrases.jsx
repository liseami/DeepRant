/**
 * [INPUT]: 依赖 cromma-ui / Pika、StoreProvider 的短语缓存、专用写入命令与共享快捷键录制器
 * [OUTPUT]: 提供单面板表格内的短语编辑、增删、启用开关和快捷键录制
 * [POS]: 游戏常用指令管理入口；统一控件维持紧凑列表，快捷键注册与回滚由 Rust 负责
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect, useState } from 'react';
import { Panel, PanelHeader, Button, Textarea, Checkbox, motion, MOTION } from 'cromma-ui';
import { Notebook, PlusDefault } from 'cromma-ui/pika';
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
        <tr className="border-b border-panel-outline last:border-b-0 hover:bg-accent/40 transition-colors">
            <td className="py-4 pr-4 text-base align-middle">
                {editing ? <form onSubmit={save} className="space-y-2">
                    <Textarea aria-label={t('phraseText')} value={text} rows={2} maxLength={4000} disabled={busy}
                        onChange={event => setText(event.target.value)} className="min-w-48" />
                    <div className="flex gap-2">
                        <Button type="submit" variant="ink" size="small" loading={busy} disabled={busy || !text.trim()}>{t(busy ? 'saving' : 'save')}</Button>
                        <Button type="button" variant="ghost" size="small" disabled={busy} onClick={() => { setText(phrase.phrase); setEditing(false); }}>{t('cancel')}</Button>
                    </div>
                </form> : <span className="whitespace-pre-wrap break-words">{phrase.phrase}</span>}
            </td>
            <td className="py-4 pr-4 align-middle">
                <HotkeyRecorder disabled={busy} label={t('setHotkey')} hotkey={phrase.hotkey}
                    onSave={keys => runCommand('update_phrase_hotkey', { id: phrase.id, keys })} />
            </td>
            <td className="py-4 align-middle">
                <div className="flex items-center justify-end gap-2">
                    <Checkbox checked={phrase.enabled} disabled={busy} aria-label={`${t('enabled')}: ${phrase.phrase}`}
                        onCheckedChange={enabled => mutate('set_phrase_enabled', { id: phrase.id, enabled })} />
                    {!editing && <Button type="button" variant="ghost" size="small" disabled={busy} onClick={() => setEditing(true)}>{locale === 'zh' ? '编辑' : 'Edit'}</Button>}
                    <Button type="button" variant="ghost" size="small" disabled={busy} onClick={() => mutate('delete_phrase', { id: phrase.id }, 'phraseRemoved')}>{t('remove')}</Button>
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
        <section className="min-w-0">
            <header className="workspace-title">
                <h1>{chinese ? '常用语' : 'Phrases'}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{t('phrasesDescription')}</p>
            </header>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={MOTION.base}>
                <Panel>
                    <PanelHeader title={<span className="flex items-center gap-2"><Notebook size={18} aria-hidden="true" />{chinese ? '游戏常用语' : 'Game phrases'}</span>}
                        actions={<Button type="button" variant="ink" size="small" loading={busy} disabled={busy}
                            leftIcon={<PlusDefault size={14} aria-hidden="true" />} onClick={() => mutate('add_phrase', { phrase: t('newPhrase') })}>{t('addPhrase')}</Button>} />
                    <div className="flex items-center px-4 py-3 border-b border-panel-outline text-muted-foreground">
                        <Checkbox checked={settings.phrases_enabled} disabled={busy} label={t('phrasesSwitch')}
                            onCheckedChange={enabled => mutate('set_phrases_enabled', { enabled })} />
                    </div>
                    <div className="overflow-x-auto px-4">
                        <table className="min-w-full">
                            <thead><tr className="border-b border-panel-outline">
                                <th scope="col" className="py-3 pr-4 text-left text-sm font-medium text-muted-foreground">{chinese ? '文字' : 'Text'}</th>
                                <th scope="col" className="py-3 pr-4 text-left text-sm font-medium text-muted-foreground">{chinese ? '快捷键' : 'Shortcut'}</th>
                                <th scope="col" className="py-3 text-right text-sm font-medium text-muted-foreground">{chinese ? '启用与操作' : 'Status and actions'}</th>
                            </tr></thead>
                            <tbody>
                                {settings.phrases.length ? settings.phrases.map(phrase => <PhraseRow key={phrase.id} phrase={phrase} />)
                                    : <tr><td colSpan={3} className="py-12 text-center text-sm text-muted-foreground">{t('emptyPhrases')}</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    <p className="px-4 py-3 border-t border-panel-outline text-sm text-muted-foreground leading-relaxed">{t('hotkeyHelp')}</p>
                </Panel>
            </motion.div>
        </section>
    );
}
