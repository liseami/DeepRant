/**
 * [INPUT]: 依赖 Cromma UI、公开服务标识及仅主窗口可用的 read_api_key 命令
 * [OUTPUT]: 提供可显隐的真实 Key 输入与 useApiKey 局部凭据读取状态
 * [POS]: 顶部首次配置与模型设置共用的凭据交互；切换服务清理旧值，Key 不进入共享设置或日志
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button, Input } from 'cromma-ui';
import { ShieldCheck } from 'cromma-ui/pika';
import { useStore } from './StoreProvider';

export function useApiKey(apiUrl, protocol, hasApiKey) {
  const serviceId = `${protocol || 'openai'}:${apiUrl || ''}`;
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ serviceId, value: '', reading: false, error: '' });

  useEffect(() => {
    let active = true;
    if (!hasApiKey) {
      setState({ serviceId, value: '', reading: false, error: '' });
      return () => { active = false; };
    }
    setState(current => ({ serviceId, value: current.serviceId === serviceId ? current.value : '', reading: true, error: '' }));
    invoke('read_api_key', { apiUrl, protocol: protocol || 'openai' })
      .then(value => { if (active) setState({ serviceId, value: value || '', reading: false, error: '' }); })
      .catch(failure => { if (active) setState(current => ({ ...current, reading: false, error: String(failure) })); });
    return () => { active = false; };
  }, [apiUrl, protocol, hasApiKey, revision, serviceId]);

  // -------- 同一渲染中隔离旧服务，避免 effect 执行前短暂展示或提交旧 Key --------
  const current = state.serviceId === serviceId ? state : { value: '', reading: Boolean(hasApiKey), error: '' };
  return {
    ...current,
    serviceId,
    setValue: value => setState({ serviceId, value, reading: false, error: '' }),
    reload: () => setRevision(value => value + 1),
  };
}

export default function ApiKeyField({ id, credential, hasApiKey, disabled = false, compact = false }) {
  const { t } = useStore();
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(false); }, [credential.serviceId]);

  return (
    <div className={compact ? 'min-w-0 flex-1 space-y-1.5' : 'space-y-2'}>
      <label htmlFor={id} className="block text-sm font-medium">{t('apiKey')}</label>
      <div className="flex min-w-0 items-center gap-2">
        <Input id={id} type={visible ? 'text' : 'password'} value={credential.value} size="medium" autoComplete="off" spellCheck="false"
          className="min-w-0 flex-1 font-mono" disabled={disabled || credential.reading}
          onChange={event => credential.setValue(event.target.value)} placeholder={t(credential.reading ? 'keyReading' : 'keyPlaceholder')}
          aria-describedby={`${id}-status`} />
        <Button type="button" variant="secondary" size="medium" className="shrink-0" disabled={disabled || credential.reading || !credential.value}
          aria-pressed={visible} aria-controls={id} onClick={() => setVisible(value => !value)}>{t(visible ? 'hideKey' : 'showKey')}</Button>
      </div>
      <p id={`${id}-status`} className="flex items-center gap-1.5 text-xs leading-relaxed text-muted-foreground" role={credential.error ? 'alert' : undefined}>
        <ShieldCheck size={14} aria-hidden="true" />{t(credential.error ? 'keyReadFailed' : credential.reading ? 'keyReading' : hasApiKey ? 'keySaved' : 'keyMissing')}
        {credential.error && <Button type="button" variant="ghost" size="small" disabled={disabled} onClick={credential.reload}>{t('retry')}</Button>}
      </p>
    </div>
  );
}
