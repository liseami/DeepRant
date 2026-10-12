/**
 * [INPUT]: 依赖已加载的模型设置、共享 Key 输入及 Rust 固定开放平台链接命令
 * [OUTPUT]: 提供官方 DeepSeek 缺 Key 时的全宽配置横幅，直接保存并前往开放平台
 * [POS]: 应用壳顶部的首次配置入口；仅补齐当前服务凭据，保留所有游戏与模型参数
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState } from 'react';
import { Button, Panel } from 'cromma-ui';
import { ArrowRight, ShieldCheck } from 'cromma-ui/pika';
import { invoke } from '@tauri-apps/api/core';
import { useStore } from './StoreProvider';
import ApiKeyField, { useApiKey } from './ApiKeyField';
import { showError, showSuccess } from '../utils/toast';

export default function ApiKeyBanner() {
  const { settings, loading, error, updateSettings, t } = useStore();
  const model = settings?.custom_model;
  const credential = useApiKey(model?.api_url, model?.protocol, false);
  const [saving, setSaving] = useState(false);
  if (loading || error || !model?.official_deepseek || model.has_api_key) return null;

  async function save(event) {
    event.preventDefault();
    if (!credential.value.trim()) return;
    setSaving(true);
    try {
      // -------- 凭据与此刻显示的服务一起提交，队列等待期间也不会写入另一家供应商 --------
      await updateSettings({ model_type: settings.model_type, custom_model: {
        api_url: model.api_url, model_name: model.model_name, protocol: model.protocol,
        reasoning_model: Boolean(model.reasoning_model), auth: credential.value.trim(),
      } });
      credential.setValue('');
      showSuccess(t('keySavedView'));
    } catch (failure) { showError(failure); }
    finally { setSaving(false); }
  }

  return (
    <Panel frame className="key-banner" role="region" aria-label={t('deepseekKeyTitle')}>
      <div className="key-banner-heading">
        <span className="flex items-center gap-2 text-base font-semibold"><ShieldCheck size={20} aria-hidden="true" />{t('deepseekKeyTitle')}</span>
        <p className="text-sm leading-relaxed text-muted-foreground">{t('deepseekKeyDescription')}</p>
      </div>
      <form className="key-banner-form" onSubmit={save}>
        <ApiKeyField id="banner-api-key" credential={credential} hasApiKey={false} disabled={saving} compact />
        <Button type="submit" variant="ink" size="medium" disabled={saving || !credential.value.trim()} loading={saving}>{t(saving ? 'saving' : 'saveKey')}</Button>
        <Button type="button" variant="secondary" size="medium" leftIcon={<ArrowRight size={16} aria-hidden="true" />}
          onClick={() => invoke('open_external_link', { id: 'deepseek-platform' }).catch(showError)}>{t('deepseekPlatform')}</Button>
      </form>
    </Panel>
  );
}
