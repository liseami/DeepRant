/**
 * [INPUT]: 依赖 @tauri-apps/plugin-store 的 store.json；默认值对齐 Rust AppSettings
 * [OUTPUT]: 提供 settings 与 updateSettings。浅合并写入，不丢未改字段。
 * [POS]: 前端设置的读缓存。常用语与快捷键写路径走 invoke，再回写这里。
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { load } from '@tauri-apps/plugin-store';

const StoreContext = createContext(null);

const DEFAULT_SETTINGS = {
    translation_from: 'zh',
    translation_to: 'en',
    game_scene: 'dota2',
    translation_mode: 'toxic',
    daily_mode: false,
    model_type: 'custom',
    custom_model: {
        auth: '',
        api_url: 'https://api.deepseek.com/v1/chat/completions',
        model_name: 'deepseek-chat',
    },
    phrases: [],
    phrases_enabled: true,
    custom_scene_name: '',
    custom_scene_prompt: '',
    custom_glossary: '',
    ui_language: 'zh',
};

export function StoreProvider({ children }) {
    const [store, setStore] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initStore = async () => {
            try {
                const storeInstance = await load('store.json', {
                    autoSave: 100
                });
                setStore(storeInstance);
                // 获取存储的设置，如果没有则使用默认值
                const storedSettings = await storeInstance.get('settings');
                setSettings({ ...DEFAULT_SETTINGS, ...(storedSettings || {}) });
            } catch (error) {
                console.error('初始化 store 失败:', error);
            } finally {
                setLoading(false);
            }
        };
        initStore();
    }, []);

    const updateSettings = async (newSettings) => {
        if (!store) return;
        // 合并设置
        const updatedSettings = { ...DEFAULT_SETTINGS, ...settings, ...newSettings };
        try {
            await store.set('settings', updatedSettings);
            await store.save();
            const storedSettings = await store.get('settings');
            if (storedSettings) {
                setSettings(storedSettings);
            }
        } catch (error) {
            console.error('更新设置失败:', error);
        }
    };

    return (
        <StoreContext.Provider value={{ store, settings, updateSettings, loading }}>
            {children}
        </StoreContext.Provider>
    );
}

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore 必须在 StoreProvider 内部使用');
    }
    return context;
}; 