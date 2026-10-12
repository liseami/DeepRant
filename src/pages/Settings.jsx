/**
 * [INPUT]: 依赖 StoreProvider 的公开模型设置、供应商预设和 Rust 凭据 / 测连命令
 * [OUTPUT]: 提供原双卡模型选择、个人 Key / 协议 / 地址编辑与保存测连
 * [POS]: 模型配置入口；保留游戏软件的原卡片界面，凭据只在本地草稿短暂存在
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { motion } from 'framer-motion';
import { Server, Crown, Sparkles, Cube } from '../icons';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useStore } from '../components/StoreProvider';
import { MODELS } from '../data/models';
import { showSuccess, showError } from '../utils/toast';

const cardClassName = 'flex flex-col bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm';
const inputClassName = 'w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50';

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
        <div className="h-full flex flex-col gap-6">
            <motion.div className={`w-full ${cardClassName}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">{chinese ? 'AI模型设置' : 'AI model settings'}</h1>
                <p className="text-zinc-600 dark:text-zinc-400">{chinese ? '管理您的API配置和模型信息。' : 'Manage your API configuration and AI models.'}</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div className={cardClassName} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 text-sm text-zinc-500 mb-6">
                        <Crown className="w-5 h-5 stroke-zinc-500" />
                        {chinese ? '模型选择' : 'Model selection'}
                    </div>
                    <div className="space-y-3">
                        {Object.entries(MODELS).map(([id, preset]) => (
                            <button key={id} type="button" disabled={Boolean(busy)} aria-pressed={draft.model_type === id}
                                onClick={() => selectModel(id)}
                                className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors disabled:opacity-50">
                                <div className="flex items-center gap-3 flex-wrap text-left">
                                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{id === 'custom' ? (chinese ? '自定义模型' : 'Custom model') : preset.name}</span>
                                    {preset.model_name && <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md">
                                        <Cube className="w-3.5 h-3.5 stroke-zinc-500" />
                                        <span className="text-xs text-zinc-500">{preset.model_name}</span>
                                    </div>}
                                    {id.includes('deepseek') && <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                        <Sparkles className="w-3.5 h-3.5 stroke-blue-500" />
                                        <span className="text-xs text-blue-500">{chinese ? 'DeepSeek 官方' : 'Official DeepSeek'}</span>
                                    </div>}
                                </div>
                                <span className={`w-4 h-4 shrink-0 rounded-full border transition-all ${draft.model_type === id
                                    ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.1)]'
                                    : 'border-zinc-300 dark:border-zinc-600'}`} />
                            </button>
                        ))}
                    </div>
                </motion.div>

                <motion.div className={cardClassName} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="flex items-center gap-3 text-sm text-zinc-500 mb-6">
                        <Server className="w-5 h-5 stroke-zinc-500" />
                        {chinese ? 'API配置' : 'API configuration'}
                    </div>
                    <form onSubmit={event => { event.preventDefault(); save(); }}>
                        <fieldset disabled={Boolean(busy)} className="space-y-4">
                            {!isLocal && <div>
                                <label htmlFor="model-key" className="block text-sm text-zinc-500 mb-2">API Key</label>
                                <input id="model-key" type="password" value={key} autoComplete="off" spellCheck="false" className={inputClassName}
                                    onChange={event => setKey(event.target.value)} placeholder={t('keyPlaceholder')} />
                                <p className="mt-2 text-xs text-zinc-400">{t(hasKey ? 'keySaved' : 'keyMissing')}</p>
                            </div>}
                            <div>
                                <label htmlFor="model-url" className="block text-sm text-zinc-500 mb-2">Base URL</label>
                                <input id="model-url" type="url" required value={draft.api_url || ''} spellCheck="false" className={inputClassName}
                                    onChange={event => change('api_url', event.target.value)} placeholder="https://api.deepseek.com" />
                                <p className="mt-2 text-xs text-zinc-400">{t('baseUrlHelp')}</p>
                            </div>
                            <div>
                                <label htmlFor="model-name" className="block text-sm text-zinc-500 mb-2">Model Name</label>
                                <input id="model-name" required value={draft.model_name || ''} spellCheck="false" className={inputClassName}
                                    onChange={event => change('model_name', event.target.value)} placeholder="deepseek-flash" />
                            </div>
                            <div>
                                <label htmlFor="model-protocol" className="block text-sm text-zinc-500 mb-2">{t('protocol')}</label>
                                <select id="model-protocol" value={draft.protocol || 'openai'} className={inputClassName}
                                    onChange={event => change('protocol', event.target.value)}>
                                    <option value="openai">OpenAI compatible</option>
                                    <option value="anthropic">Anthropic Messages</option>
                                </select>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">{t(isLocal ? 'localKeyHelp' : 'keyHelp')}</p>
                            <div className="pt-2 flex items-center gap-2 flex-wrap">
                                <button type="submit" className="px-3 py-1.5 text-xs text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50">{t(busy === 'saving' ? 'saving' : 'save')}</button>
                                <button type="button" onClick={() => save(true)} className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50">{t(busy === 'testing' ? 'testing' : 'testConnection')}</button>
                                {!isLocal && hasKey && <button type="button" onClick={clearKey} className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">{t('clearKey')}</button>}
                            </div>
                        </fieldset>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
