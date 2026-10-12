/**
 * [INPUT]: 依赖 Rust get_settings / get_model_presets 与设置变更命令、i18n 文案目录
 * [OUTPUT]: 提供公开设置/原生预设视图、串行 runCommand/updateSettings、刷新与文案函数
 * [POS]: WebView 的单一设置入口；Rust 负责合并与持久化，凭据不进入共享状态
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { uiText, uiLocale } from '../data/i18n';

const StoreContext = createContext(null);

function publicSettings(value) {
  const { auth: _secret, ...model } = value.custom_model || {};
  return { ...value, custom_model: model };
}

export function StoreProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modelPresets, setModelPresets] = useState([]);
  const queue = useRef(Promise.resolve());

  // -------- 所有写入共享队列，后端返回值是唯一的新状态 --------
  const runCommand = useCallback((command, args = {}) => {
    const operation = queue.current.then(async () => {
      const result = await invoke(command, args);
      const next = result && typeof result === 'object' && 'translation_from' in result
        ? result
        : await invoke('get_settings');
      const visible = publicSettings(next);
      setSettings(visible);
      return visible;
    });
    queue.current = operation.catch(() => {});
    return operation;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await runCommand('get_settings');
      setError('');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setLoading(false);
    }
  }, [runCommand]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    let active = true;
    invoke('get_model_presets').then(value => { if (active) setModelPresets(value); })
      .catch(failure => { if (active) setError(String(failure)); });
    return () => { active = false; };
  }, []);

  const updateSettings = useCallback((patch) => runCommand('update_settings', { patch }), [runCommand]);
  const locale = uiLocale(settings?.ui_language);
  const t = (key) => uiText(locale, key);

  return <StoreContext.Provider value={{ settings, modelPresets, loading, error, refresh, updateSettings, runCommand, locale, t }}>
    {children}
  </StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore requires StoreProvider');
  return context;
}
