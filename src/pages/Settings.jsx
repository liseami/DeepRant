/**
 * [INPUT]: 依赖 StoreProvider、模型预设、Rust 测连与系统凭据命令
 * [OUTPUT]: 提供供应商 / URL / 模型 / 协议编辑、凭据保存删除和连接测试
 * [POS]: 模型配置的用户入口；Key 只在本地草稿中短暂存在，保存成功即清空
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useStore } from '../components/StoreProvider';
import { MODELS } from '../data/models';
import { showSuccess, showError } from '../utils/toast';

export default function Settings() {
  const { settings, updateSettings, runCommand, t } = useStore();
  const [draft, setDraft] = useState({ ...settings.custom_model, model_type: settings.model_type });
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState('');
  const model = settings.custom_model;

  useEffect(() => {
    setDraft({ api_url: model.api_url, model_name: model.model_name, protocol: model.protocol || 'openai', model_type: settings.model_type });
    setKey('');
  }, [model.api_url, model.model_name, model.protocol, settings.model_type]);

  let isLocal = false;
  try {
    const host = new URL(draft.api_url).hostname;
    isLocal = host === 'localhost' || host === '[::1]' || /^127\./.test(host);
  } catch { /* 草稿尚未成为完整 URL 时保留 Key 输入 */ }
  const hasKey = model.has_api_key && draft.api_url === model.api_url && draft.protocol === model.protocol;
  const change = (field, value) => setDraft(current => ({ ...current, [field]: value }));

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

  return <div className="page-stack">
    <header><h1>{t('modelTitle')}</h1><p>{t('modelDescription')}</p></header>
    <form className="card" onSubmit={event => { event.preventDefault(); save(); }}>
      <fieldset disabled={Boolean(busy)} className="form-grid">
        <label>{t('provider')}<select value={draft.model_type in MODELS ? draft.model_type : 'custom'} onChange={event => {
          const id = event.target.value;
          if (id === 'custom') change('model_type', id);
          else setDraft({ ...MODELS[id], model_type: id });
          setKey('');
        }}>{Object.entries(MODELS).map(([id, preset]) => <option key={id} value={id}>{id === 'custom' ? t(preset.name) : preset.name}</option>)}</select></label>
        <label>{t('protocol')}<select value={draft.protocol || 'openai'} onChange={event => change('protocol', event.target.value)}>
          <option value="openai">OpenAI compatible</option><option value="anthropic">Anthropic Messages</option>
        </select></label>
        <label className="full-width">{t('baseUrl')}<input type="url" required value={draft.api_url || ''} spellCheck="false"
          onChange={event => change('api_url', event.target.value)} placeholder="https://api.deepseek.com" />
          <small>{t('baseUrlHelp')}</small></label>
        <label className="full-width">{t('modelName')}<input required value={draft.model_name || ''} spellCheck="false"
          onChange={event => change('model_name', event.target.value)} /><small>{t('modelNameHelp')}</small></label>
        {!isLocal && <label className="full-width">{t('apiKey')}<input type="password" value={key} autoComplete="off" spellCheck="false"
          onChange={event => setKey(event.target.value)} placeholder={t('keyPlaceholder')} />
          <small>{t(hasKey ? 'keySaved' : 'keyMissing')}</small></label>}
        <p className="full-width note">{t(isLocal ? 'localKeyHelp' : 'keyHelp')}</p>
        <div className="full-width actions">
          <button type="submit" className="primary">{t(busy === 'saving' ? 'saving' : 'save')}</button>
          <button type="button" onClick={() => save(true)}>{t(busy === 'testing' ? 'testing' : 'testConnection')}</button>
          {!isLocal && hasKey && <button type="button" className="danger" onClick={clearKey}>{t('clearKey')}</button>}
        </div>
      </fieldset>
    </form>
  </div>;
}
