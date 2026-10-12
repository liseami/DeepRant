/**
 * [INPUT]: 依赖 Cromma UI / Pika、公开风格与通用提示词、Rust 翻译与复制命令
 * [OUTPUT]: 提供游戏 / 日常共用的三种表达风格、通用提示词和次级辅助翻译
 * [POS]: 表达策略集中编辑，所有输入方式消费同一后端提示词，不在页面自行拼接模型请求
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
    { id: 'toxic', Icon: MegaphoneAnnouncementShout, name: ['嘴臭模式', 'Trash talk'], description: ['将友好的对话转换为富有火药味的表达，适合竞技游戏的氛围。', 'Give your words a competitive edge for heated game chat.'] },
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
    const chinese = locale === 'zh';

    useEffect(() => { setInstructions(settings.custom_instructions || ''); }, [settings.custom_instructions]);

    async function saveInstructions(event) {
        event.preventDefault();
        setSavingInstructions(true);
        try { await updateSettings({ custom_instructions: instructions }); showSuccess(t('saved')); }
        catch (failure) { showError(failure); }
        finally { setSavingInstructions(false); }
    }

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
        try { await invoke('copy_plain_text', { text: result }); showSuccess(t('copied')); }
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
                    <PanelHeader title={chinese ? '通用提示词' : 'Custom instructions'} subtitle={chinese ? '适用于游戏、QQ、微信和社区表达；术语对照表在主页编辑。' : 'Applies to games, messaging, and social conversations. Edit your glossary on Home.'} />
                    <form onSubmit={saveInstructions} className="space-y-3 p-4">
                        <label htmlFor="custom-instructions" className="block text-sm font-medium">{chinese ? '你的表达偏好' : 'Your preferences'}</label>
                        <Textarea id="custom-instructions" rows={3} maxLength={12000} value={instructions} disabled={savingInstructions}
                            placeholder={chinese ? '例如：帮我用简短、有逻辑的口语回复，保留我的立场，不添加人身攻击。' : 'For example: keep replies brief, conversational, and logical. Preserve my position without adding personal attacks.'}
                            onChange={event => setInstructions(event.target.value)} />
                        <Button type="submit" variant="secondary" size="small" loading={savingInstructions}
                            disabled={savingInstructions || instructions === (settings.custom_instructions || '')}>{t('save')}</Button>
                    </form>
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
