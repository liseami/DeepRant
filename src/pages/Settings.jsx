/**
 * [INPUT]: 依赖 Cromma UI / Pika、公开模型设置、共享 Key 读取字段、供应商预设、Rust 服务分类/预设/测连/诊断复制
 * [OUTPUT]: 提供当前模型配置、Key 查看显隐与编辑、通用推理预算及可复制的安全连接诊断
 * [POS]: 模型配置入口；凭据只在局部字段存在，切换服务立即清理；服务分类与诊断由 Rust 生成，前端只显示原生结果和编辑草稿
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect } from 'react';
import { Panel, PanelHeader, Button, Checkbox, Input, Select, SidebarButton, motion, MOTION } from 'cromma-ui';
import { Server, CrownWinnerKing, CheckTickCircle, Refresh, CopyDefault } from 'cromma-ui/pika';
import { invoke } from '@tauri-apps/api/core';
import { useStore } from '../components/StoreProvider';
import ApiKeyField, { useApiKey } from '../components/ApiKeyField';
import { showSuccess, showError } from '../utils/toast';

export default function Settings() {
    const { settings, modelPresets, updateSettings, runCommand, t, locale } = useStore();
    const [draft, setDraft] = useState({ ...settings.custom_model, model_type: settings.model_type });
    const [busy, setBusy] = useState('');
    const [diagnostic, setDiagnostic] = useState(null);
    const model = settings.custom_model;
    const chinese = locale === 'zh';

    useEffect(() => {
        setDraft({ api_url: model.api_url, model_name: model.model_name, protocol: model.protocol || 'openai', reasoning_model: Boolean(model.reasoning_model), model_type: settings.model_type });
    }, [model.api_url, model.model_name, model.protocol, model.reasoning_model, settings.model_type]);

    const [endpointInfo, setEndpointInfo] = useState(null);
    useEffect(() => {
        let active = true;
        const apiUrl = draft.api_url;
        const protocol = draft.protocol || 'openai';
        invoke('inspect_model_endpoint', { apiUrl, protocol }).then(info => {
            if (active) setEndpointInfo({ apiUrl, protocol, ...info });
        }).catch(() => { if (active) setEndpointInfo(null); });
        return () => { active = false; };
    }, [draft.api_url, draft.protocol]);
    const isLocal = endpointInfo?.apiUrl === draft.api_url && endpointInfo?.protocol === draft.protocol && endpointInfo.is_local;
    const hasKey = model.has_api_key && draft.api_url === model.api_url && draft.protocol === model.protocol;
    const credential = useApiKey(draft.api_url, draft.protocol, hasKey && !isLocal);
    const change = (field, value) => setDraft(current => ({ ...current, [field]: value }));

    function selectModel(id) {
        if (id === 'custom') change('model_type', id);
        else { const preset = modelPresets.find(item => item.id === id); if (preset) setDraft({ ...preset, model_type: id }); }
    }

    async function save(test = false) {
        setBusy(test ? 'testing' : 'saving');
        try {
            await updateSettings({ model_type: draft.model_type, custom_model: {
                api_url: draft.api_url.trim(), model_name: draft.model_name.trim(), protocol: draft.protocol, reasoning_model: Boolean(draft.reasoning_model),
                ...(credential.changed && !isLocal ? { auth: credential.value.trim() } : {}),
            } });
            credential.reload();
            if (test) {
                const report = await invoke('test_model_connection');
                setDiagnostic(report);
                if (report.ok) showSuccess(t('connectionOk'));
                else showError(report.message);
            }
            else showSuccess(t('saved'));
        } catch (failure) { showError(failure); }
        finally { setBusy(''); }
    }

    async function copyDiagnostic() {
        try {
            await invoke('copy_connection_diagnostic');
            showSuccess(t('copied'));
        } catch (failure) { showError(failure); }
    }

    async function clearKey() {
        setBusy('saving');
        try { await runCommand('clear_api_key'); credential.setValue(''); showSuccess(t('keyDeleted')); }
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
                        {modelPresets.map(({ id, ...preset }) => (
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
                            {!isLocal && <ApiKeyField id="model-key" credential={credential} hasApiKey={hasKey} disabled={Boolean(busy)} />}
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
                            {draft.protocol !== 'anthropic' && <label className="flex items-start gap-2 text-sm">
                                <Checkbox checked={Boolean(draft.reasoning_model)} onCheckedChange={value => change('reasoning_model', value === true)} />
                                <span>{chinese ? '允许模型思考' : 'Allow model reasoning'}<span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{chinese ? '开启后为推理预留更多输出空间和等待时间。游戏聊天默认关闭，优先快速返回译文。' : 'Reserve more output space and time for reasoning. Keep off for quicker game translations.'}</span></span>
                            </label>}
                            <p className="text-sm text-muted-foreground leading-relaxed">{t(isLocal ? 'localKeyHelp' : 'keyHelp')}</p>
                            <div className="flex items-center gap-2 flex-wrap pt-2">
                                <Button type="submit" variant="ink" size="small" loading={busy === 'saving'} disabled={Boolean(busy) || credential.reading}>{t(busy === 'saving' ? 'saving' : 'save')}</Button>
                                <Button type="button" variant="secondary" size="small" leftIcon={<Refresh size={14} aria-hidden="true" />} loading={busy === 'testing'} disabled={Boolean(busy) || credential.reading} onClick={() => save(true)}>{t(busy === 'testing' ? 'testing' : 'testConnection')}</Button>
                                {!isLocal && hasKey && <Button type="button" variant="ghost" size="small" disabled={Boolean(busy)} onClick={clearKey}>{t('clearKey')}</Button>}
                            </div>
                        </fieldset>
                    </form>
                </Panel>
            </motion.div>
            {diagnostic && <Panel className="mt-4" role="status">
                <PanelHeader title={chinese ? '连接诊断' : 'Connection diagnostics'}
                    actions={<Button variant="secondary" size="small" leftIcon={<CopyDefault size={14} aria-hidden="true" />} onClick={copyDiagnostic}>{chinese ? '复制诊断' : 'Copy diagnostics'}</Button>} />
                <div className="space-y-2 p-4 text-sm">
                    <p className="font-medium">{diagnostic.ok ? (chinese ? '连接成功' : 'Connection succeeded') : (chinese ? '连接失败' : 'Connection failed')} · {diagnostic.seconds}s</p>
                    <p className="break-all font-mono text-muted-foreground">{diagnostic.server} · {diagnostic.protocol} · {diagnostic.model}</p>
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{diagnostic.message}</p>
                </div>
            </Panel>}
        </section>
    );
}
