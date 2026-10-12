/**
 * [INPUT]: 依赖 Cromma UI / Pika、公开风格与自定义提示词、Rust 提示词查询 / 复制和翻译命令
 * [OUTPUT]: 提供游戏 / 日常共用的三种表达风格、自定义提示词编辑、生效提示词查看和次级辅助翻译
 * [POS]: 表达策略集中编辑；提示词生成、复制和持久化由 Rust 统一负责，页面只展示保存后的实际策略
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect, useState } from 'react';
import { Panel, PanelHeader, Button, Textarea, SidebarButton, motion, MOTION } from 'cromma-ui';
import { MegaphoneAnnouncementShout, KeyboardWired, Translate as TranslateIcon, CheckTickCircle, CopyDefault, SendPlaneHorizontal } from 'cromma-ui/pika';
import { invoke } from '@tauri-apps/api/core';
import { useStore } from '../components/StoreProvider';
import { languageName } from '../data/languages';
import { showError, showSuccess } from '../utils/toast';

const modes = [
    { id: 'toxic', Icon: MegaphoneAnnouncementShout, name: ['嘴臭模式', 'Trash talk'], description: ['脏话、battle、diss 和西海岸式张狂，用大胆比喻与创造性嘲讽放大原话的火药味。', 'Profanity, battle energy, diss lines, and West Coast swagger. Turn up the heat with bold metaphors and inventive roasts.'] },
    { id: 'pro', Icon: KeyboardWired, name: ['职业玩家模式', 'Pro player'], description: ['使用专业的游戏术语和简短指令，提高团队配合效率。', 'Use game terminology and concise calls to coordinate your team.'] },
    { id: 'auto', Icon: TranslateIcon, name: ['自动模式', 'Automatic'], description: ['根据当前游戏语境自然翻译，保留原文的意思和语气。', 'Translate naturally for your game while preserving the original meaning and tone.'] },
];

export default function Translate() {
    const { settings, updateSettings, t, locale } = useStore();
    const [changingMode, setChangingMode] = useState(false);
    const [text, setText] = useState('');
    const [result, setResult] = useState('');
    const [busy, setBusy] = useState(false);
    const [instructions, setInstructions] = useState(settings.custom_instructions || '');
    const [savingInstructions, setSavingInstructions] = useState(false);
    const [effectivePrompt, setEffectivePrompt] = useState('');
    const [loadingPrompt, setLoadingPrompt] = useState(true);
    const [promptRevision, setPromptRevision] = useState(0);
    const chinese = locale === 'zh';

    useEffect(() => { setInstructions(settings.custom_instructions || ''); }, [settings.custom_instructions]);
    useEffect(() => {
        let active = true;
        setLoadingPrompt(true);
        invoke('get_translation_prompt').then(prompt => { if (active) setEffectivePrompt(prompt); })
            .catch(failure => { if (active) { setEffectivePrompt(''); showError(failure); } })
            .finally(() => { if (active) setLoadingPrompt(false); });
        return () => { active = false; };
    }, [settings, promptRevision]);

    async function saveInstructions(event) {
        event.preventDefault();
        setSavingInstructions(true);
        try { await updateSettings({ custom_instructions: instructions }); showSuccess(t('saved')); }
        catch (failure) { showError(failure); }
        finally { setSavingInstructions(false); }
    }

    async function changeMode(mode) {
        if (settings.translation_mode === mode) return;
        setChangingMode(true);
        try { await updateSettings({ translation_mode: mode }); }
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
        try { await invoke('copy_plain_text', { text: result }); showSuccess(t('copied')); }
        catch (failure) { showError(failure); }
    }

    async function copyPrompt() {
        try { await invoke('copy_translation_prompt'); showSuccess(t('copied')); }
        catch (failure) { showError(failure); }
    }

    return (
        <section className="min-w-0">
            <header className="workspace-title">
                <h1>{chinese ? '翻译模式' : 'Translation modes'}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{chinese ? '选择适合游戏或日常聊天的表达风格。一次启用一个模式，所有输入方式共用。' : 'Choose a tone for games or everyday conversations. One mode applies across every input workflow.'}</p>
            </header>
            <motion.div className="space-y-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={MOTION.base}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {modes.map(({ id, Icon, name, description }) => {
                        const active = settings.translation_mode === id;
                        return <Panel key={id}>
                            <SidebarButton look="wash" active={active} aria-pressed={active} disabled={changingMode} onClick={() => changeMode(id)}
                                className="h-full min-h-48 flex-col items-stretch gap-5 rounded-none border-0 p-5">
                                <span className="flex items-center justify-between">
                                    <Icon size={18} aria-hidden="true" />
                                    <CheckTickCircle size={18} aria-hidden="true" className={active ? '' : 'opacity-0'} />
                                </span>
                                <span className="flex flex-col gap-2">
                                    <span className="text-lg font-semibold">{name[chinese ? 0 : 1]}</span>
                                    <span className="text-sm text-muted-foreground leading-relaxed">{description[chinese ? 0 : 1]}</span>
                                </span>
                            </SidebarButton>
                        </Panel>;
                    })}
                </div>
                <Panel>
                    <PanelHeader title={chinese ? '自定义提示词' : 'Custom prompt'} subtitle={chinese ? '覆盖默认表达风格，保存后同时用于游戏和日常聊天；留空则使用所选模式。' : 'Override the default expression style for games and everyday chat. Leave empty to use the selected mode.'} />
                    <form onSubmit={saveInstructions} className="space-y-3 p-4">
                        <label htmlFor="custom-instructions" className="block text-sm font-medium">{chinese ? '写下你想要的口吻、用词和发挥方式' : 'Describe the voice, wording, and creative style you want'}</label>
                        <Textarea id="custom-instructions" rows={6} maxLength={12000} value={instructions} disabled={savingInstructions}
                            placeholder={chinese ? '例如：像西海岸 battle 一样回嘴，敢用脏话、押韵和荒诞比喻，短句重击，把原话里的嘲讽放大。' : 'For example: clap back with West Coast battle swagger, profanity, rhyme, and absurd metaphors. Hit hard with short lines and amplify the original roast.'}
                            onChange={event => setInstructions(event.target.value)} />
                        <Button type="submit" variant="secondary" size="small" loading={savingInstructions}
                            disabled={savingInstructions || instructions === (settings.custom_instructions || '')}>{t('save')}</Button>
                    </form>
                </Panel>
                <Panel>
                    <PanelHeader title={chinese ? '当前生效提示词' : 'Active prompt'} subtitle={chinese ? '完整查看当前语言、场景、模式和已保存自定义提示词的实际组合；未保存的修改不会生效。' : 'See the complete prompt for your language, scene, mode, and saved custom instructions. Unsaved edits do not apply.'} />
                    <div className="space-y-3 p-4" aria-busy={loadingPrompt}>
                        <label htmlFor="effective-prompt" className="block text-sm font-medium">{chinese ? '实际发送给模型的提示词' : 'Prompt sent to the model'}</label>
                        <Textarea id="effective-prompt" rows={10} value={effectivePrompt} readOnly className="font-mono text-sm leading-relaxed"
                            placeholder={chinese ? (loadingPrompt ? '正在读取生效提示词…' : '读取失败，请刷新重试。') : (loadingPrompt ? 'Loading the active prompt…' : 'Could not load the prompt. Refresh to try again.')} />
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="secondary" size="small" loading={loadingPrompt} disabled={loadingPrompt}
                                onClick={() => setPromptRevision(revision => revision + 1)}>{chinese ? '刷新' : 'Refresh'}</Button>
                            <Button type="button" variant="secondary" size="small" leftIcon={<CopyDefault size={14} aria-hidden="true" />}
                                disabled={loadingPrompt || !effectivePrompt} onClick={copyPrompt}>{chinese ? '复制提示词' : 'Copy prompt'}</Button>
                        </div>
                    </div>
                </Panel>
                <Panel>
                    <details>
                        <summary className="cursor-pointer px-4 py-4 text-base font-medium">{chinese ? '辅助翻译' : 'Auxiliary translation'}</summary>
                        <PanelHeader title={t('manualTitle')} subtitle={`${languageName(settings.translation_from, locale)} → ${languageName(settings.translation_to, locale)}`} />
                        <p className="px-4 pt-4 text-sm text-muted-foreground leading-relaxed">{t('manualDescription')}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                            <form onSubmit={translate} className="space-y-3">
                                <label htmlFor="manual-source" className="block text-sm font-medium">{t('inputText')}</label>
                                <Textarea id="manual-source" rows={6} value={text} maxLength={20000} placeholder={t('inputPlaceholder')}
                                    disabled={busy} onChange={event => setText(event.target.value)} />
                                <Button type="submit" variant="ink" size="small" leftIcon={<SendPlaneHorizontal size={14} aria-hidden="true" />} loading={busy} disabled={busy || !text.trim()}>{t(busy ? 'translating' : 'translateAction')}</Button>
                            </form>
                            <section className="space-y-3" aria-live="polite" aria-busy={busy}>
                                <label htmlFor="manual-result" className="block text-sm font-medium">{t('resultText')}</label>
                                <Textarea id="manual-result" rows={6} value={result} readOnly placeholder={t('resultPlaceholder')} />
                                <Button type="button" variant="secondary" size="small" leftIcon={<CopyDefault size={14} aria-hidden="true" />} disabled={!result || busy} onClick={copy}>{t('copy')}</Button>
                            </section>
                        </div>
                    </details>
                </Panel>
            </motion.div>
        </section>
    );
}
