/**
 * [INPUT]: 依赖 cromma-ui / Pika、StoreProvider 公开模型设置、供应商预设和 Rust 凭据 / 测连命令
 * [OUTPUT]: 提供模型选择 / API 配置双面板、个人 Key 编辑与保存测连
 * [POS]: 游戏翻译的模型配置入口；统一消费 CCBaga 同源控件，凭据只在本地草稿短暂存在
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect } from 'react';
import { Panel, PanelHeader, Button, Input, Select, SidebarButton, motion, MOTION } from 'cromma-ui';
import { Server, CrownWinnerKing, ShieldCheck, CheckTickCircle, Refresh } from 'cromma-ui/pika';
import { invoke } from '@tauri-apps/api/core';
import { useStore } from '../components/StoreProvider';
import { MODELS } from '../data/models';
import { showSuccess, showError } from '../utils/toast';

export default function Settings() {
    const { settings, updateSettings, runCommand, t, locale } = useStore();
    const [draft, setDraft] = useState({ ...settings.custom_model, model_type: settings.model_type });
    const [key, setKey] = useState('');
    const [busy, setBusy] = useState('');
    const model = settings.custom_model;
    const chinese = locale === 'zh';

    useEffect(() => {
        setDraft({ api_url: model.api_url, model_name: model.model_name, protocol: model.protocol || 'openai', model_type: settings.model_type });
        setKey('');
    }, [model.api_url, model.model_name, model.protocol, settings.model_type]);

    let isLocal = false;
    try {
        const host = new URL(draft.api_url).hostname;
        isLocal = host === 'localhost' || host === '[::1]' || /^127\./.test(host);
    } catch { /* -------- 未完成的地址草稿仍显示 Key 输入 -------- */ }
    const hasKey = model.has_api_key && draft.api_url === model.api_url && draft.protocol === model.protocol;
    const change = (field, value) => setDraft(current => ({ ...current, [field]: value }));

    function selectModel(id) {
        if (id === 'custom') change('model_type', id);
        else setDraft({ ...MODELS[id], model_type: id });
        setKey('');
    }

    async function save(test = false) {
        if (!draft.api_url.trim() || !draft.model_name.trim()) { showError(t('requiredModel')); return; }
        setBusy(test ? 'testing' : 'saving');
        try {
            await updateSettings({ model_type: draft.model_type, custom_model: {
                api_url: draft.api_url.trim(), model_name: draft.model_name.trim(), protocol: draft.protocol,
                ...(key.trim() && !isLocal ? { auth: key.trim() } : {}),
            } });
            setKey('');
            if (test) { await invoke('test_model_connection'); showSuccess(t('connectionOk')); }
            else showSuccess(t('saved'));
        } catch (failure) { showError(failure); }
        finally { setBusy(''); }
    }

    async function clearKey() {
        setBusy('saving');
        try { await runCommand('clear_api_key'); setKey(''); showSuccess(t('keyDeleted')); }
        catch (failure) { showError(failure); }
        finally { setBusy(''); }
    }

    return (
        <section className="min-w-0">
            <header className="workspace-title">
                <h1>{chinese ? 'AI模型设置' : 'AI model settings'}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{chinese ? '管理您的API配置和模型信息。' : 'Manage your API configuration and AI models.'}</p>
            </header>
            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={MOTION.base}>
                <Panel>
                    <PanelHeader title={<span className="flex items-center gap-2"><CrownWinnerKing size={18} aria-hidden="true" />{chinese ? '模型选择' : 'Model selection'}</span>} />
                    <div className="space-y-1.5 p-3">
                        {Object.entries(MODELS).map(([id, preset]) => (
                            <SidebarButton key={id} disabled={Boolean(busy)} active={draft.model_type === id} aria-pressed={draft.model_type === id}
                                onClick={() => selectModel(id)} className="w-full gap-3 p-3">
                                <Server size={18} aria-hidden="true" className="shrink-0 text-muted-foreground" />
                                <span className="flex min-w-0 flex-1 flex-col gap-1">
                                    <span className="text-base font-medium">{id === 'custom' ? (chinese ? '自定义模型' : 'Custom model') : preset.name}</span>
                                    <span className="truncate text-sm text-muted-foreground font-mono">{preset.model_name || (chinese ? '填写自己的模型配置' : 'Use your own configuration')}</span>
                                </span>
                                {draft.model_type === id && <CheckTickCircle size={18} aria-hidden="true" className="shrink-0" />}
                            </SidebarButton>
                        ))}
                    </div>
                </Panel>
                <Panel>
                    <PanelHeader title={<span className="flex items-center gap-2"><Server size={18} aria-hidden="true" />{chinese ? 'API配置' : 'API configuration'}</span>} />
                    <form onSubmit={event => { event.preventDefault(); save(); }} className="p-4">
                        <fieldset disabled={Boolean(busy)} className="space-y-4">
                            {!isLocal && <div className="space-y-2">
                                <label htmlFor="model-key" className="block text-sm font-medium">API Key</label>
                                <Input id="model-key" type="password" value={key} size="medium" autoComplete="off" spellCheck="false"
                                    onChange={event => setKey(event.target.value)} placeholder={t('keyPlaceholder')} />
                                <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><ShieldCheck size={14} aria-hidden="true" />{t(hasKey ? 'keySaved' : 'keyMissing')}</p>
                            </div>}
                            <div className="space-y-2">
                                <label htmlFor="model-url" className="block text-sm font-medium">Base URL</label>
                                <Input id="model-url" type="url" required value={draft.api_url || ''} size="medium" spellCheck="false"
                                    onChange={event => change('api_url', event.target.value)} placeholder="https://api.deepseek.com" />
                                <p className="text-sm text-muted-foreground leading-relaxed">{t('baseUrlHelp')}</p>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="model-name" className="block text-sm font-medium">Model Name</label>
                                <Input id="model-name" required value={draft.model_name || ''} size="medium" spellCheck="false"
                                    onChange={event => change('model_name', event.target.value)} placeholder="deepseek-flash" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="model-protocol" className="block text-sm font-medium">{t('protocol')}</label>
                                <Select id="model-protocol" aria-label={t('protocol')} size="medium" value={draft.protocol || 'openai'} disabled={Boolean(busy)}
                                    onValueChange={value => change('protocol', value)} items={[
                                        { value: 'openai', label: 'OpenAI compatible' },
                                        { value: 'anthropic', label: 'Anthropic Messages' },
                                    ]} />
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{t(isLocal ? 'localKeyHelp' : 'keyHelp')}</p>
                            <div className="flex items-center gap-2 flex-wrap pt-2">
                                <Button type="submit" variant="ink" size="small" loading={busy === 'saving'} disabled={Boolean(busy)}>{t(busy === 'saving' ? 'saving' : 'save')}</Button>
                                <Button type="button" variant="secondary" size="small" leftIcon={<Refresh size={14} aria-hidden="true" />} loading={busy === 'testing'} disabled={Boolean(busy)} onClick={() => save(true)}>{t(busy === 'testing' ? 'testing' : 'testConnection')}</Button>
                                {!isLocal && hasKey && <Button type="button" variant="ghost" size="small" disabled={Boolean(busy)} onClick={clearKey}>{t('clearKey')}</Button>}
                            </div>
                        </fieldset>
                    </form>
                </Panel>
            </motion.div>
        </section>
    );
}
